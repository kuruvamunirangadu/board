/**
 * VisiOS — Document Persistence Service
 * Step 11: In-memory and browser localStorage persistence for imported study documents,
 * maintaining document records, page metadata, and grounded learning references.
 */

import { ImportedDocument } from './DocumentTypes';

export class DocumentPersistenceService {
  private static readonly STORAGE_KEY = 'visios_imported_documents_v1';
  private static memoryStore: Map<string, ImportedDocument> = new Map();
  private static isInitialized: boolean = false;

  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem(this.STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            for (const doc of parsed) {
              if (doc && doc.id) {
                this.memoryStore.set(doc.id, doc);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load imported documents from localStorage:', e);
      }
    }
  }

  private static persistToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const all = Array.from(this.memoryStore.values());
        window.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed to persist imported documents to localStorage:', e);
      }
    }
  }

  public static async saveDocument(doc: ImportedDocument): Promise<ImportedDocument> {
    this.init();
    this.memoryStore.set(doc.id, doc);
    this.persistToStorage();
    return doc;
  }

  public static async getDocument(id: string): Promise<ImportedDocument | null> {
    this.init();
    if (!id) return null;
    return this.memoryStore.get(id) || null;
  }

  public static async listDocuments(): Promise<ImportedDocument[]> {
    this.init();
    return Array.from(this.memoryStore.values()).sort((a, b) => b.extractedAt - a.extractedAt);
  }

  public static async deleteDocument(id: string): Promise<boolean> {
    this.init();
    const existed = this.memoryStore.delete(id);
    if (existed) {
      this.persistToStorage();
    }
    return existed;
  }

  public static async clearAllDocuments(): Promise<void> {
    this.init();
    this.memoryStore.clear();
    this.persistToStorage();
  }
}

