'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  TopicVisualizationDefinition,
  StructureTargetMetadata,
} from '@/features/learning/TopicVisualizationRegistry';
import { Brain3DViewer } from './Brain3DViewer';
import { Heart3DViewer } from './Heart3DViewer';
import { Molecule3DViewer } from './Molecule3DViewer';
import { Math3DViewer } from './Math3DViewer';
import { GeometricSolids3DViewer } from './GeometricSolids3DViewer';
import {
  RotateCcw,
  Sparkles,
  Info,
  Eye,
  Activity,
  Layers,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Brain,
  Heart,
  Orbit,
  Maximize2,
  Minimize2,
  Box,
} from 'lucide-react';
import { VisualLearningDiagnosticsEngine } from '@/features/diagnostics/VisualLearningDiagnosticsEngine';

interface Topic3DViewerProps {
  definition: TopicVisualizationDefinition;
  viewModeOverride?: string;
  isImmersive?: boolean;
  className?: string;
  onSelectStructure?: (structure: StructureTargetMetadata) => void;
  onNavigateTopic?: (topic: string) => void;
}

/**
 * Universal Topic-Aware 3D Educational Viewer
 * Renders verified 3D models with structure inspection, educational notes,
 * camera controls, and graceful non-WebGL 2D fallbacks.
 */
export const Topic3DViewer: React.FC<Topic3DViewerProps> = ({
  definition,
  viewModeOverride,
  isImmersive = false,
  className = '',
  onSelectStructure,
  onNavigateTopic,
}) => {
  const [selectedStructureId, setSelectedStructureId] = useState<string>(() => {
    return definition.supportedStructures[0]?.id || '';
  });
  const [showAccuracyNotes, setShowAccuracyNotes] = useState(false);
  const [webGLSupported, setWebGLSupported] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Check WebGL availability on mount and report diagnostics if unavailable
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl =
        canvas.getContext('webgl') ||
        canvas.getContext('experimental-webgl');
      const supported = !!gl;
      setWebGLSupported(supported);
      if (!supported) {
        VisualLearningDiagnosticsEngine.checkVisualizationHealth(definition.displayName, {
          rendererType: 'threejs_viewer',
          is3D: true,
          webGLAvailable: false,
        });
      }
    } catch {
      setWebGLSupported(false);
      VisualLearningDiagnosticsEngine.checkVisualizationHealth(definition.displayName, {
        rendererType: 'threejs_viewer',
        is3D: true,
        webGLAvailable: false,
      });
    }
  }, [definition]);

  // Update selected structure when definition changes
  useEffect(() => {
    if (definition.supportedStructures.length > 0) {
      setSelectedStructureId(definition.supportedStructures[0].id);
    }
    setLoadError(null);
  }, [definition]);

  const activeStructure = useMemo(() => {
    return (
      definition.supportedStructures.find((s) => s.id === selectedStructureId) ||
      definition.supportedStructures[0] ||
      null
    );
  }, [definition, selectedStructureId]);

  const handleSelect = (s: StructureTargetMetadata) => {
    setSelectedStructureId(s.id);
    onSelectStructure?.(s);
  };

  // 1. Non-WebGL 2D Fallback
  if (!webGLSupported || loadError) {
    return (
      <div
        className={`relative w-full h-full min-h-[360px] rounded-2xl bg-slate-950 border border-slate-800 p-4 flex flex-col justify-between select-none ${className}`}
      >
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <div className="flex items-center space-x-2">
              <span className="p-1 rounded-md bg-amber-500/20 text-amber-400">
                <AlertTriangle className="w-4 h-4" />
              </span>
              <div>
                <h4 className="text-xs font-bold text-white tracking-wide">
                  {definition.displayName} (2D Schematic Fallback)
                </h4>
                <p className="text-[10px] text-slate-400">
                  WebGL 3D rendering unavailable — displaying 2D educational schematic.
                </p>
              </div>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-amber-500/30">
              2D Fallback
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
            <div className="text-[11px] font-semibold text-cyan-400 flex items-center space-x-1.5">
              <Eye className="w-3.5 h-3.5" />
              <span>Supported Anatomical & Structural Targets</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {definition.supportedStructures.map((struct) => (
                <button
                  key={struct.id}
                  onClick={() => handleSelect(struct)}
                  className={`p-2 rounded-lg text-left transition-all border ${
                    selectedStructureId === struct.id
                      ? 'bg-cyan-950/40 border-cyan-500/60 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-xs font-semibold">{struct.name}</div>
                  <div className="text-[10px] text-slate-400 truncate">{struct.category}</div>
                </button>
              ))}
            </div>
          </div>

          {activeStructure && (
            <div className="p-3.5 rounded-xl bg-slate-900 border border-cyan-500/30 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-300">{activeStructure.name}</span>
                <span className="text-[10px] text-slate-400">{activeStructure.category}</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">{activeStructure.description}</p>
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                <span className="font-semibold text-slate-300">Physiological Role:</span> {activeStructure.role}
              </div>
              {activeStructure.linkedTopicQuery && onNavigateTopic && (
                <div className="pt-1.5 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => onNavigateTopic(activeStructure.linkedTopicQuery!)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <span>🚀 {activeStructure.actionLabel || `Explore Lesson: ${activeStructure.linkedTopicQuery}`}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="text-[10px] text-slate-500 italic pt-2 text-center">
          💡 {definition.limitationsAndAccuracyNotes}
        </div>
      </div>
    );
  }

  // 2. Render 3D Model by Canonical Type
  const render3DScene = () => {
    switch (definition.canonicalModelType) {
      case 'nervous_system':
        return (
          <Brain3DViewer
            initialViewMode={viewModeOverride === 'neuron' ? 'neuron' : 'cns'}
            isImmersive={isImmersive}
            zoom={1.05}
          />
        );
      case 'neuron':
        return (
          <Brain3DViewer
            initialViewMode="neuron"
            isImmersive={isImmersive}
            zoom={1.1}
          />
        );
      case 'heart':
        return <Heart3DViewer isImmersive={isImmersive} zoom={1.1} />;
      case 'molecule':
        return (
          <Molecule3DViewer
            initialPreset={definition.initialPreset || 'h2o'}
            isImmersive={isImmersive}
            zoom={1.2}
          />
        );
      case 'geometric_solids':
        return <GeometricSolids3DViewer isImmersive={isImmersive} zoom={1.1} />;
      case 'vectors_3d':
        return <Math3DViewer isImmersive={isImmersive} zoom={1.1} />;
      default:
        return <Brain3DViewer isImmersive={isImmersive} zoom={1.05} />;
    }
  };

  return (
    <div
      className={`relative w-full h-full min-h-[380px] rounded-2xl bg-slate-950 border border-slate-800 flex flex-col overflow-hidden select-none ${className}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top HUD Header */}
      <div className="px-3 py-2 bg-slate-900/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between z-10">
        <div className="flex items-center space-x-2">
          <span className="p-1 rounded-md bg-cyan-500/20 text-cyan-400">
            {definition.domain === 'biology' ? (
              <Brain className="w-3.5 h-3.5" />
            ) : definition.domain === 'chemistry' ? (
              <Orbit className="w-3.5 h-3.5" />
            ) : definition.domain === 'mathematics' ? (
              <Box className="w-3.5 h-3.5" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
          </span>
          <div>
            <span className="text-xs font-bold text-white tracking-wide">
              {definition.displayName}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-950 text-cyan-400 border border-cyan-800/40">
            {definition.modelKind === 'procedural_schematic'
              ? 'Procedural 3D Schematic'
              : 'Validated 3D Asset'}
          </span>
          <button
            onClick={() => setShowAccuracyNotes((prev) => !prev)}
            title="Pedagogical Accuracy & Limitations"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Accuracy, Learning Objectives & Limitations Disclosure Banner (Expandable) */}
      {showAccuracyNotes && (
        <div className="px-3.5 py-2.5 bg-slate-900/95 border-b border-cyan-500/30 text-[11px] text-slate-300 space-y-2 z-20 max-h-56 overflow-y-auto">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold text-xs">
              <Info className="w-3.5 h-3.5 shrink-0" />
              <span>Pedagogical Accuracy & Model Verification</span>
            </div>
            <button
              onClick={() => setShowAccuracyNotes(false)}
              className="text-slate-500 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>

          <p className="text-[10px] text-slate-400 leading-relaxed">
            {definition.limitationsAndAccuracyNotes}
          </p>

          {definition.learningObjectives && definition.learningObjectives.length > 0 && (
            <div className="space-y-1 pt-1 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                Core Learning Objectives:
              </span>
              <ul className="list-disc list-inside text-[10px] text-slate-300 space-y-0.5">
                {definition.learningObjectives.map((obj, i) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {definition.nextActions && definition.nextActions.length > 0 && onNavigateTopic && (
            <div className="space-y-1.5 pt-1 border-t border-slate-800">
              <span className="text-[10px] font-semibold text-slate-300 uppercase tracking-wider">
                Recommended Next Exploration:
              </span>
              <div className="flex flex-wrap gap-1">
                {definition.nextActions.map((action) => (
                  <button
                    key={action.id}
                    type="button"
                    onClick={() => onNavigateTopic(action.topicQuery)}
                    className="px-2 py-0.5 rounded bg-slate-800 hover:bg-cyan-900/50 border border-slate-700 text-cyan-300 text-[10px] font-medium flex items-center gap-1 transition-all"
                  >
                    <span>{action.label}</span>
                    <span>→</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main 3D Viewport Area */}
      <div className="relative flex-1 w-full h-[280px] bg-slate-950 flex items-center justify-center overflow-hidden">
        {render3DScene()}
      </div>

      {/* Bottom Structure Selection & Educational Metadata Bar */}
      {definition.supportedStructures.length > 0 && (
        <div className="p-2.5 bg-slate-900/90 border-t border-slate-800/80 backdrop-blur-md space-y-2 z-10">
          {/* Structure Selection Pills */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-0.5 scrollbar-thin">
            <span className="text-[10px] text-slate-400 font-semibold px-1 shrink-0 uppercase tracking-wider">
              Inspect:
            </span>
            {definition.supportedStructures.map((struct) => (
              <button
                key={struct.id}
                onClick={() => handleSelect(struct)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-medium whitespace-nowrap transition-all border ${
                  selectedStructureId === struct.id
                    ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-sm'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                }`}
              >
                {struct.name.split('(')[0].trim()}
              </button>
            ))}
          </div>

          {/* Active Structure Educational Detail Card */}
          {activeStructure && (
            <div className="p-2 rounded-xl bg-slate-950/90 border border-slate-800 text-[11px] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-cyan-300">{activeStructure.name}</span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {activeStructure.category}
                </span>
              </div>
              <p className="text-slate-300 text-[11px] leading-snug">
                {activeStructure.description}
              </p>
              <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/60 flex items-start gap-1">
                <span className="font-semibold text-slate-300 shrink-0">Role:</span>
                <span className="text-slate-300">{activeStructure.role}</span>
              </div>
              {activeStructure.linkedTopicQuery && onNavigateTopic && (
                <div className="pt-1.5 flex items-center justify-between border-t border-slate-800/80">
                  <button
                    type="button"
                    onClick={() => onNavigateTopic(activeStructure.linkedTopicQuery!)}
                    className="px-2.5 py-1 rounded-lg bg-cyan-600/30 hover:bg-cyan-600/50 border border-cyan-500/40 text-cyan-300 hover:text-white text-[10px] font-semibold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                  >
                    <span>🚀 {activeStructure.actionLabel || `Study Connected Lesson: ${activeStructure.linkedTopicQuery}`}</span>
                  </button>
                  {activeStructure.linkedConceptId && (
                    <span className="text-[9px] font-mono text-slate-500">
                      Concept: {activeStructure.linkedConceptId}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
