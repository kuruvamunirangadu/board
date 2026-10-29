/**
 * VisiOS — Phase 5: Intelligent Assessment & Knowledge Verification Contracts
 * Standard interfaces for question generation, step-by-step reasoning evaluation,
 * misconception diagnosis, progressive hinting, and knowledge verification.
 */

export type QuestionType =
  | 'multiple_choice'
  | 'numeric'
  | 'symbolic'
  | 'short_answer'
  | 'step_by_step';

export type AssessmentDifficultyLevel = 1 | 2 | 3 | 4 | 5;

export type EvaluationStatus =
  | 'correct'
  | 'partially_correct'
  | 'incorrect'
  | 'unable_to_evaluate';

export type StepErrorCategory =
  | 'conceptual'
  | 'algebraic'
  | 'arithmetic'
  | 'notation'
  | 'incomplete'
  | 'unsupported';

export interface AssessmentQuestion {
  id: string;
  conceptId: string;
  capabilityId: string;
  question: string;
  questionType: QuestionType;
  difficulty: AssessmentDifficultyLevel;
  prerequisites: string[];
  expectedAnswer?: string | number;
  options?: string[];
  correctOptionIndex?: number;
  tolerance?: number;
  unit?: string;
  evaluationStrategy: 'deterministic_numeric' | 'exact_option' | 'symbolic_equivalence' | 'linear_derivation_audit' | 'fraction_exact' | 'unsupported';
  hints: string[];
  explanation: string;
  expectedSteps?: string[];
}

export interface StepEvaluation {
  stepIndex: number;
  submittedStep: string;
  isValid: boolean | null;
  errorCategory?: StepErrorCategory;
  feedback: string;
}

export interface AnswerEvaluation {
  status: EvaluationStatus;
  finalAnswerCorrect: boolean | null;
  reasoningCorrect: boolean | null;
  stepEvaluations: StepEvaluation[];
  score: number; // 0 - 100
  feedback: string;
  detectedMisconceptionId?: string;
  misconceptionAlert?: string;
}

export interface AssessmentAttempt {
  attemptId: string;
  studentId: string;
  questionId: string;
  conceptId: string;
  submittedAnswer: string | number;
  submittedSteps?: string[];
  hintsRequested: number;
  evaluation: AnswerEvaluation;
  timestamp: string;
}

export interface AssessmentSessionState {
  sessionId: string;
  studentId: string;
  conceptId: string;
  currentDifficulty: AssessmentDifficultyLevel;
  questionsAnswered: number;
  correctAnswers: number;
  attempts: AssessmentAttempt[];
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  isCompleted: boolean;
  activeMisconceptions: string[];
  updatedAt: string;
}

