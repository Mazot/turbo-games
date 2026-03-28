# @turbo-games/clicker

Browser-based clicker game built with Three.js. Click the sprite, earn points, buy assets and backgrounds in the shop, activate an ad-powered boost.

## Running

```sh
# from the monorepo root
pnpm install
pnpm --filter @turbo-games/clicker dev

# or directly
cd packages/games/clicker
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173).

```sh
pnpm --filter @turbo-games/clicker build   # production build → dist/
pnpm --filter @turbo-games/clicker preview # preview the built dist/
```

## Gameplay

| Action | Effect |
|---|---|
| Click the sprite | `+pointsPerClick` points (boost multiplier applied if active) |
| **📺 Bonus x3** | Shows a rewarded ad → activates boost for 30 sec |
| **🎨 Assets** | Asset shop — change the emoji sprite |
| **🖼️ Backgrounds** | Background shop — change the gradient background |

Progress is automatically saved to `localStorage`.

## Structure

```
packages/games/clicker/
├── index.html
├── vite.config.ts          # aliases to core packages (src/)
├── tsconfig.json
└── src/
    ├── main.ts             # entry point
    ├── config.ts           # everything to tweak: assets, backgrounds, boost
    ├── game-state.ts       # game state + localStorage persistence
    ├── textures.ts         # canvas → THREE.CanvasTexture (emoji, gradient)
    ├── types.ts            # ClickerEvents, SaveData
    ├── features/
    │   └── click-target.ts # Object3DFeature: raycast clicks + sprite wobble
    └── ui/
        ├── game-ui.ts      # HUD: score, bottom bar, shop
        └── configurator.ts # ⚙️ DEV configurator (dev mode only)
```

## config.ts — main configuration file

All game data lives in one file. Change balance, names, and colors here.

### Assets (`ASSETS`)

```ts
export const ASSETS: AssetConfig[] = [
  { name: 'Star',       emoji: '⭐', cost: 0,      pointsPerClick: 1  },
  { name: 'Diamond',    emoji: '💎', cost: 100,    pointsPerClick: 2  },
  { name: 'Heart',      emoji: '❤️', cost: 500,    pointsPerClick: 5  },
  { name: 'Crown',      emoji: '👑', cost: 2_000,  pointsPerClick: 12 },
  { name: 'Crystal',    emoji: '🔮', cost: 10_000, pointsPerClick: 30 },
  { name: 'Super Star', emoji: '🌟', cost: 50_000, pointsPerClick: 80 },
];
```

- `cost: 0` — unlocked from the start.
- `pointsPerClick` is multiplied by the active boost.

### Backgrounds (`BACKGROUNDS`)

```ts
export const BACKGROUNDS: BackgroundConfig[] = [
  { name: 'Dark',    colors: ['#1a1a2e', '#16213e'], cost: 0       },
  { name: 'Sunset',  colors: ['#e74c3c', '#f39c12'], cost: 200     },
  { name: 'Ocean',   colors: ['#2980b9', '#6dd5fa'], cost: 1_000   },
  { name: 'Forest',  colors: ['#134e5e', '#71b280'], cost: 5_000   },
  { name: 'Galaxy',  colors: ['#0f0c29', '#302b63'], cost: 25_000  },
  { name: 'Dawn',    colors: ['#ff6e7f', '#bfe9ff'], cost: 100_000 },
];
```

- `colors` — a pair of hex colors for a vertical gradient.

### Boost (`BOOST_CONFIG`)

```ts
export const BOOST_CONFIG = {
  multiplier: 3,       // pointsPerClick multiplier while boost is active
  durationMs: 30_000,  // boost duration in milliseconds
};
```

## DEV Configurator

In `vite dev` mode a **⚙️** tab appears on the right edge of the screen. Click it to open the configurator panel. Click **✕** to collapse it.

> The configurator **is excluded from production builds** — it is wrapped in `if (import.meta.env.DEV)`.

```
┌─────────────────────────────┐
│ ⚙️ Configurator             │
├─────────────────────────────┤
│ ASSETS                      │
│  Emoji │ Name  │ Cost │ PPC │
│  ⭐    │ Star  │  0   │  1  │
│  💎    │ ...   │ 100  │  2  │
│  ...                        │
├─────────────────────────────┤
│ BACKGROUNDS                 │
│  Name  │ 🎨 │ 🎨 │ Cost    │
│  Dark  │ ■  │ ■  │  0      │
│  ...                        │
├─────────────────────────────┤
│ BOOST                       │
│  Multiplier       [ 3     ] │
│  Duration (ms)    [ 30000 ] │
└─────────────────────────────┘
```

### What each section edits

| Section | Field | Type | Live effect |
|---|---|---|---|
| 🎨 Assets | `emoji` | text | Sprite updates instantly if this is the current asset |
| 🎨 Assets | `name` | text | Reflected in shop on next open |
| 🎨 Assets | `cost` | number | Reflected in shop on next open |
| 🎨 Assets | `pointsPerClick` | number | Affects next click |
| 🖼️ Backgrounds | `name` | text | Reflected in shop on next open |
| 🖼️ Backgrounds | `colors[0]` | color picker | Background updates instantly if current |
| 🖼️ Backgrounds | `colors[1]` | color picker | Background updates instantly if current |
| 🖼️ Backgrounds | `cost` | number | Reflected in shop on next open |
| ⚡ Boost | `multiplier` | number | Affects next activated boost |
| ⚡ Boost | `durationMs` | number | Affects next activated boost |

### How changes work

The configurator mutates the **in-memory** `ASSETS`, `BACKGROUNDS`, and `BOOST_CONFIG` objects directly — the same references that `GameState` and `GameUI` read from. Changes are **not** persisted to `config.ts` automatically.

**Workflow for tuning balance:**

1. Open the game in `pnpm dev`.
2. Tweak values in the configurator until they feel right.
3. Copy the final values back into [src/config.ts](src/config.ts) to make them permanent.

## Architecture

### `ClickTarget` (Object3DFeature)

Attached to the sprite via `addFeature`. Handles `PointerEvent`, performs a raycast with `THREE.Raycaster`, triggers a wobble animation on hit, and calls the `onClicked()` callback.

### `GameState`

Holds all mutable game state. Persists to `localStorage` (key `turbo-clicker-save`) on every change. Emits events via `GameEventBus<ClickerEvents>`.

### `GameUI`

Plain DOM, no frameworks. Builds the HUD (score, boost indicator, float text, bottom bar) and a modal shop (`shop-overlay`). Subscribes to `state.events` for reactive score updates.

### Textures

- `createEmojiTexture(emoji)` — draws an emoji onto a `<canvas>` and returns a `THREE.CanvasTexture`.
- `createGradientTexture(color1, color2)` — vertical gradient on a `<canvas>` used as `scene.background`.

## Dependencies

| Package | Role |
|---|---|
| `@turbo-games/renderer` | GameRenderer, Object3DFeature, kvy-core |
| `@turbo-games/events` | GameEventBus |
| `@turbo-games/ads` | AdManager (rewarded ad for boost) |
| `three` | 3D rendering, SpriteMaterial, Raycaster |
| `vite` | dev server and build |
