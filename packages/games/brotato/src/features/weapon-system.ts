import * as THREE from 'three';
import { Object3DFeature, CoreContext } from '@turbo-games/renderer';
import type { ModulesRecord } from '@turbo-games/renderer';
import type { WeaponConfig } from '../types';

export class Projectile extends Object3DFeature<ModulesRecord> {
  onHit: ((enemy: THREE.Object3D, damage: number) => boolean) | null = null;
  onRemove: (() => void) | null = null;

  private _velocity = new THREE.Vector2();
  private _damage = 0;
  private _piercing = 0;
  private _hitCount = 0;
  private _lifetime = 0;
  private _maxLifetime = 5;

  setup(damage: number, piercing: number, direction: THREE.Vector2, speed: number): void {
    this._damage = damage;
    this._piercing = piercing;
    this._velocity.copy(direction).normalize().multiplyScalar(speed);
  }

  getDamage(): number {
    return this._damage;
  }

  canHit(): boolean {
    return this._hitCount <= this._piercing;
  }

  registerHit(): void {
    this._hitCount++;
    if (this._hitCount > this._piercing) {
      this.onRemove?.();
    }
  }

  protected useCtx(_ctx: CoreContext<ModulesRecord>) {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext<ModulesRecord>): void {
    if (!this.hasCtx) return;

    this._lifetime += ctx.deltaTime;
    if (this._lifetime >= this._maxLifetime) {
      this.onRemove?.();
      return;
    }

    this.object.position.x += this._velocity.x * ctx.deltaTime;
    this.object.position.y += this._velocity.y * ctx.deltaTime;
  }
}

export class WeaponSystem extends Object3DFeature<ModulesRecord> {
  onFireProjectile: ((weapon: WeaponConfig, direction: THREE.Vector2) => void) | null = null;

  private _weapons: WeaponConfig[] = [];
  private _cooldowns: number[] = [];
  private _target: THREE.Object3D | null = null;
  private _enemies: THREE.Object3D[] = [];
  private _direction = new THREE.Vector2();

  addWeapon(weapon: WeaponConfig): void {
    this._weapons.push(weapon);
    this._cooldowns.push(0);
  }

  clearWeapons(): void {
    this._weapons = [];
    this._cooldowns = [];
  }

  setTarget(target: THREE.Object3D): void {
    this._target = target;
  }

  updateEnemies(enemies: THREE.Object3D[]): void {
    this._enemies = enemies;
  }

  protected useCtx(_ctx: CoreContext<ModulesRecord>) {
    return () => {};
  }

  onBeforeRender(ctx: CoreContext<ModulesRecord>): void {
    if (!this.hasCtx || !this._target || this._enemies.length === 0) return;

    for (let i = 0; i < this._weapons.length; i++) {
      this._cooldowns[i] = Math.max(0, this._cooldowns[i] - ctx.deltaTime);

      if (this._cooldowns[i] <= 0) {
        const weapon = this._weapons[i];
        const enemy = this._findNearestEnemy();

        if (enemy) {
          const dx = enemy.position.x - this._target.position.x;
          const dy = enemy.position.y - this._target.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance <= weapon.range) {
            this._direction.set(dx, dy);
            this.onFireProjectile?.(weapon, this._direction);
            this._cooldowns[i] = 1 / weapon.attackSpeed;
          }
        }
      }
    }
  }

  private _findNearestEnemy(): THREE.Object3D | null {
    if (!this._target || this._enemies.length === 0) return null;

    let nearest: THREE.Object3D | null = null;
    let minDist = Infinity;

    for (const enemy of this._enemies) {
      const dx = enemy.position.x - this._target.position.x;
      const dy = enemy.position.y - this._target.position.y;
      const dist = dx * dx + dy * dy;

      if (dist < minDist) {
        minDist = dist;
        nearest = enemy;
      }
    }

    return nearest;
  }
}
