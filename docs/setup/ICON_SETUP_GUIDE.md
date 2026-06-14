# Holdout — App Icon Setup Guide

**Status:** UNSTARTED (P2-03)
Last updated: 2026-04-09

---

## What Needs to Be Done

Holdout has no icon assets yet. The `app.json` has no `icon` or `splash` fields.
A native rebuild is required after adding icons — hot-reload cannot pick them up.

---

## Files Required

| File | Size | Purpose |
|------|------|---------|
| `assets/icon.png` | 1024×1024 px | App icon — EAS generates all device sizes from this |
| `assets/splash.png` | 1284×2778 px (or any tall portrait) | Splash screen background |

Both must be PNG, no transparency on icon.png (Apple rejects transparent app icons).

---

## Visual Direction

Holdout's aesthetic: near-black background, amber orb glow, fire/ember palette.
The icon should communicate the core mechanic — holding / presence / flame — without literal imagery
that suggests addiction treatment (which the app is not). Simple and strong.

Options that fit:
- Abstract amber glow / orb on dark background (mirrors the battle visual)
- A flame or ember shape, minimal, on deep dark background
- Geometric hold / shield silhouette in amber

Whatever is created: design at 1024×1024, with at least 80px safe margin from edges
(Apple rounds corners in the OS and clips to a squircle).

---

## Steps

### 1. Create the icon

Design or commission `icon.png` (1024×1024, no transparency, PNG).
Place it at `assets/icon.png` (create the `assets/` folder if needed).

### 2. Create a splash image (optional but recommended)

A simple dark background (matching `COLORS.BACKGROUND = '#0D0D0D'`) works fine.
Place at `assets/splash.png`.

### 3. Update app.json

```json
{
  "expo": {
    "name": "Holdout",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0D0D0D"
    },
    ...
  }
}
```

If you skip `splash.image`, set at minimum:
```json
"splash": {
  "backgroundColor": "#0D0D0D"
}
```
This gives a solid dark background instead of the default white flash.

### 4. Rebuild

Icons are native assets — they cannot be hot-reloaded:

```bash
eas build --platform ios --profile device
```

After install, the Holdout icon appears on the home screen and in the app switcher.

---

## App Store Icon Checklist (for Phase 3 submission)

Apple requires a 1024×1024 icon in App Store Connect. EAS supplies this automatically from
`assets/icon.png` during the production build. No separate upload needed.

Additional App Store icon rules:
- No transparency (alpha channel)
- No rounded corners in the source file (Apple applies the squircle mask)
- No text (App Store review guideline 2.3.7)
- Must not be identical to another app's icon

---

## Reference

- Bundle ID: `com.novaventuresco.holdout`
- EAS project: `novaventures / holdout`
- Production build command: `eas build --platform ios --profile production`
