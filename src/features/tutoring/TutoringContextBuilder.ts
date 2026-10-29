/**
 * VisiOS — Phase 8: Tutoring Context Builder
 * Assembles authenticated student context from Phase 4 KnowledgeModel and Phase 7 Topic Progress.
 * Strictly enforces student privacy and dynamically selects suitable teaching strategies.
 */

import {
  TutoringContext,
  TeachingStrategy,
  LearnerDifficulty,
  TutoringRequest,
} from './TutoringContracts';
import { defaultKnowledgeModel, KnowledgeModel } from '../adaptive/KnowledgeModel';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class TutoringContextBuilder {
  private knowledgeModel: KnowledgeModel;

  constructor(customKM?: KnowledgeModel) {
    this.knowledgeModel = customKM || defaultKnowledgeModel;
  }

  /**
   * Builds personalized tutoring context, verifying privacy and calculating pedagogical recommendations.
   */
  public buildContext(request: TutoringRequest, resolvedConceptId?: string): {
    authorized: boolean;
    error?: string;
    context?: TutoringContext;
  } {
    const { studentId, requestingStudentId } = request;

    // Privacy Protection: Students can only access their own learning profiles unless authorized
    if (requestingStudentId && requestingStudentId !== studentId && requestingStudentId !== 'system' && requestingStudentId !== 'instructor') {
      return {
        authorized: false,
        error: `Access Denied: Student "${requestingStudentId}" is not authorized to inspect private learning records for "${studentId}".`,
      };
    }

    const conceptId = resolvedConceptId || request.conceptId || 'cs_binary_search';
    const conceptNode = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const conceptTitle = conceptNode?.title || conceptId;
    const subjectId = conceptNode?.domain || request.subjectId || 'general';

    // Fetch mastery profile from Phase 4 KnowledgeModel
    const mastery = this.knowledgeModel.getConceptMastery(studentId, conceptId);
    const profile = this.knowledgeModel.getOrCreateProfile(studentId);

    // Identify unmastered prerequisites
    const prereqIds = conceptNode?.prerequisiteIds || [];
    const unmasteredPrerequisites: string[] = [];
    for (const prereqId of prereqIds) {
      const pMastery = this.knowledgeModel.getConceptMastery(studentId, prereqId);
      if (pMastery.masteryLevel === 'beginner' || pMastery.totalAttempts === 0) {
        unmasteredPrerequisites.push(prereqId);
      }
    }

    // Determine recent struggle or error rate
    const recentInteractions = profile.interactionHistory
      .filter((i) => i.conceptId === conceptId)
      .slice(-5);
    
    let consecutiveErrorsCount = 0;
    for (let i = recentInteractions.length - 1; i >= 0; i--) {
      if (!recentInteractions[i].isCorrect) {
        consecutiveErrorsCount++;
      } else {
        break;
      }
    }

    // Recommended Difficulty
    let recommendedDifficulty: LearnerDifficulty = 'beginner';
    if (request.requestedDifficulty) {
      recommendedDifficulty = request.requestedDifficulty;
    } else if (mastery.confidenceScore >= 0.75 && mastery.masteryLevel === 'mastered') {
      recommendedDifficulty = 'advanced';
    } else if (mastery.confidenceScore >= 0.4 || mastery.masteryLevel === 'developing') {
      recommendedDifficulty = 'intermediate';
    }

    // Select Teaching Strategy
    let suggestedStrategy: TeachingStrategy = 'simple';
    if (request.requestedStrategy) {
      suggestedStrategy = request.requestedStrategy;
    } else if (profile.activeMisconceptions.length > 0) {
      // Prioritize active misconceptions
      suggestedStrategy = 'error_focused';
    } else if (consecutiveErrorsCount >= 2) {
      // Student is struggling: shift teaching approach to step-by-step or visual
      suggestedStrategy = 'step_by_step';
    } else if (recommendedDifficulty === 'advanced') {
      suggestedStrategy = 'formal';
    } else if (recommendedDifficulty === 'intermediate') {
      suggestedStrategy = 'visual';
    } else {
      suggestedStrategy = 'simple';
    }

    const context: TutoringContext = {
      studentId,
      subjectId,
      conceptId,
      conceptTitle,
      masteryLevel: mastery.masteryLevel,
      confidenceScore: mastery.confidenceScore,
      activeMisconceptions: profile.activeMisconceptions,
      unmasteredPrerequisites,
      recommendedDifficulty,
      suggestedStrategy,
      consecutiveErrorsCount,
    };

    return { authorized: true, context };
  }
}

export const defaultTutoringContextBuilder = new TutoringContextBuilder();
