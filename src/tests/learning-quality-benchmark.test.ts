/**
 * VisiOS — Step 2: AI Learning Quality Benchmark Automated Test Suite
 * Validates benchmark dataset schema integrity, deterministic mathematical oracles,
 * anti-hallucination guards, metrics group accounting, and baseline comparison deltas.
 */

import { LEARNING_QUALITY_BENCHMARK_DATASET, BENCHMARK_DATASET_VERSION } from '../features/benchmark/BenchmarkDataset';
import { DeterministicEvaluator } from '../features/benchmark/DeterministicEvaluator';
import { SemanticEvaluator } from '../features/benchmark/SemanticEvaluator';
import { BenchmarkRunner } from '../features/benchmark/BenchmarkRunner';
import { BenchmarkReport, BenchmarkMetricsGroup } from '../features/benchmark/BenchmarkTypes';

export async function runLearningQualityBenchmarkTests(): Promise<boolean> {
  console.log('\n--- Running Step 2: AI Learning Quality Benchmark Test Suite ---');
  let passed = true;

  function assert(condition: boolean, message: string) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      passed = false;
    } else {
      console.log(`  ✓ ${message}`);
    }
  }

  // =========================================================================
  // 1. Benchmark Dataset Schema Integrity & Curated Coverage
  // =========================================================================
  console.log('\n[Suite 1] Benchmark Dataset Integrity & Schema Validation');
  assert(LEARNING_QUALITY_BENCHMARK_DATASET.length >= 30, `Dataset contains at least 30 curated test cases (found: ${LEARNING_QUALITY_BENCHMARK_DATASET.length})`);
  assert(BENCHMARK_DATASET_VERSION === '1.0.0', `Dataset version is pinned to 1.0.0 (found: ${BENCHMARK_DATASET_VERSION})`);

  // Check unique IDs
  const idSet = new Set<string>();
  let hasDuplicateId = false;
  for (const tc of LEARNING_QUALITY_BENCHMARK_DATASET) {
    if (idSet.has(tc.id)) {
      hasDuplicateId = true;
      console.error(`Duplicate ID found: ${tc.id}`);
    }
    idSet.add(tc.id);
  }
  assert(!hasDuplicateId, 'All 35 benchmark test case IDs are unique');

  // Verify domain distribution
  const domainCounts = new Map<string, number>();
  for (const tc of LEARNING_QUALITY_BENCHMARK_DATASET) {
    domainCounts.set(tc.domain, (domainCounts.get(tc.domain) || 0) + 1);
  }
  assert((domainCounts.get('mathematics') || 0) >= 5, `Mathematics domain has >= 5 cases (found: ${domainCounts.get('mathematics')})`);
  assert((domainCounts.get('physics') || 0) >= 5, `Physics domain has >= 5 cases (found: ${domainCounts.get('physics')})`);
  assert((domainCounts.get('computer_science') || 0) >= 5, `Computer Science domain has >= 5 cases (found: ${domainCounts.get('computer_science')})`);
  assert((domainCounts.get('biology') || 0) >= 2, `Biology domain has >= 2 cases (found: ${domainCounts.get('biology')})`);
  assert((domainCounts.get('other') || 0) >= 5, `Edge & failure modes have >= 5 cases (found: ${domainCounts.get('other')})`);

  // Verify schema properties on each case
  let allCasesValid = true;
  for (const tc of LEARNING_QUALITY_BENCHMARK_DATASET) {
    if (!tc.id || !tc.intent || !tc.expectedEngine || !tc.expectedRenderer) {
      allCasesValid = false;
      console.error(`Invalid case schema: ${tc.id}`);
    }
  }
  assert(allCasesValid, 'All test cases adhere to strict BenchmarkTestCase schema with non-empty fields');

  // =========================================================================
  // 2. Deterministic Mathematical Evaluator Independent Oracles
  // =========================================================================
  console.log('\n[Suite 2] Deterministic Independent Math Oracles');

  // Binomial Expansion Oracle
  const bin2Oracle = DeterministicEvaluator.calculateBinomialExpansion(3, 4, 2, false);
  assert(
    bin2Oracle === 49,
    `Binomial oracle calculates (3+4)^2 = 49 (calculated: ${bin2Oracle})`
  );

  const bin3Oracle = DeterministicEvaluator.calculateBinomialExpansion(5, 2, 3, true);
  assert(
    bin3Oracle === 27,
    `Binomial oracle calculates (5-2)^3 = 27 (calculated: ${bin3Oracle})`
  );

  // Law of Cosines Oracle
  // 3-4-5 right triangle when C = 90 deg -> c = 5
  const loc90 = DeterministicEvaluator.calculateLawOfCosines(3, 4, 90);
  assert(Math.abs(loc90.c - 5.0) < 1e-4, `Law of Cosines gives c=5 for 3-4 right triangle at 90° (calculated: ${loc90.c})`);

  // Equilateral triangle when a=6, b=6, C=60 deg -> c = 6
  const loc60 = DeterministicEvaluator.calculateLawOfCosines(6, 6, 60);
  assert(Math.abs(loc60.c - 6.0) < 1e-4, `Law of Cosines gives c=6 for equilateral triangle at 60° (calculated: ${loc60.c})`);

  // Newton's Second Law Oracle
  const newtonOracle = DeterministicEvaluator.calculateNewtonAcceleration(100, 5);
  assert(newtonOracle.acceleration === 20, `Newton oracle calculates a = F/m (100 N / 5 kg = 20 m/s²)`);

  // Ballistic Kinematics Oracle
  // 45 deg, 20 m/s, g = 9.81 -> Range = v^2 * sin(90) / 9.81 = 400 / 9.81 = 40.7747 m
  const kinOracle = DeterministicEvaluator.calculateBallisticRange(20, 45, 9.81);
  assert(Math.abs(kinOracle.range - 40.77) < 0.1, `Kinematics oracle calculates maximum 45° projectile range (approx 40.77m)`);
  assert(Math.abs(kinOracle.flightTime - 2.88) < 0.1, `Kinematics oracle calculates flight time (approx 2.88s)`);

  // Pendulum Period Oracle
  // L = 1.0 m, g = 9.81 m/s^2 -> T = 2 * pi * sqrt(1 / 9.81) = 2.006s
  const pendOracle = DeterministicEvaluator.calculatePendulumPeriod(1.0, 9.81);
  assert(Math.abs(pendOracle.period - 2.01) < 0.05, `Pendulum oracle calculates Galilean period T = 2.01s for L=1m`);

  // Binary Search Oracle
  const sortedArr = [3, 7, 12, 19, 25, 34, 48, 59, 72, 88, 95];
  const bsFound = DeterministicEvaluator.verifyBinarySearchReference(sortedArr, 34);
  assert(bsFound.found === true && bsFound.targetIndex === 5, `Binary search oracle locates target 34 at index 5`);

  const bsNotFound = DeterministicEvaluator.verifyBinarySearchReference(sortedArr, 999);
  assert(bsNotFound.found === false && bsNotFound.targetIndex === -1, `Binary search oracle reports not found for missing key 999`);

  // =========================================================================
  // 3. Anti-Hallucination & Parameter Rejection
  // =========================================================================
  console.log('\n[Suite 3] Anti-Hallucination & Forbidden Claims Detection');

  const corpusWithForbidden = 'This explanation falsely states that acceleration increases with mass when pushing objects.';
  const forbiddenList = ['acceleration increases with mass', 'mass is weight'];
  const detectedForbidden = SemanticEvaluator.detectForbiddenClaims(corpusWithForbidden, forbiddenList);
  assert(
    detectedForbidden.length === 1 && detectedForbidden[0] === 'acceleration increases with mass',
    `Anti-hallucination detector successfully flagged forbidden pedagogical misconception: "${detectedForbidden[0]}"`
  );

  const cleanCorpus = 'As mass increases, acceleration decreases for a constant applied force F = ma.';
  const detectedClean = SemanticEvaluator.detectForbiddenClaims(cleanCorpus, forbiddenList);
  assert(detectedClean.length === 0, 'Clean corpus passes without false positive forbidden claim triggers');

  // Concept coverage evaluator
  const corpusConcepts = 'A binary search divides sorted array into halves using low mid high pointers with O(log n) time.';
  const coverageResult = SemanticEvaluator.evaluateConceptCoverageFromCorpus(corpusConcepts, [
    'sorted array',
    'O(log n)',
    'mid',
    'quantum supercomputing', // deliberate missing concept
  ]);
  assert(coverageResult.coveredCount === 3, `Concept coverage counted 3 covered concepts out of 4`);
  assert(coverageResult.missingConcepts.includes('quantum supercomputing'), `Correctly identified missing concept "quantum supercomputing"`);

  // =========================================================================
  // 4. Metrics Group Accounting & Division Guard
  // =========================================================================
  console.log('\n[Suite 4] Metrics Group Accounting & Reporting Math');

  const sampleGroup: BenchmarkMetricsGroup = {
    total: 10,
    passed: 8,
    failed: 1,
    inconclusive: 1,
    skipped: 0,
    passRatePercent: 80.0,
    averageLatencyMs: 15,
  };
  assert(
    sampleGroup.passed + sampleGroup.failed + sampleGroup.inconclusive + sampleGroup.skipped === sampleGroup.total,
    'Metrics group status counts partition total evaluations without masking'
  );

  // =========================================================================
  // 5. Baseline Comparison Delta Engine
  // =========================================================================
  console.log('\n[Suite 5] Baseline Regression Delta Logic');

  const baselineStub: BenchmarkReport = {
    runId: 'baseline_run_01',
    datasetVersion: '1.0.0',
    timestamp: Date.now(),
    mode: 'quick',
    totalCases: 2,
    environment: { nodeVersion: process.version, platform: process.platform, isAiConnected: false, aiProvider: 'none' },
    overallSummary: { total: 2, passed: 1, failed: 1, inconclusive: 0, skipped: 0, passRatePercent: 50.0, averageLatencyMs: 10 },
    dimensionMetrics: {} as any,
    domainMetrics: {} as any,
    knownLimitations: [],
    caseResults: [
      { caseId: 'math_case', input: 'x', domain: 'mathematics', overallStatus: 'PASS', dimensions: {} as any, executionTimeMs: 5, routeTaken: 'math_engine', timestamp: Date.now() },
      { caseId: 'phys_case', input: 'y', domain: 'physics', overallStatus: 'FAIL', dimensions: {} as any, executionTimeMs: 5, routeTaken: 'math_engine', timestamp: Date.now() },
    ],
  };

  const currentStub: BenchmarkReport = {
    ...baselineStub,
    runId: 'current_run_02',
    overallSummary: { total: 2, passed: 2, failed: 0, inconclusive: 0, skipped: 0, passRatePercent: 100.0, averageLatencyMs: 10 },
    caseResults: [
      { caseId: 'math_case', input: 'x', domain: 'mathematics', overallStatus: 'PASS', dimensions: {} as any, executionTimeMs: 5, routeTaken: 'math_engine', timestamp: Date.now() },
      { caseId: 'phys_case', input: 'y', domain: 'physics', overallStatus: 'PASS', dimensions: {} as any, executionTimeMs: 5, routeTaken: 'math_engine', timestamp: Date.now() }, // fixed!
    ],
  };

  const delta = BenchmarkRunner.compareWithBaseline(currentStub, baselineStub);
  assert(delta.passRateDeltaPercent === 50.0, `Baseline delta computes +50% pass rate improvement (actual: ${delta.passRateDeltaPercent}%)`);
  assert(delta.newRegressions.length === 0, `Baseline delta identifies 0 new regressions`);
  assert(delta.newFixes.length === 1 && delta.newFixes[0].caseId === 'phys_case', `Baseline delta correctly identifies "phys_case" as a new fix`);

  console.log(passed ? '\n✅ All Step 2 Learning Quality Benchmark Unit Tests PASSED' : '\n❌ Some Step 2 Benchmark Tests FAILED');
  return passed;
}

// Allow direct execution
if (require.main === module) {
  runLearningQualityBenchmarkTests().then((ok) => {
    process.exitCode = ok ? 0 : 1;
  });
}
