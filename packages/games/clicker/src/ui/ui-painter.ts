import { t } from '../i18n';

/**
 * Dev-only UI Painter.
 *
 * Hover-highlight DOM elements (DevTools-like outline), click to select,
 * then restyle from a floating side panel: text content, colors, font,
 * border, size, padding, radius, shadow.
 *
 * All mutations are inline `style` + `textContent` writes. Original values
 * are captured for per-element or global revert.
 *
 * Changes are persisted to localStorage so they survive page reloads.
 * Each element is keyed by a deterministic CSS-path selector.
 */

const STORAGE_KEY = 'painter-overrides';

interface FontOption {
  readonly name: string;
  readonly stack: string;
}

/**
 * Cute / anime-vibe Google Fonts that fully support Cyrillic.
 */
const ANIME_FONTS: readonly FontOption[] = [
  { name: 'Comfortaa', stack: '"Comfortaa", cursive' },
  { name: 'Fredoka', stack: '"Fredoka", sans-serif' },
  { name: 'Nunito', stack: '"Nunito", sans-serif' },
  { name: 'M PLUS Rounded 1c', stack: '"M PLUS Rounded 1c", sans-serif' },
  { name: 'Pangolin', stack: '"Pangolin", cursive' },
  { name: 'Caveat', stack: '"Caveat", cursive' },
  { name: 'Neucha', stack: '"Neucha", cursive' },
  { name: 'Pacifico', stack: '"Pacifico", cursive' },
  { name: 'Bad Script', stack: '"Bad Script", cursive' },
  { name: 'Rubik Bubbles', stack: '"Rubik Bubbles", cursive' },
  { name: 'Press Start 2P', stack: '"Press Start 2P", monospace' },
  { name: 'Ruslan Display', stack: '"Ruslan Display", cursive' },
];

const GOOGLE_FONTS_HREF =
  'https://fonts.googleapis.com/css2?' +
  [
    'family=Bad+Script',
    'family=Caveat:wght@400;700',
    'family=Comfortaa:wght@400;700',
    'family=Fredoka:wght@400;600;700',
    'family=M+PLUS+Rounded+1c:wght@400;700',
    'family=Neucha',
    'family=Nunito:wght@400;700',
    'family=Pacifico',
    'family=Pangolin',
    'family=Press+Start+2P',
    'family=Rubik+Bubbles',
    'family=Ruslan+Display',
  ].join('&') +
  '&subset=cyrillic&display=swap';

const PAINTER_STYLES = /* css */ `
  body.painter-active, body.painter-active * { cursor: crosshair !important; }
  body.painter-active .painter-toolbar,
  body.painter-active .painter-toolbar * { cursor: default !important; }

  [data-painter-locked],
  [data-painter-locked].hidden {
    display: block !important;
    visibility: visible !important;
    opacity: 1 !important;
  }

  .painter-outline {
    position: fixed;
    pointer-events: none;
    z-index: 2147483646;
    box-sizing: border-box;
    border: 2px dashed #4ea3ff;
    background: rgba(78, 163, 255, 0.08);
    border-radius: 4px;
    transition: all 0.05s linear;
  }
  .painter-outline[data-state="selected"] {
    border: 2px solid #ffd166;
    background: rgba(255, 209, 102, 0.10);
    box-shadow: 0 0 0 1px rgba(0,0,0,0.6);
  }

  .painter-toolbar {
    position: fixed;
    top: 16px;
    right: 16px;
    width: 300px;
    max-height: calc(100vh - 32px);
    overflow: auto;
    background: rgba(20, 22, 30, 0.96);
    color: #e8eaf2;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 12px;
    padding: 14px 14px 16px;
    font: 13px/1.35 'Segoe UI', system-ui, -apple-system, sans-serif;
    z-index: 2147483647;
    box-shadow: 0 12px 40px rgba(0,0,0,0.55);
  }
  .painter-toolbar h3 {
    margin: 0 0 6px;
    font-size: 14px;
    color: #ffd166;
    letter-spacing: 0.2px;
  }
  .painter-toolbar .painter-sel {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    color: #9aa3b6;
    word-break: break-all;
    margin-bottom: 10px;
  }
  .painter-toolbar .painter-section {
    border-top: 1px solid rgba(255,255,255,0.06);
    padding-top: 8px;
    margin-top: 4px;
  }
  .painter-row {
    display: grid;
    grid-template-columns: 1fr auto auto;
    gap: 6px;
    align-items: center;
    margin-bottom: 8px;
  }
  .painter-row label {
    color: #c8cee0;
    font-size: 12px;
  }
  .painter-row input[type="color"] {
    width: 36px;
    height: 26px;
    padding: 0;
    border: 1px solid rgba(255,255,255,0.15);
    background: #000;
    border-radius: 6px;
    cursor: pointer;
  }
  .painter-row input[type="text"],
  .painter-row input[type="number"],
  .painter-row input[type="range"],
  .painter-row select {
    background: rgba(255,255,255,0.05);
    color: #e8eaf2;
    border: 1px solid rgba(255,255,255,0.12);
    border-radius: 6px;
    padding: 4px 6px;
    font: inherit;
    width: 100%;
    box-sizing: border-box;
  }
  .painter-row input[type="number"] { max-width: 80px; }
  .painter-row .painter-pick {
    background: rgba(78,163,255,0.18);
    border: 1px solid rgba(78,163,255,0.45);
    color: #cfe6ff;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    white-space: nowrap;
  }
  .painter-row .painter-pick:hover { background: rgba(78,163,255,0.28); }
  .painter-row .painter-size-auto {
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.14);
    color: #9aa3b6;
    border-radius: 6px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 11px;
  }
  .painter-toolbar .painter-checkbox {
    display: flex; align-items: center; gap: 8px;
    color: #c8cee0; margin: 6px 0 10px;
    cursor: pointer;
  }
  .painter-toolbar .painter-actions {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px;
    margin-top: 10px;
  }
  .painter-toolbar .painter-actions button {
    background: rgba(255,255,255,0.06);
    color: #e8eaf2;
    border: 1px solid rgba(255,255,255,0.14);
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font: inherit;
  }
  .painter-toolbar .painter-actions button.painter-danger {
    background: rgba(255,90,90,0.15);
    border-color: rgba(255,90,90,0.4);
    color: #ffb3b3;
  }
  .painter-toolbar .painter-apply-similar {
    width: 100%;
    margin-top: 4px;
    background: rgba(80,200,120,0.14);
    border: 1px solid rgba(80,200,120,0.4);
    color: #a6f0c2;
    border-radius: 6px;
    padding: 6px 8px;
    cursor: pointer;
    font: inherit;
  }
  .painter-toolbar .painter-hint {
    font-size: 11px; color: #8a92a6; margin: 4px 0 10px;
  }
`;

interface EyeDropperResult { sRGBHex: string; }
interface EyeDropper { open(): Promise<EyeDropperResult>; }
type EyeDropperCtor = new () => EyeDropper;

interface SavedOverride {
  style?: string;
  text?: string;
}

function isOwnUI(el: Element): boolean {
  return Boolean(
    el.closest('.painter-toolbar') ||
      el.closest('.painter-outline') ||
      el.closest('#configurator'),
  );
}

/**
 * Builds a stable selector for localStorage keys. Prefers class-based
 * selectors (which survive modal re-creation) and falls back to a
 * positional path for elements without meaningful classes.
 */
function elementKey(el: HTMLElement): string {
  const selfSel = selectorSegment(el);

  const ancestors: string[] = [];
  let cur = el.parentElement;
  while (cur && cur !== document.body && cur !== document.documentElement) {
    const seg = selectorSegment(cur);
    if (seg.startsWith('.') || seg.startsWith('#')) {
      ancestors.unshift(seg);
      break;
    }
    ancestors.unshift(seg);
    cur = cur.parentElement;
  }

  if (ancestors.length === 0) return selfSel;
  return ancestors.join('>') + '>' + selfSel;
}

function selectorSegment(el: HTMLElement): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const cls = typeof el.className === 'string' ? el.className.trim() : '';
  if (cls) {
    const first = cls.split(/\s+/)[0];
    const tag = el.tagName.toLowerCase();
    const parent = el.parentElement;
    if (parent) {
      const sameCls = parent.querySelectorAll(`:scope > ${tag}.${CSS.escape(first)}`);
      if (sameCls.length > 1) {
        const idx = Array.from(sameCls).indexOf(el) + 1;
        return `${tag}.${CSS.escape(first)}:nth-of-type(${idx})`;
      }
    }
    return `${tag}.${CSS.escape(first)}`;
  }
  const tag = el.tagName.toLowerCase();
  const parent = el.parentElement;
  if (parent) {
    const sameTag = Array.from(parent.children).filter((c) => c.tagName === el.tagName);
    if (sameTag.length > 1) {
      return `${tag}:nth-of-type(${sameTag.indexOf(el) + 1})`;
    }
  }
  return tag;
}

function describeElement(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const id = el.id ? `#${el.id}` : '';
  const cls =
    el.className && typeof el.className === 'string'
      ? '.' +
        el.className
          .trim()
          .split(/\s+/)
          .filter(Boolean)
          .slice(0, 3)
          .join('.')
      : '';
  return `${tag}${id}${cls}`.slice(0, 120);
}

export class UIPainter {
  private active = false;
  private overlay!: HTMLDivElement;
  private toolbar: HTMLDivElement | null = null;
  private selected: HTMLElement | null = null;
  private readonly originalStyles = new Map<HTMLElement, string | null>();
  private readonly originalTexts = new Map<HTMLElement, string>();
  private fontsLoaded = false;
  private rafToken = 0;
  private observer: MutationObserver | null = null;

  constructor() {
    this.injectStyles();
    this.overlay = document.createElement('div');
    this.overlay.className = 'painter-outline';
    this.overlay.style.display = 'none';
    document.body.appendChild(this.overlay);

    this.handleMove = this.handleMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handlePointerDown = this.handlePointerDown.bind(this);
    this.handleKey = this.handleKey.bind(this);
    this.reposition = this.reposition.bind(this);

    this.restoreFromStorage();
  }

  toggle(): boolean {
    if (this.active) this.disable();
    else this.enable();
    return this.active;
  }

  isActive(): boolean {
    return this.active;
  }

  // ─── lifecycle ────────────────────────────────────────────────────────────

  private enable(): void {
    this.active = true;
    this.loadFontsLazy();
    document.addEventListener('mousemove', this.handleMove, true);
    document.addEventListener('pointerdown', this.handlePointerDown, true);
    document.addEventListener('pointerup', this.handlePointerDown, true);
    document.addEventListener('mousedown', this.handlePointerDown, true);
    document.addEventListener('mouseup', this.handlePointerDown, true);
    document.addEventListener('click', this.handleClick, true);
    document.addEventListener('keydown', this.handleKey, true);
    window.addEventListener('scroll', this.reposition, true);
    window.addEventListener('resize', this.reposition);
    document.body.classList.add('painter-active');
  }

  private disable(): void {
    this.active = false;
    document.removeEventListener('mousemove', this.handleMove, true);
    document.removeEventListener('pointerdown', this.handlePointerDown, true);
    document.removeEventListener('pointerup', this.handlePointerDown, true);
    document.removeEventListener('mousedown', this.handlePointerDown, true);
    document.removeEventListener('mouseup', this.handlePointerDown, true);
    document.removeEventListener('click', this.handleClick, true);
    document.removeEventListener('keydown', this.handleKey, true);
    window.removeEventListener('scroll', this.reposition, true);
    window.removeEventListener('resize', this.reposition);
    document.body.classList.remove('painter-active');
    this.overlay.style.display = 'none';
    this.deselect();
  }

  // ─── input handlers ───────────────────────────────────────────────────────

  private handleMove(e: MouseEvent): void {
    if (this.selected) return;
    const target = e.target as HTMLElement | null;
    if (!target || isOwnUI(target)) {
      this.overlay.style.display = 'none';
      return;
    }
    this.overlay.dataset.state = 'hover';
    this.positionOverlayTo(target);
    this.overlay.style.display = 'block';
  }

  /**
   * Intercepts pointerdown in capture phase so the game's own handlers
   * never fire (prevents popups from closing, purchases, etc.).
   * Selection happens here because `preventDefault()` on pointerdown
   * suppresses the subsequent `click` event per the Pointer Events spec.
   */
  private handlePointerDown(e: Event): void {
    const target = e.target as HTMLElement;
    if (isOwnUI(target)) return;
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
    if (e.type === 'pointerdown') {
      this.select(target);
    }
  }

  /** Backup: blocks any click that still makes it through. */
  private handleClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (isOwnUI(target)) return;
    e.stopPropagation();
    e.stopImmediatePropagation();
    e.preventDefault();
  }

  private handleKey(e: KeyboardEvent): void {
    if (e.key !== 'Escape') return;
    if (this.selected) {
      this.deselect();
    } else {
      this.disable();
    }
  }

  // ─── selection ────────────────────────────────────────────────────────────

  private select(el: HTMLElement): void {
    if (this.selected) this.unlockElement(this.selected);
    this.selected = el;
    if (!this.originalStyles.has(el)) {
      this.originalStyles.set(el, el.getAttribute('style'));
    }
    if (!this.originalTexts.has(el)) {
      this.originalTexts.set(el, el.textContent ?? '');
    }
    this.lockElement(el);
    this.overlay.dataset.state = 'selected';
    this.positionOverlayTo(el);
    this.overlay.style.display = 'block';
    this.openToolbar(el);
  }

  private deselect(): void {
    if (this.selected) this.unlockElement(this.selected);
    this.selected = null;
    this.overlay.style.display = 'none';
    this.closeToolbar();
  }

  /**
   * Prevents game timers from hiding an element while it's being painted
   * (e.g. the autoclick bubble disappearing mid-eyedropper use).
   * Uses a data attribute whose CSS rule forces display/visibility/opacity.
   */
  private lockElement(el: HTMLElement): void {
    el.setAttribute('data-painter-locked', '');
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      if (window.getComputedStyle(cur).display === 'none') {
        cur.setAttribute('data-painter-locked', '');
      }
      cur = cur.parentElement;
    }
  }

  private unlockElement(el: HTMLElement): void {
    el.removeAttribute('data-painter-locked');
    document.querySelectorAll('[data-painter-locked]').forEach((locked) => {
      locked.removeAttribute('data-painter-locked');
    });
  }

  private positionOverlayTo(el: HTMLElement): void {
    const r = el.getBoundingClientRect();
    this.overlay.style.left = `${r.left}px`;
    this.overlay.style.top = `${r.top}px`;
    this.overlay.style.width = `${r.width}px`;
    this.overlay.style.height = `${r.height}px`;
  }

  private reposition(): void {
    if (!this.selected) return;
    if (this.rafToken) return;
    this.rafToken = requestAnimationFrame(() => {
      this.rafToken = 0;
      if (this.selected) this.positionOverlayTo(this.selected);
    });
  }

  // ─── toolbar ──────────────────────────────────────────────────────────────

  private openToolbar(el: HTMLElement): void {
    this.closeToolbar();

    const tb = document.createElement('div');
    tb.className = 'painter-toolbar';

    const title = document.createElement('h3');
    title.textContent = t('painter.panelTitle');
    tb.appendChild(title);

    const sel = document.createElement('div');
    sel.className = 'painter-sel';
    sel.textContent = describeElement(el);
    tb.appendChild(sel);

    const hint = document.createElement('div');
    hint.className = 'painter-hint';
    hint.textContent = t('painter.hint');
    tb.appendChild(hint);

    const cs = window.getComputedStyle(el);

    // --- Text content ---
    const hasDirectText = this.hasOwnText(el);
    if (hasDirectText) {
      tb.appendChild(this.buildTextRow(t('painter.textContent'), el));
    }

    // --- Colors ---
    tb.appendChild(
      this.buildColorRow(t('painter.textColor'), rgbToHex(cs.color), (hex) => {
        el.style.color = hex;
        this.saveToStorage();
      }),
    );

    tb.appendChild(
      this.buildColorRow(t('painter.bgColor'), rgbToHex(cs.backgroundColor), (hex) => {
        el.style.backgroundColor = hex;
        this.saveToStorage();
      }),
    );

    tb.appendChild(
      this.buildRangeRow(t('painter.bgOpacity'), 0, 1, 0.05, parseAlpha(cs.backgroundColor), (v) => {
        const base = el.style.backgroundColor || cs.backgroundColor;
        el.style.backgroundColor = withAlpha(base, v);
        this.saveToStorage();
      }),
    );

    // --- Font ---
    const section1 = document.createElement('div');
    section1.className = 'painter-section';
    tb.appendChild(section1);

    section1.appendChild(
      this.buildSelectRow(t('painter.font'), ANIME_FONTS, (stack) => {
        if (stack) el.style.fontFamily = stack;
        else el.style.removeProperty('font-family');
        this.saveToStorage();
      }),
    );

    section1.appendChild(
      this.buildNumberRow(t('painter.fontSize'), parseInt(cs.fontSize) || 14, 4, 200, (v) => {
        el.style.fontSize = `${v}px`;
        this.saveToStorage();
      }),
    );

    section1.appendChild(
      this.buildNumberRow(t('painter.fontWeight'), parseInt(cs.fontWeight) || 400, 100, 900, (v) => {
        el.style.fontWeight = String(v);
        this.saveToStorage();
      }, 100),
    );

    // --- Border ---
    const section2 = document.createElement('div');
    section2.className = 'painter-section';
    tb.appendChild(section2);

    section2.appendChild(
      this.buildColorRow(t('painter.borderColor'), rgbToHex(cs.borderColor), (hex) => {
        el.style.borderColor = hex;
        if (!el.style.borderStyle || el.style.borderStyle === 'none') {
          el.style.borderStyle = 'solid';
        }
        this.saveToStorage();
      }),
    );

    section2.appendChild(
      this.buildNumberRow(t('painter.borderWidth'), parseInt(cs.borderWidth) || 0, 0, 20, (v) => {
        el.style.borderWidth = `${v}px`;
        if (v > 0 && (!el.style.borderStyle || el.style.borderStyle === 'none')) {
          el.style.borderStyle = 'solid';
        }
        this.saveToStorage();
      }),
    );

    section2.appendChild(
      this.buildNumberRow(t('painter.radius'), parseInt(cs.borderRadius) || 0, 0, 100, (v) => {
        el.style.borderRadius = `${v}px`;
        this.saveToStorage();
      }),
    );

    // --- Size ---
    const section3 = document.createElement('div');
    section3.className = 'painter-section';
    tb.appendChild(section3);

    section3.appendChild(
      this.buildSizeRow(t('painter.width'), el.offsetWidth, (v) => {
        el.style.width = v === null ? '' : `${v}px`;
        this.saveToStorage();
        this.positionOverlayTo(el);
      }),
    );

    section3.appendChild(
      this.buildSizeRow(t('painter.height'), el.offsetHeight, (v) => {
        el.style.height = v === null ? '' : `${v}px`;
        this.saveToStorage();
        this.positionOverlayTo(el);
      }),
    );

    section3.appendChild(
      this.buildNumberRow(t('painter.padding'), parseInt(cs.padding) || 0, 0, 100, (v) => {
        el.style.padding = `${v}px`;
        this.saveToStorage();
      }),
    );

    // --- Text shadow ---
    const shadowLabel = document.createElement('label');
    shadowLabel.className = 'painter-checkbox';
    const shadowCb = document.createElement('input');
    shadowCb.type = 'checkbox';
    shadowCb.checked = cs.textShadow !== 'none' && cs.textShadow !== '';
    shadowCb.addEventListener('change', () => {
      el.style.textShadow = shadowCb.checked
        ? '0 2px 6px rgba(0,0,0,0.55), 0 0 8px rgba(255,209,102,0.35)'
        : 'none';
      this.saveToStorage();
    });
    shadowLabel.appendChild(shadowCb);
    shadowLabel.appendChild(document.createTextNode(t('painter.textShadow')));
    tb.appendChild(shadowLabel);

    // --- Actions ---
    const applySimilar = document.createElement('button');
    applySimilar.className = 'painter-apply-similar';
    applySimilar.type = 'button';
    applySimilar.textContent = t('painter.applyToSimilar');
    applySimilar.addEventListener('click', () => {
      this.applyToSimilar(el);
      this.saveToStorage();
    });
    tb.appendChild(applySimilar);

    const actions = document.createElement('div');
    actions.className = 'painter-actions';

    const resetBtn = document.createElement('button');
    resetBtn.type = 'button';
    resetBtn.textContent = t('painter.resetBlock');
    resetBtn.addEventListener('click', () => this.resetElement(el));
    actions.appendChild(resetBtn);

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.textContent = t('painter.close');
    closeBtn.addEventListener('click', () => this.deselect());
    actions.appendChild(closeBtn);

    const resetAllBtn = document.createElement('button');
    resetAllBtn.type = 'button';
    resetAllBtn.className = 'painter-danger';
    resetAllBtn.textContent = t('painter.resetAll');
    resetAllBtn.style.gridColumn = 'span 2';
    resetAllBtn.addEventListener('click', () => this.resetAll());
    actions.appendChild(resetAllBtn);

    tb.appendChild(actions);
    document.body.appendChild(tb);
    this.toolbar = tb;
  }

  private closeToolbar(): void {
    this.toolbar?.remove();
    this.toolbar = null;
  }

  // ─── row builders ─────────────────────────────────────────────────────────

  /** Editable text content field. Only offered for leaf / near-leaf elements. */
  private buildTextRow(label: string, el: HTMLElement): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'text';
    input.value = this.getDirectText(el);
    input.style.gridColumn = 'span 2';
    input.addEventListener('input', () => {
      this.setDirectText(el, input.value);
      this.saveToStorage();
    });
    row.appendChild(input);

    return row;
  }

  private buildColorRow(
    label: string,
    initial: string,
    onChange: (hex: string) => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'color';
    input.value = initial || '#ffffff';
    input.addEventListener('input', () => onChange(input.value));
    row.appendChild(input);

    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'painter-pick';
    pick.textContent = t('painter.pickColor');
    pick.title = t('painter.pickColor');
    pick.addEventListener('click', async () => {
      const Ctor = (window as unknown as { EyeDropper?: EyeDropperCtor }).EyeDropper;
      if (!Ctor) {
        alert(t('painter.eyedropperUnsupported'));
        return;
      }
      try {
        const result = await new Ctor().open();
        input.value = result.sRGBHex;
        onChange(result.sRGBHex);
      } catch {
        /* user cancelled */
      }
    });
    row.appendChild(pick);

    return row;
  }

  private buildNumberRow(
    label: string,
    initial: number,
    min: number,
    max: number,
    onChange: (v: number) => void,
    step = 1,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.style.gridColumn = 'span 2';
    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v)) return;
      onChange(v);
    });
    row.appendChild(input);

    return row;
  }

  private buildRangeRow(
    label: string,
    min: number,
    max: number,
    step: number,
    initial: number,
    onChange: (v: number) => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'range';
    input.min = String(min);
    input.max = String(max);
    input.step = String(step);
    input.value = String(initial);
    input.style.gridColumn = 'span 2';
    input.addEventListener('input', () => onChange(Number(input.value)));
    row.appendChild(input);

    return row;
  }

  /** Width / Height row with an "auto" button to clear the override. */
  private buildSizeRow(
    label: string,
    initial: number,
    onChange: (v: number | null) => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const input = document.createElement('input');
    input.type = 'number';
    input.min = '0';
    input.max = '2000';
    input.step = '1';
    input.value = String(initial);
    input.addEventListener('input', () => {
      const v = Number(input.value);
      if (!Number.isFinite(v) || v < 0) return;
      onChange(v);
    });
    row.appendChild(input);

    const autoBtn = document.createElement('button');
    autoBtn.type = 'button';
    autoBtn.className = 'painter-size-auto';
    autoBtn.textContent = t('painter.sizeAuto');
    autoBtn.addEventListener('click', () => {
      onChange(null);
      input.value = '';
    });
    row.appendChild(autoBtn);

    return row;
  }

  private buildSelectRow(
    label: string,
    fonts: readonly FontOption[],
    onChange: (stack: string) => void,
  ): HTMLElement {
    const row = document.createElement('div');
    row.className = 'painter-row';

    const lab = document.createElement('label');
    lab.textContent = label;
    row.appendChild(lab);

    const select = document.createElement('select');
    select.style.gridColumn = 'span 2';

    const def = document.createElement('option');
    def.value = '';
    def.textContent = t('painter.fontDefault');
    select.appendChild(def);

    for (const f of fonts) {
      const opt = document.createElement('option');
      opt.value = f.stack;
      opt.textContent = f.name;
      opt.style.fontFamily = f.stack;
      select.appendChild(opt);
    }
    select.addEventListener('change', () => onChange(select.value));
    row.appendChild(select);

    return row;
  }

  // ─── text helpers ─────────────────────────────────────────────────────────

  /** Returns true if the element has its own (non-child) text content. */
  private hasOwnText(el: HTMLElement): boolean {
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE && (node.textContent ?? '').trim()) {
        return true;
      }
    }
    return el.children.length === 0 && (el.textContent ?? '').trim().length > 0;
  }

  /** Reads only the direct text node content (ignoring children). */
  private getDirectText(el: HTMLElement): string {
    if (el.children.length === 0) return el.textContent ?? '';
    const texts: string[] = [];
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) texts.push(node.textContent ?? '');
    }
    return texts.join('');
  }

  /** Writes text to the first text node (or sets textContent if no children). */
  private setDirectText(el: HTMLElement, text: string): void {
    if (el.children.length === 0) {
      el.textContent = text;
      return;
    }
    for (const node of Array.from(el.childNodes)) {
      if (node.nodeType === Node.TEXT_NODE) {
        node.textContent = text;
        return;
      }
    }
  }

  // ─── reset / propagate ────────────────────────────────────────────────────

  private resetElement(el: HTMLElement): void {
    const origStyle = this.originalStyles.get(el);
    if (origStyle === null || origStyle === undefined) {
      el.removeAttribute('style');
    } else {
      el.setAttribute('style', origStyle);
    }
    const origText = this.originalTexts.get(el);
    if (origText !== undefined) {
      this.setDirectText(el, origText);
    }
    this.originalStyles.delete(el);
    this.originalTexts.delete(el);
    this.saveToStorage();
    this.deselect();
  }

  private resetAll(): void {
    this.originalStyles.forEach((style, el) => {
      if (style === null) el.removeAttribute('style');
      else el.setAttribute('style', style);
    });
    this.originalTexts.forEach((text, el) => {
      this.setDirectText(el, text);
    });
    this.originalStyles.clear();
    this.originalTexts.clear();
    this.clearStorage();
    this.deselect();
  }

  private applyToSimilar(source: HTMLElement): void {
    const cls = (typeof source.className === 'string' ? source.className : '')
      .trim()
      .split(/\s+/)
      .filter(Boolean)[0];
    if (!cls) return;
    const sourceStyle = source.getAttribute('style') ?? '';
    const targets = document.querySelectorAll<HTMLElement>(`.${CSS.escape(cls)}`);
    targets.forEach((el) => {
      if (el === source || isOwnUI(el)) return;
      if (!this.originalStyles.has(el)) {
        this.originalStyles.set(el, el.getAttribute('style'));
      }
      el.setAttribute('style', sourceStyle);
    });
  }

  // ─── persistence ──────────────────────────────────────────────────────────

  private saveToStorage(): void {
    const data: Record<string, SavedOverride> = {};
    this.originalStyles.forEach((_orig, el) => {
      if (isOwnUI(el)) return;
      const path = elementKey(el);
      const entry: SavedOverride = {};
      const currentStyle = el.getAttribute('style');
      if (currentStyle) entry.style = currentStyle;
      const origText = this.originalTexts.get(el);
      if (origText !== undefined) {
        const currentText = this.getDirectText(el);
        if (currentText !== origText) entry.text = currentText;
      }
      if (entry.style || entry.text) data[path] = entry;
    });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* storage full — silently skip */
    }
  }

  private clearStorage(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  /**
   * On construction, re-applies saved overrides to existing DOM elements
   * and starts a MutationObserver to catch dynamically created elements
   * (modals, popups) and apply their saved overrides as they appear.
   */
  private restoreFromStorage(): void {
    requestAnimationFrame(() => {
      this.applySavedOverrides();
      this.startDOMObserver();
    });
  }

  private getSavedData(): Record<string, SavedOverride> | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, SavedOverride>;
    } catch {
      return null;
    }
  }

  private applySavedOverrides(): void {
    const data = this.getSavedData();
    if (!data) return;

    let fontsNeeded = false;
    for (const [path, override] of Object.entries(data)) {
      let el: HTMLElement | null = null;
      try {
        el = document.querySelector<HTMLElement>(path);
      } catch {
        continue;
      }
      if (!el || this.originalStyles.has(el)) continue;

      if (override.style) {
        this.originalStyles.set(el, el.getAttribute('style'));
        el.setAttribute('style', override.style);
        if (override.style.includes('font-family')) fontsNeeded = true;
      }
      if (override.text !== undefined) {
        this.originalTexts.set(el, this.getDirectText(el));
        this.setDirectText(el, override.text);
      }
    }

    if (fontsNeeded) this.loadFontsLazy();
  }

  private startDOMObserver(): void {
    if (this.observer) return;
    this.observer = new MutationObserver((mutations) => {
      let hasAdded = false;
      for (const m of mutations) {
        if (m.addedNodes.length > 0) {
          hasAdded = true;
          break;
        }
      }
      if (hasAdded) this.applySavedOverrides();
    });
    this.observer.observe(document.body, { childList: true, subtree: true });
  }

  // ─── infra ────────────────────────────────────────────────────────────────

  private injectStyles(): void {
    if (document.getElementById('painter-styles')) return;
    const s = document.createElement('style');
    s.id = 'painter-styles';
    s.textContent = PAINTER_STYLES;
    document.head.appendChild(s);
  }

  private loadFontsLazy(): void {
    if (this.fontsLoaded) return;
    this.fontsLoaded = true;
    const link = document.createElement('link');
    link.id = 'painter-google-fonts';
    link.rel = 'stylesheet';
    link.href = GOOGLE_FONTS_HREF;
    document.head.appendChild(link);
  }
}

// ─── color helpers ──────────────────────────────────────────────────────────

function rgbToHex(input: string): string {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return '#ffffff';
  const [r, g, b] = [Number(m[1]), Number(m[2]), Number(m[3])];
  return '#' + [r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('');
}

function parseAlpha(input: string): number {
  const m = input.match(/rgba\(\s*\d+,\s*\d+,\s*\d+,\s*([0-9.]+)\)/i);
  if (m) return Math.max(0, Math.min(1, Number(m[1])));
  if (input.startsWith('rgb(')) return 1;
  return 1;
}

function withAlpha(input: string, alpha: number): string {
  const m = input.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
  if (!m) return input;
  return `rgba(${m[1]}, ${m[2]}, ${m[3]}, ${alpha})`;
}
