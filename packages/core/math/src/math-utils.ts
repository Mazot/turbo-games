/** Clamp `value` between `min` and `max` (inclusive) */
export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/** Linear interpolation from `a` to `b` by factor `t` (0..1) */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Inverse lerp — returns the `t` factor for a `value` between `a` and `b` */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return (value - a) / (b - a);
}

/** Random float in [min, max) */
export function randomInRange(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Random integer in [min, max] (inclusive) */
export function randomInt(min: number, max: number): number {
  return Math.floor(min + Math.random() * (max - min + 1));
}

/** Pick a random element from an array. Returns undefined for empty arrays. */
export function randomFromArray<T>(arr: readonly T[]): T | undefined {
  if (arr.length === 0) return undefined;
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Weighted random selection.
 * Each item has a `weight` — higher weight means higher probability.
 *
 * @param items - Array of items with a numeric `weight` property
 * @returns The selected item, or undefined if the array is empty
 */
export function weightedRandom<T extends { weight: number }>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;

  let totalWeight = 0;
  for (const item of items) {
    totalWeight += item.weight;
  }

  let roll = Math.random() * totalWeight;
  for (const item of items) {
    roll -= item.weight;
    if (roll <= 0) return item;
  }

  return items[items.length - 1];
}

/** Remap a value from one range to another */
export function remap(
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
): number {
  return outMin + ((value - inMin) / (inMax - inMin)) * (outMax - outMin);
}

/** Distance between two 2D points */
export function distance2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Squared distance between two 2D points (avoids sqrt — use for comparisons) */
export function distanceSq2D(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}
