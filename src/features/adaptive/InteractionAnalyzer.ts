/**
 * VisiOS — Phase 4: Interaction Analyzer
 * Converts raw learning interactions (quiz answers, hint requests, canvas activities, self-assessments)
 * into standardized, validated StudentInteraction evidence records.
 */

import {
  StudentInteraction,
  InteractionType,
  ActivityDifficulty,
} from './AdaptiveLearningContracts';
import { MisconceptionDetector } from './MisconceptionDetector';

export interface RawInteractionPayload {
  studentId: string;
  conceptId: string;
  type: InteractionType;
  isCorrect?: boolean;
  selectedAnswer?: string | number;
  expectedAnswer?: string | number;
  difficulty?: ActivityDifficulty;
  hintsUsed?: number;
  timeSpentMs?: number;
  timestamp?: string;
  detectedMisconceptionId?: string;
}

export class InteractionAnalyzer {
  /**
   * Validates and normalizes incoming interaction data into a strict StudentInteraction item.
   */
  public static analyzeInteraction(payload: RawInteractionPayload): StudentInteraction {
    if (!payload.studentId || !payload.studentId.trim()) {
      throw new Error('Student ID is required to record interaction evidence.');
    }
    if (!payload.conceptId || !payload.conceptId.trim()) {
      throw new Error('Concept ID is required to associate interaction with knowledge graph.');
    }

    const timestamp = payload.timestamp || new Date().toISOString();
    const interactionId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    // Build base interaction
    const interaction: StudentInteraction = {
      interactionId,
      studentId: payload.studentId.trim(),
      conceptId: payload.conceptId.trim(),
      type: payload.type || 'quiz_answer',
      isCorrect: payload.isCorrect,
      selectedAnswer: payload.selectedAnswer,
      expectedAnswer: payload.expectedAnswer,
      difficulty: payload.difficulty || 'beginner',
      hintsUsed: Math.max(0, payload.hintsUsed || 0),
      timeSpentMs: payload.timeSpentMs ? Math.max(0, payload.timeSpentMs) : undefined,
      timestamp,
      detectedMisconceptionId: payload.detectedMisconceptionId,
    };

    // If an error answer was provided without explicit misconception ID, run automated rule detection
    if (interaction.isCorrect === false && !interaction.detectedMisconceptionId) {
      const detected = MisconceptionDetector.detectInInteraction(interaction);
      if (detected) {
        interaction.detectedMisconceptionId = detected.id;
      }
    }

    return interaction;
  }
}
