'use client';

import React, { useState, useEffect } from 'react';
import {
  ExperimentProtocol,
  ResearchSessionRecord,
  AdaptationRecommendation,
  DiagnosticQuestion,
} from '@/types/research';
import { ResearchConsentModal } from './ResearchConsentModal';
import { AdaptiveRationaleViewer } from './AdaptiveRationaleViewer';
import { MisconceptionDiagnosticCard } from './MisconceptionDiagnosticCard';

interface Props {
  protocols: ExperimentProtocol[];
  onSessionComplete?: () => void;
}

export const ResearchExperimentRunner: React.FC<Props> = ({ protocols, onSessionComplete }) => {
  const [selectedProtocol, setSelectedProtocol] = useState<ExperimentProtocol>(protocols[0] || null);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [session, setSession] = useState<ResearchSessionRecord | null>(null);
  
  // Pre-test & Post-test local states
  const [preResponses, setPreResponses] = useState<Record<string, number>>({});
  const [postResponses, setPostResponses] = useState<Record<string, number>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Intervention state
  const [recommendation, setRecommendation] = useState<AdaptationRecommendation | null>(null);
  const [simAngle, setSimAngle] = useState(60);
  const [simDamping, setSimDamping] = useState(0.05);
  const [simLength, setSimLength] = useState(2.0);

  // Post-test feedback
  const [clarityRating, setClarityRating] = useState(5);
  const [qualitativeFeedback, setQualitativeFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Start new research session via API or local service
  const handleConsent = async (participantCode: string, forcedCondition?: any) => {
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_session',
          participantCode,
          experimentId: selectedProtocol.experimentId,
          condition: forcedCondition,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setConsentModalOpen(false);
        setPreResponses({});
        setPostResponses({});
        setCurrentStepIndex(0);
      }
    } catch (err) {
      console.error('Failed to start session', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Pre-test
  const handleSubmitPreTest = async () => {
    if (!session) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_pre_test',
          sessionId: session.sessionId,
          responses: preResponses,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        // Request adaptation
        await fetchRecommendation(data.session.sessionId);
      }
    } catch (err) {
      console.error('Failed to submit pre-test', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchRecommendation = async (sessionId: string) => {
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'get_recommendation',
          sessionId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRecommendation(data.recommendation);
      }
    } catch (err) {
      console.error('Failed to get recommendation', err);
    }
  };

  // Complete Learning Intervention Step
  const handleCompleteLearningStep = async () => {
    if (!session) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete_step',
          sessionId: session.sessionId,
          interventionId: recommendation?.recommendationId || 'rec-default',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        setCurrentStepIndex(0);
      }
    } catch (err) {
      console.error('Failed to complete step', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Post-test & Evaluation
  const handleSubmitPostTest = async () => {
    if (!session) return;
    try {
      setIsSubmitting(true);
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_post_test',
          sessionId: session.sessionId,
          responses: postResponses,
          feedback: {
            clarityRating,
            qualitativeFeedback,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSession(data.session);
        if (onSessionComplete) onSessionComplete();
      }
    } catch (err) {
      console.error('Failed to submit post-test', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Protocol Selector & Session Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Research Protocol
          </span>
          <h2 className="text-lg font-bold text-white">{selectedProtocol.title}</h2>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl">{selectedProtocol.researchQuestion}</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedProtocol.experimentId}
            onChange={(e) => {
              const p = protocols.find((x) => x.experimentId === e.target.value);
              if (p) {
                setSelectedProtocol(p);
                setSession(null);
              }
            }}
            disabled={session !== null && session.status !== 'completed'}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {protocols.map((p) => (
              <option key={p.experimentId} value={p.experimentId}>
                {p.subjectId.toUpperCase()}: {p.title.split(':')[0]}
              </option>
            ))}
          </select>

          {!session ? (
            <button
              onClick={() => setConsentModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
            >
              Start Participant Session
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="rounded bg-slate-800 px-3 py-1 font-mono text-xs text-indigo-300 border border-slate-700">
                {session.participantCode} ({session.condition === 'adaptive_intervention' ? 'Condition A: Adaptive' : 'Condition B: Fixed Control'})
              </span>
              <button
                onClick={() => setSession(null)}
                className="rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      {/* STAGE 0: NOT STARTED / OVERVIEW */}
      {!session && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 text-2xl text-indigo-400 border border-indigo-500/30 mb-4">
            🔬
          </div>
          <h3 className="text-base font-semibold text-white">Ready to Launch Research Experiment</h3>
          <p className="mt-2 text-xs text-slate-400 max-w-lg mx-auto leading-relaxed">
            This module evaluates whether evidence-driven adaptive explanations outperform fixed learning sequences.
            Click below to give informed research consent and begin your diagnostic session.
          </p>
          <div className="mt-6 flex justify-center">
            <button
              onClick={() => setConsentModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all"
            >
              Consent & Begin Trial →
            </button>
          </div>
        </div>
      )}

      {/* STAGE 1: PRE-TEST DIAGNOSTIC */}
      {session && session.status === 'pre_test' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="rounded bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-700/40">
                Phase 1: Baseline Diagnostic Pre-Test
              </span>
              <h3 className="mt-2 text-base font-bold text-white">Initial Concept Assessment</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Answer these diagnostic questions to establish baseline knowledge. Misconception patterns will be recorded.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {Object.keys(preResponses).length} / {selectedProtocol.preTestQuestions.length} Answered
            </span>
          </div>

          <div className="space-y-6">
            {selectedProtocol.preTestQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-lg border border-slate-800 bg-slate-800/40 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 font-mono text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{q.question}</p>
                    <span className="mt-1 inline-block text-[11px] text-slate-400">
                      Objective: {q.learningObjective}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-xs cursor-pointer transition-colors ${
                        preResponses[q.id] === optIdx
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`pre-${q.id}`}
                        checked={preResponses[q.id] === optIdx}
                        onChange={() => setPreResponses({ ...preResponses, [q.id]: optIdx })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSubmitPreTest}
              disabled={
                Object.keys(preResponses).length < selectedProtocol.preTestQuestions.length ||
                isSubmitting
              }
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Evaluating Diagnostic...' : 'Submit Pre-Test & Continue →'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: LEARNING INTERVENTION PHASE */}
      {session && session.status === 'learning_phase' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="rounded bg-indigo-900/50 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-700/40">
                Phase 2: {session.condition === 'adaptive_intervention' ? 'Adaptive Learning Intervention' : 'Fixed Sequence Learning'}
              </span>
              <h3 className="mt-2 text-base font-bold text-white">
                {recommendation?.resourceTitle || 'Conceptual Exploration'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pre-test Baseline Score: <strong className="text-white">{session.preTestScore}%</strong>
              </p>
            </div>
            <span className="rounded bg-slate-800 px-3 py-1 text-xs text-indigo-300 font-mono border border-slate-700">
              Condition: {session.condition}
            </span>
          </div>

          {/* Rationale Viewer (Adaptive Condition) */}
          {session.condition === 'adaptive_intervention' && recommendation && (
            <AdaptiveRationaleViewer recommendation={recommendation} />
          )}

          {/* Active Detected Misconceptions */}
          {session.evidenceLog.some((e) => !e.isCorrect && e.detectedMisconceptionId) && (
            <div className="space-y-3">
              {Array.from(
                new Set(
                  session.evidenceLog
                    .filter((e) => !e.isCorrect && e.detectedMisconceptionId)
                    .map((e) => e.detectedMisconceptionId!)
                )
              ).map((mId) => (
                <MisconceptionDiagnosticCard key={mId} misconceptionId={mId} />
              ))}
            </div>
          )}

          {/* Interactive Visual Learning Simulation / Diagram Panel */}
          <div className="rounded-xl border border-slate-800 bg-slate-950 p-6 space-y-4">
            <h4 className="text-sm font-semibold text-slate-200">
              {recommendation?.resourcePayload.title || 'Interactive Exploration Tool'}
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              {recommendation?.resourcePayload.content || 'Explore the interactive parameters below.'}
            </p>

            {/* Interactive Physics / Simulation Sandbox */}
            {selectedProtocol.subjectId === 'physics' && (
              <div className="rounded-lg bg-slate-900 p-4 border border-slate-800 space-y-4">
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Initial Angle θ₀: <strong className="text-indigo-400">{simAngle}°</strong>
                    </label>
                    <input
                      type="range"
                      min="5"
                      max="90"
                      value={simAngle}
                      onChange={(e) => setSimAngle(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-[10px] text-slate-500">
                      {simAngle > 30 ? '⚠️ Nonlinear Regime (sin θ < θ)' : '✓ Linear Regime (sin θ ≈ θ)'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Damping Coeff γ: <strong className="text-indigo-400">{simDamping}</strong>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="0.5"
                      step="0.01"
                      value={simDamping}
                      onChange={(e) => setSimDamping(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-[10px] text-slate-500">
                      {simDamping > 0 ? 'Dissipative Spiral Attractor' : 'Conservative Closed Orbit'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">
                      Length L: <strong className="text-indigo-400">{simLength} m</strong>
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={simLength}
                      onChange={(e) => setSimLength(Number(e.target.value))}
                      className="w-full"
                    />
                    <span className="text-[10px] text-slate-500">
                      T₀ = {(2 * Math.PI * Math.sqrt(simLength / 9.81)).toFixed(2)}s
                    </span>
                  </div>
                </div>

                {/* Analytical Model Output */}
                <div className="p-3 bg-slate-950 rounded border border-slate-800 text-xs font-mono grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-400">Small-Angle Linear T₀:</span>{' '}
                    <strong className="text-slate-200">
                      {(2 * Math.PI * Math.sqrt(simLength / 9.81)).toFixed(3)} s
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400">Nonlinear Perturbation T:</span>{' '}
                    <strong className="text-indigo-300">
                      {(
                        2 *
                        Math.PI *
                        Math.sqrt(simLength / 9.81) *
                        (1 + Math.pow((simAngle * Math.PI) / 180, 2) / 16)
                      ).toFixed(3)}{' '}
                      s (+{((Math.pow((simAngle * Math.PI) / 180, 2) / 16) * 100).toFixed(1)}%)
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* CS / Electronics General Diagram Mock */}
            {selectedProtocol.subjectId !== 'physics' && (
              <div className="p-4 bg-slate-900 rounded border border-slate-800 text-xs font-mono text-slate-300">
                <pre className="text-indigo-300">
                  {selectedProtocol.subjectId === 'computer_science'
                    ? `[Root: 50]
   ├── Left: [20]  (Invariants: all < 50)
   │     └── [10], [30]
   └── Right: [80] (Invariants: all > 50)
         └── [60], [90]`
                    : `RLC Series Circuit:
   Source V(t) ─── [ R = 50Ω ] ─── [ L = 10mH ] ─── [ C = 100nF ] ─── GND
   Resonance: ω₀ = 1/√(LC) = 31,622 rad/s (5.03 kHz)
   Quality Factor Q = (1/R)√(L/C) = 6.32`}
                </pre>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleCompleteLearningStep}
              disabled={isSubmitting}
              className="rounded-lg bg-emerald-600 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-emerald-500 transition-colors"
            >
              {isSubmitting ? 'Recording Progress...' : 'Proceed to Post-Test Verification →'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 3: POST-TEST EVALUATION */}
      {session && session.status === 'post_test' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <span className="rounded bg-purple-900/50 px-2 py-0.5 text-xs font-semibold text-purple-300 border border-purple-700/40">
                Phase 3: Isomorphic Post-Test Verification
              </span>
              <h3 className="mt-2 text-base font-bold text-white">Conceptual Gain Measurement</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Answer these post-intervention verification questions to measure conceptual improvement.
              </p>
            </div>
            <span className="font-mono text-xs text-slate-400">
              {Object.keys(postResponses).length} / {selectedProtocol.postTestQuestions.length} Answered
            </span>
          </div>

          <div className="space-y-6">
            {selectedProtocol.postTestQuestions.map((q, idx) => (
              <div
                key={q.id}
                className="rounded-lg border border-slate-800 bg-slate-800/40 p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-700 font-mono text-xs font-bold text-white">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-100">{q.question}</p>
                    <span className="mt-1 inline-block text-[11px] text-slate-400">
                      Objective: {q.learningObjective}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  {q.options.map((opt, optIdx) => (
                    <label
                      key={optIdx}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-xs cursor-pointer transition-colors ${
                        postResponses[q.id] === optIdx
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`post-${q.id}`}
                        checked={postResponses[q.id] === optIdx}
                        onChange={() => setPostResponses({ ...postResponses, [q.id]: optIdx })}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{opt}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Qualitative Usability Feedback */}
          <div className="rounded-lg border border-slate-800 bg-slate-800/30 p-4 space-y-3">
            <h4 className="text-xs font-semibold text-slate-200">Study Usability & Clarity Rating</h4>
            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Clarity of Explanation:</span>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setClarityRating(star)}
                    className={`h-7 w-7 rounded text-xs font-bold ${
                      clarityRating >= star
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">
                Qualitative Feedback (Confusion points or helpful visual cues):
              </label>
              <textarea
                value={qualitativeFeedback}
                onChange={(e) => setQualitativeFeedback(e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-700 bg-slate-850 p-2.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="Optional notes on the visual intervention..."
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              onClick={handleSubmitPostTest}
              disabled={
                Object.keys(postResponses).length < selectedProtocol.postTestQuestions.length ||
                isSubmitting
              }
              className="rounded-lg bg-indigo-600 px-6 py-2.5 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? 'Computing Learning Gain...' : 'Complete Research Trial →'}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: TRIAL COMPLETED & OUTCOME DEBRIEF */}
      {session && session.status === 'completed' && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-emerald-500/20 pb-4">
            <div>
              <span className="rounded bg-emerald-900/60 px-2 py-0.5 text-xs font-semibold text-emerald-300 border border-emerald-700/40">
                Trial Completed Successfully
              </span>
              <h3 className="mt-2 text-base font-bold text-white">
                Empirical Learning Outcome Summary
              </h3>
            </div>
            <span className="font-mono text-xs text-emerald-300">
              Session ID: {session.sessionId}
            </span>
          </div>

          {/* Quantitative Gain Summary */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Pre-Test Score</span>
              <div className="mt-1 text-2xl font-bold text-amber-400">{session.preTestScore}%</div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Post-Test Score</span>
              <div className="mt-1 text-2xl font-bold text-emerald-400">{session.postTestScore}%</div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Absolute Score Gain (Δ)</span>
              <div className="mt-1 text-2xl font-bold text-indigo-400">
                +{(session.postTestScore ?? 0) - (session.preTestScore ?? 0)}%
              </div>
            </div>

            <div className="p-4 bg-slate-900/80 rounded-xl border border-slate-800">
              <span className="text-xs text-slate-400">Normalized Gain (g)</span>
              <div className="mt-1 text-2xl font-bold text-purple-400">
                {session.preTestScore! < 100
                  ? (
                      ((session.postTestScore ?? 0) - (session.preTestScore ?? 0)) /
                      (100 - (session.preTestScore ?? 0))
                    ).toFixed(2)
                  : 'N/A'}
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
            <p>
              <strong>Study Condition:</strong>{' '}
              {session.condition === 'adaptive_intervention'
                ? 'Condition A (Adaptive Intervention with Diagnostic Remediation)'
                : 'Condition B (Fixed Sequence Control)'}
            </p>
            <p>
              <strong>Time-on-Task:</strong> {Math.round(session.timeOnTaskSeconds / 60)} minutes (
              {session.timeOnTaskSeconds}s)
            </p>
            <p>
              <strong>Recorded Evidence Items:</strong> {session.evidenceLog.length} diagnostic interactions logged.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => {
                setSession(null);
                setPreResponses({});
                setPostResponses({});
              }}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500"
            >
              Participate in Another Experiment
            </button>
          </div>
        </div>
      )}

      {/* Consent Modal */}
      <ResearchConsentModal
        protocol={selectedProtocol}
        isOpen={consentModalOpen}
        onConsent={handleConsent}
        onCancel={() => setConsentModalOpen(false)}
      />
    </div>
  );
};

