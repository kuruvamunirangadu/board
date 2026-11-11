import { AssessmentOrchestrator } from '../../assessment/AssessmentOrchestrator';
import { AssessmentPersistence } from '../../assessment/AssessmentPersistence';
import { AssessmentDifficultyLevel, AssessmentQuestion, AssessmentSessionState } from '../../assessment/AssessmentContracts';
import { KnowledgeModel, defaultKnowledgeModel } from '../../adaptive/KnowledgeModel';
import { QuestionBankService } from './QuestionBankService';
import { LearningAnalyticsService } from './LearningAnalyticsService';

const QUESTIONS_PER_ASSESSMENT = 5;

export class AssessmentService {
  private orchestrator: AssessmentOrchestrator;
  private knowledgeModel: KnowledgeModel;

  constructor(orchestrator?: AssessmentOrchestrator, knowledgeModel: KnowledgeModel = defaultKnowledgeModel) {
    this.knowledgeModel = knowledgeModel;
    this.orchestrator = orchestrator || new AssessmentOrchestrator(knowledgeModel);
  }

  start(studentId: string, conceptId: string, difficulty: AssessmentDifficultyLevel = 1): { session: AssessmentSessionState; question: AssessmentQuestion } | null {
    const canonicalConceptId = QuestionBankService.normalizeConceptId(conceptId);
    if (!canonicalConceptId) return null;
    const latest = AssessmentPersistence.findLatestSession(studentId, canonicalConceptId);
    if (latest?.isCompleted && latest.currentQuestion) return { session: latest, question: latest.currentQuestion };
    const started = this.orchestrator.startOrResumeSession(studentId, canonicalConceptId, difficulty);
    // The orchestrator uses the same deterministic question generator; reject unsupported content.
    if (started.nextQuestion.evaluationStrategy === 'unsupported') return null;
    return { session: started.session, question: started.nextQuestion };
  }

  restart(studentId: string, conceptId: string, difficulty: AssessmentDifficultyLevel = 1) {
    const canonicalConceptId = QuestionBankService.normalizeConceptId(conceptId);
    if (!canonicalConceptId) return null;
    const started = this.orchestrator.startOrResumeSession(studentId, canonicalConceptId, difficulty);
    return started.nextQuestion.evaluationStrategy === 'unsupported' ? null : { session: started.session, question: started.nextQuestion };
  }

  submit(sessionId: string, question: AssessmentQuestion, answer: string | number, hintsUsed = 0) {
    const result = this.orchestrator.submitAnswer(sessionId, question, answer, hintsUsed);
    if (result.session.questionsAnswered >= QUESTIONS_PER_ASSESSMENT) {
      result.session.isCompleted = true;
      AssessmentPersistence.saveSession(result.session);
    } else {
      result.session.currentQuestion = this.nextQuestion(result.session.conceptId, result.session.currentDifficulty) || undefined;
      AssessmentPersistence.saveSession(result.session);
    }
    return {
      ...result,
      nextQuestion: result.session.currentQuestion,
      summary: LearningAnalyticsService.summarizeAssessment(result.session),
      analytics: LearningAnalyticsService.getConceptAnalytics(result.session.studentId, result.session.conceptId, this.knowledgeModel),
    };
  }

  nextQuestion(conceptId: string, difficulty: AssessmentDifficultyLevel): AssessmentQuestion | null {
    const canonicalConceptId = QuestionBankService.normalizeConceptId(conceptId);
    return canonicalConceptId ? QuestionBankService.getQuestion(canonicalConceptId, difficulty) : null;
  }
}

export const assessmentService = new AssessmentService();
