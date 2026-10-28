export type PresentationMode = 'focus' | 'immersive';

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
  | 'note';

export type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

export interface WorkspaceMetadata {
  id: string;
  name: string;
  createdAt: number;
  lastModifiedAt: number;
  description?: string;
  version: string;
}

export interface BoardStats {
  objectCount: number;
  selectedCount: number;
  zoomLevel: number;
  viewX: number;
  viewY: number;
}

export interface SelectedObjectProperties {
  id: string;
  type: string;
  color?: string;
  fill?: string;
  size?: string;
  dash?: string;
  opacity?: number;
  text?: string;
}

export interface ImmersiveSettings {
  showGrid: boolean;
  gridTheme: 'cyber' | 'dots' | 'minimal';
  nebulaEffect: boolean;
  hudGlow: boolean;
  floatingPanels: boolean;
}

