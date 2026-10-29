/**
 * VisiOS — Phase 7: Learning Event Ingestion & Normalization Pipeline
 * Ingests, validates, deduplicates, and chronologically sorts learning events
 * across canvas sessions, assessment attempts, code tracing, and collaborative spaces.
 */

export type LearningEventType =
  | 'lesson_started'
  | 'concept_viewed'
  | 'exercise_attempted'
  | 'answer_submitted'
  | 'hint_requested'
  | 'exercise_completed'
  | 'assessment_completed'
  | 'learning_path_completed'
  | 'concept_reviewed'
  | 'collaborative_session_joined'
  | 'collaborative_action';

export interface LearningEvent {
  eventId: string;
  sessionId: string;
  learnerId: string;
  eventType: LearningEventType;
  timestamp: string;
  subjectId?: string;
  conceptId?: string;
  activityId?: string;
  isCollaborative?: boolean;
  metadata?: Record<string, unknown>;
}

export interface IngestionResult {
  accepted: boolean;
  event?: LearningEvent;
  isDuplicate?: boolean;
  error?: string;
}

export class LearningEventProcessor {
  private events: LearningEvent[] = [];
  private processedEventIds = new Set<string>();

  /**
   * Strictly validates incoming raw event payload.
   */
  public static validateEvent(raw: unknown): { isValid: boolean; error?: string; event?: LearningEvent } {
    if (!raw || typeof raw !== 'object') {
      return { isValid: false, error: 'Event payload must be a non-null object.' };
    }

    const candidate = raw as Record<string, unknown>;

    if (!candidate.eventId || typeof candidate.eventId !== 'string' || !candidate.eventId.trim()) {
      return { isValid: false, error: 'Missing or empty eventId.' };
    }

    if (!candidate.learnerId || typeof candidate.learnerId !== 'string' || !candidate.learnerId.trim()) {
      return { isValid: false, error: 'Missing or empty learnerId.' };
    }

    if (!candidate.sessionId || typeof candidate.sessionId !== 'string' || !candidate.sessionId.trim()) {
      return { isValid: false, error: 'Missing or empty sessionId.' };
    }

    if (!candidate.eventType || typeof candidate.eventType !== 'string') {
      return { isValid: false, error: 'Missing or invalid eventType.' };
    }

    const timestamp = candidate.timestamp
      ? String(candidate.timestamp)
      : new Date().toISOString();

    const event: LearningEvent = {
      eventId: candidate.eventId.trim(),
      sessionId: candidate.sessionId.trim(),
      learnerId: candidate.learnerId.trim(),
      eventType: candidate.eventType as LearningEventType,
      timestamp,
      subjectId: candidate.subjectId ? String(candidate.subjectId) : undefined,
      conceptId: candidate.conceptId ? String(candidate.conceptId) : undefined,
      activityId: candidate.activityId ? String(candidate.activityId) : undefined,
      isCollaborative: Boolean(candidate.isCollaborative),
      metadata: candidate.metadata && typeof candidate.metadata === 'object' ? (candidate.metadata as Record<string, unknown>) : {},
    };

    return { isValid: true, event };
  }

  /**
   * Ingest an event with automatic validation, deduplication, and order preservation.
   */
  public ingest(rawEvent: unknown): IngestionResult {
    const validation = LearningEventProcessor.validateEvent(rawEvent);
    if (!validation.isValid || !validation.event) {
      return { accepted: false, error: validation.error };
    }

    const event = validation.event;

    // Deduplication check: ignore duplicate events with the exact same eventId
    if (this.processedEventIds.has(event.eventId)) {
      return { accepted: false, isDuplicate: true, error: `Duplicate event rejected: ${event.eventId}` };
    }

    this.processedEventIds.add(event.eventId);
    this.events.push(event);

    return { accepted: true, event };
  }

  /**
   * Retrieve all chronological events for a specific learner.
   * Handles out-of-order arrival by sorting deterministically by timestamp.
   */
  public getLearnerEvents(learnerId: string, filter?: { conceptId?: string; eventType?: LearningEventType }): LearningEvent[] {
    let filtered = this.events.filter((e) => e.learnerId === learnerId);

    if (filter?.conceptId) {
      filtered = filtered.filter((e) => e.conceptId === filter.conceptId);
    }

    if (filter?.eventType) {
      filtered = filtered.filter((e) => e.eventType === filter.eventType);
    }

    // Sort chronologically ascending
    return filtered.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Retrieve events for a specific session.
   */
  public getSessionEvents(sessionId: string): LearningEvent[] {
    return this.events
      .filter((e) => e.sessionId === sessionId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  /**
   * Clear in-memory event buffer (for testing).
   */
  public clear(): void {
    this.events = [];
    this.processedEventIds.clear();
  }
}

export const defaultEventProcessor = new LearningEventProcessor();

