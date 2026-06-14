# Holdout — Animation & Shader Patterns

## Skia Shader Pattern (BattleVisual)

### Create RuntimeEffect at module scope

```ts
// Correct — created once when the module loads
const runtimeEffect = Skia.RuntimeEffect.Make(SHADER_SRC)!;

// Wrong — recreated on every render, drops frames
function BattleVisual() {
  const runtimeEffect = Skia.RuntimeEffect.Make(SHADER_SRC); // ← never do this
}
```

### Pass Reanimated shared values to Skia via useDerivedValue

Skia's `<Shader uniforms={...} />` accepts a `useDerivedValue` that returns a plain object.
This runs on the UI thread — zero JS bridge overhead, zero re-renders.

```ts
import { useDerivedValue } from 'react-native-reanimated';

const uniforms = useDerivedValue(() => ({
  resolution: [width, height],    // plain array, not a SharedValue
  time: time.value,               // reads SharedValue on UI thread
  progress: sessionProgress.value,
}));

// In JSX:
<Canvas style={StyleSheet.absoluteFill}>
  <Fill>
    <Shader source={runtimeEffect} uniforms={uniforms} />
  </Fill>
</Canvas>
```

### Time uniform — use useFrameCallback throttled to 30fps, session-relative

```ts
// Correct — throttled frame callback drives time at ~30fps regardless of display refresh rate.
// Session-relative: starts at 0 each session, grows to ~400 over 20 min (20*60*1000/3000).
// _frameTimeStart records the first frame's timestamp; all subsequent frames subtract it so
// time never wraps mid-session regardless of device uptime.
// _frameTimeStart is a SharedValue (not a ref) — useFrameCallback runs as a worklet on the
// UI thread and cannot access React refs (JS thread objects).
const time = useSharedValue(0);
const _lastFrameTs = useSharedValue(0);
const _frameTimeStart = useSharedValue(0);
useFrameCallback((frameInfo) => {
  'worklet';
  if (frameInfo.timestamp - _lastFrameTs.value < 33) return; // ~30fps gate
  _lastFrameTs.value = frameInfo.timestamp;
  if (_frameTimeStart.value === 0) {
    _frameTimeStart.value = frameInfo.timestamp; // sentinel: 0 is impossible as a real timestamp
  }
  time.value = (frameInfo.timestamp - _frameTimeStart.value) / 3000;
});

// Wrong — withRepeat drives the shader at full display refresh rate (60fps or 120fps ProMotion).
// On a complex SKSL shader, sustained full-rate execution causes device warmth after ~8 minutes.
time.value = withRepeat(
  withTiming(1000, { duration: 3_000_000, easing: Easing.linear }),
  -1, false
);
```

`useFrameCallback` fires on every display frame but the 33ms gate ensures `time.value` is only
written when ≥33ms have elapsed — capping shader submits to ~30fps on any device.
The `pulse` SharedValue (shockwave) is driven by its own `withTiming` — unaffected by this throttle.
`cancelAnimation(time)` is NOT needed in cleanup — `time` is written directly, not animated.
`_frameTimeStart` is also not animated — no `cancelAnimation` needed.

### Per-session seed uniform — visual variety across sessions

BattleVisual receives a `seed` uniform (`uniform float seed`) that shifts the fbm noise origin,
giving each session a visually distinct starting state without changing any other shader behavior.

```ts
// BattleScreen — set once when the session starts, never changed during the session
const seed = useSharedValue(Math.random());
// passed to BattleVisual as a prop; forwarded directly to the shader uniform
```

`Math.random()` produces a value in `[0, 1)`. The shader uses it to offset the noise coordinate
before the fbm call — two sessions with different seeds look like different "slices" of the same
infinite noise field. Without the seed, every session begins with an identical visual state,
making the shader feel procedurally repetitive across sessions.

The seed is set at session start and never mutated — it is not a frame-by-frame uniform.

### makeMutable — imperative SharedValue creation for dynamic lists

Use `makeMutable` when SharedValues must be created outside of component initialization (e.g. in a `setInterval` callback, event handler, or loop):

```ts
import { makeMutable, cancelAnimation } from 'react-native-reanimated';

// In an interval callback or regular function — safe
const sharedX = makeMutable(initialX);
const sharedY = makeMutable(initialY);

// Animate exactly like a useSharedValue
sharedX.value = withTiming(targetX, { duration: 2000, easing: Easing.out(Easing.quad) });

// Cancel in cleanup — identical to useSharedValue cleanup
cancelAnimation(sharedX);
```

`makeMutable` produces an identical SharedValue to `useSharedValue`. Cleanup rules are the same: the component that created it is the owner and must cancel it on unmount — in both per-item removal and the component's unmount `useEffect` return.

### Sub-component extraction for hook compliance in dynamic lists

When rendering a list of items that each need `useAnimatedStyle` or `Gesture.Pan()`, extract each item into its own named component. Calling hooks inside `Array.map()` or a render callback violates the rules of hooks:

```ts
// Wrong — hooks inside map callback
{balls.map((ball) => {
  const style = useAnimatedStyle(() => ...); // ← rules of hooks violation
  return <Animated.View style={style} />;
})}

// Correct — extract to BallItem component
function BallItem({ ball }: { ball: Ball }) {
  const style = useAnimatedStyle(() => ...); // ← called at component level ✓
  const pan = Gesture.Pan()...;
  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={style} />
    </GestureDetector>
  );
}

{balls.map((ball) => <BallItem key={ball.id} ball={ball} />)}
```

---

### Pulse as shader uniform (current approach)

The `pulse` SharedValue is passed directly to the shader as a uniform. The shader implements a
Gaussian ring that expands outward as `pulse` travels from 0 to 1.3 — a shockwave effect at each
coach milestone (minutes 4/8/12/16) and on SUPPORT ME tap.

```ts
// In BattleVisual — triggered by pulseCount prop change
useEffect(() => {
  if (pulseCount > 0) {
    pulse.value = 0;
    pulse.value = withTiming(1.3, { duration: 1100, easing: Easing.out(Easing.quad) });
  }
}, [pulseCount]);

// In useDerivedValue — uniform passed to shader each frame
const uniforms = useDerivedValue(() => ({
  ...
  pulse: pulse.value,
}));
```

The shader reads `pulse` to compute shockwave displacement:
```glsl
if (pulse > 0.001) {
  float wave = dist_raw - pulse;
  float shock = exp(-abs(wave) * 18.0) * 0.12;
  p += (p_base / max(dist_raw, 0.001)) * shock;
}
```

Both constants are imported and used by BattleVisual. They were renamed from `RECOMMITMENT_PULSE_*` to `MILESTONE_PULSE_*` (2026-04-04) to reflect the mechanic name change — milestones, not recommitments.

---

## Animation Pattern (BattleVisual)

**BattleVisual receives `sessionProgress` as a Reanimated `SharedValue<number>`, not a plain prop.**

All timing logic lives in BattleScreen. BattleVisual is a pure visual component with no timers.

### Why SharedValue, not React state

The naive approach — passing `progress` as React state and reacting in `useEffect` — has two
fatal problems for a 20-minute continuous animation:

1. `setProgress` every 100ms causes 10 JS re-renders/second on BattleScreen and BattleVisual.
   On iPhone XR under load, JS thread contention with Reanimated threatens 60fps.
2. `withTiming` inside `useEffect([progress])` restarts a 3-second animation every 100ms.
   Each call cancels the previous one — the gradient visibly stutters rather than flowing.

The correct architecture keeps the animation entirely on the UI thread via `useDerivedValue`.

### Approved pattern

```ts
// BattleScreen — creates the shared value, owns the timer, passes it down
const sessionProgress = useSharedValue(0); // 0.0 → 1.0 over 20 minutes

// BattleVisual — derives radii from the shared value, no re-renders
const amberRadius = useDerivedValue(() =>
  interpolate(sessionProgress.value, [0, 1], [0.85, 0])
);
const centerRadius = useDerivedValue(() =>
  interpolate(sessionProgress.value, [0, 1], [0.15, 1.0])
);
const animatedStyle = useAnimatedStyle(() => ({
  // use amberRadius.value / centerRadius.value here
}));
```

`useDerivedValue` runs on the UI thread. No JS re-renders for gradient position changes.
No `withTiming` needed for continuous progress — the derivation IS the animation.

### withTiming is reserved for one-shot state transitions only

`sessionProgress` reaches 1.0 naturally via the interval — `withTiming` is NOT used to
drive it there. The win and gave-in sequences use separate shared values for their
visual effects.

**Win sequence** — `sessionProgress` is already at 1.0. Drive the visual via a separate
`winOpacity` shared value in BattleVisual:

```ts
// In BattleScreen — fires once when session reaches 20 min
// sessionProgress is already at 1.0; trigger the win overlay via a prop/callback
// In BattleVisual
const winOpacity = useSharedValue(0);
// Step 1: hold clear state (sessionProgress already 1.0) — WIN_HOLD_CLEAR_MS, no animation needed
// Step 2: fade white overlay in
winOpacity.value = withTiming(1, { duration: WIN_FADE_WHITE_MS });
// Step 3: hold white — WIN_HOLD_WHITE_MS
// Step 4: fade back — WIN_FADE_BACK_MS
// Use withDelay or sequential callbacks to chain steps 3 and 4
```

**Gave-in drain** — animate `sessionProgress` backward so amber re-advances:

```ts
// Fires once when isActive becomes false mid-session
sessionProgress.value = withTiming(0, { duration: GAVE_IN_DRAIN_MS });
```

Never use `withTiming` for continuous progress tracking. Never use `withSpring` for any
battle gradient — the visual must feel like slow organic pressure, not bounce.

### Background return resync — check terminal condition BEFORE writing sessionProgress

When the app returns from background, the elapsed time is recalculated. **Check terminal
conditions first — never write a value that crosses >= 1.0 before entering a terminal state.**

BattleVisual's `useAnimatedReaction` watching `sessionProgress.value >= 1.0` fires the win
animation the instant that condition becomes true on the UI thread. There is no window to
write a correction from JS — the reaction is already in flight.

```ts
// WRONG — when elapsed >= SESSION_DURATION_MS, Math.min returns 1.0,
// triggering the win animation before JS can correct it.
sessionProgress.value = Math.min(elapsed / SESSION_DURATION_MS, 1.0);
if (elapsed >= SESSION_DURATION_MS) {
  sessionProgress.value = 0.999; // ← too late; reaction already fired on UI thread
  setScreenState('resumePrompt');
  return;
}

// CORRECT — terminal check first; 0.999 is below threshold; win does NOT fire.
if (elapsed >= SESSION_DURATION_MS) {
  sessionProgress.value = 0.999;
  setScreenState('resumePrompt');
  screenStateRef.current = 'resumePrompt';
  return;
}
sessionProgress.value = elapsed / SESSION_DURATION_MS; // only written when < SESSION_DURATION_MS
```

With the terminal check first, the `Math.min(..., 1.0)` clamp is redundant on the normal
path — the elapsed value is already confirmed to be less than `SESSION_DURATION_MS`.

**Rule:** Any code path that writes `sessionProgress.value` must check whether the value
would cross `>= 1.0` and handle that branch *before* writing.

### cancelAnimation on unmount

Call `cancelAnimation(sessionProgress)` in **BattleScreen's** `useEffect` cleanup —
not in BattleVisual. BattleScreen owns `sessionProgress`; it must cancel it.
BattleVisual does not own the shared value and must not cancel it.

```ts
// BattleScreen useEffect cleanup
return () => {
  clearInterval(interval);
  cancelAnimation(sessionProgress);
};
```

### BattleScreen must wrap onWinAnimationComplete in useCallback

`onWinAnimationComplete` is the callback BattleVisual calls after the 5-second win overlay
sequence completes. BattleVisual captures it in a `useAnimatedReaction` worklet.

**Required: BattleScreen must wrap `onWinAnimationComplete` in `useCallback` with a stable
(empty or unchanging) dependency array.** Never pass an inline function.

```ts
// Correct
const handleWinComplete = useCallback(() => {
  navigation.navigate('Home');
}, []); // empty deps — navigation ref is stable

// Wrong — new function reference on every re-render
<BattleVisual onWinAnimationComplete={() => navigation.navigate('Home')} />
```

**Why this matters:** BattleScreen calls `setState` during the win sequence (e.g. updating
session state on win). Each `setState` causes a re-render. Each re-render produces a new
function reference if the callback is inline or `useCallback` has changing deps. Each new
reference triggers `useAnimatedReaction` to re-register its worklet — which can interrupt
the `winOpacity` `withSequence` mid-flight, stalling or resetting the win animation.

This bug is invisible in TestScreen (no re-renders during win). It will only surface in
BattleScreen when real state changes happen during the win sequence.

**Also required:** unmount BattleVisual immediately after `onWinAnimationComplete` fires.
Do not allow any subsequent `sessionProgress` updates after the win callback. The win
sequence guard (`previous < 1.0`) prevents re-firing in normal use, but BattleScreen
must not animate `sessionProgress` backward after win is confirmed.

---

### useAnimatedReaction — always include a dependency array

Always pass a dependency array as the third argument to `useAnimatedReaction`. Without it,
Reanimated re-registers the reaction on every component re-render, rebuilding the worklet
closure with whatever JS values were captured at that render. This is safe in Reanimated 4.x
(old subscriptions are cleaned up), but the worklet will silently capture a stale reference
to any JS callback passed in — particularly `onWinAnimationComplete`.

```ts
// Correct
useAnimatedReaction(
  () => sessionProgress.value,
  (current, previous) => { ... },
  [onWinAnimationComplete]  // ← always include
);

// Wrong — reaction rebuilds on every render, worklet may capture stale callbacks
useAnimatedReaction(
  () => sessionProgress.value,
  (current, previous) => { ... }
);
```

If the worklet captures no JS-side variables (pure UI-thread math only), use `[]`.

### Win sequence chaining — approved pattern

The 4-phase win sequence (hold → fade in → hold → fade out) uses `withSequence` +
`withDelay`. Each `withDelay` makes the sequence pause before starting the next animation.
This is the approved approach — do not use `setTimeout` or nested `useEffect` for sequencing.

```ts
winOpacity.value = withSequence(
  withDelay(WIN_HOLD_CLEAR_MS, withTiming(1, { duration: WIN_FADE_WHITE_MS })),
  withDelay(WIN_HOLD_WHITE_MS,
    withTiming(0, { duration: WIN_FADE_BACK_MS }, (finished) => {
      if (finished && onWinAnimationComplete) {
        runOnJS(onWinAnimationComplete)();
      }
    })
  )
);
```

Total duration = WIN_HOLD_CLEAR_MS + WIN_FADE_WHITE_MS + WIN_HOLD_WHITE_MS + WIN_FADE_BACK_MS = 5000ms.

### SharedValues are intentionally excluded from useEffect and useCallback deps

`useSharedValue` returns a stable object reference for the lifetime of the component.
React's exhaustive-deps lint rule flags SharedValues as missing deps. This warning is safe
to suppress — adding SharedValues to deps arrays adds no correctness value.

```ts
// Correct — pulseScale is a SharedValue, stable ref, intentionally omitted
useEffect(() => {
  pulseScale.value = withSequence(...);
}, [pulseCount]); // eslint-disable-line react-hooks/exhaustive-deps
```

### Triggering one-shot animations from a parent — use an incrementing counter, not a boolean

When a parent (BattleScreen) needs to trigger a single animation in a child (BattleVisual),
pass an incrementing `number` prop rather than a `boolean` flag. A boolean cannot distinguish
"trigger again" from "already triggered" if it was already true.

```ts
// Correct — each coach milestone or SUPPORT ME tap increments pulseCount; BattleVisual useEffect fires once per increment
const [pulseCount, setPulseCount] = useState(0);
// On coach milestone or SUPPORT ME:
setPulseCount(n => n + 1);

// Wrong — second trigger won't retrigger if pulseActive is already true
const [pulseActive, setPulseActive] = useState(false);
```

---

### Animated.View wrapping TouchableOpacity (button glow pattern)

When a button needs animated `shadow*` glow effects, wrap `TouchableOpacity` inside `Animated.View`:

```ts
// Correct — Animated.View receives the glow style; TouchableOpacity fills it
<Animated.View style={[styles.iconButton, glowStyle]}>
  <TouchableOpacity style={styles.iconButtonInner} onPress={handler}>
    <Icon ... />
  </TouchableOpacity>
</Animated.View>

iconButtonInner: {
  width: '100%',
  height: '100%',
  justifyContent: 'center',
  alignItems: 'center',
},

// Wrong — TouchableOpacity cannot accept useAnimatedStyle directly
<TouchableOpacity style={[styles.button, useAnimatedStyle(...)]} />
```

`TouchableOpacity` does not accept Reanimated animated styles for shadow props. The `Animated.View` wrapper receives the shadow animation; the inner `TouchableOpacity` with `iconButtonInner` preserves the full touch target.

### useAnimatedReaction for one-shot threshold events (isLit && !wasLit guard)

For milestone dot pop animations — detect the crossing, fire once, guard with `isLit && !wasLit`:

```ts
useAnimatedReaction(
  () => passedCount.value >= 1,
  (isLit, wasLit) => {
    if (isLit && !wasLit) {
      dotScale.value = withSequence(
        withTiming(1.8, { duration: 100 }),
        withTiming(1.0, { duration: 300 }),
      );
    }
  },
);
```

The `isLit && !wasLit` guard fires exactly once — on the rising edge of the condition. Without it, the worklet fires on every evaluation of the reactive expression (i.e., every time any SharedValue it reads changes), which can re-trigger the animation repeatedly.

### passedCount SharedValue pattern (syncing JS events to UI thread animations)

When a JS-side interval event must trigger both JS state updates and UI-thread animations simultaneously, use a SharedValue as the bridge:

```ts
// In checkMilestoneSchedule (JS interval) — all three trigger from one event
passedCount.value = milestoneIndexRef.current;  // UI thread reads instantly
setCoachLine(getRecommitmentMessage(minuteMark)); // JS state
setPulseCount((n) => n + 1);                     // JS state

// On UI thread — useAnimatedReaction reads passedCount with zero latency
// Dot pop, glow, and shader pulse all fire in the same frame as the JS event
```

Do NOT drive discrete event animations from `sessionProgress` thresholds — `sessionProgress` updates every 250ms on a JS interval and will desync from JS-side event handling by up to 250ms + any variance offset.

---

## Session Milestone Pattern

Milestone schedule (from `src/constants/timing.ts`):
```
Minute 4  (varianceSec: 0 — exact minute mark)
Minute 8  (varianceSec: 0)
Minute 12 (varianceSec: 0)
Minute 16 (varianceSec: 0)
```

**Field name:** The schedule entries use `varianceSec` (not `variance`). When BattleScreen
reads the schedule, use `schedule.varianceSec`. Variance was removed (set to 0) because
non-zero variance caused visible misalignment — the progress bar fill could be 2%+ past a
milestone dot before the dot lit. Exact minute marks keep fill and dots in sync. See
timing.ts comment for full rationale.

Pattern (silent — no overlay, no forced interaction):
```
1. Timer reaches scheduled minute mark exactly
2. passedCount.value incremented — UI thread dot lights up and pops in sync
3. Coach calibration line fires (fade in → auto-fade after 7s)
4. BattleVisual shockwave pulse fires (pulseCount incremented)
5. recordMilestone() called (fire-and-forget — logs to milestonesReached on session record)
6. Session continues — no state change, no prompt, no timeout
```

**On-demand coach (SUPPORT ME button — shield icon, bottom-left):**
- Calls `CoachService.getCoachMessageForElapsed(elapsed)` — returns from `supportMe.early/mid/late` pool
- `supportMe` pool never references a specific minute number — always accurate whenever tapped
- Phase boundary: early (<8 min), mid (8–13 min), late (≥13 min)
- Same coach line fade + shockwave pulse + amber glow flash on button
- Can be tapped at any point during `running` state

**GAVE IN button (X icon, bottom-right, two-stage):**
- First tap: "Gave in?" label appears above button, border + icon turn amber, slow amber breathe loop starts
- Second tap within 3s: triggers `handleGaveIn()` — drain animation, abandonSession, breathe stops
- 3s auto-reset: label disappears, glow fades, button returns to grey
- Prevents accidental session end without requiring the user to read text

---

## Animation Known Issues & Mistakes

### sessionProgress written to 1.0 before terminal state check (2026-04-20)
**What happened:** AppState `'active'` handler wrote `sessionProgress.value = Math.min(elapsed / SESSION_DURATION_MS, 1.0)` unconditionally before checking `if (elapsed >= SESSION_DURATION_MS)`. When `elapsed >= SESSION_DURATION_MS`, `Math.min` returns `1.0`. BattleVisual's `useAnimatedReaction` fires the win animation the instant `sessionProgress.value >= 1.0` on the UI thread — the subsequent `sessionProgress.value = 0.999` correction one line later was always too late.
**Fix:** Restructured the handler to check the terminal condition first, set `0.999` (below the reaction threshold), enter `resumePrompt` state, and `return` before the unconditional progress write.
**Rule:** Never write to a SharedValue that feeds a `useAnimatedReaction` threshold without first checking whether the write would cross that threshold. The UI thread executes the reaction synchronously on the same frame — there is no JS-thread opportunity to intervene between the write and the reaction firing.

---

## Animation Anti-Patterns

- **Never put timing logic in BattleVisual** — BattleVisual receives `progress` prop only. All timers live in BattleScreen.
- **Never call services from BattleVisual** — it's a pure visual component.
- **Never use `withSpring` for the main amber/center gradient animation** — the battle must feel like slow, organic pressure, not bouncy spring physics.
- **Never key a coach animation effect on the text string itself** — use a dedicated `coachKey` counter incremented on every coach fire. If the same message fires twice in a row, the text string doesn't change and `useEffect([coachLine])` won't re-run. Always: `setCoachLine(msg); setCoachKey(k => k + 1)` and key the animation effect on `coachKey`.
- **Never call `setCoachLine()` without immediately calling `setCoachKey((k) => k + 1)`** — the coach opacity animation is keyed on `coachKey`, not the text string. Without the key increment, the `useEffect([coachKey])` never re-runs and the message renders invisibly. Every call site must pair both setters.
- **Never use `withRepeat/withTiming` to drive a time uniform on a complex SKSL shader** — it runs at full display refresh rate (60fps or 120fps on ProMotion), saturating the GPU and causing device warmth after ~8 minutes of sustained use. Use `useFrameCallback` with a 33ms gate to cap updates at 30fps.
- **Never increase FBM octave count beyond 4 on mobile** — octave 5 contributes 3.125% of signal amplitude and is sub-pixel at mobile resolution. Each additional octave adds cost proportional to total fbm call count × screen resolution × frame rate.
- **Never call `useAnimatedStyle` (or any hook) inside JSX expressions** — always extract to a named variable at the top of the component.
- **Never use `'transparent'` as a terminal gradient stop for colored gradients** — interpolation through rgba(0,0,0,0) creates a dark fringe at the edge. Use the source color at zero alpha (e.g. `'rgba(245, 166, 35, 0)'` for amber fading out).
- **Never use `% N` modulo on `frameInfo.timestamp` for a shader time uniform** — creates a hard discontinuity at the wrap boundary. Use session-relative time instead: subtract the first-frame timestamp (`_frameTimeStart` SharedValue) from all subsequent frames.
- **Never create `Skia.RuntimeEffect.Make()` inside a component** — place it at module scope. RuntimeEffect compilation is GPU-side and expensive; running it on render drops frames.
- **Never open the BattleVisual in Expo Go** — `@shopify/react-native-skia` is not bundled in Expo Go. Use the installed expo-dev-client app instead.
- **Never use `normalize(p)` for FBM sample offsets in fragment shaders** — creates star/spike artifacts radiating from center.
- **Never use `time * constant` as an FBM coordinate offset** — linear accumulation reaches unbounded values. Use `sin/cos` oscillation instead. (Exception: slow unbounded drift in `slowTime` / `cWarp` is intentional in BattleVisual — documented in the shader.)
- **Never apply additive color accents before multiplicative brightness passes** — the multiply chain wipes out the additive contribution. Apply all `+= accent` terms after the final `*= brightness`.
- **Never pass a plain boolean (or plain JS value) into a `useDerivedValue` worklet for a mode switch** — plain values are snapshotted at worklet-registration time, not tracked reactively. Use `SharedValue<number>` so `useDerivedValue` tracks it via `.value` reads with zero-frame lag.
- **Never drive discrete event animations from `sessionProgress` thresholds** — use a dedicated SharedValue set from the event source (e.g., `passedCount`).
- **Never leave a heavy GPU component mounted in a terminal state where it's invisible** — if a native Skia Canvas is covered by an opaque overlay, unmount it. `showVisual` gate: `screenState !== 'initializing' && screenState !== 'gaveInComplete'`.
- **Never gate corona/halo alpha purely on the glow uniform** — always give the corona a base alpha independent of glow: `corona * (0.14 + 0.50 * glow)` not `corona * glow * 0.45`.
- **Never mix toward a dark/soot color at the outer haze boundary of a glow orb** — soot darkening belongs only in the solid interior.
- **Never implement a comet/trail effect using a rotated LinearGradient rectangle** — trail/particle effects require per-pixel alpha falloff via a Skia Canvas shader.
- **Never use `useSharedValue` inside a regular function, loop, or interval callback** — use `makeMutable` for imperative SharedValue creation.
- **Never assume a worklet mutation to a plain JS object property is visible on the JS thread** — use a `SharedValue<boolean>` if cross-thread state is needed.
- **Never call `setTheme` (or any state BattleVisual reads on first mount) before the last `await` in `init()`** — always batch all mount-time state into one synchronous block after all awaits complete.
- **Never declare SKSL local variables in an if/else theme branch that are not consumed within that branch** — SKSL's optimizer silently eliminates unused locals so the shader compiles and runs correctly, but the declaration implies intent (a phase value that should gate some color calculation) that isn't there. Either remove it or wire it into the calculation.

---

## Animation Mistakes & Fixes

**[2026-03-28] `useAnimatedReaction` without deps array — stale worklet closure**
Omitting the third argument causes the worklet to be re-registered on every render. In Reanimated 4.x, the old subscription IS cleaned up, but any JS callback captured in the worklet closure may be stale.
Fix: always pass `[onWinAnimationComplete]` (or `[]` for pure UI-thread worklets) as third argument.
Status: FIXED in BattleVisual.tsx.

**[2026-03-28] LinearGradient `'transparent'` stop causes dark fringe at amber edge**
Fix: use the amber color at zero alpha as the final stop: `'rgba(245, 166, 35, 0)'`
Status: FIXED — applied to all 4 amber panels in BattleVisual.tsx (2026-03-28).

**[2026-03-28] normalize(p) in FBM coordinates → star/spike artifacts**
Fix: remove `normalize(p)` entirely. Use domain warping. Use `sin/cos` oscillation for time offsets.
Status: FIXED in BattleVisual.tsx (2026-03-28).

**[2026-03-28] Cascading multiplicative brightness passes crush color to near-black**
Fix: combine into a single brightness pass with a floor high enough that color survives at minimum. Apply additive accents after all multiplications.
Status: FIXED in BattleVisual.tsx (2026-03-28).

**[2026-03-28] withRepeat without reverse:true causes visible time reset every 5 minutes**
Fix: `withRepeat(withTiming(300, { duration: 300_000 }), -1, true)` — reverse makes the animation ping-pong.
Status: FIXED in BattleVisual.tsx (2026-03-28).

**[2026-03-30] Not all owned SharedValues cancelled on unmount**
Rule: every `useSharedValue` created in a component must have a corresponding `cancelAnimation(value)` in the owning `useEffect` cleanup — not just the primary animation value.
Status: FIXED in BattleScreen.tsx (2026-03-30).

**[2026-04-04] Start coach message invisible — `coachKey` not incremented in `init()`**
`init()` called `setCoachLine(getStartMessage())` but not `setCoachKey((k) => k + 1)`. The start message was in the DOM but fully transparent every session.
Fix: always pair `setCoachLine()` with `setCoachKey((k) => k + 1)`.
Status: FIXED.

**[2026-04-04] Milestone dot animations desynced from coach lines — wrong trigger source**
Dots were driven by `sessionProgress.value >= 0.2/0.4/0.6/0.8` on the UI thread, independent of milestone schedule.
Fix: `passedCount` SharedValue set from `checkMilestoneSchedule`. All three effects derive from one event source.
Status: FIXED.

**[2026-04-04] Coach animation didn't replay when same message text set twice**
Fix: added `coachKey` counter state. Effect keyed on `coachKey`. Every coach fire: `setCoachLine(msg); setCoachKey(k => k + 1)`.
Status: FIXED in BattleScreen.tsx (2026-04-04).

**[2026-04-04] Radius curve `pow(progress, 3.0)` perceived as non-linear growth**
Center appeared almost stationary for first 10 min, then grew rapidly.
Fix: changed to `pow(progress, 1.5)` (mild ease-in, much more linear). Changed `mix(0.05, 0.70, ...)` to `mix(0.0, 0.65, ...)`.
Status: FIXED in BattleVisual.tsx (2026-04-04).
**[2026-04-25] Passive radius curve — two iterations to reach final formula — center filled screen by minute 12**
Starting point: `mix(0.0, 0.65, pow(progress, 1.5))` — visual boundary 0.42 at minute 12, covering 84% of screen height. Too aggressive.
Attempt 1: `mix(0.0, 0.45, pow(progress, 3.0))` — boundary 0.22 at minute 12 (43% screen height). Too slow in first half; pow(3.0) concentrates all growth after minute 14, orb barely visible before then.
Final: `mix(0.0, 0.42, pow(progress, 2.0))` — quadratic curve, correct middle ground.
  Minute 4 (progress=0.2): boundary 0.137 (27% Y) ✓
  Minute 8 (progress=0.4): boundary 0.187 (37% Y) ✓
  Minute 12 (progress=0.6): boundary 0.271 (54% Y) ✓
  Minute 18 (progress=0.9): boundary 0.460 (92% Y, thin border) ✓
  Minute 20 (progress=1.0): boundary 0.540 (fills screen) ✓
Root cause: the 2026-04-04 fix correctly changed the exponent (pow(3.0) → pow(1.5)) but also raised max from 0.45 to 0.65 — the max was the real problem. The shader coordinate system (half-height = 0.5, visual boundary = baseRadius + 0.12) means small max changes have large visual impact.
Status: FIXED in BattleVisual.tsx (2026-04-25). Device-validated 2026-04-26.

**[2026-04-26] Passive radius floor raised from 0.0 to 0.04 — orb starts at 6-minute equivalent size**
Pin-sized orb at session start felt too timid. Floor raised so the orb enters the session with the
visual weight it would have at the 6-minute mark under the prior formula (0.42 × 0.09 = 0.038 ≈ 0.04).
Formula: `mix(0.04, 0.42, pow(progress, 2.0)) + centerBoost * 0.05`
  Minute 0 (progress=0.0): boundary 0.160 (32% Y) — visible from first frame ✓
  Minute 4 (progress=0.2): boundary 0.175 (35% Y) ✓
  Minute 8 (progress=0.4): boundary 0.221 (44% Y) ✓
  Minute 12 (progress=0.6): boundary 0.297 (59% Y) ✓
  Minute 18 (progress=0.9): boundary 0.468 (94% Y, thin border) ✓
  Minute 20 (progress=1.0): boundary 0.540 (fills screen) ✓
Max unchanged at 0.42. Active mode untouched. No new uniforms.
Status: DONE in BattleVisual.tsx (2026-04-26).

**[2026-04-05] `CENTER_BOOST_PER_DELIVERY = 0.05` with cap 1.0 made each delivery imperceptible**
Each delivery contributed `0.05 × 0.05 = 0.0025` radius units — sub-pixel, invisible.
Fix: `CENTER_BOOST_PER_DELIVERY = 1 / 6`. Six deliveries saturate to 1.0.
Rule: when a SharedValue drives a shader uniform via a multiplier, verify the per-event increment against the multiplier chain before shipping.
Status: FIXED.

**[2026-04-06] SKSL orb shader — soot mix at outer haze boundary caused dark halo ring**
`mix(color, soot, half(1.0 - body))` colored the outer haze near-black at rest. `corona * glow * 0.45` made the corona nearly transparent at minimum glow.
Fix: Invert soot mix to only darken solid interior: `mix(color, soot, half(body * 0.5))`. Give corona base alpha: `corona * (0.14 + 0.50 * glow)`.
Status: FIXED.

**[2026-04-06] Comet trail via rotated LinearGradient rectangle — attempted and removed**
Geometric trail read as a UI element, not a particle effect.
Fix: removed entirely. No trail is better than an unconvincing one.
Status: REMOVED.

**[2026-04-14] Shader time uniform wrapping caused a visual flash every ~50 minutes of device uptime**
`time.value = (frameInfo.timestamp / 3000) % 1000` produced a visible flash at the wrap point.
Fix: Session-relative time using a `_frameTimeStart` SharedValue set on the first frame. `time.value = (frameInfo.timestamp - _frameTimeStart.value) / 3000`.
Why SharedValue not useRef: `useFrameCallback` runs as a worklet on the UI thread and cannot access React refs.
Status: FIXED.

**[2026-04-04] `navigation.navigate('Home')` from fullScreenModal reveals old screen underneath**
Fix: replaced both calls with `navigation.goBack()`. The modal dismisses, revealing the pre-existing HomeScreen.
Status: FIXED in BattleScreen.tsx (2026-04-04).

**[2026-04-19] Unused phase variables in multi-theme SKSL if/else branches**
When adding Aurora (theme 6) and Dusk (theme 7) center light sections, the plan included `auPhase` and `dkPhase2` as declared but unconsumed `float` locals. `auPhase2` and `dkPhase` were the variables actually used in those branches. SKSL optimizes dead locals out — no runtime impact — but they created false intent in the source.
Fix: both removed in /verify pass.
Status: FIXED.

**[2026-04-04] F4: setTheme before await caused wrong-theme frame on VOID/EMBER**
`setTheme` was called before `await startSession()` in `init()`, causing a sub-20ms wrong-theme frame.
Fix: `setTheme(resolvedTheme)` moved to after the last `await`, batched with `setScreenState('running')`. React 18 merges them into one render.
Status: FIXED.

**[2026-04-04] `tabBarShowIcon` does not exist in `@react-navigation/bottom-tabs` v7**
Fix: remove `tabBarShowIcon: false` from screenOptions. In v7, the absence of a `tabBarIcon` function is sufficient for text-only tabs.
Status: FIXED.
