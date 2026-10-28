'use client';

import React, { useState, useEffect } from 'react';
import { LearningRoom, ParticipantRole } from '@/types/collaboration';
import { Users, Plus, LogIn, Sparkles, BookOpen, KeyRound, Radio } from 'lucide-react';

interface RoomLobbyModalProps {
  onCreateRoom: (
    title: string,
    hostName: string,
    options?: any
  ) => Promise<void>;
  onJoinRoom: (
    roomIdentifier: string,
    participantName: string,
    role: ParticipantRole
  ) => Promise<void>;
}

export const RoomLobbyModal: React.FC<RoomLobbyModalProps> = ({
  onCreateRoom,
  onJoinRoom,
}) => {
  const [tab, setTab] = useState<'join' | 'create'>('join');
  const [joinCode, setJoinCode] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [role, setRole] = useState<ParticipantRole>('participant');

  const [createTitle, setCreateTitle] = useState('Physics Lab: Nonlinear Pendulums');
  const [createHostName, setCreateHostName] = useState('Prof. Turing');
  const [createSubject, setCreateSubject] = useState('physics');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeRooms, setActiveRooms] = useState<LearningRoom[]>([]);

  useEffect(() => {
    // Fetch active rooms for quick join
    fetch('/api/collab?action=list_rooms')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.rooms) {
          setActiveRooms(data.rooms);
        }
      })
      .catch(() => {});
  }, []);

  const handleJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim() || !participantName.trim()) {
      setError('Please provide both a room code and your name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onJoinRoom(joinCode.trim(), participantName.trim(), role);
    } catch (err: any) {
      setError(err.message || 'Failed to join room');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim() || !createHostName.trim()) {
      setError('Please provide both a room title and your host name.');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await onCreateRoom(createTitle.trim(), createHostName.trim(), {
        subjectId: createSubject,
        activeConceptId: 'pendulum-nonlinear',
        activeConceptTitle: 'Nonlinear Pendulum & Phase Space',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to create room');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[550px] w-full max-w-xl flex-col rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-cyan-500/20 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-cyan-500/40 bg-cyan-950/60 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
          <Users className="h-5 w-5 text-cyan-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white tracking-wide">
            VisiOS Collaborative Learning Rooms
          </h2>
          <p className="text-xs text-slate-400">
            Join shared interactive workspaces, sync physics simulations, and learn together.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex rounded-lg border border-slate-800 bg-slate-900/60 p-1">
        <button
          onClick={() => {
            setTab('join');
            setError(null);
          }}
          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
            tab === 'join'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LogIn className="inline mr-1.5 h-3.5 w-3.5" /> Join Existing Room
        </button>
        <button
          onClick={() => {
            setTab('create');
            setError(null);
          }}
          className={`flex-1 rounded-md py-2 text-xs font-semibold transition-all ${
            tab === 'create'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Plus className="inline mr-1.5 h-3.5 w-3.5" /> Host New Room
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-lg border border-red-500/30 bg-red-500/10 p-2.5 text-xs text-red-300">
          {error}
        </div>
      )}

      {/* Form Content */}
      <div className="mt-4 flex-1">
        {tab === 'join' ? (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Room Code or Identifier
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. VIS-1010"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm font-mono text-cyan-200 uppercase tracking-widest placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
                />
                <KeyRound className="absolute right-3 top-2.5 h-4 w-4 text-slate-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Your Display Name
              </label>
              <input
                type="text"
                placeholder="e.g. Alex"
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Joining Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('participant')}
                  className={`rounded-lg border p-2 text-center text-xs transition-all ${
                    role === 'participant'
                      ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 font-semibold'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400'
                  }`}
                >
                  Student / Learner
                </button>
                <button
                  type="button"
                  onClick={() => setRole('instructor')}
                  className={`rounded-lg border p-2 text-center text-xs transition-all ${
                    role === 'instructor'
                      ? 'border-purple-500/40 bg-purple-500/10 text-purple-300 font-semibold'
                      : 'border-slate-800 bg-slate-900/40 text-slate-400'
                  }`}
                >
                  Instructor / Assistant
                </button>
              </div>
            </div>

            {/* Quick-Join Active Demo Rooms */}
            {activeRooms.length > 0 && (
              <div className="pt-2">
                <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block mb-2">
                  Active Rooms to Join:
                </span>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {activeRooms.map((r) => (
                    <div
                      key={r.id}
                      onClick={() => {
                        setJoinCode(r.code);
                        if (!participantName) setParticipantName('Learner');
                      }}
                      className="flex cursor-pointer items-center justify-between rounded-lg border border-slate-800 bg-slate-900/50 p-2 hover:border-cyan-500/40 hover:bg-cyan-950/20 transition-colors"
                    >
                      <div>
                        <div className="text-xs font-semibold text-slate-200">{r.title}</div>
                        <div className="text-[10px] text-cyan-400 font-mono">Code: {r.code}</div>
                      </div>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-[10px] text-slate-300">
                        {r.participants.length} online
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-cyan-500/40 bg-cyan-600/30 py-2.5 text-sm font-bold text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-600/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Joining Room...' : 'Enter Learning Room'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCreateSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Room Topic & Title
              </label>
              <input
                type="text"
                placeholder="e.g. Advanced Calculus & Vector Fields"
                value={createTitle}
                onChange={(e) => setCreateTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Host / Instructor Name
              </label>
              <input
                type="text"
                placeholder="e.g. Dr. Feynman"
                value={createHostName}
                onChange={(e) => setCreateHostName(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-600 focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Subject Category
              </label>
              <select
                value={createSubject}
                onChange={(e) => setCreateSubject(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-400 focus:outline-none"
              >
                <option value="physics">Physics (Classical & Modern)</option>
                <option value="mathematics">Mathematics & Geometry</option>
                <option value="computer-science">Computer Science & Algorithms</option>
                <option value="electronics">Electronics & Circuitry</option>
              </select>
            </div>

            <div className="rounded-lg border border-purple-500/20 bg-purple-950/20 p-3 text-xs text-purple-200">
              <Sparkles className="inline mr-1 h-3.5 w-3.5 text-purple-400" /> As the host, you will
              have full demonstration authority, board lock controls, and simulation controls.
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-lg border border-cyan-500/40 bg-cyan-600/30 py-2.5 text-sm font-bold text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)] hover:bg-cyan-600/50 transition-all disabled:opacity-50"
            >
              {loading ? 'Creating Room...' : 'Host Learning Session'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

