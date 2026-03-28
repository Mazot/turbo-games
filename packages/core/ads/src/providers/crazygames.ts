import type { AdProvider, AdConfig, AdType } from '../types';

declare global {
  interface Window {
    CrazyGames?: {
      SDK: {
        init(): Promise<void>;
        environment: 'crazygames' | 'local' | 'disabled';
        ad: {
          requestAd(
            type: 'midgame' | 'rewarded',
            callbacks: {
              adStarted?: () => void;
              adFinished?: () => void;
              adError?: (error: unknown) => void;
            },
          ): void;
          hasAdblock(): Promise<boolean>;
        };
        banner: {
          requestBanner(options: { id: string; width: number; height: number }): Promise<void>;
          requestResponsiveBanner(containerId: string): Promise<void>;
          clearBanner(containerId: string): void;
          clearAllBanners(): void;
        };
      };
    };
  }
}

const CRAZYGAMES_SDK_URL = 'https://sdk.crazygames.com/crazygames-sdk-v3.js';
const BANNER_CONTAINER_ID = 'crazygames-banner-container';

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

export class CrazyGamesAdsProvider implements AdProvider {
  readonly name = 'crazygames';
  private initialized = false;
  private bannerContainer: HTMLDivElement | null = null;

  async init(_config: AdConfig): Promise<void> {
    await loadScript(CRAZYGAMES_SDK_URL);
    await window.CrazyGames!.SDK.init();
    this.initialized = true;
  }

  async showAd(type: AdType): Promise<boolean> {
    if (!this.initialized || !window.CrazyGames) return false;

    if (type === 'banner') {
      return this.showBanner();
    }

    const adType = type === 'interstitial' ? 'midgame' : 'rewarded';
    return new Promise<boolean>((resolve) => {
      window.CrazyGames!.SDK.ad.requestAd(adType, {
        adFinished: () => resolve(true),
        adError: () => resolve(false),
      });
    });
  }

  private async showBanner(): Promise<boolean> {
    if (!window.CrazyGames) return false;
    try {
      if (!this.bannerContainer) {
        this.bannerContainer = document.createElement('div');
        this.bannerContainer.id = BANNER_CONTAINER_ID;
        this.bannerContainer.style.cssText =
          'width:300px;height:250px;position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:9999;';
        document.body.appendChild(this.bannerContainer);
      }
      await window.CrazyGames!.SDK.banner.requestBanner({
        id: BANNER_CONTAINER_ID,
        width: 300,
        height: 250,
      });
      return true;
    } catch {
      return false;
    }
  }

  async preloadAd(_type: AdType): Promise<void> {
    // CrazyGames SDK v3 does not expose a manual preload API
  }

  isAvailable(_type: AdType): boolean {
    if (!this.initialized || !window.CrazyGames) return false;
    const env = window.CrazyGames.SDK.environment;
    return env === 'crazygames' || env === 'local';
  }

  destroy(): void {
    if (this.bannerContainer && window.CrazyGames) {
      window.CrazyGames.SDK.banner.clearAllBanners();
      this.bannerContainer.remove();
      this.bannerContainer = null;
    }
    this.initialized = false;
  }
}
