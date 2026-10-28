import { PendulumParams, PendulumSimulationState } from '@/types/simulation';

export const DEFAULT_PENDULUM_PARAMS: PendulumParams = {
  gravity: 9.81,      // Earth standard gravity (m/s^2)
  length: 2.0,        // 2 meters
  damping: 0.04,      // Slight air resistance
  initialAngle: 45,   // 45 degrees
  speed: 1.0,         // Normal speed
};

export const PLANETARY_PRESETS = [
  { name: 'Earth', g: 9.81, desc: '9.81 m/s²' },
  { name: 'Moon', g: 1.62, desc: '1.62 m/s²' },
  { name: 'Mars', g: 3.71, desc: '3.71 m/s²' },
  { name: 'Jupiter', g: 24.79, desc: '24.79 m/s²' },
  { name: 'Zero-G', g: 0.0, desc: '0.0 m/s²' },
];

/**
 * Calculates theoretical period of a pendulum.
 * Uses small-angle approximation with first-order nonlinear correction.
 */
export function calculateTheoreticalPeriod(length: number, gravity: number, initialAngleDeg: number): number {
  if (gravity <= 0.001 || length <= 0) return Infinity;
  const t0 = 2 * Math.PI * Math.sqrt(length / gravity);
  const theta0Rad = (initialAngleDeg * Math.PI) / 180;
  // Borda's formula for nonlinear period correction
  const correction = 1 + (1 / 16) * Math.pow(theta0Rad, 2) + (11 / 3072) * Math.pow(theta0Rad, 4);
  return t0 * correction;
}

/**
 * Creates initial physics state from configuration parameters.
 */
export function createInitialState(params: PendulumParams): PendulumSimulationState {
  const angleRad = (params.initialAngle * Math.PI) / 180;
  const ep = params.gravity * params.length * (1 - Math.cos(angleRad));
  const period = calculateTheoreticalPeriod(params.length, params.gravity, params.initialAngle);

  return {
    time: 0,
    angle: angleRad,
    angularVelocity: 0,
    angularAcceleration: -(params.gravity / params.length) * Math.sin(angleRad),
    kineticEnergy: 0,
    potentialEnergy: ep,
    totalEnergy: ep,
    period,
    history: [{ t: 0, angle: angleRad }],
  };
}

/**
 * Step simulation forward by dt seconds using Symplectic Semi-Implicit Euler.
 * Symplectic integration preserves Hamiltonian energy phase-space over long study sessions.
 */
export function stepPendulumPhysics(
  state: PendulumSimulationState,
  params: PendulumParams,
  dt: number
): PendulumSimulationState {
  if (params.length <= 0) return state;

  // Sub-stepping for numerical stability
  const subSteps = 4;
  const subDt = (dt * params.speed) / subSteps;

  let currentAngle = state.angle;
  let currentOmega = state.angularVelocity;
  let currentAlpha = state.angularAcceleration;
  let currentTime = state.time;

  for (let step = 0; step < subSteps; step++) {
    // Angular acceleration: alpha = -(g/L)*sin(theta) - (damping/m)*omega
    currentAlpha = -(params.gravity / params.length) * Math.sin(currentAngle) - (params.damping * currentOmega);
    
    // Symplectic step: update velocity first, then angle
    currentOmega += currentAlpha * subDt;
    currentAngle += currentOmega * subDt;

    // Constrain angle to [-PI, PI]
    if (currentAngle > Math.PI) currentAngle -= 2 * Math.PI;
    if (currentAngle < -Math.PI) currentAngle += 2 * Math.PI;

    currentTime += subDt;
  }

  // Energy calculations (m = 1 kg normalized)
  const ek = 0.5 * Math.pow(params.length * currentOmega, 2);
  const ep = params.gravity * params.length * (1 - Math.cos(currentAngle));
  const totalE = ek + ep;

  // Keep wave history buffer of recent points for trace chart
  const history = state.history.length > 80 
    ? [...state.history.slice(1), { t: currentTime, angle: currentAngle }]
    : [...state.history, { t: currentTime, angle: currentAngle }];

  return {
    time: currentTime,
    angle: currentAngle,
    angularVelocity: currentOmega,
    angularAcceleration: currentAlpha,
    kineticEnergy: ek,
    potentialEnergy: ep,
    totalEnergy: totalE,
    period: state.period,
    history,
  };
}

