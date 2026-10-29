/**
 * VisiOS — Phase 11: Unified Knowledge Graph Service Facade
 * Coordinates concept registration, cross-domain relationship management,
 * prerequisite resolution, multi-hop reasoning, and canvas graph visual projections.
 */

import {
  IntelligentConceptNode,
  ConceptRelationshipEdge,
  ConceptDomain,
  PrerequisiteResolutionResult,
  CrossTopicConnection,
  MultiHopReasoningResult,
  ConceptDocumentProvenance,
} from './KnowledgeGraphContracts';
import { ConceptRelationshipService } from './ConceptRelationshipService';
import { PrerequisiteResolver } from './PrerequisiteResolver';
import { CrossTopicReasoningService } from './CrossTopicReasoningService';
import { KnowledgeGraphPersistence } from './KnowledgeGraphPersistence';
import { KnowledgeGraphValidator } from './KnowledgeGraphValidator';
import { KnowledgeModel } from '../adaptive/KnowledgeModel';

export interface CanvasGraphNodeProjection {
  id: string;
  label: string;
  domain: ConceptDomain;
  x: number;
  y: number;
  difficulty: string;
  status: 'not_started' | 'struggling' | 'developing' | 'mastered';
  provenanceSnippet?: string;
}

export interface CanvasGraphEdgeProjection {
  id: string;
  source: string;
  target: string;
  label: string;
  type: string;
  crossDomain: boolean;
  sharedInvariant?: string;
}

export interface CanvasKnowledgeGraphProjection {
  nodes: CanvasGraphNodeProjection[];
  edges: CanvasGraphEdgeProjection[];
}

export class KnowledgeGraphService {
  private static instance: KnowledgeGraphService | null = null;

  public relationshipService: ConceptRelationshipService;
  public prerequisiteResolver: PrerequisiteResolver;
  public reasoningService: CrossTopicReasoningService;

  constructor() {
    this.relationshipService = new ConceptRelationshipService();
    this.prerequisiteResolver = new PrerequisiteResolver(this.relationshipService);
    this.reasoningService = new CrossTopicReasoningService(
      this.relationshipService,
      this.prerequisiteResolver
    );
    this.restorePersistedState();
  }

  public static getInstance(): KnowledgeGraphService {
    if (!this.instance) {
      this.instance = new KnowledgeGraphService();
    }
    return this.instance;
  }

  /**
   * Restore any custom concepts or edges saved in persistence.
   */
  private restorePersistedState(): void {
    const saved = KnowledgeGraphPersistence.loadState();
    if (saved) {
      for (const concept of saved.customConcepts || []) {
        this.relationshipService.registerConcept(concept);
      }
      for (const edge of saved.customRelationships || []) {
        this.relationshipService.addRelationship(edge);
      }
    }
  }

  /**
   * Persist current state.
   */
  public persistState(): void {
    KnowledgeGraphPersistence.saveState(
      this.relationshipService.getAllConcepts(),
      this.relationshipService.getRelationships()
    );
  }

  /**
   * Register a new concept with validation.
   */
  public registerConcept(concept: IntelligentConceptNode): { success: boolean; error?: string } {
    return this.relationshipService.registerConcept(concept);
  }

  /**
   * Add a relationship edge with validation and cycle detection.
   */
  public addRelationship(edge: ConceptRelationshipEdge): { success: boolean; error?: string } {
    return this.relationshipService.addRelationship(edge);
  }

  /**
   * Get a concept by ID.
   */
  public getConcept(id: string): IntelligentConceptNode | undefined {
    return this.relationshipService.getConcept(id);
  }

  /**
   * Get all concepts.
   */
  public getAllConcepts(): IntelligentConceptNode[] {
    return this.relationshipService.getAllConcepts();
  }

  /**
   * Get all concepts in a specific domain.
   */
  public getConceptsByDomain(domain: ConceptDomain): IntelligentConceptNode[] {
    return this.relationshipService.getConceptsByDomain(domain);
  }

  /**
   * Get relationships.
   */
  public getRelationships(conceptId?: string): ConceptRelationshipEdge[] {
    return this.relationshipService.getRelationships(conceptId);
  }

  /**
   * Get cross domain relationships.
   */
  public getCrossDomainRelationships(domain?: ConceptDomain): ConceptRelationshipEdge[] {
    return this.relationshipService.getCrossDomainRelationships(domain);
  }

  /**
   * Resolve prerequisite chain for a concept, with optional student knowledge model integration.
   */
  public resolvePrerequisites(
    conceptId: string,
    studentKnowledgeModel?: KnowledgeModel | Map<string, string> | Record<string, string>,
    studentId?: string
  ): PrerequisiteResolutionResult {
    let masteryMap: Map<string, string> | undefined;

    if (studentKnowledgeModel instanceof KnowledgeModel && studentId) {
      masteryMap = new Map<string, string>();
      const profile = studentKnowledgeModel.getOrCreateProfile(studentId);
      for (const [cid, mastery] of Object.entries(profile.concepts)) {
        masteryMap.set(cid, mastery.masteryLevel);
      }
    } else if (studentKnowledgeModel instanceof Map) {
      masteryMap = studentKnowledgeModel;
    } else if (studentKnowledgeModel && typeof studentKnowledgeModel === 'object') {
      masteryMap = new Map(Object.entries(studentKnowledgeModel));
    }

    return this.prerequisiteResolver.resolvePrerequisites(conceptId, masteryMap);
  }

  /**
   * Perform multi-hop reasoning between concepts or synthesize connections.
   */
  public queryReasoning(query: string, startConceptId: string, endConceptId?: string): MultiHopReasoningResult {
    return this.reasoningService.queryCrossTopicReasoning(query, startConceptId, endConceptId);
  }

  /**
   * Explain the connection between two concepts.
   */
  public explainConnection(conceptIdA: string, conceptIdB: string): CrossTopicConnection | null {
    return this.reasoningService.explainConnection(conceptIdA, conceptIdB);
  }

  /**
   * Attach source document provenance to a concept.
   */
  public attachProvenance(conceptId: string, provenance: ConceptDocumentProvenance): boolean {
    return this.relationshipService.attachProvenanceToConcept(conceptId, provenance);
  }

  /**
   * Project a subgraph into 2D canvas coordinates for spatial rendering.
   */
  public projectCanvasGraph(rootConceptId: string, depth: number = 2): CanvasKnowledgeGraphProjection {
    const includedConceptIds = new Set<string>();
    const queue: Array<{ id: string; d: number }> = [{ id: rootConceptId, d: 0 }];

    while (queue.length > 0) {
      const { id, d } = queue.shift()!;
      if (!includedConceptIds.has(id)) {
        includedConceptIds.add(id);
        if (d < depth) {
          const edges = this.relationshipService.getRelationships(id);
          for (const edge of edges) {
            const nextId = edge.sourceConceptId === id ? edge.targetConceptId : edge.sourceConceptId;
            if (!includedConceptIds.has(nextId)) {
              queue.push({ id: nextId, d: d + 1 });
            }
          }
        }
      }
    }

    // Lay out nodes in a concentric or radial spatial format
    const nodes: CanvasGraphNodeProjection[] = [];
    const idList = Array.from(includedConceptIds);
    const count = idList.length;
    const centerX = 400;
    const centerY = 300;
    const radius = 220;

    for (let i = 0; i < count; i++) {
      const cid = idList[i];
      const concept = this.relationshipService.getConcept(cid);
      if (!concept) continue;

      let x = centerX;
      let y = centerY;

      if (cid !== rootConceptId && count > 1) {
        const angle = (2 * Math.PI * (i - 1)) / (count - 1);
        x = centerX + Math.round(radius * Math.cos(angle));
        y = centerY + Math.round(radius * Math.sin(angle));
      }

      nodes.push({
        id: concept.id,
        label: concept.title,
        domain: concept.domain,
        x,
        y,
        difficulty: concept.difficulty,
        status: concept.studentMasteryStatus || 'not_started',
        provenanceSnippet: concept.provenance?.verbatimSnippet,
      });
    }

    // Project connected edges
    const edges: CanvasGraphEdgeProjection[] = [];
    const allEdges = this.relationshipService.getRelationships();

    for (const edge of allEdges) {
      if (includedConceptIds.has(edge.sourceConceptId) && includedConceptIds.has(edge.targetConceptId)) {
        const conn = this.reasoningService.explainConnection(edge.sourceConceptId, edge.targetConceptId);
        edges.push({
          id: edge.id,
          source: edge.sourceConceptId,
          target: edge.targetConceptId,
          label: edge.relationshipType,
          type: edge.relationshipType,
          crossDomain: edge.crossDomain,
          sharedInvariant: conn?.sharedMathematicalInvariant,
        });
      }
    }

    return { nodes, edges };
  }
}
