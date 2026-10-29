/**
 * VisiOS — Phase 11: Cross-Topic Reasoning Service
 * Explains deep conceptual connections across Mathematics, Physics, Computer Science, and Biology.
 * Provides multi-hop reasoning path discovery and shared mathematical invariant synthesis.
 */

import {
  CrossTopicConnection,
  MultiHopReasoningResult,
  ConceptRelationshipEdge,
  IntelligentConceptNode,
} from './KnowledgeGraphContracts';
import { ConceptRelationshipService } from './ConceptRelationshipService';
import { PrerequisiteResolver } from './PrerequisiteResolver';

export class CrossTopicReasoningService {
  private relationshipService: ConceptRelationshipService;
  private prerequisiteResolver: PrerequisiteResolver;

  constructor(
    relationshipService: ConceptRelationshipService,
    prerequisiteResolver: PrerequisiteResolver
  ) {
    this.relationshipService = relationshipService;
    this.prerequisiteResolver = prerequisiteResolver;
  }

  /**
   * Find connections between two specific concepts across domains.
   */
  public explainConnection(conceptIdA: string, conceptIdB: string): CrossTopicConnection | null {
    const nodeA = this.relationshipService.getConcept(conceptIdA);
    const nodeB = this.relationshipService.getConcept(conceptIdB);
    if (!nodeA || !nodeB) return null;

    // Check direct relationships - prefer semantic/cross-domain over generic prerequisite
    const edges = this.relationshipService.getRelationships();
    const matchingEdges = edges.filter(
      (e) =>
        (e.sourceConceptId === conceptIdA && e.targetConceptId === conceptIdB) ||
        (e.sourceConceptId === conceptIdB && e.targetConceptId === conceptIdA)
    );

    if (matchingEdges.length > 0) {
      // Pick crossDomain or non-prerequisite edge if available
      const bestEdge =
        matchingEdges.find((e) => e.relationshipType !== 'prerequisite') || matchingEdges[0];
      return this.formatConnection(bestEdge, nodeA, nodeB);
    }

    // Try finding a 2-hop or shortest path
    const multiHop = this.findReasoningPath(conceptIdA, conceptIdB);
    if (multiHop && multiHop.connectionsFound.length > 0) {
      return multiHop.connectionsFound[0];
    }

    return null;
  }

  /**
   * Answer a cross-topic query using multi-hop graph search and explainable synthesis.
   */
  public queryCrossTopicReasoning(query: string, startConceptId: string, endConceptId?: string): MultiHopReasoningResult {
    const startNode = this.relationshipService.getConcept(startConceptId);
    if (!startNode) {
      return {
        query,
        startConceptId,
        endConceptId,
        path: [],
        synthesis: `Concept "${startConceptId}" not found in knowledge graph.`,
        connectionsFound: [],
        prerequisitesAddressed: [],
      };
    }

    // If target concept is specified, find the shortest path
    if (endConceptId) {
      const pathResult = this.findReasoningPath(startConceptId, endConceptId, query);
      if (pathResult) {
        return pathResult;
      }
    }

    // If no target concept specified, inspect outbound and inbound relationships for rich synthesis
    const connectedEdges = this.relationshipService.getRelationships(startConceptId);
    const crossEdges = connectedEdges.filter((e) => e.crossDomain);
    const connectionsFound: CrossTopicConnection[] = [];

    for (const edge of crossEdges) {
      const otherId = edge.sourceConceptId === startConceptId ? edge.targetConceptId : edge.sourceConceptId;
      const otherNode = this.relationshipService.getConcept(otherId);
      if (otherNode) {
        connectionsFound.push(this.formatConnection(edge, startNode, otherNode));
      }
    }

    const prereqRes = this.prerequisiteResolver.resolvePrerequisites(startConceptId);

    const synthesis = this.generateAutonomousSynthesis(startNode, connectionsFound, prereqRes.transitivePrerequisites);

    return {
      query,
      startConceptId,
      endConceptId,
      path: [{ conceptId: startNode.id, title: startNode.title, domain: startNode.domain }],
      synthesis,
      connectionsFound,
      prerequisitesAddressed: prereqRes.transitivePrerequisites,
    };
  }

  /**
   * Breadth-First Search (BFS) to find the shortest reasoning path between two concepts.
   */
  public findReasoningPath(startId: string, endId: string, queryStr?: string): MultiHopReasoningResult | null {
    const startNode = this.relationshipService.getConcept(startId);
    const endNode = this.relationshipService.getConcept(endId);
    if (!startNode || !endNode) return null;

    if (startId === endId) {
      return {
        query: queryStr || `Path from ${startNode.title} to ${endNode.title}`,
        startConceptId: startId,
        endConceptId: endId,
        path: [{ conceptId: startId, title: startNode.title, domain: startNode.domain }],
        synthesis: `Self-connection: ${startNode.title} is identical to itself.`,
        connectionsFound: [],
        prerequisitesAddressed: [],
      };
    }

    const queue: Array<{ conceptId: string; path: string[]; edges: ConceptRelationshipEdge[] }> = [
      { conceptId: startId, path: [startId], edges: [] },
    ];
    const visited = new Set<string>([startId]);

    let foundPath: string[] | null = null;
    let foundEdges: ConceptRelationshipEdge[] = [];

    const allEdges = this.relationshipService.getRelationships();

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.conceptId === endId) {
        foundPath = current.path;
        foundEdges = current.edges;
        break;
      }

      // Find neighbors across undirected edges
      for (const edge of allEdges) {
        let neighborId: string | null = null;
        if (edge.sourceConceptId === current.conceptId) {
          neighborId = edge.targetConceptId;
        } else if (edge.targetConceptId === current.conceptId) {
          neighborId = edge.sourceConceptId;
        }

        if (neighborId && !visited.has(neighborId)) {
          visited.add(neighborId);
          queue.push({
            conceptId: neighborId,
            path: [...current.path, neighborId],
            edges: [...current.edges, edge],
          });
        }
      }
    }

    if (!foundPath) return null;

    const pathNodes = foundPath.map((id) => {
      const n = this.relationshipService.getConcept(id)!;
      return { conceptId: n.id, title: n.title, domain: n.domain };
    });

    const connectionsFound: CrossTopicConnection[] = [];
    for (let i = 0; i < foundEdges.length; i++) {
      const edge = foundEdges[i];
      const s = this.relationshipService.getConcept(edge.sourceConceptId)!;
      const t = this.relationshipService.getConcept(edge.targetConceptId)!;
      connectionsFound.push(this.formatConnection(edge, s, t));
    }

    const synthesis = this.generateMultiHopPathSynthesis(pathNodes, connectionsFound);

    return {
      query: queryStr || `Connection between ${startNode.title} and ${endNode.title}`,
      startConceptId: startId,
      endConceptId: endId,
      path: pathNodes,
      synthesis,
      connectionsFound,
      prerequisitesAddressed: [startId, ...foundPath.slice(1, -1), endId],
    };
  }

  /**
   * Format an edge into a human-readable and structured CrossTopicConnection.
   */
  private formatConnection(
    edge: ConceptRelationshipEdge,
    nodeA: IntelligentConceptNode,
    nodeB: IntelligentConceptNode
  ): CrossTopicConnection {
    const isSourceA = edge.sourceConceptId === nodeA.id;
    const sourceNode = isSourceA ? nodeA : nodeB;
    const targetNode = isSourceA ? nodeB : nodeA;

    let sharedInvariant: string | undefined;
    let canvasSuggestion: string | undefined;

    // Detect known mathematical and physical invariants
    if (
      (sourceNode.id === 'math_logarithms' && targetNode.id === 'cs_binary_search') ||
      (sourceNode.id === 'cs_binary_search' && targetNode.id === 'math_logarithms')
    ) {
      sharedInvariant = 'N / 2^k = 1  <=>  k = log2(N)';
      canvasSuggestion = 'Dual-pane view: Coordinate curve of y = log2(x) aligned with interactive binary search tree decomposition.';
    } else if (
      (sourceNode.id === 'math_linear_functions' && targetNode.id === 'phys_kinematics_velocity') ||
      (sourceNode.id === 'phys_kinematics_velocity' && targetNode.id === 'math_linear_functions')
    ) {
      sharedInvariant = 'v(t) = v0 + at  <==>  y = c + mx  (slope m = acceleration a, intercept c = initial velocity v0)';
      canvasSuggestion = 'Side-by-side: Cartesian slope-intercept graph synchronized with real-time accelerating particle motion.';
    } else if (
      (sourceNode.id === 'math_derivatives' && targetNode.id === 'phys_kinematics_velocity') ||
      (sourceNode.id === 'phys_kinematics_velocity' && targetNode.id === 'math_derivatives')
    ) {
      sharedInvariant = 'v(t) = dx/dt,  a(t) = dv/dt = d^2x/dt^2';
      canvasSuggestion = 'Tangent slope tracer on position curve displaying instantaneous velocity.';
    } else if (
      (sourceNode.id === 'math_derivatives' && targetNode.id === 'cs_gradient_descent') ||
      (sourceNode.id === 'cs_gradient_descent' && targetNode.id === 'math_derivatives')
    ) {
      sharedInvariant = 'theta_{t+1} = theta_t - eta * grad_theta(Loss)';
      canvasSuggestion = '3D or 2D loss surface showing tangent gradient vectors stepping toward global minimum.';
    } else if (
      (sourceNode.id === 'bio_neurons_synapses' && targetNode.id === 'cs_neural_networks') ||
      (sourceNode.id === 'cs_neural_networks' && targetNode.id === 'bio_neurons_synapses')
    ) {
      sharedInvariant = 'y = sigma(sum(w_i * x_i) + b)';
      canvasSuggestion = 'Biological neuron with axon/dendrites shown adjacent to artificial perceptron node.';
    }

    return {
      sourceConceptId: sourceNode.id,
      sourceTitle: sourceNode.title,
      sourceDomain: sourceNode.domain,
      targetConceptId: targetNode.id,
      targetTitle: targetNode.title,
      targetDomain: targetNode.domain,
      relationshipType: edge.relationshipType,
      explanation: edge.rationale,
      sharedMathematicalInvariant: sharedInvariant,
      canvasVisualizationSuggestion: canvasSuggestion,
    };
  }

  /**
   * Synthesize narrative connecting a concept to cross-domain subjects.
   */
  private generateAutonomousSynthesis(
    startNode: IntelligentConceptNode,
    connections: CrossTopicConnection[],
    prereqs: string[]
  ): string {
    const lines: string[] = [
      `Concept "${startNode.title}" belongs to the ${startNode.domain} curriculum.`,
    ];

    if (prereqs.length > 0) {
      lines.push(`Foundational prerequisites: ${prereqs.join(', ')}.`);
    }

    if (connections.length > 0) {
      lines.push(`Cross-domain connections discovered (${connections.length}):`);
      for (const conn of connections) {
        lines.push(`- Connects with [${conn.targetDomain}] "${conn.targetTitle}" via ${conn.relationshipType}: ${conn.explanation}`);
        if (conn.sharedMathematicalInvariant) {
          lines.push(`  Shared invariant: ${conn.sharedMathematicalInvariant}`);
        }
      }
    } else {
      lines.push('No direct cross-domain connections registered for this node.');
    }

    return lines.join('\n');
  }

  /**
   * Synthesize a multi-step reasoning narrative along a multi-hop path.
   */
  private generateMultiHopPathSynthesis(
    pathNodes: Array<{ conceptId: string; title: string; domain: string }>,
    connections: CrossTopicConnection[]
  ): string {
    const titles = pathNodes.map((p) => `[${p.conceptId}] "${p.title}" (${p.domain})`).join(' -> ');
    const parts: string[] = [
      `Reasoning path (${pathNodes.length} steps): ${titles}`,
    ];

    for (let i = 0; i < connections.length; i++) {
      const c = connections[i];
      parts.push(`Step ${i + 1}: ${c.sourceTitle} relates to ${c.targetTitle} (${c.relationshipType}): ${c.explanation}`);
      if (c.sharedMathematicalInvariant) {
        parts.push(`  Invariant: ${c.sharedMathematicalInvariant}`);
      }
    }

    return parts.join('\n');
  }
}
