import { KnowledgeModel, defaultKnowledgeModel } from '../../adaptive/KnowledgeModel';
import { ConceptMastery, ConceptMasteryStatus } from '../types/MasteryTypes';

export class ConceptMasteryEngine {
  static calculateStatus(score: number, attempts: number): ConceptMasteryStatus {
    if (attempts <= 0) return 'not_started';
    if (score < 40) return 'needs_revision';
    if (score < 70) return 'learning';
    if (score < 85) return 'almost_mastered';
    return 'mastered';
  }

  static getMastery(studentId: string, conceptId: string, model: KnowledgeModel = defaultKnowledgeModel): ConceptMastery {
    const profile = model.getOrCreateProfile(studentId);
    const record = model.getConceptMastery(studentId, conceptId);
    const attempts = profile.interactionHistory.filter((item) => item.conceptId === conceptId && typeof item.isCorrect === 'boolean');
    const totalAttempts = attempts.length;
    const correctAttempts = attempts.filter((item) => item.isCorrect).length;
    const masteryScore = totalAttempts ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
    return {
      conceptId,
      conceptName: conceptId.replace(/[_-]+/g, ' '),
      totalAttempts,
      correctAttempts,
      masteryScore,
      status: this.calculateStatus(masteryScore, totalAttempts),
      lastAttemptAt: attempts.at(-1)?.timestamp || record.lastPracticedAt,
    };
  }
}
