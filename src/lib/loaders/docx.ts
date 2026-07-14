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
  if (!data || data.byteLength < 30) {
    throw new Error(`DOCX too small (${data?.byteLength ?? 0} bytes)`);
  }
  const head = new Uint8Array(data, 0, 2);
  if (head[0] !== 0x50 || head[1] !== 0x4b) {
    throw new Error('Not a valid DOCX (missing ZIP/OOXML header PK)');
  }

  let result: { value: string; messages: { type: string; message: string }[] };
  try {
    result = await mammoth.convertToHtml({ arrayBuffer: data });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`DOCX parse failed: ${msg}`);
  }

  const blocks = htmlToBlocks(result.value);
  if (!blocks.length) {
    // Document may be empty or image-only
    blocks.push({
      k: 'meta',
      t: '(No extractable text — empty or image-only DOCX)',
    } as ContentBlock);
  }
  const firstH = blocks.find((b) => b.k === 'h1');
  console.info('[onjeom load] DOCX', {
    title: opts.title,
    bytes: data.byteLength,
    blocks: blocks.length,
    warnings: result.messages?.length ?? 0,
  });
  return {
    id: opts.id,
    fmt: 'DOCX',
    title: firstH && firstH.k === 'h1' ? firstH.t : opts.title,
    sub: opts.path || `Word · ${blocks.length} blocks`,
    face: 'sans',
    path: opts.path,
    pages: paginate(blocks),
    raw: data,
  };
}
