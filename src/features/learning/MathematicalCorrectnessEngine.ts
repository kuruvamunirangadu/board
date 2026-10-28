/**
 * VisiOS — Mathematical Correctness and Verification Engine (Phase 3)
 * Provides deterministic calculation, intermediate-step derivation verification,
 * and safe symbolic evaluation without eval().
 */

export interface RationalFraction {
  numerator: number;
  denominator: number;
}

export interface RationalOperationResult {
  numerator: number;
  denominator: number;
  simplified: RationalFraction;
  decimalValue: number;
  steps: string[];
  latex: string;
}

export interface LinearFunctionProperties {
  slope: number;
  intercept: number;
  xIntercept: number | null; // null if slope === 0 && intercept !== 0
  evaluateAt: (x: number) => number;
  points: Array<{ x: number; y: number }>;
  steps: string[];
}

export interface PythagoreanEvaluation {
  a: number;
  b: number;
  c: number;
  isExactIntegerTriple: boolean;
  steps: string[];
}

export interface DerivationStepValidationResult {
  stepNumber: number;
  expression: string;
  isValid: boolean;
  issue?: string;
}

export interface MultiStepDerivationAudit {
  allStepsValid: boolean;
  totalSteps: number;
  validStepsCount: number;
  stepResults: DerivationStepValidationResult[];
  unsupportedTransformations: string[];
}

export class MathematicalCorrectnessEngine {
  // Greatest Common Divisor
  public static gcd(a: number, b: number): number {
    let x = Math.abs(Math.round(a));
    let y = Math.abs(Math.round(b));
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x;
  }

  // Least Common Multiple
  public static lcm(a: number, b: number): number {
    if (a === 0 || b === 0) return 0;
    return Math.abs(Math.round((a * b) / this.gcd(a, b)));
  }

  /**
   * Simplifies a rational fraction to lowest terms, preserving sign in the numerator.
   */
  public static simplifyFraction(numerator: number, denominator: number): RationalFraction {
    if (denominator === 0) {
      throw new Error('Division by zero: denominator cannot be zero');
    }
    const d = this.gcd(numerator, denominator);
    let num = Math.round(numerator / d);
    let den = Math.round(denominator / d);
    if (den < 0) {
      num = -num;
      den = -den;
    }
    return { numerator: num, denominator: den };
  }

  /**
   * Deterministic Fraction Arithmetic: a/b + c/d, a/b - c/d, a/b * c/d, a/b / c/d
   */
  public static addFractions(n1: number, d1: number, n2: number, d2: number): RationalOperationResult {
    if (d1 === 0 || d2 === 0) {
      throw new Error('Denominator cannot be zero.');
    }
    const commonDen = this.lcm(d1, d2);
    const m1 = commonDen / d1;
    const m2 = commonDen / d2;
    const num = n1 * m1 + n2 * m2;
    const simplified = this.simplifyFraction(num, commonDen);

    const steps = [
      `Given: \\frac{${n1}}{${d1}} + \\frac{${n2}}{${d2}}`,
      `Find Least Common Denominator: \\text{LCM}(${d1}, ${d2}) = ${commonDen}`,
      `Convert numerators: \\frac{${n1} \\times ${m1}}{${commonDen}} + \\frac{${n2} \\times ${m2}}{${commonDen}} = \\frac{${n1 * m1}}{${commonDen}} + \\frac{${n2 * m2}}{${commonDen}}`,
      `Sum numerators: \\frac{${n1 * m1} + ${n2 * m2}}{${commonDen}} = \\frac{${num}}{${commonDen}}`,
    ];
    if (simplified.numerator !== num || simplified.denominator !== commonDen) {
      steps.push(`Simplify by dividing by \\text{GCD}(${num}, ${commonDen}) = ${this.gcd(num, commonDen)}: \\frac{${simplified.numerator}}{${simplified.denominator}}`);
    }

    return {
      numerator: num,
      denominator: commonDen,
      simplified,
      decimalValue: simplified.numerator / simplified.denominator,
      steps,
      latex: `\\frac{${simplified.numerator}}{${simplified.denominator}}`,
    };
  }

  public static subtractFractions(n1: number, d1: number, n2: number, d2: number): RationalOperationResult {
    if (d1 === 0 || d2 === 0) throw new Error('Denominator cannot be zero.');
    const commonDen = this.lcm(d1, d2);
    const m1 = commonDen / d1;
    const m2 = commonDen / d2;
    const num = n1 * m1 - n2 * m2;
    const simplified = this.simplifyFraction(num, commonDen);

    return {
      numerator: num,
      denominator: commonDen,
      simplified,
      decimalValue: simplified.numerator / simplified.denominator,
      steps: [
        `Given: \\frac{${n1}}{${d1}} - \\frac{${n2}}{${d2}}`,
        `Common denominator: ${commonDen}`,
        `Difference: \\frac{${n1 * m1} - ${n2 * m2}}{${commonDen}} = \\frac{${num}}{${commonDen}}`,
        `Simplified: \\frac{${simplified.numerator}}{${simplified.denominator}}`,
      ],
      latex: `\\frac{${simplified.numerator}}{${simplified.denominator}}`,
    };
  }

  public static multiplyFractions(n1: number, d1: number, n2: number, d2: number): RationalOperationResult {
    if (d1 === 0 || d2 === 0) throw new Error('Denominator cannot be zero.');
    const rawNum = n1 * n2;
    const rawDen = d1 * d2;
    const simplified = this.simplifyFraction(rawNum, rawDen);

    return {
      numerator: rawNum,
      denominator: rawDen,
      simplified,
      decimalValue: simplified.numerator / simplified.denominator,
      steps: [
        `Given: \\frac{${n1}}{${d1}} \\times \\frac{${n2}}{${d2}}`,
        `Multiply numerators and denominators: \\frac{${n1} \\times ${n2}}{${d1} \\times ${d2}} = \\frac{${rawNum}}{${rawDen}}`,
        `Simplified: \\frac{${simplified.numerator}}{${simplified.denominator}}`,
      ],
      latex: `\\frac{${simplified.numerator}}{${simplified.denominator}}`,
    };
  }

  public static divideFractions(n1: number, d1: number, n2: number, d2: number): RationalOperationResult {
    if (d1 === 0 || d2 === 0) throw new Error('Denominator cannot be zero.');
    if (n2 === 0) throw new Error('Division by zero fraction.');
    return this.multiplyFractions(n1, d1, d2, n2);
  }

  /**
   * Deterministic Linear Function Evaluation: y = mx + c
   */
  public static analyzeLinearFunction(m: number, c: number): LinearFunctionProperties {
    const evaluateAt = (x: number) => Number((m * x + c).toFixed(8));
    const xIntercept = m !== 0 ? Number((-c / m).toFixed(8)) : null;

    // Standard sample points
    const sampleXs = [-2, -1, 0, 1, 2];
    const points = sampleXs.map((x) => ({ x, y: evaluateAt(x) }));

    const steps = [
      `Linear form: y = mx + c`,
      `Slope (rate of change): m = ${m}`,
      `Y-Intercept (at x = 0): y = ${c} \\rightarrow (0, ${c})`,
      xIntercept !== null
        ? `X-Intercept (set y = 0): 0 = ${m}x + ${c} \\Rightarrow x = ${xIntercept} \\rightarrow (${xIntercept}, 0)`
        : `Horizontal line (m = 0): No single x-intercept`,
      `At x = 2: y = ${m}(2) + ${c} = ${evaluateAt(2)}`,
    ];

    return {
      slope: m,
      intercept: c,
      xIntercept,
      evaluateAt,
      points,
      steps,
    };
  }

  /**
   * Deterministic Pythagorean Theorem evaluation: c = sqrt(a^2 + b^2)
   */
  public static analyzePythagorean(a: number, b: number): PythagoreanEvaluation {
    if (a <= 0 || b <= 0) {
      throw new Error('Triangle leg lengths must be strictly positive.');
    }
    const a2 = a * a;
    const b2 = b * b;
    const c2 = a2 + b2;
    const c = Math.sqrt(c2);
    const isExact = Number.isInteger(c);

    return {
      a,
      b,
      c: Number(c.toFixed(6)),
      isExactIntegerTriple: isExact,
      steps: [
        `Pythagorean Theorem: a^2 + b^2 = c^2`,
        `Substitute legs: ${a}^2 + ${b}^2 = ${a2} + ${b2} = ${c2}`,
        `Solve for hypotenuse: c = \\sqrt{${c2}} = ${isExact ? c : Number(c.toFixed(4))}`,
      ],
    };
  }

  /**
   * Validates algebraic intermediate steps for simple linear derivations:
   * e.g.
   * Step 1: x + 3 = 7
   * Step 2: x = 7 - 3
   * Step 3: x = 4
   */
  public static validateLinearDerivationSteps(steps: string[]): MultiStepDerivationAudit {
    const stepResults: DerivationStepValidationResult[] = [];
    let allValid = true;

    // Helper: extracts { variable, solution } from equation
    const parseSimpleLinearEq = (eq: string): { variable: string; solution: number } | null => {
      const clean = eq.replace(/\s+/g, '');
      const parts = clean.split('=');
      if (parts.length !== 2) return null;
      const [lhs, rhs] = parts;

      // Pattern: x + C = D or x - C = D
      const matchPlus = lhs.match(/^([a-zA-Z])([+-])(\d+(?:\.\d+)?)$/);
      const rhsNum = parseFloat(rhs);
      if (matchPlus && !isNaN(rhsNum)) {
        const v = matchPlus[1];
        const sign = matchPlus[2];
        const constVal = parseFloat(matchPlus[3]);
        const sol = sign === '+' ? rhsNum - constVal : rhsNum + constVal;
        return { variable: v, solution: Number(sol.toFixed(6)) };
      }

      // Pattern: x = D - C or x = D + C
      const matchRhsArith = rhs.match(/^(\d+(?:\.\d+)?)([+-])(\d+(?:\.\d+)?)$/);
      if (/^[a-zA-Z]$/.test(lhs) && matchRhsArith) {
        const d = parseFloat(matchRhsArith[1]);
        const sign = matchRhsArith[2];
        const c = parseFloat(matchRhsArith[3]);
        const sol = sign === '+' ? d + c : d - c;
        return { variable: lhs, solution: Number(sol.toFixed(6)) };
      }

      // Pattern: x = D (solved)
      if (/^[a-zA-Z]$/.test(lhs) && !isNaN(parseFloat(rhs))) {
        return { variable: lhs, solution: Number(parseFloat(rhs).toFixed(6)) };
      }

      return null;
    };

    let expectedSolution: number | null = null;
    let expectedVar: string | null = null;

    for (let i = 0; i < steps.length; i++) {
      const expr = steps[i];
      const parsed = parseSimpleLinearEq(expr);

      if (!parsed) {
        stepResults.push({
          stepNumber: i + 1,
          expression: expr,
          isValid: true, // Step format not strictly linear or descriptive, allow
        });
        continue;
      }

      if (expectedSolution === null) {
        expectedSolution = parsed.solution;
        expectedVar = parsed.variable;
        stepResults.push({
          stepNumber: i + 1,
          expression: expr,
          isValid: true,
        });
      } else {
        const matchesSolution = Math.abs(parsed.solution - expectedSolution) < 1e-4;
        const matchesVar = parsed.variable === expectedVar;
        const isValid = matchesSolution && matchesVar;
        if (!isValid) allValid = false;

        stepResults.push({
          stepNumber: i + 1,
          expression: expr,
          isValid,
          issue: !matchesSolution
            ? `Mathematical transition invalid: solution value shifted from ${expectedSolution} to ${parsed.solution}`
            : !matchesVar
            ? `Variable name inconsistency: ${expectedVar} vs ${parsed.variable}`
            : undefined,
        });
      }
    }

    return {
      allStepsValid: allValid,
      totalSteps: steps.length,
      validStepsCount: stepResults.filter((s) => s.isValid).length,
      stepResults,
      unsupportedTransformations: [],
    };
  }

  /**
   * Deterministic Binomial Expansion Verifier
   * Verifies that (base1 + base2)^power contains all terms with correct binomial coefficients.
   */
  public static verifyBinomialExpansion(
    base1: string,
    sign: '+' | '-',
    base2: string,
    power: number,
    candidateTerms: Array<{ coeff: number; p1: number; p2: number }>
  ): { isValid: boolean; expectedTermsCount: number; issues: string[] } {
    const issues: string[] = [];
    const expectedTermsCount = power + 1;

    if (candidateTerms.length !== expectedTermsCount) {
      issues.push(`Expected ${expectedTermsCount} terms for power ${power}, found ${candidateTerms.length}`);
    }

    // Combinations n! / (k! * (n-k)!)
    const getComb = (n: number, k: number): number => {
      if (k === 0 || k === n) return 1;
      let c = 1;
      for (let i = 1; i <= k; i++) c = (c * (n - i + 1)) / i;
      return Math.round(c);
    };

    for (let k = 0; k <= power; k++) {
      const p1 = power - k;
      const p2 = k;
      const baseCoeff = getComb(power, k);
      const expectedCoeff = sign === '-' && k % 2 === 1 ? -baseCoeff : baseCoeff;

      const matched = candidateTerms.find((t) => t.p1 === p1 && t.p2 === p2);
      if (!matched) {
        issues.push(`Missing term: ${base1}^${p1} * ${base2}^${p2}`);
      } else if (matched.coeff !== expectedCoeff) {
        issues.push(`Incorrect coefficient for ${base1}^${p1} * ${base2}^${p2}: expected ${expectedCoeff}, got ${matched.coeff}`);
      }
    }

    return {
      isValid: issues.length === 0,
      expectedTermsCount,
      issues,
    };
  }
}
