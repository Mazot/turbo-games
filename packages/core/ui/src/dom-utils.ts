/**
 * Create a typed DOM element with a CSS class name.
 * Shorthand for `document.createElement(tag)` + `el.className = className`.
 */
export function makeEl<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = className;
  return el;
}

/**
 * Format a number with K/M/B suffixes for compact display.
 * Examples: 999 → "999", 1500 → "1.5K", 2_500_000 → "2.5M".
 */
export function formatNumber(n: number): string {
  if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

/**
 * Idempotently inject a `<style>` tag into `<head>`.
 * If a style with the given `id` already exists, it does nothing.
 * Returns the created or existing `<style>` element.
 */
export function injectCSS(id: string, css: string): HTMLStyleElement {
  const existing = document.getElementById(id) as HTMLStyleElement | null;
  if (existing) return existing;

  const style = document.createElement('style');
  style.id = id;
  style.textContent = css;
  document.head.appendChild(style);
  return style;
}

/**
 * Remove a previously injected `<style>` tag by id.
 */
export function removeCSS(id: string): void {
  document.getElementById(id)?.remove();
}
