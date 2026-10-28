import { LearningSession, ExperimentCheckpoint, LearningActivity } from '@/types/session';

const DB_NAME = 'visios_learning_db_v1';
const DB_VERSION = 1;
const SESSIONS_STORE = 'sessions';
const CHECKPOINTS_STORE = 'checkpoints';
const ACTIVITIES_STORE = 'activities';

const LOCALSTORAGE_SESSIONS_PREFIX = 'visios_session_v1_';
const LOCALSTORAGE_INDEX_KEY = 'visios_session_index_v1';

export class SessionPersistenceAdapter {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private isIndexedDBAvailable: boolean = false;
  private memoryMap: Map<string, string> = new Map();

  constructor() {
    if (typeof window !== 'undefined' && 'indexedDB' in window) {
      this.isIndexedDBAvailable = true;
    }
  }

  private getStorageItem(key: string): string | null {
    if (typeof window !== 'undefined') {
      try {
        const item = window.localStorage?.getItem(key);
        if (item !== null && item !== undefined) return item;
      } catch (e) {
        // LocalStorage inaccessible (e.g. security policy or quota)
      }
    }
    return this.memoryMap.get(key) || null;
  }

  private setStorageItem(key: string, val: string): boolean {
    let stored = false;
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(key, val);
        stored = true;
      } catch (e: any) {
        console.warn('LocalStorage write failed, saving to memory fallback:', e);
      }
    }
    this.memoryMap.set(key, val);
    return stored || this.memoryMap.has(key);
  }

  private removeStorageItem(key: string): void {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.removeItem(key);
      } catch (e) {
        // ignore
      }
    }
    this.memoryMap.delete(key);
  }

  private async getDB(): Promise<IDBDatabase> {
    if (!this.isIndexedDBAvailable) {
      throw new Error('IndexedDB not supported in this environment');
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onupgradeneeded = (e: IDBVersionChangeEvent) => {
          const db = (e.target as IDBOpenDBRequest).result;
          if (!db.objectStoreNames.contains(SESSIONS_STORE)) {
            db.createObjectStore(SESSIONS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(CHECKPOINTS_STORE)) {
            const cpStore = db.createObjectStore(CHECKPOINTS_STORE, { keyPath: 'id' });
            cpStore.createIndex('sessionId', 'sessionId', { unique: false });
          }
          if (!db.objectStoreNames.contains(ACTIVITIES_STORE)) {
            const actStore = db.createObjectStore(ACTIVITIES_STORE, { keyPath: 'id' });
            actStore.createIndex('sessionId', 'sessionId', { unique: false });
          }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    }
    return this.dbPromise;
  }

  // --- Topic Normalization ---

  public static normalizeTopicKey(topic: string): string {
    return (topic || '')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'general';
  }

  // --- Schema Validation & Migration ---

  public validateSessionRecord(raw: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!raw || typeof raw !== 'object') {
      return { isValid: false, errors: ['Session record must be a valid non-null object'] };
    }
    if (!raw.id || typeof raw.id !== 'string') {
      errors.push('Missing or invalid "id" field');
    }
    if (!raw.primaryTopic || typeof raw.primaryTopic !== 'string') {
      errors.push('Missing or invalid "primaryTopic" field');
    }
    if (typeof raw.createdAt !== 'number' || isNaN(raw.createdAt)) {
      errors.push('Missing or invalid "createdAt" timestamp');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public migrateSessionRecord(raw: any): LearningSession {
    const now = Date.now();
    return {
      schemaVersion: typeof raw.schemaVersion === 'number' ? raw.schemaVersion : 1,
      id: raw.id || `session-${SessionPersistenceAdapter.normalizeTopicKey(raw.primaryTopic || 'study')}`,
      title: raw.title || raw.primaryTopic || 'Untitled Learning Session',
      primaryTopic: raw.primaryTopic || 'General Study',
      domain: raw.domain,
      conceptId: raw.conceptId,
      subject: raw.subject || 'General',
      description: raw.description || '',
      createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : now,
      updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : now,
      lastOpenedAt: typeof raw.lastOpenedAt === 'number' ? raw.lastOpenedAt : now,
      version: raw.version || '1.0.0',
      mode: raw.mode || 'focus',
      tags: Array.isArray(raw.tags) ? raw.tags : [],
      boardSnapshot: raw.boardSnapshot || null,
      checkpoints: Array.isArray(raw.checkpoints) ? raw.checkpoints : [],
      activities: Array.isArray(raw.activities) ? raw.activities : [],

      currentLessonStep: raw.currentLessonStep || 'concept_meaning',
      completedSteps: Array.isArray(raw.completedSteps) ? raw.completedSteps : [],
      activeTab: raw.activeTab || 'understand',
      isGuidedMode: typeof raw.isGuidedMode === 'boolean' ? raw.isGuidedMode : true,
      isCompleted: typeof raw.isCompleted === 'boolean' ? raw.isCompleted : false,
      practiceAttempts: raw.practiceAttempts || undefined,
      simulationState: raw.simulationState || undefined,
      experimentLabState: raw.experimentLabState || undefined,
      workspaceId: raw.workspaceId,
    };
  }

  // --- Session Management ---

  async createSession(session: Partial<LearningSession>): Promise<LearningSession> {
    const now = Date.now();
    const topicKey = SessionPersistenceAdapter.normalizeTopicKey(session.primaryTopic || 'study');
    const newSession: LearningSession = {
      schemaVersion: 1,
      id: session.id || `session-${topicKey}`,
      title: session.title || session.primaryTopic || 'Untitled Learning Session',
      primaryTopic: session.primaryTopic || 'General Study',
      domain: session.domain,
      conceptId: session.conceptId,
      subject: session.subject || 'General',
      description: session.description || '',
      createdAt: session.createdAt || now,
      updatedAt: now,
      lastOpenedAt: now,
      version: '1.0.0',
      mode: session.mode || 'focus',
      tags: session.tags || [],
      boardSnapshot: session.boardSnapshot || null,
      checkpoints: session.checkpoints || [],
      activities: session.activities || [],

      currentLessonStep: session.currentLessonStep || 'concept_meaning',
      completedSteps: session.completedSteps || [],
      activeTab: session.activeTab || 'understand',
      isGuidedMode: typeof session.isGuidedMode === 'boolean' ? session.isGuidedMode : true,
      isCompleted: typeof session.isCompleted === 'boolean' ? session.isCompleted : false,
      practiceAttempts: session.practiceAttempts,
      simulationState: session.simulationState,
      experimentLabState: session.experimentLabState,
      workspaceId: session.workspaceId,
    };

    if (this.isIndexedDBAvailable) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([SESSIONS_STORE], 'readwrite');
          const store = tx.objectStore(SESSIONS_STORE);
          const req = store.put(newSession);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('IndexedDB write failed, falling back to storage helper', err);
      }
    }

    // Safe Storage Fallback (localStorage / memoryMap)
    try {
      this.setStorageItem(`${LOCALSTORAGE_SESSIONS_PREFIX}${newSession.id}`, JSON.stringify(newSession));
      const rawIndex = this.getStorageItem(LOCALSTORAGE_INDEX_KEY);
      const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
      if (!index.includes(newSession.id)) {
        index.push(newSession.id);
        this.setStorageItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify(index));
      }
    } catch (e) {
      console.error('Storage write failed:', e);
    }
    return newSession;
  }

  async listSessions(): Promise<LearningSession[]> {
    if (this.isIndexedDBAvailable) {
      try {
        const db = await this.getDB();
        const sessions = await new Promise<LearningSession[]>((resolve, reject) => {
          const tx = db.transaction([SESSIONS_STORE], 'readonly');
          const store = tx.objectStore(SESSIONS_STORE);
          const req = store.getAll();
          req.onsuccess = () => resolve(req.result || []);
          req.onerror = () => reject(req.error);
        });
        if (sessions.length > 0) {
          return sessions
            .map((s) => this.migrateSessionRecord(s))
            .sort((a, b) => b.updatedAt - a.updatedAt);
        }
      } catch (err) {
        console.warn('IndexedDB list failed, falling back to storage helper', err);
      }
    }

    // Storage helper fallback
    try {
      const rawIndex = this.getStorageItem(LOCALSTORAGE_INDEX_KEY);
      const index: string[] = rawIndex ? JSON.parse(rawIndex) : [];
      const sessions: LearningSession[] = [];
      for (const id of index) {
        const raw = this.getStorageItem(`${LOCALSTORAGE_SESSIONS_PREFIX}${id}`);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            sessions.push(this.migrateSessionRecord(parsed));
          } catch (e) {
            console.warn(`Corrupt session record ${id} safely ignored`);
          }
        }
      }
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    } catch (e) {
      return [];
    }
  }

  async getSession(sessionId: string): Promise<LearningSession | null> {
    if (this.isIndexedDBAvailable) {
      try {
        const db = await this.getDB();
        const session = await new Promise<LearningSession | null>((resolve, reject) => {
          const tx = db.transaction([SESSIONS_STORE], 'readonly');
          const store = tx.objectStore(SESSIONS_STORE);
          const req = store.get(sessionId);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        });
        if (session) return this.migrateSessionRecord(session);
      } catch (err) {
        console.warn('IndexedDB get failed, falling back to storage helper', err);
      }
    }

    try {
      const raw = this.getStorageItem(`${LOCALSTORAGE_SESSIONS_PREFIX}${sessionId}`);
      return raw ? this.migrateSessionRecord(JSON.parse(raw)) : null;
    } catch (e) {
      return null;
    }
  }

  async findSessionByTopic(topic: string): Promise<LearningSession | null> {
    if (!topic || !topic.trim()) return null;
    const norm = SessionPersistenceAdapter.normalizeTopicKey(topic);
    const candidateId = `session-${norm}`;

    // Direct ID lookup first
    const direct = await this.getSession(candidateId);
    if (direct) return direct;

    // Search across list
    const sessions = await this.listSessions();
    const match = sessions.find(
      (s) =>
        SessionPersistenceAdapter.normalizeTopicKey(s.primaryTopic) === norm ||
        s.primaryTopic.toLowerCase() === topic.trim().toLowerCase()
    );
    return match || null;
  }

  async saveOrUpdateLearningSession(
    sessionData: Partial<LearningSession> & { primaryTopic: string }
  ): Promise<LearningSession> {
    const existing =
      (sessionData.id ? await this.getSession(sessionData.id) : null) ||
      (await this.findSessionByTopic(sessionData.primaryTopic));

    if (existing) {
      const updated = await this.updateSession(existing.id, {
        ...sessionData,
        lastOpenedAt: Date.now(),
      });
      if (updated) return updated;
    }

    return await this.createSession(sessionData);
  }

  async updateSession(sessionId: string, updates: Partial<LearningSession>): Promise<LearningSession | null> {
    const existing = await this.getSession(sessionId);
    if (!existing) return null;

    const updated: LearningSession = {
      ...existing,
      ...updates,
      updatedAt: Date.now(),
      lastOpenedAt: updates.lastOpenedAt || Date.now(),
    };

    if (this.isIndexedDBAvailable) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([SESSIONS_STORE], 'readwrite');
          const store = tx.objectStore(SESSIONS_STORE);
          const req = store.put(updated);
          req.onsuccess = () => resolve();
          req.onerror = () => reject(req.error);
        });
      } catch (err) {
        console.warn('IndexedDB update failed', err);
      }
    }

    try {
      this.setStorageItem(`${LOCALSTORAGE_SESSIONS_PREFIX}${sessionId}`, JSON.stringify(updated));
    } catch (e) {
      console.error('Storage update failed', e);
    }
    return updated;
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    if (this.isIndexedDBAvailable) {
      try {
        const db = await this.getDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction([SESSIONS_STORE, CHECKPOINTS_STORE, ACTIVITIES_STORE], 'readwrite');
          tx.objectStore(SESSIONS_STORE).delete(sessionId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('IndexedDB delete failed', err);
      }
    }

    try {
      this.removeStorageItem(`${LOCALSTORAGE_SESSIONS_PREFIX}${sessionId}`);
      const rawIndex = this.getStorageItem(LOCALSTORAGE_INDEX_KEY);
      if (rawIndex) {
        const index: string[] = JSON.parse(rawIndex);
        const filtered = index.filter((id) => id !== sessionId);
        this.setStorageItem(LOCALSTORAGE_INDEX_KEY, JSON.stringify(filtered));
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  async clearAllSessions(): Promise<void> {
    const sessions = await this.listSessions();
    for (const s of sessions) {
      await this.deleteSession(s.id);
    }
    this.removeStorageItem(LOCALSTORAGE_INDEX_KEY);
  }

  // --- Checkpoints ---

  async saveCheckpoint(
    sessionId: string,
    checkpoint: Omit<ExperimentCheckpoint, 'id' | 'createdAt'>
  ): Promise<ExperimentCheckpoint> {
    const newCheckpoint: ExperimentCheckpoint = {
      ...checkpoint,
      id: `cp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId,
      createdAt: Date.now(),
    };

    // Update parent session with checkpoint embedded as well
    const session = await this.getSession(sessionId);
    if (session) {
      const existingCps = session.checkpoints || [];
      await this.updateSession(sessionId, {
        checkpoints: [...existingCps, newCheckpoint],
      });
    }

    return newCheckpoint;
  }

  async listCheckpoints(sessionId: string): Promise<ExperimentCheckpoint[]> {
    const session = await this.getSession(sessionId);
    return session?.checkpoints || [];
  }

  async deleteCheckpoint(sessionId: string, checkpointId: string): Promise<boolean> {
    const session = await this.getSession(sessionId);
    if (!session) return false;
    const updatedCps = (session.checkpoints || []).filter((cp) => cp.id !== checkpointId);
    await this.updateSession(sessionId, { checkpoints: updatedCps });
    return true;
  }

  // --- Learning Activity Continuity ---

  async recordLearningActivity(
    sessionId: string,
    activity: Omit<LearningActivity, 'id' | 'timestamp'>
  ): Promise<LearningActivity> {
    const newActivity: LearningActivity = {
      ...activity,
      id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionId,
      timestamp: Date.now(),
    };

    const session = await this.getSession(sessionId);
    if (session) {
      const existingActs = session.activities || [];
      // Keep up to 100 most recent activities
      const updatedActs = [newActivity, ...existingActs].slice(0, 100);
      await this.updateSession(sessionId, { activities: updatedActs });
    }

    return newActivity;
  }

  async getLearningActivities(sessionId: string): Promise<LearningActivity[]> {
    const session = await this.getSession(sessionId);
    return session?.activities || [];
  }

  // --- Export & Import ---

  async exportSession(sessionId: string): Promise<string> {
    const session = await this.getSession(sessionId);
    if (!session) throw new Error('Session not found for export');

    const exportBundle = {
      app: 'VisiOS',
      schemaVersion: 1,
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      session,
    };

    return JSON.stringify(exportBundle, null, 2);
  }

  async importSession(jsonString: string): Promise<LearningSession> {
    let parsed: any;
    try {
      parsed = JSON.parse(jsonString);
    } catch (e) {
      throw new Error('Invalid JSON formatting in session file.');
    }

    if (!parsed || (!parsed.session && !parsed.workspace)) {
      throw new Error('Invalid VisiOS session structure: Missing session root.');
    }

    const rawSession = parsed.session || parsed.workspace;
    const importedId = `session-imported-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const importedSession: LearningSession = {
      id: importedId,
      title: `${rawSession.title || 'Imported Session'} (Imported)`,
      primaryTopic: rawSession.primaryTopic || 'Imported Study',
      subject: rawSession.subject || 'General',
      description: rawSession.description || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
      version: '1.0.0',
      mode: rawSession.mode || 'focus',
      tags: rawSession.tags || [],
      boardSnapshot: rawSession.boardSnapshot || parsed.snapshot || null,
      checkpoints: rawSession.checkpoints || [],
      activities: rawSession.activities || [],
    };

    return await this.createSession(importedSession);
  }
}

export const sessionPersistence = new SessionPersistenceAdapter();

