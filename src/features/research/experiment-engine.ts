/**
 * VisiOS Milestone 19 — Research Experiment Protocols & Engine
 * Rigorous A/B Experimental Protocols for Evaluating Adaptive vs. Fixed Visual Learning
 */

import { ExperimentProtocol, DiagnosticQuestion } from '@/types/research';
import { DIAGNOSTIC_QUESTION_BANK } from '../adaptive/misconception-catalog';

export const RESEARCH_PROTOCOLS: ExperimentProtocol[] = [
  {
    experimentId: 'exp-phys-pendulum',
    version: '1.0.0',
    title: 'Adaptive Visual Dynamics vs Fixed Sequence in Nonlinear Oscillations',
    researchQuestion:
      'Does evidence-driven selection of visual interventions (phase portraits, parameter sweeps) improve immediate conceptual gain in nonlinear pendulum dynamics compared with a fixed linear sequence?',
    hypothesis:
      'Learners receiving adaptive visual interventions tailored to detected misconceptions and mastery states will achieve higher normalized learning gain (g > 0.40) than learners following a fixed linear sequence.',
    targetConceptId: 'phys-pendulum-nonlinear',
    subjectId: 'physics',
    eligibleParticipantCriteria: [
      'Undergraduate or secondary physics students',
      'Basic familiarity with trigonometric functions and harmonic motion',
      'Informed research consent provided',
    ],
    requiredPriorKnowledge: ['Conservation of mechanical energy', 'Small-angle linear formula T = 2π√(L/g)'],
    preTestQuestions: [
      DIAGNOSTIC_QUESTION_BANK[0], // diag-phys-01: Mass independence
      DIAGNOSTIC_QUESTION_BANK[1], // diag-phys-02: Small-angle breakdown
      DIAGNOSTIC_QUESTION_BANK[2], // diag-phys-03: Phase space damping
    ],
    postTestQuestions: [
      // Post-test mirrors isomorphic conceptual structures
      {
        id: 'post-phys-01',
        conceptId: 'phys-pendulum-period',
        learningObjective: 'Identify the physical parameters that determine pendulum oscillation period',
        difficulty: 'beginner',
        question: 'A student claims that replacing a 50g brass bob with a 200g lead bob will make a 1m pendulum swing four times slower. Is this claim physically valid?',
        options: [
          'No, the period remains identical because gravitational acceleration is mass-independent',
          'Yes, because period is proportional to mass (T ∝ m)',
          'Yes, because heavier objects have more inertia',
          'No, but only if the pendulum is placed in a vacuum',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          1: 'misconception-mass-period',
          2: 'misconception-mass-period',
        },
        explanations: [
          'Correct! Gravitational and inertial mass cancel, leaving period purely a function of length and g.',
          'Incorrect. Mass does not appear in the governing differential equation d²θ/dt² + (g/L)sin(θ) = 0.',
          'Incorrect. Inertia resists acceleration in exact proportion to the increased gravitational force.',
          'Incorrect. Mass independence holds regardless of medium, assuming negligible air drag.',
        ],
        author: 'VisiOS Research Physics Group',
        version: '1.0.0',
      },
      {
        id: 'post-phys-02',
        conceptId: 'phys-pendulum-nonlinear',
        learningObjective: 'Evaluate breakdown of small-angle approximation at large amplitudes',
        difficulty: 'intermediate',
        question: 'When releasing a simple pendulum from θ₀ = 70°, the actual measured period is approximately 10% longer than 2π√(L/g). What causes this discrepancy?',
        options: [
          'At 70°, sin(θ) is strictly less than θ in radians, resulting in a weaker restoring torque than the linear model assumes',
          'At 70°, the cord stretches under centrifugal force, physically lengthening the pendulum',
          'Air friction increases by a factor of 10 at high angles',
          'Gravitational acceleration g decreases at high altitudes during the swing arc',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          1: 'misconception-amplitude-invariance',
          2: 'misconception-amplitude-invariance',
        },
        explanations: [
          'Correct! The true restoring torque τ = -mgL sin(θ) grows slower than the linear approximation τ_linear = -mgL θ.',
          'Incorrect. An ideal pendulum assumes an inextensible cord; the effect is purely geometrical/trigonometric.',
          'Incorrect. Nonlinear period elongation occurs even in frictionless, zero-drag environments.',
          'Incorrect. Variations in g over a fraction of a meter are negligible (10⁻⁷).',
        ],
        author: 'VisiOS Research Physics Group',
        version: '1.0.0',
      },
      {
        id: 'post-phys-03',
        conceptId: 'phys-pendulum-damping',
        learningObjective: 'Interpret phase space trajectory evolution in damped mechanical systems',
        difficulty: 'advanced',
        question: 'When analyzing a phase space portrait with coordinate axes angle θ (horizontal) and angular velocity ω (vertical), what does a spiral trajectory converging toward (0,0) demonstrate?',
        options: [
          'Continuous energy dissipation due to non-conservative damping forces',
          'Resonant amplification of oscillation amplitude',
          'Strict conservation of kinetic plus potential energy',
          'Chaotic divergence to infinity',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          2: 'misconception-damping-frequency',
        },
        explanations: [
          'Correct! The decrease in phase space orbital radius directly maps the decay of total mechanical energy E(t).',
          'Incorrect. Resonant amplification causes outward spiraling.',
          'Incorrect. Energy conservation yields constant-energy closed contour orbits, not inward spirals.',
          'Incorrect. Convergence to a fixed point is the hallmark of stable dissipative systems.',
        ],
        author: 'VisiOS Research Physics Group',
        version: '1.0.0',
      },
    ],
    interventionConditionId: 'adaptive_intervention',
    controlConditionId: 'fixed_sequence',
    targetDurationMinutes: 15,
    primaryOutcome: 'Normalized Learning Gain: g = (PostScore - PreScore) / (100 - PreScore)',
    secondaryOutcomes: [
      'Task completion rate (%)',
      'Time-on-task (minutes)',
      'Hint requests per participant',
      'Usability clarity rating (1-5 Likert scale)',
    ],
    exclusionCriteria: [
      'Sessions where participant completed fewer than 50% of learning steps',
      'Pre-test score = 100% (ceiling effect with zero potential gain)',
      'Session duration < 2 minutes (suspected random clicking)',
    ],
    plannedSampleSize: 30,
    createdAt: Date.now(),
  },

  // CS: Binary Search Trees Protocol
  {
    experimentId: 'exp-cs-bst',
    version: '1.0.0',
    title: 'Adaptive Misconception Remediation in Binary Search Tree Invariants',
    researchQuestion:
      'Does targeted misconception remediation (distinguishing BSTs from Heaps and addressing degeneracy) yield superior retention of algorithmic complexity compared to fixed text walkthroughs?',
    hypothesis:
      'Students exposed to adaptive diagnostic feedback will accurately diagnose tree degeneracy and ordering invariants with >85% post-test accuracy.',
    targetConceptId: 'cs-bst-invariants',
    subjectId: 'computer_science',
    eligibleParticipantCriteria: [
      'Introductory Computer Science or Data Structures students',
      'Basic knowledge of binary trees and asymptotic notation',
      'Informed research consent provided',
    ],
    requiredPriorKnowledge: ['Pointers/references', 'Big-O notation basics'],
    preTestQuestions: [
      DIAGNOSTIC_QUESTION_BANK[3], // diag-cs-01: BST invariant vs Heap
      DIAGNOSTIC_QUESTION_BANK[4], // diag-cs-02: Degenerate tree O(n)
    ],
    postTestQuestions: [
      {
        id: 'post-cs-01',
        conceptId: 'cs-bst-invariants',
        learningObjective: 'Differentiate Binary Search Tree invariants from Heap properties',
        difficulty: 'beginner',
        question: 'Suppose a binary tree has root 40. The left child is 20, and the right child of 20 is 45. Does this tree satisfy the BST invariant?',
        options: [
          'No, because 45 is in the left subtree of 40, violating the rule that all nodes in the left subtree must be < 40',
          'Yes, because 45 is greater than its immediate parent 20',
          'Yes, because binary trees only check immediate parent-child relationships',
          'No, because 20 is smaller than 40',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          1: 'misconception-bst-heap',
          2: 'misconception-bst-heap',
        },
        explanations: [
          'Correct! The BST property applies globally to all descendants in the left subtree.',
          'Incorrect. Even though 45 > 20, it is on the left side of root 40, which is invalid.',
          'Incorrect. BST properties are recursive across entire subtrees.',
          'Incorrect. Having a left child 20 < 40 is valid.',
        ],
        author: 'VisiOS Research CS Group',
        version: '1.0.0',
      },
      {
        id: 'post-cs-02',
        conceptId: 'cs-bst-complexity',
        learningObjective: 'Analyze worst-case search complexity in unbalanced BSTs',
        difficulty: 'intermediate',
        question: 'What is the required structural condition to guarantee that search, insertion, and deletion in a BST execute in O(log n) time?',
        options: [
          'The height of the tree must remain bounded by O(log n) through balance mechanisms (e.g. AVL/Red-Black)',
          'All nodes must contain even numbers',
          'The tree must be completely converted into a sorted array',
          'Keys must be inserted in strictly descending order',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          3: 'misconception-unbalanced-lookup',
        },
        explanations: [
          'Correct! Operations run in O(h) where h is tree height; bounding h = O(log n) ensures logarithmic performance.',
          'Incorrect. Node values have no bearing on asymptotic complexity.',
          'Incorrect. Array conversion changes the underlying data structure.',
          'Incorrect. Strictly descending insertion creates a left-skewed chain with worst-case O(n) height.',
        ],
        author: 'VisiOS Research CS Group',
        version: '1.0.0',
      },
    ],
    interventionConditionId: 'adaptive_intervention',
    controlConditionId: 'fixed_sequence',
    targetDurationMinutes: 10,
    primaryOutcome: 'Normalized Learning Gain: g = (PostScore - PreScore) / (100 - PreScore)',
    secondaryOutcomes: ['Misconception remediation rate', 'Time on task'],
    exclusionCriteria: ['Pre-test score = 100%', 'Time spent < 1 minute'],
    plannedSampleSize: 25,
    createdAt: Date.now(),
  },

  // Electronics: RLC Resonance Protocol
  {
    experimentId: 'exp-elec-rlc',
    version: '1.0.0',
    title: 'Adaptive Frequency Response vs Static Schematics in RLC Circuit Resonance',
    researchQuestion:
      'Does interactive parameter tuning of L, C, and R in an adaptive simulation improve understanding of resonance frequency independence from resistance compared to static formulas?',
    hypothesis:
      'Adaptive visualization will eliminate the resistance-frequency coupling fallacy in >90% of participating students.',
    targetConceptId: 'elec-rlc-resonance',
    subjectId: 'electronics',
    eligibleParticipantCriteria: [
      'Engineering, physics, or electronics students',
      'Familiarity with Ohm’s law and AC reactive impedance',
      'Informed research consent provided',
    ],
    requiredPriorKnowledge: ['Impedance Z = R + j(ωL - 1/ωC)'],
    preTestQuestions: [
      DIAGNOSTIC_QUESTION_BANK[5], // diag-elec-01: Resonance independent of R
      DIAGNOSTIC_QUESTION_BANK[6], // diag-elec-02: Q-factor and bandwidth
    ],
    postTestQuestions: [
      {
        id: 'post-elec-01',
        conceptId: 'elec-rlc-resonance',
        learningObjective: 'Analyze resonant frequency parameter dependencies in series RLC circuits',
        difficulty: 'beginner',
        question: 'You double the resistance R in a series RLC circuit from 20 Ω to 40 Ω, leaving L = 5 mH and C = 50 μF unchanged. How does the resonant frequency f₀ change?',
        options: [
          'f₀ remains completely unchanged at 1 / (2π√(LC))',
          'f₀ doubles',
          'f₀ is cut in half',
          'f₀ shifts upward by 20%',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          1: 'misconception-resonance-resistance',
          2: 'misconception-resonance-resistance',
          3: 'misconception-resonance-resistance',
        },
        explanations: [
          'Correct! The condition for resonance is X_L = X_C => ω₀ = 1/√(LC), which is entirely independent of resistance R.',
          'Incorrect. Resistance dictates damping and Q-factor, but does not alter natural resonant frequency.',
          'Incorrect. Resistance does not enter the resonant frequency equation.',
          'Incorrect. The resonance peak amplitude decreases, but the frequency location remains fixed.',
        ],
        author: 'VisiOS Research Electronics Group',
        version: '1.0.0',
      },
      {
        id: 'post-elec-02',
        conceptId: 'elec-rlc-quality',
        learningObjective: 'Evaluate relationship between Q-factor and frequency selectivity',
        difficulty: 'intermediate',
        question: 'A high-Q radio tuner circuit is designed to separate two close radio broadcast stations. Why is a high Quality Factor desirable for this application?',
        options: [
          'A high Q produces a narrow bandwidth, allowing the tuner to reject neighboring frequencies while passing the desired carrier',
          'A high Q widens the passband so multiple stations can be heard simultaneously',
          'A high Q eliminates the need for an antenna',
          'A high Q reduces the power supply voltage to zero',
        ],
        correctIndex: 0,
        distractorMisconceptions: {
          1: 'misconception-q-factor-bandwidth',
        },
        explanations: [
          'Correct! Selectivity is proportional to Q (Δf = f₀/Q). Higher Q produces sharp peak selectivity.',
          'Incorrect. Wide passbands correspond to low Q circuits with poor selectivity.',
          'Incorrect. Tuners still require electromagnetic signal reception.',
          'Incorrect. Q is a dimensionless ratio of stored to dissipated energy per cycle.',
        ],
        author: 'VisiOS Research Electronics Group',
        version: '1.0.0',
      },
    ],
    interventionConditionId: 'adaptive_intervention',
    controlConditionId: 'fixed_sequence',
    targetDurationMinutes: 12,
    primaryOutcome: 'Normalized Learning Gain: g = (PostScore - PreScore) / (100 - PreScore)',
    secondaryOutcomes: ['Bandwidth calculation accuracy', 'Clarity rating'],
    exclusionCriteria: ['Pre-test score = 100%'],
    plannedSampleSize: 20,
    createdAt: Date.now(),
  },
];

