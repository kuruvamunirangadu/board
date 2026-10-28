import { Concept, ConceptDependency, LearnerConceptState } from '@/types/learning-path';

export class ConceptDependencyGraph {
  private concepts: Map<string, Concept> = new Map();
  private prerequisitesMap: Map<string, ConceptDependency[]> = new Map(); // key = dependent, value = prerequisites
  private downstreamMap: Map<string, ConceptDependency[]> = new Map();    // key = source, value = dependents

  constructor(concepts?: Concept[], dependencies?: ConceptDependency[]) {
    if (concepts) {
      concepts.forEach((c) => this.addConcept(c));
    }
    if (dependencies) {
      dependencies.forEach((d) => this.addDependency(d));
    }
  }

  addConcept(concept: Concept): void {
    this.concepts.set(concept.id, concept);
    if (!this.prerequisitesMap.has(concept.id)) {
      this.prerequisitesMap.set(concept.id, []);
    }
    if (!this.downstreamMap.has(concept.id)) {
      this.downstreamMap.set(concept.id, []);
    }

    // Also populate prerequisites specified in concept.prerequisiteIds
    if (concept.prerequisiteIds) {
      concept.prerequisiteIds.forEach((prereqId) => {
        this.addDependency({
          sourceConceptId: prereqId,
          dependentConceptId: concept.id,
          dependencyType: 'prerequisite',
          rationale: `Foundational prerequisite for ${concept.title}`,
          strength: 'essential',
        });
      });
    }
  }

  addDependency(dep: ConceptDependency): void {
    const { sourceConceptId, dependentConceptId } = dep;

    if (!this.prerequisitesMap.has(dependentConceptId)) {
      this.prerequisitesMap.set(dependentConceptId, []);
    }
    const prereqs = this.prerequisitesMap.get(dependentConceptId)!;
    if (!prereqs.some((d) => d.sourceConceptId === sourceConceptId)) {
      prereqs.push(dep);
    }

    if (!this.downstreamMap.has(sourceConceptId)) {
      this.downstreamMap.set(sourceConceptId, []);
    }
    const downstreams = this.downstreamMap.get(sourceConceptId)!;
    if (!downstreams.some((d) => d.dependentConceptId === dependentConceptId)) {
      downstreams.push(dep);
    }
  }

  getConcept(id: string): Concept | undefined {
    return this.concepts.get(id);
  }

  getAllConcepts(): Concept[] {
    return Array.from(this.concepts.values());
  }

  getDependencies(): ConceptDependency[] {
    const all: ConceptDependency[] = [];
    this.prerequisitesMap.forEach((deps) => {
      all.push(...deps);
    });
    return all;
  }

  getPrerequisites(conceptId: string): Concept[] {
    const deps = this.prerequisitesMap.get(conceptId) || [];
    return deps
      .map((d) => this.concepts.get(d.sourceConceptId))
      .filter((c): c is Concept => c !== undefined);
  }

  getDownstream(conceptId: string): Concept[] {
    const deps = this.downstreamMap.get(conceptId) || [];
    return deps
      .map((d) => this.concepts.get(d.dependentConceptId))
      .filter((c): c is Concept => c !== undefined);
  }

  /**
   * Detects circular dependencies using DFS graph coloring.
   * Returns cycle path arrays if cycles exist, or null if acyclic.
   */
  detectCycles(): string[][] | null {
    const visited = new Map<string, 0 | 1 | 2>(); // 0=unvisited, 1=visiting, 2=visited
    const allCycles: string[][] = [];

    this.concepts.forEach((_, id) => visited.set(id, 0));

    const dfs = (nodeId: string, currentPath: string[]) => {
      visited.set(nodeId, 1);
      currentPath.push(nodeId);

      const downstreamDeps = this.downstreamMap.get(nodeId) || [];
      for (const dep of downstreamDeps) {
        const neighbor = dep.dependentConceptId;
        const state = visited.get(neighbor) ?? 0;

        if (state === 1) {
          // Cycle detected!
          const cycleStartIndex = currentPath.indexOf(neighbor);
          const cycle = currentPath.slice(cycleStartIndex).concat(neighbor);
          allCycles.push(cycle);
        } else if (state === 0) {
          dfs(neighbor, currentPath);
        }
      }

      currentPath.pop();
      visited.set(nodeId, 2);
    };

    this.concepts.forEach((_, id) => {
      if ((visited.get(id) ?? 0) === 0) {
        dfs(id, []);
      }
    });

    return allCycles.length > 0 ? allCycles : null;
  }

  /**
   * Computes a valid topological learning order using Kahn's Algorithm.
   * Throws Error if graph contains circular dependencies.
   */
  getTopologicalOrder(): string[] {
    const cycles = this.detectCycles();
    if (cycles) {
      throw new Error(`Circular dependency detected: ${cycles[0].join(' → ')}`);
    }

    const inDegree = new Map<string, number>();
    this.concepts.forEach((_, id) => {
      const prereqs = (this.prerequisitesMap.get(id) || []).filter((d) => this.concepts.has(d.sourceConceptId));
      inDegree.set(id, prereqs.length);
    });

    const queue: string[] = [];
    inDegree.forEach((degree, id) => {
      if (degree === 0) {
        queue.push(id);
      }
    });

    const ordered: string[] = [];

    while (queue.length > 0) {
      // Sort alphabetically for deterministic ordering when multiple roots exist
      queue.sort();
      const current = queue.shift()!;
      ordered.push(current);

      const downstreams = this.downstreamMap.get(current) || [];
      for (const dep of downstreams) {
        const target = dep.dependentConceptId;
        if (inDegree.has(target)) {
          const newDeg = (inDegree.get(target) || 1) - 1;
          inDegree.set(target, newDeg);
          if (newDeg === 0) {
            queue.push(target);
          }
        }
      }
    }

    if (ordered.length !== this.concepts.size) {
      // Some concepts were not reachable due to missing references or broken cycles
      const missing = Array.from(this.concepts.keys()).filter((id) => !ordered.includes(id));
      ordered.push(...missing);
    }

    return ordered;
  }

  /**
   * Identifies prerequisite concept IDs that are not yet marked as 'practiced' or 'completed'.
   */
  getMissingPrerequisites(
    conceptId: string,
    learnerStates: Record<string, LearnerConceptState>
  ): string[] {
    const prereqs = this.prerequisitesMap.get(conceptId) || [];
    return prereqs
      .filter((d) => d.strength === 'essential')
      .map((d) => d.sourceConceptId)
      .filter((sourceId) => {
        const state = learnerStates[sourceId];
        const isSatisfied = state && (state.status === 'completed' || state.status === 'practiced');
        return !isSatisfied;
      });
  }

  /**
   * Determines which concepts are currently eligible to be learned.
   */
  getEligibleConcepts(learnerStates: Record<string, LearnerConceptState>): string[] {
    const eligible: string[] = [];

    this.concepts.forEach((_, conceptId) => {
      const currentState = learnerStates[conceptId];
      if (currentState && (currentState.status === 'completed' || currentState.status === 'practiced')) {
        return; // Already completed
      }

      const missing = this.getMissingPrerequisites(conceptId, learnerStates);
      if (missing.length === 0) {
        eligible.push(conceptId);
      }
    });

    return eligible;
  }

  /**
   * Provides explainable diagnostic on why a concept is ready or blocked.
   */
  explainReadiness(
    conceptId: string,
    learnerStates: Record<string, LearnerConceptState>
  ): { isReady: boolean; explanation: string; blocking: string[] } {
    const concept = this.concepts.get(conceptId);
    if (!concept) {
      return { isReady: false, explanation: 'Concept not found in graph.', blocking: [] };
    }

    const missing = this.getMissingPrerequisites(conceptId, learnerStates);
    if (missing.length === 0) {
      return {
        isReady: true,
        explanation: `All prerequisite concepts are fulfilled. You are ready to study "${concept.title}".`,
        blocking: [],
      };
    }

    const missingTitles = missing
      .map((id) => this.concepts.get(id)?.title || id)
      .join(', ');

    return {
      isReady: false,
      explanation: `Requires understanding prerequisites first: ${missingTitles}.`,
      blocking: missing,
    };
  }
}

