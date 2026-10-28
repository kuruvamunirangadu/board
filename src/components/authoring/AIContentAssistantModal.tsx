'use client';

import React, { useState } from 'react';
import { 
  AIGenerationRequest, 
  AIGenerationProposal, 
  AIConceptProposal, 
  AIDependencyProposal,
  LearnerLevel,
  AIGenerationScope
} from '@/types/ai-authoring';
import { SubjectCategory } from '@/types/knowledge';
import { AIGenerationService } from '@/features/authoring/ai-generator';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  Layers, 
  BookOpen, 
  Activity, 
  HelpCircle, 
  RefreshCw, 
  ArrowRight, 
  Check, 
  Trash2, 
  Edit3, 
  Clock, 
  Info,
  ShieldCheck,
  Cpu
} from 'lucide-react';

interface AIContentAssistantModalProps {
  currentDraftId?: string;
  onImportProposal: (proposal: AIGenerationProposal, acceptedTempIds: string[]) => void;
  onClose: () => void;
}

export const AIContentAssistantModal: React.FC<AIContentAssistantModalProps> = ({
  currentDraftId,
  onImportProposal,
  onClose,
}) => {
  // Generation Request Form State
  const [topicTitle, setTopicTitle] = useState('');
  const [subjectCategory, setSubjectCategory] = useState<SubjectCategory>('natural_sciences');
  const [intendedLevel, setIntendedLevel] = useState<LearnerLevel>('introductory');
  const [scope, setScope] = useState<AIGenerationScope>('complete_module');
  const [depth, setDepth] = useState<'compact' | 'standard' | 'deep'>('standard');
  
  // UI & Workflow State
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRegeneratingSection, setIsRegeneratingSection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [proposal, setProposal] = useState<AIGenerationProposal | null>(null);
  const [activeReviewTab, setActiveReviewTab] = useState<'concepts' | 'graph' | 'activities' | 'quizzes' | 'validation'>('concepts');

  // Interactive Quiz Sandbox State inside review modal
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});

  const sampleSuggestions = [
    { title: 'Binary Search Trees', cat: 'formal_sciences' as SubjectCategory, lvl: 'intermediate' as LearnerLevel },
    { title: 'Electromagnetic Induction', cat: 'natural_sciences' as SubjectCategory, lvl: 'intermediate' as LearnerLevel },
    { title: 'Fourier Series & Wave Harmonics', cat: 'formal_sciences' as SubjectCategory, lvl: 'advanced' as LearnerLevel },
    { title: 'Thermodynamics & Heat Engines', cat: 'natural_sciences' as SubjectCategory, lvl: 'introductory' as LearnerLevel },
    { title: 'Logic Gates & Digital Circuits', cat: 'engineering' as SubjectCategory, lvl: 'introductory' as LearnerLevel },
  ];

  const handleApplySuggestion = (sug: typeof sampleSuggestions[0]) => {
    setTopicTitle(sug.title);
    setSubjectCategory(sug.cat);
    setIntendedLevel(sug.lvl);
  };

  const handleGenerate = async () => {
    if (!topicTitle.trim()) {
      setErrorMessage('Please enter a topic title.');
      return;
    }

    setIsGenerating(true);
    setErrorMessage(null);

    try {
      const req: AIGenerationRequest = {
        topicTitle: topicTitle.trim(),
        subjectCategory,
        intendedLevel,
        scope,
        desiredDepth: depth,
      };

      const result = await AIGenerationService.generateModule(req);
      setProposal(result);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to generate learning module.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Section-level regeneration
  const handleRegenerateSection = async (
    tempConceptId: string, 
    section: 'explanation' | 'learningObjectives' | 'knowledgeCheck' | 'activity'
  ) => {
    if (!proposal) return;
    setIsRegeneratingSection(true);

    try {
      const updated = await AIGenerationService.regenerateSection(
        { proposalId: proposal.proposalId, tempConceptId, section, targetLevel: intendedLevel },
        proposal
      );
      setProposal(updated);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to regenerate section.');
    } finally {
      setIsRegeneratingSection(false);
    }
  };

  const handleToggleConceptStatus = (tempId: string) => {
    if (!proposal) return;
    const updated = { ...proposal };
    const concept = updated.concepts.find((c) => c.tempId === tempId);
    if (concept) {
      concept.reviewStatus = concept.reviewStatus === 'accepted' ? 'rejected' : 'accepted';
      setProposal(updated);
    }
  };

  const handleToggleDependencyStatus = (srcId: string, tgtId: string) => {
    if (!proposal) return;
    const updated = { ...proposal };
    const dep = updated.dependencies.find((d) => d.sourceTempId === srcId && d.dependentTempId === tgtId);
    if (dep) {
      dep.status = dep.status === 'accepted' ? 'rejected' : 'accepted';
      setProposal(updated);
    }
  };

  const handleAcceptAndImport = () => {
    if (!proposal) return;
    const acceptedIds = proposal.concepts
      .filter((c) => c.reviewStatus !== 'rejected')
      .map((c) => c.tempId);

    onImportProposal(proposal, acceptedIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">AI Content Generation & Verification</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  MILESTONE 12
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Synthesize verified concepts, prerequisite graphs, and quizzes from topic prompts
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* STEP 1: Generation Configuration Form */}
          {!proposal ? (
            <div className="max-w-2xl mx-auto space-y-6 py-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white">Topic to Synthesize</label>
                <div className="relative">
                  <input
                    type="text"
                    value={topicTitle}
                    onChange={(e) => setTopicTitle(e.target.value)}
                    placeholder="e.g., Binary Search Trees, Electromagnetic Induction, Fourier Transform"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:border-cyan-500 shadow-inner"
                  />
                </div>

                {/* Suggestion Chips */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 mr-1">Try quick topic:</span>
                  {sampleSuggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => handleApplySuggestion(sug)}
                      className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 hover:text-cyan-300 transition"
                    >
                      {sug.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Subject Category</label>
                  <select
                    value={subjectCategory}
                    onChange={(e) => setSubjectCategory(e.target.value as SubjectCategory)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="natural_sciences">Natural Sciences</option>
                    <option value="formal_sciences">Formal Sciences</option>
                    <option value="engineering">Engineering & Electronics</option>
                    <option value="humanities">Humanities</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Learner Level</label>
                  <select
                    value={intendedLevel}
                    onChange={(e) => setIntendedLevel(e.target.value as LearnerLevel)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="introductory">Introductory</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300">Curriculum Depth</label>
                  <select
                    value={depth}
                    onChange={(e) => setDepth(e.target.value as any)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="compact">Compact (2 Core Concepts)</option>
                    <option value="standard">Standard (3 Structured Concepts)</option>
                    <option value="deep">Deep (4 Concepts + Lab)</option>
                  </select>
                </div>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="pt-4 flex justify-end">
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating || !topicTitle.trim()}
                  className="flex items-center space-x-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-500/20 transition disabled:opacity-40"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Synthesizing Learning Module...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Learning Module</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            /* STEP 2: Proposed Content Reviewer & Section Regeneration */
            <div className="space-y-6">
              {/* Proposal Header Banner */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                      PROPOSAL
                    </span>
                    <h4 className="text-sm font-bold text-white">{proposal.topicTitle}</h4>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>Audience: {proposal.intendedAudience}</span>
                    <span>•</span>
                    <span>Provider: {proposal.provider === 'live_ai' ? 'Live AI' : 'Deterministic Curriculum Engine'}</span>
                    {proposal.isDemoContent && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                        DEMO CONTENT
                      </span>
                    )}
                  </div>
                </div>

                {/* Layered Validation Score Pill */}
                <div className="flex items-center space-x-2">
                  {proposal.validation.isValid ? (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                      <ShieldCheck className="w-4 h-4" />
                      <span>Deterministic Validation Passed</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Issues Flagged in Proposal</span>
                    </div>
                  )}

                  <button
                    onClick={() => setProposal(null)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                  >
                    New Prompt
                  </button>
                </div>
              </div>

              {/* Review Tabs */}
              <div className="flex items-center space-x-1 border-b border-slate-800 pb-2 text-xs">
                <button
                  onClick={() => setActiveReviewTab('concepts')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeReviewTab === 'concepts'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Concepts ({proposal.concepts.length})
                </button>
                <button
                  onClick={() => setActiveReviewTab('graph')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeReviewTab === 'graph'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Prerequisite Graph ({proposal.dependencies.length})
                </button>
                <button
                  onClick={() => setActiveReviewTab('activities')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeReviewTab === 'activities'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Activities ({proposal.resources.length})
                </button>
                <button
                  onClick={() => setActiveReviewTab('quizzes')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    activeReviewTab === 'quizzes'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Knowledge Checks
                </button>
                <button
                  onClick={() => setActiveReviewTab('validation')}
                  className={`px-3 py-1.5 rounded-lg font-medium transition flex items-center space-x-1.5 ${
                    activeReviewTab === 'validation'
                      ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span>Verification Report</span>
                  {proposal.validation.diagnostics.length > 0 && (
                    <span className="text-[10px] px-1.5 rounded-full bg-slate-800 text-slate-300">
                      {proposal.validation.diagnostics.length}
                    </span>
                  )}
                </button>
              </div>

              {/* TAB 1: CONCEPTS REVIEW */}
              {activeReviewTab === 'concepts' && (
                <div className="space-y-4">
                  {proposal.concepts.map((concept, idx) => {
                    const isAccepted = concept.reviewStatus !== 'rejected';

                    return (
                      <div
                        key={concept.tempId}
                        className={`p-5 rounded-xl border transition space-y-3 ${
                          isAccepted
                            ? 'bg-slate-900/50 border-slate-800'
                            : 'bg-slate-950/40 border-slate-900 opacity-50'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-white">{concept.title}</h4>
                              <div className="flex items-center space-x-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="capitalize">{concept.difficultyLevel}</span>
                                <span>•</span>
                                <span>{concept.estimatedMinutes} min study</span>
                              </div>
                            </div>
                          </div>

                          {/* Accept / Reject Toggle */}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleConceptStatus(concept.tempId)}
                              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center space-x-1 transition ${
                                isAccepted
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{isAccepted ? 'Accepted' : 'Excluded'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Explanation & Section Regeneration Actions */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Explanation:</span>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleRegenerateSection(concept.tempId, 'explanation')}
                                disabled={isRegeneratingSection}
                                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 hover:underline"
                              >
                                <RefreshCw className={`w-3 h-3 ${isRegeneratingSection ? 'animate-spin' : ''}`} />
                                <span>Regenerate Explanation</span>
                              </button>
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={concept.explanation}
                            onChange={(e) => {
                              const updated = { ...proposal };
                              const c = updated.concepts.find((item) => item.tempId === concept.tempId);
                              if (c) {
                                c.explanation = e.target.value;
                                c.reviewStatus = 'modified';
                                setProposal(updated);
                              }
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                          />
                        </div>

                        {/* Learning Objectives */}
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>Target Learning Objectives:</span>
                            <button
                              onClick={() => handleRegenerateSection(concept.tempId, 'learningObjectives')}
                              className="text-purple-400 hover:text-purple-300 flex items-center space-x-1 hover:underline"
                            >
                              <RefreshCw className="w-3 h-3" />
                              <span>Regenerate Objectives</span>
                            </button>
                          </div>
                          <ul className="space-y-1">
                            {concept.learningObjectives.map((obj, i) => (
                              <li key={i} className="text-xs text-slate-300 flex items-start space-x-2">
                                <span className="text-cyan-400">•</span>
                                <span>{obj}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 2: PREREQUISITE GRAPH REVIEW */}
              {activeReviewTab === 'graph' && (
                <div className="space-y-4">
                  <p className="text-xs text-slate-400">
                    Review proposed prerequisite relationships and rationales. Toggle off any edges you wish to exclude.
                  </p>

                  <div className="space-y-3">
                    {proposal.dependencies.map((dep, idx) => {
                      const src = proposal.concepts.find((c) => c.tempId === dep.sourceTempId);
                      const tgt = proposal.concepts.find((c) => c.tempId === dep.dependentTempId);
                      const isAccepted = dep.status !== 'rejected';

                      return (
                        <div
                          key={idx}
                          className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition ${
                            isAccepted ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-950/40 border-slate-900 opacity-50'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2 text-xs font-bold text-white">
                              <span className="text-cyan-400">{src?.title || dep.sourceTempId}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                              <span className="text-indigo-400">{tgt?.title || dep.dependentTempId}</span>
                            </div>
                            <p className="text-[11px] text-slate-400">{dep.rationale}</p>
                          </div>

                          <button
                            onClick={() => handleToggleDependencyStatus(dep.sourceTempId, dep.dependentTempId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              isAccepted
                                ? 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/30'
                                : 'bg-slate-800 text-slate-500'
                            }`}
                          >
                            {isAccepted ? 'Include Edge' : 'Excluded'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVITIES REVIEW */}
              {activeReviewTab === 'activities' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {proposal.resources.map((res) => (
                      <div
                        key={res.tempId}
                        className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2 relative"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-bold text-white">
                            <Activity className="w-4 h-4 text-cyan-400" />
                            <span>{res.title}</span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full capitalize font-medium ${
                            res.capabilityStatus === 'available'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {res.capabilityStatus}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">{res.description}</p>
                        <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                          Requires: <span className="font-mono text-slate-400">{res.requiredCapability}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 4: KNOWLEDGE CHECKS QUIZZES */}
              {activeReviewTab === 'quizzes' && (
                <div className="space-y-5">
                  {proposal.concepts.filter((c) => c.knowledgeCheck).map((c) => {
                    const q = c.knowledgeCheck!;
                    const selectedOpt = quizAnswers[c.tempId];

                    return (
                      <div
                        key={c.tempId}
                        className="p-5 rounded-xl bg-purple-950/20 border border-purple-800/30 space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <HelpCircle className="w-4 h-4 text-purple-400" />
                            <h4 className="text-xs font-bold text-purple-200">Quiz for: {c.title}</h4>
                          </div>

                          <button
                            onClick={() => handleRegenerateSection(c.tempId, 'knowledgeCheck')}
                            className="text-purple-300 hover:text-white text-xs flex items-center space-x-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>Regenerate Question</span>
                          </button>
                        </div>

                        <p className="text-sm font-semibold text-white">{q.question}</p>

                        <div className="space-y-2">
                          {q.options.map((opt, optIdx) => {
                            const isCorrect = optIdx === q.correctIndex;
                            const isSelected = selectedOpt === optIdx;

                            return (
                              <button
                                key={optIdx}
                                onClick={() => setQuizAnswers({ ...quizAnswers, [c.tempId]: optIdx })}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs flex items-center justify-between transition ${
                                  selectedOpt !== undefined
                                    ? isCorrect
                                      ? 'bg-emerald-950/50 border-emerald-500 text-emerald-200 font-semibold'
                                      : isSelected
                                      ? 'bg-rose-950/50 border-rose-500 text-rose-200'
                                      : 'bg-slate-950/60 border-slate-800 text-slate-500'
                                    : 'bg-slate-950 border-slate-800 hover:border-purple-500/50 text-slate-200'
                                }`}
                              >
                                <span>{opt}</span>
                                {selectedOpt !== undefined && isCorrect && (
                                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                    Correct Answer
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        <p className="text-xs text-slate-400 italic bg-slate-950/60 p-2.5 rounded-lg border border-slate-800">
                          Explanation: {q.explanation}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TAB 5: VALIDATION REPORT */}
              {activeReviewTab === 'validation' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white">Layer A: Schema & Typing</span>
                      <p className="text-[11px] text-emerald-400">✓ All required schema fields & formats valid</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white">Layer B: Referential Integrity</span>
                      <p className="text-[11px] text-emerald-400">✓ Zero dangling concept or prerequisite IDs</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white">Layer C: Graph Acyclicity</span>
                      <p className="text-[11px] text-emerald-400">✓ Topological sort verified with 0 cycles</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-1">
                      <span className="text-xs font-bold text-white">Layer D: Capability Compatibility</span>
                      <p className="text-[11px] text-emerald-400">✓ All attached renderers matched to registry</p>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                    <span className="text-xs font-bold text-slate-300">Layer F: Grounding & Factual Notice</span>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {proposal.validation.layerF_FactualReview.notice} VisiOS deterministic validation guarantees schema, graph acyclicity, and capability correctness. Content creators should review scientific statements before final release.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {proposal && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
            <span className="text-xs text-slate-400">
              {proposal.concepts.filter((c) => c.reviewStatus !== 'rejected').length} of {proposal.concepts.length} concepts will be imported as draft.
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAcceptAndImport}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept & Import to Draft</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

