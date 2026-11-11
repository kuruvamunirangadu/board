/**
 * VisiOS — Centralized Scientific Engine Registry
 *
 * Implements the recommended open-source scientific adapter architecture:
 * - Central registry decoupling individual libraries from LearningOrchestrator
 * - Manages adapters for JupyterLite/Pyodide, Ketcher, Rapier, Mol*, and Manim
 * - Tracks version, license compliance, health status, capability declarations,
 *   error handling, and resource limits.
 */

import { BiologyMolStarAdapter } from './adapters/BiologyMolStarAdapter';
import { ChemistryKetcherAdapter } from './adapters/ChemistryKetcherAdapter';
import { MathManimAdapter } from './adapters/MathManimAdapter';
import { PhysicsRapierAdapter } from './adapters/PhysicsRapierAdapter';
import { PyodideNotebookAdapter } from './adapters/PyodideNotebookAdapter';
import {
  AdapterExecutionRequest,
  AdapterExecutionResult,
  IntegrationHealthStatus,
  ScientificAdapter,
  ScientificIntegrationId,
  ScientificIntegrationMetadata,
  SubjectAdapterId,
} from './types';

export class ScientificEngineRegistry {
  private static instance: ScientificEngineRegistry | null = null;
  private adapters: Map<ScientificIntegrationId, ScientificAdapter> = new Map();

  private constructor() {
    this.registerDefaults();
  }

  public static getInstance(): ScientificEngineRegistry {
    if (!ScientificEngineRegistry.instance) {
      ScientificEngineRegistry.instance = new ScientificEngineRegistry();
    }
    return ScientificEngineRegistry.instance;
  }

  private registerDefaults(): void {
    this.register(new PyodideNotebookAdapter());
    this.register(new ChemistryKetcherAdapter());
    this.register(new PhysicsRapierAdapter());
    this.register(new BiologyMolStarAdapter());
    this.register(new MathManimAdapter());
  }

  public register(adapter: ScientificAdapter): void {
    this.adapters.set(adapter.metadata.id, adapter);
  }

  public getAdapter(id: ScientificIntegrationId): ScientificAdapter | undefined {
    return this.adapters.get(id);
  }

  public getAllMetadata(): ScientificIntegrationMetadata[] {
    return Array.from(this.adapters.values()).map((a) => a.metadata);
  }

  public getAdaptersBySubject(subject: SubjectAdapterId): ScientificAdapter[] {
    return Array.from(this.adapters.values()).filter(
      (a) => a.metadata.subject === subject
    );
  }

  public async checkAllHealth(): Promise<Record<ScientificIntegrationId, IntegrationHealthStatus>> {
    const results: Record<string, IntegrationHealthStatus> = {};
    for (const [id, adapter] of Array.from(this.adapters.entries())) {
      results[id] = await adapter.checkHealth();
    }
    return results as Record<ScientificIntegrationId, IntegrationHealthStatus>;
  }

  public async execute(
    adapterId: ScientificIntegrationId,
    request: AdapterExecutionRequest
  ): Promise<AdapterExecutionResult> {
    const adapter = this.adapters.get(adapterId);
    if (!adapter) {
      return {
        success: false,
        adapterId,
        action: request.action,
        output: null,
        executionTimeMs: 0,
        error: `Adapter "${adapterId}" is not registered in the Scientific Engine Registry.`,
      };
    }

    // Enforce configured execution timeout
    const timeoutMs = request.timeoutMs || adapter.metadata.resourceLimits.maxExecutionTimeMs;
    let timer: NodeJS.Timeout | null = null;

    const timeoutPromise = new Promise<AdapterExecutionResult>((_, reject) => {
      timer = setTimeout(
        () =>
          reject(
            new Error(
              `Execution timed out after ${timeoutMs}ms for adapter "${adapterId}" (action: ${request.action}).`
            )
          ),
        timeoutMs
      );
    });

    try {
      const res = await Promise.race([adapter.execute(request), timeoutPromise]);
      if (timer) clearTimeout(timer);
      return res;
    } catch (err: any) {
      if (timer) clearTimeout(timer);
      return {
        success: false,
        adapterId,
        action: request.action,
        output: null,
        executionTimeMs: timeoutMs,
        error: err.message || 'Execution failed',
      };
    }
  }

  public resetAll(): void {
    Array.from(this.adapters.values()).forEach((adapter) => {
      adapter.reset();
    });
  }
}
