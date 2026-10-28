import { WorkspaceMode } from './index';
import { ExperimentSessionState } from '@/features/experiment/ExperimentTypes';

export type ActivityType =
  | 'topic_visualized'
  | 'concept_explained'
  | 'simulation_experiment'
  | 'knowledge_check_attempt'
  | 'board_revisited';

export interface LearningActivity {
  id: string;
  sessionId: string;
  activityType: ActivityType;
  relatedObjectId?: string;
  timestamp: number;
  title: string;
  metadata?: {
    conceptName?: string;
    isCorrect?: boolean;
    score?: number;
    experimentName?: string;
    simulationType?: string;
    details?: string;
  };
}

export interface MetricDefinition {
  label: string;
  unit: string;
  description?: string;
}

export interface ExperimentCheckpoint {
  id: string;
  sessionId: string;
  name: string;
  createdAt: number;
  simulationType: string;
  version: string;
  parameters: Record<string, number>;
  metrics: Record<string, number>;
  definitions: Record<string, MetricDefinition>;
  notes?: string;
}

export interface PracticeAttemptRecord {
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
}

export interface SimulationStateRecord {
  parameters: Record<string, number>;
  activeRenderer?: string;
  lastOperation?: string;
  calculatedResult?: string | number;
}

export interface LearningSession {
  schemaVersion?: number;
  id: string;
  title: string;
  primaryTopic: string;
  domain?: string;
  conceptId?: string;
  subject?: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  lastOpenedAt: number;
  version: string;
  mode?: WorkspaceMode;
  tags?: string[];
  boardSnapshot?: any;
  checkpoints?: ExperimentCheckpoint[];
  activities?: LearningActivity[];

  // Step 6: Learning Session Persistence & Resume
  currentLessonStep?: string;
  completedSteps?: string[];
  activeTab?: string;
  isGuidedMode?: boolean;
  isCompleted?: boolean;
  practiceAttempts?: PracticeAttemptRecord;
  simulationState?: SimulationStateRecord;
  experimentLabState?: ExperimentSessionState;
  whatIfComparison?: any;
  workspaceId?: string;
  responseId?: string;
  capabilityId?: string;
  engineId?: string;
}

export interface MetricDiff {
  key: string;
  label: string;
  unit: string;
  values: (number | null)[];
  differences: (number | null)[];
  percentChanges: (number | null)[];
  isComparable: boolean;
}

export interface CheckpointComparison {
  checkpoints: ExperimentCheckpoint[];
  parameterDiffs: MetricDiff[];
  metricDiffs: MetricDiff[];
  observations: string[];
}

