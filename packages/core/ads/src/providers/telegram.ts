import type { AdProvider, AdConfig, AdType } from '../types';

interface ShowPromiseResult {
  done: boolean;
  description: string;
  state: 'load' | 'render' | 'playing' | 'destroy';
  error: boolean;
}

type AdsgramBannerType = 'RewardedVideo' | 'FullscreenMedia';

type AdsgramEventType =
  | 'onReward'
  | 'onComplete'
  | 'onStart'
  | 'onSkip'
  | 'onBannerNotFound'
  | 'onNonStopShow'
  | 'onTooLongSession'
  | 'onError';

interface AdsgramController {
  show(): Promise<ShowPromiseResult>;
  addEventListener(event: AdsgramEventType, handler: () => void): void;
  removeEventListener(event: AdsgramEventType, handler: () => void): void;
  destroy(): void;
}

declare global {
  interface Window {
    Adsgram?: {
      init(params: {
        blockId: string;
        debug?: boolean;
        debugBannerType?: AdsgramBannerType;
      }): AdsgramController;
    };
  }
}

const ADSGRAM_SDK_URL = 'https://sad.adsgram.ai/js/sad.min.js';

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

export class TelegramAdsProvider implements AdProvider {
  readonly name = 'telegram';
  private initialized = false;
  private blockId = '';
  private debug = false;

  async init(config: AdConfig): Promise<void> {
    this.blockId = config.appId;
    this.debug = config.testMode ?? false;
    await loadScript(ADSGRAM_SDK_URL);
    this.initialized = true;
  }

  async showAd(type: AdType): Promise<boolean> {
    if (!this.initialized || !window.Adsgram || type === 'banner') return false;

    const debugBannerType: AdsgramBannerType =
      type === 'rewarded' ? 'RewardedVideo' : 'FullscreenMedia';

    const controller = window.Adsgram.init({
      blockId: this.blockId,
      debug: this.debug,
      debugBannerType: this.debug ? debugBannerType : undefined,
    });

    try {
      const result = await controller.show();
      return result.done && !result.error;
    } catch {
      return false;
    }
  }

  async preloadAd(_type: AdType): Promise<void> {
    // AdsGram handles preloading internally
  }

  isAvailable(type: AdType): boolean {
    if (!this.initialized || type === 'banner') return false;
    return !!window.Adsgram;
  }

  destroy(): void {
    this.initialized = false;
  }
}
