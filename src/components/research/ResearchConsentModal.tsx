'use client';

import React, { useState } from 'react';
import { ExperimentProtocol, StudyCondition } from '@/types/research';

interface Props {
  protocol: ExperimentProtocol;
  isOpen: boolean;
  onConsent: (participantCode: string, forcedCondition?: StudyCondition) => void;
  onCancel: () => void;
}

export const ResearchConsentModal: React.FC<Props> = ({
  protocol,
  isOpen,
  onConsent,
  onCancel,
}) => {
  const [participantCode, setParticipantCode] = useState(
    () => `R-${Math.floor(100 + Math.random() * 900)}`
  );
  const [forcedCondition, setForcedCondition] = useState<StudyCondition | 'auto'>('auto');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [understoodPrivacy, setUnderstoodPrivacy] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedToTerms || !understoodPrivacy || !participantCode.trim()) return;
    onConsent(
      participantCode.trim().toUpperCase(),
      forcedCondition === 'auto' ? undefined : forcedCondition
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-slate-700 bg-slate-900 p-6 text-slate-100 shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <span className="inline-flex items-center rounded-md bg-indigo-900/60 px-2 py-0.5 text-xs font-semibold text-indigo-300 border border-indigo-700/50">
              VisiOS Research Protocol #{protocol.experimentId}
            </span>
            <h2 className="mt-2 text-xl font-bold text-white">{protocol.title}</h2>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5 text-sm text-slate-300">
          {/* Research Objective */}
          <div className="rounded-lg bg-slate-800/60 p-4 border border-slate-700/50">
            <h3 className="font-semibold text-white mb-1">Study Objective & Research Question</h3>
            <p className="text-slate-300 text-xs leading-relaxed">{protocol.researchQuestion}</p>
            <div className="mt-3 text-xs text-slate-400">
              <span className="font-medium text-slate-300">Hypothesis:</span> {protocol.hypothesis}
            </div>
          </div>

          {/* Privacy & Zero PII */}
          <div className="rounded-lg bg-emerald-950/40 p-4 border border-emerald-800/40">
            <h4 className="font-semibold text-emerald-300 mb-1 flex items-center gap-1.5">
              <span>🛡️</span> Zero-PII & Privacy Protection
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-xs text-emerald-200/90">
              <li>No personal information (names, emails, IP addresses) is recorded or stored.</li>
              <li>You are identified solely by a pseudonymous code (e.g. {participantCode}).</li>
              <li>You may request complete data deletion at any time using your code.</li>
              <li>Only objective diagnostic answers, score deltas, and timestamped events are logged.</li>
            </ul>
          </div>

          {/* Protocol Details */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
              <div className="text-slate-400">Estimated Duration</div>
              <div className="font-medium text-white">{protocol.targetDurationMinutes} Minutes</div>
            </div>
            <div className="p-3 bg-slate-800/40 rounded-lg border border-slate-800">
              <div className="text-slate-400">Study Conditions</div>
              <div className="font-medium text-white">Adaptive AI vs Fixed Control</div>
            </div>
          </div>

          {/* Participant ID & Assignment Mode */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Pseudonymous Participant Code
              </label>
              <input
                type="text"
                value={participantCode}
                onChange={(e) => setParticipantCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white font-mono text-sm focus:border-indigo-500 focus:outline-none"
                placeholder="R-101"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Condition Allocation
              </label>
              <select
                value={forcedCondition}
                onChange={(e) => setForcedCondition(e.target.value as any)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white text-sm focus:border-indigo-500 focus:outline-none"
              >
                <option value="auto">Auto-Balanced (Standard)</option>
                <option value="adaptive_intervention">Condition A (Adaptive Intervention)</option>
                <option value="fixed_sequence">Condition B (Fixed Sequence Control)</option>
              </select>
            </div>
          </div>

          {/* Consent Checkboxes */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300">
                I volunteer to participate in this educational research experiment and understand I can withdraw at any time.
              </span>
            </label>

            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={understoodPrivacy}
                onChange={(e) => setUnderstoodPrivacy(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-xs text-slate-300">
                I understand that only anonymous response performance is logged, with full right-to-erasure on demand.
              </span>
            </label>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!agreedToTerms || !understoodPrivacy || !participantCode.trim()}
              className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Begin Research Session →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

