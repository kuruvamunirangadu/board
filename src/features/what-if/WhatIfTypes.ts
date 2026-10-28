/**
 * VisiOS — What-If Scenario Engine Type Definitions
 * Step 4: Models baseline vs alternative scenarios, parameter modifications,
 * deterministic execution, delta comparisons, and evidence-grounded pedagogical explanations.
 */

export type ScenarioRole = 'baseline' | 'alternative';

export type ScenarioStatus = 'draft' | 'configured' | 'executed' | 'error';

export interface ScenarioParamValue {
  symbol: string;
  name: string;
  value: number;
  unit: string;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  role: ScenarioRole;
  experimentId: string;
  parameters: Record<string, number>;
  createdAt: number;
  updatedAt: number;
}

export interface TrajectoryPoint {
  x: number;
  y: number;
}

export interface OscillationPoint {
  t: number;
  theta: number;
}

export interface MotionPoint {
  t: number;
  position: number;
  velocity: number;
}

export interface ScenarioVisualData {
  trajectoryPoints?: TrajectoryPoint[];
  oscillationPoints?: OscillationPoint[];
  motionPoints?: MotionPoint[];
}

export interface ScenarioResult {
  scenarioId: string;
  experimentId: string;
  parameters: Record<string, number>;
  metrics: Record<string, number>;
  formattedMetrics: Record<string, string>;
  units: Record<string, string>;
  visualData?: ScenarioVisualData;
  assumptions: string[];
  limitations: string[];
  executedAt: number;
  status: ScenarioStatus;
  errorMessage?: string;
}

export type PredictionDirection = 'increase' | 'decrease' | 'no_change';

export interface ScenarioPrediction {
  metricSymbol: string;
  expectedDirection: PredictionDirection;
  reasoning?: string;
  recordedAt: number;
}

export interface MetricComparisonDelta {
  symbol: string;
  name: string;
  unit: string;
  baselineValue: number;
  alternativeValue: number;
  absoluteDelta: number;
  percentChange: number | null; // null if baselineValue === 0
  percentChangeFormatted: string;
  direction: 'increase' | 'decrease' | 'no_change';
  isAvailable: boolean;
}

export interface ChangedParameterDelta {
  symbol: string;
  name: string;
  unit: string;
  baseline: number;
  alternative: number;
  delta: number;
  percentChange: number | null;
}

export interface PredictionEvaluation {
  prediction: ScenarioPrediction;
  actualDelta: number;
  actualDirection: PredictionDirection;
  isMatched: boolean;
  accuracyTier: 'matched' | 'divergent';
  feedbackSummary: string;
}

export interface ScenarioComparisonReport {
  comparisonId: string;
  experimentId: string;
  baselineScenario: ScenarioConfig;
  baselineResult: ScenarioResult;
  alternativeScenario: ScenarioConfig;
  alternativeResult: ScenarioResult;
  changedParameters: ChangedParameterDelta[];
  metricDeltas: MetricComparisonDelta[];
  isSingleVariableControlled: boolean;
  scientificValidityNote: string;
  deterministicExplanation: string;
  predictionEvaluation?: PredictionEvaluation;
  modelAssumptions: string[];
  modelLimitations: string[];
  comparedAt: number;
}

export interface WhatIfSessionState {
  experimentId: string;
  baseline: ScenarioConfig;
  baselineResult: ScenarioResult | null;
  alternatives: ScenarioConfig[];
  alternativeResults: Record<string, ScenarioResult>;
  activeAlternativeId: string;
  predictions: Record<string, ScenarioPrediction>;
  activeComparison: ScenarioComparisonReport | null;
  viewMode: 'side_by_side' | 'overlay' | 'metrics_table';
  isCompleted: boolean;
}

