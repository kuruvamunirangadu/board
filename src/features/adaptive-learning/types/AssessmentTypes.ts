export type {
  AssessmentAttempt,
  AssessmentDifficultyLevel,
  AssessmentQuestion,
  AssessmentSessionState,
  AnswerEvaluation,
  EvaluationStatus,
  QuestionType,
} from '../../assessment/AssessmentContracts';

export interface AssessmentSummary {
  questionsAnswered: number;
  correctAnswers: number;
  averageScore: number;
  isCompleted: boolean;
}
