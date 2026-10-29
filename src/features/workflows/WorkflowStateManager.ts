/**
 * VisiOS — Phase 10: Workflow State Manager
 * Tracks runtime workflow progress, execution logs, pause/resume transitions, and cancellation.
 */

import {
  LearningWorkflowPlan,
  WorkflowStatus,
  StepStatus,
  WorkflowLogEntry,
} from './WorkflowContracts';

export class WorkflowStateManager {
  private workflows: Map<string, LearningWorkflowPlan> = new Map();

  public saveWorkflow(plan: LearningWorkflowPlan): LearningWorkflowPlan {
    plan.updatedAt = Date.now();
    this.workflows.set(plan.id, plan);
    return plan;
  }

  public getWorkflow(workflowId: string): LearningWorkflowPlan | undefined {
    return this.workflows.get(workflowId);
  }

  public appendLog(workflowId: string, entry: Omit<WorkflowLogEntry, 'timestamp'>): void {
    const plan = this.workflows.get(workflowId);
    if (plan) {
      plan.executionLog.push({
        ...entry,
        timestamp: Date.now(),
      });
      plan.updatedAt = Date.now();
    }
  }

  public pauseWorkflow(workflowId: string): { success: boolean; plan?: LearningWorkflowPlan; error?: string } {
    const plan = this.workflows.get(workflowId);
    if (!plan) return { success: false, error: `Workflow "${workflowId}" not found.` };

    if (plan.status !== 'running' && plan.status !== 'pending') {
      return { success: false, error: `Cannot pause workflow with status "${plan.status}".` };
    }

    plan.status = 'paused';
    this.appendLog(workflowId, {
      eventType: 'workflow_paused',
      message: `Workflow paused at step ${plan.currentStepIndex + 1}/${plan.steps.length}.`,
    });

    return { success: true, plan };
  }

  public resumeWorkflow(workflowId: string): { success: boolean; plan?: LearningWorkflowPlan; error?: string } {
    const plan = this.workflows.get(workflowId);
    if (!plan) return { success: false, error: `Workflow "${workflowId}" not found.` };

    if (plan.status !== 'paused') {
      return { success: false, error: `Cannot resume workflow that is not paused (current status: "${plan.status}").` };
    }

    plan.status = 'running';
    this.appendLog(workflowId, {
      eventType: 'workflow_resumed',
      message: `Workflow resumed at step ${plan.currentStepIndex + 1}/${plan.steps.length}.`,
    });

    return { success: true, plan };
  }

  public cancelWorkflow(workflowId: string): { success: boolean; plan?: LearningWorkflowPlan; error?: string } {
    const plan = this.workflows.get(workflowId);
    if (!plan) return { success: false, error: `Workflow "${workflowId}" not found.` };

    if (plan.status === 'completed' || plan.status === 'cancelled') {
      return { success: false, error: `Workflow is already "${plan.status}".` };
    }

    plan.status = 'cancelled';
    this.appendLog(workflowId, {
      eventType: 'workflow_cancelled',
      message: 'Workflow execution cancelled by user request.',
    });

    return { success: true, plan };
  }

  public updateStepStatus(
    workflowId: string,
    stepId: string,
    status: StepStatus,
    output?: Record<string, unknown>,
    error?: string
  ): void {
    const plan = this.workflows.get(workflowId);
    if (!plan) return;

    const step = plan.steps.find((s) => s.id === stepId);
    if (step) {
      step.status = status;
      if (output) step.output = output;
      if (error) step.error = error;
      if (status === 'completed') step.completedAt = Date.now();
      plan.updatedAt = Date.now();
    }
  }

  public clear(): void {
    this.workflows.clear();
  }
}

export const defaultWorkflowStateManager = new WorkflowStateManager();
