/**
 * VisiOS — Rapier 2D Interactive Physics Sandbox
 *
 * Real-time rigid-body collision, gravity, restitution, and dynamic physical interactions.
 */

import React, { useEffect, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Plus, Activity, ShieldCheck } from 'lucide-react';
import { PhysicsRapierAdapter, RapierBodySnapshot } from '../adapters/PhysicsRapierAdapter';

export const RapierPhysicsSandbox: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [adapter] = useState(() => new PhysicsRapierAdapter());
  const [isRunning, setIsRunning] = useState(true);
  const [gravityY, setGravityY] = useState(-9.81);
  const [restitution, setRestitution] = useState(0.8);
  const [bodyCount, setBodyCount] = useState(0);
  const [fps, setFps] = useState(60);

  const animRef = useRef<number | null>(null);
  const bodiesRef = useRef<RapierBodySnapshot[]>([]);

  useEffect(() => {
    let mounted = true;
    adapter.initWasm().then(() => {
      if (!mounted) return;
      initSandbox();
    });

    return () => {
      mounted = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
      adapter.reset();
    };
  }, []);

  const initSandbox = () => {
    adapter.createWorld(gravityY);
    // Add boundaries (ground, left, right walls)
    adapter.addGround(0, 30, 0.5);
    adapter.addBox(-12, 8, 0.5, 10, 0.2);
    adapter.addBox(12, 8, 0.5, 10, 0.2);

    // Initial drop of spheres
    for (let i = -3; i <= 3; i++) {
      adapter.addBall(i * 2, 8 + Math.random() * 4, 0.6, restitution);
    }
    setBodyCount(7);
  };

  const handleAddBall = () => {
    const x = (Math.random() - 0.5) * 10;
    const y = 10 + Math.random() * 4;
    const radius = 0.4 + Math.random() * 0.4;
    adapter.addBall(x, y, radius, restitution);
    setBodyCount((prev) => prev + 1);
  };

  const handleAddBox = () => {
    const x = (Math.random() - 0.5) * 8;
    const y = 10 + Math.random() * 3;
    adapter.addBox(x, y, 0.6, 0.6, restitution * 0.7);
    setBodyCount((prev) => prev + 1);
  };

  const handleReset = () => {
    initSandbox();
  };

  // Main animation loop
  useEffect(() => {
    if (!isRunning) return;

    let lastTime = performance.now();
    let frameCount = 0;
    let lastFpsUpdate = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Step physics
      const snapshots = adapter.step(dt || 1 / 60);
      bodiesRef.current = snapshots;

      // FPS tracking
      frameCount++;
      if (now - lastFpsUpdate >= 1000) {
        setFps(Math.round((frameCount * 1000) / (now - lastFpsUpdate)));
        frameCount = 0;
        lastFpsUpdate = now;
      }

      // Render onto canvas
      renderCanvas();
      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [isRunning]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.fillStyle = '#030712';
    ctx.fillRect(0, 0, width, height);

    // Coordinate mapping: center origin at (width/2, height - 40)
    const originX = width / 2;
    const originY = height - 50;
    const scale = 20; // 20px per meter

    const toScreenX = (x: number) => originX + x * scale;
    const toScreenY = (y: number) => originY - y * scale;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -14; x <= 14; x += 2) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), 0);
      ctx.lineTo(toScreenX(x), height);
      ctx.stroke();
    }
    for (let y = 0; y <= 16; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, toScreenY(y));
      ctx.lineTo(width, toScreenY(y));
      ctx.stroke();
    }

    // Draw Ground
    ctx.fillStyle = '#334155';
    ctx.fillRect(0, originY, width, 10);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(0, originY, width, 2);

    // Draw bodies
    bodiesRef.current.forEach((body, idx) => {
      const sx = toScreenX(body.x);
      const sy = toScreenY(body.y);

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(-body.rotation);

      if (body.type === 'dynamic') {
        const radius = 12;
        // Circle body
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(-3, -3, 2, 0, 0, radius);
        grad.addColorStop(0, '#818cf8');
        grad.addColorStop(1, '#4f46e5');
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = '#c7d2fe';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Orientation pointer
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(radius, 0);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        // Wall boundary
        ctx.fillStyle = '#1e293b';
        ctx.fillRect(-10, -200, 20, 400);
      }
      ctx.restore();
    });
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">Rapier 2D Physics Laboratory</h4>
            <div className="text-[10px] text-slate-400">
              Rigid-Body Collisions · Gravity & Restitution · 60 Hz Timestep
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-900 border border-slate-800 text-slate-300">
            {fps} FPS
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-bold">
            {bodyCount} Bodies
          </span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-xl border border-slate-800 overflow-hidden bg-slate-900 flex justify-center">
        <canvas ref={canvasRef} width={580} height={320} className="w-full max-w-[580px] h-[320px]" />
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isRunning ? 'Pause' : 'Resume'}
          </button>
          <button
            onClick={handleAddBall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Drop Sphere
          </button>
          <button
            onClick={handleAddBox}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Crate
          </button>
          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        </div>

        {/* Sliders */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Restitution:</span>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={restitution}
              onChange={(e) => setRestitution(parseFloat(e.target.value))}
              className="w-20 accent-indigo-500 h-1 bg-slate-800 rounded"
            />
            <span className="font-mono text-indigo-400 font-bold">{restitution.toFixed(2)}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400">Gravity:</span>
            <input
              type="range"
              min="-20"
              max="0"
              step="1"
              value={gravityY}
              onChange={(e) => {
                const g = parseFloat(e.target.value);
                setGravityY(g);
                adapter.createWorld(g);
              }}
              className="w-20 accent-emerald-500 h-1 bg-slate-800 rounded"
            />
            <span className="font-mono text-emerald-400 font-bold">{gravityY}m/s²</span>
          </div>
        </div>
      </div>
    </div>
  );
};
