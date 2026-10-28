'use client';

import React from 'react';
import { 
  X, 
  Command, 
  MousePointer, 
  Edit3, 
  Type, 
  Square, 
  Eraser, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw,
  Copy, 
  Trash2, 
  CheckSquare, 
  Save, 
  Maximize2 
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isImmersive: boolean;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  isImmersive,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Ctrl / ⌘ + Z', desc: 'Undo last change', icon: RotateCcw },
    { key: 'Ctrl / ⌘ + Shift + Z', desc: 'Redo change', icon: RotateCw },
    { key: 'Del / Backspace', desc: 'Delete selection', icon: Trash2 },
    { key: 'Ctrl / ⌘ + D', desc: 'Duplicate selection', icon: Copy },
    { key: 'Ctrl / ⌘ + A', desc: 'Select all objects', icon: CheckSquare },
    { key: 'Ctrl / ⌘ + S', desc: 'Save workspace immediately', icon: Save },
    { key: 'Escape', desc: 'Deselect / Cancel', icon: MousePointer },
    { key: 'Shift + 1', desc: 'Fit board to screen', icon: Maximize2 },
    { key: 'V', desc: 'Select tool', icon: MousePointer },
    { key: 'H / Space', desc: 'Hand / Pan tool', icon: Move },
    { key: 'D / P', desc: 'Pen / Freehand Draw', icon: Edit3 },
    { key: 'E', desc: 'Eraser tool', icon: Eraser },
    { key: 'T', desc: 'Text box tool', icon: Type },
    { key: 'R', desc: 'Geometric Shapes tool', icon: Square },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className={`w-full max-w-xl rounded-2xl p-6 shadow-2xl transition-all ${
          isImmersive 
            ? 'bg-slate-900/95 border border-cyan-500/30 text-slate-100 shadow-cyan-950/50' 
            : 'bg-slate-900 border border-slate-700 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <span className={`p-1.5 rounded-lg ${isImmersive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-300'}`}>
              <Command className="w-5 h-5" />
            </span>
            <h2 className="text-lg font-semibold tracking-wide">Keyboard & Mouse Controls</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[60vh] overflow-y-auto pr-1">
          {shortcuts.map((sc, idx) => {
            const Icon = sc.icon;
            return (
              <div 
                key={idx}
                className={`flex items-center justify-between p-2.5 rounded-xl border ${
                  isImmersive 
                    ? 'bg-slate-800/40 border-cyan-500/10 hover:border-cyan-500/30' 
                    : 'bg-slate-800/60 border-slate-700/50'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="text-xs font-medium text-slate-300 truncate">{sc.desc}</span>
                </div>
                <kbd className="px-2 py-1 text-[11px] font-mono font-semibold bg-slate-950/80 text-cyan-300 rounded-md border border-slate-700 shadow-inner shrink-0 ml-2">
                  {sc.key}
                </kbd>
              </div>
            );
          })}
        </div>

        <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>Shortcuts automatically pause while typing inside text boxes.</span>
          <button
            onClick={onClose}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-all ${
              isImmersive
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-900/30'
                : 'bg-slate-800 hover:bg-slate-700 text-white'
            }`}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
