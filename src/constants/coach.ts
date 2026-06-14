// All coach message pools.
// Rules enforced here:
//   - Never use the word "craving" — say "it"
//   - No em dashes
//   - Calibration statements only — no motivation, no cheerleading
//   - Never claim the user's current felt state ("it eased", "it dropped")
//   - Zero judgment on gave-in result

export const COACH_MESSAGES = {
  start: [
    "First minutes are always the hardest. You're in them.",
    "It hits hard at the start. That's always how it goes.",
    "You didn't choose this feeling. You just have to hold twenty minutes.",
    "Twenty minutes. That's how long this takes to pass through you. Stay.",
    "Nothing to do but stay here. That's it.",
    "The first few minutes are the loudest this gets. Just hold through them.",
    "The hardest part is right at the start. It never runs at full strength for twenty minutes.",
    "Stay with it. Don't do anything.",
    "Twenty minutes. The hardest part is right now.",
    "It always peaks and falls in twenty minutes. That's the science. Stay.",
  ],

  tap1: [
    // Approx minute 4. First surge done. Harder stretch (minute 8 zone) still ahead.
    // Do NOT say "past the worst" — minute 8 is the harder moment.
    // Lead with what just happened: you held through the opening rush.
    "You made it through the first surge. The harder part is still ahead. Hold.",
    "First wave done. The harder one is coming. Stay with it.",
    "You held through its loudest opening. The test is still ahead.",
    "It hit hard at the start and you're still here. The next stretch is harder.",
    "The first stretch is done. What's ahead is harder. Just keep going.",
    "Every time you hold through this, the next one starts a little weaker.",
    "You're past the first rush. The harder stretch is coming. Hold through it.",
    "It peaked and got nothing from you. The harder stretch is still ahead.",
    "You haven't moved. That's all this takes. The harder part is next.",
    "First part done. The harder one is still ahead. Stay.",
  ],

  tap2: [
    // Approx minute 8. Hardest point. Maximum intensity, about to fall.
    // Reframe intensity from threat to confirmation: the harder it feels, the closer the turn.
    // Be direct. Don't soften.
    "This is the hardest it gets. It won't push harder than this. Hold.",
    "That pull you're feeling? That's it at its hardest. This is the top.",
    "The harder it feels right now, the closer you are to through it.",
    "This is where most people stop. You're still here.",
    "Everyone who holds through this stretch makes it to the end. You're right here.",
    "This is the peak. It doesn't go higher. Hold through it.",
    "The hardest moment of the whole session. Right now. You're in it.",
    "Whatever you're feeling right now, that's it at its worst. It goes down from here.",
    "It's at its hardest right now. That's the signal you're close to through it.",
    "Hard as it gets, right here, right now. Past this, it only goes down.",
  ],

  tap3: [
    // Approx minute 12. Past the hardest point. It can't come back from here.
    // Social proof works here: almost everyone who reaches this point finishes.
    // Don't say it's retreating or fading — speak to mechanism and social proof.
    "Almost everyone who gets here makes it through. You're here.",
    "Past the hardest stretch. What's left is just holding on.",
    "You made it through the hardest part. This is the other side.",
    "It's already lost. You're just finishing the round.",
    "Past here, it can't come back. Every time, that's true.",
    "The hard part was the stretch you just held. That's done.",
    "You've held past where most people give in. What's left is just time.",
    "The hardest stretch is behind you. Just hold through the rest.",
    "You're past the top. It only gets easier from here.",
    "It's already decided. You're just holding through the last of it.",
  ],

  tap4: [
    // Approx minute 16. Nearly done. It's spent. Not effort anymore, just time.
    // Some lines remind the user: holding this long makes the next one easier.
    "This isn't effort anymore. It's just the clock running out.",
    "Almost there. The hard part was back in the middle. It's done.",
    "Just let the clock finish it. You've already done the work.",
    "It has nothing left. Hold through the end.",
    "Finish this and the next one starts from a slightly weaker place.",
    "Almost through. The heavy lifting happened in the stretch you already held.",
    "Every time you hold this long, the next one gets a little easier to hold.",
    "Final stretch. It's spent. Just stay through.",
    "You're watching the last of it. Don't move.",
    "The hard part is done. Just let the final minutes run.",
  ],

  win: [
    "That's 20 minutes. You held it.",
    "Done. It ran twenty minutes without getting what it wanted.",
    "Twenty minutes. It's a little weaker for next time.",
    "Twenty minutes. You outlasted it.",
    "Done. You held longer than it could.",
    "Twenty minutes. It couldn't close.",
    "Twenty minutes. Harder to get you next time.",
    "That's the full 20. Done.",
    "Done. It ran out of time.",
    "Twenty minutes. Another one down.",
  ],

  winLingers: [
    // Post-win — still feeling it past 20 minutes. Normalise without judgment.
    // The GO AGAIN button is the CTA. Coach just names what's happening.
    "Sometimes it runs past twenty. Another round handles what's left.",
    "Twenty minutes clears most of it. A second session gets the rest.",
    "It can outlast the clock. Rare, but another twenty closes it.",
    "Most feel done here. If not, one more will finish it.",
    "A second twenty finishes what the first one started.",
    "Sometimes it outlasts the session. Another twenty handles what's left.",
    "Past twenty, it's almost spent. One more session clears it.",
    "Twenty minutes takes most of it. A second twenty takes the rest.",
    "Whatever's left after twenty has nowhere left to go.",
    "The hard part already happened. A second round is mostly just time.",
  ],

  earlyWin: [
    // It peaked, got no reinforcement, collapsed. Name it plainly.
    "It came and left. That's the pattern.",
    "Shorter than expected. That's how it sometimes goes.",
    "It peaked and passed. That's all it can do.",
    "Done before twenty. It ran out before you did.",
    "It fired, got nothing, and left.",
    "It couldn't hold. You could.",
    "It peaked, got nothing, and collapsed. That's the whole cycle.",
    "It left before you did.",
    "It passes when you don't act on it. That's what just happened.",
    "Gone. It peaked, got nothing, and left.",
  ],

  // On-demand pool for the SUPPORT ME button.
  // Core rule: the coach does not know what this person is feeling right now.
  // Never claim their experience — "it eased / you can feel it / it's fading."
  // Write like someone who has been through this, not someone who studied it.
  // Speak to: where they are in time, what always happens from here, what to do right now.
  // Two tiers per phase:
  //   first  — initial tap: where you are, what's true from here
  //   repeat — subsequent taps: short, direct, just stay
  // CoachService routes based on whether this is the first SUPPORT ME tap in the session.
  supportMe: {
    early: {
      // 0–7 min: the hardest phase (boundary: < 8 in CoachService)
      first: [
        "This is the hard part. You're in it.",
        "First minutes are the hardest. Everyone feels this.",
        "It's supposed to feel this strong right now.",
        "Don't do anything. Just stay here.",
        "Feels like it won't pass. It will.",
        "You don't have to make it better. Just hold the time.",
        "Hard for everyone at this point. Keep going.",
        "You're in the hardest stretch. The turn is ahead. Hold through it.",
        "It always hits hard at the start. Stay.",
        "This feeling is real. So is the twenty minutes.",
      ],
      repeat: [
        "Still here. Keep going.",
        "Every minute you don't act on it, it gets a little less.",
        "You're still holding. That's the whole thing.",
        "Stay. Don't do anything.",
        "Still in it. Still holding.",
        "The next marker ends the hardest part of this.",
        "Don't move. Stay with it.",
        "Every minute without giving in matters. This one too.",
        "Still holding. That's enough.",
        "You're still here. That counts.",
      ],
    },
    mid: {
      // 8–12 min: past the hardest point (boundary: < 13 in CoachService)
      first: [
        "You're past the hardest stretch. That's the one that matters.",
        "The hardest stretch is behind you. The rest is just holding.",
        "The hardest part of this is done.",
        "You've made it past the hardest stretch. Most people don't.",
        "The hardest stretch was the test. You're past it.",
        "Past the hardest moment. Just hold through what's left.",
        "The hardest minute is behind you.",
        "Past where most people give in. Keep going.",
        "Whether you feel it or not, you're past the hardest point.",
        "The hardest stretch is done. The rest is just finishing.",
      ],
      repeat: [
        "Past the hardest part. Just finish it.",
        "It can't come back from here. Hold what's left.",
        "Still here, still past the worst of it.",
        "The hard part is done. Hold through the rest.",
        "Whatever you're still feeling, it can't build back from here.",
        "Past the hardest point. Nothing resets from here.",
        "You've held past the hardest point. Keep going.",
        "Just hold through what's left.",
        "Past the worst. Nearly done.",
        "Hold through what remains.",
      ],
    },
    late: {
      // 13–20 min: nearly done
      first: [
        "Almost there. Just a few minutes.",
        "You're nearly through it.",
        "Final stretch. Hold to the end.",
        "Almost done. Stay.",
        "A few minutes left. That's all.",
        "You've held this long. The end is close.",
        "Almost through. Keep going.",
        "So close. Just a few minutes more.",
        "Final minutes. Just let it run out.",
        "You're almost through the whole thing.",
      ],
      repeat: [
        "Hold the last of it.",
        "Almost done.",
        "Still here. End is close.",
        "Nearly through. Stay.",
        "Just the last few minutes.",
        "Almost there. Stay on it.",
        "Hold to the end.",
        "Minutes away from done.",
        "Just finish it.",
        "So close. Don't move.",
      ],
    },
  },
} as const;

// Explicit union — excludes 'supportMe' (nested object, not a flat pool).
// Do NOT use keyof typeof COACH_MESSAGES here — it would include supportMe
// and break the readonly string[] signature of pickFrom().
export type CoachPhase = 'start' | 'tap1' | 'tap2' | 'tap3' | 'tap4' | 'win' | 'earlyWin' | 'winLingers';

// First-use mode instructions — shown once via the coach line pill, not coach pools.
// Passive: replaces the start pool message on the very first session.
// Active: shown on the first ACTIVE mode toggle of all time.
export const PASSIVE_INSTRUCTION = "Watching this occupies the brain circuits it depends on. Twenty minutes disrupts the pattern.";
export const ACTIVE_INSTRUCTION = "Tilt to hold it centered. Physical movement occupies the circuits it runs on.";

// Pre-session taglines — shown on HomeScreen, one per app open (random pick on mount).
// Different register from the in-session coach: warmer, pre-session framing.
// Acknowledges the difficulty without cheerleading.
export const HOME_TAGLINES = [
  "You know you don't need it. That doesn't make it any easier. Let's outlast it.",
  "It's going to feel strong. Twenty minutes is all it takes.",
  "Every time you hold, the pattern gets a little weaker.",
  "It can feel hard to resist. That's the habit running its course. You can outlast it.",
  "Twenty minutes. The urge peaks and falls on its own. Just stay.",
  "Some nights it hits harder. The pull just needs time to fade.",
] as const;

// Post-session home screen messages — shown on HomeScreen immediately after a session ends.
// Different register from in-session coach: warmer, human, more personal.
// Not subject to the in-session 15-word rule. Still no therapy language or cheerleading.
// Shown exactly once (cleared from Preferences after first display).

// Shown after a won session. Acknowledges the real effort without hollow praise.
// Tone: a quiet, honest friend who gets what it cost.
export const HOME_WIN_MESSAGES = [
  "That was real. You chose something different for twenty minutes.",
  "You got through it. That's the whole thing.",
  "Held it. That counts more than it probably feels like right now.",
  "Twenty minutes you said no. That's a real thing.",
  "That one was worth it. Not because it felt easy, but because you held.",
  "You didn't let it win this time. That stays with you.",
  "That's the practice working. Slowly, but it's working.",
  "You held when it was hard. That's the part that compounds.",
] as const;

// Shown after a gave-in session. Non-judgmental, normalizing.
// Tone: someone who gets it — not reassuring, not dismissive. Just present.
export const HOME_GAVE_IN_MESSAGES = [
  "It got you this time. That happens. You still came here.",
  "Hard one. These are part of this. They don't erase what you've built.",
  "You showed up. That's harder than it looks, and you did it.",
  "It was strong this time. Strong ones are part of the process.",
  "Not this one. The next one is still yours.",
  "These sessions count. Even when they end like this.",
  "That was a hard session. You're still here.",
  "Even the ones that don't finish are part of building this.",
] as const;
