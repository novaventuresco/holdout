import { COACH_MESSAGES, CoachPhase } from '../constants/coach';

// Shuffle-without-repeat picker (ISSUE-08).
// Tracks a shuffled index queue per pool key. When the queue is exhausted,
// it reshuffles — guaranteeing every message appears once before any repeats.
const _queues = new Map<readonly string[], number[]>();

function pickFrom(pool: readonly string[]): string {
  if (!pool || pool.length === 0) return '';
  let queue = _queues.get(pool);
  if (!queue || queue.length === 0) {
    // Fisher-Yates shuffle of indices
    const indices = Array.from({ length: pool.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    queue = indices;
    _queues.set(pool, queue);
  }
  return pool[queue.pop()!];
}

// Maps minute marks from MILESTONE_SCHEDULE to message pools.
// SYNC DEPENDENCY: these minute marks must match the `minute` values in
// src/constants/timing.ts MILESTONE_SCHEDULE. If the schedule changes,
// update both files together.
const MINUTE_TO_PHASE: Record<number, CoachPhase> = {
  4: 'tap1',
  8: 'tap2',
  12: 'tap3',
  16: 'tap4',
};

export function getStartMessage(): string {
  return pickFrom(COACH_MESSAGES.start);
}

// Returns a calibration line for the given minute mark.
// Falls back to tap1 pool if minuteMark is unrecognised — logs a warning so the
// mismatch surfaces during development rather than silently returning wrong content.
export function getRecommitmentMessage(minuteMark: number): string {
  const phase = MINUTE_TO_PHASE[minuteMark];
  if (!phase) {
    console.warn(
      `[CoachService] getRecommitmentMessage: unrecognised minuteMark ${minuteMark}. ` +
      'Check that MILESTONE_SCHEDULE and MINUTE_TO_PHASE are in sync.',
    );
  }
  return pickFrom(COACH_MESSAGES[phase ?? 'tap1']);
}

export function getWinMessage(): string {
  return pickFrom(COACH_MESSAGES.win);
}

export function getEarlyWinMessage(): string {
  return pickFrom(COACH_MESSAGES.earlyWin);
}

export function getWinLingersMessage(): string {
  return pickFrom(COACH_MESSAGES.winLingers);
}

// Returns a calibration line for the SUPPORT ME on-demand tap.
// Uses the supportMe pool — messages that are position-aware but never reference
// a specific minute number. Auto-milestone fires use getRecommitmentMessage instead.
//
// isRepeat: true if the user has already tapped SUPPORT ME at least once this session.
//   false (default) → first-tier pool: position/arc message ("where are you on the curve")
//   true            → repeat-tier pool: persistence/mechanism message ("what's happening to it now")
// BattleScreen tracks the tap count and passes this flag.
export function getCoachMessageForElapsed(elapsed: number, isRepeat = false): string {
  const min = elapsed / 60_000;
  let pool: readonly string[];
  if (min < 8) {
    pool = isRepeat ? COACH_MESSAGES.supportMe.early.repeat : COACH_MESSAGES.supportMe.early.first;
  } else if (min < 13) {
    pool = isRepeat ? COACH_MESSAGES.supportMe.mid.repeat : COACH_MESSAGES.supportMe.mid.first;
  } else {
    pool = isRepeat ? COACH_MESSAGES.supportMe.late.repeat : COACH_MESSAGES.supportMe.late.first;
  }
  return pickFrom(pool);
}
