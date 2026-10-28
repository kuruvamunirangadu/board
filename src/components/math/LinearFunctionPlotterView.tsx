/**
 * VisiOS — Interactive Linear Function & Coordinate Plotter
 * Milestone 2: School Geometry & Animation Engine
 * Real-time 2D Cartesian plane plotting y = mx + c with slope triangle,
 * intercepts, animated probe traversal, and mathematically sound controls.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  Sliders,
  Sparkles,
  Layers,
  Grid,
  Info,
  CheckCircle2,
} from 'lucide-react';

export interface LinearFunctionPlotterProps {
  initialSlope?: number;
  initialIntercept?: number;
  interceptSymbol?: 'c' | 'b';
  equationTitle?: string;
  functionExpression?: string;
  onStampToCanvas?: () => void;
  isCompact?: boolean;
}

function evaluateFunction(expr: string, x: number): number {
  try {
    const clean = expr.toLowerCase().replace(/\s+/g, '');
    if (clean.includes('e^(cos(x))') || clean.includes('e^cos(x)') || clean.includes('exp(cos(x))')) {
      return Math.exp(Math.cos(x));
    }
    if (clean.includes('e^(sin(x))') || clean.includes('e^sin(x)') || clean.includes('exp(sin(x))')) {
      return Math.exp(Math.sin(x));
    }
    if (clean.includes('cos(x)') || clean.includes('cosx') || clean.includes('cos x') || clean === 'cos') return Math.cos(x);
    if (clean.includes('sin(x)') || clean.includes('sinx') || clean.includes('sin x') || clean === 'sin') return Math.sin(x);
    if (clean.includes('tan(x)') || clean.includes('tanx') || clean.includes('tan x') || clean === 'tan') return Math.tan(x);
    if (clean.includes('x^2') || clean.includes('x²')) return x * x;
    if (clean.includes('x^3') || clean.includes('x³')) return x * x * x;
    if (clean.includes('1/x')) return x !== 0 ? 1 / x : 0;
    if (clean.includes('sqrt(x)')) return x >= 0 ? Math.sqrt(x) : 0;
    if (clean.includes('e^x') || clean.includes('exp(x)') || clean === 'ex') return Math.exp(x);

    // Dynamic tokenized parser for standard mathematical expressions
    const sanitized = clean
      .replace(/^y=/, '')
      .replace(/cos\(x\)/g, `Math.cos(${x})`)
      .replace(/cosx/g, `Math.cos(${x})`)
      .replace(/sin\(x\)/g, `Math.sin(${x})`)
      .replace(/sinx/g, `Math.sin(${x})`)
      .replace(/tan\(x\)/g, `Math.tan(${x})`)
      .replace(/tanx/g, `Math.tan(${x})`)
      .replace(/exp\(([^)]+)\)/g, 'Math.exp($1)')
      .replace(/e\^\(([^)]+)\)/g, 'Math.exp($1)')
      .replace(/x\^2/g, `Math.pow(${x}, 2)`)
      .replace(/x/g, `(${x})`);

    // Strictly validate tokens before running Function to prevent arbitrary execution
    if (/^[0-9xMath\.\+\-\*\/\(\)\s,]+$/.test(sanitized)) {
      const val = new Function('Math', `return ${sanitized}`)(Math);
      return typeof val === 'number' && !isNaN(val) && isFinite(val) ? val : 0;
    }
    return 0;
  } catch {
    return 0;
  }
}

export const LinearFunctionPlotterView: React.FC<LinearFunctionPlotterProps> = ({
  initialSlope = 2,
  initialIntercept = 1,
  interceptSymbol = 'c',
  equationTitle,
  functionExpression,
  onStampToCanvas,
  isCompact = false,
}) => {
  // Parameters
  const [slope, setSlope] = useState<number>(initialSlope);
  const [intercept, setIntercept] = useState<number>(initialIntercept);
  const [activeExpr, setActiveExpr] = useState<string | undefined>(functionExpression);
  const [probeX, setProbeX] = useState<number>(1);
  const [showSlopeTriangle, setShowSlopeTriangle] = useState<boolean>(true);
  const [showIntercepts, setShowIntercepts] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);

  // Animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(1); // 0.5x, 1x, 2x
  const animDirectionRef = useRef<number>(1);
  const animFrameRef = useRef<number | null>(null);

  // Sync if initial props change
  useEffect(() => {
    setSlope(initialSlope);
  }, [initialSlope]);

  useEffect(() => {
    setIntercept(initialIntercept);
  }, [initialIntercept]);

  useEffect(() => {
    setActiveExpr(functionExpression);
  }, [functionExpression]);

  const isCurve = useMemo(() => {
    if (!activeExpr) return false;
    const lower = activeExpr.toLowerCase();
    return (
      lower.includes('cos') ||
      lower.includes('sin') ||
      lower.includes('tan') ||
      lower.includes('^') ||
      lower.includes('e^') ||
      lower.includes('exp(')
    );
  }, [activeExpr]);

  // Derived math
  const calculatedY = useMemo(() => {
    if (isCurve && activeExpr) {
      return Math.round(evaluateFunction(activeExpr, probeX) * 100) / 100;
    }
    return Math.round((slope * probeX + intercept) * 100) / 100;
  }, [slope, intercept, probeX, isCurve, activeExpr]);

  const xIntercept = useMemo(() => {
    if (isCurve) return null;
    if (slope === 0) return null;
    return Math.round((-intercept / slope) * 100) / 100;
  }, [slope, intercept, isCurve]);

  // SVG coordinate system mapping
  // SVG size: 400x320
  const width = 400;
  const height = 300;
  const originX = width / 2;
  const originY = height / 2;
  const scale = 22; // 22 pixels per unit

  const toSvgX = (x: number) => originX + x * scale;
  const toSvgY = (y: number) => originY - y * scale;
  const fromSvgX = (svgX: number) => (svgX - originX) / scale;

  // Compute curve path if active
  const curvePath = useMemo(() => {
    if (!isCurve || !activeExpr) return null;
    let d = '';
    const step = 0.1;
    for (let x = -8.5; x <= 8.5; x += step) {
      const y = evaluateFunction(activeExpr, x);
      if (isNaN(y) || !isFinite(y)) continue;
      const clampedY = Math.max(-12, Math.min(12, y));
      const sx = toSvgX(x);
      const sy = toSvgY(clampedY);
      if (!d) {
        d = `M ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      } else {
        d += ` L ${sx.toFixed(1)} ${sy.toFixed(1)}`;
      }
    }
    return d;
  }, [isCurve, activeExpr]);

  // Compute line endpoints across visible canvas [-8, 8]
  const xMin = -8.5;
  const xMax = 8.5;
  const lineP1 = { x: toSvgX(xMin), y: toSvgY(slope * xMin + intercept) };
  const lineP2 = { x: toSvgX(xMax), y: toSvgY(slope * xMax + intercept) };

  // Rate of change / Rise over Run triangle points
  // Base point at (probeX, probeY)
  // Run step: +1
  const triangleX1 = probeX;
  const triangleY1 = slope * probeX + intercept;
  const triangleX2 = probeX + 1;
  const triangleY2 = triangleY1;
  const triangleX3 = probeX + 1;
  const triangleY3 = slope * (probeX + 1) + intercept;

  // Animation Loop: sweep probeX back and forth between -6 and +6
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    let lastTime = performance.now();
    const animate = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      setProbeX((prev) => {
        let next = prev + animDirectionRef.current * 2.5 * animSpeed * dt;
        if (next > 5.5) {
          next = 5.5;
          animDirectionRef.current = -1;
        } else if (next < -5.5) {
          next = -5.5;
          animDirectionRef.current = 1;
        }
        return Math.round(next * 100) / 100;
      });

      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, animSpeed]);

  const handleReset = () => {
    setIsPlaying(false);
    setSlope(initialSlope);
    setIntercept(initialIntercept);
    setProbeX(1);
  };

  const handlePresetSelect = (m: number, c: number) => {
    setSlope(m);
    setIntercept(c);
  };

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-white">
              {equationTitle ||
                (isCurve
                  ? `Curve Analysis: y = ${activeExpr}`
                  : `Linear Function: y = ${slope}x ${intercept >= 0 ? '+ ' + intercept : '- ' + Math.abs(intercept)}`)}
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              {isCurve
                ? `Transcendental & Trigonometric Function Plotter`
                : `Slope-Intercept Form: y = m·x + ${interceptSymbol}`}
            </div>
          </div>
        </div>

        {/* Live Equation Badge */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 font-mono text-xs text-indigo-300 font-bold">
            {isCurve
              ? activeExpr?.startsWith('y')
                ? activeExpr
                : `y = ${activeExpr}`
              : `y = ${slope}x ${intercept >= 0 ? `+ ${intercept}` : `- ${Math.abs(intercept)}`}`}
          </div>
        </div>
      </div>

      {/* SVG Cartesian Canvas */}
      <div className="relative w-full flex justify-center bg-slate-900 rounded-xl border border-slate-800/80 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full max-w-[420px] h-[260px] sm:h-[300px]"
        >
          {/* Background Grid */}
          {showGrid && (
            <g opacity="0.18">
              {/* Vertical grid lines */}
              {Array.from({ length: 17 }, (_, i) => i - 8).map((x) => (
                <line
                  key={`gx_${x}`}
                  x1={toSvgX(x)}
                  y1={0}
                  x2={toSvgX(x)}
                  y2={height}
                  stroke={x === 0 ? '#94a3b8' : '#64748b'}
                  strokeWidth={x === 0 ? 1.5 : 0.7}
                  strokeDasharray={x === 0 ? undefined : '2,2'}
                />
              ))}
              {/* Horizontal grid lines */}
              {Array.from({ length: 13 }, (_, i) => i - 6).map((y) => (
                <line
                  key={`gy_${y}`}
                  x1={0}
                  y1={toSvgY(y)}
                  x2={width}
                  y2={toSvgY(y)}
                  stroke={y === 0 ? '#94a3b8' : '#64748b'}
                  strokeWidth={y === 0 ? 1.5 : 0.7}
                  strokeDasharray={y === 0 ? undefined : '2,2'}
                />
              ))}
            </g>
          )}

          {/* Coordinate Axes */}
          <line
            x1={10}
            y1={originY}
            x2={width - 10}
            y2={originY}
            stroke="#94a3b8"
            strokeWidth="1.8"
          />
          <line
            x1={originX}
            y1={height - 10}
            x2={originX}
            y2={10}
            stroke="#94a3b8"
            strokeWidth="1.8"
          />

          {/* Axis Labels */}
          <text x={width - 16} y={originY - 6} fill="#94a3b8" fontSize="10" fontWeight="bold">
            +x
          </text>
          <text x={originX + 8} y={16} fill="#94a3b8" fontSize="10" fontWeight="bold">
            +y
          </text>
          <text x={originX - 12} y={originY + 14} fill="#64748b" fontSize="9" fontStyle="italic">
            (0,0)
          </text>

          {/* Rate Triangle / Rise-over-Run */}
          {showSlopeTriangle && !isCurve && slope !== 0 && (
            <g opacity="0.9">
              {/* Horizontal Run */}
              <line
                x1={toSvgX(triangleX1)}
                y1={toSvgY(triangleY1)}
                x2={toSvgX(triangleX2)}
                y2={toSvgY(triangleY2)}
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeDasharray="3,2"
              />
              {/* Vertical Rise */}
              <line
                x1={toSvgX(triangleX2)}
                y1={toSvgY(triangleY2)}
                x2={toSvgX(triangleX3)}
                y2={toSvgY(triangleY3)}
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeDasharray="3,2"
              />
              {/* Rate Labels */}
              <text
                x={toSvgX((triangleX1 + triangleX2) / 2)}
                y={toSvgY(triangleY1) + (slope >= 0 ? 13 : -6)}
                fill="#38bdf8"
                fontSize="9"
                fontWeight="bold"
                textAnchor="middle"
              >
                Run: +1
              </text>
              <text
                x={toSvgX(triangleX2) + 6}
                y={toSvgY((triangleY2 + triangleY3) / 2) + 3}
                fill="#f43f5e"
                fontSize="9"
                fontWeight="bold"
              >
                Rise: {slope > 0 ? `+${slope}` : slope}
              </text>
            </g>
          )}

          {/* Continuous Graph Curve or Linear Line */}
          {isCurve && curvePath ? (
            <path
              d={curvePath}
              fill="none"
              stroke="#6366f1"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          ) : (
            <line
              x1={lineP1.x}
              y1={lineP1.y}
              x2={lineP2.x}
              y2={lineP2.y}
              stroke="#6366f1"
              strokeWidth="3.2"
              strokeLinecap="round"
            />
          )}

          {/* Key Intercept Points */}
          {showIntercepts && (
            <>
              {/* Y-Intercept: (0, c) */}
              <circle
                cx={toSvgX(0)}
                cy={toSvgY(intercept)}
                r="5"
                fill="#10b981"
                stroke="#022c22"
                strokeWidth="2"
              />
              <text
                x={toSvgX(0) + 7}
                y={toSvgY(intercept) - 4}
                fill="#34d399"
                fontSize="10"
                fontWeight="bold"
              >
                (0, {intercept}) [Y-Int]
              </text>

              {/* X-Intercept: (-c/m, 0) */}
              {xIntercept !== null && Math.abs(xIntercept) <= 8 && (
                <>
                  <circle
                    cx={toSvgX(xIntercept)}
                    cy={toSvgY(0)}
                    r="5"
                    fill="#f59e0b"
                    stroke="#451a03"
                    strokeWidth="2"
                  />
                  <text
                    x={toSvgX(xIntercept)}
                    y={toSvgY(0) + (xIntercept >= 0 ? 15 : -8)}
                    fill="#fbbf24"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    ({xIntercept}, 0) [X-Int]
                  </text>
                </>
              )}
            </>
          )}

          {/* Dynamic Probe Point P(x, y) */}
          <circle
            cx={toSvgX(probeX)}
            cy={toSvgY(calculatedY)}
            r="6"
            fill="#38bdf8"
            stroke="#ffffff"
            strokeWidth="2"
            className="animate-pulse"
          />
          {/* Probe coordinate callout */}
          <g>
            <rect
              x={toSvgX(probeX) - 34}
              y={toSvgY(calculatedY) - 28}
              width="68"
              height="20"
              rx="5"
              fill="rgba(15, 23, 42, 0.9)"
              stroke="#38bdf8"
              strokeWidth="1"
            />
            <text
              x={toSvgX(probeX)}
              y={toSvgY(calculatedY) - 15}
              fill="#e2e8f0"
              fontSize="10"
              fontWeight="bold"
              textAnchor="middle"
              fontFamily="monospace"
            >
              ({probeX}, {calculatedY})
            </text>
          </g>
        </svg>

        {/* Floating Quick Legend */}
        <div className="absolute bottom-2 left-2 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
          <span className="flex items-center gap-1 text-indigo-400">
            <span className="w-2.5 h-0.5 bg-indigo-500 rounded" /> Line
          </span>
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Y-Int
          </span>
          {xIntercept !== null && (
            <span className="flex items-center gap-1 text-amber-400">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> X-Int
            </span>
          )}
          <span className="flex items-center gap-1 text-cyan-400">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Probe
          </span>
        </div>
      </div>

      {/* Interactive Parameter Controls */}
      {isCurve ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Amplitude / Scale Slider */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Amplitude Scale (A):</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                A = {slope}
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="4"
              step="0.5"
              value={Math.max(0.5, Math.abs(slope))}
              onChange={(e) => setSlope(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>0.5× (Compressed)</span>
              <span>1.0× (Unit Scale)</span>
              <span>4.0× (Amplified)</span>
            </div>
          </div>

          {/* Vertical Shift (c) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Vertical Shift (C):
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                C = {intercept}
              </span>
            </div>
            <input
              type="range"
              min="-4"
              max="4"
              step="0.5"
              value={intercept}
              onChange={(e) => setIntercept(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-4 (Down)</span>
              <span>0 (Baseline)</span>
              <span>+4 (Up)</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {/* Slope Slider (m) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Slope (m) — Rate of Change:</span>
              <span className="font-mono font-bold text-indigo-400 text-sm">
                m = {slope}
              </span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.5"
              value={slope}
              onChange={(e) => setSlope(parseFloat(e.target.value))}
              className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-5 (Steep Fall)</span>
              <span>0 (Flat)</span>
              <span>+5 (Steep Rise)</span>
            </div>
          </div>

          {/* Y-Intercept Slider (c) */}
          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">
                Y-Intercept ({interceptSymbol}) — Vertical Offset:
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {interceptSymbol} = {intercept}
              </span>
            </div>
            <input
              type="range"
              min="-6"
              max="6"
              step="0.5"
              value={intercept}
              onChange={(e) => setIntercept(parseFloat(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500">
              <span>-6 (Down)</span>
              <span>0 (Origin)</span>
              <span>+6 (Up)</span>
            </div>
          </div>
        </div>
      )}

      {/* Coordinate Probe Slider (x) */}
      <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Explore Coordinate Value (x):</span>
          <span className="font-mono text-cyan-300 text-xs">
            At x = {probeX} → y = {calculatedY}
          </span>
        </div>
        <input
          type="range"
          min="-6"
          max="6"
          step="0.25"
          value={probeX}
          onChange={(e) => setProbeX(parseFloat(e.target.value))}
          className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
        />
      </div>

      {/* Animation & Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        {/* Playback Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setProbeX((prev) => Math.max(-6, Math.round((prev - 0.5) * 10) / 10))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs"
            title="Step Backward"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-900/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Animate Probe'}</span>
          </button>

          <button
            type="button"
            onClick={() => setProbeX((prev) => Math.min(6, Math.round((prev + 0.5) * 10) / 10))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs"
            title="Step Forward"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-xs"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Speed Toggle */}
          <div className="flex items-center rounded-lg bg-slate-900 border border-slate-800 p-0.5 text-[10px] font-mono">
            {[0.5, 1, 2].map((sp) => (
              <button
                key={sp}
                type="button"
                onClick={() => setAnimSpeed(sp)}
                className={`px-1.5 py-0.5 rounded transition-colors ${
                  animSpeed === sp
                    ? 'bg-indigo-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* View Toggles & Presets */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setShowSlopeTriangle(!showSlopeTriangle)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showSlopeTriangle
                ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Rise/Run Triangle
          </button>
          <button
            type="button"
            onClick={() => setShowIntercepts(!showIntercepts)}
            className={`px-2 py-1 rounded-lg text-[11px] font-medium border transition-colors ${
              showIntercepts
                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Intercepts
          </button>
        </div>
      </div>

      {/* Quick Mathematical Identity & Curve Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px]">
        <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Presets:</span>
        <button
          type="button"
          onClick={() => { setActiveExpr('e^(cos(x))'); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-cyan-300"
        >
          y = e^(cos(x))
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr('e^x'); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-cyan-300"
        >
          y = e^x
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr('cos(x)'); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-indigo-300"
        >
          y = cos(x)
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr('sin(x)'); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-amber-300"
        >
          y = sin(x)
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr(undefined); handlePresetSelect(2, 3); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
        >
          y = 2x + 3
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr(undefined); handlePresetSelect(-3, 5); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
        >
          y = -3x + 5
        </button>
        <button
          type="button"
          onClick={() => { setActiveExpr(undefined); handlePresetSelect(-1, 4); }}
          className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
        >
          y = -x + 4
        </button>
      </div>

      {/* Pedagogical Takeaway Box */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>Core Mathematical Relationship</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          {isCurve ? (
            <>
              • <strong>Periodic Oscillation & Curve Extrema:</strong> The function traces a continuous curve along the coordinate plane with bounded amplitude and symmetric periodicity.
              <br />
              • <strong>Instantaneous Behavior:</strong> At any coordinate probe point x = {probeX}, the probe displays the instantaneous value y = {calculatedY}. Derivatives dy/dx provide the instantaneous tangent slope along the curve.
            </>
          ) : (
            <>
              • <strong>Slope (m = {slope})</strong> dictates the rate of change and line direction. For every 1 unit of horizontal run, y changes by {slope} units.
              <br />
              • <strong>Y-Intercept ({interceptSymbol} = {intercept})</strong> is the vertical position where the line crosses the y-axis at (0, {intercept}). Modifying {interceptSymbol} translates the line vertically without changing its slope.
            </>
          )}
        </p>
      </div>
    </div>
  );
};

