/**
 * VisiOS — Universal Scientific & Mathematical Problem Solver
 * Extracts formulas, physical parameters, and word-problem conditions from natural language,
 * performs deterministic calculations, and produces rigorous step-by-step derivations
 * without echoing user prompts or producing repetitive loops.
 */

import { VariableDescriptor } from './types';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';

export interface SolvedProblemResult {
  conceptId: string;
  topic: 'physics' | 'algebra' | 'geometry' | 'calculus' | 'chemistry' | 'algorithm';
  title: string;
  conciseFormula: string;
  solvedAnswer: string;
  primaryResult: number | string;
  units: string;
  intuition: string;
  realWorldApplication: string;
  prerequisites: string[];
  algebraicSteps: string[];
  geometricProofSummary: string;
  variables: VariableDescriptor[];
  calculatedParameters: Record<string, number>;
}

export class UniversalProblemSolver {
  /**
   * Attempts to parse and solve any scientific problem or natural language prompt.
   * Returns a complete mathematical solution, or null if unhandled.
   */
  public static solve(rawText: string): SolvedProblemResult | null {
    if (!rawText || rawText.trim().length === 0) return null;

    const text = rawText.trim();

    // 0. Domain Knowledge Engine (Computer Science / Data Structures / Chemistry / Biology)
    const domainMatch = DomainKnowledgeEngine.match(text);
    if (domainMatch) {
      return {
        conceptId: domainMatch.conceptId,
        topic: domainMatch.category === 'concept' ? 'algebra' : domainMatch.category,
        title: domainMatch.title,
        conciseFormula: domainMatch.conciseFormula,
        solvedAnswer: domainMatch.solvedAnswer,
        primaryResult: domainMatch.calculatedParameters.N ?? domainMatch.calculatedParameters.Z ?? 1,
        units: 'units',
        intuition: domainMatch.intuition,
        realWorldApplication: domainMatch.realWorldApplication,
        prerequisites: domainMatch.prerequisites,
        algebraicSteps: domainMatch.algebraicSteps,
        geometricProofSummary: domainMatch.geometricProofSummary,
        variables: domainMatch.variables,
        calculatedParameters: domainMatch.calculatedParameters,
      };
    }

    const lower = text.toLowerCase();

    // 1. Density: ρ = m / V (or mass / volume)
    if (
      lower.includes('density') ||
      lower.includes('mass / volume') ||
      lower.includes('mass/volume') ||
      lower.includes('m / v') ||
      lower.includes('m/v')
    ) {
      return this.solveDensityProblem(text);
    }

    // 2. Newton's Second Law & Force: F = m · a
    if (
      lower.includes('f = ma') ||
      lower.includes('f=ma') ||
      (lower.includes('force') && lower.includes('mass') && (lower.includes('acceleration') || lower.includes('accelerate')))
    ) {
      return this.solveForceProblem(text);
    }

    // 3. First Kinematics: v = u + at or Uniform Acceleration
    if (
      lower.includes('v = u + at') ||
      lower.includes('v=u+at') ||
      (lower.includes('initial velocity') && lower.includes('acceleration'))
    ) {
      return this.solveKinematicsProblem(text);
    }

    // 4. Kinetic Energy: KE = 0.5 · m · v²
    if (
      lower.includes('kinetic energy') ||
      lower.includes('ke = 1/2') ||
      lower.includes('ke = 0.5')
    ) {
      return this.solveKineticEnergyProblem(text);
    }

    // 5. Ohm's Law: V = I · R
    if (
      lower.includes("ohm's law") ||
      lower.includes('ohms law') ||
      lower.includes('v = ir') ||
      lower.includes('v=ir') ||
      (lower.includes('voltage') && lower.includes('resistance'))
    ) {
      return this.solveOhmsLawProblem(text);
    }

    // 6. Pressure: P = F / A
    if (
      lower.includes('pressure') &&
      (lower.includes('force') || lower.includes('area') || lower.includes('f / a') || lower.includes('f/a'))
    ) {
      return this.solvePressureProblem(text);
    }

    // 7. General A = B / C or A = B * C formula with numbers in prompt
    const ratioProblem = this.solveGenericRatioProblem(text);
    if (ratioProblem) return ratioProblem;

    return null;
  }

  /**
   * Solves Density problems: ρ = m / V
   */
  private static solveDensityProblem(text: string): SolvedProblemResult {
    // Extract numbers with units
    let mass = this.extractNumberWithUnit(text, ['kg', 'kilograms?', 'kilogram', 'g', 'grams?']);
    let volume = this.extractNumberWithUnit(text, ['m³', 'm\\^3', 'm3', 'cubic meters?', 'cm³', 'cm\\^3', 'liters?', 'l']);

    // Fallback: extract generic numbers if user wrote "6 kg ... 0.002 m³"
    if (mass === null) {
      const matchKg = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|g)\b/i);
      if (matchKg) mass = parseFloat(matchKg[1]);
    }
    if (volume === null) {
      const matchVol = text.match(/(\d+(?:\.\d+)?)\s*(?:m[³3]|m\^3)\b/i);
      if (matchVol) volume = parseFloat(matchVol[1]);
    }

    // Defaults if only formula was given
    const m = mass !== null && mass > 0 ? mass : 6;
    const v = volume !== null && volume > 0 ? volume : 0.002;

    const density = Math.round((m / v) * 100) / 100;
    const densityGcm3 = Math.round((density / 1000) * 100) / 100;

    const sinksInWater = density > 1000;
    const buoyancyNote = sinksInWater
      ? `Because the density (${density} kg/m³) is greater than pure water (1,000 kg/m³), the object will sink.`
      : `Because the density (${density} kg/m³) is less than pure water (1,000 kg/m³), the object will float.`;

    return {
      conceptId: 'physics_density',
      topic: 'physics',
      title: 'Density: ρ = m / V',
      conciseFormula: 'ρ = m / V',
      solvedAnswer: `ρ = ${density} kg/m³ (${densityGcm3} g/cm³)`,
      primaryResult: density,
      units: 'kg/m³',
      intuition: `Density quantifies how tightly matter is packed into a given geometric volume. ${buoyancyNote}`,
      realWorldApplication:
        'Naval architecture (ship buoyancy and hull stability), material science (alloy purity testing), geophysics (Earth crust layering), and meteorology (atmospheric convection).',
      prerequisites: ['Mass Measurement (SI unit kg)', 'Volume in 3D Space (m³)', 'Division & Ratios'],
      algebraicSteps: [
        '1. State fundamental definition: Density (ρ) = Mass (m) / Volume (V)',
        `2. Identify given parameters: Mass m = ${m} kg, Volume V = ${v} m³`,
        `3. Substitute parameters into quotient: ρ = (${m} kg) / (${v} m³)`,
        `4. Calculate density value: ρ = ${density} kg/m³ (= ${densityGcm3} g/cm³)`,
        `5. Physical Buoyancy Assessment: ρ = ${density} kg/m³ ${sinksInWater ? '> 1000 kg/m³ ⇒ Sinks in water' : '< 1000 kg/m³ ⇒ Floats in water'} ✓`,
      ],
      geometricProofSummary: `3D Volume Dissection: An object occupying an enclosed volume of ${v} m³ containing ${m} kg of mass. In a linear Mass vs Volume plot, density corresponds exactly to the slope (dM/dV = ${density} kg/m³).`,
      variables: [
        {
          symbol: 'm',
          name: 'Mass',
          unit: 'kg',
          dimension: 'M',
          description: 'Total quantity of matter contained within the body.',
          defaultValue: m,
          min: 0.1,
          max: 100,
          step: 0.5,
        },
        {
          symbol: 'V',
          name: 'Volume',
          unit: 'm³',
          dimension: 'L³',
          description: 'Three-dimensional geometric space occupied by the body.',
          defaultValue: v,
          min: 0.0005,
          max: 0.05,
          step: 0.0005,
        },
        {
          symbol: 'rho',
          name: 'Density (ρ)',
          unit: 'kg/m³',
          dimension: 'M·L⁻³',
          description: 'Calculated volumetric mass density.',
          defaultValue: density,
          min: 100,
          max: 20000,
          step: 50,
        },
      ],
      calculatedParameters: { m, V: v, rho: density },
    };
  }

  /**
   * Solves Force / Newton's 2nd Law: F = m · a
   */
  private static solveForceProblem(text: string): SolvedProblemResult {
    const fMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:n|newtons?)\b/i);
    const mMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)\b/i);
    const aMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m\/s²|m\/s\^2|m\/s2)\b/i);

    let F = fMatch ? parseFloat(fMatch[1]) : 10;
    let m = mMatch ? parseFloat(mMatch[1]) : 2;
    let a = aMatch ? parseFloat(aMatch[1]) : 5;

    let solvedAnswer = '';
    let steps: string[] = [];

    if (fMatch && mMatch && !aMatch) {
      a = Math.round((F / m) * 100) / 100;
      solvedAnswer = `a = F / m = ${F} N / ${m} kg = ${a} m/s²`;
      steps = [
        '1. State Newton’s Second Law: F = m · a',
        '2. Isolate unknown acceleration: a = F / m',
        `3. Substitute values: a = ${F} N / ${m} kg`,
        `4. Calculate acceleration: a = ${a} m/s² ✓`,
      ];
    } else if (mMatch && aMatch && !fMatch) {
      F = Math.round((m * a) * 100) / 100;
      solvedAnswer = `F = m · a = ${m} kg × ${a} m/s² = ${F} N`;
      steps = [
        '1. State Newton’s Second Law: F = m · a',
        `2. Substitute values: F = ${m} kg × ${a} m/s²`,
        `3. Calculate required force: F = ${F} N ✓`,
      ];
    } else {
      a = Math.round((F / m) * 100) / 100;
      solvedAnswer = `a = ${a} m/s² (for F = ${F} N, m = ${m} kg)`;
      steps = [
        '1. State Newton’s Second Law: F = m · a',
        '2. Isolate acceleration: a = F / m',
        `3. Substitute values: a = ${F} N / ${m} kg`,
        `4. Calculate result: a = ${a} m/s² ✓`,
      ];
    }

    return {
      conceptId: 'physics_f_ma',
      topic: 'physics',
      title: "Newton's Second Law: F = m · a",
      conciseFormula: 'F = m · a',
      solvedAnswer,
      primaryResult: a,
      units: 'm/s²',
      intuition:
        'Force produces proportional acceleration inversely opposed by inertial mass. Doubling the applied force doubles acceleration; doubling the mass cuts acceleration in half.',
      realWorldApplication:
        'Automotive vehicle crash testing, aerospace rocket booster staging, robotic manipulator joint torque control.',
      prerequisites: ['Vector Quantities', 'Inertial Mass', 'Newton’s First Law'],
      algebraicSteps: steps,
      geometricProofSummary:
        'Vector force diagram: Net force vector acts parallel to resultant linear acceleration vector, scaled by invariant mass scalar m.',
      variables: [
        { symbol: 'F', name: 'Net Force', unit: 'N', description: 'Net external force vector magnitude', defaultValue: F, min: 1, max: 100, step: 1 },
        { symbol: 'm', name: 'Mass', unit: 'kg', description: 'Inertial mass resistance', defaultValue: m, min: 0.1, max: 50, step: 0.5 },
        { symbol: 'a', name: 'Acceleration', unit: 'm/s²', description: 'Resultant linear acceleration rate', defaultValue: a, min: 0.1, max: 50, step: 0.1 },
      ],
      calculatedParameters: { F, m, a },
    };
  }

  /**
   * Solves Kinematics: v = u + at
   */
  private static solveKinematicsProblem(text: string): SolvedProblemResult {
    const uMatch = text.match(/(?:u|initial\s*velocity|starts?\s*at)\s*=?\s*(\d+(?:\.\d+)?)/i);
    const aMatch = text.match(/(?:a|acceleration)\s*=?\s*(\d+(?:\.\d+)?)/i);
    const tMatch = text.match(/(?:t|time)\s*=?\s*(\d+(?:\.\d+)?)/i);

    const u = uMatch ? parseFloat(uMatch[1]) : 10;
    const a = aMatch ? parseFloat(aMatch[1]) : 2;
    const t = tMatch ? parseFloat(tMatch[1]) : 5;

    const v = Math.round((u + a * t) * 100) / 100;

    return {
      conceptId: 'physics_kinematics_v_u_at',
      topic: 'physics',
      title: 'First Kinematic Equation: v = u + a · t',
      conciseFormula: 'v = u + a · t',
      solvedAnswer: `v = ${u} + (${a} × ${t}) = ${v} m/s`,
      primaryResult: v,
      units: 'm/s',
      intuition: 'Instantaneous velocity is the sum of initial starting speed and velocity gained from uniform acceleration over time t.',
      realWorldApplication: 'Vehicle stopping distances, runway takeoff speeds, projectile launch trajectories.',
      prerequisites: ['Linear Functions', 'Velocity & Acceleration Definitions'],
      algebraicSteps: [
        '1. By definition of constant acceleration: a = dv / dt',
        '2. Integrate both sides: ∫ dv = ∫ a dt',
        `3. Formulate kinematic identity: v = u + a · t`,
        `4. Substitute given values: v = ${u} m/s + (${a} m/s² × ${t} s)`,
        `5. Calculate final velocity: v = ${v} m/s ✓`,
      ],
      geometricProofSummary:
        'Velocity-Time Graph: v(t) is a line starting at y-intercept u with constant slope a. The height at time t gives final velocity v.',
      variables: [
        { symbol: 'u', name: 'Initial Velocity', unit: 'm/s', defaultValue: u, min: 0, max: 100, step: 1 },
        { symbol: 'a', name: 'Acceleration', unit: 'm/s²', defaultValue: a, min: -20, max: 20, step: 0.5 },
        { symbol: 't', name: 'Time', unit: 's', defaultValue: t, min: 0.1, max: 60, step: 1 },
        { symbol: 'v', name: 'Final Velocity', unit: 'm/s', defaultValue: v, min: 0, max: 200, step: 1 },
      ],
      calculatedParameters: { u, a, t, v },
    };
  }

  /**
   * Solves Kinetic Energy: KE = 0.5 · m · v²
   */
  private static solveKineticEnergyProblem(text: string): SolvedProblemResult {
    const mMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilograms?)\b/i);
    const vMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m\/s|mps)\b/i);

    const m = mMatch ? parseFloat(mMatch[1]) : 4;
    const v = vMatch ? parseFloat(vMatch[1]) : 5;

    const ke = Math.round((0.5 * m * v * v) * 100) / 100;

    return {
      conceptId: 'physics_kinetic_energy',
      topic: 'physics',
      title: 'Kinetic Energy: KE = ½ · m · v²',
      conciseFormula: 'KE = ½ · m · v²',
      solvedAnswer: `KE = 0.5 × ${m} kg × (${v} m/s)² = ${ke} J`,
      primaryResult: ke,
      units: 'J (Joules)',
      intuition:
        'Kinetic energy scales quadratically with velocity. Doubling your speed quadruples the kinetic energy required to stop.',
      realWorldApplication: 'Automotive braking distance calculation, ballistic impact protection, hydroelectric turbine power.',
      prerequisites: ['Work-Energy Theorem', 'Quadratic Scaling'],
      algebraicSteps: [
        '1. State Work-Energy Theorem: W = ∫ F dx = ∫ m (dv/dt) dx = ∫ m v dv',
        '2. Integrate from 0 to v: KE = ½ m v²',
        `3. Substitute parameters: KE = 0.5 × ${m} kg × (${v} m/s)²`,
        `4. Compute squared speed: v² = ${v * v} m²/s²`,
        `5. Final energy output: KE = ${ke} Joules ✓`,
      ],
      geometricProofSummary:
        'Quadratic parabola: KE(v) curve grows as the square of velocity v, representing the integral area under the linear momentum curve p = mv.',
      variables: [
        { symbol: 'm', name: 'Mass', unit: 'kg', defaultValue: m, min: 0.1, max: 100, step: 1 },
        { symbol: 'v', name: 'Velocity', unit: 'm/s', defaultValue: v, min: 0, max: 100, step: 1 },
        { symbol: 'ke', name: 'Kinetic Energy', unit: 'J', defaultValue: ke, min: 0, max: 10000, step: 10 },
      ],
      calculatedParameters: { m, v, ke },
    };
  }

  /**
   * Solves Ohm's Law: V = I · R
   */
  private static solveOhmsLawProblem(text: string): SolvedProblemResult {
    const vMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:v|volts?)\b/i);
    const rMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:ohm|ohms?|ω)\b/i);
    const iMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:a|amps?|amperes?)\b/i);

    let V = vMatch ? parseFloat(vMatch[1]) : 12;
    let R = rMatch ? parseFloat(rMatch[1]) : 4;
    let I = iMatch ? parseFloat(iMatch[1]) : 3;

    let solvedAnswer = '';
    let steps: string[] = [];

    if (vMatch && rMatch && !iMatch) {
      I = Math.round((V / R) * 100) / 100;
      solvedAnswer = `I = V / R = ${V} V / ${R} Ω = ${I} A`;
      steps = [
        '1. State Ohm’s Law: V = I · R',
        '2. Isolate unknown current: I = V / R',
        `3. Substitute parameters: I = ${V} V / ${R} Ω`,
        `4. Calculate current flow: I = ${I} Amperes ✓`,
      ];
    } else if (iMatch && rMatch && !vMatch) {
      V = Math.round((I * R) * 100) / 100;
      solvedAnswer = `V = I · R = ${I} A × ${R} Ω = ${V} V`;
      steps = [
        '1. State Ohm’s Law: V = I · R',
        `2. Substitute parameters: V = ${I} A × ${R} Ω`,
        `3. Calculate potential difference: V = ${V} Volts ✓`,
      ];
    } else {
      I = Math.round((V / R) * 100) / 100;
      solvedAnswer = `I = ${I} A (for V = ${V} V, R = ${R} Ω)`;
      steps = [
        '1. State Ohm’s Law: V = I · R',
        '2. Isolate current: I = V / R',
        `3. Substitute values: I = ${V} V / ${R} Ω`,
        `4. Calculate current flow: I = ${I} Amperes ✓`,
      ];
    }

    return {
      conceptId: 'physics_ohms_law',
      topic: 'physics',
      title: "Ohm's Law: V = I · R",
      conciseFormula: 'V = I · R',
      solvedAnswer,
      primaryResult: I,
      units: 'A (Amperes)',
      intuition:
        'Voltage acts as electrical pressure driving charge, while electrical resistance opposes current flow.',
      realWorldApplication: 'Integrated circuit design, power grid voltage regulation, household fuse rating.',
      prerequisites: ['Electric Potential', 'Charge Flow Rate', 'Resistance'],
      algebraicSteps: steps,
      geometricProofSummary:
        'Linear V-I characteristic curve: Current is directly proportional to voltage with slope equal to conductance G = 1/R.',
      variables: [
        { symbol: 'V', name: 'Voltage', unit: 'V', defaultValue: V, min: 1, max: 240, step: 1 },
        { symbol: 'R', name: 'Resistance', unit: 'Ω', defaultValue: R, min: 0.1, max: 1000, step: 1 },
        { symbol: 'I', name: 'Current', unit: 'A', defaultValue: I, min: 0.01, max: 50, step: 0.1 },
      ],
      calculatedParameters: { V, R, I },
    };
  }

  /**
   * Solves Pressure: P = F / A
   */
  private static solvePressureProblem(text: string): SolvedProblemResult {
    const fMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:n|newtons?)\b/i);
    const aMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:m²|m\^2|m2|sq\s*meters?)\b/i);

    const F = fMatch ? parseFloat(fMatch[1]) : 500;
    const A = aMatch ? parseFloat(aMatch[1]) : 0.2;

    const P = Math.round((F / A) * 100) / 100;

    return {
      conceptId: 'physics_pressure',
      topic: 'physics',
      title: 'Pressure: P = F / A',
      conciseFormula: 'P = F / A',
      solvedAnswer: `P = ${F} N / ${A} m² = ${P} Pa`,
      primaryResult: P,
      units: 'Pa (Pascals)',
      intuition:
        'Pressure measures force distributed per unit area. Spreading force over a larger area drastically reduces pressure.',
      realWorldApplication: 'Hydraulic jacks, snowshoes distributing body weight, atmospheric barometric pressure.',
      prerequisites: ['Force Definition', '2D Surface Area'],
      algebraicSteps: [
        '1. State fundamental definition: Pressure (P) = Force (F) / Area (A)',
        `2. Identify given parameters: Force F = ${F} N, Surface Area A = ${A} m²`,
        `3. Substitute parameters: P = ${F} N / ${A} m²`,
        `4. Calculate pressure quotient: P = ${P} Pascals (N/m²) ✓`,
      ],
      geometricProofSummary:
        'Force distribution over planar surface area: Pressure corresponds to normal perpendicular force density per square meter.',
      variables: [
        { symbol: 'F', name: 'Force', unit: 'N', defaultValue: F, min: 1, max: 5000, step: 10 },
        { symbol: 'A', name: 'Surface Area', unit: 'm²', defaultValue: A, min: 0.01, max: 10, step: 0.05 },
        { symbol: 'P', name: 'Pressure', unit: 'Pa', defaultValue: P, min: 10, max: 50000, step: 50 },
      ],
      calculatedParameters: { F, A, P },
    };
  }

  /**
   * Generic Ratio or Product solver: scans for "X = Y / Z" or "X = Y * Z"
   */
  private static solveGenericRatioProblem(text: string): SolvedProblemResult | null {
    // Check if input defines a formula pattern: name = numerator / denominator
    const match = text.match(/([a-zA-Z\s]+)\s*=\s*([a-zA-Z\s]+)\s*\/\s*([a-zA-Z\s]+)/);
    if (!match) return null;

    const varName = match[1].trim();
    const numName = match[2].trim();
    const denName = match[3].trim();

    // Look for two numbers in the rest of the text
    const numbers = text.match(/\b\d+(?:\.\d+)?\b/g);
    if (!numbers || numbers.length < 2) return null;

    const val1 = parseFloat(numbers[0]);
    const val2 = parseFloat(numbers[1]);
    if (val2 === 0) return null;

    const result = Math.round((val1 / val2) * 100) / 100;

    return {
      conceptId: `generic_ratio_${varName.replace(/\s+/g, '_').toLowerCase()}`,
      topic: 'physics',
      title: `${varName}: ${varName} = ${numName} / ${denName}`,
      conciseFormula: `${varName} = ${numName} / ${denName}`,
      solvedAnswer: `${varName} = ${val1} / ${val2} = ${result}`,
      primaryResult: result,
      units: 'units',
      intuition: `Calculates the ratio relationship of ${numName} distributed across ${denName}.`,
      realWorldApplication: 'Foundational dimensional analysis and engineering proportionality.',
      prerequisites: ['Ratios and Proportions', 'SI Unit Dimensional Analysis'],
      algebraicSteps: [
        `1. Identify formula relationship: ${varName} = ${numName} / ${denName}`,
        `2. Extract given quantities: ${numName} = ${val1}, ${denName} = ${val2}`,
        `3. Substitute into formula: ${varName} = ${val1} / ${val2}`,
        `4. Compute resultant ratio: ${varName} = ${result} ✓`,
      ],
      geometricProofSummary: `Linear proportion: ${varName} represents the rate of change of ${numName} with respect to ${denName}.`,
      variables: [
        { symbol: 'num', name: numName, unit: 'units', defaultValue: val1, min: 0.1, max: 100, step: 0.5 },
        { symbol: 'den', name: denName, unit: 'units', defaultValue: val2, min: 0.001, max: 50, step: 0.1 },
      ],
      calculatedParameters: { num: val1, den: val2, result },
    };
  }

  /**
   * Helper extracting a number immediately associated with a specific unit regex
   */
  private static extractNumberWithUnit(text: string, units: string[]): number | null {
    const pattern = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:${units.join('|')})\\b`, 'i');
    const match = text.match(pattern);
    return match ? parseFloat(match[1]) : null;
  }
}

