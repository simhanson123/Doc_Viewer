import { describe, expect, it } from 'vitest';
import { htmlToBlocks, paginateBlocks } from '@/lib/htmlBlocks';

describe('htmlToBlocks', () => {
  it('maps headings and paragraphs', () => {
    const blocks = htmlToBlocks('<h1>Title</h1><p>Hello there.</p>');
    expect(blocks[0]).toEqual({ k: 'h1', t: 'Title' });
    expect(blocks[1].k).toBe('p');
  });

  it('strips script/style content', () => {
    const blocks = htmlToBlocks('<script>evil()</script><p>ok.</p><style>.x{}</style>');
    const text = JSON.stringify(blocks);
    expect(text).not.toContain('evil');
    expect(text).toContain('ok.');
  });

  it('uses <title> as h1 when no h1 present', () => {
    const blocks = htmlToBlocks('<html><head><title>Doc</title></head><body><p>x.</p></body></html>');
    expect(blocks[0]).toEqual({ k: 'h1', t: 'Doc' });
  });

  it('pre becomes code block', () => {
    const blocks = htmlToBlocks('<pre>line1\nline2</pre>');
    expect(blocks[0].k).toBe('code');
  });
});

describe('paginateBlocks', () => {
  it('empty input yields placeholder page', () => {
    const pages = paginateBlocks([]);
    expect(pages.length).toBe(1);
  });

  it('splits long content into multiple pages', () => {
    const long = 'x'.repeat(400);
    const blocks = Array.from({ length: 10 }, () => ({ k: 'p' as const, sents: [long] }));
    const pages = paginateBlocks(blocks, 6);
    expect(pages.length).toBeGreaterThan(1);
  });
});
