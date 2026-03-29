import type { SaveData } from './types';

/**
 * Base class for game state with localStorage persistence.
 * Subclass this and implement `serialize()` / `deserialize()` for your game.
 *
 * @example
 * ```ts
 * class MyGameState extends SaveableState<MySaveData> {
 *   private _score = 0;
 *
 *   protected serialize(): MySaveData {
 *     return { score: this._score };
 *   }
 *
 *   protected deserialize(data: MySaveData): void {
 *     this._score = data.score ?? 0;
 *   }
 * }
 * ```
 */
export abstract class SaveableState<T extends SaveData = SaveData> {
  private readonly _saveKey: string;

  constructor(saveKey: string) {
    this._saveKey = saveKey;
  }

  /** Convert current state to a plain serializable object */
  protected abstract serialize(): T;

  /** Restore state from a deserialized save object. Apply defaults for missing fields. */
  protected abstract deserialize(data: T): void;

  /** Persist current state to localStorage */
  save(): void {
    try {
      localStorage.setItem(this._saveKey, JSON.stringify(this.serialize()));
    } catch {
      /* ignore quota errors */
    }
  }

  /** Load state from localStorage. Does nothing if no save exists. */
  load(): void {
    try {
      const raw = localStorage.getItem(this._saveKey);
      if (!raw) return;
      const data = JSON.parse(raw) as T;
      this.deserialize(data);
    } catch {
      /* ignore parse errors */
    }
  }

  /** Delete saved state from localStorage */
  clearSave(): void {
    try {
      localStorage.removeItem(this._saveKey);
    } catch {
      /* ignore errors */
    }
  }

  /** Check whether a save exists in localStorage */
  hasSave(): boolean {
    try {
      return localStorage.getItem(this._saveKey) !== null;
    } catch {
      return false;
    }
  }
}
