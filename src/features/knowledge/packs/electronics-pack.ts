import { SubjectDefinition, TopicDefinition, ConceptDefinition, LearningResource } from '@/types/knowledge';

export const ELECTRONICS_SUBJECT: SubjectDefinition = {
  id: 'subj-electronics',
  displayName: 'Electronics & Circuit Principles',
  description: 'Foundational electronics, Ohm\'s Law, Kirchhoff voltage and current laws, and schematic networks.',
  iconName: 'Cpu',
  category: 'engineering',
  topicIds: ['topic-circuit-fundamentals'],
  recommendedStartingTopicId: 'topic-circuit-fundamentals',
  contentVersion: '1.0.0',
  publicationStatus: 'published',
};

export const ELECTRONICS_TOPICS: TopicDefinition[] = [
  {
    id: 'topic-circuit-fundamentals',
    parentSubjectId: 'subj-electronics',
    title: 'Direct Current (DC) Fundamentals & Ohm\'s Law',
    description: 'Learn electric potential (Voltage V), charge flow rate (Current I), opposition to flow (Resistance R), and power dissipation.',
    conceptIds: [
      'elec-voltage-current',
      'elec-ohms-law',
      'elec-series-parallel',
    ],
    learningObjectives: [
      'Define electric potential difference in Volts (V) and current in Amperes (A)',
      'Calculate electrical parameters using Ohm\'s Law V = I × R',
      'Analyze equivalent resistance in series (R_eq = R1 + R2) vs parallel networks',
    ],
    difficultyLevel: 'introductory',
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const ELECTRONICS_CONCEPTS: ConceptDefinition[] = [
  {
    id: 'elec-voltage-current',
    parentTopicId: 'topic-circuit-fundamentals',
    title: 'Electric Potential (Voltage) & Current Flow',
    description: 'Voltage provides the electrical pressure pushing electrons, while current measures the charge flow in Amperes (1 A = 1 C/s).',
    difficultyLevel: 'introductory',
    estimatedMinutes: 6,
    prerequisiteConceptIds: [],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: '2d.whiteboard',
    learningObjectives: [
      'Distinguish potential difference (Volts) from flow rate (Amperes)',
      'Understand conventional current (positive to negative) vs electron flow',
    ],
    knowledgeCheck: {
      question: 'What physical quantity does 1 Ampere (A) of electric current represent?',
      options: [
        '1 Coulomb of charge passing a point per second',
        '1 Joule of potential energy per Coulomb',
        '1 Ohm of resistance',
        '1 Watt of thermal loss',
      ],
      correctIndex: 0,
      explanation: 'Electric current is the charge flow rate: 1 Ampere = 1 Coulomb per second (I = Q / t).',
      hint: 'Current is rate of flow.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'elec-ohms-law',
    parentTopicId: 'topic-circuit-fundamentals',
    title: 'Ohm\'s Law: V = I × R',
    description: 'The fundamental linear relationship stating that current through a conductor is proportional to voltage and inversely proportional to resistance.',
    difficultyLevel: 'introductory',
    estimatedMinutes: 8,
    prerequisiteConceptIds: ['elec-voltage-current'],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: '2d.whiteboard',
    learningObjectives: [
      'Calculate current I = V / R for known voltage and resistance',
      'Calculate electrical power dissipation P = V × I = I²R',
    ],
    knowledgeCheck: {
      question: 'If a 12V battery is connected across a 4Ω resistor, what current flows through the circuit?',
      options: ['3 Amperes', '48 Amperes', '0.33 Amperes', '16 Amperes'],
      correctIndex: 0,
      explanation: 'Using Ohm\'s Law: I = V / R = 12V / 4Ω = 3A.',
      hint: 'Divide voltage by resistance.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'elec-series-parallel',
    parentTopicId: 'topic-circuit-fundamentals',
    title: 'Series & Parallel Resistor Networks',
    description: 'Determine equivalent resistance for components connected along a single path (Series) vs branched paths (Parallel).',
    difficultyLevel: 'intermediate',
    estimatedMinutes: 10,
    prerequisiteConceptIds: ['elec-ohms-law'],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: 'electronics.circuit_sim', // Marked as planned simulation capability
    learningObjectives: [
      'Calculate series total resistance R_total = R1 + R2',
      'Calculate parallel equivalent resistance 1/R_eq = 1/R1 + 1/R2',
    ],
    knowledgeCheck: {
      question: 'Two 10Ω resistors are connected in parallel. What is the equivalent resistance of the network?',
      options: ['5Ω', '20Ω', '10Ω', '100Ω'],
      correctIndex: 0,
      explanation: 'For identical parallel resistors: R_eq = R / 2 = 10Ω / 2 = 5Ω.',
      hint: 'Adding parallel branches provides more paths for current, reducing total resistance.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const ELECTRONICS_RESOURCES: LearningResource[] = [
  {
    id: 'res-circuit-sim',
    resourceType: 'simulation',
    associatedConceptIds: ['elec-voltage-current', 'elec-ohms-law', 'elec-series-parallel'],
    title: 'Interactive Circuit Schematic Simulator (SPICE Engine)',
    description: 'Numerical DC/AC circuit simulator with real-time oscilloscopes (Planned for future release).',
    requiredCapability: 'electronics.circuit_sim',
    capabilityStatus: 'planned', // Explicitly marked as planned per Milestone 10 specification
    contentVersion: '1.0.0',
  },
];

