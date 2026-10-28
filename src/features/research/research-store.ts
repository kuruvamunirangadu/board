/**
 * VisiOS Milestone 19 — Research Session Store
 * Secure, pseudonymized in-memory & persistent store for empirical research experiments.
 */

import {
  ResearchSessionRecord,
  StudyCondition,
  LearnerEvidenceItem,
  AdaptationRecommendation,
} from '@/types/research';
import { learnerKnowledgeModel } from '../adaptive/learner-knowledge-model';

export class ResearchStore {
  private sessions: Map<string, ResearchSessionRecord> = new Map(); // sessionId -> session
  private participantSessionMap: Map<string, string[]> = new Map(); // participantCode -> sessionIds[]

  /**
   * Create a new research participant session with counterbalanced or randomized condition assignment
   */
  public createSession(
    participantCode: string,
    experimentId: string,
    forcedCondition?: StudyCondition
  ): ResearchSessionRecord {
    const existingForExperiment = Array.from(this.sessions.values()).filter(
      (s) => s.experimentId === experimentId
    );

    let assignedCondition: StudyCondition = forcedCondition || 'adaptive_intervention';
    if (!forcedCondition) {
      // Counterbalanced allocation: assign condition with fewer completed/active sessions
      const adaptiveCount = existingForExperiment.filter(
        (s) => s.condition === 'adaptive_intervention'
      ).length;
      const fixedCount = existingForExperiment.filter(
        (s) => s.condition === 'fixed_sequence'
      ).length;

      assignedCondition = adaptiveCount <= fixedCount ? 'adaptive_intervention' : 'fixed_sequence';
    }

    const sessionId = `rsess-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newSession: ResearchSessionRecord = {
      sessionId,
      participantCode,
      experimentId,
      condition: assignedCondition,
      consentTimestamp: Date.now(),
      startedAt: Date.now(),
      completedAt: null,
      status: 'consented',
      preTestResponses: {},
      preTestScore: null,
      postTestResponses: {},
      postTestScore: null,
      evidenceLog: [],
      adaptationHistory: [],
      interventionsCompleted: [],
      timeOnTaskSeconds: 0,
      hintsRequestedCount: 0,
    };

    this.sessions.set(sessionId, newSession);

    const userSessions = this.participantSessionMap.get(participantCode) || [];
    userSessions.push(sessionId);
    this.participantSessionMap.set(participantCode, userSessions);

    return newSession;
  }

  public getSession(sessionId: string): ResearchSessionRecord | undefined {
    return this.sessions.get(sessionId);
  }

  public getSessionsForExperiment(experimentId: string): ResearchSessionRecord[] {
    return Array.from(this.sessions.values()).filter((s) => s.experimentId === experimentId);
  }

  public getAllSessions(): ResearchSessionRecord[] {
    return Array.from(this.sessions.values());
  }

  public updateSession(
    sessionId: string,
    patch: Partial<ResearchSessionRecord>
  ): ResearchSessionRecord {
    const existing = this.sessions.get(sessionId);
    if (!existing) {
      throw new Error(`Research session ${sessionId} not found`);
    }

    const updated: ResearchSessionRecord = {
      ...existing,
      ...patch,
    };

    this.sessions.set(sessionId, updated);
    return updated;
  }

  public recordEvidence(sessionId: string, evidence: LearnerEvidenceItem): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.evidenceLog.push(evidence);
      learnerKnowledgeModel.recordEvidence(evidence);
    }
  }

  public recordAdaptation(sessionId: string, rec: AdaptationRecommendation): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.adaptationHistory.push(rec);
    }
  }

  /**
   * Enforce complete participant data erasure (GDPR Right-to-Erasure)
   */
  public deleteParticipantData(participantCode: string): { deletedSessions: number } {
    const sessionIds = this.participantSessionMap.get(participantCode) || [];
    let deletedCount = 0;

    sessionIds.forEach((sid) => {
      this.sessions.delete(sid);
      deletedCount++;
    });

    this.participantSessionMap.delete(participantCode);
    learnerKnowledgeModel.purgeParticipant(participantCode);

    return { deletedSessions: deletedCount };
  }

  /**
   * Reset store (testing)
   */
  public reset(): void {
    this.sessions.clear();
    this.participantSessionMap.clear();
    learnerKnowledgeModel.reset();
  }
}

export const researchStore = new ResearchStore();

