import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AnalyticsManager } from '../analytics-manager';
import type { AnalyticsProvider, AnalyticsConfig } from '../types';

const testConfig: AnalyticsConfig = { measurementId: 'G-TEST', debug: true };

function createMockProvider(overrides: Partial<AnalyticsProvider> = {}): AnalyticsProvider {
  return {
    name: 'mock',
    init: vi.fn().mockResolvedValue(undefined),
    trackEvent: vi.fn(),
    trackScreenView: vi.fn(),
    setUserProperty: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

describe('AnalyticsManager', () => {
  let manager: AnalyticsManager;

  beforeEach(() => {
    manager = new AnalyticsManager();
  });

  it('sets provider and initializes it', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    expect(provider.init).toHaveBeenCalledWith(testConfig);
  });

  it('trackEvent delegates to provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    manager.trackEvent('click', { value: 1 });
    expect(provider.trackEvent).toHaveBeenCalledWith('click', { value: 1 });
  });

  it('trackEvent warns when no provider', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    manager.trackEvent('click');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('trackScreenView delegates to provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    manager.trackScreenView('home');
    expect(provider.trackScreenView).toHaveBeenCalledWith('home');
  });

  it('setUserProperty delegates to provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    manager.setUserProperty('level', 5);
    expect(provider.setUserProperty).toHaveBeenCalledWith('level', 5);
  });

  it('destroy calls provider destroy and clears it', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    manager.destroy();
    expect(provider.destroy).toHaveBeenCalled();
  });

  it('replacing provider destroys the old one', async () => {
    const old = createMockProvider();
    const next = createMockProvider();
    await manager.setProvider(old, testConfig);
    await manager.setProvider(next, testConfig);
    expect(old.destroy).toHaveBeenCalled();
  });
});
