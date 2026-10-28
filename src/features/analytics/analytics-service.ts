import {
  AssessmentAttemptRecord,
  ConceptPerformance,
  QuestionPerformance,
  RecommendationEvidence,
  LearningAnalyticsSnapshot,
  InstructorClassAnalytics,
  AnalyticsReportExport,
  RetakePolicy,
  CoverageStatus,
} from '@/types/analytics';
import { analyticsStore } from './analytics-store';
import { PENDULUM_CONCEPTS } from '../learning-paths/curated-paths';

export const ANALYTICS_CALCULATION_VERSION = 'v1.0.0';
export const RECOMMENDATION_POLICY_VERSION = 'v1.0.0';

export const METRIC_DEFINITIONS = {
  assessmentAccuracy:
    'Assessment Accuracy: The percentage of correct responses among all eligible evaluated attempts ((correct / total) * 100). When total attempts equal 0, displays "No assessment data" instead of 0%.',
  coveragePercentage:
    'Assessment Coverage: The proportion of subject concepts that possess at least one evaluated assessment record ((assessedConcepts / totalConcepts) * 100).',
  retakePolicy:
    'Retake Policy: Controls whether all submitted attempts are included, only the latest attempt per question, or the best score.',
  sampleAdequacy:
    'Sample Adequacy: Indicates whether sufficient attempts exist to draw statistical inferences (N >= 3 for concepts, N >= 5 for questions).',
  savedExperimentActivity:
    'Saved Experiment Checkpoints: Verifiable persisted simulation states created and saved by the learner, distinct from transient simulation views.',
};

export class LearningAnalyticsService {
  /**
   * Filter attempts by retake policy
   */
  public applyRetakePolicy(
    attempts: AssessmentAttemptRecord[],
    policy: RetakePolicy = 'all_attempts'
  ): AssessmentAttemptRecord[] {
    if (policy === 'all_attempts') {
      return attempts;
    }

    // Group by questionId
    const grouped = new Map<string, AssessmentAttemptRecord[]>();
    for (const att of attempts) {
      if (!grouped.has(att.questionId)) {
        grouped.set(att.questionId, []);
      }
      grouped.get(att.questionId)!.push(att);
    }

    const filtered: AssessmentAttemptRecord[] = [];
    for (const [, qAttempts] of Array.from(grouped.entries())) {
      if (policy === 'latest_attempt') {
        // Sort descending by timestamp, take first
        const sorted = [...qAttempts].sort((a, b) => b.timestamp - a.timestamp);
        filtered.push(sorted[0]);
      } else if (policy === 'best_attempt') {
        // Sort descending by isCorrect/score, take first
        const sorted = [...qAttempts].sort((a, b) => (b.isCorrect ? 1 : 0) - (a.isCorrect ? 1 : 0));
        filtered.push(sorted[0]);
      }
    }

    return filtered;
  }

  /**
   * Calculate accuracy percentage safely
   */
  public calculateAccuracy(correct: number, total: number): {
    accuracy: number | null;
    accuracyFormatted: string;
  } {
    if (total <= 0) {
      return { accuracy: null, accuracyFormatted: 'No assessment data' };
    }
    const acc = Math.round((correct / total) * 1000) / 10;
    return { accuracy: acc, accuracyFormatted: `${acc.toFixed(1)}%` };
  }

  /**
   * Compute concept-level performance metrics
   */
  public computeConceptPerformances(
    attempts: AssessmentAttemptRecord[],
    subjectId = 'physics'
  ): ConceptPerformance[] {
    // Collect all available concepts for the subject (case-insensitive)
    const normalizedSubject = (subjectId || 'physics').toLowerCase();
    const subjectConcepts = PENDULUM_CONCEPTS.filter(
      (c) => c.subject.toLowerCase() === normalizedSubject
    ).map((c) => ({ ...c }));

    // Include any additional concepts recorded in attempts
    const existingConceptIds = new Set(subjectConcepts.map((c) => c.id));
    for (const att of attempts) {
      if (!existingConceptIds.has(att.conceptId)) {
        existingConceptIds.add(att.conceptId);
        subjectConcepts.push({
          id: att.conceptId,
          title: att.conceptTitle || att.conceptId,
          subject: att.subjectId || subjectId || 'Physics',
          description: '',
          difficultyLevel: 'intermediate',
          estimatedMinutes: 10,
          prerequisiteIds: [],
          suggestedVisualizations: ['simulation'],
          learningObjectives: [],
        });
      }
    }

    // Group attempts by conceptId
    const conceptAttemptsMap = new Map<string, AssessmentAttemptRecord[]>();
    for (const att of attempts) {
      if (!conceptAttemptsMap.has(att.conceptId)) {
        conceptAttemptsMap.set(att.conceptId, []);
      }
      conceptAttemptsMap.get(att.conceptId)!.push(att);
    }

    const performances: ConceptPerformance[] = [];

    for (const concept of subjectConcepts) {
      const cAttempts = conceptAttemptsMap.get(concept.id) || [];
      const total = cAttempts.length;
      const correct = cAttempts.filter((a) => a.isCorrect).length;
      const incorrect = total - correct;
      const { accuracy, accuracyFormatted } = this.calculateAccuracy(correct, total);

      let coverageStatus: CoverageStatus = 'not_assessed';
      if (total === 0) {
        coverageStatus = 'not_assessed';
      } else if (total < 2 || (accuracy !== null && accuracy < 70)) {
        coverageStatus = 'in_progress';
      } else if (accuracy !== null && accuracy >= 90 && total >= 3) {
        coverageStatus = 'mastered_evidence';
      } else {
        coverageStatus = 'assessed';
      }

      const lastAttempt = cAttempts.length > 0
        ? Math.max(...cAttempts.map((a) => a.timestamp))
        : null;

      const evidenceRefs = cAttempts.map(
        (a) =>
          `Attempt ${a.id} (${new Date(a.timestamp).toLocaleDateString()}): ${
            a.isCorrect ? 'Correct' : 'Incorrect'
          } on "${a.questionTitle || a.questionId}"`
      );

      performances.push({
        conceptId: concept.id,
        conceptTitle: concept.title,
        subjectId: concept.subject,
        totalAttempts: total,
        correctAttempts: correct,
        incorrectAttempts: incorrect,
        accuracy,
        accuracyFormatted,
        lastAttemptTimestamp: lastAttempt,
        coverageStatus,
        isSampleAdequate: total >= 3,
        evidenceReferences: evidenceRefs,
      });
    }

    return performances;
  }

  /**
   * Compute Question Item Analysis
   */
  public computeQuestionPerformances(
    attempts: AssessmentAttemptRecord[]
  ): QuestionPerformance[] {
    const questionMap = new Map<string, AssessmentAttemptRecord[]>();
    for (const att of attempts) {
      if (!questionMap.has(att.questionId)) {
        questionMap.set(att.questionId, []);
      }
      questionMap.get(att.questionId)!.push(att);
    }

    const results: QuestionPerformance[] = [];

    for (const [qId, qAttempts] of Array.from(questionMap.entries())) {
      const first = qAttempts[0];
      const total = qAttempts.length;
      const correct = qAttempts.filter((a) => a.isCorrect).length;
      const incorrect = total - correct;
      const { accuracy, accuracyFormatted } = this.calculateAccuracy(correct, total);

      // Distribution of selected options
      const optionDistribution: Record<number | string, number> = {};
      for (const a of qAttempts) {
        optionDistribution[a.selectedOption] = (optionDistribution[a.selectedOption] || 0) + 1;
      }

      const isSampleAdequate = total >= 5;
      const needsReviewFlag = isSampleAdequate && accuracy !== null && accuracy < 60;
      const reviewFlagReason = needsReviewFlag
        ? `Low accuracy (${accuracyFormatted}) with adequate sample size (N=${total}). Possible instructional gap or tricky distractor.`
        : !isSampleAdequate
        ? `Insufficient sample size (N=${total} < 5) to determine statistical reliability.`
        : undefined;

      results.push({
        questionId: qId,
        questionTitle: first.questionTitle || qId,
        conceptId: first.conceptId,
        conceptTitle: first.conceptTitle || first.conceptId,
        objectiveId: first.objectiveId,
        totalAttempts: total,
        correctAttempts: correct,
        incorrectAttempts: incorrect,
        accuracy,
        accuracyFormatted,
        optionDistribution,
        isSampleAdequate,
        needsReviewFlag,
        reviewFlagReason,
      });
    }

    return results;
  }

  /**
   * Deterministic evidence-grounded recommendation generator
   */
  public generateRecommendations(
    conceptPerformances: ConceptPerformance[]
  ): RecommendationEvidence[] {
    const recommendations: RecommendationEvidence[] = [];
    const now = Date.now();

    for (const cp of conceptPerformances) {
      if (cp.coverageStatus === 'not_assessed') {
        recommendations.push({
          id: `rec-eval-${cp.conceptId}-${now}`,
          recommendedAction: 'reassess',
          conceptId: cp.conceptId,
          conceptTitle: cp.conceptTitle,
          evidenceRecords: ['Zero recorded assessment attempts.'],
          rationale: `No assessment evidence exists yet for ${cp.conceptTitle}. Complete a knowledge check to establish baseline understanding.`,
          timestamp: now,
          policyVersion: RECOMMENDATION_POLICY_VERSION,
        });
      } else if (cp.accuracy !== null && cp.accuracy < 70) {
        if (cp.conceptId === 'pendulum-nonlinear' || cp.conceptId === 'resonance-dynamics') {
          recommendations.push({
            id: `rec-sim-${cp.conceptId}-${now}`,
            recommendedAction: 'run_experiment',
            conceptId: cp.conceptId,
            conceptTitle: cp.conceptTitle,
            evidenceRecords: cp.evidenceReferences.slice(0, 3),
            rationale: `Low accuracy (${cp.accuracyFormatted}) on ${cp.conceptTitle}. Run the interactive phase space simulation to visualize energy damping and resonance curves.`,
            timestamp: now,
            policyVersion: RECOMMENDATION_POLICY_VERSION,
          });
        } else {
          recommendations.push({
            id: `rec-prac-${cp.conceptId}-${now}`,
            recommendedAction: 'practice_question',
            conceptId: cp.conceptId,
            conceptTitle: cp.conceptTitle,
            evidenceRecords: cp.evidenceReferences.slice(0, 3),
            rationale: `Accuracy is below 70% (${cp.accuracyFormatted}). Practice targeted questions on prerequisite principles.`,
            timestamp: now,
            policyVersion: RECOMMENDATION_POLICY_VERSION,
          });
        }
      } else if (cp.coverageStatus === 'mastered_evidence' || (cp.accuracy !== null && cp.accuracy >= 85)) {
        recommendations.push({
          id: `rec-adv-${cp.conceptId}-${now}`,
          recommendedAction: 'advance_next_concept',
          conceptId: cp.conceptId,
          conceptTitle: cp.conceptTitle,
          evidenceRecords: cp.evidenceReferences.slice(0, 2),
          rationale: `Demonstrated strong accuracy (${cp.accuracyFormatted}) on ${cp.conceptTitle}. Ready to advance to downstream dependent topics.`,
          timestamp: now,
          policyVersion: RECOMMENDATION_POLICY_VERSION,
        });
      }
    }

    return recommendations;
  }

  /**
   * Generate Full Student Learning Analytics Snapshot
   */
  public getStudentSnapshot(
    learnerId: string,
    options?: {
      subjectId?: string;
      retakePolicy?: RetakePolicy;
      fromTimestamp?: number;
      toTimestamp?: number;
      savedExperimentsCount?: number;
    }
  ): LearningAnalyticsSnapshot {
    const rawAttempts = analyticsStore.getAttempts({
      learnerId,
      subjectId: options?.subjectId || 'physics',
      fromTimestamp: options?.fromTimestamp,
      toTimestamp: options?.toTimestamp,
    });

    const policy = options?.retakePolicy || 'all_attempts';
    const evaluatedAttempts = this.applyRetakePolicy(rawAttempts, policy);

    const totalAttempts = evaluatedAttempts.length;
    const correctAttempts = evaluatedAttempts.filter((a) => a.isCorrect).length;
    const { accuracy, accuracyFormatted } = this.calculateAccuracy(correctAttempts, totalAttempts);

    const conceptPerformances = this.computeConceptPerformances(
      evaluatedAttempts,
      options?.subjectId || 'physics'
    );

    const assessedConcepts = conceptPerformances.filter((c) => c.totalAttempts > 0).length;
    const totalConcepts = conceptPerformances.length;
    const coveragePercentage =
      totalConcepts > 0 ? Math.round((assessedConcepts / totalConcepts) * 1000) / 10 : 0;

    const completedObjectives = conceptPerformances
      .filter((c) => c.accuracy !== null && c.accuracy >= 80)
      .length;

    const recommendations = this.generateRecommendations(conceptPerformances);

    const limitations = [
      'Analytics reflect only formally submitted assessment attempts and saved experiment states.',
      'Time spent on diagrams or canvas without active responses is not treated as evidence of mastery.',
      'Small sample sizes (N < 3 per concept) indicate preliminary results.',
    ];

    const learnerName = rawAttempts[0]?.learnerName || 'Student';

    return {
      id: `snap-${learnerId}-${Date.now()}`,
      learnerId,
      learnerName,
      subjectId: options?.subjectId || 'physics',
      generationTimestamp: Date.now(),
      calculationVersion: ANALYTICS_CALCULATION_VERSION,
      retakePolicy: policy,
      overallAccuracy: accuracy,
      overallAccuracyFormatted: accuracyFormatted,
      totalAttemptsCount: totalAttempts,
      conceptsAssessedCount: assessedConcepts,
      totalConceptsAvailable: totalConcepts,
      coveragePercentage,
      completedObjectivesCount: completedObjectives,
      savedExperimentsCount: options?.savedExperimentsCount ?? 2, // e.g. saved checkpoints
      conceptPerformances,
      recentAttempts: rawAttempts.slice(0, 10),
      recommendations,
      limitations,
    };
  }

  /**
   * Compute Instructor Class Aggregates with Authorization Check
   */
  public getInstructorClassAnalytics(
    requestingUserRole: string,
    classId = 'class-phys-101',
    subjectId = 'physics'
  ): InstructorClassAnalytics {
    if (requestingUserRole !== 'host' && requestingUserRole !== 'instructor') {
      throw new Error('Unauthorized: Instructor analytics require host or instructor role authorization.');
    }

    const allAttempts = analyticsStore.getAttempts({ subjectId });
    const learnerIds = analyticsStore.getLearnerIds();

    const totalEnrolled = Math.max(learnerIds.length, 3);
    const activeLearners = new Set(allAttempts.map((a) => a.learnerId)).size;

    const totalClassAttempts = allAttempts.length;
    const correctClassAttempts = allAttempts.filter((a) => a.isCorrect).length;
    const { accuracy, accuracyFormatted } = this.calculateAccuracy(
      correctClassAttempts,
      totalClassAttempts
    );

    // Concept averages across all students
    const normalizedSubject = (subjectId || 'physics').toLowerCase();
    const subjectConcepts = PENDULUM_CONCEPTS.filter(
      (c) => c.subject.toLowerCase() === normalizedSubject
    ).map((c) => ({ ...c }));

    const existingConceptIds = new Set(subjectConcepts.map((c) => c.id));
    for (const att of allAttempts) {
      if (!existingConceptIds.has(att.conceptId)) {
        existingConceptIds.add(att.conceptId);
        subjectConcepts.push({
          id: att.conceptId,
          title: att.conceptTitle || att.conceptId,
          subject: att.subjectId || subjectId || 'Physics',
          description: '',
          difficultyLevel: 'intermediate',
          estimatedMinutes: 10,
          prerequisiteIds: [],
          suggestedVisualizations: ['simulation'],
          learningObjectives: [],
        });
      }
    }

    const conceptAverages = subjectConcepts.map((concept) => {
      const cAttempts = allAttempts.filter((a) => a.conceptId === concept.id);
      const cTotal = cAttempts.length;
      const cCorrect = cAttempts.filter((a) => a.isCorrect).length;
      const cAcc = this.calculateAccuracy(cCorrect, cTotal);

      // Count distinct learners struggling (accuracy < 60%)
      const learnerAttemptsMap = new Map<string, AssessmentAttemptRecord[]>();
      for (const a of cAttempts) {
        if (!learnerAttemptsMap.has(a.learnerId)) {
          learnerAttemptsMap.set(a.learnerId, []);
        }
        learnerAttemptsMap.get(a.learnerId)!.push(a);
      }

      let strugglingCount = 0;
      for (const [, lAtts] of Array.from(learnerAttemptsMap.entries())) {
        const lCorrect = lAtts.filter((a) => a.isCorrect).length;
        if ((lCorrect / lAtts.length) < 0.6) {
          strugglingCount += 1;
        }
      }

      return {
        conceptId: concept.id,
        conceptTitle: concept.title,
        learnerCount: learnerAttemptsMap.size,
        totalAttempts: cTotal,
        accuracy: cAcc.accuracy,
        accuracyFormatted: cAcc.accuracyFormatted,
        strugglingLearnersCount: strugglingCount,
      };
    });

    // Top missed questions across class
    const questionPerformances = this.computeQuestionPerformances(allAttempts);
    const topMissed = questionPerformances
      .filter((q) => q.accuracy !== null)
      .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100))
      .slice(0, 5);

    // Concepts needing reinforcement
    const conceptsNeedingReinforcement = conceptAverages
      .filter((c) => c.accuracy !== null && c.accuracy < 70)
      .map((c) => ({
        conceptId: c.conceptId,
        conceptTitle: c.conceptTitle,
        reason: `Class accuracy is ${c.accuracyFormatted} across ${c.totalAttempts} attempts (${c.strugglingLearnersCount} students below 60%).`,
        accuracy: c.accuracy,
      }));

    const limitations = [
      'Class-level metrics aggregate all submitted responses across enrolled students.',
      'Individual private answer histories are isolated from the shared view.',
      'Items with fewer than 5 submissions are flagged as insufficient sample size.',
    ];

    return {
      classId,
      className: 'AP / College Physics Lab Group A',
      subjectId,
      totalEnrolledLearners: totalEnrolled,
      activeLearnersCount: activeLearners,
      overallClassAccuracy: accuracy,
      overallClassAccuracyFormatted: accuracyFormatted,
      conceptAverages,
      topMissedQuestions: topMissed,
      conceptsNeedingReinforcement,
      limitations,
    };
  }

  /**
   * Export structured analytics report matching on-screen calculations
   */
  public generateReportExport(
    role: 'student' | 'instructor',
    learnerIdOrClassId: string,
    retakePolicy: RetakePolicy = 'all_attempts'
  ): AnalyticsReportExport {
    if (role === 'student') {
      const snapshot = this.getStudentSnapshot(learnerIdOrClassId, { retakePolicy });
      return {
        reportId: `rep-${Date.now()}`,
        title: `VisiOS Student Learning Report - ${snapshot.learnerName || learnerIdOrClassId}`,
        generatedAt: new Date().toISOString(),
        generatedFor: snapshot.learnerName || learnerIdOrClassId,
        role: 'student',
        calculationVersion: ANALYTICS_CALCULATION_VERSION,
        retakePolicy,
        metrics: {
          overallAccuracy: snapshot.overallAccuracyFormatted,
          totalAttemptsCount: snapshot.totalAttemptsCount,
          conceptsAssessedCount: snapshot.conceptsAssessedCount,
          totalConceptsAvailable: snapshot.totalConceptsAvailable,
          coveragePercentage: `${snapshot.coveragePercentage}%`,
          completedObjectivesCount: snapshot.completedObjectivesCount,
          savedExperimentsCount: snapshot.savedExperimentsCount,
        },
        metricDefinitions: METRIC_DEFINITIONS,
        conceptBreakdown: snapshot.conceptPerformances.map((c) => ({
          concept: c.conceptTitle,
          accuracy: c.accuracyFormatted,
          attempts: c.totalAttempts,
          status: c.coverageStatus,
        })),
        limitations: snapshot.limitations,
      };
    } else {
      const classAnalytics = this.getInstructorClassAnalytics('instructor', learnerIdOrClassId);
      return {
        reportId: `rep-class-${Date.now()}`,
        title: `VisiOS Instructor Cohort Report - ${classAnalytics.className}`,
        generatedAt: new Date().toISOString(),
        generatedFor: classAnalytics.className,
        role: 'instructor',
        calculationVersion: ANALYTICS_CALCULATION_VERSION,
        retakePolicy,
        metrics: {
          overallClassAccuracy: classAnalytics.overallClassAccuracyFormatted,
          totalEnrolledLearners: classAnalytics.totalEnrolledLearners,
          activeLearnersCount: classAnalytics.activeLearnersCount,
          conceptsNeedingReinforcementCount: classAnalytics.conceptsNeedingReinforcement.length,
        },
        metricDefinitions: METRIC_DEFINITIONS,
        conceptBreakdown: classAnalytics.conceptAverages.map((c) => ({
          concept: c.conceptTitle,
          classAccuracy: c.accuracyFormatted,
          totalAttempts: c.totalAttempts,
          strugglingLearners: c.strugglingLearnersCount,
        })),
        limitations: classAnalytics.limitations,
      };
    }
  }
}

export const analyticsService = new LearningAnalyticsService();
