/**
 * VisiOS — Step 4: What-If Scenario Engine Automated Test Suite
 * Validates baseline immutability, alternative isolation, deterministic physics computations,
 * numerical delta & zero-baseline percentage math, prediction evaluation,
 * single-variable controlled validation, and causal explanations.
 */

import assert from 'assert';
import { WhatIfExecutionService } from '../features/what-if/WhatIfExecutionService';
import {
  ScenarioConfig,
  ScenarioPrediction,
} from '../features/what-if/WhatIfTypes';

function assertCloseTo(actual: number, expected: number, delta: number = 0.1, message?: string) {
  assert(
    Math.abs(actual - expected) <= delta,
    `${message || 'Value mismatch'}: expected ${expected} ± ${delta}, got ${actual}`
  );
}

export async function runWhatIfScenarioEngineTests(): Promise<boolean> {
  console.log('--- Running Step 4: VisiOS What-If Scenario Engine Tests ---');
  let passed = true;

  // =========================================================================
  // SUITE 1: BASELINE IMMUTABILITY & ALTERNATIVE ISOLATION
  // =========================================================================
  console.log('1. Testing Baseline Immutability & Alternative Scenario Isolation...');

  const baseline = WhatIfExecutionService.createDefaultBaseline('exp_projectile_motion');
  const baselineSpeedInitial = baseline.parameters.speed;
  const baselineAngleInitial = baseline.parameters.angle;

  const altA = WhatIfExecutionService.cloneAsAlternative(baseline, 'Alternative A');
  const altB = WhatIfExecutionService.cloneAsAlternative(baseline, 'Alternative B');

  // Mutate Alternative A parameters
  altA.parameters.angle = 60;
  altA.parameters.speed = 35;

  // Mutate Alternative B parameters
  altB.parameters.gravity = 1.62;

  // Verify baseline remains strictly unmodified
  if (baseline.parameters.speed !== baselineSpeedInitial || baseline.parameters.angle !== baselineAngleInitial) {
    console.error('FAIL: Mutating alternative scenario corrupted baseline parameters (Immutability violation)');
    passed = false;
  }

  // Verify Alternative B was not contaminated by Alternative A
  if (altB.parameters.angle !== baselineAngleInitial || altB.parameters.speed !== baselineSpeedInitial) {
    console.error('FAIL: Mutating Alternative A contaminated Alternative B (Scenario isolation violation)');
    passed = false;
  }

  // =========================================================================
  // SUITE 2: PROJECTILE MOTION WHAT-IF DELTA & TRAJECTORY COMPARISON
  // =========================================================================
  console.log('2. Testing Projectile Motion What-If Angle & Speed Sensitivity...');

  // Baseline: 45° launch at 20 m/s on Earth (g = 9.81)
  const baseRes = WhatIfExecutionService.executeScenario(baseline);
  assertCloseTo(baseRes.metrics.range, 40.77, 0.1, 'Baseline range at 45°');

  // Alternative 1: 30° launch at same speed
  const alt30 = WhatIfExecutionService.cloneAsAlternative(baseline, '30° Launch');
  alt30.parameters.angle = 30;
  const alt30Res = WhatIfExecutionService.executeScenario(alt30);
  assertCloseTo(alt30Res.metrics.range, 35.31, 0.1, 'Alternative range at 30°');

  // Compare Baseline (45°) vs Alternative (30°)
  const cmp30 = WhatIfExecutionService.compareScenarios(baseline, baseRes, alt30, alt30Res);

  // Check changed parameter: angle changed by -15°
  const angleDelta = cmp30.changedParameters.find((p) => p.symbol === 'angle');
  if (!angleDelta || angleDelta.delta !== -15 || angleDelta.baseline !== 45 || angleDelta.alternative !== 30) {
    console.error('FAIL: Projectile angle parameter delta mismatch');
    passed = false;
  }

  // Check range delta: 35.31 - 40.77 = -5.46 m
  const rangeDelta = cmp30.metricDeltas.find((m) => m.symbol === 'range');
  if (!rangeDelta || rangeDelta.direction !== 'decrease') {
    console.error('FAIL: Expected range to decrease from 45° to 30°');
    passed = false;
  }
  assertCloseTo(rangeDelta!.absoluteDelta, -5.46, 0.1, 'Range absolute delta');

  // Trajectory points generated for visual overlay
  if (!baseRes.visualData?.trajectoryPoints || baseRes.visualData.trajectoryPoints.length < 10) {
    console.error('FAIL: Baseline missing discrete trajectory points for visualization');
    passed = false;
  }
  if (!alt30Res.visualData?.trajectoryPoints || alt30Res.visualData.trajectoryPoints.length < 10) {
    console.error('FAIL: Alternative missing discrete trajectory points for visualization');
    passed = false;
  }

  // =========================================================================
  // SUITE 3: HARMONIC PENDULUM GALILEO SCALING & SMALL-ANGLE CHECK
  // =========================================================================
  console.log('3. Testing Harmonic Pendulum Length Scaling & Galileo Law...');

  const pendBase = WhatIfExecutionService.createDefaultBaseline('exp_harmonic_pendulum');
  pendBase.parameters.length = 1.0;
  pendBase.parameters.initialAngle = 10;
  const pendBaseRes = WhatIfExecutionService.executeScenario(pendBase);
  // T = 2π√(1/9.81) = 2.01s
  assertCloseTo(pendBaseRes.metrics.period, 2.01, 0.1, '1m pendulum period');

  // Quadruple length to 4.0m
  const pendAlt = WhatIfExecutionService.cloneAsAlternative(pendBase, 'Quadrupled Length');
  pendAlt.parameters.length = 4.0;
  const pendAltRes = WhatIfExecutionService.executeScenario(pendAlt);
  // T = 2π√(4/9.81) = 4.01s (exactly double period!)
  assertCloseTo(pendAltRes.metrics.period, 4.02, 0.1, '4m pendulum period');

  const pendCmp = WhatIfExecutionService.compareScenarios(pendBase, pendBaseRes, pendAlt, pendAltRes);
  const periodDelta = pendCmp.metricDeltas.find((m) => m.symbol === 'period');
  if (!periodDelta || periodDelta.direction !== 'increase' || Math.abs((periodDelta.percentChange ?? 0) - 100) > 1.0) {
    console.error(`FAIL: Quadrupled pendulum length expected ~+100% period increase, got ${periodDelta?.percentChangeFormatted}`);
    passed = false;
  }

  // Test Small-Angle Warning (> 20°)
  const largeAngleAlt = WhatIfExecutionService.cloneAsAlternative(pendBase, 'Large Angle 60°');
  largeAngleAlt.parameters.initialAngle = 60;
  const largeAngleRes = WhatIfExecutionService.executeScenario(largeAngleAlt);
  const hasSmallAngleWarning = largeAngleRes.assumptions.some((a) => a.includes('Small-Angle Warning'));
  if (!hasSmallAngleWarning) {
    console.error('FAIL: Pendulum simulation failed to flag Small-Angle approximation warning for 60° swing');
    passed = false;
  }

  // =========================================================================
  // SUITE 4: NEWTON'S 2ND LAW FORCE CART DYNAMICS
  // =========================================================================
  console.log("4. Testing Newton's 2nd Law Force Cart Sensitivity...");

  const cartBase = WhatIfExecutionService.createDefaultBaseline('exp_newton_second_law');
  cartBase.parameters.force = 20; // N
  cartBase.parameters.mass = 4; // kg
  const cartBaseRes = WhatIfExecutionService.executeScenario(cartBase);
  // a = 20 / 4 = 5.0 m/s²
  assertCloseTo(cartBaseRes.metrics.acceleration, 5.0, 0.05, 'Cart base acceleration');

  // Double the mass to 8 kg (under constant force 20 N) -> acceleration must halve to 2.5 m/s²
  const cartAlt = WhatIfExecutionService.cloneAsAlternative(cartBase, 'Doubled Mass (8kg)');
  cartAlt.parameters.mass = 8;
  const cartAltRes = WhatIfExecutionService.executeScenario(cartAlt);
  assertCloseTo(cartAltRes.metrics.acceleration, 2.5, 0.05, 'Cart halved acceleration');

  const cartCmp = WhatIfExecutionService.compareScenarios(cartBase, cartBaseRes, cartAlt, cartAltRes);
  const accDelta = cartCmp.metricDeltas.find((m) => m.symbol === 'acceleration');
  if (!accDelta || accDelta.direction !== 'decrease' || accDelta.absoluteDelta !== -2.5 || accDelta.percentChange !== -50) {
    console.error(`FAIL: Doubling mass expected -50% acceleration change, got delta ${accDelta?.absoluteDelta}`);
    passed = false;
  }

  // =========================================================================
  // SUITE 5: NUMERICAL DIFFERENCE & ZERO-BASELINE DIVISION GUARD
  // =========================================================================
  console.log('5. Testing Numerical Delta Math & Zero-Division Guards...');

  // Artificial scenario with zero baseline metric
  const mockBaseScenario: ScenarioConfig = {
    id: 'mock-zero-base',
    name: 'Zero Baseline Scenario',
    role: 'baseline',
    experimentId: 'exp_newton_second_law',
    parameters: { force: 0, mass: 2 },
    createdAt: 1000,
    updatedAt: 1000,
  };
  const mockBaseRes = WhatIfExecutionService.executeScenario(mockBaseScenario);
  // acceleration = 0 / 2 = 0 m/s²
  if (mockBaseRes.metrics.acceleration !== 0) {
    console.error('FAIL: Expected 0 N force to yield 0 acceleration');
    passed = false;
  }

  const mockAltScenario: ScenarioConfig = {
    id: 'mock-zero-alt',
    name: 'Nonzero Alternative Scenario',
    role: 'alternative',
    experimentId: 'exp_newton_second_law',
    parameters: { force: 10, mass: 2 },
    createdAt: 2000,
    updatedAt: 2000,
  };
  const mockAltRes = WhatIfExecutionService.executeScenario(mockAltScenario);
  // acceleration = 10 / 2 = 5 m/s²

  const zeroBaseCmp = WhatIfExecutionService.compareScenarios(mockBaseScenario, mockBaseRes, mockAltScenario, mockAltRes);
  const zeroBaseAccDelta = zeroBaseCmp.metricDeltas.find((m) => m.symbol === 'acceleration');

  // Verify no NaN or Infinity: percentChange must be null and formatted as 'N/A (base is 0)'
  if (!zeroBaseAccDelta || zeroBaseAccDelta.percentChange !== null || !zeroBaseAccDelta.percentChangeFormatted.includes('base is 0')) {
    console.error(`FAIL: Zero baseline percentage division guard failed. Got percent: ${zeroBaseAccDelta?.percentChangeFormatted}`);
    passed = false;
  }
  if (!zeroBaseAccDelta || zeroBaseAccDelta.absoluteDelta !== 5) {
    console.error(`FAIL: Zero baseline absolute delta expected 5, got ${zeroBaseAccDelta?.absoluteDelta}`);
    passed = false;
  }

  // =========================================================================
  // SUITE 6: PREDICTION EVALUATION & FORMATIVE FEEDBACK
  // =========================================================================
  console.log('6. Testing Student Prediction Evaluation & Feedback...');

  // Student predicts range will decrease when launch angle shifts from 45° to 30° (Correct!)
  const correctPrediction: ScenarioPrediction = {
    metricSymbol: 'range',
    expectedDirection: 'decrease',
    reasoning: '45° is optimal, so 30° must yield smaller range',
    recordedAt: Date.now(),
  };

  const predCmpCorrect = WhatIfExecutionService.compareScenarios(baseline, baseRes, alt30, alt30Res, correctPrediction);
  if (!predCmpCorrect.predictionEvaluation || !predCmpCorrect.predictionEvaluation.isMatched) {
    console.error('FAIL: Correct prediction was not marked as matched');
    passed = false;
  }

  // Student predicts range will increase when launch angle shifts from 45° to 30° (Incorrect!)
  const wrongPrediction: ScenarioPrediction = {
    metricSymbol: 'range',
    expectedDirection: 'increase',
    reasoning: 'Lower angles travel flatter and farther',
    recordedAt: Date.now(),
  };

  const predCmpWrong = WhatIfExecutionService.compareScenarios(baseline, baseRes, alt30, alt30Res, wrongPrediction);
  if (!predCmpWrong.predictionEvaluation || predCmpWrong.predictionEvaluation.isMatched) {
    console.error('FAIL: Incorrect prediction was falsely marked as matched');
    passed = false;
  }

  // =========================================================================
  // SUITE 7: CONTROLLED VARIABLE PRINCIPLE & MULTI-VARIABLE CONFOUNDING
  // =========================================================================
  console.log('7. Testing Single-Variable Control Principle & Confounding Detection...');

  // Exactly 1 variable changed (angle): isSingleVariableControlled must be true
  if (!cmp30.isSingleVariableControlled || !cmp30.scientificValidityNote.includes('Validated')) {
    console.error('FAIL: Single variable change failed to be verified as controlled experiment');
    passed = false;
  }

  // Multi-variable change: alter angle AND speed simultaneously
  const multiAlt = WhatIfExecutionService.cloneAsAlternative(baseline, 'Multi-variable Alt');
  multiAlt.parameters.angle = 60;
  multiAlt.parameters.speed = 40;
  const multiAltRes = WhatIfExecutionService.executeScenario(multiAlt);
  const multiCmp = WhatIfExecutionService.compareScenarios(baseline, baseRes, multiAlt, multiAltRes);

  if (multiCmp.isSingleVariableControlled !== false || !multiCmp.scientificValidityNote.includes('Confounding')) {
    console.error('FAIL: Multi-variable simultaneous changes failed to trigger Confounding alert');
    passed = false;
  }

  console.log(passed ? '✅ All Step 4 What-If Scenario Engine tests PASSED' : '❌ Some tests FAILED');
  return passed;
}

if (require.main === module) {
  runWhatIfScenarioEngineTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
