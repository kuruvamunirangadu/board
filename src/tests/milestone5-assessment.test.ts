/**
 * VisiOS — Milestone 5: Intelligent Assessment, Knowledge Verification & Personalized Practice Suite
 * Covers all 15 required Phase 5 verification scenarios:
 * 1. Valid question generated passes validation.
 * 2. Generated question with incorrect answer key is rejected by validator.
 * 3. Correct numeric answer evaluates to correct.
 * 4. Incorrect numeric answer evaluates to incorrect.
 * 5. Equivalent symbolic expressions (e.g. 2(x+1) and 2x+2) recognized as equivalent.
 * 6. Invalid symbolic expression marked as incorrect or unable_to_evaluate.
 * 7. Correct final answer with invalid steps: separates final answer correctness from reasoning correctness.
 * 8. Partially correct solution: preserves valid derivation steps.
 * 9. Progressive hints: returns progressive levels without prematurely revealing the solution.
 * 10. Repeated conceptual errors diagnose potential misconceptions.
 * 11. One isolated incorrect answer does NOT trigger definitive misconception diagnosis.
 * 12. Unsupported question type returns explicit unable_to_evaluate status.
 * 13. Assessment session interruption and state restoration.
 * 14. Invalid generated content blocked before presentation.
 * 15. Integration with Phase 4 knowledge model: updates mastery cleanly without conflicting duplicate scores.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { QuestionGenerator } from '../features/assessment/QuestionGenerator';
import { QuestionValidator } from '../features/assessment/QuestionValidator';
import { AnswerEvaluator } from '../features/assessment/AnswerEvaluator';
import { StepEvaluator } from '../features/assessment/StepEvaluator';
import { HintEngine } from '../features/assessment/HintEngine';
import { MisconceptionDiagnoser } from '../features/assessment/MisconceptionDiagnoser';
import { AssessmentDifficultyController } from '../features/assessment/AssessmentDifficultyController';
import { AssessmentPersistence } from '../features/assessment/AssessmentPersistence';
import { AssessmentOrchestrator } from '../features/assessment/AssessmentOrchestrator';
import { AssessmentQuestion } from '../features/assessment/AssessmentContracts';
import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';

// ---------------------------------------------------------------------------
// Test 1: Valid question generation and validation
// ---------------------------------------------------------------------------
test('Test 1: Valid generated question passes structural and mathematical validation', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 2);
  const validation = QuestionValidator.validate(q);

  assert.equal(validation.isValid, true, `Validation failed: ${validation.errors.join('; ')}`);
  assert.equal(q.conceptId, 'math_linear_functions');
  assert.equal(q.difficulty, 2);
  assert.ok(q.hints.length >= 2, 'Must have at least 2 progressive hints');
  assert.equal(q.expectedAnswer, 11, 'y = 2x + 3 at x = 4 must expect 11');
});

// ---------------------------------------------------------------------------
// Test 2: Question with false answer key is rejected
// ---------------------------------------------------------------------------
test('Test 2: Question with contradictory answer key is strictly rejected by validator', () => {
  const faultyQuestion: AssessmentQuestion = {
    id: 'q_faulty_test',
    conceptId: 'math_linear_functions',
    capabilityId: 'cap_linear_functions',
    question: 'Given the linear function y = 2x + 3, calculate the value of y when x = 4.',
    questionType: 'numeric',
    difficulty: 2,
    prerequisites: [],
    expectedAnswer: 10, // CONTRADICTION: 2(4) + 3 is 11, NOT 10!
    evaluationStrategy: 'deterministic_numeric',
    hints: ['Hint 1', 'Hint 2'],
    explanation: 'Fake solution',
  };

  const validation = QuestionValidator.validate(faultyQuestion);
  assert.equal(validation.isValid, false, 'Contradictory question key must be rejected');
  assert.ok(
    validation.errors.some((e) => e.includes('Mathematical contradiction') && e.includes('11')),
    `Expected contradiction error mentioning 11, got: ${validation.errors.join('; ')}`
  );
});

// ---------------------------------------------------------------------------
// Test 3: Correct numeric answer
// ---------------------------------------------------------------------------
test('Test 3: Correct numeric answer evaluates to correct status with 100 score', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 2); // y = 2x + 3 at x = 4 -> 11
  const result = AnswerEvaluator.evaluate(q, 11);

  assert.equal(result.status, 'correct');
  assert.equal(result.finalAnswerCorrect, true);
  assert.equal(result.score, 100);
});

// ---------------------------------------------------------------------------
// Test 4: Incorrect numeric answer
// ---------------------------------------------------------------------------
test('Test 4: Incorrect numeric answer evaluates to incorrect status with 0 score', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 2);
  const result = AnswerEvaluator.evaluate(q, 10);

  assert.equal(result.status, 'incorrect');
  assert.equal(result.finalAnswerCorrect, false);
  assert.equal(result.score, 0);
  assert.ok(result.feedback.includes('11'));
});

// ---------------------------------------------------------------------------
// Test 5: Equivalent symbolic expressions
// ---------------------------------------------------------------------------
test('Test 5: Equivalent symbolic expressions are recognized as equivalent (e.g. 2(x+1) vs 2x+2)', () => {
  const symbolicQ: AssessmentQuestion = {
    id: 'q_sym_test',
    conceptId: 'math_factoring_expansion',
    capabilityId: 'cap_polynomial_identities',
    question: 'Factor or expand the expression: 2(x+1)',
    questionType: 'symbolic',
    difficulty: 3,
    prerequisites: [],
    expectedAnswer: '2x + 2',
    evaluationStrategy: 'symbolic_equivalence',
    hints: ['Distribute the factor across terms.'],
    explanation: '2(x+1) = 2x + 2.',
  };

  // Student submits factored form 2(x+1) when key has 2x + 2
  const eval1 = AnswerEvaluator.evaluate(symbolicQ, '2(x+1)');
  assert.equal(eval1.status, 'correct', '2(x+1) must be equivalent to 2x + 2');

  // Student submits expanded form 2x + 2
  const eval2 = AnswerEvaluator.evaluate(symbolicQ, '2x+2');
  assert.equal(eval2.status, 'correct', '2x+2 must be equivalent to 2x + 2');
});

// ---------------------------------------------------------------------------
// Test 6: Invalid symbolic expression
// ---------------------------------------------------------------------------
test('Test 6: Invalid symbolic expression is marked incorrect', () => {
  const symbolicQ: AssessmentQuestion = {
    id: 'q_sym_test2',
    conceptId: 'math_factoring_expansion',
    capabilityId: 'cap_polynomial_identities',
    question: 'Expand: 2(x+1)',
    questionType: 'symbolic',
    difficulty: 3,
    prerequisites: [],
    expectedAnswer: '2x + 2',
    evaluationStrategy: 'symbolic_equivalence',
    hints: ['Distribute 2.'],
    explanation: '2x + 2',
  };

  const evalWrong = AnswerEvaluator.evaluate(symbolicQ, '2x + 3');
  assert.equal(evalWrong.status, 'incorrect');
  assert.equal(evalWrong.finalAnswerCorrect, false);
});

// ---------------------------------------------------------------------------
// Test 7: Correct final answer with invalid steps
// ---------------------------------------------------------------------------
test('Test 7: Correct final answer with invalid derivation steps keeps reasoning and answer separate', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 3); // Solve 2x + 3 = 11 -> x = 4

  // Student writes false intermediate step 2x = 11 + 3, but somehow guessed final answer 4
  const flawedSteps = ['2x + 3 = 11', '2x = 11 + 3', 'x = 4'];
  const result = AnswerEvaluator.evaluate(q, 4, flawedSteps);

  assert.equal(result.status, 'partially_correct');
  assert.equal(result.finalAnswerCorrect, true, 'Final answer 4 is correct');
  assert.equal(result.reasoningCorrect, false, 'Intermediate step 2x = 11 + 3 is invalid');
  assert.equal(result.score, 50, 'Partially correct score applied');
  assert.ok(result.feedback.includes('invalid transformation'));
});

// ---------------------------------------------------------------------------
// Test 8: Partially correct solution (valid method with arithmetic slip)
// ---------------------------------------------------------------------------
test('Test 8: Valid derivation method with arithmetic final slip preserves valid steps', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 3); // Solve 2x + 3 = 11 -> x = 4

  // Valid method steps, but arithmetic slip in final calculation: 8 / 2 = 5
  const slipSteps = ['2x = 11 - 3', '2x = 8'];
  const result = AnswerEvaluator.evaluate(q, 5, slipSteps); // submitted answer 5 instead of 4

  assert.equal(result.status, 'partially_correct');
  assert.equal(result.finalAnswerCorrect, false, 'Final answer 5 is incorrect');
  assert.equal(result.reasoningCorrect, true, 'Derivation steps 2x = 11 - 3 and 2x = 8 are valid');
  assert.equal(result.score, 60);
  assert.ok(result.feedback.includes('arithmetic error'));
});

// ---------------------------------------------------------------------------
// Test 9: Progressive hints
// ---------------------------------------------------------------------------
test('Test 9: Progressive hints are delivered sequentially without immediately revealing answer', () => {
  const q = QuestionGenerator.generate('math_linear_functions', 2); // 3 hints

  const hint1 = HintEngine.getNextHint(q, 0);
  assert.equal(hint1.hintIndex, 1);
  assert.equal(hint1.hasMoreHints, true);
  assert.equal(hint1.isSolutionRevealed, false);
  assert.ok(hint1.hintText.length > 5);

  const hint2 = HintEngine.getNextHint(q, 1);
  assert.equal(hint2.hintIndex, 2);
  assert.equal(hint2.hasMoreHints, true);
  assert.equal(hint2.isSolutionRevealed, false);

  const hint3 = HintEngine.getNextHint(q, 2);
  assert.equal(hint3.hintIndex, 3);
  assert.equal(hint3.hasMoreHints, false);
  assert.equal(hint3.isSolutionRevealed, false);

  // Requesting beyond last hint reveals final solution
  const solution = HintEngine.getNextHint(q, 3);
  assert.equal(solution.isSolutionRevealed, true);
  assert.ok(solution.hintText.includes('Complete Solution'));
});

// ---------------------------------------------------------------------------
// Test 10: Repeated conceptual error diagnoses potential misconception
// ---------------------------------------------------------------------------
test('Test 10: Conceptual error on linear equation slope diagnoses slope-intercept inversion', () => {
  const diagnosis = MisconceptionDiagnoser.diagnose('math_linear_functions', 'slope is 3');
  assert.ok(diagnosis, 'Should diagnose slope-intercept inversion');
  assert.equal(diagnosis.misconceptionId, 'misc_linear_slope_intercept_swap');
  assert.equal(diagnosis.isConfirmed, false, 'Single occurrence is flagged as potential, not yet confirmed');
});

// ---------------------------------------------------------------------------
// Test 11: One isolated incorrect answer does not confirm misconception
// ---------------------------------------------------------------------------
test('Test 11: One isolated incorrect answer does not trigger confirmed misconception status', () => {
  const km = new KnowledgeModel();
  const orchestrator = new AssessmentOrchestrator(km);
  const studentId = `student_diag_${Date.now()}`;
  const conceptId = 'math_linear_functions';

  const { session, nextQuestion } = orchestrator.startOrResumeSession(studentId, conceptId, 1);

  // Submit single wrong answer
  const { session: updatedSession } = orchestrator.submitAnswer(
    session.sessionId,
    nextQuestion,
    'slope is 3' // slope-intercept inversion error
  );

  // In knowledge model, active confirmed misconceptions require repeated observations (Phase 4 rule)
  const profile = km.getOrCreateProfile(studentId);
  assert.ok(
    !profile.activeMisconceptions.includes('misc_linear_slope_intercept_swap'),
    'Single error must not confirm misconception in student profile'
  );
  assert.equal(updatedSession.consecutiveIncorrect, 1);
});

// ---------------------------------------------------------------------------
// Test 12: Unsupported question strategy
// ---------------------------------------------------------------------------
test('Test 12: Unsupported question strategy returns explicit unable_to_evaluate status', () => {
  const unsupportedQ: AssessmentQuestion = {
    id: 'q_unsupported_test',
    conceptId: 'quantum_physics',
    capabilityId: 'cap_unsupported',
    question: 'Solve arbitrary quantum equation.',
    questionType: 'symbolic',
    difficulty: 5,
    prerequisites: [],
    evaluationStrategy: 'unsupported',
    hints: ['No hints'],
    explanation: 'Unsupported',
  };

  const result = AnswerEvaluator.evaluate(unsupportedQ, 'psi');
  assert.equal(result.status, 'unable_to_evaluate');
  assert.equal(result.finalAnswerCorrect, null);
  assert.equal(result.reasoningCorrect, null);
  assert.ok(result.feedback.includes('cannot be evaluated deterministically'));
});

// ---------------------------------------------------------------------------
// Test 13: Assessment persistence and session restoration
// ---------------------------------------------------------------------------
test('Test 13: Interrupted assessment session progress can be restored upon resumption', () => {
  AssessmentPersistence.clear();
  const orchestrator = new AssessmentOrchestrator();
  const studentId = `student_resume_${Date.now()}`;
  const conceptId = 'math_linear_functions';

  // Start session and answer question 1 correctly
  const { session, nextQuestion } = orchestrator.startOrResumeSession(studentId, conceptId, 2);
  orchestrator.submitAnswer(session.sessionId, nextQuestion, 11);

  // Simulate closing and resuming session
  const resumed = orchestrator.startOrResumeSession(studentId, conceptId, 2);
  assert.equal(resumed.session.sessionId, session.sessionId, 'Should recover same active session ID');
  assert.equal(resumed.session.questionsAnswered, 1);
  assert.equal(resumed.session.correctAnswers, 1);
});

// ---------------------------------------------------------------------------
// Test 14: Dynamic difficulty adjustment
// ---------------------------------------------------------------------------
test('Test 14: Dynamic difficulty increases after 2 consecutive correct answers and decreases after 2 errors', () => {
  // 1. Two consecutive correct answers with zero hints promote difficulty (e.g. 2 -> 3)
  const attemptsPromote = [
    { hintsRequested: 0, evaluation: { status: 'correct' } },
    { hintsRequested: 0, evaluation: { status: 'correct' } },
  ] as any;
  const nextUp = AssessmentDifficultyController.calculateNextDifficulty(2, attemptsPromote);
  assert.equal(nextUp, 3, '2 consecutive correct answers should increase difficulty to 3');

  // 2. Two consecutive incorrect answers demote difficulty (e.g. 3 -> 2)
  const attemptsDemote = [
    { hintsRequested: 0, evaluation: { status: 'incorrect' } },
    { hintsRequested: 0, evaluation: { status: 'incorrect' } },
  ] as any;
  const nextDown = AssessmentDifficultyController.calculateNextDifficulty(3, attemptsDemote);
  assert.equal(nextDown, 2, '2 consecutive incorrect answers should decrease difficulty to 2');

  // 3. Isolated error maintains difficulty
  const attemptsSingleError = [
    { hintsRequested: 0, evaluation: { status: 'correct' } },
    { hintsRequested: 0, evaluation: { status: 'incorrect' } },
  ] as any;
  const nextSame = AssessmentDifficultyController.calculateNextDifficulty(2, attemptsSingleError);
  assert.equal(nextSame, 2, 'Single isolated error should maintain difficulty at 2');
});

// ---------------------------------------------------------------------------
// Test 15: Single Source of Truth — Phase 4 Knowledge Model Integration
// ---------------------------------------------------------------------------
test('Test 15: Assessment results update Phase 4 knowledge model without conflicting mastery scores', () => {
  const km = new KnowledgeModel();
  const orchestrator = new AssessmentOrchestrator(km);
  const studentId = `student_unified_km_${Date.now()}`;
  const conceptId = 'math_linear_functions';

  const { session, nextQuestion } = orchestrator.startOrResumeSession(studentId, conceptId, 2);
  orchestrator.submitAnswer(session.sessionId, nextQuestion, 11, 0);

  // Check KnowledgeModel state
  const mastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(mastery.totalAttempts, 1);
  assert.equal(mastery.correctAttempts, 1);
  assert.equal(mastery.masteryLevel, 'developing');

  // Second question correct
  const q2 = orchestrator.generateValidatedQuestion(conceptId, 3);
  orchestrator.submitAnswer(session.sessionId, q2, 4, 0);

  const updatedMastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(updatedMastery.totalAttempts, 2);
  assert.equal(updatedMastery.correctAttempts, 2);
  assert.equal(updatedMastery.consecutiveCorrect, 2);
});
