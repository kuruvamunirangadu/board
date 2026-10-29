/**
 * VisiOS — Phase 7: Topic Progress Service
 * Maps student assessment evidence and events to structured topic progress states
 * across all registered curriculum concepts in TRUSTED_CONCEPT_REGISTRY.
 */

import { AssessmentAttemptRecord } from '@/types/analytics';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export type TopicProgressStatus =
  | 'not_started'
  | 'learning'
  | 'developing'
  | 'demonstrated_understanding'
  | 'needs_review';

export interface TopicProgressItem {
  conceptId: string;
  conceptTitle: string;
  domain: string;
  status: TopicProgressStatus;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number | null;
  accuracyFormatted: string;
  consecutiveErrors: number;
  hasActiveMisconception: boolean;
  prerequisiteIds: string[];
  rationale: string;
  lastAssessedAt: number | null;
}

export class TopicProgressService {
  /**
   * Computes topic progress records across all registered curriculum concepts.
   */
  public static computeTopicProgress(
    attempts: AssessmentAttemptRecord[],
    filterDomain?: string
  ): TopicProgressItem[] {
    const attemptsByConcept = new Map<string, AssessmentAttemptRecord[]>();
    for (const att of attempts) {
      if (!attemptsByConcept.has(att.conceptId)) {
        attemptsByConcept.set(att.conceptId, []);
      }
      attemptsByConcept.get(att.conceptId)!.push(att);
    }

    const results: TopicProgressItem[] = [];

    for (const [cId, node] of Object.entries(TRUSTED_CONCEPT_REGISTRY)) {
      if (filterDomain && node.domain !== filterDomain) {
        continue;
      }

      const cAttempts = attemptsByConcept.get(cId) || [];
      const total = cAttempts.length;
      const correct = cAttempts.filter((a) => a.isCorrect).length;
      const sorted = [...cAttempts].sort((a, b) => b.timestamp - a.timestamp); // latest first

      let consecutiveErrors = 0;
      for (const a of sorted) {
        if (!a.isCorrect) consecutiveErrors++;
        else break;
      }

      let accuracy: number | null = null;
      let accuracyFormatted = 'N/A';
      if (total > 0) {
        accuracy = Number(((correct / total) * 100).toFixed(1));
        accuracyFormatted = `${accuracy}%`;
      }

      let status: TopicProgressStatus = 'not_started';
      let rationale = 'No learning or assessment activity recorded yet.';

      if (total === 0) {
        status = 'not_started';
        rationale = 'Concept has not been evaluated.';
      } else if (consecutiveErrors >= 2 || (accuracy !== null && accuracy < 50 && total >= 2)) {
        status = 'needs_review';
        rationale = `Consecutive errors (${consecutiveErrors}) or low accuracy (${accuracyFormatted}) indicate a knowledge gap requiring review.`;
      } else if (accuracy !== null && accuracy >= 70 && total >= 3) {
        status = 'demonstrated_understanding';
        rationale = `Demonstrated solid understanding across ${total} attempts with ${accuracyFormatted} accuracy.`;
      } else if (total === 1) {
        status = 'learning';
        rationale = 'Initial assessment attempted. Additional practice needed to confirm mastery.';
      } else {
        status = 'developing';
        rationale = `In-progress development (${accuracyFormatted} accuracy over ${total} attempts).`;
      }

      const lastAssessedAt = sorted.length > 0 ? sorted[0].timestamp : null;

      results.push({
        conceptId: cId,
        conceptTitle: node.title,
        domain: node.domain,
        status,
        totalAttempts: total,
        correctAttempts: correct,
        accuracy,
        accuracyFormatted,
        consecutiveErrors,
        hasActiveMisconception: consecutiveErrors >= 2,
        prerequisiteIds: node.prerequisiteIds || [],
        rationale,
        lastAssessedAt,
      });
    }

    return results;
  }
}

