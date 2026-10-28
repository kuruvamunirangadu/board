export * from './simulation';
export * from './intelligence';
export * from './session';
export * from './learning-path';
export * from './knowledge';
export * from './authoring';
export * from './ai-authoring';
export * from './multimodal';
export * from './collaboration';
export * from './analytics';
export * from './beta';
export * from './research';
export * from './telemetry';

export type WorkspaceMode = 'focus' | 'immersive';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface Workspace {
  id: string;
  title: string;
  subject?: string;
  mode: WorkspaceMode;
  createdAt: number;
  updatedAt: number;
  description?: string;
  version: string;
}

export interface BoardViewport {
  x: number;
  y: number;
  zoom: number;
}

export type ToolType = 
  | 'select'
  | 'hand'
  | 'draw'
  | 'eraser'
  | 'text'
  | 'rectangle'
  | 'ellipse'
  | 'triangle'
  | 'arrow'
  | 'line'
  | 'diamond'
  | 'note'
  | 'model3d'
  | 'simulation';

// Base Board Object
export interface BaseBoardObject {
  id: string;
  type: string;
  x?: number;
  y?: number;
  rotation?: number;
  opacity?: number;
}

// Concrete & Future Extension Types
export interface TextBoardObject extends BaseBoardObject {
  type: 'text';
  text: string;
  fontSize?: number;
  color?: string;
}

export interface ShapeBoardObject extends BaseBoardObject {
  type: 'shape';
  shapeType: 'rectangle' | 'ellipse' | 'triangle' | 'diamond' | 'arrow' | 'line';
  color?: string;
  fill?: string;
  dash?: string;
}

export interface DrawingBoardObject extends BaseBoardObject {
  type: 'drawing';
  points: { x: number; y: number }[];
  color?: string;
  strokeWidth?: number;
}

export interface DiagramBoardObject extends BaseBoardObject {
  type: 'diagram';
  nodes: string[];
  edges: { from: string; to: string; label?: string }[];
}

export interface Model3DBoardObject extends BaseBoardObject {
  type: 'model3d';
  modelUrl: string;
  scale?: [number, number, number];
}

export interface SimulationBoardObject extends BaseBoardObject {
  type: 'simulation';
  simulationType: string;
  parameters: Record<string, number>;
}

export type BoardObject =
  | TextBoardObject
  | ShapeBoardObject
  | DrawingBoardObject
  | DiagramBoardObject
  | Model3DBoardObject
  | SimulationBoardObject;

export interface BoardState {
  workspaceId: string;
  objects: BoardObject[];
  viewport: BoardViewport;
}

export interface BoardStats {
  objectCount: number;
  selectedCount: number;
  zoomLevel: number;
  viewX: number;
  viewY: number;
}

export interface ImmersiveSettings {
  showGrid: boolean;
  gridTheme: 'cyber' | 'dots' | 'minimal';
  nebulaEffect: boolean;
  hudGlow: boolean;
  floatingPanels: boolean;
}
