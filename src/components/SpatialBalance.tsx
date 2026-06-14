/**
 * SpatialBalance — Physics-only component. Renders null.
 *
 * Implements the Spatial Balance mechanic: gyroscope input + edge-gravity physics →
 * writes orbX/orbY (pixel offset from screen centre) that BattleVisual renders via
 * the orbOffset shader uniform.
 *
 * Passive mode is unchanged — this component only mounts when activeMode is true in
 * BattleScreen. BattleVisual's orbOffset defaults to (0,0) and orbFixed to false when
 * this component is not mounted.
 *
 * Physics overview:
 *   - Gyroscope (DeviceMotion pitch/roll) applies force to the orb velocity
 *   - Amber gravity wells pull the orb toward the nearest screen edge, scaled to
 *     mirror the craving curve (strongest at minute 8, retreating by minute 17)
 *   - Friction varies by zone: safe (centre), edge, adhesion (quicksand near boundary)
 *   - centerBoost tracks how centred the orb is — smoothed toward safeRatio each tick,
 *     read by BattleVisual as an additive radius reward
 *
 * Architecture:
 *   - setInterval at 33ms (~30Hz) for physics — does NOT use useFrameCallback so it
 *     does not compete with BattleScreen's existing frame callback
 *   - Direct SharedValue writes from JS thread (orbX.value = x) — safe with Reanimated 4;
 *     BattleVisual reads via useDerivedValue on the UI thread
 *   - latestTilt ref updated from DeviceMotion listener (separate subscription)
 *   - velX/velY as plain refs (no SharedValue needed — only physics loop reads them)
 *   - On AppState 'active' return: orb snaps to centre via withTiming to prevent
 *     disorientation from stale tilt accumulated while backgrounded
 *   - Simulator fallback: DeviceMotion subscription fires but never calls back →
 *     tilt stays (0,0) → gravity cancels symmetrically at centre → orb unmoved
 *
 * All physics constants are module-scope consts for easy device tuning.
 *
 * See docs/architecture/patterns.md for the gyroscope pattern.
 * See docs/architecture/decisions.md for the SpatialBalance ADR.
 */

import { useEffect, useRef } from 'react';
import { AppState, Dimensions } from 'react-native';

// Screen dimensions — read once at module load (portrait-only app, won't change).
// Used to compute axis-correct clamping: the shader converts orbX/orbY to shader
// space by dividing by height, so the correct maximum for each axis is:
//   x: screenWidth/2  (so center reaches the left/right screen edge)
//   y: screenHeight/2 (so center reaches the top/bottom screen edge)
const { width: _SCREEN_W, height: _SCREEN_H } = Dimensions.get('window');
import { DeviceMotion } from 'expo-sensors';
import { withTiming } from 'react-native-reanimated';
import type { SharedValue } from 'react-native-reanimated';

// ─── Physics constants ────────────────────────────────────────────────────────
// All in points. Adjust these on device to tune feel.

const SAFE_RADIUS       = 80;   // pt — sanctuary zone; centerBoost grows here
const ADHESION_RADIUS   = 150;  // pt — "quicksand" threshold; strong damping
// Axis-correct bounds: center of orb reaches screen edge, halo extends past it.
// Computed from screen dimensions so feel is identical on all device sizes.
const MAX_X             = _SCREEN_W / 2;
const MAX_Y             = _SCREEN_H / 2;

const GYRO_SENSITIVITY  = 120;  // pt/s² per radian of tilt
const GRAVITY_SCALE     = 60;   // pt/s² — base amber gravity magnitude

const NORMAL_FRICTION   = 0.94; // velocity multiplier per tick when in safe zone
const EDGE_FRICTION     = 0.90; // when in edge zone
const ADHESION_FRICTION = 0.86; // quicksand — momentum dies fast when stuck to edge

const SPEED_SCALE       = 1.0;  // global velocity multiplier (tuning knob)
const PHYSICS_MS        = 33;   // interval in ms (~30Hz)
const DT                = PHYSICS_MS / 1000; // fixed timestep in seconds

// ─── Wind gust constants (HI mode only) ──────────────────────────────────────
// Wind gusts eliminate the neutral equilibrium at center in HI mode.
// Each gust uses a two-phase envelope (attack → decay) so onset and recession
// are both gradual and organic. Interval and decay duration are randomized per
// gust so the pattern is never predictable.
// All values are tuning knobs — adjust on device for feel.
const WIND_GUST_INTERVAL_MIN_MS = 4000; // shortest gap between gusts (tune: 3000–6000)
const WIND_GUST_INTERVAL_MAX_MS = 9000; // longest gap between gusts (tune: 7000–15000)
const WIND_GUST_STRENGTH        = 0.3;  // peak impulse magnitude (tune: 0.05–0.3)
const WIND_ATTACK_RATE          = 0.008; // per-tick ramp: 0→1 in ~125 ticks (~4s) (tune: 0.005–0.02)
const WIND_DECAY_RATE_MIN       = 0.990; // faster decay: near-zero in ~10s at 30Hz
const WIND_DECAY_RATE_MAX       = 0.995; // slower decay: near-zero in ~20s at 30Hz

// ─── Types ────────────────────────────────────────────────────────────────────

interface SpatialBalanceProps {
  sessionProgress: SharedValue<number>; // 0→1 over 20 min; reserved for future difficulty scaling (currently unused in physics loop)
  orbX: SharedValue<number>;            // written here; read by BattleVisual
  orbY: SharedValue<number>;            // written here; read by BattleVisual
  centerBoost: SharedValue<number>;     // written here; sanctuary reward for BattleVisual
  edgeContact: SharedValue<number>;     // written here; 0→1 when orb in adhesion zone; drives background pressure in BattleVisual
  gravityHigh: boolean;                 // false = regular (amberStrength 0.3), true = strong (0.5)
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SpatialBalance({
  sessionProgress,
  orbX,
  orbY,
  centerBoost,
  edgeContact,
  gravityHigh,
}: SpatialBalanceProps) {
  // Latest gyroscope reading — updated from DeviceMotion listener, read by physics interval.
  // Using a ref (not state) because the physics loop reads it directly; no render needed.
  const latestTilt = useRef({ pitch: 0, roll: 0 });

  // Physics velocity — plain refs, only the interval loop reads/writes them.
  const velX = useRef(0);
  const velY = useRef(0);

  // Recentring flag — set when AppState returns to 'active' to pause the physics loop
  // for 420ms while withTiming animates orbX/orbY back to 0. Without this, the first
  // physics tick (~33ms) overwrites orbX.value directly, cancelling the animation.
  const recentringRef        = useRef(false);
  // Stored so the unmount cleanup can cancel it if SpatialBalance is removed during the window.
  const recentringTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Wind gust state (HI mode only) — plain refs, only the physics loop reads/writes them.
  // windX/windY: current gust direction (unit vector × WIND_GUST_STRENGTH); set on each gust fire.
  // windEnvelope: current envelope value (0→1 during attack, 1→0 during decay, 0 when idle).
  // windPhase: current envelope phase — 'idle' (no gust), 'attack' (ramping up), 'decay' (fading).
  // windCurrentDecayRate: per-gust random decay rate, randomized on each gust fire.
  // nextGustInterval: per-gust random interval (ms), randomized on each gust fire.
  // lastGustAt: timestamp of the last gust fire, used to schedule the next one.
  const windX                = useRef(0);
  const windY                = useRef(0);
  const windEnvelope         = useRef(0);       // starts at 0 — no active gust until first interval fires
  const windPhase            = useRef<'idle' | 'attack' | 'decay'>('idle');
  const windCurrentDecayRate = useRef(0.97);    // default; overwritten on each gust fire
  const nextGustInterval     = useRef(WIND_GUST_INTERVAL_MIN_MS); // default; randomized on first fire
  const lastGustAt           = useRef(0);

  // ── Gyroscope subscription ──────────────────────────────────────────────────

  useEffect(() => {
    DeviceMotion.setUpdateInterval(33); // ~30Hz — matches physics loop
    const sub = DeviceMotion.addListener(({ rotation }) => {
      if (rotation) {
        // beta = forward/back tilt (→ Y force), gamma = left/right tilt (→ X force)
        latestTilt.current = {
          pitch: rotation.beta  ?? 0,
          roll:  rotation.gamma ?? 0,
        };
      }
    });
    return () => sub.remove();
  }, []);

  // ── AppState: reset orb to centre when returning from background ────────────
  // Prevents disorientation from stale velocity accumulated while backgrounded.

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // Pause physics loop while the smooth recentre animation runs.
        // Without this, the first physics tick (~33ms) cancels the withTiming
        // by directly writing orbX.value (direct assignment kills running animations).
        recentringRef.current = true;
        orbX.value = withTiming(0, { duration: 400 });
        orbY.value = withTiming(0, { duration: 400 });
        velX.current = 0;
        velY.current = 0;
        windEnvelope.current = 0;           // kill any active gust (attack or decay)
        windPhase.current    = 'idle';      // prevent decay from continuing after resume
        lastGustAt.current   = Date.now(); // delay next gust by a full interval post-resume (R-02)
        edgeContact.value    = 0;          // clear stale edge pressure immediately on resume
        recentringTimeoutRef.current = setTimeout(() => { recentringRef.current = false; }, 420);
      }
    });
    return () => {
      sub.remove();
      if (recentringTimeoutRef.current !== null) clearTimeout(recentringTimeoutRef.current);
    };
  }, [orbX, orbY, edgeContact]);

  // ── Physics loop ─────────────────────────────────────────────────────────────

  useEffect(() => {
    // Reset envelope state on every (re)start — covers both initial mount and
    // LO→HI toggle (which restarts this useEffect via the gravityHigh dep).
    windPhase.current    = 'idle';
    windEnvelope.current = 0;
    if (gravityHigh) {
      // Delay the first gust by a full randomized interval from when HI mode activates.
      // Without this, lastGustAt = 0 means Date.now() - 0 >> any interval on tick 1
      // (R-01 / R-04). Also randomize the first interval so sessions never start identically.
      lastGustAt.current     = Date.now();
      nextGustInterval.current = WIND_GUST_INTERVAL_MIN_MS +
        Math.random() * (WIND_GUST_INTERVAL_MAX_MS - WIND_GUST_INTERVAL_MIN_MS);
    }

    const id = setInterval(() => {
      // Pause while AppState recentre animation is running (R-02).
      // Direct .value writes cancel running withTiming animations; skip ticks
      // for the 420ms window set by the AppState handler.
      if (recentringRef.current) return;

      const now = Date.now();
      const { pitch, roll } = latestTilt.current;

      // Amber gravity strength — selected by user via the PULL toggle.
      // Regular (R): 0.3 — device-validated baseline feel.
      // Strong (S): 0.7 — mid-screen gravity ~2.3× harder (10.5 vs 4.5 pt/s² at 50% to edge).
      // At edge: 42 pt/s² gravity; 20° tilt = 42 pt/s² counter-force — just overcomeable.
      // Safe because per-axis normalisation (nx=orbX/MAX_X) prevents the 5× asymmetry
      // that made high values unplayable before the normalisation fix.
      const amberStrength = gravityHigh ? 0.7 : 0.3;

      // Normalised orb position: each axis normalised by its own screen-edge bound (-1 to +1).
      // Using MAX_X/MAX_Y (not a shared EDGE_ZONE_RADIUS) so gravity magnitude is identical
      // at every screen edge. Without this, ny at the bottom edge (≈2.34) produces ~5×
      // more gravity than nx at the side edge (≈1.08), making top/bottom far stickier.
      const nx = orbX.value / MAX_X;
      const ny = orbY.value / MAX_Y;

      // Edge gravity: non-linear (n × |n|) so force increases sharply near the edge.
      // Pulls toward whichever edge is closest on each axis independently.
      const gravX = nx * Math.abs(nx) * amberStrength * GRAVITY_SCALE;
      const gravY = ny * Math.abs(ny) * amberStrength * GRAVITY_SCALE;

      // Apply forces: gyro provides counter-force against amber gravity.
      // Gravity is additive (+gravX/Y) so it pulls the orb away from centre toward edges.
      // The user must tilt to generate enough GYRO force to overcome it.
      // roll (left/right tilt) → X; pitch (forward/back tilt) → Y.
      velX.current += roll  * GYRO_SENSITIVITY + gravX;
      velY.current += pitch * GYRO_SENSITIVITY + gravY;

      // Wind gusts (HI mode only) — eliminates neutral equilibrium at center.
      // Two-phase envelope per gust: attack (ramps 0→1 gradually) then decay
      // (fades 1→0 at a per-gust random rate). Interval is also randomized per
      // gust so the pattern is never predictable. LO mode: block not entered.
      if (gravityHigh) {
        // Schedule next gust when the per-gust randomized interval has elapsed.
        if (now - lastGustAt.current > nextGustInterval.current) {
          lastGustAt.current = now;
          // Randomize next gap and this gust's decay duration independently.
          nextGustInterval.current = WIND_GUST_INTERVAL_MIN_MS +
            Math.random() * (WIND_GUST_INTERVAL_MAX_MS - WIND_GUST_INTERVAL_MIN_MS);
          windCurrentDecayRate.current = WIND_DECAY_RATE_MIN +
            Math.random() * (WIND_DECAY_RATE_MAX - WIND_DECAY_RATE_MIN);
          // New random direction. Envelope is NOT reset to 0 — it carries its current
          // value into the new attack phase so there is no sudden magnitude drop when
          // one gust transitions to the next. The attack ramp then brings it to 1.0.
          const angle = Math.random() * Math.PI * 2;
          windX.current     = Math.cos(angle) * WIND_GUST_STRENGTH;
          windY.current     = Math.sin(angle) * WIND_GUST_STRENGTH;
          windPhase.current = 'attack';
        }
        // Advance envelope through its current phase.
        if (windPhase.current === 'attack') {
          windEnvelope.current = Math.min(1.0, windEnvelope.current + WIND_ATTACK_RATE);
          if (windEnvelope.current >= 1.0) windPhase.current = 'decay';
        } else if (windPhase.current === 'decay') {
          windEnvelope.current *= windCurrentDecayRate.current;
        }
        // 'idle': windEnvelope stays 0, no force applied.
        // Apply wind force. GRAVITY_SCALE normalises magnitude to the same range
        // as edge gravity so feel is consistent with the rest of the physics.
        velX.current += windX.current * windEnvelope.current * GRAVITY_SCALE;
        velY.current += windY.current * windEnvelope.current * GRAVITY_SCALE;
      }

      // Zone-dependent friction
      const dist = Math.sqrt(orbX.value ** 2 + orbY.value ** 2);
      const friction =
        dist > ADHESION_RADIUS ? ADHESION_FRICTION :
        dist > SAFE_RADIUS     ? EDGE_FRICTION      :
                                  NORMAL_FRICTION;
      velX.current *= friction;
      velY.current *= friction;

      // Integrate and clamp to screen bounds
      orbX.value = Math.max(-MAX_X, Math.min(MAX_X, orbX.value + velX.current * DT * SPEED_SCALE));
      orbY.value = Math.max(-MAX_Y, Math.min(MAX_Y, orbY.value + velY.current * DT * SPEED_SCALE));

      // Post-integration distance — used for zone classification and centerBoost (R-03).
      // dist (above) was computed before integration and is still correct for friction
      // selection (friction is applied to the velocity that produced the new position).
      const newDist = Math.sqrt(orbX.value ** 2 + orbY.value ** 2);

      // centerBoost: smooth exponential approach toward how centred the orb is.
      // safeRatio = 1.0 at exact centre, 0.0 at SAFE_RADIUS boundary and beyond.
      // 0.04 lerp factor → ~1 second to reach 63% of target at 30Hz.
      const safeRatio = Math.max(0, 1.0 - newDist / SAFE_RADIUS);
      centerBoost.value += (safeRatio - centerBoost.value) * 0.04;

      // edgeContact: 0→1 proximity signal for BattleVisual orb dim/shrink effect.
      // Computed per-axis so top/bottom and left/right edges are equally weighted:
      //   edgeProxX = how far the orb is toward the left/right edge (0=centre, 1=at edge)
      //   edgeProxY = how far the orb is toward the top/bottom edge
      // Ramps from 0 to 1 starting at 65% of the way to each edge (threshold chosen so
      // the orb is visibly close before the effect begins — not triggered mid-screen).
      // Asymmetric lerp: drains at 0.05 (~1.3s to 63%), recovers at 0.018 (~3.5s to 63%)
      // so the orb feels like it loses life slowly and regains it even more slowly.
      const edgeProxX = Math.abs(orbX.value) / MAX_X;
      const edgeProxY = Math.abs(orbY.value) / MAX_Y;
      const edgeProx = Math.max(edgeProxX, edgeProxY);
      const contactTarget = Math.max(0, Math.min(1, (edgeProx - 0.65) / 0.35));
      const lerpRate = contactTarget > edgeContact.value ? 0.05 : 0.018;
      edgeContact.value += (contactTarget - edgeContact.value) * lerpRate;

    }, PHYSICS_MS);

    return () => clearInterval(id);
  }, [orbX, orbY, centerBoost, edgeContact, gravityHigh]); // sessionProgress intentionally omitted — not read in loop body; reserved for future difficulty scaling

  // Pure logic component — all visual output is via BattleVisual's orbOffset uniform.
  return null;
}
