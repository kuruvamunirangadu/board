import { 
  SubjectDefinition, 
  TopicDefinition, 
  ConceptDefinition, 
  LearningResource, 
  ContentManifest, 
  ValidationResult,
  PublicationStatus,
  SubjectCategory
} from './knowledge';
import { ConceptDependency } from './learning-path';

export interface ContentPackDraft {
  id: string;
  title: string;
  description: string;
  category: SubjectCategory;
  iconName: string;
  version: string;
  publicationStatus: PublicationStatus;
  createdAt: number;
  lastModified: number;
  
  // Content hierarchy
  subject: SubjectDefinition;
  topics: TopicDefinition[];
  concepts: ConceptDefinition[];
  dependencies: ConceptDependency[];
  resources: LearningResource[];
  
  // Validation state
  validation: ValidationResult;
}

export interface ContentVersionSnapshot {
  id: string;
  packId: string;
  version: string;
  timestamp: number;
  authorNotes?: string;
  snapshot: {
    subject: SubjectDefinition;
    topics: TopicDefinition[];
    concepts: ConceptDefinition[];
    dependencies: ConceptDependency[];
    resources: LearningResource[];
  };
}

export interface PublicationRecord {
  packId: string;
  version: string;
  publishedAt: number;
  manifest: ContentManifest;
}

export interface GraphNodePosition {
  x: number;
  y: number;
}

export interface AuthoringGraphNode {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  difficultyLevel: 'introductory' | 'intermediate' | 'advanced';
  prerequisiteCount: number;
  hasVisuals: boolean;
  hasSimulation: boolean;
  hasKnowledgeCheck: boolean;
  position?: GraphNodePosition;
}

export interface AuthoringGraphEdge {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  strength: 'essential' | 'recommended';
  rationale?: string;
}
