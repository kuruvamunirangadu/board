/**
 * VisiOS — Learning Session Persistence & Resume Service
 * Implements reliable auto-save, debouncing, race-condition revision protection,
 * schema validation, and session recovery across browser refreshes.
 */

import { sessionPersistence, SessionPersistenceAdapter } from '@/lib/persistence/session-persistence';
import { LearningSession } from '@/types/session';
import {
  GuidedLessonStep,
  SavedLearningSessionState,
  SaveSessionStatus,
} from './types';
import { ExperimentSessionState } from '@/features/experiment/ExperimentTypes';

export interface AutoSavePayload {
  topic: string;
  domain?: string;
  conceptId?: string;
  responseId?: string;
  capabilityId?: string;
  engineId?: string;
  guidedStep: GuidedLessonStep;
  completedSteps: GuidedLessonStep[];
  activeTab: 'understand' | 'derive' | 'visualize' | 'experiment' | 'master';
  isGuidedMode: boolean;
  practiceFeedback?: {
    selectedIndex: number;
    isCorrect: boolean;
    score: number;
    explanation?: string;
    misconceptionAlert?: string;
  } | null;
  shortAnswerState?: {
    rawInput: string;
    isCorrect: boolean;
    score: number;
    explanation?: string;
    hint?: string;
  } | null;
  simulationParameters?: Record<string, number>;
  activeRenderer?: string;
  lastOperation?: string;
  experimentLabState?: ExperimentSessionState | null;
  whatIfComparison?: any;
  workspaceId?: string;
}

export class LearningSessionPersistenceService {
  private static saveTimeout: NodeJS.Timeout | null = null;
  private static currentRevision: number = 0;
  private static saveStatus: SaveSessionStatus = 'saved';
  private static lastError: string | null = null;
  private static statusListeners: Set<(status: SaveSessionStatus, error?: string | null) => void> = new Set();

  // Test hook to simulate quota exceeded error
  private static simulateQuotaExceeded: boolean = false;

  public static setSimulateQuota(enable: boolean) {
    this.simulateQuotaExceeded = enable;
  }

  public static getStatus(): SaveSessionStatus {
    return this.saveStatus;
  }

  public static getLastError(): string | null {
    return this.lastError;
  }

  public static subscribeStatus(listener: (status: SaveSessionStatus, error?: string | null) => void): () => void {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private static notifyStatus(status: SaveSessionStatus, error?: string | null) {
    this.saveStatus = status;
    this.lastError = error || null;
    this.statusListeners.forEach((fn) => fn(status, error));
  }

  /**
   * Generates a stable session ID from topic.
   */
  public static getStableSessionId(topic: string): string {
    const slug = SessionPersistenceAdapter.normalizeTopicKey(topic);
    return `session-${slug}`;
  }

  /**
   * Validates a saved session record before restoring it.
   */
  public static validateRecord(raw: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Record must be a non-null object'] };
    }
    if (!raw.primaryTopic || typeof raw.primaryTopic !== 'string') {
      errors.push('Missing or invalid "primaryTopic"');
    }
    if (raw.schemaVersion !== undefined && typeof raw.schemaVersion !== 'number') {
      errors.push('Invalid "schemaVersion"');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Immediately saves a learning session without debouncing.
   */
  public static async saveImmediate(payload: AutoSavePayload): Promise<LearningSession | null> {
    if (!payload.topic || !payload.topic.trim()) return null;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    const revision = ++this.currentRevision;
    this.notifyStatus('saving');

    try {
      if (this.simulateQuotaExceeded) {
        throw new Error('QuotaExceededError: Local storage allocation exceeded (Simulated)');
      }

      const stableId = this.getStableSessionId(payload.topic);
      const isCompleted = payload.completedSteps.length >= 8 || payload.guidedStep === 'recap';

      const sessionRecord: Partial<LearningSession> & { primaryTopic: string } = {
        schemaVersion: 1,
        id: stableId,
        title: payload.topic,
        primaryTopic: payload.topic,
        domain: payload.domain,
        conceptId: payload.conceptId,
        responseId: payload.responseId,
        capabilityId: payload.capabilityId,
        engineId: payload.engineId,
        currentLessonStep: payload.guidedStep,
        completedSteps: payload.completedSteps,
        activeTab: payload.activeTab,
        isGuidedMode: payload.isGuidedMode,
        isCompleted,
        workspaceId: payload.workspaceId,
        practiceAttempts: {
          multipleChoice: payload.practiceFeedback
            ? {
                selectedIndex: payload.practiceFeedback.selectedIndex,
                isCorrect: payload.practiceFeedback.isCorrect,
                score: payload.practiceFeedback.score,
                explanation: payload.practiceFeedback.explanation,
                misconceptionAlert: payload.practiceFeedback.misconceptionAlert,
                attemptedAt: Date.now(),
              }
            : undefined,
          shortAnswer: payload.shortAnswerState
            ? {
                rawInput: payload.shortAnswerState.rawInput,
                isCorrect: payload.shortAnswerState.isCorrect,
                score: payload.shortAnswerState.score,
                explanation: payload.shortAnswerState.explanation,
                hint: payload.shortAnswerState.hint,
                attemptedAt: Date.now(),
              }
            : undefined,
          totalScore:
            (payload.practiceFeedback?.score || 0) + (payload.shortAnswerState?.score || 0),
        },
        simulationState: {
          parameters: payload.simulationParameters || {},
          activeRenderer: payload.activeRenderer,
          lastOperation: payload.lastOperation,
        },
        experimentLabState: payload.experimentLabState ?? undefined,
        whatIfComparison: payload.whatIfComparison ?? undefined,
      };

      const saved = await sessionPersistence.saveOrUpdateLearningSession(sessionRecord);

      // Protect against older asynchronous saves completing after a newer revision
      if (revision === this.currentRevision) {
        this.notifyStatus('saved', null);
      }
      return saved;
    } catch (e: any) {
      console.warn('LearningSessionPersistence save failed:', e);
      if (revision === this.currentRevision) {
        this.notifyStatus('error', e?.message || 'Failed to save session');
      }
      return null;
    }
  }

  /**
   * Schedules a debounced auto-save (e.g. for slider or continuous parameter tweaks).
   */
  public static debounceAutoSave(payload: AutoSavePayload, delayMs: number = 600): void {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.notifyStatus('saving');
    this.saveTimeout = setTimeout(() => {
      this.saveImmediate(payload);
    }, delayMs);
  }

  /**
   * Restores a saved learning session for the specified topic.
   */
  public static async restoreSession(topic: string): Promise<SavedLearningSessionState | null> {
    if (!topic || !topic.trim()) return null;

    try {
      const session = await sessionPersistence.findSessionByTopic(topic);
      if (!session) return null;

      const validation = this.validateRecord(session);
      if (!validation.isValid) {
        console.warn('Corrupted or invalid session record for topic:', topic, validation.errors);
        return null;
      }

      // Format clean SavedLearningSessionState
      return {
        schemaVersion: session.schemaVersion || 1,
        id: session.id,
        primaryTopic: session.primaryTopic,
        domain: session.domain,
        conceptId: session.conceptId,
        currentLessonStep: (session.currentLessonStep as GuidedLessonStep) || 'concept_meaning',
        completedSteps: (session.completedSteps as GuidedLessonStep[]) || [],
        activeTab: (session.activeTab as any) || 'understand',
        isGuidedMode: session.isGuidedMode !== false,
        isCompleted: session.isCompleted === true,
        practiceAttempts: session.practiceAttempts,
        simulationState: session.simulationState,
        experimentLabState: session.experimentLabState,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt,
        lastOpenedAt: session.lastOpenedAt,
      };
    } catch (e) {
      console.error('Failed to restore learning session for topic:', topic, e);
      return null;
    }
  }

  /**
   * Lists all recent learning sessions sorted by last activity.
   */
  public static async listHistory(): Promise<SavedLearningSessionState[]> {
    try {
      const rawList = await sessionPersistence.listSessions();
      return rawList
        .filter((s) => s.primaryTopic && s.primaryTopic.trim())
        .map((s) => ({
          schemaVersion: s.schemaVersion || 1,
          id: s.id,
          primaryTopic: s.primaryTopic,
          domain: s.domain,
          conceptId: s.conceptId,
          currentLessonStep: (s.currentLessonStep as GuidedLessonStep) || 'concept_meaning',
          completedSteps: (s.completedSteps as GuidedLessonStep[]) || [],
          activeTab: (s.activeTab as any) || 'understand',
          isGuidedMode: s.isGuidedMode !== false,
          isCompleted: s.isCompleted === true,
          practiceAttempts: s.practiceAttempts,
          simulationState: s.simulationState,
          experimentLabState: s.experimentLabState,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          lastOpenedAt: s.lastOpenedAt,
        }));
    } catch (e) {
      console.warn('Failed to list session history:', e);
      return [];
    }
  }

  /**
   * Deletes a specific learning session by its ID.
   */
  public static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      return await sessionPersistence.deleteSession(sessionId);
    } catch (e) {
      console.error('Failed to delete session:', sessionId, e);
      return false;
    }
  }

  /**
   * Clears all saved sessions (primarily used for test cleanup).
   */
  public static async clearAll(): Promise<void> {
    await sessionPersistence.clearAllSessions();
  }
}

