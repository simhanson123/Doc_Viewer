/**
 * PPTX (Office Open XML presentation) — extract text per slide via JSZip.
 * One slide ≈ one page of blocks.
 */
import JSZip from 'jszip';
import type { ContentBlock, DocumentModel, PageContent, TocItem } from '@/types';
import { splitSentences } from '@/lib/sentences';

export function xmlTextNodes(xml: string): string[] {
  const out: string[] = [];
  // OOXML DrawingML text: <a:t>...</a:t>
  const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) {
    const t = m[1]
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&apos;/g, "'")
      .replace(/&amp;/g, '&') // must be last to avoid double-decoding
      .replace(/\s+/g, ' ')
      .trim();
    if (t) out.push(t);
  }
  return out;
}

function slideToBlocks(texts: string[], slideIndex: number): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  if (!texts.length) {
    blocks.push({ k: 'meta', t: `(Slide ${slideIndex + 1} — no extractable text)` });
    return blocks;
  }
  // First non-empty as heading
  blocks.push({ k: 'h2', t: texts[0] });
  for (let i = 1; i < texts.length; i++) {
    blocks.push({ k: 'p', sents: splitSentences(texts[i]) });
  }
  return blocks;
}

function slideNumber(name: string): number {
  const m = name.match(/slide(\d+)\.xml$/i);
  return m ? parseInt(m[1], 10) : 9999;
}

export async function loadPptx(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string },
): Promise<DocumentModel> {
  if (!data || data.byteLength < 30) {
    throw new Error(`PPTX too small (${data?.byteLength ?? 0} bytes)`);
  }
  const head = new Uint8Array(data, 0, 2);
  if (head[0] !== 0x50 || head[1] !== 0x4b) {
    throw new Error('Not a valid PPTX (missing ZIP header PK)');
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(data);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`PPTX unzip failed: ${msg}`);
  }

  const slideFiles = Object.keys(zip.files)
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/i.test(n) && !zip.files[n].dir)
    .sort((a, b) => slideNumber(a) - slideNumber(b));

  if (!slideFiles.length) {
    throw new Error('PPTX has no slides (ppt/slides/slideN.xml missing)');
  }

  const pages: PageContent[] = [];
  const toc: TocItem[] = [];
  let title = opts.title;

  for (let i = 0; i < slideFiles.length; i++) {
    const path = slideFiles[i];
    const xml = await zip.files[path].async('string');
    const texts = xmlTextNodes(xml);
    const blocks = slideToBlocks(texts, i);
    // Slide separator meta
    blocks.unshift({ k: 'meta', t: `Slide ${i + 1}` });
    pages.push({ kind: 'blocks', blocks });
    const heading = texts[0] || `Slide ${i + 1}`;
    toc.push({ title: heading.slice(0, 80), page: i, level: 1 });
    if (i === 0 && texts[0]) title = texts[0].slice(0, 120);
  }

  console.info('[onjeom load] PPTX', {
    title,
    slides: pages.length,
    bytes: data.byteLength,
  });

  return {
    id: opts.id,
    fmt: 'PPTX',
    title,
    sub: `${pages.length} slides · PPTX`,
    face: 'sans',
    path: opts.path,
    pages,
    toc,
    raw: data,
  };
}
