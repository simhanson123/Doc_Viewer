import { describe, expect, it } from 'vitest';
import { xmlTextNodes } from '@/lib/loaders/pptx';

describe('xmlTextNodes (PPTX <a:t> extraction)', () => {
  it('extracts text runs', () => {
    const xml = '<a:t>Hello</a:t><a:t>World</a:t>';
    expect(xmlTextNodes(xml)).toEqual(['Hello', 'World']);
  });

  it('decodes entities', () => {
    const xml = '<a:t>a &lt; b &amp; c &gt; d</a:t>';
    expect(xmlTextNodes(xml)).toEqual(['a < b & c > d']);
  });

  it('does not double-decode &amp;quot; (regression)', () => {
    const xml = '<a:t>&amp;quot;said&amp;quot;</a:t>';
    // &amp;quot; is the literal text `&quot;` — must NOT become `"`
    expect(xmlTextNodes(xml)).toEqual(['&quot;said&quot;']);
  });

  it('skips empty runs', () => {
    const xml = '<a:t>  </a:t><a:t>x</a:t>';
    expect(xmlTextNodes(xml)).toEqual(['x']);
  });
});
