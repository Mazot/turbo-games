/** A single sector on the roulette wheel. Generic `T` is the reward type defined by the game. */
export interface RouletteSector<T> {
  /** Display label shown on the sector. */
  label: string;
  /** Sector fill color (CSS color string). */
  color: string;
  /** Relative probability weight. Higher = more likely. */
  weight: number;
  /** Optional emoji or icon text rendered alongside the label. */
  icon?: string;
  /** Optional sprite/image URL rendered inside the sector. */
  image?: string;
  /** Game-defined reward payload returned when this sector wins. */
  reward: T;
}

/** Configuration for a RouletteWheel instance. */
export interface RouletteConfig<T> {
  /** Array of sectors displayed on the wheel. Minimum 2. */
  sectors: RouletteSector<T>[];
  /** Total spin animation duration in milliseconds. */
  spinDurationMs: number;
  /** Number of full extra revolutions during the spin animation. */
  spinRevolutions: number;
  /** Wheel diameter in CSS pixels. Defaults to 300. */
  size?: number;
  /** Label font color. Defaults to '#fff'. */
  labelColor?: string;
  /** Label font size in pixels. Defaults to 14. */
  labelFontSize?: number;
  /** Visual customization options for the wheel. */
  visual?: RouletteVisualConfig;
}

/** Visual customization options for the roulette wheel appearance. */
export interface RouletteVisualConfig {
  /** Border color between sectors. Defaults to 'rgba(255,255,255,0.15)'. */
  borderColor?: string;
  /** Border width between sectors. Defaults to 1. */
  borderWidth?: number;
  /** Center circle radius ratio (0–1 relative to wheel radius). Defaults to 0.12. */
  centerRadius?: number;
  /** Center circle fill color. Defaults to 'rgba(22,22,40,0.9)'. */
  centerColor?: string;
  /** Center circle border color. Defaults to 'rgba(255,255,255,0.2)'. */
  centerBorderColor?: string;
  /** Pointer triangle color. Defaults to '#ffd700'. */
  pointerColor?: string;
  /** Optional background image for the entire wheel (drawn behind sectors). */
  wheelBackground?: string;
  /** Size of sector images relative to sector area (0–1). Defaults to 0.6. */
  imageScale?: number;
}

/** Result returned after a spin completes. */
export interface RouletteResult<T> {
  /** The winning sector. */
  sector: RouletteSector<T>;
  /** Index of the winning sector in the config array. */
  sectorIndex: number;
}

/** Optional lifecycle callbacks for the roulette wheel. */
export interface RouletteCallbacks<T> {
  /** Called when the spin animation starts. */
  onSpinStart?: () => void;
  /** Called when the spin animation ends with the result. */
  onSpinEnd?: (result: RouletteResult<T>) => void;
}
