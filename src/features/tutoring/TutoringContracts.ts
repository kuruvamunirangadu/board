/**
 * VisiOS — Phase 8: Intelligent Tutoring & Personalized Learning Contracts
 * Unified data models, teaching strategies, hint progression states, and validation schemas.
 */

export type TeachingStrategy =
  | 'simple'
  | 'step_by_step'
  | 'visual'
  | 'worked_example'
  | 'analogy'
  | 'socratic'
  | 'formal'
  | 'error_focused';

export type LearnerDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type PracticeExerciseType =
  | 'multiple_choice'
  | 'fill_in_the_gap'
  | 'code_tracing'
  | 'mathematical_problem'
  | 'predict_next_step';

export interface TutoringContext {
  studentId: string;
  subjectId: string;
  conceptId: string;
  conceptTitle: string;
  masteryLevel: string; // 'not_started' | 'introductory' | 'developing' | 'mastered'
  confidenceScore: number; // 0.0 - 1.0
  activeMisconceptions: string[];
  unmasteredPrerequisites: string[];
  recommendedDifficulty: LearnerDifficulty;
  suggestedStrategy: TeachingStrategy;
  consecutiveErrorsCount: number;
}

export interface TutoringVisualPlan {
  supported: boolean;
  capabilityId: string;
  rendererName: string;
  visualType: string;
  props: Record<string, unknown>;
  steps: string[];
}

export interface TutoringExplanation {
  strategy: TeachingStrategy;
  difficulty: LearnerDifficulty;
  conceptId: string;
  conceptTitle: string;
  title: string;
  summary: string;
  content: string;
  steps?: string[];
  analogies?: string[];
  socraticQuestions?: string[];
  visualPlan?: TutoringVisualPlan;
  suggestedNextStep: string;
}

export interface TutoringHintProgress {
  exerciseId: string;
  totalHintsAvailable: number;
  currentHintLevel: number; // 0 = no hints, 1 = first, 2 = second, etc.
  deliveredHints: string[];
  isSolutionRevealed: boolean;
  nextHintText?: string;
}

export interface TutoringPracticeExercise {
  id: string;
  conceptId: string;
  conceptTitle: string;
  type: PracticeExerciseType;
  difficulty: LearnerDifficulty;
  difficultyNumber: number; // 1 - 5
  question: string;
  options?: string[];
  expectedAnswer: string | number;
  hints: string[];
  solutionExplanation: string;
  validationProcedure: string; // 'deterministic_numeric' | 'symbolic_equivalence' | 'exact_match' | 'array_state_match'
}

export interface TutoringValidationResult {
  isValid: boolean;
  checks: {
    mathCorrectness: boolean;
    rendererSupported: boolean;
    formulaValid: boolean;
    codeSafe: boolean;
    answerKeyConsistent: boolean;
    prerequisitesMet: boolean;
  };
  errors: string[];
  warnings: string[];
  fallbackApplied?: boolean;
  sanitizedContent?: string;
}

export interface TutoringRequest {
  sessionId: string;
  studentId: string;
  query: string;
  requestingStudentId?: string; // for privacy checks
  conceptId?: string;
  subjectId?: string;
  requestedStrategy?: TeachingStrategy;
  requestedDifficulty?: LearnerDifficulty;
}

export interface TutoringResponse {
  status: 'success' | 'clarification_needed' | 'unsupported' | 'validation_failed' | 'forbidden' | 'error';
  sessionId: string;
  studentId: string;
  conceptId?: string;
  conceptTitle?: string;
  strategyUsed?: TeachingStrategy;
  difficultyUsed?: LearnerDifficulty;
  explanation?: TutoringExplanation;
  practiceExercise?: TutoringPracticeExercise;
  hintProgress?: TutoringHintProgress;
  validation: TutoringValidationResult;
  error?: string;
  message?: string;
}
