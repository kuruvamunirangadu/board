/**
 * VisiOS — Diagnostics, Telemetry & Audit Types
 * Structured logging for API calls, client operations, formula parsing, and error provenance.
 */

export type TelemetryLevel = 'info' | 'warn' | 'error' | 'success';

export interface TelemetryLogEntry {
  id: string;
  timestamp: number;
  level: TelemetryLevel;
  category: 'api' | 'canvas' | 'intelligence' | 'simulation' | 'research' | 'authoring';
  endpoint?: string;
  component: string;
  action: string;
  details?: Record<string, any> | string;
  durationMs?: number;
  statusCode?: number;
  errorTrace?: string;
}

export interface TelemetryStats {
  totalCalls: number;
  errorCount: number;
  successCount: number;
  averageLatencyMs: number;
  lastErrorTimestamp: number | null;
}
