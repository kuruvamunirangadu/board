/**
 * VisiOS — Phase 4: Adaptive Path Planner
 * Constructs individualized, prerequisite-aware learning sequences.
 * Investigates upstream knowledge gaps and directs students to foundational concepts before advanced applications.
 */

import {
  AdaptivePath,
  AdaptivePathStep,
  AdaptiveRecommendation,
  MasteryLevel,
  StudentProfile,
} from './AdaptiveLearningContracts';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';
import { DifficultyController } from './DifficultyController';

export class AdaptivePathPlanner {
  /**
   * Builds an individualized learning path for a target concept goal.
   * Traverses prerequisites topologically and identifies earliest unmastered dependencies.
   */
  public static planPath(
    studentProfile: StudentProfile,
    targetConceptId: string
  ): AdaptivePath {
    const studentId = studentProfile.studentId;
    const targetNode = TRUSTED_CONCEPT_REGISTRY[targetConceptId];

    if (!targetNode) {
      // Fallback for custom or direct topic queries
      return {
        pathId: `path_${Date.now()}_${targetConceptId}`,
        studentId,
        targetGoal: targetConceptId,
        steps: [
          {
            conceptId: targetConceptId,
            title: targetConceptId.replace(/_/g, ' '),
            masteryLevel: studentProfile.concepts[targetConceptId]?.masteryLevel || 'not_started',
            status: 'current',
            rationale: 'Direct exploration topic.',
          },
        ],
        gapConcepts: [],
        summary: `Direct learning plan for ${targetConceptId}.`,
      };
    }

    // 1. Gather all ancestral prerequisite concepts recursively
    const orderedPrereqIds: string[] = [];
    const visited = new Set<string>();

    const collectAncestors = (conceptId: string) => {
      const node = TRUSTED_CONCEPT_REGISTRY[conceptId];
      if (!node) return;
      for (const pId of node.prerequisiteIds || []) {
        if (!visited.has(pId)) {
          visited.add(pId);
          collectAncestors(pId);
          orderedPrereqIds.push(pId);
        }
      }
    };

    collectAncestors(targetConceptId);
    orderedPrereqIds.push(targetConceptId);

    // 2. Classify each step based on the student's recorded mastery
    const steps: AdaptivePathStep[] = [];
    const gapConcepts: string[] = [];
    let currentFound = false;

    for (let i = 0; i < orderedPrereqIds.length; i++) {
      const cId = orderedPrereqIds[i];
      const node = TRUSTED_CONCEPT_REGISTRY[cId];
      const title = node?.title || cId.replace(/_/g, ' ');
      const mastery = studentProfile.concepts[cId];
      const masteryLevel: MasteryLevel = mastery?.masteryLevel || 'not_started';

      const isMasteredOrProficient =
        masteryLevel === 'mastered' || masteryLevel === 'proficient';

      let status: 'completed' | 'current' | 'locked' | 'recommended' = 'locked';
      let rationale = '';

      if (isMasteredOrProficient) {
        status = 'completed';
        rationale = `Demonstrated ${masteryLevel} understanding (${mastery?.recentAccuracy ? Math.round(mastery.recentAccuracy * 100) : 100}% accuracy).`;
      } else if (!currentFound) {
        status = 'current';
        currentFound = true;
        gapConcepts.push(cId);
        rationale =
          masteryLevel === 'not_started'
            ? 'Foundational prerequisite required before moving forward.'
            : `Developing concept needing reinforcement (current level: ${masteryLevel}).`;
      } else {
        status = 'locked';
        rationale = 'Prerequisites must be addressed first.';
      }

      steps.push({
        conceptId: cId,
        title,
        masteryLevel,
        status,
        rationale,
      });
    }

    const currentStep = steps.find((s) => s.status === 'current');
    const summary = currentStep
      ? currentStep.conceptId === targetConceptId
        ? `Ready to master ${targetNode.title}!`
        : `Recommended starting point: ${currentStep.title} (prerequisite for ${targetNode.title}).`
      : `All prerequisites for ${targetNode.title} completed.`;

    return {
      pathId: `path_${Date.now()}_${targetConceptId}`,
      studentId,
      targetGoal: targetNode.title,
      steps,
      gapConcepts,
      summary,
    };
  }

  /**
   * Generates a concrete, actionable learning recommendation based on the current gap or goal.
   */
  public static recommendNextActivity(
    studentProfile: StudentProfile,
    targetConceptId: string
  ): AdaptiveRecommendation {
    const path = this.planPath(studentProfile, targetConceptId);
    const currentStep = path.steps.find((s) => s.status === 'current') || path.steps[path.steps.length - 1];
    const conceptId = currentStep.conceptId;
    const node = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const mastery = studentProfile.concepts[conceptId];
    const difficulty = DifficultyController.selectDifficulty(mastery);

    // Check if student has active confirmed misconceptions on this concept
    const conceptErrors = studentProfile.interactionHistory.filter(
      (i) => i.conceptId === conceptId && !i.isCorrect
    );
    const activeMisc = studentProfile.activeMisconceptions.find((mId) =>
      conceptErrors.some((i) => i.detectedMisconceptionId === mId)
    );

    if (activeMisc) {
      return {
        recommendationId: `rec_misc_${Date.now()}`,
        studentId: studentProfile.studentId,
        targetConceptId: conceptId,
        type: 'misconception_remediation',
        difficulty: 'beginner',
        title: `Clarify Misconception in ${node?.title || conceptId}`,
        description: `Address common misconception: ${activeMisc.replace(/_/g, ' ')}.`,
        reasoning: 'Repeated diagnostic errors indicate an active conceptual misconception.',
        prerequisiteIds: node?.prerequisiteIds || [],
        suggestedQuery: `Explain ${node?.topicQuery || node?.title || conceptId}`,
      };
    }

    if (currentStep.conceptId !== targetConceptId) {
      // Recommending Prerequisite Review
      return {
        recommendationId: `rec_prereq_${Date.now()}`,
        studentId: studentProfile.studentId,
        targetConceptId: conceptId,
        type: 'prerequisite_review',
        difficulty,
        title: `Prerequisite Review: ${node?.title || conceptId}`,
        description: `Master ${node?.title || conceptId} before advancing to ${path.targetGoal}.`,
        reasoning: currentStep.rationale,
        prerequisiteIds: node?.prerequisiteIds || [],
        suggestedQuery: `Explain ${node?.topicQuery || node?.title || conceptId}`,
      };
    }

    if (mastery?.masteryLevel === 'proficient' || mastery?.masteryLevel === 'mastered') {
      return {
        recommendationId: `rec_adv_${Date.now()}`,
        studentId: studentProfile.studentId,
        targetConceptId: conceptId,
        type: 'advance_next_concept',
        difficulty: 'advanced',
        title: `Advanced Application: ${node?.title || conceptId}`,
        description: `Apply your mastery of ${node?.title || conceptId} to advanced problems.`,
        reasoning: `You have reached ${mastery.masteryLevel} mastery.`,
        prerequisiteIds: node?.prerequisiteIds || [],
        suggestedQuery: `Practice advanced ${node?.topicQuery || node?.title || conceptId}`,
      };
    }

    // Default: Targeted practice on current concept
    return {
      recommendationId: `rec_practice_${Date.now()}`,
      studentId: studentProfile.studentId,
      targetConceptId: conceptId,
      type: 'targeted_practice',
      difficulty,
      title: `Practice ${node?.title || conceptId}`,
      description: `Solidify your understanding with targeted exercises.`,
      reasoning: `Current mastery level is ${mastery?.masteryLevel || 'not_started'}.`,
      prerequisiteIds: node?.prerequisiteIds || [],
      suggestedQuery: `Practice ${node?.topicQuery || node?.title || conceptId}`,
    };
  }
}
