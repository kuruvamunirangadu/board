/**
 * VisiOS — Phase 5: Question Generator
 * Generates verified assessment questions across registered STEM engine capabilities.
 * Enforces difficulty grading (1-5), progressive hints, and self-validation.
 */

import {
  AssessmentQuestion,
  AssessmentDifficultyLevel,
} from './AssessmentContracts';
import { QuestionValidator } from './QuestionValidator';
import { MathematicalCorrectnessEngine } from '../learning/MathematicalCorrectnessEngine';

export class QuestionGenerator {
  /**
   * Generates a validated question for a given concept and difficulty level.
   */
  public static generate(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel = 2
  ): AssessmentQuestion {
    let question: AssessmentQuestion;

    if (conceptId.includes('linear')) {
      question = this.generateLinearQuestion(difficulty);
    } else if (conceptId.includes('fraction')) {
      question = this.generateFractionQuestion(difficulty);
    } else if (conceptId.includes('pythagor') || conceptId.includes('triangle')) {
      question = this.generatePythagoreanQuestion(difficulty);
    } else if (conceptId.includes('binary_search') || conceptId.includes('cs_')) {
      question = this.generateBinarySearchQuestion(difficulty);
    } else if (conceptId.includes('f_ma') || conceptId.includes('physics')) {
      question = this.generatePhysicsQuestion(difficulty);
    } else {
      question = this.generateGenericQuestion(conceptId, difficulty);
    }

    // Always validate generated questions before returning
    const validation = QuestionValidator.validate(question);
    if (!validation.isValid) {
      throw new Error(
        `Generated question failed validation: ${validation.errors.join('; ')}`
      );
    }

    return question;
  }

  // --- Linear Functions Generator (Levels 1-5) ---
  private static generateLinearQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_linear_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_linear_functions';
    const capabilityId = 'cap_linear_functions';

    if (difficulty === 1) {
      // Level 1 (Beginner): Identify y-intercept
      return {
        id,
        conceptId,
        capabilityId,
        question: 'What is the y-intercept of the linear equation y = 2x + 3?',
        questionType: 'numeric',
        difficulty: 1,
        prerequisites: ['math_cartesian_plane'],
        expectedAnswer: 3,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'In slope-intercept form y = mx + b, which term represents the y-intercept?',
          'The y-intercept occurs where the line crosses the y-axis (at x = 0).',
          'Evaluate y = 2(0) + 3 to find the constant term: 3.',
        ],
        explanation: 'In the equation y = mx + b, b is the y-intercept. For y = 2x + 3, b = 3.',
      };
    }

    if (difficulty === 2) {
      // Level 2 (Intermediate): Value substitution y = 2x + 3 at x = 4 -> 11
      const computed = MathematicalCorrectnessEngine.analyzeLinearFunction(2, 3).evaluateAt(4);
      return {
        id,
        conceptId,
        capabilityId,
        question: 'Given the linear function y = 2x + 3, calculate the value of y when x = 4.',
        questionType: 'numeric',
        difficulty: 2,
        prerequisites: ['math_linear_equations'],
        expectedAnswer: computed,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'Substitute x = 4 directly into the equation: y = 2(4) + 3.',
          'Multiply the slope by the input value first: 2 * 4 = 8.',
          'Add the y-intercept to complete the calculation: 8 + 3 = 11.',
        ],
        explanation: `Substitute x = 4 into y = 2x + 3: y = 2(4) + 3 = 8 + 3 = ${computed}.`,
        expectedSteps: ['y = 2(4) + 3', 'y = 8 + 3', 'y = 11'],
      };
    }

    if (difficulty === 3) {
      // Level 3 (Step-by-Step): Solve 2x + 3 = 11
      return {
        id,
        conceptId,
        capabilityId,
        question: 'Solve for x: 2x + 3 = 11',
        questionType: 'step_by_step',
        difficulty: 3,
        prerequisites: ['math_linear_equations'],
        expectedAnswer: 4,
        evaluationStrategy: 'linear_derivation_audit',
        hints: [
          'Isolate the variable term by subtracting the constant 3 from both sides.',
          'After subtracting 3, you get 2x = 8. What operation will isolate x?',
          'Divide both sides by the coefficient 2 to find x.',
        ],
        explanation: 'Subtract 3 from both sides: 2x = 8. Divide by 2: x = 4.',
        expectedSteps: ['2x = 11 - 3', '2x = 8', 'x = 4'],
      };
    }

    if (difficulty === 4) {
      // Level 4 (Advanced Symbolic): Slope through points (2, 7) and (4, 11)
      return {
        id,
        conceptId,
        capabilityId,
        question: 'What is the slope of the line passing through coordinates (2, 7) and (4, 11)?',
        questionType: 'numeric',
        difficulty: 4,
        prerequisites: ['math_linear_functions'],
        expectedAnswer: 2,
        evaluationStrategy: 'deterministic_numeric',
        hints: [
          'Recall the slope formula: m = (y2 - y1) / (x2 - x1).',
          'Calculate the change in y (rise): 11 - 7 = 4.',
          'Calculate the change in x (run): 4 - 2 = 2. Then divide: 4 / 2 = 2.',
        ],
        explanation: 'Slope m = (11 - 7) / (4 - 2) = 4 / 2 = 2.',
      };
    }

    // Level 5 (Application): Real world modeling
    return {
      id,
      conceptId,
      capabilityId,
      question: 'A tank begins with 3 liters of water and fills at a rate of 2 liters per minute. Express the volume V after t minutes as a linear equation.',
      questionType: 'symbolic',
      difficulty: 5,
      prerequisites: ['math_linear_functions'],
      expectedAnswer: 'V = 2t + 3',
      evaluationStrategy: 'symbolic_equivalence',
      hints: [
        'Identify the initial starting value (intercept) and the rate of change (slope).',
        'Initial volume is 3 (intercept); filling rate is 2 (slope).',
        'Combine in slope-intercept form: V = 2t + 3.',
      ],
      explanation: 'The initial volume is 3 liters (y-intercept) and increases at 2 liters/min (slope), yielding V = 2t + 3.',
    };
  }

  // --- Fractions Generator ---
  private static generateFractionQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_frac_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_fractions_basic';
    const capabilityId = 'cap_rational_fractions';

    const rational = MathematicalCorrectnessEngine.addFractions(1, 2, 1, 3);
    const expected = `${rational.simplified.numerator}/${rational.simplified.denominator}`;

    return {
      id,
      conceptId,
      capabilityId,
      question: 'Evaluate the sum of the fractions: 1/2 + 1/3',
      questionType: 'short_answer',
      difficulty,
      prerequisites: ['math_fractions_basic'],
      expectedAnswer: expected,
      evaluationStrategy: 'fraction_exact',
      hints: [
        'Fractions must have the same denominator before you can add them.',
        'Find the Least Common Multiple (LCM) of 2 and 3, which is 6.',
        'Convert both fractions: 1/2 = 3/6 and 1/3 = 2/6. Then add: 3/6 + 2/6 = 5/6.',
      ],
      explanation: '1/2 + 1/3 = 3/6 + 2/6 = 5/6.',
    };
  }

  // --- Pythagorean Question ---
  private static generatePythagoreanQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_pyth_diff${difficulty}_${Date.now()}`;
    const conceptId = 'math_pythagorean_theorem';
    const capabilityId = 'cap_euclidean_geometry';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'In a right-angled triangle with leg lengths a = 3 and b = 4, calculate the length of the hypotenuse c.',
      questionType: 'numeric',
      difficulty,
      prerequisites: ['math_right_triangles'],
      expectedAnswer: 5,
      evaluationStrategy: 'deterministic_numeric',
      hints: [
        'Apply the Pythagorean theorem: a^2 + b^2 = c^2.',
        'Calculate squares of legs: 3^2 + 4^2 = 9 + 16 = 25.',
        'Take the square root of 25: c = 5.',
      ],
      explanation: 'c = √(3² + 4²) = √(9 + 16) = √25 = 5.',
    };
  }

  // --- Binary Search Question ---
  private static generateBinarySearchQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_bs_diff${difficulty}_${Date.now()}`;
    const conceptId = 'cs_binary_search';
    const capabilityId = 'cap_cs_binary_search';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'Given the sorted array [2, 4, 7, 9, 12, 15, 20], what is the first element compared against target 15?',
      questionType: 'multiple_choice',
      difficulty,
      prerequisites: ['cs_sorted_arrays'],
      options: ['7', '9', '12', '15'],
      correctOptionIndex: 1, // mid = (0 + 6) / 2 = 3 -> array[3] = 9
      expectedAnswer: '9',
      evaluationStrategy: 'exact_option',
      hints: [
        'Binary search begins by calculating the midpoint index: mid = Math.floor((low + high) / 2).',
        'With low = 0 and high = 6: mid = Math.floor((0 + 6) / 2) = 3.',
        'Element at index 3 is 9.',
      ],
      explanation: 'With low = 0 and high = 6, midpoint index is 3. Array[3] is 9.',
    };
  }

  // --- Physics Question ---
  private static generatePhysicsQuestion(difficulty: AssessmentDifficultyLevel): AssessmentQuestion {
    const id = `q_fma_diff${difficulty}_${Date.now()}`;
    const conceptId = 'physics_f_ma';
    const capabilityId = 'cap_physics_f_ma';

    return {
      id,
      conceptId,
      capabilityId,
      question: 'A mass of 5 kg experiences an acceleration of 4 m/s². What is the net force acting on the mass?',
      questionType: 'numeric',
      difficulty,
      prerequisites: ['physics_force_dynamics'],
      expectedAnswer: 20,
      unit: 'N',
      evaluationStrategy: 'deterministic_numeric',
      hints: [
        'Apply Newton second law: F = m * a.',
        'Multiply mass (5 kg) by acceleration (4 m/s²).',
        '5 * 4 = 20 Newtons.',
      ],
      explanation: 'F = m * a = 5 kg * 4 m/s² = 20 N.',
    };
  }

  // --- Generic Fallback Question ---
  private static generateGenericQuestion(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel
  ): AssessmentQuestion {
    return {
      id: `q_generic_${conceptId}_${Date.now()}`,
      conceptId,
      capabilityId: 'cap_general_explanation',
      question: `Which fundamental principle must be preserved when evaluating ${conceptId.replace(/_/g, ' ')}?`,
      questionType: 'multiple_choice',
      difficulty,
      prerequisites: [],
      options: [
        'Axiomatic validity and verifiable step transitions',
        'Guessing without checking units',
        'Arbitrary parameter invention',
        'Ignoring boundary constraints',
      ],
      correctOptionIndex: 0,
      expectedAnswer: 'Axiomatic validity and verifiable step transitions',
      evaluationStrategy: 'exact_option',
      hints: [
        'Think about the core requirement for scientific and mathematical truth.',
        'Every step must follow logically from governing laws.',
      ],
      explanation: 'All scientific and mathematical learning requires verifiable consistency and rigorous step transitions.',
    };
  }
}
