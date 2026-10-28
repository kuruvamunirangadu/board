'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import {
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Zap,
  Activity,
  Layers,
  Camera,
  Download,
  Check,
  Brain,
  Info,
} from 'lucide-react';

export type NervousSystemViewMode = 'cns' | 'neuron';

interface Brain3DViewerProps {
  initialViewMode?: NervousSystemViewMode;
  rotationX?: number;
  rotationY?: number;
  zoom?: number;
  isPulsing?: boolean;
  onUpdateTransform?: (props: { rotationX?: number; rotationY?: number; zoom?: number }) => void;
  isImmersive?: boolean;
}

interface AnatomicalPart {
  id: string;
  name: string;
  category: string;
  function: string;
  mechanism: string;
}

const CNS_PARTS: Record<string, AnatomicalPart> = {
  cerebrum: {
    id: 'cerebrum',
    name: 'Cerebrum & Cerebral Cortex',
    category: 'Higher Executive CNS',
    function: 'Integrates complex sensory perception, voluntary motor initiative, language, and executive decision-making.',
    mechanism: 'Folded gyri and sulci maximize cortical gray matter surface area, organizing specialized functional lobes across billions of interneurons.',
  },
  cerebellum: {
    id: 'cerebellum',
    name: 'Cerebellum ("Little Brain")',
    category: 'Motor Coordination',
    function: 'Precision motor coordination, postural balance, proprioception, and automated motor skill memory.',
    mechanism: 'High-density Purkinje cell networks compute feedforward and feedback error corrections comparing intended commands with real-time sensory feedback.',
  },
  brainstem: {
    id: 'brainstem',
    name: 'Brainstem (Pons & Medulla)',
    category: 'Vital Autonomic Center',
    function: 'Controls critical vegetative life-support functions: cardiac rhythm, respiratory drive, blood pressure, and cranial reflexes.',
    mechanism: 'Ascending and descending nerve tracts relay between brain and periphery while reticular activating networks maintain consciousness.',
  },
  spinal_cord: {
    id: 'spinal_cord',
    name: 'Spinal Cord & Peripheral Nerves',
    category: 'Conduction & Reflex Arc',
    function: 'High-velocity two-way neural superhighway transmitting sensory afferent signals upward and motor efferent signals downward.',
    mechanism: 'Segmental dorsal and ventral roots mediate immediate protective reflex arcs independently of cerebral cortex intervention.',
  },
};

const NEURON_PARTS: Record<string, AnatomicalPart> = {
  soma: {
    id: 'soma',
    name: 'Soma (Cell Body & Nucleus)',
    category: 'Metabolic & Biosynthetic Hub',
    function: 'Houses genetic nucleus, Nissl substance, and organelles responsible for synthesizing neurotransmitters and structural proteins.',
    mechanism: 'Summates incoming graded potentials from dendrites electrotonically towards the axon hillock.',
  },
  dendrites: {
    id: 'dendrites',
    name: 'Dendritic Tree & Spines',
    category: 'Receptive Input Zone',
    function: 'Branching tree-like projections receiving thousands of synaptic signals from presynaptic neurons.',
    mechanism: 'Neurotransmitter binding opens ligand-gated ion channels, producing excitatory (EPSP) or inhibitory (IPSP) postsynaptic potentials.',
  },
  axon_hillock: {
    id: 'axon_hillock',
    name: 'Axon Hillock & Axon Trunk',
    category: 'Trigger & Conduction Zone',
    function: 'The anatomical decision center where action potentials are initiated and conducted towards distant targets.',
    mechanism: 'Dense concentration of voltage-gated Na⁺ channels triggers all-or-none depolarization when membrane potential reaches -55 mV threshold.',
  },
  myelin: {
    id: 'myelin',
    name: 'Myelin Sheath & Nodes of Ranvier',
    category: 'Insulative Conduction Enhancer',
    function: 'Lipid-rich sheath formed by Schwann cells / oligodendrocytes that dramatically accelerates nerve conduction velocity up to 120 m/s.',
    mechanism: 'Saltatory conduction: Action potentials jump from one unmyelinated Node of Ranvier to the next via rapid local ionic currents.',
  },
  synapse: {
    id: 'synapse',
    name: 'Axon Terminals & Synaptic Cleft',
    category: 'Chemical Communication',
    function: 'Translates electrical action potentials into chemical neurotransmitter signals to excite or inhibit postsynaptic cells.',
    mechanism: 'Depolarization opens voltage-gated Ca²⁺ channels; Ca²⁺ influx drives vesicle exocytosis across the 20-nanometer synaptic cleft.',
  },
};

export const Brain3DViewer: React.FC<Brain3DViewerProps> = ({
  initialViewMode = 'cns',
  rotationX = 0.2,
  rotationY = -0.5,
  zoom = 1,
  isPulsing = true,
  onUpdateTransform,
  isImmersive = false,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<NervousSystemViewMode>(initialViewMode);
  const [internalZoom, setInternalZoom] = useState(zoom);
  const [isFiringImpulse, setIsFiringImpulse] = useState(isPulsing);
  const [selectedPartId, setSelectedPartId] = useState<string>(
    initialViewMode === 'neuron' ? 'soma' : 'cerebrum'
  );
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Three.js References
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const rootGroupRef = useRef<THREE.Group | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const impulseParticlesRef = useRef<THREE.Points | null>(null);

  // Interaction refs
  const isDraggingRef = useRef(false);
  const prevMousePosRef = useRef({ x: 0, y: 0 });
  const rotXRef = useRef(rotationX);
  const rotYRef = useRef(rotationY);

  useEffect(() => {
    rotXRef.current = rotationX;
    rotYRef.current = rotationY;
  }, [rotationX, rotationY]);

  // Build the 3D Procedural CNS Brain Model
  const buildCNSModel = useCallback((group: THREE.Group) => {
    group.clear();

    // 1. Materials
    const cortexMaterial = new THREE.MeshStandardMaterial({
      color: 0xf472b6, // Neuro cortex soft rose
      roughness: 0.45,
      metalness: 0.1,
    });

    const cortexHighlightMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8, // Active electric cyan
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x0284c7,
      emissiveIntensity: 0.3,
    });

    const cerebellumMaterial = new THREE.MeshStandardMaterial({
      color: 0xec4899,
      roughness: 0.55,
      metalness: 0.15,
    });

    const brainstemMaterial = new THREE.MeshStandardMaterial({
      color: 0xfbbf24, // Warm neural golden
      roughness: 0.35,
      metalness: 0.2,
    });

    const cordMaterial = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.4,
      metalness: 0.1,
    });

    const nerveRootMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.3,
      emissive: 0x0284c7,
      emissiveIntensity: 0.4,
    });

    // 2. Cerebrum - Left Hemisphere with Gyri/Sulci deformations
    const createHemisphere = (isLeft: boolean) => {
      const geo = new THREE.SphereGeometry(1.6, 40, 40);
      const pos = geo.attributes.position;
      const xOffset = isLeft ? -0.85 : 0.85;

      for (let i = 0; i < pos.count; i++) {
        let x = pos.getX(i);
        let y = pos.getY(i);
        let z = pos.getZ(i);

        // Flatten medial longitudinal fissure
        if (isLeft && x > 0) x *= 0.25;
        if (!isLeft && x < 0) x *= 0.25;

        // Procedural cortical convolutions (Gyri & Sulci)
        const gyrusNoise =
          Math.sin(x * 5) * Math.cos(y * 6) * Math.sin(z * 5) * 0.12 +
          Math.sin(y * 10 + z * 8) * 0.05;

        const radiusFactor = 1 + gyrusNoise;
        pos.setXYZ(i, x * radiusFactor * 1.1, y * radiusFactor * 0.95, z * radiusFactor * 1.25);
      }
      geo.computeVertexNormals();

      const mat = selectedPartId === 'cerebrum' ? cortexHighlightMaterial : cortexMaterial;
      const hemi = new THREE.Mesh(geo, mat);
      hemi.position.set(xOffset, 0.7, 0);
      return hemi;
    };

    group.add(createHemisphere(true));
    group.add(createHemisphere(false));

    // 3. Cerebellum (Posterior-Inferior bilateral lobes)
    const cerebellumGeo = new THREE.SphereGeometry(0.9, 32, 32);
    const cPos = cerebellumGeo.attributes.position;
    for (let i = 0; i < cPos.count; i++) {
      const x = cPos.getX(i);
      const y = cPos.getY(i);
      const z = cPos.getZ(i);
      // Fine horizontal folia folds
      const folia = Math.sin(y * 22) * 0.06;
      cPos.setXYZ(i, x * 1.2, (y + folia) * 0.85, z * 0.9);
    }
    cerebellumGeo.computeVertexNormals();
    const cerebellumMesh = new THREE.Mesh(
      cerebellumGeo,
      selectedPartId === 'cerebellum' ? cortexHighlightMaterial : cerebellumMaterial
    );
    cerebellumMesh.position.set(0, -0.4, -1.2);
    group.add(cerebellumMesh);

    // 4. Brainstem (Midbrain, Pons, Medulla)
    const brainstemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.2, -0.2),
      new THREE.Vector3(0, -0.6, -0.4),
      new THREE.Vector3(0, -1.4, -0.5),
      new THREE.Vector3(0, -2.2, -0.5),
    ]);
    const brainstemGeo = new THREE.TubeGeometry(brainstemCurve, 20, 0.45, 16, false);
    const brainstemMesh = new THREE.Mesh(
      brainstemGeo,
      selectedPartId === 'brainstem' ? cortexHighlightMaterial : brainstemMaterial
    );
    group.add(brainstemMesh);

    // 5. Spinal Cord extending downwards
    const cordCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -2.2, -0.5),
      new THREE.Vector3(0, -3.2, -0.5),
      new THREE.Vector3(0, -4.4, -0.45),
      new THREE.Vector3(0, -5.6, -0.4),
    ]);
    const cordGeo = new THREE.TubeGeometry(cordCurve, 24, 0.28, 16, false);
    const cordMesh = new THREE.Mesh(
      cordGeo,
      selectedPartId === 'spinal_cord' ? cortexHighlightMaterial : cordMaterial
    );
    group.add(cordMesh);

    // 6. Bilateral Peripheral Spinal Nerve Pairs branching outward
    const nerveYPoints = [-2.5, -3.0, -3.5, -4.0, -4.5, -5.0];
    nerveYPoints.forEach((yPos, idx) => {
      // Left nerve
      const leftCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(-0.2, yPos, -0.5),
        new THREE.Vector3(-0.8, yPos - 0.1, -0.4),
        new THREE.Vector3(-1.4, yPos - 0.3, -0.2),
        new THREE.Vector3(-2.0, yPos - 0.5, 0)
      );
      const leftNerve = new THREE.Mesh(
        new THREE.TubeGeometry(leftCurve, 12, 0.08, 8, false),
        nerveRootMaterial
      );
      group.add(leftNerve);

      // Right nerve
      const rightCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(0.2, yPos, -0.5),
        new THREE.Vector3(0.8, yPos - 0.1, -0.4),
        new THREE.Vector3(1.4, yPos - 0.3, -0.2),
        new THREE.Vector3(2.0, yPos - 0.5, 0)
      );
      const rightNerve = new THREE.Mesh(
        new THREE.TubeGeometry(rightCurve, 12, 0.08, 8, false),
        nerveRootMaterial
      );
      group.add(rightNerve);
    });

    // 7. Action Potential Impulse Flow (Glowing electrical particles)
    const particleCount = 40;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const t = i / particleCount;
      const pt = cordCurve.getPoint(t);
      particlePositions[i * 3] = pt.x + (Math.random() - 0.5) * 0.1;
      particlePositions[i * 3 + 1] = pt.y;
      particlePositions[i * 3 + 2] = pt.z + (Math.random() - 0.5) * 0.1;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    impulseParticlesRef.current = particles;
    group.add(particles);

    // Center the CNS model vertically
    group.position.set(0, 1.6, 0);
  }, [selectedPartId]);

  // Build the 3D Multipolar Neuron & Synaptic Junction Model
  const buildNeuronModel = useCallback((group: THREE.Group) => {
    group.clear();

    const somaMat = new THREE.MeshStandardMaterial({
      color: selectedPartId === 'soma' ? 0x38bdf8 : 0xec4899,
      roughness: 0.35,
      metalness: 0.2,
      emissive: selectedPartId === 'soma' ? 0x0284c7 : 0x831843,
      emissiveIntensity: selectedPartId === 'soma' ? 0.4 : 0.1,
    });

    const dendriteMat = new THREE.MeshStandardMaterial({
      color: selectedPartId === 'dendrites' ? 0x38bdf8 : 0xf472b6,
      roughness: 0.4,
      metalness: 0.15,
    });

    const axonMat = new THREE.MeshStandardMaterial({
      color: selectedPartId === 'axon_hillock' ? 0x38bdf8 : 0xfbbf24,
      roughness: 0.3,
      metalness: 0.2,
    });

    const myelinMat = new THREE.MeshStandardMaterial({
      color: selectedPartId === 'myelin' ? 0x38bdf8 : 0x38bdf8,
      roughness: 0.25,
      metalness: 0.3,
      transparent: true,
      opacity: 0.85,
    });

    const synapseMat = new THREE.MeshStandardMaterial({
      color: selectedPartId === 'synapse' ? 0x38bdf8 : 0xa855f7,
      roughness: 0.3,
      metalness: 0.2,
      emissive: 0x7e22ce,
      emissiveIntensity: 0.3,
    });

    // 1. Soma (Cell Body) - Multipolar Star Form
    const somaGeo = new THREE.IcosahedronGeometry(1.2, 3);
    const sPos = somaGeo.attributes.position;
    for (let i = 0; i < sPos.count; i++) {
      let x = sPos.getX(i);
      let y = sPos.getY(i);
      let z = sPos.getZ(i);
      const warp = 1 + (Math.sin(x * 6) + Math.cos(y * 6)) * 0.15;
      sPos.setXYZ(i, x * warp, y * warp, z * warp);
    }
    somaGeo.computeVertexNormals();
    const soma = new THREE.Mesh(somaGeo, somaMat);
    soma.position.set(-2.8, 0, 0);
    group.add(soma);

    // Nucleus inside soma
    const nucleus = new THREE.Mesh(
      new THREE.SphereGeometry(0.5, 16, 16),
      new THREE.MeshStandardMaterial({ color: 0x831843, roughness: 0.2 })
    );
    nucleus.position.set(-2.8, 0, 0);
    group.add(nucleus);

    // 2. Dendrites extending outward from soma
    const dendriteDirections = [
      [-1.2, 1.4, 0.4],
      [-1.5, 0.8, -0.6],
      [-1.4, -1.0, 0.3],
      [-0.8, -1.4, -0.5],
      [-1.6, -0.2, 0.8],
      [-0.9, 1.3, -0.7],
    ];

    dendriteDirections.forEach(([dx, dy, dz]) => {
      const start = new THREE.Vector3(-2.8, 0, 0);
      const mid = new THREE.Vector3(-2.8 + dx * 0.6, dy * 0.6, dz * 0.6);
      const end = new THREE.Vector3(-2.8 + dx, dy, dz);
      const curve = new THREE.CatmullRomCurve3([start, mid, end]);
      const branchGeo = new THREE.TubeGeometry(curve, 12, 0.12, 8, false);
      const branch = new THREE.Mesh(branchGeo, dendriteMat);
      group.add(branch);

      // Terminal dendritic spines
      const spineGeo = new THREE.SphereGeometry(0.12, 8, 8);
      const spine = new THREE.Mesh(spineGeo, dendriteMat);
      spine.position.copy(end);
      group.add(spine);
    });

    // 3. Axon Hillock (Tapering from soma to axon)
    const hillockCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.0, 0, 0),
      new THREE.Vector3(-1.4, 0, 0),
    ]);
    const hillock = new THREE.Mesh(
      new THREE.TubeGeometry(hillockCurve, 8, 0.25, 12, false),
      axonMat
    );
    group.add(hillock);

    // 4. Long Axon Trunk
    const axonCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-1.4, 0, 0),
      new THREE.Vector3(2.6, 0, 0),
    ]);
    const axonMesh = new THREE.Mesh(
      new THREE.TubeGeometry(axonCurve, 24, 0.12, 12, false),
      axonMat
    );
    group.add(axonMesh);

    // 5. Myelin Sheaths with Nodes of Ranvier Gaps (Saltatory Conduction)
    const sheathCenters = [-0.8, 0.2, 1.2, 2.2];
    const sheathLength = 0.75;
    sheathCenters.forEach((cx) => {
      const sheathGeo = new THREE.CylinderGeometry(0.28, 0.28, sheathLength, 16);
      sheathGeo.rotateZ(Math.PI / 2);
      const sheath = new THREE.Mesh(sheathGeo, myelinMat);
      sheath.position.set(cx, 0, 0);
      group.add(sheath);
    });

    // 6. Terminal Branches & Synaptic Boutons
    const terminalOffsets = [
      [3.4, 0.8, 0.4],
      [3.6, 0.2, -0.3],
      [3.5, -0.7, 0.2],
    ];
    terminalOffsets.forEach(([tx, ty, tz]) => {
      const tCurve = new THREE.CubicBezierCurve3(
        new THREE.Vector3(2.6, 0, 0),
        new THREE.Vector3(3.0, ty * 0.4, tz * 0.4),
        new THREE.Vector3(tx - 0.2, ty, tz),
        new THREE.Vector3(tx, ty, tz)
      );
      const tBranch = new THREE.Mesh(
        new THREE.TubeGeometry(tCurve, 10, 0.08, 8, false),
        axonMat
      );
      group.add(tBranch);

      // Bulbous synaptic terminal knob
      const knob = new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 12), synapseMat);
      knob.position.set(tx, ty, tz);
      group.add(knob);
    });

    // 7. Action Potential Impulse Traveling along the Axon
    const pCount = 30;
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      const t = i / pCount;
      pPos[i * 3] = -1.4 + t * 4.0;
      pPos[i * 3 + 1] = (Math.random() - 0.5) * 0.08;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
    }
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({
      color: 0x38bdf8,
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(pGeo, pMat);
    impulseParticlesRef.current = particles;
    group.add(particles);

    group.position.set(0, 0, 0);
  }, [selectedPartId]);

  // Main Three.js Scene Lifecycle
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    const width = container.clientWidth || 380;
    const height = container.clientHeight || 380;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.set(0, 0, 11 / internalZoom);
    cameraRef.current = camera;

    // 3. Renderer with transparency and preserveDrawingBuffer for image generation
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Studio Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 2.2);
    mainLight.position.set(6, 8, 8);
    scene.add(mainLight);

    const rimLight = new THREE.DirectionalLight(isImmersive ? 0x06b6d4 : 0x38bdf8, 2.0);
    rimLight.position.set(-6, -4, -6);
    scene.add(rimLight);

    const accentLight = new THREE.PointLight(0xa855f7, 1.5, 40);
    accentLight.position.set(2, -6, 4);
    scene.add(accentLight);

    // 5. Root Group
    const rootGroup = new THREE.Group();
    rootGroupRef.current = rootGroup;
    rootGroup.rotation.x = rotXRef.current;
    rootGroup.rotation.y = rotYRef.current;
    scene.add(rootGroup);

    // Populate active model
    if (viewMode === 'cns') {
      buildCNSModel(rootGroup);
    } else {
      buildNeuronModel(rootGroup);
    }

    // 6. Animation Loop with Action Potential Conduction
    let clock = new THREE.Clock();
    const animate = () => {
      const elapsed = clock.getElapsedTime();

      // Gentle breathing idle rotation when not dragging
      if (!isDraggingRef.current && rootGroupRef.current) {
        rootGroupRef.current.rotation.y += 0.003;
      }

      // Animate action potential particles
      if (impulseParticlesRef.current && isFiringImpulse) {
        const positions = impulseParticlesRef.current.geometry.attributes.position;
        const count = positions.count;
        const speed = viewMode === 'cns' ? 2.5 : 3.5;

        for (let i = 0; i < count; i++) {
          if (viewMode === 'cns') {
            // Travel down the spinal cord
            let y = positions.getY(i);
            y -= 0.04 * speed;
            if (y < -5.6) y = 0.2;
            positions.setY(i, y);
          } else {
            // Travel across the axon
            let x = positions.getX(i);
            x += 0.05 * speed;
            if (x > 3.4) x = -1.4;
            positions.setX(i, x);
          }
        }
        positions.needsUpdate = true;
      }

      renderer.render(scene, camera);
      animFrameRef.current = requestAnimationFrame(animate);
    };
    animFrameRef.current = requestAnimationFrame(animate);

    // Resize Observer
    const resizeObserver = new ResizeObserver((entries) => {
      if (!entries[0]) return;
      const { width: newW, height: newH } = entries[0].contentRect;
      if (newW > 0 && newH > 0 && cameraRef.current && rendererRef.current) {
        cameraRef.current.aspect = newW / newH;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(newW, newH);
      }
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      renderer.dispose();
      container.innerHTML = '';
    };
  }, [viewMode, internalZoom, isFiringImpulse, isImmersive, buildCNSModel, buildNeuronModel]);

  // Pointer Drag Interaction
  const handlePointerDown = (e: React.PointerEvent) => {
    isDraggingRef.current = true;
    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !rootGroupRef.current) return;
    const dx = e.clientX - prevMousePosRef.current.x;
    const dy = e.clientY - prevMousePosRef.current.y;

    rotYRef.current += dx * 0.008;
    rotXRef.current += dy * 0.008;

    rootGroupRef.current.rotation.y = rotYRef.current;
    rootGroupRef.current.rotation.x = rotXRef.current;

    prevMousePosRef.current = { x: e.clientX, y: e.clientY };
    onUpdateTransform?.({ rotationX: rotXRef.current, rotationY: rotYRef.current });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  // Zoom Controls
  const handleZoom = (delta: number) => {
    setInternalZoom((prev) => {
      const next = Math.max(0.6, Math.min(2.2, prev + delta));
      if (cameraRef.current) {
        cameraRef.current.position.set(0, 0, (viewMode === 'cns' ? 11 : 9) / next);
      }
      onUpdateTransform?.({ zoom: next });
      return next;
    });
  };

  const handleReset = () => {
    rotXRef.current = 0.2;
    rotYRef.current = -0.5;
    if (rootGroupRef.current) {
      rootGroupRef.current.rotation.x = 0.2;
      rootGroupRef.current.rotation.y = -0.5;
    }
    setInternalZoom(1);
    if (cameraRef.current) {
      cameraRef.current.position.set(0, 0, viewMode === 'cns' ? 11 : 9);
    }
    onUpdateTransform?.({ rotationX: 0.2, rotationY: -0.5, zoom: 1 });
  };

  // High-Resolution Learning Diagram Snapshot Generator
  const handleGenerateImage = () => {
    if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return;
    setIsCapturing(true);

    try {
      // 1. Force clean high-res render frame
      rendererRef.current.render(sceneRef.current, cameraRef.current);
      const dataUrl = rendererRef.current.domElement.toDataURL('image/png');

      // 2. Composite with educational branding and anatomical title
      const canvas = document.createElement('canvas');
      canvas.width = 1200;
      canvas.height = 900;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Deep modern educational gradient backdrop
        const grad = ctx.createLinearGradient(0, 0, 0, 900);
        grad.addColorStop(0, '#090d16');
        grad.addColorStop(1, '#020617');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, 1200, 900);

        // Header Title
        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 32px sans-serif';
        ctx.fillText(
          viewMode === 'cns'
            ? 'VisiOS Biology — Central Nervous System (CNS)'
            : 'VisiOS Biology — Multipolar Neuron & Synaptic Transmission',
          50,
          65
        );

        ctx.fillStyle = '#94a3b8';
        ctx.font = '16px monospace';
        ctx.fillText(
          viewMode === 'cns'
            ? 'Cerebrum • Cerebellum • Brainstem • Spinal Cord • Peripheral Spinal Nerves'
            : 'Soma • Dendrites • Axon Hillock • Myelin Sheaths • Nodes of Ranvier • Synaptic Bouton',
          50,
          100
        );

        // Draw 3D Model image
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 150, 120, 900, 680);

          // Footer Badge & Takeaway
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(50, 810, 1100, 60);

          ctx.fillStyle = '#38bdf8';
          ctx.font = 'bold 15px sans-serif';
          ctx.fillText('⚡ Key Physiological Principle:', 70, 845);

          ctx.fillStyle = '#e2e8f0';
          ctx.font = '14px sans-serif';
          const principle =
            viewMode === 'cns'
              ? 'Hierarchical neural integration: Cortex initiates voluntary action, brainstem manages vitals, and spinal nerves relay efferent/afferent motor-sensory traffic.'
              : 'Saltatory action potential conduction: Voltage-gated Na⁺/K⁺ depolarization rapidly hops between Nodes of Ranvier to trigger neurotransmitter exocytosis at the terminal.';
          ctx.fillText(principle, 320, 845);

          const finalComposite = canvas.toDataURL('image/png');
          setCapturedImage(finalComposite);
          setIsCapturing(false);
        };
        img.src = dataUrl;
      }
    } catch (e) {
      console.error('Failed to generate diagram image:', e);
      setIsCapturing(false);
    }
  };

  const handleDownloadImage = () => {
    if (!capturedImage) return;
    const a = document.createElement('a');
    a.href = capturedImage;
    a.download = `VisiOS_${viewMode === 'cns' ? 'Nervous_System_CNS' : 'Neuron_Synapse'}_Diagram.png`;
    a.click();
  };

  const activePartsDict = viewMode === 'cns' ? CNS_PARTS : NEURON_PARTS;
  const currentPart = activePartsDict[selectedPartId] || Object.values(activePartsDict)[0];

  return (
    <div
      className="relative w-full h-full flex flex-col bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 select-none shadow-2xl"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Top Header & Viewport Controls Toolbar */}
      <div className="absolute top-2 left-2 right-2 z-20 flex items-center justify-between pointer-events-auto gap-2">
        {/* Left: View Mode Switcher (CNS vs Neuron) */}
        <div className="flex items-center space-x-1 bg-slate-950/85 p-1 rounded-xl border border-slate-800 backdrop-blur-md shadow-md">
          <button
            onClick={() => {
              setViewMode('cns');
              setSelectedPartId('cerebrum');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'cns'
                ? 'bg-cyan-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Brain & CNS</span>
          </button>

          <button
            onClick={() => {
              setViewMode('neuron');
              setSelectedPartId('soma');
            }}
            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1.5 transition-all ${
              viewMode === 'neuron'
                ? 'bg-pink-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Neuron & Synapse</span>
          </button>
        </div>

        {/* Right: Action Potential Trigger & Image Capture */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => setIsFiringImpulse((prev) => !prev)}
            title="Toggle Action Potential Wave"
            className={`px-2 py-1 rounded-lg text-[10px] font-bold flex items-center space-x-1 border backdrop-blur-md shadow-md transition-all ${
              isFiringImpulse
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-amber-950/40'
                : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            <Zap className={`w-3 h-3 ${isFiringImpulse ? 'text-amber-400 animate-pulse' : ''}`} />
            <span>{isFiringImpulse ? 'Signal: Active' : 'Signal: Paused'}</span>
          </button>

          <button
            onClick={handleGenerateImage}
            disabled={isCapturing}
            title="Generate & Export Educational Learning Diagram"
            className="px-2.5 py-1 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold rounded-lg text-[10px] flex items-center space-x-1 shadow-md transition-all active:scale-95"
          >
            <Camera className="w-3 h-3" />
            <span>{isCapturing ? 'Capturing...' : 'Generate Image'}</span>
          </button>
        </div>
      </div>

      {/* Main Three.js WebGL Mount Canvas */}
      <div
        ref={mountRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className="w-full h-full cursor-grab active:cursor-grabbing flex-1"
      />

      {/* Anatomical Parts Selection Buttons (Floating Horizontal Bar) */}
      <div className="absolute top-12 left-2 right-2 z-10 flex items-center space-x-1 overflow-x-auto py-1 scrollbar-none pointer-events-auto">
        {Object.values(activePartsDict).map((part) => (
          <button
            key={part.id}
            onClick={() => setSelectedPartId(part.id)}
            className={`px-2 py-0.5 rounded-full text-[9px] font-mono shrink-0 transition-all border ${
              selectedPartId === part.id
                ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 font-bold shadow-sm'
                : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {part.name.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Camera Tools Bottom Left */}
      <div className="absolute bottom-2 left-2 z-20 flex items-center space-x-1 bg-slate-950/85 p-1 rounded-xl border border-slate-800 backdrop-blur-md shadow-md pointer-events-auto">
        <button
          onClick={() => handleZoom(0.15)}
          title="Zoom In"
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => handleZoom(-0.15)}
          title="Zoom Out"
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleReset}
          title="Reset 3D Orientation"
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Selected Anatomical Part Pedagogical HUD (Bottom Overlay) */}
      {currentPart && (
        <div className="absolute bottom-2 right-2 max-w-[280px] sm:max-w-xs z-20 bg-slate-900/90 border border-cyan-500/30 p-2.5 rounded-xl backdrop-blur-md shadow-xl text-xs space-y-1 pointer-events-auto animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-100 text-[11px] truncate">{currentPart.name}</span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30 font-mono">
              {currentPart.category}
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-tight">{currentPart.function}</p>
          <div className="text-[9px] text-cyan-400/90 pt-0.5 border-t border-slate-800/80 flex items-start space-x-1">
            <Info className="w-2.5 h-2.5 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-tight">{currentPart.mechanism}</span>
          </div>
        </div>
      )}

      {/* Generated Learning Image Preview Modal */}
      {capturedImage && (
        <div className="absolute inset-0 z-50 bg-slate-950/95 p-4 flex flex-col items-center justify-center space-y-3 pointer-events-auto backdrop-blur-md animate-fadeIn">
          <div className="flex items-center justify-between w-full max-w-lg">
            <div className="flex items-center space-x-2">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-sm text-slate-100">
                Generated Learning Diagram (Three.js 3D Snapshot)
              </span>
            </div>
            <button
              onClick={() => setCapturedImage(null)}
              className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 hover:text-white"
            >
              ✕ Close
            </button>
          </div>

          <div className="relative border border-cyan-500/40 rounded-xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[260px] bg-slate-900 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={capturedImage}
              alt="Generated 3D Nervous System Diagram"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadImage}
              className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PNG Image</span>
            </button>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(
                  `Diagram: VisiOS 3D ${viewMode === 'cns' ? 'Central Nervous System' : 'Multipolar Neuron'}`
                );
                setCopiedNotification(true);
                setTimeout(() => setCopiedNotification(false), 2000);
              }}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center space-x-1"
            >
              {copiedNotification ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Layers className="w-3.5 h-3.5" />}
              <span>{copiedNotification ? 'Copied Details' : 'Copy Legend'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

