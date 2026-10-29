/**
 * VisiOS — Phase 10: Learning Workflow Executor
 * Autonomous workflow coordinator executing dependency-ordered steps through
 * authorized capability registries, validating inputs/outputs, enforcing timeouts and retries,
 * and adapting dynamically to student assessment evidence.
 */

import {
  LearningWorkflowPlan,
  WorkflowExecutionResult,
} from './WorkflowContracts';
import { WorkflowStepRegistry } from './WorkflowStepRegistry';
import { WorkflowValidationService } from './WorkflowValidationService';
import { WorkflowStateManager, defaultWorkflowStateManager } from './WorkflowStateManager';
import { WorkflowPermissionService } from './WorkflowPermissionService';
import { WorkflowRecoveryService } from './WorkflowRecoveryService';

export class LearningWorkflowExecutor {
  private stepRegistry: WorkflowStepRegistry;
  private stateManager: WorkflowStateManager;

  constructor(
    customRegistry?: WorkflowStepRegistry,
    customStateManager?: WorkflowStateManager
  ) {
    this.stepRegistry = customRegistry || new WorkflowStepRegistry();
    this.stateManager = customStateManager || defaultWorkflowStateManager;
  }

  /**
   * Executes a workflow plan from its current progress point.
   */
  public async executeWorkflow(
    plan: LearningWorkflowPlan,
    requestingUserId: string = plan.studentId
  ): Promise<WorkflowExecutionResult> {
    // 1. Permission and Access Check
    const access = WorkflowPermissionService.checkWorkflowAccess(plan, requestingUserId);
    if (!access.allowed) {
      return {
        workflowId: plan.id,
        goal: plan.goal,
        status: 'failed',
        completedStepsCount: 0,
        totalStepsCount: plan.steps.length,
        error: access.reason,
        log: plan.executionLog,
      };
    }

    // 2. Structural & Quota Validation
    const validation = WorkflowValidationService.validatePlan(plan);
    if (!validation.isValid) {
      plan.status = 'failed';
      return {
        workflowId: plan.id,
        goal: plan.goal,
        status: 'failed',
        completedStepsCount: 0,
        totalStepsCount: plan.steps.length,
        error: `Workflow validation failed: ${validation.errors.join('; ')}`,
        log: plan.executionLog,
      };
    }

    const quota = WorkflowPermissionService.checkExecutionQuotas(plan);
    if (!quota.allowed) {
      plan.status = 'failed';
      return {
        workflowId: plan.id,
        goal: plan.goal,
        status: 'failed',
        completedStepsCount: 0,
        totalStepsCount: plan.steps.length,
        error: quota.reason,
        log: plan.executionLog,
      };
    }

    // 3. Register with State Manager
    plan.status = 'running' as any;
    this.stateManager.saveWorkflow(plan);

    // 4. Step-by-Step Execution Loop
    while (plan.currentStepIndex < plan.steps.length) {
      // Check if paused or cancelled mid-execution
      const currentWorkflowStatus = this.stateManager.getWorkflow(plan.id)?.status || plan.status;
      if (currentWorkflowStatus === 'paused' || currentWorkflowStatus === 'cancelled') {
        break;
      }

      const currentStep = plan.steps[plan.currentStepIndex];

      // Verify dependencies are completed
      const dependenciesMet = currentStep.dependsOn.every((depId) => {
        const depStep = plan.steps.find((s) => s.id === depId);
        return depStep && (depStep.status === 'completed' || depStep.status === 'remediation_needed');
      });

      if (!dependenciesMet) {
        currentStep.status = 'failed';
        currentStep.error = 'Unfulfilled prerequisite step dependencies.';
        plan.status = 'failed';
        this.stateManager.appendLog(plan.id, {
          stepId: currentStep.id,
          eventType: 'step_failed',
          message: `Step "${currentStep.title}" halted due to unfulfilled dependencies.`,
        });
        break;
      }

      // Validate step input payload
      const inputVal = WorkflowValidationService.validateStepInput(currentStep);
      if (!inputVal.isValid) {
        currentStep.status = 'failed';
        currentStep.error = inputVal.error;
        plan.status = 'failed';
        this.stateManager.appendLog(plan.id, {
          stepId: currentStep.id,
          eventType: 'step_failed',
          message: inputVal.error || 'Step input validation failed.',
        });
        break;
      }

      // Execute Step
      currentStep.status = 'running';
      currentStep.startedAt = Date.now();
      this.stateManager.appendLog(plan.id, {
        stepId: currentStep.id,
        eventType: 'step_started',
        message: `Executing Step ${plan.currentStepIndex + 1}/${plan.steps.length}: "${currentStep.title}".`,
      });

      try {
        const output = await this.stepRegistry.executeStep(currentStep, plan.studentId, plan.id);

        // Validate step output
        const outputVal = WorkflowValidationService.validateStepOutput(currentStep, output);
        if (!outputVal.isValid) {
          throw new Error(outputVal.error || 'Invalid step output.');
        }

        currentStep.output = output;

        // Check if assessment outcome requires adaptive remediation branching
        const assessmentScore = output.score !== undefined ? Number(output.score) : undefined;
        if (currentStep.type === 'interactive_assessment' && assessmentScore !== undefined && assessmentScore < 0.7) {
          const recovery = WorkflowRecoveryService.evaluateRecovery(plan, currentStep, undefined, assessmentScore);
          if (recovery.action === 'branch_remediation' && recovery.remediationStep) {
            currentStep.status = 'remediation_needed';
            currentStep.completedAt = Date.now();

            // Inject remediation step right after the assessment step
            plan.steps.splice(plan.currentStepIndex + 1, 0, recovery.remediationStep);

            this.stateManager.appendLog(plan.id, {
              stepId: currentStep.id,
              eventType: 'step_completed',
              message: recovery.reason,
            });

            plan.currentStepIndex++;
            continue;
          }
        }

        currentStep.status = 'completed';
        currentStep.completedAt = Date.now();
        this.stateManager.appendLog(plan.id, {
          stepId: currentStep.id,
          eventType: 'step_completed',
          message: `Step "${currentStep.title}" completed successfully.`,
        });

        plan.currentStepIndex++;
      } catch (err: any) {
        // Evaluate recovery: retry bounds vs fail
        const recovery = WorkflowRecoveryService.evaluateRecovery(plan, currentStep, err.message);

        if (recovery.action === 'retry') {
          this.stateManager.appendLog(plan.id, {
            stepId: currentStep.id,
            eventType: 'retry_attempted',
            message: recovery.reason,
          });
          // Repeat current step in next iteration
          continue;
        }

        currentStep.status = 'failed';
        currentStep.error = err.message || 'Execution error';
        plan.status = 'failed';

        this.stateManager.appendLog(plan.id, {
          stepId: currentStep.id,
          eventType: 'step_failed',
          message: recovery.reason,
        });
        break;
      }
    }

    // 5. Wrap up Final Status
    const completedCount = plan.steps.filter((s) => s.status === 'completed').length;
    const currentFinalStatus = (this.stateManager.getWorkflow(plan.id)?.status || plan.status) as any;
    if (currentFinalStatus !== 'paused' && currentFinalStatus !== 'cancelled' && currentFinalStatus !== 'failed') {
      plan.status = 'completed';
      plan.summary = `Autonomous workflow successfully achieved goal: "${plan.goal}" across ${completedCount} completed learning activities.`;
      this.stateManager.appendLog(plan.id, {
        eventType: 'workflow_completed',
        message: plan.summary,
      });
    }

    this.stateManager.saveWorkflow(plan);

    return {
      workflowId: plan.id,
      goal: plan.goal,
      status: plan.status,
      completedStepsCount: completedCount,
      totalStepsCount: plan.steps.length,
      currentStep: plan.steps[plan.currentStepIndex],
      error: plan.steps.find((s) => s.status === 'failed')?.error,
      summary: plan.summary,
      log: plan.executionLog,
    };
  }

  public pauseWorkflow(workflowId: string, requestingUserId: string): { success: boolean; error?: string } {
    const plan = this.stateManager.getWorkflow(workflowId);
    if (!plan) return { success: false, error: `Workflow "${workflowId}" not found.` };

    const access = WorkflowPermissionService.checkWorkflowAccess(plan, requestingUserId);
    if (!access.allowed) return { success: false, error: access.reason };

    return this.stateManager.pauseWorkflow(workflowId);
  }

  public resumeWorkflow(workflowId: string, requestingUserId: string): Promise<WorkflowExecutionResult> {
    const plan = this.stateManager.getWorkflow(workflowId);
    if (!plan) {
      return Promise.resolve({
        workflowId,
        goal: 'Unknown',
        status: 'failed',
        completedStepsCount: 0,
        totalStepsCount: 0,
        error: `Workflow "${workflowId}" not found.`,
        log: [],
      });
    }

    const access = WorkflowPermissionService.checkWorkflowAccess(plan, requestingUserId);
    if (!access.allowed) {
      return Promise.resolve({
        workflowId,
        goal: plan.goal,
        status: 'failed',
        completedStepsCount: 0,
        totalStepsCount: plan.steps.length,
        error: access.reason,
        log: plan.executionLog,
      });
    }

    this.stateManager.resumeWorkflow(workflowId);
    return this.executeWorkflow(plan, requestingUserId);
  }

  public cancelWorkflow(workflowId: string, requestingUserId: string): { success: boolean; error?: string } {
    const plan = this.stateManager.getWorkflow(workflowId);
    if (!plan) return { success: false, error: `Workflow "${workflowId}" not found.` };

    const access = WorkflowPermissionService.checkWorkflowAccess(plan, requestingUserId);
    if (!access.allowed) return { success: false, error: access.reason };

    return this.stateManager.cancelWorkflow(workflowId);
  }
}

export const defaultWorkflowExecutor = new LearningWorkflowExecutor();
