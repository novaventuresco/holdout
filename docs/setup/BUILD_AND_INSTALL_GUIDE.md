# Holdout — Build and Install Guide

## Build Profiles

Holdout has three active profiles in `eas.json`:

### device — Dev client + hot-reload on physical device
```bash
eas build --platform ios --profile device
```
- Installs on your registered iPhone as a dev client app
- Has `developmentClient: true` — the installed app acts as an Expo dev client
- After install: run `npx expo start --clear`, scan QR, get hot reload
- **This is the profile you use for all active development work**

### adhoc — Baked standalone build for sign-off testing
```bash
eas build --platform ios --profile adhoc
```
- Installs on your registered iPhone as a standalone app (no Metro needed)
- Does NOT have `developmentClient: true` — no hot-reload
- Use this for phase sign-off testing (VS-001–VS-012, etc.)

### production — App Store
```bash
eas build --platform ios --profile production
```
- Optimized build for App Store submission
- Not used during development phases

### development — Do not use for device
The `development` profile has `"ios": { "simulator": true }`. Safari on iPhone will show
"Download" instead of "Install". Use `device` for device installs.

---

## Initial Device Setup (One Time)

### 1. Register your iPhone
```bash
eas device:create
```
Opens a URL. On your iPhone (in Safari), visit the URL and follow the prompts to install
the device registration profile. Your UDID is captured automatically.

Verify:
```bash
eas device:list
```

### 2. Create the device build
```bash
eas build --platform ios --profile device
```
Takes 15–20 minutes. Monitor at: https://expo.dev/accounts/novaventures/projects/holdout/builds

### 3. Install on iPhone
1. When build completes, EAS shows a QR code and install link in terminal
2. Open the link on your iPhone in **Safari**
3. Tap **"Install"** (not "Download")
4. App installs to home screen

**If you see "Download" not "Install":** Wrong profile — rebuild with `--profile device`.

### 4. Trust developer (first time only)
1. Open the Holdout app
2. If you see "Untrusted Developer": Settings → General → VPN & Device Management
3. Tap your developer profile → Trust

---

## Daily Development (After Initial Setup)

```bash
npx expo start --clear
```

1. Open the **Holdout** app on your iPhone (installed via `device` profile)
2. Scan the QR code
3. App loads with hot reload active

No rebuild needed for JS or shader changes. Rebuild only when changing native code,
adding native packages, or changing app.json plugins.

---

## When to Rebuild

| Change | Rebuild needed? |
|--------|----------------|
| JS / TypeScript code | No — hot reload |
| SKSL shader string in BattleVisual.tsx | No — hot reload |
| Adding a new npm package (JS-only) | No — `npm install` + restart Metro |
| Adding a native package (e.g., expo-sensors, expo-haptics) | Yes — `eas build --profile device` |
| Changing app.json plugins | Yes |
| Changing bundle ID or entitlements | Yes |

---

## Quick Reference

```bash
# Register device (one-time)
eas device:create

# Build dev client for device (hot-reload)
eas build --platform ios --profile device

# Build standalone for sign-off testing
eas build --platform ios --profile adhoc

# Start dev server
npx expo start --clear

# LAN fallback (if 127.0.0.1 connection error)
npx expo start --lan

# View builds
eas build:list
```

---

*Project: com.novaventuresco.holdout | EAS: novaventures | Apple Team: FG7KD2G6QX*
*Last updated: 2026-04-09*
