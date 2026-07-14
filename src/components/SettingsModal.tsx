import type { AppSettings, PressureCurve, ReadingTheme, UiLocale } from '@/types';
import { ACCENT_OPTIONS, THEMES } from '@/types';
import { detectPlatform } from '@/platform';
import { LOCALES } from '@/i18n';
import { useI18n } from '@/i18n/I18nContext';

type Props = {
  open: boolean;
  settings: AppSettings;
  onClose: () => void;
  onPatch: (p: Partial<AppSettings>) => void;
  onPickAnnFolder: () => void;
  onReset: () => void;
};

const THEME_KEYS: { id: ReadingTheme; labelKey: 'themeCream' | 'themeWhite' | 'themeDark' | 'themeSepia' | 'themeNight' }[] = [
  { id: '크림', labelKey: 'themeCream' },
  { id: '화이트', labelKey: 'themeWhite' },
  { id: '다크', labelKey: 'themeDark' },
  { id: '세피아', labelKey: 'themeSepia' },
  { id: '나이트', labelKey: 'themeNight' },
];

const CURVES: { id: PressureCurve; labelKey: 'curveLinear' | 'curveSoft' | 'curveFirm' | 'curveInk' }[] = [
  { id: 'linear', labelKey: 'curveLinear' },
  { id: 'soft', labelKey: 'curveSoft' },
  { id: 'firm', labelKey: 'curveFirm' },
  { id: 'ink', labelKey: 'curveInk' },
];

export function SettingsModal({
  open,
  settings,
  onClose,
  onPatch,
  onPickAnnFolder,
  onReset,
}: Props) {
  const { t } = useI18n();
  if (!open) return null;
  const theme = THEMES[settings.readingTheme];
  const platform = detectPlatform();
  const platformLabel =
    platform === 'electron'
      ? t('platformDesktop')
      : platform === 'android'
        ? t('platformAndroid')
        : t('platformWeb');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-card"
        style={{ background: theme.chrome, color: theme.chromeText, borderColor: theme.chromeBorder }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>{t('settingsTitle')}</h2>
          <button type="button" className="top-btn" onClick={onClose}>
            ×
          </button>
        </div>

        <p className="muted" style={{ marginTop: 0 }}>
          {t('platform')}: {platformLabel}
        </p>

        <section className="settings-section">
          <h3>{t('language')}</h3>
          <select
            className="lang-select"
            value={settings.locale}
            onChange={(e) => onPatch({ locale: e.target.value as UiLocale })}
          >
            {LOCALES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.nativeName} — {l.englishName}
              </option>
            ))}
          </select>
          <p className="muted">{t('languageHint')}</p>
          <p className="muted">{t('readingFontsHint')}</p>
        </section>

        <section className="settings-section">
          <h3>{t('readingTheme')}</h3>
          <div className="theme-grid">
            {THEME_KEYS.map(({ id, labelKey }) => (
              <button
                key={id}
                type="button"
                className={`theme-chip${settings.readingTheme === id ? ' active' : ''}`}
                style={{
                  background: THEMES[id].paper,
                  color: THEMES[id].ink,
                  borderColor:
                    settings.readingTheme === id ? settings.accentColor : THEMES[id].rule,
                }}
                onClick={() => onPatch({ readingTheme: id })}
              >
                {t(labelKey)}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section">
          <h3>{t('accentColor')}</h3>
          <div className="swatch-row">
            {ACCENT_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                className={`swatch${settings.accentColor === c ? ' selected' : ''}`}
                style={{ background: c }}
                onClick={() => onPatch({ accentColor: c })}
              />
            ))}
          </div>
        </section>

        <section className="settings-section">
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.pageTexture}
              onChange={(e) => onPatch({ pageTexture: e.target.checked })}
            />
            {t('paperTexture')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.pressureSensitivity}
              onChange={(e) => onPatch({ pressureSensitivity: e.target.checked })}
            />
            {t('pressureOn')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.vectorPdfExport}
              onChange={(e) => onPatch({ vectorPdfExport: e.target.checked })}
            />
            {t('vectorPdf')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.showThumbnails}
              onChange={(e) => onPatch({ showThumbnails: e.target.checked })}
            />
            {t('showThumbs')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.showRightPanel}
              onChange={(e) => onPatch({ showRightPanel: e.target.checked })}
            />
            {t('showRightPanel')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.autoSyncAnn}
              onChange={(e) => onPatch({ autoSyncAnn: e.target.checked })}
            />
            {t('autoSyncAnn')}
          </label>
          <label className="check-row">
            <input
              type="checkbox"
              checked={settings.compactUi}
              onChange={(e) => onPatch({ compactUi: e.target.checked })}
            />
            {t('compactUi')}
          </label>
        </section>

        <section className="settings-section">
          <h3>{t('pressureCurve')}</h3>
          <div className="theme-grid">
            {CURVES.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`theme-chip${settings.pressureCurve === c.id ? ' active' : ''}`}
                style={{
                  borderColor:
                    settings.pressureCurve === c.id ? settings.accentColor : theme.rule,
                  background: theme.paper,
                  color: theme.ink,
                }}
                onClick={() => onPatch({ pressureCurve: c.id })}
              >
                {t(c.labelKey)}
              </button>
            ))}
          </div>
          <p className="muted">{t('pressureHint')}</p>
        </section>

        <section className="settings-section">
          <h3>{t('fontScale')}</h3>
          <input
            type="range"
            min={0.85}
            max={1.4}
            step={0.05}
            value={settings.fontScale}
            onChange={(e) => onPatch({ fontScale: Number(e.target.value) })}
          />
          <div className="muted">{Math.round(settings.fontScale * 100)}%</div>
        </section>

        <section className="settings-section">
          <h3>{t('annSync')}</h3>
          {platform === 'electron' ? (
            <>
              <div className="path-row">
                <code className="path-box">{settings.annSyncFolder || t('notSet')}</code>
                <button type="button" className="open-btn" onClick={onPickAnnFolder}>
                  {t('pickFolder')}
                </button>
                {settings.annSyncFolder && (
                  <button
                    type="button"
                    className="open-btn"
                    onClick={() => onPatch({ annSyncFolder: null })}
                  >
                    {t('clearFolder')}
                  </button>
                )}
              </div>
              <p className="muted">{t('annSyncHint')}</p>
            </>
          ) : (
            <p className="muted">
              {platform === 'android' ? t('annSyncAndroid') : t('annSyncWeb')}
            </p>
          )}
        </section>

        <div className="modal-actions">
          <button type="button" className="open-btn" onClick={onReset}>
            {t('resetDefaults')}
          </button>
          <button
            type="button"
            className="open-btn primary"
            style={{ background: settings.accentColor, color: '#fff' }}
            onClick={onClose}
          >
            {t('done')}
          </button>
        </div>
      </div>
    </div>
  );
}
