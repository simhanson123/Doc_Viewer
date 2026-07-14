import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, UiLocale } from '@/types';
import { DEFAULT_SETTINGS } from '@/types';
import { detectLocale, isLocaleCode } from '@/i18n';

const KEY = 'onjeom-settings-v1';

function load(): AppSettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const detected = detectLocale();
      return {
        ...DEFAULT_SETTINGS,
        locale: (isLocaleCode(detected) ? detected : 'en') as UiLocale,
      };
    }
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    const locale =
      parsed.locale && isLocaleCode(parsed.locale)
        ? (parsed.locale as UiLocale)
        : (detectLocale() as UiLocale);
    return { ...DEFAULT_SETTINGS, ...parsed, locale };
  } catch {
    return { ...DEFAULT_SETTINGS, locale: detectLocale() as UiLocale };
  }
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(settings));
    } catch {
      /* ignore */
    }
  }, [settings]);

  const patch = useCallback((p: Partial<AppSettings>) => {
    setSettings((s) => ({ ...s, ...p }));
  }, []);

  const reset = useCallback(
    () =>
      setSettings({
        ...DEFAULT_SETTINGS,
        locale: detectLocale() as UiLocale,
      }),
    [],
  );

  return { settings, patch, reset, setSettings };
}
