/**
 * VisiOS — Model Provider Registry
 * Implementation 3: Unified Subject Intelligence Router
 * Registers available local specialist models, their internal API endpoints,
 * and enforces sequential dispatch to protect 4 GB GPU VRAM.
 */

import { ModelSubject } from './UnifiedModelResponse';

export interface ModelProviderConfig {
  id: string;
  subject: ModelSubject;
  primaryModel: string;
  fallbackModel: string;
  apiEndpoint: string;
  maxPredictTokens: number;
  temperature: number;
  timeoutMs: number;
  description: string;
  supportedTasks: string[];
}

export class ModelProviderRegistry {
  private static readonly providers: Record<string, ModelProviderConfig> = {
    mathematics: {
      id: 'provider_math',
      subject: 'mathematics',
      primaryModel: process.env.MATH_MODEL || 'mightykatun/qwen2.5-math:1.5b',
      fallbackModel: 'qwen2.5:0.5b',
      apiEndpoint: '/api/learning/math',
      maxPredictTokens: 700,
      temperature: 0.1,
      timeoutMs: 120000,
      description: 'Qwen2.5-Math 1.5B mathematical reasoning and algebraic explanation specialist.',
      supportedTasks: [
        'algebraic_reasoning',
        'equation_solving',
        'theorem_explanation',
        'step_derivation',
        'arithmetic_checking',
      ],
    },
    computer_science: {
      id: 'provider_coder',
      subject: 'computer_science',
      primaryModel: process.env.OLLAMA_CODE_MODEL || 'qwen2.5-coder:1.5b',
      fallbackModel: 'qwen2.5:0.5b',
      apiEndpoint: '/api/learning/code',
      maxPredictTokens: 1000,
      temperature: 0.1,
      timeoutMs: 120000,
      description: 'Qwen2.5-Coder 1.5B programming, algorithm tracing, and debugging specialist.',
      supportedTasks: [
        'code_generation',
        'code_debugging',
        'algorithm_explanation',
        'complexity_analysis',
        'data_structure_explanation',
      ],
    },
    general: {
      id: 'provider_general',
      subject: 'general',
      primaryModel: 'qwen2.5:0.5b',
      fallbackModel: 'deterministic_fallback',
      apiEndpoint: '/api/learning/general',
      maxPredictTokens: 500,
      temperature: 0.2,
      timeoutMs: 30000,
      description: 'Qwen2.5 0.5B general lightweight semantic baseline.',
      supportedTasks: ['conceptual_overview', 'semantic_summary'],
    },
    plant_genomics: {
      id: 'provider_botanic',
      subject: 'plant_genomics',
      primaryModel: 'living-models/Botanic1-S',
      fallbackModel: 'deterministic_genomic_representation',
      apiEndpoint: '/api/learning/plant-genomics',
      maxPredictTokens: 1024,
      temperature: 0.0,
      timeoutMs: 120000,
      description: 'Living Models BOTANIC-1 S plant genomic sequence embedding specialist.',
      supportedTasks: [
        'sequence_embedding',
        'plant_genomics',
        'nucleotide_representation',
      ],
    },
  };

  /**
   * Concurrency Lock for 4 GB GPU VRAM protection.
   * Ensures that sequential inference calls do not collide or force two 1.5B models into VRAM simultaneously.
   */
  private static vramLock: Promise<any> = Promise.resolve();

  /**
   * Dispatches an asynchronous model call through a sequential VRAM queue.
   */
  public static async executeWithVRAMProtection<T>(task: () => Promise<T>): Promise<T> {
    const currentLock = this.vramLock;
    let resolveLock!: () => void;
    this.vramLock = new Promise<void>((resolve) => {
      resolveLock = resolve;
    });

    try {
      await currentLock;
      return await task();
    } finally {
      resolveLock();
    }
  }

  /**
   * Retrieves configuration for a given subject.
   */
  public static getProvider(subject: ModelSubject): ModelProviderConfig | undefined {
    return this.providers[subject];
  }

  /**
   * Returns all registered specialist providers.
   */
  public static getAllProviders(): ModelProviderConfig[] {
    return Object.values(this.providers);
  }
}

