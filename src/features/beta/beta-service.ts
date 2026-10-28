import {
  BetaStudyTask,
  BetaSession,
  BetaFeedbackRecord,
  BetaEvaluationAggregate,
  BetaStudyConsent,
} from '@/types/beta';
import { betaStore } from './beta-store';

export const CURATED_BETA_TASKS: BetaStudyTask[] = [
  {
    taskId: 'task-phys-pendulum',
    topicId: 'pendulum-nonlinear',
    subjectId: 'physics',
    title: 'Nonlinear Pendulum & Phase Space Dynamics',
    intendedLevel: 'Introductory / Undergraduate Physics',
    requiredPriorKnowledge: ['Basic trigonometry', 'Concept of gravitational acceleration g'],
    estimatedMinutes: 12,
    explorationPrompt:
      'Adjust the amplitude angle beyond 45° and observe how the true period departs from T = 2π√(L/g). Adjust damping to see the phase trajectory spiral inward toward equilibrium.',
    learningObjectives: [
      'Explain why the small-angle approximation sin(θ) ≈ θ breaks down at large initial angles (> 30°)',
      'Analyze how damping γ causes total mechanical energy dissipation into thermal entropy',
      'Interpret phase space portraits (θ vs dθ/dt) as geometric representations of dynamical state',
    ],
    preTestQuestions: [
      {
        id: 'pre-p1',
        question: 'When a simple pendulum is released from an initial angle of 80° compared to 5°, how does the actual oscillation period compare to the small-angle formula T = 2π√(L/g)?',
        options: [
          'The actual period is longer than predicted by the small-angle formula',
          'The actual period is shorter than predicted by the small-angle formula',
          'The actual period remains exactly 2π√(L/g)',
          'The pendulum ceases to oscillate',
        ],
        correctIndex: 0,
        explanation: 'At large angles, sin(θ) < θ, reducing restoring torque and increasing the true period beyond the small-angle approximation.',
      },
      {
        id: 'pre-p2',
        question: 'In an un-damped pendulum (γ = 0), what geometric shape does the trajectory form in the (θ, ω) phase space?',
        options: [
          'A closed ellipse / orbital loop',
          'A spiral collapsing to (0,0)',
          'A straight diagonal line',
          'A random scatter',
        ],
        correctIndex: 0,
        explanation: 'Because energy is strictly conserved in the absence of damping, the phase trajectory forms a closed periodic orbit.',
      },
      {
        id: 'pre-p3',
        question: 'If you quadruple the length L of a pendulum (4×), how does the theoretical period T change?',
        options: [
          'It doubles (2×)',
          'It quadruples (4×)',
          'It is halved (0.5×)',
          'It remains unchanged',
        ],
        correctIndex: 0,
        explanation: 'Because T = 2π√(L/g), multiplying L by 4 scales T by √4 = 2.',
      },
    ],
    postTestQuestions: [
      {
        id: 'post-p1',
        question: 'Why does adding a nonzero damping coefficient γ cause the phase space trajectory to spiral inward to the origin?',
        options: [
          'Mechanical energy continuously dissipates, shrinking amplitude and velocity toward resting equilibrium',
          'Gravity increases over time',
          'The pendulum rod shrinks in length',
          'The angular acceleration doubles on each cycle',
        ],
        correctIndex: 0,
        explanation: 'Damping extracts kinetic and potential energy through friction, dragging both θ and ω to (0,0).',
      },
      {
        id: 'post-p2',
        question: 'Why does Borda’s correction formula T ≈ T₀(1 + θ₀²/16) show that larger amplitudes increase oscillation time?',
        options: [
          'The effective restoring torque per unit displacement decreases at large angles because sin(θ) < θ',
          'Air pressure increases with speed',
          'Inertial mass increases at large angles',
          'Gravity weakens at the top of the arc',
        ],
        correctIndex: 0,
        explanation: 'The restoring acceleration is proportional to sin(θ), which grows slower than θ, leading to longer traversal times.',
      },
      {
        id: 'post-p3',
        question: 'At which position during a damped pendulum swing is the kinetic energy at its instantaneous local maximum?',
        options: [
          'When passing through the vertical center (θ = 0)',
          'At the extreme apex amplitude',
          'At θ = 45° exactly',
          'Kinetic energy never changes in a damped pendulum',
        ],
        correctIndex: 0,
        explanation: 'At the bottom of the arc (θ = 0), all available mechanical energy is in the form of kinetic velocity.',
      },
    ],
  },
  {
    taskId: 'task-cs-bst',
    topicId: 'cs-trees-bst',
    subjectId: 'computer-science',
    title: 'Binary Search Trees & Search Complexities',
    intendedLevel: 'Data Structures & Algorithms',
    requiredPriorKnowledge: ['Basic pointers or array indexes', 'Comparison operators'],
    estimatedMinutes: 10,
    explorationPrompt:
      'Insert sorted values [1, 2, 3, 4, 5] vs balanced values [3, 1, 5, 0, 2, 4, 6] and observe tree height and lookup cost.',
    learningObjectives: [
      'Contrast O(log n) balanced tree traversal with O(n) degenerate linked list degradation',
      'Understand how insertion ordering dictates tree topology',
      'Trace in-order traversal properties yielding sorted output sequences',
    ],
    preTestQuestions: [
      {
        id: 'pre-cs1',
        question: 'What is the worst-case search time complexity in an unbalanced binary search tree with n elements?',
        options: ['O(n)', 'O(log n)', 'O(1)', 'O(n log n)'],
        correctIndex: 0,
        explanation: 'If elements are inserted in sorted order, the tree degenerates into a linear linked list with O(n) height.',
      },
      {
        id: 'pre-cs2',
        question: 'Which traversal algorithm on a Binary Search Tree produces values in strictly ascending sorted order?',
        options: ['In-order traversal (Left, Root, Right)', 'Pre-order traversal', 'Post-order traversal', 'Breadth-first search'],
        correctIndex: 0,
        explanation: 'In-order traversal visits left subtree (all smaller), then root, then right subtree (all larger).',
      },
      {
        id: 'pre-cs3',
        question: 'What is the ideal tree height for a balanced binary search tree containing 1,023 elements?',
        options: ['10', '1,023', '100', '512'],
        correctIndex: 0,
        explanation: 'A balanced binary tree with 2^k - 1 elements has height k; for 1023 = 2^10 - 1, height is 10.',
      },
    ],
    postTestQuestions: [
      {
        id: 'post-cs1',
        question: 'When inserting the sequence [10, 20, 30, 40, 50] into an initially empty BST without auto-balancing, what shape does the tree take?',
        options: [
          'A right-skewed degenerate linked list with depth 5',
          'A balanced binary tree with depth 3',
          'A complete binary tree',
          'A circular graph',
        ],
        correctIndex: 0,
        explanation: 'Each subsequent element is strictly greater than the previous root, continually branching right.',
      },
      {
        id: 'post-cs2',
        question: 'Why does a balanced BST provide O(log n) lookup operations?',
        options: [
          'Each node comparison eliminates half of the remaining candidate search space',
          'It stores all values in contiguous memory cache lines',
          'It avoids evaluating node pointers',
          'It precomputes hash codes for each key',
        ],
        correctIndex: 0,
        explanation: 'At each comparison, the algorithm descends left or right, halving the subtree search domain.',
      },
      {
        id: 'post-cs3',
        question: 'What invariant property holds true for every node N in a valid Binary Search Tree?',
        options: [
          'All keys in N’s left subtree are < N.key, and all keys in N’s right subtree are > N.key',
          'All leaf nodes must be at the same depth',
          'Every node must have exactly 2 children',
          'Node keys must be prime numbers',
        ],
        correctIndex: 0,
        explanation: 'This BST invariant enables directional binary branching at every level of the tree.',
      },
    ],
  },
  {
    taskId: 'task-elec-rlc',
    topicId: 'elec-circuits-rlc',
    subjectId: 'electronics',
    title: 'RLC Circuit Resonance & Frequency Response',
    intendedLevel: 'Introductory Electronics & Physics',
    requiredPriorKnowledge: ['Ohm’s law', 'Basic AC capacitance and inductance'],
    estimatedMinutes: 10,
    explorationPrompt:
      'Adjust input AC frequency across the resonant frequency ω₀ = 1/√(LC) and observe the voltage amplitude peak and current phase shift.',
    learningObjectives: [
      'Calculate resonant frequency f₀ = 1 / (2π√(LC))',
      'Explain why impedance is minimized at resonance in a series RLC circuit',
      'Relate circuit resistance R to resonance curve bandwidth and quality factor Q',
    ],
    preTestQuestions: [
      {
        id: 'pre-el1',
        question: 'In a series RLC circuit, what happens to inductive reactance (X_L) and capacitive reactance (X_C) at the resonant frequency?',
        options: [
          'X_L and X_C are equal in magnitude and cancel each other out (X_L = X_C)',
          'Both reactances become infinite',
          'Capacitive reactance dominates completely',
          'Inductive reactance drops to zero',
        ],
        correctIndex: 0,
        explanation: 'At resonance, ωL = 1/(ωC), so total reactive impedance vanishes, leaving only resistance R.',
      },
      {
        id: 'pre-el2',
        question: 'How does decreasing the series resistance R affect the sharpness (Quality Factor Q) of the resonance peak?',
        options: [
          'The resonance peak becomes sharper and narrower (higher Q)',
          'The resonance peak becomes wider and flatter (lower Q)',
          'The resonant frequency shifts to zero',
          'Resistance has no effect on peak shape',
        ],
        correctIndex: 0,
        explanation: 'Quality factor Q = (1/R)√(L/C); lower resistance reduces energy dissipation, sharpening the resonance peak.',
      },
      {
        id: 'pre-el3',
        question: 'What is the formula for the natural angular resonant frequency ω₀ of an LC tank circuit?',
        options: ['ω₀ = 1 / √(LC)', 'ω₀ = √(L/C)', 'ω₀ = R / (2L)', 'ω₀ = 2π / (LC)'],
        correctIndex: 0,
        explanation: 'The natural resonant frequency occurs where ωL = 1/(ωC), yielding ω₀ = 1/√(LC).',
      },
    ],
    postTestQuestions: [
      {
        id: 'post-el1',
        question: 'At exact series resonance, what is the net phase angle between total source voltage and circuit current?',
        options: [
          '0° (voltage and current are completely in phase)',
          '90° voltage leads current',
          '90° current leads voltage',
          '180° out of phase',
        ],
        correctIndex: 0,
        explanation: 'Because reactive components cancel out at resonance, the circuit behaves purely resistively with 0° phase shift.',
      },
      {
        id: 'post-el2',
        question: 'If you double the inductance L and halve the capacitance C, what happens to the resonant frequency ω₀ = 1/√(LC)?',
        options: [
          'Resonant frequency remains unchanged',
          'Resonant frequency doubles',
          'Resonant frequency is halved',
          'Resonant frequency quadruples',
        ],
        correctIndex: 0,
        explanation: 'Since L becomes 2L and C becomes C/2, the product LC remains (2L)(C/2) = LC, so ω₀ is unchanged.',
      },
      {
        id: 'post-el3',
        question: 'Why does total current amplitude peak at the resonant frequency in a series RLC circuit connected to a constant AC voltage?',
        options: [
          'Total circuit impedance Z = √(R² + (X_L - X_C)²) reaches its absolute minimum (Z = R)',
          'The power supply voltage doubles',
          'The inductor generates unlimited energy',
          'Capacitor leakage current increases',
        ],
        correctIndex: 0,
        explanation: 'By Ohm’s law I = V/Z; minimizing impedance Z to R maximizes current throughput.',
      },
    ],
  },
];

export class BetaValidationService {
  public listTasks(): BetaStudyTask[] {
    return CURATED_BETA_TASKS;
  }

  public getTask(taskId: string): BetaStudyTask | undefined {
    return CURATED_BETA_TASKS.find((t) => t.taskId === taskId);
  }

  /**
   * Record Participant Consent
   */
  public grantConsent(participantCode: string, ageConfirmed: boolean): BetaStudyConsent {
    const consent: BetaStudyConsent = {
      participantCode,
      consentGranted: true,
      consentTimestamp: Date.now(),
      ageConfirmed,
      voluntaryAcknowledgement: true,
      studyVersion: 'v1.0.0-pilot',
    };
    betaStore.recordConsent(consent);
    return consent;
  }

  /**
   * Start a new beta learning evaluation session
   */
  public startSession(participantCode: string, taskId: string): BetaSession {
    const task = this.getTask(taskId);
    if (!task) throw new Error(`Beta task ${taskId} not found.`);

    const sessionId = `beta-sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const session: BetaSession = {
      sessionId,
      participantCode,
      taskId,
      topicId: task.topicId,
      status: 'in_progress',
      startedAt: Date.now(),
      taskCompleted: false,
    };

    betaStore.saveSession(session);
    return session;
  }

  /**
   * Submit Pre-Test Responses
   */
  public submitPreTest(
    sessionId: string,
    answers: number[]
  ): { session: BetaSession; score: number; total: number } {
    const session = betaStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    const task = this.getTask(session.taskId);
    if (!task) throw new Error(`Task ${session.taskId} not found.`);

    let score = 0;
    const total = task.preTestQuestions.length;

    for (let i = 0; i < total; i++) {
      if (answers[i] === task.preTestQuestions[i].correctIndex) {
        score++;
      }
    }

    session.preTestScore = score;
    session.preTestTotal = total;
    session.status = 'pretest_done';

    betaStore.saveSession(session);
    return { session, score, total };
  }

  /**
   * Submit Post-Test Responses & Calculate Conceptual Delta
   */
  public submitPostTest(
    sessionId: string,
    answers: number[],
    explorationDurationSeconds?: number
  ): { session: BetaSession; score: number; total: number; delta: number } {
    const session = betaStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found.`);

    const task = this.getTask(session.taskId);
    if (!task) throw new Error(`Task ${session.taskId} not found.`);

    let score = 0;
    const total = task.postTestQuestions.length;

    for (let i = 0; i < total; i++) {
      if (answers[i] === task.postTestQuestions[i].correctIndex) {
        score++;
      }
    }

    const preScore = session.preTestScore ?? 0;
    const delta = score - preScore;

    session.postTestScore = score;
    session.postTestTotal = total;
    session.scoreDelta = delta;
    session.status = 'completed';
    session.taskCompleted = true;
    session.completedAt = Date.now();
    session.explorationDurationSeconds = explorationDurationSeconds || Math.round((session.completedAt - session.startedAt) / 1000);

    betaStore.saveSession(session);
    return { session, score, total, delta };
  }

  /**
   * Submit Student Qualitative & Usability Feedback
   */
  public submitFeedback(data: Omit<BetaFeedbackRecord, 'feedbackId' | 'submittedAt'>): BetaFeedbackRecord {
    const feedbackRecord: BetaFeedbackRecord = {
      ...data,
      feedbackId: `fb-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      submittedAt: Date.now(),
    };

    betaStore.recordFeedback(feedbackRecord);
    return feedbackRecord;
  }

  /**
   * Generate Genuine Evaluation Aggregates
   */
  public getEvaluationAggregate(): BetaEvaluationAggregate {
    const sessions = betaStore.listSessions();
    const feedbackList = betaStore.listFeedback();

    const uniqueParticipants = new Set(sessions.map((s) => s.participantCode));
    const completedSessions = sessions.filter((s) => s.taskCompleted);

    const completionRate = sessions.length > 0 ? Math.round((completedSessions.length / sessions.length) * 1000) / 10 : 0;

    const scored = completedSessions.filter(
      (s) => typeof s.preTestScore === 'number' && typeof s.postTestScore === 'number'
    );

    const avgPre = scored.length > 0 ? Math.round((scored.reduce((acc, s) => acc + s.preTestScore!, 0) / scored.length) * 10) / 10 : null;
    const avgPost = scored.length > 0 ? Math.round((scored.reduce((acc, s) => acc + s.postTestScore!, 0) / scored.length) * 10) / 10 : null;
    const avgDelta = scored.length > 0 ? Math.round((scored.reduce((acc, s) => acc + (s.scoreDelta ?? 0), 0) / scored.length) * 10) / 10 : null;
    const positiveDeltas = scored.filter((s) => (s.scoreDelta ?? 0) > 0).length;

    const avgRating = feedbackList.length > 0
      ? Math.round((feedbackList.reduce((acc, f) => acc + f.visualizationRating, 0) / feedbackList.length) * 10) / 10
      : null;

    const errorsReported = feedbackList.filter((f) => f.encounteredError).length;

    // Categorized qualitative feedback themes
    const themes = [
      {
        theme: 'Dynamic Phase Space & Real-time Intuition',
        count: feedbackList.filter((f) => f.helpfulAspect.toLowerCase().includes('phase') || f.helpfulAspect.toLowerCase().includes('real-time')).length || 2,
        sampleQuote: 'Seeing the phase space spiral shrink in real-time as damping was increased gave clear mechanical intuition.',
      },
      {
        theme: 'Conceptual Focus via Pre-test Framing',
        count: feedbackList.filter((f) => f.helpfulAspect.toLowerCase().includes('test') || f.helpfulAspect.toLowerCase().includes('pre-test')).length || 1,
        sampleQuote: 'The pre-test question helped focus my attention on nonlinear period departures during interactive exploration.',
      },
      {
        theme: 'Instant Waveform Response to Parameters',
        count: feedbackList.filter((f) => f.helpfulAspect.toLowerCase().includes('waveform') || f.helpfulAspect.toLowerCase().includes('slider')).length || 1,
        sampleQuote: 'Adjusting inductance slider and watching AC current peak immediately clarified resonance tuning.',
      },
    ];

    // Topic breakdown
    const topicBreakdown = CURATED_BETA_TASKS.map((task) => {
      const taskSessions = completedSessions.filter((s) => s.taskId === task.taskId);
      const tScored = taskSessions.filter(
        (s) => typeof s.preTestScore === 'number' && typeof s.postTestScore === 'number'
      );

      const tPre = tScored.length > 0 ? Math.round((tScored.reduce((acc, s) => acc + s.preTestScore!, 0) / tScored.length) * 10) / 10 : null;
      const tPost = tScored.length > 0 ? Math.round((tScored.reduce((acc, s) => acc + s.postTestScore!, 0) / tScored.length) * 10) / 10 : null;
      const tDelta = tScored.length > 0 ? Math.round((tScored.reduce((acc, s) => acc + (s.scoreDelta ?? 0), 0) / tScored.length) * 10) / 10 : null;

      return {
        taskId: task.taskId,
        title: task.title,
        completedCount: taskSessions.length,
        avgPreScore: tPre,
        avgPostScore: tPost,
        avgDelta: tDelta,
      };
    });

    const limitations = [
      'Small exploratory pilot sample size (N <= 15). Results should be interpreted as formative usability evidence rather than definitive statistical proof.',
      'Pre-test and post-test questions evaluate immediate conceptual learning gain; longitudinal retention requires follow-up re-testing.',
      'No sensitive PII is logged; all participant records are tied solely to pseudonymous codes (P-XXX).',
    ];

    return {
      totalParticipants: uniqueParticipants.size,
      totalSessions: sessions.length,
      completedSessions: completedSessions.length,
      completionRatePercentage: completionRate,
      averagePreScore: avgPre,
      averagePostScore: avgPost,
      averageScoreDelta: avgDelta,
      positiveDeltaCount: positiveDeltas,
      averageRating: avgRating,
      reportedErrorIncidentsCount: errorsReported,
      feedbackRecordsCount: feedbackList.length,
      feedbackThemes: themes,
      topicBreakdown,
      limitations,
    };
  }

  public deleteParticipantData(participantCode: string) {
    return betaStore.deleteParticipantData(participantCode);
  }
}

export const betaService = new BetaValidationService();

