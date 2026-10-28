'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Library, 
  Plus, 
  Folder, 
  Search, 
  ArrowLeft, 
  MoreVertical, 
  Trash2, 
  Copy, 
  Edit3, 
  Download, 
  Upload, 
  Sparkles, 
  Activity, 
  Bookmark, 
  Layers, 
  Calendar,
  Filter,
  CheckCircle2,
  X
} from 'lucide-react';
import { LearningSession } from '@/types/session';
import { sessionPersistence } from '@/lib/persistence';

export default function LibraryPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<LearningSession[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<LearningSession | null>(null);

  // Form states
  const [newTitle, setNewTitle] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newSubject, setNewSubject] = useState('Physics');
  const [newDesc, setNewDesc] = useState('');
  const [renameValue, setRenameValue] = useState('');

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      let list = await sessionPersistence.listSessions();
      
      // If no sessions exist yet, initialize with realistic study templates
      if (list.length === 0) {
        const seed1 = await sessionPersistence.createSession({
          id: 'session-physics-pendulum',
          title: 'Harmonic Oscillations & Gravity Lab',
          primaryTopic: 'Pendulum Dynamics & Conservation of Energy',
          subject: 'Physics',
          description: 'Nonlinear physical pendulum investigations across planetary gravities (Earth, Moon, Jupiter).',
          createdAt: Date.now() - 3600000 * 24,
          updatedAt: Date.now() - 3600000 * 2,
          lastOpenedAt: Date.now() - 3600000 * 2,
          checkpoints: [
            {
              id: 'cp-seed-1',
              sessionId: 'session-physics-pendulum',
              name: 'Earth Standard Baseline (g=9.81)',
              createdAt: Date.now() - 3600000 * 2,
              simulationType: 'pendulum',
              version: '1.0.0',
              parameters: { gravity: 9.81, length: 2.0, damping: 0.04, initialAngle: 45 },
              metrics: { period: 2.84, frequency: 0.352, totalEnergy: 14.37 },
              definitions: {
                gravity: { label: 'Gravity (g)', unit: 'm/s²' },
                length: { label: 'Length (L)', unit: 'm' },
                period: { label: 'Period (T)', unit: 's' },
              },
              notes: 'Fundamental harmonic baseline',
            },
            {
              id: 'cp-seed-2',
              sessionId: 'session-physics-pendulum',
              name: 'Moon Low-G Experiment (g=1.62)',
              createdAt: Date.now() - 3600000,
              simulationType: 'pendulum',
              version: '1.0.0',
              parameters: { gravity: 1.62, length: 2.0, damping: 0.04, initialAngle: 45 },
              metrics: { period: 6.98, frequency: 0.143, totalEnergy: 2.37 },
              definitions: {
                gravity: { label: 'Gravity (g)', unit: 'm/s²' },
                length: { label: 'Length (L)', unit: 'm' },
                period: { label: 'Period (T)', unit: 's' },
              },
              notes: 'Period lengthened by 146% due to lower gravitational acceleration',
            },
          ],
          activities: [
            {
              id: 'act-seed-1',
              sessionId: 'session-physics-pendulum',
              activityType: 'concept_explained',
              title: 'Explored: Pendulum Dynamics & Restoring Torque',
              timestamp: Date.now() - 3600000 * 2,
            },
            {
              id: 'act-seed-2',
              sessionId: 'session-physics-pendulum',
              activityType: 'simulation_experiment',
              title: 'Saved Experiment: Earth Standard Baseline',
              timestamp: Date.now() - 3600000 * 2,
            },
            {
              id: 'act-seed-3',
              sessionId: 'session-physics-pendulum',
              activityType: 'knowledge_check_attempt',
              title: 'Knowledge Check: Passed',
              timestamp: Date.now() - 3600000,
              metadata: { isCorrect: true },
            },
          ],
        });

        const seed2 = await sessionPersistence.createSession({
          id: 'session-biology-cardio',
          title: 'Human Cardiovascular System & 3D Anatomy',
          primaryTopic: 'Cardiac Cycle & Double Circulation',
          subject: 'Biology & Medicine',
          description: 'Interactive 3D anatomical organ exploration, ventricular systole/diastole, and systemic blood circuits.',
          createdAt: Date.now() - 3600000 * 48,
          updatedAt: Date.now() - 3600000 * 5,
          lastOpenedAt: Date.now() - 3600000 * 5,
          activities: [
            {
              id: 'act-seed-4',
              sessionId: 'session-biology-cardio',
              activityType: 'concept_explained',
              title: 'Explored: 3D Left Ventricle & Aortic Arch',
              timestamp: Date.now() - 3600000 * 5,
            },
          ],
        });

        list = [seed1, seed2];
      }

      setSessions(list);
    } catch (err) {
      console.error('Failed to list sessions', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const created = await sessionPersistence.createSession({
        title: newTitle.trim(),
        primaryTopic: newTopic.trim() || newTitle.trim(),
        subject: newSubject,
        description: newDesc.trim(),
      });
      setIsCreateModalOpen(false);
      setNewTitle('');
      setNewTopic('');
      setNewDesc('');
      await loadSessions();
      router.push(`/?session=${created.id}`);
    } catch (err) {
      console.error('Failed to create session', err);
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession || !renameValue.trim()) return;

    await sessionPersistence.updateSession(selectedSession.id, {
      title: renameValue.trim(),
    });
    setIsRenameModalOpen(false);
    setSelectedSession(null);
    await loadSessions();
  };

  const handleDuplicate = async (session: LearningSession) => {
    const dupTitle = `${session.title} (Copy)`;
    await sessionPersistence.createSession({
      ...session,
      id: undefined,
      title: dupTitle,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      lastOpenedAt: Date.now(),
    });
    await loadSessions();
  };

  const handleDelete = async (sessionId: string, title: string) => {
    if (window.confirm(`Are you sure you want to delete "${title}"? This cannot be undone.`)) {
      await sessionPersistence.deleteSession(sessionId);
      await loadSessions();
    }
  };

  const handleExport = async (session: LearningSession) => {
    try {
      const json = await sessionPersistence.exportSession(session.id);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${session.title.toLowerCase().replace(/\s+/g, '-')}-visios.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
    }
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = await sessionPersistence.importSession(text);
      await loadSessions();
      router.push(`/?session=${imported.id}`);
    } catch (err: any) {
      alert(`Import failed: ${err.message || 'Invalid session file'}`);
    }
  };

  // Filter sessions
  const subjects = ['All', 'Physics', 'Biology & Medicine', 'Mathematics', 'Computer Science', 'General'];
  const filteredSessions = sessions.filter((s) => {
    const matchesQuery =
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.primaryTopic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesSubject = selectedSubject === 'All' || s.subject === selectedSubject;
    return matchesQuery && matchesSubject;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Top Nav Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Active Canvas</span>
          </Link>

          <div className="flex items-center space-x-2.5">
            <label className="cursor-pointer flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all">
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>Import JSON</span>
              <input type="file" accept=".json" onChange={handleImportFile} className="hidden" />
            </label>

            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center space-x-1.5 px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>New Learning Session</span>
            </button>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex items-center space-x-4 border-b border-slate-800 pb-6">
          <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 shadow-xl shadow-cyan-950/30">
            <Library className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-100 flex items-center space-x-2">
              <span>Learning Session Library</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono font-medium">
                Milestone 8
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Persistent workspaces, recorded simulation checkpoints, and continuous knowledge tracking.
            </p>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search topics, subjects, or notes..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>

          <div className="flex items-center space-x-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {subjects.map((sub) => (
              <button
                key={sub}
                onClick={() => setSelectedSubject(sub)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                  selectedSubject === sub
                    ? 'bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 font-semibold'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        {isLoading ? (
          <div className="p-16 text-center text-slate-500 space-y-3">
            <div className="inline-block w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs">Loading persistent learning sessions...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-3">
            <Folder className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-semibold text-slate-300">No matching sessions found</div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? `No sessions match "${searchQuery}".` : 'Create your first learning session to start.'}
            </p>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="mt-2 inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Session</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const checkpointsCount = session.checkpoints?.length || 0;
              const activitiesCount = session.activities?.length || 0;

              return (
                <div
                  key={session.id}
                  className="group rounded-2xl bg-slate-900/70 border border-slate-800/90 hover:border-cyan-500/50 hover:bg-slate-900/95 transition-all p-5 flex flex-col justify-between shadow-xl relative overflow-hidden"
                >
                  <div className="space-y-3">
                    {/* Header line with Subject & Actions */}
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {session.subject || 'General'}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => {
                            setSelectedSession(session);
                            setRenameValue(session.title);
                            setIsRenameModalOpen(true);
                          }}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Rename Session"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDuplicate(session)}
                          className="p-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                          title="Duplicate Session"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleExport(session)}
                          className="p-1 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-slate-800 transition-colors"
                          title="Export JSON"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(session.id, session.title)}
                          className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                          title="Delete Session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Topic */}
                    <div>
                      <h3 className="font-bold text-sm text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-1">
                        {session.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                        {session.description || session.primaryTopic}
                      </p>
                    </div>

                    {/* Metadata telemetry badges */}
                    <div className="flex items-center space-x-3 text-[11px] text-slate-400 pt-1 font-mono">
                      <div className="flex items-center space-x-1" title="Saved Experiment Checkpoints">
                        <Bookmark className="w-3.5 h-3.5 text-blue-400" />
                        <span>{checkpointsCount} Exps</span>
                      </div>
                      <div className="flex items-center space-x-1" title="Recorded Learning Activities">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        <span>{activitiesCount} Acts</span>
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom CTA */}
                  <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(session.updatedAt).toLocaleDateString()}
                    </span>
                    <Link
                      href={`/?session=${session.id}`}
                      className="px-3 py-1.5 rounded-xl bg-cyan-600/30 hover:bg-cyan-600 border border-cyan-500/40 hover:border-transparent text-cyan-200 hover:text-white text-xs font-semibold flex items-center space-x-1 transition-all"
                    >
                      <span>Resume Learning &rarr;</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* CREATE SESSION MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-sm">Create Learning Session</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSession} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Session Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Quantum Mechanics & Wavefunctions"
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Subject</label>
                  <select
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="Physics">Physics</option>
                    <option value="Biology & Medicine">Biology & Medicine</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="General">General</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Topic</label>
                  <input
                    type="text"
                    value={newTopic}
                    onChange={(e) => setNewTopic(e.target.value)}
                    placeholder="e.g., Harmonic Motion"
                    className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description (Optional)</label>
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Goals and topics for this study session..."
                  rows={2}
                  className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all disabled:opacity-50"
                >
                  Create & Launch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME MODAL */}
      {isRenameModalOpen && selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 space-y-4">
            <h3 className="font-bold text-sm">Rename Learning Session</h3>
            <form onSubmit={handleRename} className="space-y-3">
              <input
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-400"
                required
              />
              <div className="flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsRenameModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
