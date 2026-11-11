'use client';

import { AdaptiveRecommendation } from '../../adaptive/AdaptiveLearningContracts';
import { useAdaptiveLearning } from '../hooks/useAdaptiveLearning';
import { QuestionCard } from './QuestionCard';
import { AssessmentResults } from './AssessmentResults';

export function AssessmentPanel({ conceptId, topic, onRecommendedTopic, onProgress }: {
  conceptId: string;
  topic: string;
  onRecommendedTopic: (query: string) => void;
  onProgress?: (result: { score: number; question: string; isCorrect: boolean; recommendation: AdaptiveRecommendation | null }) => void;
}) {
  const adaptive = useAdaptiveLearning(conceptId);
  if (adaptive.isLoading) return <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-xs text-slate-400">Preparing a verified assessment…</div>;
  return <section aria-label="Adaptive assessment" className="rounded-xl border border-cyan-500/30 bg-cyan-950/10 p-4 space-y-3">
    <div className="flex items-center justify-between"><div><h3 className="text-sm font-semibold text-cyan-200">Adaptive knowledge check</h3><p className="text-[10px] text-slate-400">{topic} · deterministic scoring · difficulty adjusts to your answers</p></div>{adaptive.session && <span className="text-[10px] text-slate-400">{Math.min(adaptive.session.questionsAnswered + (adaptive.evaluation ? 0 : 1), 5)}/5</span>}</div>
    {adaptive.error && <p role="status" className="rounded border border-amber-500/30 bg-amber-950/20 p-2 text-xs text-amber-200">{adaptive.error}</p>}
    {adaptive.hint && <p className="rounded border border-amber-500/20 bg-amber-950/20 p-2 text-xs text-amber-100">{adaptive.hint.hintText}</p>}
    {adaptive.question && !adaptive.error && <QuestionCard key={adaptive.question.id} question={adaptive.question} disabled={Boolean(adaptive.evaluation)} onHint={adaptive.requestHint} onSubmit={(answer) => {
      const result = adaptive.submitAnswer(answer);
      if (result) onProgress?.({ score: result.summary.averageScore, question: adaptive.question?.question || '', isCorrect: result.evaluation.status === 'correct', recommendation: result.recommendation });
    }} />}
    {adaptive.evaluation && adaptive.analytics && <AssessmentResults evaluation={adaptive.evaluation} analytics={adaptive.analytics} recommendation={adaptive.recommendation} completed={Boolean(adaptive.session?.isCompleted)} onContinue={adaptive.continueAssessment} onRestart={adaptive.restartAssessment} onRecommendedTopic={onRecommendedTopic} />}
  </section>;
}
