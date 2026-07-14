import type { DocumentModel } from '@/types';
import { htmlToBlocks, paginateBlocks } from '@/lib/htmlBlocks';

/**
 * Load .html / .htm as structured reading pages (not raw source dump).
 * Scripts/styles stripped via DOMParser walk.
 */
export function loadHtml(
  html: string,
  opts: { id: string; title: string; path?: string },
): DocumentModel {
  const blocks = htmlToBlocks(html || '');
  if (!blocks.length) {
    blocks.push({ k: 'meta', t: '(empty HTML)' } as const);
  }
  const firstH = blocks.find((b) => b.k === 'h1');
  const title =
    firstH && firstH.k === 'h1' ? firstH.t : opts.title;
  const pages = paginateBlocks(blocks, 6);
  console.info('[onjeom load] HTML', { title, blocks: blocks.length, pages: pages.length });
  return {
    id: opts.id,
    fmt: 'HTML',
    title,
    sub: opts.path || `HTML · ${blocks.length} blocks`,
    face: 'sans',
    path: opts.path,
    pages,
    raw: html,
  };
}
