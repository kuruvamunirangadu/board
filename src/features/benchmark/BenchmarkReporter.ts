/**
 * VisiOS — Benchmark Reporter
 * Step 2: Generates developer-friendly terminal summaries and structured Markdown reports.
 */

import { BenchmarkReport, BenchmarkCaseResult } from './BenchmarkTypes';

export class BenchmarkReporter {
  /**
   * Formats a concise human-readable console report.
   */
  public static printConsoleSummary(report: BenchmarkReport): void {
    console.log('\n================================================================================');
    console.log(`  VisiOS AI Learning Quality Benchmark Report (${report.mode.toUpperCase()} MODE)`);
    console.log('================================================================================');
    console.log(`Run ID:           ${report.runId}`);
    console.log(`Dataset Version:  v${report.datasetVersion}`);
    console.log(`Timestamp:        ${new Date(report.timestamp).toISOString()}`);
    console.log(`Environment:      Node ${report.environment.nodeVersion} (${report.environment.platform})`);
    console.log(`AI Status:        ${report.environment.isAiConnected ? 'Online' : 'Offline'} (${report.environment.aiProvider})`);
    console.log('--------------------------------------------------------------------------------');

    // Overall summary
    const s = report.overallSummary;
    console.log(
      `OVERALL RESULTS:   ${s.passed}/${s.total} Passed (${s.passRatePercent}%) | ` +
      `Failed: ${s.failed} | Inconclusive: ${s.inconclusive} | Avg Latency: ${s.averageLatencyMs}ms`
    );
    console.log('--------------------------------------------------------------------------------');

    // Quality Dimensions breakdown
    console.log('QUALITY DIMENSIONS EVALUATION:');
    const dims = report.dimensionMetrics;
    const formatDim = (name: string, group: any) =>
      `  • ${name.padEnd(28)}: ${group.passed}/${group.total} (${group.passRatePercent.toString().padStart(5)}%) [Failed: ${group.failed}]`;

    console.log(formatDim('1. Classification Accuracy', dims.classification));
    console.log(formatDim('2. Routing Accuracy', dims.routing));
    console.log(formatDim('3. Renderer Compatibility', dims.rendererCompatibility));
    console.log(formatDim('4. Deterministic Correctness', dims.deterministicCorrectness));
    console.log(formatDim('5. Concept Coverage', dims.conceptCoverage));
    console.log(formatDim('6. Relevance & Non-Contradiction', dims.relevance));
    console.log(formatDim('7. Grounding & Attribution', dims.groundingAttribution));
    console.log(formatDim('8. Uncertainty Handling', dims.uncertaintyHandling));
    console.log(formatDim('9. Reliability & Latency', dims.reliability));
    console.log('--------------------------------------------------------------------------------');

    // Domain breakdown
    console.log('DOMAIN ACCURACY BREAKDOWN:');
    for (const [domain, group] of Object.entries(report.domainMetrics)) {
      console.log(`  • ${domain.padEnd(20)}: ${group.passed}/${group.total} (${group.passRatePercent}%) [Avg: ${group.averageLatencyMs}ms]`);
    }

    // Baseline comparison if present
    if (report.baselineComparison) {
      const b = report.baselineComparison;
      console.log('--------------------------------------------------------------------------------');
      console.log(`BASELINE REGRESSION CHECK (vs ${b.baselineRunId || 'prior run'}):`);
      console.log(`  • Pass Rate Delta: ${b.passRateDeltaPercent > 0 ? '+' : ''}${b.passRateDeltaPercent}%`);
      console.log(`  • New Regressions: ${b.newRegressions.length}`);
      console.log(`  • New Fixes:       ${b.newFixes.length}`);
      if (b.newRegressions.length > 0) {
        console.log('  ⚠️ REGRESSIONS DETECTED:');
        for (const reg of b.newRegressions) {
          console.log(`     - [${reg.caseId}] "${reg.input}": ${reg.previousStatus} -> ${reg.currentStatus} (${reg.reason})`);
        }
      }
    }

    // Failed cases diagnostic
    const failedCases = report.caseResults.filter((c) => c.overallStatus === 'FAIL');
    if (failedCases.length > 0) {
      console.log('--------------------------------------------------------------------------------');
      console.log(`DIAGNOSTIC FAILURE DETAILS (${failedCases.length} Cases):`);
      for (const fc of failedCases) {
        console.log(`\n  ❌ [${fc.caseId}] Input: "${fc.input}" (${fc.domain})`);
        for (const [dimKey, dimResult] of Object.entries(fc.dimensions)) {
          if (dimResult.status === 'FAIL') {
            console.log(`     - ${dimKey.toUpperCase()}: Expected: "${dimResult.expected}"`);
            console.log(`       Actual:   "${dimResult.actual}"`);
            if (dimResult.details) console.log(`       Details:  ${dimResult.details}`);
          }
        }
      }
    }

    console.log('================================================================================\n');
  }

  /**
   * Generates a GitHub-flavored Markdown report.
   */
  public static toMarkdown(report: BenchmarkReport): string {
    const s = report.overallSummary;
    const lines: string[] = [];

    lines.push(`# VisiOS AI Learning Quality Benchmark Report`);
    lines.push(`\n**Run ID:** \`${report.runId}\` | **Dataset:** \`v${report.datasetVersion}\` | **Timestamp:** ${new Date(report.timestamp).toISOString()}`);
    lines.push(`\n### Overall Summary\n`);
    lines.push(`| Metric | Value |`);
    lines.push(`|---|---|`);
    lines.push(`| **Total Cases** | ${s.total} |`);
    lines.push(`| **Passed** | ${s.passed} |`);
    lines.push(`| **Failed** | ${s.failed} |`);
    lines.push(`| **Inconclusive** | ${s.inconclusive} |`);
    lines.push(`| **Pass Rate** | **${s.passRatePercent}%** |`);
    lines.push(`| **Avg Latency** | ${s.averageLatencyMs} ms |`);

    lines.push(`\n### Quality Dimensions\n`);
    lines.push(`| Dimension | Pass Rate | Passed / Total | Failed |`);
    lines.push(`|---|---|---|---|`);
    for (const [dim, group] of Object.entries(report.dimensionMetrics)) {
      if (dim === 'regressionRate') continue;
      const g = group as any;
      lines.push(`| **${dim}** | ${g.passRatePercent}% | ${g.passed} / ${g.total} | ${g.failed} |`);
    }

    lines.push(`\n### Domain Breakdown\n`);
    lines.push(`| Academic Domain | Pass Rate | Passed / Total | Avg Latency |`);
    lines.push(`|---|---|---|---|`);
    for (const [domain, group] of Object.entries(report.domainMetrics)) {
      lines.push(`| **${domain}** | ${group.passRatePercent}% | ${group.passed} / ${group.total} | ${group.averageLatencyMs} ms |`);
    }

    const failed = report.caseResults.filter((c) => c.overallStatus === 'FAIL');
    if (failed.length > 0) {
      lines.push(`\n### Failed Case Diagnostics\n`);
      for (const fc of failed) {
        lines.push(`#### ❌ \`${fc.caseId}\` ("${fc.input}")`);
        lines.push(`- **Domain:** \`${fc.domain}\` | **Execution Time:** ${fc.executionTimeMs} ms`);
        for (const [dimKey, dim] of Object.entries(fc.dimensions)) {
          if (dim.status === 'FAIL') {
            lines.push(`- **${dimKey}:** Expected \`${dim.expected}\`, got \`${dim.actual}\` ${dim.details ? `(${dim.details})` : ''}`);
          }
        }
      }
    }

    return lines.join('\n');
  }
}

