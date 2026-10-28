/**
 * VisiOS — Engine Capability Registry
 * Phase 1: Unified Architecture & Integration
 * Authoritative record of genuinely implemented and verified engine capabilities.
 * Prevents phantom routing, rejects unsupported capabilities honestly,
 * and specifies precise inputs, outputs, visualizers, and limitations.
 */

import {
  TopicDomain,
  CapabilityLevel,
  RendererType,
  InputCategory,
} from './types';
import { LearningRequest } from './UnifiedLearningContracts';
import { MathInputNormalizer } from './MathInputNormalizer';

export interface EngineCapability {
  id: string;
  name: string;
  domain: TopicDomain;
  engineType: 'math' | 'physics' | 'simulation' | 'algorithm' | '3d' | 'knowledge' | 'document';
  level: CapabilityLevel;
  supportedTasks: string[];
  matchPatterns: string[];
  matchPredicate?: (query: string, domain?: string) => boolean;
  requiredParameters: string[];
  expectedOutputCategories: string[];
  supportedVisualizers: RendererType[];
  limitations: string[];
  verifiedExamples: string[];
}

export class EngineCapabilityRegistry {
  private static readonly capabilities: EngineCapability[] = [
    // ========================================================================
    // 1. MATHEMATICS CAPABILITIES
    // ========================================================================
    {
      id: 'cap_polynomial_identities',
      name: 'Polynomial Algebra & Binomial Identities',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['binomial_expansion', 'polynomial_factoring', 'geometric_dissection_proof'],
      matchPatterns: ['(a+b)', '(a-b)', '(a + b)', '(a - b)', 'binomial', 'polynomial', 'a² - b²', 'a² + b²'],
      matchPredicate: (q) =>
        !q.includes('density') &&
        !q.includes('volume') &&
        !q.includes('m³') &&
        !q.includes('m^3') &&
        (q.includes('^2') || q.includes('²') || q.includes('^3') || q.includes('³') || q.includes('binomial')),
      requiredParameters: ['a', 'b'],
      expectedOutputCategories: ['algebraic_expansion', 'geometric_proof', 'step_derivation'],
      supportedVisualizers: ['formula_geometric_dissection'],
      limitations: ['Powers n ≤ 10 for deterministic visual geometric slicing.'],
      verifiedExamples: ['(a - b)²', '(a + b)²', '(x + y)^3', 'a² - b²'],
    },
    {
      id: 'cap_euclidean_geometry',
      name: 'Euclidean Right Triangle & Pythagorean Proof',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['hypotenuse_calculation', 'triangle_construction', 'dissection_proof'],
      matchPatterns: ['pythagor', 'a² + b² = c²', 'a^2 + b^2 = c^2', 'hypotenuse', 'right triangle'],
      requiredParameters: ['a', 'b'],
      expectedOutputCategories: ['side_lengths', 'geometric_construction', 'area_squares'],
      supportedVisualizers: ['geometric_triangle_construction'],
      limitations: ['Euclidean flat space only (κ = 0). Positive real side lengths.'],
      verifiedExamples: ['Pythagorean theorem', 'a² + b² = c²', '3-4-5 right triangle'],
    },
    {
      id: 'cap_trigonometry_law_of_cosines',
      name: 'Trigonometry & Law of Cosines',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['general_triangle_solving', 'law_of_cosines_evaluation', 'angle_finding'],
      matchPatterns: ['law of cosine', 'cosine rule', 'c² = a² + b² - 2ab', 'c^2 = a^2 + b^2 - 2ab', 'c2 = a2 + b2 - 2ab'],
      requiredParameters: ['a', 'b', 'C'],
      expectedOutputCategories: ['triangle_sides', 'angle_radians', 'geometric_projection'],
      supportedVisualizers: ['geometric_triangle_construction'],
      limitations: ['Non-degenerate triangles (a + b > c, b + c > a, a + c > b).'],
      verifiedExamples: ['Law of Cosines', 'cosine rule', 'c² = a² + b² - 2ab cos(C)'],
    },
    {
      id: 'cap_linear_functions',
      name: 'Cartesian Coordinate Geometry & Linear Functions',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['slope_intercept_plotting', 'tangent_evaluation', 'intercept_calculation'],
      matchPatterns: ['y = mx + c', 'y=mx+c', 'y = mx + b', 'linear function', 'slope intercept', 'rise over run'],
      matchPredicate: (q) =>
        /y\s*=\s*[-+]?\d*\.?\d*\s*\*?\s*x/i.test(q) ||
        MathInputNormalizer.normalize(q).mathType === 'linear_equation',
      requiredParameters: ['m', 'c'],
      expectedOutputCategories: ['coordinates', 'slope_triangle', 'y_intercept'],
      supportedVisualizers: ['function_coordinate_plotter'],
      limitations: ['2D Cartesian plane. Non-vertical lines (m < ∞).'],
      verifiedExamples: ['y = mx + c', 'y = 2x + 1', 'slope intercept form'],
    },
    {
      id: 'cap_harmonic_curves',
      name: 'Trigonometric & Exponential Curves',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['wave_function_plotting', 'derivative_slope_probe', 'periodicity_analysis'],
      matchPatterns: ['y = sin(x)', 'y = cos(x)', 'y=cos', 'y=sin', 'exp(x)', 'e^x', 'harmonic curve'],
      matchPredicate: (q) =>
        (q.includes('sin') || q.includes('cos') || q.includes('tan') || q.includes('e^')) &&
        !q.includes('law of cosine'),
      requiredParameters: ['x'],
      expectedOutputCategories: ['function_curve', 'instantaneous_tangent', 'extrema'],
      supportedVisualizers: ['function_coordinate_plotter'],
      limitations: ['Real single-variable continuous functions.'],
      verifiedExamples: ['y = sin(x)', 'y = cos(x)', 'e^(cos(x))'],
    },
    {
      id: 'cap_rational_fractions',
      name: 'Fractions & Rational Number Dissection',
      domain: 'mathematics',
      engineType: 'math',
      level: 'verified_and_tested',
      supportedTasks: ['fraction_partitioning', 'equivalence_scaling', 'tape_disk_representation'],
      matchPatterns: ['fraction', 'fractions', 'numerator', 'denominator', 'rational number', 'equivalent fraction'],
      requiredParameters: ['numerator', 'denominator'],
      expectedOutputCategories: ['partitioned_disk', 'tape_strip', 'reduced_fraction'],
      supportedVisualizers: ['formula_geometric_dissection'],
      limitations: ['Denominator b ≠ 0. Standard integer numerators and denominators.'],
      verifiedExamples: ['fractions', '3/4 fraction visualizer', 'equivalent fractions'],
    },

    // ========================================================================
    // 2. PHYSICS & SIMULATION CAPABILITIES
    // ========================================================================
    {
      id: 'cap_newtonian_force_dynamics',
      name: "Newton's Second Law & Classical Dynamics",
      domain: 'physics',
      engineType: 'physics',
      level: 'verified_and_tested',
      supportedTasks: ['force_acceleration_calculation', 'vector_diagram_simulation', 'unit_dimensional_check'],
      matchPatterns: ['f = ma', 'f=ma', 'newton second law', 'force mass acceleration'],
      requiredParameters: ['F', 'm'],
      expectedOutputCategories: ['acceleration_vector', 'cart_kinematics', 'net_force'],
      supportedVisualizers: ['physics_vector_simulator'],
      limitations: ['Non-relativistic velocities (v ≪ c). Point mass and rigid block approximation.'],
      verifiedExamples: ['F = ma', "Newton's Second Law", 'force of 20N on 4kg mass'],
    },
    {
      id: 'cap_kinematics_linear',
      name: 'Uniformly Accelerated Linear Kinematics',
      domain: 'physics',
      engineType: 'physics',
      level: 'verified_and_tested',
      supportedTasks: ['velocity_time_plotting', 'displacement_area_integration', 'acceleration_rate'],
      matchPatterns: ['v = u + at', 'v=u+at', 'kinematics', 'uniform acceleration'],
      requiredParameters: ['u', 'a', 't'],
      expectedOutputCategories: ['final_velocity', 'displacement_trapezoid', 'vt_graph'],
      supportedVisualizers: ['function_coordinate_plotter'],
      limitations: ['Constant 1D acceleration along straight trajectory.'],
      verifiedExamples: ['v = u + at', 'initial velocity 5 m/s acceleration 2 m/s²'],
    },
    {
      id: 'cap_harmonic_pendulum',
      name: 'Interactive Gravitational Pendulum Simulation',
      domain: 'physics',
      engineType: 'simulation',
      level: 'verified_and_tested',
      supportedTasks: ['oscillation_period_computation', 'energy_conservation_tracking', 'nonlinear_phase_space'],
      matchPatterns: ['pendulum', 'simulate a pendulum', 'simple pendulum', 'pendulum oscillation'],
      requiredParameters: ['length', 'gravity', 'initialAngle'],
      expectedOutputCategories: ['period_seconds', 'kinetic_energy', 'potential_energy', 'phase_angle'],
      supportedVisualizers: ['pendulum_simulation'],
      limitations: ['Inextensible rod/string. Small-angle approximation is exact below 15°; Runge-Kutta numerical integration used above 15°.'],
      verifiedExamples: ['simulate a pendulum', 'pendulum 2m length', 'harmonic pendulum oscillation'],
    },
    {
      id: 'cap_projectile_motion',
      name: 'Interactive Projectile Motion & Trajectory Simulation',
      domain: 'physics',
      engineType: 'simulation',
      level: 'verified_and_tested',
      supportedTasks: ['trajectory_simulation', 'angle_optimization', 'range_and_flight_time_computation', 'scenario_comparison'],
      matchPatterns: ['projectile', 'simulate projectile motion', 'launch angle', 'trajectory', 'compare two launch angles', 'two launch angles'],
      requiredParameters: ['speed', 'angle', 'gravity'],
      expectedOutputCategories: ['flight_time', 'max_height', 'horizontal_range', 'trajectory_points'],
      supportedVisualizers: ['physics_vector_simulator'],
      limitations: ['Uniform gravity, flat terrain, negligible air drag.'],
      verifiedExamples: ['simulate projectile motion', 'compare two launch angles', 'projectile trajectory at 45 degrees'],
    },
    {
      id: 'cap_density_buoyancy',
      name: 'Density & Archimedean Buoyancy Evaluation',
      domain: 'physics',
      engineType: 'physics',
      level: 'verified_and_tested',
      supportedTasks: ['density_calculation', 'buoyancy_assessment', 'unit_conversion'],
      matchPatterns: ['density', 'ρ = m / v', 'mass / volume', 'mass/volume', 'buoyancy'],
      requiredParameters: ['mass', 'volume'],
      expectedOutputCategories: ['density_value', 'floating_or_sinking', 'buoyancy_ratio'],
      supportedVisualizers: ['function_coordinate_plotter', 'formula_geometric_dissection'],
      limitations: ['Homogeneous material composition. Incompressible fluid (standard water density 1,000 kg/m³).'],
      verifiedExamples: ['density of 6kg in 0.002m³', 'ρ = m / V', 'buoyancy in water'],
    },
    {
      id: 'cap_kinetic_energy',
      name: 'Kinetic Energy & Mechanical Work',
      domain: 'physics',
      engineType: 'physics',
      level: 'verified_and_tested',
      supportedTasks: ['energy_evaluation', 'velocity_squared_scaling', 'work_equivalence'],
      matchPatterns: ['kinetic energy', 'ke = 1/2', 'ke = 0.5', '1/2 m v²'],
      requiredParameters: ['mass', 'velocity'],
      expectedOutputCategories: ['joules_energy', 'velocity_curve'],
      supportedVisualizers: ['function_coordinate_plotter'],
      limitations: ['Translational kinetic energy only (excludes rotational moment of inertia).'],
      verifiedExamples: ['kinetic energy of 10kg at 5m/s', 'KE = 1/2 m v²'],
    },
    {
      id: 'cap_ohms_law',
      name: "Ohm's Law & DC Electrical Resistance",
      domain: 'physics',
      engineType: 'physics',
      level: 'verified_and_tested',
      supportedTasks: ['voltage_current_resistance_solving', 'power_dissipation', 'linear_iv_characteristic'],
      matchPatterns: ["ohm's law", 'ohms law', 'v = ir', 'v=ir', 'voltage current resistance'],
      requiredParameters: ['voltage', 'current', 'resistance'],
      expectedOutputCategories: ['volts_amps_ohms', 'iv_curve'],
      supportedVisualizers: ['function_coordinate_plotter'],
      limitations: ['Ohmic conductors with constant resistance (ignores thermal resistance drift).'],
      verifiedExamples: ["Ohm's law", 'V = IR', '12V battery across 4 ohm resistor'],
    },

    // ========================================================================
    // 3. COMPUTER SCIENCE & ALGORITHMS
    // ========================================================================
    {
      id: 'cap_cs_binary_search',
      name: 'Binary Search & Divide-and-Conquer Algorithm Tracing',
      domain: 'computer_science',
      engineType: 'algorithm',
      level: 'verified_and_tested',
      supportedTasks: ['pointer_step_trace', 'complexity_analysis', 'range_halving_simulation'],
      matchPatterns: ['binary search', 'bsearch', 'divide and conquer', 'search sorted array'],
      requiredParameters: ['array', 'target'],
      expectedOutputCategories: ['pointers_low_mid_high', 'comparison_history', 'log_n_steps'],
      supportedVisualizers: ['algorithm_array_tracer'],
      limitations: ['1D pre-sorted arrays. Constant access time O(1) indexed structures.'],
      verifiedExamples: ['binary search', 'binary search in [2, 4, 7, 10, 14, 21]', 'search algorithm'],
    },
    {
      id: 'cap_cs_data_structures',
      name: 'Fundamental Linear & Non-Linear Data Structures',
      domain: 'computer_science',
      engineType: 'algorithm',
      level: 'verified_and_tested',
      supportedTasks: ['lifo_fifo_simulation', 'pointer_node_linking', 'tree_traversal'],
      matchPatterns: ['data structure', 'stack', 'queue', 'linked list', 'binary tree', 'lifo', 'fifo'],
      requiredParameters: ['structureType'],
      expectedOutputCategories: ['node_references', 'push_pop_enqueue_dequeue', 'asymptotic_bounds'],
      supportedVisualizers: ['algorithm_array_tracer', 'svg_schematic_fallback'],
      limitations: ['In-memory reference abstractions; no OS hardware cache-line modeling.'],
      verifiedExamples: ['stack LIFO operations', 'queue FIFO queueing', 'singly linked list traversal'],
    },

    // ========================================================================
    // 4. 3D SPATIAL & ANATOMICAL VISUALIZATIONS (Three.js WebGL)
    // ========================================================================
    {
      id: 'cap_3d_anatomy_nervous_system',
      name: '3D Human Nervous System Anatomy & Brain Structures',
      domain: 'biology',
      engineType: '3d',
      level: 'verified_and_tested',
      supportedTasks: ['structure_inspection', 'brain_cns_pns_hierarchy', 'action_potential_signaling'],
      matchPatterns: ['nervous system', 'human brain', 'spinal cord', 'neuron', 'synapse', 'action potential', 'dendrite', 'axon'],
      requiredParameters: ['structureTarget'],
      expectedOutputCategories: ['3d_mesh_inspection', 'structure_role_overview', 'linked_curriculum_action'],
      supportedVisualizers: ['model3d_viewer'],
      limitations: ['Procedural high-fidelity biological representation designed for conceptual learning; not a diagnostic medical scan.'],
      verifiedExamples: ['Nervous system', 'Human brain and spinal cord', 'Neuron and action potential'],
    },
    {
      id: 'cap_3d_anatomy_cardiovascular',
      name: '3D Human Heart Anatomy & Cardiac Cycle',
      domain: 'biology',
      engineType: '3d',
      level: 'verified_and_tested',
      supportedTasks: ['cardiac_chamber_inspection', 'valvular_blood_flow', 'myocardial_contraction_cycle'],
      matchPatterns: ['heart', 'cardiac', 'ventricle', 'atrium', 'aorta', 'cardiovascular'],
      requiredParameters: ['chamberTarget'],
      expectedOutputCategories: ['3d_heart_model', 'blood_circulation_cycle', 'structure_metadata'],
      supportedVisualizers: ['model3d_viewer'],
      limitations: ['Conceptual 4-chamber anatomical geometry with interactive pulse; non-surgical model.'],
      verifiedExamples: ['Human heart anatomy', 'Cardiac cycle and blood flow'],
    },
    {
      id: 'cap_3d_chemistry_molecules',
      name: '3D VSEPR Molecular Geometry & Chemical Bonds',
      domain: 'chemistry',
      engineType: '3d',
      level: 'verified_and_tested',
      supportedTasks: ['vsepr_bond_angles', 'ball_and_stick_spatial_orientation', 'dipole_polarity_inspection'],
      matchPatterns: ['molecule', 'chemical structure', 'h2o', 'water molecule', 'ch4', 'methane', 'co2', 'carbon dioxide', 'tetrahedral', 'vsepr'],
      requiredParameters: ['molecularFormula'],
      expectedOutputCategories: ['ball_and_stick_mesh', 'bond_angles_degrees', 'atom_electronegativity'],
      supportedVisualizers: ['model3d_viewer'],
      limitations: ['Rigid-rotor ball-and-stick geometry; electron orbitals approximated via spatial bond vectors.'],
      verifiedExamples: ['Water molecule H2O', 'Methane CH4 tetrahedral', 'CO2 carbon dioxide'],
    },
    {
      id: 'cap_3d_geometry_polyhedra',
      name: '3D Platonic Solids, Polyhedra & Euler Invariants',
      domain: 'mathematics',
      engineType: '3d',
      level: 'verified_and_tested',
      supportedTasks: ['face_vertex_edge_counting', 'euler_characteristic_validation', 'spatial_rotation'],
      matchPatterns: ['platonic solid', 'polyhedra', 'cube', 'octahedron', 'tetrahedron', 'dodecahedron', 'icosahedron', 'euler characteristic'],
      requiredParameters: ['solidType'],
      expectedOutputCategories: ['3d_polyhedron_mesh', 'euler_invariant_v_e_f', 'symmetry_groups'],
      supportedVisualizers: ['model3d_viewer'],
      limitations: ['Convex uniform polyhedra in 3D Euclidean space.'],
      verifiedExamples: ['Platonic solids and polyhedra', 'Cube and octahedron geometry', 'Euler characteristic V - E + F = 2'],
    },

    // ========================================================================
    // 5. DOCUMENT-GROUNDED & FACTUAL KNOWLEDGE
    // ========================================================================
    {
      id: 'cap_document_grounded_learning',
      name: 'Document-Grounded Learning & Page Citation Synthesis',
      domain: 'other',
      engineType: 'document',
      level: 'verified_and_tested',
      supportedTasks: ['page_citation_attribution', 'document_concept_extraction', 'grounded_quiz_generation'],
      matchPatterns: ['document', 'page citation', 'imported syllabus', 'lecture notes'],
      matchPredicate: (_, domain) => domain === 'document_grounded',
      requiredParameters: ['documentId', 'rawText'],
      expectedOutputCategories: ['grounded_summary', 'page_excerpts', 'attributed_practice_questions'],
      supportedVisualizers: ['svg_schematic_fallback'],
      limitations: ['Grounded solely in text content extracted from user documents; flags uncited statements.'],
      verifiedExamples: ['Document summary with citations', 'Chapter 4 physics notes'],
    },
    {
      id: 'cap_factual_knowledge_retrieval',
      name: 'Encyclopedic Factual Knowledge Retrieval & Attribution',
      domain: 'other',
      engineType: 'knowledge',
      level: 'curriculum_trusted' as any,
      supportedTasks: ['factual_entity_lookup', 'source_attribution', 'prerequisite_unfolding'],
      matchPatterns: ['who is', 'history of', 'biography', 'concept overview', 'alan turing', 'turing', 'ada lovelace', 'history'],
      matchPredicate: (q) =>
        q.includes('who is') ||
        q.includes('history of') ||
        q.includes('biography') ||
        q.includes('alan turing') ||
        q.includes('ada lovelace') ||
        q.includes('turing') ||
        q.includes('history'),
      requiredParameters: ['query'],
      expectedOutputCategories: ['verified_summary', 'source_url', 'license_info'],
      supportedVisualizers: ['svg_schematic_fallback'],
      limitations: ['External factual synthesis; relies on official verified encyclopedic records.'],
      verifiedExamples: ['Alan Turing', 'History of Calculus', 'Photosynthesis biological process'],
    },
  ];

  /**
   * Returns all registered engine capabilities.
   */
  public static getAllCapabilities(): EngineCapability[] {
    return [...this.capabilities];
  }

  /**
   * Retrieves an engine capability by unique capability ID.
   */
  public static getCapabilityById(id: string): EngineCapability | undefined {
    return this.capabilities.find((cap) => cap.id === id);
  }

  /**
   * Filters capabilities by topic domain.
   */
  public static getCapabilitiesByDomain(domain: TopicDomain): EngineCapability[] {
    return this.capabilities.filter((cap) => cap.domain === domain);
  }

  /**
   * Filters capabilities supporting a specific renderer type.
   */
  public static getCapabilitiesForRenderer(renderer: RendererType): EngineCapability[] {
    return this.capabilities.filter((cap) => cap.supportedVisualizers.includes(renderer));
  }

  /**
   * Intelligently resolves an incoming LearningRequest to its most specific supported EngineCapability.
   * Explicitly returns isSupported: false if the input cannot be verified or handled honestly.
   */
  public static resolveCapability(request: LearningRequest): {
    capability: EngineCapability | null;
    isSupported: boolean;
    reason?: string;
  } {
    const query = (request.input || '').toLowerCase().trim();

    if (!query) {
      return {
        capability: null,
        isSupported: false,
        reason: 'Empty input query provided.',
      };
    }

    // 0. Explicit Document Context check
    if (request.context?.documentId) {
      const docCap = this.getCapabilityById('cap_document_grounded_learning');
      if (docCap) {
        return { capability: docCap, isSupported: true };
      }
    }

    // 1. Precise Pattern & Predicate Matching
    for (const cap of this.capabilities) {
      // Direct pattern match
      const matchesPattern = cap.matchPatterns.some((pattern) =>
        query.includes(pattern.toLowerCase())
      );

      if (matchesPattern) {
        return { capability: cap, isSupported: true };
      }

      // Predicate match (if provided)
      if (cap.matchPredicate && cap.matchPredicate(query, request.context?.subject)) {
        return { capability: cap, isSupported: true };
      }
    }

    // 2. Genuine Unsupported Capability (Do not fabricate or silently route unbacked queries)
    return {
      capability: null,
      isSupported: false,
      reason: `No verified engine capability found for query: "${request.input}". VisiOS does not fabricate unbacked models.`,
    };
  }

  // Backward compatibility alias for legacy CapabilityRegistry consumers
  public static getCapabilityForCategory(category: InputCategory): any {
    const domainMapping: Record<string, string> = {
      algebra: 'cap_polynomial_identities',
      calculus: 'cap_harmonic_curves',
      physics: 'cap_newtonian_force_dynamics',
      geometry: 'cap_euclidean_geometry',
      algorithm: 'cap_cs_binary_search',
      chemistry: 'cap_3d_chemistry_molecules',
      biology: 'cap_3d_anatomy_nervous_system',
      concept: 'cap_factual_knowledge_retrieval',
    };
    const capId = domainMapping[category];
    return capId ? this.getCapabilityById(capId) : undefined;
  }
}
