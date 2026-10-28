import { SubjectDefinition, TopicDefinition, ConceptDefinition, LearningResource } from '@/types/knowledge';

export const CS_SUBJECT: SubjectDefinition = {
  id: 'subj-cs',
  displayName: 'Computer Science & Data Structures',
  description: 'Linear and hierarchical data structures, memory layouts, pointers, and computational complexity.',
  iconName: 'Binary',
  category: 'formal_sciences',
  topicIds: ['topic-arrays-memory'],
  recommendedStartingTopicId: 'topic-arrays-memory',
  contentVersion: '1.0.0',
  publicationStatus: 'published',
};

export const CS_TOPICS: TopicDefinition[] = [
  {
    id: 'topic-arrays-memory',
    parentSubjectId: 'subj-cs',
    title: 'Linear Data Structures: Memory & Arrays',
    description: 'Explore contiguous RAM allocation, zero-indexed pointer offsets, constant-time indexing O(1), and dynamic array amortization.',
    conceptIds: [
      'cs-memory-addresses',
      'cs-array-indexing',
      'cs-dynamic-arrays',
    ],
    learningObjectives: [
      'Understand contiguous memory byte layouts',
      'Derive address formula: Address(A[i]) = BaseAddress + i × ElementSize',
      'Analyze O(1) random access vs O(n) insertion time complexities',
    ],
    difficultyLevel: 'introductory',
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const CS_CONCEPTS: ConceptDefinition[] = [
  {
    id: 'cs-memory-addresses',
    parentTopicId: 'topic-arrays-memory',
    title: 'Linear Memory & Byte Addressing',
    description: 'Computer memory (RAM) is modeled as a massive contiguous sequence of indexed byte addresses.',
    difficultyLevel: 'introductory',
    estimatedMinutes: 6,
    prerequisiteConceptIds: [],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: 'cs.array_pointer_visualizer',
    learningObjectives: [
      'Define byte addressing in linear RAM',
      'Understand how data types occupy fixed byte widths (e.g. 4 bytes for 32-bit integer)',
    ],
    knowledgeCheck: {
      question: 'Why must memory be addressed contiguously for an array to function?',
      options: [
        'To allow instant index calculation using simple pointer multiplication',
        'Because computers only store strings',
        'To prevent the computer from overheating',
        'Because memory addresses must be odd numbers',
      ],
      correctIndex: 0,
      explanation: 'Contiguity allows the CPU to calculate any element address in O(1) time without traversing intermediate nodes.',
      hint: 'Think about how hardware calculates Base + i * Size.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'cs-array-indexing',
    parentTopicId: 'topic-arrays-memory',
    title: 'Array Indexing & O(1) Random Access',
    description: 'Calculate item addresses in constant time O(1) via base offset arithmetic without iterative scanning.',
    difficultyLevel: 'introductory',
    estimatedMinutes: 8,
    prerequisiteConceptIds: ['cs-memory-addresses'],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: 'cs.array_pointer_visualizer',
    learningObjectives: [
      'Apply formula Address = Base + (Index × Size)',
      'Distinguish O(1) lookup speed from O(N) linear search',
    ],
    knowledgeCheck: {
      question: 'If an integer array starts at address 1000 and each integer occupies 4 bytes, what is the memory address of index 3 (A[3])?',
      options: ['1012', '1003', '1004', '1016'],
      correctIndex: 0,
      explanation: 'Address = 1000 + (3 × 4) = 1000 + 12 = 1012.',
      hint: 'Multiply the index (3) by element size (4) and add to base (1000).',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
  {
    id: 'cs-dynamic-arrays',
    parentTopicId: 'topic-arrays-memory',
    title: 'Dynamic Array Resizing & Amortized Cost',
    description: 'Understand geometric capacity doubling (2× capacity) when appending elements to maintain O(1) amortized insertion time.',
    difficultyLevel: 'intermediate',
    estimatedMinutes: 10,
    prerequisiteConceptIds: ['cs-array-indexing'],
    supportedVisualizations: ['diagram', 'note'],
    requiredCapability: 'cs.array_pointer_visualizer',
    learningObjectives: [
      'Understand capacity vs size in dynamic arrays',
      'Explain why geometric growth achieves O(1) amortized append time rather than O(N)',
    ],
    knowledgeCheck: {
      question: 'Why do dynamic array implementations double capacity (2×) rather than incrementing capacity by 1 on each overflow?',
      options: [
        'To achieve O(1) amortized append time rather than O(N²) reallocation thrashing',
        'Because memory chips only hold powers of 2',
        'To prevent garbage collection',
        'Because arrays cannot hold odd numbers of items',
      ],
      correctIndex: 0,
      explanation: 'Doubling capacity spreads out the expensive O(N) reallocation cost over N subsequent insertions, yielding O(1) amortized time.',
      hint: 'Think about how often you would copy the array if you only added 1 slot each time.',
    },
    contentVersion: '1.0.0',
    publicationStatus: 'published',
  },
];

export const CS_RESOURCES: LearningResource[] = [
  {
    id: 'res-cs-array-viz',
    resourceType: 'diagram',
    associatedConceptIds: ['cs-memory-addresses', 'cs-array-indexing', 'cs-dynamic-arrays'],
    title: 'Interactive Memory & Array Pointer Visualizer',
    description: 'Visual step-by-step block memory inspector tracking index offsets and array resizing.',
    requiredCapability: 'cs.array_pointer_visualizer',
    capabilityStatus: 'available',
    contentVersion: '1.0.0',
  },
];

