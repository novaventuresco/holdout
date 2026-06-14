# Craving Holdout: Urge Timer — Quality Grading

Last updated: 2026-04-18 (Session 27 fix-review)
Graded against: Phase 1 sign-off checklist (tests/validation-scenarios.md), patterns.md, constraints.md

Grades: A (excellent) / B (good, minor gaps) / C (functional, known issues) / D (broken or missing) / F (blocking)

---

## Feature Area Grades

### Constants & Storage Layer
Grade: A
Files: src/constants/colors.ts, timing.ts, coach.ts, src/storage/sessions.ts, preferences.ts
Notes: Built, reviewed, and all issues resolved. Type accuracy fixed (getSessions returns SessionRecord[]).
Error handling added to all write functions. Coach messages verified: no "craving", all under 15 words,
calibration-only voice. Sync dependency comments in timing.ts and CoachService.ts.
2026-04-04: RECOMMITMENT_* → MILESTONE_* naming throughout. RECOMMITMENT_TIMEOUT_MS deleted (dead code).
recommitmentsCompleted → milestonesReached on session record. COACH_LINE_DISPLAY_MS: 4000 → 7000.
supportMe pool added to coach.ts (early/mid/late sub-pools for SUPPORT ME on-demand).
CoachPhase narrowed to explicit union — keyof typeof removed.
2026-04-05: ISSUE-08 resolved — randomFrom() replaced with pickFrom() (Fisher-Yates shuffle queue keyed by pool reference). Every message appears once before repeats. All pools track independently.
ISSUE-03 resolved — module-level _cache added to sessions.ts. getSessions() serves from memory after first read; cache invalidated before every write. Cold launch now 1 AsyncStorage read instead of 2-3.
2026-04-14: deleteSession added (sessions.ts) — removes record entirely; sets _cache = filtered directly (not null) because result already in memory. cancelSession added (SessionService) — thin wrapper for Go Back silent-cancel path. earlyWin pool added to coach.ts (3 messages; no "craving", under 15 words). getEarlyWinMessage() added to CoachService. Milestone varianceSec: 30 → 0 (fills and dots now always in sync).
2026-04-14 (P2-06): seenPassiveInstruction / seenActiveInstruction added to Preferences interface (optional booleans). PASSIVE_INSTRUCTION / ACTIVE_INSTRUCTION added to coach.ts as named string exports — not pools, not rotated, shown exactly once. savePreferences imported in BattleScreen for fire-and-forget flag saves.
2026-04-17 (P2-08): Coach pool improvements — start[1] tightened (removed "That's normal" reassurance); tap2[1]/[2] replaced with science-rooted minute-8 reframes from domain.md (temporal weakening + temporal chunking); tap3[2] replaced with defusion framing ("already lost, watching the evidence"); win pool expanded to 3 messages (habit-loop framing). supportMe restructured: each sub-pool (early/mid/late) split into first/repeat tiers — first-tap delivers arc-position message, repeat taps deliver persistence/mechanism message for users tapping multiple times.
2026-04-17 (fix-review): R-01 resolved — tap2[2] rephrased from directive ("Just get to the next mark") to calibration ("The next mark is four minutes away. It resets from there."); supportMe.late.first[1] rephrased from "Just wait it out" to "Nothing left to fuel it. The end is already happening." R-02 resolved — earlyWin[0] opener changed from shared "It's gone." to "Gone early. That happens." to eliminate cross-pool phrase collision with tap4[1]. R-04 resolved — PASSIVE_INSTRUCTION "craving" removed; P2-06 coach-voice exception reversed.
2026-04-18 (Session 25): All 13 coach pools expanded from 3 → 10 messages each (91 new lines). Science-rooted and written in human voice per domain.md. earlyWin expanded 3 → 10. supportMe first/repeat tiers expanded to 10 per tier (6 sub-pools × 10 = 60 supportMe lines total). HOME_TAGLINES pool added as separate named export in coach.ts (6 lines; warmer pre-session register, not subject to in-session 15-word constraint). CravingType type removed from preferences.ts. cravingType field removed from Session interface (sessions.ts).
2026-04-18 (Session 27 — P2-16): HOME_WIN_MESSAGES (8 lines) and HOME_GAVE_IN_MESSAGES (8 lines) added
  to coach.ts. Home-screen register: warmer than in-session coach, not subject to 15-word rule, no therapy
  language. WIN: quiet honest acknowledgment of real effort. GAVE-IN: empathetic, non-judgmental, normalizing.
  Preferences: lastSessionResult?: 'won' | 'gaveIn' and unlockedThemes?: VisualTheme[] added.
  VisualTheme union extended: 'fire' | 'void' | 'ember' | 'glacier' | 'abyss' | 'solar'.
2026-04-18 (Session 27 fix-review): ACTIVE_INSTRUCTION trimmed from 17 words to 13 — was over the
  15-word coach-pill constraint (R-06). New: "Tilt to hold it centered. Physical movement occupies the
  circuits it runs on." Two HOME_GAVE_IN_MESSAGES revised: "You showed up. That still matters, even when
  it doesn't feel like it." → "You came back. That's harder than it looks, and you did it."; "The fact
  that you tried is the part that adds up." → "These sessions count. Even when they end like this."
  Revised lines shift from reassurance register to warm-but-factual register per coach voice spec.
2026-04-24: H-3 fix confirmed — deleteSession eager _cache = filtered before write preserved (race safety with GO AGAIN navigation.replace); _cache = null added to catch block (write-failure consistency). getSessions() catch confirmed already correct — returns [] without setting _cache (H-4 was a false alarm on current code state). pickFrom() empty-pool guard added (M-4) — returns '' on empty pool; safe because all callers gate on !!coachLine.
2026-04-25: Complete coach message rewrite — all 8 milestone pools (start/tap1–tap4/win/earlyWin/winLingers) and all 6 supportMe sub-pools (early/mid/late × first/repeat) rewritten for human voice. Key principle enforced: coach never assumes the individual's felt experience — speaks to time facts, population statistics, and universal truths only. Clinical jargon removed throughout: "arc," "loop," "mechanism," "signal," "conditioning." Voice: corner man between rounds, not a researcher describing the curve.
2026-05-03: Coach voice pass — tap1/tap2/tap3/tap4 pools rewritten to remove specific minute-number
  references ("Minute 8. Hardest point." / "Four minutes." / "Four minutes to sixteen."). These felt like
  status readouts rather than coaching. New lines lead with what the moment means: first-surge framing at
  tap1, intensity-as-confirmation reframe at tap2, social proof at tap3, spent-craving framing at tap4.
  5 start pool lines rewritten (felt-state assumptions and passive "wait it out" framing removed).
  7 supportMe "Minute 8" references replaced with "hardest stretch" language (8th caught during verify).
  Em dash pass: all user-facing strings cleaned (winLingers, supportMe, HOME_WIN_MESSAGES,
  HOME_GAVE_IN_MESSAGES). Header comment updated: 15-word guideline removed, no-em-dash and
  no-felt-state rules added. session-brief.md and domain.md section 6 examples updated to match.

---

### Services
Grade: A
Files: src/services/SessionService.ts, StreakService.ts, CoachService.ts
Notes: Built, reviewed, and all issues resolved. Orphan recovery fixed — no time window on getActiveSession().
All service functions stateless and pure.
2026-04-05: ISSUE-03 resolved (see Constants & Storage). CoachService: randomFrom → pickFrom.
2026-04-04: recordRecommitment() → recordMilestone(). getCoachMessageForElapsed() now draws from
supportMe pool exclusively (not tap1–tap4). Phase boundary corrected: early ends at 8 min (was 9) to
match the minute-8 milestone. CoachPhase explicit union — keyof typeof removed.
2026-04-14: cancelSession added — delegates to deleteSession for silent-cancel (Go Back) path.
2026-04-17 (P2-08): getCoachMessageForElapsed() updated — isRepeat param (default false) routes to supportMe first vs. repeat tier. No structural change to other service functions.
2026-04-18 (Session 25): startSession() simplified — no parameters. CravingType removed from import chain: preferences.ts → sessions.ts → SessionService.ts → BattleScreen.tsx.
2026-04-24: M-3 — completeSession and abandonSession now compute Math.max(0, endTime - session.startTime) + Math.max(0, priorDurationMs) to guard against negative duration on system clock adjustment.
2026-04-26 (P3-07): IAPService.ts added. StoreKit connect/purchase/restore/disconnect.
  Pending-promise map pattern. 60s purchase timeout. Stale transaction filter (20s).
  Orphan recovery in connectIAP(). Double-settle guard. v14 API: .id/.displayPrice,
  type:'in-app' required. Intentional exception to stateless pattern — module-level
  connection state justified by per-app-launch StoreKit lifecycle.
2026-04-28: /review C-01/H-01/M-01/M-03/M-04 confirmed resolved in code from 2026-04-26 session.
  EAS device build done 2026-04-28 (includes react-native-iap native module).
  Sandbox IAP validated on device 2026-04-28: purchase flow end-to-end (paywall → StoreKit → unlock → theme
  auto-selected), persistence confirmed (unlock survives app close/reopen).
  Note: Motion & Fitness permission prompt appeared during first purchase attempt (never triggered by
  active-mode gyroscope use). Cause: StoreKit's fraud detection internally accesses CMMotionActivityManager
  (Apple's own framework — not app code or react-native-iap). NSMotionUsageDescription was already in
  Info.plist from expo-sensors setup. No PrivacyInfo.xcprivacy change needed — Apple's frameworks
  handle their own privacy declarations. L-02 (manifest re-audit) status unchanged; wait for submission.

---

### BattleVisual Animation
Grade: A
Files: src/animations/BattleVisual.tsx
Notes: Full Skia SKSL shader rewrite (Session 5, 2026-03-28). Shader overhaul (Session 7, 2026-03-29).
  Current implementation:
  - 4-octave fbm with per-octave rotation (replaces fbmT abs-fold approach)
  - Radius curve (passive): mix(0.04, 0.42, pow(progress, 2.0)) + centerBoost * 0.05
  - Radius curve (active/orbFixed): mix(0.08, 0.13, orbSize) + centerBoost * 0.05
  - orbOffset uniform: float2 (px/height, py/height) — shifts center force position in shader
  - orbFixed uniform: 1.0 = active (constant radius), 0.0 = passive (progress-driven)
  - Shockwave ring emanates from orb position (dist_raw = length(p_base - orbOffset))
  - Heat haze: fire noise (n1, n2) refracts p_base → p_haze (subtle coordinate warp)
  - Core heartbeat: sin(time*2.0) → corePulse applied to coreDepth — white core throbs
  - Organic breathing: sin(time*0.6) + dual fbm warp on p_haze → center boundary breathes
  - Fire ramp: theme-branched — fire (amber 5-stop), void (navy→indigo→violet), ember (near-black)
  - Center light: theme-branched — fire/void (white→teal), ember (amber→orange→deep amber)
  - Chromatic aberration: R/B channels shifted ±chromaOffset at center/fire boundary
  - Shockwave pulse: Gaussian ring in shader (not View scale), uniform 0→1.3 per tap
  - Per-session seed uniform: unique visual starting state each session
  - Theme uniform: `uniform float theme` (0=fire, 1=void, 2=ember) — plain number, set at session start
  - centerBoost uniform: `uniform float centerBoost` (0→1) — additive 0.05 radius boost; optional prop with local fallback
  - orbX/orbY props: optional SharedValue<number>; local fallbacks (useSharedValue(0)) so passive test harnesses work unchanged
  - Time: useFrameCallback throttled at 30fps (33ms gate, timestamp/3000 % 1000) — clock owned by BattleScreen, passed as SharedValue<number> prop
  - Living color: orb core cycles warm→gold→cool when centred (centerBoost gates; driven by time + centerBoost — no new uniform)
  - Edge contact dim: centerLight *= (1.0 - edgeContact * 0.60) — orb fades at wall; baseRadius NOT modified by edgeContact
  - Edge pressure: background deepens directionally toward contact side (fire→dark amber, void→dark violet, ember→dark ember)
  - expo-dev-client required — Expo Go does not work (react-native-skia is native)
2026-04-05: Performance optimization pass.
2026-04-06: time clock lifted to BattleScreen.
2026-04-08: orbOffset + orbFixed uniforms added. Shockwave dist_raw now orb-relative. orbX/orbY optional props with local fallbacks.
2026-04-09: Living color, edge contact dim, edge pressure added. orbSize uniform added.
Device validation: PASSED 2026-04-05 (Phase 1 passive). Active mode visual features (orbOffset, orbFixed, living color, edge pressure) hot-reload validated via Metro 2026-04-09.
2026-04-18 (P2-17): Three new themes added (total 6). Shader theme branch chain extended from 3 to 6.
  Each theme has distinct heat ramp (5-stop gradient), center light, living color oscillator, and edge
  pressure behavior. Existing 3 themes (fire/void/ember) unchanged.
  Glacier (3): ice-blue edges → warm amber/gold center (Fire inverted).
  Abyss (4): pitch-black edges → bioluminescent cyan-green center (1.8× brightness multiplier for glow).
  Solar (5): blazing gold-white edges → deep violet/crimson center.
  EAS build required for device validation (Skia native shader change).
2026-04-19: Three additional themes added (total 9). Shader branch chains extended to 9 (fire ramp, center color, edge pressure). Aurora (6): near-black → electric green/lime edges, silver-pearl center, ice/violet living shimmer. Dusk (7): near-black → deep magenta → rose → coral edges, warm gold/honey-amber center. Nebula (8): near-black → deep violet → hot-magenta edges, brilliant electric ice-blue center (1.85× brightness multiplier so center punches through dark edges). Two unused SKSL locals (auPhase, dkPhase2) found in /verify and removed. EAS device build required for shader validation.
2026-04-25: Radius curve corrected — `mix(0.0, 0.42, pow(progress, 2.0)) + centerBoost * 0.05`. Previous formula (pow(1.5) max 0.65) caused center to cover 84% of screen height by minute 12. Two iterations required to reach final formula; see patterns-animation.md for full history.
2026-04-26: Radius formula device-validated. Visual behavior confirmed on device.
2026-04-26: Passive radius floor raised 0.0 → 0.04 — orb starts at 6-minute equivalent size. Formula: `mix(0.04, 0.42, pow(progress, 2.0)) + centerBoost * 0.05`. Max unchanged. Active mode untouched.

---

### OnboardingScreen
Grade: A
Files: src/screens/OnboardingScreen.tsx, App.tsx (first-run routing)
Notes: Built 2026-03-29. Originally 3-sub-screen flow (craving type picker + time window picker
  + info screen). App.tsx wired with AsyncStorage read on mount — routes null → onboarding → HomeScreen.
  SafeAreaView updated to react-native-safe-area-context import (2026-03-30).
2026-04-18 (Session 25): Rewritten to single info screen. Heading: "It's not about willpower."
  Three-paragraph science explainer generalized to habit-driven urges (not food-specific).
  CTA: "LET'S GO". savePreferences({ onboardingComplete: true }) on CTA tap. Double-tap guard
  via saving state. All picker state, CRAVING_TYPES, CRAVING_WINDOWS, step state removed.
  App.tsx routing unchanged (null → onboarding → HomeScreen).
2026-04-24 (L-1): savePreferences wrapped in try-catch. On failure, setSaving(false) re-enables CTA for retry. Previously a write failure would silently proceed to onComplete() — prefs would not be saved, causing onboarding to reappear on next launch.
Device validation: PASSED 2026-03-29 (original flow). PASSED 2026-04-18 (single-screen rewrite).

---

### HomeScreen
Grade: A
Files: src/screens/HomeScreen.tsx, App.tsx, src/navigation/types.ts
Notes: Built 2026-03-29. Updated 2026-03-30 (F1/F2 fixes, navigation). Updated 2026-04-04 (theme picker).
  F1/F2 resolved. useNavigation() wired. SafeAreaView correct.
  2026-04-04: Visual theme picker added — 3 swatches (FIRE/VOID/EMBER) above CTA. Loads theme
  from preferences in useFocusEffect alongside streak reload. Saves immediately on tap via
  savePreferences merge. Prefs kept in state for merge on subsequent taps.
Device validation: Navigation tests PASSED 2026-04-04. Theme picker pending device validation.
Scenarios: VS-001 (partial), VS-002 (PASSED)
2026-04-18 (Session 25): Rotating tagline added. HOME_TAGLINES import; useState initializer pick
  (once per mount, stable on tab navigation, refreshes after session); rendered below HOLDOUT
  header in TEXT_SECONDARY at 16px/24px lineHeight. Device-validated 2026-04-18.
2026-04-18 (Session 27 — P2-16): Tagline now context-aware. useState initializer replaced with
  settable state initialized to ''; set inside useFocusEffect after prefs load. lastSessionResult
  'won' → HOME_WIN_MESSAGES; 'gaveIn' → HOME_GAVE_IN_MESSAGES; unset → HOME_TAGLINES. Result
  cleared from Preferences after display (shown exactly once).
2026-04-18 (Session 27 — P2-18): Settings gear icon added (top-right, Ionicons settings-outline).
  handleSettings() navigates to 'Settings' screen. Header restructured to row layout (appName centered,
  gear icon position:absolute right). Free theme picker (3 swatches) retained on HomeScreen.
2026-04-18 (Session 27 fix-review — R-01/R-02): Theme picker expanded to all 6 themes in a 2×3 grid
  (two rows of 3, gap:16 between rows, gap:24 within each row). All themes free; PREMIUM_THEMES reserved
  for P3-07 IAP via prefs.unlockedThemes. handleThemeSelect fallback added: if both prefs state and
  AsyncStorage return null, saves { onboardingComplete: true, visualTheme: t } rather than silently
  dropping the selection.
2026-04-19: Theme picker expanded from 2×3 (6 themes) to 3×3 (9 themes). THEMES array extended with aurora/dusk/nebula entries. THEME_ROWS changed to [THEMES.slice(0,3), THEMES.slice(3,6), THEMES.slice(6)]. All 9 themes currently free; PREMIUM_THEMES comment and prefs.unlockedThemes reserved for P3-07.
2026-04-19: IAP lock enforcement implemented. FREE_THEMES=['fire','void','ember'], PREMIUM_THEMES=['glacier','abyss','solar','aurora','dusk','nebula']. isUnlocked(id, prefs) pure helper (outside component) gates handleThemeSelect — returns early if locked. Lock UI: swatch dims to 0.45 opacity + rgba(0,0,0,0.30) scrim overlay + lock-closed Ionicons (size 16) centered + label at 0.35 opacity. activeOpacity={1} on locked swatches (no tap feedback). DEV_UNLOCK_ALL_THEMES boolean constant — true bypasses all lock checks (dev default); false simulates locked-user UX. P3-07 hook comment marks where StoreKit sheet replaces the guard.
2026-04-24: Tier assignment confirmed — free = fire/void/ember, premium = glacier/abyss/solar/aurora/dusk/nebula. PREMIUM_THEMES already includes aurora/dusk/nebula; no code change required.
2026-04-26 (P3-07): IAP paywall wired. showPaywall + pendingTheme state added.
  handleThemeSelect lock guard replaced with setShowPaywall(true). ThemePackPaywall
  mounted conditionally. handleUnlock persists unlockedThemes: PREMIUM_THEMES + auto-selects
  tapped theme in one savePreferences call. prefsRef.current synced after unlock.
  DEV_UNLOCK_ALL_THEMES flipped to false (was true during dev). /verify M-1 fixed
  (backdrop tap guarded during purchase). /verify L-1 fixed (tapped theme auto-selected
  on unlock, no second tap required).

---

### SettingsScreen
Grade: A
File: src/screens/SettingsScreen.tsx
Notes: Created 2026-04-18 (Session 27, P2-18). Initial implementation: full theme picker with locked
  premium theme UI (dimmed swatches, lock icon, UNLOCK placeholder alert) + science panel.
  Revised same session (fix-review, R-02): theme management consolidated on HomeScreen; SettingsScreen
  reduced to science panel only — "HOW IT WORKS" heading + 3 science paragraphs. Stateless component:
  no useFocusEffect, no prefs loading, no state. NativeStack push from HomeScreen gear icon.
  Navigation: RootStackParamList extended with Settings: undefined (src/navigation/types.ts).
  App.tsx registers <Stack.Screen name="Settings" component={SettingsScreen} />.
  IAP placeholder: FREE_THEMES/PREMIUM_THEMES constants removed from SettingsScreen (no longer needed
  here); intent preserved via comment in HomeScreen THEMES array and prefs.unlockedThemes for P3-07.
Device validation: Hot-reload — nav flow, back button, science text rendering.

---

### BattleScreen
Grade: A
File: src/screens/BattleScreen.tsx
Notes: Built 2026-03-30. Redesigned + fixed 2026-04-04.
  State machine: initializing → running → won / gaveIn → gaveInComplete (5 states).
  sessionProgress SharedValue (0→1) owned here, passed directly to BattleVisual (no blending).
  250ms interval with wall-clock elapsed (Date.now() - sessionStartRef). screenStateRef mirrors screenState.
  Milestones: coach line + shockwave pulse + passedCount increment at 4/8/12/16 min (silent, no overlay).
  passedCount SharedValue syncs dot animations with coach + pulse — all fire from checkMilestoneSchedule.
  SUPPORT ME button (shield icon, bottom-left): on-demand coach via getCoachMessageForElapsed() +
    shockwave pulse + amber glow flash. Icon visible against all shader states (dark pill background).
  GAVE IN button (X icon, bottom-right): two-stage — "Gave in?" label + amber breathe glow on first tap,
    3s auto-reset, confirm tap triggers drain. Animated.View wrapper enables glow animation.
  Progress bar: 3px amber fill grows left→right with amber glow. Milestone dots overlay the track,
    lighting amber and pop-scaling when each milestone fires. Labels (4m/8m/12m/16m) above dots.
    Positioned above home indicator via useSafeAreaInsets.
  Coach text: dark semi-transparent pill (rgba(0,0,0,0.48)) — readable against all shader states.
    Display duration: 7s. Animation keyed on coachKey counter.
  Mounted guard: let mounted = true + if (!mounted) return after each await in init().
  All SharedValues cancelled on unmount including dot scales, orbX, orbY, centerBoost.
  AppState: interval paused on background, visual snapped to elapsed on return.
  Win: completeSession → onWinAnimationComplete (useCallback([])) → goBack().
  GaveIn: abandonSession → withTiming drain → "Session ended." → RETURN → goBack().
  Active mode: orbFixed (SharedValue<number>), orbSize (SharedValue<number>), edgeContact (SharedValue<number>)
    owned here. gravityHigh is plain React state (not SharedValue — only affects JS physics loop).
    Settings pill: "ORB S·M | PULL R·S" — session-scoped only, not persisted.
    handleModeToggle: toggle to passive → direct snap to 0 for all active SharedValues (no withTiming — race condition with SpatialBalance unmount).
2026-04-05: F4 fixed — setTheme batched with setScreenState('running') in one render.
2026-04-08: Major refactor — BallsLayer/slider/deliveryProgress/displayProgress/RNGH removed.
  - orbX = useSharedValue(0), orbY = useSharedValue(0) — written by SpatialBalance, read by BattleVisual
  - centerBoost = useSharedValue(0) — sanctuary reward; written by SpatialBalance
  - sessionProgress passed directly to BattleVisual (slider blending layer removed)
  - Slider UI replaced with PASSIVE | ACTIVE tap toggle pill
  - SpatialBalance mounts/unmounts via showRunningUI && activeMode
2026-04-09: orbFixed/orbSize/edgeContact added as SharedValues. gravityHigh as plain state.
  Active mode settings pill added. Review findings R-01 through R-13 resolved.
2026-04-14: P2-04 (Go Back silent cancel), P2-05 (Craving Gone early-win), P2-10 (milestone centerBoost burst) implemented.
2026-04-14 (P2-06): prefsRef = useRef<Preferences | null>(null) added — carries loaded prefs into handleModeToggle() for first-use instruction checks without extra state. Passive instruction shown as start coach line on first-ever session (replaces pool message); flag saved fire-and-forget. Active instruction shown on first ACTIVE toggle; flag saved fire-and-forget. Both delivered via existing coachLine / coachKey fade mechanism. Dev reset comment in init() for re-testing without reinstall.
  Go Back: two-stage confirm (top-right); cancelSession (deleteSession) — no record, no streak impact; sessionIdRef nulled before goBack so unmount cleanup skips abandonSession.
  Craving Gone: two-stage confirm (bottom row, center); completeSession at elapsed progress; earlyWin coach line; same win animation fires.
  Milestone orb burst (passive only): withSequence(600ms ramp to 1.0, 9400ms decay) guarded by activeModeRef — no conflict with SpatialBalance in active mode.
  Mutual exclusion: all three confirm states (gaveIn / earlyWin / goBack) cancel each other on tap.
  Shader flash fix: time uniform changed to session-relative (_frameTimeStart SharedValue); eliminates 50-min device-uptime wrap discontinuity.
  Settings pill: PULL updated from R/S to LO/HI (S was ambiguous — appeared in ORB group with different meaning).
  Review findings R-01 through R-03 (last-review.md 2026-04-14) resolved.
2026-04-18 (Session 27 fix-review — R-04): prefsRef.current synced after lastSessionResult save in
  handleWon and handleGaveIn. Follows established prefsRef pattern in patterns-build.md.
2026-04-18 (Session 26, P2-13): wonComplete state added (6-state machine). handleWinComplete now sets wonComplete + fires winLingers coach line via wonLingersTimerRef (2000ms delay, cleared in cleanup). DONE calls handleDone; GO AGAIN calls navigation.replace('Battle') with goAgainFiredRef double-tap guard. AppState handler extended: wonComplete added to background no-op states. Progress bar excluded from wonComplete.
2026-04-19 (R-08): Session recording deferred from handleWon() to wonComplete choice. DONE → completeSession() + lastSessionResult:'won' → goBack(). GO AGAIN → cancelSession() on the first session (never recorded) → navigation.replace('Battle'). Second session records its own outcome. History and HomeScreen reflect one result from one continuous experience.
2026-04-20: App kill recovery changed — orphan session now cancelSession (silent delete, no record) instead of abandonSession (gaveIn). resumePrompt state added (7th state: initializing / running / won / wonComplete / gaveIn / gaveInComplete / resumePrompt). AppState background 20+ min handler enters resumePrompt instead of auto-winning. Resume prompt overlay: "You were away. Did you hold out?" + GAVE IN / DONE / GO AGAIN (three choices in one screen). Reuses handleGaveIn / handleDone / handleGoAgain — no new logic. sessionProgress.value = 0.999 on resumePrompt entry (below win animation threshold). resumePrompt added to AppState background no-op list. /verify caught line-ordering bug: AppState handler wrote sessionProgress = Math.min(elapsed/SESSION_DURATION_MS, 1.0) before the terminal check — this set value to 1.0 and triggered BattleVisual win animation before resumePrompt state could be entered. Fixed by checking elapsed >= SESSION_DURATION_MS first.
2026-04-24 (security/robustness pass): outcomeFiredRef shared guard replaces separate doneFiredRef/goAgainFiredRef — prevents cross-button double-fire in wonComplete and resumePrompt (H-1/H-2). Confirm timer clears added to first-tap branch of all three confirm handlers — prevents orphaned timeout on rapid re-tap (M-1). priorElapsedMs clamped with Math.max(0, ...) on mount (L-8).
2026-04-24 (resumePrompt UI + milestone flood fix): resumePrompt subtitle text shadow removed
  (textShadowRadius 8 on 16px TEXT_SECONDARY caused visible blur — rgba(0,0,0,0.35) overlay
  background provides sufficient contrast alone). Button layout restructured from a single
  overflowing row to column: HELD OUT (white-outline border button) + GO AGAIN (amber) in top
  row; GAVE IN (dim ghost text) below — "yes" outcomes prominent, "no" outcome secondary. Label
  "DONE" renamed "HELD OUT" in resumePrompt JSX only; wonComplete state unchanged. Milestone
  flood fixed: AppState 'active' handler now fast-forwards milestoneIndexRef and passedCount
  past all already-elapsed milestones before restarting the interval; fires exactly one
  orientation coach line for the most recently crossed milestone (no pulse/shockwave). Device-verified 2026-04-24.
Device validation: PASSED 2026-04-04 (Phase 1 passive). Active mode end-to-end (SpatialBalance + all visual features) device-validated 2026-04-09.

---

### BallsLayer (Active Mode v1 — PARKED)
Grade: Parked
File: src/components/BallsLayer.tsx
Notes: Built Session 15 (2026-04-05). Rebuilt Session 16 (2026-04-06). Parked 2026-04-08.
  PARKED: Active mode v1 (drag-to-center delivery) replaced by SpatialBalance (gyroscope balance).
  File preserved as reference — not mounted or imported anywhere in the app.
  See decisions.md "BallsLayer parked" ADR.
Device validation: Never completed (parked before device build).

---

### SpatialBalance (Active Mode v2 — Gyroscope Balance)
Grade: A
File: src/components/SpatialBalance.tsx
Notes: Built 2026-04-08. All critical/high review findings resolved 2026-04-08. Physics constants
  device-tuned and baseline approved 2026-04-09. Haptics device-validated 2026-04-09.
  Physics-only component — renders null. All visual output via BattleVisual orbOffset uniform.
  Architecture:
  - DeviceMotion subscription at 33ms (~30Hz); latestTilt ref updated on each reading
  - setInterval physics loop at 33ms — avoids competing with BattleScreen's useFrameCallback
  - Direct SharedValue writes from JS thread (orbX.value, orbY.value, centerBoost.value)
  - AppState listener: orbX/orbY animated to 0 on 'active' return; recentringRef pause flag
    prevents physics tick from cancelling the withTiming (R-02 fix)
  Physics:
  - Amber gravity: centrifugal (+gravX/Y), non-linear (nx × |nx|)
    (R-01 fix — initial impl had centripetal sign; initial amberStrength craving-curve ramp removed)
  - Gravity normalised per-axis: nx=orbX/MAX_X, ny=orbY/MAX_Y — all four edges identical force
    (fix: was nx=ny=orbX/EDGE_ZONE_RADIUS causing 5× asymmetry — top/bottom far stickier)
  - gravityHigh toggle: LO=0.3 (baseline) / HI=0.7 (strong). Mid-screen at 50% to edge:
    4.5 vs 10.5 pt/s² — perceptibly harder. At edge: 18 vs 42 pt/s² — 20° tilt overcomes.
    0.5 was tried first but imperceptible at mid-screen due to n×|n| squaring; 0.7 confirmed.
  - Zone classification uses post-integration newDist (R-03 fix)
  - Erratic forces (danger zone sin/cos directional shifts) removed — unplayable on device
  - Zone-dependent friction: SAFE (0.94) → EDGE (0.90) → ADHESION (0.86, quicksand)
  - centerBoost: smoothed toward safeRatio using post-integration newDist
  - edgeContact: per-axis proximity ramp starting at 65% to edge (not zone-based); asymmetric
    lerp: drain 0.05/tick (~1.3s), recover 0.018/tick (~3.5s) — life drains slowly, returns slowly
    drives directional background pressure + centerLight dim in BattleVisual
  - Axis-correct clamping: MAX_X = screenWidth/2, MAX_Y = screenHeight/2 (Dimensions.get)
  BattleScreen integration:
  - orbFixed: SharedValue<number> owned by BattleScreen (R-05 fix — was plain boolean, 1-2 frame lag)
  - orbSize: SharedValue<number> owned by BattleScreen (1=medium, 0=small)
  - edgeContact: SharedValue<number> owned by BattleScreen; written by SpatialBalance, read by BattleVisual
  - gravityHigh: plain boolean React state — not a SharedValue (only affects JS physics loop, not shader)
  - Passive toggle: direct snap to 0 for orbX/orbY/centerBoost/edgeContact (R-04 fix)
  Tuning constants (device-validated baseline as of 2026-04-09):
  - SAFE_RADIUS=80, EDGE_ZONE_RADIUS=180, ADHESION_RADIUS=150
  - GYRO_SENSITIVITY=120, GRAVITY_SCALE=60
  - amberStrength: LO=0.3, HI=0.7 (user-selectable via PULL toggle)
  - MAX_X=screenWidth/2, MAX_Y=screenHeight/2 (Dimensions-derived)
  Active mode visual features (2026-04-09):
  - Orb size: S (ACTIVE_RADIUS 0.08) / M (0.13) — session-scoped, not persisted
  - Gravity pull: LO (0.3) / HI (0.7) — session-scoped, not persisted
  - Settings pill: single combined pill "ORB S·M | PULL LO·HI" with dim category labels
  - Living color: orb core cycles warm→gold→cool when centred (centerBoost gates; warm (1.45,0.90,0.65)
    / cool (0.60,1.10,1.55) / gold (1.35,1.20,0.50); livePulse amplitude 0.28 deep breathing)
  - Edge dim: centerLight *= (1.0 - edgeContact * 0.60) — orb fades at wall, no size change
    (baseRadius NOT modified by edgeContact — decoupled to fix wall adherence inconsistency)
  - Edge pressure: background deepens directionally toward contact side (fire→dark amber, void→dark violet)
  BattleScreen review findings resolved (2026-04-09):
  - R-01: Removed duplicate "You held it." overlay text — coach line is sole win message
  - R-02: Ember edge pressure fixed: was brightening (1.0+), now correctly darkening (1.0-)
  - R-03: sessionProgress removed from physics effect deps; JSDoc corrected
  - R-04: AppState closure fragility comment added
  - R-08: useFrameCallback auto-deactivation documented as verified-safe (Reanimated 4 lifecycle)
  - R-13: eslint-disable comment added to pulseCount useEffect
  P2-11 — Wind gust system (2026-04-14):
  - HI gravity: continuous wind gust system eliminates neutral equilibrium at center
  - Two-phase envelope: attack (0→1 at WIND_ATTACK_RATE/tick) → decay (1→0 at per-gust random rate)
  - Randomized interval (WIND_GUST_INTERVAL_MIN_MS – WIND_GUST_INTERVAL_MAX_MS) — not rhythmic
  - No envelope reset on gust fire — direction changes, magnitude transitions smoothly from current value
  - LO gravity: unchanged (entire gust block gated on gravityHigh)
  Wind constants (device-validated 2026-04-14):
  - WIND_GUST_INTERVAL_MIN_MS=4000, WIND_GUST_INTERVAL_MAX_MS=9000
  - WIND_GUST_STRENGTH=0.3 (~18 pt/s² peak — perceptible, surmountable by small tilt)
  - WIND_ATTACK_RATE=0.008 (0→1 in ~125 ticks, ~4s gradual onset)
  - WIND_DECAY_RATE_MIN=0.990, WIND_DECAY_RATE_MAX=0.995 (10–20s fade)
  SpatialBalance review findings resolved (2026-04-14, last-review.md):
  - R-01/R-04: lastGustAt initialized to 0 (epoch) — gust fired at 33ms on first tick. Fixed: set to Date.now() inside useEffect init block before setInterval
  - R-02: AppState resume fired immediate gust — lastGustAt not reset on return. Fixed: lastGustAt.current = Date.now() in AppState handler alongside windEnvelope/windPhase reset
  - R-03: WIND_DECAY_RATE comment wrong by 14× — corrected
  - R-11: Two block-scoped const now = Date.now() in setInterval. Fixed: hoisted single declaration to top of callback
  - R-16: features.md P2-06/P2-11 still "To plan". Fixed: both updated to "DONE"
Device validation: EAS device build done 2026-04-09. Physics baseline and all visual
  features (living color, edge pressure, orbSize, centerBoost) validated on device 2026-04-09.
  P2-11 wind gust system device-validated 2026-04-14 with final constants above.
2026-04-19: Haptics removed from the experience. All haptic calls removed from SpatialBalance.
2026-04-18 (Session 27 fix-review — R-05): EDGE_ZONE_RADIUS dead constant removed — was defined but
  unused after per-axis normalisation fix. Tuning constants list updated (no EDGE_ZONE_RADIUS entry).

---

### HistoryScreen
Grade: A
File: src/screens/HistoryScreen.tsx
Notes: Built 2026-04-04. Progress bar fight record design (not thumbnails).
  Stats block: win rate / streak / best streak.
  Session list: horizontal progress bar per session — won = full white, gave-in = partial amber.
  Milestone ticks at 20%/40%/60%/80% (4/8/12/16 min positions) cut through fill.
  FlatList with empty state. useFocusEffect + mounted guard. renderItem in useCallback.
  SESSION_DURATION_MS imported from timing.ts. Bar track uses COLORS.DIVIDER.
  Date formatted as "Today HH:MM", "Yesterday HH:MM", "Mon D HH:MM".
Device validation: PASSED 2026-04-04.
Scenarios: VS-011

---

### Navigation
Grade: A
File: App.tsx, src/navigation/types.ts
Notes: NavigationContainer added 2026-03-30.
2026-04-20: Orphan recovery in App.tsx changed — cancelSession replaces abandonSession. App kill = no record, no streak impact. File-level JSDoc in App.tsx updated to match ("silently deleted" not "marked gaveIn"). Structure upgraded 2026-04-04 (Session 13).
  Now: RootStack (NativeStack) → Tabs (BottomTabNavigator: Home + History) + Battle (fullScreenModal).
  TabParamList added to types.ts. HomeNavigation updated to CompositeNavigationProp.
  Tab bar: dark bg (#0D0D0D), amber active, text-only labels (HOME/HISTORY), no icons.
  Battle fullScreenModal exits via goBack() — unaffected by tab wrapper.
  Onboarding branch retains explicit SafeAreaProvider (outside NavigationContainer).
  HomeScreen tab stub removed — real navigation replaces it.
2026-04-18 (Session 27 — P2-18): Settings screen added to RootStack (push navigation from HomeScreen).
  RootStackParamList: Settings: undefined added. SettingsScreen imported in App.tsx.
2026-04-18 (Session 28): sceneContainerStyle: { backgroundColor: COLORS.BACKGROUND } added to
  Tab.Navigator screenOptions — eliminates white flash on tab screen mount and tab switches (JS layer).
  expo-system-ui installed to package.json — covers native card transitions (Settings push, Battle modal)
  after next EAS device build. Activation: add import + useEffect in App.tsx post-rebuild.
Device validation: PASSED 2026-04-04. Settings nav pending device validation (EAS build).
  Native-layer ghost fix (expo-system-ui) pending EAS build.

---

## Overall Phase Status

Phase 1 complete (2026-04-05). All screens device-validated. All sign-off items cleared.

Phase 2 COMPLETE (2026-04-18). All P2 items done.
Foundation (A) · BattleVisual (A) · Onboarding (A) · HomeScreen (A) · BattleScreen (A) · Services (A) · CoachService (A) · Navigation (A) · HistoryScreen (A) · BallsLayer (Parked) · SpatialBalance (A) · App Icon (A).
Active mode device-validated 2026-04-09: physics baseline, living color, edge pressure, orbSize, centerBoost all confirmed on device.
P2-11 (Strong gravity + wind gusts) device-validated 2026-04-14. SpatialBalance promoted to A.
Foundation (A) · BattleVisual (A) · Onboarding (A) · HomeScreen (A) · BattleScreen (A) · Services (A) · CoachService (A) · Navigation (A) · HistoryScreen (A) · BallsLayer (Parked) · SpatialBalance (A) · App Icon (A).
Session 25 (2026-04-18): Coach pools expanded to 10 each. OnboardingScreen simplified to single screen. CravingType removed from data model. HOME_TAGLINES rotating tagline added to HomeScreen.
Session 26 (2026-04-18): P2-13 (Post-20-min craving handler) implemented. wonComplete state added to BattleScreen. DONE + GO AGAIN buttons. winLingers coach pool (10 messages). navigation.replace('Battle') for seamless session restart. CoachPhase union includes 'winLingers'. getWinLingersMessage() added to CoachService.
Session 27 (2026-04-18): P2-15 haptics overhaul (wall-only, velocity-weighted thud). P2-16 post-session home screen messaging (HOME_WIN_MESSAGES / HOME_GAVE_IN_MESSAGES; lastSessionResult in Preferences). P2-17 three new themes — Glacier/Abyss/Solar (shader extended to 6 branches; VisualTheme union extended; BattleScreen themeMap extended). P2-18 Settings screen (new SettingsScreen; free/premium split; locked theme UI with IAP placeholder; HOW IT WORKS science panel). Phase registry restructured: Phase 3 = App Store readiness; Phase 4 = AI features.
Phase 2 complete. Next: Phase 3 — P3-03 TestFlight → P3-04 screenshots → P3-05 privacy policy → P3-06 production build.
Session 28 (2026-04-18): /review P2-15–18 completed (see docs/quality/last-review.md). 9 findings logged (R-01–R-09). R-04/R-06 scheduled pre-EAS-build. R-02/R-05 fix-review resolutions recorded in feature-area grades above. Ghost of light mode partial fix: Tab.Navigator sceneContainerStyle live; expo-system-ui native layer pending EAS build.
2026-04-19: P2-17 Glacier/Abyss/Solar shader device-validated (EAS build). P2-18 Settings nav push device-validated. Ghost of light mode fully resolved (expo-system-ui activated). Haptics removed. BattleScreen promoted to A.
2026-04-19 (this session): Three new visual themes (aurora index 6, dusk index 7, nebula index 8) added. VisualTheme union extended, BattleScreen themeMap extended, SKSL shader extended (three branches in each of the three if/else chains: fire ramp, center color, edge pressure). HomeScreen grid grows from 2×3 to 3×3. /review → /fix-review → /verify → /update-docs completed this session. EAS device build required for final shader validation of aurora/dusk/nebula.
2026-04-20: App kill = silent cancel (no record). Background 20+ min → resumePrompt (GAVE IN / DONE / GO AGAIN). Reconciled with winLingers/GO AGAIN — background path collapses both questions into one prompt; normal 20-min win path unchanged. /verify caught line-ordering bug in AppState handler (sessionProgress = 1.0 would trigger win animation before resumePrompt state entered); fixed. All feature areas graded A.
2026-04-24 (security/robustness pass): Independent assessment evaluated 4 High, 4 Medium, 8 Low findings. All code fixes applied: outcomeFiredRef shared guard (H-1/H-2), deleteSession eager-cache ordering confirmed (H-3 + C-1 regression caught by /review and corrected), confirm timer clears (M-1), Math.max duration guard (M-3), pickFrom empty-pool guard (M-4), OnboardingScreen try-catch (L-1), priorElapsedMs clamp (L-8). H-4 confirmed already correct; M-2 assessed as false positive. All feature areas remain A.
2026-04-25: Coach message rewrite — all 14 pools rewritten for human, corner-man voice (no clinical jargon, no assumed felt experience). Passive radius curve corrected to pow(2.0) max 0.42. P3-04 App Store screenshots: 5 shots selected (IMG_1224/1219/1231/1234 + AURORA active), overlay copy finalised, docs/store/app-store-copy.md updated with device mockup approach and final copy.
2026-04-26: P3-05a + P3-05 complete. Landing page (novaventuresco.github.io/holdout) and privacy policy (/holdout/privacy) HTML files created. Dark aesthetic, Inter font, real app screenshots in hero and feature rows, scroll-reveal, FAQ. Self-contained single-file pages. Support URL and Privacy Policy URL in app-store-copy.md confirmed. B-3 resolved. App Store Connect entry now unblocked.
2026-04-26 (continued): Landing page revised and live. Screenshots: real app screenshots
  (IMG_1220 FIRE hero, IMG_1223 VOID, IMG_1231 GLACIER, IMG_1234 History, IMG_1233 Themes).
  Display approach iterated — object-fit: cover abandoned (quality loss on large PNG sources);
  margin-top offset approach abandoned (per-breakpoint maintenance); final: full natural height,
  no cropping, border-radius only. Copy rewrite: hero sub-headline explains full mechanic
  (amber force closes in, presence holds center, 20-minute window); feature rows reframed to
  user experience; science section addresses reader with dopamine mechanism; FAQ reordered.
  Two ASO articles added: /how-long-do-cravings-last/ and /urge-surfing/ — same dark style,
  cross-linked, app CTA at bottom. Science section links to both articles.
2026-04-26 (P3-07): Theme pack IAP implemented. IAPService.ts + ThemePackPaywall.tsx created.
  HomeScreen paywall trigger wired. Requires EAS device build with react-native-iap native
  module before end-to-end Sandbox testing is possible.
2026-04-28: P3-07 IAP Sandbox-tested on device — purchase, unlock persistence confirmed. Motion &
  Fitness prompt root-caused: StoreKit fraud detection accesses CMMotionActivityManager internally;
  CMDeviceMotion (gyroscope) does not require NSMotionUsageDescription. Key removed from app.json —
  eliminates mid-purchase prompt; active mode unaffected; PrivacyInfo.xcprivacy unchanged.
  Production EAS build submitted to App Store Connect. Phase 3 complete — under Apple review.
