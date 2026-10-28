'use client';

import React, { useState } from 'react';
import { RESEARCH_PROTOCOLS } from '@/features/research/experiment-engine';
import { ResearchExperimentRunner } from '@/components/research/ResearchExperimentRunner';
import { ResearchAnalyticsDashboard } from '@/components/research/ResearchAnalyticsDashboard';

export default function ResearchPage() {
  const [activeTab, setActiveTab] = useState<'trial_runner' | 'analytics' | 'architecture'>('trial_runner');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8 space-y-6">
      {/* Portal Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded bg-indigo-900/60 px-2.5 py-1 text-xs font-bold text-indigo-400 border border-indigo-700/50">
              VisiOS AI Intelligence
            </span>
            <span className="text-xs text-slate-500 font-mono">Milestone 19</span>
          </div>
          <h1 className="mt-2 text-2xl font-black tracking-tight text-white md:text-3xl">
            Research Validation & AI Learning Intelligence
          </h1>
          <p className="mt-1 text-xs text-slate-400 max-w-3xl">
            Evidence-driven adaptive visual learning framework. Empirically evaluating whether diagnostic AI interventions produce statistically significant learning gains over fixed curricula.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex rounded-xl bg-slate-900 p-1 border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setActiveTab('trial_runner')}
            className={`rounded-lg px-4 py-2 transition-all ${
              activeTab === 'trial_runner'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            🔬 Participant Trial Runner
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`rounded-lg px-4 py-2 transition-all ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📊 Research Analytics Dashboard
          </button>
          <button
            onClick={() => setActiveTab('architecture')}
            className={`rounded-lg px-4 py-2 transition-all ${
              activeTab === 'architecture'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📐 Knowledge Architecture
          </button>
        </div>
      </div>

      {/* TAB 1: EXPERIMENT RUNNER */}
      {activeTab === 'trial_runner' && (
        <ResearchExperimentRunner protocols={RESEARCH_PROTOCOLS} />
      )}

      {/* TAB 2: ANALYTICS DASHBOARD */}
      {activeTab === 'analytics' && (
        <ResearchAnalyticsDashboard protocols={RESEARCH_PROTOCOLS} />
      )}

      {/* TAB 3: PEDAGOGICAL ARCHITECTURE */}
      {activeTab === 'architecture' && (
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-6 space-y-6 text-xs text-slate-300">
          <h2 className="text-base font-bold text-white">AI Learning Intelligence Architecture</h2>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <h3 className="font-semibold text-indigo-400 text-sm">1. Learner Knowledge Model</h3>
              <p className="text-slate-400 leading-relaxed">
                Stores atomic diagnostic evidence items, distinguishing observed performance from estimated mastery. Calculates Bayesian-weighted mastery probabilities and dynamic uncertainty metrics (uncertainty = 1 / sqrt(N + 1)).
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <h3 className="font-semibold text-emerald-400 text-sm">2. Explainable Adaptation Engine</h3>
              <p className="text-slate-400 leading-relaxed">
                Deterministic rule engine mapping diagnostic response patterns to targeted interventions (2D schematics, 3D interactive models, guided simulations). Generates full human-readable rationales and evidence trails.
              </p>
            </div>

            <div className="rounded-lg border border-slate-800 bg-slate-950/60 p-4 space-y-2">
              <h3 className="font-semibold text-purple-400 text-sm">3. Controlled A/B Framework</h3>
              <p className="text-slate-400 leading-relaxed">
                Counterbalanced allocation between Condition A (Adaptive AI) and Condition B (Fixed Sequence Control). Computes normalized learning gains (g = (Post - Pre) / (100 - Pre)) and Cohen's d effect sizes.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-950 p-4 font-mono text-[11px] text-slate-300 space-y-1">
            <div className="text-indigo-400 font-bold">Supported Diagnostic Misconceptions:</div>
            <div>• <code className="text-amber-300">misconception-mass-period</code>: Bob mass period dependency fallacy in simple pendulums.</div>
            <div>• <code className="text-amber-300">misconception-amplitude-invariance</code>: Universal small-angle extrapolation at θ &gt; 30°.</div>
            <div>• <code className="text-amber-300">misconception-damping-frequency</code>: Damping neglect in dissipative phase space dynamics.</div>
            <div>• <code className="text-amber-300">misconception-bst-heap</code>: BST left-right ordering vs Binary Heap parent-child invariant confusion.</div>
            <div>• <code className="text-amber-300">misconception-unbalanced-lookup</code>: Unconditional O(log n) lookup fallacy in degenerate BSTs.</div>
            <div>• <code className="text-amber-300">misconception-resonance-resistance</code>: Series resistance coupling to undamped natural resonant frequency ω₀.</div>
            <div>• <code className="text-amber-300">misconception-q-factor-bandwidth</code>: Quality factor bandwidth inversion in RLC circuits.</div>
          </div>
        </div>
      )}
    </div>
  );
}

