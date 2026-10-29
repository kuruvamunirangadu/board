/**
 * VisiOS — Milestone 8: AI-Powered Personalized Learning & Intelligent Tutoring Test Suite
 * Covers all 12 required Phase 8 verification scenarios:
 * 1. Beginner requests explanation of a new topic.
 * 2. Advanced student requests a formal explanation.
 * 3. Student repeatedly makes errors: changes teaching approach to error_focused or step_by_step.
 * 4. Progressive hint requests do NOT prematurely reveal the complete answer.
 * 5. Incorrect mathematical formula is caught by the validator.
 * 6. Unsupported visualization is rejected by the renderer validator.
 * 7. Inconsistent practice answer key is strictly rejected.
 * 8. Student with zero learning history receives calibrated baseline experience.
 * 9. Empty/malformed query returns clarification_needed without hallucination.
 * 10. Student requesting another student's private records is blocked with forbidden status.
 * 11. Stale or cross-student session context reuse is prevented.
 * 12. Integrated tutoring workflow updates Phase 4 knowledge model and Phase 7 event analytics.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PersonalizedTutorEngine } from '../features/tutoring/PersonalizedTutorEngine';
import { TutoringContextBuilder } from '../features/tutoring/TutoringContextBuilder';
import { AdaptiveExplanationService } from '../features/tutoring/AdaptiveExplanationService';
import { HintGenerationService } from '../features/tutoring/HintGenerationService';
import { PracticeGenerationService } from '../features/tutoring/PracticeGenerationService';
import { TutoringValidationService } from '../features/tutoring/TutoringValidationService';
import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';
import { LearningEventProcessor } from '../features/analytics/LearningEventProcessor';

// ---------------------------------------------------------------------------
// Test 1: Beginner requests explanation of a new topic
// ---------------------------------------------------------------------------
test('Test 1: Beginner requests explanation of binary search receives intuitive explanation and visual plan', async () => {
  const tutor = new PersonalizedTutorEngine();
  const res = await tutor.handleRequest({
    sessionId: 'sess-t1',
    studentId: 'student-beginner',
    query: 'Explain binary search',
    requestedDifficulty: 'beginner',
  });

  assert.equal(res.status, 'success');
  assert.equal(res.difficultyUsed, 'beginner');
  assert.ok(res.explanation);
  assert.equal(res.explanation.conceptId, 'cs_binary_search');
  assert.match(res.explanation.title, /binary search/i);
  assert.ok(res.explanation.steps && res.explanation.steps.length > 0);
  assert.ok(res.explanation.visualPlan);
  assert.equal(res.explanation.visualPlan.supported, true);
  assert.equal(res.explanation.visualPlan.rendererName, 'algorithm_array_tracer');
});

// ---------------------------------------------------------------------------
// Test 2: Advanced student requests a formal explanation
// ---------------------------------------------------------------------------
test('Test 2: Advanced student requesting formal explanation receives loop invariants and complexity proof', async () => {
  const tutor = new PersonalizedTutorEngine();
  const res = await tutor.handleRequest({
    sessionId: 'sess-t2',
    studentId: 'student-advanced',
    query: 'Formal proof and analysis of binary search',
    requestedStrategy: 'formal',
    requestedDifficulty: 'advanced',
  });

  assert.equal(res.status, 'success');
  assert.equal(res.strategyUsed, 'formal');
  assert.equal(res.difficultyUsed, 'advanced');
  assert.ok(res.explanation);
  assert.match(res.explanation.content, /Loop Invariant|O\(log n\)/i);
});

// ---------------------------------------------------------------------------
// Test 3: Student with repeated errors triggers adapted teaching approach
// ---------------------------------------------------------------------------
test('Test 3: Student with repeated errors triggers adapted teaching approach (error_focused or step_by_step)', async () => {
  const km = new KnowledgeModel();
  const studentId = 'student-struggling';
  const conceptId = 'math_linear_functions';

  // Seed 3 consecutive incorrect quiz responses
  for (let i = 0; i < 3; i++) {
    km.recordInteraction({
      studentId,
      conceptId,
      type: 'quiz_answer',
      isCorrect: false,
      hintsUsed: 1,
      timeSpentMs: 20000,
    });
  }

  const contextBuilder = new TutoringContextBuilder(km);
  const tutor = new PersonalizedTutorEngine(contextBuilder, undefined, km);

  const res = await tutor.handleRequest({
    sessionId: 'sess-t3',
    studentId,
    query: 'Help me understand y = 2x + 3',
    conceptId,
  });

  assert.equal(res.status, 'success');
  // Should shift from default 'simple' to 'step_by_step' or 'error_focused'
  assert.ok(
    res.strategyUsed === 'step_by_step' || res.strategyUsed === 'error_focused',
    `Expected adapted strategy, got: ${res.strategyUsed}`
  );
  assert.match(res.explanation?.title || '', /step-by-step|slope vs intercept/i);
});

// ---------------------------------------------------------------------------
// Test 4: Graduated hints do NOT prematurely reveal the solution
// ---------------------------------------------------------------------------
test('Test 4: Graduated hint engine delivers sequential guidance without prematurely revealing answer', () => {
  const hintService = new HintGenerationService();
  const sessionId = 'sess-hints';
  const exerciseId = 'ex-binary-search-1';
  const conceptId = 'cs_binary_search';

  // First hint: Conceptual question
  const h1 = hintService.getNextHint(sessionId, exerciseId, conceptId);
  assert.equal(h1.currentHintLevel, 1);
  assert.equal(h1.isSolutionRevealed, false);
  assert.match(h1.nextHintText || '', /sorted order/i);

  // Second hint: Strategy guidance
  const h2 = hintService.getNextHint(sessionId, exerciseId, conceptId);
  assert.equal(h2.currentHintLevel, 2);
  assert.equal(h2.isSolutionRevealed, false);
  assert.match(h2.nextHintText || '', /examine first|middle/i);

  // Third hint: Elimination half
  const h3 = hintService.getNextHint(sessionId, exerciseId, conceptId);
  assert.equal(h3.currentHintLevel, 3);
  assert.equal(h3.isSolutionRevealed, false);
  assert.match(h3.nextHintText || '', /eliminated/i);

  // Fourth hint: Final full solution reveal
  const h4 = hintService.getNextHint(sessionId, exerciseId, conceptId);
  assert.equal(h4.currentHintLevel, 4);
  assert.equal(h4.isSolutionRevealed, true);
});

// ---------------------------------------------------------------------------
// Test 5: Incorrect mathematical formula is caught by the validator
// ---------------------------------------------------------------------------
test('Test 5: Incomplete or trailing mathematical expression is caught and rejected by validator', () => {
  const invalidExplanation = AdaptiveExplanationService.generateExplanation('math_linear_functions', 'simple', 'beginner');
  // Inject trailing operator formula
  invalidExplanation.content = 'In this lesson we evaluate y = 2x +';

  const validation = TutoringValidationService.validateExplanation(invalidExplanation);
  assert.equal(validation.isValid, false);
  assert.equal(validation.checks.formulaValid, false);
  assert.ok(validation.errors.some((e) => e.includes('Formula syntax error')));
});

// ---------------------------------------------------------------------------
// Test 6: Unsupported visualization is rejected by the renderer validator
// ---------------------------------------------------------------------------
test('Test 6: Requesting an unsupported or invented renderer is blocked by the validator', () => {
  const invalidPlan = {
    supported: true,
    capabilityId: 'cap_linear_functions',
    rendererName: 'unsupported_quantum_quark_renderer_9000',
    visualType: 'unknown',
    props: {},
    steps: [],
  };

  const validation = TutoringValidationService.validateVisualPlan(invalidPlan);
  assert.equal(validation.isValid, false);
  assert.equal(validation.checks.rendererSupported, false);
  assert.ok(validation.errors.some((e) => e.includes('Unsupported renderer error')));
});

// ---------------------------------------------------------------------------
// Test 7: Inconsistent practice exercise answer key is rejected
// ---------------------------------------------------------------------------
test('Test 7: Practice exercise with an answer key missing from multiple choice options is rejected', () => {
  const invalidExercise = {
    id: 'prac-bad-1',
    conceptId: 'cs_binary_search',
    conceptTitle: 'Binary Search',
    type: 'multiple_choice' as const,
    difficulty: 'beginner' as const,
    difficultyNumber: 2,
    question: 'What is the time complexity of binary search?',
    options: ['O(n)', 'O(n^2)', 'O(1)'], // Missing O(log n)
    expectedAnswer: 'O(log n)',
    hints: ['Think of halving.'],
    solutionExplanation: 'It is logarithmic.',
    validationProcedure: 'exact_match',
  };

  const validation = TutoringValidationService.validatePracticeExercise(invalidExercise);
  assert.equal(validation.isValid, false);
  assert.equal(validation.checks.answerKeyConsistent, false);
  assert.ok(validation.errors.some((e) => e.includes('Inconsistent answer key')));
});

// ---------------------------------------------------------------------------
// Test 8: Student with no learning history receives calibrated baseline experience
// ---------------------------------------------------------------------------
test('Test 8: Student with zero previous learning history receives safe beginner baseline without errors', async () => {
  const km = new KnowledgeModel();
  const tutor = new PersonalizedTutorEngine(undefined, undefined, km);

  const res = await tutor.handleRequest({
    sessionId: 'sess-t8',
    studentId: 'student-brand-new',
    query: 'Show me linear functions',
    conceptId: 'math_linear_functions',
  });

  assert.equal(res.status, 'success');
  assert.equal(res.difficultyUsed, 'beginner');
  assert.equal(res.strategyUsed, 'simple');
  assert.ok(res.explanation);
  assert.equal(res.validation.isValid, true);
});

// ---------------------------------------------------------------------------
// Test 9: Empty or malformed query returns clarification_needed
// ---------------------------------------------------------------------------
test('Test 9: Empty or whitespace query returns clarification_needed without fabricating content', async () => {
  const tutor = new PersonalizedTutorEngine();
  const res = await tutor.handleRequest({
    sessionId: 'sess-t9',
    studentId: 'student-1',
    query: '   ',
  });

  assert.equal(res.status, 'clarification_needed');
  assert.match(res.message || '', /What topic or question/i);
});

// ---------------------------------------------------------------------------
// Test 10: Student requesting another student\'s private records is blocked
// ---------------------------------------------------------------------------
test('Test 10: Unauthorized cross-student privacy inspection is blocked with forbidden status', async () => {
  const tutor = new PersonalizedTutorEngine();
  const res = await tutor.handleRequest({
    sessionId: 'sess-t10',
    studentId: 'student-victim',
    requestingStudentId: 'student-eavesdropper', // unauthorized peer
    query: 'Explain binary search',
  });

  assert.equal(res.status, 'forbidden');
  assert.match(res.error || '', /Access Denied|not authorized/i);
});

// ---------------------------------------------------------------------------
// Test 11: Cross-session contamination prevention
// ---------------------------------------------------------------------------
test('Test 11: Cross-student session pollution is strictly prohibited', async () => {
  const tutor = new PersonalizedTutorEngine();
  const sessionId = 'shared-session-xyz';

  // Student A legitimately opens the session
  const res1 = await tutor.handleRequest({
    sessionId,
    studentId: 'student-alice',
    query: 'Binary search',
  });
  assert.equal(res1.status, 'success');

  // Student B attempts to hijack or reuse the same active session
  const res2 = await tutor.handleRequest({
    sessionId,
    studentId: 'student-bob', // different student
    query: 'Linear functions',
  });
  assert.equal(res2.status, 'forbidden');
  assert.match(res2.error || '', /Session belongs to another student/i);
});

// ---------------------------------------------------------------------------
// Test 12: Integrated tutoring workflow updates Phase 4 & Phase 7 state
// ---------------------------------------------------------------------------
test('Test 12: Integrated workflow: tutoring request ingests learning events and links with knowledge model', async () => {
  const km = new KnowledgeModel();
  const eventProcessor = new LearningEventProcessor();
  const tutor = new PersonalizedTutorEngine(undefined, undefined, km, eventProcessor);

  const studentId = 'student-integrated-8';
  const sessionId = 'sess-int-8';
  const conceptId = 'phys_newton_laws';

  const res = await tutor.handleRequest({
    sessionId,
    studentId,
    conceptId,
    query: 'Explain F = ma with worked example',
    requestedStrategy: 'worked_example',
    requestedDifficulty: 'intermediate',
  });

  assert.equal(res.status, 'success');
  assert.equal(res.strategyUsed, 'worked_example');

  // Verify learning event was ingested into Phase 7 event processor
  const events = eventProcessor.getLearnerEvents(studentId);
  assert.ok(events.length >= 1);
  assert.equal(events[0].conceptId, conceptId);
  assert.equal(events[0].eventType, 'concept_viewed');

  // Verify practice exercise was generated with valid checks
  assert.ok(res.practiceExercise);
  assert.equal(res.practiceExercise.conceptId, conceptId);
  assert.equal(res.practiceExercise.expectedAnswer, 4);

  // Request a hint for the exercise and verify hint event is ingested
  const hintRes = tutor.requestHint(sessionId, res.practiceExercise.id, conceptId);
  assert.equal(hintRes.status, 'success');
  assert.equal(hintRes.hintProgress?.currentHintLevel, 1);

  const updatedEvents = eventProcessor.getLearnerEvents(studentId);
  const hintEvents = updatedEvents.filter((e) => e.eventType === 'hint_requested');
  assert.equal(hintEvents.length, 1);
});
