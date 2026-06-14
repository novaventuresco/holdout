# Code Review — P3-05, P3-05a, P3-05b, P3-07

Date: 2026-04-26
Reviewer: /review skill
Scope: Privacy manifest + config plugin (P3-05b), Landing page + privacy policy (P3-05/P3-05a), StoreKit IAP wiring (P3-07)

---

## Files Reviewed

| File | Scope |
|------|-------|
| `PrivacyInfo.xcprivacy` | P3-05b — privacy manifest content |
| `plugins/withPrivacyManifest.js` | P3-05b — Expo config plugin |
| `app.json` | P3-05b — plugin registration |
| `src/services/IAPService.ts` | P3-07 — new IAP service |
| `src/components/ThemePackPaywall.tsx` | P3-07 — new paywall component |
| `src/screens/HomeScreen.tsx` | P3-07 — paywall integration |
| `package.json` | P3-07 — react-native-iap dependency |
| `Landing Page/index.html` | P3-05a — landing page HTML |
| `Landing Page/privacy/index.html` | P3-05 — privacy policy HTML |

**P3-05 / P3-05a (landing page + privacy policy):** Static HTML files. Not subject to RN animation, Reanimated, or memory-leak criteria. No code findings. Production checklist item only: 5 App Store CTA `href="#"` placeholders across landing page and both ASO articles need updating when the app goes live (per handoff).

---

## Findings

### C-01 — Critical | ThemePackPaywall: X close button not guarded while a purchase is in flight

**File:** `src/components/ThemePackPaywall.tsx:109–115`

The overlay backdrop is correctly guarded:
```tsx
<TouchableWithoutFeedback onPress={busy ? undefined : onClose} ...>
```
The X button in the header is not:
```tsx
<TouchableOpacity onPress={onClose} ...>  // no busy check
```

If the user taps UNLOCK, the iOS StoreKit sheet appears, and then taps X while the payment dialog is still in progress, the paywall unmounts. Cleanup fires `disconnectIAP()`, which rejects the pending promise. `purchaseThemePack` resolves as `'error'`. `handleBuy` hits `if (!mountedRef.current) return` and does nothing. The StoreKit transaction may already be in a pending/approved state on Apple's side. The orphan recovery in the next `connectIAP()` call will `finishTransaction` that orphan — but it will not call `onUnlock`. The user has been charged but is not unlocked. They would need to discover and manually use "Restore purchase."

**Fix:**
```tsx
<TouchableOpacity
  onPress={busy ? undefined : onClose}
  disabled={busy}
  ...
>
```

---

### H-01 — High | withPrivacyManifest: silently skips copy if destination file already exists

**File:** `plugins/withPrivacyManifest.js:13–15`

```js
if (!fs.existsSync(dest)) {
  fs.copyFileSync(src, dest);
}
```

Once `ios/Holdout/PrivacyInfo.xcprivacy` exists (after the first EAS prebuild), this condition is false on every subsequent prebuild. Any update to `PrivacyInfo.xcprivacy` at the project root is silently ignored. The EAS build ships the old version without error or warning.

Concrete consequence: Phase 4 requires adding a network domain entry for the Cloudflare Worker proxy (P4-09). If the developer updates the root manifest and runs an EAS build, the App Store will reject the submission because the shipped manifest is missing the new entry. This will be difficult to diagnose.

**Fix:** Always overwrite — remove the `existsSync` guard:
```js
fs.copyFileSync(src, dest);
```
The copy is deterministic (same source, same dest); overwriting is always safe and keeps source and destination in sync.

---

### M-01 — Medium | ThemePackPaywall: `onRequestClose` not guarded by `busy`

**File:** `src/components/ThemePackPaywall.tsx:98`

```tsx
<Modal ... onRequestClose={onClose}>
```

`onRequestClose` fires when the system dismisses the modal (hardware back button, accessibility Escape, external keyboard). This fires `onClose` unconditionally regardless of `busy` state. For an iPhone-only app in portrait mode, this is nearly unreachable in practice, but the consequence is the same class of issue as C-01 (paywall closes during active purchase, orphaned transaction).

**Fix:**
```tsx
onRequestClose={busy ? undefined : onClose}
```

---

### M-02 — Medium | HomeScreen: `DEV_UNLOCK_ALL_THEMES` is `false` — deviates from documented dev default

**File:** `src/screens/HomeScreen.tsx:39`

```ts
const DEV_UNLOCK_ALL_THEMES = false;
```

`patterns-build.md` documents `true` as the dev default:
> `true` is the dev default — everything available, all themes testable. Set to `false` to verify the locked UX.

With `false` in the dev client (before the EAS build that includes `react-native-iap`), tapping any premium swatch opens the paywall, `connectIAP()` silently fails (native module absent in dev-client binary), and the UI shows `$4.99` fallback with a non-functional buy button. Normal theme development and testing are blocked for premium themes.

`DEV_UNLOCK_ALL_THEMES` **must be `false`** in any TestFlight or production build. But during active development the flag should be `true`.

**Action:** Restore to `true` for dev work. Add explicit check to pre-EAS-build checklist: "set `DEV_UNLOCK_ALL_THEMES = false`."

---

### M-03 — Medium | IAPService: `isConnected` set to `false` after `await endConnection()`, not before

**File:** `src/services/IAPService.ts:311–314`

```ts
if (isConnected && iap) {
  try { await iap.endConnection(); } catch {}
  isConnected = false;  // ← set AFTER the await
}
```

During the `endConnection()` await, a concurrent call to `connectIAP()` would see `isConnected = true` and short-circuit (return early without reconnecting). `isConnected` is then set to `false` after `endConnection` completes, but the caller that short-circuited already returned — leaving the connection closed, `isConnected = false`, and no listeners set up. In practice this race cannot occur (mount and unmount are sequential), but the pattern is structurally fragile.

**Fix:** Set `isConnected = false` before the `endConnection()` call:
```ts
if (isConnected && iap) {
  isConnected = false;
  try { await iap.endConnection(); } catch {}
}
```

---

### M-04 — Medium | IAPService: module-level mutable state is an undocumented deviation from the services-are-stateless pattern

**File:** `src/services/IAPService.ts` (module-level variables, lines 33–44)

`patterns-build.md` states: "Services are stateless. All state lives in screens/components via hooks." `IAPService.ts` uses module-level singletons — a justified exception because IAP listeners must survive re-renders and the pending-promise correlation pattern requires a map that outlives any single component render. The comment at the top credits the DailyGoals project as the pattern origin but does not explicitly note the deviation.

**Action:** Add a one-line comment above the module-level state block noting the intentional exception to the stateless-service pattern and why.

---

### L-01 — Low | withPrivacyManifest: `withXcodeProject` used without modifying the pbxproj

**File:** `plugins/withPrivacyManifest.js`

`withXcodeProject` parses and re-serializes the full `.pbxproj` file. This plugin only copies a file and never touches `config.modResults`. `withDangerousMod` with the `ios` phase would perform the same file copy with less overhead and more accurately express intent. No functional impact.

---

### L-02 — Low | PrivacyInfo.xcprivacy: may need re-audit after react-native-iap is added

**File:** `PrivacyInfo.xcprivacy`

Current declared API categories: `FileTimestamp (C617.1)` and `UserDefaults (CA92.1)`. `react-native-iap` v14 uses StoreKit, which does not introduce additional required-reason API categories. However, StoreKit receipt validation or `SKAdNetwork` attribution may internally access system uptime (`NSPrivacyAccessedAPICategorySystemBootTime`). Apple's submission validation may flag this.

No immediate action. If App Store submission (P3-06) returns a privacy manifest warning, add `NSPrivacyAccessedAPICategorySystemBootTime` with reason `35F9.1`.

---

### L-03 — Low | IAPService: orphan recovery and restore finish all available purchases as non-consumable

**File:** `src/services/IAPService.ts:176–180, 288–291`

Both `connectIAP` (orphan recovery) and `restorePurchases` call `finishTransaction(..., isConsumable: false)` for all purchases returned by `getAvailablePurchases()`, regardless of product ID. Correct for a single-product app. If a consumable product is added in Phase 4, this would incorrectly acknowledge it as non-consumable, triggering App Store validation errors. Document as a known forward constraint.

---

## Summary Table

| ID | Severity | File | Issue |
|----|----------|------|-------|
| C-01 | Critical | `ThemePackPaywall.tsx:109` | X button not disabled during active purchase — user can be charged without unlock |
| H-01 | High | `withPrivacyManifest.js:13` | `existsSync` guard silently drops future manifest updates |
| M-01 | Medium | `ThemePackPaywall.tsx:98` | `onRequestClose` not guarded by `busy` |
| M-02 | Medium | `HomeScreen.tsx:39` | `DEV_UNLOCK_ALL_THEMES = false` — deviates from documented dev default |
| M-03 | Medium | `IAPService.ts:311` | `isConnected = false` set after `await endConnection()` — structural race |
| M-04 | Medium | `IAPService.ts` (module-level) | Stateful service — undocumented deviation from patterns |
| L-01 | Low | `withPrivacyManifest.js` | `withXcodeProject` unnecessary — `withDangerousMod` appropriate |
| L-02 | Low | `PrivacyInfo.xcprivacy` | May need re-audit after react-native-iap; `SystemBootTime` possibly missing |
| L-03 | Low | `IAPService.ts:176, 288` | All purchases finished as non-consumable — future trap if consumable added |

---

## Animation / Performance / Reanimated

No Reanimated SharedValues, worklets, or shader uniforms in the reviewed files. `ThemePackPaywall` and `IAPService` are pure JS/React — no animation concerns. `HomeScreen` modifications are UI state only. No 60fps risk introduced.

---

## Memory Leaks

`ThemePackPaywall.useEffect` correctly sets `mountedRef.current = false` and calls `disconnectIAP()` in cleanup. All `pendingPurchases` entries are cleared and all subscriptions removed in `disconnectIAP`. The 60-second purchase timeout is cleared in all resolution paths (success, cancel, error, disconnect). No leaks identified.

---

## Pre-EAS-Build Checklist additions from this review

- [ ] `DEV_UNLOCK_ALL_THEMES = false` in `HomeScreen.tsx` (M-02)
- [ ] Verify `ios/Holdout/PrivacyInfo.xcprivacy` is current after fixing H-01 (`npx expo prebuild --platform ios --clean`)
- [ ] Update App Store CTA `href="#"` in 5 places across landing page + ASO articles
- [ ] If App Store submission returns privacy manifest warning, add `SystemBootTime` entry (L-02)

---

## Fix Priority Before TestFlight (P3-03)

**Must fix:** C-01, H-01
**Should fix:** M-01, M-02, M-03
**Defer to P3-06 or P4:** M-04, L-01, L-02, L-03

---

## Resolution Status (confirmed 2026-04-28)

All C/H/M findings were applied to the codebase during the same 2026-04-26 session that produced this review. Confirmed by code inspection 2026-04-28:

| ID | Resolution |
|----|-----------|
| C-01 | Fixed — `onPress={busy ? undefined : onClose}` + `disabled={busy}` present in ThemePackPaywall header close button |
| H-01 | Fixed — `existsSync` guard removed; `fs.copyFileSync(src, dest)` is unconditional |
| M-01 | Fixed — `onRequestClose={busy ? undefined : onClose}` present on Modal |
| M-02 | No action — `DEV_UNLOCK_ALL_THEMES = false` is correct for production; flag is already set for the upcoming App Store build |
| M-03 | Fixed — `isConnected = false` set before `await iap.endConnection()` |
| M-04 | Fixed — 3-line comment above module-level state block documents intentional exception to stateless pattern |
| L-01 | Deferred — `withXcodeProject` → `withDangerousMod` refactor; no functional impact |
| L-02 | Deferred to P3-06 — re-audit only if App Store submission returns a privacy manifest warning |
| L-03 | Deferred to P4 — forward constraint only if a consumable product is added |

New EAS device build done 2026-04-28 (includes react-native-iap native module). Device testing in progress.
