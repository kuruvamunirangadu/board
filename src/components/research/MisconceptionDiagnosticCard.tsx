'use client';

import React from 'react';
import { MisconceptionDefinition } from '@/types/research';
import { VALIDATED_MISCONCEPTIONS } from '@/features/adaptive/misconception-catalog';

interface Props {
  misconceptionId: string;
}

export const MisconceptionDiagnosticCard: React.FC<Props> = ({ misconceptionId }) => {
  const misconception: MisconceptionDefinition | undefined = VALIDATED_MISCONCEPTIONS[misconceptionId];
  if (!misconception) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-slate-200">
      <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
        <div className="flex items-center gap-2">
          <span className="text-amber-400 font-bold text-sm">⚠️ Detected Misconception</span>
          <span className="rounded bg-amber-900/50 px-2 py-0.5 text-xs font-semibold text-amber-300 border border-amber-700/50">
            {misconception.name}
          </span>
        </div>
        <span className="text-[11px] text-amber-400/80 font-mono">{misconception.id}</span>
      </div>

      <div className="mt-3 space-y-2 text-xs">
        <div>
          <span className="font-medium text-amber-300">Misconception Profile:</span>
          <p className="mt-0.5 text-slate-300">{misconception.description}</p>
        </div>

        <div className="rounded-lg bg-amber-900/20 p-2.5 border border-amber-800/30">
          <span className="font-semibold text-emerald-300">Targeted Physical Resolution:</span>
          <p className="mt-0.5 text-slate-200">{misconception.remedialExplanation}</p>
        </div>

        <div className="pt-1 text-[11px] text-slate-400">
          <span className="text-slate-500">Authoritative Literature Source:</span> {misconception.authoritativeSource}
        </div>
      </div>
    </div>
  );
};

