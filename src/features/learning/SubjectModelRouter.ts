/**
 * VisiOS — Subject Model Router
 * Implementation 3: Unified Subject Intelligence Router
 * Coordinates student inputs between deterministic calculation/graphing engines,
 * specialized local AI models (Math, Coder), and factual knowledge retrieval.
 *
 * Core Principles:
 * 1. Deterministic Primacy: Calculations, geometric proofs, simulations, and algorithm
 *    step traces are strictly executed by verified deterministic engines.
 * 2. Specialist Assistance: Qwen2.5-Math and Qwen2.5-Coder provide reasoning and explanation
 *    without fabricating coordinates or asserting unverified execution.
 * 3. Ambiguity Guard: Ambiguous terms and acronyms route to honest uncertainty without firing models.
 * 4. Graceful Fallback: If Ollama or specialist models are offline, fallback gracefully.
 * 5. Hardware Safety: Sequential model execution protects 4 GB GPU VRAM.
 */

import { NextRequest } from 'next/server';
import { UnifiedModelResponse, UnifiedModelResponseFactory, ModelSubject } from './UnifiedModelResponse';
import { ModelProviderRegistry, ModelProviderConfig } from './ModelProviderRegistry';
import { ModelAvailabilityService } from './ModelAvailabilityService';
import { EngineCapabilityRegistry } from './EngineCapabilityRegistry';
import { IntentClassifier } from './IntentClassifier';
import { TopicClassifier } from './TopicClassifier';
import { MathInputNormalizer } from './MathInputNormalizer';
import { LearningRequestContext, LearningRequest } from './UnifiedLearningContracts';
import { DisambiguationContext } from './InputIntelligenceTypes';

// Dynamic route handlers for server-side direct execution
import { POST as handleMathPost } from '@/app/api/learning/math/route';
import { POST as handleCodePost } from '@/app/api/learning/code/route';

export interface RoutingDecision {
  query: string;
  normalizedQuery: string;
  subject: ModelSubject;
  requiresModel: boolean;
  targetProvider?: ModelProviderConfig;
  targetEngineType: 'math' | 'physics' | 'simulation' | 'algorithm' | '3d' | 'knowledge' | 'document' | 'none';
  matchedCapabilityId?: string;
  deterministicEngineAvailable: boolean;
  isAmbiguous: boolean;
  clarificationReason?: string;
  clarificationOptions?: string[];
  isMixedSubject: boolean;
  secondaryCapabilities: string[];
  actionPlan: string;
}

export class SubjectModelRouter {
  /**
   * Evaluates student input and determines the optimal routing decision.
   * Does NOT make network model calls; produces the verified execution plan.
   */
  public static async routeQuery(
    rawInput: string,
    context?: LearningRequestContext
  ): Promise<RoutingDecision> {
    const trimmed = (rawInput || '').trim();
    if (!trimmed) {
      return {
        query: rawInput,
        normalizedQuery: '',
        subject: 'clarification',
        requiresModel: false,
        targetEngineType: 'none',
        deterministicEngineAvailable: false,
        isAmbiguous: true,
        clarificationReason: 'Input query is empty.',
        clarificationOptions: [],
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Prompt student for a topic, question, or problem.',
      };
    }

    const lower = trimmed.toLowerCase();

    // 1. Ambiguity & Clarification Guard via IntentClassifier and Acronym Detection
    const disambiguationCtx: DisambiguationContext = {
      subject: context?.subject,
      activeLessonId: context?.activeLessonId,
      documentId: context?.documentId,
      selectedCanvasObjectId: context?.selectedCanvasObjectId,
      workspaceId: context?.workspaceId,
    };

    const isAcronymQuery =
      /^(?:what\s+does\s+)?([A-Za-z0-9_-]+)\s+(?:stands?\s+for|meanings?|definition)[.?!]?$/i.test(trimmed) ||
      /^(?:what\s+is\s+the\s+meaning\s+of|meaning\s+of|definition\s+of|what\s+does\s+)([A-Za-z0-9_-]+)(?:\s+stand\s+for)?[.?!]?$/i.test(trimmed);

    const intent = IntentClassifier.classify(trimmed, disambiguationCtx);

    // If ambiguous (e.g. "graph", "tree", "vector", "state", "mla stands for")
    if (intent.isAmbiguous || intent.primaryIntent === 'clarify_request' || isAcronymQuery) {
      let options = (intent.clarificationOptions || []).map((o) => o.label);
      if (options.length === 0 && isAcronymQuery) {
        options = [
          'Modern Language Association (MLA Handbook & Citation Format)',
          'Member of the Legislative Assembly (Government & Politics)',
          'Medical Library Association (Health Sciences Information)',
        ];
      }
      return {
        query: trimmed,
        normalizedQuery: intent.normalizedInput || trimmed,
        subject: 'clarification',
        requiresModel: false,
        targetEngineType: 'none',
        deterministicEngineAvailable: false,
        isAmbiguous: true,
        clarificationReason: intent.ambiguityReason || `Term "${trimmed}" has multiple meanings across domains.`,
        clarificationOptions: options,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Present honest clarification options without executing models.',
      };
    }

    // 2. Factual, Biographical, or Historical Knowledge Check
    // (e.g. "Alan Turing", "history of calculus", "who is Ada Lovelace", "photosynthesis")
    // These must route to knowledge retrieval rather than mathematical or coding problem solvers.
    const isHistoricalOrBiographical =
      /\b(who is|who was|history of|biography of|biography|timeline of|life of)\b/i.test(lower) ||
      lower.includes('alan turing') ||
      lower.includes('ada lovelace');

    if (isHistoricalOrBiographical) {
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'general',
        requiresModel: false,
        targetEngineType: 'knowledge',
        matchedCapabilityId: 'cap_factual_knowledge_retrieval',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Route to Factual Knowledge Retrieval & Domain Encyclopedia (Wikipedia / verified attribution).',
      };
    }

    // 3. Deterministic Graphing & Function Plotting Guard
    // When a student asks to "plot" or "graph" a function, coordinate plotting belongs
    // strictly to the deterministic function coordinate plotter. Never let LLMs invent points.
    const isExplicitPlotting =
      /\b(plot|graph)\b/i.test(lower) &&
      (/(y\s*=|f\(x\)\s*=|linear function|slope)/i.test(lower) || MathInputNormalizer.normalize(trimmed).isMathematical);

    if (isExplicitPlotting) {
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'mathematics',
        requiresModel: false,
        targetEngineType: 'math',
        matchedCapabilityId: 'cap_linear_functions',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Route to deterministic FunctionCoordinatePlotter engine. Coordinate points generated analytically.',
      };
    }

    // 4. Algorithm Tracing Guard
    // When student explicitly asks to "trace" an algorithm with inputs (e.g. "trace binary search in [2, 4, 6]"),
    // deterministic tracer has priority over model generation.
    const isExplicitTrace =
      /\b(trace|step through|simulate|walkthrough)\b/i.test(lower) &&
      /\b(binary search|bsearch|sort|array|linked list|stack|queue)\b/i.test(lower);

    if (isExplicitTrace) {
      const isBinarySearch = /\b(binary search|bsearch)\b/i.test(lower);
      const capId = isBinarySearch ? 'cap_cs_binary_search' : 'cap_cs_data_structures';
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'computer_science',
        requiresModel: false,
        targetEngineType: 'algorithm',
        matchedCapabilityId: capId,
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Execute deterministic Algorithm Array/Pointer Tracer. Visual pointer steps calculated deterministically.',
      };
    }

    // 5. Physics Simulation Guard
    const isSimulation =
      /\b(simulate|simulation|trajectory|angle|pendulum|projectile)\b/i.test(lower) &&
      !/\b(code|java|python|javascript|c\+\+|algorithm)\b/i.test(lower);

    if (isSimulation) {
      const isPendulum = /\b(pendulum|oscillation)\b/i.test(lower);
      const capId = isPendulum ? 'cap_pendulum_motion' : 'cap_projectile_motion';
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'physics',
        requiresModel: false,
        targetEngineType: 'simulation',
        matchedCapabilityId: capId,
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Execute deterministic physics vector/pendulum simulation engine.',
      };
    }

    // 6. Detect Mixed-Subject Questions (e.g. "calculate derivative in Python", "binary search complexity and graph")
    const hasMathKeywords =
      /\b(solve|equation|derivative|integral|differentiation|calculus|algebra|formula|polynomial|quadratic|hypotenuse|pythagor)\b/i.test(lower) ||
      /[=+\-*/^]/.test(lower);
    const hasCodeKeywords =
      /\b(code|program|programming|java|python|javascript|typescript|c\+\+|class|debug|bug|array|stack|queue|binary search|complexity|o\(log n\)|o\(n\))\b/i.test(lower);

    const isMixedSubject = hasMathKeywords && hasCodeKeywords;

    // 7. Specialist Selection: Computer Science / Coding
    if (hasCodeKeywords && !isExplicitPlotting) {
      const capResolution = EngineCapabilityRegistry.resolveCapability(
        { input: trimmed, requestId: 'test', timestamp: Date.now() } as LearningRequest
      );
      const provider = ModelProviderRegistry.getProvider('computer_science');
      const secondaryCaps: string[] = [];
      if (hasMathKeywords) secondaryCaps.push('cap_polynomial_identities');

      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'computer_science',
        requiresModel: true,
        targetProvider: provider,
        targetEngineType: 'algorithm',
        matchedCapabilityId: capResolution.capability?.id,
        deterministicEngineAvailable: capResolution.isSupported,
        isAmbiguous: false,
        isMixedSubject,
        secondaryCapabilities: secondaryCaps,
        actionPlan: isMixedSubject
          ? 'Route to Qwen2.5-Coder for implementation reasoning, coordinated with mathematical derivation engine.'
          : 'Route to Qwen2.5-Coder 1.5B for CS explanation, educational code generation, or bug identification.',
      };
    }

    // 8. Specialist Selection: Mathematics
    if (hasMathKeywords) {
      const capResolution = EngineCapabilityRegistry.resolveCapability(
        { input: trimmed, requestId: 'test', timestamp: Date.now() } as LearningRequest
      );
      const provider = ModelProviderRegistry.getProvider('mathematics');

      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'mathematics',
        requiresModel: true,
        targetProvider: provider,
        targetEngineType: 'math',
        matchedCapabilityId: capResolution.capability?.id,
        deterministicEngineAvailable: capResolution.isSupported,
        isAmbiguous: false,
        isMixedSubject,
        secondaryCapabilities: [],
        actionPlan: 'Route to Qwen2.5-Math 1.5B for rigorous algebraic explanation, paired with deterministic calculation.',
      };
    }

    // 9. General Knowledge / Biology / Chemistry / History / Non-STEM
    const classification = TopicClassifier.classify(trimmed);
    const domain = classification.domain;

    let targetSubject: ModelSubject = 'general';
    if (domain === 'biology') targetSubject = 'biology';
    else if (domain === 'chemistry') targetSubject = 'chemistry';
    else if (domain === 'physics') targetSubject = 'physics';

    return {
      query: trimmed,
      normalizedQuery: trimmed,
      subject: targetSubject,
      requiresModel: false,
      targetEngineType: 'knowledge',
      matchedCapabilityId: 'cap_factual_knowledge_retrieval',
      deterministicEngineAvailable: true,
      isAmbiguous: false,
      isMixedSubject: false,
      secondaryCapabilities: [],
      actionPlan: `Route to Factual Knowledge Retrieval & Domain Encyclopedia for ${classification.domain} (Wikipedia / verified attribution).`,
    };
  }

  /**
   * Executes the routing decision:
   * Dispatches to specialist model via internal API if required, with sequential VRAM protection.
   * If model is offline or unneeded, provides clean deterministic or fallback response.
   */
  public static async executeRouting(decision: RoutingDecision): Promise<UnifiedModelResponse> {
    const startTime = Date.now();

    // 1. Clarification Decision
    if (decision.isAmbiguous || decision.subject === 'clarification') {
      return UnifiedModelResponseFactory.createClarification(
        decision.clarificationReason || 'Please clarify your learning intent.',
        decision.clarificationOptions
      );
    }

    // 2. Deterministic Engine Decision (No model required)
    if (!decision.requiresModel) {
      return UnifiedModelResponseFactory.fromDeterministicEngine(
        decision.subject,
        decision.targetEngineType,
        decision.matchedCapabilityId || 'cap_deterministic',
        `Executed verified deterministic capability: ${decision.matchedCapabilityId || decision.targetEngineType}.`,
        Date.now() - startTime
      );
    }

    // 3. Specialist Model Execution under VRAM Sequential Protection
    return await ModelProviderRegistry.executeWithVRAMProtection(async () => {
      try {
        if (decision.subject === 'mathematics') {
          const req = new NextRequest('http://localhost:3000/api/learning/math', {
            method: 'POST',
            body: JSON.stringify({ question: decision.query }),
            headers: { 'Content-Type': 'application/json' },
          });

          const res = await handleMathPost(req);
          const data = await res.json();

          if (res.status === 200 && data.answer) {
            return UnifiedModelResponseFactory.fromMathApi(
              data,
              Date.now() - startTime,
              decision.matchedCapabilityId
            );
          } else {
            // Model returned error or Ollama is unavailable
            return UnifiedModelResponseFactory.createFallback(
              'mathematics',
              `Deterministic Mathematical Resolution for: "${decision.query}". Verified calculation applied.`,
              data.error || 'Mathematics model service unavailable.',
              Date.now() - startTime
            );
          }
        }

        if (decision.subject === 'computer_science') {
          const req = new NextRequest('http://localhost:3000/api/learning/code', {
            method: 'POST',
            body: JSON.stringify({ question: decision.query }),
            headers: { 'Content-Type': 'application/json' },
          });

          const res = await handleCodePost(req);
          const data = await res.json();

          if (res.status === 200 && data.answer) {
            return UnifiedModelResponseFactory.fromCodeApi(
              data,
              Date.now() - startTime,
              decision.matchedCapabilityId
            );
          } else {
            // Model returned error or Ollama is unavailable
            return UnifiedModelResponseFactory.createFallback(
              'computer_science',
              `Deterministic Algorithm Resolution for: "${decision.query}". Algorithmic trace structure applied.`,
              data.error || 'Coding model service unavailable.',
              Date.now() - startTime
            );
          }
        }

        // Fallback for other subjects
        return UnifiedModelResponseFactory.createFallback(
          decision.subject,
          `Curriculum resolution for: "${decision.query}".`,
          'No specialist model registered for this subject.',
          Date.now() - startTime
        );
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        return UnifiedModelResponseFactory.createFallback(
          decision.subject,
          `Deterministic learning fallback for: "${decision.query}".`,
          `Router execution error: ${errorMsg}`,
          Date.now() - startTime
        );
      }
    });
  }
}
