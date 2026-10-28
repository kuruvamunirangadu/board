'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RotateCcw,
  Code2,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertTriangle,
  Sparkles,
  Zap,
  Clock,
  Database,
  Sliders,
} from 'lucide-react';
import {
  CodeTracingEngine,
  AlgorithmMetadata,
} from '@/features/code-tracing/CodeTracingEngine';
import {
  ExecutionTrace,
  CodeTracingSessionState,
  TraceStep,
  VisualArrayElement,
  CallStackFrame,
  StackElement,
  QueueElement,
} from '@/features/code-tracing/CodeTracingTypes';

interface CodeTracingViewProps {
  initialAlgorithmId?: string;
  onStampToCanvas?: (title: string, content: string) => void;
}

export const CodeTracingView: React.FC<CodeTracingViewProps> = ({
  initialAlgorithmId = 'binary_search',
  onStampToCanvas,
}) => {
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>(initialAlgorithmId);

  // Input states
  const [arrayInputText, setArrayInputText] = useState<string>('2, 5, 8, 12, 16, 23, 38, 56, 72, 91');
  const [targetInput, setTargetInput] = useState<number>(23);
  const [recursionN, setRecursionN] = useState<number>(4);

  // Playback speed
  const [speedMs, setSpeedMs] = useState<number>(1000);

  // Generate trace
  const trace: ExecutionTrace = useMemo(() => {
    if (selectedAlgoId === 'binary_search') {
      const arr = arrayInputText
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return CodeTracingEngine.executeTrace('binary_search', { array: arr, target: targetInput });
    }

    if (selectedAlgoId === 'linear_search') {
      const arr = arrayInputText
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return CodeTracingEngine.executeTrace('linear_search', { array: arr, target: targetInput });
    }

    if (selectedAlgoId === 'bubble_sort') {
      const arr = arrayInputText
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));
      return CodeTracingEngine.executeTrace('bubble_sort', { array: arr });
    }

    if (selectedAlgoId === 'recursion_factorial') {
      return CodeTracingEngine.executeTrace('recursion_factorial', { n: recursionN });
    }

    return CodeTracingEngine.executeTrace(selectedAlgoId);
  }, [selectedAlgoId, arrayInputText, targetInput, recursionN]);

  // Session state
  const [session, setSession] = useState<CodeTracingSessionState>(() =>
    CodeTracingEngine.createInitialSession(selectedAlgoId, {}, trace)
  );

  // Reset session when trace changes
  useEffect(() => {
    setSession(CodeTracingEngine.createInitialSession(selectedAlgoId, {}, trace));
  }, [trace, selectedAlgoId]);

  // Auto-play timer
  const playTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (session.isPlaying) {
      playTimerRef.current = setTimeout(() => {
        setSession((prev) => CodeTracingEngine.stepForward(prev, trace));
      }, speedMs);
    } else if (playTimerRef.current) {
      clearTimeout(playTimerRef.current);
    }

    return () => {
      if (playTimerRef.current) clearTimeout(playTimerRef.current);
    };
  }, [session.isPlaying, session.currentStepIndex, trace, speedMs]);

  // Current active step
  const currentStep: TraceStep | undefined = trace.steps[session.currentStepIndex];

  // Quick preset loader
  const handleSelectAlgo = (algoId: string) => {
    setSelectedAlgoId(algoId);
    if (algoId === 'binary_search') {
      setArrayInputText('2, 5, 8, 12, 16, 23, 38, 56, 72, 91');
      setTargetInput(23);
    } else if (algoId === 'linear_search') {
      setArrayInputText('15, 42, 8, 23, 99, 4');
      setTargetInput(23);
    } else if (algoId === 'bubble_sort') {
      setArrayInputText('29, 10, 14, 37, 13');
    } else if (algoId === 'recursion_factorial') {
      setRecursionN(4);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden select-none">
      {/* Top Header & Algorithm Switcher */}
      <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Code2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-wide text-white">
                {trace.algorithmName}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                {trace.complexity.averageTime}
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Deterministic step-by-step code and memory visualizer
            </p>
          </div>
        </div>

        {/* Algorithm selection tabs */}
        <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
          {CodeTracingEngine.AVAILABLE_ALGORITHMS.map((algo) => (
            <button
              key={algo.id}
              onClick={() => handleSelectAlgo(algo.id)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedAlgoId === algo.id
                  ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {algo.name}
            </button>
          ))}
        </div>
      </div>

      {/* Input Configuration Bar */}
      <div className="px-3 py-2 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center gap-2 text-xs">
        {(selectedAlgoId === 'binary_search' ||
          selectedAlgoId === 'linear_search' ||
          selectedAlgoId === 'bubble_sort') && (
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <span className="text-slate-400 font-mono text-[11px]">arr =</span>
            <input
              type="text"
              value={arrayInputText}
              onChange={(e) => setArrayInputText(e.target.value)}
              placeholder="e.g. 2, 5, 8, 12"
              className="flex-1 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {(selectedAlgoId === 'binary_search' || selectedAlgoId === 'linear_search') && (
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 font-mono text-[11px]">target =</span>
            <input
              type="number"
              value={targetInput}
              onChange={(e) => setTargetInput(parseInt(e.target.value, 10) || 0)}
              className="w-16 px-2 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-300 text-center focus:outline-none focus:border-cyan-500"
            />
          </div>
        )}

        {selectedAlgoId === 'recursion_factorial' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-400 font-mono text-[11px]">n =</span>
            <input
              type="range"
              min={0}
              max={8}
              value={recursionN}
              onChange={(e) => setRecursionN(parseInt(e.target.value, 10))}
              className="w-24 accent-cyan-400 cursor-pointer"
            />
            <span className="font-mono text-cyan-300 font-bold px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">
              {recursionN}
            </span>
          </div>
        )}

        {/* Quick presets */}
        {selectedAlgoId === 'binary_search' && (
          <button
            onClick={() => {
              setArrayInputText('1, 3, 7, 15, 31, 63, 127');
              setTargetInput(31);
            }}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors"
          >
            Powers of 2
          </button>
        )}
        {selectedAlgoId === 'bubble_sort' && (
          <button
            onClick={() => setArrayInputText('1, 2, 3, 4, 5')}
            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] text-emerald-300 transition-colors"
          >
            Pre-Sorted (O(n) test)
          </button>
        )}
      </div>

      {/* Main Split Body */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Left: Code Panel */}
        <div className="w-full md:w-5/12 bg-slate-950/90 border-r border-slate-800/80 flex flex-col overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-900/60 border-b border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-mono font-semibold uppercase tracking-wider text-[10px]">
              {trace.language}.py
            </span>
            <span className="text-[10px] text-cyan-400 font-mono">
              Scope: {currentStep?.activeScope || 'global'}
            </span>
          </div>

          <div className="flex-1 p-2 font-mono text-xs overflow-y-auto space-y-0.5">
            {trace.codeLines.map((line, idx) => {
              const lineNum = idx + 1;
              const isActive = currentStep?.lineNumber === lineNum;
              return (
                <div
                  key={lineNum}
                  className={`flex items-center px-2 py-1 rounded transition-colors ${
                    isActive
                      ? 'bg-cyan-500/20 text-cyan-200 border-l-2 border-cyan-400 font-semibold shadow-sm'
                      : 'text-slate-400 hover:bg-slate-900/40'
                  }`}
                >
                  <span
                    className={`w-6 text-right mr-3 select-none text-[10px] ${
                      isActive ? 'text-cyan-400 font-bold' : 'text-slate-600'
                    }`}
                  >
                    {lineNum}
                  </span>
                  <span className="flex-1 whitespace-pre">{line}</span>
                  {isActive && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-400/20 text-cyan-300 uppercase font-sans font-bold">
                      Active
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Active Variable Watch Inspector */}
          {currentStep && (
            <div className="p-2.5 bg-slate-900/80 border-t border-slate-800">
              <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Variables in Scope</span>
                <span className="text-[9px] text-cyan-400 font-mono">
                  {currentStep.changedVariables.length > 0
                    ? `Changed: ${currentStep.changedVariables.join(', ')}`
                    : 'Unchanged'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 max-h-24 overflow-y-auto">
                {Object.entries(currentStep.variables).map(([k, v]) => {
                  const hasChanged = currentStep.changedVariables.includes(k);
                  return (
                    <div
                      key={k}
                      className={`p-1.5 rounded-lg border text-[11px] font-mono flex items-center justify-between ${
                        hasChanged
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200 shadow-sm'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <span className="text-slate-400">{k}:</span>
                      <span className="font-bold text-white truncate max-w-[120px]">
                        {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right: Visualization & Memory State */}
        <div className="flex-1 flex flex-col bg-slate-900/40 overflow-y-auto p-3 space-y-3">
          {/* Visual Memory / Data Structure Canvas */}
          <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
                <Database className="w-3.5 h-3.5" />
                <span>Memory State & Visual Structure</span>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">
                {currentStep?.dataStructureState.auxiliaryNotes}
              </span>
            </div>

            {/* 1. Array Visualizer */}
            {currentStep?.dataStructureState.type === 'array' &&
              currentStep.dataStructureState.array && (
                <div className="space-y-4 py-2">
                  <div className="flex items-center justify-center gap-1.5 flex-wrap">
                    {currentStep.dataStructureState.array.map((el) => {
                      let bgStyle = 'bg-slate-900 border-slate-800 text-slate-300';
                      if (el.status === 'comparing') {
                        bgStyle =
                          'bg-amber-500/20 border-amber-400 text-amber-200 shadow-md shadow-amber-500/20 scale-105';
                      } else if (el.status === 'matched') {
                        bgStyle =
                          'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-md shadow-emerald-500/20 scale-110';
                      } else if (el.status === 'swapped') {
                        bgStyle =
                          'bg-blue-500/20 border-blue-400 text-blue-200 shadow-md shadow-blue-500/20';
                      } else if (el.status === 'sorted') {
                        bgStyle = 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300';
                      } else if (el.status === 'eliminated') {
                        bgStyle = 'bg-slate-950/40 border-slate-900 text-slate-600 line-through';
                      }

                      return (
                        <div key={el.id} className="flex flex-col items-center">
                          {/* Pointers above */}
                          <div className="h-4 flex items-center justify-center gap-0.5">
                            {el.pointers?.map((p) => (
                              <span
                                key={p}
                                className={`text-[8px] font-bold font-mono px-1 py-0.2 rounded uppercase ${
                                  p === 'mid'
                                    ? 'bg-cyan-500 text-slate-950'
                                    : p === 'low'
                                    ? 'bg-amber-500 text-slate-950'
                                    : p === 'high'
                                    ? 'bg-purple-500 text-white'
                                    : 'bg-indigo-500 text-white'
                                }`}
                              >
                                {p}
                              </span>
                            ))}
                          </div>

                          {/* Element block */}
                          <div
                            className={`w-11 h-11 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-sm transition-all duration-200 ${bgStyle}`}
                          >
                            {el.value}
                          </div>

                          {/* Index label */}
                          <span className="text-[9px] font-mono text-slate-500 mt-0.5">
                            [{el.index}]
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            {/* 2. Stack Visualizer */}
            {currentStep?.dataStructureState.type === 'stack' &&
              currentStep.dataStructureState.stack && (
                <div className="py-2 flex flex-col items-center">
                  <div className="w-56 flex flex-col-reverse gap-1.5 p-2 bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-800">
                    {currentStep.dataStructureState.stack.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-500 font-mono">
                        (Stack is currently empty)
                      </div>
                    ) : (
                      currentStep.dataStructureState.stack.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-2 rounded-lg border font-mono text-xs flex items-center justify-between transition-all ${
                            item.isTop
                              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-md font-bold'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span>{item.value}</span>
                          <span className="text-[10px] text-slate-500">{item.label}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Base of Stack (LIFO Buffer)
                  </span>
                </div>
              )}

            {/* 3. Queue Visualizer */}
            {currentStep?.dataStructureState.type === 'queue' &&
              currentStep.dataStructureState.queue && (
                <div className="py-2 flex flex-col items-center">
                  <div className="w-full flex items-center gap-1.5 p-3 bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-800 overflow-x-auto">
                    {currentStep.dataStructureState.queue.length === 0 ? (
                      <div className="w-full text-center text-xs text-slate-500 font-mono">
                        (Queue is currently empty)
                      </div>
                    ) : (
                      currentStep.dataStructureState.queue.map((item) => (
                        <div
                          key={item.id}
                          className={`min-w-[70px] p-2 rounded-lg border font-mono text-xs flex flex-col items-center justify-center transition-all ${
                            item.isFront
                              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-200 shadow-md'
                              : item.isRear
                              ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200'
                              : 'bg-slate-950 border-slate-800 text-slate-300'
                          }`}
                        >
                          <span className="font-bold">{item.value}</span>
                          <span className="text-[8px] text-slate-500 uppercase">{item.label}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-500 px-2 mt-1">
                    <span>← Front (DeQueue)</span>
                    <span>Rear (EnQueue) →</span>
                  </div>
                </div>
              )}

            {/* 4. Recursion Call Stack Visualizer */}
            {currentStep?.dataStructureState.type === 'call_stack' &&
              currentStep.dataStructureState.callStack && (
                <div className="py-2 flex flex-col items-center">
                  <div className="w-72 flex flex-col-reverse gap-1.5 p-2 bg-slate-900/50 rounded-xl border-2 border-dashed border-slate-800">
                    {currentStep.dataStructureState.callStack.length === 0 ? (
                      <div className="p-3 text-center text-xs text-slate-500 font-mono">
                        (Call stack empty — execution finished)
                      </div>
                    ) : (
                      currentStep.dataStructureState.callStack.map((frame, idx) => {
                        const isTopFrame =
                          idx === currentStep.dataStructureState.callStack!.length - 1;
                        return (
                          <div
                            key={frame.frameId}
                            className={`p-2 rounded-lg border font-mono text-xs space-y-0.5 transition-all ${
                              isTopFrame
                                ? 'bg-indigo-500/20 border-indigo-400 text-indigo-200 shadow-md font-bold'
                                : 'bg-slate-950 border-slate-800 text-slate-400'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-white">
                                {frame.functionName}(n={frame.arguments.n})
                              </span>
                              <span className="text-[9px] text-slate-500">
                                Frame [{idx}]
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[10px] text-slate-400">
                              <span>Line {frame.lineNumber}</span>
                              {frame.returnValue !== undefined && (
                                <span className="text-emerald-400 font-bold">
                                  returns {frame.returnValue}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono mt-1">
                    Call Stack Growth & Unwinding (Frame Depth: {currentStep.dataStructureState.callStack.length})
                  </span>
                </div>
              )}
          </div>

          {/* Step Narrative & Explanation */}
          {currentStep && (
            <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Step {currentStep.stepIndex + 1} Action Narrative</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono uppercase bg-slate-900 border border-slate-800 text-slate-300">
                  {currentStep.eventType}
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentStep.explanation}
              </p>
            </div>
          )}

          {/* Interactive Prediction Exercise Card */}
          {currentStep?.prediction && (
            <div className="p-3.5 rounded-xl border bg-purple-950/20 border-purple-500/30 text-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-purple-400 font-semibold text-xs">
                  <HelpCircle className="w-3.5 h-3.5" />
                  <span>Interactive Prediction Challenge</span>
                </div>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-purple-900/40 text-purple-200 border border-purple-400/30">
                  Active Exercise
                </span>
              </div>

              <p className="text-xs font-medium text-slate-100">
                {currentStep.prediction.question}
              </p>

              <div className="space-y-1.5">
                {currentStep.prediction.options.map((opt, optIdx) => {
                  const isSelected = session.userPredictionChoice === optIdx;
                  const isAnswered = session.predictionAnswered;
                  const isCorrect = optIdx === currentStep.prediction!.correctIndex;

                  let style =
                    'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800';
                  if (isAnswered) {
                    if (isCorrect) {
                      style =
                        'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold';
                    } else if (isSelected && !isCorrect) {
                      style = 'bg-rose-950/60 border-rose-500/60 text-rose-200';
                    } else {
                      style = 'bg-slate-950/40 border-slate-900 text-slate-500 opacity-60';
                    }
                  }

                  return (
                    <button
                      key={optIdx}
                      disabled={isAnswered}
                      onClick={() =>
                        setSession((prev) =>
                          CodeTracingEngine.evaluatePrediction(
                            prev,
                            optIdx,
                            currentStep.prediction!
                          )
                        )
                      }
                      className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${style}`}
                    >
                      <span>{opt}</span>
                      {isAnswered && isCorrect && (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-1.5" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 ml-1.5" />
                      )}
                    </button>
                  );
                })}
              </div>

              {session.predictionFeedback && (
                <div
                  className={`p-2 rounded-lg text-[11px] leading-relaxed border ${
                    session.predictionFeedback.isCorrect
                      ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-200'
                      : 'bg-rose-950/40 border-rose-500/30 text-rose-200'
                  }`}
                >
                  <p className="font-semibold mb-0.5">
                    {session.predictionFeedback.isCorrect
                      ? '🎉 Correct Execution Deduction!'
                      : '💡 Explanation:'}
                  </p>
                  <p>{session.predictionFeedback.explanation}</p>
                </div>
              )}
            </div>
          )}

          {/* Asymptotic Complexity Card */}
          <div className="p-3.5 rounded-xl border bg-slate-950/80 border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                <span>Asymptotic Complexity Analysis</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Auxiliary Space: {trace.complexity.auxiliarySpace}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs">
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block">Best Time</span>
                <span className="text-emerald-400 font-bold">{trace.complexity.bestTime}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block">Average Time</span>
                <span className="text-cyan-400 font-bold">{trace.complexity.averageTime}</span>
              </div>
              <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-[9px] text-slate-400 uppercase block">Worst Time</span>
                <span className="text-amber-400 font-bold">{trace.complexity.worstTime}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {trace.complexity.timeExplanation}
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Playback Control Bar & Scrubber */}
      <div className="p-3 bg-slate-900/90 border-t border-slate-800 flex flex-col gap-2">
        {/* Step Scrubber Slider */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400 shrink-0">
            Step {session.currentStepIndex + 1} / {trace.steps.length}
          </span>
          <input
            type="range"
            min={0}
            max={Math.max(0, trace.steps.length - 1)}
            value={session.currentStepIndex}
            onChange={(e) =>
              setSession((prev) =>
                CodeTracingEngine.jumpToStep(prev, trace, parseInt(e.target.value, 10))
              )
            }
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] font-mono text-cyan-400 font-semibold shrink-0">
            {Math.round(((session.currentStepIndex + 1) / trace.steps.length) * 100)}%
          </span>
        </div>

        {/* Buttons & Speed controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setSession((prev) => CodeTracingEngine.resetSession(prev, trace))}
              className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Reset execution"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              disabled={session.currentStepIndex <= 0}
              onClick={() => setSession((prev) => CodeTracingEngine.stepBackward(prev, trace))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold flex items-center gap-1"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Prev</span>
            </button>
            <button
              onClick={() => setSession((prev) => ({ ...prev, isPlaying: !prev.isPlaying }))}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold text-white flex items-center gap-1.5 shadow-md ${
                session.isPlaying
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                  : 'bg-cyan-600 hover:bg-cyan-500 shadow-cyan-600/30'
              }`}
            >
              {session.isPlaying ? (
                <>
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Auto Play</span>
                </>
              )}
            </button>
            <button
              disabled={session.currentStepIndex >= trace.steps.length - 1}
              onClick={() => setSession((prev) => CodeTracingEngine.stepForward(prev, trace))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 text-xs font-semibold flex items-center gap-1"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-500 font-mono">Speed:</span>
            <div className="flex items-center bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-[10px] font-mono">
              {[
                { label: '0.5x', ms: 1800 },
                { label: '1x', ms: 1000 },
                { label: '2x', ms: 500 },
              ].map((sp) => (
                <button
                  key={sp.label}
                  onClick={() => setSpeedMs(sp.ms)}
                  className={`px-1.5 py-0.5 rounded transition-colors ${
                    speedMs === sp.ms
                      ? 'bg-cyan-600 text-white font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {sp.label}
                </button>
              ))}
            </div>

            {onStampToCanvas && (
              <button
                onClick={() =>
                  onStampToCanvas(
                    `${trace.algorithmName} Execution Snapshot`,
                    `Algorithm: ${trace.algorithmName}\nCode:\n${trace.codeLines.join('\n')}\nStep: ${
                      session.currentStepIndex + 1
                    } of ${trace.steps.length}\n${currentStep?.explanation || ''}`
                  )
                }
                className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 transition-colors"
              >
                <Zap className="w-3 h-3 text-cyan-400" />
                <span>Stamp to Canvas</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

