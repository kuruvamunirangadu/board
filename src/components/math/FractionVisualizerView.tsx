/**
 * VisiOS — Interactive Fraction Visualizer & Equivalence Engine
 * Milestone 2: School Geometry & Animation Engine
 * Real-time circular disk, rectangular tape, improper fraction mixed numbers,
 * side-by-side equivalent fraction comparison, and rational operations (+, -, ×, ÷).
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
  PieChart,
  Layers,
  Info,
  CheckCircle2,
  Calculator,
  Equal,
} from 'lucide-react';

export interface FractionVisualizerProps {
  initialNumerator?: number;
  initialDenominator?: number;
  onStampToCanvas?: () => void;
  isCompact?: boolean;
}

type VisualMode = 'explorer' | 'equivalence' | 'operations';
type OperationType = 'add' | 'subtract' | 'multiply' | 'divide';

export const FractionVisualizerView: React.FC<FractionVisualizerProps> = ({
  initialNumerator = 3,
  initialDenominator = 4,
  onStampToCanvas,
  isCompact = false,
}) => {
  // Mode state
  const [mode, setMode] = useState<VisualMode>('explorer');
  const [visualType, setVisualType] = useState<'disk' | 'tape'>('disk');

  // Fraction 1 (Main)
  const [numerator, setNumerator] = useState<number>(initialNumerator);
  const [denominator, setDenominator] = useState<number>(initialDenominator);

  // Equivalence scale factor (k = 1, 2, 3, 4)
  const [scaleFactor, setScaleFactor] = useState<number>(2);

  // Operations state (Fraction 2)
  const [opNumerator, setOpNumerator] = useState<number>(1);
  const [opDenominator, setOpDenominator] = useState<number>(2);
  const [operation, setOperation] = useState<OperationType>('add');

  // Animation state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [animSpeed, setAnimSpeed] = useState<number>(1);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Sync props
  useEffect(() => {
    setNumerator(initialNumerator);
  }, [initialNumerator]);

  useEffect(() => {
    setDenominator(initialDenominator);
  }, [initialDenominator]);

  // Derived math helper
  const gcd = (x: number, y: number): number => (!y ? Math.abs(x) : gcd(y, x % y));
  const lcm = (x: number, y: number): number => (Math.abs(x * y) / (gcd(x, y) || 1));

  const safeDenom = Math.max(1, denominator);
  const safeOpDenom = Math.max(1, opDenominator);

  // Scaled equivalent values
  const scaledNum = numerator * scaleFactor;
  const scaledDenom = safeDenom * scaleFactor;

  const isProper = numerator < safeDenom;
  const isWhole = numerator % safeDenom === 0;
  const decimal = Math.round((numerator / safeDenom) * 1000) / 1000;
  const percentage = Math.round((numerator / safeDenom) * 1000) / 10;

  // Mixed number calculation for improper fractions (a > b)
  const mixedNumber = useMemo(() => {
    if (isProper || isWhole) return null;
    const whole = Math.floor(numerator / safeDenom);
    const remainder = numerator % safeDenom;
    return { whole, remainder, denom: safeDenom };
  }, [numerator, safeDenom, isProper, isWhole]);

  // Lowest terms simplification
  const divisor = gcd(numerator, safeDenom);
  const simplifiedNum = numerator / divisor;
  const simplifiedDenom = safeDenom / divisor;
  const isSimplified = divisor === 1;

  // Operation calculations
  const operationResult = useMemo(() => {
    const a = numerator;
    const b = safeDenom;
    const c = opNumerator;
    const d = safeOpDenom;

    if (operation === 'add') {
      const commonD = lcm(b, d);
      const scaledA = a * (commonD / b);
      const scaledC = c * (commonD / d);
      const resNum = scaledA + scaledC;
      const resGcd = gcd(resNum, commonD);
      return {
        formula: `${a}/${b} + ${c}/${d}`,
        commonDenominator: commonD,
        stepDetail: `Convert to common denominator ${commonD}: ${scaledA}/${commonD} + ${scaledC}/${commonD} = (${scaledA} + ${scaledC})/${commonD} = ${resNum}/${commonD}`,
        unsimplifiedNum: resNum,
        unsimplifiedDenom: commonD,
        simplifiedNum: resNum / resGcd,
        simplifiedDenom: commonD / resGcd,
        decimal: Math.round((resNum / commonD) * 1000) / 1000,
        error: null,
      };
    } else if (operation === 'subtract') {
      const commonD = lcm(b, d);
      const scaledA = a * (commonD / b);
      const scaledC = c * (commonD / d);
      const resNum = scaledA - scaledC;
      const resGcd = gcd(resNum, commonD);
      return {
        formula: `${a}/${b} - ${c}/${d}`,
        commonDenominator: commonD,
        stepDetail: `Convert to common denominator ${commonD}: ${scaledA}/${commonD} - ${scaledC}/${commonD} = (${scaledA} - ${scaledC})/${commonD} = ${resNum}/${commonD}`,
        unsimplifiedNum: resNum,
        unsimplifiedDenom: commonD,
        simplifiedNum: resNum / resGcd,
        simplifiedDenom: commonD / resGcd,
        decimal: Math.round((resNum / commonD) * 1000) / 1000,
        error: null,
      };
    } else if (operation === 'multiply') {
      const resNum = a * c;
      const resDenom = b * d;
      const resGcd = gcd(resNum, resDenom);
      return {
        formula: `${a}/${b} × ${c}/${d}`,
        stepDetail: `Multiply numerators together and denominators together: (${a} × ${c}) / (${b} × ${d}) = ${resNum}/${resDenom}`,
        unsimplifiedNum: resNum,
        unsimplifiedDenom: resDenom,
        simplifiedNum: resNum / resGcd,
        simplifiedDenom: resDenom / resGcd,
        decimal: Math.round((resNum / resDenom) * 1000) / 1000,
        error: null,
      };
    } else {
      // Division
      if (c === 0) {
        return {
          formula: `${a}/${b} ÷ ${c}/${d}`,
          stepDetail: 'Division by zero is undefined! A fraction divisor cannot have a numerator of zero.',
          unsimplifiedNum: 0,
          unsimplifiedDenom: 1,
          simplifiedNum: 0,
          simplifiedDenom: 1,
          decimal: 0,
          error: 'Division by zero is undefined',
        };
      }
      const resNum = a * d;
      const resDenom = b * c;
      const resGcd = gcd(resNum, resDenom);
      return {
        formula: `${a}/${b} ÷ ${c}/${d}`,
        stepDetail: `Multiply by reciprocal of divisor (${d}/${c}): (${a}/${b}) × (${d}/${c}) = (${a} × ${d}) / (${b} × ${c}) = ${resNum}/${resDenom}`,
        unsimplifiedNum: resNum,
        unsimplifiedDenom: resDenom,
        simplifiedNum: resNum / resGcd,
        simplifiedDenom: resDenom / resGcd,
        decimal: Math.round((resNum / resDenom) * 1000) / 1000,
        error: null,
      };
    }
  }, [numerator, safeDenom, opNumerator, safeOpDenom, operation]);

  // Auto-play for equivalence animation
  useEffect(() => {
    if (!isPlaying || mode !== 'equivalence') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const interval = 1800 / animSpeed;
    timerRef.current = setInterval(() => {
      setScaleFactor((prev) => (prev < 4 ? prev + 1 : 1));
    }, interval);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isPlaying, animSpeed, mode]);

  const handleReset = () => {
    setIsPlaying(false);
    setScaleFactor(2);
    setNumerator(initialNumerator);
    setDenominator(initialDenominator);
    setOpNumerator(1);
    setOpDenominator(2);
    setOperation('add');
  };

  const handlePresetSelect = (num: number, den: number, visualMode: VisualMode = 'explorer') => {
    setNumerator(num);
    setDenominator(den);
    setMode(visualMode);
    setScaleFactor(visualMode === 'equivalence' ? 2 : 1);
  };

  // Helper renderer: Single circular disk
  const renderDisk = (num: number, den: number, radius: number = 55, titlePrefix = '') => {
    const safeD = Math.max(1, den);
    const disksCount = Math.min(3, Math.ceil(num / safeD) || 1);
    const cx = radius + 8;
    const cy = radius + 8;
    const totalAngle = 2 * Math.PI;

    return (
      <div className="flex flex-wrap items-center justify-center gap-3 py-1">
        {Array.from({ length: disksCount }).map((_, diskIdx) => {
          const fullInThisDisk = Math.max(0, Math.min(safeD, num - diskIdx * safeD));
          return (
            <div key={diskIdx} className="flex flex-col items-center space-y-1">
              <svg width={(radius + 8) * 2} height={(radius + 8) * 2} className="overflow-visible">
                <circle cx={cx} cy={cy} r={radius} fill="rgba(15, 23, 42, 0.9)" stroke="#475569" strokeWidth="2" />
                {Array.from({ length: safeD }).map((_, sectorIdx) => {
                  const isShaded = sectorIdx < fullInThisDisk;
                  const startAngle = (sectorIdx * totalAngle) / safeD - Math.PI / 2;
                  const endAngle = ((sectorIdx + 1) * totalAngle) / safeD - Math.PI / 2;

                  const x1 = cx + radius * Math.cos(startAngle);
                  const y1 = cy + radius * Math.sin(startAngle);
                  const x2 = cx + radius * Math.cos(endAngle);
                  const y2 = cy + radius * Math.sin(endAngle);
                  const largeArcFlag = totalAngle / safeD > Math.PI ? 1 : 0;

                  const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                  return (
                    <path
                      key={sectorIdx}
                      d={pathData}
                      fill={isShaded ? 'rgba(6, 182, 212, 0.75)' : 'rgba(30, 41, 59, 0.5)'}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                      className="transition-colors duration-300"
                    />
                  );
                })}
                <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
              </svg>
              <span className="text-[10px] text-slate-400 font-mono">
                {titlePrefix || (disksCount > 1 ? `Unit ${diskIdx + 1} (${fullInThisDisk}/${safeD})` : '1 Whole')}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Helper renderer: Single rectangular tape
  const renderTape = (num: number, den: number, widthPx = 280, title = '') => {
    const safeD = Math.max(1, den);
    const disksCount = Math.min(3, Math.ceil(num / safeD) || 1);

    return (
      <div className="w-full max-w-[340px] flex flex-col items-center space-y-2 py-1">
        {Array.from({ length: disksCount }).map((_, tapeIdx) => {
          const fullInThisTape = Math.max(0, Math.min(safeD, num - tapeIdx * safeD));
          return (
            <div key={tapeIdx} className="w-full space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{title || `Tape ${tapeIdx + 1}`}</span>
                <span>{fullInThisTape} / {safeD} parts</span>
              </div>
              <div className="w-full h-9 flex rounded-lg border border-slate-700 overflow-hidden bg-slate-950">
                {Array.from({ length: safeD }).map((_, cellIdx) => {
                  const isShaded = cellIdx < fullInThisTape;
                  return (
                    <div
                      key={cellIdx}
                      className={`flex-1 border-r border-slate-900 last:border-r-0 flex items-center justify-center font-mono text-[9px] font-bold transition-all ${
                        isShaded ? 'bg-cyan-500/80 text-white' : 'bg-slate-900/60 text-slate-600'
                      }`}
                    >
                      1/{safeD}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col space-y-3 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-slate-100 shadow-xl">
      {/* Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <PieChart className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-200">
              {mode === 'equivalence'
                ? `Equivalent Fraction Scaling: ${numerator}/${safeDenom} = ${scaledNum}/${scaledDenom}`
                : mode === 'operations'
                ? `Rational Operations: ${numerator}/${safeDenom} ${operation === 'add' ? '+' : operation === 'subtract' ? '-' : operation === 'multiply' ? '×' : '÷'} ${opNumerator}/${safeOpDenom}`
                : `Fractions & Rational Numbers: ${numerator}/${safeDenom}`}
            </span>
            <div className="text-[10px] text-slate-400 font-mono">
              Part-to-Whole Ratio & Rational Mathematics Model
            </div>
          </div>
        </div>

        {/* Live Fraction Badge */}
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-lg bg-cyan-950/80 border border-cyan-500/40 font-mono text-xs text-cyan-300 font-bold flex items-center gap-1.5">
            <span>{numerator}/{safeDenom}</span>
            <span className="text-[10px] text-slate-400">({decimal})</span>
          </div>
        </div>
      </div>

      {/* Mode Selectors */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Visual Mode Selector */}
        <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => setMode('explorer')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium ${
              mode === 'explorer' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Fraction Explorer
          </button>
          <button
            type="button"
            onClick={() => setMode('equivalence')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              mode === 'equivalence' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Equivalence Scaling</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('operations')}
            className={`px-2.5 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
              mode === 'operations' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3 h-3" />
            <span>Operations (+, -, ×, ÷)</span>
          </button>
        </div>

        {/* Shape Representation Selector (for Explorer & Equivalence) */}
        {mode !== 'operations' && (
          <div className="flex items-center p-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setVisualType('disk')}
              className={`px-2 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
                visualType === 'disk' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <PieChart className="w-3 h-3" />
              <span>Disk</span>
            </button>
            <button
              type="button"
              onClick={() => setVisualType('tape')}
              className={`px-2 py-1 rounded-md transition-colors font-medium flex items-center gap-1 ${
                visualType === 'tape' ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Strip</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Canvas Area */}
      <div className="relative w-full flex justify-center items-center bg-slate-900 rounded-xl border border-slate-800/80 p-3 min-h-[220px] overflow-hidden select-none">
        {mode === 'explorer' && (
          /* Explorer Mode (Single Fraction with Improper decomposition) */
          visualType === 'disk'
            ? renderDisk(numerator, safeDenom, 65)
            : renderTape(numerator, safeDenom, 320)
        )}

        {mode === 'equivalence' && (
          /* Side-by-Side Equivalence Mode: 1/2 vs 2/4 */
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2 w-full">
            {/* Left: Original Fraction */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[11px] font-bold text-cyan-400">
                Original Fraction: {numerator} / {safeDenom}
              </span>
              {visualType === 'disk'
                ? renderDisk(numerator, safeDenom, 50, `${numerator}/${safeDenom}`)
                : renderTape(numerator, safeDenom, 180, `${numerator}/${safeDenom}`)}
              <span className="text-[10px] text-slate-400 font-mono">
                {numerator} of {safeDenom} equal parts ({decimal})
              </span>
            </div>

            {/* Equals Divider */}
            <div className="flex flex-col items-center justify-center space-y-1">
              <div className="w-8 h-8 rounded-full bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-bold text-lg">
                =
              </div>
              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                EQUAL AREA
              </span>
            </div>

            {/* Right: Scaled Equivalent Fraction */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 space-y-2">
              <span className="text-[11px] font-bold text-indigo-300">
                Scaled Equivalent (k = {scaleFactor}): {scaledNum} / {scaledDenom}
              </span>
              {visualType === 'disk'
                ? renderDisk(scaledNum, scaledDenom, 50, `${scaledNum}/${scaledDenom}`)
                : renderTape(scaledNum, scaledDenom, 180, `${scaledNum}/${scaledDenom}`)}
              <span className="text-[10px] text-indigo-300/80 font-mono">
                ({numerator}×{scaleFactor})/({safeDenom}×{scaleFactor}) = {scaledNum}/{scaledDenom} ({decimal})
              </span>
            </div>
          </div>
        )}

        {mode === 'operations' && (
          /* Operations Mode */
          <div className="w-full space-y-3 p-2">
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-slate-400">Rational Equation:</span>
                <span className="text-sm font-bold text-cyan-300">
                  {operationResult.formula} = {operationResult.unsimplifiedNum}/{operationResult.unsimplifiedDenom}
                </span>
              </div>

              {/* Step Detail Narrative */}
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-cyan-400 text-[11px] uppercase tracking-wider">
                  Mathematical Transformation:
                </div>
                <p className="leading-relaxed font-mono text-[11px]">
                  {operationResult.stepDetail}
                </p>
              </div>

              {/* Final Simplified Result */}
              {!operationResult.error && (
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-slate-400">Irreducible Lowest Terms:</span>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono font-bold">
                      {operationResult.simplifiedNum} / {operationResult.simplifiedDenom}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">
                      (Decimal: {operationResult.decimal})
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Numerical Classification Badges */}
      <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
        <span
          className={`px-2 py-0.5 rounded-md border ${
            isProper
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
          }`}
        >
          {isProper ? 'Proper Fraction (< 1)' : 'Improper Fraction (≥ 1)'}
        </span>

        {mixedNumber && (
          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 border border-purple-500/30 text-purple-300">
            Mixed Number: {mixedNumber.whole} {mixedNumber.remainder}/{mixedNumber.denom}
          </span>
        )}

        <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
          Decimal: {decimal} ({percentage}%)
        </span>

        <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-300">
          Lowest Terms: {simplifiedNum}/{simplifiedDenom} {isSimplified ? '✓' : `(÷ ${divisor})`}
        </span>
      </div>

      {/* Parameter Controls */}
      <div className="space-y-2 pt-1">
        {mode !== 'operations' ? (
          /* Controls for Explorer and Equivalence */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Numerator Slider */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Numerator (Parts Count):</span>
                <span className="font-mono font-bold text-cyan-400 text-sm">{numerator}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={numerator}
                onChange={(e) => setNumerator(parseInt(e.target.value, 10))}
                className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>

            {/* Denominator Slider */}
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Denominator (Total Partitions):</span>
                <span className="font-mono font-bold text-indigo-400 text-sm">{safeDenom}</span>
              </div>
              <input
                type="range"
                min="1"
                max="12"
                step="1"
                value={denominator}
                onChange={(e) => setDenominator(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>
        ) : (
          /* Controls for Operations Mode */
          <div className="space-y-2">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {/* Fraction 1 */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-cyan-400">Fraction 1: {numerator}/{safeDenom}</span>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={numerator}
                    onChange={(e) => setNumerator(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={denominator}
                    onChange={(e) => setDenominator(parseInt(e.target.value, 10))}
                    className="w-full accent-cyan-400 h-1 bg-slate-800"
                  />
                </div>
              </div>

              {/* Operator Select */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-center gap-1.5">
                {(['add', 'subtract', 'multiply', 'divide'] as OperationType[]).map((op) => (
                  <button
                    key={op}
                    type="button"
                    onClick={() => setOperation(op)}
                    className={`w-8 h-8 rounded-lg font-bold font-mono text-sm transition-all ${
                      operation === op
                        ? 'bg-cyan-600 text-white ring-2 ring-cyan-400'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {op === 'add' ? '+' : op === 'subtract' ? '−' : op === 'multiply' ? '×' : '÷'}
                  </button>
                ))}
              </div>

              {/* Fraction 2 */}
              <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-indigo-400">Fraction 2: {opNumerator}/{safeOpDenom}</span>
                <div className="flex gap-2">
                  <input
                    type="range"
                    min={operation === 'divide' ? 1 : 0}
                    max="10"
                    value={opNumerator}
                    onChange={(e) => setOpNumerator(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-400 h-1 bg-slate-800"
                  />
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={opDenominator}
                    onChange={(e) => setOpDenominator(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-400 h-1 bg-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scale Multiplier Slider (Equivalence Mode) */}
        {mode === 'equivalence' && (
          <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-indigo-200 font-medium flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>Subdivision Scale Multiplier (k):</span>
              </span>
              <span className="font-mono font-bold text-indigo-300">
                k = {scaleFactor} → ({numerator}×{scaleFactor})/({safeDenom}×{scaleFactor}) = {scaledNum}/{scaledDenom}
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="4"
              step="1"
              value={scaleFactor}
              onChange={(e) => setScaleFactor(parseInt(e.target.value, 10))}
              className="w-full accent-indigo-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-indigo-300/70">
              <span>k=1 ({numerator}/{safeDenom})</span>
              <span>k=2 ({numerator * 2}/{safeDenom * 2})</span>
              <span>k=3 ({numerator * 3}/{safeDenom * 3})</span>
              <span>k=4 ({numerator * 4}/{safeDenom * 4})</span>
            </div>
          </div>
        )}
      </div>

      {/* Animation & Presets Footer */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/80">
        {/* Playback Controls (In Equivalence Mode) */}
        {mode === 'equivalence' ? (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={scaleFactor <= 1}
              onClick={() => setScaleFactor((prev) => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs"
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
              <span>{isPlaying ? 'Pause' : 'Animate Subdivision'}</span>
            </button>

            <button
              type="button"
              disabled={scaleFactor >= 4}
              onClick={() => setScaleFactor((prev) => Math.min(4, prev + 1))}
              className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs"
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
          </div>
        ) : (
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <Info className="w-3.5 h-3.5 text-cyan-400" />
            <span>Adjust sliders above or select quick presets below</span>
          </div>
        )}

        {/* Quick Presets */}
        <div className="flex items-center gap-1 overflow-x-auto text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-bold mr-1">Presets:</span>
          <button
            type="button"
            onClick={() => handlePresetSelect(1, 2, 'equivalence')}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
          >
            1/2 = 2/4 (Compare)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(3, 4, 'explorer')}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
          >
            3/4 (Proper)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(7, 3, 'explorer')}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
          >
            7/3 (Improper)
          </button>
          <button
            type="button"
            onClick={() => handlePresetSelect(5, 8, 'explorer')}
            className="px-2 py-0.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 font-mono text-[10px] text-slate-300"
          >
            5/8
          </button>
        </div>
      </div>
    </div>
  );
};
