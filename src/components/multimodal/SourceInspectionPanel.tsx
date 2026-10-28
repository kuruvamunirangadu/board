'use client';

import React from 'react';
import { SourceReference } from '@/types/multimodal';
import { documentStore } from '@/features/multimodal/document-store';
import { 
  FileText, 
  ExternalLink, 
  AlertCircle, 
  ShieldCheck, 
  BookOpen, 
  CheckCircle2, 
  X 
} from 'lucide-react';

interface SourceInspectionPanelProps {
  sourceReferences?: SourceReference[];
  conceptTitle: string;
  onClose?: () => void;
}

export const SourceInspectionPanel: React.FC<SourceInspectionPanelProps> = ({
  sourceReferences = [],
  conceptTitle,
  onClose,
}) => {
  if (sourceReferences.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-xs space-y-1 text-slate-400">
        <div className="flex items-center space-x-2 text-slate-300 font-semibold">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span>Source Traceability</span>
        </div>
        <p className="text-[11px] text-slate-500">
          This concept was created directly in the editor and is not linked to an imported PDF or document.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold text-white">Originating Source Evidence</h4>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="space-y-2.5">
        {sourceReferences.map((ref, idx) => {
          const doc = documentStore.getDocument(ref.documentId);
          const isDocAvailable = !!doc;

          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs space-y-1.5 ${
                isDocAvailable
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-950/40 border-amber-900/40 text-amber-200'
              }`}
            >
              <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400">
                <span className="truncate max-w-[200px]">{ref.documentFilename}</span>
                <span className="text-slate-500">Page {ref.pageNumber || 1}</span>
              </div>

              <p className="text-xs text-slate-300 italic leading-relaxed">
                "{ref.excerpt}"
              </p>

              {!isDocAvailable && (
                <div className="pt-1 text-[10px] text-amber-400 flex items-center space-x-1">
                  <AlertCircle className="w-3 h-3" />
                  <span>Original file removed from local storage; reference cached.</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

