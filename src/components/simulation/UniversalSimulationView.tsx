'use client';

import React, { useState } from 'react';
import { PendulumSimulationView } from './PendulumSimulationView';
import { ProjectileSimulationView } from './ProjectileSimulationView';
import { ForceVectorSimulationView } from './ForceVectorSimulationView';
import { Activity, Compass, Gauge } from 'lucide-react';
import { PendulumParams } from '@/types/simulation';

export type SimulationType = 'pendulum' | 'projectile' | 'vector_force';

interface UniversalSimulationViewProps {
  initialSimulationType?: string;
  initialParams?: Partial<PendulumParams>;
  onUpdateParams?: (params: any) => void;
  onUpdateSimulationType?: (simulationType: SimulationType) => void;
  isImmersive?: boolean;
}

export const UniversalSimulationView: React.FC<UniversalSimulationViewProps> = ({
  initialSimulationType = 'pendulum',
  initialParams,
  onUpdateParams,
  onUpdateSimulationType,
  isImmersive = false,
}) => {
  const normalizeType = (t: string): SimulationType => {
    const lower = (t || '').toLowerCase();
    if (lower.includes('projectile') || lower.includes('kinematic') || lower.includes('trajectory')) return 'projectile';
    if (lower.includes('force') || lower.includes('vector') || lower.includes('f_ma') || lower.includes('f = ma')) return 'vector_force';
    return 'pendulum';
  };

  const [activeSim, setActiveSim] = useState<SimulationType>(() => normalizeType(initialSimulationType));

  const handleSelectSim = (sim: SimulationType) => {
    setActiveSim(sim);
    onUpdateSimulationType?.(sim);
  };

  return (
    <div className="relative w-full h-full flex flex-col" onPointerDown={(e) => e.stopPropagation()}>
      {/* Top Simulation Switcher Toolbar */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded-xl border border-slate-800 backdrop-blur-md shadow-lg pointer-events-auto">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectSim('pendulum');
          }}
          title="Harmonic Pendulum Simulation"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeSim === 'pendulum'
              ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-3 h-3" />
          <span>Pendulum</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectSim('projectile');
          }}
          title="2D Projectile Trajectory Simulation"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeSim === 'projectile'
              ? 'bg-amber-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Compass className="w-3 h-3" />
          <span>Projectile</span>
        </button>

        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSelectSim('vector_force');
          }}
          title="Newton's Second Law Dynamic Cart (F = ma)"
          className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
            activeSim === 'vector_force'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Gauge className="w-3 h-3" />
          <span>F = ma</span>
        </button>
      </div>

      {/* Render Active Simulation Component */}
      <div className="flex-1 w-full h-full">
        {activeSim === 'pendulum' && (
          <PendulumSimulationView
            initialParams={initialParams}
            onUpdateParams={onUpdateParams}
            isImmersive={isImmersive}
          />
        )}
        {activeSim === 'projectile' && (
          <ProjectileSimulationView
            onUpdateParams={onUpdateParams}
            isImmersive={isImmersive}
          />
        )}
        {activeSim === 'vector_force' && (
          <ForceVectorSimulationView
            onUpdateParams={onUpdateParams}
            isImmersive={isImmersive}
          />
        )}
      </div>
    </div>
  );
};

