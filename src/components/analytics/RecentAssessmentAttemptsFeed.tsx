'use client';

import React from 'react';
import { AssessmentAttemptRecord } from '@/types/analytics';
import { History, Check, X, Clock } from 'lucide-react';

interface RecentAssessmentAttemptsFeedProps {
  attempts: AssessmentAttemptRecord[];
}

export const RecentAssessmentAttemptsFeed: React.FC<RecentAssessmentAttemptsFeedProps> = ({
  attempts,
}) => {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Recent Assessment History ({attempts.length})
          </h3>
        </div>
        <span className="text-[10px] text-slate-500 font-mono">Real-time log</span>
      </div>

      <div className="mt-3 space-y-2 max-h-[320px] overflow-y-auto pr-1">
        {attempts.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-500 italic">
            No recent assessment attempts recorded. Complete a knowledge check to see results here.
          </div>
        ) : (
          attempts.map((att) => {
            return (
              <div
                key={att.id}
                className="flex items-center justify-between rounded-lg border border-slate-800/80 bg-slate-900/40 p-2.5 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                      att.isCorrect
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {att.isCorrect ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-slate-200">
                      {att.questionTitle || att.questionId}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{att.conceptTitle}</span>
                      <span>•</span>
                      <span className="font-mono">Choice: {att.selectedOption}</span>
                      {att.timeSpentSeconds && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-2.5 w-2.5" /> {att.timeSpentSeconds}s
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div
                    className={`text-xs font-mono font-bold ${
                      att.isCorrect ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {att.score}/{att.maxScore} pts
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(att.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

