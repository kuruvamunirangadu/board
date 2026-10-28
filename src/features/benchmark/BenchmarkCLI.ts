/**
 * VisiOS — AI Learning Quality Benchmark CLI Entry Point
 * Step 2: Allows running quick or full benchmark passes directly from terminal/scripts.
 */

import path from 'path';
import fs from 'fs';
import { BenchmarkRunner } from './BenchmarkRunner';
import { BenchmarkReporter } from './BenchmarkReporter';

async function main() {
  const args = process.argv.slice(2);
  const isQuick = args.includes('--quick');
  const isJson = args.includes('--json');
  const saveBaseline = args.includes('--save-baseline');
  const domainArg = args.find((a) => a.startsWith('--domain='));
  const filterDomain = domainArg ? (domainArg.split('=')[1] as any) : undefined;

  const reportDir = path.join(process.cwd(), 'benchmark-reports');

  const runner = new BenchmarkRunner({
    mode: isQuick ? 'quick' : 'full',
    reportDirectory: reportDir,
    filterDomain,
  });

  const report = await runner.run();

  if (saveBaseline) {
    try {
      if (!fs.existsSync(reportDir)) {
        fs.mkdirSync(reportDir, { recursive: true });
      }
      fs.writeFileSync(path.join(reportDir, 'baseline.json'), JSON.stringify(report, null, 2), 'utf-8');
      console.log('✅ Baseline report saved to benchmark-reports/baseline.json');
    } catch (e) {
      console.error('Failed to save baseline:', e);
    }
  }

  if (isJson) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    BenchmarkReporter.printConsoleSummary(report);
  }

  // Exit code: 0 if no critical failures, 1 if pass rate is under 80%
  const isHealthy = report.overallSummary.passRatePercent >= 80;
  process.exitCode = isHealthy ? 0 : 1;
}

main().catch((err) => {
  console.error('❌ Benchmark CLI encountered a fatal error:', err);
  process.exitCode = 1;
});

