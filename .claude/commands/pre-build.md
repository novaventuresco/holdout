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
8. Is eas.json configured with the correct bundle ID: com.novaventuresco.holdout? (intentionally retains "holdout" — display name is Craving Holdout: Urge Timer)
9. IAP production gate:
   - Is DEV_UNLOCK_ALL_THEMES = false in src/screens/HomeScreen.tsx?
   - react-native-iap@14.7.0 in package.json?
   - Purchases finished as non-consumable (correct for single theme-pack product)?
   - ThemePackPaywall displays price from product.displayPrice (not a hardcoded fallback)?
10. Explicitly confirm: "DEV_UNLOCK_ALL_THEMES = false — confirmed."

Fix everything identified. Confirm explicitly: "Safe to build."
