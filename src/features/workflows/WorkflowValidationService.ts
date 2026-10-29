/**
 * VisiOS — Phase 10: Workflow Validation Service
 * Validates workflow dependency graphs (detects cycles and dangling dependencies),
 * verifies capability authorizations, and validates step inputs and outputs before execution.
 */

import {
  LearningWorkflowPlan,
  LearningWorkflowStep,
} from './WorkflowContracts';
import { EngineCapabilityRegistry } from '../learning/EngineCapabilityRegistry';

export interface WorkflowValidationReport {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  hasCycles: boolean;
  unsupportedCapabilities: string[];
}

export class WorkflowValidationService {
  /**
   * Internal whitelist of verified workflow-level capabilities.
   */
  private static readonly WORKFLOW_CAPABILITIES = new Set<string>([
    'cap_assess_prerequisites',
    'cap_generate_explanation',
    'cap_visualize_concept',
    'cap_document_grounding',
    'cap_interactive_assessment',
    'cap_remediation_hint',
    'cap_progress_checkpoint',
    // Registry capabilities
    'cap_cs_binary_search',
    'cap_linear_functions',
    'cap_newtonian_force_dynamics',
    'cap_harmonic_pendulum',
    'cap_polynomial_identities',
    'cap_euclidean_geometry',
    'cap_kinematics_linear',
    'cap_document_grounded_learning',
  ]);

  /**
   * Validates an entire workflow plan before execution.
   */
  public static validatePlan(plan: LearningWorkflowPlan): WorkflowValidationReport {
    const errors: string[] = [];
    const warnings: string[] = [];
    const unsupportedCapabilities: string[] = [];

    if (!plan.steps || plan.steps.length === 0) {
      errors.push('Workflow plan must contain at least one executable step.');
      return { isValid: false, errors, warnings, hasCycles: false, unsupportedCapabilities };
    }

    const stepIdSet = new Set(plan.steps.map((s) => s.id));

    // 1. Check for duplicate step IDs
    if (stepIdSet.size !== plan.steps.length) {
      errors.push('Workflow plan contains duplicate step IDs.');
    }

    // 2. Check dependencies exist
    for (const step of plan.steps) {
      for (const depId of step.dependsOn) {
        if (!stepIdSet.has(depId)) {
          errors.push(`Dangling dependency: Step "${step.id}" depends on non-existent step "${depId}".`);
        }
      }
    }

    // 3. Cycle Detection in Dependency Graph (DFS)
    const hasCycles = this.detectCycles(plan.steps);
    if (hasCycles) {
      errors.push('Circular dependency detected: Workflow step graph contains a directed cycle.');
    }

    // 4. Validate Capabilities
    for (const step of plan.steps) {
      const capId = step.capabilityId;
      const isWorkflowCap = this.WORKFLOW_CAPABILITIES.has(capId);
      const isRegistryCap = EngineCapabilityRegistry.getCapabilityById(capId) !== undefined;

      if (!isWorkflowCap && !isRegistryCap) {
        unsupportedCapabilities.push(capId);
        errors.push(`Unsupported capability: Step "${step.id}" requests unregistered capability "${capId}".`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      hasCycles,
      unsupportedCapabilities,
    };
  }

  /**
   * Validates input payload for a specific step.
   */
  public static validateStepInput(step: LearningWorkflowStep): { isValid: boolean; error?: string } {
    if (!step.input || typeof step.input !== 'object') {
      return { isValid: false, error: `Step "${step.id}" input must be a valid non-null object.` };
    }

    if (step.type === 'assess_prerequisites' && !step.input.conceptId) {
      return { isValid: false, error: `Step "${step.id}" requires "conceptId" in input payload.` };
    }

    if (step.type === 'interactive_assessment' && !step.input.conceptId) {
      return { isValid: false, error: `Step "${step.id}" requires "conceptId" in input payload.` };
    }

    return { isValid: true };
  }

  /**
   * Validates output payload produced by a step before advancing.
   */
  public static validateStepOutput(step: LearningWorkflowStep, output: unknown): { isValid: boolean; error?: string } {
    if (!output || typeof output !== 'object') {
      return { isValid: false, error: `Step "${step.id}" produced invalid or null output payload.` };
    }

    return { isValid: true };
  }

  /**
   * Detects cycles in a directed step graph using DFS.
   */
  private static detectCycles(steps: LearningWorkflowStep[]): boolean {
    const adjList = new Map<string, string[]>();
    for (const step of steps) {
      adjList.set(step.id, step.dependsOn);
    }

    const visited = new Set<string>();
    const recStack = new Set<string>();

    const dfs = (nodeId: string): boolean => {
      visited.add(nodeId);
      recStack.add(nodeId);

      const neighbors = adjList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (dfs(neighbor)) return true;
        } else if (recStack.has(neighbor)) {
          return true; // Cycle detected
        }
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const step of steps) {
      if (!visited.has(step.id)) {
        if (dfs(step.id)) return true;
      }
    }

    return false;
  }
}
