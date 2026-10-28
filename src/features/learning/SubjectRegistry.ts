/**
 * VisiOS — Multi-Subject Knowledge Registry
 * Step 8: Declarative, extensible registry of subjects, pedagogical learning strategies,
 * computational capabilities, supported visualizers, and transparent domain limitations.
 */

import { CanonicalRendererType } from './VisualizationRegistry';
import { CapabilityLevel, TopicDomain } from './types';

export type SubjectId =
  | 'computer_science'
  | 'mathematics'
  | 'physics'
  | 'biology'
  | 'chemistry'
  | 'general_knowledge'
  | string;

export type KnowledgeProviderType = 'wikipedia' | 'local_ai' | 'curriculum_engine';

export interface SubjectLearningStrategy {
  focusAreas: string[];
  coreSections: string[];
  pedagogicalModel: string;
}

export interface SubjectCapabilities {
  hasSpecializedEngine: boolean;
  specializedEngineId: 'algorithm' | 'math' | 'simulation' | 'knowledge' | 'none';
  hasCalculationEngine: boolean;
  hasInteractiveSimulation: boolean;
  hasAlgorithmTracer: boolean;
  hasFactualRetrieval: boolean;
  hasLocalAiFallback: boolean;
  capabilityLevel: CapabilityLevel;
}

export interface SubjectDefinition {
  id: SubjectId;
  displayName: string;
  supportedTopicFamilies: string[];
  schemaId: string;
  schemaVersion: number;
  learningStrategy: SubjectLearningStrategy;
  capabilities: SubjectCapabilities;
  supportedRendererTypes: CanonicalRendererType[];
  defaultRendererType: CanonicalRendererType;
  prerequisiteTrackId?: string;
  knowledgeProviders: KnowledgeProviderType[];
  knownLimitations: string[];
}

/**
 * Initial declarative registry of academic subjects.
 * Tracks actual capabilities separately rather than claiming full support upon registration.
 */
export const INITIAL_SUBJECT_REGISTRY: Record<string, SubjectDefinition> = {
  // 1. Computer Science
  computer_science: {
    id: 'computer_science',
    displayName: 'Computer Science',
    supportedTopicFamilies: [
      'Algorithms',
      'Data Structures',
      'Asymptotic Complexity (Big-O)',
      'Contiguous Memory Layout',
      'Pointer Structures',
      'Searching & Sorting',
    ],
    schemaId: 'v1_cs_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Concepts', 'Operations', 'Algorithms', 'Complexity Analysis', 'Step-by-step Traces'],
      coreSections: ['concept_overview', 'memory_layout', 'asymptotic_complexity', 'worked_trace', 'practice_questions'],
      pedagogicalModel: 'Discrete state progression, pointer addressing, and algorithmic invariants',
    },
    capabilities: {
      hasSpecializedEngine: true,
      specializedEngineId: 'algorithm',
      hasCalculationEngine: true,
      hasInteractiveSimulation: false,
      hasAlgorithmTracer: true,
      hasFactualRetrieval: true,
      hasLocalAiFallback: true,
      capabilityLevel: 'verified_and_tested',
    },
    supportedRendererTypes: ['algorithm_array_tracer', 'svg_schematic_fallback', 'none'],
    defaultRendererType: 'algorithm_array_tracer',
    prerequisiteTrackId: 'cs_curriculum_track',
    knowledgeProviders: ['curriculum_engine', 'local_ai', 'wikipedia'],
    knownLimitations: [
      'Interactive step tracer is currently optimized for 1D arrays and sequential data structures; advanced tree/graph rotations use schematic fallbacks.',
      'Arbitrary student code execution is disabled for browser security; uses deterministic algorithmic traces.',
    ],
  },

  // 2. Mathematics
  mathematics: {
    id: 'mathematics',
    displayName: 'Mathematics',
    supportedTopicFamilies: [
      'Algebra & Quadratics',
      'Polynomial Identities',
      'Calculus & Harmonic Functions',
      'Trigonometry',
      'Euclidean Geometry',
      'Coordinate Plotting',
    ],
    schemaId: 'v1_math_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Definitions', 'Formal Equations', 'Step-by-step Derivations', 'Axiomatic Assumptions', 'Worked Problems'],
      coreSections: ['definition', 'equation', 'symbolic_derivation', 'assumptions', 'worked_solution', 'practice_questions'],
      pedagogicalModel: 'Deductive symbolic transformation and multi-dimensional geometric proof',
    },
    capabilities: {
      hasSpecializedEngine: true,
      specializedEngineId: 'math',
      hasCalculationEngine: true,
      hasInteractiveSimulation: false,
      hasAlgorithmTracer: false,
      hasFactualRetrieval: false,
      hasLocalAiFallback: true,
      capabilityLevel: 'verified_and_tested',
    },
    supportedRendererTypes: [
      'formula_geometric_dissection',
      'function_coordinate_plotter',
      'geometric_triangle_construction',
      'svg_schematic_fallback',
      'none',
    ],
    defaultRendererType: 'function_coordinate_plotter',
    prerequisiteTrackId: 'math_curriculum_track',
    knowledgeProviders: ['curriculum_engine', 'local_ai'],
    knownLimitations: [
      'Closed-form symbolic steps are supported for quadratics, polynomials, trigonometry, and basic geometry; generalized higher-degree differential systems rely on heuristic explanations.',
      'External encyclopedic sources (e.g. Wikipedia) are not treated as authoritative for deductive mathematical derivations.',
    ],
  },

  // 3. Physics
  physics: {
    id: 'physics',
    displayName: 'Physics',
    supportedTopicFamilies: [
      'Classical Mechanics',
      'Newtonian Dynamics',
      'Kinematics',
      'Harmonic Oscillations',
      'Dimensional Analysis & SI Units',
    ],
    schemaId: 'v1_physics_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Physical Laws', 'Variables with SI Units', 'Kinematic Assumptions', 'Causal Relationships', 'Supported Models'],
      coreSections: ['physical_law', 'variables_units', 'assumptions', 'derivation', 'dynamic_experiment', 'worked_example'],
      pedagogicalModel: 'Newtonian mechanics with continuous state propagation and dimensional verification',
    },
    capabilities: {
      hasSpecializedEngine: true,
      specializedEngineId: 'simulation',
      hasCalculationEngine: true,
      hasInteractiveSimulation: true,
      hasAlgorithmTracer: false,
      hasFactualRetrieval: true,
      hasLocalAiFallback: true,
      capabilityLevel: 'verified_and_tested',
    },
    supportedRendererTypes: [
      'physics_vector_simulator',
      'pendulum_simulation',
      'function_coordinate_plotter',
      'svg_schematic_fallback',
      'none',
    ],
    defaultRendererType: 'physics_vector_simulator',
    prerequisiteTrackId: 'phys_curriculum_track',
    knowledgeProviders: ['curriculum_engine', 'local_ai', 'wikipedia'],
    knownLimitations: [
      'Interactive simulations are implemented for 1D Newtonian dynamics and ideal harmonic pendulums; relativistic, quantum, or 3D multi-body gravitational simulations are not implemented.',
      'Assumes idealized frictionless conditions unless a friction coefficient is explicitly parameterized.',
    ],
  },

  // 4. Biology
  biology: {
    id: 'biology',
    displayName: 'Biology',
    supportedTopicFamilies: [
      'Cellular Processes',
      'Photosynthesis & Energetics',
      'Molecular Genetics (DNA/RNA)',
      'Mendelian Genetics (Punnett Squares)',
      'Physiology & Anatomy',
      'Ecology',
    ],
    schemaId: 'v1_biology_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Structures', 'Biological Processes', 'Causal Pathways', 'Scientific Terminology', 'Supported Diagrams'],
      coreSections: ['structure_overview', 'process_steps', 'causal_pathway', 'terminology_table', 'worked_overview', 'practice_questions'],
      pedagogicalModel: 'Biological pathway analysis and cellular structure-function relationships',
    },
    capabilities: {
      hasSpecializedEngine: false,
      specializedEngineId: 'none',
      hasCalculationEngine: false,
      hasInteractiveSimulation: false,
      hasAlgorithmTracer: false,
      hasFactualRetrieval: true,
      hasLocalAiFallback: true,
      capabilityLevel: 'partial_with_limitations',
    },
    supportedRendererTypes: ['model3d_viewer', 'svg_schematic_fallback', 'none'],
    defaultRendererType: 'svg_schematic_fallback',
    knowledgeProviders: ['wikipedia', 'local_ai'],
    knownLimitations: [
      'No specialized dynamic biological simulation engine; biological workflows rely on structured process diagrams, terminology tables, and verified encyclopedic knowledge.',
      '3D spatial viewer is currently limited to supported cardiovascular/anatomical organ models.',
    ],
  },

  // 5. Chemistry
  chemistry: {
    id: 'chemistry',
    displayName: 'Chemistry',
    supportedTopicFamilies: [
      'Chemical Bonding (Ionic, Covalent, Polar)',
      'Periodic Trends & Electronegativity',
      'Ideal Gas Laws (PV = nRT)',
      'Chemical Equations & Stoichiometry',
      'Atomic Structure & Valence Electrons',
    ],
    schemaId: 'v1_chemistry_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Concepts', 'Chemical Equations', 'Reaction Conditions', 'Physical Units', 'Molecular Representations where Supported'],
      coreSections: ['concept_overview', 'chemical_reaction', 'reaction_conditions', 'unit_stoichiometry', 'worked_example', 'practice_questions'],
      pedagogicalModel: 'Stoichiometric balance and valence electron bond interaction models',
    },
    capabilities: {
      hasSpecializedEngine: false,
      specializedEngineId: 'none',
      hasCalculationEngine: true,
      hasInteractiveSimulation: false,
      hasAlgorithmTracer: false,
      hasFactualRetrieval: true,
      hasLocalAiFallback: true,
      capabilityLevel: 'partial_with_limitations',
    },
    supportedRendererTypes: ['svg_schematic_fallback', 'none'],
    defaultRendererType: 'svg_schematic_fallback',
    knowledgeProviders: ['curriculum_engine', 'wikipedia', 'local_ai'],
    knownLimitations: [
      'Does not feature a 3D ball-and-stick molecular geometry renderer or quantum orbital simulator.',
      'Chemical bonding is represented through structured conceptual schematics; thermodynamic and gas calculations (PV=nRT) are handled by symbolic calculation.',
    ],
  },

  // 6. General Knowledge
  general_knowledge: {
    id: 'general_knowledge',
    displayName: 'General Knowledge',
    supportedTopicFamilies: [
      'Historical Figures & Pioneers',
      'Computing Milestones',
      'Scientific Discoveries',
      'Organizations & Entities',
      'Curriculum Concepts',
    ],
    schemaId: 'v1_general_knowledge_learning_schema',
    schemaVersion: 1,
    learningStrategy: {
      focusAreas: ['Context', 'Key Facts', 'Historical Timelines', 'Explanations', 'Relevant Citations', 'Uncertainty'],
      coreSections: ['biographical_context', 'key_milestones', 'historical_significance', 'verified_citations', 'uncertainty_notes'],
      pedagogicalModel: 'Evidence-grounded factual retrieval with transparent primary source attribution',
    },
    capabilities: {
      hasSpecializedEngine: false,
      specializedEngineId: 'knowledge',
      hasCalculationEngine: false,
      hasInteractiveSimulation: false,
      hasAlgorithmTracer: false,
      hasFactualRetrieval: true,
      hasLocalAiFallback: true,
      capabilityLevel: 'verified_and_tested',
    },
    supportedRendererTypes: ['svg_schematic_fallback', 'none'],
    defaultRendererType: 'svg_schematic_fallback',
    knowledgeProviders: ['wikipedia', 'local_ai'],
    knownLimitations: [
      'Factual information is bounded to Wikipedia REST retrieval and local AI synthesis with clear source attribution.',
      'No numerical calculations or physics simulations are generated for biographical or historical entities.',
    ],
  },
};

/**
 * Service to query, extend, and validate subjects in VisiOS.
 */
export class SubjectRegistry {
  private static registry: Record<string, SubjectDefinition> = { ...INITIAL_SUBJECT_REGISTRY };

  public static getAllSubjects(): SubjectDefinition[] {
    return Object.values(this.registry);
  }

  public static getSubject(id: string): SubjectDefinition | null {
    if (!id) return null;
    return this.registry[id.toLowerCase()] || null;
  }

  public static registerSubject(definition: SubjectDefinition): void {
    if (!definition || !definition.id) {
      throw new Error('SubjectDefinition requires a valid id');
    }
    this.registry[definition.id.toLowerCase()] = definition;
  }

  public static resetRegistry(): void {
    this.registry = { ...INITIAL_SUBJECT_REGISTRY };
  }

  /**
   * Resolves a registered subject definition based on a TopicDomain.
   * Maps 'history' to 'general_knowledge', and unrecognized domains to 'general_knowledge'.
   */
  public static resolveSubjectForDomain(domain: TopicDomain): SubjectDefinition {
    switch (domain) {
      case 'computer_science':
        return this.registry.computer_science;
      case 'mathematics':
        return this.registry.mathematics;
      case 'physics':
        return this.registry.physics;
      case 'biology':
        return this.registry.biology;
      case 'chemistry':
        return this.registry.chemistry;
      case 'history':
      case 'general_knowledge':
      default:
        return this.registry.general_knowledge;
    }
  }

  /**
   * Resolves a subject definition by analyzing a topic query string.
   */
  public static resolveSubjectForTopic(topicQuery: string): SubjectDefinition {
    const clean = (topicQuery || '').toLowerCase().trim();

    if (
      clean.includes('binary search') ||
      clean.includes('data structure') ||
      clean.includes('linked list') ||
      clean.includes('stack') ||
      clean.includes('queue') ||
      clean.includes('tree') ||
      clean.includes('quicksort') ||
      clean.includes('mergesort')
    ) {
      return this.registry.computer_science;
    }

    if (
      clean.includes('quadratic') ||
      clean.includes('binomial') ||
      clean.includes('pythagor') ||
      clean.includes('sin(') ||
      clean.includes('calculus') ||
      clean.includes('derivative') ||
      clean.includes('integral')
    ) {
      return this.registry.mathematics;
    }

    if (
      clean.includes('newton') ||
      clean.includes('f = ma') ||
      clean.includes('f=ma') ||
      clean.includes('pendulum') ||
      clean.includes('kinematic') ||
      clean.includes('density') ||
      clean.includes('velocity')
    ) {
      return this.registry.physics;
    }

    if (
      clean.includes('photosynthesis') ||
      clean.includes('dna') ||
      clean.includes('rna') ||
      clean.includes('punnett') ||
      clean.includes('mitochondria') ||
      clean.includes('chlorophyll')
    ) {
      return this.registry.biology;
    }

    if (
      clean.includes('chemical bond') ||
      clean.includes('bonding') ||
      clean.includes('covalent') ||
      clean.includes('ionic bond') ||
      clean.includes('periodic table') ||
      clean.includes('pv = nrt') ||
      clean.includes('stoichiometry')
    ) {
      return this.registry.chemistry;
    }

    return this.registry.general_knowledge;
  }

  /**
   * Validates whether a renderer type is explicitly supported by a subject.
   */
  public static isRendererSupported(subjectId: string, rendererType: string): boolean {
    const subject = this.getSubject(subjectId);
    if (!subject) return false;
    return subject.supportedRendererTypes.includes(rendererType as CanonicalRendererType);
  }

  /**
   * Returns list of supported renderers for a subject.
   */
  public static getSupportedRenderers(subjectId: string): CanonicalRendererType[] {
    const subject = this.getSubject(subjectId);
    return subject ? [...subject.supportedRendererTypes] : ['svg_schematic_fallback', 'none'];
  }
}

