import { CapabilityLevel, RendererType, InputCategory } from './types';

export interface DomainCapability {
  id: string;
  name: string;
  category: InputCategory;
  level: CapabilityLevel;
  supportedOperations: string[];
  supportedRenderers: RendererType[];
  verifiedTopics: string[];
  limitations: string[];
}

export class CapabilityRegistry {
  private static domains: DomainCapability[] = [
    {
      id: 'classical_mechanics',
      name: 'Classical Mechanics & Dynamics',
      category: 'physics',
      level: 'verified_and_tested',
      supportedOperations: ['algebraic_rearrangement', 'numerical_evaluation', 'unit_dimensional_check'],
      supportedRenderers: ['physics_vector_simulator', 'function_coordinate_plotter'],
      verifiedTopics: ['F = ma', 'v = u + at', 'Newton Second Law', 'Uniform Acceleration'],
      limitations: ['Non-relativistic speeds only (v << c)', 'Point mass approximation'],
    },
    {
      id: 'polynomial_identities',
      name: 'Polynomial Algebra & Factoring',
      category: 'algebra',
      level: 'verified_and_tested',
      supportedOperations: ['binomial_expansion', 'factoring_by_grouping', 'area_dissection_proof'],
      supportedRenderers: ['formula_geometric_dissection'],
      verifiedTopics: ['(a - b)²', 'a² + b² - 2ab', '(a + b)²', 'a² - b²', 'ax² + bx + c = 0'],
      limitations: ['Real and standard complex domain polynomials'],
    },
    {
      id: 'harmonic_calculus',
      name: 'Harmonic Functions & Calculus',
      category: 'calculus',
      level: 'verified_and_tested',
      supportedOperations: ['differentiation', 'coordinate_curve_plotting', 'phase_angle_evaluation'],
      supportedRenderers: ['function_coordinate_plotter'],
      verifiedTopics: ['y = sin(x)', 'Sine Wave', 'Harmonic Oscillations'],
      limitations: ['Single variable real functions'],
    },
    {
      id: 'euclidean_geometry',
      name: 'Euclidean Geometry',
      category: 'geometry',
      level: 'verified_and_tested',
      supportedOperations: ['hypotenuse_calculation', 'area_conservation_proof', 'triangle_construction'],
      supportedRenderers: ['geometric_triangle_construction'],
      verifiedTopics: ['Pythagorean Theorem', 'a² + b² = c²'],
      limitations: ['Euclidean flat space only (κ = 0)'],
    },
    {
      id: 'algorithms_datastructures',
      name: 'Algorithms & Data Structures',
      category: 'algorithm',
      level: 'verified_and_tested',
      supportedOperations: ['step_by_step_trace', 'pointer_halving_simulation', 'complexity_analysis'],
      supportedRenderers: ['algorithm_array_tracer'],
      verifiedTopics: ['Binary Search', 'Divide and Conquer O(log n)'],
      limitations: ['1D indexed sorted arrays'],
    },
    {
      id: 'chemistry_stoichiometry',
      name: 'Stoichiometric Chemistry',
      category: 'chemistry',
      level: 'partial_with_limitations',
      supportedOperations: ['molar_balance_check', 'reaction_schematic'],
      supportedRenderers: ['svg_schematic_fallback'],
      verifiedTopics: ['2H₂ + O₂ → 2H₂O'],
      limitations: ['Molecular 3D ball-and-stick simulations not yet fully enabled; schematic representation provided.'],
    },
  ];

  static getAllCapabilities(): DomainCapability[] {
    return this.domains;
  }

  static getCapabilityForCategory(category: InputCategory): DomainCapability | undefined {
    return this.domains.find((d) => d.category === category);
  }

  static isConceptVerified(topicOrFormula: string): boolean {
    const clean = topicOrFormula.toLowerCase();
    return this.domains.some((d) =>
      d.verifiedTopics.some((t) => clean.includes(t.toLowerCase()))
    );
  }
}

