/**
 * VisiOS — What-If Scenario Execution & Comparison Service
 * Step 4: Executes baseline and alternative scenarios through existing deterministic physics engines,
 * computes exact deltas, evaluates student predictions, and provides verified causal explanations.
 */

import {
  ScenarioConfig,
  ScenarioResult,
  ScenarioPrediction,
  ScenarioComparisonReport,
  MetricComparisonDelta,
  ChangedParameterDelta,
  PredictionEvaluation,
  TrajectoryPoint,
  OscillationPoint,
  MotionPoint,
} from './WhatIfTypes';
import {
  EXPERIMENT_CATALOGUE,
  ExperimentCatalogueService,
} from '@/features/experiment/ExperimentCatalogue';
import { ExperimentDefinition } from '@/features/experiment/ExperimentTypes';

export class WhatIfExecutionService {
  /**
   * Creates a fresh baseline scenario configuration.
   */
  public static createDefaultBaseline(experimentId: string): ScenarioConfig {
    const exp = ExperimentCatalogueService.getById(experimentId) || EXPERIMENT_CATALOGUE[0];
    const initialParams: Record<string, number> = {};
    for (const v of exp.independentVariables) {
      initialParams[v.symbol] = v.defaultValue;
    }

    const now = Date.now();
    return {
      id: `baseline-${exp.id}-${now}`,
      name: `Baseline (${exp.title})`,
      role: 'baseline',
      experimentId: exp.id,
      parameters: { ...initialParams },
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Clones a baseline into an independent, mutable alternative scenario.
   * Guarantees deep isolation: editing the alternative will NEVER mutate the baseline.
   */
  public static cloneAsAlternative(
    baseline: ScenarioConfig,
    alternativeName?: string
  ): ScenarioConfig {
    const now = Date.now();
    return {
      id: `alt-${baseline.experimentId}-${now}-${Math.random().toString(36).substring(2, 7)}`,
      name: alternativeName || `What-If Alternative`,
      role: 'alternative',
      experimentId: baseline.experimentId,
      parameters: { ...baseline.parameters }, // Independent clone
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Executes a scenario through the appropriate deterministic engine.
   */
  public static executeScenario(scenario: ScenarioConfig): ScenarioResult {
    const exp = ExperimentCatalogueService.getById(scenario.experimentId);
    if (!exp) {
      return {
        scenarioId: scenario.id,
        experimentId: scenario.experimentId,
        parameters: { ...scenario.parameters },
        metrics: {},
        formattedMetrics: {},
        units: {},
        assumptions: [],
        limitations: [],
        executedAt: Date.now(),
        status: 'error',
        errorMessage: `Unknown experiment ID: ${scenario.experimentId}`,
      };
    }

    switch (scenario.experimentId) {
      case 'exp_projectile_motion':
        return this.executeProjectile(scenario, exp);
      case 'exp_harmonic_pendulum':
        return this.executePendulum(scenario, exp);
      case 'exp_newton_second_law':
        return this.executeForceCart(scenario, exp);
      default:
        return {
          scenarioId: scenario.id,
          experimentId: scenario.experimentId,
          parameters: { ...scenario.parameters },
          metrics: {},
          formattedMetrics: {},
          units: {},
          assumptions: exp.assumptions,
          limitations: exp.limitations,
          executedAt: Date.now(),
          status: 'error',
          errorMessage: `No deterministic execution adapter found for ${scenario.experimentId}`,
        };
    }
  }

  /**
   * 1. Projectile Motion Deterministic Execution & Trajectory Generation
   */
  private static executeProjectile(
    scenario: ScenarioConfig,
    exp: ExperimentDefinition
  ): ScenarioResult {
    const speed = Math.max(0.1, scenario.parameters.speed ?? 20); // m/s
    const angleDeg = Math.min(89.9, Math.max(0.1, scenario.parameters.angle ?? 45)); // deg
    const g = Math.max(0.1, scenario.parameters.gravity ?? 9.81); // m/s²

    const angleRad = (angleDeg * Math.PI) / 180;
    const vx0 = speed * Math.cos(angleRad);
    const vy0 = speed * Math.sin(angleRad);

    const flightTime = Number(((2 * vy0) / g).toFixed(2));
    const maxHeight = Number(((vy0 * vy0) / (2 * g)).toFixed(2));
    const range = Number(((speed * speed * Math.sin(2 * angleRad)) / g).toFixed(2));

    // Generate 50 discrete trajectory points for visualization overlay
    const trajectoryPoints: TrajectoryPoint[] = [];
    const sampleCount = 50;
    for (let i = 0; i <= sampleCount; i++) {
      const t = (flightTime * i) / sampleCount;
      const x = Number((vx0 * t).toFixed(2));
      const y = Math.max(0, Number((vy0 * t - 0.5 * g * t * t).toFixed(2)));
      trajectoryPoints.push({ x, y });
    }

    const metrics: Record<string, number> = {
      range,
      maxHeight,
      flightTime,
      vx0: Number(vx0.toFixed(2)),
      vy0: Number(vy0.toFixed(2)),
    };

    const formattedMetrics: Record<string, string> = {
      range: `${range} m`,
      maxHeight: `${maxHeight} m`,
      flightTime: `${flightTime} s`,
      vx0: `${vx0.toFixed(2)} m/s`,
      vy0: `${vy0.toFixed(2)} m/s`,
    };

    const units: Record<string, string> = {
      range: 'm',
      maxHeight: 'm',
      flightTime: 's',
      vx0: 'm/s',
      vy0: 'm/s',
    };

    return {
      scenarioId: scenario.id,
      experimentId: scenario.experimentId,
      parameters: { ...scenario.parameters },
      metrics,
      formattedMetrics,
      units,
      visualData: { trajectoryPoints },
      assumptions: exp.assumptions,
      limitations: exp.limitations,
      executedAt: Date.now(),
      status: 'executed',
    };
  }

  /**
   * 2. Harmonic Pendulum Deterministic Execution & Oscillation Points
   */
  private static executePendulum(
    scenario: ScenarioConfig,
    exp: ExperimentDefinition
  ): ScenarioResult {
    const L = Math.max(0.1, scenario.parameters.length ?? 1.0); // m
    const g = Math.max(0.1, scenario.parameters.gravity ?? 9.81); // m/s²
    const angleDeg = Math.max(1, Math.min(80, scenario.parameters.initialAngle ?? 15)); // deg

    const angleRad = (angleDeg * Math.PI) / 180;
    // Galilean small-angle theoretical period
    const period = Number((2 * Math.PI * Math.sqrt(L / g)).toFixed(2));
    const frequency = Number((1 / period).toFixed(2));
    const vMax = Number((Math.sqrt(2 * g * L * (1 - Math.cos(angleRad)))).toFixed(2));

    // Generate oscillation wave points for 2 full cycles
    const oscillationPoints: OscillationPoint[] = [];
    const totalDuration = period * 2;
    const samples = 60;
    for (let i = 0; i <= samples; i++) {
      const t = (totalDuration * i) / samples;
      const omega = (2 * Math.PI) / period;
      const theta = Number((angleDeg * Math.cos(omega * t)).toFixed(2));
      oscillationPoints.push({ t: Number(t.toFixed(2)), theta });
    }

    const metrics: Record<string, number> = {
      period,
      frequency,
      vMax,
    };

    const formattedMetrics: Record<string, string> = {
      period: `${period} s`,
      frequency: `${frequency} Hz`,
      vMax: `${vMax} m/s`,
    };

    const units: Record<string, string> = {
      period: 's',
      frequency: 'Hz',
      vMax: 'm/s',
    };

    const assumptions = [...exp.assumptions];
    if (angleDeg > 20) {
      assumptions.push(
        `⚠️ Small-Angle Warning: Initial angle is ${angleDeg}°. Small-angle approximation (sin θ ≈ θ) introduces ~${(
          (angleRad * angleRad) /
          16 *
          100
        ).toFixed(1)}% error compared to nonlinear elliptic integral.`
      );
    }

    return {
      scenarioId: scenario.id,
      experimentId: scenario.experimentId,
      parameters: { ...scenario.parameters },
      metrics,
      formattedMetrics,
      units,
      visualData: { oscillationPoints },
      assumptions,
      limitations: exp.limitations,
      executedAt: Date.now(),
      status: 'executed',
    };
  }

  /**
   * 3. Newton's 2nd Law Force Cart Deterministic Execution
   */
  private static executeForceCart(
    scenario: ScenarioConfig,
    exp: ExperimentDefinition
  ): ScenarioResult {
    const force = Math.max(0, scenario.parameters.force ?? 20); // N
    const mass = Math.max(0.1, scenario.parameters.mass ?? 4); // kg

    const acceleration = Number((force / mass).toFixed(2));
    const velocityAt2s = Number((acceleration * 2).toFixed(2));
    const distanceAt2s = Number((2 * acceleration).toFixed(2));

    // Generate 40 motion points over t = 0 to 4s
    const motionPoints: MotionPoint[] = [];
    for (let i = 0; i <= 40; i++) {
      const t = i / 10;
      const pos = Number((0.5 * acceleration * t * t).toFixed(2));
      const vel = Number((acceleration * t).toFixed(2));
      motionPoints.push({ t, position: pos, velocity: vel });
    }

    const metrics: Record<string, number> = {
      acceleration,
      velocityAt2s,
      distanceAt2s,
    };

    const formattedMetrics: Record<string, string> = {
      acceleration: `${acceleration} m/s²`,
      velocityAt2s: `${velocityAt2s} m/s`,
      distanceAt2s: `${distanceAt2s} m`,
    };

    const units: Record<string, string> = {
      acceleration: 'm/s²',
      velocityAt2s: 'm/s',
      distanceAt2s: 'm',
    };

    return {
      scenarioId: scenario.id,
      experimentId: scenario.experimentId,
      parameters: { ...scenario.parameters },
      metrics,
      formattedMetrics,
      units,
      visualData: { motionPoints },
      assumptions: exp.assumptions,
      limitations: exp.limitations,
      executedAt: Date.now(),
      status: 'executed',
    };
  }

  /**
   * Compares a baseline result against an alternative result.
   * Calculates absolute deltas, percentage changes, prediction evaluation, and causal explanations.
   */
  public static compareScenarios(
    baselineScenario: ScenarioConfig,
    baselineResult: ScenarioResult,
    alternativeScenario: ScenarioConfig,
    alternativeResult: ScenarioResult,
    prediction?: ScenarioPrediction
  ): ScenarioComparisonReport {
    const exp = ExperimentCatalogueService.getById(baselineScenario.experimentId)!;

    // 1. Calculate independent parameter deltas
    const changedParameters: ChangedParameterDelta[] = [];
    for (const v of exp.independentVariables) {
      const bVal = baselineScenario.parameters[v.symbol] ?? v.defaultValue;
      const aVal = alternativeScenario.parameters[v.symbol] ?? v.defaultValue;
      const delta = Number((aVal - bVal).toFixed(2));

      if (Math.abs(delta) > 0.001) {
        const percentChange =
          bVal !== 0 ? Number((((aVal - bVal) / Math.abs(bVal)) * 100).toFixed(1)) : null;

        changedParameters.push({
          symbol: v.symbol,
          name: v.name,
          unit: v.unit,
          baseline: bVal,
          alternative: aVal,
          delta,
          percentChange,
        });
      }
    }

    // 2. Calculate dependent metric deltas
    const metricDeltas: MetricComparisonDelta[] = [];
    for (const dep of exp.dependentVariables) {
      const bVal = baselineResult.metrics[dep.symbol];
      const aVal = alternativeResult.metrics[dep.symbol];

      if (bVal !== undefined && aVal !== undefined) {
        const delta = Number((aVal - bVal).toFixed(2));
        let percentChange: number | null = null;
        let percentChangeFormatted: string;

        if (bVal === 0) {
          // Zero baseline division guard
          percentChange = null;
          percentChangeFormatted = 'N/A (base is 0)';
        } else {
          percentChange = Number((((aVal - bVal) / Math.abs(bVal)) * 100).toFixed(1));
          percentChangeFormatted = `${percentChange > 0 ? '+' : ''}${percentChange}%`;
        }

        const direction =
          delta > 0.001 ? 'increase' : delta < -0.001 ? 'decrease' : 'no_change';

        metricDeltas.push({
          symbol: dep.symbol,
          name: dep.name,
          unit: dep.unit,
          baselineValue: bVal,
          alternativeValue: aVal,
          absoluteDelta: delta,
          percentChange,
          percentChangeFormatted,
          direction,
          isAvailable: true,
        });
      } else {
        metricDeltas.push({
          symbol: dep.symbol,
          name: dep.name,
          unit: dep.unit,
          baselineValue: bVal ?? 0,
          alternativeValue: aVal ?? 0,
          absoluteDelta: 0,
          percentChange: null,
          percentChangeFormatted: 'Unavailable',
          direction: 'no_change',
          isAvailable: false,
        });
      }
    }

    // 3. Evaluate Single-Variable Controlled Principle
    const isSingleVariableControlled = changedParameters.length === 1;
    let scientificValidityNote: string;
    if (isSingleVariableControlled) {
      scientificValidityNote = `✓ Controlled Variable Principle Validated: Exactly one variable (${changedParameters[0].name}) was changed while holding all other parameters constant. The observed delta is directly causal.`;
    } else if (changedParameters.length > 1) {
      scientificValidityNote = `⚠️ Multi-Variable Confounding Alert: ${changedParameters.length} parameters were modified simultaneously (${changedParameters.map((p) => p.name).join(', ')}). The observed outcome reflects composite interactions and cannot be isolated to a single variable alone.`;
    } else {
      scientificValidityNote = 'Identical Configurations: Baseline and Alternative parameters are identical; no deltas produced.';
    }

    // 4. Generate Deterministic Causal Explanation
    const deterministicExplanation = this.generateCausalExplanation(
      exp,
      changedParameters,
      metricDeltas,
      isSingleVariableControlled
    );

    // 5. Evaluate Prediction (if provided)
    let predictionEvaluation: PredictionEvaluation | undefined;
    if (prediction) {
      const targetDelta = metricDeltas.find((m) => m.symbol === prediction.metricSymbol);
      if (targetDelta) {
        const isMatched = targetDelta.direction === prediction.expectedDirection;
        let feedback: string;

        if (isMatched) {
          feedback = `🎉 Outstanding prediction! You predicted that ${targetDelta.name} would ${prediction.expectedDirection}, and it indeed ${prediction.expectedDirection}d by ${targetDelta.absoluteDelta > 0 ? '+' : ''}${targetDelta.absoluteDelta} ${targetDelta.unit} (${targetDelta.percentChangeFormatted}).`;
        } else {
          feedback = `💡 Prediction check: You predicted that ${targetDelta.name} would ${prediction.expectedDirection}, but the deterministic simulation revealed it actually ${targetDelta.direction}d by ${targetDelta.absoluteDelta > 0 ? '+' : ''}${targetDelta.absoluteDelta} ${targetDelta.unit}. Let's examine the mathematical derivation below.`;
        }

        predictionEvaluation = {
          prediction,
          actualDelta: targetDelta.absoluteDelta,
          actualDirection: targetDelta.direction,
          isMatched,
          accuracyTier: isMatched ? 'matched' : 'divergent',
          feedbackSummary: feedback,
        };
      }
    }

    return {
      comparisonId: `cmp-${Date.now()}`,
      experimentId: exp.id,
      baselineScenario,
      baselineResult,
      alternativeScenario,
      alternativeResult,
      changedParameters,
      metricDeltas,
      isSingleVariableControlled,
      scientificValidityNote,
      deterministicExplanation,
      predictionEvaluation,
      modelAssumptions: alternativeResult.assumptions,
      modelLimitations: exp.limitations,
      comparedAt: Date.now(),
    };
  }

  /**
   * Deterministic, physics-governed causal explanation generator.
   */
  private static generateCausalExplanation(
    exp: ExperimentDefinition,
    changedParams: ChangedParameterDelta[],
    metricDeltas: MetricComparisonDelta[],
    isSingleControlled: boolean
  ): string {
    if (changedParams.length === 0) {
      return 'No parameter variations detected between Baseline and Alternative configurations.';
    }

    if (exp.id === 'exp_projectile_motion') {
      const angleP = changedParams.find((p) => p.symbol === 'angle');
      const speedP = changedParams.find((p) => p.symbol === 'speed');
      const gravP = changedParams.find((p) => p.symbol === 'gravity');

      if (isSingleControlled && angleP) {
        const rangeDelta = metricDeltas.find((m) => m.symbol === 'range');
        const timeDelta = metricDeltas.find((m) => m.symbol === 'flightTime');

        if (angleP.alternative === 45) {
          return `Launch angle set to 45°: Over flat horizontal terrain, sin(2θ) reaches its mathematical apex of 1.0 at θ = 45°. This produces the maximum theoretical horizontal range under constant velocity (${rangeDelta?.absoluteDelta! > 0 ? `+${rangeDelta?.absoluteDelta} m increase` : `${rangeDelta?.absoluteDelta} m`}).`;
        }
        if (angleP.alternative > angleP.baseline) {
          return `Increasing the launch angle from ${angleP.baseline}° to ${angleP.alternative}° shifted velocity into the vertical vector (v_y = v₀·sin θ). This increased flight duration (${timeDelta?.percentChangeFormatted}) and maximum height, while horizontal range shifted by ${rangeDelta?.absoluteDelta} m following R = (v₀²·sin 2θ)/g.`;
        } else {
          return `Decreasing the launch angle from ${angleP.baseline}° to ${angleP.alternative}° created a flatter, faster horizontal trajectory. Vertical hang-time decreased by ${timeDelta?.absoluteDelta} s, adjusting horizontal distance by ${rangeDelta?.absoluteDelta} m.`;
        }
      }

      if (isSingleControlled && speedP) {
        return `Initial velocity v₀ changed from ${speedP.baseline} m/s to ${speedP.alternative} m/s (${speedP.percentChange! > 0 ? '+' : ''}${speedP.percentChange}%). Because projectile range scales quadratically with speed (R ∝ v₀²), doubling the speed quadruples horizontal reach.`;
      }

      if (isSingleControlled && gravP) {
        return `Gravitational acceleration field changed from ${gravP.baseline} to ${gravP.alternative} m/s². Because both range and height scale inversely with gravity (1/g), lower gravity (e.g. on the Moon) allows projectile paths to extend dramatically.`;
      }
    }

    if (exp.id === 'exp_harmonic_pendulum') {
      const lenP = changedParams.find((p) => p.symbol === 'length');
      const gravP = changedParams.find((p) => p.symbol === 'gravity');

      if (isSingleControlled && lenP) {
        return `Pendulum string length changed from ${lenP.baseline} m to ${lenP.alternative} m. According to Galileo's period law T = 2π√(L/g), period scales with the square root of length (√L). Quadrupling string length exactly doubles the period of oscillation.`;
      }
      if (isSingleControlled && gravP) {
        return `Gravitational acceleration g shifted from ${gravP.baseline} to ${gravP.alternative} m/s². Stronger downward gravity applies a greater restoring torque, accelerating swing speed and shortening oscillation periods.`;
      }
    }

    if (exp.id === 'exp_newton_second_law') {
      const forceP = changedParams.find((p) => p.symbol === 'force');
      const massP = changedParams.find((p) => p.symbol === 'mass');

      if (isSingleControlled && forceP) {
        return `Applied force changed from ${forceP.baseline} N to ${forceP.alternative} N under constant mass. By Newton's second law a = F/m, cart acceleration is directly proportional to net force (a ∝ F).`;
      }
      if (isSingleControlled && massP) {
        return `Inertial mass changed from ${massP.baseline} kg to ${massP.alternative} kg under constant force. By Newton's second law a = F/m, acceleration is inversely proportional to mass (a ∝ 1/m). Doubling the cart mass halves its acceleration.`;
      }
    }

    return `Multiple variables changed simultaneously (${changedParams.map((p) => `${p.name} Δ=${p.delta} ${p.unit}`).join(', ')}). The observed outcomes reflect composite multi-parameter interactions. Isolate variables one at a time to establish direct causal sensitivity.`;
  }
}

