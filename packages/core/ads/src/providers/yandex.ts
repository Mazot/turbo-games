import type { AdProvider, AdConfig, AdType } from '../types';

interface YandexSDK {
  adv: {
    showFullscreenAdv(options?: {
      callbacks?: {
        onOpen?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: object) => void;
      };
    }): void;
    showRewardedVideo(options?: {
      callbacks?: {
        onOpen?: () => void;
        onRewarded?: () => void;
        onClose?: (wasShown: boolean) => void;
        onError?: (error: object) => void;
      };
    }): void;
    showBannerAdv(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }>;
    hideBannerAdv(): Promise<{ stickyAdvIsShowing: boolean }>;
    getBannerAdvStatus(): Promise<{ stickyAdvIsShowing: boolean; reason?: string }>;
  };
}

declare global {
  interface Window {
    YaGames?: {
      init(): Promise<YandexSDK>;
    };
  }
}

const YANDEX_SDK_URL = 'https://yandex.ru/games/sdk/v2';

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

export class YandexAdsProvider implements AdProvider {
  readonly name = 'yandex';
  private initialized = false;
  private ysdk: YandexSDK | null = null;
  private bannerShowing = false;

  async init(_config: AdConfig): Promise<void> {
    await loadScript(YANDEX_SDK_URL);
    this.ysdk = await window.YaGames!.init();
    this.initialized = true;
  }

  async showAd(type: AdType): Promise<boolean> {
    if (!this.initialized || !this.ysdk) return false;

    if (type === 'banner') {
      try {
        const result = await this.ysdk.adv.showBannerAdv();
        this.bannerShowing = result.stickyAdvIsShowing;
        return this.bannerShowing;
      } catch {
        return false;
      }
    }

    if (type === 'interstitial') {
      return new Promise<boolean>((resolve) => {
        this.ysdk!.adv.showFullscreenAdv({
          callbacks: {
            onClose: (wasShown) => resolve(wasShown),
            onError: () => resolve(false),
          },
        });
      });
    }

    // rewarded
    return new Promise<boolean>((resolve) => {
      let rewarded = false;
      this.ysdk!.adv.showRewardedVideo({
        callbacks: {
          onRewarded: () => { rewarded = true; },
          onClose: () => resolve(rewarded),
          onError: () => resolve(false),
        },
      });
    });
  }

  async preloadAd(_type: AdType): Promise<void> {
    // Yandex SDK handles preloading internally
  }

  isAvailable(_type: AdType): boolean {
    return this.initialized && this.ysdk !== null;
  }

  destroy(): void {
    if (this.ysdk && this.bannerShowing) {
      void this.ysdk.adv.hideBannerAdv();
    }
    this.initialized = false;
    this.ysdk = null;
    this.bannerShowing = false;
  }
}
