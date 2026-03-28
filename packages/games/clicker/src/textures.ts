import * as THREE from 'three';

/**
 * WebGPU allocates the GPU texture at the canvas size on first upload,
 * so we must never change canvas dimensions after creation.
 * The image is drawn scaled-to-fit inside a fixed-size canvas.
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
