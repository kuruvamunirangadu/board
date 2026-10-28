import { InputInterpretation, VariableDescriptor, InputCategory } from './types';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { UniversalProblemSolver } from './UniversalProblemSolver';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';

export class UniversalInputInterpreter {
  /**
   * Deterministically interprets, classifies, and extracts variables from user input.
   */
  static interpret(rawInput: string): InputInterpretation {
    const trimmed = rawInput.trim();
    if (!trimmed) {
      return this.createEmptyFallback();
    }

    // 0A. Subject-Aware Domain Knowledge Engine (Computer Science / Data Structures / Chemistry / Biology)
    const domainMatch = DomainKnowledgeEngine.match(trimmed);
    if (domainMatch) {
      return {
        originalInput: rawInput,
        normalizedInput: `${domainMatch.conciseFormula} = ${domainMatch.solvedAnswer}`,
        category: domainMatch.category,
        subject: domainMatch.subject,
        title: domainMatch.title,
        summary: domainMatch.intuition,
        variables: domainMatch.variables,
        prerequisites: domainMatch.prerequisites,
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 0B. Universal Problem Solver (Natural Language Word Problems & Physics: Density, Force, etc.)
    const prob = UniversalProblemSolver.solve(trimmed);
    if (prob) {
      return {
        originalInput: rawInput,
        normalizedInput: `${prob.conciseFormula} = ${prob.solvedAnswer}`,
        category: prob.topic,
        subject: prob.title,
        title: prob.title,
        summary: prob.intuition,
        variables: prob.variables,
        prerequisites: prob.prerequisites,
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 0B. Dynamic Binomial Power Check (e.g. (a+b)^3, (a-b)^3, (x+y)^4, (a+b)^2)
    const bin = BinomialExpansionEngine.matchBinomialPower(trimmed);
    if (bin) {
      const exp = BinomialExpansionEngine.expand(bin.base1, bin.sign, bin.base2, bin.power);
      return {
        originalInput: rawInput,
        normalizedInput: `(${bin.base1} ${bin.sign} ${bin.base2})^${bin.power} = ${exp.expandedFormula}`,
        category: 'algebra',
        subject: 'Polynomial Identities & Binomial Expansions',
        title: exp.title,
        summary: `Canonical algebraic expansion and ${
          bin.power === 3 ? '3D solid volume' : bin.power === 2 ? '2D planar area' : `${bin.power}D geometric`
        } decomposition of (${bin.base1} ${bin.sign} ${bin.base2})^${bin.power}.`,
        variables: [
          {
            symbol: bin.base1,
            name: `Base Dimension "${bin.base1}"`,
            unit: 'units',
            description: `Primary length / component value for variable ${bin.base1}.`,
            defaultValue: bin.power === 3 ? 2 : 4,
            min: 1,
            max: 20,
            step: 0.5,
          },
          {
            symbol: bin.base2,
            name: `Offset Dimension "${bin.base2}"`,
            unit: 'units',
            description: `Secondary length / component value for variable ${bin.base2}.`,
            defaultValue: 1,
            min: 1,
            max: 20,
            step: 0.5,
          },
        ],
        prerequisites: exp.prerequisites,
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    const clean = trimmed.replace(/\s+/g, ' ');
    const lower = clean.toLowerCase();

    // 1. Newton's Second Law: F = ma
    if (
      lower === 'f = ma' ||
      lower === 'f=ma' ||
      lower === 'f = m * a' ||
      lower.includes('newton second law') ||
      lower.includes("newton's second")
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'F = m · a',
        category: 'physics',
        subject: 'Classical Mechanics & Dynamics',
        title: "Newton's Second Law of Motion",
        summary:
          'Fundamental dynamical law relating net external force, inertial mass, and resulting acceleration.',
        variables: [
          {
            symbol: 'F',
            name: 'Net Force',
            unit: 'N (Newtons)',
            dimension: 'M·L·T⁻²',
            description: 'Vector sum of all external forces acting on the particle.',
            defaultValue: 10,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            symbol: 'm',
            name: 'Mass',
            unit: 'kg (Kilograms)',
            dimension: 'M',
            description: 'Inertial resistance of the object to acceleration.',
            defaultValue: 2,
            min: 0.1,
            max: 50,
            step: 0.5,
          },
          {
            symbol: 'a',
            name: 'Acceleration',
            unit: 'm/s²',
            dimension: 'L·T⁻²',
            description: 'Rate of change of velocity produced by the net force.',
            defaultValue: 5,
            min: 0,
            max: 100,
            step: 0.1,
          },
        ],
        prerequisites: ['Vector Quantities', 'Inertia & Newton 1st Law', 'Units of Measurement'],
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 2. Kinematics: v = u + at
    if (
      lower === 'v = u + at' ||
      lower === 'v=u+at' ||
      lower.includes('first kinematic') ||
      lower.includes('v = u + a*t')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'v = u + a · t',
        category: 'physics',
        subject: '1D Kinematics',
        title: 'Uniform Acceleration Velocity Equation',
        summary: 'Calculates instantaneous final velocity under constant linear acceleration.',
        variables: [
          {
            symbol: 'v',
            name: 'Final Velocity',
            unit: 'm/s',
            dimension: 'L·T⁻¹',
            description: 'Velocity reached at time t.',
            defaultValue: 25,
            min: 0,
            max: 100,
            step: 1,
          },
          {
            symbol: 'u',
            name: 'Initial Velocity',
            unit: 'm/s',
            dimension: 'L·T⁻¹',
            description: 'Starting velocity at time t = 0.',
            defaultValue: 5,
            min: 0,
            max: 50,
            step: 1,
          },
          {
            symbol: 'a',
            name: 'Acceleration',
            unit: 'm/s²',
            dimension: 'L·T⁻²',
            description: 'Constant acceleration applied over time.',
            defaultValue: 4,
            min: -20,
            max: 20,
            step: 0.5,
          },
          {
            symbol: 't',
            name: 'Elapsed Time',
            unit: 's',
            dimension: 'T',
            description: 'Time interval of acceleration.',
            defaultValue: 5,
            min: 0,
            max: 30,
            step: 0.5,
          },
        ],
        prerequisites: ['Velocity Definition', 'Constant Acceleration Concept', 'Linear Functions'],
        isAmbiguous: false,
        confidence: 0.98,
      };
    }

    // 2B. Pendulum Simulation
    if (lower.includes('pendulum')) {
      return {
        originalInput: rawInput,
        normalizedInput: 'T = 2π√(L/g)',
        category: 'physics',
        subject: 'Harmonic Oscillations & Dynamics',
        title: 'Simple Harmonic Pendulum',
        summary: 'Calculates the period of oscillation of a simple pendulum and models nonlinear energy conservation.',
        variables: [
          {
            symbol: 'L',
            name: 'String Length',
            unit: 'm',
            dimension: 'L',
            description: 'Distance from the suspension pivot to the center of mass of the pendulum bob.',
            defaultValue: 1.0,
            min: 0.2,
            max: 5.0,
            step: 0.1,
          },
          {
            symbol: 'g',
            name: 'Gravitational Acceleration',
            unit: 'm/s²',
            dimension: 'L·T⁻²',
            description: 'Local acceleration due to gravity (Earth standard: 9.81 m/s²).',
            defaultValue: 9.81,
            min: 1.0,
            max: 25.0,
            step: 0.1,
          },
          {
            symbol: 'theta',
            name: 'Release Angle',
            unit: 'deg (°)',
            dimension: 'dimensionless',
            description: 'Initial angular displacement from the vertical equilibrium nadir.',
            defaultValue: 15,
            min: 1,
            max: 90,
            step: 1,
          },
          {
            symbol: 'T',
            name: 'Oscillation Period',
            unit: 's',
            dimension: 'T',
            description: 'Time required for the pendulum bob to complete one full cycle of oscillation.',
            defaultValue: 2.01,
            min: 0.5,
            max: 10,
            step: 0.01,
          },
        ],
        prerequisites: ['Gravitational Potential Energy', 'Kinetic Energy', 'Small Angle Approximation (sin θ ≈ θ)'],
        isAmbiguous: false,
        confidence: 0.98,
      };
    }

    // 3. Trigonometric Function: y = sin(x)
    if (
      lower === 'y = sin(x)' ||
      lower === 'y=sin(x)' ||
      lower === 'sin(x)' ||
      lower === 'f(x) = sin(x)' ||
      lower.includes('sine function')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'y = sin(x)',
        category: 'calculus',
        subject: 'Trigonometry & Harmonic Functions',
        title: 'The Sine Function Wave',
        summary:
          'Fundamental periodic wave modeling oscillatory phenomena, circular motion, and acoustics.',
        variables: [
          {
            symbol: 'x',
            name: 'Angle / Phase',
            unit: 'radians',
            description: 'Input angular position along the unit circle or time phase.',
            defaultValue: 1.57,
            min: -6.28,
            max: 6.28,
            step: 0.1,
          },
          {
            symbol: 'A',
            name: 'Amplitude',
            unit: 'dimensionless',
            description: 'Peak deviation of the function from zero.',
            defaultValue: 1,
            min: 0.1,
            max: 5,
            step: 0.1,
          },
          {
            symbol: 'f',
            name: 'Frequency',
            unit: 'Hz',
            description: 'Number of wave cycles per unit distance or time.',
            defaultValue: 1,
            min: 0.2,
            max: 4,
            step: 0.1,
          },
        ],
        prerequisites: ['Unit Circle', 'Radians vs Degrees', 'Periodic Functions'],
        isAmbiguous: false,
        confidence: 0.98,
      };
    }

    // 3B. Law of Cosines: c² = a² + b² - 2ab cos(C)
    if (
      lower.includes('law of cosine') ||
      lower.includes('law of cosines') ||
      lower.includes('cosine rule') ||
      lower.includes('c^2 = a^2 + b^2 - 2ab') ||
      lower.includes('c^2=a^2+b^2-2ab') ||
      lower.includes('c2 = a2 + b2 - 2ab') ||
      lower.includes('c2=a2+b2-2ab') ||
      (lower.includes('cosine') && (lower.includes('triangle') || lower.includes('law')))
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'c² = a² + b² - 2ab · cos(C)',
        category: 'geometry',
        subject: 'Trigonometry & Triangle Geometry',
        title: 'The Law of Cosines (Cosine Rule)',
        summary:
          'Fundamental trigonometric law relating the side lengths of any arbitrary triangle to the cosine of its interior angle: c² = a² + b² - 2ab·cos(C).',
        variables: [
          {
            symbol: 'a',
            name: 'Side A',
            unit: 'units',
            description: 'Length of the first adjacent triangle side.',
            defaultValue: 5,
            min: 1,
            max: 20,
            step: 0.5,
          },
          {
            symbol: 'b',
            name: 'Side B',
            unit: 'units',
            description: 'Length of the second adjacent triangle side.',
            defaultValue: 7,
            min: 1,
            max: 20,
            step: 0.5,
          },
          {
            symbol: 'C',
            name: 'Interior Angle C',
            unit: 'deg (°)',
            description: 'Angle subtended between sides a and b opposite to side c.',
            defaultValue: 60,
            min: 1,
            max: 179,
            step: 1,
          },
          {
            symbol: 'c',
            name: 'Opposite Side c',
            unit: 'units',
            description: 'Calculated opposite side length: c = √(a² + b² - 2ab·cos(C)).',
            defaultValue: 6.24,
            min: 1,
            max: 40,
            step: 0.01,
          },
        ],
        prerequisites: ['Euclidean Triangles', 'Pythagorean Theorem', 'Trigonometric Cosine Definition'],
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 4. Pythagorean Theorem: a^2 + b^2 = c^2
    if (
      lower.includes('pythagor') ||
      lower.includes('a^2 + b^2 = c^2') ||
      lower.includes('a^2+b^2=c^2') ||
      lower.includes('a2+b2=c2')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'a² + b² = c²',
        category: 'geometry',
        subject: 'Euclidean Geometry',
        title: 'The Pythagorean Theorem',
        summary:
          'Geometric equality between the squares on the legs and the square on the hypotenuse of a right triangle.',
        variables: [
          {
            symbol: 'a',
            name: 'Leg A',
            unit: 'units',
            description: 'Length of the first perpendicular side.',
            defaultValue: 3,
            min: 1,
            max: 20,
            step: 0.5,
          },
          {
            symbol: 'b',
            name: 'Leg B',
            unit: 'units',
            description: 'Length of the second perpendicular side.',
            defaultValue: 4,
            min: 1,
            max: 20,
            step: 0.5,
          },
          {
            symbol: 'c',
            name: 'Hypotenuse',
            unit: 'units',
            description: 'Length of the side opposite the 90° right angle: c = √(a² + b²).',
            defaultValue: 5,
            min: 1,
            max: 30,
            step: 0.1,
          },
        ],
        prerequisites: ['Right Triangles', 'Square Areas', 'Square Roots'],
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 4B. Square of a Sum: (a + b)² = a² + 2ab + b²
    if (
      lower.includes('(a+b)^2') ||
      lower.includes('(a+b)2') ||
      lower.includes('(a+b)²') ||
      lower.includes('a^2+2ab+b^2') ||
      lower.includes('a2+2ab+b2') ||
      lower.includes('a^2+b^2+2ab') ||
      lower.includes('a2+b2+2ab') ||
      lower.includes('square of sum') ||
      lower.includes('square of a sum') ||
      (lower.includes('a+b') && (lower.includes('^2') || lower.includes('²') || lower.includes('2')))
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: '(a + b)² = a² + 2ab + b²',
        category: 'algebra',
        subject: 'Polynomial Identities',
        title: 'Square of a Sum: (a + b)²',
        summary:
          'Algebraic expansion and geometric area partition of a composite square of side length (a + b).',
        variables: [
          {
            symbol: 'a',
            name: 'Side A Dimension',
            unit: 'units',
            description: 'Length of the first component square segment.',
            defaultValue: 4,
            min: 1,
            max: 15,
            step: 0.5,
          },
          {
            symbol: 'b',
            name: 'Side B Dimension',
            unit: 'units',
            description: 'Length of the second added component strip.',
            defaultValue: 3,
            min: 1,
            max: 15,
            step: 0.5,
          },
        ],
        prerequisites: ['Distributive Property', 'Area of Rectangles', 'Polynomial Expansion'],
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 5. Square of Difference: a^2 + b^2 - 2ab = (a-b)^2
    if (
      lower.includes('a^2+b^2-2ab') ||
      lower.includes('a2+b2-2ab') ||
      lower.includes('a^2-2ab+b^2') ||
      lower.includes('(a-b)^2') ||
      lower.includes('(a-b)2')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: '(a - b)² = a² - 2ab + b²',
        category: 'algebra',
        subject: 'Polynomial Identities',
        title: 'Square of a Difference: (a - b)²',
        summary:
          'Algebraic expansion and geometric area contraction of a square side shortened by length b.',
        variables: [
          {
            symbol: 'a',
            name: 'Outer Side Length',
            unit: 'units',
            description: 'Original outer square side dimension.',
            defaultValue: 6,
            min: 2,
            max: 12,
            step: 0.5,
          },
          {
            symbol: 'b',
            name: 'Subtracted Dimension',
            unit: 'units',
            description: 'Length subtracted from side a (must be < a).',
            defaultValue: 2,
            min: 1,
            max: 10,
            step: 0.5,
          },
        ],
        prerequisites: ['Distributive Law', 'Area of Rectangles', 'Trinomial Factoring'],
        isAmbiguous: false,
        confidence: 0.99,
      };
    }

    // 6. Computer Science: Binary Search
    if (
      lower.includes('binary search') ||
      lower === 'binary_search' ||
      lower.includes('bsearch')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'Binary Search Algorithm (O(log n))',
        category: 'algorithm',
        subject: 'Data Structures & Algorithms',
        title: 'Binary Search Algorithm',
        summary:
          'Divide-and-conquer search algorithm finding a target value in a sorted array in logarithmic time.',
        variables: [
          {
            symbol: 'n',
            name: 'Array Size',
            unit: 'elements',
            description: 'Number of elements in the sorted input collection.',
            defaultValue: 16,
            min: 4,
            max: 64,
            step: 2,
          },
          {
            symbol: 'target',
            name: 'Search Key',
            description: 'Specific integer value being searched for.',
            defaultValue: 42,
            min: 0,
            max: 100,
            step: 1,
          },
        ],
        prerequisites: ['Array Indexing', 'Sorted Preconditions', 'Logarithmic Complexity O(log n)'],
        isAmbiguous: false,
        confidence: 0.97,
      };
    }

    // 7. Quadratic Formula: ax^2 + bx + c = 0
    if (
      lower.includes('quadratic') ||
      lower.includes('ax^2+bx+c') ||
      lower.includes('ax2+bx+c')
    ) {
      return {
        originalInput: rawInput,
        normalizedInput: 'ax² + bx + c = 0',
        category: 'algebra',
        subject: 'Algebraic Equations',
        title: 'The Quadratic Formula',
        summary:
          'General closed-form solution giving the roots of any quadratic polynomial: x = (-b ± √(b² - 4ac)) / (2a).',
        variables: [
          {
            symbol: 'a',
            name: 'Quadratic Coefficient',
            description: 'Multiplier of x² (determines parabola concavity, a ≠ 0).',
            defaultValue: 1,
            min: -5,
            max: 5,
            step: 0.5,
          },
          {
            symbol: 'b',
            name: 'Linear Coefficient',
            description: 'Multiplier of linear term x.',
            defaultValue: -5,
            min: -10,
            max: 10,
            step: 0.5,
          },
          {
            symbol: 'c',
            name: 'Constant Term',
            description: 'y-intercept value when x = 0.',
            defaultValue: 6,
            min: -10,
            max: 10,
            step: 0.5,
          },
        ],
        prerequisites: ['Parabolas', 'Completing the Square', 'Discriminant Δ = b² - 4ac'],
        isAmbiguous: false,
        confidence: 0.98,
      };
    }

    // 8. Chemistry Example (if entered)
    if (lower.includes('2h2 + o2') || lower.includes('h2o') || lower.includes('water synthesis')) {
      return {
        originalInput: rawInput,
        normalizedInput: '2H₂ + O₂ → 2H₂O',
        category: 'chemistry',
        subject: 'Stoichiometry & Chemical Reactions',
        title: 'Water Synthesis Exothermic Reaction',
        summary:
          'Conservation of mass and molar ratio reaction combining molecular hydrogen and oxygen into water.',
        variables: [
          { symbol: 'n(H2)', name: 'Moles of Hydrogen', unit: 'mol', description: 'Reactant amount', defaultValue: 2, min: 1, max: 10, step: 1 },
          { symbol: 'n(O2)', name: 'Moles of Oxygen', unit: 'mol', description: 'Reactant amount', defaultValue: 1, min: 0.5, max: 5, step: 0.5 },
        ],
        prerequisites: ['Conservation of Mass', 'Molar Stoichiometry', 'Chemical Equations'],
        isAmbiguous: false,
        confidence: 0.95,
      };
    }

    // 9. Ambiguous Short Inputs (e.g. single character 'E', 'F', 'P')
    if (trimmed.length <= 2 && /^[a-zA-Z]$/.test(trimmed)) {
      const sym = trimmed.toUpperCase();
      return {
        originalInput: rawInput,
        normalizedInput: sym,
        category: 'concept',
        subject: 'Ambiguous Symbol',
        title: `Symbol Clarification: "${sym}"`,
        summary: `The symbol "${sym}" represents multiple distinct scientific and mathematical equations.`,
        variables: [],
        prerequisites: [],
        isAmbiguous: true,
        ambiguityReason: `"${sym}" has multiple standard physical interpretations depending on context.`,
        clarificationOptions:
          sym === 'E'
            ? [
                { label: 'E = mc² (Mass-Energy Equivalence)', interpretation: 'E = mc^2' },
                { label: 'E = h·ν (Photon Energy Planck Equation)', interpretation: 'E = hv' },
                { label: 'E = ½mv² (Kinetic Energy)', interpretation: 'KE = 1/2 m v^2' },
              ]
            : [
                { label: `F = ma (Newton's 2nd Law of Motion)`, interpretation: 'F = ma' },
                { label: `F = -k·x (Hooke's Spring Law)`, interpretation: 'F = -kx' },
              ],
        confidence: 0.4,
      };
    }

    // 10. Check if input looks like an unknown mathematical formula / equation
    const hasMathOperators = /[=^]/.test(clean) || (/[+\-*/]/.test(clean) && clean.length < 25 && !/\b(and|or|of|in|the)\b/i.test(clean));
    const isStandardMathFunction = /y\s*=\s*/i.test(clean) || /f\s*\(\s*x\s*\)\s*=/i.test(clean) || clean.toLowerCase().startsWith('graph');
    if (hasMathOperators && !isStandardMathFunction) {
      return {
        originalInput: rawInput,
        normalizedInput: clean,
        category: 'concept',
        subject: 'Unknown / Unverified Formula',
        title: `Unresolved Formula: "${clean}"`,
        summary: `The formula expression "${clean}" is not recognized as an established curriculum identity or verified physical theorem.`,
        variables: [],
        prerequisites: [],
        isAmbiguous: true,
        ambiguityReason: `Unrecognized mathematical relationship or undefined variables in "${clean}".`,
        clarificationOptions: [
          { label: 'Specify physical domain (e.g., Mechanics, Thermodynamics, Electromagnetism)', interpretation: `${clean} (physics)` },
          { label: 'Clarify variable definitions and boundary constraints', interpretation: `${clean} (defined)` },
        ],
        confidence: 0.3,
      };
    }

    // 11. General / Real-World Entity or Conceptual Topic
    return {
      originalInput: rawInput,
      normalizedInput: clean,
      category: 'concept',
      subject: 'Domain Knowledge & Concepts',
      title: clean,
      summary: `Conceptual study and domain context of "${clean}".`,
      variables: [],
      prerequisites: ['Foundational Concepts', 'Domain Context'],
      isAmbiguous: false,
      confidence: 0.75,
    };
  }

  private static createEmptyFallback(): InputInterpretation {
    return {
      originalInput: '',
      normalizedInput: '',
      category: 'concept',
      subject: 'General Science & Mathematics',
      title: 'Empty Input',
      summary: 'Please enter a formula, theorem, or topic to explore.',
      variables: [],
      prerequisites: [],
      isAmbiguous: false,
      confidence: 0,
    };
  }
}

