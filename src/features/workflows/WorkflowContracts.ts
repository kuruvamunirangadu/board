/**
 * VisiOS — Phase 10: Autonomous Learning Workflows Contracts
 * Typed representations for goal-oriented learning workflows, dependency DAGs,
 * step execution states, recovery policies, and execution logs.
 */

export type WorkflowStatus =
  | 'pending'
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed'
  | 'cancelled';

export type StepStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | 'remediation_needed';

export type WorkflowStepType =
  | 'assess_prerequisites'
  | 'generate_explanation'
  | 'visualize_concept'
  | 'document_grounding'
  | 'interactive_assessment'
  | 'remediation_hint'
  | 'progress_checkpoint';

export interface WorkflowLogEntry {
  timestamp: number;
  stepId?: string;
  eventType: 'workflow_started' | 'step_started' | 'step_completed' | 'step_failed' | 'retry_attempted' | 'workflow_paused' | 'workflow_resumed' | 'workflow_cancelled' | 'workflow_completed';
  message: string;
  metadata?: Record<string, unknown>;
}

export interface LearningWorkflowStep {
  id: string;
  stepNumber: number;
  type: WorkflowStepType;
  capabilityId: string;
  title: string;
  description: string;
  dependsOn: string[];
  input: Record<string, unknown>;
  output?: Record<string, unknown>;
  status: StepStatus;
  retryCount: number;
  maxRetries: number;
  timeoutMs: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface LearningWorkflowPlan {
  id: string;
  studentId: string;
  goal: string;
  conceptId: string;
  conceptTitle: string;
  domain: string;
  steps: LearningWorkflowStep[];
  status: WorkflowStatus;
  currentStepIndex: number;
  createdAt: number;
  updatedAt: number;
  executionLog: WorkflowLogEntry[];
  summary?: string;
  remediationTriggered?: boolean;
}

export interface WorkflowExecutionResult {
  workflowId: string;
  goal: string;
  status: WorkflowStatus;
  completedStepsCount: number;
  totalStepsCount: number;
  currentStep?: LearningWorkflowStep;
  error?: string;
  summary?: string;
  log: WorkflowLogEntry[];
}
