import * as THREE from 'three';
import { Object3DFeature, CoreContext, KeysInput } from '@turbo-games/renderer';
import type { CharacterStats } from '../types';
import { SpriteAnimator } from './sprite-animator';

export class PlayerController extends Object3DFeature {
  private _stats: CharacterStats;
  private _animator: SpriteAnimator | null = null;
  private _velocity = new THREE.Vector2();
  private _moveSpeed = 0;

  onTakeDamage: ((damage: number) => void) | null = null;

  constructor(stats: CharacterStats) {
    super();
    this._stats = stats;
    this._moveSpeed = stats.speed;
  }

  setAnimator(animator: SpriteAnimator): void {
    this._animator = animator;
  }

  updateStats(stats: CharacterStats): void {
    this._stats = stats;
    this._moveSpeed = stats.speed;
  }

  getStats(): CharacterStats {
    return this._stats;
  }

  protected useCtx(ctx: CoreContext): () => void {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext): void {
    if (!this.hasCtx) return;

    const keys = ctx.get(KeysInput);
    if (!keys) return;

    this._velocity.set(0, 0);

    if (keys.isDown('KeyW') || keys.isDown('ArrowUp')) {
      this._velocity.y += 1;
    }
    if (keys.isDown('KeyS') || keys.isDown('ArrowDown')) {
      this._velocity.y -= 1;
    }
    if (keys.isDown('KeyA') || keys.isDown('ArrowLeft')) {
      this._velocity.x -= 1;
    }
    if (keys.isDown('KeyD') || keys.isDown('ArrowRight')) {
      this._velocity.x += 1;
    }

    if (this._velocity.lengthSq() > 0) {
      this._velocity.normalize();
      this.object.position.x += this._velocity.x * this._moveSpeed * ctx.deltaTime;
      this.object.position.y += this._velocity.y * this._moveSpeed * ctx.deltaTime;

      if (this._animator) {
        this._animator.playAnimation('walk');
      }
    } else {
      if (this._animator) {
        this._animator.playAnimation('idle');
      }
    }

    const bounds = 10;
    this.object.position.x = Math.max(-bounds, Math.min(bounds, this.object.position.x));
    this.object.position.y = Math.max(-bounds, Math.min(bounds, this.object.position.y));
  }

  takeDamage(damage: number): void {
    this.onTakeDamage?.(damage);
  }
}
