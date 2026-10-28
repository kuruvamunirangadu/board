'use client';

import React, { useState } from 'react';
import { BetaEvaluationAggregate } from '@/types/beta';
import {
  TrendingUp,
  Award,
  Users,
  Star,
  AlertTriangle,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface BetaEvaluationDashboardProps {
  aggregate: BetaEvaluationAggregate;
  onDeleteParticipantData: (code: string) => Promise<void>;
  onRefresh: () => void;
}

export const BetaEvaluationDashboard: React.FC<BetaEvaluationDashboardProps> = ({
  aggregate,
  onDeleteParticipantData,
  onRefresh,
}) => {
  const [deleteCode, setDeleteCode] = useState('');
  const [deleteStatus, setDeleteStatus] = useState<string | null>(null);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deleteCode.trim()) return;
    try {
      await onDeleteParticipantData(deleteCode.trim().toUpperCase());
      setDeleteStatus(`Successfully purged all records for participant ${deleteCode.trim().toUpperCase()}.`);
      setDeleteCode('');
      onRefresh();
    } catch (e: any) {
      setDeleteStatus(`Deletion error: ${e.message}`);
    }
  };

  const kpis = [
    {
      title: 'Completed Pilot Sessions',
      value: `${aggregate.completedSessions} / ${aggregate.totalSessions}`,
      subtext: `${aggregate.completionRatePercentage}% completion rate (${aggregate.totalParticipants} distinct learners)`,
      icon: Users,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/20',
      borderColor: 'border-cyan-500/30',
    },
    {
      title: 'Conceptual Delta (Gain)',
      value: aggregate.averageScoreDelta !== null ? `+${aggregate.averageScoreDelta}` : '—',
      subtext: `Avg Pre: ${aggregate.averagePreScore ?? 0} / 3 ➔ Avg Post: ${aggregate.averagePostScore ?? 0} / 3`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/20',
      borderColor: 'border-emerald-500/30',
    },
    {
      title: 'Visualization Usability Rating',
      value: aggregate.averageRating !== null ? `${aggregate.averageRating} / 5.0` : '—',
      subtext: `From ${aggregate.feedbackRecordsCount} submitted student reviews`,
      icon: Star,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/20',
      borderColor: 'border-amber-500/30',
    },
    {
      title: 'Reported Error Incidents',
      value: `${aggregate.reportedErrorIncidentsCount}`,
      subtext: aggregate.reportedErrorIncidentsCount === 0 ? '0 blocking errors reported' : 'Under active triage',
      icon: AlertTriangle,
      color: aggregate.reportedErrorIncidentsCount === 0 ? 'text-emerald-400' : 'text-red-400',
      bgColor: aggregate.reportedErrorIncidentsCount === 0 ? 'bg-emerald-950/20' : 'bg-red-950/20',
      borderColor: aggregate.reportedErrorIncidentsCount === 0 ? 'border-emerald-500/30' : 'border-red-500/30',
    },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={i}
              className={`rounded-xl border ${kpi.borderColor} ${kpi.bgColor} p-4 backdrop-blur-md space-y-2`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.title}
                </span>
                <Icon className={`h-4 w-4 ${kpi.color}`} />
              </div>
              <div className={`text-2xl font-bold font-mono ${kpi.color}`}>{kpi.value}</div>
              <div className="text-[11px] text-slate-400">{kpi.subtext}</div>
            </div>
          );
        })}
      </div>

      {/* Topic Breakdown Table */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3 flex items-center gap-2">
          <Award className="h-4 w-4 text-cyan-400" />
          Topic-by-Topic Learning Gain (Pre-Test vs Post-Test Delta)
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase">
                <th className="py-2.5 px-3">Curated Beta Topic</th>
                <th className="py-2.5 px-3">Completed Sessions</th>
                <th className="py-2.5 px-3">Avg Pre-Test</th>
                <th className="py-2.5 px-3">Avg Post-Test</th>
                <th className="py-2.5 px-3 text-right">Conceptual Delta (Δ)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {aggregate.topicBreakdown.map((t) => (
                <tr key={t.taskId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{t.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{t.taskId}</div>
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-300 font-semibold">
                    {t.completedCount} sessions
                  </td>
                  <td className="py-3 px-3 font-mono text-slate-400">
                    {t.avgPreScore !== null ? `${t.avgPreScore} / 3.0` : '—'}
                  </td>
                  <td className="py-3 px-3 font-mono text-cyan-300 font-semibold">
                    {t.avgPostScore !== null ? `${t.avgPostScore} / 3.0` : '—'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono font-bold">
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs ${
                        (t.avgDelta ?? 0) > 0
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {t.avgDelta !== null && t.avgDelta > 0 ? `+${t.avgDelta}` : t.avgDelta ?? '0.0'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qualitative Feedback Themes */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-purple-400" />
          Formative Usability Feedback Themes
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {aggregate.feedbackThemes.map((theme, i) => (
            <div
              key={i}
              className="rounded-lg border border-purple-500/20 bg-slate-900/50 p-3 space-y-2 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold text-slate-200">{theme.theme}</span>
                  <span className="rounded bg-purple-500/20 border border-purple-500/30 px-1.5 py-0.2 text-[10px] font-mono text-purple-300">
                    {theme.count} citations
                  </span>
                </div>
                <p className="text-xs italic text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  &ldquo;{theme.sampleQuote}&rdquo;
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Privacy & Right-to-Delete Tool */}
      <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-2 flex items-center gap-2">
          <Trash2 className="h-4 w-4 text-red-400" />
          Participant Data Deletion Compliance (GDPR / Research Ethics)
        </h3>
        <p className="text-[11px] text-slate-400 mb-3">
          Students can request immediate erasure of all pseudonymous session logs and feedback records using their code.
        </p>

        <form onSubmit={handleDelete} className="flex flex-wrap items-center gap-2 max-w-md">
          <input
            type="text"
            placeholder="Participant Code (e.g. P-101)"
            value={deleteCode}
            onChange={(e) => setDeleteCode(e.target.value.toUpperCase())}
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 font-mono placeholder-slate-600 focus:border-red-400 focus:outline-none flex-1"
          />
          <button
            type="submit"
            disabled={!deleteCode.trim()}
            className="rounded-lg border border-red-500/40 bg-red-600/20 px-3 py-1.5 text-xs font-bold text-red-300 hover:bg-red-600/40 transition-colors disabled:opacity-40"
          >
            Purge Participant Records
          </button>
        </form>

        {deleteStatus && (
          <div className="mt-2 text-xs text-cyan-300 font-mono flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> {deleteStatus}
          </div>
        )}
      </div>

      {/* Limitations Notice */}
      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 text-xs text-slate-400 space-y-1">
        <div className="flex items-center gap-1.5 font-semibold text-slate-300">
          <Info className="h-4 w-4 text-cyan-400" /> Formative Evaluation Limitations Disclosure:
        </div>
        <ul className="list-disc list-inside space-y-0.5 text-[11px]">
          {aggregate.limitations.map((lim, idx) => (
            <li key={idx}>{lim}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

