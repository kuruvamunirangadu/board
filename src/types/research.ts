/**
 * VisiOS Milestone 19 — Research Validation & AI Learning Intelligence
 * Core Type Definitions for Evidence-Driven Adaptive Learning & Controlled Research Experiments
 */

export type SubjectId = 'physics' | 'mathematics' | 'computer_science' | 'electronics';

export type InterventionType =
  | 'simpler_text'
  | 'labeled_2d_diagram'
  | 'interactive_3d_model'
  | 'worked_example'
  | 'guided_simulation'
  | 'prerequisite_review'
  | 'targeted_practice'
  | 'hint_and_retry';

export type StudyCondition = 'adaptive_intervention' | 'fixed_sequence';

export type MasteryStatus = 'unassessed' | 'novice' | 'developing' | 'proficient' | 'mastered';

/**
 * Validated Misconception Definition with Grounded Distractor Mapping
 */
export interface MisconceptionDefinition {
  id: string;
  conceptId: string;
  name: string;
  description: string;
  remedialIntervention: InterventionType;
  remedialResourceKey: string;
  remedialExplanation: string;
  authoritativeSource: string;
}

/**
 * Diagnostic Question with Distractor-to-Misconception Mapping
 */
export interface DiagnosticQuestion {
  id: string;
  conceptId: string;
  learningObjective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  question: string;
  options: string[];
  correctIndex: number;
  distractorMisconceptions: Record<number, string>; // option index -> misconception id
  explanations: string[];
  author: string;
  version: string;
}

/**
 * Atomic Assessment Evidence Record
 * Strict distinction between observed evidence and estimated knowledge
 */
export interface LearnerEvidenceItem {
  id: string;
  participantId: string;
  conceptId: string;
  conceptVersion: string;
  questionId: string;
  timestamp: number;
  learningObjective: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  isCorrect: boolean;
  selectedOptionIndex: number;
  detectedMisconceptionId?: string;
  hintsUsed: number;
  timeSpentMs: number;
  confidenceReported?: 'low' | 'medium' | 'high';
}

/**
 * Estimated Concept Mastery State
 */
export interface ConceptMasteryEstimate {
  conceptId: string;
  masteryStatus: MasteryStatus;
  estimatedMasteryProbability: number; // 0.0 to 1.0 (Bayesian/evidence calibrated)
  evidenceCount: number;
  uncertaintyScore: number; // 0.0 (high certainty) to 1.0 (no evidence)
  activeMisconceptions: string[];
  lastAssessedTimestamp: number | null;
  prerequisiteConfidence: number; // 0.0 to 1.0
}

/**
 * Transparent Adaptation Recommendation
 */
export interface AdaptationRecommendation {
  recommendationId: string;
  participantId: string;
  conceptId: string;
  targetObjective: string;
  interventionType: InterventionType;
  resourceId: string;
  resourceTitle: string;
  resourcePayload: {
    type: 'text' | 'diagram' | 'simulation' | 'worked_example' | 'review_summary';
    title: string;
    content: string;
    simulationParams?: Record<string, number | string>;
    diagramSvg?: string;
  };
  humanReadableRationale: string;
  evidenceTrail: string[];
  triggeredRuleId: string;
  ruleVersion: string;
  estimatedDifficultyReduction: number;
  generatedAt: number;
}

/**
 * Research Experiment Protocol Configuration
 */
export interface ExperimentProtocol {
  experimentId: string;
  version: string;
  title: string;
  researchQuestion: string;
  hypothesis: string;
  targetConceptId: string;
  subjectId: SubjectId;
  eligibleParticipantCriteria: string[];
  requiredPriorKnowledge: string[];
  preTestQuestions: DiagnosticQuestion[];
  postTestQuestions: DiagnosticQuestion[];
  interventionConditionId: 'adaptive_intervention';
  controlConditionId: 'fixed_sequence';
  targetDurationMinutes: number;
  primaryOutcome: string;
  secondaryOutcomes: string[];
  exclusionCriteria: string[];
  plannedSampleSize: number;
  createdAt: number;
}

/**
 * Research Participant Session
 */
export interface ResearchSessionRecord {
  sessionId: string;
  participantCode: string; // Pseudonymous e.g. R-101
  experimentId: string;
  condition: StudyCondition;
  consentTimestamp: number;
  startedAt: number;
  completedAt: number | null;
  status: 'consented' | 'pre_test' | 'learning_phase' | 'post_test' | 'completed' | 'abandoned';
  
  // Empirical Evidence
  preTestResponses: Record<string, number>;
  preTestScore: number | null; // Normalized 0-100
  
  postTestResponses: Record<string, number>;
  postTestScore: number | null; // Normalized 0-100
  
  evidenceLog: LearnerEvidenceItem[];
  adaptationHistory: AdaptationRecommendation[];
  interventionsCompleted: string[];
  
  timeOnTaskSeconds: number;
  hintsRequestedCount: number;
  subjectiveClarityRating?: number; // 1-5
  qualitativeFeedback?: string;
}

/**
 * Aggregated Research Statistical Evaluation
 */
export interface ExperimentEvaluationReport {
  experimentId: string;
  generatedAt: number;
  sampleSize: {
    totalConsented: number;
    totalCompleted: number;
    adaptiveCompleted: number;
    fixedCompleted: number;
    dropoutRate: number;
  };
  learningOutcomes: {
    adaptive: {
      meanPreScore: number;
      meanPostScore: number;
      meanGainDelta: number; // Post - Pre
      meanNormalizedGain: number; // (Post - Pre) / (100 - Pre)
      preStdDev: number;
      postStdDev: number;
      gainStdDev: number;
    };
    control: {
      meanPreScore: number;
      meanPostScore: number;
      meanGainDelta: number;
      meanNormalizedGain: number;
      preStdDev: number;
      postStdDev: number;
      gainStdDev: number;
    };
    effectSizeCohenD: number;
    differenceInGain: number;
  };
  engagementAndEfficiency: {
    adaptiveMeanTimeMinutes: number;
    controlMeanTimeMinutes: number;
    adaptiveMeanHintsUsed: number;
    controlMeanHintsUsed: number;
    adaptiveMeanClarityRating: number;
    controlMeanClarityRating: number;
  };
  misconceptionsDetected: {
    misconceptionId: string;
    name: string;
    frequencyCount: number;
    remediationSuccessRate: number; // percentage who got post-test correct after targeted remediation
  }[];
  adaptationRuleFrequencies: Record<string, number>;
  missingDataSummary: {
    incompletePreTests: number;
    incompletePostTests: number;
    missingFeedback: number;
  };
  limitations: string[];
}

