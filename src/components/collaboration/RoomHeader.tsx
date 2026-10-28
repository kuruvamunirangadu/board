'use client';

import React, { useState } from 'react';
import { LearningRoom, Participant } from '@/types/collaboration';
import { Copy, Check, Users, Radio, Lock, LogOut, Sparkles } from 'lucide-react';

interface RoomHeaderProps {
  room: LearningRoom;
  participant: Participant;
  isConnected: boolean;
  onLeave: () => void;
}

export const RoomHeader: React.FC<RoomHeaderProps> = ({
  room,
  participant,
  isConnected,
  onLeave,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isHost = participant.role === 'host' || participant.role === 'instructor';

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-cyan-500/20 bg-slate-950/80 px-6 py-3 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20 animate-pulse" />
            <h1 className="text-lg font-bold tracking-wide text-white">{room.title}</h1>
            {room.settings.instructorDemonstrationMode && (
              <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-xs font-semibold text-purple-300">
                <Sparkles className="h-3 w-3 text-purple-400" /> Demo Mode
              </span>
            )}
            {room.settings.isBoardLocked && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-300">
                <Lock className="h-3 w-3 text-amber-400" /> Board Locked
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
            {room.activeConceptTitle && (
              <span className="flex items-center gap-1 text-cyan-400 font-medium">
                <Radio className="h-3 w-3 animate-ping" /> Focus Topic: {room.activeConceptTitle}
              </span>
            )}
            <span>•</span>
            <span>Subject: <span className="text-slate-300 capitalize">{room.subjectId || 'Physics'}</span></span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Room Code Pill with Copy */}
        <div className="flex items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-950/40 px-3 py-1.5 shadow-[0_0_15px_rgba(6,182,212,0.15)]">
          <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">Room Code:</span>
          <span className="font-mono text-sm font-bold text-cyan-200">{room.code}</span>
          <button
            onClick={handleCopyCode}
            className="ml-1 rounded p-1 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-200 transition-colors"
            title="Copy room code"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>

        {/* User Badge */}
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/60 px-3 py-1.5">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: participant.color || '#06b6d4' }}
          />
          <span className="text-xs font-medium text-slate-200">{participant.name}</span>
          <span
            className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              isHost
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            {participant.role}
          </span>
        </div>

        {/* Leave Room Button */}
        <button
          onClick={onLeave}
          className="flex items-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" />
          Leave
        </button>
      </div>
    </header>
  );
};

