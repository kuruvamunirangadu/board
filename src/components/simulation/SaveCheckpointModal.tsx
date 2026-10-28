'use client';

import React, { useState } from 'react';
import { BookmarkPlus, X, Check, Activity, Sliders } from 'lucide-react';
import { PendulumParams, PendulumSimulationState } from '@/types/simulation';
import { MetricDefinition } from '@/types/session';
import { sessionPersistence } from '@/lib/persistence';

interface SaveCheckpointModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  params: PendulumParams;
  state: PendulumSimulationState;
  onSaved?: () => void;
  isImmersive?: boolean;
}

export const SaveCheckpointModal: React.FC<SaveCheckpointModalProps> = ({
  isOpen,
  onClose,
  sessionId,
  params,
  state,
  onSaved,
  isImmersive = false,
}) => {
  const [name, setName] = useState(
    `Experiment @ ${params.gravity} m/s², L=${params.length}m`
  );
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const frequency = state.period > 0 ? Number((1 / state.period).toFixed(3)) : 0;
  const maxKineticEnergy = Number(state.totalEnergy.toFixed(2));

  const definitions: Record<string, MetricDefinition> = {
    gravity: { label: 'Gravitational Field (g)', unit: 'm/s²' },
    length: { label: 'Pendulum Length (L)', unit: 'm' },
    damping: { label: 'Damping Coefficient (b)', unit: 'N·s/m' },
    initialAngle: { label: 'Initial Release Angle (θ₀)', unit: '°' },
    period: { label: 'Oscillation Period (T)', unit: 's' },
    frequency: { label: 'Oscillation Frequency (f)', unit: 'Hz' },
    totalEnergy: { label: 'Total Mechanical Energy (E)', unit: 'J' },
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      await sessionPersistence.saveCheckpoint(sessionId, {
        sessionId,
        name: name.trim(),
        simulationType: 'pendulum',
        version: '1.0.0',
        parameters: {
          gravity: params.gravity,
          length: params.length,
          damping: params.damping,
          initialAngle: params.initialAngle,
        },
        metrics: {
          period: Number(state.period.toFixed(3)),
          frequency,
          totalEnergy: maxKineticEnergy,
        },
        definitions,
        notes: notes.trim() || undefined,
      });

      // Record continuity activity
      await sessionPersistence.recordLearningActivity(sessionId, {
        sessionId,
        activityType: 'simulation_experiment',
        title: `Saved Experiment: ${name.trim()}`,
        metadata: {
          experimentName: name.trim(),
          simulationType: 'pendulum',
          details: `g=${params.gravity} m/s², L=${params.length}m, T=${state.period.toFixed(2)}s`,
        },
      });

      if (onSaved) onSaved();
      onClose();
    } catch (err) {
      console.error('Failed to save experiment checkpoint', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-2xl p-6 shadow-2xl border transition-all ${
          isImmersive
            ? 'bg-slate-900/95 border-cyan-500/40 text-slate-100 shadow-cyan-950/60'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <BookmarkPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm">Save Experiment Checkpoint</h3>
              <p className="text-[11px] text-slate-400">Record current simulation parameters and outputs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Checkpoint Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Moon Low-G Experiment"
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Observations / Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Tested restoring acceleration at high amplitude; period matches T = 2π√(L/g)."
              rows={2}
              className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          {/* Telemetry Preview Grid */}
          <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 text-xs space-y-2">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-medium text-[11px]">
              <Activity className="w-3.5 h-3.5" />
              <span>Snapshot Telemetry to Record</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Gravity (g)</span>
                <span className="font-mono text-cyan-300 font-semibold">{params.gravity} m/s²</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Length (L)</span>
                <span className="font-mono text-cyan-300 font-semibold">{params.length} m</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Period (T)</span>
                <span className="font-mono text-emerald-400 font-semibold">{state.period.toFixed(2)} s</span>
              </div>
              <div className="p-1.5 rounded bg-slate-900/60 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">Frequency (f)</span>
                <span className="font-mono text-emerald-400 font-semibold">{frequency} Hz</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || !name.trim()}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-900/40 transition-all disabled:opacity-50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Checkpoint'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

