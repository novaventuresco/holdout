# Craving Holdout: Urge Timer — Session Brief

Quick-reference for any development session. Contains the mechanic spec, coach voice rules,
session state machine, and color tokens. Read this before starting work; read the full source
docs only when making product-scope decisions or designing new features.

---

## Core Mechanic (One Sentence)

A 20-minute visual battle: an amber force presses in from screen edges — the craving made
visible — and the user's presence on screen holds and slowly defeats it.

---

## Visual Battle Phases

| Time | What Happens |
|------|-------------|
| 0–4 min | Amber advances from all edges. Center holds clear. Pressure building. |
| 4–8 min | Amber slows — the hold is working. Boundary breathes between forces. |
| 8–14 min | Center begins reclaiming ground. Turn visible by minute 12. |
| 14–20 min | Amber retreating to edges. By minute 18: thin border only. |
| 20 min | Amber pulses at edges, gone. Screen holds clear 3 seconds. Won. |

**Won state:** Screen clears. Coach delivers close line. Still. No confetti, no flash.
**Gave-in state:** Amber re-advances slowly. "Session ended." No judgment. Streak resets.

---

## Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0D0D0D` | All screens |
| Amber (craving) | `#F5A623` | Edge force, CTA button |
| Amber dark | `#E8630A` | Amber force inner edge |
| Center force | `#F0F0F0` | Center hold |
| Center bright | `#FFFFFF` | Center at full hold |
| Text primary | `#F0F0F0` | Headlines, large numbers |
| Text secondary | `#888888` | Labels, subtitles |
| Won state | `#FFFFFF` | Clear screen |

---

## Session State Machine (BattleScreen)

```
initializing → running → won → wonComplete → [goBack or replace('Battle')]
                       → gaveIn → gaveInComplete → [goBack]
```

**initializing:** AsyncStorage prefs + startSession() running. Black screen.
**running:** 250ms interval ticking. sessionProgress 0→1. Controls visible.
**won:** 20 min reached (or early win). Win animation plays (5s). Coach close line. Session NOT yet recorded — deferred to user choice in wonComplete.
**wonComplete:** Win animation done. Win visual remains as background. DONE + GO AGAIN buttons at bottom. Post-win coach line from `winLingers` pool fires ~2s in (normalises lingering, no judgment).
  DONE → completeSession() + lastSessionResult:'won' saved → goBack(). History + HomeScreen updated once.
  GO AGAIN → cancelSession() on first session (not recorded) → navigation.replace('Battle', { priorElapsedMs }). Fresh session records cumulative duration. One result in history either way.
  **Crash note:** Session stays active (no result) until DONE is tapped. If the app crashes in won/wonComplete, orphan recovery on next launch marks it gaveIn (intentional — no implicit win).
**gaveIn:** Drain animation (amber re-advances over 5s). "Session ended."
**gaveInComplete:** RETURN button shown.

---

## Session Controls (running state only)

| Control | Location | Behavior |
|---------|----------|----------|
| Go Back | Top-right | Two-stage confirm (white glow). Silent cancel — no record, no streak impact. |
| PASSIVE / ACTIVE | Top-center pill | Tap to toggle mode. Active = gyroscope physics. |
| SUPPORT ME (shield) | Bottom-left | On-demand coach + shockwave pulse + amber glow flash. |
| CRAVING GONE (check) | Bottom-center | Two-stage confirm (teal glow). Early win — completeSession at elapsed. |
| GAVE IN (X) | Bottom-right | Two-stage confirm (amber glow, 3s auto-reset). abandonSession drain. |

---

## Milestones (silent — no overlay, no forced interaction)

| Minute | Action |
|--------|--------|
| 4 | passedCount++, coach calibration line (7s), shockwave pulse, dot lights |
| 8 | same |
| 12 | same |
| 16 | same |
| 20 | session won |

Passive mode: centerBoost spike (0→1 over 600ms, decays over 9400ms) fires at each milestone.
Active mode: SpatialBalance writes centerBoost continuously — no milestone spike (conflict).

---

## Coach Voice Rules

**Role:** One thing only — location on the craving curve. Not motivation. Not cheerleading.
**Every line must be:**
- Calibration-only (factual about where the user is on the craving arc)
- Free of the word "craving" — coach says "it" (distant, already losing power)
- No em dashes
- Never claiming the user's current felt state ("it eased", "it dropped", "it faded")
- Zero judgment or disappointment on gave-in result

**The coach never says:**
- "You've got this" / "You're doing great" — empty affirmation
- "Be proud of yourself" — therapeutic
- "Take a deep breath" — mindfulness
- The word "craving" — activates the very pathway we're quieting
- Specific minute numbers in the tap1–tap4 pools — the progress bar already shows time; the coach delivers what the UI can't: what this moment means
- Anything implying the user failed on gave-in

**Scheduled milestone pool examples:**
- Start: "It always peaks and falls in twenty minutes. That's the science. Stay."
- Minute 4: "You made it through the first surge. The harder part is still ahead. Hold."
- Minute 8: "This is the hardest it gets. It won't push harder than this. Hold."
- Minute 12: "It's already lost. You're just finishing the round."
- Minute 16: "This isn't effort anymore. It's just the clock running out."
- Win: "That's 20 minutes. You held it."

**On-demand (SUPPORT ME):** Uses `supportMe.early/mid/late` pool — no minute references, always accurate when tapped.
**Early win:** Uses `earlyWin` pool — "It fired, got nothing, and left." / "Done before twenty. It ran out before you did."

All coach pools are in `src/constants/coach.ts`. Delivery is via `src/services/CoachService.ts`.

---

## Hard Constraints (Never Violate)

- No backend, remote database, server, accounts, or auth
- No food logging, diet content, calories, macros
- No mindfulness, breathing, meditation, journaling
- No therapy language ("Be kind to yourself", "Take a deep breath")
- No push notifications (V1 is foreground-only)
- Session result is binary: `won` or `gaveIn` — never null or partial
- Coach lines: calibration only, never motivation or cheerleading
- Gave-in copy: zero shame, zero judgment, zero implication of failure
- Coach never says "craving"

---

## Key Architecture Facts

- **Framework:** React Native / Expo SDK 54.0.33, iOS only
- **Storage:** AsyncStorage only (sessions.ts, preferences.ts) — no backend, no sync
- **Animation:** Reanimated 4.x SharedValues + Skia SKSL RuntimeEffect (BattleVisual)
- **Build loop:** `npx expo start` → scan QR with device dev-client. NOT Expo Go.
- **BattleVisual:** Pure display — no timers. Receives `sessionProgress` SharedValue from BattleScreen.
- **SpatialBalance:** Physics-only — renders null. Writes `orbX`/`orbY`/`centerBoost` owned by BattleScreen.
- **Active mode:** Per-session opt-in. Gyroscope → orbX/orbY → shader orbOffset uniform.
- **Passive mode default.** SpatialBalance only mounts when `showRunningUI && activeMode`.

---

## Current Phase

Phase 3 — App Store & Production Readiness (Phase 2 COMPLETE as of 2026-04-18)
See CLAUDE.md Build Phases for the full queue. Phase 3 queue: TestFlight → screenshots → privacy policy → production build.
EAS device build done 2026-04-19. Ghost of light mode resolved. All Phase 2 device validation complete.

---

## Where to Find More

| Topic | File |
|-------|------|
| Full product strategy, science, monetization | docs/holdout_business_plan.md |
| Full functional spec, screen specs | docs/Holdout_V2_Master_Brief.md |
| Build workflow, storage, services patterns | docs/architecture/patterns-build.md |
| Animation, Skia, SharedValue patterns | docs/architecture/patterns-animation.md |
| SpatialBalance physics, timing patterns | docs/architecture/patterns-physics.md |
| Architecture decisions with rationale | docs/architecture/decisions.md |
| Current quality grades | docs/quality/grading.md |
| Phase 2 feature queue | docs/quality/features.md |
| Known gaps | docs/quality/gaps.md |
