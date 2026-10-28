'use client';

import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T } from 'tldraw';
import { InteractiveTopicKnowledgeGraphView } from '@/components/learning/InteractiveTopicKnowledgeGraphView';
import { Network, Compass, Sparkles } from 'lucide-react';

export type ITopicGraphShape = TLBaseShape<
  'topic-graph',
  {
    w: number;
    h: number;
    topicQuery: string;
    conceptId: string;
    title: string;
  }
>;

export class TopicGraphShapeUtil extends BaseBoxShapeUtil<ITopicGraphShape> {
  static override type = 'topic-graph' as const;

  static override props = {
    w: T.number,
    h: T.number,
    topicQuery: T.string,
    conceptId: T.string,
    title: T.string,
  };

  override getDefaultProps(): ITopicGraphShape['props'] {
    return {
      w: 540,
      h: 460,
      topicQuery: 'linear function',
      conceptId: 'math_linear_functions',
      title: 'Topic Knowledge Graph',
    };
  }

  override canResize = () => true;

  override component(shape: ITopicGraphShape) {
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
        <div className="w-full h-full rounded-2xl bg-slate-950 border border-cyan-500/30 shadow-2xl overflow-hidden flex flex-col text-slate-100 select-none">
          {/* Header Bar */}
          <div className="px-3.5 py-2 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                <Network className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold text-white tracking-wide">
                {props.title || 'Topic Knowledge Graph'}
              </span>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-cyan-400 border border-cyan-800/40">
              Prerequisite & Unlock Map
            </span>
          </div>

          {/* Graph View */}
          <div className="flex-1 overflow-y-auto p-2 bg-slate-950">
            <InteractiveTopicKnowledgeGraphView
              topicQuery={props.topicQuery || 'linear function'}
            />
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: ITopicGraphShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
