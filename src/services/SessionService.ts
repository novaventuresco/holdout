import { getSessions, saveSession, updateSession, deleteSession, Session, SessionRecord, ActiveSession } from '../storage/sessions';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Returns any session with no result, regardless of age.
// Used on app launch to detect and recover from a killed session.
// No time window: a session started at any point in the past without a result is orphaned
// and must be marked gaveIn. A time-bounded check misses sessions killed just after
// SESSION_DURATION_MS elapsed.
export async function getActiveSession(): Promise<ActiveSession | null> {
  const sessions = await getSessions();
  const found = sessions.find((s) => !s.result);
  return (found as ActiveSession | undefined) ?? null;
}

// Creates a new session record and persists it.
// Guards against double-start: if an active session exists, returns its id.
export async function startSession(): Promise<string> {
  const existing = await getActiveSession();
  if (existing) {
    console.warn('[SessionService] startSession called with active session — returning existing id');
    return existing.id;
  }

  const session: SessionRecord = {
    id: generateId(),
    startTime: Date.now(),
    milestonesReached: 0,
  };

  await saveSession(session);
  return session.id;
}

// Marks session as won. Sets endTime and duration.
// priorDurationMs: cumulative elapsed from any previous GO AGAIN sessions (default 0).
export async function completeSession(sessionId: string, priorDurationMs = 0): Promise<void> {
  const endTime = Date.now();
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    console.warn('[SessionService] completeSession: session not found', sessionId);
    return;
  }
  if (session.result) {
    console.warn('[SessionService] completeSession: session already finalized as', session.result);
    return;
  }
  await updateSession(sessionId, {
    result: 'won',
    endTime,
    duration: Math.max(0, endTime - session.startTime) + Math.max(0, priorDurationMs),
  });
}

// Marks session as gaveIn. Sets endTime and duration.
// priorDurationMs: cumulative elapsed from any previous GO AGAIN sessions (default 0).
export async function abandonSession(sessionId: string, priorDurationMs = 0): Promise<void> {
  const endTime = Date.now();
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) {
    console.warn('[SessionService] abandonSession: session not found', sessionId);
    return;
  }
  if (session.result) {
    console.warn('[SessionService] abandonSession: session already finalized as', session.result);
    return;
  }
  await updateSession(sessionId, {
    result: 'gaveIn',
    endTime,
    duration: Math.max(0, endTime - session.startTime) + Math.max(0, priorDurationMs),
  });
}

// Deletes the session record entirely — silent cancel (Go Back).
// No result recorded; streak unaffected; crash recovery will not find it.
export async function cancelSession(sessionId: string): Promise<void> {
  await deleteSession(sessionId);
}

// Increments milestonesReached on the session record.
export async function recordMilestone(sessionId: string): Promise<void> {
  const sessions = await getSessions();
  const session = sessions.find((s) => s.id === sessionId);
  if (!session) return;
  if (session.result) return; // session already finalized — no-op
  await updateSession(sessionId, {
    milestonesReached: (session.milestonesReached ?? 0) + 1,
  });
}
