import { AssessmentSessionState } from '../../assessment/AssessmentContracts';
import { KnowledgeModel, defaultKnowledgeModel } from '../../adaptive/KnowledgeModel';
import { LearningAnalytics } from '../types/MasteryTypes';
import { ConceptMasteryEngine } from '../engines/ConceptMasteryEngine';
import { AssessmentPersistence } from '../../assessment/AssessmentPersistence';

export class LearningAnalyticsService {
  static getConceptAnalytics(studentId: string, conceptId: string, model: KnowledgeModel = defaultKnowledgeModel): LearningAnalytics {
    const profile = model.getOrCreateProfile(studentId);
    const evidence = profile.interactionHistory.filter((item) => item.conceptId === conceptId && typeof item.isCorrect === 'boolean');
    const recent = evidence.slice(-5);
    const correctAttempts = evidence.filter((item) => item.isCorrect).length;
    const attempts = AssessmentPersistence.listSessions(studentId, conceptId).flatMap((session) => session.attempts);
    const scores = attempts.length ? attempts.map((attempt) => attempt.evaluation.score) : evidence.map((item) => item.isCorrect ? 100 : 0);
    return {
      conceptId,
      totalAttempts: evidence.length,
      correctAttempts,
      accuracy: evidence.length ? Math.round((correctAttempts / evidence.length) * 100) : 0,
      recentAccuracy: recent.length ? Math.round((recent.filter((item) => item.isCorrect).length / recent.length) * 100) : 0,
      averageScore: scores.length ? Math.round(scores.reduce<number>((sum, score) => sum + score, 0) / scores.length) : 0,
      hintsUsed: attempts.length
        ? attempts.reduce((sum, attempt) => sum + attempt.hintsRequested, 0)
        : evidence.reduce((sum, item) => sum + (item.hintsUsed || 0), 0),
      mastery: ConceptMasteryEngine.getMastery(studentId, conceptId, model),
    };
  }

  static summarizeAssessment(session: AssessmentSessionState) {
    const attempts = session.attempts;
    return {
      questionsAnswered: session.questionsAnswered,
      correctAnswers: session.correctAnswers,
      averageScore: attempts.length ? Math.round(attempts.reduce((sum, attempt) => sum + attempt.evaluation.score, 0) / attempts.length) : 0,
      isCompleted: session.isCompleted,
    };
  }
}
