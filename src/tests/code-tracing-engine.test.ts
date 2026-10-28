/**
 * VisiOS — Step 3: Code-to-Visual Learning Engine Unit Test Suite
 * Validates deterministic execution tracing across all 5 core algorithms/structures:
 * 1. Binary Search (sorted precondition check, pointers, halving, found/missing)
 * 2. Linear Search (sequential scanning, comparisons, index return)
 * 3. Bubble Sort (adjacent swaps, pass tracking, early-termination optimization)
 * 4. Stack & Queue Operations (LIFO/FIFO ordering, peek, underflow/overflow guards)
 * 5. Recursion (Factorial call-stack frames, base-case evaluation, unwinding, bounds)
 * 6. Immutability, Step Navigation, Prediction System, and Complexity Metadata
 */

import { BinarySearchTracer } from '../features/code-tracing/algorithms/BinarySearchTracer';
import { LinearSearchTracer } from '../features/code-tracing/algorithms/LinearSearchTracer';
import { BubbleSortTracer } from '../features/code-tracing/algorithms/BubbleSortTracer';
import { StackQueueTracer } from '../features/code-tracing/algorithms/StackQueueTracer';
import { RecursionTracer } from '../features/code-tracing/algorithms/RecursionTracer';
import { CodeTracingEngine } from '../features/code-tracing/CodeTracingEngine';

export async function runCodeTracingEngineTests(): Promise<boolean> {
  console.log('--- Running Step 3: VisiOS Code-to-Visual Learning Engine Tests ---');
  let passed = true;

  // =========================================================================
  // TEST SUITE 1: BINARY SEARCH TRACER
  // =========================================================================
  console.log('1. Testing Binary Search Tracer...');

  // Test 1.1: Precondition check failure on unsorted array
  const unsortedTrace = BinarySearchTracer.trace([9, 2, 7, 1], 7);
  if (unsortedTrace.success !== false || unsortedTrace.steps[0].eventType !== 'error') {
    console.error('FAIL: BinarySearchTracer should reject unsorted arrays at step 0');
    passed = false;
  }
  if (!unsortedTrace.steps[0].errorMessage?.includes('sorted')) {
    console.error('FAIL: BinarySearchTracer error message should mention sorted requirement');
    passed = false;
  }

  // Test 1.2: Successful search on sorted array (target 23)
  const sortedArr = [2, 5, 8, 12, 16, 23, 38, 56, 72, 91];
  const foundTrace = BinarySearchTracer.trace(sortedArr, 23);
  if (!foundTrace.success || foundTrace.steps.length === 0) {
    console.error('FAIL: BinarySearchTracer failed on valid sorted array');
    passed = false;
  }
  const terminalStep = foundTrace.steps[foundTrace.steps.length - 1];
  if (!terminalStep.isTerminal || terminalStep.variables.result !== 5) {
    console.error(`FAIL: Binary search expected result index 5, got ${terminalStep.variables.result}`);
    passed = false;
  }

  // Test 1.3: Target not found (target 42)
  const missingTrace = BinarySearchTracer.trace(sortedArr, 42);
  const missingTerminal = missingTrace.steps[missingTrace.steps.length - 1];
  if (!missingTerminal.isTerminal || missingTerminal.variables.result !== -1) {
    console.error(`FAIL: Missing target expected -1, got ${missingTerminal.variables.result}`);
    passed = false;
  }

  // Test 1.4: Empty array input
  const emptyTrace = BinarySearchTracer.trace([], 10);
  if (!emptyTrace.success || emptyTrace.steps[emptyTrace.steps.length - 1].variables.result !== -1) {
    console.error('FAIL: Empty array should terminate with result -1');
    passed = false;
  }

  // Test 1.5: Pointers and predictions attached
  const stepWithPrediction = foundTrace.steps.find((s) => s.prediction !== undefined);
  if (!stepWithPrediction || !stepWithPrediction.prediction?.options || stepWithPrediction.prediction.options.length < 2) {
    console.error('FAIL: Binary search trace should contain interactive prediction question');
    passed = false;
  }

  // =========================================================================
  // TEST SUITE 2: LINEAR SEARCH TRACER
  // =========================================================================
  console.log('2. Testing Linear Search Tracer...');

  const lsArr = [15, 42, 8, 23, 99, 4];

  // Test 2.1: Target at beginning (Best Case O(1))
  const lsFirstTrace = LinearSearchTracer.trace(lsArr, 15);
  const lsFirstTerminal = lsFirstTrace.steps[lsFirstTrace.steps.length - 1];
  if (!lsFirstTerminal.isTerminal || lsFirstTerminal.variables.result !== 0) {
    console.error(`FAIL: Linear search for first element expected index 0, got ${lsFirstTerminal.variables.result}`);
    passed = false;
  }

  // Test 2.2: Target in middle
  const lsMidTrace = LinearSearchTracer.trace(lsArr, 23);
  const lsMidTerminal = lsMidTrace.steps[lsMidTrace.steps.length - 1];
  if (!lsMidTerminal.isTerminal || lsMidTerminal.variables.result !== 3) {
    console.error(`FAIL: Linear search for index 3 element expected 3, got ${lsMidTerminal.variables.result}`);
    passed = false;
  }

  // Test 2.3: Target not in array
  const lsNotFoundTrace = LinearSearchTracer.trace(lsArr, 100);
  const lsNotFoundTerminal = lsNotFoundTrace.steps[lsNotFoundTrace.steps.length - 1];
  if (!lsNotFoundTerminal.isTerminal || lsNotFoundTerminal.variables.result !== -1) {
    console.error(`FAIL: Linear search not-found expected -1, got ${lsNotFoundTerminal.variables.result}`);
    passed = false;
  }

  // Test 2.4: Empty array
  const lsEmptyTrace = LinearSearchTracer.trace([], 5);
  if (lsEmptyTrace.steps[lsEmptyTrace.steps.length - 1].variables.result !== -1) {
    console.error('FAIL: Linear search on empty array expected result -1');
    passed = false;
  }

  // =========================================================================
  // TEST SUITE 3: BUBBLE SORT TRACER
  // =========================================================================
  console.log('3. Testing Bubble Sort Tracer...');

  // Test 3.1: Unsorted array produces sorted output
  const unsortedBS = [29, 10, 14, 37, 13];
  const bsTrace = BubbleSortTracer.trace(unsortedBS);
  const bsTerminal = bsTrace.steps[bsTrace.steps.length - 1];
  const sortedResult: number[] = bsTerminal.variables.result;
  const expectedSorted = [10, 13, 14, 29, 37];
  if (!sortedResult || JSON.stringify(sortedResult) !== JSON.stringify(expectedSorted)) {
    console.error(`FAIL: BubbleSort result mismatch. Expected ${expectedSorted}, got ${sortedResult}`);
    passed = false;
  }

  // Verify swap events were logged
  const swapSteps = bsTrace.steps.filter((s) => s.eventType === 'swap');
  if (swapSteps.length === 0) {
    console.error('FAIL: Bubble sort did not record swap event steps');
    passed = false;
  }

  // Test 3.2: Already sorted array triggers early termination (Best Case O(n))
  const alreadySorted = [1, 2, 3, 4, 5];
  const earlyTermTrace = BubbleSortTracer.trace(alreadySorted);
  const earlyBreakStep = earlyTermTrace.steps.find(
    (s) => s.eventType === 'terminal' && s.codeLine.includes('break')
  );
  if (!earlyBreakStep) {
    console.error('FAIL: Bubble sort failed to trigger early termination break on sorted input');
    passed = false;
  }

  // Test 3.3: Single element array
  const singleBsTrace = BubbleSortTracer.trace([42]);
  if (!singleBsTrace.success || singleBsTrace.steps[singleBsTrace.steps.length - 1].variables.result[0] !== 42) {
    console.error('FAIL: Bubble sort failed on single-element array');
    passed = false;
  }

  // =========================================================================
  // TEST SUITE 4: STACK & QUEUE TRACER
  // =========================================================================
  console.log('4. Testing Stack & Queue Tracers...');

  // Test 4.1: Stack LIFO operations
  const stackTrace = StackQueueTracer.traceStack([
    { type: 'push', value: 'First' },
    { type: 'push', value: 'Second' },
    { type: 'peek' },
    { type: 'pop' },
    { type: 'pop' },
  ]);
  const popSteps = stackTrace.steps.filter((s) => s.eventType === 'return' && s.variables.poppedValue !== undefined);
  if (popSteps.length !== 2 || popSteps[0].variables.poppedValue !== 'Second' || popSteps[1].variables.poppedValue !== 'First') {
    console.error('FAIL: Stack LIFO pop ordering mismatch (expected Second, then First)');
    passed = false;
  }

  // Test 4.2: Stack underflow guard
  const underflowStackTrace = StackQueueTracer.traceStack([
    { type: 'pop' }, // Popping empty stack
  ]);
  const underflowErrorStep = underflowStackTrace.steps.find((s) => s.eventType === 'error');
  if (!underflowErrorStep || !underflowErrorStep.errorMessage?.includes('Underflow')) {
    console.error('FAIL: Stack popping empty buffer did not trigger Underflow error step');
    passed = false;
  }

  // Test 4.3: Queue FIFO operations
  const queueTrace = StackQueueTracer.traceQueue([
    { type: 'enqueue', value: 'Customer A' },
    { type: 'enqueue', value: 'Customer B' },
    { type: 'peek' },
    { type: 'dequeue' },
    { type: 'dequeue' },
  ]);
  const dequeueSteps = queueTrace.steps.filter((s) => s.eventType === 'return' && s.variables.dequeuedValue !== undefined);
  if (dequeueSteps.length !== 2 || dequeueSteps[0].variables.dequeuedValue !== 'Customer A' || dequeueSteps[1].variables.dequeuedValue !== 'Customer B') {
    console.error('FAIL: Queue FIFO dequeue ordering mismatch (expected Customer A, then Customer B)');
    passed = false;
  }

  // Test 4.4: Queue underflow guard
  const underflowQueueTrace = StackQueueTracer.traceQueue([
    { type: 'dequeue' },
  ]);
  const qUnderflowStep = underflowQueueTrace.steps.find((s) => s.eventType === 'error');
  if (!qUnderflowStep || !qUnderflowStep.errorMessage?.includes('Underflow')) {
    console.error('FAIL: Queue dequeuing empty buffer did not trigger Underflow error step');
    passed = false;
  }

  // =========================================================================
  // TEST SUITE 5: RECURSION (FACTORIAL) TRACER
  // =========================================================================
  console.log('5. Testing Recursion (Factorial) Tracer...');

  // Test 5.1: Factorial n = 4 (growth to depth 4, unwinding to 24)
  const factTrace = RecursionTracer.trace(4);
  const factTerminal = factTrace.steps[factTrace.steps.length - 1];
  if (!factTerminal.isTerminal || factTerminal.variables.finalResult !== 24) {
    console.error(`FAIL: factorial(4) expected 24, got ${factTerminal.variables.finalResult}`);
    passed = false;
  }

  // Verify call-stack frame growth
  const maxStackDepth = Math.max(
    ...factTrace.steps.map((s) => s.dataStructureState.callStack?.length || 0)
  );
  if (maxStackDepth !== 4) {
    console.error(`FAIL: factorial(4) expected maximum call-stack depth of 4, got ${maxStackDepth}`);
    passed = false;
  }

  // Verify unwinding steps
  const unwindingSteps = factTrace.steps.filter((s) => s.eventType === 'return');
  if (unwindingSteps.length !== 4) {
    console.error(`FAIL: factorial(4) expected 4 return/unwinding steps, got ${unwindingSteps.length}`);
    passed = false;
  }

  // Test 5.2: Base case n = 1
  const fact1Trace = RecursionTracer.trace(1);
  if (fact1Trace.steps[fact1Trace.steps.length - 1].variables.finalResult !== 1) {
    console.error('FAIL: factorial(1) should return 1');
    passed = false;
  }

  // Test 5.3: Domain error on negative n
  const negFactTrace = RecursionTracer.trace(-3);
  if (negFactTrace.success !== false || negFactTrace.steps[0].eventType !== 'error') {
    console.error('FAIL: Negative n should be rejected as domain error');
    passed = false;
  }

  // Test 5.4: Safety boundary limit (n > 12)
  const overflowFactTrace = RecursionTracer.trace(15);
  if (overflowFactTrace.success !== false || !overflowFactTrace.errorMessage?.includes('safety limit')) {
    console.error('FAIL: n > 12 should trigger safety boundary error');
    passed = false;
  }

  // =========================================================================
  // TEST SUITE 6: IMMUTABILITY, STEP NAVIGATION, PREDICTION SYSTEM
  // =========================================================================
  console.log('6. Testing Immutability, Step Navigation & Prediction System...');

  // Test 6.1: Snapshot Immutability
  const testTrace = BinarySearchTracer.trace([10, 20, 30, 40, 50], 30);
  const step0Vars = JSON.stringify(testTrace.steps[0].variables);
  let session = CodeTracingEngine.createInitialSession('binary_search', {}, testTrace);

  // Advance several steps
  session = CodeTracingEngine.stepForward(session, testTrace);
  session = CodeTracingEngine.stepForward(session, testTrace);
  session = CodeTracingEngine.stepForward(session, testTrace);

  // Rewind
  session = CodeTracingEngine.stepBackward(session, testTrace);
  session = CodeTracingEngine.stepBackward(session, testTrace);
  session = CodeTracingEngine.stepBackward(session, testTrace);

  if (JSON.stringify(testTrace.steps[0].variables) !== step0Vars) {
    console.error('FAIL: Navigation mutated historical trace step variables');
    passed = false;
  }

  // Test 6.2: Variable Diff Tracking
  const stepsWithChanges = testTrace.steps.filter((s) => s.changedVariables.length > 0);
  if (stepsWithChanges.length === 0) {
    console.error('FAIL: Trace did not calculate changedVariables diff');
    passed = false;
  }

  // Test 6.3: Prediction evaluation
  const predStep = testTrace.steps.find((s) => s.prediction !== undefined);
  if (predStep && predStep.prediction) {
    const correctIdx = predStep.prediction.correctIndex;
    const correctSession = CodeTracingEngine.evaluatePrediction(session, correctIdx, predStep.prediction);
    if (!correctSession.predictionFeedback?.isCorrect) {
      console.error('FAIL: evaluatePrediction marked correct index as incorrect');
      passed = false;
    }

    const wrongIdx = (correctIdx + 1) % predStep.prediction.options.length;
    const wrongSession = CodeTracingEngine.evaluatePrediction(session, wrongIdx, predStep.prediction);
    if (wrongSession.predictionFeedback?.isCorrect !== false) {
      console.error('FAIL: evaluatePrediction marked wrong index as correct');
      passed = false;
    }
  }

  // Test 6.4: Complexity Metadata lookup
  const algos = CodeTracingEngine.AVAILABLE_ALGORITHMS;
  if (algos.length < 5) {
    console.error(`FAIL: Expected at least 5 available algorithms, got ${algos.length}`);
    passed = false;
  }

  console.log(passed ? '✅ All Step 3 Code-to-Visual Learning Engine tests PASSED' : '❌ Some tests FAILED');
  return passed;
}

if (require.main === module) {
  runCodeTracingEngineTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}

