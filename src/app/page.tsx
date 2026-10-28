'use client';

import dynamic from 'next/dynamic';
import React from 'react';

const AppShell = dynamic(
  () => import('@/components/shell/AppShell').then((mod) => mod.AppShell),
  {
    ssr: false,
    loading: () => (
      <div className="w-screen h-screen flex flex-col items-center justify-center bg-[#070b14] text-cyan-400">
        <div className="relative flex items-center justify-center mb-4">
          <div className="w-16 h-16 rounded-2xl border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="absolute font-bold text-xl text-white tracking-widest">V</div>
        </div>
        <div className="text-sm font-semibold tracking-wider text-slate-300">VisiOS</div>
        <div className="text-xs text-slate-500 font-mono mt-1">Initializing Visual Learning Engine...</div>
      </div>
    ),
  }
);

export default function Page() {
  return <AppShell />;
}
