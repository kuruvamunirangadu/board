/**
 * VisiOS — Phase 5: Assessment Session Persistence
 * Persists and restores student assessment sessions, attempts, and difficulty states.
 */

import { AssessmentSessionState } from './AssessmentContracts';

export class AssessmentPersistence {
  private static sessions: Map<string, AssessmentSessionState> = new Map();

  /**
   * Save or update an assessment session.
   */
  public static saveSession(session: AssessmentSessionState): void {
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
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('visios_assessment_sessions');
        if (raw) {
          const entries: [string, AssessmentSessionState][] = JSON.parse(raw);
          for (const [id, s] of entries) {
            this.sessions.set(id, s);
          }
          if (this.sessions.has(sessionId)) {
            return this.sessions.get(sessionId)!;
          }
        }
      } catch {
        // Fallback silently
      }
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
    for (const session of Array.from(this.sessions.values())) {
      if (session.studentId === studentId && session.conceptId === conceptId && !session.isCompleted) {
        return session;
      }
    }
    return null;
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
