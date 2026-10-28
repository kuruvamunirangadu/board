'use client';

import React from 'react';
import { BaseBoxShapeUtil, HTMLContainer, TLBaseShape, T } from 'tldraw';
import { Universal3DViewer } from '@/components/3d/Universal3DViewer';

export type IModel3dShape = TLBaseShape<
  'model3d',
  {
    w: number;
    h: number;
    modelType: string;
    rotationX: number;
    rotationY: number;
    zoom: number;
    isPulsing: boolean;
  }
>;

export class Model3dShapeUtil extends BaseBoxShapeUtil<IModel3dShape> {
  static override type = 'model3d' as const;

  static override props = {
    w: T.number,
    h: T.number,
    modelType: T.string,
    rotationX: T.number,
    rotationY: T.number,
    zoom: T.number,
    isPulsing: T.boolean,
  };

  override getDefaultProps(): IModel3dShape['props'] {
    return {
      w: 380,
      h: 380,
      modelType: 'heart',
      rotationX: 0.2,
      rotationY: -0.4,
      zoom: 1,
      isPulsing: true,
    };
  }

  override canResize = () => true;
  override isAspectRatioLocked = () => true;

  override component(shape: IModel3dShape) {
    const handleUpdate = (updatedProps: Partial<IModel3dShape['props']>) => {
      this.editor.updateShape<IModel3dShape>({
        id: shape.id,
        type: 'model3d',
        props: {
          ...shape.props,
          ...updatedProps,
        },
      });
    };

    const handleUpdateModelType = (modelType: string) => {
      this.editor.updateShape<IModel3dShape>({
        id: shape.id,
        type: 'model3d',
        props: {
          ...shape.props,
          modelType,
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
        <Universal3DViewer
          initialModelType={shape.props.modelType}
          rotationX={shape.props.rotationX}
          rotationY={shape.props.rotationY}
          zoom={shape.props.zoom}
          isPulsing={shape.props.isPulsing}
          onUpdateTransform={handleUpdate}
          onUpdateModelType={handleUpdateModelType}
          isImmersive={false}
        />
      </HTMLContainer>
    );
  }

  override indicator(shape: IModel3dShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
