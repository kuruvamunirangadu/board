'use client';

import React from 'react';
import Link from 'next/link';
import { RecommendationEvidence } from '@/types/analytics';
import { Sparkles, ArrowRight, Play, BookOpen, RotateCcw, CheckCircle2 } from 'lucide-react';

interface ExplainableRecommendationsPanelProps {
  recommendations: RecommendationEvidence[];
}

export const ExplainableRecommendationsPanel: React.FC<
  ExplainableRecommendationsPanelProps
> = ({ recommendations }) => {
  const getActionIcon = (action: string) => {
    switch (action) {
      case 'run_experiment':
        return <Play className="h-4 w-4 text-amber-400" />;
      case 'advance_next_concept':
        return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
      case 'review_prerequisite':
      case 'practice_question':
        return <RotateCcw className="h-4 w-4 text-cyan-400" />;
      default:
        return <BookOpen className="h-4 w-4 text-purple-400" />;
    }
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'run_experiment':
        return 'Launch Simulation Experiment';
      case 'advance_next_concept':
        return 'Advance to Downstream Concept';
      case 'practice_question':
        return 'Targeted Practice Questions';
      case 'review_prerequisite':
        return 'Review Prerequisite Theory';
      default:
        return 'Take Initial Knowledge Check';
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/10 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 pb-3 border-b border-purple-500/20">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
          Evidence-Grounded Review & Practice Recommendations ({recommendations.length})
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className="flex flex-col justify-between rounded-lg border border-purple-500/20 bg-slate-950/70 p-3.5 shadow-sm hover:border-purple-500/40 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-900 border border-slate-800">
                  {getActionIcon(rec.recommendedAction)}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-xs font-bold text-slate-100">
                    {rec.conceptTitle}
                  </div>
                  <div className="text-[10px] text-purple-400 font-medium">
                    {getActionLabel(rec.recommendedAction)}
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/50 rounded p-2 border border-slate-800/80 mb-2">
                {rec.rationale}
              </p>

              {/* Evidence citations */}
              {rec.evidenceRecords && rec.evidenceRecords.length > 0 && (
                <div className="text-[10px] text-slate-400 space-y-0.5 mb-3">
                  <span className="font-semibold text-slate-500 uppercase tracking-wider block">
                    Evidence Citations:
                  </span>
                  {rec.evidenceRecords.map((ev, i) => (
                    <div key={i} className="truncate font-mono text-cyan-400/80">
                      • {ev}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Link
              href={
                rec.recommendedAction === 'run_experiment'
                  ? `/?concept=${rec.conceptId}`
                  : `/paths?concept=${rec.conceptId}`
              }
              className="mt-auto flex items-center justify-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/20 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-600/40 transition-colors shadow-sm"
            >
              <span>Launch Activity</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

