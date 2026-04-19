import type { AdManager } from '@turbo-games/ads';
import { makeEl, formatNumber } from '@turbo-games/ui';
import type { GameState } from '../game-state';
import { ASSETS, AUTOCLICK_CONFIG, BACKGROUNDS_ASSETS, BOOST_CONFIG } from '../config';
import { RouletteModal } from './roulette-modal';

export class GameUI {
  private root: HTMLDivElement;
  private scoreEl!: HTMLElement;
  private ppcEl!: HTMLElement;
  private boostEl!: HTMLElement;
  private autoclickEl!: HTMLElement;
  private statusBubbles!: HTMLElement;
  private shopOverlay: HTMLDivElement | null = null;
  private boostInterval: ReturnType<typeof setInterval> | null = null;
  private autoclickInterval: ReturnType<typeof setInterval> | null = null;
  private rouletteModal: RouletteModal;

  // Click fever system
  private feverBarEl!: HTMLElement;
  private feverFillEl!: HTMLElement;
  private feverGlowEl!: HTMLElement;
  private feverParticlesEl!: HTMLElement;
  private feverConfettiEl!: HTMLElement;
  private feverMeter = 0; // 0..1
  private feverClickTimes: number[] = [];
  private feverDecayInterval: ReturnType<typeof setInterval> | null = null;

  // Golden sparkle gradient at the bottom edge (masks sprite cut-off)
  private goldGlowEl!: HTMLElement;
  private goldSparkleInterval: ReturnType<typeof setInterval> | null = null;

  /**
   * Optional callback fired on each auto-click tick.
   * Wire this in main.ts to play sound and trigger the sprite animation,
   * replicating the effects of a real click.
   */
  onAutoClickEffect: (() => void) | null = null;

  /** Optional callback fired when the user toggles background music on/off. */
  onMusicToggle: (() => void) | null = null;

  private musicEnabled: boolean;
  private musicBtn!: HTMLButtonElement;

  // Bottom bar buttons (kept for affordability glow updates)
  private btnAd!: HTMLButtonElement;
  private btnAutoclick!: HTMLButtonElement;
  private btnAssets!: HTMLButtonElement;
  private btnBgs!: HTMLButtonElement;

  // Upgrade prompt
  private upgradePromptEl: HTMLElement | null = null;
  private upgradePromptDismissed = -1; // index of upgrade cost already prompted

  // Choice popup (bonus/autoclick buy or watch ad)
  private choicePopupEl: HTMLElement | null = null;

  constructor(
    private state: GameState,
    private adManager: AdManager,
    initialMusicEnabled = true,
  ) {
    this.musicEnabled = initialMusicEnabled;
    this.root = document.createElement('div');
    this.root.id = 'game-ui';
    document.body.appendChild(this.root);

    this.rouletteModal = new RouletteModal(state, adManager);

    this.injectStyles();
    this.buildUI();
    this.bindStateEvents();
    this.updateScore();
    this.startBoostTimer();
    this.startAutoclickTimer();
    this.startFeverDecay();
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
    if (this.autoclickInterval !== null) clearInterval(this.autoclickInterval);
    if (this.feverDecayInterval !== null) clearInterval(this.feverDecayInterval);
    if (this.goldSparkleInterval !== null) clearInterval(this.goldSparkleInterval);
    this.goldGlowEl.remove();
    this.closeChoicePopup();
    this.closeUpgradePrompt();
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
    this.autoclickEl = makeEl('div', 'autoclick-indicator hidden');
    this.statusBubbles = makeEl('div', 'status-bubbles');
    this.statusBubbles.append(this.boostEl, this.autoclickEl);

    // Fever bar
    this.feverBarEl = makeEl('div', 'fever-bar');
    this.feverFillEl = makeEl('div', 'fever-fill');
    this.feverGlowEl = makeEl('div', 'fever-glow');
    this.feverParticlesEl = makeEl('div', 'fever-particles');
    this.feverConfettiEl = makeEl('div', 'fever-confetti');
    this.feverBarEl.append(this.feverFillEl, this.feverGlowEl, this.feverParticlesEl);

    // Golden sparkle gradient — appended directly to body to guarantee it sits above the WebGPU canvas
    this.goldGlowEl = makeEl('div', 'gold-glow');
    const goldSparklesEl = makeEl('div', 'gold-sparkles');
    this.goldGlowEl.appendChild(goldSparklesEl);
    this.startGoldSparkles(goldSparklesEl);
    document.body.appendChild(this.goldGlowEl);

    const floatContainer = makeEl('div', 'float-container');
    floatContainer.id = 'float-container';

    const bottomBar = makeEl('div', 'bottom-bar');
    this.btnAd = this.makeButton(`📺 Bonus x${BOOST_CONFIG.multiplier}`, () =>
      this.showBonusChoice(),
    );
    this.btnAutoclick = this.makeButton('🤖 Auto-click', () => this.showAutoclickChoice());
    this.btnAssets = this.makeButton('🎨 Assets', () => this.openAssetsShop());
    this.btnBgs = this.makeButton('🖼️ Backgrounds', () => this.openBgsShop());
    const btnRoulette = this.makeButton('🎰 Roulette', () => this.rouletteModal.open());
    bottomBar.append(this.btnAd, this.btnAutoclick, this.btnAssets, this.btnBgs, btnRoulette);

    this.musicBtn = document.createElement('button');
    this.musicBtn.className = 'music-btn';
    this.musicBtn.title = 'Toggle music';
    this.updateMusicBtn();
    this.musicBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.musicEnabled = !this.musicEnabled;
      this.updateMusicBtn();
      this.onMusicToggle?.();
    });

    this.root.append(
      scorePanel,
      this.statusBubbles,
      this.feverBarEl,
      this.feverConfettiEl,
      floatContainer,
      bottomBar,
      this.musicBtn,
    );
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

  private updateMusicBtn(): void {
    this.musicBtn.textContent = this.musicEnabled ? '🎵' : '🔇';
  }

  private updateScore(): void {
    this.scoreEl.textContent = `⭐ ${formatNumber(this.state.score)}`;
    this.ppcEl.textContent = `+${this.state.pointsPerClick} per click`;
    this.updateAffordabilityGlows();
    this.checkUpgradePrompt();
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

  // ── Bonus / Autoclick Choice Popup ──────────────────────────────

  private showBonusChoice(): void {
    if (this.state.boostActive) return;
    this.showChoicePopup({
      title: `🔥 Bonus x${BOOST_CONFIG.multiplier}`,
      cost: BOOST_CONFIG.cost,
      canAfford: this.state.score >= BOOST_CONFIG.cost,
      onAd: async () => {
        const success = await this.adManager.show('rewarded');
        if (success || !this.adManager.isAvailable('rewarded')) this.state.activateBoost();
      },
      onBuy: () => {
        if (this.state.score >= BOOST_CONFIG.cost) {
          this.state.spendPoints(BOOST_CONFIG.cost);
          this.state.activateBoost();
        }
      },
    });
  }

  private showAutoclickChoice(): void {
    if (this.state.autoclickActive) return;
    this.showChoicePopup({
      title: '🤖 Auto-click',
      cost: AUTOCLICK_CONFIG.cost,
      canAfford: this.state.score >= AUTOCLICK_CONFIG.cost,
      onAd: async () => {
        const success = await this.adManager.show('rewarded');
        if (success || !this.adManager.isAvailable('rewarded')) this.state.activateAutoclick();
      },
      onBuy: () => {
        if (this.state.score >= AUTOCLICK_CONFIG.cost) {
          this.state.spendPoints(AUTOCLICK_CONFIG.cost);
          this.state.activateAutoclick();
        }
      },
    });
  }

  private showChoicePopup(opts: {
    title: string;
    cost: number;
    canAfford: boolean;
    onAd: () => Promise<void>;
    onBuy: () => void;
  }): void {
    this.closeChoicePopup();

    const popup = makeEl('div', 'choice-popup');
    const title = makeEl('div', 'choice-popup-title');
    title.textContent = opts.title;

    const btnAd = document.createElement('button');
    btnAd.className = 'choice-btn choice-btn-ad';
    btnAd.textContent = '📺 Смотреть рекламу';
    btnAd.disabled = true; // prevent tap-through

    const btnBuy = document.createElement('button');
    btnBuy.className = `choice-btn choice-btn-buy${opts.canAfford ? '' : ' locked'}`;
    btnBuy.textContent = `⭐ Купить за ${formatNumber(opts.cost)}`;
    btnBuy.disabled = true;

    const btnClose = document.createElement('button');
    btnClose.className = 'choice-close';
    btnClose.textContent = '✕';

    popup.append(title, btnAd, btnBuy, btnClose);
    this.root.appendChild(popup);
    this.choicePopupEl = popup;

    // Delay to avoid accidental taps (400ms)
    const enableAt = Date.now() + 400;

    const tryEnable = () => {
      if (Date.now() >= enableAt) {
        btnAd.disabled = false;
        btnBuy.disabled = !opts.canAfford;
      } else {
        requestAnimationFrame(tryEnable);
      }
    };
    requestAnimationFrame(tryEnable);

    btnAd.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (btnAd.disabled) return;
      this.closeChoicePopup();
      opts.onAd();
    });

    btnBuy.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (btnBuy.disabled || !opts.canAfford) return;
      this.closeChoicePopup();
      opts.onBuy();
    });

    btnClose.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.closeChoicePopup();
    });

    // Close on outside tap
    setTimeout(() => {
      const outsideHandler = (e: PointerEvent) => {
        if (!popup.contains(e.target as Node)) {
          this.closeChoicePopup();
          document.removeEventListener('pointerdown', outsideHandler);
        }
      };
      document.addEventListener('pointerdown', outsideHandler);
    }, 450);
  }

  private closeChoicePopup(): void {
    this.choicePopupEl?.remove();
    this.choicePopupEl = null;
  }

  // ── Upgrade Prompt ───────────────────────────────────────────────

  private checkUpgradePrompt(): void {
    const asset = ASSETS[this.state.currentAsset];
    const lvl = this.state.getAssetLevel(this.state.currentAsset);
    const maxLevel = asset.levels.length - 1;
    if (lvl >= maxLevel) return;

    const cost = asset.levels[lvl + 1].upgradeCost;
    if (this.state.score < cost) return;
    if (this.upgradePromptDismissed === cost) return;
    if (this.upgradePromptEl) return;

    this.upgradePromptDismissed = cost;

    const toast = makeEl('div', 'upgrade-toast');
    toast.innerHTML = `
      <span class="upgrade-toast-text">⬆️ Прокачай ${asset.name}!</span>
      <button class="upgrade-toast-btn">Апгрейд</button>
      <button class="upgrade-toast-dismiss">✕</button>
    `;
    this.root.appendChild(toast);
    this.upgradePromptEl = toast;

    const upgradeBtn = toast.querySelector('.upgrade-toast-btn') as HTMLButtonElement;
    const dismissBtn = toast.querySelector('.upgrade-toast-dismiss') as HTMLButtonElement;

    // Delay buttons to prevent tap-through
    upgradeBtn.disabled = true;
    dismissBtn.disabled = true;
    setTimeout(() => {
      upgradeBtn.disabled = false;
      dismissBtn.disabled = false;
    }, 500);

    upgradeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (upgradeBtn.disabled) return;
      this.closeUpgradePrompt();
      if (this.state.upgradeAsset(this.state.currentAsset)) {
        // refresh affordability
        this.updateAffordabilityGlows();
      }
    });

    dismissBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.closeUpgradePrompt();
    });

    // Auto-dismiss after 5s
    setTimeout(() => this.closeUpgradePrompt(), 5_000);
  }

  private closeUpgradePrompt(): void {
    this.upgradePromptEl?.remove();
    this.upgradePromptEl = null;
  }

  // ── Affordability Glows ──────────────────────────────────────────

  private updateAffordabilityGlows(): void {
    const score = this.state.score;

    // Assets button: glow if can afford any upgrade/unlock
    const canAffordAsset = ASSETS.some((asset, i) => {
      if (!this.state.isAssetUnlocked(i)) return score >= asset.unlockCost;
      const lvl = this.state.getAssetLevel(i);
      return lvl < asset.levels.length - 1 && score >= asset.levels[lvl + 1].upgradeCost;
    });
    this.btnAssets.classList.toggle('btn-can-afford', canAffordAsset);

    // Backgrounds button: glow if can afford any bg
    const canAffordBg = BACKGROUNDS_ASSETS.some(
      (bg, i) => !this.state.isBackgroundUnlocked(i) && score >= bg.cost,
    );
    this.btnBgs.classList.toggle('btn-can-afford', canAffordBg);

    // Bonus button: glow if can afford purchase
    this.btnAd.classList.toggle(
      'btn-can-afford',
      !this.state.boostActive && score >= BOOST_CONFIG.cost,
    );

    // Autoclick button: glow if can afford purchase
    this.btnAutoclick.classList.toggle(
      'btn-can-afford',
      !this.state.autoclickActive && score >= AUTOCLICK_CONFIG.cost,
    );
  }

  /** Runs auto-click ticks and shows/hides the indicator. */
  private startAutoclickTimer(): void {
    this.autoclickInterval = setInterval(() => {
      if (this.state.autoclickActive) {
        const sec = Math.ceil(this.state.autoclickRemainingMs / 1_000);
        this.autoclickEl.textContent = `🤖 Auto-click (${sec}s)`;
        this.autoclickEl.classList.remove('hidden');

        // Perform auto-clicks per tick (interval ≈ 250 ms)
        const clicksPerTick = AUTOCLICK_CONFIG.clicksPerSecond / 4;
        for (let i = 0; i < clicksPerTick; i++) {
          const points = this.state.click();
          this.showFloatText(points);
          this.onAutoClickEffect?.();
        }
      } else {
        this.autoclickEl.classList.add('hidden');
      }
    }, 250);
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

  // ── Gold Sparkle Effect ────────────────────────────────────────

  /** Spawns animated sparkle particles rising from the bottom gold gradient. */
  private startGoldSparkles(container: HTMLElement): void {
    this.goldSparkleInterval = setInterval(() => {
      const sparkle = document.createElement('div');
      sparkle.className = 'gold-sparkle-particle';
      sparkle.style.left = `${Math.random() * 100}%`;
      sparkle.style.animationDuration = `${1.2 + Math.random() * 1.0}s`;
      sparkle.style.animationDelay = `${Math.random() * 0.3}s`;
      sparkle.style.fontSize = `${6 + Math.random() * 8}px`;
      sparkle.style.opacity = `${0.5 + Math.random() * 0.5}`;
      container.appendChild(sparkle);
      sparkle.addEventListener('animationend', () => sparkle.remove());
    }, 120);
  }

  // ── Click Fever System ──────────────────────────────────────────

  /**
   * Called on every click to feed the fever meter.
   * Returns a bonus multiplier (1 = normal, 2 = double, 3 = triple)
   * based on the current fever level. Higher fever = more chance of bonus.
   */
  registerClick(): number {
    const now = Date.now();
    this.feverClickTimes.push(now);
    // Keep only clicks from last 2 seconds
    const window = 2000;
    this.feverClickTimes = this.feverClickTimes.filter((t) => now - t < window);

    // CPS-based fill: 8+ clicks/sec = full meter
    const cps = this.feverClickTimes.length / (window / 1000);
    const target = Math.min(1, cps / 8);
    this.feverMeter = Math.min(1, this.feverMeter + (target - this.feverMeter) * 0.4 + 0.04);
    this.updateFeverUI();

    // Spawn heart on character
    this.spawnHeart();

    // High fever effects
    if (this.feverMeter > 0.7) {
      this.spawnConfetti();
    }

    // Bonus multiplier from fever (starts at 50% meter)
    let multi = 1;
    if (this.feverMeter >= 0.5) {
      const luck = Math.random();
      // Chance scales with fever: at 50% → 15% x2, at 100% → 50% x2 + 15% x3
      const fever = (this.feverMeter - 0.5) * 2; // 0..1 within bonus range
      const tripleChance = fever * 0.15;
      const doubleChance = fever * 0.35 + 0.15;
      if (luck < tripleChance) {
        multi = 3;
      } else if (luck < doubleChance) {
        multi = 2;
      }
    }

    if (multi > 1) {
      this.showMultiText(multi);
    }

    return multi;
  }

  /** Shows a "x2!" or "x3!" indicator near the fever bar. */
  private showMultiText(multi: number): void {
    const container = this.root.querySelector('#float-container')!;
    const el = document.createElement('div');
    el.className = `fever-multi fever-multi-${multi}`;
    el.textContent = `x${multi}!`;
    el.style.left = `calc(50% + ${(Math.random() - 0.5) * 60}px)`;
    container.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }

  private startFeverDecay(): void {
    this.feverDecayInterval = setInterval(() => {
      if (this.feverMeter > 0) {
        this.feverMeter = Math.max(0, this.feverMeter - 0.025);
        this.updateFeverUI();
      }
    }, 50);
  }

  private updateFeverUI(): void {
    const pct = this.feverMeter * 100;
    this.feverFillEl.style.width = `${pct}%`;

    // Color transitions: green → yellow → orange → pink/red
    let color: string;
    if (this.feverMeter < 0.3) {
      color = 'linear-gradient(90deg, #43e97b, #38f9d7)';
    } else if (this.feverMeter < 0.6) {
      color = 'linear-gradient(90deg, #f9d423, #ff4e50)';
    } else {
      color = 'linear-gradient(90deg, #ff4e50, #f9076d, #ff6ec7)';
    }
    this.feverFillEl.style.background = color;

    // Glow intensity
    this.feverGlowEl.style.opacity = String(
      this.feverMeter > 0.5 ? (this.feverMeter - 0.5) * 2 : 0,
    );

    // Bar pulse class
    this.feverBarEl.classList.toggle('fever-active', this.feverMeter > 0.5);
    this.feverBarEl.classList.toggle('fever-max', this.feverMeter > 0.9);

    // Spawn heart particles on the bar at high levels
    if (this.feverMeter > 0.5 && Math.random() < this.feverMeter * 0.4) {
      this.spawnBarParticle();
    }
  }

  private spawnHeart(): void {
    const container = this.root.querySelector('#float-container')!;
    const heart = document.createElement('div');
    heart.className = 'click-heart';
    heart.textContent = Math.random() < 0.7 ? '❤️' : Math.random() < 0.5 ? '💖' : '✨';
    const offsetX = (Math.random() - 0.5) * 120;
    heart.style.left = `calc(50% + ${offsetX}px)`;
    heart.style.bottom = `${30 + Math.random() * 10}%`;
    container.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove());
  }

  private spawnBarParticle(): void {
    const particle = document.createElement('div');
    particle.className = 'fever-heart-particle';
    particle.textContent = Math.random() < 0.5 ? '❤️' : '💖';
    particle.style.left = `${this.feverMeter * 90 + Math.random() * 10}%`;
    this.feverParticlesEl.appendChild(particle);
    particle.addEventListener('animationend', () => particle.remove());
  }

  private spawnConfetti(): void {
    const count = this.feverMeter > 0.9 ? 4 : 2;
    for (let i = 0; i < count; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      const shapes = ['🎉', '🎊', '⭐', '✨', '💫', '❤️'];
      piece.textContent = shapes[Math.floor(Math.random() * shapes.length)];
      piece.style.left = `${Math.random() * 100}%`;
      piece.style.animationDuration = `${1.5 + Math.random() * 1.5}s`;
      piece.style.animationDelay = `${Math.random() * 0.3}s`;
      this.feverConfettiEl.appendChild(piece);
      piece.addEventListener('animationend', () => piece.remove());
    }
  }

  // ── State Events ───────────────────────────────────────────────

  private bindStateEvents(): void {
    this.state.events.on('score:change', () => this.updateScore());
    this.state.events.on('asset:change', () => {
      this.upgradePromptDismissed = -1;
      this.closeUpgradePrompt();
      this.updateAffordabilityGlows();
    });
    this.state.events.on('asset:level:change', () => {
      this.upgradePromptDismissed = -1;
      this.closeUpgradePrompt();
      this.updateAffordabilityGlows();
    });
  }

  private injectStyles(): void {
    // Styles are injected at module level; nothing to do here.
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

  .status-bubbles {
    position: absolute;
    top: 24px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    flex-direction: row;
    gap: 10px;
    align-items: center;
    pointer-events: none;
  }

  .boost-indicator {
    background: linear-gradient(135deg, rgba(255,80,0,0.9), rgba(255,160,0,0.9));
    color: #fff;
    padding: 8px 20px;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 700;
    animation: boostPulse 1s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(255,100,0,0.4);
    white-space: nowrap;
  }

  .boost-indicator.hidden { display: none; }

  .autoclick-indicator {
    background: linear-gradient(135deg, rgba(0,140,255,0.9), rgba(0,200,255,0.9));
    color: #fff;
    padding: 8px 20px;
    border-radius: 24px;
    font-size: 15px;
    font-weight: 700;
    animation: boostPulse 1s ease-in-out infinite;
    box-shadow: 0 0 20px rgba(0,140,255,0.4);
    white-space: nowrap;
  }

  .autoclick-indicator.hidden { display: none; }

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

  .music-btn {
    position: absolute;
    top: 24px;
    right: 24px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 22px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .music-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }

  .music-btn:active {
    transform: scale(0.95);
  }

  .bottom-bar {
    position: absolute;
    top: 130px;
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

  /* ── Click Fever Bar ─────────────────────────────────── */

  .fever-bar {
    position: absolute;
    top: 95px;
    left: 50%;
    transform: translateX(-50%);
    width: min(180px, 40vw);
    height: 22px;
    background: rgba(0, 0, 0, 0.5);
    border-radius: 14px;
    border: 1px solid rgba(255, 255, 255, 0.15);
    overflow: visible;
    pointer-events: none;
    z-index: 10;
  }

  .fever-fill {
    height: 100%;
    width: 0%;
    border-radius: 14px;
    transition: width 0.08s linear, background 0.3s;
    background: linear-gradient(90deg, #43e97b, #38f9d7);
    position: relative;
  }

  .fever-glow {
    position: absolute;
    inset: -4px;
    border-radius: 14px;
    opacity: 0;
    background: radial-gradient(ellipse at center, rgba(255, 100, 150, 0.5), transparent 70%);
    filter: blur(8px);
    transition: opacity 0.2s;
    pointer-events: none;
  }

  .fever-bar.fever-active {
    animation: feverPulse 0.5s ease-in-out infinite;
    border-color: rgba(255, 150, 200, 0.4);
  }

  .fever-bar.fever-max {
    animation: feverShake 0.15s ease-in-out infinite;
    border-color: rgba(255, 50, 100, 0.7);
    box-shadow: 0 0 20px rgba(255, 50, 100, 0.4), 0 0 40px rgba(255, 50, 100, 0.2);
  }

  @keyframes feverPulse {
    0%, 100% { transform: translateX(-50%) scale(1); }
    50% { transform: translateX(-50%) scale(1.03); }
  }

  @keyframes feverShake {
    0%, 100% { transform: translateX(-50%) translateY(0); }
    25% { transform: translateX(calc(-50% + 2px)) translateY(-1px); }
    75% { transform: translateX(calc(-50% - 2px)) translateY(1px); }
  }

  .fever-particles {
    position: absolute;
    inset: 0;
    pointer-events: none;
    overflow: visible;
  }

  .fever-heart-particle {
    position: absolute;
    bottom: 100%;
    font-size: 14px;
    animation: heartFloat 0.8s ease-out forwards;
    pointer-events: none;
  }

  @keyframes heartFloat {
    0% { opacity: 1; transform: translateY(0) scale(0.6); }
    100% { opacity: 0; transform: translateY(-40px) scale(1.2); }
  }

  /* ── Hearts on character ─────────────────────────────── */

  .click-heart {
    position: absolute;
    font-size: 22px;
    animation: heartRise 0.9s ease-out forwards;
    pointer-events: none !important;
  }

  @keyframes heartRise {
    0% { opacity: 1; transform: translateY(0) scale(0.5) rotate(0deg); }
    50% { opacity: 1; transform: translateY(-50px) scale(1.1) rotate(15deg); }
    100% { opacity: 0; transform: translateY(-100px) scale(0.8) rotate(-10deg); }
  }

  /* ── Confetti from top ───────────────────────────────── */

  .fever-confetti {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none !important;
    z-index: 50;
  }

  .fever-confetti * {
    pointer-events: none !important;
  }

  .confetti-piece {
    position: absolute;
    top: -30px;
    font-size: 24px;
    animation: confettiFall 2s ease-in forwards;
    pointer-events: none;
  }

  @keyframes confettiFall {
    0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
    30% { opacity: 1; }
    100% { opacity: 0; transform: translateY(calc(100vh + 40px)) rotate(720deg) scale(0.4); }
  }

  /* ── Affordability glow on bottom bar buttons ───────── */

  .bar-btn.btn-can-afford {
    border-color: rgba(255, 215, 0, 0.6);
    box-shadow: 0 0 14px rgba(255, 215, 0, 0.35), 0 0 4px rgba(255, 215, 0, 0.2);
    animation: affordPulse 1.8s ease-in-out infinite;
  }

  @keyframes affordPulse {
    0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.3); border-color: rgba(255,215,0,0.4); }
    50% { box-shadow: 0 0 22px rgba(255, 215, 0, 0.6); border-color: rgba(255,215,0,0.8); }
  }

  /* ── Choice popup (bonus/autoclick buy or ad) ────────── */

  .choice-popup {
    position: absolute;
    top: 400px;
    left: 24px;
    background: rgba(18, 18, 32, 0.97);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 20px;
    padding: 18px 16px 14px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    min-width: 200px;
    box-shadow: 0 12px 40px rgba(0,0,0,0.5);
    animation: popupIn 0.2s ease-out;
    z-index: 150;
    pointer-events: auto;
  }

  @keyframes popupIn {
    from { opacity: 0; transform: translateY(12px) scale(0.95); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  .choice-popup-title {
    font-size: 15px;
    font-weight: 700;
    color: #fff;
    text-align: center;
  }

  .choice-btn {
    border: none;
    border-radius: 12px;
    padding: 12px 16px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
    transition: opacity 0.15s, transform 0.1s;
  }

  .choice-btn:disabled {
    opacity: 0.45;
    cursor: default;
  }

  .choice-btn:not(:disabled):active { transform: scale(0.97); }

  .choice-btn-ad {
    background: linear-gradient(135deg, rgba(100,180,255,0.25), rgba(0,120,255,0.3));
    color: #7ec8ff;
    border: 1px solid rgba(100,180,255,0.3);
  }

  .choice-btn-buy {
    background: linear-gradient(135deg, rgba(255,215,0,0.2), rgba(255,160,0,0.25));
    color: #ffd700;
    border: 1px solid rgba(255,215,0,0.3);
  }

  .choice-btn-buy.locked {
    background: rgba(255,255,255,0.05);
    color: rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.1);
  }

  .choice-close {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 16px;
    cursor: pointer;
    align-self: center;
    padding: 0 8px;
    line-height: 1;
  }

  /* ── Upgrade toast ───────────────────────────────────── */

  .upgrade-toast {
    position: absolute;
    top: 95px;
    right: 24px;
    left: auto;
    transform: none;
    background: rgba(18, 18, 32, 0.97);
    backdrop-filter: blur(16px);
    -webkit-backdrop-filter: blur(16px);
    border: 1px solid rgba(255, 215, 0, 0.35);
    border-radius: 18px;
    padding: 14px 18px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 0 20px rgba(255,215,0,0.2), 0 8px 30px rgba(0,0,0,0.5);
    animation: toastIn 0.25s ease-out;
    z-index: 150;
    pointer-events: auto;
    white-space: nowrap;
  }

  @keyframes toastIn {
    from { opacity: 0; transform: translateY(-12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .upgrade-toast-text {
    font-size: 14px;
    font-weight: 600;
    color: #ffd700;
  }

  .upgrade-toast-btn {
    background: linear-gradient(135deg, rgba(255,215,0,0.25), rgba(255,160,0,0.3));
    border: 1px solid rgba(255,215,0,0.4);
    color: #ffd700;
    border-radius: 10px;
    padding: 8px 14px;
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;
    font-family: inherit;
    transition: transform 0.1s;
  }

  .upgrade-toast-btn:not(:disabled):active { transform: scale(0.95); }
  .upgrade-toast-btn:disabled { opacity: 0.4; }

  .upgrade-toast-dismiss {
    background: none;
    border: none;
    color: rgba(255,255,255,0.4);
    font-size: 16px;
    cursor: pointer;
    padding: 0;
    line-height: 1;
  }

  /* ── Gold bottom glow (masks sprite cut-off) ────────── */

  .gold-glow {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    height: 100px;
    background: linear-gradient(
      to top,
      rgb(255, 206, 73) 0%,
      rgb(255, 237, 101) 25%,
      transparent 100%
    );
    pointer-events: none;
    z-index: 9999;
  }

  .gold-sparkles {
    position: absolute;
    inset: 0;
    overflow: hidden;
    pointer-events: none;
  }

  .gold-sparkle-particle {
    position: absolute;
    bottom: 0;
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255, 230, 120, 1), rgba(255, 200, 60, 0.6));
    box-shadow: 0 0 4px rgba(255, 215, 0, 0.8), 0 0 8px rgba(255, 180, 0, 0.4);
    animation: goldSparkleRise 1.5s ease-out forwards;
    pointer-events: none;
  }

  @keyframes goldSparkleRise {
    0% {
      opacity: 0.8;
      transform: translateY(0) scale(1);
    }
    50% {
      opacity: 1;
      transform: translateY(-30px) scale(1.2);
    }
    100% {
      opacity: 0;
      transform: translateY(-70px) scale(0.4);
    }
  }

  /* ── Fever multiplier popup ──────────────────────────── */

  .fever-multi {
    position: absolute;
    bottom: 8%;
    font-size: 32px;
    font-weight: 900;
    animation: multiPop 0.7s ease-out forwards;
    pointer-events: none !important;
    text-shadow: 0 0 16px currentColor, 0 2px 6px rgba(0,0,0,0.5);
    letter-spacing: -1px;
  }

  .fever-multi-2 {
    color: #ffdf00;
  }

  .fever-multi-3 {
    color: #ff44cc;
    font-size: 40px;
  }

  @keyframes multiPop {
    0% { opacity: 1; transform: translateY(0) scale(0.5); }
    30% { opacity: 1; transform: translateY(-20px) scale(1.4); }
    100% { opacity: 0; transform: translateY(-60px) scale(0.9); }
  }
`;

// Re-inject styles on every HMR update (runs at module evaluation time)
document.getElementById('game-ui-styles')?.remove();
const _style = document.createElement('style');
_style.id = 'game-ui-styles';
_style.textContent = UI_CSS;
document.head.appendChild(_style);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    document.getElementById('game-ui-styles')?.remove();
    const s = document.createElement('style');
    s.id = 'game-ui-styles';
    s.textContent = UI_CSS;
    document.head.appendChild(s);
  });
}
