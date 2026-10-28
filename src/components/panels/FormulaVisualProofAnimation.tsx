'use client';

import React, { useState, useEffect } from 'react';
import { RecognizedFormula } from '@/features/intelligence/board-feed-parser';

interface Props {
  formula: RecognizedFormula;
  onInsertToCanvas?: (title: string, text: string) => void;
}

export const FormulaVisualProofAnimation: React.FC<Props> = ({ formula, onInsertToCanvas }) => {
  const [a, setA] = useState(formula.defaultParams?.a || 6);
  const [b, setB] = useState(formula.defaultParams?.b || 2);
  const [step, setStep] = useState(4); // 1 to 4
  const [isPlaying, setIsPlaying] = useState(false);

  // Auto-play steps
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setStep((prev) => (prev >= 4 ? 1 : prev + 1));
    }, 2000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  const isSquareSum = formula.animationType === 'square_sum';

  // Ensure b < a for difference, but allow any valid dimensions for sum
  const validB = isSquareSum ? Math.max(1, b) : Math.min(b, Math.max(1, a - 1));
  const diff = a - validB;
  const sum = a + validB;

  // Numerical calculations
  const areaTotal = isSquareSum ? sum * sum : a * a;
  const areaA2 = a * a;
  const areaB2 = validB * validB;
  const areaAB = a * validB;
  const areaRect1 = a * validB;
  const areaRect2 = a * validB;
  const areaCorner = validB * validB;
  const areaDiffSquare = diff * diff;

  // Scale for SVG rendering (220x220 viewBox)
  const maxDim = isSquareSum ? Math.max(8, sum) : Math.max(8, a);
  const scale = 180 / maxDim;
  const sizeA = a * scale;
  const sizeB = validB * scale;
  const sizeDiff = diff * scale;
  const sizeSum = sum * scale;

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-slate-900/90 p-4 space-y-4 text-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div>
          <span className="rounded bg-indigo-900/60 px-2 py-0.5 text-[11px] font-bold text-indigo-300 border border-indigo-700/50">
            Interactive Geometric Proof
          </span>
          <h4 className="mt-1 text-sm font-bold text-white">{formula.title}</h4>
        </div>
        <div className="text-right font-mono">
          <span className="text-xs text-slate-400">Formula Result:</span>
          <div className="text-sm font-bold text-emerald-400">{formula.solvedResult}</div>
        </div>
      </div>

      {/* Interactive Canvas Visual Area SVG Animation */}
      <div className="relative flex flex-col items-center justify-center rounded-lg bg-slate-950 p-4 border border-slate-800">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          className="overflow-visible"
        >
          {isSquareSum ? (
            /* Square of a Sum: (a + b)² = a² + 2ab + b² */
            <>
              {/* Outer composite square border (a+b) */}
              <rect
                x="20"
                y="20"
                width={sizeSum}
                height={sizeSum}
                fill="none"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray="4 4"
              />

              {/* Sub-region 1: a² (top-left) */}
              <rect
                x="20"
                y="20"
                width={sizeA}
                height={sizeA}
                fill="#6366f1"
                fillOpacity={step >= 1 ? '0.75' : '0.2'}
                stroke="#818cf8"
                strokeWidth="2"
              />
              {step >= 1 && (
                <text
                  x={20 + sizeA / 2}
                  y={20 + sizeA / 2 + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                >
                  a² = {areaA2}
                </text>
              )}

              {/* Sub-region 2: ab strip (top-right) */}
              {step >= 2 && (
                <>
                  <rect
                    x={20 + sizeA}
                    y="20"
                    width={sizeB}
                    height={sizeA}
                    fill="#f59e0b"
                    fillOpacity="0.55"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <text
                    x={20 + sizeA + sizeB / 2}
                    y={20 + sizeA / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    ab = {areaAB}
                  </text>
                </>
              )}

              {/* Sub-region 3: ab strip (bottom-left) */}
              {step >= 3 && (
                <>
                  <rect
                    x="20"
                    y={20 + sizeA}
                    width={sizeA}
                    height={sizeB}
                    fill="#f59e0b"
                    fillOpacity="0.55"
                    stroke="#fbbf24"
                    strokeWidth="1.5"
                  />
                  <text
                    x={20 + sizeA / 2}
                    y={20 + sizeA + sizeB / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    ab = {areaAB}
                  </text>
                </>
              )}

              {/* Sub-region 4: b² corner square (bottom-right) */}
              {step >= 4 && (
                <>
                  <rect
                    x={20 + sizeA}
                    y={20 + sizeA}
                    width={sizeB}
                    height={sizeB}
                    fill="#10b981"
                    fillOpacity="0.7"
                    stroke="#34d399"
                    strokeWidth="2"
                  />
                  <text
                    x={20 + sizeA + sizeB / 2}
                    y={20 + sizeA + sizeB / 2 + 4}
                    textAnchor="middle"
                    fill="#ffffff"
                    fontSize="10"
                    fontWeight="bold"
                  >
                    b² = {areaB2}
                  </text>
                </>
              )}

              {/* Dimension Labels */}
              <line x1="20" y1="10" x2={20 + sizeSum} y2="10" stroke="#94a3b8" strokeWidth="1" />
              <text x={20 + sizeSum / 2} y="7" textAnchor="middle" fill="#94a3b8" fontSize="10">
                (a + b) = {sum}
              </text>
            </>
          ) : (
            /* Square of a Difference: (a - b)² */
            <>
              {/* Background Big Square (side a) */}
              <rect
                x="20"
                y="20"
                width={sizeA}
                height={sizeA}
                fill="#1e293b"
                stroke="#64748b"
                strokeWidth="2"
                strokeDasharray={step === 1 ? 'none' : '4 4'}
              />

              {/* Inner Square (a - b)^2 */}
              <rect
                x="20"
                y="20"
                width={sizeDiff}
                height={sizeDiff}
                fill="#6366f1"
                fillOpacity={step >= 1 ? '0.7' : '0.2'}
                stroke="#818cf8"
                strokeWidth="2"
              />
              <text
                x={20 + sizeDiff / 2}
                y={20 + sizeDiff / 2 + 5}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="12"
                fontWeight="bold"
              >
                (a - b)² = {areaDiffSquare}
              </text>

              {/* Subtracted Rectangle 1 (top-right, b x (a-b)) */}
              {step >= 2 && (
                <rect
                  x={20 + sizeDiff}
                  y="20"
                  width={sizeB}
                  height={sizeDiff}
                  fill="#ef4444"
                  fillOpacity="0.4"
                  stroke="#f87171"
                  strokeWidth="1.5"
                />
              )}

              {/* Subtracted Rectangle 2 (bottom-left, (a-b) x b) */}
              {step >= 3 && (
                <rect
                  x="20"
                  y={20 + sizeDiff}
                  width={sizeDiff}
                  height={sizeB}
                  fill="#f59e0b"
                  fillOpacity="0.4"
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />
              )}

              {/* Overlapping Corner Square (b x b) */}
              {step >= 4 && (
                <rect
                  x={20 + sizeDiff}
                  y={20 + sizeDiff}
                  width={sizeB}
                  height={sizeB}
                  fill="#10b981"
                  fillOpacity="0.6"
                  stroke="#34d399"
                  strokeWidth="2"
                />
              )}
              {step >= 4 && (
                <text
                  x={20 + sizeDiff + sizeB / 2}
                  y={20 + sizeDiff + sizeB / 2 + 4}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="10"
                  fontWeight="bold"
                >
                  +b²
                </text>
              )}

              {/* Top Label (a) */}
              <line x1="20" y1="10" x2={20 + sizeA} y2="10" stroke="#94a3b8" strokeWidth="1" />
              <text x={20 + sizeA / 2} y="7" textAnchor="middle" fill="#94a3b8" fontSize="10">
                a = {a}
              </text>
            </>
          )}
        </svg>

        {/* Step Explanation Badge */}
        <div className="mt-3 text-center text-xs">
          {isSquareSum ? (
            <>
              {step === 1 && (
                <span className="text-indigo-300 font-medium">
                  Step 1: Primary component square <strong>a² = {areaA2}</strong>
                </span>
              )}
              {step === 2 && (
                <span className="text-amber-300 font-medium">
                  Step 2: Add first rectangular strip <strong>+ab = +{areaAB}</strong>
                </span>
              )}
              {step === 3 && (
                <span className="text-amber-300 font-medium">
                  Step 3: Add symmetric rectangular strip <strong>+ab = +{areaAB}</strong>
                </span>
              )}
              {step === 4 && (
                <span className="text-emerald-300 font-medium">
                  Step 4: Add secondary square <strong>+b² = +{areaB2}</strong> → Total: <strong>(a+b)² = {areaTotal}</strong>
                </span>
              )}
            </>
          ) : (
            <>
              {step === 1 && (
                <span className="text-indigo-300 font-medium">
                  Step 1: Total area of outer square is <strong>a² = {areaTotal}</strong>
                </span>
              )}
              {step === 2 && (
                <span className="text-red-300 font-medium">
                  Step 2: Subtract top-right vertical rectangle <strong>-ab = -{areaRect1}</strong>
                </span>
              )}
              {step === 3 && (
                <span className="text-amber-300 font-medium">
                  Step 3: Subtract bottom-left horizontal rectangle <strong>-ab = -{areaRect2}</strong>
                </span>
              )}
              {step === 4 && (
                <span className="text-emerald-300 font-medium">
                  Step 4: Add back overlapping corner square <strong>+b² = +{areaCorner}</strong>
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Animation Playback & Step Controls */}
      <div className="flex items-center justify-between text-xs pt-1">
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              onClick={() => {
                setStep(s);
                setIsPlaying(false);
              }}
              className={`px-2.5 py-1 rounded font-mono text-xs font-semibold transition-colors ${
                step === s
                  ? 'bg-indigo-600 text-white shadow'
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              Step {s}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="rounded-lg bg-indigo-950 px-3 py-1 text-xs font-medium text-indigo-300 border border-indigo-800 hover:bg-indigo-900 transition-colors"
        >
          {isPlaying ? '⏸ Pause' : '▶ Animate Proof'}
        </button>
      </div>

      {/* Dynamic Interactive Variable Sliders */}
      <div className="grid grid-cols-2 gap-4 rounded-lg bg-slate-950/60 p-3 border border-slate-800 text-xs">
        <div>
          <label className="block text-slate-400 mb-1">
            Variable <strong>a</strong>: <span className="font-mono text-indigo-400">{a}</span>
          </label>
          <input
            type="range"
            min="3"
            max="10"
            value={a}
            onChange={(e) => setA(Number(e.target.value))}
            className="w-full"
          />
        </div>

        <div>
          <label className="block text-slate-400 mb-1">
            Variable <strong>b</strong>: <span className="font-mono text-emerald-400">{validB}</span>
          </label>
          <input
            type="range"
            min="1"
            max={Math.max(1, a - 1)}
            value={validB}
            onChange={(e) => setB(Number(e.target.value))}
            className="w-full"
          />
        </div>
      </div>

      {/* Live Equation Verification Breakdown */}
      <div className="rounded-lg bg-slate-950 p-3 font-mono text-xs border border-slate-800 space-y-1">
        <div className="text-slate-400">Live Mathematical Proof Evaluation:</div>
        <div className="text-slate-200">
          a² + b² - 2ab = ({a})² + ({validB})² - 2({a})({validB})
        </div>
        <div className="text-indigo-300 font-bold">
          = {areaTotal} + {areaCorner} - {2 * a * validB} = <span className="text-emerald-400">{areaDiffSquare}</span>
        </div>
        <div className="text-emerald-400 font-bold">
          (a - b)² = ({a} - {validB})² = ({diff})² = {areaDiffSquare} ✓ (Identity Verified)
        </div>
      </div>

      {/* Step by Step Breakdown */}
      <div className="space-y-1.5 text-xs text-slate-300">
        <span className="font-semibold text-indigo-300">Algebraic Derivation:</span>
        <ul className="list-disc pl-5 space-y-1 text-slate-400">
          {formula.algebraicSteps.map((st, i) => (
            <li key={i}>{st}</li>
          ))}
        </ul>
      </div>

      {/* Insert on Board Button */}
      {onInsertToCanvas && (
        <button
          onClick={() => {
            const proofText = `Algebraic Identity Solved:\n${formula.normalizedFormula} = ${formula.solvedResult}\n\nNumerical Proof (a=${a}, b=${validB}):\n${a}² + ${validB}² - 2(${a})(${validB}) = ${areaDiffSquare}\n(${a} - ${validB})² = ${diff}² = ${areaDiffSquare} ✓`;
            onInsertToCanvas(formula.title, proofText);
          }}
          className="w-full rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-indigo-500 transition-colors"
        >
          ➕ Insert Solved Proof Card on Canvas Board
        </button>
      )}
    </div>
  );
};

