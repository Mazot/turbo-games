import { initI18n, t as i18nT } from '@turbo-games/i18n';
import { brotatoRu } from './locales/ru';

/** Initializes Russian strings for the brotato entry. */
export async function initBrotatoI18n(): Promise<void> {
  await initI18n({
    lng: 'ru',
    resources: {
      ru: {
        translation: brotatoRu as unknown as Record<string, unknown>,
      },
    },
  });
}

export function t(
  key: string,
  options?: Record<string, string | number | boolean | null | undefined> & { defaultValue?: string },
): string {
  return i18nT(key, options as Record<string, unknown>);
}
