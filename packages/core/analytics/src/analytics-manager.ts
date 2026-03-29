import type { AnalyticsProvider, AnalyticsConfig } from './types';

export class AnalyticsManager {
  private provider: AnalyticsProvider | null = null;

  async setProvider(provider: AnalyticsProvider, config: AnalyticsConfig): Promise<void> {
    this.provider?.destroy();
    this.provider = provider;
    await provider.init(config);
  }

  trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
    if (!this.provider) {
      console.warn('[AnalyticsManager] No analytics provider set');
      return;
    }
    this.provider.trackEvent(name, params);
  }

  trackScreenView(screenName: string): void {
    if (!this.provider) return;
    this.provider.trackScreenView(screenName);
  }

  setUserProperty(key: string, value: string | number | boolean): void {
    if (!this.provider) return;
    this.provider.setUserProperty(key, value);
  }

  destroy(): void {
    this.provider?.destroy();
    this.provider = null;
  }
}
