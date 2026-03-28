import { GameEventBus } from '@turbo-games/events';
import { ASSETS, BACKGROUNDS_ASSETS, BOOST_CONFIG } from './config';
import type { ClickerEvents, SaveData } from './types';

const SAVE_KEY = 'turbo-clicker-save';

export class GameState {
  readonly events = new GameEventBus<ClickerEvents>();

  private _score = 0;
  private _currentAsset = 0;
  private _currentBackground = 0;
  private _unlockedAssets = new Set<number>([0]);
  private _unlockedBackgrounds = new Set<number>([0]);
  private _boostEndTime = 0;

  constructor() {
    this.load();
  }

  get score(): number {
    return this._score;
  }

  get currentAsset(): number {
    return this._currentAsset;
  }

  get currentBackground(): number {
    return this._currentBackground;
  }

  get multiplier(): number {
    return Date.now() < this._boostEndTime ? BOOST_CONFIG.multiplier : 1;
  }

  get boostActive(): boolean {
    return Date.now() < this._boostEndTime;
  }

  get boostRemainingMs(): number {
    return Math.max(0, this._boostEndTime - Date.now());
  }

  get pointsPerClick(): number {
    return ASSETS[this._currentAsset].pointsPerClick * this.multiplier;
  }

  isAssetUnlocked(index: number): boolean {
    return this._unlockedAssets.has(index);
  }

  isBackgroundUnlocked(index: number): boolean {
    return this._unlockedBackgrounds.has(index);
  }

  click(): number {
    const points = this.pointsPerClick;
    this._score += points;
    this.events.emit('score:change', this._score);
    this.events.emit('click', points);
    this.save();
    return points;
  }

  buyAsset(index: number): boolean {
    if (index < 0 || index >= ASSETS.length) return false;
    if (this._unlockedAssets.has(index)) return false;
    const cost = ASSETS[index].cost;
    if (this._score < cost) return false;

    this._score -= cost;
    this._unlockedAssets.add(index);
    this.events.emit('score:change', this._score);
    this.events.emit('unlock:asset', index);
    this.save();
    return true;
  }

  selectAsset(index: number): boolean {
    if (!this._unlockedAssets.has(index)) return false;
    this._currentAsset = index;
    this.events.emit('asset:change', index);
    this.save();
    return true;
  }

  buyBackground(index: number): boolean {
    if (index < 0 || index >= BACKGROUNDS_ASSETS.length) return false;
    if (this._unlockedBackgrounds.has(index)) return false;
    const cost = BACKGROUNDS_ASSETS[index].cost;
    if (this._score < cost) return false;

    this._score -= cost;
    this._unlockedBackgrounds.add(index);
    this.events.emit('score:change', this._score);
    this.events.emit('unlock:background', index);
    this.save();
    return true;
  }

  selectBackground(index: number): boolean {
    if (!this._unlockedBackgrounds.has(index)) return false;
    this._currentBackground = index;
    this.events.emit('background:change', index);
    this.save();
    return true;
  }

  activateBoost(): void {
    this._boostEndTime = Date.now() + BOOST_CONFIG.durationMs;
    this.events.emit('boost:start', BOOST_CONFIG.multiplier, BOOST_CONFIG.durationMs);
    this.save();
  }

  private save(): void {
    const data: SaveData = {
      score: this._score,
      currentAsset: this._currentAsset,
      currentBackground: this._currentBackground,
      unlockedAssets: [...this._unlockedAssets],
      unlockedBackgrounds: [...this._unlockedBackgrounds],
      boostEndTime: this._boostEndTime,
    };
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    } catch {
      /* ignore quota errors */
    }
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as SaveData;
      this._score = data.score ?? 0;
      this._currentAsset = data.currentAsset ?? 0;
      this._currentBackground = data.currentBackground ?? 0;
      this._unlockedAssets = new Set(data.unlockedAssets ?? [0]);
      this._unlockedBackgrounds = new Set(data.unlockedBackgrounds ?? [0]);
      this._boostEndTime = data.boostEndTime ?? 0;
    } catch {
      /* ignore parse errors */
    }
  }
}
