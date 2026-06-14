// RECORDING MODE: shortened for App Preview video — revert to 20 * 60 * 1000 before production build
export const SESSION_DURATION_MS = 20 * 60 * 1000;
export const COACH_LINE_DISPLAY_MS = 7000;

// Variance removed: milestones fire at exact minute marks so the progress fill
// and dot positions are always in sync. Variance caused visible misalignment —
// the fill could be 2%+ past a dot before it lit. The "mechanical feel" concern
// was outweighed by the confusion of the fill leading the milestone.
// SYNC DEPENDENCY: the minute values here must match the keys in
// src/services/CoachService.ts MINUTE_TO_PHASE. If milestones are added or rescheduled,
// update both files together.
export const MILESTONE_SCHEDULE = [
  { minute: 4, varianceSec: 0 },
  { minute: 8, varianceSec: 0 },
  { minute: 12, varianceSec: 0 },
  { minute: 16, varianceSec: 0 },
] as const;

// BattleVisual shockwave pulse at each milestone.
// Pulse is a shader uniform (0→MILESTONE_PULSE_TARGET over MILESTONE_PULSE_DURATION_MS).
// The shader applies a Gaussian ring displacement as the value travels outward.
export const MILESTONE_PULSE_DURATION_MS = 1100;
export const MILESTONE_PULSE_TARGET = 1.3;

// Win state animation timings — four sequential phases
export const WIN_HOLD_CLEAR_MS = 2000;   // hold at 1.0 (amber gone, center clear)
export const WIN_FADE_WHITE_MS = 1000;   // fade white overlay in
export const WIN_HOLD_WHITE_MS = 1000;   // hold white
export const WIN_FADE_BACK_MS  = 1000;   // fade white overlay back out to background

// Gave-in drain: amber re-advances over this duration
export const GAVE_IN_DRAIN_MS = 5000;
