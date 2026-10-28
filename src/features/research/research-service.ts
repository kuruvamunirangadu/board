/**
 * VisiOS Milestone 19 — Research Service
 * High-level orchestration for research protocols, assessment scoring, and evaluation analytics.
 */

import {
  ExperimentProtocol,
  ResearchSessionRecord,
  ExperimentEvaluationReport,
  DiagnosticQuestion,
  StudyCondition,
  AdaptationRecommendation,
} from '@/types/research';
import { RESEARCH_PROTOCOLS } from './experiment-engine';
import { researchStore } from './research-store';
import { researchStatisticalAnalyzer } from './research-analysis';
import { explainableAdaptationEngine } from '../adaptive/adaptive-engine';
import { DIAGNOSTIC_QUESTION_BANK } from '../adaptive/misconception-catalog';

export class ResearchService {
  public getProtocols(): ExperimentProtocol[] {
    return RESEARCH_PROTOCOLS;
  }

  public getProtocol(experimentId: string): ExperimentProtocol | undefined {
    return RESEARCH_PROTOCOLS.find((p) => p.experimentId === experimentId);
  }

  public startSession(
    participantCode: string,
    experimentId: string,
    condition?: StudyCondition
  ): ResearchSessionRecord {
    const protocol = this.getProtocol(experimentId);
    if (!protocol) {
      throw new Error(`Protocol ${experimentId} not found`);
    }

    const session = researchStore.createSession(participantCode, experimentId, condition);
    return researchStore.updateSession(session.sessionId, { status: 'pre_test' });
  }

  public submitPreTest(
    sessionId: string,
    responses: Record<string, number>
  ): { score: number; session: ResearchSessionRecord } {
    const session = researchStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const protocol = this.getProtocol(session.experimentId);
    if (!protocol) throw new Error(`Protocol ${session.experimentId} not found`);

    // Score pre-test questions and register diagnostic evidence items
    let correctCount = 0;
    const questions = protocol.preTestQuestions;

    questions.forEach((q) => {
      const selectedIndex = responses[q.id];
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctCount++;

      const detectedMisconceptionId = !isCorrect ? q.distractorMisconceptions[selectedIndex] : undefined;

      researchStore.recordEvidence(sessionId, {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        participantId: session.participantCode,
        conceptId: q.conceptId,
        conceptVersion: q.version,
        questionId: q.id,
        timestamp: Date.now(),
        learningObjective: q.learningObjective,
        difficulty: q.difficulty,
        isCorrect,
        selectedOptionIndex: selectedIndex,
        detectedMisconceptionId,
        hintsUsed: 0,
        timeSpentMs: 15000,
      });
    });

    const normalizedScore = Number(((correctCount / Math.max(1, questions.length)) * 100).toFixed(1));

    const updated = researchStore.updateSession(sessionId, {
      preTestResponses: responses,
      preTestScore: normalizedScore,
      status: 'learning_phase',
    });

    return { score: normalizedScore, session: updated };
  }

  public getNextIntervention(
    sessionId: string,
    learningObjective?: string
  ): AdaptationRecommendation {
    const session = researchStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const protocol = this.getProtocol(session.experimentId);
    const targetConceptId = protocol?.targetConceptId || 'phys-pendulum-nonlinear';
    const targetObj = learningObjective || protocol?.title || 'Nonlinear Oscillations';

    // If session is in control condition (fixed sequence), serve standard linear sequence
    if (session.condition === 'fixed_sequence') {
      const fixedRec: AdaptationRecommendation = {
        recommendationId: `rec-fixed-${Date.now()}`,
        participantId: session.participantCode,
        conceptId: targetConceptId,
        targetObjective: targetObj,
        interventionType: 'labeled_2d_diagram',
        resourceId: `res-fixed-${targetConceptId}`,
        resourceTitle: `Standard Course Resource: ${targetConceptId}`,
        resourcePayload: {
          type: 'diagram',
          title: `Static Reference Overview: ${targetConceptId}`,
          content: `Review the standard text and diagrams for ${targetObj}. Follow along sequentially through the core equations.`,
        },
        humanReadableRationale: 'Control Condition (Fixed Sequence): Serving standard non-adaptive curricular material.',
        evidenceTrail: ['Assigned condition: fixed_sequence'],
        triggeredRuleId: 'RULE-FIXED-CONTROL-SEQUENCE',
        ruleVersion: 'v1.0.0',
        estimatedDifficultyReduction: 0,
        generatedAt: Date.now(),
      };
      researchStore.recordAdaptation(sessionId, fixedRec);
      return fixedRec;
    }

    // Adaptive condition: Query Explainable Adaptation Engine
    const recommendation = explainableAdaptationEngine.recommendIntervention({
      participantId: session.participantCode,
      conceptId: targetConceptId,
      learningObjective: targetObj,
      prerequisiteIds: ['phys-pendulum-period'],
    });

    researchStore.recordAdaptation(sessionId, recommendation);
    return recommendation;
  }

  public completeInterventionStep(
    sessionId: string,
    interventionId: string
  ): ResearchSessionRecord {
    const session = researchStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const completed = [...session.interventionsCompleted, interventionId];
    return researchStore.updateSession(sessionId, {
      interventionsCompleted: completed,
      status: 'post_test',
    });
  }

  public submitPostTest(
    sessionId: string,
    responses: Record<string, number>,
    feedback?: { clarityRating: number; qualitativeFeedback: string }
  ): { score: number; session: ResearchSessionRecord } {
    const session = researchStore.getSession(sessionId);
    if (!session) throw new Error(`Session ${sessionId} not found`);

    const protocol = this.getProtocol(session.experimentId);
    if (!protocol) throw new Error(`Protocol ${session.experimentId} not found`);

    let correctCount = 0;
    const questions = protocol.postTestQuestions;

    questions.forEach((q) => {
      const selectedIndex = responses[q.id];
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) correctCount++;

      const detectedMisconceptionId = !isCorrect ? q.distractorMisconceptions[selectedIndex] : undefined;

      researchStore.recordEvidence(sessionId, {
        id: `ev-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        participantId: session.participantCode,
        conceptId: q.conceptId,
        conceptVersion: q.version,
        questionId: q.id,
        timestamp: Date.now(),
        learningObjective: q.learningObjective,
        difficulty: q.difficulty,
        isCorrect,
        selectedOptionIndex: selectedIndex,
        detectedMisconceptionId,
        hintsUsed: 0,
        timeSpentMs: 15000,
      });
    });

    const normalizedScore = Number(((correctCount / Math.max(1, questions.length)) * 100).toFixed(1));
    const now = Date.now();
    const durationSeconds = Math.round((now - session.startedAt) / 1000);

    const updated = researchStore.updateSession(sessionId, {
      postTestResponses: responses,
      postTestScore: normalizedScore,
      completedAt: now,
      timeOnTaskSeconds: durationSeconds,
      status: 'completed',
      subjectiveClarityRating: feedback?.clarityRating,
      qualitativeFeedback: feedback?.qualitativeFeedback,
    });

    return { score: normalizedScore, session: updated };
  }

  public getEvaluationReport(experimentId: string): ExperimentEvaluationReport {
    const protocol = this.getProtocol(experimentId);
    if (!protocol) throw new Error(`Protocol ${experimentId} not found`);

    const allSessions = researchStore.getAllSessions();
    return researchStatisticalAnalyzer.analyzeExperiment(protocol, allSessions);
  }

  public deleteParticipant(participantCode: string): { deletedSessions: number } {
    return researchStore.deleteParticipantData(participantCode);
  }
}

export const researchService = new ResearchService();

