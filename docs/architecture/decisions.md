# Craving Holdout: Urge Timer — Architecture Decisions

## Table of Contents

**Navigation:** [NativeStack](#navigation-architecture--nativestack--typests) · [BottomTabNavigator](#tab-navigation-wired--bottomtabnavigator--two-level-stack) · [TabNavigator at module scope](#tabnavigator-component-defined-at-module-scope-not-inside-app) · [goBack for fullScreenModal](#goback-required-for-fullscreenmodal-exit--never-navigate)

**Storage & Services:** [AsyncStorage](#asyncstorage-not-sqlite--realm) · [CravingType removed *(superseded)*](#onboarding-simplified--cravingtype-removed-from-data-model) · [Sessions read cache](#sessions-storage--module-level-read-cache) · [Coach shuffle Fisher-Yates](#coach-message-shuffle--fisher-yates-queue-per-pool) · [No analytics V1](#no-analytics-or-crash-reporting-in-v1) · [IAP theme pack](#iap-theme-pack--react-native-iap-non-consumable-499)

**Animation & Shader:** [Reanimated 4.x](#react-native-reanimated-4x-not-animated-api) · [SharedValue + useDerivedValue](#battlevisual-animation-architecture--sharedvalue--usederivedvalue-not-react-state--withtiming) · [SKSL RuntimeEffect](#shopifyreact-native-skia--sksl-runtimeeffect-replaces-expo-linear-gradient-in-battlevisual) · [Time clock at 30fps](#battlevisual-time-clock--useframecallback-at-30fps-not-withrepeattiming) · [Time clock owned by BattleScreen](#shared-time-clock-owned-by-battlescreen-passed-as-prop) · [expo-linear-gradient](#expo-linear-gradient-not-react-native-linear-gradient) · [FBM complexity](#battlevisual-sksl-shader--fbm-complexity-reduction) · [Non-linear craving keyframes](#battlevisual-interpolation--non-linear-craving-arc-keyframes) · [Domain warp + fbmT](#domain-warp--fbmt-for-fire-texture-replaces-linear-fbm-drift) · [Portrait-aware UV](#portrait-aware-uv-distance-in-sksl-shaders) · [withRepeat reverse:true](#withrepeat-reversetrue-for-cyclic-time-uniforms) · [Additive after multiplicative](#additive-color-contributions-must-follow-all-multiplicative-brightness-passes)

**Active Mode / SpatialBalance:** [Active mode feature](#activeppassive-mode-toggle--cognitive-interference-feature) · [SpatialBalance replaces BallsLayer](#spatialbalance-active-mode--gyroscope-physics-replaces-ballslayer) · [orbFixed/orbSize/edgeContact as SharedValue](#orbfixed--orbsize--edgecontact-as-sharedvaluenumber-not-plain-props) · [Passive snap not withTiming](#passive-toggle-direct-value-snap-instead-of-withtiming-r-04) · [Gravity centrifugal sign](#amber-gravity-is-centrifugal-destabilising--sign-convention) · [orbX/orbY owned by BattleScreen](#orbxorbycenterboost-owned-by-battlescreen-written-by-spatialbalance) · [centerBoost uniform](#centerboost-uniform-added-to-battlevisual-shader) · [edgeContact dims only](#edgecontact-dims-orb-light-only--does-not-modify-baseradius) · [amberStrength constant](#amberstrength-is-a-constant-not-a-craving-curve-ramp) · [MAX_X/MAX_Y from Dimensions](#maxxmaxy-derived-from-dimensions-not-hardcoded) · [Gravity normalised per-axis](#gravity-normalised-per-axis-not-shared-edge_zone_radius) · [orbSize session-scoped](#orbsize-is-session-scoped-only--not-persisted-to-asyncstorage) · [gravityHigh plain state](#gravityhigh-is-plain-react-state-not-a-sharedvalue) · [Living color no new uniform](#living-color-uses-existing-uniforms--no-new-uniform-needed) · [P2-11 wind gust envelope](#p2-11--hi-gravity-no-safe-center-via-wind-gust-envelope)

**UI / BattleScreen:** [HistoryScreen progress bar](#historyscreen-uses-progress-bar-fight-record-not-battlevisual-thumbnails) · [Icon-only circular buttons](#icon-only-circular-buttons-animatedview-wrapping-touchableopacity) · [Coach text pill](#coach-text-pill-background) · [Progress bar fill direction](#progress-bar-fill-up-direction-milestone-dots-driven-by-passedcount-sharedvalue) · [SUPPORT ME pool](#support-me-uses-a-dedicated-coach-pool-not-shared-with-auto-milestones) · [Safe area insets for controls](#support-me--gave-in-button-positioning--safe-area-insets) · [setTheme batched with setScreenState](#settheme-batched-with-setscreenstate-in-init--f4-fix) · [Removed recommitment overlay](#removed-forced-recommitment-overlay--ambient-schedule--explicit-controls) · [Progress line as timer](#progress-line-as-session-timer) · [No permanent button labels](#p2-06--craving-permitted-in-first-use-instruction-text-exception-to-coach-voice-rule) · [HOME_TAGLINES tagline](#home_taglines--rotating-pre-session-phrase-on-homescreen) · [Onboarding simplified](#onboarding-simplified--cravingtype-removed-from-data-model) · [P2-13 wonComplete state](#p2-13--woncomplete-state--go-again-navigationreplace) · [React Native / Expo](#react-native--expo-not-swiftui)

**Build / EAS:** [EAS adhoc standalone](#eas-adhoc-profile--standalone-build-no-developmentclient) · [EAS device profile](#eas-device-profile--dev-client-for-physical-device-not-adhoc) · [EAS device with hot-reload](#eas-device-profile--real-device-dev-client-with-hot-reload) · [expo-dev-client](#expo-dev-client-replaces-expo-go-for-battlevisual-development) · [worklets override](#react-native-worklets-pinned-via-npm-override) · [worklets override still active](#react-native-worklets-override--still-active-no-conflict-with-skia) · [Expo SDK pinned](#expo-sdk-pinned-to-54033-matches-expo-go-app-store-version) · [RNGH added](#react-native-gesture-handler--native-dependency-added) · [expo-sensors + expo-haptics](#expo-sensors-and-expo-haptics-added) · [iOS 15+ minimum](#ios-15-minimum)

**Naming / Patterns:** [RECOMMITMENT → MILESTONE](#recommitment--milestone-naming-throughout) · [BallsLayer parked](#ballslayer-parked--replaced-by-spatialbalance-spatial-balance-mechanic) · [makeMutable for imperative](#makemutable-for-dynamic-sharedvalue-creation) · [SafeAreaProvider wrapping](#safeareanprovider-must-wrap-all-screens-in-apptsx-until-navigationcontainer-is-added) · [BallsLayer orb palette](#ballslayer-orb-palette-uses-center-light-colors-not-edgefire-colors)

**App Store / EAS Config:** [Build profiles](#build-profiles-easjson) · [EAS lessons](#key-eas-lessons-carried-from-daily-goals) · [Build types](#three-build-types) · [Ad-hoc steps](#creating-an-ad-hoc-build-step-by-step) · [EAS quick ref](#eas-quick-reference) · [Metro troubleshooting](#cache--metro-troubleshooting) · [Common build issues](#common-build-issues) · [Pre-submission checklist](#pre-submission-checklist) · [App Store metadata](#holdout-app-store-metadata) · [App Store Connect setup](#app-store-connect-steps-one-time-setup) · [Privacy manifest](#privacy-manifest-privacyinfoxcprivacy) · [Export compliance](#export-compliance) · [Icon config](#how-icons-work-in-expo) · [App icon decision](#app-icon--single-iconpng-no-adaptive-icon-or-favicon) · [App rename](#app-rename--holdout--craving-holdout-urge-timer)

---

## §1 Architectural Decisions

### Navigation architecture — NativeStack + types.ts
**Decision:** `createNativeStackNavigator` from `@react-navigation/native-stack`. Two screens:
`Home` (HomeScreen) and `Battle` (BattleScreen, `presentation: 'fullScreenModal'`).
`RootStackParamList` lives in `src/navigation/types.ts` — imported by all screens via
`useNavigation<NativeStackNavigationProp<RootStackParamList, 'ScreenName'>>()`.
**Date:** 2026-03-30
**Reason:** `@react-navigation/bottom-tabs` deferred until HistoryScreen is built — adding the
dependency before its screen exists adds noise. The HomeScreen tab stub remains cosmetic until
then. `fullScreenModal` on Battle disables the swipe-back gesture (intentional — quitting
requires affirmatively tapping GAVE IN, not an accidental back swipe). Placing the param list type
in `src/navigation/types.ts` avoids circular imports that would result from screens importing
from App.tsx (which imports the screens).
**SafeAreaProvider:** App.tsx now has NavigationContainer for the home branch (no SafeAreaProvider
wrapper needed — NavigationContainer provides its own). The onboarding branch retains its explicit
SafeAreaProvider, as OnboardingScreen renders outside the NavigationContainer.

### Tab navigation wired — BottomTabNavigator + two-level stack
**Decision:** `@react-navigation/bottom-tabs` added. Navigation structure: `RootStack (NativeStackNavigator) → [Tabs (BottomTabNavigator: Home + History)] + [Battle (fullScreenModal)]`. `TabParamList` added to `src/navigation/types.ts`. `RootStackParamList` restructured: `{ Tabs: NavigatorScreenParams<TabParamList>; Battle: undefined }`.
**Date:** 2026-04-04
**Reason:** Tabs wrap Home + History; Battle must remain as a fullScreenModal on the root stack (not inside the tabs) so it slides up over the entire tab bar, not just the content area. `navigation.navigate('Battle')` from the Home tab propagates upward to the root stack in React Navigation v6+ — no `getParent()` call needed.
**HomeScreen navigation type:** Updated to `CompositeNavigationProp<BottomTabNavigationProp<TabParamList, 'Home'>, NativeStackNavigationProp<RootStackParamList>>` — gives HomeScreen access to both tab navigation and root stack navigation (needed for `navigate('Battle')`).

### HistoryScreen uses progress bar fight record (not BattleVisual thumbnails)
**Decision:** Each session renders as a horizontal progress bar — full-width white for won, partial amber for gave-in (proportional to `duration / SESSION_DURATION_MS`). Milestone ticks (2px, `COLORS.BACKGROUND`) cut through the fill at 20/40/60/80% of bar width (minutes 4/8/12/16). Stats block at top: win rate, current streak, best streak.
**Date:** 2026-04-04
**Reason 1 — performance:** Each BattleVisual thumbnail requires a Skia Canvas + SharedValue. A list of 30+ sessions would instantiate 30+ GPU-heavy shader pipelines simultaneously.
**Reason 2 — legibility:** A frozen SKSL shader at small thumbnail size does not visually distinguish won from gave-in at a glance. The progress bar encodes three things simultaneously: outcome (color), magnitude (how far they got), and milestone crossings (tick marks). No legend required.

### TabNavigator component defined at module scope, not inside App
**Decision:** `TabNavigator` is a named function component declared at module level in `App.tsx`, not inside the `App` component function.
**Date:** 2026-04-04
**Reason:** A component defined inside a render function gets a new function identity on every render of the parent. React treats a new component type as a different component entirely — all mounted screens inside the tab navigator would fully remount (unmount + remount) on every `App` re-render (e.g. `appState` changes during init). Module-level declaration gives `TabNavigator` a stable identity for the lifetime of the app.

### React Native / Expo (not SwiftUI)
**Decision:** React Native / Expo SDK 54.0.33, EAS Cloud builds
**Date:** March 2026
**Reason:** Developer is on Windows — SwiftUI requires macOS / Xcode. React Native + EAS Cloud enables full iOS builds entirely from Windows with no Mac required.
**Reason 2:** Expo Go provides instant visual feedback during animation development — essential for tuning the battle visual. The SwiftUI iteration cycle (15–20 min EAS build per change) is incompatible with animation work.

### AsyncStorage (not SQLite / Realm)
**Decision:** `@react-native-async-storage/async-storage` exclusively
**Date:** March 2026
**Reason:** Holdout has no relational data. Session records and preferences fit cleanly in key/value JSON. AsyncStorage needs no schema migration, no native binary, and is trivially testable. SQLite adds complexity for zero benefit.

### CravingType — single source of truth in preferences.ts
**Decision:** `CravingType` is exported from `src/storage/preferences.ts` and imported wherever the type is needed (`sessions.ts`, `SessionService.ts`). It is never redefined or widened to `string` in downstream modules.
**Date:** March 2026
**Reason:** `Session.cravingType` was originally typed as `string`, creating a silent widening mismatch with `Preferences.cravingType` (a 5-value union). If both modules define the type independently they can silently drift. `preferences.ts` is the source of record for user preferences — the craving type lives there. All consumers import from it. This creates a one-way dependency: `sessions.ts` → `preferences.ts`, which is acceptable since sessions record what the user's preference was at session start.
**Superseded: 2026-04-18 (Session 25).** `CravingType` has been removed from the data model entirely. See: "Onboarding simplified — CravingType removed from data model."

### React Native Reanimated 4.x (not Animated API)
**Decision:** `react-native-reanimated` for all animations
**Date:** March 2026
**Reason:** Reanimated 4.x runs on the UI thread — animations don't drop frames when the JS thread is busy. The battle visual requires sustained 60fps gradient animation that the JS-thread `Animated` API cannot reliably deliver on older devices.

### BattleVisual animation architecture — SharedValue + useDerivedValue (not React state + withTiming)
**Decision:** `sessionProgress` is a Reanimated `useSharedValue<number>` created in BattleScreen and passed to BattleVisual as a prop. BattleVisual derives amber/center radii via `useDerivedValue` + `interpolate`. The JS interval writes directly to `sessionProgress.value` every 250ms.
**Date:** March 2026
**Reason:** Two approaches were evaluated:

*Rejected — React state + withTiming on tick:*
`progress` as React state → `setProgress` every 100ms → 10 JS re-renders/second for 20 minutes.
`withTiming` called in `useEffect([progress])` → new 3-second ease starts every 100ms, cancelling the previous. Result: visible gradient stutter instead of smooth flow.

*Adopted — SharedValue + useDerivedValue:*
`useDerivedValue` runs on the UI thread continuously. No JS re-renders for gradient position changes. Animation is the derivation itself — no `withTiming` needed for continuous tracking. `withTiming` is reserved strictly for one-shot state transitions (gave-in drain only — win sequence uses a separate `winOpacity` shared value).

**Interval tick rate:** 250ms. The animation is UI-thread driven and does not depend on the JS interval frequency. 250ms is sufficient for recommitment scheduling logic.

**Background return:** Write recalculated elapsed position directly to `sessionProgress.value` — `useDerivedValue` reacts instantly, visual snaps to correct position without animation restart.

**Ownership:** BattleScreen creates and owns `sessionProgress`. `cancelAnimation` is called in BattleScreen's cleanup, not BattleVisual's.

### Icon-only circular buttons (Animated.View wrapping TouchableOpacity)
**Decision:** Action buttons use `Animated.View` as the outer shell with `TouchableOpacity` filling it via `width/height: '100%'`. Text labels removed — icons only (shield-outline for SUPPORT ME, close-outline for GAVE IN).
**Date:** 2026-04-04
**Reason:** Text-only buttons disappeared against the white/teal center as `sessionProgress` approaches 1.0. `Animated.View` is required as the wrapper because `TouchableOpacity` cannot accept `useAnimatedStyle` shadow props directly. The inner `TouchableOpacity` with `iconButtonInner` style preserves the full touch target. Icons from `@expo/vector-icons` Ionicons — bundled in Expo managed workflow, no native build required.

### Coach text pill background
**Decision:** Coach lines render inside a dark semi-transparent pill (`rgba(0,0,0,0.48)`, `borderRadius: 14`) rather than relying on `textShadow` alone.
**Date:** 2026-04-04
**Reason:** `textShadow` alone is insufficient when the center force is near-white (late session). The pill ensures readability against all shader states without knowledge of current shader output color.

### Progress bar: fill-up direction, milestone dots driven by passedCount SharedValue
**Decision:** Progress bar grows left→right (fill toward goal). Milestone dots at 4/8/12/16 min light up amber and pop-scale when each milestone fires, driven by a `passedCount` SharedValue set from `checkMilestoneSchedule` — not from `sessionProgress` thresholds.
**Date:** 2026-04-04
**Reason 1:** Shrinking bar reads as time running out (anxiety). Growing bar reads as progress toward a goal — consistent with the product framing that staying is winning.
**Reason 2:** `sessionProgress`-threshold dots fired at exactly 4:00/8:00/12:00/16:00. The scheduled milestone fires at ±30s variance. Two independent trigger systems meant dots, coach line, and shockwave were never guaranteed to coincide. Driving all three from the same `checkMilestoneSchedule` call via `passedCount.value` eliminates the desync entirely.

### SUPPORT ME uses a dedicated coach pool (not shared with auto-milestones)
**Decision:** `getCoachMessageForElapsed()` draws from `COACH_MESSAGES.supportMe` (early/mid/late sub-pools), not from tap1–tap4.
**Date:** 2026-04-04
**Reason:** tap1–tap4 contain minute-specific language ("Four minutes. It's easing.", "Minute 8. Hardest point.") that is only accurate when fired at the exact scheduled moment. A SUPPORT ME tap at minute 7 returning a minute-4 message is factually wrong. The `supportMe` pool contains position-aware messages with no minute references — correct at any time within the phase window. Phase boundary: early ends at 8 min (not 9) to match the milestone at minute 8.

### BattleVisual time clock — useFrameCallback at 30fps (not withRepeat/withTiming)
**Decision:** The `time` SharedValue driving the SKSL shader is updated via `useFrameCallback` throttled to ~30fps (33ms gate), not `withRepeat(withTiming(...))`.
**Date:** 2026-04-05
**Reason:** The original `withRepeat(withTiming(1000, { duration: 3_000_000 }), -1)` drove the shader at the display's native refresh rate (60fps, or 120fps on ProMotion devices). The SKSL shader is computationally expensive (4-octave FBM, multiple calls per pixel) — sustained full-rate execution caused the device back to warm by minute 8 of a 20-minute session. Dropping to 30fps halves GPU submit rate on 60fps devices and reduces it by 75% on 120fps ProMotion devices. Visual quality is indistinguishable at 30fps because all shader motion is slow and organic — only the shockwave pulse (driven by its own `withTiming`, unaffected) is fast enough to benefit from higher frame rate.
**Implementation:** `useFrameCallback` fires every display frame; a `_lastFrameTs` SharedValue gates writes to `time.value` when <33ms have elapsed. Time is computed as `(frameInfo.timestamp / 3000) % 1000` — same 0→1000 range as the original clock. `cancelAnimation(time)` is not needed in cleanup — `time` is written directly by the frame callback, not driven by a Reanimated animation.

### Shared time clock owned by BattleScreen, passed as prop
**Decision:** The `time` SharedValue that drives shader animation is created in BattleScreen and passed as a `SharedValue<number>` prop to both BattleVisual and BallsLayer. BattleVisual no longer owns its own `useFrameCallback`.
**Date:** 2026-04-06
**Reason:** BallsLayer's SKSL shader and `useAnimatedStyle` drift require the same time base as BattleVisual's shader. Two independent frame callbacks would produce independent clock phases — orbs and background could drift out of sync. A single clock in BattleScreen guarantees both children share the exact same time value each frame.
**Formula preserved:** `(frameInfo.timestamp / 3000) % 1000`. The alternative `timeSinceFirstFrame / 1000` was rejected — it produces 1.0 units/sec vs the current 0.333 units/sec, which would run all shader animations (breathing, heartbeat, warp) at 3× speed.
**Ownership:** BattleScreen creates `time` and `_lastFrameTs`, applies the 33ms/30fps gate, and is responsible for cleanup. BattleVisual and BallsLayer read `time.value` through their respective `useDerivedValue` uniforms — neither owns or cleans up the value.

### BallsLayer orb palette uses center-light colors, not edge/fire colors
**Decision:** Orb shader uses the center-light palette per theme (white→teal for fire/void, amber-gold→orange for ember), not the edge/fire ramp palette.
**Date:** 2026-04-06
**Reason:** The edge/fire ramp (soot → deep red → amber) is designed for large-area gradients and reads as darkness pressing in. At 64pt orb size the ramp compresses to near-black. The center-light palette is already tuned for small bright shapes — it's what the center of the main shader looks like, and it reads as energy rather than threat. Orbs are the user's active force, so a bright palette is semantically correct.

### BattleVisual SKSL shader — FBM complexity reduction
**Decision:** FBM octaves reduced from 5 to 4. `boil` fbm call removed. `phase` calculation reduced from 2 fbm calls to 1.
**Date:** 2026-04-05
**Reason:** Original shader ran 7 fbm calls × 5 octaves = 35 noise iterations per pixel per frame. Sustained GPU load caused device heat during 20-minute sessions. Octave 5 (3.125% signal amplitude) is sub-pixel on mobile and not perceptible. 3 octaves was tested but caused visible blurring — 4 is the correct minimum for this visual. The `boil` boundary-turbulence fbm call was redundant given `depthNoise` already provides strong boundary variation. Merging the two `phase` fbm calls into one single 2D call is visually equivalent. Final shader cost: 5 fbm calls × 4 octaves = 20 iterations/pixel (−43% from original 35). Combined with the 30fps frame rate cap, device heat is eliminated.

### EAS adhoc profile — standalone build, no developmentClient
**Decision:** `developmentClient: true` removed from the `adhoc` profile in eas.json.
**Date:** 2026-04-05
**Reason:** With `developmentClient: true`, the adhoc install is a dev client shell that requires Metro running on the PC before the app can launch on device. The `adhoc` profile is intended for standalone personal validation — JS bundle baked into the app at EAS build time, opens directly on device like any App Store app. Daily hot-reload dev work uses the `development` profile.
Rule: `adhoc` = standalone (no `developmentClient`). `development` = dev client with hot reload.

### Sessions storage — module-level read cache
**Decision:** Module-level `_cache: SessionRecord[] | null` added to `src/storage/sessions.ts`. Populated on first `getSessions()` call. Invalidated (set to `null`) in both `saveSession()` and `updateSession()` before each write.
**Date:** 2026-04-05
**Reason:** Cold launch called `getSessions()` twice in sequence — once inside `getActiveSession()` (crash recovery) and again inside `saveSession()` (append new session). With the cache, the second read is served from memory. The cache never grows stale because it is cleared before every write.

### Coach message shuffle — Fisher-Yates queue per pool
**Decision:** `randomFrom()` in `CoachService.ts` replaced with `pickFrom()` — a shuffle-without-repeat picker backed by a `Map<readonly string[], number[]>` of index queues keyed by pool reference.
**Date:** 2026-04-05
**Reason:** Pure `Math.random()` has no memory — the same line could appear on consecutive sessions. With pools of 2–3 messages, repetition was likely within a handful of sessions. Fisher-Yates guarantees every message in a pool appears once before any repeats. The queue is keyed on pool array reference (object identity) — each pool (tap1, tap2, supportMe.early, etc.) tracks independently. Queue persists for the app's lifetime; no reset between sessions.

### setTheme batched with setScreenState in init() — F4 fix
**Decision:** `setTheme(resolvedTheme)` moved to after the last `await` in BattleScreen `init()`, batched with `setCoachLine`, `setCoachKey`, and `setScreenState('running')` in one synchronous block.
**Date:** 2026-04-05
**Reason:** Previously `setTheme` was called before `await startSession()`. This put the theme state update in an earlier render than `setScreenState('running')`, causing BattleVisual to mount in a subsequent render where the Reanimated worklet had not yet evaluated the updated `theme` closure — a sub-20ms wrong-theme frame on VOID and EMBER. React 18 batches all state setters in the same synchronous block into one render — placing `setTheme` alongside `setScreenState` guarantees BattleVisual mounts with the correct theme from frame 1.

### SUPPORT ME / GAVE IN button positioning — safe area insets
**Decision:** Button `bottom` position uses `Math.max(insets.bottom, 16) + 16` as an inline style, not a hardcoded `bottom: 52` in `StyleSheet.create`.
**Date:** 2026-04-05
**Reason:** `StyleSheet.create` is evaluated at module load time — `insets` from `useSafeAreaInsets()` is a runtime value and cannot be used there. `bottom: 52` happened to clear the home indicator on current test devices but would place buttons under the indicator on devices with taller safe areas. The formula ensures a minimum 16pt gap on devices with no home indicator, and clears the indicator (typically 34pt) + 16pt on notched devices.

### RECOMMITMENT → MILESTONE naming throughout
**Decision:** All "recommitment" naming replaced with "milestone" across `timing.ts`, `sessions.ts`, `SessionService.ts`, `BattleScreen.tsx`, `CoachService.ts`, `BattleVisual.tsx`. `RECOMMITMENT_TIMEOUT_MS` deleted (dead code — timeout-to-gave-in mechanic removed in Session 11). `recommitmentsCompleted` → `milestonesReached` on the session record.
**Date:** 2026-04-04
**Reason:** "Recommitment" named the old mechanic where the user had to tap within 30 seconds or the session ended. That mechanic is gone. Milestones now fire silently (coach + shockwave + dot). "Milestone" accurately describes what they are.

### EAS `device` profile — dev client for physical device (not `adhoc`)
**Decision:** `eas build --platform ios --profile device` is the correct command for
installing the expo-dev-client on a physical iPhone. The `adhoc` profile does NOT have
`developmentClient: true` — it produces a baked standalone build for sign-off testing.
All docs/setup/ files updated 2026-04-09 to reflect this split.
**Date:** 2026-04-09
**Reason:** The `adhoc` profile had `developmentClient` removed in a prior session to make
it a true standalone sign-off build. This created two distinct profiles with non-overlapping
purposes. Docs were still describing `adhoc` as the dev client command — corrected.
**Rule:** `device` = dev client + hot-reload. `adhoc` = standalone sign-off (no Metro needed). `production` = App Store.

### react-native-worklets pinned via npm override
**Decision:** `overrides: { "react-native-worklets": "0.5.1" }` in `package.json`
**Date:** 2026-03-28
**Reason:** `react-native-reanimated@4.1.1` resolves `react-native-worklets@0.8.1` via npm.
Expo Go SDK 54 bundles the native binary for `react-native-worklets@0.5.1` — confirmed via
`node_modules/expo/bundledNativeModules.json`. Version mismatch causes `Exception in HostFunction:
<unknown>` on launch: the JS worklet runtime calls into the C++ native module, gets a protocol
mismatch, and throws before the app can register its entry point.
The npm `overrides` field forces `0.5.1` everywhere in the dependency tree. Reanimated 4.1.1
explicitly accepts `0.5 - 0.8` as its peer range, so `0.5.1` is compatible.
**On Expo SDK upgrade:** re-check `bundledNativeModules.json` for the bundled worklets version
and update the override accordingly.

### BattleVisual interpolation — non-linear craving arc keyframes
**Decision:** `amberRadius` and `centerRadius` use 5-point keyframe interpolation, not linear.
**Date:** 2026-03-28
**Reason:** Linear interpolation `[0,1]→[0.15,1.0]` placed the center at 72% of maxDiameter
at minute 12 (67% progress) — the screen was mostly white by session midpoint. The craving
arc is non-linear: amber dominant through minute 8, barely perceptible turn at minute 8,
rapid amber retreat in minutes 14–20. 5-point keyframes at progress [0, 0.2, 0.4, 0.7, 1.0]
(minutes 0, 4, 8, 14, 20) enforce this arc structurally rather than relying on visual tuning.
**Values:** amberRadius [0.92, 0.90, 0.83, 0.48, 0.0], centerRadius [0.08, 0.13, 0.22, 0.52, 1.0]
**Tuning note:** The [0.4] keypoint (minute 8) controls how visible the turn is. The [0.7]
keypoint (minute 14) controls when "victory feels inevitable." Adjust these two first if
pacing needs tuning after real-session validation.

### expo-linear-gradient (not react-native-linear-gradient)
**Decision:** `expo-linear-gradient` for all gradient rendering in BattleVisual
**Date:** 2026-03-28
**Reason:** `react-native-linear-gradient` is a native module not bundled in Expo Go SDK 54. Any Expo Go launch with it installed throws `Exception in HostFunction: <unknown>` on startup. `expo-linear-gradient` ships bundled in Expo Go and has an identical props API — import syntax changes from a default import to a named import, nothing else changes. Switch confirmed on first Expo Go run.

### Expo SDK pinned to 54.0.33 (matches Expo Go App Store version)
**Decision:** SDK 54.0.33, matching Daily Goals and the Expo Go 54.0.2 release on App Store
**Date:** March 2026
**Reason:** Expo Go on the App Store was 54.0.2 — incompatible with SDK 55. SDK 55 requires either a dev client build (adds 15–20 min iteration cycle) or waiting for Expo Go to update. Since Daily Goals is already on 54.0.33, pinning to the same version keeps both projects aligned and Expo Go usable for daily iteration immediately.
**Future:** Upgrade to SDK 55+ when Expo Go on App Store catches up.

### No analytics or crash reporting in V1
**Decision:** No Sentry, Amplitude, or any analytics in V1
**Reason:** V1 validates the core mechanic with one user. External SDKs increase app size, privacy manifest complexity, and potential App Store review friction. Add Sentry in V2 after launch validation.

### IAP theme pack — react-native-iap, non-consumable, $4.99
**Decision:** `react-native-iap@14.7.0` (exact pinned minor version). Single non-consumable
product `com.novaventuresco.holdout.themes` at $4.99 unlocks all 6 premium themes at once.
No RevenueCat. No server-side receipt validation.
**Date:** 2026-04-26
**Reason — one pack not six:** Simpler App Store Connect setup, single restore call, cleaner paywall.
Six individual products would require six restore checks and six product fetches on launch.
**Reason — react-native-iap over expo-in-app-purchases:** expo-in-app-purchases was deprecated
and removed from the Expo SDK. RevenueCat introduces an external service dependency that
conflicts with the no-backend constraint.
**Reason — no server-side validation:** Non-consumable purchases are device-validated by StoreKit
and restore via `getAvailablePurchases()` — no receipt server needed. Adding one would violate
the no-backend constraint for no user-visible benefit (bypassing only grants 6 visual themes).
**Reason — exact version pin:** react-native-iap has historically introduced breaking API changes
between minor versions. `14.7.0` validated against v14 type surface: `.id`/`.displayPrice` on
products, `type: 'in-app'` required in `requestPurchase`, `ErrorCode` enum for cancel detection.
**Architecture:** `IAPService.ts` module-level pending-promise map correlates `requestPurchase()`
with async `purchaseUpdatedListener` response. On success, HomeScreen persists
`unlockedThemes: PREMIUM_THEMES` to AsyncStorage and immediately unlocks all 6 swatches.
`ThemePackPaywall.tsx` is a Modal bottom sheet — connects/disconnects IAP on mount/unmount.
**Pre-submission checklist:** Sign Paid Apps Agreement, create product in App Store Connect,
create Sandbox Tester, test on physical device (Sandbox requires device, not simulator),
confirm `DEV_UNLOCK_ALL_THEMES = false` in HomeScreen.tsx before build.

### @shopify/react-native-skia + SKSL RuntimeEffect (replaces expo-linear-gradient in BattleVisual)
**Decision:** `@shopify/react-native-skia@2.2.12` for BattleVisual animation
**Date:** 2026-03-28
**Reason:** The panel-gradient approach (four expo-linear-gradient panels + a center circle) cannot produce organic, turbulent fire. SKSL fragment shaders (via `Skia.RuntimeEffect.Make`) enable per-pixel FBM (fractional Brownian motion) noise — the boundary between amber and center becomes a living, shifting edge rather than a geometric arc. expo-linear-gradient remains in the project for any future non-BattleVisual use.
**Worklets conflict check:** react-native-skia 2.2.12 has no dependency on `react-native-worklets` — the existing `overrides: { "react-native-worklets": "0.5.1" }` is unaffected.
**Module scope:** `Skia.RuntimeEffect.Make(SHADER_SRC)` is called at module scope (outside the component), not inside the component body. RuntimeEffect creation is expensive — running it on every render would drop frames.

### expo-dev-client (replaces Expo Go for BattleVisual development)
**Decision:** `expo-dev-client@~6.0.20` added; `expo-dev-client` added to `app.json` plugins
**Date:** 2026-03-28
**Reason:** `@shopify/react-native-skia` is a native module not bundled in Expo Go. The dev loop is preserved: one EAS development build installs the custom dev client on device; after that, `npx expo start` + QR scan gives the same instant hot-reload as Expo Go. SKSL shader code lives in a JS string — changes to it hot-reload without a new native build.
**Build command:** `eas build --platform ios --profile development` (use the existing `development` profile — it already specifies `"distribution": "internal"`). After install, scan QR with the dev client app, not Expo Go.
**Note:** The development profile in eas.json does not need `"simulator": false` removed — both work. The device must be registered before the build.

### react-native-worklets override — still active, no conflict with Skia
**Decision:** Keep `"overrides": { "react-native-worklets": "0.5.1" }` unchanged
**Date:** 2026-03-28
**Reason:** react-native-skia 2.2.12 has zero dependency on react-native-worklets. The override was added for Reanimated 4.1.1 compatibility with Expo Go SDK 54 native modules. Now that Expo Go is replaced by expo-dev-client for BattleVisual work, the override may be removable in a future cleanup — but it does no harm and is still correct for the Reanimated/worklets pairing.

### iOS 15+ minimum
**Decision:** `deploymentTarget: "15.0"` (not 13.4 from Daily Goals)
**Reason:** iOS 15 covers 97%+ of active iPhones as of 2026. The battle visual gradient APIs are stable on iOS 15+. Going lower provides no meaningful reach gain.

### Portrait-aware UV distance in SKSL shaders
**Decision:** Use `length(uv - 0.5)` (UV space) for the amber/center boundary radius; keep `p` (aspect-corrected space) for all FBM noise coordinates.
**Date:** 2026-03-28
**Reason:** Using `length(p)` for boundary radius (where `p = (uv - 0.5) * float2(aspect, 1.0)`) produces a circle that reaches the left/right edges before the top/bottom in portrait orientation — amber disappears from the sides before the corners. UV space (`length(uv - 0.5)`) measures from center in normalized [0,1] coordinates — 0.5 is the distance to every edge, so the boundary reaches all four edges simultaneously. Noise coordinates still use aspect-corrected `p` so the FBM texture is isotropic and doesn't appear stretched on portrait screens.

### withRepeat reverse:true for cyclic time uniforms
**Decision:** `time.value = withRepeat(withTiming(300, { duration: 300_000 }), -1, true)` — `reverse: true` is required.
**Date:** 2026-03-28
**Reason:** Without `reverse: true`, `withRepeat` resets the value from 300 back to 0 at cycle end — a hard discontinuous jump. In the BattleVisual shader, `time` drives all FBM animation; the turbulence texture resets visibly at every cycle, producing a noticeable flash every 5 minutes. `reverse: true` causes the animation to ping-pong (0→300→0→300) — the reset is invisible because the shader state at t=300 and t=299.9 is nearly identical.

### Domain warp + fbmT for fire texture (replaces linear FBM drift)
**Decision:** Amber fire texture uses domain warping (distort sample coordinates with a noise lookup before the final FBM call) + `fbmT()` (turbulence FBM using `abs(noise - 0.5)`).
**Date:** 2026-03-28
**Reason:** Two approaches were rejected before this was adopted:

*Rejected — normalize(p) + linear time offset:*
`float2 drift = normalize(p) * time * constant` creates radial coherence — all pixels on the same ray from center share the same unit direction, sampling identical noise coordinates → star/spike artifacts. Linear `time * constant` accumulates to unbounded values (0.07 × 300 = 21 UV units = 46 full noise texture periods of lateral translation → constant directional scroll).

*Rejected — standard fbm() with directional drift:*
Standard FBM output clusters around 0.5 with gentle tails — produces smooth cloud blobs, not fire tongues. Exhibits the same accumulation drift issue.

*Adopted — domain warp + fbmT:*
Domain warping: sample two noise lookups to create warp vectors `(wx, wy)`, offset final sample coord by `p + float2(wx, wy) * 0.40` — creates curling, organic fire shapes. `fbmT()` uses `abs(noise(p) - 0.5)` which folds noise at midpoint, turning smooth mid-range clusters into sharp ridges (fire tongues, not clouds). All time offsets use `sin/cos` oscillation — bounded to ±amplitude, never accumulate.

### goBack() required for fullScreenModal exit — never navigate()
**Decision:** All exit points in BattleScreen use `navigation.goBack()`, not `navigation.navigate('Home')`.
**Date:** 2026-04-04
**Reason:** `navigate('Home')` pushes a new HomeScreen onto the stack. The fullScreenModal BattleScreen remains mounted underneath. Result: swiping down on HomeScreen reveals BattleScreen still active below. `goBack()` dismisses the modal cleanly, revealing the pre-existing HomeScreen behind it.
**Rule:** Any screen presented as `presentation: 'fullScreenModal'` must exit via `goBack()`.

### Visual theme system — preference + shader uniform
**Decision:** Three themes stored as `visualTheme?: 'fire' | 'void' | 'ember'` in preferences. BattleVisual receives a plain `theme: number` prop (0/1/2). Shader branches fire color ramp and center light via a `uniform float theme`.
**Date:** 2026-04-04
**Themes:** `fire` (amber edges, white/teal center — default), `void` (navy/indigo/violet edges, white/teal center), `ember` (near-black edges, amber/orange center — inverted metaphor).
**Reason:** Theme is selected on HomeScreen, saved immediately to preferences. BattleScreen reads it on mount and passes a plain number — no SharedValue needed because theme doesn't change mid-session. Defaults to `fire` with no migration required for existing users.
**Extended 2026-04-18 (P2-17):** Three premium themes added (total 6). VisualTheme union extended to `'fire' | 'void' | 'ember' | 'glacier' | 'abyss' | 'solar'`. BattleVisual shader extended with 3 new branches per section (heat ramp, center light, edge pressure). themeMap in BattleScreen extended to `{ fire:0, void:1, ember:2, glacier:3, abyss:4, solar:5 }`. Glacier: ice-blue edges, warm amber/gold center. Abyss: pitch-black edges, bioluminescent cyan-green center (1.8× brightness). Solar: blazing gold-white edges, deep violet/crimson center.
**Extended 2026-04-19:** Three additional themes added (total 9). VisualTheme extended to include `'aurora' | 'dusk' | 'nebula'`. themeMap extended to `{ ..., aurora:6, dusk:7, nebula:8 }`. Aurora: electric green/lime edges, silver-pearl center. Dusk: deep magenta→rose→coral edges, warm gold center. Nebula: deep violet→hot-magenta edges, brilliant electric ice-blue center (1.85× brightness). HomeScreen grid grows from 2×3 to 3×3.

### Theme picker consolidation — all 9 themes on HomeScreen, Settings reduced to science panel
**Decision:** All 9 visual themes are displayed as a 3×3 grid on HomeScreen for quick pre-session selection. SettingsScreen no longer contains a theme picker — it shows only the "HOW IT WORKS" science panel. Free/premium split and lock enforcement implemented 2026-04-19 (see Theme IAP tier model ADR). `prefs.unlockedThemes` stores purchased IDs. IAP transaction wiring deferred to P3-07.
**Date:** 2026-04-18
**Reason:** The HomeScreen picker was already the user's primary theme-selection surface and the established quick-pick pattern before a session. Adding 3 premium themes to Settings (P2-18) then discovering a product logic gap — Settings selection silently overwrote HomeScreen state (R-02, Session 27 review) — confirmed that two theme-management surfaces creates UX confusion. Consolidating on HomeScreen preserves the "tap theme, tap start" flow. Settings becomes a reference-only screen with no state changes.

### Theme IAP tier model — free vs. premium split, lock enforcement, DEV_UNLOCK_ALL_THEMES
**Decision:** Three themes are permanently free: `fire`, `void`, `ember`. Six themes are premium: `glacier`, `abyss`, `solar`, `aurora`, `dusk`, `nebula`. Lock enforcement lives entirely in HomeScreen via `isUnlocked(id, prefs)` — a pure helper that (1) gates `handleThemeSelect` (early return if locked) and (2) drives lock UI on swatches. Locked swatches: 45% opacity + `rgba(0,0,0,0.30)` dark scrim overlay + `lock-closed` Ionicons icon centered on the circle + 35% opacity label. `activeOpacity={1}` on locked swatches — no tap feedback. `FREE_THEMES` and `PREMIUM_THEMES` are typed `VisualTheme[]` constants. `prefs.unlockedThemes?: VisualTheme[]` (already in Preferences interface) stores purchased theme IDs.
**Date:** 2026-04-19
**Dev testing:** `DEV_UNLOCK_ALL_THEMES` boolean constant at the top of HomeScreen. `true` = all themes unlocked (dev default). `false` = simulates a user with no purchases — premium swatches show lock UI, taps are no-ops. Must be `false` before TestFlight or production build.
**P3-07 hook:** `handleThemeSelect` returns early when locked with comment `// locked — P3-07 will show IAP sheet here`. IAP wiring replaces the `return` with a StoreKit trigger — no structural change to the function needed.
**Reason:** fire/void/ember define the core product; all users get them. The 6 premium themes are visually distinct additions from Phase 2. Whether sold as one pack or individually is a P3-07 commerce decision. Lock logic is pure set membership (`FREE_THEMES.includes(id)` or `prefs.unlockedThemes?.includes(id)`) — no time gates, streak gates, or server calls needed.

### Ghost of light mode — dark background on screen transitions
**Decision:** Two-layer fix for white flash during navigation transitions.
- JS layer: `sceneContainerStyle: { backgroundColor: COLORS.BACKGROUND }` on `Tab.Navigator` screenOptions. Covers tab screen containers (Home, History). Pure JS — hot-reloads immediately.
- Native layer: `expo-system-ui` added to package.json. After next EAS device build, activate by adding `import * as SystemUI from 'expo-system-ui'` and `useEffect(() => { SystemUI.setBackgroundColorAsync(COLORS.BACKGROUND); }, [])` to App.tsx. Covers native card transitions (Settings push, Battle fullScreenModal).
**Date:** 2026-04-18
**Reason:** React Navigation's native stack uses a white UIViewController root background by default. `sceneContainerStyle` sets the JS-layer View background but cannot reach the native UIKit layer. Only `SystemUI.setBackgroundColorAsync` writes `#0D0D0D` to the iOS native root, eliminating white frame at the native level. `expo-system-ui` cannot be called before its native module is compiled into the running binary — calling it in a dev client that predates the package install throws `Cannot find native module 'ExpoSystemUI'` synchronously (`.catch()` does not suppress it; the error is not a promise rejection).

### SpatialBalance active mode — gyroscope physics replaces BallsLayer
**Decision:** Active mode v1 (BallsLayer — drag-to-center delivery) parked. Active mode v2 (SpatialBalance — gyroscope balance) adopted. SpatialBalance is a physics-only component that renders null. It writes `orbX`/`orbY` (pixel offset from screen centre) and `centerBoost` to SharedValues owned by BattleScreen. BattleVisual reads these via `useDerivedValue` → `orbOffset`/`orbFixed` shader uniforms. No separate orb renderer — the centre force in the existing shader IS the orb.
**Date:** 2026-04-08
**Reason:** BallsLayer required direct screen touch (drag) which competes with the passive observation mode. Gyroscope balance: (a) requires no touch, leaving the screen as pure ambient display; (b) creates a physical proprioception loop — the phone's mass IS the mechanic; (c) maps the craving experience onto a real force the user must overcome; (d) removes the RNGH dependency from the active path.

### orbFixed / orbSize / edgeContact as SharedValue<number> (not plain props)
**Decision:** `orbFixed`, `orbSize`, and `edgeContact` are all `SharedValue<number>` owned by BattleScreen, read as `.value` inside `useDerivedValue` in BattleVisual. None are plain props or plain JS values.
**Date:** 2026-04-08 (`orbFixed`); 2026-04-09 (`orbSize`, `edgeContact`)
**Reason:** `useDerivedValue` worklets react only to `.value` accesses on SharedValues. A plain prop is snapshotted at worklet-registration time — on mode toggle, React re-renders and re-registers with a 1–2 frame lag. For `orbFixed`, this lag causes a visible center-size jump (~60% radius difference) for one frame. `orbSize` and `edgeContact` follow the same pattern for the same reason — any shader input that can change mid-session must be a SharedValue. `orbSize` toggles between 0 (small) and 1 (medium) from a BattleScreen button; `edgeContact` is written continuously by SpatialBalance's physics loop.

### Passive toggle: direct value snap instead of withTiming (R-04)
**Decision:** When toggling from active to passive mode, `orbX.value = 0`, `orbY.value = 0`, and `centerBoost.value = 0` are direct assignments, not `withTiming`.
**Date:** 2026-04-08
**Reason:** `handleModeToggle` sets `setActiveMode(false)` synchronously, but React schedules the SpatialBalance unmount after the event handler returns. The physics `setInterval` can fire one more tick in the 0–33ms window before `clearInterval` runs in cleanup. That tick writes `orbX.value = number` directly, cancelling any running `withTiming`. Since orb position is not preserved between sessions, snap-to-zero is acceptable and eliminates the race entirely.

### Amber gravity is centrifugal (destabilising) — sign convention
**Decision:** Amber gravity force in SpatialBalance uses `+gravX/Y` (same sign as the displacement), making it centrifugal — it amplifies displacement away from centre toward edges.
**Date:** 2026-04-08
**Reason:** Initial implementation used `−gravX/Y` (centripetal — stabilising). With centripetal gravity the orb naturally rests at centre, user tilt moved it toward edges, and amber gravity fought it back — inverting the mechanic entirely. Correct behaviour: amber gravity pulls the orb toward the nearest edge; the user counter-tilts to hold centre. The equilibrium at centre with `+gravX/Y` is unstable — any small displacement is amplified. That is the correct feel.
**Note:** Physics constants (GRAVITY_SCALE=350, GYRO_SENSITIVITY=400) were estimated against the wrong sign direction and require fresh calibration on device.

### orbSize is session-scoped only — not persisted to AsyncStorage
**Decision:** `orbSize` (small/medium orb toggle) is a `useSharedValue` in BattleScreen that resets to 1 (medium) on every session. It is not saved to AsyncStorage.
**Date:** 2026-04-09
**Reason:** Orb size is a within-session feel adjustment the user can retoggle freely. AsyncStorage persistence would add a write on every toggle and a new preferences key for negligible benefit — the user sets their preferred size within seconds of entering active mode and can change it at any time.

### Living color uses existing uniforms — no new uniform needed
**Decision:** The living color effect (orb core cycles through organic hues when held centred) requires no new shader uniform. It is driven entirely by `time` (existing) and `centerBoost` (existing).
**Date:** 2026-04-09
**Reason:** The effect is fully parameterised by "current time" (drives the oscillator frequencies) and "how long the orb has been in sanctuary" (centerBoost gates the effect intensity). A dedicated `liveColorIntensity` uniform would replicate data already present as centerBoost. When centerBoost = 0 (passive mode, or orb outside safe zone), the `mix` factor is 0 and the effect is completely disabled at zero cost.

### gravityHigh is plain React state, not a SharedValue
**Decision:** The PULL gravity toggle (`gravityHigh`) is `useState(false)` in BattleScreen — a plain boolean. It is NOT a SharedValue.
**Date:** 2026-04-09
**Reason:** Gravity strength only affects the JS physics loop in SpatialBalance (`amberStrength = gravityHigh ? 0.7 : 0.3`). It does not feed into the SKSL shader — no useDerivedValue reads it. Passing it as a prop and including it in SpatialBalance's physics `useEffect` deps array is sufficient: the interval restarts with the new value on toggle (~33ms gap, imperceptible). A SharedValue would add overhead and indirection for no benefit.

### Gravity normalised per-axis (not shared EDGE_ZONE_RADIUS)
**Decision:** In SpatialBalance, `nx = orbX.value / MAX_X` and `ny = orbY.value / MAX_Y` — each axis normalised by its own screen-edge bound.
**Date:** 2026-04-09
**Reason:** Initial implementation used `nx = ny = orbX.value / EDGE_ZONE_RADIUS`. On a 393×852pt iPhone, MAX_X=196, MAX_Y=426. At the bottom edge: ny = 426/180 = 2.37 → gravity = 2.37 × 2.37 × amberStrength × GRAVITY_SCALE ≈ 5× the side-edge gravity. Top and bottom were dramatically stickier. Per-axis normalisation ensures all four edges produce identical gravity force (n=1.0 at every edge), so feel is symmetric.

### edgeContact dims orb light only — does not modify baseRadius
**Decision:** `edgeContact` drives `centerLight *= (1.0 - edgeContact * 0.60)` (visual fade). It does NOT modify `baseRadius`. The earlier `baseRadius *= (1.0 - edgeContact * 0.20)` shrink was removed.
**Date:** 2026-04-09
**Reason:** Shrinking baseRadius at the wall caused two interacting problems: (1) the orb visually detached from the wall even when its centre was clamped to MAX_X — it appeared to "not touch" the wall; (2) the interaction with the slow-decaying centerBoost (+0.05 boost) meant orb apparent size at the wall varied within a session depending on how long it had been centred beforehand. Keeping baseRadius stable — always `activeR + centerBoost * 0.05` — gives consistent wall contact. The fade effect (60% dim) communicates edge proximity without size inconsistency.

### amberStrength is a constant, not a craving-curve ramp
**Decision:** `amberStrength` in SpatialBalance is `const amberStrength = 0.3` — a fixed scalar. It is NOT driven by `sessionProgress` or any craving-curve formula.
**Date:** 2026-04-09
**Reason:** The initial implementation scaled `amberStrength` from 0.3 → 1.0 over the session, mirroring the visual amber craving curve. On device this was unplayable: the orb became impossible to hold in the final minutes, and even at the start (0.5 test value) the pull was too strong to overcome without extreme tilting. The visual already communicates escalation via the shader. The physics challenge baseline must remain consistent so the user can develop muscle memory. A constant 0.3 was confirmed playable on device as the baseline.
**Lesson:** Do not mirror the visual craving curve in physics constants. The visual carries the narrative; physics carries the challenge. They are separate systems.

### MAX_X/MAX_Y derived from Dimensions, not hardcoded
**Decision:** `MAX_X = screenWidth / 2` and `MAX_Y = screenHeight / 2`, where width/height come from `Dimensions.get('window')` at module load.
**Date:** 2026-04-09
**Reason:** Initial values were hardcoded at MAX_X=160, MAX_Y=300. On a 430pt-wide device (iPhone 14 Pro Max, screen width 430pt), MAX_X=160 allowed the orb to exceed the right/left screen edge. The shader converts orbX/orbY to shader space by dividing by screen height — the correct clamp is exactly half the screen dimension on each axis, so the orb centre reaches but does not exceed the screen edge. Halo extends past the edge intentionally. Hardcoded values also diverge silently across device sizes.

### App icon — single icon.png, no adaptive-icon or favicon
**Decision:** App icon configured as a single `icon.png` (1024×1024) in `app.json`. No `adaptiveIcon`, no `favicon`, no native splash screen extension.
**Date:** 2026-04-12
**Reason:** Holdout is iOS-only. Adaptive icon is Android-only and would never be used. Favicon applies only to web builds — Holdout has no web target (`platforms: ["ios"]` in app.json). Native splash screen appears too briefly on device to perceive (controlled by JS bundle load time, not a timer we set). Using `expo-splash-screen`'s `preventAutoHideAsync()` to extend it would add perceived load time with no UX benefit — HomeScreen is the designed first impression. Single `icon.png` covers iOS home screen, App Store listing, and app switcher.
**Rule:** Do not add adaptive-icon or favicon. Do not add `preventAutoHideAsync` unless a slow pre-load operation is introduced that would cause a layout flash on HomeScreen.

### SpatialBalance physics constants — device-validated baseline
**Decision:** The following constants are the approved physics baseline, validated on device 2026-04-09:
```
SAFE_RADIUS = 80       (px from centre — full sanctuary zone, centerBoost active)
ADHESION_RADIUS = 150  (px from centre — maximum friction / quicksand zone)
GYRO_SENSITIVITY = 120 (scales DeviceMotion pitch/roll to velocity input)
GRAVITY_SCALE = 60     (scales normalised amber gravity to px/s²)
amberStrength Regular = 0.3
amberStrength Strong = 0.7
EDGE_DRAIN = 0.05      (edgeContact lerp rate toward 1.0 — ~1.3s full drain)
EDGE_RECOVER = 0.018   (edgeContact lerp rate toward 0.0 — ~3.5s full recovery)
MAX_X = screenWidth / 2
MAX_Y = screenHeight / 2
```
**Date:** 2026-04-09 (device-tuned, approved as baseline)
**Earlier values tried and rejected:**
- GRAVITY_SCALE=350, GYRO_SENSITIVITY=400 (initial estimates — far too aggressive, orb stuck to walls)
- amberStrength=0.5 for Strong (imperceptible at mid-screen due to n×|n| squaring; raised to 0.7)
- amberStrength craving-curve ramp (0.3→1.0 over session) — removed; unplayable in final minutes, physics and visual are independent systems
- ADHESION_RADIUS > EDGE_ZONE_RADIUS (inverted zone ordering — orb jumped from safe to adhesion with no warning zone)
**Note (2026-04-18):** `EDGE_ZONE_RADIUS` constant removed from SpatialBalance.tsx — became dead code after gravity normalisation changed to per-axis MAX_X/MAX_Y. The value (180) no longer appears in the physics loop.
**Note:** P2-11 (Strong gravity no-safe-center + wind gusts) will modify constants for Strong mode only. Regular mode constants above must remain unchanged. Revert to these if Strong mode tuning breaks Regular mode feel.

### P2-06 — Mode instructions delivered as coach line pills (not overlay/modal)
**Decision:** First-use passive and active mode instructions are delivered via the existing coach line pill mechanism (dark pill, auto-fades at COACH_LINE_DISPLAY_MS, no dismiss tap required). Not a blocking overlay. Not a persistent tooltip.
**Date:** 2026-04-14
**Reason:** The battle visual is the cognitive intervention — blocking it with an overlay works against the product's core mechanism (visual-spatial hijack of craving circuits). Auto-dismiss is consistent with the "staying requires nothing" principle. The coach line pill is the established in-session information delivery pattern; using it for instructions requires zero new UI components or animation systems.
**Rejected:** Dismissable overlay (blocks visual, adds interaction friction mid-craving); persistent tooltip (visual noise on a screen that should be clean); permanent button labels (tried and reverted — crowded the space without sufficient clarity benefit).

### P2-06 — Instruction text is a named constant, not a coach pool
**Decision:** PASSIVE_INSTRUCTION and ACTIVE_INSTRUCTION are single exported string constants in coach.ts. They are not coach message pools and do not go through pickFrom().
**Date:** 2026-04-14
**Reason:** Instructions are shown exactly once per lifetime and never rotate. Pool infrastructure (shuffle queue keyed by pool reference) adds complexity for zero benefit. Named constants are immediately findable and editable. Placed in coach.ts because they are user-facing copy — all user-facing copy lives in constants/.

### P2-06 — "craving" permitted in first-use instruction text (exception to coach voice rule)
**Decision:** PASSIVE_INSTRUCTION uses the word "craving" ("the brain circuits the craving depends on"). This is an intentional exception to the coach voice rule.
**Date:** 2026-04-14
**Reason:** The no-"craving" rule applies to recurring coach calibration lines — where repeating the word activates the neural pathway on every session. A first-use instruction shown exactly once is informational context, not a calibration trigger. Clarity outweighs the linguistic distancing principle for a one-time science explanation. The rule stands for all coach pools without exception.
**Reversed: 2026-04-17 (Session 24).** The "one-time informational" distinction did not hold — PASSIVE_INSTRUCTION is delivered via the same coach pill as recurring pool messages; a user cannot distinguish it. Keeping "craving" in the instruction activated the same pathway the rule exists to protect. Fixed to: `"Watching this occupies the brain circuits it depends on. Twenty minutes disrupts the pattern."` The exception is removed; the rule now applies unconditionally to every string shown via the coach pill.

### SUPPORT ME repeat-tap tier: session-scoped flag, not phase-scoped tracking
**Decision:** `isRepeat = supportMeTapCountRef.current > 0` — tracks whether the user has tapped SUPPORT ME at all this session. Phase boundary crossings do not reset the flag.
**Date:** 2026-04-17
**Reason:** The most useful distinction is first tap vs. subsequent taps in a session, not first tap per phase. A user who tapped once in the early phase has already been oriented to arc position; routing them to the persistence/mechanism tier on a second tap (even in a new phase) is more useful than re-orienting to position. Repeat-tier messages are factually accurate at any phase within the window. BattleScreen tracks the count via `supportMeTapCountRef = useRef(0)`; CoachService receives `isRepeat` as a pure parameter (stays stateless).
**Tradeoff (R-03, reviewed 2026-04-17):** A user who taps once early and again late skips `late.first` — the phase-transition orientation message. Accepted for V1; flagged for Phase 3 coach refinement if user feedback surfaces confusion at late-phase taps. Phase-scoped tracking (resetting `isRepeat` on phase boundary) was considered and deferred as unnecessary complexity.

### Removed forced recommitment overlay — ambient schedule + explicit controls
**Decision:** The "Still holding?" full-screen prompt with 30s timeout-to-gave-in is removed. Coach lines at 4/8/12/16 min still fire (silent: coach line + shockwave pulse, no state change). User controls: SUPPORT ME (on-demand coach, bottom-left) and GAVE IN (two-stage confirm, bottom-right).
**Date:** 2026-04-04
**Reason:** Forced interaction punished legitimate engagement and introduced anxiety. The revised model preserves the science-based milestone calibration while giving the user agency. GAVE IN requires two taps to prevent accidental exits (3s auto-reset on first tap).
**State machine:** `recommitting` state removed. 5 states: `initializing | running | won | gaveIn | gaveInComplete`.

### Progress line as session timer
**Decision:** A 1.5pt amber line anchored to the screen bottom shrinks from full-width to nothing over 20 minutes, driven by `sessionProgress` SharedValue via `useAnimatedStyle` on the UI thread.
**Date:** 2026-04-04
**Reason:** Concentric target rings (first approach) felt like UI chrome competing visually with the shader. The line sits below the shader canvas — it doesn't compete, it frames. Driven by existing SharedValue at zero additional cost.

### SafeAreaProvider must wrap all screens in App.tsx until NavigationContainer is added
**Decision:** Each top-level render branch in App.tsx wraps with `<SafeAreaProvider>` until `NavigationContainer` is wired.
**Date:** 2026-03-30
**Reason:** `SafeAreaView` from `react-native-safe-area-context` requires a `SafeAreaProvider` ancestor to read device insets. Without one it silently defaults to zero insets — content renders under the camera notch and home indicator with no error. `NavigationContainer` wraps a `SafeAreaProvider` internally, so when NavigationContainer is added in the BattleScreen pass, the per-branch wrappers in App.tsx are removed and NavigationContainer covers the whole tree.

### Additive color contributions must follow all multiplicative brightness passes
**Decision:** In SKSL shaders, additive color accents (blue-purple, specular highlights) must be applied after all `*=` brightness multiplications.
**Date:** 2026-03-28
**Reason:** Two multiplicative brightness passes — `amberBase *= (glow floor + variation)` and `amberBase *= (1.0 - vignette)` — each independently reduce channels toward zero. An additive accent applied before these passes gets multiplied by the combined brightness factor (floor ~0.15), becoming invisible. Applied after, the additive term reads against the already-multiplied result, which is correct. Rule: all `*= brightness` operations first, all `+= accent` operations last.

---

## §2 EAS / Build Configuration

| Field | Value |
|-------|-------|
| Expo account / owner | `novaventures` |
| EAS Project ID | `15ca7a10-bc89-404c-a2f6-bed2934907cd` |
| Apple Team ID | `FG7KD2G6QX` |
| Bundle ID | `com.novaventuresco.holdout` |
| SDK Version | `54.0.33` |
| Min iOS | `15.0` |
| Orientation | Portrait only (`UIRequiresFullScreen: true`) |
| Credential management | Expo-managed (automatic) |

### Build Profiles (eas.json)

| Profile | Purpose | Install target |
|---------|---------|----------------|
| `development` | Expo dev client with live reload | Simulator only |
| `adhoc` | Standalone install on registered devices | Physical iPhone |
| `production` | App Store / TestFlight submission | App Store |

### Key EAS Lessons (Carried from Daily Goals)

**Device must be registered BEFORE the build.**
For adhoc distribution, run `eas device:create` and complete profile installation on iPhone before triggering the build. A device registered after the build requires a new build.

**iOS 16+ requires Developer Mode for adhoc installs.**
Settings → Privacy & Security → Developer Mode → ON (requires restart). Without it: "integrity could not be verified" — silent install failure.

**`appVersionSource: local` keeps version in source control.**
Version shown on App Store comes from `app.json`, not an EAS counter. Increment before every production submission.

**`enterpriseProvisioning: "adhoc"` is valid for Individual Developer accounts.**
FG7KD2G6QX is an Individual Developer account. This key explicitly tells EAS to use ad-hoc provisioning type and is correct for this account.

**`UIRequiresFullScreen: true` is required for portrait-only apps on iOS 16+.**
iOS 16+ silently rejects ad-hoc installs for portrait-only apps without this flag. Validate step warns in build log; rejection is at install time.

**Bundle ID is permanent once App Store listing is created.**
`com.novaventuresco.holdout` — never change after first submission.

**eas/configure_ios_credentials installs cached profile — does NOT refresh device registrations.**
In custom build YAML, this step installs whatever profile is in EAS credential storage at build time. Newly registered devices require explicit credential regeneration via `eas credentials --platform ios`.

---

## §3 Build & Install Guide

### Three Build Types

| Type | Profile | Use when |
|------|---------|----------|
| Development (Expo dev client) | `development` | Daily code iteration, Expo Go scanning |
| Ad-Hoc (standalone on device) | `adhoc` | Testing real build on iPhone |
| Production (App Store) | `production` | App Store / TestFlight submission |

**Critical:** Use `adhoc` to install standalone builds on your iPhone — NOT `development`. The `development` profile only works with the Expo dev client app.

### Creating an Ad-Hoc Build (Step-by-Step)

```bash
# 1. Register device (first time or new device)
eas device:create
# Visit the URL on your iPhone → install profile → UDID captured automatically

# 2. Verify device is registered
eas device:list

# 3. Create the build (takes 15-20 min on EAS servers)
eas build --platform ios --profile adhoc

# 4. Monitor progress
eas build:list

# 5. Install — EAS provides QR code + link in terminal
# Open link in Safari on iPhone → tap "Install"

# 6. Trust developer (first time only)
# Open app → "Untrusted Developer" → Settings → General
# → VPN & Device Management → tap profile → Trust
```

### EAS Quick Reference

```bash
eas login
eas device:create              # Register iPhone for adhoc builds
eas device:list                # Verify device registered
eas build --platform ios --profile adhoc        # Device testing
eas build --platform ios --profile production   # App Store
eas build:list                 # All builds
eas build:view [build-id]      # Specific build logs
eas submit --platform ios --profile production  # TestFlight / App Store
```

### Cache / Metro Troubleshooting

```bash
# Quick cache clear (use when code changes not reflecting)
npx expo start --clear

# Full reset (Windows PowerShell)
Remove-Item -Recurse -Force node_modules
npm cache clean --force
npm install
```

### Common Build Issues

**"Integrity could not be verified" on iPhone:**
1. Enable Developer Mode: Settings → Privacy & Security → Developer Mode → ON (restart required)
2. Verify device was registered BEFORE build: `eas device:list`
3. If registered after build: create new build

**Multiple devices:**
Register all devices before the build. One build installs on all registered devices (max 100 per adhoc profile).

**Build failed:**
Check logs: `eas build:view [build-id]`
Common causes: missing assets (icon, splash), invalid bundle identifier

---

## §4 App Store Deployment

### Pre-Submission Checklist

**Configuration:**
- [ ] Bundle ID `com.novaventuresco.holdout` confirmed in app.json
- [ ] Version bumped in app.json (both `version` and `ios.buildNumber`)
- [ ] `assets/icon.png` (1024×1024) and `assets/splash.png` present
- [ ] `ITSAppUsesNonExemptEncryption: false` in app.json
- [ ] `UIRequiresFullScreen: true` in app.json infoPlist
- [ ] Privacy manifest in place (see §5)
- [ ] No `console.log` statements in production code
- [ ] No hardcoded secrets anywhere

**App Store Connect:**
- [ ] App listing created with bundle ID `com.novaventuresco.holdout`
- [ ] Holdout metadata entered (see below)
- [ ] Screenshots uploaded for all required sizes
- [ ] Privacy questionnaire completed (Data Not Collected)
- [ ] Privacy policy URL entered

**Build and Submit:**
```bash
eas build --platform ios --profile production
eas submit --platform ios --profile production
```

### Holdout App Store Metadata

**App Name:** Holdout: Beat Your Cravings
**Subtitle:** Your 20-Min Craving Battle
**Keywords:** craving, food urge, snack, holdout, 20 minutes, craving control, urge timer, beat cravings, habit

**Description:**
```
Holdout is a 20-minute craving tool. When a food craving hits, open the app
and watch a visual battle unfold — an encroaching force pressing in from the
edges, held back and slowly defeated by the calm center your presence sustains.

Stay for 20 minutes. The battle is won.

No food logging. No accounts. No subscriptions. No notifications required.
A tool that works.

THE SCIENCE
Dopamine-driven cravings peak and subside within 15-20 minutes if not acted
on. Holdout doesn't suppress the craving — it outlasts it.

HOW IT WORKS
When a craving hits, open Holdout. Watch the force press in from the edges —
that's the craving. Your presence holds the center steady. At key points, your
coach delivers one calibration line about where you are on the craving curve.
Tap SUPPORT ME any time for on-demand science. At 20 minutes, you've won.

PRIVACY
Your session history stays on your device. No data leaves your phone.
No accounts. No tracking.
```

**Support URL:** mailto:support@novaventuresco.com
**Privacy Policy URL:** https://novaventuresco.github.io/holdout/privacy
**Age Rating:** 4+ (no concerning content categories)

**Screenshot strategy:**
- Shot 1: Battle visual at minute 8 — amber pressing in, center holding. Caption: "Watch your craving lose."
- Shot 2: Session complete — screen clear. Caption: "20 minutes. It's gone."
- Shot 3: History screen. Caption: "Your fight record."
- Shot 4: Home screen. Caption: "One tap. 20 minutes. Science-backed."

**Screenshot sizes required:**
- iPhone 6.7" (15 Pro Max) — 1290 × 2796 px
- iPhone 6.5" (XS Max) — 1242 × 2688 px
- iPhone 5.5" (8 Plus) — 1242 × 2208 px

### App Store Connect Steps (One-Time Setup)

1. Log in to appstoreconnect.apple.com
2. New App → iOS → Bundle ID: `com.novaventuresco.holdout`
3. Register bundle ID in Apple Developer portal first (if not exists)
4. Enter all metadata above
5. Complete Privacy questionnaire: "Does not collect data" for all types
6. Complete Age rating questionnaire (4+)
7. Upload screenshots for all required sizes
8. Add privacy policy URL
9. After production build completes: `eas submit --platform ios --profile production`
10. Install via TestFlight first, test all 16 sign-off scenarios
11. Submit for App Review (first review: 1–3 business days)

---

## §5 Apple Compliance

### Privacy Manifest (PrivacyInfo.xcprivacy)

Required for iOS 17+ App Store submission. Holdout collects **zero user data** — the manifest is minimal compared to apps with user accounts.

Create `PrivacyInfo.xcprivacy` in project root:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
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
      <string>NSPrivacyAccessedAPICategoryUserDefaults</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>CA92.1</string>
      </array>
    </dict>
    <dict>
      <key>NSPrivacyAccessedAPIType</key>
      <string>NSPrivacyAccessedAPICategoryFileTimestamp</string>
      <key>NSPrivacyAccessedAPITypeReasons</key>
      <array>
        <string>C617.1</string>
      </array>
    </dict>
  </array>
</dict>
</plist>
```

**Why Holdout's manifest is simpler than Daily Goals:**
No user accounts → no email, no UserID. `NSPrivacyCollectedDataTypes` is empty.
Only Required Reason API declarations remain: UserDefaults (AsyncStorage uses it) and FileTimestamp (standard Expo requirement).

**To include in EAS builds:**
Create an Expo config plugin `plugins/withPrivacyManifest.js` that copies the file into the iOS bundle. Add the plugin path to `app.json` plugins array.

### Export Compliance
`ITSAppUsesNonExemptEncryption: false` — already in app.json. Holdout is fully offline and uses no encryption.

---

## §6 App Icon

### How Icons Work in Expo

**In Expo Go:** Home screen shows the Expo Go icon — this is expected and cannot be changed without a native build.
**In EAS builds (adhoc/production):** App icon appears correctly on home screen and in app switcher.

### Icon Configuration (app.json)

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#0D0D0D"
    }
  }
}
```

**Requirements:**
- `assets/icon.png` — 1024×1024 px, PNG, no transparency, no rounded corners
- `assets/splash.png` — any size, will be letterboxed; use dark background `#0D0D0D`

### Native Asset Generation

To inspect how icons look in native build locally:
```bash
npx expo prebuild
```
Creates `ios/` and `android/` folders with icons embedded.

**Important:** Do NOT commit `ios/` or `android/` — they are generated artifacts. EAS handles native builds in the cloud. These folders are in `.gitignore`.

### Active/passive mode toggle — cognitive interference feature
**Decision:** BattleScreen gains an `activeMode` boolean state (default `false`) and a top-center pill toggle visible only during `screenState === 'running'`. In active mode, `BallsLayer` is conditionally mounted. In passive mode (default), behavior is unchanged.
**Date:** 2026-04-05
**Reason:** Domain science (§2.5 — visual-spatial cognitive hijack) supports engagement that occupies the motor cortex as well as the visual cortex. Small glowing balls emerge from the amber zone and drift inward; the user drags them to the center one at a time, each delivery boosting `centerBoost` by 1/6 (6 deliveries saturate to 1.0). The shader adds `centerBoost * 0.05` to `baseRadius`, giving a visible center radius expansion at full boost. Active mode is opt-in to preserve the passive experience for users who prefer the current low-effort mechanic.
**Unmount gate:** `showRunningUI && activeMode` — BallsLayer unmounts automatically on `won`, `gaveIn`, `gaveInComplete`, and `initializing` via the existing `showRunningUI` boolean. No extra cleanup required in BattleScreen beyond `cancelAnimation(centerBoost)` in the existing cleanup block.

### react-native-gesture-handler — native dependency added
**Decision:** `react-native-gesture-handler` added to `package.json` dependencies. `GestureHandlerRootView` wraps all three return branches in `App.tsx` (loading, onboarding, home).
**Date:** 2026-04-05
**Reason:** Gesture API v2 (`Gesture.Pan()`, `GestureDetector`) requires a native module compiled into the binary — cannot be provided by the JS bundle alone. `GestureHandlerRootView` must be the outermost view in the component tree; Gesture API v2 silently fails without it. All three App.tsx return branches must be wrapped because the root can render any of them.
**Build impact:** Requires a new native binary. Any existing dev-client binary on device does not include RNGH and will crash when the app attempts to instantiate any gesture handler. Queue `eas build --profile device` before resuming hot-reload development.

### makeMutable for dynamic SharedValue creation
**Decision:** Ball SharedValues in BallsLayer are created via `makeMutable(initialValue)` from `react-native-reanimated`, not `useSharedValue`.
**Date:** 2026-04-05
**Reason:** `useSharedValue` is a React hook — must be called at the top level of a component or custom hook, never inside a regular function, loop, or conditional. BallsLayer spawns balls imperatively inside a `setInterval` callback. Using `useSharedValue` there violates rules of hooks. `makeMutable` is the imperative equivalent — produces an identical SharedValue, safe to call anywhere. Cleanup is identical: `cancelAnimation` then discard. The creating component (BallsLayer) is the owner and cancels all ball SharedValues in both `removeBall` and the unmount `useEffect` return.

### EAS `device` profile — real-device dev-client with hot-reload
**Decision:** New `device` profile added to eas.json: `developmentClient: true`, `simulator: false`, `enterpriseProvisioning: adhoc`, `environment: production`.
**Date:** 2026-04-05
**Reason:** The `development` profile has `"simulator": true` — it has always built for the iOS Simulator and cannot install on a physical device. The dev-client binary previously on device was from an earlier build configuration; every native dependency addition (Skia, RNGH) makes the on-device binary stale. The `device` profile restores the `npx expo start` → QR scan → hot-reload workflow on the physical device.
**Rule:** Add a native package → queue `eas build --profile device` before resuming hot-reload development. The `adhoc` profile remains for standalone validation builds (no Metro needed). The `development` profile remains for iOS Simulator work.

### centerBoost uniform added to BattleVisual shader
**Decision:** `centerBoost` added as `uniform float` in `SHADER_SRC`. Radius line (current): `float baseRadius = mix(0.04, 0.42, pow(progress, 2.0)) + centerBoost * 0.05`. `centerBoost` is a `SharedValue<number>` (0→1) owned by BattleScreen, passed as optional prop to BattleVisual. BallsLayer increments it `+= 1/6` per delivery, capped at 1.0 (6 deliveries for full boost = 0.05 max shader radius units).
**Radius history:** Original formula was `mix(0.0, 0.65, pow(progress, 1.5))` — corrected 2026-04-25 to `mix(0.0, 0.42, pow(progress, 2.0))` (max 0.65 covered 84% of screen by min 12). Floor raised 2026-04-26 from `0.0` to `0.04` so the orb starts at its 6-minute equivalent size instead of pin-sized.
**Date:** 2026-04-05
**Reason — boost calibration:** First implementation used `CENTER_BOOST_PER_DELIVERY = 0.05` (capped at 1.0), meaning 20 deliveries to saturate — each delivery contributed 0.0025 radius units, imperceptible. Fixed to `1/6` so 6 deliveries saturate centerBoost, giving visible feedback per delivery. The `* 0.05` multiplier in the shader keeps max boost modest — at progress=0.5, center grows from ~0.23 to ~0.28 radius (22% increase at full boost). Additive to the session-progress radius so active mode enhances but does not replace the natural arc.
**Optional prop pattern:** BattleVisual creates a local `_localCenterBoost = useSharedValue(0)` fallback so the prop is not required. Hooks must be called unconditionally — `const boost = centerBoostProp ?? _localCenterBoost` after both are created.

### BallsLayer parked — replaced by SpatialBalance (Spatial Balance mechanic)
**Decision:** BallsLayer (drag-to-center orb delivery) is removed from active use. The `activeMode` feature is replaced by the Spatial Balance mechanic: the user tilts the phone to hold the BattleVisual center orb in place against amber gravity wells. BallsLayer file is preserved as reference but the component is no longer mounted. `SpatialBalance.tsx` (new) is the replacement — it is a physics-only component that renders `null` and writes to `orbX`/`orbY`/`centerBoost` SharedValues owned by BattleScreen.
**Date:** 2026-04-08
**Reason:** BallsLayer's drag-to-center mechanic was preparatory; the intended active mode per the product spec (`docs/visual/spatial_balance_blueprint.md`) is a gyroscope-driven balance interaction that mirrors the vestibular/motor disruption mechanism described in the blueprint's neurological foundation. The center orb IS the BattleVisual center — no separate render needed; only position offset and radius mode need to change.

### SpatialBalance — physics-only component, orbOffset shader uniform
**Decision:** `SpatialBalance.tsx` is a React component that returns `null`. It subscribes to `expo-sensors` `DeviceMotion` and runs a `setInterval` physics loop at ~30Hz. On each tick it writes `orbX.value` and `orbY.value` (pixel offsets from screen centre) directly from the JS thread. BattleVisual receives these via `orbX`/`orbY` props and converts to shader space as `orbOffset = [px/height, py/height]` inside `useDerivedValue` (UI thread).
**Date:** 2026-04-08
**Reason — physics in JS interval not useFrameCallback:** BattleScreen already owns a `useFrameCallback` for the time clock. A second `useFrameCallback` in a child component competes for the same frame budget. Physics at 30Hz is sufficient for gyroscope-based balance; `setInterval(33)` keeps it off the render thread entirely. Direct SharedValue writes from JS are safe in Reanimated 4 — reads via `useDerivedValue` on the UI thread are always consistent.
**Coordinate space:** `p_base = (uv - 0.5) × (aspect, 1.0)` in the shader. A pixel offset `(px, py)` from screen centre maps to shader space as `(px/height, py/height)` — dividing by height is correct because `aspect = width/height` is already applied to the x-component of `p_base`.
**orbFixed uniform:** When `orbFixed = 1.0`, the shader uses `activeR = mix(0.08, 0.13, orbSize)` instead of the progress-driven curve. The center does not grow; the user holds it. In passive mode (`orbFixed = 0.0`) behaviour is identical to before — `orbOffset` is `[0,0]` and the center grows with progress as normal.

### orbX/orbY/centerBoost owned by BattleScreen, written by SpatialBalance
**Decision:** `orbX`, `orbY`, and `centerBoost` are `useSharedValue` instances created in BattleScreen and passed as props to both BattleVisual (reads) and SpatialBalance (writes). BattleScreen owns cleanup: `cancelAnimation(orbX/orbY/centerBoost)` in the `useEffect` return.
**Date:** 2026-04-08
**Reason:** SharedValue ownership mirrors the sessionProgress pattern — the screen that controls the session lifecycle owns the values. SpatialBalance is a consumer/writer, not an owner; it has no unmount cleanup obligation beyond clearing its interval and DeviceMotion subscription. On toggle back to passive, BattleScreen resets `orbX/orbY` via `withTiming(0, 600ms)` and `centerBoost` via `withTiming(0, 800ms)`, so the visual fades gracefully.

### expo-sensors and expo-haptics added
**Decision:** `expo-sensors` and `expo-haptics` added via `npx expo install`. Both are Expo first-party SDK 54 packages.
**Date:** 2026-04-08
**Build impact:** Both require native modules not present in the current device binary. A new `eas build --platform ios --profile device` is required before hot-reload testing of active mode on device. Passive mode continues to work without a new build (SpatialBalance only mounts in active mode; it imports expo-sensors at module scope but the subscription is inside a `useEffect` that only runs when the component mounts).

### Onboarding simplified — CravingType removed from data model
**Decision:** `OnboardingScreen` rewritten from a 3-sub-screen flow (craving type picker → time window picker → info screen) to a single info screen. `CravingType` type removed from `preferences.ts`. `cravingType` field removed from the `Session` interface in `sessions.ts`. `startSession()` signature simplified to take no parameters. All downstream imports (`SessionService.ts`, `BattleScreen.tsx`) cleaned up accordingly.
**Date:** 2026-04-18
**Reason:** Personalizing coaching by craving type or time of day would require research we don't have. Any wrong inference — mapping the wrong voice or timing to the user's actual situation — risks reducing trust in the app. A single consistent coaching experience is preferable to inaccurate personalization. The science-explainer info screen is retained as the sole onboarding step.
**Onboarding copy:** Heading: "Ride the wave." Opening: "You know it's a habit. That doesn't seem to make the pull any weaker." Three-paragraph science explainer (20-min window, visual occupation mechanism) generalized to "habit-driven urges" — not food-specific. CTA: "LET'S GO". `savePreferences({ onboardingComplete: true })` on tap; double-tap guard via `saving` state.
**Migration safety:** Existing AsyncStorage records with legacy `cravingType`/`cravingWindow` fields parse safely at runtime — TypeScript ignores extra fields on `JSON.parse`. They overwrite away on the next `savePreferences` call.

### HOME_TAGLINES — rotating pre-session phrase on HomeScreen
**Decision:** A `HOME_TAGLINES` pool (6 lines) added to `src/constants/coach.ts` as a named export separate from `COACH_MESSAGES`. HomeScreen picks one via `Math.random()` in a `useState` initializer — once per component mount. Rendered below the HOLDOUT header in `COLORS.TEXT_SECONDARY` at 16px.
**Date:** 2026-04-18
**Reason:** Every app open is a moment of intent — the user opened Holdout to face something hard. A single line acknowledging the difficulty before the START tap grounds them without adding friction. Makes the app feel present rather than static across sessions.
**Mount behavior (intentional):** `useState` initializer fires once per mount, not per focus. Stable when the user tabs to History and back (correct — same app open). Refreshes after each session because Battle is a `fullScreenModal` — HomeScreen unmounts and remounts on return. Direct `Math.random()` index is correct for this one-per-mount cadence; Fisher-Yates cycling is overkill.
**Voice register:** Warmer and more direct than in-session coach voice — pre-session framing, not calibration. Not subject to the 15-word in-session constraint. Does not say "craving" — consistent with coach language across the app.

### P2-11 — HI gravity no-safe-center via wind gust envelope
**Decision:** In HI gravity mode (`gravityHigh = true`), a continuous wind gust system applies a random-direction force so there is no neutral equilibrium at center. SAFE_RADIUS is retained; the gust system provides the destabilization. Implemented as a two-phase envelope (attack → decay) with randomized per-gust decay rate and randomized interval. LO mode physics is unchanged.
**Date:** 2026-04-14
**Reason:** The edge gravity formula `nx × |nx| × amberStrength × GRAVITY_SCALE` produces zero force at center (nx = 0), so HI mode had a stable resting equilibrium — device testing confirmed a user could hold it still without effort. Removing SAFE_RADIUS entirely would have made the center permanently hostile and removed the "sanctuary" feel; wind gusts preserve that feel while ensuring no completely neutral point exists.
**Rejected alternatives:**
- Remove SAFE_RADIUS entirely for HI — makes center permanently hostile; removes sanctuary reward
- Third mode ("EXTREME") beyond HI — adds a third toggle state; P2-11 spec said HI becomes no-safe-center
- Constant background force (no envelope) — produces steady drift that is easy to counter; not wind-like
**Key structural decision — no envelope reset on gust fire:** When a new gust fires while a previous gust is still decaying, `windEnvelope` is NOT reset to 0. Direction changes immediately, but envelope carries its current value into the new attack phase. This eliminates the "sudden stop" artifact that occurred when a new gust would drop magnitude to zero for one tick before the attack ramp began.
**Device-validated constants (2026-04-14):**
```ts
WIND_GUST_INTERVAL_MIN_MS = 4000  // shortest gap between gusts
WIND_GUST_INTERVAL_MAX_MS = 9000  // longest gap between gusts
WIND_GUST_STRENGTH        = 0.3   // peak impulse magnitude (18 pt/s² at GRAVITY_SCALE=60)
WIND_ATTACK_RATE          = 0.008 // per-tick ramp: 0→1 in ~125 ticks (~4s)
WIND_DECAY_RATE_MIN       = 0.990 // faster decay: near-zero in ~10s at 30Hz
WIND_DECAY_RATE_MAX       = 0.995 // slower decay: near-zero in ~20s at 30Hz
```
**Tuning history:** Initial values (STRENGTH=1.5, single-phase decay 0.88, fixed 3s interval) produced forces of 90 pt/s² — too strong, too rhythmic, abrupt onset/offset. Organic tuning (two-phase envelope, randomized interval and decay rate) addressed feel. Final device validation confirmed STRENGTH=0.3 gives a perceptible but surmountable push (~18 pt/s² peak, overcome by a small tilt) with gradual onset (~4s attack) and long fade (10–20s decay).

### R-08 — Session recording deferred to wonComplete DONE tap
**Decision:** `completeSession()` is no longer called in `handleWon()`. It is deferred to `handleDone()` (the DONE button in `wonComplete`). `handleGoAgain()` calls `cancelSession()` on the first session (not recorded) and launches a fresh `Battle` via `navigation.replace('Battle', { priorElapsedMs })`. One session record with cumulative duration is written per full experience (including any GO AGAIN chains).
**Date:** 2026-04-19
**Reason:** Previously, a won session was recorded at the 20-min mark before the user saw the wonComplete choice. If the user tapped GO AGAIN, History showed one `won` record for the first session — before the craving was actually resolved. The correct model: History reflects one outcome for the entire experience. If the user chains two sessions and wins the second after 34 min, History records one `won` of 34 min duration. If they give in on the second after 34 min, History records one `gaveIn` of 34 min.
**Cumulative duration:** `priorElapsedMs` is passed via route params to each fresh `Battle` screen. `SessionService.completeSession` and `abandonSession` accept an optional `priorDurationMs` parameter appended to `endTime - startTime`.
**Trade-off (crash behavior):** A session is now `active` in storage from `handleWon()` through to `handleDone()`. A crash during the win animation or wonComplete leaves an orphan — crash recovery on next launch silently deletes it via `cancelSession` (no history, no streak impact; updated 2026-04-20 — see 'App kill = silent cancel' ADR). The 'no implicit win' guarantee is preserved: `wonComplete` still requires an explicit DONE tap to record a result.
**See also:** P2-13 (wonComplete state machine), `priorElapsedMs` pattern in patterns-build.md.

### App kill = silent cancel (no record, no streak impact)
**Decision:** App kill (force-quit, OS kill, crash) mid-session is recovered by `cancelSession` (deleteSession) — the record is removed entirely. Previously `abandonSession` was called, recording a `gaveIn`.
**Date:** 2026-04-20
**Reason:** A crash or OS kill is not a voluntary decision. Recording `gaveIn` penalised the user for something outside their control — streak damage from a crash is unintuitive and unfair. `cancelSession` → `deleteSession` removes the record with zero history or streak impact. This is identical to the Go Back silent-cancel path.
**Implementation:** `App.tsx` init block calls `cancelSession(orphan.id)` on any session found without a result. No session record is ever written before the user confirms an outcome.
**Impact:** Crash/kill recovery is now indistinguishable from "never started."

### Background 20+ min → resumePrompt (user declares outcome)
**Decision:** When the app returns from 20+ min of background, BattleScreen enters `resumePrompt` state instead of auto-winning. A single overlay presents three choices: GAVE IN / DONE / GO AGAIN.
**Date:** 2026-04-20
**Reason:** Auto-win assumed the user held out. Auto-gaveIn was equally wrong. The user knows what happened; the prompt asks them to declare it. Three choices collapse two questions ("did you hold out?" and "do you need another session?") into one screen, reusing `handleGaveIn`, `handleDone`, and `handleGoAgain` without new logic. No win animation plays for the DONE path — the amber is already visually retreated at `sessionProgress = 0.999`.
**State:** `resumePrompt` added to `ScreenState` union in BattleScreen (7th state). AppState background no-op list updated to include `resumePrompt` — re-backgrounding during the prompt leaves it visible on return.
**sessionProgress value:** Set to `0.999` on entering `resumePrompt` — below the `>= 1.0` threshold that triggers BattleVisual's win animation. The Go Again path (fresh session) plays no win animation; the Gave In path runs the existing drain flow. See patterns-animation.md for the ordering rule.
**winLingers:** Normal 20-min wins (non-background path) continue to fire the `winLingers` coach message 2s after `wonComplete` mounts. The resume prompt replaces that need for the background path by surfacing GO AGAIN explicitly.

### P2-13 — wonComplete state + GO AGAIN (navigation.replace)
**Decision:** After the BattleVisual win animation completes (`onWinAnimationComplete`), BattleScreen transitions to a new `wonComplete` state instead of calling `navigation.goBack()`. The win visual remains visible as background. Two buttons appear at the bottom: DONE (`navigation.goBack()`) and GO AGAIN (`navigation.replace('Battle')`). A post-win coach line from the `winLingers` pool fires 2000ms after `wonComplete` activates.
**Date:** 2026-04-18
**Reason 1 — lingering case:** Craving persistence past 20 minutes is rare in the science but real. Previously there was no in-app path for it. `wonComplete` gives the user a GO AGAIN option without judgment. **Updated by R-08 (2026-04-19):** session recording is no longer done at `handleWon` — it is deferred to the user's explicit choice in wonComplete. See the R-08 ADR above.
**Reason 2 — navigation.replace over in-place reset:** In-place reset would require resetting every SharedValue (sessionProgress, passedCount, centerBoost, orbX/orbY, orbFixed, edgeContact), clearing all refs (milestoneIndexRef, computedScheduleRef, sessionIdRef, supportMeTapCountRef), and re-running the async `init()` sequence. A single missed reset produces silent bugs (e.g. milestone dots already lit, stale session ID, carried-over physics state). `navigation.replace('Battle')` unmounts the screen entirely and mounts a fresh instance — all SharedValues initialise to 0, all refs reset, `init()` runs clean.
**Reason 3 — 2000ms coach line delay:** The win coach line is set at T=0 (`handleWon`) with a 7000ms `COACH_LINE_DISPLAY_MS` countdown. The win animation takes 5000ms. At `wonComplete` (T≈5000ms) the win line has 2000ms remaining. Firing the lingering line at wonComplete+2000ms (T≈7000ms) coincides with the win line's natural completion — the `coachKey` `useEffect` cleanup cancels the old fade-out timer and starts fresh with the new message. No abrupt interruption of the win message.
**Double-tap guard:** `goAgainFiredRef` (plain `useRef(false)`) prevents a second `navigation.replace` call if GO AGAIN is tapped rapidly before navigation completes. The ref is discarded with the unmounting screen — no reset needed.
**AppState:** `wonComplete` added to the background no-op list in `handleAppStateChange`. No interval is running and the session is already finalised, so backgrounding during `wonComplete` requires no action on return. `backgroundEnteredAt` is never set in this state — the `'active'` path's null check handles it safely.

### NSMotionUsageDescription removed — StoreKit triggers CMMotionActivityManager during purchase
**Decision:** Remove `NSMotionUsageDescription` from `app.json` infoPlist.
**Date:** 2026-04-28
**Reason:** During Sandbox IAP testing, the Motion & Fitness permission prompt appeared on the
first purchase attempt — but had never appeared during any prior active-mode gyroscope session.
Root cause: StoreKit's fraud detection internally accesses `CMMotionActivityManager` during purchase
validation. iOS shows the prompt only because `NSMotionUsageDescription` is present in Info.plist.
The app never calls `CMMotionActivityManager` directly — expo-sensors had added the key because it
ships Pedometer APIs alongside `CMDeviceMotion`, even though the app only uses the gyroscope.
Removing the key eliminates the prompt; StoreKit's internal access silently continues (Apple's
frameworks handle their own privacy declarations). `CMDeviceMotion` is unaffected — gyroscope /
active mode works identically without the key. `PrivacyInfo.xcprivacy` requires no changes —
`CMMotionActivityManager` access by Apple's own StoreKit framework is not a declaration
responsibility of the app.
**Outcome:** Motion & Fitness prompt no longer appears during purchase. Active mode unchanged.
Takes effect in production EAS build 2026-04-28.

### App rename — Holdout → Craving Holdout: Urge Timer
**Decision:** Display name changed from "Holdout" to "Craving Holdout: Urge Timer" before first App Store submission. Bundle ID (`com.novaventuresco.holdout`), IAP product ID (`com.novaventuresco.holdout.themes`), and GitHub Pages path (`/holdout/`) are intentionally unchanged.
**Date:** 2026-05-02
**Reason:** "Holdout" was already in use on the App Store. ASO analysis identified "hold urge" (Score 60, Very Low competition — top apps under 300 reviews) as the highest-priority keyword for this mechanic. The colon-format name "Craving Holdout: Urge Timer" packs four ranking signals into the 30-char name field: craving (name-level weight), hold (name-level), urge (name-level), timer (name-level). Bundle ID and IAP product ID are immutable once registered and are developer-facing only — invisible to users and Apple reviewers. Renaming the GitHub repo would break three hardcoded URLs in SettingsScreen.tsx and HTML canonical tags with no user-visible benefit.
**Files changed:** `app.json` (name, slug, NSMotionUsageDescription), `package.json` (name), `src/screens/HomeScreen.tsx` (in-app display string), `docs/store/app-store-copy.md`, all four landing page HTML files, `CLAUDE.md`, `pre-build.md`, `tests/README.md`, `tests/validation-scenarios.md`, `docs/context/session-brief.md`, `docs/quality/grading.md`.
**Not changed:** `eas.json`, `src/services/IAPService.ts`, `src/screens/SettingsScreen.tsx`, `plugins/withPrivacyManifest.js`.

### outcomeFiredRef — shared terminal-outcome guard for BattleScreen
**Decision:** All terminal-outcome buttons in `wonComplete` and `resumePrompt` (DONE, GO AGAIN, GAVE IN from resume) share a single `outcomeFiredRef: useRef(false)`. Previously `doneFiredRef` and `goAgainFiredRef` were independent per-button guards.
**Date:** 2026-04-24
**Reason:** Independent guards only prevent double-tapping the *same* button. They do not prevent cross-button double-fire: tapping DONE then immediately GO AGAIN before the navigation transition completes finds each button's own guard still false — both handlers run. Result: `completeSession` and `cancelSession` both execute on the same session; `goBack` and `replace` both fire on the navigation stack simultaneously. Storage and navigation end up in non-deterministic state (last AsyncStorage write wins; stack may be corrupt).
**Implementation:** Single `outcomeFiredRef = useRef(false)` checked and set in `handleDone`, `handleGoAgain`, and `handleResumeGaveIn`. Any terminal outcome blocks the others. The ref is per-mount-instance — GO AGAIN mounts a fresh screen with a fresh `outcomeFiredRef(false)`.
**Scope:** Covers `wonComplete` (DONE + GO AGAIN) and `resumePrompt` (GAVE IN + DONE + GO AGAIN). The `running`-state GAVE IN path uses two-stage confirm state (`confirmingGaveIn`) as its own guard; `handleGaveIn` itself is not guarded by `outcomeFiredRef` because it is also called from that path.
