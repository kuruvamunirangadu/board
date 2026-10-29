/**
 * VisiOS — Phase 11: Intelligent Knowledge Graph & Cross-Topic Reasoning Contracts
 * Standardized data models for concepts, cross-domain relationships, document provenance,
 * topological prerequisite ordering, and multi-hop reasoning queries.
 */

export type ConceptDomain =
  | 'mathematics'
  | 'computer_science'
  | 'physics'
  | 'biology'
  | 'chemistry'
  | 'interdisciplinary';

export type RelationshipType =
  | 'prerequisite'            // A must be mastered before B
  | 'cross_domain_connection' // A in Math connects directly to B in CS or Physics
  | 'applies_to'              // Theoretical concept A is applied in domain B
  | 'analogous_to'            // Concept A provides direct visual/cognitive analogy for B
  | 'subconcept_of'           // B is a constituent part of A
  | 'reinforcement';          // Practicing A reinforces understanding of B

export type RelationshipStrength = 'essential' | 'recommended' | 'supplementary';

export interface ConceptDocumentProvenance {
  documentId: string;
  documentTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  verbatimSnippet?: string;
}

export interface IntelligentConceptNode {
  id: string;
  title: string;
  domain: ConceptDomain;
  topic: string;
  summary: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedMinutes: number;
  learningObjectives: string[];
  prerequisiteIds: string[];
  canonicalRenderer?: string;
  provenance?: ConceptDocumentProvenance;
  studentMasteryStatus?: 'not_started' | 'struggling' | 'developing' | 'mastered';
  studentConfidenceScore?: number;
}

export interface ConceptRelationshipEdge {
  id: string;
  sourceConceptId: string;
  targetConceptId: string;
  relationshipType: RelationshipType;
  strength: RelationshipStrength;
  rationale: string;
  crossDomain: boolean;
  provenance?: ConceptDocumentProvenance;
}

export interface PrerequisiteResolutionResult {
  targetConceptId: string;
  targetConceptTitle: string;
  directPrerequisites: string[];
  transitivePrerequisites: string[]; // topologically ordered
  missingForStudent: string[];
  readyToLearn: boolean;
  recommendedOrder: string[];
}

export interface CrossTopicConnection {
  sourceConceptId: string;
  sourceTitle: string;
  sourceDomain: ConceptDomain;
  targetConceptId: string;
  targetTitle: string;
  targetDomain: ConceptDomain;
  relationshipType: RelationshipType;
  explanation: string;
  sharedMathematicalInvariant?: string;
  canvasVisualizationSuggestion?: string;
}

export interface MultiHopReasoningResult {
  query: string;
  startConceptId: string;
  endConceptId?: string;
  path: Array<{ conceptId: string; title: string; domain: ConceptDomain }>;
  synthesis: string;
  connectionsFound: CrossTopicConnection[];
  prerequisitesAddressed: string[];
}
