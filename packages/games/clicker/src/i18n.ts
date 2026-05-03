import { initI18n, t as i18nT } from '@turbo-games/i18n';
import { clickerRu } from './locales/ru';

/**
 * Loads Russian strings and initializes i18next for the clicker entry.
 */
export async function initClickerI18n(): Promise<void> {
  await initI18n({
    lng: 'ru',
    resources: {
      ru: {
        translation: clickerRu as unknown as Record<string, unknown>,
      },
    },
  });
}

/**
 * Shorthand for translated strings in the clicker namespace (nested keys with dot notation).
 */
export function t(
  key: string,
  options?: Record<string, string | number | boolean | null | undefined> & { defaultValue?: string },
): string {
  return i18nT(key, options as Record<string, unknown>);
}

/** Localized display name for a character asset (`config` English `name` field). */
export function tAssetName(englishName: string): string {
  return i18nT(`assets.${englishName}`, { defaultValue: englishName });
}

/** Localized display name for a background (`config` English `name` field). */
export function tBgName(englishName: string): string {
  return i18nT(`backgrounds.${englishName}`, { defaultValue: englishName });
}
