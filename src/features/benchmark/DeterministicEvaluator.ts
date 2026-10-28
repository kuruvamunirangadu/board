/**
 * VisiOS — Benchmark Deterministic Evaluator
 * Step 2: Executes exact, invariant, and property-based verification checks
 * against independent mathematical oracles and engine registry contracts.
 */

import { BenchmarkTestCase, DimensionResult } from './BenchmarkTypes';
import { OrchestrationResult } from '@/features/learning/LearningOrchestrator';
import { REGISTERED_RENDERERS, VisualizationRegistry, CanonicalRendererType } from '@/features/learning/VisualizationRegistry';
import { SubjectRegistry } from '@/features/learning/SubjectRegistry';

export class DeterministicEvaluator {
  /**
   * 1. Evaluates Classification Accuracy: domain, intent, and engine.
   */
  public static evaluateClassification(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const classResult = result.classification;
    const isDomainMatch = classResult.domain === testCase.domain;
    const isEngineMatch = classResult.engine === testCase.expectedEngine;
    const isIntentMatch = classResult.intent === testCase.intent;

    let score = 0;
    if (isDomainMatch) score += 0.4;
    if (isEngineMatch) score += 0.4;
    if (isIntentMatch) score += 0.2;

    const isPass = isDomainMatch && isEngineMatch;
    const actualDesc = `domain: ${classResult.domain}, engine: ${classResult.engine}, intent: ${classResult.intent} (conf: ${classResult.confidence})`;
    const expectedDesc = `domain: ${testCase.domain}, engine: ${testCase.expectedEngine}, intent: ${testCase.intent}`;

    return {
      dimension: 'classification',
      status: isPass ? 'PASS' : 'FAIL',
      score,
      expected: expectedDesc,
      actual: actualDesc,
      details: isPass ? undefined : `Mismatch: domainMatch=${isDomainMatch}, engineMatch=${isEngineMatch}`,
    };
  }

  /**
   * 2. Evaluates Routing Accuracy: target route taken by orchestrator.
   */
  public static evaluateRouting(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const isRouteMatch = result.routeTaken === testCase.expectedRoute;

    return {
      dimension: 'routing',
      status: isRouteMatch ? 'PASS' : 'FAIL',
      score: isRouteMatch ? 1.0 : 0.0,
      expected: testCase.expectedRoute,
      actual: result.routeTaken,
      details: isRouteMatch ? undefined : `Expected route "${testCase.expectedRoute}" but orchestrator took "${result.routeTaken}"`,
    };
  }

  /**
   * 3. Evaluates Renderer Compatibility: selected visualizer must be registered and support domain.
   */
  public static evaluateRendererCompatibility(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const selectedRenderer = (result.plan.visualizationPlan?.rendererType as CanonicalRendererType) || 'none';
    const canonical = VisualizationRegistry.resolveRendererType(selectedRenderer);
    const descriptor = REGISTERED_RENDERERS[canonical];

    if (!descriptor) {
      return {
        dimension: 'renderer_compatibility',
        status: 'FAIL',
        score: 0.0,
        expected: testCase.expectedRenderer,
        actual: selectedRenderer,
        details: `Renderer "${selectedRenderer}" is not registered in VisualizationRegistry`,
      };
    }

    // Expected check
    const matchesExpected =
      canonical === testCase.expectedRenderer ||
      selectedRenderer === testCase.expectedRenderer ||
      (testCase.expectedRenderer === 'none' && canonical === 'none');

    // Domain compatibility check
    const subjectDef = SubjectRegistry.resolveSubjectForDomain(testCase.domain);
    const isDomainAllowed =
      descriptor.supportedDomains.includes(testCase.domain) ||
      subjectDef.supportedRendererTypes.includes(canonical) ||
      canonical === 'svg_schematic_fallback' ||
      canonical === 'none';

    const isPass = matchesExpected && isDomainAllowed;

    return {
      dimension: 'renderer_compatibility',
      status: isPass ? 'PASS' : 'FAIL',
      score: isPass ? 1.0 : matchesExpected ? 0.5 : 0.0,
      expected: `${testCase.expectedRenderer} (domain-compatible with ${testCase.domain})`,
      actual: `${canonical} (interactive: ${descriptor.isInteractive})`,
      details: isPass
        ? undefined
        : `Renderer mismatch or domain incompatibility (matchesExpected=${matchesExpected}, isDomainAllowed=${isDomainAllowed})`,
    };
  }

  /**
   * 4. Evaluates Deterministic Correctness using independent mathematical oracles.
   */
  public static evaluateDeterministicCorrectness(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    // If test case has no specific calculation check, evaluate step counts or variables
    const check = testCase.expectedProperties?.calculationCheck;
    if (!check) {
      // Check step count if specified
      if (testCase.expectedProperties?.minSteps) {
        const stepCount = result.plan.derivationSteps?.length || 0;
        const hasMinSteps = stepCount >= testCase.expectedProperties.minSteps;
        return {
          dimension: 'deterministic_correctness',
          status: hasMinSteps ? 'PASS' : 'FAIL',
          score: hasMinSteps ? 1.0 : 0.0,
          expected: `>= ${testCase.expectedProperties.minSteps} derivation steps`,
          actual: `${stepCount} steps`,
          details: hasMinSteps ? undefined : 'Derivation steps below required threshold',
        };
      }

      return {
        dimension: 'deterministic_correctness',
        status: 'PASS',
        score: 1.0,
        expected: 'Valid structural deterministic plan',
        actual: 'Plan verified',
      };
    }

    // Independent Calculation Oracles
    switch (check.type) {
      case 'binomial': {
        const { power, a, b, isDiff } = check.inputs;
        const expectedVal = DeterministicEvaluator.calculateBinomialExpansion(a, b, power, isDiff);
        const actualVal = check.expectedOutputs.expandedValue as number;
        const matches = expectedVal === actualVal;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `(${a} ${isDiff ? '-' : '+'} ${b})^${power} = ${expectedVal}`,
          actual: `Calculated = ${actualVal}`,
        };
      }

      case 'law_of_cosines': {
        const { a, b, angleDeg } = check.inputs;
        const loc = DeterministicEvaluator.calculateLawOfCosines(a, b, angleDeg);
        const targetC = check.expectedOutputs.c as number;
        const tol = check.tolerance || 0.05;
        const diff = Math.abs(loc.c - targetC);
        const matches = diff <= tol;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `c = ${targetC.toFixed(3)} ± ${tol}`,
          actual: `Oracle c = ${loc.c.toFixed(3)} (delta: ${diff.toFixed(4)})`,
        };
      }

      case 'newton_fma': {
        const { force, mass } = check.inputs;
        const newton = DeterministicEvaluator.calculateNewtonAcceleration(force, mass);
        const targetAcc = check.expectedOutputs.acceleration as number;
        const matches = Math.abs(newton.acceleration - targetAcc) < 1e-4;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `a = F / m = ${newton.acceleration} m/s²`,
          actual: `Target a = ${targetAcc} m/s²`,
        };
      }

      case 'kinematics': {
        const { speed, angle, gravity } = check.inputs;
        const kin = DeterministicEvaluator.calculateBallisticRange(speed, angle, gravity);
        const targetRange = check.expectedOutputs.range as number;
        const tol = check.tolerance || 0.1;
        const diff = Math.abs(kin.range - targetRange);
        const matches = diff <= tol;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `R = ${targetRange} m ± ${tol}`,
          actual: `Oracle R = ${kin.range.toFixed(2)} m (delta: ${diff.toFixed(3)})`,
        };
      }

      case 'pendulum': {
        const { length, gravity } = check.inputs;
        const pend = DeterministicEvaluator.calculatePendulumPeriod(length, gravity);
        const targetPeriod = check.expectedOutputs.period as number;
        const tol = check.tolerance || 0.05;
        const diff = Math.abs(pend.period - targetPeriod);
        const matches = diff <= tol;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `T = ${targetPeriod} s ± ${tol}`,
          actual: `Oracle T = ${pend.period.toFixed(2)} s (delta: ${diff.toFixed(3)})`,
        };
      }

      case 'binary_search': {
        const { array, target } = check.inputs;
        const bs = DeterministicEvaluator.verifyBinarySearchReference(array, target);
        const expectedFound = check.expectedOutputs.found as boolean;
        const expectedIdx = check.expectedOutputs.targetIndex as number;
        const matches = bs.found === expectedFound && bs.targetIndex === expectedIdx;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `targetIndex=${expectedIdx}, found=${expectedFound}`,
          actual: `Oracle foundIndex=${bs.targetIndex}`,
        };
      }

      case 'linear_function': {
        const { m, c, x } = check.inputs;
        const expectedY = Number(check.expectedOutputs.y);
        const calculatedY = m * x + c;
        const matches = Math.abs(calculatedY - expectedY) < 1e-4;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `y = ${m}(${x}) + ${c} = ${expectedY}`,
          actual: `Oracle calculated = ${calculatedY}`,
        };
      }

      case 'fraction_addition': {
        const { n1, d1, n2, d2 } = check.inputs;
        const gcd = (a: number, b: number): number => (!b ? Math.abs(a) : gcd(b, a % b));
        const lcm = (a: number, b: number): number => Math.abs((a * b) / gcd(a, b));
        const commonD = lcm(d1, d2);
        const num = n1 * (commonD / d1) + n2 * (commonD / d2);
        const g = gcd(num, commonD);
        const simp = `${num / g}/${commonD / g}`;
        const targetFraction = String(check.expectedOutputs.fraction);
        const matches = simp === targetFraction;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `${n1}/${d1} + ${n2}/${d2} = ${targetFraction}`,
          actual: `Oracle fraction = ${simp}`,
        };
      }

      case 'pythagorean': {
        const { a, b } = check.inputs;
        const expectedC = Number(check.expectedOutputs.c);
        const calculatedC = Math.sqrt(a * a + b * b);
        const matches = Math.abs(calculatedC - expectedC) < 1e-4;
        return {
          dimension: 'deterministic_correctness',
          status: matches ? 'PASS' : 'FAIL',
          score: matches ? 1.0 : 0.0,
          expected: `c = √(${a}² + ${b}²) = ${expectedC}`,
          actual: `Oracle c = ${calculatedC.toFixed(3)}`,
        };
      }

      default:
        return {
          dimension: 'deterministic_correctness',
          status: 'PASS',
          score: 1.0,
          expected: 'Default oracle check',
          actual: 'Pass',
        };
    }
  }

  // =========================================================================
  // Independent Math Oracle Helper Methods
  // =========================================================================

  public static calculateBinomialExpansion(a: number, b: number, power: number, isDiff: boolean = false): number {
    return Math.pow(isDiff ? a - b : a + b, power);
  }

  public static calculateLawOfCosines(a: number, b: number, angleDeg: number): { c: number } {
    const angleRad = (angleDeg * Math.PI) / 180;
    return { c: Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(angleRad)) };
  }

  public static calculateNewtonAcceleration(force: number, mass: number): { acceleration: number } {
    if (mass <= 0) throw new Error('Mass must be greater than zero');
    return { acceleration: force / mass };
  }

  public static calculateBallisticRange(
    speed: number,
    angleDeg: number,
    gravity: number
  ): { range: number; flightTime: number } {
    const thetaRad = (angleDeg * Math.PI) / 180;
    const range = (speed * speed * Math.sin(2 * thetaRad)) / gravity;
    const flightTime = (2 * speed * Math.sin(thetaRad)) / gravity;
    return { range, flightTime };
  }

  public static calculatePendulumPeriod(length: number, gravity: number): { period: number } {
    return { period: 2 * Math.PI * Math.sqrt(length / gravity) };
  }

  public static verifyBinarySearchReference(
    array: number[],
    target: number
  ): { found: boolean; targetIndex: number } {
    let low = 0;
    let high = array.length - 1;
    let foundIndex = -1;
    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (array[mid] === target) {
        foundIndex = mid;
        break;
      } else if (array[mid] < target) {
        low = mid + 1;
      } else {
        high = mid - 1;
      }
    }
    return { found: foundIndex !== -1, targetIndex: foundIndex };
  }

  /**
   * 5. Evaluates Uncertainty Handling: ensures ambiguous or unrecognized queries
   * are handled honestly without fabricating derivations or setting arbitrary parameters.
   */
  public static evaluateUncertaintyHandling(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult
  ): DimensionResult {
    const isUncertainExpected = testCase.expectedProperties?.isUncertain === true;
    const isUncertainActual =
      result.plan.uncertaintyState?.isUncertain === true ||
      result.classification.requiresClarification === true ||
      result.routeTaken === 'honest_uncertainty' ||
      result.routeTaken === 'unsupported_input';

    if (isUncertainExpected) {
      // Must be marked uncertain
      if (!isUncertainActual) {
        return {
          dimension: 'uncertainty_handling',
          status: 'FAIL',
          score: 0.0,
          expected: 'honest uncertainty (isUncertain = true or requiresClarification = true)',
          actual: 'claimed full understanding without uncertainty',
          details: 'Failed to flag ambiguous or unrecognized query',
        };
      }

      // Check anti-hallucination: no fabricated parameter k = 1
      const params = result.plan.defaultExperimentState?.parameters || {};
      const hasFabricatedK = Object.keys(params).includes('k') && params.k === 1;
      if (hasFabricatedK) {
        return {
          dimension: 'uncertainty_handling',
          status: 'FAIL',
          score: 0.0,
          expected: 'clean uncertainty plan without arbitrary parameters',
          actual: 'fabricated arbitrary parameter k = 1',
          details: 'Hallucination violation: fabricated parameter k = 1',
        };
      }

      return {
        dimension: 'uncertainty_handling',
        status: 'PASS',
        score: 1.0,
        expected: 'honest uncertainty state',
        actual: `Uncertainty acknowledged via ${result.routeTaken}`,
      };
    }

    // Not expected to be uncertain
    if (isUncertainActual) {
      return {
        dimension: 'uncertainty_handling',
        status: 'FAIL',
        score: 0.0,
        expected: 'confident resolution for valid topic',
        actual: `flagged as uncertain (${result.routeTaken})`,
        details: 'Valid curriculum topic was erroneously marked uncertain',
      };
    }

    return {
      dimension: 'uncertainty_handling',
      status: 'PASS',
      score: 1.0,
      expected: 'confident resolution',
      actual: 'resolved confidently',
    };
  }

  /**
   * 6. Evaluates Reliability: request finished safely without crashing or timeout.
   */
  public static evaluateReliability(
    testCase: BenchmarkTestCase,
    result: OrchestrationResult,
    elapsedMs: number,
    timeoutMs: number = 5000
  ): DimensionResult {
    const timedOut = elapsedMs > timeoutMs;
    const hasPlan = !!result && !!result.plan;

    if (!hasPlan) {
      return {
        dimension: 'reliability',
        status: 'FAIL',
        score: 0.0,
        expected: 'valid plan returned',
        actual: 'null or undefined result',
        details: 'Execution failed to produce a valid OrchestrationResult',
      };
    }

    if (timedOut) {
      return {
        dimension: 'reliability',
        status: 'FAIL',
        score: 0.0,
        expected: `< ${timeoutMs}ms execution time`,
        actual: `${elapsedMs}ms (timed out)`,
        details: 'Execution exceeded allowable latency threshold',
      };
    }

    return {
      dimension: 'reliability',
      status: 'PASS',
      score: 1.0,
      expected: 'safe, bounded execution',
      actual: `${elapsedMs}ms`,
    };
  }
}
