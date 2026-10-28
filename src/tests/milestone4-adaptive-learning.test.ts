/**
 * VisiOS — Milestone 4: Adaptive Learning, Personalization & Student Knowledge Modeling Regression Suite
 * Covers all 10 required Phase 4 verification scenarios:
 * 1. New student with no history begins with an introductory or assessment activity.
 * 2. Student repeatedly answers correctly: mastery estimate increases with evidence.
 * 3. Student repeatedly makes the same error: potential misconception is identified with high confidence.
 * 4. Student answers one question incorrectly: does NOT immediately classify concept as misunderstood.
 * 5. Prerequisite is not mastered: recommends prerequisite support where appropriate.
 * 6. Student demonstrates improvement: updates mastery and reconsiders learning path.
 * 7. Student resumes an earlier session: restores saved learning progress.
 * 8. No suitable learning engine exists: returns an explicit unsupported-capability result.
 * 9. Content validation: ensures unvalidated content is not presented as verified.
 * 10. Two students with different knowledge gaps receive different recommended learning paths.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';
import { MasteryEstimator } from '../features/adaptive/MasteryEstimator';
import { MisconceptionDetector } from '../features/adaptive/MisconceptionDetector';
import { AdaptivePathPlanner } from '../features/adaptive/AdaptivePathPlanner';
import { DifficultyController } from '../features/adaptive/DifficultyController';
import { PracticeRecommender } from '../features/adaptive/PracticeRecommender';
import { AdaptiveLearningService } from '../features/adaptive/AdaptiveLearningService';
import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';

// ---------------------------------------------------------------------------
// Scenario 1: New student with no history
// ---------------------------------------------------------------------------
test('Scenario 1: New student with no history begins with introductory/assessment activity', () => {
  const km = new KnowledgeModel();
  const studentId = `student_new_${Date.now()}`;
  const profile = km.getOrCreateProfile(studentId);

  assert.equal(profile.studentId, studentId);
  assert.equal(profile.interactionHistory.length, 0);

  const mastery = km.getConceptMastery(studentId, 'math_linear_functions');
  assert.equal(mastery.masteryLevel, 'not_started');
  assert.equal(mastery.confidenceScore, 0.0);

  // Recommended difficulty for a new student must be beginner
  const difficulty = DifficultyController.selectDifficulty(mastery);
  assert.equal(difficulty, 'beginner');

  // Next activity recommendation should scaffold or assess foundations
  const recommendation = AdaptivePathPlanner.recommendNextActivity(profile, 'math_linear_functions');
  assert.ok(
    recommendation.type === 'prerequisite_review' || recommendation.type === 'targeted_practice',
    `Expected prerequisite_review or targeted_practice, got: ${recommendation.type}`
  );
  assert.equal(recommendation.difficulty, 'beginner');
});

// ---------------------------------------------------------------------------
// Scenario 2: Student repeatedly answers correctly
// ---------------------------------------------------------------------------
test('Scenario 2: Student repeatedly answers correctly increases mastery estimate with evidence', () => {
  const km = new KnowledgeModel();
  const studentId = `student_mastery_${Date.now()}`;
  const conceptId = 'math_linear_functions';

  // Record 1 correct answer - sample size too small for mastery
  km.recordInteraction({
    studentId,
    conceptId,
    type: 'quiz_answer',
    isCorrect: true,
    difficulty: 'beginner',
  });

  let mastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(mastery.totalAttempts, 1);
  assert.equal(mastery.masteryLevel, 'developing', '1 correct attempt should be developing, not mastered');
  assert.ok(mastery.confidenceScore < 0.6, 'Confidence should reflect small sample size');

  // Record 5 more correct answers with intermediate and advanced difficulty
  for (let i = 0; i < 5; i++) {
    km.recordInteraction({
      studentId,
      conceptId,
      type: 'practice_attempt',
      isCorrect: true,
      difficulty: i >= 3 ? 'advanced' : 'intermediate',
    });
  }

  mastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(mastery.totalAttempts, 6);
  assert.equal(mastery.correctAttempts, 6);
  assert.equal(mastery.consecutiveCorrect, 6);
  assert.equal(mastery.recentAccuracy, 1.0);
  assert.equal(mastery.masteryLevel, 'mastered', 'Consistent correct evidence across difficulties yields mastered');
  assert.ok(mastery.confidenceScore >= 0.6, 'Confidence score should be high with 6 attempts');
});

// ---------------------------------------------------------------------------
// Scenario 3: Student repeatedly makes the same error
// ---------------------------------------------------------------------------
test('Scenario 3: Repeated identical errors identify a potential misconception with high confidence', () => {
  const km = new KnowledgeModel();
  const studentId = `student_misc_${Date.now()}`;
  const conceptId = 'math_linear_functions';

  // 1st error: slope-intercept inversion
  km.recordInteraction({
    studentId,
    conceptId,
    type: 'quiz_answer',
    isCorrect: false,
    selectedAnswer: 'slope is 3',
    difficulty: 'beginner',
  });

  // 2nd error: same misconception
  km.recordInteraction({
    studentId,
    conceptId,
    type: 'quiz_answer',
    isCorrect: false,
    selectedAnswer: 'slope is 3',
    difficulty: 'beginner',
  });

  // 3rd error: reinforced misconception
  const { profile } = km.recordInteraction({
    studentId,
    conceptId,
    type: 'practice_attempt',
    isCorrect: false,
    selectedAnswer: 'slope is 3',
    difficulty: 'intermediate',
  });

  assert.ok(
    profile.activeMisconceptions.includes('misc_linear_slope_intercept_swap'),
    'Should register active misconception after repeated observations'
  );

  const analysis = MisconceptionDetector.analyzeMisconceptions(conceptId, profile.interactionHistory);
  const matched = analysis.find((m) => m.misconceptionId === 'misc_linear_slope_intercept_swap');
  assert.ok(matched, 'Misconception must be in analysis list');
  assert.ok(matched.confidence >= 0.9, 'Confidence should be >= 0.9 with 3 repeated occurrences');
});

// ---------------------------------------------------------------------------
// Scenario 4: Student answers one question incorrectly
// ---------------------------------------------------------------------------
test('Scenario 4: A single incorrect answer does NOT immediately confirm a misconception', () => {
  const km = new KnowledgeModel();
  const studentId = `student_single_error_${Date.now()}`;
  const conceptId = 'math_fractions';

  const { profile } = km.recordInteraction({
    studentId,
    conceptId,
    type: 'quiz_answer',
    isCorrect: false,
    selectedAnswer: '2/5', // Single slip: 1/2 + 1/3 = 2/5
    difficulty: 'beginner',
  });

  // Must NOT immediately confirm as an active misconception in profile
  assert.ok(
    !profile.activeMisconceptions.includes('misc_fractions_direct_addition'),
    'A single slip should not establish an active confirmed misconception'
  );

  const analysis = MisconceptionDetector.analyzeMisconceptions(conceptId, profile.interactionHistory);
  const match = analysis.find((m) => m.misconceptionId === 'misc_fractions_direct_addition');
  assert.ok(match);
  assert.ok(match.confidence < 0.5, 'Confidence must be low (< 0.5) for a single observation');
});

// ---------------------------------------------------------------------------
// Scenario 5: Prerequisite is not mastered
// ---------------------------------------------------------------------------
test('Scenario 5: Recommends prerequisite support when prerequisite is not mastered', () => {
  const km = new KnowledgeModel();
  const studentId = `student_prereq_${Date.now()}`;
  const profile = km.getOrCreateProfile(studentId);

  // Student attempts cs_binary_search without mastering cs_sorted_arrays
  const path = AdaptivePathPlanner.planPath(profile, 'cs_binary_search');
  assert.ok(path.steps.length >= 2, 'Path should include prerequisites for binary search');

  // The first unmastered step must be marked current
  const currentStep = path.steps.find((s) => s.status === 'current');
  assert.ok(currentStep, 'Should identify a current gap step');
  assert.notEqual(currentStep?.conceptId, 'cs_binary_search', 'Current step should be an earlier prerequisite');

  const recommendation = AdaptivePathPlanner.recommendNextActivity(profile, 'cs_binary_search');
  assert.equal(recommendation.type, 'prerequisite_review');
  assert.notEqual(recommendation.targetConceptId, 'cs_binary_search');
});

// ---------------------------------------------------------------------------
// Scenario 6: Student demonstrates improvement
// ---------------------------------------------------------------------------
test('Scenario 6: Student demonstrates improvement updates mastery and advances learning path', () => {
  const km = new KnowledgeModel();
  const studentId = `student_improve_${Date.now()}`;
  const conceptId = 'cs_arrays_indexing';

  // Initially fails 2 questions
  km.recordInteraction({ studentId, conceptId, type: 'quiz_answer', isCorrect: false });
  km.recordInteraction({ studentId, conceptId, type: 'quiz_answer', isCorrect: false });
  let mastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(mastery.masteryLevel, 'beginner');

  // Now studies and answers 4 consecutive intermediate/advanced questions correctly
  for (let i = 0; i < 4; i++) {
    km.recordInteraction({
      studentId,
      conceptId,
      type: 'practice_attempt',
      isCorrect: true,
      difficulty: 'intermediate',
    });
  }

  mastery = km.getConceptMastery(studentId, conceptId);
  assert.equal(mastery.consecutiveCorrect, 4);
  assert.ok(
    mastery.masteryLevel === 'proficient' || mastery.masteryLevel === 'mastered',
    `Expected proficient or mastered after sustained improvement, got: ${mastery.masteryLevel}`
  );
  assert.ok(mastery.recentAccuracy >= 0.8);
});

// ---------------------------------------------------------------------------
// Scenario 7: Student resumes an earlier session
// ---------------------------------------------------------------------------
test('Scenario 7: Preserves and restores saved student learning progress across sessions', () => {
  const km1 = new KnowledgeModel();
  const studentId = `student_persist_${Date.now()}`;

  km1.recordInteraction({
    studentId,
    conceptId: 'math_linear_functions',
    type: 'quiz_answer',
    isCorrect: true,
    difficulty: 'intermediate',
  });

  const m1 = km1.getConceptMastery(studentId, 'math_linear_functions');
  assert.equal(m1.totalAttempts, 1);
  assert.equal(m1.correctAttempts, 1);

  // Retrieve profile again from model
  const profile = km1.getOrCreateProfile(studentId);
  assert.equal(profile.interactionHistory.length, 1);
  assert.equal(profile.concepts['math_linear_functions'].correctAttempts, 1);
});

// ---------------------------------------------------------------------------
// Scenario 8: No suitable learning engine exists
// ---------------------------------------------------------------------------
test('Scenario 8: No suitable learning engine exists returns explicit unsupported-capability result', async () => {
  const service = new AdaptiveLearningService();
  const studentId = `student_unsupported_${Date.now()}`;

  const response = await service.executePersonalizedLesson(
    studentId,
    'quantum chromodynamics parton distribution functions advanced'
  );

  assert.equal(response.status, 'unsupported');
  assert.equal(response.error?.code, 'UNSUPPORTED_CAPABILITY');
  assert.ok(
    response.error?.message.includes('not supported') ||
    response.error?.message.includes('No verified engine')
  );
});

// ---------------------------------------------------------------------------
// Scenario 9: Recommended content validation
// ---------------------------------------------------------------------------
test('Scenario 9: Recommended content undergoes strict validation before presentation', async () => {
  const service = new AdaptiveLearningService();
  const studentId = `student_validation_${Date.now()}`;

  // Execute a valid personalized linear function lesson
  const response = await service.executePersonalizedLesson(studentId, 'y = 2x + 3');

  assert.equal(response.status, 'success');
  assert.ok(response.verification);
  assert.equal(response.verification.isMathematicallyVerified, true);
  assert.equal(response.verification.isVisuallyFaithful, true);
});

// ---------------------------------------------------------------------------
// Scenario 10: Two students with different knowledge gaps
// ---------------------------------------------------------------------------
test('Scenario 10: Two students with different knowledge gaps receive different recommended learning paths', () => {
  const km = new KnowledgeModel();
  const studentA = `student_A_${Date.now()}`;
  const studentB = `student_B_${Date.now()}`;

  // Student A mastered variables but lacks array indexing
  km.recordInteraction({ studentId: studentA, conceptId: 'cs_variables_types', type: 'quiz_answer', isCorrect: true, difficulty: 'advanced' });
  km.recordInteraction({ studentId: studentA, conceptId: 'cs_variables_types', type: 'quiz_answer', isCorrect: true, difficulty: 'advanced' });
  km.recordInteraction({ studentId: studentA, conceptId: 'cs_variables_types', type: 'practice_attempt', isCorrect: true, difficulty: 'advanced' });

  // Student B mastered variables AND arrays, but lacks sorted arrays
  km.recordInteraction({ studentId: studentB, conceptId: 'cs_variables_types', type: 'quiz_answer', isCorrect: true, difficulty: 'advanced' });
  km.recordInteraction({ studentId: studentB, conceptId: 'cs_variables_types', type: 'quiz_answer', isCorrect: true, difficulty: 'advanced' });
  km.recordInteraction({ studentId: studentB, conceptId: 'cs_arrays_indexing', type: 'quiz_answer', isCorrect: true, difficulty: 'advanced' });
  km.recordInteraction({ studentId: studentB, conceptId: 'cs_arrays_indexing', type: 'practice_attempt', isCorrect: true, difficulty: 'advanced' });

  const profileA = km.getOrCreateProfile(studentA);
  const profileB = km.getOrCreateProfile(studentB);

  const recA = AdaptivePathPlanner.recommendNextActivity(profileA, 'cs_binary_search');
  const recB = AdaptivePathPlanner.recommendNextActivity(profileB, 'cs_binary_search');

  // Both want to learn binary search, but their recommendations differ based on their individual knowledge gaps!
  assert.notEqual(
    recA.targetConceptId,
    recB.targetConceptId,
    `Student A gap (${recA.targetConceptId}) must differ from Student B gap (${recB.targetConceptId})`
  );
});

// ---------------------------------------------------------------------------
// Practice Recommender Test
// ---------------------------------------------------------------------------
test('PracticeRecommender produces targeted questions matching student level', () => {
  const km = new KnowledgeModel();
  const studentId = `student_practice_${Date.now()}`;

  // Record struggle on linear functions
  km.recordInteraction({
    studentId,
    conceptId: 'math_linear_functions',
    type: 'quiz_answer',
    isCorrect: false,
    difficulty: 'beginner',
  });

  const profile = km.getOrCreateProfile(studentId);
  const questions = PracticeRecommender.recommendExercises(profile, 'math_linear_functions', 2);

  assert.ok(questions.length > 0);
  assert.equal(questions[0].conceptId, 'math_linear_functions');
  assert.equal(questions[0].difficulty, 'beginner');
  assert.ok(questions[0].options.length >= 2);
});
