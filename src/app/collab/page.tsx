'use client';

import React, { useState, useEffect } from 'react';
import {
  LearningRoom,
  Participant,
  ParticipantRole,
  RoomMessage,
  SharedSimulationState,
  SharedWorkspaceOperation,
} from '@/types/collaboration';
import { collabClient } from '@/features/collaboration/collaboration-client';
import { RoomHeader } from '@/components/collaboration/RoomHeader';
import { ParticipantPresenceBar } from '@/components/collaboration/ParticipantPresenceBar';
import { InstructorControlsPanel } from '@/components/collaboration/InstructorControlsPanel';
import { SynchronizedSimulationWidget } from '@/components/collaboration/SynchronizedSimulationWidget';
import { LiveDiscussionPanel } from '@/components/collaboration/LiveDiscussionPanel';
import { RoomLobbyModal } from '@/components/collaboration/RoomLobbyModal';
import { Navigation } from '@/components/shell/Navigation';
import { StickyNote, Plus, Sparkles, MessageCircle } from 'lucide-react';

export default function CollaborativeRoomPage() {
  const [room, setRoom] = useState<LearningRoom | null>(null);
  const [participant, setParticipant] = useState<Participant | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [simulationState, setSimulationState] = useState<SharedSimulationState | null>(null);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [workspaceObjects, setWorkspaceObjects] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [isAddingNote, setIsAddingNote] = useState(false);

  // Subscribe to client updates
  useEffect(() => {
    const unsubRoom = collabClient.onRoomChange((r) => setRoom({ ...r }));
    const unsubParts = collabClient.onParticipantsChange((p) => setParticipants([...p]));
    const unsubSim = collabClient.onSimulationStateChange((s) => setSimulationState({ ...s }));
    const unsubMsg = collabClient.onMessage(() => setMessages([...collabClient.getMessages()]));
    const unsubOp = collabClient.onOperation(() => setWorkspaceObjects([...collabClient.getWorkspaceObjects()]));
    const unsubStatus = collabClient.onStatusChange((status) => setIsConnected(status));

    return () => {
      unsubRoom();
      unsubParts();
      unsubSim();
      unsubMsg();
      unsubOp();
      unsubStatus();
      collabClient.stopPolling();
    };
  }, []);

  const handleCreateRoom = async (title: string, hostName: string, options?: any) => {
    const res = await collabClient.createRoom(title, hostName, options);
    setRoom(res.room);
    setParticipant(res.participant);
    setParticipants(res.room.participants);
    setSimulationState(collabClient.getSimulationState());
    setWorkspaceObjects(collabClient.getWorkspaceObjects());
    setMessages(collabClient.getMessages());
    setIsConnected(true);
  };

  const handleJoinRoom = async (
    roomIdentifier: string,
    participantName: string,
    role: ParticipantRole
  ) => {
    const res = await collabClient.joinRoom(roomIdentifier, participantName, role);
    setRoom(res.room);
    setParticipant(res.participant);
    setParticipants(res.room.participants);
    setSimulationState(collabClient.getSimulationState());
    setWorkspaceObjects(collabClient.getWorkspaceObjects());
    setMessages(collabClient.getMessages());
    setIsConnected(true);
  };

  const handleLeaveRoom = async () => {
    await collabClient.leaveRoom();
    setRoom(null);
    setParticipant(null);
    setParticipants([]);
    setSimulationState(null);
    setMessages([]);
    setWorkspaceObjects([]);
    setIsConnected(false);
  };

  const handleUpdateSettings = async (
    settings: any,
    conceptBroadcast?: { conceptId: string; conceptTitle: string }
  ) => {
    const updated = await collabClient.updateSettings(settings, conceptBroadcast);
    if (updated) {
      setRoom({ ...updated });
    }
  };

  const handleUpdateSimulation = async (patch: Partial<SharedSimulationState>) => {
    const updated = await collabClient.updateSimulation(patch);
    if (updated) {
      setSimulationState({ ...updated });
    }
  };

  const handleSendMessage = async (text: string) => {
    await collabClient.sendMessage(text);
    setMessages([...collabClient.getMessages()]);
  };

  const handleAddBoardNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteInput.trim() || !participant) return;

    const newObj = {
      id: `obj-note-${Date.now()}`,
      type: 'text',
      text: `${participant.name}: ${noteInput.trim()}`,
      x: 100 + Math.random() * 200,
      y: 120 + Math.random() * 150,
      color: participant.color || '#38bdf8',
      fontSize: 14,
    };

    setIsAddingNote(true);
    try {
      await collabClient.sendOperation('object_add', { object: newObj });
      setWorkspaceObjects([...collabClient.getWorkspaceObjects()]);
      setNoteInput('');
    } finally {
      setIsAddingNote(false);
    }
  };

  const isHost = participant?.role === 'host' || participant?.role === 'instructor';
  const isBoardLockedForUser = room?.settings.isBoardLocked && !isHost;
  const isSimulationLockedForUser = room?.settings.isSimulationLocked && !isHost;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-slate-950 text-slate-100 antialiased font-sans">
      <Navigation />

      {!room || !participant ? (
        <main className="flex flex-1 items-center justify-center p-4 bg-radial-cyber">
          <RoomLobbyModal
            onCreateRoom={handleCreateRoom}
            onJoinRoom={handleJoinRoom}
          />
        </main>
      ) : (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Room Header */}
          <RoomHeader
            room={room}
            participant={participant}
            isConnected={isConnected}
            onLeave={handleLeaveRoom}
          />

          {/* Main Room Body */}
          <div className="flex flex-1 overflow-hidden">
            {/* Left Presence Sidebar */}
            <ParticipantPresenceBar
              participants={participants.length > 0 ? participants : room.participants}
              currentParticipantId={participant.id}
            />

            {/* Central Workspace & Interactive Widgets */}
            <main className="flex flex-1 flex-col overflow-y-auto p-4 space-y-4">
              {/* Instructor Controls Panel (Only if Host/Instructor) */}
              {isHost && (
                <InstructorControlsPanel
                  room={room}
                  onUpdateSettings={handleUpdateSettings}
                />
              )}

              {/* Synchronized Simulation Widget */}
              <SynchronizedSimulationWidget
                simulationState={simulationState}
                isLocked={!!room.settings.isSimulationLocked}
                canEdit={isHost}
                onUpdateSimulation={handleUpdateSimulation}
              />

              {/* Shared Concept Board & Annotations */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4 backdrop-blur-md">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <StickyNote className="h-4 w-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Collaborative Board Observations ({workspaceObjects.length})
                    </h3>
                  </div>

                  {!isBoardLockedForUser && (
                    <form onSubmit={handleAddBoardNote} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Add observation note to board..."
                        value={noteInput}
                        onChange={(e) => setNoteInput(e.target.value)}
                        className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-1 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none"
                      />
                      <button
                        type="submit"
                        disabled={isAddingNote || !noteInput.trim()}
                        className="flex items-center gap-1 rounded-lg border border-cyan-500/40 bg-cyan-600/30 px-2.5 py-1 text-xs font-medium text-cyan-200 hover:bg-cyan-600/50 disabled:opacity-40"
                      >
                        <Plus className="h-3 w-3" /> Add Note
                      </button>
                    </form>
                  )}
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {workspaceObjects.map((obj) => (
                    <div
                      key={obj.id}
                      className="rounded-lg border border-cyan-500/20 bg-slate-950/70 p-3 shadow-sm hover:border-cyan-500/40 transition-colors"
                    >
                      <div className="text-[11px] font-mono text-cyan-400 mb-1 capitalize">
                        {obj.type}
                      </div>
                      <p className="text-xs text-slate-200 whitespace-pre-wrap">{obj.text || JSON.stringify(obj.parameters || {})}</p>
                    </div>
                  ))}
                </div>
              </div>
            </main>

            {/* Right Discussion Panel */}
            <aside className="w-80 border-l border-cyan-500/20 bg-slate-950/60 p-3 shrink-0 flex flex-col">
              <LiveDiscussionPanel
                messages={messages}
                currentParticipantId={participant.id}
                isChatAllowed={room.settings.allowParticipantChat}
                canOverrideLock={isHost}
                onSendMessage={handleSendMessage}
              />
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

