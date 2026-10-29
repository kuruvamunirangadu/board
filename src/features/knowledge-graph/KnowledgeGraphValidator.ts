/**
 * VisiOS — Phase 11: Knowledge Graph Validator
 * Validates concept nodes, relationship integrity, supported edge types,
 * and detects cycles in prerequisite dependency subgraphs.
 */

import {
  IntelligentConceptNode,
  ConceptRelationshipEdge,
  RelationshipType,
  RelationshipStrength,
} from './KnowledgeGraphContracts';

export const SUPPORTED_RELATIONSHIP_TYPES: ReadonlyArray<RelationshipType> = [
  'prerequisite',
  'cross_domain_connection',
  'applies_to',
  'analogous_to',
  'subconcept_of',
  'reinforcement',
];

export const SUPPORTED_RELATIONSHIP_STRENGTHS: ReadonlyArray<RelationshipStrength> = [
  'essential',
  'recommended',
  'supplementary',
];

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class KnowledgeGraphValidator {
  /**
   * Validate a concept node's properties.
   */
  public static validateConcept(concept: IntelligentConceptNode): ValidationResult {
    const errors: string[] = [];

    if (!concept.id || typeof concept.id !== 'string' || concept.id.trim() === '') {
      errors.push('Concept ID must be a non-empty string.');
    }

    if (!concept.title || typeof concept.title !== 'string' || concept.title.trim() === '') {
      errors.push('Concept title must be a non-empty string.');
    }

    if (!concept.domain || typeof concept.domain !== 'string') {
      errors.push('Concept domain must be specified.');
    }

    if (!concept.topic || typeof concept.topic !== 'string') {
      errors.push('Concept topic must be specified.');
    }

    if (!['beginner', 'intermediate', 'advanced'].includes(concept.difficulty)) {
      errors.push(`Invalid difficulty level: "${concept.difficulty}".`);
    }

    if (typeof concept.estimatedMinutes !== 'number' || concept.estimatedMinutes <= 0) {
      errors.push('Estimated minutes must be a positive number.');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate a relationship edge before adding to the graph.
   */
  public static validateRelationship(
    edge: ConceptRelationshipEdge,
    knownConceptIds?: Set<string>
  ): ValidationResult {
    const errors: string[] = [];

    if (!edge.id || typeof edge.id !== 'string') {
      errors.push('Relationship ID must be a valid string.');
    }

    if (!edge.sourceConceptId || !edge.targetConceptId) {
      errors.push('Both sourceConceptId and targetConceptId must be specified.');
    }

    if (edge.sourceConceptId === edge.targetConceptId) {
      errors.push(`Self-referential relationships are not allowed: "${edge.sourceConceptId}".`);
    }

    if (!SUPPORTED_RELATIONSHIP_TYPES.includes(edge.relationshipType)) {
      errors.push(
        `Unsupported relationship type: "${edge.relationshipType}". Supported types: ${SUPPORTED_RELATIONSHIP_TYPES.join(
          ', '
        )}`
      );
    }

    if (edge.strength && !SUPPORTED_RELATIONSHIP_STRENGTHS.includes(edge.strength)) {
      errors.push(
        `Invalid relationship strength: "${edge.strength}". Supported strengths: ${SUPPORTED_RELATIONSHIP_STRENGTHS.join(
          ', '
        )}`
      );
    }

    if (knownConceptIds) {
      if (!knownConceptIds.has(edge.sourceConceptId)) {
        errors.push(`Source concept "${edge.sourceConceptId}" does not exist in graph.`);
      }
      if (!knownConceptIds.has(edge.targetConceptId)) {
        errors.push(`Target concept "${edge.targetConceptId}" does not exist in graph.`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Check if adding a prerequisite edge (source -> target) creates a cycle in the graph.
   * If source is a prerequisite of target, edge is directed: source -> target.
   * A cycle exists if target can already reach source through existing prerequisite edges.
   */
  public static checkPrerequisiteCycle(
    sourceConceptId: string,
    targetConceptId: string,
    prerequisiteAdjacency: Map<string, string[]>
  ): { hasCycle: boolean; cyclePath?: string[] } {
    // DFS from target to see if we can reach source
    const visited = new Set<string>();
    const path: string[] = [];

    const dfs = (current: string): boolean => {
      visited.add(current);
      path.push(current);

      if (current === sourceConceptId) {
        return true;
      }

      const neighbors = prerequisiteAdjacency.get(current) || [];
      for (const next of neighbors) {
        if (!visited.has(next)) {
          if (dfs(next)) {
            return true;
          }
        }
      }

      path.pop();
      return false;
    };

    if (dfs(targetConceptId)) {
      return {
        hasCycle: true,
        cyclePath: [...path, sourceConceptId],
      };
    }

    return { hasCycle: false };
  }
}
