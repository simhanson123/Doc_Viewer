import { describe, expect, it } from 'vitest';
import { loadMarkdown, loadText } from '@/lib/loaders/markdown';

const base = { id: 't', title: 'T' };

function allSents(doc: ReturnType<typeof loadMarkdown>): string[] {
  const out: string[] = [];
  for (const p of doc.pages) {
    if (p.kind !== 'blocks') continue;
    for (const b of p.blocks) {
      if (b.k === 'p' || b.k === 'q') out.push(...b.sents);
      else if (b.k === 'h1' || b.k === 'h2') out.push(b.t);
    }
  }
  return out;
}

describe('loadMarkdown', () => {
  it('uses first h1 as title', () => {
    const doc = loadMarkdown('# My Title\n\nBody.', base);
    expect(doc.title).toBe('My Title');
  });

  it('ordered lists are numbered (regression: was bullet)', () => {
    const doc = loadMarkdown('1. first\n2. second\n3. third\n', base);
    const s = allSents(doc).join(' ');
    expect(s).toContain('1. first');
    expect(s).toContain('2. second');
    expect(s).toContain('3. third');
    expect(s).not.toContain('• first');
  });

  it('ordered list honors start number', () => {
    const doc = loadMarkdown('5. five\n6. six\n', base);
    const s = allSents(doc).join(' ');
    expect(s).toContain('5. five');
    expect(s).toContain('6. six');
  });

  it('unordered lists keep bullets', () => {
    const doc = loadMarkdown('- a\n- b\n', base);
    const s = allSents(doc).join(' ');
    expect(s).toContain('• a');
  });

  it('empty markdown still yields one page', () => {
    const doc = loadMarkdown('\n', base);
    expect(doc.pages.length).toBeGreaterThan(0);
  });
});

describe('loadText', () => {
  it('splits paragraphs on blank lines', () => {
    const doc = loadText('para one.\n\npara two.', base);
    expect(doc.fmt).toBe('TXT');
    expect(doc.pages.length).toBeGreaterThan(0);
  });

  it('falls back to line split without blank lines', () => {
    const doc = loadText('l1\nl2\nl3', base);
    const s = allSents(doc as unknown as ReturnType<typeof loadMarkdown>);
    expect(s.length).toBeGreaterThanOrEqual(3);
  });
});
