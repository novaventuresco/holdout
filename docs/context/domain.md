# Holdout — Domain Knowledge
## Source of truth for coach voice, science, and product philosophy
### Nova Ventures Co. · 2026

Read this before writing any coach copy, designing any visual behavior, or
deciding how a session result should be handled.

---

## 1. THE CORE MECHANISM

### App Scope — Generalized to Habit-Driven Urges

The founding science in this section is drawn from food craving and addiction research.
The neurological mechanism (conditioned cue → dopamine signal → 15–20 min collapse window
when not reinforced) applies broadly to any habitual urge: food, alcohol, nicotine,
scrolling, etc.

User-facing copy — onboarding, home screen taglines, coach voice — is generalized to
"habit-driven urges" and "it." Do not introduce food-specific language into any string
displayed to users. The domain science below is the internal model; the product voice
is substance-agnostic.

### Why This App Works: The Neuroscience

Evening food cravings in non-hungry individuals are dopamine-driven, not metabolic.
The brain's reward system fires in response to a conditioned cue — sitting on the
couch, turning on the TV, a specific time of evening, stress wind-down — triggering
a craving signal that mimics physical urgency. The food is almost incidental. The
reward loop is the target.

This is the same neurological mechanism as drug cravings. The brain has associated
a cue with a reward, and now fires the wanting signal automatically when the cue
appears. The user's rational brain is on our side — the craving is not them, it is
a conditioned reflex.

**Key insight for coach language:** The user is not weak. They are experiencing an
automated neurological response. The job is to interrupt the automation long enough
for it to lose power. That is all.

### The 20-Minute Collapse Window

Dopamine-driven cravings peak and then subside within 15–20 minutes when not
reinforced by action. This is documented in addiction literature (ACT — Acceptance
and Commitment Therapy) and behavioral nutrition research.

The collapse is not linear:
- **Minutes 0–5:** Peak intensity. Brain is loudest. Most dangerous for compliance.
- **Minutes 5–8:** Still intense but plateauing. Resolve often weakening here.
- **Minutes 8–14:** The danger zone. Intensity hasn't fully dropped but initial
  resolve has weakened. Users who make it to minute 12 almost always make it to 20.
- **Minutes 14–20:** Rapid decline. The craving is losing its neurological fuel.
- **Minute 20+:** The signal has collapsed. The food has no more pull.

**Key insight for product:** 20 minutes is not arbitrary. It is the biologically
grounded hold time — not 10 (craving still peaking), not 30 (compliance collapses).
The session length is a clinical decision, not a design choice.

### Modality-Specific Hijacking

Different cravings require different interference methods to scramble the neural signal:

**Sensory Cravings (Salty/Crunchy/Sweet):** These involve motor-cortex "reaching" urges.
They are countered by **Kinetic Feedback** — high-frequency tapping or rhythmic
micro-gestures that disrupt the physical urge at the motor level.

**Habit/Environment Cravings:** These involve spatial imagery. They are countered by
**Visual Tracking** — forcing the eyes to follow moving fragments — to maximize
cognitive interference by occupying the same brain resources the craving uses.

This distinction informs the visual behavior and the on-demand SUPPORT ME mechanic.
Note: craving-type personalization (routing interference channel by stated type) is
deferred to Phase 3 — see features.md P3-02. The current app delivers a single
consistent experience covering the visual-spatial hijack mechanism.

### Urge Surfing (ACT Framework)

Acceptance and Commitment Therapy treats cravings as waves — they rise, peak, and
fall. The key clinical finding: cravings are not conquered by willpower. They are
outlasted. The user does not need to suppress the craving or make it go away. They
need to observe it without acting.

The technique is called urge surfing: treating the sensation as something external
to watch rather than something internal to fight. This is precisely what the visual
battle mechanic provides — the craving is externalised as the amber force. The user
watches it, rather than fighting it inside their own head.

**Key insight for coach language:** The coach never tells the user to suppress or
ignore the craving. It acknowledges it directly and reframes the task: not
suppression, but endurance. "You don't have to make it go away. You just have to
hold."

### Cognitive Interference (The Visual Hijack)

Research shows that visual-spatial cognitive engagement occupies the same brain
resources used to imagine food. Playing Tetris for 3 minutes measurably reduces
craving intensity (Plymouth University, 2015). The iCrave app (2014 academic trial)
showed significant craving reduction by redirecting cognitive resources during
active cravings.

The mechanism: the brain cannot simultaneously imagine food vividly and process a
competing visual-spatial task. The battle visual is not decoration — it is a
cognitive intervention. Watching the unfolding battle occupies the exact brain
resources the craving uses. The engagement is effortless and automatic. No effort
required beyond staying on screen.

**Key insight for product:** The visual IS the treatment. It is not a timer with
a pretty background. Every second the user watches the amber pressing and the center
holding, their brain is less able to generate the vivid food imagery that sustains
the craving.

### Implementation Intention and Identity Framing

James Clear's synthesis of behavioral research (Atomic Habits) shows that the most
durable behavior change comes from identity-level shifts rather than outcome goals.
"I'm someone who holds against cravings" is more powerful than "I want to lose
weight." Every completed session is evidence for the identity, not just a win on a
scoreboard.

The visual record of past sessions — won battles shown as clear screens, gave-in
sessions as partially cleared ones — is identity evidence. The streak is not
gamification. It is proof of who the user is becoming.

---

## 2. APPLIED BEHAVIORAL PRINCIPLES

### 2.1 The Hold Itself Is the Treatment, Not the Reward for It

Most people believe the benefit of resisting a craving comes afterward — that they
endure the discomfort and then receive the payoff of having survived it. This
framing is wrong, and the coach should correct it.

The neuroscience: the weakening of a dopamine habit loop happens during the period
of resistance — not afterward. Every second the user remains on screen with the
craving present and unacted-upon, the associative strength between the cue and the
reward response is being actively reduced. The amber retreating on screen is not a
metaphor — it is an accurate visual representation of what is happening in the
brain's reward circuitry in real time.

This reframe transforms the emotional quality of the 20 minutes from waiting room
to active treatment. The user is not enduring time until something is over. They are
doing something that is working right now, this second.

**Coach line this unlocks at minute 8:**
"The longer you hold, the weaker it gets. Not later — right now. You're watching
it happen."

### 2.2 The Feeling of Intensity Is Confirmation, Not Warning

At minute 8 — the hardest point on the craving curve — most users interpret the
intensity of the sensation as a signal that something is wrong, or that the hold
isn't working. The opposite is true.

The craving feels strongest at this moment because the brain's dopamine system is
making its most urgent bid to close the loop. Intensity at minute 8 is not the
craving winning — it is the craving at maximum effort, right before it begins to
lose. The pull the user feels is the habit loop at its peak, which means it is
about to fall.

Reframing that feeling from threat to confirmation changes the user's relationship
to the hardest moment in the session. They stop trying to escape the sensation and
start reading it as information: the harder it pulls, the closer the turn is.

**Coach line this unlocks at minute 8:**
"That pull you're feeling right now? That's it at maximum. It goes down from here."

### 2.3 Not All Cravings Work the Same Way

There are three distinct types that operate through different mechanisms and respond
to different framings. Note: craving-type coach routing is deferred to Phase 3
(features.md P3-02). The current app delivers a single consistent experience.

**Psychological / habit craving** — driven by conditioned cues. The brain has
associated a time, place, or emotional state (couch, evening, TV, end of a long
day) with a reward, and now fires the wanting signal automatically when that cue
appears. Sweet and comfort food cravings are typically this type. The trigger is
the cue itself, not hunger. The 20-minute hold works directly on this mechanism —
outlasting the dopamine signal until it collapses without reinforcement.

**Sensory craving** — driven by wanting a specific sensation rather than food per
se. Salty and crunchy cravings are typically this type. The brain is seeking oral
stimulation and the food is the vehicle. This type responds particularly well to
the cognitive interference effect — the visual battle partially displaces the
sensory imagery the craving depends on.

**Boredom / displacement craving** — the brain seeking stimulation during low-
engagement periods. Not hunger, not a specific food — reaching for something to do.
Common during passive activities like watching TV. The hold redirects the reaching
behavior onto the screen itself, which is what the user was already doing.

### 2.4 Trajectory Matters More Than Any Single Result

A single win or loss tells almost nothing about whether the underlying habit is
changing. What matters is the direction of the trend over multiple sessions.
Behavioral psychology research consistently shows that habit change is gradual and
non-linear — there will be gave-in sessions even as the pattern is genuinely
improving.

A user who held 3 of their first 10 sessions and now holds 7 of their last 10 is
genuinely improving — even if they gave-in last night. A static win rate percentage
hides this progress entirely and can discourage exactly the users who are making the
most meaningful change.

**Product application:** The history screen should surface trajectory, not just
current state. Compare the last 10 sessions against the first 10. Show the direction.
Language: "Your hold rate has improved over the last two weeks." More honest and more
motivating than a single percentage that punishes early struggles.

**The Conditioning Ledger (V2):** Instead of a pass/fail streak, progress is
visualized as a growing "Neural Map" or crystal structure — each session adds to the
structure regardless of outcome. The structure grows from conditioning work done, not
from perfect compliance.

**Minutes of Resistance:** A lifetime total of minutes spent in the 20-minute window.
Even if a session isn't completed, the user receives credit for every minute the habit
loop was weakened. A gave-in at minute 18 is still 18 minutes of conditioning logged.
This reframes partial sessions from failures into real, measurable progress.

---

## 3. PSYCHOLOGICAL TECHNIQUES FOR SURVIVING THE HARD MOMENTS

### 3.1 The First Wave of Urgency Is Not the Limit

When a craving arrives, the first wave of intensity feels like the maximum — like if
you don't act now, something unbearable will happen. Research on endurance and
tolerance consistently shows this is false. The first wave of urgency is the brain's
opening bid. People who have learned to sit with discomfort discover that after the
first wave passes, the next one is smaller. Then smaller again.

For Holdout users, minute 8 is the first wave. It feels like the top because it is
the loudest the craving gets. It is not the limit — it is the signal that the turn
is close.

**Coach line:** "That feeling isn't the top. It's the signal that you're close to
the turn."

### 3.2 Break the Time Down to What's Survivable Right Now

Twenty minutes feels like a long time when a craving is active. Four minutes to
the next coach mark does not. The psychological principle: people can endure almost
anything when the time horizon is small enough. The same 20 minutes that feels
impossible as a whole becomes completely manageable as a sequence of four-minute
windows.

The milestone structure already implements this. The coach language reinforces it
explicitly at the hardest moments — not "12 more minutes," but "just get to the
next mark."

**Coach line at minute 8:** "Not 12 more minutes. Just get to the next tap."

### 3.3 You Can't Control the Craving Arriving — Only What You Do With It

A craving is a conditioned response. It arrives automatically, triggered by a cue
the brain has learned to associate with reward. The user did not choose to have the
craving any more than they choose to blink when something moves toward their eye.
It is an automated reflex.

What the user can control is what happens next. Not acting on an automated reflex
is the skill being trained. The craving arriving is not a failure of willpower — it
is just the brain running its programming. The hold is the override.

This framing removes self-judgment entirely. The craving is not a character flaw.
It is a neurological pattern that weakens every time it goes unacted-on.

**Coach application:** Never frame the craving as something the user should be
ashamed of having. It arrived on its own. What they do for the next 20 minutes is
the only thing that matters.

### 3.4 Watching It Is Different From Fighting It

The instinct when an uncomfortable sensation arrives is to fight it — to push it
away, suppress it, reason it down. Research on craving and urge management shows
this instinct backfires. Actively fighting a craving directs cognitive attention
toward it, which reinforces it. The brain interprets the attention as importance
and amplifies the signal.

The more effective technique is observation rather than suppression: treating the
craving as something happening outside of you that you are watching. This is exactly
what the visual battle mechanic provides. The craving is externalised as the amber
force. The user is watching it rather than wrestling it inside their own head.

This is not a subtle distinction — it is the mechanism by which the visual provides
relief that a plain countdown timer cannot. The timer asks you to endure. The visual
gives the craving somewhere to be that isn't inside you.

---

## 4. THE VISUAL METAPHOR

### What It Represents

**The amber force** pressing in from the screen edges represents the craving.
Not the user's weakness. Not a villain. Just a force — external, mechanical,
already starting to lose the moment the user stays.

**The center force** (white/light) represents the user's sustained presence.
It does not grow because of willpower. It grows because the user is still here.
Staying is the action. The visual makes that action visible as it's happening.

**The retreating amber** is what the user is watching for 20 minutes. They can see
themselves winning in real time — the overcome feeling is shown, not told. The
amber getting smaller IS the associative pathway losing strength.

### Visual Behavior Over the Session

| Minutes | What's happening |
|---------|-----------------|
| 0–4 | Amber fills most of the screen pressing inward. Center is a small luminous dot. Peak intensity — the visual confirms what the user feels. |
| 4–8 | Amber advance slows. Visual tension at the boundary. The edge breathes slightly — neither force is winning clearly yet. |
| 8–14 | Center begins slowly reclaiming ground. Amber retreats incrementally — barely perceptible at first, clear by minute 12. |
| 14–20 | Center force clearly winning. Amber compressed toward edges. By minute 18: amber thin at edges only. |
| 20 | Amber pulses at edges, then gone. Screen holds clear for 3 seconds. |

**Movement is slow and organic.** Never mechanical, never snapping. Gradient position
is driven by `useDerivedValue` on the UI thread — continuous, framerate-independent,
no JS re-renders. `withTiming` is reserved for one-shot transitions only: the win
overlay fade (`winOpacity`) and the gave-in drain. The visual breathes.

**Won state:** Screen clear. Still. Complete. The overcome feeling is in the
stillness, not a celebration animation. No confetti. No flash. One coach close line.

**Gave-in state:** Session ends when user affirmatively taps GAVE IN and confirms
(two-stage). Center dims to grey, amber re-advances. "Session ended." No shame copy.
Stats update. Streak resets if not a planned skip. Return to home.

> **Implementation note:** GAVE IN is explicit via button — not inferred from
> a missed recommitment tap. The user must affirmatively end the session. This
> removes the anxiety of accidental timeouts while preserving the binary result.

### Color Reference

| Element | Color |
|---------|-------|
| Amber fire (hot peaks) | `#FFD94D` — near-yellow, highest turbulence |
| Amber fire (mid) | `#F26B04` — bright amber |
| Amber fire (deep) | `#591A00` — deep red-brown |
| Amber fire (trough) | `#0A0300` — near-black; blue-purple accent visible here |
| Blue-purple accent | Additive in darkest fire troughs — depth and contrast |
| Center force (bright center) | `#FFFFFF` |
| Center force (outer) | `#E0F0FF` — cool white edge |
| Background | `#0D0D0D` |
| Won state | `#FFFFFF` fading to `#E0F0FF` — still, complete |
| Gave-in drain | Amber re-advances, center dims to grey |

### Fire Texture

The amber force uses 4-octave FBM with per-octave angular rotation (each octave
rotated by `0.5 + i×0.3` radians before sampling) — this produces organic,
directional fire tongues rather than uniform cloud blobs. A heat-haze refraction
pass warps the sample coordinates (n1, n2 noise offsets applied to p_base → p_haze)
before the center boundary is evaluated, curling the tongues inward. The result:
amber that looks like it's pressing in, not drifting past.

### Visual Themes

Nine themes share the same shader architecture — only color ramps differ. The user
selects on HomeScreen; it persists in preferences and applies to each session.
Phase 2 themes (GLACIER through NEBULA) require EAS build for Skia shader device validation.

| Theme | Edge force | Center force | Emotional register |
|-------|-----------|-------------|-------------------|
| **FIRE** (default) | Amber/orange — classic hot pressure | White → cool teal | Warmth vs cold clarity |
| **VOID** | Deep navy → indigo → violet — cold cosmic darkness | White → cool teal | Cold pressure, same clarity |
| **EMBER** | Near-black — almost invisible pressure | Amber → orange → deep amber | Inverted: the craving energy is inside, being held |
| **GLACIER** | Ice-blue edges | Warm amber/gold — Fire inverted | Cold outside, warmth at center |
| **ABYSS** | Pitch-black edges | Bioluminescent cyan-green | Deep dark pressure, living light at core |
| **SOLAR** | Blazing gold-white edges | Deep violet/crimson | Raw solar pressure, cool dark core |
| **AURORA** | Electric green edges | Silver-pearl | Natural force, luminous stillness |
| **DUSK** | Rose/magenta edges | Warm gold | Soft pressure, golden warmth |
| **NEBULA** | Deep violet/hot-magenta edges | Electric ice-blue | Cosmic force, cold sharp clarity |

EMBER reverses the metaphor: the center holds the fire, the edges recede into
near-darkness. The visual pressure is internal — the user is containing something,
not being pressed upon. Both readings are truthful to the science; EMBER appeals to
users who feel the craving as something inside themselves rather than an external
force.

### Free vs. Premium Theme Split

Three themes are free: **FIRE**, **VOID**, **EMBER**. Six are locked behind a single
$4.99 non-consumable IAP ("Theme Pack"): **GLACIER**, **ABYSS**, **SOLAR**, **AURORA**,
**DUSK**, **NEBULA**. One purchase unlocks all six permanently.

All nine themes are shown on HomeScreen in a 3×3 grid. Premium swatches display a lock
icon and dim overlay; tapping opens the paywall. Once unlocked, `unlockedThemes` is
written to Preferences and the lock UI never appears again. The split was chosen so the
core mechanic (FIRE) and its two natural inversions (VOID/EMBER) are always accessible —
the premium themes are aesthetic variants, not functional unlocks.

---

## 5. SESSION DESIGN DECISIONS

### Why 20 Minutes (Not 10, Not 30)
- 10 minutes: craving still at peak intensity, session ends before natural collapse.
- 20 minutes: biologically grounded collapse window from ACT and behavioral nutrition research.
- 30 minutes: compliance collapses. Users give up before the session ends.

### Why the Coach Says "It" Not "Craving"
Saying "craving" re-activates the neural pathway associated with wanting. The word
is itself a cue. Calling it "it" — distant, object-like, already diminished —
removes the activation. This is consistent with ACT defusion techniques where
linguistic distancing from a sensation reduces its intensity.

### Why Gave-In Has Zero Shame Copy
A gave-in at minute 18 is 18 minutes of conditioning — the habit loop was weakened
for 18 minutes even if the session didn't complete. Shame copy prevents the user
from returning. Matter-of-fact logging keeps the streak intact as a concept (even
if the count resets) and removes the emotional cost of trying again tonight or
tomorrow.

### Why the Milestone System Uses Silent Coach Lines, Not Forced Interaction
The coach lines at minutes 4/8/12/16 fire silently — no tap required, no timeout
if missed. The user can also tap SUPPORT ME at any point for on-demand calibration.
Staying is visible in the visual, not measured by compliance. This is the active
agency model: the user chooses to stay, the coach confirms where they are.

---

## 6. THE COACH — COMPLETE SPECIFICATION

### Role
The coach provides one thing: location on the craving curve. Not motivation. Not
cheerleading. Not therapy. Information about where the user is in a known process
with a known outcome if they stay.

The user trusts the coach because the coach tells the truth about the difficulty,
not a softened version of it.

### Voice Principles
- Calibration statements, not motivation
- Under 15 words per line
- Never uses the word "craving" — says "it" (distant, object-like, already losing power)
- Zero judgment or disappointment on gave-in
- Silence between appearances is intentional — the coach speaks at inflection points only
- Draws on personal history once enough session data exists
- Corner man between rounds, not counsellor
- Never claim the user's current felt state — speak to time facts and universal truths only. "It eased," "it dropped," "you can feel it fading" assume an experience that may be wrong for this person right now. "You're past minute 8 — that's the hardest one" is always true regardless of what they feel.

### What the Coach Never Says
- "You've got this" — generic, meaningless
- "Be proud of yourself" — therapeutic
- "Take a deep breath" — mindfulness
- "You're doing great" — empty affirmation
- "Craving" — activates the pathway we are quieting
- Anything implying the user failed on a gave-in
- Anything soft, clinical, or wellness-adjacent
- Claims about the individual's felt experience: "it eased," "it dropped," "it peaked," "you can feel it working" — the coach cannot know what this specific person is feeling. Individual felt state is off-limits. Time facts and mechanism are always safe.
- The "never says craving" rule applies to every string displayed via the coach pill — including first-use mode instructions. A one-time instruction is visually indistinguishable from a calibration line and activates the same neural pathway. (P2-06 initially created an exception for PASSIVE_INSTRUCTION; reversed 2026-04-17.)

### Coach Lines by Minute Mark

Each milestone has a pool of 10 variants. Coach returns a random variant via Fisher-Yates
shuffle queue (every message appears once before any repeats) so sessions don't feel
scripted after repeated use.

**On-demand SUPPORT ME** uses a dedicated `supportMe` pool — not the same tap1–tap4 pools
as the auto-milestones. Both pools avoid specific minute numbers. The distinction is register:
tap1–tap4 fire at known moments and can reference what just happened ("first surge", "hardest
stretch"); supportMe fires on-demand at any moment, so all language uses relative position
("hardest stretch is behind you", "the turn is ahead") that is always accurate when tapped.
Three sub-pools per phase (early 0–8 min, mid 8–13 min, late 13–20 min), each split into two tiers:
- **first** — arc/position message for the initial tap ("where you are on the curve"). Delivered on the user's first SUPPORT ME tap of the session.
- **repeat** — persistence message for subsequent taps ("it can't build back from here"). For users tapping multiple times, restating position is less useful than confirming the process already underway.

The session-scoped `isRepeat` flag (not phase-scoped) means a user who tapped early and returns in the late phase still receives the repeat-tier message. Repeat-tier messages are accurate at any phase within their window. (Phase-scoped tracking deferred to Phase 3; see decisions.md ADR.)

**Session start (minute 0) — sample lines:**
- "It always peaks and falls in twenty minutes. That's the science. Stay."
- "The first few minutes are the loudest this gets. Just hold through them."
- "Nothing to do but stay here. That's it."

**Minute 4 — first calibration:**
The craving peaked in the first few minutes and got nothing back. The harder zone (minute 8)
is still ahead. Do NOT say "past the worst" — minute 8 is harder. Lead with what just happened:
they held through the opening surge.
- "You made it through the first surge. The harder part is still ahead. Hold."
- "Every time you hold through this, the next one starts a little weaker."
- "It peaked and got nothing from you. The harder stretch is still ahead."

**Minute 8 — hardest point, danger zone:**
This is the most important coach moment. Intensity here = craving at maximum effort, about to
fall. Reframe the feeling from threat to confirmation: the harder it feels, the closer the turn.
- "This is the hardest it gets. It won't push harder than this. Hold."
- "The harder it feels right now, the closer you are to through it."
- "This is where most people stop. You're still here."
- "Whatever you're feeling right now, that's it at its worst. It goes down from here."

**Minute 12 — past the peak:**
Past here the craving can't rebuild. Social proof is strong at this moment.
- "Almost everyone who gets here makes it through. You're here."
- "It's already lost. You're just finishing the round."
- "Past here, it can't come back. Every time, that's true."

**Minute 16 — near end:**
The craving is spent. Frame this as time running out, not effort continuing.
- "This isn't effort anymore. It's just the clock running out."
- "Finish this and the next one starts from a slightly weaker place."
- "You're watching the last of it. Don't move."

**Win close (minute 20):**
- "That's 20 minutes. You held it."
- "Done. It ran twenty minutes without getting what it wanted."
- "Twenty minutes. Harder to get you next time."

**Gave-in close:**
- "Session ended." Full stop. No judgment. No commentary.

---

## 7. THE GAVE-IN HANDLING PHILOSOPHY

**Zero judgment. Zero shame. Zero copy that implies the user failed.**

"Session ended." — full stop. Stats update. Streak resets. The next session
is one tap away.

A gave-in at minute 18 still means 18 minutes of not eating. The session
duration is logged regardless of outcome. The visual record in History shows
a partial battle — evidence of a real fight, not a failure state.

The coach is silent on gave-in. The result is logged. Moving on is the only
available action.

---

## 8. THE TARGET USER

- 25–50 years old. Any gender.
- Goal-oriented. Responds to visible progress. Likes seeing the work tracked.
- Does not identify as having a clinical eating disorder — evening snacking is
  a habit, not a condition.
- **Actively repelled by wellness app aesthetics and language.**
- Wants a tool that works, not an app that makes them feel better about failing.
- Has likely tried willpower, tracking, restriction. Knows those approaches.
- Will trust the science if it's presented plainly, not wrapped in soft language.

**The design implication:** Every copy choice that sounds like a wellness app
is a trust-breaker with this user. Every copy choice that sounds like a doctor
giving a prognosis is a trust-builder.

---

## 8B. ACTIVE MODE — BEHAVIORAL RATIONALE

### Why Gyroscope Balance Is the Right Active Mechanic

Active mode adds a proprioceptive dimension to the cognitive/visual interference stack.
The phone's physical mass becomes the mechanic — the user must physically hold steady against
a force. This maps onto the craving experience in a precise way: the craving is a pull toward
action; active mode makes that pull a literal physical force the user must overcome with their
body.

**Three behavioral layers active mode adds:**

1. **Kinesthetic engagement:** The motor cortex is recruited to stabilize the phone. Research
   on embodied cognition shows that physical engagement in a task increases its claim on
   attentional resources — the user is more absorbed, less likely to have cognitive bandwidth
   for craving imagery.

2. **Proprioceptive loop:** The user feels the phone's weight shifting and responds with micro-
   corrections. This creates a tight feedback loop between body and screen that is intrinsically
   engaging. The engagement is not effortful like a cognitive task — it is reflexive, like
   balancing on one foot. The attention hold is automatic.

3. **Force metaphor made physical:** In passive mode, the amber force is a visual metaphor.
   In active mode, the amber gravity is a real physical force the user is overcoming with their
   hands. The craving as "something pressing against you that you must hold steady against"
   becomes literal. This deepens the emotional resonance of the win.

**Why not drag-to-center (BallsLayer v1):**
Drag required touch, which competes with the passive observation quality of the screen.
Gyroscope balance requires no touch — the screen remains a pure ambient display. The user
holds the phone, not the screen.

---

### Flow State and the Coach's Role in Active Mode

When a user holds the orb centered for an extended period in active mode, they enter a state
of effortful equilibrium — motor cortex engaged, visual attention locked on the orb, craving
imagery displaced. This is functionally a flow state: absorbed in the physical task, not in
the craving.

The behavioral research on flow (Csikszentmihalyi): flow requires a balance between challenge
and skill, and is characterized by a loss of self-consciousness and time distortion. A user
in flow is not thinking about the craving — they have been absorbed out of it.

**Coach role during flow:** The coach should acknowledge the state without breaking it.
A line that rewards the hold without adding cognitive content. The user is already winning
the cognitive battle — the coach confirms it quietly.

**What the coach should NOT do during flow:**
- Provide information that requires processing (the user will disengage to think about it)
- Add new framing or reinterpretation (disrupts the absorption)
- Use praise language (therapy register — breaks coach voice)

**Approved flow-state coach lines:**
Lines like "It's fading" / "Notice what stays" / "You're in it" — minimal, confirmatory.
These validate the state without redirecting attention. They can be delivered silently
(no shockwave) to avoid jarring the focus.

---

### Post-20-Minute Craving Persistence — What the Science Says

The 20-minute collapse window is a population average, not a guarantee. A minority of users
will reach 20 minutes and still feel craving signal. Two explanations:

1. **Session-specific factors:** Unusually strong conditioned cue (very familiar environment,
   high stress), elevated baseline dopamine activity, or the craving spiked late (started
   the session early in the cycle). The collapse window extends to ~25-30 minutes in these cases.

2. **Conditioned persistence:** Early in habit formation, the loop is stronger. Users in their
   first week will experience more post-20-minute signal than users with 30 sessions logged.

**How the coach handles post-20-minute signal:**
The craving persisting is not a failure of the method or the user. It is data about where
they are in the conditioning process. The coach should:
- Normalize it ("sometimes it lingers — that's normal")
- Not add urgency or implication that they need to act on it
- Offer a path back (another session) without pressure

**What the coach must NOT say post-20-minute:**
- Any language that implies the method failed
- "Be strong" — willpower framing
- Any implication that resistance now requires heroic effort

The session is still recorded as won. The user held 20 minutes. That is the win.
What happens after the session is a new behavioral moment, not part of the session result.

---

## 9. FUTURE FEATURES (INFORMED BY THIS DOMAIN KNOWLEDGE)

### Condition Score (V2)
Replace win rate % with a conditioning trajectory tracker. Last 10 sessions vs
first 10. Shows improvement, not just current state. Language: "Condition is
improving."

### Planned Skip (V2)
Pre-scheduled nights off. Streak-neutral. Agency over shame. Available before 6pm.
Coach acknowledges it without judgment.

### Resilience-Aware Streak (V2)
Session history shown as blocks rather than a single unbroken count. A single
gave-in doesn't erase 30 sessions of visible progress.

### Neural Map / Conditioning Ledger (V2)
Progress visualized as a growing crystal structure, not a pass/fail streak.
Each session — win or gave-in — adds to the structure based on minutes of
resistance logged. A lifetime minutes counter surfaces alongside the structure:
every second in the 20-minute window counts as conditioning work done.

### Progressive Difficulty (V2)
Battle visual calibrates harder as session count grows. Amber more aggressive
early in session. Difficulty level logged alongside result.

### Personal Record Coaching (V2)
Once 10+ sessions logged, coach draws on personal history at minute 8.
Session count, longest hold, current streak — all available as coach context.

### Claude API Dynamic Coach (V3)
Dynamic coach lines that adapt to streak, time of day, craving type, session
history. Generated via Cloudflare Worker proxy — key never in app binary.
Fallback to static lines if offline. Subscription-worthy only if demonstrably
better than static. Validate static first.

---

*Holdout domain.md · Nova Ventures Co. · 2026*
*This file is the source of truth for coach voice, science, and product philosophy.*
*All coach language decisions must trace to a mechanism documented here.*
