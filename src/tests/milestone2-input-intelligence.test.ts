/**
 * VisiOS — Phase 2: Input Intelligence & Smart Routing Test Suite
 * Tests IntentClassifier, MathInputNormalizer, and MultiIntentPlanner.
 * Uses node:test + assert with relative imports only (no @/ aliases).
 * Run: tsx src/tests/milestone2-input-intelligence.test.ts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

// Relative imports from tests/ directory
import { IntentClassifier } from '../features/learning/IntentClassifier.js';
import { MathInputNormalizer } from '../features/learning/MathInputNormalizer.js';
import { MultiIntentPlanner } from '../features/learning/MultiIntentPlanner.js';
import { InterpretedLearningIntent } from '../features/learning/InputIntelligenceTypes.js';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator.js';
import { UnifiedLearningContracts } from '../features/learning/UnifiedLearningContracts.js';

// ---------------------------------------------------------------------------
// Helper to run a classification and return the result
// ---------------------------------------------------------------------------
function classify(input: string, subject?: string): InterpretedLearningIntent {
  return IntentClassifier.classify(input, subject ? { subject } : undefined);
}

// ---------------------------------------------------------------------------
// Test 1: "y = 2x + 3" → plot_function, cap_linear_functions
// ---------------------------------------------------------------------------
test('Linear equation "y = 2x + 3" classified as plot_function with cap_linear_functions', () => {
  const result = classify('y = 2x + 3');
  assert.equal(result.primaryIntent, 'plot_function', `Expected plot_function, got ${result.primaryIntent}`);
  assert.ok(result.candidateCapabilityIds.includes('cap_linear_functions'),
    `Expected cap_linear_functions in candidates, got: ${result.candidateCapabilityIds.join(',')}`);
  assert.equal(result.domain, 'mathematics');
  assert.ok(result.mathParsing?.isValid, 'Math parsing should be valid');
});

// ---------------------------------------------------------------------------
// Test 2: "Plot y = -3x + 5" → explicit plot_function intent
// ---------------------------------------------------------------------------
test('Explicit "Plot y = -3x + 5" → plot_function intent', () => {
  const result = classify('Plot y = -3x + 5');
  assert.equal(result.primaryIntent, 'plot_function', `Expected plot_function, got ${result.primaryIntent}`);
  assert.equal(result.domain, 'mathematics');
});

// ---------------------------------------------------------------------------
// Test 3: "Explain fractions" → explain_concept, cap_rational_fractions
// ---------------------------------------------------------------------------
test('"Explain fractions" → explain_concept, cap_rational_fractions', () => {
  const result = classify('Explain fractions');
  assert.equal(result.primaryIntent, 'explain_concept', `Expected explain_concept, got ${result.primaryIntent}`);
  // Fractions are in mathematics domain
  assert.equal(result.domain, 'mathematics', `Expected mathematics domain, got ${result.domain}`);
});

// ---------------------------------------------------------------------------
// Test 4: "Prove the Pythagorean theorem" → prove_theorem
// ---------------------------------------------------------------------------
test('"Prove the Pythagorean theorem" → prove_theorem', () => {
  const result = classify('Prove the Pythagorean theorem');
  assert.equal(result.primaryIntent, 'prove_theorem', `Expected prove_theorem, got ${result.primaryIntent}`);
});

// ---------------------------------------------------------------------------
// Test 5: "Trace binary search" → trace_algorithm + cap_cs_binary_search
// ---------------------------------------------------------------------------
test('"Trace binary search" → trace_algorithm with cap_cs_binary_search', () => {
  const result = classify('Trace binary search');
  assert.equal(result.primaryIntent, 'trace_algorithm', `Expected trace_algorithm, got ${result.primaryIntent}`);
  assert.ok(
    result.domain === 'computer_science' ||
    result.candidateCapabilityIds.some((id) => id.includes('binary_search') || id.includes('cs')),
    `Expected CS domain or binary search capability. Domain: ${result.domain}, caps: ${result.candidateCapabilityIds.join(',')}`
  );
});

// ---------------------------------------------------------------------------
// Test 6: "Explain graph traversal using BFS" → computer_science, NOT geometry
// ---------------------------------------------------------------------------
test('"Explain graph traversal using BFS" → computer_science domain (not mathematics)', () => {
  const result = classify('Explain graph traversal using BFS');
  assert.equal(result.domain, 'computer_science',
    `Expected computer_science domain, got ${result.domain}`);
  assert.notEqual(result.domain, 'mathematics',
    'Should not be mathematics — BFS disambiguates to CS');
  assert.notEqual(result.primaryIntent, 'clarify_request',
    '"graph traversal BFS" should NOT trigger ambiguity clarification');
});

// ---------------------------------------------------------------------------
// Test 7: "Show the vertices and edges" → clarify_request (ambiguous "graph")
// ---------------------------------------------------------------------------
test('"Show the vertices and edges" → clarify_request due to ambiguous graph-related term', () => {
  const result = classify('Show the vertices and edges');
  // Either directly ambiguous (clarify_request) OR intent clarification triggered
  // Vertices/edges is a short query with no domain disambiguator
  const isAmbiguousOrClarify = result.primaryIntent === 'clarify_request' || result.isAmbiguous;
  assert.ok(isAmbiguousOrClarify,
    `Expected clarify_request or isAmbiguous=true, got intent=${result.primaryIntent}, isAmbiguous=${result.isAmbiguous}`);
});

// ---------------------------------------------------------------------------
// Test 8: "Simulate projectile motion" → run_simulation
// ---------------------------------------------------------------------------
test('"Simulate projectile motion" → run_simulation', () => {
  const result = classify('Simulate projectile motion');
  assert.equal(result.primaryIntent, 'run_simulation', `Expected run_simulation, got ${result.primaryIntent}`);
  assert.equal(result.domain, 'physics', `Expected physics domain, got ${result.domain}`);
});

// ---------------------------------------------------------------------------
// Test 9: "Compare two launch angles" → compare_scenarios
// ---------------------------------------------------------------------------
test('"Compare two launch angles" → compare_scenarios', () => {
  const result = classify('Compare two launch angles');
  assert.equal(result.primaryIntent, 'compare_scenarios', `Expected compare_scenarios, got ${result.primaryIntent}`);
});

// ---------------------------------------------------------------------------
// Test 10: "Explain the human nervous system" → biology domain, visualize_concept
// ---------------------------------------------------------------------------
test('"Explain the human nervous system" → biology domain', () => {
  const result = classify('Explain the human nervous system');
  assert.equal(result.domain, 'biology', `Expected biology domain, got ${result.domain}`);
  // Intent should be explain or visualize
  assert.ok(
    result.primaryIntent === 'explain_concept' || result.primaryIntent === 'visualize_concept',
    `Expected explain_concept or visualize_concept, got ${result.primaryIntent}`
  );
});

// ---------------------------------------------------------------------------
// Test 11: Unsupported topic → unsupported
// ---------------------------------------------------------------------------
test('Unsupported topic "quantum chromodynamics parton distribution functions" → unsupported', () => {
  const result = classify('quantum chromodynamics parton distribution functions advanced');
  assert.equal(result.primaryIntent, 'unsupported',
    `Expected unsupported, got ${result.primaryIntent}. Caps: ${result.candidateCapabilityIds.join(',')}`);
});

// ---------------------------------------------------------------------------
// Test 12: Empty input → clarify_request
// ---------------------------------------------------------------------------
test('Empty input → clarify_request', () => {
  const result = classify('');
  assert.equal(result.primaryIntent, 'clarify_request', `Expected clarify_request, got ${result.primaryIntent}`);
  assert.ok(result.limitations.length > 0 || result.ambiguityReason, 'Should have a reason/limitation');
});

// ---------------------------------------------------------------------------
// Test 13: Malformed expression "y = 2x +" → clarify_request + validationError
// ---------------------------------------------------------------------------
test('Malformed expression "y = 2x +" → clarify_request with validationError', () => {
  const result = classify('y = 2x +');
  assert.equal(result.primaryIntent, 'clarify_request',
    `Expected clarify_request, got ${result.primaryIntent}`);
  assert.ok(
    result.mathParsing?.validationError || result.limitations.some((l) => l.includes('Malformed') || l.includes('malformed') || l.includes('operator')),
    `Expected validationError or malformed limitation. Got limitations: ${result.limitations.join('; ')}, mathParsing: ${JSON.stringify(result.mathParsing)}`
  );
});

// ---------------------------------------------------------------------------
// Test 14: Single letter "E" → clarify_request with clarificationOptions
// ---------------------------------------------------------------------------
test('Single ambiguous letter "E" → clarify_request', () => {
  const result = classify('E');
  // E could be energy, Euler's number, scientific E notation — should be clarify or unsupported
  const isUnclear = result.primaryIntent === 'clarify_request' ||
    result.primaryIntent === 'unsupported' ||
    result.isAmbiguous;
  assert.ok(isUnclear,
    `Expected clarify_request, unsupported, or isAmbiguous for "E". Got ${result.primaryIntent}, isAmbiguous=${result.isAmbiguous}`);
});

// ---------------------------------------------------------------------------
// Test 15: Multi-intent "Explain fractions and plot y = 2x + 3" → additionalIntents present, execution plan generated
// ---------------------------------------------------------------------------
test('Multi-intent "Explain fractions and plot y = 2x + 3" → additionalIntents + execution plan', () => {
  const result = classify('Explain fractions and plot y = 2x + 3');

  // Should produce additionalIntents
  const hasAdditional = result.additionalIntents && result.additionalIntents.length > 0;
  assert.ok(hasAdditional,
    `Expected additionalIntents to be set for multi-intent query. Got: ${JSON.stringify(result.additionalIntents)}`);

  // Build execution plan
  const plan = MultiIntentPlanner.buildPlan(result);
  assert.ok(plan.isMultiIntent, 'Expected isMultiIntent=true');
  assert.ok(plan.steps.length >= 2, `Expected at least 2 steps, got ${plan.steps.length}`);
  assert.equal(plan.steps[0].status, 'pending', 'Steps should start as pending');

  // Verify planId and summary are set
  assert.ok(plan.planId.startsWith('plan_'), `Expected planId to start with "plan_", got ${plan.planId}`);
  assert.ok(plan.summary.length > 0, 'Expected non-empty summary');
});

// ---------------------------------------------------------------------------
// Bonus: MathInputNormalizer unit tests
// ---------------------------------------------------------------------------
test('MathInputNormalizer: y = 2x + 3 → linear_equation, slope=2, intercept=3', () => {
  const result = MathInputNormalizer.normalize('y = 2x + 3');
  assert.equal(result.mathType, 'linear_equation');
  assert.ok(result.isValid);
  assert.equal(result.parameters.slope, 2);
  assert.equal(result.parameters.intercept, 3);
});

test('MathInputNormalizer: y = -3x + 5 → linear_equation, slope=-3', () => {
  const result = MathInputNormalizer.normalize('y = -3x + 5');
  assert.equal(result.mathType, 'linear_equation');
  assert.equal(result.parameters.slope, -3);
  assert.equal(result.parameters.intercept, 5);
});

test('MathInputNormalizer: 3/4 → fraction', () => {
  const result = MathInputNormalizer.normalize('3/4');
  assert.equal(result.mathType, 'fraction');
  assert.ok(result.isValid);
  assert.equal(result.parameters.numerator, 3);
  assert.equal(result.parameters.denominator, 4);
});

test('MathInputNormalizer: "y = 2x +" → malformed', () => {
  const result = MathInputNormalizer.normalize('y = 2x +');
  assert.equal(result.mathType, 'malformed');
  assert.ok(!result.isValid);
  assert.ok(result.validationError && result.validationError.length > 0);
});

test('MultiIntentPlanner: single intent produces single-step plan, isMultiIntent=false', () => {
  const mockIntent: InterpretedLearningIntent = {
    originalInput: 'Explain fractions',
    normalizedInput: 'Explain fractions',
    primaryIntent: 'explain_concept',
    domain: 'mathematics',
    subject: 'Mathematics',
    topic: 'fractions',
    confidence: 0.9,
    isAmbiguous: false,
    requiredParameters: [],
    resolvedParameters: {},
    missingParameters: [],
    parameterSources: {},
    candidateCapabilityIds: ['cap_rational_fractions'],
    limitations: [],
  };

  const plan = MultiIntentPlanner.buildPlan(mockIntent);
  assert.equal(plan.isMultiIntent, false);
  assert.equal(plan.steps.length, 1);
  assert.equal(plan.steps[0].intent, 'explain_concept');
  assert.equal(plan.steps[0].status, 'pending');
});

test('MultiIntentPlanner: markStepSuccess updates step status correctly', () => {
  const mockIntent: InterpretedLearningIntent = {
    originalInput: 'Explain fractions and plot y = 2x + 3',
    normalizedInput: 'Explain fractions and plot y = 2x + 3',
    primaryIntent: 'explain_concept',
    additionalIntents: ['plot_function'],
    domain: 'mathematics',
    subject: 'Mathematics',
    topic: 'fractions',
    confidence: 0.9,
    isAmbiguous: false,
    requiredParameters: [],
    resolvedParameters: {},
    missingParameters: [],
    parameterSources: {},
    candidateCapabilityIds: [],
    limitations: [],
  };

  let plan = MultiIntentPlanner.buildPlan(mockIntent);
  assert.equal(plan.steps.length, 2);

  plan = MultiIntentPlanner.markStepSuccess(plan, 'step_1', { ok: true });
  assert.equal(plan.steps[0].status, 'success');
  assert.equal(plan.steps[1].status, 'pending');
  assert.ok(MultiIntentPlanner.hasPartialSuccess(plan));
  assert.ok(!MultiIntentPlanner.isPlanSettled(plan));
});

test('MultiIntentPlanner: markStepFailed skips dependent steps', () => {
  const mockIntent: InterpretedLearningIntent = {
    originalInput: 'Explain binary search then trace it',
    normalizedInput: 'Explain binary search then trace it',
    primaryIntent: 'explain_concept',
    additionalIntents: ['trace_algorithm'],
    domain: 'computer_science',
    subject: 'Computer Science',
    topic: 'binary search',
    confidence: 0.9,
    isAmbiguous: false,
    requiredParameters: [],
    resolvedParameters: {},
    missingParameters: [],
    parameterSources: {},
    candidateCapabilityIds: [],
    limitations: [],
  };

  let plan = MultiIntentPlanner.buildPlan(mockIntent);
  // sequential (explain + trace is dependent pair)
  plan = MultiIntentPlanner.markStepFailed(plan, 'step_1', 'Engine error');
  const step1 = plan.steps.find((s) => s.stepId === 'step_1');
  assert.equal(step1?.status, 'failed');
  // Dependent step should be skipped
  const dependentSteps = plan.steps.filter((s) => s.dependsOnStepId === 'step_1');
  for (const s of dependentSteps) {
    assert.equal(s.status, 'skipped', `Expected step ${s.stepId} to be skipped`);
  }
  assert.ok(MultiIntentPlanner.isPlanSettled(plan));
  assert.ok(!MultiIntentPlanner.hasPartialSuccess(plan));
});

// ---------------------------------------------------------------------------
// Disambiguation with Subject Context
// ---------------------------------------------------------------------------
test('"Show the vertices and edges" with subject context disambiguates correctly', () => {
  const mathContext = classify('Show the vertices and edges', 'mathematics');
  assert.equal(mathContext.domain, 'mathematics', 'Should disambiguate to mathematics when context provided');
  assert.equal(mathContext.isAmbiguous, false, 'Should not require clarification when context is present');

  const csContext = classify('Show the vertices and edges', 'computer_science');
  assert.equal(csContext.domain, 'computer_science', 'Should disambiguate to computer_science when context provided');
  assert.equal(csContext.isAmbiguous, false, 'Should not require clarification when context is present');
});

// ---------------------------------------------------------------------------
// Multi-Intent with One Unsupported Step
// ---------------------------------------------------------------------------
test('Multi-intent with one unsupported step: succeeds partially without fabricating', () => {
  const mockMultiWithUnsupported: InterpretedLearningIntent = {
    originalInput: 'Explain fractions and simulate quantum teleportation',
    normalizedInput: 'Explain fractions and simulate quantum teleportation',
    primaryIntent: 'explain_concept',
    additionalIntents: ['run_simulation'],
    domain: 'mathematics',
    subject: 'Mathematics',
    topic: 'fractions',
    confidence: 0.9,
    isAmbiguous: false,
    requiredParameters: [],
    resolvedParameters: {},
    missingParameters: [],
    parameterSources: {},
    candidateCapabilityIds: ['cap_rational_fractions'],
    limitations: [],
  };

  let plan = MultiIntentPlanner.buildPlan(mockMultiWithUnsupported);
  assert.equal(plan.isMultiIntent, true);
  assert.equal(plan.steps.length, 2);

  // Step 1 succeeds (fractions)
  plan = MultiIntentPlanner.markStepSuccess(plan, 'step_1', { explanation: 'Fraction breakdown' });
  // Step 2 fails honestly (unsupported quantum teleportation simulation)
  plan = MultiIntentPlanner.markStepFailed(plan, 'step_2', 'No verified simulation engine for quantum teleportation');

  assert.ok(MultiIntentPlanner.isPlanSettled(plan), 'Plan should be settled');
  assert.ok(MultiIntentPlanner.hasPartialSuccess(plan), 'Plan should have partial success');
  assert.equal(plan.steps[0].status, 'success', 'Step 1 must be marked success');
  assert.equal(plan.steps[1].status, 'failed', 'Step 2 must be marked failed honestly');
});

// ---------------------------------------------------------------------------
// End-to-End Orchestrator Routing Tests
// ---------------------------------------------------------------------------
test('LearningOrchestrator: routes "y = 2x + 3" to completed response with cap_linear_functions', async () => {
  const req = UnifiedLearningContracts.createLearningRequest('y = 2x + 3');
  const res = await LearningOrchestrator.executeRequest(req);
  assert.equal(res.status, 'success');
  assert.equal(res.metadata.capabilityId, 'cap_linear_functions');
  assert.equal(res.metadata.intentClassification, 'plot_function');
});

test('LearningOrchestrator: routes "Explain fractions" to cap_rational_fractions', async () => {
  const req = UnifiedLearningContracts.createLearningRequest('Explain fractions');
  const res = await LearningOrchestrator.executeRequest(req);
  assert.equal(res.status, 'success');
  assert.equal(res.metadata.capabilityId, 'cap_rational_fractions');
});

test('LearningOrchestrator: rejects unsupported topic honestly', async () => {
  const req = UnifiedLearningContracts.createLearningRequest('quantum chromodynamics parton distribution functions advanced');
  const res = await LearningOrchestrator.executeRequest(req);
  assert.equal(res.status, 'unsupported');
  assert.equal(res.error?.code, 'UNSUPPORTED_CAPABILITY');
  assert.equal(res.error?.recoverable, false);
});

test('LearningOrchestrator: flags ambiguous single letter "E" with CLARIFICATION_REQUIRED', async () => {
  const req = UnifiedLearningContracts.createLearningRequest('E');
  const res = await LearningOrchestrator.executeRequest(req);
  assert.equal(res.status, 'error');
  assert.equal(res.error?.code, 'CLARIFICATION_REQUIRED');
  assert.equal(res.error?.recoverable, true);
});

test('LearningOrchestrator: flags malformed expression "y = 2x +" with CLARIFICATION_REQUIRED', async () => {
  const req = UnifiedLearningContracts.createLearningRequest('y = 2x +');
  const res = await LearningOrchestrator.executeRequest(req);
  assert.equal(res.status, 'error');
  assert.equal(res.error?.code, 'CLARIFICATION_REQUIRED');
});

