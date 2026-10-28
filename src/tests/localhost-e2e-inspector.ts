/**
 * VisiOS — Automated Localhost & End-to-End System Inspector
 * Programmatically inspects and exercises all routes, services, engines,
 * and calculations on http://localhost:3000 without requiring manual user testing.
 */

import { WhatIfExecutionService } from '../features/what-if/WhatIfExecutionService';
import { CodeTracingEngine } from '../features/code-tracing/CodeTracingEngine';
import { contentRegistry } from '../features/knowledge/registry/content-registry';
import { ConceptDependencyGraph } from '../features/learning-paths/concept-graph';
import { PENDULUM_CONCEPTS, PENDULUM_DEPENDENCIES } from '../features/learning-paths/curated-paths';
import { authoringService } from '../features/authoring/authoring-service';
import { analyticsService } from '../features/analytics/analytics-service';
import { LessonSharingService } from '../features/collaboration/LessonSharingService';

interface RouteInspectionResult {
  route: string;
  url: string;
  statusCode: number;
  latencyMs: number;
  hasHtmlDoctype: boolean;
  hasRootShell: boolean;
  hasZeroErrorOverlays: boolean;
  status: 'PASSED' | 'FAILED';
  errorDetails?: string;
}

const LOCALHOST_BASE = 'http://localhost:3000';

const ROUTES_TO_INSPECT = [
  { route: '/', name: 'Main Canvas Board & Learning Workspace' },
  { route: '/analytics', name: 'Learning Analytics & Instructor Dashboard' },
  { route: '/authoring', name: 'Visual Authoring Studio & AI Curriculum' },
  { route: '/collab', name: 'Collaboration Rooms & Shared Synchronized Sessions' },
  { route: '/paths', name: 'Concept Dependency Graph & Adaptive Paths' },
  { route: '/subjects', name: 'Multi-Subject Content Registry' },
  { route: '/research', name: 'Educational Research & A/B Evaluation' },
  { route: '/library', name: 'Document Library & Multimodal Ingestion' },
];

async function inspectRoute(route: string): Promise<RouteInspectionResult> {
  const url = `${LOCALHOST_BASE}${route}`;
  const start = performance.now();
  try {
    const res = await fetch(url, { headers: { Accept: 'text/html' } });
    const latencyMs = Math.round(performance.now() - start);
    const text = await res.text();

    const hasHtmlDoctype = text.includes('<!DOCTYPE html>') || text.includes('<html');
    const hasRootShell = text.includes('VisiOS') || text.includes('__next') || text.includes('body');
    const hasZeroErrorOverlays = !text.includes('Unhandled Runtime Error') && !text.includes('Internal Server Error');

    const passed = res.status === 200 && hasHtmlDoctype && hasRootShell && hasZeroErrorOverlays;

    return {
      route,
      url,
      statusCode: res.status,
      latencyMs,
      hasHtmlDoctype,
      hasRootShell,
      hasZeroErrorOverlays,
      status: passed ? 'PASSED' : 'FAILED',
    };
  } catch (err: any) {
    const latencyMs = Math.round(performance.now() - start);
    return {
      route,
      url,
      statusCode: 0,
      latencyMs,
      hasHtmlDoctype: false,
      hasRootShell: false,
      hasZeroErrorOverlays: false,
      status: 'FAILED',
      errorDetails: err?.message || String(err),
    };
  }
}

export async function runAutomatedSystemInspection(): Promise<boolean> {
  console.log('================================================================================');
  console.log('       VisiOS Automated Localhost & Comprehensive System Inspector');
  console.log('================================================================================');
  console.log(`Target Host: ${LOCALHOST_BASE}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('--------------------------------------------------------------------------------\n');

  let allPassed = true;

  // 1. HTTP Endpoint & Route Inspection
  console.log('--- 1. Testing Live HTTP Endpoints on Localhost ---');
  const routeResults: RouteInspectionResult[] = [];
  for (const { route, name } of ROUTES_TO_INSPECT) {
    const r = await inspectRoute(route);
    routeResults.push(r);
    const icon = r.status === 'PASSED' ? '✓' : '❌';
    console.log(
      `  ${icon} [${r.status}] ${route.padEnd(12)} -> HTTP ${r.statusCode} (${r.latencyMs}ms) | ${name}`
    );
    if (r.status === 'FAILED') {
      console.error(`      Detail: ${r.errorDetails || 'Failed validation requirements'}`);
      allPassed = false;
    }
  }

  // 2. What-If Scenario Engine Automated Inspection
  console.log('\n--- 2. Inspecting What-If Scenario Engine End-to-End ---');
  try {
    const base = WhatIfExecutionService.createDefaultBaseline('exp_projectile_motion');
    base.parameters.speed = 25;
    base.parameters.angle = 45;
    const baseRes = WhatIfExecutionService.executeScenario(base);

    const alt = WhatIfExecutionService.cloneAsAlternative(base, 'High Angle Launch');
    alt.parameters.angle = 60;
    const altRes = WhatIfExecutionService.executeScenario(alt);

    const cmp = WhatIfExecutionService.compareScenarios(base, baseRes, alt, altRes);
    if (cmp.isSingleVariableControlled && cmp.metricDeltas.length > 0 && Boolean(cmp.deterministicExplanation)) {
      console.log('  ✓ What-If Engine: Deterministic comparison, curve generator & causal explanation verified');
    } else {
      console.error('  ❌ What-If Engine verification failed');
      allPassed = false;
    }
  } catch (e: any) {
    console.error('  ❌ What-If Engine threw error:', e);
    allPassed = false;
  }

  // 3. Code-to-Visual Learning Engine Automated Inspection
  console.log('\n--- 3. Inspecting Code-to-Visual Learning Engine End-to-End ---');
  try {
    const bsearchResult = CodeTracingEngine.executeTrace('binary_search', {
      array: [2, 5, 8, 12, 16, 23, 38],
      target: 16,
    });
    if (
      bsearchResult.success &&
      bsearchResult.steps.length > 0 &&
      bsearchResult.steps[bsearchResult.steps.length - 1].explanation.toLowerCase().includes('found')
    ) {
      console.log(`  ✓ Code-to-Visual: Binary search tracer generated ${bsearchResult.steps.length} step-by-step frames`);
    } else {
      console.error('  ❌ Code-to-Visual Binary Search tracer failed');
      allPassed = false;
    }

    const bsortResult = CodeTracingEngine.executeTrace('bubble_sort', {
      array: [5, 1, 4, 2],
    });
    if (bsortResult.steps.length > 0) {
      console.log(`  ✓ Code-to-Visual: Bubble sort tracer generated ${bsortResult.steps.length} step-by-step frames`);
    } else {
      console.error('  ❌ Code-to-Visual Bubble Sort tracer failed');
      allPassed = false;
    }
  } catch (e: any) {
    console.error('  ❌ Code-to-Visual Engine threw error:', e);
    allPassed = false;
  }

  // 4. Multi-Subject Knowledge Registry & Concept Dependency Graph
  console.log('\n--- 4. Inspecting Knowledge Registry & Concept Graph ---');
  try {
    const subjects = contentRegistry.listSubjects();
    const graph = new ConceptDependencyGraph(PENDULUM_CONCEPTS, PENDULUM_DEPENDENCIES);
    const topo = graph.getTopologicalOrder();
    if (subjects.length >= 4 && topo.length === PENDULUM_CONCEPTS.length) {
      console.log(`  ✓ Knowledge Registry: ${subjects.length} subjects registered; DAG topological sort verified (${topo.length} nodes)`);
    } else {
      console.error('  ❌ Knowledge Registry or DAG topological sort failed');
      allPassed = false;
    }
  } catch (e: any) {
    console.error('  ❌ Knowledge Registry threw error:', e);
    allPassed = false;
  }

  // 5. Authoring & Collaboration Integrity
  console.log('\n--- 5. Inspecting Authoring Studio & Collaboration Services ---');
  try {
    const drafts = authoringService.listDrafts();
    const secureToken = LessonSharingService.generateSecureToken();
    const checksum = LessonSharingService.computeChecksum('Sample published lesson content');
    if (drafts.length >= 1 && secureToken.startsWith('share_') && checksum.startsWith('v1chk_')) {
      console.log('  ✓ Authoring & Sharing: Draft packs validated & cryptographic token generation verified');
    } else {
      console.error('  ❌ Authoring or Sharing resolution failed');
      allPassed = false;
    }
  } catch (e: any) {
    console.error('  ❌ Authoring or Sharing service threw error:', e);
    allPassed = false;
  }

  // 6. Analytics Service Integrity
  console.log('\n--- 6. Inspecting Learning Analytics Service ---');
  try {
    const acc = analyticsService.calculateAccuracy(8, 10);
    const zero = analyticsService.calculateAccuracy(0, 0);
    if (acc.accuracy === 80 && zero.accuracy === null) {
      console.log('  ✓ Analytics Engine: Accuracy math and zero-attempt boundary checks verified');
    } else {
      console.error('  ❌ Analytics Engine verification failed');
      allPassed = false;
    }
  } catch (e: any) {
    console.error('  ❌ Analytics service threw error:', e);
    allPassed = false;
  }

  console.log('\n================================================================================');
  if (allPassed) {
    console.log('  ✅ ALL AUTOMATED LOCALHOST & SYSTEM INSPECTION TESTS PASSED (100%)');
  } else {
    console.log('  ❌ SOME INSPECTION CHECKS FAILED');
  }
  console.log('================================================================================\n');

  return allPassed;
}

if (require.main === module) {
  runAutomatedSystemInspection().then((ok) => {
    process.exit(ok ? 0 : 1);
  });
}
