import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { ContentBlock, DocumentModel, ThemeTokens, Tool } from '@/types';
import { renderPdfPage } from '@/lib/loaders/pdf';

type Props = {
  doc: DocumentModel;
  pageIndex: number;
  theme: ThemeTokens;
  tool: Tool;
  hlMap: Record<string, string>;
  fontScale: number;
  onToggleSent: (id: string) => void;
};

export function PageBody({
  doc,
  pageIndex,
  theme,
  tool,
  hlMap,
  fontScale,
  onToggleSent,
}: Props) {
  const page = doc.pages[pageIndex];
  if (!page) return null;

  if (page.kind === 'pdf' && doc.raw) {
    const raw = doc.raw;
    let buf: ArrayBuffer | null = null;
    if (raw instanceof ArrayBuffer) {
      buf = raw;
    } else if (raw instanceof Uint8Array) {
      const copy = new Uint8Array(raw.byteLength);
      copy.set(raw);
      buf = copy.buffer;
    }
    if (buf && buf.byteLength > 0) {
      return <PdfPage data={buf} pageIndex={page.pageIndex} />;
    }
    return (
      <div className="page-content pdf-content" style={{ color: theme.muted, padding: 24 }}>
        PDF data missing — re-open the file.
      </div>
    );
  }

  if (page.kind === 'image') {
    return (
      <div
        className="page-content"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <img src={page.src} alt={page.alt || ''} style={{ maxWidth: '100%', maxHeight: '100%' }} />
      </div>
    );
  }

  if (page.kind !== 'blocks') return null;

  const face =
    doc.face === 'sans'
      ? 'var(--font-reading-sans)'
      : 'var(--font-reading-serif)';

  return (
    <div
      className={`page-content${doc.face === 'sans' ? ' face-sans' : ''}`}
      style={{ fontSize: `${fontScale}em`, fontFamily: face }}
      data-testid="page-content"
      data-page-kind="blocks"
    >
      {page.blocks.map((b, bi) => (
        <BlockView
          key={bi}
          block={b}
          bi={bi}
          pi={pageIndex}
          docId={doc.id}
          face={face}
          theme={theme}
          tool={tool}
          hlMap={hlMap}
          onToggleSent={onToggleSent}
          isSans={doc.face === 'sans'}
          fontScale={fontScale}
        />
      ))}
    </div>
  );
}

function PdfPage({ data, pageIndex }: { data: ArrayBuffer; pageIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    setBusy(true);
    setErr(null);
    (async () => {
      try {
        await renderPdfPage(data, pageIndex, canvas);
        if (!cancelled) setBusy(false);
      } catch (e) {
        console.error('[onjeom] PDF render failed', e);
        if (!cancelled) {
          setBusy(false);
          setErr(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, pageIndex]);

  return (
    <div
      className="page-content pdf-content"
      style={{ position: 'relative' }}
      data-testid="page-content"
      data-page-kind="pdf"
      data-pdf-busy={busy ? '1' : '0'}
      data-pdf-error={err ? '1' : '0'}
    >
      <canvas ref={canvasRef} data-testid="pdf-canvas" />
      {busy && !err && (
        <div
          data-testid="pdf-loading"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#8c7f69',
            fontSize: 13,
            pointerEvents: 'none',
          }}
        >
          Loading PDF…
        </div>
      )}
      {err && (
        <div
          data-testid="pdf-error"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'center',
            color: '#a04030',
            fontSize: 13,
            background: 'rgba(255,255,255,0.92)',
          }}
        >
          PDF render error: {err}
        </div>
      )}
    </div>
  );
}

function BlockView({
  block,
  bi,
  pi,
  docId,
  face,
  theme,
  tool,
  hlMap,
  onToggleSent,
  isSans,
  fontScale,
}: {
  block: ContentBlock;
  bi: number;
  pi: number;
  docId: string;
  face: string;
  theme: ThemeTokens;
  tool: Tool;
  hlMap: Record<string, string>;
  onToggleSent: (id: string) => void;
  isSans: boolean;
  fontScale: number;
}) {
  const fs = fontScale;
  if (block.k === 'h1') {
    return (
      <div
        style={{
          fontFamily: face,
          fontSize: 27 * fs,
          fontWeight: 700,
          color: theme.ink,
          lineHeight: 1.35,
          margin: '0 0 12px',
          letterSpacing: '-0.3px',
        }}
      >
        {block.t}
      </div>
    );
  }
  if (block.k === 'h2') {
    return (
      <div
        style={{
          fontFamily: face,
          fontSize: 18 * fs,
          fontWeight: 700,
          color: theme.ink,
          margin: '18px 0 10px',
        }}
      >
        {block.t}
      </div>
    );
  }
  if (block.k === 'meta') {
    return (
      <div
        style={{
          fontFamily: 'var(--font-reading-sans)',
          fontSize: 11 * fs,
          letterSpacing: '1.4px',
          color: theme.muted,
          margin: '0 0 22px',
          fontWeight: 500,
        }}
      >
        {block.t}
      </div>
    );
  }
  if (block.k === 'code') {
    return (
      <pre
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 11.5 * fs,
          lineHeight: 1.7,
          color: theme.ink,
          background: theme.codeBg,
          padding: '14px 16px',
          borderRadius: 6,
          whiteSpace: 'pre-wrap',
          margin: '0 0 16px',
          overflow: 'hidden',
        }}
      >
        {block.t}
      </pre>
    );
  }
  if (block.k === 'img') {
    return (
      <div
        style={{
          height: 140,
          borderRadius: 4,
          background: `repeating-linear-gradient(-45deg, ${theme.codeBg} 0 8px, transparent 8px 16px)`,
          border: `1px solid ${theme.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.muted,
          margin: '2px 0 18px',
        }}
      >
        <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10.5, letterSpacing: 1 }}>
          {block.t}
        </span>
      </div>
    );
  }
  if (block.k === 'hr') {
    return <div style={{ height: 1, background: theme.rule, margin: '20px 0' }} />;
  }

  const isQ = block.k === 'q';
  const style: CSSProperties = isQ
    ? {
        fontFamily: 'var(--font-reading-serif)',
        fontSize: 15 * fs,
        lineHeight: 1.9,
        color: theme.muted,
        margin: '18px 14px',
        textAlign: 'center',
      }
    : {
        fontFamily: face,
        fontSize: (isSans ? 14 : 15.5) * fs,
        lineHeight: 1.95,
        color: theme.ink,
        textAlign: 'justify',
        margin: '0 0 15px',
        wordBreak: 'break-word',
        overflowWrap: 'anywhere',
      };

  return (
    <div style={style}>
      {block.sents.map((t, si) => {
        const id = `${docId}|${pi}|${bi}|${si}`;
        const hlc = hlMap[id];
        const text =
          (isQ && si === 0 ? '「' : '') +
          t +
          (isQ && si === block.sents.length - 1 ? '」' : '') +
          ' ';
        return (
          <span
            key={si}
            className={`sent${tool === 'texthl' ? ' clickable' : ''}`}
            onClick={tool === 'texthl' ? () => onToggleSent(id) : undefined}
            style={{ background: hlc ? hlc + '66' : 'transparent' }}
          >
            {text}
          </span>
        );
      })}
    </div>
  );
}
