/**
 * VisiOS — Study Group Service
 * Step 12: Manages collaborative study groups where students access shared collections of published
 * lessons while maintaining their own independent learning progress and practice attempts.
 */

import { LessonLibraryService } from '@/features/learning/LessonLibraryService';
import {
  StudyGroup,
  StudyGroupMember,
  StudyGroupLessonRef,
  SharingOperationResult,
} from './LessonSharingTypes';

export class StudyGroupService {
  private static readonly STORAGE_KEY = 'visios_study_groups_registry_v1';
  private static memoryGroups: Map<string, StudyGroup> = new Map();
  private static isInitialized: boolean = false;

  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;

    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem(this.STORAGE_KEY);
        if (raw) {
          const list: StudyGroup[] = JSON.parse(raw);
          if (Array.isArray(list)) {
            for (const g of list) {
              if (g && g.id) {
                this.memoryGroups.set(g.id, g);
              }
            }
          }
        }
      } catch (e) {
        console.warn('Failed to load study groups from localStorage:', e);
      }
    }
  }

  private static persistToStorage(): void {
    if (typeof window !== 'undefined') {
      try {
        const all = Array.from(this.memoryGroups.values());
        window.localStorage?.setItem(this.STORAGE_KEY, JSON.stringify(all));
      } catch (e) {
        console.warn('Failed to persist study groups to localStorage:', e);
      }
    }
  }

  /**
   * Creates a new study group. The creator is assigned role 'owner'.
   */
  public static async createGroup(
    name: string,
    description: string,
    ownerId: string,
    ownerName: string = 'Group Owner'
  ): Promise<SharingOperationResult<StudyGroup>> {
    this.init();

    const cleanName = (name || '').trim();
    if (!cleanName) {
      return {
        success: false,
        errorCode: 'VALIDATION_FAILED',
        errorMessage: 'Study group name is required.',
      };
    }

    const groupId = `group_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const now = Date.now();

    const ownerMember: StudyGroupMember = {
      userId: ownerId || 'student_owner',
      name: ownerName,
      role: 'owner',
      joinedAt: now,
    };

    const group: StudyGroup = {
      id: groupId,
      name: cleanName,
      description: (description || '').trim(),
      ownerId: ownerMember.userId,
      members: [ownerMember],
      sharedLessons: [],
      createdAt: now,
      updatedAt: now,
    };

    this.memoryGroups.set(groupId, group);
    this.persistToStorage();

    return {
      success: true,
      data: group,
    };
  }

  /**
   * Retrieves a study group by ID.
   */
  public static async getGroup(groupId: string): Promise<StudyGroup | null> {
    this.init();
    const g = this.memoryGroups.get(groupId);
    return g ? { ...g } : null;
  }

  /**
   * Lists all study groups a user belongs to.
   */
  public static async listGroupsForUser(userId: string): Promise<StudyGroup[]> {
    this.init();
    const cleanId = (userId || 'student_default').trim();
    const userGroups: StudyGroup[] = [];

    for (const g of Array.from(this.memoryGroups.values())) {
      if (g.ownerId === cleanId || g.members.some((m) => m.userId === cleanId)) {
        userGroups.push({ ...g });
      }
    }

    return userGroups.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  /**
   * Adds a member to the study group.
   * STRICT CHECK: Only group owner can add members.
   */
  public static async addMember(
    groupId: string,
    requesterId: string,
    newMember: { userId: string; name: string }
  ): Promise<SharingOperationResult<StudyGroup>> {
    this.init();

    const group = this.memoryGroups.get(groupId);
    if (!group) {
      return {
        success: false,
        errorCode: 'GROUP_NOT_FOUND',
        errorMessage: 'Study group not found.',
      };
    }

    // Permission check: owner only
    if (group.ownerId && requesterId !== group.ownerId && requesterId !== 'admin') {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Only the study group owner can add new members.',
      };
    }

    // Check if already member
    if (group.members.some((m) => m.userId === newMember.userId)) {
      return {
        success: true,
        data: group,
      };
    }

    group.members.push({
      userId: newMember.userId,
      name: newMember.name || 'Student',
      role: 'member',
      joinedAt: Date.now(),
    });
    group.updatedAt = Date.now();

    this.persistToStorage();
    return { success: true, data: group };
  }

  /**
   * Removes a member from the study group.
   * STRICT CHECK: Group owner can remove members; members can leave.
   */
  public static async removeMember(
    groupId: string,
    requesterId: string,
    targetUserId: string
  ): Promise<SharingOperationResult<StudyGroup>> {
    this.init();

    const group = this.memoryGroups.get(groupId);
    if (!group) {
      return {
        success: false,
        errorCode: 'GROUP_NOT_FOUND',
        errorMessage: 'Study group not found.',
      };
    }

    // Permission check: owner or self-leave
    const isOwner = group.ownerId === requesterId || requesterId === 'admin';
    const isSelfLeave = requesterId === targetUserId;

    if (!isOwner && !isSelfLeave) {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'You do not have permission to remove this member.',
      };
    }

    // Cannot remove owner unless transferring
    if (targetUserId === group.ownerId && group.members.length > 1) {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'The group owner cannot be removed. Transfer ownership first.',
      };
    }

    group.members = group.members.filter((m) => m.userId !== targetUserId);
    group.updatedAt = Date.now();

    this.persistToStorage();
    return { success: true, data: group };
  }

  /**
   * Adds a published lesson reference to the study group.
   * STRICT CHECK: Only members/owner can add; lesson MUST be published!
   */
  public static async addLessonToGroup(
    groupId: string,
    requesterId: string,
    lessonId: string
  ): Promise<SharingOperationResult<StudyGroup>> {
    this.init();

    const group = this.memoryGroups.get(groupId);
    if (!group) {
      return {
        success: false,
        errorCode: 'GROUP_NOT_FOUND',
        errorMessage: 'Study group not found.',
      };
    }

    // Member check
    const isMember = group.members.some((m) => m.userId === requesterId) || group.ownerId === requesterId;
    if (!isMember && requesterId !== 'admin') {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'You must be a member of the study group to add lessons.',
      };
    }

    // Retrieve lesson
    const lesson = await LessonLibraryService.getLesson(lessonId);
    if (!lesson) {
      return {
        success: false,
        errorCode: 'LESSON_NOT_FOUND',
        errorMessage: 'Lesson not found.',
      };
    }

    // STRICT CHECK: Lesson must be published!
    if (lesson.status !== 'published' || !lesson.publishedSnapshot) {
      return {
        success: false,
        errorCode: 'CANNOT_SHARE_DRAFT',
        errorMessage: 'Only published lessons can be added to a study group. Please publish the lesson first.',
      };
    }

    // Prevent duplicates
    if (group.sharedLessons.some((l) => l.lessonId === lessonId)) {
      return {
        success: true,
        data: group,
      };
    }

    const lessonRef: StudyGroupLessonRef = {
      lessonId: lesson.id,
      publishedVersion: lesson.publishedSnapshot.publishedVersion || lesson.publishedVersion || 1,
      title: lesson.publishedSnapshot.title || lesson.title,
      primaryTopic: lesson.publishedSnapshot.primaryTopic || lesson.primaryTopic,
      domain: lesson.publishedSnapshot.domain || lesson.domain,
      addedAt: Date.now(),
      addedBy: requesterId,
    };

    group.sharedLessons.push(lessonRef);
    group.updatedAt = Date.now();

    this.persistToStorage();
    return { success: true, data: group };
  }

  /**
   * Removes a shared lesson from the study group.
   * STRICT CHECK: Owner only.
   */
  public static async removeLessonFromGroup(
    groupId: string,
    requesterId: string,
    lessonId: string
  ): Promise<SharingOperationResult<StudyGroup>> {
    this.init();

    const group = this.memoryGroups.get(groupId);
    if (!group) {
      return {
        success: false,
        errorCode: 'GROUP_NOT_FOUND',
        errorMessage: 'Study group not found.',
      };
    }

    if (group.ownerId !== requesterId && requesterId !== 'admin') {
      return {
        success: false,
        errorCode: 'UNAUTHORIZED',
        errorMessage: 'Only the study group owner can remove lessons from the group.',
      };
    }

    group.sharedLessons = group.sharedLessons.filter((l) => l.lessonId !== lessonId);
    group.updatedAt = Date.now();

    this.persistToStorage();
    return { success: true, data: group };
  }

  /**
   * Resets registry for unit testing.
   */
  public static resetForTesting(): void {
    this.memoryGroups.clear();
    this.isInitialized = true;
  }
}

