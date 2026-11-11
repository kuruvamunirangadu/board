import { AssessmentDifficultyLevel, AssessmentQuestion } from '../../assessment/AssessmentContracts';
import { QuestionBankService } from '../services/QuestionBankService';

export class AssessmentGenerator {
  static generateQuestion(conceptId: string, difficulty: AssessmentDifficultyLevel): AssessmentQuestion | null {
    return QuestionBankService.getQuestion(conceptId, difficulty);
  }

  static generateAssessment(conceptId: string, count = 5, startingDifficulty: AssessmentDifficultyLevel = 1): AssessmentQuestion[] {
    return QuestionBankService.getAssessment(conceptId, count, startingDifficulty);
  }
}
