import * as THREE from 'three';
import type { Object3DFeature } from '@vladkrutenyuk/three-kvy-core';
import { addFeature } from '@vladkrutenyuk/three-kvy-core';

/**
 * Type-safe wrapper around kvy-core's `addFeature`.
 * Avoids the TS6 cast boilerplate `as Parameters<typeof addFeature>[1]`
 * that every game currently needs.
 */
export function addGameFeature<T extends Object3DFeature>(
  object: THREE.Object3D,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  FeatureClass: new (...args: any[]) => T,
): T {
  return addFeature(object, FeatureClass as Parameters<typeof addFeature>[1]) as T;
}

/**
 * Load a texture from a URL path with an optional fallback color.
 * If loading fails, a 1×1 canvas texture with the fallback color is used.
 */
export function loadTexture(path: string, fallbackColor = '#1a1a2e'): Promise<THREE.Texture> {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(
      path,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        resolve(texture);
      },
      undefined,
      () => {
        console.warn(`[loadTexture] Failed to load "${path}", using fallback color`);
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = fallbackColor;
        ctx.fillRect(0, 0, 4, 4);
        const fallback = new THREE.CanvasTexture(canvas);
        fallback.colorSpace = THREE.SRGBColorSpace;
        resolve(fallback);
      },
    );
  });
}

/**
 * Create a CanvasTexture from an image path, drawn scaled-to-fit in a fixed-size canvas.
 * WebGPU allocates GPU texture at canvas size on first upload, so canvas dimensions are fixed.
 */
export function createImageTexture(
  imagePath: string,
  size = 1024,
  onLoad?: (width: number, height: number) => void,
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.onload = () => {
    const iw = img.naturalWidth || size;
    const ih = img.naturalHeight || size;
    const scale = Math.min(size / iw, size / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const dx = (size - dw) / 2;
    const dy = (size - dh) / 2;
    ctx.clearRect(0, 0, size, size);
    ctx.drawImage(img, dx, dy, dw, dh);
    texture.needsUpdate = true;
    onLoad?.(iw, ih);
  };
  img.src = imagePath;

  return texture;
}

/**
 * Set a scene background from a texture path, with a solid-color fallback.
 */
export async function setTextureBackground(
  scene: THREE.Scene,
  path: string,
  fallbackColor = '#1a1a2e',
): Promise<void> {
  const texture = await loadTexture(path, fallbackColor);
  scene.background = texture;
}

/**
 * Set a scene background to a solid color.
 */
export function setColorBackground(scene: THREE.Scene, color: string | number): void {
  scene.background = new THREE.Color(color);
}
