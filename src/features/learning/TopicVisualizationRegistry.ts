/**
 * VisiOS — Topic-to-Visualization Registry
 *
 * Declarative, typed registry mapping academic topics to appropriate visual representations.
 * Distinguishes validated model assets, procedural schematics, conceptual 3D models,
 * interactive simulations, and 2D canvas fallbacks.
 *
 * Implements Milestone 6 of the Unified Visual Learning Experience.
 */

import { TopicDomain } from './types';

export type VisualizationCategoryType =
  | 'anatomical_model'
  | 'neuron_or_cell'
  | 'molecular_structure'
  | 'mathematical_geometry'
  | 'coordinate_graph'
  | 'physics_simulation'
  | 'cs_data_structure'
  | 'conceptual_schematic'
  | '2d_illustration';

export type ModelFidelityKind =
  | 'validated_asset'
  | 'procedural_schematic'
  | 'conceptual_3d'
  | '2d_fallback'
  | 'no_visualization';

export type SupportedRenderer =
  | 'threejs_viewer'
  | 'procedural_3d'
  | 'simulation'
  | 'geometry_canvas'
  | 'svg_schematic';

export type InteractionCapability =
  | 'rotate'
  | 'zoom'
  | 'pan'
  | 'reset'
  | 'select_structures'
  | 'signal_flow'
  | 'preset_views'
  | 'diagram_capture';

export interface StructureTargetMetadata {
  id: string;
  name: string;
  category: string;
  description: string;
  role: string;
  relationship?: string;
  colorHex?: string;
  linkedTopicQuery?: string; // Concept/topic to navigate to in VisiOS
  linkedConceptId?: string; // Concept ID in TRUSTED_CONCEPT_REGISTRY
  actionType?: 'study_lesson' | 'open_simulation' | 'view_derivation' | 'practice';
  actionLabel?: string;
}

export interface NextActionLink {
  id: string;
  label: string;
  topicQuery: string;
  description: string;
}

export interface TopicVisualizationDefinition {
  id: string;
  topicIdentifiers: string[];
  domain: TopicDomain;
  displayName: string;
  shortDescription: string;
  visualizationType: VisualizationCategoryType;
  rendererType: SupportedRenderer;
  modelKind: ModelFidelityKind;
  assetReference?: {
    format: 'procedural' | 'gltf' | 'glb' | 'svg';
    path?: string;
    license?: string;
    provenance?: string;
  };
  modelVersion?: string;
  learningObjectives?: string[];
  nextActions?: NextActionLink[];
  supportedStructures: StructureTargetMetadata[];
  labels: string[];
  supportedInteractions: InteractionCapability[];
  loadingRequirements: string[];
  limitationsAndAccuracyNotes: string;
  fallbackVisualizationId?: string;
  canonicalModelType:
    | 'nervous_system'
    | 'neuron'
    | 'heart'
    | 'molecule'
    | 'vectors_3d'
    | 'geometric_solids'
    | 'linear_plotter'
    | 'pythagoras'
    | 'binary_search'
    | 'pendulum'
    | 'none';
  initialPreset?: string;
}

/**
 * Built-in Registry of Verified Educational Topic Visualizations.
 * Only genuine, implemented renderers and procedural models are registered.
 */
export const VERIFIED_TOPIC_VISUALIZATIONS: Record<string, TopicVisualizationDefinition> = {
  // 1. Nervous System (Central & Peripheral Nervous System)
  vis_nervous_system: {
    id: 'vis_nervous_system',
    topicIdentifiers: [
      'nervous system',
      'human nervous system',
      'central nervous system',
      'cns',
      'peripheral nervous system',
      'pns',
      'brain',
      'spinal cord',
      'neuroscience',
      'reflex arc',
      'neural circuits',
    ],
    domain: 'biology',
    displayName: 'Human Nervous System (CNS & PNS)',
    shortDescription:
      'Interactive 3D procedural anatomical model showing the Cerebrum, Cerebellum, Brainstem, Spinal Cord, and Peripheral Nerves with real-time electrochemical action potential propagation.',
    visualizationType: 'anatomical_model',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Procedural Neuro-Geometry Engine',
      license: 'MIT (Project-Internal Procedural Mesh)',
    },
    modelVersion: '1.2.0',
    learningObjectives: [
      'Differentiate anatomical components of the Central Nervous System (CNS) from the Peripheral Nervous System (PNS).',
      'Trace electrical action potential flow from higher cortical centers down the spinal cord to peripheral nerve roots.',
      'Understand how segmental spinal reflexes operate autonomously from conscious cerebral control.',
    ],
    nextActions: [
      {
        id: 'study_cellular_neuron',
        label: 'Inspect Cellular Neuron & Synapses',
        topicQuery: 'neuron',
        description: 'Explore cellular multipolar neuron morphology, saltatory myelin conduction, and neurotransmitters.',
      },
      {
        id: 'study_reflex_arc',
        label: 'Patellar Reflex Arc Derivation',
        topicQuery: 'nervous system',
        description: 'Review the monosynaptic sensory-to-motor reflex loop in the spinal cord.',
      },
    ],
    supportedStructures: [
      {
        id: 'cerebrum',
        name: 'Cerebrum & Cerebral Cortex',
        category: 'Higher Executive CNS',
        description:
          'Integrates complex sensory perception, voluntary motor initiative, language, and executive decision-making.',
        role: 'Primary seat of consciousness, reasoning, sensory interpretation, and voluntary motor output.',
        relationship: 'Connects basally to the brainstem and coordinates with the cerebellum via corticopontocerebellar tracts.',
        colorHex: '#f472b6',
        linkedTopicQuery: 'nervous system',
        linkedConceptId: 'bio_nervous_system',
        actionLabel: 'Study Executive Cortical Functions',
      },
      {
        id: 'cerebellum',
        name: 'Cerebellum ("Little Brain")',
        category: 'Motor Coordination & Proprioception',
        description:
          'Precision motor coordination, postural balance, proprioception, and automated motor skill execution.',
        role: 'Computes feedforward and feedback error corrections comparing intended motor commands with real-time sensory inputs.',
        relationship: 'Attached posteriorly to the brainstem via superior, middle, and inferior cerebellar peduncles.',
        colorHex: '#ec4899',
        linkedTopicQuery: 'nervous system',
        linkedConceptId: 'bio_nervous_system',
        actionLabel: 'Study Motor Coordination Loops',
      },
      {
        id: 'brainstem',
        name: 'Brainstem (Midbrain, Pons & Medulla)',
        category: 'Vital Autonomic Center',
        description:
          'Controls critical vegetative life-support functions: cardiac rhythm, respiratory drive, blood pressure, and cranial reflexes.',
        role: 'Essential conduit for all ascending sensory and descending motor tracts between cerebrum and spinal cord.',
        relationship: 'Continuous rostrally with the diencephalon and caudally with the cervical spinal cord.',
        colorHex: '#fbbf24',
        linkedTopicQuery: 'nervous system',
        linkedConceptId: 'bio_nervous_system',
        actionLabel: 'Study Autonomic Reflex Centers',
      },
      {
        id: 'spinal_cord',
        name: 'Spinal Cord & Peripheral Nerves',
        category: 'Conduction & Reflex Arc',
        description:
          'High-velocity two-way neural superhighway transmitting sensory afferent signals upward and motor efferent signals downward.',
        role: 'Mediates protective segmental spinal reflex arcs independently of cerebral cortex intervention.',
        relationship: 'Branches bilaterally into 31 pairs of peripheral spinal nerve roots spanning cervical to sacral dermatomes.',
        colorHex: '#f59e0b',
        linkedTopicQuery: 'neuron',
        linkedConceptId: 'bio_neurons_synapses',
        actionLabel: 'Inspect Cellular Neuron Architecture',
      },
    ],
    labels: ['Cerebrum', 'Cerebellum', 'Brainstem', 'Spinal Cord', 'Peripheral Nerve Roots', 'Action Potential Wave'],
    supportedInteractions: [
      'rotate',
      'zoom',
      'pan',
      'reset',
      'select_structures',
      'signal_flow',
      'preset_views',
      'diagram_capture',
    ],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedurally generated conceptual 3D schematic designed for secondary and undergraduate neurobiology education. Illustrates relative positions, lobes, and signal pathways of cerebrum, cerebellum, brainstem, spinal cord, and peripheral spinal nerves; not a clinical radiological scan.',
    canonicalModelType: 'nervous_system',
    initialPreset: 'cns',
  },

  // 2. Cellular Multipolar Neuron
  vis_neuron: {
    id: 'vis_neuron',
    topicIdentifiers: [
      'neuron',
      'neuron structure',
      'multipolar neuron',
      'nerve cell',
      'action potential',
      'synapse',
      'synaptic transmission',
      'dendrite',
      'axon',
      'myelin sheath',
      'nodes of ranvier',
      'neurotransmitter',
    ],
    domain: 'biology',
    displayName: 'Cellular Multipolar Neuron & Synaptic Cleft',
    shortDescription:
      'Interactive 3D cellular model of a multipolar neuron displaying dendritic reception, soma processing, axon hillock thresholding, saltatory myelin conduction, and synaptic vesicle exocytosis.',
    visualizationType: 'neuron_or_cell',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Procedural Cytology Engine',
      license: 'MIT (Project-Internal Procedural Mesh)',
    },
    modelVersion: '1.2.0',
    learningObjectives: [
      'Identify the 5 primary structural regions of a multipolar neuron: soma, dendrites, axon hillock, myelinated axon, and synaptic terminals.',
      'Explain how saltatory conduction accelerates action potentials from 1 m/s up to 120 m/s across Nodes of Ranvier.',
      'Describe chemical neurotransmission across the 20 nm synaptic cleft driven by voltage-gated calcium influx.',
    ],
    nextActions: [
      {
        id: 'study_organelles',
        label: 'Explore Cellular Organelles & Membrane',
        topicQuery: 'cells and tissues',
        description: 'Understand the phospholipid bilayer, Na+/K+-ATPase pumps, and cellular resting potentials.',
      },
      {
        id: 'study_macro_cns',
        label: 'Central Nervous System Macro View',
        topicQuery: 'nervous system',
        description: 'See how billions of multipolar neurons aggregate into cerebral cortex columns and tracts.',
      },
    ],
    supportedStructures: [
      {
        id: 'soma',
        name: 'Soma (Cell Body & Nucleus)',
        category: 'Metabolic & Biosynthetic Hub',
        description:
          'Houses the genetic nucleus, Nissl substance, and organelles responsible for synthesizing neurotransmitters and structural neurofilaments.',
        role: 'Summates incoming graded potentials electrotonically towards the axon hillock trigger zone.',
        relationship: 'Receives dendrites at its periphery and tapers into the axon hillock.',
        colorHex: '#ec4899',
        linkedTopicQuery: 'cells and tissues',
        linkedConceptId: 'bio_cells_tissues',
        actionLabel: 'Study Cellular Organelles',
      },
      {
        id: 'dendrites',
        name: 'Dendritic Tree & Spines',
        category: 'Receptive Input Zone',
        description:
          'Extensively branched tree-like projections receiving thousands of synaptic signals from presynaptic neurons.',
        role: 'Generates excitatory (EPSP) or inhibitory (IPSP) graded potentials in response to neurotransmitter binding.',
        relationship: 'Projects outward from the soma to maximize receptive surface area.',
        colorHex: '#f472b6',
        linkedTopicQuery: 'synaptic transmission',
        linkedConceptId: 'bio_neurons_synapses',
        actionLabel: 'Study Synaptic Receptors',
      },
      {
        id: 'axon_hillock',
        name: 'Axon Hillock & Axon Trunk',
        category: 'Trigger & Conduction Zone',
        description:
          'The anatomical trigger zone where incoming membrane potentials summate to reach the critical -55 mV firing threshold.',
        role: 'Contains a dense cluster of voltage-gated Na⁺ channels that ignite all-or-none action potentials.',
        relationship: 'Tapers from the soma into the initial segment of the unmyelinated or myelinated axon.',
        colorHex: '#fbbf24',
        linkedTopicQuery: 'action potential',
        linkedConceptId: 'bio_neurons_synapses',
        actionLabel: 'Study Action Potential Threshold',
      },
      {
        id: 'myelin',
        name: 'Myelin Sheath & Nodes of Ranvier',
        category: 'Insulative Conduction Accelerator',
        description:
          'Segmented concentric lipid wrappings produced by Schwann cells (PNS) or oligodendrocytes (CNS).',
        role: 'Enables high-velocity saltatory conduction up to 120 m/s by confining ion exchange exclusively to uninsulated Nodes of Ranvier.',
        relationship: 'Ensheathes the axon trunk in regular cylindrical segments interspersed by nodal gaps.',
        colorHex: '#a855f7',
        linkedTopicQuery: 'nervous system',
        linkedConceptId: 'bio_nervous_system',
        actionLabel: 'Study Saltatory Conduction',
      },
      {
        id: 'synapse',
        name: 'Axon Terminals & Synaptic Cleft',
        category: 'Chemical Neurotransmission',
        description:
          'Terminal arborizations ending in synaptic boutons that convert electrical impulses into chemical neurotransmitter release.',
        role: 'Terminal depolarization triggers voltage-gated Ca²⁺ influx, driving exocytosis of neurotransmitter vesicles across the 20 nm synaptic cleft.',
        relationship: 'Forms synaptic contacts with dendrites or cell bodies of target postsynaptic neurons.',
        colorHex: '#10b981',
        linkedTopicQuery: 'synaptic transmission',
        linkedConceptId: 'bio_neurons_synapses',
        actionLabel: 'Study Neurotransmitters & Synapses',
      },
    ],
    labels: ['Soma', 'Dendritic Arbor', 'Axon Hillock', 'Myelin Sheath', 'Nodes of Ranvier', 'Synaptic Terminals'],
    supportedInteractions: [
      'rotate',
      'zoom',
      'pan',
      'reset',
      'select_structures',
      'signal_flow',
      'preset_views',
      'diagram_capture',
    ],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedural educational schematic illustrating cellular neuro-anatomy and directional action potential propagation. Geometric proportions optimized for visual clarity; synaptic cleft spacing exaggerated for pedagogical viewing.',
    canonicalModelType: 'neuron',
    initialPreset: 'neuron',
  },

  // 3. Human Heart
  vis_heart: {
    id: 'vis_heart',
    topicIdentifiers: [
      'heart',
      'human heart',
      'cardiac anatomy',
      'cardiovascular system',
      'blood circulation',
      'ventricle',
      'atrium',
      'myocardium',
    ],
    domain: 'biology',
    displayName: 'Human Heart 3D Anatomy & Cardiac Cycle',
    shortDescription:
      'Interactive 3D cardiac model demonstrating atria, ventricles, aorta, vena cava, pulmonary vessels, and synchronized rhythmic contraction.',
    visualizationType: 'anatomical_model',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Procedural Cardiology Engine',
      license: 'MIT (Project-Internal Procedural Mesh)',
    },
    modelVersion: '1.1.0',
    learningObjectives: [
      'Trace systemic vs pulmonary circulation circuits through four cardiac chambers.',
      'Understand rhythmic systole (contraction) and diastole (filling) pressure differentials.',
      'Examine the thick left ventricular myocardium required to generate ~120 mmHg systemic pressure.',
    ],
    nextActions: [
      {
        id: 'study_cardiac_nerves',
        label: 'Autonomic Cardiac Innervation',
        topicQuery: 'nervous system',
        description: 'Explore how sympathetic and vagal parasympathetic inputs modulate heart rate.',
      },
    ],
    supportedStructures: [
      {
        id: 'left_ventricle',
        name: 'Left Ventricle',
        category: 'High-Pressure Systemic Pump',
        description: 'Thick muscular chamber that pumps oxygenated blood into the aorta at systemic pressure (~120 mmHg).',
        role: 'Generates systolic blood pressure to perfuse organs across the systemic arterial tree.',
        colorHex: '#ef4444',
        linkedTopicQuery: 'nervous system',
        linkedConceptId: 'bio_nervous_system',
        actionLabel: 'Study Autonomic Cardiac Control',
      },
      {
        id: 'right_ventricle',
        name: 'Right Ventricle',
        category: 'Low-Pressure Pulmonary Pump',
        description: 'Pumps deoxygenated venous blood into the pulmonary artery toward alveolar capillary beds.',
        role: 'Drives low-resistance pulmonary circulation for gas exchange.',
        colorHex: '#3b82f6',
        linkedTopicQuery: 'cells and tissues',
        linkedConceptId: 'bio_cells_tissues',
        actionLabel: 'Study Myocardial Muscle Tissue',
      },
      {
        id: 'aorta',
        name: 'Ascending Aorta & Aortic Arch',
        category: 'Great Systemic Artery',
        description: 'Largest elastic artery in the body, branching into brachiocephalic, carotid, and subclavian arteries.',
        role: 'Dampens pulsatile ventricular output via elastic recoil (Windkessel effect).',
        colorHex: '#dc2626',
        linkedTopicQuery: 'kinematics',
        linkedConceptId: 'phys_kinematics_velocity',
        actionLabel: 'Study Arterial Flow Velocity',
      },
      {
        id: 'atria',
        name: 'Left & Right Atria',
        category: 'Venous Receiving Chambers',
        description: 'Thin-walled collecting chambers that fill ventricles during diastole and provide atrial kick.',
        role: 'Receives systemic and pulmonary venous returns.',
        colorHex: '#f87171',
        linkedTopicQuery: 'cells and tissues',
        linkedConceptId: 'bio_cells_tissues',
        actionLabel: 'Study Cardiac Histology',
      },
    ],
    labels: ['Left Ventricle', 'Right Ventricle', 'Left Atrium', 'Right Atrium', 'Aorta', 'Vena Cava'],
    supportedInteractions: ['rotate', 'zoom', 'pan', 'reset', 'select_structures', 'preset_views'],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedural educational schematic of human heart chambers and great vessels designed for functional cardiovascular pedagogy. Cardiac cycle pulsation is modeled as an idealized rhythmic harmonic displacement.',
    canonicalModelType: 'heart',
  },

  // 4. Water Molecule (H2O)
  vis_molecule_water: {
    id: 'vis_molecule_water',
    topicIdentifiers: [
      'water molecule',
      'h2o',
      'water chemical structure',
      'bent molecule',
      'polar covalent bond',
      'hydrogen bonding',
    ],
    domain: 'chemistry',
    displayName: 'Water (H₂O) Molecular Geometry',
    shortDescription:
      'Ball-and-stick 3D molecular model depicting bent geometry (104.5° bond angle) with polar covalent O-H bonds.',
    visualizationType: 'molecular_structure',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS VSEPR Chemistry Engine',
      license: 'MIT (Project-Internal Procedural Mesh)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Visualize VSEPR-predicted bent geometry with two bonded pairs and two nonbonding lone pairs.',
      'Explain molecular dipole moment generated by electronegativity difference: ΔEN = 1.24.',
      'Understand how intermolecular hydrogen bonds account for water\'s high boiling point and surface tension.',
    ],
    nextActions: [
      {
        id: 'study_methane',
        label: 'Contrast with Tetrahedral Methane (CH₄)',
        topicQuery: 'methane',
        description: 'Compare polar bent H2O with nonpolar symmetric tetrahedral CH4.',
      },
      {
        id: 'study_bonding',
        label: 'Chemical Bonding Principles',
        topicQuery: 'chemical bonding',
        description: 'Study polar covalent vs nonpolar vs ionic bonds across the electronegativity continuum.',
      },
    ],
    supportedStructures: [
      {
        id: 'oxygen_atom',
        name: 'Oxygen Atom (Electronegative Core)',
        category: 'Central Chalcogen',
        description: 'Central oxygen with two bonded electron pairs and two non-bonding lone pairs inducing steric bent repulsion.',
        role: 'Carries partial negative charge (δ⁻ = -0.66e) attracting neighboring hydrogen dipoles.',
        colorHex: '#ef4444',
        linkedTopicQuery: 'chemical bonding',
        linkedConceptId: 'chem_chemical_bonding',
        actionLabel: 'Study Electronegativity & Polar Bonds',
      },
      {
        id: 'hydrogen_atoms',
        name: 'Hydrogen Atoms (Electropositive Dipoles)',
        category: 'Terminal Ligands',
        description: 'Single-proton atoms bonded covalently at a 104.5° equilibrium angle.',
        role: 'Carry partial positive charges (δ⁺ = +0.33e) forming intermolecular hydrogen bonds.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'chemical bonding',
        linkedConceptId: 'chem_chemical_bonding',
        actionLabel: 'Study Hydrogen Bonding Interactions',
      },
    ],
    labels: ['Oxygen (O)', 'Hydrogen (H₁)', 'Hydrogen (H₂)', '104.5° Bond Angle', 'Dipole Vector'],
    supportedInteractions: ['rotate', 'zoom', 'pan', 'reset', 'select_structures'],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedural educational schematic of VSEPR-derived ball-and-stick molecular geometry with idealized bond angles (104.5°) and Van der Waals radius proportions.',
    canonicalModelType: 'molecule',
    initialPreset: 'h2o',
  },

  // 5. Methane Molecule (CH4)
  vis_molecule_methane: {
    id: 'vis_molecule_methane',
    topicIdentifiers: [
      'methane',
      'ch4',
      'methane molecule',
      'tetrahedral molecule',
      'sp3 hybridization',
      'hydrocarbon',
    ],
    domain: 'chemistry',
    displayName: 'Methane (CH₄) Tetrahedral Geometry',
    shortDescription:
      'Ball-and-stick 3D molecular model illustrating sp³ hybridized symmetric tetrahedral geometry (109.5° bond angle).',
    visualizationType: 'molecular_structure',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS VSEPR Chemistry Engine',
      license: 'MIT (Project-Internal Procedural Mesh)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Understand sp³ orbital hybridization giving rise to 4 equivalent tetrahedral bonds.',
      'Explain why methane is non-polar despite having individual C-H bond dipoles (dipole vector cancellation).',
      'Verify the 109.5° tetrahedral dihedral bond angle.',
    ],
    nextActions: [
      {
        id: 'study_solids',
        label: 'Examine Tetrahedral Geometric Solid',
        topicQuery: 'tetrahedron',
        description: 'Inspect the mathematical 4-faced regular polyhedron underlying sp3 geometry.',
      },
    ],
    supportedStructures: [
      {
        id: 'carbon_atom',
        name: 'Carbon Atom (sp³ Hybridized Core)',
        category: 'Central Group 14 Atom',
        description: 'Tetravalent central carbon with 4 equivalent sp³ hybrid orbitals oriented toward tetrahedral vertices.',
        role: 'Forms 4 nonpolar sigma covalent bonds with hydrogen.',
        colorHex: '#334155',
        linkedTopicQuery: 'chemical bonding',
        linkedConceptId: 'chem_chemical_bonding',
        actionLabel: 'Study Covalent Octet Sharing',
      },
      {
        id: 'hydrogen_atoms',
        name: 'Hydrogen Ligands (4x)',
        category: 'Terminal Ligands',
        description: 'Four hydrogen atoms occupying the 4 vertices of a regular tetrahedron at 109.5° bond angles.',
        role: 'Share 1s electrons to complete carbon valence octet.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'chemical bonding',
        linkedConceptId: 'chem_chemical_bonding',
        actionLabel: 'Study Tetrahedral VSEPR Repulsion',
      },
    ],
    labels: ['Carbon (C)', 'Hydrogen (4x)', '109.5° Tetrahedral Angle', 'sp³ Sigma Bonds'],
    supportedInteractions: ['rotate', 'zoom', 'pan', 'reset', 'select_structures'],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedural educational schematic of VSEPR-derived tetrahedral structure with sp³ hybridization and idealized 109.5° dihedral symmetry.',
    canonicalModelType: 'molecule',
    initialPreset: 'ch4',
  },

  // 6. Geometric Solids (Platonic Polyhedra & Curved Solids)
  vis_geometric_solids: {
    id: 'vis_geometric_solids',
    topicIdentifiers: [
      'geometric solids',
      'platonic solids',
      'polyhedron',
      'polyhedra',
      'cube',
      'tetrahedron',
      'octahedron',
      'dodecahedron',
      'icosahedron',
      'cylinder',
      'sphere',
      'cone',
      'solid geometry',
      'euler characteristic',
      '3d geometric shapes',
    ],
    domain: 'mathematics',
    displayName: 'Geometric Solids & Regular Polyhedra',
    shortDescription:
      'Interactive 3D regular polyhedra and solid geometry explorer verifying Euler\'s Polyhedral Formula (V - E + F = 2) with face, vertex, and edge dissection.',
    visualizationType: 'mathematical_geometry',
    rendererType: 'threejs_viewer',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS 3D Euclidean Polyhedral Geometry Engine',
      license: 'MIT (Project-Internal Procedural Geometry)',
    },
    modelVersion: '1.2.0',
    learningObjectives: [
      'Verify Euler\'s Polyhedral Formula: V - E + F = 2 across all regular convex polyhedra.',
      'Explore the 5 Platonic solids and understand their vertex, edge, and face counts.',
      'Compute exact surface area and volume metrics for polyhedra and curved solids of revolution.',
    ],
    nextActions: [
      {
        id: 'study_euclidean_geom',
        label: 'Explore Right Triangles & Euclidean Metric',
        topicQuery: 'right triangle',
        description: 'Learn how spatial edge distances are computed via the Euclidean distance metric.',
      },
      {
        id: 'study_pythagoras',
        label: 'Pythagorean Spatial Dissection',
        topicQuery: 'pythagorean theorem',
        description: 'Understand 2D and 3D distance formulas derived from right-angled triangles.',
      },
    ],
    supportedStructures: [
      {
        id: 'vertices',
        name: 'Vertices (V)',
        category: 'Zero-Dimensional Points',
        description: 'Discrete coordinate vertices in R³ where three or more edges intersect.',
        role: 'Defines the topological 0-simplex boundary elements of the polyhedron.',
        colorHex: '#facc15',
        linkedTopicQuery: 'right triangle',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Coordinate Vertices & Angles',
      },
      {
        id: 'edges',
        name: 'Edges (E)',
        category: 'One-Dimensional Line Segments',
        description: 'Linear line segments bounding polygonal faces and connecting pairs of adjacent vertices.',
        role: 'Defines the 1-skeleton graph of the polyhedron.',
        colorHex: '#ffffff',
        linkedTopicQuery: 'pythagorean theorem',
        linkedConceptId: 'math_pythagorean_theorem',
        actionLabel: 'Study Edge Lengths & Metrics',
      },
      {
        id: 'faces',
        name: 'Faces (F)',
        category: 'Two-Dimensional Polygonal Sheets',
        description: 'Planar regular polygonal surfaces bounding the interior volume of the solid.',
        role: 'Encloses the 3D interior volume and determines surface area.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'pythagorean theorem',
        linkedConceptId: 'math_pythagorean_theorem',
        actionLabel: 'Study Polygonal Surface Areas',
      },
      {
        id: 'euler',
        name: 'Euler Characteristic (V - E + F = 2)',
        category: 'Topological Invariant',
        description: 'Topological invariant for any simply connected convex polyhedron: Vertices minus Edges plus Faces strictly equals 2.',
        role: 'Proves there are precisely 5 regular Platonic solids in 3D Euclidean space.',
        colorHex: '#06b6d4',
        linkedTopicQuery: 'linear function',
        linkedConceptId: 'math_linear_functions',
        actionLabel: 'Study Invariants & Discrete Relations',
      },
    ],
    labels: ['Vertices (V)', 'Edges (E)', 'Faces (F)', 'Euler Invariant (V - E + F = 2)', 'Surface Area', 'Volume'],
    supportedInteractions: ['rotate', 'zoom', 'pan', 'reset', 'select_structures', 'preset_views'],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Procedural educational schematic of exact Euclidean polyhedral geometry generated with standard dihedral symmetries. Euler characteristic holds strictly for convex polyhedra without topological handles or self-intersections.',
    canonicalModelType: 'geometric_solids',
    initialPreset: 'cube',
  },

  // 7. Pythagorean Theorem (Geometry)
  vis_pythagorean_geometry: {
    id: 'vis_pythagorean_geometry',
    topicIdentifiers: [
      'pythagorean theorem',
      'a^2 + b^2 = c^2',
      'right triangle',
      'hypotenuse',
      'pythagoras proof',
      'euclidean geometry',
    ],
    domain: 'mathematics',
    displayName: 'Pythagorean Theorem Geometric Dissection',
    shortDescription:
      'Interactive right-angled triangle showing geometric square tiles on sides a, b, and hypotenuse c (a² + b² = c²).',
    visualizationType: 'mathematical_geometry',
    rendererType: 'geometry_canvas',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Euclidean Geometry Engine',
      license: 'MIT (Project-Internal Procedural Geometry)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Understand the visual area proof of a² + b² = c².',
      'Deconstruct right triangles into orthogonal base and altitude dimensions.',
      'Connect the Pythagorean identity to the Euclidean distance metric in coordinate space.',
    ],
    nextActions: [
      {
        id: 'study_euclidean_distance',
        label: 'Euclidean Distance in Cartesian Space',
        topicQuery: 'distance between points',
        description: 'Extend a² + b² = c² to d = √((x₂ - x₁)² + (y₂ - y₁)²).',
      },
    ],
    supportedStructures: [
      {
        id: 'side_a',
        name: 'Leg a & Square Area a²',
        category: 'Orthogonal Base Leg',
        description: 'Horizontal leg forming the right angle with leg b, flanked by square of area a².',
        role: 'Base dimension in Pythagorean relationship.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'right triangle',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Right Triangles',
      },
      {
        id: 'side_b',
        name: 'Leg b & Square Area b²',
        category: 'Orthogonal Altitude Leg',
        description: 'Vertical leg perpendicular to leg a, flanked by square of area b².',
        role: 'Altitude dimension in Pythagorean relationship.',
        colorHex: '#34d399',
        linkedTopicQuery: 'right triangle',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Right Triangles',
      },
      {
        id: 'hypotenuse_c',
        name: 'Hypotenuse c & Square Area c²',
        category: 'Opposite Right Angle',
        description: 'Longest side opposite the 90° angle. Area c² exactly equals the sum of a² and b².',
        role: 'Hypotenuse invariant in Euclidean space.',
        colorHex: '#f59e0b',
        linkedTopicQuery: 'pythagorean theorem',
        linkedConceptId: 'math_pythagorean_theorem',
        actionLabel: 'Explore Pythagorean Proof',
      },
    ],
    labels: ['Leg a', 'Leg b', 'Hypotenuse c', 'Area a²', 'Area b²', 'Area c²'],
    supportedInteractions: ['reset', 'select_structures'],
    loadingRequirements: ['HTML5 Canvas / SVG rendering'],
    limitationsAndAccuracyNotes:
      'Exact Euclidean geometric proof via area dissection. Confined to planar flat space.',
    canonicalModelType: 'pythagoras',
  },

  // 8. Linear Functions (Algebra / Coordinate Plotter)
  vis_linear_function: {
    id: 'vis_linear_function',
    topicIdentifiers: [
      'linear function',
      'linear functions',
      'y = 2x + 3',
      'y = mx + c',
      'slope intercept form',
      'slope and intercept',
      'linear equation',
    ],
    domain: 'mathematics',
    displayName: 'Interactive Linear Function Coordinate Plotter',
    shortDescription:
      'Interactive 2D Cartesian coordinate plotter with dynamic slope (m) and intercept (c) controls and tangent probes.',
    visualizationType: 'coordinate_graph',
    rendererType: 'geometry_canvas',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Cartesian Plotting Engine',
      license: 'MIT (Project-Internal Coordinate Geometry)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Understand the geometric meaning of slope m = Δy / Δx as rate of change.',
      'Observe how changing intercept c translates the line vertically along the y-axis.',
      'Connect algebraic linear equations to 2D Cartesian coordinate lines.',
    ],
    nextActions: [
      {
        id: 'study_systems',
        label: 'Systems of Linear Equations',
        topicQuery: 'linear function',
        description: 'Find intersection points of two linear functions.',
      },
    ],
    supportedStructures: [
      {
        id: 'slope',
        name: 'Slope (m)',
        category: 'Rate of Change',
        description: 'The steepness and direction of the line: m = Δy / Δx.',
        role: 'Determines the instantaneous and average rate of change.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'linear function',
        linkedConceptId: 'math_linear_functions',
        actionLabel: 'Study Slope & Rate of Change',
      },
      {
        id: 'y_intercept',
        name: 'Y-Intercept (c)',
        category: 'Initial Offset',
        description: 'The coordinate point (0, c) where the line intersects the vertical y-axis.',
        role: 'Defines the value of y when x = 0.',
        colorHex: '#34d399',
        linkedTopicQuery: 'linear function',
        linkedConceptId: 'math_linear_functions',
        actionLabel: 'Study Initial Value Offsets',
      },
    ],
    labels: ['y-axis', 'x-axis', 'Line y = mx + c', 'Slope Triangle', 'Intercept Point (0, c)'],
    supportedInteractions: ['reset', 'select_structures'],
    loadingRequirements: ['HTML5 Canvas / SVG rendering'],
    limitationsAndAccuracyNotes:
      'Exact Cartesian coordinate plotting engine with continuous real-time coordinate transformations.',
    canonicalModelType: 'linear_plotter',
  },

  // 9. 3D Spatial Vectors & Coordinate Geometry
  vis_vectors_3d: {
    id: 'vis_vectors_3d',
    topicIdentifiers: [
      '3d vector',
      'vectors',
      'coordinate plane 3d',
      'cross product',
      'dot product',
      'spatial vectors',
      'vector field',
      'basis vectors',
    ],
    domain: 'mathematics',
    displayName: '3D Vector Field & Coordinate Axes',
    shortDescription:
      'Interactive 3D vector visualizer showing vector components, basis vectors (i, j, k), and resultant vectors in Euclidean R³.',
    visualizationType: 'mathematical_geometry',
    rendererType: 'threejs_viewer',
    modelKind: 'conceptual_3d',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS 3D Vector Geometry Engine',
      license: 'MIT (Project-Internal Spatial Math)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Deconstruct 3D vectors into orthogonal basis components [x, y, z].',
      'Understand geometric interpretation of dot product (projection) and cross product (orthogonal area vector).',
    ],
    nextActions: [
      {
        id: 'study_solids',
        label: 'Geometric Solids in 3D Space',
        topicQuery: 'geometric solids',
        description: 'Examine polyhedral coordinates and vertices embedded in R3.',
      },
    ],
    supportedStructures: [
      {
        id: 'basis_x',
        name: 'Basis Vector i (X-axis)',
        category: 'Unit Basis Vector',
        description: 'Standard Cartesian unit vector [1, 0, 0] along the horizontal transverse axis.',
        role: 'Decomposes x-component of spatial vectors.',
        colorHex: '#ef4444',
        linkedTopicQuery: '3d vector',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Basis Projections',
      },
      {
        id: 'basis_y',
        name: 'Basis Vector j (Y-axis)',
        category: 'Unit Basis Vector',
        description: 'Standard Cartesian unit vector [0, 1, 0] along the vertical elevation axis.',
        role: 'Decomposes y-component of spatial vectors.',
        colorHex: '#22c55e',
        linkedTopicQuery: '3d vector',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Basis Projections',
      },
      {
        id: 'basis_z',
        name: 'Basis Vector k (Z-axis)',
        category: 'Unit Basis Vector',
        description: 'Standard Cartesian unit vector [0, 0, 1] along the sagittal depth axis.',
        role: 'Decomposes z-component of spatial vectors.',
        colorHex: '#3b82f6',
        linkedTopicQuery: '3d vector',
        linkedConceptId: 'math_right_triangles',
        actionLabel: 'Study Basis Projections',
      },
    ],
    labels: ['X Axis (Red)', 'Y Axis (Green)', 'Z Axis (Blue)', 'Resultant Vector', 'Dot Product Projection'],
    supportedInteractions: ['rotate', 'zoom', 'pan', 'reset', 'select_structures'],
    loadingRequirements: ['WebGL 1.0/2.0 context', 'Three.js runtime'],
    limitationsAndAccuracyNotes:
      'Conceptual 3D coordinate space modeling linear transformations and vector addition in Euclidean R³.',
    canonicalModelType: 'vectors_3d',
  },

  // 10. Binary Search (Computer Science)
  vis_binary_tree: {
    id: 'vis_binary_tree',
    topicIdentifiers: [
      'binary search',
      'binary tree',
      'tree traversal',
      'binary search tree',
      'logarithmic search',
      'divide and conquer',
    ],
    domain: 'computer_science',
    displayName: 'Binary Search Array & Tree Partition Tracer',
    shortDescription:
      'Deterministic step-by-step array partition tracer showing low, mid, and high pointers operating in O(log n) logarithmic time.',
    visualizationType: 'cs_data_structure',
    rendererType: 'simulation',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Deterministic Algorithm Tracer',
      license: 'MIT (Project-Internal Algorithm Engine)',
    },
    modelVersion: '1.1.0',
    learningObjectives: [
      'Observe logarithmic search interval reduction: n -> n/2 -> n/4 -> 1.',
      'Track low, mid, and high pointer updates step-by-step.',
      'Understand why binary search requires a sorted array precondition.',
    ],
    nextActions: [
      {
        id: 'study_trees',
        label: 'Binary Tree Traversal',
        topicQuery: 'binary tree traversal',
        description: 'Explore hierarchical In-Order, Pre-Order, and Post-Order traversals.',
      },
    ],
    supportedStructures: [
      {
        id: 'mid_pointer',
        name: 'Mid Pointer & Array[mid]',
        category: 'Pivot Index',
        description: 'Current test value computed as mid = floor((low + high) / 2).',
        role: 'Halves the remaining search space on every iteration.',
        colorHex: '#f59e0b',
        linkedTopicQuery: 'binary search',
        linkedConceptId: 'cs_binary_search',
        actionLabel: 'Step Through Array Trace',
      },
      {
        id: 'search_interval',
        name: 'Active Search Window [low, high]',
        category: 'Candidate Range',
        description: 'Bounded subarray containing potential target matches.',
        role: 'Demonstrates logarithmic reduction from n to n/2 to n/4 down to 1.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'binary tree traversal',
        linkedConceptId: 'cs_trees_traversal',
        actionLabel: 'Study Tree Hierarchies',
      },
    ],
    labels: ['Array Index Buffer', 'Low Pointer', 'Mid Pivot', 'High Pointer', 'Logarithmic Halving'],
    supportedInteractions: ['reset', 'select_structures'],
    loadingRequirements: ['HTML5 Canvas / DOM rendering'],
    limitationsAndAccuracyNotes:
      'Deterministic algorithmic tracer strictly visualizing sorted contiguous arrays and logarithmic interval reduction.',
    canonicalModelType: 'binary_search',
  },

  // 11. Projectile Motion (Physics)
  vis_projectile_motion: {
    id: 'vis_projectile_motion',
    topicIdentifiers: [
      'projectile motion',
      'trajectory',
      'kinematics projectile',
      'parabolic trajectory',
      'launch angle',
      'range and height',
    ],
    domain: 'physics',
    displayName: 'Projectile Motion Kinematics Simulator',
    shortDescription:
      'Physics simulation solving 2D parabolic trajectory with gravitational acceleration g = 9.8 m/s².',
    visualizationType: 'physics_simulation',
    rendererType: 'simulation',
    modelKind: 'procedural_schematic',
    assetReference: {
      format: 'procedural',
      provenance: 'VisiOS Deterministic Physics Engine',
      license: 'MIT (Project-Internal Kinematic Simulation)',
    },
    modelVersion: '1.0.0',
    learningObjectives: [
      'Decompose 2D projectile motion into constant horizontal velocity and uniformly accelerated vertical velocity.',
      'Observe maximal range R at a 45° launch angle.',
      'Verify gravitational energy conservation throughout flight.',
    ],
    nextActions: [
      {
        id: 'study_f_ma',
        label: 'Newton\'s Second Law: F = ma',
        topicQuery: 'F = ma',
        description: 'Examine gravitational force F = mg driving projectile acceleration.',
      },
    ],
    supportedStructures: [
      {
        id: 'velocity_vector',
        name: 'Initial Velocity Vector (v₀)',
        category: 'Launch Kinetic State',
        description: 'Initial launch speed and elevation angle θ resolved into orthogonal v_0x and v_0y components.',
        role: 'Determines maximal height H and horizontal range R.',
        colorHex: '#38bdf8',
        linkedTopicQuery: 'kinematics',
        linkedConceptId: 'phys_kinematics_velocity',
        actionLabel: 'Study Velocity Vectors',
      },
      {
        id: 'gravity_vector',
        name: 'Gravity Vector (g = 9.8 m/s²)',
        category: 'Uniform Gravitational Field',
        description: 'Constant downward acceleration acting strictly upon the vertical velocity component.',
        role: 'Creates parabolic curvature y(t) = v_0y·t - 0.5·g·t².',
        colorHex: '#ef4444',
        linkedTopicQuery: 'F = ma',
        linkedConceptId: 'phys_newton_laws',
        actionLabel: 'Study Newton\'s Laws & Gravity',
      },
    ],
    labels: ['Launch Angle θ', 'Initial Velocity v₀', 'Max Height H', 'Horizontal Range R', 'Gravity Vector g'],
    supportedInteractions: ['reset', 'select_structures'],
    loadingRequirements: ['HTML5 Canvas / DOM rendering'],
    limitationsAndAccuracyNotes:
      'Deterministic Newtonian kinematic integration in uniform gravitational field neglecting air resistance.',
    canonicalModelType: 'pendulum',
  },
};

/**
 * Topic-to-Visualization Registry Engine
 */
export class TopicVisualizationRegistry {
  /**
   * Deterministically resolves a topic query string to a verified visualization definition.
   * Matches aliases, keywords, and normalized token stems.
   */
  public static resolve(queryOrTopic: string): TopicVisualizationDefinition | null {
    if (!queryOrTopic || typeof queryOrTopic !== 'string') return null;

    const clean = queryOrTopic
      .toLowerCase()
      .replace(/^[✨📐👁️🧪🧠🗺️\s]+/, '')
      .trim();

    if (!clean) return null;

    // Check specific priority keywords first:
    // 1. Molecules: Methane (CH4)
    if (clean.includes('methane') || clean.includes('ch4')) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_molecule_methane;
    }

    // 2. Molecules: Water (H2O)
    if (clean.includes('water molecule') || clean.includes('h2o') || clean === 'water') {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_molecule_water;
    }

    // 3. Generic Chemistry / Molecule fallback
    if (clean.includes('molecule') || clean.includes('bonding')) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_molecule_water;
    }

    // 4. Neuron / Synapse (Cellular level)
    if (
      clean.includes('neuron') ||
      clean.includes('synap') ||
      clean.includes('dendrit') ||
      clean.includes('axon') ||
      clean.includes('myelin') ||
      clean.includes('nerve cell')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_neuron;
    }

    // 5. Nervous System / Brain / CNS (Organ/system level)
    if (
      clean.includes('nervous') ||
      clean.includes('brain') ||
      clean.includes('cns') ||
      clean.includes('pns') ||
      clean.includes('spinal cord') ||
      clean.includes('neuroscience') ||
      clean.includes('reflex arc')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_nervous_system;
    }

    // 6. Heart / Cardiovascular
    if (
      clean.includes('heart') ||
      clean.includes('cardiac') ||
      clean.includes('cardio') ||
      clean.includes('ventricle') ||
      clean.includes('atrium') ||
      clean.includes('circulation')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_heart;
    }

    // 7. Geometric Solids & Regular Polyhedra
    if (
      clean.includes('geometric solid') ||
      clean.includes('platonic solid') ||
      clean.includes('polyhedr') ||
      clean.includes('cube') ||
      clean.includes('tetrahedr') ||
      clean.includes('octahedr') ||
      clean.includes('dodecahedr') ||
      clean.includes('icosahedr') ||
      clean.includes('euler characteristic') ||
      clean.includes('solid geometry') ||
      clean.includes('3d geometric shape')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_geometric_solids;
    }

    // 8. Linear Functions
    if (
      clean.includes('linear function') ||
      clean.includes('y = 2x') ||
      clean.includes('y=2x') ||
      clean.includes('y = mx') ||
      clean.includes('y=mx') ||
      clean.includes('slope intercept')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_linear_function;
    }

    // 9. Pythagorean Theorem
    if (
      clean.includes('pythagor') ||
      clean.includes('a^2 + b^2') ||
      clean.includes('a² + b²') ||
      clean.includes('right triangle')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_pythagorean_geometry;
    }

    // 10. 3D Vectors / Coordinate Geometry
    if (
      clean.includes('3d vector') ||
      clean.includes('cross product') ||
      clean.includes('dot product') ||
      clean.includes('vector field') ||
      (clean.includes('vector') && clean.includes('3d'))
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_vectors_3d;
    }

    // 11. Binary Search / CS Data Structures
    if (
      clean.includes('binary search') ||
      clean.includes('binary tree') ||
      clean.includes('bsearch') ||
      clean.includes('tree traversal')
    ) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_binary_tree;
    }

    // 12. Projectile Motion
    if (clean.includes('projectile') || clean.includes('trajectory')) {
      return VERIFIED_TOPIC_VISUALIZATIONS.vis_projectile_motion;
    }

    // Linear scanning of topicIdentifiers across all registered definitions
    for (const def of Object.values(VERIFIED_TOPIC_VISUALIZATIONS)) {
      if (def.topicIdentifiers.some((id) => clean.includes(id) || id.includes(clean))) {
        return def;
      }
    }

    return null;
  }

  /**
   * Returns all verified visualization definitions.
   */
  public static getAll(): TopicVisualizationDefinition[] {
    return Object.values(VERIFIED_TOPIC_VISUALIZATIONS);
  }

  /**
   * Alias for getAll() adhering to standardized naming.
   */
  public static getAllDefinitions(): TopicVisualizationDefinition[] {
    return this.getAll();
  }

  /**
   * Retrieves a visualization definition by its unique identifier.
   */
  public static getById(id: string): TopicVisualizationDefinition | null {
    return (VERIFIED_TOPIC_VISUALIZATIONS as Record<string, TopicVisualizationDefinition>)[id] || null;
  }

  /**
   * Checks if a topic has a verified visual representation.
   */
  public static hasVisualization(queryOrTopic: string): boolean {
    return this.resolve(queryOrTopic) !== null;
  }

  /**
   * Checks if a visualization is rendered in Three.js 3D.
   */
  public static is3D(def: TopicVisualizationDefinition | null): boolean {
    if (!def) return false;
    return def.rendererType === 'threejs_viewer' || def.rendererType === 'procedural_3d';
  }

  /**
   * Retrieves recommended topics with rich interactive visualizations for exploration.
   */
  public static getRecommendedVisualizations(): TopicVisualizationDefinition[] {
    return [
      VERIFIED_TOPIC_VISUALIZATIONS.vis_nervous_system,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_neuron,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_heart,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_molecule_water,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_geometric_solids,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_pythagorean_geometry,
      VERIFIED_TOPIC_VISUALIZATIONS.vis_linear_function,
    ];
  }
}
