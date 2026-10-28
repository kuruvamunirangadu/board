import { VisualizationPlan, RendererType, InputInterpretation } from './types';

export class VisualizationPlanner {
  /**
   * Plans an educational visual model tailored specifically to the subject
   * rather than forcing everything into a pendulum or oscillator.
   */
  static plan(interpretation: InputInterpretation): VisualizationPlan {
    const category = interpretation.category;
    const lower = interpretation.originalInput.toLowerCase();

    // 1. Newton's 2nd Law: F = ma
    if (category === 'physics' && (lower.includes('f = ma') || lower.includes('f=ma') || lower.includes('newton'))) {
      return {
        rendererType: 'physics_vector_simulator',
        title: 'Force-Mass Dynamic Acceleration Model',
        description:
          'Interactive mechanical cart showing applied horizontal Force vector F, inertial mass block m, and resulting acceleration vector a.',
        learningObjective:
          'Observe that doubling Force doubles Acceleration (linear relationship), while doubling Mass halves Acceleration (inverse relationship).',
        activeVariables: ['F', 'm', 'a'],
        interactionsAvailable: [
          'Adjust Net Force slider (0 to 100 N)',
          'Adjust Mass slider (0.5 to 50 kg)',
          'Toggle Friction / Surface resistance',
          'Play / Pause motion animation',
        ],
        expectedBehavior:
          'Increasing Force elongates the cyan vector and accelerates the mass faster; increasing mass enlarges the block and reduces acceleration.',
        fallbackAvailable: true,
        modelConfig: { defaultForce: 10, defaultMass: 2 },
      };
    }

    // 1B. Pendulum Simulation
    if (lower.includes('pendulum')) {
      return {
        rendererType: 'pendulum_simulation',
        title: 'Simple & Nonlinear Harmonic Pendulum Simulation',
        description:
          'Interactive pendulum oscillation demonstrating period T = 2π√(L/g) and continuous energy exchange between kinetic and gravitational potential states.',
        learningObjective:
          'Observe that for small angles (θ < 15°), period is independent of mass and amplitude, governed solely by string length L and gravitational acceleration g.',
        activeVariables: ['L', 'g', 'theta', 'T'],
        interactionsAvailable: [
          'Adjust Pendulum String Length L (0.2 m to 3.0 m)',
          'Adjust Gravitational Acceleration g (Earth 9.81 m/s², Moon 1.62 m/s²)',
          'Set Initial Release Angle θ₀ (-45° to 45°)',
          'Toggle Damping Friction / Air Resistance',
          'Inspect Kinetic vs Potential Energy Phase Plot',
        ],
        expectedBehavior:
          'Lengthening string slows down oscillations; increasing gravity accelerates them; energy oscillates between maximum potential at endpoints and maximum kinetic at the nadir.',
        fallbackAvailable: true,
        modelConfig: { defaultLength: 1.0, defaultGravity: 9.81, defaultAngle: 15 },
      };
    }

    // 2. Kinematics: v = u + at
    if (category === 'physics' && (lower.includes('v = u + at') || lower.includes('v=u+at') || lower.includes('kinematic'))) {
      return {
        rendererType: 'function_coordinate_plotter',
        title: 'Velocity-Time Kinematic Phase Graph',
        description:
          'Real-time Cartesian graph plotting instantaneous velocity v(t) as a line with y-intercept u and slope a, shading displacement area underneath.',
        learningObjective:
          'Understand that acceleration is the geometric slope of the v-t graph, and total displacement s is the geometric area beneath the curve.',
        activeVariables: ['u', 'a', 't', 'v'],
        interactionsAvailable: [
          'Adjust Initial Velocity u',
          'Adjust Constant Acceleration a',
          'Slide elapsed time t scrub bar',
          'Inspect shaded trapezoid displacement area',
        ],
        expectedBehavior:
          'Positive acceleration tilts the line upward; negative acceleration tilts it downward; the shaded area under the line expands as t increases.',
        fallbackAvailable: true,
      };
    }

    // 2B. Transcendental & Trigonometric Curves: y = e^(cos(x)), y = cos(x), y = sin(x), y = cosx, y = sinx, y = e^x
    if (
      !lower.includes('law of cosine') &&
      !lower.includes('cosine rule') &&
      !lower.includes('triangle') &&
      (
        lower.includes('e^(cos(x))') ||
        lower.includes('e^cos(x)') ||
        lower.includes('exp(cos(x))') ||
        lower.includes('cos(x)') ||
        lower.includes('cosx') ||
        lower.includes('cos x') ||
        lower.includes('y=cos') ||
        lower.includes('y = cos') ||
        lower.includes('cosine') ||
        lower.includes('sin(x)') ||
        lower.includes('sinx') ||
        lower.includes('sin x') ||
        lower.includes('y=sin') ||
        lower.includes('y = sin') ||
        lower.includes('sine') ||
        lower.includes('tan(x)') ||
        lower.includes('tanx') ||
        lower.includes('e^x') ||
        lower.includes('exp(x)') ||
        lower.includes('exponential') ||
        lower.includes('curve') ||
        (lower.includes('e^') && (lower.includes('cos') || lower.includes('sin')))
      )
    ) {
      return {
        rendererType: 'function_coordinate_plotter',
        title: interpretation.title || 'Cartesian Coordinate Curve Plotter',
        description: `Real-time 2D Cartesian plane plotting ${interpretation.normalizedInput || 'y = f(x)'} with continuous probe traversal and period inspection.`,
        learningObjective: 'Observe continuous periodic oscillation, domain, range bounds, and rate of change along the coordinate plane.',
        activeVariables: ['x', 'y'],
        interactionsAvailable: [
          'Drag coordinate probe x across the domain',
          'Inspect instantaneous y value and local extrema',
          'Toggle coordinate axes and grid',
        ],
        expectedBehavior: 'Probe dot tracks continuously along the mathematical curve.',
        fallbackAvailable: true,
      };
    }

    // 2C. Linear Function / Coordinate Geometry: y = mx + c
    if (
      !lower.includes('cos') &&
      !lower.includes('sin') &&
      !lower.includes('^') &&
      !lower.includes('e^') &&
      (
        lower.includes('y=mx+c') ||
        lower.includes('y = mx + c') ||
        lower.includes('y=mx+b') ||
        lower.includes('y = mx + b') ||
        lower.includes('slope intercept') ||
        lower.includes('linear function') ||
        lower.includes('linear equation') ||
        (lower.includes('graph') && (lower.includes('mx') || lower.includes('slope') || (lower.includes('y=') && lower.includes('x')))) ||
        ((lower.includes('line') || lower.includes('slope')) && (lower.includes('intercept') || lower.includes('gradient')))
      )
    ) {
      return {
        rendererType: 'function_coordinate_plotter',
        title: 'Cartesian Coordinate Linear Plotter: y = mx + c',
        description:
          'Real-time 2D Cartesian coordinate plane plotting straight line y = mx + c with slope triangle (rise/run) and y-intercept (0, c).',
        learningObjective:
          'Observe that slope m dictates the tilt and steepness of the line, while intercept c shifts the line vertically along the y-axis without altering its slope.',
        activeVariables: ['m', 'c', 'x', 'y'],
        interactionsAvailable: [
          'Adjust Slope m slider (-5 to +5)',
          'Adjust Y-Intercept c slider (-10 to +10)',
          'Drag coordinate probe x across the domain',
          'Toggle Rise/Run rate triangle overlay',
        ],
        expectedBehavior:
          'Increasing m tilts the line steeper; negative m produces a descending line; altering c translates the line vertically while remaining parallel.',
        fallbackAvailable: true,
      };
    }

    // 2C. Fractions & Rational Numbers
    if (
      lower === 'fraction' ||
      lower === 'fractions' ||
      lower.includes('rational number') ||
      lower.includes('equivalent fraction') ||
      lower.includes('numerator') ||
      lower.includes('denominator')
    ) {
      return {
        rendererType: 'formula_geometric_dissection',
        title: 'Fraction Partition & Area Dissection Model',
        description:
          'Geometric unit disk and rectangular tape partitioned into equal parts showing numerator count over denominator total.',
        learningObjective:
          'Understand that the denominator divides the whole into equal pieces, while the numerator enumerates selected pieces; visualize fraction equivalence and arithmetic.',
        activeVariables: ['a', 'b'],
        interactionsAvailable: [
          'Adjust Numerator (a) slider',
          'Adjust Denominator (b) slider',
          'Toggle between circle/disk and strip/tape visual representations',
          'Show equivalent fraction scaling',
        ],
        expectedBehavior:
          'Increasing the denominator slices the unit into finer sub-pieces; increasing numerator fills in more shaded segments.',
        fallbackAvailable: true,
      };
    }

    // 3. Trigonometry / Calculus: y = sin(x)
    if (category === 'calculus' && (lower.includes('sin') || lower.includes('wave') || lower.includes('periodic'))) {
      return {
        rendererType: 'function_coordinate_plotter',
        title: 'Harmonic Sine Wave & Tangent Derivative Plotter',
        description:
          'Continuous sinusoidal curve with dynamic probe point x showing instantaneous value y = sin(x) and tangent line derivative slope dy/dx = cos(x).',
        learningObjective:
          'Connect the geometry of circular rotation with the Cartesian sine wave and observe that the slope of sin(x) at any point equals cos(x).',
        activeVariables: ['x', 'A', 'f', 'y'],
        interactionsAvailable: [
          'Scrub probe angle x along [-2π, 2π]',
          'Adjust wave Amplitude A (vertical stretch)',
          'Adjust Frequency f (horizontal compression)',
          'Toggle tangent line derivative vector',
        ],
        expectedBehavior:
          'When the wave reaches crest (+1) or trough (-1), the tangent slope becomes flat (dy/dx = 0); when crossing zero, the slope is steepest (±1).',
        fallbackAvailable: true,
      };
    }

    // 3B. Law of Cosines: c² = a² + b² - 2ab cos(C)
    if (
      lower.includes('law of cosine') ||
      lower.includes('cosine rule') ||
      lower.includes('c^2 = a^2 + b^2 - 2ab') ||
      lower.includes('c^2=a^2+b^2-2ab') ||
      lower.includes('c2 = a2 + b2 - 2ab') ||
      (lower.includes('cosine') && (lower.includes('triangle') || lower.includes('law')))
    ) {
      return {
        rendererType: 'geometric_triangle_construction',
        title: 'Euclidean Triangle & Law of Cosines Model',
        description:
          'Interactive dynamic triangle demonstrating how the square of opposite side c varies as a function of adjacent side lengths a, b, and interior angle C.',
        learningObjective:
          'Observe that when angle C = 90°, cos(90°) = 0, reducing the equation precisely to the Pythagorean theorem c² = a² + b²; when C < 90° (acute), c² < a² + b²; and when C > 90° (obtuse), c² > a² + b².',
        activeVariables: ['a', 'b', 'C', 'c'],
        interactionsAvailable: [
          'Adjust Side A slider (1 to 15)',
          'Adjust Side B slider (1 to 15)',
          'Adjust Interior Angle C slider (15° to 165°)',
          'Observe real-time 3D coordinate vector projection',
        ],
        expectedBehavior:
          'Increasing angle C pushes the opposite vertices apart and elongates side c, dynamically balancing c² = a² + b² - 2ab·cos(C).',
        fallbackAvailable: true,
      };
    }

    // 4. Pythagorean Theorem: a^2 + b^2 = c^2
    if (category === 'geometry' && lower.includes('pythagor')) {
      return {
        rendererType: 'geometric_triangle_construction',
        title: 'Euclidean Right Triangle & Area Conservation Model',
        description:
          'Dynamic right-angled triangle with square boxes drawn along all three sides, visually proving that Area(a²) + Area(b²) = Area(c²).',
        learningObjective:
          'Verify that no matter how leg lengths a and b vary, the combined area of squares on the legs exactly fills the square built on the hypotenuse.',
        activeVariables: ['a', 'b', 'c'],
        interactionsAvailable: [
          'Drag Leg A length slider',
          'Drag Leg B length slider',
          'Toggle unit square grid tiling',
          'Animate area rearrangement proof',
        ],
        expectedBehavior:
          'Changing leg lengths maintains the 90° right angle; the numerical sum of squares dynamically equals the square on the hypotenuse.',
        fallbackAvailable: true,
      };
    }

    // 5. Square of Difference: (a - b)^2
    if (category === 'algebra' && (lower.includes('a^2+b^2-2ab') || lower.includes('(a-b)^2') || lower.includes('square'))) {
      return {
        rendererType: 'formula_geometric_dissection',
        title: 'Interactive Geometric Area Dissection: (a - b)²',
        description:
          'Outer square of side a with two rectangular strips a × b subtracted and the overlapping corner b² restored to reveal (a - b)²',
        learningObjective:
          'Geometrically deconstruct why (a - b)² contains a +b² term despite subtraction (correcting for double-subtraction of the overlapping corner).',
        activeVariables: ['a', 'b'],
        interactionsAvailable: [
          'Adjust Outer Square Side a',
          'Adjust Subtracted Width b',
          'Step through 4-stage dissection playback',
          'Inspect color-coded region areas',
        ],
        expectedBehavior:
          'As b increases toward a, the remaining inner purple square shrinks, visually proving the identity for any positive values of a and b.',
        fallbackAvailable: true,
      };
    }

    // 6. Computer Science: Algorithms & Data Structures
    if (category === 'algorithm') {
      if (lower.includes('binary search')) {
        return {
          rendererType: 'algorithm_array_tracer',
          title: 'Logarithmic Array Search Visualizer',
          description:
            'Sorted array of cells with interactive low, mid, and high pointer arrows illustrating logarithmic interval halving.',
          learningObjective:
            'Understand how comparing the target with the midpoint eliminates half of the remaining search space on every step, yielding O(log n).',
          activeVariables: ['n', 'target', 'low', 'mid', 'high'],
          interactionsAvailable: [
            'Set custom target search number',
            'Step forward / backward through iterations',
            'Inspect array values and comparison results',
            'Observe search space reduction graph',
          ],
          expectedBehavior:
            'Each iteration highlights the active subarray, compares array[mid] with target, and discards either the left or right half.',
          fallbackAvailable: true,
        };
      }

      return {
        rendererType: 'algorithm_array_tracer',
        title: `${interpretation.title} Memory & Complexity Visualizer`,
        description:
          'Interactive computational memory model contrasting contiguous RAM buffers against dynamic heap node pointer chains.',
        learningObjective:
          'Observe the architectural trade-offs between O(1) random array indexing and dynamic O(1) pointer insertions.',
        activeVariables: interpretation.variables.map((v) => v.symbol),
        interactionsAvailable: [
          'Inspect contiguous RAM address calculation: Base + i * Size',
          'Follow pointer links across heap-allocated memory nodes',
          'Observe call-stack LIFO push/pop vs queue FIFO enqueue/dequeue',
          'Compare asymptotic Big-O execution curves: O(1) vs O(log n) vs O(n)',
        ],
        expectedBehavior:
          'Demonstrates memory layout topology, pointer references, and asymptotic complexity boundaries without physics formulas.',
        fallbackAvailable: true,
      };
    }

    // 6B. Biology & Anatomy / 3D Chemistry (e.g. "nervous system", "brain", "neuron", "heart", "molecule")
    const is3dModelCandidate =
      lower.includes('nervous') ||
      lower.includes('brain') ||
      lower.includes('neuron') ||
      lower.includes('synapse') ||
      lower.includes('spine') ||
      lower.includes('neuro') ||
      lower.includes('heart') ||
      lower.includes('anatomy') ||
      lower.includes('molecule') ||
      (interpretation.subject === 'biology' && (lower.includes('system') || lower.includes('organ') || lower.includes('tissue')));

    if (is3dModelCandidate) {
      return {
        rendererType: 'model3d_viewer',
        title: `${interpretation.title} — Interactive 3D Spatial Model`,
        description:
          'High-fidelity Three.js 3D spatial visualization featuring anatomical structure inspection, dynamic signal animations, and learning diagram generation.',
        learningObjective:
          'Build spatial, structural, and physiological intuition through 3D orbital inspection and electrochemical signal pathway visualization.',
        activeVariables: interpretation.variables.map((v) => v.symbol),
        interactionsAvailable: [
          '3D OrbitControls: rotate, pan, and zoom spatial models',
          'Toggle functional signal impulse animations (Action Potential propagation)',
          'Switch between Central Nervous System (Brain/Spinal Cord) and Cellular Neuron views',
          'Capture and download high-resolution educational diagrams with anatomical callouts',
        ],
        expectedBehavior:
          'Provides an interactive 3D WebGL viewport rendering real-time procedural geometry with anatomical callouts and snapshot export.',
        fallbackAvailable: true,
      };
    }

    // 7. Fallback / Universal Schematic Model
    return {
      rendererType: 'svg_schematic_fallback',
      title: `${interpretation.title} Conceptual Diagram`,
      description:
        'Structured conceptual schematic highlighting variable relationships, boundary conditions, and causal linkages.',
      learningObjective:
        'Establish dual-coding schema connecting symbolic formulas with visual representation.',
      activeVariables: interpretation.variables.map((v) => v.symbol),
      interactionsAvailable: [
        'Select variables to highlight definitions',
        'Toggle prerequisite dependencies',
        'Inspect operational limits',
      ],
      expectedBehavior:
        'Selecting a component highlights its mathematical formula and operational context.',
      fallbackAvailable: true,
    };
  }
}

