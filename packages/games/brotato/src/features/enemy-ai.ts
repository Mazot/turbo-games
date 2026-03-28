import * as THREE from 'three';
import { Object3DFeature, CoreContext } from '@turbo-games/renderer';
import type { EnemyConfig } from '../types';
import { SpriteAnimator } from './sprite-animator';

export class EnemyAI extends Object3DFeature {
  private _config: EnemyConfig;
  private _hp: number;
  private _target: THREE.Object3D | null = null;
  private _animator: SpriteAnimator | null = null;
  private _velocity = new THREE.Vector2();
  private _attackCooldown = 0;

  onDeath: ((gold: number, xp: number) => void) | null = null;
  onAttack: ((damage: number) => void) | null = null;

  constructor(config: EnemyConfig) {
    super();
    this._config = config;
    this._hp = config.hp;
  }

  setTarget(target: THREE.Object3D): void {
    this._target = target;
  }

  setAnimator(animator: SpriteAnimator): void {
    this._animator = animator;
  }

  takeDamage(damage: number): boolean {
    this._hp -= damage;
    if (this._hp <= 0) {
      this.onDeath?.(this._config.goldDrop, this._config.xpDrop);
      return true;
    }
    return false;
  }

  getHp(): number {
    return this._hp;
  }

  getMaxHp(): number {
    return this._config.hp;
  }

  protected useCtx(ctx: CoreContext): () => void {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext): void {
    if (!this.hasCtx || !this._target) return;

    this._attackCooldown = Math.max(0, this._attackCooldown - ctx.deltaTime);

    const dx = this._target.position.x - this.object.position.x;
    const dy = this._target.position.y - this.object.position.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > this._config.attackRange) {
      this._velocity.set(dx, dy).normalize();
      this.object.position.x += this._velocity.x * this._config.speed * ctx.deltaTime;
      this.object.position.y += this._velocity.y * this._config.speed * ctx.deltaTime;

      if (this._animator) {
        this._animator.playAnimation('walk');
      }
    } else {
      if (this._animator) {
        this._animator.playAnimation('idle');
      }

      if (this._attackCooldown <= 0) {
        this.onAttack?.(this._config.damage);
        this._attackCooldown = 1 / this._config.attackSpeed;
      }
    }
  }
}
