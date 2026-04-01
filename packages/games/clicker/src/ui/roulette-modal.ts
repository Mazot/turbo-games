import type { AdManager } from '@turbo-games/ads';
import { RouletteWheel } from '@turbo-games/roulette';
import { formatNumber } from '@turbo-games/ui';
import type { GameState } from '../game-state';
import { ROULETTE_SECTORS, ROULETTE_CONFIG } from '../config';

/**
 * Full-screen modal overlay that hosts a RouletteWheel from the core package.
 * Provides three spin triggers: free spin (cooldown timer), rewarded ad, and
 * paid spin (deducts game currency). Applies point rewards to GameState.
 */
export class RouletteModal {
  private overlay: HTMLDivElement | null = null;
  private wheel: RouletteWheel<number> | null = null;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private freeSpinBtn: HTMLButtonElement | null = null;
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
    titleBar.textContent = '🎰 Roulette';
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
    });

    // Result display
    this.resultEl = document.createElement('div');
    this.resultEl.className = 'roulette-result hidden';

    // Spin buttons
    const buttonsRow = document.createElement('div');
    buttonsRow.className = 'roulette-buttons';

    this.freeSpinBtn = this.createSpinButton('🎁 Free Spin', () => this.onFreeSpin());
    this.adSpinBtn = this.createSpinButton('📺 Watch Ad', () => this.onAdSpin());
    this.paidSpinBtn = this.createSpinButton(
      `⭐ Spin (${formatNumber(ROULETTE_CONFIG.spinCost)})`,
      () => this.onPaidSpin(),
    );

    buttonsRow.append(this.freeSpinBtn, this.adSpinBtn, this.paidSpinBtn);

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
    this.freeSpinBtn = null;
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
    this.state.applyRouletteReward(result.sector.reward);
    this.showResult(result.sector.reward);
    this.updateButtons();
  }

  private async onFreeSpin(): Promise<void> {
    if (!this.state.canFreeSpin()) return;
    this.state.consumeFreeSpin();
    await this.doSpin();
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
    if (!this.state.spendForSpin()) return;
    await this.doSpin();
  }

  private showResult(points: number): void {
    if (!this.resultEl) return;
    this.resultEl.textContent = `+${formatNumber(points)} ⭐`;
    this.resultEl.classList.remove('hidden');
    this.resultEl.classList.remove('roulette-result-pop');
    // Force reflow for re-triggering animation
    void this.resultEl.offsetWidth;
    this.resultEl.classList.add('roulette-result-pop');
  }

  private hideResult(): void {
    if (!this.resultEl) return;
    this.resultEl.classList.add('hidden');
    this.resultEl.classList.remove('roulette-result-pop');
  }

  private setAllButtonsDisabled(disabled: boolean): void {
    if (this.freeSpinBtn) this.freeSpinBtn.disabled = disabled;
    if (this.adSpinBtn) this.adSpinBtn.disabled = disabled;
    if (this.paidSpinBtn) this.paidSpinBtn.disabled = disabled;
  }

  private updateButtons(): void {
    if (!this.freeSpinBtn || !this.adSpinBtn || !this.paidSpinBtn) return;
    const spinning = this.wheel?.isSpinning ?? false;

    // Free spin
    const canFree = this.state.canFreeSpin();
    this.freeSpinBtn.disabled = spinning || !canFree;
    if (canFree) {
      this.freeSpinBtn.textContent = '🎁 Free Spin';
    } else {
      const secs = Math.ceil(this.state.freeSpinCooldownRemaining() / 1_000);
      const m = Math.floor(secs / 60);
      const s = secs % 60;
      this.freeSpinBtn.textContent = `🎁 Free (${m}:${String(s).padStart(2, '0')})`;
    }

    // Ad spin — always available unless spinning
    this.adSpinBtn.disabled = spinning;

    // Paid spin
    const canAfford = this.state.score >= ROULETTE_CONFIG.spinCost;
    this.paidSpinBtn.disabled = spinning || !canAfford;
    this.paidSpinBtn.textContent = `⭐ Spin (${formatNumber(ROULETTE_CONFIG.spinCost)})`;
    this.paidSpinBtn.classList.toggle('roulette-btn-locked', !canAfford);
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
    font-size: 28px;
    font-weight: 800;
    color: #ffd700;
    text-shadow: 0 0 16px rgba(255, 215, 0, 0.6);
    min-height: 38px;
    display: flex;
    align-items: center;
    justify-content: center;
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
    padding: 12px 18px;
    border-radius: 14px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, opacity 0.2s;
    font-family: inherit;
    white-space: nowrap;
    flex: 1;
    min-width: 0;
    text-align: center;
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
