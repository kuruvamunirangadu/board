'use client';

import React, { useMemo } from 'react';
import { Tldraw, Editor } from 'tldraw';
import { WorkspaceMode } from '@/types';
import { Model3dShapeUtil } from './Model3dShapeUtil';
import { SimulationShapeUtil } from './SimulationShapeUtil';
import { GeometryShapeUtil } from './GeometryShapeUtil';
import { LearningCardShapeUtil } from './LearningCardShapeUtil';
import { TopicGraphShapeUtil } from './TopicGraphShapeUtil';

export const VISIOS_CUSTOM_SHAPE_UTILS = [
  Model3dShapeUtil,
  SimulationShapeUtil,
  GeometryShapeUtil,
  LearningCardShapeUtil,
  TopicGraphShapeUtil,
];

interface CanvasHostProps {
  onEditorMount: (editor: Editor) => void;
  mode: WorkspaceMode;
}

export const CanvasHost: React.FC<CanvasHostProps> = ({ onEditorMount, mode }) => {
  const customShapeUtils = useMemo(() => VISIOS_CUSTOM_SHAPE_UTILS, []);

  return (
    <div 
      className={`w-full h-full relative visios-canvas-container ${
        mode === 'immersive' ? 'immersive-mode' : 'focus-mode'
      }`}
    >
      <Tldraw
        shapeUtils={customShapeUtils}
        onMount={onEditorMount}
        hideUi={true}
        autoFocus
      />
    </div>
  );
};
