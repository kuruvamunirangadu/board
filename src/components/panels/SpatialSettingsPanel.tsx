'use client';

import React from 'react';
import { Grid, Sparkles, Eye, Trash2 } from 'lucide-react';
import { WorkspaceMode, ImmersiveSettings } from '@/types';

interface SpatialSettingsPanelProps {
  mode: WorkspaceMode;
  settings: ImmersiveSettings;
  onUpdateSettings: (settings: Partial<ImmersiveSettings>) => void;
  onClearBoard: () => void;
}

export const SpatialSettingsPanel: React.FC<SpatialSettingsPanelProps> = ({
  mode,
  settings,
  onUpdateSettings,
  onClearBoard,
}) => {
  return (
    <div className="space-y-4">
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
        <div className="font-medium text-slate-200">
          Presentation Mode: <span className="capitalize text-cyan-400">{mode}</span>
        </div>
        <p className="text-slate-400 text-[11px]">
          {mode === 'immersive'
            ? 'Spatial environment with depth, floating HUD panels, and cyber matrix.'
            : 'Minimal clean slate mode for everyday focused study.'}
        </p>
      </div>

      <div className="space-y-3">
        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
          <div className="flex items-center space-x-2">
            <Grid className="w-4 h-4 text-cyan-400" />
            <span className="font-medium text-slate-200">Cyber Grid Matrix</span>
          </div>
          <input
            type="checkbox"
            checked={settings.showGrid}
            onChange={(e) => onUpdateSettings({ showGrid: e.target.checked })}
            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="font-medium text-slate-200">Spatial Nebula Glow</span>
          </div>
          <input
            type="checkbox"
            checked={settings.nebulaEffect}
            onChange={(e) => onUpdateSettings({ nebulaEffect: e.target.checked })}
            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
          />
        </label>

        <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/40 border border-slate-800 cursor-pointer">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="font-medium text-slate-200">HUD Glassmorphism</span>
          </div>
          <input
            type="checkbox"
            checked={settings.hudGlow}
            onChange={(e) => onUpdateSettings({ hudGlow: e.target.checked })}
            className="rounded bg-slate-900 border-slate-700 text-cyan-500 focus:ring-cyan-400"
          />
        </label>
      </div>

      <div className="pt-2 border-t border-slate-800">
        <button
          onClick={onClearBoard}
          className="w-full flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl bg-red-950/30 hover:bg-red-900/50 text-red-300 border border-red-900/40 transition-colors font-medium"
        >
          <Trash2 className="w-4 h-4" />
          <span>Clear Canvas Content</span>
        </button>
      </div>
    </div>
  );
};

