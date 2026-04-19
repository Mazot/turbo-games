import { GameEventBus } from '@turbo-games/events';
import {
  ASSETS,
  AUTOCLICK_CONFIG,
  BACKGROUNDS_ASSETS,
  BOOST_CONFIG,
  ROULETTE_CONFIG,
} from './config';
import type { ClickerEvents, SaveData } from './types';

const SAVE_KEY = 'turbo-clicker-save';

export class GameState {
  readonly events = new GameEventBus<ClickerEvents>();

  private _score = 0;
  private _currentAsset = 0;
  private _currentBackground = 0;
  private _assetLevels: number[] = new Array(ASSETS.length).fill(0);
  private _unlockedAssets = new Set<number>([0]);
  private _unlockedBackgrounds = new Set<number>([0]);
  private _boostEndTime = 0;
  private _lastFreeSpinTime = 0;
  private _autoclickEndTime = 0;

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

  get autoclickActive(): boolean {
    return Date.now() < this._autoclickEndTime;
  }

  get autoclickRemainingMs(): number {
    return Math.max(0, this._autoclickEndTime - Date.now());
  }

  get pointsPerClick(): number {
    const level = this.getAssetLevel(this._currentAsset);
    return ASSETS[this._currentAsset].levels[level].pointsPerClick * this.multiplier;
  }

  /** Returns the current upgrade level (0–5) of the given asset. */
  getAssetLevel(assetIndex: number): number {
    const level = this._assetLevels[assetIndex] ?? 0;
    const maxLevel = ASSETS[assetIndex]?.levels.length ? ASSETS[assetIndex].levels.length - 1 : 0;
    return Math.min(level, maxLevel);
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

  /** Spend points directly (for purchasing bonuses). Returns false if not enough. */
  spendPoints(amount: number): boolean {
    if (this._score < amount) return false;
    this._score -= amount;
    this.events.emit('score:change', this._score);
    this.save();
    return true;
  }

  buyAsset(index: number): boolean {
    if (index < 0 || index >= ASSETS.length) return false;
    if (this._unlockedAssets.has(index)) return false;
    const cost = ASSETS[index].unlockCost;
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

  /** Upgrades an unlocked asset to the next level. Returns true on success. */
  upgradeAsset(assetIndex: number): boolean {
    if (!this._unlockedAssets.has(assetIndex)) return false;
    const currentLevel = this._assetLevels[assetIndex];
    const maxLevel = ASSETS[assetIndex].levels.length - 1;
    if (currentLevel >= maxLevel) return false;
    const nextLevel = currentLevel + 1;
    const cost = ASSETS[assetIndex].levels[nextLevel].upgradeCost;
    if (this._score < cost) return false;
    this._score -= cost;
    this._assetLevels[assetIndex] = nextLevel;
    this.events.emit('score:change', this._score);
    this.events.emit('asset:level:change', assetIndex, nextLevel);
    this.save();
    return true;
  }

  activateBoost(): void {
    this._boostEndTime = Date.now() + BOOST_CONFIG.durationMs;
    this.events.emit('boost:start', BOOST_CONFIG.multiplier, BOOST_CONFIG.durationMs);
    this.save();
  }

  /** Starts the auto-click timer. Duration comes from AUTOCLICK_CONFIG. */
  activateAutoclick(): void {
    this._autoclickEndTime = Date.now() + AUTOCLICK_CONFIG.durationMs;
    this.events.emit('autoclick:start', AUTOCLICK_CONFIG.durationMs);
    this.save();
  }

  /** Stops the auto-click timer immediately and emits autoclick:stop. */
  stopAutoclick(): void {
    this._autoclickEndTime = 0;
    this.events.emit('autoclick:stop');
    this.save();
  }

  /** Returns true if the free spin cooldown has elapsed. */
  canFreeSpin(): boolean {
    return Date.now() - this._lastFreeSpinTime >= ROULETTE_CONFIG.freeSpinCooldownMs;
  }

  /** Milliseconds remaining until the next free spin is available. */
  freeSpinCooldownRemaining(): number {
    return Math.max(0, ROULETTE_CONFIG.freeSpinCooldownMs - (Date.now() - this._lastFreeSpinTime));
  }

  /** Marks a free spin as consumed right now. */
  consumeFreeSpin(): void {
    this._lastFreeSpinTime = Date.now();
    this.save();
  }

  /** Deducts the spin cost from the score. Returns true on success. */
  spendForSpin(): boolean {
    if (this._score < ROULETTE_CONFIG.spinCost) return false;
    this._score -= ROULETTE_CONFIG.spinCost;
    this.events.emit('score:change', this._score);
    this.save();
    return true;
  }

  /** Adds roulette reward points to the score and emits the reward event. */
  applyRouletteReward(points: number): void {
    this._score += points;
    this.events.emit('score:change', this._score);
    this.events.emit('roulette:reward', points);
    this.save();
  }

  private save(): void {
    const data: SaveData = {
      score: this._score,
      currentAsset: this._currentAsset,
      currentBackground: this._currentBackground,
      assetLevels: [...this._assetLevels],
      unlockedAssets: [...this._unlockedAssets],
      unlockedBackgrounds: [...this._unlockedBackgrounds],
      boostEndTime: this._boostEndTime,
      lastFreeSpinTime: this._lastFreeSpinTime,
      autoclickEndTime: this._autoclickEndTime,
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
      this._currentAsset = Math.min(data.currentAsset ?? 0, ASSETS.length - 1);
      this._currentBackground = Math.min(
        data.currentBackground ?? 0,
        BACKGROUNDS_ASSETS.length - 1,
      );
      this._assetLevels = Array.from(
        { length: ASSETS.length },
        (_, i) => data.assetLevels?.[i] ?? 0,
      );
      this._unlockedAssets = new Set(data.unlockedAssets ?? [0]);
      this._unlockedBackgrounds = new Set(data.unlockedBackgrounds ?? [0]);
      this._boostEndTime = data.boostEndTime ?? 0;
      this._lastFreeSpinTime = data.lastFreeSpinTime ?? 0;
      this._autoclickEndTime = data.autoclickEndTime ?? 0;
    } catch {
      /* ignore parse errors */
    }
  }
}
