import type { ContentBlock, DocumentModel, ThemeTokens, Tool } from '@/types';

type Props = {
  doc: DocumentModel;
  theme: ThemeTokens;
  fontScale: number;
  tool: Tool;
  hlMap: Record<string, string>;
  onToggleSent: (id: string) => void;
  onPageHint?: (page: number) => void;
};

/**
 * Continuous CSS reflow reading mode (best for MD/EPUB/DOCX/TXT).
 * Pages are concatenated; sentence highlight still works.
 * Freehand ink is page-anchored — switch to 낱장/펼침 for drawing.
 */
export function ReflowView({
  doc,
  theme,
  fontScale,
  tool,
  hlMap,
  onToggleSent,
  onPageHint,
}: Props) {
  const face = doc.face === 'sans' ? 'var(--font-reading-sans)' : 'var(--font-reading-serif)';

  return (
    <div
      className={`reflow-sheet${doc.face === 'sans' ? ' face-sans' : ''}`}
      style={{
        background: theme.paper,
        color: theme.ink,
        boxShadow: '0 10px 30px rgba(60, 45, 20, 0.15)',
        fontFamily: face,
      }}
    >
      <div className="reflow-meta" style={{ color: theme.muted }}>
        {doc.fmt} · reflow
      </div>
      {doc.pages.map((page, pi) => {
        if (page.kind !== 'blocks') {
          return (
            <div
              key={pi}
              className="reflow-page-break"
              style={{ borderColor: theme.rule, color: theme.muted }}
              onMouseEnter={() => onPageHint?.(pi)}
            >
              {doc.fmt === 'PDF'
                ? `PDF ${pi + 1}쪽 — 리플로우 대신 낱장 모드를 사용하세요`
                : `${pi + 1}쪽`}
            </div>
          );
        }
        return (
          <section
            key={pi}
            className="reflow-section"
            data-page={pi}
            onMouseEnter={() => onPageHint?.(pi)}
          >
            {page.blocks.map((b, bi) => (
              <ReflowBlock
                key={bi}
                block={b}
                bi={bi}
                pi={pi}
                docId={doc.id}
                face={face}
                theme={theme}
                fontScale={fontScale}
                isSans={doc.face === 'sans'}
                tool={tool}
                hlMap={hlMap}
                onToggleSent={onToggleSent}
              />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function ReflowBlock({
  block,
  bi,
  pi,
  docId,
  face,
  theme,
  fontScale,
  isSans,
  tool,
  hlMap,
  onToggleSent,
}: {
  block: ContentBlock;
  bi: number;
  pi: number;
  docId: string;
  face: string;
  theme: ThemeTokens;
  fontScale: number;
  isSans: boolean;
  tool: Tool;
  hlMap: Record<string, string>;
  onToggleSent: (id: string) => void;
}) {
  const fs = fontScale;
  if (block.k === 'h1') {
    return (
      <h1
        style={{
          fontFamily: face,
          fontSize: 28 * fs,
          fontWeight: 700,
          lineHeight: 1.35,
          margin: '0 0 14px',
        }}
      >
        {block.t}
      </h1>
    );
  }
  if (block.k === 'h2') {
    return (
      <h2
        style={{
          fontFamily: face,
          fontSize: 18 * fs,
          fontWeight: 700,
          margin: '22px 0 10px',
        }}
      >
        {block.t}
      </h2>
    );
  }
  if (block.k === 'meta') {
    return (
      <div
        style={{
          fontSize: 11 * fs,
          letterSpacing: '1.2px',
          color: theme.muted,
          margin: '0 0 16px',
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
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 12 * fs,
          lineHeight: 1.7,
          background: theme.codeBg,
          padding: '14px 16px',
          borderRadius: 8,
          whiteSpace: 'pre-wrap',
          overflow: 'auto',
          margin: '0 0 16px',
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
          minHeight: 120,
          borderRadius: 6,
          border: `1px dashed ${theme.rule}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: theme.muted,
          margin: '0 0 16px',
          padding: 16,
        }}
      >
        {block.t}
      </div>
    );
  }
  if (block.k === 'hr') {
    return <hr style={{ border: 'none', borderTop: `1px solid ${theme.rule}`, margin: '20px 0' }} />;
  }

  const isQ = block.k === 'q';
  return (
    <p
      style={{
        fontFamily: isQ ? "'Gowun Batang', serif" : face,
        fontSize: (isQ ? 15.5 : isSans ? 15 : 16.5) * fs,
        lineHeight: 1.95,
        textAlign: isQ ? 'center' : 'justify',
        color: isQ ? theme.muted : theme.ink,
        margin: isQ ? '18px 12px' : '0 0 14px',
      }}
    >
      {block.sents.map((t, si) => {
        const id = `${docId}|${pi}|${bi}|${si}`;
        const hlc = hlMap[id];
        return (
          <span
            key={si}
            className={`sent${tool === 'texthl' ? ' clickable' : ''}`}
            onClick={tool === 'texthl' ? () => onToggleSent(id) : undefined}
            style={{ background: hlc ? hlc + '66' : 'transparent' }}
          >
            {(isQ && si === 0 ? '「' : '') +
              t +
              (isQ && si === block.sents.length - 1 ? '」' : '') +
              ' '}
          </span>
        );
      })}
    </p>
  );
}
