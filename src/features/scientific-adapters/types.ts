/**
 * VisiOS — Open Source Scientific Adapter Architecture Types
 *
 * Defines standardized interfaces, capabilities, health states, and resource boundaries
 * for JupyterLite/Pyodide, Ketcher, Rapier, Mol*, and Manim integrations.
 */

export type ScientificIntegrationId =
  | 'pyodide'
  | 'jupyterlite'
  | 'ketcher'
  | 'rapier'
  | 'molstar'
  | 'manim';

export type SubjectAdapterId =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer_science';

export type IntegrationHealthStatus =
  | 'available'
  | 'degraded'
  | 'unavailable'
  | 'loading';

export type SoftwareLicenseType =
  | 'MIT'
  | 'Apache-2.0'
  | 'BSD-3-Clause'
  | 'GPL-3.0'
  | 'MPL-2.0'
  | 'Open-Source';

export interface ResourceLimits {
  maxMemoryMb: number;
  maxExecutionTimeMs: number;
  maxFileSizeMb?: number;
  concurrentInstances?: number;
}

export interface ScientificIntegrationMetadata {
  id: ScientificIntegrationId;
  subject: SubjectAdapterId;
  name: string;
  version: string;
  description: string;
  license: SoftwareLicenseType;
  licenseNotice: string;
  healthStatus: IntegrationHealthStatus;
  capabilities: string[];
  resourceLimits: ResourceLimits;
  documentationUrl: string;
  browserExecutionSupported: boolean;
  requiresBackendService: boolean;
}

export interface AdapterExecutionRequest {
  action: string;
  payload: Record<string, any>;
  timeoutMs?: number;
}

export interface AdapterExecutionResult {
  success: boolean;
  adapterId: ScientificIntegrationId;
  action: string;
  output: any;
  executionTimeMs: number;
  error?: string;
  resourceUsage?: {
    memoryMb?: number;
    wallClockMs?: number;
  };
}

export interface ScientificAdapter {
  metadata: ScientificIntegrationMetadata;
  checkHealth(): Promise<IntegrationHealthStatus>;
  execute(request: AdapterExecutionRequest): Promise<AdapterExecutionResult>;
  reset(): void;
}
