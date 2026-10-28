import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  TopicVisualizationRegistry,
  TopicVisualizationDefinition,
  StructureTargetMetadata,
} from '../features/learning/TopicVisualizationRegistry';
import { TRUSTED_CONCEPT_REGISTRY } from '../features/learning/ConceptDependencyGraph';
import { SOLIDS_METADATA, SolidType } from '../components/3d/GeometricSolids3DViewer';

describe('VisiOS Milestone 6: Unified Visual Learning Experience', () => {
  // Test 1: Coverage Expansion for Supported Topics
  it('should resolve validated visualizations for all required Milestone 6 topics', () => {
    const testCases: { query: string; expectedId: string; expectedDomain: string }[] = [
      { query: 'Nervous system', expectedId: 'vis_nervous_system', expectedDomain: 'biology' },
      { query: 'Human brain and spinal cord', expectedId: 'vis_nervous_system', expectedDomain: 'biology' },
      { query: 'Neuron and action potential', expectedId: 'vis_neuron', expectedDomain: 'biology' },
      { query: 'Synaptic transmission', expectedId: 'vis_neuron', expectedDomain: 'biology' },
      { query: 'Human heart anatomy', expectedId: 'vis_heart', expectedDomain: 'biology' },
      { query: 'Cardiac cycle and blood flow', expectedId: 'vis_heart', expectedDomain: 'biology' },
      { query: 'Water molecule H2O', expectedId: 'vis_molecule_water', expectedDomain: 'chemistry' },
      { query: 'Methane CH4 tetrahedral', expectedId: 'vis_molecule_methane', expectedDomain: 'chemistry' },
      { query: 'CO2 carbon dioxide molecule', expectedId: 'vis_molecule_water', expectedDomain: 'chemistry' },
      { query: 'Platonic solids and polyhedra', expectedId: 'vis_geometric_solids', expectedDomain: 'mathematics' },
      { query: 'Cube and octahedron geometry', expectedId: 'vis_geometric_solids', expectedDomain: 'mathematics' },
      { query: 'Euler characteristic V - E + F = 2', expectedId: 'vis_geometric_solids', expectedDomain: 'mathematics' },
    ];

    for (const tc of testCases) {
      const def = TopicVisualizationRegistry.resolve(tc.query);
      assert.ok(def, `Expected visualization definition for "${tc.query}"`);
      assert.strictEqual(
        def.id,
        tc.expectedId,
        `Expected ${tc.expectedId} for "${tc.query}", got ${def.id}`
      );
      assert.strictEqual(
        def.domain,
        tc.expectedDomain,
        `Expected domain ${tc.expectedDomain} for "${tc.query}", got ${def.domain}`
      );
    }
  });

  // Test 2: Standardized Metadata Contract
  it('should conform to the standardized visualization metadata contract', () => {
    const definitions = TopicVisualizationRegistry.getAllDefinitions();
    assert.ok(definitions.length >= 8, 'Expected at least 8 registered visualizations');

    for (const def of definitions) {
      assert.ok(def.id, 'Definition must have an id');
      assert.ok(def.displayName, `Definition ${def.id} must have a displayName`);
      assert.ok(def.domain, `Definition ${def.id} must have a domain`);
      assert.ok(def.visualizationType, `Definition ${def.id} must have a visualizationType`);
      assert.ok(def.rendererType, `Definition ${def.id} must have a rendererType`);
      assert.ok(def.modelKind, `Definition ${def.id} must have a modelKind`);
      assert.ok(
        def.limitationsAndAccuracyNotes && def.limitationsAndAccuracyNotes.length > 10,
        `Definition ${def.id} must provide explicit pedagogical limitations & accuracy notes`
      );
      assert.ok(
        Array.isArray(def.supportedStructures) && def.supportedStructures.length > 0,
        `Definition ${def.id} must define at least one inspectable structure target`
      );
      assert.ok(
        Array.isArray(def.supportedInteractions) && def.supportedInteractions.length > 0,
        `Definition ${def.id} must define supported interactions`
      );
    }
  });

  // Test 3: Connected Visuals to Curriculum & Lesson Links
  it('should provide grounded curriculum links and action targets for all structures', () => {
    const definitions = TopicVisualizationRegistry.getAllDefinitions();
    const registryConceptIds = new Set(Object.keys(TRUSTED_CONCEPT_REGISTRY));

    let totalStructuresWithCurriculumLinks = 0;

    for (const def of definitions) {
      for (const struct of def.supportedStructures) {
        assert.ok(struct.id, `Structure in ${def.id} must have an id`);
        assert.ok(struct.name, `Structure in ${def.id} must have a name`);
        assert.ok(struct.category, `Structure in ${def.id} must have a category`);
        assert.ok(struct.description, `Structure in ${def.id} must have a description`);
        assert.ok(struct.role, `Structure in ${def.id} must have a role`);

        if (struct.linkedConceptId) {
          totalStructuresWithCurriculumLinks++;
          assert.ok(
            registryConceptIds.has(struct.linkedConceptId),
            `Structure ${struct.id} in ${def.id} links to unknown conceptId: "${struct.linkedConceptId}"`
          );
          assert.ok(
            struct.linkedTopicQuery,
            `Structure ${struct.id} has linkedConceptId but missing linkedTopicQuery`
          );
        }
      }
    }

    assert.ok(
      totalStructuresWithCurriculumLinks >= 20,
      `Expected at least 20 structures with verified curriculum links, found ${totalStructuresWithCurriculumLinks}`
    );
  });

  // Test 4: Learning Objectives and Next Action Pathways
  it('should contain verified learning objectives and next actions across key STEM models', () => {
    const keyModels = [
      'vis_nervous_system',
      'vis_neuron',
      'vis_heart',
      'vis_molecule_water',
      'vis_molecule_methane',
      'vis_geometric_solids',
    ];

    for (const modelId of keyModels) {
      const def = TopicVisualizationRegistry.getById(modelId);
      assert.ok(def, `Expected model ${modelId} to exist`);
      assert.ok(
        Array.isArray(def.learningObjectives) && def.learningObjectives.length >= 2,
        `Model ${modelId} must define at least 2 learning objectives`
      );
      assert.ok(
        Array.isArray(def.nextActions) && def.nextActions.length >= 1,
        `Model ${modelId} must define at least 1 next action link`
      );
      for (const action of def.nextActions) {
        assert.ok(action.id, 'Action must have an id');
        assert.ok(action.label, 'Action must have a label');
        assert.ok(action.topicQuery, 'Action must have a target topicQuery');
      }
    }
  });

  // Test 5: Geometric Solids Euler Characteristic and Formulas Verification
  it('should verify Euler characteristic V - E + F = 2 and geometric invariants for polyhedra', () => {
    const regularPolyhedra: SolidType[] = [
      'tetrahedron',
      'cube',
      'octahedron',
      'dodecahedron',
      'icosahedron',
    ];

    for (const solid of regularPolyhedra) {
      const meta = SOLIDS_METADATA[solid];
      assert.ok(meta, `Metadata for solid "${solid}" must exist`);
      const { vertices, edges, faces, eulerCharacteristic } = meta;

      // Invariant: V - E + F must strictly equal 2 for convex polyhedra
      const calculatedEuler = vertices - edges + faces;
      assert.strictEqual(
        calculatedEuler,
        2,
        `Solid ${meta.name} violated Euler's formula: ${vertices} - ${edges} + ${faces} = ${calculatedEuler} (expected 2)`
      );
      assert.strictEqual(
        eulerCharacteristic,
        2,
        `Solid ${meta.name} eulerCharacteristic metadata must equal 2`
      );

      // Formulas must be present
      assert.ok(meta.formulaSurface && meta.formulaSurface.includes('A ='), `${solid} must have surface formula`);
      assert.ok(meta.formulaVolume && meta.formulaVolume.includes('V ='), `${solid} must have volume formula`);
      assert.ok(meta.symmetry, `${solid} must specify symmetry group`);
    }
  });

  // Test 6: Pedagogical Accuracy & Limitations Disclosure
  it('should declare genuine provenance and disclaimers for procedural representations', () => {
    const proceduralModels = [
      'vis_nervous_system',
      'vis_neuron',
      'vis_heart',
      'vis_geometric_solids',
      'vis_molecule_water',
    ];

    for (const id of proceduralModels) {
      const def = TopicVisualizationRegistry.getById(id);
      assert.ok(def, `Model ${id} should exist`);
      assert.strictEqual(
        def.modelKind,
        'procedural_schematic',
        `Model ${id} must be transparently declared as procedural_schematic`
      );
      assert.ok(
        def.limitationsAndAccuracyNotes.toLowerCase().includes('educational') ||
          def.limitationsAndAccuracyNotes.toLowerCase().includes('schematic') ||
          def.limitationsAndAccuracyNotes.toLowerCase().includes('idealized') ||
          def.limitationsAndAccuracyNotes.toLowerCase().includes('simplified'),
        `Model ${id} limitations note must clearly state its educational schematic nature`
      );
    }
  });
});
