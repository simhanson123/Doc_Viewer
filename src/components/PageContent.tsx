import { useEffect, useRef, type CSSProperties } from 'react';
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

  if (page.kind === 'pdf' && doc.raw instanceof ArrayBuffer) {
    return <PdfPage data={doc.raw} pageIndex={page.pageIndex} />;
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

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;
    (async () => {
      try {
        await renderPdfPage(data, pageIndex, canvas);
      } catch (e) {
        if (!cancelled) console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, pageIndex]);

  return (
    <div className="page-content pdf-content">
      <canvas ref={canvasRef} />
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
