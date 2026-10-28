'use client';

import React, { useState } from 'react';
import { LearningRoom } from '@/types/collaboration';
import { ShieldAlert, Lock, Unlock, Radio, MessageSquare, Sparkles, CheckCircle2 } from 'lucide-react';

interface InstructorControlsPanelProps {
  room: LearningRoom;
  onUpdateSettings: (
    settings: any,
    conceptBroadcast?: { conceptId: string; conceptTitle: string }
  ) => Promise<void>;
}

const AVAILABLE_CONCEPTS = [
  { id: 'pendulum-nonlinear', title: 'Nonlinear Pendulum & Phase Space' },
  { id: 'simple-harmonic-motion', title: 'Simple Harmonic Motion & Small Angles' },
  { id: 'damped-oscillations', title: 'Damped Oscillations & Energy Dissipation' },
  { id: 'resonance-dynamics', title: 'Resonance Dynamics & Driven Oscillators' },
  { id: 'phase-space-attractors', title: 'Phase Space Trajectories & Limit Cycles' },
];

export const InstructorControlsPanel: React.FC<InstructorControlsPanelProps> = ({
  room,
  onUpdateSettings,
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState(room.activeConceptId || AVAILABLE_CONCEPTS[0].id);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  const toggleSetting = async (key: string, value: boolean) => {
    setIsUpdating(true);
    try {
      await onUpdateSettings({ [key]: value });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleBroadcastConcept = async () => {
    const concept = AVAILABLE_CONCEPTS.find((c) => c.id === selectedConcept);
    if (!concept) return;

    setIsUpdating(true);
    try {
      await onUpdateSettings({}, { conceptId: concept.id, conceptTitle: concept.title });
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 2000);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-xl border border-purple-500/30 bg-purple-950/20 p-4 backdrop-blur-md">
      <div className="flex items-center gap-2 pb-3 border-b border-purple-500/20">
        <ShieldAlert className="h-4 w-4 text-purple-400" />
        <h3 className="text-xs font-bold uppercase tracking-wider text-purple-300">
          Instructor Demonstration Authority
        </h3>
      </div>

      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Toggle Board Lock */}
        <button
          onClick={() => toggleSetting('isBoardLocked', !room.settings.isBoardLocked)}
          disabled={isUpdating}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
            room.settings.isBoardLocked
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.1)]'
              : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="text-xs font-semibold">Board Editing</div>
            <div className="text-[10px] text-slate-400">
              {room.settings.isBoardLocked ? 'Locked to students' : 'Open to everyone'}
            </div>
          </div>
          {room.settings.isBoardLocked ? (
            <Lock className="h-4 w-4 text-amber-400" />
          ) : (
            <Unlock className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {/* Toggle Simulation Lock */}
        <button
          onClick={() => toggleSetting('isSimulationLocked', !room.settings.isSimulationLocked)}
          disabled={isUpdating}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
            room.settings.isSimulationLocked
              ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
              : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="text-xs font-semibold">Simulation Control</div>
            <div className="text-[10px] text-slate-400">
              {room.settings.isSimulationLocked ? 'Instructor only' : 'Shared control'}
            </div>
          </div>
          {room.settings.isSimulationLocked ? (
            <Lock className="h-4 w-4 text-cyan-400" />
          ) : (
            <Unlock className="h-4 w-4 text-slate-500" />
          )}
        </button>

        {/* Toggle Demo Mode */}
        <button
          onClick={() =>
            toggleSetting(
              'instructorDemonstrationMode',
              !room.settings.instructorDemonstrationMode
            )
          }
          disabled={isUpdating}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
            room.settings.instructorDemonstrationMode
              ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 shadow-[0_0_10px_rgba(168,85,247,0.1)]'
              : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
          }`}
        >
          <div>
            <div className="text-xs font-semibold">Demonstration Mode</div>
            <div className="text-[10px] text-slate-400">
              {room.settings.instructorDemonstrationMode ? 'Active HUD glow' : 'Standard'}
            </div>
          </div>
          <Sparkles
            className={`h-4 w-4 ${
              room.settings.instructorDemonstrationMode
                ? 'text-purple-400'
                : 'text-slate-500'
            }`}
          />
        </button>

        {/* Toggle Chat */}
        <button
          onClick={() =>
            toggleSetting('allowParticipantChat', !room.settings.allowParticipantChat)
          }
          disabled={isUpdating}
          className={`flex items-center justify-between rounded-lg border p-3 text-left transition-all ${
            room.settings.allowParticipantChat
              ? 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-700'
              : 'border-red-500/40 bg-red-500/10 text-red-300'
          }`}
        >
          <div>
            <div className="text-xs font-semibold">Participant Chat</div>
            <div className="text-[10px] text-slate-400">
              {room.settings.allowParticipantChat ? 'Enabled' : 'Muted'}
            </div>
          </div>
          <MessageSquare
            className={`h-4 w-4 ${
              room.settings.allowParticipantChat ? 'text-emerald-400' : 'text-red-400'
            }`}
          />
        </button>
      </div>

      {/* Concept Broadcast Selector */}
      <div className="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-purple-500/20">
        <span className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <Radio className="h-3.5 w-3.5 text-purple-400" /> Broadcast Concept Focus:
        </span>
        <select
          value={selectedConcept}
          onChange={(e) => setSelectedConcept(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs text-slate-200 focus:border-purple-400 focus:outline-none"
        >
          {AVAILABLE_CONCEPTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.title}
            </option>
          ))}
        </select>
        <button
          onClick={handleBroadcastConcept}
          disabled={isUpdating}
          className="flex items-center gap-1.5 rounded-lg border border-purple-500/40 bg-purple-600/30 px-3 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-600/50 transition-colors shadow-sm"
        >
          {broadcastSuccess ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Broadcasted!
            </>
          ) : (
            <>
              <Radio className="h-3.5 w-3.5" /> Broadcast to Room
            </>
          )}
        </button>
      </div>
    </div>
  );
};

