import type { GameState } from '../game-state';
import type { AdManager } from '@turbo-games/ads';
import { LEVELS, LEVEL_GROUPS } from '../config';

export class GameUI {
  private container: HTMLDivElement;
  private hudContainer: HTMLDivElement;
  private levelSelectContainer: HTMLDivElement;
  private levelCompleteContainer: HTMLDivElement;
  private levelFailContainer: HTMLDivElement;

  private levelText: HTMLDivElement;
  private instructionText: HTMLDivElement;

  private onLevelStartHandler = () => {
    this.hideAll();
    this.showHUD();
    this.updateHUD();
  };

  private onLevelCompleteHandler = () => {
    this.hideAll();
    this.showLevelComplete();
  };

  private onLevelFailHandler = () => {
    this.hideAll();
    this.showLevelFail();
  };

  constructor(
    private state: GameState,
    private adManager: AdManager,
    private callbacks: {
      onLevelSelect: (index: number) => void;
      onRestart: () => void;
      onNextLevel: () => void;
      onBackToMenu: () => void;
    },
  ) {
    this.container = document.createElement('div');
    this.container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      color: white;
      z-index: 100;
    `;
    document.body.appendChild(this.container);

    this.hudContainer = this.createHUD();
    this.levelSelectContainer = this.createLevelSelect();
    this.levelCompleteContainer = this.createLevelComplete();
    this.levelFailContainer = this.createLevelFail();

    this.levelText = this.hudContainer.querySelector('#level-text') as HTMLDivElement;
    this.instructionText = this.hudContainer.querySelector('#instruction-text') as HTMLDivElement;

    this.showLevelSelect();

    this.state.events.on('level:start', this.onLevelStartHandler);
    this.state.events.on('level:complete', this.onLevelCompleteHandler);
    this.state.events.on('level:fail', this.onLevelFailHandler);
  }

  private createHUD(): HTMLDivElement {
    const hud = document.createElement('div');
    hud.style.cssText = 'display: none;';
    hud.innerHTML = `
      <div style="position: absolute; top: 20px; left: 20px; background: rgba(0,0,0,0.7); padding: 15px; border-radius: 10px;">
        <div id="level-text" style="font-size: 20px; font-weight: bold; margin-bottom: 5px;"></div>
        <div id="instruction-text" style="font-size: 14px; color: #ccc;"></div>
      </div>
      <button id="menu-btn" style="position: absolute; top: 20px; right: 20px; padding: 10px 20px; font-size: 16px; background: rgba(0,0,0,0.7); color: white; border: 2px solid white; border-radius: 8px; cursor: pointer; pointer-events: auto;">Menu</button>
    `;

    const menuBtn = hud.querySelector('#menu-btn') as HTMLButtonElement;
    menuBtn.addEventListener('click', () => {
      this.callbacks.onBackToMenu();
      this.showLevelSelect();
    });

    this.container.appendChild(hud);
    return hud;
  }

  private createLevelSelect(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: none;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      pointer-events: auto;
      overflow-y: auto;
    `;

    container.innerHTML = `
      <div style="max-width: 800px; margin: 40px auto; padding: 20px;">
        <h1 style="text-align: center; font-size: 48px; margin-bottom: 10px;">Pixel Path</h1>
        <p style="text-align: center; color: #ccc; margin-bottom: 40px;">Draw paths to guide the ball to the goal</p>
        <div id="level-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 15px;"></div>
      </div>
    `;

    const levelGrid = container.querySelector('#level-grid') as HTMLDivElement;

    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const unlocked = this.state.isLevelUnlocked(i);
      const completed = this.state.isLevelCompleted(i);
      const stars = this.state.getStars(i);

      const levelBtn = document.createElement('button');
      levelBtn.style.cssText = `
        padding: 20px;
        font-size: 16px;
        font-weight: bold;
        background: ${unlocked ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#444'};
        color: ${unlocked ? 'white' : '#888'};
        border: ${completed ? '3px solid gold' : '2px solid #666'};
        border-radius: 12px;
        cursor: ${unlocked ? 'pointer' : 'not-allowed'};
        transition: transform 0.2s;
      `;

      levelBtn.innerHTML = `
        <div>${level.name}</div>
        <div style="font-size: 12px; margin-top: 5px; color: #ddd;">${stars > 0 ? '⭐'.repeat(stars) : ''}</div>
      `;

      if (unlocked) {
        levelBtn.addEventListener('mouseenter', () => {
          levelBtn.style.transform = 'scale(1.05)';
        });
        levelBtn.addEventListener('mouseleave', () => {
          levelBtn.style.transform = 'scale(1)';
        });
        levelBtn.addEventListener('click', () => {
          this.callbacks.onLevelSelect(i);
        });
      }

      levelGrid.appendChild(levelBtn);
    }

    this.container.appendChild(container);
    return container;
  }

  private createLevelComplete(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: none;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      pointer-events: auto;
    `;

    container.innerHTML = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(0,0,0,0.9); padding: 40px; border-radius: 20px; border: 3px solid gold;">
        <h1 style="font-size: 48px; color: gold; margin-bottom: 20px;">Level Complete!</h1>
        <div id="stars" style="font-size: 60px; margin: 20px 0;">⭐⭐⭐</div>
        <div style="margin: 30px 0;">
          <button id="next-btn" style="padding: 15px 40px; font-size: 20px; margin: 0 10px; background: #4CAF50; color: white; border: none; border-radius: 10px; cursor: pointer;">Next Level</button>
          <button id="menu-complete-btn" style="padding: 15px 40px; font-size: 20px; margin: 0 10px; background: #2196F3; color: white; border: none; border-radius: 10px; cursor: pointer;">Menu</button>
        </div>
      </div>
    `;

    const nextBtn = container.querySelector('#next-btn') as HTMLButtonElement;
    nextBtn.addEventListener('click', () => {
      this.callbacks.onNextLevel();
    });

    const menuBtn = container.querySelector('#menu-complete-btn') as HTMLButtonElement;
    menuBtn.addEventListener('click', () => {
      this.callbacks.onBackToMenu();
      this.showLevelSelect();
    });

    this.container.appendChild(container);
    return container;
  }

  private createLevelFail(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
      display: none;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.85);
      pointer-events: auto;
    `;

    container.innerHTML = `
      <div style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center; background: rgba(0,0,0,0.9); padding: 40px; border-radius: 20px; border: 3px solid #f44336;">
        <h1 style="font-size: 48px; color: #f44336; margin-bottom: 20px;">Level Failed</h1>
        <p style="font-size: 20px; color: #ccc; margin-bottom: 30px;">The ball fell off! Try again.</p>
        <div style="margin: 30px 0;">
          <button id="restart-btn" style="padding: 15px 40px; font-size: 20px; margin: 0 10px; background: #FF9800; color: white; border: none; border-radius: 10px; cursor: pointer;">Restart</button>
          <button id="menu-fail-btn" style="padding: 15px 40px; font-size: 20px; margin: 0 10px; background: #2196F3; color: white; border: none; border-radius: 10px; cursor: pointer;">Menu</button>
        </div>
      </div>
    `;

    const restartBtn = container.querySelector('#restart-btn') as HTMLButtonElement;
    restartBtn.addEventListener('click', () => {
      this.callbacks.onRestart();
    });

    const menuBtn = container.querySelector('#menu-fail-btn') as HTMLButtonElement;
    menuBtn.addEventListener('click', () => {
      this.callbacks.onBackToMenu();
      this.showLevelSelect();
    });

    this.container.appendChild(container);
    return container;
  }

  private hideAll(): void {
    this.hudContainer.style.display = 'none';
    this.levelSelectContainer.style.display = 'none';
    this.levelCompleteContainer.style.display = 'none';
    this.levelFailContainer.style.display = 'none';
  }

  private showHUD(): void {
    this.hudContainer.style.display = 'block';
  }

  private showLevelSelect(): void {
    this.hideAll();
    this.levelSelectContainer.style.display = 'block';
  }

  private showLevelComplete(): void {
    this.levelCompleteContainer.style.display = 'block';
  }

  private showLevelFail(): void {
    this.levelFailContainer.style.display = 'block';
  }

  private updateHUD(): void {
    const level = LEVELS[this.state.currentLevel];
    this.levelText.textContent = level.name;
    this.instructionText.textContent = 'Draw a path for the ball to reach the goal';
  }

  dispose(): void {
    this.state.events.off('level:start', this.onLevelStartHandler);
    this.state.events.off('level:complete', this.onLevelCompleteHandler);
    this.state.events.off('level:fail', this.onLevelFailHandler);
    document.body.removeChild(this.container);
  }
}
