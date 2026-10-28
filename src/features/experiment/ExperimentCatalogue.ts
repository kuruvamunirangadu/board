/**
 * VisiOS — Verified Experiment Catalogue
 * Step 1: Defines verified, curriculum-aligned experimental investigations
 * backed by deterministic simulation and kinematics calculation engines.
 */

import { ExperimentDefinition } from './ExperimentTypes';

export const EXPERIMENT_CATALOGUE: ExperimentDefinition[] = [
  {
    id: 'exp_projectile_motion',
    topic: 'kinematics_projectile',
    title: 'Projectile Trajectory & Angle Optimization',
    learningObjective:
      'Discover the mathematical relationship between launch angle, initial speed, and horizontal flight distance over flat terrain.',
    investigationQuestion:
      'How does changing the launch angle (30°, 45°, 60°) affect horizontal range and flight time when launch velocity is held constant?',
    simulationType: 'projectile',
    independentVariables: [
      {
        symbol: 'speed',
        name: 'Launch Speed (v₀)',
        unit: 'm/s',
        min: 5,
        max: 50,
        step: 1,
        defaultValue: 20,
        description: 'Initial scalar magnitude of launch velocity vector.',
      },
      {
        symbol: 'angle',
        name: 'Launch Angle (θ)',
        unit: 'deg (°)',
        min: 5,
        max: 85,
        step: 5,
        defaultValue: 45,
        description: 'Angle of elevation above horizontal ground.',
      },
      {
        symbol: 'gravity',
        name: 'Gravitational Acceleration (g)',
        unit: 'm/s²',
        min: 1.62,
        max: 25.0,
        step: 0.5,
        defaultValue: 9.81,
        description: 'Downwards gravitational acceleration field.',
      },
    ],
    dependentVariables: [
      {
        symbol: 'range',
        name: 'Horizontal Range (R)',
        unit: 'm',
        description: 'Total horizontal distance traveled before impact.',
        isKeyPredictableOutput: true,
      },
      {
        symbol: 'flightTime',
        name: 'Total Flight Time (t)',
        unit: 's',
        description: 'Duration elapsed between launch and ground impact.',
      },
      {
        symbol: 'maxHeight',
        name: 'Maximum Apex Height (h)',
        unit: 'm',
        description: 'Highest vertical displacement reached along the parabola.',
      },
    ],
    assumptions: [
      'Flat horizontal launch and landing elevation (y₀ = y_f = 0)',
      'Uniform downward gravitational acceleration (g = const)',
      'Vacuum environment: negligible atmospheric drag and wind',
      'Point-particle approximation: rotation and Magnus lift ignored',
    ],
    limitations: [
      'In high-speed aerodynamics, air drag creates an asymmetric trajectory with lower range.',
      'Unequal launch and landing heights shift the optimal angle below 45°.',
    ],
    presets: [
      {
        name: 'Optimal 45° Launch',
        description: 'Theoretical maximum range on flat terrain (v=20 m/s, θ=45°)',
        params: { speed: 20, angle: 45, gravity: 9.81 },
      },
      {
        name: 'Shallow 30° Trajectory',
        description: 'Fast horizontal travel with reduced flight time (v=20 m/s, θ=30°)',
        params: { speed: 20, angle: 30, gravity: 9.81 },
      },
      {
        name: 'High-Arc 60° Trajectory',
        description: 'High vertical apex; identical range to 30° but longer hang-time (v=20 m/s, θ=60°)',
        params: { speed: 20, angle: 60, gravity: 9.81 },
      },
      {
        name: 'Lunar Gravity Field',
        description: 'Low gravity (Moon g=1.62 m/s²) vastly extending range and flight duration',
        params: { speed: 20, angle: 45, gravity: 1.62 },
      },
    ],
    reflectionQuestions: [
      {
        id: 'ref_proj_1',
        question:
          'Under identical initial launch velocity and flat terrain, which angle yields the maximum horizontal range?',
        options: ['30°', '45°', '60°', '90°'],
        correctOptionIndex: 1,
        explanation:
          'The horizontal range formula R = (v₀²·sin 2θ)/g peaks when sin(2θ) = 1, which occurs precisely when 2θ = 90° (θ = 45°).',
      },
      {
        id: 'ref_proj_2',
        question:
          'Why do launch angles of 30° and 60° produce the exact same horizontal range for the same launch speed?',
        options: [
          'Because gravity cancels out for complementary angles',
          'Because sin(2 · 30°) = sin(60°) and sin(2 · 60°) = sin(120°) = sin(60°)',
          'Because height does not affect range',
          'It is a coincidence that only occurs at 20 m/s',
        ],
        correctOptionIndex: 1,
        explanation:
          'Complementary launch angles (angles summing to 90°, such as 30° and 60°) satisfy sin(2θ₁) = sin(2(90 - θ₁)) = sin(180 - 2θ₁) = sin(2θ₁), yielding identical theoretical ranges.',
      },
    ],
  },
  {
    id: 'exp_harmonic_pendulum',
    topic: 'mechanics_pendulum',
    title: 'Harmonic Pendulum Period & Galileo’s Law',
    learningObjective:
      'Investigate whether string length or initial amplitude controls the period of an oscillating pendulum.',
    investigationQuestion:
      'How does doubling the string length (from 1m to 2m) affect the pendulum’s period T?',
    simulationType: 'pendulum',
    independentVariables: [
      {
        symbol: 'length',
        name: 'String Length (L)',
        unit: 'm',
        min: 0.2,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Distance from the pivot axle to the center of the bob.',
      },
      {
        symbol: 'gravity',
        name: 'Local Gravity (g)',
        unit: 'm/s²',
        min: 1.62,
        max: 24.79,
        step: 0.5,
        defaultValue: 9.81,
        description: 'Gravitational acceleration field.',
      },
      {
        symbol: 'initialAngle',
        name: 'Release Amplitude (θ₀)',
        unit: 'deg (°)',
        min: 5,
        max: 60,
        step: 5,
        defaultValue: 15,
        description: 'Angular displacement at release.',
      },
    ],
    dependentVariables: [
      {
        symbol: 'period',
        name: 'Period of Oscillation (T)',
        unit: 's',
        description: 'Time required for one complete back-and-forth swing cycle.',
        isKeyPredictableOutput: true,
      },
      {
        symbol: 'frequency',
        name: 'Oscillation Frequency (f)',
        unit: 'Hz',
        description: 'Number of full cycles completed per second (f = 1/T).',
      },
      {
        symbol: 'vMax',
        name: 'Maximum Velocity (v_max)',
        unit: 'm/s',
        description: 'Speed at the lowest equilibrium nadir point.',
      },
    ],
    assumptions: [
      'Inelastic, massless string of fixed length L',
      'Point-mass bob concentrated at length L',
      'Frictionless pivot and small-angle oscillation (sin θ ≈ θ)',
    ],
    limitations: [
      'At release angles above 20°, non-linear restoring torque slightly increases the true period above 2π√(L/g).',
    ],
    presets: [
      {
        name: 'Standard 1-Meter Pendulum',
        description: 'Standard baseline period T ≈ 2.01s on Earth',
        params: { length: 1.0, gravity: 9.81, initialAngle: 15 },
      },
      {
        name: 'Doubled Length (2-Meter)',
        description: 'Observe that doubling length increases period by √2 ≈ 1.414× (T ≈ 2.84s)',
        params: { length: 2.0, gravity: 9.81, initialAngle: 15 },
      },
      {
        name: 'Quadrupled Length (4-Meter)',
        description: 'Observe that quadrupling length exactly doubles the period (T ≈ 4.01s)',
        params: { length: 4.0, gravity: 9.81, initialAngle: 15 },
      },
      {
        name: 'Moon Gravity (1.62 m/s²)',
        description: 'Weaker gravitational restoring force dramatically slows down the swing (T ≈ 4.94s)',
        params: { length: 1.0, gravity: 1.62, initialAngle: 15 },
      },
    ],
    reflectionQuestions: [
      {
        id: 'ref_pend_1',
        question:
          'If you want to double the period of a pendulum from 2.0 seconds to 4.0 seconds, what must you do to the string length?',
        options: [
          'Double the length (2×)',
          'Triple the length (3×)',
          'Quadruple the length (4×)',
          'Halve the length (0.5×)',
        ],
        correctOptionIndex: 2,
        explanation:
          'Because the period T is proportional to the square root of length (T ∝ √L), you must quadruple the length (4×) to produce a 2× increase in period (√4 = 2).',
      },
    ],
  },
  {
    id: 'exp_newton_second_law',
    topic: 'mechanics_newton_f_ma',
    title: 'Newton’s Second Law: Force, Mass & Acceleration',
    learningObjective:
      'Demonstrate how acceleration scales with applied net force and resists increase with inertial mass.',
    investigationQuestion:
      'How does doubling inertial mass from 2 kg to 4 kg affect acceleration under a constant 20 N net force?',
    simulationType: 'vector_force',
    independentVariables: [
      {
        symbol: 'force',
        name: 'Applied Net Force (F)',
        unit: 'N',
        min: 2,
        max: 100,
        step: 2,
        defaultValue: 20,
        description: 'Unbalanced external force acting on the cart.',
      },
      {
        symbol: 'mass',
        name: 'Inertial Mass (m)',
        unit: 'kg',
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 2,
        description: 'Total inertial mass of the dynamic cart.',
      },
    ],
    dependentVariables: [
      {
        symbol: 'acceleration',
        name: 'Acceleration (a)',
        unit: 'm/s²',
        description: 'Instantaneous rate of velocity change: a = F / m.',
        isKeyPredictableOutput: true,
      },
      {
        symbol: 'velocityAt2s',
        name: 'Velocity after 2s (v₂)',
        unit: 'm/s',
        description: 'Velocity reached after 2 seconds of uniform acceleration.',
      },
      {
        symbol: 'distanceAt2s',
        name: 'Distance after 2s (d₂)',
        unit: 'm',
        description: 'Displacement traveled from rest after 2 seconds.',
      },
    ],
    assumptions: [
      'Inertial reference frame (non-accelerating observer)',
      'Zero rolling friction or air resistance on track',
      'Constant mass over time (dm/dt = 0)',
    ],
    limitations: [
      'In real track experiments, kinetic friction and wheel rotational inertia reduce acceleration.',
    ],
    presets: [
      {
        name: 'Baseline: 20N on 2kg',
        description: 'Produces a = 10 m/s²',
        params: { force: 20, mass: 2 },
      },
      {
        name: 'Double Mass: 20N on 4kg',
        description: 'Doubling mass halves the acceleration: a = 5 m/s²',
        params: { force: 20, mass: 4 },
      },
      {
        name: 'Double Force: 40N on 4kg',
        description: 'Doubling force restores acceleration: a = 10 m/s²',
        params: { force: 40, mass: 4 },
      },
    ],
    reflectionQuestions: [
      {
        id: 'ref_fma_1',
        question:
          'If net force F is held strictly constant while mass m is doubled, what happens to acceleration a?',
        options: [
          'It doubles (2×)',
          'It stays exactly the same',
          'It halves (0.5×)',
          'It drops to zero',
        ],
        correctOptionIndex: 2,
        explanation:
          'By Newton’s Second Law a = F/m, acceleration is inversely proportional to mass (a ∝ 1/m). Doubling mass halves acceleration.',
      },
    ],
  },
];

export class ExperimentCatalogueService {
  public static getAll(): ExperimentDefinition[] {
    return EXPERIMENT_CATALOGUE;
  }

  public static getById(id: string): ExperimentDefinition | undefined {
    return EXPERIMENT_CATALOGUE.find((e) => e.id === id);
  }

  public static getBySimulationType(type: string): ExperimentDefinition | undefined {
    return EXPERIMENT_CATALOGUE.find((e) => e.simulationType === type);
  }

  public static matchByTopic(topicOrTitle: string): ExperimentDefinition | undefined {
    const clean = topicOrTitle.toLowerCase();
    if (clean.includes('projectile') || clean.includes('trajectory') || clean.includes('kinematic')) {
      return this.getById('exp_projectile_motion');
    }
    if (clean.includes('pendulum') || clean.includes('harmonic') || clean.includes('galileo')) {
      return this.getById('exp_harmonic_pendulum');
    }
    if (clean.includes('f = ma') || clean.includes('force') || clean.includes('newton') || clean.includes('mass')) {
      return this.getById('exp_newton_second_law');
    }
    return undefined;
  }
}

