import type { AnalyticsProvider, AnalyticsConfig } from '../types';

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export class GoogleAnalyticsProvider implements AnalyticsProvider {
  readonly name = 'google';

  private measurementId = '';

  async init(config: AnalyticsConfig): Promise<void> {
    this.measurementId = config.measurementId;

    if (typeof window === 'undefined') return;

    // Inject the gtag.js script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer ?? [];
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer.push(arguments);
    };

    window.gtag('js', new Date());
    window.gtag('config', this.measurementId, {
      debug_mode: config.debug ?? false,
    });

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('[GoogleAnalytics] Failed to load gtag.js'));
    });
  }

  trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
    window.gtag('event', name, params);
  }

  trackScreenView(screenName: string): void {
    window.gtag('event', 'screen_view', { screen_name: screenName });
  }

  setUserProperty(key: string, value: string | number | boolean): void {
    window.gtag('set', 'user_properties', { [key]: value });
  }

  destroy(): void {
    // gtag.js does not provide a teardown API; remove the script tag
    const script = document.querySelector(
      `script[src*="googletagmanager.com/gtag/js?id=${encodeURIComponent(this.measurementId)}"]`,
    );
    script?.remove();
  }
}
