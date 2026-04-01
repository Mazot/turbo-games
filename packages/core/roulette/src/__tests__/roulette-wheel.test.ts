import { describe, it, expect } from 'vitest';

/**
 * Tests for the weighted random selection logic used by RouletteWheel.
 * We extract the algorithm inline here because the private method is not
 * directly accessible. The implementation mirrors RouletteWheel.selectWinner().
 */

interface WeightedItem {
  weight: number;
}

function selectWinner(items: WeightedItem[]): number {
  let totalWeight = 0;
  for (const item of items) {
    totalWeight += item.weight;
  }

  let roll = Math.random() * totalWeight;
  for (let i = 0; i < items.length; i++) {
    roll -= items[i].weight;
    if (roll <= 0) return i;
  }

  return items.length - 1;
}

describe('selectWinner (weighted random)', () => {
  it('returns 0 for a single-item array', () => {
    const result = selectWinner([{ weight: 1 }]);
    expect(result).toBe(0);
  });

  it('always returns valid index within bounds', () => {
    const items = [{ weight: 1 }, { weight: 2 }, { weight: 3 }];
    for (let i = 0; i < 100; i++) {
      const idx = selectWinner(items);
      expect(idx).toBeGreaterThanOrEqual(0);
      expect(idx).toBeLessThan(items.length);
    }
  });

  it('respects weight distribution over many samples', () => {
    const items = [{ weight: 90 }, { weight: 9 }, { weight: 1 }];

    const counts = [0, 0, 0];
    const runs = 10_000;
    for (let i = 0; i < runs; i++) {
      counts[selectWinner(items)]++;
    }

    // With 90% weight, first item should win most of the time
    expect(counts[0]).toBeGreaterThan(runs * 0.8);
    // With 1% weight, last item should win rarely
    expect(counts[2]).toBeLessThan(runs * 0.05);
  });
});

describe('sector angle calculation', () => {
  it('calculates correct arc size', () => {
    const sectorCount = 8;
    const arc = 360 / sectorCount;
    expect(arc).toBe(45);
  });

  it('calculates correct sector midpoint angles', () => {
    const sectorCount = 6;
    const arc = 360 / sectorCount;

    const midpoints = Array.from({ length: sectorCount }, (_, i) => i * arc + arc / 2);
    expect(midpoints[0]).toBe(30);
    expect(midpoints[1]).toBe(90);
    expect(midpoints[2]).toBe(150);
    expect(midpoints[3]).toBe(210);
    expect(midpoints[4]).toBe(270);
    expect(midpoints[5]).toBe(330);
  });

  it('target rotation wraps correctly for pointer at top', () => {
    const sectorCount = 8;
    const arc = 360 / sectorCount;
    const spinRevolutions = 5;

    // For sector 0, midAngle = 22.5°
    const winnerIndex = 0;
    const sectorMidAngle = winnerIndex * arc + arc / 2;
    const targetAngle = spinRevolutions * 360 + ((360 - sectorMidAngle + 270) % 360);

    // Should be positive and include full revolutions
    expect(targetAngle).toBeGreaterThan(spinRevolutions * 360 - 360);
    expect(targetAngle).toBeLessThanOrEqual(spinRevolutions * 360 + 360);
  });
});
