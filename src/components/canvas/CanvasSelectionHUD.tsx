'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor, createShapeId } from 'tldraw';
import { 
  Sparkles, 
  BookOpen, 
  Layers, 
  Activity, 
  HelpCircle, 
  ArrowRight, 
  Wand2, 
  Trash2, 
  Calculator,
  Compass,
  Loader2,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { BoardFeedParser, KNOWN_FORMULA_REGISTRY, RecognizedFormula } from '@/features/intelligence/board-feed-parser';
import { LearningOrchestrator } from '@/features/learning/LearningOrchestrator';
import { Workspace } from '@/types';
import { IModel3dShape } from './Model3dShapeUtil';
import { ISimulationShape } from './SimulationShapeUtil';
import { ILearningCardShape } from './LearningCardShapeUtil';
import { CanvasStampingEngine } from '@/features/canvas/CanvasStampingEngine';

interface CanvasSelectionHUDProps {
  editor: Editor | null;
  workspace: Workspace;
  onOpenSidebarTab?: (tab: 'intelligence' | 'portals' | 'tools') => void;
  onSelectFormula?: (formula: RecognizedFormula) => void;
}

export const CanvasSelectionHUD: React.FC<CanvasSelectionHUDProps> = ({
  editor,
  workspace,
  onOpenSidebarTab,
  onSelectFormula,
}) => {
  const [selectedCount, setSelectedCount] = useState(0);
  const [hasDrawStrokes, setHasDrawStrokes] = useState(false);
  const [matchedFormula, setMatchedFormula] = useState<RecognizedFormula | null>(null);
  const [hasModel3D, setHasModel3D] = useState(false);
  const [hasSimulation, setHasSimulation] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const stampedCardShapeIdsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!editor) return;

    const updateState = () => {
      const selected = editor.getSelectedShapes();
      const all = editor.getCurrentPageShapes();

      setSelectedCount(selected.length);

      const isDraw = selected.some((s) => s.type === 'draw');
      setHasDrawStrokes(isDraw);

      const isModel = selected.some((s) => s.type === 'model3d') || all.some((s) => s.type === 'model3d');
      setHasModel3D(isModel);

      const isSim = selected.some((s) => s.type === 'simulation') || all.some((s) => s.type === 'simulation');
      setHasSimulation(isSim);

      // Check for formulas
      const parsed = BoardFeedParser.parseBoardFeed(selected.length > 0 ? selected : all);
      setMatchedFormula(parsed || null);
    };

    updateState();
    const unlisten = editor.store.listen(updateState);
    const interval = setInterval(updateState, 400);

    return () => {
      unlisten();
      clearInterval(interval);
    };
  }, [editor]);

  // Stamp full solved cards on canvas using LearningOrchestrator
  const handleTransformOnBoard = async (f?: RecognizedFormula) => {
    if (!editor || isTransforming) return;

    const formulaToUse = f || matchedFormula;
    if (!formulaToUse) {
      // If no formula directly matched, inspect whether there is any valid board text
      const allShapes = editor.getCurrentPageShapes();
      const detected = BoardFeedParser.parseBoardFeed(allShapes);
      if (detected) {
        return handleTransformOnBoard(detected);
      }
      return;
    }

    setIsTransforming(true);

    try {
      const orchestrated = await LearningOrchestrator.processTopic(formulaToUse.rawText);
      const plan = orchestrated.plan;
      const cleanTitle = plan.title.replace(/^[✨📐👁️🧪🧠\s]+/, '');

      // If honest uncertainty / ambiguous input, stamp readable clarification card
      if (plan.uncertaintyState?.isUncertain) {
        if (stampedCardShapeIdsRef.current.length > 0) {
          const currentShapes = editor.getCurrentPageShapes().map((s) => s.id);
          const toDelete = stampedCardShapeIdsRef.current.filter((id) =>
            currentShapes.includes(id as any)
          );
          if (toDelete.length > 0) {
            editor.deleteShapes(toDelete as any);
          }
          stampedCardShapeIdsRef.current = [];
        }

        const pageBounds = editor.getViewportPageBounds();
        const startX = pageBounds ? Math.max(80, pageBounds.center.x - 210) : 200;
        const startY = pageBounds ? Math.max(80, pageBounds.center.y - 190) : 200;
        const idUncertain = createShapeId();
        const clarifications = plan.uncertaintyState.suggestedClarifications || [
          'Please specify physical domain or variable constraints.',
        ];

        editor.createShape<ILearningCardShape>({
          id: idUncertain,
          type: 'learning-card',
          x: startX,
          y: startY,
          props: {
            w: 420,
            h: 380,
            title: `Clarification: ${cleanTitle}`,
            category: 'clarification',
            badge: 'Clarification Needed',
            content: plan.uncertaintyState.reason || 'Expression requires clarification.',
            steps: clarifications.map((c) => `Interpretation: ${c}`),
            takeaway: 'Disambiguate input to generate full worked solution.',
            accentColor: 'amber',
          },
        });
        stampedCardShapeIdsRef.current = [String(idUncertain)];
        editor.setSelectedShapes([idUncertain]);
        return;
      }

      // Stamp full readable suite & live geometry
      const createdShapeIds = CanvasStampingEngine.stampLearningSuite(editor, plan, {
        replacePrevious: true,
        previousShapeIds: stampedCardShapeIdsRef.current,
        highlightSelection: true,
      });

      stampedCardShapeIdsRef.current = createdShapeIds.map((id) => String(id));

      if (onSelectFormula) {
        onSelectFormula({
          rawText: formulaToUse.rawText,
          normalizedFormula: plan.title,
          topic: (plan.category === 'concept' ? 'algebra' : plan.category) as any,
          title: plan.title,
          solvedResult: plan.overview,
          studyGuide: {
            intuition: plan.overview,
            prerequisites: plan.prerequisites,
            realWorldApplication: plan.applications[0] || '',
          },
          algebraicSteps: plan.derivationSteps.map((s) => s.explanation),
          geometricProofSummary: plan.visualizationPlan.description,
          hasInteractiveAnimation: false,
          animationType: 'generic',
        });
      }
      if (onOpenSidebarTab) {
        onOpenSidebarTab('intelligence');
      }
    } catch (e) {
      console.error('Failed to stamp transformation on canvas:', e);
    } finally {
      setIsTransforming(false);
    }
  };

  const handleOpenStudy = (tab: 'intelligence' | 'portals') => {
    if (matchedFormula && onSelectFormula) {
      onSelectFormula(matchedFormula);
    }
    if (onOpenSidebarTab) {
      onOpenSidebarTab(tab);
    }
  };

  return (
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
      <div className="flex items-center gap-2 p-2 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-cyan-500/40 shadow-2xl shadow-cyan-950/40 text-slate-100">
        {/* Leading Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-cyan-500/20 text-cyan-400 font-medium text-xs">
          <Sparkles className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-semibold line-clamp-1 max-w-[200px]">
            {matchedFormula
              ? matchedFormula.normalizedFormula.includes('=') ||
                matchedFormula.topic === 'algorithm' ||
                matchedFormula.topic === 'chemistry' ||
                matchedFormula.normalizedFormula.length > 25
                ? matchedFormula.normalizedFormula
                : `${matchedFormula.normalizedFormula} = ?`
              : 'Select or write a formula'}
          </span>
        </div>

        {/* Primary Action: Transform & Solve onto Canvas */}
        <button
          onClick={() => handleTransformOnBoard()}
          disabled={isTransforming || (!matchedFormula && selectedCount === 0 && !hasDrawStrokes)}
          title="Transform this formula or drawing into formatted solution cards on the board"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs shadow-md shadow-cyan-900/40 transition-all active:scale-95"
        >
          {isTransforming ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Wand2 className="w-3.5 h-3.5" />
          )}
          <span>{isTransforming ? 'Orchestrating...' : 'Transform on Board'}</span>
        </button>

        {/* Study Guide Action */}
        <button
          onClick={() => handleOpenStudy('intelligence')}
          title="Open complete Study Guide, Step-by-Step Derivation, and Interactive Visual Proof"
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-medium transition-colors"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-400" />
          <span>Study & Derive</span>
        </button>

        {/* Quick Identity Pills */}
        <div className="hidden sm:flex items-center gap-1 pl-1 border-l border-slate-800 text-[11px]">
          <span className="text-slate-500 text-[10px] uppercase font-bold px-1">Example:</span>
          {KNOWN_FORMULA_REGISTRY.slice(0, 3).map((f, i) => (
            <button
              key={i}
              onClick={() => handleTransformOnBoard(f)}
              className="px-2 py-1 rounded-lg bg-slate-800/80 hover:bg-cyan-950 hover:border-cyan-500/50 border border-slate-700/60 font-mono text-[10px] text-slate-300 hover:text-cyan-300 transition-colors"
            >
              {f.normalizedFormula} = {f.solvedResult}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

