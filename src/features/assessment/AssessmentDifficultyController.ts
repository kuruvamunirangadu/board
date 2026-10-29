/**
 * VisiOS — Phase 5: Assessment Difficulty Controller
 * Dynamically adjusts question difficulty (Levels 1 to 5) based on demonstrated
 * student performance, consecutive outcomes, and hint dependencies.
 */

import {
  AssessmentDifficultyLevel,
  AssessmentSessionState,
  AssessmentAttempt,
} from './AssessmentContracts';

export class AssessmentDifficultyController {
  /**
   * Calculates the next appropriate difficulty level based on recent session attempts.
   */
  public static calculateNextDifficulty(
    currentDifficulty: AssessmentDifficultyLevel,
    attempts: AssessmentAttempt[]
  ): AssessmentDifficultyLevel {
    if (!attempts || attempts.length === 0) {
      return currentDifficulty;
    }

    const lastAttempt = attempts[attempts.length - 1];

    // If student consumed 2+ hints on last attempt, do not promote difficulty
    const usedHeavyHints = lastAttempt.hintsRequested >= 2;

    // Check consecutive outcomes over last 3 attempts
    const recent = attempts.slice(-3);
    const consecutiveCorrect = recent.filter((a) => a.evaluation.status === 'correct').length;
    const consecutiveIncorrect = recent.filter((a) => a.evaluation.status === 'incorrect').length;

    // RULE 1: Two consecutive correct answers with minimal hints -> Increase difficulty
    if (consecutiveCorrect >= 2 && !usedHeavyHints) {
      const next = Math.min(5, currentDifficulty + 1) as AssessmentDifficultyLevel;
      return next;
    }

    // RULE 2: Two consecutive incorrect answers -> Decrease difficulty
    if (consecutiveIncorrect >= 2) {
      const next = Math.max(1, currentDifficulty - 1) as AssessmentDifficultyLevel;
      return next;
    }

    // RULE 3: Isolated single error or mixed results -> Maintain difficulty
    return currentDifficulty;
  }
}

