# Holdout — Claude Code Prompt Library

Last synced: 2026-05-02

---

## /start [alone | handoff | text]

Read CLAUDE.md and all files in the ALWAYS READ THESE FILES FIRST section.
Also read docs/quality/grading.md and docs/quality/gaps.md.

If $ARGUMENTS is the word "handoff", read docs/quality/handoff.md and use it as
additional context before confirming session state.

If $ARGUMENTS is anything else, treat it as a handoff note pasted directly.

If $ARGUMENTS is empty (alone), proceed with CLAUDE.md as the only context.

Confirm before we proceed:
- Current build phase
- Last thing completed
- What comes next
- Any open decisions or known issues
- Anything in grading.md or gaps.md that affects today's work

Do not propose any code changes yet. Orientation only.

---

## /plan [feature]

I want to implement $ARGUMENTS.
Before writing any code:
1. List every file that will be created or modified
2. Propose an approach per CLAUDE.md, constraints.md, and the relevant patterns file
   (see docs/architecture/patterns.md index — patterns-animation.md, patterns-physics.md, or patterns-build.md)
3. Identify edge cases — especially: BattleVisual animation state,
   milestone timing (4/8/12/16 min — silent, no user tap required),
   app backgrounding mid-session, session recovery on relaunch,
   and IAP/paywall state if the feature touches HomeScreen or themes
4. Phased implementation plan, max 3 steps per phase

Wait for my approval before writing any code.

---

## /verify

Review the implementation just completed:
1. Does it match the approved plan? If it diverges, explain why.
2. React Native / JavaScript issues: null/undefined handling, missing
   dependencies in useEffect, stale closures in callbacks, memory leaks
   in animation values that are not cleaned up?
3. Reanimated 4 specific: are animated values created with useSharedValue?
   Are style updates using useAnimatedStyle? Is withTiming used for all
   progress transitions?
4. Does this require a new EAS device build? (Expo Go is never used —
   @shopify/react-native-skia requires the installed dev client. A new EAS
   build is needed only if a new native package was added or a native config
   changed. JS/shader/logic changes hot-reload via Metro.)
5. Follows the relevant patterns file? Any anti-patterns introduced?
   (See docs/architecture/patterns.md index for which file to check)
6. What specifically should I verify in the dev client before any EAS build?
   List the exact flows: which screens, which states, which user paths.
7. What documentation needs updating? Flag with destination:
   - New architectural decision → docs/architecture/decisions.md
   - Animation/shader mistake or anti-pattern → docs/architecture/patterns-animation.md
   - Physics/SpatialBalance mistake or anti-pattern → docs/architecture/patterns-physics.md
   - Build/storage/service mistake or anti-pattern → docs/architecture/patterns-build.md
   - Structural change (new file, phase change) → CLAUDE.md

Do not write to any file yet. List what needs updating for /update-docs.

---

## /pre-build

I am about to trigger an EAS build. Review all changes since the last build:
1. Are there any imports of native modules that require a new device build?
   (Expo Go is never used on this project. A new EAS build is needed only if
   a new native package was added or a native config changed.)
2. Does BattleVisual use only Reanimated 4 APIs (useSharedValue,
   useAnimatedStyle, withTiming, useDerivedValue)?
3. Is animation cleanup handled — are shared values detached on unmount?
4. Are milestones (4/8/12/16 min) firing correctly — silent coach line +
   shockwave pulse + dot animation — no user tap required? Confirm no
   RECOMMITMENT_TIMEOUT_MS reference exists in source (deleted as dead
   code 2026-04-04).
5. Is session recovery on app relaunch working — killed sessions are
   silently deleted (cancelSession), not marked gaveIn?
6. Are there any hardcoded API keys or secrets in source files?
7. Does package.json exist in the project root (required as EAS root marker)?
8. Is eas.json configured with the correct bundle ID: com.novaventuresco.holdout?
9. IAP production gate:
   - Is DEV_UNLOCK_ALL_THEMES = false in src/screens/HomeScreen.tsx?
   - react-native-iap@14.7.0 in package.json?
   - Purchases finished as non-consumable (correct for single theme-pack product)?
   - ThemePackPaywall displays price from product.displayPrice (not a hardcoded fallback)?
10. Explicitly confirm: "DEV_UNLOCK_ALL_THEMES = false — confirmed."

Fix everything identified. Confirm explicitly: "Safe to build."

---

## /qa [feature]

Act as a QA engineer testing $ARGUMENTS:
1. Identify all edge cases, including unusual user behaviour
2. Simulate each user flow end-to-end
3. What could fail in production that would not show up in dev-client testing?
4. What specifically needs to be verified on a real device (not simulator)?
5. List specific scenarios from tests/validation-scenarios.md that are
   relevant — are they all covered?

Then fix any issues before I test.

---

## /review [scope]

Act as a senior React Native developer doing a code review of $ARGUMENTS.
Identify every file created or modified, then review them as a whole:
1. Correctness issues and edge cases not handled
2. Issues that only appear when files interact — not just per-file problems
3. Animation performance concerns — anything that could drop below 60fps
4. Memory leaks: useEffect cleanup, animation value teardown
5. Reanimated 4 pattern violations: useSharedValue (not Animated.Value),
   useAnimatedStyle (not Animated.View with useNativeDriver), withTiming
   for one-shot transitions, useDerivedValue for continuous UI-thread
   derivations — no JS-thread re-renders per frame
6. Deviations from the relevant patterns file — check docs/architecture/patterns.md
   for the index, then read the specific file (patterns-animation.md,
   patterns-physics.md, or patterns-build.md)
7. Anything that would fail in production but not in dev-client testing
8. Coach voice audit — for any string shown in the coach pill
   (pool messages, PASSIVE_INSTRUCTION, ACTIVE_INSTRUCTION, or any
   one-time instruction string):
   - Contains the word "craving"? (prohibited — say "it")
   - Over 15 words? (count them)
   - Motivational / cheerleading / therapy register?
     ("you've got this", "be proud", "take a deep breath" — prohibited)
   - Claims the user's felt state? (prohibited — time facts and mechanism only)
9. IAP / paywall check — if HomeScreen.tsx or ThemePackPaywall.tsx was modified:
   - Is DEV_UNLOCK_ALL_THEMES = false?
   - X close button on ThemePackPaywall disabled during purchase?
     (onPress={busy ? undefined : onClose} + disabled={busy})
   - Modal onRequestClose guarded? (onRequestClose={busy ? undefined : onClose})
   - IAPService.ts sets isConnected = false BEFORE await endConnection()?

Format every finding with a severity-prefixed ID:
  C-NN — Critical (charges user / data loss / crash)
  H-NN — High (broken feature, incorrect behavior under realistic conditions)
  M-NN — Medium (wrong in edge cases or under load)
  L-NN — Low (style, minor correctness, future trap)
Number sequentially across all severities. Include: file path + line range,
the exact problem, consequence, and the specific fix. End with a summary
table (ID / Severity / File / Issue) and a "Fix Priority" section
(Must fix / Should fix / Defer) before saving.

Do not make changes. Produce a review report only.
When complete, save to docs/quality/last-review.md.

---

## /fix-review

Read docs/quality/last-review.md.

That file contains findings from a code review in a separate session.
Before making any changes:
1. Categorize each finding: minor (small correction, style issue) or
   major (structural problem, cross-file interaction, approach rethink needed)
2. Plan fixes in order of severity — majors first
3. Flag any major finding that requires rethinking the approach rather
   than correcting code

Wait for my approval before making any changes.

---

## /gap-analysis

Review current environment quality:
1. Is CLAUDE.md accurate? Any stale information (wrong file names, old stack)?
2. Do the three patterns files (patterns-animation.md, patterns-physics.md, patterns-build.md) cover the patterns actually in the codebase? Any gaps across all three?
3. Are decisions made in code not yet in decisions.md?
4. Does domain.md reflect how the product has evolved?
5. Are there known issues not tracked in gaps.md?
6. Does the BattleVisual specification in the business plan match what
   was actually built?

Recommend specific additions or corrections to each file.

---

## /update-docs

Based on everything in this session — including findings flagged in /verify —
draft updates for my review. Do not write to any file until I approve.

Route content to the correct file:

**CLAUDE.md** — structural changes only:
- New files added to Key Files
- Build phase change
- New hard constraint discovered

**docs/architecture/decisions.md** — Architectural Decisions section:
- Any new decision made this session with date and rationale

**docs/architecture/patterns-animation.md** — Known Issues & Mistakes / Anti-Patterns:
- Animation/shader/Reanimated mistakes discovered, what caused them, how fixed
- New anti-patterns involving BattleVisual, SharedValues, or Reanimated

**docs/architecture/patterns-physics.md** — Known Issues & Mistakes / Anti-Patterns:
- Physics/SpatialBalance/AppState mistakes discovered, what caused them, how fixed
- New anti-patterns involving SpatialBalance, BattleScreen physics, or DeviceMotion

**docs/architecture/patterns-build.md** — Known Issues & Mistakes / Anti-Patterns:
- Build/storage/service mistakes discovered, what caused them, how fixed
- New anti-patterns involving AsyncStorage, services, IAP, or build workflow

**docs/quality/grading.md** — Feature Area Grades section:
- Updated grade + notes for any feature area touched this session
- Add session date and one-line summary of what changed

**docs/quality/features.md** — Feature status:
- Mark any P-number item DONE if completed this session
- Add new P-items if scope expanded

**docs/context/domain.md** — Coach voice and product philosophy:
- Any evolution in product behavior, coach voice rules, or visual mechanic
- Any new coach line principles established this session

---

## /handoff

Produce a session summary and save to docs/quality/handoff.md, overwriting
previous content. Use this exact structure:

---
# Holdout — Session Handoff

Date: [today's date]
Phase: [current phase number and name]
Previous session: [date and one-line description]

---

## What Was Accomplished This Session

[Numbered list. One item per feature or task completed. Include P-number if
applicable. Note if a /review or /fix-review was run and which findings
were resolved.]

---

## Files Modified This Session

| File | Change |
|------|--------|
[One row per file. Be specific about what changed, not just "modified".]

---

## What Comes Next

[Numbered list of next steps. For each step, state the explicit gate that
must pass before it can begin — e.g., "sandbox IAP testing complete",
"DEV_UNLOCK_ALL_THEMES confirmed false". If the next step is an EAS build
or App Store submission, list all pre-conditions.]

---

## Open Decisions

[Any architectural or product decision raised but not resolved. If none: "None blocking."]

---

## Known Issues / Blockers

[Active issues. Reference finding IDs (C-01 / H-01 etc.) from last-review.md
if relevant. If none: "None active."]

---

After saving, confirm: "Handoff saved to docs/quality/handoff.md."

---

## /ship

App Store submission preflight. Reads actual source files and docs — nothing
assumed. Reports PASS / FAIL / ACTION REQUIRED per gate and ends with a summary
table + final CLEAR TO SUBMIT or blocking list.

Gate categories:
1. **Code readiness** — DEV_UNLOCK_ALL_THEMES=false; ThemePackPaywall busy guards;
   IAPService.isConnected ordering; product ID; no RECOMMITMENT_TIMEOUT_MS
2. **Build config** — eas.json bundle ID; package.json present; react-native-iap version;
   no secrets in src/
3. **IAP / StoreKit** — App Store Connect product status (manual confirm);
   Sandbox end-to-end test complete (read handoff.md)
4. **Landing page URLs** — All 5 href="#" placeholders replaced with live App Store URL
   (3 in index.html, 1 each in the two ASO articles)
5. **App Store copy** — Support URL, Privacy URL, all copy fields in app-store-copy.md
6. **Privacy manifest** — withPrivacyManifest.js unconditional copy; PrivacyInfo.xcprivacy
   declares C617.1 + CA92.1
7. **Screenshots** — 5 device mockups confirmed at screenshots path

---

## Session Reference

**Main session** — one persistent window. Keeps full conversation context.
Runs: /start → /plan → implement → /verify → /fix-review → /pre-build → /qa
      → /update-docs → /handoff

**Before App Store submission:**
/ship → fix any FAIL items → trigger production EAS build

**Fresh sessions** — open cold, always run /start first.
Runs: /start → /review [feature]
      /start → /gap-analysis
      /start → /plan [next feature] (parallel planning)

**Why /update-docs runs in main session:**
It needs full conversation history to capture decisions and mistakes flagged
during /verify. A fresh session reads codebase cold and misses session context.

**Starting a session:**
- `/start`          → cold start, CLAUDE.md only
- `/start handoff`  → reads docs/quality/handoff.md automatically
- `/start [text]`   → treats pasted text as handoff note directly

**Dev client (not Expo Go):**
This project requires the installed EAS dev client for all testing.
Expo Go has never worked — @shopify/react-native-skia is a native module.
JS/shader/logic changes → hot-reload via Metro (2-3 sec feedback).
New native package or native config change → new EAS device build (15-20 min).
Never trigger an EAS build without running /pre-build first.
