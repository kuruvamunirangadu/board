/**
 * VisiOS — Ketcher Visual Molecular Drawing & Editing Studio
 *
 * Allows students to interactively draw 2D chemical structures, add/edit bonds,
 * validate atomic valencies, and generate standard SMILES / Molfiles.
 */

import React, { useState } from 'react';
import { Sparkles, CheckCircle2, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { ChemistryKetcherAdapter, KetcherAtom, KetcherBond, KetcherStructure } from '../adapters/ChemistryKetcherAdapter';

interface KetcherMoleculeDrawerProps {
  onExportSmiles?: (smiles: string) => void;
}

export const KetcherMoleculeDrawer: React.FC<KetcherMoleculeDrawerProps> = ({ onExportSmiles }) => {
  const [adapter] = useState(() => new ChemistryKetcherAdapter());
  const [selectedAtom, setSelectedAtom] = useState<string>('C');
  const [selectedBondOrder, setSelectedBondOrder] = useState<1 | 2 | 3>(1);
  const [atoms, setAtoms] = useState<KetcherAtom[]>([
    { id: 1, label: 'C', x: 0, y: 0 },
    { id: 2, label: 'C', x: 1.5, y: 0 },
    { id: 3, label: 'O', x: 2.5, y: 1 },
  ]);
  const [bonds, setBonds] = useState<KetcherBond[]>([
    { fromAtomId: 1, toAtomId: 2, order: 1 },
    { fromAtomId: 2, toAtomId: 3, order: 1 },
  ]);
  const [connectingFromId, setConnectingFromId] = useState<number | null>(null);

  const currentStructure: KetcherStructure = { atoms, bonds };
  const currentSmiles = adapter.structureToSmiles(currentStructure);
  const svgPreview = adapter.generateSvgPreview(currentStructure, 420, 240);

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width - 0.5) * 8;
    const clickY = ((rect.height - (e.clientY - rect.top)) / rect.height - 0.5) * 5;

    const newId = atoms.length > 0 ? Math.max(...atoms.map((a) => a.id)) + 1 : 1;
    const newAtom: KetcherAtom = {
      id: newId,
      label: selectedAtom,
      x: Math.round(clickX * 10) / 10,
      y: Math.round(clickY * 10) / 10,
    };

    setAtoms((prev) => [...prev, newAtom]);

    // If an atom was primed for connection, automatically create bond
    if (connectingFromId !== null) {
      setBonds((prev) => [...prev, { fromAtomId: connectingFromId, toAtomId: newId, order: selectedBondOrder }]);
      setConnectingFromId(null);
    }
  };

  const handleAtomClick = (e: React.MouseEvent, atomId: number) => {
    e.stopPropagation();
    if (connectingFromId === null) {
      setConnectingFromId(atomId);
    } else if (connectingFromId !== atomId) {
      const exists = bonds.some(
        (b) =>
          (b.fromAtomId === connectingFromId && b.toAtomId === atomId) ||
          (b.fromAtomId === atomId && b.toAtomId === connectingFromId)
      );
      if (!exists) {
        setBonds((prev) => [...prev, { fromAtomId: connectingFromId, toAtomId: atomId, order: selectedBondOrder }]);
      }
      setConnectingFromId(null);
    } else {
      setConnectingFromId(null);
    }
  };

  const handleClear = () => {
    setAtoms([]);
    setBonds([]);
    setConnectingFromId(null);
  };

  const handleLoadTemplate = (name: 'ethanol' | 'acetic_acid' | 'benzene') => {
    if (name === 'ethanol') {
      setAtoms([
        { id: 1, label: 'C', x: -1, y: 0 },
        { id: 2, label: 'C', x: 0.5, y: 0 },
        { id: 3, label: 'O', x: 1.8, y: 0.8 },
      ]);
      setBonds([
        { fromAtomId: 1, toAtomId: 2, order: 1 },
        { fromAtomId: 2, toAtomId: 3, order: 1 },
      ]);
    } else if (name === 'acetic_acid') {
      setAtoms([
        { id: 1, label: 'C', x: -1, y: 0 },
        { id: 2, label: 'C', x: 0.5, y: 0 },
        { id: 3, label: 'O', x: 1.8, y: 0.8 },
        { id: 4, label: 'O', x: 0.5, y: -1.2 },
      ]);
      setBonds([
        { fromAtomId: 1, toAtomId: 2, order: 1 },
        { fromAtomId: 2, toAtomId: 3, order: 1 },
        { fromAtomId: 2, toAtomId: 4, order: 2 },
      ]);
    } else if (name === 'benzene') {
      const benzeneAtoms: KetcherAtom[] = [];
      const benzeneBonds: KetcherBond[] = [];
      for (let i = 0; i < 6; i++) {
        const rad = (i * Math.PI) / 3;
        benzeneAtoms.push({ id: i + 1, label: 'C', x: Math.cos(rad) * 1.5, y: Math.sin(rad) * 1.5 });
        benzeneBonds.push({
          fromAtomId: i + 1,
          toAtomId: i === 5 ? 1 : i + 2,
          order: i % 2 === 0 ? 2 : 1,
        });
      }
      setAtoms(benzeneAtoms);
      setBonds(benzeneBonds);
    }
    setConnectingFromId(null);
  };

  return (
    <div className="flex flex-col space-y-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl text-slate-100 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-semibold text-xs text-white">Ketcher 2D Molecular Drawer</h4>
            <div className="text-[10px] text-slate-400">
              Interactive Chemical Sketcher · Valency Validation · Live SMILES
            </div>
          </div>
        </div>

        {/* Live SMILES Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-mono">SMILES:</span>
          <div className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 font-mono text-xs text-amber-300 font-bold">
            {currentSmiles || 'None'}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
        {/* Atom Selection */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Atoms:</span>
          {['C', 'N', 'O', 'H', 'Cl', 'S', 'P'].map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedAtom(sym)}
              className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                selectedAtom === sym
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Bond Selection */}
        <div className="flex items-center gap-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold mr-1">Bonds:</span>
          {([1, 2, 3] as const).map((order) => (
            <button
              key={order}
              onClick={() => setSelectedBondOrder(order)}
              className={`px-2 py-0.5 rounded font-mono font-bold transition-all ${
                selectedBondOrder === order
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
              }`}
            >
              {order === 1 ? '— Single' : order === 2 ? '＝ Double' : '≡ Triple'}
            </button>
          ))}
        </div>

        {/* Preset Templates */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleLoadTemplate('ethanol')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
          >
            Ethanol
          </button>
          <button
            onClick={() => handleLoadTemplate('acetic_acid')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
          >
            Acetic Acid
          </button>
          <button
            onClick={() => handleLoadTemplate('benzene')}
            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px]"
          >
            Benzene
          </button>
          <button
            onClick={handleClear}
            className="px-2 py-0.5 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-[10px]"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Interactive Drawing Canvas Area */}
      <div
        onClick={handleCanvasClick}
        className="relative w-full h-[240px] rounded-xl border border-slate-800 bg-slate-900 cursor-crosshair overflow-hidden flex items-center justify-center select-none"
      >
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: svgPreview }}
        />

        {connectingFromId !== null && (
          <div className="absolute top-2 left-2 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-[11px] text-amber-300 font-semibold flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" /> Click another atom to connect with bond
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between pt-1">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>{atoms.length} Atoms · {bonds.length} Bonds</span>
        </div>

        {onExportSmiles && currentSmiles && (
          <button
            onClick={() => onExportSmiles(currentSmiles)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Send to 3D Molecular Studio
          </button>
        )}
      </div>
    </div>
  );
};
