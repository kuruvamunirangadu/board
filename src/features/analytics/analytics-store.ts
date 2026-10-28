import { AssessmentAttemptRecord } from '@/types/analytics';

class AnalyticsStore {
  private attempts: Map<string, AssessmentAttemptRecord> = new Map();

  constructor() {
    this.seedInitialAttempts();
  }

  /**
   * Seed realistic sample attempts for demonstration and deterministic tests
   */
  private seedInitialAttempts() {
    const baseTime = Date.now() - 86400000 * 3; // 3 days ago

    const sampleRecords: AssessmentAttemptRecord[] = [
      // Learner 1: Ada (Proficient)
      {
        id: 'att-ada-01',
        learnerId: 'learner-ada',
        learnerName: 'Ada Lovelace',
        questionId: 'q-pendulum-period',
        questionTitle: 'Period Dependency in Nonlinear Pendulum',
        conceptId: 'pendulum-nonlinear',
        conceptTitle: 'Nonlinear Pendulum & Phase Space',
        objectiveId: 'obj-pendulum-period-calc',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-101',
        selectedOption: 2,
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 2,
        assessmentVersion: 'v1.2',
        timeSpentSeconds: 45,
      },
      {
        id: 'att-ada-02',
        learnerId: 'learner-ada',
        learnerName: 'Ada Lovelace',
        questionId: 'q-energy-damping',
        questionTitle: 'Damping & Phase Space Shrinkage',
        conceptId: 'pendulum-nonlinear',
        conceptTitle: 'Nonlinear Pendulum & Phase Space',
        objectiveId: 'obj-phase-space-energy',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-101',
        selectedOption: 1,
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 4,
        assessmentVersion: 'v1.2',
        timeSpentSeconds: 60,
      },
      {
        id: 'att-ada-03',
        learnerId: 'learner-ada',
        learnerName: 'Ada Lovelace',
        questionId: 'q-shm-hooke',
        questionTitle: "Hooke's Law & Restoring Force",
        conceptId: 'simple-harmonic-motion',
        conceptTitle: 'Simple Harmonic Motion',
        objectiveId: 'obj-shm-force',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-102',
        selectedOption: 0,
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 10,
        assessmentVersion: 'v1.0',
        timeSpentSeconds: 30,
      },

      // Learner 2: Kai (Struggling with nonlinear resonance & damping)
      {
        id: 'att-kai-01',
        learnerId: 'learner-kai',
        learnerName: 'Kai Vance',
        questionId: 'q-pendulum-period',
        questionTitle: 'Period Dependency in Nonlinear Pendulum',
        conceptId: 'pendulum-nonlinear',
        conceptTitle: 'Nonlinear Pendulum & Phase Space',
        objectiveId: 'obj-pendulum-period-calc',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-101',
        selectedOption: 0, // Incorrect choice
        isCorrect: false,
        score: 0,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 5,
        assessmentVersion: 'v1.2',
        timeSpentSeconds: 95,
      },
      {
        id: 'att-kai-02',
        learnerId: 'learner-kai',
        learnerName: 'Kai Vance',
        questionId: 'q-pendulum-period', // Retake attempt
        questionTitle: 'Period Dependency in Nonlinear Pendulum',
        conceptId: 'pendulum-nonlinear',
        conceptTitle: 'Nonlinear Pendulum & Phase Space',
        objectiveId: 'obj-pendulum-period-calc',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-101',
        selectedOption: 2, // Correct on retake
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 8,
        assessmentVersion: 'v1.2',
        timeSpentSeconds: 50,
      },
      {
        id: 'att-kai-03',
        learnerId: 'learner-kai',
        learnerName: 'Kai Vance',
        questionId: 'q-resonance-qfactor',
        questionTitle: 'Resonance Quality Factor & Bandwidth',
        conceptId: 'resonance-dynamics',
        conceptTitle: 'Resonance Dynamics & Driven Oscillators',
        objectiveId: 'obj-resonance-qfactor',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-103',
        selectedOption: 3, // Incorrect
        isCorrect: false,
        score: 0,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 12,
        assessmentVersion: 'v1.0',
        timeSpentSeconds: 110,
      },
      {
        id: 'att-kai-04',
        learnerId: 'learner-kai',
        learnerName: 'Kai Vance',
        questionId: 'q-resonance-qfactor', // Repeated incorrect attempt
        questionTitle: 'Resonance Quality Factor & Bandwidth',
        conceptId: 'resonance-dynamics',
        conceptTitle: 'Resonance Dynamics & Driven Oscillators',
        objectiveId: 'obj-resonance-qfactor',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-103',
        selectedOption: 1, // Still incorrect
        isCorrect: false,
        score: 0,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 15,
        assessmentVersion: 'v1.0',
        timeSpentSeconds: 80,
      },

      // Learner 3: Maya (Intermediate)
      {
        id: 'att-maya-01',
        learnerId: 'learner-maya',
        learnerName: 'Maya Lin',
        questionId: 'q-resonance-qfactor',
        questionTitle: 'Resonance Quality Factor & Bandwidth',
        conceptId: 'resonance-dynamics',
        conceptTitle: 'Resonance Dynamics & Driven Oscillators',
        objectiveId: 'obj-resonance-qfactor',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-103',
        selectedOption: 0, // Correct
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 20,
        assessmentVersion: 'v1.0',
        timeSpentSeconds: 40,
      },
      {
        id: 'att-maya-02',
        learnerId: 'learner-maya',
        learnerName: 'Maya Lin',
        questionId: 'q-energy-damping',
        questionTitle: 'Damping & Phase Space Shrinkage',
        conceptId: 'pendulum-nonlinear',
        conceptTitle: 'Nonlinear Pendulum & Phase Space',
        objectiveId: 'obj-phase-space-energy',
        subjectId: 'physics',
        assessmentId: 'quiz-phys-101',
        selectedOption: 1, // Correct
        isCorrect: true,
        score: 10,
        maxScore: 10,
        timestamp: baseTime + 3600000 * 22,
        assessmentVersion: 'v1.2',
        timeSpentSeconds: 35,
      },
    ];

    for (const record of sampleRecords) {
      this.attempts.set(record.id, record);
    }
  }

  /**
   * Authoritatively record an assessment attempt
   * Automatically deduplicates by attempt id.
   */
  public recordAttempt(attempt: AssessmentAttemptRecord): {
    success: boolean;
    isDuplicate: boolean;
    attempt: AssessmentAttemptRecord;
  } {
    if (!attempt.id) {
      throw new Error('Assessment attempt must have a stable unique ID');
    }

    if (this.attempts.has(attempt.id)) {
      return {
        success: true,
        isDuplicate: true,
        attempt: this.attempts.get(attempt.id)!,
      };
    }

    const cleanedRecord: AssessmentAttemptRecord = {
      ...attempt,
      timestamp: attempt.timestamp || Date.now(),
      score: typeof attempt.score === 'number' ? attempt.score : attempt.isCorrect ? 10 : 0,
      maxScore: attempt.maxScore || 10,
      assessmentVersion: attempt.assessmentVersion || 'v1.0',
    };

    this.attempts.set(cleanedRecord.id, cleanedRecord);

    return {
      success: true,
      isDuplicate: false,
      attempt: cleanedRecord,
    };
  }

  /**
   * Get all attempts with optional filtering
   */
  public getAttempts(filter?: {
    learnerId?: string;
    conceptId?: string;
    questionId?: string;
    subjectId?: string;
    fromTimestamp?: number;
    toTimestamp?: number;
  }): AssessmentAttemptRecord[] {
    let list = Array.from(this.attempts.values());

    if (filter?.learnerId) {
      list = list.filter((a) => a.learnerId === filter.learnerId);
    }
    if (filter?.conceptId) {
      list = list.filter((a) => a.conceptId === filter.conceptId);
    }
    if (filter?.questionId) {
      list = list.filter((a) => a.questionId === filter.questionId);
    }
    if (filter?.subjectId) {
      list = list.filter((a) => a.subjectId === filter.subjectId);
    }
    if (typeof filter?.fromTimestamp === 'number') {
      list = list.filter((a) => a.timestamp >= filter.fromTimestamp!);
    }
    if (typeof filter?.toTimestamp === 'number') {
      list = list.filter((a) => a.timestamp <= filter.toTimestamp!);
    }

    // Sort by timestamp descending (newest first)
    return list.sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get all unique enrolled learner IDs
   */
  public getLearnerIds(): string[] {
    const ids = new Set<string>();
    for (const att of Array.from(this.attempts.values())) {
      ids.add(att.learnerId);
    }
    return Array.from(ids);
  }

  /**
   * Clear all records (useful for automated testing)
   */
  public clear(): void {
    this.attempts.clear();
  }

  /**
   * Reset store to initial seed data
   */
  public resetToSeed(): void {
    this.attempts.clear();
    this.seedInitialAttempts();
  }
}

export const analyticsStore = new AnalyticsStore();

