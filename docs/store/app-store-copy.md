# Craving Holdout: Urge Timer — App Store Copy

Last updated: 2026-05-02
Status: Approved draft — ready for App Store Connect entry and screenshot overlay design

---

## App Store Connect Fields

### App Name
```
Craving Holdout: Urge Timer
```

### Promotional Text (138 / 170 chars)
```
Not another tracker. Not a breathing exercise. A 20-minute session where you watch the urge lose ground while you hold. Free to start.
```
*Can be updated at any time without a new App Store submission.*

### Subtitle (29 / 30 chars)
```
Outlast the urge
```

### Description
```
Most cravings end at the fridge or the pantry. If you're going to reach for your
phone anyway, this is what you open.

Craving Holdout is a 20-minute session. You watch the urge on screen; amber pushing in from
the edges, your presence in the center holding it back. The longer you stay, the more
ground it loses. At 20 minutes, it retreats. That's it.

There's a reason this works. Habit-driven urges run on dopamine, and dopamine doesn't
keep building forever. The impulse peaks and falls off on its own, usually within 15
to 20 minutes, whether you act on it or not. What you're doing is urge surfing: staying
with the discomfort long enough to watch it lose. Most people give in before they see
that happen. The app makes the window visible.

There's no breathing exercise here. No journaling prompt. No affirmation. Just a visual
urge timer, something to watch that gives the urge somewhere to go.

Every session gets logged. How long you held, the milestones you crossed, whether you
made it. Not to guilt you when you didn't. Just so you can see that you've done this
before. That's usually enough.

If the fire theme gets old, there are eight others: void, ember, glacier, abyss, solar,
aurora, dusk, nebula. Three come with the app. The rest are a one-time unlock if you
want them.

It's free. No account. Works offline. Nothing leaves your phone.
```
*(~250 words / ~1500 chars)*

### Keywords (89 / 100 chars)
```
hold urge,craving app,quit craving,focus session,dopamine,impulse,binge,habit,urge surfing
```
*Note: "craving" and "hold" are covered by the app name field — not repeated here.*

### Category
Health & Fitness

### Age Rating
4+

### Pricing
Free + $4.99 in-app purchase (theme pack — 6 premium themes)

### Support URL
```
https://novaventuresco.github.io/holdout
```
*(confirmed)*

### Privacy Policy URL
```
https://novaventuresco.github.io/holdout/privacy
```
*(confirmed)*

---

## Screenshot Overlays

**Resolution:** App Store Connect requires 1320×2868 px (6.9"). Source screenshots are
1179×2556 px (iPhone 14 Pro / 15 Pro, 6.1"). Do not retake — use the device mockup approach:
place each screenshot inside an iPhone device frame on a 1320×2868 canvas. Text overlays span
the full canvas width and can extend visually past the phone edges.

**Tools:** Previewed.app (free tier), AppMockUp.com, or Figma with an iPhone 15 Pro frame component.

Overlay placement: headline in large bold type spanning full canvas width, sub-line below it.
Background behind text: semi-transparent dark scrim so text reads against any shader state.

---

### Screenshot 1 — HomeScreen

**File:** IMG_1224 (VOID theme selected, streak 1, locked premium themes visible)

> **HEADLINE:** A craving always passes on its own
> **SUB-LINE:** Watch it lose ground while you hold

---

### Screenshot 2 — BattleScreen early (amber advancing)

**File:** IMG_1219 (FIRE passive, very early session, amber dominant, small teal orb)

> **HEADLINE:** The craving at its hardest
> **SUB-LINE:** The amber is the urge, the center is you

---

### Screenshot 3 — Coach mechanic

**File:** IMG_1231 (GLACIER active mode, coach pill showing "Every minute you don't act on it, it gets a little less.")

> **HEADLINE:** A coach for the hardest minutes
> **SUB-LINE:** One honest line at minute 4, 8, 12, and 16

---

### Screenshot 4 — HistoryScreen

**File:** IMG_1234 (50% win rate, streak 2, 10 sessions, mix of won/gave-in bars)

> **HEADLINE:** Every session you've held is in here
> **SUB-LINE:** Won or didn't, the pattern builds

---

### Screenshot 5 — Theme variety

**File:** IMG_1231_aurora (AURORA active mode, green smoky environment with white orb)

> **HEADLINE:** Nine environments to hold through it
> **SUB-LINE:** Three free, six in the theme pack

---

## App Preview Video

**Duration:** 22 seconds (Apple requirement: 15–30s)
**Format:** Portrait, H.264, 1179×2556 (native iPhone screen recording). No audio required.

### Pre-Recording Setup

Temporarily shorten the session timer for recording — revert before production build:
- `src/constants/timing.ts` → `SESSION_DURATION_MS = 90_000` (90 seconds)

Device setup:
- FIRE theme selected, streak ≥ 1 visible
- Screen recording active via iOS Control Center
- Notifications silenced; status bar clean (use 9:41)

### Shot List

| Shot | Duration in edit | What to record |
|------|-----------------|----------------|
| 1 — HomeScreen | 0:00–0:02 (2s) | HomeScreen with FIRE theme selected. Tap START SESSION. Capture the tap + transition start. |
| 2 — Battle start, amber dominant | 0:02–0:07 (5s) | Very early in a 90s session. Amber pressing in hard from all edges, small orb barely holding. |
| 3 — Mid-battle, milestone fires | 0:07–0:13 (6s) | ~40–50% through session. Orb larger, amber strong. Let a milestone fire — capture the shockwave pulse + coach pill appearing together. |
| 4a — Theme cut: AURORA | 0:13–0:15 (2s) | AURORA theme mid-session. Electric green edges, white-silver orb. Active mode with slight tilt ideal. |
| 4b — Theme cut: NEBULA or GLACIER | 0:15–0:17 (2s) | NEBULA (violet/magenta edges, electric blue center) has highest contrast. GLACIER works too. |
| 5 — Win state | 0:17–0:22 (5s) | End of 90s session. Amber fully retreated, then the white flash win animation. Hold on the cleared screen 2–3s before tapping DONE. |

### Overlay Copy

White bold text, 32–36pt. Sub-lines regular weight, 18–20pt. Centered. Semi-transparent dark scrim behind each text block.
Text appears ~0.5s after the cut lands (gives eye time to settle on the visual first).

| Time | Headline | Sub-line |
|------|----------|----------|
| 0:00–0:02 (HomeScreen) | *none* | — |
| 0:02–0:06 (amber advancing) | **The urge, made visible.** | The amber is the craving. The center is you. |
| 0:07–0:12 (mid-battle, coach fires) | **A coach for the hardest minutes.** | One honest line at 4, 8, 12, and 16 minutes. |
| 0:13–0:17 (theme cuts) | **Nine environments.** | Three free. Six in the theme pack. |
| 0:17–0:20 (amber retreating) | **20 minutes. It retreats.** | — |
| 0:20–0:22 (cleared screen / fade out) | **Craving Holdout** | Free. No account. |

### Edit Notes

- **Tools:** iMovie (free, Mac) or CapCut (free mobile)
- **Cuts:** Hard cuts between all shots except 4a → 4b (0.2s crossfade — feels like a theme switch)
- **End:** Fade to black over 0.5s on the final frame
- **Audio:** Optional — silence is clean; if music, use something minimal and non-rhythmic

### After Recording

Revert `SESSION_DURATION_MS` back to `20 * 60 * 1000` in `src/constants/timing.ts` before production EAS build.

---

## Copy Rules (do not violate in any revision)

- No claim the app treats addiction, eating disorders, or any medical condition
- No outcome promises ("will reduce cravings," "will make you lose weight")
- No wellness language ("journey," "mindfulness," "be proud of yourself")
- No judgment copy on gave-in sessions
- "Craving" is allowed in store copy (prohibition is coach pill UI strings only)
- Science claims must be defensible: dopamine urges peak/subside in 15–20 min is established in ACT and habit-loop research
