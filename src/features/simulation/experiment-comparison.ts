import { ExperimentCheckpoint, CheckpointComparison, MetricDiff } from '@/types/session';

/**
 * Compares two or more experiment checkpoints and computes parameter & metric deltas.
 */
export function compareCheckpoints(checkpoints: ExperimentCheckpoint[]): CheckpointComparison {
  if (!checkpoints || checkpoints.length === 0) {
    return {
      checkpoints: [],
      parameterDiffs: [],
      metricDiffs: [],
      observations: ['No checkpoints selected for comparison.'],
    };
  }

  const base = checkpoints[0];

  // 1. Gather all unique parameter keys
  const paramKeys = Array.from(
    new Set(checkpoints.flatMap((cp) => Object.keys(cp.parameters || {})))
  );

  const parameterDiffs: MetricDiff[] = paramKeys.map((key) => {
    const label = base.definitions?.[key]?.label || key;
    const unit = base.definitions?.[key]?.unit || '';
    const values = checkpoints.map((cp) => cp.parameters?.[key] ?? null);
    const baseVal = values[0];

    // Verify all checkpoints share compatible definitions/units
    const isComparable = checkpoints.every((cp) => {
      const u = cp.definitions?.[key]?.unit;
      return u === undefined || u === unit;
    });

    const differences = values.map((val) => {
      if (val === null || baseVal === null || !isComparable) return null;
      return Number((val - baseVal).toFixed(4));
    });

    const percentChanges = values.map((val) => {
      if (val === null || baseVal === null || baseVal === 0 || !isComparable) return null;
      return Number((((val - baseVal) / Math.abs(baseVal)) * 100).toFixed(1));
    });

    return {
      key,
      label,
      unit,
      values,
      differences,
      percentChanges,
      isComparable,
    };
  });

  // 2. Gather all unique metric keys
  const metricKeys = Array.from(
    new Set(checkpoints.flatMap((cp) => Object.keys(cp.metrics || {})))
  );

  const metricDiffs: MetricDiff[] = metricKeys.map((key) => {
    const label = base.definitions?.[key]?.label || key;
    const unit = base.definitions?.[key]?.unit || '';
    const values = checkpoints.map((cp) => cp.metrics?.[key] ?? null);
    const baseVal = values[0];

    const isComparable = checkpoints.every((cp) => {
      const u = cp.definitions?.[key]?.unit;
      return u === undefined || u === unit;
    });

    const differences = values.map((val) => {
      if (val === null || baseVal === null || !isComparable) return null;
      return Number((val - baseVal).toFixed(4));
    });

    const percentChanges = values.map((val) => {
      if (val === null || baseVal === null || baseVal === 0 || !isComparable) return null;
      return Number((((val - baseVal) / Math.abs(baseVal)) * 100).toFixed(1));
    });

    return {
      key,
      label,
      unit,
      values,
      differences,
      percentChanges,
      isComparable,
    };
  });

  // 3. Generate empirical observations
  const observations: string[] = [];
  if (checkpoints.length > 1) {
    for (let i = 1; i < checkpoints.length; i++) {
      const target = checkpoints[i];
      const g0 = base.parameters?.gravity;
      const g1 = target.parameters?.gravity;
      const L0 = base.parameters?.length;
      const L1 = target.parameters?.length;
      const T0 = base.metrics?.period;
      const T1 = target.metrics?.period;

      if (L0 !== undefined && L1 !== undefined && L0 !== L1 && T0 && T1) {
        const lRatio = L1 / L0;
        const tRatio = T1 / T0;
        observations.push(
          `Comparison [${base.name} → ${target.name}]: Length changed by ${(
            (lRatio - 1) *
            100
          ).toFixed(1)}% (from ${L0}m to ${L1}m). Measured period changed by ${(
            (tRatio - 1) *
            100
          ).toFixed(1)}% (from ${T0.toFixed(2)}s to ${T1.toFixed(2)}s).`
        );
      }

      if (g0 !== undefined && g1 !== undefined && g0 !== g1 && T0 && T1) {
        observations.push(
          `Comparison [${base.name} → ${target.name}]: Gravity changed from ${g0.toFixed(
            2
          )} m/s² to ${g1.toFixed(2)} m/s². The oscillation period shifted from ${T0.toFixed(
            2
          )}s to ${T1.toFixed(2)}s due to altered restoring acceleration.`
        );
      }

      if (target.notes) {
        observations.push(`Note for [${target.name}]: ${target.notes}`);
      }
    }
  }

  if (observations.length === 0 && checkpoints.length > 1) {
    observations.push('Parameters and metrics are identical across selected checkpoints.');
  }

  return {
    checkpoints,
    parameterDiffs,
    metricDiffs,
    observations,
  };
}

