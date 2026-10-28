import { SubjectCategory } from './knowledge';

export type AIGenerationScope = 
  | 'complete_module' 
  | 'concept_outline' 
  | 'objectives' 
  | 'prerequisites' 
  | 'questions' 
  | 'visuals';

export type LearnerLevel = 'introductory' | 'intermediate' | 'advanced';
export type ProposalReviewStatus = 'unreviewed' | 'accepted' | 'rejected' | 'modified';

export interface AIGenerationRequest {
  topicTitle: string;
  subject?: string;
  subjectCategory?: SubjectCategory;
  intendedLevel?: LearnerLevel;
  learningGoals?: string[];
  desiredDepth?: 'compact' | 'standard' | 'deep';
  scope?: AIGenerationScope;
  language?: string;
  additionalContext?: string;
}

export interface AIConceptProposal {
  tempId: string; // e.g. 'prop_c_1'
  title: string;
  explanation: string;
  learningObjectives: string[];
  difficultyLevel: LearnerLevel;
  estimatedMinutes: number;
  proposedPrerequisiteTempIds: string[];
  suggestedVisualizations: ('diagram' | 'note' | 'model3d' | 'simulation' | 'chart')[];
  suggestedSimulationType?: string;
  requiredCapability?: string;
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint?: string;
  };
  reviewStatus: ProposalReviewStatus;
  sources?: string[];
  factualReviewNeeded: boolean;
  reviewNotes?: string;
}

export interface AIDependencyProposal {
  sourceTempId: string;
  dependentTempId: string;
  rationale: string;
  strength: 'essential' | 'recommended';
  status: 'proposed' | 'accepted' | 'rejected';
  sources?: string[];
}

export interface AIResourceProposal {
  tempId: string;
  associatedTempIds: string[];
  resourceType: 'diagram' | 'simulation' | '3d_model' | 'graph' | 'note';
  title: string;
  description: string;
  requiredCapability: string;
  capabilityStatus: 'available' | 'planned' | 'unsupported';
  isSupported: boolean;
  status: 'proposed' | 'accepted' | 'rejected';
}

export interface DiagnosticItem {
  type: 'error' | 'warning' | 'info';
  layer: 'Layer A (Schema)' | 'Layer B (Referential)' | 'Layer C (Graph)' | 'Layer D (Capability)' | 'Layer E (Assessment)' | 'Layer F (Factual)';
  message: string;
  entityId?: string;
}

export interface AIValidationReport {
  isValid: boolean;
  layerA_Schema: { passed: boolean; issues: string[] };
  layerB_Referential: { passed: boolean; issues: string[] };
  layerC_Graph: { passed: boolean; hasCycles: boolean; cycles?: string[][]; issues: string[] };
  layerD_Capabilities: { passed: boolean; supportedCount: number; unsupportedCount: number; issues: string[] };
  layerE_Assessment: { passed: boolean; questionsValidated: number; issues: string[] };
  layerF_FactualReview: { requiresReviewCount: number; notice: string };
  diagnostics: DiagnosticItem[];
}

export interface AIGenerationProposal {
  proposalId: string;
  topicTitle: string;
  subjectCategory: SubjectCategory;
  subjectDisplayName: string;
  intendedAudience: string;
  generatedAt: number;
  provider: 'live_ai' | 'deterministic_fallback';
  isDemoContent: boolean;
  concepts: AIConceptProposal[];
  dependencies: AIDependencyProposal[];
  resources: AIResourceProposal[];
  assumptionsAndLimitations: string[];
  validation: AIValidationReport;
}

export interface SectionRegenRequest {
  proposalId: string;
  tempConceptId: string;
  section: 'explanation' | 'learningObjectives' | 'prerequisites' | 'knowledgeCheck' | 'activity';
  targetLevel?: LearnerLevel;
  prompt?: string;
}

