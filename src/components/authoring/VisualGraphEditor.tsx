'use client';

import React, { useState } from 'react';
import { 
  ConceptDefinition, 
  TopicDefinition 
} from '@/types/knowledge';
import { ConceptDependency } from '@/types/learning-path';
import { 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Unlink, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Layers,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Activity,
  Box
} from 'lucide-react';
import { ConceptDependencyGraph } from '@/features/learning-paths/concept-graph';

interface VisualGraphEditorProps {
  topics: TopicDefinition[];
  concepts: ConceptDefinition[];
  dependencies: ConceptDependency[];
  selectedConceptId?: string;
  onSelectConcept: (conceptId: string) => void;
  onAddConcept: (topicId: string) => void;
  onRemoveConcept: (conceptId: string) => void;
  onTogglePrerequisite: (sourceId: string, targetId: string, strength?: 'essential' | 'recommended') => void;
}

export const VisualGraphEditor: React.FC<VisualGraphEditorProps> = ({
  topics,
  concepts,
  dependencies,
  selectedConceptId,
  onSelectConcept,
  onAddConcept,
  onRemoveConcept,
  onTogglePrerequisite,
}) => {
  const [connectSourceId, setConnectSourceId] = useState<string | null>(null);

  // Compute graph status & topological sort
  const graphConcepts = concepts.map((c) => ({
    id: c.id,
    title: c.title,
    subject: c.parentTopicId,
    description: c.description || '',
    difficultyLevel: c.difficultyLevel,
    estimatedMinutes: c.estimatedMinutes || 15,
    prerequisiteIds: c.prerequisiteConceptIds || [],
    suggestedVisualizations: ['diagram' as const],
    learningObjectives: c.learningObjectives || [],
  }));

  const graph = new ConceptDependencyGraph(graphConcepts, dependencies);
  const cycles = graph.detectCycles();
  let topologicalOrder: string[] = [];
  let topoError: string | null = null;

  try {
    topologicalOrder = graph.getTopologicalOrder();
  } catch (err: any) {
    topoError = err?.message || 'Cycle detected';
  }

  const handleStartConnect = (conceptId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (connectSourceId === conceptId) {
      setConnectSourceId(null);
    } else {
      setConnectSourceId(conceptId);
    }
  };

  const handleNodeClick = (conceptId: string) => {
    if (connectSourceId) {
      if (connectSourceId !== conceptId) {
        onTogglePrerequisite(connectSourceId, conceptId, 'essential');
        setConnectSourceId(null);
      } else {
        setConnectSourceId(null);
      }
    } else {
      onSelectConcept(conceptId);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950/80 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl">
      {/* Top Bar / Graph Status */}
      <div className="flex flex-wrap items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/60 gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">Visual Concept Dependency Graph</h2>
            <p className="text-xs text-slate-400">
              Interactive node graph linking prerequisites, learning order, and visual activities
            </p>
          </div>
        </div>

        {/* Validation Status Indicator */}
        <div className="flex items-center space-x-3">
          {connectSourceId && (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 text-xs animate-pulse">
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Click a target concept node to connect prerequisite</span>
              <button 
                onClick={() => setConnectSourceId(null)}
                className="ml-2 hover:text-white font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {cycles ? (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs">
              <AlertTriangle className="w-4 h-4" />
              <span className="font-medium">Cycle Detected in Graph</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Directed Acyclic Graph (Valid)</span>
            </div>
          )}
        </div>
      </div>

      {/* Cycle Warning Banner */}
      {cycles && (
        <div className="px-6 py-3 bg-red-950/40 border-b border-red-800/40 text-red-300 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Blocking Circular Dependency:</strong>{' '}
              {cycles[0]
                .map((cid) => concepts.find((c) => c.id === cid)?.title || cid)
                .join(' ➔ ')}
            </span>
          </div>
          <span className="text-[11px] text-red-400 font-mono">Remove circular edge to publish</span>
        </div>
      )}

      {/* Main Canvas Area: Topics & Concept Nodes */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
        {topics.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
            <Layers className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium text-slate-400">No topics created in this draft yet</p>
            <p className="text-xs text-slate-600 max-w-sm mt-1">
              Add a topic in the content manager to start organizing concept nodes and dependencies.
            </p>
          </div>
        ) : (
          topics.map((topic, topicIdx) => {
            const topicConcepts = concepts.filter((c) => c.parentTopicId === topic.id);

            return (
              <div
                key={topic.id}
                className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-5 relative overflow-hidden backdrop-blur-sm"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2.5">
                    <span className="w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400 font-mono text-xs flex items-center justify-center font-bold">
                      {topicIdx + 1}
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold text-white">{topic.title}</h3>
                      <p className="text-xs text-slate-400">{topic.description}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onAddConcept(topic.id)}
                    className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition"
                  >
                    <Plus className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Add Concept Node</span>
                  </button>
                </div>

                {/* Concept Nodes Grid */}
                {topicConcepts.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-center text-xs text-slate-500">
                    No concepts in this topic. Click "Add Concept Node" above.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {topicConcepts.map((concept) => {
                      const isSelected = selectedConceptId === concept.id;
                      const isConnectingSource = connectSourceId === concept.id;
                      const prereqs = dependencies.filter((d) => d.dependentConceptId === concept.id);
                      const downstreams = dependencies.filter((d) => d.sourceConceptId === concept.id);

                      return (
                        <div
                          key={concept.id}
                          onClick={() => handleNodeClick(concept.id)}
                          className={`group relative rounded-xl p-4 transition-all duration-200 cursor-pointer border ${
                            isSelected
                              ? 'bg-slate-800/90 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                              : isConnectingSource
                              ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/40 animate-pulse'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
                          }`}
                        >
                          {/* Header */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className="text-xs font-semibold text-white line-clamp-1 group-hover:text-cyan-300 transition">
                              {concept.title}
                            </span>
                            <div className="flex items-center space-x-1 shrink-0">
                              <button
                                title={isConnectingSource ? 'Cancel link' : 'Connect prerequisite edge'}
                                onClick={(e) => handleStartConnect(concept.id, e)}
                                className={`p-1 rounded-md transition ${
                                  isConnectingSource
                                    ? 'bg-indigo-600 text-white'
                                    : 'text-slate-400 hover:text-indigo-400 hover:bg-slate-800'
                                }`}
                              >
                                <LinkIcon className="w-3.5 h-3.5" />
                              </button>
                              <button
                                title="Delete concept"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onRemoveConcept(concept.id);
                                }}
                                className="p-1 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-md transition"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <p className="text-[11px] text-slate-400 line-clamp-2 mb-3 leading-relaxed">
                            {concept.description}
                          </p>

                          {/* Indicators / Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 flex items-center space-x-1">
                              <Clock className="w-2.5 h-2.5 text-slate-400" />
                              <span>{concept.estimatedMinutes}m</span>
                            </span>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full capitalize ${
                                concept.difficultyLevel === 'introductory'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : concept.difficultyLevel === 'intermediate'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              }`}
                            >
                              {concept.difficultyLevel}
                            </span>

                            {concept.knowledgeCheck && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 flex items-center space-x-1">
                                <HelpCircle className="w-2.5 h-2.5" />
                                <span>Quiz</span>
                              </span>
                            )}

                            {concept.requiredCapability?.includes('sim') && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center space-x-1">
                                <Activity className="w-2.5 h-2.5" />
                                <span>Sim</span>
                              </span>
                            )}

                            {concept.requiredCapability?.includes('3d') && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center space-x-1">
                                <Box className="w-2.5 h-2.5" />
                                <span>3D</span>
                              </span>
                            )}
                          </div>

                          {/* Prerequisites List & Edges */}
                          <div className="pt-2.5 border-t border-slate-800/80 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-slate-500">
                              <span>Prerequisites ({prereqs.length}):</span>
                              <span className="text-[10px] text-slate-600">Unlocks: {downstreams.length}</span>
                            </div>
                            {prereqs.length === 0 ? (
                              <span className="text-slate-600 text-[10px] italic">No prerequisites (Foundation node)</span>
                            ) : (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {prereqs.map((dep) => {
                                  const source = concepts.find((c) => c.id === dep.sourceConceptId);
                                  return (
                                    <span
                                      key={dep.sourceConceptId}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        onTogglePrerequisite(dep.sourceConceptId, concept.id);
                                      }}
                                      title="Click to disconnect prerequisite"
                                      className="inline-flex items-center space-x-1 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-cyan-300 hover:border-red-500 hover:text-red-400 group/dep transition"
                                    >
                                      <span>{source?.title || dep.sourceConceptId}</span>
                                      <Unlink className="w-2.5 h-2.5 opacity-0 group-hover/dep:opacity-100" />
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}

        {/* Topological Sequence Preview */}
        {!cycles && topologicalOrder.length > 0 && (
          <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800/80">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300 mb-2">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Learner Progression Sequence (Topological Order)</span>
            </div>
            <div className="flex items-center flex-wrap gap-2 text-xs">
              {topologicalOrder.map((cid, idx) => {
                const c = concepts.find((item) => item.id === cid);
                if (!c) return null;
                return (
                  <React.Fragment key={cid}>
                    <button
                      onClick={() => onSelectConcept(cid)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                        selectedConceptId === cid
                          ? 'bg-cyan-500 text-slate-950 font-bold'
                          : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {idx + 1}. {c.title}
                    </button>
                    {idx < topologicalOrder.length - 1 && (
                      <ArrowRight className="w-3 h-3 text-slate-600 shrink-0" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
