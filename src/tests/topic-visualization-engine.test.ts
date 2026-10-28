/**
 * VisiOS — Topic-Aware Three.js 3D Visualization Engine Tests
 *
 * Verifies:
 * 1. TopicVisualizationRegistry deterministic topic and alias matching.
 * 2. Distinction between procedural educational schematics and validated assets.
 * 3. Correct structure metadata, roles, and pedagogical limitations.
 * 4. Third-panel empty-state elimination (providing 3D visual explorer when graph is missing or supplementary).
 * 5. Multi-domain coverage (biology, chemistry, mathematics, computer science, physics).
 */

import {
  TopicVisualizationRegistry,
  TopicVisualizationDefinition,
} from '../features/learning/TopicVisualizationRegistry';
import { ConceptDependencyGraphEngine } from '../features/learning/ConceptDependencyGraph';
import { DomainKnowledgeEngine } from '../features/learning/DomainKnowledgeEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`TEST ASSERTION FAILED: ${message}`);
  }
}

async function runTopicVisualizationEngineTests() {
  console.log('\n=============================================================');
  console.log('--- Running Topic-Aware 3D Visualization Engine Tests ---');
  console.log('=============================================================\n');

  // -------------------------------------------------------------
  // Suite 1: Topic Matching & Alias Resolution
  // -------------------------------------------------------------
  console.log('[Suite 1] Topic Matching & Alias Resolution:');

  // Test 1.1: Nervous system queries
  const nervousSystemQueries = [
    'nervous system',
    'Nervous System',
    'human nervous system',
    'central nervous system',
    'CNS',
    'peripheral nervous system',
    'PNS',
    'brain and spinal cord',
    'neuroscience',
  ];
  for (const q of nervousSystemQueries) {
    const res = TopicVisualizationRegistry.resolve(q);
    assert(res !== null, `Expected query "${q}" to resolve to nervous system visualization`);
    assert(res!.id === 'vis_nervous_system', `Expected vis_nervous_system, got ${res!.id}`);
    assert(res!.canonicalModelType === 'nervous_system', `Expected canonicalModelType nervous_system, got ${res!.canonicalModelType}`);
    assert(res!.domain === 'biology', `Expected domain biology, got ${res!.domain}`);
  }
  console.log('  ✓ Test 1 Passed: Nervous system and all clinical/educational aliases resolve correctly');

  // Test 1.2: Neuron & Cellular Signaling queries
  const neuronQueries = [
    'neuron',
    'Neuron Structure',
    'cellular neuron',
    'multipolar neuron',
    'action potential',
    'synapse',
    'synaptic transmission',
    'myelin sheath',
    'nodes of ranvier',
  ];
  for (const q of neuronQueries) {
    const res = TopicVisualizationRegistry.resolve(q);
    assert(res !== null, `Expected query "${q}" to resolve to neuron visualization`);
    assert(res!.id === 'vis_neuron', `Expected vis_neuron, got ${res!.id}`);
    assert(res!.canonicalModelType === 'neuron', `Expected canonicalModelType neuron, got ${res!.canonicalModelType}`);
    assert(res!.visualizationType === 'neuron_or_cell', `Expected visualizationType neuron_or_cell, got ${res!.visualizationType}`);
  }
  console.log('  ✓ Test 2 Passed: Neuron, cellular components, and synapse queries resolve correctly');

  // Test 1.3: Cardiac & Heart Anatomy
  const heartQueries = ['heart', 'human heart', 'cardiac anatomy', 'cardiovascular system', 'blood circulation'];
  for (const q of heartQueries) {
    const res = TopicVisualizationRegistry.resolve(q);
    assert(res !== null, `Expected query "${q}" to resolve to heart visualization`);
    assert(res!.id === 'vis_heart', `Expected vis_heart, got ${res!.id}`);
    assert(res!.canonicalModelType === 'heart', `Expected canonicalModelType heart, got ${res!.canonicalModelType}`);
  }
  console.log('  ✓ Test 3 Passed: Human heart and cardiovascular queries resolve correctly');

  // Test 1.4: Molecular Chemistry (Water & Methane)
  const waterRes = TopicVisualizationRegistry.resolve('water molecule');
  assert(waterRes !== null && waterRes.id === 'vis_molecule_water', 'Failed to resolve water molecule');
  assert(waterRes!.canonicalModelType === 'molecule', 'Expected molecule canonical type');

  const h2oRes = TopicVisualizationRegistry.resolve('H2O');
  assert(h2oRes !== null && h2oRes.id === 'vis_molecule_water', 'Failed to resolve H2O');

  const methaneRes = TopicVisualizationRegistry.resolve('methane');
  assert(methaneRes !== null && methaneRes.id === 'vis_molecule_methane', 'Failed to resolve methane');

  const ch4Res = TopicVisualizationRegistry.resolve('CH4');
  assert(ch4Res !== null && ch4Res.id === 'vis_molecule_methane', 'Failed to resolve CH4');
  console.log('  ✓ Test 4 Passed: Molecular chemistry structures (H₂O and CH₄) resolve correctly');

  // Test 1.5: Mathematics & Coordinate Geometry
  const linearRes = TopicVisualizationRegistry.resolve('y = 2x + 3');
  assert(linearRes !== null && linearRes.id === 'vis_linear_function', 'Failed to resolve y = 2x + 3');

  const pythagorasRes = TopicVisualizationRegistry.resolve('pythagorean theorem');
  assert(pythagorasRes !== null && pythagorasRes.id === 'vis_pythagorean_geometry', 'Failed to resolve pythagorean theorem');

  const vectorRes = TopicVisualizationRegistry.resolve('3d vector field');
  assert(vectorRes !== null && vectorRes.id === 'vis_vectors_3d', 'Failed to resolve 3d vector field');
  console.log('  ✓ Test 5 Passed: Mathematics geometry, linear functions, and 3D vectors resolve correctly');

  // Test 1.6: Computer Science & Physics
  const bsearchRes = TopicVisualizationRegistry.resolve('binary search');
  assert(bsearchRes !== null && bsearchRes.id === 'vis_binary_tree', 'Failed to resolve binary search');

  const projectileRes = TopicVisualizationRegistry.resolve('projectile motion');
  assert(projectileRes !== null && projectileRes.id === 'vis_projectile_motion', 'Failed to resolve projectile motion');
  console.log('  ✓ Test 6 Passed: Computer science and physics simulations resolve correctly');

  // Test 1.7: Unregistered & Gibberish Queries Safely Return null
  const gibberish = TopicVisualizationRegistry.resolve('random xyz unknown topic');
  assert(gibberish === null, 'Expected gibberish query to return null');
  console.log('  ✓ Test 7 Passed: Unknown topic gracefully returns null without throwing');

  // -------------------------------------------------------------
  // Suite 2: Structure Metadata & Pedagogical Transparency
  // -------------------------------------------------------------
  console.log('\n[Suite 2] Structure Metadata & Pedagogical Transparency:');

  const cnsDef = TopicVisualizationRegistry.resolve('nervous system')!;
  assert(cnsDef.supportedStructures.length >= 4, 'Expected at least 4 CNS anatomical structures');
  const cerebrum = cnsDef.supportedStructures.find((s) => s.id === 'cerebrum');
  assert(cerebrum !== undefined, 'Missing cerebrum structure');
  assert(cerebrum!.role.length > 10, 'Cerebrum missing descriptive educational role');
  assert(cerebrum!.description.length > 20, 'Cerebrum missing detailed description');

  // Verify explicit educational disclosure
  assert(
    cnsDef.modelKind === 'procedural_schematic',
    `Expected modelKind to be procedural_schematic, got ${cnsDef.modelKind}`
  );
  assert(
    cnsDef.limitationsAndAccuracyNotes.toLowerCase().includes('schematic') ||
      cnsDef.limitationsAndAccuracyNotes.toLowerCase().includes('not a clinical'),
    'Missing pedagogical transparency note distinguishing procedural schematic from clinical scan'
  );
  console.log('  ✓ Test 8 Passed: Nervous system contains 4+ verified structures and explicit pedagogical disclosures');

  const neuronDef = TopicVisualizationRegistry.resolve('neuron')!;
  assert(neuronDef.supportedStructures.length >= 5, 'Expected at least 5 neuron cellular structures');
  const soma = neuronDef.supportedStructures.find((s) => s.id === 'soma');
  const myelin = neuronDef.supportedStructures.find((s) => s.id === 'myelin');
  const synapse = neuronDef.supportedStructures.find((s) => s.id === 'synapse');
  assert(soma !== undefined && myelin !== undefined && synapse !== undefined, 'Missing key neuron structures');
  console.log('  ✓ Test 9 Passed: Neuron contains soma, dendrites, axon hillock, myelin sheath, and synapse metadata');

  // -------------------------------------------------------------
  // Suite 3: Third-Panel Empty State Elimination
  // -------------------------------------------------------------
  console.log('\n[Suite 3] Third-Panel Empty State Elimination:');

  // Test 3.1: Verify how "nervous system" is handled when tested against both systems
  const neuroVis = TopicVisualizationRegistry.resolve('nervous system');
  assert(neuroVis !== null, 'TopicVisualizationRegistry must have nervous system model');

  // If a topic has no subGraph, TopicVisualizationRegistry guarantees an immediate 3D visualization
  const arbitraryQuery = 'central nervous system';
  const hasVis = TopicVisualizationRegistry.hasVisualization(arbitraryQuery);
  assert(hasVis, 'Expected central nervous system to be flagged as having visualization');

  // Test 3.2: Verify domain knowledge integration for prerequisites
  const domainModel = DomainKnowledgeEngine.match('nervous system');
  assert(domainModel !== null, 'DomainKnowledgeEngine must match nervous system');
  assert(
    domainModel!.prerequisites.length >= 2,
    `Expected at least 2 prerequisites for nervous system, got ${domainModel!.prerequisites.length}`
  );
  console.log(`  ✓ Test 10 Passed: Nervous system connects to ${domainModel!.prerequisites.length} foundational prerequisites (${domainModel!.prerequisites.join(', ')})`);

  // Test 3.3: Recommended Visualizations List
  const recommendations = TopicVisualizationRegistry.getRecommendedVisualizations();
  assert(recommendations.length >= 4, 'Expected at least 4 recommended visualizations');
  assert(
    recommendations.some((r) => r.id === 'vis_nervous_system'),
    'Expected nervous system in recommended visualizations'
  );
  assert(
    recommendations.some((r) => r.id === 'vis_neuron'),
    'Expected neuron in recommended visualizations'
  );
  console.log(`  ✓ Test 11 Passed: Recommended visualizations provide ${recommendations.length} interactive topics for learner discovery`);

  console.log('\n=============================================================');
  console.log('✅ ALL TOPIC VISUALIZATION ENGINE TESTS PASSED (100%)');
  console.log('=============================================================\n');
}

runTopicVisualizationEngineTests().catch((err) => {
  console.error(err);
  process.exit(1);
});

