/**
 * VisiOS — Unified Model Response
 * Implementation 3: Unified Subject Intelligence Router
 * Standardizes responses from local specialist models, deterministic engines,
 * and knowledge retrieval into a single typed contract.
 */

export type ModelSubject =
  | 'mathematics'
  | 'computer_science'
  | 'physics'
  | 'general'
  | 'biology'
  | 'chemistry'
  | 'multimodal'
  | 'clarification';

export type ModelSource =
  | 'local_model'
  | 'deterministic_engine'
  | 'knowledge_retrieval'
  | 'authored_curriculum'
  | 'fallback';

export type ResponseStatus = 'success' | 'fallback' | 'clarification' | 'unsupported' | 'error';

export interface UnifiedModelResponse {
  subject: ModelSubject;
  model: string;
  answer: string;
  verified: boolean;
  source: ModelSource;
  status: ResponseStatus;
  engineId?: string;
  capabilityId?: string;
  latencyMs?: number;
  error?: string;
  rawDetails?: unknown;
}

export class UnifiedModelResponseFactory {
  /**
   * Factory for responses originating from the Mathematics API (/api/learning/math).
   */
  public static fromMathApi(
    data: {
      subject: string;
      model: string;
      answer: string;
      verified: boolean;
      source: string;
    },
    latencyMs?: number,
    capabilityId?: string
  ): UnifiedModelResponse {
    return {
      subject: 'mathematics',
      model: data.model || 'mightykatun/qwen2.5-math:1.5b',
      answer: data.answer || '',
      verified: false,
      source: 'local_model',
      status: 'success',
      capabilityId,
      latencyMs,
    };
  }

  /**
   * Factory for responses originating from the Coding API (/api/learning/code).
   */
  public static fromCodeApi(
    data: {
      subject: string;
      model: string;
      answer: string;
      verified: boolean;
      source: string;
    },
    latencyMs?: number,
    capabilityId?: string
  ): UnifiedModelResponse {
    return {
      subject: 'computer_science',
      model: data.model || 'qwen2.5-coder:1.5b',
      answer: data.answer || '',
      verified: false,
      source: 'local_model',
      status: 'success',
      capabilityId,
      latencyMs,
    };
  }

  /**
   * Factory for responses produced by deterministic engines (e.g. calculation, graphing, simulation, tracer).
   */
  public static fromDeterministicEngine(
    subject: ModelSubject,
    engineId: string,
    capabilityId: string,
    explanation: string,
    latencyMs?: number
  ): UnifiedModelResponse {
    return {
      subject,
      model: `deterministic:${engineId}`,
      answer: explanation,
      verified: true,
      source: 'deterministic_engine',
      status: 'success',
      engineId,
      capabilityId,
      latencyMs,
    };
  }

  /**
   * Factory for controlled fallback when local model is unavailable, offline, or timed out.
   */
  public static createFallback(
    subject: ModelSubject,
    fallbackAnswer: string,
    reason: string,
    latencyMs?: number
  ): UnifiedModelResponse {
    return {
      subject,
      model: 'deterministic_fallback',
      answer: fallbackAnswer,
      verified: true,
      source: 'fallback',
      status: 'fallback',
      error: reason,
      latencyMs,
    };
  }

  /**
   * Factory for clarification requests on ambiguous queries.
   */
  public static createClarification(
    clarificationMessage: string,
    candidateInterpretations: string[] = []
  ): UnifiedModelResponse {
    const optionsText = candidateInterpretations.length > 0
      ? `\n\nOptions:\n${candidateInterpretations.map((c) => `- ${c}`).join('\n')}`
      : '';
    return {
      subject: 'clarification',
      model: 'none',
      answer: `${clarificationMessage}${optionsText}`,
      verified: true,
      source: 'deterministic_engine',
      status: 'clarification',
    };
  }
}
