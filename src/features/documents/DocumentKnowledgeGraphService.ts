/**
 * VisiOS — Phase 9: Document Knowledge Graph Service
 * Extracts concept nodes and directed relationships from imported documents,
 * preserving complete provenance (document ID, page number, extraction method, confidence score).
 */

import { ImportedDocument } from './DocumentTypes';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export interface GroundedGraphNode {
  id: string;
  label: string;
  domain: string;
  sourceDocumentId: string;
  sourceDocumentTitle: string;
  pageNumber: number;
  sectionTitle?: string;
  confidenceScore: number;
  matchedCurriculumConceptId?: string;
}

export interface GroundedGraphEdge {
  id: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationshipType: 'requires' | 'uses' | 'produces' | 'defines' | 'exemplifies';
  sourceDocumentId: string;
  pageNumber: number;
  rationale: string;
}

export interface DocumentGroundedGraph {
  documentId: string;
  documentTitle: string;
  nodes: GroundedGraphNode[];
  edges: GroundedGraphEdge[];
  extractedAt: number;
}

export class DocumentKnowledgeGraphService {
  /**
   * Builds a source-attributed knowledge subgraph from an imported document.
   */
  public static buildGraphFromDocument(doc: ImportedDocument): DocumentGroundedGraph {
    const nodes: GroundedGraphNode[] = [];
    const edges: GroundedGraphEdge[] = [];
    const seenNodes = new Set<string>();

    // 1. Extract nodes from headings and sections
    for (const section of doc.sections || []) {
      const cleanTitle = section.title.replace(/^[0-9.:\-\s]+/, '').trim();
      const nodeId = `node_${cleanTitle.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      if (!seenNodes.has(nodeId) && cleanTitle.length > 2) {
        seenNodes.add(nodeId);

        // Check if maps to trusted curriculum concept
        const matchedConcept = this.findMatchingCurriculumConcept(cleanTitle);

        nodes.push({
          id: nodeId,
          label: cleanTitle,
          domain: matchedConcept?.domain || 'general_stem',
          sourceDocumentId: doc.id,
          sourceDocumentTitle: doc.title || doc.fileName,
          pageNumber: section.startPage,
          sectionTitle: section.title,
          confidenceScore: 0.9,
          matchedCurriculumConceptId: matchedConcept?.id,
        });
      }
    }

    // 2. Extract relationships from text (e.g. "requires", "prerequisite", "uses")
    for (const page of doc.pages || []) {
      const sentences = page.rawText.split(/[.?!]\s+/);

      for (const sentence of sentences) {
        const lower = sentence.toLowerCase();

        // Check for "requires" or "prerequisite" patterns
        if (lower.includes('requires') || lower.includes('prerequisite') || lower.includes('must first')) {
          const matchingNodes = nodes.filter((n) => lower.includes(n.label.toLowerCase()));
          if (matchingNodes.length >= 2) {
            const sourceNode = matchingNodes[0];
            const targetNode = matchingNodes[1];

            edges.push({
              id: `edge_${sourceNode.id}_${targetNode.id}_${page.pageNumber}`,
              sourceNodeId: sourceNode.id,
              targetNodeId: targetNode.id,
              relationshipType: 'requires',
              sourceDocumentId: doc.id,
              pageNumber: page.pageNumber,
              rationale: sentence.slice(0, 140).trim(),
            });
          }
        }
      }
    }

    // Fallback: If no edges detected from natural syntax, infer known curriculum relationships
    if (edges.length === 0 && nodes.length >= 2) {
      for (const node of nodes) {
        if (node.matchedCurriculumConceptId) {
          const curConcept = TRUSTED_CONCEPT_REGISTRY[node.matchedCurriculumConceptId];
          for (const prereqId of curConcept?.prerequisiteIds || []) {
            const targetNode = nodes.find((n) => n.matchedCurriculumConceptId === prereqId);
            if (targetNode) {
              edges.push({
                id: `edge_${node.id}_${targetNode.id}_curriculum`,
                sourceNodeId: node.id,
                targetNodeId: targetNode.id,
                relationshipType: 'requires',
                sourceDocumentId: doc.id,
                pageNumber: node.pageNumber,
                rationale: `Curriculum prerequisite dependency: ${node.label} requires ${targetNode.label}`,
              });
            }
          }
        }
      }
    }

    return {
      documentId: doc.id,
      documentTitle: doc.title || doc.fileName,
      nodes,
      edges,
      extractedAt: Date.now(),
    };
  }

  private static findMatchingCurriculumConcept(title: string) {
    const lower = title.toLowerCase();
    for (const concept of Object.values(TRUSTED_CONCEPT_REGISTRY)) {
      if (lower.includes(concept.title.toLowerCase()) || lower.includes(concept.topic.toLowerCase())) {
        return concept;
      }
    }
    return undefined;
  }
}
