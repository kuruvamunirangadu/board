'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Compass, 
  ArrowLeft, 
  CheckCircle2, 
  Circle, 
  Lock, 
  AlertCircle, 
  Sparkles, 
  HelpCircle, 
  Activity, 
  BookOpen, 
  RotateCcw, 
  Zap, 
  ArrowRight, 
  X, 
  Check, 
  Layers, 
  TrendingUp,
  Search
} from 'lucide-react';
import { 
  Concept, 
  LearningGoal, 
  LearningPath, 
  LearnerConceptState, 
  RecommendationResult, 
  LearnerConceptStatus 
} from '@/types/learning-path';
import { ConceptDependencyGraph } from '@/features/learning-paths/concept-graph';
import { AdaptiveRecommendationEngine } from '@/features/learning-paths/recommendation-engine';
import { LearningPathGenerator } from '@/features/learning-paths/path-generator';
import { PENDULUM_CONCEPTS, PENDULUM_DEPENDENCIES } from '@/features/learning-paths/curated-paths';
import { learningPathPersistence } from '@/lib/persistence/learning-path-persistence';
import { sessionPersistence } from '@/lib/persistence';
import { InteractiveTopicKnowledgeGraphView } from '@/components/learning/InteractiveTopicKnowledgeGraphView';

interface LearningPathViewProps {
  initialGoal?: string;
  isImmersive?: boolean;
}

export const LearningPathView: React.FC<LearningPathViewProps> = ({
  initialGoal = 'Learn how a pendulum works',
  isImmersive = false,
}) => {
  const router = useRouter();

  const [goal, setGoal] = useState<LearningGoal | null>(null);
  const [path, setPath] = useState<LearningPath | null>(null);
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [learnerStates, setLearnerStates] = useState<Record<string, LearnerConceptState>>({});
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [graph, setGraph] = useState<ConceptDependencyGraph | null>(null);

  const [searchGoalText, setSearchGoalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Concept Modal State
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // Initialize or Load Path
  const loadOrGeneratePath = async (goalQuery: string) => {
    setIsLoading(true);
    try {
      const activePathId = await learningPathPersistence.getActivePathId();
      let pathData: LearningPath | null = null;
      let goalData: LearningGoal | null = null;

      if (activePathId && !goalQuery) {
        pathData = await learningPathPersistence.getLearningPath(activePathId);
        if (pathData) {
          goalData = await learningPathPersistence.getGoal(pathData.goalId);
        }
      }

      if (!pathData || !goalData || goalQuery) {
        const generated = await LearningPathGenerator.generatePath(goalQuery || initialGoal);
        goalData = generated.goal;
        pathData = generated.path;
        await learningPathPersistence.saveGoal(goalData);
        await learningPathPersistence.saveLearningPath(pathData);
        await learningPathPersistence.saveConcepts(generated.concepts);
      }

      const loadedConcepts = PENDULUM_CONCEPTS; // Default baseline concepts
      const loadedGraph = new ConceptDependencyGraph(loadedConcepts, pathData.dependencies || PENDULUM_DEPENDENCIES);
      const savedStates = await learningPathPersistence.getLearnerStates(pathData.id);

      setGoal(goalData);
      setPath(pathData);
      setConcepts(loadedConcepts);
      setGraph(loadedGraph);
      setLearnerStates(savedStates);

      const nextRec = AdaptiveRecommendationEngine.getNextRecommendation(
        loadedGraph,
        savedStates,
        goalData,
        pathData
      );
      setRecommendation(nextRec);
    } catch (err) {
      console.error('Failed to load learning path', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrGeneratePath('');
  }, []);

  const handleGoalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchGoalText.trim()) return;
    loadOrGeneratePath(searchGoalText.trim());
    setSearchGoalText('');
  };

  const handleOpenConcept = (concept: Concept) => {
    setSelectedConcept(concept);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowHint(false);

    // If concept was 'not_started', mark 'in_progress'
    if (path && graph && goal) {
      const currentState = learnerStates[concept.id];
      if (!currentState || currentState.status === 'not_started') {
        const updated: LearnerConceptState = {
          conceptId: concept.id,
          status: 'in_progress',
          assessmentAttempts: currentState?.assessmentAttempts || [],
          recentActivityTimestamp: Date.now(),
          reviewRecommended: false,
          evidenceNotes: [`Exploration started on ${new Date().toLocaleDateString()}`],
        };
        const newStates = { ...learnerStates, [concept.id]: updated };
        setLearnerStates(newStates);
        learningPathPersistence.saveLearnerStates(path.id, newStates);

        // Record activity in active session
        sessionPersistence.recordLearningActivity('workspace-default', {
          sessionId: 'workspace-default',
          activityType: 'concept_explained',
          title: `Started Concept: ${concept.title}`,
          relatedObjectId: concept.id,
        }).catch(() => {});

        const updatedRec = AdaptiveRecommendationEngine.getNextRecommendation(
          graph,
          newStates,
          goal,
          path
        );
        setRecommendation(updatedRec);
      }
    }
  };

  const handleKnowledgeCheckSubmit = () => {
    if (selectedOption === null || !selectedConcept || !selectedConcept.knowledgeCheck || !path || !graph || !goal) {
      return;
    }

    const check = selectedConcept.knowledgeCheck;
    const isCorrect = selectedOption === check.correctIndex;
    setIsSubmitted(true);

    const currentState = learnerStates[selectedConcept.id];
    const updatedState = AdaptiveRecommendationEngine.applyAssessmentResult(
      currentState,
      selectedConcept.id,
      `qc-${selectedConcept.id}`,
      isCorrect,
      selectedOption
    );

    const newStates = { ...learnerStates, [selectedConcept.id]: updatedState };
    setLearnerStates(newStates);
    learningPathPersistence.saveLearnerStates(path.id, newStates);

    // Record activity in session persistence
    sessionPersistence.recordLearningActivity('workspace-default', {
      sessionId: 'workspace-default',
      activityType: 'knowledge_check_attempt',
      title: `Knowledge Check: ${selectedConcept.title} (${isCorrect ? 'Passed' : 'Missed'})`,
      metadata: {
        conceptName: selectedConcept.title,
        isCorrect,
      },
    }).catch(() => {});

    // Recalculate adaptive recommendations
    const updatedRec = AdaptiveRecommendationEngine.getNextRecommendation(
      graph,
      newStates,
      goal,
      path
    );
    setRecommendation(updatedRec);
  };

  // Progress metrics
  const completedCount = concepts.filter((c) => {
    const st = learnerStates[c.id];
    return st && (st.status === 'completed' || st.status === 'practiced');
  }).length;
  const progressPercent = concepts.length > 0 ? Math.round((completedCount / concepts.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Active Canvas</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              href="/library"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Session Library
            </Link>
          </div>
        </div>

        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-950/30">
              <Compass className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-100">
                  Adaptive Learning Path
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-medium">
                  Milestone 9
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Structured concept dependency graph with evidence-based progression and visual recommendations.
              </p>
            </div>
          </div>

          {/* Goal Search Bar */}
          <form onSubmit={handleGoalSubmit} className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchGoalText}
              onChange={(e) => setSearchGoalText(e.target.value)}
              placeholder="e.g. Learn pendulum dynamics..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </form>
        </div>

        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Evaluating concept dependency graph & learner state...</p>
          </div>
        ) : goal && path ? (
          <>
            {/* Goal Overview Card */}
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  {goal.subject} • Target Goal
                </span>
                <span className="text-xs font-mono font-semibold text-emerald-400">
                  {progressPercent}% Complete ({completedCount}/{concepts.length} Concepts)
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-100">{goal.title}</h2>
              <p className="text-xs text-slate-400">{goal.description}</p>

              {/* Progress Bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* ADAPTIVE RECOMMENDATION HERO BANNER */}
            {recommendation && (
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  recommendation.isGoalAchieved
                    ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-100 shadow-emerald-950/40 shadow-xl'
                    : recommendation.activityType === 'review'
                    ? 'bg-amber-950/30 border-amber-500/40 text-amber-100 shadow-amber-950/40 shadow-xl'
                    : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-100 shadow-cyan-950/40 shadow-xl'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1.5 flex-1 pr-4">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                      <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                        Adaptive Learning Recommendation
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-100">{recommendation.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed">{recommendation.rationale}</p>

                    {/* Evidence Chips */}
                    {recommendation.evidence.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {recommendation.evidence.map((ev, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/60 border border-slate-700/60 text-slate-300 font-mono"
                          >
                            ✓ {ev}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const target = concepts.find((c) => c.id === recommendation.recommendedConceptId);
                      if (target) handleOpenConcept(target);
                    }}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shrink-0 shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
                  >
                    <span>Take Action</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* INTERACTIVE TOPIC KNOWLEDGE GRAPH */}
            <InteractiveTopicKnowledgeGraphView
              topicQuery={goal?.title || 'pendulum'}
              onSelectTopic={(topic) => {
                const matched = concepts.find(
                  (c) => c.title.toLowerCase().includes(topic.toLowerCase()) || topic.toLowerCase().includes(c.title.toLowerCase())
                );
                if (matched) {
                  handleOpenConcept(matched);
                } else {
                  router.push(`/?topic=${encodeURIComponent(topic)}`);
                }
              }}
            />

            {/* CONCEPT ROADMAP / DEPENDENCY LIST */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Ordered Concept Dependencies & Readiness</span>
                <span className="text-slate-500 font-normal">Topologically sorted sequence</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {concepts.map((concept, idx) => {
                  const state = learnerStates[concept.id];
                  const status: LearnerConceptStatus = state?.status || 'not_started';
                  const readiness = graph?.explainReadiness(concept.id, learnerStates) || {
                    isReady: true,
                    explanation: '',
                    blocking: [],
                  };

                  let statusBadge = (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono flex items-center space-x-1">
                      <Circle className="w-2.5 h-2.5" />
                      <span>Not Started</span>
                    </span>
                  );

                  if (status === 'completed' || status === 'practiced') {
                    statusBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono flex items-center space-x-1">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        <span>Practiced</span>
                      </span>
                    );
                  } else if (status === 'in_progress') {
                    statusBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono flex items-center space-x-1">
                        <Activity className="w-2.5 h-2.5" />
                        <span>In Progress</span>
                      </span>
                    );
                  } else if (status === 'ready_to_review' || state?.reviewRecommended) {
                    statusBadge = (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-mono flex items-center space-x-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        <span>Ready to Review</span>
                      </span>
                    );
                  }

                  return (
                    <div
                      key={concept.id}
                      onClick={() => handleOpenConcept(concept)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-xl ${
                        !readiness.isReady && status === 'not_started'
                          ? 'bg-slate-950/40 border-slate-900 opacity-60 hover:opacity-80'
                          : 'bg-slate-900/80 border-slate-800 hover:border-cyan-500/50 hover:bg-slate-900'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono text-cyan-400 font-bold">
                            Stage #{idx + 1}
                          </span>
                          {statusBadge}
                        </div>

                        <h3 className="font-bold text-sm text-slate-100 flex items-center space-x-1.5">
                          {!readiness.isReady && status === 'not_started' && (
                            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          )}
                          <span>{concept.title}</span>
                        </h3>

                        <p className="text-xs text-slate-400 line-clamp-2">{concept.description}</p>
                      </div>

                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                        <span>{concept.estimatedMinutes} mins • {concept.difficultyLevel}</span>
                        <span className="text-cyan-400 font-semibold group-hover:translate-x-0.5 transition-transform">
                          Inspect &rarr;
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : null}
      </div>

      {/* INTERACTIVE CONCEPT MODAL */}
      {selectedConcept && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fadeIn">
          <div className="w-full max-w-xl max-h-[90vh] rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 flex flex-col overflow-hidden space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">{selectedConcept.title}</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedConcept.difficultyLevel} • ~{selectedConcept.estimatedMinutes} min effort
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedConcept(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1 text-xs">
              {/* Description */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 leading-relaxed text-slate-300">
                {selectedConcept.description}
              </div>

              {/* Learning Objectives */}
              <div className="space-y-1.5">
                <div className="font-bold text-slate-300">Learning Objectives</div>
                <div className="space-y-1">
                  {selectedConcept.learningObjectives.map((obj, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center space-x-2"
                    >
                      <Check className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      <span>{obj}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Visual Learning Simulation CTA */}
              {selectedConcept.suggestedSimulations && selectedConcept.suggestedSimulations.length > 0 && (
                <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
                    <div>
                      <div className="font-bold text-xs text-slate-200">Interactive Simulation Available</div>
                      <div className="text-[10px] text-slate-400">
                        Explore {selectedConcept.suggestedSimulations[0]} dynamics on the live board
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/"
                    className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-md"
                  >
                    Open Canvas &rarr;
                  </Link>
                </div>
              )}

              {/* Interactive Knowledge Check */}
              {selectedConcept.knowledgeCheck && (
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-purple-400 font-bold">
                      <HelpCircle className="w-4 h-4" />
                      <span>Concept Knowledge Check</span>
                    </div>
                    {isSubmitted && (
                      <button
                        onClick={() => {
                          setSelectedOption(null);
                          setIsSubmitted(false);
                          setShowHint(false);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Retry</span>
                      </button>
                    )}
                  </div>

                  <p className="font-medium text-slate-200">{selectedConcept.knowledgeCheck.question}</p>

                  <div className="space-y-1.5">
                    {selectedConcept.knowledgeCheck.options.map((opt, idx) => {
                      const isSelected = selectedOption === idx;
                      const isCorrect = idx === selectedConcept.knowledgeCheck?.correctIndex;

                      let style = 'bg-slate-900/70 border-slate-800 hover:bg-slate-800 text-slate-300';
                      if (isSubmitted) {
                        if (isCorrect) {
                          style = 'bg-emerald-950/70 border-emerald-500 text-emerald-200 font-semibold';
                        } else if (isSelected && !isCorrect) {
                          style = 'bg-rose-950/70 border-rose-500 text-rose-200';
                        } else {
                          style = 'bg-slate-900/30 border-slate-800/40 text-slate-500 opacity-50';
                        }
                      } else if (isSelected) {
                        style = 'bg-cyan-950/60 border-cyan-500 text-cyan-200 font-semibold';
                      }

                      return (
                        <button
                          key={idx}
                          disabled={isSubmitted}
                          onClick={() => setSelectedOption(idx)}
                          className={`w-full p-2.5 rounded-xl border text-left text-xs transition-all flex items-center justify-between ${style}`}
                        >
                          <span>{opt}</span>
                          {isSubmitted && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {!isSubmitted ? (
                    <div className="flex items-center justify-between pt-1">
                      {selectedConcept.knowledgeCheck.hint && (
                        <div>
                          {showHint ? (
                            <span className="text-[11px] text-amber-300 italic">
                              💡 {selectedConcept.knowledgeCheck.hint}
                            </span>
                          ) : (
                            <button
                              onClick={() => setShowHint(true)}
                              className="text-[10px] text-amber-400/80 hover:text-amber-300 underline"
                            >
                              Need a hint?
                            </button>
                          )}
                        </div>
                      )}
                      <button
                        onClick={handleKnowledgeCheckSubmit}
                        disabled={selectedOption === null}
                        className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs ml-auto disabled:opacity-40"
                      >
                        Submit Check
                      </button>
                    </div>
                  ) : (
                    <div
                      className={`p-3 rounded-xl text-xs leading-relaxed ${
                        selectedOption === selectedConcept.knowledgeCheck.correctIndex
                          ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-200'
                          : 'bg-rose-950/40 border border-rose-500/30 text-rose-200'
                      }`}
                    >
                      <p className="font-bold mb-0.5">
                        {selectedOption === selectedConcept.knowledgeCheck.correctIndex
                          ? '🎉 Correct! Concept marked as Practiced.'
                          : '❌ Review Recommended.'}
                      </p>
                      <p>{selectedConcept.knowledgeCheck.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

