import type { LocaleCode, LocaleMeta, MessageKey, Messages } from './types';
import en from './locales/en';
import ko from './locales/ko';
import ja from './locales/ja';
import zhHans from './locales/zh-Hans';
import zhHant from './locales/zh-Hant';
import es from './locales/es';
import fr from './locales/fr';
import de from './locales/de';
import it from './locales/it';
import {
  ar,
  hi,
  id,
  nl,
  pl,
  pt,
  ru,
  th,
  tr,
  uk,
  vi,
} from './locales/rest';

export type { LocaleCode, LocaleMeta, MessageKey, Messages } from './types';

export const LOCALES: LocaleMeta[] = [
  { code: 'ko', nativeName: '한국어', englishName: 'Korean', dir: 'ltr' },
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr' },
  { code: 'ja', nativeName: '日本語', englishName: 'Japanese', dir: 'ltr' },
  { code: 'zh-Hans', nativeName: '简体中文', englishName: 'Chinese (Simplified)', dir: 'ltr' },
  { code: 'zh-Hant', nativeName: '繁體中文', englishName: 'Chinese (Traditional)', dir: 'ltr' },
  { code: 'es', nativeName: 'Español', englishName: 'Spanish', dir: 'ltr' },
  { code: 'fr', nativeName: 'Français', englishName: 'French', dir: 'ltr' },
  { code: 'de', nativeName: 'Deutsch', englishName: 'German', dir: 'ltr' },
  { code: 'it', nativeName: 'Italiano', englishName: 'Italian', dir: 'ltr' },
  { code: 'pt', nativeName: 'Português', englishName: 'Portuguese', dir: 'ltr' },
  { code: 'ru', nativeName: 'Русский', englishName: 'Russian', dir: 'ltr' },
  { code: 'uk', nativeName: 'Українська', englishName: 'Ukrainian', dir: 'ltr' },
  { code: 'pl', nativeName: 'Polski', englishName: 'Polish', dir: 'ltr' },
  { code: 'nl', nativeName: 'Nederlands', englishName: 'Dutch', dir: 'ltr' },
  { code: 'tr', nativeName: 'Türkçe', englishName: 'Turkish', dir: 'ltr' },
  { code: 'ar', nativeName: 'العربية', englishName: 'Arabic', dir: 'rtl' },
  { code: 'hi', nativeName: 'हिन्दी', englishName: 'Hindi', dir: 'ltr' },
  { code: 'th', nativeName: 'ไทย', englishName: 'Thai', dir: 'ltr' },
  { code: 'vi', nativeName: 'Tiếng Việt', englishName: 'Vietnamese', dir: 'ltr' },
  { code: 'id', nativeName: 'Bahasa Indonesia', englishName: 'Indonesian', dir: 'ltr' },
];

const CATALOG: Record<LocaleCode, Messages> = {
  en,
  ko,
  ja,
  'zh-Hans': zhHans,
  'zh-Hant': zhHant,
  es,
  fr,
  de,
  it,
  pt,
  ru,
  ar,
  hi,
  th,
  vi,
  id,
  tr,
  pl,
  nl,
  uk,
};

export function isLocaleCode(v: string): v is LocaleCode {
  return v in CATALOG;
}

export function getMessages(locale: LocaleCode): Messages {
  return CATALOG[locale] || en;
}

export function getLocaleMeta(locale: LocaleCode): LocaleMeta {
  return LOCALES.find((l) => l.code === locale) || LOCALES[1];
}

/** Simple `{name}` interpolation. */
export function formatMessage(
  template: string,
  vars?: Record<string, string | number>,
): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`,
  );
}

export function t(
  locale: LocaleCode,
  key: MessageKey,
  vars?: Record<string, string | number>,
): string {
  const msgs = getMessages(locale);
  const raw = msgs[key] ?? en[key] ?? key;
  return formatMessage(raw, vars);
}

/** Detect OS / browser language → closest LocaleCode. */
export function detectLocale(): LocaleCode {
  if (typeof navigator === 'undefined') return 'en';
  const list = [...(navigator.languages || []), navigator.language].filter(Boolean);
  for (const raw of list) {
    const tag = raw.toLowerCase();
    if (tag.startsWith('zh-hant') || tag.startsWith('zh-tw') || tag.startsWith('zh-hk') || tag.startsWith('zh-mo')) {
      return 'zh-Hant';
    }
    if (tag.startsWith('zh')) return 'zh-Hans';
    if (tag.startsWith('ko')) return 'ko';
    if (tag.startsWith('ja')) return 'ja';
    if (tag.startsWith('es')) return 'es';
    if (tag.startsWith('fr')) return 'fr';
    if (tag.startsWith('de')) return 'de';
    if (tag.startsWith('it')) return 'it';
    if (tag.startsWith('pt')) return 'pt';
    if (tag.startsWith('ru')) return 'ru';
    if (tag.startsWith('uk')) return 'uk';
    if (tag.startsWith('ar')) return 'ar';
    if (tag.startsWith('hi')) return 'hi';
    if (tag.startsWith('th')) return 'th';
    if (tag.startsWith('vi')) return 'vi';
    if (tag.startsWith('id') || tag.startsWith('ms')) return 'id';
    if (tag.startsWith('tr')) return 'tr';
    if (tag.startsWith('pl')) return 'pl';
    if (tag.startsWith('nl')) return 'nl';
    if (tag.startsWith('en')) return 'en';
  }
  return 'en';
}
