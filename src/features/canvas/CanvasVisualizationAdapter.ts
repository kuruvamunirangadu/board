/**
 * VisiOS — Canvas Visualization Adapter
 * Phase 1: Unified Architecture & Integration
 * Translates unified LearningResponse and VisualizationPlans into validated,
 * non-overlapping tldraw whiteboard shapes (learning cards, interactive geometry,
 * dynamic simulations, 3D models, and knowledge graphs).
 * Enforces runtime schema validation and provides graceful fallback to avoid blank panels.
 */

import { Editor, createShapeId, TLShape, TLShapeId } from 'tldraw';
import { LearningResponse } from '@/features/learning/UnifiedLearningContracts';
import {
  CanvasStampingEngine,
  StampingOptions,
  StampingPositionResult,
} from './CanvasStampingEngine';
import { TopicVisualizationRegistry } from '@/features/learning/TopicVisualizationRegistry';
import { toRichText } from '@/lib/tldraw-utils';

export type SupportedCanvasShapeType =
  | 'learning-card'
  | 'geometry'
  | 'simulation'
  | 'model3d'
  | 'topic-graph';

export interface CanvasShapePayload {
  id: TLShapeId;
  type: SupportedCanvasShapeType;
  x: number;
  y: number;
  props: Record<string, any>;
}

export interface StampingResult {
  success: boolean;
  shapesCreated: TLShape[];
  shapeIds: TLShapeId[];
  fallbackApplied: boolean;
  error?: string;
}

export class CanvasVisualizationAdapter {
  public static readonly DEFAULT_CARD_WIDTH = 420;
  public static readonly DEFAULT_CARD_HEIGHT = 440;
  public static readonly DEFAULT_VISUAL_WIDTH = 520;
  public static readonly DEFAULT_VISUAL_HEIGHT = 560;

  /**
   * Translates a LearningResponse into an ordered array of validated shape payloads,
   * without creating them on canvas yet. Useful for headless testing and dry runs.
   */
  public static createShapePayloads(
    response: LearningResponse,
    positions?: StampingPositionResult[]
  ): { payloads: CanvasShapePayload[]; fallbackApplied: boolean } {
    let fallbackApplied = false;
    const payloads: CanvasShapePayload[] = [];

    // Fallback coordinates if no positions provided
    const defaultPositions: StampingPositionResult[] = [
      { x: 100, y: 100, w: this.DEFAULT_CARD_WIDTH, h: this.DEFAULT_CARD_HEIGHT },
      { x: 560, y: 100, w: this.DEFAULT_CARD_WIDTH, h: this.DEFAULT_CARD_HEIGHT },
      { x: 1020, y: 100, w: this.DEFAULT_VISUAL_WIDTH, h: this.DEFAULT_VISUAL_HEIGHT },
    ];
    const coords = positions || defaultPositions;

    // CARD 1: Topic Overview & Motivation (learning-card)
    const card1Props = this.sanitizeLearningCardProps({
      w: coords[0]?.w || this.DEFAULT_CARD_WIDTH,
      h: coords[0]?.h || this.DEFAULT_CARD_HEIGHT,
      title: response.topic.title,
      category: response.topic.domain,
      badge: `${response.topic.subject} • Overview`,
      formula: (response.results?.outputFormulas && Object.values(response.results.outputFormulas)[0]) || '',
      content: response.content.overview || 'Fundamental principles and domain mathematical structure.',
      steps: (response.content.applications || []).slice(0, 3),
      takeaway: response.content.motivation || 'Foundational conceptual milestone.',
      accentColor: this.resolveDomainAccent(response.topic.domain),
    });

    payloads.push({
      id: createShapeId(),
      type: 'learning-card',
      x: coords[0]?.x || 100,
      y: coords[0]?.y || 100,
      props: card1Props,
    });

    // CARD 2: Derivation Steps or Worked Example (learning-card)
    const derivationStepsText = (response.content.derivationSteps || []).map(
      (s) => `${s.stepNumber}. ${s.expression}: ${s.explanation}`
    );
    const workedExample = response.content.workedExamples?.[0];
    const card2Content = workedExample
      ? `${workedExample.title}\n\n${workedExample.problemStatement}`
      : response.content.derivationSummary || 'Step-by-step verified derivation and operations.';

    const card2Props = this.sanitizeLearningCardProps({
      w: coords[1]?.w || this.DEFAULT_CARD_WIDTH,
      h: coords[1]?.h || this.DEFAULT_CARD_HEIGHT,
      title: `${response.topic.title} — Derivation`,
      category: response.topic.domain,
      badge: 'Step-by-Step Operations',
      formula: '',
      content: card2Content,
      steps: derivationStepsText.length > 0 ? derivationStepsText : (workedExample?.stepByStepSolution || []),
      takeaway: workedExample?.finalAnswer || 'Rigorous mathematical proof.',
      accentColor: 'indigo',
    });

    payloads.push({
      id: createShapeId(),
      type: 'learning-card',
      x: coords[1]?.x || 560,
      y: coords[1]?.y || 100,
      props: card2Props,
    });

    // CARD 3: Interactive Visual Model / Simulation / 3D / Graph
    const visualPos = coords[2] || defaultPositions[2];
    const visualPayload = this.resolveVisualShapePayload(response, visualPos);

    if (visualPayload.fallbackApplied) {
      fallbackApplied = true;
    }

    payloads.push(visualPayload.payload);

    return { payloads, fallbackApplied };
  }

  /**
   * Resolves the primary visual shape payload (3D, Simulation, Geometry, or Fallback Card).
   */
  private static resolveVisualShapePayload(
    response: LearningResponse,
    position: StampingPositionResult
  ): { payload: CanvasShapePayload; fallbackApplied: boolean } {
    const renderer = response.visualization?.rendererType || 'none';
    const query = (response.topic.normalizedQuery + ' ' + response.topic.title).toLowerCase();

    // 1. 3D Anatomical or Molecular Viewer
    const is3dCandidate =
      renderer === 'model3d_viewer' ||
      renderer === '3d' ||
      query.includes('brain') ||
      query.includes('nervous') ||
      query.includes('heart') ||
      query.includes('molecule') ||
      query.includes('polyhedra') ||
      query.includes('solids');

    if (is3dCandidate) {
      const resolved3d = TopicVisualizationRegistry.resolve(query);
      if (resolved3d) {
        let modelType = 'heart';
        if (resolved3d.id.includes('nervous') || resolved3d.id.includes('neuron')) {
          modelType = 'nervous_system';
        } else if (resolved3d.id.includes('molecule')) {
          modelType = 'molecule';
        } else if (resolved3d.id.includes('solid')) {
          modelType = 'solids';
        }

        const props = this.sanitizeModel3dProps({
          w: position.w || 460,
          h: position.h || 460,
          modelType,
          rotationX: 0.2,
          rotationY: -0.4,
          zoom: 1.0,
          isPulsing: true,
        });

        return {
          payload: {
            id: createShapeId(),
            type: 'model3d',
            x: position.x,
            y: position.y,
            props,
          },
          fallbackApplied: false,
        };
      }
    }

    // 2. Interactive Dynamic Physics Simulation
    const isSimulationCandidate =
      renderer === 'pendulum_simulation' ||
      renderer === 'physics_vector_simulator' ||
      renderer === 'simulation' ||
      query.includes('pendulum') ||
      query.includes('f = ma');

    if (isSimulationCandidate) {
      const simType = query.includes('pendulum') ? 'pendulum' : 'vector_force';
      const props = this.sanitizeSimulationProps({
        w: position.w || 440,
        h: position.h || 400,
        simulationType: simType,
        gravity: 9.81,
        length: 2.0,
        damping: 0.04,
        initialAngle: 45,
        speed: 1.0,
      });

      return {
        payload: {
          id: createShapeId(),
          type: 'simulation',
          x: position.x,
          y: position.y,
          props,
        },
        fallbackApplied: false,
      };
    }

    // 3. Coordinate Geometry, Triangle Construction or Code Tracing
    const isLinear =
      query.includes('y = mx + c') ||
      query.includes('linear function') ||
      query.includes('slope intercept');
    const isPythagoras =
      query.includes('pythagor') || query.includes('right triangle') || query.includes('a² + b² = c²');
    const isFraction = query.includes('fraction');
    const isAlgorithm =
      renderer === 'algorithm_array_tracer' ||
      renderer === 'algorithm_trace' ||
      query.includes('binary search');

    if (isLinear || isPythagoras || isFraction || isAlgorithm) {
      let geometryType: 'linear_plotter' | 'pythagorean_proof' | 'fraction_visualizer' | 'code_tracer' = 'linear_plotter';
      if (isPythagoras) geometryType = 'pythagorean_proof';
      else if (isFraction) geometryType = 'fraction_visualizer';
      else if (isAlgorithm) geometryType = 'code_tracer';

      const props = this.sanitizeGeometryProps({
        w: position.w || this.DEFAULT_VISUAL_WIDTH,
        h: position.h || this.DEFAULT_VISUAL_HEIGHT,
        geometryType,
        title: `${response.topic.title} Interactive Drawing`,
        slope: 2,
        intercept: 1,
        a: 3,
        b: 4,
        numerator: 3,
        denominator: 4,
        algorithmId: isAlgorithm ? 'binary_search' : undefined,
      });

      return {
        payload: {
          id: createShapeId(),
          type: 'geometry',
          x: position.x,
          y: position.y,
          props,
        },
        fallbackApplied: false,
      };
    }

    // 4. Topic Knowledge Graph shape if concept is mapped
    if (response.topic.conceptId) {
      return {
        payload: {
          id: createShapeId(),
          type: 'topic-graph',
          x: position.x,
          y: position.y,
          props: {
            w: position.w || 540,
            h: position.h || 460,
            topicQuery: response.topic.normalizedQuery,
            conceptId: response.topic.conceptId,
            title: `${response.topic.title} Concept Graph`,
          },
        },
        fallbackApplied: false,
      };
    }

    // 5. Safe Fallback Learning Card (prevents blank/unrendered canvas shapes)
    const fallbackProps = this.sanitizeLearningCardProps({
      w: position.w || this.DEFAULT_CARD_WIDTH,
      h: position.h || this.DEFAULT_CARD_HEIGHT,
      title: `${response.topic.title} Visual Summary`,
      category: response.topic.domain,
      badge: 'Schematic Overview',
      formula: '',
      content: response.content.overview,
      steps: response.content.prerequisites.slice(0, 3),
      takeaway: 'Conceptual visual representation.',
      accentColor: 'slate',
    });

    return {
      payload: {
        id: createShapeId(),
        type: 'learning-card',
        x: position.x,
        y: position.y,
        props: fallbackProps,
      },
      fallbackApplied: true,
    };
  }

  /**
   * Stamps a complete verified response onto the tldraw whiteboard.
   */
  public static async stampResponseToCanvas(
    editor: Editor,
    response: LearningResponse,
    options?: StampingOptions
  ): Promise<StampingResult> {
    try {
      const dimensions = [
        { w: this.DEFAULT_CARD_WIDTH, h: this.DEFAULT_CARD_HEIGHT },
        { w: this.DEFAULT_CARD_WIDTH, h: this.DEFAULT_CARD_HEIGHT },
        { w: this.DEFAULT_VISUAL_WIDTH, h: this.DEFAULT_VISUAL_HEIGHT },
      ];

      // Clean removal of previous system suite shapes if requested
      if (options?.replacePrevious && options.previousShapeIds && options.previousShapeIds.length > 0) {
        const idsToDelete = options.previousShapeIds
          .map((id) => id as TLShapeId)
          .filter((id) => editor.getShape(id) !== undefined);

        if (idsToDelete.length > 0) {
          editor.deleteShapes(idsToDelete);
        }
      }

      // Calculate collision-free, non-overlapping coordinates
      const positions = CanvasStampingEngine.calculateStampingPositions(
        editor,
        dimensions,
        options?.gap || CanvasStampingEngine.DEFAULT_GAP
      );

      // Create validated payloads
      const { payloads, fallbackApplied } = this.createShapePayloads(response, positions);

      // Execute atomic creation in editor
      const shapesCreated: TLShape[] = [];
      const shapeIds: TLShapeId[] = [];

      editor.run(() => {
        for (const item of payloads) {
          editor.createShape({
            id: item.id,
            type: item.type,
            x: item.x,
            y: item.y,
            props: item.props,
          });
          const created = editor.getShape(item.id);
          if (created) {
            shapesCreated.push(created);
            shapeIds.push(item.id);
          }
        }

        if (options?.highlightSelection && shapeIds.length > 0) {
          editor.setSelectedShapes(shapeIds);
        }
      });

      return {
        success: true,
        shapesCreated,
        shapeIds,
        fallbackApplied,
      };
    } catch (err: any) {
      return {
        success: false,
        shapesCreated: [],
        shapeIds: [],
        fallbackApplied: false,
        error: err?.message || 'Failed to stamp visual response onto canvas.',
      };
    }
  }

  // ==========================================================================
  // Shape Property Sanitizers & Runtime Type Guards
  // ==========================================================================

  public static sanitizeLearningCardProps(props: Record<string, any>): Record<string, any> {
    return {
      w: typeof props.w === 'number' && Number.isFinite(props.w) ? props.w : this.DEFAULT_CARD_WIDTH,
      h: typeof props.h === 'number' && Number.isFinite(props.h) ? props.h : this.DEFAULT_CARD_HEIGHT,
      title: String(props.title || 'Learning Card'),
      category: String(props.category || 'general'),
      badge: String(props.badge || 'Concept'),
      formula: String(props.formula || ''),
      content: String(props.content || ''),
      steps: Array.isArray(props.steps) ? props.steps.map(String) : [],
      takeaway: String(props.takeaway || ''),
      accentColor: ['indigo', 'cyan', 'emerald', 'amber', 'violet', 'blue', 'rose', 'sky', 'slate'].includes(
        props.accentColor
      )
        ? props.accentColor
        : 'indigo',
    };
  }

  public static sanitizeGeometryProps(props: Record<string, any>): Record<string, any> {
    const validGeometryTypes = [
      'linear_plotter',
      'pythagorean_proof',
      'fraction_visualizer',
      'code_tracer',
      'what_if',
    ];
    return {
      w: typeof props.w === 'number' && Number.isFinite(props.w) ? props.w : this.DEFAULT_VISUAL_WIDTH,
      h: typeof props.h === 'number' && Number.isFinite(props.h) ? props.h : this.DEFAULT_VISUAL_HEIGHT,
      geometryType: validGeometryTypes.includes(props.geometryType) ? props.geometryType : 'linear_plotter',
      title: String(props.title || 'Geometric Drawing'),
      slope: typeof props.slope === 'number' && Number.isFinite(props.slope) ? props.slope : 2,
      intercept: typeof props.intercept === 'number' && Number.isFinite(props.intercept) ? props.intercept : 1,
      a: typeof props.a === 'number' && Number.isFinite(props.a) ? props.a : 3,
      b: typeof props.b === 'number' && Number.isFinite(props.b) ? props.b : 4,
      numerator: typeof props.numerator === 'number' && Number.isFinite(props.numerator) ? props.numerator : 3,
      denominator: typeof props.denominator === 'number' && Number.isFinite(props.denominator) ? props.denominator : 4,
      functionExpression: props.functionExpression ? String(props.functionExpression) : undefined,
      algorithmId: props.algorithmId ? String(props.algorithmId) : undefined,
      experimentId: props.experimentId ? String(props.experimentId) : undefined,
    };
  }

  public static sanitizeSimulationProps(props: Record<string, any>): Record<string, any> {
    return {
      w: typeof props.w === 'number' && Number.isFinite(props.w) ? props.w : 440,
      h: typeof props.h === 'number' && Number.isFinite(props.h) ? props.h : 400,
      simulationType: String(props.simulationType || 'pendulum'),
      gravity: typeof props.gravity === 'number' && Number.isFinite(props.gravity) ? props.gravity : 9.81,
      length: typeof props.length === 'number' && Number.isFinite(props.length) ? props.length : 2.0,
      damping: typeof props.damping === 'number' && Number.isFinite(props.damping) ? props.damping : 0.04,
      initialAngle: typeof props.initialAngle === 'number' && Number.isFinite(props.initialAngle) ? props.initialAngle : 45,
      speed: typeof props.speed === 'number' && Number.isFinite(props.speed) ? props.speed : 1.0,
    };
  }

  public static sanitizeModel3dProps(props: Record<string, any>): Record<string, any> {
    return {
      w: typeof props.w === 'number' && Number.isFinite(props.w) ? props.w : 460,
      h: typeof props.h === 'number' && Number.isFinite(props.h) ? props.h : 460,
      modelType: String(props.modelType || 'heart'),
      rotationX: typeof props.rotationX === 'number' && Number.isFinite(props.rotationX) ? props.rotationX : 0.2,
      rotationY: typeof props.rotationY === 'number' && Number.isFinite(props.rotationY) ? props.rotationY : -0.4,
      zoom: typeof props.zoom === 'number' && Number.isFinite(props.zoom) ? props.zoom : 1.0,
      isPulsing: Boolean(props.isPulsing ?? true),
    };
  }

  private static resolveDomainAccent(
    domain: string
  ): 'indigo' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'blue' | 'rose' | 'sky' | 'slate' {
    switch (domain) {
      case 'mathematics':
        return 'indigo';
      case 'physics':
        return 'cyan';
      case 'computer_science':
        return 'emerald';
      case 'chemistry':
        return 'amber';
      case 'biology':
        return 'rose';
      default:
        return 'sky';
    }
  }
}
