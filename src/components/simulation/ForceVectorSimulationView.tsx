'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Activity, Gauge } from 'lucide-react';

interface ForceParams {
  force: number; // N
  mass: number; // kg
}

interface ForceVectorSimulationViewProps {
  initialParams?: Partial<ForceParams>;
  onUpdateParams?: (params: ForceParams) => void;
  isImmersive?: boolean;
}

export const ForceVectorSimulationView: React.FC<ForceVectorSimulationViewProps> = ({
  initialParams,
  onUpdateParams,
  isImmersive = false,
}) => {
  const [force, setForce] = useState(initialParams?.force ?? 20); // N
  const [mass, setMass] = useState(initialParams?.mass ?? 4); // kg
  const [isPlaying, setIsPlaying] = useState(true);

  const [cartX, setCartX] = useState(180); // track position
  const [velocity, setVelocity] = useState(0);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Acceleration: a = F / m
  const acceleration = force / Math.max(0.1, mass);

  useEffect(() => {
    onUpdateParams?.({ force, mass });
  }, [force, mass, onUpdateParams]);

  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - lastTimeRef.current) / 1000);
      lastTimeRef.current = now;

      setVelocity((v) => {
        const nextV = v + acceleration * dt;
        return nextV;
      });

      setCartX((x) => {
        let nextX = x + velocity * 15 * dt;
        // Bounce within track bounds [60, 300]
        if (nextX > 300) {
          nextX = 300;
          setVelocity((v) => -v * 0.7);
        } else if (nextX < 60) {
          nextX = 60;
          setVelocity((v) => -v * 0.7);
        }
        return nextX;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, acceleration, velocity]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCartX(180);
    setVelocity(0);
    setIsPlaying(true);
    lastTimeRef.current = Date.now();
  };

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col transition-all select-none ${
        isImmersive
          ? 'bg-slate-950/85 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/60'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-xl'
      }`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Simulation Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50 z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>Newtonian Force Dynamics</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                F = m · a
              </span>
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsPlaying(!isPlaying);
            }}
            className={`p-1 rounded-lg text-xs transition-colors ${
              isPlaying ? 'bg-cyan-500/20 text-cyan-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleReset}
            title="Reset to Center"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Track Stage */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <svg viewBox="0 0 360 210" className="w-full h-full flex-1 touch-none">
          {/* Guide Track */}
          <line x1="30" y1="140" x2="330" y2="140" stroke="#334155" strokeWidth="4" />
          <line x1="30" y1="144" x2="330" y2="144" stroke="#1e293b" strokeWidth="8" />

          {/* End Bumpers */}
          <rect x="25" y="115" width="8" height="30" rx="2" fill="#64748b" />
          <rect x="327" y="115" width="8" height="30" rx="2" fill="#64748b" />

          {/* Cart Body */}
          <rect
            x={cartX - 35}
            y={140 - 24 - mass * 1.5}
            width="70"
            height={20 + mass * 1.5}
            rx="4"
            fill="#0284c7"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />

          {/* Mass label inside cart */}
          <text
            x={cartX}
            y={140 - 10}
            textAnchor="middle"
            fill="#ffffff"
            fontSize="10"
            fontWeight="bold"
            fontFamily="monospace"
          >
            {mass} kg
          </text>

          {/* Wheels */}
          <circle cx={cartX - 22} cy="138" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />
          <circle cx={cartX + 22} cy="138" r="6" fill="#0f172a" stroke="#94a3b8" strokeWidth="2" />

          {/* Applied Force Vector (Red Arrow) */}
          {Math.abs(force) > 0.5 && (
            <g>
              <line
                x1={cartX}
                y1="100"
                x2={cartX + force * 1.5}
                y2="100"
                stroke="#ef4444"
                strokeWidth="3"
                markerEnd="url(#arrowhead)"
              />
              <text
                x={cartX + (force * 1.5) / 2}
                y="90"
                textAnchor="middle"
                fill="#ef4444"
                fontSize="10"
                fontWeight="bold"
                fontFamily="monospace"
              >
                F = {force} N
              </text>
            </g>
          )}

          {/* Acceleration Vector (Cyan Arrow) */}
          {Math.abs(acceleration) > 0.1 && (
            <line
              x1={cartX}
              y1="165"
              x2={cartX + acceleration * 6}
              y2="165"
              stroke="#22d3ee"
              strokeWidth="2.5"
            />
          )}

          {/* Arrowhead marker */}
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <polygon points="0 0, 6 3, 0 6" fill="#ef4444" />
            </marker>
          </defs>
        </svg>

        {/* Real-time Math HUD */}
        <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1 text-[9px] font-mono pointer-events-none">
          <div className="bg-slate-950/85 px-2 py-1.5 rounded-md border border-slate-800 backdrop-blur-md">
            <div>
              Force: <span className="text-red-400 font-bold">{force} N</span>
            </div>
            <div>
              Mass: <span className="text-sky-300 font-bold">{mass} kg</span>
            </div>
            <div>
              Acceleration: <span className="text-cyan-300 font-bold">a = {acceleration.toFixed(2)} m/s²</span>
            </div>
            <div>
              Velocity: <span className="text-emerald-300 font-bold">v = {velocity.toFixed(2)} m/s</span>
            </div>
          </div>
        </div>

        {/* Parameter Sliders */}
        <div className="absolute top-2 right-2 z-10 bg-slate-950/85 border border-slate-800 rounded-xl p-2 max-w-[150px] backdrop-blur-md flex flex-col space-y-1.5 pointer-events-auto">
          <div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Force F:</span>
              <span className="text-red-400 font-bold">{force} N</span>
            </div>
            <input
              type="range"
              min="-40"
              max="40"
              step="2"
              value={force}
              onChange={(e) => {
                e.stopPropagation();
                setForce(Number(e.target.value));
              }}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-red-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>Mass m:</span>
              <span className="text-sky-300 font-bold">{mass} kg</span>
            </div>
            <input
              type="range"
              min="1"
              max="15"
              step="1"
              value={mass}
              onChange={(e) => {
                e.stopPropagation();
                setMass(Number(e.target.value));
              }}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-sky-400"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

