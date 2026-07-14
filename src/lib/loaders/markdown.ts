import { marked, type Token, type Tokens } from 'marked';
import type { ContentBlock, DocumentModel, PageContent } from '@/types';
import { splitSentences } from '@/lib/sentences';

function tokensToBlocks(tokens: Token[]): ContentBlock[] {
  const blocks: ContentBlock[] = [];
  for (const t of tokens) {
    switch (t.type) {
      case 'heading': {
        const h = t as Tokens.Heading;
        const text = inlineText(h.tokens ?? []);
        if (h.depth <= 1) blocks.push({ k: 'h1', t: text });
        else blocks.push({ k: 'h2', t: text });
        break;
      }
      case 'paragraph': {
        const p = t as Tokens.Paragraph;
        const text = inlineText(p.tokens ?? []);
        blocks.push({ k: 'p', sents: splitSentences(text) });
        break;
      }
      case 'blockquote': {
        const b = t as Tokens.Blockquote;
        const text = b.tokens
          ? tokensToBlocks(b.tokens)
              .map((x) =>
                x.k === 'p' || x.k === 'q'
                  ? x.sents.join(' ')
                  : x.k === 'h1' || x.k === 'h2' || x.k === 'meta'
                    ? x.t
                    : '',
              )
              .filter(Boolean)
              .join(' ')
          : '';
        if (text) blocks.push({ k: 'q', sents: splitSentences(text) });
        break;
      }
      case 'code': {
        const c = t as Tokens.Code;
        blocks.push({ k: 'code', t: c.text });
        break;
      }
      case 'hr':
        blocks.push({ k: 'hr' });
        break;
      case 'list': {
        const list = t as Tokens.List;
        for (const item of list.items) {
          const text = inlineText(item.tokens ?? []);
          if (text) blocks.push({ k: 'p', sents: splitSentences((list.ordered ? '• ' : '• ') + text) });
        }
        break;
      }
      case 'space':
        break;
      default:
        break;
    }
  }
  return blocks;
}

function inlineText(tokens: Token[]): string {
  return tokens
    .map((t) => {
      if ('text' in t && typeof (t as { text?: string }).text === 'string' && !('tokens' in t && (t as Tokens.Generic).tokens)) {
        if (t.type === 'codespan') return (t as Tokens.Codespan).text;
        if (t.type === 'text' || t.type === 'escape') return (t as Tokens.Text).text;
      }
      if ('tokens' in t && Array.isArray((t as Tokens.Generic).tokens)) {
        return inlineText((t as Tokens.Generic).tokens as Token[]);
      }
      if ('text' in t && typeof (t as { text: string }).text === 'string') {
        return (t as { text: string }).text;
      }
      return '';
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Rough pagination: pack blocks into pages of limited block count / size. */
function paginate(blocks: ContentBlock[], maxBlocks = 6): PageContent[] {
  if (!blocks.length) return [{ kind: 'blocks', blocks: [{ k: 'meta', t: '(빈 문서)' }] }];
  const pages: PageContent[] = [];
  let cur: ContentBlock[] = [];
  let weight = 0;

  const w = (b: ContentBlock): number => {
    if (b.k === 'h1') return 2.5;
    if (b.k === 'h2') return 1.8;
    if (b.k === 'code') return 2 + b.t.split('\n').length * 0.3;
    if (b.k === 'p' || b.k === 'q') return 1 + b.sents.join(' ').length / 180;
    if (b.k === 'img') return 2.5;
    return 0.5;
  };

  for (const b of blocks) {
    const bw = w(b);
    if (cur.length && (weight + bw > maxBlocks || cur.length >= 8)) {
      pages.push({ kind: 'blocks', blocks: cur });
      cur = [];
      weight = 0;
    }
    cur.push(b);
    weight += bw;
  }
  if (cur.length) pages.push({ kind: 'blocks', blocks: cur });
  return pages;
}

export function loadMarkdown(
  text: string,
  opts: { id: string; title: string; path?: string },
): DocumentModel {
  const tokens = marked.lexer(text);
  const blocks = tokensToBlocks(tokens);
  const firstH = blocks.find((b) => b.k === 'h1');
  return {
    id: opts.id,
    fmt: 'MD',
    title: firstH && firstH.k === 'h1' ? firstH.t : opts.title,
    sub: opts.path ? opts.path : 'Markdown',
    face: 'sans',
    path: opts.path,
    pages: paginate(blocks),
    raw: text,
  };
}

export function loadText(
  text: string,
  opts: { id: string; title: string; path?: string },
): DocumentModel {
  // Normalize newlines
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Prefer paragraph splits; if the file has no blank lines, split by single newlines
  let paras = normalized
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\n/g, ' ').trim())
    .filter(Boolean);

  if (paras.length <= 1) {
    paras = normalized
      .split('\n')
      .map((p) => p.trim())
      .filter(Boolean);
  }

  // Still empty → single block with raw content
  if (!paras.length) {
    paras = [normalized.trim() || '(empty file)'];
  }

  const blocks: ContentBlock[] = paras.map((para) => {
    // Short date-like lines as meta, otherwise body paragraphs
    if (/^\d{4}([-/.\s]|$)/.test(para) && para.length < 48) {
      return { k: 'meta', t: para };
    }
    return { k: 'p', sents: splitSentences(para) };
  });

  return {
    id: opts.id,
    fmt: 'TXT',
    title: opts.title,
    sub: opts.path || 'Text',
    face: 'serif',
    path: opts.path,
    pages: paginate(blocks, 5),
    raw: text,
  };
}
