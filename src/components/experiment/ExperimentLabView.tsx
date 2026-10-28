'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FlaskConical,
  Play,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Layers,
  HelpCircle,
  Award,
  Sliders,
  ChevronRight,
  GitCompare,
  Wand2,
  Check,
} from 'lucide-react';
import {
  ExperimentDefinition,
  ExperimentRun,
  StudentPrediction,
  WhatIfComparison,
  ExperimentSessionState,
} from '@/features/experiment/ExperimentTypes';
import { EXPERIMENT_CATALOGUE, ExperimentCatalogueService } from '@/features/experiment/ExperimentCatalogue';
import { ExperimentEngine } from '@/features/experiment/ExperimentEngine';
import { ExperimentExplanationService } from '@/features/experiment/ExperimentExplanationService';
import { UniversalSimulationView } from '@/components/simulation/UniversalSimulationView';
import { Editor, createShapeId } from 'tldraw';
import { toRichText } from '@/lib/tldraw-utils';

interface ExperimentLabViewProps {
  initialExperimentId?: string;
  initialState?: ExperimentSessionState | null;
  onStateChange?: (state: ExperimentSessionState) => void;
  editor?: Editor | null;
  onClose?: () => void;
}

export const ExperimentLabView: React.FC<ExperimentLabViewProps> = ({
  initialExperimentId = 'exp_projectile_motion',
  initialState,
  onStateChange,
  editor,
  onClose,
}) => {
  const [activeExp, setActiveExp] = useState<ExperimentDefinition>(() => {
    if (initialState?.experimentId) {
      const exp = ExperimentCatalogueService.getById(initialState.experimentId);
      if (exp) return exp;
    }
    return ExperimentCatalogueService.getById(initialExperimentId) || EXPERIMENT_CATALOGUE[0];
  });

  // Current parameters
  const [params, setParams] = useState<Record<string, number>>(() => {
    if (initialState?.currentParameters) {
      return { ...initialState.currentParameters };
    }
    const init: Record<string, number> = {};
    for (const v of activeExp.independentVariables) {
      init[v.symbol] = v.defaultValue;
    }
    return init;
  });

  // Student prediction state
  const [predictionInput, setPredictionInput] = useState<string>('');
  const [reasoningInput, setReasoningInput] = useState<string>('');
  const [activePrediction, setActivePrediction] = useState<StudentPrediction | null>(() => initialState?.activePrediction || null);

  // Run history and comparison
  const [runs, setRuns] = useState<ExperimentRun[]>(() => initialState?.runs || []);
  const [baselineRunId, setBaselineRunId] = useState<string | null>(null);
  const [comparisonRunId, setComparisonRunId] = useState<string | null>(null);
  const [whatIfComparison, setWhatIfComparison] = useState<WhatIfComparison | null>(() => initialState?.activeComparison || null);
  const [isExplaining, setIsExplaining] = useState(false);

  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        experimentId: activeExp.id,
        currentParameters: params,
        activePrediction,
        runs,
        activeComparison: whatIfComparison,
        isCompleted: runs.length > 0 && !!activePrediction,
      });
    }
  }, [activeExp.id, params, activePrediction, runs, whatIfComparison, onStateChange]);

  // Reflection question state
  const [reflectionAnswer, setReflectionAnswer] = useState<{
    questionId: string;
    selectedOption: number;
    isCorrect: boolean;
  } | null>(null);

  // Canvas stamping state
  const [stampedSuccess, setStampedSuccess] = useState(false);
  const stampedShapeIdsRef = useRef<string[]>([]);

  // Key predictable output definition
  const keyOutput =
    activeExp.dependentVariables.find((d) => d.isKeyPredictableOutput) ||
    activeExp.dependentVariables[0];

  // Load / switch experiment
  const handleSelectExperiment = (exp: ExperimentDefinition) => {
    setActiveExp(exp);
    const newParams: Record<string, number> = {};
    for (const v of exp.independentVariables) {
      newParams[v.symbol] = v.defaultValue;
    }
    setParams(newParams);
    setPredictionInput('');
    setReasoningInput('');
    setActivePrediction(null);
    setRuns([]);
    setBaselineRunId(null);
    setComparisonRunId(null);
    setWhatIfComparison(null);
    setReflectionAnswer(null);
  };

  // Record a formal prediction
  const handleRecordPrediction = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(predictionInput);
    if (isNaN(val)) return;

    const pred: StudentPrediction = {
      outputSymbol: keyOutput.symbol,
      predictedValue: val,
      reasoning: reasoningInput.trim(),
      recordedAt: Date.now(),
    };
    setActivePrediction(pred);
  };

  // Run experiment and evaluate outcomes
  const handleRunExperiment = () => {
    const { results, formattedResults } = ExperimentEngine.calculate(activeExp.id, params);

    // Evaluate prediction if present
    let predEval;
    if (activePrediction) {
      predEval = ExperimentEngine.evaluatePrediction(
        activePrediction,
        results,
        keyOutput.unit
      );
    }

    const newRun: ExperimentRun = {
      runId: `run_${Date.now()}`,
      runNumber: runs.length + 1,
      parameters: { ...params },
      results,
      formattedResults,
      predictionEvaluation: predEval,
      timestamp: Date.now(),
    };

    const nextRuns = [...runs, newRun];
    setRuns(nextRuns);

    // Auto-update comparison if we have 2 or more runs
    if (nextRuns.length >= 2) {
      const baseline = nextRuns[0];
      const latest = newRun;
      setBaselineRunId(baseline.runId);
      setComparisonRunId(latest.runId);
      triggerComparison(baseline, latest);
    }
  };

  // Trigger What-If Comparison
  const triggerComparison = async (baseline: ExperimentRun, comparison: ExperimentRun) => {
    const comp = ExperimentEngine.compareRuns(baseline, comparison, activeExp);
    setWhatIfComparison(comp);
    setIsExplaining(true);

    try {
      const aiResult = await ExperimentExplanationService.explainComparison(
        activeExp,
        comp,
        activePrediction
      );
      setWhatIfComparison((prev) => (prev ? { ...prev, explanation: aiResult.explanation } : null));
    } catch {
      // Deterministic rule explanation is already present in comp
    } finally {
      setIsExplaining(false);
    }
  };

  // Apply a preset scenario
  const handleApplyPreset = (presetParams: Record<string, number>) => {
    setParams((prev) => ({ ...prev, ...presetParams }));
  };

  // Reset to initial baseline conditions
  const handleReset = () => {
    const init: Record<string, number> = {};
    for (const v of activeExp.independentVariables) {
      init[v.symbol] = v.defaultValue;
    }
    setParams(init);
    setPredictionInput('');
    setReasoningInput('');
    setActivePrediction(null);
    setWhatIfComparison(null);
  };

  // Handle reflection question
  const handleAnswerReflection = (optionIdx: number) => {
    const q = activeExp.reflectionQuestions[0];
    if (!q) return;
    setReflectionAnswer({
      questionId: q.id,
      selectedOption: optionIdx,
      isCorrect: optionIdx === q.correctOptionIndex,
    });
  };

  // Stamp Experiment Findings onto whiteboard canvas
  const handleStampToCanvas = () => {
    if (!editor) return;
    try {
      // Clear previously stamped cards
      if (stampedShapeIdsRef.current.length > 0) {
        const currentShapes = editor.getCurrentPageShapes().map((s) => s.id);
        const toDelete = stampedShapeIdsRef.current.filter((id) =>
          currentShapes.includes(id as any)
        );
        if (toDelete.length > 0) {
          editor.deleteShapes(toDelete as any);
        }
        stampedShapeIdsRef.current = [];
      }

      const bounds = editor.getViewportPageBounds();
      const startX = bounds ? bounds.center.x - 300 : 200;
      const startY = bounds ? bounds.center.y - 120 : 200;

      const latestRun = runs[runs.length - 1];

      // Card 1: Investigation & Hypothesis
      const id1 = createShapeId();
      editor.createShape({
        id: id1,
        type: 'note',
        x: startX,
        y: startY,
        props: {
          color: 'violet',
          size: 'm',
          richText: toRichText(
            `🧪 ${activeExp.title}\n\nQuestion:\n${activeExp.investigationQuestion}\n\n${
              activePrediction
                ? `Student Hypothesis:\nPredicted ${keyOutput.name} = ${activePrediction.predictedValue} ${keyOutput.unit}\nReasoning: "${activePrediction.reasoning}"`
                : 'Observation without prior hypothesis.'
            }`
          ),
        },
      });

      // Card 2: Deterministic Numerical Results
      const id2 = createShapeId();
      const resultsText = latestRun
        ? Object.entries(latestRun.formattedResults)
            .map(([k, v]) => `• ${k}: ${v}`)
            .join('\n')
        : 'Run not completed yet.';

      editor.createShape({
        id: id2,
        type: 'note',
        x: startX + 270,
        y: startY,
        props: {
          color: 'blue',
          size: 'm',
          richText: toRichText(
            `📊 Run ${latestRun ? latestRun.runNumber : 1} Outcomes:\n\n${resultsText}\n\nParameters:\n${Object.entries(
              params
            )
              .map(([k, v]) => `• ${k} = ${v}`)
              .join('\n')}`
          ),
        },
      });

      // Card 3: What-If Comparison & Scientific Conclusion
      const id3 = createShapeId();
      const explanationText = whatIfComparison
        ? `What-If Analysis:\n${whatIfComparison.scientificValidityNote}\n\nInsight:\n${whatIfComparison.explanation}`
        : `Physical Assumptions:\n${activeExp.assumptions.slice(0, 2).map((a) => `• ${a}`).join('\n')}`;

      editor.createShape({
        id: id3,
        type: 'note',
        x: startX + 540,
        y: startY,
        props: {
          color: 'light-green',
          size: 'm',
          richText: toRichText(
            `💡 Scientific Findings:\n\n${explanationText}`
          ),
        },
      });

      stampedShapeIdsRef.current = [id1, id2, id3];
      editor.setSelectedShapes([]);
      setStampedSuccess(true);
      setTimeout(() => setStampedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to stamp experiment lab suite', e);
    }
  };

  const latestRun = runs[runs.length - 1];

  return (
    <div
      className="flex flex-col h-full space-y-3.5 text-slate-100 overflow-y-auto pr-1"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 1. Header & Experiment Selector */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FlaskConical className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              VisiOS Experiment Lab
            </span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
            Evidence-Based Learning
          </span>
        </div>

        {/* Experiment Switcher Tabs */}
        <div className="grid grid-cols-3 gap-1 p-1 rounded-lg bg-slate-950 border border-slate-800 text-[10px]">
          {EXPERIMENT_CATALOGUE.map((exp) => {
            const isSelected = exp.id === activeExp.id;
            return (
              <button
                key={exp.id}
                onClick={() => handleSelectExperiment(exp)}
                className={`py-1.5 px-2 rounded-md font-medium text-center truncate transition-all ${
                  isSelected
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {exp.simulationType === 'projectile'
                  ? 'Projectile'
                  : exp.simulationType === 'pendulum'
                  ? 'Pendulum'
                  : 'F = ma'}
              </button>
            );
          })}
        </div>

        {/* Investigation Question Banner */}
        <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 space-y-1">
          <div className="flex items-center space-x-1.5 text-indigo-300 font-semibold text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Investigation Question:</span>
          </div>
          <p className="text-xs text-slate-200 font-medium leading-relaxed">
            {activeExp.investigationQuestion}
          </p>
        </div>
      </div>

      {/* 2. Step A: Student Hypothesis & Prediction Capture */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Step 1: Record Your Hypothesis & Prediction</span>
          </div>
          {activePrediction && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 flex items-center gap-1 font-mono">
              <Check className="w-3 h-3" /> Recorded
            </span>
          )}
        </div>

        {activePrediction ? (
          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400">Predicted {keyOutput.name}:</span>
              <span className="font-mono font-bold text-amber-300">
                {activePrediction.predictedValue} {keyOutput.unit}
              </span>
            </div>
            {activePrediction.reasoning && (
              <p className="text-[11px] text-slate-400 italic">
                Reasoning: "{activePrediction.reasoning}"
              </p>
            )}
            <button
              onClick={() => setActivePrediction(null)}
              className="text-[10px] text-cyan-400 hover:underline pt-1"
            >
              Modify Prediction
            </button>
          </div>
        ) : (
          <form onSubmit={handleRecordPrediction} className="space-y-2">
            <p className="text-[11px] text-slate-300">
              Before running the simulation, predict the{' '}
              <strong className="text-cyan-300">{keyOutput.name}</strong> under current initial
              parameters:
            </p>
            <div className="flex gap-2">
              <input
                type="number"
                step="any"
                required
                placeholder={`Predicted value in ${keyOutput.unit}`}
                value={predictionInput}
                onChange={(e) => setPredictionInput(e.target.value)}
                className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold text-xs shadow-sm transition-all"
              >
                Save Prediction
              </button>
            </div>
            <input
              type="text"
              placeholder="Why do you predict this? (e.g. Higher angle gives more height)"
              value={reasoningInput}
              onChange={(e) => setReasoningInput(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </form>
        )}
      </div>

      {/* 3. Step B: Configure Independent Variables & Presets */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
            <Sliders className="w-3.5 h-3.5" />
            <span>Step 2: Configure Independent Variables</span>
          </div>
          <button
            onClick={handleReset}
            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>

        {/* Preset Quick Options */}
        <div className="space-y-1">
          <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
            Quick Test Presets:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            {activeExp.presets.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(preset.params)}
                className="p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 hover:border-cyan-500/50 text-left text-[10px] text-slate-300 transition-colors"
              >
                <div className="font-bold text-cyan-300">{preset.name}</div>
                <div className="text-[9px] text-slate-400 truncate">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="space-y-2.5 pt-1">
          {activeExp.independentVariables.map((v) => {
            const currentVal = params[v.symbol] ?? v.defaultValue;
            return (
              <div key={v.symbol} className="space-y-1">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-200">
                    {v.name} ({v.symbol})
                  </span>
                  <span className="font-mono font-bold text-cyan-400">
                    {currentVal} {v.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={v.min}
                  max={v.max}
                  step={v.step}
                  value={currentVal}
                  onChange={(e) =>
                    setParams((prev) => ({ ...prev, [v.symbol]: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                />
              </div>
            );
          })}
        </div>

        {/* Run Experiment Action Button */}
        <button
          onClick={handleRunExperiment}
          className="w-full py-2 px-3 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center space-x-2 shadow-lg shadow-cyan-950/40 transition-all active:scale-95"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Execute Experiment Run ({runs.length + 1})</span>
        </button>
      </div>

      {/* 4. Live Simulation Viewport */}
      <div className="p-2 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center w-full h-[360px]">
        <UniversalSimulationView
          initialSimulationType={activeExp.simulationType}
          initialParams={params}
          isImmersive={false}
        />
      </div>

      {/* 5. Step C: Measured Results & Prediction Accuracy */}
      {latestRun && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold text-xs">
              <Award className="w-3.5 h-3.5" />
              <span>Step 3: Run {latestRun.runNumber} Deterministic Results</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">
              Measured Truth
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {Object.entries(latestRun.formattedResults).map(([key, formatted]) => (
              <div
                key={key}
                className="p-2 rounded-lg bg-slate-950 border border-slate-800/80 flex flex-col text-center"
              >
                <span className="text-[9px] uppercase tracking-wider text-slate-400">{key}</span>
                <span className="font-mono font-bold text-xs text-emerald-300">{formatted}</span>
              </div>
            ))}
          </div>

          {/* Prediction Evaluation Feedback */}
          {latestRun.predictionEvaluation && (
            <div
              className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                latestRun.predictionEvaluation.accuracyTier === 'accurate'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                  : latestRun.predictionEvaluation.accuracyTier === 'close'
                  ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-200'
                  : 'bg-amber-950/40 border-amber-500/40 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between font-bold">
                <span>Hypothesis Evaluation</span>
                <span className="font-mono text-[10px]">
                  Δ = {latestRun.predictionEvaluation.absoluteDelta}{' '}
                  {latestRun.predictionEvaluation.unit} (
                  {latestRun.predictionEvaluation.percentageError}% error)
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                {latestRun.predictionEvaluation.feedbackSummary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 6. Step D: What-If Comparison Engine & Causal Explanation */}
      {whatIfComparison && (
        <div className="p-3.5 rounded-xl bg-slate-900/80 border border-indigo-500/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-xs">
              <GitCompare className="w-3.5 h-3.5" />
              <span>Step 4: What-If Comparison (Run {whatIfComparison.baselineRun.runNumber} vs Run {whatIfComparison.comparisonRun.runNumber})</span>
            </div>
            {whatIfComparison.isSingleVariableControlled ? (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                Controlled Variable ✓
              </span>
            ) : (
              <span className="text-[9px] px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-mono">
                Multi-Variable Confounding
              </span>
            )}
          </div>

          {/* Parameter Deltas Table */}
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Independent Variables Changed:
            </div>
            {whatIfComparison.changedParameters.map((p) => (
              <div key={p.symbol} className="flex justify-between items-center text-xs">
                <span className="text-slate-300">{p.name}:</span>
                <div className="font-mono text-[11px] flex items-center gap-1.5">
                  <span className="text-slate-400">
                    {p.baseline} {p.unit}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-cyan-300 font-bold">
                    {p.comparison} {p.unit}
                  </span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      p.delta > 0
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {p.delta > 0 ? `+${p.delta}` : p.delta} {p.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Result Deltas Table */}
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5">
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Observed Outcomes Delta:
            </div>
            {whatIfComparison.resultDeltas.map((r) => (
              <div key={r.symbol} className="flex justify-between items-center text-xs">
                <span className="text-slate-300">{r.name}:</span>
                <div className="font-mono text-[11px] flex items-center gap-1.5">
                  <span className="text-slate-400">
                    {r.baseline} {r.unit}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-500" />
                  <span className="text-emerald-300 font-bold">
                    {r.comparison} {r.unit}
                  </span>
                  <span
                    className={`text-[10px] px-1 rounded ${
                      r.delta > 0
                        ? 'bg-emerald-950 text-emerald-400'
                        : 'bg-rose-950 text-rose-400'
                    }`}
                  >
                    {r.delta > 0 ? `+${r.delta}` : r.delta} {r.unit}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Scientific Causal Explanation */}
          <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-500/20 space-y-1.5">
            <div className="flex items-center space-x-1 text-cyan-300 font-semibold text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Evidence-Based Explanation</span>
            </div>
            <p className="text-xs text-slate-200 leading-relaxed font-sans">
              {whatIfComparison.explanation}
            </p>
            <p className="text-[10px] text-slate-400 italic">
              {whatIfComparison.scientificValidityNote}
            </p>
          </div>
        </div>
      )}

      {/* 7. Step E: Reflection Check */}
      {activeExp.reflectionQuestions.length > 0 && (
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2.5">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Step 5: Conceptual Reflection Check</span>
          </div>
          <p className="text-xs text-slate-200 leading-relaxed font-medium">
            {activeExp.reflectionQuestions[0].question}
          </p>

          <div className="space-y-1.5 pt-1">
            {activeExp.reflectionQuestions[0].options.map((opt, i) => {
              const isSelected = reflectionAnswer?.selectedOption === i;
              const isCorrectOpt = i === activeExp.reflectionQuestions[0].correctOptionIndex;

              let btnStyle = 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-900';
              if (reflectionAnswer) {
                if (isCorrectOpt) {
                  btnStyle = 'bg-emerald-950/60 border-emerald-500 text-emerald-200 font-semibold';
                } else if (isSelected) {
                  btnStyle = 'bg-rose-950/60 border-rose-500 text-rose-200';
                }
              }

              return (
                <button
                  key={i}
                  disabled={Boolean(reflectionAnswer)}
                  onClick={() => handleAnswerReflection(i)}
                  className={`w-full p-2 rounded-lg border text-xs text-left transition-all ${btnStyle}`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          {reflectionAnswer && (
            <div
              className={`p-2.5 rounded-lg border text-xs space-y-1 ${
                reflectionAnswer.isCorrect
                  ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
                  : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              }`}
            >
              <div className="font-bold">
                {reflectionAnswer.isCorrect ? '✓ Correct Understanding!' : '✗ Not Quite'}
              </div>
              <p className="text-[11px] text-slate-300">
                {activeExp.reflectionQuestions[0].explanation}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 8. Whiteboard Stamping Action */}
      <button
        onClick={handleStampToCanvas}
        className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${
          stampedSuccess
            ? 'bg-emerald-600 text-white shadow-emerald-950/40'
            : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
        }`}
      >
        {stampedSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Stamped Experiment Lab Suite on Canvas!</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4 text-cyan-400" />
            <span>Stamp Experiment Findings onto Whiteboard</span>
          </>
        )}
      </button>
    </div>
  );
};

