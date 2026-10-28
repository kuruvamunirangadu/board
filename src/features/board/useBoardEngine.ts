'use client';

import { useState, useCallback } from 'react';
import { 
  Editor, 
  DefaultColorStyle, 
  DefaultSizeStyle, 
  GeoShapeGeoStyle,
  createShapeId,
  loadSnapshot
} from 'tldraw';
import { ToolType } from '@/types';
import { WorkspaceController } from '@/store/workspace-store';
import { defaultPersistenceAdapter } from '@/lib/persistence';
import { IModel3dShape } from '@/components/canvas/Model3dShapeUtil';
import { ISimulationShape } from '@/components/canvas/SimulationShapeUtil';

export function useBoardEngine(controller: WorkspaceController) {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  // Helper to log telemetry to endpoint for full action tracing
  const logTelemetry = useCallback((action: string, details?: any, level: 'info' | 'warn' | 'error' | 'success' = 'info') => {
    try {
      fetch('/api/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'canvas',
          component: 'useBoardEngine',
          action,
          details,
          level,
        }),
      }).catch(() => {});
    } catch (e) {}
  }, []);

  const syncState = useCallback((ed: Editor) => {
    try {
      const shapes = ed.getCurrentPageShapes();
      const selected = ed.getSelectedShapes();
      const zoom = ed.getZoomLevel();
      const camera = ed.getCamera();

      setCanUndo(ed.getCanUndo ? ed.getCanUndo() : false);
      setCanRedo(ed.getCanRedo ? ed.getCanRedo() : false);
      setSelectedCount(selected.length);

      controller.updateBoardStats({
        objectCount: shapes.length,
        selectedCount: selected.length,
        zoomLevel: zoom,
        viewX: camera.x,
        viewY: camera.y,
      });
    } catch (e) {
      // ignore
    }
  }, [controller]);

  // Safely clears editing shape state to prevent tldraw "Entered editing state without an editing shape"
  const safeExitEditing = useCallback((ed: Editor) => {
    try {
      if (typeof ed.getEditingShapeId === 'function' && ed.getEditingShapeId()) {
        try {
          ed.complete();
        } catch (e) {}
      }
      if (typeof (ed as any).isIn === 'function' && (ed as any).isIn('select.editing_shape')) {
        try {
          ed.setCurrentTool('select');
        } catch (e) {}
      }
    } catch (e) {}
  }, []);

  const handleMount = useCallback((ed: Editor) => {
    setEditor(ed);
    controller.setEditor(ed);
    logTelemetry('editor_mounted', { workspaceId: controller.getState().workspace.id });

    // 1. Restore saved snapshot asynchronously on startup
    void (async () => {
      try {
        const workspaceId = controller.getState().workspace.id;
        const loaded = await defaultPersistenceAdapter.loadWorkspace(workspaceId);
        if (loaded && loaded.snapshot) {
          try {
            loadSnapshot(ed.store, loaded.snapshot);
            logTelemetry('snapshot_restored', { workspaceId });
          } catch (loadErr: any) {
            console.warn('Could not load snapshot with loadSnapshot helper, attempting store fallback:', loadErr);
            logTelemetry('snapshot_load_fallback', { error: loadErr?.message }, 'warn');
            if (typeof ed.store.loadSnapshot === 'function' && loaded.snapshot.document) {
              ed.store.loadSnapshot(loaded.snapshot);
            }
          }
        }
      } catch (err: any) {
        console.warn('Could not restore snapshot, starting with clean board:', err);
        logTelemetry('snapshot_restore_error', { error: err?.message }, 'warn');
      } finally {
        controller.markHydrated(true);
        syncState(ed);
      }
    })();

    // 2. Initial state sync
    syncState(ed);

    // 3. Listen to store changes for telemetry & debounced autosave
    const cleanupStore = ed.store.listen(() => {
      syncState(ed);
      controller.scheduleSave(700);
    });

    let cleanupSelect: (() => void) | undefined;
    try {
      if (ed.sideEffects && typeof ed.sideEffects.registerAfterChangeHandler === 'function') {
        cleanupSelect = ed.sideEffects.registerAfterChangeHandler('instance_page_state', () => {
          syncState(ed);
        });
      }
    } catch (e) {
      // ignore
    }

    return () => {
      try {
        if (typeof cleanupStore === 'function') cleanupStore();
        if (typeof cleanupSelect === 'function') cleanupSelect();
      } catch (e) {
        // ignore
      }
    };
  }, [controller, syncState, logTelemetry]);

  const insert3DModel = useCallback((modelType: string = 'heart') => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      const pageBounds = editor.getViewportPageBounds();
      const centerX = pageBounds ? pageBounds.center.x : 0;
      const centerY = pageBounds ? pageBounds.center.y : 0;
      const id = createShapeId();
      editor.createShape<IModel3dShape>({
        id,
        type: 'model3d',
        x: centerX - 180,
        y: centerY - 180,
        props: {
          w: 360,
          h: 360,
          modelType,
          rotationX: 0.2,
          rotationY: -0.4,
          zoom: 1,
          isPulsing: true,
        },
      });
      editor.setSelectedShapes([id]);
      editor.setCurrentTool('select');
      syncState(editor);
      logTelemetry('insert_3d_model', { modelType, id });
    } catch (e: any) {
      console.error('Failed to insert 3D model:', e);
      logTelemetry('insert_3d_model_error', { error: e?.message }, 'error');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const insertSimulation = useCallback((simulationType: string = 'pendulum') => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      const pageBounds = editor.getViewportPageBounds();
      const centerX = pageBounds ? pageBounds.center.x : 0;
      const centerY = pageBounds ? pageBounds.center.y : 0;
      const id = createShapeId();
      editor.createShape<ISimulationShape>({
        id,
        type: 'simulation',
        x: centerX - 190,
        y: centerY - 180,
        props: {
          w: 380,
          h: 360,
          simulationType,
          gravity: 9.81,
          length: 2.0,
          damping: 0.04,
          initialAngle: 45,
          speed: 1.0,
        },
      });
      editor.setSelectedShapes([id]);
      editor.setCurrentTool('select');
      syncState(editor);
      logTelemetry('insert_simulation', { simulationType, id });
    } catch (e: any) {
      console.error('Failed to insert simulation:', e);
      logTelemetry('insert_simulation_error', { error: e?.message }, 'error');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const setTool = useCallback((tool: ToolType) => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      switch (tool) {
        case 'select':
          editor.setCurrentTool('select');
          break;
        case 'hand':
          editor.setCurrentTool('hand');
          break;
        case 'draw':
          editor.setCurrentTool('draw');
          break;
        case 'eraser':
          editor.setCurrentTool('eraser');
          break;
        case 'text':
          editor.setCurrentTool('text');
          break;
        case 'note':
          editor.setCurrentTool('note');
          break;
        case 'arrow':
          editor.setCurrentTool('arrow');
          break;
        case 'line':
          editor.setCurrentTool('line');
          break;
        case 'model3d':
          insert3DModel('heart');
          break;
        case 'simulation':
          insertSimulation('pendulum');
          break;
        case 'rectangle':
          if (GeoShapeGeoStyle) editor.setStyleForNextShapes(GeoShapeGeoStyle, 'rectangle');
          editor.setCurrentTool('geo');
          break;
        case 'ellipse':
          if (GeoShapeGeoStyle) editor.setStyleForNextShapes(GeoShapeGeoStyle, 'ellipse');
          editor.setCurrentTool('geo');
          break;
        case 'triangle':
          if (GeoShapeGeoStyle) editor.setStyleForNextShapes(GeoShapeGeoStyle, 'triangle');
          editor.setCurrentTool('geo');
          break;
        case 'diamond':
          if (GeoShapeGeoStyle) editor.setStyleForNextShapes(GeoShapeGeoStyle, 'diamond');
          editor.setCurrentTool('geo');
          break;
      }
      logTelemetry('set_tool', { tool });
    } catch (e: any) {
      console.warn('Tool transition error:', e);
      logTelemetry('tool_transition_error', { error: e?.message, tool }, 'warn');
    }
  }, [editor, insert3DModel, insertSimulation, safeExitEditing, logTelemetry]);

  const setStyle = useCallback((color?: string, size?: 's' | 'm' | 'l' | 'xl') => {
    if (!editor) return;
    try {
      if (color) {
        editor.setStyleForNextShapes(DefaultColorStyle, color as any);
      }
      if (size) {
        editor.setStyleForNextShapes(DefaultSizeStyle, size as any);
      }
    } catch (e) {
      // ignore
    }
  }, [editor]);

  // Operations: Undo, Redo, Delete, Duplicate, Select All, Deselect
  const undo = useCallback(() => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      if (typeof editor.getCanUndo === 'function' ? editor.getCanUndo() : true) {
        editor.undo();
      }
      syncState(editor);
      logTelemetry('undo_operation');
    } catch (e: any) {
      console.warn('Safe undo warning suppressed:', e);
      logTelemetry('undo_error', { error: e?.message }, 'warn');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const redo = useCallback(() => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      if (typeof editor.getCanRedo === 'function' ? editor.getCanRedo() : true) {
        editor.redo();
      }
      syncState(editor);
      logTelemetry('redo_operation');
    } catch (e: any) {
      console.warn('Safe redo warning suppressed:', e);
      logTelemetry('redo_error', { error: e?.message }, 'warn');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const deleteSelected = useCallback(() => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      const selected = editor.getSelectedShapes();
      if (selected.length > 0) {
        editor.deleteShapes(selected.map((s) => s.id));
        syncState(editor);
        logTelemetry('delete_selected', { count: selected.length });
      }
    } catch (e: any) {
      console.warn('Safe delete warning suppressed:', e);
      logTelemetry('delete_error', { error: e?.message }, 'warn');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const duplicateSelected = useCallback(() => {
    if (!editor) return;
    try {
      safeExitEditing(editor);
      const selected = editor.getSelectedShapes();
      if (selected.length > 0) {
        editor.duplicateShapes(selected.map((s) => s.id));
        syncState(editor);
        logTelemetry('duplicate_selected', { count: selected.length });
      }
    } catch (e: any) {
      console.warn('Safe duplicate warning suppressed:', e);
      logTelemetry('duplicate_error', { error: e?.message }, 'warn');
    }
  }, [editor, syncState, safeExitEditing, logTelemetry]);

  const selectAll = useCallback(() => {
    if (!editor) return;
    try {
      editor.selectAll();
      syncState(editor);
    } catch (e) {
      // ignore
    }
  }, [editor, syncState]);

  const selectNone = useCallback(() => {
    if (!editor) return;
    try {
      editor.selectNone();
      syncState(editor);
    } catch (e) {
      // ignore
    }
  }, [editor, syncState]);

  // Viewport operations
  const zoomIn = useCallback(() => {
    try {
      editor?.zoomIn();
    } catch (e) {}
  }, [editor]);

  const zoomOut = useCallback(() => {
    try {
      editor?.zoomOut();
    } catch (e) {}
  }, [editor]);

  const resetZoom = useCallback(() => {
    try {
      editor?.resetZoom();
    } catch (e) {}
  }, [editor]);

  const zoomToFit = useCallback(() => {
    try {
      editor?.zoomToFit();
    } catch (e) {}
  }, [editor]);

  return {
    editor,
    handleMount,
    setTool,
    setStyle,
    insert3DModel,
    insertSimulation,
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
    hasSelection: selectedCount > 0,
    selectedCount,
  };
}
