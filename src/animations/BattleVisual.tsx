/**
 * BattleVisual — Skia RuntimeEffect (SKSL shader) implementation.
 *
 * Uniforms (all driven by Reanimated SharedValues via useDerivedValue):
 *   time     — continuous 50-min linear clock (3_000_000ms, Easing.linear, no reverse)
 *              drives turbulence, organic breathing, heartbeat, phase oscillation
 *   progress — 0.0→1.0 session progress; boundary = mix(0.0, 0.65, pow(progress, 1.5))
 *   pulse    — shockwave ring displacement, animated 0→1.3 per recommitment tap
 *              (1100ms, Easing.out(quad)) — driven by pulseCount prop increment
 *   seed     — per-session random float; shifts the noise origin for visual variety
 *   theme    — 0 = fire (amber edges, white/teal center)
 *              1 = void (navy/indigo edges, white/teal center)
 *              2 = ember (near-black edges, amber center)
 *              3 = glacier (ice-blue edges, warm amber/gold center — Fire inverted)
 *              4 = abyss (pitch-black edges, bioluminescent cyan-green center)
 *              5 = solar (blazing gold-white edges, deep violet/crimson center)
 *              6 = aurora (electric green edges, silver-pearl center)
 *              7 = dusk (rose/magenta edges, warm gold center)
 *              8 = nebula (deep violet/hot-magenta edges, electric ice-blue center)
 *
 * Shader pipeline (per pixel, in order):
 *   1. Shockwave: Gaussian ring outward from center when pulse > 0
 *   2. Seed offset: shifts p from p_base for per-session variation
 *   3. Phase clock: two fbm time samples → smoothstepped phase oscillation
 *   4. Depth noise: three fbm passes (n1/n2/n3) → depthNoise composite
 *   5. Heat haze: fire noise (n1, n2) creates small refraction offset on p_base → p_haze
 *   6. Core heartbeat: sin(time*2.0) → corePulse — makes white core visibly throb
 *   7. Organic breathing: sin(time*0.6) + dual fbm warp on p_haze → p_center
 *   8. Boundary mask: smoothstep on dist_center vs baseRadius ± edgeNoise + boil
 *   9. Chromatic aberration: edgeGlow at center/fire boundary splits R and B channels
 *  10. Fire color: heat scalar → 5-stop ramp (soot/deepRed/ember/amberCol/yellowHot)
 *  11. Center light: white core → teal/electricCyan edge, brightness varies with depthNoise
 *      corePulse applied to coreDepth: the throb physically expands the white core region
 *  12. Composite: per-channel mix using chromaOffset-shifted masks for R and B
 *  13. Radial vignette at screen edges
 *
 * Component public API:
 *   time                  — SharedValue<number> owned by BattleScreen
 *   sessionProgress       — SharedValue<number> owned/animated by BattleScreen
 *   pulseCount            — incremented by BattleScreen each recommitment tap
 *   onWinAnimationComplete — called after 5-sec win overlay sequence ends
 *   orbX / orbY           — optional SharedValue<number>; pixels from screen centre.
 *                           Written by SpatialBalance in active mode (default 0 = centred).
 *                           Shifts the center force position in the shader via orbOffset uniform.
 *   orbFixed              — optional SharedValue<number>; 1.0 = active (ACTIVE_RADIUS constant),
 *                           0.0 = passive (progress-driven). SharedValue so useDerivedValue
 *                           tracks it reactively — zero-frame-lag on mode switch.
 *   orbSize               — optional SharedValue<number>; 1.0 = medium (radius 0.13),
 *                           0.0 = small (radius 0.08). Only affects active mode. Default: 1.0.
 *   edgeContact           — optional SharedValue<number>; 0→1 written by SpatialBalance when
 *                           orb enters adhesion zone. Drives directional background pressure effect.
 *
 * Shader coordinate space for orbOffset:
 *   p_base = (uv - 0.5) × (aspect, 1.0)  →  pixel offset (px,py) maps to (px/height, py/height)
 *
 * Architecture constraints (see patterns.md):
 *   - RuntimeEffect created at module scope — GPU compilation, must not run on render
 *   - Uniforms via useDerivedValue → UI thread, zero bridge overhead
 *   - Win overlay: Animated.View above Canvas, driven by winOpacity SharedValue
 *   - All session timing in BattleScreen — time clock also owned by BattleScreen (lifted from here)
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import Animated, {
  cancelAnimation,
  runOnJS,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';

import {
  MILESTONE_PULSE_DURATION_MS,
  MILESTONE_PULSE_TARGET,
  WIN_FADE_BACK_MS,
  WIN_FADE_WHITE_MS,
  WIN_HOLD_CLEAR_MS,
  WIN_HOLD_WHITE_MS,
} from '../constants/timing';

import type { SharedValue } from 'react-native-reanimated';

interface BattleVisualProps {
  time: SharedValue<number>;              // owned by BattleScreen
  sessionProgress: SharedValue<number>;
  pulseCount: number;
  onWinAnimationComplete?: () => void;
  theme?: number;                         // 0=fire, 1=void, 2=ember, 3=glacier, 4=abyss, 5=solar, 6=aurora, 7=dusk, 8=nebula
  centerBoost?: SharedValue<number>;      // 0→1; written by SpatialBalance; additive radius boost
  orbX?: SharedValue<number>;             // pixels from screen centre; written by SpatialBalance
  orbY?: SharedValue<number>;             // pixels from screen centre; written by SpatialBalance
  orbFixed?: SharedValue<number>;         // 1.0 = active (constant radius), 0.0 = passive; SharedValue so useDerivedValue tracks it reactively
  orbSize?: SharedValue<number>;          // 1.0 = medium (ACTIVE_RADIUS 0.13), 0.0 = small (0.08); active mode only
  edgeContact?: SharedValue<number>;      // 0→1; written by SpatialBalance when orb in adhesion zone; drives background pressure effect
}

const SHADER_SRC = `
uniform float2 resolution;
uniform float  time;
uniform float  progress;
uniform float  pulse;
uniform float  seed;
uniform float  theme;
uniform float  centerBoost;
uniform float2 orbOffset;   // normalised offset from screen centre (px/height, py/height)
uniform float  orbFixed;    // 1.0 = active mode (constant radius), 0.0 = passive (progress-driven)
uniform float  orbSize;     // 1.0 = medium (0.13), 0.0 = small (0.08); only used in active mode
uniform float  edgeContact; // 0→1; orb in adhesion zone — drives directional background pressure
// ---------- Utilities ----------

float2 rotate(float2 p, float a) {
  float s = sin(a); float c = cos(a);
  return float2(c*p.x - s*p.y, s*p.x + c*p.y);
}

float hash(float2 p) {
  return fract(sin(dot(p, float2(127.1,311.7))) * 43758.5453);
}

float noise(float2 p) {
  float2 i = floor(p); float2 f = fract(p);
  float2 u = f*f*(3.0-2.0*f);
  return mix(mix(hash(i), hash(i+float2(1,0)), u.x),
             mix(hash(i+float2(0,1)), hash(i+float2(1,1)), u.x), u.y);
}

float fbm(float2 p) {
  float v = 0.0; float a = 0.5;
  for (int i=0;i<4;i++) {
    p = rotate(p, 0.5 + float(i)*0.3);
    v += a * noise(p);
    p *= 2.1; a *= 0.5;
  }
  return v;
}

// ---------- Main ----------

half4 main(float2 fragCoord) {
  float2 uv = fragCoord / resolution;
  float aspect = resolution.x / resolution.y;
  float2 p_base = (uv - 0.5) * float2(aspect,1.0);

  // --- SHOCKWAVE DISPLACEMENT ---
  // dist_raw is orb-relative so the shockwave ring emanates from the orb centre in active mode
  float dist_raw = length(p_base - orbOffset);
  float2 p = p_base;
  if (pulse > 0.001) {
    float wave = dist_raw - pulse;
    float shock = exp(-abs(wave) * 18.0) * 0.12;
    float2 orbDir = p_base - orbOffset;
    p += (orbDir / max(dist_raw, 0.001)) * shock;
  }

  p += float2(sin(seed * 12.34), cos(seed * 45.67)) * 0.5;

  // ---------- STABLE TIME ----------
  float slowTime = time * 0.15;
  float phase = smoothstep(0.2, 0.8, fbm(float2(slowTime, slowTime * 0.7 + 10.0)));

  // ---------- AMBER DEPTH NOISE ----------
  float n1 = fbm(p * 2.0);
  float n2 = fbm(p * 4.5 + 10.0);
  float n3 = fbm(p * 8.0 - 7.0);
  float depthNoise = n1*0.6 + n2*0.3 + n3*0.1;

  // ---------- HEAT HAZE (REFRACTION) ----------
  // Use the fire noise to subtly warp the coordinates for the center
  float2 hazeOffset = float2(n1 - 0.5, n2 - 0.5) * 0.025;
  float2 p_haze = p_base + hazeOffset;

  // ---------- CORE HEARTBEAT ----------
  // Faster, internal throb for the white core
  float heartbeat = sin(time * 2.0) * 0.5 + 0.5;
  float corePulse = 1.0 + (heartbeat * 0.06);

  // ---------- ORGANIC CENTER ----------
  float breathe = sin(time * 0.6) * 0.5 + 0.5;
  float2 cWarp = float2(fbm(p_haze + time * 0.1), fbm(p_haze - time * 0.15));
  // Shift by orbOffset so the center force tracks the orb position in active mode.
  // In passive mode orbOffset == (0,0) so behaviour is identical to before.
  // Organic distortion fades to zero at walls (edgeContact → 1) so the orb boundary is
  // consistent on every visit. At centre, full distortion preserved — alive and organic.
  float2 p_center = (p_haze - orbOffset) * (1.0 + breathe * 0.12) + (cWarp - 0.5) * 0.20 * (1.0 - edgeContact);
  float dist_center = length(p_center);

  // --- RADIUS ---
  // Passive (orbFixed=0): progress-driven growth 0.04→0.42 over 20 min (floor = 6-min equivalent size).
  // Active (orbFixed=1): constant ACTIVE_RADIUS — size is fixed; user holds the orb, time does not grow it.
  // centerBoost: 0→1 from SpatialBalance sanctuary centering; additive reward (+0.05 max).
  // Active radius interpolates between small (0.08) and medium (0.13) based on orbSize uniform.
  // orbSize = 1.0 → medium; orbSize = 0.0 → small. Only applies in active mode (orbFixed > 0.5).
  float activeR = mix(0.08, 0.13, orbSize);
  float baseRadius = (orbFixed > 0.5 ? activeR : mix(0.04, 0.42, pow(progress, 2.0))) + centerBoost * 0.05;
  // edgeContact does NOT modify baseRadius — only centerLight dims (see below).
  // Keeping baseRadius stable ensures the orb consistently reaches the wall regardless
  // of centerBoost history. Size variability at the wall was the root cause of the
  // "sometimes doesn't touch / sometimes goes beyond" perception.

  // ---------- MASKS ----------
  float edgeNoise = (depthNoise - 0.5);
  float centerMask = 1.0 - smoothstep(
    baseRadius - 0.05 + edgeNoise * 0.05,
    baseRadius + 0.12 + edgeNoise * 0.15,
    dist_center
  );

  // --- CHROMATIC ABERRATION ON EDGE ---
  float edgeGlow = centerMask * (1.0 - centerMask) * 4.0;
  float2 chromaOffset = float2(0.008, 0.0) * edgeGlow;

  // ---------- HEAT & COLORS ----------
  float heat = depthNoise * 1.25 + 0.2 * (phase - 0.5) + 0.1 * sin(time * 2.5 + n2 * 6.0);
  heat = pow(smoothstep(0.25, 0.75, heat), 1.15);

  half3 fireColor;
  if (theme < 0.5) {
    // FIRE: amber ramp
    if (heat < 0.2) fireColor = mix(half3(0.01,0.005,0), half3(0.55,0.04,0.01), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.55,0.04,0.01), half3(0.85,0.25,0.02), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.85,0.25,0.02), half3(1,0.45,0.05), half((heat-0.5)/0.25));
    else fireColor = mix(half3(1,0.45,0.05), half3(1,0.85,0.2), half((heat-0.75)/0.25));
    fireColor += half3(1.0, 0.6, 0.2) * half(0.22 * sin(time * 3.0 + n3 * 10.0));
  } else if (theme < 1.5) {
    // VOID: deep navy → indigo → violet ramp
    if (heat < 0.2) fireColor = mix(half3(0.0,0.0,0.02), half3(0.01,0.01,0.12), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.01,0.01,0.12), half3(0.05,0.0,0.28), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.05,0.0,0.28), half3(0.18,0.0,0.50), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.18,0.0,0.50), half3(0.35,0.0,0.75), half((heat-0.75)/0.25));
    fireColor += half3(0.1, 0.0, 0.4) * half(0.18 * sin(time * 3.0 + n3 * 10.0));
  } else if (theme < 2.5) {
    // EMBER: near-black edges, almost invisible pressure
    if (heat < 0.2) fireColor = mix(half3(0.01,0.005,0.005), half3(0.04,0.015,0.01), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.04,0.015,0.01), half3(0.08,0.025,0.01), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.08,0.025,0.01), half3(0.12,0.04,0.01), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.12,0.04,0.01), half3(0.18,0.07,0.02), half((heat-0.75)/0.25));
  } else if (theme < 3.5) {
    // GLACIER: ice and frost — cold blue-white pressing inward from edges
    if (heat < 0.2) fireColor = mix(half3(0.0,0.0,0.01), half3(0.02,0.05,0.18), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.02,0.05,0.18), half3(0.08,0.25,0.55), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.08,0.25,0.55), half3(0.35,0.75,0.95), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.35,0.75,0.95), half3(0.75,0.97,1.0), half((heat-0.75)/0.25));
    fireColor += half3(0.3, 0.8, 1.0) * half(0.15 * sin(time * 3.0 + n3 * 10.0));
  } else if (theme < 4.5) {
    // ABYSS: pitch-black edges with barely-perceptible deep teal — total darkness pressing in
    if (heat < 0.2) fireColor = mix(half3(0.0,0.0,0.0), half3(0.0,0.01,0.04), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.0,0.01,0.04), half3(0.0,0.04,0.08), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.0,0.04,0.08), half3(0.0,0.08,0.12), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.0,0.08,0.12), half3(0.0,0.14,0.18), half((heat-0.75)/0.25));
  } else if (theme < 5.5) {
    // SOLAR: blazing gold-white pressing inward — raw solar pressure from all edges
    if (heat < 0.2) fireColor = mix(half3(0.20,0.10,0.0), half3(0.65,0.40,0.0), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.65,0.40,0.0), half3(0.95,0.80,0.10), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.95,0.80,0.10), half3(1.0,0.96,0.60), half((heat-0.5)/0.25));
    else fireColor = mix(half3(1.0,0.96,0.60), half3(1.0,1.0,0.95), half((heat-0.75)/0.25));
    fireColor += half3(1.0, 0.95, 0.6) * half(0.25 * sin(time * 3.0 + n3 * 10.0));
  } else if (theme < 6.5) {
    // AURORA: near-black → forest green → electric green → bright lime
    if (heat < 0.2) fireColor = mix(half3(0.0,0.01,0.03), half3(0.0,0.12,0.08), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.0,0.12,0.08), half3(0.0,0.55,0.30), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.0,0.55,0.30), half3(0.10,0.95,0.45), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.10,0.95,0.45), half3(0.45,1.0,0.60), half((heat-0.75)/0.25));
    fireColor += half3(0.15,1.0,0.55) * half(0.18 * sin(time * 3.0 + n3 * 10.0));
  } else if (theme < 7.5) {
    // DUSK: near-black → deep magenta → rose → warm coral
    if (heat < 0.2) fireColor = mix(half3(0.05,0.0,0.04), half3(0.30,0.02,0.18), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.30,0.02,0.18), half3(0.80,0.05,0.35), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.80,0.05,0.35), half3(1.0,0.20,0.40), half((heat-0.5)/0.25));
    else fireColor = mix(half3(1.0,0.20,0.40), half3(1.0,0.55,0.30), half((heat-0.75)/0.25));
    fireColor += half3(1.0,0.25,0.55) * half(0.20 * sin(time * 3.0 + n3 * 10.0));
  } else {
    // NEBULA: near-black → deep violet → vivid violet → hot magenta-violet
    if (heat < 0.2) fireColor = mix(half3(0.02,0.0,0.05), half3(0.08,0.0,0.22), half(heat/0.2));
    else if (heat < 0.5) fireColor = mix(half3(0.08,0.0,0.22), half3(0.35,0.0,0.55), half((heat-0.2)/0.3));
    else if (heat < 0.75) fireColor = mix(half3(0.35,0.0,0.55), half3(0.75,0.05,0.70), half((heat-0.5)/0.25));
    else fireColor = mix(half3(0.75,0.05,0.70), half3(1.0,0.15,0.65), half((heat-0.75)/0.25));
    fireColor += half3(0.8,0.0,1.0) * half(0.22 * sin(time * 3.0 + n3 * 10.0));
  }
  fireColor *= 1.1;

  // ---------- CENTER COLOR (theme-branched, ascending: 0=fire, 1=void, 2=ember, 3=glacier, 4=abyss, 5=solar, 6=aurora, 7=dusk, 8=nebula) ----------
  float coreDepth = clamp(dist_center / (max(baseRadius, 0.001) * corePulse), 0.0, 1.0);
  half3 centerLight;
  if (theme < 1.5) {
    // FIRE (0) + VOID (1): white core → teal/electricCyan
    half3 originalTeal = half3(0.0, 0.65, 0.75);
    half3 electricCyan = half3(0.0, 0.85, 0.95);
    half3 whiteCore    = half3(1.0, 1.0, 1.0);
    half3 dynamicTeal = mix(originalTeal, electricCyan, half(breathe));
    centerLight = mix(whiteCore, dynamicTeal, pow(coreDepth, 1.2));
    centerLight *= half(1.4 - coreDepth * 0.45 + (depthNoise - 0.5) * 0.2);
    // Living color — orb cycles between warm-white and cool-white hues, always brighter
    // than baseline. warmGlow boosts R and suppresses B; coolGlow boosts B+G and suppresses R.
    // livePulse adds a breathing brightness throb independent of the heartbeat.
    // centerBoost gates everything — zero effect when orb is outside safe zone.
    float livePhase  = sin(time * 0.31) * 0.5 + 0.5;
    float livePhase2 = sin(time * 0.53 + 1.7) * 0.5 + 0.5;
    half3 warmGlow   = half3(1.45, 0.90, 0.65);
    half3 coolGlow   = half3(0.60, 1.10, 1.55);
    half3 goldGlow   = half3(1.35, 1.20, 0.50);
    half3 liveColor  = mix(mix(warmGlow, coolGlow, half(livePhase)), goldGlow, half(livePhase2 * 0.40));
    float livePulse = 1.0 + sin(time * 0.72) * 0.28;
    centerLight = mix(centerLight, centerLight * liveColor * half(livePulse), half(centerBoost));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else if (theme < 2.5) {
    // EMBER (2): amber/orange fire glows outward from center
    half3 amberCore = half3(1.0, 0.95, 0.3);
    half3 amberMid  = half3(1.0, 0.50, 0.05);
    half3 amberEdge = half3(0.6, 0.15, 0.0);
    half3 amberOuter = mix(amberMid, amberEdge, half(clamp((coreDepth - 0.3) / 0.7, 0.0, 1.0)));
    centerLight = mix(amberCore, amberOuter, pow(coreDepth, 0.8));
    centerLight *= half(1.4 - coreDepth * 0.45 + (depthNoise - 0.5) * 0.2);
    // Living color — cycles between deep amber, bright gold, and warm white.
    float ePhase = sin(time * 0.29 + 1.0) * 0.5 + 0.5;
    half3 emberDim    = half3(1.10, 0.80, 0.15);
    half3 emberBright = half3(1.25, 1.10, 0.40);
    half3 emberLive = mix(emberDim, emberBright, half(ePhase));
    float ePulse = 1.0 + sin(time * 0.72) * 0.10;
    centerLight = mix(centerLight, centerLight * emberLive * half(ePulse), half(centerBoost * 0.65));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else if (theme < 3.5) {
    // GLACIER (3): warm amber/gold center — inverse of Fire (cold outside, warm core)
    half3 glacierCore = half3(1.0, 0.85, 0.45);
    half3 glacierMid  = half3(1.0, 0.60, 0.20);
    half3 glacierEdge = half3(0.70, 0.30, 0.05);
    half3 glacierOuter = mix(glacierMid, glacierEdge, half(clamp((coreDepth - 0.3) / 0.7, 0.0, 1.0)));
    centerLight = mix(glacierCore, glacierOuter, pow(coreDepth, 0.9));
    centerLight *= half(1.4 - coreDepth * 0.45 + (depthNoise - 0.5) * 0.2);
    // Living color: warm amber/gold oscillation — complement to the cold edges
    float gPhase = sin(time * 0.27 + 0.5) * 0.5 + 0.5;
    half3 glacierWarm = half3(1.40, 0.95, 0.50);
    half3 glacierGold = half3(1.35, 1.20, 0.35);
    half3 gLive = mix(glacierWarm, glacierGold, half(gPhase));
    float gPulse = 1.0 + sin(time * 0.72) * 0.18;
    centerLight = mix(centerLight, centerLight * gLive * half(gPulse), half(centerBoost * 0.75));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else if (theme < 4.5) {
    // ABYSS (4): bioluminescent cyan-green — intense glow against total darkness
    half3 abyssCore = half3(0.0, 1.0, 0.85);
    half3 abyssMid  = half3(0.0, 0.70, 0.55);
    half3 abyssEdge = half3(0.0, 0.30, 0.25);
    half3 abyssOuter = mix(abyssMid, abyssEdge, half(clamp((coreDepth - 0.3) / 0.7, 0.0, 1.0)));
    centerLight = mix(abyssCore, abyssOuter, pow(coreDepth, 0.85));
    // Extra brightness multiplier so the glow punches through pitch-black edges
    centerLight *= half(1.8 - coreDepth * 0.60 + (depthNoise - 0.5) * 0.2);
    // Living color: slow green/cyan oscillation — languid, underwater breathing
    float aPhase = sin(time * 0.18 + 2.0) * 0.5 + 0.5;
    half3 abyssGlow = half3(0.0, 1.15, 0.90);
    half3 abyssFade = half3(0.0, 0.75, 0.65);
    half3 aLive = mix(abyssFade, abyssGlow, half(aPhase));
    float aPulse = 1.0 + sin(time * 0.45) * 0.22;
    centerLight = mix(centerLight, centerLight * aLive * half(aPulse), half(centerBoost * 0.80));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else if (theme < 5.5) {
    // SOLAR (5): electric blue core — deep space against blazing corona
    half3 solarCore  = half3(0.45, 0.50, 1.0);
    half3 solarMid   = half3(0.14, 0.16, 0.52);
    half3 solarEdge  = half3(0.03, 0.02, 0.10);
    half3 solarOuter = mix(solarMid, solarEdge, half(clamp((coreDepth - 0.3) / 0.7, 0.0, 1.0)));
    centerLight = mix(solarCore, solarOuter, pow(coreDepth, 0.9));
    centerLight *= half(1.4 - coreDepth * 0.50 + (depthNoise - 0.5) * 0.18);
    // Living color: electric blue / deep indigo oscillation
    float sPhase  = sin(time * 0.35) * 0.5 + 0.5;
    float sPhase2 = sin(time * 0.61 + 2.3) * 0.5 + 0.5;
    half3 solarElectric = half3(0.70, 0.75, 1.50);
    half3 solarIndigo   = half3(0.30, 0.20, 1.20);
    half3 sLive = mix(solarIndigo, solarElectric, half(sPhase));
    float sPulse = 1.0 + sin(time * 0.72) * 0.25;
    centerLight = mix(centerLight, centerLight * sLive * half(sPulse), half(centerBoost * sPhase2 * 0.65));
    centerLight *= half(1.0 - edgeContact * 0.70);
  } else if (theme < 6.5) {
    // AURORA (6): silver-pearl core → cool sky-blue edge; living color pulses ice-white/blue/pale-violet
    half3 auroraCore = half3(1.0, 1.0, 1.0);
    half3 auroraEdge = half3(0.68, 0.90, 1.0);
    centerLight = mix(auroraCore, auroraEdge, pow(coreDepth, 1.1));
    centerLight *= half(1.4 - coreDepth * 0.40 + (depthNoise - 0.5) * 0.18);
    float auPhase2 = sin(time * 0.44 + 1.2) * 0.5 + 0.5;
    half3 auIce    = half3(0.80, 0.95, 1.0);
    half3 auViolet = half3(0.82, 0.72, 1.0);
    half3 auLive   = mix(auIce, auViolet, half(auPhase2 * 0.45));
    float auPulse  = 1.0 + sin(time * 0.60) * 0.22;
    centerLight = mix(centerLight, centerLight * auLive * half(auPulse), half(centerBoost * 0.80));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else if (theme < 7.5) {
    // DUSK (7): warm gold core → champagne cream; living color shifts between gold, honey-amber, champagne
    half3 duskCore  = half3(1.0, 0.88, 0.45);
    half3 duskEdge  = half3(1.0, 0.96, 0.78);
    centerLight = mix(duskCore, duskEdge, pow(coreDepth, 1.0));
    centerLight *= half(1.4 - coreDepth * 0.40 + (depthNoise - 0.5) * 0.20);
    float dkPhase  = sin(time * 0.31 + 0.8) * 0.5 + 0.5;
    half3 dkGold   = half3(1.40, 1.10, 0.40);
    half3 dkHoney  = half3(1.30, 0.95, 0.30);
    half3 dkLive   = mix(dkGold, dkHoney, half(dkPhase));
    float dkPulse  = 1.0 + sin(time * 0.72) * 0.18;
    centerLight = mix(centerLight, centerLight * dkLive * half(dkPulse), half(centerBoost * 0.75));
    centerLight *= half(1.0 - edgeContact * 0.60);
  } else {
    // NEBULA (8): electric ice-blue core → deep cyan; extra brightness to punch through dark violet edges
    half3 nebCore  = half3(0.60, 0.88, 1.0);
    half3 nebMid   = half3(0.0, 0.78, 0.98);
    half3 nebEdge  = half3(0.0, 0.38, 0.68);
    half3 nebOuter = mix(nebMid, nebEdge, half(clamp((coreDepth - 0.3) / 0.7, 0.0, 1.0)));
    centerLight = mix(nebCore, nebOuter, pow(coreDepth, 0.85));
    centerLight *= half(1.85 - coreDepth * 0.55 + (depthNoise - 0.5) * 0.20);
    float nbPhase  = sin(time * 0.38 + 0.5) * 0.5 + 0.5;
    float nbPhase2 = sin(time * 0.55 + 1.9) * 0.5 + 0.5;
    half3 nbElectric = half3(0.75, 0.97, 1.0);
    half3 nbCyan     = half3(0.0, 0.95, 1.0);
    half3 nbLive     = mix(nbCyan, nbElectric, half(nbPhase));
    float nbPulse    = 1.0 + sin(time * 0.50) * 0.28;
    centerLight = mix(centerLight, centerLight * nbLive * half(nbPulse), half(centerBoost * nbPhase2 * 0.85));
    centerLight *= half(1.0 - edgeContact * 0.65);
  }

  // Apply Aberration shift to center components
  half3 color = mix(half3(0.01, 0.02, 0.03), fireColor, half(1.0 - centerMask));
  color.r = mix(color.r, centerLight.r, half(1.0 - smoothstep(baseRadius - 0.05 + edgeNoise * 0.05, baseRadius + 0.12 + edgeNoise * 0.15, length(p_center + chromaOffset))));
  color.g = mix(color.g, centerLight.g, half(centerMask));
  color.b = mix(color.b, centerLight.b, half(1.0 - smoothstep(baseRadius - 0.05 + edgeNoise * 0.05, baseRadius + 0.12 + edgeNoise * 0.15, length(p_center - chromaOffset))));

  // --- BACKGROUND EDGE PRESSURE ---
  // When the orb presses into the adhesion zone (edgeContact > 0), the background on the
  // contact side brightens and deepens toward a pressure amber, as if the amber tide pushes back.
  // orbOffset direction indicates which side is under pressure.
  // dot(normalize(p_base), normalize(orbOffset)) = 1.0 on contact side, -1.0 on opposite.
  // Skip when orbOffset is near zero — orb is at centre, no directional pressure makes sense.
  // length() guard also removes the (1e-5,1e-5) directional bias that would otherwise point
  // pressureDir toward the lower-right corner when orbOffset == (0,0).
  if (edgeContact > 0.001 && length(orbOffset) > 1e-4) {
    float2 pressureDir = normalize(orbOffset);
    float2 pixelDir    = normalize(p_base + float2(1e-5, 1e-5));
    float contactSide  = dot(pixelDir, pressureDir) * 0.5 + 0.5; // 0..1
    float pressureMask = contactSide * edgeContact;
    // Only apply to non-center pixels (where fire color dominates)
    float fireWeight = 1.0 - centerMask;
    if (theme < 1.5) {
      // FIRE (0) + VOID (1): intensify amber/violet on contact side
      half3 fireTint = half3(1.2, 0.7, 0.1);   // fire: deepen to dark amber
      half3 voidTint = half3(0.6, 0.2, 1.4);   // void: deepen to dark violet
      half3 pressureTint = mix(voidTint, fireTint, half(step(0.5, 1.0 - theme)));
      color = mix(color, color * pressureTint, half(pressureMask * 0.35 * fireWeight));
      color *= half(1.0 + pressureMask * 0.30 * fireWeight);
    } else if (theme < 2.5) {
      // EMBER (2): darken contact side (pressure retreats to near-black)
      color *= half(1.0 - pressureMask * 0.40 * fireWeight);
    } else if (theme < 3.5) {
      // GLACIER (3): icy blue deepening on contact side
      half3 glacierTint = half3(0.4, 0.85, 1.2);  // cold blue
      color = mix(color, color * glacierTint, half(pressureMask * 0.35 * fireWeight));
    } else if (theme < 4.5) {
      // ABYSS (4): total darkness on contact side — the deep closes in
      color *= half(1.0 - pressureMask * 0.60 * fireWeight);
    } else if (theme < 5.5) {
      // SOLAR (5): blaze brighter on contact — solar flare intensification
      half3 solarFlareTint = half3(1.3, 1.1, 0.7);  // hot white-gold
      color = mix(color, color * solarFlareTint, half(pressureMask * 0.45 * fireWeight));
    } else if (theme < 6.5) {
      // AURORA (6): deepen edges to deeper electric green on contact
      half3 auroraTint = half3(0.2, 1.3, 0.5);
      color = mix(color, color * auroraTint, half(pressureMask * 0.35 * fireWeight));
      color *= half(1.0 + pressureMask * 0.20 * fireWeight);
    } else if (theme < 7.5) {
      // DUSK (7): deepen to deep rose/magenta on contact
      half3 duskTint = half3(1.3, 0.3, 0.7);
      color = mix(color, color * duskTint, half(pressureMask * 0.40 * fireWeight));
    } else {
      // NEBULA (8): deepen to electric violet-magenta, slightly brighter (supernova flare)
      half3 nebulaTint = half3(1.2, 0.1, 1.4);
      color = mix(color, color * nebulaTint, half(pressureMask * 0.38 * fireWeight));
      color *= half(1.0 + pressureMask * 0.25 * fireWeight);
    }
  }

  color *= half(1.0 - smoothstep(0.4, 0.95, length(p_base)));

  return half4(color, 1.0);
}
`;

const _effect = Skia.RuntimeEffect.Make(SHADER_SRC);
if (!_effect) {
  throw new Error('[BattleVisual] SKSL shader compilation failed — check SHADER_SRC for syntax errors');
}
// TypeScript narrows module-level consts within the same block but not across
// function closure boundaries. Reassignment to a new binding gives the component
// a correctly-typed non-null reference.
const runtimeEffect = _effect;

export default function BattleVisual({
  time,
  sessionProgress,
  pulseCount,
  onWinAnimationComplete,
  theme = 0,
  centerBoost: centerBoostProp,
  orbX: orbXProp,
  orbY: orbYProp,
  orbFixed: orbFixedProp,
  orbSize: orbSizeProp,
  edgeContact: edgeContactProp,
}: BattleVisualProps) {
  const { width, height } = useWindowDimensions();
  // Fallbacks so props are optional — hooks must always be called unconditionally
  const _localCenterBoost = useSharedValue(0);
  const _localOrbX = useSharedValue(0);
  const _localOrbY = useSharedValue(0);
  const _localOrbFixed = useSharedValue(0);
  const _localOrbSize = useSharedValue(1);    // default: medium
  const _localEdgeContact = useSharedValue(0);
  const boost = centerBoostProp ?? _localCenterBoost;
  const ox = orbXProp ?? _localOrbX;
  const oy = orbYProp ?? _localOrbY;
  // orbFixed is a SharedValue so useDerivedValue tracks it reactively — zero-frame-lag mode switch
  const of_ = orbFixedProp ?? _localOrbFixed;
  const os_ = orbSizeProp ?? _localOrbSize;
  const ec_ = edgeContactProp ?? _localEdgeContact;
  const winOpacity = useSharedValue(0);
  const pulse = useSharedValue(0);
  const seed = useSharedValue(Math.random() * 1000);

  useEffect(() => {
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(winOpacity);
      cancelAnimation(seed);
      // Cancel local fallbacks even though BattleScreen provides the real values —
      // every useSharedValue created here must be cancelled here (ownership rule).
      cancelAnimation(_localCenterBoost);
      cancelAnimation(_localOrbX);
      cancelAnimation(_localOrbY);
      cancelAnimation(_localOrbFixed);
      cancelAnimation(_localOrbSize);
      cancelAnimation(_localEdgeContact);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const winOverlayStyle = useAnimatedStyle(() => ({ opacity: winOpacity.value }));

  const uniforms = useDerivedValue(() => ({
    resolution: [width, height],
    time: time.value,
    progress: sessionProgress.value,
    pulse: pulse.value,
    seed: seed.value,
    theme: theme,
    centerBoost: boost.value,
    // orbOffset converts pixel-from-centre to shader space: divide by height
    // (p_base x-scale = aspect = width/height, so px/height matches p_base units)
    orbOffset: [ox.value / height, oy.value / height],
    orbFixed: of_.value,
    orbSize: os_.value,
    edgeContact: ec_.value,
  }));

  useAnimatedReaction(
    () => sessionProgress.value,
    (current, previous) => {
      if (current >= 1.0 && (previous ?? 0) < 1.0) {
        winOpacity.value = withSequence(
          withDelay(WIN_HOLD_CLEAR_MS, withTiming(1, { duration: WIN_FADE_WHITE_MS })),
          withDelay(
            WIN_HOLD_WHITE_MS,
            withTiming(0, { duration: WIN_FADE_BACK_MS }, (finished) => {
              if (finished && onWinAnimationComplete) runOnJS(onWinAnimationComplete)();
            })
          )
        );
      }
    },
    [onWinAnimationComplete]
  );

  useEffect(() => {
    if (pulseCount > 0) {
      pulse.value = 0;
      pulse.value = withTiming(MILESTONE_PULSE_TARGET, { duration: MILESTONE_PULSE_DURATION_MS, easing: Easing.out(Easing.quad) });
    }
  }, [pulseCount]); // eslint-disable-line react-hooks/exhaustive-deps — pulse is a stable SharedValue ref; omitting it is intentional

  return (
    <View style={styles.container}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Fill>
          <Shader source={runtimeEffect} uniforms={uniforms} />
        </Fill>
      </Canvas>
      <Animated.View
        style={[styles.winOverlay, winOverlayStyle]}
        pointerEvents="none"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0D0D0D' },
  winOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: '#FFFFFF' },
});