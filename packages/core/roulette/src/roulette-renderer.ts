import type { RouletteSector, RouletteVisualConfig } from './types';

/**
 * Preloads an array of image URLs and returns a map of URL → HTMLImageElement.
 * Silently skips images that fail to load (they won't be rendered).
 */
export function preloadSectorImages(urls: string[]): Promise<Map<string, HTMLImageElement>> {
  const unique = [...new Set(urls.filter(Boolean))];
  const map = new Map<string, HTMLImageElement>();

  return Promise.all(
    unique.map(
      (url) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.onload = () => {
            map.set(url, img);
            resolve();
          };
          img.onerror = () => resolve();
          img.src = url;
        }),
    ),
  ).then(() => map);
}

/**
 * Renders roulette wheel sectors onto a Canvas2D element.
 * Supports solid color fills and optional sprite images per sector.
 * Separated from RouletteWheel so the rendering strategy can be swapped.
 */
export function renderWheelCanvas<T>(
  canvas: HTMLCanvasElement,
  sectors: RouletteSector<T>[],
  labelColor: string,
  labelFontSize: number,
  visual?: RouletteVisualConfig,
  imageCache?: Map<string, HTMLImageElement>,
): void {
  const size = canvas.width;
  const ctx = canvas.getContext('2d')!;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2;
  const arc = (2 * Math.PI) / sectors.length;

  const borderColor = visual?.borderColor ?? 'rgba(255,255,255,0.15)';
  const borderWidth = visual?.borderWidth ?? 1;
  const centerRadius = visual?.centerRadius ?? 0.12;
  const centerColor = visual?.centerColor ?? 'rgba(22,22,40,0.9)';
  const centerBorderColor = visual?.centerBorderColor ?? 'rgba(255,255,255,0.2)';
  const imageScale = visual?.imageScale ?? 0.6;

  ctx.clearRect(0, 0, size, size);

  for (let i = 0; i < sectors.length; i++) {
    const sector = sectors[i];
    const startAngle = i * arc;
    const endAngle = startAngle + arc;

    // Draw sector slice
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = sector.color;
    ctx.fill();

    // Border between sectors
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();

    // Draw sector image if available
    const sectorImage = sector.image && imageCache?.get(sector.image);
    if (sectorImage) {
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + arc / 2);

      // Clip to sector shape during image draw
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, -arc / 2, arc / 2);
      ctx.closePath();
      ctx.clip();

      // Position image along the sector midline
      const imgDist = radius * 0.55;
      const imgSize = radius * imageScale * 0.5;
      ctx.drawImage(sectorImage, imgDist - imgSize / 2, -imgSize / 2, imgSize, imgSize);

      ctx.restore();
    }

    // Draw label text along the sector midpoint
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + arc / 2);

    ctx.fillStyle = labelColor;
    ctx.font = `bold ${labelFontSize}px 'Segoe UI', system-ui, sans-serif`;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const text = sector.icon ? `${sector.icon} ${sector.label}` : sector.label;
    // Shift label inward when image is present to avoid overlap
    const labelOffset = sectorImage ? radius - 16 - radius * imageScale * 0.3 : radius - 16;
    ctx.fillText(text, labelOffset, 0);

    ctx.restore();
  }

  // Center circle overlay
  ctx.beginPath();
  ctx.arc(cx, cy, radius * centerRadius, 0, 2 * Math.PI);
  ctx.fillStyle = centerColor;
  ctx.fill();
  ctx.strokeStyle = centerBorderColor;
  ctx.lineWidth = 2;
  ctx.stroke();
}
