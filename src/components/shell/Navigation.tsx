'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Library, BookOpen, Orbit, Compass, PenTool, Users, BarChart3, FlaskConical } from 'lucide-react';
import { WorkspaceMode } from '@/types';

interface NavigationProps {
  mode?: WorkspaceMode;
}

export const Navigation: React.FC<NavigationProps> = ({ mode = 'immersive' }) => {
  const pathname = usePathname();
  const isImmersive = mode === 'immersive';

  const navItems = [
    { href: '/', label: 'Board Canvas', icon: LayoutDashboard },
    { href: '/research', label: 'AI Research', icon: Orbit },
    { href: '/beta', label: 'Beta Study', icon: FlaskConical },
    { href: '/analytics', label: 'Analytics', icon: BarChart3 },
    { href: '/collab', label: 'Collab Rooms', icon: Users },
    { href: '/paths', label: 'Learning Path', icon: Compass },
    { href: '/subjects', label: 'Subjects', icon: BookOpen },
    { href: '/authoring', label: 'Studio', icon: PenTool },
    { href: '/library', label: 'Library', icon: Library },
  ];

  return (
    <nav className="flex items-center space-x-1">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              isActive
                ? isImmersive
                  ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/30'
                  : 'bg-slate-800 text-white'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

