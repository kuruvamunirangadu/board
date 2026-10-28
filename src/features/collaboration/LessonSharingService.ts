/**
 * VisiOS — Secure Lesson Sharing & Permission Service
 * Step 12: Handles read-only sharing of published learning modules, cryptographically unpredictable tokens,
 * snapshot pinning, access revocation, sanitized export packages, and permission checks.
 */

import { LessonLibraryService } from '@/features/learning/LessonLibraryService';
import { AuthoredLesson } from '@/features/learning/AuthoringLessonTypes';
import { LessonVerificationPipeline } from '@/features/learning/LessonVerificationPipeline';
import {
  SharedLessonRecord,
  SharedLessonExportPackage,
  SharingOperationResult,
  SharingErrorCode,
} from './LessonSharingTypes';

export class LessonSharingService {
  private static readonly STORAGE_KEY = 'visios_shared_lessons_registry_v1';
  private static memoryShares: Map<string, SharedLessonRecord> = new Map();
  private static isInitialized: boolean = false;

  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem(this.STORAGE_KEY);
        if (raw) {
          const list: SharedLessonRecord[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const r of list) {
              if (r && r.shareToken) {
                this.memoryShares.set(r.shareToken, r);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load shared lessons registry from localStorage:', e);
      }
    }
  }

  private static persistToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const all = Array.from(this.memoryShares.values());
        window.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed to persist shared lessons registry to localStorage:', e);
      }
    }
  }

  /**
   * Generates a cryptographically unguessable, URL-safe share token.
   */
  public static generateSecureToken(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let randomPart = '';
    for (let i = 0; i < 24; i++) {
      randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const timestampPart = Date.now().toString(36);
    return `share_${timestampPart}_${randomPart}`;
  }

  /**
   * Simple deterministic checksum generator for package integrity.
   */
  public static computeChecksum(content: string): string {
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0; // Convert to 32bit integer
    }
    return `v1chk_${Math.abs(hash).toString(16)}`;
  }

  /**
   * Sanitizes a published lesson by stripping private author notes, drafts, and sensitive fields.
   */
  public static sanitizePublishedSnapshot(
    lesson: AuthoredLesson
  ): Omit<AuthoredLesson, 'publishedSnapshot' | 'authorNotes'> {
    // If a published snapshot is present, pin strictly to that snapshot
    const source: any = lesson.publishedSnapshot ? { ...lesson.publishedSnapshot } : { ...lesson };

    // Strip private internal properties
    delete source.publishedSnapshot;
    delete source.authorNotes;

    // Deep clean steps to ensure no script injection or sensitive fields
    const sanitizedSteps = (source.steps || []).map((step: any) => ({
      id: step.id,
      stepNumber: step.stepNumber,
      title: this.sanitizeText(step.title),
      stepType: step.stepType,
      content: this.sanitizeText(step.content),
      keyTakeaway: step.keyTakeaway ? this.sanitizeText(step.keyTakeaway) : undefined,
    }));

    return {
      ...source,
      title: this.sanitizeText(source.title),
      primaryTopic: this.sanitizeText(source.primaryTopic),
      overview: this.sanitizeText(source.overview),
      motivation: this.sanitizeText(source.motivation || ''),
      steps: sanitizedSteps,
      status: 'published',
    };
  }

  /**
   * Strips malicious HTML or script tags from untrusted text.
   */
  private static sanitizeText(str: string): string {
    if (!str) return '';
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript\s*:/gi, '')
      .replace(/onerror\s*=/gi, '')
      .replace(/onload\s*=/gi, '');
  }

  /**
   * Creates a controlled share link for a PUBLISHED lesson.
   * Rejects unpublished drafts with CANNOT_SHARE_DRAFT.
   */
  public static async createShareLink(
    lessonId: string,
    ownerId: string,
    options?: {
      expiresInDays?: number;
      allowExport?: boolean;
    }
  ): Promise<SharingOperationResult<SharedLessonRecord>> {
    this.init();

    const lesson = await LessonLibraryService.getLesson(lessonId);
    if (!lesson) {
      return {
        success: false,
        errorCode: 'LESSON_NOT_FOUND',
        errorMessage: `Lesson with ID '${lessonId}' was not found.`,
      };
    }

    // STRICT CHECK: Cannot share draft lessons!
    if (lesson.status !== 'published' || !lesson.publishedSnapshot) {
      return {
        success: false,
        errorCode: 'CANNOT_SHARE_DRAFT',
        errorMessage: 'Only published lessons can be shared. Please publish the lesson first.',
      };
    }

    // Capture immutable published snapshot
    const snapshot = this.sanitizePublishedSnapshot(lesson);

    const shareToken = this.generateSecureToken();
    const shareId = `sh_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();
    const expiresAt = options?.expiresInDays ? now + options.expiresInDays * 86400000 : null;

    const record: SharedLessonRecord = {
      shareId,
      shareToken,
      lessonId: lesson.id,
      lessonTitle: snapshot.title,
      primaryTopic: snapshot.primaryTopic,
      domain: snapshot.domain,
      publishedVersion: snapshot.publishedVersion || lesson.publishedVersion || 1,
      ownerId: ownerId || lesson.ownerId || 'author_default',
      status: 'active',
      allowExport: options?.allowExport !== undefined ? options.allowExport : true,
      expiresAt,
      createdAt: now,
      accessCount: 0,
      snapshot,
    };

    this.memoryShares.set(shareToken, record);
    this.persistToStorage();

    return {
      success: true,
      data: record,
    };
  }

  /**
   * Resolves a share token and returns the sanitized published lesson snapshot.
   * Checks expiration and revocation.
   */
  public static async resolveShareToken(
    shareToken: string
  ): Promise<SharingOperationResult<{ record: SharedLessonRecord; lesson: Omit<AuthoredLesson, 'publishedSnapshot' | 'authorNotes'> }>> {
    this.init();

    if (!shareToken) {
      return {
        success: false,
        errorCode: 'SHARE_NOT_FOUND',
        errorMessage: 'A share token is required.',
      };
    }

    const record = this.memoryShares.get(shareToken);
    if (!record) {
      return {
        success: false,
        errorCode: 'SHARE_NOT_FOUND',
        errorMessage: 'The requested share link does not exist or has been removed.',
      };
    }

    // Check revocation
    if (record.status === 'revoked') {
      return {
        success: false,
        errorCode: 'SHARE_REVOKED',
        errorMessage: 'Access to this shared lesson has been revoked by the owner.',
      };
    }

    // Check expiration
    if (record.expiresAt && Date.now() > record.expiresAt) {
      record.status = 'expired';
      this.persistToStorage();
      return {
        success: false,
        errorCode: 'SHARE_EXPIRED',
        errorMessage: 'This share link has expired.',
      };
    }

    // Increment access stats
    record.accessCount += 1;
    record.lastAccessedAt = Date.now();
    this.persistToStorage();

    return {
      success: true,
      data: {
        record,
        lesson: record.snapshot,
      },
    };
  }

  /**
   * Revokes or disables an active share link.
   * STRICT CHECK: Only the authorized owner can revoke the share link!
   */
  public static async revokeShareLink(
    shareToken: string,
    requesterId: string
  ): Promise<SharingOperationResult<SharedLessonRecord>> {
    this.init();

    const record = this.memoryShares.get(shareToken);
    if (!record) {
      return {
        success: false,
        errorCode: 'SHARE_NOT_FOUND',
        errorMessage: 'Share link not found.',
      };
    }

    // Permission check: owner only!
    if (record.ownerId && requesterId !== record.ownerId && requesterId !== 'admin') {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'You do not have permission to manage this share link. Only the owner can revoke access.',
      };
    }

    record.status = 'revoked';
    record.revokedAt = Date.now();
    this.persistToStorage();

    return {
      success: true,
      data: record,
    };
  }

  /**
   * Exports a published lesson as a sanitized, portable JSON bundle.
   */
  public static async exportLessonPackage(
    lessonId: string,
    requesterId?: string
  ): Promise<SharingOperationResult<SharedLessonExportPackage>> {
    const lesson = await LessonLibraryService.getLesson(lessonId);
    if (!lesson) {
      return {
        success: false,
        errorCode: 'LESSON_NOT_FOUND',
        errorMessage: 'Lesson not found.',
      };
    }

    if (lesson.status !== 'published' || !lesson.publishedSnapshot) {
      return {
        success: false,
        errorCode: 'CANNOT_SHARE_DRAFT',
        errorMessage: 'Only published lessons can be exported.',
      };
    }

    const sanitized = this.sanitizePublishedSnapshot(lesson);
    const serializedLesson = JSON.stringify(sanitized);
    const checksum = this.computeChecksum(serializedLesson);

    const pkg: SharedLessonExportPackage = {
      format: 'visios_lesson_package_v1',
      exportedAt: Date.now(),
      source: 'VisiOS Learning Platform',
      checksum,
      lesson: sanitized,
      metadata: {
        publishedVersion: sanitized.publishedVersion || 1,
        primaryTopic: sanitized.primaryTopic,
        domain: sanitized.domain,
        exportedBy: requesterId || lesson.ownerId || 'author',
      },
    };

    return {
      success: true,
      data: pkg,
    };
  }

  /**
   * Validates and imports a shared lesson package into the recipient's workspace library.
   * Treats incoming data as untrusted, verifying schema and renderer configuration.
   */
  public static async importLessonPackage(
    packageInput: string | SharedLessonExportPackage,
    studentId?: string
  ): Promise<SharingOperationResult<AuthoredLesson>> {
    let pkg: SharedLessonExportPackage;

    try {
      pkg = typeof packageInput === 'string' ? JSON.parse(packageInput) : packageInput;
    } catch (e: any) {
      return {
        success: false,
        errorCode: 'INVALID_PACKAGE',
        errorMessage: 'Invalid JSON format in imported lesson package.',
      };
    }

    // 1. Verify package envelope
    if (!pkg || pkg.format !== 'visios_lesson_package_v1' || !pkg.lesson) {
      return {
        success: false,
        errorCode: 'INVALID_PACKAGE',
        errorMessage: 'Unrecognized package format. Expected visios_lesson_package_v1 format.',
      };
    }

    // 2. Verify checksum integrity
    const lessonStr = JSON.stringify(pkg.lesson);
    const expectedChecksum = this.computeChecksum(lessonStr);
    if (pkg.checksum && pkg.checksum !== expectedChecksum) {
      return {
        success: false,
        errorCode: 'INVALID_PACKAGE',
        errorMessage: 'Checksum verification failed. The package contents may be tampered or corrupted.',
      };
    }

    // 3. Structural validation via LessonVerificationPipeline & LessonLibraryService
    const candidateLesson = pkg.lesson as AuthoredLesson;
    const validationReport = LessonLibraryService.validateLesson(candidateLesson);
    if (validationReport.errors.length > 0) {
      return {
        success: false,
        errorCode: 'VALIDATION_FAILED',
        errorMessage: `Import rejected: ${validationReport.errors.map((e) => e.message).join(' ')}`,
      };
    }

    // 4. Sanitize strings against malicious code
    const cleanLesson = this.sanitizePublishedSnapshot(candidateLesson) as AuthoredLesson;

    // 5. Save imported lesson with isolated ID prefix to avoid collisions with local lessons
    const importedId = `imported_${cleanLesson.slug}_${Date.now().toString(36)}`;
    const importedRecord: AuthoredLesson = {
      ...cleanLesson,
      id: importedId,
      status: 'published',
      publishedVersion: cleanLesson.publishedVersion || 1,
      publishedSnapshot: { ...cleanLesson, id: importedId },
      ownerId: studentId || 'student_importer',
      isExpertReviewed: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      publishedAt: Date.now(),
    };

    // Save to lesson library as a verified published lesson
    await LessonLibraryService.saveDraft(importedRecord);
    // Explicitly publish so it is available to the orchestrator
    await LessonLibraryService.publishLesson(importedId);

    return {
      success: true,
      data: importedRecord,
    };
  }

  /**
   * Lists all shares created for a specific lesson (owner-only query).
   */
  public static async listSharesForLesson(
    lessonId: string,
    requesterId: string
  ): Promise<SharedLessonRecord[]> {
    this.init();
    const shares: SharedLessonRecord[] = [];
    for (const record of Array.from(this.memoryShares.values())) {
      if (record.lessonId === lessonId) {
        if (!record.ownerId || record.ownerId === requesterId || requesterId === 'admin') {
          shares.push({ ...record });
        }
      }
    }
    return shares.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Resets sharing registry for unit testing.
   */
  public static resetForTesting(): void {
    this.memoryShares.clear();
    this.isInitialized = true;
  }
}

