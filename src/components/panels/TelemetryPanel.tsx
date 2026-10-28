'use client';

import React, { useState, useEffect } from 'react';
import { Activity, Info, RefreshCw, AlertTriangle, CheckCircle, ShieldAlert, Zap } from 'lucide-react';
import { BoardStats } from '@/types';
import { TelemetryLogEntry, TelemetryStats } from '@/types/telemetry';

interface TelemetryPanelProps {
  boardStats: BoardStats;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ boardStats }) => {
  const [logs, setLogs] = useState<TelemetryLogEntry[]>([]);
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const fetchTelemetry = async () => {
    try {
      setIsLoading(true);
      const categoryParam = filterCategory !== 'all' ? `&category=${filterCategory}` : '';
      const res = await fetch(`/api/telemetry?limit=40${categoryParam}`);
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
        setStats(data.stats || null);
      }
    } catch (e) {
      console.error('Failed to load telemetry logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 3000);
    return () => clearInterval(interval);
  }, [filterCategory]);

  return (
    <div className="space-y-4 text-xs text-slate-200">
      {/* Board & Telemetry Overview */}
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-2">
        <div className="flex items-center justify-between text-cyan-400 font-semibold">
          <div className="flex items-center space-x-2">
            <Activity className="w-4 h-4" />
            <span>Telemetry & Endpoint Audit</span>
          </div>
          <button
            onClick={fetchTelemetry}
            className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="grid grid-cols-4 gap-2 text-[11px] pt-1">
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Total Calls</div>
            <div className="text-sm font-bold font-mono text-slate-200">{stats?.totalCalls ?? 0}</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Errors</div>
            <div className={`text-sm font-bold font-mono ${stats?.errorCount ? 'text-rose-400' : 'text-emerald-400'}`}>
              {stats?.errorCount ?? 0}
            </div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Avg Latency</div>
            <div className="text-sm font-bold font-mono text-cyan-400">{stats?.averageLatencyMs ?? 0}ms</div>
          </div>
          <div className="bg-slate-900/60 p-2 rounded-lg border border-slate-800">
            <div className="text-slate-500 text-[10px]">Canvas Shapes</div>
            <div className="text-sm font-bold font-mono text-violet-400">{boardStats.objectCount}</div>
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px]">
        {['all', 'api', 'canvas', 'intelligence', 'research'].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-2 py-0.5 rounded-md border font-mono uppercase transition-colors ${
              filterCategory === cat
                ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Live Stream Audit Log */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
          <span>Live Call Stream</span>
          <span className="text-[10px] font-mono">{logs.length} logged events</span>
        </div>

        {logs.length === 0 ? (
          <div className="p-4 text-center text-slate-500 bg-slate-900/40 rounded-xl border border-slate-800">
            No telemetry records logged yet.
          </div>
        ) : (
          <div className="max-h-[300px] overflow-y-auto space-y-1.5 pr-1 font-mono text-[10px]">
            {logs.map((log) => (
              <div
                key={log.id}
                className={`p-2 rounded-lg border flex flex-col gap-1 ${
                  log.level === 'error'
                    ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                    : log.level === 'warn'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                    : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold flex items-center gap-1">
                    {log.level === 'error' ? '❌' : log.level === 'warn' ? '⚠️' : '⚡'} {log.action}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Source: <strong className="text-slate-200 font-sans">{log.component}</strong></span>
                  {log.durationMs !== undefined && (
                    <span className="text-cyan-400">{log.durationMs}ms</span>
                  )}
                </div>

                {log.endpoint && (
                  <div className="text-[9px] text-indigo-300">
                    Endpoint: {log.endpoint} {log.statusCode ? `(${log.statusCode})` : ''}
                  </div>
                )}

                {log.details && (
                  <div className="text-[9px] text-slate-400 truncate">
                    {typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}
                  </div>
                )}

                {log.errorTrace && (
                  <pre className="text-[9px] text-rose-300 overflow-x-auto whitespace-pre-wrap max-h-16 bg-black/40 p-1 rounded">
                    {log.errorTrace}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
