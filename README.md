# turbo-games

Monorepo for browser-based games. Contains a set of reusable core packages and a directory for individual games.

## Stack

| Tool | Version |
|---|---|
| TypeScript | 6, strict, ES2022 target, ESNext modules |
| Build | `tsc` per package + Vite for games |
| Package manager | pnpm 10.7 (workspaces) |
| Rendering | Three.js ≥ 0.183 (WebGPU / WebGL fallback) |
| Physics | Rapier WASM 0.14 |
| Multiplayer | Colyseus.js 0.15 |
| Audio | Howler.js 2.2 |
| Ads | custom stubs: Yandex / Telegram / CrazyGames |

## Structure

```
turbo-games/
├── package.json                 # root workspace
├── pnpm-workspace.yaml          # packages/core/* + packages/games/*
├── tsconfig.base.json           # shared TS config
└── packages/
    ├── core/
    │   ├── renderer/            # @turbo-games/renderer
    │   ├── physics/             # @turbo-games/physics
    │   ├── audio/               # @turbo-games/audio
    │   ├── events/              # @turbo-games/events
    │   ├── ads/                 # @turbo-games/ads
    │   └── multiplayer/         # @turbo-games/multiplayer
    └── games/
        └── clicker/             # @turbo-games/clicker
```

## Core Packages

### `@turbo-games/renderer`

3D rendering built on Three.js + [`@vladkrutenyuk/three-kvy-core`](https://github.com/vladkrutenyuk/three-kvy-core).

- **`GameRenderer.create(config)`** — async factory. Creates `CoreContext`, renderer, and camera.
- **`Object3DFeature`** — behavior attached to a scene object. Receives `ctx` automatically when the object is added to `ctx.root`.
- **`CoreContextModule`** — global service registered in `modules` when creating `GameRenderer`.
- Re-exports from kvy-core: `addFeature`, `getFeature`, `KeysInput`, `ModulesRecord`, etc.

```ts
import { GameRenderer, addFeature, Object3DFeature } from '@turbo-games/renderer';

const game = await GameRenderer.create({ container, fov: 60 });

class Spin extends Object3DFeature {
  onBeforeRender(ctx) {
    this.object.rotateY(ctx.deltaTime);
  }
}
addFeature(mesh, Spin);
game.root.add(mesh);
```

### `@turbo-games/physics`

Physics via Rapier WASM.

- **`createPhysicsModule(config?)`** — initializes Rapier WASM, returns a module for `GameRenderer`.
- Re-exports of colliders and bodies: `RigidbodyDynamic`, `RigidbodyFixed`, `CuboidCollider`, `CapsuleCollider`, `TrimeshCollider`, etc.

```ts
import { createPhysicsModule, RigidbodyDynamic, CuboidCollider } from '@turbo-games/physics';

const physics = await createPhysicsModule();
const game = await GameRenderer.create({ container, modules: { rapier: physics } });
```

### `@turbo-games/events`

Typed event bus built on EventEmitter3.

- **`GameEventBus<T extends GameEvents>`** — `on`, `once`, `off`, `emit`, `dispose`.
- Base events: `game:start`, `game:pause`, `game:resume`, `game:stop`, `game:error`.

```ts
import { GameEventBus } from '@turbo-games/events';

interface MyEvents extends GameEvents {
  'score:change': (score: number) => void;
}
const bus = new GameEventBus<MyEvents>();
bus.on('score:change', (s) => console.log(s));
bus.emit('score:change', 42);
```

### `@turbo-games/audio`

Wrapper over Howler.js.

- **`AudioManager`** — register sounds by ID, playback, sprite sheets, master volume / mute.

```ts
import { AudioManager } from '@turbo-games/audio';

const audio = new AudioManager();
audio.register('click', { src: ['click.webm'] });
audio.play('click');
```

### `@turbo-games/ads`

Ad manager with platform stubs.

- **`AdManager`** — `setProvider`, `show`, `preload`, `isAvailable`, `destroy`.
- **Providers** (stubs, SDK integration required): `YandexAdsProvider`, `TelegramAdsProvider`, `CrazyGamesAdsProvider`.
- **Ad types**: `interstitial`, `rewarded`, `banner`.

```ts
import { AdManager, YandexAdsProvider } from '@turbo-games/ads';

const ads = new AdManager();
ads.setProvider(new YandexAdsProvider());
const ok = await ads.show('rewarded');
```

### `@turbo-games/multiplayer`

Multiplayer client built on Colyseus.js.

- **`MultiplayerClient`** — `joinOrCreate`, `join`, `create`, `getRoom`, `leave`, `dispose`.

```ts
import { MultiplayerClient } from '@turbo-games/multiplayer';

const mp = new MultiplayerClient('ws://localhost:2567');
const room = await mp.joinOrCreate<GameState>('game_room');
```

## Commands

```sh
pnpm install              # install all dependencies
pnpm -r build             # build all packages
pnpm -r --parallel dev    # watch mode for all packages
pnpm -r clean             # remove dist/
```

## Adding a New Game

1. Create `packages/games/<name>/` with its own `package.json`.
2. Add the required `@turbo-games/*` packages as workspace dependencies.
3. Add `tsconfig.json` extending `../../tsconfig.base.json`.
4. Configure `vite.config.ts` with aliases pointing to `packages/core/*/src`.
5. Use `GameRenderer.create()` as the entry point.

## Conventions

- Each core package: `src/` → `dist/`, ESM only, declaration maps.
- Core packages have no interdependencies — they can be used independently.
- Game-specific code never goes into `core/`; core code never goes into `games/`.
- Hot paths (render loop): no `new`, no spread, no object literals.
- Always return a cleanup function from `useCtx()` in `Object3DFeature`.
- `Stats` from `three/addons/libs/stats.module.js` — only under `import.meta.env.DEV`.
