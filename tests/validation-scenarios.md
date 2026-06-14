# Craving Holdout: Urge Timer — Phase 1 Sign-Off Checklist

All scenarios must pass on a physical iPhone before proceeding to Phase 2.
Do not proceed if any scenario fails — fix it first.

Test environment: EAS adhoc build on physical iPhone (iOS 15+).

---

## SC-01: Onboarding Completes and Preferences Save

**Setup:** Fresh install with no prior data.
**Steps:**
1. Open app — onboarding should appear
2. Select a craving type (e.g. "Sweet")
3. Select a craving window
4. Read explanation screen, proceed
**Pass criteria:**
- [ ] All 3 onboarding screens complete without crash
- [ ] Preferences saved: next app launch skips onboarding and shows HomeScreen
- [ ] `cravingType` and `cravingWindow` saved correctly

---

## SC-02: Home Screen — Streak and Theme Picker

**Setup:** Complete 2 won sessions, then 1 gave-in session.
**Pass criteria:**
- [ ] After 2 wins: streak shows 2
- [ ] After gave-in: streak shows 0
- [ ] Three theme swatches visible (FIRE / VOID / EMBER) — tapping each saves and persists across launches
- [ ] Selected theme is active in the next battle session

---

## SC-03: Session Starts Immediately — Visual Under 500ms

**Steps:** Tap "I'M HAVING A CRAVING" on HomeScreen.
**Pass criteria:**
- [ ] BattleScreen appears within 500ms of tap
- [ ] Battle visual is visible and animated (amber at edges, center clear or small)
- [ ] Progress bar visible at bottom — starts at zero and grows
- [ ] Coach start message appears and fades after ~7 seconds
- [ ] SUPPORT ME button (shield, bottom-left) and GAVE IN button (X, bottom-right) both visible

---

## SC-04: Battle Visual Advances Correctly — Minutes 0–4

**Steps:** Watch the battle visual from session start to minute 4.
**Pass criteria:**
- [ ] Amber force visibly presses inward from all four screen edges
- [ ] Movement is slow and organic (not mechanical or snapping)
- [ ] Center remains clear/light
- [ ] Visual is smooth — no stuttering or jank

---

## SC-05: Battle Visual Shows Hold — Minutes 4–8

**Steps:** Watch the battle visual from minute 4 to minute 8.
**Pass criteria:**
- [ ] Amber advance clearly slows after minute 4
- [ ] Boundary between amber and center breathes slightly (not a hard line)
- [ ] Center force appears to be holding ground

---

## SC-06: Battle Visual Shows Retreat — Minutes 8–14

**Steps:** Watch the battle visual from minute 8 to minute 14.
**Pass criteria:**
- [ ] Center begins reclaiming ground (barely perceptible at first)
- [ ] By minute 12, the shift toward center is clearly visible
- [ ] Amber compresses visibly at edges

---

## SC-07: Battle Visual Shows Victory — Minutes 14–20

**Steps:** Watch the battle visual from minute 14 to minute 20.
**Pass criteria:**
- [ ] Center force clearly winning — amber compressed to thin border at edges
- [ ] At minute 20: amber gone. Screen holds clear.
- [ ] White flash overlay fades in, holds, then fades back
- [ ] Coach close line appears ("That's 20 minutes. You held it." or variant)
- [ ] "You held it." text visible on screen during win animation
- [ ] Screen automatically returns to HomeScreen — no button tap required
- [ ] Streak increments by 1 on HomeScreen

---

## SC-08: Silent Milestones Fire at Correct Times

**Steps:** Run a session and watch for milestone events at approximately minutes 4, 8, 12, 16 (±30s).
**Pass criteria:**
- [ ] At each milestone: coach calibration line appears in the pill at bottom
- [ ] At each milestone: shockwave pulse ring expands outward from center
- [ ] At each milestone: corresponding milestone dot on progress bar lights amber and pop-scales
- [ ] No overlay, no forced interaction — session continues automatically
- [ ] Coach line is calibration-only ("Minute 8. Hardest point." etc.) — not motivation or cheerleading
- [ ] Coach line fades after ~7 seconds

---

## SC-09: SUPPORT ME Button — On-Demand Coach

**Steps:** During a running session, tap the shield icon (bottom-left) at various points.
**Pass criteria:**
- [ ] Coach line appears immediately — content is time-appropriate (early/mid/late phase)
- [ ] Shockwave pulse fires from center
- [ ] Button flashes a brief amber glow on tap
- [ ] Session continues unaffected — no state change
- [ ] Can be tapped multiple times — each fires a new coach line and pulse

---

## SC-10: GAVE IN Button — Two-Stage Confirm

**Steps:** During a running session, tap the X icon (bottom-right).
**Pass criteria:**
- [ ] First tap: "Gave in?" label appears above button, button glows amber with slow breathe animation
- [ ] 3 seconds with no second tap: confirmation resets automatically — button returns to normal
- [ ] Second tap within 3 seconds: session ends
- [ ] Visual drains — amber re-advances, center dims over ~5 seconds
- [ ] "Session ended." text appears — no judgment copy, no shame language
- [ ] RETURN button appears after drain completes
- [ ] Streak resets (if it was > 0)
- [ ] Session logged in history as gaveIn

---

## SC-11: Won Session — Correct Outcome

**Steps:** Complete a full 20-minute session (use 20x speed dev build if available).
**Pass criteria:**
- [ ] Battle visual completes (amber gone, screen holds clear for ~2 seconds)
- [ ] White overlay fades in and back out
- [ ] Coach close line visible throughout the win animation
- [ ] "You held it." visible on screen
- [ ] Streak increments by 1
- [ ] Session logged in history with result: won, duration: 20:00
- [ ] Screen navigates back to HomeScreen automatically

---

## SC-12: Gave-In Session — Zero Shame Result

**Steps:** Trigger gave-in via the GAVE IN two-stage button.
**Pass criteria:**
- [ ] "Session ended." is the complete result message — nothing more
- [ ] No additional judgment copy, no shame, no disappointment language
- [ ] Streak resets to 0
- [ ] Session logged in history with result: gaveIn, duration reflects actual elapsed time
- [ ] RETURN navigates back to HomeScreen

---

## SC-13: Progress Bar and Milestone Dots

**Steps:** Run a session and observe the bottom progress bar.
**Pass criteria:**
- [ ] Amber fill grows left-to-right over 20 minutes
- [ ] Four milestone dots at 4m/8m/12m/16m positions with labels above
- [ ] Each dot lights amber and pop-scales at the exact same moment the coach line and shockwave fire
- [ ] Progress bar hides during gave-in drain and won state (only visible while running)

---

## SC-14: App Backgrounded Mid-Session — Visual Catches Up

**Steps:** Start a session. After 2 minutes, press Home to background the app. Wait 1 minute. Return.
**Pass criteria:**
- [ ] On return, battle visual is at the correct position for ~3 minutes elapsed
- [ ] Progress bar reflects correct elapsed time
- [ ] Session is still active — not ended
- [ ] Visual did not reset to minute 0

---

## SC-15: App Killed Mid-Session — Marked as Gave-In on Next Launch

**Steps:** Start a session. After 3 minutes, force-quit (swipe up in app switcher). Re-open the app.
**Pass criteria:**
- [ ] App opens normally — no crash
- [ ] HomeScreen shows (not BattleScreen)
- [ ] Session from before the kill appears in history with result: gaveIn
- [ ] Duration logged reflects ~3 minutes (not zero, not 20)
- [ ] Streak reflects the gave-in (resets if it was > 0)

---

## SC-16: History Screen — Fight Record and Statistics

**Setup:** Complete at least 5 sessions (mix of won and gaveIn).
**Pass criteria:**
- [ ] Each session appears as a horizontal progress bar
- [ ] Won sessions: full-width white bar with "20:00" label
- [ ] Gave-in sessions: partial amber bar proportional to elapsed time
- [ ] Milestone ticks visible at 20/40/60/80% of bar width
- [ ] Win rate percentage is arithmetically correct: `won / total * 100`
- [ ] Current streak reflects consecutive wins from most recent session backward
- [ ] A gave-in in the middle correctly breaks the streak
- [ ] Best streak shown separately (all-time)

---

## SC-17: Animation Performance and Heat

**Steps:** Run a full 20-minute session on the oldest iPhone available.
**Pass criteria:**
- [ ] Animation is smooth — no visible stuttering or jank
- [ ] Amber boundary transitions feel organic, not mechanical
- [ ] Device back does not become noticeably warm during the session
- [ ] App does not crash

---

## SC-18: Personal Validation

**Steps:** Run 5+ real sessions over multiple days during actual cravings.
**Pass criteria:**
- [ ] The 20-minute mechanic genuinely works personally
- [ ] Coach calibration lines feel like information, not motivation
- [ ] The visual battle is engaging enough to hold attention for 20 minutes
- [ ] Gave-in result feels judgment-free
- [ ] Won result feels earned — not over-celebrated
- [ ] Heat theme, void theme, and ember theme all look correct in real use

---

## Sign-Off

| Scenario | Pass | Fail | Notes |
|----------|------|------|-------|
| SC-01 Onboarding | | | |
| SC-02 Home screen + theme picker | | | |
| SC-03 Session start < 500ms | | | |
| SC-04 Visual: minutes 0–4 | | | |
| SC-05 Visual: minutes 4–8 | | | |
| SC-06 Visual: minutes 8–14 | | | |
| SC-07 Visual: minutes 14–20 + win | | | |
| SC-08 Silent milestones | | | |
| SC-09 SUPPORT ME button | | | |
| SC-10 GAVE IN two-stage confirm | | | |
| SC-11 Won session outcome | | | |
| SC-12 Gave-in zero shame | | | |
| SC-13 Progress bar + dots | | | |
| SC-14 Backgrounded → catches up | | | |
| SC-15 Killed → gave-in on launch | | | |
| SC-16 History fight record | | | |
| SC-17 Performance + no heat | | | |
| SC-18 Personal validation | | | |
