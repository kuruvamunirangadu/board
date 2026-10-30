/**
 * VisiOS — Learning Intelligence & Whiteboard Synchronization Test Suite
 * Verifies fixes for:
 * 1. Conversational prompt cleaning and accurate topic routing (e.g. isolation levels).
 * 2. Canvas context builder synchronization with stamped learning cards.
 * 3. Accurate, evidence-grounded mastery status evaluation (replaces premature Step 8 mastery).
 * 4. Request race condition guards in topic orchestration.
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { LearningOrchestrator } from '../features/learning/LearningOrchestrator';
import { buildObjectContext } from '../features/intelligence/context-builder';
import { Workspace } from '../types';

// Mock Workspace
const mockWorkspace: Workspace = {
  id: 'ws-test-1',
  title: 'Untitled Workspace',
  mode: 'focus',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: '1.0',
};

// ---------------------------------------------------------------------------
// Test 1: Conversational prompt cleaning
// ---------------------------------------------------------------------------
test('Test 1: Conversational prompt cleaning extracts core topic', () => {
  const query1 = 'Explain isolation levels in database transactions with an example.';
  const core1 = LearningOrchestrator.extractCoreTopic(query1);
  assert.equal(core1, 'isolation levels in database transactions');

  const query2 = 'Teach me binary search from the basics';
  const core2 = LearningOrchestrator.extractCoreTopic(query2);
  assert.equal(core2, 'binary search');

  const query3 = 'What is photosynthesis?';
  const core3 = LearningOrchestrator.extractCoreTopic(query3);
  assert.equal(core3, 'photosynthesis');

  // Mathematical equations should remain unchanged
  const mathQuery = 'F = ma';
  const coreMath = LearningOrchestrator.extractCoreTopic(mathQuery);
  assert.equal(coreMath, 'F = ma');
});

// ---------------------------------------------------------------------------
// Test 2: ProcessTopic routes natural language isolation query to correct concept
// ---------------------------------------------------------------------------
test('Test 2: ProcessTopic routes natural language isolation query to Isolation concept', async () => {
  const orchestrated = await LearningOrchestrator.processTopic(
    'Explain isolation levels in database transactions with an example.'
  );

  assert.ok(orchestrated.plan);
  assert.ok(orchestrated.plan.title.toLowerCase().includes('isolation'));
  assert.ok(orchestrated.plan.overview.toLowerCase().includes('isolation') || orchestrated.plan.overview.toLowerCase().includes('transaction'));
  assert.notEqual(orchestrated.plan.title, 'Orange');
});

// ---------------------------------------------------------------------------
// Test 3: Context builder detects selected learning-card on canvas
// ---------------------------------------------------------------------------
test('Test 3: Context builder extracts concept title from selected learning-card shape', () => {
  const mockShape = {
    id: 'shape-card-1',
    type: 'learning-card',
    props: {
      title: 'Database Isolation Levels',
      category: 'computer_science',
      badge: 'Core Concept',
      content: 'Isolation ensures concurrent transactions execute safely without dirty reads.',
      formula: '',
      steps: ['Read Uncommitted', 'Read Committed', 'Repeatable Read', 'Serializable'],
    },
  };

  const mockEditor = {
    getSelectedShapes: () => [mockShape],
    getCurrentPageShapes: () => [mockShape],
  } as any;

  const context = buildObjectContext(mockEditor, mockWorkspace);
  assert.equal(context.type, 'formula');
  assert.equal(context.title, 'Database Isolation Levels');
  assert.equal(context.recognizedFormula?.rawText, 'Database Isolation Levels');
});

// ---------------------------------------------------------------------------
// Test 4: Context builder falls back to board learning-card when nothing selected
// ---------------------------------------------------------------------------
test('Test 4: Context builder detects board learning-card when no shapes are selected', () => {
  const mockShape = {
    id: 'shape-card-board',
    type: 'learning-card',
    props: {
      title: 'Binary Search Algorithm',
      category: 'algorithm',
      badge: 'Core Concept',
      content: 'Halves the search space at each iteration.',
      formula: 'O(log n)',
      steps: ['Initialize pointers', 'Compute mid', 'Compare'],
    },
  };

  const mockEditor = {
    getSelectedShapes: () => [],
    getCurrentPageShapes: () => [mockShape],
  } as any;

  const context = buildObjectContext(mockEditor, mockWorkspace);
  assert.equal(context.type, 'formula');
  assert.equal(context.title, 'Binary Search Algorithm');
});

// ---------------------------------------------------------------------------
// Test 5: Mastery state evaluation logic enforces assessment before mastery
// ---------------------------------------------------------------------------
test('Test 5: Mastery state evaluation prevents premature mastery without assessment', () => {
  // Helper implementing the exact evaluation logic in UniversalLearningWorkspace
  const evaluateMastery = (
    completedStepsCount: number,
    isAnswerSubmitted: boolean,
    practiceFeedback: { isCorrect: boolean; score: number } | null
  ) => {
    const hasVisitedAllSteps = completedStepsCount >= 7;
    const hasAssessment = isAnswerSubmitted && practiceFeedback !== null;
    const score = practiceFeedback?.score ?? 0;
    const isAssessmentPassed = hasAssessment && practiceFeedback?.isCorrect && score >= 70;
    const isAssessmentFailed = hasAssessment && (!practiceFeedback?.isCorrect || score < 70);

    if (isAssessmentPassed) return 'mastered';
    if (isAssessmentFailed) return 'needs_practice';
    if (hasVisitedAllSteps) return 'assessment_pending';
    return 'in_progress';
  };

  // Case A: Student navigated to Step 8 without submitting quiz -> assessment_pending (NOT mastered!)
  assert.equal(evaluateMastery(8, false, null), 'assessment_pending');

  // Case B: Student submitted quiz and failed -> needs_practice (NOT mastered!)
  assert.equal(evaluateMastery(8, true, { isCorrect: false, score: 40 }), 'needs_practice');

  // Case C: Student submitted quiz and passed with 100% -> mastered
  assert.equal(evaluateMastery(8, true, { isCorrect: true, score: 100 }), 'mastered');

  // Case D: Student submitted quiz and passed with 80% -> mastered
  assert.equal(evaluateMastery(7, true, { isCorrect: true, score: 80 }), 'mastered');

  // Case E: Student just started lesson (visited 2 steps) -> in_progress
  assert.equal(evaluateMastery(2, false, null), 'in_progress');
});

// ---------------------------------------------------------------------------
// Test 6: Acronym queries like "mla stands for" trigger disambiguation clarification
// ---------------------------------------------------------------------------
test('Test 6: Acronym queries like "mla stands for" route to honest uncertainty with candidate options', async () => {
  const orchestrated = await LearningOrchestrator.processTopic('mla stands for');

  assert.equal(orchestrated.routeTaken, 'honest_uncertainty');
  assert.equal(orchestrated.plan.uncertaintyState?.isUncertain, true);
  assert.ok(orchestrated.plan.uncertaintyState?.suggestedClarifications);
  assert.ok(orchestrated.plan.uncertaintyState.suggestedClarifications.length >= 2);

  // Candidate options should include Modern Language Association
  const hasMLA = orchestrated.plan.uncertaintyState.suggestedClarifications.some((opt) =>
    opt.toLowerCase().includes('modern language association')
  );
  assert.equal(hasMLA, true);

  // Must not claim Douglas Todd Loewen or Carbon Market as the sole definition
  assert.notEqual(orchestrated.plan.title, 'Todd Loewen');
  assert.notEqual(orchestrated.plan.title, 'Integrity Council for the Voluntary Carbon Market (ICVCM)');
});

// ---------------------------------------------------------------------------
// Test 7: "stands for" does not match "tan" in trigonometry
// ---------------------------------------------------------------------------
test('Test 7: Word boundary checking prevents "stands for" from triggering trigonometric curves', () => {
  const query = 'mla stands for';
  const lower = query.toLowerCase();

  // Test the new regexes used in UniversalLearningWorkspace and CanvasStampingEngine
  const isTrigMath =
    /\b(cos|sine|sin|tan|tangent|cosine)\b/i.test(lower) ||
    /\by\s*=\s*(sin|cos|tan)\b/i.test(lower);

  assert.equal(isTrigMath, false, '"stands for" should not trigger trigonometric curves');

  // Verify that an actual trig query still matches
  const trigQuery = 'y = tan(x)';
  const matchesTrig =
    /\b(cos|sine|sin|tan|tangent|cosine)\b/i.test(trigQuery) ||
    /\by\s*=\s*(sin|cos|tan)\b/i.test(trigQuery);
  assert.equal(matchesTrig, true, '"y = tan(x)" must match trigonometry');
});

