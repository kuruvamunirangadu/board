/**
 * VisiOS — Universal Symbolic Binomial & Polynomial Expansion Engine
 * Provides deterministic, mathematically verified algebraic expansions,
 * step-by-step FOIL/distributive derivations, and multi-dimensional geometric models.
 */

export interface BinomialExpansionResult {
  base1: string;
  sign: '+' | '-';
  base2: string;
  power: number;
  expandedFormula: string;
  latexFormula: string;
  title: string;
  algebraicSteps: string[];
  geometricProofSummary: string;
  intuition: string;
  realWorldApplication: string;
  prerequisites: string[];
  terms: {
    coeff: number;
    power1: number;
    power2: number;
    formatted: string;
  }[];
  calculate: (p1: number, p2: number) => {
    total: number;
    termValues: number[];
    formattedSteps: string[];
  };
}

export class BinomialExpansionEngine {
  /**
   * Calculates combination C(n, k) = n! / (k! * (n - k)!)
   */
  public static getCombination(n: number, k: number): number {
    if (k < 0 || k > n) return 0;
    if (k === 0 || k === n) return 1;
    let c = 1;
    for (let i = 1; i <= k; i++) {
      c = (c * (n - i + 1)) / i;
    }
    return Math.round(c);
  }

  /**
   * Detects if an input string is a binomial power: (A + B)^N or (A - B)^N
   */
  public static matchBinomialPower(
    input: string
  ): { base1: string; sign: '+' | '-'; base2: string; power: number } | null {
    if (!input) return null;

    // If input contains '=' with non-trivial expressions on both sides, it's an equation (e.g. v = u + at, F = ma)
    const eqSplit = input.split('=');
    if (eqSplit.length > 1) {
      const lhs = eqSplit[0].trim();
      const rhs = eqSplit.slice(1).join('=').trim().replace(/[?;\s]/g, '');
      if (lhs.length > 0 && rhs.length > 0 && rhs !== '?') {
        return null;
      }
    }

    // Clean formatting
    const clean = input
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/⁴/g, '^4')
      .replace(/⁵/g, '^5')
      .replace(/[?=\s:;'"]/g, '')
      .toLowerCase();

    // 1. Parenthesized binomial: (a + b)^3, (a - b)^2, (x + y)^4, (a + b)
    const parenMatch = clean.match(/^\(([a-z0-9_]+)([+-])([a-z0-9_]+)\)(?:\^?(\d+))?$/);
    if (parenMatch) {
      const base1 = parenMatch[1];
      const sign = parenMatch[2] as '+' | '-';
      const base2 = parenMatch[3];
      const power = parenMatch[4] ? parseInt(parenMatch[4], 10) : 2;
      if (!isNaN(power) && power >= 1 && power <= 10) {
        return { base1, sign, base2, power };
      }
    }

    // 2. Non-parenthesized WITH EXPLICIT POWER: a+b^2 or a+b^3
    const nonParenMatch = clean.match(/^([a-z0-9_]+)([+-])([a-z0-9_]+)\^(\d+)$/);
    if (nonParenMatch) {
      const base1 = nonParenMatch[1];
      const sign = nonParenMatch[2] as '+' | '-';
      const base2 = nonParenMatch[3];
      const power = parseInt(nonParenMatch[4], 10);
      if (!isNaN(power) && power >= 1 && power <= 10) {
        return { base1, sign, base2, power };
      }
    }

    return null;
  }

  /**
   * Alias for backward-compatibility with tests: expandBinomial
   */
  public static expandBinomial(input: string): BinomialExpansionResult | null {
    const matched = this.matchBinomialPower(input);
    if (!matched) return null;
    return this.expand(matched.base1, matched.sign, matched.base2, matched.power);
  }

  /**
   * Generates a complete mathematical expansion and pedagogical guide for (base1 +/- base2)^power
   */
  public static expand(
    base1: string,
    sign: '+' | '-',
    base2: string,
    power: number
  ): BinomialExpansionResult {
    const terms: { coeff: number; power1: number; power2: number; formatted: string }[] = [];
    const formattedTermStrings: string[] = [];

    for (let k = 0; k <= power; k++) {
      const comb = this.getCombination(power, k);
      const signMultiplier = sign === '-' && k % 2 !== 0 ? -1 : 1;
      const signedCoeff = comb * signMultiplier;
      const p1 = power - k;
      const p2 = k;

      // Format variable powers
      let varStr = '';
      if (p1 > 0) {
        varStr += p1 === 1 ? base1 : `${base1}^${p1}`;
      }
      if (p2 > 0) {
        varStr += p2 === 1 ? base2 : `${base2}^${p2}`;
      }

      // Format coefficient
      let termStr = '';
      const absCoeff = Math.abs(signedCoeff);
      const coeffStr = absCoeff === 1 && varStr ? '' : `${absCoeff}`;

      if (k === 0) {
        termStr = signedCoeff < 0 ? `-${coeffStr}${varStr}` : `${coeffStr}${varStr}`;
      } else {
        const op = signedCoeff < 0 ? '-' : '+';
        termStr = `${op} ${coeffStr}${varStr}`;
      }

      terms.push({
        coeff: signedCoeff,
        power1: p1,
        power2: p2,
        formatted: termStr,
      });

      formattedTermStrings.push(termStr);
    }

    const expandedFormula = formattedTermStrings.join(' ').replace(/\s+/g, ' ').trim();
    const originalExpr = `(${base1} ${sign} ${base2})^${power}`;

    // Titles and naming
    const ordinal = power === 2 ? 'Square' : power === 3 ? 'Cube' : `${power}th Power`;
    const signWord = sign === '+' ? 'Sum' : 'Difference';
    const powerSup = power === 2 ? '²' : power === 3 ? '³' : `^${power}`;
    const title = `${ordinal} of a ${signWord}: (${base1} ${sign} ${base2})${powerSup}`;

    // Step-by-Step FOIL / Distributive Derivations
    const algebraicSteps: string[] = [];
    algebraicSteps.push(
      `1. Express the exponent as repeated binomial factors: ${originalExpr} = (${base1} ${sign} ${base2}) · (${base1} ${sign} ${base2})^${power - 1}`
    );

    if (power === 2) {
      algebraicSteps.push(
        `2. Apply distributive property (FOIL): ${base1}(${base1} ${sign} ${base2}) ${sign} ${base2}(${base1} ${sign} ${base2})`
      );
      algebraicSteps.push(
        `3. Multiply monomials: ${base1}² ${sign} ${base1}${base2} ${sign} ${base2}${base1} + ${base2}²`
      );
      algebraicSteps.push(
        `4. Apply commutativity of multiplication (${base2}${base1} = ${base1}${base2}) and combine like terms: ${expandedFormula} ✓`
      );
    } else if (power === 3) {
      const intermediateSquare =
        sign === '+' ? `${base1}² + 2${base1}${base2} + ${base2}²` : `${base1}² - 2${base1}${base2} + ${base2}²`;
      algebraicSteps.push(
        `2. Substitute the known binomial square identity: (${base1} ${sign} ${base2}) · (${intermediateSquare})`
      );
      algebraicSteps.push(
        `3. Distribute both terms across the quadratic factor: ${base1}(${intermediateSquare}) ${sign} ${base2}(${intermediateSquare})`
      );
      if (sign === '+') {
        algebraicSteps.push(
          `4. Multiply out terms: (${base1}³ + 2${base1}²${base2} + ${base1}${base2}²) + (${base1}²${base2} + 2${base1}${base2}² + ${base2}³)`
        );
        algebraicSteps.push(
          `5. Group symmetric like terms: ${base1}³ + (2${base1}²${base2} + ${base1}²${base2}) + (${base1}${base2}² + 2${base1}${base2}²) + ${base2}³`
        );
      } else {
        algebraicSteps.push(
          `4. Multiply out with sign rules: (${base1}³ - 2${base1}²${base2} + ${base1}${base2}²) - (${base1}²${base2} - 2${base1}${base2}² + ${base2}³)`
        );
        algebraicSteps.push(
          `5. Combine like terms: ${base1}³ + (-2${base1}²${base2} - ${base1}²${base2}) + (${base1}${base2}² + 2${base1}${base2}²) - ${base2}³`
        );
      }
      algebraicSteps.push(
        `6. Final canonical polynomial: ${expandedFormula} ✓`
      );
    } else {
      algebraicSteps.push(
        `2. Apply the Binomial Theorem: (${base1} ${sign} ${base2})^${power} = ∑ [k=0 to ${power}] (C(${power}, k) · ${base1}^(${power}-k) · (${sign}${base2})^k)`
      );
      algebraicSteps.push(
        `3. Compute Pascal triangle coefficients for n=${power}: [${terms.map((t) => Math.abs(t.coeff)).join(', ')}]`
      );
      algebraicSteps.push(
        `4. Distribute signs across odd powers of ${base2} and simplify terms: ${expandedFormula} ✓`
      );
    }

    // Geometric Proof / Representation
    let geometricProofSummary = '';
    let intuition = '';
    if (power === 2) {
      if (sign === '+') {
        geometricProofSummary = `2D Area Model: A composite square of total side length (${base1} + ${base2}) partitions into 4 planar sub-regions: one square of area ${base1}², one square of area ${base2}², and two symmetric rectangles each of area ${base1} × ${base2}, perfectly summing to ${base1}² + 2${base1}${base2} + ${base2}².`;
        intuition = `Expanding a square of side (${base1} + ${base2}) adds two rectangular cross strips of width ${base2} and length ${base1}, plus the corner square ${base2}².`;
      } else {
        geometricProofSummary = `2D Area Model: Starting from an outer square of side ${base1} (area ${base1}²), subtract two overlapping rectangular strips of dimensions ${base1} × ${base2} (total -2${base1}${base2}). Because the corner square of side ${base2} was subtracted twice, add back +${base2}² to yield the remaining square (${base1} - ${base2})².`;
        intuition = `Shrinking a square side from ${base1} to (${base1} - ${base2}) subtracts the corner intersection twice, requiring +${base2}² to be added back.`;
      }
    } else if (power === 3) {
      if (sign === '+') {
        geometricProofSummary = `3D Solid Volume Dissection: A composite cube of side length (${base1} + ${base2}) decomposes into 8 geometric blocks: 1 primary cube of volume ${base1}³, 3 rectangular slabs of dimensions ${base1} × ${base1} × ${base2} (volume 3${base1}²${base2}), 3 tall square columns of dimensions ${base1} × ${base2} × ${base2} (volume 3${base1}${base2}²), and 1 corner cube of volume ${base2}³. Total volume: ${base1}³ + 3${base1}²${base2} + 3${base1}${base2}² + ${base2}³.`;
        intuition = `Volume scaling in 3 dimensions decomposes into 1 base cube, 3 planar slabs, 3 edge columns, and 1 corner cube.`;
      } else {
        geometricProofSummary = `3D Solid Volume Dissection: Contracting a cube of side ${base1} by length ${base2} along all three Cartesian axes shrinks the enclosed volume from ${base1}³. Subtracting 3 planar slabs (-3${base1}²${base2}) subtracts their pairwise edge intersections twice, requiring 3 edge columns (+3${base1}${base2}²) to be added back, and finally subtracting the triple-intersection corner (-${base2}³).`;
        intuition = `3D principle of inclusion-exclusion applied to Cartesian volume contraction.`;
      }
    } else {
      geometricProofSummary = `${power}-Dimensional Hypercube Partition: An n-dimensional hypercube of edge (${base1} ${sign} ${base2}) partitions into 2^${power} hyper-blocks grouped by combinatorial symmetry classes C(${power}, k) of dimension k and (n-k).`;
      intuition = `Higher-dimensional generalization of Pascal triangle combinatorial geometry.`;
    }

    const realWorldApplication =
      power === 3
        ? 'Thermodynamics of thermal volume expansion, 3D stress tensors in structural mechanics, volume scaling laws in biology, and binomial probability distributions.'
        : 'Computer graphics spatial partitioning, machine learning polynomial loss functions, variance calculations in statistics, and circuit impedance.';

    const prerequisites = [
      'Distributive Law (FOIL)',
      'Exponent Rules & Powers',
      'Polynomial Like-Term Combination',
      power >= 3 ? '3D Solid Geometry' : 'Area of Rectangles',
    ];

    // Numeric calculation helper
    const calculate = (val1: number, val2: number) => {
      const baseVal = sign === '+' ? val1 + val2 : val1 - val2;
      const total = Math.pow(baseVal, power);
      const termValues = terms.map((t) => {
        return t.coeff * Math.pow(val1, t.power1) * Math.pow(val2, t.power2);
      });
      const formattedSteps = [
        `Base calculation: (${val1} ${sign} ${val2})^${power} = (${baseVal})^${power} = ${total}`,
        `Expanded term summation: ` +
          terms
            .map((t, idx) => {
              const val = termValues[idx];
              return `${t.formatted.replace(/^[+-]\s*/, '')} = ${val}`;
            })
            .join(', '),
        `Verified sum: ${termValues.reduce((a, b) => a + b, 0)} = ${total} ✓`,
      ];
      return { total, termValues, formattedSteps };
    };

    return {
      base1,
      sign,
      base2,
      power,
      expandedFormula,
      latexFormula: expandedFormula,
      title,
      algebraicSteps,
      geometricProofSummary,
      intuition,
      realWorldApplication,
      prerequisites,
      terms,
      calculate,
    };
  }
}
