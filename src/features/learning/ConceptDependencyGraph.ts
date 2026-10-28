/**
 * VisiOS — Adaptive Learning Paths & Concept Dependencies Engine
 * Builds acyclic concept dependency graphs, evaluates mastery based on recorded practice assessment,
 * and generates evidence-grounded recommendations for what a student should learn next.
 */

import {
  ConceptNode,
  ConceptDifficulty,
  ConceptMasteryState,
  ConceptMasteryEvaluation,
  LearningPathStep,
  LearningPath,
  PersistedGoalProgress,
  SavedLearningSessionState,
  TopicKnowledgeSubGraph,
  GraphNodePosition,
  GraphEdgeConnection,
} from './types';
import { sessionPersistence, SessionPersistenceAdapter } from '@/lib/persistence/session-persistence';
import { LearningSession } from '@/types/session';

export const MASTERY_THRESHOLDS = {
  DEMONSTRATED_MIN_SCORE: 70,      // Score >= 70% demonstrates solid understanding
  COMPLETED_MIN_SCORE: 90,         // Score >= 90% plus lesson progression marks concept completed
  NEEDS_REVIEW_MAX_SCORE: 50,      // Score <= 50% or multiple incorrect answers flags needs_review
  MIN_COMPLETED_STEPS_FOR_IN_PROGRESS: 1,
  MIN_COMPLETED_STEPS_FOR_COMPLETED: 6,
  MAX_CONSECUTIVE_ERRORS_FOR_REVIEW: 2,
} as const;

/**
 * Small, explicit set of trusted curriculum concepts and verified prerequisites.
 */
export const TRUSTED_CONCEPT_REGISTRY: Record<string, ConceptNode> = {
  // --- Computer Science & Algorithms Track ---
  cs_variables_types: {
    id: 'cs_variables_types',
    title: 'Variables & Memory Fundamentals',
    domain: 'computer_science',
    topic: 'Programming Foundations',
    topicQuery: 'Variables and Memory Allocation',
    prerequisiteIds: [],
    objectives: [
      'Understand how variables represent named memory addresses',
      'Distinguish primitive numerical types from memory pointers',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
    diagnosticQuestion: {
      question: 'What does a variable primarily represent in a computer program?',
      options: [
        'A named reference to a memory address holding data',
        'An infinite execution loop',
        'A physical hard drive sector',
        'A network transmission packet',
      ],
      correctIndex: 0,
      explanation: 'Variables allocate and name specific locations in memory to store and retrieve data.',
    },
  },

  cs_arrays_indexing: {
    id: 'cs_arrays_indexing',
    title: 'Arrays & Zero-Based Indexing',
    domain: 'computer_science',
    topic: 'Data Structures',
    topicQuery: 'Arrays and Indexing',
    prerequisiteIds: ['cs_variables_types'],
    objectives: [
      'Understand contiguous sequential memory layout',
      'Perform O(1) random-access element lookups using indices',
      'Calculate element addresses: baseAddress + (index * elementSize)',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Variables and Memory Allocation',
    rationaleForPrerequisite: {
      cs_variables_types: 'Arrays require understanding how variables and data elements reside in memory addresses.',
    },
    diagnosticQuestion: {
      question: 'In a 0-indexed array containing 6 elements, what is the valid index of the last element?',
      options: ['6', '5', '0', '-1'],
      correctIndex: 1,
      explanation: 'With 0-based indexing, valid indices for an array of size N run from 0 to N-1 (index 5 for size 6).',
    },
  },

  cs_sorted_arrays: {
    id: 'cs_sorted_arrays',
    title: 'Sorted Arrays & Monotonic Order',
    domain: 'computer_science',
    topic: 'Data Structures',
    topicQuery: 'Sorted Arrays',
    prerequisiteIds: ['cs_arrays_indexing'],
    objectives: [
      'Understand monotonic ascending and descending order properties',
      'Recognize how sorted order eliminates search spaces',
      'Verify sorted array preconditions before running search algorithms',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Arrays and Indexing',
    rationaleForPrerequisite: {
      cs_arrays_indexing: 'You must understand basic array indexing and contiguous sequences before working with sorted ordering.',
    },
    diagnosticQuestion: {
      question: 'Which property guarantees that if array[mid] > target, all elements to the right of mid are also > target?',
      options: [
        'Monotonic non-decreasing sorted order',
        'LIFO stack behavior',
        'Dynamic array resizing',
        'Hash table collision chaining',
      ],
      correctIndex: 0,
      explanation: 'In a monotonically sorted array, elements to the right are always greater than or equal to array[mid].',
    },
  },

  cs_comparison_ops: {
    id: 'cs_comparison_ops',
    title: 'Comparison Operations & Branching',
    domain: 'computer_science',
    topic: 'Algorithms',
    topicQuery: 'Comparison Operations and Branching',
    prerequisiteIds: ['cs_variables_types'],
    objectives: [
      'Apply the trichotomy rule (<, ==, >) in programmatic conditionals',
      'Evaluate boundary conditions in binary decision trees',
      'Determine execution branches based on variable comparisons',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
    rationaleForPrerequisite: {
      cs_variables_types: 'Comparison operations require typed variable evaluation.',
    },
    diagnosticQuestion: {
      question: 'What are the three mutually exclusive outcomes when comparing two real numbers A and B?',
      options: [
        'A < B, A == B, or A > B (Trichotomy)',
        'True, False, or Null',
        'Positive, Negative, or Imaginary',
        'Constant, Linear, or Exponential',
      ],
      correctIndex: 0,
      explanation: 'By the law of trichotomy, exactly one of A < B, A == B, or A > B is true.',
    },
  },

  cs_binary_search: {
    id: 'cs_binary_search',
    title: 'Binary Search Algorithm',
    domain: 'computer_science',
    topic: 'Algorithms',
    topicQuery: 'Binary Search',
    prerequisiteIds: ['cs_sorted_arrays', 'cs_comparison_ops'],
    objectives: [
      'Divide active search space in half at each iteration using mid = floor((low + high) / 2)',
      'Maintain and update low, mid, and high pointers accurately',
      'Achieve O(log n) logarithmic time complexity search',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Sorted Arrays',
    rationaleForPrerequisite: {
      cs_sorted_arrays: 'Binary search fundamentally requires a sorted array so half the search range can be safely discarded each step.',
      cs_comparison_ops: 'Binary search relies on comparison branching (<, ==, >) to decide whether to search left or right.',
    },
    diagnosticQuestion: {
      question: 'In binary search, if array[mid] is strictly less than target, what is the correct pointer update?',
      options: [
        'low = mid + 1',
        'high = mid - 1',
        'mid = mid + 2',
        'low = high',
      ],
      correctIndex: 0,
      explanation: 'Because array[mid] < target and the array is sorted, the target must be in the right half, so low = mid + 1.',
    },
  },

  cs_time_complexity: {
    id: 'cs_time_complexity',
    title: 'Time Complexity & Big-O Analysis',
    domain: 'computer_science',
    topic: 'Algorithms',
    topicQuery: 'Time Complexity Big-O Analysis',
    prerequisiteIds: ['cs_binary_search'],
    objectives: [
      'Compare logarithmic O(log n) vs linear O(n) algorithmic growth',
      'Calculate worst-case step counts: log2(1000) ≈ 10 comparisons',
      'Understand asymptotic Big-O notations for memory and runtime',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Binary Search',
    rationaleForPrerequisite: {
      cs_binary_search: 'Experiencing how binary search halves its problem space creates the concrete mathematical foundation for understanding logarithmic complexity O(log n).',
    },
  },

  cs_stacks_queues: {
    id: 'cs_stacks_queues',
    title: 'Stacks & Queues (Linear Data Structures)',
    domain: 'computer_science',
    topic: 'Data Structures',
    topicQuery: 'Data Structures',
    prerequisiteIds: ['cs_arrays_indexing'],
    objectives: [
      'Understand LIFO (Last-In, First-Out) stack operations (push/pop)',
      'Understand FIFO (First-In, First-Out) queue operations (enqueue/dequeue)',
      'Manage sequential memory buffers and index pointers',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Arrays and Indexing',
    rationaleForPrerequisite: {
      cs_arrays_indexing: 'Stacks and queues use underlying contiguous arrays or buffers to manage ordered element sequences.',
    },
  },

  // --- Physics & Mechanics Track ---
  phys_units_vectors: {
    id: 'phys_units_vectors',
    title: 'Physical Units & Vectors',
    domain: 'physics',
    topic: 'Classical Mechanics',
    topicQuery: 'Physical Units and Vectors',
    prerequisiteIds: [],
    objectives: [
      'Differentiate scalars (mass, time) from vectors (displacement, velocity, force)',
      'Perform dimensional consistency checks with SI units (kg, m, s, N)',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
  },

  phys_kinematics_velocity: {
    id: 'phys_kinematics_velocity',
    title: 'Velocity & Acceleration (v = u + at)',
    domain: 'physics',
    topic: 'Kinematics',
    topicQuery: 'v = u + at',
    prerequisiteIds: ['phys_units_vectors'],
    objectives: [
      'Compute constant linear acceleration and velocity over time',
      'Plot kinematic velocity-time graphs and calculate slopes',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Physical Units and Vectors',
    rationaleForPrerequisite: {
      phys_units_vectors: 'Kinematics requires working with velocity and acceleration vector dimensions (m/s, m/s²).',
    },
  },

  phys_newton_laws: {
    id: 'phys_newton_laws',
    title: 'Newton’s Second Law of Motion (F = ma)',
    domain: 'physics',
    topic: 'Dynamics',
    topicQuery: 'F = ma',
    prerequisiteIds: ['phys_kinematics_velocity'],
    objectives: [
      'Relate net force, inertial mass, and resulting acceleration',
      'Compute bidirectional parameter variations (F, m, a)',
      'Understand Newton’s laws of motion in inertial reference frames',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'v = u + at',
    rationaleForPrerequisite: {
      phys_kinematics_velocity: 'Understanding acceleration as the rate of velocity change is necessary before computing the force that causes it.',
    },
  },

  phys_momentum_impulse: {
    id: 'phys_momentum_impulse',
    title: 'Linear Momentum & Impulse (p = mv)',
    domain: 'physics',
    topic: 'Dynamics',
    topicQuery: 'Momentum and Impulse',
    prerequisiteIds: ['phys_newton_laws'],
    objectives: [
      'Relate mass and velocity to linear momentum p = mv',
      'Derive impulse as force applied over time Δt',
      'Understand momentum conservation in isolated systems',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'F = ma',
    rationaleForPrerequisite: {
      phys_newton_laws: 'Momentum and impulse derive directly from Newton’s Second Law F = Δp / Δt.',
    },
  },

  phys_pendulum_harmonic: {
    id: 'phys_pendulum_harmonic',
    title: 'Harmonic Motion & Pendulums',
    domain: 'physics',
    topic: 'Oscillations',
    topicQuery: 'simulate a pendulum',
    prerequisiteIds: ['phys_newton_laws'],
    objectives: [
      'Model restoring force F = -mg sin(θ) in simple pendulums',
      'Calculate period T = 2π√(L/g) for small angle approximations',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'F = ma',
    rationaleForPrerequisite: {
      phys_newton_laws: 'Harmonic oscillation is governed by Newton’s Second Law with angular restoring forces.',
    },
  },

  // --- Mathematics & Algebra Track ---
  math_linear_equations: {
    id: 'math_linear_equations',
    title: 'Linear Equations & Equalities',
    domain: 'mathematics',
    topic: 'Algebra',
    topicQuery: 'Linear Equations',
    prerequisiteIds: [],
    objectives: [
      'Isolate variables across balanced equality statements',
      'Apply inverse operations to solve for unknown variables',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
  },

  math_factoring_expansion: {
    id: 'math_factoring_expansion',
    title: 'Binomial Expansion & Identities ((a+b)²)',
    domain: 'mathematics',
    topic: 'Algebra',
    topicQuery: '(a+b)^2=',
    prerequisiteIds: ['math_linear_equations'],
    objectives: [
      'Expand (a + b)² = a² + 2ab + b² geometrically and algebraically',
      'Apply FOIL distributed multiplication on polynomials',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Linear Equations',
    rationaleForPrerequisite: {
      math_linear_equations: 'Polynomial expansion relies on understanding algebraic terms and variable coefficients.',
    },
  },

  math_quadratic_formula: {
    id: 'math_quadratic_formula',
    title: 'The Quadratic Formula & Roots',
    domain: 'mathematics',
    topic: 'Algebra',
    topicQuery: 'Quadratic formula',
    prerequisiteIds: ['math_factoring_expansion'],
    objectives: [
      'Derive and apply x = (-b ± √(b² - 4ac)) / (2a)',
      'Analyze the discriminant (b² - 4ac) to determine real vs complex roots',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: '(a+b)^2=',
    rationaleForPrerequisite: {
      math_factoring_expansion: 'Deriving the quadratic formula requires completing the square, which is the exact inverse of binomial expansion.',
    },
  },

  // --- School Geometry, Functions & Foundations Track ---
  math_cartesian_plane: {
    id: 'math_cartesian_plane',
    title: 'Cartesian Coordinate System & Coordinates',
    domain: 'mathematics',
    topic: 'Coordinate Geometry',
    topicQuery: 'Cartesian coordinate plane',
    prerequisiteIds: [],
    objectives: [
      'Plot ordered pairs (x, y) across four quadrants',
      'Measure horizontal run Δx and vertical rise Δy between points',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
    diagnosticQuestion: {
      question: 'In the Cartesian coordinate plane, what are the coordinates of the origin?',
      options: ['(0, 0)', '(1, 1)', '(0, 1)', '(-1, -1)'],
      correctIndex: 0,
      explanation: 'The origin is the intersection of the x-axis and y-axis at (0, 0).',
    },
  },

  math_linear_functions: {
    id: 'math_linear_functions',
    title: 'Linear Functions & Slope-Intercept Form (y = mx + c)',
    domain: 'mathematics',
    topic: 'Algebra & Functions',
    topicQuery: 'y = 2x + 3',
    prerequisiteIds: ['math_cartesian_plane', 'math_linear_equations'],
    objectives: [
      'Interpret slope m as constant rate of change (rise / run)',
      'Identify y-intercept c where the line intersects the vertical axis',
      'Plot and predict points on a continuous linear function',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Linear Equations',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Graphing linear functions requires plotting coordinate pairs on the Cartesian plane.',
      math_linear_equations: 'Evaluating and transforming y = mx + c uses balanced linear algebraic operations.',
    },
    diagnosticQuestion: {
      question: 'For the linear function y = 2x + 3, what are the slope m and y-intercept c?',
      options: [
        'Slope m = 2, y-intercept c = 3',
        'Slope m = 3, y-intercept c = 2',
        'Slope m = 2, y-intercept c = -3',
        'Slope m = 5, y-intercept c = 0',
      ],
      correctIndex: 0,
      explanation: 'In y = mx + c, the coefficient of x is the slope (m = 2) and the constant term is the y-intercept (c = 3).',
    },
  },

  math_systems_linear: {
    id: 'math_systems_linear',
    title: 'Systems of Linear Equations',
    domain: 'mathematics',
    topic: 'Algebra',
    topicQuery: 'Systems of linear equations',
    prerequisiteIds: ['math_linear_functions'],
    objectives: [
      'Find the intersection point of two linear function graphs',
      'Solve simultaneous linear equations by substitution and elimination',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'y = 2x + 3',
    rationaleForPrerequisite: {
      math_linear_functions: 'Understanding individual linear functions is necessary before finding where two lines intersect.',
    },
  },

  math_trig_functions: {
    id: 'math_trig_functions',
    title: 'Transcendental & Trigonometric Curves (y = f(x))',
    domain: 'mathematics',
    topic: 'Calculus & Analytic Geometry',
    topicQuery: 'y = e^(cos(x))',
    prerequisiteIds: ['math_cartesian_plane', 'math_linear_functions'],
    objectives: [
      'Analyze continuous coordinate curves, periodicity, and local extrema',
      'Compute instantaneous rates of change and stationary points via differential calculus',
      'Connect unit circle oscillations with Cartesian wave functions',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Cartesian Coordinate Plane',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Plotting transcendental functions requires familiarity with Cartesian coordinates.',
      math_linear_functions: 'Understanding constant slopes provides the baseline before analyzing varying derivative slopes.',
    },
    diagnosticQuestion: {
      question: 'What is the period of the standard cosine wave y = cos(x)?',
      options: ['2π radians', 'π radians', 'π/2 radians', '4π radians'],
      correctIndex: 0,
      explanation: 'One complete revolution around the unit circle corresponds to 2π radians (360°).',
    },
  },

  math_cosine_function: {
    id: 'math_cosine_function',
    title: 'Cosine Function Wave: y = cos(x)',
    domain: 'mathematics',
    topic: 'Trigonometry & Analytic Geometry',
    topicQuery: 'y = cos(x)',
    prerequisiteIds: ['math_cartesian_plane'],
    objectives: [
      'Understand cosine as x-projection of a point on the unit circle',
      'Analyze wave properties: amplitude A = 1, period T = 2π, range [-1, 1]',
      'Evaluate even symmetry: cos(-x) = cos(x)',
      'Compute instantaneous rate of change (derivative dy/dx = -sin(x))',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 5 },
    reviewTopicQuery: 'Cartesian Coordinate Plane',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Plotting trigonometric wave curves requires familiarity with Cartesian coordinates and radians.',
    },
    diagnosticQuestion: {
      question: 'What is the value of y = cos(0)?',
      options: ['1', '0', '-1', 'π'],
      correctIndex: 0,
      explanation: 'At angle 0 radians on the unit circle, the x-coordinate is at maximum 1, so cos(0) = 1.',
    },
  },

  math_exp_cos_curve: {
    id: 'math_exp_cos_curve',
    title: 'Transcendental Curve Analysis: y = e^(cos(x))',
    domain: 'mathematics',
    topic: 'Calculus & Analytic Geometry',
    topicQuery: 'y = e^(cos(x))',
    prerequisiteIds: ['math_cartesian_plane', 'math_trig_functions'],
    objectives: [
      'Analyze composite exponential and trigonometric oscillations',
      'Determine range bounds [1/e, e] and global extrema using the chain rule',
      'Plot transcendental curves with animated coordinate probe tracking',
    ],
    difficulty: 'advanced',
    estimatedMinutes: 25,
    masteryCriteria: { minScore: 75, minCompletedSteps: 6 },
    reviewTopicQuery: 'y = e^(cos(x))',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Coordinate plane plotting forms the basis for curve sketching.',
      math_trig_functions: 'Understanding pure trigonometric waves is necessary before composing them with exponentials.',
    },
    diagnosticQuestion: {
      question: 'What is the maximum value reached by y = e^(cos(x))?',
      options: ['e (approx 2.718)', '1', 'e² (approx 7.389)', 'Infinity'],
      correctIndex: 0,
      explanation: 'Since the maximum of cos(x) is 1, the maximum of y = e^(cos(x)) is e¹ = e ≈ 2.718.',
    },
  },

  math_exponential_function: {
    id: 'math_exponential_function',
    title: 'Exponential Function Analysis: y = e^x',
    domain: 'mathematics',
    topic: 'Calculus & Analytic Geometry',
    topicQuery: 'y = e^x',
    prerequisiteIds: ['math_cartesian_plane'],
    objectives: [
      'Model continuous compound growth and proportional change',
      'Understand Euler\'s number e as base of natural growth',
      'Analyze asymptote y = 0 and instantaneous derivative dy/dx = e^x',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 75, minCompletedSteps: 5 },
    reviewTopicQuery: 'y = e^x',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Cartesian coordinate axes are required to plot exponential asymptotes and points.',
    },
    diagnosticQuestion: {
      question: 'What is the y-intercept of the function y = e^x?',
      options: ['(0, 1)', '(0, 0)', '(1, 0)', '(0, e)'],
      correctIndex: 0,
      explanation: 'For any base b ≠ 0, b^0 = 1. Therefore, when x = 0, y = e^0 = 1.',
    },
  },

  math_fractions_basic: {
    id: 'math_fractions_basic',
    title: 'Fractions & Part-to-Whole Representation',
    domain: 'mathematics',
    topic: 'Arithmetic & Foundations',
    topicQuery: 'fractions',
    prerequisiteIds: [],
    objectives: [
      'Understand numerator as count of selected parts and denominator as total equal partitions',
      'Represent fractions visually on circular disks and rectangular strips',
      'Distinguish proper fractions from improper fractions and mixed numbers',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
    diagnosticQuestion: {
      question: 'In the fraction 3/4, what does the denominator 4 represent?',
      options: [
        'The total number of equal parts the whole is partitioned into',
        'The number of parts selected',
        'The sum of all fractions',
        'A decimal remainder',
      ],
      correctIndex: 0,
      explanation: 'The denominator denotes into how many equal-sized parts the whole is divided.',
    },
  },

  math_equivalent_fractions: {
    id: 'math_equivalent_fractions',
    title: 'Equivalent Fractions & Simplification',
    domain: 'mathematics',
    topic: 'Arithmetic & Foundations',
    topicQuery: 'equivalent fractions',
    prerequisiteIds: ['math_fractions_basic'],
    objectives: [
      'Scale numerator and denominator by factor k preserving invariant value (a/b = ka/kb)',
      'Simplify fractions to irreducible form using greatest common divisor (GCD)',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'fractions',
    rationaleForPrerequisite: {
      math_fractions_basic: 'You must understand parts-to-whole partitions before subdividing or simplifying them.',
    },
    diagnosticQuestion: {
      question: 'Which fraction is equivalent to 3/4 when both numerator and denominator are scaled by 2?',
      options: ['6/8', '5/6', '6/4', '3/8'],
      correctIndex: 0,
      explanation: '(3 · 2) / (4 · 2) = 6/8, representing the exact same proportional area.',
    },
  },

  math_right_triangles: {
    id: 'math_right_triangles',
    title: 'Right Triangles, Legs & Hypotenuse',
    domain: 'mathematics',
    topic: 'Geometry',
    topicQuery: 'right triangle',
    prerequisiteIds: [],
    objectives: [
      'Identify the 90° right angle, perpendicular legs a and b, and hypotenuse c',
      'Calculate right triangle area as (1/2) · a · b',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 10,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
  },

  math_pythagorean_theorem: {
    id: 'math_pythagorean_theorem',
    title: 'Pythagorean Theorem & Area Dissection (a² + b² = c²)',
    domain: 'mathematics',
    topic: 'Geometry',
    topicQuery: 'Pythagorean theorem',
    prerequisiteIds: ['math_right_triangles', 'math_factoring_expansion'],
    objectives: [
      'Apply a² + b² = c² to compute missing side lengths in right triangles',
      'Understand the Chou Pei / Bhaskara area rearrangement dissection proof',
      'Recognize integer Pythagorean triples including (3, 4, 5) and (5, 12, 13)',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'right triangle',
    rationaleForPrerequisite: {
      math_right_triangles: 'The theorem strictly applies to right triangles with perpendicular legs and hypotenuse.',
      math_factoring_expansion: 'Geometric dissection proofs equate outer square area (a + b)² with inner square c² plus 4 triangles.',
    },
    diagnosticQuestion: {
      question: 'In a right triangle with legs a = 3 and b = 4, what is the length of hypotenuse c?',
      options: ['5', '7', '12', '25'],
      correctIndex: 0,
      explanation: 'c = √(a² + b²) = √(9 + 16) = √25 = 5.',
    },
  },

  math_euclidean_distance: {
    id: 'math_euclidean_distance',
    title: 'Euclidean Distance in Coordinate Space',
    domain: 'mathematics',
    topic: 'Coordinate Geometry',
    topicQuery: 'distance between points',
    prerequisiteIds: ['math_cartesian_plane', 'math_pythagorean_theorem'],
    objectives: [
      'Calculate distance d = √((x₂ - x₁)² + (y₂ - y₁)²) between two coordinate points',
      'Recognize horizontal Δx and vertical Δy as legs of a right triangle in the Cartesian plane',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Pythagorean theorem',
    rationaleForPrerequisite: {
      math_cartesian_plane: 'Points must be located in 2D coordinate space (x, y).',
      math_pythagorean_theorem: 'The distance formula is the direct application of the Pythagorean theorem to coordinate deltas.',
    },
  },

  // --- Trees & Graph Theory Track ---
  cs_trees_traversal: {
    id: 'cs_trees_traversal',
    title: 'Binary Trees & Tree Traversal (BFS & DFS)',
    domain: 'computer_science',
    topic: 'Data Structures & Algorithms',
    topicQuery: 'binary tree traversal',
    prerequisiteIds: ['cs_stacks_queues', 'cs_binary_search'],
    objectives: [
      'Understand root, parent, child, left, right, and leaf node hierarchy',
      'Execute Breadth-First Search (BFS / level-order) using a FIFO queue',
      'Execute Depth-First Search (DFS in-order, pre-order, post-order) using recursion / LIFO stack',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 25,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'Data Structures',
    rationaleForPrerequisite: {
      cs_stacks_queues: 'BFS level-order traversal uses a queue, while DFS traversal relies on a call stack.',
      cs_binary_search: 'Binary search trees maintain binary search ordering properties at each node.',
    },
  },

  cs_graphs_theory: {
    id: 'cs_graphs_theory',
    title: 'Graph Theory: Vertices, Edges & Adjacency',
    domain: 'computer_science',
    topic: 'Data Structures & Algorithms',
    topicQuery: 'graph vertices and edges',
    prerequisiteIds: ['cs_trees_traversal'],
    objectives: [
      'Represent directed and undirected graphs via adjacency lists and matrices',
      'Traverse arbitrary graphs with visited sets to avoid cycles',
      'Distinguish graph data structures from coordinate function plots',
    ],
    difficulty: 'advanced',
    estimatedMinutes: 25,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'binary tree traversal',
    rationaleForPrerequisite: {
      cs_trees_traversal: 'Trees are connected acyclic graphs; mastering trees provides the necessary foundation for general graphs.',
    },
  },

  // --- Biology & Anatomy Track ---
  bio_cells_tissues: {
    id: 'bio_cells_tissues',
    title: 'Cellular Organization & Membrane Transport',
    domain: 'biology',
    topic: 'Cell Biology & Physiology',
    topicQuery: 'cells and membrane transport',
    prerequisiteIds: [],
    objectives: [
      'Understand phospholipid bilayer structure and selective permeability',
      'Examine passive diffusion, facilitated transport, and active ion pumps (Na⁺/K⁺ ATPase)',
      'Establish resting membrane electrochemical gradients (-70 mV)',
    ],
    difficulty: 'beginner',
    estimatedMinutes: 15,
    masteryCriteria: { minScore: 70, minCompletedSteps: 4 },
    diagnosticQuestion: {
      question: 'Which active transporter maintains the resting electrochemical gradient of animal cells?',
      options: [
        'Na⁺/K⁺ ATPase pump (pumping 3 Na⁺ out for 2 K⁺ in)',
        'ATP synthase rotary motor',
        'Passive glucose carrier channel',
        'Voltage-gated calcium gate',
      ],
      correctIndex: 0,
      explanation: 'The Na⁺/K⁺ ATPase actively pumps 3 Na⁺ ions out for every 2 K⁺ ions in, maintaining the negative resting membrane potential.',
    },
  },

  bio_nervous_system: {
    id: 'bio_nervous_system',
    title: 'Nervous System: CNS, PNS & Neural Transmission',
    domain: 'biology',
    topic: 'Human Anatomy & Physiology',
    topicQuery: 'nervous system',
    prerequisiteIds: ['bio_cells_tissues'],
    objectives: [
      'Distinguish Central Nervous System (Brain, Spinal Cord) from Peripheral Nervous System (Somatic, Autonomic)',
      'Explore multipolar neuron architecture: soma, dendritic arbor, myelinated axon, and synaptic terminals',
      'Trace electrochemical signal transmission through saltatory conduction across Nodes of Ranvier',
      'Model reflex arcs and synaptic neurotransmitter exocytosis across the synaptic cleft',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 6 },
    reviewTopicQuery: 'cells and membrane transport',
    rationaleForPrerequisite: {
      bio_cells_tissues: 'Neural electrical impulses require understanding selective membrane ion permeability and electrochemical gradients.',
    },
    diagnosticQuestion: {
      question: 'What constitutes the two primary anatomical divisions of the vertebrate nervous system?',
      options: [
        'Central Nervous System (CNS) and Peripheral Nervous System (PNS)',
        'Somatic system and Sensory receptors only',
        'Sympathetic and Parasympathetic cords only',
        'Cerebrum and Cerebellum only',
      ],
      correctIndex: 0,
      explanation: 'The nervous system is divided into the Central Nervous System (brain and spinal cord) and the Peripheral Nervous System (nerves extending throughout the body).',
    },
  },

  bio_neurons_synapses: {
    id: 'bio_neurons_synapses',
    title: 'Action Potentials & Synaptic Neurotransmission',
    domain: 'biology',
    topic: 'Neurophysiology',
    topicQuery: 'neurons and action potentials',
    prerequisiteIds: ['bio_nervous_system'],
    objectives: [
      'Model voltage-gated Na⁺/K⁺ channel kinetics during action potential depolarization and repolarization',
      'Analyze saltatory conduction velocity in myelinated vs unmyelinated axons',
      'Examine calcium-dependent neurotransmitter exocytosis at the presynaptic terminal',
    ],
    difficulty: 'advanced',
    estimatedMinutes: 25,
    masteryCriteria: { minScore: 75, minCompletedSteps: 6 },
    reviewTopicQuery: 'nervous system',
    rationaleForPrerequisite: {
      bio_nervous_system: 'Understanding nervous system anatomy provides the structural context before modeling microsecond ionic gate kinetics.',
    },
    diagnosticQuestion: {
      question: 'What threshold potential must be reached at the axon hillock to trigger an all-or-none action potential?',
      options: ['Approximately -55 mV', 'Exactly 0 mV', '+30 mV', '-90 mV'],
      correctIndex: 0,
      explanation: 'When graded dendritic potentials summate to depolarize the axon hillock to approximately -55 mV, voltage-gated Na⁺ channels open in an all-or-none cascade.',
    },
  },

  // --- Chemistry Track ---
  chem_chemical_bonding: {
    id: 'chem_chemical_bonding',
    title: 'Chemical Bonding & Molecular Geometry',
    domain: 'chemistry',
    topic: 'General Chemistry',
    topicQuery: 'chemical bonding',
    prerequisiteIds: [],
    objectives: [
      'Understand polar covalent, nonpolar covalent, and ionic bonding across the electronegativity spectrum',
      'Apply VSEPR theory to predict 3D molecular geometries (linear, bent, trigonal planar, tetrahedral)',
      'Analyze molecular dipole moments and intermolecular hydrogen bonding interactions',
    ],
    difficulty: 'intermediate',
    estimatedMinutes: 20,
    masteryCriteria: { minScore: 70, minCompletedSteps: 5 },
    diagnosticQuestion: {
      question: 'What gives a water molecule (H₂O) its bent 104.5° geometry rather than a linear arrangement?',
      options: [
        'Two nonbonding electron lone pairs on the central oxygen exerting steric repulsion (VSEPR theory)',
        'Gravitational attraction between hydrogen nuclei',
        'Ionic dissociation into H⁺ and OH⁻',
        'Hydrogen bonds pulling atoms together',
      ],
      correctIndex: 0,
      explanation: 'Under VSEPR theory, the two nonbonding lone pairs on oxygen occupy more space than bonding pairs, compressing the H-O-H angle from 109.5° down to 104.5°.',
    },
  },
};

/**
 * Service to validate concept dependency graphs, evaluate student mastery from real session evidence,
 * and adapt personalized learning paths.
 */
export class ConceptDependencyGraphEngine {
  private static registry: Record<string, ConceptNode> = { ...TRUSTED_CONCEPT_REGISTRY };
  private static goalMemoryMap: Map<string, string> = new Map();

  public static getRegistry(): Record<string, ConceptNode> {
    return { ...this.registry };
  }

  public static registerConcept(concept: ConceptNode): void {
    this.registry[concept.id] = concept;
  }

  /**
   * Validates graph integrity: ensures all referenced prerequisites exist
   * and verifies that the graph is strictly acyclic (no circular dependencies).
   */
  public static validateGraph(graph: Record<string, ConceptNode> = this.registry): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // 1. Missing Prerequisite Reference Check
    for (const [id, node] of Object.entries(graph)) {
      if (!node.id || !node.title) {
        errors.push(`Concept node "${id}" is missing required id or title.`);
      }
      for (const prereqId of node.prerequisiteIds || []) {
        if (!graph[prereqId]) {
          errors.push(
            `Missing prerequisite reference: Concept "${node.title || id}" references non-existent prerequisite ID "${prereqId}".`
          );
        }
      }
    }

    // 2. Cycle Detection using Depth-First Search with 3 states (0: unvisited, 1: visiting, 2: visited)
    const visitedState = new Map<string, 0 | 1 | 2>();
    const recursionStack: string[] = [];

    const detectCycleDFS = (currId: string): boolean => {
      visitedState.set(currId, 1); // Mark as currently visiting
      recursionStack.push(currId);

      const node = graph[currId];
      if (node && Array.isArray(node.prerequisiteIds)) {
        for (const prereqId of node.prerequisiteIds) {
          if (!graph[prereqId]) continue; // Already flagged in check 1

          const state = visitedState.get(prereqId) || 0;
          if (state === 1) {
            // Found back-edge -> Cycle detected!
            const cycleIndex = recursionStack.indexOf(prereqId);
            const cyclePath = [...recursionStack.slice(cycleIndex), prereqId].join(' -> ');
            errors.push(`Circular dependency detected: Cycle path [${cyclePath}].`);
            return true;
          }
          if (state === 0) {
            if (detectCycleDFS(prereqId)) return true;
          }
        }
      }

      visitedState.set(currId, 2); // Mark as completely visited
      recursionStack.pop();
      return false;
    };

    for (const id of Object.keys(graph)) {
      if ((visitedState.get(id) || 0) === 0) {
        detectCycleDFS(id);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Retrieves all transitive prerequisites required for a target concept.
   */
  public static getTransitivePrerequisites(
    conceptId: string,
    graph: Record<string, ConceptNode> = this.registry
  ): string[] {
    const result = new Set<string>();

    const traverse = (currId: string) => {
      const node = graph[currId];
      if (!node || !Array.isArray(node.prerequisiteIds)) return;

      for (const pId of node.prerequisiteIds) {
        if (!result.has(pId)) {
          result.add(pId);
          traverse(pId);
        }
      }
    };

    traverse(conceptId);
    return Array.from(result);
  }

  /**
   * Performs topological sort on a set of concept IDs so prerequisites appear before dependents.
   */
  public static topologicalSort(
    conceptIds: string[],
    graph: Record<string, ConceptNode> = this.registry
  ): string[] {
    const idSet = new Set(conceptIds);
    const inDegree = new Map<string, number>();
    const adjList = new Map<string, string[]>();

    for (const id of Array.from(idSet)) {
      inDegree.set(id, 0);
      adjList.set(id, []);
    }

    // Build directed graph: Prerequisite -> Dependent
    for (const id of Array.from(idSet)) {
      const node = graph[id];
      if (node && Array.isArray(node.prerequisiteIds)) {
        for (const pId of node.prerequisiteIds) {
          if (idSet.has(pId)) {
            adjList.get(pId)?.push(id);
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
          }
        }
      }
    }

    // Kahn's Algorithm
    const queue: string[] = [];
    for (const [id, deg] of Array.from(inDegree.entries())) {
      if (deg === 0) queue.push(id);
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      sorted.push(curr);

      const neighbors = adjList.get(curr) || [];
      for (const neighbor of neighbors) {
        const newDeg = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDeg);
        if (newDeg === 0) {
          queue.push(neighbor);
        }
      }
    }

    // Include any nodes left over (or fallback in original order if cycle existed)
    for (const id of conceptIds) {
      if (!sorted.includes(id)) sorted.push(id);
    }

    return sorted;
  }

  /**
   * Resolves a user search topic or goal ID to a registered ConceptNode.
   */
  public static resolveGoalConcept(
    goalQueryOrId: string,
    graph: Record<string, ConceptNode> = this.registry
  ): ConceptNode | null {
    if (!goalQueryOrId || !goalQueryOrId.trim()) return null;
    const clean = goalQueryOrId.trim();

    // 1. Direct ID match
    if (graph[clean]) return graph[clean];

    const lower = clean.toLowerCase();

    // 2. Keyword & topic matching
    if (lower.includes('binary search')) return graph['cs_binary_search'] || null;
    if (lower.includes('time complexity') || lower.includes('big-o') || lower.includes('big o')) {
      return graph['cs_time_complexity'] || null;
    }
    if (lower.includes('sorted array')) return graph['cs_sorted_arrays'] || null;
    if (lower.includes('array') && lower.includes('index')) return graph['cs_arrays_indexing'] || null;
    if (lower.includes('stack') || lower.includes('queue') || lower.includes('data structure')) {
      return graph['cs_stacks_queues'] || null;
    }
    if (lower.includes('f = ma') || lower.includes('f=ma') || lower.includes('newton')) {
      return graph['phys_newton_laws'] || null;
    }
    if (lower.includes('v = u + at') || lower.includes('kinematic') || lower.includes('acceleration')) {
      return graph['phys_kinematics_velocity'] || null;
    }
    if (lower.includes('momentum') || lower.includes('impulse')) {
      return graph['phys_momentum_impulse'] || null;
    }
    if (lower.includes('pendulum') || lower.includes('harmonic')) {
      return graph['phys_pendulum_harmonic'] || null;
    }
    if (lower.includes('quadratic')) return graph['math_quadratic_formula'] || null;
    if (lower.includes('(a+b)^2') || lower.includes('(a-b)^2') || lower.includes('binomial')) {
      return graph['math_factoring_expansion'] || null;
    }
    if (
      lower.includes('graph theory') ||
      lower.includes('vertices and edges') ||
      lower.includes('vertex') ||
      lower.includes('adjacency') ||
      lower.includes('edge list')
    ) {
      return graph['cs_graphs_theory'] || null;
    }
    if (
      lower.includes('distance between') ||
      lower.includes('distance formula') ||
      lower.includes('euclidean distance')
    ) {
      return graph['math_euclidean_distance'] || null;
    }
    if (
      lower.includes('e^(cos(x))') ||
      lower.includes('e^cos(x)') ||
      lower.includes('exp(cos(x))')
    ) {
      return graph['math_exp_cos_curve'] || null;
    }
    if (
      lower.includes('e^x') ||
      lower.includes('y=e^x') ||
      lower.includes('y = e^x') ||
      lower.includes('exponential function') ||
      lower.includes('exponential curve') ||
      lower.includes('exponential growth') ||
      lower.includes('exp(x)') ||
      (lower.includes('graph') && (lower.includes('e^') || lower.includes('exp')))
    ) {
      return graph['math_exponential_function'] || null;
    }
    if (
      lower.includes('y=cosx') ||
      lower.includes('y = cosx') ||
      lower.includes('y=cos(x)') ||
      lower.includes('y = cos(x)') ||
      lower.includes('cos(x)') ||
      lower.includes('cosx') ||
      lower.includes('cos x') ||
      lower.includes('cosine')
    ) {
      return graph['math_cosine_function'] || graph['math_trig_functions'] || null;
    }
    const isTrigOrCurve =
      /\b(cos|sin|tan|sec|csc|cot)\b/i.test(lower) ||
      /\b(cosine|sine|tangent|trigonometry|trig)\b/i.test(lower) ||
      lower.includes('cos(') ||
      lower.includes('sin(') ||
      lower.includes('tan(') ||
      (lower.includes('curve') && !lower.includes('learning')) ||
      lower.startsWith('graph y') ||
      lower.startsWith('graph of y') ||
      lower.includes('plot function') ||
      lower.includes('plot curve');
    if (isTrigOrCurve) {
      return graph['math_trig_functions'] || null;
    }
    if (
      lower.includes('linear function') ||
      lower.includes('slope intercept') ||
      lower.includes('y = mx') ||
      lower.includes('y=mx') ||
      lower.includes('y = 2x') ||
      lower.includes('y=2x') ||
      lower.includes('gradient') ||
      lower.includes('slope')
    ) {
      return graph['math_linear_functions'] || null;
    }
    if (lower.includes('systems of linear') || lower.includes('linear system')) {
      return graph['math_systems_linear'] || null;
    }
    if (lower.includes('equivalent fraction') || lower.includes('simplify fraction')) {
      return graph['math_equivalent_fractions'] || null;
    }
    if (
      lower.includes('fraction') ||
      lower.includes('part-to-whole') ||
      lower.includes('numerator') ||
      lower.includes('denominator')
    ) {
      return graph['math_fractions_basic'] || null;
    }
    if (
      lower.includes('pythagor') ||
      lower.includes('hypotenuse') ||
      lower.includes('a^2 + b^2') ||
      lower.includes('a² + b²')
    ) {
      return graph['math_pythagorean_theorem'] || null;
    }
    if (lower.includes('right triangle')) {
      return graph['math_right_triangles'] || null;
    }
    if (lower.includes('cartesian') || lower.includes('coordinate plane') || lower.includes('quadrant')) {
      return graph['math_cartesian_plane'] || null;
    }
    if (
      lower.includes('binary tree') ||
      lower.includes('tree traversal') ||
      lower.includes('bfs') ||
      lower.includes('dfs') ||
      (lower.includes('tree') && !lower.includes('street'))
    ) {
      return graph['cs_trees_traversal'] || null;
    }
    if (
      lower.includes('nervous system') ||
      lower.includes('nervous') ||
      lower.includes('brain') ||
      lower.includes('neuron') ||
      lower.includes('synapse') ||
      lower.includes('action potential') ||
      lower.includes('spine')
    ) {
      return graph['bio_nervous_system'] || null;
    }
    if (lower.includes('cell membrane') || lower.includes('membrane transport') || lower.includes('cells and membrane')) {
      return graph['bio_cells_tissues'] || null;
    }

    // 3. Fallback: Search by title substring
    for (const node of Object.values(graph)) {
      if (node.title.toLowerCase().includes(lower) || node.topicQuery.toLowerCase().includes(lower)) {
        return node;
      }
    }

    return null;
  }

  /**
   * Retrieves the direct prerequisites for a given concept ID.
   */
  public static getDirectPrerequisites(
    conceptId: string,
    graph: Record<string, ConceptNode> = this.registry
  ): ConceptNode[] {
    const node = graph[conceptId];
    if (!node || !Array.isArray(node.prerequisiteIds)) return [];
    return node.prerequisiteIds
      .map((id) => graph[id])
      .filter((n): n is ConceptNode => n !== undefined);
  }

  /**
   * Retrieves the direct downstream dependents unlocked by a given concept ID.
   */
  public static getDirectDependents(
    conceptId: string,
    graph: Record<string, ConceptNode> = this.registry
  ): ConceptNode[] {
    return Object.values(graph).filter(
      (node) => Array.isArray(node.prerequisiteIds) && node.prerequisiteIds.includes(conceptId)
    );
  }

  /**
   * Generates intelligent, evidence-grounded next steps for a student studying a concept.
   */
  public static getRecommendedNextSteps(
    conceptId: string,
    currentSession?: SavedLearningSessionState | null,
    allSessions: SavedLearningSessionState[] = [],
    graph: Record<string, ConceptNode> = this.registry
  ): {
    concept: ConceptNode;
    rationale: string;
    priority: 'prerequisite_review' | 'current_practice' | 'advanced_step';
  }[] {
    const node = graph[conceptId];
    if (!node) return [];

    const recommendations: {
      concept: ConceptNode;
      rationale: string;
      priority: 'prerequisite_review' | 'current_practice' | 'advanced_step';
    }[] = [];

    const sessionMap = new Map<string, SavedLearningSessionState>();
    for (const s of allSessions) {
      if (s.conceptId) sessionMap.set(s.conceptId.toLowerCase(), s);
      sessionMap.set(s.primaryTopic.toLowerCase(), s);
    }
    if (currentSession) {
      sessionMap.set(conceptId.toLowerCase(), currentSession);
    }

    // 1. Evaluate Direct Prerequisites: check if any prerequisite is unmastered or needs review
    const directPrereqs = this.getDirectPrerequisites(conceptId, graph);
    for (const prereq of directPrereqs) {
      const pSession = sessionMap.get(prereq.id.toLowerCase()) || sessionMap.get(prereq.topicQuery.toLowerCase()) || null;
      const mastery = this.evaluateConceptMastery(prereq, pSession);

      if (mastery.state === 'needs_review') {
        recommendations.push({
          concept: prereq,
          rationale: `Foundational prerequisite "${prereq.title}" flagged missed questions. Reviewing this foundation ensures confident mastery of "${node.title}".`,
          priority: 'prerequisite_review',
        });
      } else if (mastery.state === 'not_started') {
        recommendations.push({
          concept: prereq,
          rationale: `Recommended prerequisite: "${prereq.title}" introduces key principles required for "${node.title}".`,
          priority: 'prerequisite_review',
        });
      }
    }

    // 2. Evaluate Current Concept Mastery
    const currentMastery = this.evaluateConceptMastery(
      node,
      currentSession || sessionMap.get(conceptId.toLowerCase()) || null
    );

    if (
      currentMastery.state === 'not_started' ||
      currentMastery.state === 'in_progress' ||
      currentMastery.state === 'needs_review'
    ) {
      recommendations.push({
        concept: node,
        rationale:
          currentMastery.state === 'needs_review'
            ? `Target concept "${node.title}" needs review. Retesting practice questions will consolidate understanding.`
            : `Engage with interactive visualizations and complete practice exercises to demonstrate mastery of "${node.title}".`,
        priority: 'current_practice',
      });
    }

    // 3. Evaluate Downstream Dependents (Advanced Next Steps)
    const directDependents = this.getDirectDependents(conceptId, graph);
    for (const dep of directDependents) {
      const depSession = sessionMap.get(dep.id.toLowerCase()) || sessionMap.get(dep.topicQuery.toLowerCase()) || null;
      const depMastery = this.evaluateConceptMastery(dep, depSession);

      if (depMastery.state !== 'completed') {
        recommendations.push({
          concept: dep,
          rationale: `Unlocked advance step: Mastering "${node.title}" establishes the required foundation to explore "${dep.title}".`,
          priority: 'advanced_step',
        });
      }
    }

    // Sort: prerequisite_review first, then current_practice, then advanced_step
    const priorityOrder = { prerequisite_review: 0, current_practice: 1, advanced_step: 2 };
    recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

    return recommendations;
  }

  /**
   * Generates a focused topic knowledge subgraph for interactive visualization.
   * Returns prerequisites, active concept, downstream dependents, calculated graph coordinates, and edge connections.
   */
  public static getTopicKnowledgeSubGraph(
    topicQueryOrId: string,
    currentSession?: SavedLearningSessionState | null,
    allSessions: SavedLearningSessionState[] = [],
    graph: Record<string, ConceptNode> = this.registry
  ): TopicKnowledgeSubGraph | null {
    const target = this.resolveGoalConcept(topicQueryOrId, graph);
    if (!target) return null;

    const prerequisites = this.getDirectPrerequisites(target.id, graph);
    const dependents = this.getDirectDependents(target.id, graph);
    const nextSteps = this.getRecommendedNextSteps(target.id, currentSession, allSessions, graph);

    // Build session map for mastery lookups
    const sessionMap = new Map<string, SavedLearningSessionState>();
    for (const s of allSessions) {
      if (s.conceptId) sessionMap.set(s.conceptId.toLowerCase(), s);
      sessionMap.set(s.primaryTopic.toLowerCase(), s);
    }
    if (currentSession) {
      sessionMap.set(target.id.toLowerCase(), currentSession);
    }

    const nodes: GraphNodePosition[] = [];
    const edges: GraphEdgeConnection[] = [];

    // Calculate layout coordinates (Width: 640px, Height: 340px)
    const centerY = 170;
    const cardWidth = 180;
    const cardHeight = 76;
    const halfW = cardWidth / 2; // 90
    const halfH = cardHeight / 2; // 38

    const createConnectionPoints = (x: number, y: number) => ({
      left: { x: x - halfW, y },
      right: { x: x + halfW, y },
      top: { x, y: y - halfH },
      bottom: { x, y: y + halfH },
    });

    const createEndpoints = (x: number, y: number) => ({
      incoming: { x: x - halfW, y },
      outgoing: { x: x + halfW, y },
    });

    // 1. Prerequisites (Left Column, x = 120)
    const pCount = prerequisites.length;
    prerequisites.forEach((p, idx) => {
      const ySpacing = pCount === 1 ? centerY : pCount === 2 ? 100 + idx * 140 : 60 + idx * (220 / Math.max(1, pCount - 1));
      const pSession = sessionMap.get(p.id.toLowerCase()) || null;
      const mastery = this.evaluateConceptMastery(p, pSession);

      nodes.push({
        concept: p,
        role: 'prerequisite',
        masteryState: mastery.state,
        score: mastery.score,
        isUnlocked: true,
        x: 120,
        y: ySpacing,
        width: cardWidth,
        height: cardHeight,
        connectionPoints: createConnectionPoints(120, ySpacing),
        endpoints: createEndpoints(120, ySpacing),
      });

      const startX = 120 + halfW;
      const startY = ySpacing;
      const endX = 350 - halfW;
      const endY = centerY;
      const controlX1 = startX + (endX - startX) * 0.5;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.5;
      const controlY2 = endY;
      const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

      edges.push({
        sourceId: p.id,
        targetId: target.id,
        rationale: target.rationaleForPrerequisite?.[p.id] || `Prerequisite for ${target.title}`,
        isHighlighted: true,
        startX,
        startY,
        endX,
        endY,
        sourceAnchor: 'right',
        targetAnchor: 'left',
        controlX1,
        controlY1,
        controlX2,
        controlY2,
        pathD,
        markerEnd: 'url(#kg-arrowhead)',
      });
    });

    // 2. Active Target Concept (Center Column, x = 350, y = 170)
    const targetMastery = this.evaluateConceptMastery(target, currentSession || null);
    nodes.push({
      concept: target,
      role: 'current',
      masteryState: targetMastery.state,
      score: targetMastery.score,
      isUnlocked: true,
      x: 350,
      y: centerY,
      width: cardWidth,
      height: cardHeight,
      connectionPoints: createConnectionPoints(350, centerY),
      endpoints: createEndpoints(350, centerY),
    });

    // 3. Dependents (Right Column, x = 580)
    const dCount = dependents.length;
    dependents.forEach((d, idx) => {
      const ySpacing = dCount === 1 ? centerY : dCount === 2 ? 100 + idx * 140 : 60 + idx * (220 / Math.max(1, dCount - 1));
      const dSession = sessionMap.get(d.id.toLowerCase()) || null;
      const mastery = this.evaluateConceptMastery(d, dSession);

      nodes.push({
        concept: d,
        role: 'dependent',
        masteryState: mastery.state,
        score: mastery.score,
        isUnlocked: targetMastery.state === 'completed' || targetMastery.state === 'demonstrated_understanding',
        x: 580,
        y: ySpacing,
        width: cardWidth,
        height: cardHeight,
        connectionPoints: createConnectionPoints(580, ySpacing),
        endpoints: createEndpoints(580, ySpacing),
      });

      const startX = 350 + halfW;
      const startY = centerY;
      const endX = 580 - halfW;
      const endY = ySpacing;
      const controlX1 = startX + (endX - startX) * 0.5;
      const controlY1 = startY;
      const controlX2 = startX + (endX - startX) * 0.5;
      const controlY2 = endY;
      const pathD = `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

      edges.push({
        sourceId: target.id,
        targetId: d.id,
        rationale: d.rationaleForPrerequisite?.[target.id] || `Unlocked by mastering ${target.title}`,
        isHighlighted: false,
        startX,
        startY,
        endX,
        endY,
        sourceAnchor: 'right',
        targetAnchor: 'left',
        controlX1,
        controlY1,
        controlX2,
        controlY2,
        pathD,
        markerEnd: 'url(#kg-arrowhead-dim)',
      });
    });

    return {
      targetConcept: target,
      prerequisites,
      dependents,
      recommendedNextSteps: nextSteps,
      nodes,
      edges,
      metadata: {
        totalPrerequisites: prerequisites.length,
        totalDependents: dependents.length,
        totalEdges: edges.length,
        activeDomain: target.domain,
        description: `Knowledge graph showing ${prerequisites.length} prerequisite connection(s) and ${dependents.length} forward pathway(s) for ${target.title}.`,
      },
    };
  }

  /**
   * Deterministically evaluates student mastery for a concept based strictly on concrete evidence:
   * saved lesson records, practice exercise correctness, and score results.
   */
  public static evaluateConceptMastery(
    concept: ConceptNode,
    session: SavedLearningSessionState | LearningSession | null
  ): ConceptMasteryEvaluation {
    if (!session) {
      return {
        conceptId: concept.id,
        state: 'not_started',
        score: 0,
        attemptsCount: 0,
        completedStepsCount: 0,
        evidenceSummary: 'No recorded lesson or practice attempt.',
      };
    }

    const completedStepsCount = Array.isArray(session.completedSteps) ? session.completedSteps.length : 0;
    const practiceAttempts = session.practiceAttempts;

    // Check practice results
    let score = 0;
    let attemptsCount = 0;
    let isCorrectAll = false;
    let hasPractice = false;

    if (practiceAttempts) {
      const mc = practiceAttempts.multipleChoice;
      const sa = practiceAttempts.shortAnswer;

      if (mc || sa) {
        hasPractice = true;
        attemptsCount += (mc ? 1 : 0) + (sa ? 1 : 0);

        if (mc && sa) {
          score = Math.round((mc.score + sa.score) / 2);
          isCorrectAll = mc.isCorrect && sa.isCorrect;
        } else if (mc) {
          score = mc.score;
          isCorrectAll = mc.isCorrect;
        } else if (sa) {
          score = sa.score;
          isCorrectAll = sa.isCorrect;
        }
      }
    }

    // Transparent rule evaluation
    if (hasPractice) {
      // 1. Struggling / repeated errors -> needs_review
      if (!isCorrectAll || score <= MASTERY_THRESHOLDS.NEEDS_REVIEW_MAX_SCORE) {
        return {
          conceptId: concept.id,
          state: 'needs_review',
          score,
          attemptsCount,
          completedStepsCount,
          evidenceSummary: `Attempted practice exercises (score: ${score}%). Missed questions detected.`,
          needsReviewReason: `Formative evaluation flagged missed questions (score: ${score}%). Reviewing this concept is recommended.`,
          lastAssessedAt: session.updatedAt || session.lastOpenedAt,
        };
      }

      // 2. High score + full lesson completion -> completed
      if (
        score >= MASTERY_THRESHOLDS.COMPLETED_MIN_SCORE &&
        (completedStepsCount >= MASTERY_THRESHOLDS.MIN_COMPLETED_STEPS_FOR_COMPLETED || session.isCompleted)
      ) {
        return {
          conceptId: concept.id,
          state: 'completed',
          score,
          attemptsCount,
          completedStepsCount,
          evidenceSummary: `Full lesson completed with mastery score of ${score}%.`,
          lastAssessedAt: session.updatedAt || session.lastOpenedAt,
        };
      }

      // 3. Passing score -> demonstrated_understanding
      if (score >= MASTERY_THRESHOLDS.DEMONSTRATED_MIN_SCORE) {
        return {
          conceptId: concept.id,
          state: 'demonstrated_understanding',
          score,
          attemptsCount,
          completedStepsCount,
          evidenceSummary: `Demonstrated understanding in formative evaluation (score: ${score}%).`,
          lastAssessedAt: session.updatedAt || session.lastOpenedAt,
        };
      }
    }

    // No practice completed yet, but stepped through lesson
    if (completedStepsCount >= MASTERY_THRESHOLDS.MIN_COMPLETED_STEPS_FOR_IN_PROGRESS) {
      return {
        conceptId: concept.id,
        state: 'in_progress',
        score: 0,
        attemptsCount: 0,
        completedStepsCount,
        evidenceSummary: `Lesson in progress (${completedStepsCount}/8 steps completed). Assessment pending.`,
        lastAssessedAt: session.updatedAt || session.lastOpenedAt,
      };
    }

    return {
      conceptId: concept.id,
      state: 'not_started',
      score: 0,
      attemptsCount: 0,
      completedStepsCount: 0,
      evidenceSummary: 'Lesson opened without recorded progress.',
    };
  }

  /**
   * Generates a personalized, adaptive learning path for a student's chosen goal.
   * Identifies prerequisites, evaluates student evidence, topologically orders the sequence,
   * skips mastered concepts, and recommends the next pedagogical step with an evidence-grounded reason.
   */
  public static async generateLearningPath(
    goalQueryOrId: string,
    allSessions: SavedLearningSessionState[] = [],
    options: {
      skippedIds?: string[];
      reviewedIds?: string[];
      customGraph?: Record<string, ConceptNode>;
    } = {}
  ): Promise<LearningPath | null> {
    const graph = options.customGraph || this.registry;
    const targetConcept = this.resolveGoalConcept(goalQueryOrId, graph);
    if (!targetConcept) return null;

    const skippedSet = new Set(options.skippedIds || []);

    // 1. Gather all transitive prerequisites
    const prereqIds = this.getTransitivePrerequisites(targetConcept.id, graph);
    const allRelevantIds = [...prereqIds, targetConcept.id];

    // 2. Order topologically
    const orderedIds = this.topologicalSort(allRelevantIds, graph);

    // 3. Build lookup of sessions by conceptId or normalized topic
    const sessionMap = new Map<string, SavedLearningSessionState>();
    for (const s of allSessions) {
      if (s.conceptId) sessionMap.set(s.conceptId.toLowerCase(), s);
      const normTopic = SessionPersistenceAdapter.normalizeTopicKey(s.primaryTopic);
      sessionMap.set(normTopic, s);
    }

    // 4. Construct path steps with mastery evaluation
    const orderedSteps: LearningPathStep[] = [];
    let completedStepsCount = 0;
    let allPrereqsMet = true;

    for (let i = 0; i < orderedIds.length; i++) {
      const cId = orderedIds[i];
      const concept = graph[cId];
      if (!concept) continue;

      const isTargetGoal = concept.id === targetConcept.id;
      const isPrereq = !isTargetGoal;

      // Find best matching session
      const matchedSession =
        sessionMap.get(concept.id.toLowerCase()) ||
        sessionMap.get(SessionPersistenceAdapter.normalizeTopicKey(concept.topicQuery)) ||
        sessionMap.get(SessionPersistenceAdapter.normalizeTopicKey(concept.title)) ||
        null;

      const mastery = this.evaluateConceptMastery(concept, matchedSession);

      const isMastered =
        mastery.state === 'demonstrated_understanding' ||
        mastery.state === 'completed' ||
        skippedSet.has(concept.id);

      if (isMastered) {
        completedStepsCount++;
      } else if (isPrereq) {
        allPrereqsMet = false;
      }

      orderedSteps.push({
        stepNumber: i + 1,
        concept,
        mastery,
        isPrerequisite: isPrereq,
        isTargetGoal,
        isRecommendedNext: false,
        recommendationReason: '',
        canSkip: isPrereq,
        canReview: mastery.state === 'needs_review' || mastery.state === 'completed',
      });
    }

    // 5. Adapt Next Recommendation based on Pedagogical Evidence
    let recommendedStep: LearningPathStep | null = null;

    // Rule A: Highest priority — if any prerequisite has "needs_review", recommend it immediately!
    for (const step of orderedSteps) {
      if (step.isPrerequisite && step.mastery.state === 'needs_review') {
        recommendedStep = step;
        step.isRecommendedNext = true;
        step.recommendationReason =
          step.mastery.needsReviewReason ||
          `Review recommended: Student struggled on prerequisite "${step.concept.title}". Reinforcing this concept will prevent confusion in subsequent topics.`;
        break;
      }
    }

    // Rule B: If no review flags, recommend the first unmastered prerequisite
    if (!recommendedStep) {
      for (const step of orderedSteps) {
        const isMastered =
          step.mastery.state === 'demonstrated_understanding' ||
          step.mastery.state === 'completed' ||
          skippedSet.has(step.concept.id);

        if (!isMastered) {
          recommendedStep = step;
          step.isRecommendedNext = true;

          if (step.isTargetGoal) {
            step.recommendationReason = allPrereqsMet
              ? `All prerequisites mastered! You have the required foundational understanding to master ${targetConcept.title}.`
              : `Target Goal: Begin learning ${targetConcept.title}.`;
          } else {
            const whyPrereq =
              targetConcept.rationaleForPrerequisite?.[step.concept.id] ||
              `Prerequisite concept required to build the foundations for ${targetConcept.title}.`;
            step.recommendationReason = `Foundational prerequisite for ${targetConcept.title}: ${whyPrereq} (Recommended next step)`;
          }
          break;
        }
      }
    }

    // Rule C: All steps completed
    if (!recommendedStep && orderedSteps.length > 0) {
      const lastStep = orderedSteps[orderedSteps.length - 1];
      lastStep.isRecommendedNext = true;
      lastStep.recommendationReason = `All curriculum prerequisites and target objectives for ${targetConcept.title} have been completed!`;
      recommendedStep = lastStep;
    }

    const summary = allPrereqsMet
      ? `Prerequisites for ${targetConcept.title} are fully satisfied.`
      : `${orderedSteps.length - completedStepsCount} prerequisite step(s) remaining before mastering ${targetConcept.title}.`;

    return {
      goalId: targetConcept.id,
      goalTitle: targetConcept.title,
      targetConcept,
      orderedSteps,
      recommendedNextStep: recommendedStep,
      totalSteps: orderedSteps.length,
      completedSteps: completedStepsCount,
      allPrerequisitesMet: allPrereqsMet,
      summary,
      generatedAt: Date.now(),
    };
  }

  // --- Goal Path Progress Persistence ---

  public static async saveGoalProgress(
    goalId: string,
    progress: {
      activeConceptId?: string;
      skippedConceptIds?: string[];
      reviewedConceptIds?: string[];
    }
  ): Promise<PersistedGoalProgress> {
    const slug = SessionPersistenceAdapter.normalizeTopicKey(goalId);
    const storageKey = `visios_goal_progress_${slug}`;

    const record: PersistedGoalProgress = {
      goalId,
      activeConceptId: progress.activeConceptId,
      skippedConceptIds: progress.skippedConceptIds || [],
      reviewedConceptIds: progress.reviewedConceptIds || [],
      updatedAt: Date.now(),
    };

    this.goalMemoryMap.set(storageKey, JSON.stringify(record));
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(storageKey, JSON.stringify(record));
      } catch (e) {
        console.warn('Failed to save goal progress to localStorage:', e);
      }
    }

    return record;
  }

  public static async getGoalProgress(goalId: string): Promise<PersistedGoalProgress | null> {
    const slug = SessionPersistenceAdapter.normalizeTopicKey(goalId);
    const storageKey = `visios_goal_progress_${slug}`;

    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage?.getItem(storageKey);
        if (item) {
          return JSON.parse(item);
        }
      } catch (e) {
        console.warn('Failed to retrieve goal progress from localStorage:', e);
      }
    }

    const memItem = this.goalMemoryMap.get(storageKey);
    if (memItem) {
      try {
        return JSON.parse(memItem);
      } catch {
        return null;
      }
    }
    return null;
  }

  public static async clearGoalProgress(goalId: string): Promise<void> {
    const slug = SessionPersistenceAdapter.normalizeTopicKey(goalId);
    const storageKey = `visios_goal_progress_${slug}`;

    this.goalMemoryMap.delete(storageKey);
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.removeItem(storageKey);
      } catch (e) {
        // ignore
      }
    }
  }
}
