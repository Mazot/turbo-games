import * as THREE from 'three';
import * as KVY from '@vladkrutenyuk/three-kvy-core';
import type { RendererConfig } from './types';

export class GameRenderer<TModules extends KVY.ModulesRecord = KVY.ModulesRecord> {
  readonly ctx: KVY.CoreContext<TModules>;

  private constructor(ctx: KVY.CoreContext<TModules>) {
    this.ctx = ctx;
  }

  static async create<TModules extends KVY.ModulesRecord = KVY.ModulesRecord>(
    config: RendererConfig,
  ): Promise<GameRenderer<TModules>> {
    const width = config.width ?? config.container.clientWidth;
    const height = config.height ?? config.container.clientHeight;

    const ThreeWebGPU = await import('three/webgpu');

    const renderer = new ThreeWebGPU.WebGPURenderer({
      antialias: config.antialias ?? true,
      forceWebGL: config.forceWebGL ?? false,
    });
    await renderer.init();

    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);

    const fov = config.fov ?? 60;
    const near = config.near ?? 0.1;
    const far = config.far ?? 1000;

    const ctx = KVY.CoreContext.create<TModules>({
      renderer,
      camera: new THREE.PerspectiveCamera(fov, width / height, near, far),
      scene: new THREE.Scene(),
      clock: new THREE.Clock(),
      modules: config.modules as TModules,
    });

    ctx.three.mount(config.container);
    ctx.run();

    return new GameRenderer(ctx);
  }

  get scene(): THREE.Scene {
    return this.ctx.three.scene;
  }

  get camera(): THREE.PerspectiveCamera {
    return this.ctx.three.camera;
  }

  get root(): THREE.Object3D {
    return this.ctx.root;
  }

  get deltaTime(): number {
    return this.ctx.deltaTime;
  }

  get time(): number {
    return this.ctx.time;
  }

  get isRunning(): boolean {
    return this.ctx.isRunning;
  }

  run(): void {
    this.ctx.run();
  }

  stop(): void {
    this.ctx.stop();
  }

  destroy(): void {
    this.ctx.destroy();
  }
}
