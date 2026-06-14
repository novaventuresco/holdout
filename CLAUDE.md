# Craving Holdout: Urge Timer — Claude Code Intelligence

## ALWAYS READ THESE FILES FIRST
Before responding to any request in this project, read this file:
1. docs/context/session-brief.md — mechanic spec, coach voice, session states, color palette, key architecture facts

Do not proceed with any task until you have read it.
Confirm by stating:
(a) the current build phase
(b) the core mechanic in one sentence
(c) the two things that must never be added to this app

---

## Project Summary
React Native / Expo iOS app. Local AsyncStorage only. No backend. No auth.
No push notifications.

Core mechanic: 20-minute visual battle. An amber force presses in from the screen
edges — representing the craving. The user's presence on screen holds a cool center
force that slowly pushes back. Coach delivers one calibration line at 4/8/12/16 min
(silent, no forced interaction). User taps SUPPORT ME for on-demand calibration or
GAVE IN to end the session early. At 20 minutes, the amber retreats. Session won.

The phone is the redirect, not the blocker.

## Technical Stack
Framework: React Native / Expo
Language: JavaScript / TypeScript
Storage: AsyncStorage (local only — no SQLite, no Realm, no remote DB)
Animation: React Native Reanimated 4.x (runs on UI thread; no app.json plugin needed)
           + @shopify/react-native-skia (SKSL shader for BattleVisual)
Build: expo-dev-client (daily iteration) + EAS Cloud for device builds
Note: Expo Go no longer works — BattleVisual uses @shopify/react-native-skia (native module)
           + react-native-gesture-handler (BallsLayer active mode)
      development profile builds for iOS Simulator only (simulator: true) — cannot install on device
      Use `device` profile for real-device hot-reload: eas build --platform ios --profile device

## Key Files — Architecture
src/screens/HomeScreen            — idle state, CTA button, streak display
src/screens/BattleScreen          — active session, battle visual, session controls
src/screens/HistoryScreen         — visual session history, win rate, streak stats
src/screens/OnboardingScreen      — single-screen science explainer ("It's not about willpower."); first-run only
src/animations/BattleVisual       — SKSL fragment shader battle (core product component — Skia RuntimeEffect)
src/services/SessionService       — session start / complete / abandon logic
src/services/StreakService         — streak calculation from session history
src/services/CoachService         — calibration lines: scheduled by minute mark + on-demand by elapsed time
src/storage/sessions              — AsyncStorage CRUD for session records
src/storage/preferences           — AsyncStorage for onboarding preferences
src/constants/colors              — all design tokens
src/constants/timing              — session duration, recommitment schedule
src/constants/coach               — all coach message pools
src/navigation/types.ts           — RootStackParamList + TabParamList; imported by all screens using useNavigation
src/screens/SettingsScreen        — science info panel (HOW IT WORKS); pushed from HomeScreen via gear icon
src/components/SpatialBalance.tsx — active mode: gyroscope physics → orbX/orbY/centerBoost; renders null; drives BattleVisual orbOffset
src/components/BallsLayer.tsx     — PARKED (active mode v1, drag-to-center); preserved as reference, not mounted
plugins/withPrivacyManifest.js    — Expo config plugin; copies PrivacyInfo.xcprivacy into ios/ during EAS prebuild
src/services/IAPService.ts        — StoreKit IAP: connect, purchase, restore, disconnect; pending-promise map pattern
src/components/ThemePackPaywall.tsx — bottom-sheet paywall modal for theme pack unlock

## Extended Context — Read When Relevant
docs/architecture/constraints.md        — non-negotiables that cannot be overridden
docs/architecture/patterns-animation.md — Skia, SharedValue, Reanimated patterns + anti-patterns. Read when: touching BattleVisual, shader uniforms, or Reanimated animations.
docs/architecture/patterns-physics.md   — SpatialBalance physics, BattleScreen timing, stale closure patterns. Read when: touching SpatialBalance or BattleScreen physics/AppState.
docs/architecture/patterns-build.md     — Dev workflow, storage, services, build mistakes. Read when: build questions, storage or service work.
docs/architecture/decisions.md          — architectural decisions with rationale + EAS/App Store config
docs/context/domain.md                  — the science, visual metaphor, coach voice spec. Read when: writing coach lines or designing craving-science features.
docs/quality/grading.md                 — current quality state by feature area
docs/quality/features.md                — Phase 2 feature queue and backlog
docs/quality/gaps.md                    — known gaps tracked over time
docs/holdout_business_plan.md           — full product strategy, science, monetization. Read when: designing new features or making product-scope decisions.
docs/Holdout_V2_Master_Brief.md         — full product spec. Read when: major feature design requiring complete context.
docs/Holdout_Playbook_ReactNative_Windows.md — project setup guide. Read when: answering meta questions about the stack or onboarding.
tests/validation-scenarios.md           — Phase 1 sign-off checklist

## Hard Constraints (Summary)
Full detail in docs/architecture/constraints.md. Never violate these:
- No backend, remote database, or server of any kind
- No user accounts or authentication
- No food logging, calories, macros, or diet content
- No mindfulness, breathing exercises, meditation, or journaling
- No therapy language — "Be kind to yourself", "Take a deep breath"
- No push notifications in V1 — app works entirely in foreground
- No social features, sharing, or leaderboards
- Coach lines are calibration statements, not motivation or cheerleading
- Coach never uses the word "craving" — says "it" (distant, already losing power)
- The "no craving" rule applies to every string displayed via the coach pill — including mode instructions (PASSIVE_INSTRUCTION, ACTIVE_INSTRUCTION), not only pool messages
- Zero judgment or shame copy on gave-in result

## Approved Patterns (Summary)
Full detail in docs/architecture/patterns.md:
- AsyncStorage for all persistence — sessions and preferences
- Services are stateless — screens/components hold state via hooks
- BattleVisual receives sessionProgress as a Reanimated SharedValue<number> (0.0–1.0) — no internal timers
- All timing logic lives in BattleScreen, not in BattleVisual
- Session controls: SUPPORT ME (on-demand coach + shockwave pulse) and GAVE IN (two-stage confirm) always visible during running state. Coach lines also fire silently at scheduled milestones.
- Session result is binary: won or gaveIn — no partial or ambiguous states
- Active mode is a per-session opt-in toggle — passive is default; SpatialBalance mounts only during screenState === 'running' && activeMode

## Operational Config
Bundle ID: com.novaventuresco.holdout  ← intentionally retains "holdout"; display name is Craving Holdout: Urge Timer
Expo account: novaventures
Apple Team ID: FG7KD2G6QX
EAS Project ID: 15ca7a10-bc89-404c-a2f6-bed2934907cd
Device: registered (carries over from Daily Goals — same adhoc profile)
Build: EAS adhoc profile for device testing, production for App Store
Note: package.json must exist in project root as EAS root marker

## Build Phases
Phase 1 — Core Mechanic (COMPLETE as of 2026-04-05)
All screens built and device-validated. VS-001–VS-012 passed. CFI-2 cleared. Cleanup done.
Dev loop: npx expo start → scan QR with installed dev client app.

Phase 2 — Polish + Dynamic Coach (COMPLETE as of 2026-04-18)
Active mode = Spatial Balance mechanic (gyroscope + physics). BallsLayer parked.
SpatialBalance built: gyroscope → orbX/orbY → BattleVisual orbOffset shader uniform.
BattleVisual extended: orbOffset + orbFixed uniforms. PASSIVE | ACTIVE tap toggle in BattleScreen.
expo-sensors + expo-haptics added. App icon done. EAS device build done. Haptics validated.
All P2 items complete: P2-01–P2-06, P2-08, P2-10, P2-11, P2-13, P2-15, P2-16, P2-17, P2-18.
Post-P2 session behavior (2026-04-20): App kill/crash mid-session → silent delete (cancelSession,
no history entry, no streak impact). Background 20+ min on return → resumePrompt state: single
overlay with GAVE IN / DONE / GO AGAIN; no auto-win. ScreenState union now has 7 states.
Note: All non-fire/void/ember themes (glacier/abyss/solar/aurora/dusk/nebula) require EAS build for Skia shader device validation.

Phase 3 — App Store & Production Readiness (COMPLETE as of 2026-04-28)
P3-07 IAP (react-native-iap@14.7.0): IAPService.ts + ThemePackPaywall.tsx. Sandbox-validated on device 2026-04-28.
NSMotionUsageDescription removed from app.json — StoreKit triggers CMMotionActivityManager during purchase;
CMDeviceMotion (gyroscope) does not require it; removing eliminates the Motion & Fitness prompt mid-purchase.
Production EAS build submitted to App Store Connect 2026-04-28. Under Apple review.
TestFlight skipped — went direct to App Store.

Phase 4 — AI Features (Future)
P4-08: AI post-session chat (Claude API). P4-09: Claude API dynamic coach (Cloudflare Worker proxy).

## Decisions, Patterns & Known Issues
All architectural decisions with rationale: docs/architecture/decisions.md
Patterns index (3 focused files): docs/architecture/patterns.md
