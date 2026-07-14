import JSZip from 'jszip';
import type { ContentBlock, DocumentModel, PageContent, TocItem } from '@/types';
import { splitSentences } from '@/lib/sentences';

function resolveHref(baseDir: string, href: string): string {
  const cleaned = href.split('#')[0].replace(/^\//, '');
  if (!baseDir) return cleaned;
  const parts = (baseDir + cleaned).split('/');
  const stack: string[] = [];
  for (const p of parts) {
    if (!p || p === '.') continue;
    if (p === '..') stack.pop();
    else stack.push(p);
  }
  return stack.join('/');
}

function htmlToBlocks(html: string): ContentBlock[] {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];

  const pushText = (tag: string, text: string) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (tag === 'h1') blocks.push({ k: 'h1', t });
    else if (tag === 'h2' || tag === 'h3' || tag === 'h4') blocks.push({ k: 'h2', t });
    else if (tag === 'blockquote') blocks.push({ k: 'q', sents: splitSentences(t) });
    else if (tag === 'pre' || tag === 'code') blocks.push({ k: 'code', t });
    else blocks.push({ k: 'p', sents: splitSentences(t) });
  };

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'nav', 'svg'].includes(tag)) return;

    if (['h1', 'h2', 'h3', 'h4', 'p', 'li', 'blockquote', 'pre'].includes(tag)) {
      // Prefer direct textual content for leaf-ish blocks
      if (tag === 'pre') {
        pushText(tag, el.textContent || '');
        return;
      }
      // If block has nested block children, recurse instead of flattening all
      const hasBlockChild = Array.from(el.children).some((c) =>
        ['p', 'div', 'section', 'blockquote', 'ul', 'ol', 'h1', 'h2', 'h3'].includes(
          c.tagName.toLowerCase(),
        ),
      );
      if (hasBlockChild && (tag === 'li' || tag === 'blockquote')) {
        for (const child of Array.from(el.children)) walk(child);
        return;
      }
      pushText(tag, el.textContent || '');
      return;
    }

    if (tag === 'hr') {
      blocks.push({ k: 'hr' });
      return;
    }

    if (tag === 'img') {
      const alt = el.getAttribute('alt') || '이미지';
      blocks.push({ k: 'img', t: `[ ${alt} ]` });
      return;
    }

    if (tag === 'br') {
      return;
    }

    for (const child of Array.from(el.children)) walk(child);

    // Fallback: element with only text nodes
    if (!el.children.length && el.textContent?.trim() && ['div', 'span', 'section', 'article'].includes(tag)) {
      pushText('p', el.textContent);
    }
  };

  if (doc.body) {
    for (const child of Array.from(doc.body.children)) walk(child);
    if (!blocks.length) {
      const t = doc.body.textContent?.replace(/\s+/g, ' ').trim();
      if (t) blocks.push({ k: 'p', sents: splitSentences(t) });
    }
  }
  return blocks;
}

function paginateChapter(blocks: ContentBlock[], chapterTitle?: string): PageContent[] {
  const pages: PageContent[] = [];
  let cur: ContentBlock[] = [];
  let weight = 0;

  const flush = () => {
    if (cur.length) {
      pages.push({ kind: 'blocks', blocks: cur });
      cur = [];
      weight = 0;
    }
  };

  for (const b of blocks) {
    const bw =
      b.k === 'p' || b.k === 'q'
        ? 1 + b.sents.join(' ').length / 220
        : b.k === 'code'
          ? 1.5 + (b.t.split('\n').length * 0.25)
          : b.k === 'h1'
            ? 2.2
            : 1.2;

    // Keep chapter heading with following content when possible
    if (cur.length && weight + bw > 7 && !(b.k === 'h1' || b.k === 'h2')) {
      flush();
    }
    if (b.k === 'h1' && cur.length) flush();

    cur.push(b);
    weight += bw;
  }
  flush();

  if (!pages.length && chapterTitle) {
    pages.push({
      kind: 'blocks',
      blocks: [{ k: 'h1', t: chapterTitle }, { k: 'meta', t: '(내용 없음)' }],
    });
  }
  return pages;
}

async function resolveOpfPath(zip: JSZip): Promise<string> {
  const container = await zip.file('META-INF/container.xml')?.async('text');
  if (!container) throw new Error('Invalid EPUB: missing container.xml');
  const match = container.match(/full-path\s*=\s*"([^"]+)"/i);
  if (!match) throw new Error('Invalid EPUB: no OPF path');
  return match[1].replace(/\\/g, '/');
}

function parseNcxToc(
  ncxXml: string,
  hrefToPage: Map<string, number>,
): TocItem[] {
  const doc = new DOMParser().parseFromString(ncxXml, 'application/xml');
  const items: TocItem[] = [];
  const navPoints = doc.getElementsByTagName('navPoint');
  for (let i = 0; i < navPoints.length; i++) {
    const np = navPoints[i];
    const label =
      np.getElementsByTagName('text')[0]?.textContent?.trim() || `항목 ${i + 1}`;
    const src =
      np.getElementsByTagName('content')[0]?.getAttribute('src')?.split('#')[0] || '';
    const page = hrefToPage.get(src) ?? hrefToPage.get(src.replace(/^\.\//, '')) ?? 0;
    const depth = np.parentElement?.tagName.toLowerCase() === 'navpoint' ? 2 : 1;
    items.push({ title: label, page, level: depth as 1 | 2 });
  }
  return items;
}

export async function loadEpub(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string },
): Promise<DocumentModel> {
  const zip = await JSZip.loadAsync(data);
  const opfPath = await resolveOpfPath(zip);
  const opfDir = opfPath.includes('/') ? opfPath.replace(/\/[^/]+$/, '/') : '';
  const opfXml = await zip.file(opfPath)?.async('text');
  if (!opfXml) throw new Error('Invalid EPUB: missing OPF');

  const opf = new DOMParser().parseFromString(opfXml, 'application/xml');
  const getMeta = (name: string) => {
    const nodes = opf.getElementsByTagName(name);
    for (let i = 0; i < nodes.length; i++) {
      const t = nodes[i].textContent?.trim();
      if (t) return t;
    }
    // namespaced dc:title etc.
    const all = opf.getElementsByTagName('*');
    for (let i = 0; i < all.length; i++) {
      const el = all[i];
      if (el.localName === name.replace(/^dc:/, '') && el.textContent?.trim()) {
        return el.textContent.trim();
      }
    }
    return '';
  };

  const title = getMeta('title') || getMeta('dc:title') || opts.title;
  const creator = getMeta('creator') || getMeta('dc:creator') || 'EPUB';
  const language = getMeta('language') || getMeta('dc:language') || '';

  const manifest = new Map<string, { href: string; media: string }>();
  const items = opf.getElementsByTagName('item');
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = item.getAttribute('id');
    const href = item.getAttribute('href');
    const media = item.getAttribute('media-type') || '';
    if (id && href) manifest.set(id, { href, media });
  }

  const spineIds: string[] = [];
  const itemrefs = opf.getElementsByTagName('itemref');
  for (let i = 0; i < itemrefs.length; i++) {
    const idref = itemrefs[i].getAttribute('idref');
    if (idref) spineIds.push(idref);
  }

  const pages: PageContent[] = [];
  const hrefToPage = new Map<string, number>();
  const toc: TocItem[] = [];

  for (const id of spineIds) {
    const entry = manifest.get(id);
    if (!entry) continue;
    const media = entry.media;
    if (media && !/html|xml|xhtml/i.test(media) && media !== '') {
      // skip non-html spine items (images, ncx sometimes wrongly in spine)
      if (!entry.href.match(/\.x?html?$/i)) continue;
    }
    const full = resolveHref(opfDir, entry.href);
    const html = await zip.file(full)?.async('text');
    if (!html) continue;

    const startPage = pages.length;
    hrefToPage.set(entry.href, startPage);
    hrefToPage.set(full, startPage);
    hrefToPage.set(full.split('/').pop() || entry.href, startPage);

    const blocks = htmlToBlocks(html);
    if (!blocks.length) continue;

    // Use first heading as TOC if present
    const firstH = blocks.find((b) => b.k === 'h1' || b.k === 'h2');
    if (firstH && (firstH.k === 'h1' || firstH.k === 'h2')) {
      toc.push({
        title: firstH.t,
        page: startPage,
        level: firstH.k === 'h1' ? 1 : 2,
      });
    }

    pages.push(...paginateChapter(blocks));
  }

  // NCX / nav toc enrichment
  for (const [, meta] of manifest) {
    if (/ncx/i.test(meta.media) || meta.href.endsWith('.ncx')) {
      const ncxPath = resolveHref(opfDir, meta.href);
      const ncx = await zip.file(ncxPath)?.async('text');
      if (ncx) {
        const ncxItems = parseNcxToc(ncx, hrefToPage);
        if (ncxItems.length) {
          toc.length = 0;
          toc.push(...ncxItems);
        }
      }
    }
  }

  if (!pages.length) {
    pages.push({
      kind: 'blocks',
      blocks: [{ k: 'meta', t: 'EPUB 내용을 읽지 못했습니다.' }],
    });
  }

  return {
    id: opts.id,
    fmt: 'EPUB',
    title,
    sub: `${pages.length}쪽 · ${creator}${language ? ` · ${language}` : ''}`,
    face: 'serif',
    path: opts.path,
    pages,
    toc: toc.length ? toc : undefined,
    raw: data,
    folder: '소설',
    tags: ['epub'],
  };
}
