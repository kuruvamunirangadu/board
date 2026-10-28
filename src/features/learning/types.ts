/**
 * VisiOS — Universal Learning Intelligence Engine: Type Definitions
 */

import { ExperimentSessionState } from '@/features/experiment/ExperimentTypes';

export type InputCategory =
  | 'algebra'
  | 'calculus'
  | 'physics'
  | 'geometry'
  | 'algorithm'
  | 'chemistry'
  | 'biology'
  | 'concept';

export type CapabilityLevel =
  | 'verified_and_tested'
  | 'partial_with_limitations'
  | 'ai_proposed_unverified'
  | 'unsupported';

export interface VariableDescriptor {
  symbol: string;
  name: string;
  unit?: string;
  dimension?: string;
  description?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface InputInterpretation {
  originalInput: string;
  normalizedInput: string;
  category: InputCategory;
  subject: string;
  title: string;
  summary: string;
  variables: VariableDescriptor[];
  prerequisites: string[];
  isAmbiguous: boolean;
  ambiguityReason?: string;
  clarificationOptions?: { label: string; interpretation: string }[];
  confidence: number;
}

export interface DerivationStep {
  stepNumber: number;
  expression: string;
  explanation: string;
  rationale: string;
  assumptionsRequired?: string[];
  verificationStatus: 'formally_verified' | 'curriculum_trusted' | 'heuristic_approximate';
}

export interface WorkedExample {
  title: string;
  problemStatement: string;
  givenValues: Record<string, number | string>;
  stepByStepSolution: string[];
  finalAnswer: string;
}

export type RendererType =
  | 'formula_geometric_dissection'
  | 'physics_vector_simulator'
  | 'function_coordinate_plotter'
  | 'geometric_triangle_construction'
  | 'algorithm_array_tracer'
  | 'model3d_viewer'
  | 'pendulum_simulation'
  | 'svg_schematic_fallback'
  | 'what_if_scenario'
  | 'none'
  | 'algorithm_trace'
  | 'diagram'
  | 'graph'
  | 'simulation'
  | '3d';

export interface VisualizationPlan {
  rendererType: RendererType;
  title: string;
  description: string;
  learningObjective: string;
  activeVariables: string[];
  interactionsAvailable: string[];
  expectedBehavior: string;
  fallbackAvailable: boolean;
  modelConfig?: Record<string, any>;
}

export interface InteractiveParameter {
  id: string;
  symbol: string;
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  type?: 'slider' | 'number' | 'toggle';
}

export interface InteractiveExperimentState {
  parameters: Record<string, number>;
  calculatedOutputs: Record<string, number | string>;
  outputFormulas: Record<string, string>;
  graphPoints?: { x: number; y: number }[];
  statusMessage: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  misconceptionAlert?: string;
  hint: string;
}

export interface SourceAttribution {
  source: string;
  title?: string;
  extract?: string;
  url?: string;
  thumbnail?: string | null;
  license?: string;
  retrievalTimestamp?: number;
}

export interface ImportantTerminology {
  term: string;
  definition: string;
}

export interface UncertaintyState {
  isUncertain: boolean;
  reason?: string;
  suggestedClarifications?: string[];
}

export interface LearningPlan {
  conceptId: string;
  title: string;
  category: InputCategory;
  subject: string;
  capabilityLevel: CapabilityLevel;
  disclosures: string[];
  sourceAttribution?: SourceAttribution;
  terminology?: ImportantTerminology[];
  learningObjectives?: string[];
  uncertaintyState?: UncertaintyState;

  // 1. Understand
  overview: string;
  motivation: string;
  prerequisites: string[];
  variables: VariableDescriptor[];
  assumptions: string[];

  // 2. Derive
  derivationSteps: DerivationStep[];
  derivationSummary: string;
  symbolicVerificationNote: string;

  // 3. Visualize
  visualizationPlan: VisualizationPlan;

  // 4. Experiment
  interactiveParameters: InteractiveParameter[];
  defaultExperimentState: InteractiveExperimentState;

  // 5. Master
  workedExamples: WorkedExample[];
  applications: string[];
  limitations: string[];
  practiceQuestions: PracticeQuestion[];
  recommendedNextConcepts: string[];

  // Step 3: Topic Classification & Routing Metadata
  classification?: TopicClassificationResult;

  // Step 8: Multi-Subject Knowledge Registry Metadata
  subjectId?: string;
  subjectDefinition?: any;
  learningStrategy?: any;
}

export type TopicDomain =
  | 'computer_science'
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'history'
  | 'general_knowledge'
  | 'other';

export type TopicIntent =
  | 'concept_learning'
  | 'formula_explanation'
  | 'derivation'
  | 'algorithm_learning'
  | 'factual_lookup'
  | 'interactive_simulation'
  | 'ambiguous_query';

export type TargetEngine =
  | 'math'
  | 'algorithm'
  | 'knowledge'
  | 'simulation'
  | 'local_ai'
  | 'clarification';

export interface TopicClassificationResult {
  originalQuery: string;
  domain: TopicDomain;
  intent: TopicIntent;
  engine: TargetEngine;
  confidence: number;
  requiresClarification: boolean;
  reason: string;
  suggestedClarifications?: string[];
}

// =========================================================================
// STEP 5: GUIDED LEARNING & INTERACTIVE ENGINE TYPES
// =========================================================================

export type GuidedLessonStep =
  | 'concept_meaning'
  | 'why_it_matters'
  | 'prerequisites'
  | 'step_by_step'
  | 'worked_example'
  | 'interactive_exploration'
  | 'practice_exercise'
  | 'recap';

export interface GuidedLessonStepDefinition {
  step: GuidedLessonStep;
  number: number;
  title: string;
  subtitle: string;
  summary: string;
}

export interface PracticeExerciseFeedback {
  isCorrect: boolean;
  score: number;
  explanation: string;
  misconceptionAlert?: string;
  hint?: string;
  retryAllowed: boolean;
}

export interface GuidedLearningSession {
  topic: string;
  conceptId: string;
  currentStep: GuidedLessonStep;
  completedSteps: GuidedLessonStep[];
  steps: GuidedLessonStepDefinition[];
  isCompleted: boolean;
}

export interface BinarySearchStep {
  stepIndex: number;
  low: number;
  high: number;
  mid: number;
  midVal?: number;
  target: number;
  comparison: 'equal' | 'less' | 'greater' | 'not_found' | 'empty_array';
  explanation: string;
  rangeSize: number;
  isTerminal: boolean;
  foundIndex?: number;
}

export interface BinarySearchState {
  array: number[];
  target: number;
  currentStepIndex: number;
  steps: BinarySearchStep[];
  isPlaying: boolean;
  isComplete: boolean;
  foundIndex?: number;
}

export type DataStructureType = 'array' | 'stack' | 'queue' | 'linked_list';

export interface DataStructureState {
  structureType: DataStructureType;
  elements: Array<{ id: string; value: number | string; label?: string }>;
  highlightedIndices: number[];
  lastOperation?: string;
  operationLog: string[];
  timeComplexity: string;
}

export type SaveSessionStatus = 'saved' | 'saving' | 'error';

export interface SavedLearningSessionState {
  schemaVersion: number;
  id: string;
  primaryTopic: string;
  domain?: string;
  conceptId?: string;
  responseId?: string;
  capabilityId?: string;
  engineId?: string;
  currentLessonStep: GuidedLessonStep;
  completedSteps: GuidedLessonStep[];
  activeTab: 'understand' | 'derive' | 'visualize' | 'experiment' | 'master';
  isGuidedMode: boolean;
  isCompleted: boolean;
  practiceAttempts?: {
    multipleChoice?: {
      selectedIndex: number;
      isCorrect: boolean;
      score: number;
      explanation?: string;
      misconceptionAlert?: string;
      attemptedAt: number;
    };
    shortAnswer?: {
      rawInput: string;
      isCorrect: boolean;
      score: number;
      explanation?: string;
      hint?: string;
      attemptedAt: number;
    };
    totalScore?: number;
  };
  simulationState?: {
    parameters: Record<string, number>;
    activeRenderer?: string;
    lastOperation?: string;
    calculatedResult?: string | number;
  };
  experimentLabState?: ExperimentSessionState;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
}

// =========================================================================
// STEP 7: ADAPTIVE LEARNING PATHS & CONCEPT DEPENDENCY TYPES
// =========================================================================

export type ConceptDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type ConceptMasteryState =
  | 'not_started'
  | 'in_progress'
  | 'needs_review'
  | 'demonstrated_understanding'
  | 'completed';

export interface ConceptDiagnosticQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface ConceptNode {
  id: string;
  title: string;
  domain: string;
  topic: string;
  topicQuery: string;
  prerequisiteIds: string[];
  objectives: string[];
  difficulty: ConceptDifficulty;
  estimatedMinutes: number;
  masteryCriteria: {
    minScore: number;
    minCompletedSteps?: number;
  };
  diagnosticQuestion?: ConceptDiagnosticQuestion;
  reviewTopicQuery?: string;
  rationaleForPrerequisite?: Record<string, string>;
}

export interface ConceptMasteryEvaluation {
  conceptId: string;
  state: ConceptMasteryState;
  score: number;
  attemptsCount: number;
  completedStepsCount: number;
  evidenceSummary: string;
  needsReviewReason?: string;
  lastAssessedAt?: number;
}

export interface LearningPathStep {
  stepNumber: number;
  concept: ConceptNode;
  mastery: ConceptMasteryEvaluation;
  isPrerequisite: boolean;
  isTargetGoal: boolean;
  isRecommendedNext: boolean;
  recommendationReason: string;
  canSkip: boolean;
  canReview: boolean;
}

export interface LearningPath {
  goalId: string;
  goalTitle: string;
  targetConcept: ConceptNode;
  orderedSteps: LearningPathStep[];
  recommendedNextStep: LearningPathStep | null;
  totalSteps: number;
  completedSteps: number;
  allPrerequisitesMet: boolean;
  summary: string;
  generatedAt: number;
}

export interface PersistedGoalProgress {
  goalId: string;
  activeConceptId?: string;
  skippedConceptIds: string[];
  reviewedConceptIds: string[];
  updatedAt: number;
}

export interface GraphPointCoordinate {
  x: number;
  y: number;
}

export interface GraphNodePosition {
  concept: ConceptNode;
  role: 'prerequisite' | 'current' | 'dependent' | 'recommended';
  masteryState?: ConceptMasteryState;
  score?: number;
  isUnlocked: boolean;
  x: number;
  y: number;
  width?: number;
  height?: number;
  connectionPoints?: {
    left: GraphPointCoordinate;
    right: GraphPointCoordinate;
    top: GraphPointCoordinate;
    bottom: GraphPointCoordinate;
  };
  endpoints?: {
    incoming: GraphPointCoordinate;
    outgoing: GraphPointCoordinate;
  };
}

export interface GraphEdgeConnection {
  sourceId: string;
  targetId: string;
  rationale?: string;
  isHighlighted?: boolean;
  startX?: number;
  startY?: number;
  endX?: number;
  endY?: number;
  sourceAnchor?: 'left' | 'right' | 'top' | 'bottom';
  targetAnchor?: 'left' | 'right' | 'top' | 'bottom';
  controlX1?: number;
  controlY1?: number;
  controlX2?: number;
  controlY2?: number;
  pathD?: string;
  markerEnd?: string;
}

export interface TopicKnowledgeSubGraph {
  targetConcept: ConceptNode;
  prerequisites: ConceptNode[];
  dependents: ConceptNode[];
  recommendedNextSteps: {
    concept: ConceptNode;
    rationale: string;
    priority: 'prerequisite_review' | 'current_practice' | 'advanced_step';
  }[];
  nodes: GraphNodePosition[];
  edges: GraphEdgeConnection[];
  metadata?: {
    totalPrerequisites: number;
    totalDependents: number;
    totalEdges: number;
    activeDomain: string;
    description: string;
  };
}



