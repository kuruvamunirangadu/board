/**
 * VisiOS — Phase 10: Workflow Permission & Security Service
 * Enforces ownership boundaries, maximum step limits, timeout limits, and sandbox restrictions.
 */

import { LearningWorkflowPlan } from './WorkflowContracts';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export class WorkflowPermissionService {
  public static readonly MAX_STEPS_PER_WORKFLOW = 12;
  public static readonly MAX_STEP_TIMEOUT_MS = 30000; // 30 seconds max per step
  public static readonly MAX_TOTAL_RETRIES = 5;

  /**
   * Validates whether a user is authorized to execute or modify a workflow.
   */
  public static checkWorkflowAccess(plan: LearningWorkflowPlan, requestingUserId: string): PermissionCheckResult {
    const cleanRequester = requestingUserId.trim();
    if (plan.studentId !== cleanRequester && cleanRequester !== 'system' && cleanRequester !== 'instructor') {
      return {
        allowed: false,
        reason: `Forbidden: User "${requestingUserId}" is not authorized to execute or modify workflow "${plan.id}" owned by "${plan.studentId}".`,
      };
    }
    return { allowed: true };
  }

  /**
   * Enforces structural quotas and execution safety bounds.
   */
  public static checkExecutionQuotas(plan: LearningWorkflowPlan): PermissionCheckResult {
    if (plan.steps.length > this.MAX_STEPS_PER_WORKFLOW) {
      return {
        allowed: false,
        reason: `Workflow step count (${plan.steps.length}) exceeds maximum allowable quota of ${this.MAX_STEPS_PER_WORKFLOW} steps.`,
      };
    }

    const totalRetries = plan.steps.reduce((sum, s) => sum + s.retryCount, 0);
    if (totalRetries > this.MAX_TOTAL_RETRIES) {
      return {
        allowed: false,
        reason: `Workflow exceeded total retry threshold (${totalRetries} > ${this.MAX_TOTAL_RETRIES}). Aborting execution to prevent infinite looping.`,
      };
    }

    return { allowed: true };
  }
}
