import { BoardObjectContext, GuidedExplorationResponse } from '@/types/intelligence';

export class LearningIntelligenceService {
  /**
   * Generates a context-aware educational explanation, follow-up recommendations,
   * and knowledge checks based on real board data and actual simulation outputs.
   */
  static async explainContext(
    context: BoardObjectContext,
    studentQuestion?: string
  ): Promise<GuidedExplorationResponse> {
    // 0. Mathematical Formula or Board Feed Identity (Highest Priority)
    if (context.type === 'formula' && context.recognizedFormula) {
      const f = context.recognizedFormula;
      const study = f.studyGuide || {
        intuition: 'Connect symbolic representation with geometric or physical relationships for deep retention.',
        prerequisites: ['Basic Algebraic Operations', 'Area Principles'],
        realWorldApplication: 'Applied in engineering calculations, statistics, and computational modeling.',
      };

      return {
        summary: `Identified Topic / Identity: "${f.normalizedFormula}". Solution: "${f.solvedResult}".\n\n📌 Intuition: ${study.intuition}`,
        keyConcepts: [
          `1. How to Study: ${study.intuition}`,
          `2. Prerequisites: ${study.prerequisites.join(' • ')}`,
          `3. Real-World Value: ${study.realWorldApplication}`,
          `4. Mathematical Identity: ${f.normalizedFormula} ≡ ${f.solvedResult}`,
          `5. Visual Model: ${f.geometricProofSummary}`,
        ],
        stepByStep: f.algebraicSteps,
        simulationInsights: f.hasInteractiveAnimation
          ? `Interactive Geometric Proof is active. Adjust variables (a) and (b) using the interactive sliders to observe the visual area dissection dynamically verify the formula.`
          : `Visual Model: ${f.geometricProofSummary}`,
        suggestedQuestions: [
          `How is "${f.normalizedFormula}" derived step-by-step from first principles?`,
          `What is the geometric or physical intuition behind ${f.solvedResult}?`,
          `Where is this formula applied in real-world technology and engineering?`,
          `How can we stamp this complete proof and solution directly onto the whiteboard?`,
        ],
        recommendedAction: {
          label: 'Stamp Proof onto Whiteboard',
          actionType: 'highlight',
        },
        knowledgeCheck: {
          id: `check-${f.topic}-${f.normalizedFormula.replace(/[^a-z0-9]/gi, '_')}`,
          question: `In the mathematical derivation of ${f.normalizedFormula} = ${f.solvedResult}, which principle guarantees equality?`,
          options: [
            'Conservation of area and the distributive law of algebra',
            'Rounding to the nearest integer',
            'Ignoring cross terms when calculating squares',
            'Arbitrary definition without proof',
          ],
          correctIndex: 0,
          explanation: `The identity ${f.normalizedFormula} = ${f.solvedResult} is rigorously proven both algebraically through the distributive property and geometrically through area conservation.`,
          hint: 'Consider how polynomials expand and how geometric areas cannot simply vanish.',
        },
      };
    }


    // 1. Simulation Context (Nonlinear Physics Pendulum)
    if (context.type === 'simulation') {
      const g = context.simulationMetrics?.gravity ?? 9.81;
      const L = context.simulationMetrics?.length ?? 2.0;
      const period = context.simulationMetrics?.period ?? 2.84;
      const damping = context.simulationMetrics?.damping ?? 0.04;

      return {
        summary: `This is an active physical pendulum governed by gravitational torque and inertia. With length L = ${L.toFixed(1)}m and gravity g = ${g.toFixed(2)} m/s², the oscillation period is measured at T ≈ ${period.toFixed(2)}s.`,
        keyConcepts: [
          `Period Equation: T = 2π√(L/g) (Harmonic fundamental)`,
          `Energy Conservation: Continuous exchange between Potential Energy (mgh at max swing) and Kinetic Energy (½mv² at center).`,
          `Damping Factor: b = ${damping} simulates air resistance dissipation over time.`,
        ],
        stepByStep: [
          `1. Restoring Force: Gravity acts downward on the mass; the tangential component F = -mg·sin(θ) accelerates the bob back toward vertical equilibrium.`,
          `2. Inertia: When passing vertical θ = 0°, potential energy is minimum, velocity is maximum, and inertia carries the bob upward to opposite amplitude.`,
          `3. Period Invariance: Notice that theoretical oscillation period depends strictly on length L and gravity g, not the bob's mass.`,
        ],
        simulationInsights: `Actual measured period in this simulation is ${period.toFixed(2)} seconds. If you test on Jupiter (g = 24.79 m/s²), the period drops to ${(2 * Math.PI * Math.sqrt(L / 24.79)).toFixed(2)}s because stronger gravity pulls the bob faster. On the Moon (g = 1.62 m/s²), the period increases to ${(2 * Math.PI * Math.sqrt(L / 1.62)).toFixed(2)}s.`,
        suggestedQuestions: [
          'What happens to the swing frequency if we quadruple the length (L = 8m)?',
          'Why does a pendulum in Zero-G (g = 0) fail to oscillate without an external force?',
          'How does high initial angle (θ > 60°) introduce nonlinear anharmonic behavior?',
        ],
        recommendedAction: {
          label: 'Test Moon Gravity (g = 1.62 m/s²)',
          actionType: 'experiment',
          paramUpdates: { gravity: 1.62 },
        },
        knowledgeCheck: {
          id: 'pendulum-check-1',
          question: 'If you double the length of this pendulum from 2.0m to 8.0m (4× increase), what happens to its period T?',
          options: [
            'Period is halved (T becomes 0.5×)',
            'Period doubles (T becomes 2×)',
            'Period quadruples (T becomes 4×)',
            'Period remains identical',
          ],
          correctIndex: 1,
          explanation: 'Because T = 2π√(L/g), period is proportional to the square root of length (√4 = 2). Quadrupling length doubles the period.',
          hint: 'Look at the square root relationship T ∝ √L.',
        },
      };
    }

    // 2. Interactive 3D Model Context (Human Heart 3D)
    if (context.type === 'model3d') {
      const isPulsing = context.simulationMetrics?.isPulsing ?? true;

      return {
        summary: `The human heart is a four-chambered muscular organ operating as a synchronized dual-pump system for systemic and pulmonary blood circulation.`,
        keyConcepts: [
          `Cardiac Cycle: Alternates between Systole (muscular contraction pumping blood) and Diastole (ventricular filling).`,
          `Double Circulation: Right side drives deoxygenated blood to lungs; Left side pumps oxygenated blood through the Aorta to the body.`,
          `Aortic Arch: Elastic conduit with three arterial branches providing oxygenated blood to brain and upper limbs.`,
        ],
        stepByStep: [
          `1. Venous Return: Deoxygenated blood returns via the Vena Cava into the Right Atrium, then passes through the tricuspid valve into the Right Ventricle.`,
          `2. Pulmonary Circuit: The Right Ventricle pumps blood into the Pulmonary Trunk towards the lungs for oxygenation and CO₂ exchange.`,
          `3. Systemic Pumping: Oxygen-rich blood returns to the Left Atrium, enters the thick-walled Left Ventricle, and is forcefully ejected into the Aorta at high systolic pressure (~120 mmHg).`,
        ],
        simulationInsights: `Active 3D cardiac pulse is currently ${isPulsing ? 'ON (~72 BPM)' : 'PAUSED'}. Notice the Left Ventricle myocardium is ~3× thicker than the right ventricle due to the higher resistance of systemic vascular circulation.`,
        suggestedQuestions: [
          'Why does the left ventricle have much thicker muscular walls than the right ventricle?',
          'What is the function of the 3 branching arteries on the aortic arch?',
          'How do heart valves prevent retrograde (backward) blood flow during ventricular systole?',
        ],
        recommendedAction: {
          label: 'Inspect Aortic Arch Branching',
          actionType: 'zoomTo',
        },
        knowledgeCheck: {
          id: 'heart-check-1',
          question: 'Which chamber of the heart generates the highest pressure to pump oxygenated blood through the aorta to the entire body?',
          options: [
            'Right Atrium',
            'Right Ventricle',
            'Left Atrium',
            'Left Ventricle',
          ],
          correctIndex: 3,
          explanation: 'The Left Ventricle has the thickest muscular myocardium because it must generate enough systolic pressure (~120 mmHg) to push blood throughout the entire systemic circulatory system.',
          hint: 'Think about which chamber is connected directly to the Aortic Arch.',
        },
      };
    }

    // 3. Text Notes & General Concept Nodes
    if (context.type === 'text' || context.type === 'note') {
      const text = context.metadata?.text || context.title;
      return {
        summary: `Concept Node: "${text}". Learning notes organize core principles into structured conceptual schemas for long-term retention.`,
        keyConcepts: [
          `Conceptual Structuring: Grouping definitions alongside visual diagrams boosts dual-coding comprehension.`,
          `Active Recall: Connecting this note to interactive simulations tests theoretical formulas against live behavior.`,
        ],
        stepByStep: [
          `1. Synthesis: Relate the key terms in this note to other shapes and models on your canvas.`,
          `2. Exploration: Use connecting arrows to establish causal relationships (e.g. Cause → Effect).`,
        ],
        suggestedQuestions: [
          'How can this concept be verified with a 2D/3D visual demonstration?',
          'What are the foundational prerequisite equations or principles for this topic?',
        ],
        knowledgeCheck: {
          id: 'note-check-1',
          question: `In visual learning theory, why is connecting textual notes with interactive visual diagrams effective?`,
          options: [
            'It enables dual-coding in cognitive memory networks',
            'It replaces the need to understand formulas',
            'It prevents the board from needing autosave',
            'It eliminates physical friction',
          ],
          correctIndex: 0,
          explanation: 'Dual-coding theory shows that processing information through both verbal/textual and visual channels enhances cognitive encoding and recall.',
        },
      };
    }

    // 4. Default Topic / Workspace Level Context
    return {
      summary: `Visual Learning Workspace: "${context.title}". This digital operating system allows you to build multi-dimensional study canvases combining text, vector geometry, 3D anatomy, and physics simulations.`,
      keyConcepts: [
        `Interactive Canvas: Infinite coordinate board with Focus and Immersive spatial modes.`,
        `Multi-Modal Objects: Coexistence of 2D diagrams, 3D anatomical models, and live numerical physics simulations.`,
      ],
      stepByStep: [
        `1. Select any object on the canvas (Note, Shape, 3D Heart, or Physics Pendulum) to view deep context-aware insights.`,
        `2. Use Left Toolbar tools to add interactive models and observe real physical equations in action.`,
      ],
      suggestedQuestions: [
        'How does changing parameters in a simulation illustrate theoretical physics principles?',
        'How do 3D anatomical models aid in understanding spatial organ structures?',
      ],
      knowledgeCheck: {
        id: 'workspace-check-1',
        question: 'What is the primary advantage of combining interactive simulations and 3D models on the same whiteboard canvas?',
        options: [
          'Students can experiment with variables and observe real-time cause and effect directly beside their notes',
          'It replaces the need for mathematics',
          'It makes the screen run without WebGL',
          'It turns the board into a standard video player',
        ],
        correctIndex: 0,
        explanation: 'Unified multi-modal canvases allow students to test theoretical notes against live numerical simulations and 3D spatial models in one shared workspace.',
      },
    };
  }
}

