import { AdaptiveLearningService, adaptiveLearningService } from '../../adaptive/AdaptiveLearningService';
import { AdaptiveRecommendation } from '../../adaptive/AdaptiveLearningContracts';
import { ConceptMasteryEngine } from './ConceptMasteryEngine';
import { KnowledgeModel, defaultKnowledgeModel } from '../../adaptive/KnowledgeModel';

export class AdaptiveLearningPlanner {
  static recommend(studentId: string, conceptId: string, service: AdaptiveLearningService = adaptiveLearningService): AdaptiveRecommendation {
    return service.getNextRecommendation(studentId, conceptId);
  }

  static nextDifficulty(studentId: string, conceptId: string, model: KnowledgeModel = defaultKnowledgeModel): 1 | 2 | 3 | 4 | 5 {
    const score = ConceptMasteryEngine.getMastery(studentId, conceptId, model).masteryScore;
    if (score < 40) return 1;
    if (score < 70) return 2;
    if (score < 85) return 3;
    return 4;
  }
}
