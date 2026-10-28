'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Compass, ZoomIn, ZoomOut, Eye, Sliders } from 'lucide-react';

interface Math3DViewerProps {
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  initialSideA?: number;
  initialSideB?: number;
  initialAngleC?: number; // degrees
  onUpdateTransform?: (props: { rotationX?: number; rotationY?: number; zoom?: number }) => void;
  isImmersive?: boolean;
}

export const Math3DViewer: React.FC<Math3DViewerProps> = ({
  rotationX = 0.5,
  rotationY = -0.6,
  zoom = 1,
  initialSideA = 4.0,
  initialSideB = 3.5,
  initialAngleC = 60,
  onUpdateTransform,
  isImmersive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalZoom, setInternalZoom] = useState(zoom);
  const [sideA, setSideA] = useState(initialSideA);
  const [sideB, setSideB] = useState(initialSideB);
  const [angleC, setAngleC] = useState(initialAngleC); // degrees
  const [showAxes, setShowAxes] = useState(true);

  // Compute Law of Cosines: c² = a² + b² - 2ab cos(C)
  const angleCRad = (angleC * Math.PI) / 180;
  const cSquared = Math.max(0.001, sideA * sideA + sideB * sideB - 2 * sideA * sideB * Math.cos(angleCRad));
  const sideC = Math.sqrt(cSquared);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mathGroupRef = useRef<THREE.Group | null>(null);
  const triangleMeshRef = useRef<THREE.Mesh | null>(null);
  const lineLoopRef = useRef<THREE.LineLoop | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(rotationX);
  const rotYRef = useRef(rotationY);

  // Helper to build/update the 3D triangle geometry
  const updateTriangleGeometry = (a: number, b: number, angleDeg: number) => {
    if (!mathGroupRef.current) return;

    const rad = (angleDeg * Math.PI) / 180;
    // Origin vertex C at (0,0,0)
    // Vertex A along X axis: (b, 0, 0)
    // Vertex B at: (a * cos(C), a * sin(C), 0)
    const pC = new THREE.Vector3(0, 0, 0);
    const pA = new THREE.Vector3(b, 0, 0);
    const pB = new THREE.Vector3(a * Math.cos(rad), a * Math.sin(rad), 0);

    // Center the triangle at origin for smooth rotation
    const center = new THREE.Vector3().addVectors(pC, pA).add(pB).multiplyScalar(1 / 3);
    pC.sub(center);
    pA.sub(center);
    pB.sub(center);

    // Triangle Face Mesh
    if (triangleMeshRef.current) {
      const geo = triangleMeshRef.current.geometry;
      const positions = new Float32Array([
        pC.x, pC.y, pC.z,
        pA.x, pA.y, pA.z,
        pB.x, pB.y, pB.z,
      ]);
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.computeVertexNormals();
    }

    // Triangle Outline
    if (lineLoopRef.current) {
      const lineGeo = lineLoopRef.current.geometry;
      lineGeo.setFromPoints([pC, pA, pB]);
    }
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 340;
    const height = container.clientHeight || 340;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 9 / internalZoom);
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

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(5, 8, 7);
    scene.add(dirLight);

    const backLight = new THREE.DirectionalLight(0x06b6d4, 1.2);
    backLight.position.set(-5, -5, -5);
    scene.add(backLight);

    // Math 3D Group
    const mathGroup = new THREE.Group();
    mathGroupRef.current = mathGroup;
    mathGroup.rotation.x = rotXRef.current;
    mathGroup.rotation.y = rotYRef.current;
    scene.add(mathGroup);

    // 3D Grid Plane
    const grid = new THREE.GridHelper(8, 8, 0x475569, 0x1e293b);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = -0.05;
    mathGroup.add(grid);

    // 3D Cartesian Axes (Red = X, Green = Y, Blue = Z)
    const axes = new THREE.AxesHelper(3.5);
    mathGroup.add(axes);

    // Triangle Mesh
    const triGeo = new THREE.BufferGeometry();
    const triMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4,
      roughness: 0.3,
      metalness: 0.2,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.75,
    });
    const triMesh = new THREE.Mesh(triGeo, triMat);
    triangleMeshRef.current = triMesh;
    mathGroup.add(triMesh);

    // Triangle Outline Wireframe
    const lineGeo = new THREE.BufferGeometry();
    const lineMat = new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 2 });
    const lineLoop = new THREE.LineLoop(lineGeo, lineMat);
    lineLoopRef.current = lineLoop;
    mathGroup.add(lineLoop);

    // Initial shape build
    updateTriangleGeometry(sideA, sideB, angleC);

    // Animation Loop
    const animate = () => {
      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

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

  // Update geometry when triangle dimensions change
  useEffect(() => {
    updateTriangleGeometry(sideA, sideB, angleC);
  }, [sideA, sideB, angleC]);

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
    if (!isDraggingRef.current || !mathGroupRef.current) return;
    e.stopPropagation();

    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    rotYRef.current += deltaX * 0.015;
    rotXRef.current += deltaY * 0.015;

    mathGroupRef.current.rotation.y = rotYRef.current;
    mathGroupRef.current.rotation.x = rotXRef.current;
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
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 9 / next);
    onUpdateTransform?.({ zoom: next });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(internalZoom - 0.25, 0.5);
    setInternalZoom(next);
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 9 / next);
    onUpdateTransform?.({ zoom: next });
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotXRef.current = 0.5;
    rotYRef.current = -0.6;
    setInternalZoom(1);
    if (mathGroupRef.current) {
      mathGroupRef.current.rotation.x = 0.5;
      mathGroupRef.current.rotation.y = -0.6;
    }
    if (cameraRef.current) cameraRef.current.position.set(0, 0, 9);
    onUpdateTransform?.({ rotationX: 0.5, rotationY: -0.6, zoom: 1 });
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
      {/* 3D Math Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/50 z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-cyan-500/20 text-cyan-400">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>3D Vector & Triangle Space</span>
              <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300">
                Euclidean 3D
              </span>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={handleResetView}
            title="Reset 3D Orientation"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden touch-none"
        title="Click and drag to rotate 3D Coordinate Space"
      />

      {/* Interactive Controls & Law of Cosines HUD */}
      <div className="absolute top-11 right-2 z-10 bg-slate-950/85 border border-slate-800/80 rounded-xl p-2 max-w-[170px] backdrop-blur-md flex flex-col space-y-1.5 pointer-events-auto">
        <div className="text-[10px] font-bold text-slate-200">Geometry Controls</div>

        <div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>Side a:</span>
            <span className="text-cyan-300">{sideA.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="0.5"
            value={sideA}
            onChange={(e) => {
              e.stopPropagation();
              setSideA(parseFloat(e.target.value));
            }}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>Side b:</span>
            <span className="text-cyan-300">{sideB.toFixed(1)}</span>
          </div>
          <input
            type="range"
            min="1"
            max="7"
            step="0.5"
            value={sideB}
            onChange={(e) => {
              e.stopPropagation();
              setSideB(parseFloat(e.target.value));
            }}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
          />
        </div>

        <div>
          <div className="flex justify-between text-[9px] text-slate-400 font-mono">
            <span>Angle C:</span>
            <span className="text-amber-300">{angleC}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="150"
            step="5"
            value={angleC}
            onChange={(e) => {
              e.stopPropagation();
              setAngleC(parseInt(e.target.value, 10));
            }}
            className="w-full h-1 bg-slate-800 rounded appearance-none cursor-pointer accent-amber-400"
          />
        </div>
      </div>

      {/* Real-time Law of Cosines Calculation Badge */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-col gap-1 max-w-[210px] pointer-events-none">
        <div className="text-[9px] font-mono px-2 py-1.5 rounded-md bg-slate-950/85 text-slate-300 border border-slate-800/80 backdrop-blur-md">
          <div className="font-bold text-cyan-400">c² = a² + b² - 2ab cos(C)</div>
          <div className="text-slate-300 mt-0.5">
            c = √({(sideA * sideA).toFixed(1)} + {(sideB * sideB).toFixed(1)} - {(2 * sideA * sideB * Math.cos(angleCRad)).toFixed(1)})
          </div>
          <div className="font-bold text-amber-300 mt-0.5">
            Side c = {sideC.toFixed(2)} units
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

