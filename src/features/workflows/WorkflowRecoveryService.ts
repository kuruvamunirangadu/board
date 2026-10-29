/**
 * VisiOS — Phase 10: Workflow Recovery Service
 * Handles bounded retries, execution timeouts, and adaptive branching
 * when a student struggles on an interactive assessment step.
 */

import {
  LearningWorkflowPlan,
  LearningWorkflowStep,
} from './WorkflowContracts';

export interface RecoveryDecision {
  action: 'retry' | 'fail' | 'branch_remediation' | 'timeout';
  remediationStep?: LearningWorkflowStep;
  reason: string;
}

export class WorkflowRecoveryService {
  public static readonly DEFAULT_MAX_RETRIES = 2;

  /**
   * Evaluates a step failure or assessment outcome and determines recovery strategy.
   */
  public static evaluateRecovery(
    plan: LearningWorkflowPlan,
    step: LearningWorkflowStep,
    error?: string,
    assessmentScore?: number
  ): RecoveryDecision {
    // 1. Assessment Outcome: If student struggles, branch to targeted remediation hint
    if (step.type === 'interactive_assessment' && assessmentScore !== undefined && assessmentScore < 0.7) {
      const remediationStepId = `step_remediation_${Date.now()}`;
      const remediationStep: LearningWorkflowStep = {
        id: remediationStepId,
        stepNumber: step.stepNumber + 1,
        type: 'remediation_hint',
        capabilityId: 'cap_remediation_hint',
        title: `Remediation Hint: ${plan.conceptTitle}`,
        description: 'Provide progressive hints addressing struggling areas before retrying assessment.',
        dependsOn: [step.id],
        input: {
          conceptId: plan.conceptId,
          failedStepId: step.id,
          previousScore: assessmentScore,
        },
        status: 'pending',
        retryCount: 0,
        maxRetries: 1,
        timeoutMs: 15000,
      };

      plan.remediationTriggered = true;
      return {
        action: 'branch_remediation',
        remediationStep,
        reason: `Student scored ${(assessmentScore * 100).toFixed(0)}% on assessment. Adaptive remediation hint injected.`,
      };
    }

    // 2. Check retry bounds
    if (step.retryCount < step.maxRetries) {
      step.retryCount++;
      return {
        action: 'retry',
        reason: `Step failed with "${error || 'unknown error'}". Retrying (attempt ${step.retryCount}/${step.maxRetries}).`,
      };
    }

    // 3. Exhausted retries: Fail step safely
    return {
      action: 'fail',
      reason: `Step "${step.id}" exceeded maximum retry threshold (${step.maxRetries}). Halting workflow execution safely.`,
    };
  }

  /**
   * Checks whether a step has exceeded its allocated timeout.
   */
  public static checkTimeout(step: LearningWorkflowStep): boolean {
    if (!step.startedAt) return false;
    const elapsed = Date.now() - step.startedAt;
    return elapsed > step.timeoutMs;
  }
}
