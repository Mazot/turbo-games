import i18next from 'i18next';

/**
 * Resource shape expected by i18next (`translation` is the default namespace).
 */
export type TranslationResources = Record<
  string,
  { translation: Record<string, unknown> }
>;

export interface InitI18nOptions {
  /** BCP-47 language code; defaults to `ru`. */
  lng?: string;
  resources: TranslationResources;
}

/**
 * Initializes i18next once per page load. If already initialized (e.g. HMR),
 * merges new resource bundles and switches language.
 */
export async function initI18n(options: InitI18nOptions): Promise<typeof i18next> {
  const lng = options.lng ?? 'ru';

  if (i18next.isInitialized) {
    await i18next.changeLanguage(lng);
    for (const [lang, bundle] of Object.entries(options.resources)) {
      i18next.addResourceBundle(lang, 'translation', bundle.translation, true, true);
    }
    return i18next;
  }

  await i18next.init({
    lng,
    fallbackLng: lng,
    resources: options.resources as Record<string, Record<string, Record<string, unknown>>>,
    interpolation: { escapeValue: false },
  });
  return i18next;
}

/**
 * Typed shorthand for the default `translation` namespace.
 */
export function t(key: string, options?: Record<string, unknown>): string {
  return String(i18next.t(key, options));
}

export { i18next };
