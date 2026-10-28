/**
 * VisiOS — Milestone 4: Enhanced Canvas Stamping Test Suite
 * Rigorously verifies:
 * 1. Non-overlapping coordinate calculation & collision detection
 * 2. Visual shape intent classification (Linear, Pythagorean, Fractions, Sim, 3D)
 * 3. Readable card geometry, typography, and copy formatting
 * 4. Non-destructive canvas preservation (user drawings protected)
 */

import { CanvasStampingEngine } from '../features/canvas/CanvasStampingEngine';
import { LearningPlan } from '../features/learning/types';

export async function runMilestone4StampingTests(): Promise<boolean> {
  console.log('\n--- Running Milestone 4: Enhanced Canvas Stamping Tests ---');
  let passed = true;

  function assert(condition: boolean, msg: string) {
    if (!condition) {
      console.error(`  ❌ FAILED: ${msg}`);
      passed = false;
    } else {
      console.log(`  ✓ PASSED: ${msg}`);
    }
  }

  // Helper to mock a tldraw Editor
  const createMockEditor = (options: {
    selectedShapes?: any[];
    selectionBounds?: { minX: number; minY: number; maxX: number; maxY: number } | null;
    viewportBounds?: { minX: number; minY: number; maxX: number; maxY: number; center: { x: number; y: number } };
    pageShapes?: any[];
  }) => {
    const createdShapes: any[] = [];
    const deletedShapeIds: any[] = [];
    let selectedShapeIds: any[] = [];

    const editor: any = {
      getSelectedShapes: () => options.selectedShapes || [],
      getSelectionPageBounds: () => options.selectionBounds || null,
      getViewportPageBounds: () =>
        options.viewportBounds || { minX: 0, minY: 0, maxX: 1920, maxY: 1080, center: { x: 960, y: 540 } },
      getCurrentPageShapes: () => [...(options.pageShapes || []), ...createdShapes],
      getShapePageBounds: (id: string) => {
        const found = [...(options.pageShapes || []), ...createdShapes].find((s) => s.id === id);
        if (found) {
          return {
            minX: found.x,
            minY: found.y,
            maxX: found.x + (found.props?.w || 200),
            maxY: found.y + (found.props?.h || 200),
          };
        }
        return null;
      },
      createShape: (shape: any) => {
        createdShapes.push(shape);
        return shape;
      },
      createShapes: (shapes: any[]) => {
        createdShapes.push(...shapes);
        return shapes;
      },
      deleteShapes: (ids: any[]) => {
        deletedShapeIds.push(...ids);
      },
      setSelectedShapes: (ids: any[]) => {
        selectedShapeIds = ids;
      },
      _getCreatedShapes: () => createdShapes,
      _getDeletedShapeIds: () => deletedShapeIds,
      _getSelectedShapeIds: () => selectedShapeIds,
    };

    return editor;
  };

  const sampleLinearPlan = {
    conceptId: 'math_linear_functions',
    title: '📐 Linear Function (y = 2x + 3)',
    category: 'algebra',
    subject: 'Mathematics',
    subjectId: 'mathematics',
    learningStrategy: 'algebraic_derivation',
    overview: 'A linear function represents a straight line with constant slope m = 2 and y-intercept c = 3.',
    motivation: 'Predicting linear rates of change.',
    prerequisites: ['Cartesian Plane', 'Slope Concept'],
    assumptions: ['Continuous Euclidean 2D plane'],
    derivationSteps: [
      {
        stepNumber: 1,
        expression: 'y = mx + c',
        explanation: 'Slope-intercept canonical equation of a straight line.',
        rationale: 'Fundamental equation',
        verificationStatus: 'verified',
      },
      {
        stepNumber: 2,
        expression: 'm = (y₂ - y₁) / (x₂ - x₁)',
        explanation: 'Constant rate of change representing rise over run.',
        rationale: 'Definition of slope',
        verificationStatus: 'verified',
      },
    ],
    workedExamples: [
      {
        title: 'Evaluate at x = 1',
        problemStatement: 'Find y when x = 1 for y = 2x + 3',
        givenValues: { x: 1, m: 2, c: 3 },
        stepByStepSolution: ['Substitute x = 1: y = 2(1) + 3', 'Multiply: 2 + 3 = 5', 'Coordinate point is (1, 5)'],
        finalAnswer: 'y = 5',
      },
    ],
    visualizationPlan: {
      title: 'Linear Plotter',
      learningObjective: 'Observe slope and intercept',
      rendererType: 'function_coordinate_plotter' as any,
      description: 'Interactive Cartesian coordinate plane plotting y = 2x + 3 with rate triangle.',
      activeVariables: ['m', 'c'],
      interactionsAvailable: ['drag_slope', 'drag_intercept'],
      fallbackSummary: 'Visual straight line',
      colorTheme: 'indigo',
    },
    applications: ['Physics kinematics: velocity-time relationship', 'Economics cost functions'],
    classification: {
      originalQuery: 'y = 2x + 3',
      domain: 'mathematics',
      intent: 'formula_explanation',
      engine: 'math',
      confidence: 0.99,
      requiresClarification: false,
      reason: 'Linear equation',
    },
  } as unknown as LearningPlan;

  const samplePythagorasPlan = {
    ...sampleLinearPlan,
    conceptId: 'math_pythagorean_theorem',
    title: '📐 The Pythagorean Theorem (a² + b² = c²)',
    category: 'geometry',
    overview: 'In a right-angled triangle, the square of the hypotenuse is equal to the sum of the squares of the other two sides.',
    classification: {
      originalQuery: 'a^2 + b^2 = c^2',
      domain: 'mathematics',
      intent: 'formula_explanation',
      engine: 'math',
      confidence: 0.99,
      requiresClarification: false,
      reason: 'Pythagorean identity',
    },
  } as unknown as LearningPlan;

  const sampleFractionPlan = {
    ...sampleLinearPlan,
    conceptId: 'math_fractions_basic',
    title: '✨ Fractions & Rational Part-to-Whole',
    category: 'algebra',
    overview: 'A fraction represents a part of a whole or equal parts of a quantity.',
    classification: {
      originalQuery: 'fractions',
      domain: 'mathematics',
      intent: 'formula_explanation',
      engine: 'math',
      confidence: 0.96,
      requiresClarification: false,
      reason: 'Fraction operations',
    },
  } as unknown as LearningPlan;

  // --- Suite 1: Layout Coordinates & Non-Overlapping Spacing ---
  console.log('\n[Suite 1] Layout Coordinates & Non-Overlapping Spacing:');
  {
    const editor = createMockEditor({});
    const cardDims = [
      { w: 420, h: 460 },
      { w: 420, h: 460 },
      { w: 520, h: 560 },
    ];

    const positions = CanvasStampingEngine.calculateStampingPositions(editor, cardDims, 36);

    assert(positions.length === 3, 'Calculates positions for exactly 3 cards');
    assert(positions[0].w === 420 && positions[1].w === 420 && positions[2].w === 520, 'Preserves individual card width definitions');

    // Spacing verification
    assert(positions[1].x === positions[0].x + 420 + 36, `Card 2 correctly spaced with 36px gap (got: ${positions[1].x})`);
    assert(positions[2].x === positions[1].x + 420 + 36, `Card 3 correctly spaced with 36px gap (got: ${positions[2].x})`);
    assert(positions[1].y === positions[0].y && positions[2].y === positions[0].y, 'All 3 suite cards horizontally aligned');
  }

  // --- Suite 2: Selection & Collision Offsetting ---
  console.log('\n[Suite 2] Selection Placement & Collision Avoidance:');
  {
    const editorWithSelection = createMockEditor({
      selectedShapes: [{ id: 'user_shape_1', type: 'geo', x: 100, y: 150 }],
      selectionBounds: { minX: 100, minY: 150, maxX: 350, maxY: 400 },
    });

    const cardDims = [{ w: 420, h: 460 }];
    const positions = CanvasStampingEngine.calculateStampingPositions(editorWithSelection, cardDims, 40);

    assert(positions[0].x === 350 + 40, `Places to the right of active selection at maxX + gap (got: ${positions[0].x})`);
    assert(positions[0].y === 150, `Aligns vertically with selection minY (got: ${positions[0].y})`);

    // Collision detection cascading
    const existing = [
      {
        id: 'existing_box_1',
        type: 'geo',
        x: 200,
        y: 200,
        props: { w: 1000, h: 300 },
      },
    ];

    const editorWithCollision = createMockEditor({
      pageShapes: existing,
      viewportBounds: { minX: 0, minY: 0, maxX: 1920, maxY: 1080, center: { x: 500, y: 300 } },
    });

    const colPositions = CanvasStampingEngine.calculateStampingPositions(editorWithCollision, cardDims, 36);
    assert(colPositions[0].y >= 536, `Cascades below colliding shape maxY (200+300=500) + 36 = 536 (got: ${colPositions[0].y})`);
  }

  // --- Suite 3: Pedagogical Visual Shape Routing ---
  console.log('\n[Suite 3] Visual Shape Intent Classification & Routing:');
  {
    // Linear Function
    const linearDecision = CanvasStampingEngine.determineVisualShapeType(sampleLinearPlan);
    assert(linearDecision.kind === 'geometry', 'Linear function routes to geometry shape');
    assert(linearDecision.geometryConfig?.geometryType === 'linear_plotter', 'Geometry type is linear_plotter');
    assert(linearDecision.geometryConfig?.slope === 2, 'Slope parameter extracted correctly (m = 2)');
    assert(linearDecision.geometryConfig?.intercept === 3, 'Intercept parameter extracted correctly (c = 3)');

    // Pythagorean Theorem
    const pythagorasDecision = CanvasStampingEngine.determineVisualShapeType(samplePythagorasPlan);
    assert(pythagorasDecision.kind === 'geometry', 'Pythagorean theorem routes to geometry shape');
    assert(pythagorasDecision.geometryConfig?.geometryType === 'pythagorean_proof', 'Geometry type is pythagorean_proof');
    assert(pythagorasDecision.geometryConfig?.a === 3 && pythagorasDecision.geometryConfig?.b === 4, 'Triples initialized (a=3, b=4)');

    // Fractions
    const fractionDecision = CanvasStampingEngine.determineVisualShapeType(sampleFractionPlan);
    assert(fractionDecision.kind === 'geometry', 'Fractions topic routes to geometry shape');
    assert(fractionDecision.geometryConfig?.geometryType === 'fraction_visualizer', 'Geometry type is fraction_visualizer');

    // Physics Simulation
    const pendulumPlan = {
      ...sampleLinearPlan,
      conceptId: 'phys_pendulum_harmonic',
      title: 'Simple Harmonic Pendulum',
      category: 'physics',
      visualizationPlan: {
        rendererType: 'pendulum_simulation' as any,
        description: 'Nonlinear simple gravity pendulum.',
      },
      classification: {
        originalQuery: 'simulate a pendulum',
        domain: 'physics',
        intent: 'interactive_simulation',
        engine: 'simulation',
        confidence: 0.99,
        requiresClarification: false,
        reason: 'Pendulum simulation',
      },
    } as unknown as LearningPlan;
    const simDecision = CanvasStampingEngine.determineVisualShapeType(pendulumPlan);
    assert(simDecision.kind === 'simulation', 'Pendulum topic routes to simulation shape');
    assert(simDecision.simulationType === 'pendulum', 'Simulation type is pendulum');

    // 3D Model
    const heartPlan = {
      ...sampleLinearPlan,
      conceptId: 'bio_heart_anatomy',
      title: 'Human Cardiac Heart Anatomy',
      category: 'biology' as any,
      visualizationPlan: {
        rendererType: 'model3d_viewer' as any,
        description: '3D cardiac chamber anatomical structure.',
      },
      classification: {
        originalQuery: 'heart 3d',
        domain: 'biology',
        intent: 'concept_learning',
        engine: 'knowledge',
        confidence: 0.95,
        requiresClarification: false,
        reason: 'Heart 3D model',
      },
    } as unknown as LearningPlan;
    const modelDecision = CanvasStampingEngine.determineVisualShapeType(heartPlan);
    assert(modelDecision.kind === 'model3d', 'Anatomy topic routes to model3d shape');
    assert(modelDecision.modelType === 'heart', 'Model type is heart');

    // Code-to-Visual Algorithm Tracer
    const bsearchPlan = {
      ...sampleLinearPlan,
      conceptId: 'cs_binary_search',
      title: 'Binary Search Algorithm',
      category: 'algorithm',
      visualizationPlan: {
        rendererType: 'algorithm_array_tracer' as any,
        description: 'Interactive logarithmic array partition search tracer.',
      },
    } as unknown as LearningPlan;
    const bsearchDecision = CanvasStampingEngine.determineVisualShapeType(bsearchPlan);
    assert(bsearchDecision.kind === 'geometry', 'Algorithm topic routes to live geometry shape');
    assert(bsearchDecision.geometryConfig?.geometryType === 'code_tracer', 'Shape type is code_tracer');
    assert(bsearchDecision.geometryConfig?.algorithmId === 'binary_search', 'Algorithm ID matches binary_search');

    // What-If Scenario Engine
    const whatIfPlan = {
      ...sampleLinearPlan,
      conceptId: 'phys_whatif_projectile',
      title: 'What-If: Projectile Launch Angle & Range',
      category: 'physics',
      visualizationPlan: {
        rendererType: 'what_if_scenario' as any,
        description: 'Bivariate sensitivity and prediction analysis.',
      },
    } as unknown as LearningPlan;
    const whatIfDecision = CanvasStampingEngine.determineVisualShapeType(whatIfPlan);
    assert(whatIfDecision.kind === 'geometry', 'What-If scenario topic routes to live geometry shape');
    assert(whatIfDecision.geometryConfig?.geometryType === 'what_if', 'Shape type is what_if');
  }

  // --- Suite 4: Stamping Suite Execution & Non-Destructive Behavior ---
  console.log('\n[Suite 4] Full Suite Stamping & Non-Destructive Canvas Invariants:');
  {
    const editor = createMockEditor({});
    const createdIds = CanvasStampingEngine.stampLearningSuite(editor, sampleLinearPlan);

    assert(createdIds.length === 3, `Stamps exactly 3 items in suite (got: ${createdIds.length})`);
    const created = editor._getCreatedShapes();
    assert(created.length === 3, 'Created shapes array has length 3');

    // Card 1
    assert(created[0].type === 'learning-card', 'Card 1 is a learning-card');
    assert(created[0].props.title.includes('Linear Function'), 'Card 1 has clean title');
    assert(created[0].props.formula === 'y = mx + c', 'Card 1 has prominent formula callout');
    assert(created[0].props.w >= 400 && created[0].props.h >= 400, 'Card 1 has spacious dimensions (>= 400x400)');

    // Card 2
    assert(created[1].type === 'learning-card', 'Card 2 is a learning-card');
    assert(created[1].props.badge === 'Method & Derivation', 'Card 2 has derivation badge');
    assert(created[1].props.steps.length > 0, 'Card 2 contains derivation steps');

    // Card 3
    assert(created[2].type === 'geometry', 'Card 3 is live interactive geometry shape');
    assert(created[2].props.geometryType === 'linear_plotter', 'Card 3 geometryType is linear_plotter');
    assert(created[2].props.w >= 500 && created[2].props.h >= 500, 'Geometry shape has spacious canvas dimensions (>= 500x500)');

    // User strokes preservation
    const userFreehandStroke = {
      id: 'user_stroke_1',
      type: 'draw',
      x: 50,
      y: 50,
      props: { segments: [] },
    };
    const userNote = {
      id: 'user_note_1',
      type: 'note',
      x: 100,
      y: 100,
      props: { text: 'My notes' },
    };
    const oldCard = {
      id: 'old_card_1',
      type: 'learning-card',
      x: 200,
      y: 200,
    };

    const editorWithUserDrawing = createMockEditor({
      pageShapes: [userFreehandStroke, userNote, oldCard],
    });

    CanvasStampingEngine.stampLearningSuite(editorWithUserDrawing, samplePythagorasPlan, {
      replacePrevious: true,
      previousShapeIds: ['old_card_1'],
    });

    const deletedIds = editorWithUserDrawing._getDeletedShapeIds();
    assert(deletedIds.includes('old_card_1'), 'Deletes old tracked system card');
    assert(!deletedIds.includes('user_stroke_1'), 'Never deletes user freehand drawing strokes');
    assert(!deletedIds.includes('user_note_1'), 'Never deletes user created notes');
  }

  // --- Suite 5: Direct Visual & Knowledge Graph Stamping ---
  console.log('\n[Suite 5] Direct Geometry & Knowledge Graph Canvas Stamping:');
  {
    const editor = createMockEditor({});
    const geoId = CanvasStampingEngine.stampSingleGeometry(editor, {
      geometryType: 'pythagorean_proof',
      title: 'Right Triangle Dissection',
      a: 5,
      b: 12,
    });

    assert(Boolean(geoId), 'Successfully stamps single geometry shape');
    const createdGeo = editor._getCreatedShapes();
    assert(createdGeo[0].type === 'geometry', 'Single stamp creates geometry shape');
    assert(createdGeo[0].props.geometryType === 'pythagorean_proof', 'Shape is pythagorean_proof');
    assert(createdGeo[0].props.a === 5 && createdGeo[0].props.b === 12, 'Parameters passed correctly (5, 12)');

    const tracerId = CanvasStampingEngine.stampSingleGeometry(editor, {
      geometryType: 'code_tracer',
      title: 'Binary Search Trace',
      algorithmId: 'binary_search',
    });
    assert(Boolean(tracerId), 'Successfully stamps single code tracer shape');
    assert(createdGeo[1].props.geometryType === 'code_tracer', 'Tracer shape has code_tracer geometryType');
    assert(createdGeo[1].props.algorithmId === 'binary_search', 'Tracer shape has algorithmId binary_search');

    const graphEditor = createMockEditor({});
    const graphId = CanvasStampingEngine.stampTopicKnowledgeGraph(
      graphEditor,
      'linear function',
      'math_linear_functions',
      'Linear Functions Knowledge Graph'
    );

    assert(Boolean(graphId), 'Successfully stamps topic knowledge graph shape');
    const createdGraph = graphEditor._getCreatedShapes();
    assert(createdGraph[0].type === 'topic-graph', 'Creates topic-graph shape');
    assert(createdGraph[0].props.topicQuery === 'linear function', 'Topic query matches');
    assert(createdGraph[0].props.conceptId === 'math_linear_functions', 'Concept ID matches');
  }

  if (passed) {
    console.log('\n✅ All Milestone 4 Enhanced Canvas Stamping tests PASSED (100%)\n');
  } else {
    console.error('\n❌ Some Milestone 4 tests FAILED\n');
  }

  return passed;
}

if (require.main === module) {
  runMilestone4StampingTests().then((ok) => process.exit(ok ? 0 : 1));
}
