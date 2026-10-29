/**
 * VisiOS — Phase 7: Learning Metrics Service
 * Computes evidence-grounded performance metrics from validated event streams.
 * Strictly separates active understanding from passive canvas exploration or time spent.
 */

import { LearningEvent } from './LearningEventProcessor';
import { AssessmentAttemptRecord } from '@/types/analytics';

export interface DetailedLearningMetrics {
  learnerId: string;
  totalEventsCount: number;
  exerciseAccuracy: number | null; // null if 0 attempts
  exerciseAccuracyFormatted: string;
  firstAttemptAccuracy: number | null;
  firstAttemptAccuracyFormatted: string;
  assessedConceptsCount: number;
  totalConceptsAvailable: number;
  coveragePercentage: number;
  hintDependencyRatio: number; // hints requested per attempt
  activeMisconceptionsCount: number;
  masteryConfidenceScore: number; // 0.0 to 1.0
  totalTimeSpentMinutes: number;
  isSampleAdequate: boolean;
}

export class LearningMetricsService {
  /**
   * Computes holistic metrics for a learner based on events and verified assessment attempts.
   */
  public static computeMetrics(
    learnerId: string,
    events: LearningEvent[],
    attempts: AssessmentAttemptRecord[],
    totalSubjectConceptsCount: number = 10
  ): DetailedLearningMetrics {
    const learnerEvents = events.filter((e) => e.learnerId === learnerId);
    const learnerAttempts = attempts.filter((a) => a.learnerId === learnerId);

    // Filter out shared collaborative events from individual score calculation
    const individualAttempts = learnerAttempts.filter(
      (a) => !learnerEvents.some((e) => e.activityId === a.id && e.isCollaborative)
    );

    const totalAttempts = individualAttempts.length;
    const correctAttempts = individualAttempts.filter((a) => a.isCorrect).length;

    // 1. Exercise Accuracy
    let exerciseAccuracy: number | null = null;
    let exerciseAccuracyFormatted = 'N/A';
    if (totalAttempts > 0) {
      exerciseAccuracy = Number(((correctAttempts / totalAttempts) * 100).toFixed(1));
      exerciseAccuracyFormatted = `${exerciseAccuracy}%`;
    }

    // 2. First-Attempt Accuracy (group by questionId, check first chronological attempt)
    const questionFirstAttempts = new Map<string, AssessmentAttemptRecord>();
    const sortedAttempts = [...individualAttempts].sort((a, b) => a.timestamp - b.timestamp);

    for (const att of sortedAttempts) {
      if (!questionFirstAttempts.has(att.questionId)) {
        questionFirstAttempts.set(att.questionId, att);
      }
    }

    let firstAttemptAccuracy: number | null = null;
    let firstAttemptAccuracyFormatted = 'N/A';
    if (questionFirstAttempts.size > 0) {
      const firstCorrect = Array.from(questionFirstAttempts.values()).filter((a) => a.isCorrect).length;
      firstAttemptAccuracy = Number(((firstCorrect / questionFirstAttempts.size) * 100).toFixed(1));
      firstAttemptAccuracyFormatted = `${firstAttemptAccuracy}%`;
    }

    // 3. Topic Coverage
    const assessedConcepts = new Set(individualAttempts.map((a) => a.conceptId));
    const coveragePercentage = totalSubjectConceptsCount > 0
      ? Number(((assessedConcepts.size / totalSubjectConceptsCount) * 100).toFixed(1))
      : 0;

    // 4. Hint Dependency (hints requested per attempt)
    const hintEvents = learnerEvents.filter((e) => e.eventType === 'hint_requested');
    const hintDependencyRatio = totalAttempts > 0
      ? Number((hintEvents.length / totalAttempts).toFixed(2))
      : 0;

    // 5. Total Time Spent in Minutes (strictly tracked as engagement, not proof of understanding)
    let totalTimeSpentSeconds = 0;
    for (const att of individualAttempts) {
      totalTimeSpentSeconds += att.timeSpentSeconds || 0;
    }
    const totalTimeSpentMinutes = Number((totalTimeSpentSeconds / 60).toFixed(1));

    // 6. Mastery Confidence: grows with sample size (C = 1 - 1 / sqrt(N + 1))
    const masteryConfidenceScore = totalAttempts > 0
      ? Number(Math.min(1.0, Math.max(0.1, 1 - 1 / Math.sqrt(totalAttempts + 1))).toFixed(2))
      : 0.0;

    return {
      learnerId,
      totalEventsCount: learnerEvents.length,
      exerciseAccuracy,
      exerciseAccuracyFormatted,
      firstAttemptAccuracy,
      firstAttemptAccuracyFormatted,
      assessedConceptsCount: assessedConcepts.size,
      totalConceptsAvailable: totalSubjectConceptsCount,
      coveragePercentage,
      hintDependencyRatio,
      activeMisconceptionsCount: 0,
      masteryConfidenceScore,
      totalTimeSpentMinutes,
      isSampleAdequate: totalAttempts >= 3,
    };
  }
}

