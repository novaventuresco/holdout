// PARKED (2026-04-08): Active mode v1 drag-to-center delivery.
// Replaced by SpatialBalance (gyroscope). See docs/architecture/decisions.md.
// Do not delete — preserved as reference implementation.

/**
 * BallsLayer — Active mode interactive overlay.
 *
 * Orbs match the center-light palette (white→teal for fire/void, amber→orange for ember).
 * Dragging an orb to center delivers it — incrementing deliveryProgress.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  cancelAnimation,
  makeMutable,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';

import type { SharedValue } from 'react-native-reanimated';


// ── SHADER ───────────────────────────────────────────────────────────────────
// Organic blob — center-light palette per theme.
// Fire/void: white core → teal/cyan. Ember: amber-gold core → orange.

const MINI_SHADER_SRC = `
uniform float2 resolution;
uniform float glow;
uniform float seed;
uniform float time;
uniform float theme;

float hash(float2 p) {
    return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453);
}

float noise(float2 p) {
    float2 i = floor(p);
    float2 f = fract(p);
    float2 u = f * f * (3.0 - 2.0 * f);
    return mix(
        mix(hash(i), hash(i + float2(1.0, 0.0)), u.x),
        mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x),
        u.y
    );
}

float fbm(float2 p) {
    float v = 0.0; float a = 0.5;
    for (int i = 0; i < 4; i++) {
        v += a * noise(p);
        p *= 2.0;
        p = float2(p.x + p.y * 0.35, p.y - p.x * 0.35);
        a *= 0.5;
    }
    return v;
}

half4 main(float2 pos) {
    float2 center = resolution * 0.5;
    float2 p = (pos - center) / resolution.y * 2.0;

    float2 drift = float2(
        fbm(p * 3.0 + seed) - 0.5,
        fbm(p * 3.0 - seed) - 0.5
    ) * 0.12;
    float2 timeDrift = float2(
        sin(time * 0.15 + seed * 2.3),
        cos(time * 0.12 + seed * 1.7)
    ) * 0.025;

    float2 q = p + drift + timeDrift;
    float r = length(q);

    float bodyNoise   = fbm(q * 5.0 + seed * 0.17);
    float edgeBreakup = fbm(q * 9.0 - seed * 0.11);

    float core   = 1.0 - smoothstep(0.00, 0.16, r);
    float body   = 1.0 - smoothstep(0.10, 0.34, r + (bodyNoise - 0.5) * 0.10);
    float haze   = 1.0 - smoothstep(0.22, 0.55, r + (edgeBreakup - 0.5) * 0.06);
    float corona = 1.0 - smoothstep(0.28, 0.70, r);

    float flicker       = 0.85 + 0.15 * sin(seed * 6.1 + glow * 5.0);
    float pulse         = 0.58 + 0.42 * glow;
    float coronaContrib = corona * (0.14 + 0.50 * glow);
    float alpha = (core * 0.95 + body * 0.70 + haze * 0.22 + coronaContrib) * flicker * pulse;
    alpha = clamp(alpha, 0.0, 1.0);

    // Center-light palettes — mirrors BattleVisual per theme
    half3 coreColor, edgeColor;
    if (theme < 0.5) {
        coreColor = half3(1.00, 1.00, 1.00);   // Fire: white → teal
        edgeColor = half3(0.00, 0.75, 0.85);
    } else if (theme < 1.5) {
        coreColor = half3(1.00, 1.00, 1.00);   // Void: white → electric cyan
        edgeColor = half3(0.00, 0.85, 0.95);
    } else {
        coreColor = half3(1.00, 0.95, 0.30);   // Ember: amber-gold → orange
        edgeColor = half3(1.00, 0.50, 0.05);
    }

    float coreDepth = clamp(r / 0.35, 0.0, 1.0);
    half3 color = mix(coreColor, edgeColor, pow(half(coreDepth), 1.2));
    color += edgeColor * half(haze * (0.30 + 0.50 * glow));

    return half4(color * alpha, alpha);
}
`;

const miniEffect = Skia.RuntimeEffect.Make(MINI_SHADER_SRC)!;


// ── TYPES ────────────────────────────────────────────────────────────────────

type Ball = {
  id: number;
  hoverX: number;
  hoverY: number;
  visualScale: number;
  seed: number;
  sharedOpacity: SharedValue<number>;
  sharedGlow: SharedValue<number>;
  sharedScale: SharedValue<number>;
  delivered: boolean;
};

interface BallItemProps {
  ball: Ball;
  cx: number;
  cy: number;
  time: SharedValue<number>;
  theme: number;
  deliveryProgress: SharedValue<number>;
  onRemove: (id: number) => void;
}

interface BallsLayerProps {
  time: SharedValue<number>;
  theme: number;
  deliveryProgress: SharedValue<number>;
  activeIntensity: SharedValue<number>;
}


// ── CONSTANTS ────────────────────────────────────────────────────────────────

const SIZE = 64;
const HALF = SIZE / 2;
const CENTER_RADIUS = 80;
const SPAWN_MS = 3000;
const MAX_BALLS_MIN = 2;
const MAX_BALLS_MAX = 10;
const DELIVERY_INC = 0.005;
const DELIVERY_COOLDOWN_MS = 5000;  // pause after each delivery before next spawn
const BALL_LIFETIME_MIN_MS = 30000;
const BALL_LIFETIME_MAX_MS = 45000;

let _id = 1;


// ── BALL ITEM ────────────────────────────────────────────────────────────────

function BallItem({ ball, cx, cy, time, theme, deliveryProgress, onRemove }: BallItemProps) {
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const dragBoost = useSharedValue(0);

  const uniforms = useDerivedValue(() => ({
    resolution: [SIZE, SIZE],
    glow: Math.min(ball.sharedGlow.value + dragBoost.value, 1.0),
    seed: ball.seed,
    time: time.value,
    theme,
  }));

  const pan = Gesture.Pan()
    .onBegin(() => {
      'worklet';
      dragBoost.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((e) => {
      'worklet';
      panX.value = e.translationX;
      panY.value = e.translationY;
    })
    .onEnd(() => {
      'worklet';
      dragBoost.value = withTiming(0, { duration: 300 });

      const dx = (ball.hoverX + panX.value) - cx;
      const dy = (ball.hoverY + panY.value) - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < CENTER_RADIUS && !ball.delivered) {
        ball.delivered = true;
        ball.sharedScale.value = withTiming(0, { duration: 250, easing: Easing.in(Easing.quad) });
        ball.sharedOpacity.value = withTiming(0, { duration: 200 });
        deliveryProgress.value = Math.min(deliveryProgress.value + DELIVERY_INC, 1.0);
        runOnJS(onRemove)(ball.id);
      } else {
        panX.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
        panY.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.quad) });
      }
    });

  // Orb — gentle float via time-driven micro-drift
  const ballStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: panX.value + Math.sin(time.value * 2.0 + ball.seed) * 5 },
      { translateY: panY.value + Math.cos(time.value * 1.5 + ball.seed * 1.7) * 3 },
      { scale: ball.sharedScale.value * ball.visualScale * (1.0 + dragBoost.value * 0.3) },
    ],
    opacity: ball.sharedOpacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[styles.ball, { left: ball.hoverX - HALF, top: ball.hoverY - HALF }, ballStyle]}
      >
        <Canvas style={styles.canvas}>
          <Fill>
            <Shader source={miniEffect} uniforms={uniforms} />
          </Fill>
        </Canvas>
      </Animated.View>
    </GestureDetector>
  );
}


// ── MAIN LAYER ───────────────────────────────────────────────────────────────

export default function BallsLayer({
  time,
  theme,
  deliveryProgress,
  activeIntensity,
}: BallsLayerProps) {
  const { width, height } = useWindowDimensions();

  const ballsRef = useRef<Ball[]>([]);
  const expireTimers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());
  const lastDeliveryAt = useRef(0);
  const [, setTick] = useState(0);

  const cx = width / 2;
  const cy = height / 2;
  const edgeRadius = Math.min(cx, cy);

  const remove = useCallback((id: number) => {
    const t = expireTimers.current.get(id);
    if (t !== undefined) { clearTimeout(t); expireTimers.current.delete(id); }
    const ball = ballsRef.current.find((b) => b.id === id);
    if (ball) {
      if (ball.delivered) lastDeliveryAt.current = Date.now();
      cancelAnimation(ball.sharedOpacity);
      cancelAnimation(ball.sharedGlow);
      cancelAnimation(ball.sharedScale);
    }
    ballsRef.current = ballsRef.current.filter((b) => b.id !== id);
    setTick((t) => t + 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const autoExpire = useCallback((id: number) => {
    expireTimers.current.delete(id);
    const ball = ballsRef.current.find((b) => b.id === id);
    if (!ball || ball.delivered) return;
    ball.sharedScale.value = withTiming(0, { duration: 700, easing: Easing.in(Easing.quad) });
    ball.sharedOpacity.value = withTiming(0, { duration: 600 }, (finished) => {
      'worklet';
      if (finished) runOnJS(remove)(id);
    });
  }, [remove]);

  const spawn = useCallback(() => {
    const maxBalls = Math.round(MAX_BALLS_MIN + activeIntensity.value * (MAX_BALLS_MAX - MAX_BALLS_MIN));
    if (ballsRef.current.length >= maxBalls) return;
    if (Date.now() - lastDeliveryAt.current < DELIVERY_COOLDOWN_MS) return;

    const angle = Math.random() * Math.PI * 2;
    const r = edgeRadius * (0.55 + Math.random() * 0.27);
    let hoverX = cx + Math.cos(angle) * r;
    let hoverY = cy + Math.sin(angle) * r;

    const tooClose = ballsRef.current.some((b) => {
      const dx = b.hoverX - hoverX;
      const dy = b.hoverY - hoverY;
      return Math.sqrt(dx * dx + dy * dy) < 60;
    });
    if (tooClose) {
      const a2 = (angle + Math.PI * 0.8 + Math.random() * 0.4) % (Math.PI * 2);
      hoverX = cx + Math.cos(a2) * r;
      hoverY = cy + Math.sin(a2) * r;
    }

    const sharedOpacity = makeMutable(0);
    const sharedGlow = makeMutable(0.3);
    const sharedScale = makeMutable(0);

    const ball: Ball = {
      id: _id++,
      hoverX,
      hoverY,
      visualScale: 0.70 + Math.random() * 0.30,
      seed: Math.random() * 1000,
      sharedOpacity,
      sharedGlow,
      sharedScale,
      delivered: false,
    };

    sharedOpacity.value = withTiming(1, { duration: 600 });
    sharedScale.value = withTiming(1, { duration: 800, easing: Easing.out(Easing.cubic) });
    sharedGlow.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.25, { duration: 1200 }),
      ),
      -1,
      true,
    );

    const lifetime = BALL_LIFETIME_MIN_MS + Math.random() * (BALL_LIFETIME_MAX_MS - BALL_LIFETIME_MIN_MS);
    const timer = setTimeout(() => autoExpire(ball.id), 800 + lifetime);
    expireTimers.current.set(ball.id, timer);

    ballsRef.current.push(ball);
    setTick((t) => t + 1);
  }, [cx, cy, edgeRadius, activeIntensity, autoExpire]);

  useEffect(() => {
    spawn();
    const id = setInterval(spawn, SPAWN_MS);
    return () => {
      clearInterval(id);
      expireTimers.current.forEach((t) => clearTimeout(t));
      expireTimers.current.clear();
      ballsRef.current.forEach((ball) => {
        cancelAnimation(ball.sharedOpacity);
        cancelAnimation(ball.sharedGlow);
        cancelAnimation(ball.sharedScale);
      });
      ballsRef.current = [];
    };
  }, [spawn]);

  if (!miniEffect) return null;

  return (
    <Animated.View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {ballsRef.current.map((ball) => (
        <BallItem
          key={ball.id}
          ball={ball}
          cx={cx}
          cy={cy}
          time={time}
          theme={theme}
          deliveryProgress={deliveryProgress}
          onRemove={remove}
        />
      ))}
    </Animated.View>
  );
}


// ── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  ball: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
  },
  canvas: {
    width: SIZE,
    height: SIZE,
  },
});
