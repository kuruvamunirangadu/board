import { Workspace } from '@/types';

export interface PersistenceAdapter {
  saveWorkspace(workspace: Workspace, boardSnapshot: any): Promise<boolean>;
  loadWorkspace(workspaceId: string): Promise<{ workspace: Workspace; snapshot: any } | null>;
  exportWorkspace(workspace: Workspace, boardSnapshot: any, filename?: string): void;
  importWorkspace(file: File): Promise<{ workspace: Workspace; snapshot: any }>;
}

