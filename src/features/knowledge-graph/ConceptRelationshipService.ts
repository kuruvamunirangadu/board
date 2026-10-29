/**
 * VisiOS — Phase 11: Concept Relationship Service
 * Multi-domain knowledge graph connecting concepts across Mathematics, Physics,
 * Computer Science, Biology, and Chemistry. Maintains canonical nodes and cross-subject relationships.
 */

import {
  IntelligentConceptNode,
  ConceptRelationshipEdge,
  ConceptDomain,
  RelationshipType,
  RelationshipStrength,
  ConceptDocumentProvenance,
} from './KnowledgeGraphContracts';
import { KnowledgeGraphValidator } from './KnowledgeGraphValidator';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class ConceptRelationshipService {
  private concepts: Map<string, IntelligentConceptNode> = new Map();
  private relationships: Map<string, ConceptRelationshipEdge> = new Map();

  constructor() {
    this.initializeDefaultGraph();
  }

  /**
   * Populate graph with canonical curriculum concepts and cross-domain bridges.
   */
  private initializeDefaultGraph(): void {
    // 1. Ingest trusted curriculum concepts
    for (const [id, c] of Object.entries(TRUSTED_CONCEPT_REGISTRY)) {
      this.concepts.set(id, {
        id: c.id,
        title: c.title,
        domain: (c.domain as ConceptDomain) || 'interdisciplinary',
        topic: c.topic,
        summary: c.objectives ? c.objectives.join('. ') : c.title,
        difficulty: (c.difficulty as 'beginner' | 'intermediate' | 'advanced') || 'beginner',
        estimatedMinutes: c.estimatedMinutes || 15,
        learningObjectives: c.objectives || [],
        prerequisiteIds: [...(c.prerequisiteIds || [])],
        canonicalRenderer: c.domain === 'physics' ? 'physics_engine' : c.domain === 'mathematics' ? 'coordinate_plane' : 'algorithm_visualizer',
      });
    }

    // 2. Add vital bridging concepts
    const bridgingConcepts: IntelligentConceptNode[] = [
      {
        id: 'math_logarithms',
        title: 'Logarithms & Inverted Exponents',
        domain: 'mathematics',
        topic: 'Algebra & Functions',
        summary: 'Understanding log_b(x) as the inverse of exponentiation, power laws, and division-by-two search spaces.',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        learningObjectives: [
          'Understand logarithms as the inverse of exponentiation: b^y = x <=> log_b(x) = y',
          'Calculate binary logarithms: log2(1024) = 10',
          'Model halving processes and recursive tree depths',
        ],
        prerequisiteIds: ['math_exponential_function'],
        canonicalRenderer: 'coordinate_plane',
      },
      {
        id: 'math_derivatives',
        title: 'Differential Calculus & Instantaneous Rates',
        domain: 'mathematics',
        topic: 'Calculus',
        summary: 'Instantaneous rate of change dy/dx, tangents, limits, and derivative rules.',
        difficulty: 'advanced',
        estimatedMinutes: 25,
        learningObjectives: [
          'Understand derivative as instantaneous limit of (f(x+h) - f(x))/h',
          'Calculate polynomial derivatives via power rule',
          'Connect slope of tangent line to instantaneous velocity and function extrema',
        ],
        prerequisiteIds: ['math_linear_functions'],
        canonicalRenderer: 'coordinate_plane',
      },
      {
        id: 'math_matrix_operations',
        title: 'Matrices & Linear Transformations',
        domain: 'mathematics',
        topic: 'Linear Algebra',
        summary: 'Vector spaces, matrix multiplication, transformations, and coordinate projections.',
        difficulty: 'advanced',
        estimatedMinutes: 30,
        learningObjectives: [
          'Perform dot products and matrix multiplications',
          'Represent linear transformations in multi-dimensional space',
        ],
        prerequisiteIds: ['math_linear_equations', 'math_cartesian_plane'],
        canonicalRenderer: 'coordinate_plane',
      },
      {
        id: 'cs_gradient_descent',
        title: 'Gradient Descent & Cost Optimization',
        domain: 'computer_science',
        topic: 'Machine Learning',
        summary: 'Iterative optimization algorithm for finding local minima of a differentiable loss function.',
        difficulty: 'advanced',
        estimatedMinutes: 25,
        learningObjectives: [
          'Compute gradient vectors of multivariate objective loss functions',
          'Update parameters iteratively: w = w - alpha * grad(L)',
          'Avoid local minima and manage learning rates',
        ],
        prerequisiteIds: ['cs_variables_types', 'math_derivatives'],
        canonicalRenderer: 'algorithm_visualizer',
      },
      {
        id: 'cs_neural_networks',
        title: 'Artificial Neural Networks & Perceptrons',
        domain: 'computer_science',
        topic: 'Machine Learning',
        summary: 'Interconnected layers of computational nodes with learned weights and activation functions.',
        difficulty: 'advanced',
        estimatedMinutes: 35,
        learningObjectives: [
          'Understand artificial neuron model: output = activation(sum(w_i * x_i) + b)',
          'Propagate inputs forward through multi-layer architectures',
          'Train network weights via backpropagation and gradient descent',
        ],
        prerequisiteIds: ['cs_gradient_descent', 'math_matrix_operations'],
        canonicalRenderer: 'algorithm_visualizer',
      },
      {
        id: 'chem_reaction_kinetics',
        title: 'Chemical Reaction Rates & Kinetics',
        domain: 'chemistry',
        topic: 'Physical Chemistry',
        summary: 'Rate of consumption and production in chemical reactions over time.',
        difficulty: 'intermediate',
        estimatedMinutes: 20,
        learningObjectives: [
          'Relate reactant concentration changes to rate of reaction',
          'Apply collision theory and activation energy concepts',
        ],
        prerequisiteIds: ['chem_chemical_bonding', 'math_linear_functions'],
        canonicalRenderer: 'chemistry_visualizer',
      },
    ];

    for (const concept of bridgingConcepts) {
      if (!this.concepts.has(concept.id)) {
        this.concepts.set(concept.id, concept);
      }
    }

    // 3. Register intra-domain prerequisite edges
    for (const [id, c] of Array.from(this.concepts.entries())) {
      for (const prereqId of c.prerequisiteIds) {
        if (this.concepts.has(prereqId)) {
          const edgeId = `edge_prereq_${prereqId}_to_${id}`;
          const isCross = this.concepts.get(prereqId)!.domain !== c.domain;
          this.relationships.set(edgeId, {
            id: edgeId,
            sourceConceptId: prereqId,
            targetConceptId: id,
            relationshipType: 'prerequisite',
            strength: 'essential',
            rationale: `${this.concepts.get(prereqId)!.title} is required foundational knowledge for ${c.title}.`,
            crossDomain: isCross,
          });
        }
      }
    }

    // 4. Register canonical cross-domain relationships
    const canonicalCrossEdges: Array<{
      source: string;
      target: string;
      type: RelationshipType;
      strength: RelationshipStrength;
      rationale: string;
    }> = [
      {
        source: 'math_logarithms',
        target: 'cs_binary_search',
        type: 'applies_to',
        strength: 'essential',
        rationale: 'Binary search recursively halves its problem space (N / 2^k = 1), meaning the maximum number of steps is strictly determined by log2(N).',
      },
      {
        source: 'math_logarithms',
        target: 'cs_time_complexity',
        type: 'cross_domain_connection',
        strength: 'essential',
        rationale: 'Logarithmic growth models asymptotic O(log n) algorithm scaling, contrasting with linear O(n) and quadratic O(n^2) behaviors.',
      },
      {
        source: 'math_linear_functions',
        target: 'phys_kinematics_velocity',
        type: 'analogous_to',
        strength: 'essential',
        rationale: 'The constant-acceleration kinematic velocity formula v(t) = v0 + at is structurally isomorphic to the linear equation y = c + mx, where acceleration a is the slope and initial velocity v0 is the y-intercept.',
      },
      {
        source: 'math_derivatives',
        target: 'phys_kinematics_velocity',
        type: 'applies_to',
        strength: 'essential',
        rationale: 'Instantaneous velocity is defined as the time derivative of position v(t) = dx/dt, and acceleration is the derivative of velocity a(t) = dv/dt.',
      },
      {
        source: 'math_derivatives',
        target: 'cs_gradient_descent',
        type: 'applies_to',
        strength: 'essential',
        rationale: 'Gradient descent relies on computing partial derivatives of the loss function with respect to weights to step in the direction of steepest descent.',
      },
      {
        source: 'bio_neurons_synapses',
        target: 'cs_neural_networks',
        type: 'analogous_to',
        strength: 'recommended',
        rationale: 'Artificial neural network nodes and synaptic weights are directly inspired by biological neurons, dendrites, and action-potential activation thresholds.',
      },
      {
        source: 'math_euclidean_distance',
        target: 'phys_units_vectors',
        type: 'cross_domain_connection',
        strength: 'recommended',
        rationale: 'The Euclidean distance metric sqrt(dx^2 + dy^2) is used to compute vector displacement and velocity magnitudes in Cartesian physical space.',
      },
      {
        source: 'chem_reaction_kinetics',
        target: 'math_linear_functions',
        type: 'reinforcement',
        strength: 'supplementary',
        rationale: 'Zero-order chemical reactions exhibit linear reactant decay over time, providing physical reinforcement of negative slope linear functions.',
      },
    ];

    for (const rel of canonicalCrossEdges) {
      if (this.concepts.has(rel.source) && this.concepts.has(rel.target)) {
        const edgeId = `edge_${rel.type}_${rel.source}_to_${rel.target}`;
        const sourceConcept = this.concepts.get(rel.source)!;
        const targetConcept = this.concepts.get(rel.target)!;
        this.relationships.set(edgeId, {
          id: edgeId,
          sourceConceptId: rel.source,
          targetConceptId: rel.target,
          relationshipType: rel.type,
          strength: rel.strength,
          rationale: rel.rationale,
          crossDomain: sourceConcept.domain !== targetConcept.domain,
        });
      }
    }
  }

  /**
   * Register or update a concept in the graph.
   */
  public registerConcept(concept: IntelligentConceptNode): { success: boolean; error?: string } {
    const validation = KnowledgeGraphValidator.validateConcept(concept);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    this.concepts.set(concept.id, { ...concept });
    return { success: true };
  }

  /**
   * Retrieve a concept node by its unique ID.
   */
  public getConcept(id: string): IntelligentConceptNode | undefined {
    return this.concepts.get(id);
  }

  /**
   * Return all known concepts.
   */
  public getAllConcepts(): IntelligentConceptNode[] {
    return Array.from(this.concepts.values());
  }

  /**
   * Return concepts by domain.
   */
  public getConceptsByDomain(domain: ConceptDomain): IntelligentConceptNode[] {
    return Array.from(this.concepts.values()).filter((c) => c.domain === domain);
  }

  /**
   * Add a relationship edge between two concepts with cycle detection and validation.
   */
  public addRelationship(edge: ConceptRelationshipEdge): { success: boolean; error?: string } {
    const knownIds = new Set(Array.from(this.concepts.keys()));
    const validation = KnowledgeGraphValidator.validateRelationship(edge, knownIds);
    if (!validation.valid) {
      return { success: false, error: validation.errors.join(' ') };
    }

    // Check for cycles if relationship is 'prerequisite'
    if (edge.relationshipType === 'prerequisite') {
      const prereqAdj = this.getPrerequisiteAdjacencyMap();
      const cycleCheck = KnowledgeGraphValidator.checkPrerequisiteCycle(
        edge.sourceConceptId,
        edge.targetConceptId,
        prereqAdj
      );
      if (cycleCheck.hasCycle) {
        return {
          success: false,
          error: `Cycle detected: adding prerequisite "${edge.sourceConceptId}" -> "${edge.targetConceptId}" creates circular dependency (${cycleCheck.cyclePath?.join(' -> ')}).`,
        };
      }

      // Also ensure target's prerequisiteIds list includes source
      const target = this.concepts.get(edge.targetConceptId);
      if (target && !target.prerequisiteIds.includes(edge.sourceConceptId)) {
        target.prerequisiteIds.push(edge.sourceConceptId);
      }
    }

    // Determine if cross domain
    const sourceNode = this.concepts.get(edge.sourceConceptId);
    const targetNode = this.concepts.get(edge.targetConceptId);
    const crossDomain = sourceNode && targetNode ? sourceNode.domain !== targetNode.domain : false;

    // Save or update edge (idempotent by edge ID or source-target-type tuple)
    const existingKey = this.findExistingEdgeId(edge.sourceConceptId, edge.targetConceptId, edge.relationshipType);
    const finalId = existingKey || edge.id;

    this.relationships.set(finalId, {
      ...edge,
      id: finalId,
      crossDomain,
    });

    return { success: true };
  }

  /**
   * Find existing edge ID for duplicate prevention.
   */
  private findExistingEdgeId(source: string, target: string, type: RelationshipType): string | undefined {
    for (const [id, edge] of Array.from(this.relationships.entries())) {
      if (edge.sourceConceptId === source && edge.targetConceptId === target && edge.relationshipType === type) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Retrieve all relationships or relationships connected to a specific concept.
   */
  public getRelationships(conceptId?: string): ConceptRelationshipEdge[] {
    const all = Array.from(this.relationships.values());
    if (!conceptId) return all;
    return all.filter((r) => r.sourceConceptId === conceptId || r.targetConceptId === conceptId);
  }

  /**
   * Retrieve outgoing relationships from a concept.
   */
  public getOutgoingRelationships(conceptId: string): ConceptRelationshipEdge[] {
    return Array.from(this.relationships.values()).filter((r) => r.sourceConceptId === conceptId);
  }

  /**
   * Retrieve incoming relationships to a concept.
   */
  public getIncomingRelationships(conceptId: string): ConceptRelationshipEdge[] {
    return Array.from(this.relationships.values()).filter((r) => r.targetConceptId === conceptId);
  }

  /**
   * Retrieve all cross-domain relationships.
   */
  public getCrossDomainRelationships(domain?: ConceptDomain): ConceptRelationshipEdge[] {
    const crossEdges = Array.from(this.relationships.values()).filter((r) => r.crossDomain);
    if (!domain) return crossEdges;
    return crossEdges.filter((r) => {
      const s = this.concepts.get(r.sourceConceptId);
      const t = this.concepts.get(r.targetConceptId);
      return s?.domain === domain || t?.domain === domain;
    });
  }

  /**
   * Attach document provenance to a concept.
   */
  public attachProvenanceToConcept(conceptId: string, provenance: ConceptDocumentProvenance): boolean {
    const concept = this.concepts.get(conceptId);
    if (!concept) return false;
    concept.provenance = provenance;
    return true;
  }

  /**
   * Update student mastery level on a concept node.
   */
  public updateStudentMastery(
    conceptId: string,
    masteryStatus: 'not_started' | 'struggling' | 'developing' | 'mastered',
    confidenceScore?: number
  ): boolean {
    const concept = this.concepts.get(conceptId);
    if (!concept) return false;
    concept.studentMasteryStatus = masteryStatus;
    if (typeof confidenceScore === 'number') {
      concept.studentConfidenceScore = confidenceScore;
    }
    return true;
  }

  /**
   * Build adjacency map for prerequisite relationships: node -> dependents that require it.
   */
  public getPrerequisiteAdjacencyMap(): Map<string, string[]> {
    const adj = new Map<string, string[]>();
    for (const edge of Array.from(this.relationships.values())) {
      if (edge.relationshipType === 'prerequisite') {
        const list = adj.get(edge.sourceConceptId) || [];
        list.push(edge.targetConceptId);
        adj.set(edge.sourceConceptId, list);
      }
    }
    return adj;
  }

  /**
   * Build reverse adjacency map: concept -> prerequisites required by it.
   */
  public getReversePrerequisiteMap(): Map<string, string[]> {
    const map = new Map<string, string[]>();
    for (const [id, c] of Array.from(this.concepts.entries())) {
      map.set(id, [...c.prerequisiteIds]);
    }
    return map;
  }
}
