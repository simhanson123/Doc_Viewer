import type { ContentBlock, DocumentModel, PageContent, TocItem } from '@/types';

function blocksOf(page: PageContent): ContentBlock[] {
  return page.kind === 'blocks' ? page.blocks : [];
}

export function buildToc(doc: DocumentModel): TocItem[] {
  if (doc.toc?.length) return doc.toc;
  const items: TocItem[] = [];
  doc.pages.forEach((page, pi) => {
    for (const b of blocksOf(page)) {
      if (b.k === 'h1') items.push({ title: b.t, page: pi, level: 1 });
      if (b.k === 'h2') items.push({ title: b.t, page: pi, level: 2 });
    }
  });
  if (!items.length) {
    for (let i = 0; i < doc.pages.length; i++) {
      items.push({ title: `${i + 1}쪽`, page: i, level: 1 });
    }
  }
  return items;
}

export function extractHighlightEntries(
  doc: DocumentModel,
  hl: Record<string, string>,
): { id: string; page: number; text: string; color: string }[] {
  const out: { id: string; page: number; text: string; color: string }[] = [];
  for (const [id, color] of Object.entries(hl)) {
    const parts = id.split('|');
    if (parts.length < 4) continue;
    const page = Number(parts[1]);
    const bi = Number(parts[2]);
    const si = Number(parts[3]);
    const pg = doc.pages[page];
    if (!pg || pg.kind !== 'blocks') {
      out.push({ id, page: Number.isFinite(page) ? page : 0, text: '(하이라이트)', color });
      continue;
    }
    const block = pg.blocks[bi];
    if (block && (block.k === 'p' || block.k === 'q')) {
      out.push({ id, page, text: block.sents[si] || '(빈 문장)', color });
    } else {
      out.push({ id, page, text: '(하이라이트)', color });
    }
  }
  return out.sort((a, b) => a.page - b.page);
}

export function searchInDocument(
  doc: DocumentModel,
  query: string,
): { page: number; snippet: string; blockIndex: number }[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  const hits: { page: number; snippet: string; blockIndex: number }[] = [];
  doc.pages.forEach((page, pi) => {
    if (page.kind !== 'blocks') {
      if (doc.title.toLowerCase().includes(q) && pi === 0) {
        hits.push({ page: 0, snippet: doc.title, blockIndex: 0 });
      }
      return;
    }
    page.blocks.forEach((b, bi) => {
      let text = '';
      if (b.k === 'h1' || b.k === 'h2' || b.k === 'meta' || b.k === 'code' || b.k === 'img') text = b.t;
      else if (b.k === 'p' || b.k === 'q') text = b.sents.join(' ');
      if (text.toLowerCase().includes(q)) {
        const idx = text.toLowerCase().indexOf(q);
        const start = Math.max(0, idx - 24);
        const end = Math.min(text.length, idx + q.length + 36);
        hits.push({
          page: pi,
          blockIndex: bi,
          snippet: (start > 0 ? '…' : '') + text.slice(start, end) + (end < text.length ? '…' : ''),
        });
      }
    });
  });
  return hits.slice(0, 80);
}
