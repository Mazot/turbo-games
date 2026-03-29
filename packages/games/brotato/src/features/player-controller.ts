import * as THREE from 'three';
import { Object3DFeature, CoreContext, KeysInput } from '@turbo-games/renderer';
import type { ModulesRecord } from '@turbo-games/renderer';
import type { SpriteAnimator } from '@turbo-games/renderer';
import type { CharacterStats } from '../types';

interface InputModules extends ModulesRecord {
  keys: KeysInput;
}

export class PlayerController extends Object3DFeature<InputModules> {
  onTakeDamage: ((damage: number) => void) | null = null;

  private _stats: CharacterStats | null = null;
  private _animator: SpriteAnimator | null = null;
  private _velocity = new THREE.Vector2();
  private _moveSpeed = 0;

  setStats(stats: CharacterStats): void {
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

  getStats(): CharacterStats | null {
    return this._stats;
  }

  protected useCtx(_ctx: CoreContext<InputModules>) {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext<InputModules>): void {
    if (!this.hasCtx || !this._stats) return;

    const keys = ctx.modules.keys;
    if (!keys) return;

    this._velocity.set(0, 0);

    if (keys.has('KeyW') || keys.has('ArrowUp')) {
      this._velocity.y += 1;
    }
    if (keys.has('KeyS') || keys.has('ArrowDown')) {
      this._velocity.y -= 1;
    }
    if (keys.has('KeyA') || keys.has('ArrowLeft')) {
      this._velocity.x -= 1;
    }
    if (keys.has('KeyD') || keys.has('ArrowRight')) {
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
