import { useI18n } from '@/i18n/I18nContext';

type Props = { open: boolean; onClose: () => void; accent: string };

export function ShortcutsModal({ open, onClose, accent }: Props) {
  const { t } = useI18n();
  if (!open) return null;

  const rows: [string, string][] = [
    ['Ctrl/Cmd + O', t('menuOpen')],
    ['Ctrl/Cmd + E', t('menuExportPdf')],
    ['Ctrl/Cmd + P', t('menuPrint')],
    ['Ctrl/Cmd + ,', t('menuSettings')],
    ['Ctrl/Cmd + /', t('menuShortcuts')],
    ['Ctrl/Cmd + Z', t('menuUndo')],
    ['Ctrl/Cmd + Shift + Z', t('menuRedo')],
    ['← / →', `${t('prevPage')} / ${t('nextPage')}`],
    ['B', t('bookmark')],
    ['F', t('searchLibrary')],
    ['T', t('toc')],
    ['G', t('gotoPage')],
    ['F11', t('menuFullscreen')],
    ['Esc', t('close')],
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2>{t('shortcutsTitle')}</h2>
          <button type="button" className="top-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <table className="shortcut-table">
          <tbody>
            {rows.map(([k, v]) => (
              <tr key={k}>
                <td>
                  <kbd style={{ borderColor: accent }}>{k}</kbd>
                </td>
                <td>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="modal-actions">
          <button type="button" className="open-btn primary" style={{ background: accent, color: '#fff' }} onClick={onClose}>
            {t('close')}
          </button>
        </div>
      </div>
    </div>
  );
}
