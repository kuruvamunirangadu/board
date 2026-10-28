'use client';

import React from 'react';
import { WorkspaceMode } from '@/types';

interface StylePickerProps {
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentSize: 's' | 'm' | 'l' | 'xl';
  onSelectSize: (size: 's' | 'm' | 'l' | 'xl') => void;
  mode: WorkspaceMode;
  onClose: () => void;
}

export const StylePicker: React.FC<StylePickerProps> = ({
  currentColor,
  onSelectColor,
  currentSize,
  onSelectSize,
  mode,
  onClose,
}) => {
  const isImmersive = mode === 'immersive';

  const colors = [
    { name: 'Black', value: 'black', hex: '#1e293b' },
    { name: 'Cyan', value: 'light-blue', hex: '#06b6d4' },
    { name: 'Blue', value: 'blue', hex: '#3b82f6' },
    { name: 'Violet', value: 'violet', hex: '#8b5cf6' },
    { name: 'Green', value: 'green', hex: '#10b981' },
    { name: 'Yellow', value: 'yellow', hex: '#f59e0b' },
    { name: 'Red', value: 'red', hex: '#ef4444' },
    { name: 'White', value: 'grey', hex: '#f8fafc' },
  ];

  return (
    <div 
      className={`absolute left-14 bottom-0 p-3 rounded-xl shadow-2xl z-50 min-w-[170px] animate-in fade-in slide-in-from-left-2 duration-150 ${
        isImmersive
          ? 'bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30'
          : 'bg-slate-900 border border-slate-700'
      }`}
    >
      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Color Palette
      </div>
      <div className="grid grid-cols-4 gap-2 mb-3">
        {colors.map((c) => (
          <button
            key={c.value}
            onClick={() => {
              onSelectColor(c.value);
              onClose();
            }}
            title={c.name}
            className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 flex items-center justify-center ${
              currentColor === c.value ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900 border-white' : 'border-slate-700'
            }`}
            style={{ backgroundColor: c.hex }}
          />
        ))}
      </div>

      <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
        Stroke Thickness
      </div>
      <div className="grid grid-cols-4 gap-1 bg-slate-800/80 p-1 rounded-lg">
        {(['s', 'm', 'l', 'xl'] as const).map((sz) => (
          <button
            key={sz}
            onClick={() => {
              onSelectSize(sz);
              onClose();
            }}
            className={`py-1 text-[11px] font-mono font-medium rounded text-center transition-colors ${
              currentSize === sz 
                ? 'bg-cyan-600 text-white font-bold' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sz.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
};

