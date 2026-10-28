/**
 * VisiOS — Phase 2: Intent Classifier
 * Produces a typed InterpretedLearningIntent from raw student input.
 * Coordinates with TopicClassifier, MathInputNormalizer, DisambiguationEngine,
 * and EngineCapabilityRegistry. Does NOT duplicate engine calculations.
 */

import { TopicDomain } from './types';
import { TopicClassifier } from './TopicClassifier';
import { MathInputNormalizer } from './MathInputNormalizer';
import { BinomialExpansionEngine } from './BinomialExpansionEngine';
import { EngineCapabilityRegistry } from './EngineCapabilityRegistry';
import { UnifiedLearningContracts, LearningRequestContext } from './UnifiedLearningContracts';
import {
  StudentIntent,
  InterpretedLearningIntent,
  DisambiguationContext,
  NormalizedMathExpression,
} from './InputIntelligenceTypes';

// Terms that are genuinely ambiguous across domains
const AMBIGUOUS_TERMS: Record<string, { domains: TopicDomain[]; clarifications: Array<{ label: string; domain: TopicDomain; intent: StudentIntent; query: string }> }> = {
  graph: {
    domains: ['mathematics', 'computer_science'],
    clarifications: [
      { label: 'Plot a mathematical function graph (e.g. y = 2x + 3)', domain: 'mathematics', intent: 'plot_function', query: 'plot y = 2x + 3' },
      { label: 'Graph data structure / traversal (CS)', domain: 'computer_science', intent: 'explain_concept', query: 'graph data structure' },
    ],
  },
  tree: {
    domains: ['computer_science', 'mathematics'],
    clarifications: [
      { label: 'Tree data structure (binary tree, BST, etc.)', domain: 'computer_science', intent: 'explain_concept', query: 'tree data structure' },
      { label: 'Tree diagram in mathematics / probability', domain: 'mathematics', intent: 'visualize_concept', query: 'tree diagram probability' },
    ],
  },
  function: {
    domains: ['mathematics', 'computer_science'],
    clarifications: [
      { label: 'Mathematical function (e.g. f(x) = 2x + 3)', domain: 'mathematics', intent: 'plot_function', query: 'linear function y = 2x + 3' },
      { label: 'Programming function / procedure', domain: 'computer_science', intent: 'explain_concept', query: 'functions in programming' },
    ],
  },
  vector: {
    domains: ['mathematics', 'physics'],
    clarifications: [
      { label: 'Physics vector (force, velocity, acceleration)', domain: 'physics', intent: 'explain_concept', query: 'force vector physics' },
      { label: 'Mathematical vector / linear algebra', domain: 'mathematics', intent: 'explain_concept', query: 'vector linear algebra' },
    ],
  },
  state: {
    domains: ['computer_science', 'physics'],
    clarifications: [
      { label: 'State in a state machine or automaton (CS)', domain: 'computer_science', intent: 'explain_concept', query: 'state machine automaton' },
      { label: 'Physical state (solid, liquid, gas)', domain: 'physics', intent: 'explain_concept', query: 'states of matter' },
    ],
  },
  class: {
    domains: ['computer_science', 'mathematics'],
    clarifications: [
      { label: 'Class in object-oriented programming', domain: 'computer_science', intent: 'explain_concept', query: 'class object oriented programming' },
      { label: 'Equivalence class in mathematics', domain: 'mathematics', intent: 'explain_concept', query: 'equivalence class mathematics' },
    ],
  },
  model: {
    domains: ['mathematics', 'computer_science', 'physics'],
    clarifications: [
      { label: '3D model / visualization', domain: 'mathematics', intent: 'visualize_concept', query: '3D geometric model' },
      { label: 'Machine learning model', domain: 'computer_science', intent: 'explain_concept', query: 'machine learning model' },
      { label: 'Physical model / simulation', domain: 'physics', intent: 'run_simulation', query: 'physics simulation model' },
    ],
  },
  network: {
    domains: ['computer_science', 'biology'],
    clarifications: [
      { label: 'Computer network (TCP/IP, routing)', domain: 'computer_science', intent: 'explain_concept', query: 'computer network protocol' },
      { label: 'Neural / biological network', domain: 'biology', intent: 'visualize_concept', query: 'neural network biology' },
    ],
  },
  root: {
    domains: ['mathematics', 'computer_science'],
    clarifications: [
      { label: 'Root of an equation / square root (mathematics)', domain: 'mathematics', intent: 'solve_problem', query: 'square root equation' },
      { label: 'Root node of a tree (CS)', domain: 'computer_science', intent: 'explain_concept', query: 'root node binary tree' },
    ],
  },
  'vertices and edges': {
    domains: ['computer_science', 'mathematics'],
    clarifications: [
      { label: 'Graph data structure (nodes & connections)', domain: 'computer_science', intent: 'explain_concept', query: 'graph data structure' },
      { label: 'Polyhedron / 3D solid geometry (vertices, edges, faces)', domain: 'mathematics', intent: 'visualize_concept', query: 'geometric solids vertices and edges' },
    ],
  },
  vertices: {
    domains: ['computer_science', 'mathematics'],
    clarifications: [
      { label: 'Graph nodes / vertices (CS)', domain: 'computer_science', intent: 'explain_concept', query: 'graph data structure' },
      { label: 'Polyhedron or polygon vertices (geometry)', domain: 'mathematics', intent: 'visualize_concept', query: 'geometric solids vertices' },
    ],
  },
  edges: {
    domains: ['computer_science', 'mathematics'],
    clarifications: [
      { label: 'Graph edges / connections (CS)', domain: 'computer_science', intent: 'explain_concept', query: 'graph data structure' },
      { label: 'Geometric solid or polygon edges (geometry)', domain: 'mathematics', intent: 'visualize_concept', query: 'geometric solids edges' },
    ],
  },
};

// Intent-detecting keyword patterns (checked BEFORE general domain routing)
const EXPLICIT_INTENT_PATTERNS: Array<{ pattern: RegExp; intent: StudentIntent }> = [
  { pattern: /^(plot|draw|graph)\s+(y\s*=|f\(x\)|the function|the equation)/i, intent: 'plot_function' },
  { pattern: /^(show|graph|plot)\s+y\s*=\s*[-+]?\d/i, intent: 'plot_function' },
  { pattern: /^(explain|describe|what is|what are|tell me about)\s+/i, intent: 'explain_concept' },
  { pattern: /^(prove|proof of|derive the proof|geometric proof)\s+/i, intent: 'prove_theorem' },
  { pattern: /^(derive|find the derivation of|derive the formula)\s+/i, intent: 'derive_formula' },
  { pattern: /^(trace|step through|walk through|run|execute)\s+(binary search|algorithm|sort|bfs|dfs)/i, intent: 'trace_algorithm' },
  { pattern: /^(simulate|run a simulation|show the simulation of)\s+/i, intent: 'run_simulation' },
  { pattern: /^(compare|difference between|contrast)\s+/i, intent: 'compare_scenarios' },
  { pattern: /^(solve|calculate|find|compute)\s+/i, intent: 'solve_problem' },
  { pattern: /^(practice|give me.*question|quiz me|test me)/i, intent: 'generate_practice' },
  { pattern: /^(continue|resume|where was i|next step)/i, intent: 'continue_learning' },
  { pattern: /^(analyze|summarize|explain this document|from the document)/i, intent: 'analyze_document' },
];

// Multi-intent detection patterns
const MULTI_INTENT_PATTERNS: Array<{ pattern: RegExp; intents: StudentIntent[] }> = [
  { pattern: /explain.*and\s+(plot|graph|show|trace|simulate)/i, intents: ['explain_concept', 'plot_function'] },
  { pattern: /explain.*and\s+trace/i, intents: ['explain_concept', 'trace_algorithm'] },
  { pattern: /explain.*and\s+simulate/i, intents: ['explain_concept', 'run_simulation'] },
  { pattern: /compare.*two.*angle|two.*launch|two.*scenario/i, intents: ['compare_scenarios', 'run_simulation'] },
  { pattern: /(explain|describe).*then\s+(show|visualize|plot)/i, intents: ['explain_concept', 'visualize_concept'] },
];

export class IntentClassifier {
  /**
   * Classify a raw student input into a fully-typed InterpretedLearningIntent.
   */
  public static classify(
    rawInput: string,
    context?: DisambiguationContext
  ): InterpretedLearningIntent {
    const trimmed = rawInput.trim();

    // 1. Empty input
    if (!trimmed) {
      return this.buildUnsupported(rawInput, 'clarify_request', 'Empty input — please enter a topic, formula, or question.');
    }

    const lower = trimmed.toLowerCase();

    // 2. Math normalization check (before anything else for expressions)
    const mathParsing = MathInputNormalizer.normalize(trimmed);
    if (mathParsing.mathType === 'malformed') {
      return {
        originalInput: rawInput,
        normalizedInput: trimmed,
        primaryIntent: 'clarify_request',
        domain: 'mathematics',
        subject: 'Mathematics',
        topic: trimmed,
        confidence: 0.99,
        isAmbiguous: false,
        mathParsing,
        requiredParameters: [],
        resolvedParameters: {},
        missingParameters: [],
        parameterSources: {},
        candidateCapabilityIds: [],
        limitations: [`Malformed expression: ${mathParsing.validationError}`],
        suggestedAction: 'Please correct the expression and try again.',
      };
    }

    // 3. Detect explicit plotting intent for math expressions
    if (mathParsing.isMathematical && mathParsing.isValid) {
      const plotIntent = EXPLICIT_INTENT_PATTERNS.find((p) => p.intent === 'plot_function' && p.pattern.test(trimmed));
      const mathIntent = plotIntent ? 'plot_function' : (mathParsing.intentHint ?? 'explain_concept');
      const capId = this.resolveCapabilityForMath(mathParsing, context);
      return {
        originalInput: rawInput,
        normalizedInput: mathParsing.normalizedSyntax || trimmed,
        primaryIntent: mathIntent,
        domain: 'mathematics',
        subject: 'Mathematics',
        topic: trimmed,
        confidence: 0.97,
        isAmbiguous: false,
        mathParsing,
        requiredParameters: [],
        resolvedParameters: mathParsing.parameters as Record<string, number | string | boolean>,
        missingParameters: [],
        parameterSources: Object.fromEntries(
          Object.keys(mathParsing.parameters).map((k) => [k, 'explicit_input'])
        ),
        candidateCapabilityIds: capId ? [capId] : [],
        limitations: [],
      };
    }

    // 4. Check for genuinely ambiguous standalone terms (no subject context)
    const ambiguousTermMatch = Object.entries(AMBIGUOUS_TERMS).find(([term]) => {
      const wordBoundary = new RegExp(`\\b${term}\\b`, 'i');
      const isJustTheTerm = lower === term || lower === `${term}s`;
      // Ambiguous if it's the standalone term OR an uncontextualized query containing the term
      return isJustTheTerm || (wordBoundary.test(lower) && trimmed.split(/\s+/).length <= 8 && !this.hasDisambiguatingContext(lower, term));
    });

    if (ambiguousTermMatch) {
      const [term, data] = ambiguousTermMatch;
      // If context provides a domain, use it to disambiguate
      if (context?.subject) {
        const subjectLower = context.subject.toLowerCase();
        const domainFromCtx = this.subjectToDomain(subjectLower);
        const matching = data.clarifications.find((c) => c.domain === domainFromCtx);
        if (matching) {
          return this.fromDisambiguated(rawInput, trimmed, matching, context);
        }
      }
      // No context — ask clarification
      return {
        originalInput: rawInput,
        normalizedInput: trimmed,
        primaryIntent: 'clarify_request',
        domain: data.domains[0],
        subject: 'Multiple domains',
        topic: term,
        confidence: 0.35,
        isAmbiguous: true,
        ambiguityReason: `"${term}" has different meanings across domains. Please clarify your intent.`,
        clarificationOptions: data.clarifications.map((c) => ({
          label: c.label,
          intendedMeaning: c.label,
          targetQuery: c.query,
          impliedDomain: c.domain,
          impliedIntent: c.intent,
        })),
        requiredParameters: [],
        resolvedParameters: {},
        missingParameters: [],
        parameterSources: {},
        candidateCapabilityIds: [],
        limitations: [],
        suggestedAction: 'Please choose which interpretation applies to your learning goal.',
      };
    }

    // 5. Detect multi-intent
    const multiIntentMatch = MULTI_INTENT_PATTERNS.find((p) => p.pattern.test(trimmed));
    const additionalIntents: StudentIntent[] = multiIntentMatch ? multiIntentMatch.intents.slice(1) : [];

    // 6. Detect explicit primary intent from verb patterns
    let primaryIntent: StudentIntent = 'explain_concept'; // default
    for (const { pattern, intent } of EXPLICIT_INTENT_PATTERNS) {
      if (pattern.test(trimmed)) {
        primaryIntent = intent;
        break;
      }
    }

    // 7. Use TopicClassifier for domain/subject/engine routing
    const classification = TopicClassifier.classify(trimmed);
    const domain = classification.domain;

    // 8. Capability lookup
    const request = UnifiedLearningContracts.createLearningRequest(trimmed, {
      context: context ? {
        subject: context.subject,
        activeLessonId: context.activeLessonId,
        documentId: context.documentId,
        selectedCanvasObjectId: context.selectedCanvasObjectId,
        workspaceId: context.workspaceId,
      } : undefined,
    });
    const capResolution = EngineCapabilityRegistry.resolveCapability(request);
    const candidateCapIds = capResolution.capability ? [capResolution.capability.id] : [];

    // 8b. If TopicClassifier flagged ambiguous query requiring clarification, return clarify_request
    if (classification.requiresClarification) {
      return {
        originalInput: rawInput,
        normalizedInput: trimmed,
        primaryIntent: 'clarify_request',
        domain: classification.domain,
        subject: this.domainToSubject(classification.domain),
        topic: trimmed,
        confidence: classification.confidence,
        isAmbiguous: true,
        ambiguityReason: classification.suggestedClarifications?.[0] || classification.reason || 'Input is ambiguous; please clarify.',
        clarificationOptions: (classification.suggestedClarifications || []).map((c) => ({
          label: c,
          intendedMeaning: c,
          targetQuery: c,
          impliedDomain: classification.domain,
          impliedIntent: 'explain_concept',
        })),
        requiredParameters: [],
        resolvedParameters: {},
        missingParameters: [],
        parameterSources: {},
        candidateCapabilityIds: [],
        limitations: [classification.reason || 'Input requires clarification.'],
        suggestedAction: 'Please select one of the suggested clarifications.',
      };
    }

    // 9. Determine if unsupported
    if (!capResolution.isSupported) {
      return {
        originalInput: rawInput,
        normalizedInput: trimmed,
        primaryIntent: 'unsupported',
        domain,
        subject: domain,
        topic: trimmed,
        confidence: 0.9,
        isAmbiguous: false,
        requiredParameters: [],
        resolvedParameters: {},
        missingParameters: [],
        parameterSources: {},
        candidateCapabilityIds: [],
        limitations: [capResolution.reason || 'No verified engine capability found for this topic.'],
        suggestedAction: 'VisiOS supports mathematics, physics, CS algorithms, biology anatomy, and chemistry. Please try a topic in those areas.',
      };
    }

    return {
      originalInput: rawInput,
      normalizedInput: trimmed,
      primaryIntent,
      additionalIntents: additionalIntents.length > 0 ? additionalIntents : undefined,
      domain,
      subject: this.domainToSubject(domain),
      topic: trimmed,
      confidence: classification.confidence,
      isAmbiguous: classification.requiresClarification,
      ambiguityReason: classification.requiresClarification ? (classification.suggestedClarifications?.[0]) : undefined,
      requiredParameters: capResolution.capability?.requiredParameters ?? [],
      resolvedParameters: {},
      missingParameters: [],
      parameterSources: {},
      candidateCapabilityIds: candidateCapIds,
      limitations: capResolution.capability?.limitations ?? [],
    };
  }

  private static hasDisambiguatingContext(lower: string, term: string): boolean {
    // If query contains disambiguating keywords that strongly indicate one domain
    const mathIndicators = ['y =', 'f(x)', 'plot', 'equation', 'coordinate', 'polyhedron', 'polyhedra', 'solid', 'plane', 'slope'];
    const csIndicators = ['traversal', 'bfs', 'dfs', 'algorithm', 'data structure', 'dijkstra', 'adjacency', 'binary search', 'search'];
    const physicsIndicators = ['force', 'velocity', 'acceleration', 'physics', 'pendulum', 'projectile'];
    return (
      mathIndicators.some((kw) => lower.includes(kw)) ||
      csIndicators.some((kw) => lower.includes(kw)) ||
      physicsIndicators.some((kw) => lower.includes(kw))
    );
  }

  private static resolveCapabilityForMath(math: NormalizedMathExpression, _ctx?: DisambiguationContext): string | null {
    switch (math.mathType) {
      case 'linear_equation': return 'cap_linear_functions';
      case 'fraction': return 'cap_rational_fractions';
      case 'binomial': return 'cap_polynomial_identities';
      case 'pythagorean': return 'cap_euclidean_geometry';
      default: return null;
    }
  }

  private static fromDisambiguated(
    originalInput: string,
    normalizedInput: string,
    choice: { label: string; domain: TopicDomain; intent: StudentIntent; query: string },
    _ctx?: DisambiguationContext
  ): InterpretedLearningIntent {
    return {
      originalInput,
      normalizedInput,
      primaryIntent: choice.intent,
      domain: choice.domain,
      subject: this.domainToSubject(choice.domain),
      topic: choice.query,
      confidence: 0.88,
      isAmbiguous: false,
      requiredParameters: [],
      resolvedParameters: {},
      missingParameters: [],
      parameterSources: {},
      candidateCapabilityIds: [],
      limitations: [],
    };
  }

  private static subjectToDomain(subject: string): TopicDomain {
    const map: Record<string, TopicDomain> = {
      math: 'mathematics', mathematics: 'mathematics',
      physics: 'physics', science: 'physics',
      'computer science': 'computer_science', computer_science: 'computer_science', cs: 'computer_science', programming: 'computer_science',
      biology: 'biology', chemistry: 'chemistry',
    };
    return map[subject] ?? 'general_knowledge';
  }

  private static domainToSubject(domain: TopicDomain): string {
    const map: Record<TopicDomain, string> = {
      mathematics: 'Mathematics', physics: 'Physics', computer_science: 'Computer Science',
      biology: 'Biology', chemistry: 'Chemistry', history: 'History',
      general_knowledge: 'General Studies', other: 'General Studies',
    };
    return map[domain] ?? 'General Studies';
  }

  private static buildUnsupported(raw: string, intent: StudentIntent, message: string): InterpretedLearningIntent {
    return {
      originalInput: raw,
      normalizedInput: raw.trim(),
      primaryIntent: intent,
      domain: 'other',
      subject: 'General',
      topic: raw,
      confidence: 0.0,
      isAmbiguous: true,
      ambiguityReason: message,
      requiredParameters: [],
      resolvedParameters: {},
      missingParameters: [],
      parameterSources: {},
      candidateCapabilityIds: [],
      limitations: [message],
      suggestedAction: message,
    };
  }
}
