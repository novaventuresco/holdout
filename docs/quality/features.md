# Holdout — Feature Registry

Last updated: 2026-04-26
Reference for all implemented features and the upcoming feature queue.
For quality grades and implementation detail, see grading.md. For architectural decisions, see decisions.md.

---

## Implemented Features

### Foundation

| Feature | Status | Notes |
|---------|--------|-------|
| AsyncStorage persistence (sessions + preferences) | DONE | Module-level cache in sessions.ts; 1 read on cold launch |
| Services layer (SessionService, StreakService, CoachService) | DONE | All stateless and pure |
| Fisher-Yates shuffle queue (pickFrom) | DONE | No repeat until pool exhausted; each pool independent |
| Navigation (RootStack → Tabs + Battle fullscreen modal) | DONE | HomeScreen + HistoryScreen tabs; Battle as fullscreenModal |
| Constants: colors, timing, coach pools | DONE | All coach lines calibration-voice; no "craving" word |

---

### Onboarding

| Feature | Status | Notes |
|---------|--------|-------|
| Single-screen first-run info flow | DONE | "It's not about willpower." science explainer; double-tap guard; save-once on LET'S GO |
| First-run routing (AsyncStorage check on launch) | DONE | null → onboarding → HomeScreen |

---

### HomeScreen

| Feature | Status | Notes |
|---------|--------|-------|
| Streak display (current + best) | DONE | Reloads on focus via useFocusEffect |
| Visual theme picker (9 themes — 3×3 grid) | DONE | Persisted to AsyncStorage; loads on focus; DEV_UNLOCK_ALL_THEMES=false (production); PREMIUM_THEMES + prefs.unlockedThemes ready for P3-07 IAP; lock icon size 20, bottom-positioned |
| Start Session CTA | DONE | Navigates to BattleScreen with selected theme |
| Rotating tagline | DONE | HOME_TAGLINES pool; picks once per mount; refreshes after session |

---

### BattleScreen

| Feature | Status | Notes |
|---------|--------|-------|
| 20-minute session timer (wall-clock elapsed) | DONE | 250ms interval; Date.now() - sessionStartRef |
| 7-state machine: initializing → running → won → wonComplete / gaveIn → gaveInComplete / resumePrompt | DONE | screenStateRef mirrors for closure safety |
| Progress bar with 4 milestone dots (4/8/12/16 min) | DONE | Amber fill + dot pop-scale on milestone fire |
| Coach line at milestones (silent, no overlay) | DONE | 7s display; keyed animation |
| SUPPORT ME on-demand coach + shockwave pulse | DONE | getCoachMessageForElapsed(elapsed, isRepeat) + amber glow; first tap → arc/position line, repeat taps → persistence/mechanism line |
| GAVE IN two-stage confirm (3s auto-reset) | DONE | Animated.View amber breathe glow on first tap |
| Win animation (white flash overlay → goBack) | DONE | withSequence; onWinAnimationComplete callback |
| Session result recording (won / gaveIn) | DONE | Deferred to wonComplete DONE tap (R-08) — not at handleWon. One record per full experience including GO AGAIN chains |
| Go Back (P2-04) — two-stage confirm, silent cancel | DONE | cancelSession (deleteSession) — no record, no streak impact; sessionIdRef nulled before goBack |
| Craving Gone / early win (P2-05) — two-stage confirm | DONE | completeSession at elapsed progress; earlyWin coach line; win animation fires |
| wonComplete state — DONE / GO AGAIN (P2-13) | DONE | DONE → completeSession + goBack; GO AGAIN → cancelSession + navigation.replace with priorElapsedMs |
| Background 20+ min → resumePrompt (2026-04-20) | DONE | 3-button overlay: GAVE IN / DONE / GO AGAIN; sessionProgress=0.999 (below win threshold); reuses existing handlers |
| App kill = silent cancel (2026-04-20) | DONE | Orphan recovery calls cancelSession (silent delete, no record, no streak impact) instead of abandonSession |
| AppState handling (pause/resume on background) | DONE | orbX/orbY snap to 0 on return; withTiming 400ms |
| PASSIVE / ACTIVE tap toggle pill | DONE | Mounted guard; SpatialBalance mounts on active |
| Active mode settings pill (ORB S·M \| PULL LO·HI) | DONE | Session-scoped; not persisted |
| P2-06 First-use mode instructions (passive + active) | DONE | Coach line pill; seenPassiveInstruction / seenActiveInstruction flags in Preferences; passive replaces start msg on session 1; active fires on first ACTIVE toggle |

---

### Active Mode — Spatial Balance

| Feature | Status | Notes |
|---------|--------|-------|
| Gyroscope balance mechanic (DeviceMotion) | DONE | 30Hz physics loop; pitch/roll → orbX/orbY |
| Per-axis gravity normalization | DONE | nx=orbX/MAX_X, ny=orbY/MAX_Y — all 4 edges equal |
| Non-linear edge gravity (n×\|n\|) | DONE | Concentrates gravity near wall; feels like amber pull |
| Zone-based friction (safe/edge/adhesion) | DONE | 0.94 / 0.90 / 0.86 — quicksand at boundary |
| Orb size toggle (S=0.08 / M=0.13 radius) | DONE | orbSize SharedValue; session-scoped |
| Gravity strength toggle (LO=0.3 / HI=0.7) | DONE | gravityHigh React state; perceptible mid-screen |
| AppState recentering (withTiming to 0) | DONE | 420ms recentring window; physics paused; edgeContact reset to 0 on resume; setTimeout handle stored + cleared on unmount |
| centerBoost (sanctuary reward) | DONE | Smoothed safeRatio; drives radius + shader glow |
| edgeContact (proximity signal) | DONE | Per-axis ramp from 65%; asymmetric lerp 0.05/0.018 |

---

### BattleVisual Shader

| Feature | Status | Notes |
|---------|--------|-------|
| SKSL RuntimeEffect (Skia) | DONE | Module-scope compilation; 4-octave fbm |
| 9 visual themes (Fire / Void / Ember / Glacier / Abyss / Solar / Aurora / Dusk / Nebula) | DONE | Ascending if/else chain in SKSL; theme uniform (int 0–8) set at session start; all 9 device-validated 2026-04-24 |
| Organic breathing (sin + dual fbm warp) | DONE | p_center boundary breathes; edgeContact fades distortion at walls |
| Core heartbeat (sin 2Hz) | DONE | corePulse expands white core region |
| Heat haze refraction (n1/n2 coordinate warp) | DONE | Subtle p_base warp |
| Chromatic aberration at orb edge | DONE | R/B channel offset at boundary |
| Shockwave pulse ring (Gaussian in shader) | DONE | Orb-relative; 0→1.3 per tap |
| Per-session seed (visual variety) | DONE | Random float uniform |
| orbOffset / orbFixed uniforms | DONE | Active mode: orb tracks physics position |
| centerBoost radius reward (+0.05 max) | DONE | Additive; decoupled from edgeContact |
| Living color (warm/cool/gold cycle) | DONE | Three sin oscillators; gated by centerBoost |
| Edge contact dim (centerLight *= 1-edgeContact*0.60) | DONE | Orb fades at wall; size unchanged |
| Edge pressure (directional background deepening) | DONE | dot(pixelDir, pressureDir); fire/void/ember branched |
| Organic distortion fade at walls | DONE | (cWarp-0.5)*0.20*(1-edgeContact) — eliminates wall inconsistency |
| Radial vignette | DONE | length(p_base) smoothstep at 0.4–0.95 |

---

### HistoryScreen

| Feature | Status | Notes |
|---------|--------|-------|
| Session list with progress bars | DONE | won=full white, gaveIn=partial amber |
| Milestone tick marks (4/8/12/16 min positions) | DONE | Cut through fill bar |
| Stats block (win rate / streak / best streak) | DONE | Above session list |
| Date formatting (Today / Yesterday / Mon D) | DONE | HH:MM time |
| Empty state | DONE | FlatList; useFocusEffect + mounted guard |

---

### App Icon

| Feature | Status | Notes |
|---------|--------|-------|
| App icon (home screen + App Store) | DONE | 1024×1024 icon.png; configured in app.json |
| Adaptive icon | N/A | Android only — iOS-only app |
| Splash-icon / native splash screen | DONE | Configured; too brief to perceive on device — acceptable for Phase 2 |
| Favicon | N/A | Web only — no web target |

---

## Phase 2 Queue (COMPLETE as of 2026-04-20)

Items were roughly ordered by dependency. Hot-reload items first, then EAS build required.

| # | Feature | Requires | Status |
|---|---------|----------|--------|
| P2-01 | EAS device build (`eas build --platform ios --profile device`) | — | DONE |
| P2-03 | App icon | — | DONE |
| P2-04 | "Go Back" exit from BattleScreen — top-right, two-stage confirm, silent cancel | hot-reload | DONE |
| P2-05 | "Craving gone" early-win from BattleScreen | hot-reload | DONE |
| P2-06 | Mode instructions (passive + active in-session UX guidance) | hot-reload | DONE |
| P2-08 | Improve coaching commentary based on science | hot-reload | DONE |
| P2-10 | Milestone orb reward (centerBoost visual burst at 4/8/12/16 min) | hot-reload | DONE |
| P2-11 | Strong gravity: no safe center — omnidirectional pull + wind gusts | hot-reload | DONE |
| P2-13 | Post-20-min craving handler ("still there" path after session win) | hot-reload | DONE |
| P2-15 | Haptic feedback (wall-contact, velocity-weighted) | expo-haptics | REMOVED 2026-04-19 — on-device testing found haptics disruptive to session feel; package remains installed |
| P2-16 | Post-session home screen messaging (win reinforcement + gave-in encouragement) | hot-reload | DONE |
| P2-17 | New visual theme packs — Glacier/Abyss/Solar (EAS 2026-04-18) + Aurora/Dusk/Nebula (2026-04-19) | EAS build | DONE — all 9 themes device-validated 2026-04-24 |
| P2-18 | Settings screen + locked theme UI (IAP placeholder; full wiring in P3-07) | hot-reload | DONE |
| — | App kill = silent cancel (orphan recovery via cancelSession) | hot-reload | DONE 2026-04-20 |
| — | Background 20+ min → resumePrompt (GAVE IN / DONE / GO AGAIN) | hot-reload | DONE 2026-04-20 |

---

## Phase 3 — App Store & Production Readiness

| # | Feature | Notes |
|---|---------|-------|
| Pre-build | Set DEV_UNLOCK_ALL_THEMES = false | DONE 2026-04-24 — HomeScreen.tsx; lock icon polished (size 20, bottom-positioned) |
| EAS build | New themes + resumePrompt device validation | DONE 2026-04-24 — all 9 themes validated on device |
| EAS build | Passive radius curve + Aurora/Dusk/Nebula shader validation | DONE 2026-04-26 — radius formula `mix(0.0, 0.42, pow(progress, 2.0))` confirmed on device; all 3 remaining themes confirmed |
| P3-03 | TestFlight beta (5–10 external testers) | SKIPPED — going direct to App Store |
| P3-04 | App Store screenshots + description | DONE 2026-04-26 — copy in docs/store/app-store-copy.md; 5 mockup canvases complete at `C:\Users\gbcoi\OneDrive\Documents\Apps\Holdout\screenshots\` ("Apple iPhone 16 Pro Max Screenshot 1–5") |
| P3-05a | Landing webpage | DONE 2026-04-26 — novaventuresco.github.io/holdout; real screenshots, copy rewritten, mobile-responsive; two ASO articles at /how-long-do-cravings-last/ and /urge-surfing/ |
| P3-05 | Privacy policy | DONE 2026-04-26 — novaventuresco.github.io/holdout/privacy |
| P3-05b | Privacy manifest (PrivacyInfo.xcprivacy) | DONE 2026-04-24 — PrivacyInfo.xcprivacy at project root; plugins/withPrivacyManifest.js copies it to ios/Holdout/ during EAS prebuild; app.json wired; takes effect on next EAS build |
| P3-06 | Production EAS build + submission | DONE 2026-04-28 — submitted to App Store Connect; under Apple review |
| P3-07 | Theme pack IAP transaction wiring (StoreKit) | DONE 2026-04-26 — IAPService.ts + ThemePackPaywall.tsx; HomeScreen paywall trigger wired. EAS device build done 2026-04-28; Sandbox purchase + persistence validated on device 2026-04-28 |

---

## Phase 4 — AI Features (Future)

| # | Feature | Notes |
|---|---------|-------|
| P4-08 | AI post-session chat (Claude API) | After the 20-min win, user can chat with AI about their experience and current feeling; conversational, not coaching — reflective dialogue |
| P4-09 | Claude API dynamic coach via Cloudflare Worker proxy | Key never in binary; requires EAS build; cravingType activation |

---

## Feature Notes

### P2-04 — "Go Back" exit from BattleScreen
Neutral exit path — no session recorded. Distinct from "GAVE IN" (which records an abandon). Intended
for cases where the user opened the session by mistake or wants to exit without it counting against them.
UI: top-right corner (two-stage confirm with "Leave?" label — spatial separation from GAVE IN eliminates
accidental tap risk). Confirmation glow (white breathe) distinguishes from GAVE IN amber glow.
Implementation: cancelSession (deleteSession) — record removed entirely. sessionIdRef nulled before
goBack() so unmount cleanup skips abandonSession. Crash recovery will not find the session on next launch.

### P2-05 — "Craving gone" early-win
Maps to a win at current elapsed time — no new session result type. Uses the existing `completeSession`
path at whatever progress has elapsed, with `sessionProgress` set to 1.0. Same win animation fires.
Coach line should acknowledge the early exit as a genuine win ("it passed"). HistoryScreen shows the
bar filled to elapsed position (same as a won session at partial time — already handled by the bar render).
Needs a two-stage confirm to prevent accidental taps (like GAVE IN).

### P2-06 — Mode instructions (passive + active)
Users arrive in BattleScreen with no instruction on what to do in either mode. Needs contextual guidance:
- **Passive mode:** Brief overlay or persistent UI hint explaining the visual and the user's role (presence
  on screen holds the center; no gesture needed — just stay with it).
- **Active mode:** Instruction that gyroscope controls the orb and the goal is to keep it centered.
  Should appear once on first active-mode activation and not reappear. Possibly a dismissable tooltip or
  a brief animated hint showing the orb drifting and re-centering. Intersects with P2-09 (onboarding).

### P2-08 — Coaching commentary improvement
Five pool line replacements rooted in domain.md craving neuroscience:
- **start[1]:** Removed "That's normal" reassurance → "First few minutes. It's at maximum. Doesn't get worse."
- **tap2[1]:** "This is the turn" → "The longer you hold, the weaker it gets. Right now." (real-time biochemical weakening reframe)
- **tap2[2]:** Paraphrase removed → "Not 12 more minutes. Just get to the next mark." (temporal chunking)
- **tap3[2]:** Duplicate idea → "It's already lost. You're watching the evidence." (defusion framing)
- **win:** Expanded from 2 to 3 messages — added "Twenty minutes. The loop is weaker than it was." (habit-loop framing)

Smarter SUPPORT ME: `supportMe` sub-pools restructured into `first`/`repeat` tiers per phase.
First tap in a session → arc/position message ("where are you on the curve").
Repeat taps → persistence/mechanism message ("what's happening to it now — it can't recover").
BattleScreen tracks taps via `supportMeTapCountRef`; CoachService routes via `isRepeat` param (default false).

### P2-10 — Milestone orb reward
At each milestone (4/8/12/16 min), the orb fires the same visual effects as active-mode centerBoost:
radius expansion, living-color pulse, chromatic brightening. This rewards the user for reaching the
milestone in passive mode and gives passive mode a moment of visual payoff equivalent to active mode's
center-hold reward. Driven by a milestone-triggered centerBoost spike (SharedValue → BattleVisual uniform).
Duration: ~2–3s burst, then returns to baseline. Should feel like the orb briefly "inhaling."

### P2-11 — Strong gravity: no safe center + wind gusts
Currently, the center of the screen is a gravity-free resting point on Strong pull. Device testing
shows this removes the challenge — user can hold it still without effort.
Fix: on Strong mode, apply a baseline omnidirectional pull so there is no neutral equilibrium at center.
The orb always wants to drift toward one of the four edges.
Extension — "wind gusts": unpredictable short-duration directional force spikes that shift pull
suddenly (e.g. top → right). Modeled as a timed random vector applied to velocity with exponential
decay. Frequency and magnitude tunable. Creates the feeling of holding steady against gusting forces
rather than resisting a steady wall. Regular mode keeps current physics unchanged.

### P2-13 — Post-20-min craving handler
Implemented Session 26 (2026-04-18). After the 5-second win animation, BattleScreen holds in a
`wonComplete` state instead of immediately calling `navigation.goBack()`.

**State machine:**
`running → won → wonComplete → [goBack or replace('Battle')]`

**wonComplete behavior:**
- DONE button (text-only, TEXT_SECONDARY) → `navigation.goBack()`
- GO AGAIN button (amber pill) → `navigation.replace('Battle')` — fresh session, clean SharedValues
- At wonComplete+2000ms: `winLingers` coach line fires via existing pill mechanism
- Session recording deferred to DONE tap (R-08, 2026-04-19) — not recorded at handleWon; GO AGAIN cancels the session (never recorded); DONE calls completeSession. One record per full experience including GO AGAIN chains.
- Progress bar hidden in wonComplete; win visual persists as background

**winLingers pool (10 messages):** Normalises lingering without judgment. Calibration framing, no "craving"
word, no directives. Coach predicts/observes; GO AGAIN is the CTA, not the coach.
Device validation: pending hot-reload test (shorten SESSION_DURATION_MS to 60000 to validate end-to-end).

### P2-16 — Post-session home screen messaging
Different tagline pools shown on HomeScreen after a session, visible on the immediate return:
- **Win:** `HOME_WIN_MESSAGES` — human, warm acknowledgment of a real hold. Not cheerleading.
- **Gave-in:** `HOME_GAVE_IN_MESSAGES` — empathetic, non-judgmental. The tone of a quiet, honest friend.
- **Default (first launch, Go Back, early-win):** `HOME_TAGLINES` — existing pre-session pool.
Persistence: `lastSessionResult?: 'won' | 'gaveIn'` field added to Preferences. Written by
BattleScreen on completeSession / abandonSession paths. Read and cleared (shown exactly once) by
HomeScreen useFocusEffect. Go Back (cancelSession) and early-win (Craving Gone) do NOT write this
field — they return to default taglines.
Both pools follow home-screen register: warmer than in-session coach, not subject to 15-word rule,
still no therapy language, no cheerleading, grounded in the app's worldview.

### P2-17 — New visual theme packs
Six new themes added across two sessions (total: 9). Each is a distinct visual story:
- **Glacier** (theme=3): Ice-blue edges pressing inward; warm amber/gold center. Fire inverted — cold outside, warm core. Device-validated 2026-04-19.
- **Abyss** (theme=4): Pitch-black edges with bioluminescent cyan-green glow at center. Total darkness pressing in, ethereal life at the hold point. Device-validated 2026-04-19.
- **Solar** (theme=5): Blazing gold/white edges pressing inward; deep cosmic violet/crimson center. Sun vs cosmos. Device-validated 2026-04-19.
- **Aurora** (theme=6): Electric green/lime edges, silver-pearl center. Living color oscillates ice-white to pale-violet. Device-validated 2026-04-24.
- **Dusk** (theme=7): Deep magenta → rose → coral edges, warm gold/champagne center. Device-validated 2026-04-24.
- **Nebula** (theme=8): Deep violet → hot-magenta edges, brilliant electric ice-blue center (1.85× brightness multiplier). Device-validated 2026-04-24.
Free/premium split: fire/void/ember free; glacier/abyss/solar/aurora/dusk/nebula premium (locked by default — DEV_UNLOCK_ALL_THEMES=false in production). Full IAP wiring in P3-07.
Shader ascending if/else chain extended from 3 → 9 branches across all three sections (fire ramp, center color, edge pressure).

### P2-18 — Settings screen + locked theme UI
New `SettingsScreen` pushed from HomeScreen (not a tab). Contains:
- **Themes section:** All 6 themes with visual swatches. Free themes (fire/void/ember) selectable.
  Premium themes (glacier/abyss/solar) show locked overlay + UNLOCK button (placeholder Alert for Phase 2).
- **Science info section:** Permanent "HOW IT WORKS" craving-science reference.
HomeScreen gains a settings nav entry (gear icon or text link). Theme picker on HomeScreen can be
simplified or retired since Settings owns full theme selection.
IAP transactions (StoreKit) wired in Phase 3 (P3-07). Data model ready: `unlockedThemes?: VisualTheme[]`
added to Preferences (unused in Phase 2). `FREE_THEMES` / `PREMIUM_THEMES` constant arrays defined.

### App kill = silent cancel (2026-04-20)
App kill, crash, or OS kill mid-session is recovered via `cancelSession` (deletes the record entirely).
Previously `abandonSession` was called, recording a `gaveIn` — which penalised the user for something
outside their control. The new behavior is indistinguishable from "never started": no history entry,
no streak impact. Implementation: `App.tsx` init block calls `cancelSession(orphan.id)` on any session
found without a result. This is the same path as Go Back (P2-04).

### Background 20+ min → resumePrompt (2026-04-20)
When the app returns from 20+ minutes of background during a running session, BattleScreen enters
`resumePrompt` state instead of auto-winning. A single overlay presents three choices:

```
You were away. Did you hold out?
[HELD OUT]  [GO AGAIN]   ← white outline + amber fill
     [GAVE IN]           ← dim text below
```

This reconciles two prior features that would have required two screens: the "did you hold out?"
question and the "do you need another session?" question from winLingers/GO AGAIN. The background
path answers both in one prompt. Normal 20-min wins (non-background) are unchanged — they still go
through the win animation → wonComplete → DONE / GO AGAIN + winLingers coach line.

`sessionProgress.value` is set to `0.999` on resumePrompt entry — visually identical to the won
state (amber fully retreated) but below the `>= 1.0` threshold that triggers BattleVisual's win
animation. GAVE IN / DONE / GO AGAIN reuse existing handlers with no new logic.

---

### P4-08 — AI post-session chat
After a 20-min win, user enters a conversational chat interface powered by Claude API (via
Cloudflare Worker proxy — key never in binary, same arch as P4-09 dynamic coach).
The AI is not coaching — it's reflective dialogue. User can describe what they felt, what was
hard, what shifted. AI responds in calibration voice: curious, grounded, not therapeutic.
Session context (elapsed time, theme, gaveIn/won) passed as system context so AI can speak to
the specific session. Chat is ephemeral — not persisted. Entry point is optional CTA on win screen
("talk about it →"). Requires P4-09 proxy to be in place first.
