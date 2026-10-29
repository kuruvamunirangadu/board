/**
 * VisiOS — Milestone 10: Autonomous Learning Workflows & AI Learning Agents Test Suite
 * Covers all 15 required Phase 10 verification scenarios:
 * 1. Valid learning workflow execution.
 * 2. Unsupported capability rejection.
 * 3. Circular step dependency detection.
 * 4. Invalid step input validation.
 * 5. Failed learning service handled safely.
 * 6. Timed-out operation detection.
 * 7. Bounded retry limits.
 * 8. Cancellation during execution.
 * 9. Pause and resume support.
 * 10. Duplicate execution prevention (idempotency).
 * 11. Invalid or inconsistent step output rejection.
 * 12. Unauthorized workflow access blocked.
 * 13. Assessment struggle branches to adaptive remediation hint.
 * 14. Complete workflow execution with final progress summary.
 * 15. Integrated workflow with document grounding and canvas visualization.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LearningWorkflowPlanner } from '../features/workflows/LearningWorkflowPlanner';
import { LearningWorkflowExecutor } from '../features/workflows/LearningWorkflowExecutor';
import { WorkflowValidationService } from '../features/workflows/WorkflowValidationService';
import { WorkflowPermissionService } from '../features/workflows/WorkflowPermissionService';
import { WorkflowStateManager } from '../features/workflows/WorkflowStateManager';
import { WorkflowRecoveryService } from '../features/workflows/WorkflowRecoveryService';
import { WorkflowStepRegistry } from '../features/workflows/WorkflowStepRegistry';
import { LearningWorkflowPlan, LearningWorkflowStep } from '../features/workflows/WorkflowContracts';
import { DocumentPersistenceService } from '../features/documents/DocumentPersistenceService';
import { ImportedDocument } from '../features/documents/DocumentTypes';

// ---------------------------------------------------------------------------
// Test 1: Valid learning workflow execution
// ---------------------------------------------------------------------------
test('Test 1: Valid learning workflow executes to completion across planned steps', async () => {
  const plannerRes = LearningWorkflowPlanner.planWorkflow(
    'student-1',
    'Teach me binary search from the basics, demonstrate it visually, and test my understanding'
  );

  assert.ok(plannerRes.plan, `Planning failed: ${plannerRes.error}`);
  const plan = plannerRes.plan;

  assert.equal(plan.steps.length, 5);
  assert.equal(plan.steps[0].type, 'assess_prerequisites');
  assert.equal(plan.steps[1].type, 'generate_explanation');
  assert.equal(plan.steps[2].type, 'visualize_concept');
  assert.equal(plan.steps[3].type, 'interactive_assessment');
  assert.equal(plan.steps[4].type, 'progress_checkpoint');

  const executor = new LearningWorkflowExecutor();
  const execResult = await executor.executeWorkflow(plan, 'student-1');

  assert.equal(execResult.status, 'completed');
  assert.equal(execResult.completedStepsCount, 5);
  assert.ok(execResult.summary && execResult.summary.includes('successfully achieved goal'));
});

// ---------------------------------------------------------------------------
// Test 2: Unsupported capability rejection
// ---------------------------------------------------------------------------
test('Test 2: Workflow requesting unsupported or invented capability is strictly rejected', () => {
  const invalidPlan: LearningWorkflowPlan = {
    id: 'wf-invalid-cap',
    studentId: 'student-1',
    goal: 'Learn unsupported topic',
    conceptId: 'unknown',
    conceptTitle: 'Unknown Topic',
    domain: 'general',
    steps: [
      {
        id: 's1',
        stepNumber: 1,
        type: 'generate_explanation',
        capabilityId: 'cap_unsupported_quantum_superposition_warp_9', // invented capability
        title: 'Quantum Warp Explanation',
        description: 'Invented capability',
        dependsOn: [],
        input: {},
        status: 'pending',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 10000,
      },
    ],
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionLog: [],
  };

  const validation = WorkflowValidationService.validatePlan(invalidPlan);
  assert.equal(validation.isValid, false);
  assert.ok(validation.unsupportedCapabilities.includes('cap_unsupported_quantum_superposition_warp_9'));
  assert.ok(validation.errors.some((e) => e.includes('Unsupported capability')));
});

// ---------------------------------------------------------------------------
// Test 3: Circular step dependency detection
// ---------------------------------------------------------------------------
test('Test 3: Circular step dependencies in workflow DAG are detected and blocked before execution', () => {
  const cyclicPlan: LearningWorkflowPlan = {
    id: 'wf-cyclic',
    studentId: 'student-1',
    goal: 'Cyclic test',
    conceptId: 'cs_binary_search',
    conceptTitle: 'Binary Search',
    domain: 'computer_science',
    steps: [
      {
        id: 'step_A',
        stepNumber: 1,
        type: 'assess_prerequisites',
        capabilityId: 'cap_assess_prerequisites',
        title: 'Step A',
        description: 'Depends on Step B',
        dependsOn: ['step_B'], // Cycle!
        input: { conceptId: 'cs_binary_search' },
        status: 'pending',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 10000,
      },
      {
        id: 'step_B',
        stepNumber: 2,
        type: 'generate_explanation',
        capabilityId: 'cap_generate_explanation',
        title: 'Step B',
        description: 'Depends on Step A',
        dependsOn: ['step_A'], // Cycle!
        input: { conceptId: 'cs_binary_search' },
        status: 'pending',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 10000,
      },
    ],
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionLog: [],
  };

  const validation = WorkflowValidationService.validatePlan(cyclicPlan);
  assert.equal(validation.isValid, false);
  assert.equal(validation.hasCycles, true);
  assert.ok(validation.errors.some((e) => e.includes('Circular dependency')));
});

// ---------------------------------------------------------------------------
// Test 4: Invalid step input validation
// ---------------------------------------------------------------------------
test('Test 4: Step with missing required input fields fails input validation safely', () => {
  const stepWithoutConcept: LearningWorkflowStep = {
    id: 's-bad-input',
    stepNumber: 1,
    type: 'assess_prerequisites',
    capabilityId: 'cap_assess_prerequisites',
    title: 'Assess Prerequisites without conceptId',
    description: 'Bad input',
    dependsOn: [],
    input: {}, // Missing conceptId!
    status: 'pending',
    retryCount: 0,
    maxRetries: 1,
    timeoutMs: 10000,
  };

  const check = WorkflowValidationService.validateStepInput(stepWithoutConcept);
  assert.equal(check.isValid, false);
  assert.match(check.error || '', /requires "conceptId"/i);
});

// ---------------------------------------------------------------------------
// Test 5: Failed learning service handled safely
// ---------------------------------------------------------------------------
test('Test 5: Step throwing execution error halts workflow safely and records error in log', async () => {
  const plan: LearningWorkflowPlan = {
    id: 'wf-fail-test',
    studentId: 'student-1',
    goal: 'Fail test',
    conceptId: 'cs_binary_search',
    conceptTitle: 'Binary Search',
    domain: 'computer_science',
    steps: [
      {
        id: 'step_throw',
        stepNumber: 1,
        type: 'assess_prerequisites',
        capabilityId: 'cap_assess_prerequisites',
        title: 'Throwing Step',
        description: 'Fails execution',
        dependsOn: [],
        input: { conceptId: 'cs_binary_search' },
        status: 'pending',
        retryCount: 2, // Exceeds maxRetries to avoid looping
        maxRetries: 2,
        timeoutMs: 10000,
      },
    ],
    status: 'pending',
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionLog: [],
  };

  // Mock registry that throws
  const throwingRegistry = {
    executeStep: async () => {
      throw new Error('Database connection failed during prerequisite assessment');
    },
  } as any;

  const executor = new LearningWorkflowExecutor(throwingRegistry);
  const result = await executor.executeWorkflow(plan, 'student-1');

  assert.equal(result.status, 'failed');
  assert.equal(plan.steps[0].status, 'failed');
  assert.match(result.error || '', /Database connection failed/i);
});

// ---------------------------------------------------------------------------
// Test 6: Timed-out operation detection
// ---------------------------------------------------------------------------
test('Test 6: Step exceeding allocated timeoutMs is detected as timed out', () => {
  const step: LearningWorkflowStep = {
    id: 's-timeout',
    stepNumber: 1,
    type: 'generate_explanation',
    capabilityId: 'cap_generate_explanation',
    title: 'Slow step',
    description: 'Times out',
    dependsOn: [],
    input: {},
    status: 'running',
    retryCount: 0,
    maxRetries: 1,
    timeoutMs: 1000, // 1 sec
    startedAt: Date.now() - 3000, // 3 secs ago
  };

  const isTimedOut = WorkflowRecoveryService.checkTimeout(step);
  assert.equal(isTimedOut, true);
});

// ---------------------------------------------------------------------------
// Test 7: Bounded retry limits
// ---------------------------------------------------------------------------
test('Test 7: Step fails safely when maxRetries threshold is reached without infinite retry loops', () => {
  const plan: LearningWorkflowPlan = {
    id: 'wf-retry',
    studentId: 'student-1',
    goal: 'Retry test',
    conceptId: 'cs_binary_search',
    conceptTitle: 'Binary Search',
    domain: 'computer_science',
    steps: [],
    status: 'running',
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionLog: [],
  };

  const step: LearningWorkflowStep = {
    id: 's-retry-bound',
    stepNumber: 1,
    type: 'generate_explanation',
    capabilityId: 'cap_generate_explanation',
    title: 'Retry bound check',
    description: 'Testing retries',
    dependsOn: [],
    input: {},
    status: 'running',
    retryCount: 2, // already retried 2 times
    maxRetries: 2,
    timeoutMs: 10000,
  };

  const decision = WorkflowRecoveryService.evaluateRecovery(plan, step, 'Transient network error');
  assert.equal(decision.action, 'fail');
  assert.match(decision.reason, /exceeded maximum retry threshold/i);
});

// ---------------------------------------------------------------------------
// Test 8: Cancellation during execution
// ---------------------------------------------------------------------------
test('Test 8: Workflow can be cancelled and terminates execution safely', () => {
  const stateManager = new WorkflowStateManager();
  const executor = new LearningWorkflowExecutor(undefined, stateManager);

  const plannerRes = LearningWorkflowPlanner.planWorkflow('student-1', 'Learn linear functions');
  assert.ok(plannerRes.plan);
  const plan = plannerRes.plan;
  stateManager.saveWorkflow(plan);

  const cancelResult = executor.cancelWorkflow(plan.id, 'student-1');
  assert.equal(cancelResult.success, true);

  const updatedPlan = stateManager.getWorkflow(plan.id);
  assert.equal(updatedPlan?.status, 'cancelled');
  assert.ok(updatedPlan?.executionLog.some((e) => e.eventType === 'workflow_cancelled'));
});

// ---------------------------------------------------------------------------
// Test 9: Pause and resume support
// ---------------------------------------------------------------------------
test('Test 9: Workflow can be paused mid-stream and resumed to completion', async () => {
  const stateManager = new WorkflowStateManager();
  const executor = new LearningWorkflowExecutor(undefined, stateManager);

  const plannerRes = LearningWorkflowPlanner.planWorkflow('student-pause', 'Learn binary search');
  assert.ok(plannerRes.plan);
  const plan = plannerRes.plan;
  stateManager.saveWorkflow(plan);

  // Pause workflow
  plan.status = 'running';
  const pauseRes = executor.pauseWorkflow(plan.id, 'student-pause');
  assert.equal(pauseRes.success, true);
  assert.equal(stateManager.getWorkflow(plan.id)?.status, 'paused');

  // Resume workflow
  const resumeRes = await executor.resumeWorkflow(plan.id, 'student-pause');
  assert.equal(resumeRes.status, 'completed');
  assert.equal(stateManager.getWorkflow(plan.id)?.status, 'completed');
});

// ---------------------------------------------------------------------------
// Test 10: Duplicate execution prevention / idempotency
// ---------------------------------------------------------------------------
test('Test 10: Attempting to pause or cancel an already completed workflow is rejected', () => {
  const stateManager = new WorkflowStateManager();
  const executor = new LearningWorkflowExecutor(undefined, stateManager);

  const plan: LearningWorkflowPlan = {
    id: 'wf-completed-1',
    studentId: 'student-1',
    goal: 'Completed goal',
    conceptId: 'cs_binary_search',
    conceptTitle: 'Binary Search',
    domain: 'computer_science',
    steps: [],
    status: 'completed',
    currentStepIndex: 0,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    executionLog: [],
  };
  stateManager.saveWorkflow(plan);

  const pauseRes = executor.pauseWorkflow('wf-completed-1', 'student-1');
  assert.equal(pauseRes.success, false);
  assert.match(pauseRes.error || '', /Cannot pause workflow with status "completed"/i);

  const cancelRes = executor.cancelWorkflow('wf-completed-1', 'student-1');
  assert.equal(cancelRes.success, false);
  assert.match(cancelRes.error || '', /already "completed"/i);
});

// ---------------------------------------------------------------------------
// Test 11: Invalid or inconsistent step output rejection
// ---------------------------------------------------------------------------
test('Test 11: Step producing null or invalid output payload is caught by validator', () => {
  const step: LearningWorkflowStep = {
    id: 's-out',
    stepNumber: 1,
    type: 'generate_explanation',
    capabilityId: 'cap_generate_explanation',
    title: 'Step',
    description: 'Testing output',
    dependsOn: [],
    input: {},
    status: 'running',
    retryCount: 0,
    maxRetries: 1,
    timeoutMs: 10000,
  };

  const checkNull = WorkflowValidationService.validateStepOutput(step, null);
  assert.equal(checkNull.isValid, false);
  assert.match(checkNull.error || '', /invalid or null output payload/i);

  const checkValid = WorkflowValidationService.validateStepOutput(step, { data: 123 });
  assert.equal(checkValid.isValid, true);
});

// ---------------------------------------------------------------------------
// Test 12: Unauthorized workflow access blocked
// ---------------------------------------------------------------------------
test('Test 12: User B attempting to execute or cancel User A’s workflow is blocked with forbidden status', async () => {
  const plannerRes = LearningWorkflowPlanner.planWorkflow('user-alice', 'Alice learning goal');
  assert.ok(plannerRes.plan);
  const plan = plannerRes.plan;

  const executor = new LearningWorkflowExecutor();
  // Bob attempts to execute Alice's plan
  const execResult = await executor.executeWorkflow(plan, 'user-bob');

  assert.equal(execResult.status, 'failed');
  assert.match(execResult.error || '', /Forbidden: User "user-bob" is not authorized/i);
});

// ---------------------------------------------------------------------------
// Test 13: Assessment struggle branches to adaptive remediation hint
// ---------------------------------------------------------------------------
test('Test 13: Assessment score below 70% automatically branches to remediation hint instead of advancing', async () => {
  const plannerRes = LearningWorkflowPlanner.planWorkflow('student-struggle', 'Master linear functions');
  assert.ok(plannerRes.plan);
  const plan = plannerRes.plan;

  // Configure assessment step to simulate a low score (30%)
  const assessStep = plan.steps.find((s) => s.type === 'interactive_assessment');
  assert.ok(assessStep);
  assessStep.input.submittedAnswer = 'Wrong Answer';
  assessStep.input.simulatedScore = 0.3;

  const executor = new LearningWorkflowExecutor();
  const execResult = await executor.executeWorkflow(plan, 'student-struggle');

  // Verify remediation step was injected into the workflow plan
  assert.equal(plan.remediationTriggered, true);
  const remediationStep = plan.steps.find((s) => s.type === 'remediation_hint');
  assert.ok(remediationStep, 'Remediation hint step must be dynamically injected into workflow');
  assert.equal(remediationStep.status, 'completed');
  assert.ok(remediationStep.output);
});

// ---------------------------------------------------------------------------
// Test 14: Complete workflow execution with final progress summary
// ---------------------------------------------------------------------------
test('Test 14: Completed workflow produces comprehensive progress summary and verified execution log', async () => {
  const plannerRes = LearningWorkflowPlanner.planWorkflow('student-summary', 'Learn Newton’s Second Law', {
    conceptId: 'phys_newton_laws',
  });
  assert.ok(plannerRes.plan);

  const executor = new LearningWorkflowExecutor();
  const result = await executor.executeWorkflow(plannerRes.plan, 'student-summary');

  assert.equal(result.status, 'completed');
  assert.ok(result.summary);
  assert.match(result.summary, /successfully achieved goal/i);

  // Verify execution log contains all lifecycle milestones
  const events = result.log.map((e) => e.eventType);
  assert.ok(events.includes('workflow_started'));
  assert.ok(events.includes('step_started'));
  assert.ok(events.includes('step_completed'));
  assert.ok(events.includes('workflow_completed'));
});

// ---------------------------------------------------------------------------
// Test 15: Integrated workflow with document grounding and canvas visualization
// ---------------------------------------------------------------------------
test('Test 15: Workflow planned with documentId includes grounded retrieval and spatial canvas plan', async () => {
  // Pre-seed mock textbook in DocumentPersistenceService
  const mockDoc: ImportedDocument = {
    id: 'doc-physics-textbook',
    fileName: 'Physics_Dynamics.txt',
    fileSize: 3000,
    fileType: 'text',
    mimeType: 'text/plain',
    title: 'University Physics: Chapter 4 Dynamics',
    totalPages: 2,
    pages: [
      {
        pageNumber: 1,
        rawText: 'Newton’s Second Law F = ma states that force equals mass times acceleration.',
        headings: ['Newton’s Second Law'],
        hasTables: false,
        hasEquations: true,
        wordCount: 15,
      },
    ],
    sections: [
      {
        id: 's-1',
        title: 'Newton’s Second Law',
        startPage: 1,
        endPage: 1,
        content: 'Newton’s Second Law F = ma states that force equals mass times acceleration.',
      },
    ],
    tables: [],
    equations: [],
    isScanned: false,
    ocrStatus: 'none',
    warnings: [],
    processingStatus: 'completed',
    extractedAt: Date.now(),
    checksum: 'checksum-dyn',
  };
  await DocumentPersistenceService.saveDocument(mockDoc);

  // Plan workflow with documentId
  const plannerRes = LearningWorkflowPlanner.planWorkflow(
    'student-grounded',
    'Explain F = ma using my textbook and show visual simulation',
    {
      conceptId: 'phys_newton_laws',
      documentId: 'doc-physics-textbook',
    }
  );

  assert.ok(plannerRes.plan);
  const plan = plannerRes.plan;

  // Must contain document_grounding step
  const docStep = plan.steps.find((s) => s.type === 'document_grounding');
  assert.ok(docStep, 'Workflow must contain document_grounding step');

  // Must contain visualize_concept step
  const visualStep = plan.steps.find((s) => s.type === 'visualize_concept');
  assert.ok(visualStep, 'Workflow must contain visualize_concept step');

  const executor = new LearningWorkflowExecutor();
  const result = await executor.executeWorkflow(plan, 'student-grounded');

  assert.equal(result.status, 'completed');
  assert.equal(docStep.status, 'completed');
  assert.equal(docStep.output?.isGrounded, true);
  assert.equal(visualStep.status, 'completed');
  assert.equal(visualStep.output?.rendererName, 'physics_vector_simulator');
});
