/**
 * VisiOS — Phase 5: Assessment Orchestrator
 * End-to-end coordinator for the intelligent assessment lifecycle:
 * Question Generation -> Validation -> Progressive Hinting -> Deterministic Evaluation ->
 * Misconception Diagnosis -> Phase 4 Knowledge Model Update -> Dynamic Difficulty Adaptation -> Persistence.
 */

import {
  AssessmentQuestion,
  AssessmentSessionState,
  AssessmentAttempt,
  AnswerEvaluation,
  AssessmentDifficultyLevel,
} from './AssessmentContracts';
import { QuestionGenerator } from './QuestionGenerator';
import { QuestionValidator } from './QuestionValidator';
import { AnswerEvaluator } from './AnswerEvaluator';
import { HintEngine, HintResponse } from './HintEngine';
import { AssessmentDifficultyController } from './AssessmentDifficultyController';
import { AssessmentPersistence } from './AssessmentPersistence';
import { defaultKnowledgeModel, KnowledgeModel } from '../adaptive/KnowledgeModel';

export class AssessmentOrchestrator {
  private knowledgeModel: KnowledgeModel;

  constructor(customKM?: KnowledgeModel) {
    this.knowledgeModel = customKM || defaultKnowledgeModel;
  }

  /**
   * Start or resume an assessment session for a student studying a concept.
   */
  public startOrResumeSession(
    studentId: string,
    conceptId: string,
    initialDifficulty: AssessmentDifficultyLevel = 2
  ): {
    session: AssessmentSessionState;
    nextQuestion: AssessmentQuestion;
  } {
    let session = AssessmentPersistence.findActiveSession(studentId, conceptId);

    if (!session) {
      session = {
        sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        studentId,
        conceptId,
        currentDifficulty: initialDifficulty,
        questionsAnswered: 0,
        correctAnswers: 0,
        attempts: [],
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        isCompleted: false,
        activeMisconceptions: [],
        updatedAt: new Date().toISOString(),
      };
      AssessmentPersistence.saveSession(session);
    }

    const nextQuestion = this.generateValidatedQuestion(conceptId, session.currentDifficulty);
    return { session, nextQuestion };
  }

  /**
   * Generates a question and strictly asserts validation before presentation.
   */
  public generateValidatedQuestion(
    conceptId: string,
    difficulty: AssessmentDifficultyLevel
  ): AssessmentQuestion {
    const question = QuestionGenerator.generate(conceptId, difficulty);
    const validation = QuestionValidator.validate(question);

    if (!validation.isValid) {
      throw new Error(`Question validation failed: ${validation.errors.join('; ')}`);
    }

    return question;
  }

  /**
   * Request the next progressive hint for an active question.
   */
  public requestHint(
    question: AssessmentQuestion,
    currentHintIndex: number
  ): HintResponse {
    return HintEngine.getNextHint(question, currentHintIndex);
  }

  /**
   * Submit an answer, evaluate reasoning deterministically, update Phase 4 knowledge model,
   * adjust difficulty, and persist attempt.
   */
  public submitAnswer(
    sessionId: string,
    question: AssessmentQuestion,
    submittedAnswer: string | number,
    hintsRequested: number = 0,
    submittedSteps?: string[]
  ): {
    session: AssessmentSessionState;
    evaluation: AnswerEvaluation;
    nextDifficulty: AssessmentDifficultyLevel;
  } {
    const session = AssessmentPersistence.getSession(sessionId);
    if (!session) {
      throw new Error(`Assessment session "${sessionId}" not found.`);
    }

    // 1. Evaluate answer and reasoning deterministically
    const evaluation = AnswerEvaluator.evaluate(question, submittedAnswer, submittedSteps);

    // 2. Record attempt in session
    const attempt: AssessmentAttempt = {
      attemptId: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      studentId: session.studentId,
      questionId: question.id,
      conceptId: question.conceptId,
      submittedAnswer,
      submittedSteps,
      hintsRequested,
      evaluation,
      timestamp: new Date().toISOString(),
    };

    session.attempts.push(attempt);
    session.questionsAnswered++;

    if (evaluation.status === 'correct') {
      session.correctAnswers++;
      session.consecutiveCorrect++;
      session.consecutiveIncorrect = 0;
    } else {
      session.consecutiveIncorrect++;
      session.consecutiveCorrect = 0;
    }

    // 3. Update Phase 4 Knowledge Model (Single Source of Truth for Mastery)
    const adaptiveDifficulty =
      question.difficulty >= 4 ? 'advanced' : question.difficulty >= 2 ? 'intermediate' : 'beginner';

    this.knowledgeModel.recordInteraction({
      studentId: session.studentId,
      conceptId: question.conceptId,
      type: 'quiz_answer',
      isCorrect: evaluation.status === 'correct',
      selectedAnswer: submittedAnswer,
      expectedAnswer: question.expectedAnswer,
      difficulty: adaptiveDifficulty,
      hintsUsed: hintsRequested,
      detectedMisconceptionId: evaluation.detectedMisconceptionId,
    });

    // 4. Update session active misconceptions if identified
    if (evaluation.detectedMisconceptionId && !session.activeMisconceptions.includes(evaluation.detectedMisconceptionId)) {
      session.activeMisconceptions.push(evaluation.detectedMisconceptionId);
    }

    // 5. Calculate next dynamic difficulty level
    const nextDifficulty = AssessmentDifficultyController.calculateNextDifficulty(
      session.currentDifficulty,
      session.attempts
    );
    session.currentDifficulty = nextDifficulty;

    // 6. Save updated session state
    AssessmentPersistence.saveSession(session);

    return { session, evaluation, nextDifficulty };
  }
}

export const defaultAssessmentOrchestrator = new AssessmentOrchestrator();
