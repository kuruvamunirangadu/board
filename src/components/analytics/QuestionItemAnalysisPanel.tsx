'use client';

import React from 'react';
import { QuestionPerformance } from '@/types/analytics';
import { HelpCircle, AlertTriangle, CheckCircle2, BarChart2 } from 'lucide-react';

interface QuestionItemAnalysisPanelProps {
  questions: QuestionPerformance[];
}

export const QuestionItemAnalysisPanel: React.FC<QuestionItemAnalysisPanelProps> = ({
  questions,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
            <BarChart2 className="h-4 w-4 text-cyan-400" />
            Question-Level Item Analysis ({questions.length})
          </h3>
          <p className="text-[11px] text-slate-400">
            Psychometric and difficulty breakdown. Questions are flagged for review only when sample size N &gt;= 5.
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {questions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500 italic">
            No question attempt data recorded yet.
          </div>
        ) : (
          questions.map((q) => {
            return (
              <div
                key={q.questionId}
                className={`rounded-lg border p-3.5 transition-all ${
                  q.needsReviewFlag
                    ? 'border-amber-500/40 bg-amber-950/10'
                    : 'border-slate-800/80 bg-slate-900/40'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-100">{q.questionTitle}</span>
                      {q.needsReviewFlag && (
                        <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/40 px-1.5 py-0.5 text-[10px] font-bold text-amber-300">
                          <AlertTriangle className="h-3 w-3" /> Flagged for Review
                        </span>
                      )}
                      {!q.isSampleAdequate && (
                        <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] text-slate-400 font-mono">
                          Small Sample (N={q.totalAttempts})
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Concept: <span className="text-cyan-400 font-medium">{q.conceptTitle}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-xs font-mono font-bold text-cyan-300">
                        {q.accuracyFormatted}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {q.correctAttempts}/{q.totalAttempts} correct
                      </div>
                    </div>
                  </div>
                </div>

                {/* Option Distribution Bars */}
                {Object.keys(q.optionDistribution).length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-slate-800/60">
                    <div className="text-[10px] font-medium text-slate-400 mb-1.5">
                      Submitted Answer Distribution:
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(q.optionDistribution).map(([opt, count]) => {
                        const pct = Math.round((count / q.totalAttempts) * 100);
                        return (
                          <div
                            key={opt}
                            className="flex items-center gap-1.5 rounded bg-slate-950 border border-slate-800 px-2 py-1 text-[10px]"
                          >
                            <span className="font-mono text-slate-400 font-bold">
                              Choice {opt}:
                            </span>
                            <span className="text-cyan-300 font-mono">{count} ({pct}%)</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Flag Reason */}
                {q.reviewFlagReason && (
                  <div className="mt-2 text-[10px] text-amber-300/90 font-mono">
                    ℹ {q.reviewFlagReason}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

