'use client';

import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T } from 'tldraw';
import { UniversalSimulationView, SimulationType } from '@/components/simulation/UniversalSimulationView';
import { PendulumParams } from '@/types/simulation';

export type ISimulationShape = TLBaseShape<
  'simulation',
  {
    w: number;
    h: number;
    simulationType: string;
    gravity: number;
    length: number;
    damping: number;
    initialAngle: number;
    speed: number;
  }
>;

export class SimulationShapeUtil extends BaseBoxShapeUtil<ISimulationShape> {
  static override type = 'simulation' as const;

  static override props = {
    w: T.number,
    h: T.number,
    simulationType: T.string,
    gravity: T.number,
    length: T.number,
    damping: T.number,
    initialAngle: T.number,
    speed: T.number,
  };

  override getDefaultProps(): ISimulationShape['props'] {
    return {
      w: 390,
      h: 370,
      simulationType: 'pendulum',
      gravity: 9.81,
      length: 2.0,
      damping: 0.04,
      initialAngle: 45,
      speed: 1.0,
    };
  }

  override canResize = () => true;

  override component(shape: ISimulationShape) {
    const handleUpdateParams = (params: Partial<PendulumParams>) => {
      this.editor.updateShape<ISimulationShape>({
        id: shape.id,
        type: 'simulation',
        props: {
          ...shape.props,
          ...(params.gravity !== undefined ? { gravity: params.gravity } : {}),
          ...(params.length !== undefined ? { length: params.length } : {}),
          ...(params.damping !== undefined ? { damping: params.damping } : {}),
          ...(params.initialAngle !== undefined ? { initialAngle: params.initialAngle } : {}),
          ...(params.speed !== undefined ? { speed: params.speed } : {}),
        },
      });
    };

    const handleUpdateSimulationType = (simulationType: SimulationType) => {
      this.editor.updateShape<ISimulationShape>({
        id: shape.id,
        type: 'simulation',
        props: {
          ...shape.props,
          simulationType,
        },
      });
    };

    return (
      <HTMLContainer
        id={shape.id}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          pointerEvents: 'all',
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <UniversalSimulationView
          initialSimulationType={shape.props.simulationType}
          initialParams={{
            gravity: shape.props.gravity,
            length: shape.props.length,
            damping: shape.props.damping,
            initialAngle: shape.props.initialAngle,
            speed: shape.props.speed,
          }}
          onUpdateParams={handleUpdateParams}
          onUpdateSimulationType={handleUpdateSimulationType}
          isImmersive={false}
        />
      </HTMLContainer>
    );
  }

  override indicator(shape: ISimulationShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
