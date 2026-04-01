import { renderWheelCanvas, preloadSectorImages } from './roulette-renderer';
import type {
  RouletteCallbacks,
  RouletteConfig,
  RouletteResult,
  RouletteSector,
  RouletteVisualConfig,
} from './types';

/**
 * Generic roulette wheel component rendered as a DOM overlay.
 *
 * Creates a Canvas2D wheel inside the provided container, handles spin
 * animation via CSS transforms, and resolves with a weighted-random result.
 * The reward type `T` is game-defined — the wheel itself is agnostic.
 *
 * Supports optional sprite images per sector and visual customization
 * (pointer color, border style, center circle, etc.).
 */
export class RouletteWheel<T> {
  private wrapper: HTMLDivElement;
  private canvas: HTMLCanvasElement;
  private pointer: HTMLDivElement;
  private sectors: RouletteSector<T>[];
  private spinDurationMs: number;
  private spinRevolutions: number;
  private labelColor: string;
  private labelFontSize: number;
  private size: number;
  private visual: RouletteVisualConfig;
  private spinning = false;
  private currentRotation = 0;
  private callbacks: RouletteCallbacks<T>;
  private imageCache: Map<string, HTMLImageElement> = new Map();

  constructor(container: HTMLElement, config: RouletteConfig<T>, callbacks?: RouletteCallbacks<T>) {
    this.sectors = config.sectors;
    this.spinDurationMs = config.spinDurationMs;
    this.spinRevolutions = config.spinRevolutions;
    this.size = config.size ?? 300;
    this.labelColor = config.labelColor ?? '#fff';
    this.labelFontSize = config.labelFontSize ?? 14;
    this.visual = config.visual ?? {};
    this.callbacks = callbacks ?? {};

    // Wrapper for wheel + pointer
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'roulette-wheel-wrapper';
    this.wrapper.style.cssText = `
      position: relative;
      width: ${this.size}px;
      height: ${this.size}px;
      flex-shrink: 0;
    `;

    // Canvas for wheel face
    const dpr = Math.min(window.devicePixelRatio, 2);
    this.canvas = document.createElement('canvas');
    this.canvas.width = this.size * dpr;
    this.canvas.height = this.size * dpr;
    this.canvas.style.cssText = `
      width: ${this.size}px;
      height: ${this.size}px;
      border-radius: 50%;
      box-shadow: 0 0 40px rgba(0,0,0,0.5), inset 0 0 4px rgba(255,255,255,0.1);
    `;

    // Pointer triangle at the top
    this.pointer = document.createElement('div');
    this.pointer.className = 'roulette-pointer';
    const pointerColor = this.visual.pointerColor ?? '#ffd700';
    this.pointer.style.cssText = `
      position: absolute;
      top: -10px;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 0;
      border-left: 12px solid transparent;
      border-right: 12px solid transparent;
      border-top: 20px solid ${pointerColor};
      filter: drop-shadow(0 2px 6px rgba(0,0,0,0.5));
      z-index: 10;
    `;

    this.wrapper.append(this.canvas, this.pointer);
    container.appendChild(this.wrapper);

    // Render immediately with colors, then preload images and re-render
    this.render();
    this.preloadAndRender();
  }

  /** Whether the wheel is currently animating a spin. */
  get isSpinning(): boolean {
    return this.spinning;
  }

  /**
   * Starts the spin animation and resolves with the winning sector.
   * The winner is determined before the animation begins via weighted random.
   * Rejects if a spin is already in progress.
   */
  spin(): Promise<RouletteResult<T>> {
    if (this.spinning) {
      return Promise.reject(new Error('Spin already in progress'));
    }

    this.spinning = true;
    this.callbacks.onSpinStart?.();

    const winnerIndex = this.selectWinner();
    const result: RouletteResult<T> = {
      sector: this.sectors[winnerIndex],
      sectorIndex: winnerIndex,
    };

    const arc = 360 / this.sectors.length;
    // Target: pointer is at top (12 o'clock = 270° in canvas coords).
    // Sector 0 starts at 0° (3 o'clock). To land on sector N the wheel must
    // rotate so that sector N's midpoint aligns with the top.
    // The canvas is drawn with 0° at 3 o'clock, rotating clockwise.
    // Top of the wheel = -90° (or 270°). We rotate the wheel clockwise.
    const sectorMidAngle = winnerIndex * arc + arc / 2;
    const targetAngle = this.spinRevolutions * 360 + ((360 - sectorMidAngle + 270) % 360);
    const finalRotation = this.currentRotation + targetAngle;

    return new Promise<RouletteResult<T>>((resolve) => {
      this.canvas.style.transition = `transform ${this.spinDurationMs}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`;
      this.canvas.style.transform = `rotate(${finalRotation}deg)`;

      const onEnd = () => {
        this.canvas.removeEventListener('transitionend', onEnd);
        this.currentRotation = finalRotation % 360;
        this.canvas.style.transition = 'none';
        this.canvas.style.transform = `rotate(${this.currentRotation}deg)`;
        this.spinning = false;
        this.callbacks.onSpinEnd?.(result);
        resolve(result);
      };

      this.canvas.addEventListener('transitionend', onEnd);
    });
  }

  /** Re-renders the wheel with a new config. Preloads new images if sectors changed. */
  updateConfig(config: Partial<RouletteConfig<T>>): void {
    const sectorsChanged = config.sectors !== undefined;
    if (config.sectors) this.sectors = config.sectors;
    if (config.spinDurationMs !== undefined) this.spinDurationMs = config.spinDurationMs;
    if (config.spinRevolutions !== undefined) this.spinRevolutions = config.spinRevolutions;
    if (config.labelColor) this.labelColor = config.labelColor;
    if (config.labelFontSize !== undefined) this.labelFontSize = config.labelFontSize;
    if (config.visual) this.visual = { ...this.visual, ...config.visual };

    this.render();
    if (sectorsChanged) this.preloadAndRender();
  }

  /** Removes the wheel from the DOM. */
  destroy(): void {
    this.canvas.style.transition = 'none';
    this.wrapper.remove();
  }

  /** Weighted random selection — returns the winning sector index. */
  private selectWinner(): number {
    let totalWeight = 0;
    for (const sector of this.sectors) {
      totalWeight += sector.weight;
    }

    let roll = Math.random() * totalWeight;
    for (let i = 0; i < this.sectors.length; i++) {
      roll -= this.sectors[i].weight;
      if (roll <= 0) return i;
    }

    return this.sectors.length - 1;
  }

  /** Renders sectors onto the canvas using the current image cache. */
  private render(): void {
    renderWheelCanvas(
      this.canvas,
      this.sectors,
      this.labelColor,
      this.labelFontSize,
      this.visual,
      this.imageCache,
    );
  }

  /** Preloads all sector images then re-renders the wheel. */
  private preloadAndRender(): void {
    const urls = this.sectors.map((s) => s.image).filter((url): url is string => !!url);

    if (urls.length === 0) return;

    preloadSectorImages(urls).then((cache) => {
      this.imageCache = cache;
      this.render();
    });
  }
}
