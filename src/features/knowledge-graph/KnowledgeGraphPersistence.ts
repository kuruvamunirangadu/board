/**
 * VisiOS — Phase 11: Knowledge Graph Persistence
 * Persists custom concept nodes, relationships, and student mastery state
 * across learning sessions using in-memory and local storage adapters.
 */

import {
  IntelligentConceptNode,
  ConceptRelationshipEdge,
} from './KnowledgeGraphContracts';

export interface SerializedKnowledgeGraphState {
  version: number;
  timestamp: string;
  customConcepts: IntelligentConceptNode[];
  customRelationships: ConceptRelationshipEdge[];
}

export class KnowledgeGraphPersistence {
  private static STORAGE_KEY = 'visios_knowledge_graph_v11';
  private static inMemoryStore: SerializedKnowledgeGraphState | null = null;

  /**
   * Save custom graph state.
   */
  public static saveState(
    concepts: IntelligentConceptNode[],
    relationships: ConceptRelationshipEdge[]
  ): void {
    const state: SerializedKnowledgeGraphState = {
      version: 11,
      timestamp: new Date().toISOString(),
      customConcepts: concepts,
      customRelationships: relationships,
    };

    this.inMemoryStore = state;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
      } catch (err) {
        console.warn('Failed to save knowledge graph to localStorage:', err);
      }
    }
  }

  /**
   * Load custom graph state if saved.
   */
  public static loadState(): SerializedKnowledgeGraphState | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as SerializedKnowledgeGraphState;
          if (parsed && Array.isArray(parsed.customConcepts)) {
            return parsed;
          }
        }
      } catch (err) {
        console.warn('Failed to parse knowledge graph from localStorage:', err);
      }
    }

    return this.inMemoryStore;
  }

  /**
   * Clear persisted state.
   */
  public static clearState(): void {
    this.inMemoryStore = null;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(this.STORAGE_KEY);
      } catch (err) {
        console.warn('Failed to clear knowledge graph from localStorage:', err);
      }
    }
  }
}
