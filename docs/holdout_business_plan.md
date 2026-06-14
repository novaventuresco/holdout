# HOLDOUT — Business Plan & Product Specification
### Nova Ventures Co. | Version 2.0 | March 2026

> **Mechanic update (2026-04-04):** The forced recommitment tap (periodic overlay + 30s timeout-to-gave-in)
> was replaced. Coach lines still fire silently at minutes 4/8/12/16 (shockwave + line, no interaction
> required). GAVE IN is now an explicit two-tap button. No timeout ends the session. See
> docs/architecture/decisions.md for rationale.

---

## 1. PRODUCT VISION

### The Insight
When a craving hits, the user is already reaching for their phone.
Holdout is what they open instead of the fridge.

This is not a blocker placed between the user and food. It is a redirect
that works with the existing behavior — the hand reaching for something —
and gives it somewhere better to go.

### What It Is
Holdout is a 20-minute craving tool built around a visual battle. When a
craving hits, the user opens the app and watches an amber force pressing in
from the screen edges — the craving made visible. A cool center force holds
from the middle outward, pushed back by the user's presence on screen.
Every 3-4 minutes a recommitment tap confirms they are still there. A coach
delivers one calibration line at each tap — a factual statement about where
they are on the craving curve, not motivation. At 20 minutes, the amber
retreats completely. The session is won.

The user does not suppress the craving. They watch it lose.

### What It Is Not
- Not a calorie counter or food logger
- Not a mindfulness or meditation app
- Not a diet ideology app (no keto, no macros, no meal plans)
- Not a notification-driven coach (no push notifications required)
- Not soft, clinical, or therapeutic in tone
- Not a subscription guilt machine

### The Core Behavioral Promise
Cravings driven by dopamine reward loops — not hunger — peak in intensity
and then naturally subside within 15-20 minutes if not acted upon. The only
job of this app is to keep the user present for those 20 minutes. After
that, the craving loses its power on its own. The science does the work.
The visual makes the science visible. The coach tells the user where they
are in it.

---

## 2. THE SCIENCE

Every product decision must be traceable to one of these mechanisms.

### 2.1 The Craving Cycle (Dopamine Loop)
Evening food cravings in non-hungry individuals are dopamine-driven, not
metabolic. The brain's reward system fires in response to a conditioned cue
(couch, TV, time of day, stress wind-down), triggering a craving signal that
mimics urgency. The food is almost incidental. The reward loop is the target.

**Product implication:** The app is not fighting hunger. It is interrupting
an automated neurological response. The user's rational brain is on our side
— we just need to keep them present long enough for the craving to collapse.

### 2.2 The 20-Minute Collapse Window
Dopamine-driven cravings peak and then subside within 15-20 minutes when not
reinforced by action. This is documented in addiction literature (ACT —
Acceptance and Commitment Therapy) and behavioral nutrition research.
20 minutes is the biologically grounded hold time — not 10 (craving still
peaking), not 30 (compliance collapses).

**Product implication:** Sessions are exactly 20 minutes. Non-negotiable.

### 2.3 The Urge Surfing Framework (ACT)
Urge surfing treats a craving as a wave that rises, peaks, and falls. The
key finding: cravings are not conquered by willpower — they are outlasted.
The user does not need to suppress the craving. They need to ride it.

**Product implication:** The visual externalises this. The amber force is
the wave. The user watches it peak and fall. The coach marks the inflection
points. The user is not suppressing — they are watching themselves win.

### 2.4 The Craving Curve Map
Cravings are non-linear. Most intense in the first 5-8 minutes. Minutes
8-14 are the danger zone — intensity has not fully dropped but initial
resolve has weakened. Minutes 14-20 see rapid decline. Users who reach
minute 12 almost always reach minute 20.

**Product implication:** The visual is calibrated to this curve. Amber
advances hardest in minutes 0-8. The turn becomes visible at minute 8.
The coach's hardest-hitting line is at minute 8 — the genuine danger point.

### 2.5 Cognitive Interference (Visual-Spatial Hijack)
Research shows that visual-spatial cognitive engagement occupies the same
brain resources used to imagine food. Playing Tetris for 3 minutes
measurably reduces craving intensity (Plymouth University, 2015). The iCrave
app (2014) showed significant craving reduction by redirecting cognitive
resources during active cravings.

**Product implication:** The battle visual is not decoration. It is a
cognitive intervention. The user's visual attention on the unfolding battle
occupies the exact brain resources the craving uses. The engagement is
effortless — watching something unfold, not doing a task.

### 2.6 Identity Reinforcement (Atomic Habits)
Identity-level shifts ("I'm someone who holds") produce more durable
behavior change than outcome goals ("I want to lose weight"). Every
completed hold is evidence of who the user is. The visual record of past
sessions — won battles shown as clear screens, gave-in sessions as partially
cleared ones — is identity evidence, not a stats dashboard.

**Product implication:** The history screen is visual proof of battles
fought, not numbers on a leaderboard. The streak reinforces identity,
not performance.

---

## 3. TARGET MARKET

### Primary User
- Age 25-50, any gender
- Goal-oriented, responds to visible progress
- Does not identify as having a clinical eating disorder —
  evening snacking is a habit, not a condition
- Actively repelled by wellness app aesthetics and language
- Wants a tool that works, not an app that makes them feel better
  about failing
- Responds to the feeling of overcoming something and having done
  something real

### Secondary User
- Anyone who has looked at Noom, MyFitnessPal, or Headspace and found
  the tone insufferable
- People who respond to competitive framing over gentle encouragement

### Who This Is NOT For
- Clinical eating disorder patients — refer to professional help
- People who need calorie tracking for medical reasons
- Users who want community features and social accountability

### Market Size
Evening snacking and food craving management is a mainstream problem.
The addressable user base is in the tens of millions. Conversion does not
require a large slice — 0.1% of the addressable market at $4.99 is
meaningful indie revenue.

---

## 4. COMPETITIVE LANDSCAPE

| App | Mechanic | Tone | Price | Gap |
|-----|----------|------|-------|-----|
| Hungr | 10-min delay timer, breathing | Clinical, corporate | Subscription | No personality, no visual |
| Cravr | Urge surfing, AI reflection | Therapeutic, journaling | Subscription | Passive, reflective |
| FoodT | Brain training game | Academic | Free | Not a craving tool |

**The actual gap:** No app exists that visualizes the craving as a
defeatable force the user watches losing in real time. No app uses the
phone-as-redirect framing. No app has this visual mechanic. The
differentiation is structural — it cannot be copied without copying the
entire concept.

---

## 5. THE VISUAL BATTLE — Specification

### The Metaphor
An encroaching force held and defeated by presence. The user's staying
causes the victory. No interaction required beyond recommitment taps.

### Behavior Over Session Duration

**Minutes 0-4 (amber advances):**
Amber gradient pushes inward from all four screen edges. Movement is slow,
organic, not mechanical. Center remains clear. Feels like pressure building.

**Minutes 4-8 (hold begins):**
Amber advance slows — the center is holding. Visual tension at the boundary.
The line between amber and center breathes slightly. Not sharp, not soft.

**Minutes 8-14 (the turn):**
Center begins slowly reclaiming ground. Amber retreats incrementally —
barely perceptible at first. By minute 12 the shift is clearly visible.

**Minutes 14-20 (amber retreats):**
Center force clearly winning. Amber compressed to edges, shrinking.
By minute 18: thin amber border only. Minute 20: amber pulses at edges,
then gone. Screen holds clear for 3 seconds — still, complete.

### Won State
Screen clear. Coach delivers close line. "You held it." Confirmation.
No flash, no confetti. Still. Complete. The overcome feeling is in the
stillness, not a celebration animation.

### Gave-In State
> **Mechanic update (2026-04-04):** GAVE IN is an explicit two-stage button — user must
> affirmatively tap twice to end the session. There is no 30-second timeout. There is no
> missed-tap mechanic. Staying requires nothing. Quitting requires a deliberate choice.

Amber stops being pushed back. Slowly re-advances. "Session ended." No judgment. No shame.
Stats update. Streak resets. Return to home.

### Color Palette
- Amber force: `#F5A623` → `#E8630A` (inner edge darker)
- Center force: `#F0F0F0` → `#FFFFFF` at center
- Background: `#0D0D0D`
- Won state: screen holds clear — `#F0F0F0` fading to background
- Gave-in: amber re-advances, center dims to `#888888`

---

## 6. THE COACH — Specification

### Role
The coach provides one thing: location on the craving curve. Not
encouragement. Not cheerleading. Information. "Minute 8. Hardest point.
Goes down from here." — this is factual. The user trusts the coach because
the coach tells the truth about the difficulty, not a softened version.

### Voice Principles
- Calibration, not motivation
- Under 15 words per line
- Never uses the word "craving" — says "it" (distant, already losing power)
- Zero judgment or disappointment on gave-in
- Silence between appearances is intentional — coach speaks at inflection
  points only, not constantly

### Recommitment Schedule and Coach Lines

| Tap # | Approx Minute | Coach Line |
|-------|--------------|------------|
| Start | 0 | "It peaks in the first few minutes. You're in it." |
| 1 | 4 | "It's already peaked. You're past the worst." |
| 2 | 8 | "Minute 8. Hardest point. Goes down from here." |
| 3 | 12 | "Past the peak. Nothing left for it to grow into." |
| 4 | 16 | "Four minutes. It's already lost." |
| Win | 20 | "That's 20 minutes. You held it." |

Each minute mark has a pool of 2-3 variants. Coach returns a random
variant so sessions don't feel scripted.

### What the Coach Never Says
- "You've got this" — generic, meaningless
- "Be proud of yourself" — therapeutic
- "Take a deep breath" — mindfulness
- "You're doing great" — empty affirmation
- The word "craving" — activates the very pathway we're quieting
- Anything implying the user failed on a gave-in result

---

## 7. UX / UI SPECIFICATION

### Design Philosophy
Industrial. Data-focused. The feeling of a high-stakes scoreboard crossed
with something that is happening to you right now. Not a wellness app.
Not a game. A tool with aesthetic conviction.

### Screen Specifications

**Home Screen (Idle State)**
- Background: `#0D0D0D`
- App name "HOLDOUT" small at top in display font
- Single large button center screen — amber, label: "I'M HAVING A CRAVING"
- Below button: current streak number, large, white
- Bottom tab navigation: Home | History
- Nothing else — no tips, no quotes, no additional UI

**Battle Screen (Active Session)**
- Full screen battle visual — begins immediately on session start
- Amber pushes from edges, center holds clear
- Coach line appears at bottom, fades after 4 seconds
- No countdown timer displayed prominently (optional: small, unobtrusive)
- No visible exit button — intentional friction
- Recommitment prompt: "Still holding?" with large tap target, appears
  with gentle visual pulse at scheduled minute marks

**History Screen**
- Each past session shown as a small thumbnail of the battle visual
  at its completed state
- Won: clear center, full victory visual
- Gave-in: partially cleared, amber still visible at edges
- Below thumbnails: win rate % (large), current streak (large),
  total session count
- No food data. No calories. No weight.

**Onboarding (3 screens, shown once)**
- Screen 1: "What kind of craving hits you?"
  Options: Sweet / Salty / Crunchy / Comfort food / Anything
- Screen 2: "When does it usually hit?"
  Time range picker (for future insights, not gating anything)
- Screen 3: One paragraph explaining the mechanic in plain language.
  "A 20-minute visual battle. Stay on screen. Win. The science is real."
- No notification permission required

### Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#0D0D0D` | All screens |
| Amber (craving) | `#F5A623` | Battle visual edge force, CTA button |
| Amber dark | `#E8630A` | Amber force inner edge |
| Center force | `#F0F0F0` | Battle visual center |
| Center bright | `#FFFFFF` | Center at full hold |
| Text primary | `#F0F0F0` | Headlines, large numbers |
| Text secondary | `#888888` | Labels, subtitles |
| Won state | `#FFFFFF` | Clear screen at session complete |
| Display font | Barlow Condensed / Bebas Neue Bold | App name, CTA |
| Body font | DM Sans / Plus Jakarta Sans | Coach lines, labels |

### Haptics
- Session start: firm single impact
- Each recommitment tap confirmation: medium impact
- Session won at minute 20: strong double impact
- Gave-in timeout: no haptic — quiet end

---

## 8. TECHNICAL ARCHITECTURE

### Platform
- iOS first — iPhone only, no iPad optimisation in V1
- iOS 15+ minimum (covers 97%+ of active iPhones as of 2026)
- React Native / Expo — same stack as Daily Goals

### Stack Decision
SwiftUI was the original plan. Pivoted to React Native for one decisive
reason: animation work requires instant visual feedback. React Native with
Expo Go provides 2-3 second iteration on UI changes. EAS cloud builds
provide 15-20 minute iteration. Tuning the battle visual requires the
fast loop. SwiftUI on Windows cannot provide this.

When MacBook Air arrives: React Native code ports cleanly, and native
features (WidgetKit, Live Activities, Watch) can be added at that point.

### Data Architecture
- All data local — AsyncStorage
- No user accounts, no server, no sync
- Session record shape:
  `{ id, startTime, endTime, result, duration, recommitmentsCompleted, cravingType }`
- Preferences shape:
  `{ cravingType, cravingWindow, onboardingComplete }`

### Animation Architecture
> **Note:** The technical approach below was the original plan. As built, BattleVisual
> uses a SKSL fragment shader via `@shopify/react-native-skia` (RuntimeEffect), not
> linear gradients. A single `progress` SharedValue drives `baseRadius` inside the
> shader. See `docs/architecture/decisions.md` and `docs/architecture/patterns.md`
> for the authoritative implementation record.

- BattleVisual receives a single `progress` prop (0.0 to 1.0)
- All timing logic lives in BattleScreen — BattleVisual is a pure display component
- Progress drives `baseRadius` in SKSL shader: `mix(0.0, 0.65, pow(progress, 1.5))`
- Time clock: `useFrameCallback` throttled at 30fps — drives organic turbulence animation

### App State Handling
> **Mechanic update (2026-04-04):** Backgrounding no longer ends a session. The
> timeout-to-gave-in mechanic is removed entirely. GAVE IN requires explicit user action.

- App backgrounded during session: timer continues, on return recalculate
  elapsed time and update visual position
- App killed during session: on next launch detect unfinished session,
  mark as gave-in
- Phone locked during session: session continues, visual catches up on unlock

### No Notifications — Design Decision
V1 requires no push notification permission. The app works entirely in
the foreground. The recommitment tap replaces the notification mechanic
as the tool that makes quitting a deliberate choice rather than passive
drift. This eliminates permission friction and simplifies the build
significantly.

V3 may add optional notifications for session reminders (not coaching).

---

## 9. DAILY GOALS KNOWLEDGE EXTRACTION

Before building Holdout from scratch, run the knowledge extraction prompt
against Daily Goals in Claude Code. Daily Goals is React Native / Expo —
same stack. Maximum reuse applies.

### What to Extract
- EAS configuration: eas.json, account slug, Apple Team ID, bundle ID
  convention, credential approach
- expo-notifications setup (even though Holdout V1 doesn't use it —
  the permission request pattern is useful reference)
- AsyncStorage patterns: key naming conventions, data structure approach
- Navigation library and version (react-navigation)
- Styling approach: StyleSheet patterns, any shared theme/token files
- Component patterns: how components are structured and named
- App.js / entry point: how the app is initialised and routing decisions
- package.json: full dependency list with versions
- Build and EAS lessons: anything that was hard to configure

### Extraction Prompt for Claude Code (run inside Daily Goals folder)

```
Read all source files and configuration in this project.

I am building a new app called Holdout using the same React Native / Expo stack.
Extract and document everything I should carry forward:

1. EAS config: eas.json settings, account slug, Apple Team ID, bundle ID convention
2. AsyncStorage patterns: key naming, data structures, storage utility patterns
3. Navigation: library, version, how screens are registered and navigated
4. Styling: StyleSheet approach, any shared theme or token files
5. Component structure: how components are named and organised
6. App entry: how App.js initialises routing and first-run detection
7. Dependencies: full package.json dependency list with versions
8. Build lessons: anything that was painful to configure or figure out

List which specific files I should copy directly into Holdout with minimal changes.
Format for pasting into Holdout's docs/architecture/decisions.md.
```

---

## 10. MONETIZATION

### V1: Flat Fee
- Price: $4.99 USD one-time purchase
- No subscription, no free tier, no ads
- Rationale: differentiates from all competitors, eliminates purchase
  anxiety, signals tool not toy

### V2: Visual Themes (Cosmetic)
- $1.99 one-time unlock per theme
- Different battle visual aesthetics — same mechanic, different art
- Examples: ocean tide, electrical storm, deep space
- **Void expansion (planned):** inverted mechanic — background starts as darkness, the white/teal
  center expands outward to fill the screen as progress advances. Amber replaced entirely by void.
  Same shader architecture, different boundary direction and color mapping. High contrast, minimal,
  meditative in tone vs the default fire. Visually represents presence filling the space rather
  than fire being pushed back.
- Never gates the core function — only visual variation
- Rationale: cosmetic monetization that doesn't compromise product integrity

### V3: Claude API Dynamic Coach
- Dynamic coach lines that adapt to streak, time of day, session history
- Cloudflare Worker proxy — key never in app binary
- Subscription only if dynamic coaching is demonstrably better than static
- Validate static first. Add dynamic only with evidence from real usage.

### Revenue Projections (Conservative)

| Scenario | Downloads Year 1 | Revenue |
|----------|-----------------|---------|
| Low | 500 | $2,495 |
| Mid | 2,000 | $9,980 |
| High | 5,000 | $24,950 |
| V2 themes | 2,000 × 20% unlock | +$1,996 |

---

## 11. ASO STRATEGY

**App Name:** Holdout: Beat Your Cravings
**Subtitle:** Your 20-Min Craving Battle

**Primary Keywords:**
craving, food urge, snack, holdout, 20 minutes, craving control, urge timer,
beat cravings, habit

**Screenshot Strategy:**
- Screenshot 1: Battle visual at minute 8 — amber pressing in, center holding.
  Caption: "Watch your craving lose."
- Screenshot 2: Session complete — clear screen, won state.
  Caption: "20 minutes. It's gone."
- Screenshot 3: History screen — visual record of past battles.
  Caption: "Your fight record."
- Screenshot 4: Home screen with CTA button.
  Caption: "One tap. 20 minutes. Science-backed."

**App Store Description Principles:**
- Lead with the insight ("When a craving hits, you reach for your phone.
  Holdout is what you open instead.")
- State the science — briefly, precisely
- No wellness language. No mindfulness. No "journey."
- The description should feel like the product

---

## 12. BUILD PHASES

### Phase 1 — Personal Validation (Weeks 1-2)
Goal: Working app on George's iPhone. Validate that the mechanic works on
a real human. 60%+ holdout rate over 2 weeks before anything ships.

Deliverables:
- [ ] Constants, storage layer, services (no UI)
- [ ] BattleVisual animation component — built and tested in isolation
- [ ] OnboardingScreen (3 screens, first launch only)
- [ ] HomeScreen (CTA button, streak display)
- [ ] BattleScreen (battle visual, recommitment logic, session management)
- [ ] HistoryScreen (visual thumbnails, win rate, streak)
- [ ] App state handling (backgrounded, killed mid-session)
- [ ] EAS development build installing on iPhone

Success metric: >60% holdout rate after 2 weeks of personal use.

### Phase 2 — Polish and App Store (Weeks 3-4)
Goal: Ship-ready product. Full spec in this document Sections 7-8.

Deliverables:
- [ ] Full UI implementation per design spec
- [ ] Haptic feedback throughout
- [ ] Visual theme finalized
- [ ] App icon (dark, amber, no food imagery)
- [ ] Edge cases handled (backgrounded, killed, lock screen)
- [ ] App Store screenshots and description
- [ ] TestFlight beta (5-10 external testers)
- [ ] Privacy policy

### Phase 3 — V2 Claude API Coach (Post-Launch)
Goal: Dynamic coach that adapts to the user's history.
Build only after App Store launch and positive review signal.

---

## 13. RISKS AND MITIGATIONS

| Risk | Severity | Mitigation |
|------|----------|------------|
| Animation performance below 60fps | High | Build BattleVisual first, test on oldest target device before any other work |
| Visual metaphor not legible | High | User test with 5 people in first week — can they explain what the visual means without being told? |
| Recommitment tap feels like friction | Medium | Tune timing — 3-4 minute intervals, 30s timeout. Validate personally first. |
| Session too long (20 min phone use) | Medium | Validate personally. If compliance drops after minute 10, consider 15 min option in V2. |
| Expo animation library limitations | Medium | Evaluate Reanimated 2 capability early. Fallback: react-native-svg animation if gradients underperform. |
| Static coach lines feel repetitive | Low | V3 dynamic coach. Solicit reviews at day 21 before this surfaces. |

---

## 14. SUCCESS METRICS

### Phase 1 (Personal Validation)
- Holdout rate: >60% of sessions result in won
- Usage frequency: app used at least 4x per week
- Craving frequency trend: measurable reduction after 3-4 weeks

### Phase 2 (App Store)
- Rating: above 4.3 stars
- 500 downloads in first 90 days organic
- Reviews mention the visual specifically as differentiating

### Phase 3 (Business)
- 2,000 paid downloads within 12 months
- V2 theme purchase rate: >15% of users
- Zero churn motivation: reviews solicited at day 21

---

## 15. REFERENCES

- ACT Urge Surfing: Hayes, S.C. — craving endurance without suppression
- Craving peak window: meta-analyses in addiction and behavioral nutrition
  confirming 15-20 minute natural collapse
- Tetris craving study: visual-spatial cognitive load reduces food/drug
  craving intensity (Plymouth University, 2015)
- iCrave app (2014): cognitive task interference reduces snacking behavior
- Atomic Habits: Clear, J. — identity-based habit formation

---

*Nova Ventures Co. · Holdout Business Plan V2 · March 2026*
*This document is the source of truth for all product decisions.*
*All deviations require conscious decision and documentation.*
