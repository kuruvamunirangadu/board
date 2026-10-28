'use client';

import React, { useState } from 'react';
import {
  MousePointer,
  Hand,
  Pen,
  Eraser,
  Type,
  Square,
  Circle,
  Triangle,
  ArrowRight,
  Minus,
  Diamond,
  StickyNote,
  Box,
  Activity,
} from 'lucide-react';
import { WorkspaceMode, ToolType } from '@/types';
import { ToolButton } from './ToolButton';
import { StylePicker } from './StylePicker';

interface LeftToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  currentColor: string;
  onSelectColor: (color: string) => void;
  currentSize: 's' | 'm' | 'l' | 'xl';
  onSelectSize: (size: 's' | 'm' | 'l' | 'xl') => void;
  mode: WorkspaceMode;
}

export const LeftToolbar: React.FC<LeftToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  currentSize,
  onSelectSize,
  mode,
}) => {
  const isImmersive = mode === 'immersive';
  const [shapesMenuOpen, setShapesMenuOpen] = useState(false);
  const [stylePickerOpen, setStylePickerOpen] = useState(false);

  const shapeTools: { id: ToolType; label: string; icon: any }[] = [
    { id: 'rectangle', label: 'Rectangle', icon: Square },
    { id: 'ellipse', label: 'Ellipse', icon: Circle },
    { id: 'triangle', label: 'Triangle', icon: Triangle },
    { id: 'diamond', label: 'Diamond', icon: Diamond },
    { id: 'arrow', label: 'Arrow', icon: ArrowRight },
    { id: 'line', label: 'Line', icon: Minus },
  ];

  const isShapeActive = shapeTools.some((s) => s.id === activeTool);

  return (
    <aside
      className={`fixed left-4 top-20 z-40 flex flex-col items-center p-1.5 rounded-2xl shadow-xl transition-all duration-300 ${
        isImmersive
          ? 'bg-slate-900/80 backdrop-blur-xl border border-cyan-500/30 shadow-cyan-950/40 text-slate-100'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/80 text-slate-200'
      }`}
    >
      <div className="flex flex-col space-y-1 relative">
        <ToolButton
          icon={MousePointer}
          label="Select"
          hotkey="V"
          isActive={activeTool === 'select'}
          onClick={() => {
            onSelectTool('select');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        <ToolButton
          icon={Hand}
          label="Hand / Pan"
          hotkey="H / Space"
          isActive={activeTool === 'hand'}
          onClick={() => {
            onSelectTool('hand');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        <div className="w-full h-[1px] bg-slate-800 my-0.5" />

        <ToolButton
          icon={Pen}
          label="Pen / Draw"
          hotkey="D / P"
          isActive={activeTool === 'draw'}
          onClick={() => {
            onSelectTool('draw');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        <ToolButton
          icon={Eraser}
          label="Eraser"
          hotkey="E"
          isActive={activeTool === 'eraser'}
          onClick={() => {
            onSelectTool('eraser');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        <ToolButton
          icon={Type}
          label="Text Box"
          hotkey="T"
          isActive={activeTool === 'text'}
          onClick={() => {
            onSelectTool('text');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        <ToolButton
          icon={StickyNote}
          label="Sticky Note"
          hotkey="N"
          isActive={activeTool === 'note'}
          onClick={() => {
            onSelectTool('note');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        {/* 3D Interactive Model Placer */}
        <ToolButton
          icon={Box}
          label="3D Model (Heart, Molecule, Vectors)"
          hotkey="3"
          isActive={activeTool === 'model3d'}
          onClick={() => {
            onSelectTool('model3d');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        {/* Interactive Physics Simulation Placer */}
        <ToolButton
          icon={Activity}
          label="Physics Simulation (Pendulum, Projectile, F=ma)"
          hotkey="P"
          isActive={activeTool === 'simulation'}
          onClick={() => {
            onSelectTool('simulation');
            setShapesMenuOpen(false);
          }}
          mode={mode}
        />

        {/* Shapes Popup */}
        <div className="relative">
          <ToolButton
            icon={Square}
            label="Shapes"
            hotkey="R"
            isActive={isShapeActive}
            onClick={() => setShapesMenuOpen(!shapesMenuOpen)}
            mode={mode}
          />

          {shapesMenuOpen && (
            <div 
              className={`absolute left-14 top-0 flex flex-col p-1.5 rounded-xl shadow-2xl z-50 min-w-[140px] animate-in fade-in slide-in-from-left-2 duration-150 ${
                isImmersive
                  ? 'bg-slate-900/90 backdrop-blur-xl border border-cyan-500/30'
                  : 'bg-slate-900 border border-slate-700'
              }`}
            >
              <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Shapes
              </div>
              {shapeTools.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      onSelectTool(s.id);
                      setShapesMenuOpen(false);
                    }}
                    className={`flex items-center space-x-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTool === s.id
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{s.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="w-full h-[1px] bg-slate-800 my-0.5" />

        {/* Style & Color Picker Trigger */}
        <div className="relative">
          <button
            onClick={() => setStylePickerOpen(!stylePickerOpen)}
            title="Style & Color Palette"
            className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all flex items-center justify-center"
          >
            <div 
              className="w-4 h-4 rounded-full border border-slate-600 shadow-sm"
              style={{
                backgroundColor: currentColor === 'light-blue' ? '#06b6d4' : currentColor === 'grey' ? '#f8fafc' : currentColor
              }}
            />
          </button>

          {stylePickerOpen && (
            <StylePicker
              currentColor={currentColor}
              onSelectColor={onSelectColor}
              currentSize={currentSize}
              onSelectSize={onSelectSize}
              mode={mode}
              onClose={() => setStylePickerOpen(false)}
            />
          )}
        </div>
      </div>
    </aside>
  );
};
