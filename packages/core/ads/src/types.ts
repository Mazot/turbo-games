export type AdType = 'interstitial' | 'rewarded' | 'banner';

export interface AdConfig {
  /** Platform-specific app/game ID */
  appId: string;
  /** Enable test/debug mode */
  testMode?: boolean;
}

export interface AdProvider {
  readonly name: string;
  init(config: AdConfig): Promise<void>;
  showAd(type: AdType): Promise<boolean>;
  preloadAd(type: AdType): Promise<void>;
  isAvailable(type: AdType): boolean;
  destroy(): void;
}
