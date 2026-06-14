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
