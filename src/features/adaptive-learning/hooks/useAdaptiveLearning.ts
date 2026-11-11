'use client';

import { useCallback, useEffect, useState } from 'react';
import { AssessmentQuestion, AssessmentSessionState, AnswerEvaluation, AssessmentDifficultyLevel } from '../../assessment/AssessmentContracts';
import { HintEngine, HintResponse } from '../../assessment/HintEngine';
import { AdaptiveLearningPlanner } from '../engines/AdaptiveLearningPlanner';
import { AssessmentService, assessmentService } from '../services/AssessmentService';
import { LearningAnalyticsService } from '../services/LearningAnalyticsService';
import { LearningAnalytics } from '../types/MasteryTypes';
import { AdaptiveRecommendation } from '../../adaptive/AdaptiveLearningContracts';
import { QuestionBankService } from '../services/QuestionBankService';

function getStudentId(): string {
  const key = 'visios_adaptive_student_id';
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const created = `student_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`;
    window.localStorage.setItem(key, created);
    return created;
  } catch {
    return 'student_local';
  }
}

export function useAdaptiveLearning(conceptId: string, service: AssessmentService = assessmentService) {
  const assessmentConceptId = QuestionBankService.normalizeConceptId(conceptId) || conceptId;
  const [studentId, setStudentId] = useState('');
  const [session, setSession] = useState<AssessmentSessionState | null>(null);
  const [question, setQuestion] = useState<AssessmentQuestion | null>(null);
  const [evaluation, setEvaluation] = useState<AnswerEvaluation | null>(null);
  const [analytics, setAnalytics] = useState<LearningAnalytics | null>(null);
  const [recommendation, setRecommendation] = useState<AdaptiveRecommendation | null>(null);
  const [hint, setHint] = useState<HintResponse | null>(null);
  const [hintIndex, setHintIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSession(null);
    setQuestion(null);
    setEvaluation(null);
    setAnalytics(null);
    setRecommendation(null);
    setHint(null);
    try {
      const id = getStudentId();
      const started = service.start(id, assessmentConceptId);
      if (cancelled) return;
      setStudentId(id);
      setSession(started?.session || null);
      setQuestion(started?.question || null);
      if (started?.session.isCompleted) setEvaluation(started.session.attempts.at(-1)?.evaluation || null);
      setAnalytics(LearningAnalyticsService.getConceptAnalytics(id, assessmentConceptId));
      setRecommendation(started ? AdaptiveLearningPlanner.recommend(id, assessmentConceptId) : null);
      setError(started ? null : 'There are no verified assessment questions for this topic yet. You can continue learning the explanation and visualization.');
    } catch {
      if (!cancelled) setError('Could not open the assessment. Your learning session is still available.');
    } finally {
      if (!cancelled) setIsLoading(false);
    }
    return () => { cancelled = true; };
  }, [assessmentConceptId, service]);

  const submitAnswer = useCallback((answer: string | number) => {
    if (!session || !question || evaluation) return null;
    try {
      const submitted = service.submit(session.sessionId, question, answer, hintIndex);
      setSession(submitted.session);
      setEvaluation(submitted.evaluation);
      setAnalytics(submitted.analytics);
      const nextRecommendation = AdaptiveLearningPlanner.recommend(studentId, assessmentConceptId);
      setRecommendation(nextRecommendation);
      setQuestion(submitted.nextQuestion || question);
      return { ...submitted, recommendation: nextRecommendation };
    } catch {
      setError('The answer could not be evaluated. Please retry this question.');
      return null;
    }
  }, [assessmentConceptId, evaluation, hintIndex, question, service, session, studentId]);

  const continueAssessment = useCallback(() => {
    if (!session || session.isCompleted) return;
    const next = session.currentQuestion || service.nextQuestion(assessmentConceptId, session.currentDifficulty as AssessmentDifficultyLevel);
    if (!next) {
      setError('No verified next question is available for this topic.');
      return;
    }
    setQuestion(next);
    setEvaluation(null);
    setHint(null);
    setHintIndex(0);
  }, [assessmentConceptId, service, session]);

  const restartAssessment = useCallback(() => {
    if (!studentId) return;
    const restarted = service.restart(studentId, assessmentConceptId);
    if (!restarted) return;
    setSession(restarted.session);
    setQuestion(restarted.question);
    setEvaluation(null);
    setHint(null);
    setHintIndex(0);
  }, [assessmentConceptId, service, studentId]);

  const requestHint = useCallback(() => {
    if (!question) return;
    const nextHint = HintEngine.getNextHint(question, hintIndex);
    setHint(nextHint);
    if (!nextHint.isSolutionRevealed) setHintIndex((index) => index + 1);
  }, [hintIndex, question]);

  return { studentId, session, question, evaluation, analytics, recommendation, hint, isLoading, error, submitAnswer, continueAssessment, restartAssessment, requestHint };
}
