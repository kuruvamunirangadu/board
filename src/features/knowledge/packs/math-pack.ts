import { SubjectDefinition, TopicDefinition, ConceptDefinition, LearningResource } from '@/types/knowledge';

export const MATH_SUBJECT: SubjectDefinition = {
  id: 'subj-math',
  displayName: 'Mathematics & Coordinate Geometry',
  description: 'Visual coordinate spaces, functional analysis, geometric constructions, and wave harmonics.',
  iconName: 'Compass',
  category: 'formal_sciences',
  topicIds: ['topic-cartesian-functions'],
  recommendedStartingTopicId: 'topic-cartesian-functions',
  contentVersion: '1.0.0',
  publicationStatus: 'published',
};

export const MATH_TOPICS: TopicDefinition[] = [
  {
    id: 'topic-cartesian-functions',
    parentSubjectId: 'subj-math',
    title: 'Coordinate Geometry & Functional Analysis',
    description: 'Master the 2D Cartesian plane, functional mappings y = f(x), slope gradients, and harmonic trigonometric curves.',
    conceptIds: [
      'math-cartesian-plane',
      'math-linear-functions',
      'math-quadratic-curves',
      'math-trig-harmonics',
    ],
    learningObjectives: [
      'Plot coordinates (x, y) across 4 quadrants on an orthogonal cartesian grid',
      'Calculate linear gradient slope m = Δy / Δx and y-intercept b',
      'Identify parabolic vertices and roots in quadratic equations',
      'Map periodic sinusoids f(t) = A·sin(ωt + φ) to physical oscillations',
    ],
    difficultyLevel: 'introductory',
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const MATH_CONCEPTS: ConceptDefinition[] = [
  {
    id: 'math-cartesian-plane',
    parentTopicId: 'topic-cartesian-functions',
    title: 'The 2D Cartesian Coordinate System',
    description: 'Understand perpendicular X (horizontal) and Y (vertical) axes intersecting at the origin (0, 0).',
    difficultyLevel: 'introductory',
    estimatedMinutes: 6,
    prerequisiteConceptIds: [],
    supportedVisualizations: ['diagram', 'chart'],
    requiredCapability: 'math.coordinate_graph',
    learningObjectives: [
      'Locate the origin point (0, 0)',
      'Identify positive and negative coordinate quadrants',
    ],
    knowledgeCheck: {
      question: 'In which quadrant is a point with coordinates (-3, 4) located?',
      options: ['Quadrant II (Top-Left)', 'Quadrant I (Top-Right)', 'Quadrant III (Bottom-Left)', 'Quadrant IV (Bottom-Right)'],
      correctIndex: 0,
      explanation: 'Negative X with positive Y lies in Quadrant II (top-left).',
      hint: 'X is negative (left), Y is positive (up).',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'math-linear-functions',
    parentTopicId: 'topic-cartesian-functions',
    title: 'Linear Functions & Gradient Slope',
    description: 'Analyze equations of the form y = mx + b, where m represents rate of change and b represents y-intercept.',
    difficultyLevel: 'introductory',
    estimatedMinutes: 8,
    prerequisiteConceptIds: ['math-cartesian-plane'],
    supportedVisualizations: ['diagram', 'chart'],
    requiredCapability: 'math.coordinate_graph',
    learningObjectives: [
      'Calculate slope m = (y2 - y1) / (x2 - x1)',
      'Interpret slope direction (positive vs negative rate of change)',
    ],
    knowledgeCheck: {
      question: 'What is the slope m of a line passing through (0, 2) and (4, 10)?',
      options: ['m = 2', 'm = 4', 'm = 0.5', 'm = 8'],
      correctIndex: 0,
      explanation: 'm = (10 - 2) / (4 - 0) = 8 / 4 = 2.',
      hint: 'Divide the change in Y (Δy) by the change in X (Δx).',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'math-quadratic-curves',
    parentTopicId: 'topic-cartesian-functions',
    title: 'Quadratic Functions & Parabolic Vertices',
    description: 'Explore second-degree polynomials f(x) = ax² + bx + c and calculate vertex extrema and axis of symmetry.',
    difficultyLevel: 'intermediate',
    estimatedMinutes: 10,
    prerequisiteConceptIds: ['math-linear-functions'],
    supportedVisualizations: ['chart', 'diagram'],
    requiredCapability: 'math.coordinate_graph',
    learningObjectives: [
      'Determine parabola curvature from coefficient a (a > 0 opens upward)',
      'Locate vertex at x = -b / (2a)',
    ],
    knowledgeCheck: {
      question: 'If the leading coefficient a in y = ax² is positive (a > 0), does the vertex represent a minimum or maximum point?',
      options: ['Global Minimum', 'Global Maximum', 'Inflection point', 'Zero slope asymptote'],
      correctIndex: 0,
      explanation: 'When a > 0, the parabola opens upward like a cup, making the vertex the lowest (minimum) point.',
      hint: 'Sketch an upward-opening curve.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'math-trig-harmonics',
    parentTopicId: 'topic-cartesian-functions',
    title: 'Trigonometric Sinusoids & Wave Functions',
    description: 'Connect angle rotations on the unit circle to wave functions f(t) = A·sin(ωt), linking geometry directly to physical oscillations.',
    difficultyLevel: 'intermediate',
    estimatedMinutes: 12,
    prerequisiteConceptIds: ['math-cartesian-plane'],
    supportedVisualizations: ['chart', 'simulation'],
    requiredCapability: 'math.coordinate_graph',
    learningObjectives: [
      'Define wave amplitude A and angular frequency ω = 2πf',
      'Demonstrate that sinusoidal wave projections map to harmonic physical motion',
    ],
    knowledgeCheck: {
      question: 'For the function y = 5·sin(2t), what is the maximum peak amplitude of the wave?',
      options: ['5', '2', '10', '2.5'],
      correctIndex: 0,
      explanation: 'The multiplier before the sine function represents peak amplitude A = 5.',
      hint: 'The sine function ranges from -1 to +1.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const MATH_RESOURCES: LearningResource[] = [
  {
    id: 'res-math-grapher',
    resourceType: 'graph',
    associatedConceptIds: ['math-cartesian-plane', 'math-linear-functions', 'math-quadratic-curves', 'math-trig-harmonics'],
    title: 'Cartesian Coordinate & Function Grapher',
    description: 'Visual 2D coordinate plane rendering functions, vectors, and tangent slopes.',
    requiredCapability: 'math.coordinate_graph',
    capabilityStatus: 'available',
    contentVersion: '1.0.0',
  },
];

