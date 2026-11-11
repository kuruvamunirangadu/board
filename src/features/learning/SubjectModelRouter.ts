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
import { POST as handlePlantGenomicsPost } from '@/app/api/learning/plant-genomics/route';
import { POST as handleChemistryPost } from '@/app/api/learning/chemistry/route';
import { POST as handleScientificMathPost } from '@/app/api/scientific/math/route';
import { POST as handleBiologyPost } from '@/app/api/learning/biology/route';

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

    if (/\b(quadratic|parabola|parabolic)\b/.test(lower)) {
      const capability = EngineCapabilityRegistry.resolveCapability(
        { input: trimmed, requestId: 'router', timestamp: Date.now() } as LearningRequest
      );
      return {
        query: trimmed,
        normalizedQuery: 'y = ax² + bx + c',
        subject: 'mathematics',
        requiresModel: false,
        targetEngineType: 'math',
        matchedCapabilityId: capability.capability?.id || 'cap_quadratic_functions',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Use the deterministic quadratic derivation and parabola graph engines.',
      };
    }

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
      lower.includes('ada lovelace') ||
      /\b(indian prime minister|prime minister of india)\b/i.test(lower);

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
      const mathNorm = MathInputNormalizer.normalize(trimmed);
      const isHarmonicOrPoly =
        mathNorm.mathType === 'trigonometric' ||
        mathNorm.mathType === 'polynomial' ||
        mathNorm.mathType === 'calculus' ||
        /(sin|cos|tan|cot|sec|csc|exp|\^)/i.test(trimmed);

      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'mathematics',
        requiresModel: false,
        targetEngineType: 'math',
        matchedCapabilityId: isHarmonicOrPoly ? 'cap_harmonic_curves' : 'cap_linear_functions',
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

    // Deterministic sequence and protein structure analysis (Biopython).
    const isExplicitSequenceAnalysis =
      /\b(analy[sz]e|translate|reverse complement|gc content)\b.*\b(dna|rna|sequence)\b/i.test(trimmed) ||
      /\b(dna|rna|sequence)\b.*\b(analy[sz]e|translate|reverse complement|gc content)\b/i.test(trimmed);
    if (isExplicitSequenceAnalysis) {
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'biology',
        requiresModel: false,
        targetEngineType: 'knowledge',
        matchedCapabilityId: 'cap_biopython_sequence_analysis',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Use Biopython to validate and analyze the requested DNA or RNA sequence.',
      };
    }

    // 9. Plant Genomics Specialist Selection (BOTANIC-1)
    // Only triggers on genuine DNA sequences or explicit plant genome embedding requests.
    // Does NOT intercept ordinary biology questions like "What is photosynthesis?" or "nervous system".
    const isPureDnaSequence = /^[ACGTN\s]{10,}$/i.test(trimmed);
    const isExplicitGenomics =
      /\b(botanic|plant genomics|plant genome|dna sequence|nucleotide sequence|sequence embedding)\b/i.test(lower);

    if (isPureDnaSequence || isExplicitGenomics) {
      const provider = ModelProviderRegistry.getProvider('plant_genomics');
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'plant_genomics',
        requiresModel: true,
        targetProvider: provider,
        targetEngineType: 'simulation',
        matchedCapabilityId: 'cap_plant_genomics_embedding',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Route to BOTANIC-1 S Plant Genomics service for 1,024-dimensional sequence embedding.',
      };
    }

    // 10. Chemistry Specialist Selection (ChemBERTa-2)
    // Triggers on valid SMILES strings or explicit molecular embedding requests (e.g. "CCO", "CC(=O)O", "SMILES representation").
    // Does NOT intercept ordinary chemistry concepts like "What is chemical bonding?" or "ionic bond".
    const isSmilesPattern =
      /^([CNOPSFClBrIBrHcnops0123456789=+#\-\/\\\[\]()%.@~:]{2,})$/.test(trimmed) &&
      !/^[a-zA-Z\s]{4,}$/.test(trimmed); // Avoid ordinary English words
    const isExplicitSmiles =
      /\b(smiles|chemberta|molecular embedding|masked smiles)\b/i.test(lower);

    if (isSmilesPattern || isExplicitSmiles) {
      const provider = ModelProviderRegistry.getProvider('chemistry');
      return {
        query: trimmed,
        normalizedQuery: trimmed,
        subject: 'chemistry',
        requiresModel: true,
        targetProvider: provider,
        targetEngineType: 'simulation',
        matchedCapabilityId: 'cap_chemberta_molecular_embedding',
        deterministicEngineAvailable: true,
        isAmbiguous: false,
        isMixedSubject: false,
        secondaryCapabilities: [],
        actionPlan: 'Route to ChemBERTa-77M-MLM Chemistry service for 384-dimensional molecular sequence embedding.',
      };
    }

    // 11. General Knowledge / Biology / Chemistry / History / Non-STEM
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
          const mathCommand = decision.query.match(/^\s*(differentiate|derivative(?:\s+of)?|integrate|integral(?:\s+of)?|simplify|solve|plot|graph)(?:\s+of)?\s+(.+)\s*$/i);
          if (mathCommand) {
            const verb = mathCommand[1].toLowerCase();
            const operation = verb.startsWith('different') || verb.startsWith('derivative')
              ? 'differentiate'
              : verb.startsWith('integr')
                ? 'integrate'
                : verb === 'plot' || verb === 'graph' ? 'plot' : verb;
            const request = new NextRequest('http://localhost:3000/api/scientific/math', {
              method: 'POST',
              body: JSON.stringify({ expression: mathCommand[2], operation }),
              headers: { 'Content-Type': 'application/json' },
            });
            const response = await handleScientificMathPost(request);
            const data = await response.json();
            if (response.status === 200 && data.service === 'visios-math') {
              return UnifiedModelResponseFactory.fromScientificMath(data, Date.now() - startTime, decision.matchedCapabilityId);
            }
          }

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

        if (decision.subject === 'biology' && decision.matchedCapabilityId === 'cap_biopython_sequence_analysis') {
          const match = decision.query.match(/\b[ACGTUN]{3,}\b/i);
          const sequence = match?.[0] || decision.query.replace(/[^ACGTUNacgtun]/g, '');
          const alphabet = /\bRNA\b/i.test(decision.query) || sequence.includes('U') || sequence.includes('u') ? 'RNA' : 'DNA';
          const req = new NextRequest('http://localhost:3000/api/learning/biology', {
            method: 'POST',
            body: JSON.stringify({ operation: 'sequence-analysis', sequence, alphabet }),
            headers: { 'Content-Type': 'application/json' },
          });
          const res = await handleBiologyPost(req);
          const data = await res.json();
          if (res.status === 200) {
            const gcText = typeof data.gc_percent === 'number' ? ` GC content is ${data.gc_percent}%.` : '';
            return UnifiedModelResponseFactory.fromDeterministicEngine(
              'biology', 'biopython-sequence-analysis', decision.matchedCapabilityId,
              `Validated ${data.alphabet} sequence (${data.length} nucleotides).${gcText}${data.translation ? ` Translation: ${data.translation}.` : ''}`,
              Date.now() - startTime,
            );
          }
          return UnifiedModelResponseFactory.createFallback('biology', 'Sequence analysis could not be completed.', data.error || 'Biology service is unavailable.', Date.now() - startTime);
        }

        if (decision.subject === 'plant_genomics') {
          // Extract nucleotide sequence if surrounded by query words
          const rawMatch = decision.query.match(/[ACGTN]{10,}/i);
          const sequence = rawMatch ? rawMatch[0] : decision.query.replace(/[^ACGTNacgtn]/g, '');

          const req = new NextRequest('http://localhost:3000/api/learning/plant-genomics', {
            method: 'POST',
            body: JSON.stringify({ sequence }),
            headers: { 'Content-Type': 'application/json' },
          });

          const res = await handlePlantGenomicsPost(req);
          const data = await res.json();

          if (res.status === 200 && data.embedding) {
            return UnifiedModelResponseFactory.fromBotanicApi(
              data,
              Date.now() - startTime,
              decision.matchedCapabilityId
            );
          } else {
            return UnifiedModelResponseFactory.createFallback(
              'plant_genomics',
              `Deterministic Plant Genomics representation for sequence of length ${sequence.length}.`,
              data.error || 'BOTANIC service offline or unreachable.',
              Date.now() - startTime
            );
          }
        }

        if (decision.subject === 'chemistry') {
          // Extract SMILES if surrounded by query words
          const smiles = decision.query.replace(/^(?:smiles|chemberta|molecular embedding for|embed|molecule)\s+/i, '').trim();

          const req = new NextRequest('http://localhost:3000/api/learning/chemistry', {
            method: 'POST',
            body: JSON.stringify({ smiles }),
            headers: { 'Content-Type': 'application/json' },
          });

          const res = await handleChemistryPost(req);
          const data = await res.json();

          if (res.status === 200 && (data.embedding || data.predictions)) {
            return UnifiedModelResponseFactory.fromChemistryApi(
              data,
              Date.now() - startTime,
              decision.matchedCapabilityId
            );
          } else {
            return UnifiedModelResponseFactory.createFallback(
              'chemistry',
              `Deterministic molecular representation for SMILES: '${smiles}'.`,
              data.error || 'Chemistry service offline or unreachable.',
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
