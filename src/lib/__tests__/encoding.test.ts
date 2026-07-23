import { describe, expect, it } from 'vitest';
import { decodeTextBytes } from '@/lib/encoding';

const enc = (s: string) => new TextEncoder().encode(s);

describe('decodeTextBytes', () => {
  it('pure ascii', () => {
    const r = decodeTextBytes(enc('hello world'));
    expect(r.encoding).toBe('ascii');
    expect(r.text).toBe('hello world');
  });

  it('utf-8 hangul', () => {
    const r = decodeTextBytes(enc('안녕하세요'));
    expect(r.encoding).toBe('utf-8');
    expect(r.text).toBe('안녕하세요');
  });

  it('utf-8 BOM', () => {
    const bom = new Uint8Array([0xef, 0xbb, 0xbf, ...enc('한글')]);
    const r = decodeTextBytes(bom);
    expect(r.encoding).toBe('utf-8-bom');
    expect(r.text).toBe('한글');
  });

  it('utf-16le BOM', () => {
    const u8 = new Uint8Array([0xff, 0xfe, 0x41, 0x00, 0x42, 0x00]);
    const r = decodeTextBytes(u8);
    expect(r.encoding).toBe('utf-16le');
    expect(r.text).toBe('AB');
  });

  it('euc-kr bytes decoded to hangul', () => {
    // '안녕하세요' in EUC-KR (long enough for confident detection)
    const u8 = new Uint8Array([
      0xbe, 0xc8, 0xb3, 0xe7, 0xc7, 0xcf, 0xbc, 0xbc, 0xbf, 0xe4, 0x0a,
    ]);
    const r = decodeTextBytes(u8);
    expect(r.encoding).toBe('euc-kr');
    expect(r.text).toContain('안녕하세요');
  });

  it('empty input → high confidence utf-8', () => {
    const r = decodeTextBytes(new Uint8Array());
    expect(r.text).toBe('');
    expect(r.confidence).toBe('high');
  });
});
