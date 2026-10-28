'use client';

import React, { useState } from 'react';
import { KnowledgeCheckQuestion } from '@/types/intelligence';
import { CheckCircle2, HelpCircle, ArrowRight, Award, AlertCircle } from 'lucide-react';

interface PrePostTestWizardProps {
  testType: 'pre' | 'post';
  title: string;
  questions: KnowledgeCheckQuestion[];
  preTestScore?: number;
  onSubmitAnswers: (answers: number[]) => Promise<{ score: number; total: number; delta?: number }>;
  onProceedToNextStep: () => void;
}

export const PrePostTestWizard: React.FC<PrePostTestWizardProps> = ({
  testType,
  title,
  questions,
  preTestScore,
  onSubmitAnswers,
  onProceedToNextStep,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [testScore, setTestScore] = useState<number | null>(null);
  const [scoreDelta, setScoreDelta] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOptionSelect = (qIdx: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIdx]: optionIdx,
    }));
  };

  const isAllAnswered = questions.every((_, i) => selectedAnswers[i] !== undefined);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAllAnswered || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const answersArray = questions.map((_, i) => selectedAnswers[i]);
      const res = await onSubmitAnswers(answersArray);
      setTestScore(res.score);
      if (typeof res.delta === 'number') {
        setScoreDelta(res.delta);
      }
      setIsSubmitted(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="inline-block rounded-full bg-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wider mb-1">
            {testType === 'pre' ? 'Step 1: Baseline Pre-Test' : 'Step 3: Conceptual Post-Test'}
          </span>
          <h2 className="text-base font-bold text-white">{title}</h2>
        </div>
        <div className="text-right">
          <span className="text-xs font-mono text-slate-400">
            {Object.keys(selectedAnswers).length}/{questions.length} Answered
          </span>
        </div>
      </div>

      {/* Outcome Banner if Submitted */}
      {isSubmitted && (
        <div
          className={`mt-4 rounded-xl border p-4 text-center ${
            testType === 'post' && (scoreDelta ?? 0) > 0
              ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-200'
              : 'border-cyan-500/40 bg-cyan-950/20 text-cyan-200'
          }`}
        >
          <Award className="mx-auto h-7 w-7 mb-1.5" />
          <h3 className="text-sm font-bold">
            {testType === 'pre' ? 'Baseline Assessment Completed' : 'Post-Test Assessment Completed!'}
          </h3>
          <p className="text-xs mt-1">
            Score: <span className="font-bold">{testScore} / {questions.length}</span> correct
            {testType === 'post' && typeof preTestScore === 'number' && (
              <span className="ml-2 font-mono font-bold">
                (Pre-test: {preTestScore}/{questions.length} | Learning Gain Delta:{' '}
                <span className={scoreDelta! >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
                  {scoreDelta! > 0 ? `+${scoreDelta}` : scoreDelta}
                </span>)
              </span>
            )}
          </p>
        </div>
      )}

      {/* Questions List */}
      <form onSubmit={handleSubmit} className="mt-4 space-y-5">
        {questions.map((q, qIdx) => {
          const isSelected = selectedAnswers[qIdx] !== undefined;

          return (
            <div
              key={q.id || qIdx}
              className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 space-y-3"
            >
              <div className="flex items-start gap-2">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-800 text-[10px] font-bold text-cyan-300">
                  {qIdx + 1}
                </span>
                <p className="text-xs font-medium text-slate-200 leading-relaxed">
                  {q.question}
                </p>
              </div>

              <div className="space-y-1.5 pl-7">
                {q.options.map((opt, optIdx) => {
                  const isChecked = selectedAnswers[qIdx] === optIdx;
                  const isCorrectChoice = optIdx === q.correctIndex;

                  let borderClass = 'border-slate-800 hover:border-slate-700 bg-slate-950/60';
                  if (isChecked && !isSubmitted) {
                    borderClass = 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200';
                  } else if (isSubmitted) {
                    if (isCorrectChoice) {
                      borderClass = 'border-emerald-500/60 bg-emerald-950/30 text-emerald-200 font-semibold';
                    } else if (isChecked && !isCorrectChoice) {
                      borderClass = 'border-red-500/60 bg-red-950/30 text-red-300';
                    }
                  }

                  return (
                    <div
                      key={optIdx}
                      onClick={() => handleOptionSelect(qIdx, optIdx)}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-2.5 text-xs transition-all ${borderClass} ${
                        isSubmitted ? 'cursor-default' : ''
                      }`}
                    >
                      <span>{opt}</span>
                      {isChecked && <div className="h-2 w-2 rounded-full bg-cyan-400" />}
                    </div>
                  );
                })}
              </div>

              {/* Explanations shown after submit */}
              {isSubmitted && q.explanation && (
                <div className="mt-2 pl-7 text-[11px] text-slate-400 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800">
                  <span className="font-semibold text-cyan-300">Explanation:</span> {q.explanation}
                </div>
              )}
            </div>
          );
        })}

        <div className="flex items-center justify-end pt-3 border-t border-slate-800">
          {!isSubmitted ? (
            <button
              type="submit"
              disabled={!isAllAnswered || isSubmitting}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-5 py-2 text-xs font-bold text-cyan-200 shadow-md hover:bg-cyan-600/50 transition-all disabled:opacity-40"
            >
              {isSubmitting ? 'Evaluating...' : 'Submit Answers'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onProceedToNextStep}
              className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/40 px-5 py-2 text-xs font-bold text-cyan-100 hover:bg-cyan-600/60 transition-colors shadow-lg"
            >
              <span>{testType === 'pre' ? 'Proceed to Visual Exploration' : 'Provide Feedback & Complete'}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

