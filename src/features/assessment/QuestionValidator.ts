/**
 * VisiOS — Phase 5: Question Validator
 * Validates generated questions for structural completeness, logical consistency,
 * and independent mathematical truth before presenting them to the student.
 */

import { AssessmentQuestion } from './AssessmentContracts';
import { MathematicalCorrectnessEngine } from '../learning/MathematicalCorrectnessEngine';

export interface QuestionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class QuestionValidator {
  /**
   * Strictly validates an AssessmentQuestion against domain invariants.
   */
  public static validate(question: AssessmentQuestion): QuestionValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Structural checks
    if (!question.id || !question.id.trim()) {
      errors.push('Question ID cannot be empty.');
    }
    if (!question.conceptId || !question.conceptId.trim()) {
      errors.push('Concept ID must be specified.');
    }
    if (!question.question || question.question.trim().length < 5) {
      errors.push('Question prompt is too short or missing.');
    }
    if (question.difficulty < 1 || question.difficulty > 5) {
      errors.push(`Difficulty must be an integer between 1 and 5 (got ${question.difficulty}).`);
    }
    if (!Array.isArray(question.hints) || question.hints.length === 0) {
      errors.push('Question must provide at least one progressive hint.');
    }
    if (!question.explanation || question.explanation.trim().length < 5) {
      errors.push('Question must have an explanatory solution.');
    }

    // 2. Type-specific checks
    if (question.questionType === 'multiple_choice') {
      if (!Array.isArray(question.options) || question.options.length < 2) {
        errors.push('Multiple-choice questions must offer at least two options.');
      } else {
        if (
          question.correctOptionIndex === undefined ||
          question.correctOptionIndex < 0 ||
          question.correctOptionIndex >= question.options.length
        ) {
          errors.push(
            `Correct option index ${question.correctOptionIndex} is out of bounds for ${question.options.length} options.`
          );
        }
      }
    } else if (question.questionType === 'numeric') {
      if (question.expectedAnswer === undefined || question.expectedAnswer === null) {
        errors.push('Numeric questions must specify an expectedAnswer.');
      } else {
        const num = typeof question.expectedAnswer === 'number'
          ? question.expectedAnswer
          : parseFloat(String(question.expectedAnswer));
        if (isNaN(num)) {
          errors.push(`Expected numeric answer "${question.expectedAnswer}" is not a valid number.`);
        }
      }
    }

    // 3. Independent mathematical truth validation (Linear Function Evaluation)
    // If the question evaluates y = mx + c at a specific x, verify independent calculation
    const linearEvalMatch = question.question.match(/y\s*=\s*([-+]?\d+)\s*\*?\s*x\s*([+-]\s*\d+).*?x\s*=\s*([-+]?\d+)/i);
    if (linearEvalMatch) {
      const m = parseInt(linearEvalMatch[1], 10);
      const c = parseInt(linearEvalMatch[2].replace(/\s/g, ''), 10);
      const x = parseInt(linearEvalMatch[3], 10);

      const computed = MathematicalCorrectnessEngine.analyzeLinearFunction(m, c).evaluateAt(x);
      const expected = typeof question.expectedAnswer === 'number'
        ? question.expectedAnswer
        : parseFloat(String(question.expectedAnswer));

      if (expected !== computed) {
        errors.push(
          `Mathematical contradiction in question key: y = ${m}x + ${c} at x = ${x} evaluates to ${computed}, but question specifies expectedAnswer = ${expected}.`
        );
      }
    }

    // 4. Independent Fraction validation
    const fracAddMatch = question.question.match(/(\d+)\/(\d+)\s*\+\s*(\d+)\/(\d+)/);
    if (fracAddMatch) {
      const n1 = parseInt(fracAddMatch[1], 10);
      const d1 = parseInt(fracAddMatch[2], 10);
      const n2 = parseInt(fracAddMatch[3], 10);
      const d2 = parseInt(fracAddMatch[4], 10);

      try {
        const rationalRes = MathematicalCorrectnessEngine.addFractions(n1, d1, n2, d2);
        const expectedStr = String(question.expectedAnswer || '').trim();
        const expectedRational = `${rationalRes.simplified.numerator}/${rationalRes.simplified.denominator}`;
        if (expectedStr && expectedStr !== expectedRational) {
          errors.push(
            `Fraction arithmetic contradiction in question key: ${n1}/${d1} + ${n2}/${d2} = ${expectedRational}, but question key has "${expectedStr}".`
          );
        }
      } catch (err: any) {
        errors.push(`Fraction arithmetic validation error: ${err.message}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

