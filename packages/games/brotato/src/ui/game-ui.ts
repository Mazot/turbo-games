import type { GameState } from '../game-state';
import type { UpgradeOption } from '../types';
import { ITEMS } from '../config/items';
import { WEAPONS } from '../config/weapons';
import { t } from '../i18n';

export class GameUI {
  private _container: HTMLDivElement;
  private _hpBar: HTMLDivElement;
  private _hpText: HTMLSpanElement;
  private _goldText: HTMLSpanElement;
  private _waveText: HTMLSpanElement;
  private _upgradePanel: HTMLDivElement;
  private _gameOverPanel: HTMLDivElement;
  private _state: GameState;

  onUpgradeSelect: ((upgrade: UpgradeOption) => void) | null = null;
  onRestart: (() => void) | null = null;

  constructor(state: GameState) {
    this._state = state;
    this._container = document.createElement('div');
    this._container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
      font-family: system-ui, sans-serif;
    `;
    document.body.appendChild(this._container);

    const hud = document.createElement('div');
    hud.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 15px;
      border-radius: 8px;
      min-width: 200px;
    `;
    this._container.appendChild(hud);

    this._hpText = document.createElement('span');
    this._hpText.textContent = '100 / 100';

    this._hpBar = document.createElement('div');
    this._hpBar.style.cssText = `
      width: 100%;
      height: 20px;
      background: rgba(255, 0, 0, 0.3);
      border-radius: 4px;
      margin-top: 5px;
      overflow: hidden;
    `;
    const hpFill = document.createElement('div');
    hpFill.style.cssText = `
      width: 100%;
      height: 100%;
      background: #ff0000;
      transition: width 0.2s;
    `;
    hpFill.id = 'hp-fill';
    this._hpBar.appendChild(hpFill);

    const hpLabel = document.createElement('div');
    hpLabel.style.cssText = 'margin-bottom: 5px; display: flex; justify-content: space-between;';
    hpLabel.innerHTML = `<strong>${t('ui.hp')}</strong>`;
    hpLabel.appendChild(this._hpText);

    hud.appendChild(hpLabel);
    hud.appendChild(this._hpBar);

    this._goldText = document.createElement('div');
    this._goldText.style.cssText = 'margin-top: 10px;';
    this._goldText.innerHTML = `<strong>${t('ui.gold')}</strong> 0`;
    hud.appendChild(this._goldText);

    this._waveText = document.createElement('div');
    this._waveText.style.cssText = 'margin-top: 5px;';
    this._waveText.innerHTML = `<strong>${t('ui.wave')}</strong> 0`;
    hud.appendChild(this._waveText);

    this._upgradePanel = document.createElement('div');
    this._upgradePanel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 20, 30, 0.95);
      color: white;
      padding: 30px;
      border-radius: 12px;
      display: none;
      pointer-events: auto;
      min-width: 600px;
    `;
    this._container.appendChild(this._upgradePanel);

    this._gameOverPanel = document.createElement('div');
    this._gameOverPanel.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(20, 20, 30, 0.95);
      color: white;
      padding: 40px;
      border-radius: 12px;
      display: none;
      pointer-events: auto;
      text-align: center;
      min-width: 400px;
    `;
    this._container.appendChild(this._gameOverPanel);

    this._state.events.on('gold:change', (gold: number) => {
      this._goldText.innerHTML = `<strong>${t('ui.gold')}</strong> ${gold}`;
    });

    this._state.events.on('wave:start', (wave: number) => {
      this._waveText.innerHTML = `<strong>${t('ui.wave')}</strong> ${wave}`;
    });
  }

  updateHP(current: number, max: number): void {
    this._hpText.textContent = `${Math.round(current)} / ${max}`;
    const percent = (current / max) * 100;
    const fill = this._hpBar.querySelector('#hp-fill') as HTMLDivElement;
    if (fill) {
      fill.style.width = `${percent}%`;
    }
  }

  showUpgradePanel(upgrades: UpgradeOption[]): void {
    this._upgradePanel.innerHTML = `<h2 style="margin-top: 0; margin-bottom: 20px;">${t('ui.chooseUpgrade')}</h2>`;

    const grid = document.createElement('div');
    grid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px;';

    for (const upgrade of upgrades) {
      const card = this._createUpgradeCard(upgrade);
      grid.appendChild(card);
    }

    this._upgradePanel.appendChild(grid);
    this._upgradePanel.style.display = 'block';
  }

  hideUpgradePanel(): void {
    this._upgradePanel.style.display = 'none';
  }

  showGameOver(wave: number, gold: number): void {
    this._gameOverPanel.innerHTML = `
      <h1 style="margin-top: 0; color: #ff4444;">${t('ui.gameOver')}</h1>
      <p style="font-size: 20px; margin: 20px 0;">${t('ui.waveReached', { wave })}</p>
      <p style="font-size: 18px; margin: 20px 0;">${t('ui.goldCollected', { gold })}</p>
    `;

    const restartBtn = document.createElement('button');
    restartBtn.textContent = t('ui.restart');
    restartBtn.style.cssText = `
      padding: 12px 30px;
      font-size: 18px;
      background: #4CAF50;
      color: white;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      margin-top: 20px;
    `;
    restartBtn.onmouseover = () => (restartBtn.style.background = '#45a049');
    restartBtn.onmouseout = () => (restartBtn.style.background = '#4CAF50');
    restartBtn.onclick = () => {
      this._gameOverPanel.style.display = 'none';
      this.onRestart?.();
    };

    this._gameOverPanel.appendChild(restartBtn);
    this._gameOverPanel.style.display = 'block';
  }

  private _createUpgradeCard(upgrade: UpgradeOption): HTMLDivElement {
    const card = document.createElement('div');
    const rarityColors = {
      common: '#888',
      uncommon: '#4CAF50',
      rare: '#2196F3',
      legendary: '#FF9800',
    };

    card.style.cssText = `
      background: rgba(40, 40, 50, 0.9);
      border: 2px solid ${rarityColors[upgrade.rarity]};
      border-radius: 8px;
      padding: 15px;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    `;

    card.onmouseover = () => {
      card.style.transform = 'scale(1.05)';
      card.style.boxShadow = `0 0 20px ${rarityColors[upgrade.rarity]}`;
    };
    card.onmouseout = () => {
      card.style.transform = 'scale(1)';
      card.style.boxShadow = 'none';
    };

    card.onclick = () => {
      this.onUpgradeSelect?.(upgrade);
      this.hideUpgradePanel();
    };

    let title = '';
    let description = '';

    if (upgrade.type === 'item' && upgrade.itemId) {
      const item = ITEMS.find((i) => i.id === upgrade.itemId);
      if (item) {
        title = t(`items.${item.id}.name`, { defaultValue: item.name });
        description = t(`items.${item.id}.description`, { defaultValue: item.description });
      }
    } else if (upgrade.type === 'weapon' && upgrade.weaponId) {
      const weapon = WEAPONS.find((w) => w.id === upgrade.weaponId);
      if (weapon) {
        title = t(`weapons.${weapon.id}.name`, { defaultValue: weapon.name });
        description = t(`weapons.${weapon.id}.description`, { defaultValue: weapon.description });
      }
    } else if (upgrade.type === 'stat' && upgrade.statBoost) {
      const boost = upgrade.statBoost;
      title = t('ui.statBoostTitle', {
        stat: t(`statNames.${String(boost.stat)}`, { defaultValue: String(boost.stat) }),
      });
      description = `${boost.type === 'add' ? '+' : '×'}${boost.value}`;
    }

    card.innerHTML = `
      <div style="font-size: 14px; color: ${rarityColors[upgrade.rarity]}; margin-bottom: 8px;">
        ${t(`rarity.${upgrade.rarity}`)}
      </div>
      <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px;">${title}</div>
      <div style="font-size: 14px; color: #ccc;">${description}</div>
    `;

    return card;
  }

  dispose(): void {
    this._container.remove();
  }
}
