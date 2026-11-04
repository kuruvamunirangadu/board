"use client";

import React, { useEffect, useRef, useState } from "react";
import { MolecularStyle } from "../types/molecular";

export interface MolecularViewer3DProps {
  sdf: string;
  initialStyle?: MolecularStyle;
  height?: number | string;
  width?: number | string;
  backgroundColor?: string;
  autoRotate?: boolean;
  className?: string;
}

export const MolecularViewer3D: React.FC<MolecularViewer3DProps> = ({
  sdf,
  initialStyle = "stick",
  height = 400,
  width = "100%",
  backgroundColor = "#0f172a",
  autoRotate = false,
  className = "",
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const viewerRef = useRef<any>(null);
  const [style, setStyle] = useState<MolecularStyle>(initialStyle);
  const [isRotating, setIsRotating] = useState<boolean>(autoRotate);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Apply visual style to all atoms/bonds
  const applyStyle = (viewer: any, targetStyle: MolecularStyle) => {
    if (!viewer) return;

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
        applyStyle(viewer, style);
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

  // Handle style change
  const handleStyleChange = (newStyle: MolecularStyle) => {
    setStyle(newStyle);
    if (viewerRef.current) {
      applyStyle(viewerRef.current, newStyle);
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

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-xl ${className}`}
      style={{ width }}
    >
      {/* Top Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800/90 border-b border-slate-700 text-xs text-slate-200 z-10">
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

      {/* 3D Canvas Container */}
      <div
        ref={containerRef}
        style={{ height, width: "100%", position: "relative" }}
        className="w-full relative cursor-grab active:cursor-grabbing"
      />

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
