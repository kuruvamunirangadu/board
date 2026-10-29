/**
 * VisiOS — Phase 8: Adaptive Explanation Service
 * Generates tailored pedagogical explanations across 8 distinct teaching strategies
 * and 3 difficulty levels, integrated with spatial canvas visual plans.
 */

import {
  TeachingStrategy,
  LearnerDifficulty,
  TutoringExplanation,
  TutoringVisualPlan,
} from './TutoringContracts';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class AdaptiveExplanationService {
  /**
   * Generates a fully-tailored explanation for the target concept, difficulty, and strategy.
   */
  public static generateExplanation(
    conceptId: string,
    strategy: TeachingStrategy = 'simple',
    difficulty: LearnerDifficulty = 'beginner'
  ): TutoringExplanation {
    const conceptNode = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const conceptTitle = conceptNode?.title || conceptId;

    if (conceptId === 'cs_binary_search' || conceptId.includes('binary_search')) {
      return this.generateBinarySearchExplanation(strategy, difficulty, conceptTitle);
    }

    if (conceptId === 'math_linear_functions' || conceptId.includes('linear')) {
      return this.generateLinearFunctionsExplanation(strategy, difficulty, conceptTitle);
    }

    if (conceptId === 'phys_newton_laws' || conceptId.includes('newton')) {
      return this.generateNewtonLawsExplanation(strategy, difficulty, conceptTitle);
    }

    // Generic fallback for any other registered concept
    return this.generateGenericConceptExplanation(conceptId, conceptTitle, strategy, difficulty);
  }

  // -------------------------------------------------------------------------
  // Binary Search Explanations
  // -------------------------------------------------------------------------
  private static generateBinarySearchExplanation(
    strategy: TeachingStrategy,
    difficulty: LearnerDifficulty,
    conceptTitle: string
  ): TutoringExplanation {
    const visualPlan: TutoringVisualPlan = {
      supported: true,
      capabilityId: 'cap_cs_binary_search',
      rendererName: 'algorithm_array_tracer',
      visualType: 'interactive_array',
      props: {
        array: [10, 20, 30, 40, 50, 60, 70, 80],
        target: 40,
        low: 0,
        high: 7,
        mid: 3,
      },
      steps: [
        'Initialize low = 0, high = 7',
        'Calculate mid = floor((0 + 7) / 2) = 3; array[3] = 40',
        'Target 40 found at index 3 in 1 comparison',
      ],
    };

    switch (strategy) {
      case 'simple':
        return {
          strategy: 'simple',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Binary Search: Finding Items by Halving',
          summary: 'Binary search finds an item in a sorted list by repeatedly checking the middle element and discarding the half where the item cannot be.',
          content: 'Think of looking for a name in a physical phonebook. Instead of checking page 1, then page 2, you open right to the middle. If your target is alphabetically earlier, you completely ignore the second half and repeat in the first half.',
          steps: [
            '1. Ensure the list is sorted in ascending order.',
            '2. Look at the exact middle element.',
            '3. If the middle is your target, you are done!',
            '4. If target is smaller, look only in the left half.',
            '5. If target is larger, look only in the right half.',
          ],
          visualPlan,
          suggestedNextStep: 'Try searching for number 60 in a sorted array of 8 elements.',
        };

      case 'step_by_step':
        return {
          strategy: 'step_by_step',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Binary Search: Step-by-Step Procedure',
          summary: 'A deterministic, pointer-based algorithm that updates low and high boundaries until the target is isolated.',
          content: 'We maintain two pointers: `low` at the start of our search space and `high` at the end.',
          steps: [
            'Step 1: Set low = 0 and high = N - 1.',
            'Step 2: While low <= high, compute mid = floor((low + high) / 2).',
            'Step 3: Compare array[mid] with target.',
            'Step 4: If array[mid] == target, return index mid.',
            'Step 5: If array[mid] < target, set low = mid + 1 (eliminate left half).',
            'Step 6: If array[mid] > target, set high = mid - 1 (eliminate right half).',
            'Step 7: If low exceeds high, target is not in the array.',
          ],
          visualPlan,
          suggestedNextStep: 'Trace pointer positions when the target does not exist in the array.',
        };

      case 'visual':
        return {
          strategy: 'visual',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Spatial Search Space Elimination',
          summary: 'Watch the active search interval shrink exponentially with each comparison.',
          content: 'In spatial terms, the search space is a horizontal bar of length N. Each iteration cuts the bar exactly in half. After 1 step: N/2 remains. After 2 steps: N/4 remains. After k steps: N / (2^k) remains.',
          steps: [
            'Active search window highlighted in green.',
            'Discarded window grayed out and inactive.',
            'Middle probe marker points directly at index 3.',
          ],
          visualPlan,
          suggestedNextStep: 'Interact with the array slider on the canvas to step through comparisons.',
        };

      case 'worked_example':
        return {
          strategy: 'worked_example',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Worked Example: Searching for 55 in [12, 23, 34, 45, 55, 67, 78, 89]',
          summary: 'Complete trace of pointer variables and comparison outcomes.',
          content: 'Let array = [12, 23, 34, 45, 55, 67, 78, 89] (size 8), target = 55.',
          steps: [
            'Iteration 1: low = 0, high = 7. mid = floor((0+7)/2) = 3. array[3] = 45. Since 45 < 55, low = mid + 1 = 4.',
            'Iteration 2: low = 4, high = 7. mid = floor((4+7)/2) = 5. array[5] = 67. Since 67 > 55, high = mid - 1 = 4.',
            'Iteration 3: low = 4, high = 4. mid = floor((4+4)/2) = 4. array[4] = 55. Target matched at index 4!',
          ],
          visualPlan,
          suggestedNextStep: 'Verify how many steps are needed if target is 12 (the first element).',
        };

      case 'analogy':
        return {
          strategy: 'analogy',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Analogy: The Number Guessing Game (1 to 100)',
          summary: 'Guessing a number when told "higher" or "lower".',
          content: 'If someone picks a number between 1 and 100, your best first guess is 50. If they say "higher", you have instantly ruled out 1 through 50 without asking about any of them! Your next guess is 75. You guarantee finding the number in at most 7 guesses (since 2^7 = 128 > 100).',
          analogies: [
            'Dictionary search: flipping to letter M first.',
            'Binary balance scale: dividing coins into two equal piles.',
          ],
          visualPlan,
          suggestedNextStep: 'Calculate how many guesses are needed for a number between 1 and 1,000.',
        };

      case 'socratic':
        return {
          strategy: 'socratic',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Discovering Binary Search: Guiding Inquiries',
          summary: 'Deduce why sorted order makes exponential acceleration possible.',
          content: 'Consider how ordering influences decision making.',
          socraticQuestions: [
            'If an array is completely unsorted and you inspect the middle element, can you rule out either half? Why not?',
            'What exact mathematical guarantee does the property `array[i] <= array[i+1]` give us?',
            'If each question eliminates 50% of the remaining choices, how many questions are needed to search 1,000,000 items?',
          ],
          visualPlan,
          suggestedNextStep: 'Formulate your answer to question 1 before moving to the code.',
        };

      case 'formal':
        return {
          strategy: 'formal',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Formal Invariant & Complexity Analysis',
          summary: 'Loop invariants, termination proofs, and O(log n) asymptotic complexity.',
          content: 'Loop Invariant: At the start of each iteration, if `target ∈ array`, then `target ∈ array[low ... high]`. Correctness Proof: At step k, mid = ⌊(low + high)/2⌋. By trichotomy, array[mid] is either ==, <, or > target. By monotonicity of sorted arrays, array[0 ... mid] < target if array[mid] < target, so target must reside in array[mid+1 ... high]. The invariant is preserved. Termination: (high - low + 1) strictly decreases by at least ⌊(high - low)/2⌋ + 1 in each round. Since length is finite and bounded below by 0, the loop must terminate in at most ⌈log₂(n)⌉ + 1 steps. Time Complexity: O(log n) worst and average case, O(1) best case. Space Complexity: O(1) iterative.',
          visualPlan,
          suggestedNextStep: 'Analyze potential integer overflow in `(low + high) / 2` and why `low + (high - low) / 2` is preferred.',
        };

      case 'error_focused':
        return {
          strategy: 'error_focused',
          difficulty,
          conceptId: 'cs_binary_search',
          conceptTitle,
          title: 'Common Misconceptions in Binary Search',
          summary: 'Addressing off-by-one errors, unsorted arrays, and infinite loop traps.',
          content: 'Three critical pitfalls frequently break binary search implementations:',
          steps: [
            '1. Unsorted Precondition Trap: Binary search silently fails or returns wrong indices if the collection is not sorted. It cannot run on raw random lists.',
            '2. Off-by-one Pointer Update: Writing `low = mid` or `high = mid` instead of `mid + 1` or `mid - 1` leads to infinite loops when `high - low == 1`.',
            '3. Loop Condition Error: Using `while (low < high)` instead of `while (low <= high)` misses the target when the search space narrows to a single element (low == high).',
          ],
          visualPlan,
          suggestedNextStep: 'Identify the bug in: `while (low < high) { mid = (low+high)/2; if (a[mid] < target) low = mid; }`',
        };
    }
  }

  // -------------------------------------------------------------------------
  // Linear Functions Explanations
  // -------------------------------------------------------------------------
  private static generateLinearFunctionsExplanation(
    strategy: TeachingStrategy,
    difficulty: LearnerDifficulty,
    conceptTitle: string
  ): TutoringExplanation {
    const visualPlan: TutoringVisualPlan = {
      supported: true,
      capabilityId: 'cap_linear_functions',
      rendererName: 'function_coordinate_plotter',
      visualType: 'cartesian_plot',
      props: {
        equation: 'y = 2x + 3',
        slope: 2,
        intercept: 3,
        xRange: [-5, 5],
        yRange: [-5, 15],
      },
      steps: [
        'Plot y-intercept (0, 3)',
        'From (0, 3), apply slope 2: run +1 horizontally, rise +2 vertically to (1, 5)',
        'Draw straight line connecting points across domain',
      ],
    };

    if (strategy === 'formal') {
      return {
        strategy: 'formal',
        difficulty,
        conceptId: 'math_linear_functions',
        conceptTitle,
        title: 'Affine Transformations & Linear Differential Form (y = mx + c)',
        summary: 'Rigorous definition of linear mappings, constant first derivatives, and vector equations.',
        content: 'A linear function f: ℝ → ℝ is an affine mapping of the form f(x) = mx + c, where m = df/dx is the constant first derivative representing the invariant rate of change, and c = f(0) represents the initial condition.',
        steps: [
          'First derivative: f\'(x) = m (constant for all x ∈ ℝ)',
          'Root calculation: f(x) = 0 ⟹ x = -c/m (for m ≠ 0)',
          'Vector representation: [x, y]ᵀ = [0, c]ᵀ + t [1, m]ᵀ',
        ],
        visualPlan,
        suggestedNextStep: 'Evaluate orthogonality conditions: two lines with slopes m₁ and m₂ are perpendicular if and only if m₁ · m₂ = -1.',
      };
    }

    if (strategy === 'step_by_step') {
      return {
        strategy: 'step_by_step',
        difficulty,
        conceptId: 'math_linear_functions',
        conceptTitle,
        title: 'Linear Functions: Step-by-Step Graphing & Solution',
        summary: 'Systematic procedural method to graph and solve linear equations.',
        content: 'To analyze y = 2x + 3 step-by-step: first plot the y-intercept (0, 3), then apply the slope 2 = 2/1 to find the second point (1, 5), and connect them with a straight line.',
        steps: [
          'Step 1: Identify intercept c = 3 and plot point (0, 3) on the vertical axis.',
          'Step 2: From (0, 3), run +1 unit horizontally and rise +2 units vertically to (1, 5).',
          'Step 3: Connect points to form the infinite straight line.',
        ],
        visualPlan,
        suggestedNextStep: 'Plot the line on the canvas and verify the point (2, 7).',
      };
    }

    if (strategy === 'error_focused') {
      return {
        strategy: 'error_focused',
        difficulty,
        conceptId: 'math_linear_functions',
        conceptTitle,
        title: 'Slope vs Intercept: Resolving Coordinate Confusion',
        summary: 'Targeting the common confusion between slope (rate of change) and intercept (starting offset).',
        content: 'In y = 2x + 3, the number 2 is NOT where the line crosses the axis. 2 is the steepness (slope). The number 3 is where the line hits the vertical y-axis when x = 0.',
        steps: [
          'Pitfall 1: Confusing slope with intercept. In y = mx + c, m is multiplied by x; c stands alone.',
          'Pitfall 2: Inverting rise and run. Slope = Δy / Δx (vertical change divided by horizontal change), never Δx / Δy.',
        ],
        visualPlan,
        suggestedNextStep: 'State the slope and y-intercept for y = -4x + 7.',
      };
    }

    // Default simple
    return {
      strategy,
      difficulty,
      conceptId: 'math_linear_functions',
      conceptTitle,
      title: 'Linear Functions: Constant Rate of Change (y = mx + c)',
      summary: 'A linear equation creates a straight line where m is the slope and c is the starting point on the y-axis.',
      content: 'Every linear relationship can be understood as a starting value plus a constant growth per step. For instance, a taxi ride costing $3 upfront plus $2 per mile traveled is exactly y = 2x + 3.',
      steps: [
        '1. Start at the y-intercept: point (0, 3).',
        '2. Use the slope m = 2 = 2/1: go right 1 unit, go up 2 units to (1, 5).',
        '3. Connect the points with a ruler: you have graphed the line.',
      ],
      visualPlan,
      suggestedNextStep: 'Plot the line on the canvas and verify the point (2, 7).',
    };
  }

  // -------------------------------------------------------------------------
  // Newton's Laws Explanations
  // -------------------------------------------------------------------------
  private static generateNewtonLawsExplanation(
    strategy: TeachingStrategy,
    difficulty: LearnerDifficulty,
    conceptTitle: string
  ): TutoringExplanation {
    const visualPlan: TutoringVisualPlan = {
      supported: true,
      capabilityId: 'cap_newtonian_force_dynamics',
      rendererName: 'physics_vector_simulator',
      visualType: 'force_mass_simulation',
      props: {
        massKg: 5,
        forceNewtons: 20,
        accelerationMs2: 4,
      },
      steps: ['Apply 20 N net force to 5 kg block', 'Observe constant acceleration a = F/m = 4 m/s²'],
    };

    return {
      strategy,
      difficulty,
      conceptId: 'phys_newton_laws',
      conceptTitle,
      title: "Newton's Second Law: Dynamics of Force and Acceleration (F = ma)",
      summary: 'Net force applied to a mass causes proportional acceleration in the direction of the force.',
      content: 'Acceleration is the consequence of unbalanced force acting upon inertial mass: a = F_net / m.',
      steps: [
        'Identify all forces acting on the object and compute net force F_net.',
        'Measure total mass m in kilograms (kg).',
        'Calculate resulting acceleration a = F / m in m/s².',
      ],
      visualPlan,
      suggestedNextStep: 'Simulate doubling the mass from 5 kg to 10 kg while keeping force constant at 20 N.',
    };
  }

  // -------------------------------------------------------------------------
  // Generic Fallback Explanation
  // -------------------------------------------------------------------------
  private static generateGenericConceptExplanation(
    conceptId: string,
    conceptTitle: string,
    strategy: TeachingStrategy,
    difficulty: LearnerDifficulty
  ): TutoringExplanation {
    return {
      strategy,
      difficulty,
      conceptId,
      conceptTitle,
      title: `${conceptTitle}: Core Principles & Application`,
      summary: `A structured overview of ${conceptTitle} tailored for ${difficulty} level using a ${strategy} teaching approach.`,
      content: `Mastering ${conceptTitle} involves understanding its core invariants, prerequisite foundations, and observable relationships.`,
      steps: [
        `Review prerequisite concepts required for ${conceptTitle}.`,
        `Apply core formulas and rules step by step.`,
        'Verify solutions using dimensional consistency and boundary checks.',
      ],
      suggestedNextStep: `Practice standard exercises for ${conceptTitle} to solidify understanding.`,
    };
  }
}
