'use client';

import React from 'react';
import { PresentationMode, ImmersiveSettings } from '@/types/board';

interface SpatialBackgroundProps {
  mode: PresentationMode;
  settings: ImmersiveSettings;
}

export const SpatialBackground: React.FC<SpatialBackgroundProps> = ({ mode, settings }) => {
  if (mode === 'focus') {
    return (
      <div 
        className="absolute inset-0 pointer-events-none transition-colors duration-500 bg-[#0c1222]" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
          backgroundSize: '24px 24px'
        }}
      />
    );
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden transition-all duration-700 bg-[#070b14]">
      {/* Dynamic Cyber Grid */}
      {settings.showGrid && (
        <div 
          className="absolute inset-0 opacity-40 transition-opacity duration-500"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(6, 182, 212, 0.08) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(6, 182, 212, 0.08) 1px, transparent 1px)
            `,
            backgroundSize: '40px 40px',
          }}
        />
      )}

      {/* Nebula Spatial Ambient Glows */}
      {settings.nebulaEffect && (
        <>
          <div className="absolute -top-[20%] left-[15%] w-[650px] h-[650px] rounded-full bg-cyan-500/10 blur-[120px] animate-pulse-subtle pointer-events-none" />
          <div className="absolute -bottom-[20%] right-[10%] w-[700px] h-[700px] rounded-full bg-purple-600/10 blur-[140px] animate-pulse-subtle pointer-events-none" />
          <div className="absolute top-[40%] right-[30%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[130px] pointer-events-none" />
        </>
      )}

      {/* Cyber Vignette Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 40%, rgba(5, 8, 16, 0.8) 100%)'
        }}
      />
    </div>
  );
};

