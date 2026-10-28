/**
 * VisiOS — Experiment Lab Type Definitions
 * Step 1: Model for student predictions, controlled variables, deterministic execution,
 * what-if comparisons, and evidence-based pedagogical explanations.
 */

export type ExperimentSimulationType = 'projectile' | 'pendulum' | 'vector_force';

export interface ExperimentVariable {
  symbol: string;
  name: string;
  unit: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description: string;
}

export interface ExperimentOutput {
  symbol: string;
  name: string;
  unit: string;
  description: string;
  isKeyPredictableOutput?: boolean;
}

export interface ExperimentPreset {
  name: string;
  description: string;
  params: Record<string, number>;
}

export interface ExperimentReflectionQuestion {
  id: string;
  question: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string;
}

export interface ExperimentDefinition {
  id: string;
  topic: string;
  title: string;
  learningObjective: string;
  investigationQuestion: string;
  simulationType: ExperimentSimulationType;
  independentVariables: ExperimentVariable[];
  dependentVariables: ExperimentOutput[];
  assumptions: string[];
  limitations: string[];
  presets: ExperimentPreset[];
  reflectionQuestions: ExperimentReflectionQuestion[];
}

export interface StudentPrediction {
  outputSymbol: string;
  predictedValue: number;
  reasoning: string;
  recordedAt: number;
}

export interface PredictionEvaluation {
  prediction: StudentPrediction;
  actualValue: number;
  unit: string;
  absoluteDelta: number;
  percentageError: number;
  accuracyTier: 'accurate' | 'close' | 'divergent';
  feedbackSummary: string;
}

export interface ExperimentRun {
  runId: string;
  runNumber: number;
  parameters: Record<string, number>;
  results: Record<string, number>;
  formattedResults: Record<string, string>;
  predictionEvaluation?: PredictionEvaluation;
  timestamp: number;
}

export interface WhatIfComparison {
  baselineRun: ExperimentRun;
  comparisonRun: ExperimentRun;
  changedParameters: Array<{
    symbol: string;
    name: string;
    unit: string;
    baseline: number;
    comparison: number;
    delta: number;
    percentChange: number;
  }>;
  resultDeltas: Array<{
    symbol: string;
    name: string;
    unit: string;
    baseline: number;
    comparison: number;
    delta: number;
    percentChange: number;
  }>;
  isSingleVariableControlled: boolean;
  scientificValidityNote: string;
  explanation: string;
}

export interface ExperimentSessionState {
  experimentId: string;
  currentParameters: Record<string, number>;
  activePrediction: StudentPrediction | null;
  runs: ExperimentRun[];
  activeComparison: WhatIfComparison | null;
  reflectionAnswer?: {
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  };
  isCompleted: boolean;
}

