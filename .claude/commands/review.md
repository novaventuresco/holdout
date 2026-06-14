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
