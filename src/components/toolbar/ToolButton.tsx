'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { WorkspaceMode } from '@/types';

interface ToolButtonProps {
  icon: LucideIcon;
  label: string;
  hotkey?: string;
  isActive?: boolean;
  onClick: () => void;
  mode: WorkspaceMode;
}

export const ToolButton: React.FC<ToolButtonProps> = ({
  icon: Icon,
  label,
  hotkey,
  isActive = false,
  onClick,
  mode,
}) => {
  const isImmersive = mode === 'immersive';

  return (
    <button
      onClick={onClick}
      title={hotkey ? `${label} (${hotkey})` : label}
      className={`relative p-2.5 rounded-xl transition-all flex items-center justify-center ${
        isActive
          ? isImmersive
            ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-900/50 ring-1 ring-cyan-400/40'
            : 'bg-slate-800 text-cyan-400 font-semibold border border-slate-700'
          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
      }`}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
};

