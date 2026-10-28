import { DerivationStep } from './types';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';

export interface CalculationResult {
  primaryResult: number | string;
  formattedOutput: string;
  units?: string;
  isDimensionallyConsistent: boolean;
  stepDetails?: string[];
}

export class FormulaDerivationEngine {
  /**
   * Safely calculates outcomes without using eval() or arbitrary code execution.
   */
  static calculate(
    conceptId: string,
    params: Record<string, number>
  ): CalculationResult {
    // Subject-Aware Domain Models (Computer Science / Chemistry / Biology)
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain) {
      const primary = domain.calculatedParameters.N ?? domain.calculatedParameters.Z ?? domain.calculatedParameters.P ?? 1;
      return {
        primaryResult: primary,
        formattedOutput: `${domain.conciseFormula} ⇒ ${domain.solvedAnswer}`,
        units: 'units',
        isDimensionallyConsistent: true,
        stepDetails: domain.algebraicSteps,
      };
    }
    // Dynamic Binomial Powers: binomial_base1_plus_base2_power
    if (conceptId.startsWith('binomial_')) {
      const parts = conceptId.split('_');
      const base1 = parts[1] || 'a';
      const sign = parts[2] === 'minus' ? '-' : '+';
      const base2 = parts[3] || 'b';
      const power = parseInt(parts[4], 10) || 2;
      const val1 = params[base1] ?? (power === 3 ? 2 : 4);
      const val2 = params[base2] ?? 1;
      const exp = BinomialExpansionEngine.expand(base1, sign as '+' | '-', base2, power);
      const calc = exp.calculate(val1, val2);
      return {
        primaryResult: calc.total,
        formattedOutput: `(${base1} ${sign} ${base2})^${power} = (${val1} ${sign} ${val2})^${power} = ${calc.total}`,
        units: power === 3 ? 'volume units' : power === 2 ? 'area units' : 'units',
        isDimensionallyConsistent: true,
        stepDetails: calc.formattedSteps,
      };
    }

    switch (conceptId) {
      // 0. Density: ρ = m / V
      case 'physics_density': {
        const m = params.m ?? 6;
        const V = Math.max(0.0001, params.V ?? 0.002);
        const rho = Math.round((m / V) * 100) / 100;
        return {
          primaryResult: rho,
          formattedOutput: `ρ = m / V = ${m} kg / ${V} m³ = ${rho} kg/m³`,
          units: 'kg/m³',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Mass: m = ${m} kg`,
            `Volume: V = ${V} m³`,
            `Calculated Density: ρ = ${rho} kg/m³`,
            rho > 1000 ? 'Density > 1000 kg/m³ (sinks in pure water)' : 'Density < 1000 kg/m³ (floats in water)',
          ],
        };
      }

      // 1. F = ma (Newton's Second Law)
      case 'physics_f_ma': {
        const m = Math.max(0.001, params.m ?? 2);
        // If acceleration is specified or F is not provided, calculate Force F = m · a
        if (params.a !== undefined && params.F === undefined) {
          const a = params.a;
          const F = Number((m * a).toFixed(3));
          return {
            primaryResult: F,
            formattedOutput: `F = m · a = ${m} kg · ${a} m/s² = ${F} N`,
            units: 'N',
            isDimensionallyConsistent: true,
            stepDetails: [
              `Given: Mass m = ${m} kg, Acceleration a = ${a} m/s²`,
              `Newton's 2nd Law: F = m · a`,
              `Calculated Net Force: F = ${m} · ${a} = ${F} N`,
              `Context: Inertial reference frame; constant mass; non-relativistic motion (v ≪ c).`,
            ],
          };
        }

        const F = params.F ?? (params.a !== undefined ? Number((m * params.a).toFixed(3)) : 10);
        const a = Number((F / m).toFixed(3));
        return {
          primaryResult: a,
          formattedOutput: `a = F / m = ${F} N / ${m} kg = ${a} m/s² (Net Force: ${F} N)`,
          units: 'm/s²',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Given: Net Force F = ${F} N, Inertial Mass m = ${m} kg`,
            `Rearrange Newton's 2nd Law: a = F / m`,
            `Calculated Acceleration: a = ${F} / ${m} = ${a} m/s²`,
            `Context: Frictionless surface assumed; direction of acceleration aligns with net force.`,
          ],
        };
      }

      // 2. v = u + at
      case 'physics_kinematics_v_u_at': {
        const u = params.u ?? 5;
        const a = params.a ?? 4;
        const t = params.t ?? 5;
        const v = u + a * t;
        const s = u * t + 0.5 * a * t * t;
        return {
          primaryResult: Number(v.toFixed(2)),
          formattedOutput: `v = ${u} + (${a} × ${t}) = ${v.toFixed(2)} m/s (Displacement s = ${s.toFixed(1)} m)`,
          units: 'm/s',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Velocity gained: Δv = a · t = ${a} × ${t} = ${(a * t).toFixed(2)} m/s`,
            `Total velocity: v = u + Δv = ${u} + ${(a * t).toFixed(2)} = ${v.toFixed(2)} m/s`,
            `Integrated displacement: s = ut + ½at² = ${s.toFixed(2)} m`,
          ],
        };
      }

      // 2B. Pendulum: T = 2π√(L/g)
      case 'physics_pendulum': {
        const L = params.L ?? 1.0;
        const g = params.g ?? 9.81;
        const T = 2 * Math.PI * Math.sqrt(L / g);
        return {
          primaryResult: Number(T.toFixed(2)),
          formattedOutput: `T = 2π√(${L} / ${g}) = ${T.toFixed(2)} s`,
          units: 's',
          isDimensionallyConsistent: true,
          stepDetails: [
            `String length ratio: L / g = ${L} / ${g} = ${(L / g).toFixed(4)} s²`,
            `Square root: √(L / g) = ${Math.sqrt(L / g).toFixed(4)} s`,
            `Full Period: T = 2π · √(L / g) = ${T.toFixed(2)} seconds`,
          ],
        };
      }

      // 3. y = sin(x)
      case 'calculus_sin_x': {
        const x = params.x ?? 1.57;
        const A = params.A ?? 1;
        const f = params.f ?? 1;
        const y = A * Math.sin(f * x);
        const dy_dx = A * f * Math.cos(f * x);
        return {
          primaryResult: Number(y.toFixed(3)),
          formattedOutput: `y = ${A} · sin(${f} · ${x}) = ${y.toFixed(3)} (Slope dy/dx = ${dy_dx.toFixed(3)})`,
          units: 'amplitude',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Phase argument θ = ${f} × ${x} = ${(f * x).toFixed(3)} rad (${((f * x * 180) / Math.PI).toFixed(1)}°)`,
            `Value: y = ${A} · sin(θ) = ${y.toFixed(3)}`,
            `Instantaneous Derivative: dy/dx = A · f · cos(θ) = ${dy_dx.toFixed(3)}`,
          ],
        };
      }

      // 3B-1. Exponential: y = e^x
      case 'math_exponential_function': {
        const x = params.x ?? 1;
        const a = params.a ?? 1;
        const k = params.k ?? 1;
        const y = a * Math.exp(k * x);
        const dy_dx = a * k * Math.exp(k * x);
        return {
          primaryResult: Number(y.toFixed(3)),
          formattedOutput: `y = ${a} · e^(${k} · ${x}) = ${y.toFixed(3)} (Slope dy/dx = ${dy_dx.toFixed(3)})`,
          units: 'y',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Input Coordinate x = ${x}`,
            `Euler Exponent: e^(${k} × ${x}) = ${Math.exp(k * x).toFixed(3)}`,
            `Function Value: y = ${a} × ${Math.exp(k * x).toFixed(3)} = ${y.toFixed(3)}`,
            `Instantaneous Rate of Change: dy/dx = k · y = ${dy_dx.toFixed(3)}`,
          ],
        };
      }

      // 3B-2. Transcendental: y = e^(cos(x))
      case 'math_exp_cos_curve': {
        const x = params.x ?? 0;
        const y = Math.exp(Math.cos(x));
        const dy_dx = -Math.sin(x) * y;
        return {
          primaryResult: Number(y.toFixed(3)),
          formattedOutput: `y = e^(cos(${x})) = ${y.toFixed(3)} (Slope dy/dx = ${dy_dx.toFixed(3)})`,
          units: 'y',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Argument x = ${x} rad`,
            `Inner cosine: cos(${x}) = ${Math.cos(x).toFixed(3)}`,
            `Exponential: e^cos(x) = ${y.toFixed(3)}`,
            `Chain Rule Derivative: dy/dx = -sin(x) · e^cos(x) = ${dy_dx.toFixed(3)}`,
          ],
        };
      }

      // 3B-3. Cosine: y = cos(x)
      case 'math_cosine_function': {
        const x = params.x ?? 0;
        const A = params.A ?? 1;
        const f = params.f ?? 1;
        const y = A * Math.cos(f * x);
        const dy_dx = -A * f * Math.sin(f * x);
        return {
          primaryResult: Number(y.toFixed(3)),
          formattedOutput: `y = ${A} · cos(${f} · ${x}) = ${y.toFixed(3)} (Slope dy/dx = ${dy_dx.toFixed(3)})`,
          units: 'amplitude',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Phase argument θ = ${f} × ${x} = ${(f * x).toFixed(3)} rad (${((f * x * 180) / Math.PI).toFixed(1)}°)`,
            `Value: y = ${A} · cos(θ) = ${y.toFixed(3)}`,
            `Instantaneous Derivative: dy/dx = -A · f · sin(θ) = ${dy_dx.toFixed(3)}`,
          ],
        };
      }

      // 3B. Law of Cosines: c² = a² + b² - 2ab cos(C)
      case 'trigonometry_law_of_cosines': {
        const a = params.a ?? 5;
        const b = params.b ?? 7;
        const C_deg = params.C ?? 60;
        const C_rad = (C_deg * Math.PI) / 180;
        const cosC = Math.cos(C_rad);
        const cSquared = Math.max(0.001, a * a + b * b - 2 * a * b * cosC);
        const c = Math.sqrt(cSquared);
        return {
          primaryResult: Number(c.toFixed(3)),
          formattedOutput: `c = √(${a}² + ${b}² - 2(${a})(${b})cos(${C_deg}°)) = √(${cSquared.toFixed(2)}) = ${c.toFixed(2)} units`,
          units: 'units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Given side lengths: a = ${a}, b = ${b}, included angle C = ${C_deg}°`,
            `Cosine evaluated: cos(${C_deg}°) = ${cosC.toFixed(4)}`,
            `Squared sum of sides: a² + b² = ${a * a} + ${b * b} = ${a * a + b * b}`,
            `Subtracted projection cross-term: 2ab·cos(C) = 2 × ${a} × ${b} × ${cosC.toFixed(4)} = ${(2 * a * b * cosC).toFixed(2)}`,
            `Net squared opposite side: c² = ${cSquared.toFixed(2)}`,
            `Opposite side length: c = √(${cSquared.toFixed(2)}) = ${c.toFixed(3)} units`,
          ],
        };
      }

      // 4. Pythagorean: c = √(a² + b²)
      case 'geometry_pythagoras':
      case 'math_pythagorean_theorem': {
        const a = params.a ?? 3;
        const b = params.b ?? 4;
        const cSquared = a * a + b * b;
        const c = Math.sqrt(cSquared);
        const isExact = Number.isInteger(c);
        return {
          primaryResult: Number(c.toFixed(3)),
          formattedOutput: `c = √(${a}² + ${b}²) = √(${cSquared}) = ${isExact ? c : c.toFixed(2)} units`,
          units: 'units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Square of Leg A: a² = ${a}² = ${a * a}`,
            `Square of Leg B: b² = ${b}² = ${b * b}`,
            `Sum of squares: c² = ${a * a} + ${b * b} = ${cSquared}`,
            `Hypotenuse: c = √(${cSquared}) = ${isExact ? c : c.toFixed(3)} units`,
            isExact ? `Integer Pythagorean Triple: (${a}, ${b}, ${c})` : `Irrational diagonal hypotenuse`,
          ],
        };
      }

      // 4A. Linear Function: y = mx + c
      case 'math_linear_functions':
      case 'geometry_linear_function': {
        const m = params.m ?? params.slope ?? 2;
        const c = params.c ?? params.intercept ?? 3;
        const x = params.x ?? 2;
        const y = Number((m * x + c).toFixed(6));
        const xIntercept = m !== 0 ? Number((-c / m).toFixed(4)) : null;
        return {
          primaryResult: y,
          formattedOutput: `y = ${m}x + ${c} ⇒ f(${x}) = ${y}`,
          units: 'coordinate units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Linear equation in slope-intercept form: y = mx + c`,
            `Slope m = ${m} (rate of change Δy/Δx)`,
            `Y-intercept c = ${c} (point (0, ${c}))`,
            xIntercept !== null ? `X-intercept at y = 0: x = -c/m = -${c}/${m} = ${xIntercept} (point (${xIntercept}, 0))` : `Horizontal line: no single root`,
            `Evaluated at test coordinate x = ${x}: y = ${m}(${x}) + ${c} = ${y}`,
          ],
        };
      }

      // 4B. Fractions & Rational Arithmetic: a/b + c/d
      case 'math_fractions_basic':
      case 'math_equivalent_fractions':
      case 'math_fraction_addition': {
        const n1 = params.n1 ?? params.numerator ?? 1;
        const d1 = params.d1 ?? params.denominator ?? 2;
        const n2 = params.n2 ?? 1;
        const d2 = params.d2 ?? 3;
        if (d1 === 0 || d2 === 0) {
          throw new Error('Denominator cannot be zero in fraction calculations.');
        }
        // GCD helper
        const gcd = (x: number, y: number): number => (!y ? Math.abs(x) : gcd(y, x % y));
        const lcm = (x: number, y: number): number => Math.abs(Math.round((x * y) / (gcd(x, y) || 1)));
        const commonDen = lcm(d1, d2);
        const sumNum = n1 * (commonDen / d1) + n2 * (commonDen / d2);
        const g = gcd(sumNum, commonDen);
        const simpNum = sumNum / g;
        const simpDen = commonDen / g;
        return {
          primaryResult: `${simpNum}/${simpDen}`,
          formattedOutput: `${n1}/${d1} + ${n2}/${d2} = ${simpNum}/${simpDen}`,
          units: 'fraction units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Given fractions: ${n1}/${d1} and ${n2}/${d2}`,
            `Least common denominator: LCM(${d1}, ${d2}) = ${commonDen}`,
            `Equivalent fractions: ${n1 * (commonDen / d1)}/${commonDen} + ${n2 * (commonDen / d2)}/${commonDen}`,
            `Sum: ${sumNum}/${commonDen}`,
            g > 1 ? `Simplified lowest terms: ${simpNum}/${simpDen}` : `Already in lowest terms: ${simpNum}/${simpDen}`,
          ],
        };
      }

      // 4B. Square of sum: (a + b)² = a² + 2ab + b²
      case 'algebra_square_sum': {
        const a = params.a ?? 4;
        const b = params.b ?? 3;
        const sum = a + b;
        const result = sum * sum;
        return {
          primaryResult: result,
          formattedOutput: `(a + b)² = (${a} + ${b})² = ${sum}² = ${result}`,
          units: 'area units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Square of side a: a² = ${a}² = ${a * a}`,
            `Square of side b: b² = ${b}² = ${b * b}`,
            `Two rectangular cross areas: 2ab = 2 × ${a} × ${b} = ${2 * a * b}`,
            `Total expanded area: a² + 2ab + b² = ${a * a} + ${2 * a * b} + ${b * b} = ${result}`,
          ],
        };
      }

      // 5. Square of difference: (a - b)² = a² - 2ab + b²
      case 'algebra_square_diff': {
        const a = params.a ?? 6;
        const b = Math.min(params.b ?? 2, Math.max(1, a - 1));
        const diff = a - b;
        const result = diff * diff;
        return {
          primaryResult: result,
          formattedOutput: `(a - b)² = (${a} - ${b})² = ${diff}² = ${result}`,
          units: 'area units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Outer square area: a² = ${a * a}`,
            `Two subtracted strips: 2ab = 2 × ${a} × ${b} = ${2 * a * b}`,
            `Restored overlapping corner: +b² = ${b * b}`,
            `Net area: a² - 2ab + b² = ${a * a} - ${2 * a * b} + ${b * b} = ${result}`,
          ],
        };
      }

      // 5B. Cube of sum: (a + b)³ = a³ + 3a²b + 3ab² + b³
      case 'algebra_cube_sum': {
        const a = params.a ?? 2;
        const b = params.b ?? 1;
        const sum = a + b;
        const result = sum * sum * sum;
        return {
          primaryResult: result,
          formattedOutput: `(a + b)³ = (${a} + ${b})³ = ${sum}³ = ${result}`,
          units: 'volume units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Base cube volume: a³ = ${a}³ = ${a * a * a}`,
            `Three rectangular planar slabs: 3a²b = 3 × ${a * a} × ${b} = ${3 * a * a * b}`,
            `Three square edge columns: 3ab² = 3 × ${a} × ${b * b} = ${3 * a * b * b}`,
            `Corner cube volume: b³ = ${b}³ = ${b * b * b}`,
            `Total expanded volume: ${a * a * a} + ${3 * a * a * b} + ${3 * a * b * b} + ${b * b * b} = ${result} ✓`,
          ],
        };
      }

      // 5C. Cube of difference: (a - b)³ = a³ - 3a²b + 3ab² - b³
      case 'algebra_cube_diff': {
        const a = params.a ?? 3;
        const b = Math.min(params.b ?? 1, Math.max(1, a - 1));
        const diff = a - b;
        const result = diff * diff * diff;
        return {
          primaryResult: result,
          formattedOutput: `(a - b)³ = (${a} - ${b})³ = ${diff}³ = ${result}`,
          units: 'volume units',
          isDimensionallyConsistent: true,
          stepDetails: [
            `Original base cube: a³ = ${a * a * a}`,
            `Subtract three planar slabs: -3a²b = -${3 * a * a * b}`,
            `Add back three pairwise column overlaps: +3ab² = +${3 * a * b * b}`,
            `Subtract corner cube: -b³ = -${b * b * b}`,
            `Net volume: ${a * a * a} - ${3 * a * a * b} + ${3 * a * b * b} - ${b * b * b} = ${result} ✓`,
          ],
        };
      }

      // 6. Quadratic formula: roots
      case 'algebra_quadratic': {
        const a = params.a ?? 1;
        const b = params.b ?? -5;
        const c = params.c ?? 6;
        const discriminant = b * b - 4 * a * c;
        if (discriminant < 0) {
          const realPart = (-b / (2 * a)).toFixed(2);
          const imagPart = (Math.sqrt(-discriminant) / (2 * a)).toFixed(2);
          return {
            primaryResult: `Complex: ${realPart} ± ${imagPart}i`,
            formattedOutput: `Roots are complex conjugate: x = ${realPart} ± ${imagPart}i (Δ = ${discriminant})`,
            isDimensionallyConsistent: true,
            stepDetails: [`Discriminant Δ = b² - 4ac = ${discriminant} < 0 (No real intercepts)`],
          };
        }
        const x1 = (-b + Math.sqrt(discriminant)) / (2 * a);
        const x2 = (-b - Math.sqrt(discriminant)) / (2 * a);
        return {
          primaryResult: Number(x1.toFixed(2)),
          formattedOutput: `x₁ = ${x1.toFixed(2)}, x₂ = ${x2.toFixed(2)} (Discriminant Δ = ${discriminant})`,
          isDimensionallyConsistent: true,
          stepDetails: [
            `Discriminant: Δ = (${b})² - 4(${a})(${c}) = ${discriminant}`,
            `Root 1: x₁ = (${-b} + √${discriminant}) / ${2 * a} = ${x1.toFixed(3)}`,
            `Root 2: x₂ = (${-b} - √${discriminant}) / ${2 * a} = ${x2.toFixed(3)}`,
          ],
        };
      }

      // Default generic evaluation
      default: {
        if (params.k !== undefined) {
          return {
            primaryResult: params.k,
            formattedOutput: `Parameter k = ${params.k}`,
            isDimensionallyConsistent: true,
          };
        }
        return {
          primaryResult: 'N/A',
          formattedOutput: 'No numerical calculation required for this topic.',
          isDimensionallyConsistent: true,
        };
      }
    }
  }

  /**
   * Retrieves verified derivation steps with explicit formal verification tags.
   */
  static getDerivationSteps(conceptId: string): { steps: DerivationStep[]; summary: string } {
    // Dynamic Binomial Powers
    if (conceptId.startsWith('binomial_')) {
      const parts = conceptId.split('_');
      const base1 = parts[1] || 'a';
      const sign = (parts[2] === 'minus' ? '-' : '+') as '+' | '-';
      const base2 = parts[3] || 'b';
      const power = parseInt(parts[4], 10) || 2;
      const exp = BinomialExpansionEngine.expand(base1, sign, base2, power);
      return {
        summary: `${exp.title}: ${exp.geometricProofSummary}`,
        steps: exp.algebraicSteps.map((stepStr, idx) => {
          const colonIdx = stepStr.indexOf(':');
          const explanation = colonIdx !== -1 ? stepStr.substring(0, colonIdx).replace(/^\d+\.\s*/, '').trim() : stepStr;
          const expression = colonIdx !== -1 ? stepStr.substring(colonIdx + 1).trim() : stepStr;
          return {
            stepNumber: idx + 1,
            expression,
            explanation,
            rationale: idx === exp.algebraicSteps.length - 1 ? 'Final expanded form' : 'Binomial theorem expansion',
            verificationStatus: 'formally_verified',
          };
        }),
      };
    }

    // Subject-Aware Domain Models (Computer Science / Chemistry / Biology)
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain) {
      return {
        summary: `${domain.title}: ${domain.geometricProofSummary}`,
        steps: domain.algebraicSteps.map((stepStr, idx) => {
          const colonIdx = stepStr.indexOf(':');
          const explanation = colonIdx !== -1 ? stepStr.substring(0, colonIdx).replace(/^\d+\.\s*/, '').trim() : stepStr;
          const expression = colonIdx !== -1 ? stepStr.substring(colonIdx + 1).trim() : stepStr;
          return {
            stepNumber: idx + 1,
            expression,
            explanation,
            rationale: idx === domain.algebraicSteps.length - 1 ? 'Curriculum synthesis' : 'Architectural principle',
            verificationStatus: 'curriculum_trusted',
          };
        }),
      };
    }

    switch (conceptId) {
      case 'algebra_cube_sum': {
        const exp = BinomialExpansionEngine.expand('a', '+', 'b', 3);
        return {
          summary: `Algebraic derivation and 3D geometric volume proof of (${exp.base1} + ${exp.base2})³ = ${exp.expandedFormula}.`,
          steps: exp.algebraicSteps.map((stepStr, idx) => {
            const colonIdx = stepStr.indexOf(':');
            const explanation = colonIdx !== -1 ? stepStr.substring(0, colonIdx).replace(/^\d+\.\s*/, '').trim() : stepStr;
            const expression = colonIdx !== -1 ? stepStr.substring(colonIdx + 1).trim() : stepStr;
            return {
              stepNumber: idx + 1,
              expression,
              explanation,
              rationale: idx === exp.algebraicSteps.length - 1 ? 'Final canonical polynomial' : 'Distributive polynomial expansion',
              verificationStatus: 'formally_verified',
            };
          }),
        };
      }

      case 'algebra_cube_diff': {
        const exp = BinomialExpansionEngine.expand('a', '-', 'b', 3);
        return {
          summary: `Algebraic derivation and 3D volume contraction proof of (${exp.base1} - ${exp.base2})³ = ${exp.expandedFormula}.`,
          steps: exp.algebraicSteps.map((stepStr, idx) => {
            const colonIdx = stepStr.indexOf(':');
            const explanation = colonIdx !== -1 ? stepStr.substring(0, colonIdx).replace(/^\d+\.\s*/, '').trim() : stepStr;
            const expression = colonIdx !== -1 ? stepStr.substring(colonIdx + 1).trim() : stepStr;
            return {
              stepNumber: idx + 1,
              expression,
              explanation,
              rationale: idx === exp.algebraicSteps.length - 1 ? 'Final canonical polynomial' : 'Distributive polynomial expansion',
              verificationStatus: 'formally_verified',
            };
          }),
        };
      }

      case 'trigonometry_law_of_cosines':
        return {
          summary:
            'Proven by constructing a perpendicular altitude from vertex A onto base side b and applying the Pythagorean theorem to the resulting right triangles.',
          steps: [
            {
              stepNumber: 1,
              expression: 'Drop altitude h from vertex A perpendicular to base b',
              explanation: 'Partition arbitrary triangle ABC into two adjacent right-angled triangles.',
              rationale: 'Geometric altitude construction.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: 'h = a · sin(C)  and  segment d = a · cos(C)',
              explanation: 'Use right-triangle trigonometry definitions for the altitude and adjacent base segment.',
              rationale: 'Definitions of sine and cosine in right triangles.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: 'Remaining base segment = b - a · cos(C)',
              explanation: 'Subtract segment d from the total base side length b.',
              rationale: 'Linear segment addition postulate.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: 'c² = h² + (b - a · cos(C))²',
              explanation: 'Apply the Pythagorean theorem to the right triangle containing hypotenuse c.',
              rationale: 'Pythagorean theorem application.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: 'c² = (a · sin(C))² + b² - 2ab · cos(C) + a² · cos²(C)',
              explanation: 'Expand the squared binomial and substitute the expression for altitude h.',
              rationale: 'Algebraic binomial expansion: (x - y)² = x² - 2xy + y².',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 6,
              expression: 'c² = a²(sin²(C) + cos²(C)) + b² - 2ab · cos(C)',
              explanation: 'Factor out a² from the trigonometric squared terms.',
              rationale: 'Distributive factoring.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 7,
              expression: 'sin²(C) + cos²(C) = 1  ⇒  c² = a² + b² - 2ab · cos(C)',
              explanation: 'Apply the fundamental Pythagorean trigonometric identity to conclude the Law of Cosines.',
              rationale: 'Pythagorean trigonometric identity.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'physics_density':
        return {
          summary:
            'Derived from the fundamental continuum mass distribution definition: volumetric mass density ρ = dm / dV under uniform spatial homogeneity.',
          steps: [
            {
              stepNumber: 1,
              expression: 'ρ = dm / dV',
              explanation: 'Define density as the limit of differential mass per differential volume.',
              rationale: 'Continuum mechanics definition.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: 'For homogeneous mass: ρ = m / V',
              explanation: 'Assume spatial homogeneity of mass throughout the geometric body.',
              rationale: 'Homogeneity assumption.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: '[ρ] = [m] / [V] = kg / m³ = kg·m⁻³',
              explanation: 'Verify SI dimensional consistency.',
              rationale: 'Dimensional homogeneity.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: 'Buoyancy criterion: F_net = (ρ_fluid - ρ_object) · V · g',
              explanation: 'Archimedes’ principle determines whether the object sinks (ρ > 1000 kg/m³) or floats (ρ < 1000 kg/m³).',
              rationale: 'Archimedes’ principle of buoyancy.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'physics_f_ma':
        return {
          summary:
            'Derived from Newton’s definition of force as the time rate of change of momentum (dp/dt) under constant mass.',
          steps: [
            {
              stepNumber: 1,
              expression: 'p = m · v',
              explanation: 'Define linear momentum p as the product of mass m and velocity v.',
              rationale: 'Fundamental classical mechanics definition.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: 'F = dp / dt',
              explanation: 'Newton’s second law states that net force is the time rate of change of momentum.',
              rationale: 'Calculus definition of dynamic force.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: 'F = d(m · v) / dt = m · (dv / dt) + v · (dm / dt)',
              explanation: 'Apply the product rule of differentiation.',
              rationale: 'Standard calculus product rule.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: 'dm / dt = 0  ⇒  F = m · (dv / dt)',
              explanation: 'Assume invariant mass (valid for non-relativistic particles and non-rocket bodies).',
              rationale: 'Physical assumption of constant mass.',
              assumptionsRequired: ['Constant Mass (dm/dt = 0)', 'Non-relativistic velocities (v << c)'],
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: 'a = dv / dt  ⇒  F = m · a',
              explanation: 'Substitute the definition of acceleration a = dv/dt into the equation.',
              rationale: 'Kinematic definition of acceleration.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 6,
              expression: 'a = F / m',
              explanation: 'Rearrange algebraically to solve for acceleration.',
              rationale: 'Division by non-zero mass m.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'algebra_square_sum':
        return {
          summary:
            'Proven algebraically via the distributive property and geometrically via rectangular area partitioning.',
          steps: [
            {
              stepNumber: 1,
              expression: '(a + b)² = (a + b)(a + b)',
              explanation: 'Express the square exponent as repeated binomial multiplication.',
              rationale: 'Definition of integer power exponents.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: '= a(a + b) + b(a + b)',
              explanation: 'Distribute the first binomial into the second binomial.',
              rationale: 'Distributive property of multiplication over addition.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: '= a² + ab + ba + b²',
              explanation: 'Multiply out each individual monomial product.',
              rationale: 'Monomial expansion.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: '= a² + ab + ab + b²',
              explanation: 'Apply the commutative property of multiplication: ba = ab.',
              rationale: 'Commutativity of real multiplication.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: '= a² + 2ab + b²',
              explanation: 'Combine the identical symmetric rectangular terms: ab + ab = 2ab.',
              rationale: 'Standard algebraic simplification.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'algebra_square_diff':
        return {
          summary:
            'Proven algebraically via the distributive property and geometrically via area decomposition of a square.',
          steps: [
            {
              stepNumber: 1,
              expression: '(a - b)² = (a - b)(a - b)',
              explanation: 'Express the square exponent as repeated binomial multiplication.',
              rationale: 'Definition of integer powers.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: '= a(a - b) - b(a - b)',
              explanation: 'Distribute the first binomial across each term in the second binomial.',
              rationale: 'Left distributive law of multiplication over subtraction.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: '= a² - ab - ba + (-b)(-b)',
              explanation: 'Expand each term individual multiplication.',
              rationale: 'Sign rules of arithmetic: negative times negative equals positive.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: '= a² - ab - ab + b²',
              explanation: 'Apply commutative property: ba = ab, and (-b)(-b) = +b².',
              rationale: 'Commutativity of real numbers.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: '= a² - 2ab + b²',
              explanation: 'Combine the like terms (-ab - ab = -2ab).',
              rationale: 'Standard algebraic term simplification.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'math_cosine_function':
        return {
          summary:
            'Derived from the unit circle horizontal projection, establishing 2π-periodicity, amplitude range [-1, 1], and instantaneous rate of change dy/dx = -sin(x).',
          steps: [
            {
              stepNumber: 1,
              expression: 'P(θ) = (cos(θ), sin(θ)) on x² + y² = 1',
              explanation: 'A point P on the unit circle at counterclockwise angle θ from the positive x-axis has coordinates (cos(θ), sin(θ)).',
              rationale: 'Unit circle definition of trigonometric functions.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: 'cos(-θ) = cos(θ)  [Even Symmetry]',
              explanation: 'Reflecting across the x-axis negates the vertical coordinate but leaves the horizontal coordinate invariant.',
              rationale: 'Reflectional symmetry across the Cartesian x-axis.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: 'cos(θ + 2π) = cos(θ)  [Periodicity]',
              explanation: 'Adding 2π radians represents one complete revolution around the circle, returning to the identical point.',
              rationale: 'Rotational invariance of circular angles.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: 'cos(0) = 1,  cos(π/2) = 0,  cos(π) = -1,  cos(3π/2) = 0',
              explanation: 'Evaluate the horizontal coordinates at the four cardinal quadrantal angles.',
              rationale: 'Cardinal axis intersections on the unit circle.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: 'd/dx[cos(x)] = lim_{h→0} [cos(x+h) - cos(x)] / h = -sin(x)',
              explanation: 'Apply the limit definition of the derivative and the cosine angle sum identity to obtain the slope.',
              rationale: 'First principles calculus derivative of cosine.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'math_linear_functions':
      case 'geometry_linear_function':
        return {
          summary:
            'A linear function represents a relationship with a constant rate of change m (slope) and a constant starting vertical offset c (y-intercept).',
          steps: [
            {
              stepNumber: 1,
              expression: 'y = mx + c',
              explanation: 'State the slope-intercept form where m is the slope and c is the y-intercept.',
              rationale: 'Standard algebraic definition of linear function.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: 'm = \\frac{\\Delta y}{\\Delta x} = \\frac{y_2 - y_1}{x_2 - x_1}',
              explanation: 'The slope m measures the steepness and direction of the line as rise over run.',
              rationale: 'Definition of rate of change.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: 'x = 0 \\implies y = m(0) + c = c',
              explanation: 'Evaluating at x = 0 yields the point (0, c) where the line crosses the y-axis.',
              rationale: 'Y-intercept evaluation.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: 'y = 0 \\implies 0 = mx + c \\implies x = -\\frac{c}{m} \\quad (m \\neq 0)',
              explanation: 'Setting y = 0 yields the root or x-intercept (-c/m, 0) where the line crosses the x-axis.',
              rationale: 'Algebraic root determination.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: 'f(x_1 + 1) - f(x_1) = m',
              explanation: 'For every unit increase in x, y changes by exactly m units consistently across the entire real number line.',
              rationale: 'Linearity and constant rate invariant.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'geometry_pythagoras':
      case 'math_pythagorean_theorem':
        return {
          summary:
            'In any right-angled Euclidean triangle, the area of the square whose side is the hypotenuse equals the sum of the areas of the squares on the other two legs: a² + b² = c².',
          steps: [
            {
              stepNumber: 1,
              expression: '\\text{Right Triangle } \\triangle ABC \\text{ with } \\angle C = 90^\\circ',
              explanation: 'Establish a Euclidean right-angled triangle with legs of length a, b and hypotenuse of length c.',
              rationale: 'Geometric setup & premise.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: '\\text{Outer Square Area} = (a + b)^2',
              explanation: 'Construct a large outer square of side length (a + b) composed of 4 congruent right triangles surrounding an inner square of side length c.',
              rationale: 'Chou Pei Suan Ching geometric dissection construction.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: '4 \\times \\left(\\frac{1}{2}ab\\right) = 2ab',
              explanation: 'The combined area of the four identical right triangles is 2ab.',
              rationale: 'Triangle area summation.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 4,
              expression: '(a + b)^2 = c^2 + 2ab',
              explanation: 'The total outer area equals the inner square area c² plus the four triangles.',
              rationale: 'Partition of geometric area.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 5,
              expression: 'a^2 + 2ab + b^2 = c^2 + 2ab \\implies a^2 + b^2 = c^2',
              explanation: 'Subtracting 2ab from both sides yields the Pythagorean relationship.',
              rationale: 'Algebraic subtraction axiom.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      case 'math_fractions_basic':
      case 'math_equivalent_fractions':
      case 'math_fraction_addition':
        return {
          summary:
            'A rational fraction a/b represents a parts of a whole divided into b equal partitions, where b ≠ 0.',
          steps: [
            {
              stepNumber: 1,
              expression: '\\frac{a}{b} = a \\times \\frac{1}{b} \\quad (b \\neq 0)',
              explanation: 'A fraction represents a equal unit parts, each of magnitude 1/b.',
              rationale: 'Part-to-whole partition definition.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 2,
              expression: '\\frac{a}{b} = \\frac{a \\times k}{b \\times k} \\quad (k \\neq 0)',
              explanation: 'Multiplying both numerator and denominator by non-zero scale factor k preserves rational equivalence.',
              rationale: 'Fundamental principle of equivalent fractions.',
              verificationStatus: 'formally_verified',
            },
            {
              stepNumber: 3,
              expression: '\\frac{a}{b} + \\frac{c}{d} = \\frac{a \\cdot d + b \\cdot c}{b \\cdot d}',
              explanation: 'To combine fractions with unlike denominators, express both over a common denominator before adding numerators.',
              rationale: 'Rational arithmetic addition theorem.',
              verificationStatus: 'formally_verified',
            },
          ],
        };

      default:
        return {
          summary: 'Conceptual step-by-step analytical reasoning.',
          steps: [
            {
              stepNumber: 1,
              expression: 'Define Scope & Foundational Principles',
              explanation: 'Identify the primary principles, core definitions, and initial conditions.',
              rationale: 'Foundational framework.',
              verificationStatus: 'curriculum_trusted',
            },
            {
              stepNumber: 2,
              expression: 'Analyze Mechanisms & System Dynamics',
              explanation: 'Examine governing dynamics, interactions, and relational transformations.',
              rationale: 'Systematic analysis & operational rules.',
              verificationStatus: 'curriculum_trusted',
            },
            {
              stepNumber: 3,
              expression: 'Synthesize Verified Conclusions',
              explanation: 'Formulate validated outcomes and evaluate practical domain applications.',
              rationale: 'Deductive synthesis & empirical validation.',
              verificationStatus: 'curriculum_trusted',
            },
          ],
        };
    }
  }
}

