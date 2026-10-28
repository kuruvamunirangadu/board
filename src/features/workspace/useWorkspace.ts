'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Workspace, WorkspaceMode, SaveStatus, BoardStats } from '@/types';
import { WorkspaceController } from '@/store/workspace-store';
import { defaultPersistenceAdapter, sessionPersistence } from '@/lib/persistence';

export function useWorkspace(workspaceId: string = 'workspace-default') {
  const controllerRef = useRef<WorkspaceController>(new WorkspaceController());
  const controller = controllerRef.current;

  const [state, setState] = useState(controller.getState());

  useEffect(() => {
    const unsubscribe = controller.subscribe((newState) => {
      setState(newState);
    });

    // 1. Try loading from sessionPersistence
    sessionPersistence.getSession(workspaceId).then((session) => {
      if (session) {
        controller.setWorkspace({
          id: session.id,
          title: session.title,
          subject: session.subject,
          mode: session.mode || 'focus',
          createdAt: session.createdAt,
          updatedAt: session.updatedAt,
          description: session.description,
          version: session.version || '1.0.0',
        });
        if (session.boardSnapshot) {
          const editor = controller.getEditor();
          if (editor) {
            editor.store.loadSnapshot(session.boardSnapshot);
          }
        }
      } else {
        // Fallback to legacy default adapter
        defaultPersistenceAdapter.loadWorkspace(workspaceId).then((result) => {
          if (result) {
            controller.setWorkspace(result.workspace);
          }
        });
      }
    });

    return () => unsubscribe();
  }, [controller, workspaceId]);

  const setMode = useCallback((mode: WorkspaceMode) => {
    controller.setMode(mode);
  }, [controller]);

  const setTitle = useCallback((title: string) => {
    controller.setTitle(title);
  }, [controller]);

  const save = useCallback(async () => {
    const success = await controller.save();
    if (success) {
      const editor = controller.getEditor();
      const snapshot = editor ? editor.store.getSnapshot() : null;
      const ws = controller.getState().workspace;
      // Sync to session persistence
      await sessionPersistence.updateSession(ws.id, {
        title: ws.title,
        subject: ws.subject,
        mode: ws.mode,
        boardSnapshot: snapshot,
      });
    }
    return success;
  }, [controller]);

  const exportWorkspace = useCallback((filename?: string) => {
    const editor = controller.getEditor();
    if (!editor) return;
    const snapshot = editor.store.getSnapshot();
    defaultPersistenceAdapter.exportWorkspace(state.workspace, snapshot, filename);
  }, [controller, state.workspace]);

  const importWorkspace = useCallback(async (file: File) => {
    try {
      const result = await defaultPersistenceAdapter.importWorkspace(file);
      const editor = controller.getEditor();
      if (editor && result.snapshot) {
        editor.store.loadSnapshot(result.snapshot);
      }
      controller.setWorkspace(result.workspace);
      await controller.save();
      return true;
    } catch (err: any) {
      alert(`Import error: ${err.message}`);
      return false;
    }
  }, [controller]);

  return {
    controller,
    workspace: state.workspace,
    mode: state.workspace.mode,
    saveStatus: state.saveStatus,
    lastSavedAt: state.lastSavedAt,
    boardStats: state.boardStats,
    setMode,
    setTitle,
    save,
    exportWorkspace,
    importWorkspace,
  };
}
