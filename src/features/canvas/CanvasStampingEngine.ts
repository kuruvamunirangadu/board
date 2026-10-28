/**
 * VisiOS — Enhanced Canvas Stamping Engine
 * Milestone 4: Enhanced Canvas Stamping
 * Stamping readable, well-spaced learning cards and live geometric drawings
 * onto the whiteboard without breaking existing canvas behavior or overlapping shapes.
 */

import { Editor, createShapeId, TLShape, TLShapeId } from 'tldraw';
import { LearningPlan } from '@/features/learning/types';
import { toRichText } from '@/lib/tldraw-utils';
import { ILearningCardShape } from '@/components/canvas/LearningCardShapeUtil';
import { IGeometryShape } from '@/components/canvas/GeometryShapeUtil';
import { ISimulationShape } from '@/components/canvas/SimulationShapeUtil';
import { IModel3dShape } from '@/components/canvas/Model3dShapeUtil';
import { ITopicGraphShape } from '@/components/canvas/TopicGraphShapeUtil';

export interface StampingOptions {
  replacePrevious?: boolean;
  previousShapeIds?: string[];
  gap?: number;
  customGap?: number;
  highlightSelection?: boolean;
}

export interface StampingPositionResult {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface GeometryStampConfig {
  geometryType: 'linear_plotter' | 'pythagorean_proof' | 'fraction_visualizer' | 'code_tracer' | 'what_if';
  title?: string;
  slope?: number;
  intercept?: number;
  a?: number;
  b?: number;
  numerator?: number;
  denominator?: number;
  functionExpression?: string;
  algorithmId?: string;
  experimentId?: string;
}

export class CanvasStampingEngine {
  public static readonly DEFAULT_GAP = 36;
  public static readonly CARD_WIDTH = 420;
  public static readonly CARD_HEIGHT = 460;
  public static readonly VISUAL_WIDTH = 520;
  public static readonly VISUAL_HEIGHT = 560;

  /**
   * Deterministically calculates non-overlapping layout positions for a sequence of cards.
   * Takes into account active selection bounds, viewport boundaries, and existing shapes on canvas.
   */
  public static calculateStampingPositions(
    editor: Editor,
    cardDimensions: Array<{ w: number; h: number }>,
    gap: number = CanvasStampingEngine.DEFAULT_GAP
  ): StampingPositionResult[] {
    const totalWidth = cardDimensions.reduce((acc, c) => acc + c.w, 0) + (cardDimensions.length - 1) * gap;
    const maxHeight = Math.max(...cardDimensions.map((c) => c.h));

    let startX = 200;
    let startY = 200;

    // 1. If shapes are selected, place right beside them
    const selected = editor.getSelectedShapes();
    if (selected.length > 0) {
      const selBounds = editor.getSelectionPageBounds();
      if (selBounds) {
        startX = selBounds.maxX + gap;
        startY = selBounds.minY;
      }
    } else {
      // 2. Otherwise center horizontally in the current viewport
      const viewport = editor.getViewportPageBounds();
      if (viewport) {
        startX = Math.max(80, viewport.center.x - totalWidth / 2);
        startY = Math.max(80, viewport.center.y - maxHeight / 2);
      }
    }

    // 3. Collision Detection with existing canvas shapes
    const existingShapes = editor.getCurrentPageShapes();
    if (existingShapes.length > 0) {
      let candidateBox = {
        minX: startX,
        minY: startY,
        maxX: startX + totalWidth,
        maxY: startY + maxHeight,
      };

      // Check collision with each existing shape
      let hasCollision = false;
      let maxCollisionY = startY;

      for (const shape of existingShapes) {
        // Skip shapes currently selected as user intended to place next to them
        if (selected.some((s) => s.id === shape.id)) continue;

        const shapeBounds = editor.getShapePageBounds(shape.id) || {
          minX: shape.x,
          minY: shape.y,
          maxX: shape.x + ((shape.props as any)?.w || 200),
          maxY: shape.y + ((shape.props as any)?.h || 200),
        };

        const overlaps = !(
          candidateBox.maxX < shapeBounds.minX ||
          candidateBox.minX > shapeBounds.maxX ||
          candidateBox.maxY < shapeBounds.minY ||
          candidateBox.minY > shapeBounds.maxY
        );

        if (overlaps) {
          hasCollision = true;
          maxCollisionY = Math.max(maxCollisionY, shapeBounds.maxY);
        }
      }

      // If collision detected and no active selection offset, cascade below colliding shapes
      if (hasCollision && selected.length === 0) {
        startY = maxCollisionY + gap;
      }
    }

    // Generate individual position coordinates
    let currentX = startX;
    return cardDimensions.map((dim) => {
      const pos: StampingPositionResult = {
        x: Math.round(currentX),
        y: Math.round(startY),
        w: dim.w,
        h: dim.h,
      };
      currentX += dim.w + gap;
      return pos;
    });
  }

  /**
   * Evaluates the educational intent of a LearningPlan and chooses the most appropriate
   * interactive canvas visual shape (geometry, simulation, 3d model, or knowledge graph).
   */
  public static determineVisualShapeType(plan: LearningPlan): {
    kind: 'geometry' | 'simulation' | 'model3d' | 'topic-graph' | 'application-card';
    geometryConfig?: GeometryStampConfig;
    simulationType?: string;
    modelType?: string;
  } {
    const lowerTitle = (plan.title + ' ' + (plan.conceptId || '')).toLowerCase();
    const cleanTitle = plan.title.replace(/^[✨📐👁️🧪🧠\s]+/, '');
    const overview = plan.overview.toLowerCase();
    const formula = (plan.classification?.originalQuery || '').toLowerCase();

    // 1. Dynamic What-If Scenario Engine
    const renderer = plan.visualizationPlan?.rendererType as string;
    if (renderer === 'what_if_scenario' || lowerTitle.includes('what-if') || lowerTitle.includes('what if')) {
      return {
        kind: 'geometry',
        geometryConfig: {
          geometryType: 'what_if',
          title: `${cleanTitle} — What-If Scenario Engine`,
          experimentId: 'exp_projectile_motion',
        },
      };
    }

    // 2. Interactive Dynamic Physics Simulation
    const isPendulumSim =
      renderer === 'pendulum_simulation' || lowerTitle.includes('pendulum');
    const isVectorSim =
      renderer === 'physics_vector_simulator' ||
      lowerTitle.includes('f = ma') ||
      lowerTitle.includes('force');
    const isProjectileSim =
      lowerTitle.includes('projectile') || lowerTitle.includes('kinematic');

    if (isPendulumSim || isVectorSim || isProjectileSim) {
      return {
        kind: 'simulation',
        simulationType: isProjectileSim
          ? 'projectile'
          : isVectorSim
          ? 'vector_force'
          : 'pendulum',
      };
    }

    // 2. 3D Model Shape (Three.js WebGL Interactive Spatial Viewer)
    const isNervousSystem =
      lowerTitle.includes('nervous') ||
      lowerTitle.includes('brain') ||
      lowerTitle.includes('neuron') ||
      lowerTitle.includes('synapse') ||
      lowerTitle.includes('spine') ||
      lowerTitle.includes('neuro') ||
      lowerTitle.includes('cns') ||
      lowerTitle.includes('axon');

    const is3DModelTopic =
      renderer === 'model3d_viewer' ||
      isNervousSystem ||
      lowerTitle.includes('heart') ||
      lowerTitle.includes('anatomy') ||
      lowerTitle.includes('cardio') ||
      lowerTitle.includes('molecule') ||
      lowerTitle.includes('chemical structure') ||
      lowerTitle.includes('3d vector') ||
      lowerTitle.includes('spatial vector') ||
      lowerTitle.includes('vectors_3d');

    if (is3DModelTopic) {
      return {
        kind: 'model3d',
        modelType: isNervousSystem
          ? 'nervous_system'
          : lowerTitle.includes('vector')
          ? 'vectors_3d'
          : lowerTitle.includes('molecule') || plan.category === 'chemistry'
          ? 'molecule'
          : 'heart',
      };
    }

    // 3. School Geometry: Pythagorean Theorem & Right Triangles (a² + b² = c²)
    const isPythagoras =
      lowerTitle.includes('pythagor') ||
      lowerTitle.includes('hypotenuse') ||
      lowerTitle.includes('right triangle') ||
      formula.includes('a^2') ||
      formula.includes('a²');

    if (isPythagoras) {
      return {
        kind: 'geometry',
        geometryConfig: {
          geometryType: 'pythagorean_proof',
          title: 'Pythagorean Dissection Proof',
          a: 3,
          b: 4,
        },
      };
    }

    // 4. School Geometry & Arithmetic: Fractions & Rational Numbers
    const isFraction =
      lowerTitle.includes('fraction') ||
      lowerTitle.includes('rational') ||
      lowerTitle.includes('numerator') ||
      lowerTitle.includes('denominator') ||
      overview.includes('part-to-whole') ||
      formula.includes('/');

    if (isFraction) {
      return {
        kind: 'geometry',
        geometryConfig: {
          geometryType: 'fraction_visualizer',
          title: 'Fraction & Equivalence Visualizer',
          numerator: 3,
          denominator: 4,
        },
      };
    }

    // 5. School Geometry & Coordinate Curves: Function Plotting (y = e^(cos(x)), y = e^x, y = cos(x), y = sin(x), y = mx + c)
    const isCurve =
      lowerTitle.includes('e^(cos(x))') ||
      lowerTitle.includes('e^x') ||
      lowerTitle.includes('exponential') ||
      lowerTitle.includes('curve') ||
      lowerTitle.includes('cos') ||
      lowerTitle.includes('sin') ||
      lowerTitle.includes('tan') ||
      formula.includes('cos') ||
      formula.includes('sin') ||
      formula.includes('e^') ||
      formula.includes('e^x') ||
      plan.category === 'calculus';

    const isLinear =
      plan.category === 'algebra' ||
      plan.category === 'geometry' ||
      lowerTitle.includes('linear') ||
      lowerTitle.includes('slope') ||
      lowerTitle.includes('y =') ||
      lowerTitle.includes('y=') ||
      lowerTitle.includes('mx') ||
      formula.includes('mx');

    if ((isCurve || isLinear) && !lowerTitle.includes('triangle') && !lowerTitle.includes('pythagor') && !lowerTitle.includes('fraction')) {
      let functionExpression: string | undefined = undefined;
      if (lowerTitle.includes('e^(cos(x))') || formula.includes('e^(cos(x))') || formula.includes('e^cos(x)')) {
        functionExpression = 'e^(cos(x))';
      } else if (lowerTitle.includes('e^x') || formula.includes('e^x') || lowerTitle.includes('exponential') || formula.includes('exp(x)') || plan.conceptId === 'math_exponential_function') {
        functionExpression = 'e^x';
      } else if (
        lowerTitle.includes('cos') ||
        formula.includes('cos') ||
        lowerTitle.includes('cosine') ||
        formula.includes('cosine') ||
        plan.conceptId === 'math_cosine_function'
      ) {
        functionExpression = 'cos(x)';
      } else if (
        lowerTitle.includes('sin') ||
        formula.includes('sin') ||
        lowerTitle.includes('sine') ||
        formula.includes('sine') ||
        plan.conceptId === 'calculus_sin_x' ||
        plan.conceptId === 'math_sine_function'
      ) {
        functionExpression = 'sin(x)';
      } else if (lowerTitle.includes('tan') || formula.includes('tan')) {
        functionExpression = 'tan(x)';
      }

      let slope = 2;
      let intercept = 1;
      // Extract numeric slope/intercept if present in title/formula
      const fullEquation = `${plan.title} ${formula}`;
      const slopeMatch = fullEquation.match(/([+-]?\d*\.?\d*)\s*x/);
      if (slopeMatch && slopeMatch[1]) {
        if (slopeMatch[1] === '-' || slopeMatch[1] === '') {
          slope = slopeMatch[1] === '-' ? -1 : 1;
        } else {
          const val = parseFloat(slopeMatch[1]);
          if (!isNaN(val)) slope = val;
        }
      }
      const interceptMatch = fullEquation.match(/x\s*([+-]\s*\d+\.?\d*)/);
      if (interceptMatch && interceptMatch[1]) {
        const val = parseFloat(interceptMatch[1].replace(/\s+/g, ''));
        if (!isNaN(val)) intercept = val;
      }

      return {
        kind: 'geometry',
        geometryConfig: {
          geometryType: 'linear_plotter',
          title: plan.title,
          slope,
          intercept,
          functionExpression,
        },
      };
    }

    // 6. Computer Science: Algorithms & Dynamic Code Tracing
    if (
      plan.category === 'algorithm' ||
      plan.visualizationPlan?.rendererType === 'algorithm_array_tracer' ||
      lowerTitle.includes('binary search') ||
      lowerTitle.includes('bubble sort') ||
      lowerTitle.includes('sorting') ||
      lowerTitle.includes('recursion')
    ) {
      const algoId = lowerTitle.includes('linear')
        ? 'linear_search'
        : lowerTitle.includes('bubble')
        ? 'bubble_sort'
        : lowerTitle.includes('stack')
        ? 'stack_operations'
        : lowerTitle.includes('queue')
        ? 'queue_operations'
        : lowerTitle.includes('recursion') || lowerTitle.includes('factorial')
        ? 'recursion_factorial'
        : 'binary_search';

      return {
        kind: 'geometry',
        geometryConfig: {
          geometryType: 'code_tracer',
          title: `${cleanTitle} — Code Execution Tracer`,
          algorithmId: algoId,
        },
      };
    }

    // 7. Topic Knowledge Graph
    if (plan.conceptId && (plan.category === 'concept' || plan.prerequisites.length > 0)) {
      return {
        kind: 'topic-graph',
      };
    }

    // 9. General Application & Real-World Domain Card
    return {
      kind: 'application-card',
    };
  }

  /**
   * Stamps a complete, readable, and well-spaced 3-part learning suite onto the whiteboard:
   * 1. Concept Overview & Mathematical Definition Card
   * 2. Derivation Steps & Worked Examples Card
   * 3. Live Geometric Drawing or Interactive Simulation
   */
  public static stampLearningSuite(
    editor: Editor,
    plan: LearningPlan,
    options: StampingOptions = {}
  ): TLShapeId[] {
    const { replacePrevious = true, previousShapeIds = [], gap = CanvasStampingEngine.DEFAULT_GAP } = options;

    // 1. Clean up previously stamped suite cards if requested to avoid cluttered canvases
    if (replacePrevious && previousShapeIds.length > 0) {
      const currentShapes = editor.getCurrentPageShapes().map((s) => s.id);
      const toDelete = previousShapeIds.filter((id) => currentShapes.includes(id as any));
      if (toDelete.length > 0) {
        editor.deleteShapes(toDelete as any);
      }
    }

    const visualDecision = this.determineVisualShapeType(plan);

    // 2. Card Dimensions definition
    const card1Dim = { w: CanvasStampingEngine.CARD_WIDTH, h: CanvasStampingEngine.CARD_HEIGHT };
    const card2Dim = { w: CanvasStampingEngine.CARD_WIDTH, h: CanvasStampingEngine.CARD_HEIGHT };
    const card3Dim = {
      w:
        visualDecision.kind === 'geometry' ||
        visualDecision.kind === 'topic-graph' ||
        visualDecision.kind === 'model3d' ||
        visualDecision.kind === 'simulation'
          ? CanvasStampingEngine.VISUAL_WIDTH
          : CanvasStampingEngine.CARD_WIDTH,
      h:
        visualDecision.kind === 'geometry' ||
        visualDecision.kind === 'topic-graph' ||
        visualDecision.kind === 'model3d' ||
        visualDecision.kind === 'simulation'
          ? CanvasStampingEngine.VISUAL_HEIGHT
          : CanvasStampingEngine.CARD_HEIGHT,
    };

    const positions = this.calculateStampingPositions(editor, [card1Dim, card2Dim, card3Dim], gap);

    const cleanTitle = plan.title.replace(/^[✨📐👁️🧪🧠\s]+/, '');
    const lowerTitle = (plan.title || '').toLowerCase();
    const createdShapeIds: TLShapeId[] = [];

    // CARD 1: Intuition & Concept Definition
    const id1 = createShapeId();
    const primaryFormula =
      plan.derivationSteps.length > 0 ? plan.derivationSteps[0].expression : '';

    const card1Shape: Partial<ILearningCardShape> = {
      id: id1,
      type: 'learning-card',
      x: positions[0].x,
      y: positions[0].y,
      props: {
        w: positions[0].w,
        h: positions[0].h,
        title: cleanTitle,
        category: plan.category || 'mathematics',
        badge: 'Core Concept',
        formula: primaryFormula || undefined,
        content: plan.overview,
        steps: plan.prerequisites.map((p) => `Prerequisite: ${p}`),
        takeaway: plan.motivation || 'Understanding the underlying mathematical structure.',
        accentColor:
          (plan.category as string) === 'physics'
            ? 'cyan'
            : (plan.category as string) === 'algorithm'
            ? 'emerald'
            : (plan.category as string) === 'chemistry'
            ? 'amber'
            : (plan.category as string) === 'biology'
            ? 'emerald'
            : 'indigo',
      },
    };
    createdShapeIds.push(id1);

    // CARD 2: Derivation & Worked Method (or Biological Mechanism & Pathways)
    const id2 = createShapeId();
    const isBioOrAnatomy =
      (plan.category as string) === 'biology' ||
      plan.subject === 'biology' ||
      lowerTitle.includes('nervous') ||
      lowerTitle.includes('brain') ||
      lowerTitle.includes('neuron') ||
      lowerTitle.includes('heart') ||
      lowerTitle.includes('cell') ||
      lowerTitle.includes('synapse') ||
      lowerTitle.includes('spine');

    let card2Title = `${cleanTitle} — Derivation`;
    let card2Badge = 'Method & Derivation';
    let card2Content = 'Deductive mathematical progression from foundational axioms to final identity:';
    let derivationStepsList: string[];

    if (isBioOrAnatomy) {
      card2Title = `${cleanTitle} — Signal Pathways & Mechanism`;
      card2Badge = 'Biological Mechanism & Pathway';
      card2Content = 'Electrochemical signal transduction pathway across neural networks:';
      derivationStepsList = [
        '1. Sensory Reception — Peripheral afferent receptors detect environmental stimuli and generate graded potentials.',
        '2. Action Potential Initiation — Axon hillock summates signals; reaching -55 mV threshold triggers voltage-gated Na⁺ channels.',
        '3. Saltatory Conduction — Myelin sheaths insulate axon fibers, forcing rapid impulse hopping between Nodes of Ranvier.',
        '4. Synaptic Transmission — Terminal depolarization opens voltage-gated Ca²⁺ channels, stimulating neurotransmitter vesicle exocytosis.',
      ];
    } else if (plan.derivationSteps.length > 0) {
      derivationStepsList = plan.derivationSteps.slice(0, 4).map((s) => `${s.expression} — ${s.explanation}`);
    } else if (plan.workedExamples.length > 0) {
      card2Title = `${cleanTitle} — Analysis`;
      card2Badge = 'Method & Analysis';
      card2Content = 'Methodological breakdown and canonical computational rules:';
      derivationStepsList = plan.workedExamples[0].stepByStepSolution.slice(0, 4);
    } else {
      card2Title = `${cleanTitle} — Foundations`;
      card2Badge = 'Core Principles';
      card2Content = 'Foundational rules and structural organization:';
      derivationStepsList = plan.assumptions.slice(0, 4);
    }

    const card2Shape: Partial<ILearningCardShape> = {
      id: id2,
      type: 'learning-card',
      x: positions[1].x,
      y: positions[1].y,
      props: {
        w: positions[1].w,
        h: positions[1].h,
        title: card2Title,
        category: plan.category || 'mathematics',
        badge: card2Badge,
        formula: undefined,
        content: card2Content,
        steps: derivationStepsList,
        takeaway:
          plan.applications[0] ||
          'Verified domain methodology and accurate step-by-step reasoning.',
        accentColor: 'blue' as any,
      },
    };
    createdShapeIds.push(id2);

    // CARD 3 / VISUAL SHAPE: Live Geometric Drawing or Interactive Simulation
    const id3 = createShapeId();
    createdShapeIds.push(id3);

    if (visualDecision.kind === 'geometry' && visualDecision.geometryConfig) {
      const geoConfig = visualDecision.geometryConfig;
      const geoShape: Partial<IGeometryShape> = {
        id: id3,
        type: 'geometry',
        x: positions[2].x,
        y: positions[2].y,
        props: {
          w: positions[2].w,
          h: positions[2].h,
          geometryType: geoConfig.geometryType,
          title: geoConfig.title || cleanTitle,
          slope: geoConfig.slope ?? 2,
          intercept: geoConfig.intercept ?? 1,
          a: geoConfig.a ?? 3,
          b: geoConfig.b ?? 4,
          numerator: geoConfig.numerator ?? 3,
          denominator: geoConfig.denominator ?? 4,
          functionExpression: geoConfig.functionExpression,
          algorithmId: geoConfig.algorithmId,
          experimentId: geoConfig.experimentId,
        },
      };
      editor.createShapes([card1Shape as any, card2Shape as any, geoShape as any]);
    } else if (visualDecision.kind === 'simulation') {
      const simShape: Partial<ISimulationShape> = {
        id: id3,
        type: 'simulation',
        x: positions[2].x,
        y: positions[2].y,
        props: {
          w: positions[2].w,
          h: positions[2].h,
          simulationType: visualDecision.simulationType || 'pendulum',
          gravity: 9.81,
          length: 2.0,
          damping: 0.04,
          initialAngle: 45,
          speed: 1.0,
        },
      };
      editor.createShapes([card1Shape as any, card2Shape as any, simShape as any]);
    } else if (visualDecision.kind === 'model3d') {
      const modelShape: Partial<IModel3dShape> = {
        id: id3,
        type: 'model3d',
        x: positions[2].x,
        y: positions[2].y,
        props: {
          w: positions[2].w,
          h: positions[2].h,
          modelType: visualDecision.modelType || 'heart',
          rotationX: 0.2,
          rotationY: -0.4,
          zoom: 1,
          isPulsing: true,
        },
      };
      editor.createShapes([card1Shape as any, card2Shape as any, modelShape as any]);
    } else if (visualDecision.kind === 'topic-graph') {
      const graphShape: Partial<ITopicGraphShape> = {
        id: id3,
        type: 'topic-graph',
        x: positions[2].x,
        y: positions[2].y,
        props: {
          w: positions[2].w,
          h: positions[2].h,
          topicQuery: plan.title,
          conceptId: plan.conceptId || 'math_linear_functions',
          title: `${cleanTitle} — Prerequisites & Unlocks`,
        },
      };
      editor.createShapes([card1Shape as any, card2Shape as any, graphShape as any]);
    } else {
      // Application & Real-World Domain Context Card
      const card3Shape: Partial<ILearningCardShape> = {
        id: id3,
        type: 'learning-card',
        x: positions[2].x,
        y: positions[2].y,
        props: {
          w: positions[2].w,
          h: positions[2].h,
          title: `${cleanTitle} — Application`,
          category: plan.category || 'domain_knowledge',
          badge: 'Real-World Context',
          formula: undefined,
          content: plan.visualizationPlan.description,
          steps: plan.applications.map((app) => `Application: ${app}`),
          takeaway:
            plan.sourceAttribution?.source
              ? `Verified reference from ${plan.sourceAttribution.source}.`
              : 'Applied across domain problem solving.',
          accentColor: 'violet',
        },
      };
      editor.createShapes([card1Shape as any, card2Shape as any, card3Shape as any]);
    }

    if (options.highlightSelection !== false) {
      editor.setSelectedShapes(createdShapeIds);
    }

    return createdShapeIds;
  }

  /**
   * Stamps a single live geometric drawing directly onto the canvas (e.g. from a visualizer button).
   */
  public static stampSingleGeometry(
    editor: Editor,
    config: GeometryStampConfig
  ): TLShapeId {
    const dim = [{ w: CanvasStampingEngine.VISUAL_WIDTH, h: CanvasStampingEngine.VISUAL_HEIGHT }];
    const [pos] = this.calculateStampingPositions(editor, dim);

    const id = createShapeId();
    editor.createShape<IGeometryShape>({
      id,
      type: 'geometry',
      x: pos.x,
      y: pos.y,
      props: {
        w: pos.w,
        h: pos.h,
        geometryType: config.geometryType,
        title: config.title || 'Live Geometric Drawing',
        slope: config.slope ?? 2,
        intercept: config.intercept ?? 1,
        a: config.a ?? 3,
        b: config.b ?? 4,
        numerator: config.numerator ?? 3,
        denominator: config.denominator ?? 4,
        algorithmId: config.algorithmId,
        experimentId: config.experimentId,
      },
    });

    editor.setSelectedShapes([id]);
    return id;
  }

  /**
   * Stamps an interactive topic knowledge graph shape directly onto the canvas.
   */
  public static stampTopicKnowledgeGraph(
    editor: Editor,
    topicQuery: string,
    conceptId: string,
    title?: string
  ): TLShapeId {
    const dim = [{ w: CanvasStampingEngine.VISUAL_WIDTH, h: 480 }];
    const [pos] = this.calculateStampingPositions(editor, dim);

    const id = createShapeId();
    editor.createShape<ITopicGraphShape>({
      id,
      type: 'topic-graph',
      x: pos.x,
      y: pos.y,
      props: {
        w: pos.w,
        h: pos.h,
        topicQuery,
        conceptId,
        title: title || `Topic Graph: ${topicQuery}`,
      },
    });

    editor.setSelectedShapes([id]);
    return id;
  }
}
