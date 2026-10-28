/**
 * VisiOS — Phase 4: Adaptive Learning, Personalization & Student Knowledge Modeling Contracts
 * Defines standard interfaces for mastery estimation, interaction analysis,
 * misconception tracking, and personalized learning paths.
 */

export type MasteryLevel =
  | 'not_started'
  | 'beginner'
  | 'developing'
  | 'proficient'
  | 'mastered';

export type InteractionType =
  | 'quiz_answer'
  | 'hint_request'
  | 'practice_attempt'
  | 'explanation_view'
  | 'canvas_action'
  | 'self_assessment';

export type ActivityDifficulty = 'beginner' | 'intermediate' | 'advanced';

export type RecommendationType =
  | 'prerequisite_review'
  | 'misconception_remediation'
  | 'targeted_practice'
  | 'advance_next_concept'
  | 'alternative_visual';

export interface ConceptMastery {
  conceptId: string;
  masteryLevel: MasteryLevel;
  totalAttempts: number;
  correctAttempts: number;
  recentAccuracy: number;
  consecutiveCorrect: number;
  confidenceScore: number; // 0.0 - 1.0 based on sample size and consistency
  lastPracticedAt?: string;
  updatedAt: string;
  identifiedMisconceptions: string[];
}

export interface StudentInteraction {
  interactionId: string;
  studentId: string;
  conceptId: string;
  type: InteractionType;
  isCorrect?: boolean;
  selectedAnswer?: string | number;
  expectedAnswer?: string | number;
  difficulty?: ActivityDifficulty;
  hintsUsed?: number;
  timeSpentMs?: number;
  timestamp: string;
  detectedMisconceptionId?: string;
}

export interface StudentProfile {
  studentId: string;
  displayName?: string;
  concepts: Record<string, ConceptMastery>;
  interactionHistory: StudentInteraction[];
  activeMisconceptions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MisconceptionMatch {
  misconceptionId: string;
  conceptId: string;
  name: string;
  confidence: number; // 0.0 - 1.0 (increases with repeated observations)
  evidenceCount: number;
  remedialExplanation: string;
  remedialAction: string;
}

export interface AdaptiveRecommendation {
  recommendationId: string;
  studentId: string;
  targetConceptId: string;
  type: RecommendationType;
  difficulty: ActivityDifficulty;
  title: string;
  description: string;
  reasoning: string;
  prerequisiteIds: string[];
  suggestedQuery: string;
  capabilityId?: string;
}

export interface AdaptivePathStep {
  conceptId: string;
  title: string;
  masteryLevel: MasteryLevel;
  status: 'completed' | 'current' | 'locked' | 'recommended';
  rationale: string;
}

export interface AdaptivePath {
  pathId: string;
  studentId: string;
  targetGoal: string;
  steps: AdaptivePathStep[];
  gapConcepts: string[];
  summary: string;
}
