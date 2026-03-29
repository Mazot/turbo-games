import { describe, it, expect } from 'vitest';
import { ObjectPool } from '../object-pool';
import type { Poolable } from '../types';

class TestObj implements Poolable {
  value = 0;
  active = false;

  reset(): void {
    this.value = 0;
    this.active = false;
  }
}

describe('ObjectPool', () => {
  it('acquires new objects via factory when pool is empty', () => {
    const pool = new ObjectPool(() => new TestObj());
    const obj = pool.acquire();
    expect(obj).toBeInstanceOf(TestObj);
    expect(pool.activeCount).toBe(1);
  });

  it('pre-allocates objects with initialSize', () => {
    const pool = new ObjectPool(() => new TestObj(), 5);
    expect(pool.availableCount).toBe(5);
    expect(pool.totalCount).toBe(5);
  });

  it('reuses released objects', () => {
    const pool = new ObjectPool(() => new TestObj());
    const obj1 = pool.acquire();
    obj1.value = 42;
    pool.release(obj1);

    const obj2 = pool.acquire();
    expect(obj2).toBe(obj1);
    expect(obj2.value).toBe(0); // reset was called
  });

  it('calls reset on release', () => {
    const pool = new ObjectPool(() => new TestObj());
    const obj = pool.acquire();
    obj.value = 99;
    obj.active = true;
    pool.release(obj);

    expect(obj.value).toBe(0);
    expect(obj.active).toBe(false);
  });

  it('tracks active and available counts', () => {
    const pool = new ObjectPool(() => new TestObj(), 3);
    expect(pool.activeCount).toBe(0);
    expect(pool.availableCount).toBe(3);

    const a = pool.acquire();
    const b = pool.acquire();
    expect(pool.activeCount).toBe(2);
    expect(pool.availableCount).toBe(1);

    pool.release(a);
    expect(pool.activeCount).toBe(1);
    expect(pool.availableCount).toBe(2);

    pool.release(b);
    expect(pool.activeCount).toBe(0);
    expect(pool.availableCount).toBe(3);
  });

  it('grows beyond initial size when needed', () => {
    const pool = new ObjectPool(() => new TestObj(), 2);
    pool.acquire();
    pool.acquire();
    const third = pool.acquire(); // exceeds initial size
    expect(third).toBeInstanceOf(TestObj);
    expect(pool.activeCount).toBe(3);
    expect(pool.totalCount).toBe(3);
  });

  it('dispose clears pool state', () => {
    const pool = new ObjectPool(() => new TestObj(), 5);
    pool.acquire();
    pool.acquire();
    pool.dispose();
    expect(pool.activeCount).toBe(0);
    expect(pool.availableCount).toBe(0);
  });
});
