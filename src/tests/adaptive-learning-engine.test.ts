import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AssessmentQuestion } from '../features/assessment/AssessmentContracts';
import { AssessmentOrchestrator } from '../features/assessment/AssessmentOrchestrator';
import { AssessmentGenerator } from '../features/adaptive-learning/engines/AssessmentGenerator';
import { AnswerEvaluationEngine } from '../features/adaptive-learning/engines/AnswerEvaluationEngine';
import { ConceptMasteryEngine } from '../features/adaptive-learning/engines/ConceptMasteryEngine';
import { AssessmentService } from '../features/adaptive-learning/services/AssessmentService';
import { LearningAnalyticsService } from '../features/adaptive-learning/services/LearningAnalyticsService';
import { QuestionBankService } from '../features/adaptive-learning/services/QuestionBankService';
import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';

test('question bank produces validated, concept-aligned quadratic items and refuses unsupported topics', () => {
  const questions = AssessmentGenerator.generateAssessment('algebra_quadratic', 5, 1);
  assert.equal(questions.length, 5);
  assert.ok(questions.every((question) => question.conceptId === 'algebra_quadratic'));
  assert.deepEqual(questions.map((question) => question.difficulty), [1, 2, 3, 4, 5]);
  assert.equal(QuestionBankService.getQuestion('quantum_chromodynamics', 2), null);
  assert.equal(QuestionBankService.getQuestion('physics_kinematics_v_u_at', 2), null);
  assert.equal(QuestionBankService.getQuestion('cs_stack_operations', 2), null);
  assert.equal(QuestionBankService.getQuestion('algo_binary_search', 2)?.conceptId, 'cs_binary_search');
});

test('question bank covers the existing verified chemistry and biology concept engines', () => {
  const concepts = ['chem_periodic_table', 'chem_ideal_gas', 'chem_chemical_bonding', 'bio_photosynthesis', 'bio_dna_structure', 'bio_punnett_genetics', 'bio_nervous_system'];
  for (const conceptId of concepts) {
    const questions = AssessmentGenerator.generateAssessment(conceptId, 5, 1);
    assert.equal(questions.length, 5, `${conceptId} should have five assessment items`);
    assert.equal(new Set(questions.map((question) => question.question)).size, 5, `${conceptId} should not repeat the same question`);
    assert.ok(questions.every((question) => question.conceptId === conceptId));
  }
});

test('answer evaluation is deterministic for a quadratic correct and incorrect response', () => {
  const question = QuestionBankService.getQuestion('algebra_quadratic', 2)!;
  const right = AnswerEvaluationEngine.evaluate(question, 1);
  const wrong = AnswerEvaluationEngine.evaluate(question, 0);
  assert.equal(right.status, 'correct');
  assert.equal(right.score, 100);
  assert.equal(wrong.status, 'incorrect');
  assert.equal(wrong.score, 0);
});

test('mastery score maps to the configured needs-revision, learning, almost-mastered, and mastered thresholds', () => {
  assert.equal(ConceptMasteryEngine.calculateStatus(20, 5), 'needs_revision');
  assert.equal(ConceptMasteryEngine.calculateStatus(55, 5), 'learning');
  assert.equal(ConceptMasteryEngine.calculateStatus(75, 5), 'almost_mastered');
  assert.equal(ConceptMasteryEngine.calculateStatus(90, 5), 'mastered');
  assert.equal(ConceptMasteryEngine.calculateStatus(100, 0), 'not_started');
});

test('assessment submission updates mastery, analytics, difficulty, and persists the next question', () => {
  const model = new KnowledgeModel();
  const studentId = `adaptive_test_${Date.now()}`;
  // AssessmentService uses the shared model so the mastery/analytics view is consistent with the orchestrator.
  const question = QuestionBankService.getQuestion('algebra_quadratic', 1)!;
  const score = AnswerEvaluationEngine.evaluate(question, question.correctOptionIndex!);
  assert.equal(score.status, 'correct');

  const service = new AssessmentService(new AssessmentOrchestrator(model), model);
  const started = service.start(studentId, 'algebra_quadratic', 1);
  assert.ok(started?.question);
  const answer = started!.question.correctOptionIndex ?? started!.question.expectedAnswer!;
  const result = service.submit(started!.session.sessionId, started!.question, answer);
  assert.equal(result.evaluation.status, 'correct');
  assert.equal(result.session.questionsAnswered, 1);
  assert.ok(result.nextQuestion);
  assert.equal(result.analytics.totalAttempts, 1);
  assert.equal(result.analytics.accuracy, 100);
  assert.equal(result.session.currentQuestion?.id, result.nextQuestion?.id);

  let completed = result.session;
  for (let index = completed.questionsAnswered; index < 5; index += 1) {
    const nextQuestion = completed.currentQuestion!;
    const nextAnswer = nextQuestion.correctOptionIndex ?? nextQuestion.expectedAnswer!;
    completed = service.submit(completed.sessionId, nextQuestion, nextAnswer).session;
  }
  assert.equal(completed.isCompleted, true);
  assert.ok(completed.currentQuestion, 'Completed assessment retains the final question for its result view');
  const restoredCompleted = service.start(studentId, 'algebra_quadratic', 1)!;
  assert.equal(restoredCompleted.session.sessionId, completed.sessionId, 'Reload shows the completed assessment instead of replacing it');
  const retry = service.restart(studentId, 'algebra_quadratic', 1)!;
  assert.notEqual(retry.session.sessionId, completed.sessionId, 'Explicit retry opens a new assessment');

  const analytics = LearningAnalyticsService.getConceptAnalytics(studentId, 'algebra_quadratic', model);
  assert.equal(analytics.mastery.correctAttempts, 5);
  assert.equal(analytics.mastery.status, 'mastered');
  model.clearProfile(studentId);
});

test('unknown generator fallback is explicitly unable to evaluate instead of presenting a fake answer key', () => {
  const unknown: AssessmentQuestion = AssessmentGenerator.generateQuestion('unverified_topic', 2) as any;
  assert.equal(unknown, null);
});
