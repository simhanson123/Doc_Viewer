import { useEffect, useId, useState, type FormEvent } from 'react';
import type { ThemeTokens } from '@/types';
import { useI18n } from '@/i18n/I18nContext';

export type PasswordModalMode = 'unlock' | 'set' | 'export';

type Props = {
  open: boolean;
  mode: PasswordModalMode;
  theme: ThemeTokens;
  /** File or document name for context */
  fileName?: string;
  /** Hint: need password vs wrong password */
  errorHint?: 'need' | 'incorrect' | null;
  title?: string;
  confirmLabel?: string;
  onSubmit: (password: string) => void;
  onCancel: () => void;
};

/**
 * Shared password dialog:
 * - unlock: open encrypted PDF
 * - set / export: set user password for protected PDF export
 */
export function PasswordModal({
  open,
  mode,
  theme,
  fileName,
  errorHint,
  title,
  confirmLabel,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useI18n();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const id = useId();

  useEffect(() => {
    if (open) {
      setPassword('');
      setConfirm('');
      setShow(false);
      setLocalErr(null);
    }
  }, [open, fileName, mode]);

  if (!open) return null;

  const isSet = mode === 'set' || mode === 'export';
  const heading =
    title ||
    (mode === 'unlock'
      ? t('pwdUnlockTitle')
      : mode === 'export'
        ? t('pwdExportTitle')
        : t('pwdSetTitle'));

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const p = password;
    if (!p) {
      setLocalErr(t('pwdEmpty'));
      return;
    }
    if (isSet) {
      if (p.length < 1) {
        setLocalErr(t('pwdEmpty'));
        return;
      }
      if (p !== confirm) {
        setLocalErr(t('pwdMismatch'));
        return;
      }
    }
    setLocalErr(null);
    onSubmit(p);
  };

  const hint =
    errorHint === 'incorrect'
      ? t('pwdIncorrect')
      : errorHint === 'need'
        ? t('pwdNeed')
        : null;

  return (
    <div className="modal-backdrop" onClick={onCancel} data-testid="password-modal">
      <div
        className="modal-card small"
        style={{
          background: theme.chrome,
          color: theme.chromeText,
          borderColor: theme.chromeBorder,
          maxWidth: 400,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2 style={{ fontSize: 16 }}>{heading}</h2>
          <button type="button" className="top-btn" onClick={onCancel} aria-label={t('close')}>
            ×
          </button>
        </div>

        {fileName && (
          <p className="muted" style={{ marginTop: 0, wordBreak: 'break-all' }}>
            {fileName}
          </p>
        )}

        <p style={{ fontSize: 13, color: theme.muted, marginTop: 0 }}>
          {mode === 'unlock' ? t('pwdUnlockHint') : t('pwdSetHint')}
        </p>

        {(hint || localErr) && (
          <p
            data-testid="password-error"
            style={{ color: '#a04030', fontSize: 13, marginTop: 0 }}
          >
            {localErr || hint}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor={`${id}-pwd`} style={{ fontSize: 12, display: 'block', marginBottom: 4 }}>
            {t('pwdLabel')}
          </label>
          <input
            id={`${id}-pwd`}
            data-testid="password-input"
            type={show ? 'text' : 'password'}
            autoFocus
            autoComplete={isSet ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '10px 12px',
              borderRadius: 8,
              border: `1px solid ${theme.chromeBorder}`,
              background: theme.paper,
              color: theme.ink,
              fontSize: 14,
              marginBottom: 12,
            }}
          />

          {isSet && (
            <>
              <label
                htmlFor={`${id}-confirm`}
                style={{ fontSize: 12, display: 'block', marginBottom: 4 }}
              >
                {t('pwdConfirmLabel')}
              </label>
              <input
                id={`${id}-confirm`}
                data-testid="password-confirm"
                type={show ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: `1px solid ${theme.chromeBorder}`,
                  background: theme.paper,
                  color: theme.ink,
                  fontSize: 14,
                  marginBottom: 12,
                }}
              />
            </>
          )}

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontSize: 12,
              color: theme.muted,
              marginBottom: 16,
              cursor: 'pointer',
            }}
          >
            <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} />
            {t('pwdShow')}
          </label>

          <div className="modal-actions" style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button type="button" className="open-btn" onClick={onCancel}>
              {t('cancel')}
            </button>
            <button
              type="submit"
              className="open-btn primary"
              data-testid="password-submit"
              style={{ background: theme.ink, color: theme.paper }}
            >
              {confirmLabel || (mode === 'unlock' ? t('pwdUnlock') : t('pwdApply'))}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
