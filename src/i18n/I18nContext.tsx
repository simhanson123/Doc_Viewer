import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import type { LocaleCode, MessageKey } from './types';
import { getLocaleMeta, t as translate } from './index';

type I18nCtx = {
  locale: LocaleCode;
  dir: 'ltr' | 'rtl';
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({
  locale,
  children,
}: {
  locale: LocaleCode;
  children: ReactNode;
}) {
  const meta = getLocaleMeta(locale);

  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    document.body.dir = meta.dir;
  }, [locale, meta.dir]);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => translate(locale, key, vars),
    [locale],
  );

  const value = useMemo(
    () => ({ locale, dir: meta.dir, t }),
    [locale, meta.dir, t],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
