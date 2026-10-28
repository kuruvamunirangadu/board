import {
  BetaStudyConsent,
  BetaSession,
  BetaFeedbackRecord,
} from '@/types/beta';

class BetaStudyStore {
  private consents: Map<string, BetaStudyConsent> = new Map();
  private sessions: Map<string, BetaSession> = new Map();
  private feedback: Map<string, BetaFeedbackRecord> = new Map();

  constructor() {
    this.seedInitialPilotData();
  }

  private seedInitialPilotData() {
    const baseTime = Date.now() - 86400000 * 2; // 2 days ago

    // Seed 6 realistic pilot participant sessions
    const sampleSessions: BetaSession[] = [
      {
        sessionId: 'beta-sess-01',
        participantCode: 'P-101',
        taskId: 'task-phys-pendulum',
        topicId: 'pendulum-nonlinear',
        status: 'completed',
        startedAt: baseTime + 3600000 * 1,
        completedAt: baseTime + 3600000 * 1 + 1200000,
        preTestScore: 1,
        preTestTotal: 3,
        postTestScore: 3,
        postTestTotal: 3,
        scoreDelta: 2,
        taskCompleted: true,
        explorationDurationSeconds: 480,
      },
      {
        sessionId: 'beta-sess-02',
        participantCode: 'P-102',
        taskId: 'task-phys-pendulum',
        topicId: 'pendulum-nonlinear',
        status: 'completed',
        startedAt: baseTime + 3600000 * 3,
        completedAt: baseTime + 3600000 * 3 + 900000,
        preTestScore: 1,
        preTestTotal: 3,
        postTestScore: 2,
        postTestTotal: 3,
        scoreDelta: 1,
        taskCompleted: true,
        explorationDurationSeconds: 360,
      },
      {
        sessionId: 'beta-sess-03',
        participantCode: 'P-103',
        taskId: 'task-cs-bst',
        topicId: 'cs-trees-bst',
        status: 'completed',
        startedAt: baseTime + 3600000 * 6,
        completedAt: baseTime + 3600000 * 6 + 1100000,
        preTestScore: 0,
        preTestTotal: 3,
        postTestScore: 3,
        postTestTotal: 3,
        scoreDelta: 3,
        taskCompleted: true,
        explorationDurationSeconds: 420,
      },
      {
        sessionId: 'beta-sess-04',
        participantCode: 'P-104',
        taskId: 'task-cs-bst',
        topicId: 'cs-trees-bst',
        status: 'completed',
        startedAt: baseTime + 3600000 * 9,
        completedAt: baseTime + 3600000 * 9 + 850000,
        preTestScore: 2,
        preTestTotal: 3,
        postTestScore: 3,
        postTestTotal: 3,
        scoreDelta: 1,
        taskCompleted: true,
        explorationDurationSeconds: 310,
      },
      {
        sessionId: 'beta-sess-05',
        participantCode: 'P-105',
        taskId: 'task-elec-rlc',
        topicId: 'elec-circuits-rlc',
        status: 'completed',
        startedAt: baseTime + 3600000 * 12,
        completedAt: baseTime + 3600000 * 12 + 1300000,
        preTestScore: 1,
        preTestTotal: 3,
        postTestScore: 3,
        postTestTotal: 3,
        scoreDelta: 2,
        taskCompleted: true,
        explorationDurationSeconds: 520,
      },
      {
        sessionId: 'beta-sess-06',
        participantCode: 'P-106',
        taskId: 'task-elec-rlc',
        topicId: 'elec-circuits-rlc',
        status: 'completed',
        startedAt: baseTime + 3600000 * 15,
        completedAt: baseTime + 3600000 * 15 + 1000000,
        preTestScore: 2,
        preTestTotal: 3,
        postTestScore: 2,
        postTestTotal: 3,
        scoreDelta: 0,
        taskCompleted: true,
        explorationDurationSeconds: 390,
      },
    ];

    sampleSessions.forEach((s) => this.sessions.set(s.sessionId, s));

    // Seed feedback records
    const sampleFeedback: BetaFeedbackRecord[] = [
      {
        feedbackId: 'fb-01',
        sessionId: 'beta-sess-01',
        participantCode: 'P-101',
        taskId: 'task-phys-pendulum',
        understandingGoal: 'Understand why large-angle pendulums take longer than 2*pi*sqrt(L/g)',
        helpfulAspect: 'Seeing the phase space spiral shrink in real-time as damping was increased.',
        confusingAspect: 'The period formula font was slightly small on my laptop screen.',
        visualizationRating: 5,
        encounteredError: false,
        suggestedImprovement: 'Add a button to directly overlay theoretical small-angle vs nonlinear period.',
        submittedAt: baseTime + 3600000 * 1 + 1250000,
      },
      {
        feedbackId: 'fb-02',
        sessionId: 'beta-sess-03',
        participantCode: 'P-103',
        taskId: 'task-cs-bst',
        understandingGoal: 'Binary search tree lookup complexity vs skewed degenerate trees',
        helpfulAspect: 'Step-by-step visual animation of insertions creating tree height.',
        confusingAspect: 'None, the pre-test question helped focus my attention during the exploration.',
        visualizationRating: 5,
        encounteredError: false,
        suggestedImprovement: 'Add AVL auto-balancing demonstration.',
        submittedAt: baseTime + 3600000 * 6 + 1150000,
      },
      {
        feedbackId: 'fb-03',
        sessionId: 'beta-sess-05',
        participantCode: 'P-105',
        taskId: 'task-elec-rlc',
        understandingGoal: 'Resonance curve peaking at omega = 1/sqrt(LC)',
        helpfulAspect: 'Adjusting inductance slider and watching the AC current waveform peak immediately.',
        confusingAspect: 'Would be helpful to label phase lag in degrees as well as radians.',
        visualizationRating: 4,
        encounteredError: false,
        suggestedImprovement: 'Add preset toggle for standard audio frequencies.',
        submittedAt: baseTime + 3600000 * 12 + 1350000,
      },
    ];

    sampleFeedback.forEach((f) => this.feedback.set(f.feedbackId, f));
  }

  // Consent Methods
  public recordConsent(consent: BetaStudyConsent): void {
    this.consents.set(consent.participantCode, consent);
  }

  public getConsent(participantCode: string): BetaStudyConsent | undefined {
    return this.consents.get(participantCode);
  }

  // Session Methods
  public saveSession(session: BetaSession): void {
    this.sessions.set(session.sessionId, session);
  }

  public getSession(sessionId: string): BetaSession | undefined {
    return this.sessions.get(sessionId);
  }

  public listSessions(filter?: { taskId?: string; participantCode?: string }): BetaSession[] {
    let list = Array.from(this.sessions.values());
    if (filter?.taskId) {
      list = list.filter((s) => s.taskId === filter.taskId);
    }
    if (filter?.participantCode) {
      list = list.filter((s) => s.participantCode === filter.participantCode);
    }
    return list.sort((a, b) => b.startedAt - a.startedAt);
  }

  // Feedback Methods
  public recordFeedback(feedback: BetaFeedbackRecord): void {
    this.feedback.set(feedback.feedbackId, feedback);
  }

  public listFeedback(): BetaFeedbackRecord[] {
    return Array.from(this.feedback.values()).sort((a, b) => b.submittedAt - a.submittedAt);
  }

  // Privacy & Data Deletion
  public deleteParticipantData(participantCode: string): {
    deletedSessionsCount: number;
    deletedFeedbackCount: number;
  } {
    this.consents.delete(participantCode);

    let delSess = 0;
    for (const [id, s] of Array.from(this.sessions.entries())) {
      if (s.participantCode === participantCode) {
        this.sessions.delete(id);
        delSess++;
      }
    }

    let delFb = 0;
    for (const [id, f] of Array.from(this.feedback.entries())) {
      if (f.participantCode === participantCode) {
        this.feedback.delete(id);
        delFb++;
      }
    }

    return { deletedSessionsCount: delSess, deletedFeedbackCount: delFb };
  }

  public clear(): void {
    this.consents.clear();
    this.sessions.clear();
    this.feedback.clear();
  }
}

export const betaStore = new BetaStudyStore();

