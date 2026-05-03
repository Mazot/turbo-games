import type { LevelConfig, WaveConfig } from '../types';
import { LEVELS } from '../config/levels';
import { t } from '../i18n';

export class LevelEditor {
  private _panel: HTMLDivElement;
  private _currentLevel: LevelConfig;

  onSave: ((level: LevelConfig) => void) | null = null;

  constructor() {
    this._currentLevel = { ...LEVELS[0], waves: [...LEVELS[0].waves] };

    this._panel = document.createElement('div');
    this._panel.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(30, 30, 40, 0.98);
      color: white;
      padding: 30px;
      border-radius: 12px;
      z-index: 3000;
      font-family: system-ui, sans-serif;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      display: none;
    `;

    this._renderEditor();
    document.body.appendChild(this._panel);
  }

  show(): void {
    this._panel.style.display = 'block';
  }

  hide(): void {
    this._panel.style.display = 'none';
  }

  private _renderEditor(): void {
    this._panel.innerHTML = `
      <h2 style="margin-top: 0;">${t('levelEditor.title')}</h2>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;">${t('levelEditor.levelId')}</label>
        <input id="level-id" type="text" value="${this._currentLevel.id}"
          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;">${t('levelEditor.levelName')}</label>
        <input id="level-name" type="text" value="${this._currentLevel.name}"
          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;">${t('levelEditor.bgPath')}</label>
        <input id="level-bg" type="text" value="${this._currentLevel.background}"
          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
      </div>
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;">${t('levelEditor.startGold')}</label>
        <input id="level-gold" type="number" value="${this._currentLevel.startGold}"
          style="width: 100%; padding: 8px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
      </div>
      <h3>${t('levelEditor.waves')}</h3>
      <div id="waves-container"></div>
      <div style="margin-top: 20px; display: flex; gap: 10px;">
        <button id="add-wave-btn" style="flex: 1; padding: 10px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ${t('levelEditor.addWave')}
        </button>
        <button id="save-btn" style="flex: 1; padding: 10px; background: #2196F3; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ${t('levelEditor.save')}
        </button>
        <button id="close-btn" style="flex: 1; padding: 10px; background: #666; color: white; border: none; border-radius: 4px; cursor: pointer;">
          ${t('levelEditor.close')}
        </button>
      </div>
    `;

    this._renderWaves();

    this._panel.querySelector('#add-wave-btn')!.addEventListener('click', () => {
      this._addWave();
    });

    this._panel.querySelector('#save-btn')!.addEventListener('click', () => {
      this._save();
    });

    this._panel.querySelector('#close-btn')!.addEventListener('click', () => {
      this.hide();
    });
  }

  private _renderWaves(): void {
    const container = this._panel.querySelector('#waves-container') as HTMLDivElement;
    container.innerHTML = '';

    for (let i = 0; i < this._currentLevel.waves.length; i++) {
      const wave = this._currentLevel.waves[i];
      const waveDiv = document.createElement('div');
      waveDiv.style.cssText = `
        background: rgba(50, 50, 60, 0.5);
        padding: 15px;
        border-radius: 8px;
        margin-bottom: 10px;
      `;

      waveDiv.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
          <strong>${t('levelEditor.waveN', { n: wave.waveNumber })}</strong>
          <button class="remove-wave-btn" data-index="${i}"
            style="padding: 5px 10px; background: #f44336; color: white; border: none; border-radius: 4px; cursor: pointer;">
            ${t('levelEditor.remove')}
          </button>
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
          <div>
            <label style="font-size: 12px;">${t('levelEditor.durationMs')}</label>
            <input class="wave-duration" data-index="${i}" type="number" value="${wave.duration}"
              style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
          </div>
          <div>
            <label style="font-size: 12px;">${t('levelEditor.spawnRateMs')}</label>
            <input class="wave-spawn-rate" data-index="${i}" type="number" value="${wave.spawnRate}"
              style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
          </div>
          <div>
            <label style="font-size: 12px;">${t('levelEditor.maxEnemies')}</label>
            <input class="wave-max-enemies" data-index="${i}" type="number" value="${wave.maxEnemies}"
              style="width: 100%; padding: 5px; border-radius: 4px; border: 1px solid #555; background: #222; color: white;">
          </div>
          <div>
            <label style="font-size: 12px;">${t('levelEditor.bossWave')}</label>
            <input class="wave-boss" data-index="${i}" type="checkbox" ${wave.bossWave ? 'checked' : ''}
              style="width: 20px; height: 20px;">
          </div>
        </div>
      `;

      container.appendChild(waveDiv);
    }

    container.querySelectorAll('.remove-wave-btn').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const index = parseInt((e.target as HTMLElement).getAttribute('data-index')!);
        this._removeWave(index);
      });
    });
  }

  private _addWave(): void {
    const newWave: WaveConfig = {
      waveNumber: this._currentLevel.waves.length + 1,
      duration: 30_000,
      spawnRate: 2_000,
      enemyTypes: ['slime'],
      enemyWeights: [100],
      maxEnemies: 20,
      bossWave: false,
    };
    this._currentLevel.waves.push(newWave);
    this._renderWaves();
  }

  private _removeWave(index: number): void {
    this._currentLevel.waves.splice(index, 1);
    for (let i = 0; i < this._currentLevel.waves.length; i++) {
      this._currentLevel.waves[i].waveNumber = i + 1;
    }
    this._renderWaves();
  }

  private _save(): void {
    const idInput = this._panel.querySelector('#level-id') as HTMLInputElement;
    const nameInput = this._panel.querySelector('#level-name') as HTMLInputElement;
    const bgInput = this._panel.querySelector('#level-bg') as HTMLInputElement;
    const goldInput = this._panel.querySelector('#level-gold') as HTMLInputElement;

    this._currentLevel.id = idInput.value;
    this._currentLevel.name = nameInput.value;
    this._currentLevel.background = bgInput.value;
    this._currentLevel.startGold = parseInt(goldInput.value);

    this._panel.querySelectorAll('.wave-duration').forEach((input, i) => {
      this._currentLevel.waves[i].duration = parseInt((input as HTMLInputElement).value);
    });

    this._panel.querySelectorAll('.wave-spawn-rate').forEach((input, i) => {
      this._currentLevel.waves[i].spawnRate = parseInt((input as HTMLInputElement).value);
    });

    this._panel.querySelectorAll('.wave-max-enemies').forEach((input, i) => {
      this._currentLevel.waves[i].maxEnemies = parseInt((input as HTMLInputElement).value);
    });

    this._panel.querySelectorAll('.wave-boss').forEach((input, i) => {
      this._currentLevel.waves[i].bossWave = (input as HTMLInputElement).checked;
    });

    console.log('Level saved:', JSON.stringify(this._currentLevel, null, 2));
    this.onSave?.(this._currentLevel);
    alert(t('levelEditor.saved'));
  }

  dispose(): void {
    this._panel.remove();
  }
}
