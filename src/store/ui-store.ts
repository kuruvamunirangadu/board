import { ToolType, ImmersiveSettings } from '@/types';

export interface UIState {
  activeTool: ToolType;
  currentColor: string;
  currentSize: 's' | 'm' | 'l' | 'xl';
  isSidebarOpen: boolean;
  isShortcutsOpen: boolean;
  activeSidebarTab: 'properties' | 'outline' | 'spatial' | 'telemetry';
  immersiveSettings: ImmersiveSettings;
}

export const defaultUIState: UIState = {
  activeTool: 'select',
  currentColor: 'light-blue',
  currentSize: 'm',
  isSidebarOpen: false,
  isShortcutsOpen: false,
  activeSidebarTab: 'properties',
  immersiveSettings: {
    showGrid: true,
    gridTheme: 'cyber',
    nebulaEffect: true,
    hudGlow: true,
    floatingPanels: true,
  },
};

