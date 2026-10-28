'use client';

import React from 'react';
import { Editor } from 'tldraw';
import { WorkspaceMode } from '@/types';

interface LayersOutlinePanelProps {
  editor: Editor | null;
  mode: WorkspaceMode;
}

export const LayersOutlinePanel: React.FC<LayersOutlinePanelProps> = ({ editor, mode }) => {
  const isImmersive = mode === 'immersive';
  const allShapes = editor ? editor.getCurrentPageShapes() : [];
  const selectedShapes = editor ? editor.getSelectedShapes() : [];

  const handleSelectShape = (shapeId: any) => {
    if (!editor) return;
    editor.setSelectedShapes([shapeId]);
    editor.zoomToSelection();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-slate-400">
        <span className="font-semibold text-[11px] uppercase tracking-wider">Canvas Elements</span>
        <span className="font-mono text-xs">{allShapes.length} items</span>
      </div>

      {allShapes.length === 0 ? (
        <div className="text-center py-8 text-slate-500">
          Board is empty. Add notes, shapes, or drawings using the left toolbar.
        </div>
      ) : (
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto pr-1">
          {allShapes.map((shape, idx) => {
            const isSelected = selectedShapes.some((s) => s.id === shape.id);
            const shapeText = (shape.props as any)?.text || (shape.props as any)?.name || shape.type;
            return (
              <div
                key={shape.id}
                onClick={() => handleSelectShape(shape.id)}
                className={`flex items-center justify-between p-2 rounded-xl cursor-pointer transition-all border ${
                  isSelected
                    ? isImmersive
                      ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-200'
                      : 'bg-slate-800 border-slate-600 text-white'
                    : 'bg-slate-800/40 border-slate-800 hover:border-slate-700 text-slate-300'
                }`}
              >
                <div className="flex items-center space-x-2 truncate">
                  <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                  <span className="capitalize font-medium text-xs truncate max-w-[150px]">
                    {shapeText}
                  </span>
                </div>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-900/80 text-slate-400 border border-slate-800 shrink-0">
                  {shape.type}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

