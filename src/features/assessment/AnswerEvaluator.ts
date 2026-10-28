/**
 * VisiOS — Phase 5: Deterministic Answer Evaluator
 * Evaluates student responses across numeric, multiple-choice, rational fraction,
 * symbolic, and step-by-step problems without language model hallucination.
 */

import {
  AssessmentQuestion,
  AnswerEvaluation,
  StepEvaluation,
} from './AssessmentContracts';
import { StepEvaluator } from './StepEvaluator';
import { MathematicalCorrectnessEngine } from '../learning/MathematicalCorrectnessEngine';
import { MisconceptionDiagnoser } from './MisconceptionDiagnoser';

export class AnswerEvaluator {
  /**
   * Evaluates a student's answer and optional intermediate derivation steps.
   */
  public static evaluate(
    question: AssessmentQuestion,
    submittedAnswer: string | number,
    submittedSteps?: string[]
  ): AnswerEvaluation {
    const rawSubmitted = String(submittedAnswer).trim();

    // Check for unsupported question strategy
    if (question.evaluationStrategy === 'unsupported') {
      return {
        status: 'unable_to_evaluate',
        finalAnswerCorrect: null,
        reasoningCorrect: null,
        stepEvaluations: [],
        score: 0,
        feedback: 'This question type cannot be evaluated deterministically by the current engine capability.',
      };
    }

    // 1. Evaluate intermediate steps if provided
    let stepEvals: StepEvaluation[] = [];
    let reasoningCorrect: boolean | null = null;

    if (submittedSteps && submittedSteps.length > 0) {
      const stepAnalysis = StepEvaluator.evaluateSteps(submittedSteps, question.expectedSteps);
      stepEvals = stepAnalysis.stepEvaluations;
      reasoningCorrect = stepAnalysis.allStepsValid;
    }

    // 2. Evaluate final answer based on question type / strategy
    let finalAnswerCorrect = false;

    if (question.evaluationStrategy === 'exact_option' || question.questionType === 'multiple_choice') {
      // Multiple choice option evaluation
      if (typeof submittedAnswer === 'number' && question.correctOptionIndex !== undefined) {
        finalAnswerCorrect = submittedAnswer === question.correctOptionIndex;
      } else {
        const expected = String(question.expectedAnswer || '').trim().toLowerCase();
        finalAnswerCorrect = rawSubmitted.toLowerCase() === expected;
      }
    } else if (question.evaluationStrategy === 'deterministic_numeric' || question.questionType === 'numeric') {
      // Numeric evaluation with optional tolerance
      const subNum = parseFloat(rawSubmitted);
      const expNum = typeof question.expectedAnswer === 'number'
        ? question.expectedAnswer
        : parseFloat(String(question.expectedAnswer));

      const tolerance = question.tolerance || 0.001;
      finalAnswerCorrect = !isNaN(subNum) && !isNaN(expNum) && Math.abs(subNum - expNum) <= tolerance;
    } else if (question.evaluationStrategy === 'fraction_exact') {
      // Fraction comparison: exact rational reduction
      finalAnswerCorrect = this.compareFractions(rawSubmitted, String(question.expectedAnswer));
    } else if (question.evaluationStrategy === 'symbolic_equivalence' || question.questionType === 'symbolic') {
      // Symbolic equivalence: e.g. "V = 2t + 3", "2(x+1)" vs "2x + 2"
      finalAnswerCorrect = this.compareSymbolic(rawSubmitted, String(question.expectedAnswer));
    } else if (question.evaluationStrategy === 'linear_derivation_audit' || question.questionType === 'step_by_step') {
      const subNum = parseFloat(rawSubmitted);
      const expNum = parseFloat(String(question.expectedAnswer));
      finalAnswerCorrect = !isNaN(subNum) && !isNaN(expNum) && subNum === expNum;
    }

    // 3. Diagnose potential misconceptions if the answer is incorrect
    let detectedMisconceptionId: string | undefined;
    let misconceptionAlert: string | undefined;

    if (!finalAnswerCorrect) {
      const diagnosis = MisconceptionDiagnoser.diagnose(question.conceptId, submittedAnswer);
      if (diagnosis) {
        detectedMisconceptionId = diagnosis.misconceptionId;
        misconceptionAlert = `${diagnosis.name}: ${diagnosis.remedialExplanation}`;
      }
    }

    // 4. Synthesize Status and Score
    if (reasoningCorrect !== null) {
      // Both reasoning and final answer were evaluated
      if (finalAnswerCorrect && reasoningCorrect) {
        return {
          status: 'correct',
          finalAnswerCorrect: true,
          reasoningCorrect: true,
          stepEvaluations: stepEvals,
          score: 100,
          feedback: `Excellent! Both your reasoning and final answer are completely correct. ${question.explanation}`,
        };
      }

      if (!finalAnswerCorrect && reasoningCorrect) {
        return {
          status: 'partially_correct',
          finalAnswerCorrect: false,
          reasoningCorrect: true,
          stepEvaluations: stepEvals,
          score: 60,
          feedback: 'Your derivation method is correct, but there is an arithmetic error in your final answer.',
          detectedMisconceptionId,
          misconceptionAlert,
        };
      }

      if (finalAnswerCorrect && !reasoningCorrect) {
        return {
          status: 'partially_correct',
          finalAnswerCorrect: true,
          reasoningCorrect: false,
          stepEvaluations: stepEvals,
          score: 50,
          feedback: 'Your final answer is correct, but one or more of your intermediate derivation steps contains an invalid transformation.',
          detectedMisconceptionId,
          misconceptionAlert,
        };
      }

      return {
        status: 'incorrect',
        finalAnswerCorrect: false,
        reasoningCorrect: false,
        stepEvaluations: stepEvals,
        score: 0,
        feedback: `Incorrect. Both intermediate steps and final answer require review. ${question.explanation}`,
        detectedMisconceptionId,
        misconceptionAlert,
      };
    }

    // Standard answer-only evaluation
    if (finalAnswerCorrect) {
      return {
        status: 'correct',
        finalAnswerCorrect: true,
        reasoningCorrect: null,
        stepEvaluations: [],
        score: 100,
        feedback: `Correct! ${question.explanation}`,
      };
    }

    return {
      status: 'incorrect',
      finalAnswerCorrect: false,
      reasoningCorrect: null,
      stepEvaluations: [],
      score: 0,
      feedback: `Incorrect. Expected ${question.expectedAnswer}. ${question.explanation}`,
      detectedMisconceptionId,
      misconceptionAlert,
    };
  }

  /**
   * Compares two fraction strings for exact rational equivalence (e.g. 5/6 vs 10/12).
   */
  private static compareFractions(sub: string, exp: string): boolean {
    const parse = (str: string) => {
      const match = str.replace(/\s/g, '').match(/^([-+]?\d+)\/(\d+)$/);
      if (!match) return null;
      return { n: parseInt(match[1], 10), d: parseInt(match[2], 10) };
    };

    const s = parse(sub);
    const e = parse(exp);

    if (!s || !e || s.d === 0 || e.d === 0) return false;

    try {
      const sSimp = MathematicalCorrectnessEngine.simplifyFraction(s.n, s.d);
      const eSimp = MathematicalCorrectnessEngine.simplifyFraction(e.n, e.d);
      return sSimp.numerator === eSimp.numerator && sSimp.denominator === eSimp.denominator;
    } catch {
      return false;
    }
  }

  /**
   * Compares symbolic expressions for algebraic equivalence.
   */
  private static compareSymbolic(sub: string, exp: string): boolean {
    const sNorm = sub.replace(/\s/g, '').toLowerCase();
    const eNorm = exp.replace(/\s/g, '').toLowerCase();

    if (sNorm === eNorm) return true;

    // Check simple distributive expansions: 2(x+1) <-> 2x+2, 2(t+1.5) <-> 2t+3
    const factorMatch = sNorm.match(/^(\d+)\(([a-z])\+(\d+)\)$/);
    if (factorMatch) {
      const coeff = parseInt(factorMatch[1], 10);
      const variable = factorMatch[2];
      const constant = parseInt(factorMatch[3], 10);
      const expanded = `${coeff}${variable}+${coeff * constant}`;
      if (expanded === eNorm) return true;
    }

    const expFactorMatch = eNorm.match(/^(\d+)\(([a-z])\+(\d+)\)$/);
    if (expFactorMatch) {
      const coeff = parseInt(expFactorMatch[1], 10);
      const variable = expFactorMatch[2];
      const constant = parseInt(expFactorMatch[3], 10);
      const expanded = `${coeff}${variable}+${coeff * constant}`;
      if (expanded === sNorm) return true;
    }

    return false;
  }
}
