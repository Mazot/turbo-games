import type { Poolable } from './types';

/**
 * Generic object pool for reusing instances instead of allocating/GC'ing.
 * Essential for hot paths in game loops (projectiles, enemies, particles).
 *
 * @example
 * ```ts
 * class Bullet implements Poolable {
 *   x = 0; y = 0; active = false;
 *   reset() { this.x = 0; this.y = 0; this.active = false; }
 * }
 *
 * const pool = new ObjectPool(() => new Bullet(), 50);
 * const bullet = pool.acquire();
 * bullet.x = 10; bullet.active = true;
 * // ... later
 * pool.release(bullet);
 * ```
 */
export class ObjectPool<T extends Poolable> {
  private _pool: T[] = [];
  private _factory: () => T;
  private _activeCount = 0;

  /**
   * @param factory - Function that creates a new instance of `T`
   * @param initialSize - Number of instances to pre-allocate (default 0)
   */
  constructor(factory: () => T, initialSize = 0) {
    this._factory = factory;
    for (let i = 0; i < initialSize; i++) {
      this._pool.push(factory());
    }
  }

  /**
   * Get an object from the pool.
   * If the pool is empty, a new instance is created via the factory.
   */
  acquire(): T {
    this._activeCount++;
    if (this._pool.length > 0) {
      return this._pool.pop()!;
    }
    return this._factory();
  }

  /**
   * Return an object to the pool for reuse.
   * Calls `reset()` on the object to clear its state.
   */
  release(obj: T): void {
    obj.reset();
    this._activeCount--;
    this._pool.push(obj);
  }

  /** Number of objects currently in use (acquired but not released) */
  get activeCount(): number {
    return this._activeCount;
  }

  /** Number of objects available in the pool */
  get availableCount(): number {
    return this._pool.length;
  }

  /** Total number of created objects (active + available) */
  get totalCount(): number {
    return this._activeCount + this._pool.length;
  }

  /** Release all tracked state. Does not destroy pool objects. */
  dispose(): void {
    this._pool.length = 0;
    this._activeCount = 0;
  }
}
