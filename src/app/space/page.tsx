'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, Orbit, Sparkles, Box } from 'lucide-react';

export default function SpacePage() {
  return (
    <div className="min-h-screen bg-[#060911] text-slate-100 p-8 flex flex-col items-center relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] rounded-full bg-violet-600/10 blur-[150px] pointer-events-none" />

      <div className="w-full max-w-4xl space-y-6 relative z-10">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-sm text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Active Canvas</span>
        </Link>

        <div className="flex items-center space-x-3 pt-4 border-b border-slate-800 pb-4">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-violet-500/20 border border-cyan-500/40 text-cyan-300">
            <Orbit className="w-6 h-6 animate-spin" style={{ animationDuration: '12s' }} />
          </div>
          <div>
            <h1 className="text-xl font-bold">3D Spatial Universe</h1>
            <p className="text-xs text-slate-400">Future exploration hub for Three.js 3D models and interactive simulations.</p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-slate-900/60 border border-cyan-500/20 text-center space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 text-cyan-400 mx-auto flex items-center justify-center border border-cyan-500/30">
            <Box className="w-8 h-8 animate-pulse" />
          </div>
          <h2 className="text-lg font-bold text-slate-200">Three.js Spatial Stage (Milestone 2 Extension Point)</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            The foundation has decoupled the canvas engine from presentation and 3D visualization layers so Three.js viewports can be docked into visual cards in upcoming milestones.
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-violet-600 text-white text-xs font-semibold shadow-lg shadow-cyan-950/50"
            >
              <Sparkles className="w-4 h-4" />
              <span>Explore Active 2D Board</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

