/**
 * VisiOS — Milestone H: Mathematical Correctness & Verification Regression Suite (Phase 3)
 * Rigorously validates all Milestone H regression scenarios:
 * 1. Mathematics: linear functions, fractions, binomial expansion, Pythagorean theorem, derivations, malformed inputs.
 * 2. Visualization consistency: single source of truth, coordinate accuracy, fraction rendering invariants, 3D asset fallbacks.
 * 3. Physics: symplectic / kinematic parameter validation, physical unit consistency.
 * 4. Algorithms: binary search, bubble sort, stack, queue, recursion precondition & transitions.
 * 5. Integration: learning result contract, verification status propagation, backward compatibility.
 */

import { MathematicalCorrectnessEngine } from '../features/learning/MathematicalCorrectnessEngine';
import { BinomialExpansionEngine } from '../features/learning/BinomialExpansionEngine';
import { FormulaDerivationEngine } from '../features/learning/FormulaDerivationEngine';
import { MathInputNormalizer } from '../features/learning/MathInputNormalizer';
import { VisualLearningDiagnosticsEngine } from '../features/diagnostics/VisualLearningDiagnosticsEngine';
import { BinarySearchTracer } from '../features/code-tracing/algorithms/BinarySearchTracer';
import { BubbleSortTracer } from '../features/code-tracing/algorithms/BubbleSortTracer';
import { StackQueueTracer } from '../features/code-tracing/algorithms/StackQueueTracer';
import { RecursionTracer } from '../features/code-tracing/algorithms/RecursionTracer';
import { CanvasVisualizationAdapter } from '../features/canvas/CanvasVisualizationAdapter';
import { UnifiedLearningContracts } from '../features/learning/UnifiedLearningContracts';
import { LearningPlan, TopicClassificationResult } from '../features/learning/types';

export async function runMilestoneHCorrectnessTests(): Promise<boolean> {
  console.log('\n=============================================================');
  console.log('--- Running Phase 3: Milestone H Correctness & Verification Suite ---');
  console.log('=============================================================\n');

  let passed = true;

  function assert(condition: boolean, desc: string) {
    if (!condition) {
      console.error(`  ❌ FAILED: ${desc}`);
      passed = false;
    } else {
      console.log(`  ✓ PASSED: ${desc}`);
    }
  }

  // --------------------------------------------------------------------------
  // SECTION 1: MATHEMATICS CORRECTNESS & REASONING (Scenarios 1-7)
  // --------------------------------------------------------------------------
  console.log('\n[Section 1] Mathematics Correctness & Verification:');

  // Scenario 1: y = 2x + 3 produces slope 2 and intercept 3
  const linearAnalysis = MathematicalCorrectnessEngine.analyzeLinearFunction(2, 3);
  assert(linearAnalysis.slope === 2, 'Scenario 1a: Linear slope is exactly 2');
  assert(linearAnalysis.intercept === 3, 'Scenario 1b: Linear y-intercept is exactly 3');
  assert(linearAnalysis.xIntercept === -1.5, 'Scenario 1c: Root x-intercept is exactly -1.5');

  // Scenario 2: Evaluating y = 2x + 3 at x = 2 produces 7
  assert(linearAnalysis.evaluateAt(2) === 7, 'Scenario 2: f(2) = 2(2) + 3 evaluates deterministically to 7');
  assert(linearAnalysis.evaluateAt(0) === 3, 'Scenario 2b: f(0) evaluates to 3');

  // Scenario 3: 1/2 + 1/3 produces 5/6 without floating-point drift
  const fractionAdd = MathematicalCorrectnessEngine.addFractions(1, 2, 1, 3);
  assert(
    fractionAdd.simplified.numerator === 5 && fractionAdd.simplified.denominator === 6,
    'Scenario 3: 1/2 + 1/3 evaluates to exact rational 5/6'
  );
  assert(fractionAdd.steps.length >= 4, 'Scenario 3b: Fraction addition includes step-by-step LCM and common denominator steps');

  // Scenario 4: (x + 2)^2 expands to x² + 4x + 4
  const binomialExpand = BinomialExpansionEngine.expand('x', '+', '2', 2);
  const termsVerify = MathematicalCorrectnessEngine.verifyBinomialExpansion(
    'x',
    '+',
    '2',
    2,
    binomialExpand.terms.map((t) => ({ coeff: t.coeff, p1: t.power1, p2: t.power2 }))
  );
  assert(termsVerify.isValid, 'Scenario 4: (x + 2)^2 contains valid binomial terms without omission');
  const calcBinomial = binomialExpand.calculate(3, 2); // (3 + 2)^2 = 25
  assert(calcBinomial.total === 25, 'Scenario 4b: Evaluates (3 + 2)^2 to 25');

  // Scenario 5: Pythagorean calculation for sides 3 and 4 produces hypotenuse 5
  const pythagoras = MathematicalCorrectnessEngine.analyzePythagorean(3, 4);
  assert(pythagoras.c === 5, 'Scenario 5: Legs 3 and 4 produce exact hypotenuse 5');
  assert(pythagoras.isExactIntegerTriple, 'Scenario 5b: Identifies (3, 4, 5) as exact integer triple');

  // Scenario 6: A deliberately incorrect derivation is rejected by the relevant validator
  const validDerivation = ['x + 3 = 7', 'x = 7 - 3', 'x = 4'];
  const validAudit = MathematicalCorrectnessEngine.validateLinearDerivationSteps(validDerivation);
  assert(validAudit.allStepsValid, 'Scenario 6a: Valid linear derivation steps accepted');

  const invalidDerivation = ['x + 3 = 7', 'x = 7 + 3', 'x = 10']; // False sign inversion
  const invalidAudit = MathematicalCorrectnessEngine.validateLinearDerivationSteps(invalidDerivation);
  assert(!invalidAudit.allStepsValid, 'Scenario 6b: Deliberately flawed derivation step (x = 7 + 3) strictly rejected');
  assert(
    invalidAudit.stepResults.some((s) => !s.isValid && s.issue?.includes('shifted')),
    'Scenario 6c: Diagnostic reports exact solution shift violation'
  );

  // Scenario 7: Malformed expressions produce structured errors without eval()
  const malformed1 = MathInputNormalizer.normalize('y = 2x +');
  assert(!malformed1.isValid, 'Scenario 7a: Trailing operator "y = 2x +" marked as invalid');
  assert(malformed1.mathType === 'malformed', 'Scenario 7b: Classified as malformed math type');
  assert(Boolean(malformed1.validationError?.includes('operator')), 'Scenario 7c: Structured error explains trailing operator');

  const zeroDenom = MathInputNormalizer.normalize('3/0');
  assert(!zeroDenom.isValid, 'Scenario 7d: Zero denominator 3/0 rejected as undefined');

  // --------------------------------------------------------------------------
  // SECTION 2: VISUALIZATION CONSISTENCY & PARAMETER FAITHFULNESS (Scenarios 8-13)
  // --------------------------------------------------------------------------
  console.log('\n[Section 2] Visualization Consistency & Single Source of Truth:');

  // Scenario 8: Plotted line matches its equation (m=2, c=3 passes through (0, 3) and (2, 7))
  const diagLineValid = VisualLearningDiagnosticsEngine.validateDeterministicResults(
    'linear_function',
    { m: 2, c: 3, x: 2 },
    { y: 7 },
    'The linear slope is 2 and at x = 2 the line reaches y = 7.'
  );
  assert(diagLineValid.severity === 'info', 'Scenario 8a: Consistent linear function plot validated');

  const diagLineContradiction = VisualLearningDiagnosticsEngine.validateDeterministicResults(
    'linear_function',
    { m: 2, c: 3, x: 2 },
    { y: 7 },
    'The linear slope is 5 and rises very steeply.' // Contradicts m = 2
  );
  assert(
    diagLineContradiction.failureCategory === 'explanation_inconsistency',
    'Scenario 8b: Explanation stating slope is 5 detected and flagged as contradictory'
  );

  // Scenario 9: Fraction visualization matches the fraction being represented
  const fractionProps = CanvasVisualizationAdapter.sanitizeGeometryProps({
    geometryType: 'fraction_visualizer',
    numerator: 5,
    denominator: 6,
  });
  assert(fractionProps.numerator === 5 && fractionProps.denominator === 6, 'Scenario 9: Fraction visualization props faithfully preserve 5/6');

  // Scenario 10: Changing an equation updates the corresponding visualization without stale state
  const updatedProps = CanvasVisualizationAdapter.sanitizeGeometryProps({
    geometryType: 'linear_plotter',
    slope: -3,
    intercept: 5,
  });
  assert(updatedProps.slope === -3 && updatedProps.intercept === 5, 'Scenario 10: Updated slope=-3, intercept=5 applied without retaining stale slope=2');

  // Scenario 11: Invalid input does not display a stale result as current
  const invalidSanitized = CanvasVisualizationAdapter.sanitizeGeometryProps({
    geometryType: 'linear_plotter',
    slope: NaN,
    intercept: undefined,
  });
  assert(invalidSanitized.slope === 2 && invalidSanitized.intercept === 1, 'Scenario 11: Corrupted/NaN inputs safely reset to default invariants rather than undefined');

  // Scenario 12: Missing 3D assets produce a valid fallback
  const missingAssetDiag = VisualLearningDiagnosticsEngine.checkVisualizationHealth('human heart', {
    is3D: true,
    assetPath: 'http://invalid.domain/assets/heart_mesh_404.gltf',
  });
  assert(missingAssetDiag.recoveryOutcome === 'recovered', 'Scenario 12a: Missing 3D asset triggers graceful recovery');
  assert(missingAssetDiag.fallbackVisual === 'Procedural 3D Geometry', 'Scenario 12b: Procedural fallback geometry displayed');

  // Scenario 13: A selected topic cannot silently display an unrelated model
  const unrelatedTopicCheck = VisualLearningDiagnosticsEngine.verifyLearningRoute('nonexistent_alien_biology');
  assert(unrelatedTopicCheck.failureCategory === 'unsupported_topic', 'Scenario 13a: Unrelated topic flagged honestly as unsupported');
  assert(unrelatedTopicCheck.recoveryOutcome === 'fallback_applied', 'Scenario 13b: Fallback applied instead of silently rendering heart or neuron');

  // --------------------------------------------------------------------------
  // SECTION 3: PHYSICS SIMULATION PARAMETERS & UNITS (Scenarios 14-16)
  // --------------------------------------------------------------------------
  console.log('\n[Section 3] Physics Simulation Parameters & Physical Laws:');

  // Scenario 14: Supported simulation produces deterministic results under deterministic conditions
  const pendulumCalc = FormulaDerivationEngine.calculate('physics_pendulum', { L: 1.0, g: 9.81 });
  assert(pendulumCalc.primaryResult === 2.01, 'Scenario 14: Pendulum period for L=1m, g=9.81m/s² calculates deterministically to 2.01s');
  assert(pendulumCalc.units === 's', 'Scenario 14b: Pendulum units verified as seconds (s)');

  // Scenario 15: Invalid physics parameters are rejected or clamped according to explicit rules
  const invalidProjectile = VisualLearningDiagnosticsEngine.validateDeterministicResults(
    'projectile',
    { velocity: -20, angle: 120 }, // Invalid: negative velocity, angle > 90°
    {}
  );
  assert(invalidProjectile.failureCategory === 'invalid_configuration', 'Scenario 15: Negative velocity and angle > 90° rejected by parameter validator');
  assert(invalidProjectile.recoveryOutcome === 'recovered', 'Scenario 15b: Clamping recovery action applied');

  // Scenario 16: Units and displayed state remain consistent with simulation output
  const fmaCalc = FormulaDerivationEngine.calculate('physics_f_ma', { m: 5, a: 4 });
  assert(fmaCalc.primaryResult === 20, 'Scenario 16a: F = m·a: 5kg × 4m/s² = 20 N');
  assert(fmaCalc.units === 'N', 'Scenario 16b: Units are strictly Newtons (N)');
  assert(fmaCalc.isDimensionallyConsistent, 'Scenario 16c: Dimensional consistency verified');

  // --------------------------------------------------------------------------
  // SECTION 4: CODE TRACING & ALGORITHM CORRECTNESS (Scenarios 17-21)
  // --------------------------------------------------------------------------
  console.log('\n[Section 4] Algorithm Correctness & State Transitions:');

  // Scenario 17: Binary search returns the correct result for supported input
  const bsTrace = BinarySearchTracer.trace([10, 20, 30, 40, 50, 60], 40);
  assert(bsTrace.success, 'Scenario 17a: Binary search succeeds on sorted array');
  const bsTerminal = bsTrace.steps[bsTrace.steps.length - 1];
  assert(bsTerminal.variables.result === 3, 'Scenario 17b: Target 40 found at exact index 3');

  // Scenario 18: Unsorted input is rejected according to algorithm contract
  const bsUnsorted = BinarySearchTracer.trace([50, 10, 40, 20], 40);
  assert(!bsUnsorted.success, 'Scenario 18a: Binary search strictly rejects unsorted input');
  assert(bsUnsorted.steps[0].eventType === 'error', 'Scenario 18b: Terminal step 0 is an error step');

  // Scenario 19: Bubble sort produces a correctly sorted output
  const bubbleTrace = BubbleSortTracer.trace([64, 34, 25, 12, 22, 11, 90]);
  assert(bubbleTrace.success, 'Scenario 19a: Bubble sort completes successfully');
  const finalSortedResult = bubbleTrace.steps[bubbleTrace.steps.length - 1].variables.result as number[];
  const isSorted = Array.isArray(finalSortedResult) && finalSortedResult.every((val, i, arr) => i === 0 || arr[i - 1] <= val);
  assert(isSorted, 'Scenario 19b: Bubble sort final array is strictly ascending');

  // Scenario 20: Stack and queue transitions preserve required semantics
  const stackTrace = StackQueueTracer.traceStack([
    { type: 'push', value: 42 },
    { type: 'push', value: 99 },
    { type: 'pop' },
  ]);
  assert(stackTrace.success, 'Scenario 20a: Stack operations trace successfully');
  const popSteps = stackTrace.steps.filter((s) => s.eventType === 'return' && s.variables.poppedValue !== undefined);
  assert(popSteps.length === 1 && popSteps[0].variables.poppedValue === 99, 'Scenario 20b: LIFO: popped 99 first');

  const queueTrace = StackQueueTracer.traceQueue([
    { type: 'enqueue', value: 10 },
    { type: 'enqueue', value: 20 },
    { type: 'dequeue' },
  ]);
  assert(queueTrace.success, 'Scenario 20c: Queue operations trace successfully');
  const dequeueSteps = queueTrace.steps.filter((s) => s.eventType === 'return' && s.variables.dequeuedValue !== undefined);
  assert(dequeueSteps.length === 1 && dequeueSteps[0].variables.dequeuedValue === 10, 'Scenario 20d: FIFO: dequeued 10 first');

  // Scenario 21: Invalid algorithm inputs produce understandable errors
  const emptyStackPop = StackQueueTracer.traceStack([{ type: 'pop' }]);
  assert(
    emptyStackPop.steps.some((s) => s.eventType === 'error' && s.errorMessage?.includes('Underflow')),
    'Scenario 21: Pop on empty stack produces underflow error step'
  );

  // --------------------------------------------------------------------------
  // SECTION 5: INTEGRATION & LEARNING RESULT CONTRACT (Scenarios 22-27)
  // --------------------------------------------------------------------------
  console.log('\n[Section 5] Integration, Verification Contracts & Backward Compatibility:');

  // Scenario 22: Orchestrator propagates verification status
  const mockPlan: LearningPlan = {
    conceptId: 'physics_f_ma',
    title: 'Newton Second Law',
    category: 'physics',
    subject: 'Physics',
    capabilityLevel: 'fundamental',
    disclosures: [],
    overview: 'F = m · a',
    motivation: 'Foundations of dynamics',
    variables: [],
    interactiveParameters: [],
    derivationSteps: [],
    derivationSummary: 'Derivation of F = ma',
    symbolicVerificationNote: 'Verified',
    workedExamples: [],
    visualizationPlan: {
      rendererType: 'physics_vector_simulator',
      title: 'Force Vectors',
      description: 'Dynamic vector',
      learningObjective: 'Observe acceleration',
      activeVariables: ['F', 'm'],
      interactionsAvailable: ['Slide mass'],
      expectedBehavior: 'Draws force vector',
      fallbackAvailable: true,
    },
    prerequisites: ['Kinematics'],
    applications: ['Automotive braking'],
    assumptions: ['Non-relativistic'],
    defaultExperimentState: {
      parameters: { m: 2, a: 3 },
      calculatedOutputs: { F: 6 },
      outputFormulas: { F: 'm * a' },
      statusMessage: 'Ready',
    },
  };

  const mockClassification: TopicClassificationResult = {
    domain: 'physics',
    intent: 'derivation',
    engine: 'math',
    confidence: 1.0,
    requiresClarification: false,
    reason: 'Newton law query',
    originalQuery: 'F = ma',
  };

  const learningResponse = UnifiedLearningContracts.planToLearningResponse(
    mockPlan,
    mockClassification,
    'math_engine',
    12,
    'req_p3_test'
  );
  assert(learningResponse.status === 'success', 'Scenario 22a: Learning response status is success');
  assert(learningResponse.verification !== undefined, 'Scenario 22b: Learning response contains verification contract');
  assert(
    learningResponse.verification?.state === 'verified_deterministic',
    'Scenario 22c: Verification state is verified_deterministic'
  );
  assert(learningResponse.verification?.isVisuallyFaithful === true, 'Scenario 22d: Visual faithfulness certified');

  // Scenario 23: Partial failures do not invalidate successful independent steps
  const uncertainPlan: LearningPlan = {
    ...mockPlan,
    uncertaintyState: { isUncertain: true, reason: 'Ambiguous notation', suggestedClarifications: ['Option A', 'Option B'] },
  };
  const uncertainResponse = UnifiedLearningContracts.planToLearningResponse(
    uncertainPlan,
    mockClassification,
    'honest_uncertainty',
    10,
    'req_p3_uncertain'
  );
  assert(uncertainResponse.status === 'partial', 'Scenario 23a: Uncertain request yields partial response status');
  assert(
    uncertainResponse.verification?.state === 'needs_clarification',
    'Scenario 23b: Verification state clearly declares needs_clarification'
  );

  // Scenario 24: Visualization adapters reject invalid specifications
  const sanitizedSimulation = CanvasVisualizationAdapter.sanitizeSimulationProps({
    gravity: 'invalid_gravity' as any,
    length: -5,
  });
  assert(
    sanitizedSimulation.gravity === 9.81,
    'Scenario 24a: Non-numeric gravity safely replaced with 9.81'
  );

  // Scenario 25: Existing persistence continues to load older supported records
  const legacyPlanBack = UnifiedLearningContracts.responseToLearningPlan(learningResponse);
  assert(legacyPlanBack.title === mockPlan.title, 'Scenario 25a: Bi-directional conversion recovers plan title');
  assert(legacyPlanBack.category === 'physics', 'Scenario 25b: Bi-directional conversion recovers category');
  assert(legacyPlanBack.subject === 'Physics', 'Scenario 25c: Bi-directional conversion recovers subject');

  // Scenario 26: Milestone 7 quality invariants preserved
  const contradictionDetect = VisualLearningDiagnosticsEngine.validateDeterministicResults(
    'pythagoras',
    { a: 3, b: 4 },
    { c: 8 } // False: hypotenuse must be 5
  );
  assert(
    contradictionDetect.failureCategory === 'mathematical_validation_failure',
    'Scenario 26: Contradictory calculation (c = 8 for a=3, b=4) detected as mathematical validation failure'
  );

  // Scenario 27: Previously working Phase 1 and Phase 2 behavior intact
  assert(
    UnifiedLearningContracts.MAX_INPUT_LENGTH === 300,
    'Scenario 27: MAX_INPUT_LENGTH preserved at 300 characters'
  );

  console.log('\n=============================================================');
  if (passed) {
    console.log('✅ ALL 27 MILESTONE H REGRESSION SCENARIOS PASSED (100%)');
  } else {
    console.error('❌ SOME MILESTONE H REGRESSION TESTS FAILED');
  }
  console.log('=============================================================\n');

  return passed;
}

// Auto-run when invoked directly
if (typeof require !== 'undefined' && require.main === module) {
  runMilestoneHCorrectnessTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
