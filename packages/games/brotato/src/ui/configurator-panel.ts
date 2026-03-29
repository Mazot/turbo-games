import type { ItemConfig, WeaponConfig, EnemyConfig, CharacterConfig } from '../types';
import { ITEMS } from '../config/items';
import { WEAPONS } from '../config/weapons';
import { ENEMIES } from '../config/enemies';
import { CHARACTERS } from '../config/characters';

type ConfigType = 'items' | 'weapons' | 'enemies' | 'characters';

export class ConfiguratorPanel {
  private _panel: HTMLDivElement;
  private _currentType: ConfigType = 'items';

  constructor() {
    this._panel = document.createElement('div');
    this._panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(30, 30, 40, 0.95);
      color: white;
      padding: 20px;
      border-radius: 12px;
      z-index: 3000;
      font-family: system-ui, sans-serif;
      min-width: 300px;
      max-height: 70vh;
      overflow-y: auto;
      display: none;
    `;

    this._renderPanel();
    document.body.appendChild(this._panel);
  }

  show(): void {
    this._panel.style.display = 'block';
  }

  hide(): void {
    this._panel.style.display = 'none';
  }

  private _renderPanel(): void {
    this._panel.innerHTML = `
      <h3 style="margin-top: 0;">🔧 Configurator</h3>
      <div style="display: flex; gap: 5px; margin-bottom: 15px; flex-wrap: wrap;">
        <button id="tab-items" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'items' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Items
        </button>
        <button id="tab-weapons" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'weapons' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Weapons
        </button>
        <button id="tab-enemies" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'enemies' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Enemies
        </button>
        <button id="tab-characters" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'characters' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          Characters
        </button>
      </div>
      <div id="config-content"></div>
      <button id="export-btn" style="width: 100%; padding: 10px; margin-top: 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
        Export to Console
      </button>
    `;

    this._panel.querySelector('#tab-items')!.addEventListener('click', () => {
      this._currentType = 'items';
      this._renderPanel();
    });

    this._panel.querySelector('#tab-weapons')!.addEventListener('click', () => {
      this._currentType = 'weapons';
      this._renderPanel();
    });

    this._panel.querySelector('#tab-enemies')!.addEventListener('click', () => {
      this._currentType = 'enemies';
      this._renderPanel();
    });

    this._panel.querySelector('#tab-characters')!.addEventListener('click', () => {
      this._currentType = 'characters';
      this._renderPanel();
    });

    this._panel.querySelector('#export-btn')!.addEventListener('click', () => {
      this._export();
    });

    this._renderContent();
  }

  private _renderContent(): void {
    const container = this._panel.querySelector('#config-content') as HTMLDivElement;

    if (this._currentType === 'items') {
      container.innerHTML = this._renderItemsList();
    } else if (this._currentType === 'weapons') {
      container.innerHTML = this._renderWeaponsList();
    } else if (this._currentType === 'enemies') {
      container.innerHTML = this._renderEnemiesList();
    } else {
      container.innerHTML = this._renderCharactersList();
    }
  }

  private _renderItemsList(): string {
    return ITEMS.map(
      (item) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${item.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${item.description}</div>
        <div style="font-size: 11px; color: #888;">
          Tier: ${item.tier} | Effects: ${item.effects.length}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderWeaponsList(): string {
    return WEAPONS.map(
      (weapon) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${weapon.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${weapon.description}</div>
        <div style="font-size: 11px; color: #888;">
          DMG: ${weapon.damage} | AS: ${weapon.attackSpeed} | Range: ${weapon.range}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderEnemiesList(): string {
    return ENEMIES.map(
      (enemy) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${enemy.name}</div>
        <div style="font-size: 11px; color: #888;">
          HP: ${enemy.hp} | DMG: ${enemy.damage} | Speed: ${enemy.speed}<br>
          Gold: ${enemy.goldDrop} | XP: ${enemy.xpDrop}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderCharactersList(): string {
    return CHARACTERS.map(
      (char) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${char.name}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${char.description}</div>
        <div style="font-size: 11px; color: #888;">
          HP: ${char.baseStats.maxHp} | DMG: ${char.baseStats.damage} | Speed: ${char.baseStats.speed}
        </div>
      </div>
    `
    ).join('');
  }

  private _export(): void {
    let data: unknown;
    let label: string;

    switch (this._currentType) {
      case 'items':
        data = ITEMS;
        label = 'Items';
        break;
      case 'weapons':
        data = WEAPONS;
        label = 'Weapons';
        break;
      case 'enemies':
        data = ENEMIES;
        label = 'Enemies';
        break;
      case 'characters':
        data = CHARACTERS;
        label = 'Characters';
        break;
    }

    console.log(`${label} Configuration:`, JSON.stringify(data, null, 2));
    alert(`${label} configuration exported to console!`);
  }

  dispose(): void {
    this._panel.remove();
  }
}
