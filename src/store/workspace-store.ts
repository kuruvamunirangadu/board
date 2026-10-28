import { Workspace, WorkspaceMode, SaveStatus, BoardStats } from '@/types';
import { defaultWorkspace, defaultPersistenceAdapter } from '@/lib/persistence';
import { Editor, getSnapshot } from 'tldraw';

export interface WorkspaceState {
  workspace: Workspace;
  saveStatus: SaveStatus;
  lastSavedAt: number;
  boardStats: BoardStats;
  isHydrated: boolean;
}

export class WorkspaceController {
  private state: WorkspaceState;
  private listeners: Set<(state: WorkspaceState) => void> = new Set();
  private editor: Editor | null = null;
  private autoSaveTimeout: NodeJS.Timeout | null = null;
  private currentRevision: number = 0;

  constructor(initialWorkspace: Workspace = defaultWorkspace) {
    this.state = {
      workspace: initialWorkspace,
      saveStatus: 'saved',
      lastSavedAt: Date.now(),
      isHydrated: false,
      boardStats: {
        objectCount: 0,
        selectedCount: 0,
        zoomLevel: 1,
        viewX: 0,
        viewY: 0,
      },
    };
  }

  getState(): WorkspaceState {
    return this.state;
  }

  subscribe(listener: (state: WorkspaceState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  setEditor(editor: Editor | null) {
    this.editor = editor;
  }

  getEditor(): Editor | null {
    return this.editor;
  }

  markHydrated(hydrated: boolean = true) {
    this.state = {
      ...this.state,
      isHydrated: hydrated,
    };
    this.notify();
  }

  setMode(mode: WorkspaceMode) {
    this.state = {
      ...this.state,
      workspace: {
        ...this.state.workspace,
        mode,
        updatedAt: Date.now(),
      },
    };
    this.notify();
    if (this.state.isHydrated) {
      this.scheduleSave();
    }
  }

  setTitle(title: string) {
    this.state = {
      ...this.state,
      workspace: {
        ...this.state.workspace,
        title,
        updatedAt: Date.now(),
      },
    };
    this.notify();
    if (this.state.isHydrated) {
      this.scheduleSave();
    }
  }

  setWorkspace(workspace: Workspace) {
    this.state = {
      ...this.state,
      workspace,
      saveStatus: 'saved',
      lastSavedAt: Date.now(),
    };
    this.notify();
  }

  updateBoardStats(stats: Partial<BoardStats>) {
    this.state = {
      ...this.state,
      boardStats: {
        ...this.state.boardStats,
        ...stats,
      },
    };
    this.notify();
  }

  setSaveStatus(status: SaveStatus) {
    this.state = {
      ...this.state,
      saveStatus: status,
    };
    this.notify();
  }

  scheduleSave(delay: number = 700) {
    if (!this.state.isHydrated) return;
    this.setSaveStatus('unsaved');
    if (this.autoSaveTimeout) clearTimeout(this.autoSaveTimeout);
    this.autoSaveTimeout = setTimeout(() => {
      this.save();
    }, delay);
  }

  async save(): Promise<boolean> {
    if (!this.state.isHydrated && this.editor) {
      // Don't save before hydration completes
      return false;
    }

    const revision = ++this.currentRevision;
    this.setSaveStatus('saving');

    const snapshot = this.editor ? getSnapshot(this.editor.store) : null;
    const success = await defaultPersistenceAdapter.saveWorkspace(
      this.state.workspace,
      snapshot
    );

    // Ensure older async saves do not overwrite newer revisions
    if (revision === this.currentRevision) {
      if (success) {
        this.state = {
          ...this.state,
          saveStatus: 'saved',
          lastSavedAt: Date.now(),
        };
        this.notify();
      } else {
        this.setSaveStatus('error');
      }
    }
    return success;
  }
}
