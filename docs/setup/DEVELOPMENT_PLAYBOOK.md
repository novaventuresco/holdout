# Holdout — Development Playbook

## Primary Dev Loop

Holdout uses **expo-dev-client** — not Expo Go. `@shopify/react-native-skia` is a native module
that is not bundled in Expo Go. After installing the dev client build on device, JS and shader
changes hot-reload without rebuilding.

### Start Metro

```bash
npx expo start --clear
```

Always use `--clear` to avoid stale bundle / wrong URL issues.

**If device shows "Could not connect to server" (127.0.0.1):**
```bash
npx expo start --lan
```
Phone and PC must be on the same WiFi network. LAN mode is the fallback — `--clear` usually fixes it.

### Open the app on device

1. Open the **Holdout dev client** app (installed via the `device` profile)
2. Scan the QR code shown in Metro terminal
3. App loads. JS changes hot-reload from this point — no rebuild needed.

**Do not use Expo Go** — it does not include react-native-skia and will fail to bundle.

---

## Build Profiles

| Profile | Purpose | Command |
|---------|---------|---------|
| `device` | Device install + dev client (hot-reload) | `eas build --platform ios --profile device` |
| `adhoc` | Baked standalone build — sign-off testing, no Metro needed | `eas build --platform ios --profile adhoc` |
| `production` | App Store submission | `eas build --platform ios --profile production` |
| `development` | iOS simulator only — do not use for device | (avoid) |

**Use `device` for all development work.** The `device` profile has `developmentClient: true` —
this is what makes the installed app work as a dev client with QR scan + hot reload.

The `adhoc` profile does NOT have `developmentClient: true` — it produces a baked standalone
build. Use it for sign-off testing (no Metro server required).

The `development` profile has `simulator: true` — Safari on iPhone will show "Download" not
"Install". This is the wrong profile for device work.

---

## Cache Management

### Metro cache clear (most common)
```bash
npx expo start --clear
```
Use after any dependency change, after install errors, or if Metro resolves wrong.

### Full reinstall (nuclear — Windows ENOTEMPTY fix)

If you see `npm error ENOTEMPTY` during install or Metro throws `Unable to resolve './skia'`,
the react-native-skia package was corrupted during install:

```powershell
Remove-Item -Recurse -Force node_modules\@shopify\react-native-skia
npm install
npx expo start --clear
```

Do not delete all of node_modules — unnecessary. Target the corrupted package only.

### Full node_modules reset
```powershell
Remove-Item -Recurse -Force node_modules
npm install
npx expo start --clear
```

---

## Project Structure

```
Holdout/
├── src/
│   ├── animations/        # BattleVisual (Skia shader)
│   ├── screens/           # HomeScreen, BattleScreen, OnboardingScreen, HistoryScreen, TestScreen
│   ├── services/          # SessionService, StreakService, CoachService
│   ├── storage/           # AsyncStorage CRUD (sessions, preferences)
│   └── constants/         # colors, timing, coach messages
├── docs/                  # Architecture, quality, context docs
├── app.json               # Expo config (expo-dev-client plugin)
├── eas.json               # EAS profiles (device, adhoc, production)
└── package.json           # Dependencies
```

---

## Key Commands

```bash
# Start dev server
npx expo start --clear

# LAN fallback (if 127.0.0.1 connection error)
npx expo start --lan

# Build for device (dev client + hot-reload)
eas build --platform ios --profile device

# Build standalone for sign-off testing (no Metro needed)
eas build --platform ios --profile adhoc

# Production build (App Store)
eas build --platform ios --profile production

# View build status
eas build:list
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Safari shows "Download" not "Install" | Used `development` profile (simulator: true) | Use `device` profile |
| "Could not connect to server" 127.0.0.1 | Metro cached wrong URL | `npx expo start --clear` |
| Connection still failing | PC/phone on different networks | `npx expo start --lan` |
| `Unable to resolve './skia'` | ENOTEMPTY corrupted skia install | Delete + reinstall skia (see above) |
| Shader appears blank/black on device | RuntimeEffect compilation failure | Simplify shader — remove fbm loop to isolate |
| App opens Expo Go instead of dev client | Wrong app opened | Open the Holdout app (device build), not Expo Go |

---

*Last updated: 2026-04-09*
