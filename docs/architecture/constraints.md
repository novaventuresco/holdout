# Holdout — Non-Negotiable Constraints

These constraints apply to every implementation session and cannot be overridden.
If any instruction conflicts with these, refuse and explain why.

---

## Product Constraints

- No backend, remote database, or server of any kind (no Supabase, Firebase, CloudKit, custom API)
- No user accounts or authentication of any kind
- No food logging, calorie tracking, macros, or any diet-related data capture
- No mindfulness, breathing exercises, meditation, or journaling prompts
- No therapy language anywhere — never: "Be kind to yourself", "Take a deep breath", "How does that make you feel?"
- No push notifications in V1 — app works entirely in foreground, no OS-level notification permission required
- No social features, sharing, leaderboards, or community elements
- No subscription model in V1 — $4.99 flat fee only

---

## Coach Voice Constraints

- Coach lines are **calibration statements** about the craving curve — factual, not motivational
- Coach never uses the word "craving" — always says "it" ("it's fading", "it peaks here", "it's already lost")
- Each line must be under 15 words
- Zero cheerleading, zero forced positivity, zero encouragement
- Zero judgment or shame on gave-in result — "Session ended." is the complete message
- Coach tells the truth about difficulty — this is what makes it trustworthy
- Never express disappointment, never moralize about food choices

**Approved coach voice examples (at scheduled milestones — each has a 2-3 variant pool):**
- Min 4: "It's already peaked. You're past the worst." / "Four minutes. The turn starts here." / "Past the first peak. The curve goes down from here."
- Min 8: "Minute 8. Hardest point. Goes down from here." / "The longer you hold, the weaker it gets. Not later — right now." / "That pull is the habit loop looking for its exit. Hold."
- Min 12: "Past the peak. Nothing left for it to grow into." / "It's already lost. You're just watching the evidence."
- Min 16: "Four minutes. It's already lost." / "Four minutes from done. It has nothing left."
- Win (min 20): "That's 20 minutes. You held it." / "Twenty minutes. The loop is weaker than it was."

---

## Technical Constraints

- React Native Reanimated 4.x for all animations — no other animation libraries
- AsyncStorage only for persistence — no SQLite, no Realm, no WatermelonDB, no other local DB
- No analytics, no crash reporting, no telemetry in V1
- No hardcoded API keys, credentials, or secrets anywhere in source code
- Session result is binary: `won` or `gaveIn` — no partial states, no ambiguous outcomes
- One active session at a time — prevent double-start
- Session only counts as won if it reaches 20 minutes — no "early win"
- GAVE IN requires two explicit taps (second tap is confirmation, 3s auto-reset) — no timeout-to-gave-in
- App backgrounded during session: timer keeps running, visual catches up on return
- App killed during session: on next launch, mark as gaveIn

---

## Visual Constraints

- Battle visual must run at 60fps minimum on iPhone XR (2018 model or equivalent)
- No particle effects, physics engines, or 3D — pure animated gradient radii
- Dark background `#0D0D0D` only — no light mode in V1
- Amber (`#F5A623`) is the craving force — never used for positive UI states
- Center force (`#F0F0F0` → `#FFFFFF`) represents the user's presence — never amber
- Continuous gradient progress uses `useDerivedValue` (UI thread) — never `withTiming` on each tick
- `withTiming` is reserved for one-shot sequences only: win overlay fade (`winOpacity`) and gave-in drain
- Never use `withSpring` for any battle gradient — must feel like slow organic pressure, not bounce
- Session start to first frame of battle visual: under 500ms
- GAVE IN button response (first tap → confirmation state): under 100ms

---

## Accessibility Constraints

- All interactive elements minimum 44×44pt touch targets
- Coach text minimum 16pt, high contrast against dark background
- GAVE IN and SUPPORT ME touch targets minimum 120×120pt
- VoiceOver labels on all interactive elements

---

## Data Constraints

- All data local — AsyncStorage only
- No data leaves the device — ever
- Privacy policy truth: "Holdout stores your session history on your device. No data leaves your phone. No accounts. No tracking."
- Session record shape: `{ id, startTime, endTime, result, duration, recommitmentsCompleted, cravingType }`
- Preferences shape: `{ cravingType, cravingWindow, onboardingComplete }`
