'use client';

import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T } from 'tldraw';
import { LinearFunctionPlotterView } from '@/components/math/LinearFunctionPlotterView';
import { PythagoreanDissectionProofView } from '@/components/math/PythagoreanDissectionProofView';
import { FractionVisualizerView } from '@/components/math/FractionVisualizerView';
import { CodeTracingView } from '@/components/code-tracing/CodeTracingView';
import { WhatIfScenarioView } from '@/components/what-if/WhatIfScenarioView';
import { Sparkles, Move, Compass, Code2, GitCompare } from 'lucide-react';

export type IGeometryShape = TLBaseShape<
  'geometry',
  {
    w: number;
    h: number;
    geometryType: 'linear_plotter' | 'pythagorean_proof' | 'fraction_visualizer' | 'code_tracer' | 'what_if';
    title: string;
    slope: number;
    intercept: number;
    a: number;
    b: number;
    numerator: number;
    denominator: number;
    functionExpression?: string;
    algorithmId?: string;
    experimentId?: string;
  }
>;

export class GeometryShapeUtil extends BaseBoxShapeUtil<IGeometryShape> {
  static override type = 'geometry' as const;

  static override props = {
    w: T.number,
    h: T.number,
    geometryType: T.string as any,
    title: T.string,
    slope: T.number,
    intercept: T.number,
    a: T.number,
    b: T.number,
    numerator: T.number,
    denominator: T.number,
    functionExpression: T.optional(T.string),
    algorithmId: T.optional(T.string),
    experimentId: T.optional(T.string),
  };

  override getDefaultProps(): IGeometryShape['props'] {
    return {
      w: 520,
      h: 560,
      geometryType: 'linear_plotter',
      title: 'Interactive Geometric Drawing',
      slope: 2,
      intercept: 1,
      a: 3,
      b: 4,
      numerator: 3,
      denominator: 4,
    };
  }

  override canResize = () => true;

  override component(shape: IGeometryShape) {
    const { props } = shape;

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
        <div className="w-full h-full rounded-2xl bg-slate-950 border border-indigo-500/30 shadow-2xl overflow-hidden flex flex-col text-slate-100 select-none">
          {/* Header Bar */}
          <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-indigo-500/20 text-indigo-400">
                <Compass className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {props.title || 'Live Geometric Drawing'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
              Interactive Whiteboard Drawing
            </span>
          </div>

          {/* Geometry View Content */}
          <div className="flex-1 overflow-y-auto p-2 bg-slate-950">
            {props.geometryType === 'linear_plotter' && (
              <LinearFunctionPlotterView
                initialSlope={props.slope ?? 2}
                initialIntercept={props.intercept ?? 1}
                equationTitle={props.title}
                functionExpression={props.functionExpression}
                isCompact={true}
              />
            )}
            {props.geometryType === 'pythagorean_proof' && (
              <PythagoreanDissectionProofView
                initialA={props.a ?? 3}
                initialB={props.b ?? 4}
                isCompact={true}
              />
            )}
            {props.geometryType === 'fraction_visualizer' && (
              <FractionVisualizerView
                initialNumerator={props.numerator ?? 3}
                initialDenominator={props.denominator ?? 4}
                isCompact={true}
              />
            )}
            {props.geometryType === 'code_tracer' && (
              <CodeTracingView
                initialAlgorithmId={props.algorithmId || 'binary_search'}
              />
            )}
            {props.geometryType === 'what_if' && (
              <WhatIfScenarioView
                initialExperimentId={props.experimentId || 'exp_projectile_motion'}
              />
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: IGeometryShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}

