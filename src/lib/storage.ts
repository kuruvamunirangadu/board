import { Editor, getSnapshot } from 'tldraw';
import { WorkspaceMetadata } from '@/types/board';

const BOARD_STORAGE_KEY = 'visios_board_snapshot_v1';
const METADATA_STORAGE_KEY = 'visios_board_metadata_v1';

export const defaultMetadata: WorkspaceMetadata = {
  id: 'workspace-default',
  name: 'Visual Learning Canvas',
  createdAt: Date.now(),
  lastModifiedAt: Date.now(),
  description: 'VisiOS Interactive Digital Workspace',
  version: '1.0.0',
};

export function saveBoardToStorage(editor: Editor, meta?: Partial<WorkspaceMetadata>): boolean {
  if (!editor || typeof window === 'undefined') return false;
  try {
    const snapshot = getSnapshot(editor.store);
    localStorage.setItem(BOARD_STORAGE_KEY, JSON.stringify(snapshot));
    
    const existingMeta = getMetadataFromStorage();
    const updatedMeta: WorkspaceMetadata = {
      ...existingMeta,
      ...meta,
      lastModifiedAt: Date.now(),
    };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(updatedMeta));
    return true;
  } catch (error) {
    console.error('Failed to save board to storage:', error);
    return false;
  }
}

export function loadBoardSnapshotFromStorage(): any | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(BOARD_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (error) {
    console.error('Failed to load board from storage:', error);
    return null;
  }
}

export function getMetadataFromStorage(): WorkspaceMetadata {
  if (typeof window === 'undefined') return defaultMetadata;
  try {
    const raw = localStorage.getItem(METADATA_STORAGE_KEY);
    if (!raw) return defaultMetadata;
    return { ...defaultMetadata, ...JSON.parse(raw) };
  } catch (error) {
    return defaultMetadata;
  }
}

export function exportBoardAsJson(editor: Editor, filename: string = 'visios-workspace.json') {
  if (!editor) return;
  try {
    const snapshot = getSnapshot(editor.store);
    const meta = getMetadataFromStorage();
    const bundle = {
      app: 'VisiOS',
      version: '1.0.0',
      metadata: meta,
      snapshot: snapshot,
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(bundle, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (e) {
    console.error('Export failed', e);
  }
}

export function importBoardFromJson(
  file: File,
  editor: Editor,
  onSuccess: (meta: WorkspaceMetadata) => void,
  onError: (msg: string) => void
) {
  if (!editor) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string;
      const data = JSON.parse(content);
      
      const snapshot = data.snapshot || data;
      if (snapshot && snapshot.document) {
        editor.store.loadSnapshot(snapshot);
        const meta: WorkspaceMetadata = data.metadata || {
          ...defaultMetadata,
          name: file.name.replace(/\.[^/.]+$/, ''),
          lastModifiedAt: Date.now(),
        };
        saveBoardToStorage(editor, meta);
        onSuccess(meta);
      } else {
        onError('Invalid VisiOS board file format');
      }
    } catch (err) {
      console.error(err);
      onError('Could not parse board file');
    }
  };
  reader.onerror = () => onError('Failed to read file');
  reader.readAsText(file);
}

