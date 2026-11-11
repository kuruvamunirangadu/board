/**
 * VisiOS — Manim Mathematical Animation & Proof Studio
 *
 * Provides animated step-by-step mathematical proofs, keyframe scrubbing,
 * LaTeX equation transformations, and exportable Python Manim scene scripts.
 */

import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Code, Video, Sparkles, Check } from 'lucide-react';
import { MathManimAdapter, ManimKeyframe } from '../adapters/MathManimAdapter';

export const ManimAnimationViewer: React.FC = () => {
  const [adapter] = useState(() => new MathManimAdapter());
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showScriptModal, setShowScriptModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const derivationSteps = [
    {
      latex: 'f(x) = \\tan^2(x) + \\cot^2(x)',
      explanation: 'Define the original compound trigonometric problem on domain x ≠ nπ/2.',
    },
    {
      latex: 'f(x) = \\tan^2(x) + \\frac{1}{\\tan^2(x)}',
      explanation: 'Apply reciprocal identity: cot(x) = 1/tan(x).',
    },
    {
      latex: 'f(x) = \\frac{\\sin^4(x) + \\cos^4(x)}{\\sin^2(x)\\cos^2(x)}',
      explanation: 'Convert to common denominator using sine and cosine quotients.',
    },
    {
      latex: 'f(x) = \\frac{1 - 2\\sin^2(x)\\cos^2(x)}{\\sin^2(x)\\cos^2(x)}',
      explanation: 'Complete square in numerator: sin⁴ + cos⁴ = (sin² + cos²)² - 2sin²cos².',
    },
    {
      latex: 'f(x) = 4\\csc^2(2x) - 2',
      explanation: 'Substitute double-angle identity sin(2x) = 2sin(x)cos(x) to attain canonical form.',
    },
    {
      latex: '\\min f(x) = 2 \\quad \\text{at } x = \\frac{\\pi}{4} + \\frac{n\\pi}{2}',
      explanation: 'By the AM-GM inequality, tan²(x) + cot²(x) ≥ 2, holding strictly when tan²(x) = 1.',
    },
  ];

  const keyframes: ManimKeyframe[] = adapter.generateKeyframes(derivationSteps);
  const pythonScript = adapter.generatePythonScript(
    'TanCotDerivationScene',
    'Trigonometric Identity Derivation: tan²(x) + cot²(x)',
    derivationSteps
  );

  const activeKeyframe = keyframes[currentStepIndex] || keyframes[0];

  const handleNext = () => {
    if (currentStepIndex < keyframes.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(pythonScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">Manim Mathematical Proof Studio</h4>
            <div className="text-[10px] text-slate-400">
              Animated Step-by-Step Derivations · LaTeX Morphing · Manim Scene Generator
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowScriptModal(!showScriptModal)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 transition-colors"
        >
          <Code className="w-3.5 h-3.5" />
          {showScriptModal ? 'Hide Python' : 'View Manim Code'}
        </button>
      </div>

      {/* Main Visual Keyframe Player */}
      <div className="relative w-full rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex flex-col items-center justify-center p-2">
        <div
          className="w-full max-w-[420px] flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: activeKeyframe.svgVisual }}
        />

        {/* Step progress pills */}
        <div className="flex items-center gap-1.5 mt-2">
          {keyframes.map((k, idx) => (
            <button
              key={k.stepIndex}
              onClick={() => setCurrentStepIndex(idx)}
              className={`h-1.5 rounded-full transition-all ${
                idx === currentStepIndex ? 'w-8 bg-indigo-500' : 'w-2 bg-slate-800 hover:bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Playback Controls Bar */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            disabled={currentStepIndex === 0}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (isPlaying) {
                setIsPlaying(false);
              } else {
                setIsPlaying(true);
                handleNext();
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Play Proof'}
          </button>
          <button
            onClick={handleNext}
            disabled={currentStepIndex === keyframes.length - 1}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-40 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Step {currentStepIndex + 1} of {keyframes.length}
        </span>
      </div>

      {/* Script Modal */}
      {showScriptModal && (
        <div className="mt-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono">
          <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-[10px] text-slate-400">
            <span>manim_scene.py (Manim Community 0.19)</span>
            <button
              onClick={handleCopyScript}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
            >
              {copied ? <Check className="w-3 h-3" /> : <Code className="w-3 h-3" />}
              {copied ? 'Copied' : 'Copy Code'}
            </button>
          </div>
          <pre className="p-2 text-slate-300 overflow-x-auto max-h-[160px] leading-relaxed">
            {pythonScript}
          </pre>
        </div>
      )}
    </div>
  );
};
