/**
 * VisiOS — Telemetry & Audit Logger Store
 * In-memory ring buffer capturing all API requests, responses, errors, and client lifecycle events.
 */

import { TelemetryLogEntry, TelemetryStats } from '@/types/telemetry';

class TelemetryStore {
  private logs: TelemetryLogEntry[] = [];
  private maxLogs: number = 200;

  public logEvent(entry: Omit<TelemetryLogEntry, 'id' | 'timestamp'>): TelemetryLogEntry {
    const fullEntry: TelemetryLogEntry = {
      id: `tel-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: Date.now(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs.pop();
    }

    // In non-production or dev, optionally log errors/warnings to server console
    if (entry.level === 'error') {
      console.error(`[TELEMETRY ERROR] [${entry.component}] [${entry.action}]:`, entry.details, entry.errorTrace);
    }

    return fullEntry;
  }

  public getRecentLogs(limit: number = 50, category?: string): TelemetryLogEntry[] {
    let filtered = this.logs;
    if (category) {
      filtered = filtered.filter((l) => l.category === category);
    }
    return filtered.slice(0, limit);
  }

  public getStats(): TelemetryStats {
    const totalCalls = this.logs.length;
    const errorCount = this.logs.filter((l) => l.level === 'error').length;
    const successCount = this.logs.filter((l) => l.level === 'success').length;
    
    const latencies = this.logs
      .map((l) => l.durationMs)
      .filter((d): d is number => typeof d === 'number');
    
    const averageLatencyMs = latencies.length > 0
      ? Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length)
      : 0;

    const lastError = this.logs.find((l) => l.level === 'error');

    return {
      totalCalls,
      errorCount,
      successCount,
      averageLatencyMs,
      lastErrorTimestamp: lastError ? lastError.timestamp : null,
    };
  }

  public clear(): void {
    this.logs = [];
  }
}

export const telemetryStore = new TelemetryStore();
