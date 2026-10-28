'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  StepForward, 
  Activity, 
  Sliders, 
  Zap, 
  Globe, 
  Gauge, 
  Info,
  BookmarkPlus,
  GitCompare
} from 'lucide-react';
import { PendulumParams, PendulumSimulationState } from '@/types/simulation';
import { 
  DEFAULT_PENDULUM_PARAMS, 
  PLANETARY_PRESETS, 
  createInitialState, 
  stepPendulumPhysics,
  calculateTheoreticalPeriod 
} from '@/features/simulation/pendulum-physics';
import { SaveCheckpointModal } from './SaveCheckpointModal';
import { ExperimentComparisonModal } from './ExperimentComparisonModal';

interface PendulumSimulationViewProps {
  initialParams?: Partial<PendulumParams>;
  onUpdateParams?: (params: PendulumParams) => void;
  isImmersive?: boolean;
  sessionId?: string;
}

export const PendulumSimulationView: React.FC<PendulumSimulationViewProps> = ({
  initialParams,
  onUpdateParams,
  isImmersive = false,
  sessionId = 'workspace-default',
}) => {
  const [params, setParams] = useState<PendulumParams>({
    ...DEFAULT_PENDULUM_PARAMS,
    ...initialParams,
  });

  const [isPlaying, setIsPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<'visual' | 'params' | 'charts'>('visual');
  const [physicsState, setPhysicsState] = useState<PendulumSimulationState>(() => createInitialState(params));

  // Modals for Milestone 8 checkpoints & comparison
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());
  const isDraggingBobRef = useRef(false);
  const svgRef = useRef<SVGSVGElement>(null);

  // Sync parameter updates to state and parent
  const handleParamChange = (key: keyof PendulumParams, value: number) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    onUpdateParams?.(updated);

    if (key === 'initialAngle' || key === 'gravity' || key === 'length') {
      const newPeriod = calculateTheoreticalPeriod(updated.length, updated.gravity, updated.initialAngle);
      setPhysicsState(prev => ({
        ...prev,
        period: newPeriod,
      }));
    }
  };

  // Reset simulation to initial angle
  const handleReset = () => {
    const fresh = createInitialState(params);
    setPhysicsState(fresh);
    lastTimeRef.current = Date.now();
  };

  // Step forward by a single frame (0.05s)
  const handleStep = () => {
    setIsPlaying(false);
    setPhysicsState(prev => stepPendulumPhysics(prev, params, 0.05));
  };

  // Main fixed-timestep physics loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = Date.now();

    const loop = () => {
      if (document.hidden) {
        lastTimeRef.current = Date.now();
        animFrameRef.current = requestAnimationFrame(loop);
        return;
      }

      const now = Date.now();
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05); // Cap delta to prevent spiral of death
      lastTimeRef.current = now;

      if (!isDraggingBobRef.current) {
        setPhysicsState(prev => stepPendulumPhysics(prev, params, dt));
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    const handleVisibilityChange = () => {
      lastTimeRef.current = Date.now();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, params]);

  // Interactive bob dragging
  const handlePointerDownBob = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingBobRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMoveSvg = (e: React.PointerEvent) => {
    if (!isDraggingBobRef.current || !svgRef.current) return;
    e.stopPropagation();

    const rect = svgRef.current.getBoundingClientRect();
    const pivotX = rect.width / 2;
    const pivotY = 50; // Pivot Y in SVG viewbox

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const dx = mouseX - pivotX;
    const dy = mouseY - pivotY;

    // Angle relative to straight down (0 = bottom)
    const newAngle = Math.atan2(dx, dy);

    setPhysicsState(prev => ({
      ...prev,
      angle: newAngle,
      angularVelocity: 0,
      angularAcceleration: -(params.gravity / params.length) * Math.sin(newAngle),
    }));
  };

  const handlePointerUpSvg = (e: React.PointerEvent) => {
    if (isDraggingBobRef.current) {
      e.stopPropagation();
      isDraggingBobRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
    }
  };

  // Geometry calculations for visual renderer
  const pivotX = 180;
  const pivotY = 40;
  const visualLength = Math.min(180, 50 + params.length * 35); // Visual scaling in SVG box

  const bobX = pivotX + visualLength * Math.sin(physicsState.angle);
  const bobY = pivotY + visualLength * Math.cos(physicsState.angle);

  // Velocity vector for visualization
  const velocityMagnitude = physicsState.angularVelocity * visualLength * 0.3;
  const velocityVectorX = bobX + velocityMagnitude * Math.cos(physicsState.angle);
  const velocityVectorY = bobY - velocityMagnitude * Math.sin(physicsState.angle);

  const angleDeg = (physicsState.angle * 180) / Math.PI;

  return (
    <div 
      className={`w-full h-full rounded-2xl flex flex-col overflow-hidden select-none transition-all ${
        isImmersive
          ? 'bg-slate-950/85 backdrop-blur-xl border border-cyan-500/40 text-slate-100 shadow-2xl shadow-cyan-950/50'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700 text-slate-100 shadow-xl'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/40 shrink-0">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Activity className="w-3.5 h-3.5 animate-pulse" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>Interactive Pendulum</span>
              <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                isImmersive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                Physics Sim
              </span>
            </div>
          </div>
        </div>

        {/* View tab toggles & Checkpoint Actions */}
        <div className="flex items-center space-x-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 text-[10px]">
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('visual'); }}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              activeTab === 'visual' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Visual
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('params'); }}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              activeTab === 'params' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Controls
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setActiveTab('charts'); }}
            className={`px-2 py-0.5 rounded font-medium transition-colors ${
              activeTab === 'charts' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            Charts
          </button>
        </div>
      </div>

      {/* Main interactive area */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        {/* TAB 1: VISUAL SIMULATION */}
        {activeTab === 'visual' && (
          <div className="flex-1 relative flex flex-col">
            {/* SVG Pendulum Stage */}
            <svg
              ref={svgRef}
              viewBox="0 0 360 230"
              onPointerMove={handlePointerMoveSvg}
              onPointerUp={handlePointerUpSvg}
              className="w-full h-full flex-1 touch-none"
            >
              {/* Reference Grid & Center Axis */}
              <line x1={pivotX} y1={pivotY} x2={pivotX} y2={pivotY + 175} stroke="#334155" strokeDasharray="3 3" strokeWidth="1" />
              
              {/* Angle Arc */}
              <path
                d={`M ${pivotX} ${pivotY + 45} A 45 45 0 0 ${physicsState.angle > 0 ? 1 : 0} ${pivotX + 45 * Math.sin(physicsState.angle)} ${pivotY + 45 * Math.cos(physicsState.angle)}`}
                fill="none"
                stroke={isImmersive ? '#22d3ee' : '#38bdf8'}
                strokeWidth="1.5"
                opacity="0.6"
              />

              {/* Pivot Support Mount */}
              <rect x={pivotX - 24} y={pivotY - 12} width="48" height="12" rx="4" fill="#1e293b" stroke="#475569" strokeWidth="1.5" />
              <circle cx={pivotX} cy={pivotY} r="4.5" fill={isImmersive ? '#06b6d4' : '#94a3b8'} />

              {/* Pendulum Rod */}
              <line
                x1={pivotX}
                y1={pivotY}
                x2={bobX}
                y2={bobY}
                stroke={isImmersive ? '#38bdf8' : '#cbd5e1'}
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              {/* Real-time Velocity Vector (tangential) */}
              {Math.abs(velocityMagnitude) > 2 && (
                <line
                  x1={bobX}
                  y1={bobY}
                  x2={velocityVectorX}
                  y2={velocityVectorY}
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="2 2"
                />
              )}

              {/* Pendulum Heavy Bob (Interactive Draggable) */}
              <circle
                cx={bobX}
                cy={bobY}
                r="16"
                fill={isImmersive ? 'url(#bobGlow)' : '#0ea5e9'}
                stroke="#ffffff"
                strokeWidth="2"
                onPointerDown={handlePointerDownBob}
                className="cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
              />

              {/* Glow filter definition */}
              <defs>
                <radialGradient id="bobGlow" cx="40%" cy="40%" r="60%">
                  <stop offset="0%" stopColor="#22d3ee" />
                  <stop offset="70%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#0369a1" />
                </radialGradient>
              </defs>
            </svg>

            {/* Live Measurements Telemetry HUD */}
            <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1 text-[10px] font-mono pointer-events-none">
              <div className="bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md">
                <span className="text-slate-400">Angle θ: </span>
                <span className="text-cyan-300 font-bold">{angleDeg.toFixed(1)}°</span>
                <span className="text-slate-500"> ({physicsState.angle.toFixed(2)} rad)</span>
              </div>
              <div className="bg-slate-950/80 px-2 py-1 rounded-md border border-slate-800 backdrop-blur-md">
                <span className="text-slate-400">Period T: </span>
                <span className="text-violet-300 font-bold">
                  {isFinite(physicsState.period) ? `${physicsState.period.toFixed(2)}s` : '∞'}
                </span>
              </div>
            </div>

            {/* Real-time Energy Balance Meter */}
            <div className="absolute bottom-2 left-2 right-2 z-10 flex items-center space-x-2 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 text-[10px] font-mono backdrop-blur-md pointer-events-none">
              <span className="text-slate-400 shrink-0">Energy:</span>
              <div className="flex-1 h-2 rounded-full overflow-hidden bg-slate-800 flex">
                <div 
                  className="bg-emerald-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (physicsState.kineticEnergy / (physicsState.totalEnergy || 1)) * 100)}%` }}
                  title="Kinetic Energy"
                />
                <div 
                  className="bg-cyan-500 transition-all duration-75"
                  style={{ width: `${Math.min(100, (physicsState.potentialEnergy / (physicsState.totalEnergy || 1)) * 100)}%` }}
                  title="Potential Energy"
                />
              </div>
              <span className="text-emerald-400 shrink-0">Ek</span>
              <span className="text-cyan-400 shrink-0">Ep</span>
            </div>
          </div>
        )}

        {/* TAB 2: PARAMETERS & PLANETARY PRESETS */}
        {activeTab === 'params' && (
          <div className="flex-1 p-3 overflow-y-auto space-y-3 text-xs">
            {/* Gravity & Planetary Presets */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Gravity (g):</span>
                <span className="font-mono text-cyan-400 font-bold">{params.gravity.toFixed(2)} m/s²</span>
              </div>
              <div className="grid grid-cols-5 gap-1">
                {PLANETARY_PRESETS.map((p) => (
                  <button
                    key={p.name}
                    onClick={(e) => { e.stopPropagation(); handleParamChange('gravity', p.g); }}
                    className={`py-1 rounded text-[10px] font-mono font-medium transition-colors ${
                      Math.abs(params.gravity - p.g) < 0.05
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                    title={`${p.name}: ${p.desc}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <input
                type="range"
                min="0"
                max="25"
                step="0.1"
                value={params.gravity}
                onChange={(e) => handleParamChange('gravity', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Length Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Length (L):</span>
                <span className="font-mono text-cyan-400 font-bold">{params.length.toFixed(2)} m</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="4.0"
                step="0.1"
                value={params.length}
                onChange={(e) => handleParamChange('length', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Damping / Air Resistance Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Damping (Friction):</span>
                <span className="font-mono text-cyan-400 font-bold">{params.damping.toFixed(3)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="0.2"
                step="0.005"
                value={params.damping}
                onChange={(e) => handleParamChange('damping', parseFloat(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>

            {/* Initial Angle Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Initial Release Angle:</span>
                <span className="font-mono text-cyan-400 font-bold">{params.initialAngle}°</span>
              </div>
              <input
                type="range"
                min="-170"
                max="170"
                step="5"
                value={params.initialAngle}
                onChange={(e) => handleParamChange('initialAngle', parseInt(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
            </div>
          </div>
        )}

        {/* TAB 3: REAL-TIME OSCILLATION WAVE CHART */}
        {activeTab === 'charts' && (
          <div className="flex-1 p-3 flex flex-col justify-between space-y-2 text-xs">
            <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
              <span>Oscillation Trace (θ vs t)</span>
              <span className="text-cyan-400">t = {physicsState.time.toFixed(1)}s</span>
            </div>

            {/* Wave Plot SVG */}
            <div className="w-full h-32 bg-slate-950/80 rounded-xl border border-slate-800 p-1 flex items-center relative overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 320 100" preserveAspectRatio="none">
                {/* Zero axis */}
                <line x1="0" y1="50" x2="320" y2="50" stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
                
                {/* Wave Polyline */}
                {physicsState.history.length > 2 && (
                  <polyline
                    fill="none"
                    stroke={isImmersive ? '#22d3ee' : '#38bdf8'}
                    strokeWidth="2"
                    points={physicsState.history
                      .map((pt, i) => {
                        const x = (i / (physicsState.history.length - 1)) * 320;
                        const y = 50 - (pt.angle / Math.PI) * 45;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ')}
                  />
                )}
              </svg>
            </div>

            <div className="p-2 rounded-lg bg-slate-800/40 border border-slate-700/60 text-[10px] text-slate-400 font-mono space-y-0.5">
              <div>• Equation: d²θ/dt² = -(g/L)sin(θ) - b·ω</div>
              <div>• Symplectic semi-implicit numerical integration</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-t border-slate-800 bg-slate-950/60 shrink-0">
        {/* Play / Pause / Step / Reset */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); setIsPlaying(!isPlaying); }}
            className={`p-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
            title={isPlaying ? 'Pause Simulation' : 'Run Simulation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleStep(); }}
            title="Step Forward (0.05s)"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); handleReset(); }}
            title="Reset to Initial Angle"
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Milestone 8: Experiment Checkpoints & Compare Buttons */}
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsSaveModalOpen(true); }}
            className="px-2 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-semibold flex items-center space-x-1 transition-all"
            title="Save named experiment checkpoint"
          >
            <BookmarkPlus className="w-3 h-3" />
            <span>Save</span>
          </button>

          <button
            onClick={(e) => { e.stopPropagation(); setIsCompareModalOpen(true); }}
            className="px-2 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 hover:text-white text-[10px] font-semibold flex items-center space-x-1 transition-all"
            title="Compare saved experiment checkpoints"
          >
            <GitCompare className="w-3 h-3" />
            <span>Compare</span>
          </button>
        </div>

        {/* Speed multiplier selector */}
        <div className="flex items-center space-x-1 text-[10px] font-mono">
          {[0.5, 1.0, 2.0].map((s) => (
            <button
              key={s}
              onClick={(e) => { e.stopPropagation(); handleParamChange('speed', s); }}
              className={`px-1.5 py-0.5 rounded transition-colors ${
                params.speed === s
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </div>

      {/* Checkpoint Modals */}
      <SaveCheckpointModal
        isOpen={isSaveModalOpen}
        onClose={() => setIsSaveModalOpen(false)}
        sessionId={sessionId}
        params={params}
        state={physicsState}
        isImmersive={isImmersive}
      />

      <ExperimentComparisonModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        sessionId={sessionId}
        isImmersive={isImmersive}
      />
    </div>
  );
};
