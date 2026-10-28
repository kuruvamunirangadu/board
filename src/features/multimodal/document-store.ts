import { SourceDocument, SourceSegment } from '@/types/multimodal';

const DOCS_STORAGE_KEY = 'visios_source_documents_v1';
const SEGMENTS_STORAGE_KEY = 'visios_source_segments_v1';

export class DocumentStore {
  private documents: Map<string, SourceDocument> = new Map();
  private segments: Map<string, SourceSegment[]> = new Map(); // key = documentId
  private initialized: boolean = false;

  constructor() {
    this.init();
  }

  private init(): void {
    if (this.initialized) return;

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const storedDocs = localStorage.getItem(DOCS_STORAGE_KEY);
        if (storedDocs) {
          const parsed = JSON.parse(storedDocs) as SourceDocument[];
          parsed.forEach((d) => this.documents.set(d.id, d));
        }

        const storedSegs = localStorage.getItem(SEGMENTS_STORAGE_KEY);
        if (storedSegs) {
          const parsed = JSON.parse(storedSegs) as Record<string, SourceSegment[]>;
          Object.entries(parsed).forEach(([docId, list]) => this.segments.set(docId, list));
        }
      } catch (e) {
        console.warn('Failed to load multimodal documents from localStorage:', e);
      }
    }

    this.initialized = true;
  }

  private persist(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const docList = Array.from(this.documents.values());
        localStorage.setItem(DOCS_STORAGE_KEY, JSON.stringify(docList));

        const segObj: Record<string, SourceSegment[]> = {};
        this.segments.forEach((v, k) => {
          segObj[k] = v;
        });
        localStorage.setItem(SEGMENTS_STORAGE_KEY, JSON.stringify(segObj));
      } catch (e) {
        console.warn('Failed to persist multimodal document store:', e);
      }
    }
  }

  saveDocument(doc: SourceDocument, segments: SourceSegment[]): void {
    this.documents.set(doc.id, doc);
    this.segments.set(doc.id, segments);
    this.persist();
  }

  listDocuments(): SourceDocument[] {
    return Array.from(this.documents.values()).sort((a, b) => b.importTimestamp - a.importTimestamp);
  }

  getDocument(id: string): SourceDocument | undefined {
    return this.documents.get(id);
  }

  getSegments(documentId: string): SourceSegment[] {
    return this.segments.get(documentId) || [];
  }

  getSegment(segmentId: string): SourceSegment | undefined {
    const allLists = Array.from(this.segments.values());
    for (const segList of allLists) {
      const found = segList.find((s) => s.id === segmentId);
      if (found) return found;
    }
    return undefined;
  }

  deleteDocument(id: string): { success: boolean; deletedSegmentCount: number } {
    const doc = this.documents.get(id);
    if (!doc) return { success: false, deletedSegmentCount: 0 };

    const segCount = (this.segments.get(id) || []).length;
    this.documents.delete(id);
    this.segments.delete(id);
    this.persist();

    return { success: true, deletedSegmentCount: segCount };
  }

  clearAll(): void {
    this.documents.clear();
    this.segments.clear();
    this.persist();
  }
}

export const documentStore = new DocumentStore();
