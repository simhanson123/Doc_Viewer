import { describe, expect, it } from 'vitest';
import { distSeg, shapeHit, strokeHit, strokePath, pressureStrokePath } from '@/lib/geometry';

describe('distSeg', () => {
  it('point on segment → 0', () => {
    expect(distSeg(5, 0, 0, 0, 10, 0)).toBe(0);
  });
  it('perpendicular distance', () => {
    expect(distSeg(5, 3, 0, 0, 10, 0)).toBe(3);
  });
  it('degenerate segment uses endpoint distance', () => {
    expect(distSeg(3, 4, 0, 0, 0, 0)).toBe(5);
  });
});

describe('shapeHit', () => {
  const rect = { shape: 'rect', x0: 10, y0: 10, x1: 100, y1: 100, c: '#000' } as const;
  it('hits rect border', () => {
    expect(shapeHit(rect, { x: 10, y: 50 })).toBe(true);
  });
  it('misses rect interior (border-only hit)', () => {
    expect(shapeHit(rect, { x: 55, y: 55 })).toBe(false);
  });
  it('hits line near segment, misses far point', () => {
    const line = { shape: 'line', x0: 0, y0: 0, x1: 100, y1: 0, c: '#000' } as const;
    expect(shapeHit(line, { x: 50, y: 5 })).toBe(true);
    expect(shapeHit(line, { x: 50, y: 50 })).toBe(false);
  });
});

describe('strokeHit', () => {
  it('hits within radius, misses outside', () => {
    expect(strokeHit([{ x: 0, y: 0 }], { x: 10, y: 0 })).toBe(true);
    expect(strokeHit([{ x: 0, y: 0 }], { x: 30, y: 0 })).toBe(false);
  });
});

describe('paths', () => {
  it('strokePath single point produces valid path', () => {
    expect(strokePath([{ x: 1, y: 2 }])).toMatch(/^M 1 2 L/);
  });
  it('strokePath empty → empty string', () => {
    expect(strokePath([])).toBe('');
  });
  it('pressureStrokePath closes polygon', () => {
    const d = pressureStrokePath(
      [
        { x: 0, y: 0, p: 0.4 },
        { x: 10, y: 0, p: 0.8 },
      ],
      3,
    );
    expect(d.endsWith('Z')).toBe(true);
  });
});
