'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCcw, Heart, ZoomIn, ZoomOut, Activity, Eye } from 'lucide-react';

interface Heart3DViewerProps {
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  isPulsing?: boolean;
  onUpdateTransform?: (props: { rotationX?: number; rotationY?: number; zoom?: number; isPulsing?: boolean }) => void;
  isImmersive?: boolean;
}

export const Heart3DViewer: React.FC<Heart3DViewerProps> = ({
  rotationX = 0.2,
  rotationY = -0.4,
  zoom = 1,
  isPulsing = true,
  onUpdateTransform,
  isImmersive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [internalZoom, setInternalZoom] = useState(zoom);
  const [pulsing, setPulsing] = useState(isPulsing);
  const [activeLabel, setActiveLabel] = useState<string | null>(null);

  // References for Three.js scene
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const heartGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);

  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(rotationX);
  const rotYRef = useRef(rotationY);

  useEffect(() => {
    rotXRef.current = rotationX;
    rotYRef.current = rotationY;
  }, [rotationX, rotationY]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 320;
    const height = container.clientHeight || 320;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 8 / internalZoom);
    cameraRef.current = camera;

    // 3. Renderer with antialiasing and transparency
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainLight.position.set(5, 10, 7);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(isImmersive ? 0x06b6d4 : 0x38bdf8, 1.8);
    rimLight.position.set(-6, -4, -5);
    scene.add(rimLight);

    const fillLight = new THREE.PointLight(0xa855f7, 1.2, 50);
    fillLight.position.set(3, -5, 4);
    scene.add(fillLight);

    // 5. Construct Procedural Anatomical Heart Model
    const heartGroup = new THREE.Group();
    heartGroupRef.current = heartGroup;

    // Materials
    const muscleMaterial = new THREE.MeshStandardMaterial({
      color: 0x991b1b, // Deep cardiac crimson
      roughness: 0.35,
      metalness: 0.15,
    });

    const aortaMaterial = new THREE.MeshStandardMaterial({
      color: 0xef4444, // Bright oxygenated aorta red
      roughness: 0.3,
      metalness: 0.2,
    });

    const veinMaterial = new THREE.MeshStandardMaterial({
      color: 0x2563eb, // Deoxygenated blue
      roughness: 0.35,
      metalness: 0.2,
    });

    const fatTissueMaterial = new THREE.MeshStandardMaterial({
      color: 0xfef08a, // Coronary sulcus adipose tissue
      roughness: 0.8,
    });

    // Left & Right Ventricles (Main conical body)
    const ventricleGeo = new THREE.SphereGeometry(1.6, 32, 32);
    // Deform into realistic heart apex cone
    const posAttr = ventricleGeo.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
      const x = posAttr.getX(i);
      const y = posAttr.getY(i);
      const z = posAttr.getZ(i);
      if (y < 0) {
        // Taper towards apex
        const factor = 1 - Math.abs(y) * 0.45;
        posAttr.setXYZ(i, x * factor + 0.15, y * 1.25, z * factor);
      }
    }
    ventricleGeo.computeVertexNormals();
    const ventricles = new THREE.Mesh(ventricleGeo, muscleMaterial);
    ventricles.position.set(0, -0.4, 0);
    ventricles.rotation.z = -0.15;
    heartGroup.add(ventricles);

    // Left Atrium
    const leftAtriumGeo = new THREE.SphereGeometry(0.85, 24, 24);
    const leftAtrium = new THREE.Mesh(leftAtriumGeo, muscleMaterial);
    leftAtrium.position.set(0.9, 0.9, -0.3);
    heartGroup.add(leftAtrium);

    // Right Atrium
    const rightAtriumGeo = new THREE.SphereGeometry(0.95, 24, 24);
    const rightAtrium = new THREE.Mesh(rightAtriumGeo, muscleMaterial);
    rightAtrium.position.set(-0.9, 0.85, 0.2);
    heartGroup.add(rightAtrium);

    // Aortic Arch (Curved tube)
    const aortaCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.2, 0.4, 0),
      new THREE.Vector3(0.1, 1.6, 0.2),
      new THREE.Vector3(-0.4, 2.1, 0.1),
      new THREE.Vector3(-1.1, 1.8, -0.4),
      new THREE.Vector3(-1.2, 0.5, -0.6),
    ]);
    const aortaGeo = new THREE.TubeGeometry(aortaCurve, 32, 0.42, 16, false);
    const aorta = new THREE.Mesh(aortaGeo, aortaMaterial);
    heartGroup.add(aorta);

    // 3 Aorta Branch Arteries (Brachiocephalic, Carotid, Subclavian)
    for (let b = 0; b < 3; b++) {
      const branchGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.7, 12);
      const branch = new THREE.Mesh(branchGeo, aortaMaterial);
      branch.position.set(-0.15 - b * 0.35, 2.1 + (2 - b) * 0.1, 0.1 - b * 0.1);
      branch.rotation.z = 0.1 - b * 0.15;
      heartGroup.add(branch);
    }

    // Pulmonary Artery & Trunk
    const pulmCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-0.1, 0.5, 0.6),
      new THREE.Vector3(0.3, 1.4, 0.4),
      new THREE.Vector3(1.1, 1.5, -0.2),
    ]);
    const pulmGeo = new THREE.TubeGeometry(pulmCurve, 24, 0.38, 16, false);
    const pulmTrunk = new THREE.Mesh(pulmGeo, veinMaterial);
    heartGroup.add(pulmTrunk);

    // Superior Vena Cava (Blue vein tube entering right atrium)
    const svcGeo = new THREE.CylinderGeometry(0.32, 0.35, 1.4, 16);
    const svc = new THREE.Mesh(svcGeo, veinMaterial);
    svc.position.set(-1.1, 1.7, 0.3);
    heartGroup.add(svc);

    // Coronary Artery Sulcus (Fat tissue groove on ventricles)
    const fatGrooveGeo = new THREE.TorusGeometry(1.5, 0.16, 12, 32);
    const fatGroove = new THREE.Mesh(fatGrooveGeo, fatTissueMaterial);
    fatGroove.position.set(0, 0.1, 0);
    fatGroove.rotation.x = Math.PI / 2.3;
    heartGroup.add(fatGroove);

    scene.add(heartGroup);

    // Apply initial rotations
    heartGroup.rotation.x = rotXRef.current;
    heartGroup.rotation.y = rotYRef.current;

    // 6. Animation Loop (Cardiac Cycle Systole / Diastole)
    let startTime = Date.now();
    const animate = () => {
      animFrameRef.current = requestAnimationFrame(animate);

      if (pulsing && heartGroupRef.current) {
        const elapsed = (Date.now() - startTime) / 1000;
        // Natural double-pulse heartbeat (LUB-DUB at ~72 BPM = 1.2 Hz)
        const cycle = (elapsed * 1.2) % 1;
        let scale = 1.0;
        if (cycle < 0.15) {
          scale = 1.0 + Math.sin(cycle / 0.15 * Math.PI) * 0.08; // Systole primary contraction
        } else if (cycle < 0.35) {
          scale = 1.0 + Math.sin((cycle - 0.15) / 0.2 * Math.PI) * 0.05; // Secondary ventricle contraction
        }
        heartGroupRef.current.scale.set(scale, scale * 1.02, scale);
      }

      renderer.render(scene, camera);
    };

    animate();

    // 7. Handle Resize
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(w, h);
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    // 8. Cleanup on Unmount
    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      ventricleGeo.dispose();
      aortaGeo.dispose();
      pulmGeo.dispose();
      muscleMaterial.dispose();
      aortaMaterial.dispose();
      veinMaterial.dispose();
      fatTissueMaterial.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [internalZoom, isImmersive, pulsing]);

  // Handle Internal 3D Rotation via Drag
  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation(); // Stop event from propagating to tldraw canvas pan
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !heartGroupRef.current) return;
    e.stopPropagation();

    const deltaX = e.clientX - prevMousePosRef.current.x;
    const deltaY = e.clientY - prevMousePosRef.current.y;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };

    // Orbit model
    rotYRef.current += deltaX * 0.015;
    rotXRef.current += deltaY * 0.015;

    heartGroupRef.current.rotation.y = rotYRef.current;
    heartGroupRef.current.rotation.x = rotXRef.current;
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      e.stopPropagation();
      isDraggingRef.current = false;
      try {
        (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      } catch (err) {
        // ignore
      }
      onUpdateTransform?.({
        rotationX: rotXRef.current,
        rotationY: rotYRef.current,
        zoom: internalZoom,
        isPulsing: pulsing,
      });
    }
  };

  // Internal 3D Zoom
  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.min(internalZoom + 0.25, 2.5);
    setInternalZoom(next);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 8 / next);
    }
    onUpdateTransform?.({ zoom: next });
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = Math.max(internalZoom - 0.25, 0.5);
    setInternalZoom(next);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 8 / next);
    }
    onUpdateTransform?.({ zoom: next });
  };

  const handleResetView = (e: React.MouseEvent) => {
    e.stopPropagation();
    rotXRef.current = 0.2;
    rotYRef.current = -0.4;
    setInternalZoom(1);
    if (heartGroupRef.current) {
      heartGroupRef.current.rotation.x = 0.2;
      heartGroupRef.current.rotation.y = -0.4;
    }
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, 8);
    }
    onUpdateTransform?.({ rotationX: 0.2, rotationY: -0.4, zoom: 1 });
  };

  const togglePulse = (e: React.MouseEvent) => {
    e.stopPropagation();
    const next = !pulsing;
    setPulsing(next);
    onUpdateTransform?.({ isPulsing: next });
  };

  return (
    <div 
      className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col transition-all select-none ${
        isImmersive
          ? 'bg-slate-950/85 backdrop-blur-xl border border-cyan-500/40 shadow-2xl shadow-cyan-950/60'
          : 'bg-slate-900/95 backdrop-blur-md border border-slate-700/90 shadow-xl'
      }`}
    >
      {/* 3D Model Header Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-950/40 z-10">
        <div className="flex items-center space-x-2">
          <div className="p-1 rounded-lg bg-red-500/20 text-red-400">
            <Heart className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-100 flex items-center space-x-1.5">
              <span>Human Heart 3D</span>
              <span className={`text-[9px] font-mono px-1 py-0.2 rounded uppercase ${
                isImmersive ? 'bg-cyan-500/20 text-cyan-300' : 'bg-slate-800 text-slate-400'
              }`}>
                Interactive
              </span>
            </div>
          </div>
        </div>

        {/* Quick controls */}
        <div className="flex items-center space-x-1">
          <button
            onClick={togglePulse}
            title={pulsing ? 'Pause Cardiac Pulse' : 'Start Cardiac Pulse'}
            className={`p-1 rounded-lg text-xs transition-colors ${
              pulsing 
                ? 'bg-red-500/20 text-red-400 font-semibold' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleResetView}
            title="Reset Model Orientation"
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3D WebGL Canvas Surface */}
      <div 
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="flex-1 w-full h-full cursor-grab active:cursor-grabbing relative overflow-hidden touch-none"
        title="Click and drag to rotate 3D heart model"
      />

      {/* Floating 3D Model HUD Badges */}
      <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1 max-w-[200px] pointer-events-none">
        {['Aortic Arch', 'Left Ventricle', 'Right Ventricle', 'Pulmonary Trunk'].map((part) => (
          <span 
            key={part}
            className="text-[9px] font-mono px-1.5 py-0.5 rounded-md bg-slate-950/80 text-slate-300 border border-slate-800/80 backdrop-blur-md"
          >
            {part}
          </span>
        ))}
      </div>

      {/* Internal Model Zoom Controls */}
      <div className="absolute bottom-2 right-2 z-10 flex items-center space-x-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800 backdrop-blur-md">
        <button
          onClick={handleZoomOut}
          title="Zoom Out Model"
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <ZoomOut className="w-3 h-3" />
        </button>
        <span className="text-[10px] font-mono text-slate-300 px-1">
          {Math.round(internalZoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          title="Zoom In Model"
          className="p-1 text-slate-400 hover:text-white transition-colors"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

