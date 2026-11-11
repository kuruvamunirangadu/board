'use client';

import { AnswerEvaluation } from '../../assessment/AssessmentContracts';
import { AdaptiveRecommendation } from '../../adaptive/AdaptiveLearningContracts';
import { LearningAnalytics } from '../types/MasteryTypes';
import { ConceptMasteryMap } from './ConceptMasteryMap';

export function AssessmentResults({ evaluation, analytics, recommendation, completed, onContinue, onRestart, onRecommendedTopic }: {
  evaluation: AnswerEvaluation;
  analytics: LearningAnalytics;
  recommendation: AdaptiveRecommendation | null;
  completed: boolean;
  onContinue: () => void;
  onRestart: () => void;
  onRecommendedTopic: (query: string) => void;
}) {
  const correct = evaluation.finalAnswerCorrect === true;
  return <div className="space-y-3">
    <div role="status" className={`rounded-lg border p-3 text-xs ${correct ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200' : evaluation.status === 'partially_correct' ? 'border-amber-500/40 bg-amber-950/30 text-amber-100' : 'border-rose-500/40 bg-rose-950/30 text-rose-200'}`}><strong>{evaluation.status.replaceAll('_', ' ')}</strong><p className="mt-1 leading-relaxed">{evaluation.feedback}</p><p className="mt-1">Score: {evaluation.score}%</p>{evaluation.misconceptionAlert && <p className="mt-2">{evaluation.misconceptionAlert}</p>}</div>
    <ConceptMasteryMap mastery={analytics.mastery} />
    <div className="text-[11px] text-slate-400">Recent accuracy: {analytics.recentAccuracy}% · Average: {analytics.averageScore}% · Hints: {analytics.hintsUsed}</div>
    {recommendation && <div className="rounded-lg border border-indigo-500/30 bg-indigo-950/20 p-3"><div className="text-xs font-semibold text-indigo-200">Next: {recommendation.title}</div><p className="mt-1 text-[11px] text-slate-300">{recommendation.description}</p><p className="mt-1 text-[10px] text-slate-400">{recommendation.reasoning}</p><button type="button" onClick={() => onRecommendedTopic(recommendation.suggestedQuery)} className="mt-2 rounded border border-indigo-400/40 px-2.5 py-1.5 text-[10px] text-indigo-100">Open recommendation</button></div>}
    {completed ? <div className="flex items-center justify-between gap-2"><div className="text-xs font-semibold text-emerald-300">Assessment complete · {analytics.totalAttempts} total attempts on this concept</div><button type="button" onClick={onRestart} className="rounded border border-slate-600 px-3 py-2 text-xs text-slate-200">Try again</button></div> : <button type="button" onClick={onContinue} className="rounded bg-indigo-600 px-3 py-2 text-xs font-semibold text-white">Next question</button>}
  </div>;
}
