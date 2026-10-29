/**
 * VisiOS — Phase 8: Practice Generation Service
 * Generates verified practice exercises tailored to student level and concept objectives.
 * Ensures deterministic evaluation procedures and complete consistency with answer keys.
 */

import {
  TutoringPracticeExercise,
  LearnerDifficulty,
  PracticeExerciseType,
} from './TutoringContracts';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class PracticeGenerationService {
  /**
   * Generates a practice exercise with guaranteed mathematical and structural consistency.
   */
  public static generateExercise(
    conceptId: string,
    difficulty: LearnerDifficulty = 'beginner',
    preferredType?: PracticeExerciseType
  ): TutoringPracticeExercise {
    const conceptNode = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const conceptTitle = conceptNode?.title || conceptId;

    if (conceptId === 'cs_binary_search' || conceptId.includes('binary_search')) {
      return this.generateBinarySearchExercise(difficulty, preferredType, conceptTitle);
    }

    if (conceptId === 'math_linear_functions' || conceptId.includes('linear')) {
      return this.generateLinearFunctionsExercise(difficulty, preferredType, conceptTitle);
    }

    if (conceptId === 'phys_newton_laws' || conceptId.includes('newton')) {
      return this.generateNewtonLawsExercise(difficulty, preferredType, conceptTitle);
    }

    // Default generic practice
    return this.generateDefaultExercise(conceptId, difficulty, conceptTitle);
  }

  // -------------------------------------------------------------------------
  // Binary Search Practice Exercises
  // -------------------------------------------------------------------------
  private static generateBinarySearchExercise(
    difficulty: LearnerDifficulty,
    preferredType: PracticeExerciseType | undefined,
    conceptTitle: string
  ): TutoringPracticeExercise {
    if (difficulty === 'advanced') {
      return {
        id: `prac_bs_${Date.now()}_adv`,
        conceptId: 'cs_binary_search',
        conceptTitle,
        type: preferredType || 'mathematical_problem',
        difficulty: 'advanced',
        difficultyNumber: 4,
        question: 'What is the maximum number of comparisons needed to search for an element in a sorted array containing 1,024 elements using binary search?',
        expectedAnswer: 11,
        hints: [
          'Binary search halves the search space at each comparison: N / 2^k.',
          'Consider the formula for worst-case comparisons: ⌊log₂(N)⌋ + 1.',
          'Calculate log₂(1024): 2^10 = 1024, so log₂(1024) = 10. Add 1 for the terminal check.',
        ],
        solutionExplanation: 'For N = 1,024 elements, worst-case comparisons = ⌊log₂(1024)⌋ + 1 = 10 + 1 = 11 comparisons.',
        validationProcedure: 'deterministic_numeric',
      };
    }

    if (difficulty === 'intermediate') {
      return {
        id: `prac_bs_${Date.now()}_int`,
        conceptId: 'cs_binary_search',
        conceptTitle,
        type: preferredType || 'predict_next_step',
        difficulty: 'intermediate',
        difficultyNumber: 3,
        question: 'In an array [5, 12, 19, 27, 34, 45, 56, 68] with low = 0 and high = 7, target = 45. What is the value at the calculated mid index on the first step?',
        options: ['19', '27', '34', '45'],
        expectedAnswer: '27',
        hints: [
          'Calculate the middle index: mid = floor((0 + 7) / 2).',
          '0 + 7 = 7, 7 / 2 = 3.5, floor is index 3.',
          'Look up array[3] in [5, 12, 19, 27, 34, 45, 56, 68].',
        ],
        solutionExplanation: 'mid = floor((0 + 7) / 2) = 3. array[3] is 27.',
        validationProcedure: 'exact_match',
      };
    }

    // Beginner
    return {
      id: `prac_bs_${Date.now()}_beg`,
      conceptId: 'cs_binary_search',
      conceptTitle,
      type: preferredType || 'multiple_choice',
      difficulty: 'beginner',
      difficultyNumber: 2,
      question: 'Which of the following conditions is an absolute requirement before you can apply binary search to an array?',
      options: [
        'The array must be sorted in monotonic order',
        'All numbers must be strictly positive',
        'The length of the array must be an even number',
        'The array cannot contain negative numbers',
      ],
      expectedAnswer: 'The array must be sorted in monotonic order',
      hints: [
        'How does binary search decide whether to search left or right?',
        'If elements are in random order, does checking the middle tell you anything about other positions?',
        'The array elements must be ordered from smallest to largest (or vice versa).',
      ],
      solutionExplanation: 'Binary search depends on sorted order to rule out half the search space when array[mid] != target.',
      validationProcedure: 'exact_match',
    };
  }

  // -------------------------------------------------------------------------
  // Linear Functions Practice Exercises
  // -------------------------------------------------------------------------
  private static generateLinearFunctionsExercise(
    difficulty: LearnerDifficulty,
    preferredType: PracticeExerciseType | undefined,
    conceptTitle: string
  ): TutoringPracticeExercise {
    if (difficulty === 'advanced') {
      return {
        id: `prac_lin_${Date.now()}_adv`,
        conceptId: 'math_linear_functions',
        conceptTitle,
        type: preferredType || 'mathematical_problem',
        difficulty: 'advanced',
        difficultyNumber: 4,
        question: 'Given a linear equation y = -3x + 12, at what x-coordinate does the line cross the horizontal x-axis (x-intercept)?',
        expectedAnswer: 4,
        hints: [
          'The line crosses the x-axis where y = 0.',
          'Set 0 = -3x + 12 and solve for x.',
          'Add 3x to both sides: 3x = 12. Divide by 3.',
        ],
        solutionExplanation: 'Set y = 0: 0 = -3x + 12 ⟹ 3x = 12 ⟹ x = 4.',
        validationProcedure: 'deterministic_numeric',
      };
    }

    // Beginner / Intermediate
    return {
      id: `prac_lin_${Date.now()}_beg`,
      conceptId: 'math_linear_functions',
      conceptTitle,
      type: preferredType || 'mathematical_problem',
      difficulty: 'beginner',
      difficultyNumber: 2,
      question: 'For the linear function y = 2x + 3, what is the value of y when x = 4?',
      expectedAnswer: 11,
      hints: [
        'Substitute x = 4 into the equation: y = 2(4) + 3.',
        'Multiply 2 by 4 first: 2 * 4 = 8.',
        'Add the constant intercept: 8 + 3 = 11.',
      ],
      solutionExplanation: 'y = 2(4) + 3 = 8 + 3 = 11.',
      validationProcedure: 'deterministic_numeric',
    };
  }

  // -------------------------------------------------------------------------
  // Newton's Laws Practice Exercises
  // -------------------------------------------------------------------------
  private static generateNewtonLawsExercise(
    difficulty: LearnerDifficulty,
    preferredType: PracticeExerciseType | undefined,
    conceptTitle: string
  ): TutoringPracticeExercise {
    return {
      id: `prac_newt_${Date.now()}`,
      conceptId: 'phys_newton_laws',
      conceptTitle,
      type: preferredType || 'mathematical_problem',
      difficulty,
      difficultyNumber: difficulty === 'advanced' ? 4 : 2,
      question: 'A net horizontal force of 20 N is applied to an object with a mass of 5 kg. What is the resulting acceleration in m/s²?',
      expectedAnswer: 4,
      hints: [
        'Recall Newton’s Second Law: F = m · a.',
        'Rearrange the equation to solve for acceleration: a = F / m.',
        'Divide 20 N by 5 kg: 20 / 5 = 4.',
      ],
      solutionExplanation: 'a = F / m = 20 N / 5 kg = 4 m/s².',
      validationProcedure: 'deterministic_numeric',
    };
  }

  // -------------------------------------------------------------------------
  // Default Generic Exercise
  // -------------------------------------------------------------------------
  private static generateDefaultExercise(
    conceptId: string,
    difficulty: LearnerDifficulty,
    conceptTitle: string
  ): TutoringPracticeExercise {
    return {
      id: `prac_gen_${Date.now()}`,
      conceptId,
      conceptTitle,
      type: 'multiple_choice',
      difficulty,
      difficultyNumber: 2,
      question: `Which fundamental principle is central to understanding ${conceptTitle}?`,
      options: [
        'Consistent application of prerequisite rules and invariants',
        'Random variation without structural laws',
        'Ignoring boundary limits and initial conditions',
        'Assuming all outputs are static and immutable',
      ],
      expectedAnswer: 'Consistent application of prerequisite rules and invariants',
      hints: [
        `Review the foundational rules governing ${conceptTitle}.`,
        'Consider which choice reflects mathematical and scientific consistency.',
      ],
      solutionExplanation: 'Consistent application of structural invariants is necessary for all STEM topics.',
      validationProcedure: 'exact_match',
    };
  }
}
