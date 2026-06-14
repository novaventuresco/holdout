import { Session, SessionRecord } from '../storage/sessions';

function completedOnly(sessions: SessionRecord[]): Session[] {
  return sessions.filter(
    (s): s is Session => s.result === 'won' || s.result === 'gaveIn',
  );
}

// Consecutive won sessions counting backward from most recent, broken by any gaveIn.
// Streak is purely consecutive wins — no daily requirement.
export function getCurrentStreak(sessions: SessionRecord[]): number {
  const completed = completedOnly(sessions).sort((a, b) => b.startTime - a.startTime);

  let streak = 0;
  for (const session of completed) {
    if (session.result === 'won') {
      streak++;
    } else {
      break; // gaveIn breaks the streak
    }
  }
  return streak;
}

// All-time highest consecutive wins.
export function getBestStreak(sessions: SessionRecord[]): number {
  const completed = completedOnly(sessions).sort((a, b) => a.startTime - b.startTime);

  let best = 0;
  let current = 0;
  for (const session of completed) {
    if (session.result === 'won') {
      current++;
      if (current > best) best = current;
    } else {
      current = 0;
    }
  }
  return best;
}

// Won sessions as a percentage of all completed sessions. Returns 0 if no sessions.
export function calculateWinRate(sessions: SessionRecord[]): number {
  const completed = completedOnly(sessions);
  if (completed.length === 0) return 0;
  const wins = completed.filter((s) => s.result === 'won').length;
  return Math.round((wins / completed.length) * 100);
}
