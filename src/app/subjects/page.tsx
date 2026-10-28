'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  BookOpen, 
  Atom, 
  Cpu, 
  Binary, 
  Compass, 
  Search, 
  CheckCircle2, 
  Activity, 
  Layers, 
  ArrowRight,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';
import { contentRegistry } from '@/features/knowledge/registry/content-registry';
import { defaultCapabilityRegistry } from '@/features/knowledge/registry/capability-registry';
import { SubjectDefinition, TopicDefinition } from '@/types/knowledge';

export default function SubjectsPage() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('subj-physics');

  const subjects = contentRegistry.listSubjects({
    category: selectedCategory !== 'all' ? selectedCategory : undefined,
  });

  const searchResults = searchQuery.trim()
    ? contentRegistry.searchContent(searchQuery)
    : [];

  const selectedSubject = contentRegistry.getSubject(selectedSubjectId) || subjects[0];
  const topicsForSubject = selectedSubject
    ? contentRegistry.listTopics(selectedSubject.id)
    : [];

  // Icon mapping
  const getSubjectIcon = (iconName: string) => {
    switch (iconName) {
      case 'Atom': return Atom;
      case 'Compass': return Compass;
      case 'Binary': return Binary;
      case 'Cpu': return Cpu;
      default: return BookOpen;
    }
  };

  const categories = [
    { id: 'all', label: 'All Disciplines' },
    { id: 'natural_sciences', label: 'Natural Sciences' },
    { id: 'formal_sciences', label: 'Formal Sciences' },
    { id: 'engineering', label: 'Engineering' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 p-6 sm:p-10 flex flex-col items-center">
      <div className="w-full max-w-5xl space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Active Canvas</span>
          </Link>

          <div className="flex items-center space-x-2">
            <Link
              href="/paths"
              className="px-3 py-1.5 rounded-xl bg-cyan-600/20 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-semibold transition-all"
            >
              Adaptive Learning Path
            </Link>
            <Link
              href="/library"
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500/40 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              Session Library
            </Link>
          </div>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div className="flex items-center space-x-4">
            <div className="p-3.5 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 shadow-xl shadow-violet-950/30">
              <BookOpen className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-black tracking-tight text-slate-100">
                  Knowledge Engine & Content Registry
                </h1>
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 font-mono font-medium">
                  Milestone 10
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Unified registry of validated concepts, visual representations, simulations, and learning objectives across subjects.
              </p>
            </div>
          </div>

          {/* Search Field */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search concepts across all subjects..."
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
            />
          </div>
        </div>

        {/* Search Results Dropdown / Panel */}
        {searchQuery.trim() && (
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-cyan-500/40 shadow-2xl space-y-2">
            <div className="text-xs font-bold text-cyan-400 flex items-center justify-between">
              <span>Search Results ({searchResults.length})</span>
              <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-white">
                Clear
              </button>
            </div>
            {searchResults.length === 0 ? (
              <p className="text-xs text-slate-400 py-2">No concepts matching "{searchQuery}".</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {searchResults.map((res, i) => (
                  <div
                    key={i}
                    onClick={() => {
                      if (res.type === 'topic' || res.type === 'concept') {
                        router.push(`/paths`);
                      }
                    }}
                    className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-950 cursor-pointer transition-all"
                  >
                    <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
                      <span className="uppercase text-cyan-400 font-bold">{res.type}</span>
                      <span>{res.subjectName || ''}</span>
                    </div>
                    <div className="font-bold text-xs text-slate-200 mt-0.5">{res.title}</div>
                    <div className="text-[11px] text-slate-400 line-clamp-1">{res.description}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filters */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-violet-500/20 border border-violet-500/50 text-violet-300 font-semibold'
                  : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Multi-Subject Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {subjects.map((sub) => {
            const Icon = getSubjectIcon(sub.iconName);
            const isSelected = selectedSubject?.id === sub.id;
            const topicCount = sub.topicIds.length;

            return (
              <div
                key={sub.id}
                onClick={() => setSelectedSubjectId(sub.id)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between shadow-xl ${
                  isSelected
                    ? 'bg-violet-950/40 border-violet-500/60 shadow-violet-950/50'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isSelected
                        ? 'bg-violet-500/20 text-violet-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-slate-100">{sub.displayName}</h3>
                    <p className="text-xs text-slate-400 line-clamp-2 mt-1">{sub.description}</p>
                  </div>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                  <span>{topicCount} Topics</span>
                  <span className={isSelected ? 'text-violet-400 font-bold' : 'text-slate-400'}>
                    {isSelected ? 'Active' : 'Select'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Subject Topics & Validated Registry Detail */}
        {selectedSubject && (
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                  <span>Validated Learning Topics in {selectedSubject.displayName}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Curriculum-aligned concept definitions with prerequisite graphs and capability-aware visual tools.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {topicsForSubject.map((topic) => {
                const concepts = contentRegistry.listConceptsForTopic(topic.id);

                return (
                  <div
                    key={topic.id}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800/90 shadow-xl space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                          {topic.difficultyLevel}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          {concepts.length} Verified Concepts
                        </span>
                      </div>

                      <h3 className="font-bold text-base text-slate-100">{topic.title}</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">{topic.description}</p>

                      {/* Learning Objectives Checklist */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          Learning Objectives
                        </div>
                        <div className="space-y-1">
                          {topic.learningObjectives.map((obj, i) => (
                            <div
                              key={i}
                              className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/80 text-[11px] text-slate-300 flex items-start space-x-1.5"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                              <span>{obj}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                        <Activity className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Interactive Visuals</span>
                      </div>

                      <Link
                        href={`/paths`}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-semibold flex items-center space-x-1.5 shadow-lg shadow-cyan-950/50 transition-all active:scale-95"
                      >
                        <span>Start Learning Path</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
