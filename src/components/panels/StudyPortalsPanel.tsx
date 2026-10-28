'use client';

import React, { useState } from 'react';
import { 
  Orbit, 
  FlaskConical, 
  BarChart3, 
  Users, 
  Compass, 
  PenTool, 
  Library, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';

interface PortalItem {
  id: string;
  title: string;
  subtitle: string;
  href: string;
  icon: any;
  color: string;
  badge: string;
}

const PORTALS: PortalItem[] = [
  {
    id: 'research',
    title: 'AI Research & Adaptation',
    subtitle: 'Evaluate adaptive AI vs fixed curriculum with normalized gains (g) & Cohen’s d',
    href: '/research',
    icon: Orbit,
    color: 'from-indigo-600 to-cyan-600',
    badge: 'Milestone 19',
  },
  {
    id: 'beta',
    title: 'Beta Study & Pilot',
    subtitle: 'Participate in pre/post test pilot tasks and provide usability ratings',
    href: '/beta',
    icon: FlaskConical,
    color: 'from-emerald-600 to-teal-600',
    badge: 'Pilot Testing',
  },
  {
    id: 'analytics',
    title: 'Learning Analytics',
    subtitle: 'Track verified concept mastery, question accuracy & instructor cohort insights',
    href: '/analytics',
    icon: BarChart3,
    color: 'from-blue-600 to-indigo-600',
    badge: 'Evidence-Based',
  },
  {
    id: 'collab',
    title: 'Collaboration Rooms',
    subtitle: 'Multi-student synchronized canvas rooms with live presence & physics playback',
    href: '/collab',
    icon: Users,
    color: 'from-purple-600 to-pink-600',
    badge: 'Real-Time',
  },
  {
    id: 'paths',
    title: 'Concept Paths & DAG',
    subtitle: 'Prerequisite dependency graphs for Physics, CS, and Electronics',
    href: '/paths',
    icon: Compass,
    color: 'from-amber-600 to-orange-600',
    badge: 'Knowledge Graph',
  },
  {
    id: 'authoring',
    title: 'Visual Authoring Studio',
    subtitle: 'Create subjects, topics, and AI-generated concepts visually',
    href: '/authoring',
    icon: PenTool,
    color: 'from-rose-600 to-red-600',
    badge: 'Content Studio',
  },
  {
    id: 'library',
    title: 'Resource Library',
    subtitle: 'Browse validated packs, 3D anatomical models, and simulation definitions',
    href: '/library',
    icon: Library,
    color: 'from-cyan-600 to-blue-600',
    badge: '4 Subjects',
  },
];

export const StudyPortalsPanel: React.FC = () => {
  return (
    <div className="space-y-3 text-xs text-slate-200">
      <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 space-y-1">
        <div className="flex items-center space-x-1.5 text-cyan-400 font-semibold">
          <Sparkles className="w-4 h-4" />
          <span>VisiOS Learning Portals Dock</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Access all learning systems, pilot experiments, analytics, and authoring tools directly while keeping your whiteboard active.
        </p>
      </div>

      <div className="space-y-2">
        {PORTALS.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.id}
              href={portal.href}
              className="group block p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 hover:bg-slate-800/60 transition-all shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-2.5">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${portal.color} text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center gap-1.5">
                      <span>{portal.title}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono border border-slate-700">
                        {portal.badge}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {portal.subtitle}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded text-slate-500 group-hover:text-cyan-400 transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
};

