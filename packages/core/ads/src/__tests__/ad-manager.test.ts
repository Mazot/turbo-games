import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdManager } from '../ad-manager';
import type { AdProvider, AdType, AdConfig } from '../types';

const testConfig: AdConfig = { appId: 'test-app', testMode: true };

function createMockProvider(overrides: Partial<AdProvider> = {}): AdProvider {
  return {
    name: 'mock',
    init: vi.fn().mockResolvedValue(undefined),
    showAd: vi.fn().mockResolvedValue(true),
    preloadAd: vi.fn().mockResolvedValue(undefined),
    isAvailable: vi.fn().mockReturnValue(true),
    destroy: vi.fn(),
    ...overrides,
  };
}

describe('AdManager', () => {
  let manager: AdManager;

  beforeEach(() => {
    manager = new AdManager();
  });

  it('can set a provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    expect(provider.init).toHaveBeenCalledWith(testConfig);
  });

  it('show delegates to provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    const result = await manager.show('interstitial');
    expect(provider.showAd).toHaveBeenCalledWith('interstitial');
    expect(result).toBe(true);
  });

  it('show warns when no provider is set', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await manager.show('interstitial');
    expect(result).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('preload delegates to provider', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    await manager.preload('rewarded');
    expect(provider.preloadAd).toHaveBeenCalledWith('rewarded');
  });

  it('isAvailable returns false when no provider', () => {
    expect(manager.isAvailable('interstitial')).toBe(false);
  });

  it('isAvailable delegates to provider', async () => {
    const provider = createMockProvider({ isAvailable: vi.fn().mockReturnValue(true) });
    await manager.setProvider(provider, testConfig);
    expect(manager.isAvailable('rewarded')).toBe(true);
    expect(provider.isAvailable).toHaveBeenCalledWith('rewarded');
  });

  it('destroy calls provider destroy and clears it', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);
    manager.destroy();
    expect(provider.destroy).toHaveBeenCalled();
    // After destroy, show should warn (no provider)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    await manager.show('interstitial');
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('replacing provider destroys the old one', async () => {
    const old = createMockProvider();
    const next = createMockProvider();
    await manager.setProvider(old, testConfig);
    await manager.setProvider(next, testConfig);
    expect(old.destroy).toHaveBeenCalled();
  });

  it('supports all ad types', async () => {
    const provider = createMockProvider();
    await manager.setProvider(provider, testConfig);

    const types: AdType[] = ['interstitial', 'rewarded', 'banner'];
    for (const type of types) {
      await manager.show(type);
      expect(provider.showAd).toHaveBeenCalledWith(type);
    }
  });
});
