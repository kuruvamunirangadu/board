/**
 * VisiOS — Study Groups Modal
 * Step 12: Interactive UI for students and educators to organize study groups,
 * share published lessons toward a common curriculum goal, and launch lessons into independent sessions.
 */

import React, { useState, useEffect } from 'react';
import { StudyGroupService } from '@/features/collaboration/StudyGroupService';
import { LessonLibraryService } from '@/features/learning/LessonLibraryService';
import { StudyGroup, StudyGroupLessonRef } from '@/features/collaboration/LessonSharingTypes';
import { AuthoredLesson } from '@/features/learning/AuthoringLessonTypes';
import {
  Users,
  Plus,
  BookOpen,
  UserPlus,
  UserMinus,
  Play,
  X,
  ShieldCheck,
  Crown,
  Trash2,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

interface StudyGroupsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  userName?: string;
  onLaunchLesson?: (topic: string) => void;
}

export const StudyGroupsModal: React.FC<StudyGroupsModalProps> = ({
  isOpen,
  onClose,
  userId = 'student_default',
  userName = 'Learner',
  onLaunchLesson,
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [availablePublishedLessons, setAvailablePublishedLessons] = useState<AuthoredLesson[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState<boolean>(false);
  const [newGroupName, setNewGroupName] = useState<string>('');
  const [newGroupDesc, setNewGroupDesc] = useState<string>('');
  const [newMemberId, setNewMemberId] = useState<string>('');
  const [newMemberName, setNewMemberName] = useState<string>('');
  const [selectedLessonId, setSelectedLessonId] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, userId]);

  if (!isOpen) return null;

  const loadData = async () => {
    try {
      const userGroups = await StudyGroupService.listGroupsForUser(userId);
      setGroups(userGroups);
      if (userGroups.length > 0 && !activeGroupId) {
        setActiveGroupId(userGroups[0].id);
      }

      const allLessons = await LessonLibraryService.getAllLessons();
      setAvailablePublishedLessons(allLessons.filter((l) => l.status === 'published' && l.publishedSnapshot));
    } catch (e: any) {
      console.warn('Failed to load study groups data:', e);
    }
  };

  const activeGroup = groups.find((g) => g.id === activeGroupId) || null;
  const isOwner = activeGroup ? activeGroup.ownerId === userId : false;

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const res = await StudyGroupService.createGroup(newGroupName, newGroupDesc, userId, userName);
    if (res.success && res.data) {
      setNewGroupName('');
      setNewGroupDesc('');
      setIsCreatingGroup(false);
      await loadData();
      setActiveGroupId(res.data.id);
      setStatusMessage({ text: `Study group "${res.data.name}" created!`, type: 'success' });
    } else {
      setStatusMessage({ text: res.errorMessage || 'Failed to create group.', type: 'error' });
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGroup || !newMemberId.trim()) return;

    const res = await StudyGroupService.addMember(activeGroup.id, userId, {
      userId: newMemberId.trim(),
      name: newMemberName.trim() || newMemberId.trim(),
    });

    if (res.success && res.data) {
      setNewMemberId('');
      setNewMemberName('');
      await loadData();
      setStatusMessage({ text: 'Member added to study group.', type: 'success' });
    } else {
      setStatusMessage({ text: res.errorMessage || 'Failed to add member.', type: 'error' });
    }
  };

  const handleRemoveMember = async (targetUserId: string) => {
    if (!activeGroup) return;
    const res = await StudyGroupService.removeMember(activeGroup.id, userId, targetUserId);
    if (res.success) {
      await loadData();
      setStatusMessage({ text: 'Member removed from group.', type: 'success' });
    } else {
      setStatusMessage({ text: res.errorMessage || 'Failed to remove member.', type: 'error' });
    }
  };

  const handleAddLesson = async () => {
    if (!activeGroup || !selectedLessonId) return;
    const res = await StudyGroupService.addLessonToGroup(activeGroup.id, userId, selectedLessonId);
    if (res.success) {
      setSelectedLessonId('');
      await loadData();
      setStatusMessage({ text: 'Lesson added to study group collection.', type: 'success' });
    } else {
      setStatusMessage({ text: res.errorMessage || 'Failed to add lesson.', type: 'error' });
    }
  };

  const handleRemoveLesson = async (lessonId: string) => {
    if (!activeGroup) return;
    const res = await StudyGroupService.removeLessonFromGroup(activeGroup.id, userId, lessonId);
    if (res.success) {
      await loadData();
      setStatusMessage({ text: 'Lesson removed from group.', type: 'success' });
    } else {
      setStatusMessage({ text: res.errorMessage || 'Failed to remove lesson.', type: 'error' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-4xl h-[85vh] bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">Study Groups</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 font-mono">
                  Collaborative Learning
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Shared published lessons with strictly independent personal progress
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

        {/* Status notification */}
        {statusMessage && (
          <div
            className={`px-6 py-2 text-xs flex items-center justify-between border-b ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/80 border-rose-500/30 text-rose-300'
            }`}
          >
            <span>{statusMessage.text}</span>
            <button onClick={() => setStatusMessage(null)}>
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Sidebar: Groups List */}
          <div className="w-64 border-r border-slate-800 p-4 flex flex-col justify-between bg-slate-950/40">
            <div className="space-y-3 overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Your Groups ({groups.length})
                </span>
                <button
                  onClick={() => setIsCreatingGroup(!isCreatingGroup)}
                  className="p-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
                  title="Create Study Group"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Group creation inline form */}
              {isCreatingGroup && (
                <form
                  onSubmit={handleCreateGroup}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs"
                >
                  <input
                    type="text"
                    required
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Group Name..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <input
                    type="text"
                    value={newGroupDesc}
                    onChange={(e) => setNewGroupDesc(e.target.value)}
                    placeholder="Goal / Description..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-white text-xs placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <div className="flex justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsCreatingGroup(false)}
                      className="px-2 py-1 rounded-lg text-[10px] text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-bold"
                    >
                      Create
                    </button>
                  </div>
                </form>
              )}

              {/* Groups list */}
              <div className="space-y-1.5">
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setActiveGroupId(g.id)}
                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                      g.id === activeGroupId
                        ? 'bg-indigo-950/60 border-indigo-500/50 text-white shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs line-clamp-1">{g.name}</span>
                      {g.ownerId === userId && (
                        <span title="Group Owner">
                          <Crown className="w-3 h-3 text-amber-400 shrink-0" />
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {g.members.length} member{g.members.length !== 1 ? 's' : ''} · {g.sharedLessons.length} lesson
                      {g.sharedLessons.length !== 1 ? 's' : ''}
                    </span>
                  </button>
                ))}

                {groups.length === 0 && !isCreatingGroup && (
                  <div className="py-8 text-center text-slate-500 text-xs">
                    No study groups yet. Create one to share lessons with peers!
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Independent personal progress guaranteed</span>
            </div>
          </div>

          {/* Right Main Pane: Active Group Details */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {activeGroup ? (
              <>
                {/* Group Info Header */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">{activeGroup.name}</h3>
                      {isOwner && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 font-mono">
                          Owner
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      Created {new Date(activeGroup.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {activeGroup.description && (
                    <p className="text-xs text-slate-400">{activeGroup.description}</p>
                  )}
                </div>

                {/* Group Shared Lessons Collection */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-cyan-400" />
                      <span>Shared Lessons Curriculum ({activeGroup.sharedLessons.length})</span>
                    </h4>

                    {/* Add Lesson action */}
                    {availablePublishedLessons.length > 0 && (
                      <div className="flex items-center gap-1.5">
                        <select
                          value={selectedLessonId}
                          onChange={(e) => setSelectedLessonId(e.target.value)}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none"
                        >
                          <option value="">Select published lesson to add...</option>
                          {availablePublishedLessons.map((l) => (
                            <option key={l.id} value={l.id}>
                              {l.title} ({l.primaryTopic})
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={handleAddLesson}
                          disabled={!selectedLessonId}
                          className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-bold transition-colors"
                        >
                          Add to Group
                        </button>
                      </div>
                    )}
                  </div>

                  {activeGroup.sharedLessons.length === 0 ? (
                    <div className="p-8 text-center rounded-2xl border border-dashed border-slate-800 text-xs text-slate-500">
                      No lessons added to this group yet. Add published modules from your library above!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {activeGroup.sharedLessons.map((ref) => (
                        <div
                          key={ref.lessonId}
                          className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-3"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">
                                {ref.domain}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-mono bg-slate-900 text-slate-400 border border-slate-800">
                                v{ref.publishedVersion}
                              </span>
                            </div>
                            <h5 className="text-xs font-bold text-white line-clamp-1">{ref.title}</h5>
                            <p className="text-[10px] text-slate-500 line-clamp-1 font-mono">
                              Topic: {ref.primaryTopic}
                            </p>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-900">
                            <button
                              onClick={() => {
                                if (onLaunchLesson) {
                                  onLaunchLesson(ref.primaryTopic);
                                  onClose();
                                }
                              }}
                              className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Open Lesson</span>
                            </button>

                            {isOwner && (
                              <button
                                onClick={() => handleRemoveLesson(ref.lessonId)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                                title="Remove lesson from group"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Group Members List */}
                <div className="space-y-3 pt-4 border-t border-slate-800">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-indigo-400" />
                      <span>Group Members ({activeGroup.members.length})</span>
                    </h4>

                    {isOwner && (
                      <form onSubmit={handleAddMember} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          required
                          value={newMemberId}
                          onChange={(e) => setNewMemberId(e.target.value)}
                          placeholder="User ID (e.g. student_kai)..."
                          className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none"
                        />
                        <button
                          type="submit"
                          className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      </form>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {activeGroup.members.map((m) => (
                      <div
                        key={m.userId}
                        className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-indigo-950/80 border border-indigo-500/30 flex items-center justify-center text-indigo-300 text-xs font-bold">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-xs font-bold text-white line-clamp-1">{m.name}</span>
                              {m.role === 'owner' && <Crown className="w-3 h-3 text-amber-400" />}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">{m.userId}</span>
                          </div>
                        </div>

                        {isOwner && m.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(m.userId)}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                            title="Remove member"
                          >
                            <UserMinus className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="py-24 text-center text-slate-500 text-sm">
                Select or create a study group to view lessons and members.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
