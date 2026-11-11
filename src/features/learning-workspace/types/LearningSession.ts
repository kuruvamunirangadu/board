import { LearningSession as PersistedLearningSession } from '@/types/session';

export type LearningWorkspaceStatus = 'active' | 'paused' | 'completed';

export interface LearningWorkspaceContext {
  currentConcept: string;
  previousQuestions: string[];
  completedActivities: string[];
  canvasShapeIds: string[];
  followUpAnswers: Array<{ question: string; answer: string; createdAt: number }>;
}

export interface LearningWorkspaceProgress {
  completedConcepts: number;
  totalConcepts: number;
  quizScore?: number;
}

export interface LearningWorkspaceState {
  status: LearningWorkspaceStatus;
  context: LearningWorkspaceContext;
  progress: LearningWorkspaceProgress;
}

export type LearningSession = PersistedLearningSession & { learningWorkspace?: LearningWorkspaceState };
