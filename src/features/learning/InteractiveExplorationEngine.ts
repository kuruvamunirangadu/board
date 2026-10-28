import {
  InteractiveParameter,
  InteractiveExperimentState,
  LearningPlan,
} from './types';
import { FormulaDerivationEngine } from './FormulaDerivationEngine';

export class InteractiveExplorationEngine {
  /**
   * Applies user parameter changes, performs validated recalculations,
   * and returns the synchronized experiment state.
   */
  static updateParameter(
    plan: LearningPlan,
    currentState: InteractiveExperimentState,
    paramId: string,
    newValue: number
  ): InteractiveExperimentState {
    const paramDef = plan.interactiveParameters.find((p) => p.id === paramId);
    if (!paramDef) {
      return currentState;
    }

    // 1. Boundary validation
    const clampedValue = Math.min(paramDef.max, Math.max(paramDef.min, newValue));

    // 2. Clone and update parameters
    const updatedParams = {
      ...currentState.parameters,
      [paramId]: clampedValue,
    };

    // 3. Domain constraints & live relationships
    if (plan.conceptId === 'algebra_square_diff') {
      const a = updatedParams.a ?? 6;
      if (paramId === 'b') {
        updatedParams.b = Math.min(clampedValue, Math.max(1, a - 1));
      } else if (paramId === 'a') {
        if ((updatedParams.b ?? 2) >= clampedValue) {
          updatedParams.b = Math.max(1, clampedValue - 1);
        }
      }
    } else if (plan.conceptId === 'physics_f_ma') {
      const m = Math.max(0.01, updatedParams.m ?? 2);
      if (paramId === 'a' || (paramId === 'm' && updatedParams.a !== undefined)) {
        const a = updatedParams.a ?? 5;
        updatedParams.F = Number((m * a).toFixed(2));
      } else if (paramId === 'F') {
        const F = updatedParams.F ?? 10;
        updatedParams.a = Number((F / m).toFixed(2));
      }
    }

    // 4. Calculate outcomes through deterministic math engine
    const calcResult = FormulaDerivationEngine.calculate(plan.conceptId, updatedParams);

    // 5. Generate graph points if concept is a function (e.g. y = sin(x) or v = u + at)
    let graphPoints: { x: number; y: number }[] | undefined;
    if (plan.conceptId === 'calculus_sin_x' || plan.conceptId === 'math_sine_function') {
      graphPoints = [];
      const A = updatedParams.A ?? 1;
      const f = updatedParams.f ?? 1;
      for (let t = -6.28; t <= 6.28; t += 0.2) {
        graphPoints.push({ x: Number(t.toFixed(2)), y: Number((A * Math.sin(f * t)).toFixed(3)) });
      }
    } else if (plan.conceptId === 'math_cosine_function') {
      graphPoints = [];
      const A = updatedParams.A ?? 1;
      const f = updatedParams.f ?? 1;
      for (let t = -6.28; t <= 6.28; t += 0.2) {
        graphPoints.push({ x: Number(t.toFixed(2)), y: Number((A * Math.cos(f * t)).toFixed(3)) });
      }
    } else if (plan.conceptId === 'math_exp_cos_curve') {
      graphPoints = [];
      for (let t = -6.28; t <= 6.28; t += 0.2) {
        graphPoints.push({ x: Number(t.toFixed(2)), y: Number(Math.exp(Math.cos(t)).toFixed(3)) });
      }
    } else if (plan.conceptId === 'math_exponential_function') {
      graphPoints = [];
      const a = updatedParams.a ?? 1;
      const k = updatedParams.k ?? 1;
      for (let t = -4; t <= 4; t += 0.2) {
        graphPoints.push({ x: Number(t.toFixed(2)), y: Number((a * Math.exp(k * t)).toFixed(3)) });
      }
    } else if (plan.conceptId === 'physics_kinematics_v_u_at') {
      graphPoints = [];
      const u = updatedParams.u ?? 5;
      const a = updatedParams.a ?? 4;
      for (let t = 0; t <= 10; t += 0.5) {
        graphPoints.push({ x: t, y: Number((u + a * t).toFixed(2)) });
      }
    }

    return {
      parameters: updatedParams,
      calculatedOutputs: {
        result: calcResult.primaryResult,
        display: calcResult.formattedOutput,
      },
      outputFormulas: {
        output: calcResult.formattedOutput,
      },
      graphPoints,
      statusMessage: `Updated ${paramDef.label} = ${clampedValue} ${paramDef.unit || ''} ⇒ ${calcResult.formattedOutput}`,
    };
  }

  /**
   * Resets parameters back to default plan values.
   */
  static resetToDefaults(plan: LearningPlan): InteractiveExperimentState {
    return plan.defaultExperimentState;
  }
}

