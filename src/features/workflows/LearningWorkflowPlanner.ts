/**
 * VisiOS — Phase 10: Learning Workflow Planner
 * Converts natural-language learning goals into validated, multi-step dependency plans.
 */

import {
  LearningWorkflowPlan,
  LearningWorkflowStep,
} from './WorkflowContracts';
import { WorkflowValidationService } from './WorkflowValidationService';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class LearningWorkflowPlanner {
  /**
   * Plans an autonomous learning workflow from a natural-language goal.
   */
  public static planWorkflow(
    studentId: string,
    goal: string,
    options?: {
      conceptId?: string;
      documentId?: string;
      preferredDifficulty?: 'beginner' | 'intermediate' | 'advanced';
    }
  ): { plan?: LearningWorkflowPlan; error?: string } {
    if (!goal || !goal.trim()) {
      return { error: 'Learning goal cannot be empty.' };
    }

    const cleanGoal = goal.trim();
    const conceptId = options?.conceptId || this.inferConceptFromGoal(cleanGoal);
    const conceptNode = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const conceptTitle = conceptNode?.title || conceptId;
    const domain = conceptNode?.domain || 'computer_science';

    const workflowId = `wf_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const steps: LearningWorkflowStep[] = [];
    let stepCount = 0;

    // Step 1: Assess Prerequisites
    const s1Id = `${workflowId}_step_1`;
    steps.push({
      id: s1Id,
      stepNumber: ++stepCount,
      type: 'assess_prerequisites',
      capabilityId: 'cap_assess_prerequisites',
      title: `Assess Prerequisites for ${conceptTitle}`,
      description: 'Check foundational mastery before advancing.',
      dependsOn: [],
      input: { conceptId },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 10000,
    });

    let prevStepId = s1Id;

    // Optional Step: Document Grounding (if documentId supplied)
    if (options?.documentId) {
      const sDocId = `${workflowId}_step_doc`;
      steps.push({
        id: sDocId,
        stepNumber: ++stepCount,
        type: 'document_grounding',
        capabilityId: 'cap_document_grounding',
        title: `Retrieve Grounded Evidence from Textbook`,
        description: 'Extract relevant textbook citations and section definitions.',
        dependsOn: [prevStepId],
        input: { documentId: options.documentId, query: `${conceptTitle} ${cleanGoal}` },
        status: 'pending',
        retryCount: 0,
        maxRetries: 2,
        timeoutMs: 15000,
      });
      prevStepId = sDocId;
    }

    // Step 2: Adaptive Explanation
    const s2Id = `${workflowId}_step_2`;
    steps.push({
      id: s2Id,
      stepNumber: ++stepCount,
      type: 'generate_explanation',
      capabilityId: 'cap_generate_explanation',
      title: `Adaptive Explanation: ${conceptTitle}`,
      description: 'Deliver structured pedagogical breakdown tailored to student level.',
      dependsOn: [prevStepId],
      input: {
        conceptId,
        strategy: 'simple',
        difficulty: options?.preferredDifficulty || 'beginner',
      },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 15000,
    });

    // Step 3: Spatial Canvas Visualization
    const s3Id = `${workflowId}_step_3`;
    steps.push({
      id: s3Id,
      stepNumber: ++stepCount,
      type: 'visualize_concept',
      capabilityId: 'cap_visualize_concept',
      title: `Spatial Canvas Visualization`,
      description: 'Demonstrate concept visually using verified interactive canvas renderers.',
      dependsOn: [s2Id],
      input: { conceptId },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 15000,
    });

    // Step 4: Interactive Knowledge Assessment
    const s4Id = `${workflowId}_step_4`;
    steps.push({
      id: s4Id,
      stepNumber: ++stepCount,
      type: 'interactive_assessment',
      capabilityId: 'cap_interactive_assessment',
      title: `Knowledge Verification & Assessment`,
      description: 'Verify demonstrated understanding using practice problems.',
      dependsOn: [s3Id],
      input: {
        conceptId,
        difficulty: options?.preferredDifficulty || 'beginner',
      },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 20000,
    });

    // Step 5: Progress Checkpoint
    const s5Id = `${workflowId}_step_5`;
    steps.push({
      id: s5Id,
      stepNumber: ++stepCount,
      type: 'progress_checkpoint',
      capabilityId: 'cap_progress_checkpoint',
      title: `Progress Checkpoint & Mastery Synthesis`,
      description: 'Record verified learning event evidence and update learner progress profile.',
      dependsOn: [s4Id],
      input: { conceptId },
      status: 'pending',
      retryCount: 0,
      maxRetries: 2,
      timeoutMs: 10000,
    });

    const plan: LearningWorkflowPlan = {
      id: workflowId,
      studentId: studentId.trim(),
      goal: cleanGoal,
      conceptId,
      conceptTitle,
      domain,
      steps,
      status: 'pending',
      currentStepIndex: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      executionLog: [
        {
          timestamp: Date.now(),
          eventType: 'workflow_started',
          message: `Autonomous workflow planned for goal: "${cleanGoal}".`,
        },
      ],
    };

    // Pre-execution validation check
    const validation = WorkflowValidationService.validatePlan(plan);
    if (!validation.isValid) {
      return { error: `Plan validation failed: ${validation.errors.join('; ')}` };
    }

    return { plan };
  }

  private static inferConceptFromGoal(goal: string): string {
    const g = goal.toLowerCase();
    if (g.includes('binary search') || g.includes('search algorithm')) return 'cs_binary_search';
    if (g.includes('sorted array')) return 'cs_sorted_arrays';
    if (g.includes('linear function') || g.includes('y =') || g.includes('slope')) return 'math_linear_functions';
    if (g.includes('quadratic') || g.includes('roots')) return 'math_quadratic_formula';
    if (g.includes('newton') || g.includes('f = ma') || g.includes('force')) return 'phys_newton_laws';
    if (g.includes('pendulum')) return 'phys_pendulum_harmonic';
    return 'cs_binary_search';
  }
}
