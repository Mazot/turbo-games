import { Howl, Howler } from 'howler';
import type { SoundConfig, AudioManagerConfig } from './types';

export class AudioManager {
  private sounds = new Map<string, Howl>();

  constructor(config: AudioManagerConfig = {}) {
    if (config.masterVolume !== undefined) {
      Howler.volume(config.masterVolume);
    }
    if (config.muted) {
      Howler.mute(true);
    }
  }

  register(id: string, config: SoundConfig): void {
    if (this.sounds.has(id)) {
      this.sounds.get(id)!.unload();
    }
    this.sounds.set(
      id,
      new Howl({
        src: Array.isArray(config.src) ? config.src : [config.src],
        volume: config.volume ?? 1,
        loop: config.loop ?? false,
        sprite: config.sprite as Record<string, [number, number]>,
      }),
    );
  }

  play(id: string, sprite?: string): number | undefined {
    const sound = this.sounds.get(id);
    if (!sound) {
      console.warn(`[AudioManager] Sound "${id}" not found`);
      return undefined;
    }
    return sound.play(sprite);
  }

  stop(id: string): void {
    this.sounds.get(id)?.stop();
  }

  setVolume(volume: number): void {
    Howler.volume(volume);
  }

  mute(muted: boolean): void {
    Howler.mute(muted);
  }

  dispose(): void {
    for (const sound of this.sounds.values()) {
      sound.unload();
    }
    this.sounds.clear();
  }
}
