# Holdout — Build & Service Patterns

## Development Workflow

### Daily Iteration (expo-dev-client — replaces Expo Go for BattleVisual work)
BattleVisual now uses `@shopify/react-native-skia`, which requires a native build.
One EAS adhoc build (with `developmentClient: true`) installs the custom dev client. After that:

```bash
npx expo start            # Standard daily start — no --clear needed
# Scan QR with the Holdout dev client app (NOT Expo Go)
# If changes not reflecting: npx expo start --clear
# JS and shader changes hot-reload instantly — no new native build needed
# If 127.0.0.1 connection error: use npx expo start --lan instead
# Phone and PC must be on the same WiFi network
```

SKSL shader code lives in a JS string constant. Editing the shader hot-reloads
in the dev client exactly like any JS change would in Expo Go.

### Daily Iteration (Expo Go — NOT usable for Holdout)

Expo Go cannot be used for any part of this project. `BattleScreen` imports `BattleVisual`
which imports `@shopify/react-native-skia`. Metro bundles all static imports at startup —
the Skia native module registration happens before any screen renders. If the Skia native
module is absent (Expo Go), the app crashes on launch with `Exception in HostFunction: <unknown>`
regardless of which screen the user navigates to.

All development must use the installed expo-dev-client app (scan QR from `npx expo start`).

### Device Testing (EAS Adhoc Build)
```bash
eas build --platform ios --profile adhoc
# Takes 15-20 min. EAS provides QR/link to install.
```

Use the adhoc build for the 16-item Phase 1 sign-off checklist in `tests/validation-scenarios.md`.

### Build Options Summary

| Task | Use this |
|------|----------|
| BattleVisual / shader tuning | `npx expo start` → scan QR with `device` dev-client (instant hot-reload) |
| Other screen / logic changes | `npx expo start` → scan QR with `device` dev-client |
| Final standalone device test | `eas build --profile adhoc` (baked JS bundle, no Metro needed) |
| App Store submission | `eas build --profile production` then `eas submit --platform ios --latest` — build and submit are separate steps; build creates the .ipa, submit uploads it to App Store Connect |
| Real-device dev-client install | `eas build --profile device` — installs dev-client with hot-reload on physical device. Rebuild whenever a new native package is added (Skia, RNGH, etc.). |
| iOS Simulator work | `eas build --profile development` (simulator: true) |

### DEV_UNLOCK_ALL_THEMES — simulating IAP state without code changes

Use a named boolean constant at the top of the feature file to toggle between "all features unlocked" and "locked user experience" without commenting/uncommenting blocks:

```ts
// DEV: true = all themes unlocked for testing; false = simulate a user who has not purchased anything
const DEV_UNLOCK_ALL_THEMES = false;

function isUnlocked(id: VisualTheme, prefs: Preferences | null): boolean {
  if (DEV_UNLOCK_ALL_THEMES) return true;
  if (FREE_THEMES.includes(id)) return true;
  return prefs?.unlockedThemes?.includes(id) ?? false;
}
```

`true` is the dev default — everything available, all themes testable without a live IAP connection. Set to `false` to verify the locked UX: lock icons appear on premium swatches, paywall opens on tap. **Must be `false` before any TestFlight or production build.** Add to the pre-submission checklist.

This follows the same pattern as BattleScreen's inline `DEV RESET` comment for re-triggering first-use instructions. Prefer named boolean constants over commented-out code blocks — the intent is explicit and the toggle is one character.

---

### IAPService — module-level state (intentional exception to stateless service rule)

`src/services/IAPService.ts` uses module-level variables for connection state, listeners,
and the pending-purchase map. This is an intentional exception to the "services are stateless"
pattern:

```ts
let isConnected = false;
let purchaseUpdateSubscription: EmitterSub | null = null;
const pendingPurchases = new Map<string, { resolve, reject, timeout, requestStartedAt }>();
```

**Why:** StoreKit connection lifecycle is per-app-launch, not per-component. Disconnecting and
reconnecting on every paywall mount would reset the listener pipeline and could orphan an
in-flight transaction. A module-level map is the correct scope — it persists across component
mounts within a single app session but resets on process restart (clean state on relaunch).

**Lazy load:** `import('react-native-iap')` is deferred via dynamic `import()` in try/catch.
No expo-constants Expo Go check needed — this project never runs in Expo Go (react-native-skia
crashes it on launch regardless). Lazy import prevents crashing on environments where the native
module is absent (iOS Simulator without StoreKit config).

**Orphan recovery:** `connectIAP()` calls `getAvailablePurchases()` on every connection and
calls `finishTransaction({ isConsumable: false })` on all results. This clears any transaction
started but not finished in a prior app run (crash mid-purchase).

**Pending-promise map pattern:**

```ts
pendingPurchases.set(productId, {
  resolve: (result: 'success' | 'cancelled') => void,
  reject: (error: Error) => void,
  timeout: setTimeout(() => resolve('error'), 60_000),
  requestStartedAt: Date.now(),
});
```

`purchaseUpdatedListener` fires on the same productId, checks `requestStartedAt` against
`purchase.transactionDate` (stale replay filter: ±20s tolerance), then calls `resolve('success')`
or `reject`. The 60-second timeout prevents UI hanging if the native bridge stalls.

**v14 API differences from older versions:**

| Field | v14 | Older |
|-------|-----|-------|
| Product identifier | `.id` | `.productId` |
| Formatted price | `.displayPrice` | `.localizedPrice` |
| Purchase request | requires `type: 'in-app'` | `type` not required |
| Error cancel code | `ErrorCode` enum, string value `'user-cancelled'` | `responseCode` numeric |

**User-cancel detection:** `isUserCancel()` converts `error.code` to string and checks for
`'user-cancelled'`, `'E_USER_CANCELLED'`, `'E_USER_CANCELED'`, `'user-canceled'`, plus
`message.includes('cancel')` as a fallback. The double-settle guard checks `pendingPurchases.has()`
before acting in both the error listener and the `requestPurchase().catch()` handler.

---

## State Management

**Services are stateless.** All state lives in screens/components via hooks.

```
SessionService.startSession()         — creates record, returns sessionId
SessionService.completeSession(id, priorDurationMs?) — marks won, sets endTime + cumulative duration
SessionService.abandonSession(id, priorDurationMs?)  — marks gaveIn, sets endTime + cumulative duration
SessionService.recordMilestone()      — increments milestonesReached on record
SessionService.getActiveSession()     — returns any session with no result (crash recovery)
StreakService.getCurrentStreak()      — pure function over SessionRecord[]
StreakService.getBestStreak()         — all-time highest consecutive wins
StreakService.calculateWinRate()      — won / total as integer percent
CoachService.getStartMessage()              — random from start pool
CoachService.getRecommitmentMessage()       — random from pool for given minute mark
CoachService.getWinMessage()               — random from win pool
CoachService.getCoachMessageForElapsed()   — time-aware on-demand message (SUPPORT ME button)
```

**Screens hold state via hooks.** Example (BattleScreen):
```ts
const sessionProgress = useSharedValue(0); // Reanimated SharedValue — NOT React state
const [sessionId, setSessionId] = useState<string | null>(null);
```

**Services never hold state.** No singletons, no class instances with state.

### Session-behavioral signal via useRef counter

When a service function needs to vary its output based on in-session behavior (e.g. "has the
user already tapped this button?"), track the count in a plain `useRef` in the screen component
and pass it as a parameter. Do NOT move the counter into the service — services are stateless.

```ts
// BattleScreen — track SUPPORT ME taps for first vs. repeat coach tier
const supportMeTapCountRef = useRef(0);

function handleCoachTap() {
  const isRepeat = supportMeTapCountRef.current > 0;
  supportMeTapCountRef.current += 1;
  setCoachLine(getCoachMessageForElapsed(elapsed, isRepeat));
}
```

The ref starts at 0 on every mount (fresh session). No cleanup needed — it holds a primitive.
Read `isRepeat` BEFORE incrementing so the first tap correctly receives `false`.

---

## Storage Pattern (AsyncStorage)

### Key naming convention

```
sessions                  → JSON array of all session records
preferences               → JSON object with onboarding prefs
```

### Session record shape

```typescript
interface Session {
  id: string;              // "${Date.now()}-${random base36}" — not UUID format
  startTime: number;       // Unix timestamp (ms)
  endTime: number;         // Unix timestamp (ms)
  result: 'won' | 'gaveIn';
  duration: number;        // ms
  milestonesReached: number; // count of silent milestones fired (0–4)
}
```

### Preferences shape

```typescript
interface Preferences {
  onboardingComplete: boolean;
  visualTheme?: 'fire' | 'void' | 'ember' | 'glacier' | 'abyss' | 'solar' | 'aurora' | 'dusk' | 'nebula';
  seenPassiveInstruction?: boolean;     // true after first session (P2-06)
  seenActiveInstruction?: boolean;      // true after first ACTIVE toggle (P2-06)
  lastSessionResult?: 'won' | 'gaveIn'; // P2-16: set by BattleScreen, read once by HomeScreen, then cleared
  unlockedThemes?: VisualTheme[];       // P3-07 IAP: set to PREMIUM_THEMES on unlock; undefined = no purchase
}
```

### Storage wrappers

```js
// src/storage/sessions.js
export async function saveSession(session) { ... }
export async function getSessions() { ... }
export async function updateSession(id, updates) { ... }
export async function deleteSession(id) { ... }  // silent cancel — removes record entirely

// src/storage/preferences.js
export async function savePreferences(prefs) { ... }
export async function getPreferences() { ... }
```

### GO AGAIN — priorElapsedMs cumulative duration chaining

When the user taps GO AGAIN in `wonComplete`, the current session is cancelled (not recorded) and
a fresh `Battle` screen is launched via `navigation.replace`. To preserve cumulative held time
across chained sessions, `priorElapsedMs` is threaded via route params:

```ts
// handleGoAgain in BattleScreen
navigation.replace('Battle', {
  priorElapsedMs: priorElapsedMsRef.current + SESSION_DURATION_MS,
});

// Fresh BattleScreen reads it on mount
const route = useRoute<BattleRoute>();
const priorElapsedMsRef = useRef<number>(route.params?.priorElapsedMs ?? 0);

// Passed to completeSession / abandonSession at outcome
completeSession(sessionIdRef.current, priorElapsedMsRef.current);
abandonSession(sessionIdRef.current, priorElapsedMsRef.current);
```

The `priorDurationMs` parameter is added to `endTime - session.startTime` in SessionService,
so a session won after two 20-min chains records `duration = 40 * 60 * 1000`. HistoryScreen
already caps bar width at `Math.min(100, ...)` — sessions over 20 min display as full bar.

**Chaining is correct for N sessions:** each replacement adds `SESSION_DURATION_MS` to
`priorElapsedMsRef.current`, so 3+ chains accumulate correctly.

**Crash behavior:** The fresh session record stays `active` (no result) until DONE is tapped.
A crash in `won`/`wonComplete` leaves an orphan — orphan recovery marks it `gaveIn` on next
launch (intentional; no implicit win without explicit DONE tap).

---

### Silent cancel (Go Back) — deleteSession and cancelSession

Go Back is a no-record exit: the session is deleted entirely, not marked `gaveIn`. No streak
impact. Crash recovery (`getActiveSession`) will not find it on the next launch.

```ts
// SessionService — thin wrapper
export async function cancelSession(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}

// BattleScreen — Go Back handler
if (sessionIdRef.current) {
  cancelSession(sessionIdRef.current); // fire-and-forget
  sessionIdRef.current = null;         // null BEFORE goBack — prevents unmount cleanup
                                       // from calling abandonSession on the deleted record
}
navigation.goBack();
```

`deleteSession` sets `_cache = filtered` eagerly (before the AsyncStorage write completes)
because the filtered result is already computed in memory and `handleGoAgain` calls
`cancelSession` fire-and-forget then immediately fires `navigation.replace` — the new screen's
`init()` must see the deletion even if the write is still in flight. If the write fails, the
catch block sets `_cache = null` to force a re-read on the next call. All other write
operations set `_cache = null` unconditionally; delete is the exception because the post-delete
array is already known in the success path.

### prefsRef — carrying loaded prefs into button handlers

Preferences are loaded async in `init()` (a `useEffect`). Button handlers like
`handleModeToggle` run synchronously and cannot call `getPreferences()` themselves.
Store the loaded prefs in a `useRef` immediately after the async read, then read from
the ref in any handler that needs to check or update prefs.

```ts
const prefsRef = useRef<Preferences | null>(null);

// in init():
const prefs = await getPreferences();
prefsRef.current = prefs;
// ...after a flag-triggered save, keep ref in sync:
const updated: Preferences = { ...prefs!, someFlag: true };
savePreferences(updated); // fire-and-forget
prefsRef.current = updated;

// in a button handler:
if (!prefsRef.current?.someFlag) {
  // show first-use content
}
```

Do NOT add React state for flags that only need to be read in handlers (not rendered).
State causes re-renders; a ref is sufficient and cheaper.

---

### prefsRef not synced after fire-and-forget save — stale ref trap (R-04, Session 27)
**What happened:** `handleWon()` and `handleGaveIn()` called `savePreferences({ ...prefsRef.current, lastSessionResult: 'won' })` as fire-and-forget without updating `prefsRef.current`. Any code reading `prefsRef.current` after the save would silently see the pre-save state.
**Fix:**
```ts
const updated = { ...prefsRef.current, lastSessionResult: 'won' as const };
savePreferences(updated); // fire-and-forget
prefsRef.current = updated; // ← keep ref in sync
```
**Rule:** Already stated in the `prefsRef` pattern above — every flag-triggered save must update the ref. This mistake demonstrates the consequence of the omission. The bug was zero-impact at the time (nothing reads `lastSessionResult` from `prefsRef` in BattleScreen) but is a structural trap for any future code added after a win/gave-in handler.

---

**OnboardingScreen — save-once pattern:**
`savePreferences` replaces the entire `Preferences` object. Do NOT call it after each
onboarding screen. Accumulate all fields (`onboardingComplete` + any preference fields
collected during onboarding) in local component state, then call `savePreferences` exactly
once at the end of the final onboarding screen with the complete object.
Calling it incrementally risks a partial save if the user quits mid-onboarding —
`onboardingComplete` would be false (never set) but other fields might already be
written, creating a half-saved state on the next launch.

---

## FlatList Pattern

### renderItem must be stable — wrap in useCallback

Inline `renderItem` arrow functions create a new function reference on every render of the parent screen. FlatList compares `renderItem` by reference — a new reference causes all visible rows to re-render even when data is unchanged.

```ts
// Wrong — new function reference on every render
<FlatList renderItem={({ item }) => <SessionRow session={item} />} />

// Correct — stable reference, FlatList can bail out
const renderSession = useCallback<ListRenderItem<Session>>(
  ({ item }) => <SessionRow session={item} />,
  []
);
<FlatList renderItem={renderSession} />
```

### Row components must be defined at module scope

Define row components (`SessionRow`, etc.) outside the screen component. A component defined inside a render function is a new type identity on every render — React unmounts and remounts every row on every screen re-render.

---

## useFocusEffect Async Load Pattern

```ts
useFocusEffect(
  useCallback(() => {
    let mounted = true;
    const load = async () => {
      const data = await getSessions();
      if (!mounted) return;           // guard before every setState
      setData(data);
    };
    load();
    return () => { mounted = false; }; // cleanup cancels in-flight
  }, [])
);
```

Required for any async function inside `useFocusEffect` that calls `setState` after an `await`. Bottom tabs keep screens alive once visited — without the guard, a fast tab-switch during an AsyncStorage read fires setState on a screen that is no longer the active view. BattleScreen's `init()` uses the same pattern.

---

## Shared Constants Pattern

Import exported constants — never redefine locally.

```ts
// Wrong — silent sync risk if source value changes
const SESSION_DURATION_MS = 20 * 60 * 1000; // "must match timing.ts"

// Correct — single source of truth
import { SESSION_DURATION_MS } from '../constants/timing';
```

If the value ever changes at the source and local copies are not updated, calculated values (bar widths, progress percentages) silently diverge with no compile or runtime error.

---

## App State / Crash Recovery Pattern

### App backgrounded mid-session
Timer uses wall clock (`Date.now()` - `startTime`), so it self-corrects on foreground return. No special handling needed beyond recalculating elapsed time.

No gave-in on background return — recalculate elapsed time and resume. GAVE IN is explicit only.

### App killed mid-session
On launch, call `getActiveSession()`. If any unfinished session exists (no result, any age), delete it via `cancelSession` — no history entry, no streak impact.

```ts
// App.tsx — init() block
const orphan = await getActiveSession();
if (orphan) {
  await cancelSession(orphan.id); // silent delete — crash/kill is not a voluntary gave-in
}
```

A crash or OS kill is not a voluntary decision. `abandonSession` (gaveIn) would penalise the user for something outside their control. `cancelSession` → `deleteSession` removes the record entirely — identical to the Go Back silent-cancel path. Recovery is indistinguishable from "never started."

---

## Common Build Mistakes & Fixes

**[2026-03-26] Reanimated 4.x does not use app.json config plugin — remove it**
Expo SDK 54.0.33 installs `react-native-reanimated@4.1.1`. Reanimated 4 dropped the `app.plugin.js` config plugin — it uses `react-native-worklets` internally. If `"react-native-reanimated"` is left in the app.json `plugins` array, Metro fails to start with a `PluginError`. Fix: remove the entry from app.json plugins.
The `react-native-reanimated/plugin` entry in `babel.config.js` IS still required for worklet transformation — keep it. Only the app.json entry must be removed.
Status: FIXED (removed from app.json, kept in babel.config.js).

**[2026-03-26] `babel-preset-expo` must be installed explicitly**
After a clean install (`npm install` → `npx expo install [deps]`), Expo Go showed `Error: Cannot find module 'babel-preset-expo'`. babel-preset-expo is referenced in babel.config.js but is not automatically pulled in as a transitive dep during clean installs. Fix: `npx expo install babel-preset-expo`.
Always include `babel-preset-expo` when doing a clean install.
Status: FIXED.

**[2026-03-28] react-native-worklets version mismatch crashes Expo Go on launch**
`react-native-reanimated@4.1.1` resolves `react-native-worklets@0.8.1` via npm. Expo Go SDK 54 bundles `react-native-worklets@0.5.1` natively. The version mismatch causes `Exception in HostFunction: <unknown>` on launch.
Diagnosis: `cat node_modules/expo/bundledNativeModules.json | grep worklet`
Fix: add `"overrides": { "react-native-worklets": "0.5.1" }` to `package.json`, then `npm install`.
On any Expo SDK upgrade, re-check `bundledNativeModules.json` and update the override.
Status: FIXED.

**[2026-03-28] react-native-linear-gradient not bundled in Expo Go**
Fix: `npx expo install expo-linear-gradient`. Change import to `import { LinearGradient } from 'expo-linear-gradient'`. Props API is identical.
Status: FIXED.

**[2026-03-28] Windows ENOTEMPTY during react-native-skia install corrupts the package**
Symptom: Metro bundling fails with `Unable to resolve "./skia"`.
Fix: clean reinstall of just the skia package, then clear Metro cache:
```
Remove-Item -Recurse -Force node_modules\@shopify\react-native-skia
npm install
npx expo start --clear
```
Status: FIXED.

**[2026-03-28] Dev client connects to 127.0.0.1 instead of PC**
Fix: `npx expo start --clear` clears the cached URL. If it persists: `npx expo start --lan`.
Status: FIXED.

**[2026-03-28] EAS `development` profile has `simulator: true` — won't install on physical device**
Fix: use `--profile adhoc` for physical device install. The adhoc profile has correct provisioning.
Status: FIXED.

**[2026-03-26] Clean install process after SDK version changes**
Full clean install required — never mix versions in-place:
```bash
rm -rf node_modules package-lock.json
npm install
npx expo install react-native react @react-navigation/native @react-navigation/native-stack react-native-screens react-native-safe-area-context @react-native-async-storage/async-storage react-native-reanimated expo-linear-gradient typescript @types/react babel-preset-expo
```
Status: FIXED.

**[2026-03-24] `main` field in package.json must be `"index.js"` (not `"expo-router"`)**
Holdout uses bare navigation (react-navigation), not Expo Router. `"main": "index.js"` is correct. EAS uses this as the entry point.

**[2026-03-24] `UIRequiresFullScreen: true` required for iOS 16+ portrait-only apps**
Without it, iOS 16+ silently rejects ad-hoc installs. Must be in `app.json` infoPlist.

**[2026-04-18] `expo-system-ui` native module not compiled into dev client binary**
`npx expo install expo-system-ui` adds the JS package to package.json but does NOT compile the native module into the currently running dev client binary. Calling `SystemUI.setBackgroundColorAsync()` throws `Cannot find native module 'ExpoSystemUI'` synchronously — `.catch()` does NOT suppress it (the error fires before any promise is created). Fix: remove the call from App.tsx until `eas build --platform ios --profile device` recompiles the binary with expo-system-ui included. After the EAS rebuild, add back:
```ts
import * as SystemUI from 'expo-system-ui';
// in App component:
useEffect(() => { SystemUI.setBackgroundColorAsync(COLORS.BACKGROUND); }, []);
```
Rule: any Expo first-party package installed via `npx expo install` after the last EAS device build requires a new EAS build before its native module calls work.
Status: FIXED pending EAS rebuild.

**[2026-04-18] `sceneContainerStyle` on Tab.Navigator sets tab screen container backgrounds**
`Tab.Navigator`'s `screenOptions.sceneContainerStyle` controls the View background of each tab screen container. Without it, tab screens mount with a white container — visible as a white flash when a tab screen first mounts or during tab switches. Fix: add `sceneContainerStyle: { backgroundColor: COLORS.BACKGROUND }` to Tab.Navigator's `screenOptions`. This is a pure JS change that hot-reloads immediately.
**Scope:** covers tab screen containers only (Home, History). Does NOT cover native stack card transitions (Settings push, Battle modal) — those require `SystemUI.setBackgroundColorAsync` at the native layer.
Status: FIXED.

**[2026-04-24] Separate per-button double-tap guards do not cross-check — use a shared outcomeFiredRef**
BattleScreen's `wonComplete` and `resumePrompt` states have multiple terminal-outcome buttons. The naive approach — a separate ref per button (`doneFiredRef`, `goAgainFiredRef`) — prevents double-tapping the *same* button but allows cross-button double-fire: tapping DONE then immediately GO AGAIN finds each button's guard still false. Both handlers run: `completeSession` + `cancelSession` on the same session; `goBack` + `replace` on the navigation stack simultaneously.
Fix: single `outcomeFiredRef = useRef(false)` checked and set by all terminal-outcome handlers.
Rule: when multiple buttons in the same UI state lead to mutually exclusive terminal outcomes (navigate away, record session, replace screen), guard them with one shared ref — not per-button refs.
Status: FIXED (2026-04-24).

**[2026-04-24] Moving deleteSession's eager _cache set after the write breaks GO AGAIN race safety**
`deleteSession` sets `_cache = filtered` *before* the AsyncStorage write. This is intentional: `handleGoAgain` calls `cancelSession` fire-and-forget then immediately calls `navigation.replace`. The new screen's `init()` calls `getSessions()` via `startSession()` before the write can complete. If `_cache` is not already updated, `getSessions()` falls through to a live AsyncStorage read, finds the un-deleted record, and `startSession()` returns the old session ID instead of creating a fresh one.
The "clean" fix of moving the cache set after the write removes this guarantee. The correct approach: keep the eager set; add `_cache = null` in the catch block so a write failure forces a re-read.
Rule: `deleteSession` is the only write that sets `_cache = filtered` directly (not null) because the post-delete array is already known and must be visible to any concurrent `getSessions()` call. Do not reorder this without understanding the GO AGAIN navigation-replace race.
Status: Race confirmed 2026-04-24; pattern locked.

**[2026-04-24] Confirm timer ref overwritten without clearing — orphaned timeout fires unexpectedly**
In BattleScreen's confirm handlers (`handleGaveInTap`, `handleEarlyWinTap`, `handleGoBackTap`), the first-tap (`!confirming*`) branch sets a new timeout via `ref.current = setTimeout(...)`. A rapid re-tap before the state update commits sees `confirming*` still false, sets a second timeout, and overwrites `ref.current`. The first timeout is orphaned — it fires later and clears the confirmation state at the wrong moment.
Fix: `clearTimeout(ref.current)` before setting a new timeout in the first-tap branch:
```ts
if (ref.current !== null) { clearTimeout(ref.current); ref.current = null; }
ref.current = setTimeout(..., 3000);
```
Rule: always clear a timer ref before reassigning it, even when expected to be null — rapid re-taps can reach the same branch twice in one render cycle.
Status: FIXED (2026-04-24).

**[2026-04-24] PrivacyInfo.xcprivacy — Expo config plugin approach and known gap**
Required for all apps targeting iOS 17+ (App Store enforcement since Spring 2024). Place
`PrivacyInfo.xcprivacy` at the project root and copy it into `ios/<ProjectName>/` during EAS
prebuild via an Expo config plugin using the `withXcodeProject` hook:

```js
// plugins/withPrivacyManifest.js
const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withPrivacyManifest(config) {
  return withXcodeProject(config, (config) => {
    const src = path.join(config.modRequest.projectRoot, 'PrivacyInfo.xcprivacy');
    const dest = path.join(config.modRequest.projectRoot, 'ios',
      config.modRequest.projectName, 'PrivacyInfo.xcprivacy');
    fs.copyFileSync(src, dest);  // always overwrite — existsSync guard silently drops updates (H-01)
    return config;
  });
};
```

Register in `app.json`: `"plugins": ["expo-dev-client", "./plugins/withPrivacyManifest"]`

**Known gap:** The file copy approach does NOT add the file to Xcode's `.pbxproj` resource
references. In Xcode 15+ with React Native 0.76+ (Expo SDK 54+), Xcode has native privacy
manifest support and typically auto-includes `.xcprivacy` files found in the target directory.
If App Store submission returns a privacy manifest error, extend the plugin to also call
`xcodeProject.addResourceFile('PrivacyInfo.xcprivacy', ...)` via the `xcode` npm package API.

**Verification:** Run `npx expo prebuild --platform ios --clean` and confirm
`ios/Holdout/PrivacyInfo.xcprivacy` exists with correct content. Cannot be tested via
`npx expo start` — native build only. Check before the production EAS submission (P3-06).

**Phase 4 note:** If a network domain is added (P4-09 Cloudflare Worker proxy), the manifest
may need a network domain entry under `NSPrivacyAccessedAPITypes`. Review at P4-09 time.
Status: DONE 2026-04-24. Takes effect on next EAS build.

**[2026-04-28] NSMotionUsageDescription causes Motion & Fitness prompt during StoreKit purchase — remove it**
expo-sensors adds `NSMotionUsageDescription` to Info.plist because it ships Pedometer APIs alongside the
gyroscope. `CMDeviceMotion` (what SpatialBalance uses for active mode) does NOT require this permission —
only `CMMotionActivityManager` (step counting / activity recognition) does. StoreKit's fraud detection
internally accesses `CMMotionActivityManager` during a purchase — if the key is present in Info.plist,
iOS shows the Motion & Fitness permission dialog mid-purchase, even though the app code never calls
`CMMotionActivityManager` directly.
Fix: do NOT add `NSMotionUsageDescription` to `app.json` infoPlist unless the app directly calls
`CMMotionActivityManager` or `CMPedometer`. Removing the key eliminates the prompt; the gyroscope and
StoreKit purchase both work unchanged. `PrivacyInfo.xcprivacy` needs no change — Apple's own frameworks
(StoreKit) handle their own privacy declarations; the app is not responsible for declaring APIs they
access internally.
Rule: presence of `NSMotionUsageDescription` in Info.plist is what triggers the prompt, not the
gyroscope usage itself. Keep the key absent unless step-counting APIs are explicitly used.
Status: FIXED 2026-04-28 — removed from app.json; takes effect in production build.

**[2026-04-24] Session duration can be negative when system clock adjusts backward**
`completeSession` and `abandonSession` compute `endTime - session.startTime`. iOS can adjust the system clock (NTP correction, DST change, manual change) between session start and end. A backward adjustment produces a negative duration, corrupting HistoryScreen bar widths and streak calculations.
Fix: `Math.max(0, endTime - session.startTime)` in both `completeSession` and `abandonSession` (SessionService.ts).
Status: FIXED (2026-04-24).
