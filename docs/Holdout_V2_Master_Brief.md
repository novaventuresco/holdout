# HOLDOUT — Master Build Brief
## Version 2.0: The Battle Visualization
**Nova Ventures Co. · March 2026**

> **Mechanic update (2026-04-04):** The forced recommitment tap (periodic overlay + 30s timeout-to-gave-in)
> was replaced. Coach lines still fire silently at minutes 4/8/12/16 (shockwave + line, no interaction
> required). GAVE IN is now an explicit two-tap button — the user must affirmatively end the session.
> Anywhere this brief describes "missing a recommitment tap" as gave-in: that mechanic is superseded.
> See docs/architecture/decisions.md for the authoritative record.

---

## Before You Build: What to Do This Week

Do these three things before opening Claude Code. They cost zero development time
and de-risk the entire project.

**1. Run the manual validation test.**
Set a timer for 20 minutes. Open your phone. Stay on one screen — even a blank one.
When the craving hits, start the timer. Note what happens at minutes 5, 8, 12.
Does the urge actually fade? This validates the core behavioral claim on yourself
before you invest a single hour of build time.

**2. Sketch the battle visual on paper.**
Amber pressing in from the edges. Cool center holding, then pushing back.
Draw it at minute 0, minute 8, minute 16, minute 20. If you cannot draw it clearly
on paper in 5 minutes, the concept needs more definition before it becomes code.

**3. Open Daily Goals and export its config.**
Run the knowledge extraction prompt in this brief against Daily Goals before
starting any new project. That operational knowledge is your foundation.

---

## Part 1: Business Plan

### The Product

Holdout is a 20-minute craving tool. When a food craving hits, the user opens the
app and watches a visual battle unfold on their screen — an encroaching amber force
pressing in from the edges, held back and slowly defeated by a calm center force the
user's presence sustains. Every 3-4 minutes, a single tap recommits them to the hold.
A coach delivers one calibration line at each tap point — not motivation, information
about where they are on the craving curve. At 20 minutes, the battle is won. The
screen clears. The session is logged.

No food logging. No accounts. No notifications required. No subscription.
A tool that works.

### The Science

Evening food cravings in non-hungry individuals are dopamine-driven, not metabolic.
The brain's reward system fires in response to a conditioned cue — couch, TV, time
of day — triggering a craving that mimics urgency. The food is incidental.
The reward loop is the target.

Dopamine-driven cravings peak and subside within 15-20 minutes if not acted on.
This is documented in ACT (Acceptance and Commitment Therapy) research and
behavioral nutrition literature. The app does not suppress the craving.
It outlasts it.

The visual battle mechanic adds a second layer: visual-spatial cognitive engagement
occupies the same brain resources used to imagine food. The user is not doing a task.
They are watching something unfold. The attention hold is effortless and automatic —
exactly what craving research shows works for distraction-based intervention.

The recommitment tap creates a periodic conscious decision point. Quitting requires
an active choice — missing a tap, putting the phone down. Staying requires almost
nothing. The friction is asymmetric by design.

### The Insight That Drives Everything

When a craving hits, the user is already reaching for their phone.
Holdout is what they open instead of the fridge.

This is not a blocker placed between the user and food.
It is a redirect that works with existing behavior — the hand reaching for
something — and gives it somewhere better to go.

### Target User

- 25-50, any gender
- Goal-oriented, responds to visible progress
- Does not identify as having a clinical eating disorder —
  evening snacking is a habit, not a condition
- Actively repelled by wellness app aesthetics
- Wants a tool that works, not an app that makes them feel better about failing

### Competitive Position

Every craving app in the market is either:
- A food logger (MyFitnessPal, Lose It) — logs after the fact, does nothing
  in the moment
- A mindfulness tool (Cravr, mindful eating apps) — soft, clinical, therapeutic
  in tone, passive
- A timer with affirmations — static, no engagement, no visual

Nobody has built a real-time visual representation of a craving being defeated.
Nobody uses the phone-as-redirect framing. Nobody has the battle metaphor.

The differentiation is structural, not cosmetic. It cannot be copied without
copying the entire concept.

### Monetization

**V1: $4.99 flat fee, one-time purchase.**
No subscription. No free tier. No ads.
Rationale: differentiates from every competitor, eliminates purchase anxiety,
signals tool not toy.

**V2: Optional $1.99 unlock for battle visual themes.**
Different visual aesthetics — same mechanic, different art direction.
Example: ocean tide vs fire vs storm. Each tells the same battle story differently.
This is cosmetic monetization that does not gate the core function.

**V3: Claude API dynamic coach (Cloudflare Worker proxy).**
Dynamic coaching that adapts to the user's streak, time of day, craving type.
Subscription-worthy only if the dynamic coaching is genuinely better than static.
Test static first. Add dynamic only with evidence.

### ASO Strategy

**App Name:** Holdout: Beat Your Cravings

**Subtitle:** Your 20-Min Craving Battle

**Keywords to own:**
craving, food urge, snack, holdout, 20 minutes, craving control,
urge timer, beat cravings, habit

**Screenshot strategy:**
- Screenshot 1: Battle visual mid-session (minute 8) — amber pressing in,
  center holding. Caption: "Watch your craving lose."
- Screenshot 2: Session complete — clear screen, won state.
  Caption: "20 minutes. It's gone."
- Screenshot 3: History screen — visual record of past battles.
  Caption: "Your fight record."
- Screenshot 4: Session start screen.
  Caption: "One tap. 20 minutes. Science-backed."

---

## Part 2: Product Specification

### Core Session Flow

**State 0: Idle (Home Screen)**
- Dark background (#0D0D0D)
- App name "HOLDOUT" small at top
- Single large button: "I'M HAVING A CRAVING"
- Below button: current streak (number of consecutive wins)
- Bottom navigation: Home | History
- Nothing else

**State 1: Session Active (Battle Screen)**
- Full screen battle visual begins immediately on session start
- Amber force visible at edges, pushing inward
- Cool center force (#F0F0F0 or soft blue-white) holds from center outward
- Single coach message appears at bottom for 4 seconds then fades
- Timer running — not displayed prominently (time display optional, small)
- No exit button visible

**State 2: Milestone Coach Lines (silent, at 4/8/12/16 min)**
> **Mechanic update (2026-04-04):** The "Still holding?" tap prompt with 30s timeout is
> removed. Coach lines fire silently at milestones — no interaction required. User controls
> are SUPPORT ME (on-demand coach) and GAVE IN (two-stage explicit button). No timeout ends
> the session. Staying requires nothing beyond being present.

- Battle visual pulses (shockwave ring in shader) at each milestone
- Coach calibration line appears at bottom (7s display), then fades
- No tap required — session continues automatically
- SUPPORT ME: on-demand coach line + shockwave pulse, any time
- GAVE IN: two-stage confirm (3s auto-reset on first tap) — explicit session end

**State 3: Session Won (20 minutes)**
- Battle visual completes — amber fully retreated to edges, then gone
- Screen holds the clear state for 3 seconds — still, complete
- Coach delivers close line
- "You held it." confirmation
- Stats update — streak increments
- Return to Home button appears after 3 seconds

**State 4: Session Gave-In (missed recommitment tap)**
- No dramatic animation — amber simply stops being pushed back,
  slowly re-advances
- After 30 seconds of no response: session ends quietly
- "Session ended." — no judgment, no shame copy
- Streak resets
- Return to Home

### Recommitment Tap Schedule

| Tap # | Approximate Minute | Coach Line |
|-------|-------------------|------------|
| 1 | Minute 4 | "Craving peaks in the first 5 minutes. You're through it." |
| 2 | Minute 8 | "Minute 8. Hardest point. Goes down from here." |
| 3 | Minute 12 | "Past the peak. Nothing left for the craving to grow into." |
| 4 | Minute 16 | "Four minutes. It's already lost." |
| Win | Minute 20 | "That's 20 minutes. You held it." |

Note: exact timing can vary ±30 seconds to prevent mechanical feel.
The coach lines are calibration statements, not motivation.
They tell the user where they are on the craving curve — factual, brief, precise.

### The Battle Visual — Technical Specification

**The metaphor:** an encroaching force held and defeated by presence.
The user's staying causes the victory. No interaction required beyond recommitment taps.

**Visual behavior over session duration:**

Minutes 0-4 (amber advances):
- Amber gradient pushes inward from all four edges
- Movement is slow, organic, not mechanical
- Center remains clear/light
- Feels like pressure building

Minutes 4-8 (hold begins):
- Amber advance slows — the center is holding
- Visual tension at the boundary between amber and center
- The line between them is not sharp — it breathes slightly

Minutes 8-14 (the turn):
- Center begins slowly reclaiming ground
- Amber retreats incrementally — not fast, barely perceptible at first
- By minute 12 the shift is clear

Minutes 14-20 (amber retreats):
- Center force clearly winning
- Amber compressed to edges, shrinking
- By minute 18: thin amber border at screen edge only
- Minute 20: amber pulse at edges, then gone. Screen holds clear.

**Implementation approach (as built — supersedes original plan):**
> BattleVisual uses a SKSL fragment shader via `@shopify/react-native-skia`
> (RuntimeEffect), not linear gradients. See `docs/architecture/decisions.md`
> and `docs/architecture/patterns.md` for the authoritative record.

- `@shopify/react-native-skia` RuntimeEffect — SKSL shader compiled at module load
- Single `progress` SharedValue (0.0–1.0) drives `baseRadius` in shader
- Time clock: `useFrameCallback` throttled at 30fps (33ms gate) — drives turbulence
- No particle effects, no physics — pure shader math
- 30fps shader submit cap on a 4-octave FBM — confirmed no device heat

**Color palette:**
- Amber force: #F5A623 → #E8630A (inner edge darker)
- Center force: #F0F0F0 → #FFFFFF at center
- Background: #0D0D0D
- Won state: #FFFFFF fading to #F0F0F0 — still and clean
- Gave-in drain: amber slowly re-advances, center force dims to grey

### History Screen

Not a stats dashboard. A visual record.

Each past session is a small thumbnail of the battle visual at its completed state.
Won sessions: clear center, full victory. Gave-in sessions: partially cleared,
amber visible at edges. The history is visual evidence of battles fought.

Below the thumbnails: win rate percentage (large), current streak (large),
total sessions. That is all.

No food data. No calories. No weight. No external benchmarks.

---

## Part 3: Functional Specifications

### Session Management

- One active session at a time — prevent double-start with button disable on tap
- Session record: id, startTime, endTime, result (won/gaveIn), duration,
  recommitmentsCompleted, cravingType (from onboarding preference)
- Sessions stored in AsyncStorage — local only, no sync
- Session is considered gave-in if: user misses recommitment tap for 30 seconds,
  OR user navigates away from battle screen
- No "early win" — session must reach minute 20 to count as won

### Milestone Logic

> **Mechanic update (2026-04-04):** Recommitment taps and 30s timeout-to-gave-in are removed.
> Milestones fire silently. See decisions.md "Removed forced recommitment overlay" for rationale.

- Timer starts on session start
- At each scheduled milestone (4/8/12/16 min ± 30s random offset):
  - Shockwave pulse ring fires in shader (Gaussian ring expanding outward)
  - Coach calibration line fades in (7s display, no interaction required)
  - Progress bar milestone dot lights amber and pop-scales
  - milestonesReached incremented on session record
- SUPPORT ME: on-demand coach line + shockwave, available any time during session
- GAVE IN: two-stage explicit end — first tap enters confirm state (3s auto-reset), second tap ends session

### App State Handling

- App backgrounded during session: session continues running,
  timer keeps counting. On return to foreground: recalculate elapsed time,
  update visual position accordingly.
  If user was gone past a recommitment window: session ends as gave-in.
- App killed during session: on next launch detect unfinished session,
  mark as gave-in, update record.
- Phone locked during session (screen off): session continues,
  timer runs. On unlock: visual catches up to current position.

### Streak Calculation

- Streak = consecutive won sessions with no gave-in between them
- A gave-in session breaks the streak regardless of gap between sessions
- No daily requirement — streak is purely consecutive wins, not daily wins
- All-time best streak stored separately

### Onboarding

Three screens, shown once on first launch:

Screen 1: "What kind of craving hits you?"
Options: Sweet / Salty / Crunchy / Comfort food / Anything
(used for future coach personalization, not currently visible in V1)

Screen 2: "When does it usually hit?"
Time range picker — used only for future insights, not gating anything

Screen 3: Brief explanation of how the app works — one paragraph,
plain language, no wellness framing. "A 20-minute visual battle.
Stay on screen. Win. The science is real."

No notification permission required. No account. No email.

---

## Part 4: Non-Functional Specifications

### Performance
- Battle visual animation must run at 60fps on iPhone XR and newer
- Session start to first frame of battle visual: under 500ms
- Recommitment tap response (prompt dismiss): under 100ms
- AsyncStorage read on app launch: under 200ms

### Offline
- Fully offline. No network calls in V1. No analytics. No crash reporting
  in V1 (add Sentry in V2 after launch).
- Claude API integration (V3) uses Cloudflare Worker proxy —
  graceful fallback to static coach lines if network unavailable

### Accessibility
- All interactive elements minimum 44x44pt touch targets
- Coach text minimum 16pt, high contrast against dark background
- Recommitment tap target: large — minimum 120x120pt
- VoiceOver labels on all interactive elements

### Data
- All data local — AsyncStorage
- No user accounts, no server, no sync
- Privacy policy: one paragraph, genuinely accurate.
  "Holdout stores your session history on your device.
  No data leaves your phone. No accounts. No tracking."

### Platforms
- iOS first — iPhone only, no iPad optimisation in V1
- iOS 15+ minimum (covers 97%+ of active iPhones)
- React Native / Expo — same stack as Daily Goals

---

## Part 5: What to Give Claude Code

### Step 1: Knowledge Extraction From Daily Goals

Open Claude Code inside the Daily Goals project folder and run this:

```
Read all configuration and source files in this project.

I am building a new app called Holdout using the same React Native / Expo stack.
Extract and document everything I should carry forward:

1. EAS configuration: eas.json settings, account slug, Apple Team ID,
   bundle identifier convention, credential approach
2. expo-notifications setup: how permission is requested, how notifications
   are scheduled, any gotchas encountered
3. AsyncStorage patterns: how data is structured, key naming conventions
4. Navigation structure: how screens are organised, navigation library version
5. Styling approach: how styles are defined, any shared theme or token files
6. Component patterns: reusable component structure and naming conventions
7. App.js / entry point: how the app is initialised
8. package.json dependencies: list all installed packages with versions
9. Any build or EAS lessons learned — things that were hard to figure out

Format the output as a document I can paste into the new project's
docs/architecture/decisions.md under "## Extracted From Daily Goals".
Also list which specific files or components I should copy directly into Holdout.
```

### Step 2: Create the Holdout Project

Open Claude Code in your Projects folder (not inside Daily Goals) and run:

```
Create a new React Native / Expo project called "Holdout".

Use the same Expo SDK version as Daily Goals: [paste version from extraction output].

Create this folder structure:
  src/
    components/        — reusable UI components
    screens/           — full screen components
    services/          — SessionService, StreakService, CoachService
    animations/        — BattleVisual animation logic
    storage/           — AsyncStorage wrappers
    constants/         — colors, timing, coach messages
  docs/
    architecture/
      decisions.md
      constraints.md
      patterns.md
    context/
      domain.md
    quality/
      grading.md
  tests/
    validation-scenarios.md

Install these dependencies:
  @react-navigation/native
  @react-navigation/native-stack
  react-native-screens
  react-native-safe-area-context
  @react-native-async-storage/async-storage
  react-native-reanimated
  react-native-linear-gradient

Create CLAUDE.md in the project root.
Create claude-prompts.md in the project root.
```

### Step 3: Populate CLAUDE.md

After project creation, open CLAUDE.md and replace with this:

```markdown
# Holdout — Claude Code Intelligence

## ALWAYS READ THESE FILES FIRST
Before responding to any request, read in order:
1. docs/Holdout_V2_Master_Brief.md — complete product spec and business plan
2. docs/architecture/constraints.md — non-negotiables

Confirm by stating: the core mechanic in one sentence, and the two things
that must never be added to this app.

---

## Project
React Native / Expo iOS app. Local AsyncStorage only. No backend. No auth.
Core mechanic: 20-minute visual battle — amber force defeated by user's presence.
Recommitment tap every 3-4 minutes. Coach delivers calibration lines, not motivation.

## Stack
Framework: React Native / Expo
Language: JavaScript / TypeScript
Storage: AsyncStorage (local only)
Animation: React Native Reanimated 2
Build: EAS Cloud (Windows) + Expo Go for daily iteration

## Key Files
src/screens/HomeScreen        — idle state, single CTA button, streak
src/screens/BattleScreen      — active session, battle visual, recommitment
src/screens/HistoryScreen     — visual session history, win rate, streak
src/screens/OnboardingScreen  — 3-screen first launch flow
src/animations/BattleVisual   — the animated gradient battle (core component)
src/services/SessionService   — session start/end/gave-in logic
src/services/StreakService     — streak calculation from session history
src/services/CoachService     — returns calibration line for given minute mark
src/storage/sessions          — AsyncStorage CRUD for session records
src/storage/preferences       — AsyncStorage for onboarding preferences
src/constants/colors          — design tokens
src/constants/timing          — session duration, recommitment schedule
src/constants/coach           — all coach message pools

## Constraints
Full detail in docs/architecture/constraints.md. Summary:
NEVER: backend, database, server, Supabase, Firebase
NEVER: user accounts, authentication, sign-in
NEVER: food logging, calories, macros, diet content
NEVER: mindfulness, breathing, meditation, journaling
NEVER: therapy language — "Be kind to yourself", "Take a deep breath"
NEVER: the word "craving" in any coach message — coach says "it" not "craving"
ALWAYS: coach lines are calibration statements, not motivation
ALWAYS: gave-in result has zero shame or judgment in any copy

## Daily Goals Extraction
[Paste extraction output here after running Step 1]

## Current Phase
Phase 1 — Core Mechanic

## Decisions Made
[Date each entry as you add them]

## Mistakes Encountered
[Add every mistake and fix immediately after it occurs]
```

### Step 4: Populate the Constraints File

Create `docs/architecture/constraints.md`:

```markdown
# Holdout — Non-Negotiable Constraints

## Product
- No backend, remote database, or server of any kind
- No user accounts or authentication
- No food logging, calorie tracking, or diet content of any kind
- No mindfulness, breathing exercises, meditation, or journaling
- No therapy language anywhere in the app or coach copy
- No push notifications in V1 — app works entirely in foreground
- No social features, sharing, leaderboards, or community

## Coach Voice
- Coach lines are calibration statements about the craving curve — not motivation
- Coach never uses the word "craving" — says "it" ("it's fading", "it peaks here")
- Each line under 15 words
- Zero judgment or shame on gave-in result
- Zero cheerleading or forced positivity

## Technical
- React Native Reanimated 2 for all animations — no other animation libraries
- AsyncStorage only — no SQLite, no Realm, no other local DB
- No analytics or crash reporting in V1
- No hardcoded API keys anywhere
- Session result is binary: won or gaveIn — no partial states

## Visual
- Battle visual runs at 60fps minimum on iPhone XR
- No particle effects, physics engines, or 3D — pure gradient animation
- Dark background (#0D0D0D) only — no light mode in V1
- Amber (#F5A623) is the craving force — not used for positive states
```

### Step 5: Populate the Domain Context File

Create `docs/context/domain.md`:

```markdown
# Holdout — Domain Context

## The Core Mechanism
Dopamine-driven cravings peak and subside within 15-20 minutes without action.
The app outlasts the craving. The user does not suppress it — they survive it.

## The Visual Metaphor
The battle visual externalises the craving as a visible force that can be watched
losing. This serves two functions:
1. Visual-spatial engagement occupies the brain resources used to imagine food
2. The user can see themselves winning in real time — the overcome feeling is
   shown, not told

The amber force represents the craving — not the user's weakness, not a villain.
Just a force. It advances when unmet and retreats when held against.
The user's presence is what defeats it. Staying is the action.

## The Coach's Role
The coach provides one thing: location on the craving curve.
Not encouragement. Not cheerleading. Information.
"Minute 8. Hardest point. Goes down from here." — this is factual.
The user trusts the coach because the coach tells the truth about the difficulty,
not a softened version of it.

The coach never says "craving" — that word activates the very neural pathway
we are trying to quiet. The coach says "it" — distant, object-like, already
losing power.

## The Recommitment Tap
The tap is a conscious decision point, not an interaction feature.
Its purpose is to prevent passive drift — the user putting the phone down
without fully deciding to quit. The tap makes staying an active choice.
Missing a tap is gave-in. Tapping is staying. Simple, honest, binary.

## Gave-In Handling
Zero judgment. Zero shame. Zero copy that implies the user failed.
"Session ended." Full stop. Stats update. Streak resets.
The next session is one tap away.
A gave-in at minute 18 still means 18 minutes of fighting.
The record reflects that — session duration is logged regardless of outcome.
```

---

## Part 6: Build Sequence — Phase 1

Build in this exact order. Each component depends on the one before it.

### Build 1: Constants and Storage Layer
```
Build these files first — no UI yet:

src/constants/colors.js — all design tokens:
  BACKGROUND: '#0D0D0D'
  AMBER: '#F5A623'
  AMBER_DARK: '#E8630A'
  CENTER_FORCE: '#F0F0F0'
  CENTER_BRIGHT: '#FFFFFF'
  TEXT_PRIMARY: '#F0F0F0'
  TEXT_SECONDARY: '#888888'
  WIN: '#FFFFFF'

src/constants/timing.js:
  SESSION_DURATION_MS: 20 * 60 * 1000
  RECOMMITMENT_TIMEOUT_MS: 30 * 1000
  COACH_LINE_DISPLAY_MS: 4000
  RECOMMITMENT_SCHEDULE: [
    { minute: 4, variance: 30 },
    { minute: 8, variance: 30 },
    { minute: 12, variance: 30 },
    { minute: 16, variance: 30 },
  ]

src/constants/coach.js — all coach message pools:
  Session start: 3 variants
  Each recommitment tap (minutes 4, 8, 12, 16): 2-3 variants each
  Win close: 2 variants
  (Use the messages from the product spec)

src/storage/sessions.js — AsyncStorage CRUD:
  saveSession(session), getSessions(), updateSession(id, updates)
  Session shape: { id, startTime, endTime, result, duration,
  recommitmentsCompleted, cravingType }

src/storage/preferences.js:
  savePreferences(prefs), getPreferences()
  Prefs shape: { cravingType, cravingWindow, onboardingComplete }
```

### Build 2: Services
```
src/services/SessionService.js:
  startSession(cravingType) — creates session record, returns sessionId
  completeSession(sessionId) — marks won, calculates duration
  abandonSession(sessionId) — marks gaveIn, calculates duration
  getActiveSession() — returns unfinished session if exists (for crash recovery)

src/services/StreakService.js:
  getCurrentStreak(sessions) — consecutive wins from most recent backward
  getBestStreak(sessions) — all-time highest consecutive wins
  calculateWinRate(sessions) — won / total as percentage

src/services/CoachService.js:
  getStartMessage() — random from start pool
  getRecommitmentMessage(minuteMark) — random from correct pool
  getWinMessage() — random from win pool
```

### Build 3: BattleVisual Animation
```
src/animations/BattleVisual.js

This is the core component. Build it before any screens.

Props:
  progress: 0.0 to 1.0 (0 = session start, 1 = session complete)
  isActive: boolean
  onAnimationFrame: callback (optional, for debugging)

Behaviour:
  - Uses React Native Reanimated 2 animated values
  - amberRadius: animated value controlling how far amber extends from edges
    At progress 0.0: amber fills to 85% of screen radius from edges
    At progress 0.5: amber at 65% — the hold is clearly working
    At progress 0.8: amber at 30% — clearly retreating
    At progress 1.0: amber at 0% — gone
  - centerRadius: animated value for center force expansion
    Inverse relationship to amberRadius
  - Use react-native-linear-gradient RadialGradient for center force
  - Use multiple LinearGradient views positioned at edges for amber
  - All progress changes use withTiming(value, { duration: 3000 })
    for slow organic movement — never snap, always ease

Win state: hold progress at 1.0 for 2 seconds,
  then fade entire visual to white (#FFFFFF) over 1 second,
  then hold white for 1 second, then fade to background color

Gave-in drain: when isActive becomes false mid-session,
  animate progress backward toward 0 over 5 seconds — amber re-advances
```

### Build 4: Screens
```
Build in order:
1. OnboardingScreen (3 sub-screens, only shown once)
2. HomeScreen (idle state, CTA button, streak display)
3. BattleScreen (uses BattleVisual, handles recommitment logic)
4. HistoryScreen (session thumbnails, win rate, streak)
```

### Build 5: Navigation and App Entry
```
App.js:
  Check onboardingComplete from preferences
  If false: show Onboarding
  If true: show main tab navigation (Home | History)
  Check for unfinished session on launch — if found, mark as gaveIn

Navigation:
  Bottom tabs: Home | History
  BattleScreen is a modal presented over Home — not a tab
```

---

## Part 7: Phase 1 Sign-Off Checklist

Do not proceed to Phase 2 until every item passes on a physical iPhone.

- [ ] Onboarding completes and preferences save correctly
- [ ] Home screen shows correct streak after sessions
- [ ] Session starts immediately on CTA tap — visual appears under 500ms
- [ ] Battle visual advances amber correctly in first 4 minutes
- [ ] Battle visual shows clear hold from minute 4-8
- [ ] Battle visual shows retreat from minute 8-14
- [ ] Battle visual shows victory from minute 14-20
- [ ] Recommitment prompt appears at approximately correct minute marks
- [ ] Tapping recommitment prompt dismisses it and session continues
- [ ] Missing recommitment tap for 30 seconds ends session as gave-in
- [ ] Won session: visual completes, coach close line appears, streak increments
- [ ] Gave-in session: no judgment copy, streak resets, return to home works
- [ ] Backgrounding app mid-session: on return, visual is at correct position
- [ ] App killed mid-session: on relaunch, session marked as gave-in
- [ ] History screen shows correct thumbnails and statistics
- [ ] Animation runs at 60fps on the oldest iPhone you have access to
- [ ] Personal validation: ran 5+ real sessions, mechanic genuinely works on you

---

## Part 8: What Changes From the Previous Holdout Plan

For Claude Code context — summarise what was abandoned and why:

**Abandoned: SwiftUI on Windows**
Reason: 15-20 minute EAS build cycle is incompatible with the iteration speed
needed to tune animation behavior. React Native with Expo Go gives instant
visual feedback — essential for animation work.

**Abandoned: Push notification coach mechanic**
Reason: The new mechanic keeps the user on screen — notifications are irrelevant.
The coach now delivers messages during recommitment taps, not via the lock screen.
This eliminates permission complexity entirely.

**Abandoned: Holdout Playbook Option 1 (SwiftUI)**
Replaced by this document and the React Native approach.

**Carried forward from Daily Goals:**
- EAS account configuration and Apple credentials
- AsyncStorage patterns
- Navigation structure (react-navigation/native-stack)
- EAS build workflow for Windows
- App Store Connect and TestFlight knowledge
- Component structure conventions

**New in this version:**
- React Native Reanimated 2 animation library
- react-native-linear-gradient for gradient visuals
- BattleVisual as the core product component
- Recommitment tap mechanic replacing notifications
- Visual session history replacing stats scoreboard

---

*Nova Ventures Co. · Holdout V2 Master Brief · March 2026*
