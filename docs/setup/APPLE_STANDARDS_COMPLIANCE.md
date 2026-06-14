# Holdout — Apple App Store Compliance

**Status:** Phase 3 prep (submission not yet started)
Last updated: 2026-04-24

---

## Summary

| Item | Status |
|------|--------|
| Bundle ID | DONE — `com.novaventuresco.holdout` |
| iOS deployment target | DONE — 15.0 |
| Portrait-only | DONE — `orientation: portrait`, `supportsTablet: false` |
| Export compliance | DONE — `ITSAppUsesNonExemptEncryption: false` |
| Full-screen (no status bar conflict) | DONE — `UIRequiresFullScreen: true` |
| Gyroscope usage description | DONE |
| Privacy manifest (PrivacyInfo.xcprivacy) | DONE — 2026-04-24 (takes effect on next EAS build) |
| App icon (1024×1024) | DONE — 2026-04-18 |
| Splash screen | DONE — 2026-04-18 |
| Landing webpage | PENDING — hosts privacy policy + support URL |
| Privacy policy | PENDING — hosted on landing page |
| App Store Connect metadata | PENDING |
| Screenshots (iPhone 6.9") | PENDING |

---

## What's Already in app.json

```json
{
  "orientation": "portrait",
  "platforms": ["ios"],
  "ios": {
    "bundleIdentifier": "com.novaventuresco.holdout",
    "buildNumber": "1",
    "deploymentTarget": "15.0",
    "supportsTablet": false,
    "infoPlist": {
      "ITSAppUsesNonExemptEncryption": false,
      "UIRequiresFullScreen": true
    }
  }
}
```

---

## Pending Items

### 1. Gyroscope Usage Description — DONE

Added to `app.json` under `ios.infoPlist`:

```json
"NSMotionUsageDescription": "Holdout uses the gyroscope to let you physically hold the orb steady during a session."
```

Will take effect on next EAS build (native Info.plist change).

### 2. Privacy Manifest (PrivacyInfo.xcprivacy)

Required for all apps targeting iOS 17+ (Apple enforced Spring 2024).
Holdout's data profile is very clean: no tracking, no analytics, no network (V1), local storage only.

Create `PrivacyInfo.xcprivacy` in the project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>NSPrivacyTracking</key>
    <false/>
    <key>NSPrivacyTrackingDomains</key>
    <array/>
    <key>NSPrivacyCollectedDataTypes</key>
    <array/>
    <key>NSPrivacyAccessedAPITypes</key>
    <array>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>C617.1</string>
            </array>
        </dict>
        <dict>
            <key>NSPrivacyAccessedAPIType</key>
            <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
            <key>NSPrivacyAccessedAPITypeReasons</key>
            <array>
                <string>CA92.1</string>
            </array>
        </dict>
    </array>
</dict>
</plist>
```

Notes:
- `FileTimestamp` declared because AsyncStorage writes files and file metadata is read.
- `UserDefaults` declared because React Native AsyncStorage uses NSUserDefaults-adjacent APIs internally.
- `NSPrivacyCollectedDataTypes` is empty — Holdout collects no user data.
- `NSPrivacyTracking: false` — no cross-app tracking.

Then wire it into the build via an Expo plugin. Create `plugins/withPrivacyManifest.js`:

```js
const { withXcodeProject } = require('@expo/config-plugins');
const path = require('path');
const fs = require('fs');

module.exports = function withPrivacyManifest(config) {
  return withXcodeProject(config, (config) => {
    const projectRoot = config.modRequest.projectRoot;
    const iosDir = path.join(projectRoot, 'ios', config.modRequest.projectName);
    const dest = path.join(iosDir, 'PrivacyInfo.xcprivacy');
    const src = path.join(projectRoot, 'PrivacyInfo.xcprivacy');
    if (!fs.existsSync(dest)) {
      fs.copyFileSync(src, dest);
    }
    return config;
  });
};
```

Add to `app.json` plugins array:
```json
"plugins": ["expo-dev-client", "./plugins/withPrivacyManifest"]
```

Note: If Phase 2 Claude API integration is added (network requests), the privacy manifest may
need a network domain entry. Review at that time.

### 3. App Icon and Splash Screen — DONE (2026-04-18)

1024×1024 `icon.png` configured in `app.json`. Splash screen configured. Both device-validated.

### 4. Landing Webpage + Privacy Policy

Apple requires both a **Support URL** and a **Privacy Policy URL** in App Store Connect.
A single landing page satisfies both.

**Recommended approach:** GitHub Pages at `novaventuresco.github.io/holdout` (same infra as Daily Goals).
- Landing page: product hero, one-line mechanic description, App Store link (once live)
- Privacy policy section (or separate `/privacy` path): "All session data stays on your device. No accounts, no tracking, no servers."

**App Store Connect fields this covers:**
- Support URL → `https://novaventuresco.github.io/holdout`
- Privacy Policy URL → `https://novaventuresco.github.io/holdout/privacy` (or same page with anchor)

### 5. App Store Connect Metadata

To be prepared before Phase 3 submission:

| Field | Notes |
|-------|-------|
| App name | Holdout |
| Subtitle (30 chars) | e.g., "Hold through the craving" |
| Description (4000 chars) | What the app does, the mechanic, no medical claims |
| Keywords (100 chars) | craving, impulse control, urge, willpower, focus, mindfulness-adjacent |
| Support URL | novaventuresco GitHub or similar |
| Privacy Policy URL | See item 4 |
| Age rating | 4+ (no objectionable content) |
| Category | Health & Fitness (primary) |
| Pricing | Free (V1) |

**Copy rules for the description:**
- Do not claim the app treats addiction, substance use disorder, or any medical condition
- Do not promise outcomes ("will reduce cravings") — describe the mechanic instead
- "Train your ability to wait out an urge" is fine; "cure cravings" is not

### 6. Screenshots

Apple requires screenshots for iPhone 6.9" (iPhone 16 Pro Max / 15 Pro Max resolution).
Additional sizes recommended but not required: 6.5", 5.5".

Minimum: 1 screenshot. Recommended: 3–5 showing:
1. HomeScreen with streak
2. BattleScreen passive mode (amber fire at low progress)
3. BattleScreen active mode (orb in play)
4. HistoryScreen
5. (Optional) Win state

Capture on device or simulator. Screenshots can be captured with Xcode or the device camera button.

---

## Production Build (Phase 3)

When all items above are ready:

```bash
eas build --platform ios --profile production
```

Then submit via:
```bash
eas submit --platform ios
```

Or upload the `.ipa` manually in App Store Connect → Builds.

---

## Reference

- Bundle ID: `com.novaventuresco.holdout`
- Apple Team ID: `FG7KD2G6QX`
- EAS Project ID: `15ca7a10-bc89-404c-a2f6-bed2934907cd`
- EAS Account: `novaventures`
