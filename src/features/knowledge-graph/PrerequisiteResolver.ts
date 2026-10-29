/**
 * VisiOS — Phase 11: Prerequisite Resolver
 * Performs deep transitive prerequisite resolution, topological ordering (Kahn's algorithm),
 * and student mastery gap diagnosis against the Student Knowledge Model.
 */

import {
  PrerequisiteResolutionResult,
  IntelligentConceptNode,
} from './KnowledgeGraphContracts';
import { ConceptRelationshipService } from './ConceptRelationshipService';

export class PrerequisiteResolver {
  private relationshipService: ConceptRelationshipService;

  constructor(relationshipService: ConceptRelationshipService) {
    this.relationshipService = relationshipService;
  }

  /**
   * Resolve all direct and transitive prerequisites for a concept,
   * returning a topologically sorted learning sequence and diagnosing student gaps.
   */
  public resolvePrerequisites(
    conceptId: string,
    studentMasteryState?: Map<string, string> | Record<string, string>
  ): PrerequisiteResolutionResult {
    const target = this.relationshipService.getConcept(conceptId);
    if (!target) {
      return {
        targetConceptId: conceptId,
        targetConceptTitle: 'Unknown Concept',
        directPrerequisites: [],
        transitivePrerequisites: [],
        missingForStudent: [],
        readyToLearn: false,
        recommendedOrder: [],
      };
    }

    const directPrereqs = [...target.prerequisiteIds];

    // 1. Gather all transitive prerequisites via BFS / DFS
    const allPrereqIds = new Set<string>();
    const queue = [...directPrereqs];

    while (queue.length > 0) {
      const currentId = queue.shift()!;
      if (!allPrereqIds.has(currentId)) {
        allPrereqIds.add(currentId);
        const node = this.relationshipService.getConcept(currentId);
        if (node) {
          for (const nextPrereq of node.prerequisiteIds) {
            if (!allPrereqIds.has(nextPrereq)) {
              queue.push(nextPrereq);
            }
          }
        }
      }
    }

    // 2. Perform Topological Sort on all transitive prerequisites using Kahn's algorithm
    // In-degree is count of prerequisites that belong to allPrereqIds
    const inDegree = new Map<string, number>();
    const dependentsMap = new Map<string, string[]>(); // node -> items in allPrereqIds that depend on node

    for (const id of Array.from(allPrereqIds)) {
      inDegree.set(id, 0);
      dependentsMap.set(id, []);
    }

    for (const id of Array.from(allPrereqIds)) {
      const node = this.relationshipService.getConcept(id);
      if (node) {
        for (const prereq of node.prerequisiteIds) {
          if (allPrereqIds.has(prereq)) {
            // prereq must come before id
            inDegree.set(id, (inDegree.get(id) || 0) + 1);
            dependentsMap.get(prereq)!.push(id);
          }
        }
      }
    }

    const topoOrder: string[] = [];
    const zeroInDegreeQueue: string[] = [];

    for (const [id, deg] of Array.from(inDegree.entries())) {
      if (deg === 0) {
        zeroInDegreeQueue.push(id);
      }
    }

    while (zeroInDegreeQueue.length > 0) {
      const current = zeroInDegreeQueue.shift()!;
      topoOrder.push(current);

      const deps = dependentsMap.get(current) || [];
      for (const dep of deps) {
        const newDeg = (inDegree.get(dep) || 1) - 1;
        inDegree.set(dep, newDeg);
        if (newDeg === 0) {
          zeroInDegreeQueue.push(dep);
        }
      }
    }

    // Fallback if disconnected or remaining cycles
    if (topoOrder.length < allPrereqIds.size) {
      for (const id of Array.from(allPrereqIds)) {
        if (!topoOrder.includes(id)) {
          topoOrder.push(id);
        }
      }
    }

    // 3. Diagnose student mastery gaps
    const missingForStudent: string[] = [];
    const isMastered = (cid: string): boolean => {
      if (!studentMasteryState) {
        const node = this.relationshipService.getConcept(cid);
        return node?.studentMasteryStatus === 'mastered';
      }

      let status: string | undefined;
      if (studentMasteryState instanceof Map) {
        status = studentMasteryState.get(cid);
      } else {
        status = studentMasteryState[cid];
      }

      return status === 'mastered' || status === 'proficient';
    };

    for (const prereqId of topoOrder) {
      if (!isMastered(prereqId)) {
        missingForStudent.push(prereqId);
      }
    }

    const readyToLearn = missingForStudent.length === 0;

    // Recommended order: missing prerequisites in topological order, then target concept
    const recommendedOrder = [...missingForStudent, conceptId];

    return {
      targetConceptId: conceptId,
      targetConceptTitle: target.title,
      directPrerequisites: directPrereqs,
      transitivePrerequisites: topoOrder,
      missingForStudent,
      readyToLearn,
      recommendedOrder,
    };
  }

  /**
   * Find all learning paths leading to a concept.
   */
  public getPrerequisiteSubtree(conceptId: string): IntelligentConceptNode[] {
    const res = this.resolvePrerequisites(conceptId);
    const nodes: IntelligentConceptNode[] = [];
    for (const id of res.transitivePrerequisites) {
      const n = this.relationshipService.getConcept(id);
      if (n) nodes.push(n);
    }
    const target = this.relationshipService.getConcept(conceptId);
    if (target) nodes.push(target);
    return nodes;
  }
}
