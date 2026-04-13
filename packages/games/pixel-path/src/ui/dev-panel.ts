import type { GameState } from '../game-state';
import { LEVELS, AUDIO_TRACKS } from '../config';

export class DevPanel {
  private container: HTMLDivElement;

  constructor(
    private state: GameState,
    private callbacks: {
      onLevelChange: (index: number) => void;
      onMusicChange: (track: string) => void;
      onUnlockAll: () => void;
      onCompleteAll: () => void;
      onResetProgress: () => void;
    },
  ) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 60px;
      right: 10px;
      background: rgba(0, 0, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      font-family: monospace;
      font-size: 12px;
      z-index: 1000;
      max-height: calc(100vh - 80px);
      overflow-y: auto;
      min-width: 250px;
    `;

    this.render();
    document.body.appendChild(this.container);
  }

  private render(): void {
    this.container.innerHTML = `
      <div style="margin-bottom: 15px; font-weight: bold; font-size: 14px; border-bottom: 1px solid #666; padding-bottom: 5px;">
        DEV PANEL
      </div>

      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 5px; color: #aaa;">Level Selector:</div>
        <select id="level-select" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
          ${LEVELS.map((level, i) => `<option value="${i}">${level.name}</option>`).join('')}
        </select>
        <button id="load-level" style="width: 100%; margin-top: 5px; padding: 8px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">Load Level</button>
      </div>

      <div style="margin-bottom: 15px;">
        <div style="margin-bottom: 5px; color: #aaa;">Music Track:</div>
        <select id="music-select" style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #666; border-radius: 4px;">
          ${Object.keys(AUDIO_TRACKS).map(track => `<option value="${track}">${track}</option>`).join('')}
        </select>
        <button id="play-music" style="width: 100%; margin-top: 5px; padding: 8px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">Play Music</button>
      </div>

      <div style="margin-bottom: 15px; border-top: 1px solid #666; padding-top: 15px;">
        <div style="margin-bottom: 10px; color: #aaa; font-weight: bold;">Cheats:</div>
        <button id="unlock-all" style="width: 100%; margin-bottom: 5px; padding: 8px; background: #FF9800; color: white; border: none; border-radius: 4px; cursor: pointer;">Unlock All Levels</button>
        <button id="complete-all" style="width: 100%; margin-bottom: 5px; padding: 8px; background: #9C27B0; color: white; border: none; border-radius: 4px; cursor: pointer;">Complete All Levels (3★)</button>
        <button id="reset-progress" style="width: 100%; padding: 8px; background: #F44336; color: white; border: none; border-radius: 4px; cursor: pointer;">Reset Progress</button>
      </div>

      <div style="margin-top: 15px; border-top: 1px solid #666; padding-top: 10px; font-size: 11px; color: #888;">
        <div>Total Stars: ${this.state.getTotalStars()}</div>
        <div>Completed: ${this.state.getTotalStars() > 0 ? 'Yes' : 'No'}</div>
      </div>
    `;

    const loadLevelBtn = this.container.querySelector('#load-level') as HTMLButtonElement;
    const levelSelect = this.container.querySelector('#level-select') as HTMLSelectElement;
    loadLevelBtn.addEventListener('click', () => {
      const index = parseInt(levelSelect.value);
      this.callbacks.onLevelChange(index);
    });

    const playMusicBtn = this.container.querySelector('#play-music') as HTMLButtonElement;
    const musicSelect = this.container.querySelector('#music-select') as HTMLSelectElement;
    playMusicBtn.addEventListener('click', () => {
      const track = musicSelect.value;
      this.callbacks.onMusicChange(track);
    });

    const unlockAllBtn = this.container.querySelector('#unlock-all') as HTMLButtonElement;
    unlockAllBtn.addEventListener('click', () => {
      this.callbacks.onUnlockAll();
      this.render();
    });

    const completeAllBtn = this.container.querySelector('#complete-all') as HTMLButtonElement;
    completeAllBtn.addEventListener('click', () => {
      this.callbacks.onCompleteAll();
      this.render();
    });

    const resetProgressBtn = this.container.querySelector('#reset-progress') as HTMLButtonElement;
    resetProgressBtn.addEventListener('click', () => {
      if (confirm('Reset all progress? This cannot be undone.')) {
        this.callbacks.onResetProgress();
        this.render();
      }
    });
  }

  dispose(): void {
    document.body.removeChild(this.container);
  }
}
