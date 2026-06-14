# Holdout — Session Handoff

Date: 2026-05-03
Phase: 3 complete — waiting on Apple review
Previous session: 2026-04-28 — IAP Sandbox validation, NSMotionUsageDescription fix, production submission

---

## What Was Accomplished This Session

1. **Coach message rewrite — tap1, tap2, tap3, tap4 (40 lines).** Milestone pools rewritten to
   remove specific minute-number references that felt like status readouts mid-session. New lines
   lead with what each moment means:
   - tap1 (minute 4): first-surge framing ("You made it through the first surge. The harder part
     is still ahead. Hold.") — makes clear the harder zone is still coming without naming a minute.
   - tap2 (minute 8): intensity-as-confirmation reframe ("The harder it feels right now, the closer
     you are to through it." / "This is the hardest it gets. It won't push harder than this. Hold.").
   - tap3 (minute 12): social proof lead ("Almost everyone who gets here makes it through. You're
     here.") + "It's already lost. You're just finishing the round."
   - tap4 (minute 16): spent-craving framing ("This isn't effort anymore. It's just the clock running
     out.") + value-of-holding reminders ("Finish this and the next one starts from a slightly weaker
     place.").

2. **start pool — 5 lines rewritten.** Removed passive "wait it out" framing, felt-state assumptions
   ("Feels like it won't stop"), and empty reassurance ("It always does"). Replaced with time facts
   and mechanism framing.

3. **supportMe — 8 "Minute 8" references removed.** All lines now use "hardest stretch" or "hardest
   point" language that is accurate whenever SUPPORT ME is tapped. One was missed in planning and caught
   during /verify (mid.first[9]: "Minute 8 is done. The rest is just finishing.").

4. **Em dash pass — all user-facing strings.** winLingers (2), supportMe.mid (2), HOME_WIN_MESSAGES (1),
   HOME_GAVE_IN_MESSAGES (1) cleaned. Em dashes flagged as AI writing tell.

5. **Minor pool fixes.** winLingers[5] "Still running? Another twenty is usually enough." rewritten.
   earlyWin[6] "Peaked and passed. They always do." rewritten. supportMe.late.repeat[5] "Keep the
   screen" replaced with "Stay on it."

6. **/verify and /update-docs completed.** session-brief.md and domain.md section 6 updated with new
   approved coach line examples. grading.md entry added.

---

## Files Modified This Session

| File | Change |
|------|--------|
| `src/constants/coach.ts` | tap1/tap2/tap3/tap4 (40 lines); start (5 lines); winLingers (2); earlyWin (1); supportMe (9 lines total); HOME_WIN/GAVE_IN_MESSAGES (2 em dashes); header comment updated |
| `docs/context/session-brief.md` | Coach voice rules updated (15-word limit removed, no-em-dash + no-felt-state added); milestone examples updated to reflect new voice |
| `docs/context/domain.md` | Section 6 "Coach Lines by Minute Mark" rewritten — stale minute-ref examples replaced, tap1/tap2/tap3/tap4 voice direction updated, supportMe pool rationale updated |
| `docs/quality/grading.md` | 2026-05-03 entry added to Constants & Storage section |
| `docs/quality/handoff.md` | This file |

---

## What Comes Next

1. **Wait for Apple review.** No action required. Monitor App Store Connect.

2. **On approval — submit IAP product for App Store review.** Gate: app build approved. Submit
   `com.novaventuresco.holdout.themes` ("Ready to Submit") for its own review. Real-money purchases
   blocked until "Approved" status.

3. **On approval — update App Store CTA links.** Five `href="#"` placeholders in landing page and
   ASO articles need the live App Store URL.

4. **Device validation of coach changes.** Run a session to each milestone in the dev client and read
   the coach lines in context. Key moments: tap2 (minute 8 reframe), tap4 (spent-craving framing),
   SUPPORT ME at mid phase (verify "hardest stretch" language reads naturally).

---

## Open Decisions

None blocking.

---

## Known Issues / Blockers

**IAP product App Store review pending** — `com.novaventuresco.holdout.themes` is "Ready to Submit."
Real purchases blocked until product approved. Gate: app build must be approved first.
