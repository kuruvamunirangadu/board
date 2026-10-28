'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SharedSimulationState } from '@/types/collaboration';
import { Play, Pause, RotateCcw, Activity, Lock, Sliders, Zap } from 'lucide-react';

interface SynchronizedSimulationWidgetProps {
  simulationState: SharedSimulationState | null;
  isLocked: boolean;
  canEdit: boolean;
  onUpdateSimulation: (patch: Partial<SharedSimulationState>) => Promise<void>;
}

export const SynchronizedSimulationWidget: React.FC<SynchronizedSimulationWidgetProps> = ({
  simulationState,
  isLocked,
  canEdit,
  onUpdateSimulation,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const phaseCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Local physics state computed in lockstep with synchronized parameters
  const [theta, setTheta] = useState(0.785); // 45 deg
  const [omega, setOmega] = useState(0.0);
  const phaseHistoryRef = useRef<{ theta: number; omega: number }[]>([]);

  const params = simulationState?.parameters || {
    length: 2.0,
    gravity: 9.81,
    damping: 0.05,
    mass: 1.0,
  };

  const isRunning = simulationState?.isRunning ?? false;

  // Animation frame loop using Semi-Implicit Euler
  useEffect(() => {
    let animId: number;
    let lastTime = performance.now();

    const dt = 0.02; // fixed timestep for deterministic physical behavior
    const L = params.length || 2.0;
    const g = params.gravity || 9.81;
    const gamma = params.damping || 0.05;

    const loop = (time: number) => {
      if (isRunning) {
        // Semi-implicit Euler integration:
        // omega_{n+1} = omega_n - ((g/L)*sin(theta_n) + gamma*omega_n)*dt
        // theta_{n+1} = theta_n + omega_{n+1}*dt
        setTheta((prevTheta) => {
          let currentOmega = omega;
          const alpha = -(g / L) * Math.sin(prevTheta) - gamma * currentOmega;
          currentOmega += alpha * dt;
          setOmega(currentOmega);
          const nextTheta = prevTheta + currentOmega * dt;

          // Record phase point
          if (phaseHistoryRef.current.length > 200) {
            phaseHistoryRef.current.shift();
          }
          phaseHistoryRef.current.push({ theta: nextTheta, omega: currentOmega });

          return nextTheta;
        });
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isRunning, params.length, params.gravity, params.damping, omega]);

  // Render Pendulum Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const originX = width / 2;
    const originY = 40;
    const visualLength = (params.length || 2.0) * 55;

    const bobX = originX + visualLength * Math.sin(theta);
    const bobY = originY + visualLength * Math.cos(theta);

    // Draw Pivot
    ctx.fillStyle = '#64748b';
    ctx.fillRect(originX - 25, originY - 6, 50, 6);
    ctx.beginPath();
    ctx.arc(originX, originY, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    // Draw Rod with cyan glow
    ctx.beginPath();
    ctx.moveTo(originX, originY);
    ctx.lineTo(bobX, bobY);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw Bob
    const bobRadius = 14 * Math.sqrt(params.mass || 1.0);
    ctx.beginPath();
    ctx.arc(bobX, bobY, bobRadius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
      bobX - bobRadius * 0.3,
      bobY - bobRadius * 0.3,
      bobRadius * 0.2,
      bobX,
      bobY,
      bobRadius
    );
    grad.addColorStop(0, '#67e8f9');
    grad.addColorStop(1, '#0e7490');
    ctx.fillStyle = grad;
    ctx.shadowColor = '#22d3ee';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#cffafe';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [theta, params.length, params.mass]);

  // Render Phase Space Graph
  useEffect(() => {
    const canvas = phaseCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    const cx = width / 2;
    const cy = height / 2;

    // Axes
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.stroke();

    // Trajectory
    const history = phaseHistoryRef.current;
    if (history.length > 1) {
      ctx.beginPath();
      const scaleX = 30; // theta scale
      const scaleY = 15; // omega scale

      ctx.moveTo(cx + history[0].theta * scaleX, cy - history[0].omega * scaleY);
      for (let i = 1; i < history.length; i++) {
        ctx.lineTo(cx + history[i].theta * scaleX, cy - history[i].omega * scaleY);
      }
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.shadowColor = '#a855f7';
      ctx.shadowBlur = 6;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Current point
      const last = history[history.length - 1];
      ctx.beginPath();
      ctx.arc(cx + last.theta * scaleX, cy - last.omega * scaleY, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#f43f5e';
      ctx.fill();
    }
  }, [theta, omega]);

  const handleTogglePlay = async () => {
    if (isLocked && !canEdit) return;
    await onUpdateSimulation({
      isRunning: !isRunning,
    });
  };

  const handleReset = async () => {
    if (isLocked && !canEdit) return;
    setTheta(0.785);
    setOmega(0.0);
    phaseHistoryRef.current = [];
    await onUpdateSimulation({
      isRunning: false,
      currentTime: 0,
      stepIndex: 0,
    });
  };

  const handleParamChange = async (key: string, value: number) => {
    if (isLocked && !canEdit) return;
    await onUpdateSimulation({
      parameters: {
        ...params,
        [key]: value,
      },
    });
  };

  // Energy calculations
  const L = params.length || 2.0;
  const m = params.mass || 1.0;
  const g = params.gravity || 9.81;
  const kinetic = 0.5 * m * Math.pow(L * omega, 2);
  const potential = m * g * L * (1 - Math.cos(theta));
  const totalEnergy = kinetic + potential;

  return (
    <div className="rounded-xl border border-cyan-500/30 bg-slate-900/60 p-4 backdrop-blur-md">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-cyan-500/20">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
            Synchronized Nonlinear Pendulum
          </h3>
          <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono text-cyan-300">
            v{simulationState?.stateVersion ?? 1}
          </span>
        </div>

        {simulationState?.lastActorName && (
          <span className="text-[11px] text-slate-400">
            Last update by: <span className="text-cyan-300 font-semibold">{simulationState.lastActorName}</span>
          </span>
        )}
      </div>

      {/* Main Simulation View & Phase Space */}
      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pendulum Display */}
        <div className="relative rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col items-center justify-center min-h-[220px]">
          <canvas ref={canvasRef} width={260} height={200} className="w-full max-w-[260px]" />
          <div className="absolute top-2 left-2 text-[10px] font-mono text-slate-500">
            Physical Space
          </div>
          <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-mono text-slate-400">
            <span>θ: {(theta * (180 / Math.PI)).toFixed(1)}°</span>
            <span>ω: {omega.toFixed(2)} rad/s</span>
          </div>
        </div>

        {/* Phase Space Portrait */}
        <div className="relative rounded-lg border border-slate-800 bg-slate-950/80 p-3 flex flex-col items-center justify-center min-h-[220px]">
          <canvas ref={phaseCanvasRef} width={260} height={200} className="w-full max-w-[260px]" />
          <div className="absolute top-2 left-2 text-[10px] font-mono text-purple-400">
            Phase Space (θ vs ω)
          </div>
          <div className="absolute bottom-2 left-3 flex gap-3 text-[10px] font-mono text-purple-300">
            <span>Energy: {totalEnergy.toFixed(2)} J</span>
            <span>T: {kinetic.toFixed(2)} J</span>
            <span>V: {potential.toFixed(2)} J</span>
          </div>
        </div>
      </div>

      {/* Synchronized Control Toolbar */}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800">
        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePlay}
            disabled={isLocked && !canEdit}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-all ${
              isRunning
                ? 'border-amber-500/40 bg-amber-500/20 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.2)]'
                : 'border-cyan-500/40 bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30'
            } ${isLocked && !canEdit ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {isRunning ? 'Pause Sim' : 'Play Sim'}
          </button>

          <button
            onClick={handleReset}
            disabled={isLocked && !canEdit}
            className={`flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition-colors ${
              isLocked && !canEdit ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>

          {isLocked && (
            <span className="flex items-center gap-1 text-[11px] text-amber-400 font-medium">
              <Lock className="h-3 w-3" /> Locked by instructor
            </span>
          )}
        </div>

        <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
          <Zap className="h-3 w-3" /> Symplectic Integrator (dt=0.02s)
        </div>
      </div>

      {/* Parameter Sliders */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-800/80">
        {/* Length Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Length (L)</span>
            <span className="font-mono text-cyan-300 font-bold">{(params.length || 2.0).toFixed(2)} m</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="3.5"
            step="0.1"
            value={params.length || 2.0}
            disabled={isLocked && !canEdit}
            onChange={(e) => handleParamChange('length', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Gravity Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Gravity (g)</span>
            <span className="font-mono text-cyan-300 font-bold">{(params.gravity || 9.81).toFixed(2)} m/s²</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="25.0"
            step="0.5"
            value={params.gravity || 9.81}
            disabled={isLocked && !canEdit}
            onChange={(e) => handleParamChange('gravity', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Damping Slider */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px]">
            <span className="text-slate-400">Damping (γ)</span>
            <span className="font-mono text-cyan-300 font-bold">{(params.damping || 0.05).toFixed(3)}</span>
          </div>
          <input
            type="range"
            min="0.0"
            max="0.4"
            step="0.01"
            value={params.damping || 0.05}
            disabled={isLocked && !canEdit}
            onChange={(e) => handleParamChange('damping', parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer disabled:opacity-50"
          />
        </div>
      </div>
    </div>
  );
};

