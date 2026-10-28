/**
 * VisiOS Milestone 19 — Learner Knowledge Model
 * Evidence-Driven Representation of Learner Knowledge, Active Misconceptions, and Uncertainty
 */

import {
  LearnerEvidenceItem,
  ConceptMasteryEstimate,
  MasteryStatus,
} from '@/types/research';

export class LearnerKnowledgeModel {
  private evidenceMap: Map<string, LearnerEvidenceItem[]> = new Map(); // participantId -> items

  /**
   * Record an observed assessment or diagnostic interaction evidence item.
   * STRICT PRINCIPLE: Time spent, visits, or video playback do NOT count as evidence of mastery.
   */
  public recordEvidence(evidence: LearnerEvidenceItem): void {
    const list = this.evidenceMap.get(evidence.participantId) || [];
    list.push({
      ...evidence,
      timestamp: evidence.timestamp || Date.now(),
    });
    this.evidenceMap.set(evidence.participantId, list);
  }

  /**
   * Retrieve all atomic evidence items for a participant.
   */
  public getParticipantEvidence(participantId: string): LearnerEvidenceItem[] {
    return [...(this.evidenceMap.get(participantId) || [])];
  }

  /**
   * Compute evidence-calibrated mastery estimate for a concept.
   */
  public evaluateConceptMastery(
    participantId: string,
    conceptId: string,
    prerequisiteIds: string[] = []
  ): ConceptMasteryEstimate {
    const allEvidence = this.evidenceMap.get(participantId) || [];
    const conceptEvidence = allEvidence.filter((e) => e.conceptId === conceptId);

    // If no empirical evidence exists, mark as unassessed with maximal uncertainty
    if (conceptEvidence.length === 0) {
      return {
        conceptId,
        masteryStatus: 'unassessed',
        estimatedMasteryProbability: 0.0,
        evidenceCount: 0,
        uncertaintyScore: 1.0,
        activeMisconceptions: [],
        lastAssessedTimestamp: null,
        prerequisiteConfidence: this.evaluatePrerequisiteConfidence(participantId, prerequisiteIds),
      };
    }

    // Sort chronologically
    const sorted = [...conceptEvidence].sort((a, b) => a.timestamp - b.timestamp);
    const lastTimestamp = sorted[sorted.length - 1].timestamp;

    // Detect active misconceptions from recent evidence (last 3 items)
    const recentItems = sorted.slice(-3);
    const activeMisconceptionsSet = new Set<string>();
    recentItems.forEach((item) => {
      if (!item.isCorrect && item.detectedMisconceptionId) {
        activeMisconceptionsSet.add(item.detectedMisconceptionId);
      }
    });

    // Bayesian / Evidence weight calculation:
    // Base prior = 0.5. Each correct adds weight proportional to difficulty; incorrect subtracts.
    let correctWeight = 0;
    let totalWeight = 0;

    sorted.forEach((item) => {
      const difficultyMultiplier =
        item.difficulty === 'advanced' ? 1.5 : item.difficulty === 'intermediate' ? 1.2 : 1.0;
      
      // Penalize if multiple hints were consumed
      const hintPenalty = Math.max(0.4, 1.0 - item.hintsUsed * 0.25);
      const effectiveWeight = difficultyMultiplier * hintPenalty;

      totalWeight += difficultyMultiplier;
      if (item.isCorrect) {
        correctWeight += effectiveWeight;
      }
    });

    const rawAccuracy = totalWeight > 0 ? correctWeight / totalWeight : 0;
    
    // Sample size uncertainty reduction: Uncertainty decays as N increases (U = 1 / sqrt(N + 1))
    const uncertaintyScore = Math.min(1.0, Math.max(0.05, 1.0 / Math.sqrt(sorted.length + 1)));
    
    // Calibrated probability: blend with uniform prior based on uncertainty
    const estimatedMasteryProbability = Number(
      ((rawAccuracy * (1 - uncertaintyScore)) + (0.5 * uncertaintyScore)).toFixed(3)
    );

    let masteryStatus: MasteryStatus = 'developing';
    if (sorted.length < 2) {
      masteryStatus = rawAccuracy >= 0.8 ? 'developing' : 'novice';
    } else if (estimatedMasteryProbability >= 0.80 && uncertaintyScore < 0.5) {
      masteryStatus = 'mastered';
    } else if (estimatedMasteryProbability >= 0.65) {
      masteryStatus = 'proficient';
    } else if (estimatedMasteryProbability >= 0.40) {
      masteryStatus = 'developing';
    } else {
      masteryStatus = 'novice';
    }

    const prerequisiteConfidence = this.evaluatePrerequisiteConfidence(participantId, prerequisiteIds);

    return {
      conceptId,
      masteryStatus,
      estimatedMasteryProbability,
      evidenceCount: sorted.length,
      uncertaintyScore: Number(uncertaintyScore.toFixed(3)),
      activeMisconceptions: Array.from(activeMisconceptionsSet),
      lastAssessedTimestamp: lastTimestamp,
      prerequisiteConfidence,
    };
  }

  /**
   * Evaluate prerequisite confidence across dependency graph nodes
   */
  public evaluatePrerequisiteConfidence(participantId: string, prerequisiteIds: string[]): number {
    if (prerequisiteIds.length === 0) return 1.0;
    let sumMastery = 0;
    prerequisiteIds.forEach((prereqId) => {
      const estimate = this.evaluateConceptMastery(participantId, prereqId, []);
      sumMastery += estimate.estimatedMasteryProbability;
    });
    return Number((sumMastery / prerequisiteIds.length).toFixed(3));
  }

  /**
   * Delete all participant evidence (GDPR Right-to-Erasure compliance)
   */
  public purgeParticipant(participantId: string): void {
    this.evidenceMap.delete(participantId);
  }

  /**
   * Clear all records (testing / resets)
   */
  public reset(): void {
    this.evidenceMap.clear();
  }
}

export const learnerKnowledgeModel = new LearnerKnowledgeModel();

