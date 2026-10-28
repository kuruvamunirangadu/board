'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Play, Pause, ZoomIn, ZoomOut, Sparkles, Orbit } from 'lucide-react';

interface MoleculePreset {
  id: string;
  name: string;
  formula: string;
  description: string;
  bondAngle: string;
  atoms: { element: string; color: number; radius: number; pos: [number, number, number] }[];
  bonds: [number, number][]; // indices of bonded atoms
}

const MOLECULE_PRESETS: MoleculePreset[] = [
  {
    id: 'h2o',
    name: 'Water Molecule',
    formula: 'H₂O',
    description: 'Bent molecular geometry with polar covalent O-H bonds.',
    bondAngle: '104.5°',
    atoms: [
      { element: 'O', color: 0xef4444, radius: 0.9, pos: [0, 0.2, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.55, pos: [-1.4, -0.9, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.55, pos: [1.4, -0.9, 0] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 'ch4',
    name: 'Methane Molecule',
    formula: 'CH₄',
    description: 'Symmetric tetrahedral geometry with four sp³ hybridized C-H bonds.',
    bondAngle: '109.5°',
    atoms: [
      { element: 'C', color: 0x334155, radius: 0.95, pos: [0, 0, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [0, 1.6, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [1.5, -0.5, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [-0.75, -0.5, 1.3] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [-0.75, -0.5, -1.3] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
      [0, 4],
    ],
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide',
    formula: 'CO₂',
    description: 'Linear molecular geometry with dual non-polar double bonds.',
    bondAngle: '180.0°',
    atoms: [
      { element: 'C', color: 0x334155, radius: 0.9, pos: [0, 0, 0] },
      { element: 'O', color: 0xef4444, radius: 0.8, pos: [-1.8, 0, 0] },
      { element: 'O', color: 0xef4444, radius: 0.8, pos: [1.8, 0, 0] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
    ],
  },
  {
    id: 'nh3',
    name: 'Ammonia',
    formula: 'NH₃',
    description: 'Trigonal pyramidal geometry with a lone electron pair on nitrogen.',
    bondAngle: '107.8°',
    atoms: [
      { element: 'N', color: 0x3b82f6, radius: 0.9, pos: [0, 0.4, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [1.2, -0.6, 0] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [-0.6, -0.6, 1.1] },
      { element: 'H', color: 0x38bdf8, radius: 0.5, pos: [-0.6, -0.6, -1.1] },
    ],
    bonds: [
      [0, 1],
      [0, 2],
      [0, 3],
    ],
  },
];

interface Molecule3DViewerProps {
  initialPreset?: string;
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  isSpinning?: boolean;
  onUpdateTransform?: (props: { rotationX?: number; rotationY?: number; zoom?: number }) => void;
  isImmersive?: boolean;
}

export const Molecule3DViewer: React.FC<Molecule3DViewerProps> = ({
  initialPreset = 'h2o',
  rotationX = 0.2,
  rotationY = -0.3,
  zoom = 1,
  isSpinning = true,
  onUpdateTransform,
  isImmersive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedMolecule, setSelectedMolecule] = useState<string>(initialPreset);
  const [internalZoom, setInternalZoom] = useState(zoom);
  const [spinning, setSpinning] = useState(isSpinning);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const molGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(rotationX);
  const rotYRef = useRef(rotationY);

  const currentPreset = MOLECULE_PRESETS.find((m) => m.id === selectedMolecule) || MOLECULE_PRESETS[0];

  // Build the 3D molecular mesh
  const rebuildMoleculeMesh = (group: THREE.Group, preset: MoleculePreset) => {
    // Clear previous children
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if ((child as any).geometry) (child as any).geometry.dispose();
    }

    // 1. Create Atom Spheres
    const sphereGeo = new THREE.SphereGeometry(1, 32, 32);
    const atomMeshes: THREE.Mesh[] = [];

    preset.atoms.forEach((atom) => {
      const mat = new THREE.MeshStandardMaterial({
        color: atom.color,
        roughness: 0.25,
        metalness: 0.3,
        emissive: atom.color,
        emissiveIntensity: 0.15,
      });

      const mesh = new THREE.Mesh(sphereGeo, mat);
      mesh.scale.set(atom.radius, atom.radius, atom.radius);
      mesh.position.set(...atom.pos);
      group.add(mesh);
      atomMeshes.push(mesh);
    });

    // 2. Create Covalent Bonds (Cylinders connecting atom centers)
    preset.bonds.forEach(([idxA, idxB]) => {
      const posA = new THREE.Vector3(...preset.atoms[idxA].pos);
      const posB = new THREE.Vector3(...preset.atoms[idxB].pos);

      const distance = posA.distanceTo(posB);
      const bondGeo = new THREE.CylinderGeometry(0.12, 0.12, distance, 16);
      const bondMat = new THREE.MeshStandardMaterial({
        color: 0x94a3b8,
        roughness: 0.4,
        metalness: 0.2,
      });

      const bondMesh = new THREE.Mesh(bondGeo, bondMat);

      // Position halfway between atoms
      const midpoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
      bondMesh.position.copy(midpoint);

      // Orient cylinder along the vector AB
      const direction = new THREE.Vector3().subVectors(posB, posA).normalize();
      const up = new THREE.Vector3(0, 1, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
      bondMesh.setRotationFromQuaternion(quaternion);

      group.add(bondMesh);
    });
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Three.js Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 7 / internalZoom);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(5, 8, 6);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x38bdf8, 1.5);
    fillLight.position.set(-6, -4, -4);
    scene.add(fillLight);

    // Group for rotation
    const molGroup = new THREE.Group();
    molGroupRef.current = molGroup;
    molGroup.rotation.x = rotXRef.current;
    molGroup.rotation.y = rotYRef.current;
    scene.add(molGroup);

    rebuildMoleculeMesh(molGroup, currentPreset);

    // Animation Loop
    let lastTime = performance.now();
    const animate = () => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (spinning && !isDraggingRef.current && molGroupRef.current) {
        molGroupRef.current.rotation.y += 0.5 * dt;
        rotYRef.current = molGroupRef.current.rotation.y;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    // Resize handler
    const handleResize = () => {
      if (!container || !camera || !renderer) return;
      const w = container.clientWidth || 340;
      const h = container.clientHeight || 340;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, []);

  // Update molecule preset when selection changes
  useEffect(() => {
    if (molGroupRef.current) {
      rebuildMoleculeMesh(molGroupRef.current, currentPreset);
    }
  }, [selectedMolecule]);

  // Pointer drag controls
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch (err) {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !molGroupRef.current) return;
    e.stopPropagation();

    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotYRef.current += deltaX * 0.015;
    rotXRef.current += deltaY * 0.015;

    molGroupRef.current.rotation.y = rotYRef.current;
    molGroupRef.current.rotation.x = rotXRef.current;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      e.stopPropagation();
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {}
      onUpdateTransform?.({
        rotationX: rotXRef.current,
        rotationY: rotYRef.current,
        zoom: internalZoom,
      });
    }
  };

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.min(internalZoom + 0.25, 2.5);
    setInternalZoom(next);
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 7 / next);
    onUpdateTransform?.({ zoom: next });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(internalZoom - 0.25, 0.5);
    setInternalZoom(next);
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 7 / next);
    onUpdateTransform?.({ zoom: next });
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotXRef.current = 0.2;
    rotYRef.current = -0.3;
    setInternalZoom(1);
    if (molGroupRef.current) {
      molGroupRef.current.rotation.x = 0.2;
      molGroupRef.current.rotation.y = -0.3;
    }
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 7);
    onUpdateTransform?.({ rotationX: 0.2, rotationY: -0.3, zoom: 1 });
  };

  return (
    <div
      className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col transition-all select-none ${
        isImmersive
          ? 'bg-slate-950/85 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/60'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-xl'
      }`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* 3D Molecule Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50 z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Orbit className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>{currentPreset.formula} 3D Molecule</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                Ball & Stick
              </span>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSpinning(!spinning);
            }}
            title={spinning ? 'Pause Orbit' : 'Resume Orbit'}
            className={`p-1 rounded-lg text-xs transition-colors ${
              spinning ? 'bg-cyan-500/20 text-cyan-400 font-semibold' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {spinning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleResetView}
            title="Reset View Orientation"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="flex items-center space-x-1 px-2 py-1 bg-slate-950/30 border-b border-slate-800/60 overflow-x-auto z-10">
        {MOLECULE_PRESETS.map((preset) => (
          <button
            key={preset.id}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedMolecule(preset.id);
            }}
            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all ${
              selectedMolecule === preset.id
                ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {preset.formula}
          </button>
        ))}
      </div>

      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden touch-none"
        title="Click and drag to rotate 3D molecular structure"
      />

      {/* Chemical Geometry Info HUD */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 max-w-[210px] pointer-events-none">
        <div className="text-[9px] font-mono px-2 py-1 rounded-md bg-slate-950/85 text-slate-300 border border-slate-800/80 backdrop-blur-md">
          <div className="font-bold text-cyan-400">{currentPreset.name}</div>
          <div className="text-slate-400">{currentPreset.description}</div>
          <div className="mt-0.5 text-slate-200">
            Bond Angle: <span className="font-bold text-amber-300">{currentPreset.bondAngle}</span>
          </div>
        </div>
      </div>

      {/* Internal Zoom Controls */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 backdrop-blur-md">
        <button onClick={handleZoomOut} title="Zoom Out" className="p-1 text-slate-400 hover:text-white transition-colors">
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-mono text-slate-300 px-1">{Math.round(internalZoom * 100)}%</span>
        <button onClick={handleZoomIn} title="Zoom In" className="p-1 text-slate-400 hover:text-white transition-colors">
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

