'use client';

import React, { useState, useEffect } from 'react';
import { 
  GitCompare, 
  X, 
  CheckSquare, 
  Square, 
  Trash2, 
  Info, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles
} from 'lucide-react';
import { ExperimentCheckpoint } from '@/types/session';
import { compareCheckpoints } from '@/features/simulation/experiment-comparison';
import { sessionPersistence } from '@/lib/persistence';

interface ExperimentComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  isImmersive?: boolean;
}

export const ExperimentComparisonModal: React.FC<ExperimentComparisonModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  isImmersive = false,
}) => {
  const [allCheckpoints, setAllCheckpoints] = useState<ExperimentCheckpoint[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadCheckpoints = async () => {
    setIsLoading(true);
    try {
      const list = await sessionPersistence.listCheckpoints(sessionId);
      setAllCheckpoints(list);
      // Default to selecting all or the first 3
      setSelectedIds(list.slice(0, 3).map((cp) => cp.id));
    } catch (e) {
      console.error('Failed to load checkpoints', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCheckpoints();
    }
  }, [isOpen, sessionId]);

  if (!isOpen) return null;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this experiment checkpoint?')) {
      await sessionPersistence.deleteCheckpoint(sessionId, id);
      await loadCheckpoints();
    }
  };

  const selectedCheckpoints = allCheckpoints.filter((cp) =>
    selectedIds.includes(cp.id)
  );

  const comparison = compareCheckpoints(selectedCheckpoints);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 sm:p-6 animate-fadeIn">
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-2xl flex flex-col shadow-2xl border overflow-hidden transition-all ${
          isImmersive
            ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-cyan-950/70'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Experiment Checkpoint Comparison</h2>
              <p className="text-xs text-slate-400">
                Compare parameters, recorded physical outputs, and metric deltas side by side
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Checkpoint Selector Chips */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Select Checkpoints to Compare ({selectedIds.length} active)</span>
              <span className="text-slate-500 font-normal">
                {allCheckpoints.length} total saved in this session
              </span>
            </div>

            {isLoading ? (
              <div className="text-xs text-slate-400 py-2">Loading checkpoints...</div>
            ) : allCheckpoints.length === 0 ? (
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-400">
                No checkpoints saved yet. Run the simulation and click "Save Checkpoint" to record experiments.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {allCheckpoints.map((cp) => {
                  const isSelected = selectedIds.includes(cp.id);
                  return (
                    <div
                      key={cp.id}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl border text-xs transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <button
                        onClick={() => toggleSelect(cp.id)}
                        className="flex items-center space-x-1.5 font-medium"
                      >
                        {isSelected ? (
                          <CheckSquare className="w-3.5 h-3.5 text-cyan-400" />
                        ) : (
                          <Square className="w-3.5 h-3.5" />
                        )}
                        <span>{cp.name}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(cp.id)}
                        className="p-0.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete checkpoint"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {selectedCheckpoints.length > 0 && (
            <>
              {/* Empirical Observations Box */}
              {comparison.observations.length > 0 && (
                <div
                  className={`p-4 rounded-xl border space-y-2 ${
                    isImmersive
                      ? 'bg-indigo-950/30 border-indigo-500/30 text-indigo-100'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-200'
                  }`}
                >
                  <div className="flex items-center space-x-2 text-xs font-semibold text-cyan-400">
                    <Sparkles className="w-4 h-4" />
                    <span>Empirical Comparison Analysis</span>
                  </div>
                  <div className="space-y-1 text-xs">
                    {comparison.observations.map((obs, i) => (
                      <p key={i} className="text-slate-300 leading-relaxed">
                        • {obs}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Comparison Matrix Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden bg-slate-950/50">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-900/80 border-b border-slate-800 text-slate-400">
                        <th className="p-3 font-semibold min-w-[160px]">Metric / Parameter</th>
                        <th className="p-3 font-semibold min-w-[70px]">Unit</th>
                        {selectedCheckpoints.map((cp, idx) => (
                          <th key={cp.id} className="p-3 font-semibold min-w-[180px]">
                            <div className="text-slate-200 font-bold">{cp.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {idx === 0 ? '(Baseline Experiment)' : `(Checkpoint #${idx + 1})`}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {/* Section Header: Parameters */}
                      <tr className="bg-slate-900/40">
                        <td
                          colSpan={selectedCheckpoints.length + 2}
                          className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-cyan-400"
                        >
                          Input Parameters
                        </td>
                      </tr>
                      {comparison.parameterDiffs.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-900/30">
                          <td className="p-3 font-medium text-slate-300">{row.label}</td>
                          <td className="p-3 font-mono text-slate-400">{row.unit || '—'}</td>
                          {row.values.map((val, idx) => {
                            const diff = row.differences[idx];
                            const pct = row.percentChanges[idx];
                            return (
                              <td key={idx} className="p-3 font-mono">
                                <div className="text-slate-100 font-semibold">
                                  {val !== null ? val : '—'}
                                </div>
                                {idx > 0 && diff !== null && diff !== 0 && (
                                  <div
                                    className={`text-[10px] flex items-center space-x-1 mt-0.5 ${
                                      diff > 0 ? 'text-cyan-400' : 'text-amber-400'
                                    }`}
                                  >
                                    {diff > 0 ? (
                                      <TrendingUp className="w-2.5 h-2.5" />
                                    ) : (
                                      <TrendingDown className="w-2.5 h-2.5" />
                                    )}
                                    <span>
                                      {diff > 0 ? `+${diff}` : diff}
                                      {pct !== null ? ` (${pct > 0 ? `+${pct}%` : `${pct}%`})` : ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}

                      {/* Section Header: Recorded Metrics */}
                      <tr className="bg-slate-900/40">
                        <td
                          colSpan={selectedCheckpoints.length + 2}
                          className="px-3 py-1.5 font-bold uppercase tracking-wider text-[10px] text-emerald-400"
                        >
                          Measured Physical Outputs
                        </td>
                      </tr>
                      {comparison.metricDiffs.map((row) => (
                        <tr key={row.key} className="hover:bg-slate-900/30">
                          <td className="p-3 font-medium text-slate-300">{row.label}</td>
                          <td className="p-3 font-mono text-slate-400">{row.unit || '—'}</td>
                          {row.values.map((val, idx) => {
                            const diff = row.differences[idx];
                            const pct = row.percentChanges[idx];
                            return (
                              <td key={idx} className="p-3 font-mono">
                                <div className="text-emerald-300 font-semibold">
                                  {val !== null ? val : '—'}
                                </div>
                                {idx > 0 && diff !== null && diff !== 0 && (
                                  <div
                                    className={`text-[10px] flex items-center space-x-1 mt-0.5 ${
                                      diff > 0 ? 'text-emerald-400' : 'text-rose-400'
                                    }`}
                                  >
                                    {diff > 0 ? (
                                      <TrendingUp className="w-2.5 h-2.5" />
                                    ) : (
                                      <TrendingDown className="w-2.5 h-2.5" />
                                    )}
                                    <span>
                                      {diff > 0 ? `+${diff}` : diff}
                                      {pct !== null ? ` (${pct > 0 ? `+${pct}%` : `${pct}%`})` : ''}
                                    </span>
                                  </div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="text-slate-400 text-[11px] flex items-center space-x-1.5">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Comparisons reflect real recorded simulation telemetry without artificial smoothing.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

