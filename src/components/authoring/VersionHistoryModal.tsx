'use client';

import React from 'react';
import { ContentVersionSnapshot, ContentPackDraft } from '@/types/authoring';
import { 
  X, 
  History, 
  RotateCcw, 
  Download, 
  Upload, 
  CheckCircle, 
  Clock,
  Layers,
  FileJson
} from 'lucide-react';

interface VersionHistoryModalProps {
  draft: ContentPackDraft;
  snapshots: ContentVersionSnapshot[];
  onRestoreSnapshot: (snapshotId: string) => void;
  onExportJson: () => void;
  onImportJson: (file: File) => void;
  onClose: () => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  draft,
  snapshots,
  onRestoreSnapshot,
  onExportJson,
  onImportJson,
  onClose,
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJson(file);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-3xl max-h-[85vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Version History & Snapshots</h3>
              <p className="text-xs text-slate-400">
                Track changes, revert to previous milestones, and backup/import content manifests
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

        {/* Toolbar: Export / Import */}
        <div className="px-6 py-3 bg-slate-900/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <span className="text-slate-400">Current Working Version: <strong className="text-cyan-400 font-mono">v{draft.version}</strong></span>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={onExportJson}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export JSON</span>
            </button>

            <label className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition">
              <Upload className="w-3.5 h-3.5 text-purple-400" />
              <span>Import JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>
        </div>

        {/* Snapshots List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
          {snapshots.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No version snapshots recorded yet. Snapshots are created when you publish or save milestones.
            </div>
          ) : (
            snapshots.map((snap) => {
              const dateStr = new Date(snap.timestamp).toLocaleString();
              const topicCount = snap.snapshot.topics?.length || 0;
              const conceptCount = snap.snapshot.concepts?.length || 0;

              return (
                <div
                  key={snap.id}
                  className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 flex items-center justify-between gap-4 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
                        v{snap.version}
                      </span>
                      <span className="text-xs font-semibold text-white">{snap.authorNotes}</span>
                    </div>
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{dateStr}</span>
                      </span>
                      <span>•</span>
                      <span>{topicCount} Topics</span>
                      <span>•</span>
                      <span>{conceptCount} Concepts</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRestoreSnapshot(snap.id)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-medium transition shrink-0"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore Draft</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

