---
description: "Use when writing or editing game config files: balance data, asset lists, progression tables, boost/upgrade configs. Enforces typed arrays, numeric separators, zero-logic, and cost-progression conventions."
applyTo: "packages/games/*/src/config.ts"
---

# Game Config Conventions

`config.ts` is a **pure data file**. No imports, no functions, no computed values, no side effects.

## Interface before array

Every exported array must have a named interface declared immediately above it:

```ts
// ✅
export interface AssetConfig {
  name: string;
  image: string;
  cost: number;
  pointsPerClick: number;
}
export const ASSETS: AssetConfig[] = [ ... ];

// ❌ — untyped, or type inlined in the const
export const ASSETS = [ ... ];
export const ASSETS: { name: string; cost: number }[] = [ ... ];
```

## Named exports only

No default exports. Every constant is a named `export const`.

## Numeric separators for large numbers

Use `_` as a thousands separator for any number ≥ 1000:

```ts
// ✅
cost: 2_000, durationMs: 30_000

// ❌
cost: 2000, durationMs: 30000
```

## First unlockable item is always free

The first entry in any unlockable array must have `cost: 0`:

```ts
export const ASSETS: AssetConfig[] = [
  { name: 'Basic', ..., cost: 0 },   // ✅ free starter
  { name: 'Better', ..., cost: 100 },
];
```

## Cost progression

Costs must grow monotonically and use roughly exponential steps (each tier ~2–10× the previous). Avoid linear or arbitrary jumps:

```ts
// ✅ — exponential-ish progression
[0, 100, 500, 2_000, 10_000, 50_000]

// ❌ — linear or inconsistent
[0, 100, 200, 300, 400, 500]
[0, 50, 5_000, 500]
```

## No logic

Config files must never contain:
- Functions or methods
- Computed values (`cost: BASE * 2`)
- Conditional expressions
- Imports of any kind

If derived values are needed, compute them in the consuming module, not here.

## Standalone config objects

Simple scalar config objects (not arrays) do not require an interface if the shape is trivially obvious, but must still be `const` named exports:

```ts
// ✅ — simple scalar config
export const BOOST_CONFIG = {
  multiplier: 3,
  durationMs: 30_000,
};
```
