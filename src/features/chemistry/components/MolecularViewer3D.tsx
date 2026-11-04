"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  MolecularStyle,
  FunctionalGroupDetection,
} from "../types/molecular";

export interface MolecularViewer3DProps {
  sdf: string;
  initialStyle?: MolecularStyle;
  height?: number | string;
  width?: number | string;
  backgroundColor?: string;
  autoRotate?: boolean;
  highlightedAtoms?: number[];
  functionalGroups?: FunctionalGroupDetection[];
  showGroupPanel?: boolean;
  onSelectGroup?: (group: FunctionalGroupDetection | null) => void;
  className?: string;
}

export const MolecularViewer3D: React.FC<MolecularViewer3DProps> = ({
  sdf,
  initialStyle = "stick",
  height = 420,
  width = "100%",
  backgroundColor = "#0f172a",
  autoRotate = false,
  highlightedAtoms = [],
  functionalGroups = [],
  showGroupPanel = true,
  onSelectGroup,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [style, setStyle] = useState<MolecularStyle>(initialStyle);
  const [isRotating, setIsRotating] = useState<boolean>(autoRotate);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Compute active highlight indices based on selected group or external prop
  const currentHighlights: number[] = React.useMemo(() => {
    if (selectedGroupId) {
      const grp = functionalGroups.find((g) => g.id === selectedGroupId);
      if (grp) {
        const indices = new Set<number>();
        for (const match of grp.matches) {
          for (const idx of match.atom_indices) {
            indices.add(idx);
          }
        }
        return Array.from(indices);
      }
    }
    return highlightedAtoms;
  }, [selectedGroupId, functionalGroups, highlightedAtoms]);

  // Apply visual style to all atoms/bonds and highlight specific functional groups
  const applyStyle = (
    viewer: any,
    targetStyle: MolecularStyle,
    highlights: number[] = []
  ) => {
    if (!viewer) return;

    // Base rendering style
    switch (targetStyle) {
      case "sphere":
        viewer.setStyle({}, { sphere: { scale: 0.35 }, stick: { radius: 0.1 } });
        break;
      case "line":
        viewer.setStyle({}, { line: { linewidth: 2 } });
        break;
      case "cross":
        viewer.setStyle({}, { cross: { linewidth: 2 } });
        break;
      case "stick":
      default:
        viewer.setStyle({}, { stick: { radius: 0.18 } });
        break;
    }

    // Apply prominent highlight to matched functional group atoms
    if (highlights.length > 0) {
      for (const atomIdx of highlights) {
        viewer.setStyle(
          { index: atomIdx },
          {
            stick: { color: "#f59e0b", radius: 0.32 },
            sphere: { color: "#fbbf24", scale: 0.52 },
          }
        );
      }
    }

    viewer.render();
  };

  useEffect(() => {
    let isCancelled = false;

    if (!containerRef.current || !sdf) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    // 3dmol must be imported dynamically on the client side only
    const initViewer = async () => {
      try {
        const $3Dmol = await import("3dmol");

        if (isCancelled || !containerRef.current) return;

        // Clear existing container contents
        containerRef.current.innerHTML = "";

        const config = {
          backgroundColor: backgroundColor,
        };

        const viewer = $3Dmol.createViewer(containerRef.current, config);
        viewerRef.current = viewer;

        viewer.addModel(sdf, "sdf");
        applyStyle(viewer, style, currentHighlights);
        viewer.zoomTo();
        viewer.render();

        if (isRotating) {
          viewer.spin("y", 1);
        }

        setIsLoading(false);
      } catch (err: any) {
        if (!isCancelled) {
          console.error("Failed to initialize 3Dmol viewer:", err);
          setErrorMessage(err?.message ?? "Failed to initialize 3D viewer");
          setIsLoading(false);
        }
      }
    };

    initViewer();

    return () => {
      isCancelled = true;
      if (viewerRef.current) {
        try {
          viewerRef.current.spin(false);
          viewerRef.current.clear();
        } catch {
          // Ignore cleanup errors
        }
        viewerRef.current = null;
      }
    };
  }, [sdf, backgroundColor]);

  // Update highlight when active group changes
  useEffect(() => {
    if (viewerRef.current) {
      applyStyle(viewerRef.current, style, currentHighlights);
    }
  }, [currentHighlights, style]);

  // Handle style change
  const handleStyleChange = (newStyle: MolecularStyle) => {
    setStyle(newStyle);
    if (viewerRef.current) {
      applyStyle(viewerRef.current, newStyle, currentHighlights);
    }
  };

  // Handle rotate toggle
  const handleToggleRotate = () => {
    const nextState = !isRotating;
    setIsRotating(nextState);
    if (viewerRef.current) {
      if (nextState) {
        viewerRef.current.spin("y", 1);
      } else {
        viewerRef.current.spin(false);
      }
    }
  };

  // Reset view / center
  const handleResetCamera = () => {
    if (viewerRef.current) {
      viewerRef.current.zoomTo();
      viewerRef.current.render();
    }
  };

  // Select functional group
  const handleGroupClick = (group: FunctionalGroupDetection) => {
    const isAlreadySelected = selectedGroupId === group.id;
    const nextSelectedId = isAlreadySelected ? null : group.id;
    setSelectedGroupId(nextSelectedId);
    if (onSelectGroup) {
      onSelectGroup(isAlreadySelected ? null : group);
    }
  };

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl ${className}`}
      style={{ width }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-b border-slate-700 text-xs text-slate-200 z-10 flex-wrap gap-2">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300">Style:</span>
          {(["stick", "sphere", "line", "cross"] as MolecularStyle[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => handleStyleChange(s)}
              className={`px-2.5 py-1 rounded transition-colors capitalize ${
                style === s
                  ? "bg-blue-600 text-white font-medium shadow-sm"
                  : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={handleToggleRotate}
            className={`px-2.5 py-1 rounded transition-colors ${
              isRotating
                ? "bg-emerald-600 text-white"
                : "bg-slate-700/60 text-slate-300 hover:bg-slate-700"
            }`}
          >
            {isRotating ? "Pause Spin" : "Auto Spin"}
          </button>
          <button
            type="button"
            onClick={handleResetCamera}
            className="px-2.5 py-1 rounded bg-slate-700/60 text-slate-300 hover:bg-slate-700 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Viewport & Panel Layout */}
      <div className="relative flex flex-col md:flex-row w-full">
        {/* 3D Canvas Container */}
        <div
          ref={containerRef}
          style={{ height, minHeight: 320 }}
          className="flex-1 w-full relative cursor-grab active:cursor-grabbing bg-slate-950"
        />

        {/* Functional Group Recognition Side/Bottom Panel */}
        {showGroupPanel && functionalGroups.length > 0 && (
          <div className="w-full md:w-80 bg-slate-800/95 border-t md:border-t-0 md:border-l border-slate-700 p-4 flex flex-col gap-3 overflow-y-auto max-h-96 md:max-h-[420px]">
            <div className="flex items-center justify-between pb-2 border-b border-slate-700">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                Functional Groups ({functionalGroups.length})
              </span>
              {selectedGroupId && (
                <button
                  type="button"
                  onClick={() => setSelectedGroupId(null)}
                  className="text-[11px] text-slate-400 hover:text-white underline"
                >
                  Clear Highlight
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2.5">
              {functionalGroups.map((group) => {
                const isSelected = selectedGroupId === group.id;
                return (
                  <div
                    key={group.id}
                    onClick={() => handleGroupClick(group)}
                    className={`p-3 rounded-lg border transition-all cursor-pointer text-left ${
                      isSelected
                        ? "bg-amber-500/10 border-amber-500 text-amber-100 shadow-md ring-1 ring-amber-500/50"
                        : "bg-slate-700/40 border-slate-600/70 text-slate-300 hover:bg-slate-700/70 hover:border-slate-500"
                    }`}
                  >
                    <div className="flex items-center justify-between font-semibold text-sm">
                      <span className="text-white">{group.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-amber-300 font-mono">
                        {group.occurrences} {group.occurrences === 1 ? "group" : "groups"}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 line-clamp-2">
                      {group.description}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[11px] text-slate-400">
                      <span>e.g., {group.example}</span>
                      <span className={`font-medium ${isSelected ? "text-amber-400" : "text-blue-400"}`}>
                        {isSelected ? "Highlighted in 3D" : "Click to Highlight"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 backdrop-blur-sm z-20">
          <div className="flex flex-col items-center space-y-2 text-slate-300 text-sm">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Generating 3D Molecular Conformer...</span>
          </div>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/90 text-red-400 text-sm px-4 text-center z-20">
          <p>Error rendering molecule: {errorMessage}</p>
        </div>
      )}
    </div>
  );
};

export default MolecularViewer3D;
