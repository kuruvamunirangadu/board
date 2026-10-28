'use client';

import React from 'react';
import { AdaptationRecommendation } from '@/types/research';

interface Props {
  recommendation: AdaptationRecommendation;
}

export const AdaptiveRationaleViewer: React.FC<Props> = ({ recommendation }) => {
  return (
    <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 text-slate-200">
      <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
            AI
          </span>
          <h4 className="font-semibold text-white text-sm">Adaptive Pedagogical Rationale</h4>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded bg-indigo-900/60 px-2 py-0.5 font-mono text-[11px] text-indigo-300 border border-indigo-700/40">
            {recommendation.triggeredRuleId} ({recommendation.ruleVersion})
          </span>
          <span className="rounded bg-emerald-900/40 px-2 py-0.5 text-[11px] font-medium text-emerald-300 border border-emerald-700/30">
            Intervention: {recommendation.interventionType.replace(/_/g, ' ')}
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3 text-xs">
        <div>
          <span className="font-semibold text-indigo-300">Target Learning Objective:</span>
          <p className="mt-0.5 text-slate-300">{recommendation.targetObjective}</p>
        </div>

        <div>
          <span className="font-semibold text-indigo-300">Pedagogical Justification:</span>
          <p className="mt-0.5 text-slate-200 leading-relaxed font-sans">
            {recommendation.humanReadableRationale}
          </p>
        </div>

        <div>
          <span className="font-semibold text-indigo-300">Empirical Evidence Trail:</span>
          <ul className="mt-1 list-disc pl-5 space-y-0.5 text-slate-400 font-mono text-[11px]">
            {recommendation.evidenceTrail.map((ev, i) => (
              <li key={i}>{ev}</li>
            ))}
          </ul>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-400 border-t border-indigo-500/10">
          <span>Resource: <code className="text-indigo-300">{recommendation.resourceId}</code></span>
          {recommendation.estimatedDifficultyReduction > 0 && (
            <span>Estimated Scaffolding Delta: <strong className="text-emerald-400">-{(recommendation.estimatedDifficultyReduction * 100).toFixed(0)}% difficulty</strong></span>
          )}
        </div>
      </div>
    </div>
  );
};

