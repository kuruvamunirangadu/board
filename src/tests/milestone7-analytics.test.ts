/**
 * VisiOS — Milestone 7: Intelligent Learning Analytics & Progress Insights Test Suite
 * Covers all 12 required Phase 7 verification scenarios:
 * 1. Duplicate event ingestion (rejected, metrics not inflated).
 * 2. Invalid event payload (rejected with validation error).
 * 3. Out-of-order events (sorted deterministically by timestamp).
 * 4. Empty learning history (returns empty state, no NaN).
 * 5. Repeated incorrect answers (flags concept as needs_review without asserting false certainty).
 * 6. Successful later assessment (transitions concept from needs_review to demonstrated_understanding).
 * 7. Prerequisite not mastered (insight recommends reviewing unmastered foundational concept).
 * 8. Shared/collaborative activity completed (does not inflate individual exercise accuracy).
 * 9. Unauthorized analytics request (returns Forbidden / blocked for non-instructor roles).
 * 10. Deleted/missing source record (safe fallback without crashing).
 * 11. Metrics agree with underlying event records.
 * 12. Full integration with Phase 4 KnowledgeModel and Phase 5 AssessmentOrchestrator.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LearningEventProcessor, LearningEvent } from '../features/analytics/LearningEventProcessor';
import { LearningMetricsService } from '../features/analytics/LearningMetricsService';
import { TopicProgressService } from '../features/analytics/TopicProgressService';
import { LearningInsightsService } from '../features/analytics/LearningInsightsService';
import { analyticsService } from '../features/analytics/analytics-service';
import { analyticsStore } from '../features/analytics/analytics-store';
import { AssessmentAttemptRecord } from '../types/analytics';
import { KnowledgeModel } from '../features/adaptive/KnowledgeModel';
import { AssessmentOrchestrator } from '../features/assessment/AssessmentOrchestrator';
import { TRUSTED_CONCEPT_REGISTRY } from '../features/learning/ConceptDependencyGraph';

function createAttempt(partial: Partial<AssessmentAttemptRecord> & { id: string; learnerId: string; conceptId: string; questionId: string; score: number; isCorrect: boolean; timestamp: number }): AssessmentAttemptRecord {
  return {
    subjectId: 'mathematics',
    selectedOption: 0,
    maxScore: 1.0,
    assessmentVersion: 'v1.0',
    ...partial,
  };
}

// ---------------------------------------------------------------------------
// Test 1: Duplicate event ingestion
// ---------------------------------------------------------------------------
test('Test 1: Duplicate event ingestion is rejected and does not inflate metrics', () => {
  const processor = new LearningEventProcessor();
  const event: LearningEvent = {
    eventId: 'evt-dup-001',
    sessionId: 'sess-01',
    learnerId: 'learner-dup',
    eventType: 'exercise_completed',
    timestamp: '2026-03-01T10:00:00Z',
    conceptId: 'math_linear_functions',
  };

  const res1 = processor.ingest(event);
  assert.equal(res1.accepted, true, 'First event ingestion should be accepted');
  assert.equal(res1.isDuplicate, undefined);

  // Attempt to ingest identical event ID
  const res2 = processor.ingest(event);
  assert.equal(res2.accepted, false, 'Duplicate event ingestion must be rejected');
  assert.equal(res2.isDuplicate, true, 'Result must indicate duplicate');

  const learnerEvents = processor.getLearnerEvents('learner-dup');
  assert.equal(learnerEvents.length, 1, 'Only one event should exist in storage');

  // Verify metrics computation is not doubled
  const metrics = LearningMetricsService.computeMetrics('learner-dup', learnerEvents, []);
  assert.equal(metrics.totalEventsCount, 1, 'Event count in metrics must not be inflated');
});

// ---------------------------------------------------------------------------
// Test 2: Invalid event payload validation
// ---------------------------------------------------------------------------
test('Test 2: Invalid event payload is rejected with explicit validation error', () => {
  const processor = new LearningEventProcessor();

  const invalid1 = processor.ingest(null);
  assert.equal(invalid1.accepted, false);
  assert.match(invalid1.error || '', /non-null object/i);

  const invalid2 = processor.ingest({ eventId: '', learnerId: 'learner-1', sessionId: 's1' });
  assert.equal(invalid2.accepted, false);
  assert.match(invalid2.error || '', /eventId/i);

  const invalid3 = processor.ingest({ eventId: 'evt-valid', learnerId: '', sessionId: 's1' });
  assert.equal(invalid3.accepted, false);
  assert.match(invalid3.error || '', /learnerId/i);

  const invalid4 = processor.ingest({ eventId: 'evt-valid', learnerId: 'learner-1', sessionId: '' });
  assert.equal(invalid4.accepted, false);
  assert.match(invalid4.error || '', /sessionId/i);
});

// ---------------------------------------------------------------------------
// Test 3: Out-of-order events sorting
// ---------------------------------------------------------------------------
test('Test 3: Events arriving out of order are sorted deterministically by timestamp', () => {
  const processor = new LearningEventProcessor();
  const learnerId = 'learner-order';

  const t1 = '2026-03-01T10:00:00Z';
  const t2 = '2026-03-01T11:00:00Z';
  const t3 = '2026-03-01T12:00:00Z';

  // Ingest in mixed order: t3, then t1, then t2
  processor.ingest({
    eventId: 'evt-3',
    sessionId: 'sess-1',
    learnerId,
    eventType: 'exercise_completed',
    timestamp: t3,
  });

  processor.ingest({
    eventId: 'evt-1',
    sessionId: 'sess-1',
    learnerId,
    eventType: 'lesson_started',
    timestamp: t1,
  });

  processor.ingest({
    eventId: 'evt-2',
    sessionId: 'sess-1',
    learnerId,
    eventType: 'concept_viewed',
    timestamp: t2,
  });

  const ordered = processor.getLearnerEvents(learnerId);
  assert.equal(ordered.length, 3);
  assert.equal(ordered[0].eventId, 'evt-1');
  assert.equal(ordered[1].eventId, 'evt-2');
  assert.equal(ordered[2].eventId, 'evt-3');
});

// ---------------------------------------------------------------------------
// Test 4: Empty learning history
// ---------------------------------------------------------------------------
test('Test 4: Empty learning history returns clean zeroed state without NaN values', () => {
  const learnerId = 'learner-empty';
  const metrics = LearningMetricsService.computeMetrics(learnerId, [], []);

  assert.equal(metrics.learnerId, learnerId);
  assert.equal(metrics.totalEventsCount, 0);
  assert.equal(metrics.exerciseAccuracy, null);
  assert.equal(metrics.exerciseAccuracyFormatted, 'N/A');
  assert.equal(metrics.firstAttemptAccuracy, null);
  assert.equal(metrics.firstAttemptAccuracyFormatted, 'N/A');
  assert.equal(metrics.coveragePercentage, 0);
  assert.equal(metrics.hintDependencyRatio, 0);
  assert.equal(metrics.isSampleAdequate, false);
  assert.equal(Number.isNaN(metrics.coveragePercentage), false);

  const progress = TopicProgressService.computeTopicProgress([]);
  assert.ok(progress.length > 0, 'Should list registered concepts');
  for (const item of progress) {
    assert.equal(item.status, 'not_started');
    assert.equal(item.totalAttempts, 0);
    assert.equal(item.accuracy, null);
    assert.equal(item.accuracyFormatted, 'N/A');
    assert.equal(Number.isNaN(item.accuracy), false);
  }
});

// ---------------------------------------------------------------------------
// Test 5: Repeated incorrect answers flag concept as needs_review
// ---------------------------------------------------------------------------
test('Test 5: Repeated incorrect answers flag concept as needs_review without claiming false certainty', () => {
  const learnerId = 'learner-struggle';
  const attempts: AssessmentAttemptRecord[] = [
    createAttempt({
      id: 'att-1',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q1',
      score: 0.2,
      isCorrect: false,
      timestamp: Date.now() - 3000,
    }),
    createAttempt({
      id: 'att-2',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q2',
      score: 0.3,
      isCorrect: false,
      timestamp: Date.now() - 2000,
    }),
    createAttempt({
      id: 'att-3',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q3',
      score: 0.1,
      isCorrect: false,
      timestamp: Date.now() - 1000,
    }),
  ];

  const progress = TopicProgressService.computeTopicProgress(attempts);
  const linearProg = progress.find((p) => p.conceptId === 'math_linear_functions');

  assert.ok(linearProg, 'Linear functions item must exist');
  assert.equal(linearProg.status, 'needs_review');
  assert.equal(linearProg.consecutiveErrors, 3);
  assert.match(linearProg.rationale, /consecutive errors|knowledge gap/i);
});

// ---------------------------------------------------------------------------
// Test 6: Successful later assessment transitions to demonstrated_understanding
// ---------------------------------------------------------------------------
test('Test 6: Successful later assessment transitions concept from needs_review to demonstrated_understanding', () => {
  const learnerId = 'learner-recovering';
  const attempts: AssessmentAttemptRecord[] = [
    // Past struggle
    createAttempt({
      id: 'att-1',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q1',
      score: 0.2,
      isCorrect: false,
      timestamp: Date.now() - 5000,
    }),
    // Strong recovery with consecutive mastery
    createAttempt({
      id: 'att-2',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q2',
      score: 1.0,
      isCorrect: true,
      timestamp: Date.now() - 4000,
    }),
    createAttempt({
      id: 'att-3',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q3',
      score: 1.0,
      isCorrect: true,
      timestamp: Date.now() - 3000,
    }),
    createAttempt({
      id: 'att-4',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q4',
      score: 1.0,
      isCorrect: true,
      timestamp: Date.now() - 2000,
    }),
    createAttempt({
      id: 'att-5',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'q5',
      score: 0.95,
      isCorrect: true,
      timestamp: Date.now() - 1000,
    }),
  ];

  const progress = TopicProgressService.computeTopicProgress(attempts);
  const linearProg = progress.find((p) => p.conceptId === 'math_linear_functions');

  assert.ok(linearProg);
  assert.equal(linearProg.status, 'demonstrated_understanding');
  assert.equal(linearProg.consecutiveErrors, 0);
  assert.match(linearProg.rationale, /demonstrated solid understanding/i);
});

// ---------------------------------------------------------------------------
// Test 7: Prerequisite not mastered insight
// ---------------------------------------------------------------------------
test('Test 7: Insight engine detects unmastered prerequisite and recommends review', () => {
  const learnerId = 'learner-prereq';

  // Learner struggles on math_linear_functions (which requires math_cartesian_plane and math_linear_equations)
  const attempts: AssessmentAttemptRecord[] = [
    createAttempt({
      id: 'att-lin-1',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'lin-1',
      score: 0.3,
      isCorrect: false,
      timestamp: Date.now() - 1000,
    }),
    createAttempt({
      id: 'att-lin-2',
      learnerId,
      conceptId: 'math_linear_functions',
      subjectId: 'mathematics',
      questionId: 'lin-2',
      score: 0.2,
      isCorrect: false,
      timestamp: Date.now(),
    }),
  ];

  // math_cartesian_plane is not started (not in attempts)
  const progress = TopicProgressService.computeTopicProgress(attempts);
  const metrics = LearningMetricsService.computeMetrics(learnerId, [], attempts);
  const insights = LearningInsightsService.generateInsights(metrics, progress);

  const prereqInsight = insights.find((ins) => ins.type === 'prerequisite_gap');
  assert.ok(prereqInsight, 'Must generate prerequisite_gap insight');
  assert.equal(prereqInsight.priority, 'high');
  assert.ok(['math_cartesian_plane', 'math_linear_equations'].includes(prereqInsight.conceptId));
  assert.match(prereqInsight.suggestedAction, /Linear Equations|Cartesian/i);
});

// ---------------------------------------------------------------------------
// Test 8: Shared/collaborative activity does not inflate individual accuracy
// ---------------------------------------------------------------------------
test('Test 8: Collaborative activities do not artificially inflate individual exercise accuracy', () => {
  const learnerId = 'learner-collab';
  const events: LearningEvent[] = [
    {
      eventId: 'evt-c1',
      sessionId: 'sess-c',
      learnerId,
      eventType: 'collaborative_session_joined',
      timestamp: '2026-03-01T10:00:00Z',
      isCollaborative: true,
    },
    {
      eventId: 'evt-c2',
      sessionId: 'sess-c',
      learnerId,
      eventType: 'collaborative_action',
      timestamp: '2026-03-01T10:05:00Z',
      isCollaborative: true,
    },
    {
      eventId: 'evt-c3',
      sessionId: 'sess-c',
      learnerId,
      eventType: 'exercise_completed',
      timestamp: '2026-03-01T10:10:00Z',
      isCollaborative: true, // Completed in team mode
    },
  ];

  // Learner has 0 individual assessment attempts
  const metrics = LearningMetricsService.computeMetrics(learnerId, events, []);

  // Exercise accuracy must remain null or 0 because collaborative activities are not solo proof of mastery
  assert.equal(metrics.exerciseAccuracy, null);
  assert.equal(metrics.exerciseAccuracyFormatted, 'N/A');
  assert.equal(metrics.assessedConceptsCount, 0);
  assert.equal(metrics.totalEventsCount, 3);
});

// ---------------------------------------------------------------------------
// Test 9: Unauthorized analytics request blocked
// ---------------------------------------------------------------------------
test('Test 9: Unauthorized request for instructor cohort analytics is blocked', () => {
  // Directly invoking with unauthorized role 'student' or 'participant'
  assert.throws(
    () => {
      analyticsService.getInstructorClassAnalytics('student', 'class-1', 'physics');
    },
    {
      message: /unauthorized|require.*instructor/i,
    }
  );

  assert.throws(
    () => {
      analyticsService.getInstructorClassAnalytics('participant', 'class-1', 'physics');
    },
    {
      message: /unauthorized|require.*instructor/i,
    }
  );

  // Authorized instructor role succeeds
  const instData = analyticsService.getInstructorClassAnalytics('instructor', 'class-1', 'physics');
  assert.ok(instData);
  assert.equal(instData.classId, 'class-1');
});

// ---------------------------------------------------------------------------
// Test 10: Deleted or missing source record gracefully handled
// ---------------------------------------------------------------------------
test('Test 10: Missing or unknown concept references do not crash progress calculation', () => {
  const learnerId = 'learner-ghost';
  const orphanedAttempts: AssessmentAttemptRecord[] = [
    createAttempt({
      id: 'att-ghost',
      learnerId,
      conceptId: 'non_existent_concept_xyz_999',
      subjectId: 'unknown_subject',
      questionId: 'q-ghost',
      score: 0.8,
      isCorrect: true,
      timestamp: Date.now(),
    }),
  ];

  // Must not throw an unhandled exception
  const progress = TopicProgressService.computeTopicProgress(orphanedAttempts);
  assert.ok(Array.isArray(progress));

  const metrics = LearningMetricsService.computeMetrics(learnerId, [], orphanedAttempts);
  assert.ok(metrics);
  assert.equal(metrics.assessedConceptsCount, 1);
});

// ---------------------------------------------------------------------------
// Test 11: Metrics agree mathematically with underlying event records
// ---------------------------------------------------------------------------
test('Test 11: Computed metrics agree with underlying records', () => {
  const learnerId = 'learner-math-agree';
  const attempts: AssessmentAttemptRecord[] = [
    createAttempt({ id: '1', learnerId, conceptId: 'c1', questionId: 'q1', score: 1.0, isCorrect: true, timestamp: 1 }),
    createAttempt({ id: '2', learnerId, conceptId: 'c1', questionId: 'q2', score: 1.0, isCorrect: true, timestamp: 2 }),
    createAttempt({ id: '3', learnerId, conceptId: 'c1', questionId: 'q3', score: 1.0, isCorrect: true, timestamp: 3 }),
    createAttempt({ id: '4', learnerId, conceptId: 'c1', questionId: 'q4', score: 0.0, isCorrect: false, timestamp: 4 }),
  ];

  const events: LearningEvent[] = [
    { eventId: 'e1', sessionId: 's1', learnerId, eventType: 'hint_requested', timestamp: '2026-03-01T10:00:00Z' },
    { eventId: 'e2', sessionId: 's1', learnerId, eventType: 'hint_requested', timestamp: '2026-03-01T10:01:00Z' },
  ];

  const metrics = LearningMetricsService.computeMetrics(learnerId, events, attempts, 10);

  // 3 out of 4 correct = 75%
  assert.equal(metrics.exerciseAccuracy, 75);
  assert.equal(metrics.exerciseAccuracyFormatted, '75%');

  // 2 hints across 4 attempts = 0.5 hints per attempt
  assert.equal(metrics.hintDependencyRatio, 0.5);

  // Coverage: 1 concept assessed out of 10 = 10%
  assert.equal(metrics.coveragePercentage, 10);
});

// ---------------------------------------------------------------------------
// Test 12: Full integration with Phase 4 KnowledgeModel and Phase 5 AssessmentOrchestrator
// ---------------------------------------------------------------------------
test('Test 12: Integrated workflow: assessment response updates knowledge model and analytics coherently', () => {
  const learnerId = 'learner-integrated';
  const conceptId = 'math_linear_functions';

  // 1. Initialize Phase 4 KnowledgeModel and Phase 5 Orchestrator
  const km = new KnowledgeModel();
  const initialMastery = km.getConceptMastery(learnerId, conceptId);
  assert.equal(initialMastery.totalAttempts, 0);
  assert.equal(initialMastery.masteryLevel, 'not_started');

  const orchestrator = new AssessmentOrchestrator(km);
  const { session, nextQuestion } = orchestrator.startOrResumeSession(learnerId, conceptId, 1);
  assert.ok(session);
  assert.ok(nextQuestion);
  assert.ok(nextQuestion.expectedAnswer !== undefined);

  // 2. Submit correct answer through Phase 5 Orchestrator
  const { evaluation } = orchestrator.submitAnswer(session.sessionId, nextQuestion, nextQuestion.expectedAnswer);
  assert.equal(evaluation.status, 'correct');
  assert.equal(evaluation.finalAnswerCorrect, true);

  // 3. KnowledgeModel is updated directly by Orchestrator
  const updatedMastery = km.getConceptMastery(learnerId, conceptId);
  assert.equal(updatedMastery.totalAttempts, 1);
  assert.equal(updatedMastery.correctAttempts, 1);
  assert.ok(updatedMastery.masteryLevel !== 'not_started', 'KnowledgeModel mastery level should advance');

  // 4. Ingest event and attempt into Analytics
  const processor = new LearningEventProcessor();
  processor.ingest({
    eventId: `evt-sess-${session.sessionId}`,
    sessionId: session.sessionId,
    learnerId,
    eventType: 'assessment_completed',
    conceptId,
    timestamp: new Date().toISOString(),
    metadata: { score: evaluation.score },
  });

  const attempt: AssessmentAttemptRecord = createAttempt({
    id: `att-${session.sessionId}`,
    learnerId,
    conceptId,
    subjectId: 'mathematics',
    questionId: nextQuestion.id,
    score: evaluation.score,
    isCorrect: evaluation.status === 'correct',
    timestamp: Date.now(),
  });

  const progress = TopicProgressService.computeTopicProgress([attempt]);
  const conceptProgress = progress.find((p) => p.conceptId === conceptId);
  assert.ok(conceptProgress);
  assert.ok(
    conceptProgress.status === 'learning' || conceptProgress.status === 'developing',
    `Expected status learning or developing, got: ${conceptProgress.status}`
  );

  // 5. Generate Insights
  const metrics = LearningMetricsService.computeMetrics(learnerId, processor.getLearnerEvents(learnerId), [attempt]);
  const insights = LearningInsightsService.generateInsights(metrics, progress);
  assert.ok(Array.isArray(insights));
  assert.ok(insights.length > 0, 'Should generate actionable insights based on assessment performance');
});
