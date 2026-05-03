import {
  ASSETS,
  AUTOCLICK_CONFIG,
  BACKGROUNDS_ASSETS,
  BOOST_CONFIG,
  ROULETTE_SECTORS,
  ROULETTE_CONFIG,
} from '../config';
import type { GameState } from '../game-state';
import { t } from '../i18n';
import { UIPainter } from './ui-painter';

const DEV_CONFIG_KEY = 'turbo-clicker-dev-config';

/** Reads saved dev config from localStorage and patches the config objects in-place. */
export function applyStoredDevConfig(): void {
  try {
    const raw = localStorage.getItem(DEV_CONFIG_KEY);
    if (!raw) return;
    const data = JSON.parse(raw) as Record<string, unknown>;
    if (data.rouletteConfig) Object.assign(ROULETTE_CONFIG, data.rouletteConfig);
    if (data.boostConfig) Object.assign(BOOST_CONFIG, data.boostConfig);
    if (data.autoclickConfig) Object.assign(AUTOCLICK_CONFIG, data.autoclickConfig);
    if (Array.isArray(data.rouletteSectors)) {
      ROULETTE_SECTORS.splice(0, ROULETTE_SECTORS.length, ...data.rouletteSectors);
    }
  } catch {
    /* ignore */
  }
}

/**
 * Dev-only side panel that lets you live-edit all config values:
 * asset names, unlock costs, per-level image paths / upgrade costs / PPC,
 * background names/paths/costs, and boost settings.
 *
 * Pass `onForceRefreshSprite` so the panel can trigger an immediate texture
 * reload when an image path changes for the currently active asset/level.
 * Pass `onForceRefreshBg` for the same reason with backgrounds.
 */
export class ConfiguratorPanel {
  private root: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private tabEl!: HTMLButtonElement;
  private visible = false;
  private painter = new UIPainter();

  constructor(
    private state: GameState,
    private onForceRefreshSprite: () => void,
    private onForceRefreshBg: (bgIndex: number) => void,
  ) {
    this.root = document.createElement('div');
    this.root.id = 'configurator';
    document.body.appendChild(this.root);
    this.injectStyles();
    this.build();
  }

  destroy(): void {
    this.root.remove();
    document.getElementById('configurator-styles')?.remove();
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  private build(): void {
    this.root.innerHTML = '';

    this.tabEl = document.createElement('button');
    this.tabEl.className = 'cfg-tab';
    this.tabEl.title = t('configurator.tabTitle');
    this.tabEl.textContent = '⚙️';
    this.tabEl.addEventListener('click', () => this.toggle());

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'cfg-content';

    const title = document.createElement('div');
    title.className = 'cfg-title';
    title.textContent = t('configurator.title');
    this.contentEl.appendChild(title);

    this.contentEl.appendChild(this.buildSection(t('configurator.sectionCheats'), this.buildCheatsSection()));
    this.contentEl.appendChild(this.buildSection(t('configurator.sectionAssets'), this.buildAssetsSection()));
    this.contentEl.appendChild(this.buildSection(t('configurator.sectionBackgrounds'), this.buildBgsTable()));
    this.contentEl.appendChild(this.buildSection(t('configurator.sectionBoost'), this.buildBoostFields()));
    this.contentEl.appendChild(this.buildSection(t('configurator.sectionAutoclick'), this.buildAutoclickFields()));
    this.contentEl.appendChild(this.buildSection(t('configurator.sectionRoulette'), this.buildRouletteSection()));

    // ── Save button (sticky bottom) ──
    const saveBtn = document.createElement('button');
    saveBtn.className = 'cfg-save-btn';
    saveBtn.textContent = '💾 Сохранить настройки';
    saveBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const data = {
        rouletteConfig: { ...ROULETTE_CONFIG },
        boostConfig: { ...BOOST_CONFIG },
        autoclickConfig: { ...AUTOCLICK_CONFIG },
        rouletteSectors: ROULETTE_SECTORS.map((s) => ({ ...s })),
      };
      localStorage.setItem(DEV_CONFIG_KEY, JSON.stringify(data));
      saveBtn.textContent = '✅ Сохранено!';
      setTimeout(() => { saveBtn.textContent = '💾 Сохранить настройки'; }, 1500);
    });
    this.contentEl.appendChild(saveBtn);

    this.contentEl.style.display = 'none';
    this.root.append(this.tabEl, this.contentEl);
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.contentEl.style.display = this.visible ? 'flex' : 'none';
    this.tabEl.textContent = this.visible ? '✕' : '⚙️';
  }

  // ─── Section wrapper ──────────────────────────────────────────────────────

  private buildSection(title: string, body: HTMLElement): HTMLElement {
    const section = document.createElement('div');
    section.className = 'cfg-section';
    const head = document.createElement('div');
    head.className = 'cfg-section-title';
    head.textContent = title;
    section.append(head, body);
    return section;
  }

  // ─── Assets section (6 assets × 6 levels) ────────────────────────────────

  /** Builds the full assets section: one collapsible block per asset. */
  private buildAssetsSection(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-assets-list';

    ASSETS.forEach((asset, assetIdx) => {
      const block = document.createElement('div');
      block.className = 'cfg-asset';

      // ── Asset header (name + unlockCost) ──
      const headerLabels = document.createElement('div');
      headerLabels.className = 'cfg-asset-header-labels';
      const lName = document.createElement('span');
      lName.className = 'cfg-th';
      lName.textContent = t('configurator.assetName');
      const lCost = document.createElement('span');
      lCost.className = 'cfg-th cfg-th-right';
      lCost.textContent = t('configurator.unlockStars');
      headerLabels.append(lName, lCost);

      const headerInputs = document.createElement('div');
      headerInputs.className = 'cfg-asset-header';
      headerInputs.append(
        this.makeTextInput(asset.name, 'cfg-name', (v) => {
          asset.name = v;
        }),
        this.makeNumberInput(asset.unlockCost, 'cfg-num', (v) => {
          asset.unlockCost = v;
        }),
      );

      // ── Level rows ──
      const body = document.createElement('div');
      body.className = 'cfg-asset-body';

      const lvlHeaderRow = document.createElement('div');
      lvlHeaderRow.className = 'cfg-level-row';
      [t('configurator.lv'), t('configurator.imagePath'), t('configurator.upgradeStars'), t('configurator.perClick')].forEach((label, col) => {
        const th = document.createElement('div');
        th.className = col >= 2 ? 'cfg-th cfg-th-right' : 'cfg-th';
        th.textContent = label;
        lvlHeaderRow.appendChild(th);
      });
      body.appendChild(lvlHeaderRow);

      asset.levels.forEach((lvl, lvlIdx) => {
        const row = document.createElement('div');
        row.className = 'cfg-level-row';

        const badge = document.createElement('div');
        badge.className = 'cfg-lv-badge';
        badge.textContent = String(lvlIdx);

        const isActiveLvl = () =>
          this.state.currentAsset === assetIdx && this.state.getAssetLevel(assetIdx) === lvlIdx;

        row.append(
          badge,
          this.makeTextInput(lvl.image, 'cfg-path', (v) => {
            lvl.image = v;
            if (isActiveLvl()) this.onForceRefreshSprite();
          }),
          this.makeNumberInput(lvl.upgradeCost, 'cfg-num', (v) => {
            lvl.upgradeCost = v;
          }),
          this.makeNumberInput(lvl.pointsPerClick, 'cfg-num', (v) => {
            lvl.pointsPerClick = v;
          }),
        );

        body.appendChild(row);
      });

      block.append(headerLabels, headerInputs, body);
      wrap.appendChild(block);
    });

    return wrap;
  }

  // ─── Backgrounds table ────────────────────────────────────────────────────

  private buildBgsTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'cfg-table';

    const header = this.makeRowHeader(
      [t('configurator.bgImagePath'), t('configurator.bgName'), t('configurator.bgCost')],
      'cfg-row-bg',
    );
    table.appendChild(header);

    BACKGROUNDS_ASSETS.forEach((bg, i) => {
      const row = document.createElement('div');
      row.className = 'cfg-row cfg-row-bg';
      row.append(
        this.makeTextInput(bg.image, 'cfg-name', (v) => {
          bg.image = v;
          if (this.state.currentBackground === i) this.onForceRefreshBg(i);
        }),
        this.makeTextInput(bg.name, 'cfg-name', (v) => {
          bg.name = v;
        }),
        this.makeNumberInput(bg.cost, 'cfg-num', (v) => {
          bg.cost = v;
        }),
      );
      table.appendChild(row);
    });

    return table;
  }

  // ─── Cheats section ───────────────────────────────────────────────────────

  private buildCheatsSection(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-fields';

    let giveAmount = 1_000;

    const amountInput = this.makeNumberInput(giveAmount, 'cfg-num-wide', (v) => {
      giveAmount = v;
    });

    const giveBtn = document.createElement('button');
    giveBtn.className = 'cfg-input';
    giveBtn.textContent = t('configurator.givePoints');
    giveBtn.style.cssText = 'cursor: pointer; text-align: center; padding: 8px; background: rgba(80,200,120,0.12); border-color: rgba(80,200,120,0.4); color: #7dffaa;';
    giveBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (giveAmount > 0) this.state.applyRouletteReward(giveAmount);
    });

    wrap.appendChild(this.makeLabeledField(t('configurator.amountStars'), amountInput));
    wrap.appendChild(giveBtn);

    const painterBtn = document.createElement('button');
    painterBtn.className = 'cfg-input';
    painterBtn.textContent = t('painter.toggleOn');
    painterBtn.style.cssText =
      'cursor: pointer; text-align: center; padding: 8px; margin-top: 8px; background: rgba(78,163,255,0.14); border-color: rgba(78,163,255,0.4); color: #cfe6ff;';
    painterBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      const active = this.painter.toggle();
      painterBtn.textContent = active ? t('painter.toggleOff') : t('painter.toggleOn');
    });
    wrap.appendChild(painterBtn);

    return wrap;
  }

  // ─── Boost fields ─────────────────────────────────────────────────────────

  private buildBoostFields(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-fields';
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.multiplier'),
        this.makeNumberInput(BOOST_CONFIG.multiplier, 'cfg-num-wide', (v) => {
          BOOST_CONFIG.multiplier = v;
        }),
      ),
    );
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.durationMs'),
        this.makeNumberInput(BOOST_CONFIG.durationMs, 'cfg-num-wide', (v) => {
          BOOST_CONFIG.durationMs = v;
        }),
      ),
    );
    return wrap;
  }

  // ─── Auto-click fields ────────────────────────────────────────────────────

  private buildAutoclickFields(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-fields';
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.durationMs'),
        this.makeNumberInput(AUTOCLICK_CONFIG.durationMs, 'cfg-num-wide', (v) => {
          AUTOCLICK_CONFIG.durationMs = v;
        }),
      ),
    );
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.clicksPerSec'),
        this.makeNumberInput(AUTOCLICK_CONFIG.clicksPerSecond, 'cfg-num-wide', (v) => {
          AUTOCLICK_CONFIG.clicksPerSecond = v;
        }),
      ),
    );

    // Force activate autoclick button
    const forceBtn = document.createElement('button');
    forceBtn.className = 'cfg-input';
    forceBtn.textContent = t('configurator.forceAutoclick');
    forceBtn.style.cssText = 'cursor: pointer; text-align: center; margin-top: 8px; padding: 8px;';
    forceBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      this.state.activateAutoclick();
    });
    wrap.appendChild(forceBtn);

    return wrap;
  }

  // ─── Roulette section ─────────────────────────────────────────────────────

  private buildRouletteSection(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-fields';

    // General roulette settings
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.spinDurationMs'),
        this.makeNumberInput(ROULETTE_CONFIG.spinDurationMs, 'cfg-num-wide', (v) => {
          ROULETTE_CONFIG.spinDurationMs = v;
        }),
      ),
    );
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.spinRevolutions'),
        this.makeNumberInput(ROULETTE_CONFIG.spinRevolutions, 'cfg-num-wide', (v) => {
          ROULETTE_CONFIG.spinRevolutions = v;
        }),
      ),
    );
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.cooldownMs'),
        this.makeNumberInput(ROULETTE_CONFIG.freeSpinCooldownMs, 'cfg-num-wide', (v) => {
          ROULETTE_CONFIG.freeSpinCooldownMs = v;
        }),
      ),
    );
    wrap.appendChild(
      this.makeLabeledField(
        t('configurator.spinCostStars'),
        this.makeNumberInput(ROULETTE_CONFIG.spinCost, 'cfg-num-wide', (v) => {
          ROULETTE_CONFIG.spinCost = v;
        }),
      ),
    );

    // Sectors (prizes) table
    const sectorsTitle = document.createElement('div');
    sectorsTitle.className = 'cfg-th';
    sectorsTitle.textContent = t('configurator.prizesSectors');
    sectorsTitle.style.marginTop = '8px';
    wrap.appendChild(sectorsTitle);

    const headerRow = document.createElement('div');
    headerRow.className = 'cfg-level-row cfg-roulette-row-ext';
    [
      t('configurator.label'),
      t('configurator.icon'),
      t('configurator.color'),
      t('configurator.image'),
      t('configurator.weight'),
      t('configurator.reward'),
      '',
    ].forEach((label) => {
      const th = document.createElement('div');
      th.className = 'cfg-th';
      th.textContent = label;
      headerRow.appendChild(th);
    });
    wrap.appendChild(headerRow);

    const sectorsContainer = document.createElement('div');
    sectorsContainer.className = 'cfg-roulette-sectors';

    const renderSectors = () => {
      sectorsContainer.innerHTML = '';
      ROULETTE_SECTORS.forEach((sector, idx) => {
        const row = document.createElement('div');
        row.className = 'cfg-level-row cfg-roulette-row-ext';
        row.append(
          this.makeTextInput(sector.label, 'cfg-name', (v) => {
            sector.label = v;
          }),
          this.makeTextInput(sector.icon, 'cfg-name', (v) => {
            sector.icon = v;
          }),
          this.makeColorInput(sector.color, (v) => {
            sector.color = v;
          }),
          this.makeTextInput(sector.image ?? '', 'cfg-path', (v) => {
            sector.image = v || undefined;
          }),
          this.makeNumberInput(sector.weight, 'cfg-num', (v) => {
            sector.weight = v;
          }),
          this.makeNumberInput(sector.reward, 'cfg-num', (v) => {
            sector.reward = v;
          }),
          this.makeRemoveButton(() => {
            if (ROULETTE_SECTORS.length <= 2) return; // minimum 2 sectors
            ROULETTE_SECTORS.splice(idx, 1);
            renderSectors();
          }),
        );
        sectorsContainer.appendChild(row);
      });
    };

    renderSectors();
    wrap.appendChild(sectorsContainer);

    // Add sector button
    const addBtn = document.createElement('button');
    addBtn.className = 'cfg-input';
    addBtn.textContent = t('configurator.addSector');
    addBtn.style.cssText = 'cursor: pointer; text-align: center; margin-top: 4px; padding: 6px;';
    addBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      ROULETTE_SECTORS.push({
        label: '???',
        color: '#888888',
        weight: 10,
        icon: '🎁',
        reward: 0,
      });
      renderSectors();
    });
    wrap.appendChild(addBtn);

    // Force free spin button
    const forceBtn = document.createElement('button');
    forceBtn.className = 'cfg-input';
    forceBtn.textContent = t('configurator.forceFreeSpin');
    forceBtn.style.cssText = 'cursor: pointer; text-align: center; margin-top: 8px; padding: 8px;';
    forceBtn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      // Reset cooldown by mutating config temporarily
      ROULETTE_CONFIG.freeSpinCooldownMs = 0;
      setTimeout(() => {
        ROULETTE_CONFIG.freeSpinCooldownMs = 300_000;
      }, 100);
    });
    wrap.appendChild(forceBtn);

    return wrap;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private makeRowHeader(labels: string[], extraRowClass?: string): HTMLElement {
    const row = document.createElement('div');
    row.className = `cfg-row cfg-row-head${extraRowClass ? ` ${extraRowClass}` : ''}`;
    labels.forEach((l) => {
      const th = document.createElement('div');
      th.className = 'cfg-th';
      th.textContent = l;
      row.appendChild(th);
    });
    return row;
  }

  private makeLabeledField(label: string, input: HTMLElement): HTMLElement {
    const row = document.createElement('div');
    row.className = 'cfg-field-row';
    const lbl = document.createElement('span');
    lbl.className = 'cfg-field-label';
    lbl.textContent = label;
    row.append(lbl, input);
    return row;
  }

  private makeTextInput(
    value: string,
    className: string,
    onChange: (v: string) => void,
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'text';
    input.value = value;
    input.className = `cfg-input ${className}`;
    input.addEventListener('input', () => onChange(input.value));
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    return input;
  }

  private makeNumberInput(
    value: number,
    className: string,
    onChange: (v: number) => void,
  ): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'number';
    input.value = String(value);
    input.className = `cfg-input ${className}`;
    input.addEventListener('input', () => {
      const n = parseFloat(input.value);
      if (!Number.isNaN(n)) onChange(n);
    });
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    return input;
  }

  private makeColorInput(value: string, onChange: (v: string) => void): HTMLInputElement {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = value;
    input.className = 'cfg-input cfg-color';
    input.addEventListener('input', () => onChange(input.value));
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    return input;
  }

  private makeRemoveButton(onClick: () => void): HTMLButtonElement {
    const btn = document.createElement('button');
    btn.className = 'cfg-input cfg-remove-btn';
    btn.textContent = '✕';
    btn.title = t('configurator.removeSectorTitle');
    btn.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      onClick();
    });
    return btn;
  }

  private injectStyles(): void {
    if (document.getElementById('configurator-styles')) return;
    const style = document.createElement('style');
    style.id = 'configurator-styles';
    style.textContent = CFG_CSS;
    document.head.appendChild(style);
  }
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CFG_CSS = /* css */ `
  #configurator { position: fixed; top: 0; right: 0; height: 100vh; z-index: 500;
    display: flex; align-items: flex-start; pointer-events: none;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif; }
  #configurator * { pointer-events: auto; }

  .cfg-tab { position: relative; top: 50%; transform: translateY(-50%); width: 32px; height: 64px;
    background: rgba(22,22,40,0.92); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.12);
    border-right: none; border-radius: 10px 0 0 10px; color: #fff; font-size: 16px; cursor: pointer;
    display: flex; align-items: center; justify-content: center; transition: background 0.2s;
    flex-shrink: 0; writing-mode: vertical-lr; align-self: center; }
  .cfg-tab:hover { background: rgba(40,40,70,0.98); }

  .cfg-content { width: 430px; height: 100vh; overflow-y: auto; overflow-x: hidden;
    background: rgba(14,14,26,0.96); backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255,255,255,0.1); padding: 20px 16px;
    display: flex; flex-direction: column; gap: 20px; box-sizing: border-box; }

  .cfg-title { font-size: 15px; font-weight: 700; color: rgba(255,255,255,0.85);
    padding-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.08); }

  .cfg-section { display: flex; flex-direction: column; gap: 8px; }
  .cfg-section-title { font-size: 12px; font-weight: 600; color: rgba(255,255,255,0.45);
    text-transform: uppercase; letter-spacing: 0.6px; }

  /* ── Assets list ──────────────────── */

  .cfg-assets-list { display: flex; flex-direction: column; gap: 8px; }

  .cfg-asset { border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; overflow: hidden; }

  .cfg-asset-header-labels { display: grid; grid-template-columns: 1fr 72px;
    gap: 6px; padding: 4px 8px 2px; }

  .cfg-asset-header { display: grid; grid-template-columns: 1fr 72px;
    gap: 6px; padding: 4px 8px 6px;
    background: rgba(255,255,255,0.05); }

  .cfg-asset-body { padding: 4px 8px 6px; display: flex; flex-direction: column; gap: 3px; }

  .cfg-level-row { display: grid; grid-template-columns: 22px 1fr 68px 60px;
    gap: 5px; align-items: center; }
  .cfg-level-row.cfg-roulette-row { grid-template-columns: 1fr 1fr 60px 60px; }
  .cfg-level-row.cfg-roulette-row-ext { grid-template-columns: 1fr 40px 36px 1fr 50px 60px 24px; }

  .cfg-lv-badge { font-size: 11px; color: rgba(255,255,255,0.3); text-align: center;
    font-weight: 600; }

  /* ── Backgrounds table ────────────── */

  .cfg-table { display: flex; flex-direction: column; gap: 4px; }
  .cfg-row { display: grid; grid-template-columns: 52px 1fr 80px 70px;
    gap: 6px; align-items: center; }
  .cfg-row-head { margin-bottom: 2px; }
  .cfg-row-bg { grid-template-columns: 1fr 1fr 80px; }

  /* ── Shared ───────────────────────── */

  .cfg-th { font-size: 11px; color: rgba(255,255,255,0.35); font-weight: 500; padding: 0 2px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .cfg-th-right { text-align: right; }

  .cfg-input { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
    border-radius: 7px; color: #fff; font-size: 13px; font-family: inherit; padding: 5px 7px;
    width: 100%; box-sizing: border-box; transition: border-color 0.15s, background 0.15s; outline: none; }
  .cfg-input:focus { border-color: rgba(130,160,255,0.6); background: rgba(255,255,255,0.1); }

  .cfg-name { }
  .cfg-path { font-size: 11px; }
  .cfg-num, .cfg-num-wide { text-align: right; -moz-appearance: textfield; appearance: textfield; }
  .cfg-num::-webkit-inner-spin-button, .cfg-num::-webkit-outer-spin-button,
  .cfg-num-wide::-webkit-inner-spin-button, .cfg-num-wide::-webkit-outer-spin-button {
    -webkit-appearance: none; }

  .cfg-color { padding: 2px; height: 28px; cursor: pointer; }
  .cfg-remove-btn { width: 24px; height: 24px; padding: 0; text-align: center; cursor: pointer;
    color: rgba(255,100,100,0.7); font-size: 12px; background: rgba(255,60,60,0.1);
    border-color: rgba(255,60,60,0.25); border-radius: 4px; flex-shrink: 0; }
  .cfg-remove-btn:hover { background: rgba(255,60,60,0.25); color: #fff; }
  .cfg-roulette-sectors { display: flex; flex-direction: column; gap: 3px; }

  /* ── Boost fields ─────────────────── */

  .cfg-fields { display: flex; flex-direction: column; gap: 8px; }
  .cfg-field-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
  .cfg-field-label { font-size: 13px; color: rgba(255,255,255,0.6); flex: 1; min-width: 0; }
  .cfg-num-wide { width: 110px; flex-shrink: 0; }

  .cfg-save-btn {
    position: sticky;
    bottom: 0;
    width: 100%;
    padding: 12px;
    background: rgba(80,200,120,0.18);
    border: 1px solid rgba(80,200,120,0.45);
    border-radius: 10px;
    color: #7dffaa;
    font-size: 14px;
    font-weight: 700;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.2s;
    box-sizing: border-box;
    margin-top: 4px;
  }
  .cfg-save-btn:hover { background: rgba(80,200,120,0.3); }
`;
