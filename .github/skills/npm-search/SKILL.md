---
name: npm-search
description: "Search npmjs.com for an existing package before implementing functionality from scratch. Use when: looking for a ready-made npm package, avoiding custom implementation, finding battle-tested libraries, evaluating alternatives to hand-rolling logic. Searches https://www.npmjs.com and returns ranked candidates with bundle size, weekly downloads, and usage guidance."
argument-hint: "Describe the functionality you need (e.g. 'behavior tree', 'spatial index', 'tween animation')"
---

# npm-search

Search [npmjs.com](https://www.npmjs.com) for a package that provides the required functionality — **before writing any custom code**.

This skill implements the turbo-games rule:  
> *"Always prefer battle-tested npm packages over custom implementations."*

## When to Use

Invoke this skill whenever you are about to implement:
- Algorithms (pathfinding, BVH, spatial indexing, behavior trees, state machines)
- Utilities (tweening, easing, interpolation, noise, random)  
- Data structures (R-tree, quadtree, priority queue, object pools)
- Game systems (particle systems, input handling, FSM, dialog, localization)
- Any logic that is general-purpose and not game-specific

## Procedure

### 1. Parse the requirement
Identify the core capability needed. Strip game-specific framing to get the generic concept.  
Example: "I need enemies to patrol and chase the player" → **behavior tree** or **finite state machine**

### 2. Search npmjs.com
Fetch search results from:
```
https://www.npmjs.com/search?q=<keywords>&ranking=popularity
```
Use concise keyword combinations. Try 2–3 variations if the first search is weak.

### 3. For each top candidate (up to 5), fetch the package page:
```
https://www.npmjs.com/package/<package-name>
```
Collect:
- **Weekly downloads** (popularity signal)
- **Last publish date** (maintenance signal — flag if >2 years)
- **Bundle size** (check bundlephobia if not shown)
- **Dependencies** (flag heavy transitive deps)
- **TypeScript support** (`types` field in package.json or `@types/` package)
- **License** (prefer MIT/Apache-2.0; flag GPL)

### 4. Check bundlephobia for size
For packages that will run in the browser, fetch:
```
https://bundlephobia.com/package/<package-name>
```
Report minified + gzipped size.

### 5. Rank candidates
Score each package on:
| Criterion | Weight |
|-----------|--------|
| Weekly downloads | High |
| TypeScript types | High |
| Bundle size (smaller = better) | Medium |
| Last publish recency | Medium |
| Zero/few dependencies | Low |

### 6. Present results
Return a ranked table:

| # | Package | Downloads/wk | Size (min+gz) | TS | Last publish | Notes |
|---|---------|-------------|---------------|----|--------------|-------|
| 1 | `package-a` | 1.2M | 4.2 kB | ✅ | 3 mo ago | |
| 2 | `package-b` | 340K | 12 kB | ✅ | 1 yr ago | |

Then give a **recommendation** with a one-line install command:
```sh
pnpm add <package-name>
```

And a minimal usage snippet (TypeScript, matching turbo-games conventions).

### 7. Decision gate
If **no suitable package exists** (all candidates are abandoned, wrong scope, or incompatible license):
- State clearly: "No suitable package found."
- Briefly explain why each candidate was rejected.
- Only then proceed to suggest a custom implementation.

## Constraints
- DO NOT skip this skill to write custom code immediately.
- DO NOT recommend a package that hasn't been published in 3+ years unless it is the clear industry standard.
- DO NOT recommend packages with GPL/LGPL licenses without flagging the implications.
- ALWAYS check TypeScript support — `@turbo-games/*` is strict TypeScript.
