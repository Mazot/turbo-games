---
description: "Use when writing or editing Object3DFeature classes in kvy-core: behaviors, animation loops, input handlers, physics integrations. Enforces cleanup in useCtx, no allocations in hot paths, correct lifecycle method usage."
applyTo: "packages/games/*/src/features/*.ts"
---

# Object3DFeature Conventions

Features are **behavior components attached to a Three.js `Object3D`**. They receive `CoreContext` automatically when their object is added to `ctx.root`, and lose it when removed.

Reference implementation: [click-target.ts](../../packages/games/clicker/src/features/click-target.ts)

## Class structure

```ts
export class MyFeature extends Object3DFeature<ModulesRecord> {
  // 1. Public callbacks (optional)
  onSomething: (() => void) | null = null;

  // 2. Private state — pre-allocated, never created in hot paths
  private _velocity = new THREE.Vector3();
  private _tempVec = new THREE.Vector3();

  // 3. useCtx — setup + cleanup
  protected useCtx(ctx: CoreContext<ModulesRecord>) {
    // ... attach listeners, allocate scene objects, subscribe to modules
    return () => {
      // ... remove listeners, dispose scene objects, unsubscribe
    };
  }

  // 4. Lifecycle hooks — read/mutate only, no allocations
  onBeforeRender(ctx: CoreContext<ModulesRecord>) { ... }
}
```

## `useCtx` — setup and cleanup

`useCtx` is called when context attaches. **Always return a cleanup function** that undoes everything set up inside:

```ts
// ✅
protected useCtx(ctx: CoreContext<ModulesRecord>) {
  const canvas = ctx.three.renderer.domElement;
  const handler = (e: PointerEvent) => { ... };
  canvas.addEventListener('pointerdown', handler);

  const mesh = new THREE.Mesh(geo, mat);
  this.object.add(mesh);

  return () => {
    canvas.removeEventListener('pointerdown', handler);
    this.object.remove(mesh);
    mesh.geometry.dispose();
    (mesh.material as THREE.Material).dispose();
  };
}

// ❌ — no cleanup → memory leak / dangling listeners
protected useCtx(ctx: CoreContext<ModulesRecord>) {
  ctx.three.renderer.domElement.addEventListener('pointerdown', this.handler);
  // missing return () => { ... }
}
```

Anything allocated inside `useCtx` must be disposed in the cleanup: event listeners, scene children, textures, geometries, materials.

## `onBeforeRender` — no allocations

`onBeforeRender` runs every frame. Never create objects here:

```ts
// ✅ — reuse pre-allocated instance fields
private _dir = new THREE.Vector3();

onBeforeRender(ctx: CoreContext<ModulesRecord>) {
  this._dir.set(0, 1, 0).applyQuaternion(this.object.quaternion);
  this.object.position.addScaledVector(this._dir, ctx.deltaTime);
}

// ❌ — allocates on every frame → GC pressure
onBeforeRender(ctx: CoreContext<ModulesRecord>) {
  const dir = new THREE.Vector3(0, 1, 0).applyQuaternion(this.object.quaternion);
  this.object.position.add(dir.multiplyScalar(ctx.deltaTime));
}
```

Same rule applies to `onAfterRender`.

## `ctx` access

Never access `this.ctx` outside lifecycle methods. Use `this.hasCtx` to guard if needed:

```ts
// ✅
if (this.hasCtx) {
  this.ctx.three.renderer.setPixelRatio(ratio);
}

// ❌ — throws if context is not attached
this.ctx.three.renderer.setPixelRatio(ratio);
```

## Available lifecycle hooks

Override only the hooks you need — unused ones have no cost:

| Hook | When called |
|------|-------------|
| `useCtx(ctx)` | Context attached — setup + return cleanup |
| `onBeforeRender(ctx)` | Every frame, before render |
| `onAfterRender(ctx)` | Every frame, after render |
| `onResize(ctx)` | Container resized |
| `onMount(ctx)` | `ctx.three.mount()` called |
| `onUnmount(ctx)` | `ctx.three.unmount()` called |
| `onLoopRun(ctx)` | `ctx.run()` called |
| `onLoopStop(ctx)` | `ctx.stop()` called |
| `onUserAwake(ctx)` | `ctx.emit("userawake")` called |
| `onUserStart(ctx)` | `ctx.emit("userstart")` called |
| `onDestroy()` | `feature.destroy()` called |

## `ctx.time` vs `ctx.deltaTime`

- `ctx.deltaTime` — seconds since last frame. Use for **movement and animation**.
- `ctx.time` — total elapsed seconds. Use for **oscillation and phase-based animation**.

```ts
// Movement — deltaTime
this.object.position.x += speed * ctx.deltaTime;

// Oscillation — time
const idle = 1 + 0.03 * Math.sin(ctx.time * 2);
```

## No game logic in features

Features are **rendering and input behaviors**. Game state changes belong in state classes or event handlers, not inside the feature itself. Expose callbacks instead:

```ts
// ✅ — delegate via callback
export class ClickTarget extends Object3DFeature {
  onClicked: (() => void) | null = null;
  // ...
  // in useCtx handler:
  this.onClicked?.();
}

// in main.ts:
clickTarget.onClicked = () => state.addPoints();

// ❌ — direct state mutation inside feature
import { state } from '../game-state';
// ... state.addPoints() inside the feature
```
