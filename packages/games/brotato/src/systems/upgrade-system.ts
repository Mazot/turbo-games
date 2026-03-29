import type { UpgradeOption, ItemConfig, WeaponConfig } from '../types';
import { randomFromArray } from '@turbo-games/math';
import { ITEMS } from '../config/items';
import { WEAPONS } from '../config/weapons';

export class UpgradeSystem {
  onSelectUpgrade: ((upgrade: UpgradeOption) => void) | null = null;

  generateUpgrades(count: number, waveNumber: number): UpgradeOption[] {
    const upgrades: UpgradeOption[] = [];
    const usedIds = new Set<string>();

    while (upgrades.length < count) {
      const type = this._selectUpgradeType(waveNumber);
      let upgrade: UpgradeOption | null = null;

      if (type === 'item') {
        upgrade = this._generateItemUpgrade(usedIds, waveNumber);
      } else if (type === 'weapon') {
        upgrade = this._generateWeaponUpgrade(usedIds);
      } else {
        upgrade = this._generateStatUpgrade(waveNumber);
      }

      if (upgrade && !usedIds.has(upgrade.id)) {
        upgrades.push(upgrade);
        usedIds.add(upgrade.id);
      }
    }

    return upgrades;
  }

  selectUpgrade(upgrade: UpgradeOption): void {
    this.onSelectUpgrade?.(upgrade);
  }

  private _selectUpgradeType(waveNumber: number): 'item' | 'stat' | 'weapon' {
    const rand = Math.random();

    if (waveNumber % 5 === 0) {
      return rand < 0.5 ? 'weapon' : 'item';
    }

    if (rand < 0.6) return 'item';
    if (rand < 0.85) return 'stat';
    return 'weapon';
  }

  private _generateItemUpgrade(usedIds: Set<string>, waveNumber: number): UpgradeOption | null {
    const tier = Math.min(3, Math.floor(waveNumber / 3) + 1);
    const availableItems = ITEMS.filter(
      (item) => item.tier <= tier && !usedIds.has(item.id)
    );

    if (availableItems.length === 0) return null;

    const item = randomFromArray(availableItems)!;
    const rarity = this._tierToRarity(item.tier);

    return {
      id: `item_${item.id}`,
      type: 'item',
      itemId: item.id,
      rarity,
    };
  }

  private _generateWeaponUpgrade(usedIds: Set<string>): UpgradeOption | null {
    const availableWeapons = WEAPONS.filter((w) => !usedIds.has(w.id));
    if (availableWeapons.length === 0) return null;

    const weapon = randomFromArray(availableWeapons)!;

    return {
      id: `weapon_${weapon.id}`,
      type: 'weapon',
      weaponId: weapon.id,
      rarity: 'uncommon',
    };
  }

  private _generateStatUpgrade(waveNumber: number): UpgradeOption {
    const stats = [
      { stat: 'maxHp' as const, value: 15, label: 'Max HP +15' },
      { stat: 'damage' as const, value: 3, label: 'Damage +3' },
      { stat: 'speed' as const, value: 0.3, label: 'Speed +0.3' },
      { stat: 'attackSpeed' as const, value: 0.15, label: 'Attack Speed +15%' },
      { stat: 'critChance' as const, value: 0.05, label: 'Crit Chance +5%' },
      { stat: 'armor' as const, value: 2, label: 'Armor +2' },
      { stat: 'range' as const, value: 1, label: 'Range +1' },
    ];

    const selected = randomFromArray(stats)!;

    return {
      id: `stat_${selected.stat}_${Math.random()}`,
      type: 'stat',
      statBoost: {
        stat: selected.stat,
        value: selected.value,
        type: selected.stat === 'attackSpeed' ? 'multiply' : 'add',
      },
      rarity: 'common',
    };
  }

  private _tierToRarity(tier: number): 'common' | 'uncommon' | 'rare' | 'legendary' {
    if (tier === 1) return 'common';
    if (tier === 2) return 'uncommon';
    if (tier === 3) return 'rare';
    return 'legendary';
  }
}
