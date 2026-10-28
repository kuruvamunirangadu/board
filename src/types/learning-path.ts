export type ConceptDifficulty = 'introductory' | 'intermediate' | 'advanced';

export type LearnerConceptStatus = 
  | 'not_started' 
  | 'in_progress' 
  | 'practiced' 
  | 'ready_to_review' 
  | 'completed';

export type SuggestedVisualizationType = 'simulation' | 'model3d' | 'diagram' | 'note';

export interface Concept {
  id: string;
  title: string;
  subject: string;
  description: string;
  difficultyLevel: ConceptDifficulty;
  estimatedMinutes: number;
  prerequisiteIds: string[];
  suggestedVisualizations: SuggestedVisualizationType[];
  suggestedSimulations?: string[]; // e.g. ['pendulum']
  learningObjectives: string[];
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint?: string;
  };
}

export type DependencyType = 'prerequisite' | 'co-requisite' | 'reinforcement';
export type DependencyStrength = 'essential' | 'recommended';

export interface ConceptDependency {
  sourceConceptId: string;     // Must be learned first (Prerequisite)
  dependentConceptId: string;  // Requires sourceConceptId (Downstream)
  dependencyType: DependencyType;
  rationale: string;
  strength: DependencyStrength;
}

export interface AssessmentAttempt {
  questionId: string;
  isCorrect: boolean;
  timestamp: number;
  selectedOption: number;
}

export interface LearnerConceptState {
  conceptId: string;
  status: LearnerConceptStatus;
  assessmentAttempts: AssessmentAttempt[];
  recentActivityTimestamp: number;
  lastSuccessfulKnowledgeCheck?: number;
  reviewRecommended: boolean;
  evidenceNotes: string[];
}

export interface LearningGoal {
  id: string;
  title: string;
  description: string;
  subject: string;
  targetConceptId: string;
  targetDifficulty?: ConceptDifficulty;
  createdAt: number;
  status: 'active' | 'completed' | 'paused';
}

export interface LearningPath {
  id: string;
  goalId: string;
  title: string;
  subject: string;
  conceptIds: string[]; // Valid topological sequence
  dependencies: ConceptDependency[];
  status: 'active' | 'completed';
  createdAt: number;
  updatedAt: number;
  sessionId?: string;
  isCurated?: boolean;
}

export interface RecommendationResult {
  recommendedConceptId: string;
  activityType: 'learn' | 'visualize' | 'simulate' | 'knowledge_check' | 'review';
  title: string;
  rationale: string;
  blockingPrerequisites: string[];
  evidence: string[];
  isGoalAchieved: boolean;
}

