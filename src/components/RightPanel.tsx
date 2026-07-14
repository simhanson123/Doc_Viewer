import type { DocumentModel, DocAnn, AppSettings, ThemeTokens } from '@/types';
import { buildToc, extractHighlightEntries, searchInDocument } from '@/lib/toc';
import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nContext';

type Props = {
  doc: DocumentModel;
  ann: DocAnn;
  settings: AppSettings;
  theme: ThemeTokens;
  accent: string;
  onGoPage: (p: number, heading?: string) => void;
  onPatch: (p: Partial<AppSettings>) => void;
  onRemoveHighlight: (id: string) => void;
};

export function RightPanel({
  doc,
  ann,
  settings,
  theme,
  accent,
  onGoPage,
  onPatch,
  onRemoveHighlight,
}: Props) {
  const { t } = useI18n();
  const [q, setQ] = useState('');
  const toc = useMemo(() => buildToc(doc), [doc]);
  const highlights = useMemo(() => extractHighlightEntries(doc, ann.hl || {}), [doc, ann.hl]);
  const notes = useMemo(() => {
    const out: { page: number; text: string; id: string }[] = [];
    for (const [pi, pa] of Object.entries(ann.pages || {})) {
      for (const n of pa.notes || []) {
        out.push({ page: Number(pi), text: n.text || '…', id: n.id });
      }
    }
    return out.sort((a, b) => a.page - b.page);
  }, [ann.pages]);
  const hits = useMemo(() => searchInDocument(doc, q), [doc, q]);
  const tab = settings.rightPanelTab;

  return (
    <aside
      className="right-panel"
      style={{
        background: theme.sidebar,
        borderColor: theme.chromeBorder,
        color: theme.chromeText,
      }}
    >
      <div className="right-tabs">
        {(
          [
            ['toc', 'toc'],
            ['search', 'search'],
            ['highlights', 'highlights'],
            ['notes', 'notes'],
          ] as const
        ).map(([k, labelKey]) => (
          <button
            key={k}
            type="button"
            className={`right-tab${tab === k ? ' active' : ''}`}
            style={tab === k ? { borderBottomColor: accent, color: accent } : {}}
            onClick={() => onPatch({ rightPanelTab: k })}
          >
            {t(labelKey)}
          </button>
        ))}
      </div>

      <div className="right-body">
        {tab === 'toc' && (
          <div className="toc-list" data-testid="toc-list">
            {toc.length === 0 ? (
              <div className="empty-marks">{t('noResults')}</div>
            ) : (
              toc.map((item, i) => (
                <button
                  key={`${item.page}-${i}-${item.title.slice(0, 24)}`}
                  type="button"
                  className={`toc-item level-${item.level}`}
                  data-testid="toc-item"
                  title={`${item.title} → ${t('pageN', { n: item.page + 1 })}`}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onGoPage(item.page, item.title);
                  }}
                >
                  <span className="toc-title">{item.title}</span>
                  <span className="toc-page">{item.page + 1}</span>
                </button>
              ))
            )}
          </div>
        )}

        {tab === 'search' && (
          <div>
            <input
              className="search-input"
              placeholder={t('searchInDoc')}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoFocus
            />
            <div className="search-hits">
              {hits.length === 0 && q.trim() && (
                <div className="empty-marks">{t('noResults')}</div>
              )}
              {hits.map((h, i) => (
                <button
                  key={i}
                  type="button"
                  className="hit-item"
                  onClick={() => onGoPage(h.page)}
                >
                  <div className="hit-page">{t('pageN', { n: h.page + 1 })}</div>
                  <div className="hit-snip">{h.snippet}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'highlights' && (
          <div>
            {highlights.length === 0 ? (
              <div className="empty-marks">{t('noHighlights')}</div>
            ) : (
              highlights.map((h) => (
                <div key={h.id} className="hit-item row">
                  <button type="button" className="hit-main" onClick={() => onGoPage(h.page)}>
                    <div className="hit-page" style={{ color: h.color }}>
                      {t('pageN', { n: h.page + 1 })}
                    </div>
                    <div className="hit-snip">{h.text}</div>
                  </button>
                  <button
                    type="button"
                    className="mini-x"
                    title={t('close')}
                    onClick={() => onRemoveHighlight(h.id)}
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div>
            {notes.length === 0 ? (
              <div className="empty-marks">{t('noNotes')}</div>
            ) : (
              notes.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  className="hit-item"
                  onClick={() => onGoPage(n.page)}
                >
                  <div className="hit-page">{t('pageN', { n: n.page + 1 })}</div>
                  <div className="hit-snip">{n.text}</div>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
