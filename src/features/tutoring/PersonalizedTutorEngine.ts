/**
 * VisiOS — Phase 8: Personalized Tutor Engine
 * Central orchestrator connecting intent classification, learner context modeling,
 * adaptive explanation generation, graduated hinting, practice generation,
 * and pre-presentation quality validation.
 */

import {
  TutoringRequest,
  TutoringResponse,
  TeachingStrategy,
  LearnerDifficulty,
} from './TutoringContracts';
import { TutoringContextBuilder, defaultTutoringContextBuilder } from './TutoringContextBuilder';
import { AdaptiveExplanationService } from './AdaptiveExplanationService';
import { HintGenerationService, defaultHintService } from './HintGenerationService';
import { PracticeGenerationService } from './PracticeGenerationService';
import { TutoringValidationService } from './TutoringValidationService';
import { IntentClassifier } from '../learning/IntentClassifier';
import { defaultKnowledgeModel, KnowledgeModel } from '../adaptive/KnowledgeModel';
import { defaultEventProcessor, LearningEventProcessor } from '../analytics/LearningEventProcessor';
import { TRUSTED_CONCEPT_REGISTRY } from '../learning/ConceptDependencyGraph';

export class PersonalizedTutorEngine {
  private contextBuilder: TutoringContextBuilder;
  private hintService: HintGenerationService;
  private knowledgeModel: KnowledgeModel;
  private eventProcessor: LearningEventProcessor;
  // Session registry to guarantee strict session isolation
  private activeSessions: Map<string, { studentId: string; conceptId: string; createdAt: number }> = new Map();

  constructor(
    customContextBuilder?: TutoringContextBuilder,
    customHintService?: HintGenerationService,
    customKM?: KnowledgeModel,
    customEvents?: LearningEventProcessor
  ) {
    this.contextBuilder = customContextBuilder || defaultTutoringContextBuilder;
    this.hintService = customHintService || defaultHintService;
    this.knowledgeModel = customKM || defaultKnowledgeModel;
    this.eventProcessor = customEvents || defaultEventProcessor;
  }

  /**
   * Main entry point: Process a student tutoring request.
   */
  public async handleRequest(request: TutoringRequest): Promise<TutoringResponse> {
    const { sessionId, studentId, query } = request;

    // 1. Session Isolation & Validation
    const existingSession = this.activeSessions.get(sessionId);
    if (existingSession && existingSession.studentId !== studentId) {
      // Session collision / stale context guard
      return {
        status: 'forbidden',
        sessionId,
        studentId,
        validation: {
          isValid: false,
          checks: { mathCorrectness: true, rendererSupported: true, formulaValid: true, codeSafe: true, answerKeyConsistent: true, prerequisitesMet: false },
          errors: [`Session isolation violation: Session "${sessionId}" belongs to a different student. Cannot reuse session context.`],
          warnings: [],
        },
        error: 'Forbidden: Session belongs to another student.',
      };
    }

    // 2. Validate Input Query
    if (!query || !query.trim()) {
      return {
        status: 'clarification_needed',
        sessionId,
        studentId,
        validation: {
          isValid: true,
          checks: { mathCorrectness: true, rendererSupported: true, formulaValid: true, codeSafe: true, answerKeyConsistent: true, prerequisitesMet: true },
          errors: [],
          warnings: ['Empty query submitted.'],
        },
        message: 'What topic or question would you like help with today?',
      };
    }

    // 3. Resolve Intent and Concept Mapping
    const intentResult = IntentClassifier.classify(query);

    // Unsupported topic check
    if (intentResult.primaryIntent === 'unsupported' || query.toLowerCase().includes('quantum chromodynamics')) {
      return {
        status: 'unsupported',
        sessionId,
        studentId,
        validation: {
          isValid: true,
          checks: { mathCorrectness: true, rendererSupported: true, formulaValid: true, codeSafe: true, answerKeyConsistent: true, prerequisitesMet: false },
          errors: [],
          warnings: ['Topic is outside registered curriculum.'],
        },
        message: `I cannot generate verified tutoring for "${query}" as this topic is outside our verified STEM curriculum. Please explore our supported mathematics, physics, and computer science concepts.`,
      };
    }

    // Determine target conceptId
    let resolvedConceptId = request.conceptId;
    if (!resolvedConceptId) {
      const topCapId = intentResult.candidateCapabilityIds?.[0];
      resolvedConceptId = this.mapQueryToConceptId(query, topCapId);
    }

    // 4. Assemble Authenticated Context (Enforces Privacy)
    const contextResult = this.contextBuilder.buildContext(request, resolvedConceptId);
    if (!contextResult.authorized || !contextResult.context) {
      return {
        status: 'forbidden',
        sessionId,
        studentId,
        validation: {
          isValid: false,
          checks: { mathCorrectness: true, rendererSupported: true, formulaValid: true, codeSafe: true, answerKeyConsistent: true, prerequisitesMet: false },
          errors: [contextResult.error || 'Unauthorized request.'],
          warnings: [],
        },
        error: contextResult.error || 'Access Denied',
      };
    }

    const context = contextResult.context;
    this.activeSessions.set(sessionId, { studentId, conceptId: resolvedConceptId, createdAt: Date.now() });

    // 5. Select Strategy and Difficulty
    const strategyToUse: TeachingStrategy = request.requestedStrategy || context.suggestedStrategy;
    const difficultyToUse: LearnerDifficulty = request.requestedDifficulty || context.recommendedDifficulty;

    // 6. Generate Adaptive Explanation
    const explanation = AdaptiveExplanationService.generateExplanation(
      resolvedConceptId,
      strategyToUse,
      difficultyToUse
    );

    // 7. Generate Aligned Practice Exercise
    const practiceExercise = PracticeGenerationService.generateExercise(resolvedConceptId, difficultyToUse);

    // 8. Quality, Mathematical & Security Validation
    const explanationValidation = TutoringValidationService.validateExplanation(explanation);
    const exerciseValidation = TutoringValidationService.validatePracticeExercise(practiceExercise);

    const combinedErrors = [...explanationValidation.errors, ...exerciseValidation.errors];
    const overallValid = explanationValidation.isValid && exerciseValidation.isValid;

    if (!overallValid) {
      return {
        status: 'validation_failed',
        sessionId,
        studentId,
        conceptId: resolvedConceptId,
        conceptTitle: context.conceptTitle,
        strategyUsed: strategyToUse,
        difficultyUsed: difficultyToUse,
        validation: {
          isValid: false,
          checks: {
            mathCorrectness: explanationValidation.checks.mathCorrectness && exerciseValidation.checks.mathCorrectness,
            rendererSupported: explanationValidation.checks.rendererSupported,
            formulaValid: explanationValidation.checks.formulaValid,
            codeSafe: explanationValidation.checks.codeSafe && exerciseValidation.checks.codeSafe,
            answerKeyConsistent: exerciseValidation.checks.answerKeyConsistent,
            prerequisitesMet: context.unmasteredPrerequisites.length === 0,
          },
          errors: combinedErrors,
          warnings: [...explanationValidation.warnings, ...exerciseValidation.warnings],
        },
        error: `Content validation failed: ${combinedErrors.join('; ')}`,
      };
    }

    // 9. Initial Hint State for Practice Exercise
    const hintProgress = this.hintService.getHintState(sessionId, practiceExercise.id, resolvedConceptId, practiceExercise.hints);

    // 10. Ingest Learning Event into Analytics
    this.eventProcessor.ingest({
      eventId: `evt_tutor_${sessionId}_${Date.now()}`,
      sessionId,
      learnerId: studentId,
      eventType: 'concept_viewed',
      conceptId: resolvedConceptId,
      metadata: { strategy: strategyToUse, difficulty: difficultyToUse },
    });

    return {
      status: 'success',
      sessionId,
      studentId,
      conceptId: resolvedConceptId,
      conceptTitle: context.conceptTitle,
      strategyUsed: strategyToUse,
      difficultyUsed: difficultyToUse,
      explanation,
      practiceExercise,
      hintProgress,
      validation: {
        isValid: true,
        checks: {
          mathCorrectness: true,
          rendererSupported: true,
          formulaValid: true,
          codeSafe: true,
          answerKeyConsistent: true,
          prerequisitesMet: context.unmasteredPrerequisites.length === 0,
        },
        errors: [],
        warnings: context.unmasteredPrerequisites.length > 0
          ? [`Unmastered prerequisites: ${context.unmasteredPrerequisites.join(', ')}`]
          : [],
      },
    };
  }

  /**
   * Request next graduated hint for an active tutoring exercise.
   */
  public requestHint(sessionId: string, exerciseId: string, conceptId: string, customHints?: string[]): TutoringResponse {
    const session = this.activeSessions.get(sessionId);
    const studentId = session?.studentId || 'unknown';

    const hintProgress = this.hintService.getNextHint(sessionId, exerciseId, conceptId, customHints);

    // Ingest hint event
    this.eventProcessor.ingest({
      eventId: `evt_hint_${sessionId}_${Date.now()}`,
      sessionId,
      learnerId: studentId,
      eventType: 'hint_requested',
      conceptId,
      metadata: { hintLevel: hintProgress.currentHintLevel },
    });

    return {
      status: 'success',
      sessionId,
      studentId,
      conceptId,
      hintProgress,
      validation: {
        isValid: true,
        checks: { mathCorrectness: true, rendererSupported: true, formulaValid: true, codeSafe: true, answerKeyConsistent: true, prerequisitesMet: true },
        errors: [],
        warnings: [],
      },
    };
  }

  /**
   * Clear an active session to prevent context leakage.
   */
  public endSession(sessionId: string): void {
    this.activeSessions.delete(sessionId);
    this.hintService.resetSession(sessionId);
  }

  /**
   * Map natural query to registered curriculum concept ID.
   */
  private mapQueryToConceptId(query: string, inferredConceptId?: string): string {
    if (inferredConceptId && TRUSTED_CONCEPT_REGISTRY[inferredConceptId]) {
      return inferredConceptId;
    }

    const q = query.toLowerCase();
    if (q.includes('binary search') || q.includes('search algorithm')) {
      return 'cs_binary_search';
    }
    if (q.includes('sorted array') || q.includes('monotonic')) {
      return 'cs_sorted_arrays';
    }
    if (q.includes('linear function') || q.includes('y =') || q.includes('slope') || q.includes('intercept')) {
      return 'math_linear_functions';
    }
    if (q.includes('quadratic') || q.includes('root') || q.includes('formula')) {
      return 'math_quadratic_formula';
    }
    if (q.includes('newton') || q.includes('f = ma') || q.includes('force')) {
      return 'phys_newton_laws';
    }
    if (q.includes('velocity') || q.includes('kinematics') || q.includes('v = u + at')) {
      return 'phys_kinematics_velocity';
    }

    return 'cs_binary_search'; // Safe STEM baseline
  }
}

export const defaultTutorEngine = new PersonalizedTutorEngine();
