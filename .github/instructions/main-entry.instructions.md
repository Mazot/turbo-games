---
description: "Use when writing or editing a game entry point. Enforces GameRenderer.create() bootstrap, async main() structure, Stats guard, addFeature TS6 cast, and separation of concerns — no feature or game logic inlined in main."
applyTo: "packages/games/*/src/main.ts"
---

# Game Entry Point Conventions

Reference implementation: [clicker/src/main.ts](../../packages/games/clicker/src/main.ts)

## Required structure

```ts
import { GameRenderer, addFeature, Object3DFeature } from '@turbo-games/renderer';

async function main() {
  // 1. Container
  const container = document.getElementById('root') as HTMLDivElement;

  // 2. Renderer
  const game = await GameRenderer.create({ container, fov: 60 });

  // 3. Camera
  game.camera.position.set(0, 0, 5);
  game.camera.lookAt(0, 0, 0);

  // 4. Services and state
  // 5. Scene objects + features
  // 6. UI
  // 7. DEV-only tools
}

main();
```

The file must end with a bare `main()` call — no top-level await, no `.catch()` wrapper needed.

## `GameRenderer.create()` is always first

Create the renderer before anything else. Never instantiate `THREE.*` objects before `GameRenderer.create()` resolves — the WebGPU context must exist first:

```ts
// ✅
const game = await GameRenderer.create({ container, fov: 60 });
const material = new THREE.SpriteMaterial({ ... });

// ❌ — material created before GPU context exists
const material = new THREE.SpriteMaterial({ ... });
const game = await GameRenderer.create({ container, fov: 60 });
```

## Container is always `#root`

```ts
const container = document.getElementById('root') as HTMLDivElement;
```

The `index.html` always has `<div id="root">`. Do not use `document.body` or query by class.

## Stats guard — exact pattern

Always add Stats in every game entry point. Use a dynamic import guarded by `import.meta.env.DEV`. Never ship Stats in production:

```ts
if (import.meta.env.DEV) {
  const { default: Stats } = await import('three/addons/libs/stats.module.js');
  const stats = new Stats();
  document.body.appendChild(stats.dom);
  class StatsFeature extends Object3DFeature {
    onBeforeRender() { stats.update(); }
  }
  addFeature(game.root, StatsFeature as Parameters<typeof addFeature>[1]);
}
```

The Stats block goes at the **end** of `main()`, after scene setup and UI. DEV-only panels (e.g. `ConfiguratorPanel`) also go inside this block.

## `addFeature` TS6 cast

kvy-core types target TS5. In TS6 strict mode, casting is required to get the typed feature instance back:

```ts
// ✅ — typed instance returned
const clickTarget = addFeature(sprite, ClickTarget as Parameters<typeof addFeature>[1]) as unknown as ClickTarget;
clickTarget.onClicked = () => { ... };

// ❌ — type error in TS6 strict mode
const clickTarget = addFeature(sprite, ClickTarget);
```

## No feature or game logic in `main()`

`main()` is wiring — it creates objects, connects callbacks, and hands off to features, state, and UI. Logic belongs in `Object3DFeature` classes, state managers, or UI components:

```ts
// ✅ — main wires, feature owns logic
const clickTarget = addFeature(sprite, ClickTarget as ...) as unknown as ClickTarget;
clickTarget.onClicked = () => {
  const points = state.click();
  ui.showFloatText(points);
};

// ❌ — game logic inlined in main
canvas.addEventListener('click', (e) => {
  // raycasting, scoring, animation... all here
});
```

## No module-level mutable state

All variables (state, services, scene objects) are declared inside `main()`, not at module scope:

```ts
// ✅
async function main() {
  const state = new GameState();
  const adManager = new AdManager();
}

// ❌
const state = new GameState();   // module-level
const adManager = new AdManager();
async function main() { ... }
```

## Ordering inside `main()`

Follow this order consistently:
1. Container lookup
2. `GameRenderer.create()`
3. Camera positioning
4. Services and state instantiation
5. Scene objects (meshes, sprites) + feature attachment + callback wiring
6. UI instantiation (after scene is ready)
7. `if (import.meta.env.DEV)` block (Stats + DEV panels)
