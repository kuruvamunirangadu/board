'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Send, CheckCircle2, AlertTriangle } from 'lucide-react';

interface BetaFeedbackModalProps {
  sessionId: string;
  participantCode: string;
  taskId: string;
  onSubmitFeedback: (data: {
    sessionId: string;
    participantCode: string;
    taskId: string;
    understandingGoal: string;
    helpfulAspect: string;
    confusingAspect: string;
    visualizationRating: number;
    encounteredError: boolean;
    errorDescription?: string;
    suggestedImprovement: string;
  }) => Promise<void>;
  onFinish: () => void;
}

export const BetaFeedbackModal: React.FC<BetaFeedbackModalProps> = ({
  sessionId,
  participantCode,
  taskId,
  onSubmitFeedback,
  onFinish,
}) => {
  const [understandingGoal, setUnderstandingGoal] = useState('');
  const [helpfulAspect, setHelpfulAspect] = useState('');
  const [confusingAspect, setConfusingAspect] = useState('');
  const [rating, setRating] = useState(5);
  const [encounteredError, setEncounteredError] = useState(false);
  const [errorDesc, setErrorDesc] = useState('');
  const [suggestedImprovement, setSuggestedImprovement] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!helpfulAspect.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmitFeedback({
        sessionId,
        participantCode,
        taskId,
        understandingGoal: understandingGoal.trim() || 'Conceptual exploration',
        helpfulAspect: helpfulAspect.trim(),
        confusingAspect: confusingAspect.trim() || 'None',
        visualizationRating: rating,
        encounteredError,
        errorDescription: encounteredError ? errorDesc.trim() : undefined,
        suggestedImprovement: suggestedImprovement.trim() || 'None',
      });
      setIsDone(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) {
    return (
      <div className="flex min-h-[350px] w-full max-w-lg flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-slate-950/90 p-6 text-center shadow-2xl backdrop-blur-xl">
        <CheckCircle2 className="h-12 w-12 text-emerald-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Thank You for Your Feedback!</h2>
        <p className="mt-1 text-xs text-slate-400 max-w-sm">
          Your responses provide genuine evidence for refining VisiOS visual learning tools and simulations.
        </p>
        <button
          onClick={onFinish}
          className="mt-6 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-6 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-600/50 transition-colors shadow-sm"
        >
          Return to Study Portal
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-2xl backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-slate-800 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400">
          <MessageSquare className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-white">Student Feedback & Usability Review</h2>
          <p className="text-[11px] text-slate-400">
            Participant: <span className="font-mono text-cyan-300">{participantCode}</span> (Session: {sessionId.slice(0, 15)}...)
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
        <div>
          <label className="block text-slate-300 font-medium mb-1">
            1. Which part of the visualization or simulation helped your understanding most? <span className="text-cyan-400">*</span>
          </label>
          <textarea
            rows={2}
            required
            value={helpfulAspect}
            onChange={(e) => setHelpfulAspect(e.target.value)}
            placeholder="e.g. Seeing the phase space spiral shrink as damping was increased..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">
            2. Which part, if any, was confusing or difficult to navigate?
          </label>
          <textarea
            rows={2}
            value={confusingAspect}
            onChange={(e) => setConfusingAspect(e.target.value)}
            placeholder="e.g. Navigating between formula controls and wave charts..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        {/* 5-Star Rating */}
        <div>
          <label className="block text-slate-300 font-medium mb-1">
            3. Overall Interactive Visualization Effectiveness:
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="p-1 text-slate-600 hover:text-amber-400 transition-colors"
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-700'
                  }`}
                />
              </button>
            ))}
            <span className="font-mono text-slate-400 text-xs ml-2">({rating}/5 stars)</span>
          </div>
        </div>

        {/* Bug / Error Encountered */}
        <div className="pt-1">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={encounteredError}
              onChange={(e) => setEncounteredError(e.target.checked)}
              className="rounded accent-red-400 h-3.5 w-3.5"
            />
            <span className="text-[11px]">I encountered a technical glitch or rendering error during the task</span>
          </label>

          {encounteredError && (
            <input
              type="text"
              value={errorDesc}
              onChange={(e) => setErrorDesc(e.target.value)}
              placeholder="Describe what happened..."
              className="mt-1.5 w-full rounded-lg border border-red-500/40 bg-slate-900 p-2 text-xs text-red-200 placeholder-slate-600 focus:border-red-400 focus:outline-none"
            />
          )}
        </div>

        <div>
          <label className="block text-slate-300 font-medium mb-1">
            4. What single improvement should we prioritize next?
          </label>
          <input
            type="text"
            value={suggestedImprovement}
            onChange={(e) => setSuggestedImprovement(e.target.value)}
            placeholder="e.g. Add side-by-side comparison with theoretical period formula..."
            className="w-full rounded-lg border border-slate-700 bg-slate-900 p-2 text-xs text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={!helpfulAspect.trim() || isSubmitting}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-5 py-2 text-xs font-bold text-cyan-200 shadow-md hover:bg-cyan-600/50 transition-all disabled:opacity-40"
          >
            <Send className="h-3.5 w-3.5" />
            {isSubmitting ? 'Submitting...' : 'Submit Beta Review'}
          </button>
        </div>
      </form>
    </div>
  );
};

