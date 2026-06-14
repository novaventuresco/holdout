You are doing an App Store submission preflight for Craving Holdout: Urge Timer. Work through every
gate in order. Do not skip any item. For each gate, read the actual source file
or doc to verify — do not assume. Report PASS, FAIL, or ACTION REQUIRED for each.

---

## GATE 1 — Code Readiness

1. Read src/screens/HomeScreen.tsx line ~39.
   PASS if: DEV_UNLOCK_ALL_THEMES = false
   FAIL if: DEV_UNLOCK_ALL_THEMES = true (locks won't show — blocks submission)

2. Read src/components/ThemePackPaywall.tsx.
   PASS if: X close button has busy guard: onPress={busy ? undefined : onClose} + disabled={busy}
   PASS if: Modal has: onRequestClose={busy ? undefined : onClose}
   FAIL if: either guard is missing (user can be double-charged — C-01 class issue)

3. Read src/services/IAPService.ts.
   PASS if: isConnected = false is set BEFORE await iap.endConnection()
   FAIL if: isConnected = false is set after the await (M-03 structural race)

4. Check src/services/IAPService.ts for the StoreKit product ID constant.
   PASS if: product ID matches the one registered in App Store Connect
   ACTION REQUIRED if: cannot verify without App Store Connect access

5. Grep src/ for RECOMMITMENT_TIMEOUT_MS.
   PASS if: not found (dead code deleted 2026-04-04)
   FAIL if: found (merge regression — must be removed)

---

## GATE 2 — Build Configuration

6. Read app.json (EAS reads bundle ID from here, not eas.json).
   PASS if: ios.bundleIdentifier = com.novaventuresco.holdout
   FAIL if: bundle ID is wrong or missing

7. Confirm package.json exists at the project root.
   PASS if: present (required as EAS root marker)

8. Read package.json.
   PASS if: react-native-iap is present at version 14.7.x
   FAIL if: missing or wrong version

9. Grep src/ for: sk-, pk-, api_key, apiKey, secret, password, Bearer (case-insensitive).
   PASS if: no matches in source files
   FAIL if: any hardcoded credential found

---

## GATE 3 — IAP / StoreKit

10. Check docs/quality/handoff.md — is Sandbox IAP end-to-end testing listed as complete?
    Expected flows: paywall opens → Sandbox purchase → themes unlock → tapped theme auto-selected;
    restore purchase → unlocks; X close during purchase → button disabled.
    PASS if: handoff.md confirms Sandbox testing complete
    ACTION REQUIRED if: not confirmed — complete Sandbox testing before submission

11. App Store Connect product status — cannot verify directly.
    ACTION REQUIRED: Confirm in App Store Connect that the theme pack product has:
    - Status: Ready to Submit
    - Price: $4.99 tier
    - Product ID matching IAPService.ts

---

## GATE 4 — Landing Page URLs

12. Read these files and check for href="#" CTA placeholders:
    - assets/landing_page/index.html (nav CTA, hero button, footer — 3 links)
    - assets/landing_page/how-long-do-cravings-last/index.html (1 CTA link)
    - assets/landing_page/urge-surfing/index.html (1 CTA link)
    PASS if: all 5 hrefs point to the live App Store URL
    DEFERRED (first submission only) if: href="#" remains because the App Store URL does not
      exist yet — the binary does not embed these links so this does not block submission.
      ACTION REQUIRED: update all 5 hrefs and push to GitHub Pages immediately after the
      app is approved and the App Store URL is assigned.

---

## GATE 5 — App Store Copy

13. Read docs/store/app-store-copy.md.
    PASS if all of the following are present and final:
    - App Name: Craving Holdout: Urge Timer
    - Subtitle: ≤30 chars, present
    - Description: present (~250+ words)
    - Keywords: present (≤100 chars total)
    - Support URL: https://novaventuresco.github.io/holdout
    - Privacy Policy URL: https://novaventuresco.github.io/holdout/privacy
    ACTION REQUIRED: Confirm both URLs are entered in App Store Connect.

---

## GATE 6 — Privacy Manifest

14. Read plugins/withPrivacyManifest.js.
    PASS if: fs.copyFileSync(src, dest) is unconditional — no existsSync guard wrapping it
    FAIL if: existsSync guard present (silently skips manifest updates — H-01)

15. Read PrivacyInfo.xcprivacy at the project root (the plugin copies this into ios/ during EAS prebuild).
    PASS if: declares NSPrivacyAccessedAPICategoryFileTimestamp (C617.1)
           and NSPrivacyAccessedAPICategoryUserDefaults (CA92.1)
    NOTE: If App Store submission returns a SystemBootTime privacy warning,
    add NSPrivacyAccessedAPICategorySystemBootTime reason 35F9.1 (deferred L-02).

---

## GATE 7 — Screenshots

16. Confirm 5 device mockup screenshots are ready.
    Expected location: C:\Users\gbcoi\OneDrive\Documents\Apps\Holdout\screenshots\
    Expected: 5 mockups (FIRE hero, VOID, GLACIER, History, AURORA active)
    at 1320×2868 px in iPhone device frames.
    NOTE: Claude cannot verify file contents or dimensions.
    ACTION REQUIRED: Confirm 5 screenshot mockups are at the screenshots path and uploaded in App Store Connect.

---

## Final Summary

After completing all gates, output:

### Ship Preflight Summary
| # | Gate | Status |
|---|------|--------|
[One row per numbered item above]

Then:
- **All PASS:** Output "CLEAR TO SUBMIT. All gates passed."
- **Any FAIL:** List each failing item and the required fix. Do not submit until resolved.
- **ACTION REQUIRED items:** List separately. These require manual confirmation from you before the production build is triggered.
