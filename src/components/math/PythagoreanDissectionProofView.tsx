/**
 * VisiOS — Interactive Pythagorean Dissection Proof & Geometry Engine
 * Milestone 2: School Geometry & Animation Engine
 * Real-time dynamic right triangle, squares on all three sides,
 * 4-stage Chou Pei / Bhaskara area rearrangement proof animation,
 * and mathematically correct controls.
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
  Info,
  CheckCircle2,
  Maximize2,
} from 'lucide-react';

export interface PythagoreanDissectionProofProps {
  initialA?: number;
  initialB?: number;
  onStampToCanvas?: () => void;
  isCompact?: boolean;
}

export const PythagoreanDissectionProofView: React.FC<PythagoreanDissectionProofProps> = ({
  initialA = 3,
  initialB = 4,
  onStampToCanvas,
  isCompact = false,
}) => {
  // Geometry parameters
  const [a, setA] = useState<number>(initialA);
  const [b, setB] = useState<number>(initialB);
  const [proofMode, setProofMode] = useState<'rearrangement' | 'side_squares' | 'fluid_fill'>('rearrangement');

  // Animation state (0 to 3 stages)
  // Stage 0: Initial Separate Shapes (a² + b² and 4 triangles)
  // Stage 1: Triangles Glide into Corners of (a+b) Square
  // Stage 2: Central Tilted Square c² Formed & Highlighted
  // Stage 3: Full Area Conservation Identity Revealed
  const [stage, setStage] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Derived calculations
  const cSquared = useMemo(() => a * a + b * b, [a, b]);
  const c = useMemo(() => Math.sqrt(cSquared), [cSquared]);
  const formattedC = useMemo(() => (Number.isInteger(c) ? `${c}` : c.toFixed(2)), [c]);
  const aSquared = a * a;
  const bSquared = b * b;
  const triangleArea = 0.5 * a * b;
  const fourTrianglesArea = 4 * triangleArea; // = 2ab
  const totalOuterArea = (a + b) * (a + b); // = a² + 2ab + b²

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 2200 / animSpeed;
    timerRef.current = setInterval(() => {
      setStage((prev) => (prev < 3 ? prev + 1 : 0));
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, animSpeed]);

  const handleReset = () => {
    setIsPlaying(false);
    setStage(0);
    setA(initialA);
    setB(initialB);
  };

  const handlePresetSelect = (newA: number, newB: number) => {
    setA(newA);
    setB(newB);
  };

  // SVG dimensions for Chou Pei (a+b) square layout
  // Let total box be 340 x 300
  const boxSize = 250;
  const unitScale = boxSize / Math.max(a + b, 8);
  const scaledA = a * unitScale;
  const scaledB = b * unitScale;
  const offsetX = (360 - boxSize) / 2;
  const offsetY = 20;

  // Proof stage narrative
  const stageDescriptions = [
    {
      title: 'Stage 1: Deconstructing Squares & Right Triangles',
      narrative: `Square of leg a (${a}² = ${aSquared}) and square of leg b (${b}² = ${bSquared}) have combined area of ${aSquared} + ${bSquared} = ${cSquared}. Four identical right triangles each have area ½·${a}·${b} = ${triangleArea}.`,
    },
    {
      title: 'Stage 2: Forming the Outer Bounding Square of side (a + b)',
      narrative: `Position the 4 identical right triangles along the corners of an outer square of side (${a} + ${b}) = ${a + b}. The total bounding area is (${a} + ${b})² = ${totalOuterArea}.`,
    },
    {
      title: 'Stage 3: Revealing the Central Tilted Square c²',
      narrative: `The four triangles leave a central tilted quadrilateral with four equal sides c (${formattedC}) and 90° interior angles. This central inner square has area exactly c² = ${cSquared}.`,
    },
    {
      title: 'Stage 4: Formal Proof by Area Equivalence',
      narrative: `Total Area = 4 × Triangle + Central Square ⇒ a² + 2ab + b² = 2ab + c². Subtracting 2ab from both sides proves rigorously: a² + b² = c² (${aSquared} + ${bSquared} = ${cSquared})!`,
    },
  ];

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-xl">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <span className="font-semibold text-xs text-white">
              The Pythagorean Theorem: a² + b² = c²
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              Geometric Dissection & Area Conservation Proof
            </div>
          </div>
        </div>

        {/* Live Equation Badge */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 font-mono text-xs text-emerald-300 font-bold">
            {a}² + {b}² = {cSquared} (c = {formattedC})
          </div>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="grid grid-cols-2 gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setProofMode('rearrangement')}
          className={`py-1 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            proofMode === 'rearrangement'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Area Rearrangement Proof</span>
        </button>
        <button
          type="button"
          onClick={() => setProofMode('side_squares')}
          className={`py-1 px-3 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            proofMode === 'side_squares'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>3-Sided Squares Model</span>
        </button>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div className="relative w-full flex justify-center bg-slate-900 rounded-xl border border-slate-800/80 p-2 overflow-hidden select-none">
        {proofMode === 'rearrangement' ? (
          <svg viewBox="0 0 360 290" className="w-full max-w-[400px] h-[270px]">
            {/* Outer Bounding Square (a+b) */}
            <rect
              x={offsetX}
              y={offsetY}
              width={boxSize}
              height={boxSize}
              fill="rgba(15, 23, 42, 0.8)"
              stroke="#64748b"
              strokeWidth="2"
              strokeDasharray={stage === 0 ? '4,3' : undefined}
              rx="4"
            />

            {/* Stage 2 & 3: Central Tilted Square c² */}
            {(stage === 2 || stage === 3) && (
              <polygon
                points={`
                  ${offsetX + scaledA},${offsetY}
                  ${offsetX + boxSize},${offsetY + scaledA}
                  ${offsetX + boxSize - scaledA},${offsetY + boxSize}
                  ${offsetX},${offsetY + boxSize - scaledA}
                `}
                fill={stage === 3 ? 'rgba(244, 63, 94, 0.45)' : 'rgba(244, 63, 94, 0.25)'}
                stroke="#f43f5e"
                strokeWidth="2.5"
                className="transition-all duration-700"
              />
            )}

            {/* Central square label */}
            {(stage === 2 || stage === 3) && (
              <text
                x={offsetX + boxSize / 2}
                y={offsetY + boxSize / 2 + 4}
                fill="#fda4af"
                fontSize="12"
                fontWeight="bold"
                textAnchor="middle"
                className="font-mono"
              >
                c² = {cSquared}
              </text>
            )}

            {/* 4 Corner Triangles (Animated positions) */}
            {/* Triangle 1: Top-Left */}
            <polygon
              points={`
                ${offsetX},${offsetY}
                ${offsetX + (stage >= 1 ? scaledA : scaledA * 0.7)},${offsetY}
                ${offsetX},${offsetY + (stage >= 1 ? scaledB : scaledB * 0.7)}
              `}
              fill="rgba(56, 189, 248, 0.4)"
              stroke="#38bdf8"
              strokeWidth="1.8"
              className="transition-all duration-700"
            />

            {/* Triangle 2: Top-Right */}
            <polygon
              points={`
                ${offsetX + boxSize},${offsetY}
                ${offsetX + boxSize},${offsetY + (stage >= 1 ? scaledA : scaledA * 0.7)}
                ${offsetX + (stage >= 1 ? boxSize - scaledB : boxSize - scaledB * 0.7)},${offsetY}
              `}
              fill="rgba(56, 189, 248, 0.4)"
              stroke="#38bdf8"
              strokeWidth="1.8"
              className="transition-all duration-700"
            />

            {/* Triangle 3: Bottom-Right */}
            <polygon
              points={`
                ${offsetX + boxSize},${offsetY + boxSize}
                ${offsetX + (stage >= 1 ? boxSize - scaledA : boxSize - scaledA * 0.7)},${offsetY + boxSize}
                ${offsetX + boxSize},${offsetY + (stage >= 1 ? boxSize - scaledB : boxSize - scaledB * 0.7)}
              `}
              fill="rgba(56, 189, 248, 0.4)"
              stroke="#38bdf8"
              strokeWidth="1.8"
              className="transition-all duration-700"
            />

            {/* Triangle 4: Bottom-Left */}
            <polygon
              points={`
                ${offsetX},${offsetY + boxSize}
                ${offsetX},${offsetY + (stage >= 1 ? boxSize - scaledA : boxSize - scaledA * 0.7)}
                ${offsetX + (stage >= 1 ? scaledB : scaledB * 0.7)},${offsetY + boxSize}
              `}
              fill="rgba(56, 189, 248, 0.4)"
              stroke="#38bdf8"
              strokeWidth="1.8"
              className="transition-all duration-700"
            />

            {/* Stage 0: Show separate a² and b² square insets */}
            {stage === 0 && (
              <>
                {/* Square a² */}
                <rect
                  x={offsetX + 15}
                  y={offsetY + 15}
                  width={scaledA * 0.85}
                  height={scaledA * 0.85}
                  fill="rgba(168, 85, 247, 0.35)"
                  stroke="#c084fc"
                  strokeWidth="2"
                  rx="3"
                />
                <text
                  x={offsetX + 15 + (scaledA * 0.85) / 2}
                  y={offsetY + 15 + (scaledA * 0.85) / 2 + 4}
                  fill="#e9d5ff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  a² = {aSquared}
                </text>

                {/* Square b² */}
                <rect
                  x={offsetX + scaledA + 25}
                  y={offsetY + scaledA + 10}
                  width={scaledB * 0.8}
                  height={scaledB * 0.8}
                  fill="rgba(16, 185, 129, 0.35)"
                  stroke="#34d399"
                  strokeWidth="2"
                  rx="3"
                />
                <text
                  x={offsetX + scaledA + 25 + (scaledB * 0.8) / 2}
                  y={offsetY + scaledA + 10 + (scaledB * 0.8) / 2 + 4}
                  fill="#d1fae5"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  b² = {bSquared}
                </text>
              </>
            )}

            {/* Dimension Indicators around periphery */}
            <text x={offsetX + scaledA / 2} y={offsetY - 6} fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
              a = {a}
            </text>
            <text x={offsetX + scaledA + scaledB / 2} y={offsetY - 6} fill="#38bdf8" fontSize="10" textAnchor="middle" fontWeight="bold">
              b = {b}
            </text>
            <text x={offsetX - 8} y={offsetY + scaledB / 2} fill="#38bdf8" fontSize="10" textAnchor="end" fontWeight="bold">
              b = {b}
            </text>
            <text x={offsetX - 8} y={offsetY + scaledB + scaledA / 2} fill="#38bdf8" fontSize="10" textAnchor="end" fontWeight="bold">
              a = {a}
            </text>
          </svg>
        ) : (
          /* Side Squares Construction View */
          <svg viewBox="0 0 360 290" className="w-full max-w-[400px] h-[270px]">
            {(() => {
              // Right triangle origin at (150, 180)
              const triX = 145;
              const triY = 175;
              const sA = a * 12;
              const sB = b * 12;

              return (
                <g>
                  {/* Square on Leg a (horizontal) */}
                  <rect
                    x={triX}
                    y={triY}
                    width={sA}
                    height={sA}
                    fill="rgba(168, 85, 247, 0.25)"
                    stroke="#c084fc"
                    strokeWidth="2"
                  />
                  <text x={triX + sA / 2} y={triY + sA / 2 + 4} fill="#e9d5ff" fontSize="10" fontWeight="bold" textAnchor="middle">
                    a² = {aSquared}
                  </text>

                  {/* Square on Leg b (vertical) */}
                  <rect
                    x={triX - sB}
                    y={triY - sB}
                    width={sB}
                    height={sB}
                    fill="rgba(16, 185, 129, 0.25)"
                    stroke="#34d399"
                    strokeWidth="2"
                  />
                  <text x={triX - sB / 2} y={triY - sB / 2 + 4} fill="#d1fae5" fontSize="10" fontWeight="bold" textAnchor="middle">
                    b² = {bSquared}
                  </text>

                  {/* Central Right Triangle */}
                  <polygon
                    points={`${triX},${triY} ${triX + sA},${triY} ${triX},${triY - sB}`}
                    fill="rgba(56, 189, 248, 0.5)"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                  />

                  {/* Right angle marker */}
                  <rect x={triX} y={triY - 8} width="8" height="8" fill="none" stroke="#f59e0b" strokeWidth="1.5" />

                  {/* Hypotenuse square tilted indicator */}
                  <line x1={triX + sA} y1={triY} x2={triX} y2={triY - sB} stroke="#f43f5e" strokeWidth="3" />
                  <text
                    x={triX + sA / 2 - 8}
                    y={triY - sB / 2 - 8}
                    fill="#fda4af"
                    fontSize="11"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Hypotenuse c = {formattedC}
                  </text>
                  <text
                    x={triX + sA / 2 - 8}
                    y={triY - sB / 2 + 8}
                    fill="#f43f5e"
                    fontSize="10"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Area(c²) = {cSquared}
                  </text>
                </g>
              );
            })()}
          </svg>
        )}

        {/* Floating Stage Indicator */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-emerald-300">Stage {stage + 1} of 4</span>
        </div>
      </div>

      {/* Dissection Stage Narrative Box */}
      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-xs text-emerald-400">
            {stageDescriptions[stage].title}
          </span>
          <span className="text-[10px] font-mono text-slate-400">
            a={a}, b={b}, c={formattedC}
          </span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          {stageDescriptions[stage].narrative}
        </p>
      </div>

      {/* Interactive Controls (Sliders for a and b) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
        {/* Leg a Slider */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Leg a Length:</span>
            <span className="font-mono font-bold text-purple-400 text-sm">
              a = {a} (a² = {aSquared})
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={a}
            onChange={(e) => setA(parseInt(e.target.value, 10))}
            className="w-full accent-purple-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        {/* Leg b Slider */}
        <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium">Leg b Length:</span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              b = {b} (b² = {bSquared})
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="10"
            step="1"
            value={b}
            onChange={(e) => setB(parseInt(e.target.value, 10))}
            className="w-full accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>
      </div>

      {/* Animation & Step Playback Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            disabled={stage === 0}
            onClick={() => setStage((prev) => Math.max(0, prev - 1))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs"
            title="Previous Step"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-md shadow-amber-900/30'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-900/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'Pause' : 'Play Proof Animation'}</span>
          </button>

          <button
            type="button"
            disabled={stage >= 3}
            onClick={() => setStage((prev) => Math.min(3, prev + 1))}
            className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs"
            title="Next Step"
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
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {sp}x
              </button>
            ))}
          </div>
        </div>

        {/* Step Progress Dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                setIsPlaying(false);
                setStage(s);
              }}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                stage === s
                  ? 'bg-emerald-400 scale-125 ring-2 ring-emerald-500/50'
                  : 'bg-slate-800 hover:bg-slate-700'
              }`}
              title={`Jump to Stage ${s + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Pythagorean Triples Presets */}
      <div className="flex items-center gap-1.5 overflow-x-auto pt-1 text-[11px]">
        <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Integer Triples:</span>
        <button
          type="button"
          onClick={() => handlePresetSelect(3, 4)}
          className={`px-2 py-0.5 rounded border font-mono text-[10px] transition-colors ${
            a === 3 && b === 4
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          (3, 4, 5)
        </button>
        <button
          type="button"
          onClick={() => handlePresetSelect(6, 8)}
          className={`px-2 py-0.5 rounded border font-mono text-[10px] transition-colors ${
            a === 6 && b === 8
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          (6, 8, 10)
        </button>
        <button
          type="button"
          onClick={() => handlePresetSelect(5, 12)}
          className={`px-2 py-0.5 rounded border font-mono text-[10px] transition-colors ${
            a === 5 && b === 12
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
          }`}
        >
          (5, 12, 13)
        </button>
      </div>

      {/* Mathematical Rigor Summary */}
      <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1">
        <div className="flex items-center gap-1.5 text-emerald-300 font-semibold">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Formal Proof Synthesis</span>
        </div>
        <p className="text-slate-300 leading-relaxed text-[11px]">
          The total area of the bounding square is (a + b)² = a² + 2ab + b². Because the four corner right triangles occupy 4 × (½·ab) = 2ab of that area, the remaining central tilted square must equal exactly (a² + 2ab + b²) - 2ab = <strong>a² + b² = c²</strong>. This constitutes an exact deductive geometric proof valid for all Euclidean right triangles.
        </p>
      </div>
    </div>
  );
};

