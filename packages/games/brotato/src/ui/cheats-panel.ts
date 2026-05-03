import type { GameState } from '../game-state';
import { t } from '../i18n';

export class CheatsPanel {
  private _panel: HTMLDivElement;
  private _state: GameState;

  onGodMode: ((enabled: boolean) => void) | null = null;
  onKillAllEnemies: (() => void) | null = null;
  onCompleteWave: (() => void) | null = null;

  constructor(state: GameState) {
    this._state = state;
    this._panel = document.createElement('div');
    this._panel.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(255, 100, 0, 0.9);
      color: white;
      padding: 15px;
      border-radius: 8px;
      z-index: 2000;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      min-width: 200px;
    `;

    const title = document.createElement('div');
    title.style.cssText = 'font-weight: bold; margin-bottom: 10px; font-size: 16px;';
    title.textContent = t('cheats.title');
    this._panel.appendChild(title);

    this._addButton(t('cheats.gold100'), () => {
      this._state.addGold(100);
    });

    this._addButton(t('cheats.gold1000'), () => {
      this._state.addGold(1_000);
    });

    this._addButton(t('cheats.fullHp'), () => {
      const stats = this._state.stats;
      this._state.setStat('hp', stats.maxHp);
    });

    this._addButton(t('cheats.killAll'), () => {
      this.onKillAllEnemies?.();
    });

    this._addButton(t('cheats.completeWave'), () => {
      this.onCompleteWave?.();
    });

    this._addButton(t('cheats.damage10'), () => {
      const stats = this._state.stats;
      this._state.setStat('damage', stats.damage + 10);
    });

    this._addButton(t('cheats.speed1'), () => {
      const stats = this._state.stats;
      this._state.setStat('speed', stats.speed + 1);
    });

    const godModeCheckbox = document.createElement('label');
    godModeCheckbox.style.cssText = 'display: flex; align-items: center; margin-top: 10px; cursor: pointer;';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.style.cssText = 'margin-right: 8px; cursor: pointer;';
    checkbox.onchange = () => {
      this.onGodMode?.(checkbox.checked);
    };

    const label = document.createElement('span');
    label.textContent = t('cheats.godMode');

    godModeCheckbox.appendChild(checkbox);
    godModeCheckbox.appendChild(label);
    this._panel.appendChild(godModeCheckbox);

    document.body.appendChild(this._panel);
  }

  private _addButton(text: string, onClick: () => void): void {
    const btn = document.createElement('button');
    btn.textContent = text;
    btn.style.cssText = `
      width: 100%;
      padding: 8px;
      margin-top: 5px;
      background: rgba(0, 0, 0, 0.5);
      color: white;
      border: 1px solid rgba(255, 255, 255, 0.3);
      border-radius: 4px;
      cursor: pointer;
      font-size: 13px;
    `;
    btn.onmouseover = () => (btn.style.background = 'rgba(0, 0, 0, 0.7)');
    btn.onmouseout = () => (btn.style.background = 'rgba(0, 0, 0, 0.5)');
    btn.onclick = onClick;
    this._panel.appendChild(btn);
  }

  dispose(): void {
    this._panel.remove();
  }
}
