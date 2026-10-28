'use client';

import React from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { WorkspaceMode } from '@/types';

interface ViewControlsProps {
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToContent: () => void;
  mode: WorkspaceMode;
}

export const ViewControls: React.FC<ViewControlsProps> = ({
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToContent,
  mode,
}) => {
  const isImmersive = mode === 'immersive';
  const percentage = Math.round(zoomLevel * 100);

  return (
    <div
      className={`fixed bottom-6 left-6 z-40 flex items-center space-x-1 px-3 py-2 rounded-2xl shadow-xl transition-all duration-300 ${
        isImmersive
          ? 'bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 text-slate-100 shadow-cyan-950/40'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-200'
      }`}
    >
      <button
        onClick={onZoomOut}
        title="Zoom Out (Ctrl + -)"
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        onClick={onResetZoom}
        title="Reset Zoom to 100%"
        className="px-2 py-1 text-xs font-mono font-medium rounded-lg text-slate-300 hover:text-cyan-400 hover:bg-slate-800 transition-colors"
      >
        {percentage}%
      </button>

      <button
        onClick={onZoomIn}
        title="Zoom In (Ctrl + +)"
        className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-slate-700 mx-1" />

      <button
        onClick={onFitToContent}
        title="Fit to Content (Shift + 1)"
        className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
          isImmersive
            ? 'text-cyan-300 hover:bg-cyan-500/20'
            : 'text-slate-300 hover:text-white hover:bg-slate-800'
        }`}
      >
        <Maximize2 className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Fit</span>
      </button>
    </div>
  );
};

