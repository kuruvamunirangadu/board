'use client';

import React from 'react';
import { 
  LearningResource, 
  CapabilityDefinition 
} from '@/types/knowledge';
import { defaultCapabilityRegistry } from '@/features/knowledge/registry/capability-registry';
import { 
  Activity, 
  Box, 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Plus, 
  Trash2,
  Cpu
} from 'lucide-react';

interface LearningResourceBuilderProps {
  conceptId: string;
  resources: LearningResource[];
  onAddResource: (resource: LearningResource) => void;
  onRemoveResource: (resourceId: string) => void;
  onUpdateResource: (resource: LearningResource) => void;
}

export const LearningResourceBuilder: React.FC<LearningResourceBuilderProps> = ({
  conceptId,
  resources,
  onAddResource,
  onRemoveResource,
  onUpdateResource,
}) => {
  const capabilities = defaultCapabilityRegistry.listCapabilities();
  const conceptResources = resources.filter((r) => r.associatedConceptIds.includes(conceptId));

  const handleCreateNew = (type: 'diagram' | 'simulation' | '3d_model' | 'graph' | 'note') => {
    let reqCap = 'canvas.diagram';
    if (type === 'simulation') reqCap = 'simulation.pendulum';
    if (type === '3d_model') reqCap = '3d.heart';
    if (type === 'graph') reqCap = 'math.function_graph';

    const cap = defaultCapabilityRegistry.getCapability(reqCap);

    const newRes: LearningResource = {
      id: `resource_${type}_${Date.now().toString(36)}`,
      resourceType: type,
      associatedConceptIds: [conceptId],
      title: `Interactive ${type.replace('_', ' ').toUpperCase()} Activity`,
      description: `Hands-on exploratory learning activity for this concept.`,
      requiredCapability: reqCap,
      capabilityStatus: cap?.status || 'available',
      contentVersion: '0.1.0',
    };

    onAddResource(newRes);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-xs font-semibold text-white">Attached Learning Resources & Visualizations</h4>
          <p className="text-[11px] text-slate-400">
            Link verified 2D diagrams, 3D spatial models, and physics simulations to this concept
          </p>
        </div>

        {/* Add Resource Buttons */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => handleCreateNew('diagram')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
          >
            <FileText className="w-3 h-3 text-cyan-400" />
            <span>Diagram</span>
          </button>
          <button
            onClick={() => handleCreateNew('simulation')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
          >
            <Activity className="w-3 h-3 text-blue-400" />
            <span>Simulation</span>
          </button>
          <button
            onClick={() => handleCreateNew('3d_model')}
            className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700 transition"
          >
            <Box className="w-3 h-3 text-emerald-400" />
            <span>3D Model</span>
          </button>
        </div>
      </div>

      {conceptResources.length === 0 ? (
        <div className="p-5 rounded-xl bg-slate-900/30 border border-dashed border-slate-800 text-center text-xs text-slate-500">
          No learning activities attached to this concept yet. Add a Diagram, Simulation, or 3D Model above.
        </div>
      ) : (
        <div className="space-y-3">
          {conceptResources.map((res) => {
            const cap = defaultCapabilityRegistry.getCapability(res.requiredCapability);

            return (
              <div
                key={res.id}
                className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3 relative group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-2">
                    <span className="p-1.5 rounded-lg bg-slate-800 text-slate-300">
                      {res.resourceType === 'simulation' ? (
                        <Activity className="w-4 h-4 text-blue-400" />
                      ) : res.resourceType === '3d_model' ? (
                        <Box className="w-4 h-4 text-emerald-400" />
                      ) : res.resourceType === 'graph' ? (
                        <TrendingUp className="w-4 h-4 text-purple-400" />
                      ) : (
                        <FileText className="w-4 h-4 text-cyan-400" />
                      )}
                    </span>
                    <input
                      type="text"
                      value={res.title}
                      onChange={(e) => onUpdateResource({ ...res, title: e.target.value })}
                      className="bg-transparent border-b border-transparent focus:border-cyan-500 text-xs font-semibold text-white focus:outline-none px-1"
                    />
                  </div>

                  <button
                    onClick={() => onRemoveResource(res.id)}
                    className="p-1 text-slate-500 hover:text-red-400 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400">Activity Instructions / Summary</label>
                  <input
                    type="text"
                    value={res.description}
                    onChange={(e) => onUpdateResource({ ...res, description: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                {/* Capability Link & Verification Badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-[11px]">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Requires Capability:</span>
                    <select
                      value={res.requiredCapability}
                      onChange={(e) => {
                        const newCap = defaultCapabilityRegistry.getCapability(e.target.value);
                        onUpdateResource({
                          ...res,
                          requiredCapability: e.target.value,
                          capabilityStatus: newCap?.status || 'available',
                        });
                      }}
                      className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                    >
                      {capabilities.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.id})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {cap?.status === 'available' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] border border-emerald-500/20 font-medium">
                        <CheckCircle className="w-3 h-3" />
                        <span>Ready & Supported</span>
                      </span>
                    ) : cap?.status === 'planned' ? (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 text-[10px] border border-amber-500/20 font-medium">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Planned (Simulated)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 text-[10px] border border-rose-500/20 font-medium">
                        <XCircle className="w-3 h-3" />
                        <span>Unsupported</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

