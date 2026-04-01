import type { AdManager } from '@turbo-games/ads';
import { makeEl, formatNumber } from '@turbo-games/ui';
import type { GameState } from '../game-state';
import { ASSETS, BACKGROUNDS_ASSETS, BOOST_CONFIG } from '../config';
import { RouletteModal } from './roulette-modal';

export class GameUI {
  private root: HTMLDivElement;
  private scoreEl!: HTMLElement;
  private ppcEl!: HTMLElement;
  private boostEl!: HTMLElement;
  private shopOverlay: HTMLDivElement | null = null;
  private boostInterval: ReturnType<typeof setInterval> | null = null;
  private rouletteModal: RouletteModal;

  constructor(
    private state: GameState,
    private adManager: AdManager,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'game-ui';
    document.body.appendChild(this.root);

    this.rouletteModal = new RouletteModal(state, adManager);

    this.injectStyles();
    this.buildUI();
    this.bindStateEvents();
    this.updateScore();
    this.startBoostTimer();
  }

  showFloatText(points: number): void {
    const container = this.root.querySelector('#float-container')!;
    const text = document.createElement('div');
    text.className = 'float-text';
    text.textContent = `+${points}`;
    const offsetX = (Math.random() - 0.5) * 80;
    text.style.left = `calc(50% + ${offsetX}px)`;
    container.appendChild(text);
    text.addEventListener('animationend', () => text.remove());
  }

  destroy(): void {
    if (this.boostInterval !== null) clearInterval(this.boostInterval);
    this.rouletteModal.close();
    this.root.remove();
    const style = document.getElementById('game-ui-styles');
    style?.remove();
  }

  private buildUI(): void {
    const scorePanel = makeEl('div', 'score-panel');
    this.scoreEl = makeEl('div', 'score-value');
    this.ppcEl = makeEl('div', 'ppc-value');
    scorePanel.append(this.scoreEl, this.ppcEl);

    this.boostEl = makeEl('div', 'boost-indicator hidden');

    const floatContainer = makeEl('div', 'float-container');
    floatContainer.id = 'float-container';

    const bottomBar = makeEl('div', 'bottom-bar');
    const btnAd = this.makeButton(`📺 Bonus x${BOOST_CONFIG.multiplier}`, () => this.onAdClick());
    const btnAssets = this.makeButton('🎨 Assets', () => this.openAssetsShop());
    const btnBgs = this.makeButton('🖼️ Backgrounds', () => this.openBgsShop());
    const btnRoulette = this.makeButton('🎰 Roulette', () => this.rouletteModal.open());
    bottomBar.append(btnAd, btnAssets, btnBgs, btnRoulette);

    this.root.append(scorePanel, this.boostEl, floatContainer, bottomBar);
  }

  private makeButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'bar-btn';
    btn.textContent = label;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private updateScore(): void {
    this.scoreEl.textContent = `⭐ ${formatNumber(this.state.score)}`;
    this.ppcEl.textContent = `+${this.state.pointsPerClick} per click`;
  }

  private startBoostTimer(): void {
    this.boostInterval = setInterval(() => {
      if (this.state.boostActive) {
        const sec = Math.ceil(this.state.boostRemainingMs / 1000);
        this.boostEl.textContent = `🔥 Bonus x${BOOST_CONFIG.multiplier} (${sec}s)`;
        this.boostEl.classList.remove('hidden');
      } else {
        this.boostEl.classList.add('hidden');
      }
      this.updateScore();
    }, 250);
  }

  private async onAdClick(): Promise<void> {
    if (this.state.boostActive) return;

    if (this.adManager.isAvailable('rewarded')) {
      const success = await this.adManager.show('rewarded');
      if (success) this.state.activateBoost();
    } else {
      // Dev mode: activate boost without ads
      this.state.activateBoost();
    }
  }

  private openAssetsShop(): void {
    this.closeShop();
    const overlay = makeEl('div', 'shop-overlay');
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) this.closeShop();
      e.stopPropagation();
    });

    const panel = makeEl('div', 'shop-panel');
    const titleBar = makeEl('div', 'shop-title');
    titleBar.textContent = '🎨 Asset Shop';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'shop-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.closeShop();
    });
    titleBar.appendChild(closeBtn);

    const list = makeEl('div', 'shop-list');
    ASSETS.forEach((_, i) => list.appendChild(this.buildAssetRow(i)));

    panel.append(titleBar, list);
    overlay.appendChild(panel);
    this.root.appendChild(overlay);
    this.shopOverlay = overlay;
  }

  /** Builds one row in the asset shop for asset at the given index. */
  private buildAssetRow(i: number): HTMLElement {
    const asset = ASSETS[i];
    const isUnlocked = this.state.isAssetUnlocked(i);
    const isCurrent = this.state.currentAsset === i;
    const currentLevel = this.state.getAssetLevel(i);
    const maxLevel = asset.levels.length - 1;
    const levelData = asset.levels[isUnlocked ? currentLevel : 0];

    const row = makeEl('div', 'shop-item');

    const img = document.createElement('img');
    img.src = levelData.image;
    img.alt = asset.name;
    img.className = 'shop-item-img';

    const info = makeEl('div', 'shop-item-info');
    const nameEl = makeEl('span', 'shop-item-name');
    nameEl.textContent = asset.name;
    info.appendChild(nameEl);
    if (isUnlocked) {
      const levelEl = makeEl('span', 'shop-item-level');
      levelEl.textContent = `Lv ${currentLevel + 1} / ${asset.levels.length}  ·  +${levelData.pointsPerClick}/click`;
      info.appendChild(levelEl);
    }

    const actions = makeEl('div', 'shop-item-actions');

    if (isUnlocked) {
      if (currentLevel < maxLevel) {
        const nextCost = asset.levels[currentLevel + 1].upgradeCost;
        const canAfford = this.state.score >= nextCost;
        const upgradeBtn = document.createElement('button');
        upgradeBtn.className = `shop-action${canAfford ? ' buy' : ' locked'}`;
        upgradeBtn.textContent = `↑ ${formatNumber(nextCost)}⭐`;
        upgradeBtn.disabled = !canAfford;
        upgradeBtn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          if (this.state.upgradeAsset(i)) {
            this.closeShop();
            this.openAssetsShop();
          }
        });
        actions.appendChild(upgradeBtn);
      } else {
        const maxBadge = makeEl('span', 'shop-max-badge');
        maxBadge.textContent = 'MAX';
        actions.appendChild(maxBadge);
      }

      const actionBtn = document.createElement('button');
      if (isCurrent) {
        actionBtn.className = 'shop-action current';
        actionBtn.textContent = '✓';
        actionBtn.disabled = true;
      } else {
        actionBtn.className = 'shop-action select';
        actionBtn.textContent = 'Select';
        actionBtn.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.state.selectAsset(i);
          this.closeShop();
          this.openAssetsShop();
        });
      }
      actions.appendChild(actionBtn);
    } else {
      const canAfford = this.state.score >= asset.unlockCost;
      const unlockBtn = document.createElement('button');
      unlockBtn.className = `shop-action${canAfford ? ' buy' : ' locked'}`;
      unlockBtn.textContent = `${formatNumber(asset.unlockCost)}⭐`;
      unlockBtn.disabled = !canAfford;
      unlockBtn.addEventListener('pointerdown', (e) => {
        e.stopPropagation();
        if (this.state.buyAsset(i)) {
          this.closeShop();
          this.openAssetsShop();
        }
      });
      actions.appendChild(unlockBtn);
    }

    row.append(img, info, actions);
    return row;
  }

  private openBgsShop(): void {
    this.closeShop();
    const overlay = makeEl('div', 'shop-overlay');
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) this.closeShop();
      e.stopPropagation();
    });

    const panel = makeEl('div', 'shop-panel');
    const titleBar = makeEl('div', 'shop-title');
    titleBar.textContent = '🖼️ Background Shop';
    const closeBtn = document.createElement('button');
    closeBtn.className = 'shop-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.closeShop();
    });
    titleBar.appendChild(closeBtn);

    const list = makeEl('div', 'shop-list');
    BACKGROUNDS_ASSETS.forEach((bg, i) => {
      const row = makeEl('div', 'shop-item');

      const img = document.createElement('img');
      img.src = bg.image;
      img.alt = bg.name;
      img.className = 'shop-item-img';

      const info = makeEl('div', 'shop-item-info');
      const nameEl = makeEl('span', 'shop-item-name');
      nameEl.textContent = bg.name;
      info.appendChild(nameEl);

      const action = document.createElement('button');
      action.className = 'shop-action';
      const isUnlocked = this.state.isBackgroundUnlocked(i);
      const isCurrent = this.state.currentBackground === i;

      if (isCurrent) {
        action.textContent = '✓ Selected';
        action.classList.add('current');
        action.disabled = true;
      } else if (isUnlocked) {
        action.textContent = 'Select';
        action.classList.add('select');
        action.addEventListener('pointerdown', (e) => {
          e.stopPropagation();
          this.state.selectBackground(i);
          this.closeShop();
          this.openBgsShop();
        });
      } else {
        action.textContent = `${formatNumber(bg.cost)}⭐`;
        if (this.state.score >= bg.cost) {
          action.classList.add('buy');
          action.addEventListener('pointerdown', (e) => {
            e.stopPropagation();
            if (this.state.buyBackground(i)) {
              this.closeShop();
              this.openBgsShop();
            }
          });
        } else {
          action.classList.add('locked');
          action.disabled = true;
        }
      }

      row.append(img, info, action);
      list.appendChild(row);
    });

    panel.append(titleBar, list);
    overlay.appendChild(panel);
    this.root.appendChild(overlay);
    this.shopOverlay = overlay;
  }

  private closeShop(): void {
    if (this.shopOverlay) {
      this.shopOverlay.remove();
      this.shopOverlay = null;
    }
  }

  private bindStateEvents(): void {
    this.state.events.on('score:change', () => this.updateScore());
  }

  private injectStyles(): void {
    if (document.getElementById('game-ui-styles')) return;
    const style = document.createElement('style');
    style.id = 'game-ui-styles';
    style.textContent = UI_CSS;
    document.head.appendChild(style);
  }
}

const UI_CSS = /* css */ `
  #game-ui {
    position: fixed;
    inset: 0;
    pointer-events: none;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    z-index: 100;
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }

  #game-ui * {
    pointer-events: auto;
  }

  .score-panel {
    position: absolute;
    top: 24px;
    left: 24px;
    text-align: left;
    pointer-events: none;
  }

  .score-value {
    font-size: 38px;
    font-weight: 800;
    color: #fff;
    text-shadow: 0 0 24px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.5);
    display: block;
    letter-spacing: -0.5px;
  }

  .ppc-value {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.55);
    margin-top: 4px;
    display: block;
  }

  .boost-indicator {
    position: absolute;
    top: 100px;
    left: 24px;
    background: linear-gradient(135deg, rgba(255,80,0,0.9), rgba(255,160,0,0.9));
    color: #fff;
    padding: 8px 24px;
    border-radius: 24px;
    font-size: 16px;
    font-weight: 700;
    animation: boostPulse 1s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(255,100,0,0.4);
    white-space: nowrap;
  }

  .boost-indicator.hidden { display: none; }

  @keyframes boostPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.06); }
  }

  .float-container {
    position: absolute;
    inset: 0;
    pointer-events: none !important;
    overflow: hidden;
  }

  .float-container * {
    pointer-events: none !important;
  }

  .float-text {
    position: absolute;
    top: 55%;
    font-size: 30px;
    font-weight: 800;
    color: #ffd700;
    text-shadow: 0 0 12px rgba(255, 215, 0, 0.7), 0 2px 4px rgba(0,0,0,0.4);
    animation: floatUp 0.8s ease-out forwards;
  }

  @keyframes floatUp {
    0% { opacity: 1; transform: translateY(0) scale(1); }
    100% { opacity: 0; transform: translateY(-90px) scale(1.4); }
  }

  .bottom-bar {
    position: absolute;
    bottom: 28px;
    left: 24px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .bar-btn {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
    padding: 14px 22px;
    border-radius: 18px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    font-family: inherit;
    white-space: nowrap;
  }

  .bar-btn:hover {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.3);
  }

  .bar-btn:active {
    transform: translateY(0);
  }

  /* Shop overlay */
  .shop-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.55);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
  }

  .shop-panel {
    background: rgba(22, 22, 40, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 28px;
    min-width: 320px;
    max-width: 400px;
    max-height: 70vh;
    overflow-y: auto;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  }

  .shop-title {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .shop-close {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: rgba(255,255,255,0.7);
    width: 36px;
    height: 36px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    transition: background 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .shop-close:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
  }

  .shop-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .shop-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 14px;
    transition: background 0.15s;
    gap: 12px;
  }

  .shop-item:hover {
    background: rgba(255, 255, 255, 0.09);
  }

  .shop-item-info {
    color: #fff;
    font-size: 15px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    flex: 1;
    min-width: 0;
  }

  .shop-item-name {
    font-size: 14px;
    font-weight: 600;
    color: #fff;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .shop-item-level {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.45);
    margin-top: 2px;
    white-space: nowrap;
  }

  .shop-item-actions {
    display: flex;
    gap: 6px;
    align-items: center;
    flex-shrink: 0;
  }

  .shop-max-badge {
    font-size: 11px;
    font-weight: 700;
    color: #ffd700;
    background: rgba(255, 215, 0, 0.1);
    padding: 4px 8px;
    border-radius: 8px;
    white-space: nowrap;
  }

  .shop-item-img {
    width: 28px;
    height: 28px;
    object-fit: contain;
    flex-shrink: 0;
  }

  .color-swatch {
    display: inline-block;
    width: 22px;
    height: 22px;
    border-radius: 7px;
    border: 1px solid rgba(255,255,255,0.2);
    flex-shrink: 0;
  }

  .shop-action {
    border: none;
    padding: 8px 18px;
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    font-family: inherit;
    white-space: nowrap;
    flex-shrink: 0;
  }

  .shop-action.current {
    background: rgba(100, 255, 100, 0.15);
    color: #7fff7f;
    cursor: default;
  }

  .shop-action.select {
    background: rgba(100, 150, 255, 0.25);
    color: #8ab4ff;
  }

  .shop-action.select:hover {
    background: rgba(100, 150, 255, 0.4);
    transform: scale(1.04);
  }

  .shop-action.buy {
    background: rgba(255, 215, 0, 0.2);
    color: #ffd700;
  }

  .shop-action.buy:hover {
    background: rgba(255, 215, 0, 0.4);
    transform: scale(1.04);
  }

  .shop-action.locked {
    background: rgba(255, 255, 255, 0.04);
    color: rgba(255, 255, 255, 0.25);
    cursor: not-allowed;
  }
`;
