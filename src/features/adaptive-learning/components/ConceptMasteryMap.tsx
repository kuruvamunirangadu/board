'use client';

import { ConceptMastery } from '../types/MasteryTypes';

const labels: Record<ConceptMastery['status'], string> = {
  not_started: 'Not assessed', needs_revision: 'Needs revision', learning: 'Learning', almost_mastered: 'Almost mastered', mastered: 'Mastered',
};

export function ConceptMasteryMap({ mastery }: { mastery: ConceptMastery }) {
  return <section aria-label="Concept mastery" className="rounded-lg border border-slate-700 bg-slate-950/60 p-3 space-y-2">
    <div className="flex items-center justify-between gap-2"><h4 className="text-xs font-semibold capitalize text-slate-200">{mastery.conceptName}</h4><span className="text-[10px] text-cyan-300">{labels[mastery.status]}</span></div>
    <div className="h-2 overflow-hidden rounded bg-slate-800"><div className="h-full rounded bg-cyan-400 transition-all" style={{ width: `${mastery.masteryScore}%` }} /></div>
    <div className="flex justify-between text-[10px] text-slate-400"><span>{mastery.correctAttempts}/{mastery.totalAttempts} correct</span><span>{mastery.masteryScore}% mastery</span></div>
  </section>;
}
