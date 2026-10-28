/**
 * VisiOS — Phase 4: Practice Recommender
 * Generates targeted practice recommendations based on student weak areas and active misconceptions.
 */

import { StudentProfile, ActivityDifficulty } from './AdaptiveLearningContracts';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';
import { DIAGNOSTIC_QUESTION_BANK } from './misconception-catalog';
import { DifficultyController } from './DifficultyController';

export interface PracticeExerciseItem {
  questionId: string;
  conceptId: string;
  conceptTitle: string;
  difficulty: ActivityDifficulty;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  targetedMisconceptionId?: string;
  capabilityId?: string;
}

export class PracticeRecommender {
  /**
   * Recommend practice exercises tailored to the student's current mastery and misconceptions.
   */
  public static recommendExercises(
    profile: StudentProfile,
    targetConceptId?: string,
    limit: number = 3
  ): PracticeExerciseItem[] {
    const conceptIdsToTarget: string[] = [];

    if (targetConceptId) {
      conceptIdsToTarget.push(targetConceptId);
    } else {
      // Find weak concepts (beginner or developing or active misconceptions)
      const weakConceptEntries = Object.entries(profile.concepts)
        .filter(
          ([_, m]) =>
            m.masteryLevel === 'beginner' ||
            m.masteryLevel === 'developing' ||
            m.identifiedMisconceptions.length > 0
        )
        .sort((a, b) => a[1].recentAccuracy - b[1].recentAccuracy);

      for (const [cId] of weakConceptEntries) {
        conceptIdsToTarget.push(cId);
        if (conceptIdsToTarget.length >= limit) break;
      }
    }

    // If still empty (new student or all mastered), take fundamental concepts
    if (conceptIdsToTarget.length === 0) {
      conceptIdsToTarget.push('math_linear_functions', 'math_fractions_basic', 'cs_binary_search');
    }

    const exercises: PracticeExerciseItem[] = [];

    for (const conceptId of conceptIdsToTarget) {
      const node = TRUSTED_CONCEPT_REGISTRY[conceptId];
      const mastery = profile.concepts[conceptId];
      const difficulty = DifficultyController.selectDifficulty(mastery);

      // 1. Try finding a question from DIAGNOSTIC_QUESTION_BANK
      const diagnosticMatch = DIAGNOSTIC_QUESTION_BANK.find(
        (q) => q.conceptId === conceptId || q.conceptId.includes(conceptId.replace(/^math_|^cs_|^phys_/, ''))
      );

      if (diagnosticMatch) {
        exercises.push({
          questionId: diagnosticMatch.id,
          conceptId,
          conceptTitle: node?.title || conceptId,
          difficulty,
          question: diagnosticMatch.question,
          options: diagnosticMatch.options,
          correctIndex: diagnosticMatch.correctIndex ?? 0,
          explanation: diagnosticMatch.learningObjective,
          capabilityId: this.resolveCapabilityForConcept(conceptId),
        });
        continue;
      }

      // 2. Try using node's diagnosticQuestion from TRUSTED_CONCEPT_REGISTRY
      if (node?.diagnosticQuestion) {
        exercises.push({
          questionId: `dq_${conceptId}`,
          conceptId,
          conceptTitle: node.title,
          difficulty,
          question: node.diagnosticQuestion.question,
          options: node.diagnosticQuestion.options,
          correctIndex: node.diagnosticQuestion.correctIndex,
          explanation: node.diagnosticQuestion.explanation,
          capabilityId: this.resolveCapabilityForConcept(conceptId),
        });
        continue;
      }

      // 3. Fallback procedural practice generator
      exercises.push(this.generateProceduralQuestion(conceptId, difficulty));
    }

    return exercises.slice(0, limit);
  }

  private static resolveCapabilityForConcept(conceptId: string): string {
    if (conceptId.includes('linear')) return 'cap_linear_functions';
    if (conceptId.includes('fraction')) return 'cap_rational_fractions';
    if (conceptId.includes('binary_search')) return 'cap_cs_binary_search';
    if (conceptId.includes('pythagorean')) return 'cap_euclidean_geometry';
    if (conceptId.includes('pendulum')) return 'cap_pendulum_simulation';
    return 'cap_general_explanation';
  }

  private static generateProceduralQuestion(
    conceptId: string,
    difficulty: ActivityDifficulty
  ): PracticeExerciseItem {
    const node = TRUSTED_CONCEPT_REGISTRY[conceptId];
    const title = node?.title || conceptId.replace(/_/g, ' ');

    return {
      questionId: `proc_${conceptId}_${Date.now()}`,
      conceptId,
      conceptTitle: title,
      difficulty,
      question: `Which of the following best demonstrates the core principle of ${title}?`,
      options: [
        `Applying foundational definitions and verified constraints of ${title}`,
        'Ignoring boundary assumptions and guessing',
        'Applying unrelated formulas from another subject',
        'Skipping verification of intermediate states',
      ],
      correctIndex: 0,
      explanation: `${title} relies on strictly adhering to governing axioms and step-by-step verification.`,
      capabilityId: this.resolveCapabilityForConcept(conceptId),
    };
  }
}
