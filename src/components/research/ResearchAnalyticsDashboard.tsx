'use client';

import React, { useState, useEffect } from 'react';
import {
  ExperimentProtocol,
  ExperimentEvaluationReport,
} from '@/types/research';

interface Props {
  protocols: ExperimentProtocol[];
}

export const ResearchAnalyticsDashboard: React.FC<Props> = ({ protocols }) => {
  const [selectedExperimentId, setSelectedExperimentId] = useState<string>(
    protocols[0]?.experimentId || 'exp-phys-pendulum'
  );
  const [report, setReport] = useState<ExperimentEvaluationReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [purgeCode, setPurgeCode] = useState('');
  const [purgeStatus, setPurgeStatus] = useState<string | null>(null);

  const fetchReport = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`/api/research?action=report&experimentId=${selectedExperimentId}`);
      const data = await res.json();
      if (data.success) {
        setReport(data.report);
      }
    } catch (err) {
      console.error('Failed to load research report', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedExperimentId]);

  const handlePurgeParticipant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purgeCode.trim()) return;
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'delete_participant',
          participantCode: purgeCode.trim().toUpperCase(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setPurgeStatus(`Successfully purged ${data.deletedSessions} session(s) for code ${purgeCode.toUpperCase()}`);
        setPurgeCode('');
        fetchReport();
      }
    } catch (err) {
      setPurgeStatus('Failed to delete participant data');
    }
  };

  const currentProtocol = protocols.find((p) => p.experimentId === selectedExperimentId);

  return (
    <div className="space-y-6">
      {/* Header & Experiment Selector */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 backdrop-blur-md">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Research Intelligence
          </span>
          <h2 className="text-lg font-bold text-white">Controlled Empirical Evaluation Report</h2>
          <p className="mt-1 text-xs text-slate-400">
            Comparative analysis between Condition A (Adaptive Visual) and Condition B (Fixed Sequence).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedExperimentId}
            onChange={(e) => setSelectedExperimentId(e.target.value)}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            {protocols.map((p) => (
              <option key={p.experimentId} value={p.experimentId}>
                {p.title}
              </option>
            ))}
          </select>

          <button
            onClick={fetchReport}
            className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition-colors"
          >
            🔄 Refresh Metrics
          </button>
        </div>
      </div>

      {report ? (
        <div className="space-y-6">
          {/* Sample Size & Cohort Status */}
          <div className="grid grid-cols-5 gap-4">
            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs text-slate-400">Total Consented</span>
              <div className="mt-1 text-2xl font-bold text-white">
                {report.sampleSize.totalConsented}
              </div>
              <span className="text-[11px] text-slate-500">
                Target: N={currentProtocol?.plannedSampleSize || 30}
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs text-slate-400">Completed Trials</span>
              <div className="mt-1 text-2xl font-bold text-emerald-400">
                {report.sampleSize.totalCompleted}
              </div>
              <span className="text-[11px] text-slate-500">
                {(report.sampleSize.totalConsented > 0
                  ? (report.sampleSize.totalCompleted / report.sampleSize.totalConsented) * 100
                  : 0
                ).toFixed(0)}
                % completion rate
              </span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs text-slate-400">Condition A (Adaptive)</span>
              <div className="mt-1 text-2xl font-bold text-indigo-400">
                {report.sampleSize.adaptiveCompleted}
              </div>
              <span className="text-[11px] text-slate-500">Completed Sessions</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs text-slate-400">Condition B (Control)</span>
              <div className="mt-1 text-2xl font-bold text-purple-400">
                {report.sampleSize.fixedCompleted}
              </div>
              <span className="text-[11px] text-slate-500">Completed Sessions</span>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <span className="text-xs text-slate-400">Cohen’s d Effect Size</span>
              <div className="mt-1 text-2xl font-bold text-amber-400">
                {report.learningOutcomes.effectSizeCohenD > 0
                  ? `+${report.learningOutcomes.effectSizeCohenD}`
                  : report.learningOutcomes.effectSizeCohenD}
              </div>
              <span className="text-[11px] text-slate-500">
                {Math.abs(report.learningOutcomes.effectSizeCohenD) >= 0.8
                  ? 'Large Effect'
                  : Math.abs(report.learningOutcomes.effectSizeCohenD) >= 0.5
                  ? 'Medium Effect'
                  : 'Small/Preliminary'}
              </span>
            </div>
          </div>

          {/* Comparative Learning Outcome Table */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
            <h3 className="text-sm font-semibold text-white">
              Comparative Learning Outcomes: Adaptive vs Fixed Sequence
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-slate-400">
                  <tr>
                    <th className="p-3">Condition</th>
                    <th className="p-3">Sample (N)</th>
                    <th className="p-3">Mean Pre-Test (SD)</th>
                    <th className="p-3">Mean Post-Test (SD)</th>
                    <th className="p-3">Mean Gain Δ (SD)</th>
                    <th className="p-3">Normalized Gain (g)</th>
                    <th className="p-3">Mean Clarity (1-5★)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-sans font-medium text-indigo-300">
                      Condition A (Adaptive Visual)
                    </td>
                    <td className="p-3">{report.sampleSize.adaptiveCompleted}</td>
                    <td className="p-3">
                      {report.learningOutcomes.adaptive.meanPreScore}% (±
                      {report.learningOutcomes.adaptive.preStdDev})
                    </td>
                    <td className="p-3">
                      {report.learningOutcomes.adaptive.meanPostScore}% (±
                      {report.learningOutcomes.adaptive.postStdDev})
                    </td>
                    <td className="p-3 font-bold text-emerald-400">
                      +{report.learningOutcomes.adaptive.meanGainDelta}% (±
                      {report.learningOutcomes.adaptive.gainStdDev})
                    </td>
                    <td className="p-3 font-bold text-indigo-300">
                      {report.learningOutcomes.adaptive.meanNormalizedGain}
                    </td>
                    <td className="p-3 text-amber-300">
                      {report.engagementAndEfficiency.adaptiveMeanClarityRating} ★
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-800/30">
                    <td className="p-3 font-sans font-medium text-purple-300">
                      Condition B (Fixed Sequence)
                    </td>
                    <td className="p-3">{report.sampleSize.fixedCompleted}</td>
                    <td className="p-3">
                      {report.learningOutcomes.control.meanPreScore}% (±
                      {report.learningOutcomes.control.preStdDev})
                    </td>
                    <td className="p-3">
                      {report.learningOutcomes.control.meanPostScore}% (±
                      {report.learningOutcomes.control.postStdDev})
                    </td>
                    <td className="p-3 font-bold text-slate-300">
                      +{report.learningOutcomes.control.meanGainDelta}% (±
                      {report.learningOutcomes.control.gainStdDev})
                    </td>
                    <td className="p-3 font-bold text-purple-300">
                      {report.learningOutcomes.control.meanNormalizedGain}
                    </td>
                    <td className="p-3 text-amber-300">
                      {report.engagementAndEfficiency.controlMeanClarityRating} ★
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Misconception Diagnostic & Remediation Resolution */}
          <div className="grid grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">
                Detected Misconceptions & Remediation Rates
              </h3>
              {report.misconceptionsDetected.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No diagnostic misconceptions logged in current session sample.
                </p>
              ) : (
                <div className="space-y-3">
                  {report.misconceptionsDetected.map((m) => (
                    <div
                      key={m.misconceptionId}
                      className="rounded-lg border border-slate-800 bg-slate-950/60 p-3 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{m.name}</span>
                        <span className="font-mono text-slate-400">Freq: {m.frequencyCount}</span>
                      </div>
                      <div className="flex items-center justify-between text-slate-400">
                        <span>Post-Remediation Resolution:</span>
                        <strong className="text-emerald-400 font-mono">
                          {m.remediationSuccessRate}% resolved
                        </strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Adaptation Rule Usage Frequency */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-4">
              <h3 className="text-sm font-semibold text-white">Adaptation Rules Fired</h3>
              {Object.keys(report.adaptationRuleFrequencies).length === 0 ? (
                <p className="text-xs text-slate-500">
                  No adaptive interventions triggered yet in current session sample.
                </p>
              ) : (
                <div className="space-y-2">
                  {Object.entries(report.adaptationRuleFrequencies).map(([rule, count]) => (
                    <div
                      key={rule}
                      className="flex items-center justify-between rounded-lg bg-slate-950/60 p-2.5 text-xs font-mono border border-slate-800"
                    >
                      <span className="text-indigo-300">{rule}</span>
                      <span className="rounded bg-indigo-950 px-2 py-0.5 text-indigo-400 font-bold">
                        {count}×
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Research Limitations & Methodological Validity */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 p-5 space-y-3 text-xs text-slate-300">
            <h4 className="font-semibold text-amber-300 flex items-center gap-1.5">
              <span>⚠️</span> Methodological Limitations & Validity Disclosures
            </h4>
            <ul className="list-disc pl-5 space-y-1 text-slate-400">
              {report.limitations.map((lim, i) => (
                <li key={i}>{lim}</li>
              ))}
            </ul>
          </div>

          {/* GDPR Right-to-Erasure Data Deletion Tool */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 space-y-3">
            <h3 className="text-sm font-semibold text-slate-200">
              Research Ethics: Participant Right-to-Erasure
            </h3>
            <p className="text-xs text-slate-400">
              Enter a pseudonymous participant code (e.g. <code>R-101</code>) to permanently erase all corresponding diagnostic logs and session records.
            </p>

            <form onSubmit={handlePurgeParticipant} className="flex gap-3 max-w-md">
              <input
                type="text"
                value={purgeCode}
                onChange={(e) => setPurgeCode(e.target.value)}
                placeholder="Participant Code (e.g. R-101)"
                className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-white focus:border-red-500 focus:outline-none"
              />
              <button
                type="submit"
                className="rounded-lg bg-red-600/80 px-4 py-2 text-xs font-semibold text-white hover:bg-red-500 transition-colors"
              >
                Purge Records
              </button>
            </form>

            {purgeStatus && (
              <div className="text-xs font-mono text-emerald-400 pt-1">{purgeStatus}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="p-8 text-center text-xs text-slate-500">Loading evaluation report...</div>
      )}
    </div>
  );
};

