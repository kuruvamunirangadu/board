'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useWorkspace } from '@/features/workspace/useWorkspace';
import { useBoardEngine } from '@/features/board/useBoardEngine';
import { defaultUIState, UIState } from '@/store/ui-store';
import { ToolType } from '@/types';

import { TopBar } from './TopBar';
import { LeftToolbar } from '../toolbar/LeftToolbar';
import { ContextualSidebar } from '../panels/ContextualSidebar';
import { CanvasHost } from '../canvas/CanvasHost';
import { ViewControls } from '../canvas/ViewControls';
import { SpatialBackground } from '../canvas/SpatialBackground';
import { KeyboardShortcutsModal } from '../ui/KeyboardShortcutsModal';
import { CanvasSelectionHUD } from '../canvas/CanvasSelectionHUD';

export const AppShell: React.FC = () => {
  const [activeSessionId, setActiveSessionId] = useState<string>('workspace-default');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const sId = params.get('session');
      if (sId) {
        setActiveSessionId(sId);
      }
    }
  }, []);

  const {
    controller,
    workspace,
    mode,
    saveStatus,
    lastSavedAt,
    boardStats,
    setMode,
    setTitle,
    save,
    exportWorkspace,
    importWorkspace,
  } = useWorkspace(activeSessionId);

  const {
    editor,
    handleMount,
    setTool,
    setStyle,
    zoomIn,
    zoomOut,
    resetZoom,
    zoomToFit,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    selectAll,
    selectNone,
    canUndo,
    canRedo,
    hasSelection,
  } = useBoardEngine(controller);

  // UI state
  const [uiState, setUiState] = useState<UIState>(defaultUIState);

  // Synchronize tool selection to board engine
  const handleSelectTool = useCallback((tool: ToolType) => {
    setUiState((prev) => ({ ...prev, activeTool: tool }));
    setTool(tool);
  }, [setTool]);

  // Synchronize style changes
  const handleSelectColor = (color: string) => {
    setUiState((prev) => ({ ...prev, currentColor: color }));
    setStyle(color, uiState.currentSize);
  };

  const handleSelectSize = (size: 's' | 'm' | 'l' | 'xl') => {
    setUiState((prev) => ({ ...prev, currentSize: size }));
    setStyle(uiState.currentColor, size);
  };

  // Clear Canvas Content
  const handleClearBoard = () => {
    if (!editor) return;
    if (window.confirm('Are you sure you want to clear all canvas elements?')) {
      const shapes = editor.getCurrentPageShapes();
      editor.deleteShapes(shapes.map((s) => s.id));
      save();
    }
  };

  // Flush save on window unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      save();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [save]);

  // Global Keyboard Shortcuts (with text-editing isolation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      const targetEl = e.target as HTMLElement | null;

      const isTextInput = 
        activeEl?.tagName === 'INPUT' || 
        activeEl?.tagName === 'TEXTAREA' ||
        targetEl?.tagName === 'INPUT' || 
        targetEl?.tagName === 'TEXTAREA' ||
        activeEl?.isContentEditable || 
        targetEl?.isContentEditable ||
        Boolean(activeEl?.closest('.tl-text-input')) ||
        Boolean(targetEl?.closest('.tl-text-input'));

      // If typing in text editor, do not intercept normal typing or Backspace/Delete/Escape
      if (isTextInput) {
        if (e.key === 'Escape') {
          (activeEl || targetEl)?.blur();
        }
        return;
      }

      const isModifier = e.ctrlKey || e.metaKey;

      // Ctrl+S / Cmd+S: Save now
      if (isModifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        save();
        return;
      }

      // Ctrl+Z / Cmd+Z: Undo / Redo
      if (isModifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      // Ctrl+Y: Redo
      if (isModifier && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      // Ctrl+D / Cmd+D: Duplicate selection
      if (isModifier && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        duplicateSelected();
        return;
      }

      // Ctrl+A / Cmd+A: Select all
      if (isModifier && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        selectAll();
        return;
      }

      // Delete / Backspace: Delete selection
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (hasSelection) {
          e.preventDefault();
          deleteSelected();
        }
        return;
      }

      // Escape: Deselect all
      if (e.key === 'Escape') {
        selectNone();
        return;
      }

      // Shift+1: Fit to screen
      if (e.shiftKey && e.key === '!') {
        e.preventDefault();
        zoomToFit();
        return;
      }

      // Single-key Tool switches (only when no modifier is pressed)
      if (!isModifier && !e.altKey) {
        const key = e.key.toLowerCase();
        if (key === 'v') handleSelectTool('select');
        else if (key === 'h') handleSelectTool('hand');
        else if (key === 'd' || key === 'p') handleSelectTool('draw');
        else if (key === 'e') handleSelectTool('eraser');
        else if (key === 't') handleSelectTool('text');
        else if (key === 'n') handleSelectTool('note');
        else if (key === 'r') handleSelectTool('rectangle');
        else if (e.key === '?') {
          setUiState((prev) => ({ ...prev, isShortcutsOpen: !prev.isShortcutsOpen }));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    save,
    undo,
    redo,
    deleteSelected,
    duplicateSelected,
    selectAll,
    selectNone,
    zoomToFit,
    hasSelection,
    handleSelectTool,
  ]);

  return (
    <div className={`relative w-screen h-screen overflow-hidden select-none ${mode === 'immersive' ? 'dark' : ''}`}>
      {/* Background layer */}
      <SpatialBackground mode={mode} settings={uiState.immersiveSettings} />

      {/* Top Application Bar */}
      <TopBar
        workspace={workspace}
        mode={mode}
        onToggleMode={setMode}
        onUpdateTitle={setTitle}
        saveStatus={saveStatus}
        lastSavedAt={lastSavedAt}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onSave={save}
        onExport={() => exportWorkspace()}
        onImport={importWorkspace}
        onOpenShortcuts={() => setUiState((prev) => ({ ...prev, isShortcutsOpen: true }))}
        isSidebarOpen={uiState.isSidebarOpen}
        onToggleSidebar={() => setUiState((prev) => ({ ...prev, isSidebarOpen: !prev.isSidebarOpen }))}
      />

      {/* Left Tool Dock */}
      <LeftToolbar
        activeTool={uiState.activeTool}
        onSelectTool={handleSelectTool}
        currentColor={uiState.currentColor}
        onSelectColor={handleSelectColor}
        currentSize={uiState.currentSize}
        onSelectSize={handleSelectSize}
        mode={mode}
      />

      {/* Primary Canvas Host */}
      <main className="absolute inset-0 pt-14 pb-0 pl-0 pr-0 z-0">
        <CanvasHost
          onEditorMount={handleMount}
          mode={mode}
        />
      </main>

      {/* Floating Viewport Controls */}
      <ViewControls
        zoomLevel={boardStats.zoomLevel}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onResetZoom={resetZoom}
        onFitToContent={zoomToFit}
        mode={mode}
      />

      {/* Floating Canvas Selection & Transformation HUD */}
      <CanvasSelectionHUD
        editor={editor}
        workspace={workspace}
        onOpenSidebarTab={() => setUiState((prev) => ({ ...prev, isSidebarOpen: true }))}
      />

      {/* Contextual Right Sidebar */}
      <ContextualSidebar
        isOpen={uiState.isSidebarOpen}
        onClose={() => setUiState((prev) => ({ ...prev, isSidebarOpen: false }))}
        mode={mode}
        editor={editor}
        workspace={workspace}
        boardStats={boardStats}
        settings={uiState.immersiveSettings}
        onUpdateSettings={(newSettings) =>
          setUiState((prev) => ({
            ...prev,
            immersiveSettings: { ...prev.immersiveSettings, ...newSettings },
          }))
        }
        onClearBoard={handleClearBoard}
      />

      {/* Keyboard Shortcuts Dialog */}
      <KeyboardShortcutsModal
        isOpen={uiState.isShortcutsOpen}
        onClose={() => setUiState((prev) => ({ ...prev, isShortcutsOpen: false }))}
        isImmersive={mode === 'immersive'}
      />
    </div>
  );
};
