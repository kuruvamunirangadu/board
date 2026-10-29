/**
 * VisiOS — Milestone 11: Intelligent Knowledge Graph & Cross-Topic Reasoning Test Suite
 * Covers all 12 required Phase 11 verification scenarios:
 * 1. Concept creation and retrieval.
 * 2. Valid and invalid relationship types.
 * 3. Prerequisite topological ordering.
 * 4. Cycle detection in dependencies.
 * 5. Cross-subject relationship retrieval (Math <-> CS <-> Physics).
 * 6. Document provenance preservation.
 * 7. Student knowledge-state integration.
 * 8. Missing-prerequisite recommendations.
 * 9. Duplicate relationship handling.
 * 10. Graph persistence and restoration.
 * 11. Unsupported relationship rejection.
 * 12. Multi-hop reasoning and canvas layout projection.
 */

import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

import {
  KnowledgeGraphService,
  ConceptRelationshipService,
  PrerequisiteResolver,
  CrossTopicReasoningService,
  KnowledgeGraphValidator,
  KnowledgeGraphPersistence,
  IntelligentConceptNode,
  ConceptRelationshipEdge,
} from '../features/knowledge-graph';
import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';

// Helper to get a clean service instance
function createFreshService(): KnowledgeGraphService {
  KnowledgeGraphPersistence.clearState();
  return new KnowledgeGraphService();
}

// ---------------------------------------------------------------------------
// Test 1: Concept creation and retrieval across multiple domains
// ---------------------------------------------------------------------------
test('Test 1: Concept creation and retrieval across multiple domains', () => {
  const service = createFreshService();

  const csConcept = service.getConcept('cs_binary_search');
  assert.ok(csConcept, 'cs_binary_search should exist');
  assert.equal(csConcept.domain, 'computer_science');
  assert.ok(csConcept.title.includes('Binary Search'));

  const mathConcept = service.getConcept('math_logarithms');
  assert.ok(mathConcept, 'math_logarithms should exist');
  assert.equal(mathConcept.domain, 'mathematics');

  const physConcept = service.getConcept('phys_kinematics_velocity');
  assert.ok(physConcept, 'phys_kinematics_velocity should exist');
  assert.equal(physConcept.domain, 'physics');

  // Register a new custom interdisciplinary concept
  const customConcept: IntelligentConceptNode = {
    id: 'inter_quantum_computing',
    title: 'Quantum Information & Qubits',
    domain: 'interdisciplinary',
    topic: 'Quantum Computing',
    summary: 'Superposition, entanglement, and unitary linear operations.',
    difficulty: 'advanced',
    estimatedMinutes: 40,
    learningObjectives: ['Understand qubit state vectors', 'Apply Hadamard transformations'],
    prerequisiteIds: ['math_matrix_operations'],
  };

  const regResult = service.registerConcept(customConcept);
  assert.equal(regResult.success, true);

  const retrieved = service.getConcept('inter_quantum_computing');
  assert.ok(retrieved, 'Newly registered concept should be retrievable');
  assert.equal(retrieved.title, 'Quantum Information & Qubits');
  assert.equal(retrieved.domain, 'interdisciplinary');
});

// ---------------------------------------------------------------------------
// Test 2: Valid and invalid relationship types
// ---------------------------------------------------------------------------
test('Test 2: Valid and invalid relationship types validation', () => {
  const service = createFreshService();

  const validEdge: ConceptRelationshipEdge = {
    id: 'test_valid_edge',
    sourceConceptId: 'math_matrix_operations',
    targetConceptId: 'cs_neural_networks',
    relationshipType: 'applies_to',
    strength: 'essential',
    rationale: 'Matrix multiplications compute layer activations in neural networks.',
    crossDomain: true,
  };

  const addResult = service.addRelationship(validEdge);
  assert.equal(addResult.success, true);

  // Unsupported relationship type
  const invalidEdge: any = {
    id: 'test_invalid_edge',
    sourceConceptId: 'math_matrix_operations',
    targetConceptId: 'cs_neural_networks',
    relationshipType: 'telepathic_link',
    strength: 'essential',
    rationale: 'Invalid type',
    crossDomain: true,
  };

  const invalidResult = service.addRelationship(invalidEdge);
  assert.equal(invalidResult.success, false);
  assert.ok(invalidResult.error?.includes('Unsupported relationship type'));
});

// ---------------------------------------------------------------------------
// Test 3: Prerequisite topological ordering
// ---------------------------------------------------------------------------
test('Test 3: Prerequisite topological ordering resolves dependencies in correct sequence', () => {
  const service = createFreshService();

  const resolution = service.resolvePrerequisites('cs_time_complexity');
  assert.ok(resolution);
  assert.equal(resolution.targetConceptId, 'cs_time_complexity');

  // Expected chain: variables -> arrays -> sorted_arrays & comparison_ops -> binary_search -> time_complexity
  const topo = resolution.transitivePrerequisites;
  assert.ok(topo.length >= 4, `Expected at least 4 transitive prerequisites, got ${topo.length}`);

  const idxVariables = topo.indexOf('cs_variables_types');
  const idxArrays = topo.indexOf('cs_arrays_indexing');
  const idxSorted = topo.indexOf('cs_sorted_arrays');
  const idxBinarySearch = topo.indexOf('cs_binary_search');

  assert.ok(idxVariables >= 0, 'cs_variables_types must be in topological sort');
  assert.ok(idxArrays > idxVariables, 'cs_arrays_indexing must follow cs_variables_types');
  assert.ok(idxSorted > idxArrays, 'cs_sorted_arrays must follow cs_arrays_indexing');
  assert.ok(idxBinarySearch > idxSorted, 'cs_binary_search must follow cs_sorted_arrays');
});

// ---------------------------------------------------------------------------
// Test 4: Cycle detection in dependencies
// ---------------------------------------------------------------------------
test('Test 4: Cycle detection in dependencies prevents circular prerequisite edges', () => {
  const service = createFreshService();

  // Current chain: phys_units_vectors -> phys_kinematics_velocity -> phys_newton_laws
  // Attempting to make phys_newton_laws a prerequisite of phys_units_vectors must fail
  const circularEdge: ConceptRelationshipEdge = {
    id: 'edge_circular_test',
    sourceConceptId: 'phys_newton_laws',
    targetConceptId: 'phys_units_vectors',
    relationshipType: 'prerequisite',
    strength: 'essential',
    rationale: 'Creates an impossible cycle',
    crossDomain: false,
  };

  const res = service.addRelationship(circularEdge);
  assert.equal(res.success, false);
  assert.ok(res.error?.includes('Cycle detected'));
});

// ---------------------------------------------------------------------------
// Test 5: Cross-subject relationship retrieval
// ---------------------------------------------------------------------------
test('Test 5: Cross-subject relationship retrieval connects Math, CS, and Physics', () => {
  const service = createFreshService();

  const crossEdges = service.getCrossDomainRelationships();
  assert.ok(crossEdges.length >= 5, `Expected >= 5 cross domain relationships, got ${crossEdges.length}`);

  // Math logarithms -> CS binary search
  const logBs = service.explainConnection('math_logarithms', 'cs_binary_search');
  assert.ok(logBs, 'Connection math_logarithms -> cs_binary_search should exist');
  assert.ok(logBs.sharedMathematicalInvariant?.includes('log2'));
  assert.ok(logBs.canvasVisualizationSuggestion);

  // Math linear functions -> Physics velocity
  const linPhys = service.explainConnection('math_linear_functions', 'phys_kinematics_velocity');
  assert.ok(linPhys, 'Connection math_linear_functions -> phys_kinematics_velocity should exist');
  assert.ok(linPhys.sharedMathematicalInvariant?.includes('v(t) = v0 + at'));

  // Math derivatives -> CS gradient descent
  const derivGd = service.explainConnection('math_derivatives', 'cs_gradient_descent');
  assert.ok(derivGd, 'Connection math_derivatives -> cs_gradient_descent should exist');
  assert.ok(derivGd.explanation.includes('derivatives'));
});

// ---------------------------------------------------------------------------
// Test 6: Document provenance preservation
// ---------------------------------------------------------------------------
test('Test 6: Preserves and exposes document provenance citations', () => {
  const service = createFreshService();

  const attached = service.attachProvenance('math_logarithms', {
    documentId: 'doc_textbook_ch4',
    documentTitle: 'Calculus and Discrete Mathematics Volume 1',
    pageNumber: 142,
    sectionTitle: 'Section 4.3: Binary Logarithms and Search Trees',
    verbatimSnippet: 'The binary logarithm log2(N) counts how many times N can be halved before reaching 1.',
  });
  assert.equal(attached, true);

  const concept = service.getConcept('math_logarithms');
  assert.ok(concept?.provenance);
  assert.equal(concept.provenance.documentId, 'doc_textbook_ch4');
  assert.equal(concept.provenance.pageNumber, 142);
  assert.ok(concept.provenance.verbatimSnippet?.includes('halved before reaching 1'));
});

// ---------------------------------------------------------------------------
// Test 7: Student knowledge-state integration
// ---------------------------------------------------------------------------
test('Test 7: Integrates with Student Knowledge Model to determine readiness', () => {
  const service = createFreshService();
  const knowledgeModel = new KnowledgeModel();
  const studentId = 'student_test_101';

  // Seed student profile with mastery of variables and arrays
  const profile = knowledgeModel.getOrCreateProfile(studentId);
  profile.concepts['cs_variables_types'] = {
    conceptId: 'cs_variables_types',
    masteryLevel: 'mastered',
    totalAttempts: 5,
    correctAttempts: 5,
    recentAccuracy: 1.0,
    consecutiveCorrect: 5,
    confidenceScore: 0.95,
    updatedAt: new Date().toISOString(),
    identifiedMisconceptions: [],
  };
  profile.concepts['cs_arrays_indexing'] = {
    conceptId: 'cs_arrays_indexing',
    masteryLevel: 'mastered',
    totalAttempts: 6,
    correctAttempts: 6,
    recentAccuracy: 1.0,
    consecutiveCorrect: 6,
    confidenceScore: 0.98,
    updatedAt: new Date().toISOString(),
    identifiedMisconceptions: [],
  };

  const res = service.resolvePrerequisites('cs_binary_search', knowledgeModel, studentId);
  assert.equal(res.readyToLearn, false);
  assert.ok(res.missingForStudent.includes('cs_sorted_arrays'));
  assert.ok(res.missingForStudent.includes('cs_comparison_ops'));
  assert.equal(res.missingForStudent.includes('cs_variables_types'), false);
  assert.equal(res.missingForStudent.includes('cs_arrays_indexing'), false);
});

// ---------------------------------------------------------------------------
// Test 8: Missing-prerequisite recommendations
// ---------------------------------------------------------------------------
test('Test 8: Missing-prerequisite recommendations output prioritized sequence', () => {
  const service = createFreshService();

  // When student has mastered nothing
  const emptyState = new Map<string, string>();
  const res = service.resolvePrerequisites('phys_newton_laws', emptyState);

  assert.equal(res.readyToLearn, false);
  assert.deepEqual(res.missingForStudent, ['phys_units_vectors', 'phys_kinematics_velocity']);
  assert.deepEqual(res.recommendedOrder, [
    'phys_units_vectors',
    'phys_kinematics_velocity',
    'phys_newton_laws',
  ]);
});

// ---------------------------------------------------------------------------
// Test 9: Duplicate relationship handling
// ---------------------------------------------------------------------------
test('Test 9: Idempotent duplicate relationship handling prevents duplicate edges', () => {
  const service = createFreshService();

  const dupEdge: ConceptRelationshipEdge = {
    id: 'edge_dup_test',
    sourceConceptId: 'math_linear_equations',
    targetConceptId: 'math_factoring_expansion',
    relationshipType: 'prerequisite',
    strength: 'essential',
    rationale: 'First insertion',
    crossDomain: false,
  };

  const res1 = service.addRelationship(dupEdge);
  assert.equal(res1.success, true);

  const res2 = service.addRelationship({
    ...dupEdge,
    rationale: 'Second updated insertion with identical source, target, and type',
  });
  assert.equal(res2.success, true);

  // Number of relationships for this pair should not duplicate
  const matching = service
    .getRelationships('math_linear_equations')
    .filter((e) => e.targetConceptId === 'math_factoring_expansion' && e.relationshipType === 'prerequisite');

  assert.equal(matching.length, 1);
  assert.equal(matching[0].rationale, 'Second updated insertion with identical source, target, and type');
});

// ---------------------------------------------------------------------------
// Test 10: Graph persistence and restoration
// ---------------------------------------------------------------------------
test('Test 10: Graph persistence saves and restores custom concepts and relationships', () => {
  const service = createFreshService();

  const customConcept: IntelligentConceptNode = {
    id: 'bio_genetics_crispr',
    title: 'CRISPR Cas9 Gene Editing',
    domain: 'biology',
    topic: 'Molecular Biology',
    summary: 'Targeted DNA cleavage using synthetic guide RNA.',
    difficulty: 'advanced',
    estimatedMinutes: 30,
    learningObjectives: ['Understand Cas9 nuclease function'],
    prerequisiteIds: ['bio_cells_tissues'],
  };

  service.registerConcept(customConcept);
  service.persistState();

  // Create a new instance and ensure state is restored
  const restoredService = new KnowledgeGraphService();
  const retrieved = restoredService.getConcept('bio_genetics_crispr');
  assert.ok(retrieved, 'Persisted concept should be restored in new service instance');
  assert.equal(retrieved.title, 'CRISPR Cas9 Gene Editing');
});

// ---------------------------------------------------------------------------
// Test 11: Unsupported relationship rejection
// ---------------------------------------------------------------------------
test('Test 11: Unsupported relationship rejection rejects self-loops and empty IDs', () => {
  const service = createFreshService();

  const selfLoop: ConceptRelationshipEdge = {
    id: 'self_loop',
    sourceConceptId: 'cs_binary_search',
    targetConceptId: 'cs_binary_search',
    relationshipType: 'analogous_to',
    strength: 'essential',
    rationale: 'Self-referential',
    crossDomain: false,
  };

  const selfRes = service.addRelationship(selfLoop);
  assert.equal(selfRes.success, false);
  assert.ok(selfRes.error?.includes('Self-referential'));

  const emptyTarget: ConceptRelationshipEdge = {
    id: 'empty_target',
    sourceConceptId: 'cs_binary_search',
    targetConceptId: '',
    relationshipType: 'prerequisite',
    strength: 'essential',
    rationale: 'Empty target',
    crossDomain: false,
  };

  const emptyRes = service.addRelationship(emptyTarget);
  assert.equal(emptyRes.success, false);
});

// ---------------------------------------------------------------------------
// Test 12: Multi-hop reasoning and canvas layout projection
// ---------------------------------------------------------------------------
test('Test 12: Multi-hop reasoning query discovers cross-domain paths and canvas projections', () => {
  const service = createFreshService();

  // Multi-hop from bio neurons to machine learning gradient descent
  const reasoning = service.queryReasoning(
    'How does biological neural behavior connect to machine learning optimization?',
    'bio_neurons_synapses',
    'cs_gradient_descent'
  );

  assert.ok(reasoning);
  assert.ok(reasoning.path.length > 1, 'Should find multi-hop path');
  assert.ok(reasoning.connectionsFound.length > 0, 'Should return connections found');
  assert.ok(reasoning.synthesis.includes('bio_neurons_synapses'));

  // Test Canvas Layout Projection
  const canvasProjection = service.projectCanvasGraph('cs_binary_search', 2);
  assert.ok(canvasProjection.nodes.length > 1, 'Canvas projection should have multiple nodes');
  assert.ok(canvasProjection.edges.length > 0, 'Canvas projection should have edges');

  const rootNode = canvasProjection.nodes.find((n) => n.id === 'cs_binary_search');
  assert.ok(rootNode, 'Root node must exist in projection');
  assert.equal(rootNode.x, 400);
  assert.equal(rootNode.y, 300);
});
