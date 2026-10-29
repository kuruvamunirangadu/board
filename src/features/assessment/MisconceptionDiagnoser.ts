/**
 * VisiOS — Phase 5: Misconception Diagnoser
 * Maps observed assessment errors to known domain misconception patterns.
 * Produces structured diagnostic alerts and recommended remedial interventions.
 */

import { MisconceptionDetector } from '../adaptive/MisconceptionDetector';
import { VALIDATED_MISCONCEPTIONS } from '../adaptive/misconception-catalog';

export interface DiagnosisResult {
  misconceptionId: string;
  name: string;
  description: string;
  remedialExplanation: string;
  remedialIntervention: string;
  isConfirmed: boolean;
}

export class MisconceptionDiagnoser {
  /**
   * Diagnoses a single submitted answer against known misconception patterns.
   */
  public static diagnose(
    conceptId: string,
    submittedAnswer: string | number
  ): DiagnosisResult | null {
    // 1. Run through rule-based detectors
    const rule = MisconceptionDetector.detectInInteraction({
      interactionId: 'diag_check',
      studentId: 'check',
      conceptId,
      type: 'quiz_answer',
      isCorrect: false,
      selectedAnswer: submittedAnswer,
      timestamp: new Date().toISOString(),
    });

    if (rule) {
      return {
        misconceptionId: rule.id,
        name: rule.name,
        description: rule.description,
        remedialExplanation: rule.remedialExplanation,
        remedialIntervention: rule.remedialAction,
        isConfirmed: false, // Single error is potential, not yet confirmed
      };
    }

    // 2. Check research catalog
    const catalogMatch = Object.values(VALIDATED_MISCONCEPTIONS).find(
      (m) => m.conceptId === conceptId || m.conceptId.includes(conceptId)
    );

    if (catalogMatch) {
      return {
        misconceptionId: catalogMatch.id,
        name: catalogMatch.name,
        description: catalogMatch.description,
        remedialExplanation: catalogMatch.remedialExplanation,
        remedialIntervention: catalogMatch.remedialIntervention,
        isConfirmed: false,
      };
    }

    return null;
  }
}

