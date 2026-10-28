/**
 * VisiOS — AI Learning Quality Benchmark: Type Definitions
 * Step 2: Defines schemas for evaluation test cases, multi-dimensional metrics,
 * execution results, and machine-readable reports.
 */

import { TopicDomain, TopicIntent, TargetEngine } from '@/features/learning/types';
import { CanonicalRendererType } from '@/features/learning/VisualizationRegistry';

export type BenchmarkEvaluationStatus = 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'SKIPPED';

export type BenchmarkDifficulty = 'fundamental' | 'intermediate' | 'advanced' | 'edge_case';

export type BenchmarkValidationMethod =
  | 'deterministic_only'
  | 'semantic_only'
  | 'hybrid'
  | 'honest_failure_check';

/**
 * Single benchmark test case definition.
 */
export interface BenchmarkTestCase {
  /** Unique stable test identifier */
  id: string;
  /** Schema/dataset version */
  version: string;
  /** Academic discipline domain */
  domain: TopicDomain;
  /** Raw query/topic string submitted by student */
  input: string;
  /** Expected topic intent */
  intent: TopicIntent;
  /** Expected normalized topic name/title keyword */
  expectedTopic: string;
  /** Expected router destination */
  expectedRoute:
    | 'simulation_engine'
    | 'algorithm_engine'
    | 'math_engine'
    | 'wikipedia_and_ai'
    | 'local_ai_synthesizer'
    | 'honest_uncertainty'
    | 'unsupported_input'
    | 'deterministic_stem'
    | 'authored_lesson_library';
  /** Target engine from TopicClassifier */
  expectedEngine: TargetEngine;
  /** Expected visualizer renderer alias or canonical ID */
  expectedRenderer: CanonicalRendererType | 'none';
  /** Key concepts that MUST appear in pedagogical content */
  requiredConcepts: string[];
  /** Misconceptions or fabricated claims that MUST NOT appear */
  forbiddenClaims?: string[];
  /** Expected deterministic properties or output invariants */
  expectedProperties?: {
    /** Expected variable symbols that must be present */
    variables?: string[];
    /** Expected derivation or calculation steps count minimum */
    minSteps?: number;
    /** Whether uncertainty flag is expected to be true */
    isUncertain?: boolean;
    /** Whether clarification options should be offered */
    requiresClarification?: boolean;
    /** Specific deterministic calculation assertion */
    calculationCheck?: {
      type: 'binomial' | 'kinematics' | 'newton_fma' | 'binary_search' | 'pendulum' | 'law_of_cosines' | 'linear_function' | 'fraction_addition' | 'pythagorean';
      inputs: Record<string, any>;
      expectedOutputs: Record<string, number | string | boolean>;
      tolerance?: number;
    };
  };
  /** Expected behavior summary */
  expectedBehavior: string;
  /** Pedagogical difficulty tier */
  difficulty: BenchmarkDifficulty;
  /** Primary evaluation path */
  validationMethod: BenchmarkValidationMethod;
  /** Categorization tags */
  tags: string[];
}

/**
 * Quality evaluation result across individual dimensions for a single test case.
 */
export interface DimensionResult {
  dimension:
    | 'classification'
    | 'routing'
    | 'renderer_compatibility'
    | 'deterministic_correctness'
    | 'concept_coverage'
    | 'relevance'
    | 'grounding_attribution'
    | 'uncertainty_handling'
    | 'reliability';
  status: BenchmarkEvaluationStatus;
  score: number; // 0.0 to 1.0
  expected: string;
  actual: string;
  details?: string;
}

/**
 * Complete benchmark result for a single test case execution.
 */
export interface BenchmarkCaseResult {
  caseId: string;
  input: string;
  domain: TopicDomain;
  overallStatus: BenchmarkEvaluationStatus;
  dimensions: {
    classification: DimensionResult;
    routing: DimensionResult;
    rendererCompatibility: DimensionResult;
    deterministicCorrectness: DimensionResult;
    conceptCoverage: DimensionResult;
    relevance: DimensionResult;
    groundingAttribution: DimensionResult;
    uncertaintyHandling: DimensionResult;
    reliability: DimensionResult;
  };
  executionTimeMs: number;
  routeTaken?: string;
  selectedRenderer?: string;
  isUncertain?: boolean;
  errorDetails?: string | null;
  timestamp: number;
}

/**
 * Statistical metrics across a specific dimension or domain.
 */
export interface BenchmarkMetricsGroup {
  total: number;
  passed: number;
  failed: number;
  inconclusive: number;
  skipped: number;
  passRatePercent: number; // (passed / (total - skipped)) * 100
  averageLatencyMs: number;
}

/**
 * Baseline comparison metrics between current run and prior recorded run.
 */
export interface BenchmarkBaselineComparison {
  baselineTimestamp?: number;
  baselineRunId?: string;
  totalChange: number;
  passRateDeltaPercent: number;
  newRegressions: Array<{
    caseId: string;
    input: string;
    previousStatus: BenchmarkEvaluationStatus;
    currentStatus: BenchmarkEvaluationStatus;
    reason: string;
  }>;
  newFixes: Array<{
    caseId: string;
    input: string;
    previousStatus: BenchmarkEvaluationStatus;
    currentStatus: BenchmarkEvaluationStatus;
  }>;
}

/**
 * Complete machine-readable benchmark report summary.
 */
export interface BenchmarkReport {
  runId: string;
  datasetVersion: string;
  timestamp: number;
  mode: 'quick' | 'full';
  totalCases: number;
  overallSummary: BenchmarkMetricsGroup;
  dimensionMetrics: {
    classification: BenchmarkMetricsGroup;
    routing: BenchmarkMetricsGroup;
    rendererCompatibility: BenchmarkMetricsGroup;
    deterministicCorrectness: BenchmarkMetricsGroup;
    conceptCoverage: BenchmarkMetricsGroup;
    relevance: BenchmarkMetricsGroup;
    groundingAttribution: BenchmarkMetricsGroup;
    uncertaintyHandling: BenchmarkMetricsGroup;
    reliability: BenchmarkMetricsGroup;
    regressionRate: {
      totalCompared: number;
      regressionsCount: number;
      regressionRatePercent: number;
    };
  };
  domainMetrics: Record<string, BenchmarkMetricsGroup>;
  caseResults: BenchmarkCaseResult[];
  baselineComparison?: BenchmarkBaselineComparison;
  environment: {
    nodeVersion: string;
    platform: string;
    isAiConnected: boolean;
    aiProvider: string;
  };
  knownLimitations: string[];
}

/**
 * Configuration options for benchmark execution.
 */
export interface BenchmarkRunnerConfig {
  mode?: 'quick' | 'full';
  enableSemanticAiJudge?: boolean;
  saveReportToFile?: boolean;
  reportDirectory?: string;
  baselineReportPath?: string;
  caseTimeoutMs?: number;
  filterDomain?: TopicDomain;
  filterTag?: string;
}

