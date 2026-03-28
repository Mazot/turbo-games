import type { AdProvider, AdConfig, AdType } from './types';

export class AdManager {
  private provider: AdProvider | null = null;

  async setProvider(provider: AdProvider, config: AdConfig): Promise<void> {
    this.provider?.destroy();
    this.provider = provider;
    await provider.init(config);
  }

  async show(type: AdType): Promise<boolean> {
    if (!this.provider) {
      console.warn('[AdManager] No ad provider set');
      return false;
    }
    return this.provider.showAd(type);
  }

  async preload(type: AdType): Promise<void> {
    if (!this.provider) return;
    await this.provider.preloadAd(type);
  }

  isAvailable(type: AdType): boolean {
    return this.provider?.isAvailable(type) ?? false;
  }

  destroy(): void {
    this.provider?.destroy();
    this.provider = null;
  }
}
