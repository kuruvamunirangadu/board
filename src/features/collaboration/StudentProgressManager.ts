/**
 * VisiOS — Independent Student Progress Manager
 * Step 12: Enforces student progress isolation so that multiple learners accessing the same
 * shared lesson maintain completely independent sessions, practice feedback, and adaptive recommendations.
 * Prevents cross-student leakage and guarantees shared lesson definitions remain immutable.
 */

import { SessionPersistenceAdapter, sessionPersistence } from '@/lib/persistence/session-persistence';
import {
  SavedLearningSessionState,
  GuidedLessonStep,
} from '@/features/learning/types';
import { PracticeAttemptRecord } from '@/types/session';

export interface StudentProfile {
  studentId: string;
  name: string;
  avatar?: string;
  createdAt: number;
}

export interface StudentPersonalProgress {
  studentId: string;
  topic: string;
  lessonId?: string;
  guidedStep: GuidedLessonStep;
  completedSteps: GuidedLessonStep[];
  practiceAttempts: {
    multipleChoice?: {
      selectedIndex: number;
      isCorrect: boolean;
      score: number;
      attemptedAt: number;
    };
    shortAnswer?: {
      rawInput: string;
      isCorrect: boolean;
      score: number;
      attemptedAt: number;
    };
    totalScore: number;
  };
  simulationParameters?: Record<string, number>;
  lastAccessedAt: number;
}

export class StudentProgressManager {
  private static readonly CURRENT_STUDENT_STORAGE_KEY = 'visios_active_student_id_v1';
  private static activeStudentId: string = 'student_default';
  private static memoryProgressMap: Map<string, StudentPersonalProgress> = new Map();

  /**
   * Initializes or gets the active student ID.
   */
  public static getActiveStudentId(): string {
    if (typeof window !== 'undefined') {
      try {
        const stored = window.localStorage?.getItem(this.CURRENT_STUDENT_STORAGE_KEY);
        if (stored) {
          this.activeStudentId = stored;
          return stored;
        }
      } catch (e) {
        // ignore
      }
    }
    return this.activeStudentId;
  }

  /**
   * Switches or assigns the active student ID (useful for multi-learner testing or login).
   */
  public static setActiveStudentId(studentId: string): void {
    this.activeStudentId = studentId || 'student_default';
    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(this.CURRENT_STUDENT_STORAGE_KEY, this.activeStudentId);
      } catch (e) {
        // ignore
      }
    }
  }

  /**
   * Generates a collision-free, student-namespaced session key.
   */
  public static getNamespacedKey(studentId: string, topicOrLessonId: string): string {
    const cleanId = (studentId || 'student_default').trim().toLowerCase();
    const cleanTopic = SessionPersistenceAdapter.normalizeTopicKey(topicOrLessonId);
    return `visios_progress_${cleanId}_${cleanTopic}`;
  }

  /**
   * Retrieves personal progress for a specific student and topic/lesson.
   */
  public static async getPersonalProgress(
    studentId: string,
    topicOrLessonId: string
  ): Promise<StudentPersonalProgress | null> {
    const key = this.getNamespacedKey(studentId, topicOrLessonId);
    
    // Check in-memory map
    const inMem = this.memoryProgressMap.get(key);
    if (inMem) return { ...inMem };

    // Check localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = window.localStorage?.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          this.memoryProgressMap.set(key, parsed);
          return parsed;
        }
      } catch (e) {
        // ignore
      }
    }

    return null;
  }

  /**
   * Saves or updates personal progress strictly in the student's isolated space.
   * NEVER alters shared lesson definitions.
   */
  public static async savePersonalProgress(
    progress: StudentPersonalProgress
  ): Promise<StudentPersonalProgress> {
    const key = this.getNamespacedKey(progress.studentId, progress.topic);
    const updated: StudentPersonalProgress = {
      ...progress,
      lastAccessedAt: Date.now(),
    };

    this.memoryProgressMap.set(key, updated);

    if (typeof window !== 'undefined') {
      try {
        window.localStorage?.setItem(key, JSON.stringify(updated));
      } catch (e) {
        console.warn('LocalStorage save failed for student progress:', e);
      }
    }

    return updated;
  }

  /**
   * Records a practice attempt for a specific student, updating their isolated score.
   */
  public static async recordPracticeAttempt(
    studentId: string,
    topic: string,
    attempt: {
      type: 'multipleChoice' | 'shortAnswer';
      selectedIndex?: number;
      rawInput?: string;
      isCorrect: boolean;
      score: number;
    }
  ): Promise<StudentPersonalProgress> {
    let existing = await this.getPersonalProgress(studentId, topic);
    const now = Date.now();

    if (!existing) {
      existing = {
        studentId,
        topic,
        guidedStep: 'practice_exercise',
        completedSteps: ['concept_meaning', 'practice_exercise'],
        practiceAttempts: {
          totalScore: 0,
        },
        lastAccessedAt: now,
      };
    }

    const currentAttempts = existing.practiceAttempts;

    if (attempt.type === 'multipleChoice' && attempt.selectedIndex !== undefined) {
      currentAttempts.multipleChoice = {
        selectedIndex: attempt.selectedIndex,
        isCorrect: attempt.isCorrect,
        score: attempt.score,
        attemptedAt: now,
      };
    } else if (attempt.type === 'shortAnswer' && attempt.rawInput !== undefined) {
      currentAttempts.shortAnswer = {
        rawInput: attempt.rawInput,
        isCorrect: attempt.isCorrect,
        score: attempt.score,
        attemptedAt: now,
      };
    }

    currentAttempts.totalScore =
      (currentAttempts.multipleChoice?.score || 0) + (currentAttempts.shortAnswer?.score || 0);

    return this.savePersonalProgress({
      ...existing,
      practiceAttempts: currentAttempts,
    });
  }

  /**
   * Clears progress for testing or reset.
   */
  public static clearForTesting(): void {
    this.memoryProgressMap.clear();
    this.activeStudentId = 'student_default';
  }
}

