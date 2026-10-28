'use client';

import React, { useState, useEffect } from 'react';
import { Navigation } from '@/components/shell/Navigation';
import { authoringService } from '@/features/authoring/authoring-service';
import { WorkspaceMode } from '@/types';
import { 
  ContentPackDraft, 
  ContentVersionSnapshot, 
  PublicationRecord 
} from '@/types/authoring';
import { 
  SubjectCategory, 
  TopicDefinition, 
  ConceptDefinition,
  LearningResource 
} from '@/types/knowledge';
import { VisualGraphEditor } from '@/components/authoring/VisualGraphEditor';
import { KnowledgeCheckEditor } from '@/components/authoring/KnowledgeCheckEditor';
import { LearningResourceBuilder } from '@/components/authoring/LearningResourceBuilder';
import { StudentExperiencePreviewModal } from '@/components/authoring/StudentExperiencePreviewModal';
import { VersionHistoryModal } from '@/components/authoring/VersionHistoryModal';
import { AIContentAssistantModal } from '@/components/authoring/AIContentAssistantModal';
import { MultimodalImportModal } from '@/components/multimodal/MultimodalImportModal';
import { AIGenerationProposal } from '@/types/ai-authoring';
import { MultimodalIngestionResult } from '@/types/multimodal';
import { 
  PenTool, 
  Layers, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle, 
  Plus, 
  Save, 
  UploadCloud, 
  History, 
  Eye, 
  Trash2, 
  BookOpen, 
  Activity, 
  HelpCircle,
  Copy,
  FolderPlus,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import Link from 'next/link';

export default function AuthoringStudioPage() {
  const [mode, setMode] = useState<WorkspaceMode>('immersive');
  const isImmersive = mode === 'immersive';

  const [drafts, setDrafts] = useState<ContentPackDraft[]>([]);
  const [activeDraftId, setActiveDraftId] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'graph' | 'structure' | 'activities' | 'validation' | 'published'>('graph');
  const [selectedConceptId, setSelectedConceptId] = useState<string | undefined>(undefined);
  const [selectedTopicId, setSelectedTopicId] = useState<string | undefined>(undefined);

  // Modals
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showNewPackModal, setShowNewPackModal] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [showMultimodalModal, setShowMultimodalModal] = useState(false);
  const [publishMessage, setPublishMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // New pack modal fields
  const [newPackTitle, setNewPackTitle] = useState('');
  const [newPackDesc, setNewPackDesc] = useState('');
  const [newPackCat, setNewPackCat] = useState<SubjectCategory>('natural_sciences');

  // Load drafts on mount
  useEffect(() => {
    refreshDrafts();
  }, []);

  const refreshDrafts = () => {
    const list = authoringService.listDrafts();
    setDrafts(list);
    if (list.length > 0) {
      if (!activeDraftId || !list.some((d) => d.id === activeDraftId)) {
        setActiveDraftId(list[0].id);
        if (list[0].concepts.length > 0) {
          setSelectedConceptId(list[0].concepts[0].id);
        }
        if (list[0].topics.length > 0) {
          setSelectedTopicId(list[0].topics[0].id);
        }
      }
    }
  };

  const activeDraft = drafts.find((d) => d.id === activeDraftId) || drafts[0];

  const handleCreatePack = () => {
    if (!newPackTitle.trim()) return;
    const newDraft = authoringService.createDraft({
      title: newPackTitle,
      description: newPackDesc || 'Interactive learning content pack',
      category: newPackCat,
    });
    setNewPackTitle('');
    setNewPackDesc('');
    setShowNewPackModal(false);
    refreshDrafts();
    setActiveDraftId(newDraft.id);
  };

  const handleSaveDraft = (updated: ContentPackDraft) => {
    const saved = authoringService.saveDraft(updated);
    setDrafts((prev) => prev.map((d) => (d.id === saved.id ? saved : d)));
  };

  const handleAddTopic = () => {
    if (!activeDraft) return;
    const updated = authoringService.addTopic(activeDraft.id, {
      title: `Topic ${activeDraft.topics.length + 1}`,
      description: 'Topic description and core objectives',
    });
    if (updated) {
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    }
  };

  const handleAddConcept = (topicId: string) => {
    if (!activeDraft) return;
    const topic = activeDraft.topics.find((t) => t.id === topicId);
    const count = activeDraft.concepts.filter((c) => c.parentTopicId === topicId).length;
    const updated = authoringService.addConcept(activeDraft.id, topicId, {
      title: `${topic?.title || 'Concept'} - Part ${count + 1}`,
      description: 'Concept definition, mechanics, and interactive activities.',
      estimatedMinutes: 15,
      difficultyLevel: 'introductory',
      learningObjectives: ['Understand core concepts and relationships'],
    });
    if (updated) {
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      const newConcept = updated.concepts[updated.concepts.length - 1];
      if (newConcept) setSelectedConceptId(newConcept.id);
    }
  };

  const handleRemoveConcept = (conceptId: string) => {
    if (!activeDraft) return;
    const updated = authoringService.removeConcept(activeDraft.id, conceptId);
    if (updated) {
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
      if (selectedConceptId === conceptId) {
        setSelectedConceptId(updated.concepts[0]?.id);
      }
    }
  };

  const handleTogglePrerequisite = (sourceId: string, targetId: string) => {
    if (!activeDraft) return;
    const updated = authoringService.togglePrerequisite(activeDraft.id, sourceId, targetId);
    if (updated) {
      setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
    }
  };

  const handlePublish = (bump: 'patch' | 'minor' | 'major') => {
    if (!activeDraft) return;
    const result = authoringService.publishDraft(activeDraft.id, bump);
    if (result.success) {
      setPublishMessage({
        type: 'success',
        text: `Successfully published version ${result.publishedRecord?.version}! Registered into live content registry.`,
      });
      refreshDrafts();
    } else {
      setPublishMessage({
        type: 'error',
        text: `Cannot publish: ${result.errors?.join(', ') || 'Validation errors exist.'}`,
      });
    }
    setTimeout(() => setPublishMessage(null), 6000);
  };

  const handleExportJson = () => {
    if (!activeDraft) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeDraft, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeDraft.id}_v${activeDraft.version}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportJson = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string) as ContentPackDraft;
        if (parsed.id && parsed.subject && parsed.topics && parsed.concepts) {
          authoringService.saveDraft(parsed);
          refreshDrafts();
          setActiveDraftId(parsed.id);
          setPublishMessage({ type: 'success', text: `Imported pack: ${parsed.title}` });
        }
      } catch (err) {
        setPublishMessage({ type: 'error', text: 'Failed to parse JSON content pack file.' });
      }
    };
    reader.readAsText(file);
  };

  const handleImportAiProposal = (proposal: AIGenerationProposal, acceptedTempIds: string[]) => {
    const updated = authoringService.importProposalToDraft(activeDraft?.id, proposal, acceptedTempIds);
    refreshDrafts();
    setActiveDraftId(updated.id);
    if (updated.concepts.length > 0) {
      setSelectedConceptId(updated.concepts[updated.concepts.length - 1].id);
    }
    setPublishMessage({
      type: 'success',
      text: `✨ Imported AI learning module "${proposal.topicTitle}" with ${acceptedTempIds.length} verified concept(s).`,
    });
  };

  const handleImportMultimodal = (result: MultimodalIngestionResult) => {
    const updated = authoringService.importMultimodalResultToDraft(activeDraft?.id, result);
    refreshDrafts();
    setActiveDraftId(updated.id);
    if (updated.concepts.length > 0) {
      setSelectedConceptId(updated.concepts[updated.concepts.length - 1].id);
    }
    setPublishMessage({
      type: 'success',
      text: `📄 Ingested source material "${result.document.filename}" with ${result.concepts.length} grounded concept(s).`,
    });
  };

  const selectedConcept = activeDraft?.concepts.find((c) => c.id === selectedConceptId);
  const selectedTopic = activeDraft?.topics.find((t) => t.id === selectedTopicId);
  const publishedPacks = authoringService.listPublishedPacks();
  const snapshots = activeDraft ? authoringService.listSnapshots(activeDraft.id) : [];

  return (
    <div className={`flex flex-col h-screen w-screen overflow-hidden ${
      isImmersive ? 'bg-[#060913] text-slate-100' : 'bg-slate-950 text-slate-100'
    }`}>
      {/* Top Bar */}
      <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur-xl px-6 flex items-center justify-between z-30 shrink-0">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide flex items-center space-x-2">
                <span>VisiOS Authoring Studio</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  v11.0
                </span>
              </h1>
            </div>
          </div>

          <Navigation mode={mode} />
        </div>

        {/* Top Actions */}
        <div className="flex items-center space-x-3">
          {/* Draft Switcher */}
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
            <span className="text-[11px] text-slate-400">Pack:</span>
            <select
              value={activeDraft?.id || ''}
              onChange={(e) => {
                setActiveDraftId(e.target.value);
                const draft = drafts.find((d) => d.id === e.target.value);
                if (draft?.concepts[0]) setSelectedConceptId(draft.concepts[0].id);
              }}
              className="bg-transparent border-none text-xs text-cyan-300 font-medium focus:outline-none cursor-pointer"
            >
              {drafts.map((d) => (
                <option key={d.id} value={d.id} className="bg-slate-900 text-white">
                  {d.title} (v{d.version})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setShowMultimodalModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
            <span>Import Notes/PDF</span>
          </button>

          <button
            onClick={() => setShowAiModal(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-cyan-500/30 hover:from-purple-600/50 hover:to-cyan-500/50 text-cyan-200 text-xs font-semibold border border-cyan-500/40 shadow-sm shadow-cyan-500/10 transition"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>AI Assistant</span>
          </button>

          <button
            onClick={() => setShowNewPackModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-cyan-400" />
            <span>New Pack</span>
          </button>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
          >
            <History className="w-3.5 h-3.5 text-purple-400" />
            <span>History ({snapshots.length})</span>
          </button>

          <button
            onClick={() => setShowPreviewModal(true)}
            disabled={!selectedConcept}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium border border-indigo-500/40 transition disabled:opacity-40"
          >
            <Eye className="w-3.5 h-3.5 text-indigo-400" />
            <span>Student Preview</span>
          </button>

          {/* Publish Action */}
          <div className="flex items-center">
            <button
              onClick={() => handlePublish('minor')}
              disabled={!activeDraft?.validation.isValid}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeDraft?.validation.isValid
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>Publish Release</span>
            </button>
          </div>
        </div>
      </header>

      {/* Notification Toast */}
      {publishMessage && (
        <div
          className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
            publishMessage.type === 'success'
              ? 'bg-emerald-950 border-b border-emerald-800 text-emerald-200'
              : 'bg-rose-950 border-b border-rose-800 text-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {publishMessage.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-400" />
            )}
            <span>{publishMessage.text}</span>
          </div>
          <button onClick={() => setPublishMessage(null)} className="hover:text-white">✕</button>
        </div>
      )}

      {/* Main Studio Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Studio Sidebar: Tabs & Navigation */}
        <div className="w-64 border-r border-slate-800 bg-slate-900/40 flex flex-col shrink-0">
          {/* Pack Metadata Header */}
          <div className="p-4 border-b border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Current Draft</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium ${
                activeDraft?.publicationStatus === 'published'
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/20 text-amber-300'
              }`}>
                {activeDraft?.publicationStatus || 'draft'}
              </span>
            </div>
            <h2 className="text-sm font-bold text-white line-clamp-1">{activeDraft?.title}</h2>
            <p className="text-[11px] text-slate-400 line-clamp-2">{activeDraft?.description}</p>
          </div>

          {/* Tab Navigation */}
          <div className="p-3 space-y-1 border-b border-slate-800">
            <button
              onClick={() => setActiveTab('graph')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'graph'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Concept Dependency Graph</span>
            </button>

            <button
              onClick={() => setActiveTab('structure')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'structure'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
              <span>Topics & Concepts Tree</span>
            </button>

            <button
              onClick={() => setActiveTab('activities')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'activities'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-4 h-4 text-emerald-400" />
              <span>Visuals & Quiz Builder</span>
            </button>

            <button
              onClick={() => setActiveTab('validation')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'validation'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Validator Diagnostics</span>
              </div>
              {activeDraft?.validation.diagnostics.length ? (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                  activeDraft.validation.isValid ? 'bg-slate-800 text-slate-300' : 'bg-rose-500/20 text-rose-300'
                }`}>
                  {activeDraft.validation.diagnostics.length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => setActiveTab('published')}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-xl text-xs font-medium transition ${
                activeTab === 'published'
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Published Registry ({publishedPacks.length})</span>
            </button>
          </div>

          {/* Quick Concept Selector / Outline */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider px-1">
              <span>Concepts ({activeDraft?.concepts.length || 0})</span>
              <button
                onClick={handleAddTopic}
                className="text-cyan-400 hover:underline flex items-center space-x-1 lowercase"
              >
                <Plus className="w-3 h-3" />
                <span>Add Topic</span>
              </button>
            </div>

            {activeDraft?.topics.map((t) => {
              const topicConcepts = activeDraft.concepts.filter((c) => c.parentTopicId === t.id);
              return (
                <div key={t.id} className="space-y-1">
                  <div className="text-xs font-medium text-slate-300 px-2 py-1 bg-slate-950/60 rounded flex items-center justify-between">
                    <span className="truncate">{t.title}</span>
                    <button
                      onClick={() => handleAddConcept(t.id)}
                      title="Add concept to this topic"
                      className="text-slate-500 hover:text-cyan-400"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="pl-2 space-y-0.5">
                    {topicConcepts.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedConceptId(c.id)}
                        className={`w-full text-left px-2 py-1 rounded text-xs truncate transition ${
                          selectedConceptId === c.id
                            ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                        }`}
                      >
                        • {c.title}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Studio Canvas: Dynamic Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-slate-950/30">
          {activeDraft && (
            <>
              {/* TAB 1: VISUAL GRAPH EDITOR */}
              {activeTab === 'graph' && (
                <div className="h-[calc(100vh-8.5rem)]">
                  <VisualGraphEditor
                    topics={activeDraft.topics}
                    concepts={activeDraft.concepts}
                    dependencies={activeDraft.dependencies}
                    selectedConceptId={selectedConceptId}
                    onSelectConcept={(cid) => {
                      setSelectedConceptId(cid);
                    }}
                    onAddConcept={(tId) => handleAddConcept(tId)}
                    onRemoveConcept={(cId) => handleRemoveConcept(cId)}
                    onTogglePrerequisite={(src, tgt) => handleTogglePrerequisite(src, tgt)}
                  />
                </div>
              )}

              {/* TAB 2: STRUCTURE & TOPICS */}
              {activeTab === 'structure' && (
                <div className="space-y-6 max-w-4xl">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                    <h3 className="text-sm font-bold text-white">Content Pack Metadata</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Subject Title</label>
                        <input
                          type="text"
                          value={activeDraft.title}
                          onChange={(e) =>
                            handleSaveDraft({
                              ...activeDraft,
                              title: e.target.value,
                              subject: { ...activeDraft.subject, displayName: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs text-slate-400">Category</label>
                        <select
                          value={activeDraft.category}
                          onChange={(e) =>
                            handleSaveDraft({
                              ...activeDraft,
                              category: e.target.value as SubjectCategory,
                              subject: { ...activeDraft.subject, category: e.target.value as SubjectCategory },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="natural_sciences">Natural Sciences</option>
                          <option value="formal_sciences">Formal Sciences</option>
                          <option value="engineering">Engineering & Applied</option>
                          <option value="humanities">Humanities & Social</option>
                        </select>
                      </div>

                      <div className="space-y-1 md:col-span-2">
                        <label className="text-xs text-slate-400">Subject Description</label>
                        <textarea
                          rows={2}
                          value={activeDraft.description}
                          onChange={(e) =>
                            handleSaveDraft({
                              ...activeDraft,
                              description: e.target.value,
                              subject: { ...activeDraft.subject, description: e.target.value },
                            })
                          }
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-white">Topics in this Pack</h3>
                      <button
                        onClick={handleAddTopic}
                        className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium hover:bg-cyan-500/20 transition"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add New Topic</span>
                      </button>
                    </div>

                    {activeDraft.topics.map((t, idx) => (
                      <div key={t.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-slate-300 font-mono text-xs flex items-center justify-center font-bold">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={t.title}
                              onChange={(e) => {
                                const nextTopics = [...activeDraft.topics];
                                nextTopics[idx].title = e.target.value;
                                handleSaveDraft({ ...activeDraft, topics: nextTopics });
                              }}
                              className="bg-transparent border-b border-transparent focus:border-cyan-500 text-xs font-bold text-white focus:outline-none px-1"
                            />
                          </div>

                          <button
                            onClick={() => {
                              const updated = authoringService.removeTopic(activeDraft.id, t.id);
                              if (updated) setDrafts((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
                            }}
                            className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <input
                          type="text"
                          value={t.description}
                          onChange={(e) => {
                            const nextTopics = [...activeDraft.topics];
                            nextTopics[idx].description = e.target.value;
                            handleSaveDraft({ ...activeDraft, topics: nextTopics });
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                          placeholder="Topic description..."
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: ACTIVITIES & KNOWLEDGE CHECKS */}
              {activeTab === 'activities' && selectedConcept && (
                <div className="space-y-6 max-w-4xl">
                  {/* Selected Concept Header */}
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 font-mono">EDITING ACTIVITIES FOR:</span>
                      <h3 className="text-sm font-bold text-white">{selectedConcept.title}</h3>
                    </div>

                    <select
                      value={selectedConcept.id}
                      onChange={(e) => setSelectedConceptId(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                    >
                      {activeDraft.concepts.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Learning Resource Builder */}
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <LearningResourceBuilder
                      conceptId={selectedConcept.id}
                      resources={activeDraft.resources}
                      onAddResource={(res) => {
                        handleSaveDraft({
                          ...activeDraft,
                          resources: [...activeDraft.resources, res],
                        });
                      }}
                      onRemoveResource={(resId) => {
                        handleSaveDraft({
                          ...activeDraft,
                          resources: activeDraft.resources.filter((r) => r.id !== resId),
                        });
                      }}
                      onUpdateResource={(res) => {
                        handleSaveDraft({
                          ...activeDraft,
                          resources: activeDraft.resources.map((r) => (r.id === res.id ? res : r)),
                        });
                      }}
                    />
                  </div>

                  {/* Knowledge Check Formative Quiz Builder */}
                  <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
                    <KnowledgeCheckEditor
                      knowledgeCheck={selectedConcept.knowledgeCheck}
                      onChange={(quiz) => {
                        const nextConcepts = activeDraft.concepts.map((c) =>
                          c.id === selectedConcept.id ? { ...c, knowledgeCheck: quiz } : c
                        );
                        handleSaveDraft({
                          ...activeDraft,
                          concepts: nextConcepts,
                        });
                      }}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: VALIDATION DIAGNOSTICS */}
              {activeTab === 'validation' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Content Graph Integrity Validation</h3>
                      <p className="text-xs text-slate-400">
                        Checks for circular dependencies, dangling references, and capability readiness
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      {activeDraft.validation.isValid ? (
                        <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold flex items-center space-x-1 border border-emerald-500/30">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>Graph Valid & Ready to Publish</span>
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-xs font-semibold flex items-center space-x-1 border border-rose-500/30">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Publication Blocked by Errors</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {activeDraft.validation.diagnostics.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-400 space-y-1">
                      <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto opacity-80" />
                      <p className="font-semibold text-white">Zero Diagnostics Found</p>
                      <p className="text-slate-500">All concept linkages and simulation requirements are satisfied.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeDraft.validation.diagnostics.map((diag, i) => (
                        <div
                          key={i}
                          className={`p-3.5 rounded-xl border text-xs flex items-start space-x-3 ${
                            diag.type === 'error'
                              ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                              : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                          }`}
                        >
                          {diag.type === 'error' ? (
                            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                          ) : (
                            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                          )}
                          <div className="space-y-0.5">
                            <span className="font-semibold capitalize">
                              [{diag.type}] {diag.entityType || 'Manifest'}:
                            </span>
                            <p className="leading-relaxed">{diag.message}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: PUBLISHED REGISTRY */}
              {activeTab === 'published' && (
                <div className="space-y-4 max-w-4xl">
                  <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-white">Live Knowledge Registry Releases</h3>
                      <p className="text-xs text-slate-400">
                        Content packs currently active in the multi-subject knowledge engine and student view
                      </p>
                    </div>

                    <Link
                      href="/subjects"
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-xs font-medium hover:bg-cyan-500/20 transition"
                    >
                      <span>Browse in Subjects App</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>

                  {publishedPacks.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-500">
                      No custom author packs published yet. Click "Publish Release" in the top bar to release your first version.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {publishedPacks.map((pub) => {
                        const dateStr = new Date(pub.publishedAt).toLocaleString();
                        const sub = pub.manifest.subjects[0];

                        return (
                          <div
                            key={pub.packId}
                            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between transition"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                                  v{pub.version}
                                </span>
                                <h4 className="text-xs font-bold text-white">{sub?.displayName || pub.packId}</h4>
                              </div>
                              <p className="text-[11px] text-slate-400">{sub?.description}</p>
                              <div className="text-[10px] text-slate-500 flex items-center space-x-2">
                                <span>Published: {dateStr}</span>
                                <span>•</span>
                                <span>{pub.manifest.topics.length} Topics</span>
                                <span>•</span>
                                <span>{pub.manifest.concepts.length} Concepts</span>
                              </div>
                            </div>

                            <Link
                              href={`/subjects?subject=${sub?.id}`}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                            >
                              Explore
                            </Link>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* MODAL: NEW PACK */}
      {showNewPackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Learning Content Pack</h3>
            
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Subject / Pack Title</label>
                <input
                  type="text"
                  value={newPackTitle}
                  onChange={(e) => setNewPackTitle(e.target.value)}
                  placeholder="e.g., Robotics & Kinematics"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Category</label>
                <select
                  value={newPackCat}
                  onChange={(e) => setNewPackCat(e.target.value as SubjectCategory)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="natural_sciences">Natural Sciences (Physics, Biology, Chemistry)</option>
                  <option value="formal_sciences">Formal Sciences (Math, Computer Science)</option>
                  <option value="engineering">Engineering & Electronics</option>
                  <option value="humanities">Humanities & General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Description</label>
                <textarea
                  rows={2}
                  value={newPackDesc}
                  onChange={(e) => setNewPackDesc(e.target.value)}
                  placeholder="Summary of topics covered..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowNewPackModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePack}
                disabled={!newPackTitle.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-semibold transition disabled:opacity-40"
              >
                Create Draft
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: STUDENT EXPERIENCE PREVIEW */}
      {showPreviewModal && activeDraft && selectedConcept && (
        <StudentExperiencePreviewModal
          subject={activeDraft.subject}
          topic={activeDraft.topics.find((t) => t.id === selectedConcept.parentTopicId)}
          concept={selectedConcept}
          resources={activeDraft.resources}
          onClose={() => setShowPreviewModal(false)}
        />
      )}

      {/* MODAL: VERSION HISTORY */}
      {showHistoryModal && activeDraft && (
        <VersionHistoryModal
          draft={activeDraft}
          snapshots={snapshots}
          onRestoreSnapshot={(snapId) => {
            const restored = authoringService.restoreSnapshot(activeDraft.id, snapId);
            if (restored) {
              refreshDrafts();
              setShowHistoryModal(false);
              setPublishMessage({ type: 'success', text: `Restored snapshot v${restored.version}` });
            }
          }}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      {/* MODAL: AI CONTENT ASSISTANT */}
      {showAiModal && (
        <AIContentAssistantModal
          currentDraftId={activeDraft?.id}
          onImportProposal={handleImportAiProposal}
          onClose={() => setShowAiModal(false)}
        />
      )}

      {/* MODAL: MULTIMODAL INGESTION */}
      {showMultimodalModal && (
        <MultimodalImportModal
          onImportCompleted={handleImportMultimodal}
          onClose={() => setShowMultimodalModal(false)}
        />
      )}
    </div>
  );
}
