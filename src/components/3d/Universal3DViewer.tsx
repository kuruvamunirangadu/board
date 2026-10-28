'use client';

import React, { useState } from 'react';
import { Heart3DViewer } from './Heart3DViewer';
import { Molecule3DViewer } from './Molecule3DViewer';
import { Math3DViewer } from './Math3DViewer';
import { Brain3DViewer } from './Brain3DViewer';
import { GeometricSolids3DViewer } from './GeometricSolids3DViewer';
import { Heart, Orbit, Compass, Brain, Box } from 'lucide-react';

export type Model3DType =
  | 'heart'
  | 'molecule'
  | 'vectors_3d'
  | 'nervous_system'
  | 'neuron'
  | 'geometric_solids';

interface Universal3DViewerProps {
  initialModelType?: string;
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  isPulsing?: boolean;
  onUpdateTransform?: (props: any) => void;
  onUpdateModelType?: (modelType: Model3DType) => void;
  isImmersive?: boolean;
}

export const Universal3DViewer: React.FC<Universal3DViewerProps> = ({
  initialModelType = 'heart',
  rotationX = 0.2,
  rotationY = -0.4,
  zoom = 1,
  isPulsing = true,
  onUpdateTransform,
  onUpdateModelType,
  isImmersive = false,
}) => {
  // Normalize initial model type
  const normalizeType = (t: string): Model3DType => {
    const lower = (t || '').toLowerCase();
    if (
      lower.includes('neuron') ||
      lower.includes('synapse') ||
      lower.includes('dendrite') ||
      lower.includes('axon')
    ) {
      return 'neuron';
    }
    if (
      lower.includes('nervous') ||
      lower.includes('brain') ||
      lower.includes('spine') ||
      lower.includes('neuro') ||
      lower.includes('cns') ||
      lower.includes('pns')
    ) {
      return 'nervous_system';
    }
    if (
      lower.includes('solid') ||
      lower.includes('polyhedr') ||
      lower.includes('cube') ||
      lower.includes('tetrahedr') ||
      lower.includes('octahedr') ||
      lower.includes('dodecahedr') ||
      lower.includes('icosahedr') ||
      lower.includes('euler')
    ) {
      return 'geometric_solids';
    }
    if (lower.includes('molecule') || lower.includes('chemistry') || lower.includes('atom')) return 'molecule';
    if (lower.includes('math') || lower.includes('vector') || lower.includes('geometry') || lower.includes('cosine')) return 'vectors_3d';
    return 'heart';
  };

  const [activeModel, setActiveModel] = useState<Model3DType>(() => normalizeType(initialModelType));

  const handleSelectModel = (model: Model3DType) => {
    setActiveModel(model);
    onUpdateModelType?.(model);
  };

  return (
    <div className="relative w-full h-full flex flex-col" onPointerDown={(e) => e.stopPropagation()}>
      {/* Top Model Switcher Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('nervous_system');
          }}
          title="3D Nervous System (CNS & PNS)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'nervous_system'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Brain className="w-3 h-3" />
          <span>Nervous System</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('neuron');
          }}
          title="3D Multipolar Neuron & Synapse"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'neuron'
              ? 'bg-pink-500 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Brain className="w-3 h-3" />
          <span>Neuron</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('heart');
          }}
          title="3D Heart Anatomy (Biology)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'heart'
              ? 'bg-red-500 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Heart className="w-3 h-3" />
          <span>Heart</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('molecule');
          }}
          title="3D Molecular Structure (Chemistry)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'molecule'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Orbit className="w-3 h-3" />
          <span>Molecule</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('vectors_3d');
          }}
          title="3D Vectors & Geometry (Mathematics)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'vectors_3d'
              ? 'bg-purple-500 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-3 h-3" />
          <span>Vectors</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectModel('geometric_solids');
          }}
          title="3D Geometric Solids & Polyhedra (Mathematics)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeModel === 'geometric_solids'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Box className="w-3 h-3" />
          <span>Solids</span>
        </button>
      </div>

      {/* Render Active 3D Viewer */}
      <div className="flex-1 w-full h-full">
        {activeModel === 'nervous_system' && (
          <Brain3DViewer
            initialViewMode="cns"
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            isPulsing={isPulsing}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
        {activeModel === 'neuron' && (
          <Brain3DViewer
            initialViewMode="neuron"
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            isPulsing={isPulsing}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
        {activeModel === 'heart' && (
          <Heart3DViewer
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            isPulsing={isPulsing}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
        {activeModel === 'molecule' && (
          <Molecule3DViewer
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
        {activeModel === 'vectors_3d' && (
          <Math3DViewer
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
        {activeModel === 'geometric_solids' && (
          <GeometricSolids3DViewer
            rotationX={rotationX}
            rotationY={rotationY}
            zoom={zoom}
            onUpdateTransform={onUpdateTransform}
            isImmersive={isImmersive}
          />
        )}
      </div>
    </div>
  );
};
