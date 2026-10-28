/**
 * VisiOS — Deterministic Physics Calculation & Experiment Engine
 * Step 1: Computes verified numerical outcomes without eval() or AI hallucination.
 * Evaluates student predictions and produces structured what-if delta comparisons.
 */

import {
  ExperimentDefinition,
  ExperimentRun,
  StudentPrediction,
  PredictionEvaluation,
  WhatIfComparison,
} from './ExperimentTypes';

export class ExperimentEngine {
  /**
   * Executes numerical calculation for a given experiment and parameter set.
   */
  public static calculate(
    experimentId: string,
    params: Record<string, number>
  ): { results: Record<string, number>; formattedResults: Record<string, string> } {
    switch (experimentId) {
      case 'exp_projectile_motion':
        return this.calculateProjectile(params);
      case 'exp_harmonic_pendulum':
        return this.calculatePendulum(params);
      case 'exp_newton_second_law':
        return this.calculateForceCart(params);
      default:
        throw new Error(`Unsupported experiment calculation ID: ${experimentId}`);
    }
  }

  /**
   * 1. Projectile Motion Kinematics
   * R = (v² · sin(2θ)) / g
   * h_max = (v · sin(θ))² / (2g)
   * t_flight = (2v · sin(θ)) / g
   */
  public static calculateProjectile(params: Record<string, number>): {
    results: Record<string, number>;
    formattedResults: Record<string, string>;
  } {
    const speed = Math.max(0.1, params.speed ?? 20); // m/s
    const angleDeg = Math.min(89.9, Math.max(0.1, params.angle ?? 45)); // deg
    const g = Math.max(0.1, params.gravity ?? 9.81); // m/s²

    const angleRad = (angleDeg * Math.PI) / 180;
    const vy0 = speed * Math.sin(angleRad);
    const vx0 = speed * Math.cos(angleRad);

    const flightTime = Number(((2 * vy0) / g).toFixed(2));
    const maxHeight = Number(((vy0 * vy0) / (2 * g)).toFixed(2));
    const range = Number(((speed * speed * Math.sin(2 * angleRad)) / g).toFixed(2));

    return {
      results: {
        range,
        maxHeight,
        flightTime,
        vx0: Number(vx0.toFixed(2)),
        vy0: Number(vy0.toFixed(2)),
      },
      formattedResults: {
        range: `${range} m`,
        maxHeight: `${maxHeight} m`,
        flightTime: `${flightTime} s`,
        vx0: `${vx0.toFixed(2)} m/s`,
        vy0: `${vy0.toFixed(2)} m/s`,
      },
    };
  }

  /**
   * 2. Harmonic Pendulum Oscillations
   * Theoretical small-angle period: T = 2π√(L/g)
   * Frequency: f = 1/T
   * Max Velocity: v_max = √(2gL(1 - cos(θ)))
   */
  public static calculatePendulum(params: Record<string, number>): {
    results: Record<string, number>;
    formattedResults: Record<string, string>;
  } {
    const L = Math.max(0.1, params.length ?? 1.0); // m
    const g = Math.max(0.1, params.gravity ?? 9.81); // m/s²
    const angleDeg = Math.max(1, Math.min(80, params.initialAngle ?? 15)); // deg

    const angleRad = (angleDeg * Math.PI) / 180;
    const period = Number((2 * Math.PI * Math.sqrt(L / g)).toFixed(2));
    const frequency = Number((1 / period).toFixed(2));
    const vMax = Number((Math.sqrt(2 * g * L * (1 - Math.cos(angleRad)))).toFixed(2));

    return {
      results: {
        period,
        frequency,
        vMax,
      },
      formattedResults: {
        period: `${period} s`,
        frequency: `${frequency} Hz`,
        vMax: `${vMax} m/s`,
      },
    };
  }

  /**
   * 3. Newton's 2nd Law Dynamic Cart
   * a = F / m
   * Velocity at t=2s: v(2) = a · 2
   * Distance at t=2s: s(2) = 0.5 · a · (2)² = 2 · a
   */
  public static calculateForceCart(params: Record<string, number>): {
    results: Record<string, number>;
    formattedResults: Record<string, string>;
  } {
    const force = Math.max(0, params.force ?? 20); // N
    const mass = Math.max(0.1, params.mass ?? 4); // kg

    const acceleration = Number((force / mass).toFixed(2));
    const velocityAt2s = Number((acceleration * 2).toFixed(2));
    const distanceAt2s = Number((2 * acceleration).toFixed(2));

    return {
      results: {
        acceleration,
        velocityAt2s,
        distanceAt2s,
      },
      formattedResults: {
        acceleration: `${acceleration} m/s²`,
        velocityAt2s: `${velocityAt2s} m/s`,
        distanceAt2s: `${distanceAt2s} m`,
      },
    };
  }

  /**
   * Evaluates a recorded student prediction against the deterministic ground truth.
   */
  public static evaluatePrediction(
    prediction: StudentPrediction,
    results: Record<string, number>,
    unit: string
  ): PredictionEvaluation {
    const actual = results[prediction.outputSymbol] ?? 0;
    const absDelta = Math.abs(actual - prediction.predictedValue);
    const percentError =
      actual !== 0 ? Math.min(100, (absDelta / Math.abs(actual)) * 100) : absDelta === 0 ? 0 : 100;

    let accuracyTier: 'accurate' | 'close' | 'divergent';
    let feedbackSummary: string;

    if (percentError <= 5) {
      accuracyTier = 'accurate';
      feedbackSummary = `Outstanding prediction! Your estimate (${prediction.predictedValue} ${unit}) was within 5% of the calculated result (${actual} ${unit}).`;
    } else if (percentError <= 20) {
      accuracyTier = 'close';
      feedbackSummary = `Close estimate! Your predicted ${prediction.predictedValue} ${unit} was within 20% of the true value (${actual} ${unit}).`;
    } else {
      accuracyTier = 'divergent';
      feedbackSummary = `Interesting hypothesis. The actual outcome was ${actual} ${unit} (delta of ${absDelta.toFixed(1)} ${unit} from your prediction). Let's explore why!`;
    }

    return {
      prediction,
      actualValue: actual,
      unit,
      absoluteDelta: Number(absDelta.toFixed(2)),
      percentageError: Number(percentError.toFixed(1)),
      accuracyTier,
      feedbackSummary,
    };
  }

  /**
   * Compares two experiment runs to analyze variable changes and isolate causal effects.
   */
  public static compareRuns(
    baselineRun: ExperimentRun,
    comparisonRun: ExperimentRun,
    experiment: ExperimentDefinition
  ): WhatIfComparison {
    const changedParams: WhatIfComparison['changedParameters'] = [];
    const resultDeltas: WhatIfComparison['resultDeltas'] = [];

    // Analyze independent parameter changes
    for (const v of experiment.independentVariables) {
      const bVal = baselineRun.parameters[v.symbol] ?? v.defaultValue;
      const cVal = comparisonRun.parameters[v.symbol] ?? v.defaultValue;
      const delta = cVal - bVal;
      if (Math.abs(delta) > 0.001) {
        const percentChange = bVal !== 0 ? (delta / Math.abs(bVal)) * 100 : 0;
        changedParams.push({
          symbol: v.symbol,
          name: v.name,
          unit: v.unit,
          baseline: Number(bVal.toFixed(2)),
          comparison: Number(cVal.toFixed(2)),
          delta: Number(delta.toFixed(2)),
          percentChange: Number(percentChange.toFixed(1)),
        });
      }
    }

    // Analyze dependent result deltas
    for (const o of experiment.dependentVariables) {
      const bRes = baselineRun.results[o.symbol] ?? 0;
      const cRes = comparisonRun.results[o.symbol] ?? 0;
      const delta = cRes - bRes;
      const percentChange = bRes !== 0 ? (delta / Math.abs(bRes)) * 100 : 0;
      resultDeltas.push({
        symbol: o.symbol,
        name: o.name,
        unit: o.unit,
        baseline: Number(bRes.toFixed(2)),
        comparison: Number(cRes.toFixed(2)),
        delta: Number(delta.toFixed(2)),
        percentChange: Number(percentChange.toFixed(1)),
      });
    }

    const isSingleVariableControlled = changedParams.length === 1;

    let scientificValidityNote = '';
    if (isSingleVariableControlled) {
      scientificValidityNote = `Controlled Variable Principle Verified: Exactly one independent parameter (${changedParams[0].name}) was altered while all other parameters remained invariant. Causal relationship is scientifically valid.`;
    } else if (changedParams.length > 1) {
      scientificValidityNote = `Multi-Variable Confounding Notice: ${changedParams.length} parameters changed simultaneously (${changedParams.map((p) => p.name).join(', ')}). Observable changes in results are composite effects and cannot be isolated to a single variable alone.`;
    } else {
      scientificValidityNote = 'Identical Configurations: No parameters were modified between Run ' + baselineRun.runNumber + ' and Run ' + comparisonRun.runNumber + '.';
    }

    const explanation = this.generateRuleBasedExplanation(
      experiment,
      changedParams,
      resultDeltas,
      isSingleVariableControlled
    );

    return {
      baselineRun,
      comparisonRun,
      changedParameters: changedParams,
      resultDeltas,
      isSingleVariableControlled,
      scientificValidityNote,
      explanation,
    };
  }

  /**
   * Generates deterministic, scientifically rigorous explanation of what caused the observed outcome.
   */
  public static generateRuleBasedExplanation(
    experiment: ExperimentDefinition,
    changedParams: WhatIfComparison['changedParameters'],
    resultDeltas: WhatIfComparison['resultDeltas'],
    isSingleVariableControlled: boolean
  ): string {
    if (changedParams.length === 0) {
      return 'The parameter configuration was unchanged, resulting in identical simulation outputs.';
    }

    if (experiment.id === 'exp_projectile_motion') {
      const angleChange = changedParams.find((p) => p.symbol === 'angle');
      const speedChange = changedParams.find((p) => p.symbol === 'speed');
      const gChange = changedParams.find((p) => p.symbol === 'gravity');

      if (isSingleVariableControlled && angleChange) {
        const fromAngle = angleChange.baseline;
        const toAngle = angleChange.comparison;
        const rangeDelta = resultDeltas.find((r) => r.symbol === 'range')?.delta ?? 0;
        const timeDelta = resultDeltas.find((r) => r.symbol === 'flightTime')?.delta ?? 0;

        if (toAngle === 45) {
          return `Shifting the launch angle to 45° maximizes the product 2·cos(θ)·sin(θ) = sin(2θ) = 1.0, delivering the theoretical maximum horizontal range under constant launch speed (${rangeDelta > 0 ? `+${rangeDelta} m increase` : `${rangeDelta} m`}).`;
        }
        if (toAngle > fromAngle) {
          return `Increasing the launch angle from ${fromAngle}° to ${toAngle}° redirected more initial velocity into the vertical vector (v_y = v₀·sin θ). This increased flight time (${timeDelta > 0 ? `+${timeDelta}s` : `${timeDelta}s`}), while the horizontal range shifted by ${rangeDelta} m according to R = (v₀²·sin 2θ)/g.`;
        } else {
          return `Decreasing the launch angle from ${fromAngle}° to ${toAngle}° flattened the trajectory. Vertical flight time reduced (${timeDelta}s), while horizontal range adjusted by ${rangeDelta} m.`;
        }
      }

      if (isSingleVariableControlled && speedChange) {
        return `Initial launch speed v₀ increased from ${speedChange.baseline} m/s to ${speedChange.comparison} m/s. Because horizontal range scales quadratically with speed (R ∝ v₀²), doubling the speed quadruples the reach.`;
      }

      if (isSingleVariableControlled && gChange) {
        return `Gravitational acceleration changed from ${gChange.baseline} to ${gChange.comparison} m/s². Because both height and range are inversely proportional to gravity (1/g), stronger gravity pulls the projectile down earlier, reducing flight time and range.`;
      }
    }

    if (experiment.id === 'exp_harmonic_pendulum') {
      const lengthChange = changedParams.find((p) => p.symbol === 'length');
      const gChange = changedParams.find((p) => p.symbol === 'gravity');

      if (isSingleVariableControlled && lengthChange) {
        return `Pendulum length changed from ${lengthChange.baseline}m to ${lengthChange.comparison}m. By Galileo's law T = 2π√(L/g), period depends on the square root of string length (√L). Quadrupling string length doubles the oscillation period.`;
      }
      if (isSingleVariableControlled && gChange) {
        return `Gravitational acceleration g changed from ${gChange.baseline} to ${gChange.comparison} m/s². Greater gravitational acceleration produces a stronger restoring torque, speeding up oscillation cycles (decreasing period T).`;
      }
    }

    if (experiment.id === 'exp_newton_second_law') {
      const forceChange = changedParams.find((p) => p.symbol === 'force');
      const massChange = changedParams.find((p) => p.symbol === 'mass');

      if (isSingleVariableControlled && forceChange) {
        return `Applied net force changed from ${forceChange.baseline} N to ${forceChange.comparison} N under constant mass. By Newton's second law a = F/m, acceleration is directly proportional to applied force (a ∝ F).`;
      }
      if (isSingleVariableControlled && massChange) {
        return `Inertial mass changed from ${massChange.baseline} kg to ${massChange.comparison} kg under constant force. By Newton's second law a = F/m, acceleration is inversely proportional to mass (a ∝ 1/m). Greater mass resists acceleration.`;
      }
    }

    // Generic multi-variable breakdown
    return `Multiple parameters changed simultaneously (${changedParams.map((p) => `${p.name} Δ=${p.delta} ${p.unit}`).join(', ')}). The observed change in results reflects composite interactions across the governing formulas. To isolate causal sensitivity, keep all variables constant except one.`;
  }
}

