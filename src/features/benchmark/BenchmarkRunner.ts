/**
 * VisiOS — AI Learning Quality Benchmark Runner
 * Step 2: Executes benchmark evaluation passes, aggregates dimension and domain metrics,
 * compares against previous baselines, and generates structured reports.
 */

import fs from 'fs';
import path from 'path';
import {
  BenchmarkTestCase,
  BenchmarkCaseResult,
  BenchmarkMetricsGroup,
  BenchmarkReport,
  BenchmarkRunnerConfig,
  BenchmarkBaselineComparison,
  BenchmarkEvaluationStatus,
} from './BenchmarkTypes';
import { LEARNING_QUALITY_BENCHMARK_DATASET, BENCHMARK_DATASET_VERSION } from './BenchmarkDataset';
import { DeterministicEvaluator } from './DeterministicEvaluator';
import { SemanticEvaluator } from './SemanticEvaluator';
import { LearningOrchestrator } from '@/features/learning/LearningOrchestrator';
import { AIModelAdapter } from '@/features/learning/AIModelAdapter';

export class BenchmarkRunner {
  private config: BenchmarkRunnerConfig;

  constructor(config: BenchmarkRunnerConfig = {}) {
    this.config = {
      mode: config.mode || 'full',
      enableSemanticAiJudge: config.enableSemanticAiJudge || false,
      saveReportToFile: config.saveReportToFile ?? true,
      reportDirectory: config.reportDirectory || path.join(process.cwd(), 'benchmark-reports'),
      caseTimeoutMs: config.caseTimeoutMs || 8000,
      ...config,
    };
  }

  /**
   * Filters dataset based on quick mode or user options.
   */
  public selectEligibleCases(): BenchmarkTestCase[] {
    let cases = [...LEARNING_QUALITY_BENCHMARK_DATASET];

    if (this.config.filterDomain) {
      cases = cases.filter((c) => c.domain === this.config.filterDomain);
    }

    if (this.config.filterTag) {
      cases = cases.filter((c) => c.tags.includes(this.config.filterTag!));
    }

    if (this.config.mode === 'quick') {
      // In quick mode, select representative core cases across each domain and failure case
      const quickIds = new Set([
        'math_binomial_square',
        'math_law_of_cosines',
        'math_pythagoras',
        'phys_newton_second_law',
        'phys_projectile_motion',
        'phys_harmonic_pendulum',
        'cs_binary_search',
        'cs_data_structures_general',
        'bio_photosynthesis',
        'hist_alan_turing',
        'fail_empty_input',
        'fail_ambiguous_single_letter_e',
        'fail_incomplete_unrecognized_equation',
      ]);
      cases = cases.filter((c) => quickIds.has(c.id));
    }

    return cases;
  }

  /**
   * Runs the complete benchmark suite.
   */
  public async run(): Promise<BenchmarkReport> {
    const startTime = Date.now();
    const runId = `bench_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const eligibleCases = this.selectEligibleCases();
    const caseResults: BenchmarkCaseResult[] = [];

    // Check environment capabilities
    let isAiConnected = false;
    let aiProvider = 'Deterministic Fallback';
    try {
      const conn = await AIModelAdapter.checkConnection();
      isAiConnected = conn.isConnected;
      aiProvider = conn.provider;
    } catch {
      // AI check failed safely
    }

    // Execute each test case
    for (const testCase of eligibleCases) {
      const caseResult = await this.executeSingleCase(testCase);
      caseResults.push(caseResult);
    }

    // Calculate aggregate metrics
    const overallSummary = BenchmarkRunner.calculateMetricsGroup(caseResults.map((r) => r.overallStatus), caseResults);

    // Calculate individual dimension metrics
    const dimensionMetrics = {
      classification: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.classification.status),
        caseResults
      ),
      routing: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.routing.status),
        caseResults
      ),
      rendererCompatibility: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.rendererCompatibility.status),
        caseResults
      ),
      deterministicCorrectness: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.deterministicCorrectness.status),
        caseResults
      ),
      conceptCoverage: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.conceptCoverage.status),
        caseResults
      ),
      relevance: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.relevance.status),
        caseResults
      ),
      groundingAttribution: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.groundingAttribution.status),
        caseResults
      ),
      uncertaintyHandling: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.uncertaintyHandling.status),
        caseResults
      ),
      reliability: BenchmarkRunner.calculateMetricsGroup(
        caseResults.map((r) => r.dimensions.reliability.status),
        caseResults
      ),
      regressionRate: {
        totalCompared: 0,
        regressionsCount: 0,
        regressionRatePercent: 0,
      },
    };

    // Calculate per-domain metrics
    const domainMetrics: Record<string, BenchmarkMetricsGroup> = {};
    const domainsSet = new Set(caseResults.map((r) => r.domain));
    for (const d of Array.from(domainsSet)) {
      const domainCases = caseResults.filter((r) => r.domain === d);
      domainMetrics[d] = BenchmarkRunner.calculateMetricsGroup(
        domainCases.map((r) => r.overallStatus),
        domainCases
      );
    }

    // Baseline comparison
    let baselineComparison: BenchmarkBaselineComparison | undefined;
    const baselineReport = this.loadPreviousBaseline();
    if (baselineReport) {
      baselineComparison = this.compareWithBaseline(caseResults, baselineReport);
      dimensionMetrics.regressionRate = {
        totalCompared: baselineComparison.totalChange,
        regressionsCount: baselineComparison.newRegressions.length,
        regressionRatePercent:
          baselineComparison.totalChange > 0
            ? Number(
                ((baselineComparison.newRegressions.length / baselineComparison.totalChange) * 100).toFixed(1)
              )
            : 0,
      };
    }

    const report: BenchmarkReport = {
      runId,
      datasetVersion: BENCHMARK_DATASET_VERSION,
      timestamp: startTime,
      mode: this.config.mode || 'full',
      totalCases: eligibleCases.length,
      overallSummary,
      dimensionMetrics,
      domainMetrics,
      caseResults,
      baselineComparison,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        isAiConnected,
        aiProvider,
      },
      knownLimitations: [
        'External Wikipedia knowledge retrieval requires internet connectivity; falls back to local AI / deterministic synthesis when offline.',
        'High-dimensional non-linear physics simulations beyond 1D/2D kinematics use conceptual schematic diagrams.',
        'Semantic AI judge judgments are advisory and recorded independently from deterministic ground truth.',
      ],
    };

    // Persist JSON report if requested
    if (this.config.saveReportToFile && this.config.reportDirectory) {
      try {
        if (!fs.existsSync(this.config.reportDirectory)) {
          fs.mkdirSync(this.config.reportDirectory, { recursive: true });
        }
        const filePath = path.join(this.config.reportDirectory, `${runId}.json`);
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2), 'utf-8');

        // Also save latest.json pointer
        const latestPath = path.join(this.config.reportDirectory, 'latest.json');
        fs.writeFileSync(latestPath, JSON.stringify(report, null, 2), 'utf-8');
      } catch (err) {
        console.warn('Warning: Could not save benchmark report to disk:', err);
      }
    }

    return report;
  }

  /**
   * Executes and evaluates a single test case against actual VisiOS pipelines.
   */
  public async executeSingleCase(testCase: BenchmarkTestCase): Promise<BenchmarkCaseResult> {
    const startCase = Date.now();
    let orchestrationResult: any = null;
    let errorDetails: string | null = null;

    try {
      orchestrationResult = await LearningOrchestrator.processTopic(testCase.input);
    } catch (err: any) {
      errorDetails = err?.message || 'Unhandled orchestration error';
    }

    const elapsedMs = Date.now() - startCase;

    if (!orchestrationResult) {
      const failDim = (name: any) => ({
        dimension: name,
        status: 'FAIL' as BenchmarkEvaluationStatus,
        score: 0.0,
        expected: 'Valid result',
        actual: 'Execution crashed',
        details: errorDetails || undefined,
      });

      return {
        caseId: testCase.id,
        input: testCase.input,
        domain: testCase.domain,
        overallStatus: 'FAIL',
        dimensions: {
          classification: failDim('classification'),
          routing: failDim('routing'),
          rendererCompatibility: failDim('renderer_compatibility'),
          deterministicCorrectness: failDim('deterministic_correctness'),
          conceptCoverage: failDim('concept_coverage'),
          relevance: failDim('relevance'),
          groundingAttribution: failDim('grounding_attribution'),
          uncertaintyHandling: failDim('uncertainty_handling'),
          reliability: failDim('reliability'),
        },
        executionTimeMs: elapsedMs,
        errorDetails,
        timestamp: Date.now(),
      };
    }

    // Evaluate all 9 individual quality dimensions
    const classification = DeterministicEvaluator.evaluateClassification(testCase, orchestrationResult);
    const routing = DeterministicEvaluator.evaluateRouting(testCase, orchestrationResult);
    const rendererCompatibility = DeterministicEvaluator.evaluateRendererCompatibility(
      testCase,
      orchestrationResult
    );
    const deterministicCorrectness = DeterministicEvaluator.evaluateDeterministicCorrectness(
      testCase,
      orchestrationResult
    );
    const uncertaintyHandling = DeterministicEvaluator.evaluateUncertaintyHandling(
      testCase,
      orchestrationResult
    );
    const reliability = DeterministicEvaluator.evaluateReliability(
      testCase,
      orchestrationResult,
      elapsedMs,
      this.config.caseTimeoutMs
    );

    const conceptCoverage = SemanticEvaluator.evaluateConceptCoverage(testCase, orchestrationResult);
    const relevance = SemanticEvaluator.evaluateRelevance(testCase, orchestrationResult);
    const groundingAttribution = SemanticEvaluator.evaluateGroundingAttribution(
      testCase,
      orchestrationResult
    );

    // Compute overall case status:
    // Any FAIL -> overall FAIL. Any INCONCLUSIVE without FAIL -> INCONCLUSIVE. Otherwise -> PASS.
    const allStatuses = [
      classification.status,
      routing.status,
      rendererCompatibility.status,
      deterministicCorrectness.status,
      conceptCoverage.status,
      relevance.status,
      groundingAttribution.status,
      uncertaintyHandling.status,
      reliability.status,
    ];

    let overallStatus: BenchmarkEvaluationStatus = 'PASS';
    if (allStatuses.includes('FAIL')) {
      overallStatus = 'FAIL';
    } else if (allStatuses.includes('INCONCLUSIVE')) {
      overallStatus = 'INCONCLUSIVE';
    }

    return {
      caseId: testCase.id,
      input: testCase.input,
      domain: testCase.domain,
      overallStatus,
      dimensions: {
        classification,
        routing,
        rendererCompatibility,
        deterministicCorrectness,
        conceptCoverage,
        relevance,
        groundingAttribution,
        uncertaintyHandling,
        reliability,
      },
      executionTimeMs: elapsedMs,
      routeTaken: orchestrationResult.routeTaken,
      selectedRenderer: orchestrationResult.plan?.visualizationPlan?.rendererType,
      isUncertain: orchestrationResult.plan?.uncertaintyState?.isUncertain,
      errorDetails,
      timestamp: Date.now(),
    };
  }

  /**
   * Calculates group metrics from an array of evaluation statuses.
   */
  /**
   * Calculates group metrics from an array of evaluation statuses.
   */
  public static calculateMetricsGroup(
    statuses: BenchmarkEvaluationStatus[],
    cases: BenchmarkCaseResult[]
  ): BenchmarkMetricsGroup {
    const total = statuses.length;
    let passed = 0;
    let failed = 0;
    let inconclusive = 0;
    let skipped = 0;

    for (const s of statuses) {
      if (s === 'PASS') passed++;
      else if (s === 'FAIL') failed++;
      else if (s === 'INCONCLUSIVE') inconclusive++;
      else if (s === 'SKIPPED') skipped++;
    }

    const evaluable = total - skipped;
    const passRatePercent = evaluable > 0 ? Number(((passed / evaluable) * 100).toFixed(1)) : 0;
    const totalLatency = cases.reduce((acc, c) => acc + (c.executionTimeMs || 0), 0);
    const averageLatencyMs = total > 0 ? Math.round(totalLatency / total) : 0;

    return {
      total,
      passed,
      failed,
      inconclusive,
      skipped,
      passRatePercent,
      averageLatencyMs,
    };
  }

  /**
   * Loads a previous baseline report if available.
   */
  private loadPreviousBaseline(): BenchmarkReport | null {
    try {
      const explicitPath = this.config.baselineReportPath;
      if (explicitPath && fs.existsSync(explicitPath)) {
        return JSON.parse(fs.readFileSync(explicitPath, 'utf-8'));
      }

      if (this.config.reportDirectory) {
        const latestPath = path.join(this.config.reportDirectory, 'latest.json');
        if (fs.existsSync(latestPath)) {
          return JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
        }
      }
    } catch {
      // Baseline read failed safely
    }
    return null;
  }

  /**
   * Compares current run results against a prior baseline report.
   */
  public static compareWithBaseline(
    current: BenchmarkReport | BenchmarkCaseResult[],
    baseline: BenchmarkReport
  ): BenchmarkBaselineComparison {
    const currentCases = Array.isArray(current) ? current : current.caseResults || [];
    const baselineMap = new Map<string, BenchmarkCaseResult>();
    for (const b of baseline.caseResults || []) {
      baselineMap.set(b.caseId, b);
    }

    const newRegressions: BenchmarkBaselineComparison['newRegressions'] = [];
    const newFixes: BenchmarkBaselineComparison['newFixes'] = [];
    let totalCompared = 0;

    for (const c of currentCases) {
      const prev = baselineMap.get(c.caseId);
      if (!prev) continue;
      totalCompared++;

      if (prev.overallStatus === 'PASS' && c.overallStatus === 'FAIL') {
        newRegressions.push({
          caseId: c.caseId,
          input: c.input,
          previousStatus: prev.overallStatus,
          currentStatus: c.overallStatus,
          reason: c.errorDetails || 'Quality dimension failed after modification',
        });
      } else if (prev.overallStatus === 'FAIL' && c.overallStatus === 'PASS') {
        newFixes.push({
          caseId: c.caseId,
          input: c.input,
          previousStatus: prev.overallStatus,
          currentStatus: c.overallStatus,
        });
      }
    }

    const currentPassRate =
      !Array.isArray(current) && current.overallSummary
        ? current.overallSummary.passRatePercent
        : BenchmarkRunner.calculateMetricsGroup(currentCases.map((c) => c.overallStatus), currentCases).passRatePercent;

    const passRateDeltaPercent = Number(
      (currentPassRate - (baseline.overallSummary?.passRatePercent || 0)).toFixed(1)
    );

    return {
      baselineTimestamp: baseline.timestamp,
      baselineRunId: baseline.runId,
      totalChange: totalCompared,
      passRateDeltaPercent,
      newRegressions,
      newFixes,
    };
  }

  private compareWithBaseline(
    currentCases: BenchmarkCaseResult[],
    baseline: BenchmarkReport
  ): BenchmarkBaselineComparison {
    return BenchmarkRunner.compareWithBaseline(currentCases, baseline);
  }
}
