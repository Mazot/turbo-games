export interface AnalyticsConfig {
  /** Measurement / tracking ID (e.g. Google GA4 "G-XXXXXXXXXX") */
  measurementId: string;
  /** Enable debug / verbose mode */
  debug?: boolean;
}

export interface AnalyticsProvider {
  readonly name: string;
  init(config: AnalyticsConfig): Promise<void>;
  trackEvent(name: string, params?: Record<string, string | number | boolean>): void;
  trackScreenView(screenName: string): void;
  setUserProperty(key: string, value: string | number | boolean): void;
  destroy(): void;
}
