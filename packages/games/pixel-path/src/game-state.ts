import { GameEventBus } from '@turbo-games/events';
import { LEVELS } from './config';
import type { PixelPathEvents, SaveData } from './types';

const SAVE_KEY = 'turbo-pixel-path-save';

export class GameState {
  readonly events = new GameEventBus<PixelPathEvents>();

  private _currentLevel = 0;
  private _completedLevels = new Set<number>();
  private _stars = new Map<number, number>();
  private _unlockedLevels = new Set<number>([0]);

  constructor() {
    this.load();
  }

  get currentLevel(): number {
    return this._currentLevel;
  }

  get totalLevels(): number {
    return LEVELS.length;
  }

  isLevelUnlocked(index: number): boolean {
    return this._unlockedLevels.has(index);
  }

  isLevelCompleted(index: number): boolean {
    return this._completedLevels.has(index);
  }

  getStars(index: number): number {
    return this._stars.get(index) ?? 0;
  }

  getTotalStars(): number {
    let total = 0;
    for (const stars of this._stars.values()) {
      total += stars;
    }
    return total;
  }

  selectLevel(index: number): boolean {
    if (index < 0 || index >= LEVELS.length) return false;
    if (!this._unlockedLevels.has(index)) return false;
    this._currentLevel = index;
    this.events.emit('level:start', index);
    this.save();
    return true;
  }

  completeLevel(index: number, stars: number): void {
    this._completedLevels.add(index);

    // Update stars if this is better
    const currentStars = this._stars.get(index) ?? 0;
    if (stars > currentStars) {
      this._stars.set(index, stars);
    }

    // Unlock next level
    if (index + 1 < LEVELS.length) {
      this._unlockedLevels.add(index + 1);
    }

    this.events.emit('level:complete', index, stars);
    this.save();
  }

  failLevel(index: number): void {
    this.events.emit('level:fail', index);
  }

  restartLevel(): void {
    this.events.emit('level:start', this._currentLevel);
  }

  nextLevel(): boolean {
    const next = this._currentLevel + 1;
    if (next >= LEVELS.length) return false;
    return this.selectLevel(next);
  }

  // Cheat methods for DEV mode
  unlockAllLevels(): void {
    for (let i = 0; i < LEVELS.length; i++) {
      this._unlockedLevels.add(i);
    }
    this.save();
  }

  completeAllLevels(): void {
    for (let i = 0; i < LEVELS.length; i++) {
      this._completedLevels.add(i);
      this._stars.set(i, 3);
      this._unlockedLevels.add(i);
    }
    this.save();
  }

  resetProgress(): void {
    this._currentLevel = 0;
    this._completedLevels.clear();
    this._stars.clear();
    this._unlockedLevels.clear();
    this._unlockedLevels.add(0);
    this.save();
  }

  private save(): void {
    const data: SaveData = {
      currentLevel: this._currentLevel,
      completedLevels: [...this._completedLevels],
      stars: Object.fromEntries(this._stars),
      unlockedLevels: [...this._unlockedLevels],
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
      this._currentLevel = data.currentLevel ?? 0;
      this._completedLevels = new Set(data.completedLevels ?? []);
      this._stars = new Map(Object.entries(data.stars ?? {}).map(([k, v]) => [parseInt(k), v]));
      this._unlockedLevels = new Set(data.unlockedLevels ?? [0]);
    } catch {
      /* ignore parse errors */
    }
  }
}
