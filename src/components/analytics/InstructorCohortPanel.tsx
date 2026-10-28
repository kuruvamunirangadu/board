'use client';

import React from 'react';
import { InstructorClassAnalytics } from '@/types/analytics';
import { Shield, Users, AlertCircle, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';

interface InstructorCohortPanelProps {
  instructorData: InstructorClassAnalytics | null;
  isAuthorized: boolean;
}

export const InstructorCohortPanel: React.FC<InstructorCohortPanelProps> = ({
  instructorData,
  isAuthorized,
}) => {
  if (!isAuthorized) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-950/20 p-6 text-center backdrop-blur-md">
        <Shield className="mx-auto h-8 w-8 text-red-400 mb-2" />
        <h3 className="text-sm font-bold text-red-200">Instructor Access Restricted</h3>
        <p className="text-xs text-red-300/80 mt-1 max-w-md mx-auto">
          You must have verified instructor or host privileges to view aggregated cohort metrics and question item diagnostics.
        </p>
      </div>
    );
  }

  if (!instructorData) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Overview Banner */}
      <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-500/20">
          <div className="flex items-center gap-2.5">
            <Shield className="h-5 w-5 text-purple-400" />
            <div>
              <h2 className="text-sm font-bold text-white">{instructorData.className}</h2>
              <p className="text-[11px] text-purple-300">
                Cohort Analytics & Privacy-Preserving Class Aggregates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-slate-300">
              Enrolled: <span className="text-purple-300 font-bold">{instructorData.totalEnrolledLearners}</span>
            </div>
            <div className="text-slate-300">
              Active: <span className="text-emerald-400 font-bold">{instructorData.activeLearnersCount}</span>
            </div>
            <div className="text-slate-300">
              Class Accuracy: <span className="text-cyan-300 font-bold">{instructorData.overallClassAccuracyFormatted}</span>
            </div>
          </div>
        </div>

        {/* Concepts Needing Reinforcement Alert Box */}
        {instructorData.conceptsNeedingReinforcement.length > 0 && (
          <div className="mt-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              Concepts Requiring Additional Lecture / Demonstration:
            </div>
            <div className="space-y-1">
              {instructorData.conceptsNeedingReinforcement.map((c) => (
                <div key={c.conceptId} className="text-xs text-amber-200/90 flex items-start gap-2">
                  <span className="font-semibold text-amber-400">• {c.conceptTitle}:</span>
                  <span>{c.reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Concept Averages Grid */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-purple-400" />
          Class-Wide Concept Mastery Breakdown
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {instructorData.conceptAverages.map((ca) => (
            <div
              key={ca.conceptId}
              className="rounded-lg border border-slate-800 bg-slate-900/50 p-3.5 space-y-2 hover:border-purple-500/30 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div className="text-xs font-bold text-slate-200">{ca.conceptTitle}</div>
                <span className="text-xs font-mono font-bold text-purple-300">
                  {ca.accuracyFormatted}
                </span>
              </div>

              <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    (ca.accuracy ?? 0) >= 75
                      ? 'bg-emerald-400'
                      : (ca.accuracy ?? 0) >= 60
                      ? 'bg-cyan-400'
                      : 'bg-amber-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, ca.accuracy || 0))}%` }}
                />
              </div>

              <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                <span>{ca.totalAttempts} total submissions</span>
                {ca.strugglingLearnersCount > 0 ? (
                  <span className="text-amber-400 font-semibold">
                    {ca.strugglingLearnersCount} students below 60%
                  </span>
                ) : (
                  <span className="text-emerald-400">All students &gt;= 60%</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

