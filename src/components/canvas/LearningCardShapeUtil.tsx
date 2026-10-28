'use client';

import React, { useState } from 'react';
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T } from 'tldraw';
import {
  BookOpen,
  Sparkles,
  Calculator,
  Layers,
  Lightbulb,
  CheckCircle2,
  ArrowRight,
  Copy,
  Check,
  Compass,
} from 'lucide-react';

export type ILearningCardShape = TLBaseShape<
  'learning-card',
  {
    w: number;
    h: number;
    title: string;
    category: string;
    badge: string;
    formula?: string;
    content: string;
    steps: string[];
    takeaway?: string;
    accentColor: 'indigo' | 'cyan' | 'emerald' | 'amber' | 'violet' | 'blue' | 'rose' | 'sky' | 'slate';
  }
>;

export class LearningCardShapeUtil extends BaseBoxShapeUtil<ILearningCardShape> {
  static override type = 'learning-card' as const;

  static override props = {
    w: T.number,
    h: T.number,
    title: T.string,
    category: T.string,
    badge: T.string,
    formula: T.optional(T.string),
    content: T.string,
    steps: T.arrayOf(T.string),
    takeaway: T.optional(T.string),
    accentColor: T.string as any,
  };

  override getDefaultProps(): ILearningCardShape['props'] {
    return {
      w: 420,
      h: 440,
      title: 'Concept Overview',
      category: 'mathematics',
      badge: 'Core Concept',
      formula: '',
      content: 'Fundamental principles and domain mathematical structure.',
      steps: [],
      takeaway: 'Key pedagogical takeaway.',
      accentColor: 'indigo',
    };
  }

  override canResize = () => true;

  override component(shape: ILearningCardShape) {
    const { props } = shape;
    const [copied, setCopied] = useState(false);

    const handleCopy = (e: React.MouseEvent) => {
      e.stopPropagation();
      const textToCopy = [
        props.title,
        props.formula ? `Formula: ${props.formula}` : '',
        props.content,
        props.steps.length > 0 ? `\nSteps:\n${props.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : '',
        props.takeaway ? `\nTakeaway: ${props.takeaway}` : '',
      ]
        .filter(Boolean)
        .join('\n\n');

      if (navigator.clipboard) {
        navigator.clipboard.writeText(textToCopy);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    };

    // Color theme mapping
    const themeStyles: Record<
      string,
      { badgeBg: string; formulaBorder: string; accentText: string; ring: string }
    > = {
      indigo: {
        badgeBg: 'bg-indigo-500/15 border-indigo-500/30 text-indigo-300',
        formulaBorder: 'border-indigo-500/40 bg-indigo-950/40 text-indigo-200',
        accentText: 'text-indigo-400',
        ring: 'ring-indigo-500/20',
      },
      blue: {
        badgeBg: 'bg-blue-500/15 border-blue-500/30 text-blue-300',
        formulaBorder: 'border-blue-500/40 bg-blue-950/40 text-blue-200',
        accentText: 'text-blue-400',
        ring: 'ring-blue-500/20',
      },
      cyan: {
        badgeBg: 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300',
        formulaBorder: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200',
        accentText: 'text-cyan-400',
        ring: 'ring-cyan-500/20',
      },
      emerald: {
        badgeBg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
        formulaBorder: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200',
        accentText: 'text-emerald-400',
        ring: 'ring-emerald-500/20',
      },
      amber: {
        badgeBg: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
        formulaBorder: 'border-amber-500/40 bg-amber-950/40 text-amber-200',
        accentText: 'text-amber-400',
        ring: 'ring-amber-500/20',
      },
      violet: {
        badgeBg: 'bg-violet-500/15 border-violet-500/30 text-violet-300',
        formulaBorder: 'border-violet-500/40 bg-violet-950/40 text-violet-200',
        accentText: 'text-violet-400',
        ring: 'ring-violet-500/20',
      },
      rose: {
        badgeBg: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
        formulaBorder: 'border-rose-500/40 bg-rose-950/40 text-rose-200',
        accentText: 'text-rose-400',
        ring: 'ring-rose-500/20',
      },
      sky: {
        badgeBg: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
        formulaBorder: 'border-sky-500/40 bg-sky-950/40 text-sky-200',
        accentText: 'text-sky-400',
        ring: 'ring-sky-500/20',
      },
      slate: {
        badgeBg: 'bg-slate-500/15 border-slate-500/30 text-slate-300',
        formulaBorder: 'border-slate-500/40 bg-slate-900/40 text-slate-200',
        accentText: 'text-slate-400',
        ring: 'ring-slate-500/20',
      },
    };

    const activeTheme =
      (props.accentColor && themeStyles[props.accentColor]) || themeStyles.indigo;

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: props.w,
          height: props.h,
          pointerEvents: 'all',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div
          className={`w-full h-full rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-2xl backdrop-blur-md flex flex-col overflow-hidden text-slate-100 select-text ${activeTheme.ring}`}
        >
          {/* Card Header */}
          <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/70 flex items-center justify-between select-none">
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`px-2 py-0.5 rounded-md border text-[11px] font-semibold flex items-center gap-1 shrink-0 ${activeTheme.badgeBg}`}
              >
                <Sparkles className="w-3 h-3" />
                {props.badge || 'Learning Card'}
              </span>
              <h3 className="font-bold text-xs truncate text-white" title={props.title}>
                {props.title}
              </h3>
            </div>
            <button
              onClick={handleCopy}
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-700/50 transition-colors shrink-0"
              title="Copy card text"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Card Body - Scrollable content */}
          <div className="p-4 flex-1 overflow-y-auto space-y-3.5 text-xs">
            {/* Optional Prominent Formula Callout */}
            {props.formula && (
              <div
                className={`p-2.5 rounded-xl border font-mono font-bold text-sm tracking-wide text-center select-all shadow-inner ${activeTheme.formulaBorder}`}
              >
                {props.formula}
              </div>
            )}

            {/* Core Overview Description */}
            {props.content && (
              <div className="text-slate-300 leading-relaxed text-[11.5px] bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                {props.content}
              </div>
            )}

            {/* Derivation Steps / Sub-points */}
            {props.steps && props.steps.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Key Method & Steps</span>
                </div>
                <div className="space-y-1.5">
                  {props.steps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-2 text-[11px] text-slate-200"
                    >
                      <span className="w-4 h-4 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-snug">{step}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Key Pedagogical Takeaway / Real-world Application */}
            {props.takeaway && (
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-start gap-2">
                <Lightbulb className={`w-4 h-4 shrink-0 mt-0.5 ${activeTheme.accentText}`} />
                <div className="text-[11px] leading-tight text-slate-300">
                  <strong className="text-white block mb-0.5">Key Insight:</strong>
                  {props.takeaway}
                </div>
              </div>
            )}
          </div>

          {/* Card Footer */}
          <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-500 select-none">
            <span className="capitalize">{props.category || 'Mathematics'}</span>
            <span className="flex items-center gap-1 font-mono text-[9px]">
              <Compass className="w-2.5 h-2.5" />
              VisiOS Verified Card
            </span>
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: ILearningCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}

