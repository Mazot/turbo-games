---
description: "Scaffold a new core package under packages/core/ with all required boilerplate following turbo-games conventions."
agent: "Turbo Dev"
argument-hint: "Package name and a one-line description (e.g. 'input — keyboard and gamepad input manager')"
---

Create a new core package at `packages/core/{{package-name}}/` following the turbo-games conventions in [AGENTS.md](../../AGENTS.md). Use existing core packages as reference — e.g. [events](../../packages/core/events/) for a pure-TS package, [ads](../../packages/core/ads/) for a provider-pattern package.

## Files to generate

### 1. `package.json`

```json
{
  "name": "@turbo-games/{{package-name}}",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "exports": {
    ".": {
      "import": "./dist/index.js",
      "types": "./dist/index.d.ts"
    }
  },
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "clean": "rm -rf dist"
  },
  "dependencies": {},
  "devDependencies": {
    "typescript": "^6.0.0"
  }
}
```

Add only the runtime dependencies that this package actually needs. `devDependencies` always includes `typescript`.

### 2. `tsconfig.json`

```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

### 3. `src/types.ts`

Public TypeScript interfaces, types, and enums for this package. No implementation here — types only.

### 4. `src/{{main-class-or-factory}}.ts`

The main class or factory function for the package:
- **Class-based** (e.g. a manager): `export class {{Name}}` with a clear constructor and public API.
- **Factory-based** (e.g. async init needed): `export async function create{{Name}}(config?)` returning the initialized instance.

Match the style of existing core packages:
- `AudioManager` — class with `register`, `play`, `dispose`
- `GameEventBus` — generic class wrapping EventEmitter3
- `createPhysicsModule()` — async factory returning a `CoreContextModule`

### 5. `src/index.ts`

Barrel export. Export the main class/factory and all public types. Use `export type` for type-only exports:

```ts
export { MyManager } from './my-manager';
export type { MyConfig, MyOptions } from './types';
```

## Constraints

- **No interdependencies between core packages.** Do not import from other `@turbo-games/*` packages unless the package explicitly integrates with kvy-core (renderer/physics pattern).
- **ESM only.** No CommonJS. `"type": "module"` is set.
- **Zero devDeps at runtime.** Types for third-party deps (`@types/*`) go in `devDependencies`.
- **Async factory when initialization is async** (e.g. WASM loading, SDK init). Synchronous classes do not need factory wrappers.

## After scaffolding

1. Run `pnpm install` from the repo root to link the workspace package.
2. Run `pnpm --filter @turbo-games/{{package-name}} build` to verify it compiles.
3. Update `AGENTS.md` with the new package entry under **Core Packages** and add it to the **Repository Structure** tree.
4. Update `README.md` with a brief entry under the core packages section.
