'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Wrench,
  Trash2,
  Info,
  Layers,
  ChevronRight,
  Filter,
  Zap,
} from 'lucide-react';
import {
  VisualLearningDiagnosticsEngine,
  DiagnosticResult,
  DiagnosticFailureCategory,
  DiagnosticSeverity,
} from '@/features/diagnostics/VisualLearningDiagnosticsEngine';

interface VisualLearningDiagnosticsPanelProps {
  currentTopic?: string;
  className?: string;
  onClose?: () => void;
}

export const VisualLearningDiagnosticsPanel: React.FC<VisualLearningDiagnosticsPanelProps> = ({
  currentTopic = 'Binary Search',
  className = '',
  onClose,
}) => {
  const [events, setEvents] = useState<DiagnosticResult[]>(() =>
    VisualLearningDiagnosticsEngine.getRecentEvents()
  );
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [healthSummary, setHealthSummary] = useState(() =>
    VisualLearningDiagnosticsEngine.getHealthSummary()
  );
  const [isRunningAudit, setIsRunningAudit] = useState(false);

  // Subscribe to live events
  useEffect(() => {
    const unsubscribe = VisualLearningDiagnosticsEngine.subscribe((newEvent) => {
      setEvents(VisualLearningDiagnosticsEngine.getRecentEvents());
      setHealthSummary(VisualLearningDiagnosticsEngine.getHealthSummary());
    });
    return unsubscribe;
  }, []);

  const refreshSummary = () => {
    setEvents(VisualLearningDiagnosticsEngine.getRecentEvents());
    setHealthSummary(VisualLearningDiagnosticsEngine.getHealthSummary());
  };

  const handleClearHistory = () => {
    VisualLearningDiagnosticsEngine.clearHistory();
    refreshSummary();
  };

  // Run comprehensive health audit on current topic
  const handleRunHealthAudit = () => {
    setIsRunningAudit(true);
    try {
      // 1. Verify Learning Route
      VisualLearningDiagnosticsEngine.verifyLearningRoute(currentTopic);

      // 2. Validate Deterministic Invariant Check
      if (currentTopic.toLowerCase().includes('linear') || currentTopic.includes('=')) {
        VisualLearningDiagnosticsEngine.validateDeterministicResults(
          currentTopic,
          { m: 2, c: 3, x: 4 },
          { y: 11 },
          'y = 2x + 3 with slope 2'
        );
      } else {
        VisualLearningDiagnosticsEngine.validateDeterministicResults(
          'Pythagorean Dissection',
          { a: 3, b: 4 },
          { c: 5 },
          'In a 3-4-5 right triangle, hypotenuse is 5.'
        );
      }

      // 3. Visualization Health Check
      VisualLearningDiagnosticsEngine.checkVisualizationHealth(currentTopic, {
        rendererType: 'threejs_viewer',
        is3D: true,
        webGLAvailable: true,
        hasData: true,
      });

      // 4. Session Persistence Health Check
      VisualLearningDiagnosticsEngine.validateAndRepairSession({
        schemaVersion: 1,
        id: `session-live-audit`,
        primaryTopic: currentTopic,
        currentLessonStep: 'concept_meaning',
        completedSteps: [],
        activeTab: 'understand',
        isGuidedMode: true,
        isCompleted: false,
      });

      refreshSummary();
    } finally {
      setIsRunningAudit(false);
    }
  };

  // Run simulated failure and self-repair verification
  const handleSimulateSelfRepair = () => {
    setIsRunningAudit(true);
    try {
      // Simulation 1: WebGL failure recovery -> 2D schematic fallback
      VisualLearningDiagnosticsEngine.checkVisualizationHealth(currentTopic, {
        rendererType: 'threejs_viewer',
        is3D: true,
        webGLAvailable: false,
      });

      // Simulation 2: Explanation contradiction self-repair
      VisualLearningDiagnosticsEngine.validateDeterministicResults(
        'Linear Function Slope Check',
        { m: 3, c: 1, x: 2 },
        { y: 7 },
        'The formula has slope 3, but explanation claims slope is 9.'
      );

      // Simulation 3: Corrupted session restoration self-repair
      VisualLearningDiagnosticsEngine.validateAndRepairSession({
        schemaVersion: 1,
        corruptedKey: null,
      });

      refreshSummary();
    } finally {
      setIsRunningAudit(false);
    }
  };

  const filteredEvents = events.filter((ev) => {
    const matchesCat = categoryFilter === 'all' || ev.failureCategory === categoryFilter;
    const matchesSev = severityFilter === 'all' || ev.severity === severityFilter;
    return matchesCat && matchesSev;
  });

  return (
    <div
      className={`rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-4 text-xs text-slate-200 select-none ${className}`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">
              Visual Learning Quality & Self-Repair Engine
            </h3>
            <p className="text-[10px] text-slate-400">
              Milestone 7 Diagnostics, Invariant Validation & Safe Fallbacks
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleRunHealthAudit}
            disabled={isRunningAudit}
            className="px-2.5 py-1 rounded-lg bg-cyan-700 hover:bg-cyan-600 font-semibold text-white text-[11px] flex items-center space-x-1 transition-all shadow-sm disabled:opacity-50"
            title="Audit current topic across routing, math, and renderers"
          >
            <Activity className={`w-3.5 h-3.5 ${isRunningAudit ? 'animate-spin' : ''}`} />
            <span>Audit Topic</span>
          </button>

          <button
            type="button"
            onClick={handleSimulateSelfRepair}
            disabled={isRunningAudit}
            className="px-2.5 py-1 rounded-lg bg-indigo-700/80 hover:bg-indigo-600 font-semibold text-white text-[11px] flex items-center space-x-1 transition-all shadow-sm disabled:opacity-50"
            title="Simulate failures and verify self-repair recovery paths"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Verify Repair</span>
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Health Overview Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium">Health Score</div>
          <div className="flex items-baseline space-x-1.5">
            <span
              className={`text-lg font-bold font-mono ${
                healthSummary.healthScore >= 90
                  ? 'text-emerald-400'
                  : healthSummary.healthScore >= 70
                  ? 'text-amber-400'
                  : 'text-red-400'
              }`}
            >
              {healthSummary.healthScore}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {healthSummary.status === 'healthy'
                ? 'Optimal'
                : healthSummary.status === 'self_repaired'
                ? 'Self-Repaired'
                : 'Attention'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium">Self-Repaired</div>
          <div className="text-lg font-bold font-mono text-cyan-400">
            {healthSummary.recoveredCount}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium">Warnings / Info</div>
          <div className="text-lg font-bold font-mono text-amber-400">
            {healthSummary.warningCount}
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
          <div className="text-[10px] text-slate-400 font-medium">Total Audits</div>
          <div className="text-lg font-bold font-mono text-slate-300">
            {healthSummary.totalEvents}
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between gap-2 text-[11px] pt-1">
        <div className="flex items-center space-x-2 overflow-x-auto">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            <span>Category:</span>
          </span>
          {[
            { id: 'all', label: 'All' },
            { id: 'topic_classification_failure', label: 'Routing' },
            { id: 'mathematical_validation_failure', label: 'Math Oracles' },
            { id: 'explanation_inconsistency', label: 'Contradictions' },
            { id: 'renderer_initialization_failure', label: 'Renderers' },
            { id: 'session_restoration_failure', label: 'Session' },
            { id: 'unsupported_topic', label: 'Unsupported' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2 py-0.5 rounded-md transition-all whitespace-nowrap ${
                categoryFilter === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {events.length > 0 && (
          <button
            type="button"
            onClick={handleClearHistory}
            className="text-slate-500 hover:text-red-400 p-1 rounded transition-colors shrink-0"
            title="Clear event logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Diagnostic Events Stream */}
      <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin pr-1">
        {filteredEvents.length === 0 ? (
          <div className="py-8 text-center text-slate-500 space-y-1 border border-dashed border-slate-800/80 rounded-xl">
            <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400 opacity-70" />
            <div className="font-semibold text-slate-300">All Systems Healthy</div>
            <p className="text-[10px]">
              No diagnostic faults detected. Click &ldquo;Audit Topic&rdquo; to run live checks.
            </p>
          </div>
        ) : (
          filteredEvents.map((ev) => (
            <div
              key={ev.diagnosticId}
              className={`p-3 rounded-xl border space-y-1.5 transition-all ${
                ev.severity === 'error' || ev.severity === 'critical'
                  ? 'bg-red-950/20 border-red-900/40 text-red-200'
                  : ev.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              {/* Event Header */}
              <div className="flex items-center justify-between text-[10px]">
                <div className="flex items-center space-x-1.5">
                  <span
                    className={`px-1.5 py-0.2 rounded font-mono font-bold uppercase text-[9px] ${
                      ev.severity === 'error' || ev.severity === 'critical'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : ev.severity === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {ev.severity}
                  </span>
                  <span className="font-bold text-white truncate max-w-xs">{ev.affectedTopic}</span>
                  <span className="text-slate-500 font-mono">({ev.learningComponent})</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold ${
                      ev.recoveryOutcome === 'recovered'
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                        : ev.recoveryOutcome === 'fallback_applied'
                        ? 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                        : ev.recoveryOutcome === 'no_action_needed'
                        ? 'bg-slate-900 text-slate-400'
                        : 'bg-red-950 text-red-400'
                    }`}
                  >
                    {ev.recoveryOutcome === 'recovered' && '✓ Self-Repaired'}
                    {ev.recoveryOutcome === 'fallback_applied' && '↩ Fallback Applied'}
                    {ev.recoveryOutcome === 'no_action_needed' && '✓ Verified'}
                    {ev.recoveryOutcome === 'unrecoverable' && '✖ Unrecoverable'}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* User-Safe Explanation */}
              <p className="text-[11px] leading-relaxed text-slate-200">
                {ev.userSafeExplanation}
              </p>

              {/* Recovery Action Taken Badge */}
              {ev.appliedRecoveryAction && (
                <div className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[10px] flex items-center space-x-1.5 text-cyan-300">
                  <Wrench className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="font-semibold text-slate-400">Safe Action Taken:</span>
                  <span>{ev.appliedRecoveryAction}</span>
                </div>
              )}

              {/* Technical Dev Note (If applicable, strictly sanitized) */}
              {ev.technicalDetails && (
                <div className="text-[10px] text-slate-500 font-mono pt-0.5">
                  🔍 Dev Note: {ev.technicalDetails}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

