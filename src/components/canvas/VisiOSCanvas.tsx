'use client';

import React, { useEffect, useRef } from 'react';
import { 
  Tldraw, 
  Editor, 
  DefaultColorStyle, 
  DefaultSizeStyle,
  DefaultDashStyle,
  DefaultFillStyle
} from 'tldraw';
import { ToolType, PresentationMode } from '@/types/board';
import { loadBoardSnapshotFromStorage } from '@/lib/storage';
import { VISIOS_CUSTOM_SHAPE_UTILS } from './CanvasHost';

interface VisiOSCanvasProps {
  onEditorMount: (editor: Editor) => void;
  mode: PresentationMode;
  activeTool: ToolType;
  currentColor: string;
  currentSize: 's' | 'm' | 'l' | 'xl';
}

export const VisiOSCanvas: React.FC<VisiOSCanvasProps> = ({
  onEditorMount,
  mode,
  activeTool,
  currentColor,
  currentSize,
}) => {
  const editorRef = useRef<Editor | null>(null);

  const handleMount = (editor: Editor) => {
    editorRef.current = editor;

    // Load persisted state if available
    try {
      const savedSnapshot = loadBoardSnapshotFromStorage();
      if (savedSnapshot && savedSnapshot.document) {
        editor.store.loadSnapshot(savedSnapshot);
      }
    } catch (err) {
      console.warn('Could not restore snapshot, starting with clean canvas', err);
    }

    onEditorMount(editor);
  };

  // Sync active tool changes to tldraw editor
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      switch (activeTool) {
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
        case 'rectangle':
        case 'ellipse':
        case 'triangle':
        case 'diamond':
          // Geo shapes
          editor.setCurrentTool('geo');
          break;
      }
    } catch (e) {
      console.warn('Tool transition error:', e);
    }
  }, [activeTool]);

  // Sync color & stroke styles
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    try {
      if (currentColor) {
        editor.setStyleForNextShapes(DefaultColorStyle, currentColor as any);
      }
      if (currentSize) {
        editor.setStyleForNextShapes(DefaultSizeStyle, currentSize as any);
      }
    } catch (e) {
      // ignore
    }
  }, [currentColor, currentSize]);

  return (
    <div 
      className={`w-full h-full relative visios-canvas-container ${
        mode === 'immersive' ? 'immersive-mode' : 'focus-mode'
      }`}
    >
      <Tldraw
        shapeUtils={VISIOS_CUSTOM_SHAPE_UTILS}
        onMount={handleMount}
        hideUi={true}
        autoFocus
      />
    </div>
  );
};

