/**
 * VisiOS — Phase 2: Multi-Intent Execution Planner
 * Converts an InterpretedLearningIntent that contains multiple intents into a
 * sequenced MultiIntentExecutionPlan with per-step capability mapping.
 * Does NOT execute capabilities — it only produces the plan structure.
 */

import { TargetEngine } from './types';
import {
  StudentIntent,
  InterpretedLearningIntent,
  MultiIntentExecutionStep,
  MultiIntentExecutionPlan,
} from './InputIntelligenceTypes';

// Maps a StudentIntent to the engine type that would handle it
const INTENT_ENGINE_MAP: Partial<Record<StudentIntent, TargetEngine>> = {
  explain_concept: 'knowledge',
  solve_problem: 'math',
  derive_formula: 'math',
  prove_theorem: 'math',
  plot_function: 'math',
  visualize_concept: 'knowledge',
  run_simulation: 'simulation',
  trace_algorithm: 'algorithm',
  compare_scenarios: 'simulation',
  analyze_document: 'knowledge',
  generate_practice: 'knowledge',
  continue_learning: 'knowledge',
};

// Maps a StudentIntent to a human-readable description template
function describeStep(intent: StudentIntent, topic: string): string {
  switch (intent) {
    case 'explain_concept':    return `Explain the concept: "${topic}"`;
    case 'solve_problem':      return `Solve the problem: "${topic}"`;
    case 'derive_formula':     return `Derive the formula for: "${topic}"`;
    case 'prove_theorem':      return `Prove the theorem: "${topic}"`;
    case 'plot_function':      return `Plot the function: "${topic}"`;
    case 'visualize_concept':  return `Visualize the concept: "${topic}"`;
    case 'run_simulation':     return `Run simulation for: "${topic}"`;
    case 'trace_algorithm':    return `Trace the algorithm: "${topic}"`;
    case 'compare_scenarios':  return `Compare scenarios: "${topic}"`;
    case 'analyze_document':   return `Analyze document context for: "${topic}"`;
    case 'generate_practice':  return `Generate practice questions for: "${topic}"`;
    case 'continue_learning':  return `Resume learning session for: "${topic}"`;
    default:                   return `Process intent "${intent}" for: "${topic}"`;
  }
}

// Determine best capability ID for an intent given available candidate capabilities
function resolveCapabilityForIntent(
  intent: StudentIntent,
  topic: string,
  candidateCapabilityIds: string[]
): string {
  // If we have an exact candidate from the IntentClassifier, prefer it for primary intent
  if (candidateCapabilityIds.length > 0) {
    return candidateCapabilityIds[0];
  }

  // Fallback capability IDs per intent type
  switch (intent) {
    case 'explain_concept':    return 'cap_general_explanation';
    case 'solve_problem':      return 'cap_general_math';
    case 'derive_formula':     return 'cap_general_math';
    case 'prove_theorem':      return 'cap_euclidean_geometry';
    case 'plot_function':      return 'cap_linear_functions';
    case 'visualize_concept':  return 'cap_general_visualization';
    case 'run_simulation':     return 'cap_projectile_motion';
    case 'trace_algorithm':    return 'cap_cs_binary_search';
    case 'compare_scenarios':  return 'cap_projectile_motion';
    case 'analyze_document':   return 'cap_general_explanation';
    case 'generate_practice':  return 'cap_general_explanation';
    case 'continue_learning':  return 'cap_general_explanation';
    default:                   return 'cap_general_explanation';
  }
}

// Whether steps can run concurrently (no data dependency between them)
function canRunConcurrently(intents: StudentIntent[]): boolean {
  // explain + plot can run independently
  // simulate + compare can run independently
  // But explain + trace_algorithm has dependency (explain informs the trace)
  const dependentPairs: Array<[StudentIntent, StudentIntent]> = [
    ['explain_concept', 'trace_algorithm'],
    ['explain_concept', 'run_simulation'],
  ];
  for (const intent of intents) {
    for (const [first, second] of dependentPairs) {
      if (intents.includes(first) && intents.includes(second)) {
        return false;
      }
    }
  }
  return true;
}

export class MultiIntentPlanner {
  /**
   * Produce a sequenced MultiIntentExecutionPlan from an InterpretedLearningIntent
   * that has additionalIntents defined.
   *
   * If the intent is not multi-intent, returns a single-step plan for the primary intent.
   */
  public static buildPlan(interpreted: InterpretedLearningIntent): MultiIntentExecutionPlan {
    const planId = `plan_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const allIntents: StudentIntent[] = [
      interpreted.primaryIntent,
      ...(interpreted.additionalIntents ?? []),
    ];

    // Filter out non-executable intents (clarify_request, unsupported shouldn't appear here)
    const executableIntents = allIntents.filter(
      (i) => i !== 'clarify_request' && i !== 'unsupported'
    );

    if (executableIntents.length === 0) {
      // Return a trivially empty plan
      return {
        planId,
        originalQuery: interpreted.originalInput,
        steps: [],
        isMultiIntent: false,
        canExecuteConcurrently: false,
        summary: 'No executable intents found.',
      };
    }

    const concurrent = canRunConcurrently(executableIntents);

    const steps: MultiIntentExecutionStep[] = executableIntents.map((intent, index) => {
      const stepId = `step_${index + 1}`;
      const engineType: TargetEngine = INTENT_ENGINE_MAP[intent] ?? 'knowledge';
      const capabilityId = resolveCapabilityForIntent(
        intent,
        interpreted.topic,
        // Only primary intent gets the resolved candidateCapabilityIds
        index === 0 ? interpreted.candidateCapabilityIds : []
      );

      // Dependency: if sequential, each step depends on previous (except first)
      const dependsOnStepId = !concurrent && index > 0 ? `step_${index}` : undefined;

      return {
        stepId,
        order: index + 1,
        intent,
        capabilityId,
        engineType,
        description: describeStep(intent, interpreted.topic),
        inputPayload: {
          query: interpreted.originalInput,
          topic: interpreted.topic,
          domain: interpreted.domain,
          resolvedParameters: interpreted.resolvedParameters,
          ...(interpreted.mathParsing
            ? { mathExpression: interpreted.mathParsing.normalizedSyntax }
            : {}),
        },
        dependsOnStepId,
        status: 'pending',
      };
    });

    const isMultiIntent = executableIntents.length > 1;
    const summary = isMultiIntent
      ? `Multi-intent plan: ${executableIntents.join(' → ')} for "${interpreted.topic}"`
      : `Single-intent plan: ${executableIntents[0]} for "${interpreted.topic}"`;

    return {
      planId,
      originalQuery: interpreted.originalInput,
      steps,
      isMultiIntent,
      canExecuteConcurrently: concurrent,
      summary,
    };
  }

  /**
   * Mark a step as succeeded with a result payload.
   */
  public static markStepSuccess(
    plan: MultiIntentExecutionPlan,
    stepId: string,
    result: unknown
  ): MultiIntentExecutionPlan {
    return {
      ...plan,
      steps: plan.steps.map((s) =>
        s.stepId === stepId ? { ...s, status: 'success', result } : s
      ),
    };
  }

  /**
   * Mark a step as failed. Downstream dependent steps will be skipped.
   */
  public static markStepFailed(
    plan: MultiIntentExecutionPlan,
    stepId: string,
    error: string
  ): MultiIntentExecutionPlan {
    const updatedSteps = plan.steps.map((s) => {
      if (s.stepId === stepId) return { ...s, status: 'failed' as const, error };
      if (s.dependsOnStepId === stepId) return { ...s, status: 'skipped' as const, error: `Skipped: dependency ${stepId} failed` };
      return s;
    });
    return { ...plan, steps: updatedSteps };
  }

  /**
   * Check if all steps have settled (success, failed, or skipped).
   */
  public static isPlanSettled(plan: MultiIntentExecutionPlan): boolean {
    return plan.steps.every((s) => s.status !== 'pending');
  }

  /**
   * Returns true if at least one step succeeded (partial success counts).
   */
  public static hasPartialSuccess(plan: MultiIntentExecutionPlan): boolean {
    return plan.steps.some((s) => s.status === 'success');
  }
}
