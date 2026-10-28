'use client';

import React from 'react';
import { Editor } from 'tldraw';
import { ArrowUp, ArrowDown, Copy, Trash2, MousePointerClick } from 'lucide-react';
import { WorkspaceMode } from '@/types';

interface PropertiesPanelProps {
  editor: Editor | null;
  mode: WorkspaceMode;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ editor }) => {
  const selectedShapes = editor ? editor.getSelectedShapes() : [];
  const hasSelection = selectedShapes.length > 0;

  const handleUpdateProp = (key: string, value: any) => {
    if (!editor || !hasSelection) return;
    editor.updateShapes(
      selectedShapes.map((shape) => ({
        id: shape.id,
        type: shape.type,
        props: {
          ...shape.props,
          [key]: value,
        },
      }))
    );
  };

  const handleBringToFront = () => {
    if (!editor || !hasSelection) return;
    editor.bringToFront(selectedShapes.map((s) => s.id));
  };

  const handleSendToBack = () => {
    if (!editor || !hasSelection) return;
    editor.sendToBack(selectedShapes.map((s) => s.id));
  };

  const handleDuplicate = () => {
    if (!editor || !hasSelection) return;
    editor.duplicateShapes(selectedShapes.map((s) => s.id));
  };

  const handleDeleteSelected = () => {
    if (!editor || !hasSelection) return;
    editor.deleteShapes(selectedShapes.map((s) => s.id));
  };

  if (!hasSelection) {
    return (
      <div className="text-center py-10 px-4 space-y-3">
        <div className="w-12 h-12 rounded-2xl mx-auto flex items-center justify-center bg-slate-800/60 border border-slate-700/60 text-slate-400">
          <MousePointerClick className="w-6 h-6" />
        </div>
        <div className="font-medium text-slate-300">No Elements Selected</div>
        <p className="text-slate-500 text-xs leading-relaxed">
          Click or drag-select any note, shape, text box, or drawing to modify colors, stroke styles, and layering.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60">
        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
          Selected ({selectedShapes.length})
        </span>
        <div className="mt-1 font-medium text-slate-200 capitalize">
          {selectedShapes[0]?.type || 'Object'}
        </div>
      </div>

      {/* Color Accent */}
      <div className="space-y-2">
        <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          Color Accent
        </label>
        <div className="grid grid-cols-4 gap-2">
          {[
            { name: 'Black', val: 'black', color: '#1e293b' },
            { name: 'Cyan', val: 'light-blue', color: '#06b6d4' },
            { name: 'Blue', val: 'blue', color: '#3b82f6' },
            { name: 'Violet', val: 'violet', color: '#8b5cf6' },
            { name: 'Green', val: 'green', color: '#10b981' },
            { name: 'Yellow', val: 'yellow', color: '#f59e0b' },
            { name: 'Red', val: 'red', color: '#ef4444' },
            { name: 'White', val: 'grey', color: '#f8fafc' },
          ].map((c) => (
            <button
              key={c.val}
              onClick={() => handleUpdateProp('color', c.val)}
              className="w-full h-7 rounded-lg border border-slate-700 hover:scale-105 transition-transform flex items-center justify-center"
              style={{ backgroundColor: c.color }}
              title={c.name}
            />
          ))}
        </div>
      </div>

      {/* Fill Pattern */}
      <div className="space-y-2">
        <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          Fill Pattern
        </label>
        <div className="grid grid-cols-4 gap-1 bg-slate-800/60 p-1 rounded-xl">
          {['none', 'semi', 'solid', 'pattern'].map((fill) => (
            <button
              key={fill}
              onClick={() => handleUpdateProp('fill', fill)}
              className="py-1 rounded-lg text-center font-medium capitalize text-slate-300 hover:bg-slate-700/80 transition-colors"
            >
              {fill}
            </button>
          ))}
        </div>
      </div>

      {/* Stroke Style */}
      <div className="space-y-2">
        <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          Stroke Style
        </label>
        <div className="grid grid-cols-4 gap-1 bg-slate-800/60 p-1 rounded-xl">
          {['draw', 'solid', 'dashed', 'dotted'].map((dash) => (
            <button
              key={dash}
              onClick={() => handleUpdateProp('dash', dash)}
              className="py-1 rounded-lg text-center font-medium capitalize text-slate-300 hover:bg-slate-700/80 transition-colors"
            >
              {dash}
            </button>
          ))}
        </div>
      </div>

      {/* Layer Hierarchy & Actions */}
      <div className="pt-2 border-t border-slate-800 space-y-2">
        <label className="text-slate-400 font-semibold text-[11px] uppercase tracking-wider">
          Layering & Operations
        </label>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={handleBringToFront}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <ArrowUp className="w-3.5 h-3.5 text-cyan-400" />
            <span>Bring Front</span>
          </button>
          <button
            onClick={handleSendToBack}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <ArrowDown className="w-3.5 h-3.5 text-cyan-400" />
            <span>Send Back</span>
          </button>
          <button
            onClick={handleDuplicate}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Copy className="w-3.5 h-3.5 text-blue-400" />
            <span>Duplicate</span>
          </button>
          <button
            onClick={handleDeleteSelected}
            className="flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-900/40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
};

