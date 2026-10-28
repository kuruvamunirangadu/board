/**
 * VisiOS — Collaboration and Lesson Sharing Types
 * Step 12: Strongly-typed schemas for shareable published lessons, permission boundaries,
 * immutable version snapshots, sanitized export packages, and study groups.
 */

import { AuthoredLesson } from '@/features/learning/AuthoringLessonTypes';
import { TopicDomain } from '@/features/learning/types';

export type SharePermission = 'owner' | 'viewer' | 'editor';

export type ShareStatus = 'active' | 'revoked' | 'expired';

export interface SharedLessonRecord {
  shareId: string;
  shareToken: string;
  lessonId: string;
  lessonTitle: string;
  primaryTopic: string;
  domain: TopicDomain;
  publishedVersion: number;
  ownerId: string;
  status: ShareStatus;
  allowExport: boolean;
  expiresAt: number | null;
  createdAt: number;
  revokedAt?: number;
  accessCount: number;
  lastAccessedAt?: number;
  /**
   * Immutable published snapshot at time of share creation.
   * Stripped of private drafts, author notes, internal server paths, and personal answers.
   */
  snapshot: Omit<AuthoredLesson, 'publishedSnapshot' | 'authorNotes'>;
}

export interface SharedLessonExportPackage {
  format: 'visios_lesson_package_v1';
  exportedAt: number;
  source: string;
  checksum: string;
  lesson: Omit<AuthoredLesson, 'publishedSnapshot' | 'authorNotes'>;
  metadata: {
    publishedVersion: number;
    primaryTopic: string;
    domain: TopicDomain;
    exportedBy?: string;
  };
}

export interface StudyGroupMember {
  userId: string;
  name: string;
  role: 'owner' | 'member';
  joinedAt: number;
}

export interface StudyGroupLessonRef {
  lessonId: string;
  publishedVersion: number;
  title: string;
  primaryTopic: string;
  domain: TopicDomain;
  shareToken?: string;
  addedAt: number;
  addedBy: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: StudyGroupMember[];
  sharedLessons: StudyGroupLessonRef[];
  createdAt: number;
  updatedAt: number;
}

export type SharingErrorCode =
  | 'LESSON_NOT_FOUND'
  | 'CANNOT_SHARE_DRAFT'
  | 'SHARE_NOT_FOUND'
  | 'SHARE_REVOKED'
  | 'SHARE_EXPIRED'
  | 'UNAUTHORIZED'
  | 'INVALID_PACKAGE'
  | 'VALIDATION_FAILED'
  | 'GROUP_NOT_FOUND';

export interface SharingOperationResult<T = any> {
  success: boolean;
  data?: T;
  errorCode?: SharingErrorCode;
  errorMessage?: string;
}

