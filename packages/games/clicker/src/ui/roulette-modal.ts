import type { AdManager } from '@turbo-games/ads';
import { RouletteWheel } from '@turbo-games/roulette';
import { formatNumber } from '@turbo-games/ui';
import type { GameState } from '../game-state';
import { ROULETTE_SECTORS, ROULETTE_CONFIG, BACKGROUNDS_ASSETS } from '../config';
import { t, tBgName } from '../i18n';

/**
 * Full-screen modal overlay that hosts a RouletteWheel from the core package.
 * Provides two spin triggers: rewarded ad (no cooldown) and
 * paid spin (deducts game currency + 5-min cooldown). Applies point rewards to GameState.
 */
export class RouletteModal {
  private overlay: HTMLDivElement | null = null;
  private wheel: RouletteWheel<number> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private paidSpinBtn: HTMLButtonElement | null = null;
  private adSpinBtn: HTMLButtonElement | null = null;
  private resultEl: HTMLDivElement | null = null;

  constructor(
    private state: GameState,
    private adManager: AdManager,
  ) {}

  /** Opens the roulette modal. No-op if already open. */
  open(): void {
    if (this.overlay) return;
    this.injectStyles();
    this.state.events.emit('roulette:open');

    const overlay = document.createElement('div');
    overlay.className = 'roulette-overlay';
    overlay.addEventListener('pointerdown', (e) => {
      if (e.target === overlay) this.close();
      e.stopPropagation();
    });

    const panel = document.createElement('div');
    panel.className = 'roulette-panel';

    // Title bar
    const titleBar = document.createElement('div');
    titleBar.className = 'roulette-title';
    titleBar.textContent = t('roulette.title');
    const closeBtn = document.createElement('button');
    closeBtn.className = 'roulette-close';
    closeBtn.textContent = '✕';
    closeBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.close();
    });
    titleBar.appendChild(closeBtn);

    // Wheel container
    const wheelContainer = document.createElement('div');
    wheelContainer.className = 'roulette-wheel-container';

    this.wheel = new RouletteWheel<number>(wheelContainer, {
      sectors: ROULETTE_SECTORS.map((s) => ({
        label: s.label,
        color: s.color,
        weight: s.weight,
        icon: s.icon,
        image: s.image,
        reward: s.reward,
      })),
      spinDurationMs: ROULETTE_CONFIG.spinDurationMs,
      spinRevolutions: ROULETTE_CONFIG.spinRevolutions,
      size: ROULETTE_CONFIG.wheelSize,
      labelFontSize: 28,
    });

    // Result display
    this.resultEl = document.createElement('div');
    this.resultEl.className = 'roulette-result hidden';

    // Spin buttons
    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'roulette-buttons';

    this.adSpinBtn = this.createSpinButton(t('roulette.watchAd'), () => this.onAdSpin());
    this.paidSpinBtn = this.createSpinButton(
      t('roulette.spinPaid', { cost: formatNumber(ROULETTE_CONFIG.spinCost) }),
      () => this.onPaidSpin(),
    );

    buttonsRow.append(this.adSpinBtn, this.paidSpinBtn);

    panel.append(titleBar, wheelContainer, this.resultEl, buttonsRow);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    this.overlay = overlay;

    this.updateButtons();
    this.startTimer();
  }

  /** Closes and cleans up the roulette modal. */
  close(): void {
    if (!this.overlay) return;
    this.stopTimer();
    this.wheel?.destroy();
    this.wheel = null;
    this.overlay.remove();
    this.overlay = null;
    this.adSpinBtn = null;
    this.paidSpinBtn = null;
    this.resultEl = null;
  }

  /** Whether the modal is currently visible. */
  get isOpen(): boolean {
    return this.overlay !== null;
  }

  private createSpinButton(label: string, onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'roulette-spin-btn';
    btn.textContent = label;
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private async doSpin(): Promise<void> {
    if (!this.wheel || this.wheel.isSpinning) return;
    this.setAllButtonsDisabled(true);
    this.hideResult();
    this.state.events.emit('roulette:spin');

    const result = await this.wheel.spin();
    const sectorIdx = result.sectorIndex;
    const cfg = ROULETTE_SECTORS[sectorIdx];
    const rewardType = cfg?.rewardType ?? 'points';

    this.applyReward(rewardType, cfg?.reward ?? 0);
    this.updateButtons();
  }

  private applyReward(rewardType: string, points: number): void {
    switch (rewardType) {
      case 'boost':
        this.state.activateBoost();
        this.showResultText(t('roulette.resultBoost'));
        break;
      case 'autoclick':
        this.state.activateAutoclick();
        this.showResultText(t('roulette.resultAutoclick'));
        break;
      case 'background': {
        const nextBg = this.findNextLockedBackground();
        if (nextBg !== null) {
          this.state.unlockBackground(nextBg);
          const bgName = tBgName(BACKGROUNDS_ASSETS[nextBg].name);
          this.showResultText(t('roulette.resultBackground', { name: bgName }));
        } else {
          const fallback = 100;
          this.state.applyRouletteReward(fallback);
          this.showResultText(t('roulette.resultBackgroundAll', { points: formatNumber(fallback) }));
        }
        break;
      }
      default:
        this.state.applyRouletteReward(points);
        this.showResultText(t('roulette.resultPoints', { points: formatNumber(points) }));
        break;
    }
  }

  private findNextLockedBackground(): number | null {
    // Pick a random locked roulette-only background — no repeats in order
    const candidates = BACKGROUNDS_ASSETS
      .map((bg, i) => ({ bg, i }))
      .filter(({ bg, i }) => bg.rouletteOnly && !this.state.isBackgroundUnlocked(i));
    if (candidates.length === 0) return null;
    return candidates[Math.floor(Math.random() * candidates.length)].i;
  }

  private async onAdSpin(): Promise<void> {
    if (this.adManager.isAvailable('rewarded')) {
      const success = await this.adManager.show('rewarded');
      if (!success) {
        this.updateButtons();
        return;
      }
    }
    // Dev mode: proceed without ads
    await this.doSpin();
  }

  private async onPaidSpin(): Promise<void> {
    if (!this.state.canFreeSpin()) return;       // cooldown check
    if (!this.state.spendForSpin()) return;       // afford check
    this.state.consumeFreeSpin();                 // start cooldown
    await this.doSpin();
  }

  private showResultText(text: string): void {
    if (!this.resultEl) return;
    this.resultEl.textContent = text;
    this.resultEl.classList.remove('hidden');
    this.resultEl.classList.remove('roulette-result-pop');
    void this.resultEl.offsetWidth;
    this.resultEl.classList.add('roulette-result-pop');
  }

  private hideResult(): void {
    if (!this.resultEl) return;
    this.resultEl.classList.add('hidden');
    this.resultEl.classList.remove('roulette-result-pop');
  }

  private setAllButtonsDisabled(disabled: boolean): void {
    if (this.adSpinBtn) this.adSpinBtn.disabled = disabled;
    if (this.paidSpinBtn) this.paidSpinBtn.disabled = disabled;
  }

  private updateButtons(): void {
    if (!this.adSpinBtn || !this.paidSpinBtn) return;
    const spinning = this.wheel?.isSpinning ?? false;

    // Ad spin — always available unless spinning
    this.adSpinBtn.disabled = spinning;

    // Paid spin: needs points + cooldown
    const canAfford = this.state.score >= ROULETTE_CONFIG.spinCost;
    const cooldownReady = this.state.canFreeSpin();
    const canSpin = canAfford && cooldownReady;

    this.paidSpinBtn.disabled = spinning || !canSpin;
    this.paidSpinBtn.classList.toggle('roulette-btn-locked', !canSpin);

    if (!cooldownReady) {
      const secs = Math.ceil(this.state.freeSpinCooldownRemaining() / 1_000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      this.paidSpinBtn.textContent = t('roulette.paidCooldown', {
        time: `${m}:${String(s).padStart(2, '0')}`,
      });
    } else {
      this.paidSpinBtn.textContent = t('roulette.spinPaid', {
        cost: formatNumber(ROULETTE_CONFIG.spinCost),
      });
    }
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => this.updateButtons(), 1_000);
  }

  private stopTimer(): void {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  private injectStyles(): void {
    if (document.getElementById('roulette-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'roulette-modal-styles';
    style.textContent = ROULETTE_CSS;
    document.head.appendChild(style);
  }
}

const ROULETTE_CSS = /* css */ `
  .roulette-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    -webkit-backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 200;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
    user-select: none;
    -webkit-user-select: none;
  }

  .roulette-panel {
    background: rgba(22, 22, 40, 0.96);
    backdrop-filter: blur(24px);
    -webkit-backdrop-filter: blur(24px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 24px;
    padding: 24px 28px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 18px;
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.6);
    max-width: 380px;
    width: 90vw;
  }

  .roulette-title {
    font-size: 20px;
    font-weight: 700;
    color: #fff;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .roulette-close {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: rgba(255, 255, 255, 0.7);
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

  .roulette-close:hover {
    background: rgba(255, 255, 255, 0.16);
    color: #fff;
  }

  .roulette-wheel-container {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .roulette-result {
    font-size: 22px;
    font-weight: 800;
    color: #ffd700;
    text-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    word-break: break-word;
    width: 100%;
    padding: 0 8px;
    box-sizing: border-box;
  }

  .roulette-result.hidden {
    visibility: hidden;
  }

  .roulette-result-pop {
    animation: roulettePop 0.5s ease-out;
  }

  @keyframes roulettePop {
    0% { transform: scale(0.5); opacity: 0; }
    60% { transform: scale(1.2); }
    100% { transform: scale(1); opacity: 1; }
  }

  .roulette-buttons {
    display: flex;
    gap: 8px;
    width: 100%;
    flex-wrap: wrap;
    justify-content: center;
  }

  .roulette-spin-btn {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.18);
    color: #fff;
    padding: 10px 10px;
    border-radius: 14px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, opacity 0.2s;
    font-family: inherit;
    white-space: normal;
    word-break: break-word;
    flex: 1;
    min-width: 0;
    text-align: center;
    line-height: 1.25;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .roulette-spin-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.18);
    transform: translateY(-2px);
  }

  .roulette-spin-btn:active:not(:disabled) {
    transform: translateY(0);
  }

  .roulette-spin-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .roulette-btn-locked {
    opacity: 0.3;
  }
`;
