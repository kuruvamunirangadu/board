/**
 * VisiOS — Mathematical Expression Intelligence Pipeline Regression Tests
 *
 * Verifies that single mathematical expressions are understood and executed
 * as unified mathematical problems rather than split into inconsistent outputs.
 *
 * Test cases:
 * 1. tan^2(x) + cot^2(x) -> complete expression graph, identity derivation, not "Unresolved Formula"
 * 2. sin^2(x) + cos^2(x) -> recognized as identity 1
 * 3. tan(x) + sin(x) -> both terms preserved in graph and representation
 * 4. x^2 + 2x + 1 -> recognized as polynomial function and graphed
 * 5. 2x + 5 -> recognized as linear expression with slope and intercept
 * 6. differentiate tan(x) + cot(x) -> recognized as calculus derivative task
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { MathInputNormalizer } from '../features/learning/MathInputNormalizer';
import { TopicClassifier } from '../features/learning/TopicClassifier';
import { IntentClassifier } from '../features/learning/IntentClassifier';
import { UniversalInputInterpreter } from '../features/learning/UniversalInputInterpreter';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { CanvasStampingEngine } from '../features/canvas/CanvasStampingEngine';

test('1. tan^2(x) + cot^2(x) - Normalizer preserves full expression without dropping terms', () => {
  const norm = MathInputNormalizer.normalize('tan^2(x) + cot^2(x)');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.isValid, true);
  assert.equal(norm.mathType, 'trigonometric');
  assert.equal(norm.functionExpression, 'tan^2(x) + cot^2(x)');
  assert.match(norm.normalizedSyntax, /tan\^2\(x\)\s*\+\s*cot\^2\(x\)/);
});

test('1. tan^2(x) + cot^2(x) - TopicClassifier routes to math engine without clarification', () => {
  const classification = TopicClassifier.classify('tan^2(x) + cot^2(x)');
  assert.equal(classification.domain, 'mathematics');
  assert.equal(classification.engine, 'math');
  assert.equal(classification.requiresClarification, false);
});

test('1. tan^2(x) + cot^2(x) - IntentClassifier classifies as mathematical derivation', () => {
  const intent = IntentClassifier.classify('tan^2(x) + cot^2(x)');
  assert.equal(intent.domain, 'mathematics');
  assert.equal(intent.isAmbiguous, false);
  assert.equal(intent.primaryIntent, 'derive_formula');
  assert.ok(intent.candidateCapabilityIds.includes('cap_harmonic_curves'));
});

test('1. tan^2(x) + cot^2(x) - UniversalInputInterpreter does NOT label as Unresolved Formula', () => {
  const interp = UniversalInputInterpreter.interpret('tan^2(x) + cot^2(x)');
  assert.notEqual(interp.title, 'Unresolved Formula: "tan^2(x) + cot^2(x)"');
  assert.ok(interp.title.includes('tan²(x) + cot²(x)'));
  assert.equal(interp.isAmbiguous, false);
  assert.match(interp.summary, /4csc²\(2x\)\s*-\s*2/);
  assert.match(interp.summary, /minimum value 2/i);
});

test('1. tan^2(x) + cot^2(x) - LearningOrchestrator generates consistent 3-card mathematical plan', async () => {
  const result = await LearningOrchestrator.processTopic('tan^2(x) + cot^2(x)');
  assert.equal(result.routeTaken, 'math_engine');

  const plan = result.plan;

  // Card 1: Core Concept
  assert.ok(!plan.title.toLowerCase().includes('unresolved'), 'Card 1 must not be an Unresolved Formula');
  assert.ok(plan.title.includes('tan²(x) + cot²(x)'));

  // Card 2: Derivation steps
  assert.ok(plan.derivationSteps.length >= 5, 'Card 2 must provide complete mathematical derivation');
  const derivationText = plan.derivationSteps.map((s) => s.expression).join(' ');
  assert.ok(derivationText.includes('4\\csc^2(2x) - 2') || derivationText.includes('4csc'), 'Derivation must show canonical cosecant form');

  // Card 3: Graph visualization
  assert.equal(plan.visualizationPlan?.rendererType, 'function_coordinate_plotter');

  // Stamping engine must preserve complete expression, NOT truncate to tan(x)
  const visualShape = CanvasStampingEngine.determineVisualShapeType(plan);
  assert.equal(visualShape.kind, 'geometry');
  assert.equal(visualShape.geometryConfig?.geometryType, 'linear_plotter');
  assert.equal(visualShape.geometryConfig?.functionExpression, 'tan^2(x) + cot^2(x)');
  assert.notEqual(visualShape.geometryConfig?.functionExpression, 'tan(x)');
});

test('2. sin^2(x) + cos^2(x) - Recognized as fundamental identity = 1', () => {
  const norm = MathInputNormalizer.normalize('sin^2(x) + cos^2(x)');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.mathType, 'trigonometric');
  assert.equal(norm.parameters.simplified, '1');
  assert.equal(norm.normalizedSyntax, 'sin^2(x) + cos^2(x) = 1');

  const interp = UniversalInputInterpreter.interpret('sin^2(x) + cos^2(x)');
  assert.ok(interp.title.includes('sin²(x) + cos²(x) = 1'));
  assert.equal(interp.isAmbiguous, false);
});

test('3. tan(x) + sin(x) - Graph preserves both terms without discarding sin(x)', async () => {
  const norm = MathInputNormalizer.normalize('tan(x) + sin(x)');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.functionExpression, 'tan(x) + sin(x)');

  const result = await LearningOrchestrator.processTopic('tan(x) + sin(x)');
  assert.equal(result.plan.visualizationPlan?.rendererType, 'function_coordinate_plotter');

  const visualShape = CanvasStampingEngine.determineVisualShapeType(result.plan);
  assert.equal(visualShape.geometryConfig?.functionExpression, 'tan(x) + sin(x)');
});

test('4. x^2 + 2x + 1 - Recognized as polynomial function and graphed', async () => {
  const norm = MathInputNormalizer.normalize('x^2 + 2x + 1');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.mathType, 'polynomial');
  assert.equal(norm.functionExpression, 'x^2 + 2x + 1');

  const classification = TopicClassifier.classify('x^2 + 2x + 1');
  assert.equal(classification.domain, 'mathematics');
  assert.equal(classification.engine, 'math');

  const result = await LearningOrchestrator.processTopic('x^2 + 2x + 1');
  assert.equal(result.plan.category, 'algebra');
  assert.ok(result.plan.title.includes('x^2 + 2x + 1'));

  const visualShape = CanvasStampingEngine.determineVisualShapeType(result.plan);
  assert.equal(visualShape.geometryConfig?.functionExpression, 'x^2 + 2x + 1');
});

test('5. 2x + 5 - Recognized as linear expression with slope and intercept', () => {
  const norm = MathInputNormalizer.normalize('2x + 5');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.mathType, 'linear_equation');
  assert.equal(norm.normalizedSyntax, 'y = 2x + 5');
  assert.equal(norm.parameters.slope, 2);
  assert.equal(norm.parameters.intercept, 5);

  const interp = UniversalInputInterpreter.interpret('2x + 5');
  assert.equal(interp.category, 'algebra');
  assert.equal(interp.isAmbiguous, false);
});

test('6. differentiate tan(x) + cot(x) - Recognized as derivative task, not generic graph-only output', () => {
  const norm = MathInputNormalizer.normalize('differentiate tan(x) + cot(x)');
  assert.equal(norm.isMathematical, true);
  assert.equal(norm.mathType, 'calculus');
  assert.equal(norm.parameters.operation, 'derivative');
  assert.equal(norm.intentHint, 'derive_formula');

  const classification = TopicClassifier.classify('differentiate tan(x) + cot(x)');
  assert.equal(classification.domain, 'mathematics');
  assert.equal(classification.engine, 'math');
  assert.equal(classification.intent, 'derivation');
});
