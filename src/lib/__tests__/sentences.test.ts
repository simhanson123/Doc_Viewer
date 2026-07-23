import { describe, expect, it } from 'vitest';
import { splitSentences } from '@/lib/sentences';

describe('splitSentences', () => {
  it('splits latin sentences', () => {
    const out = splitSentences('Hello world. Second one! Third?');
    expect(out.length).toBe(3);
    expect(out[0]).toContain('Hello');
  });

  it('splits Korean sentences', () => {
    const out = splitSentences('안녕하세요. 반갑습니다! 잘 지내시죠?');
    expect(out.length).toBe(3);
  });

  it('returns whole text when no terminator', () => {
    expect(splitSentences('no terminator here')).toEqual(['no terminator here']);
  });

  it('empty input → empty array', () => {
    expect(splitSentences('   ')).toEqual([]);
  });
});
