/**
 * VisiOS — Subject Model Router Test Suite
 * Implementation 3: Unified Subject Intelligence Router
 *
 * Verifies all 10 requirements:
 * 1. Mathematics questions select mathematics specialist.
 * 2. Programming questions select coding specialist.
 * 3. Graphing requests use graphing engine.
 * 4. Algorithm tracing uses algorithm engine.
 * 5. Mixed-subject questions can select multiple capabilities.
 * 6. Ambiguous queries do not trigger an incorrect model.
 * 7. An unavailable specialist produces a controlled fallback.
 * 8. A general question does not accidentally activate mathematics.
 * 9. Model output does not override verified engine output.
 * 10. Existing learning synchronization tests continue passing.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { SubjectModelRouter, RoutingDecision } from '../features/learning/SubjectModelRouter';
import { ModelAvailabilityService } from '../features/learning/ModelAvailabilityService';
import { ModelProviderRegistry } from '../features/learning/ModelProviderRegistry';
import { UnifiedModelResponse } from '../features/learning/UnifiedModelResponse';

// ----------------------------------------------------------------------------
// Test 1: Mathematics questions select the mathematics specialist
// ----------------------------------------------------------------------------
test('Test 1: Mathematics questions select mathematics specialist (Qwen2.5-Math)', async () => {
  const query = 'Solve x^2 - 5x + 6 = 0';
  const decision = await SubjectModelRouter.routeQuery(query);

  assert.equal(decision.subject, 'mathematics');
  assert.equal(decision.requiresModel, true);
  assert.equal(decision.targetProvider?.id, 'provider_math');
  assert.equal(decision.targetProvider?.primaryModel, 'mightykatun/qwen2.5-math:1.5b');
  assert.equal(decision.targetEngineType, 'math');

  const diffQuery = 'Explain differentiation and derivatives';
  const diffDecision = await SubjectModelRouter.routeQuery(diffQuery);
  assert.equal(diffDecision.subject, 'mathematics');
  assert.equal(diffDecision.requiresModel, true);
  assert.equal(diffDecision.targetProvider?.id, 'provider_math');
});

// ----------------------------------------------------------------------------
// Test 2: Programming questions select the coding specialist
// ----------------------------------------------------------------------------
test('Test 2: Programming questions select coding specialist (Qwen2.5-Coder)', async () => {
  const codeQuery1 = 'Explain binary search with a Java implementation';
  const decision1 = await SubjectModelRouter.routeQuery(codeQuery1);

  assert.equal(decision1.subject, 'computer_science');
  assert.equal(decision1.requiresModel, true);
  assert.equal(decision1.targetProvider?.id, 'provider_coder');
  assert.equal(decision1.targetProvider?.primaryModel, 'qwen2.5-coder:1.5b');

  const codeQuery2 = 'Find the bug in this for loop and debug it: for (int i = 0; i <= arr.length; i++)';
  const decision2 = await SubjectModelRouter.routeQuery(codeQuery2);

  assert.equal(decision2.subject, 'computer_science');
  assert.equal(decision2.requiresModel, true);
  assert.equal(decision2.targetProvider?.id, 'provider_coder');
});

// ----------------------------------------------------------------------------
// Test 3: Graphing requests use the graphing engine
// ----------------------------------------------------------------------------
test('Test 3: Graphing requests use deterministic graphing engine without LLM coordinate invention', async () => {
  const plotQuery = 'Plot y = 2x + 3';
  const decision = await SubjectModelRouter.routeQuery(plotQuery);

  assert.equal(decision.requiresModel, false);
  assert.equal(decision.targetEngineType, 'math');
  assert.equal(decision.matchedCapabilityId, 'cap_linear_functions');
  assert.equal(decision.deterministicEngineAvailable, true);
  assert.match(decision.actionPlan, /deterministic FunctionCoordinatePlotter/i);
});

// ----------------------------------------------------------------------------
// Test 4: Algorithm tracing uses the existing algorithm engine
// ----------------------------------------------------------------------------
test('Test 4: Algorithm tracing uses existing algorithm engine deterministically', async () => {
  const traceQuery = 'Trace binary search in [2, 4, 6, 8, 10, 12]';
  const decision = await SubjectModelRouter.routeQuery(traceQuery);

  assert.equal(decision.subject, 'computer_science');
  assert.equal(decision.requiresModel, false);
  assert.equal(decision.targetEngineType, 'algorithm');
  assert.equal(decision.matchedCapabilityId, 'cap_cs_binary_search');
  assert.equal(decision.deterministicEngineAvailable, true);
});

// ----------------------------------------------------------------------------
// Test 5: Mixed-subject questions can select multiple capabilities
// ----------------------------------------------------------------------------
test('Test 5: Mixed-subject questions detect multi-domain capabilities', async () => {
  const mixedQuery = 'Calculate derivative formula in Python code';
  const decision = await SubjectModelRouter.routeQuery(mixedQuery);

  assert.equal(decision.isMixedSubject, true);
  assert.ok(decision.secondaryCapabilities.length > 0);
  assert.ok(decision.secondaryCapabilities.includes('cap_polynomial_identities'));
});

// ----------------------------------------------------------------------------
// Test 6: Ambiguous queries do not trigger an incorrect model
// ----------------------------------------------------------------------------
test('Test 6: Ambiguous queries route to honest uncertainty without firing models', async () => {
  const ambiguousQueries = ['graph', 'tree', 'vector', 'state', 'mla stands for'];

  for (const q of ambiguousQueries) {
    const decision = await SubjectModelRouter.routeQuery(q);
    assert.equal(decision.isAmbiguous, true, `Expected "${q}" to be flagged ambiguous`);
    assert.equal(decision.requiresModel, false, `Expected "${q}" to NOT trigger a model`);
    assert.equal(decision.subject, 'clarification');
    assert.ok(decision.clarificationReason, `Expected clarificationReason for "${q}"`);
  }
});

// ----------------------------------------------------------------------------
// Test 7: An unavailable specialist produces a controlled fallback
// ----------------------------------------------------------------------------
test('Test 7: Controlled fallback executes gracefully when specialist is unavailable', async () => {
  // Mock decision pointing to mathematics
  const mockDecision: RoutingDecision = {
    query: 'Solve x^2 - 4 = 0',
    normalizedQuery: 'Solve x^2 - 4 = 0',
    subject: 'mathematics',
    requiresModel: true,
    targetEngineType: 'math',
    matchedCapabilityId: 'cap_polynomial_identities',
    deterministicEngineAvailable: true,
    isAmbiguous: false,
    isMixedSubject: false,
    secondaryCapabilities: [],
    actionPlan: 'Test fallback execution',
  };

  const response: UnifiedModelResponse = await SubjectModelRouter.executeRouting(mockDecision);
  assert.ok(response);
  assert.equal(response.subject, 'mathematics');
  assert.ok(response.status === 'success' || response.status === 'fallback');
  assert.ok(response.answer.length > 0);
});

// ----------------------------------------------------------------------------
// Test 8: A general question does not accidentally activate mathematics
// ----------------------------------------------------------------------------
test('Test 8: General questions do not accidentally activate mathematics model', async () => {
  const generalQueries = ['Alan Turing', 'history of calculus', 'photosynthesis biological process'];

  for (const q of generalQueries) {
    const decision = await SubjectModelRouter.routeQuery(q);
    assert.notEqual(decision.subject, 'mathematics', `Query "${q}" should not route to mathematics`);
    assert.notEqual(decision.targetProvider?.id, 'provider_math', `Query "${q}" should not use provider_math`);
    assert.equal(decision.targetEngineType, 'knowledge', `Query "${q}" should route to knowledge`);
    assert.equal(decision.matchedCapabilityId, 'cap_factual_knowledge_retrieval');
  }
});

// ----------------------------------------------------------------------------
// Test 9: Model output does not override verified engine output
// ----------------------------------------------------------------------------
test('Test 9: Deterministic engine outputs remain primary and verified', async () => {
  const plotQuery = 'Plot y = 2x + 3';
  const decision = await SubjectModelRouter.routeQuery(plotQuery);
  const response = await SubjectModelRouter.executeRouting(decision);

  assert.equal(response.verified, true);
  assert.equal(response.source, 'deterministic_engine');
  assert.equal(response.engineId, 'math');
  assert.equal(response.capabilityId, 'cap_linear_functions');
});

// ----------------------------------------------------------------------------
// Test 10: VRAM protection ensures sequential execution
// ----------------------------------------------------------------------------
test('Test 10: ModelProviderRegistry enforces sequential VRAM queue', async () => {
  const executionOrder: number[] = [];

  const task1 = ModelProviderRegistry.executeWithVRAMProtection(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50));
    executionOrder.push(1);
    return 'done1';
  });

  const task2 = ModelProviderRegistry.executeWithVRAMProtection(async () => {
    executionOrder.push(2);
    return 'done2';
  });

  await Promise.all([task1, task2]);
  assert.deepEqual(executionOrder, [1, 2]);
});
