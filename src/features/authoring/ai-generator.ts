import { 
  AIGenerationRequest, 
  AIGenerationProposal, 
  AIConceptProposal, 
  AIDependencyProposal, 
  AIResourceProposal,
  SectionRegenRequest,
  LearnerLevel
} from '@/types/ai-authoring';
import { SubjectCategory } from '@/types/knowledge';
import { AIVerifier } from './ai-verifier';

export class AIGenerationService {
  /**
   * Proposes a structured learning module from a user-specified topic.
   */
  static async generateModule(request: AIGenerationRequest): Promise<AIGenerationProposal> {
    // 1. Validate request
    if (!request.topicTitle || !request.topicTitle.trim()) {
      throw new Error('Topic title is required for AI content generation.');
    }

    if (request.topicTitle.length > 200) {
      throw new Error('Topic title exceeds maximum allowed length (200 characters).');
    }

    const category = request.subjectCategory || this.inferSubjectCategory(request.topicTitle);
    const level: LearnerLevel = request.intendedLevel || 'introductory';
    const depth = request.desiredDepth || 'standard';

    // 2. Generate structured domain content using built-in curriculum synthesis engine
    const rawProposal = this.synthesizeCurriculum(request.topicTitle, category, level, depth, request.scope || 'complete_module');

    // 3. Deterministically verify through AIVerifier
    const validation = AIVerifier.verifyProposal(rawProposal);
    rawProposal.validation = validation;

    return rawProposal;
  }

  /**
   * Regenerates a single section (explanation, learning objectives, quiz, or visual activity)
   * while strictly preserving all other concepts, dependencies, and previous human edits.
   */
  static async regenerateSection(
    request: SectionRegenRequest,
    currentProposal: AIGenerationProposal
  ): Promise<AIGenerationProposal> {
    const updated: AIGenerationProposal = JSON.parse(JSON.stringify(currentProposal));
    const targetConcept = updated.concepts.find((c) => c.tempId === request.tempConceptId);

    if (!targetConcept) {
      throw new Error(`Target concept ${request.tempConceptId} not found in proposal.`);
    }

    const level = request.targetLevel || targetConcept.difficultyLevel;

    switch (request.section) {
      case 'explanation':
        targetConcept.explanation = this.generateAlternativeExplanation(targetConcept.title, level);
        targetConcept.reviewStatus = 'modified';
        targetConcept.factualReviewNeeded = true;
        break;

      case 'learningObjectives':
        targetConcept.learningObjectives = this.generateAlternativeObjectives(targetConcept.title, level);
        targetConcept.reviewStatus = 'modified';
        break;

      case 'knowledgeCheck':
        targetConcept.knowledgeCheck = this.generateAlternativeQuiz(targetConcept.title, level);
        targetConcept.reviewStatus = 'modified';
        break;

      case 'activity':
        // Suggest alternative compatible activity
        const newRes = this.generateAlternativeResource(targetConcept.tempId, targetConcept.title, level);
        // Replace existing resource for this concept
        updated.resources = updated.resources.filter((r) => !r.associatedTempIds.includes(targetConcept.tempId));
        updated.resources.push(newRes);
        break;
    }

    // Re-verify after section update
    updated.validation = AIVerifier.verifyProposal(updated);
    return updated;
  }

  // --- Curriculum Synthesis Engine (Deterministic & AI Fallback) ---

  private static inferSubjectCategory(topic: string): SubjectCategory {
    const t = topic.toLowerCase();
    if (t.includes('tree') || t.includes('sort') || t.includes('algorithm') || t.includes('code') || t.includes('graph')) {
      return 'formal_sciences';
    }
    if (t.includes('circuit') || t.includes('logic') || t.includes('voltage') || t.includes('electronics')) {
      return 'engineering';
    }
    if (t.includes('history') || t.includes('philosophy') || t.includes('art')) {
      return 'humanities';
    }
    return 'natural_sciences';
  }

  private static synthesizeCurriculum(
    topic: string,
    category: SubjectCategory,
    level: LearnerLevel,
    depth: 'compact' | 'standard' | 'deep',
    scope: string
  ): AIGenerationProposal {
    const t = topic.toLowerCase();
    const now = Date.now();
    const proposalId = `ai_prop_${Date.now().toString(36)}`;

    // Special curated synthesis for high-demand STEM & CS topics
    if (t.includes('binary tree') || t.includes('bst')) {
      return this.generateBinaryTreeModule(proposalId, topic, category, level, now);
    }
    if (t.includes('induction') || t.includes('faraday') || t.includes('electromagnet')) {
      return this.generateElectromagneticInductionModule(proposalId, topic, category, level, now);
    }
    if (t.includes('fourier') || t.includes('wave') || t.includes('harmonic')) {
      return this.generateFourierHarmonicsModule(proposalId, topic, category, level, now);
    }

    // Generic rule-based parametric synthesizer for any user topic
    return this.generateGenericModule(proposalId, topic, category, level, depth, now);
  }

  // Curated Domain 1: Binary Search Trees
  private static generateBinaryTreeModule(
    id: string,
    topic: string,
    category: SubjectCategory,
    level: LearnerLevel,
    now: number
  ): AIGenerationProposal {
    const concepts: AIConceptProposal[] = [
      {
        tempId: 'prop_c_1',
        title: 'Tree Terminology & Node Hierarchy',
        explanation: 'A tree is a hierarchical non-linear data structure consisting of nodes connected by edges, starting from a single root node and branching to parent-child leaves.',
        learningObjectives: [
          'Identify root, internal nodes, leaves, and subtree structures',
          'Calculate tree height, depth, and node degrees',
        ],
        difficultyLevel: 'introductory',
        estimatedMinutes: 12,
        proposedPrerequisiteTempIds: [],
        suggestedVisualizations: ['diagram', 'note'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: 'In a tree data structure, what is a node called that has no child nodes?',
          options: ['Root node', 'Internal node', 'Leaf node', 'Subtree apex'],
          correctIndex: 2,
          explanation: 'A leaf node (or external node) is any node with zero child connections.',
          hint: 'Think of the end branches of a natural tree.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['Standard CS Curriculum: Data Structures & Algorithms'],
      },
      {
        tempId: 'prop_c_2',
        title: 'Binary Search Tree (BST) Invariant',
        explanation: 'The BST invariant states that for any node N, all keys in its left subtree are strictly less than N.key, and all keys in its right subtree are strictly greater.',
        learningObjectives: [
          'Formulate and verify the BST ordering property',
          'Trace in-order traversals yielding sorted key sequences',
        ],
        difficultyLevel: 'intermediate',
        estimatedMinutes: 16,
        proposedPrerequisiteTempIds: ['prop_c_1'],
        suggestedVisualizations: ['diagram', 'chart', 'note'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: 'What traversal order on a valid Binary Search Tree visits keys in strictly ascending numerical order?',
          options: ['Pre-order (Root-Left-Right)', 'In-order (Left-Root-Right)', 'Post-order (Left-Right-Root)', 'Level-order (BFS)'],
          correctIndex: 1,
          explanation: 'In-order traversal recursively visits the smaller left subtree, the current node, then the larger right subtree, outputting a monotonically increasing sequence.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['CLRS Introduction to Algorithms - Binary Search Trees'],
      },
      {
        tempId: 'prop_c_3',
        title: 'Search, Insertion & Time Complexity',
        explanation: 'BST search and insertion operate by comparing the target with current node keys, achieving O(log N) average time in balanced trees and O(N) worst-case in degenerate trees.',
        learningObjectives: [
          'Execute recursive search and insertion algorithms',
          'Contrast O(log N) balanced tree performance against O(N) degenerate chains',
        ],
        difficultyLevel: 'intermediate',
        estimatedMinutes: 20,
        proposedPrerequisiteTempIds: ['prop_c_2'],
        suggestedVisualizations: ['diagram', 'chart'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: 'What is the worst-case search time complexity of an unbalanced BST with N elements inserted in sorted order?',
          options: ['O(1)', 'O(log N)', 'O(N)', 'O(N²)'],
          correctIndex: 2,
          explanation: 'Inserting sorted items causes each node to have only a right child, degrading the BST into a linked list with linear O(N) search depth.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['CLRS Introduction to Algorithms - Chapter 12'],
      },
    ];

    const dependencies: AIDependencyProposal[] = [
      {
        sourceTempId: 'prop_c_1',
        dependentTempId: 'prop_c_2',
        rationale: 'Must understand general tree terminology before learning the specific BST ordering invariant.',
        strength: 'essential',
        status: 'proposed',
      },
      {
        sourceTempId: 'prop_c_2',
        dependentTempId: 'prop_c_3',
        rationale: 'BST search algorithms require applying the invariant at each step.',
        strength: 'essential',
        status: 'proposed',
      },
    ];

    const resources: AIResourceProposal[] = [
      {
        tempId: 'prop_res_1',
        associatedTempIds: ['prop_c_1', 'prop_c_2'],
        resourceType: 'diagram',
        title: 'BST Node Hierarchy & Pointer Map',
        description: 'Interactive diagram mapping parent pointers and left/right child pointers.',
        requiredCapability: '2d.whiteboard',
        capabilityStatus: 'available',
        isSupported: true,
        status: 'proposed',
      },
      {
        tempId: 'prop_res_2',
        associatedTempIds: ['prop_c_3'],
        resourceType: 'diagram',
        title: 'O(log N) vs O(N) Degeneration Graph',
        description: 'Visual comparison between balanced binary tree height and degenerate linear tree chains.',
        requiredCapability: '2d.whiteboard',
        capabilityStatus: 'available',
        isSupported: true,
        status: 'proposed',
      },
    ];

    const proposal: AIGenerationProposal = {
      proposalId: id,
      topicTitle: topic,
      subjectCategory: category,
      subjectDisplayName: 'Computer Science & Data Structures',
      intendedAudience: `${level.toUpperCase()} Computer Science Students`,
      generatedAt: now,
      provider: 'deterministic_fallback',
      isDemoContent: true,
      concepts,
      dependencies,
      resources,
      assumptionsAndLimitations: [
        'Assumes standard memory pointer references without disk paging.',
        'Balanced self-balancing trees (AVL / Red-Black) are covered in downstream advanced modules.',
      ],
      validation: { isValid: true, layerA_Schema: { passed: true, issues: [] }, layerB_Referential: { passed: true, issues: [] }, layerC_Graph: { passed: true, hasCycles: false, issues: [] }, layerD_Capabilities: { passed: true, supportedCount: 2, unsupportedCount: 0, issues: [] }, layerE_Assessment: { passed: true, questionsValidated: 3, issues: [] }, layerF_FactualReview: { requiresReviewCount: 0, notice: 'Domain verified' }, diagnostics: [] },
    };

    return proposal;
  }

  // Curated Domain 2: Electromagnetic Induction
  private static generateElectromagneticInductionModule(
    id: string,
    topic: string,
    category: SubjectCategory,
    level: LearnerLevel,
    now: number
  ): AIGenerationProposal {
    const concepts: AIConceptProposal[] = [
      {
        tempId: 'prop_c_1',
        title: 'Magnetic Flux (Φ_B)',
        explanation: 'Magnetic flux measures the total magnetic field B passing through a given surface area A, defined as Φ_B = B · A · cos(θ).',
        learningObjectives: ['Calculate magnetic flux in Webers (Wb)', 'Analyze orientation angles relative to normal vectors'],
        difficultyLevel: 'introductory',
        estimatedMinutes: 14,
        proposedPrerequisiteTempIds: [],
        suggestedVisualizations: ['diagram', 'chart'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: 'When is magnetic flux through a flat coil of area A maximized in a uniform magnetic field B?',
          options: [
            'When field lines are parallel to the coil surface (θ = 90°)',
            'When field lines are perpendicular to the coil surface (θ = 0°)',
            'When the magnetic field strength is zero',
            'Flux does not depend on angle',
          ],
          correctIndex: 1,
          explanation: 'Flux Φ = B·A·cos(θ) is maximized when the surface normal is aligned with B (θ = 0°, cos(0°) = 1).',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['Halliday & Resnick - Fundamentals of Physics: Magnetism'],
      },
      {
        tempId: 'prop_c_2',
        title: "Faraday's Law of Induction",
        explanation: 'Faraday’s law states that the induced electromotive force (EMF) in a closed circuit is directly proportional to the time rate of change of magnetic flux: ε = -N (dΦ/dt).',
        learningObjectives: ['Compute induced voltage from fluctuating flux', 'Relate coil turns N to amplified EMF'],
        difficultyLevel: 'intermediate',
        estimatedMinutes: 18,
        proposedPrerequisiteTempIds: ['prop_c_1'],
        suggestedVisualizations: ['simulation', 'diagram'],
        requiredCapability: 'simulation.pendulum',
        knowledgeCheck: {
          question: 'If magnetic flux through a 100-turn coil changes by 0.05 Wb in 0.1 seconds, what is the magnitude of the induced EMF?',
          options: ['5 Volts', '50 Volts', '500 Volts', '0.5 Volts'],
          correctIndex: 1,
          explanation: '|ε| = N · (ΔΦ / Δt) = 100 · (0.05 / 0.1) = 100 · 0.5 = 50 V.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['Maxwell-Faraday Equation formulation'],
      },
      {
        tempId: 'prop_c_3',
        title: "Lenz's Law & Energy Conservation",
        explanation: 'The negative sign in Faraday’s law represents Lenz’s law: the direction of induced current creates an opposing magnetic field resisting the change in flux.',
        learningObjectives: ['Determine induced current direction using right-hand rule', 'Demonstrate how Lenz’s law upholds energy conservation'],
        difficultyLevel: 'intermediate',
        estimatedMinutes: 15,
        proposedPrerequisiteTempIds: ['prop_c_2'],
        suggestedVisualizations: ['diagram', 'note'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: 'Why does Lenz’s law require the induced magnetic field to oppose the change in magnetic flux?',
          options: [
            'To obey the conservation of energy and prevent runaway self-acceleration',
            'To eliminate electrical resistance in the wire',
            'To reverse gravitational acceleration',
            'Because magnetic monopoles always cancel',
          ],
          correctIndex: 0,
          explanation: 'If induced currents reinforced the flux change, infinite energy could be extracted from a moving magnet without doing mechanical work, violating the First Law of Thermodynamics.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
        sources: ['Standard Classical Electrodynamics'],
      },
    ];

    const dependencies: AIDependencyProposal[] = [
      {
        sourceTempId: 'prop_c_1',
        dependentTempId: 'prop_c_2',
        rationale: 'Understanding magnetic flux is essential before calculating the time derivative of flux in Faraday’s Law.',
        strength: 'essential',
        status: 'proposed',
      },
      {
        sourceTempId: 'prop_c_2',
        dependentTempId: 'prop_c_3',
        rationale: 'Lenz’s law directly explains the physical meaning of the negative sign in Faraday’s equation.',
        strength: 'essential',
        status: 'proposed',
      },
    ];

    const resources: AIResourceProposal[] = [
      {
        tempId: 'prop_res_1',
        associatedTempIds: ['prop_c_2'],
        resourceType: 'simulation',
        title: 'Oscillating Flux & Harmonic Telemetry Simulation',
        description: 'Simulate sinusoidal flux variation dΦ/dt and measure the resulting induced EMF curve.',
        requiredCapability: 'simulation.pendulum',
        capabilityStatus: 'available',
        isSupported: true,
        status: 'proposed',
      },
    ];

    return {
      proposalId: id,
      topicTitle: topic,
      subjectCategory: category,
      subjectDisplayName: 'Physics & Electromagnetism',
      intendedAudience: `${level.toUpperCase()} Physics Students`,
      generatedAt: now,
      provider: 'deterministic_fallback',
      isDemoContent: true,
      concepts,
      dependencies,
      resources,
      assumptionsAndLimitations: [
        'Neglects relativistic electrodynamics and high-frequency radiation damping.',
        'Assumes quasi-static electromagnetic fields.',
      ],
      validation: { isValid: true, layerA_Schema: { passed: true, issues: [] }, layerB_Referential: { passed: true, issues: [] }, layerC_Graph: { passed: true, hasCycles: false, issues: [] }, layerD_Capabilities: { passed: true, supportedCount: 1, unsupportedCount: 0, issues: [] }, layerE_Assessment: { passed: true, questionsValidated: 3, issues: [] }, layerF_FactualReview: { requiresReviewCount: 0, notice: 'Domain verified' }, diagnostics: [] },
    };
  }

  // Curated Domain 3: Fourier Analysis & Wave Harmonics
  private static generateFourierHarmonicsModule(
    id: string,
    topic: string,
    category: SubjectCategory,
    level: LearnerLevel,
    now: number
  ): AIGenerationProposal {
    const concepts: AIConceptProposal[] = [
      {
        tempId: 'prop_c_1',
        title: 'Periodic Waveforms & Orthogonal Bases',
        explanation: 'Any continuous periodic function f(t) with period T can be decomposed into a linear combination of orthogonal sine and cosine basis harmonics.',
        learningObjectives: ['Define wave period T and fundamental frequency f₀', 'Verify inner product orthogonality of sinusoids'],
        difficultyLevel: 'introductory',
        estimatedMinutes: 15,
        proposedPrerequisiteTempIds: [],
        suggestedVisualizations: ['diagram', 'chart'],
        requiredCapability: 'math.coordinate_graph',
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
      },
      {
        tempId: 'prop_c_2',
        title: 'Fourier Series Coefficients (a_n, b_n)',
        explanation: 'Fourier coefficients represent the spectral weight of each harmonic frequency, computed via definite integral projections over one period.',
        learningObjectives: ['Integrate harmonic projections over period T', 'Synthesize square and sawtooth waves from infinite series'],
        difficultyLevel: 'intermediate',
        estimatedMinutes: 20,
        proposedPrerequisiteTempIds: ['prop_c_1'],
        suggestedVisualizations: ['chart', 'simulation'],
        requiredCapability: 'simulation.pendulum',
        knowledgeCheck: {
          question: 'What happens to the Fourier series approximation of a discontinuous square wave as the number of harmonics approaches infinity?',
          options: [
            'It converges pointwise everywhere except for Gibbs phenomenon overshoots at discontinuities',
            'It collapses to zero',
            'It turns into a single pure DC sine wave',
            'Coefficients grow exponentially without bound',
          ],
          correctIndex: 0,
          explanation: 'The Fourier series converges in L² norm, but exhibits the Gibbs phenomenon (~9% overshoot) near sharp jump discontinuities.',
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: false,
      },
    ];

    const dependencies: AIDependencyProposal[] = [
      {
        sourceTempId: 'prop_c_1',
        dependentTempId: 'prop_c_2',
        rationale: 'Harmonic decomposition requires understanding orthogonal basis functions.',
        strength: 'essential',
        status: 'proposed',
      },
    ];

    const resources: AIResourceProposal[] = [
      {
        tempId: 'prop_res_1',
        associatedTempIds: ['prop_c_1', 'prop_c_2'],
        resourceType: 'graph',
        title: 'Harmonic Synthesis Waveform Viewer',
        description: 'Sum individual Fourier harmonics and observe convergence to target waveforms in real time.',
        requiredCapability: 'math.coordinate_graph',
        capabilityStatus: 'available',
        isSupported: true,
        status: 'proposed',
      },
    ];

    return {
      proposalId: id,
      topicTitle: topic,
      subjectCategory: category,
      subjectDisplayName: 'Mathematics & Signal Processing',
      intendedAudience: `${level.toUpperCase()} Mathematics & Engineering Students`,
      generatedAt: now,
      provider: 'deterministic_fallback',
      isDemoContent: true,
      concepts,
      dependencies,
      resources,
      assumptionsAndLimitations: ['Assumes Dirichlet conditions for piecewise continuous functions.'],
      validation: { isValid: true, layerA_Schema: { passed: true, issues: [] }, layerB_Referential: { passed: true, issues: [] }, layerC_Graph: { passed: true, hasCycles: false, issues: [] }, layerD_Capabilities: { passed: true, supportedCount: 1, unsupportedCount: 0, issues: [] }, layerE_Assessment: { passed: true, questionsValidated: 1, issues: [] }, layerF_FactualReview: { requiresReviewCount: 0, notice: 'Domain verified' }, diagnostics: [] },
    };
  }

  // Generic Parametric Generator for Any Custom Topic
  private static generateGenericModule(
    id: string,
    topic: string,
    category: SubjectCategory,
    level: LearnerLevel,
    depth: 'compact' | 'standard' | 'deep',
    now: number
  ): AIGenerationProposal {
    const conceptCount = depth === 'compact' ? 2 : depth === 'deep' ? 4 : 3;
    const concepts: AIConceptProposal[] = [];
    const dependencies: AIDependencyProposal[] = [];

    // Concept 1: Foundations
    concepts.push({
      tempId: 'prop_c_1',
      title: `${topic}: Core Foundations & Definitions`,
      explanation: `Foundational overview of ${topic}, defining governing principles, standard terminology, and core analytical frameworks.`,
      learningObjectives: [
        `Define fundamental terms and notations for ${topic}`,
        `Identify primary structural components and rules`,
      ],
      difficultyLevel: level,
      estimatedMinutes: 12,
      proposedPrerequisiteTempIds: [],
      suggestedVisualizations: ['diagram', 'note'],
      requiredCapability: '2d.whiteboard',
      knowledgeCheck: {
        question: `What is the primary governing principle of ${topic}?`,
        options: [
          `Fundamental rule established in theoretical definitions of ${topic}`,
          `Secondary auxiliary approximation`,
          `Unrelated physical constant`,
          `Non-standard alternative hypothesis`,
        ],
        correctIndex: 0,
        explanation: `Core definitions and axioms establish the formal foundation of ${topic}.`,
        hint: `Review the foundational definitions section.`,
      },
      reviewStatus: 'unreviewed',
      factualReviewNeeded: true,
    });

    // Concept 2: Mechanisms & Dynamics
    if (conceptCount >= 2) {
      concepts.push({
        tempId: 'prop_c_2',
        title: `${topic}: Mechanisms & Operational Dynamics`,
        explanation: `Detailed analysis of internal interactions, parameter dependencies, and dynamic behavior within ${topic}.`,
        learningObjectives: [
          `Analyze interaction mechanisms between key variables`,
          `Evaluate cause-and-effect relationships during state transitions`,
        ],
        difficultyLevel: level === 'introductory' ? 'intermediate' : level,
        estimatedMinutes: 18,
        proposedPrerequisiteTempIds: ['prop_c_1'],
        suggestedVisualizations: ['diagram', 'chart'],
        requiredCapability: '2d.whiteboard',
        knowledgeCheck: {
          question: `When exploring the dynamics of ${topic}, how do changes in parameters influence system behavior?`,
          options: [
            `Parameters govern response rate and steady-state equilibrium`,
            `Parameters have zero influence on internal states`,
            `Behavior is completely nondeterministic`,
            `Only external inputs matter`,
          ],
          correctIndex: 0,
          explanation: `System equations for ${topic} link input parameters directly to measured output states.`,
        },
        reviewStatus: 'unreviewed',
        factualReviewNeeded: true,
      });

      dependencies.push({
        sourceTempId: 'prop_c_1',
        dependentTempId: 'prop_c_2',
        rationale: `Foundations of ${topic} are essential before examining dynamic interactions.`,
        strength: 'essential',
        status: 'proposed',
      });
    }

    // Concept 3: Applications & Synthesis
    if (conceptCount >= 3) {
      concepts.push({
        tempId: 'prop_c_3',
        title: `${topic}: Practical Synthesis & Real-World Applications`,
        explanation: `Synthesize theoretical mechanisms of ${topic} to solve applied problems, engineering constraints, and real-world edge cases.`,
        learningObjectives: [
          `Apply theoretical formulas of ${topic} to target problem sets`,
          `Optimize performance constraints and troubleshoot boundary conditions`,
        ],
        difficultyLevel: 'advanced',
        estimatedMinutes: 22,
        proposedPrerequisiteTempIds: ['prop_c_2'],
        suggestedVisualizations: ['diagram', 'chart', 'note'],
        requiredCapability: '2d.whiteboard',
        reviewStatus: 'unreviewed',
        factualReviewNeeded: true,
      });

      dependencies.push({
        sourceTempId: 'prop_c_2',
        dependentTempId: 'prop_c_3',
        rationale: `Operational dynamics must be mastered before tackling complex real-world synthesis.`,
        strength: 'essential',
        status: 'proposed',
      });
    }

    const resources: AIResourceProposal[] = [
      {
        tempId: 'prop_res_1',
        associatedTempIds: ['prop_c_1'],
        resourceType: 'diagram',
        title: `${topic} Conceptual Architecture Diagram`,
        description: `Visual map depicting core components and structural hierarchy of ${topic}.`,
        requiredCapability: '2d.whiteboard',
        capabilityStatus: 'available',
        isSupported: true,
        status: 'proposed',
      },
    ];

    return {
      proposalId: id,
      topicTitle: topic,
      subjectCategory: category,
      subjectDisplayName: topic,
      intendedAudience: `${level.toUpperCase()} Students`,
      generatedAt: now,
      provider: 'deterministic_fallback',
      isDemoContent: true,
      concepts,
      dependencies,
      resources,
      assumptionsAndLimitations: [
        `Generated via VisiOS AI Assistant template. Requires educator review before publication.`,
      ],
      validation: { isValid: true, layerA_Schema: { passed: true, issues: [] }, layerB_Referential: { passed: true, issues: [] }, layerC_Graph: { passed: true, hasCycles: false, issues: [] }, layerD_Capabilities: { passed: true, supportedCount: 1, unsupportedCount: 0, issues: [] }, layerE_Assessment: { passed: true, questionsValidated: 2, issues: [] }, layerF_FactualReview: { requiresReviewCount: concepts.length, notice: 'Pending human educator verification.' }, diagnostics: [] },
    };
  }

  // Section-level regeneration helpers
  private static generateAlternativeExplanation(title: string, level: LearnerLevel): string {
    if (level === 'introductory') {
      return `Simplified Explanation: At its core, "${title}" can be thought of through an intuitive analogy. We break down the complex notation into plain-language steps, focusing on what happens step by step without overwhelming algebraic overhead.`;
    } else if (level === 'advanced') {
      return `Rigorous Formulation: "${title}" is formally derived from first principles. We evaluate asymptotic behavior, boundary stability conditions, mathematical invariants, and quantitative error bounds.`;
    }
    return `Standard Comprehensive Formulation: "${title}" connects theoretical foundations with empirical observations, balancing mathematical rigor with practical conceptual illustrations.`;
  }

  private static generateAlternativeObjectives(title: string, level: LearnerLevel): string[] {
    return [
      `Analyze the core governing mechanics of ${title}`,
      `Derive and evaluate key equations and parameter dependencies`,
      `Formulate testable predictions and troubleshoot anomalous edge cases`,
    ];
  }

  private static generateAlternativeQuiz(title: string, level: LearnerLevel) {
    return {
      question: `In the context of "${title}", which statement best characterizes its fundamental operational behavior?`,
      options: [
        `It maintains consistent invariant conditions across valid state transformations`,
        `It operates independently of any input boundary conditions`,
        `It behaves randomly without governing rules`,
        `It violates energy and informational conservation laws`,
      ],
      correctIndex: 0,
      explanation: `System invariants in ${title} guarantee predictable state progression under valid boundary conditions.`,
      hint: `Think about conservation laws and system invariants.`,
    };
  }

  private static generateAlternativeResource(
    conceptId: string,
    title: string,
    level: LearnerLevel
  ): AIResourceProposal {
    return {
      tempId: `res_alt_${Date.now().toString(36)}`,
      associatedTempIds: [conceptId],
      resourceType: 'diagram',
      title: `${title} Interactive Concept Diagram`,
      description: `Updated schematic visual representation for ${title}.`,
      requiredCapability: '2d.whiteboard',
      capabilityStatus: 'available',
      isSupported: true,
      status: 'proposed',
    };
  }
}
