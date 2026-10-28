'use client';

import React from 'react';
import Link from 'next/link';
import { ConceptPerformance, CoverageStatus } from '@/types/analytics';
import { Award, CheckCircle2, Clock, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react';

interface ConceptPerformanceTableProps {
  performances: ConceptPerformance[];
  onSelectConcept?: (conceptId: string) => void;
}

export const ConceptPerformanceTable: React.FC<ConceptPerformanceTableProps> = ({
  performances,
}) => {
  const getStatusBadge = (status: CoverageStatus, isSampleAdequate: boolean) => {
    switch (status) {
      case 'mastered_evidence':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
            <Award className="h-3 w-3 text-emerald-400" /> Mastered Evidence
          </span>
        );
      case 'assessed':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5 text-[10px] font-semibold text-cyan-300">
            <CheckCircle2 className="h-3 w-3 text-cyan-400" /> Assessed
          </span>
        );
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold text-amber-300">
            <Clock className="h-3 w-3 text-amber-400" /> In Progress
          </span>
        );
      case 'not_assessed':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-slate-700 bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400">
            Not Assessed
          </span>
        );
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Concept Assessment Performance Breakdown ({performances.length})
          </h3>
          <p className="text-[11px] text-slate-400">
            Concept accuracy is calculated strictly from evaluated question responses. Concepts with N &lt; 3 are labeled as preliminary sample size.
          </p>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-2.5 px-3">Concept</th>
              <th className="py-2.5 px-3">Status</th>
              <th className="py-2.5 px-3">Attempts (N)</th>
              <th className="py-2.5 px-3">Accuracy</th>
              <th className="py-2.5 px-3">Last Attempt</th>
              <th className="py-2.5 px-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {performances.map((c) => {
              const hasAttempts = c.totalAttempts > 0;
              const isSmallSample = hasAttempts && !c.isSampleAdequate;

              return (
                <tr key={c.conceptId} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3">
                    <div className="font-semibold text-slate-200">{c.conceptTitle}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{c.conceptId}</div>
                  </td>
                  <td className="py-3 px-3">
                    {getStatusBadge(c.coverageStatus, c.isSampleAdequate)}
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-slate-200 font-semibold">{c.totalAttempts}</span>
                      <span className="text-[10px] text-slate-500">
                        ({c.correctAttempts}✓ / {c.incorrectAttempts}✗)
                      </span>
                      {isSmallSample && (
                        <span
                          className="inline-flex items-center text-[10px] text-amber-400 ml-1"
                          title="Small sample size: N < 3. More practice attempts recommended."
                        >
                          <AlertTriangle className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3 min-w-[140px]">
                    {hasAttempts ? (
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="font-mono font-bold text-cyan-300">
                            {c.accuracyFormatted}
                          </span>
                        </div>
                        <div className="h-1.5 w-full rounded-full bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              (c.accuracy ?? 0) >= 80
                                ? 'bg-emerald-400'
                                : (c.accuracy ?? 0) >= 60
                                ? 'bg-cyan-400'
                                : 'bg-amber-400'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(5, c.accuracy || 0))}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-slate-500 italic text-[11px]">No assessment data</span>
                    )}
                  </td>
                  <td className="py-3 px-3 text-slate-400 text-[11px]">
                    {c.lastAttemptTimestamp
                      ? new Date(c.lastAttemptTimestamp).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </td>
                  <td className="py-3 px-3 text-right">
                    <Link
                      href={`/paths?concept=${c.conceptId}`}
                      className="inline-flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-2.5 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-900/60 hover:text-cyan-100 transition-colors"
                    >
                      <span>Practice</span>
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

