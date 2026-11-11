/**
 * VisiOS — Unified Scientific Laboratory Modal
 *
 * Provides a comprehensive, multi-disciplinary interactive scientific workbench
 * on the canvas, integrating JupyterLite/Pyodide, Ketcher, Rapier, Mol*, and Manim.
 */

import React, { useState } from 'react';
import {
  X,
  Terminal,
  Activity,
  Dna,
  Video,
  Sparkles,
  ShieldCheck,
  ExternalLink,
  Cpu,
} from 'lucide-react';
import { KetcherMoleculeDrawer } from './KetcherMoleculeDrawer';
import { ManimAnimationViewer } from './ManimAnimationViewer';
import { MolStarViewer } from './MolStarViewer';
import { PyodideNotebookView } from './PyodideNotebookView';
import { RapierPhysicsSandbox } from './RapierPhysicsSandbox';
import { ScientificEngineRegistry } from '../ScientificEngineRegistry';
import { ScientificIntegrationId } from '../types';

interface ScientificLaboratoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: ScientificIntegrationId;
}

export const ScientificLaboratoryModal: React.FC<ScientificLaboratoryModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'rapier',
}) => {
  const [activeTab, setActiveTab] = useState<ScientificIntegrationId>(defaultTab);
  const registry = ScientificEngineRegistry.getInstance();
  const allMetadata = registry.getAllMetadata();
  const currentMeta = allMetadata.find((m) => m.id === activeTab) || allMetadata[0];

  if (!isOpen) return null;

  const tabs: { id: ScientificIntegrationId; label: string; icon: any; color: string }[] = [
    { id: 'rapier', label: 'Physics (Rapier)', icon: Activity, color: 'text-emerald-400' },
    { id: 'ketcher', label: 'Chemistry (Ketcher)', icon: Sparkles, color: 'text-amber-400' },
    { id: 'molstar', label: 'Biology (Mol*)', icon: Dna, color: 'text-cyan-400' },
    { id: 'manim', label: 'Math (Manim)', icon: Video, color: 'text-indigo-400' },
    { id: 'pyodide', label: 'Coding (Pyodide)', icon: Terminal, color: 'text-yellow-400' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800/80 bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">
                VisiOS Scientific Laboratory
              </h3>
              <p className="text-[11px] text-slate-400">
                Integrated Open-Source Scientific Engines & Interactive Sandboxes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-5 py-2.5 bg-slate-900/30 border-b border-slate-800/60 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${tab.color}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Studio Body Container */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {activeTab === 'rapier' && <RapierPhysicsSandbox />}
          {activeTab === 'ketcher' && <KetcherMoleculeDrawer />}
          {activeTab === 'molstar' && <MolStarViewer />}
          {activeTab === 'manim' && <ManimAnimationViewer />}
          {activeTab === 'pyodide' && <PyodideNotebookView />}

          {/* Engine Metadata, License & Health Disclosure Footer */}
          <div className="p-3 rounded-xl bg-slate-900/50 border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-[11px] text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>
                Engine: <strong className="text-slate-200">{currentMeta.name}</strong> (v{currentMeta.version})
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                {currentMeta.license}
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-500">
                Memory Limit: {currentMeta.resourceLimits.maxMemoryMb} MB
              </span>
              <a
                href={currentMeta.documentationUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium"
              >
                Docs <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
