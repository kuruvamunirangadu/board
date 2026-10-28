'use client';
import React, { useState } from 'react';
import { 
  MultimodalIngestionService 
} from '@/features/multimodal/ingestion-service';
import { 
  MultimodalIngestionResult, 
  SourceGroundedConcept, 
  SourceReference 
} from '@/types/multimodal';
import { 
  Upload, 
  FileText, 
  FileCheck, 
  Sparkles, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  Layers, 
  BookOpen, 
  ArrowRight, 
  HelpCircle, 
  Image as ImageIcon,
  Clock,
  ShieldCheck,
  RefreshCw,
  Trash2,
  FileSpreadsheet
} from 'lucide-react';
interface MultimodalImportModalProps {
  onImportCompleted: (result: MultimodalIngestionResult) => void;
  onClose: () => void;
}
export const MultimodalImportModal: React.FC<MultimodalImportModalProps> = ({
  onImportCompleted,
  onClose,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ingestionResult, setIngestionResult] = useState<MultimodalIngestionResult | null>(null);
  const [selectedConcept, setSelectedConcept] = useState<SourceGroundedConcept | null>(null);
  const sampleDemoFiles = [
    {
      name: 'Lecture_Notes_Quantum_Superposition.md',
      type: 'text/markdown',
      content: `# Quantum Superposition & Measurement\n\n## 1. Principles of State Vectors\nA quantum state |ψ⟩ is represented as a linear combination of orthonormal basis states |0⟩ and |1⟩.\n\n$$|\\psi\\rangle = \\alpha |0\\rangle + \\beta |1\\rangle$$\n\nWhere probability amplitudes satisfy normalisation $|\\alpha|^2 + |\\beta|^2 = 1$.\n\n## 2. Born Rule & Wavefunction Collapse\nUpon projective measurement, the state collapses probabilistically into basis eigenstate |0⟩ with probability $|\\alpha|^2$ or |1⟩ with probability $|\\beta|^2$.`,
      size: 1420,
    },
    {
      name: 'Textbook_Ch4_Electromagnetism.pdf',
      type: 'application/pdf',
      content: `[Page 1]\n# Magnetic Flux & Induction Dynamics\nMagnetic flux Φ represents field line permeability through surface area A.\n\nΦ = B * A * cos(θ)\n\n[Page 2]\n# Faraday's Law of Electromagnetic Induction\nTime-varying magnetic flux induces electromotive force (EMF) across closed circuits.\n\nε = -N * (dΦ/dt)\n\nLenz's law requires the induced polarity to oppose flux change to preserve energy conservation.`,
      size: 3200,
    },
  ];
  const handleProcessFile = async (file: { name: string; type: string; size: number; content: string | Uint8Array | ArrayBuffer }) => {
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const result = await MultimodalIngestionService.ingestDocument({
        name: file.name,
        type: file.type,
        size: file.size,
        content: file.content,
      });
      setIngestionResult(result);
      if (result.concepts.length > 0) {
        setSelectedConcept(result.concepts[0]);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to ingest learning material.');
    } finally {
      setIsProcessing(false);
    }
  };
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result;
      if (content) {
        handleProcessFile({
          name: file.name,
          type: file.type,
          size: file.size,
          content: content as any,
        });
      }
    };
    if (file.name.endsWith('.pdf') || file.type.includes('image')) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result;
        if (content) {
          handleProcessFile({
            name: file.name,
            type: file.type,
            size: file.size,
            content: content as any,
          });
        }
      };

      if (file.name.endsWith('.pdf') || file.type.includes('image')) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl max-h-[92vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Multimodal Learning Material Ingestion</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-bold">
                  MILESTONE 13
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Transform PDF notes, textbooks, and diagrams into source-grounded interactive lessons
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {!ingestionResult ? (
            /* Upload Screen */
            <div className="max-w-2xl mx-auto space-y-6 py-6">
              {/* Dropzone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`p-8 rounded-2xl border-2 border-dashed text-center transition-all cursor-pointer ${
                  isDragging
                    ? 'border-cyan-500 bg-cyan-950/20 shadow-lg shadow-cyan-500/10'
                    : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                }`}
              >
                <input
                  type="file"
                  id="doc-file-upload"
                  accept=".pdf,.txt,.md,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileInput}
                />
                <label htmlFor="doc-file-upload" className="cursor-pointer space-y-3 block">
                  <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/20">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">
                      Drop lecture notes, PDF chapter, or diagram image here
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      Supports PDF, Markdown (.md), Plain Text (.txt), PNG, and JPEG (up to 20 MB)
                    </p>
                  </div>
                  <span className="inline-block px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-300 border border-slate-700 transition">
                    Browse Local File
                  </span>
                </label>
              </div>

              {/* Sample Files for Rapid Exploration */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-300">Or explore with sample materials:</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sampleDemoFiles.map((s, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleProcessFile(s)}
                      disabled={isProcessing}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 text-left transition flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <FileCheck className="w-4 h-4 text-cyan-400" />
                        <div>
                          <p className="text-xs font-semibold text-white group-hover:text-cyan-300 transition">{s.name}</p>
                          <span className="text-[10px] text-slate-500">{s.type}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 transition" />
                    </button>
                  ))}
                </div>
              </div>

              {isProcessing && (
                <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30 flex items-center space-x-3 text-cyan-300 text-xs animate-pulse">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing document streams, extracting equations, and grounding concepts...</span>
                </div>
              )}

              {errorMessage && (
                <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>
          ) : (
            /* Review & Source Inspection View */
            <div className="space-y-6">
              {/* Document Summary Pill */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      INGESTED
                    </span>
                    <h4 className="text-sm font-bold text-white">{ingestionResult.document.filename}</h4>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center space-x-2">
                    <span>{ingestionResult.document.pageCount} Pages</span>
                    <span>•</span>
                    <span>{ingestionResult.segments.length} Segments Extracted</span>
                    <span>•</span>
                    <span>{ingestionResult.equations.length} Formulas</span>
                    <span>•</span>
                    <span>{ingestionResult.concepts.length} Grounded Concepts</span>
                  </div>
                </div>

                <button
                  onClick={() => setIngestionResult(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
                >
                  Upload Another File
                </button>
              </div>

              {/* Scanned / OCR Warning if present */}
              {ingestionResult.document.processingSummary.scannedPagesNeedingOcr > 0 && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-amber-300 text-xs flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>
                    <strong>Partial Extraction Note:</strong> {ingestionResult.document.processingSummary.scannedPagesNeedingOcr} page(s) were identified as scanned image bitmaps with low text density.
                  </span>
                </div>
              )}

              {/* Concepts & Source References Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Extracted Concepts */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <BookOpen className="w-4 h-4 text-cyan-400" />
                    <span>Source-Grounded Concepts ({ingestionResult.concepts.length})</span>
                  </h4>

                  <div className="space-y-3">
                    {ingestionResult.concepts.map((concept) => {
                      const isSelected = selectedConcept?.tempId === concept.tempId;

                      return (
                        <div
                          key={concept.tempId}
                          onClick={() => setSelectedConcept(concept)}
                          className={`p-4 rounded-xl border transition cursor-pointer space-y-2 ${
                            isSelected
                              ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                              : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h5 className="text-xs font-bold text-white">{concept.title}</h5>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                              Grounded
                            </span>
                          </div>

                          <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                            {concept.explanation}
                          </p>

                          {/* Source Citations Badges */}
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {concept.sourceReferences.map((ref, rIdx) => (
                              <span
                                key={rIdx}
                                className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-cyan-300 font-mono"
                              >
                                <span>Page {ref.pageNumber || 1}: {ref.sectionTitle || 'Section'}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Source Inspection & Citation Viewer */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-white flex items-center space-x-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Original Source Material Traceability</span>
                  </h4>

                  {selectedConcept ? (
                    <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 space-y-4">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                          Target Concept
                        </span>
                        <h4 className="text-sm font-bold text-white mt-0.5">{selectedConcept.title}</h4>
                      </div>

                      {/* Source Reference Excerpts */}
                      <div className="space-y-2.5">
                        <span className="text-xs font-semibold text-slate-300">Originating Source Excerpts:</span>
                        {selectedConcept.sourceReferences.map((ref, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1"
                          >
                            <div className="flex items-center justify-between text-[11px] text-cyan-400 font-mono">
                              <span>{ref.documentFilename} • Page {ref.pageNumber || 1}</span>
                              <span className="text-[10px] text-slate-500">{ref.sectionTitle}</span>
                            </div>
                            <p className="text-xs text-slate-300 italic leading-relaxed">
                              "{ref.excerpt}"
                            </p>
                          </div>
                        ))}
                      </div>

                      {/* Attached Knowledge Check Quiz */}
                      {selectedConcept.knowledgeCheck && (
                        <div className="pt-2 border-t border-slate-800 space-y-2">
                          <span className="text-xs font-semibold text-purple-300 flex items-center space-x-1">
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>Grounded Knowledge Check:</span>
                          </span>
                          <p className="text-xs text-white font-medium">
                            {selectedConcept.knowledgeCheck.question}
                          </p>
                          <p className="text-[11px] text-slate-400">
                            Answer: <strong className="text-emerald-300">{selectedConcept.knowledgeCheck.options[selectedConcept.knowledgeCheck.correctIndex]}</strong>
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-900/30 border border-slate-800 text-center text-xs text-slate-500">
                      Select a concept on the left to inspect its original source excerpts.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {ingestionResult && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/80">
            <span className="text-xs text-slate-400">
              {ingestionResult.concepts.length} grounded concept(s) ready to import into learning workspace.
            </span>

            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onImportCompleted(ingestionResult);
                  onClose();
                }}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Import to Studio & Workspace</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

