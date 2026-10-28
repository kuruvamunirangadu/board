'use client';

import React, { useState } from 'react';
import { Shield, Check, Lock, Info, Sparkles } from 'lucide-react';

interface BetaConsentModalProps {
  onConsentGiven: (participantCode: string, ageConfirmed: boolean) => void;
  onDecline: () => void;
}

export const BetaConsentModal: React.FC<BetaConsentModalProps> = ({
  onConsentGiven,
  onDecline,
}) => {
  const [participantCode, setParticipantCode] = useState(() => {
    return `P-${Math.floor(100 + Math.random() * 900)}`;
  });
  const [ageConfirmed, setAgeConfirmed] = useState(true);
  const [understoodVoluntary, setUnderstoodVoluntary] = useState(true);

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!participantCode.trim() || !ageConfirmed || !understoodVoluntary) return;
    onConsentGiven(participantCode.trim(), ageConfirmed);
  };

  return (
    <div className="flex min-h-[480px] w-full max-w-lg flex-col rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Shield className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            VisiOS Pilot Evaluation & Informed Consent
          </h2>
          <p className="text-xs text-slate-400">
            Formative usability and learning effectiveness pilot study.
          </p>
        </div>
      </div>

      <form onSubmit={handleConfirm} className="mt-4 flex flex-1 flex-col space-y-4">
        <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3.5 space-y-2 text-xs text-slate-300">
          <div className="font-semibold text-cyan-300 flex items-center gap-1.5">
            <Info className="h-4 w-4 text-cyan-400" /> Study Information & Privacy Protocol:
          </div>
          <ul className="space-y-1.5 list-disc list-inside text-[11px] text-slate-400 leading-relaxed">
            <li>
              <strong>Purpose</strong>: Evaluate if interactive visualizations and simulations clarify difficult concepts.
            </li>
            <li>
              <strong>Zero PII Collected</strong>: You are assigned a random pseudonymous code (<span className="font-mono text-cyan-300">{participantCode}</span>). No names, emails, or personal identifiers are collected.
            </li>
            <li>
              <strong>Voluntary Participation</strong>: You may exit at any time. You can request deletion of all your responses with one click.
            </li>
          </ul>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-300 mb-1">
            Your Pseudonymous Participant Code:
          </label>
          <input
            type="text"
            value={participantCode}
            onChange={(e) => setParticipantCode(e.target.value.toUpperCase())}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-mono text-cyan-200 uppercase tracking-widest focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="space-y-2 pt-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={ageConfirmed}
              onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="rounded accent-cyan-400 h-4 w-4"
            />
            <span>I confirm I am 18 years or older (or have parent/guardian consent).</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={understoodVoluntary}
              onChange={(e) => setUnderstoodVoluntary(e.target.checked)}
              className="rounded accent-cyan-400 h-4 w-4"
            />
            <span>I understand participation is voluntary and all data is pseudonymous.</span>
          </label>
        </div>

        <div className="mt-auto flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={onDecline}
            className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition-colors"
          >
            Decline & Return
          </button>

          <button
            type="submit"
            disabled={!ageConfirmed || !understoodVoluntary || !participantCode.trim()}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-5 py-2 text-xs font-bold text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:bg-cyan-600/50 transition-all disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Accept & Begin Beta Task
          </button>
        </div>
      </form>
    </div>
  );
};

