---
description: "Scaffold a new game package under packages/games/ with all boilerplate files following turbo-games conventions."
agent: "Turbo Dev"
argument-hint: "Game name and a one-line description (e.g. 'platformer — 2D side-scrolling platformer')"
---

Create a new game package at `packages/games/{{game-name}}/` following the turbo-games conventions in [AGENTS.md](../../AGENTS.md). Use the clicker game as a reference: [clicker](../../packages/games/clicker/).

## Files to generate

### 1. `package.json`

```json
{
  "name": "@turbo-games/{{game-name}}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "clean": "rm -rf dist"
  },
  "dependencies": {
    "@turbo-games/renderer": "workspace:*",
    "@turbo-games/events": "workspace:*",
    "three": "^0.183.2"
  },
  "devDependencies": {
    "@types/three": "^0.183.1",
    "typescript": "^6.0.0",
    "vite": "^6.3.0"
  }
}
```

Add other `@turbo-games/*` packages (physics, audio, ads, multiplayer) only if the game description requires them.

### 2. `tsconfig.json`

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "rootDir": "src",
    "outDir": "dist",
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

### 3. `vite.config.ts`

Use path aliases pointing to the core packages' `src/` directories. Only alias packages listed in `dependencies`.

### 4. `index.html`

Minimal HTML with `<div id="root">` and `<script type="module" src="/src/main.ts">`. Include reset styles (margin/padding 0, overflow hidden, 100% width/height).

### 5. `src/main.ts`

- Bootstrap with `GameRenderer.create({ container, fov: 60 })`.
- Set up camera at a sensible default position.
- Include the DEV-only Stats guard from AGENTS.md.
- Add a placeholder scene object so the game renders something immediately.
- Call `main()` and catch errors to console.

### 6. `src/types.ts`

Game-specific event and state type definitions. Start with a basic interface.

### 7. `src/config.ts`

Game balance and configuration constants. Start with sensible defaults for the game type.

## After scaffolding

1. Run `pnpm install` from the repo root.
2. Run `pnpm --filter @turbo-games/{{game-name}} dev` to verify it starts.
3. Update `AGENTS.md` and `README.md` with the new game entry (per Turbo Dev rules).
