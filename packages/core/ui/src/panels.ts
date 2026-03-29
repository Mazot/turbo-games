/**
 * Base class for UI overlay panels.
 * Provides a positioned container, show/hide, and cleanup.
 */
export class HudPanel {
  protected container: HTMLDivElement;

  constructor(id: string, css?: string) {
    this.container = document.createElement('div');
    this.container.id = id;
    this.container.style.cssText =
      css ??
      `
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 1000;
      font-family: system-ui, sans-serif;
    `;
    document.body.appendChild(this.container);
  }

  show(): void {
    this.container.style.display = '';
  }

  hide(): void {
    this.container.style.display = 'none';
  }

  get visible(): boolean {
    return this.container.style.display !== 'none';
  }

  destroy(): void {
    this.container.remove();
  }
}

/**
 * Base class for collapsible dev-only panels (cheats, configurators, editors).
 * Hidden in production when guarded by `import.meta.env.DEV`.
 */
export class DevPanel extends HudPanel {
  private _collapsed = false;
  private toggleBtn: HTMLButtonElement;
  protected content: HTMLDivElement;

  constructor(id: string, label: string) {
    super(
      id,
      `
      position: fixed;
      top: 10px;
      right: 10px;
      z-index: 9999;
      font-family: monospace;
      font-size: 12px;
    `,
    );
    this.container.style.pointerEvents = 'auto';

    this.toggleBtn = document.createElement('button');
    this.toggleBtn.textContent = label;
    this.toggleBtn.style.cssText = `
      background: rgba(255,165,0,0.9);
      color: #000;
      border: none;
      padding: 4px 10px;
      cursor: pointer;
      font-family: inherit;
      font-size: inherit;
      font-weight: bold;
      border-radius: 4px;
    `;
    this.toggleBtn.addEventListener('click', () => this.toggle());
    this.container.appendChild(this.toggleBtn);

    this.content = document.createElement('div');
    this.content.style.cssText = `
      margin-top: 6px;
      background: rgba(0,0,0,0.85);
      color: #0f0;
      padding: 10px;
      border-radius: 6px;
      max-height: 60vh;
      overflow-y: auto;
    `;
    this.container.appendChild(this.content);
  }

  get collapsed(): boolean {
    return this._collapsed;
  }

  toggle(): void {
    this._collapsed = !this._collapsed;
    this.content.style.display = this._collapsed ? 'none' : '';
  }
}
