/**
 * VisiOS — Board Feed & Mathematical Formula Recognition Engine
 * Parses canvas ink strokes, text shapes, and geometric drawings to identify mathematical
 * identities, physics equations, and geometric proofs, providing dynamic animation models.
 */

import { TLShape } from 'tldraw';
import { getShapeText } from '@/lib/tldraw-utils';
import { BinomialExpansionEngine } from '@/features/learning/BinomialExpansionEngine';
import { UniversalProblemSolver } from '@/features/learning/UniversalProblemSolver';
import { DomainKnowledgeEngine } from '@/features/learning/DomainKnowledgeEngine';
import { TopicClassifier } from '@/features/learning/TopicClassifier';

export interface FormulaStudyGuide {
  intuition: string;
  prerequisites: string[];
  realWorldApplication: string;
}

export interface RecognizedFormula {
  rawText: string;
  normalizedFormula: string;
  topic: 'algebra' | 'geometry' | 'physics' | 'calculus' | 'trigonometry' | 'algorithm' | 'chemistry';
  title: string;
  solvedResult: string;
  studyGuide: FormulaStudyGuide;
  algebraicSteps: string[];
  geometricProofSummary: string;
  hasInteractiveAnimation: boolean;
  animationType?: 'square_difference' | 'square_sum' | 'pythagoras' | 'difference_of_squares' | 'physics_kinematics' | 'generic';
  defaultParams?: Record<string, number>;
}

export const KNOWN_FORMULA_REGISTRY: RecognizedFormula[] = [
  {
    rawText: 'a^2 + b^2 - 2ab',
    normalizedFormula: 'a^2 + b^2 - 2ab',
    topic: 'algebra',
    title: 'Square of a Difference: (a - b)²',
    solvedResult: '(a - b)²',
    studyGuide: {
      intuition: 'Subtracting side b from side a shrinks a square. Geometrically, removing two strips of width b causes their intersection (b²) to be subtracted twice, which must be added back.',
      prerequisites: ['Distributive Property', 'Binomial Multiplication', 'Area of Rectangles'],
      realWorldApplication: 'Used in variance calculations in statistics, minimizing error squares in machine learning, and stress analysis in civil engineering.',
    },
    algebraicSteps: [
      '1. Start with the expression: a² + b² - 2ab = ?',
      '2. Rearrange terms into standard quadratic trinomial order: a² - 2ab + b²',
      '3. Deconstruct middle linear term: a² - ab - ab + b²',
      '4. Factor by grouping: a(a - b) - b(a - b)',
      '5. Extract the common binomial factor (a - b): (a - b)(a - b) = (a - b)²',
      '6. Reverse check via FOIL: (a - b)² = a² - ab - ab + b² = a² - 2ab + b² ✓',
    ],
    geometricProofSummary:
      'Consider a square of side a (area a²). Subtract two rectangular strips of dimensions a × b (total area -2ab). Because the corner square of side b was subtracted twice in the overlap, we add back b² (+b²). The remaining enclosed area is exactly the square of side (a - b), with area (a - b)²',
    hasInteractiveAnimation: true,
    animationType: 'square_difference',
    defaultParams: { a: 6, b: 2 },
  },
  {
    rawText: 'a^2 - 2ab + b^2',
    normalizedFormula: 'a^2 - 2ab + b^2',
    topic: 'algebra',
    title: 'Square of a Difference: (a - b)²',
    solvedResult: '(a - b)²',
    studyGuide: {
      intuition: 'A perfect square trinomial where the cross term -2ab represents the two rectangular reductions when contracting side a by length b.',
      prerequisites: ['Quadratic Trinomials', 'Factoring by Grouping'],
      realWorldApplication: 'Signal attenuation, quadratic loss functions, and spatial distance metrics.',
    },
    algebraicSteps: [
      '1. Start with expression: a² - 2ab + b²',
      '2. Identify first term as (a)² and last term as (-b)²',
      '3. Verify cross term matches 2·(a)·(-b) = -2ab',
      '4. Factor directly into squared binomial: (a - b)²',
    ],
    geometricProofSummary:
      'Geometric area dissection of square a² minus two rectangles of area a×b, with overlapping corner b² restored to yield (a - b)²',
    hasInteractiveAnimation: true,
    animationType: 'square_difference',
    defaultParams: { a: 6, b: 2 },
  },
  {
    rawText: 'a^2 + 2ab + b^2',
    normalizedFormula: 'a^2 + 2ab + b^2',
    topic: 'algebra',
    title: 'Square of a Sum: (a + b)²',
    solvedResult: '(a + b)²',
    studyGuide: {
      intuition: 'Expanding a square of side (a + b) partitions the total area into a primary square a², a secondary square b², and two symmetric rectangles of area a×b.',
      prerequisites: ['Area Addition Postulate', 'Polynomial Expansion'],
      realWorldApplication: 'Compound interest expansions, quadratic genetics Punnett squares, and circuit impedance.',
    },
    algebraicSteps: [
      '1. Start with the binomial square: (a + b)²',
      '2. Write as repeated multiplication: (a + b)(a + b)',
      '3. Distribute first terms: a(a + b) + b(a + b)',
      '4. Multiply out: a² + ab + ba + b²',
      '5. Combine symmetric like terms (ab = ba): a² + 2ab + b²',
    ],
    geometricProofSummary:
      'A large square of side (a + b) partitions into four sub-regions: one square of area a², one square of area b², and two rectangles each of area a × b, summing to a² + 2ab + b²',
    hasInteractiveAnimation: true,
    animationType: 'square_sum',
    defaultParams: { a: 4, b: 3 },
  },
  {
    rawText: '(a + b)^3',
    normalizedFormula: '(a + b)³',
    topic: 'algebra',
    title: 'Cube of a Sum: (a + b)³',
    solvedResult: 'a³ + 3a²b + 3ab² + b³',
    studyGuide: {
      intuition: 'A 3-dimensional cube of side (a + b) decomposes into 8 geometric blocks: 1 primary cube a³, 3 planar rectangular slabs 3a²b, 3 tall square columns 3ab², and 1 corner cube b³.',
      prerequisites: ['Binomial Multiplication', '3D Solid Geometry', 'Distributive Property (FOIL)'],
      realWorldApplication: 'Thermal volumetric expansion in thermodynamics, 3D stress tensors in structural mechanics, scaling laws in biology, and binomial probability distributions.',
    },
    algebraicSteps: [
      '1. Express as repeated binomial multiplication: (a + b)³ = (a + b)(a + b)²',
      '2. Substitute the binomial square identity: = (a + b)(a² + 2ab + b²)',
      '3. Distribute both terms across the trinomial: = a(a² + 2ab + b²) + b(a² + 2ab + b²)',
      '4. Multiply out individual monomials: = (a³ + 2a²b + ab²) + (a²b + 2ab² + b³)',
      '5. Group symmetric like terms: = a³ + (2a²b + a²b) + (ab² + 2ab²) + b³',
      '6. Combine coefficients: = a³ + 3a²b + 3ab² + b³ ✓',
    ],
    geometricProofSummary:
      '3D Solid Volume Dissection: A composite cube of side length (a + b) decomposes into 8 geometric blocks: 1 primary cube of volume a³, 3 rectangular slabs of dimensions a × a × b (volume 3a²b), 3 tall square columns of dimensions a × b × b (volume 3ab²), and 1 corner cube of volume b³. Total volume: a³ + 3a²b + 3ab² + b³.',
    hasInteractiveAnimation: true,
    animationType: 'generic',
    defaultParams: { a: 2, b: 1 },
  },
  {
    rawText: '(a - b)^3',
    normalizedFormula: '(a - b)³',
    topic: 'algebra',
    title: 'Cube of a Difference: (a - b)³',
    solvedResult: 'a³ - 3a²b + 3ab² - b³',
    studyGuide: {
      intuition: 'Shrinking a cube from side a by length b subtracts 3 planar slabs (-3a²b), adds back pairwise edge overlaps (+3ab²), and finally subtracts the triple-intersection corner (-b³).',
      prerequisites: ['Polynomial Expansion', 'Sign Rules of Algebra', '3D Volume Principles'],
      realWorldApplication: 'Multidimensional error propagation, differential volume contractions, and cubic polynomial factorization.',
    },
    algebraicSteps: [
      '1. Express as: (a - b)³ = (a - b)(a - b)²',
      '2. Substitute the known square identity: = (a - b)(a² - 2ab + b²)',
      '3. Distribute across the quadratic factor: = a(a² - 2ab + b²) - b(a² - 2ab + b²)',
      '4. Multiply monomials with negative signs: = (a³ - 2a²b + ab²) - (a²b - 2ab² + b³)',
      '5. Combine like terms: = a³ + (-2a²b - a²b) + (ab² + 2ab²) - b³',
      '6. Final canonical polynomial: = a³ - 3a²b + 3ab² - b³ ✓',
    ],
    geometricProofSummary:
      'Volume Contraction Model: Principle of inclusion-exclusion in 3 dimensions. Subtracting 3 slabs (-3a²b) subtracts their pairwise intersections twice, requiring 3 edge columns (+3ab²) to be added back, and subtracting the corner cube (-b³).',
    hasInteractiveAnimation: true,
    animationType: 'generic',
    defaultParams: { a: 3, b: 1 },
  },
  {
    rawText: 'a^2 - b^2',
    normalizedFormula: 'a^2 - b^2',
    topic: 'algebra',
    title: 'Difference of Two Squares',
    solvedResult: '(a - b)(a + b)',
    studyGuide: {
      intuition: 'Cutting a small square b² out of a large square a² leaves an L-shaped region. Slicing and shifting the L-shape forms a rectangle of side (a + b) and width (a - b).',
      prerequisites: ['Area Conservation', 'Factoring by Grouping'],
      realWorldApplication: 'Fast mental arithmetic (e.g. 52 × 48 = 50² - 2² = 2496), rationalizing denominators in calculus.',
    },
    algebraicSteps: [
      '1. Expression: a² - b²',
      '2. Add and subtract the cross-term ab: a² - ab + ab - b²',
      '3. Factor first pair: a(a - b)',
      '4. Factor second pair: b(a - b)',
      '5. Combine factors: (a - b)(a + b)',
    ],
    geometricProofSummary:
      'Taking a square of area a² and cutting away a corner square of area b² leaves an L-shaped region. Slicing and rearranging the L-shape forms a single rectangle with side lengths (a + b) and (a - b)',
    hasInteractiveAnimation: true,
    animationType: 'difference_of_squares',
    defaultParams: { a: 5, b: 2 },
  },
  {
    rawText: 'a^2 + b^2 = c^2',
    normalizedFormula: 'a^2 + b^2 = c^2',
    topic: 'geometry',
    title: 'Pythagorean Theorem',
    solvedResult: 'c = √(a² + b²)',
    studyGuide: {
      intuition: 'In any flat right triangle, the square area built on the hypotenuse exactly equals the sum of the square areas built on the two legs.',
      prerequisites: ['Euclidean Plane Geometry', 'Right Triangles', 'Square Areas'],
      realWorldApplication: 'GPS triangulation, 3D computer graphics distance calculations, architectural roofing trusses.',
    },
    algebraicSteps: [
      '1. Right triangle with perpendicular legs a, b and hypotenuse c',
      '2. Enclose 4 identical triangles inside a square of side (a + b)',
      '3. Total outer area: (a + b)² = a² + 2ab + b²',
      '4. Sum of inner regions: 4 × (½·a·b) + c² = 2ab + c²',
      '5. Equate areas: a² + 2ab + b² = 2ab + c²',
      '6. Subtract 2ab from both sides: a² + b² = c² ✓',
      '7. Solve for hypotenuse: c = √(a² + b²)',
    ],
    geometricProofSummary:
      'Arranging four identical right triangles inside a square of side (a + b) leaves an inner tilted square of area c². Expanding (a + b)² = 4(½ab) + c² gives a² + 2ab + b² = 2ab + c² => a² + b² = c²',
    hasInteractiveAnimation: true,
    animationType: 'pythagoras',
    defaultParams: { a: 3, b: 4 },
  },
  {
    rawText: 'F = ma',
    normalizedFormula: 'F = ma',
    topic: 'physics',
    title: "Newton's Second Law of Motion",
    solvedResult: 'a = F / m  (or F = dp/dt)',
    studyGuide: {
      intuition: 'Net force accelerates mass. Double the force, double the acceleration; double the mass, halve the acceleration.',
      prerequisites: ['Inertia (Newton 1st Law)', 'Vector Quantities', 'Rate of Change'],
      realWorldApplication: 'Rocket propulsion calculations, automotive collision safety, satellite orbit transfers.',
    },
    algebraicSteps: [
      '1. Momentum definition: p = m · v',
      '2. Force as time rate of momentum change: F = dp / dt',
      '3. By product rule: F = m·(dv/dt) + v·(dm/dt)',
      '4. For constant invariant mass (dm/dt = 0): F = m·(dv/dt)',
      '5. Substitute acceleration a = dv/dt: F = m · a',
      '6. Solve for acceleration: a = F / m',
    ],
    geometricProofSummary:
      'Force vector F acts in direction of acceleration vector a. Plotting Force vs Acceleration yields a straight line with slope equal to inertial mass m.',
    hasInteractiveAnimation: false,
    animationType: 'physics_kinematics',
  },
  {
    rawText: 'E = mc^2',
    normalizedFormula: 'E = mc^2',
    topic: 'physics',
    title: "Mass-Energy Equivalence",
    solvedResult: 'E = m · c²',
    studyGuide: {
      intuition: 'Mass and energy are two forms of the same physical essence. A tiny amount of mass represents an immense reservoir of energy due to c².',
      prerequisites: ['Special Relativity', 'Lorentz Invariance', 'Kinetic Energy'],
      realWorldApplication: 'Nuclear power generation, stellar fusion powering the Sun, particle accelerator collisions.',
    },
    algebraicSteps: [
      '1. Relativistic momentum: p = γ·m₀·v where γ = 1/√(1 - v²/c²)',
      '2. Work done: W = ∫ F dx = ∫ (dp/dt) dx = ∫ v dp',
      '3. Integrate by parts with respect to v from 0 to v: W = (γ - 1)m₀c²',
      '4. Total relativistic energy: E = W + E₀ = γm₀c²',
      '5. At rest (v = 0, γ = 1), rest energy: E₀ = m₀c²',
    ],
    geometricProofSummary:
      'Energy-Momentum 4-vector relation: E² = (pc)² + (m₀c²)². When momentum p = 0, hypotenuse collapses to E = m₀c².',
    hasInteractiveAnimation: false,
    animationType: 'generic',
  },
  {
    rawText: 'ax^2 + bx + c = 0',
    normalizedFormula: 'ax^2 + bx + c = 0',
    topic: 'algebra',
    title: 'The Quadratic Formula',
    solvedResult: 'x = (-b ± √(b² - 4ac)) / (2a)',
    studyGuide: {
      intuition: 'Finds the exact roots (x-intercepts) of any parabola by completing the square on a general second-degree polynomial.',
      prerequisites: ['Parabolas', 'Completing the Square', 'Square Roots'],
      realWorldApplication: 'Projectile trajectory landing zones, profit maximization curves, optics focus positions.',
    },
    algebraicSteps: [
      '1. Given: ax² + bx + c = 0 (a ≠ 0)',
      '2. Divide entire equation by a: x² + (b/a)x + (c/a) = 0',
      '3. Subtract constant term: x² + (b/a)x = -c/a',
      '4. Complete the square by adding (b / 2a)² to both sides:',
      '   x² + (b/a)x + (b/2a)² = (b²/4a²) - (c/a)',
      '5. Factor LHS and find common denominator on RHS:',
      '   (x + b/2a)² = (b² - 4ac) / (4a²)',
      '6. Take square root of both sides: x + b/2a = ±√(b² - 4ac) / (2a)',
      '7. Subtract b/2a: x = (-b ± √(b² - 4ac)) / (2a) ✓',
    ],
    geometricProofSummary:
      'Geometrically completes the missing corner of an area x² + (b/a)x into a full square of side (x + b/2a), revealing the discriminant b² - 4ac.',
    hasInteractiveAnimation: false,
    animationType: 'generic',
  },
  {
    rawText: 'v = u + at',
    normalizedFormula: 'v = u + at',
    topic: 'physics',
    title: 'First Kinematic Equation (Uniform Acceleration)',
    solvedResult: 'v = u + at  (or a = (v - u)/t)',
    studyGuide: {
      intuition: 'Final velocity equals initial velocity plus the velocity gained from constant acceleration applied over time t.',
      prerequisites: ['Velocity', 'Acceleration', 'Linear Functions'],
      realWorldApplication: 'Vehicle braking distances, aircraft runway takeoff speeds, freefall speeds.',
    },
    algebraicSteps: [
      '1. By definition of constant acceleration: a = dv / dt',
      '2. Separate variables: dv = a · dt',
      '3. Integrate both sides from initial state (t=0, v=u) to final (t, v):',
      '   ∫[u to v] dv = ∫[0 to t] a dt',
      '4. Evaluate integrals: [v] from u to v = a · [t] from 0 to t',
      '5. v - u = a · t',
      '6. Add u to both sides: v = u + at ✓',
    ],
    geometricProofSummary:
      'On a velocity-time graph, v(t) is a line with y-intercept u and slope a. The area under this line between 0 and t gives the displacement s = ut + ½at².',
    hasInteractiveAnimation: false,
    animationType: 'generic',
  },
  {
    rawText: 'V = IR',
    normalizedFormula: 'V = IR',
    topic: 'physics',
    title: "Ohm's Law",
    solvedResult: 'I = V / R  (or R = V / I)',
    studyGuide: {
      intuition: 'Voltage is electrical pressure pushing charge; resistance opposes that push; current is the resulting flow rate.',
      prerequisites: ['Electric Potential', 'Charge Flow', 'Electrical Resistance'],
      realWorldApplication: 'Circuit design, power grid distribution, sensor calibration, battery management.',
    },
    algebraicSteps: [
      '1. Electric field in conductor: E = V / L',
      '2. Current density J = σ · E (microscopic Ohm formulation)',
      '3. Relate current density to total current: I = J · A = (σ·A/L) · V',
      '4. Define resistance R = L / (σ · A)',
      '5. Substitute: I = V / R',
      '6. Rearrange: V = I · R ✓',
    ],
    geometricProofSummary:
      'Linear V-I characteristic curve through origin with slope equal to resistance R.',
    hasInteractiveAnimation: false,
    animationType: 'generic',
  },
];

export class BoardFeedParser {
  /**
   * Parse a single string for mathematical identities.
   */
  static parseText(text: string): RecognizedFormula | null {
    if (!text) return null;
    return this.matchFormulaString(text);
  }

  /**
   * Scans canvas shapes to detect mathematical formulas or handwriting keywords.
   */
  static parseBoardFeed(shapes: TLShape[]): RecognizedFormula | null {
    if (!shapes || shapes.length === 0) return null;

    // Filter out stamped study cards, geometries, simulations, and 3d models
    const userShapes = shapes.filter(
      (s) =>
        s.type !== 'learning-card' &&
        s.type !== 'geometry' &&
        s.type !== 'simulation' &&
        s.type !== 'model3d'
    );
    if (userShapes.length === 0) return null;

    // Helper: detect if a shape is an already-stamped AI study guide card
    const isGeneratedStudyCard = (text: string) => {
      if (!text) return false;
      return (
        text.includes('✨') ||
        text.includes('📐') ||
        text.includes('👁️') ||
        text.includes('🧪') ||
        text.includes('Study Analysis:') ||
        text.includes('Learning Topic:') ||
        text.includes('Step-by-Step Derivation:') ||
        text.includes('Geometric Area Model:') ||
        text.includes('Interactive Outcome:') ||
        text.includes('Initial state computed:') ||
        text.includes('Clarification:') ||
        text.includes('Newton\'s Second Law') ||
        text.includes('Linear Function:') ||
        text.includes('Fractions &')
      );
    };

    // 1. High Priority: User-created text shapes (reverse order = newest shape first)
    const textShapes = userShapes.filter((s) => s.type === 'text');
    for (let i = textShapes.length - 1; i >= 0; i--) {
      const text = getShapeText(textShapes[i]);
      if (text && !isGeneratedStudyCard(text)) {
        const match = this.matchFormulaString(text) || this.solveUniversalTopic(text);
        if (match) return match;
      }
    }

    // 2. Medium Priority: User notes that are NOT generated study cards
    const noteShapes = userShapes.filter((s) => s.type === 'note');
    for (let i = noteShapes.length - 1; i >= 0; i--) {
      const text = getShapeText(noteShapes[i]);
      if (text && !isGeneratedStudyCard(text)) {
        const match = this.matchFormulaString(text) || this.solveUniversalTopic(text);
        if (match) return match;
      }
    }

    // 3. Low Priority: Check multi-shape text or labels
    const textAccumulator: string[] = [];
    userShapes.forEach((s) => {
      const text = getShapeText(s);
      if (text && !isGeneratedStudyCard(text)) {
        textAccumulator.push(text);
      }
    });

    if (textAccumulator.length > 0) {
      const combined = textAccumulator.join(' ');
      const match = this.matchFormulaString(combined) || this.solveUniversalTopic(combined);
      if (match) return match;
    }

    // 4. Fallback: If only draw shapes exist and user has drawn strokes
    const drawShapes = userShapes.filter((s) => s.type === 'draw');
    if (drawShapes.length >= 2) {
      // Check if any study notes exist to avoid overwriting them
      for (const n of noteShapes) {
        const text = getShapeText(n);
        const match = this.matchFormulaString(text);
        if (match) return match;
      }
      return null;
    }

    return null;
  }

  public static matchFormulaString(str: string): RecognizedFormula | null {
    if (!str) return null;

    // Check subject-aware domain knowledge engine (Functions, Curves, Algorithms, Science)
    const domainMatch = DomainKnowledgeEngine.match(str);
    if (domainMatch) {
      return {
        rawText: str,
        normalizedFormula: domainMatch.conciseFormula,
        topic: (domainMatch.category === 'concept' ? 'algebra' : domainMatch.category) as any,
        title: domainMatch.title,
        solvedResult: domainMatch.solvedAnswer,
        studyGuide: {
          intuition: domainMatch.intuition,
          prerequisites: domainMatch.prerequisites,
          realWorldApplication: domainMatch.realWorldApplication,
        },
        algebraicSteps: domainMatch.algebraicSteps,
        geometricProofSummary: domainMatch.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: domainMatch.calculatedParameters,
      };
    }

    // Normalize superscripts, strip whitespace, ?, =, :, quotes
    const clean = str
      .replace(/²/g, '^2')
      .replace(/³/g, '^3')
      .replace(/[?=\s:;'"]/g, '')
      .toLowerCase();

    // 1. Check for (a+b)^3 or a^3+3a^2b+3ab^2+b^3 (Cube of a Sum)
    if (
      clean.includes('(a+b)^3') ||
      clean.includes('(a+b)3') ||
      clean.includes('a^3+3a^2b+3ab^2+b^3') ||
      clean.includes('a3+3a2b+3ab2+b3') ||
      (clean.includes('a+b') && (clean.includes('^3') || clean.includes('3')))
    ) {
      return KNOWN_FORMULA_REGISTRY[3];
    }

    // 2. Check for (a-b)^3 or a^3-3a^2b+3ab^2-b^3 (Cube of a Difference)
    if (
      clean.includes('(a-b)^3') ||
      clean.includes('(a-b)3') ||
      clean.includes('a^3-3a^2b+3ab^2-b^3') ||
      clean.includes('a3-3a2b+3ab2-b3') ||
      (clean.includes('a-b') && (clean.includes('^3') || clean.includes('3')))
    ) {
      return KNOWN_FORMULA_REGISTRY[4];
    }

    // 3. Check for (a+b)^2 or a^2+2ab+b^2 (Square of a Sum)
    if (
      clean.includes('(a+b)^2') ||
      clean.includes('(a+b)2') ||
      clean.includes('a^2+2ab+b^2') ||
      clean.includes('a2+2ab+b2') ||
      clean.includes('a^2+b^2+2ab') ||
      clean.includes('a2+b2+2ab') ||
      (clean.includes('a+b') && (clean.includes('^2') || clean.includes('2')))
    ) {
      return KNOWN_FORMULA_REGISTRY[2];
    }

    // 4. Check for (a-b)^2 or a^2-2ab+b^2 (Square of a Difference)
    if (
      clean.includes('(a-b)^2') ||
      clean.includes('(a-b)2') ||
      clean.includes('a^2-2ab+b^2') ||
      clean.includes('a2-2ab+b2') ||
      clean.includes('a^2+b^2-2ab') ||
      clean.includes('a2+b2-2ab') ||
      (clean.includes('a-b') && (clean.includes('^2') || clean.includes('2')))
    ) {
      return KNOWN_FORMULA_REGISTRY[0];
    }

    // 5. Check for a^2-b^2 or (a-b)(a+b) (Difference of Two Squares)
    if (
      clean.includes('a^2-b^2') ||
      clean.includes('a2-b2') ||
      clean.includes('(a-b)(a+b)') ||
      clean.includes('(a+b)(a-b)')
    ) {
      return KNOWN_FORMULA_REGISTRY[5];
    }

    // Check for pythagoras
    if (
      clean.includes('a^2+b^2=c^2') ||
      clean.includes('a2+b2=c2') ||
      clean.includes('a^2+b^2c^2') ||
      clean.includes('pythagor')
    ) {
      return KNOWN_FORMULA_REGISTRY[6];
    }

    // Check for F = ma
    if (clean === 'fma' || clean.includes('f=ma') || clean.includes('newton2')) {
      return KNOWN_FORMULA_REGISTRY[7];
    }

    // Check for E = mc^2
    if (clean === 'emc^2' || clean === 'emc2' || clean.includes('e=mc^2') || clean.includes('e=mc2')) {
      return KNOWN_FORMULA_REGISTRY[8];
    }

    // Check for ax^2 + bx + c = 0 or quadratic
    if (
      clean.includes('ax^2+bx+c') ||
      clean.includes('ax2+bx+c') ||
      clean.includes('quadratic')
    ) {
      return KNOWN_FORMULA_REGISTRY[9];
    }

    // Check for v = u + at
    if (clean.includes('v=u+at') || clean === 'vu+at' || clean.includes('kinematic')) {
      return KNOWN_FORMULA_REGISTRY[10];
    }

    // Check for V = IR
    if (clean === 'vir' || clean.includes('v=ir') || clean.includes('ohm')) {
      return KNOWN_FORMULA_REGISTRY[11];
    }

    // Dynamic check for any binomial power (u +/- v)^n
    const bin = BinomialExpansionEngine.matchBinomialPower(str);
    if (bin) {
      const exp = BinomialExpansionEngine.expand(bin.base1, bin.sign, bin.base2, bin.power);
      return {
        rawText: str,
        normalizedFormula: `(${bin.base1} ${bin.sign} ${bin.base2})^${bin.power}`,
        topic: 'algebra',
        title: exp.title,
        solvedResult: exp.expandedFormula,
        studyGuide: {
          intuition: exp.intuition,
          prerequisites: exp.prerequisites,
          realWorldApplication: exp.realWorldApplication,
        },
        algebraicSteps: exp.algebraicSteps,
        geometricProofSummary: exp.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: { [bin.base1]: 2, [bin.base2]: 1 },
      };
    }

    // Universal Problem Solver (Natural Language Word Problems & Physics: Density, Force, etc.)
    const prob = UniversalProblemSolver.solve(str);
    if (prob) {
      return {
        rawText: str,
        normalizedFormula: prob.conciseFormula,
        topic: prob.topic,
        title: prob.title,
        solvedResult: prob.solvedAnswer,
        studyGuide: {
          intuition: prob.intuition,
          prerequisites: prob.prerequisites,
          realWorldApplication: prob.realWorldApplication,
        },
        algebraicSteps: prob.algebraicSteps,
        geometricProofSummary: prob.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: prob.calculatedParameters,
      };
    }

    return null;
  }

  /**
   * Generates a pedagogical study, derivation, and visual breakdown for ANY query or topic.
   */
  public static solveUniversalTopic(topicOrFormula: string): RecognizedFormula {
    const matched = this.matchFormulaString(topicOrFormula);
    if (matched) return matched;

    const trimmed = topicOrFormula.trim();

    // 1. Universal Problem Solver (Natural Language Word Problems, Density, Force, Kinematics)
    const prob = UniversalProblemSolver.solve(trimmed);
    if (prob) {
      return {
        rawText: trimmed,
        normalizedFormula: prob.conciseFormula,
        topic: prob.topic,
        title: prob.title,
        solvedResult: prob.solvedAnswer,
        studyGuide: {
          intuition: prob.intuition,
          prerequisites: prob.prerequisites,
          realWorldApplication: prob.realWorldApplication,
        },
        algebraicSteps: prob.algebraicSteps,
        geometricProofSummary: prob.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: prob.calculatedParameters,
      };
    }

    // 2. Dynamic Binomial Power Check
    const bin = BinomialExpansionEngine.matchBinomialPower(trimmed);
    if (bin) {
      const exp = BinomialExpansionEngine.expand(bin.base1, bin.sign, bin.base2, bin.power);
      return {
        rawText: trimmed,
        normalizedFormula: `(${bin.base1} ${bin.sign} ${bin.base2})^${bin.power}`,
        topic: 'algebra',
        title: exp.title,
        solvedResult: exp.expandedFormula,
        studyGuide: {
          intuition: exp.intuition,
          prerequisites: exp.prerequisites,
          realWorldApplication: exp.realWorldApplication,
        },
        algebraicSteps: exp.algebraicSteps,
        geometricProofSummary: exp.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: { [bin.base1]: 2, [bin.base2]: 1 },
      };
    }

    // 3. Domain Knowledge Engine (Data Structures, Python, Algorithms, Chemistry, Biology, Functions)
    const domainMatch = DomainKnowledgeEngine.match(trimmed);
    if (domainMatch) {
      return {
        rawText: trimmed,
        normalizedFormula: domainMatch.conciseFormula,
        topic: domainMatch.category as any,
        title: domainMatch.title,
        solvedResult: domainMatch.solvedAnswer,
        studyGuide: {
          intuition: domainMatch.intuition,
          prerequisites: domainMatch.prerequisites,
          realWorldApplication: domainMatch.realWorldApplication,
        },
        algebraicSteps: domainMatch.algebraicSteps,
        geometricProofSummary: domainMatch.geometricProofSummary,
        hasInteractiveAnimation: true,
        animationType: 'generic',
        defaultParams: domainMatch.calculatedParameters,
      };
    }

    // Clean concise title for generic topics (stripping trailing ellipsis)
    const cleanText = trimmed.replace(/\.{2,}$/, '').replace(/…$/, '').trim();
    const conciseTitle = cleanText.length > 40 ? cleanText.slice(0, 37) + '...' : cleanText;

    // Classify topic domain rather than hardcoding algebra
    const classification = TopicClassifier.classify(trimmed);
    const domainTopicMap: Record<string, RecognizedFormula['topic']> = {
      computer_science: 'algorithm',
      physics: 'physics',
      chemistry: 'chemistry',
      mathematics: 'algebra',
    };
    const resolvedTopic = domainTopicMap[classification.domain] || 'algebra';

    return {
      rawText: trimmed,
      normalizedFormula: conciseTitle,
      topic: resolvedTopic,
      title: `Study Analysis: ${conciseTitle}`,
      solvedResult: `Systematic Pedagogical Model`,
      studyGuide: {
        intuition: `Foundational conceptual study of "${conciseTitle}". Explore governing structures, state transitions, and operational rules.`,
        prerequisites: ['Foundational Definitions', 'Domain Principles', 'System Boundaries'],
        realWorldApplication: 'Applied across computational modeling, system design, and practical analysis.',
      },
      algebraicSteps: [
        `1. Identify foundational definitions and system boundaries of "${conciseTitle}"`,
        `2. Analyze core structural components and operational relationships`,
        `3. Evaluate state transformations, inputs, and outputs`,
        `4. Verify consistency across boundary constraints and edge cases`,
        `5. Synthesize final resolved formulation: ${conciseTitle} ✓`,
      ],
      geometricProofSummary: `System Architecture & Model: Component layout, operational flow diagram, and state hierarchy.`,
      hasInteractiveAnimation: false,
      animationType: 'generic',
    };
  }
}

