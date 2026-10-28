'use client';

import React, { useState, useRef } from 'react';
import { 
  Focus, 
  Orbit, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Download, 
  Upload, 
  Undo2, 
  Redo2, 
  HelpCircle, 
  SlidersHorizontal,
  Edit2,
  Check
} from 'lucide-react';
import { Workspace, WorkspaceMode, SaveStatus } from '@/types';
import { formatTimestamp } from '@/lib/utils';

interface TopBarProps {
  workspace: Workspace;
  mode: WorkspaceMode;
  onToggleMode: (mode: WorkspaceMode) => void;
  onUpdateTitle: (title: string) => void;
  saveStatus: SaveStatus;
  lastSavedAt: number;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onOpenShortcuts: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  workspace,
  mode,
  onToggleMode,
  onUpdateTitle,
  saveStatus,
  lastSavedAt,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onOpenShortcuts,
  isSidebarOpen,
  onToggleSidebar,
}) => {
  const isImmersive = mode === 'immersive';
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(workspace.title);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTitleSubmit = () => {
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(workspace.title);
    }
    setIsEditingTitle(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImport(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 h-14 px-4 flex items-center justify-between transition-all duration-300 ${
        isImmersive
          ? 'bg-slate-950/70 backdrop-blur-xl border-b border-cyan-500/20 text-slate-100 shadow-lg shadow-cyan-950/20'
          : 'bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-slate-200'
      }`}
    >
      {/* Brand & Workspace Name */}
      <div className="flex items-center space-x-3 sm:space-x-4 min-w-0">
        <div className="flex items-center space-x-2 shrink-0">
          <div 
            className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold tracking-tighter text-sm transition-all shadow-md ${
              isImmersive 
                ? 'bg-gradient-to-tr from-cyan-500 to-violet-600 text-white shadow-cyan-500/40 ring-1 ring-cyan-400/50' 
                : 'bg-slate-800 border border-slate-700 text-cyan-400'
            }`}
          >
            V
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center space-x-1.5 leading-none">
              <span className="font-bold text-sm tracking-wider text-slate-100">VisiOS</span>
              <span className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded-full ${
                isImmersive 
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                Milestone 3
              </span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">Visual Learning OS</span>
          </div>
        </div>

        <div className="h-5 w-[1px] bg-slate-800 hidden sm:block" />

        {/* Inline editable Workspace Title */}
        <div className="flex items-center space-x-1.5 truncate max-w-[140px] sm:max-w-xs">
          {isEditingTitle ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onBlur={handleTitleSubmit}
                onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                autoFocus
                className="bg-slate-800 text-white text-xs sm:text-sm px-2 py-1 rounded border border-cyan-500/50 focus:outline-none focus:ring-1 focus:ring-cyan-400"
              />
              <button 
                onClick={handleTitleSubmit}
                className="p-1 text-cyan-400 hover:text-cyan-300"
              >
                <Check className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setTitleInput(workspace.title);
                setIsEditingTitle(true);
              }}
              className="flex items-center space-x-1.5 text-xs sm:text-sm font-medium text-slate-200 hover:text-white px-2 py-1 rounded-lg hover:bg-slate-800/60 transition-colors truncate"
              title="Click to rename workspace"
            >
              <span className="truncate">{workspace.title}</span>
              <Edit2 className="w-3 h-3 text-slate-500 opacity-60 hover:opacity-100 shrink-0" />
            </button>
          )}
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="flex items-center">
        <div className={`p-0.5 rounded-xl border flex items-center transition-all ${
          isImmersive 
            ? 'bg-slate-900/90 border-cyan-500/30 shadow-inner' 
            : 'bg-slate-800/80 border-slate-700'
        }`}>
          <button
            onClick={() => onToggleMode('focus')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              mode === 'focus'
                ? 'bg-slate-700 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Focus Mode (Minimal digital board for everyday study)"
          >
            <Focus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Focus Mode</span>
            <span className="md:hidden">Focus</span>
          </button>

          <button
            onClick={() => onToggleMode('immersive')}
            className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 text-xs font-medium rounded-lg transition-all ${
              mode === 'immersive'
                ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white shadow-md shadow-cyan-900/40 font-semibold'
                : 'text-slate-400 hover:text-cyan-300'
            }`}
            title="Immersive Mode (Spatial workspace with floating panels and depth)"
          >
            <Orbit className={`w-3.5 h-3.5 ${isImmersive ? 'animate-spin' : ''}`} style={{ animationDuration: '8s' }} />
            <span className="hidden md:inline">Immersive Mode</span>
            <span className="md:hidden">Immersive</span>
          </button>
        </div>
      </div>

      {/* Actions & Sidebar Toggle */}
      <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
        {/* Undo / Redo */}
        <div className="flex items-center space-x-0.5 bg-slate-800/50 p-0.5 rounded-lg border border-slate-750">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Undo (Ctrl+Z / ⌘Z)"
            className="p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Redo (Ctrl+Shift+Z / ⌘Shift+Z)"
            className="p-1.5 rounded text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:text-slate-300 hover:bg-slate-700 transition-colors"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Save Status & Action */}
        <button
          onClick={onSave}
          className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
            saveStatus === 'saving'
              ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 animate-pulse'
              : saveStatus === 'saved'
              ? isImmersive 
                ? 'bg-slate-900/80 border-cyan-500/20 text-slate-300 hover:border-cyan-500/40'
                : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:text-white'
              : saveStatus === 'error'
              ? 'bg-red-950/60 border-red-500/60 text-red-300 hover:bg-red-900/50'
              : 'bg-amber-950/40 border-amber-500/40 text-amber-300 hover:bg-amber-900/40'
          }`}
          title={
            saveStatus === 'error'
              ? 'Save failed. Click to retry.'
              : `Last saved: ${formatTimestamp(new Date(lastSavedAt))}. Click to save manually (Ctrl+S).`
          }
        >
          {saveStatus === 'saving' ? (
            <Clock className="w-3.5 h-3.5 text-cyan-400 animate-spin" />
          ) : saveStatus === 'error' ? (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-bounce" />
          ) : (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          )}
          <span className="hidden xl:inline">
            {saveStatus === 'saving'
              ? 'Saving...'
              : saveStatus === 'error'
              ? 'Retry Save'
              : 'Saved'}
          </span>
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept=".json,.visios" 
          className="hidden" 
        />

        <button
          onClick={onExport}
          title="Export Workspace JSON backup"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors hidden sm:inline-flex"
        >
          <Download className="w-4 h-4" />
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          title="Import Workspace JSON"
          className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors hidden sm:inline-flex"
        >
          <Upload className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenShortcuts}
          title="Keyboard shortcuts (or ?)"
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
        >
          <HelpCircle className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Collapse Inspector' : 'Open Inspector'}
          className={`p-1.5 rounded-lg transition-all ${
            isSidebarOpen
              ? isImmersive 
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm' 
                : 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
