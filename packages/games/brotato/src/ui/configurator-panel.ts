import { ITEMS } from '../config/items';
import { WEAPONS } from '../config/weapons';
import { ENEMIES } from '../config/enemies';
import { CHARACTERS } from '../config/characters';
import { t } from '../i18n';

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
      <h3 style="margin-top: 0;">${t('configurator.title')}</h3>
      <div style="display: flex; gap: 5px; margin-bottom: 15px; flex-wrap: wrap;">
        <button id="tab-items" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'items' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ${t('configurator.tabItems')}
        </button>
        <button id="tab-weapons" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'weapons' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ${t('configurator.tabWeapons')}
        </button>
        <button id="tab-enemies" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'enemies' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ${t('configurator.tabEnemies')}
        </button>
        <button id="tab-characters" style="flex: 1; padding: 8px; background: ${
          this._currentType === 'characters' ? '#2196F3' : '#555'
        }; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px;">
          ${t('configurator.tabCharacters')}
        </button>
      </div>
      <div id="config-content"></div>
      <button id="export-btn" style="width: 100%; padding: 10px; margin-top: 15px; background: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
        ${t('configurator.export')}
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
        <div style="font-weight: bold; margin-bottom: 5px;">${t(`items.${item.id}.name`, { defaultValue: item.name })}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${t(`items.${item.id}.description`, { defaultValue: item.description })}</div>
        <div style="font-size: 11px; color: #888;">
          ${t('configurator.tierEffects', { tier: item.tier, count: item.effects.length })}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderWeaponsList(): string {
    return WEAPONS.map(
      (weapon) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${t(`weapons.${weapon.id}.name`, { defaultValue: weapon.name })}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${t(`weapons.${weapon.id}.description`, { defaultValue: weapon.description })}</div>
        <div style="font-size: 11px; color: #888;">
          ${t('configurator.weaponStats', { dmg: weapon.damage, as: weapon.attackSpeed, range: weapon.range })}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderEnemiesList(): string {
    return ENEMIES.map(
      (enemy) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${t(`enemies.${enemy.id}.name`, { defaultValue: enemy.name })}</div>
        <div style="font-size: 11px; color: #888;">
          ${t('configurator.enemyStats', {
            hp: enemy.hp,
            dmg: enemy.damage,
            spd: enemy.speed,
            gold: enemy.goldDrop,
            xp: enemy.xpDrop,
          })}
        </div>
      </div>
    `
    ).join('');
  }

  private _renderCharactersList(): string {
    return CHARACTERS.map(
      (char) => `
      <div style="background: rgba(50, 50, 60, 0.5); padding: 10px; border-radius: 6px; margin-bottom: 8px;">
        <div style="font-weight: bold; margin-bottom: 5px;">${t(`characters.${char.id}.name`, { defaultValue: char.name })}</div>
        <div style="font-size: 12px; color: #aaa; margin-bottom: 5px;">${t(`characters.${char.id}.description`, { defaultValue: char.description })}</div>
        <div style="font-size: 11px; color: #888;">
          ${t('configurator.charStats', {
            hp: char.baseStats.maxHp,
            dmg: char.baseStats.damage,
            spd: char.baseStats.speed,
          })}
        </div>
      </div>
    `
    ).join('');
  }

  private _export(): void {
    let data: unknown;
    let labelKey: 'items' | 'weapons' | 'enemies' | 'characters';

    switch (this._currentType) {
      case 'items':
        data = ITEMS;
        labelKey = 'items';
        break;
      case 'weapons':
        data = WEAPONS;
        labelKey = 'weapons';
        break;
      case 'enemies':
        data = ENEMIES;
        labelKey = 'enemies';
        break;
      case 'characters':
        data = CHARACTERS;
        labelKey = 'characters';
        break;
    }

    const label = t(`configurator.labels.${labelKey}`);
    console.log(`${label}:`, JSON.stringify(data, null, 2));
    alert(t('configurator.exported', { label }));
  }

  dispose(): void {
    this._panel.remove();
  }
}
