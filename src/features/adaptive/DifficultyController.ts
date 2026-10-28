/**
 * VisiOS — Phase 4: Difficulty Controller
 * Selects an appropriate pedagogical challenge level and scaffolding based on student mastery.
 */

import { ConceptMastery, ActivityDifficulty } from './AdaptiveLearningContracts';

export class DifficultyController {
  /**
   * Determine suitable activity difficulty from empirical concept mastery.
   */
  public static selectDifficulty(mastery?: ConceptMastery): ActivityDifficulty {
    if (!mastery || mastery.masteryLevel === 'not_started' || mastery.masteryLevel === 'beginner') {
      return 'beginner';
    }

    if (mastery.masteryLevel === 'developing') {
      // If student has made progress recently (>= 60%), provide intermediate; otherwise reinforce beginner
      return mastery.recentAccuracy >= 0.6 ? 'intermediate' : 'beginner';
    }

    if (mastery.masteryLevel === 'proficient') {
      // If consecutive correct >= 3, stretch with advanced challenge
      return mastery.consecutiveCorrect >= 3 ? 'advanced' : 'intermediate';
    }

    if (mastery.masteryLevel === 'mastered') {
      return 'advanced';
    }

    return 'beginner';
  }

  /**
   * Determines whether visual scaffolding should be included in explanations.
   */
  public static requiresVisualScaffolding(mastery?: ConceptMastery): boolean {
    if (!mastery) return true;
    return mastery.masteryLevel === 'not_started' ||
      mastery.masteryLevel === 'beginner' ||
      mastery.masteryLevel === 'developing' ||
      mastery.identifiedMisconceptions.length > 0;
  }
}
