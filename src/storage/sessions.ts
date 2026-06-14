import AsyncStorage from '@react-native-async-storage/async-storage';

const SESSIONS_KEY = 'sessions';

// Module-level cache — eliminates double-reads on cold launch (ISSUE-03).
// Populated on first getSessions() call. Invalidated on every write.
let _cache: SessionRecord[] | null = null;

export interface Session {
  id: string;
  startTime: number;       // Unix timestamp ms
  endTime: number;         // Unix timestamp ms
  result: 'won' | 'gaveIn';
  duration: number;        // ms
  milestonesReached: number;
}

// A session in progress has no result yet
export interface ActiveSession extends Omit<Session, 'result' | 'endTime' | 'duration'> {
  result?: never;
  endTime?: never;
  duration?: never;
}

export type SessionRecord = Session | ActiveSession;

export async function getSessions(): Promise<SessionRecord[]> {
  if (_cache !== null) return _cache;
  try {
    const raw = await AsyncStorage.getItem(SESSIONS_KEY);
    if (!raw) { _cache = []; return _cache; }
    const parsed = JSON.parse(raw);
    _cache = Array.isArray(parsed) ? parsed : [];
    return _cache;
  } catch {
    return [];
  }
}

export async function saveSession(session: SessionRecord): Promise<void> {
  try {
    const sessions: SessionRecord[] = await getSessions();
    sessions.push(session);
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    _cache = null;
  } catch (e) {
    console.warn('[sessions] saveSession failed:', e);
  }
}

export async function updateSession(
  id: string,
  updates: Partial<Session>,
): Promise<void> {
  try {
    const sessions = await getSessions();
    const index = sessions.findIndex((s) => s.id === id);
    if (index === -1) return; // session not found — no-op
    sessions[index] = { ...sessions[index], ...updates } as Session;
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
    _cache = null;
  } catch (e) {
    console.warn('[sessions] updateSession failed:', e);
  }
}

// Removes a session record entirely. Used by cancelSession (Go Back) — silent cancel
// leaves no trace in history and does not affect streak.
export async function deleteSession(id: string): Promise<void> {
  try {
    const sessions = await getSessions();
    const filtered = sessions.filter((s) => s.id !== id);
    if (filtered.length === sessions.length) return; // not found — no-op
    _cache = filtered; // eager — concurrent getSessions() calls see the delete before AsyncStorage write completes
    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(filtered));
  } catch (e) {
    _cache = null; // write failed — invalidate so next read retries from disk
    console.warn('[sessions] deleteSession failed:', e);
  }
}
