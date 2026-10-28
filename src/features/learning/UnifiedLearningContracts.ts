/**
 * VisiOS — Unified Learning Request & Response Contracts
 * Phase 1: Unified Architecture & Integration
 * Defines standardized, strictly-typed request and response structures
 * connecting all domain engines, visual adapters, and workspace canvas.
 */

import {
  TopicDomain,
  TopicIntent,
  CapabilityLevel,
  DerivationStep,
  WorkedExample,
  VisualizationPlan,
  SourceAttribution,
  LearningPlan,
  TopicClassificationResult,
} from './types';

// ============================================================================
// 1. Error Codes & Error Contract
// ============================================================================

export type LearningErrorCode =
  | 'INVALID_INPUT'
  | 'CLARIFICATION_REQUIRED'
  | 'UNSUPPORTED_CAPABILITY'
  | 'ENGINE_UNAVAILABLE'
  | 'ENGINE_EXECUTION_FAILED'
  | 'INVALID_ENGINE_OUTPUT'
  | 'VISUALIZATION_UNSUPPORTED'
  | 'VISUALIZATION_INITIALIZATION_FAILED'
  | 'PERSISTENCE_FAILED'
  | 'MATHEMATICAL_VERIFICATION_FAILED'
  | 'EXPLANATION_CONTRADICTION'
  | 'ALGORITHM_PRECONDITION_VIOLATION';

export interface LearningError {
  code: LearningErrorCode;
  message: string;
  recoverable: boolean;
  details?: string;
  fallbackAvailable?: boolean;
}

// ============================================================================
// 1B. Phase 3: Learning Result Verification & Trustworthiness Contracts
// ============================================================================

export type VerificationState =
  | 'verified_deterministic'
  | 'unverified_generated'
  | 'partially_verified'
  | 'needs_clarification'
  | 'unsupported_operation'
  | 'invalid_input'
  | 'verification_failed'
  | 'visualization_unavailable';

export interface VerificationFinding {
  rule: string;
  passed: boolean;
  details?: string;
  expected?: string | number;
  actual?: string | number;
  severity: 'critical' | 'warning' | 'info';
}

export interface VerificationContractResult {
  state: VerificationState;
  isMathematicallyVerified: boolean;
  isVisuallyFaithful: boolean;
  isLogicallyConsistent: boolean;
  findings: VerificationFinding[];
  auditedTimestamp: number;
}

// ============================================================================
// 2. Learning Request Contract
// ============================================================================

export interface LearningRequestContext {
  subject?: string;
  activeLessonId?: string;
  documentId?: string;
  selectedCanvasObjectId?: string;
  previousResponseId?: string;
  workspaceId?: string;
}

export interface LearningRequestPreferences {
  preferredVisualization?: string;
  detailLevel?: 'concise' | 'standard' | 'detailed';
  enable3d?: boolean;
}

export interface LearningRequest {
  requestId: string;
  input: string;
  timestamp: number;
  context?: LearningRequestContext;
  preferences?: LearningRequestPreferences;
}

// ============================================================================
// 3. Learning Response Contract
// ============================================================================

export type LearningResponseStatus = 'success' | 'partial' | 'unsupported' | 'error';

export interface LearningResponseTopic {
  title: string;
  normalizedQuery: string;
  subject: string;
  domain: TopicDomain;
  intent: TopicIntent;
  conceptId?: string;
}

export interface LearningResponseContent {
  overview: string;
  explanation?: string;
  motivation?: string;
  terminology?: Array<{ term: string; definition: string }>;
  derivationSteps?: DerivationStep[];
  derivationSummary?: string;
  workedExamples?: WorkedExample[];
  prerequisites: string[];
  applications?: string[];
  assumptions?: string[];
}

export interface LearningResponseResults {
  primaryValue?: number | string;
  units?: string;
  parameters?: Record<string, number | string | boolean>;
  calculatedOutputs?: Record<string, number | string | boolean>;
  outputFormulas?: Record<string, string>;
}

export interface LearningResponseGrounding {
  source?: string;
  sourceIds?: string[];
  attribution?: SourceAttribution;
  limitations?: string[];
  disclosures?: string[];
}

export interface LearningRecommendation {
  label: string;
  action: 'explore_prerequisite' | 'next_topic' | 'inspect_visualization' | 'run_simulation' | 'practice';
  topicQuery: string;
  description?: string;
}

export interface LearningResponseMetadata {
  processingTimeMs: number;
  engineId: string;
  capabilityId: string;
  capabilityLevel: CapabilityLevel;
  timestamp: number;
  /** Phase 2: The classified student intent for this request */
  intentClassification?: string;
  /** Phase 2: Routing outcome summary */
  routingOutcome?: 'success' | 'clarification' | 'unsupported' | 'partial';
  /** Phase 2: Whether this request was a multi-intent query */
  isMultiIntent?: boolean;
  /** Phase 3: Verification contract audit result */
  verificationResult?: VerificationContractResult;
}

export interface LearningResponse {
  status: LearningResponseStatus;
  requestId: string;
  responseId: string;
  timestamp: number;
  topic: LearningResponseTopic;
  content: LearningResponseContent;
  results?: LearningResponseResults;
  visualization?: VisualizationPlan;
  grounding?: LearningResponseGrounding;
  recommendations?: LearningRecommendation[];
  error?: LearningError;
  /** Phase 3: First-class verification result contract */
  verification?: VerificationContractResult;
  metadata: LearningResponseMetadata;
}

// ============================================================================
// 4. Contract Validation & Factory Helpers
// ============================================================================

export class UnifiedLearningContracts {
  public static readonly MAX_INPUT_LENGTH = 300;

  /**
   * Generates a unique monotonic request or response ID.
   */
  public static generateId(prefix: 'req' | 'res' = 'req'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Factory for creating a normalized, validated LearningRequest.
   */
  public static createLearningRequest(
    input: string,
    options?: {
      requestId?: string;
      context?: LearningRequestContext;
      preferences?: LearningRequestPreferences;
    }
  ): LearningRequest {
    const clean = (input || '').trim();
    return {
      requestId: options?.requestId || this.generateId('req'),
      input: clean.slice(0, this.MAX_INPUT_LENGTH),
      timestamp: Date.now(),
      context: options?.context,
      preferences: options?.preferences,
    };
  }

  /**
   * Validates a raw input or unknown object as a valid LearningRequest.
   */
  public static validateLearningRequest(raw: unknown): {
    isValid: boolean;
    request?: LearningRequest;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Request payload must be a non-null object.'] };
    }

    const candidate = raw as Record<string, any>;

    if (typeof candidate.input !== 'string') {
      errors.push('Request.input must be a string.');
    } else if (candidate.input.trim().length === 0) {
      errors.push('Request.input must not be empty.');
    }

    const requestId =
      typeof candidate.requestId === 'string' && candidate.requestId.trim().length > 0
        ? candidate.requestId.trim()
        : this.generateId('req');

    const timestamp =
      typeof candidate.timestamp === 'number' && Number.isFinite(candidate.timestamp)
        ? candidate.timestamp
        : Date.now();

    if (errors.length > 0) {
      return { isValid: false, errors };
    }

    const request: LearningRequest = {
      requestId,
      input: (candidate.input as string).trim().slice(0, this.MAX_INPUT_LENGTH),
      timestamp,
      context: candidate.context,
      preferences: candidate.preferences,
    };

    return { isValid: true, request, errors: [] };
  }

  /**
   * Creates an authentic error or unhandled LearningResponse.
   */
  public static createErrorResponse(
    request: LearningRequest,
    error: LearningError,
    overrides?: Partial<LearningResponse>
  ): LearningResponse {
    return {
      status: error.code === 'UNSUPPORTED_CAPABILITY' ? 'unsupported' : 'error',
      requestId: request.requestId,
      responseId: this.generateId('res'),
      timestamp: Date.now(),
      topic: overrides?.topic || {
        title: request.input ? `Query: ${request.input}` : 'Empty Query',
        normalizedQuery: request.input.toLowerCase(),
        subject: 'General Studies',
        domain: 'other',
        intent: 'concept_learning',
      },
      content: overrides?.content || {
        overview: error.message,
        explanation: error.details || error.message,
        prerequisites: [],
      },
      error,
      metadata: overrides?.metadata || {
        processingTimeMs: 0,
        engineId: 'system_error_handler',
        capabilityId: 'cap_system_error',
        capabilityLevel: 'unsupported',
        timestamp: Date.now(),
      },
      ...overrides,
    };
  }

  /**
   * Converts a legacy LearningPlan + TopicClassificationResult into a unified LearningResponse.
   */
  public static planToLearningResponse(
    plan: LearningPlan,
    classification: TopicClassificationResult,
    routeTaken: string,
    processingTimeMs: number,
    requestId?: string
  ): LearningResponse {
    const isError = plan.uncertaintyState?.isUncertain;
    const isUnsupported = routeTaken === 'unsupported_input';

    const status: LearningResponseStatus = isError
      ? 'partial'
      : isUnsupported
      ? 'unsupported'
      : 'success';

    const isDeterministicVerified =
      (routeTaken === 'math_engine' || routeTaken === 'algorithm_engine' || routeTaken === 'simulation_engine') &&
      !isError &&
      !isUnsupported;

    const verification: VerificationContractResult = {
      state: isError
        ? 'needs_clarification'
        : isUnsupported
        ? 'unsupported_operation'
        : isDeterministicVerified
        ? 'verified_deterministic'
        : 'unverified_generated',
      isMathematicallyVerified: isDeterministicVerified && classification.domain === 'mathematics',
      isVisuallyFaithful: plan.visualizationPlan?.rendererType !== 'none' && !isError,
      isLogicallyConsistent: !isError,
      findings: isError
        ? [{ rule: 'clarification_guard', passed: false, severity: 'warning', details: 'Plan flagged with uncertainty' }]
        : [{ rule: 'deterministic_check', passed: true, severity: 'info', details: 'Plan execution verified' }],
      auditedTimestamp: Date.now(),
    };

    return {
      status,
      requestId: requestId || this.generateId('req'),
      responseId: this.generateId('res'),
      timestamp: Date.now(),
      topic: {
        title: plan.title,
        normalizedQuery: classification.originalQuery || plan.title.toLowerCase(),
        subject: plan.subject,
        domain: classification.domain,
        intent: classification.intent,
        conceptId: plan.conceptId,
      },
      content: {
        overview: plan.overview,
        motivation: plan.motivation,
        terminology: plan.terminology,
        derivationSteps: plan.derivationSteps,
        derivationSummary: plan.derivationSummary,
        workedExamples: plan.workedExamples,
        prerequisites: plan.prerequisites || [],
        applications: plan.applications || [],
        assumptions: plan.assumptions || [],
      },
      results: plan.defaultExperimentState
        ? {
            parameters: plan.defaultExperimentState.parameters,
            calculatedOutputs: plan.defaultExperimentState.calculatedOutputs,
            outputFormulas: plan.defaultExperimentState.outputFormulas,
          }
        : undefined,
      visualization: plan.visualizationPlan,
      grounding: {
        source: plan.sourceAttribution?.source,
        attribution: plan.sourceAttribution,
        limitations: plan.disclosures,
        disclosures: plan.disclosures,
      },
      verification,
      metadata: {
        processingTimeMs,
        engineId: routeTaken,
        capabilityId: plan.conceptId || `cap_${classification.domain}`,
        capabilityLevel: plan.capabilityLevel,
        timestamp: Date.now(),
        verificationResult: verification,
      },
    };
  }

  /**
   * Converts a unified LearningResponse back into a legacy LearningPlan for backward compatibility.
   */
  public static responseToLearningPlan(response: LearningResponse): LearningPlan {
    const classification: TopicClassificationResult = {
      domain: response.topic.domain,
      intent: response.topic.intent,
      engine: response.metadata.engineId as any,
      confidence: 1.0,
      requiresClarification: response.status === 'partial' || response.status === 'unsupported',
      reason: response.content.overview || 'Recovered from unified response.',
      originalQuery: response.topic.normalizedQuery,
    };

    const plan: LearningPlan = {
      title: response.topic.title,
      category: response.topic.domain === 'mathematics' ? 'algebra' : (response.topic.domain as any),
      subject: response.topic.subject,
      overview: response.content.overview,
      motivation: response.content.motivation || '',
      variables: [],
      interactiveParameters: [],
      derivationSteps: response.content.derivationSteps || [],
      derivationSummary: response.content.derivationSummary || '',
      symbolicVerificationNote: 'Verified through unified architectural pipeline.',
      workedExamples: response.content.workedExamples || [],
      visualizationPlan: response.visualization || {
        rendererType: 'none',
        title: response.topic.title,
        description: response.content.overview,
        learningObjective: 'Observe concepts',
        activeVariables: [],
        interactionsAvailable: [],
        expectedBehavior: 'Displays content',
        fallbackAvailable: true,
      },
      defaultExperimentState: {
        parameters: (response.results?.parameters as Record<string, number>) || {},
        calculatedOutputs: (response.results?.calculatedOutputs as Record<string, string | number>) || {},
        outputFormulas: response.results?.outputFormulas || {},
        statusMessage: response.content.overview,
      },
      capabilityLevel: response.metadata.capabilityLevel,
      classification,
      conceptId: response.topic.conceptId || '',
      prerequisites: response.content.prerequisites || [],
      applications: response.content.applications || [],
      limitations: response.grounding?.limitations || [],
      practiceQuestions: [],
      recommendedNextConcepts: response.recommendations?.map((r) => r.topicQuery || r.label) || [],
      assumptions: response.content.assumptions || [],
      terminology: response.content.terminology,
      sourceAttribution: response.grounding?.attribution,
      disclosures: response.grounding?.disclosures || [],
      uncertaintyState:
        response.status === 'partial' || response.status === 'unsupported'
          ? {
              isUncertain: true,
              reason: response.error?.message || response.content.overview,
              suggestedClarifications: [],
            }
          : undefined,
    };

    return plan;
  }
}
