export type PublicationStatus = 'published' | 'draft' | 'planned';
export type SubjectCategory = 'natural_sciences' | 'formal_sciences' | 'engineering' | 'humanities';
export type CapabilityStatus = 'available' | 'planned' | 'unsupported';

export interface SubjectDefinition {
  id: string;
  displayName: string;
  description: string;
  iconName: string; // Lucide icon identifier
  category: SubjectCategory;
  topicIds: string[];
  recommendedStartingTopicId?: string;
  contentVersion: string;
  publicationStatus: PublicationStatus;
}

export interface TopicDefinition {
  id: string;
  parentSubjectId: string;
  title: string;
  description: string;
  conceptIds: string[];
  learningObjectives: string[];
  difficultyLevel: 'introductory' | 'intermediate' | 'advanced';
  contentVersion: string;
  publicationStatus: PublicationStatus;
}

export interface ConceptDefinition {
  id: string;
  parentTopicId: string;
  title: string;
  description: string;
  difficultyLevel: 'introductory' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  learningObjectives: string[];
  prerequisiteConceptIds: string[];
  supportedVisualizations: ('diagram' | 'note' | 'model3d' | 'simulation' | 'chart')[];
  supportedSimulations?: string[]; // e.g. ['pendulum']
  requiredCapability?: string;    // e.g. 'simulation.pendulum', '3d.heart'
  knowledgeCheck?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
    hint?: string;
  };
  contentVersion: string;
  publicationStatus: PublicationStatus;
}

export interface LearningResource {
  id: string;
  resourceType: 'diagram' | 'simulation' | '3d_model' | 'knowledge_check' | 'note' | 'graph';
  associatedConceptIds: string[];
  title: string;
  description: string;
  requiredCapability: string;
  capabilityStatus: CapabilityStatus;
  configSchema?: Record<string, any>;
  contentVersion: string;
}

export interface CapabilityDefinition {
  id: string; // e.g. 'simulation.pendulum'
  name: string;
  description: string;
  status: CapabilityStatus;
  supportedFormats: string[];
}

export interface ContentManifest {
  manifestVersion: string;
  subjects: SubjectDefinition[];
  topics: TopicDefinition[];
  concepts: ConceptDefinition[];
  resources: LearningResource[];
  capabilities: CapabilityDefinition[];
}

export interface ValidationDiagnostic {
  type: 'error' | 'warning';
  entityId?: string;
  entityType?: 'subject' | 'topic' | 'concept' | 'resource' | 'capability';
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  diagnostics: ValidationDiagnostic[];
}

