/**
 * VisiOS — Visualization Renderer Registry
 * Maps supported visualization types and canonical aliases to real educational renderers.
 * Rejects unsupported placeholder types and provides domain-aware recommendations.
 */

import { RendererType, TopicDomain } from './types';

export type CanonicalRendererType =
  | 'algorithm_array_tracer'
  | 'formula_geometric_dissection'
  | 'physics_vector_simulator'
  | 'function_coordinate_plotter'
  | 'geometric_triangle_construction'
  | 'pendulum_simulation'
  | 'model3d_viewer'
  | 'svg_schematic_fallback'
  | 'none';

export interface RendererDescriptor {
  id: CanonicalRendererType;
  aliases: string[];
  name: string;
  description: string;
  supportedDomains: TopicDomain[];
  isInteractive: boolean;
  requiredParameters: string[];
}

export const REGISTERED_RENDERERS: Record<CanonicalRendererType, RendererDescriptor> = {
  algorithm_array_tracer: {
    id: 'algorithm_array_tracer',
    aliases: ['algorithm_trace', 'array_tracer', 'array_search', 'binary_search_visualizer', 'data_structure_visualizer'],
    name: 'Algorithm Array & Pointer Trace',
    description: 'Step-by-step memory and pointer visualization for arrays and search algorithms (e.g. Binary Search).',
    supportedDomains: ['computer_science'],
    isInteractive: true,
    requiredParameters: [],
  },
  formula_geometric_dissection: {
    id: 'formula_geometric_dissection',
    aliases: ['algebraic_dissection', 'geometric_dissection', 'square_sum_proof', 'square_diff_proof'],
    name: 'Geometric Area Dissection',
    description: 'Visual proof and area decomposition for algebraic identities like (a-b)² and (a+b)²',
    supportedDomains: ['mathematics'],
    isInteractive: true,
    requiredParameters: ['a', 'b'],
  },
  physics_vector_simulator: {
    id: 'physics_vector_simulator',
    aliases: ['vector_simulator', 'f_ma_cart', 'dynamic_vector_block'],
    name: 'Newtonian Force & Vector Simulator',
    description: 'Dynamic cart motion depicting applied force F, inertial mass m, and acceleration vector a (F = ma).',
    supportedDomains: ['physics'],
    isInteractive: true,
    requiredParameters: ['F', 'm'],
  },
  function_coordinate_plotter: {
    id: 'function_coordinate_plotter',
    aliases: ['graph', 'coordinate_plotter', 'function_plotter', 'sine_wave_plotter', 'wave_plotter'],
    name: 'Cartesian Coordinate & Wave Plotter',
    description: 'Continuous 2D curve plotting with instantaneous tangent slopes and probe controls.',
    supportedDomains: ['mathematics', 'physics'],
    isInteractive: true,
    requiredParameters: ['x'],
  },
  geometric_triangle_construction: {
    id: 'geometric_triangle_construction',
    aliases: ['pythagorean_triangle', 'triangle_construction', 'right_triangle'],
    name: 'Euclidean Triangle Construction',
    description: 'Interactive right-angled triangle with square tiling visually demonstrating a² + b² = c².',
    supportedDomains: ['mathematics', 'geometry' as any],
    isInteractive: true,
    requiredParameters: ['a', 'b'],
  },
  pendulum_simulation: {
    id: 'pendulum_simulation',
    aliases: ['simulation', 'harmonic_pendulum', 'pendulum', 'physics_simulation'],
    name: 'Harmonic Pendulum Simulation',
    description: 'Physical pendulum oscillator modeling period T = 2π√(L/g) and kinetic/potential energy exchange.',
    supportedDomains: ['physics'],
    isInteractive: true,
    requiredParameters: ['L', 'g', 'theta'],
  },
  model3d_viewer: {
    id: 'model3d_viewer',
    aliases: ['3d', 'three_js_model', 'heart_3d', 'spatial_model'],
    name: '3D Spatial / Anatomy Model Viewer',
    description: 'Interactive WebGL/Three.js 3D spatial viewer with orbit controls and zoom.',
    supportedDomains: ['biology', 'physics', 'other'],
    isInteractive: true,
    requiredParameters: [],
  },
  svg_schematic_fallback: {
    id: 'svg_schematic_fallback',
    aliases: ['diagram', 'schematic', 'concept_diagram', 'conceptual_schematic'],
    name: 'Conceptual Schematic Diagram',
    description: 'Structured SVG schematic highlighting variable relationships, operational boundaries, and causal links.',
    supportedDomains: ['computer_science', 'mathematics', 'physics', 'chemistry', 'biology', 'history', 'general_knowledge', 'other'],
    isInteractive: false,
    requiredParameters: [],
  },
  none: {
    id: 'none',
    aliases: ['pure_explanation', 'text_only', 'no_visualization', 'explanation_only'],
    name: 'Pure Conceptual Explanation',
    description: 'Clear, text-first educational layout without artificial or placeholder simulations.',
    supportedDomains: ['computer_science', 'mathematics', 'physics', 'chemistry', 'biology', 'history', 'general_knowledge', 'other'],
    isInteractive: false,
    requiredParameters: [],
  },
};

export class VisualizationRegistry {
  private static readonly ALIAS_MAP: Map<string, CanonicalRendererType> = new Map();

  static {
    if (!this.ALIAS_MAP) {
      (this as any).ALIAS_MAP = new Map();
    }
    // Populate alias map
    for (const [canonicalId, descriptor] of Object.entries(REGISTERED_RENDERERS)) {
      const canonical = canonicalId as CanonicalRendererType;
      this.ALIAS_MAP.set(canonical.toLowerCase(), canonical);
      for (const alias of descriptor.aliases) {
        this.ALIAS_MAP.set(alias.toLowerCase(), canonical);
      }
    }
  }

  /**
   * Resolves any renderer string (including aliases like 'algorithm_trace', 'simulation', '3d', 'graph')
   * to its canonical registered type. If completely unknown, falls back safely to 'svg_schematic_fallback'.
   */
  public static resolveRendererType(type: string | undefined | null): CanonicalRendererType {
    if (!type || typeof type !== 'string') {
      return 'svg_schematic_fallback';
    }
    const normalized = type.trim().toLowerCase();
    const resolved = this.ALIAS_MAP.get(normalized);
    return resolved ?? 'svg_schematic_fallback';
  }

  /**
   * Checks whether the given renderer string corresponds to a real, implemented renderer.
   */
  public static isSupportedRenderer(type: string | undefined | null): boolean {
    if (!type || typeof type !== 'string') return false;
    const normalized = type.trim().toLowerCase();
    return this.ALIAS_MAP.has(normalized);
  }

  /**
   * Retrieves the full descriptor for a renderer type or alias.
   */
  public static getDescriptor(type: string | undefined | null): RendererDescriptor | undefined {
    const canonical = this.resolveRendererType(type);
    return REGISTERED_RENDERERS[canonical];
  }

  /**
   * Returns all canonical renderer descriptors.
   */
  public static listAll(): RendererDescriptor[] {
    return Object.values(REGISTERED_RENDERERS);
  }

  /**
   * Validates whether a renderer is semantically compatible with a topic domain.
   * Prevents assigning geometric area proofs to computer science topics or array tracers to physics.
   */
  public static validateRendererForDomain(
    renderer: string,
    domain: TopicDomain
  ): { isCompatible: boolean; recommendedRenderer: CanonicalRendererType; reason?: string } {
    const canonical = this.resolveRendererType(renderer);

    // Rule 1: Computer Science cannot use Euclidean area dissections
    if (domain === 'computer_science') {
      if (canonical === 'formula_geometric_dissection') {
        return {
          isCompatible: false,
          recommendedRenderer: 'algorithm_array_tracer',
          reason: 'Computer Science topics require algorithmic memory/pointer tracers, not Euclidean geometric dissections.',
        };
      }
      if (canonical === 'physics_vector_simulator' || canonical === 'pendulum_simulation') {
        return {
          isCompatible: false,
          recommendedRenderer: 'algorithm_array_tracer',
          reason: 'Computer Science topics require algorithmic or schematic models, not Newtonian physics simulators.',
        };
      }
    }

    // Rule 2: History and factual entities should use factual/none/schematic
    if (domain === 'history' || domain === 'general_knowledge') {
      if (
        canonical === 'formula_geometric_dissection' ||
        canonical === 'physics_vector_simulator' ||
        canonical === 'pendulum_simulation'
      ) {
        return {
          isCompatible: false,
          recommendedRenderer: 'none',
          reason: 'Factual encyclopedia entities must not use artificial physics or geometric simulations.',
        };
      }
    }

    return {
      isCompatible: true,
      recommendedRenderer: canonical,
    };
  }
}

