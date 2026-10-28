import { Workspace } from '@/types';
import { PersistenceAdapter } from './types';

const BOARD_STORAGE_PREFIX = 'visios_board_snapshot_v2_';
const METADATA_STORAGE_PREFIX = 'visios_workspace_meta_v2_';
const WORKSPACE_LIST_KEY = 'visios_workspace_index_v2';

export const defaultWorkspace: Workspace = {
  id: 'workspace-default',
  title: 'Visual Learning Canvas',
  subject: 'General Science & Math',
  mode: 'focus',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  description: 'VisiOS Interactive Digital Workspace',
  version: '1.0.0',
};

export interface StoredBoardRecord {
  schemaVersion: number;
  workspaceId: string;
  updatedAt: number;
  snapshot: any;
}

export class LocalStoragePersistenceAdapter implements PersistenceAdapter {
  private updateWorkspaceIndex(workspaceId: string) {
    try {
      const raw = localStorage.getItem(WORKSPACE_LIST_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (!list.includes(workspaceId)) {
        list.push(workspaceId);
        localStorage.setItem(WORKSPACE_LIST_KEY, JSON.stringify(list));
      }
    } catch (e) {
      // ignore index update failure
    }
  }

  async saveWorkspace(workspace: Workspace, boardSnapshot: any): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const now = Date.now();
      const updatedWorkspace: Workspace = {
        ...workspace,
        updatedAt: now,
      };

      // 1. Save Workspace Metadata
      localStorage.setItem(
        `${METADATA_STORAGE_PREFIX}${workspace.id}`,
        JSON.stringify(updatedWorkspace)
      );

      // 2. Save Board Snapshot Record with Schema Versioning
      if (boardSnapshot) {
        const record: StoredBoardRecord = {
          schemaVersion: 1,
          workspaceId: workspace.id,
          updatedAt: now,
          snapshot: boardSnapshot,
        };
        localStorage.setItem(
          `${BOARD_STORAGE_PREFIX}${workspace.id}`,
          JSON.stringify(record)
        );
      }

      this.updateWorkspaceIndex(workspace.id);
      return true;
    } catch (error: any) {
      console.error('LocalStorage persistence error:', error);
      if (error?.name === 'QuotaExceededError' || error?.code === 22) {
        console.warn('LocalStorage quota exceeded. Consider exporting workspace to JSON.');
      }
      return false;
    }
  }

  async loadWorkspace(workspaceId: string): Promise<{ workspace: Workspace; snapshot: any } | null> {
    if (typeof window === 'undefined') return null;
    try {
      const rawMeta = localStorage.getItem(`${METADATA_STORAGE_PREFIX}${workspaceId}`);
      const rawBoard = localStorage.getItem(`${BOARD_STORAGE_PREFIX}${workspaceId}`);

      let workspace: Workspace = defaultWorkspace;
      if (rawMeta) {
        try {
          workspace = { ...defaultWorkspace, ...JSON.parse(rawMeta) };
        } catch (e) {
          console.warn(`Corrupted metadata for workspace ${workspaceId}, falling back to defaults`, e);
          workspace = { ...defaultWorkspace, id: workspaceId };
        }
      } else {
        workspace = { ...defaultWorkspace, id: workspaceId };
      }

      let snapshot = null;
      if (rawBoard) {
        try {
          const parsed = JSON.parse(rawBoard);
          // Check if wrapped in StoredBoardRecord or legacy raw snapshot
          if (parsed && parsed.schemaVersion && parsed.snapshot) {
            snapshot = parsed.snapshot;
          } else {
            snapshot = parsed;
          }
        } catch (e) {
          console.error(`Corrupted board document for workspace ${workspaceId}:`, e);
          snapshot = null;
        }
      }

      return { workspace, snapshot };
    } catch (error) {
      console.error('Failed to load workspace from LocalStorage:', error);
      return null;
    }
  }

  exportWorkspace(workspace: Workspace, boardSnapshot: any, filename?: string): void {
    if (typeof window === 'undefined') return;
    try {
      const bundle = {
        app: 'VisiOS',
        schemaVersion: 1,
        version: '1.0.0',
        workspace,
        snapshot: boardSnapshot,
        exportedAt: new Date().toISOString(),
      };
      const jsonStr = JSON.stringify(bundle, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const safeName = (filename || `${workspace.title.toLowerCase().replace(/\s+/g, '-')}-visios.json`);
      a.href = url;
      a.download = safeName.endsWith('.json') ? safeName : `${safeName}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  }

  async importWorkspace(file: File): Promise<{ workspace: Workspace; snapshot: any }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const data = JSON.parse(content);
          const snapshot = data.snapshot || (data.document ? data : null);
          const workspace: Workspace = data.workspace || {
            ...defaultWorkspace,
            title: file.name.replace(/\.[^/.]+$/, ''),
            updatedAt: Date.now(),
          };

          if (snapshot && (snapshot.document || snapshot.store || snapshot.schema)) {
            resolve({ workspace, snapshot });
          } else {
            reject(new Error('Invalid VisiOS board file structure. Expected document snapshot.'));
          }
        } catch (err) {
          reject(new Error('Failed to parse JSON workspace file.'));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsText(file);
    });
  }
}

export const defaultPersistenceAdapter = new LocalStoragePersistenceAdapter();
