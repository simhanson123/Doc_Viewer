/**
 * Shared HTML → ContentBlock conversion for HTML files, DOCX (mammoth HTML), EPUB chapters.
 */
import type { ContentBlock, PageContent } from '@/types';
import { splitSentences } from '@/lib/sentences';

export function htmlToBlocks(html: string): ContentBlock[] {
  const parsed = new DOMParser().parseFromString(html, 'text/html');
  const blocks: ContentBlock[] = [];

  const pushText = (tag: string, text: string) => {
    const t = text.replace(/\s+/g, ' ').trim();
    if (!t) return;
    if (tag === 'h1') blocks.push({ k: 'h1', t });
    else if (tag === 'h2' || tag === 'h3' || tag === 'h4' || tag === 'h5' || tag === 'h6')
      blocks.push({ k: 'h2', t });
    else if (tag === 'blockquote') blocks.push({ k: 'q', sents: splitSentences(t) });
    else if (tag === 'pre' || tag === 'code') blocks.push({ k: 'code', t });
    else blocks.push({ k: 'p', sents: splitSentences(t) });
  };

  const walk = (el: Element) => {
    const tag = el.tagName.toLowerCase();
    if (['script', 'style', 'nav', 'svg', 'noscript', 'iframe', 'template'].includes(tag)) return;

    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'li', 'blockquote', 'pre', 'td', 'th', 'figcaption', 'dt', 'dd'].includes(tag)) {
      if (tag === 'pre') {
        pushText(tag, el.textContent || '');
        return;
      }
      const hasBlockChild = Array.from(el.children).some((c) =>
        ['p', 'div', 'section', 'blockquote', 'ul', 'ol', 'table', 'h1', 'h2', 'h3', 'h4'].includes(
          c.tagName.toLowerCase(),
        ),
      );
      if (hasBlockChild && (tag === 'li' || tag === 'blockquote' || tag === 'td' || tag === 'th')) {
        for (const child of Array.from(el.children)) walk(child);
        return;
      }
      pushText(tag === 'td' || tag === 'th' ? 'p' : tag, el.textContent || '');
      return;
    }

    if (tag === 'hr') {
      blocks.push({ k: 'hr' });
      return;
    }

    if (tag === 'img') {
      const alt = el.getAttribute('alt') || el.getAttribute('title') || 'image';
      blocks.push({ k: 'img', t: `[ ${alt} ]` });
      return;
    }

    if (tag === 'br') return;

    for (const child of Array.from(el.children)) walk(child);

    if (
      !el.children.length &&
      el.textContent?.trim() &&
      ['div', 'span', 'section', 'article', 'main', 'header', 'footer', 'aside'].includes(tag)
    ) {
      pushText('p', el.textContent);
    }
  };

  if (parsed.body) {
    for (const child of Array.from(parsed.body.children)) walk(child);
    if (!blocks.length) {
      const t = parsed.body.textContent?.replace(/\s+/g, ' ').trim();
      if (t) blocks.push({ k: 'p', sents: splitSentences(t) });
    }
  }

  // Title from <title> if no h1
  if (!blocks.some((b) => b.k === 'h1')) {
    const title = parsed.querySelector('title')?.textContent?.trim();
    if (title) blocks.unshift({ k: 'h1', t: title });
  }

  return blocks;
}

export function paginateBlocks(blocks: ContentBlock[], maxWeight = 6): PageContent[] {
  const pages: PageContent[] = [];
  let cur: ContentBlock[] = [];
  let weight = 0;
  for (const b of blocks) {
    const bw =
      b.k === 'p' || b.k === 'q'
        ? 1 + b.sents.join(' ').length / 200
        : b.k === 'code'
          ? 2 + b.t.split('\n').length * 0.25
          : 1.5;
    if (cur.length && weight + bw > maxWeight) {
      pages.push({ kind: 'blocks', blocks: cur });
      cur = [];
      weight = 0;
    }
    cur.push(b);
    weight += bw;
  }
  if (cur.length) pages.push({ kind: 'blocks', blocks: cur });
  if (!pages.length) {
    pages.push({ kind: 'blocks', blocks: [{ k: 'meta', t: '(empty document)' }] });
  }
  return pages;
}
