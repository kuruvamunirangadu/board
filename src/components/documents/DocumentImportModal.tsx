/**
 * VisiOS — Document Import & Multimodal Learning Modal
 * Step 11: Interactive student UI for uploading PDFs, Markdown notes, and study guides.
 * Displays page-grounded extractions, detects scanned documents, and converts content into
 * structured learning sessions and draft authoring modules.
 */

import React, { useState, useRef } from 'react';
import {
  ImportedDocument,
  DocumentLearningConversion,
} from '@/features/documents/DocumentTypes';
import { DocumentIngestionService } from '@/features/documents/DocumentIngestionService';
import { DocumentGroundedLearningService } from '@/features/documents/DocumentGroundedLearningService';
import { DocumentPersistenceService } from '@/features/documents/DocumentPersistenceService';
import {
  FileText,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileCode,
  BookOpen,
  Sparkles,
  HelpCircle,
  X,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  Trash2,
} from 'lucide-react';

interface DocumentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadLessonToWorkspace?: (topic: string) => void;
  onOpenAuthoringStudio?: () => void;
}

export const DocumentImportModal: React.FC<DocumentImportModalProps> = ({
  isOpen,
  onClose,
  onLoadLessonToWorkspace,
  onOpenAuthoringStudio,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'viewer' | 'conversion'>('upload');
  const [currentDocument, setCurrentDocument] = useState<ImportedDocument | null>(null);
  const [activePageNum, setActivePageNum] = useState<number>(1);
  const [conversionResult, setConversionResult] = useState<DocumentLearningConversion | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingStatus, setProcessingStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    setIsProcessing(true);
    setProcessingStatus('Validating file integrity & size...');

    try {
      const buffer = await file.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      setProcessingStatus('Extracting page-grounded text structure...');
      const doc = await DocumentIngestionService.ingestDocument(bytes, file.name);

      await DocumentPersistenceService.saveDocument(doc);
      setCurrentDocument(doc);
      setActivePageNum(1);
      setActiveTab('viewer');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to parse document.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const handleConvertToLesson = async () => {
    if (!currentDocument) return;

    setIsProcessing(true);
    setProcessingStatus('Converting document to structured grounded lesson draft...');
    try {
      const conversion = await DocumentGroundedLearningService.convertToAuthoredLesson(currentDocument);
      setConversionResult(conversion);
      setActiveTab('conversion');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to convert document to lesson.');
    } finally {
      setIsProcessing(false);
      setProcessingStatus('');
    }
  };

  const activePage = currentDocument?.pages.find((p) => p.pageNumber === activePageNum) || currentDocument?.pages[0];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Import Study Material</h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono">
                  Multimodal Learning
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Upload PDFs or lecture notes and convert them into interactive, page-grounded VisiOS lessons.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification banner */}
        {errorMessage && (
          <div className="px-6 py-2.5 bg-rose-950/90 border-b border-rose-500/30 text-rose-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button onClick={() => setErrorMessage(null)} className="p-0.5 text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Navigation Tabs (when document is active) */}
        {currentDocument && (
          <div className="px-6 py-2 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => setActiveTab('viewer')}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'viewer' ? 'bg-cyan-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                1. Extracted Document Viewer
              </button>
              <button
                onClick={() => {
                  if (conversionResult) setActiveTab('conversion');
                  else handleConvertToLesson();
                }}
                className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                  activeTab === 'conversion' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                2. Grounded Learning Experience
              </button>
            </div>
            <button
              onClick={() => {
                setCurrentDocument(null);
                setConversionResult(null);
                setActiveTab('upload');
              }}
              className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
            >
              <span>Upload Another File</span>
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* TAB 1: UPLOAD AREA */}
          {activeTab === 'upload' && !currentDocument && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-3xl p-10 text-center cursor-pointer transition-all bg-slate-950/40 hover:bg-slate-950/80 group space-y-4"
              >
                <div className="w-16 h-16 rounded-2xl bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  {isProcessing ? <Loader2 className="w-8 h-8 animate-spin" /> : <Upload className="w-8 h-8" />}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Select or drop a study document</h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Supports PDF documents (.pdf), Markdown (.md), and plain text (.txt) up to 10 MB.
                  </p>
                </div>
                {isProcessing && (
                  <p className="text-xs font-mono text-cyan-400 animate-pulse">{processingStatus}</p>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {/* Security & Grounding Features Card */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Page-Grounded Context</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Retains exact physical page numbers so every explanation links directly back to your source material.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Never Auto-Published</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Imported documents are converted into safe working drafts for your review before publishing.
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Transparent OCR</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Scanned images are detected transparently without fabricating missing mathematical text.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: EXTRACTED DOCUMENT VIEWER */}
          {activeTab === 'viewer' && currentDocument && (
            <div className="space-y-4">
              {/* Document Overview Header */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{currentDocument.title}</h4>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                      {currentDocument.fileType.toUpperCase()} • {Math.round(currentDocument.fileSize / 1024)} KB
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    File: {currentDocument.fileName} • {currentDocument.totalPages} Page(s) • {currentDocument.sections.length} Section(s)
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConvertToLesson}
                    disabled={isProcessing}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Converting...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        <span>Convert to Grounded Lesson</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Scanned PDF Warning Banner */}
              {currentDocument.isScanned && (
                <div className="p-3 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    <strong>Scanned Document Warning:</strong> Text density is low. OCR capability is currently unavailable; extracted text may be partial.
                  </span>
                </div>
              )}

              {/* Page Selector Tabs */}
              {currentDocument.totalPages > 1 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-slate-500 text-[11px] font-medium shrink-0">Pages:</span>
                  {currentDocument.pages.map((p) => (
                    <button
                      key={p.pageNumber}
                      onClick={() => setActivePageNum(p.pageNumber)}
                      className={`px-2.5 py-1 rounded-lg border font-mono transition-colors shrink-0 ${
                        activePageNum === p.pageNumber
                          ? 'bg-cyan-600 border-cyan-500 text-white font-bold'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      Page {p.pageNumber}
                    </button>
                  ))}
                </div>
              )}

              {/* Active Page Text Container */}
              {activePage && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                    <span className="text-xs font-bold text-cyan-400 font-mono">
                      📄 Page {activePage.pageNumber} of {currentDocument.totalPages} ({activePage.wordCount} words)
                    </span>
                    {activePage.headings.length > 0 && (
                      <span className="text-[11px] text-slate-400 truncate max-w-sm">
                        Section: {activePage.headings.join(' • ')}
                      </span>
                    )}
                  </div>
                  <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed max-h-80 overflow-y-auto">
                    {activePage.rawText || '(No readable text extracted on this page)'}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: GROUNDED LEARNING CONVERSION */}
          {activeTab === 'conversion' && conversionResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                    <span>Grounded Learning Experience Generated</span>
                  </h4>
                  <p className="text-xs text-purple-200 mt-0.5">
                    Derived from "{conversionResult.documentTitle}" • Status: Safe Working Draft
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {onLoadLessonToWorkspace && (
                    <button
                      onClick={() => {
                        onLoadLessonToWorkspace(conversionResult.draftLesson.primaryTopic);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-sm"
                    >
                      Open in Learning Workspace
                    </button>
                  )}
                  {onOpenAuthoringStudio && (
                    <button
                      onClick={() => {
                        onOpenAuthoringStudio();
                        onClose();
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-bold transition-all border border-slate-700"
                    >
                      Edit in Visual Studio
                    </button>
                  )}
                </div>
              </div>

              {/* Concise Grounded Summary */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
                  Page-Grounded Summary
                </span>
                <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed">
                  {conversionResult.summary}
                </p>
              </div>

              {/* Grounded Practice Questions */}
              {conversionResult.groundedPracticeQuestions.length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Grounded Practice Questions ({conversionResult.groundedPracticeQuestions.length})
                  </span>
                  <div className="space-y-3">
                    {conversionResult.groundedPracticeQuestions.map((q, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-900 border border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-white">{q.question}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/30 text-cyan-300 font-mono shrink-0">
                            Source: Page {q.sourcePage}
                          </span>
                        </div>
                        <div className="space-y-1">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`p-1.5 rounded-lg text-xs ${
                                optIdx === q.correctIndex
                                  ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 font-medium'
                                  : 'text-slate-400'
                              }`}
                            >
                              {optIdx === q.correctIndex ? '✓ ' : '• '} {opt}
                            </div>
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-400 italic">
                          Grounding: "{q.groundingSnippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

