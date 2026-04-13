import * as THREE from 'three';
import { Object3DFeature } from '@turbo-games/renderer';
import type { CoreContext, ModulesRecord } from '@turbo-games/renderer';
import { RigidbodyDynamic, BallCollider } from '@turbo-games/physics';
import type { RapierPhysics } from '@turbo-games/physics';

interface PhysicsModules extends ModulesRecord {
  rapier: RapierPhysics;
}

export class Ball extends Object3DFeature<PhysicsModules> {
  onGoalReached: (() => void) | null = null;
  onFallOff: (() => void) | null = null;

  private startPosition = new THREE.Vector3();
  private goalPosition = new THREE.Vector3();
  private radius = 0.25;
  private isLaunched = false;
  private checkInterval = 0;

  setStartPosition(pos: THREE.Vector3): void {
    this.startPosition.copy(pos);
    this.object.position.copy(pos);
    this.isLaunched = false;
  }

  setGoalPosition(pos: THREE.Vector3): void {
    this.goalPosition.copy(pos);
  }

  setRadius(r: number): void {
    this.radius = r;
  }

  launch(): void {
    this.isLaunched = true;
  }

  reset(): void {
    this.object.position.copy(this.startPosition);
    this.isLaunched = false;
  }

  protected useCtx(_ctx: CoreContext<PhysicsModules>) {
    this.object.position.copy(this.startPosition);
    return () => {
      // Cleanup handled automatically by kvy-core
    };
  }

  onBeforeRender(_ctx: CoreContext<PhysicsModules>) {
    if (!this.isLaunched) return;

    this.checkInterval += _ctx.deltaTime;
    if (this.checkInterval < 0.1) return;
    this.checkInterval = 0;

    // Check if reached goal
    const distToGoal = this.object.position.distanceTo(this.goalPosition);
    if (distToGoal < this.radius + 0.3) {
      this.isLaunched = false;
      this.onGoalReached?.();
      return;
    }

    // Check if fell off (below y = -10)
    if (this.object.position.y < -10) {
      this.isLaunched = false;
      this.onFallOff?.();
    }
  }
}
