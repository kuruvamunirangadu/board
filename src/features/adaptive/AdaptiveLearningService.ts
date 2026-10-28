/**
 * VisiOS — Phase 4: Adaptive Learning Service
 * High-level orchestration service coordinating student knowledge modeling,
 * misconception remediation, personalized path planning, and canvas delivery.
 */

import {
  StudentProfile,
  ConceptMastery,
  AdaptiveRecommendation,
  AdaptivePath,
} from './AdaptiveLearningContracts';
import { defaultKnowledgeModel, KnowledgeModel } from './KnowledgeModel';
import { RawInteractionPayload } from './InteractionAnalyzer';
import { AdaptivePathPlanner } from './AdaptivePathPlanner';
import { PracticeRecommender, PracticeExerciseItem } from './PracticeRecommender';
import { DifficultyController } from './DifficultyController';
import { LearningOrchestrator } from '../learning/LearningOrchestrator';
import { UnifiedLearningContracts, LearningResponse } from '../learning/UnifiedLearningContracts';

export class AdaptiveLearningService {
  private knowledgeModel: KnowledgeModel;

  constructor(customModel?: KnowledgeModel) {
    this.knowledgeModel = customModel || defaultKnowledgeModel;
  }

  /**
   * Record a student interaction, recalculate mastery, and return updated state.
   */
  public recordStudentAction(payload: RawInteractionPayload): {
    profile: StudentProfile;
    updatedMastery: ConceptMastery;
  } {
    const { profile, updatedMastery } = this.knowledgeModel.recordInteraction(payload);
    return { profile, updatedMastery };
  }

  /**
   * Get student profile.
   */
  public getStudentProfile(studentId: string): StudentProfile {
    return this.knowledgeModel.getOrCreateProfile(studentId);
  }

  /**
   * Generate an individualized learning path for a student toward a target concept.
   */
  public generatePersonalizedPath(
    studentId: string,
    targetConceptId: string
  ): AdaptivePath {
    const profile = this.getStudentProfile(studentId);
    return AdaptivePathPlanner.planPath(profile, targetConceptId);
  }

  /**
   * Get the next recommended learning activity.
   */
  public getNextRecommendation(
    studentId: string,
    targetConceptId: string
  ): AdaptiveRecommendation {
    const profile = this.getStudentProfile(studentId);
    return AdaptivePathPlanner.recommendNextActivity(profile, targetConceptId);
  }

  /**
   * Get targeted practice questions for a student.
   */
  public getTargetedPractice(
    studentId: string,
    targetConceptId?: string,
    limit: number = 3
  ): PracticeExerciseItem[] {
    const profile = this.getStudentProfile(studentId);
    return PracticeRecommender.recommendExercises(profile, targetConceptId, limit);
  }

  /**
   * Execute a personalized learning request via the LearningOrchestrator,
   * injecting the student's mastery level and preferences into the request context.
   */
  public async executePersonalizedLesson(
    studentId: string,
    query: string,
    targetConceptId?: string
  ): Promise<LearningResponse> {
    const profile = this.getStudentProfile(studentId);
    const conceptId = targetConceptId || query.toLowerCase().replace(/\s+/g, '_');
    const mastery = profile.concepts[conceptId];
    const difficulty = DifficultyController.selectDifficulty(mastery);
    const needsScaffolding = DifficultyController.requiresVisualScaffolding(mastery);

    const request = UnifiedLearningContracts.createLearningRequest(query, {
      context: {
        subject: conceptId.split('_')[0],
      },
      preferences: {
        preferredDifficulty: difficulty,
        includeScaffolding: needsScaffolding,
      },
    });

    // Execute via unified LearningOrchestrator
    const response = await LearningOrchestrator.executeRequest(request);

    // Record the learning interaction (viewing explanation)
    this.recordStudentAction({
      studentId,
      conceptId,
      type: 'explanation_view',
      difficulty,
    });

    return response;
  }
}

export const adaptiveLearningService = new AdaptiveLearningService();

