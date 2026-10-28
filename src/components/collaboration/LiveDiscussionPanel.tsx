'use client';

import React, { useState, useRef, useEffect } from 'react';
import { RoomMessage, ParticipantRole } from '@/types/collaboration';
import { MessageSquare, Send, Shield, GraduationCap, Lock } from 'lucide-react';

interface LiveDiscussionPanelProps {
  messages: RoomMessage[];
  currentParticipantId: string;
  isChatAllowed: boolean;
  canOverrideLock: boolean;
  onSendMessage: (text: string) => Promise<void>;
}

export const LiveDiscussionPanel: React.FC<LiveDiscussionPanelProps> = ({
  messages,
  currentParticipantId,
  isChatAllowed,
  canOverrideLock,
  onSendMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isSending) return;
    if (!isChatAllowed && !canOverrideLock) return;

    setIsSending(true);
    try {
      await onSendMessage(inputText);
      setInputText('');
    } finally {
      setIsSending(false);
    }
  };

  const getRoleBadge = (role: ParticipantRole) => {
    switch (role) {
      case 'host':
      case 'instructor':
        return (
          <span className="inline-flex items-center gap-0.5 rounded border border-cyan-500/30 bg-cyan-500/20 px-1 py-0.2 text-[9px] font-bold text-cyan-300 uppercase">
            <Shield className="h-2.5 w-2.5" /> Instructor
          </span>
        );
      case 'participant':
        return (
          <span className="inline-flex items-center gap-0.5 rounded border border-emerald-500/30 bg-emerald-500/20 px-1 py-0.2 text-[9px] font-medium text-emerald-300">
            <GraduationCap className="h-2.5 w-2.5" /> Learner
          </span>
        );
      default:
        return null;
    }
  };

  const isInputDisabled = !isChatAllowed && !canOverrideLock;

  return (
    <div className="flex flex-col rounded-xl border border-slate-800 bg-slate-950/60 backdrop-blur-md h-full min-h-[340px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 p-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
            Live Lab Discussion ({messages.length})
          </h3>
        </div>
        {!isChatAllowed && (
          <span className="inline-flex items-center gap-1 text-[10px] text-red-400 font-medium">
            <Lock className="h-3 w-3" /> Muted by Host
          </span>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3 max-h-[360px]">
        {messages.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-xs text-slate-500 italic">
            No messages yet. Ask a question or share an observation!
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === currentParticipantId;
            const isSystem = msg.senderId === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="text-center my-1.5">
                  <span className="inline-block rounded-full bg-slate-900 border border-slate-800 px-2.5 py-0.5 text-[10px] text-slate-400 font-mono">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[11px] font-semibold text-slate-300">
                    {isSelf ? 'You' : msg.senderName}
                  </span>
                  {getRoleBadge(msg.senderRole)}
                  <span className="text-[9px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-xs max-w-[85%] break-words ${
                    isSelf
                      ? 'bg-cyan-600/30 border border-cyan-500/30 text-cyan-100'
                      : 'bg-slate-900 border border-slate-800 text-slate-200'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <form onSubmit={handleSend} className="border-t border-slate-800 p-2.5 bg-slate-900/40">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            disabled={isInputDisabled}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isInputDisabled
                ? 'Chat is disabled for participants'
                : 'Ask a question or explain an observation...'
            }
            className="flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:border-cyan-400 focus:outline-none disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isInputDisabled || !inputText.trim() || isSending}
            className="rounded-lg border border-cyan-500/40 bg-cyan-600/30 p-2 text-cyan-300 hover:bg-cyan-600/50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
};

