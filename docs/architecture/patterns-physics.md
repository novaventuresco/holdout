# Holdout — Physics & Timing Patterns (SpatialBalance + BattleScreen)

## SpatialBalance Patterns

### DeviceMotion subscription and physics loop must be separate intervals

SpatialBalance uses two independent loops — a `DeviceMotion` subscription callback that writes
to a `latestTilt` ref, and a `setInterval` physics loop that reads from that ref on every tick.

```ts
// DeviceMotion subscription — writes tilt to ref, runs on its own cadence
DeviceMotion.addListener(({ rotation }) => {
  latestTiltRef.current = { pitch: rotation.beta, roll: rotation.gamma };
});

// Physics loop — reads from ref, applies forces, writes SharedValues
const physicsInterval = setInterval(() => {
  const { pitch, roll } = latestTiltRef.current;
  // ... integrate velocity, write orbX.value, orbY.value, centerBoost.value
}, 33); // ~30Hz
```

**Why separate:** A single combined callback (physics inside the DeviceMotion listener) competes
with BattleScreen's `useFrameCallback` for the JS event loop. Bursts of sensor data can cause
physics ticks to cluster, producing stuttery orb motion. DeviceMotion fires on its own cadence
(hardware-driven); the physics loop fires on a predictable 33ms gate. Keeping them separate
ensures physics integration is regular regardless of sensor delivery timing.

**Never merge these.** If DeviceMotion rate changes or the sensor fires in bursts, physics
remains stable because it reads from the ref at its own 33ms boundary, not at every sensor event.

---

### AppState recentring — recentringRef pause flag prevents physics race

When the app returns from background, SpatialBalance animates orbX/orbY to 0 via `withTiming`
(420ms). The physics loop must not write during this window — a physics tick firing during the
animation would cancel the `withTiming` and snap the orb to the physics position.

```ts
const recentringRef = useRef(false);

// In AppState 'active' handler:
recentringRef.current = true;
orbX.value = withTiming(0, { duration: 420 });
orbY.value = withTiming(0, { duration: 420 });
setTimeout(() => {
  recentringRef.current = false;
}, 420);

// In physics loop — guard every tick:
if (recentringRef.current) return;
```

**Rule:** Any `withTiming` on a SharedValue that the physics loop also writes must be guarded
by a ref flag that pauses the physics loop for the duration of the animation. Direct value
writes (`sharedValue.value = x`) cancel running `withTiming` animations silently — no error,
no log, the animation just stops. The ref flag is the only protection against this race.

---

### edgeContact uses asymmetric lerp — drain rate ≠ recovery rate

`edgeContact` (0→1, measures how close the orb is to any edge) uses intentionally asymmetric
lerp rates: it drains slowly and recovers slowly, but drain is faster than recovery.

```ts
// Approved constants (device-validated 2026-04-09)
const EDGE_DRAIN = 0.05;    // ~1.3s to drain from 1→0 (20 physics ticks at 33ms)
const EDGE_RECOVER = 0.018; // ~3.5s to recover from 0→1

// In physics loop:
const targetEdgeContact = newDist > EDGE_ZONE_RADIUS ? 0 : 1;
edgeContact.value = edgeContact.value + (targetEdgeContact - edgeContact.value) *
  (targetEdgeContact > edgeContact.value ? EDGE_RECOVER : EDGE_DRAIN);
```

**Why asymmetric:** Equal rates produced an edgeContact signal that flashed at zone boundaries
(threshold crossing caused rapid oscillation between 0 and 1). Faster drain than recovery means:
- The orb "dims" as it approaches the wall (drain builds gradually as it stays near the edge)
- The orb "brightens" more slowly as it escapes (recovery is gradual, not instant relief)
This asymmetry creates the sensation of wall proximity as a sustained cost rather than a toggle.

**Do not change these rates without device testing.** The visual result (edge pressure deepening,
orb dim intensity) is calibrated to these lerp constants. Equal rates or reversed asymmetry
produce visible flickering at zone boundaries.

---

### Gyroscope input (DeviceMotion) pattern

```typescript
// In SpatialBalance (or any component that needs gyroscope):
const latestTilt = useRef({ pitch: 0, roll: 0 });

useEffect(() => {
  DeviceMotion.setUpdateInterval(33); // ~30Hz
  const sub = DeviceMotion.addListener(({ rotation }) => {
    if (rotation) {
      latestTilt.current = { pitch: rotation.beta ?? 0, roll: rotation.gamma ?? 0 };
    }
  });
  return () => sub.remove();
}, []);
```

- `rotation.beta` = forward/back tilt → maps to Y-axis force
- `rotation.gamma` = left/right tilt → maps to X-axis force
- Use a `ref` not `state` — the physics loop reads it directly; no render needed
- Simulator fallback: subscription fires but `rotation` never arrives → tilt stays `{0, 0}`
- DeviceMotion requires `expo-sensors` — not bundled in Expo Go or old dev-client binaries
- Always call `sub.remove()` in cleanup — listener leaks are silent but accumulate

### Physics interval vs useFrameCallback

If a component needs a physics loop AND a parent component already owns a `useFrameCallback`:
- **Use `setInterval(33)` for the child physics loop**, not a second `useFrameCallback`
- Two `useFrameCallback` instances compete for the same per-frame budget
- Physics at 30Hz is sufficient for gyroscope balance; `setInterval` keeps it off the render thread
- `setInterval` cleanup: `return () => clearInterval(id)` in the `useEffect` return

```typescript
useEffect(() => {
  const id = setInterval(() => {
    // physics tick — reads refs, writes SharedValues directly
    orbX.value = Math.max(-MAX_X, Math.min(MAX_X, orbX.value + velX.current * DT));
  }, 33);
  return () => clearInterval(id);
}, [orbX]); // SharedValues are stable refs — safe in deps
```

### orbOffset coordinate conversion (BattleVisual shader space)

The shader uses `p_base = (uv - 0.5) × (aspect, 1.0)` where `uv = fragCoord / resolution`.
To shift the center by a pixel offset `(px, py)` from screen centre:

```
orbOffset.x = px / height
orbOffset.y = py / height
```

Dividing by `height` is correct because `aspect = width/height` is already applied to the
x-component of `p_base` — the shader's coordinate units are `1.0 = height` in both axes.
On an iPhone 14 (844pt): `orbOffset = [1.0, 0.0]` shifts centre by 844pt to the right.
Typical active-mode range: `±160pt / 844pt ≈ ±0.19` on x-axis.

Conversion in BattleVisual `useDerivedValue` (runs on UI thread):
```typescript
orbOffset: [ox.value / height, oy.value / height],
```

### SpatialBalance ownership model

- `orbX`, `orbY`, `centerBoost` are owned by **BattleScreen** (`useSharedValue`)
- **SpatialBalance writes** them from JS thread (direct `.value =` assignment)
- **BattleVisual reads** them via `useDerivedValue` on UI thread
- BattleScreen is responsible for `cancelAnimation` on all three in its `useEffect` cleanup
- SpatialBalance cleanup: clear `setInterval`, remove `DeviceMotion` subscription, remove `AppState` subscription — no SharedValue cleanup (it does not own them)
- On toggle back to passive: BattleScreen calls direct snap to 0 (not withTiming — race condition with SpatialBalance unmount) for orbX/orbY/centerBoost/edgeContact before `setActiveMode(false)`

---

## Timing Pattern (BattleScreen)

BattleScreen owns all timing. The interval drives milestone scheduling and session-won
detection — it does NOT drive the animation (that's the shared value's job).

```ts
const sessionStartRef = useRef(Date.now());

useEffect(() => {
  const interval = setInterval(() => {
    const elapsedMs = Date.now() - sessionStartRef.current;

    // Update shared value directly — no setState, no re-render
    sessionProgress.value = Math.min(elapsedMs / SESSION_DURATION_MS, 1.0);

    checkRecommitmentSchedule(elapsedMs);

    if (elapsedMs >= SESSION_DURATION_MS) {
      handleSessionWon();
      clearInterval(interval);
    }
  }, 250); // 250ms tick — sufficient for milestone scheduling, lower JS pressure than 100ms
  return () => clearInterval(interval);
}, []);
```

**Tick rate is 250ms, not 100ms.** The animation is driven by `useDerivedValue` on the UI
thread — it does not need the JS interval to tick faster than required for session logic.

**App backgrounded:** On return to foreground, recalculate elapsed and check terminal
conditions first before writing to `sessionProgress.value`. See patterns-animation.md
"Background return resync" for the critical ordering rule: writing `Math.min(elapsed / SESSION_DURATION_MS, 1.0)` unconditionally will set the value to `1.0` when the session has expired, immediately triggering BattleVisual's win animation on the UI thread with no opportunity to correct it from JS. Always check `elapsed >= SESSION_DURATION_MS` and handle that branch before any write to `sessionProgress`.
No timeout-to-gave-in on background return — session continues. GAVE IN requires an explicit user tap.

---

## Stale Closure in setInterval — screenStateRef Pattern

When a `setInterval` callback needs to read current React state, mirror the state to a ref
and read the ref from inside the interval. Direct ref assignment must accompany every
`setScreenState` call to ensure the ref is immediately current — do not rely solely on the
async `useEffect` sync.

```ts
// Sync state → ref (safety net — runs after render)
const screenStateRef = useRef<ScreenState>('initializing');
useEffect(() => {
  screenStateRef.current = screenState;
}, [screenState]);

// In every state transition — set BOTH immediately
setScreenState('recommitting');
screenStateRef.current = 'recommitting'; // ← immediate, no render cycle delay

// Interval reads ref, never state
intervalRef.current = setInterval(() => {
  const state = screenStateRef.current; // ← always current
  if (state === 'running') { ... }
  else if (state === 'recommitting') { ... }
}, 250);
```

The `useEffect` sync is belt-and-suspenders. The direct assignment in each handler is the
primary update. Both together eliminate any possible edge case where a rapid state change
could be missed by the interval before the render cycle completes.

**Same rule applies to any React state read inside a setInterval or AppState callback.**
`activeMode` (the passive/active toggle) is mirrored in `activeModeRef` for the same reason —
`checkMilestoneSchedule` runs inside a `setInterval` closure and must know whether active mode
is on to guard the `centerBoost` milestone spike. Every state value that an interval or
AppState callback must read requires a paired ref.

---

### Haptic feedback: wall-contact-only, velocity-weighted (P2-15)

Haptics fire exactly once per contact: when the orb enters the adhesion zone (`newState === 2`).
No haptic on safe zone or edge zone transitions. Intensity is determined by orb speed at the
moment of adhesion entry — post-friction, pre-clamp velocities.

```ts
function triggerWallHaptic(speed: number) {
  if (speed > 150) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);   // hard slam
  } else if (speed > 60) {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);  // firm contact
  } else {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);   // gentle drift into wall
  }
}

// In physics loop, after zone classification:
if (newState !== orbStateRef.current) {
  orbStateRef.current = newState;
  if (newState === 2 && now - lastHapticAt.current > 500) {
    lastHapticAt.current = now;
    const speed = Math.sqrt(velX.current ** 2 + velY.current ** 2);
    triggerWallHaptic(speed);
  }
}
```

**500ms cooldown:** Prevents buzz storm when orb oscillates at the adhesion boundary.
**Speed thresholds (60/150):** Estimates based on `GRAVITY_SCALE=60`, `DT=0.033`. Require
device validation — a free-fall over ~2.5s approaches 50–60 pt/s, straddling the Medium/Light
boundary. Adjust if gentle tilts overshoot or hard slams undershoot.
**Why wall-only:** Safe zone and edge zone haptics provide no semantically meaningful tactile
event. Only wall contact (the craving pressing in) maps to the product metaphor.

---

## Physics Anti-Patterns

- **Never normalise physics forces with a single shared constant across axes of different screen dimension** — `nx = orbX / CONSTANT` and `ny = orbY / CONSTANT` produces wildly different gravity magnitudes on portrait devices (height ≈ 2× width). Always normalise each axis by its own screen-edge bound: `nx = orbX / MAX_X`, `ny = orbY / MAX_Y`.
- **Never apply two independent floating modifiers to the same geometry value** — one additive with slow decay (centerBoost) + one multiplicative with fast rise (edgeContact shrink) produces history-dependent size inconsistency that varies within a session. Geometry should be stable and predictable; use color/brightness/opacity to communicate state changes, not size.
- **Never mirror the visual craving curve in physics constants** — the craving curve (sessionProgress → amber strength) was designed for the SKSL shader's visual amber expansion. Physics gravity can exceed the maximum counter-force a gyroscope can generate. The visual carries the craving-escalation narrative; physics carries the challenge baseline. Keep them separate: physics constants must be constant or tuned independently of the visual curve.
- **Never hardcode pixel-space bounds without deriving from `Dimensions`** — the shader divides orbX/orbY by screen height for both axes, so the correct clamps are `Dimensions.get('window').width / 2` and `Dimensions.get('window').height / 2`. Any value that must correspond to a screen edge must come from `Dimensions`, read at module scope.
- **Never create `Gesture.Pan()` (or any gesture object) in a component render body without `useMemo`** — each render produces a new gesture object, triggering worklet re-registration in `GestureDetector`. Wrap in `useMemo` with stable dependencies.
- **Never use `useRef(0)` for timestamp refs used in `Date.now()` threshold comparisons** — `useRef(0)` initializes to Unix epoch (0). `Date.now()` returns ~1.7 trillion. The difference is always >> any interval threshold, so the condition fires on the very first tick. Initialize timestamp refs to `Date.now()` inside the `useEffect` that uses them, not at declaration time. Also reset in AppState handler when returning from background — otherwise the elapsed time since last event will be the entire background duration, causing immediate re-fire on resume.

---

## Physics Known Issues & Mistakes

### Gravity sign inverted in initial SpatialBalance implementation
**What happened:** `velX.current += roll * GYRO_SENSITIVITY - gravX`. The maths was centripetal — amber gravity fought displacement back toward centre, making the orb easier to keep centred.
**Fix:** Changed `- gravX/Y` to `+ gravX/Y` in both velocity updates.
**How to avoid:** When writing a force equation, verify the sign by substituting a concrete displacement. `gravX = nx * |nx| * scale` is positive when `nx > 0` — adding it pushes rightward toward the edge the orb is already approaching. Verify the sign matches the intended direction explicitly.

### setInterval + withTiming race: use a pause-flag ref (R-02)
**What happened:** AppState handler called `withTiming(0, { duration: 400 })` to smoothly recentre the orb. The next `setInterval` tick (~33ms later) wrote `orbX.value = number` directly, cancelling the animation.
**Root cause:** Direct `.value = number` assignment cancels any running animation on a SharedValue.
**Fix:** Set a boolean ref before starting `withTiming`, check it as the first line of the interval callback, clear it via `setTimeout` after the animation completes. The `setTimeout` duration must exceed the `withTiming` duration by a small margin (20ms).

### Zone classification must use post-integration position (R-03)
**What happened:** `dist` was computed before velocity integration, so zone classification reflected where the orb was one tick ago.
**Fix:** Compute `newDist` from post-integration `orbX.value`/`orbY.value`. Use pre-integration `dist` only for friction selection:
```ts
const dist = Math.sqrt(orbX.value ** 2 + orbY.value ** 2); // pre — for friction only
// ... apply friction, integrate ...
const newDist = Math.sqrt(orbX.value ** 2 + orbY.value ** 2); // post — for zone + centerBoost
```

### amberStrength escalation produced an unplayable experience (2026-04-09)
**What happened:** `amberStrength` was initially a dynamic value driven by the craving curve (0.3 → 1.0 at peak). On device, even at 0.5 for the first minute, the pull was strong enough to make holding the orb near centre impossible.
**Fix:** `const amberStrength = 0.3` — a constant. The shader carries the craving escalation narrative visually.
**Lesson:** Never mirror the visual craving curve in physics constants. Visual and physics are separate systems.

### Shared normalisation constant caused asymmetric gravity across axes (2026-04-09)
**What happened:** Both `nx` and `ny` were normalised by `EDGE_ZONE_RADIUS=180`. On device (852pt tall), the orb was dramatically stickier at top/bottom than at left/right.
**Fix:** `nx = orbX.value / MAX_X`, `ny = orbY.value / MAX_Y` — each axis normalised by its own screen-edge bound.

### edgeContact shrinking baseRadius caused wall adherence inconsistency (2026-04-09)
**What happened:** `baseRadius *= (1.0 - edgeContact * 0.20)` + `centerBoost * 0.05` produced history-dependent visible inconsistency — orb appeared different sizes at the wall depending on prior state.
**Fix:** Removed `baseRadius *= (1.0 - edgeContact * 0.20)` entirely. edgeContact only drives `centerLight *= (1.0 - edgeContact * 0.60)` — the orb dims but does not change size.

### Hardcoded MAX_X/MAX_Y produced asymmetric edge behaviour (2026-04-09)
**What happened:** `MAX_X = 160`, `MAX_Y = 300` hardcoded. Orb could exceed the right/left screen edge while not reaching the bottom edge consistently.
**Fix:**
```ts
const { width: _SCREEN_W, height: _SCREEN_H } = Dimensions.get('window');
const MAX_X = _SCREEN_W / 2;
const MAX_Y = _SCREEN_H / 2;
```

### Wind gust — immediate snap to full amplitude (single-phase decay) (P2-11, 2026-04-14)
**What happened:** First implementation used a single scalar `windDecay` set to `1.0` on gust fire. The gust began at full force with no ramp — onset was perceived as mechanical and sudden.
**Fix:** Replaced with a two-phase attack/decay envelope (`windPhase: 'idle' | 'attack' | 'decay'`). Attack ramps envelope from 0 → 1 at `WIND_ATTACK_RATE` per tick. Onset and offset are now imperceptible as discrete events.

### Wind gust — envelope reset to 0 on gust fire causes sudden magnitude drop (P2-11, 2026-04-14)
**What happened:** When a new gust fired while a previous gust was still decaying, resetting `windEnvelope = 0` caused force to drop to zero before the new attack ramp reached the previous level — perceived as a "sudden stop" then restart.
**Fix:** Removed the `windEnvelope = 0` reset on gust fire. Direction changes immediately; envelope carries its current value into the new attack phase. Magnitude transitions smoothly.

### useRef(0) for timestamp refs used in Date.now() comparisons (P2-11, 2026-04-14)
**What happened:** `lastGustAt = useRef(0)` initialized to Unix epoch. `now - lastGustAt.current` is always >> any interval threshold on first tick — gust fired immediately at mount.
**Fix:** Initialize timestamp refs to `Date.now()` inside the `useEffect` body, not at `useRef` declaration time. Also reset in AppState handler on background return.

### AppState handler `setTimeout` not stored in ref — fires on unmounted component (2026-04-17)
**What happened:** `setTimeout(() => { recentringRef.current = false; }, 420)` in the AppState handler was called without storing the return ID. If SpatialBalance unmounts during the 420ms recentring window (e.g. user taps PASSIVE mid-animation), the callback fires after unmount — only sets a plain ref so harmless in this case, but structurally wrong.
**Fix:** `recentringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)`. Store ID: `recentringTimeoutRef.current = setTimeout(...)`. Cancel in cleanup: `clearTimeout(recentringTimeoutRef.current)` alongside `sub.remove()` in the AppState `useEffect` return.
**Rule:** Any `setTimeout` whose callback touches component state (including plain refs) must store its ID in a `useRef` and cancel on unmount. Harmlessness in a specific case is not a reason to omit cleanup.

### EDGE_ZONE_RADIUS dead constant (Session 27, 2026-04-18)
**What happened:** `const EDGE_ZONE_RADIUS = 180` was defined and commented as "amber gravity reference distance" but used nowhere in the physics code. After the axis-normalisation fix, gravity changed from `nx = orbX / EDGE_ZONE_RADIUS` to `nx = orbX / MAX_X` — the constant became dead code. A future developer tuning physics constants would naturally try changing it and observe no effect.
**Fix:** Constant removed entirely.
**Rule:** Do not leave named physics constants in scope if they are not referenced in the loop body. Dead tuning constants are more dangerous than missing ones — they imply effect that no longer exists.

### Missed milestones fire in rapid succession on background return (2026-04-24)
**What happened:** When the app returned from background with < 20 min elapsed,
`startInterval()` restarted the 250ms tick loop without fast-forwarding `milestoneIndexRef`.
`checkMilestoneSchedule(elapsed)` increments the index by one per call — if 3 milestones
had elapsed while backgrounded, three coach lines fired in three consecutive 250ms ticks
(750ms total), visibly stacking in the coach pill with stale scheduled messages.
**Fix:** Before `startInterval()` in the AppState `'active'` handler, walk the milestone
schedule and fast-forward `milestoneIndexRef.current` past all already-elapsed entries.
Sync `passedCount.value` directly (no animation — dots should light immediately to reflect
actual elapsed state). Fire at most one orientation coach line for the most recently crossed
milestone (no pulse/shockwave — this is a location cue on resume, not a live milestone event).
```ts
const schedule = computedScheduleRef.current;
let idx = milestoneIndexRef.current;
let lastCrossedIdx = -1;
while (idx < schedule.length && elapsed >= schedule[idx]) {
  lastCrossedIdx = idx;
  idx++;
}
if (idx > milestoneIndexRef.current) {
  milestoneIndexRef.current = idx;
  passedCount.value = idx; // direct write — no animation
  if (lastCrossedIdx >= 0) {
    setCoachLine(getRecommitmentMessage(MILESTONE_SCHEDULE[lastCrossedIdx].minute));
    setCoachKey((k) => k + 1);
  }
}
startInterval();
```
**Rule:** Any interval with milestone-index side-effects must fast-forward its index to
the current elapsed position before restarting after any pause (background, AppState change).
Surface only the *most recent* missed milestone — retroactively firing all missed ones
provides no orientation value and floods the UI.

### Wind gust system — HI gravity mode (P2-11)

Active only when `gravityHigh === true`. Adds a randomised directional force that eliminates
the neutral equilibrium at screen centre, making HI mode continuously challenging.

**Two-phase envelope:** Each gust has an attack phase (envelope 0→1) then a decay phase (1→0).
Direction changes on each new gust; magnitude transitions smoothly from the current envelope
value — no abrupt reset mid-gust.

```ts
// In SpatialBalance setInterval tick (gravityHigh only):
const now = Date.now();
if (windPhase === 'attack') {
  windEnvelope.current = Math.min(1, windEnvelope.current + WIND_ATTACK_RATE);
  if (windEnvelope.current >= 1) windPhase.current = 'decay';
} else {
  windEnvelope.current *= windDecayRate.current; // per-gust random rate
  if (windEnvelope.current < 0.01 && now - lastGustAt.current > WIND_GUST_INTERVAL_MIN_MS) {
    // fire new gust: pick random direction, set new decay rate
  }
}
```

**Device-validated constants (2026-04-14):**

| Constant | Value | Notes |
|----------|-------|-------|
| `WIND_GUST_INTERVAL_MIN_MS` | 4000 | Minimum quiet time between gusts |
| `WIND_GUST_INTERVAL_MAX_MS` | 9000 | Maximum quiet time — keeps gusts arrhythmic |
| `WIND_GUST_STRENGTH` | 0.3 | ~18 pt/s² peak force — perceptible but surmountable by a small tilt |
| `WIND_ATTACK_RATE` | 0.008 | 0→1 in ~125 ticks (~4s gradual onset) |
| `WIND_DECAY_RATE_MIN` | 0.990 | Slowest decay: ~10s fade |
| `WIND_DECAY_RATE_MAX` | 0.995 | Fastest decay: ~20s fade |

**AppState resume rule:** Reset `windEnvelope`, `windPhase`, and `lastGustAt` on
`AppState 'active'` return — the same handler that resets `recentringRef`. A gust in
progress when the app was backgrounded would otherwise resume mid-envelope on return,
firing immediately at high magnitude. `lastGustAt.current = Date.now()` prevents an
immediate new gust during the recentring window.

**LO gravity:** Entire gust block is gated on `gravityHigh`. LO mode has no wind.

---

### `edgeContact` not reset during AppState recentring window (2026-04-17)
**What happened:** On app resume, `orbX`/`orbY` snapped to 0 via `withTiming` and the physics loop paused via `recentringRef`. `edgeContact` was not reset — it retained its backgrounded value. Edge pressure deepening and orb dim (both driven by `edgeContact`) persisted visually during the 420ms window instead of clearing with the orb position.
**Fix:** `edgeContact.value = 0` added to the AppState `'active'` handler block alongside the existing wind state resets. `edgeContact` added to the AppState `useEffect` dependency array.
**Rule:** When pausing the physics loop on AppState resume, explicitly zero every SharedValue that drives visual output — do not rely on the physics loop resuming to lerp them back. orbX/orbY snap immediately via `withTiming`; SharedValues without an explicit reset retain stale visual state for the full recentring window.
