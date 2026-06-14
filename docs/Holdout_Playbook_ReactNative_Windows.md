# HOLDOUT — App Build Playbook
## React Native / Expo on Windows
**Nova Ventures Co. · March 2026**

> **Platform:** Windows PC · **Language:** TypeScript · **Framework:** React Native / Expo
> **Dev loop:** expo-dev-client (hot reload) + EAS Cloud for device builds

---

## A Note on Who This Playbook Is For

This playbook assumes no prior software development experience. You do not need to
know how to write code. You need to know what you want to build, be willing to make
decisions, and understand that your job is different from what most people think
"building an app" means.

**Your job is not to write code. Your job is to design the environment the code
gets written in.**

Claude Code writes the code. You define what it builds, set the boundaries it works
within, validate that the output is correct, and make judgment calls no AI can make
for you.

**The specification is the product. The code is disposable.** Your business plan,
CLAUDE.md, and your structured docs folder are the persistent assets. The code
Claude Code generates can be regenerated. The specification cannot.

---

## Why React Native — Not SwiftUI

SwiftUI was the original plan. The pivot happened for one decisive reason:

The battle visual animation requires constant tuning. You cannot tune animation
with a 15-20 minute build cycle. You need to see changes in seconds. React Native
with Expo Go gives you that — save a file and the change appears on your iPhone in
2-3 seconds. On Windows without a Mac, SwiftUI cannot give you this loop.

React Native is also the same stack as Daily Goals. Your EAS account, Apple
credentials, device registration, and hard-won build knowledge all carry forward.
Maximum reuse, minimum friction.

When your MacBook Air arrives: React Native code ports cleanly to a Mac workflow,
and native-only features (WidgetKit, Live Activities, Watch) can be layered on
without rewriting the app.

---

## Table of Contents
1. [Your Role as an AI-Native Builder](#1-your-role-as-an-ai-native-builder)
2. [Environment Setup](#2-environment-setup)
3. [Project Intelligence Architecture](#3-project-intelligence-architecture)
4. [Daily Goals Knowledge Extraction](#4-daily-goals-knowledge-extraction)
5. [Claude Code Handoff — The Correct Sequence](#5-claude-code-handoff--the-correct-sequence)
6. [The Development Loop](#6-the-development-loop)
7. [Build Phases](#7-build-phases)
8. [Validation Harness](#8-validation-harness)
9. [EAS Build Reference](#9-eas-build-reference)

---

## 1. Your Role as an AI-Native Builder

### 1.1 The Inversion

Claude Code writes the code. You are the **environment designer** — you create the
conditions under which good software gets built. Your outputs are:

- A precise specification (the business plan)
- An intelligence file Claude Code reads every session (CLAUDE.md)
- Non-negotiable constraints
- Human judgment at decision points requiring taste or domain knowledge
- Validation scenarios that define what "correct" looks like

The question that drives your work: **"What is missing from the environment that
caused this wrong output?"** When something breaks, fix the specification, not the
code. Fix the environment first. Regenerate.

### 1.2 The Spec Is the Product

If you lost every line of code today but kept the business plan, CLAUDE.md, and
docs folder — you could rebuild the app in days. If you lost those documents but
kept the code — you would struggle to understand what you built or how to change it.

Rules that follow from this:
- Every significant decision goes into CLAUDE.md or decisions.md immediately
- Every mistake and its fix goes into patterns.md
- The docs folder is version-controlled the same as the code

### 1.3 Maturity Progression

| Level | What it looks like | Target |
|---|---|---|
| **L1 — Directed** | Claude Code builds one thing at a time with step-by-step direction | Phase 1 start |
| **L2 — Structured** | CLAUDE.md populated, Claude Code operates autonomously within it | Phase 1 end |
| **L3 — Parallel** | Multiple Claude Code sessions simultaneously — implement, review, document | Phase 2 |

---

## 2. Environment Setup

### 2.1 Are You Already Set Up?

If you built Daily Goals, most of this is already done. Check:

```
node -v       # should show 18+
git --version
eas --version
claude --version
```

If all four return version numbers, skip to Section 3. You are already set up.

### 2.2 Fresh Setup (if needed)

**Node.js**
Download LTS from nodejs.org/en/download. Install with defaults.
After install, close and reopen PowerShell — installer updates PATH and
the terminal must restart to see it.
```
node -v    # verify: 18+
npm -v
```
> Installs once globally. Not per-project.

**Git**
Download from git-scm.com/download/win. Install with defaults.
Configure once — the `--global` flag means this applies to every project
on your machine, including Holdout. You do not reconfigure for each app.
```
git config --global user.name "Your Name"
git config --global user.email "you@email.com"
```

**VSCode Extensions** (Ctrl+Shift+X)
- **Claude Code** (Anthropic)
- **ESLint**
- **Prettier**
- **React Native Tools**
- **GitLens**

**Claude Code CLI**
```
npm install -g @anthropic-ai/claude-code
claude
```
> Uses your Claude Pro subscription. No separate billing. Installs once globally.
> Authentication persists — you do not re-authenticate per project.

**EAS CLI**
```
npm install -g @expo/eas-cli
eas login
```
> If you already have an Expo account from Daily Goals, use the same one.
> One account covers all your apps. Login persists — no re-authentication per project.

### 2.3 Apple Developer Account
Same account as Daily Goals — $99/year covers all your apps.
Same device registration carries forward. No new purchase or setup needed.

### 2.4 expo-dev-client on iPhone
Holdout requires a custom dev client — @shopify/react-native-skia is a native module
not bundled in Expo Go. Install the adhoc build once:
```
eas build --platform ios --profile adhoc
```
After that, run `npx expo start --clear` and scan the QR code with the Holdout app.
JS and shader changes hot-reload without rebuilding — same speed as Expo Go.

Do not use Expo Go for Holdout.

---

## 3. Project Intelligence Architecture

This is the highest-leverage section. Claude Code is only as good as the environment
you give it.

### 3.1 Full Project Structure

```
Holdout/
├── CLAUDE.md                          ← routing layer — read every session
├── claude-prompts.md                  ← reusable prompt library
├── package.json                       ← REQUIRED: EAS uses this as root marker
├── app.json                           ← Expo project config
├── eas.json                           ← EAS build profiles
├── .env                               ← local secrets (never commit)
├── .gitignore                         ← must include .env and node_modules
│
├── docs/
│   ├── holdout_business_plan.md       ← product strategy (primary source of truth)
│   ├── Holdout_Playbook_ReactNative_Windows.md  ← this file
│   ├── architecture/
│   │   ├── decisions.md               ← architectural choices + Daily Goals extraction
│   │   ├── patterns.md                ← approved patterns, anti-patterns, known issues
│   │   └── constraints.md             ← non-negotiables Claude Code cannot override
│   ├── context/
│   │   └── domain.md                  ← science, visual metaphor, coach voice
│   └── quality/
│       ├── grading.md                 ← quality state by feature area
│       ├── gaps.md                    ← known gaps tracked over time
│       ├── last-review.md             ← output of most recent /review session
│       └── handoff.md                 ← session handoff notes
│
├── src/
│   ├── screens/
│   │   ├── OnboardingScreen.tsx
│   │   ├── HomeScreen.tsx
│   │   ├── BattleScreen.tsx           ← active session, recommitment logic
│   │   └── HistoryScreen.tsx
│   ├── animations/
│   │   └── BattleVisual.tsx           ← core product component
│   ├── services/
│   │   ├── SessionService.ts
│   │   ├── StreakService.ts
│   │   └── CoachService.ts
│   ├── storage/
│   │   ├── sessions.ts
│   │   └── preferences.ts
│   └── constants/
│       ├── colors.ts
│       ├── timing.ts
│       └── coach.ts
│
└── tests/
    └── validation-scenarios.md        ← human-written acceptance criteria
```

> **package.json note:** EAS requires package.json to exist in the project root
> as its root marker. Without it, EAS uses the Windows username as the project
> identifier. This caused issues in the Daily Goals build — do not repeat it.

### 3.2 CLAUDE.md Is the Router

CLAUDE.md should stay under 150 lines. It is the map, not the encyclopedia.
When a section grows too large, move the detail to the appropriate docs/ file
and add a one-line pointer. The current CLAUDE.md is already written — it lives
in the project root and is included in this release package.

### 3.3 docs/architecture/constraints.md

```markdown
# Holdout — Non-Negotiable Constraints

## Product
- No backend, remote database, or server of any kind
- No user accounts or authentication
- No food logging, calorie tracking, or diet content
- No mindfulness, breathing, meditation, or journaling
- No therapy language — "Be kind to yourself", "Take a deep breath"
- No push notifications in V1
- No social features, sharing, or leaderboards

## Coach Voice
- Coach lines are calibration statements — not motivation or cheerleading
- Coach never uses the word "craving" — says "it"
- Each line under 15 words
- Zero judgment or shame on gave-in result

## Technical
- React Native Reanimated 2 for all animations — no other animation library
- AsyncStorage only — no SQLite, no Realm, no remote DB
- BattleVisual receives progress prop (0.0-1.0) — no internal timers
- All timing logic in BattleScreen — BattleVisual is a pure display component
- No hardcoded API keys anywhere
- Session result is binary: won or gaveIn

## Visual
- Animation at 60fps minimum on iPhone XR
- No particle effects, physics, or 3D — pure gradient animation
- Dark background (#0D0D0D) only — no light mode in V1
- Amber (#F5A623) is the craving force — not used for positive states
```

### 3.4 docs/context/domain.md

```markdown
# Holdout — Domain Context

## The Core Mechanism
Dopamine-driven cravings peak and subside within 15-20 minutes without action.
The app outlasts the craving. The user does not suppress it — they survive it.

## The Visual Metaphor
The battle visual externalises the craving as a visible force that can be
watched losing. This serves two functions:
1. Visual-spatial engagement occupies the brain resources used to imagine food
2. The user can see themselves winning in real time

The amber force represents the craving — not the user's weakness.
Just a force. It advances when unmet and retreats when held against.
The user's presence is what defeats it. Staying is the action.

## The Coach's Role
Location on the craving curve. Information, not encouragement.
"Minute 8. Hardest point. Goes down from here." — factual.
The coach never says "craving" — that word activates the pathway we're quieting.
The coach says "it" — distant, object-like, already losing power.

## Session Controls
Coach lines fire silently at minutes 4/8/12/16 — shockwave pulse + one calibration line, no
interaction required. User controls are always visible during a running session:
- **SUPPORT ME** — on-demand coach line (time-appropriate) + shockwave pulse
- **GAVE IN** — two-tap explicit end: first tap enters confirmation state (3s auto-reset), second tap ends session
GAVE IN is explicit. No timeout ends the session. Staying requires nothing beyond being present.

## Gave-In Handling
Zero judgment. Zero shame. "Session ended." Stats update. Streak resets.
The next session is one tap away.
A gave-in at minute 18 is still 18 minutes of fighting — session duration is
logged regardless of outcome.
```

---

## 4. Daily Goals Knowledge Extraction

Same stack means maximum reuse. Run this before creating the Holdout project.

### What You're Extracting
Not just code — everything: EAS config, AsyncStorage patterns, navigation
setup, component structure, build lessons. This becomes the foundation of
Holdout's `docs/architecture/decisions.md`.

### Extraction Prompt

Open Claude Code inside the Daily Goals project folder:

```
Read all source files and configuration in this project.

I am building a new app called Holdout using the same React Native / Expo stack.
Extract and document everything I should carry forward:

1. EAS config: eas.json settings, account slug, Apple Team ID, bundle ID convention,
   credential approach (managed vs manual)
2. AsyncStorage: key naming conventions, data structure patterns,
   any utility/wrapper files I created
3. Navigation: exact library and version, how screens are registered,
   how first-run detection works
4. Styling: StyleSheet approach, any shared theme or token files
5. Component patterns: how components are named, structured, and co-located
6. App entry: how App.js initialises the app, routing logic
7. Dependencies: full package.json with all dependency versions
8. Build lessons: anything that was hard, painful, or took time to figure out —
   especially EAS, device registration, or iOS-specific issues

Then list specifically which files I should copy directly into Holdout
with minimal changes.

Format the full output for pasting into Holdout's
docs/architecture/decisions.md under "## Extracted From Daily Goals".
```

After running this, paste the output into `docs/architecture/decisions.md`
before running Step 4 of the Claude Code onboarding sequence.

---

## 5. Claude Code Handoff — The Correct Sequence

### 5.1 One-Time Project Onboarding

Run this sequence exactly once when starting the project. Order matters.

**Step 1 — Business Plan**
```
Read this document completely before we write any code:
@docs/holdout_business_plan.md

Summarise:
1. The core mechanic — what the user does and what the app shows them
2. The role of the visual — what it represents and how it changes over 20 minutes
3. The coach's role — what it provides and what it explicitly does not provide
4. The two things that must never be added to this app

No code yet. Confirm understanding first.
```
Do not proceed until the summary is accurate. Correct anything wrong.

**Step 2 — Playbook**
```
Now read:
@docs/Holdout_Playbook_ReactNative_Windows.md

Summarise:
1. Why React Native was chosen over SwiftUI
2. The folder structure and what lives where
3. The development loop — Expo Go vs EAS builds, when to use each
4. The CLAUDE.md routing pattern and why BattleVisual gets a progress prop

Still no code.
```

**Step 3 — Constraints and Domain Context**
```
Read:
@docs/architecture/constraints.md
@docs/context/domain.md

State one thing from each file that will materially affect how you
approach the BattleVisual implementation.
```

**Step 4 — Daily Goals Extraction**
```
Here is the operational config and patterns extracted from Daily Goals:
[paste extraction output here]

Add to docs/architecture/decisions.md and confirm it is saved.
```

**Step 5 — Generate CLAUDE.md**
```
Using everything you have read, verify that CLAUDE.md in the project root
is accurate and complete. Update any sections that need correcting based
on what you now know. Write the updated version.
```

**Step 6 — Confirm and Begin**
```
Read CLAUDE.md back to me.
State: current phase, core mechanic in one sentence, two things that
must never be added.
What is the first file we build and why?
```

### 5.2 Every Session Start

```
/start
```
(See claude-prompts.md for the full /start prompt definition.)

If you ran /handoff last session:
```
/start handoff
```

---

## 6. The Development Loop

### 6.1 expo-dev-client vs EAS Builds — When to Use Each

**expo-dev-client (daily development — use this constantly):**
- All UI work: screens, layouts, typography, colors
- All animation work: BattleVisual shader tuning hot-reloads — SKSL changes appear in seconds
- All logic work: session management, streak calculation, coach service
- Start dev server: `npx expo start --clear` → scan QR with the Holdout dev client app

**Requires a one-time adhoc build** to install the dev client on device:
`eas build --platform ios --profile adhoc`

After install, no rebuild needed for JS or shader changes. Rebuild only when adding
native packages, changing app.json plugins, or changing entitlements.

**EAS Production Build:**
- App Store submission only

> Note: Expo Go does not work for Holdout — react-native-skia is a native module
> not bundled in Expo Go. Always use the installed Holdout dev client app.

### 6.2 The Four-Step Loop

**Step 1: /plan (always before writing any code)**
```
/plan [feature]
```

**Step 2: Execute one phase at a time**
```
Implement Phase 1 of our approved plan: [paste phase].
Follow CLAUDE.md and docs/architecture/patterns.md.
Do not implement Phase 2 yet. Wait for review.
```

**Step 3: /verify after each phase**
```
/verify
```

**Step 4: /pre-build before every EAS build (never skip)**
```
/pre-build
```

### 6.3 BattleVisual — Special Development Protocol

The BattleVisual component is the core product. It gets built and validated
before any screen uses it.

Build it as a standalone component with a test harness:
```
Build BattleVisual.tsx as a standalone component.
It accepts one prop: progress (0.0 to 1.0).
Build a simple TestScreen alongside it with a slider that controls the
progress value in real time. This lets me tune the visual without
running a full session.
```

Only remove the TestScreen and integrate BattleVisual into BattleScreen
after the animation is confirmed working at 60fps on device.

### 6.4 Parallel Sessions (when Phase 1 is stable)

- **Session A:** Main implementation
- **Session B:** `/start` → `/review [recently completed feature]`
- **Session C:** `/start` → `/update-docs` based on Session A progress

---

## 7. Build Phases

> **Full specification:** `docs/holdout_business_plan.md` Sections 5-12.
> This section is the execution reference only.

### Phase 1 — Core Mechanic (Weeks 1-2)

**Build Order (strict — each depends on the previous):**

1. `src/constants/` — colors, timing, coach message pools
2. `src/storage/` — AsyncStorage CRUD for sessions and preferences
3. `src/services/` — SessionService, StreakService, CoachService
4. `src/animations/BattleVisual.tsx` — build with test harness, validate at 60fps
5. `src/screens/OnboardingScreen.tsx` — 3 screens, first launch only
6. `src/screens/HomeScreen.tsx` — CTA button, streak display
7. `src/screens/BattleScreen.tsx` — integrates BattleVisual, recommitment logic
8. `src/screens/HistoryScreen.tsx` — visual thumbnails, win rate, streak
9. `App.tsx` — navigation, first-run detection, unfinished session recovery

**Recommitment Schedule:**

| Tap # | Approx. Minute | Variance |
|-------|---------------|---------|
| 1 | 4 | ±30 sec |
| 2 | 8 | ±30 sec |
| 3 | 12 | ±30 sec |
| 4 | 16 | ±30 sec |

### Phase 2 — Polish and App Store (Weeks 3-4)

After Phase 1 sign-off. Full spec in business plan Section 12.

### Phase 3 — Claude API Dynamic Coach (Post-Launch)

Cloudflare Worker proxy pattern. Key never in app binary.
Only after App Store launch and positive review signal.

---

## 8. Validation Harness

### Why Claude Code Cannot See This File

If the builder writes the tests, it builds code that passes its own tests —
which may not match what you actually wanted. Write these before Claude Code
builds anything. Test manually against them after each build.

Create `tests/validation-scenarios.md`:

```markdown
# Holdout — Validation Scenarios
# Human-authored. Claude Code does not see this file during implementation.

## VS-001: Onboarding First Launch
GIVEN: Fresh install, no prior data
WHEN: User opens app and completes all 3 onboarding screens
THEN: cravingType and cravingWindow saved to AsyncStorage
AND: onboardingComplete set to true
AND: HomeScreen appears (no notification permission requested)

## VS-002: Session Start — Visual Appears
GIVEN: User on HomeScreen
WHEN: User taps "I'M HAVING A CRAVING"
THEN: BattleScreen appears within 500ms
AND: Battle visual is visible — amber pressing from edges, clear center
AND: Visual is animating (amber slowly advancing)

## VS-003: Amber Behavior at Minute 0-4
GIVEN: Session started, minute 0-4
WHEN: User watches the screen
THEN: Amber force is visibly advancing from all edges toward center
AND: Center remains clear or near-clear
AND: Animation is smooth — no stuttering or jumps

## VS-004: Turn Visible at Minute 8
GIVEN: Active session, approximately minute 8
WHEN: User watches the screen
THEN: Amber advance has clearly slowed or stopped
AND: Center force is visibly beginning to push back
AND: The change from minute 4 behavior is perceptible

## VS-005: Recommitment Prompt Appears
GIVEN: Active session at approximately minute 4
WHEN: Scheduled recommitment time is reached
THEN: Visual pulses gently (subtle scale or brightness)
AND: "Still holding?" text fades in
AND: Coach line appears below
AND: Large tap target is visible

## VS-006: Recommitment Tap Response
GIVEN: Recommitment prompt is visible
WHEN: User taps the tap target
THEN: Prompt dismisses within 100ms
AND: Session continues — visual resumes animating
AND: No coach line visible after 5 seconds (faded out)

## VS-007: Gave-In — Missed Recommitment
GIVEN: Recommitment prompt is showing
WHEN: User ignores it for 30 seconds
THEN: Session ends
AND: "Session ended." text appears — no shame or judgment copy
AND: Streak resets to 0
AND: Amber visually re-advances on screen before session end
AND: HomeScreen accessible (back navigation or button)

## VS-008: Session Won at Minute 20
GIVEN: Active session, user has tapped all recommitment prompts
WHEN: 20 minutes elapses
THEN: Amber fully retreats — screen holds clear for 3 seconds
AND: Coach close line appears: "That's 20 minutes. You held it." or variant
AND: "You held it." confirmation visible
AND: Streak increments by 1 on HomeScreen
AND: Session recorded as won in history

## VS-009: App Backgrounded Mid-Session
GIVEN: Active session at minute 6
WHEN: User presses home button and returns after 2 minutes
THEN: Battle visual is at the correct position for minute 8
AND: Session is still active — has not ended
AND: Next recommitment prompt appears at the correct remaining time

## VS-010: App Killed Mid-Session
GIVEN: Active session at minute 5
WHEN: User force-quits the app
WHEN: User reopens the app
THEN: HomeScreen shows, no active session
AND: The interrupted session is logged as gave-in with correct duration
AND: Streak has reset

## VS-011: History Screen Visual Thumbnails
GIVEN: At least 3 sessions completed (mix of won and gave-in)
WHEN: User views HistoryScreen
THEN: Won sessions show as thumbnails with clear/white center
AND: Gave-in sessions show amber still visible at edges
AND: Win rate percentage is arithmetically correct
AND: Streak reflects consecutive won sessions

## VS-012: Animation Performance
GIVEN: Active session running
WHEN: User observes battle visual for 30 seconds
THEN: Animation is smooth — no visible frame drops or stuttering
AND: Verified on the oldest / lowest-spec iPhone available
```

### Using the Scenarios

After each EAS build:
1. Work through each scenario on device
2. Mark ✅ pass or ❌ fail
3. For failures: use `/gap-analysis` — find what's missing from the environment
4. Update `docs/quality/grading.md` with results

---

## 9. EAS Build Reference

### eas.json

```json
{
  "cli": {
    "version": ">= 10.0.0"
  },
  "build": {
    "development": {
      "distribution": "internal",
      "ios": {
        "simulator": true
      }
    },
    "adhoc": {
      "distribution": "internal",
      "developmentClient": true
    },
    "production": {
      "ios": {
        "buildNumber": "auto"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Command Reference

| Command | What It Does | When to Use |
|---------|-------------|-------------|
| `npx expo start --clear` | Start dev server (clears Metro cache) | Daily development |
| `npx expo start --lan` | LAN fallback (if 127.0.0.1 connection error) | When --clear doesn't fix connection |
| `eas device:create` | Register iPhone UDID | First time only |
| `eas device:list` | Confirm device registered | Before building |
| `eas build --platform ios --profile device` | Dev client build, device install (hot-reload) | Initial setup + any new native package |
| `eas build --platform ios --profile adhoc` | Baked standalone build, no Metro needed | Phase sign-off testing |
| `eas build --platform ios --profile production` | App Store build | Submission only |
| `eas submit --platform ios --latest` | Submit to App Store | After production build |
| `eas build:list` | View all builds and status | Anytime |

### Phase 1 Sign-Off Checklist

- [ ] VS-001 through VS-012 all pass ✅ on physical iPhone
- [ ] Animation runs at 60fps — verified on oldest available device
- [ ] App backgrounded mid-session: visual resumes at correct position
- [ ] App killed mid-session: gave-in logged correctly on relaunch
- [ ] History thumbnails visually distinguish won vs gave-in sessions
- [ ] Personal holdout rate above 60% over 2 weeks of real use

---

*Nova Ventures Co. · Holdout Playbook — React Native on Windows · March 2026*
