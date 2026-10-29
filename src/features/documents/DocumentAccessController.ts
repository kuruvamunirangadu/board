/**
 * VisiOS — Phase 9: Document Access Controller & Security Boundary
 * Manages document ownership, access policies, secure deletion cascades,
 * and prompt injection defense (neutralizing malicious instructions in untrusted document text).
 *
 * Design note: In browser-local / in-memory storage environments, this controller enforces
 * application-level identity boundaries and cleans up state deterministically without claiming
 * cryptographic server-side guarantees.
 */

import { ImportedDocument } from './DocumentTypes';
import { DocumentPersistenceService } from './DocumentPersistenceService';
import { documentStore } from '../multimodal/document-store';

export interface DocumentOwnershipRecord {
  documentId: string;
  ownerUserId: string;
  createdAt: number;
  isDeleted: boolean;
}

export interface AccessCheckResult {
  allowed: boolean;
  reason?: string;
  ownershipRecord?: DocumentOwnershipRecord;
}

export class DocumentAccessController {
  // In-memory ownership registry: key = documentId
  private static ownershipRegistry: Map<string, DocumentOwnershipRecord> = new Map();

  /**
   * Suspicious prompt injection directives embedded in uploaded educational materials.
   * Untrusted document text must never be executed as AI system commands.
   */
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions/i,
    /system\s+prompt\s*:/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /disregard\s+all\s+(?:safety|system)\s+rules/i,
    /<system>/i,
    /<\/system>/i,
    /\bprompt\s+injection\b/i,
  ];

  /**
   * Registers a newly imported document under a specific user's ownership.
   */
  public static registerOwnership(documentId: string, ownerUserId: string): DocumentOwnershipRecord {
    const record: DocumentOwnershipRecord = {
      documentId,
      ownerUserId: ownerUserId.trim(),
      createdAt: Date.now(),
      isDeleted: false,
    };
    this.ownershipRegistry.set(documentId, record);
    return record;
  }

  /**
   * Checks whether the requesting user is authorized to read or query the document.
   */
  public static checkAccess(documentId: string, requestingUserId: string): AccessCheckResult {
    const record = this.ownershipRegistry.get(documentId);

    // If no ownership record exists, allow default guest access if not owned by someone else
    if (!record) {
      return { allowed: true };
    }

    if (record.isDeleted) {
      return {
        allowed: false,
        reason: `Document "${documentId}" has been deleted and cannot be accessed.`,
      };
    }

    if (record.ownerUserId !== requestingUserId && requestingUserId !== 'system' && requestingUserId !== 'instructor') {
      return {
        allowed: false,
        reason: `Forbidden: User "${requestingUserId}" is not authorized to access document "${documentId}" owned by "${record.ownerUserId}".`,
        ownershipRecord: record,
      };
    }

    return { allowed: true, ownershipRecord: record };
  }

  /**
   * Securely deletes a document and cleans up its associated segments, index, and storage.
   */
  public static async deleteDocument(documentId: string, requestingUserId: string): Promise<{ success: boolean; error?: string }> {
    const access = this.checkAccess(documentId, requestingUserId);
    if (!access.allowed) {
      return { success: false, error: access.reason };
    }

    // 1. Mark ownership record as deleted
    const record = this.ownershipRegistry.get(documentId);
    if (record) {
      record.isDeleted = true;
    }

    // 2. Cascade cleanup in multimodal documentStore
    documentStore.deleteDocument(documentId);

    // 3. Purge from DocumentPersistenceService memory store
    await DocumentPersistenceService.deleteDocument(documentId);

    return { success: true };
  }

  /**
   * Sanitizes untrusted document text to neutralize prompt injection attempts.
   * Treats document text purely as passive data, never as prompt instructions.
   */
  public static sanitizeDocumentContent(rawText: string): { sanitized: string; injectionDetected: boolean; flaggedPatterns: string[] } {
    let sanitized = rawText;
    let injectionDetected = false;
    const flaggedPatterns: string[] = [];

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(sanitized)) {
        injectionDetected = true;
        flaggedPatterns.push(pattern.source);
        // Neutralize by quoting and tagging as untrusted source quote
        sanitized = sanitized.replace(pattern, '[REDACTED_PROMPT_INJECTION_DIRECTIVE]');
      }
    }

    return {
      sanitized,
      injectionDetected,
      flaggedPatterns,
    };
  }

  /**
   * Reset registry (useful for testing).
   */
  public static clear(): void {
    this.ownershipRegistry.clear();
  }
}
