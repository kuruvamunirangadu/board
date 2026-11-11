/**
 * VisiOS — Open-Source Scientific Adapter Architecture Tests
 *
 * Verifies the common scientific adapter architecture, registry,
 * and individual integrations:
 * - JupyterLite / Pyodide
 * - Ketcher
 * - Rapier
 * - Mol*
 * - Manim
 */

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ScientificEngineRegistry,
  PhysicsRapierAdapter,
  ChemistryKetcherAdapter,
  BiologyMolStarAdapter,
  MathManimAdapter,
  PyodideNotebookAdapter,
} from '../features/scientific-adapters';

test('1. ScientificEngineRegistry initializes and registers all 5 core adapters', () => {
  const registry = ScientificEngineRegistry.getInstance();
  const allMeta = registry.getAllMetadata();

  assert.equal(allMeta.length, 5, 'Registry must register exactly 5 core scientific adapters');

  const ids = allMeta.map((m) => m.id);
  assert.ok(ids.includes('pyodide'), 'Must register pyodide/jupyterlite adapter');
  assert.ok(ids.includes('ketcher'), 'Must register ketcher adapter');
  assert.ok(ids.includes('rapier'), 'Must register rapier adapter');
  assert.ok(ids.includes('molstar'), 'Must register molstar adapter');
  assert.ok(ids.includes('manim'), 'Must register manim adapter');
});

test('2. Adapters declare licenses, capabilities, versions, and resource limits', () => {
  const registry = ScientificEngineRegistry.getInstance();
  const allMeta = registry.getAllMetadata();

  for (const meta of allMeta) {
    assert.ok(meta.name.length > 0, `${meta.id} must have a non-empty name`);
    assert.ok(meta.version.length > 0, `${meta.id} must declare version`);
    assert.ok(meta.license.length > 0, `${meta.id} must declare open source license`);
    assert.ok(meta.licenseNotice.length > 0, `${meta.id} must declare license notice`);
    assert.ok(meta.capabilities.length >= 3, `${meta.id} must declare at least 3 capabilities`);
    assert.ok(meta.resourceLimits.maxMemoryMb > 0, `${meta.id} must specify maxMemoryMb`);
    assert.ok(meta.resourceLimits.maxExecutionTimeMs > 0, `${meta.id} must specify maxExecutionTimeMs`);
  }
});

test('3. ScientificEngineRegistry queries health of all adapters', async () => {
  const registry = ScientificEngineRegistry.getInstance();
  const health = await registry.checkAllHealth();

  assert.equal(health.ketcher, 'available');
  assert.equal(health.molstar, 'available');
  assert.equal(health.manim, 'available');
  assert.equal(health.pyodide, 'available');
  assert.ok(health.rapier === 'available' || health.rapier === 'degraded');
});

test('4. PhysicsRapierAdapter simulates rigid body dynamics and ground collision', async () => {
  const adapter = new PhysicsRapierAdapter();
  await adapter.initWasm();

  const world = adapter.createWorld(-9.81);
  assert.ok(world, 'Must create valid Rapier world');

  adapter.addGround(0, 20, 0.5);
  adapter.addBall(0, 5, 0.5, 0.8);

  // Step 60 frames (1 second of simulation)
  let lastSnapshot = adapter.step(1 / 60);
  for (let i = 0; i < 59; i++) {
    lastSnapshot = adapter.step(1 / 60);
  }

  const ball = lastSnapshot.find((b) => b.type === 'dynamic');
  assert.ok(ball, 'Dynamic sphere must exist in snapshot');
  assert.ok(ball.y < 5, 'Sphere must fall under gravity (y < 5)');
  assert.ok(ball.y >= 0.4, 'Sphere must rest above or bounce on ground');

  adapter.reset();
});

test('5. ChemistryKetcherAdapter translates drawn structures to SMILES and validates valency', async () => {
  const adapter = new ChemistryKetcherAdapter();

  // Test Ethanol (CCO)
  const ethanol = {
    atoms: [
      { id: 1, label: 'C', x: 0, y: 0 },
      { id: 2, label: 'C', x: 1.5, y: 0 },
      { id: 3, label: 'O', x: 2.5, y: 1 },
    ],
    bonds: [
      { fromAtomId: 1, toAtomId: 2, order: 1 as const },
      { fromAtomId: 2, toAtomId: 3, order: 1 as const },
    ],
  };

  const smiles = adapter.structureToSmiles(ethanol);
  assert.equal(smiles, 'CCO');

  const svg = adapter.generateSvgPreview(ethanol);
  assert.ok(svg.includes('<svg'), 'Must produce valid SVG markup');
  assert.ok(svg.includes('CCO') || svg.includes('<circle'), 'Must render atoms');

  // Test valency validation error (pentavalent carbon with 5 bonds)
  const hypervalent = {
    atoms: [
      { id: 1, label: 'C', x: 0, y: 0 },
      { id: 2, label: 'H', x: 1, y: 0 },
      { id: 3, label: 'H', x: -1, y: 0 },
      { id: 4, label: 'H', x: 0, y: 1 },
      { id: 5, label: 'H', x: 0, y: -1 },
      { id: 6, label: 'H', x: 1, y: 1 },
    ],
    bonds: [
      { fromAtomId: 1, toAtomId: 2, order: 1 as const },
      { fromAtomId: 1, toAtomId: 3, order: 1 as const },
      { fromAtomId: 1, toAtomId: 4, order: 1 as const },
      { fromAtomId: 1, toAtomId: 5, order: 1 as const },
      { fromAtomId: 1, toAtomId: 6, order: 1 as const },
    ],
  };

  const valencyResult = await adapter.execute({
    action: 'validate_structure',
    payload: { structure: hypervalent },
  });

  assert.equal(valencyResult.output.isValid, false);
  assert.ok(valencyResult.output.errors.length > 0, 'Must flag hypervalent atom');
});

test('6. BiologyMolStarAdapter parses PDB data and calculates secondary structure ratios', async () => {
  const adapter = new BiologyMolStarAdapter();

  const pdbText = `HEADER    TEST PROTEIN
HELIX    1   1 GLY A    1  VAL A    6  1                                   6
SHEET    1   A 2 ILE A   10  LEU A   14  0                                5
ATOM      1  N   GLY A   1      11.104  13.207   9.123  1.00 20.00           N
ATOM      2  CA  GLY A   1      12.560  13.207   9.123  1.00 20.00           C
ATOM      3  C   GLY A   1      13.100  14.600   9.500  1.00 20.00           C
ATOM      4  O   GLY A   1      12.400  15.600   9.300  1.00 20.00           O
HETATM    5  ZN  ZN  A  50      15.000  15.000  15.000  1.00 30.00          ZN
TER
END`;

  const analysis = adapter.parsePdb(pdbText);
  assert.equal(analysis.title, 'TEST PROTEIN');
  assert.equal(analysis.chains.length, 1);
  assert.equal(analysis.chains[0].chainId, 'A');
  assert.ok(analysis.ligands.includes('ZN'));
  assert.ok(analysis.totalAtoms >= 4);
});

test('7. MathManimAdapter generates Python Manim Community scene script and SVG keyframes', async () => {
  const adapter = new MathManimAdapter();

  const steps = [
    { latex: 'tan^2(x) + cot^2(x)', explanation: 'Initial problem expression' },
    { latex: '4csc^2(2x) - 2', explanation: 'Canonical double-angle identity' },
  ];

  const script = adapter.generatePythonScript('TanCotScene', 'Trigonometric Derivation', steps);
  assert.ok(script.includes('from manim import *'));
  assert.ok(script.includes('class TanCotScene(Scene):'));
  assert.ok(script.includes('MathTex'));

  const keyframes = adapter.generateKeyframes(steps);
  assert.equal(keyframes.length, 2);
  assert.equal(keyframes[0].stepIndex, 1);
  assert.ok(keyframes[0].svgVisual.includes('<svg'));
});

test('8. PyodideNotebookAdapter executes safe scientific Python expressions and restricts shell access', async () => {
  const adapter = new PyodideNotebookAdapter();

  // Safe arithmetic & print
  const run1 = await adapter.executePythonCode('print(40 + 2)');
  assert.ok(run1.stdout.includes('42'));

  // Restricted imports
  await assert.rejects(
    async () => {
      await adapter.executePythonCode("__import__('os').system('whoami')");
    },
    { message: /restricted/i }
  );

  // Template retrieval
  const templates = adapter.getTemplates();
  assert.ok(templates.length >= 3);
  assert.ok(templates.some((t) => t.title.includes('NumPy')));
  assert.ok(templates.some((t) => t.title.includes('SymPy')));
});

test('9. Centralized registry executes actions through unified execute() method with timeout guard', async () => {
  const registry = ScientificEngineRegistry.getInstance();

  const result = await registry.execute('manim', {
    action: 'generate_scene',
    payload: {
      title: 'Euler Formula',
      sceneName: 'EulerScene',
      steps: [{ latex: 'e^{i\\pi} + 1 = 0', explanation: 'Euler identity' }],
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.adapterId, 'manim');
  assert.equal(result.output.sceneName, 'EulerScene');
});
