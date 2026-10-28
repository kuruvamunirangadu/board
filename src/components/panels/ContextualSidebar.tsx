'use client';

import React, { useState } from 'react';
import { X, Sliders, Sparkles, History } from 'lucide-react';
import { WorkspaceMode, BoardStats, ImmersiveSettings, Workspace } from '@/types';
import { Editor } from 'tldraw';
import { PropertiesPanel } from './PropertiesPanel';
import { LayersOutlinePanel } from './LayersOutlinePanel';
import { SpatialSettingsPanel } from './SpatialSettingsPanel';
import { TelemetryPanel } from './TelemetryPanel';
import { LearningIntelligencePanel } from './LearningIntelligencePanel';
import { KnowledgeContinuityPanel } from './KnowledgeContinuityPanel';
import { StudyPortalsPanel } from './StudyPortalsPanel';
interface ContextualSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  mode: WorkspaceMode;
  editor: Editor | null;
  workspace: Workspace;
  boardStats: BoardStats;
  settings: ImmersiveSettings;
  onUpdateSettings: (settings: Partial<ImmersiveSettings>) => void;
  onClearBoard: () => void;
}
export const ContextualSidebar: React.FC<ContextualSidebarProps> = ({
  isOpen,
  onClose,
  mode,
  editor,
  workspace,
  boardStats,
  settings,
  onUpdateSettings,
  onClearBoard,
}) => {
  const isImmersive = mode === 'immersive';
  const [activeTab, setActiveTab] = useState<'guide' | 'portals' | 'continuity' | 'properties' | 'outline' | 'spatial' | 'telemetry'>('guide');
  if (!isOpen) return null;

  const selectedShapes = editor ? editor.getSelectedShapes() : [];
  const allShapes = editor ? editor.getCurrentPageShapes() : [];
  const hasSelection = selectedShapes.length > 0;

  return (
    <aside
      className={`fixed right-4 top-20 bottom-6 z-40 w-84 sm:w-96 rounded-2xl flex flex-col shadow-2xl transition-all duration-300 overflow-hidden ${
        isImmersive
          ? 'bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30 text-slate-100 shadow-cyan-950/50'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          {activeTab === 'guide' ? (
            <Sparkles className={`w-4 h-4 ${isImmersive ? 'text-cyan-400 animate-pulse' : 'text-cyan-400'}`} />
          ) : activeTab === 'continuity' ? (
            <History className={`w-4 h-4 ${isImmersive ? 'text-cyan-400' : 'text-cyan-400'}`} />
          ) : (
            <Sliders className={`w-4 h-4 ${isImmersive ? 'text-cyan-400' : 'text-slate-300'}`} />
          )}
          <span className="text-sm font-bold tracking-wide">
            {activeTab === 'guide'
              ? 'Learning Intelligence'
              : activeTab === 'continuity'
              ? 'Knowledge Continuity'
              : 'Workspace Inspector'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-slate-800 p-1 bg-slate-950/40 text-xs gap-0.5 overflow-x-auto">
        <button
          onClick={() => setActiveTab('guide')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 shrink-0 ${
            activeTab === 'guide'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3 h-3" />
          <span>Guide</span>
        </button>
        <button
          onClick={() => setActiveTab('portals')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 shrink-0 ${
            activeTab === 'portals'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Portals</span>
        </button>
        <button
          onClick={() => setActiveTab('continuity')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center space-x-1 shrink-0 ${
            activeTab === 'continuity'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-cyan-300 font-semibold'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-3 h-3" />
          <span>History</span>
        </button>
        <button
          onClick={() => setActiveTab('properties')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all shrink-0 ${
            activeTab === 'properties'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Props {hasSelection && `(${selectedShapes.length})`}
        </button>
        <button
          onClick={() => setActiveTab('outline')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all shrink-0 ${
            activeTab === 'outline'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Outline ({allShapes.length})
        </button>
        <button
          onClick={() => setActiveTab('spatial')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all shrink-0 ${
            activeTab === 'spatial'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Spatial
        </button>
        <button
          onClick={() => setActiveTab('telemetry')}
          className={`py-1.5 px-2 rounded-lg font-medium transition-all shrink-0 ${
            activeTab === 'telemetry'
              ? isImmersive ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'bg-slate-800 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Stats
        </button>
      </div>

      {/* Tab Content Panels */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {activeTab === 'guide' && (
          <LearningIntelligencePanel
            editor={editor}
            workspace={workspace}
            mode={mode}
          />
        )}

        {activeTab === 'portals' && (
          <StudyPortalsPanel />
        )}

        {activeTab === 'continuity' && (
          <KnowledgeContinuityPanel
            sessionId={workspace.id}
            isImmersive={isImmersive}
          />
        )}

        {activeTab === 'properties' && (
          <PropertiesPanel editor={editor} mode={mode} />
        )}

        {activeTab === 'outline' && (
          <LayersOutlinePanel editor={editor} mode={mode} />
        )}

        {activeTab === 'spatial' && (
          <SpatialSettingsPanel
            mode={mode}
            settings={settings}
            onUpdateSettings={onUpdateSettings}
            onClearBoard={onClearBoard}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryPanel boardStats={boardStats} />
        )}
      </div>
    </aside>
  );
};
