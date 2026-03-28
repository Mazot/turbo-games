import * as THREE from 'three';

export function createImageTexture(imagePath: string, minSize = 512): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = minSize;
  canvas.height = minSize;
  const ctx = canvas.getContext('2d')!;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const img = new Image();
  img.onload = () => {
    const w = Math.max(img.naturalWidth || minSize, minSize);
    const h = Math.max(img.naturalHeight || minSize, minSize);
    canvas.width = w;
    canvas.height = h;
    ctx.clearRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    texture.needsUpdate = true;
  };
  img.src = imagePath;

  return texture;
}
