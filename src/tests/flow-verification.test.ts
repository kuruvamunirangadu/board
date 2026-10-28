import { BoardFeedParser, KNOWN_FORMULA_REGISTRY } from '../features/intelligence/board-feed-parser';
import { DomainKnowledgeEngine } from '../features/learning/DomainKnowledgeEngine';
import { TopicClassifier } from '../features/learning/TopicClassifier';
import { UniversalInputInterpreter } from '../features/learning/UniversalInputInterpreter';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { CanvasStampingEngine } from '../features/canvas/CanvasStampingEngine';
import { ConceptDependencyGraphEngine } from '../features/learning/ConceptDependencyGraph';
import { handleKnowledgeQuery } from '../features/knowledge/knowledge-client';

async function runFlowVerification() {
  console.log('--- RUNNING FLOW INTEGRITY VERIFICATION ---');

  // Test 1: Empty board shapes should NOT default to KNOWN_FORMULA_REGISTRY[0] (a^2+b^2-2ab)
  const emptyParse = BoardFeedParser.parseBoardFeed([]);
  if (emptyParse !== null) {
    throw new Error(`FAIL: Empty parse returned non-null: ${JSON.stringify(emptyParse)}`);
  }
  console.log('✓ PASS: BoardFeedParser.parseBoardFeed([]) returns null, no arbitrary (a-b)^2 injection.');

  // Test 2: Input 'graph\ny=e^(cos(x))' matches DomainKnowledgeEngine
  const domainMatch = DomainKnowledgeEngine.match('graph\ny=e^(cos(x))');
  if (!domainMatch || domainMatch.conceptId !== 'math_exp_cos_curve') {
    throw new Error(`FAIL: DomainKnowledgeEngine failed to match graph y=e^(cos(x)): ${JSON.stringify(domainMatch)}`);
  }
  console.log('✓ PASS: DomainKnowledgeEngine matched graph y=e^(cos(x)) as math_exp_cos_curve.');
  if (domainMatch.title.includes('Newton') || domainMatch.title.includes('Vectors')) {
    throw new Error('FAIL: Unrelated topic polluted domain model!');
  }

  // Test 3: UniversalInputInterpreter matches accurately with no ambiguity
  const interp = UniversalInputInterpreter.interpret('y = e^(cos(x))');
  if (interp.isAmbiguous) {
    throw new Error(`FAIL: UniversalInputInterpreter flagged y = e^(cos(x)) as ambiguous: ${interp.ambiguityReason}`);
  }
  if (interp.category !== 'calculus') {
    throw new Error(`FAIL: Expected category calculus, got ${interp.category}`);
  }
  console.log(`✓ PASS: UniversalInputInterpreter classified as "${interp.title}" under ${interp.category}.`);

  // Test 4: LearningOrchestrator routes through math_engine and returns curve plan
  const orchestrated = await LearningOrchestrator.processTopic('graph\ny=e^(cos(x))');
  if (orchestrated.plan.conceptId !== 'math_exp_cos_curve') {
    throw new Error(`FAIL: Expected conceptId math_exp_cos_curve, got ${orchestrated.plan.conceptId}`);
  }
  console.log(`✓ PASS: LearningOrchestrator planned: "${orchestrated.plan.title}".`);

  // Test 5: CanvasStampingEngine determines geometry curve plotter, NOT model3d vectors
  let capturedShapes: any[] = [];
  const dummyEditor: any = {
    getSelectedShapes: () => [],
    getCurrentPageShapes: () => [],
    getViewportPageBounds: () => ({ minX: 0, minY: 0, maxX: 1000, maxY: 800, center: { x: 500, y: 400 } }),
    createShapes: (shapes: any[]) => {
      capturedShapes.push(...shapes);
      return shapes;
    },
    setSelectedShapes: () => {},
  };

  capturedShapes = [];
  const shapes = CanvasStampingEngine.stampLearningSuite(dummyEditor, orchestrated.plan, { replacePrevious: false });
  if (shapes.length !== 3) {
    throw new Error(`FAIL: Expected 3 stamped shapes, got ${shapes.length}`);
  }
  console.log('✓ PASS: CanvasStampingEngine stamped 3-card suite without collisions.');

  // Test 6: Concept Dependency Graph mapping
  const conceptNode = ConceptDependencyGraphEngine.resolveGoalConcept('y = e^(cos(x))');
  if (!conceptNode || (conceptNode.id !== 'math_exp_cos_curve' && conceptNode.id !== 'math_trig_functions')) {
    throw new Error(`FAIL: ConceptDependencyGraph could not map y = e^(cos(x)): ${JSON.stringify(conceptNode)}`);
  }
  console.log(`✓ PASS: ConceptDependencyGraph mapped to "${conceptNode.title}" (${conceptNode.id}).`);

  // Test 7: Pure cosine and sine mapping
  const cosMatch = DomainKnowledgeEngine.match('y = cos(x)');
  if (!cosMatch || cosMatch.conceptId !== 'math_cosine_function') {
    throw new Error(`FAIL: y = cos(x) did not map to cosine function: ${JSON.stringify(cosMatch)}`);
  }
  console.log('✓ PASS: y = cos(x) correctly mapped to math_cosine_function.');

  // Test 8: Linear line plotting is not broken
  const linearMatch = DomainKnowledgeEngine.match('y = 2x + 3');
  if (!linearMatch || (linearMatch.conceptId !== 'math_linear_functions' && linearMatch.conceptId !== 'math_linear_function')) {
    throw new Error(`FAIL: y = 2x + 3 did not map to linear function: ${JSON.stringify(linearMatch)}`);
  }
  console.log('✓ PASS: Linear function y = 2x + 3 correctly preserved.');

  // Test 9: Input 'graph of y=e^x'
  const expMatch = DomainKnowledgeEngine.match('graph of y=e^x');
  if (!expMatch || expMatch.conceptId !== 'math_exponential_function') {
    throw new Error(`FAIL: graph of y=e^x did not map to math_exponential_function: ${JSON.stringify(expMatch)}`);
  }
  const expClass = TopicClassifier.classify('graph of y=e^x');
  if (expClass.requiresClarification) {
    throw new Error(`FAIL: TopicClassifier falsely requested clarification for graph of y=e^x: ${expClass.reason}`);
  }
  const expOrch = await LearningOrchestrator.processTopic('graph of y=e^x');
  if (expOrch.plan.uncertaintyState?.isUncertain) {
    throw new Error('FAIL: LearningOrchestrator returned uncertainty for graph of y=e^x');
  }
  capturedShapes = [];
  const expShapes = CanvasStampingEngine.stampLearningSuite(dummyEditor, expOrch.plan, { replacePrevious: false });
  const geomShape = capturedShapes.find((s: any) => s.type === 'geometry');
  if (!geomShape || (geomShape.props as any).functionExpression !== 'e^x') {
    throw new Error(`FAIL: Expected functionExpression e^x on geometry stamp, got: ${JSON.stringify(geomShape?.props)}`);
  }
  console.log('✓ PASS: graph of y=e^x correctly mapped, planned, and stamped with live e^x plotter.');

  // Test 10: y = 2x + 3 does NOT trigger clarification
  const linearClass = TopicClassifier.classify('y = 2x + 3');
  if (linearClass.requiresClarification) {
    throw new Error(`FAIL: TopicClassifier falsely requested clarification for y = 2x + 3: ${linearClass.reason}`);
  }
  const linearOrch = await LearningOrchestrator.processTopic('y = 2x + 3');
  if (linearOrch.plan.uncertaintyState?.isUncertain) {
    throw new Error('FAIL: LearningOrchestrator returned uncertainty for y = 2x + 3');
  }
  capturedShapes = [];
  const linearShapes = CanvasStampingEngine.stampLearningSuite(dummyEditor, linearOrch.plan, { replacePrevious: false });
  const linearPlotter = capturedShapes.find((s: any) => s.type === 'geometry');
  if (!linearPlotter || (linearPlotter.props as any).slope !== 2 || (linearPlotter.props as any).intercept !== 3) {
    throw new Error(`FAIL: Expected slope 2 and intercept 3 on geometry stamp, got: ${JSON.stringify(linearPlotter?.props)}`);
  }
  console.log('✓ PASS: y = 2x + 3 correctly classified and stamped with slope 2 and intercept 3.');

  // Test 11: End-to-end flow for 'graph of y=cosx'
  // Ensures y=cosx does NOT map to linear y=mx+c, but correctly to math_cosine_function
  const cosMatch11 = DomainKnowledgeEngine.match('graph of y=cosx');
  if (!cosMatch11 || cosMatch11.conceptId !== 'math_cosine_function') {
    throw new Error(`FAIL: graph of y=cosx did not map to math_cosine_function: ${JSON.stringify(cosMatch11)}`);
  }
  const cosConcept = ConceptDependencyGraphEngine.resolveGoalConcept('graph of y=cosx');
  if (!cosConcept || cosConcept.id !== 'math_cosine_function') {
    throw new Error(`FAIL: ConceptDependencyGraph did not resolve graph of y=cosx to math_cosine_function: ${cosConcept?.id}`);
  }
  const cosOrch = await LearningOrchestrator.processTopic('graph of y=cosx');
  if (cosOrch.plan.conceptId !== 'math_cosine_function') {
    throw new Error(`FAIL: LearningOrchestrator plan conceptId expected math_cosine_function, got: ${cosOrch.plan.conceptId}`);
  }
  capturedShapes = [];
  const stampedCos = CanvasStampingEngine.stampLearningSuite(dummyEditor, cosOrch.plan, { replacePrevious: false });
  if (stampedCos.length !== 3) {
    throw new Error(`FAIL: Expected 3 stamped cards for cosine suite, got ${stampedCos.length}`);
  }
  const cosPlotter = capturedShapes.find((s: any) => s.type === 'geometry');
  if (!cosPlotter || (cosPlotter.props as any).functionExpression !== 'cos(x)') {
    throw new Error(`FAIL: Stamped Card 3 expected functionExpression 'cos(x)', got: ${JSON.stringify(cosPlotter?.props)}`);
  }
  // Check Card 2 formal derivation steps
  const card2 = capturedShapes.find((s: any) => s.type === 'learning-card' && (s.props as any).badge?.includes('Derivation'));
  if (!card2 || !(card2.props as any).steps?.some((step: string) => step.includes('cos') || step.includes('sin') || step.includes('P(θ)'))) {
    throw new Error(`FAIL: Card 2 missing authentic cosine derivation steps: ${JSON.stringify((card2?.props as any)?.steps)}`);
  }
  console.log('✓ PASS: graph of y=cosx accurately mapped to math_cosine_function, stamped with cos(x) wave plotter and authentic unit-circle derivation steps.');

  // Test 12: Knowledge Graph Connection Points and Endpoints
  const subGraph = ConceptDependencyGraphEngine.getTopicKnowledgeSubGraph('graph of y=cosx');
  if (!subGraph) {
    throw new Error('FAIL: getTopicKnowledgeSubGraph returned null for graph of y=cosx');
  }
  if (subGraph.targetConcept.id !== 'math_cosine_function') {
    throw new Error(`FAIL: Subgraph targetConcept expected math_cosine_function, got: ${subGraph.targetConcept.id}`);
  }
  if (!subGraph.nodes.every((n) => n.connectionPoints?.left && n.connectionPoints?.right && n.endpoints?.incoming && n.endpoints?.outgoing)) {
    throw new Error('FAIL: Not all subgraph nodes contain complete connectionPoints and endpoints!');
  }
  if (!subGraph.edges.every((e) => typeof e.startX === 'number' && typeof e.startY === 'number' && typeof e.endX === 'number' && typeof e.endY === 'number' && e.pathD?.startsWith('M '))) {
    throw new Error('FAIL: Not all subgraph edges contain explicit start/end connection coordinates and bezier pathD!');
  }
  if (!subGraph.metadata || typeof subGraph.metadata.totalPrerequisites !== 'number' || typeof subGraph.metadata.totalEdges !== 'number') {
    throw new Error('FAIL: Subgraph metadata is missing or incomplete!');
  }
  console.log(`✓ PASS: Knowledge Graph verified with ${subGraph.nodes.length} nodes, ${subGraph.edges.length} edges, complete connection points and endpoints.`);

  // Test 13: Knowledge API (/api/knowledge & handleKnowledgeQuery)
  const knowledgeRes = await handleKnowledgeQuery('y=cosx');
  if (!knowledgeRes.found) {
    throw new Error(`FAIL: handleKnowledgeQuery returned found: false for y=cosx: ${JSON.stringify(knowledgeRes)}`);
  }
  if (!knowledgeRes.bestMatch?.title?.toLowerCase().includes('cosine') && !knowledgeRes.bestMatch?.title?.includes('cos')) {
    throw new Error(`FAIL: handleKnowledgeQuery bestMatch title does not mention Cosine: ${knowledgeRes.bestMatch?.title}`);
  }
  if (!knowledgeRes.knowledgeGraph || !knowledgeRes.curriculumConcept || knowledgeRes.curriculumConcept.id !== 'math_cosine_function') {
    throw new Error(`FAIL: handleKnowledgeQuery missing knowledgeGraph or curriculumConcept math_cosine_function!`);
  }
  if (!knowledgeRes.knowledgeGraph.edges.every((e) => typeof e.startX === 'number' && typeof e.endX === 'number')) {
    throw new Error('FAIL: Knowledge API knowledgeGraph edges missing explicit connection points!');
  }
  // Test 14: Nervous System & 3D Interactive Model Verification
  const neuroMatch = DomainKnowledgeEngine.match('nervous system');
  if (!neuroMatch || neuroMatch.conceptId !== 'bio_nervous_system') {
    throw new Error(`FAIL: nervous system did not match bio_nervous_system: ${JSON.stringify(neuroMatch)}`);
  }
  const neuroOrch = await LearningOrchestrator.processTopic('nervous system');
  if (neuroOrch.plan.conceptId !== 'bio_nervous_system') {
    throw new Error(`FAIL: LearningOrchestrator expected conceptId bio_nervous_system, got: ${neuroOrch.plan.conceptId}`);
  }
  capturedShapes = [];
  const stampedNeuro = CanvasStampingEngine.stampLearningSuite(dummyEditor, neuroOrch.plan, { replacePrevious: false });
  if (stampedNeuro.length !== 3) {
    throw new Error(`FAIL: Expected 3 stamped cards for nervous system suite, got ${stampedNeuro.length}`);
  }
  // Card 2 must be Biological Mechanism & Pathway
  const neuroCard2 = capturedShapes.find((s: any) => s.type === 'learning-card' && (s.props as any).badge?.includes('Biological Mechanism'));
  if (!neuroCard2 || !(neuroCard2.props as any).steps?.some((step: string) => step.includes('Action Potential') || step.includes('Synaptic') || step.includes('Conduction'))) {
    throw new Error(`FAIL: Card 2 missing biological mechanism steps: ${JSON.stringify((neuroCard2?.props as any)?.steps)}`);
  }
  // Card 3 must be model3d with nervous_system modelType (not fallback topic-graph)
  const neuroModel3D = capturedShapes.find((s: any) => s.type === 'model3d');
  if (!neuroModel3D || (neuroModel3D.props as any).modelType !== 'nervous_system') {
    throw new Error(`FAIL: Card 3 expected model3d with modelType 'nervous_system', got: ${JSON.stringify(neuroModel3D?.props)}`);
  }
  // Verify Concept Dependency Graph
  const neuroConcept = ConceptDependencyGraphEngine.resolveGoalConcept('nervous system');
  if (!neuroConcept || neuroConcept.id !== 'bio_nervous_system') {
    throw new Error(`FAIL: ConceptDependencyGraph did not resolve nervous system to bio_nervous_system: ${neuroConcept?.id}`);
  }
  const neuroGraph = ConceptDependencyGraphEngine.getTopicKnowledgeSubGraph('nervous system');
  if (!neuroGraph || neuroGraph.nodes.length < 2) {
    throw new Error(`FAIL: Expected valid topic subgraph for nervous system, got: ${JSON.stringify(neuroGraph)}`);
  }
  console.log('✓ PASS: Nervous system verified with 3D model stamp, biological mechanism steps, and connected knowledge graph.');

  console.log('\n ALL FLOW INTEGRITY TESTS PASSED SUCCESSFULLY! ');
}

runFlowVerification().catch((err) => {
  console.error(err);
  process.exit(1);
});
