/**
 * VisiOS — Phase 5: Assessment Session Persistence
 * Persists and restores student assessment sessions, attempts, and difficulty states.
 */

import { AssessmentSessionState } from './AssessmentContracts';

export class AssessmentPersistence {
  private static sessions: Map<string, AssessmentSessionState> = new Map();

  /** Merge browser-persisted sessions into the in-memory index before reads or writes. */
  private static hydrateSessions(): void {
    if (typeof window === 'undefined') return;

    try {
      const raw = window.localStorage?.getItem('visios_assessment_sessions');
      if (!raw) return;

      const entries: unknown = JSON.parse(raw);
      if (!Array.isArray(entries)) return;

      for (const entry of entries) {
        if (!Array.isArray(entry) || entry.length !== 2) continue;
        const [id, session] = entry as [unknown, Partial<AssessmentSessionState>];
        if (
          typeof id === 'string' &&
          session &&
          typeof session === 'object' &&
          typeof session.sessionId === 'string' &&
          session.sessionId === id &&
          typeof session.studentId === 'string' &&
          typeof session.conceptId === 'string' &&
          Array.isArray(session.attempts)
        ) {
          this.sessions.set(id, session as AssessmentSessionState);
        }
      }
    } catch {
      // Keep the in-memory session available when browser storage is unavailable or malformed.
    }
  }

  /**
   * Save or update an assessment session.
   */
  public static saveSession(session: AssessmentSessionState): void {
    this.hydrateSessions();
    this.sessions.set(session.sessionId, { ...session, updatedAt: new Date().toISOString() });

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = JSON.stringify(Array.from(this.sessions.entries()));
        window.localStorage.setItem('visios_assessment_sessions', raw);
      } catch {
        // Fallback silently
      }
    }
  }

  /**
   * Retrieve an existing session by sessionId or studentId + conceptId.
   */
  public static getSession(sessionId: string): AssessmentSessionState | null {
    this.hydrateSessions();
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }
    return null;
  }

  /**
   * Find an active session for a student studying a specific concept.
   */
  public static findActiveSession(
    studentId: string,
    conceptId: string
  ): AssessmentSessionState | null {
    this.hydrateSessions();
    for (const session of Array.from(this.sessions.values())) {
      if (session.studentId === studentId && session.conceptId === conceptId && !session.isCompleted) {
        return session;
      }
    }
    return null;
  }

  /** List persisted assessment history, optionally narrowed to one learner and concept. */
  public static listSessions(studentId?: string, conceptId?: string): AssessmentSessionState[] {
    this.hydrateSessions();
    return Array.from(this.sessions.values())
      .filter((session) => (!studentId || session.studentId === studentId) && (!conceptId || session.conceptId === conceptId))
      .sort((a, b) => a.updatedAt.localeCompare(b.updatedAt));
  }

  public static findLatestSession(studentId: string, conceptId: string): AssessmentSessionState | null {
    return this.listSessions(studentId, conceptId).at(-1) || null;
  }

  /**
   * Clear all sessions (for testing).
   */
  public static clear(): void {
    this.sessions.clear();
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem('visios_assessment_sessions');
      } catch {
        // Fallback silently
      }
    }
  }
}
