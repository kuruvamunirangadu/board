'use client';

import React, { useState, useMemo } from 'react';
import {
  Compass,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Circle,
  Lock,
  Sparkles,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  BookOpen,
  ArrowUpRight,
  HelpCircle,
  Clock,
  Activity,
  Award,
  ChevronRight,
  Search,
  Filter,
  X,
  Target,
  FileQuestion,
  Box,
} from 'lucide-react';
import {
  ConceptNode,
  TopicKnowledgeSubGraph,
  GraphNodePosition,
  SavedLearningSessionState,
} from '@/features/learning/types';
import { ConceptDependencyGraphEngine } from '@/features/learning/ConceptDependencyGraph';
import {
  TopicVisualizationRegistry,
  TopicVisualizationDefinition,
} from '@/features/learning/TopicVisualizationRegistry';
import { Topic3DViewer } from '@/components/3d/Topic3DViewer';
import { DomainKnowledgeEngine } from '@/features/learning/DomainKnowledgeEngine';

interface InteractiveTopicKnowledgeGraphViewProps {
  topicQuery: string;
  currentSession?: SavedLearningSessionState | null;
  onSelectTopic?: (topic: string) => void;
  onStampToCanvas?: (summary: string) => void;
  className?: string;
  initialTab?: 'graph' | 'visualization';
}

export const InteractiveTopicKnowledgeGraphView: React.FC<InteractiveTopicKnowledgeGraphViewProps> = ({
  topicQuery,
  currentSession,
  onSelectTopic,
  onStampToCanvas,
  className = '',
  initialTab,
}) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1.0);
  const [searchQuery, setSearchQuery] = useState('');
  const [domainFilter, setDomainFilter] = useState<'all' | 'mathematics' | 'physics' | 'computer_science'>('all');

  // Resolve 3D / topic visualization from the registry
  const visualizationDef = useMemo(() => {
    return TopicVisualizationRegistry.resolve(topicQuery);
  }, [topicQuery]);

  const domainModel = useMemo(() => {
    return DomainKnowledgeEngine.match(topicQuery);
  }, [topicQuery]);

  // Compute focused subgraph for the current topic
  const subGraph: TopicKnowledgeSubGraph | null = useMemo(() => {
    return ConceptDependencyGraphEngine.getTopicKnowledgeSubGraph(
      topicQuery,
      currentSession || null
    );
  }, [topicQuery, currentSession]);

  const [activeTab, setActiveTab] = useState<'graph' | 'visualization'>(() => {
    if (initialTab) return initialTab;
    const lower = (topicQuery || '').toLowerCase();
    if (
      lower.includes('nervous') ||
      lower.includes('brain') ||
      lower.includes('neuron') ||
      lower.includes('synapse') ||
      lower.includes('heart') ||
      lower.includes('molecule') ||
      lower.includes('solid') ||
      lower.includes('cube') ||
      lower.includes('polyhedr') ||
      lower.includes('tetrahedr') ||
      lower.includes('octahedr') ||
      lower.includes('dodecahedr') ||
      lower.includes('icosahedr') ||
      lower.includes('euler')
    ) {
      return 'visualization';
    }
    return subGraph ? 'graph' : 'visualization';
  });

  // All registered concepts for search and domain filtering
  const allCurriculumConcepts = useMemo(() => {
    return Object.values(ConceptDependencyGraphEngine.getRegistry());
  }, []);

  // Filtered concepts based on search query and domain filter
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return allCurriculumConcepts.filter((c) => {
      const matchesDomain = domainFilter === 'all' || c.domain === domainFilter;
      const matchesText =
        c.title.toLowerCase().includes(q) ||
        c.topic.toLowerCase().includes(q) ||
        c.topicQuery.toLowerCase().includes(q) ||
        c.objectives.some((obj) => obj.toLowerCase().includes(q));
      return matchesDomain && matchesText;
    });
  }, [allCurriculumConcepts, searchQuery, domainFilter]);

  const selectedNode = useMemo(() => {
    if (!subGraph) return null;
    if (selectedNodeId) {
      // Look in active subgraph first
      const foundInSubGraph = subGraph.nodes.find((n) => n.concept.id === selectedNodeId);
      if (foundInSubGraph) return foundInSubGraph;

      // Look in global registry if selected via search
      const registryNode = ConceptDependencyGraphEngine.getRegistry()[selectedNodeId];
      if (registryNode) {
        return {
          concept: registryNode,
          role: 'dependent' as const,
          isUnlocked: true,
          x: 0,
          y: 0,
          masteryState: 'not_started' as const,
        };
      }
    }
    return null;
  }, [subGraph, selectedNodeId]);

  if (!subGraph) {
    if (visualizationDef) {
      return (
        <div className={`p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3 ${className}`}>
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {visualizationDef.displayName}
                </h4>
                <p className="text-[10px] text-slate-400">
                  Topic 3D Visualization Explorer & Structural Target Inspection
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-cyan-400 border border-cyan-800/40">
              {visualizationDef.modelKind === 'procedural_schematic'
                ? 'Educational Schematic'
                : '3D Model'}
            </span>
          </div>

          {/* 3D Visualization Viewport */}
          <div className="w-full">
            <Topic3DViewer
              definition={visualizationDef}
              isImmersive={false}
              onNavigateTopic={onSelectTopic}
            />
          </div>

          {/* Foundational Prerequisites & Context */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
                <Compass className="w-3.5 h-3.5" />
                <span>Foundational Prerequisites Checklist</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Curriculum Track</span>
            </div>
            {domainModel?.prerequisites && domainModel.prerequisites.length > 0 ? (
              <div className="space-y-1 text-xs text-slate-300">
                {domainModel.prerequisites.map((p, i) => (
                  <div key={i} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{p}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">
                Foundational cellular biology, electrochemistry, and anatomical reasoning.
              </p>
            )}
          </div>

          {/* Stamp to Canvas Button */}
          {onStampToCanvas && (
            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => {
                  const prereqs =
                    domainModel?.prerequisites?.join(', ') ||
                    'Cellular biology, electrochemistry, and physiological transport';
                  const targets = visualizationDef.supportedStructures
                    .map((s) => `• ${s.name}: ${s.role}`)
                    .join('\n');
                  onStampToCanvas(
                    `🧠 3D Topic Visualization: ${visualizationDef.displayName}\n\nPrerequisites:\n• ${prereqs}\n\nKey Structural Targets:\n${targets}`
                  );
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-sm transition-all"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Stamp 3D Visualization Summary</span>
              </button>
            </div>
          )}
        </div>
      );
    }

    // Fallback when neither subgraph nor visualizationDef matches
    return (
      <div className={`p-6 rounded-2xl bg-slate-950 border border-slate-800 text-center space-y-4 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto text-cyan-400">
          <Compass className="w-5 h-5 opacity-80" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-bold text-white tracking-wide">
            Topic Visual Explorer & Dependency Map
          </h4>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            No registered 3D model or curriculum dependency graph matches &ldquo;{topicQuery}&rdquo; yet.
          </p>
        </div>
        <div className="pt-2 border-t border-slate-900 space-y-2">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
            Explore Verified Interactive Visualizations:
          </div>
          <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md mx-auto">
            {TopicVisualizationRegistry.getRecommendedVisualizations().map((rec) => (
              <button
                key={rec.id}
                type="button"
                onClick={() => onSelectTopic?.(rec.topicIdentifiers[0])}
                className="px-2.5 py-1 rounded-lg text-[10px] font-medium bg-slate-900 border border-slate-800 text-cyan-300 hover:text-white hover:border-cyan-500/50 hover:bg-slate-800/80 transition-all flex items-center gap-1"
              >
                <span>{rec.displayName.split('(')[0].trim()}</span>
                <ChevronRight className="w-2.5 h-2.5 text-slate-400" />
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { targetConcept, prerequisites, dependents, recommendedNextSteps, nodes, edges } = subGraph;
  const primaryRecommendation = recommendedNextSteps[0] || null;

  const handleZoomIn = () => setZoomScale((prev) => Math.min(1.4, prev + 0.15));
  const handleZoomOut = () => setZoomScale((prev) => Math.max(0.7, prev - 0.15));
  const handleResetZoom = () => setZoomScale(1.0);

  const handleStampGraph = () => {
    if (!onStampToCanvas) return;
    const prereqList = prerequisites.map((p) => `• ${p.title}`).join('\n') || '• Direct foundational concepts';
    const dependentList = dependents.map((d) => `• ${d.title}`).join('\n') || '• Advanced exploration pathways';
    const nextStepText = primaryRecommendation
      ? `\n\n🎯 Recommended Next Step:\n${primaryRecommendation.concept.title}\n(${primaryRecommendation.rationale})`
      : '';

    const summary = `🗺️ Topic Knowledge Graph: ${targetConcept.title}\n\nPrerequisites:\n${prereqList}\n\nDependent Concept Unlocks:\n${dependentList}${nextStepText}`;
    onStampToCanvas(summary);
  };

  const renderMasteryBadge = (node: GraphNodePosition) => {
    const state = node.masteryState || 'not_started';
    switch (state) {
      case 'completed':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-1.5 py-0.5 rounded">
            <Award className="w-2.5 h-2.5" />
            <span>Mastered (100%)</span>
          </span>
        );
      case 'demonstrated_understanding':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-teal-300 bg-teal-950/60 border border-teal-500/30 px-1.5 py-0.5 rounded">
            <CheckCircle2 className="w-2.5 h-2.5" />
            <span>Demonstrated</span>
          </span>
        );
      case 'in_progress':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-cyan-300 bg-cyan-950/60 border border-cyan-500/30 px-1.5 py-0.5 rounded">
            <Activity className="w-2.5 h-2.5" />
            <span>In Progress</span>
          </span>
        );
      case 'needs_review':
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/30 px-1.5 py-0.5 rounded">
            <AlertCircle className="w-2.5 h-2.5" />
            <span>Needs Review</span>
          </span>
        );
      case 'not_started':
      default:
        return (
          <span className="flex items-center gap-1 text-[9px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-1.5 py-0.5 rounded">
            <Circle className="w-2.5 h-2.5 text-slate-500" />
            <span>Not Started</span>
          </span>
        );
    }
  };

  return (
    <div className={`flex flex-col bg-slate-950/90 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl ${className}`}>
      {/* Top Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/70 border-b border-slate-800/80 gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-100">Interactive Concept Knowledge Graph</span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                Acyclic DAG
              </span>
            </div>
            <p className="text-[10px] text-slate-400">
              Prerequisites &rarr; Active Concept &rarr; Dependent Unlocks & Recommended Next Steps
            </p>
          </div>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center space-x-1.5">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-slate-400 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 text-[10px] font-mono text-slate-300">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 hover:text-slate-200 transition-colors border-l border-slate-800"
              title="Fit to Viewport / Reset"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>

          {onStampToCanvas && (
            <button
              type="button"
              onClick={handleStampGraph}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white flex items-center space-x-1 shadow-sm transition-all"
              title="Stamp formatted knowledge summary card onto canvas"
            >
              <Layers className="w-3 h-3" />
              <span>Stamp Graph</span>
            </button>
          )}
        </div>
      </div>

      {/* View Switcher Tabs: Graph vs 3D Visualization */}
      {visualizationDef && (
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('graph')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'graph'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Prerequisites & Graph</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('visualization')}
              className={`flex items-center space-x-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'visualization'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>3D Visual Explorer</span>
            </button>
          </div>

          <span className="text-[10px] text-cyan-400 font-mono hidden sm:inline">
            {activeTab === 'visualization'
              ? `3D Model: ${visualizationDef.displayName}`
              : 'Interactive Prerequisite Map'}
          </span>
        </div>
      )}

      {/* Conditionally Render 3D Visual Viewport vs Graph Canvas */}
      {activeTab === 'visualization' && visualizationDef ? (
        <div className="p-3 bg-slate-950">
          <Topic3DViewer
            definition={visualizationDef}
            isImmersive={false}
            onNavigateTopic={onSelectTopic}
          />
        </div>
      ) : (
        <>
          {/* Search & Subject Domain Filter Bar */}
          <div className="px-4 py-2 bg-slate-900/50 border-b border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Domain Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto">
          <span className="text-[10px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3 text-cyan-400" />
            <span>Domain:</span>
          </span>
          {(['all', 'mathematics', 'physics', 'computer_science'] as const).map((dom) => (
            <button
              key={dom}
              type="button"
              onClick={() => setDomainFilter(dom)}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                domainFilter === dom
                  ? 'bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {dom === 'all'
                ? 'All Subjects'
                : dom === 'mathematics'
                ? 'Mathematics'
                : dom === 'physics'
                ? 'Physics'
                : 'Computer Science'}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-56">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search concepts..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-7 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Search Results Dropdown Overlay */}
      {searchQuery && searchResults.length > 0 && (
        <div className="px-4 py-2 bg-slate-900/95 border-b border-cyan-500/30 max-h-48 overflow-y-auto space-y-1 text-xs">
          <div className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            Matching Concepts ({searchResults.length}):
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {searchResults.slice(0, 6).map((concept) => (
              <div
                key={concept.id}
                onClick={() => {
                  setSelectedNodeId(concept.id);
                  setSearchQuery('');
                }}
                className="p-1.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-400/60 cursor-pointer flex items-center justify-between text-[11px] transition-colors"
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-slate-200">{concept.title}</span>
                  <span className="text-[9px] text-slate-500 block truncate font-mono">
                    {concept.domain} • {concept.difficulty}
                  </span>
                </div>
                <ArrowRight className="w-3 h-3 text-cyan-400 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Next Step Hero Banner */}
      {primaryRecommendation && (
        <div className="px-4 py-2.5 bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900/40 border-b border-cyan-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-start space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400">
                  Adaptive Next Step:
                </span>
                <span className="font-bold text-slate-100">
                  {primaryRecommendation.concept.title}
                </span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">
                  {primaryRecommendation.priority === 'prerequisite_review'
                    ? 'Foundation Review'
                    : primaryRecommendation.priority === 'current_practice'
                    ? 'Target Practice'
                    : 'Advanced Unlock'}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 leading-tight">
                {primaryRecommendation.rationale}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onSelectTopic && onSelectTopic(primaryRecommendation.concept.topicQuery || primaryRecommendation.concept.title)}
            className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold text-[11px] flex items-center space-x-1 shrink-0 transition-all self-end sm:self-auto shadow-md shadow-cyan-950/50"
          >
            <span>Learn Concept</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* SVG Interactive Canvas */}
      <div className="relative w-full h-[360px] overflow-hidden bg-slate-950 flex items-center justify-center p-2 select-none">
        <svg
          viewBox="0 0 720 340"
          className="w-full h-full max-h-[350px] transition-transform duration-200"
          style={{ transform: `scale(${zoomScale})` }}
        >
          <defs>
            <marker
              id="kg-arrowhead"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#38bdf8" />
            </marker>
            <marker
              id="kg-arrowhead-dim"
              markerWidth="8"
              markerHeight="6"
              refX="7"
              refY="3"
              orient="auto"
            >
              <polygon points="0 0, 8 3, 0 6" fill="#64748b" />
            </marker>
            <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#818cf8" stopOpacity="0.8" />
            </linearGradient>
          </defs>

          {/* Background Column Guides */}
          <g opacity="0.3">
            <line x1="230" y1="20" x2="230" y2="320" stroke="#334155" strokeDasharray="4 4" />
            <line x1="470" y1="20" x2="470" y2="320" stroke="#334155" strokeDasharray="4 4" />
          </g>

          {/* Column Header Titles */}
          <text x="120" y="24" fill="#64748b" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            FOUNDATIONAL PREREQUISITES
          </text>
          <text x="350" y="24" fill="#38bdf8" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            ACTIVE TARGET CONCEPT
          </text>
          <text x="580" y="24" fill="#a78bfa" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1">
            DEPENDENT UNLOCKS
          </text>

          {/* Directed Edges with Explicit Connection Points & Endpoints */}
          {edges.map((edge, idx) => {
            const sourceNode = nodes.find((n) => n.concept.id === edge.sourceId);
            const targetNode = nodes.find((n) => n.concept.id === edge.targetId);
            if (!sourceNode || !targetNode) return null;

            const startX = edge.startX ?? (sourceNode.x + 90);
            const startY = edge.startY ?? sourceNode.y;
            const endX = edge.endX ?? (targetNode.x - 90);
            const endY = edge.endY ?? targetNode.y;

            const controlX1 = edge.controlX1 ?? (startX + (endX - startX) * 0.5);
            const controlY1 = edge.controlY1 ?? startY;
            const controlX2 = edge.controlX2 ?? (startX + (endX - startX) * 0.5);
            const controlY2 = edge.controlY2 ?? endY;

            const pathD = edge.pathD || `M ${startX} ${startY} C ${controlX1} ${controlY1}, ${controlX2} ${controlY2}, ${endX} ${endY}`;

            return (
              <g key={idx} className="group/edge">
                <path
                  d={pathD}
                  fill="none"
                  stroke={edge.isHighlighted ? 'url(#edge-gradient)' : '#475569'}
                  strokeWidth={edge.isHighlighted ? 2.5 : 1.5}
                  markerEnd={edge.isHighlighted ? 'url(#kg-arrowhead)' : 'url(#kg-arrowhead-dim)'}
                  strokeDasharray={edge.isHighlighted ? 'none' : '4 3'}
                  className="transition-all hover:stroke-cyan-300"
                />
                {/* Outgoing Source Anchor Dot */}
                <circle
                  cx={startX}
                  cy={startY}
                  r="3.5"
                  fill="#030712"
                  stroke={edge.isHighlighted ? '#38bdf8' : '#64748b'}
                  strokeWidth="1.5"
                  className="transition-transform group-hover/edge:scale-125"
                />
                {/* Incoming Target Anchor Dot */}
                <circle
                  cx={endX}
                  cy={endY}
                  r="3"
                  fill={edge.isHighlighted ? '#38bdf8' : '#64748b'}
                  className="transition-transform group-hover/edge:scale-125"
                />
                {edge.rationale && (
                  <title>{edge.rationale} (From: {edge.sourceId} → To: {edge.targetId})</title>
                )}
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const isSelected = selectedNodeId === node.concept.id;
            const isCurrent = node.role === 'current';
            const isPrereq = node.role === 'prerequisite';

            const cardWidth = 180;
            const cardHeight = 76;
            const rectX = node.x - cardWidth / 2;
            const rectY = node.y - cardHeight / 2;

            return (
              <g
                key={node.concept.id}
                onClick={() => setSelectedNodeId(node.concept.id)}
                className="cursor-pointer group"
              >
                {/* Glow ring for current or selected node */}
                {(isCurrent || isSelected) && (
                  <rect
                    x={rectX - 4}
                    y={rectY - 4}
                    width={cardWidth + 8}
                    height={cardHeight + 8}
                    rx="14"
                    fill="none"
                    stroke={isCurrent ? '#38bdf8' : '#818cf8'}
                    strokeWidth="2"
                    strokeOpacity={isCurrent ? 0.7 : 0.5}
                    className={isCurrent ? 'animate-pulse' : ''}
                  />
                )}

                {/* Node Box */}
                <rect
                  x={rectX}
                  y={rectY}
                  width={cardWidth}
                  height={cardHeight}
                  rx="10"
                  fill={
                    isCurrent
                      ? '#0f172a'
                      : isPrereq
                      ? '#090d16'
                      : '#0a0d18'
                  }
                  stroke={
                    isSelected
                      ? '#38bdf8'
                      : isCurrent
                      ? '#0ea5e9'
                      : isPrereq
                      ? '#1e293b'
                      : '#312e81'
                  }
                  strokeWidth={isCurrent || isSelected ? 2 : 1.2}
                  className="transition-all group-hover:stroke-cyan-400 shadow-xl"
                />

                {/* Category / Role Label */}
                <text
                  x={rectX + 12}
                  y={rectY + 18}
                  fill={isCurrent ? '#38bdf8' : isPrereq ? '#34d399' : '#c084fc'}
                  fontSize="9"
                  fontWeight="bold"
                  letterSpacing="0.5"
                >
                  {isCurrent
                    ? '● ACTIVE LESSON'
                    : isPrereq
                    ? '✓ PREREQUISITE'
                    : '★ UNLOCKS NEXT'}
                </text>

                {/* Difficulty Pill Text */}
                <text
                  x={rectX + cardWidth - 12}
                  y={rectY + 18}
                  fill="#64748b"
                  fontSize="8"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {node.concept.difficulty}
                </text>

                {/* Title (Text truncated to fit card) */}
                <text
                  x={rectX + 12}
                  y={rectY + 38}
                  fill="#f8fafc"
                  fontSize="11"
                  fontWeight="bold"
                >
                  {node.concept.title.length > 22
                    ? `${node.concept.title.slice(0, 20)}...`
                    : node.concept.title}
                </text>

                {/* Domain & Duration metadata */}
                <text
                  x={rectX + 12}
                  y={rectY + 58}
                  fill="#94a3b8"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {node.concept.domain} • {node.concept.estimatedMinutes}m
                </text>

                {/* Inspect arrow indicator */}
                <text
                  x={rectX + cardWidth - 14}
                  y={rectY + 58}
                  fill="#38bdf8"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="end"
                  className="group-hover:translate-x-1 transition-transform"
                >
                  &rarr;
                </text>

                {/* Node Connection Points (Left incoming & Right outgoing endpoints) */}
                <circle
                  cx={rectX}
                  cy={node.y}
                  r="3.5"
                  fill="#020617"
                  stroke={isSelected ? '#38bdf8' : isCurrent ? '#0ea5e9' : isPrereq ? '#34d399' : '#818cf8'}
                  strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform"
                />
                <circle
                  cx={rectX + cardWidth}
                  cy={node.y}
                  r="3.5"
                  fill="#020617"
                  stroke={isSelected ? '#38bdf8' : isCurrent ? '#0ea5e9' : isPrereq ? '#34d399' : '#818cf8'}
                  strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform"
                />
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Node Details Drawer */}
      {selectedNode && (
        <div className="p-4 bg-slate-900/90 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-fadeIn">
          <div className="space-y-1.5 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-100 text-sm">{selectedNode.concept.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                {selectedNode.concept.domain} • {selectedNode.concept.difficulty}
              </span>
              {renderMasteryBadge(selectedNode)}
            </div>

            {/* Key Objectives */}
            <p className="text-slate-300 text-[11px] leading-relaxed">
              {selectedNode.concept.objectives[0] || 'Foundational conceptual and practical reasoning.'}
            </p>

            {/* Relationship Context */}
            {selectedNode.role === 'prerequisite' && targetConcept.rationaleForPrerequisite?.[selectedNode.concept.id] && (
              <div className="text-[10px] text-emerald-400 font-medium">
                Foundational Dependency: {targetConcept.rationaleForPrerequisite[selectedNode.concept.id]}
              </div>
            )}
            {selectedNode.role === 'dependent' && selectedNode.concept.rationaleForPrerequisite?.[targetConcept.id] && (
              <div className="text-[10px] text-purple-400 font-medium">
                Unlocked Pathway: {selectedNode.concept.rationaleForPrerequisite[targetConcept.id]}
              </div>
            )}
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              type="button"
              onClick={() => setSelectedNodeId(null)}
              className="px-2.5 py-1 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
              title="Clear selection"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                if (onSelectTopic) {
                  onSelectTopic(selectedNode.concept.topicQuery || selectedNode.concept.title);
                }
              }}
              className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-bold text-white flex items-center space-x-1 shadow-md shadow-cyan-950/40 transition-all active:scale-95"
            >
              <span>{selectedNode.role === 'current' ? 'Study Active Lesson' : 'Navigate To Concept'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
};
