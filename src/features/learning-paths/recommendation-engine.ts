import { 
  Concept, 
  LearnerConceptState, 
  LearningGoal, 
  LearningPath, 
  RecommendationResult 
} from '@/types/learning-path';
import { ConceptDependencyGraph } from './concept-graph';

export class AdaptiveRecommendationEngine {
  /**
   * Generates a transparent, evidence-based next learning step recommendation.
   */
  static getNextRecommendation(
    graph: ConceptDependencyGraph,
    learnerStates: Record<string, LearnerConceptState>,
    goal: LearningGoal,
    path: LearningPath
  ): RecommendationResult {
    const conceptSequence = path.conceptIds;

    // Check if goal is already fully completed
    const allConcepts = conceptSequence.map((id) => graph.getConcept(id)).filter(Boolean) as Concept[];
    const isAllComplete = allConcepts.every((c) => {
      const st = learnerStates[c.id];
      return st && (st.status === 'completed' || st.status === 'practiced');
    });

    if (isAllComplete && allConcepts.length > 0) {
      const target = graph.getConcept(goal.targetConceptId) || allConcepts[allConcepts.length - 1];
      return {
        recommendedConceptId: target.id,
        activityType: 'review',
        title: `Goal Achieved: ${goal.title}`,
        rationale: 'You have demonstrated mastery across all prerequisite concepts and target assessments in this learning path.',
        blockingPrerequisites: [],
        evidence: allConcepts.map((c) => `Mastered: ${c.title}`),
        isGoalAchieved: true,
      };
    }

    // 1. Check for Concepts Flagged for Review (e.g. Failed Assessment)
    for (const conceptId of conceptSequence) {
      const state = learnerStates[conceptId];
      if (state && state.reviewRecommended) {
        const concept = graph.getConcept(conceptId);
        const lastAttempt = state.assessmentAttempts[state.assessmentAttempts.length - 1];
        return {
          recommendedConceptId: conceptId,
          activityType: 'review',
          title: `Review: ${concept?.title || conceptId}`,
          rationale: `Recent knowledge check indicated difficulty. Reviewing key principles or testing a visual experiment will strengthen foundational comprehension.`,
          blockingPrerequisites: [],
          evidence: lastAttempt ? [`Failed check at ${new Date(lastAttempt.timestamp).toLocaleTimeString()}`] : ['Review flag active'],
          isGoalAchieved: false,
        };
      }
    }

    // 2. Check for In-Progress Concepts
    for (const conceptId of conceptSequence) {
      const state = learnerStates[conceptId];
      if (state && state.status === 'in_progress') {
        const concept = graph.getConcept(conceptId);
        const missing = graph.getMissingPrerequisites(conceptId, learnerStates);

        if (missing.length === 0 && concept) {
          const hasPassedCheck = state.assessmentAttempts.some((a) => a.isCorrect);
          if (!hasPassedCheck && concept.knowledgeCheck) {
            return {
              recommendedConceptId: conceptId,
              activityType: 'knowledge_check',
              title: `Knowledge Check: ${concept.title}`,
              rationale: `You have explored this concept. Complete the knowledge check to verify your understanding and unlock downstream concepts.`,
              blockingPrerequisites: [],
              evidence: [`In progress since ${new Date(state.recentActivityTimestamp).toLocaleTimeString()}`],
              isGoalAchieved: false,
            };
          }

          if (concept.suggestedSimulations && concept.suggestedSimulations.length > 0) {
            return {
              recommendedConceptId: conceptId,
              activityType: 'simulate',
              title: `Interactive Simulation: ${concept.title}`,
              rationale: `Run the live physical simulation to observe cause-and-effect parameters in real time.`,
              blockingPrerequisites: [],
              evidence: ['Simulation experiment recommended for active learning'],
              isGoalAchieved: false,
            };
          }
        }
      }
    }

    // 3. Find First Incomplete Concept and Validate Prerequisites
    for (const conceptId of conceptSequence) {
      const state = learnerStates[conceptId];
      const isDone = state && (state.status === 'completed' || state.status === 'practiced');

      if (!isDone) {
        const concept = graph.getConcept(conceptId);
        if (!concept) continue;

        const missing = graph.getMissingPrerequisites(conceptId, learnerStates);

        if (missing.length > 0) {
          // Concept is blocked by prerequisites! Recommend the first missing prerequisite
          const firstMissingId = missing[0];
          const missingConcept = graph.getConcept(firstMissingId);
          return {
            recommendedConceptId: firstMissingId,
            activityType: 'learn',
            title: `Prerequisite: ${missingConcept?.title || firstMissingId}`,
            rationale: `Before advancing to "${concept.title}", you must first complete foundational prerequisite "${missingConcept?.title || firstMissingId}".`,
            blockingPrerequisites: missing,
            evidence: missing.map((id) => `Incomplete: ${graph.getConcept(id)?.title || id}`),
            isGoalAchieved: false,
          };
        }

        // Prerequisites are met; recommend starting this concept
        return {
          recommendedConceptId: conceptId,
          activityType: 'learn',
          title: `Next Concept: ${concept.title}`,
          rationale: `All prerequisites for "${concept.title}" are satisfied. Ready to explore new learning objectives.`,
          blockingPrerequisites: [],
          evidence: graph.getPrerequisites(conceptId).map((p) => `Prerequisite satisfied: ${p.title}`),
          isGoalAchieved: false,
        };
      }
    }

    // Fallback: Default to first concept
    const firstConceptId = conceptSequence[0] || goal.targetConceptId;
    const firstConcept = graph.getConcept(firstConceptId);
    return {
      recommendedConceptId: firstConceptId,
      activityType: 'learn',
      title: `Begin: ${firstConcept?.title || firstConceptId}`,
      rationale: 'Start with the introductory foundational concept of this learning path.',
      blockingPrerequisites: [],
      evidence: ['Initial sequence point'],
      isGoalAchieved: false,
    };
  }

  /**
   * Applies an assessment attempt result to learner state, updating status and review flags.
   */
  static applyAssessmentResult(
    currentState: LearnerConceptState | undefined,
    conceptId: string,
    questionId: string,
    isCorrect: boolean,
    selectedOption: number
  ): LearnerConceptState {
    const now = Date.now();
    const existing = currentState || {
      conceptId,
      status: 'not_started',
      assessmentAttempts: [],
      recentActivityTimestamp: now,
      reviewRecommended: false,
      evidenceNotes: [],
    };

    const newAttempt = {
      questionId,
      isCorrect,
      timestamp: now,
      selectedOption,
    };

    const updatedAttempts = [...existing.assessmentAttempts, newAttempt];
    const newStatus = isCorrect ? 'practiced' : 'in_progress';
    const reviewRecommended = !isCorrect;

    const evidenceNote = isCorrect
      ? `Successfully answered knowledge check on ${new Date(now).toLocaleDateString()}`
      : `Missed knowledge check on ${new Date(now).toLocaleDateString()}; review recommended`;

    return {
      ...existing,
      status: newStatus,
      assessmentAttempts: updatedAttempts,
      recentActivityTimestamp: now,
      lastSuccessfulKnowledgeCheck: isCorrect ? now : existing.lastSuccessfulKnowledgeCheck,
      reviewRecommended,
      evidenceNotes: [evidenceNote, ...existing.evidenceNotes].slice(0, 10),
    };
  }
}

