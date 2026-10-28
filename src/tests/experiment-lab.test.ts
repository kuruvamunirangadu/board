/**
 * VisiOS — Step 1: Experiment Lab Automated Test Suite
 * Validates deterministic kinematics, Galileo pendulum period scaling,
 * Newton's 2nd Law dynamics, student prediction evaluations,
 * single-variable controlled what-if comparisons, AI fallback explanations,
 * and session state persistence.
 */

import assert from 'assert';
import { ExperimentEngine } from '../features/experiment/ExperimentEngine';
import { EXPERIMENT_CATALOGUE, ExperimentCatalogueService } from '../features/experiment/ExperimentCatalogue';
import { ExperimentExplanationService } from '../features/experiment/ExperimentExplanationService';
import {
  StudentPrediction,
  ExperimentRun,
  ExperimentSessionState,
} from '../features/experiment/ExperimentTypes';
import { LearningSessionPersistenceService } from '../features/learning/LearningSessionPersistence';

function assertCloseTo(actual: number, expected: number, delta: number = 0.1, message?: string) {
  assert(
    Math.abs(actual - expected) <= delta,
    `${message || 'Value mismatch'}: expected ${expected} ± ${delta}, got ${actual}`
  );
}

export async function runExperimentLabTests(): Promise<boolean> {
  console.log('\n=============================================================');
  console.log('--- Step 1: Running VisiOS Experiment Lab Full Test Suite ---');
  console.log('=============================================================\n');

  try {
    await LearningSessionPersistenceService.clearAll();

    // =========================================================================
    // 1. PROJECTILE MOTION DETERMINISTIC KINEMATICS
    // =========================================================================
    console.log('  [Suite 1] Projectile Motion Kinematics Calculations:');

    // Test 1: Known textbook values at 20 m/s, 45°, 9.81 m/s²
    const pRes = ExperimentEngine.calculate('exp_projectile_motion', {
      speed: 20,
      angle: 45,
      gravity: 9.81,
    });
    // R = v₀² * sin(2θ) / g = 400 * 1 / 9.81 = 40.77 m
    assertCloseTo(pRes.results.range, 40.77, 0.1, 'Projectile range at 45°');
    // h_max = (v₀ * sin(45°))² / (2g) = 200 / 19.62 = 10.19 m
    assertCloseTo(pRes.results.maxHeight, 10.19, 0.1, 'Projectile apex height');
    // t_flight = 2 * v₀ * sin(45°) / g = 2 * 20 * 0.7071 / 9.81 = 2.88 s
    assertCloseTo(pRes.results.flightTime, 2.88, 0.1, 'Projectile flight time');
    console.log('    ✓ Test 1 Passed: Textbook kinematic values calculated accurately (R=40.77m, h=10.19m, t=2.88s)');

    // Test 2: Complementary angle parity (30° and 60° produce identical range)
    const run30 = ExperimentEngine.calculate('exp_projectile_motion', {
      speed: 20,
      angle: 30,
      gravity: 9.81,
    });
    const run60 = ExperimentEngine.calculate('exp_projectile_motion', {
      speed: 20,
      angle: 60,
      gravity: 9.81,
    });
    assertCloseTo(run30.results.range, 35.31, 0.1, '30° range');
    assertCloseTo(run60.results.range, 35.31, 0.1, '60° range');
    assertCloseTo(run30.results.range, run60.results.range, 0.05, 'Complementary angle range parity');
    assert(run60.results.maxHeight > run30.results.maxHeight, '60° has higher vertical apex than 30°');
    assert(run60.results.flightTime > run30.results.flightTime, '60° has longer hang time than 30°');
    console.log('    ✓ Test 2 Passed: Complementary launch angle parity verified (30° & 60° both yield 35.31m)');

    // Test 3: Lunar gravity field
    const moon = ExperimentEngine.calculate('exp_projectile_motion', {
      speed: 20,
      angle: 45,
      gravity: 1.62,
    });
    assertCloseTo(moon.results.range, 246.91, 0.2, 'Moon gravity range');
    assertCloseTo(moon.results.flightTime, 17.46, 0.2, 'Moon gravity flight time');
    console.log('    ✓ Test 3 Passed: Lunar gravity field calculation matches physics theory (R=246.91m, t=17.46s)');

    // =========================================================================
    // 2. HARMONIC PENDULUM GALILEO PERIOD SCALING
    // =========================================================================
    console.log('\n  [Suite 2] Harmonic Pendulum Period & Galileo Law:');

    const pend1m = ExperimentEngine.calculate('exp_harmonic_pendulum', {
      length: 1.0,
      gravity: 9.81,
      initialAngle: 15,
    });
    // T = 2π * sqrt(1 / 9.81) = 2.006s ≈ 2.01s
    assertCloseTo(pend1m.results.period, 2.01, 0.05, '1m pendulum period');
    assertCloseTo(pend1m.results.frequency, 0.50, 0.05, '1m pendulum frequency');
    console.log('    ✓ Test 4 Passed: 1-meter pendulum period calculates to 2.01s (f=0.50Hz)');

    const pend4m = ExperimentEngine.calculate('exp_harmonic_pendulum', {
      length: 4.0,
      gravity: 9.81,
      initialAngle: 15,
    });
    // Quadrupling length doubles period (2.01s -> 4.01s)
    assertCloseTo(pend4m.results.period, pend1m.results.period * 2, 0.05, 'Square root length scaling');
    assertCloseTo(pend4m.results.period, 4.01, 0.05, '4m pendulum period');
    console.log('    ✓ Test 5 Passed: Galileo square-root law confirmed (quadrupled length exactly doubles period)');

    // =========================================================================
    // 3. NEWTON'S SECOND LAW DYNAMICS
    // =========================================================================
    console.log('\n  [Suite 3] Newton’s Second Law Dynamic Cart:');

    const fmaBase = ExperimentEngine.calculate('exp_newton_second_law', {
      force: 20,
      mass: 2,
    });
    assert.strictEqual(fmaBase.results.acceleration, 10, 'a = 20/2 = 10 m/s²');
    assert.strictEqual(fmaBase.results.velocityAt2s, 20, 'v(2s) = 10 * 2 = 20 m/s');
    assert.strictEqual(fmaBase.results.distanceAt2s, 20, 'd(2s) = 0.5 * 10 * 4 = 20 m');
    console.log('    ✓ Test 6 Passed: Dynamic cart kinematics verified (F=20N, m=2kg -> a=10m/s², v=20m/s, d=20m)');

    const fmaDoubledMass = ExperimentEngine.calculate('exp_newton_second_law', {
      force: 20,
      mass: 4,
    });
    assert.strictEqual(fmaDoubledMass.results.acceleration, 5, 'a = 20/4 = 5 m/s²');
    assert.strictEqual(fmaDoubledMass.results.acceleration, fmaBase.results.acceleration / 2);
    console.log('    ✓ Test 7 Passed: Inverse mass proportionality confirmed (doubling mass strictly halves acceleration)');

    // =========================================================================
    // 4. STUDENT PREDICTION EVALUATION & ACCURACY TIERS
    // =========================================================================
    console.log('\n  [Suite 4] Student Prediction Evaluation & Accuracy Tiers:');

    // Accurate tier (<= 5% error)
    const predAccurate: StudentPrediction = {
      outputSymbol: 'range',
      predictedValue: 41.0,
      reasoning: 'I calculated ~40m based on 45 degree angle formula.',
      recordedAt: Date.now(),
    };
    const evalAccurate = ExperimentEngine.evaluatePrediction(predAccurate, { range: 40.77 }, 'm');
    assert.strictEqual(evalAccurate.accuracyTier, 'accurate');
    assert(evalAccurate.percentageError <= 5);
    assert(evalAccurate.feedbackSummary.includes('Outstanding prediction'));
    console.log('    ✓ Test 8 Passed: Accurate prediction tier evaluated correctly (error <= 5%)');

    // Close tier (5% < error <= 20%)
    const predClose: StudentPrediction = {
      outputSymbol: 'range',
      predictedValue: 46.0,
      reasoning: 'I estimated around 45-50 meters.',
      recordedAt: Date.now(),
    };
    const evalClose = ExperimentEngine.evaluatePrediction(predClose, { range: 40.77 }, 'm');
    assert.strictEqual(evalClose.accuracyTier, 'close');
    assert(evalClose.percentageError > 5 && evalClose.percentageError <= 20);
    assert(evalClose.feedbackSummary.includes('Close estimate'));
    console.log('    ✓ Test 9 Passed: Close prediction tier evaluated correctly (5% < error <= 20%)');

    // Divergent tier (> 20% error)
    const predDivergent: StudentPrediction = {
      outputSymbol: 'range',
      predictedValue: 80.0,
      reasoning: 'I assumed velocity double-counted.',
      recordedAt: Date.now(),
    };
    const evalDivergent = ExperimentEngine.evaluatePrediction(predDivergent, { range: 40.77 }, 'm');
    assert.strictEqual(evalDivergent.accuracyTier, 'divergent');
    assert(evalDivergent.percentageError > 20);
    assert(evalDivergent.feedbackSummary.includes('Interesting hypothesis'));
    console.log('    ✓ Test 10 Passed: Divergent prediction tier evaluated correctly (error > 20%)');

    // =========================================================================
    // 5. CONTROLLED EXPERIMENT & WHAT-IF COMPARISONS
    // =========================================================================
    console.log('\n  [Suite 5] Controlled Variables & What-If Comparison:');

    const projExp = EXPERIMENT_CATALOGUE[0];
    const run1: ExperimentRun = {
      runId: 'r1',
      runNumber: 1,
      parameters: { speed: 20, angle: 45, gravity: 9.81 },
      results: { range: 40.77, flightTime: 2.88, maxHeight: 10.19 },
      formattedResults: { range: '40.77 m', flightTime: '2.88 s', maxHeight: '10.19 m' },
      timestamp: 1000,
    };
    const run2SingleChange: ExperimentRun = {
      runId: 'r2',
      runNumber: 2,
      parameters: { speed: 20, angle: 60, gravity: 9.81 },
      results: { range: 35.31, flightTime: 3.53, maxHeight: 15.29 },
      formattedResults: { range: '35.31 m', flightTime: '3.53 s', maxHeight: '15.29 m' },
      timestamp: 2000,
    };

    const compSingle = ExperimentEngine.compareRuns(run1, run2SingleChange, projExp);
    assert.strictEqual(compSingle.isSingleVariableControlled, true);
    assert.strictEqual(compSingle.changedParameters.length, 1);
    assert.strictEqual(compSingle.changedParameters[0].symbol, 'angle');
    assert(compSingle.scientificValidityNote.includes('Controlled Variable Principle Verified'));
    console.log('    ✓ Test 11 Passed: Single variable controlled experiment verified (only angle modified)');

    const run3MultiChange: ExperimentRun = {
      runId: 'r3',
      runNumber: 3,
      parameters: { speed: 30, angle: 60, gravity: 9.81 },
      results: { range: 79.46, flightTime: 5.29, maxHeight: 34.40 },
      formattedResults: { range: '79.46 m', flightTime: '5.29 s', maxHeight: '34.40 m' },
      timestamp: 3000,
    };

    const compMulti = ExperimentEngine.compareRuns(run1, run3MultiChange, projExp);
    assert.strictEqual(compMulti.isSingleVariableControlled, false);
    assert.strictEqual(compMulti.changedParameters.length, 2);
    assert(compMulti.scientificValidityNote.includes('Multi-Variable Confounding Notice'));
    console.log('    ✓ Test 12 Passed: Multi-variable confounding condition successfully detected and warned');

    // =========================================================================
    // 6. EXPLANATION SERVICE & DETERMINISTIC FALLBACK
    // =========================================================================
    console.log('\n  [Suite 6] Evidence-Based Explanation Service:');

    const explanationResult = await ExperimentExplanationService.explainComparison(projExp, compSingle);
    assert(explanationResult.explanation.length > 50, 'Explanation should be substantive');
    assert(explanationResult.source === 'deterministic_rules' || explanationResult.source === 'local_ai');
    console.log(`    ✓ Test 13 Passed: Rigorous pedagogical explanation generated (source: ${explanationResult.source})`);

    // =========================================================================
    // 7. CATALOGUE & TOPIC MATCHING
    // =========================================================================
    console.log('\n  [Suite 7] Experiment Catalogue & Topic Matching:');

    assert.strictEqual(
      ExperimentCatalogueService.matchByTopic('Projectile Trajectory')?.id,
      'exp_projectile_motion'
    );
    assert.strictEqual(
      ExperimentCatalogueService.matchByTopic('Simple Harmonic Pendulum')?.id,
      'exp_harmonic_pendulum'
    );
    assert.strictEqual(
      ExperimentCatalogueService.matchByTopic('Newton’s F = ma Law')?.id,
      'exp_newton_second_law'
    );

    for (const exp of EXPERIMENT_CATALOGUE) {
      assert(exp.reflectionQuestions.length > 0, `Exp ${exp.id} has reflection questions`);
      for (const q of exp.reflectionQuestions) {
        assert(q.correctOptionIndex >= 0 && q.correctOptionIndex < q.options.length);
      }
    }
    console.log('    ✓ Test 14 Passed: All 3 catalogue experiments mapped and verified with valid reflection quizzes');

    // =========================================================================
    // 8. PERSISTENCE & SESSION RESTORATION
    // =========================================================================
    console.log('\n  [Suite 8] State Persistence & Session Restoration:');

    const expSessionState: ExperimentSessionState = {
      experimentId: 'exp_projectile_motion',
      currentParameters: { speed: 25, angle: 60, gravity: 9.81 },
      activePrediction: {
        outputSymbol: 'range',
        predictedValue: 50,
        reasoning: 'I hypothesized range will increase with speed.',
        recordedAt: Date.now(),
      },
      runs: [
        {
          runId: 'r1',
          runNumber: 1,
          parameters: { speed: 25, angle: 60, gravity: 9.81 },
          results: { range: 55.18, flightTime: 4.41, maxHeight: 23.91 },
          formattedResults: { range: '55.18 m', flightTime: '4.41 s', maxHeight: '23.91 m' },
          timestamp: Date.now(),
        },
      ],
      activeComparison: null,
      reflectionAnswer: {
        questionId: 'ref_proj_1',
        selectedOption: 1,
        isCorrect: true,
      },
      isCompleted: true,
    };

    const saved = await LearningSessionPersistenceService.saveImmediate({
      topic: 'Projectile Motion',
      guidedStep: 'interactive_exploration',
      completedSteps: ['concept_meaning', 'interactive_exploration'],
      activeTab: 'experiment',
      isGuidedMode: false,
      experimentLabState: expSessionState,
    });

    assert(saved !== null, 'Session should be saved');
    assert.strictEqual(saved?.experimentLabState?.experimentId, 'exp_projectile_motion');

    const restored = await LearningSessionPersistenceService.restoreSession('Projectile Motion');
    assert(restored !== null, 'Session should be restored');
    assert.strictEqual(restored?.experimentLabState?.currentParameters.speed, 25);
    assert.strictEqual(restored?.experimentLabState?.activePrediction?.predictedValue, 50);
    assert.strictEqual(restored?.experimentLabState?.reflectionAnswer?.isCorrect, true);
    assert.strictEqual(restored?.experimentLabState?.runs.length, 1);
    console.log('    ✓ Test 15 Passed: Full experiment lab session successfully persisted and restored across sessions');

    console.log('\n=============================================================');
    console.log('   ALL 15 EXPERIMENT LAB ENGINE & UI TESTS PASSED (100%)');
    console.log('=============================================================\n');
    return true;
  } catch (err: any) {
    console.error('\n❌ Test failure:', err.message);
    console.error(err.stack);
    return false;
  }
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  runExperimentLabTests().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}

