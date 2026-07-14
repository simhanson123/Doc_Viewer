import mammoth from 'mammoth';
import type { ContentBlock, DocumentModel, PageContent } from '@/types';
import { splitSentences } from '@/lib/sentences';

function htmlToBlocks(html: string): ContentBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];
  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (tag === 'h1') {
      const t = el.textContent?.trim();
      if (t) blocks.push({ k: 'h1', t });
      return;
    }
    if (tag === 'h2' || tag === 'h3' || tag === 'h4') {
      const t = el.textContent?.trim();
      if (t) blocks.push({ k: 'h2', t });
      return;
    }
    if (tag === 'p' || tag === 'li') {
      const t = el.textContent?.replace(/\s+/g, ' ').trim();
      if (t) blocks.push({ k: 'p', sents: splitSentences(t) });
      return;
    }
    if (tag === 'pre') {
      const t = el.textContent || '';
      if (t.trim()) blocks.push({ k: 'code', t });
      return;
    }
    for (const child of Array.from(el.children)) walk(child);
  };
  if (doc.body) {
    for (const child of Array.from(doc.body.children)) walk(child);
  }
  return blocks;
}

function paginate(blocks: ContentBlock[]): PageContent[] {
  const pages: PageContent[] = [];
  let cur: ContentBlock[] = [];
  let weight = 0;
  for (const b of blocks) {
    const bw =
      b.k === 'p' || b.k === 'q'
        ? 1 + b.sents.join(' ').length / 200
        : 1.5;
    if (cur.length && weight + bw > 6) {
      pages.push({ kind: 'blocks', blocks: cur });
      cur = [];
      weight = 0;
    }
    cur.push(b);
    weight += bw;
  }
  if (cur.length) pages.push({ kind: 'blocks', blocks: cur });
  if (!pages.length) {
    pages.push({ kind: 'blocks', blocks: [{ k: 'meta', t: '(빈 문서)' }] });
  }
  return pages;
}

export async function loadDocx(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string },
): Promise<DocumentModel> {
  const result = await mammoth.convertToHtml({ arrayBuffer: data });
  const blocks = htmlToBlocks(result.value);
  const firstH = blocks.find((b) => b.k === 'h1');
  return {
    id: opts.id,
    fmt: 'DOCX',
    title: firstH && firstH.k === 'h1' ? firstH.t : opts.title,
    sub: opts.path || 'Word 문서',
    face: 'sans',
    path: opts.path,
    pages: paginate(blocks),
    raw: data,
  };
}
