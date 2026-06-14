# Implementation Blueprint: Spatial Balance Mechanic (Holdout)

This blueprint details the **Spatial Balance** interaction, a physics-based mechanism designed to transform the iPhone into a tool for **Cognitive Interference**. By engaging vestibular data and visual-spatial coordinates, the app occupies the neurological resources typically used to generate vivid food imagery.

---

## 1. Core Physics: The "Spatial Hold"
The interaction is a constant struggle between user agency (Gyroscope) and craving pressure (Amber Tide).

* **The Center Force (The Orb):** * **Logic:** A physics-based object within a coordinate system. Velocity is controlled by the **iPhone’s Gyroscope** (Pitch and Roll).
    * **Behavior:** The Orb possesses momentum and friction. It is not a direct cursor; it behaves like a physical object sliding on a tilted plane.
* **The Amber Tide (Edge Gravity):**
    * **Visuals:** Turbulent, flame-like textures pressing in from all four edges.
    * **Suction Logic:** Each edge acts as a gravitational well. The closer the Orb gets to an edge, the stronger the "pull" toward that boundary becomes.
    * **The Conflict:** The user must apply physical "Counter-Tilt" to escape the gravitational pull of the Tide and return to the center.

---

## 2. Interaction Logic: Friction & Failure States
To maintain the "mechanical hold" philosophy, failure to balance does not end the session, but changes the physical state.

* **Adhesion Physics ("The Sucked In" State):** If the Orb touches the Amber Tide, it does not bounce. It enters a "quicksand" state where suction increases. Breaking free requires an aggressive, intentional physical tilt.
* **Visual Feedback:** The contacted edge flares in intensity. The Orb’s white core dims to a faint grey-blue, signifying a loss of momentum and agency.
* **Haptic Feedback:** The Taptic Engine shifts from a smooth hum to a "gritty," erratic vibration that persists until the Orb is rescued and returned to the Safe Zone.
* **Progress Impact:** The 20-minute timer persists regardless of the Orb's position. The **Conditioning Ledger** logs these moments as "Low Stability" minutes, maintaining the "Agency over Shame" principle.

---

## 3. The 20-Minute Dynamic Curve
Difficulty is calibrated to mirror the neurological **20-Minute Collapse Window**.

| Phase | Time | Physics Behavior | Neurological State |
| :--- | :--- | :--- | :--- |
| **The Surge** | 0–5m | **High Turbulence:** The Amber Tide pulses erratically. | Peak intensity; the brain is "loudest." |
| **The Plateau** | 5–8m | **Sustained Gravity:** A heavy, constant pull toward edges. | High intensity, but plateauing. |
| **The Danger Zone**| 8–14m | **The "Swerve":** Max gravity at Minute 8. Sudden directional shifts. | Maximum difficulty; resolve is most vulnerable. |
| **The Collapse** | 14–20m | **The Retreat:** Suction weakens; the Orb becomes lighter. | Signal is losing its neurological fuel. |

---

## 4. Visual & Haptic Implementation
Feedback must confirm the internal struggle and the eventual "collapse" of the craving loop.

* **Haptic Mapping:**
    * **Center Safety:** A faint, high-frequency "purr" when perfectly centered.
    * **Edge Proximity:** "Gritty," increasing vibrations simulating the physical "pull" of the craving.
    * **"Support Me" Tap:** A sharp, singular haptic "thud" confirming the Coach is active.
* **The Sanctuary Effect (Visual Reward):**
    * **The Pulse:** Holding the Orb in the Safe Zone for >5s triggers a rhythmic, "breathing" expansion of the teal glow.
    * **Tide Recession:** Stability causes the Amber Tide to recede, creating more "negative space" and a subconscious "room to breathe."
    * **Chromatic Shift:** Background shifts from vibrating charcoal to a deep, calm navy.
    * **Stillness Bonus:** One minute of sustained centering triggers a "crystal chime" haptic/audio cue (Resilience Micro-cycle).

---

## 5. Neurological Foundation: Modality-Specific Hijacking
1.  **Visual-Spatial Competition:** The brain uses the same mental resources to "imagine" a reward as it does to track objects in 3D space.
2.  **Motor Disruption:** Micro-gestures and balancing disrupt the "reaching" motor-cortex urges.
3.  **Linguistic Defusion:** By focusing on the *physics* of the "Amber Force," the user shifts from "I want" to "I am observing this force."

---

## 6. Session Outcomes & Technical Specs

### Outcomes
* **Success (20:00):** Amber vanishes. Screen turns solid white. Message: *"The loop is weaker than it was 20 minutes ago."* Logged as a "Full Hold."
* **Partial / Gave In:** Display: *"Session ended. [X] minutes of conditioning work logged."* Focus remains strictly on **lifetime minutes** of resistance.

### Technical Implementation (Claude/Dev)
* **Sensor:** `DeviceMotion` (Pitch/Roll) sampled at 60Hz.
* **Physics Engine:** Vector-based; `Orb.velocity += (Gyro.tilt - Amber.suction)`.
* **Haptics:** `UIImpactFeedbackGenerator` (Heavy for edges, Light for center).
* **UI Constraints:** No buttons except "GAVE IN" and "SUPPORT ME." No "wellness" or motivational copy.

### Why it avoids "Wellness" Traps
1.  **Objective Task:** Focuses on balancing an object rather than emotional management.
2.  **Realistic Physics:** Provides a physical manifestation of an internal struggle.
3.  **Identity Evidence:** Every minute logged serves as proof of **Identity Change** (shifting from "someone who reacts" to "someone who resists").