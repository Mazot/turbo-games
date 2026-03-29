# AGENTS.md

## Project Overview

**turbo-games** — a monorepo for developing browser-based games. Contains a set of reusable core packages and a directory for individual games.

- **Package manager**: pnpm 10.7 (workspaces: `packages/core/*`, `packages/games/*`)
- **Language**: TypeScript 6, strict mode, ES2022 target, ESNext modules
- **Build**: `tsc` per package, shared `tsconfig.base.json` at the root

## Repository Structure

```MD
turbo-games/
├── package.json                # root workspace
├── pnpm-workspace.yaml         # packages/core/* + packages/games/*
├── tsconfig.base.json          # shared TS config
├── .vscode/
│   └── mcp.json                # MCP server config
└── packages/
    ├── core/
    │   ├── renderer/           # @turbo-games/renderer
    │   ├── physics/            # @turbo-games/physics
    │   ├── audio/              # @turbo-games/audio
    │   ├── events/             # @turbo-games/events
    │   ├── ads/                # @turbo-games/ads
    │   ├── multiplayer/        # @turbo-games/multiplayer
    │   └── analytics/          # @turbo-games/analytics
    └── games/
        ├── clicker/            # @turbo-games/clicker — tap/click idle game
        └── brotato/            # @turbo-games/brotato — arena survival game
```

## Core Packages

### @turbo-games/renderer

3D rendering powered by Three.js (WebGPU by default, WebGL fallback) via `@vladkrutenyuk/three-kvy-core`.

- **Main class**: `GameRenderer<TModules>` — wrapper over `KVY.CoreContext`. Created via the async factory `GameRenderer.create(config)`.
- **Architecture**: kvy-core — component-oriented system. `Object3DFeature` — behaviors attached to objects, `CoreContextModule` — global services. Context propagates automatically through the scene hierarchy.
- **Features**: `SpriteAnimator` — sprite sheet animation feature. Call `setup(animations, spriteSheet, framesX, framesY)` then `playAnimation(name)`.
- **Types**: `AnimationConfig`, `AnimationFrames` — reusable animation data types for sprite sheets.
- **Re-exports from kvy-core**: `CoreContext`, `CoreContextModule`, `Object3DFeature`, `addFeature`, `getFeature`, `getFeatureBy`, `getFeatures`, `clear`, `KeysInput`, `ModulesRecord`.
- **Deps**: `three` ^0.183, `@vladkrutenyuk/three-kvy-core` ^2.3.8, `eventemitter3` ^5.0.

### @turbo-games/physics

Physics via Rapier (WASM) + kvy-core addon `RapierPhysics`.

- **Factory**: `createPhysicsModule(config?)` — initializes Rapier WASM, returns a `RapierPhysics` module for `CoreContext`.
- **Re-exports from kvy-core addons**: `RapierPhysics`, `RapierDebugRenderer`, `Rigidbody`, `RigidbodyDynamic`, `RigidbodyFixed`, `RigidbodyKinematic`, `Collider`, `CuboidCollider`, `CapsuleCollider`, `BallCollider`, `ConeCollider`, `CylinderCollider`, `TrimeshCollider`, `ConvexMeshCollider`, `RAPIER`.
- **Deps**: `@dimforge/rapier3d-compat` ^0.14, `@vladkrutenyuk/three-kvy-core` ^2.3.8.

### @turbo-games/audio

Wrapper over Howler.js.

- **Main class**: `AudioManager` — register sounds by ID, playback, sprite sheets, master volume/mute.
- **Deps**: `howler` ^2.2.

### @turbo-games/events

Typed event bus built on EventEmitter3.

- **Main class**: `GameEventBus<T extends GameEvents>` — `on`, `once`, `off`, `emit`, `dispose`.
- **Base events**: `game:start`, `game:pause`, `game:resume`, `game:stop`, `game:error`. Extend via the `GameEvents` interface.
- **Deps**: `eventemitter3` ^5.0.

### @turbo-games/ads

Ad manager with platform providers.

- **Main class**: `AdManager` — `setProvider`, `show`, `preload`, `isAvailable`, `destroy`.
- **Providers** (stubs, SDK integration required): `YandexAdsProvider`, `TelegramAdsProvider`, `CrazyGamesAdsProvider`.
- **Ad types**: `interstitial`, `rewarded`, `banner`.
- **Deps**: none (zero runtime deps).

### @turbo-games/multiplayer

Multiplayer client built on Colyseus.

- **Main class**: `MultiplayerClient` — `joinOrCreate`, `join`, `create`, `getRoom`, `leave`, `dispose`.
- **Deps**: `colyseus.js` ^0.15.

### @turbo-games/analytics

Analytics manager with platform providers. Google Analytics 4 (gtag.js) provider included.

- **Main class**: `AnalyticsManager` — `setProvider`, `trackEvent`, `trackScreenView`, `setUserProperty`, `destroy`.
- **Providers**: `GoogleAnalyticsProvider` — loads gtag.js, sends events to GA4.
- **Deps**: none (zero runtime deps; gtag.js loaded via script tag).

## Conventions

- Each core package: `src/` → `dist/`, ESM only, declaration maps.
- Package structure: `index.ts` (barrel export), `types.ts`, main class/factory.
- Core packages have no interdependencies — they can be used together or independently.
- Renderer and physics are integrated via kvy-core: renderer creates `CoreContext`, physics returns a module for it.
- Async factory initialization: `GameRenderer.create()`, `createPhysicsModule()`.

## Key Patterns

### kvy-core lifecycle

Features (`Object3DFeature`) receive context automatically when their object is added to `ctx.root`. The `useCtx()` method returns a cleanup function. Lifecycle hooks: `onBeforeRender`, `onAfterRender`, `onResize`, `onMount`, `onUnmount`, `onLoopRun`, `onLoopStop`.

```ts
import * as KVY from '@vladkrutenyuk/three-kvy-core';

class Rotate extends KVY.Object3DFeature {
  onBeforeRender(ctx) {
    this.object.rotateY(ctx.deltaTime);
  }
}
KVY.addFeature(mesh, Rotate);
```

### Module integration (physics example)

```ts
import { GameRenderer } from '@turbo-games/renderer';
import { createPhysicsModule, RigidbodyDynamic, CuboidCollider } from '@turbo-games/physics';

const physics = await createPhysicsModule();
const game = await GameRenderer.create({
  container: document.getElementById('root') as HTMLDivElement,
  modules: { rapier: physics },
});
```

### Provider pattern (ads)

`AdManager` accepts any `AdProvider` via `setProvider()`.

### Typed generics

`GameRenderer<TModules>`, `GameEventBus<T>`, `MultiplayerClient` rooms with generic state.

## Rules for the Agent

### Expertise

You are a seasoned game developer (3D games) with extensive experience in **web game development**. Your expertise spans Three.js, WebGPU, component-oriented 3D architectures (kvy-core), physics engines (Rapier), and multiplayer (Colyseus).

### Code Quality

- Always write explanatory comments for all classes, methods, and functions. Describe what it does, not how — focus on intent, inputs, outputs, and side effects.
- Use `@turbo-games/*` packages for shared functionality. Do not write custom implementations of features that belong in core packages.
- If a required feature is missing from core, add it to the appropriate core package.
- Write clean, readable TypeScript. Prefer clarity over cleverness.
- Keep functions short and focused.
- Use descriptive names. No abbreviations except well-known ones (e.g., `dt`, `ctx`, `pos`, `vel`).
- Game config and balance data go in dedicated config files, not inlined in logic.
- Separate concerns: rendering, logic, input, networking should not bleed into each other.
- Always use the latest documentation for libraries.

### Use Three.js Addons

Always use Three.js built-in addons and extras before writing custom implementations. Three.js ships a large set of extras under `three/addons/` (formerly `three/examples/jsm/`) — loaders, controls, post-processing, helpers, math utilities, etc. Check the [Three.js docs](https://threejs.org/docs/) before implementing anything rendering-related.

- Import addons from `three/addons/` (e.g. `import { OrbitControls } from 'three/addons/controls/OrbitControls.js'`).
- Do **not** reimplement what already exists: `BVH`, `Octree`, spatial helpers, path-finding utilities, loaders, shaders, post-processing passes, etc.

### Use npm Packages

Before implementing any logic, search npm first. Always prefer battle-tested npm packages over custom implementations. Only write custom code when no suitable package exists.

- Do **not** hand-roll algorithms that are available as npm packages: `behavior-tree`, `spatial-index`, `R-tree`, `BVH`, pathfinding, state machines, tweening, etc.
- Check npm (`https://www.npmjs.com/`) for any utility before writing it from scratch.

### Performance

- **Object pooling** — reuse objects instead of allocating/GC'ing.
- **Avoid allocations in hot paths** — no `new`, no spread, no array/object literals in render loops.
- **Profile before optimizing** — use browser DevTools.
- **Draw call awareness** — minimize state changes, batch similar draws.
- **kvy-core cleanup** — always return cleanup functions from `useCtx()` to prevent memory leaks.
- Target 60fps on mid-range hardware.

### Development Tooling

- **FPS stats** — always add `Stats` from `three/addons/libs/stats.module.js` in every game entry point, guarded by `import.meta.env.DEV`. Never ship stats in production builds.

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

- Add `"types": ["vite/client"]` to the game's `tsconfig.json` so `import.meta.env` is typed correctly.

### Modularity

- New engine features go in `core/<name>` as separate packages.
- New games go in `games/<name>`.
- No game-specific code in `core/`. No core code in `games/`.
- Each package should be independently buildable and testable.

### Adding a New Game

1. Create `packages/games/<name>/` with its own `package.json`.
2. Add `@turbo-games/*` packages as workspace dependencies.
3. Add `tsconfig.json` extending `../../tsconfig.base.json`.
4. Use `GameRenderer.create()` as the entry point, register needed modules (physics, input, etc.).
5. Implement game logic via `Object3DFeature` classes with kvy-core lifecycle.

## Available Games

### clicker (`packages/games/clicker`)

Tap/click idle game. A 3D sprite is displayed in the center; clicking it awards points. Supports swappable assets and backgrounds via a configurator panel.

- **Entry**: `src/main.ts` — bootstraps `GameRenderer`, attaches a `ClickTarget` feature to a `THREE.Sprite`.
- **State**: `GameState` — score, combo, selected asset/background.
- **UI**: `GameUI` (HUD + floating text), `ConfiguratorPanel` (dev/demo panel).
- **Deps**: `@turbo-games/renderer`, `@turbo-games/events`, `@turbo-games/ads`, `three`.
- **Build**: Vite (`vite.config.ts`), `tsc` type-check only (`noEmit: true`).

### brotato (`packages/games/brotato`)

Arena survival game (Brotato clone). Wave-based enemy spawning, auto-targeting weapons, upgrade system between waves.

- **Entry**: `src/main.ts` — bootstraps `GameRenderer` with `KeysInput` module, creates player sprite, wave system, weapon system.
- **Features**: `PlayerController` (WASD movement), `EnemyAI` (chase + attack), `WeaponSystem` (auto-targeting), `Projectile` (projectile movement + collision).
- **Systems**: `WaveSystem` (wave-based spawning), `UpgradeSystem` (randomized upgrades between waves).
- **Config**: `config/characters.ts`, `config/enemies.ts`, `config/weapons.ts`, `config/items.ts`, `config/levels.ts` — all data-driven.
- **State**: `GameState` — HP, gold, equipped weapons, inventory, localStorage save/load.
- **UI**: `GameUI` (HUD + upgrades + game over), `CheatsPanel` (dev cheats), `LevelEditor` (F1), `ConfiguratorPanel` (F2).
- **Deps**: `@turbo-games/renderer`, `@turbo-games/events`, `@turbo-games/audio`, `@turbo-games/physics`, `three`.
- **Build**: Vite (`vite.config.ts`), `tsc` type-check only (`noEmit: true`).

## MCP (Model Context Protocol)

MCP servers extend the AI agent's capabilities with external tools. Configured in `.vscode/mcp.json`.

### microsoft/markitdown

Converts files (PDF, DOCX, PPTX, images, HTML, etc.) to Markdown.

- **Runtime**: `uvx markitdown-mcp@0.0.1a4` (requires `uv` installed)
- **Use when**: converting design specs, game-design documents, or any binary/rich-text file to readable Markdown for context.

### io.github.ChromeDevTools/chrome-devtools-mcp

Chrome DevTools Protocol automation. Lets the agent open pages, click, fill forms, run JS, take screenshots, and inspect network/console in a real browser.

- **Runtime**: `npx chrome-devtools-mcp@0.20.3`
- **Use when**: smoke-testing a running game (`pnpm dev`), capturing screenshots of the game in-browser, or debugging runtime errors that only appear in the browser.
- **Typical workflow**: start dev server → `navigate_page` to `http://localhost:5173` → `take_screenshot` → inspect `list_console_messages` / `list_network_requests`.

## Commands

```sh
pnpm install              # install all deps
pnpm -r build             # build all packages
pnpm -r --parallel dev    # watch mode all packages
pnpm -r lint              # lint all packages
pnpm -r clean             # clean dist/
```
