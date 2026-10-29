/**
 * VisiOS — Phase 8: Intelligent Hint Generation Service
 * Delivers progressive, graduated hints without prematurely disclosing complete answers.
 * Tracks session hint history to avoid repetition and ensures context fidelity.
 */

import { TutoringHintProgress } from './TutoringContracts';

export interface ExerciseHintDefinition {
  exerciseId: string;
  conceptId: string;
  hints: string[];
  solutionExplanation: string;
}

export class HintGenerationService {
  // Session hint tracker: key = `${sessionId}:${exerciseId}`
  private sessionHintLevels: Map<string, number> = new Map();

  /**
   * Catalog of canonical graduated hints for standard curriculum exercises.
   */
  private static readonly CANONICAL_HINTS: Record<string, string[]> = {
    cs_binary_search: [
      'What critical property does the sorted order provide about elements to the left and right of any chosen index?',
      'Which element in the active search window should you examine first to divide the remaining possibilities in half?',
      'After comparing the middle element with your target, which half can be safely eliminated from consideration?',
      'Update pointers: if array[mid] < target, set low = mid + 1; otherwise set high = mid - 1. Repeat until array[mid] == target.',
    ],
    math_linear_functions: [
      'Identify the slope-intercept form equation: y = mx + c. What does each variable represent?',
      'Where does the line cross the vertical y-axis when the horizontal input x = 0?',
      'How does a slope of m affect the vertical rise for every 1 unit of horizontal run?',
      'Substitute your given point (x, y) into y = mx + c to solve for the missing coefficient.',
    ],
    phys_newton_laws: [
      'What is the fundamental relationship between net force, mass, and acceleration according to Newton’s Second Law?',
      'Ensure all physical quantities are in standard SI units: kilograms (kg) for mass, meters per second squared (m/s²) for acceleration.',
      'Apply F_net = m · a: isolate the unknown variable by dividing both sides by the known parameter.',
      'Calculate the numerical result and verify the unit (Newtons for force, m/s² for acceleration).',
    ],
  };

  /**
   * Request the next progressive hint for an active session and exercise.
   */
  public getNextHint(
    sessionId: string,
    exerciseId: string,
    conceptId: string,
    customHints?: string[],
    solutionExplanation?: string
  ): TutoringHintProgress {
    const sessionKey = `${sessionId}:${exerciseId}`;
    const currentLevel = this.sessionHintLevels.get(sessionKey) || 0;

    const availableHints =
      customHints && customHints.length > 0
        ? customHints
        : HintGenerationService.CANONICAL_HINTS[conceptId] || [
            'Review the core definition and formulas for this concept.',
            'Break down the problem into smaller algebraic or procedural steps.',
            'Check boundary conditions and verify units or data types.',
            solutionExplanation || 'Complete step-by-step solution.',
          ];

    const nextLevel = currentLevel + 1;
    this.sessionHintLevels.set(sessionKey, nextLevel);

    const deliveredHints = availableHints.slice(0, nextLevel);
    const isSolutionRevealed = nextLevel >= availableHints.length;
    const nextHintText = deliveredHints[deliveredHints.length - 1];

    return {
      exerciseId,
      totalHintsAvailable: availableHints.length,
      currentHintLevel: nextLevel,
      deliveredHints,
      isSolutionRevealed,
      nextHintText,
    };
  }

  /**
   * Inspect current hint progress without advancing to the next level.
   */
  public getHintState(
    sessionId: string,
    exerciseId: string,
    conceptId: string,
    customHints?: string[]
  ): TutoringHintProgress {
    const sessionKey = `${sessionId}:${exerciseId}`;
    const currentLevel = this.sessionHintLevels.get(sessionKey) || 0;

    const availableHints =
      customHints && customHints.length > 0
        ? customHints
        : HintGenerationService.CANONICAL_HINTS[conceptId] || [];

    const deliveredHints = availableHints.slice(0, currentLevel);
    const isSolutionRevealed = currentLevel >= availableHints.length && availableHints.length > 0;
    const nextHintText = currentLevel > 0 ? deliveredHints[deliveredHints.length - 1] : undefined;

    return {
      exerciseId,
      totalHintsAvailable: availableHints.length,
      currentHintLevel: currentLevel,
      deliveredHints,
      isSolutionRevealed,
      nextHintText,
    };
  }

  /**
   * Reset hint progression for a session (e.g. on new exercise attempt).
   */
  public resetSession(sessionId: string): void {
    for (const key of Array.from(this.sessionHintLevels.keys())) {
      if (key.startsWith(`${sessionId}:`)) {
        this.sessionHintLevels.delete(key);
      }
    }
  }
}

export const defaultHintService = new HintGenerationService();
