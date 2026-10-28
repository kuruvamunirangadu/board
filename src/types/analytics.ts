export type RetakePolicy = 'all_attempts' | 'latest_attempt' | 'best_attempt';

export type CoverageStatus = 'not_assessed' | 'in_progress' | 'assessed' | 'mastered_evidence';

export interface AssessmentAttemptRecord {
  id: string;
  learnerId: string;
  learnerName?: string;
  questionId: string;
  questionTitle?: string;
  conceptId: string;
  conceptTitle?: string;
  objectiveId?: string;
  subjectId?: string;
  assessmentId?: string;
  selectedOption: number | string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  timestamp: number;
  assessmentVersion: string;
  timeSpentSeconds?: number;
}

export interface ConceptPerformance {
  conceptId: string;
  conceptTitle: string;
  subjectId: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number | null; // null if totalAttempts === 0
  accuracyFormatted: string; // "85.0%" or "No assessment data"
  lastAttemptTimestamp: number | null;
  coverageStatus: CoverageStatus;
  isSampleAdequate: boolean; // true if totalAttempts >= minimum threshold (3)
  evidenceReferences: string[];
}

export interface QuestionPerformance {
  questionId: string;
  questionTitle: string;
  conceptId: string;
  conceptTitle: string;
  objectiveId?: string;
  totalAttempts: number;
  correctAttempts: number;
  incorrectAttempts: number;
  accuracy: number | null;
  accuracyFormatted: string;
  optionDistribution: Record<number | string, number>;
  isSampleAdequate: boolean; // true if totalAttempts >= 5
  needsReviewFlag: boolean;
  reviewFlagReason?: string;
}

export interface RecommendationEvidence {
  id: string;
  recommendedAction:
    | 'review_prerequisite'
    | 'practice_question'
    | 'run_experiment'
    | 'advance_next_concept'
    | 'reassess';
  conceptId: string;
  conceptTitle: string;
  evidenceRecords: string[];
  rationale: string;
  timestamp: number;
  policyVersion: string;
}

export interface LearningAnalyticsSnapshot {
  id: string;
  learnerId: string;
  learnerName?: string;
  subjectId?: string;
  generationTimestamp: number;
  calculationVersion: string;
  retakePolicy: RetakePolicy;
  overallAccuracy: number | null;
  overallAccuracyFormatted: string;
  totalAttemptsCount: number;
  conceptsAssessedCount: number;
  totalConceptsAvailable: number;
  coveragePercentage: number;
  completedObjectivesCount: number;
  savedExperimentsCount: number;
  conceptPerformances: ConceptPerformance[];
  recentAttempts: AssessmentAttemptRecord[];
  recommendations: RecommendationEvidence[];
  limitations: string[];
}

export interface InstructorClassAnalytics {
  classId: string;
  className: string;
  subjectId: string;
  totalEnrolledLearners: number;
  activeLearnersCount: number;
  overallClassAccuracy: number | null;
  overallClassAccuracyFormatted: string;
  conceptAverages: {
    conceptId: string;
    conceptTitle: string;
    learnerCount: number;
    totalAttempts: number;
    accuracy: number | null;
    accuracyFormatted: string;
    strugglingLearnersCount: number;
  }[];
  topMissedQuestions: QuestionPerformance[];
  conceptsNeedingReinforcement: {
    conceptId: string;
    conceptTitle: string;
    reason: string;
    accuracy: number | null;
  }[];
  limitations: string[];
}

export interface AnalyticsReportExport {
  reportId: string;
  title: string;
  generatedAt: string;
  generatedFor: string;
  role: 'student' | 'instructor';
  calculationVersion: string;
  retakePolicy: RetakePolicy;
  metrics: Record<string, any>;
  metricDefinitions: Record<string, string>;
  conceptBreakdown: any[];
  limitations: string[];
}

