import { describe, it, expect } from 'vitest';
import {
  clamp,
  lerp,
  inverseLerp,
  randomInRange,
  randomInt,
  randomFromArray,
  weightedRandom,
  remap,
  distance2D,
  distanceSq2D,
} from '../math-utils';

describe('clamp', () => {
  it('returns value when within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });

  it('clamps to min', () => {
    expect(clamp(-5, 0, 10)).toBe(0);
  });

  it('clamps to max', () => {
    expect(clamp(15, 0, 10)).toBe(10);
  });

  it('handles equal min and max', () => {
    expect(clamp(5, 3, 3)).toBe(3);
  });
});

describe('lerp', () => {
  it('returns a at t=0', () => {
    expect(lerp(10, 20, 0)).toBe(10);
  });

  it('returns b at t=1', () => {
    expect(lerp(10, 20, 1)).toBe(20);
  });

  it('returns midpoint at t=0.5', () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
  });
});

describe('inverseLerp', () => {
  it('returns 0 at value=a', () => {
    expect(inverseLerp(10, 20, 10)).toBe(0);
  });

  it('returns 1 at value=b', () => {
    expect(inverseLerp(10, 20, 20)).toBe(1);
  });

  it('returns 0.5 at midpoint', () => {
    expect(inverseLerp(0, 100, 50)).toBe(0.5);
  });

  it('returns 0 when a equals b', () => {
    expect(inverseLerp(5, 5, 5)).toBe(0);
  });
});

describe('randomInRange', () => {
  it('returns values within [min, max)', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInRange(5, 10);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThan(10);
    }
  });
});

describe('randomInt', () => {
  it('returns integers within [min, max]', () => {
    for (let i = 0; i < 100; i++) {
      const val = randomInt(1, 6);
      expect(Number.isInteger(val)).toBe(true);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(6);
    }
  });
});

describe('randomFromArray', () => {
  it('returns undefined for empty arrays', () => {
    expect(randomFromArray([])).toBeUndefined();
  });

  it('returns an element from the array', () => {
    const arr = [1, 2, 3, 4, 5];
    for (let i = 0; i < 50; i++) {
      expect(arr).toContain(randomFromArray(arr));
    }
  });
});

describe('weightedRandom', () => {
  it('returns undefined for empty arrays', () => {
    expect(weightedRandom([])).toBeUndefined();
  });

  it('returns the only item when there is one', () => {
    const items = [{ weight: 1, value: 'only' }];
    expect(weightedRandom(items)?.value).toBe('only');
  });

  it('respects weights (heavily biased)', () => {
    const items = [
      { weight: 1000, value: 'heavy' },
      { weight: 1, value: 'light' },
    ];
    let heavyCount = 0;
    for (let i = 0; i < 200; i++) {
      if (weightedRandom(items)?.value === 'heavy') heavyCount++;
    }
    expect(heavyCount).toBeGreaterThan(150);
  });
});

describe('remap', () => {
  it('remaps value from one range to another', () => {
    expect(remap(5, 0, 10, 0, 100)).toBe(50);
    expect(remap(0, 0, 10, 100, 200)).toBe(100);
    expect(remap(10, 0, 10, 100, 200)).toBe(200);
  });
});

describe('distance2D', () => {
  it('calculates distance between two points', () => {
    expect(distance2D(0, 0, 3, 4)).toBe(5);
    expect(distance2D(1, 1, 1, 1)).toBe(0);
  });
});

describe('distanceSq2D', () => {
  it('calculates squared distance', () => {
    expect(distanceSq2D(0, 0, 3, 4)).toBe(25);
    expect(distanceSq2D(0, 0, 0, 0)).toBe(0);
  });
});
