/**
 * VisiOS — Phase 4: Mastery Estimator
 * Deterministically computes concept mastery from empirical student interactions.
 * Accounts for difficulty, hints, recency, consecutive outcomes, and sample size uncertainty.
 */

import {
  ConceptMastery,
  MasteryLevel,
  StudentInteraction,
} from './AdaptiveLearningContracts';

export class MasteryEstimator {
  /**
   * Evaluates concept mastery state from all historical interactions on a given concept.
   */
  public static estimateMastery(
    conceptId: string,
    interactions: StudentInteraction[],
    existingMastery?: ConceptMastery
  ): ConceptMastery {
    const conceptInteractions = interactions.filter((i) => i.conceptId === conceptId);

    if (conceptInteractions.length === 0) {
      return (
        existingMastery || {
          conceptId,
          masteryLevel: 'not_started',
          totalAttempts: 0,
          correctAttempts: 0,
          recentAccuracy: 0,
          consecutiveCorrect: 0,
          confidenceScore: 0.0,
          updatedAt: new Date().toISOString(),
          identifiedMisconceptions: [],
        }
      );
    }

    // Filter relevant assessment attempts (quiz, practice)
    const evaluatable = conceptInteractions.filter(
      (i) => i.type === 'quiz_answer' || i.type === 'practice_attempt'
    );

    if (evaluatable.length === 0) {
      // If student only viewed explanations or canvas actions
      return {
        conceptId,
        masteryLevel: existingMastery?.masteryLevel || 'not_started',
        totalAttempts: 0,
        correctAttempts: 0,
        recentAccuracy: existingMastery?.recentAccuracy || 0,
        consecutiveCorrect: 0,
        confidenceScore: 0.1, // Minimal confidence without assessment
        lastPracticedAt: conceptInteractions[conceptInteractions.length - 1].timestamp,
        updatedAt: new Date().toISOString(),
        identifiedMisconceptions: existingMastery?.identifiedMisconceptions || [],
      };
    }

    const totalAttempts = evaluatable.length;
    let correctAttempts = 0;
    let consecutiveCorrect = 0;
    let consecutiveErrors = 0;

    // Track consecutive results from end backwards
    let countingConsecutive = true;
    for (let idx = evaluatable.length - 1; idx >= 0; idx--) {
      const item = evaluatable[idx];
      if (item.isCorrect) {
        correctAttempts++;
        if (countingConsecutive) consecutiveCorrect++;
      } else {
        if (countingConsecutive) {
          consecutiveErrors++;
          countingConsecutive = false;
        }
      }
    }

    // Weight recent interactions more heavily (window of last 5)
    const recentWindow = evaluatable.slice(-5);
    let weightedScore = 0;
    let weightedTotal = 0;

    evaluatable.forEach((item, index) => {
      // Recency multiplier (0.8 for oldest to 1.2 for newest)
      const recency = 0.8 + (0.4 * index) / Math.max(1, evaluatable.length - 1);
      // Difficulty multiplier
      const diffMultiplier =
        item.difficulty === 'advanced'
          ? 1.5
          : item.difficulty === 'intermediate'
          ? 1.2
          : 1.0;
      // Hint deduction: each hint consumed reduces credit by 20% down to 0.4
      const hintDiscount = item.hintsUsed ? Math.max(0.4, 1.0 - item.hintsUsed * 0.2) : 1.0;

      const effectiveWeight = diffMultiplier * recency;
      weightedTotal += effectiveWeight;

      if (item.isCorrect) {
        weightedScore += effectiveWeight * hintDiscount;
      }
    });

    const recentCorrect = recentWindow.filter((i) => i.isCorrect).length;
    const recentAccuracy = Number((recentCorrect / recentWindow.length).toFixed(2));
    const rawAccuracy = weightedTotal > 0 ? weightedScore / weightedTotal : 0;

    // Sample size uncertainty: confidence grows as totalAttempts increases
    // C = 1 - (1 / sqrt(totalAttempts + 1))
    const confidenceScore = Number(
      Math.min(1.0, Math.max(0.1, 1 - 1 / Math.sqrt(totalAttempts + 1))).toFixed(2)
    );

    // Has student attempted intermediate or advanced items?
    const hasHigherDifficultyAttempts = evaluatable.some(
      (i) => (i.difficulty === 'intermediate' || i.difficulty === 'advanced') && i.isCorrect
    );

    // Determine Mastery Level
    let masteryLevel: MasteryLevel = 'beginner';

    if (totalAttempts < 2) {
      // Insufficient sample size for proficiency; even with 1 correct, max is developing
      masteryLevel = evaluatable[0].isCorrect ? 'developing' : 'beginner';
    } else if (
      rawAccuracy >= 0.85 &&
      recentAccuracy >= 0.8 &&
      consecutiveCorrect >= 3 &&
      totalAttempts >= 5 &&
      hasHigherDifficultyAttempts
    ) {
      masteryLevel = 'mastered';
    } else if (rawAccuracy >= 0.7 && recentAccuracy >= 0.6 && totalAttempts >= 3) {
      masteryLevel = 'proficient';
    } else if (rawAccuracy >= 0.45 || recentAccuracy >= 0.5) {
      masteryLevel = 'developing';
    } else {
      masteryLevel = 'beginner';
    }

    // Preserve identified misconceptions
    const misconceptions = Array.from(
      new Set([
        ...(existingMastery?.identifiedMisconceptions || []),
        ...conceptInteractions
          .map((i) => i.detectedMisconceptionId)
          .filter((id): id is string => Boolean(id)),
      ])
    );

    return {
      conceptId,
      masteryLevel,
      totalAttempts,
      correctAttempts,
      recentAccuracy,
      consecutiveCorrect,
      confidenceScore,
      lastPracticedAt: evaluatable[evaluatable.length - 1].timestamp,
      updatedAt: new Date().toISOString(),
      identifiedMisconceptions: misconceptions,
    };
  }
}
