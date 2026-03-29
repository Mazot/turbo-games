import type * as KVY from '@vladkrutenyuk/three-kvy-core';

export interface RendererConfig {
  /** DOM element to mount the renderer canvas into (should be a div) */
  container: HTMLDivElement;
  width?: number;
  height?: number;
  antialias?: boolean;
  /** Force WebGL fallback instead of WebGPU */
  forceWebGL?: boolean;
  /** Perspective camera FOV, default 60 */
  fov?: number;
  /** Camera near plane, default 0.1 */
  near?: number;
  /** Camera far plane, default 1000 */
  far?: number;
  /** Device pixel ratio override, default window.devicePixelRatio */
  pixelRatio?: number;
  /** Automatically resize when the container changes size, default true */
  autoResize?: boolean;
  /** Modules to register on the CoreContext */
  modules?: KVY.ModulesRecord;
}

export interface AnimationFrames {
  frames: number[];
  frameRate: number;
  loop: boolean;
}

export interface AnimationConfig {
  [name: string]: AnimationFrames;
}
