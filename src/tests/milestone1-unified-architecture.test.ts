import { describe, it, after } from 'node:test';
import assert from 'node:assert';
import {
  UnifiedLearningContracts,
  LearningRequest,
  LearningResponse,
} from '../features/learning/UnifiedLearningContracts';
import { EngineCapabilityRegistry } from '../features/learning/EngineCapabilityRegistry';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { CanvasVisualizationAdapter } from '../features/canvas/CanvasVisualizationAdapter';
import { LearningSessionPersistenceService } from '../features/learning/LearningSessionPersistence';
import { UniversalProblemSolver } from '../features/learning/UniversalProblemSolver';
import { BinomialExpansionEngine } from '../features/learning/BinomialExpansionEngine';

describe('VisiOS Phase 1: Unified Architecture & Integration', () => {
  // ==========================================================================
  // Suite 1: LearningRequest and LearningResponse Contracts
  // ==========================================================================
  describe('Suite 1: Unified Learning Contracts & Validation', () => {
    it('should create a valid normalized LearningRequest with defaults and monotonic IDs', () => {
      const req = UnifiedLearningContracts.createLearningRequest('F = ma', {
        context: { subject: 'physics', workspaceId: 'ws_test_1' },
        preferences: { detailLevel: 'standard' },
      });

      assert.ok(req.requestId.startsWith('req_'), 'Must generate a req_ prefixed ID');
      assert.strictEqual(req.input, 'F = ma');
      assert.strictEqual(req.context?.subject, 'physics');
      assert.strictEqual(req.context?.workspaceId, 'ws_test_1');
      assert.strictEqual(req.preferences?.detailLevel, 'standard');
      assert.ok(req.timestamp > 0, 'Must record valid creation timestamp');
    });

    it('should bound oversized inputs to MAX_INPUT_LENGTH (300 chars)', () => {
      const longInput = 'A'.repeat(500);
      const req = UnifiedLearningContracts.createLearningRequest(longInput);
      assert.strictEqual(req.input.length, 300, 'Input must be bounded to 300 characters');
    });

    it('should validate valid requests and reject empty or malformed payloads', () => {
      // Valid request
      const valid = UnifiedLearningContracts.validateLearningRequest({
        requestId: 'req_123',
        input: 'Pythagorean Theorem',
        timestamp: Date.now(),
      });
      assert.strictEqual(valid.isValid, true);
      assert.strictEqual(valid.errors.length, 0);
      assert.ok(valid.request);

      // Empty input
      const empty = UnifiedLearningContracts.validateLearningRequest({
        input: '   ',
      });
      assert.strictEqual(empty.isValid, false);
      assert.ok(empty.errors.some((e) => e.includes('must not be empty')));

      // Non-object
      const nonObj = UnifiedLearningContracts.validateLearningRequest(null);
      assert.strictEqual(nonObj.isValid, false);
      assert.ok(nonObj.errors.some((e) => e.includes('non-null object')));
    });

    it('should create standardized LearningError responses without throwing', () => {
      const req = UnifiedLearningContracts.createLearningRequest('Invalid query');
      const errResponse = UnifiedLearningContracts.createErrorResponse(req, {
        code: 'UNSUPPORTED_CAPABILITY',
        message: 'No capability supported for this topic.',
        recoverable: false,
      });

      assert.strictEqual(errResponse.status, 'unsupported');
      assert.strictEqual(errResponse.requestId, req.requestId);
      assert.ok(errResponse.responseId.startsWith('res_'));
      assert.strictEqual(errResponse.error?.code, 'UNSUPPORTED_CAPABILITY');
      assert.strictEqual(errResponse.error?.recoverable, false);
    });

    it('should perform bidirectional lossless conversion between LearningPlan and LearningResponse', async () => {
      const orchestrated = await LearningOrchestrator.processTopic('F = ma');
      const response = UnifiedLearningContracts.planToLearningResponse(
        orchestrated.plan,
        orchestrated.classification,
        orchestrated.routeTaken,
        15,
        'req_test_conversion'
      );

      assert.strictEqual(response.status, 'success');
      assert.strictEqual(response.requestId, 'req_test_conversion');
      assert.strictEqual(response.topic.domain, 'physics');
      assert.ok(response.content.overview.length > 0);

      // Convert back to LearningPlan
      const backToPlan = UnifiedLearningContracts.responseToLearningPlan(response);
      assert.strictEqual(backToPlan.title, response.topic.title);
      assert.strictEqual(backToPlan.subject, response.topic.subject);
      assert.strictEqual(backToPlan.category, 'physics');
    });
  });

  // ==========================================================================
  // Suite 2: Engine Capability Registry
  // ==========================================================================
  describe('Suite 2: Engine Capability Registry Resolution', () => {
    it('should register verified capabilities across all required core subjects', () => {
      const all = EngineCapabilityRegistry.getAllCapabilities();
      assert.ok(all.length >= 10, 'Must register at least 10 core capabilities');

      const mathCaps = EngineCapabilityRegistry.getCapabilitiesByDomain('mathematics');
      const physCaps = EngineCapabilityRegistry.getCapabilitiesByDomain('physics');
      const csCaps = EngineCapabilityRegistry.getCapabilitiesByDomain('computer_science');
      const bioCaps = EngineCapabilityRegistry.getCapabilitiesByDomain('biology');

      assert.ok(mathCaps.length >= 3, 'Must register mathematics capabilities');
      assert.ok(physCaps.length >= 3, 'Must register physics capabilities');
      assert.ok(csCaps.length >= 1, 'Must register computer science capabilities');
      assert.ok(bioCaps.length >= 1, 'Must register biology capabilities');
    });

    it('should correctly resolve queries across all major subject domains', () => {
      const testQueries: Array<{ query: string; expectedCapId: string }> = [
        { query: 'F = ma', expectedCapId: 'cap_newtonian_force_dynamics' },
        { query: 'v = u + at', expectedCapId: 'cap_kinematics_linear' },
        { query: 'simulate a pendulum', expectedCapId: 'cap_harmonic_pendulum' },
        { query: 'density of 6kg in 0.002m³', expectedCapId: 'cap_density_buoyancy' },
        { query: 'kinetic energy', expectedCapId: 'cap_kinetic_energy' },
        { query: "Ohm's law", expectedCapId: 'cap_ohms_law' },
        { query: '(a - b)²', expectedCapId: 'cap_polynomial_identities' },
        { query: 'Pythagorean theorem', expectedCapId: 'cap_euclidean_geometry' },
        { query: 'Law of Cosines', expectedCapId: 'cap_trigonometry_law_of_cosines' },
        { query: 'y = mx + c', expectedCapId: 'cap_linear_functions' },
        { query: 'fractions', expectedCapId: 'cap_rational_fractions' },
        { query: 'binary search', expectedCapId: 'cap_cs_binary_search' },
        { query: 'Human heart anatomy', expectedCapId: 'cap_3d_anatomy_cardiovascular' },
        { query: 'Nervous system', expectedCapId: 'cap_3d_anatomy_nervous_system' },
        { query: 'Water molecule H2O', expectedCapId: 'cap_3d_chemistry_molecules' },
        { query: 'Platonic solids and polyhedra', expectedCapId: 'cap_3d_geometry_polyhedra' },
      ];

      for (const t of testQueries) {
        const req = UnifiedLearningContracts.createLearningRequest(t.query);
        const resolved = EngineCapabilityRegistry.resolveCapability(req);
        assert.ok(resolved.isSupported, `Must support query: ${t.query}`);
        assert.ok(resolved.capability, `Must resolve capability for: ${t.query}`);
        assert.strictEqual(
          resolved.capability?.id,
          t.expectedCapId,
          `Expected ${t.expectedCapId} for "${t.query}", got ${resolved.capability?.id}`
        );
      }
    });

    it('should resolve document grounded capability when documentId is provided in context', () => {
      const req = UnifiedLearningContracts.createLearningRequest('Lecture summary', {
        context: { documentId: 'doc_imported_123', subject: 'document_grounded' },
      });
      const resolved = EngineCapabilityRegistry.resolveCapability(req);
      assert.ok(resolved.isSupported);
      assert.strictEqual(resolved.capability?.id, 'cap_document_grounded_learning');
    });

    it('should explicitly reject empty or unbacked queries honestly', () => {
      const emptyReq = UnifiedLearningContracts.createLearningRequest('');
      const resolved = EngineCapabilityRegistry.resolveCapability(emptyReq);
      assert.strictEqual(resolved.isSupported, false);
      assert.strictEqual(resolved.capability, null);
    });
  });

  // ==========================================================================
  // Suite 3: Unified Learning Orchestration (executeRequest)
  // ==========================================================================
  describe('Suite 3: Learning Orchestration Execution Pipeline', () => {
    it('should execute a valid LearningRequest and return a complete LearningResponse', async () => {
      const req = UnifiedLearningContracts.createLearningRequest('F = ma', {
        context: { subject: 'physics' },
      });

      const res = await LearningOrchestrator.executeRequest(req);

      assert.strictEqual(res.status, 'success');
      assert.strictEqual(res.requestId, req.requestId);
      assert.ok(res.responseId.startsWith('res_'));
      assert.strictEqual(res.topic.domain, 'physics');
      assert.strictEqual(res.metadata.capabilityId, 'cap_newtonian_force_dynamics');
      assert.strictEqual(res.metadata.capabilityLevel, 'verified_and_tested');
      assert.ok(res.content.overview.length > 0);
      assert.ok(res.content.derivationSteps && res.content.derivationSteps.length > 0);
      assert.ok(res.results?.parameters !== undefined);
      assert.ok(res.visualization !== undefined);
      assert.strictEqual(res.visualization?.rendererType, 'physics_vector_simulator');
      assert.ok(res.recommendations && res.recommendations.length > 0);
    });

    it('should return an INVALID_INPUT error response for empty requests', async () => {
      const req = UnifiedLearningContracts.createLearningRequest('');
      const res = await LearningOrchestrator.executeRequest(req);

      assert.strictEqual(res.status, 'error');
      assert.strictEqual(res.error?.code, 'INVALID_INPUT');
      assert.strictEqual(res.error?.recoverable, false);
    });

    it('should execute string inputs directly via string overload', async () => {
      const res = await LearningOrchestrator.executeRequest('y = mx + c');
      assert.strictEqual(res.status, 'success');
      assert.strictEqual(res.topic.domain, 'mathematics');
      assert.strictEqual(res.visualization?.rendererType, 'function_coordinate_plotter');
    });
  });

  // ==========================================================================
  // Suite 4: Deterministic Mathematical and Domain Calculations
  // ==========================================================================
  describe('Suite 4: Deterministic Calculations Without AI Dependency', () => {
    it('should compute exact Force dynamics (F = ma) deterministically', () => {
      const solved = UniversalProblemSolver.solve('A force of 20 N acts on a mass of 4 kg. What is the acceleration?');
      assert.ok(solved, 'Must solve force problem');
      assert.strictEqual(solved?.conceptId, 'physics_f_ma');
      assert.strictEqual(solved?.primaryResult, 5);
      assert.strictEqual(solved?.units, 'm/s²');
      assert.ok(solved?.algebraicSteps.some((s) => s.includes('5 m/s²')));
    });

    it('should compute exact Density & Buoyancy deterministically', () => {
      const solved = UniversalProblemSolver.solve('density of 6 kg in 0.002 m³');
      assert.ok(solved, 'Must solve density problem');
      assert.strictEqual(solved?.conceptId, 'physics_density');
      assert.strictEqual(solved?.primaryResult, 3000);
      assert.strictEqual(solved?.units, 'kg/m³');
      assert.ok(solved?.solvedAnswer.includes('3000 kg/m³'));
      assert.ok(solved?.algebraicSteps.some((s) => s.includes('Sinks in water')));
    });

    it('should compute exact Binomial Expansion without hallucination', () => {
      const matched = BinomialExpansionEngine.matchBinomialPower('(a - b)^2');
      assert.ok(matched);
      assert.strictEqual(matched?.base1, 'a');
      assert.strictEqual(matched?.sign, '-');
      assert.strictEqual(matched?.base2, 'b');
      assert.strictEqual(matched?.power, 2);

      const expanded = BinomialExpansionEngine.expandBinomial('(a - b)^2');
      assert.ok(expanded);
      assert.ok(
        expanded?.expandedFormula === 'a^2 - 2ab + b^2' ||
        expanded?.expandedFormula === 'a² - 2ab + b²'
      );

      // Evaluated at a=5, b=2 => (5-2)^2 = 9
      const calculated = expanded?.calculate(5, 2);
      assert.strictEqual(calculated?.total, 9);
    });

    it('should plan Law of Cosines to geometric triangle construction', async () => {
      const res = await LearningOrchestrator.executeRequest('Law of Cosines');
      assert.strictEqual(res.status, 'success');
      assert.strictEqual(res.visualization?.rendererType, 'geometric_triangle_construction');
    });
  });

  // ==========================================================================
  // Suite 5: Canvas Visualization Adapter & Shape Props Validation
  // ==========================================================================
  describe('Suite 5: Canvas Visualization Adapter & Shape Payloads', () => {
    it('should generate valid 3-card suite payloads for physics simulation', async () => {
      const response = await LearningOrchestrator.executeRequest('F = ma');
      const { payloads, fallbackApplied } = CanvasVisualizationAdapter.createShapePayloads(response);

      assert.strictEqual(fallbackApplied, false);
      assert.strictEqual(payloads.length, 3);

      // Card 1: Overview
      assert.strictEqual(payloads[0].type, 'learning-card');
      assert.strictEqual(payloads[0].props.category, 'physics');
      assert.ok(payloads[0].props.w >= 400);

      // Card 2: Derivation
      assert.strictEqual(payloads[1].type, 'learning-card');
      assert.strictEqual(payloads[1].props.badge, 'Step-by-Step Operations');

      // Card 3: Interactive Simulation
      assert.strictEqual(payloads[2].type, 'simulation');
      assert.strictEqual(payloads[2].props.simulationType, 'vector_force');
      assert.strictEqual(payloads[2].props.gravity, 9.81);
    });

    it('should generate valid 3D model payload for anatomical topics', async () => {
      const response = await LearningOrchestrator.executeRequest('Human heart anatomy');
      const { payloads } = CanvasVisualizationAdapter.createShapePayloads(response);

      assert.strictEqual(payloads.length, 3);
      assert.strictEqual(payloads[2].type, 'model3d');
      assert.strictEqual(payloads[2].props.modelType, 'heart');
      assert.strictEqual(payloads[2].props.isPulsing, true);
    });

    it('should sanitize invalid/corrupted props and protect against NaN and undefined', () => {
      const corruptedGeometry = {
        w: NaN,
        h: 'bad' as any,
        geometryType: 'invalid_type' as any,
        slope: undefined,
        intercept: null,
      };

      const sanitized = CanvasVisualizationAdapter.sanitizeGeometryProps(corruptedGeometry);
      assert.strictEqual(sanitized.w, CanvasVisualizationAdapter.DEFAULT_VISUAL_WIDTH);
      assert.strictEqual(sanitized.h, CanvasVisualizationAdapter.DEFAULT_VISUAL_HEIGHT);
      assert.strictEqual(sanitized.geometryType, 'linear_plotter');
      assert.strictEqual(sanitized.slope, 2);
      assert.strictEqual(sanitized.intercept, 1);
    });

    it('should sanitize simulation props and ensure finite numbers', () => {
      const corruptedSim = {
        gravity: NaN,
        length: -5,
        damping: undefined,
      };

      const sanitized = CanvasVisualizationAdapter.sanitizeSimulationProps(corruptedSim);
      assert.strictEqual(sanitized.gravity, 9.81);
      assert.strictEqual(sanitized.damping, 0.04);
      assert.strictEqual(sanitized.simulationType, 'pendulum');
    });

    it('should apply safe learning-card fallback when visual model is unsupported', () => {
      const unsupportedResponse: LearningResponse = {
        status: 'unsupported',
        requestId: 'req_unsupported',
        responseId: 'res_unsupported',
        timestamp: Date.now(),
        topic: {
          title: 'Unknown Abstract Theory',
          normalizedQuery: 'unknown abstract theory',
          subject: 'Theoretical Studies',
          domain: 'other',
          intent: 'concept_learning',
        },
        content: {
          overview: 'Topic is not backed by interactive visualizer.',
          prerequisites: ['Foundations'],
        },
        visualization: {
          rendererType: 'none',
          title: 'None',
          description: '',
          learningObjective: '',
          activeVariables: [],
          interactionsAvailable: [],
          expectedBehavior: '',
          fallbackAvailable: true,
        },
        metadata: {
          processingTimeMs: 1,
          engineId: 'fallback',
          capabilityId: 'cap_other',
          capabilityLevel: 'unsupported',
          timestamp: Date.now(),
        },
      };

      const { payloads, fallbackApplied } = CanvasVisualizationAdapter.createShapePayloads(unsupportedResponse);
      assert.strictEqual(fallbackApplied, true);
      assert.strictEqual(payloads[2].type, 'learning-card');
      assert.strictEqual(payloads[2].props.badge, 'Schematic Overview');
    });
  });

  // ==========================================================================
  // Suite 6: Session Persistence Integration & Backward Compatibility
  // ==========================================================================
  describe('Suite 6: Session Persistence & Backward Compatibility', () => {
    it('should preserve existing session save and validate schemas with unified metadata', async () => {
      const payload = {
        topic: 'Newton Second Law F=ma',
        domain: 'physics',
        conceptId: 'cap_newtonian_force_dynamics',
        responseId: 'res_test_persist_1',
        capabilityId: 'cap_newtonian_force_dynamics',
        engineId: 'simulation_engine',
        guidedStep: 'concept_meaning' as const,
        completedSteps: ['concept_meaning' as const],
        activeTab: 'understand' as const,
        isGuidedMode: true,
      };

      const validation = LearningSessionPersistenceService.validateRecord({
        primaryTopic: payload.topic,
        schemaVersion: 1,
      });

      assert.strictEqual(validation.isValid, true);
      assert.strictEqual(validation.errors.length, 0);
    });

    it('should ensure processTopic retains exact OrchestrationResult backward compatibility', async () => {
      const orchestrated = await LearningOrchestrator.processTopic('binary search');
      assert.ok(orchestrated.plan);
      assert.ok(orchestrated.classification);
      assert.strictEqual(orchestrated.routeTaken, 'algorithm_engine');
      assert.strictEqual(orchestrated.classification.domain, 'computer_science');
      assert.strictEqual(orchestrated.plan.visualizationPlan?.rendererType, 'algorithm_array_tracer');
    });
  });

  after(() => {
    process.exit(0);
  });
});
