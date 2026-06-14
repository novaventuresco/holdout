# BattleVisual Shader Tuning Guide
## Step-by-Step Plan for Claude Code

> **How to use this file:** Work through each phase in order. Every step is a hot-reload
> change — no new EAS builds required after the dev client is installed. Show George the
> result after each step before proceeding to the next.

---

## Before You Start — Reference Table

Run this first. Do not skip it.

```
Read the SHADER_SRC constant in src/animations/BattleVisual.tsx.
List every numeric constant and coefficient in the shader with:
- Its current value
- What visual property it controls in plain language
- What increasing vs decreasing it would do visually

Format as a reference table. Do not change anything yet.
```

Save the output — it is the map for all tuning that follows.

---

## Phase 1: Boundary Edge

**Goal:** Make the edge between amber and center feel alive and irregular,
not like a hard circle.

**Why first:** The boundary is the most visible quality signal. If it looks
geometric, the whole visual looks like a gradient regardless of how good
the amber is.

### Step 1.1 — Assess current boundary

```
In BattleVisual.tsx, find the smoothstep call that creates centerMask.
Show me the current values for the transition width (the +X and -X in
smoothstep(boundary+X, boundary-X, dist)).
Tell me what it currently looks like in terms of softness — is it a
hard edge, a soft gradient, or something in between?
```

### Step 1.2 — Increase boundary breathing

```
Increase the noise displacement coefficient on the boundary variable.
Current value is approximately 0.12. Try 0.20.

This controls how much the noise pushes and pulls the edge — higher
values make the boundary more irregular and alive.

Change only this one value. Tell me the before and after.
Hot-reload and show me the result at 50% progress (8 min preset).
```

### Step 1.3 — Soften the edge transition

```
Adjust the smoothstep transition width on the centerMask to make the
boundary softer — a wider blend zone between amber and center.

The current value is smoothstep(boundary+X, boundary-X, dist).
Try X = 0.07 (wider = softer edge).

Tell me the new value. Test at 50% progress.
```

**Checkpoint:** At 50% progress, the boundary between amber and center
should look like a breathing, irregular edge — not a circle. If it still
looks geometric, increase the displacement coefficient further (try 0.25).

---

## Phase 2: Amber Glow at the Inner Edge

**Goal:** The amber should be brightest just where it meets the center —
like metal glowing at the point of maximum heat. This is the single biggest
difference between flat orange paint and luminous fire.

### Step 2.1 — Add inner glow zone

```
Add a glow mask to the amber color calculation in the shader.

After the boundary is calculated, create a glowZone variable:
  float glowZone = smoothstep(boundary + 0.12, boundary, dist);

Multiply the amber brightness by (1.0 + glowZone * 0.6) so that amber
pixels close to the center boundary are 60% brighter than amber pixels
far from it.

The inner edge of the amber should now look like it's on fire — bright
and luminous — while the amber at the screen edges is deeper and darker.

Tell me exactly what you added and where. Hot-reload and test at 33%
progress (4 min preset) and 67% progress (12 min preset).
```

### Step 2.2 — Tune the glow intensity

```
The inner amber glow is currently at 0.6 multiplier (60% brighter
at the boundary).

If the glow looks too blown out or unrealistic: reduce to 0.4.
If the glow is barely visible: increase to 0.8.

Adjust based on what George sees after Step 2.1.
Tell me the new value and what changed visually.
```

**Checkpoint:** Looking at 33% progress, the amber touching the center
boundary should look noticeably more luminous than the amber at the top
and bottom edges of the screen.

---

## Phase 3: Vignette (Depth)

**Goal:** Make the amber feel deep rather than flat. Darkest at the corners,
brightest approaching the center boundary. Like looking into a furnace.

### Step 3.1 — Add corner vignette

```
Add a vignette multiplier to the amber color calculation.

After normalizing coordinates, compute:
  float2 vigCoord = fragCoord / resolution - 0.5;
  float vignette = 1.0 - smoothstep(0.3, 0.7, length(vigCoord * float2(1.0, 1.6)));
  vignette = max(vignette, 0.15);

Multiply the ambient amber color (the portions away from the glow zone)
by this vignette value.

This darkens the corners and outer edges while leaving the inner boundary
zone at full brightness.

Confirm what changed and where in the code. Test at 0% progress (0 min
— when amber fills the screen this effect is most visible).
```

### Step 3.2 — Tune vignette strength

```
The vignette currently transitions from full brightness to 15% brightness
at the corners (max(vignette, 0.15)).

If the corners are too dark and the screen feels black: raise the floor
to 0.25.
If the depth effect is barely noticeable: lower the floor to 0.10 and
increase the smoothstep upper range from 0.7 to 0.8.

Adjust based on George's feedback. Tell me the change.
```

**Checkpoint:** At 0% progress with amber filling the screen, the four
corners should be visibly darker than the zone just outside the center.
The visual should look three-dimensional — like depth, not like a flat
panel of orange.

---

## Phase 4: Center Bloom

**Goal:** Make the white center feel like a real light source — light that
bleeds into the surrounding amber, slightly brightening and warming it.

### Step 4.1 — Add bloom falloff

```
Add a bloom pass after the main color calculation.

Compute center distance from the normalized center coordinate:
  float centerDist = length(centeredCoords);

Create a bloom value:
  float bloom = exp(-centerDist * 8.0) * 0.35;

Add this bloom to the final color's RGB channels before output:
  color += float3(bloom * 1.0, bloom * 0.85, bloom * 0.5);

This adds warm white-amber light that radiates from the center outward,
brightest at the center and falling off exponentially with distance.
The color tint (1.0 / 0.85 / 0.5 ratio) gives it a warm quality that
transitions from white at the center to warm amber in the bloom falloff.

Confirm the exact code added. Test at 67% progress (12 min) where center
and amber are both clearly visible.
```

### Step 4.2 — Tune bloom intensity and spread

```
The bloom has two controls:
1. The falloff rate (currently 8.0) — higher number = tighter bloom,
   lower = wider spread
2. The intensity multiplier (currently 0.35) — how bright the bloom is

If the bloom is washing out the amber near the center: reduce intensity
to 0.20 or increase falloff to 12.0.
If the bloom is barely visible: reduce falloff to 6.0 or increase
intensity to 0.45.

Test specifically at 50% progress where the boundary zone is most
visible. Adjust one value at a time.
```

**Checkpoint:** At 50% progress, the amber immediately surrounding the
white center should look slightly warmer and brighter than the amber
far from the center — as if the white center is emitting light that
touches everything near it.

---

## Phase 5: Asymmetric Boundary

**Goal:** The boundary between amber and center should not be a perfect
circle. It should be slightly taller than it is wide — like an eye shape
at mid-session — and it should breathe slowly.

This matches the Gemini reference image where the amber presses more
aggressively from the top and bottom.

### Step 5.1 — Add vertical compression

```
In the boundary distance calculation, apply an aspect-ratio-aware
distortion to the distance function.

Instead of:
  float dist = length(centeredCoords);

Use:
  float2 distorted = centeredCoords * float2(1.0, 1.2);
  float dist = length(distorted);

This compresses the vertical axis by a factor of 1.2, making the
boundary appear to press harder from the top and bottom than from
the sides. The amber will have more presence vertically.

Confirm the change. Test at 50% progress — the boundary should look
more like an eye or oval than a circle.
```

### Step 5.2 — Add slow breathing to the asymmetry

```
Make the vertical compression factor vary slowly with time so the
shape breathes rather than being statically oval.

Replace the fixed 1.2 with:
  float vertFactor = 1.15 + sin(time * 0.08) * 0.08;
  float2 distorted = centeredCoords * float2(1.0, vertFactor);

This oscillates the vertical factor between 1.07 and 1.23 on a slow
cycle, making the entire boundary mass appear to breathe as one organism.

Confirm the change. The breathing cycle should be slow — roughly 12-15
seconds for a full oscillation. If it's too fast, reduce 0.08 to 0.05.
```

**Checkpoint:** At 50% progress, the boundary should look like a softly
breathing oval, not a circle. The amber should feel like it has a directionality —
pressing harder from the top and bottom.

---

## Phase 6: Ember Sparks (Polish)

**Goal:** Add small bright points scattered through the amber — individual
sparks that appear briefly and fade. Like looking into a real fire.

This is a polish step. Only do it after Phases 1-5 are confirmed looking good.

### Step 6.1 — Add sparse ember layer

```
Add an ember layer to the shader — small bright points in the amber zone.

After the main turbulence calculation, add:

  // High-frequency noise for ember positions
  float emberNoise = noise(fragCoord * 12.0 + time * 0.3);
  float emberNoise2 = noise(fragCoord * 8.0 - time * 0.2);
  float emberMask = step(0.87, emberNoise * emberNoise2);

  // Only show embers in the amber zone, not in center or background
  float amberZoneMask = (1.0 - centerMask) * amberPresence;
  float embers = emberMask * amberZoneMask;

  // Add embers as bright amber-white points
  color += float3(embers * 1.2, embers * 0.7, embers * 0.1);

The step(0.87, ...) threshold means only the top 13% of noise values
become embers — making them sparse. Adjust the threshold:
  Higher (0.92) = fewer, rarer sparks
  Lower (0.80) = more numerous sparks

Confirm the code. Test at 33% progress where amber is most present.
```

### Step 6.2 — Tune ember density and brightness

```
The embers have two main controls:
1. The step threshold (currently 0.87) — controls sparsity
2. The brightness multiplier (currently 1.2 / 0.7 / 0.1) — controls
   how bright and what color

If embers look too numerous and distracting: raise threshold to 0.91.
If embers are invisible: lower threshold to 0.82.
If embers look too white (not amber enough): reduce the first multiplier
from 1.2 to 0.9 and the second from 0.7 to 0.4.

Adjust based on George's feedback after Step 6.1.
```

**Checkpoint:** Embers should be noticeable when you look for them but
not distracting during a normal hold session. They should feel like
they belong to the fire, not like a separate effect layered on top.

---

## Phase 7: Final Integration Check

Run these after all phases are complete.

### Step 7.1 — Full session walk-through

```
Without changing any code, walk through each preset in the TestScreen:

1. 0 min (start): Amber should fill nearly the entire screen with a
   tiny luminous center. Vignette darkens corners. Turbulence moves.

2. 4 min (33%): Amber dominant but center clearly present and growing.
   Inner glow visible at boundary.

3. 8 min (50%): The turn is visible — center and amber roughly balanced.
   Asymmetric oval boundary. Breathing motion visible.

4. 12 min (67%): Center dominant. Amber compressed but still active
   with turbulence and embers.

5. 16 min (83%): Amber reduced to edges and corners. Bloom effect most
   visible — center light touching remaining amber.

6. Win (20 min): Amber gone. Win sequence fires correctly.

For each preset, tell me what you observe and flag anything that
looks wrong or inconsistent.
```

### Step 7.2 — Performance check

```
Profile the shader performance.

Add a frame counter to TestScreen that displays the current FPS using
requestAnimationFrame timing. Run the animation at 50% progress for
30 seconds and report the sustained FPS.

Target: 60fps sustained on the test device.

If FPS drops below 55fps:
1. Reduce FBM octave count from 4 to 3
2. Remove the ember layer (Phase 6) — it adds per-pixel sampling cost
3. Reduce the bloom falloff sampling if it was implemented as multi-sample

Tell me which optimization was applied and what FPS was achieved after.
```

### Step 7.3 — Drain animation check

```
Using the TestScreen "Simulate drain" button, trigger the gave-in
animation from 50% progress.

The amber should re-advance organically over approximately 5 seconds.
The turbulence should continue moving during the drain — the amber
should not freeze and slide, it should grow back while remaining alive.

If the drain looks mechanical (amber sliding in as a static shape):
Make sure sessionProgress animating backward still feeds into the
uniforms correctly via useDerivedValue. The turbulence is driven by
time (always running), not by progress — so it should remain active
during drain automatically. If it is freezing, check the time uniform
clock is not pausing when progress changes direction.
```

---

## Reference: All Tunable Values

After running the initial reference table prompt, fill this in as a
working document during the tuning session.

| Variable | Location in Shader | Current Value | Controls | Notes |
|----------|-------------------|---------------|----------|-------|
| FBM octaves | fbm() function | | Texture detail | 4 = detailed, 3 = smoother |
| Turbulence scale 1 | fbm call 1 | | Coarseness | Higher = finer detail |
| Turbulence scale 2 | fbm call 2 | | Coarseness | Second layer |
| Boundary displacement | boundary += ... | ~0.12 | Edge irregularity | Higher = more alive |
| Drift vector 1 | time * ... | | Flow direction 1 | Speed and angle |
| Drift vector 2 | time * ... | | Flow direction 2 | Counter-flow |
| Smoothstep width | smoothstep(b+X, b-X) | | Edge softness | Higher = softer |
| Inner glow multiplier | Phase 2 | 0.6 | Glow intensity | |
| Vignette floor | Phase 3 | 0.15 | Corner darkness | |
| Bloom falloff | Phase 4 | 8.0 | Bloom spread | |
| Bloom intensity | Phase 4 | 0.35 | Bloom brightness | |
| Vertical factor | Phase 5 | 1.2 | Oval asymmetry | |
| Breathing speed | Phase 5 | 0.08 | Breath cycle | |
| Ember threshold | Phase 6 | 0.87 | Ember density | |

---

*BattleVisual Shader Tuning · Holdout · Nova Ventures Co. · 2026*
