/**
 * VisiOS — Mol* Macromolecular & Protein Assembly Viewer
 *
 * Provides protein structure visualization, secondary structure ratios (alpha-helices, beta-sheets),
 * chain topology breakdowns, and ligand interaction inspections.
 */

import React, { useState } from 'react';
import { Dna, ShieldCheck, Layers, Eye, Cpu, Database } from 'lucide-react';
import { BiologyMolStarAdapter, MacromoleculeAnalysis } from '../adapters/BiologyMolStarAdapter';

export const MolStarViewer: React.FC = () => {
  const [adapter] = useState(() => new BiologyMolStarAdapter());
  const [selectedSample, setSelectedSample] = useState<'insulin' | 'lysozyme' | 'dna'>('insulin');
  const [representation, setRepresentation] = useState<'cartoon' | 'ball_and_stick' | 'spacefill' | 'surface'>('cartoon');

  const getSampleData = (sample: 'insulin' | 'lysozyme' | 'dna'): MacromoleculeAnalysis => {
    if (sample === 'insulin') {
      return {
        title: 'Bovine Insulin Monomer (PDB: 4INS)',
        totalAtoms: 406,
        totalResidues: 51,
        chains: [
          { chainId: 'A', residueCount: 21, atomCount: 168, helicesCount: 2, sheetsCount: 0, sequencePreview: 'GIVEQCCTSICSLYQLENYCN' },
          { chainId: 'B', residueCount: 30, atomCount: 238, helicesCount: 1, sheetsCount: 1, sequencePreview: 'FVNQHLCGSHLVEALYLVCGE' },
        ],
        ligands: ['ZN', 'HOH'],
        secondaryStructureRatios: { helixPercent: 44, sheetPercent: 12, loopPercent: 44 },
        recommendedRepresentation: 'cartoon',
      };
    } else if (sample === 'lysozyme') {
      return {
        title: 'Hen Egg-White Lysozyme (PDB: 1AKI)',
        totalAtoms: 1001,
        totalResidues: 129,
        chains: [
          { chainId: 'A', residueCount: 129, atomCount: 1001, helicesCount: 5, sheetsCount: 3, sequencePreview: 'KVFGRCELAAAMKRHGLDNYR' },
        ],
        ligands: ['NAG', 'CL'],
        secondaryStructureRatios: { helixPercent: 38, sheetPercent: 18, loopPercent: 44 },
        recommendedRepresentation: 'cartoon',
      };
    } else {
      return {
        title: 'B-DNA Dodecamer Duplex (PDB: 1BNA)',
        totalAtoms: 486,
        totalResidues: 24,
        chains: [
          { chainId: 'A', residueCount: 12, atomCount: 243, helicesCount: 0, sheetsCount: 0, sequencePreview: 'CGCGAATTCGCG' },
          { chainId: 'B', residueCount: 12, atomCount: 243, helicesCount: 0, sheetsCount: 0, sequencePreview: 'CGCGAATTCGCG' },
        ],
        ligands: ['MG', 'HOH'],
        secondaryStructureRatios: { helixPercent: 0, sheetPercent: 0, loopPercent: 100 },
        recommendedRepresentation: 'ball_and_stick',
      };
    }
  };

  const currentAnalysis = getSampleData(selectedSample);

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 shadow-xl">
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Dna className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">Mol* Macromolecular & Protein Studio</h4>
            <div className="text-[10px] text-slate-400">
              Macromolecular Structures · Alpha Helices & Beta Sheets · PDB/mmCIF
            </div>
          </div>
        </div>

        {/* Preset Selector */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs">
          {(['insulin', 'lysozyme', 'dna'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSample(s)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
                selectedSample === s ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Main Structural Visualization Window */}
      <div className="relative w-full h-[260px] rounded-xl border border-slate-800 bg-slate-900 overflow-hidden flex items-center justify-center select-none">
        {/* SVG Ribbon / Cartoon Abstract Visualizer */}
        <svg viewBox="0 0 500 240" className="w-full h-full max-w-[500px]">
          <defs>
            <linearGradient id="helixGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#06b6d4" />
              <stop offset="100%" stop-color="#3b82f6" />
            </linearGradient>
            <linearGradient id="sheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#f59e0b" />
              <stop offset="100%" stop-color="#ea580c" />
            </linearGradient>
          </defs>

          {/* Background Grid Accent */}
          <g opacity="0.1">
            {Array.from({ length: 11 }).map((_, i) => (
              <line key={`gx_${i}`} x1={i * 50} y1={0} x2={i * 50} y2={240} stroke="#94a3b8" />
            ))}
            {Array.from({ length: 6 }).map((_, i) => (
              <line key={`gy_${i}`} x1={0} y1={i * 48} x2={500} y2={i * 48} stroke="#94a3b8" />
            ))}
          </g>

          {/* Render Mode: Cartoon Ribbons */}
          {representation === 'cartoon' && (
            <g className="animate-pulse" style={{ animationDuration: '4s' }}>
              {/* Alpha Helix Spiral */}
              <path
                d="M 60 120 Q 90 70, 120 120 T 180 120 T 240 120 T 300 120 T 360 120"
                fill="none"
                stroke="url(#helixGrad)"
                strokeWidth="12"
                strokeLinecap="round"
              />
              {/* Beta Sheet Flat Arrow */}
              <path
                d="M 120 170 L 320 170 L 340 170 L 325 155 M 340 170 L 325 185"
                fill="none"
                stroke="url(#sheetGrad)"
                strokeWidth="9"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Render Mode: Spacefill / Atoms */}
          {representation === 'spacefill' && (
            <g>
              {Array.from({ length: 28 }).map((_, i) => {
                const cx = 90 + (i % 7) * 45 + Math.sin(i) * 15;
                const cy = 60 + Math.floor(i / 7) * 40 + Math.cos(i) * 10;
                const color = i % 3 === 0 ? '#06b6d4' : i % 3 === 1 ? '#3b82f6' : '#f59e0b';
                return (
                  <circle
                    key={`sph_${i}`}
                    cx={cx}
                    cy={cy}
                    r={18}
                    fill={color}
                    opacity="0.85"
                    stroke="#ffffff"
                    strokeWidth="1"
                  />
                );
              })}
            </g>
          )}

          {/* Render Mode: Ball & Stick */}
          {representation === 'ball_and_stick' && (
            <g>
              {Array.from({ length: 18 }).map((_, i) => {
                const cx1 = 80 + i * 20;
                const cy1 = 120 + Math.sin(i * 0.6) * 40;
                const cx2 = 100 + i * 20;
                const cy2 = 120 + Math.sin((i + 1) * 0.6) * 40;
                return (
                  <g key={`bs_${i}`}>
                    <line x1={cx1} y1={cy1} x2={cx2} y2={cy2} stroke="#64748b" strokeWidth="3" />
                    <circle cx={cx1} cy={cy1} r="6" fill="#38bdf8" />
                  </g>
                );
              })}
            </g>
          )}

          {/* Render Mode: Molecular Surface */}
          {representation === 'surface' && (
            <path
              d="M 100 120 Q 150 40, 250 80 T 380 120 T 300 190 T 160 180 Z"
              fill="rgba(6, 182, 212, 0.25)"
              stroke="#06b6d4"
              strokeWidth="2.5"
            />
          )}

          {/* Title banner */}
          <text x="250" y="30" fill="#f8fafc" fontSize="13" fontWeight="bold" textAnchor="middle">
            {currentAnalysis.title}
          </text>
        </svg>

        {/* Representation Selector Floating Bar */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5 bg-slate-950/80 backdrop-blur px-2.5 py-1 rounded-lg border border-slate-800 text-[10px]">
          {(['cartoon', 'ball_and_stick', 'spacefill', 'surface'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => setRepresentation(mode)}
              className={`px-2 py-0.5 rounded uppercase font-semibold transition-all ${
                representation === mode ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Structural Metrics & Secondary Structure Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1 text-xs">
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Total Atoms / Residues</span>
          <span className="font-mono font-bold text-white text-sm">
            {currentAnalysis.totalAtoms} / {currentAnalysis.totalResidues}
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-cyan-400 block">α-Helix Fraction</span>
          <span className="font-mono font-bold text-cyan-300 text-sm">
            {currentAnalysis.secondaryStructureRatios.helixPercent}%
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-amber-400 block">β-Sheet Fraction</span>
          <span className="font-mono font-bold text-amber-300 text-sm">
            {currentAnalysis.secondaryStructureRatios.sheetPercent}%
          </span>
        </div>

        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-[10px] text-slate-400 block">Chains & Ligands</span>
          <span className="font-mono font-bold text-slate-200 text-sm">
            {currentAnalysis.chains.length} Chains · {currentAnalysis.ligands.join(', ') || 'None'}
          </span>
        </div>
      </div>
    </div>
  );
};
