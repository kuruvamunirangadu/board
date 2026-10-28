'use client';

import React from 'react';
import { Participant } from '@/types/collaboration';
import { Users, Shield, GraduationCap, Eye } from 'lucide-react';

interface ParticipantPresenceBarProps {
  participants: Participant[];
  currentParticipantId: string;
}

export const ParticipantPresenceBar: React.FC<ParticipantPresenceBarProps> = ({
  participants,
  currentParticipantId,
}) => {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'host':
      case 'instructor':
        return <Shield className="h-3 w-3 text-cyan-400" />;
      case 'participant':
        return <GraduationCap className="h-3 w-3 text-emerald-400" />;
      default:
        return <Eye className="h-3 w-3 text-slate-400" />;
    }
  };

  return (
    <aside className="flex flex-col border-r border-cyan-500/20 bg-slate-950/60 p-4 w-64 shrink-0 backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-cyan-400" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Active Learners ({participants.length})
          </h2>
        </div>
        <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
      </div>

      <div className="mt-4 flex-1 space-y-2 overflow-y-auto pr-1">
        {participants.map((p) => {
          const isSelf = p.id === currentParticipantId;
          const isOnline = p.status === 'connected';

          return (
            <div
              key={p.id}
              className={`flex items-center justify-between rounded-lg border p-2.5 transition-all ${
                isSelf
                  ? 'border-cyan-500/40 bg-cyan-950/20 shadow-[0_0_10px_rgba(6,182,212,0.1)]'
                  : 'border-slate-800/80 bg-slate-900/40 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative shrink-0">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-slate-950 shadow-sm"
                    style={{ backgroundColor: p.color || '#06b6d4' }}
                  >
                    {p.name.charAt(0).toUpperCase()}
                  </div>
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-slate-950 ${
                      isOnline ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="truncate text-xs font-semibold text-slate-200">
                      {p.name}
                    </p>
                    {isSelf && (
                      <span className="text-[10px] text-cyan-400 font-mono">(you)</span>
                    )}
                  </div>
                  <p className="flex items-center gap-1 text-[10px] text-slate-400 capitalize">
                    {getRoleIcon(p.role)}
                    <span>{p.role}</span>
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-slate-800 text-[11px] text-slate-500">
        <p>Real-time collaboration active.</p>
        <p className="text-cyan-500/70">Sync rate: ~1.2s authoritative</p>
      </div>
    </aside>
  );
};

