/**
 * VisiOS — Share Published Lesson Modal
 * Step 12: Interactive modal for authors to generate controlled share links, download read-only packages,
 * check access metrics, and revoke access without exposing private drafts or personal progress.
 */

import React, { useState, useEffect } from 'react';
import { AuthoredLesson } from '@/features/learning/AuthoringLessonTypes';
import { LessonSharingService } from '@/features/collaboration/LessonSharingService';
import { SharedLessonRecord } from '@/features/collaboration/LessonSharingTypes';
import {
  Share2,
  Copy,
  Check,
  Download,
  AlertTriangle,
  ShieldCheck,
  X,
  Clock,
  Eye,
  RefreshCw,
  Link2,
  Lock,
} from 'lucide-react';

interface ShareLessonModalProps {
  isOpen: boolean;
  onClose: () => void;
  lesson: AuthoredLesson | null;
  ownerId?: string;
}

export const ShareLessonModal: React.FC<ShareLessonModalProps> = ({
  isOpen,
  onClose,
  lesson,
  ownerId = 'author_default',
}) => {
  const [activeShare, setActiveShare] = useState<SharedLessonRecord | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [expiresInDays, setExpiresInDays] = useState<number>(30);

  useEffect(() => {
    if (isOpen && lesson && lesson.status === 'published') {
      loadExistingShare();
    } else {
      setActiveShare(null);
      setStatusMessage(null);
    }
  }, [isOpen, lesson]);

  if (!isOpen || !lesson) return null;

  const isPublished = lesson.status === 'published' && !!lesson.publishedSnapshot;

  const loadExistingShare = async () => {
    setIsProcessing(true);
    try {
      const existingShares = await LessonSharingService.listSharesForLesson(lesson.id, ownerId);
      if (existingShares.length > 0) {
        setActiveShare(existingShares[0]);
      } else {
        // Automatically create initial share link for published lesson
        const res = await LessonSharingService.createShareLink(lesson.id, ownerId, {
          expiresInDays: 30,
        });
        if (res.success && res.data) {
          setActiveShare(res.data);
        }
      }
    } catch (e: any) {
      console.warn('Failed to load or initialize share:', e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyLink = () => {
    if (!activeShare) return;
    const url = `${window.location.origin}/learn?share=${activeShare.shareToken}`;
    navigator.clipboard?.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleToggleRevoke = async () => {
    if (!activeShare) return;
    setIsProcessing(true);
    try {
      if (activeShare.status === 'active') {
        const res = await LessonSharingService.revokeShareLink(activeShare.shareToken, ownerId);
        if (res.success && res.data) {
          setActiveShare(res.data);
          setStatusMessage({ text: 'Share link revoked. Access is now blocked.', type: 'success' });
        } else {
          setStatusMessage({ text: res.errorMessage || 'Failed to revoke link.', type: 'error' });
        }
      } else {
        // Create new active link
        const res = await LessonSharingService.createShareLink(lesson.id, ownerId, { expiresInDays });
        if (res.success && res.data) {
          setActiveShare(res.data);
          setStatusMessage({ text: 'New active share link created.', type: 'success' });
        }
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Operation failed.', type: 'error' });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownloadPackage = async () => {
    try {
      const res = await LessonSharingService.exportLessonPackage(lesson.id, ownerId);
      if (res.success && res.data) {
        const jsonStr = JSON.stringify(res.data, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${lesson.slug || 'lesson'}_v${lesson.publishedVersion || 1}.visios-lesson.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setStatusMessage({ text: 'Lesson package exported successfully.', type: 'success' });
      } else {
        setStatusMessage({ text: res.errorMessage || 'Export failed.', type: 'error' });
      }
    } catch (e: any) {
      setStatusMessage({ text: e.message || 'Export error.', type: 'error' });
    }
  };

  const shareUrl = activeShare
    ? typeof window !== 'undefined'
      ? `${window.location.origin}/learn?share=${activeShare.shareToken}`
      : `/learn?share=${activeShare.shareToken}`
    : '';

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-600/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Share Published Lesson</h3>
              <p className="text-[11px] text-slate-400">
                Generate safe read-only links or export offline packages
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status notice */}
        {statusMessage && (
          <div
            className={`p-2.5 rounded-xl text-xs flex items-center justify-between border ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)} className="p-0.5 rounded">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Not published guard */}
        {!isPublished ? (
          <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-amber-200 text-xs">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Draft Cannot Be Shared</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              This module is currently an unpublished draft. VisiOS enforces strict separation: private
              drafts and in-progress edits cannot be shared until you publish the lesson.
            </p>
            <div className="pt-2">
              <button
                onClick={onClose}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
              >
                Back to Authoring
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Lesson summary card */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                  {lesson.domain}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 text-emerald-300">
                  Published v{lesson.publishedVersion || 1}
                </span>
              </div>
              <h4 className="text-xs font-bold text-white line-clamp-1">{lesson.title}</h4>
              <p className="text-[11px] text-slate-400 line-clamp-2">{lesson.overview}</p>
            </div>

            {/* Share link box */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <div className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Student Access Link</span>
                </div>
                {activeShare && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold capitalize ${
                      activeShare.status === 'active'
                        ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
                        : activeShare.status === 'revoked'
                        ? 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
                        : 'bg-amber-950/60 border border-amber-500/30 text-amber-300'
                    }`}
                  >
                    {activeShare.status}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={shareUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 focus:outline-none"
                />
                <button
                  onClick={handleCopyLink}
                  disabled={!activeShare || activeShare.status !== 'active'}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-500">
                Recipients receive an immutable published snapshot. Each student keeps their own independent
                progress, notes, and practice answers.
              </p>
            </div>

            {/* Access Stats & Revocation Controls */}
            {activeShare && (
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Views: {activeShare.accessCount}</span>
                  </div>
                  {activeShare.expiresAt && (
                    <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>Expires: {new Date(activeShare.expiresAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleToggleRevoke}
                  disabled={isProcessing}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                    activeShare.status === 'active'
                      ? 'bg-rose-950/80 border border-rose-600/40 text-rose-300 hover:bg-rose-900/80'
                      : 'bg-emerald-950/80 border border-emerald-600/40 text-emerald-300 hover:bg-emerald-900/80'
                  }`}
                >
                  {activeShare.status === 'active' ? 'Revoke Access' : 'Create New Link'}
                </button>
              </div>
            )}

            {/* Offline export package */}
            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <div>
                <h5 className="text-xs font-bold text-white">Local / Offline Package</h5>
                <p className="text-[10px] text-slate-400">
                  Export verified standalone <code className="text-cyan-400">.visios-lesson.json</code> file
                </p>
              </div>
              <button
                onClick={handleDownloadPackage}
                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700 transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Export File</span>
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Author notes & personal answers stripped</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

