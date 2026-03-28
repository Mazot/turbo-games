export interface SoundConfig {
  src: string | string[];
  volume?: number;
  loop?: boolean;
  sprite?: Record<string, [number, number]>;
}

export interface AudioManagerConfig {
  masterVolume?: number;
  muted?: boolean;
}
