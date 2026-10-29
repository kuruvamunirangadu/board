/**
 * VisiOS — Phase 7: Learning Insights Service
 * Generates natural language learning insights, gap diagnoses, and actionable next steps
 * grounded strictly in empirical event data and prerequisite dependencies.
 */

import { TopicProgressItem } from './TopicProgressService';
import { DetailedLearningMetrics } from './LearningMetricsService';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export interface ActionableLearningInsight {
  id: string;
  type: 'prerequisite_gap' | 'misconception_remediation' | 'reinforce_practice' | 'advance_curriculum' | 'gather_evidence';
  title: string;
  message: string;
  conceptId: string;
  conceptTitle: string;
  evidence: string[];
  suggestedAction: string;
  priority: 'high' | 'medium' | 'low';
}

export class LearningInsightsService {
  /**
   * Generates prioritized, explainable insights for a learner based on topic progress and metrics.
   */
  public static generateInsights(
    metrics: DetailedLearningMetrics,
    progressItems: TopicProgressItem[]
  ): ActionableLearningInsight[] {
    const insights: ActionableLearningInsight[] = [];
    const now = Date.now();

    // 1. If student has zero assessment evidence, recommend diagnostic evaluation
    if (metrics.assessedConceptsCount === 0) {
      const firstConcept = progressItems[0];
      insights.push({
        id: `ins_diagnostic_${now}`,
        type: 'gather_evidence',
        title: 'Establish Learning Baseline',
        message: 'Insufficient assessment data to determine strengths and weaknesses. Complete an introductory quiz to calibrate recommendations.',
        conceptId: firstConcept?.conceptId || 'math_linear_functions',
        conceptTitle: firstConcept?.conceptTitle || 'Foundational Mathematics',
        evidence: ['0 evaluated assessment records in current session.'],
        suggestedAction: 'Take a diagnostic knowledge check.',
        priority: 'high',
      });
      return insights;
    }

    // If sample size is small, include a gentle recommendation to gather more evidence
    if (!metrics.isSampleAdequate) {
      insights.push({
        id: `ins_calibration_${now}`,
        type: 'gather_evidence',
        title: 'Continue Calibrating Learning Profile',
        message: 'A few more assessment exercises will increase confidence in your mastery profile.',
        conceptId: progressItems[0]?.conceptId || 'math_linear_functions',
        conceptTitle: progressItems[0]?.conceptTitle || 'Foundational Mathematics',
        evidence: [`Only ${metrics.totalEventsCount} events recorded so far.`],
        suggestedAction: 'Complete additional practice problems to strengthen mastery estimations.',
        priority: 'medium',
      });
    }

    // 2. Scan for concepts with status 'needs_review'
    const reviewItems = progressItems.filter((p) => p.status === 'needs_review');

    for (const item of reviewItems) {
      // Check if unmastered prerequisites exist for this concept
      const prereqs = item.prerequisiteIds || [];
      const unmasteredPrereq = progressItems.find(
        (p) => prereqs.includes(p.conceptId) && p.status !== 'demonstrated_understanding'
      );

      if (unmasteredPrereq) {
        // Prerequisite Gap insight
        insights.push({
          id: `ins_prereq_${item.conceptId}_${now}`,
          type: 'prerequisite_gap',
          title: `Foundational Gap in ${unmasteredPrereq.conceptTitle}`,
          message: `Your difficulties with ${item.conceptTitle} appear rooted in foundational concepts from ${unmasteredPrereq.conceptTitle}. Mastering prerequisites first prevents compounding errors.`,
          conceptId: unmasteredPrereq.conceptId,
          conceptTitle: unmasteredPrereq.conceptTitle,
          evidence: [
            `${item.conceptTitle} requires ${unmasteredPrereq.conceptTitle}.`,
            `${unmasteredPrereq.conceptTitle} current status: ${unmasteredPrereq.status} (${unmasteredPrereq.accuracyFormatted}).`,
          ],
          suggestedAction: `Review ${unmasteredPrereq.conceptTitle} foundations before retrying ${item.conceptTitle}.`,
          priority: 'high',
        });
      } else {
        // Targeted Misconception / Review insight
        insights.push({
          id: `ins_review_${item.conceptId}_${now}`,
          type: 'misconception_remediation',
          title: `Review ${item.conceptTitle}`,
          message: `Recent assessments show repeated errors on ${item.conceptTitle} (${item.accuracyFormatted} accuracy). Working through an interactive visual exercise will clarify key principles.`,
          conceptId: item.conceptId,
          conceptTitle: item.conceptTitle,
          evidence: [
            `${item.consecutiveErrors} consecutive incorrect answers recorded.`,
            `Overall accuracy is ${item.accuracyFormatted}.`,
          ],
          suggestedAction: `Practice targeted problems for ${item.conceptTitle}.`,
          priority: 'high',
        });
      }
    }

    // 3. Scan for concepts with demonstrated understanding ready for advancement
    const readyToAdvance = progressItems.find((p) => p.status === 'demonstrated_understanding');
    if (readyToAdvance && insights.length < 3) {
      // Find a dependent concept that requires readyToAdvance
      const nextConcept = progressItems.find((p) => p.prerequisiteIds.includes(readyToAdvance.conceptId) && p.status === 'not_started');
      if (nextConcept) {
        insights.push({
          id: `ins_advance_${nextConcept.conceptId}_${now}`,
          type: 'advance_curriculum',
          title: `Ready for ${nextConcept.conceptTitle}`,
          message: `You have demonstrated solid mastery in ${readyToAdvance.conceptTitle}. Advance to ${nextConcept.conceptTitle} to build on these skills.`,
          conceptId: nextConcept.conceptId,
          conceptTitle: nextConcept.conceptTitle,
          evidence: [
            `Prerequisite ${readyToAdvance.conceptTitle} mastered with ${readyToAdvance.accuracyFormatted} accuracy.`,
          ],
          suggestedAction: `Begin learning ${nextConcept.conceptTitle}.`,
          priority: 'medium',
        });
      }
    }

    return insights;
  }
}

