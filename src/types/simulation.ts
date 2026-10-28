export type SimulationType = 'pendulum' | 'projectile' | 'circuit' | 'neural-net';

export interface SimulationParameterDef {
  id: string;
  name: string;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  description?: string;
}

export interface SimulationMetadata {
  id: string;
  type: SimulationType;
  title: string;
  subject: string;
  description: string;
  equations: string[];
  parameters: Record<string, number>;
}

export interface PendulumSimulationState {
  time: number;
  angle: number;           // radians
  angularVelocity: number; // rad/s
  angularAcceleration: number;
  kineticEnergy: number;   // Joules
  potentialEnergy: number; // Joules
  totalEnergy: number;
  period: number;          // seconds
  history: { t: number; angle: number }[];
}

export interface PendulumParams {
  gravity: number;         // m/s^2 (default 9.8)
  length: number;          // meters (default 2.0)
  damping: number;         // coefficient (default 0.05)
  initialAngle: number;    // degrees (default 45)
  speed: number;           // playback multiplier (0.5 to 2.0)
}

