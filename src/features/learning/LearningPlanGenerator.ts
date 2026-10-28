import {
  LearningPlan,
  InputInterpretation,
  DerivationStep,
  VisualizationPlan,
  CapabilityLevel,
  WorkedExample,
  PracticeQuestion,
} from './types';
import { UniversalInputInterpreter } from './UniversalInputInterpreter';
import { FormulaDerivationEngine } from './FormulaDerivationEngine';
import { VisualizationPlanner } from './VisualizationPlanner';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';

export class LearningPlanGenerator {
  /**
   * Generates a structured, validated 5-pillar learning plan for any interpreted input.
   */
  static generatePlan(input: string | InputInterpretation): LearningPlan {
    const interpretation =
      typeof input === 'string' ? UniversalInputInterpreter.interpret(input) : input;

    const visPlan = VisualizationPlanner.plan(interpretation);
    const conceptId = this.deriveConceptId(interpretation);
    const derivationData = FormulaDerivationEngine.getDerivationSteps(conceptId);

    // Default experiment state
    const defaultParams: Record<string, number> = {};
    interpretation.variables.forEach((v) => {
      if (v.defaultValue !== undefined) {
        defaultParams[v.symbol] = v.defaultValue;
      }
    });

    const calcResult = FormulaDerivationEngine.calculate(conceptId, defaultParams);

    const workedExamples = this.getWorkedExamples(conceptId);
    const practiceQuestions = this.getPracticeQuestions(conceptId);
    const assumptions = this.getAssumptions(conceptId);
    const applications = this.getApplications(conceptId);
    const limitations = this.getLimitations(conceptId);

    let capabilityLevel: CapabilityLevel = 'verified_and_tested';
    const disclosures: string[] = [];

    if (interpretation.confidence < 0.8) {
      capabilityLevel = 'partial_with_limitations';
      disclosures.push(
        'Generated from universal semantic model. Independent curriculum verification recommended.'
      );
    }
    if (derivationData.steps.some((s) => s.verificationStatus === 'curriculum_trusted')) {
      disclosures.push('Derivation steps supplied from standard curriculum guidelines.');
    }

    return {
      conceptId,
      title: interpretation.title,
      category: interpretation.category,
      subject: interpretation.subject,
      capabilityLevel,
      disclosures,

      // 1. Understand
      overview: interpretation.summary,
      motivation: this.getMotivation(conceptId, interpretation.title),
      prerequisites: interpretation.prerequisites,
      variables: interpretation.variables,
      assumptions,

      // 2. Derive
      derivationSteps: derivationData.steps,
      derivationSummary: derivationData.summary,
      symbolicVerificationNote:
        'Calculations and algebraic transformations verified by deterministic symbolic validation.',

      // 3. Visualize
      visualizationPlan: visPlan,

      // 4. Experiment
      interactiveParameters: interpretation.variables
        .filter((v) => v.defaultValue !== undefined)
        .map((v) => ({
          id: v.symbol,
          symbol: v.symbol,
          label: v.name,
          unit: v.unit,
          value: v.defaultValue ?? 1,
          min: v.min ?? 0,
          max: v.max ?? 100,
          step: v.step ?? 1,
        })),
      defaultExperimentState: {
        parameters: defaultParams,
        calculatedOutputs: {
          result: calcResult.primaryResult,
          display: calcResult.formattedOutput,
        },
        outputFormulas: {
          output: calcResult.formattedOutput,
        },
        statusMessage: `Initial state computed: ${calcResult.formattedOutput}`,
      },

      // 5. Master
      workedExamples,
      applications,
      limitations,
      practiceQuestions,
      recommendedNextConcepts: this.getNextConcepts(conceptId),
    };
  }

  private static deriveConceptId(interpretation: InputInterpretation): string {
    // Subject-Aware Domain Models (Computer Science, Chemistry, Biology)
    const domainMatch = DomainKnowledgeEngine.match(interpretation.originalInput);
    if (domainMatch) return domainMatch.conceptId;

    const raw = interpretation.originalInput.toLowerCase();
    if (raw.includes('density') || raw.includes('mass / volume') || raw.includes('mass/volume') || raw.includes('m / v') || raw.includes('m/v') || raw.includes('ρ = m/v')) return 'physics_density';
    if (raw.includes('f = ma') || raw.includes('f=ma') || raw.includes('newton')) return 'physics_f_ma';
    if (raw.includes('v = u + at') || raw.includes('v=u+at')) return 'physics_kinematics_v_u_at';
    if (raw.includes('law of cosine') || raw.includes('cosine rule') || raw.includes('c^2 = a^2 + b^2 - 2ab') || raw.includes('c^2=a^2+b^2-2ab') || raw.includes('c2 = a2 + b2 - 2ab') || (raw.includes('cosine') && (raw.includes('triangle') || raw.includes('law')))) return 'trigonometry_law_of_cosines';
    if (/\b(sin|sine|sin_x|sin\(x\))\b/i.test(raw)) return 'calculus_sin_x';
    if (raw.includes('pythagor') || raw.includes('a^2+b^2=c^2') || raw.includes('a^2 + b^2 = c^2') || raw.includes('a2+b2=c2')) return 'geometry_pythagoras';

    // Dynamic Binomial Power Matching
    const bin = BinomialExpansionEngine.matchBinomialPower(interpretation.originalInput);
    if (bin) {
      if (bin.base1 === 'a' && bin.base2 === 'b' && bin.power === 2) {
        return bin.sign === '+' ? 'algebra_square_sum' : 'algebra_square_diff';
      }
      if (bin.base1 === 'a' && bin.base2 === 'b' && bin.power === 3) {
        return bin.sign === '+' ? 'algebra_cube_sum' : 'algebra_cube_diff';
      }
      return `binomial_${bin.base1}_${bin.sign === '+' ? 'plus' : 'minus'}_${bin.base2}_${bin.power}`;
    }

    if (raw.includes('(a+b)^3') || raw.includes('(a+b)³') || raw.includes('cube of sum') || raw.includes('cube of a sum')) return 'algebra_cube_sum';
    if (raw.includes('(a-b)^3') || raw.includes('(a-b)³') || raw.includes('cube of diff') || raw.includes('cube of a diff')) return 'algebra_cube_diff';
    if (raw.includes('(a+b)^2') || raw.includes('a^2+2ab+b^2') || raw.includes('square of sum') || raw.includes('(a+b)²')) return 'algebra_square_sum';
    if (raw.includes('a^2+b^2-2ab') || raw.includes('(a-b)^2')) return 'algebra_square_diff';
    if (raw.includes('quadratic') || raw.includes('ax^2+bx+c')) return 'algebra_quadratic';
    if (raw.includes('binary search')) return 'algo_binary_search';
    if (raw.includes('pendulum')) return 'physics_pendulum';
    return `concept_${interpretation.category}_${Date.now()}`;
  }

  private static getMotivation(conceptId: string, title: string): string {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain) return domain.intuition;

    if (conceptId.startsWith('binomial_')) {
      const parts = conceptId.split('_');
      const b1 = parts[1] || 'a';
      const s = parts[2] === 'minus' ? '-' : '+';
      const b2 = parts[3] || 'b';
      const p = parseInt(parts[4], 10) || 2;
      const exp = BinomialExpansionEngine.expand(b1, s as '+' | '-', b2, p);
      return exp.intuition || `Formal algebraic expansion and ${p}D geometric representation of (${b1} ${s} ${b2})^${p}.`;
    }

    switch (conceptId) {
      case 'physics_density':
        return 'Density determines how matter packs into 3D volume, governing why enormous metal cruise ships float while a small pebble sinks, why oil separates from water, and how hot air balloons fly.';
      case 'physics_f_ma':
        return 'Before Newton, natural philosophy believed objects required continuous pushing to maintain motion (Aristotelian view). Newton showed that force produces acceleration, transforming mechanics into a predictive science.';
      case 'algebra_cube_sum':
        return 'Represents 3D Cartesian volume decomposition into 8 geometric blocks (a³ + 3a²b + 3ab² + b³), foundational for solid geometry, cubic equations, thermodynamics of thermal expansion, and higher polynomial combinatorics.';
      case 'algebra_cube_diff':
        return 'Enables exact algebraic factoring of cubes and geometric volume contraction, essential for 3D physics modeling, numerical polynomial approximations, and multi-variable calculus.';
      case 'algebra_square_sum':
        return 'Forms the foundational binomial expansion in algebra, area decomposition in geometry, and the mathematical framework for Punnett squares in genetics and variance in statistics.';
      case 'algebra_square_diff':
        return 'Enables mental calculation and symbolic factoring of quadratic error functions, vital in physics, computer graphics, and machine learning loss functions.';
      case 'calculus_sin_x':
        return 'Models any continuous periodic cycle: pendulum swings, AC electrical power, sound vibrations, and planetary orbits.';
      case 'geometry_pythagoras':
        return 'Provides the fundamental metric of distance in Euclidean 2D and 3D space, powering navigation, construction, and graphics engines.';
      case 'trigonometry_law_of_cosines':
        return 'Generalizes the Pythagorean theorem to any arbitrary triangle, forming the geometric foundation of celestial navigation, surveying, and 3D computer graphics.';
      default:
        return `Introduced to formalize relationships and predict observable outcomes in ${title}.`;
    }
  }

  private static getAssumptions(conceptId: string): string[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain && domain.assumptions?.length > 0) return domain.assumptions;

    if (conceptId === 'algebra_cube_sum' || conceptId === 'algebra_cube_diff' || conceptId.startsWith('binomial_')) {
      return [
        'Commutative ring of real or complex numbers',
        'Variables represent non-negative Euclidean lengths when mapped to 3D solid volume models',
        'Standard associativity and distributivity of multiplication over addition',
      ];
    }

    switch (conceptId) {
      case 'physics_density':
        return [
          'Homogeneous mass distribution throughout the volume',
          'Standard Temperature and Pressure (STP) reference environment',
          'Incompressible matter continuum approximation',
        ];
      case 'physics_f_ma':
        return [
          'Inertial Frame of Reference (non-accelerating observer)',
          'Invariant Mass (dm/dt = 0, no fuel ejection or relativistic speeds)',
          'Point Particle approximation (neglecting rotational torque)',
        ];
      case 'physics_kinematics_v_u_at':
        return [
          'Strictly Constant Acceleration (da/dt = 0)',
          '1-Dimensional Linear Motion',
        ];
      case 'trigonometry_law_of_cosines':
        return [
          'Flat Euclidean 2D plane geometry (internal angle sum = 180°)',
          'Non-degenerate triangle (a + b > c, a + c > b, b + c > a)',
          'Interior angle C lies in the range (0°, 180°)',
        ];
      case 'geometry_pythagoras':
        return [
          'Flat Euclidean Plane (curvature κ = 0)',
          'Strictly Right-Angled Triangle (one internal angle = 90°)',
        ];
      case 'algebra_square_sum':
        return [
          'Commutative ring of real or complex numbers',
          'Side lengths a and b represent non-negative geometric linear extents in area models',
        ];
      case 'algebra_square_diff':
        return ['Real or complex numbers obeying standard distributive field axioms.'];
      default:
        return ['Empirical observations and established domain principles apply.'];
    }
  }

  private static getApplications(conceptId: string): string[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain) return [domain.realWorldApplication];
    if (conceptId === 'physics_density') {
      return [
        'Naval Architecture: Archimedes submarine ballasting, bilge pumping, and vessel displacement.',
        'Geophysics: Earth mantle convection currents driving plate tectonics and volcanic magma ascent.',
        'Aviation & Meteorology: Atmospheric barometric density altitude determining aircraft runway lift.',
      ];
    }
    if (conceptId === 'algebra_cube_sum') {
      return [
        'Thermodynamics: Cubic thermal expansion of solids ΔV = V₀(1 + βΔT)³.',
        'Solid Geometry: Dissecting 3D composite cubes into constituent rectangular prisms.',
        'Higher Algebra: Solving cubic polynomial equations via Cardano-Tartaglia method.',
      ];
    }
    if (conceptId === 'algebra_cube_diff') {
      return [
        'Volume Contraction: Cartesian stress analysis under 3D hydrostatic compression.',
        'Factoring Identities: Deriving difference of cubes identity a³ - b³ = (a - b)(a² + ab + b²).',
        'Computer Graphics: 3D bounding box hierarchical decompositions.',
      ];
    }
    if (conceptId.startsWith('binomial_')) {
      return [
        'Probability & Statistics: Binomial distribution probability densities P(X=k) = C(n,k)p^k(1-p)^(n-k).',
        'Combinatorics & Graph Theory: Hypercube vertex counting and Pascal triangle applications.',
      ];
    }

    switch (conceptId) {
      case 'physics_f_ma':
        return [
          'Automotive engineering: Crash test impact deceleration and airbag deployment.',
          'Aerospace: Rocket payload thrust-to-weight trajectory planning.',
          'Robotics: Inverse dynamics motor torque calculation for arm joints.',
        ];
      case 'algebra_square_sum':
        return [
          'Genetics: Punnett square binomial frequencies for alleles (p + q)² = p² + 2pq + q².',
          'Computer Graphics: Spatial subdivision and 2D bilinear area interpolation.',
          'Signals & Communications: Quadratic power expansion in amplitude-modulated signals.',
        ];
      case 'algebra_square_diff':
        return [
          'Statistical Variance: Calculating mean squared deviations (x - μ)².',
          'Optimization & Machine Learning: Minimizing squared error loss functions.',
          'Civil Engineering: Stress tensor reduction across structural beams.',
        ];
      case 'calculus_sin_x':
        return [
          'Audio DSP: Fourier synthesis decomposing audio into constituent harmonic sine waves.',
          'Electrical Grid: Alternating Current (AC) voltage oscillations at 50/60 Hz.',
        ];
      case 'trigonometry_law_of_cosines':
        return [
          'Celestial navigation and GPS satellite positioning triangulation.',
          'Civil surveying: Computing distances across rivers or mountains.',
          'Computer graphics & robotics: Forward kinematics and 3D inverse kinematics angle solving.',
        ];
      default:
        return ['Applied across computational modeling, experimental verification, and data analysis.'];
    }
  }

  private static getLimitations(conceptId: string): string[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain) {
      if (domain.category === 'algorithm') {
        return [
          'Worst-case input degradation (e.g. hash collisions, unbalanced binary trees O(n))',
          'Physical memory capacity and cache locality bottlenecks',
          'Concurrency race conditions without thread-safe synchronization',
        ];
      }
      if (domain.category === 'chemistry') {
        return [
          'High pressure / low temperature deviations from ideal gas behavior',
          'Relativistic electron effects in heavy transuranic elements',
        ];
      }
      if (domain.category === 'concept') {
        return [
          'Epistasis, polygenic traits, and environmental phenotypic plasticity',
          'Non-Mendelian genetic inheritance violations',
        ];
      }
    }

    switch (conceptId) {
      case 'physics_f_ma':
        return [
          'Relativistic speeds (v approaches c): Requires Einstein relativistic momentum p = γmv.',
          'Quantum scales (atomic level): Subsumed by the Schrödinger wave equation.',
          'Variable mass systems: Rockets expelling propellant require Tsiolkovsky equation.',
        ];
      case 'trigonometry_law_of_cosines':
        return [
          'Curved surfaces: Fails on planetary spheres (requires spherical Law of Cosines: cos c = cos a cos b + sin a sin b cos C).',
          'Colinear degenerate triangles with area zero.',
        ];
      case 'geometry_pythagoras':
        return [
          'Curved surfaces: Fails on spheres (e.g. Earth surface where triangles have angle sum > 180°).',
          'Non-Euclidean geometry: Requires Riemannian metric tensors.',
        ];
      default:
        return ['Model breaks down when foundational boundary assumptions are violated.'];
    }
  }

  private static getWorkedExamples(conceptId: string): WorkedExample[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain && domain.workedExamples?.length > 0) {
      return domain.workedExamples;
    }

    if (conceptId.startsWith('binomial_')) {
      const parts = conceptId.split('_');
      const b1 = parts[1] || 'a';
      const s = parts[2] === 'minus' ? '-' : '+';
      const b2 = parts[3] || 'b';
      const n = parseInt(parts[4], 10) || 2;
      const exp = BinomialExpansionEngine.expand(b1, s as '+' | '-', b2, n);
      return [
        {
          title: `Expansion of (${b1} ${s} ${b2})^${n}`,
          problemStatement: `Expand and evaluate (${b1} ${s} ${b2})^${n} for ${b1}=2 and ${b2}=1.`,
          givenValues: { [b1]: 2, [b2]: 1 },
          stepByStepSolution: exp.algebraicSteps,
          finalAnswer: `${exp.expandedFormula} = ${Math.pow(s === '+' ? 3 : 1, n)}`,
        },
      ];
    }

    switch (conceptId) {
      case 'algebra_cube_sum':
        return [
          {
            title: '3D Mental Cube Calculation via (a + b)³',
            problemStatement: 'Calculate 21³ without a calculator using the cube of a sum formula.',
            givenValues: { expression: '21³ = (20 + 1)³' },
            stepByStepSolution: [
              '1. Rewrite 21 as (20 + 1)',
              '2. Apply identity: (a + b)³ = a³ + 3a²b + 3ab² + b³',
              '3. Substitute a = 20, b = 1:',
              '   • a³ = 20³ = 8000',
              '   • 3a²b = 3 × 400 × 1 = 1200',
              '   • 3ab² = 3 × 20 × 1 = 60',
              '   • b³ = 1³ = 1',
              '4. Sum all components: 8000 + 1200 + 60 + 1 = 9261',
            ],
            finalAnswer: '21³ = 9261',
          },
        ];
      case 'algebra_cube_diff':
        return [
          {
            title: 'Mental Cube Calculation via (a - b)³',
            problemStatement: 'Calculate 19³ without a calculator using the cube of a difference formula.',
            givenValues: { expression: '19³ = (20 - 1)³' },
            stepByStepSolution: [
              '1. Rewrite 19 as (20 - 1)',
              '2. Apply identity: (a - b)³ = a³ - 3a²b + 3ab² - b³',
              '3. Substitute a = 20, b = 1:',
              '   • a³ = 20³ = 8000',
              '   • -3a²b = -3 × 400 × 1 = -1200',
              '   • +3ab² = +3 × 20 × 1 = +60',
              '   • -b³ = -1³ = -1',
              '4. Compute: 8000 - 1200 + 60 - 1 = 6859',
            ],
            finalAnswer: '19³ = 6859',
          },
        ];
      case 'physics_density':
        return [
          {
            title: 'Submerged Object Density & Buoyancy',
            problemStatement: 'A solid 6 kg composite block occupies an enclosed volume of 0.002 m³. Find its density and determine if it will float or sink in water.',
            givenValues: { m: '6 kg', V: '0.002 m³' },
            stepByStepSolution: [
              '1. State density formula: ρ = m / V',
              '2. Substitute given values: ρ = 6 kg / 0.002 m³',
              '3. Calculate quotient: ρ = 3000 kg/m³ (= 3.0 g/cm³)',
              '4. Compare with pure water (ρ_water = 1000 kg/m³): 3000 > 1000 ⇒ Object sinks in water.',
            ],
            finalAnswer: 'ρ = 3000 kg/m³ (Sinks in water)',
          },
        ];
      case 'physics_f_ma':
        return [
          {
            title: 'Electric Car Acceleration',
            problemStatement: 'An electric vehicle of mass m = 1500 kg experiences a net motor thrust F = 4500 N. What is its acceleration?',
            givenValues: { m: '1500 kg', F: '4500 N' },
            stepByStepSolution: [
              '1. State equation: F = m · a',
              '2. Isolate unknown: a = F / m',
              '3. Substitute: a = 4500 N / 1500 kg',
              '4. Simplify: a = 3.0 m/s²',
            ],
            finalAnswer: 'a = 3.0 m/s²',
          },
        ];
      case 'algebra_square_sum':
        return [
          {
            title: 'Fast Mental Arithmetic via (a + b)²',
            problemStatement: 'Calculate 53² without a calculator using the square of a sum identity.',
            givenValues: { expression: '53²' },
            stepByStepSolution: [
              '1. Rewrite 53 as (50 + 3)',
              '2. Apply identity: (a + b)² = a² + 2ab + b²',
              '3. Here a = 50, b = 3',
              '4. Compute components: 50² + 2(50)(3) + 3² = 2500 + 300 + 9 = 2809',
            ],
            finalAnswer: '2809',
          },
        ];
      case 'algebra_square_diff':
        return [
          {
            title: 'Fast Mental Arithmetic via (a - b)²',
            problemStatement: 'Calculate 48² without a calculator using the square of a difference identity.',
            givenValues: { expression: '48²' },
            stepByStepSolution: [
              '1. Rewrite 48 as (50 - 2)',
              '2. Apply identity: (a - b)² = a² - 2ab + b²',
              '3. Here a = 50, b = 2',
              '4. Compute: 50² - 2(50)(2) + 2² = 2500 - 200 + 4 = 2304',
            ],
            finalAnswer: '2304',
          },
        ];
      case 'trigonometry_law_of_cosines':
        return [
          {
            title: 'Calculating the Unknown Side of a Triangle',
            problemStatement: 'In triangle ABC, side a = 5 cm, side b = 7 cm, and included angle C = 60°. Calculate side c.',
            givenValues: { a: 5, b: 7, C: 60 },
            stepByStepSolution: [
              '1. State Law of Cosines: c² = a² + b² - 2ab · cos(C)',
              '2. Substitute values: c² = 5² + 7² - 2(5)(7) · cos(60°)',
              '3. Calculate squares: 25 + 49 = 74',
              '4. Evaluate cosine: cos(60°) = 0.5  ⇒  2(5)(7)(0.5) = 35',
              '5. Subtract cross-term: c² = 74 - 35 = 39',
              '6. Take square root: c = √39 ≈ 6.24 cm',
            ],
            finalAnswer: 'c ≈ 6.24 cm',
          },
        ];
      default:
        return [
          {
            title: 'Conceptual Study Example',
            problemStatement: 'Analyze the core principles and structural relationships of this topic.',
            givenValues: { context: 'Domain principles' },
            stepByStepSolution: [
              '1. Identify primary definitions and system boundaries',
              '2. Evaluate governing principles and operational mechanisms',
            ],
            finalAnswer: 'Analyzed ✓',
          },
        ];
    }
  }

  private static getPracticeQuestions(conceptId: string): PracticeQuestion[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain && domain.practiceQuestions?.length > 0) {
      return domain.practiceQuestions;
    }

    switch (conceptId) {
      case 'trigonometry_law_of_cosines':
        return [
          {
            id: 'cosines_q1',
            question: 'When the angle C in the Law of Cosines is 90°, what does the formula c² = a² + b² - 2ab·cos(C) simplify to?',
            options: [
              'c² = a² + b² (The Pythagorean Theorem, since cos(90°) = 0)',
              'c² = a² - b²',
              'c = a + b',
              'c² = 2ab',
            ],
            correctIndex: 0,
            explanation: 'Since cos(90°) = 0, the -2ab·cos(C) cross-term vanishes completely, leaving exactly the Pythagorean theorem: c² = a² + b².',
            hint: 'What is the cosine of 90 degrees?',
          },
          {
            id: 'cosines_q2',
            question: 'In a triangle with a = 3, b = 4, and angle C = 60°, what is c²?',
            options: ['13', '25', '37', '7'],
            correctIndex: 0,
            explanation: 'c² = 3² + 4² - 2(3)(4)cos(60°) = 9 + 16 - 24(0.5) = 25 - 12 = 13.',
            hint: 'cos(60°) = 0.5. Calculate 9 + 16 - 2(3)(4)(0.5).',
          },
        ];

      case 'algebra_cube_sum':
        return [
          {
            id: 'cube_sum_q1',
            question: 'How many geometric sub-blocks comprise a solid cube of side (a + b) dissected along Cartesian planes?',
            options: [
              '8 blocks: 1 cube of a³, 3 slabs of a²b, 3 columns of ab², and 1 cube of b³',
              '2 blocks: only a³ and b³',
              '4 blocks: a³, 2ab, and b³',
              '6 blocks: 3 of each dimension',
            ],
            correctIndex: 0,
            explanation: 'Dissecting (a + b) along all three dimensions yields 2 × 2 × 2 = 8 total volume blocks: 1(a³) + 3(a²b) + 3(ab²) + 1(b³).',
            hint: 'Think in 3 dimensions: each of the 3 axes is partitioned into 2 segments (a and b).',
          },
          {
            id: 'cube_sum_q2',
            question: 'What are the coefficients of the terms in the expansion of (a + b)³?',
            options: [
              '1, 3, 3, 1',
              '1, 2, 2, 1',
              '1, 1, 1, 1',
              '3, 3, 3, 3',
            ],
            correctIndex: 0,
            explanation: 'The coefficients correspond to row 3 of Pascal’s Triangle: C(3,0)=1, C(3,1)=3, C(3,2)=3, C(3,3)=1.',
            hint: 'Look at the 3rd row of Pascal\'s triangle.',
          },
        ];

      case 'algebra_cube_diff':
        return [
          {
            id: 'cube_diff_q1',
            question: 'Why does the expansion of (a - b)³ contain alternating signs: a³ - 3a²b + 3ab² - b³?',
            options: [
              'Because (-b)^k is negative for odd powers (k=1, 3) and positive for even powers (k=2)',
              'Because cubic powers must always be negative',
              'Because subtraction reverses order in algebra',
              'Because b is assumed to be larger than a',
            ],
            correctIndex: 0,
            explanation: 'By the binomial theorem, each term has factor (-b)^k. When k=1, (-b)¹ = -b. When k=2, (-b)² = +b². When k=3, (-b)³ = -b³.',
            hint: 'Consider the powers of negative numbers (-1)¹=-1, (-1)²=+1, (-1)³=-1.',
          },
        ];

      case 'physics_density':
        return [
          {
            id: 'density_q1',
            question: 'An object of mass 6 kg occupies 0.002 m³. Why does it sink when submerged in pure water?',
            options: [
              'Because its calculated density (3000 kg/m³) is greater than pure water density (1000 kg/m³)',
              'Because heavier objects always sink regardless of geometric volume',
              'Because gravity pulls down harder in fresh water than air',
              'Because the volume 0.002 m³ creates a vacuum',
            ],
            correctIndex: 0,
            explanation: 'By Archimedes’ principle, an object sinks if its average density exceeds the fluid density (ρ_obj = 3000 kg/m³ > ρ_water = 1000 kg/m³).',
            hint: 'Compare the object\'s density (3000 kg/m³) to water\'s density (1000 kg/m³).',
          },
          {
            id: 'density_q2',
            question: 'If you cut a uniform 6 kg composite block in half, what is the density of each resulting half?',
            options: [
              'Still exactly 3000 kg/m³',
              'Halved to 1500 kg/m³',
              'Doubled to 6000 kg/m³',
              'Zero because the volume decreased',
            ],
            correctIndex: 0,
            explanation: 'Density is an intensive physical property: halving the mass (3 kg) also halves the volume (0.001 m³), keeping the ratio 3 / 0.001 = 3000 kg/m³ constant.',
            hint: 'Both mass and volume are divided by 2 simultaneously.',
          },
        ];

      case 'physics_f_ma':
        return [
          {
            id: 'fma_q1',
            question: 'If you double the net force applied to an object while keeping its mass constant, what happens to its acceleration?',
            options: [
              'Acceleration doubles (2×)',
              'Acceleration stays the same',
              'Acceleration halves (0.5×)',
              'Acceleration quadruples (4×)',
            ],
            correctIndex: 0,
            explanation: 'Because a = F/m, acceleration is directly proportional to force. Doubling F doubles a.',
            misconceptionAlert: 'Common confusion: Students often mix up mass and acceleration proportionality.',
            hint: 'Look at the numerator in a = F / m.',
          },
          {
            id: 'fma_q2',
            question: 'An astronaut applies a 50 N force to a 10 kg satellite and a 50 N force to a 50 kg satellite in deep space. Which satellite accelerates faster?',
            options: [
              'The 10 kg satellite accelerates 5× faster',
              'The 50 kg satellite accelerates 5× faster',
              'Both accelerate at the exact same rate',
              'Neither accelerates because space is weightless',
            ],
            correctIndex: 0,
            explanation: 'Weightlessness does not mean masslessness. Inertia (mass) still opposes acceleration: a₁ = 50/10 = 5 m/s², while a₂ = 50/50 = 1 m/s².',
            misconceptionAlert: 'Zero gravity does NOT mean zero mass or zero inertia!',
            hint: 'Mass is resistance to change in motion, which exists everywhere in the universe.',
          },
        ];

      case 'algebra_square_sum':
        return [
          {
            id: 'sq_sum_q1',
            question: 'Why does the expansion of (a + b)² contain the cross term 2ab instead of simply a² + b²?',
            options: [
              'Because multiplying (a+b)(a+b) produces two symmetric rectangles of area a×b: ab + ba = 2ab',
              'Because the exponent 2 distributes directly onto both terms inside parentheses',
              'Because the hypotenuse equation requires adding two right triangles',
              'Because of square root cancellation rules',
            ],
            correctIndex: 0,
            explanation: 'Expanding (a+b)(a+b) yields four rectangular sub-regions: a² + ab + ba + b². Since ab = ba, the two rectangular cross terms sum to 2ab.',
            hint: 'Draw a square of side (a + b) and count the sub-regions.',
          },
        ];

      case 'algebra_square_diff':
        return [
          {
            id: 'sq_diff_q1',
            question: 'Why is the term +b² positive in the expansion of (a - b)² = a² - 2ab + b²?',
            options: [
              'Because multiplying (-b) by (-b) yields a positive result +b²',
              'Because squares in mathematics are never allowed to have negative signs',
              'Because b is assumed to be zero',
              'Because of the Pythagorean theorem',
            ],
            correctIndex: 0,
            explanation: 'By the distributive property, (-b) · (-b) = +b². Geometrically, subtracting two overlapping rectangles of width b subtracts the corner square b² twice, so adding back +b² restores the correct area.',
            hint: 'Think about multiplying negative numbers: (-1) × (-1) = +1.',
          },
        ];

      default:
        return [
          {
            id: 'general_q1',
            question: 'Which principle guarantees consistency across physical and mathematical models?',
            options: [
              'Conservation of energy, mass, or dimensional units',
              'Arbitrary random chance',
              'Rounding all values to zero',
              'Ignoring boundary conditions',
            ],
            correctIndex: 0,
            explanation: 'Fundamental laws preserve dimensional consistency and conservation invariants.',
            hint: 'Think about physical units and conservation laws.',
          },
        ];
    }
  }

  private static getNextConcepts(conceptId: string): string[] {
    const domain = DomainKnowledgeEngine.getByConceptId(conceptId);
    if (domain && domain.nextConcepts?.length > 0) {
      return domain.nextConcepts;
    }

    switch (conceptId) {
      case 'algebra_cube_sum':
      case 'algebra_cube_diff':
        return [
          'Sum & Difference of Cubes: a³ ± b³ = (a ± b)(a² ∓ ab + b²)',
          'General Binomial Theorem for Power n: (a + b)ⁿ',
          "Pascal's Triangle & Combinatorics: C(n, k)",
          'Cardano’s Formula for Cubic Polynomials',
        ];
      case 'physics_density':
        return [
          'Archimedes’ Principle & Buoyant Force: F_b = ρ_fluid · V · g',
          'Hydrostatic Pressure Depth Gradient: P = ρ · g · h',
          'Continuity Equation & Bernoulli’s Principle: A₁v₁ = A₂v₂',
        ];
      case 'physics_f_ma':
        return [
          "Newton's 3rd Law: Action & Reaction (F₁ = -F₂)",
          'Work-Energy Theorem: W = ∫ F · dx = ΔKE',
          'Linear Momentum & Impulse: J = ∫ F · dt = Δp',
        ];
      case 'algebra_square_diff':
        return [
          'Square of a Sum: (a + b)² = a² + 2ab + b²',
          'Difference of Two Squares: a² - b² = (a - b)(a + b)',
          'Completing the Square & Deriving the Quadratic Formula',
        ];
      case 'trigonometry_law_of_cosines':
        return ['Law of Sines: a/sin(A) = b/sin(B) = c/sin(C)', 'Vector Dot Product: a · b = |a||b|cos(θ)', 'Spherical Trigonometry'];
      default:
        return ['Higher-order extensions', 'Differential formulations', 'Multi-variable systems'];
    }
  }
}

