import type { WaveConfig, EnemyConfig } from '../types';
import { weightedRandom } from '@turbo-games/math';
import { ENEMIES } from '../config/enemies';

export class WaveSystem {
  private _currentWave = 0;
  private _waveConfig: WaveConfig[] = [];
  private _waveActive = false;
  private _waveStartTime = 0;
  private _lastSpawnTime = 0;
  private _enemiesSpawned = 0;

  onSpawnEnemy: ((enemyConfig: EnemyConfig) => void) | null = null;
  onWaveComplete: (() => void) | null = null;
  onWaveStart: ((waveNumber: number) => void) | null = null;

  constructor(waves: WaveConfig[]) {
    this._waveConfig = waves;
  }

  startWave(): void {
    if (this._waveActive) return;

    this._currentWave++;
    if (this._currentWave > this._waveConfig.length) {
      this._currentWave = this._waveConfig.length;
    }

    this._waveActive = true;
    this._waveStartTime = Date.now();
    this._lastSpawnTime = 0;
    this._enemiesSpawned = 0;

    this.onWaveStart?.(this._currentWave);
  }

  update(activeEnemyCount: number): void {
    if (!this._waveActive) return;

    const wave = this._waveConfig[this._currentWave - 1];
    if (!wave) return;

    const elapsed = Date.now() - this._waveStartTime;

    if (elapsed >= wave.duration && activeEnemyCount === 0) {
      this._waveActive = false;
      this.onWaveComplete?.();
      return;
    }

    const timeSinceLastSpawn = Date.now() - this._lastSpawnTime;

    if (
      timeSinceLastSpawn >= wave.spawnRate &&
      this._enemiesSpawned < wave.maxEnemies &&
      elapsed < wave.duration
    ) {
      const enemyConfig = this._selectRandomEnemy(wave);
      if (enemyConfig) {
        this.onSpawnEnemy?.(enemyConfig);
        this._lastSpawnTime = Date.now();
        this._enemiesSpawned++;
      }
    }
  }

  isWaveActive(): boolean {
    return this._waveActive;
  }

  getCurrentWaveNumber(): number {
    return this._currentWave;
  }

  getRemainingWaves(): number {
    return this._waveConfig.length - this._currentWave;
  }

  private _selectRandomEnemy(wave: WaveConfig): EnemyConfig | null {
    const items = wave.enemyTypes.map((id, i) => ({
      id,
      weight: wave.enemyWeights[i] ?? 0,
    }));

    const selected = weightedRandom(items);
    if (!selected) return null;

    return ENEMIES.find((e) => e.id === selected.id) ?? null;
  }
}
