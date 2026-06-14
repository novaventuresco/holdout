# Holdout — Known Gaps

Track every gap, bug, and deferred item here as they surface during development.
Gaps from previous sessions carry forward until resolved.

Format: [YYYY-MM-DD] Gap description — Severity — Target phase — Status

---

## Active Gaps

**[2026-04-28] IAP product requires separate App Store review after app build approval**
The theme pack product (`com.novaventuresco.holdout.themes`) is currently "Ready to Submit"
in App Store Connect. Sandbox purchases work at this status. Real-money purchases (live App
Store) require the product status to be "Approved." After the app build clears Apple review,
the IAP product must be submitted for its own review in App Store Connect before live users
can complete purchases.
Severity: High (blocks monetization) — Target phase: P3 post-approval — Status: Pending app approval

---

## Resolved Gaps

**[2026-04-09] setTimeout handle in AppState handler not cleared on unmount**
In SpatialBalance, the AppState `change` handler uses a `setTimeout` to delay re-enabling
the physics loop after the 420ms recentring window. The `setTimeout` ID is not stored in a
ref and not cleared in the component's unmount cleanup. If SpatialBalance unmounts during
the 420ms window (e.g. user taps PASSIVE mid-recentre), the callback fires on an unmounted
component. In practice this is harmless — the callback only sets `recentringRef.current = false`,
a plain ref write with no state or SharedValue side-effects. No user-visible impact.
Severity: Low — Target phase: P2 cleanup
Resolved: 2026-04-17 — `recentringTimeoutRef` added; setTimeout ID stored and cleared in
AppState useEffect cleanup alongside `sub.remove()`.

**[2026-04-09] edgeContact retains last value during 420ms AppState recentring window**
When the app returns from background, SpatialBalance snaps orbX/orbY to 0 via `withTiming`
(420ms). During this window, the physics loop is paused via `recentringRef`. However, `edgeContact`
was not explicitly reset to 0 during the recentring animation — it retained whatever value it
had when the app was backgrounded. It lerps back toward 0 naturally once the physics loop
resumes and `newDist` is re-evaluated. No user-visible impact (the 420ms window is imperceptible
and edgeContact's visual effect — edge pressure deepening, orb dim — is subtle).
Severity: Low — Target phase: P2 cleanup
Resolved: 2026-04-17 — `edgeContact.value = 0` added to AppState `'active'` handler block
alongside the existing wind state resets. Edge pressure and orb dim now clear immediately on resume.
`edgeContact` added to AppState useEffect dependency array.

**[2026-03-26] ISSUE-03: Double-read pattern in storage writes**
`saveSession` and `updateSession` each called `getSessions()` internally. Crash recovery
on app launch called `getActiveSession()` (read) then `abandonSession()` (read + write) —
two full storage reads on cold start.
Fix: module-level `_cache: SessionRecord[] | null` added to `sessions.ts`. `getSessions()`
serves from memory after first read; cache invalidated before every write.
Resolved: 2026-04-05 (Session 14)

**[2026-03-26] ISSUE-08: Coach message repetition across sessions**
`randomFrom()` had no memory of prior picks — the same line could appear on consecutive sessions.
Fix: replaced with `pickFrom()` — Fisher-Yates shuffle queue keyed by pool reference. Every
message appears once before repeats. Each pool (tap1, tap2, supportMe.early, etc.) tracks
independently. Queue persists for app lifetime.
Resolved: 2026-04-05 (Session 14)

**[2026-03-28] ISSUE-09: BattleVisual `time` SharedValue not cancelled on unmount**
`cancelAnimation(time)` added to time clock `useEffect` cleanup.
Resolved: 2026-03-29 (Session 6)

---

## Gap Severity Guide

- **Blocker** — Prevents build, crash on launch, data loss
- **High** — Feature broken, wrong result, user-visible incorrect behavior
- **Medium** — Known incorrect behavior, acceptable for current phase
- **Low / Cosmetic** — Minor visual or copy issue, no functional impact
