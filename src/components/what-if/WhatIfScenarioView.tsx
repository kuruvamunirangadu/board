'use client';

import React, { useState, useMemo } from 'react';
import {
  GitCompare,
  Sliders,
  Play,
  RotateCcw,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Clock,
  Layers,
  ArrowRight,
  Zap,
  Info,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import {
  ScenarioConfig,
  ScenarioResult,
  ScenarioPrediction,
  ScenarioComparisonReport,
  PredictionDirection,
  TrajectoryPoint,
} from '@/features/what-if/WhatIfTypes';
import { WhatIfExecutionService } from '@/features/what-if/WhatIfExecutionService';
import {
  EXPERIMENT_CATALOGUE,
  ExperimentCatalogueService,
} from '@/features/experiment/ExperimentCatalogue';
import { ExperimentDefinition } from '@/features/experiment/ExperimentTypes';

interface WhatIfScenarioViewProps {
  initialExperimentId?: string;
  onStampToCanvas?: (title: string, content: string) => void;
}

export const WhatIfScenarioView: React.FC<WhatIfScenarioViewProps> = ({
  initialExperimentId = 'exp_projectile_motion',
  onStampToCanvas,
}) => {
  const [selectedExpId, setSelectedExpId] = useState<string>(initialExperimentId);

  const activeExp: ExperimentDefinition = useMemo(() => {
    return ExperimentCatalogueService.getById(selectedExpId) || EXPERIMENT_CATALOGUE[0];
  }, [selectedExpId]);

  // Baseline Scenario (Immutable reference state)
  const [baseline, setBaseline] = useState<ScenarioConfig>(() =>
    WhatIfExecutionService.createDefaultBaseline(selectedExpId)
  );

  // Alternatives List
  const [alternatives, setAlternatives] = useState<ScenarioConfig[]>(() => [
    WhatIfExecutionService.cloneAsAlternative(
      WhatIfExecutionService.createDefaultBaseline(selectedExpId),
      'Alternative A'
    ),
  ]);

  const [activeAltId, setActiveAltId] = useState<string>(() => alternatives[0].id);

  // Active alternative config
  const activeAlt = useMemo(() => {
    return alternatives.find((a) => a.id === activeAltId) || alternatives[0];
  }, [alternatives, activeAltId]);

  // Prediction State
  const [prediction, setPrediction] = useState<ScenarioPrediction | null>(null);

  // Execute scenarios deterministically
  const baselineResult: ScenarioResult = useMemo(() => {
    return WhatIfExecutionService.executeScenario(baseline);
  }, [baseline]);

  const activeAltResult: ScenarioResult = useMemo(() => {
    return WhatIfExecutionService.executeScenario(activeAlt);
  }, [activeAlt]);

  // Compute live comparison report
  const comparison: ScenarioComparisonReport = useMemo(() => {
    return WhatIfExecutionService.compareScenarios(
      baseline,
      baselineResult,
      activeAlt,
      activeAltResult,
      prediction || undefined
    );
  }, [baseline, baselineResult, activeAlt, activeAltResult, prediction]);

  // Handle switching experiments
  const handleSelectExperiment = (expId: string) => {
    setSelectedExpId(expId);
    const newBase = WhatIfExecutionService.createDefaultBaseline(expId);
    setBaseline(newBase);
    const newAlt = WhatIfExecutionService.cloneAsAlternative(newBase, 'Alternative A');
    setAlternatives([newAlt]);
    setActiveAltId(newAlt.id);
    setPrediction(null);
  };

  // Update alternative parameter
  const handleParamChange = (symbol: string, value: number) => {
    setAlternatives((prev) =>
      prev.map((alt) => {
        if (alt.id === activeAltId) {
          return {
            ...alt,
            parameters: {
              ...alt.parameters,
              [symbol]: value,
            },
            updatedAt: Date.now(),
          };
        }
        return alt;
      })
    );
  };

  // Add a new alternative
  const handleAddAlternative = () => {
    const nextLetter = String.fromCharCode(65 + alternatives.length);
    const newAlt = WhatIfExecutionService.cloneAsAlternative(
      baseline,
      `Alternative ${nextLetter}`
    );
    setAlternatives((prev) => [...prev, newAlt]);
    setActiveAltId(newAlt.id);
    setPrediction(null);
  };

  // Primary key predictable metric
  const primaryMetric = activeExp.dependentVariables[0];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Top Header & Experiment Switcher */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-violet-500/20 text-violet-400 border border-violet-500/30">
            <GitCompare className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-white">
                What-If Scenario Engine
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-violet-950 text-violet-300 border border-violet-500/30">
                Step 4
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Isolate variables, compare baseline against alternatives, and discover cause-and-effect
            </p>
          </div>
        </div>

        {/* Experiment Selector Tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
          {EXPERIMENT_CATALOGUE.map((exp) => (
            <button
              key={exp.id}
              onClick={() => handleSelectExperiment(exp.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedExpId === exp.id
                  ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {exp.title.split(' ')[0]} {exp.title.split(' ')[1] || ''}
            </button>
          ))}
        </div>
      </div>

      {/* Scenario Tabs Bar */}
      <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Baseline Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shrink-0">
            <div className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Baseline (Original)</span>
            <span className="text-[9px] px-1 py-0.2 rounded bg-cyan-900/40 text-cyan-300 uppercase">
              Locked
            </span>
          </div>

          <ArrowRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />

          {/* Alternative Selector Tabs */}
          {alternatives.map((alt) => (
            <button
              key={alt.id}
              onClick={() => setActiveAltId(alt.id)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-all ${
                alt.id === activeAltId
                  ? 'bg-amber-500/20 border border-amber-400 text-amber-200 shadow-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-amber-400" />
              <span>{alt.name}</span>
            </button>
          ))}

          {/* Add Alternative Button */}
          {alternatives.length < 3 && (
            <button
              onClick={handleAddAlternative}
              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white text-xs flex items-center gap-1 transition-colors shrink-0"
              title="Add another alternative scenario"
            >
              <Plus className="w-3 h-3" />
              <span>Add Alternative</span>
            </button>
          )}
        </div>

        {/* Reset Baseline */}
        <button
          onClick={() => {
            const freshBase = WhatIfExecutionService.createDefaultBaseline(selectedExpId);
            setBaseline(freshBase);
            const freshAlt = WhatIfExecutionService.cloneAsAlternative(freshBase, activeAlt.name);
            setAlternatives((prev) =>
              prev.map((a) => (a.id === activeAltId ? freshAlt : a))
            );
            setPrediction(null);
          }}
          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 flex items-center gap-1 transition-colors shrink-0"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset All</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* 1. Side-by-Side Parameter Experimentation Dock */}
        <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-400" />
              <span>Interactive Parameter Comparison</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {comparison.changedParameters.length === 0
                ? 'Identical parameters'
                : `${comparison.changedParameters.length} variable(s) modified`}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            {activeExp.independentVariables.map((v) => {
              const bVal = baseline.parameters[v.symbol] ?? v.defaultValue;
              const aVal = activeAlt.parameters[v.symbol] ?? v.defaultValue;
              const isDifferent = Math.abs(bVal - aVal) > 0.001;

              return (
                <div
                  key={v.symbol}
                  className={`p-2.5 rounded-xl border text-xs space-y-2 transition-all ${
                    isDifferent
                      ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                      : 'bg-slate-900/40 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">{v.name}</span>
                    {isDifferent ? (
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold">
                        Δ = {aVal - bVal > 0 ? '+' : ''}
                        {Number((aVal - bVal).toFixed(2))} {v.unit}
                      </span>
                    ) : (
                      <span className="text-[9px] text-slate-500 font-mono">Constant</span>
                    )}
                  </div>

                  {/* Baseline (Read-only reference) */}
                  <div className="flex items-center justify-between text-[11px] font-mono bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
                    <span className="text-cyan-400">Baseline:</span>
                    <span className="text-white font-bold">
                      {bVal} {v.unit}
                    </span>
                  </div>

                  {/* Alternative Slider Control */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400">Alternative:</span>
                      <span className="font-bold text-amber-200">
                        {aVal} {v.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={v.min}
                      max={v.max}
                      step={v.step}
                      value={aVal}
                      onChange={(e) => handleParamChange(v.symbol, parseFloat(e.target.value))}
                      className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Formative Prediction Challenge */}
        {comparison.changedParameters.length > 0 && (
          <div className="p-3.5 rounded-xl border bg-purple-950/20 border-purple-500/30 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Formative Prediction Challenge</span>
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-400/30">
                Scientific Method
              </span>
            </div>

            <p className="text-xs text-slate-200">
              When changing {comparison.changedParameters.map((p) => p.name).join(' & ')}, how do
              you predict <span className="font-bold text-purple-300">{primaryMetric.name}</span>{' '}
              will change relative to the baseline?
            </p>

            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { direction: 'increase', label: '📈 Increase', icon: TrendingUp },
                  { direction: 'decrease', label: '📉 Decrease', icon: TrendingDown },
                  { direction: 'no_change', label: '⏸ Stay the Same', icon: Minus },
                ] as { direction: PredictionDirection; label: string; icon: any }[]
              ).map((opt) => {
                const isSelected = prediction?.expectedDirection === opt.direction;
                return (
                  <button
                    key={opt.direction}
                    onClick={() =>
                      setPrediction({
                        metricSymbol: primaryMetric.symbol,
                        expectedDirection: opt.direction,
                        recordedAt: Date.now(),
                      })
                    }
                    className={`py-2 px-3 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 border-purple-400 text-white shadow-md shadow-purple-600/30'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>

            {comparison.predictionEvaluation && (
              <div
                className={`p-2.5 rounded-lg text-xs leading-relaxed border flex items-start gap-2 ${
                  comparison.predictionEvaluation.isMatched
                    ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                    : 'bg-amber-950/40 border-amber-500/30 text-amber-200'
                }`}
              >
                {comparison.predictionEvaluation.isMatched ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold mb-0.5">
                    {comparison.predictionEvaluation.isMatched
                      ? 'Hypothesis Confirmed by Simulation!'
                      : 'Interesting Physical Divergence!'}
                  </p>
                  <p>{comparison.predictionEvaluation.feedbackSummary}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Visual Comparison Overlay Canvas */}
        <div className="p-3.5 rounded-xl border bg-slate-950/90 border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>Comparative Visualization Overlay</span>
            </span>
            <div className="flex items-center gap-3 text-[10px] font-mono">
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-3 h-0.5 bg-cyan-400 inline-block" /> Baseline
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" /> Alternative
              </span>
            </div>
          </div>

          {/* Projectile Trajectory Overlay */}
          {selectedExpId === 'exp_projectile_motion' &&
            baselineResult.visualData?.trajectoryPoints &&
            activeAltResult.visualData?.trajectoryPoints && (
              <div className="flex flex-col items-center">
                <svg
                  viewBox="0 0 320 140"
                  className="w-full h-44 bg-slate-900 rounded-xl border border-slate-800 p-2"
                >
                  {/* Ground line */}
                  <line x1="20" y1="120" x2="300" y2="120" stroke="#475569" strokeWidth="1.5" />

                  {/* Scale calculations */}
                  {(() => {
                    const maxR = Math.max(
                      10,
                      baselineResult.metrics.range || 40,
                      activeAltResult.metrics.range || 40
                    );
                    const maxH = Math.max(
                      5,
                      baselineResult.metrics.maxHeight || 10,
                      activeAltResult.metrics.maxHeight || 10
                    );

                    const scaleX = 260 / maxR;
                    const scaleY = 95 / maxH;

                    const makePath = (pts: TrajectoryPoint[]) =>
                      pts
                        .map((p, idx) => {
                          const px = 25 + p.x * scaleX;
                          const py = 120 - p.y * scaleY;
                          return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
                        })
                        .join(' ');

                    return (
                      <>
                        {/* Baseline Curve */}
                        <path
                          d={makePath(baselineResult.visualData.trajectoryPoints)}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />

                        {/* Alternative Curve */}
                        <path
                          d={makePath(activeAltResult.visualData.trajectoryPoints)}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="2.5"
                        />

                        {/* Range Markers */}
                        <circle
                          cx={25 + baselineResult.metrics.range * scaleX}
                          cy="120"
                          r="3"
                          fill="#38bdf8"
                        />
                        <circle
                          cx={25 + activeAltResult.metrics.range * scaleX}
                          cy="120"
                          r="3"
                          fill="#fbbf24"
                        />
                      </>
                    );
                  })()}
                </svg>

                <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-2 mt-1">
                  <span>Launch (x=0m, y=0m)</span>
                  <span className="text-cyan-400">R_base: {baselineResult.formattedMetrics.range}</span>
                  <span className="text-amber-400">R_alt: {activeAltResult.formattedMetrics.range}</span>
                </div>
              </div>
            )}

          {/* Harmonic Pendulum Wave Overlay */}
          {selectedExpId === 'exp_harmonic_pendulum' &&
            baselineResult.visualData?.oscillationPoints &&
            activeAltResult.visualData?.oscillationPoints && (
              <div className="flex flex-col items-center">
                <svg
                  viewBox="0 0 320 140"
                  className="w-full h-44 bg-slate-900 rounded-xl border border-slate-800 p-2"
                >
                  {/* Equilibrium line */}
                  <line x1="20" y1="70" x2="300" y2="70" stroke="#475569" strokeWidth="1" strokeDasharray="2 2" />

                  {/* Render waveforms */}
                  {(() => {
                    const makeWave = (pts: { t: number; theta: number }[], color: string) => {
                      const d = pts
                        .map((p, idx) => {
                          const px = 25 + (p.t / (pts[pts.length - 1]?.t || 4)) * 270;
                          const py = 70 - (p.theta / 45) * 45;
                          return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
                        })
                        .join(' ');
                      return <path d={d} fill="none" stroke={color} strokeWidth="2.5" />;
                    };

                    return (
                      <>
                        {makeWave(baselineResult.visualData.oscillationPoints, '#38bdf8')}
                        {makeWave(activeAltResult.visualData.oscillationPoints, '#fbbf24')}
                      </>
                    );
                  })()}
                </svg>

                <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-2 mt-1">
                  <span className="text-cyan-400">T_base: {baselineResult.formattedMetrics.period}</span>
                  <span className="text-amber-400">T_alt: {activeAltResult.formattedMetrics.period}</span>
                </div>
              </div>
            )}

          {/* Newton Cart Motion Overlay */}
          {selectedExpId === 'exp_newton_second_law' &&
            baselineResult.visualData?.motionPoints &&
            activeAltResult.visualData?.motionPoints && (
              <div className="flex flex-col items-center">
                <svg
                  viewBox="0 0 320 140"
                  className="w-full h-44 bg-slate-900 rounded-xl border border-slate-800 p-2"
                >
                  <line x1="20" y1="120" x2="300" y2="120" stroke="#475569" strokeWidth="1" />

                  {(() => {
                    const maxPos = Math.max(
                      1,
                      baselineResult.metrics.distanceAt2s || 10,
                      activeAltResult.metrics.distanceAt2s || 10
                    );

                    const makeMotionCurve = (pts: { t: number; position: number }[], color: string) => {
                      const d = pts
                        .map((p, idx) => {
                          const px = 25 + (p.t / 4) * 270;
                          const py = 120 - (p.position / maxPos) * 90;
                          return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
                        })
                        .join(' ');
                      return <path d={d} fill="none" stroke={color} strokeWidth="2.5" />;
                    };

                    return (
                      <>
                        {makeMotionCurve(baselineResult.visualData.motionPoints, '#38bdf8')}
                        {makeMotionCurve(activeAltResult.visualData.motionPoints, '#fbbf24')}
                      </>
                    );
                  })()}
                </svg>

                <div className="flex items-center justify-between w-full text-[10px] font-mono text-slate-400 px-2 mt-1">
                  <span className="text-cyan-400">a_base: {baselineResult.formattedMetrics.acceleration}</span>
                  <span className="text-amber-400">a_alt: {activeAltResult.formattedMetrics.acceleration}</span>
                </div>
              </div>
            )}
        </div>

        {/* 4. Numerical Metrics Comparison Table */}
        <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-white flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span>Calculated Outcome Deltas</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Absolute (Δ) & Percentage (Δ%) Changes
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                  <th className="py-1.5 px-2">Metric</th>
                  <th className="py-1.5 px-2 text-cyan-400">Baseline</th>
                  <th className="py-1.5 px-2 text-amber-400">Alternative</th>
                  <th className="py-1.5 px-2">Absolute (Δ)</th>
                  <th className="py-1.5 px-2">Percent (Δ%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-[11px]">
                {comparison.metricDeltas.map((m) => (
                  <tr key={m.symbol} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-2 px-2 text-slate-300 font-sans font-medium">
                      {m.name}
                    </td>
                    <td className="py-2 px-2 text-cyan-300">
                      {m.baselineValue} {m.unit}
                    </td>
                    <td className="py-2 px-2 text-amber-300">
                      {m.alternativeValue} {m.unit}
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`font-bold ${
                          m.absoluteDelta > 0
                            ? 'text-emerald-400'
                            : m.absoluteDelta < 0
                            ? 'text-rose-400'
                            : 'text-slate-500'
                        }`}
                      >
                        {m.absoluteDelta > 0 ? '+' : ''}
                        {m.absoluteDelta} {m.unit}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          m.percentChange !== null && m.percentChange > 0
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                            : m.percentChange !== null && m.percentChange < 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-900 text-slate-400 border border-slate-800'
                        }`}
                      >
                        {m.percentChangeFormatted}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 5. Evidence-Grounded Explanation & Controlled Principle */}
        <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Grounded Causal Explanation</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              Governing Law Derivation
            </span>
          </div>

          {/* Controlled Variable Badge */}
          <div
            className={`p-2 rounded-lg text-xs border ${
              comparison.isSingleVariableControlled
                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
            }`}
          >
            {comparison.scientificValidityNote}
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">
            {comparison.deterministicExplanation}
          </p>

          {/* Assumptions & Boundary Box */}
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] text-slate-400 space-y-1">
            <span className="font-semibold text-slate-300 uppercase tracking-wider block">
              Model Assumptions & Domain Boundaries:
            </span>
            <ul className="list-disc pl-4 space-y-0.5">
              {comparison.modelAssumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Action Footer */}
      {onStampToCanvas && (
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Compare scenarios directly on board canvas
          </span>
          <button
            onClick={() =>
              onStampToCanvas(
                `What-If: ${activeExp.title}`,
                `Experiment: ${activeExp.title}\nBaseline vs ${activeAlt.name}\n${comparison.changedParameters
                  .map((p) => `${p.name}: ${p.baseline} -> ${p.alternative} ${p.unit}`)
                  .join('\n')}\n\nDeltas:\n${comparison.metricDeltas
                  .map((m) => `${m.name}: ${m.baselineValue} -> ${m.alternativeValue} (${m.percentChangeFormatted})`)
                  .join('\n')}\n\nExplanation:\n${comparison.deterministicExplanation}`
              )
            }
            className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-md shadow-violet-600/30"
          >
            <Zap className="w-3.5 h-3.5 text-violet-200" />
            <span>Stamp Comparison to Canvas</span>
          </button>
        </div>
      )}
    </div>
  );
};
