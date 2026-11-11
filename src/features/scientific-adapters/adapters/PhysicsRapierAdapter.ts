/**
 * VisiOS — Rapier Physics Adapter
 *
 * Connects the @dimforge/rapier2d-compat physics engine to VisiOS.
 * Provides real-time rigid body dynamics, collision detection, gravity, and restitution.
 * License: Apache-2.0
 */

import RAPIER from '@dimforge/rapier2d-compat';
import {
  AdapterExecutionRequest,
  AdapterExecutionResult,
  IntegrationHealthStatus,
  ScientificAdapter,
  ScientificIntegrationMetadata,
} from '../types';

export interface RapierBodySnapshot {
  id: number;
  type: 'dynamic' | 'fixed';
  x: number;
  y: number;
  rotation: number;
  vx: number;
  vy: number;
}

export class PhysicsRapierAdapter implements ScientificAdapter {
  public metadata: ScientificIntegrationMetadata = {
    id: 'rapier',
    subject: 'physics',
    name: 'Rapier Physics Engine',
    version: '0.14.0',
    description: 'Fast 2D/3D collision detection and rigid-body dynamics for real-time physics experiments.',
    license: 'Apache-2.0',
    licenseNotice: 'Copyright 2026 Dimforge. Licensed under the Apache License, Version 2.0.',
    healthStatus: 'available',
    capabilities: [
      'rigid_body_dynamics',
      'collision_detection',
      'contact_manifold_calculation',
      'gravity_and_forces',
      'restitution_and_friction',
      'joint_constraints',
    ],
    resourceLimits: {
      maxMemoryMb: 64,
      maxExecutionTimeMs: 5000,
      concurrentInstances: 4,
    },
    documentationUrl: 'https://rapier.rs/docs/',
    browserExecutionSupported: true,
    requiresBackendService: false,
  };

  private isInitialized = false;
  private world: RAPIER.World | null = null;
  private bodyHandles: RAPIER.RigidBody[] = [];

  public async initWasm(): Promise<boolean> {
    if (this.isInitialized) return true;
    try {
      await RAPIER.init();
      this.isInitialized = true;
      this.metadata.healthStatus = 'available';
      return true;
    } catch (err: any) {
      this.metadata.healthStatus = 'degraded';
      return false;
    }
  }

  public async checkHealth(): Promise<IntegrationHealthStatus> {
    try {
      const ok = await this.initWasm();
      return ok ? 'available' : 'degraded';
    } catch {
      return 'unavailable';
    }
  }

  public reset(): void {
    if (this.world) {
      this.world.free();
      this.world = null;
    }
    this.bodyHandles = [];
  }

  public createWorld(gravityY = -9.81): RAPIER.World {
    this.reset();
    const gravity = { x: 0.0, y: gravityY };
    this.world = new RAPIER.World(gravity);
    return this.world;
  }

  public addGround(y = 0, halfWidth = 50, halfHeight = 1): RAPIER.RigidBody {
    if (!this.world) this.createWorld();
    const groundDesc = RAPIER.RigidBodyDesc.fixed().setTranslation(0, y);
    const body = this.world!.createRigidBody(groundDesc);
    const colDesc = RAPIER.ColliderDesc.cuboid(halfWidth, halfHeight);
    this.world!.createCollider(colDesc, body);
    this.bodyHandles.push(body);
    return body;
  }

  public addBall(x: number, y: number, radius = 0.5, restitution = 0.8): RAPIER.RigidBody {
    if (!this.world) this.createWorld();
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    const body = this.world!.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.ball(radius).setRestitution(restitution);
    this.world!.createCollider(colDesc, body);
    this.bodyHandles.push(body);
    return body;
  }

  public addBox(x: number, y: number, hx = 0.5, hy = 0.5, restitution = 0.5): RAPIER.RigidBody {
    if (!this.world) this.createWorld();
    const bodyDesc = RAPIER.RigidBodyDesc.dynamic().setTranslation(x, y);
    const body = this.world!.createRigidBody(bodyDesc);
    const colDesc = RAPIER.ColliderDesc.cuboid(hx, hy).setRestitution(restitution);
    this.world!.createCollider(colDesc, body);
    this.bodyHandles.push(body);
    return body;
  }

  public step(dt = 1 / 60): RapierBodySnapshot[] {
    if (!this.world) return [];
    this.world.timestep = dt;
    this.world.step();

    return this.bodyHandles.map((body, index) => {
      const pos = body.translation();
      const vel = body.linvel();
      return {
        id: index,
        type: body.isDynamic() ? 'dynamic' : 'fixed',
        x: Math.round(pos.x * 1000) / 1000,
        y: Math.round(pos.y * 1000) / 1000,
        rotation: Math.round(body.rotation() * 1000) / 1000,
        vx: Math.round(vel.x * 1000) / 1000,
        vy: Math.round(vel.y * 1000) / 1000,
      };
    });
  }

  public async execute(request: AdapterExecutionRequest): Promise<AdapterExecutionResult> {
    const t0 = performance.now();
    await this.initWasm();

    try {
      switch (request.action) {
        case 'create_sandbox': {
          const gravity = request.payload.gravity ?? -9.81;
          this.createWorld(gravity);
          this.addGround(request.payload.groundY ?? -5);

          const balls = request.payload.balls ?? [{ x: 0, y: 5, radius: 0.5, restitution: 0.75 }];
          for (const b of balls) {
            this.addBall(b.x, b.y, b.radius, b.restitution);
          }

          const steps = Math.min(request.payload.steps ?? 60, 300);
          const history: RapierBodySnapshot[][] = [];
          for (let i = 0; i < steps; i++) {
            history.push(this.step(1 / 60));
          }

          return {
            success: true,
            adapterId: 'rapier',
            action: request.action,
            output: {
              totalBodies: this.bodyHandles.length,
              stepsExecuted: steps,
              finalState: history[history.length - 1],
              trajectorySample: history.filter((_, idx) => idx % 10 === 0),
            },
            executionTimeMs: performance.now() - t0,
          };
        }

        case 'step_simulation': {
          const dt = request.payload.dt ?? (1 / 60);
          const snapshot = this.step(dt);
          return {
            success: true,
            adapterId: 'rapier',
            action: request.action,
            output: { snapshot },
            executionTimeMs: performance.now() - t0,
          };
        }

        default:
          return {
            success: false,
            adapterId: 'rapier',
            action: request.action,
            output: null,
            error: `Unsupported Rapier action: ${request.action}`,
            executionTimeMs: performance.now() - t0,
          };
      }
    } catch (err: any) {
      return {
        success: false,
        adapterId: 'rapier',
        action: request.action,
        output: null,
        error: err.message || 'Rapier execution error',
        executionTimeMs: performance.now() - t0,
      };
    }
  }
}
