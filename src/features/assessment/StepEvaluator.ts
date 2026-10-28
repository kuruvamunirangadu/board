/**
 * VisiOS — Phase 5: Step-by-Step Reasoning Evaluator
 * Evaluates intermediate derivations, algebraic transformations, and reasoning transitions.
 * Separates conceptual method validity from mechanical arithmetic mistakes.
 */

import { StepEvaluation, StepErrorCategory } from './AssessmentContracts';
import { MathematicalCorrectnessEngine } from '../learning/MathematicalCorrectnessEngine';

export class StepEvaluator {
  /**
   * Evaluates an ordered array of submitted derivation steps for a problem.
   */
  public static evaluateSteps(
    submittedSteps: string[],
    expectedSteps?: string[]
  ): {
    stepEvaluations: StepEvaluation[];
    allStepsValid: boolean;
    errorCount: number;
    firstErrorIndex: number | null;
  } {
    if (!submittedSteps || submittedSteps.length === 0) {
      return {
        stepEvaluations: [],
        allStepsValid: false,
        errorCount: 1,
        firstErrorIndex: 0,
      };
    }

    const evaluations: StepEvaluation[] = [];
    let firstErrorIndex: number | null = null;

    // Check linear derivation steps if they contain equations with '='
    const isEquationDerivation = submittedSteps.some((s) => s.includes('='));

    if (isEquationDerivation) {
      const audit = MathematicalCorrectnessEngine.validateLinearDerivationSteps(submittedSteps);

      for (let i = 0; i < submittedSteps.length; i++) {
        const stepResult = audit.stepResults[i];
        const stepText = submittedSteps[i];

        if (stepResult && !stepResult.isValid) {
          if (firstErrorIndex === null) firstErrorIndex = i;

          let errorCategory: StepErrorCategory = 'algebraic';
          if (stepText.includes('+') && stepResult.issue?.includes('shifted')) {
            errorCategory = 'algebraic'; // Sign inversion or algebraic error
          } else if (stepResult.issue?.includes('arithmetic')) {
            errorCategory = 'arithmetic';
          }

          evaluations.push({
            stepIndex: i + 1,
            submittedStep: stepText,
            isValid: false,
            errorCategory,
            feedback: stepResult.issue || `Step ${i + 1} contains an invalid algebraic transition.`,
          });
        } else {
          evaluations.push({
            stepIndex: i + 1,
            submittedStep: stepText,
            isValid: true,
            feedback: `Step ${i + 1} is algebraically valid.`,
          });
        }
      }

      return {
        stepEvaluations: evaluations,
        allStepsValid: audit.allStepsValid,
        errorCount: evaluations.filter((e) => !e.isValid).length,
        firstErrorIndex,
      };
    }

    // Default step matching against expectedSteps
    for (let i = 0; i < submittedSteps.length; i++) {
      const submitted = submittedSteps[i].trim();
      const expected = expectedSteps && expectedSteps[i] ? expectedSteps[i].trim() : undefined;

      const normalizedSub = submitted.replace(/\s/g, '').toLowerCase();
      const normalizedExp = expected ? expected.replace(/\s/g, '').toLowerCase() : undefined;

      if (expected && normalizedSub !== normalizedExp) {
        if (firstErrorIndex === null) firstErrorIndex = i;
        evaluations.push({
          stepIndex: i + 1,
          submittedStep: submitted,
          isValid: false,
          errorCategory: 'conceptual',
          feedback: `Expected "${expected}", but received "${submitted}".`,
        });
      } else {
        evaluations.push({
          stepIndex: i + 1,
          submittedStep: submitted,
          isValid: true,
          feedback: `Step ${i + 1} verified.`,
        });
      }
    }

    const errorCount = evaluations.filter((e) => !e.isValid).length;
    return {
      stepEvaluations: evaluations,
      allStepsValid: errorCount === 0,
      errorCount,
      firstErrorIndex,
    };
  }
}
