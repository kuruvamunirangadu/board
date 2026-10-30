/**
 * VisiOS — Central Learning Orchestrator & Multi-Engine Router
 * Routes student topic submissions through an intelligent, validated multi-engine workflow:
 * 1. TopicClassifier determines domain, intent, engine, and confidence.
 * 2. Routes to the targeted engine:
 *    - 'simulation': Interactive physics simulations (e.g. "simulate a pendulum", vector dynamics)
 *    - 'algorithm': Computer Science algorithms and data structures (e.g. "binary search", "data structures")
 *    - 'math': Mathematical equations, binomial identities, and physical laws (e.g. "quadratic formula", "F = ma")
 *    - 'knowledge': Wikipedia factual retrieval and source attribution (e.g. "Alan Turing", "photosynthesis")
 *    - 'clarification': Honest uncertainty state for ambiguous/unknown expressions (no fabricated derivations)
 *    - 'local_ai': Local Ollama semantic synthesis for freeform concepts
 * 3. Enforces semantic relevance validation to prevent arbitrary parameters (no k = 1) or mismatched renderers.
 */

import {
  LearningPlan,
  InputInterpretation,
  SourceAttribution,
  TopicClassificationResult,
} from './types';
import { UniversalInputInterpreter } from './UniversalInputInterpreter';
import { LearningPlanGenerator } from './LearningPlanGenerator';
import { AIModelAdapter } from './AIModelAdapter';
import { TopicClassifier } from './TopicClassifier';
import { DomainKnowledgeEngine } from './DomainKnowledgeEngine';
import { UniversalProblemSolver } from './UniversalProblemSolver';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { KnowledgeApiResult } from '../knowledge/knowledge-client';
import { LearningPlanValidator } from './LearningPlanValidator';
import { VisualizationRegistry } from './VisualizationRegistry';
import { SubjectRegistry } from './SubjectRegistry';
import { LessonLibraryService } from './LessonLibraryService';
import {
  LearningRequest,
  LearningResponse,
  LearningError,
  UnifiedLearningContracts,
} from './UnifiedLearningContracts';
import { EngineCapabilityRegistry } from './EngineCapabilityRegistry';
import { IntentClassifier } from './IntentClassifier';
import { MultiIntentPlanner } from './MultiIntentPlanner';
import { DisambiguationContext } from './InputIntelligenceTypes';

export interface OrchestrationResult {
  plan: LearningPlan;
  classification: TopicClassificationResult;
  routeTaken:
    | 'simulation_engine'
    | 'algorithm_engine'
    | 'math_engine'
    | 'wikipedia_and_ai'
    | 'local_ai_synthesizer'
    | 'honest_uncertainty'
    | 'unsupported_input'
    | 'deterministic_stem'
    | 'authored_lesson_library';
  processingTimeMs: number;
}

export class LearningOrchestrator {
  private static readonly MAX_INPUT_LENGTH = 300;

  /**
   * Helper to strip conversational prefixes and suffixes from student prompts
   * (e.g. "Explain isolation levels in database transactions with an example." -> "isolation levels in database transactions")
   */
  public static extractCoreTopic(raw: string): string {
    let cleaned = (raw || '').trim();
    // Do not alter concise mathematical formulas or physical expressions
    if (/[=+\-*/^]/.test(cleaned) && cleaned.length < 35 && !/\b(explain|teach|what|how|show)\b/i.test(cleaned)) {
      return cleaned;
    }
    // Strip common conversational prefixes
    cleaned = cleaned.replace(/^(can\s+you\s+)?(please\s+)?(explain|teach\s+me|tell\s+me\s+about|what\s+is|what\s+are|how\s+does|how\s+do|show\s+me|demonstrate|visualize|describe)\s+/i, '');
    // Strip common conversational suffixes
    cleaned = cleaned.replace(/\s+(with\s+(an?\s+)?example|from\s+the\s+basics|in\s+detail|step\s+by\s+step|visually|please)[.?!]?$/i, '');
    // Clean trailing punctuation
    cleaned = cleaned.replace(/[.?!]+$/, '').trim();
    return cleaned || raw.trim();
  }

  /**
   * Phase 1: Unified Canonical Learning Pipeline
   * Takes a structured LearningRequest, verifies genuine engine capabilities,
   * executes domain calculations and models deterministically, validates outputs,
   * and delivers a structured LearningResponse.
   */
  public static async executeRequest(rawRequest: LearningRequest | string): Promise<LearningResponse> {
    const startTime = Date.now();

    // 1. Normalize and validate incoming request
    const request = typeof rawRequest === 'string'
      ? UnifiedLearningContracts.createLearningRequest(rawRequest)
      : rawRequest;

    const validation = UnifiedLearningContracts.validateLearningRequest(request);
    if (!validation.isValid || !validation.request) {
      return UnifiedLearningContracts.createErrorResponse(request, {
        code: 'INVALID_INPUT',
        message: validation.errors.join('; ') || 'Invalid input query.',
        recoverable: false,
      });
    }

    const validRequest = validation.request;

    // 2. Phase 2: Classify intent and handle clarification / unsupported / multi-intent early exits
    const disambiguationCtx: DisambiguationContext = {
      subject: validRequest.context?.subject,
      activeLessonId: validRequest.context?.activeLessonId,
      documentId: validRequest.context?.documentId,
      selectedCanvasObjectId: validRequest.context?.selectedCanvasObjectId,
      workspaceId: validRequest.context?.workspaceId,
    };
    const interpretedIntent = IntentClassifier.classify(validRequest.input, disambiguationCtx);

    // 2a. If IntentClassifier requests clarification (ambiguous / malformed / empty), surface it
    if (interpretedIntent.primaryIntent === 'clarify_request' || interpretedIntent.isAmbiguous) {
      return UnifiedLearningContracts.createErrorResponse(validRequest, {
        code: 'CLARIFICATION_REQUIRED',
        message: interpretedIntent.ambiguityReason || interpretedIntent.limitations[0] || 'Please clarify your request.',
        recoverable: true,
        details: interpretedIntent.suggestedAction,
      });
    }

    // 2b. If IntentClassifier marks topic as unsupported, return honest response
    if (interpretedIntent.primaryIntent === 'unsupported') {
      return UnifiedLearningContracts.createErrorResponse(validRequest, {
        code: 'UNSUPPORTED_CAPABILITY',
        message: interpretedIntent.limitations[0] || `"${validRequest.input}" is not supported by any verified engine.`,
        recoverable: false,
        details: interpretedIntent.suggestedAction,
      });
    }

    // 2c. If multi-intent detected, build the execution plan and attach it to metadata
    const executionPlan = (interpretedIntent.additionalIntents && interpretedIntent.additionalIntents.length > 0)
      ? MultiIntentPlanner.buildPlan(interpretedIntent)
      : null;

    // 3. Resolve capability from authoritative EngineCapabilityRegistry
    const capabilityResolution = EngineCapabilityRegistry.resolveCapability(validRequest);
    if (!capabilityResolution.isSupported || !capabilityResolution.capability) {
      return UnifiedLearningContracts.createErrorResponse(validRequest, {
        code: 'UNSUPPORTED_CAPABILITY',
        message: capabilityResolution.reason || `Query "${validRequest.input}" is not supported by any verified engine capability.`,
        recoverable: false,
      });
    }

    // 4. Coordinate engine execution via processTopic
    try {
      const orchestrated = await this.processTopic(validRequest.input);

      // If preferences specify preferred visualization, adapt visualization if compatible
      if (validRequest.preferences?.preferredVisualization && orchestrated.plan.visualizationPlan) {
        orchestrated.plan.visualizationPlan.rendererType = validRequest.preferences.preferredVisualization as any;
      }

      // Convert to standardized LearningResponse
      const response = UnifiedLearningContracts.planToLearningResponse(
        orchestrated.plan,
        orchestrated.classification,
        orchestrated.routeTaken,
        Date.now() - startTime,
        validRequest.requestId
      );

      // Attach capability metadata
      response.metadata.capabilityId = capabilityResolution.capability.id;
      response.metadata.capabilityLevel = capabilityResolution.capability.level;

      // Attach Phase 2 intent routing metadata
      response.metadata.intentClassification = interpretedIntent.primaryIntent;
      response.metadata.routingOutcome = 'success';
      response.metadata.isMultiIntent = executionPlan?.isMultiIntent ?? false;
      if (executionPlan) {
        (response.metadata as any).executionPlan = executionPlan;
      }

      // Generate context-aware recommendations if available
      if (orchestrated.plan.prerequisites && orchestrated.plan.prerequisites.length > 0) {
        response.recommendations = orchestrated.plan.prerequisites.map((prereq) => ({
          label: `Prerequisite: ${prereq}`,
          action: 'explore_prerequisite',
          topicQuery: prereq,
          description: `Master ${prereq} before diving deeper into ${response.topic.title}.`,
        }));
      }

      return response;
    } catch (err: any) {
      return UnifiedLearningContracts.createErrorResponse(validRequest, {
        code: 'ENGINE_EXECUTION_FAILED',
        message: err?.message || 'Domain engine execution encountered an unexpected failure.',
        recoverable: true,
        details: String(err),
      });
    }
  }

  /**
   * Main unified entry point for Canvas HUD and Workspace topic submissions.
   */
  public static async processTopic(rawInput: string): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const trimmed = (rawInput || '').trim();

    // 1. Input Validation
    if (!trimmed) {
      const emptyPlan = LearningPlanGenerator.generatePlan('');
      const defaultClassification = TopicClassifier.classify('');
      const defaultSubject = SubjectRegistry.resolveSubjectForDomain(defaultClassification.domain);
      emptyPlan.classification = defaultClassification;
      emptyPlan.subjectId = defaultSubject.id;
      emptyPlan.subjectDefinition = defaultSubject;
      emptyPlan.learningStrategy = defaultSubject.learningStrategy;
      return {
        plan: emptyPlan,
        classification: defaultClassification,
        routeTaken: 'unsupported_input',
        processingTimeMs: Date.now() - startTime,
      };
    }

    const boundedInput =
      trimmed.length > this.MAX_INPUT_LENGTH
        ? trimmed.slice(0, this.MAX_INPUT_LENGTH)
        : trimmed;

    const coreTopic = this.extractCoreTopic(boundedInput);

    // 2. Intelligent Topic Classification & Subject Registry Resolution
    // Try classifying coreTopic first, fallback to raw input if needed
    let classification = TopicClassifier.classify(coreTopic);
    if (classification.domain === 'other' || classification.requiresClarification) {
      const rawClassification = TopicClassifier.classify(boundedInput);
      if (!rawClassification.requiresClarification) {
        classification = rawClassification;
      }
    }
    const subjectDef = SubjectRegistry.resolveSubjectForDomain(classification.domain);

    // ROUTE 0: Check whether an applicable approved published authored lesson exists
    const publishedLesson =
      (await LessonLibraryService.findMatchingPublishedLesson(coreTopic)) ||
      (await LessonLibraryService.findMatchingPublishedLesson(boundedInput));
    if (publishedLesson) {
      const authoredPlan = LessonLibraryService.toLearningPlan(publishedLesson);
      const authoredClassification: TopicClassificationResult = {
        ...classification,
        engine: 'knowledge',
        confidence: 1.0,
      };
      authoredPlan.classification = authoredClassification;
      this.validateSemanticRelevance(authoredPlan, authoredClassification);

      return {
        plan: authoredPlan,
        classification: authoredClassification,
        routeTaken: 'authored_lesson_library',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE A: Ambiguous query or required clarification
    if (classification.requiresClarification || classification.engine === 'clarification') {
      const interp = UniversalInputInterpreter.interpret(boundedInput);
      interp.isAmbiguous = true;
      if (classification.reason) interp.ambiguityReason = classification.reason;
      if (classification.suggestedClarifications) {
        interp.clarificationOptions = classification.suggestedClarifications.map((s) => ({
          label: s,
          interpretation: s,
        }));
      }

      const uncertainPlan = this.buildUncertaintyPlan(interp);
      uncertainPlan.classification = classification;
      uncertainPlan.subjectId = subjectDef.id;
      uncertainPlan.subjectDefinition = subjectDef;
      uncertainPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(uncertainPlan, classification);

      return {
        plan: uncertainPlan,
        classification,
        routeTaken: 'honest_uncertainty',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE B: Interactive Physics Simulation (e.g. "simulate a pendulum")
    if (classification.engine === 'simulation' && subjectDef.capabilities.hasInteractiveSimulation) {
      const interp = UniversalInputInterpreter.interpret(boundedInput);
      const simPlan = LearningPlanGenerator.generatePlan(interp);
      simPlan.classification = classification;
      simPlan.subjectId = subjectDef.id;
      simPlan.subjectDefinition = subjectDef;
      simPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(simPlan, classification);

      return {
        plan: simPlan,
        classification,
        routeTaken: 'simulation_engine',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE C: Computer Science Algorithms & Data Structures (e.g. "binary search", "data structures")
    if (classification.engine === 'algorithm' && subjectDef.capabilities.hasAlgorithmTracer) {
      const interp = UniversalInputInterpreter.interpret(boundedInput);
      const algoPlan = LearningPlanGenerator.generatePlan(interp);
      algoPlan.classification = classification;
      algoPlan.subjectId = subjectDef.id;
      algoPlan.subjectDefinition = subjectDef;
      algoPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(algoPlan, classification);

      return {
        plan: algoPlan,
        classification,
        routeTaken: 'algorithm_engine',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE D: Mathematics & Physical Laws (e.g. "F = ma", "quadratic formula", "(a+b)^2")
    if (classification.engine === 'math' && subjectDef.capabilities.hasCalculationEngine) {
      const interp = UniversalInputInterpreter.interpret(boundedInput);
      const mathPlan = LearningPlanGenerator.generatePlan(interp);
      mathPlan.classification = classification;
      mathPlan.subjectId = subjectDef.id;
      mathPlan.subjectDefinition = subjectDef;
      mathPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(mathPlan, classification);

      return {
        plan: mathPlan,
        classification,
        routeTaken: 'math_engine',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE E: Factual Knowledge Layer: Real-World Entity / Concept (Wikipedia)
    let knowledgeData: KnowledgeApiResult | null = null;
    const queryTarget = coreTopic || boundedInput;
    try {
      const isBrowser = typeof window !== 'undefined';
      const knowledgeEndpoint = isBrowser
        ? `/api/knowledge?q=${encodeURIComponent(queryTarget)}`
        : `http://127.0.0.1:3000/api/knowledge?q=${encodeURIComponent(queryTarget)}`;

      const res = await fetch(knowledgeEndpoint, {
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        knowledgeData = await res.json();
      }
    } catch {
      // Network timeout - proceed to fallback check
    }

    // Direct backend fallback in Node / test environment if loopback fetch was unavailable
    if (!knowledgeData && typeof window === 'undefined') {
      try {
        const { handleKnowledgeQuery } = await import('../knowledge/knowledge-client');
        knowledgeData = (await handleKnowledgeQuery(queryTarget)) || (await handleKnowledgeQuery(boundedInput));
      } catch {
        // Proceed to local AI fallback
      }
    }

    const interp = UniversalInputInterpreter.interpret(coreTopic || boundedInput);

    // Formulate Plan with Factual Knowledge & Local AI
    if (knowledgeData && knowledgeData.found && knowledgeData.bestMatch) {
      const match = knowledgeData.bestMatch;
      const basePlan = LearningPlanGenerator.generatePlan(interp);

      const attribution: SourceAttribution = {
        source: knowledgeData.attribution.source,
        title: match.title,
        extract: match.extract,
        url: match.url,
        thumbnail: match.thumbnail?.source || null,
        license: knowledgeData.attribution.license,
        retrievalTimestamp: knowledgeData.retrievalTimestamp,
      };

      basePlan.title = match.title;
      basePlan.subject = subjectDef.displayName;
      basePlan.subjectId = subjectDef.id;
      basePlan.subjectDefinition = subjectDef;
      basePlan.learningStrategy = subjectDef.learningStrategy;
      basePlan.overview = match.extract;
      basePlan.motivation = `Understanding ${match.title}: ${match.extract.slice(0, 200)}...`;
      basePlan.sourceAttribution = attribution;
      basePlan.capabilityLevel = subjectDef.capabilities.capabilityLevel;
      basePlan.disclosures = [
        `Externally sourced reference content via ${knowledgeData.attribution.source}. Independent curriculum review recommended.`,
      ];

      // Add subject-specific terminology when available
      if (classification.domain === 'biology') {
        basePlan.terminology = [
          { term: 'Chloroplast', definition: 'Plant cell organelle where photosynthesis takes place' },
          { term: 'Thylakoid', definition: 'Membrane-bound compartment where light-dependent reactions occur' },
          { term: 'Chlorophyll', definition: 'Light-absorbing green pigment in Photosystems I & II' },
          { term: 'RuBisCO', definition: 'Primary enzyme catalyzing carbon fixation in the Calvin cycle' },
        ];
      } else if (classification.domain === 'chemistry') {
        basePlan.terminology = [
          { term: 'Electronegativity', definition: 'Tendency of an atom to attract shared electron pairs' },
          { term: 'Covalent Bond', definition: 'Chemical bond involving sharing of electron pairs' },
          { term: 'Ionic Bond', definition: 'Electrostatic attraction between oppositely charged ions' },
          { term: 'Octet Rule', definition: 'Tendency of atoms to achieve stable eight valence electrons' },
        ];
      }

      // Generate structural milestones grounded in externally sourced reference content
      const rawSentences = match.extract
        .split(/(?<=[.?!])\s+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 15);

      const s1 = rawSentences[0] || `${match.title} is an authoritative subject in ${subjectDef.displayName}.`;
      const s2 = rawSentences[1] || `${match.title} formalizes critical relationships, principles, and operations.`;
      const s3 = rawSentences[2] || rawSentences.slice(1).join(' ') || `Provides foundational understanding and systematic domain impact.`;

      const lowerBounded = boundedInput.toLowerCase();
      const isPoliticalCivic =
        lowerBounded.includes('minister') ||
        lowerBounded.includes('president') ||
        lowerBounded.includes('parliament') ||
        lowerBounded.includes('congress') ||
        lowerBounded.includes('supreme court') ||
        lowerBounded.includes('constitution') ||
        lowerBounded.includes('governance');

      let step1Title = 'Core Definition & Principles';
      let step1Rationale = 'Fundamental definition, axiomatic scope, and domain classification.';
      let step2Title = 'Structural Dynamics & Operations';
      let step2Rationale = 'Key mechanisms, functional operations, and relationships.';
      let step3Title = 'Real-World Applications & Impact';
      let step3Rationale = 'Applied problem solving, empirical significance, and domain impact.';
      let prerequisites = [`Foundations of ${subjectDef.displayName}`, 'Core Terminology & Axioms', 'Applied Context'];

      if (isPoliticalCivic) {
        step1Title = match.description
          ? match.description.charAt(0).toUpperCase() + match.description.slice(1)
          : 'Core Identity & Official Status';
        step1Rationale = 'Primary constitutional / encyclopedic definition and domain classification.';
        step2Title = 'Functional Mandate & Executive Operations';
        step2Rationale = 'Organizational framework, statutory powers, and procedural mechanics.';
        step3Title = 'Historical Context & Real-World Impact';
        step3Rationale = 'Demonstrated societal significance, continuity of governance, and practical outcomes.';
        prerequisites = [
          `Foundations of ${subjectDef.displayName}`,
          'Institutional Framework & Governance',
          'Contemporary Historical Context',
        ];
      } else if (classification.domain === 'mathematics') {
        step1Title = 'Axiomatic Definition & Symbolic Identity';
        step1Rationale = 'Formal mathematical definition and foundational symbolic representation.';
        step2Title = 'Geometric & Coordinate Properties';
        step2Rationale = 'Spatial interpretation, geometric properties, or coordinate relationships.';
        step3Title = 'Computational Formulation & Proof';
        step3Rationale = 'Algorithmic calculation, problem solving, and analytical proof.';
        prerequisites = ['Arithmetic & Number Sense', 'Algebraic Operations', 'Foundations of Geometry'];
      } else if (classification.domain === 'computer_science') {
        step1Title = 'Memory Layout & Structural Invariants';
        step1Rationale = 'Data organization in memory, pointer references, and structure constraints.';
        step2Title = 'Core Operations & Traversal Mechanics';
        step2Rationale = 'Traversal procedures, state transitions, and manipulation logic.';
        step3Title = 'Asymptotic Complexity & Trade-offs';
        step3Rationale = 'Time and space complexity bounds (Big-O analysis) and practical trade-offs.';
        prerequisites = ['Data Representation & Variables', 'Pointers & References', 'Algorithmic Complexity'];
      } else if (classification.domain === 'physics') {
        step1Title = 'Governing Physical Law & Equation';
        step1Rationale = 'Fundamental conservation principle and mathematical law.';
        step2Title = 'Variable Dynamics & Dimensional Units';
        step2Rationale = 'Rate of change, vector quantities, and dimensional unit balance.';
        step3Title = 'Empirical Verification & Physical Systems';
        step3Rationale = 'Observable physical phenomenon, measurement, and experimental validation.';
        prerequisites = ['Scientific Measurement & Units', 'Vector Algebra', 'Newtonian Mechanics'];
      } else if (classification.domain === 'chemistry' || classification.domain === 'biology') {
        step1Title = 'Molecular / Cellular Structure & Identity';
        step1Rationale = 'Constituent components, structural organization, and classification.';
        step2Title = 'Biochemical Pathway & Reaction Mechanism';
        step2Rationale = 'Dynamic transformation, electron exchange, or biological process.';
        step3Title = 'Biological Function & Systemic Significance';
        step3Rationale = 'Physiological role, energy transformation, and scientific relevance.';
        prerequisites = ['Basic Scientific Principles', 'Molecular Theory', 'Cellular Foundations'];
      }

      basePlan.derivationSummary = `Structural domain breakdown and reference overview of ${match.title}.`;
      basePlan.derivationSteps = [
        {
          stepNumber: 1,
          expression: step1Title,
          explanation: s1,
          rationale: step1Rationale,
          verificationStatus: 'curriculum_trusted',
        },
        {
          stepNumber: 2,
          expression: step2Title,
          explanation: s2,
          rationale: step2Rationale,
          verificationStatus: 'curriculum_trusted',
        },
        {
          stepNumber: 3,
          expression: step3Title,
          explanation: s3,
          rationale: step3Rationale,
          verificationStatus: 'curriculum_trusted',
        },
      ];

      basePlan.symbolicVerificationNote = `Externally sourced reference content from ${attribution.source} documentation.`;
      basePlan.prerequisites = prerequisites;

      // Remove any fake math parameters and fake calculations
      basePlan.variables = [];
      basePlan.interactiveParameters = [];
      basePlan.defaultExperimentState = {
        parameters: {},
        calculatedOutputs: {
          topic: match.title,
          summary: match.description || 'Verified Entity',
        },
        outputFormulas: {},
        statusMessage: 'Factual knowledge entity (no numerical calculation required).',
      };

      // Worked example representing factual context
      basePlan.workedExamples = [
        {
          title: `Study Overview: ${match.title}`,
          problemStatement: `What is the significance and historical or operational role of ${match.title}?`,
          givenValues: { subject: match.title, classification: match.description || 'Encyclopedia Topic' },
          stepByStepSolution: [
            `1. Subject Classification: ${match.title} (${match.description || 'Topic'})`,
            `2. Summary: ${match.extract.slice(0, 160)}...`,
            `3. Verified Source: ${attribution.source}`,
          ],
          finalAnswer: `Documented in official records at ${match.url}`,
        },
      ];

      basePlan.applications = [
        `Primary Source Documentation: ${match.url}`,
        'Integrated across academic research, encyclopedic knowledge, and contextual study.',
      ];

      basePlan.assumptions = [
        `Historical and factual consensus as documented by ${attribution.source}`,
        'Content licensed under Creative Commons Attribution-ShareAlike',
      ];

      basePlan.visualizationPlan = {
        rendererType: subjectDef.defaultRendererType,
        title: `${match.title} Knowledge Overview`,
        description: `Conceptual domain summary of ${match.title} backed by ${attribution.source}.`,
        learningObjective: `Explore factual background, timeline, and significance of ${match.title}.`,
        activeVariables: [],
        interactionsAvailable: ['Inspect verified summary', 'Follow source reference link'],
        expectedBehavior: 'Displays verified factual overview and external source attribution link.',
        fallbackAvailable: true,
      };

      basePlan.classification = classification;
      this.validateSemanticRelevance(basePlan, classification);

      return {
        plan: basePlan,
        classification,
        routeTaken: 'wikipedia_and_ai',
        processingTimeMs: Date.now() - startTime,
      };
    }

    // ROUTE F: Semantic Interpretation via Local Ollama (AIModelAdapter)
    try {
      const aiPlan = await AIModelAdapter.generateLearningPlan(interp);
      aiPlan.classification = classification;
      aiPlan.subjectId = subjectDef.id;
      aiPlan.subjectDefinition = subjectDef;
      aiPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(aiPlan, classification);

      return {
        plan: aiPlan,
        classification,
        routeTaken: 'local_ai_synthesizer',
        processingTimeMs: Date.now() - startTime,
      };
    } catch {
      // ROUTE G: Graceful Deterministic Fallback without fake k = 1
      const fallbackPlan = LearningPlanGenerator.generatePlan(interp);
      fallbackPlan.classification = classification;
      fallbackPlan.subjectId = subjectDef.id;
      fallbackPlan.subjectDefinition = subjectDef;
      fallbackPlan.learningStrategy = subjectDef.learningStrategy;
      this.validateSemanticRelevance(fallbackPlan, classification);

      return {
        plan: fallbackPlan,
        classification,
        routeTaken: 'unsupported_input',
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Enforces strict schema and topic relevance validation with at most one bounded repair attempt.
   */
  public static ensureValidatedPlan(
    plan: LearningPlan,
    rawInput: string,
    classification: TopicClassificationResult
  ): LearningPlan {
    // 1. Initial schema & relevance validation
    const schemaCheck = LearningPlanValidator.validateSchema(plan);
    const relevanceCheck = LearningPlanValidator.validateRelevance(plan, rawInput, classification);

    if (schemaCheck.isValid && relevanceCheck.isRelevant) {
      return plan;
    }

    // 2. Single bounded repair attempt with specific corrective feedback
    const combinedIssues = [
      ...schemaCheck.errors.map((e) => `${e.field}: ${e.message}`),
      ...relevanceCheck.issues,
    ];

    const repaired = LearningPlanValidator.repairPlan(plan, rawInput, combinedIssues, classification);

    // 3. Verify repaired plan
    const repairedSchema = LearningPlanValidator.validateSchema(repaired);
    const repairedRelevance = LearningPlanValidator.validateRelevance(repaired, rawInput, classification);

    if (repairedSchema.isValid && repairedRelevance.isRelevant) {
      return repaired;
    }

    // 4. If repair still fails, return safe honest fallback rather than invalid/irrelevant content
    const interp = UniversalInputInterpreter.interpret(rawInput);
    interp.isAmbiguous = true;
    interp.ambiguityReason = `Validation notice: Plan required clarification (${combinedIssues.slice(0, 2).join('; ')}).`;
    const fallbackPlan = this.buildUncertaintyPlan(interp);
    fallbackPlan.classification = classification;
    return fallbackPlan;
  }

  /**
   * Backward-compatible helper enforcing semantic relevance and schema integrity.
   */
  public static validateSemanticRelevance(
    plan: LearningPlan,
    classification: TopicClassificationResult
  ): void {
    const validated = this.ensureValidatedPlan(plan, classification.originalQuery || plan.title, classification);
    // Mutate plan in-place to preserve any existing references
    Object.assign(plan, validated);
  }

  /**
   * Formulates an honest uncertainty learning plan without fabricating parameters or calculations.
   */
  private static buildUncertaintyPlan(interp: InputInterpretation): LearningPlan {
    const base = LearningPlanGenerator.generatePlan(interp);

    base.capabilityLevel = 'partial_with_limitations';
    base.title = interp.title;
    base.subject = interp.subject;
    base.overview = interp.summary;
    base.motivation =
      interp.ambiguityReason ||
      `The input "${interp.originalInput}" cannot be unambiguously mapped to a single formula or theorem.`;
    base.variables = [];
    base.interactiveParameters = [];
    base.uncertaintyState = {
      isUncertain: true,
      reason: interp.ambiguityReason,
      suggestedClarifications: (interp.clarificationOptions || []).map((o) => o.label),
    };

    base.derivationSteps = [];
    base.derivationSummary = 'No derivation steps available for ambiguous input.';
    base.symbolicVerificationNote = 'Mathematical verification requires unambiguous equation definition.';

    base.defaultExperimentState = {
      parameters: {},
      calculatedOutputs: {
        status: 'Unresolved',
        note: 'Clarification needed',
      },
      outputFormulas: {},
      statusMessage: interp.ambiguityReason || 'Please select a clarification option.',
    };

    base.workedExamples = (interp.clarificationOptions || []).map((opt) => ({
      title: `Candidate Meaning: ${opt.label}`,
      problemStatement: `Explore interpretation as "${opt.interpretation}".`,
      givenValues: { selected: opt.label },
      stepByStepSolution: [
        `1. Consider interpretation: ${opt.label}`,
        `2. Apply formula: ${opt.interpretation}`,
      ],
      finalAnswer: opt.interpretation,
    }));

    base.visualizationPlan = {
      rendererType: 'svg_schematic_fallback',
      title: 'Ambiguity & Clarification Guide',
      description: 'Select one of the standard candidate interpretations below to load verified models.',
      learningObjective: 'Clarify variable symbols and domain boundaries.',
      activeVariables: [],
      interactionsAvailable: ['Click clarification option to load verified model'],
      expectedBehavior: 'Awaiting student clarification.',
      fallbackAvailable: true,
    };

    return base;
  }
}
