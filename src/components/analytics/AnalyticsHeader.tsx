'use client';

import React from 'react';
import { RetakePolicy } from '@/types/analytics';
import { BarChart3, Download, RefreshCw, Shield, GraduationCap, Info } from 'lucide-react';

interface AnalyticsHeaderProps {
  currentRole: 'student' | 'instructor';
  onRoleChange: (role: 'student' | 'instructor') => void;
  selectedLearnerId: string;
  onLearnerChange: (id: string) => void;
  retakePolicy: RetakePolicy;
  onPolicyChange: (policy: RetakePolicy) => void;
  onRefresh: () => void;
  onExport: () => void;
  isLoading: boolean;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  currentRole,
  onRoleChange,
  selectedLearnerId,
  onLearnerChange,
  retakePolicy,
  onPolicyChange,
  onRefresh,
  onExport,
  isLoading,
}) => {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 bg-slate-950/80 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.25)]">
          <BarChart3 className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">
            VisiOS Learning Analytics & Evidence Insights
          </h1>
          <p className="text-xs text-slate-400">
            Demonstrated mastery metrics derived from authoritative assessment attempts & saved experiments.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Role Toggle */}
        <div className="flex rounded-lg border border-slate-800 bg-slate-900/60 p-1 text-xs">
          <button
            onClick={() => onRoleChange('student')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${
              currentRole === 'student'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5" /> Learner View
          </button>
          <button
            onClick={() => onRoleChange('instructor')}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1 font-semibold transition-all ${
              currentRole === 'instructor'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="h-3.5 w-3.5" /> Instructor View
          </button>
        </div>

        {/* Student Selector (If in student view) */}
        {currentRole === 'student' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-400">Learner:</span>
            <select
              value={selectedLearnerId}
              onChange={(e) => onLearnerChange(e.target.value)}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            >
              <option value="learner-kai">Kai Vance (Practicing)</option>
              <option value="learner-ada">Ada Lovelace (Advanced)</option>
              <option value="learner-maya">Maya Lin (Intermediate)</option>
            </select>
          </div>
        )}

        {/* Retake Policy Dropdown */}
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400">Policy:</span>
          <select
            value={retakePolicy}
            onChange={(e) => onPolicyChange(e.target.value as RetakePolicy)}
            className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1 text-xs text-slate-200 focus:border-cyan-400 focus:outline-none"
            title="Choose how repeated attempts on the same question are calculated"
          >
            <option value="all_attempts">All Attempts (Raw)</option>
            <option value="latest_attempt">Latest Attempt Only</option>
            <option value="best_attempt">Best Score</option>
          </select>
        </div>

        {/* Refresh Button */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200 transition-colors disabled:opacity-50"
          title="Recalculate analytics from source records"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          Refresh
        </button>

        {/* Export Report Button */}
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/20 px-3 py-1.5 text-xs font-semibold text-cyan-300 hover:bg-cyan-600/40 transition-colors shadow-sm"
        >
          <Download className="h-3.5 w-3.5" />
          Export Report
        </button>
      </div>
    </header>
  );
};

