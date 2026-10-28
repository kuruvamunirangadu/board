import { KnowledgeCheckQuestion } from './intelligence';

export interface BetaStudyConsent {
  participantCode: string; // e.g. 'P-101'
  consentGranted: boolean;
  consentTimestamp: number;
  ageConfirmed: boolean;
  voluntaryAcknowledgement: boolean;
  studyVersion: string;
}

export interface BetaStudyTask {
  taskId: string;
  topicId: string;
  subjectId: string;
  title: string;
  learningObjectives: string[];
  intendedLevel: string;
  requiredPriorKnowledge: string[];
  estimatedMinutes: number;
  explorationPrompt: string;
  preTestQuestions: KnowledgeCheckQuestion[];
  postTestQuestions: KnowledgeCheckQuestion[];
}

export type BetaSessionStatus = 'in_progress' | 'pretest_done' | 'explored' | 'posttest_done' | 'completed' | 'abandoned';

export interface BetaSession {
  sessionId: string;
  participantCode: string;
  taskId: string;
  topicId: string;
  status: BetaSessionStatus;
  startedAt: number;
  completedAt?: number;
  preTestScore?: number;
  preTestTotal?: number;
  postTestScore?: number;
  postTestTotal?: number;
  scoreDelta?: number; // postTestScore - preTestScore
  taskCompleted: boolean;
  explorationDurationSeconds?: number;
}

export interface BetaFeedbackRecord {
  feedbackId: string;
  sessionId: string;
  participantCode: string;
  taskId: string;
  understandingGoal: string;
  helpfulAspect: string;
  confusingAspect: string;
  visualizationRating: number; // 1 to 5 scale
  encounteredError: boolean;
  errorDescription?: string;
  suggestedImprovement: string;
  submittedAt: number;
}

export interface BetaEvaluationAggregate {
  totalParticipants: number;
  totalSessions: number;
  completedSessions: number;
  completionRatePercentage: number;
  averagePreScore: number | null;
  averagePostScore: number | null;
  averageScoreDelta: number | null;
  positiveDeltaCount: number;
  averageRating: number | null;
  reportedErrorIncidentsCount: number;
  feedbackRecordsCount: number;
  feedbackThemes: {
    theme: string;
    count: number;
    sampleQuote: string;
  }[];
  topicBreakdown: {
    taskId: string;
    title: string;
    completedCount: number;
    avgPreScore: number | null;
    avgPostScore: number | null;
    avgDelta: number | null;
  }[];
  limitations: string[];
}

