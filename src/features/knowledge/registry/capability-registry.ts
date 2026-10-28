import { CapabilityDefinition } from '@/types/knowledge';

export const REGISTERED_CAPABILITIES: CapabilityDefinition[] = [
  {
    id: '2d.whiteboard',
    name: '2D Digital Canvas & Shape Utilities',
    description: 'Vector paths, notes, geometric shapes, and text formatting via tldraw SDK.',
    status: 'available',
    supportedFormats: ['vector', 'svg', 'canvas_object'],
  },
  {
    id: 'simulation.pendulum',
    name: 'Nonlinear Physical Pendulum Engine',
    description: 'Symplectic numerical semi-implicit Euler integration of gravitational torque and air resistance.',
    status: 'available',
    supportedFormats: ['numerical_physics', 'svg_stream', 'checkpoint'],
  },
  {
    id: '3d.heart',
    name: '3D Anatomical Organ Model Viewer',
    description: 'Three.js WebGL rendering of human heart with orbit controls and cardiac pulse cycle.',
    status: 'available',
    supportedFormats: ['threejs', 'webgl', 'orbit_controls'],
  },
  {
    id: 'math.coordinate_graph',
    name: 'Coordinate Geometry & Function Plotter',
    description: 'Real-time cartesian coordinate system plotting polynomials, harmonics, and vectors.',
    status: 'available',
    supportedFormats: ['svg_curve', 'cartesian_grid'],
  },
  {
    id: 'cs.array_pointer_visualizer',
    name: 'Linear Memory & Array Visualizer',
    description: 'Step-by-step memory index tracking and pointer arithmetic.',
    status: 'available',
    supportedFormats: ['indexed_blocks', 'pointer_arrows'],
  },
  {
    id: 'electronics.circuit_sim',
    name: 'SPICE Electronic Circuit Simulator',
    description: 'Kirchhoff voltage and current laws with passive/active components.',
    status: 'planned', // Explicitly declared as planned
    supportedFormats: ['schematic_netlist'],
  },
];

export class CapabilityRegistry {
  private capabilities: Map<string, CapabilityDefinition> = new Map();

  constructor(caps: CapabilityDefinition[] = REGISTERED_CAPABILITIES) {
    caps.forEach((c) => this.capabilities.set(c.id, c));
  }

  isAvailable(capabilityId: string): boolean {
    const cap = this.capabilities.get(capabilityId);
    return cap?.status === 'available';
  }

  getCapability(capabilityId: string): CapabilityDefinition | undefined {
    return this.capabilities.get(capabilityId);
  }

  listCapabilities(): CapabilityDefinition[] {
    return Array.from(this.capabilities.values());
  }
}

export const defaultCapabilityRegistry = new CapabilityRegistry();

