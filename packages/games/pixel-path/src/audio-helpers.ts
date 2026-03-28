import { AudioManager } from '@turbo-games/audio';
import { AUDIO_TRACKS, SOUND_EFFECTS } from './config';

export function setupAudio(audioManager: AudioManager): void {
  // Register music tracks
  for (const [id, config] of Object.entries(AUDIO_TRACKS)) {
    audioManager.register(id, {
      src: config.music,
      volume: config.volume,
      loop: config.loop,
    });
  }

  // Register sound effects
  audioManager.register('sfx-draw', {
    src: SOUND_EFFECTS.draw,
    volume: 0.3,
  });

  audioManager.register('sfx-erase', {
    src: SOUND_EFFECTS.erase,
    volume: 0.3,
  });

  audioManager.register('sfx-goal', {
    src: SOUND_EFFECTS.goal,
    volume: 0.5,
  });

  audioManager.register('sfx-fail', {
    src: SOUND_EFFECTS.fail,
    volume: 0.4,
  });

  audioManager.register('sfx-click', {
    src: SOUND_EFFECTS.click,
    volume: 0.2,
  });
}

export function playMusicForLevel(audioManager: AudioManager, musicTrack: string): void {
  // Stop all music tracks
  audioManager.stop('track1');
  audioManager.stop('track2');
  audioManager.stop('track3');

  // Play the requested track
  audioManager.play(musicTrack);
}
