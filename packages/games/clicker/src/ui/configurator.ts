import { ASSETS, BACKGROUNDS_ASSETS, BOOST_CONFIG } from '../config';

export interface ConfiguratorCallbacks {
  onAssetChange: (index: number) => void;
  onBackgroundChange: (index: number) => void;
  getCurrentAsset: () => number;
  getCurrentBackground: () => number;
}

export class ConfiguratorPanel {
  private root: HTMLDivElement;
  private contentEl!: HTMLDivElement;
  private tabEl!: HTMLButtonElement;
  private visible = true;

  constructor(private callbacks: ConfiguratorCallbacks) {
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

  private build(): void {
    this.root.innerHTML = '';

    this.tabEl = document.createElement('button');
    this.tabEl.className = 'cfg-tab';
    this.tabEl.title = 'Configurator';
    this.tabEl.textContent = '⚙️';
    this.tabEl.addEventListener('click', () => this.toggle());

    this.contentEl = document.createElement('div');
    this.contentEl.className = 'cfg-content';

    const title = document.createElement('div');
    title.className = 'cfg-title';
    title.textContent = '⚙️ Configurator';
    this.contentEl.appendChild(title);

    this.contentEl.appendChild(this.buildSection('🎨 Assets', this.buildAssetsTable()));
    this.contentEl.appendChild(this.buildSection('🖼️ Backgrounds', this.buildBgsTable()));
    this.contentEl.appendChild(this.buildSection('⚡ Boost', this.buildBoostFields()));

    this.root.append(this.tabEl, this.contentEl);
  }

  private toggle(): void {
    this.visible = !this.visible;
    this.contentEl.style.display = this.visible ? 'flex' : 'none';
    this.tabEl.textContent = this.visible ? '✕' : '⚙️';
  }

  // ─── Section wrapper ───────────────────────────────────────────────────────

  private buildSection(title: string, body: HTMLElement): HTMLElement {
    const section = document.createElement('div');
    section.className = 'cfg-section';

    const head = document.createElement('div');
    head.className = 'cfg-section-title';
    head.textContent = title;

    section.append(head, body);
    return section;
  }

  // ─── Assets table ──────────────────────────────────────────────────────────

  private buildAssetsTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'cfg-table';

    const header = this.makeRowHeader(['Image Path', 'Name', 'Cost ⭐', '+/click']);
    table.appendChild(header);

    ASSETS.forEach((asset, i) => {
      const row = document.createElement('div');
      row.className = 'cfg-row';

      row.append(
        this.makeTextInput(asset.image, 'cfg-emoji', (v) => {
          asset.image = v;
          if (this.callbacks.getCurrentAsset() === i) this.callbacks.onAssetChange(i);
        }),
        this.makeTextInput(asset.name, 'cfg-name', (v) => { asset.name = v; }),
        this.makeNumberInput(asset.cost, 'cfg-num', (v) => { asset.cost = v; }),
        this.makeNumberInput(asset.pointsPerClick, 'cfg-num', (v) => { asset.pointsPerClick = v; }),
      );

      table.appendChild(row);
    });

    return table;
  }

  // ─── Backgrounds table ─────────────────────────────────────────────────────

  private buildBgsTable(): HTMLElement {
    const table = document.createElement('div');
    table.className = 'cfg-table';

    const header = this.makeRowHeader(['Image Path', 'Name', 'Cost ⭐']);
    table.appendChild(header);

    BACKGROUNDS_ASSETS.forEach((bg, i) => {
      const row = document.createElement('div');
      row.className = 'cfg-row cfg-row-bg';

      row.append(
        this.makeTextInput(bg.image, 'cfg-name', (v) => {
          bg.image = v;
          if (this.callbacks.getCurrentBackground() === i) this.callbacks.onBackgroundChange(i);
        }),
        this.makeTextInput(bg.name, 'cfg-name', (v) => { bg.name = v; }),
        this.makeNumberInput(bg.cost, 'cfg-num', (v) => { bg.cost = v; }),
      );

      table.appendChild(row);
    });

    return table;
  }

  // ─── Boost fields ──────────────────────────────────────────────────────────

  private buildBoostFields(): HTMLElement {
    const wrap = document.createElement('div');
    wrap.className = 'cfg-fields';

    wrap.appendChild(this.makeLabeledField(
      'Multiplier',
      this.makeNumberInput(BOOST_CONFIG.multiplier, 'cfg-num-wide', (v) => { BOOST_CONFIG.multiplier = v; }),
    ));
    wrap.appendChild(this.makeLabeledField(
      'Duration (ms)',
      this.makeNumberInput(BOOST_CONFIG.durationMs, 'cfg-num-wide', (v) => { BOOST_CONFIG.durationMs = v; }),
    ));

    return wrap;
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private makeRowHeader(labels: string[]): HTMLElement {
    const row = document.createElement('div');
    row.className = 'cfg-row cfg-row-head';
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
    input.value = toValidHex(value);
    input.className = 'cfg-input cfg-color';
    input.addEventListener('input', () => onChange(input.value));
    input.addEventListener('pointerdown', (e) => e.stopPropagation());
    return input;
  }

  private injectStyles(): void {
    if (document.getElementById('configurator-styles')) return;
    const style = document.createElement('style');
    style.id = 'configurator-styles';
    style.textContent = CFG_CSS;
    document.head.appendChild(style);
  }
}

// ─── Utility ─────────────────────────────────────────────────────────────────

function toValidHex(color: string): string {
  return /^#[0-9a-fA-F]{6}$/.test(color) ? color : '#000000';
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const CFG_CSS = /* css */ `
  #configurator {
    position: fixed;
    top: 0;
    right: 0;
    height: 100vh;
    z-index: 500;
    display: flex;
    align-items: flex-start;
    pointer-events: none;
    font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  }

  #configurator * {
    pointer-events: auto;
  }

  /* ── Toggle tab ─────────────────────────────── */

  .cfg-tab {
    position: relative;
    top: 50%;
    transform: translateY(-50%);
    width: 32px;
    height: 64px;
    background: rgba(22, 22, 40, 0.92);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-right: none;
    border-radius: 10px 0 0 10px;
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
    flex-shrink: 0;
    writing-mode: vertical-lr;
    align-self: center;
  }

  .cfg-tab:hover {
    background: rgba(40, 40, 70, 0.98);
  }

  /* ── Panel ──────────────────────────────────── */

  .cfg-content {
    width: 430px;
    height: 100vh;
    overflow-y: auto;
    overflow-x: hidden;
    background: rgba(14, 14, 26, 0.96);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-left: 1px solid rgba(255, 255, 255, 0.1);
    padding: 20px 16px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    box-sizing: border-box;
  }

  .cfg-title {
    font-size: 15px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.85);
    padding-bottom: 4px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }

  /* ── Section ────────────────────────────────── */

  .cfg-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cfg-section-title {
    font-size: 12px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.45);
    text-transform: uppercase;
    letter-spacing: 0.6px;
  }

  /* ── Table ──────────────────────────────────── */

  .cfg-table {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .cfg-row {
    display: grid;
    grid-template-columns: 52px 1fr 80px 70px;
    gap: 6px;
    align-items: center;
  }

  .cfg-row-head {
    margin-bottom: 2px;
  }

  .cfg-th {
    font-size: 11px;
    color: rgba(255, 255, 255, 0.35);
    font-weight: 500;
    padding: 0 2px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  /* Backgrounds table has different column widths */
  .cfg-row-bg {
    grid-template-columns: 1fr 1fr 80px;
  }

  /* ── Inputs ─────────────────────────────────── */

  .cfg-input {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 7px;
    color: #fff;
    font-size: 13px;
    font-family: inherit;
    padding: 5px 7px;
    width: 100%;
    box-sizing: border-box;
    transition: border-color 0.15s, background 0.15s;
    outline: none;
  }

  .cfg-input:focus {
    border-color: rgba(130, 160, 255, 0.6);
    background: rgba(255, 255, 255, 0.1);
  }

  .cfg-emoji {
    text-align: center;
    font-size: 18px;
    padding: 3px 4px;
  }

  .cfg-num,
  .cfg-num-wide {
    text-align: right;
    -moz-appearance: textfield;
    appearance: textfield;
  }

  .cfg-num::-webkit-inner-spin-button,
  .cfg-num::-webkit-outer-spin-button,
  .cfg-num-wide::-webkit-inner-spin-button,
  .cfg-num-wide::-webkit-outer-spin-button {
    -webkit-appearance: none;
  }

  .cfg-color {
    padding: 2px;
    height: 32px;
    cursor: pointer;
    border-radius: 7px;
  }

  /* ── Labeled fields (boost) ─────────────────── */

  .cfg-fields {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .cfg-field-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cfg-field-label {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    flex: 1;
    min-width: 0;
  }

  .cfg-num-wide {
    width: 110px;
    flex-shrink: 0;
  }
`;
