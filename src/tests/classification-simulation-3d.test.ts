import assert from 'assert';
import { TopicClassifier } from '../features/learning/TopicClassifier';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { FormulaDerivationEngine } from '../features/learning/FormulaDerivationEngine';
import { UniversalInputInterpreter } from '../features/learning/UniversalInputInterpreter';
import { LearningPlanGenerator } from '../features/learning/LearningPlanGenerator';

async function runVerificationTests() {
  console.log('\n=============================================================');
  console.log('--- Running Topic Classification, 3D & Simulation Tests ---');
  console.log('=============================================================\n');

  // Test 1: "Law of cosines" classification
  const c1 = TopicClassifier.classify('Law of cosines');
  assert.strictEqual(c1.domain, 'mathematics', 'Law of cosines domain should be mathematics');
  assert.strictEqual(c1.engine, 'math', 'Law of cosines engine should be math');
  assert.strictEqual(c1.requiresClarification, false, 'Law of cosines requires no clarification');
  console.log('  ✓ Test 1 Passed: "Law of cosines" classified as mathematics / math engine');

  // Test 2: "cosine rule" classification
  const c2 = TopicClassifier.classify('cosine rule');
  assert.strictEqual(c2.domain, 'mathematics');
  assert.strictEqual(c2.engine, 'math');
  console.log('  ✓ Test 2 Passed: "cosine rule" classified as mathematics / math engine');

  // Test 3: "trigonometry" classification
  const c3 = TopicClassifier.classify('trigonometry');
  assert.strictEqual(c3.domain, 'mathematics');
  assert.strictEqual(c3.engine, 'math');
  console.log('  ✓ Test 3 Passed: "trigonometry" classified as mathematics / math engine');

  // Test 4: "projectile motion" simulation classification
  const c4 = TopicClassifier.classify('projectile motion');
  assert.strictEqual(c4.domain, 'physics');
  assert.strictEqual(c4.engine, 'simulation');
  console.log('  ✓ Test 4 Passed: "projectile motion" classified as physics / simulation engine');

  // Test 5: "human heart" biology classification
  const c5 = TopicClassifier.classify('human heart');
  assert.strictEqual(c5.domain, 'biology');
  assert.strictEqual(c5.engine, 'knowledge');
  console.log('  ✓ Test 5 Passed: "human heart" classified as biology / knowledge engine');

  // Test 6: UniversalInputInterpreter for "Law of cosines"
  const interp = UniversalInputInterpreter.interpret('Law of cosines');
  assert.strictEqual(interp.title, 'The Law of Cosines (Cosine Rule)');
  assert(interp.normalizedInput.includes('c² = a² + b² - 2ab'), 'Includes normalized Law of Cosines equation');
  assert(interp.variables.some((v) => v.symbol === 'a'), 'Includes side a variable');
  assert(interp.variables.some((v) => v.symbol === 'b'), 'Includes side b variable');
  assert(interp.variables.some((v) => v.symbol === 'C'), 'Includes angle C variable');
  console.log('  ✓ Test 6 Passed: UniversalInputInterpreter extracts Law of Cosines with parameters a, b, C, c');

  // Test 7: FormulaDerivationEngine calculation for Law of Cosines
  // a=5, b=7, C=60 deg => cos(60)=0.5 => 25 + 49 - 2*5*7*0.5 = 74 - 35 = 39 => c = sqrt(39) ≈ 6.245
  const calc = FormulaDerivationEngine.calculate('trigonometry_law_of_cosines', { a: 5, b: 7, C: 60 });
  assert.strictEqual(typeof calc.primaryResult, 'number');
  assert(Math.abs((calc.primaryResult as number) - 6.245) < 0.05, `Expected c ~ 6.245, got ${calc.primaryResult}`);
  assert(calc.formattedOutput.includes('39'), 'Calculated output includes c² = 39');
  console.log(`  ✓ Test 7 Passed: Law of Cosines calculation verified: c = ${calc.primaryResult} units`);

  // Test 8: FormulaDerivationEngine derivation steps for Law of Cosines
  const deriv = FormulaDerivationEngine.getDerivationSteps('trigonometry_law_of_cosines');
  assert(deriv.steps.length >= 5, 'Has at least 5 formal derivation steps');
  assert(deriv.steps.some((s) => s.expression.includes('sin²(C) + cos²(C) = 1')), 'Uses Pythagorean trigonometric identity');
  console.log(`  ✓ Test 8 Passed: Law of Cosines formal derivation verified with ${deriv.steps.length} geometric steps`);

  // Test 9: LearningOrchestrator for "Law of cosines" routes to math_engine (NOT Wikipedia knowledge)
  const orchResult = await LearningOrchestrator.processTopic('Law of cosines');
  assert.strictEqual(orchResult.routeTaken, 'math_engine', `Expected math_engine route, got ${orchResult.routeTaken}`);
  assert.strictEqual(orchResult.plan.category, 'geometry');
  assert(orchResult.plan.derivationSteps.length > 0, 'Plan contains step-by-step derivation');
  assert(orchResult.plan.workedExamples.length > 0, 'Plan contains worked examples');
  assert(orchResult.plan.practiceQuestions.length > 0, 'Plan contains practice self-check questions');
  // Test 10: Factual knowledge entity ("who is indian prime minister") has factual milestones without math jargon
  const factualResult = await LearningOrchestrator.processTopic('who is indian prime minister');
  assert.strictEqual(factualResult.routeTaken, 'wikipedia_and_ai', 'Routes to wikipedia_and_ai');
  assert(factualResult.plan.derivationSteps.length >= 3, 'Generates at least 3 structural breakdown steps');

  // Verify NO math/physics hallucinations on civics topic
  const stepText = factualResult.plan.derivationSteps.map((s) => `${s.expression} ${s.explanation} ${s.rationale}`).join(' ');
  assert(!stepText.toLowerCase().includes('axiom'), 'Must NOT hallucinate axioms on civics topic');
  assert(!stepText.toLowerCase().includes('conservation principle'), 'Must NOT hallucinate conservation principles on civics topic');
  assert(!stepText.toLowerCase().includes('final equation'), 'Must NOT hallucinate final equation on civics topic');
  assert(factualResult.plan.derivationSteps.some((s) => s.expression.includes('Mandate') || s.expression.includes('Operations') || s.expression.includes('Executive') || s.expression.includes('Identity')), 'Contains factual civic/governance breakdown');
  assert(factualResult.plan.variables.length === 0, 'No fake numerical variables on factual entity');
  console.log('  ✓ Test 10 Passed: Factual entity ("who is indian prime minister") produces factual civic breakdown without math axioms');

  // Test 11: FormulaDerivationEngine default fallback is domain-neutral
  const defaultDeriv = FormulaDerivationEngine.getDerivationSteps('unrecognized_concept_xyz');
  const defaultText = defaultDeriv.steps.map((s) => `${s.expression} ${s.explanation}`).join(' ');
  assert(!defaultText.toLowerCase().includes('axiom'), 'Default derivation does not mention axioms');
  assert(!defaultText.toLowerCase().includes('conservation principle'), 'Default derivation does not mention conservation principles');
  console.log('  ✓ Test 11 Passed: FormulaDerivationEngine fallback steps are domain-neutral and free of equations/axioms');

  console.log('\n=============================================================');
  console.log('✅ ALL CLASSIFICATION, 3D & SIMULATION VERIFICATION TESTS PASSED');
  console.log('=============================================================\n');
}

runVerificationTests().catch((err) => {
  console.error('FAILED verification tests:', err);
  process.exit(1);
});

