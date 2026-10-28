'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, StepForward, Gauge, Compass } from 'lucide-react';

interface ProjectileParams {
  speed: number; // m/s
  angle: number; // degrees
  gravity: number; // m/s²
}

interface ProjectileSimulationViewProps {
  initialParams?: Partial<ProjectileParams>;
  onUpdateParams?: (params: ProjectileParams) => void;
  isImmersive?: boolean;
}

export const ProjectileSimulationView: React.FC<ProjectileSimulationViewProps> = ({
  initialParams,
  onUpdateParams,
  isImmersive = false,
}) => {
  const [speed, setSpeed] = useState(initialParams?.speed ?? 20); // m/s
  const [angle, setAngle] = useState(initialParams?.angle ?? 45); // degrees
  const [gravity, setGravity] = useState(initialParams?.gravity ?? 9.81); // m/s²
  const [isPlaying, setIsPlaying] = useState(true);
  const [simTime, setSimTime] = useState(0);

  const animFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(Date.now());

  // Theoretical calculations
  const angleRad = (angle * Math.PI) / 180;
  const vx0 = speed * Math.cos(angleRad);
  const vy0 = speed * Math.sin(angleRad);

  const totalTime = Math.max(0.1, (2 * vy0) / gravity);
  const maxHeight = Math.max(0, (vy0 * vy0) / (2 * gravity));
  const maxRange = Math.max(0, (speed * speed * Math.sin(2 * angleRad)) / gravity);

  // Current projectile position at simTime
  const currentX = Math.min(maxRange, vx0 * simTime);
  const currentY = Math.max(0, vy0 * simTime - 0.5 * gravity * simTime * simTime);
  const currentVx = vx0;
  const currentVy = vy0 - gravity * simTime;

  // Sync parameter changes
  useEffect(() => {
    onUpdateParams?.({ speed, angle, gravity });
  }, [speed, angle, gravity, onUpdateParams]);

  // Main animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    lastTimeRef.current = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      setSimTime((prev) => {
        const next = prev + dt;
        if (next >= totalTime + 0.5) {
          return 0; // Loop simulation
        }
        return next;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, totalTime]);

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSimTime(0);
    setIsPlaying(true);
    lastTimeRef.current = Date.now();
  };

  const handleStep = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(false);
    setSimTime((prev) => Math.min(totalTime, prev + 0.1));
  };

  // SVG Coordinate mapping (Stage: width 360, height 200, origin at bottom-left (30, 170))
  const stageOriginX = 35;
  const stageOriginY = 170;
  const scaleX = maxRange > 0 ? 290 / Math.max(maxRange, 10) : 10;
  const scaleY = maxHeight > 0 ? 120 / Math.max(maxHeight, 5) : 10;

  // Generate trajectory points for SVG path
  const numSteps = 40;
  const pathPoints: [number, number][] = [];
  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) * totalTime;
    const x = vx0 * t;
    const y = vy0 * t - 0.5 * gravity * t * t;
    pathPoints.push([stageOriginX + x * scaleX, stageOriginY - y * scaleY]);
  }
  const pathData = pathPoints.reduce((acc, [px, py], i) => `${acc} ${i === 0 ? 'M' : 'L'} ${px} ${py}`, '');

  const ballSvgX = stageOriginX + currentX * scaleX;
  const ballSvgY = stageOriginY - currentY * scaleY;

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
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>Projectile Kinematics</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                2D Motion
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
            onClick={handleStep}
            title="Step (+0.1s)"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <StepForward className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleReset}
            title="Reset"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* SVG Trajectory Canvas */}
      <div className="flex-1 relative overflow-hidden flex flex-col min-h-0">
        <svg viewBox="0 0 360 210" className="w-full h-full flex-1 touch-none">
          {/* Ground surface */}
          <line x1="20" y1={stageOriginY} x2="340" y2={stageOriginY} stroke="#475569" strokeWidth="2" />
          <line x1="20" y1={stageOriginY + 1} x2="340" y2={stageOriginY + 1} stroke="#1e293b" strokeWidth="6" />

          {/* Launcher Base */}
          <rect x={stageOriginX - 8} y={stageOriginY - 12} width="16" height="12" rx="2" fill="#334155" />
          {/* Launcher Barrel */}
          <line
            x1={stageOriginX}
            y1={stageOriginY}
            x2={stageOriginX + 20 * Math.cos(angleRad)}
            y2={stageOriginY - 20 * Math.sin(angleRad)}
            stroke="#0ea5e9"
            strokeWidth="5"
            strokeLinecap="round"
          />

          {/* Theoretical Trajectory Arc */}
          <path d={pathData} fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" opacity="0.6" />

          {/* Peak height indicator */}
          <line
            x1={stageOriginX + (maxRange / 2) * scaleX}
            y1={stageOriginY}
            x2={stageOriginX + (maxRange / 2) * scaleX}
            y2={stageOriginY - maxHeight * scaleY}
            stroke="#eab308"
            strokeWidth="1"
            strokeDasharray="2 2"
          />

          {/* Current Projectile Ball */}
          <circle cx={ballSvgX} cy={ballSvgY} r="6" fill="#38bdf8" stroke="#ffffff" strokeWidth="1.5" />

          {/* Velocity Vector Arrow */}
          <line
            x1={ballSvgX}
            y1={ballSvgY}
            x2={ballSvgX + (currentVx / speed) * 18}
            y2={ballSvgY - (currentVy / speed) * 18}
            stroke="#ef4444"
            strokeWidth="2"
          />
        </svg>

        {/* Real-time Telemetry Overlay */}
        <div className="absolute top-2 left-2 z-10 flex flex-col space-y-1 text-[9px] font-mono pointer-events-none">
          <div className="bg-slate-950/85 px-2 py-1 rounded border border-slate-800 backdrop-blur-md">
            <div>
              Range: <span className="text-cyan-300 font-bold">{maxRange.toFixed(1)} m</span>
            </div>
            <div>
              Apex Height: <span className="text-amber-300 font-bold">{maxHeight.toFixed(1)} m</span>
            </div>
            <div>
              Flight Time: <span className="text-purple-300 font-bold">{totalTime.toFixed(2)} s</span>
            </div>
          </div>
        </div>

        {/* Sliders Control Panel */}
        <div className="absolute top-2 right-2 z-10 bg-slate-950/85 border border-slate-800 rounded-xl p-2 max-w-[150px] backdrop-blur-md flex flex-col space-y-1 pointer-events-auto">
          <div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>v₀:</span>
              <span className="text-cyan-300">{speed} m/s</span>
            </div>
            <input
              type="range"
              min="10"
              max="40"
              step="1"
              value={speed}
              onChange={(e) => {
                e.stopPropagation();
                setSpeed(Number(e.target.value));
              }}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>θ:</span>
              <span className="text-cyan-300">{angle}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="80"
              step="5"
              value={angle}
              onChange={(e) => {
                e.stopPropagation();
                setAngle(Number(e.target.value));
              }}
              className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
            />
          </div>

          <div>
            <div className="flex justify-between text-[9px] text-slate-400 font-mono">
              <span>g:</span>
              <span className="text-amber-300">{gravity}</span>
            </div>
            <div className="flex space-x-1 mt-0.5">
              {[
                { name: 'Earth', g: 9.81 },
                { name: 'Moon', g: 1.62 },
                { name: 'Mars', g: 3.71 },
              ].map((p) => (
                <button
                  key={p.name}
                  onClick={(e) => {
                    e.stopPropagation();
                    setGravity(p.g);
                  }}
                  className={`text-[8px] px-1 py-0.5 rounded ${
                    gravity === p.g ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

