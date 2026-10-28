/**
 * VisiOS — Visual Authoring Studio
 * Step 9: Interactive UI for creating, editing, validating, previewing, and publishing
 * verified learning modules without writing arbitrary executable code.
 */

import React, { useState, useEffect } from 'react';
import {
  AuthoredLesson,
  AuthoredLessonStep,
  AuthoredVisualizationConfig,
  LessonStatus,
  LessonDifficulty,
  LessonValidationReport,
  RENDERER_AUTHORING_SCHEMAS,
} from '@/features/learning/AuthoringLessonTypes';
import { LessonLibraryService } from '@/features/learning/LessonLibraryService';
import { SubjectRegistry } from '@/features/learning/SubjectRegistry';
import { CanonicalRendererType } from '@/features/learning/VisualizationRegistry';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Trash2,
  Eye,
  Edit3,
  Save,
  Send,
  Layers,
  Sparkles,
  ChevronRight,
  HelpCircle,
  X,
  Wand2,
  RefreshCw,
  ShieldCheck,
  Check,
  FileCheck2,
  Upload,
  Share2,
  Users,
  Download,
} from 'lucide-react';
import { DocumentImportModal } from '@/components/documents/DocumentImportModal';
import { ShareLessonModal } from '@/components/collaboration/ShareLessonModal';
import { StudyGroupsModal } from '@/components/collaboration/StudyGroupsModal';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';
import { AIAssistedAuthoringService } from '@/features/learning/AIAssistedAuthoringService';
import {
  LessonVerificationPipeline,
  VerificationPipelineReport,
} from '@/features/learning/LessonVerificationPipeline';

interface VisualAuthoringStudioProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadLessonToWorkspace?: (lesson: AuthoredLesson) => void;
}

export const VisualAuthoringStudio: React.FC<VisualAuthoringStudioProps> = ({
  isOpen,
  onClose,
  onLoadLessonToWorkspace,
}) => {
  const [lessons, setLessons] = useState<AuthoredLesson[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'published'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeLesson, setActiveLesson] = useState<Partial<AuthoredLesson> | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isPreviewMode, setIsPreviewMode] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'metadata' | 'steps' | 'visualization' | 'practice' | 'preview'>('metadata');
  const [validationReport, setValidationReport] = useState<LessonValidationReport | null>(null);
  const [pipelineReport, setPipelineReport] = useState<VerificationPipelineReport | null>(null);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [isAiGenerating, setIsAiGenerating] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [aiTopicInput, setAiTopicInput] = useState<string>('');
  const [requestVersion, setRequestVersion] = useState<number>(0);
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [shareTargetLesson, setShareTargetLesson] = useState<AuthoredLesson | null>(null);
  const [showGroupsModal, setShowGroupsModal] = useState<boolean>(false);

  // Load lessons from storage
  const refreshLessons = async () => {
    const all = await LessonLibraryService.getAllLessons();
    setLessons(all);
  };

  const handleImportPackageFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const res = await LessonSharingService.importLessonPackage(text);
      if (res.success && res.data) {
        await refreshLessons();
        setStatusMessage({
          text: `Lesson "${res.data.title}" successfully verified and imported into library!`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: res.errorMessage || 'Failed to import lesson package.',
          type: 'error',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: err.message || 'Error reading lesson package file.',
        type: 'error',
      });
    } finally {
      e.target.value = '';
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshLessons();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter lessons
  const filteredLessons = lessons.filter((l) => {
    const matchesFilter = filterStatus === 'all' || l.status === filterStatus;
    const matchesSearch =
      !searchQuery.trim() ||
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.primaryTopic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleCreateNew = () => {
    const newLesson: Partial<AuthoredLesson> = {
      title: 'New Learning Module',
      primaryTopic: '',
      topicAliases: [],
      subjectId: 'computer_science',
      domain: 'computer_science',
      difficulty: 'beginner',
      learningObjectives: ['Understand foundational concept'],
      prerequisites: [],
      overview: '',
      motivation: '',
      assumptions: [],
      steps: [
        {
          id: 'step_1',
          stepNumber: 1,
          title: 'Concept Introduction',
          stepType: 'concept_meaning',
          content: 'Introduce the core definition and terminology.',
        },
      ],
      visualizationConfig: {
        rendererType: 'svg_schematic_fallback',
        title: 'Conceptual Schematic',
        description: 'Structured visual diagram illustrating module principles.',
        learningObjective: 'Observe component relationships',
        activeVariables: [],
        parameters: { diagramTitle: 'Conceptual Schematic' },
        interactionsAvailable: ['Inspect definitions'],
        expectedBehavior: 'Displays verified module relationships.',
      },
      workedExamples: [],
      practiceQuestions: [],
      status: 'draft',
      version: 1,
      isExpertReviewed: false,
    };
    setActiveLesson(newLesson);
    setIsEditing(true);
    setIsPreviewMode(false);
    setActiveTab('metadata');
    setValidationReport(null);
  };

  const handleEditLesson = (lesson: AuthoredLesson) => {
    setActiveLesson({ ...lesson });
    setIsEditing(true);
    setIsPreviewMode(false);
    setActiveTab('metadata');
    setValidationReport(null);
  };

  const handleValidate = () => {
    if (!activeLesson) return;
    const report = LessonLibraryService.validateLesson(activeLesson);
    setValidationReport(report);
    if (report.isValid) {
      setStatusMessage({ text: 'All structural requirements passed! Ready to publish.', type: 'success' });
    } else {
      setStatusMessage({ text: `Validation found ${report.errors.length} error(s). Please review below.`, type: 'error' });
    }
  };

  const handleSaveDraft = async () => {
    if (!activeLesson) return;
    try {
      const saved = await LessonLibraryService.saveDraft(activeLesson);
      setActiveLesson(saved);
      await refreshLessons();
      setStatusMessage({ text: `Draft saved successfully (v${saved.version}).`, type: 'success' });
    } catch (e: any) {
      setStatusMessage({ text: `Failed to save draft: ${e.message}`, type: 'error' });
    }
  };

  const handlePublish = async () => {
    if (!activeLesson || !activeLesson.id) {
      await handleSaveDraft();
    }
    if (!activeLesson?.id) return;

    try {
      const res = await LessonLibraryService.publishLesson(activeLesson.id);
      setValidationReport(res.report);

      if (res.success && res.lesson) {
        setActiveLesson(res.lesson);
        await refreshLessons();
        setStatusMessage({
          text: `Module published successfully as Version ${res.lesson.publishedVersion}! It is now available to students.`,
          type: 'success',
        });
      } else {
        setStatusMessage({
          text: `Cannot publish: ${res.report.errors.length} validation errors must be resolved.`,
          type: 'error',
        });
      }
    } catch (e: any) {
      setStatusMessage({ text: `Publish failed: ${e.message}`, type: 'error' });
    }
  };

  // AI-Assisted Generation & Verification Handlers
  const handleAiGenerateDraft = async (topicToGenerate: string) => {
    if (!topicToGenerate.trim()) return;
    setIsAiGenerating(true);
    const currentReqVer = requestVersion + 1;
    setRequestVersion(currentReqVer);
    try {
      const result = await AIAssistedAuthoringService.generateLessonDraft(topicToGenerate);
      // Guard against race conditions: verify this request is still the newest
      if (currentReqVer === requestVersion + 1) {
        setActiveLesson(result.lesson);
        setPipelineReport(result.verificationReport);
        setValidationReport({
          isValid: result.verificationReport.isValid,
          canPublish: result.verificationReport.canPublish,
          errors: result.verificationReport.errors.map((e) => ({
            field: e.field,
            message: e.message,
            severity: e.severity,
          })),
          warnings: result.verificationReport.warnings.map((w) => ({
            field: w.field,
            message: w.message,
            severity: w.severity,
          })),
        });
        setIsEditing(true);
        setShowAiModal(false);
        setStatusMessage({
          text: `AI Draft for "${result.lesson.title}" generated! Layered checks completed.`,
          type: 'success',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        text: `Failed to generate AI draft: ${err.message || 'Unknown error'}`,
        type: 'error',
      });
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleDeepVerify = () => {
    if (!activeLesson) return;
    const report = LessonVerificationPipeline.verify(activeLesson);
    setPipelineReport(report);
    setValidationReport({
      isValid: report.isValid,
      canPublish: report.canPublish,
      errors: report.errors.map((e) => ({
        field: e.field,
        message: e.message,
        severity: e.severity,
      })),
      warnings: report.warnings.map((w) => ({
        field: w.field,
        message: w.message,
        severity: w.severity,
      })),
    });
    setStatusMessage({
      type: report.isValid ? 'success' : 'error',
      text: report.isValid
        ? 'Deep verification passed across all layers! (Human expert review still required before publish).'
        : `Deep verification flagged ${report.errors.length} issue(s). See verification report card below.`,
    });
  };

  const handleOneClickRepair = () => {
    if (!activeLesson || !pipelineReport) return;
    const repaired = AIAssistedAuthoringService.applyTargetedRepairs(
      activeLesson as AuthoredLesson,
      pipelineReport.errors
    );
    setActiveLesson(repaired);
    const newReport = LessonVerificationPipeline.verify(repaired);
    setPipelineReport(newReport);
    setValidationReport({
      isValid: newReport.isValid,
      canPublish: newReport.canPublish,
      errors: newReport.errors.map((e) => ({
        field: e.field,
        message: e.message,
        severity: e.severity,
      })),
      warnings: newReport.warnings.map((w) => ({
        field: w.field,
        message: w.message,
        severity: w.severity,
      })),
    });
    setStatusMessage({
      text: 'Targeted deterministic repairs applied successfully!',
      type: 'success',
    });
  };

  const handleAiExpandOverview = () => {
    if (!activeLesson || !activeLesson.overview) return;
    const expanded = AIAssistedAuthoringService.expandOrSimplifyExplanation(
      activeLesson.overview,
      'expand',
      activeLesson.primaryTopic
    );
    setActiveLesson({ ...activeLesson, overview: expanded });
    setStatusMessage({ text: 'Overview expanded with deeper conceptual analysis.', type: 'info' });
  };

  const handleAiSimplifyOverview = () => {
    if (!activeLesson || !activeLesson.overview) return;
    const simplified = AIAssistedAuthoringService.expandOrSimplifyExplanation(
      activeLesson.overview,
      'simplify',
      activeLesson.primaryTopic
    );
    setActiveLesson({ ...activeLesson, overview: simplified });
    setStatusMessage({ text: 'Overview simplified for accessible learning.', type: 'info' });
  };

  const handleAiSuggestPrereqs = () => {
    if (!activeLesson) return;
    const prereqs = AIAssistedAuthoringService.suggestPrerequisites(
      activeLesson.primaryTopic || activeLesson.title || '',
      activeLesson.subjectId || 'computer_science'
    );
    setActiveLesson({ ...activeLesson, prerequisites: prereqs });
    setStatusMessage({ text: `Suggested ${prereqs.length} foundational prerequisites.`, type: 'info' });
  };

  const handleAiSuggestVisualizer = () => {
    if (!activeLesson) return;
    const vis = AIAssistedAuthoringService.suggestVisualizationConfig(
      activeLesson.primaryTopic || activeLesson.title || '',
      activeLesson.subjectId || 'computer_science'
    );
    setActiveLesson({ ...activeLesson, visualizationConfig: vis });
    setStatusMessage({ text: `Suggested compatible visualizer: ${vis.title}`, type: 'info' });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this module? This action cannot be undone.')) {
      await LessonLibraryService.deleteLesson(id);
      await refreshLessons();
      if (activeLesson?.id === id) {
        setActiveLesson(null);
        setIsEditing(false);
      }
      setStatusMessage({ text: 'Module deleted.', type: 'info' });
    }
  };

  // Step manipulation
  const handleAddStep = () => {
    if (!activeLesson) return;
    const currentSteps = activeLesson.steps || [];
    const nextNum = currentSteps.length + 1;
    const newStep: AuthoredLessonStep = {
      id: `step_${nextNum}_${Math.random().toString(36).substring(2, 6)}`,
      stepNumber: nextNum,
      title: `Step ${nextNum}: New Lesson Phase`,
      stepType: 'step_by_step',
      content: 'Describe the operation or concept for this step.',
    };
    setActiveLesson({
      ...activeLesson,
      steps: [...currentSteps, newStep],
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    if (!activeLesson || !activeLesson.steps) return;
    const steps = [...activeLesson.steps];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= steps.length) return;

    const [moved] = steps.splice(index, 1);
    steps.splice(targetIdx, 0, moved);

    // Re-number
    steps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });

    setActiveLesson({ ...activeLesson, steps });
  };

  const handleDeleteStep = (index: number) => {
    if (!activeLesson || !activeLesson.steps) return;
    const steps = activeLesson.steps.filter((_, idx) => idx !== index);
    steps.forEach((s, idx) => {
      s.stepNumber = idx + 1;
    });
    setActiveLesson({ ...activeLesson, steps });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-5xl h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Visual Authoring Studio</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300 font-mono">
                  Lesson Library
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Create, edit, configure visualizers, and publish verified STEM learning modules.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isEditing && (
              <button
                onClick={() => {
                  setIsEditing(false);
                  setActiveLesson(null);
                }}
                className="px-3 py-1.5 rounded-xl border border-slate-700 hover:border-slate-600 text-xs text-slate-300 hover:text-white transition-colors"
              >
                Back to Library
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Status notification banner */}
        {statusMessage && (
          <div
            className={`px-6 py-2.5 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : statusMessage.type === 'error'
                ? 'bg-rose-950/80 border-rose-500/30 text-rose-300'
                : 'bg-cyan-950/80 border-cyan-500/30 text-cyan-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="p-0.5 rounded hover:opacity-80">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Content Area */}
        {!isEditing ? (
          /* ========================================================= */
          /* 1. LESSON LIBRARY DIRECTORY VIEW                          */
          /* ========================================================= */
          <div className="flex-1 p-6 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              {/* Search input */}
              <div className="relative flex-1 min-w-[240px]">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search authored modules by title or topic..."
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {/* Status filter tabs */}
              <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                {(['all', 'draft', 'published'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1 rounded-lg capitalize transition-colors ${
                      filterStatus === st
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                {/* Step 12: Study Groups Action */}
                <button
                  onClick={() => setShowGroupsModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  title="Collaborative Study Groups"
                >
                  <Users className="w-4 h-4 text-indigo-400" />
                  <span>Study Groups</span>
                </button>

                {/* Step 12: Import Lesson Package Action */}
                <label
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  title="Import .visios-lesson.json package"
                >
                  <Download className="w-4 h-4 text-cyan-400 rotate-180" />
                  <span>Import Package</span>
                  <input
                    type="file"
                    accept=".json,.visios-lesson.json"
                    className="hidden"
                    onChange={handleImportPackageFile}
                  />
                </label>

                {/* Step 11: Document Import Action */}
                <button
                  onClick={() => setShowImportModal(true)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                  title="Import lecture notes or PDF documents to convert into draft lessons"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  <span>Import Doc</span>
                </button>

                {/* AI Draft Generator action */}
                <button
                  onClick={() => setShowAiModal(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md transition-all"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>AI Draft Generator</span>
                </button>

                {/* New manual lesson action */}
                <button
                  onClick={handleCreateNew}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Manual Module</span>
                </button>
              </div>
            </div>

            {/* Lesson Cards List */}
            {filteredLessons.length === 0 ? (
              <div className="py-16 text-center rounded-2xl border border-dashed border-slate-800 space-y-3">
                <BookOpen className="w-8 h-8 text-slate-600 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-300">No Authored Lessons Found</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first structured curriculum module, define interactive parameters, and save it to the library.
                </p>
                <button
                  onClick={handleCreateNew}
                  className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Module</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredLessons.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[9px] px-2 py-0.5 rounded-md font-mono uppercase font-bold ${
                              item.status === 'published'
                                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                                : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                            }`}
                          >
                            {item.status === 'published' ? `Published v${item.publishedVersion || item.version}` : 'Draft'}
                          </span>
                          <span className="text-[10px] text-slate-400 capitalize">
                            {item.subjectId?.replace('_', ' ')} • {item.difficulty}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white mt-1 line-clamp-1">{item.title}</h4>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">Topic: {item.primaryTopic}</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">{item.overview}</p>

                    <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500">
                        {item.steps?.length || 0} steps • {item.visualizationConfig?.rendererType || 'none'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleEditLesson(item)}
                          className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-cyan-400 font-medium text-xs flex items-center gap-1"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        {item.status === 'published' && (
                          <button
                            onClick={() => setShareTargetLesson(item)}
                            className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/30 text-cyan-300 font-medium text-xs flex items-center gap-1 transition-colors"
                            title="Share published lesson"
                          >
                            <Share2 className="w-3 h-3" />
                            <span>Share</span>
                          </button>
                        )}
                        {item.status === 'published' && onLoadLessonToWorkspace && (
                          <button
                            onClick={() => {
                              onLoadLessonToWorkspace(item);
                              onClose();
                            }}
                            className="px-2.5 py-1 rounded-lg bg-indigo-950 hover:bg-indigo-900 text-indigo-300 font-medium text-xs flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            <span>Load</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1 rounded-lg hover:bg-rose-950 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Delete module"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================= */
          /* 2. STRUCTURED LESSON EDITOR & PREVIEW VIEW                */
          /* ========================================================= */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Editor Sub-header & Navigation Tabs */}
            <div className="px-6 py-2.5 border-b border-slate-800 bg-slate-950 flex items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-xs">
                {[
                  { id: 'metadata', label: '1. Metadata & Pedagogy' },
                  { id: 'steps', label: '2. Lesson Steps' },
                  { id: 'visualization', label: '3. Visualizer Config' },
                  { id: 'practice', label: '4. Practice Questions' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id as any)}
                    className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                      activeTab === t.id
                        ? 'bg-cyan-600 text-white font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDeepVerify}
                  className="px-3 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 text-xs font-medium flex items-center gap-1.5 transition-colors"
                  title="Run Multi-Layer Verification Pipeline (Structural, Semantic, Deterministic, Sources, Visualizer)"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                  <span>Deep Verify</span>
                </button>
                <button
                  onClick={handleValidate}
                  className="px-3 py-1 rounded-lg border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white text-xs font-medium flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Validate</span>
                </button>
                <button
                  onClick={handleSaveDraft}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Draft</span>
                </button>
                <button
                  onClick={handlePublish}
                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 shadow-sm"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish</span>
                </button>
              </div>
            </div>

            {/* Multi-Layer Pipeline Verification Report Card */}
            {pipelineReport && (
              <div className="px-6 py-3 bg-slate-900/95 border-b border-slate-800 text-xs space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-4 h-4 ${pipelineReport.isValid ? 'text-emerald-400' : 'text-rose-400'}`} />
                    <span className="font-bold text-white">
                      Layered Verification Pipeline: {pipelineReport.isValid ? 'All Checks Passed' : `${pipelineReport.errors.length} Issue(s) Detected`}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-amber-950/80 border border-amber-500/30 text-amber-300">
                      Human Review: {pipelineReport.humanReviewRequired ? 'Pending Expert Sign-off' : 'Approved'}
                    </span>
                  </div>
                  {!pipelineReport.isValid && (
                    <button
                      onClick={handleOneClickRepair}
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-bold flex items-center gap-1 shadow-sm"
                    >
                      <Wand2 className="w-3 h-3 text-amber-300" />
                      <span>One-Click AI Repair</span>
                    </button>
                  )}
                </div>

                {/* 5 Layer Badges */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[10px] pt-1">
                  {(
                    [
                      { key: 'structural', label: '1. Structural' },
                      { key: 'semantic', label: '2. Semantic' },
                      { key: 'deterministic', label: '3. Deterministic' },
                      { key: 'source', label: '4. Sources' },
                      { key: 'visualization', label: '5. Visualizer' },
                    ] as const
                  ).map((layer) => {
                    const st = pipelineReport.layerStatus[layer.key];
                    return (
                      <div
                        key={layer.key}
                        className={`p-2 rounded-lg border ${
                          st.passed
                            ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                            : 'bg-rose-950/30 border-rose-500/30 text-rose-300'
                        }`}
                      >
                        <div className="font-bold flex items-center gap-1">
                          {st.passed ? <Check className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          <span>{layer.label}</span>
                        </div>
                        <p className="text-[9px] text-slate-400 mt-0.5 line-clamp-1">{st.details}</p>
                      </div>
                    );
                  })}
                </div>

                {/* Deterministic findings */}
                {pipelineReport.deterministicAudit && (
                  <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-0.5 font-mono flex-wrap">
                    {pipelineReport.deterministicAudit.mathFindings && (
                      <span>📐 {pipelineReport.deterministicAudit.mathFindings}</span>
                    )}
                    {pipelineReport.deterministicAudit.algorithmFindings && (
                      <span>⚡ {pipelineReport.deterministicAudit.algorithmFindings}</span>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Validation Errors Notice */}
            {validationReport && validationReport.errors.length > 0 && !pipelineReport && (
              <div className="px-6 py-2.5 bg-rose-950/90 border-b border-rose-500/30 text-rose-200 text-xs space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>Validation Issues ({validationReport.errors.length} errors, {validationReport.warnings.length} warnings):</span>
                </div>
                <ul className="list-disc pl-5 space-y-0.5 text-[11px]">
                  {validationReport.errors.map((err, i) => (
                    <li key={i}>{err.message}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Editor Forms Area */}
            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              {/* TAB 1: METADATA & PEDAGOGY */}
              {activeTab === 'metadata' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Lesson Title *</label>
                      <input
                        type="text"
                        value={activeLesson?.title || ''}
                        onChange={(e) => setActiveLesson({ ...activeLesson, title: e.target.value })}
                        placeholder="e.g. Mastering Binary Search"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Primary STEM Topic *</label>
                      <input
                        type="text"
                        value={activeLesson?.primaryTopic || ''}
                        onChange={(e) => setActiveLesson({ ...activeLesson, primaryTopic: e.target.value })}
                        placeholder="e.g. Binary Search"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                      <select
                        value={activeLesson?.subjectId || 'computer_science'}
                        onChange={(e) => setActiveLesson({ ...activeLesson, subjectId: e.target.value, domain: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {SubjectRegistry.getAllSubjects().map((sub) => (
                          <option key={sub.id} value={sub.id}>
                            {sub.displayName}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Difficulty</label>
                      <select
                        value={activeLesson?.difficulty || 'beginner'}
                        onChange={(e) => setActiveLesson({ ...activeLesson, difficulty: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="beginner">Beginner</option>
                        <option value="intermediate">Intermediate</option>
                        <option value="advanced">Advanced</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Topic Aliases (comma-separated)</label>
                      <input
                        type="text"
                        value={(activeLesson?.topicAliases || []).join(', ')}
                        onChange={(e) =>
                          setActiveLesson({
                            ...activeLesson,
                            topicAliases: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                          })
                        }
                        placeholder="bsearch, binary search algorithm"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Core Overview Explanation *</label>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={handleAiExpandOverview}
                          className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
                          title="Expand overview with in-depth conceptual analysis"
                        >
                          <Sparkles className="w-3 h-3 text-amber-300" />
                          <span>AI Expand</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleAiSimplifyOverview}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
                          title="Simplify explanation for beginner comprehension"
                        >
                          <Wand2 className="w-3 h-3 text-cyan-300" />
                          <span>AI Simplify</span>
                        </button>
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      value={activeLesson?.overview || ''}
                      onChange={(e) => setActiveLesson({ ...activeLesson, overview: e.target.value })}
                      placeholder="Comprehensive explanation of the concept, operational mechanism, and purpose..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Intuition & Motivation</label>
                    <textarea
                      rows={2}
                      value={activeLesson?.motivation || ''}
                      onChange={(e) => setActiveLesson({ ...activeLesson, motivation: e.target.value })}
                      placeholder="Why does this concept matter? What real-world challenge does it solve?"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-300">Foundational Prerequisites (comma-separated)</label>
                      <button
                        type="button"
                        onClick={handleAiSuggestPrereqs}
                        className="px-2 py-0.5 rounded bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white text-[10px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <Sparkles className="w-3 h-3 text-amber-300" />
                        <span>AI Suggest</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={(activeLesson?.prerequisites || []).join(', ')}
                      onChange={(e) =>
                        setActiveLesson({
                          ...activeLesson,
                          prerequisites: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                        })
                      }
                      placeholder="e.g. Sorted Arrays, Indexing, Iteration"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Learning Objectives (one per line) *</label>
                    <textarea
                      rows={2}
                      value={(activeLesson?.learningObjectives || []).join('\n')}
                      onChange={(e) =>
                        setActiveLesson({
                          ...activeLesson,
                          learningObjectives: e.target.value.split('\n').filter(Boolean),
                        })
                      }
                      placeholder="Divide active search interval in half&#10;Achieve O(log n) time complexity"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="checkbox"
                      id="reviewedCheck"
                      checked={activeLesson?.isExpertReviewed || false}
                      onChange={(e) => setActiveLesson({ ...activeLesson, isExpertReviewed: e.target.checked })}
                      className="rounded bg-slate-950 border-slate-800 text-cyan-500 focus:ring-0"
                    />
                    <label htmlFor="reviewedCheck" className="text-xs text-slate-300 select-none cursor-pointer">
                      Mark as curriculum reviewed and verified
                    </label>
                  </div>
                </div>
              )}

              {/* TAB 2: ORDERED LESSON STEPS */}
              {activeTab === 'steps' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Lesson Progression Steps</h4>
                      <p className="text-xs text-slate-400">Define the ordered stages a student works through.</p>
                    </div>
                    <button
                      onClick={handleAddStep}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Step</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(activeLesson?.steps || []).map((st, idx) => (
                      <div
                        key={st.id || idx}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                            Step {idx + 1}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => handleMoveStep(idx, 'up')}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white"
                              title="Move step up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <button
                              disabled={idx === (activeLesson?.steps?.length || 0) - 1}
                              onClick={() => handleMoveStep(idx, 'down')}
                              className="p-1 rounded bg-slate-900 hover:bg-slate-800 disabled:opacity-30 text-slate-400 hover:text-white"
                              title="Move step down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleDeleteStep(idx)}
                              className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400"
                              title="Delete step"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <input
                            type="text"
                            value={st.title}
                            onChange={(e) => {
                              const steps = [...(activeLesson?.steps || [])];
                              steps[idx].title = e.target.value;
                              setActiveLesson({ ...activeLesson, steps });
                            }}
                            placeholder="Step Title"
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                          />
                          <select
                            value={st.stepType}
                            onChange={(e) => {
                              const steps = [...(activeLesson?.steps || [])];
                              steps[idx].stepType = e.target.value;
                              setActiveLesson({ ...activeLesson, steps });
                            }}
                            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                          >
                            <option value="concept_meaning">Concept Meaning</option>
                            <option value="why_it_matters">Why It Matters</option>
                            <option value="prerequisites">Prerequisites</option>
                            <option value="step_by_step">Step-by-Step Derivation</option>
                            <option value="worked_example">Worked Example</option>
                            <option value="interactive_exploration">Interactive Exploration</option>
                            <option value="practice_exercise">Practice Exercise</option>
                            <option value="recap">Summary & Next Steps</option>
                          </select>
                        </div>

                        <textarea
                          rows={2}
                          value={st.content}
                          onChange={(e) => {
                            const steps = [...(activeLesson?.steps || [])];
                            steps[idx].content = e.target.value;
                            setActiveLesson({ ...activeLesson, steps });
                          }}
                          placeholder="Explanation content for this guided stage..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: VISUALIZER CONFIGURATION */}
              {activeTab === 'visualization' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Interactive Visualizer Selection</h4>
                      <p className="text-xs text-slate-400">
                        Select an implemented renderer and configure supported parameters without arbitrary code.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAiSuggestVisualizer}
                      className="px-3 py-1.5 rounded-xl bg-purple-950/60 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>AI Suggest Visualizer</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Renderer Type</label>
                    <select
                      value={activeLesson?.visualizationConfig?.rendererType || 'svg_schematic_fallback'}
                      onChange={(e) => {
                        const rType = e.target.value as CanonicalRendererType;
                        const schema = RENDERER_AUTHORING_SCHEMAS[rType];
                        const defaultParams: Record<string, any> = {};
                        if (schema) {
                          schema.fields.forEach((f) => {
                            defaultParams[f.name] = f.defaultValue;
                          });
                        }
                        setActiveLesson({
                          ...activeLesson,
                          visualizationConfig: {
                            rendererType: rType,
                            title: schema?.displayName || 'Visual Model',
                            description: activeLesson?.overview || 'Interactive visualizer',
                            learningObjective: activeLesson?.learningObjectives?.[0] || 'Observe dynamic behavior',
                            activeVariables: [],
                            parameters: defaultParams,
                            interactionsAvailable: ['Manipulate model controls'],
                            expectedBehavior: 'Displays verified STEM state.',
                          },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {Object.entries(RENDERER_AUTHORING_SCHEMAS).map(([key, schema]) => (
                        <option key={key} value={key}>
                          {schema.displayName} ({schema.rendererType})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dynamic Parameter Fields based on Selected Renderer Schema */}
                  {activeLesson?.visualizationConfig &&
                    activeLesson.visualizationConfig.rendererType !== 'none' && (
                      <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                        <span className="text-xs font-bold text-cyan-400">
                          {RENDERER_AUTHORING_SCHEMAS[activeLesson.visualizationConfig.rendererType]?.displayName} Parameters
                        </span>

                        {RENDERER_AUTHORING_SCHEMAS[activeLesson.visualizationConfig.rendererType]?.fields.map((f) => {
                          const currVal =
                            activeLesson.visualizationConfig?.parameters?.[f.name] !== undefined
                              ? activeLesson.visualizationConfig.parameters[f.name]
                              : f.defaultValue;

                          return (
                            <div key={f.name}>
                              <div className="flex items-center justify-between mb-1">
                                <label className="text-xs font-medium text-slate-300">{f.label}</label>
                                <span className="text-[10px] text-slate-500">{f.description}</span>
                              </div>

                              {f.type === 'number' && (
                                <input
                                  type="number"
                                  min={f.min}
                                  max={f.max}
                                  step={f.step || 1}
                                  value={currVal}
                                  onChange={(e) => {
                                    const params = {
                                      ...(activeLesson.visualizationConfig?.parameters || {}),
                                      [f.name]: parseFloat(e.target.value) || 0,
                                    };
                                    setActiveLesson({
                                      ...activeLesson,
                                      visualizationConfig: {
                                        ...activeLesson.visualizationConfig!,
                                        parameters: params,
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                              )}

                              {f.type === 'numberArray' && (
                                <input
                                  type="text"
                                  value={Array.isArray(currVal) ? currVal.join(', ') : ''}
                                  onChange={(e) => {
                                    const parsed = e.target.value
                                      .split(',')
                                      .map((s) => parseFloat(s.trim()))
                                      .filter((n) => !isNaN(n));
                                    const params = {
                                      ...(activeLesson.visualizationConfig?.parameters || {}),
                                      [f.name]: parsed,
                                    };
                                    setActiveLesson({
                                      ...activeLesson,
                                      visualizationConfig: {
                                        ...activeLesson.visualizationConfig!,
                                        parameters: params,
                                      },
                                    });
                                  }}
                                  placeholder="10, 20, 30, 40, 50"
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                              )}

                              {f.type === 'string' && (
                                <input
                                  type="text"
                                  value={currVal || ''}
                                  onChange={(e) => {
                                    const params = {
                                      ...(activeLesson.visualizationConfig?.parameters || {}),
                                      [f.name]: e.target.value,
                                    };
                                    setActiveLesson({
                                      ...activeLesson,
                                      visualizationConfig: {
                                        ...activeLesson.visualizationConfig!,
                                        parameters: params,
                                      },
                                    });
                                  }}
                                  className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                </div>
              )}

              {/* TAB 4: PRACTICE QUESTIONS */}
              {activeTab === 'practice' && (
                <div className="space-y-4 max-w-3xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Formative Practice Questions</h4>
                      <p className="text-xs text-slate-400">Add multiple choice assessment questions with feedback.</p>
                    </div>
                    <button
                      onClick={() => {
                        const current = activeLesson?.practiceQuestions || [];
                        const newQ = {
                          id: `q_${current.length + 1}`,
                          question: 'Enter question text here...',
                          options: ['Option A', 'Option B', 'Option C', 'Option D'],
                          correctIndex: 0,
                          explanation: 'Explanation why this choice is correct.',
                          hint: 'Hint to help solve the problem.',
                        };
                        setActiveLesson({ ...activeLesson, practiceQuestions: [...current, newQ] });
                      }}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  <div className="space-y-3">
                    {(activeLesson?.practiceQuestions || []).map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-cyan-300 font-mono">
                            Question {idx + 1}
                          </span>
                          <button
                            onClick={() => {
                              const updated = activeLesson?.practiceQuestions?.filter((_, i) => i !== idx);
                              setActiveLesson({ ...activeLesson, practiceQuestions: updated });
                            }}
                            className="p-1 rounded hover:bg-rose-950 text-slate-500 hover:text-rose-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => {
                            const questions = [...(activeLesson?.practiceQuestions || [])];
                            questions[idx].question = e.target.value;
                            setActiveLesson({ ...activeLesson, practiceQuestions: questions });
                          }}
                          placeholder="Question text..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          {q.options.map((opt, optIdx) => (
                            <div key={optIdx} className="flex items-center gap-1.5">
                              <input
                                type="radio"
                                name={`correct_${idx}`}
                                checked={q.correctIndex === optIdx}
                                onChange={() => {
                                  const questions = [...(activeLesson?.practiceQuestions || [])];
                                  questions[idx].correctIndex = optIdx;
                                  setActiveLesson({ ...activeLesson, practiceQuestions: questions });
                                }}
                              />
                              <input
                                type="text"
                                value={opt}
                                onChange={(e) => {
                                  const questions = [...(activeLesson?.practiceQuestions || [])];
                                  questions[idx].options[optIdx] = e.target.value;
                                  setActiveLesson({ ...activeLesson, practiceQuestions: questions });
                                }}
                                className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                              />
                            </div>
                          ))}
                        </div>

                        <input
                          type="text"
                          value={q.explanation}
                          onChange={(e) => {
                            const questions = [...(activeLesson?.practiceQuestions || [])];
                            questions[idx].explanation = e.target.value;
                            setActiveLesson({ ...activeLesson, practiceQuestions: questions });
                          }}
                          placeholder="Explanation for the correct answer..."
                          className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AI Draft Generator Modal Dialog */}
        {showAiModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Sparkles className="w-4 h-4 text-amber-300" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI-Assisted Lesson Draft</h3>
                    <p className="text-[11px] text-slate-400">Draft verified STEM module with local AI</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAiModal(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Enter Topic or Concept</label>
                <input
                  type="text"
                  value={aiTopicInput}
                  onChange={(e) => setAiTopicInput(e.target.value)}
                  placeholder="e.g. Binary Search, F = ma, Photosynthesis..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAiGenerateDraft(aiTopicInput);
                    }
                  }}
                />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="space-y-1">
                <span className="text-[10px] text-slate-400 font-medium">Quick Suggestions:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['Binary Search', 'F = ma', 'Photosynthesis', 'Chemical Bonding'].map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setAiTopicInput(sug)}
                      className="px-2 py-0.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/50 text-[10px] text-slate-300 hover:text-white transition-colors"
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!aiTopicInput.trim() || isAiGenerating}
                  onClick={() => handleAiGenerateDraft(aiTopicInput)}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
                >
                  {isAiGenerating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Drafting & Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>Generate Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 11: Document Import Modal */}
        <DocumentImportModal
          isOpen={showImportModal}
          onClose={() => {
            setShowImportModal(false);
            refreshLessons();
          }}
          onLoadLessonToWorkspace={(topic) => {
            setShowImportModal(false);
            if (onLoadLessonToWorkspace) {
              const matched = lessons.find((l) => l.primaryTopic.toLowerCase() === topic.toLowerCase());
              if (matched) {
                onLoadLessonToWorkspace(matched);
              }
            }
          }}
          onOpenAuthoringStudio={() => {
            setShowImportModal(false);
            refreshLessons();
          }}
        />

        {/* Step 12: Share Lesson Modal */}
        <ShareLessonModal
          isOpen={!!shareTargetLesson}
          lesson={shareTargetLesson}
          onClose={() => setShareTargetLesson(null)}
        />

        {/* Step 12: Study Groups Modal */}
        <StudyGroupsModal
          isOpen={showGroupsModal}
          onClose={() => setShowGroupsModal(false)}
          onLaunchLesson={(topic) => {
            setShowGroupsModal(false);
            if (onLoadLessonToWorkspace) {
              const matched = lessons.find((l) => l.primaryTopic.toLowerCase() === topic.toLowerCase());
              if (matched) {
                onLoadLessonToWorkspace(matched);
              }
            }
          }}
        />
      </div>
    </div>
  );
};

