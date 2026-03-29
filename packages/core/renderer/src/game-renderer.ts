import * as THREE from 'three';
import type { Renderer as GPURenderer } from 'three/webgpu';
import * as KVY from '@vladkrutenyuk/three-kvy-core';
import type { RendererConfig } from './types';

/**
 * Main renderer wrapper over kvy-core CoreContext.
 * Handles WebGPU/WebGL initialization, resize, and lifecycle.
 */
export class GameRenderer<TModules extends KVY.ModulesRecord = KVY.ModulesRecord> {
  readonly ctx: KVY.CoreContext<TModules>;

  private _resizeObserver: ResizeObserver | null = null;
  private _container: HTMLDivElement;

  private constructor(ctx: KVY.CoreContext<TModules>, container: HTMLDivElement) {
    this.ctx = ctx;
    this._container = container;
  }

  /**
   * Async factory — creates the WebGPU/WebGL renderer, camera, scene and starts the loop.
   * Always use this instead of `new GameRenderer()`.
   */
  static async create<TModules extends KVY.ModulesRecord = KVY.ModulesRecord>(
    config: RendererConfig,
  ): Promise<GameRenderer<TModules>> {
    const width = config.width ?? config.container.clientWidth;
    const height = config.height ?? config.container.clientHeight;

    let renderer: GPURenderer;
    try {
      const ThreeWebGPU = await import('three/webgpu');
      const gpuRenderer = new ThreeWebGPU.WebGPURenderer({
        antialias: config.antialias ?? true,
        forceWebGL: config.forceWebGL ?? false,
      });
      await gpuRenderer.init();
      renderer = gpuRenderer;
    } catch (err) {
      console.warn('[GameRenderer] WebGPU init failed, falling back to WebGL:', err);
      renderer = new THREE.WebGLRenderer({
        antialias: config.antialias ?? true,
      }) as unknown as GPURenderer;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(config.pixelRatio ?? window.devicePixelRatio);

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

    const game = new GameRenderer(ctx, config.container);

    if (config.autoResize !== false) {
      game._startResizeObserver();
    }

    return game;
  }

  /** Handles container resize — updates renderer size and camera aspect */
  private _handleResize = (): void => {
    const width = this._container.clientWidth;
    const height = this._container.clientHeight;
    if (width === 0 || height === 0) return;

    this.ctx.three.renderer.setSize(width, height);

    const cam = this.ctx.three.camera;
    if (cam instanceof THREE.PerspectiveCamera) {
      cam.aspect = width / height;
      cam.updateProjectionMatrix();
    }
  };

  /** Starts observing the container element for size changes */
  private _startResizeObserver(): void {
    this._resizeObserver = new ResizeObserver(this._handleResize);
    this._resizeObserver.observe(this._container);
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

  /** Fully disposes the renderer: stops the loop, disconnects resize observer, destroys context */
  destroy(): void {
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
      this._resizeObserver = null;
    }
    this.ctx.destroy();
  }
}
