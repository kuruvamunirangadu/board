import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  VisualLearningDiagnosticsEngine,
  DiagnosticResult,
  DiagnosticFailureCategory,
  DiagnosticSeverity,
  RecoveryOutcome,
} from '../features/diagnostics/VisualLearningDiagnosticsEngine';

describe('VisiOS Milestone 7: Visual Learning Quality, Diagnostics & Safe Recovery Engine', () => {
  // Test 1: Diagnostic Result Model & Category Classification
  it('should generate typed diagnostic results with valid schemas and failure categories', () => {
    const categories: DiagnosticFailureCategory[] = [
      'topic_classification_failure',
      'unsupported_topic',
      'missing_visualization',
      'invalid_configuration',
      'asset_loading_failure',
      'renderer_initialization_failure',
      'mathematical_validation_failure',
      'learning_route_mismatch',
      'session_restoration_failure',
      'explanation_inconsistency',
    ];

    for (const cat of categories) {
      const diag: DiagnosticResult = {
        diagnosticId: VisualLearningDiagnosticsEngine.generateId(),
        timestamp: Date.now(),
        affectedTopic: 'Test Topic',
        learningComponent: 'unit_test_suite',
        failureCategory: cat,
        severity: 'warning',
        relevantEngine: 'math',
        userSafeExplanation: `Diagnostic for category ${cat}`,
        availableRecoveryActions: ['action_1', 'action_2'],
        recoveryOutcome: 'recovered',
        appliedRecoveryAction: 'Test action executed',
      };

      assert.ok(diag.diagnosticId.startsWith('diag_'), 'Diagnostic ID must have prefix');
      assert.ok(diag.timestamp > 0, 'Timestamp must be valid positive number');
      assert.strictEqual(diag.failureCategory, cat);
      assert.strictEqual(diag.recoveryOutcome, 'recovered');
    }
  });

  // Test 2: Route Verification across STEM Engines
  it('should correctly verify genuine engine routing and identify unsupported topics', () => {
    // 1. Linear function routing
    const linearDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('y = 2x + 3');
    assert.strictEqual(linearDiag.learningComponent, 'math_plotter_engine');
    assert.strictEqual(linearDiag.relevantEngine, 'math');
    assert.strictEqual(linearDiag.recoveryOutcome, 'no_action_needed');

    // 2. Fraction visualizer routing
    const fracDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('fractions and partitions');
    assert.strictEqual(fracDiag.learningComponent, 'fraction_visualizer_engine');
    assert.strictEqual(fracDiag.recoveryOutcome, 'no_action_needed');

    // 3. Algorithm tracer routing
    const bsDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('Binary Search array traversal');
    assert.strictEqual(bsDiag.learningComponent, 'algorithm_tracer_engine');
    assert.strictEqual(bsDiag.recoveryOutcome, 'no_action_needed');

    // 4. Physics simulation routing
    const simDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('Projectile motion simulation');
    assert.strictEqual(simDiag.learningComponent, 'simulation_engine');
    assert.strictEqual(simDiag.recoveryOutcome, 'no_action_needed');

    // 5. Genuine 3D model routing (Nervous system)
    const nervousDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('Human nervous system and brain');
    assert.strictEqual(nervousDiag.learningComponent, 'threejs_3d_viewer');
    assert.strictEqual(nervousDiag.recoveryOutcome, 'no_action_needed');

    // 6. Genuine 3D model routing (Heart)
    const heartDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('cardiac cycle and ventricles');
    assert.strictEqual(heartDiag.learningComponent, 'threejs_3d_viewer');
    assert.strictEqual(heartDiag.recoveryOutcome, 'no_action_needed');

    // 7. Unsupported topic: clearly flagged without claiming fake visualizer
    const unsupportedDiag = VisualLearningDiagnosticsEngine.verifyLearningRoute('quantum chromodynamics gluon plasma');
    assert.strictEqual(unsupportedDiag.failureCategory, 'unsupported_topic');
    assert.strictEqual(unsupportedDiag.recoveryOutcome, 'fallback_applied');
    assert.ok(
      unsupportedDiag.userSafeExplanation.includes('not currently paired with a dedicated interactive visual model'),
      'Must honestly explain lack of interactive model'
    );
  });

  // Test 3: Deterministic Mathematical Invariants & Contradiction Detection
  it('should enforce deterministic mathematical truth and detect contradictory explanations', () => {
    // 1. Division by Zero detection in fractions
    const divZeroDiag = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'fraction_division',
      { numerator: 5, denominator: 0 },
      {}
    );
    assert.strictEqual(divZeroDiag.failureCategory, 'mathematical_validation_failure');
    assert.strictEqual(divZeroDiag.severity, 'error');
    assert.strictEqual(divZeroDiag.recoveryOutcome, 'recovered');
    assert.ok(divZeroDiag.appliedRecoveryAction?.includes('Reset denominator'));

    // 2. Linear Function Invariant: y = mx + c calculation check
    const linearCheck = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Linear Plotting',
      { m: 2, c: 3, x: 5 },
      { y: 13 } // Correct: 2*5 + 3 = 13
    );
    assert.strictEqual(linearCheck.recoveryOutcome, 'no_action_needed');

    // Discrepant value check: calculation error caught
    const linearMismatch = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Linear Plotting',
      { m: 2, c: 3, x: 5 },
      { y: 99 } // Incorrect calculation
    );
    assert.strictEqual(linearMismatch.failureCategory, 'mathematical_validation_failure');
    assert.strictEqual(linearMismatch.recoveryOutcome, 'recovered');
    assert.ok(linearMismatch.appliedRecoveryAction?.includes('13'));

    // 3. Explanation Contradiction Detection: explanation claims slope is 9 when m = 2
    const contradictionDiag = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Linear Plotting',
      { m: 2, c: 3, x: 5 },
      { y: 13 },
      'The linear graph has slope is 9 and crosses y at 3.'
    );
    assert.strictEqual(contradictionDiag.failureCategory, 'explanation_inconsistency');
    assert.strictEqual(contradictionDiag.severity, 'error');
    assert.strictEqual(contradictionDiag.recoveryOutcome, 'recovered');
    assert.ok(
      contradictionDiag.userSafeExplanation.includes('Explanation contradiction detected'),
      'Must detect explanation contradiction'
    );
    assert.ok(
      contradictionDiag.appliedRecoveryAction?.includes('slope 2'),
      'Must enforce authoritative formula calculation over contradictory text'
    );

    // 4. Pythagorean Theorem Invariant: 3² + 4² = 5²
    const pythagorasMismatch = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Pythagorean Dissection',
      { a: 3, b: 4 },
      { c: 9 } // Contradicts 5
    );
    assert.strictEqual(pythagorasMismatch.failureCategory, 'mathematical_validation_failure');
    assert.strictEqual(pythagorasMismatch.recoveryOutcome, 'recovered');
    assert.ok(pythagorasMismatch.appliedRecoveryAction?.includes('5.000'));

    // 5. Euler characteristic invariant for Polyhedra
    const eulerCheck = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Platonic Polyhedra',
      { solidType: 'dodecahedron' },
      {}
    );
    assert.strictEqual(eulerCheck.recoveryOutcome, 'no_action_needed');
  });

  // Test 4: Physical Parameter Range & Bounds Verification
  it('should validate physical parameter bounds and clamp out-of-range values', () => {
    // Projectile motion with negative velocity and invalid angle (120 deg)
    const boundsDiag = VisualLearningDiagnosticsEngine.validateDeterministicResults(
      'Projectile Motion',
      { velocity: -20, angle: 120 },
      {}
    );
    assert.strictEqual(boundsDiag.failureCategory, 'invalid_configuration');
    assert.strictEqual(boundsDiag.severity, 'warning');
    assert.strictEqual(boundsDiag.recoveryOutcome, 'recovered');
    assert.ok(boundsDiag.appliedRecoveryAction?.includes('Clamped'));
  });

  // Test 5: Visualization Health Checks & WebGL Degradation
  it('should detect WebGL initialization failure and safely transition to 2D schematic fallback', () => {
    // WebGL disabled/failed
    const webGLFailDiag = VisualLearningDiagnosticsEngine.checkVisualizationHealth('Human Nervous System', {
      rendererType: 'threejs_viewer',
      is3D: true,
      webGLAvailable: false,
    });
    assert.strictEqual(webGLFailDiag.failureCategory, 'renderer_initialization_failure');
    assert.strictEqual(webGLFailDiag.severity, 'warning');
    assert.strictEqual(webGLFailDiag.recoveryOutcome, 'fallback_applied');
    assert.strictEqual(webGLFailDiag.fallbackVisual, '2D Schematic Fallback');
    assert.ok(
      webGLFailDiag.userSafeExplanation.includes('2D educational schematic'),
      'Must inform student that 2D schematic is displayed'
    );

    // Broken Asset Path recovery
    const assetFailDiag = VisualLearningDiagnosticsEngine.checkVisualizationHealth('Human Heart', {
      rendererType: 'threejs_viewer',
      is3D: true,
      webGLAvailable: true,
      assetPath: 'http://invalid-cdn.org/heart-model-404.gltf',
    });
    assert.strictEqual(assetFailDiag.failureCategory, 'asset_loading_failure');
    assert.strictEqual(assetFailDiag.recoveryOutcome, 'recovered');
    assert.strictEqual(assetFailDiag.fallbackVisual, 'Procedural 3D Geometry');
  });

  // Test 6: Safe Multi-Tier Fallback Hierarchy Execution
  it('should follow the strict defined fallback hierarchy without corrupting learning context', () => {
    // Tier 1 (3D Model) -> Tier 2 (Procedural 3D Schematic)
    const tier1To2 = VisualLearningDiagnosticsEngine.resolveSafeFallback(
      'Nervous system',
      '3d_model',
      'Asset network timeout'
    );
    assert.strictEqual(tier1To2.nextTier, 'procedural_3d');
    assert.strictEqual(tier1To2.isSafe, true);

    // Tier 2 (Procedural 3D) -> Tier 3 (2D Schematic)
    const tier2To3 = VisualLearningDiagnosticsEngine.resolveSafeFallback(
      'Nervous system',
      'procedural_3d',
      'WebGL context lost'
    );
    assert.strictEqual(tier2To3.nextTier, '2d_schematic');
    assert.strictEqual(tier2To3.isSafe, true);

    // Tier 3 (2D Schematic) -> Tier 4 (Lesson Text)
    const tier3To4 = VisualLearningDiagnosticsEngine.resolveSafeFallback(
      'Nervous system',
      '2d_schematic',
      'Canvas 2D render error'
    );
    assert.strictEqual(tier3To4.nextTier, 'lesson_text');
    assert.strictEqual(tier3To4.isSafe, true);

    // Tier 4 (Lesson Text) -> Tier 5 (Unsupported State)
    const tier4To5 = VisualLearningDiagnosticsEngine.resolveSafeFallback(
      'Nervous system',
      'lesson_text',
      'Curriculum entry missing'
    );
    assert.strictEqual(tier4To5.nextTier, 'unsupported_state');
    assert.strictEqual(tier4To5.isSafe, true);
  });

  // Test 7: Session Restoration Validation & Self-Repair
  it('should detect corrupted saved sessions and self-repair them safely', () => {
    // 1. Completely corrupted session data (null/undefined)
    const nullSessionRes = VisualLearningDiagnosticsEngine.validateAndRepairSession(null);
    assert.strictEqual(nullSessionRes.isValid, false);
    assert.ok(nullSessionRes.repairedSession, 'Repaired session must be created');
    assert.strictEqual(nullSessionRes.repairedSession.primaryTopic, 'Binary Search');
    assert.strictEqual(nullSessionRes.diagnostic.recoveryOutcome, 'recovered');

    // 2. Corrupted schema fields (missing topic, invalid steps)
    const partialSession = {
      schemaVersion: 1,
      corruptedKey: 'invalid',
    };
    const repairedRes = VisualLearningDiagnosticsEngine.validateAndRepairSession(partialSession);
    assert.strictEqual(repairedRes.isValid, false);
    assert.ok(repairedRes.repairedSession);
    assert.strictEqual(repairedRes.repairedSession.currentLessonStep, 'concept_meaning');
    assert.strictEqual(repairedRes.diagnostic.failureCategory, 'session_restoration_failure');
    assert.strictEqual(repairedRes.diagnostic.recoveryOutcome, 'recovered');

    // 3. Valid session restoration
    const validSession = {
      schemaVersion: 1,
      id: 'session-valid-123',
      primaryTopic: 'Linear Functions',
      currentLessonStep: 'step_by_step',
      completedSteps: ['concept_meaning', 'why_it_matters'],
      activeTab: 'derive',
      isGuidedMode: true,
      isCompleted: false,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    };
    const validRes = VisualLearningDiagnosticsEngine.validateAndRepairSession(validSession);
    assert.strictEqual(validRes.isValid, true);
    assert.strictEqual(validRes.diagnostic.recoveryOutcome, 'no_action_needed');
  });

  // Test 8: Real-Time Event Streaming & Overall System Health Scoring
  it('should record diagnostic history and compute authentic system health scores', () => {
    VisualLearningDiagnosticsEngine.clearHistory();

    let notificationReceived = false;
    const unsubscribe = VisualLearningDiagnosticsEngine.subscribe((event) => {
      notificationReceived = true;
      assert.ok(event.diagnosticId);
    });

    // Generate an event
    VisualLearningDiagnosticsEngine.verifyLearningRoute('Binary Search');
    assert.strictEqual(notificationReceived, true);
    unsubscribe();

    // Check health summary
    const summary = VisualLearningDiagnosticsEngine.getHealthSummary();
    assert.ok(summary.healthScore >= 90, `Health score should be high for valid inputs (got ${summary.healthScore})`);
    assert.ok(summary.totalEvents >= 1);
  });
});

