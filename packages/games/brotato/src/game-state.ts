import { GameEventBus } from '@turbo-games/events';
import type { GameEvents, CharacterStats, SaveData } from './types';
import { CHARACTERS } from './config/characters';

const SAVE_KEY = 'turbo-brotato-save';

export class GameState {
  readonly events = new GameEventBus<GameEvents>();

  private _gold = 10;
  private _currentWave = 0;
  private _currentLevel = 'forest';
  private _stats: CharacterStats;
  private _equippedWeapons: string[] = ['stick'];
  private _inventory: string[] = [];
  private _unlockedCharacters: string[] = ['potato'];
  private _unlockedWeapons: string[] = ['stick'];
  private _unlockedItems: string[] = [];
  private _selectedCharacter = 'potato';

  constructor() {
    const char = CHARACTERS[0];
    this._stats = { ...char.baseStats };
    this.load();
  }

  get gold(): number {
    return this._gold;
  }

  get currentWave(): number {
    return this._currentWave;
  }

  get currentLevel(): string {
    return this._currentLevel;
  }

  get stats(): CharacterStats {
    return { ...this._stats };
  }

  get equippedWeapons(): string[] {
    return [...this._equippedWeapons];
  }

  get inventory(): string[] {
    return [...this._inventory];
  }

  get selectedCharacter(): string {
    return this._selectedCharacter;
  }

  addGold(amount: number): void {
    this._gold += amount;
    this.events.emit('gold:change', this._gold);
    this.save();
  }

  spendGold(amount: number): boolean {
    if (this._gold < amount) return false;
    this._gold -= amount;
    this.events.emit('gold:change', this._gold);
    this.save();
    return true;
  }

  takeDamage(damage: number): boolean {
    const actualDamage = Math.max(0, damage - this._stats.armor);
    const dodged = Math.random() < this._stats.dodge;

    if (dodged) return false;

    this._stats.hp = Math.max(0, this._stats.hp - actualDamage);
    this.events.emit('player:damage', actualDamage, this._stats.hp);

    if (this._stats.hp <= 0) {
      this.events.emit('player:death');
      return true;
    }

    return false;
  }

  heal(amount: number): void {
    this._stats.hp = Math.min(this._stats.maxHp, this._stats.hp + amount);
    this.events.emit('player:heal', amount, this._stats.hp);
  }

  addItem(itemId: string): void {
    this._inventory.push(itemId);
    this.events.emit('item:add', itemId);
    this.save();
  }

  addWeapon(weaponId: string): void {
    if (this._equippedWeapons.length < 6) {
      this._equippedWeapons.push(weaponId);
    }
    if (!this._unlockedWeapons.includes(weaponId)) {
      this._unlockedWeapons.push(weaponId);
    }
    this.save();
  }

  setStat(stat: keyof CharacterStats, value: number): void {
    (this._stats[stat] as number) = value;
  }

  incrementWave(): void {
    this._currentWave++;
    this.events.emit('wave:start', this._currentWave);
    this.save();
  }

  completeWave(): void {
    this.events.emit('wave:complete', this._currentWave);
  }

  selectCharacter(characterId: string): void {
    this._selectedCharacter = characterId;
    const char = CHARACTERS.find((c) => c.id === characterId);
    if (char) {
      this._stats = { ...char.baseStats };
    }
    this.save();
  }

  resetRun(): void {
    this._currentWave = 0;
    this._equippedWeapons = ['stick'];
    this._inventory = [];
    const char = CHARACTERS.find((c) => c.id === this._selectedCharacter);
    if (char) {
      this._stats = { ...char.baseStats };
    }
    this.save();
  }

  private save(): void {
    const data: SaveData = {
      gold: this._gold,
      currentWave: this._currentWave,
      currentLevel: this._currentLevel,
      unlockedCharacters: this._unlockedCharacters,
      unlockedWeapons: this._unlockedWeapons,
      unlockedItems: this._unlockedItems,
      stats: this._stats,
      equippedWeapons: this._equippedWeapons,
      inventory: this._inventory,
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
      this._gold = data.gold ?? 10;
      this._currentWave = data.currentWave ?? 0;
      this._currentLevel = data.currentLevel ?? 'forest';
      this._unlockedCharacters = data.unlockedCharacters ?? ['potato'];
      this._unlockedWeapons = data.unlockedWeapons ?? ['stick'];
      this._unlockedItems = data.unlockedItems ?? [];
      this._equippedWeapons = data.equippedWeapons ?? ['stick'];
      this._inventory = data.inventory ?? [];
      if (data.stats) {
        this._stats = data.stats;
      }
    } catch {
      /* ignore parse errors */
    }
  }
}
