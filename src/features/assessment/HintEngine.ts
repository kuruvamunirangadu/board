/**
 * VisiOS — Phase 5: Progressive Hint Engine
 * Provides structured, graduated hints without prematurely revealing final answers:
 * Level 1: Conceptual guidance (orientation)
 * Level 2: Procedural guidance (actionable method)
 * Level 3: Near-solution guidance (immediate step)
 */

import { AssessmentQuestion } from './AssessmentContracts';

export interface HintResponse {
  hintIndex: number;
  totalHints: number;
  hintText: string;
  hasMoreHints: boolean;
  isSolutionRevealed: boolean;
}

export class HintEngine {
  /**
   * Returns the next progressive hint for an assessment question.
   */
  public static getNextHint(
    question: AssessmentQuestion,
    currentHintIndex: number = 0
  ): HintResponse {
    const hints = question.hints || [];
    const totalHints = hints.length;

    if (totalHints === 0) {
      return {
        hintIndex: 0,
        totalHints: 0,
        hintText: question.explanation || 'No hints available for this problem.',
        hasMoreHints: false,
        isSolutionRevealed: true,
      };
    }

    // If student has already viewed all hints, return final explanation
    if (currentHintIndex >= totalHints) {
      return {
        hintIndex: totalHints,
        totalHints,
        hintText: `Complete Solution: ${question.explanation}`,
        hasMoreHints: false,
        isSolutionRevealed: true,
      };
    }

    const hintText = hints[currentHintIndex];
    const nextIndex = currentHintIndex + 1;
    const hasMoreHints = nextIndex < totalHints;

    return {
      hintIndex: nextIndex,
      totalHints,
      hintText,
      hasMoreHints,
      isSolutionRevealed: false,
    };
  }
}
