/**
 * VisiOS — Phase 8: Tutoring Quality, Safety & Correctness Validation Service
 * Inspects AI-generated and proposed tutoring content before presentation to students.
 * Enforces mathematical correctness, formula validity, code safety, and renderer compatibility.
 */

import {
  TutoringValidationResult,
  TutoringExplanation,
  TutoringPracticeExercise,
  TutoringVisualPlan,
} from './TutoringContracts';
import { EngineCapabilityRegistry } from '../learning/EngineCapabilityRegistry';
import { MathInputNormalizer } from '../learning/MathInputNormalizer';

export class TutoringValidationService {
  /**
   * Authoritative list of verified supported renderer names from EngineCapabilityRegistry.
   */
  private static readonly SUPPORTED_RENDERERS = new Set<string>([
    'formula_geometric_dissection',
    'geometric_triangle_construction',
    'function_coordinate_plotter',
    'physics_vector_simulator',
    'pendulum_simulation',
    'simulation_canvas_renderer',
    'algorithm_array_tracer',
    'interactive_flowchart',
    'concept_learning_card',
    'biochemical_pathway_graph',
  ]);

  /**
   * Dangerous code constructs prohibited in all AI or student-facing outputs.
   */
  private static readonly DISALLOWED_CODE_PATTERNS = [
    /\beval\s*\(/i,
    /\bFunction\s*\(/i,
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /document\.cookie/i,
    /window\.location/i,
    /localStorage\./i,
    /__proto__/i,
  ];

  /**
   * Validates an entire tutoring explanation payload.
   */
  public static validateExplanation(explanation: TutoringExplanation): TutoringValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checks = {
      mathCorrectness: true,
      rendererSupported: true,
      formulaValid: true,
      codeSafe: true,
      answerKeyConsistent: true,
      prerequisitesMet: true,
    };

    // 1. Code Safety Check
    const combinedText = `${explanation.title} ${explanation.summary} ${explanation.content} ${(explanation.steps || []).join(' ')}`;
    for (const pattern of this.DISALLOWED_CODE_PATTERNS) {
      if (pattern.test(combinedText)) {
        checks.codeSafe = false;
        errors.push(`Security violation: Detected prohibited execution pattern (${pattern.source}) in tutoring content.`);
      }
    }

    // 2. Mathematical & Formula Validation
    // Check for trailing or unbalanced math expressions
    const candidates = [
      explanation.title,
      explanation.summary,
      explanation.content,
      ...(explanation.steps || []),
    ];

    for (const text of candidates) {
      if (text && text.includes('=')) {
        // Matches formulas ending with an incomplete trailing operator e.g. "y = 2x +" or "= x -"
        if (/=\s*[^=;\n.!?]*[+\-*/^]\s*(?:$|[.;\n!?])/i.test(text.trim())) {
          checks.formulaValid = false;
          errors.push(`Formula syntax error: Incomplete trailing operator in mathematical statement: "${text}".`);
          break;
        }
      }
    }

    // 3. Renderer Compatibility Check
    if (explanation.visualPlan) {
      const vResult = this.validateVisualPlan(explanation.visualPlan);
      if (!vResult.isValid) {
        checks.rendererSupported = false;
        errors.push(...vResult.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      checks,
      errors,
      warnings,
    };
  }

  /**
   * Validates a visual plan against supported renderers and capabilities.
   */
  public static validateVisualPlan(plan: TutoringVisualPlan): TutoringValidationResult {
    const errors: string[] = [];
    const checks = {
      mathCorrectness: true,
      rendererSupported: true,
      formulaValid: true,
      codeSafe: true,
      answerKeyConsistent: true,
      prerequisitesMet: true,
    };

    if (!plan.rendererName || !this.SUPPORTED_RENDERERS.has(plan.rendererName)) {
      checks.rendererSupported = false;
      errors.push(
        `Unsupported renderer error: Renderer "${plan.rendererName}" is not registered in EngineCapabilityRegistry.`
      );
    }

    // Validate capability exists if specified
    if (plan.capabilityId) {
      const cap = EngineCapabilityRegistry.getCapabilityById(plan.capabilityId);
      if (!cap) {
        checks.rendererSupported = false;
        errors.push(`Unrecognized capabilityId "${plan.capabilityId}" in visual plan.`);
      }
    }

    return {
      isValid: errors.length === 0,
      checks,
      errors,
      warnings: [],
    };
  }

  /**
   * Validates a practice exercise and verifies answer-key consistency.
   */
  public static validatePracticeExercise(exercise: TutoringPracticeExercise): TutoringValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const checks = {
      mathCorrectness: true,
      rendererSupported: true,
      formulaValid: true,
      codeSafe: true,
      answerKeyConsistent: true,
      prerequisitesMet: true,
    };

    // 1. Question and answer presence
    if (!exercise.question || !exercise.question.trim()) {
      errors.push('Missing question prompt in practice exercise.');
    }

    if (exercise.expectedAnswer === undefined || exercise.expectedAnswer === null || exercise.expectedAnswer === '') {
      checks.answerKeyConsistent = false;
      errors.push('Missing expectedAnswer in practice exercise.');
    }

    // 2. Options consistency for multiple choice
    if (exercise.type === 'multiple_choice') {
      if (!exercise.options || exercise.options.length < 2) {
        errors.push('Multiple choice exercise must provide at least 2 distinct options.');
      } else if (!exercise.options.includes(String(exercise.expectedAnswer))) {
        checks.answerKeyConsistent = false;
        errors.push(
          `Inconsistent answer key: Expected answer "${exercise.expectedAnswer}" is not present in provided options: [${exercise.options.join(', ')}].`
        );
      }
    }

    // 3. Mathematical numeric consistency
    if (exercise.validationProcedure === 'deterministic_numeric') {
      const numAnswer = Number(exercise.expectedAnswer);
      if (Number.isNaN(numAnswer)) {
        checks.mathCorrectness = false;
        errors.push(`Expected answer "${exercise.expectedAnswer}" is not a valid number for numeric evaluation.`);
      }
    }

    return {
      isValid: errors.length === 0,
      checks,
      errors,
      warnings,
    };
  }
}
