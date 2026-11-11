export type ConceptMasteryStatus =
  | 'not_started'
  | 'needs_revision'
  | 'learning'
  | 'almost_mastered'
  | 'mastered';

export interface ConceptMastery {
  conceptId: string;
  conceptName: string;
  totalAttempts: number;
  correctAttempts: number;
  masteryScore: number;
  status: ConceptMasteryStatus;
  lastAttemptAt?: string;
}

export interface LearningAnalytics {
  conceptId: string;
  totalAttempts: number;
  correctAttempts: number;
  accuracy: number;
  recentAccuracy: number;
  averageScore: number;
  hintsUsed: number;
  mastery: ConceptMastery;
}
