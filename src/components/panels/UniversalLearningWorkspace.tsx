'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor, createShapeId } from 'tldraw';
import katex from 'katex';
import {
  Sparkles,
  BookOpen,
  Compass,
  Sliders,
  HelpCircle,
  Activity,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Wand2,
  AlertTriangle,
  Lightbulb,
  ArrowRight,
  Info,
  Layers,
  Cpu,
  Check,
  Globe,
  ExternalLink,
  Loader2,
  Code2,
} from 'lucide-react';
import {
  LearningPlan,
  InputInterpretation,
  InteractiveExperimentState,
} from '@/features/learning/types';
import { toRichText } from '@/lib/tldraw-utils';
import { UniversalInputInterpreter } from '@/features/learning/UniversalInputInterpreter';
import { LearningPlanGenerator } from '@/features/learning/LearningPlanGenerator';
import { LearningOrchestrator } from '@/features/learning/LearningOrchestrator';
import { InteractiveExplorationEngine } from '@/features/learning/InteractiveExplorationEngine';
import { AIModelAdapter } from '@/features/learning/AIModelAdapter';
import { FormulaVisualProofAnimation } from './FormulaVisualProofAnimation';
import { KNOWN_FORMULA_REGISTRY } from '@/features/intelligence/board-feed-parser';
import { VisualizationRegistry, CanonicalRendererType } from '@/features/learning/VisualizationRegistry';
import { LearningPlanValidator } from '@/features/learning/LearningPlanValidator';
import { Heart3DViewer } from '@/components/3d/Heart3DViewer';
import { Universal3DViewer } from '@/components/3d/Universal3DViewer';
import { UniversalSimulationView } from '@/components/simulation/UniversalSimulationView';
import { IModel3dShape } from '@/components/canvas/Model3dShapeUtil';
import { ISimulationShape } from '@/components/canvas/SimulationShapeUtil';
import { BinarySearchEngine } from '@/features/learning/BinarySearchEngine';
import { DataStructureEngine } from '@/features/learning/DataStructureEngine';
import { PracticeEvaluationEngine } from '@/features/learning/PracticeEvaluationEngine';
import {
  LearningSessionPersistenceService,
  AutoSavePayload,
} from '@/features/learning/LearningSessionPersistence';
import { ConceptDependencyGraphEngine, TRUSTED_CONCEPT_REGISTRY } from '@/features/learning/ConceptDependencyGraph';
import { VisualAuthoringStudio } from '@/components/authoring/VisualAuthoringStudio';
import {
  GuidedLessonStep,
  BinarySearchState,
  DataStructureState,
  PracticeExerciseFeedback,
  SaveSessionStatus,
  SavedLearningSessionState,
  LearningPath,
  LearningPathStep,
  ConceptNode,
} from '@/features/learning/types';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  RefreshCw,
  CheckCircle,
  Award,
  History,
  Trash2,
  Clock,
  GitFork,
  GitCompare,
  Target,
  ChevronDown,
  ChevronUp,
  Upload,
  Users,
  FlaskConical,
  ShieldAlert,
} from 'lucide-react';
import { DocumentImportModal } from '@/components/documents/DocumentImportModal';
import { StudyGroupsModal } from '@/components/collaboration/StudyGroupsModal';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';
import { ExperimentLabView } from '@/components/experiment/ExperimentLabView';
import { ExperimentCatalogueService } from '@/features/experiment/ExperimentCatalogue';
import { ExperimentSessionState } from '@/features/experiment/ExperimentTypes';
import { CodeTracingView } from '@/components/code-tracing/CodeTracingView';
import { WhatIfScenarioView } from '@/components/what-if/WhatIfScenarioView';
import { LinearFunctionPlotterView } from '@/components/math/LinearFunctionPlotterView';
import { PythagoreanDissectionProofView } from '@/components/math/PythagoreanDissectionProofView';
import { FractionVisualizerView } from '@/components/math/FractionVisualizerView';
import { InteractiveTopicKnowledgeGraphView } from '@/components/learning/InteractiveTopicKnowledgeGraphView';
import { CanvasStampingEngine } from '@/features/canvas/CanvasStampingEngine';
import { VisualLearningDiagnosticsEngine } from '@/features/diagnostics/VisualLearningDiagnosticsEngine';
import { VisualLearningDiagnosticsPanel } from '@/components/diagnostics/VisualLearningDiagnosticsPanel';

interface UniversalLearningWorkspaceProps {
  editor: Editor | null;
  activeInput?: string;
  onSelectTopic?: (topic: string) => void;
}

type WorkspaceTab = 'understand' | 'derive' | 'visualize' | 'experiment' | 'master';

export const UniversalLearningWorkspace: React.FC<UniversalLearningWorkspaceProps> = ({
  editor,
  activeInput = '',
  onSelectTopic,
}) => {
  const [currentInput, setCurrentInput] = useState(activeInput);
  const [searchInput, setSearchInput] = useState('');
  const [plan, setPlan] = useState<LearningPlan>(() =>
    LearningPlanGenerator.generatePlan(activeInput || 'Binary Search')
  );
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('understand');
  const [experimentState, setExperimentState] = useState<InteractiveExperimentState>(
    plan.defaultExperimentState
  );
  const [aiStatus, setAiStatus] = useState<string>('Local Qwen 0.5B + Wikipedia Active');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Algorithm array tracer interactive state
  const [algoTarget, setAlgoTarget] = useState<number>(23);
  const [algoStep, setAlgoStep] = useState<number>(0);

  // Step 5: Binary Search Interactive State
  const [bsState, setBsState] = useState<BinarySearchState>(() =>
    BinarySearchEngine.createInitialState(BinarySearchEngine.DEFAULT_ARRAY, 23)
  );

  // Step 5: Data Structure Interactive State
  const [dsState, setDsState] = useState<DataStructureState>(() =>
    DataStructureEngine.createInitialState('stack')
  );

  // Step 3 (Milestone 22): Code-to-Visual Learning Engine Mode
  const [algoVisualMode, setAlgoVisualMode] = useState<'code_trace' | 'compact'>('code_trace');

  // Step 5: Guided Lesson Progression State (8-step flow)
  const [guidedStep, setGuidedStep] = useState<GuidedLessonStep>('concept_meaning');
  const [completedSteps, setCompletedSteps] = useState<GuidedLessonStep[]>(['concept_meaning']);
  const [isGuidedMode, setIsGuidedMode] = useState<boolean>(true);

  // Step 5: Practice & Formative Feedback State
  const [practiceFeedback, setPracticeFeedback] = useState<PracticeExerciseFeedback | null>(null);
  const [shortAnswerInput, setShortAnswerInput] = useState<string>('');
  const [shortAnswerFeedback, setShortAnswerFeedback] = useState<PracticeExerciseFeedback | null>(null);

  // Step 6: Session Persistence, Auto-Save & History State
  const [saveStatus, setSaveStatus] = useState<SaveSessionStatus>('saved');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [sessionHistory, setSessionHistory] = useState<SavedLearningSessionState[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Step 7: Adaptive Learning Path & Concept Dependencies State
  const [showPathPanel, setShowPathPanel] = useState<boolean>(true);
  const [activeGoalId, setActiveGoalId] = useState<string>('cs_binary_search');
  const [activePath, setActivePath] = useState<LearningPath | null>(null);
  const [skippedConcepts, setSkippedConcepts] = useState<string[]>([]);
  const [reviewedConcepts, setReviewedConcepts] = useState<string[]>([]);

  // Step 9: Visual Authoring Studio State
  const [showStudio, setShowStudio] = useState<boolean>(false);

  // Milestone 7: Visual Learning Diagnostics & Self-Repair Console State
  const [showDiagnostics, setShowDiagnostics] = useState<boolean>(false);

  // Step 11: Document Import Modal State
  const [showImportModal, setShowImportModal] = useState<boolean>(false);

  // Step 12: Collaborative Study Groups Modal State
  const [showGroupsModal, setShowGroupsModal] = useState<boolean>(false);

  // Subscribe to persistence status and load session history
  useEffect(() => {
    const unsubscribe = LearningSessionPersistenceService.subscribeStatus((status, err) => {
      setSaveStatus(status);
      setSaveError(err || null);
    });

    LearningSessionPersistenceService.listHistory().then((history) => {
      setSessionHistory(history);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Step 7: Load persisted goal progress on goal change
  useEffect(() => {
    ConceptDependencyGraphEngine.getGoalProgress(activeGoalId).then((prog) => {
      if (prog) {
        setSkippedConcepts(prog.skippedConceptIds || []);
        setReviewedConcepts(prog.reviewedConceptIds || []);
      } else {
        setSkippedConcepts([]);
        setReviewedConcepts([]);
      }
    });
  }, [activeGoalId]);

  // Step 7: Re-evaluate adaptive learning path whenever goal, session history, or skips change
  useEffect(() => {
    ConceptDependencyGraphEngine.generateLearningPath(activeGoalId, sessionHistory, {
      skippedIds: skippedConcepts,
      reviewedIds: reviewedConcepts,
    }).then((path) => {
      setActivePath(path);
    });
  }, [activeGoalId, sessionHistory, skippedConcepts, reviewedConcepts]);

  const handleSelectGoal = (goalId: string) => {
    setActiveGoalId(goalId);
  };

  const handleSkipConcept = (conceptId: string) => {
    const updated = Array.from(new Set([...skippedConcepts, conceptId]));
    setSkippedConcepts(updated);
    ConceptDependencyGraphEngine.saveGoalProgress(activeGoalId, {
      activeConceptId: activePath?.recommendedNextStep?.concept.id,
      skippedConceptIds: updated,
      reviewedConceptIds: reviewedConcepts,
    });
  };

  const handleStartPathStep = (step: LearningPathStep) => {
    applyTopic(step.concept.topicQuery);
    ConceptDependencyGraphEngine.saveGoalProgress(activeGoalId, {
      activeConceptId: step.concept.id,
      skippedConceptIds: skippedConcepts,
      reviewedConceptIds: reviewedConcepts,
    });
  };

  const handleReviewConcept = (step: LearningPathStep) => {
    const updated = Array.from(new Set([...reviewedConcepts, step.concept.id]));
    setReviewedConcepts(updated);
    ConceptDependencyGraphEngine.saveGoalProgress(activeGoalId, {
      activeConceptId: step.concept.id,
      skippedConceptIds: skippedConcepts,
      reviewedConceptIds: updated,
    });
    applyTopic(step.concept.reviewTopicQuery || step.concept.topicQuery);
  };

  const handleRestartGoal = () => {
    setSkippedConcepts([]);
    setReviewedConcepts([]);
    ConceptDependencyGraphEngine.clearGoalProgress(activeGoalId);
  };

  // Binary search automatic playback loop
  useEffect(() => {
    if (!bsState.isPlaying) return;
    const timer = setInterval(() => {
      setBsState((prev) => {
        if (prev.currentStepIndex >= prev.steps.length - 1) {
          return { ...prev, isPlaying: false, isComplete: true };
        }
        return BinarySearchEngine.stepForward(prev);
      });
    }, 1400);
    return () => clearInterval(timer);
  }, [bsState.isPlaying, bsState.steps.length]);

  // Quiz state
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [stampedSuccess, setStampedSuccess] = useState(false);
  const stampedCardShapeIdsRef = useRef<string[]>([]);
  const requestIdRef = useRef(0);

  // Step 8: Evidence-grounded mastery status evaluation
  const getTopicMasteryEvaluation = () => {
    const hasVisitedAllSteps = completedSteps.length >= 7;
    const hasAssessment = isAnswerSubmitted && practiceFeedback !== null;
    const score = practiceFeedback?.score ?? 0;
    const isAssessmentPassed = hasAssessment && practiceFeedback?.isCorrect && score >= 70;
    const isAssessmentFailed = hasAssessment && (!practiceFeedback?.isCorrect || score < 70);

    if (isAssessmentPassed) {
      return {
        status: 'mastered' as const,
        badgeLabel: '✓ Mastered',
        badgeClass: 'text-emerald-300 bg-emerald-950/70 border-emerald-500/40',
        message: `Verified understanding through practice assessment (Score: ${score}%). Core principles, derivations, and practice self-check mastered.`,
      };
    }

    if (isAssessmentFailed) {
      return {
        status: 'needs_practice' as const,
        badgeLabel: '⚠ Needs Practice',
        badgeClass: 'text-amber-300 bg-amber-950/70 border-amber-500/40',
        message: 'Practice assessment indicates misconceptions. Review the worked example and retry the practice quiz in Step 7 before advancing.',
      };
    }

    if (hasVisitedAllSteps) {
      return {
        status: 'assessment_pending' as const,
        badgeLabel: '⏳ Assessment Pending',
        badgeClass: 'text-cyan-300 bg-cyan-950/70 border-cyan-500/40',
        message: 'All lesson steps explored! Complete the Step 7 practice exercise to evaluate your understanding and unlock verified mastery.',
      };
    }

    return {
      status: 'in_progress' as const,
      badgeLabel: '📚 In Progress',
      badgeClass: 'text-indigo-300 bg-indigo-950/70 border-indigo-500/40',
      message: `Progress: ${completedSteps.length} of 8 steps visited. Complete remaining guided steps to build foundations.`,
    };
  };

  // Step 1 & 4: VisiOS Experiment Lab & What-If Scenario Engine state
  const [experimentViewMode, setExperimentViewMode] = useState<'whatif' | 'lab' | 'sliders'>('whatif');
  const [experimentLabState, setExperimentLabState] = useState<ExperimentSessionState | null>(null);

  // Step 6: Auto-Save Helper
  const triggerAutoSave = (immediate = false, custom?: Partial<AutoSavePayload>) => {
    const payload: AutoSavePayload = {
      topic: currentInput,
      domain: plan.subject,
      conceptId: plan.conceptId,
      guidedStep,
      completedSteps,
      activeTab,
      isGuidedMode,
      practiceFeedback: practiceFeedback
        ? {
            selectedIndex: selectedOption ?? 0,
            isCorrect: practiceFeedback.isCorrect,
            score: practiceFeedback.score,
            explanation: practiceFeedback.explanation,
            misconceptionAlert: practiceFeedback.misconceptionAlert,
          }
        : null,
      shortAnswerState: shortAnswerFeedback
        ? {
            rawInput: shortAnswerInput,
            isCorrect: shortAnswerFeedback.isCorrect,
            score: shortAnswerFeedback.score,
            explanation: shortAnswerFeedback.explanation,
            hint: shortAnswerFeedback.hint,
          }
        : null,
      simulationParameters: experimentState.parameters,
      activeRenderer: plan.visualizationPlan?.rendererType,
      experimentLabState: experimentLabState,
      ...custom,
    };

    if (immediate) {
      LearningSessionPersistenceService.saveImmediate(payload).then(() => {
        LearningSessionPersistenceService.listHistory().then(setSessionHistory);
      });
    } else {
      LearningSessionPersistenceService.debounceAutoSave(payload);
      setTimeout(() => {
        LearningSessionPersistenceService.listHistory().then(setSessionHistory);
      }, 700);
    }
  };

  // Unified topic processor with session resume and auto-save
  const applyTopic = async (topic: string) => {
    if (!topic || !topic.trim()) return;
    const currentRequestId = ++requestIdRef.current;
    setIsProcessing(true);

    let effectiveTopic = topic.trim();

    // Step 12: Resolve share token if input is a share token
    if (effectiveTopic.startsWith('share_')) {
      const shareRes = await LessonSharingService.resolveShareToken(effectiveTopic);
      if (shareRes.success && shareRes.data?.lesson) {
        effectiveTopic = shareRes.data.lesson.primaryTopic;
      } else {
        setErrorMessage(
          `Share Notice: ${shareRes.errorMessage || 'Unable to access shared lesson.'}`
        );
        setIsProcessing(false);
        return;
      }
    }

    setCurrentInput(effectiveTopic);

    try {
      const orchestrated = await LearningOrchestrator.processTopic(effectiveTopic);
      // Discard stale responses if a newer request was dispatched
      if (requestIdRef.current !== currentRequestId) return;

      const validation = LearningPlanValidator.validateSchema(orchestrated.plan);
      if (!validation.isValid) {
        setErrorMessage(
          `Validation Notice: Plan schema verification failed (${validation.errors[0]?.message || 'Invalid format'}). Previous workspace content preserved.`
        );
        return;
      }

      setPlan(orchestrated.plan);
      setErrorMessage(null);
      setShowHint(false);
      setAlgoStep(0);

      // Milestone 7: Real-time learning route verification & diagnostics logging
      VisualLearningDiagnosticsEngine.verifyLearningRoute(
        effectiveTopic,
        orchestrated.plan,
        orchestrated.classification
      );

      // Step 7: Intelligently align active curriculum goal with topic
      const lowerTopic = effectiveTopic.toLowerCase();
      if (
        lowerTopic.includes('python') ||
        lowerTopic.includes('program') ||
        lowerTopic.includes('variable')
      ) {
        setActiveGoalId('cs_variables_types');
      } else if (
        lowerTopic.includes('binary search') ||
        lowerTopic.includes('bsearch') ||
        lowerTopic.includes('linear search')
      ) {
        setActiveGoalId('cs_binary_search');
      } else if (
        lowerTopic.includes('data structure') ||
        lowerTopic.includes('stack') ||
        lowerTopic.includes('queue') ||
        lowerTopic.includes('linked list') ||
        lowerTopic.includes('tree')
      ) {
        setActiveGoalId('cs_stacks_queues');
      } else if (
        lowerTopic.includes('big-o') ||
        lowerTopic.includes('complexity') ||
        lowerTopic.includes('asymptotic')
      ) {
        setActiveGoalId('cs_time_complexity');
      } else if (
        lowerTopic.includes('f = ma') ||
        lowerTopic.includes('f=ma') ||
        lowerTopic.includes('newton') ||
        lowerTopic.includes('force')
      ) {
        setActiveGoalId('phys_newton_laws');
      } else if (
        lowerTopic.includes('v = u + at') ||
        lowerTopic.includes('v=u+at') ||
        lowerTopic.includes('kinematic')
      ) {
        setActiveGoalId('phys_kinematics_velocity');
      } else if (
        lowerTopic.includes('y = mx + c') ||
        lowerTopic.includes('y=mx+c') ||
        lowerTopic.includes('linear function') ||
        lowerTopic.includes('slope intercept') ||
        lowerTopic.includes('y = 2x + 3') ||
        lowerTopic.includes('y=2x+3')
      ) {
        setActiveGoalId('math_linear_functions');
      } else if (
        lowerTopic.includes('quadratic') ||
        lowerTopic.includes('ax^2+bx+c')
      ) {
        setActiveGoalId('math_quadratic_formula');
      } else if (
        lowerTopic.includes('pythagor') ||
        lowerTopic.includes('a^2 + b^2 = c^2') ||
        lowerTopic.includes('a^2+b^2=c^2')
      ) {
        setActiveGoalId('math_pythagoras');
      } else if (
        lowerTopic.includes('fraction') ||
        lowerTopic.includes('fractions')
      ) {
      } else if (
        lowerTopic.includes('cos') && !lowerTopic.includes('e^')
      ) {
        setActiveGoalId('math_cosine_function');
      } else if (
        lowerTopic.includes('e^(cos') || lowerTopic.includes('e^cos')
      ) {
        setActiveGoalId('math_exp_cos_curve');
      } else if (
        lowerTopic.includes('e^x') || lowerTopic.includes('exponential')
      ) {
        setActiveGoalId('math_exponential_function');
      } else if (
        lowerTopic.includes('sin') ||
        lowerTopic.includes('tan') ||
        lowerTopic.includes('curve') ||
        lowerTopic.includes('graph')
      ) {
        setActiveGoalId('math_trig_functions');
      } else if (orchestrated.plan.conceptId && TRUSTED_CONCEPT_REGISTRY[orchestrated.plan.conceptId]) {
        setActiveGoalId(orchestrated.plan.conceptId);
      }

      // Step 6: Check for saved session to resume
      const savedSession = await LearningSessionPersistenceService.restoreSession(topic);
      // Discard stale responses if a newer request was dispatched while restoring
      if (requestIdRef.current !== currentRequestId) return;
      if (savedSession) {
        if (savedSession.currentLessonStep) {
          setGuidedStep(savedSession.currentLessonStep);
        }
        if (savedSession.completedSteps && savedSession.completedSteps.length > 0) {
          setCompletedSteps(savedSession.completedSteps);
        } else {
          setCompletedSteps([savedSession.currentLessonStep || 'concept_meaning']);
        }
        if (savedSession.activeTab) {
          setActiveTab(savedSession.activeTab as WorkspaceTab);
        }
        if (typeof savedSession.isGuidedMode === 'boolean') {
          setIsGuidedMode(savedSession.isGuidedMode);
        }

        // Restore practice attempts
        if (savedSession.practiceAttempts?.multipleChoice) {
          const mc = savedSession.practiceAttempts.multipleChoice;
          setSelectedOption(mc.selectedIndex);
          setIsAnswerSubmitted(true);
          setPracticeFeedback({
            isCorrect: mc.isCorrect,
            score: mc.score,
            explanation: mc.explanation || '',
            misconceptionAlert: mc.misconceptionAlert,
            retryAllowed: true,
          });
        } else {
          setSelectedOption(null);
          setIsAnswerSubmitted(false);
          setPracticeFeedback(null);
        }

        if (savedSession.practiceAttempts?.shortAnswer) {
          const sa = savedSession.practiceAttempts.shortAnswer;
          setShortAnswerInput(sa.rawInput);
          setShortAnswerFeedback({
            isCorrect: sa.isCorrect,
            score: sa.score,
            explanation: sa.explanation || '',
            hint: sa.hint,
            retryAllowed: true,
          });
        } else {
          setShortAnswerInput('');
          setShortAnswerFeedback(null);
        }

        // Restore simulation parameters
        if (savedSession.simulationState?.parameters) {
          let restoredState = orchestrated.plan.defaultExperimentState;
          for (const [k, v] of Object.entries(savedSession.simulationState.parameters)) {
            restoredState = InteractiveExplorationEngine.updateParameter(
              orchestrated.plan,
              restoredState,
              k,
              v
            );
          }
          setExperimentState(restoredState);
        } else {
          setExperimentState(orchestrated.plan.defaultExperimentState);
        }

        // Restore experiment lab state
        if (savedSession.experimentLabState) {
          setExperimentLabState(savedSession.experimentLabState);
        } else {
          setExperimentLabState(null);
        }
      } else {
        // Fresh session defaults
        setExperimentState(orchestrated.plan.defaultExperimentState);
        setExperimentLabState(null);
        setSelectedOption(null);
        setIsAnswerSubmitted(false);
        setPracticeFeedback(null);
        setShortAnswerFeedback(null);
        setShortAnswerInput('');
        setGuidedStep('concept_meaning');
        setCompletedSteps(['concept_meaning']);

        // Auto-save initial baseline session
        LearningSessionPersistenceService.saveImmediate({
          topic,
          domain: orchestrated.plan.subject,
          conceptId: orchestrated.plan.conceptId,
          guidedStep: 'concept_meaning',
          completedSteps: ['concept_meaning'],
          activeTab: 'understand',
          isGuidedMode: true,
          simulationParameters: orchestrated.plan.defaultExperimentState.parameters,
          activeRenderer: orchestrated.plan.visualizationPlan?.rendererType,
          experimentLabState: null,
        }).then(() => {
          LearningSessionPersistenceService.listHistory().then(setSessionHistory);
        });
      }

      if (lowerTopic.includes('binary search')) {
        setBsState(BinarySearchEngine.createInitialState(BinarySearchEngine.DEFAULT_ARRAY, 23));
      }
      if (lowerTopic.includes('data structure') || lowerTopic.includes('stack') || lowerTopic.includes('queue')) {
        setDsState(DataStructureEngine.createInitialState('stack'));
      }

      if (onSelectTopic) onSelectTopic(topic);
    } catch (e: any) {
      console.warn('LearningOrchestrator failed to process topic:', e);
      setErrorMessage(
        `Processing notice: Unable to generate learning plan for "${topic}". Your previous workspace content has been preserved.`
      );
    } finally {
      if (requestIdRef.current === currentRequestId) {
        setIsProcessing(false);
      }
    }
  };

  // Sync when activeInput changes
  useEffect(() => {
    if (activeInput && activeInput.trim() && activeInput !== currentInput) {
      applyTopic(activeInput.trim());
    }
  }, [activeInput]);

  // Check AI health on mount & initial orchestration
  useEffect(() => {
    AIModelAdapter.checkConnection().then((status) => {
      if (status.isConnected) {
        setAiStatus(`Local Ollama (${status.model}) + Wikipedia`);
      } else {
        setAiStatus('Deterministic STEM Engine Active');
      }
    });

    if (activeInput && activeInput.trim()) {
      applyTopic(activeInput.trim());
    }
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim() || isProcessing) return;
    const cleanSearch = searchInput.trim();
    setSearchInput('');
    applyTopic(cleanSearch);
  };

  const handleQuickTopic = (topic: string) => {
    if (isProcessing) return;
    applyTopic(topic);
  };

  const handleParamChange = (paramId: string, val: number) => {
    if (typeof val !== 'number' || isNaN(val) || !isFinite(val)) {
      return;
    }
    const paramDef = plan.interactiveParameters.find((p) => p.id === paramId);
    if (!paramDef) return;

    // Strict numerical boundary clamping
    const clampedVal = Math.min(Math.max(val, paramDef.min), paramDef.max);

    const updated = InteractiveExplorationEngine.updateParameter(
      plan,
      experimentState,
      paramId,
      clampedVal
    );
    setExperimentState(updated);
    triggerAutoSave(false, { simulationParameters: updated.parameters });
  };

  const handleOptionSelect = (index: number) => {
    if (practiceFeedback) return;
    setSelectedOption(index);
    setIsAnswerSubmitted(true);
    const q = plan.practiceQuestions[0];
    if (q) {
      const fb = PracticeEvaluationEngine.evaluateMultipleChoice(q, index);
      setPracticeFeedback(fb);
      triggerAutoSave(true, {
        practiceFeedback: {
          selectedIndex: index,
          isCorrect: fb.isCorrect,
          score: fb.score,
          explanation: fb.explanation,
          misconceptionAlert: fb.misconceptionAlert,
        },
      });
    }
  };

  const handleShortAnswerSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!shortAnswerInput.trim()) return;
    const saQuestion = PracticeEvaluationEngine.getDefaultShortAnswerQuestion(plan);
    const fb = PracticeEvaluationEngine.evaluateShortAnswer(saQuestion, shortAnswerInput);
    setShortAnswerFeedback(fb);
    triggerAutoSave(true, {
      shortAnswerState: {
        rawInput: shortAnswerInput,
        isCorrect: fb.isCorrect,
        score: fb.score,
        explanation: fb.explanation,
        hint: fb.hint,
      },
    });
  };

  const handleGuidedNext = () => {
    const stepsOrder: GuidedLessonStep[] = [
      'concept_meaning',
      'why_it_matters',
      'prerequisites',
      'step_by_step',
      'worked_example',
      'interactive_exploration',
      'practice_exercise',
      'recap',
    ];
    const idx = stepsOrder.indexOf(guidedStep);
    if (idx < stepsOrder.length - 1) {
      const nextStep = stepsOrder[idx + 1];
      const newCompleted = Array.from(new Set([...completedSteps, nextStep]));
      setGuidedStep(nextStep);
      setCompletedSteps(newCompleted);
      triggerAutoSave(true, { guidedStep: nextStep, completedSteps: newCompleted });
    }
  };

  const handleGuidedPrev = () => {
    const stepsOrder: GuidedLessonStep[] = [
      'concept_meaning',
      'why_it_matters',
      'prerequisites',
      'step_by_step',
      'worked_example',
      'interactive_exploration',
      'practice_exercise',
      'recap',
    ];
    const idx = stepsOrder.indexOf(guidedStep);
    if (idx > 0) {
      const prevStep = stepsOrder[idx - 1];
      setGuidedStep(prevStep);
      triggerAutoSave(false, { guidedStep: prevStep });
    }
  };

  const handleSelectGuidedStep = (step: GuidedLessonStep) => {
    const newCompleted = Array.from(new Set([...completedSteps, step]));
    setGuidedStep(step);
    setCompletedSteps(newCompleted);
    triggerAutoSave(false, { guidedStep: step, completedSteps: newCompleted });
  };

  const handleTabClick = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    triggerAutoSave(false, { activeTab: tab });
  };

  const handleToggleMode = (guided: boolean) => {
    setIsGuidedMode(guided);
    triggerAutoSave(false, { isGuidedMode: guided });
  };

  const handleBsTargetSelect = (target: number, customArray?: number[]) => {
    const arr = customArray !== undefined ? customArray : (bsState.array.length === 0 ? BinarySearchEngine.DEFAULT_ARRAY : bsState.array);
    setBsState(BinarySearchEngine.createInitialState(arr, target));
  };

  // Safe KaTeX rendering
  const renderFormulaLatex = (latex: string) => {
    try {
      return {
        __html: katex.renderToString(latex, { throwOnError: false, displayMode: true }),
      };
    } catch (e) {
      return { __html: latex };
    }
  };

  // Stamp full learning suite onto whiteboard canvas with readable cards and live geometry
  const handleStampToCanvas = () => {
    if (!editor) return;
    try {
      const createdIds = CanvasStampingEngine.stampLearningSuite(editor, plan, {
        replacePrevious: true,
        previousShapeIds: stampedCardShapeIdsRef.current,
        highlightSelection: true,
      });

      stampedCardShapeIdsRef.current = createdIds.map((id) => String(id));
      setStampedSuccess(true);
      setTimeout(() => setStampedSuccess(false), 2500);
    } catch (e) {
      console.error('Failed to stamp learning suite on canvas', e);
    }
  };

  return (
    <div className="flex flex-col h-full space-y-3.5 text-slate-100">
      {/* 1. Universal Search / Topic Input */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          type="text"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Enter ANY topic (e.g. F=ma, v=u+at, y=sin(x), (a-b)²)..."
          className="w-full bg-slate-950/80 border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400 pr-16"
        />
        <button
          type="submit"
          disabled={!searchInput.trim()}
          className="absolute right-1 top-1 bottom-1 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-[10px] font-bold transition-colors"
        >
          Explore
        </button>
      </form>

      {/* Whiteboard Synchronization Status Indicator */}
      {(() => {
        if (!editor) return null;
        const allPageShapes = editor.getCurrentPageShapes();
        const stampedCard = allPageShapes.find((s) => s.type === 'learning-card');
        if (!stampedCard) return null;
        const boardCardTitle = ((stampedCard.props as any).title as string)?.replace(/^[✨📐👁️🧪🧠\s]+/, '').trim();
        const activeLessonTitle = plan.title.replace(/^[✨📐👁️🧪🧠\s]+/, '').trim();
        const cleanA = boardCardTitle?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanB = activeLessonTitle?.toLowerCase().replace(/[^a-z0-9]/g, '');
        const isMatch = cleanA && cleanB && (cleanA.includes(cleanB.slice(0, 8)) || cleanB.includes(cleanA.slice(0, 8)));
        if (isMatch) return null;

        return (
          <div className="p-2 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-[11px] text-indigo-200 flex items-center justify-between gap-2 shadow-sm">
            <div className="flex items-center gap-1.5 truncate">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="truncate">Board shows: <strong>"{boardCardTitle}"</strong></span>
            </div>
            <button
              onClick={handleStampToCanvas}
              className="px-2 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] shrink-0 transition-colors shadow-sm"
              title="Update whiteboard cards to match active lesson"
            >
              Sync to Board
            </button>
          </div>
        );
      })()}

      {/* Validation / Processing Error Notice */}
      {errorMessage && (
        <div className="p-2.5 rounded-xl bg-amber-950/80 border border-amber-600/50 text-amber-200 text-xs flex items-center justify-between gap-2 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="leading-snug">{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-amber-400 hover:text-amber-200 p-0.5 rounded"
            title="Dismiss notice"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 2. Quick Subject Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[10px] no-scrollbar">
        <span className="text-slate-500 shrink-0 font-medium">Quick STEM:</span>
        {['F = ma', 'v = u + at', 'y = sin(x)', 'a^2+b^2=c^2', 'a^2+b^2-2ab=', 'Binary Search'].map(
          (t, i) => (
            <button
              key={i}
              onClick={() => handleQuickTopic(t)}
              className={`shrink-0 px-2 py-0.5 rounded-md border font-mono transition-colors ${
                currentInput.toLowerCase().includes(t.toLowerCase().replace(/[=]/g, '').slice(0, 4))
                  ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          )
        )}
      </div>

      {/* 3. Header Title & AI Status */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
              {plan.subject}
            </span>
            {plan.capabilityLevel && (
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-medium ${
                  plan.capabilityLevel === 'verified_and_tested'
                    ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                    : 'bg-amber-950/60 border border-amber-500/30 text-amber-300'
                }`}
                title={plan.disclosures?.join(' ') || 'Domain capability classification'}
              >
                {plan.capabilityLevel === 'verified_and_tested' ? 'Verified' : 'Partial'}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold text-white line-clamp-1">{plan.title}</h3>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {plan.classification && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono font-bold">
              Engine: {plan.classification.engine}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-mono">
            <Cpu className="w-3 h-3 text-emerald-400" />
            <span>{aiStatus}</span>
          </div>

          {/* Step 6: Save Status Indicator */}
          <div
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border font-mono transition-colors ${
              saveStatus === 'saving'
                ? 'bg-amber-950/60 border-amber-500/40 text-amber-300 animate-pulse'
                : saveStatus === 'error'
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300'
            }`}
            title={saveError ? `Save Notice: ${saveError}` : 'Auto-saved to local browser storage'}
          >
            {saveStatus === 'saving' && <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />}
            {saveStatus === 'saved' && <CheckCircle className="w-3 h-3 text-emerald-400" />}
            {saveStatus === 'error' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
            <span>
              {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'error' ? 'Save Failed' : 'Saved'}
            </span>
          </div>

          {/* Step 6: History Button */}
          <button
            onClick={() => {
              LearningSessionPersistenceService.listHistory().then(setSessionHistory);
              setShowHistoryModal(true);
            }}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white transition-colors"
            title="View learning history and resume previous sessions"
          >
            <History className="w-3 h-3 text-cyan-400" />
            <span>History</span>
            {sessionHistory.length > 0 && (
              <span className="ml-0.5 px-1 rounded-full bg-cyan-950 text-cyan-300 text-[9px] font-bold">
                {sessionHistory.length}
              </span>
            )}
          </button>

          {/* Step 7: Adaptive Learning Path Toggle Button */}
          <button
            onClick={() => setShowPathPanel(!showPathPanel)}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
              showPathPanel
                ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm'
                : 'bg-slate-900 border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white'
            }`}
            title="Toggle adaptive learning path and prerequisite recommendations"
          >
            <GitFork className="w-3 h-3 text-indigo-400" />
            <span>Path</span>
            {activePath && (
              <span className="ml-0.5 px-1 rounded-full bg-indigo-950 text-indigo-300 text-[9px] font-bold">
                {activePath.completedSteps}/{activePath.totalSteps}
              </span>
            )}
          </button>

          {/* Step 9: Visual Authoring Studio Button */}
          <button
            onClick={() => setShowStudio(true)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-purple-500 text-slate-300 hover:text-white transition-colors"
            title="Open Visual Authoring Studio to create, edit, and publish reusable lessons"
          >
            <Layers className="w-3 h-3 text-purple-400" />
            <span>Studio</span>
          </button>

          {/* Step 11: Document Import Modal Button */}
          <button
            onClick={() => setShowImportModal(true)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-emerald-500 text-slate-300 hover:text-white transition-colors"
            title="Import PDF, lecture notes, or study materials to generate grounded lessons"
          >
            <Upload className="w-3 h-3 text-emerald-400" />
            <span>Import</span>
          </button>

          {/* Step 12: Collaborative Study Groups Button */}
          <button
            onClick={() => setShowGroupsModal(true)}
            className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 hover:border-indigo-500 text-slate-300 hover:text-white transition-colors"
            title="Open Collaborative Study Groups"
          >
            <Users className="w-3 h-3 text-indigo-400" />
            <span>Groups</span>
          </button>

          {/* Milestone 7: Diagnostics & Self-Repair Console Button */}
          <button
            onClick={() => setShowDiagnostics((prev) => !prev)}
            className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded border transition-colors ${
              showDiagnostics
                ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                : 'bg-slate-900 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-white'
            }`}
            title="Open AI Visual Learning Diagnostics & Self-Repair Console"
          >
            <ShieldAlert className="w-3 h-3 text-cyan-400" />
            <span>Diagnostics</span>
          </button>
        </div>
      </div>

      {/* Milestone 7: Opt-in Visual Learning Diagnostics & Self-Repair Console */}
      {showDiagnostics && (
        <VisualLearningDiagnosticsPanel
          currentTopic={currentInput || plan.title}
          onClose={() => setShowDiagnostics(false)}
        />
      )}

      {/* 3B. External Knowledge Sources Section */}
      {plan.sourceAttribution && (
        <div className="p-2.5 rounded-xl bg-blue-950/40 border border-blue-500/40 text-blue-200 text-xs space-y-2">
          <div className="flex items-center justify-between gap-1.5 border-b border-blue-800/40 pb-1.5">
            <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
              <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <span>Source: {plan.sourceAttribution.source}</span>
            </div>
            {plan.sourceAttribution.url && (
              <a
                href={plan.sourceAttribution.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-semibold underline text-[10px]"
              >
                <span>Read on Wikipedia</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <div className="flex gap-2.5 items-start">
            {plan.sourceAttribution.thumbnail && (
              <img
                src={plan.sourceAttribution.thumbnail}
                alt={plan.sourceAttribution.title || plan.title}
                className="w-12 h-14 object-cover rounded-lg border border-blue-500/30 shrink-0 bg-slate-900"
              />
            )}
            <div className="flex-1 space-y-1">
              <h4 className="text-[11px] font-bold text-white line-clamp-1">
                {plan.sourceAttribution.title || plan.title}
              </h4>
              <p className="text-[10px] text-blue-200/80 line-clamp-2 leading-relaxed">
                {plan.sourceAttribution.extract || plan.overview}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 3C. Honest Ambiguity / Uncertainty Alert */}
      {plan.uncertaintyState?.isUncertain && (
        <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs space-y-2">
          <div className="flex items-center gap-1.5 font-bold text-amber-400">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Clarification Needed</span>
          </div>
          <p className="text-[11px] text-amber-300/90 leading-relaxed">
            {plan.uncertaintyState.reason || 'This expression is ambiguous or undefined in standard curriculum.'}
          </p>
          {plan.uncertaintyState.suggestedClarifications &&
            plan.uncertaintyState.suggestedClarifications.length > 0 && (
              <div className="space-y-1 pt-1">
                <span className="text-[10px] uppercase font-bold text-amber-400/80">
                  Select Interpretation:
                </span>
                <div className="flex flex-col gap-1">
                  {plan.uncertaintyState.suggestedClarifications.map((label, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleQuickTopic(label)}
                      className="text-left px-2 py-1 rounded bg-amber-900/40 hover:bg-amber-800/60 border border-amber-600/40 text-[11px] text-amber-100 transition-colors"
                    >
                      • {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
        </div>
      )}

      {/* Step 7: Compact Adaptive Learning Path & Concept Dependencies Panel */}
      {activePath && showPathPanel && (
        <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900 to-slate-950 border border-indigo-500/30 text-xs space-y-2.5 shadow-xl">
          {/* Header & Goal Selector */}
          <div className="flex items-center justify-between gap-2 border-b border-indigo-900/40 pb-2">
            <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-xs">
              <GitFork className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Learning Path:</span>
              <span className="text-white font-semibold truncate">{activePath.goalTitle}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[10px] font-mono text-cyan-300 px-1.5 py-0.5 rounded bg-indigo-950/80 border border-indigo-500/30">
                {activePath.completedSteps}/{activePath.totalSteps} Completed
              </span>
              <button
                onClick={() => setShowPathPanel(false)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded"
                title="Minimize learning path"
              >
                <ChevronUp className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Learning Goals Switcher */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[9px] no-scrollbar">
            <span className="text-slate-500 shrink-0 font-medium">Curriculum Goals:</span>
            {[
              { id: 'cs_variables_types', label: 'Programming & Memory' },
              { id: 'cs_binary_search', label: 'Binary Search' },
              { id: 'cs_stacks_queues', label: 'Data Structures' },
              { id: 'math_linear_functions', label: 'Linear Functions' },
              { id: 'math_pythagoras', label: 'Pythagoras' },
              { id: 'math_fractions', label: 'Fractions' },
              { id: 'phys_newton_laws', label: 'F = ma' },
              { id: 'math_quadratic_formula', label: 'Quadratic Formula' },
            ].map((g) => (
              <button
                key={g.id}
                onClick={() => handleSelectGoal(g.id)}
                className={`px-2 py-0.5 rounded-md border font-medium transition-all shrink-0 ${
                  activeGoalId === g.id
                    ? 'bg-indigo-600 border-indigo-400 text-white font-bold'
                    : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>

          {/* Ordered Concept Chain (Horizontal Breadcrumb Sequence) */}
          <div className="flex items-center gap-1 overflow-x-auto py-1 no-scrollbar">
            {activePath.orderedSteps.map((step, idx) => {
              const isRec = step.isRecommendedNext;
              const isTarget = step.isTargetGoal;
              const isCurrent = step.concept.topicQuery.toLowerCase() === currentInput.toLowerCase();
              const state = step.mastery.state;

              return (
                <React.Fragment key={step.concept.id}>
                  {idx > 0 && <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />}
                  <button
                    onClick={() => handleStartPathStep(step)}
                    className={`shrink-0 p-1.5 rounded-lg border text-left transition-all max-w-[130px] flex flex-col gap-0.5 ${
                      isCurrent
                        ? 'bg-cyan-950/80 border-cyan-400 ring-1 ring-cyan-400/50'
                        : isRec
                        ? 'bg-indigo-950/90 border-indigo-400 shadow-sm shadow-indigo-500/20'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                    title={step.recommendationReason || step.concept.title}
                  >
                    <div className="flex items-center justify-between gap-1 w-full">
                      <span className="text-[9px] text-slate-400 font-mono">#{step.stepNumber}</span>
                      {state === 'completed' && <CheckCircle className="w-2.5 h-2.5 text-emerald-400" />}
                      {state === 'demonstrated_understanding' && <Check className="w-2.5 h-2.5 text-cyan-400" />}
                      {state === 'needs_review' && <AlertTriangle className="w-2.5 h-2.5 text-amber-400" />}
                      {state === 'in_progress' && <Clock className="w-2.5 h-2.5 text-blue-400" />}
                      {state === 'not_started' && <span className="w-1.5 h-1.5 rounded-full bg-slate-600" />}
                    </div>
                    <span className="text-[10px] font-bold text-white truncate w-full">
                      {isTarget ? `🎯 ${step.concept.title}` : step.concept.title}
                    </span>
                    <span className={`text-[8px] font-medium truncate ${
                      state === 'completed'
                        ? 'text-emerald-400'
                        : state === 'demonstrated_understanding'
                        ? 'text-cyan-400'
                        : state === 'needs_review'
                        ? 'text-amber-400 font-bold'
                        : state === 'in_progress'
                        ? 'text-blue-400'
                        : 'text-slate-500'
                    }`}>
                      {state === 'completed' && 'Mastered'}
                      {state === 'demonstrated_understanding' && 'Demonstrated'}
                      {state === 'needs_review' && 'Needs Review'}
                      {state === 'in_progress' && 'In Progress'}
                      {state === 'not_started' && 'Not Started'}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Current Evidence-Grounded Recommendation Callout */}
          {activePath.recommendedNextStep && (
            <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/40 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="text-[11px] font-bold text-indigo-200">
                    Recommended Next Step: {activePath.recommendedNextStep.concept.title}
                  </span>
                </div>
                <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-indigo-900/60 text-indigo-300 font-semibold border border-indigo-700/40">
                  {activePath.recommendedNextStep.concept.difficulty}
                </span>
              </div>

              <p className="text-[10px] text-slate-300 leading-relaxed">
                {activePath.recommendedNextStep.recommendationReason}
              </p>

              {activePath.recommendedNextStep.mastery.evidenceSummary && (
                <div className="text-[9px] text-slate-400 font-mono flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Evidence: {activePath.recommendedNextStep.mastery.evidenceSummary}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-1.5 pt-1">
                <button
                  onClick={() => handleStartPathStep(activePath.recommendedNextStep!)}
                  className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] flex items-center gap-1 transition-all shadow-sm"
                >
                  <span>{activePath.recommendedNextStep.mastery.state === 'needs_review' ? 'Review Concept' : 'Continue Step'}</span>
                  <ArrowRight className="w-3 h-3" />
                </button>

                {activePath.recommendedNextStep.canReview && (
                  <button
                    onClick={() => handleReviewConcept(activePath.recommendedNextStep!)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-600/30 text-[10px] font-semibold transition-colors"
                  >
                    Simpler Review
                  </button>
                )}

                {activePath.recommendedNextStep.canSkip && (
                  <button
                    onClick={() => handleSkipConcept(activePath.recommendedNextStep!.concept.id)}
                    className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800 text-[10px] transition-colors"
                    title="Skip this prerequisite if you already know it"
                  >
                    Skip Prerequisite
                  </button>
                )}

                <button
                  onClick={handleRestartGoal}
                  className="ml-auto px-1.5 py-1 text-[9px] text-slate-500 hover:text-slate-300 hover:underline flex items-center gap-0.5"
                  title="Reset progress on this goal"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Reset Goal</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Collapsed Learning Path Banner */}
      {activePath && !showPathPanel && (
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-indigo-950/40 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2">
            <GitFork className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-[11px] text-indigo-200 font-semibold truncate">
              Goal: {activePath.goalTitle}
            </span>
            <span className="text-[10px] text-cyan-300 font-mono">
              ({activePath.completedSteps}/{activePath.totalSteps} steps)
            </span>
          </div>
          <button
            onClick={() => setShowPathPanel(true)}
            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-0.5"
          >
            <span>Show Path</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* 3D. Loading Indicator */}
      {isProcessing && (
        <div className="flex items-center justify-center gap-2 py-1.5 px-2 rounded-lg bg-cyan-950/40 border border-cyan-500/30 text-cyan-300 text-[11px] animate-pulse">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Synthesizing with Local Ollama & Wikimedia...</span>
        </div>
      )}

      {/* 4. Action: Stamp Learning Suite on Canvas */}
      <button
        onClick={handleStampToCanvas}
        className={`w-full py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center space-x-2 shadow-lg transition-all active:scale-95 ${
          stampedSuccess
            ? 'bg-emerald-600 text-white shadow-emerald-950/40'
            : 'bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white shadow-cyan-900/30'
        }`}
      >
        {stampedSuccess ? (
          <>
            <Check className="w-4 h-4 text-emerald-200" />
            <span>Stamped Complete Learning Suite on Canvas!</span>
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            <span>Stamp Learning Suite onto Whiteboard</span>
          </>
        )}
      </button>

      {/* 5. Navigation Mode Selector: Guided 8-Step Path vs 5 Pillars Tabs */}
      <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800 text-[11px]">
        <button
          onClick={() => handleToggleMode(true)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            isGuidedMode
              ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>8-Step Guided Path</span>
        </button>
        <button
          onClick={() => handleToggleMode(false)}
          className={`flex-1 py-1.5 px-2 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
            !isGuidedMode
              ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>5 Pillars Tabs</span>
        </button>
      </div>

      {/* Guided 8-Step Navigation Bar */}
      {isGuidedMode && (
        <div className="p-2.5 rounded-xl bg-slate-950/80 border border-indigo-500/30 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold">
              <Award className="w-3.5 h-3.5 text-cyan-400" />
              <span>Step {
                (['concept_meaning', 'why_it_matters', 'prerequisites', 'step_by_step', 'worked_example', 'interactive_exploration', 'practice_exercise', 'recap'] as GuidedLessonStep[]).indexOf(guidedStep) + 1
              } of 8:</span>
              <span className="text-white font-bold">
                {guidedStep === 'concept_meaning' && '1. What It Means'}
                {guidedStep === 'why_it_matters' && '2. Why It Matters'}
                {guidedStep === 'prerequisites' && '3. Prerequisites'}
                {guidedStep === 'step_by_step' && '4. Step-by-Step Explanation'}
                {guidedStep === 'worked_example' && '5. Worked Example'}
                {guidedStep === 'interactive_exploration' && '6. Interactive Lab'}
                {guidedStep === 'practice_exercise' && '7. Practice & Quiz'}
                {guidedStep === 'recap' && '8. Concise Recap'}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleGuidedPrev}
                disabled={guidedStep === 'concept_meaning'}
                className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 hover:text-white disabled:opacity-30"
              >
                ◀ Prev
              </button>
              <button
                onClick={handleGuidedNext}
                disabled={guidedStep === 'recap'}
                className="px-2 py-0.5 rounded bg-cyan-700 border border-cyan-600 text-[10px] text-white font-bold hover:bg-cyan-600 disabled:opacity-30"
              >
                Next ▶
              </button>
            </div>
          </div>

          {/* 8 Step Pills */}
          <div className="grid grid-cols-4 gap-1 text-[9px] font-medium">
            {(
              [
                { step: 'concept_meaning', label: '1. Meaning' },
                { step: 'why_it_matters', label: '2. Why' },
                { step: 'prerequisites', label: '3. Prereq' },
                { step: 'step_by_step', label: '4. Steps' },
                { step: 'worked_example', label: '5. Example' },
                { step: 'interactive_exploration', label: '6. Lab' },
                { step: 'practice_exercise', label: '7. Quiz' },
                { step: 'recap', label: '8. Recap' },
              ] as { step: GuidedLessonStep; label: string }[]
            ).map((item) => {
              const isActive = guidedStep === item.step;
              const isCompleted = completedSteps.includes(item.step);
              return (
                <button
                  key={item.step}
                  onClick={() => handleSelectGuidedStep(item.step)}
                  className={`py-1 px-1 rounded-md text-center transition-all truncate flex items-center justify-center gap-1 ${
                    isActive
                      ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-200 font-bold shadow-sm'
                      : isCompleted
                      ? 'bg-slate-900/80 border border-emerald-500/30 text-emerald-300 hover:bg-slate-800'
                      : 'bg-slate-900/60 border border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  {isCompleted && !isActive && <Check className="w-2.5 h-2.5 text-emerald-400 shrink-0" />}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 5-Pillar Tab Navigation (shown when not in guided mode) */}
      {!isGuidedMode && (
        <div className="grid grid-cols-5 gap-1 p-1 rounded-xl bg-slate-900/90 border border-slate-800 text-[10px]">
          {(['understand', 'derive', 'visualize', 'experiment', 'master'] as WorkspaceTab[]).map(
            (tab) => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`py-1.5 px-0.5 rounded-lg font-medium text-center capitalize transition-colors ${
                  activeTab === tab
                    ? 'bg-cyan-600 text-white font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab === 'understand'
                  ? '1. Learn'
                  : tab === 'derive'
                  ? plan.category === 'concept'
                    ? '2. Steps'
                    : '2. Derive'
                  : tab === 'visualize'
                  ? '3. Visual'
                  : tab === 'experiment'
                  ? '4. Exper.'
                  : '5. Master'}
              </button>
            )
          )}
        </div>
      )}

      {/* Active Content: Guided 8 Steps or 5 Pillars Tabs */}
      <div className="space-y-3">
        {/* ========================================================================= */}
        {/* 1. VISUALIZER & INTERACTIVE LAB RENDERER                                  */}
        {/* ========================================================================= */}
        {(() => {
          const canonicalRenderer = VisualizationRegistry.resolveRendererType(
            plan.visualizationPlan?.rendererType
          );
          const isBs =
            plan.conceptId.includes('binary_search') ||
            plan.title.toLowerCase().includes('binary search');
          const isDs =
            plan.conceptId.includes('data_structure') ||
            plan.title.toLowerCase().includes('data structure') ||
            plan.title.toLowerCase().includes('stack') ||
            plan.title.toLowerCase().includes('queue');

          const isAlgorithm =
            isBs ||
            isDs ||
            plan.category === 'algorithm' ||
            canonicalRenderer === 'algorithm_array_tracer' ||
            plan.visualizationPlan?.rendererType === 'algorithm_trace' ||
            plan.title.toLowerCase().includes('search') ||
            plan.title.toLowerCase().includes('sort') ||
            plan.title.toLowerCase().includes('bubble') ||
            plan.title.toLowerCase().includes('recursion') ||
            plan.title.toLowerCase().includes('factorial');

          const resolveAlgorithmId = (): string => {
            const t = (plan.title + ' ' + plan.conceptId).toLowerCase();
            if (t.includes('bubble')) return 'bubble_sort';
            if (t.includes('linear')) return 'linear_search';
            if (t.includes('recursion') || t.includes('factorial')) return 'recursion_factorial';
            if (t.includes('queue')) return 'queue_operations';
            if (t.includes('stack')) return 'stack_operations';
            return 'binary_search';
          };

          const renderCompactAlgorithmContent = (currentBsStep: any) => (
            <>
              {/* 1A. Binary Search Pointer & Array Tracer */}
              {(isBs || (canonicalRenderer === 'algorithm_array_tracer' && !isDs)) && (
                <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-3">
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-cyan-400">
                        Binary Search Trace (O(log n))
                      </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                          {bsState.array.length} items
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                        Step {bsState.currentStepIndex + 1} of {bsState.steps.length}
                      </span>
                    </div>

                    {/* Quick Target Presets */}
                    <div className="flex items-center gap-1.5 w-full overflow-x-auto text-[10px]">
                      <span className="text-slate-400 text-[10px] font-medium mr-1">Targets:</span>
                      <button
                        type="button"
                        onClick={() => handleBsTargetSelect(23, BinarySearchEngine.DEFAULT_ARRAY)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          bsState.target === 23 && bsState.array.length > 0
                            ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Target 23 (Found)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBsTargetSelect(42, BinarySearchEngine.DEFAULT_ARRAY)}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          bsState.target === 42 && bsState.array.length > 0
                            ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Target 42 (Missing)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleBsTargetSelect(23, [])}
                        className={`px-2 py-0.5 rounded border transition-colors ${
                          bsState.array.length === 0
                            ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Empty [] (0 items)
                      </button>
                    </div>

                    {/* Array visualization */}
                    {bsState.array.length === 0 ? (
                      <div className="p-3 w-full rounded-lg bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-400 font-mono">
                        [ ] Empty array (0 elements). Binary search terminates immediately.
                      </div>
                    ) : (
                      <div className="flex gap-1.5 p-2 bg-slate-900 rounded-lg border border-slate-800 overflow-x-auto max-w-full">
                        {bsState.array.map((val, idx) => {
                          const isLow = idx === currentBsStep.low;
                          const isHigh = idx === currentBsStep.high;
                          const isMid = idx === currentBsStep.mid;
                          const inRange = idx >= currentBsStep.low && idx <= currentBsStep.high;
                          const isTarget = val === bsState.target;
                          const isMatchFound = currentBsStep.comparison === 'equal' && idx === currentBsStep.mid;

                          return (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleBsTargetSelect(val)}
                              className={`flex flex-col items-center justify-center w-8 h-12 rounded border text-xs font-mono font-bold transition-all ${
                                isMatchFound
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200 ring-2 ring-emerald-400'
                                  : isMid
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                                  : isTarget
                                  ? 'border-indigo-400 text-indigo-200'
                                  : inRange
                                  ? 'bg-slate-900 border-slate-700 text-slate-200'
                                  : 'bg-slate-950/40 border-slate-900 text-slate-600 opacity-40'
                              }`}
                              title={`Click to set target to ${val}`}
                            >
                              <span>{val}</span>
                              <span className="text-[8px] text-slate-500 font-sans">[{idx}]</span>
                              {isMid && <span className="text-[7px] text-cyan-400 font-bold uppercase">mid</span>}
                              {!isMid && isLow && <span className="text-[7px] text-amber-400 font-bold uppercase">low</span>}
                              {!isMid && !isLow && isHigh && <span className="text-[7px] text-purple-400 font-bold uppercase">high</span>}
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {/* Pointer status readout */}
                    {bsState.array.length > 0 && (
                      <div className="flex items-center justify-between w-full text-[10px] text-slate-400 font-mono px-1">
                        <div className="flex gap-2">
                          <span className="text-amber-400">low: [{currentBsStep.low}]</span>
                          <span className="text-cyan-400 font-bold">
                            mid: [{currentBsStep.mid}] ({currentBsStep.midVal ?? '—'})
                          </span>
                          <span className="text-purple-400">high: [{currentBsStep.high}]</span>
                        </div>
                        <span className="text-emerald-400 font-bold">Target: {bsState.target}</span>
                      </div>
                    )}

                    {/* Step narrative */}
                    <div className="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded border border-slate-800 w-full">
                      {currentBsStep.explanation}
                    </div>

                    {/* Playback Controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={bsState.currentStepIndex === 0}
                        onClick={() => setBsState((prev) => BinarySearchEngine.stepBackward(prev))}
                        className="px-2.5 py-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-40 border border-slate-800 text-xs text-slate-200 flex items-center gap-1"
                      >
                        <SkipBack className="w-3 h-3" />
                        <span>Prev</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBsState((prev) => BinarySearchEngine.togglePlay(prev))}
                        className={`px-3 py-1 rounded text-xs font-bold text-white flex items-center gap-1 ${
                          bsState.isPlaying
                            ? 'bg-amber-600 hover:bg-amber-500'
                            : 'bg-indigo-600 hover:bg-indigo-500'
                        }`}
                      >
                        {bsState.isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                        <span>{bsState.isPlaying ? 'Pause' : 'Auto Play'}</span>
                      </button>
                      <button
                        type="button"
                        disabled={bsState.currentStepIndex >= bsState.steps.length - 1}
                        onClick={() => setBsState((prev) => BinarySearchEngine.stepForward(prev))}
                        className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 disabled:opacity-40 text-xs text-white font-bold flex items-center gap-1"
                      >
                        <span>Next</span>
                        <SkipForward className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setBsState((prev) => BinarySearchEngine.reset(prev))}
                        className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-xs text-slate-400 flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" />
                        <span>Reset</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* 1B. Data Structure Visualizer */}
                {isDs && (
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-cyan-400">
                        Interactive Data Structure Lab
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/30 text-cyan-300">
                        {dsState.timeComplexity}
                      </span>
                    </div>

                    {/* Type selector */}
                    <div className="grid grid-cols-3 gap-1 w-full text-[10px] font-semibold">
                      {(['stack', 'queue', 'array'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setDsState(DataStructureEngine.createInitialState(t))}
                          className={`py-1 rounded border capitalize transition-colors ${
                            dsState.structureType === t
                              ? 'bg-cyan-600 border-cyan-500 text-white'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>

                    {/* Elements Display */}
                    <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 w-full min-h-[90px] flex items-center justify-center">
                      {dsState.structureType === 'stack' && (
                        <div className="flex flex-col-reverse gap-1.5 items-center w-full max-w-[200px]">
                          {dsState.elements.map((el, idx) => (
                            <div
                              key={el.id}
                              className={`w-full py-1.5 px-3 rounded border text-xs text-center font-mono font-bold flex items-center justify-between ${
                                idx === dsState.elements.length - 1
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span>{el.value}</span>
                              <span className="text-[9px] text-cyan-400 font-sans">{el.label}</span>
                            </div>
                          ))}
                          {dsState.elements.length === 0 && (
                            <span className="text-xs text-slate-500 italic">Empty Stack (0 frames)</span>
                          )}
                        </div>
                      )}

                      {dsState.structureType === 'queue' && (
                        <div className="flex gap-1.5 items-center overflow-x-auto w-full justify-center">
                          {dsState.elements.map((el, idx) => (
                            <div
                              key={el.id}
                              className={`p-2 rounded border text-xs text-center font-mono font-bold min-w-[70px] ${
                                idx === 0
                                  ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                                  : idx === dsState.elements.length - 1
                                  ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <div>{el.value}</div>
                              <div className="text-[8px] text-slate-400 font-sans">{el.label}</div>
                            </div>
                          ))}
                          {dsState.elements.length === 0 && (
                            <span className="text-xs text-slate-500 italic">Empty Queue (0 tasks)</span>
                          )}
                        </div>
                      )}

                      {dsState.structureType === 'array' && (
                        <div className="flex gap-1.5 items-center overflow-x-auto w-full justify-center">
                          {dsState.elements.map((el, idx) => (
                            <button
                              key={el.id}
                              onClick={() => setDsState((prev) => DataStructureEngine.arrayAccess(prev, idx))}
                              className={`w-10 h-12 rounded border text-xs text-center font-mono font-bold flex flex-col items-center justify-center ${
                                dsState.highlightedIndices.includes(idx)
                                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-200 ring-1 ring-cyan-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-300'
                              }`}
                            >
                              <span>{el.value}</span>
                              <span className="text-[8px] text-slate-500">[{idx}]</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Operation Controls */}
                    <div className="flex flex-wrap gap-1.5 justify-center w-full">
                      {dsState.structureType === 'stack' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDsState((prev) =>
                                DataStructureEngine.stackPush(prev, `call_${prev.elements.length + 1}()`)
                              )
                            }
                            className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-xs font-semibold text-white"
                          >
                            + Push Frame
                          </button>
                          <button
                            type="button"
                            disabled={dsState.elements.length === 0}
                            onClick={() => setDsState((prev) => DataStructureEngine.stackPop(prev))}
                            className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 disabled:opacity-40 text-xs font-semibold text-rose-200"
                          >
                            - Pop Top
                          </button>
                        </>
                      )}

                      {dsState.structureType === 'queue' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDsState((prev) =>
                                DataStructureEngine.queueEnqueue(
                                  prev,
                                  `Task ${String.fromCharCode(65 + prev.elements.length)}`
                                )
                              )
                            }
                            className="px-2.5 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-xs font-semibold text-white"
                          >
                            + Enqueue Task
                          </button>
                          <button
                            type="button"
                            disabled={dsState.elements.length === 0}
                            onClick={() => setDsState((prev) => DataStructureEngine.queueDequeue(prev))}
                            className="px-2.5 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 disabled:opacity-40 text-xs font-semibold text-rose-200"
                          >
                            - Dequeue Front
                          </button>
                        </>
                      )}

                      {dsState.structureType === 'array' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              setDsState((prev) =>
                                DataStructureEngine.arrayInsert(
                                  prev,
                                  0,
                                  Math.floor(Math.random() * 90 + 10)
                                )
                              )
                            }
                            className="px-2 py-1 rounded bg-cyan-700 hover:bg-cyan-600 text-xs font-semibold text-white"
                          >
                            + Insert [0]
                          </button>
                          <button
                            type="button"
                            disabled={dsState.elements.length === 0}
                            onClick={() => setDsState((prev) => DataStructureEngine.arrayDelete(prev, 0))}
                            className="px-2 py-1 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 disabled:opacity-40 text-xs font-semibold text-rose-200"
                          >
                            - Delete [0]
                          </button>
                        </>
                      )}
                    </div>

                    {/* Operation Status & Log */}
                    <div className="w-full text-[11px] p-2 rounded bg-slate-900/60 border border-slate-800 space-y-1">
                      <div className="text-cyan-300 font-semibold">{dsState.lastOperation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        History: {dsState.operationLog.slice(0, 2).join(' → ')}
                      </div>
                    </div>
                  </div>
                )}
            </>
          );

          const renderVisualizerContent = () => {
            const currentBsStep = bsState.steps[bsState.currentStepIndex] || bsState.steps[0];

            if (isAlgorithm) {
              return (
                <div className="space-y-3">
                  {/* Step 3 Algorithm Visualizer Mode Switcher */}
                  <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setAlgoVisualMode('code_trace')}
                      className={`flex-1 py-1 px-2.5 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        algoVisualMode === 'code_trace'
                          ? 'bg-cyan-600 text-white shadow-sm shadow-cyan-500/20'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Code2 className="w-3.5 h-3.5" />
                      <span>Code-to-Visual Tracer</span>
                      <span className="px-1 py-0.2 rounded bg-cyan-950 border border-cyan-400/30 text-[9px] text-cyan-300">
                        Step 3
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAlgoVisualMode('compact')}
                      className={`py-1 px-3 rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-all ${
                        algoVisualMode === 'compact'
                          ? 'bg-slate-800 text-cyan-300 border border-cyan-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Compact HUD</span>
                    </button>
                  </div>

                  {algoVisualMode === 'code_trace' ? (
                    <div className="min-h-[500px]">
                      <CodeTracingView
                        initialAlgorithmId={resolveAlgorithmId()}
                        onStampToCanvas={handleStampToCanvas}
                      />
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {renderCompactAlgorithmContent(currentBsStep)}
                    </div>
                  )}

                  {/* Visual Objective Note */}
                  <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
                    <span className="font-semibold text-xs text-white">Visual Model Objective:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {plan.visualizationPlan.learningObjective}
                    </p>
                  </div>
                </div>
              );
            }

            return (
              <div className="space-y-2.5">
                {/* 1C. Newtonian Force Vector Simulator */}
                {(canonicalRenderer === 'physics_vector_simulator' || plan.conceptId === 'physics_f_ma') && (
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-3">
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-semibold text-cyan-400">
                        Dynamic Vector Block (F = m · a)
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                        a = {experimentState.calculatedOutputs.result} m/s²
                      </span>
                    </div>

                    <svg width="240" height="120" className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                      <line x1="20" y1="95" x2="220" y2="95" stroke="#475569" strokeWidth="2" />
                      <rect
                        x="90"
                        y={95 - Math.max(20, Math.min(60, (experimentState.parameters.m ?? 2) * 5))}
                        width={Math.max(40, Math.min(70, (experimentState.parameters.m ?? 2) * 6))}
                        height={Math.max(20, Math.min(60, (experimentState.parameters.m ?? 2) * 5))}
                        fill="#3b82f6"
                        rx="4"
                      />
                      <text
                        x="115"
                        y={95 - Math.max(20, (experimentState.parameters.m ?? 2) * 2.5)}
                        fill="#ffffff"
                        fontSize="11"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        m = {experimentState.parameters.m ?? 2} kg
                      </text>
                      <line
                        x1="90"
                        y1="60"
                        x2={90 + Math.min(110, (experimentState.parameters.F ?? 10) * 1.5)}
                        y2="60"
                        stroke="#22d3ee"
                        strokeWidth="4"
                      />
                      <text
                        x={90 + Math.min(90, (experimentState.parameters.F ?? 10) * 1.2)}
                        y="50"
                        fill="#22d3ee"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        F = {experimentState.parameters.F ?? 10} N
                      </text>
                    </svg>

                    {/* Live Sliders inside visualizer for mass and acceleration / force */}
                    <div className="w-full space-y-2 p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-300">Mass (m):</span>
                        <span className="font-mono font-bold text-cyan-400">
                          {experimentState.parameters.m ?? 2} kg
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={experimentState.parameters.m ?? 2}
                        onChange={(e) => handleParamChange('m', parseFloat(e.target.value))}
                        className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between items-center pt-1">
                        <span className="text-slate-300">Net Force (F = m · a):</span>
                        <span className="font-mono font-bold text-emerald-400">
                          {experimentState.parameters.F ?? 10} N
                        </span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="100"
                        step="1"
                        value={experimentState.parameters.F ?? 10}
                        onChange={(e) => handleParamChange('F', parseFloat(e.target.value))}
                        className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div className="text-[11px] text-slate-400 border-t border-slate-800/80 pt-1 w-full text-center">
                      Assumptions: Frictionless plane, constant mass, 1D motion, inertial reference frame.
                    </div>
                  </div>
                )}

                {/* 1D. Cartesian Coordinate & Linear/Wave Plotter */}
                {canonicalRenderer === 'function_coordinate_plotter' && (
                  (() => {
                    const lowerTitle = (plan.title + ' ' + plan.conceptId).toLowerCase();
                    const isCurve =
                      lowerTitle.includes('e^(cos(x))') ||
                      lowerTitle.includes('e^x') ||
                      lowerTitle.includes('exponential') ||
                      lowerTitle.includes('curve') ||
                      lowerTitle.includes('cos') ||
                      lowerTitle.includes('sin') ||
                      lowerTitle.includes('tan') ||
                      plan.conceptId === 'math_exp_cos_curve' ||
                      plan.conceptId === 'math_exponential_function' ||
                      plan.conceptId === 'calculus_sin_x' ||
                      plan.conceptId === 'math_cosine_function';

                    const isLinear =
                      lowerTitle.includes('linear') ||
                      lowerTitle.includes('slope') ||
                      lowerTitle.includes('y =') ||
                      lowerTitle.includes('y=') ||
                      lowerTitle.includes('mx');

                    if (isLinear || isCurve) {
                      let functionExpression: string | undefined = undefined;
                      if (lowerTitle.includes('e^(cos(x))') || lowerTitle.includes('e^cos(x)')) functionExpression = 'e^(cos(x))';
                      else if (lowerTitle.includes('e^x') || lowerTitle.includes('exponential') || plan.conceptId === 'math_exponential_function') functionExpression = 'e^x';
                      else if (lowerTitle.includes('cos') || lowerTitle.includes('cosine') || plan.conceptId === 'math_cosine_function') functionExpression = 'cos(x)';
                      else if (lowerTitle.includes('sin') || lowerTitle.includes('sine') || plan.conceptId === 'calculus_sin_x' || plan.conceptId === 'math_sine_function') functionExpression = 'sin(x)';
                      else if (lowerTitle.includes('tan') || lowerTitle.includes('tangent')) functionExpression = 'tan(x)';

                      return (
                        <LinearFunctionPlotterView
                          initialSlope={experimentState.parameters.m ?? 2}
                          initialIntercept={experimentState.parameters.c ?? 1}
                          equationTitle={plan.title}
                          functionExpression={functionExpression}
                          onStampToCanvas={handleStampToCanvas}
                        />
                      );
                    }

                    return (
                      <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-2">
                        <span className="text-xs font-semibold text-cyan-400">
                          Harmonic Sine Wave & Instantaneous Slope
                        </span>
                        <svg width="240" height="120" className="bg-slate-900 rounded-lg border border-slate-800">
                          <line x1="20" y1="60" x2="220" y2="60" stroke="#475569" strokeWidth="1" />
                          <line x1="120" y1="10" x2="120" y2="110" stroke="#475569" strokeWidth="1" />
                          <path
                            d={Array.from({ length: 40 }, (_, i) => {
                              const xVal = -3.14 + (i * 6.28) / 40;
                              const yVal = Math.sin((experimentState.parameters.f ?? 1) * xVal) * 35;
                              const px = 120 + (xVal / 3.14) * 90;
                              const py = 60 - yVal * (experimentState.parameters.A ?? 1);
                              return `${i === 0 ? 'M' : 'L'} ${px} ${py}`;
                            }).join(' ')}
                            fill="none"
                            stroke="#818cf8"
                            strokeWidth="2.5"
                          />
                        </svg>
                        <div className="text-xs font-mono text-emerald-400">
                          y({experimentState.parameters.x ?? 1.57}) = {experimentState.calculatedOutputs.result}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 1E. Geometric Dissection & Fraction Visualizer */}
                {canonicalRenderer === 'formula_geometric_dissection' && (
                  (() => {
                    const lowerTitle = (plan.title + ' ' + plan.conceptId).toLowerCase();
                    const isFraction =
                      lowerTitle.includes('fraction') ||
                      lowerTitle.includes('rational') ||
                      lowerTitle.includes('part-to-whole') ||
                      lowerTitle.includes('numerator') ||
                      lowerTitle.includes('denominator');

                    if (isFraction) {
                      return (
                        <FractionVisualizerView
                          initialNumerator={experimentState.parameters.a ?? 3}
                          initialDenominator={experimentState.parameters.b ?? 4}
                          onStampToCanvas={handleStampToCanvas}
                        />
                      );
                    }

                    return (
                      <FormulaVisualProofAnimation
                        formula={KNOWN_FORMULA_REGISTRY[0]}
                        onInsertToCanvas={handleStampToCanvas}
                      />
                    );
                  })()
                )}

                {/* 1F. Universal Interactive Physics Simulation */}
                {(canonicalRenderer === 'pendulum_simulation' ||
                  plan.visualizationPlan.rendererType === 'pendulum_simulation' ||
                  plan.title.toLowerCase().includes('pendulum') ||
                  plan.title.toLowerCase().includes('projectile')) && (
                  <div className="p-2 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center w-full h-[380px]">
                    <UniversalSimulationView
                      initialSimulationType={
                        plan.title.toLowerCase().includes('projectile')
                          ? 'projectile'
                          : 'pendulum'
                      }
                      initialParams={{
                        gravity: experimentState.parameters.g ?? 9.81,
                        length: experimentState.parameters.L ?? 2.0,
                        damping: 0.04,
                        initialAngle: experimentState.parameters.theta ?? 45,
                        speed: 1.0,
                      }}
                      isImmersive={false}
                    />
                  </div>
                )}

                {/* 1G. Geometric Triangle Construction & Pythagorean Dissection Proof */}
                {canonicalRenderer === 'geometric_triangle_construction' && (
                  (() => {
                    const lowerTitle = (plan.title + ' ' + plan.conceptId).toLowerCase();
                    const isPythagoras =
                      lowerTitle.includes('pythagor') ||
                      lowerTitle.includes('hypotenuse') ||
                      lowerTitle.includes('right triangle');

                    if (isPythagoras) {
                      return (
                        <PythagoreanDissectionProofView
                          initialA={experimentState.parameters.a ?? 3}
                          initialB={experimentState.parameters.b ?? 4}
                          onStampToCanvas={handleStampToCanvas}
                        />
                      );
                    }

                    if (lowerTitle.includes('cosine')) {
                      const a = experimentState.parameters.a ?? 5;
                      const b = experimentState.parameters.b ?? 7;
                      const C_deg = experimentState.parameters.C ?? 60;
                      const C_rad = (C_deg * Math.PI) / 180;
                      const scale = 110 / Math.max(a, b, 8);
                      const pC = [45, 115];
                      const pA = [45 + b * scale, 115];
                      const pB = [45 + a * Math.cos(C_rad) * scale, 115 - a * Math.sin(C_rad) * scale];
                      const cSquared = Math.max(0.01, a * a + b * b - 2 * a * b * Math.cos(C_rad));
                      const c = Math.sqrt(cSquared);
                      return (
                        <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-3">
                          <span className="text-xs font-semibold text-cyan-400">
                            Law of Cosines Triangle: c² = a² + b² - 2ab cos(C)
                          </span>
                          <svg width="240" height="140" className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                            <polygon
                              points={`${pC[0]},${pC[1]} ${pA[0]},${pA[1]} ${pB[0]},${pB[1]}`}
                              fill="rgba(14, 165, 233, 0.2)"
                              stroke="#38bdf8"
                              strokeWidth="2"
                            />
                            <text x={(pC[0] + pA[0]) / 2} y={130} fill="#38bdf8" fontSize="10" textAnchor="middle">
                              b = {b}
                            </text>
                            <text x={(pC[0] + pB[0]) / 2 - 12} y={(pC[1] + pB[1]) / 2} fill="#38bdf8" fontSize="10" textAnchor="middle">
                              a = {a}
                            </text>
                            <text x={(pA[0] + pB[0]) / 2 + 12} y={(pA[1] + pB[1]) / 2} fill="#34d399" fontSize="10" textAnchor="middle">
                              c = {c.toFixed(1)}
                            </text>
                            <text x={pC[0] + 16} y={pC[1] - 6} fill="#f59e0b" fontSize="9">
                              ∠C = {C_deg}°
                            </text>
                          </svg>
                          <div className="text-xs font-mono font-bold text-emerald-400">
                            c² = {a}² + {b}² - 2({a})({b})cos({C_deg}°) = {cSquared.toFixed(2)} (c = {c.toFixed(2)})
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-3">
                        <span className="text-xs font-semibold text-cyan-400">
                          Right Triangle & Pythagorean Construction (a² + b² = c²)
                        </span>
                        <svg width="220" height="140" className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                          <polygon points="40,110 180,110 40,30" fill="rgba(14, 165, 233, 0.2)" stroke="#38bdf8" strokeWidth="2" />
                          <text x="110" y="125" fill="#38bdf8" fontSize="11" textAnchor="middle">a = {experimentState.parameters.a ?? 3}</text>
                          <text x="25" y="70" fill="#38bdf8" fontSize="11" textAnchor="middle">b = {experimentState.parameters.b ?? 4}</text>
                          <text x="120" y="65" fill="#34d399" fontSize="11" textAnchor="middle">c = {Math.hypot(experimentState.parameters.a ?? 3, experimentState.parameters.b ?? 4).toFixed(1)}</text>
                        </svg>
                        <div className="text-xs font-mono font-bold text-emerald-400">
                          Hypotenuse c² = {((experimentState.parameters.a ?? 3) ** 2 + (experimentState.parameters.b ?? 4) ** 2).toFixed(1)}
                        </div>
                      </div>
                    );
                  })()
                )}

                {/* 1H. 3D Model Viewer */}
                {canonicalRenderer === 'model3d_viewer' && (
                  <div className="p-3 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center w-full h-[380px]">
                    <Universal3DViewer
                      isImmersive={false}
                      zoom={1.1}
                      initialModelType={
                        plan.title.toLowerCase().includes('nervous') ||
                        plan.title.toLowerCase().includes('brain') ||
                        plan.title.toLowerCase().includes('neuron') ||
                        plan.title.toLowerCase().includes('synapse') ||
                        plan.title.toLowerCase().includes('spine')
                          ? 'nervous_system'
                          : plan.title.toLowerCase().includes('cosine')
                          ? 'vectors_3d'
                          : plan.title.toLowerCase().includes('molecule') || plan.category === 'chemistry'
                          ? 'molecule'
                          : 'heart'
                      }
                    />
                  </div>
                )}

                {/* 1I. Pure Explanation */}
                {canonicalRenderer === 'none' && (
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 space-y-2 text-center">
                    <span className="text-xs font-semibold text-cyan-400">Pure Conceptual Model</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{plan.overview}</p>
                  </div>
                )}

                {/* 1J. SVG Schematic Fallback */}
                {canonicalRenderer === 'svg_schematic_fallback' && (
                  <div className="p-4 rounded-xl border bg-slate-950 border-slate-800 flex flex-col items-center justify-center space-y-2">
                    <span className="text-xs font-semibold text-cyan-400">
                      {plan.visualizationPlan.title || 'Conceptual Architecture Model'}
                    </span>
                    <svg width="240" height="90" className="bg-slate-900 rounded-lg p-2 border border-slate-800">
                      <rect x="20" y="25" width="80" height="40" rx="6" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                      <text x="60" y="49" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="bold">Input</text>
                      <line x1="100" y1="45" x2="140" y2="45" stroke="#64748b" strokeWidth="2" />
                      <rect x="140" y="25" width="80" height="40" rx="6" fill="#1e293b" stroke="#34d399" strokeWidth="1.5" />
                      <text x="180" y="49" fill="#e2e8f0" fontSize="10" textAnchor="middle" fontWeight="bold">Structure</text>
                    </svg>
                    <p className="text-[11px] text-slate-400 text-center">{plan.visualizationPlan.description}</p>
                  </div>
                )}

                {/* Visual Objective Note */}
                <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1">
                  <span className="font-semibold text-xs text-white">Visual Model Objective:</span>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {plan.visualizationPlan.learningObjective}
                  </p>
                </div>
              </div>
            );
          };

          const renderPracticeContent = () => {
            const saQuestion = PracticeEvaluationEngine.getDefaultShortAnswerQuestion(plan);

            return (
              <div className="space-y-3">
                {/* Worked Example */}
                {plan.workedExamples.length > 0 && (
                  <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1.5">
                    <div className="text-xs font-semibold text-cyan-400">
                      Worked Example: {plan.workedExamples[0].title}
                    </div>
                    <p className="text-xs text-slate-300">
                      {plan.workedExamples[0].problemStatement}
                    </p>
                    <div className="space-y-1 font-mono text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                      {plan.workedExamples[0].stepByStepSolution.map((st, i) => (
                        <div key={i} className="text-slate-300">
                          {st}
                        </div>
                      ))}
                      <div className="text-emerald-400 font-bold pt-1">
                        Answer: {plan.workedExamples[0].finalAnswer}
                      </div>
                    </div>
                  </div>
                )}

                {/* Practice Multiple-Choice Quiz with Formative Evaluation */}
                {plan.practiceQuestions.length > 0 && (
                  <div className="p-3.5 rounded-xl border bg-purple-950/20 border-purple-500/30 text-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-purple-400 font-semibold text-xs">
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>Concept Check (Multiple Choice)</span>
                      </div>
                      {practiceFeedback && (
                        <button
                          onClick={() => {
                            setSelectedOption(null);
                            setIsAnswerSubmitted(false);
                            setPracticeFeedback(null);
                          }}
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Retry</span>
                        </button>
                      )}
                    </div>

                    <p className="text-xs font-medium text-slate-100">
                      {plan.practiceQuestions[0].question}
                    </p>

                    <div className="space-y-1.5">
                      {plan.practiceQuestions[0].options.map((opt, idx) => {
                        const isSelected = selectedOption === idx;
                        const isCorrect = idx === plan.practiceQuestions[0].correctIndex;
                        let btnStyle = 'bg-slate-900/60 border-slate-700/60 hover:bg-slate-800 text-slate-300';
                        if (practiceFeedback) {
                          if (isCorrect) {
                            btnStyle = 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200 font-semibold';
                          } else if (isSelected && !isCorrect) {
                            btnStyle = 'bg-rose-950/60 border-rose-500/60 text-rose-200';
                          } else {
                            btnStyle = 'bg-slate-900/30 border-slate-800/40 text-slate-500 opacity-60';
                          }
                        }

                        return (
                          <button
                            key={idx}
                            onClick={() => handleOptionSelect(idx)}
                            disabled={practiceFeedback !== null}
                            className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${btnStyle}`}
                          >
                            <span>{opt}</span>
                            {practiceFeedback && isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 ml-1.5" />
                            )}
                            {practiceFeedback && isSelected && !isCorrect && (
                              <XCircle className="w-3.5 h-3.5 text-rose-400 ml-1.5" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {practiceFeedback && (
                      <div
                        className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                          practiceFeedback.isCorrect
                            ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                            : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                        }`}
                      >
                        <p className="font-semibold mb-0.5">
                          {practiceFeedback.isCorrect
                            ? `🎉 Correct Understanding! (Score: ${practiceFeedback.score})`
                            : '❌ Misconception Alert'}
                        </p>
                        <p>{practiceFeedback.explanation}</p>
                        {!practiceFeedback.isCorrect && practiceFeedback.misconceptionAlert && (
                          <p className="text-amber-300 mt-1">⚠️ {practiceFeedback.misconceptionAlert}</p>
                        )}
                        {!practiceFeedback.isCorrect && practiceFeedback.hint && (
                          <p className="text-cyan-300 mt-1 italic">💡 Hint: {practiceFeedback.hint}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Short-Answer Practice Calculation */}
                <div className="p-3.5 rounded-xl border bg-indigo-950/20 border-indigo-500/30 text-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-indigo-400 font-semibold text-xs">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Quantitative & Calculation Check</span>
                    </div>
                    {shortAnswerFeedback && (
                      <button
                        onClick={() => {
                          setShortAnswerInput('');
                          setShortAnswerFeedback(null);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>

                  <p className="text-xs font-medium text-slate-100">
                    {saQuestion.question}
                  </p>

                  <form onSubmit={handleShortAnswerSubmit} className="flex gap-2">
                    <input
                      type="text"
                      value={shortAnswerInput}
                      onChange={(e) => setShortAnswerInput(e.target.value)}
                      placeholder={saQuestion.unit ? `e.g. 20 (in ${saQuestion.unit})` : 'Enter answer...'}
                      disabled={shortAnswerFeedback?.isCorrect}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 disabled:opacity-50"
                    />
                    <button
                      type="submit"
                      disabled={!shortAnswerInput.trim() || shortAnswerFeedback?.isCorrect}
                      className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-lg text-xs font-semibold text-white shadow-sm transition-all"
                    >
                      Check
                    </button>
                  </form>

                  {shortAnswerFeedback && (
                    <div
                      className={`p-2.5 rounded-lg text-[11px] leading-relaxed ${
                        shortAnswerFeedback.isCorrect
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <p className="font-semibold mb-0.5">
                        {shortAnswerFeedback.isCorrect ? '🎉 Correct Computation!' : '❌ Incorrect Attempt'}
                      </p>
                      <p>{shortAnswerFeedback.explanation}</p>
                      {!shortAnswerFeedback.isCorrect && shortAnswerFeedback.hint && (
                        <p className="text-amber-300 mt-1 italic">💡 Hint: {shortAnswerFeedback.hint}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Recommended Next Concepts */}
                {plan.recommendedNextConcepts.length > 0 && (
                  <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Recommended Next Steps
                    </div>
                    <div className="space-y-1">
                      {plan.recommendedNextConcepts.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => handleQuickTopic(c)}
                          className="w-full text-left p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 flex items-center justify-between transition-colors"
                        >
                          <span className="line-clamp-1">{c}</span>
                          <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          };

          // IF IN GUIDED MODE: Render the 8 guided steps directly
          if (isGuidedMode) {
            return (
              <div className="space-y-2.5">
                {/* Step 1: Meaning & Motivation */}
                {guidedStep === 'concept_meaning' && (
                  <div className="space-y-2.5">
                    <div
                      className="p-3 rounded-xl border bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/30 text-center"
                      dangerouslySetInnerHTML={renderFormulaLatex(
                        plan.conceptId === 'physics_f_ma'
                          ? 'F = m \\cdot a'
                          : plan.conceptId === 'physics_kinematics_v_u_at'
                          ? 'v = u + a \\cdot t'
                          : plan.conceptId === 'calculus_sin_x'
                          ? 'y = A \\sin(f \\cdot x)'
                          : plan.conceptId === 'math_exponential_function'
                          ? 'y = e^x'
                          : plan.conceptId === 'math_cosine_function'
                          ? 'y = \\cos(x)'
                          : plan.conceptId === 'math_exp_cos_curve'
                          ? 'y = e^{\\cos(x)}'
                          : plan.conceptId === 'math_linear_functions'
                          ? 'y = mx + c'
                          : plan.conceptId === 'geometry_pythagoras'
                          ? 'a^2 + b^2 = c^2'
                          : plan.conceptId === 'algebra_square_diff'
                          ? '(a - b)^2 = a^2 - 2ab + b^2'
                          : plan.title
                      )}
                    />
                    <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1.5">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Core Meaning</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{plan.overview}</p>
                    </div>

                    {plan.variables.length > 0 && (
                      <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                          Variables & Units
                        </div>
                        <div className="space-y-1 font-mono text-[11px]">
                          {plan.variables.map((v, i) => (
                            <div
                              key={i}
                              className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-cyan-400">{v.symbol}</span>
                                <span className="text-slate-300 font-sans text-[11px]">{v.name}</span>
                              </div>
                              <span className="text-slate-400 text-[10px]">{v.unit || 'unitless'}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 2: Why It Matters */}
                {guidedStep === 'why_it_matters' && (
                  <div className="space-y-2.5">
                    <div className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                        <Lightbulb className="w-3.5 h-3.5" />
                        <span>Motivation & Real-World Relevance</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{plan.motivation}</p>
                    </div>

                    {plan.applications && plan.applications.length > 0 && (
                      <div className="p-3 rounded-xl border bg-indigo-950/20 border-indigo-500/30 space-y-1.5">
                        <div className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">
                          Key Practical Applications
                        </div>
                        <div className="space-y-1 text-xs text-slate-300">
                          {plan.applications.map((app, i) => (
                            <div key={i} className="flex items-start gap-1.5">
                              <span className="text-indigo-400">•</span>
                              <span>{app}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 3: Prerequisites & Interactive Knowledge Graph */}
                {guidedStep === 'prerequisites' && (
                  <div className="space-y-3">
                    <InteractiveTopicKnowledgeGraphView
                      topicQuery={currentInput || plan.title}
                      currentSession={null}
                      onSelectTopic={(t) => {
                        applyTopic(t);
                        if (onSelectTopic) onSelectTopic(t);
                      }}
                      onStampToCanvas={() => {
                        if (!editor) return;
                        CanvasStampingEngine.stampTopicKnowledgeGraph(
                          editor,
                          currentInput || plan.title,
                          plan.conceptId || 'math_linear_functions'
                        );
                      }}
                    />

                    <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                        <Compass className="w-3.5 h-3.5" />
                        <span>Foundational Prerequisites Checklist</span>
                      </div>
                      {plan.prerequisites && plan.prerequisites.length > 0 ? (
                        <div className="space-y-1 text-xs text-slate-300">
                          {plan.prerequisites.map((p, i) => (
                            <div key={i} className="flex items-center gap-1.5">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span>{p}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">Basic conceptual and algebraic reasoning.</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Step 4: Step-by-Step Explanation */}
                {guidedStep === 'step_by_step' && (
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                      <div className="text-xs font-semibold text-cyan-400">
                        {plan.derivationSummary || 'Derivation & Step-by-Step Breakdown'}
                      </div>
                      <div className="space-y-2">
                        {plan.derivationSteps.map((s) => (
                          <div
                            key={s.stepNumber}
                            className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-cyan-400">Step {s.stepNumber}</span>
                              <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                                {s.expression}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-300">{s.explanation}</p>
                            <p className="text-[10px] text-slate-500 italic">Rationale: {s.rationale}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {plan.assumptions.length > 0 && (
                      <div className="p-3 rounded-xl border bg-amber-950/20 border-amber-500/20 space-y-1">
                        <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Boundary Assumptions</span>
                        </div>
                        <ul className="space-y-0.5 text-[11px] text-slate-300">
                          {plan.assumptions.map((a, i) => (
                            <li key={i} className="flex items-start gap-1.5">
                              <span className="text-amber-400">•</span>
                              <span>{a}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Step 5: Worked Example */}
                {guidedStep === 'worked_example' && (
                  <div className="space-y-2.5">
                    {plan.workedExamples.length > 0 ? (
                      <div className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                        <div className="text-xs font-semibold text-cyan-400">
                          Worked Example: {plan.workedExamples[0].title}
                        </div>
                        <p className="text-xs text-slate-300">
                          {plan.workedExamples[0].problemStatement}
                        </p>
                        <div className="space-y-1.5 font-mono text-[11px] bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                          {plan.workedExamples[0].stepByStepSolution.map((st, i) => (
                            <div key={i} className="text-slate-300">
                              {st}
                            </div>
                          ))}
                          <div className="text-emerald-400 font-bold pt-1 border-t border-slate-800">
                            Answer: {plan.workedExamples[0].finalAnswer}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 p-3">No worked example recorded.</p>
                    )}
                  </div>
                )}

                {/* Step 6: Interactive Exploration */}
                {guidedStep === 'interactive_exploration' && renderVisualizerContent()}

                {/* Step 7: Practice Exercise */}
                {guidedStep === 'practice_exercise' && renderPracticeContent()}

                {/* Step 8: Concise Recap */}
                {guidedStep === 'recap' && (() => {
                  const masteryEval = getTopicMasteryEvaluation();
                  return (
                    <div className="space-y-2.5">
                      <div className="p-3.5 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                        <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                          <Award className="w-3.5 h-3.5" />
                          <span>Concise Lesson Recap</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{plan.overview}</p>
                        <div className={`p-2.5 rounded-lg border text-[11px] space-y-1.5 ${masteryEval.badgeClass}`}>
                          <div className="font-bold flex items-center justify-between">
                            <span>{masteryEval.badgeLabel}</span>
                            {masteryEval.status === 'assessment_pending' && (
                              <button
                                onClick={() => setGuidedStep('practice_exercise')}
                                className="px-2 py-0.5 rounded bg-cyan-800 hover:bg-cyan-700 text-white text-[10px] font-semibold transition-colors shadow-sm"
                              >
                                Take Step 7 Quiz ▶
                              </button>
                            )}
                            {masteryEval.status === 'needs_practice' && (
                              <button
                                onClick={() => setGuidedStep('practice_exercise')}
                                className="px-2 py-0.5 rounded bg-amber-700 hover:bg-amber-600 text-white text-[10px] font-semibold transition-colors shadow-sm"
                              >
                                Retry Step 7 Quiz ▶
                              </button>
                            )}
                          </div>
                          <p className="text-[10.5px] opacity-90 leading-relaxed">{masteryEval.message}</p>
                        </div>
                      </div>

                      {plan.recommendedNextConcepts.length > 0 && (
                        <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1.5">
                          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                            Ready for Next Topics
                          </div>
                          <div className="space-y-1">
                            {plan.recommendedNextConcepts.map((c, i) => (
                              <button
                                key={i}
                                onClick={() => handleQuickTopic(c)}
                                className="w-full text-left p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 flex items-center justify-between transition-colors"
                              >
                                <span className="line-clamp-1">{c}</span>
                                <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0 ml-1" />
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          }

          // IF IN 5 PILLARS TABS MODE:
          return (
            <div className="space-y-3">
              {/* TAB 1: UNDERSTAND */}
              {activeTab === 'understand' && (
                <div className="space-y-2.5">
                  <div
                    className="p-3 rounded-xl border bg-gradient-to-br from-indigo-950/40 to-slate-900/60 border-indigo-500/30 text-center"
                    dangerouslySetInnerHTML={renderFormulaLatex(
                      plan.conceptId === 'physics_f_ma'
                        ? 'F = m \\cdot a'
                        : plan.conceptId === 'physics_kinematics_v_u_at'
                        ? 'v = u + a \\cdot t'
                        : plan.conceptId === 'calculus_sin_x'
                        ? 'y = A \\sin(f \\cdot x)'
                        : plan.conceptId === 'math_exponential_function'
                        ? 'y = e^x'
                        : plan.conceptId === 'math_cosine_function'
                        ? 'y = \\cos(x)'
                        : plan.conceptId === 'math_exp_cos_curve'
                        ? 'y = e^{\\cos(x)}'
                        : plan.conceptId === 'math_linear_functions'
                        ? 'y = mx + c'
                        : plan.conceptId === 'geometry_pythagoras'
                        ? 'a^2 + b^2 = c^2'
                        : plan.conceptId === 'algebra_square_diff'
                        ? '(a - b)^2 = a^2 - 2ab + b^2'
                        : plan.title
                    )}
                  />
                  <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-1.5">
                    <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Meaning & Motivation</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{plan.overview}</p>
                    <p className="text-[11px] text-slate-400 italic border-t border-slate-800/60 pt-1.5">
                      💡 {plan.motivation}
                    </p>
                  </div>

                  {/* Interactive Topic Knowledge Graph */}
                  <InteractiveTopicKnowledgeGraphView
                    topicQuery={currentInput || plan.title}
                    currentSession={null}
                    onSelectTopic={(t) => {
                      applyTopic(t);
                      if (onSelectTopic) onSelectTopic(t);
                    }}
                    onStampToCanvas={() => {
                      if (!editor) return;
                      CanvasStampingEngine.stampTopicKnowledgeGraph(
                        editor,
                        currentInput || plan.title,
                        plan.conceptId || 'math_linear_functions'
                      );
                    }}
                  />

                  {plan.variables.length > 0 && (
                    <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                        Variables & Dimensions
                      </div>
                      <div className="space-y-1 font-mono text-[11px]">
                        {plan.variables.map((v, i) => (
                          <div
                            key={i}
                            className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-cyan-400">{v.symbol}</span>
                              <span className="text-slate-300 font-sans text-[11px]">{v.name}</span>
                            </div>
                            <span className="text-slate-400 text-[10px]">{v.unit || 'unitless'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {plan.assumptions.length > 0 && (
                    <div className="p-3 rounded-xl border bg-amber-950/20 border-amber-500/20 space-y-1">
                      <div className="flex items-center space-x-1.5 text-amber-400 font-semibold text-xs">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Boundary Assumptions & Conditions</span>
                      </div>
                      <ul className="space-y-0.5 text-[11px] text-slate-300">
                        {plan.assumptions.map((a, i) => (
                          <li key={i} className="flex items-start gap-1.5">
                            <span className="text-amber-400">•</span>
                            <span>{a}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: DERIVE */}
              {activeTab === 'derive' && (
                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                        <Compass className="w-3.5 h-3.5" />
                        <span>
                          {plan.category === 'concept'
                            ? 'Structural & Domain Breakdown'
                            : 'Step-by-Step Derivation & Reasoning'}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono">
                        Verified ✓
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{plan.derivationSummary}</p>

                    <div className="space-y-2 pt-1">
                      {plan.derivationSteps.map((s) => (
                        <div
                          key={s.stepNumber}
                          className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-cyan-400">Step {s.stepNumber}</span>
                            <span className="font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              {s.expression}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300">{s.explanation}</p>
                          <p className="text-[10px] text-slate-500 italic">Rationale: {s.rationale}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: VISUALIZE */}
              {activeTab === 'visualize' && renderVisualizerContent()}

              {/* TAB 4: EXPERIMENT */}
              {activeTab === 'experiment' && (
                <div className="space-y-3">
                  {/* Mode Selector */}
                  <div className="flex items-center justify-between p-1 rounded-xl bg-slate-900/90 border border-slate-800">
                    <div className="grid grid-cols-3 gap-1 w-full text-xs font-semibold">
                      <button
                        type="button"
                        onClick={() => setExperimentViewMode('whatif')}
                        className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          experimentViewMode === 'whatif'
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <GitCompare className="w-3.5 h-3.5 text-violet-300" />
                        <span>What-If Engine</span>
                        <span className="px-1 py-0.2 rounded-full text-[8px] bg-violet-400/20 text-violet-200 border border-violet-400/30">
                          Step 4
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExperimentViewMode('lab')}
                        className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          experimentViewMode === 'lab'
                            ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-md shadow-violet-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-violet-300" />
                        <span>Experiment Lab</span>
                        <span className="px-1 py-0.2 rounded-full text-[8px] bg-violet-400/20 text-violet-200 border border-violet-400/30">
                          Step 1
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setExperimentViewMode('sliders')}
                        className={`py-1.5 px-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                          experimentViewMode === 'sliders'
                            ? 'bg-slate-800 text-cyan-400 shadow-md border border-cyan-500/30'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Sliders className="w-3.5 h-3.5" />
                        <span>Quick Sliders</span>
                      </button>
                    </div>
                  </div>

                  {experimentViewMode === 'whatif' ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-1 min-h-[500px]">
                      <WhatIfScenarioView
                        initialExperimentId={
                          ExperimentCatalogueService.matchByTopic(currentInput)?.id ||
                          (plan.visualizationPlan?.rendererType === 'pendulum_simulation'
                            ? 'exp_harmonic_pendulum'
                            : plan.visualizationPlan?.rendererType === 'physics_vector_simulator'
                            ? 'exp_newton_second_law'
                            : 'exp_projectile_motion')
                        }
                        onStampToCanvas={handleStampToCanvas}
                      />
                    </div>
                  ) : experimentViewMode === 'lab' ? (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-1">
                      <ExperimentLabView
                        initialExperimentId={
                          ExperimentCatalogueService.matchByTopic(currentInput)?.id ||
                          (plan.visualizationPlan?.rendererType === 'pendulum_simulation'
                            ? 'exp_harmonic_pendulum'
                            : plan.visualizationPlan?.rendererType === 'physics_vector_simulator'
                            ? 'exp_newton_second_law'
                            : 'exp_projectile_motion')
                        }
                        initialState={experimentLabState}
                        onStateChange={(newState: any) => {
                          setExperimentLabState(newState);
                          triggerAutoSave(false, { experimentLabState: newState });
                        }}
                        editor={editor}
                      />
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border bg-slate-900/60 border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                          <Sliders className="w-3.5 h-3.5" />
                          <span>Manipulate Variables & Parameters</span>
                        </div>
                        <button
                          onClick={() =>
                            setExperimentState(
                              InteractiveExplorationEngine.resetToDefaults(plan)
                            )
                          }
                          className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset</span>
                        </button>
                      </div>

                      {/* Parameter Sliders */}
                      {plan.interactiveParameters.length > 0 ? (
                        <div className="space-y-2.5">
                          {plan.interactiveParameters.map((p) => {
                            const currentVal = experimentState.parameters[p.id] ?? p.value;
                            return (
                              <div key={p.id} className="space-y-1">
                                <div className="flex items-center justify-between text-xs">
                                  <span className="font-medium text-slate-200">
                                    {p.label} ({p.symbol})
                                  </span>
                                  <span className="font-mono text-cyan-400 font-bold">
                                    {currentVal} {p.unit || ''}
                                  </span>
                                </div>
                                <input
                                  type="range"
                                  min={p.min}
                                  max={p.max}
                                  step={p.step}
                                  value={currentVal}
                                  onChange={(e) => handleParamChange(p.id, parseFloat(e.target.value))}
                                  className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 text-xs text-slate-400 text-center">
                          This topic is a conceptual knowledge model (no numerical simulation variables required).
                        </div>
                      )}

                      {/* Live Outcome Box */}
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-cyan-500/30 text-xs space-y-1">
                        <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                          Live Recalculation Output:
                        </span>
                        <div className="font-mono font-bold text-emerald-400">
                          {experimentState.calculatedOutputs.display}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: MASTER */}
              {activeTab === 'master' && renderPracticeContent()}
            </div>
          );
        })()}
      </div>

      {/* Step 6: Learning History & Resume Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Learning History & Saved Sessions</h3>
              </div>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setDeleteConfirmId(null);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                title="Close"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Sub-header info */}
            <div className="px-4 py-2 bg-slate-950/30 border-b border-slate-800/60 text-[11px] text-slate-400 flex items-center justify-between">
              <span>Local browser persistence • Auto-saved</span>
              <span className="font-mono text-cyan-400">{sessionHistory.length} saved topic{sessionHistory.length === 1 ? '' : 's'}</span>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
              {sessionHistory.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-xs space-y-1">
                  <p>No saved learning sessions found.</p>
                  <p className="text-[10px] text-slate-600">Explore any topic to begin tracking your lessons.</p>
                </div>
              ) : (
                sessionHistory.map((s) => {
                  const isCurrent = s.primaryTopic.toLowerCase() === currentInput.toLowerCase();
                  const isConfirming = deleteConfirmId === s.id;
                  const stepNum = ([
                    'concept_meaning',
                    'why_it_matters',
                    'prerequisites',
                    'step_by_step',
                    'worked_example',
                    'interactive_exploration',
                    'practice_exercise',
                    'recap',
                  ] as GuidedLessonStep[]).indexOf(s.currentLessonStep) + 1;

                  return (
                    <div
                      key={s.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-cyan-950/30 border-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white truncate">
                              {s.primaryTopic}
                            </span>
                            {isCurrent && (
                              <span className="px-1.5 py-0.2 rounded bg-cyan-900/60 text-cyan-300 text-[9px] font-semibold border border-cyan-500/30">
                                Active
                              </span>
                            )}
                            {s.isCompleted ? (
                              <span className="flex items-center gap-0.5 px-1.5 py-0.2 rounded bg-emerald-950/60 text-emerald-300 text-[9px] font-semibold border border-emerald-500/30">
                                <CheckCircle className="w-2.5 h-2.5" />
                                Completed
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.2 rounded bg-indigo-950/60 text-indigo-300 text-[9px] font-semibold border border-indigo-500/30">
                                Step {stepNum || 1} / 8
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-400">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(s.updatedAt || s.lastOpenedAt).toLocaleDateString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {s.practiceAttempts?.totalScore !== undefined && s.practiceAttempts.totalScore > 0 && (
                              <span className="text-amber-300 font-mono">
                                Practice: {s.practiceAttempts.totalScore} pts
                              </span>
                            )}
                            {s.simulationState?.parameters && Object.keys(s.simulationState.parameters).length > 0 && (
                              <span className="text-slate-500 font-mono text-[9px]">
                                {Object.entries(s.simulationState.parameters).map(([k, v]) => `${k}=${v}`).join(', ')}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {!isConfirming ? (
                            <>
                              <button
                                onClick={() => {
                                  setShowHistoryModal(false);
                                  applyTopic(s.primaryTopic);
                                }}
                                className="px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-[10px] transition-colors shadow-sm"
                              >
                                Resume
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(s.id)}
                                className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                                title="Delete session"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-600/50 p-1 rounded-lg">
                              <span className="text-[9px] text-rose-200 px-1 font-medium">Delete?</span>
                              <button
                                onClick={async () => {
                                  await LearningSessionPersistenceService.deleteSession(s.id);
                                  setDeleteConfirmId(null);
                                  const updated = await LearningSessionPersistenceService.listHistory();
                                  setSessionHistory(updated);
                                }}
                                className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[9px] font-bold"
                              >
                                Yes
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px]"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-[11px]">
              <span className="text-slate-500 text-[10px]">
                Sessions are stored locally on your device.
              </span>
              <button
                onClick={() => {
                  setShowHistoryModal(false);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 9: Visual Authoring Studio Modal */}
      <VisualAuthoringStudio
        isOpen={showStudio}
        onClose={() => setShowStudio(false)}
        onLoadLessonToWorkspace={(lesson) => {
          applyTopic(lesson.primaryTopic);
          setShowStudio(false);
        }}
      />

      {/* Step 11: Document Import & Multimodal Learning Modal */}
      <DocumentImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onLoadLessonToWorkspace={(topic) => {
          applyTopic(topic);
          setShowImportModal(false);
        }}
        onOpenAuthoringStudio={() => {
          setShowStudio(true);
          setShowImportModal(false);
        }}
      />

      {/* Step 12: Collaborative Study Groups Modal */}
      <StudyGroupsModal
        isOpen={showGroupsModal}
        onClose={() => setShowGroupsModal(false)}
        onLaunchLesson={(topic) => applyTopic(topic)}
      />
    </div>
  );
};

