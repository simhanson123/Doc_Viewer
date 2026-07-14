import type { CSSProperties } from 'react';
import type { Point, Shape, Stroke } from '@/types';
import { mapPressure, type PressureCurve } from '@/lib/pressure';

export function strokePath(pts: Point[]): string {
  if (!pts.length) return '';
  const r = (v: number) => Math.round(v * 10) / 10;
  if (pts.length === 1) {
    return `M ${r(pts[0].x)} ${r(pts[0].y)} L ${r(pts[0].x + 0.5)} ${r(pts[0].y)}`;
  }
  return (
    `M ${r(pts[0].x)} ${r(pts[0].y)}` +
    pts.slice(1).map((p) => ` L ${r(p.x)} ${r(p.y)}`).join('')
  );
}

/** Variable-width stroke as filled polygon (for pressure pen). */
export function pressureStrokePath(
  pts: Point[],
  baseW: number,
  curve: PressureCurve = 'ink',
): string {
  if (pts.length < 2) {
    const p = pts[0];
    if (!p) return '';
    const mapped = mapPressure(p.p ?? 0.5, curve, 'pen');
    const r = Math.max(0.8, (baseW * (0.35 + mapped * 0.95)) / 2);
    return `M ${p.x - r} ${p.y} A ${r} ${r} 0 1 0 ${p.x + r} ${p.y} A ${r} ${r} 0 1 0 ${p.x - r} ${p.y}`;
  }
  const left: Point[] = [];
  const right: Point[] = [];
  for (let i = 0; i < pts.length; i++) {
    const prev = pts[Math.max(0, i - 1)];
    const next = pts[Math.min(pts.length - 1, i + 1)];
    const dx = next.x - prev.x;
    const dy = next.y - prev.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len;
    const ny = dx / len;
    const mapped = mapPressure(pts[i].p ?? 0.5, curve, 'pen');
    const w = Math.max(0.55, baseW * (0.3 + mapped * 1.0)) / 2;
    left.push({ x: pts[i].x + nx * w, y: pts[i].y + ny * w });
    right.push({ x: pts[i].x - nx * w, y: pts[i].y - ny * w });
  }
  const r = (v: number) => Math.round(v * 10) / 10;
  let d = `M ${r(left[0].x)} ${r(left[0].y)}`;
  for (let i = 1; i < left.length; i++) d += ` L ${r(left[i].x)} ${r(left[i].y)}`;
  for (let i = right.length - 1; i >= 0; i--) d += ` L ${r(right[i].x)} ${r(right[i].y)}`;
  return d + ' Z';
}

export function shapePath(s: Shape): string {
  const r = (v: number) => Math.round(v * 10) / 10;
  if (s.shape === 'line') {
    return `M ${r(s.x0)} ${r(s.y0)} L ${r(s.x1)} ${r(s.y1)}`;
  }
  if (s.shape === 'rect') {
    const a = Math.min(s.x0, s.x1);
    const b = Math.min(s.y0, s.y1);
    const c = Math.max(s.x0, s.x1);
    const d = Math.max(s.y0, s.y1);
    return `M ${r(a)} ${r(b)} H ${r(c)} V ${r(d)} H ${r(a)} Z`;
  }
  if (s.shape === 'ellipse') {
    const cx = (s.x0 + s.x1) / 2;
    const cy = (s.y0 + s.y1) / 2;
    const rx = Math.max(1, Math.abs(s.x1 - s.x0) / 2);
    const ry = Math.max(1, Math.abs(s.y1 - s.y0) / 2);
    return (
      `M ${r(cx - rx)} ${r(cy)} A ${r(rx)} ${r(ry)} 0 1 0 ${r(cx + rx)} ${r(cy)}` +
      ` A ${r(rx)} ${r(ry)} 0 1 0 ${r(cx - rx)} ${r(cy)} Z`
    );
  }
  const ang = Math.atan2(s.y1 - s.y0, s.x1 - s.x0);
  const L = 13;
  const h1x = s.x1 - L * Math.cos(ang - 0.45);
  const h1y = s.y1 - L * Math.sin(ang - 0.45);
  const h2x = s.x1 - L * Math.cos(ang + 0.45);
  const h2y = s.y1 - L * Math.sin(ang + 0.45);
  return (
    `M ${r(s.x0)} ${r(s.y0)} L ${r(s.x1)} ${r(s.y1)}` +
    ` M ${r(h1x)} ${r(h1y)} L ${r(s.x1)} ${r(s.y1)} L ${r(h2x)} ${r(h2y)}`
  );
}

export function distSeg(
  px: number,
  py: number,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
): number {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = len2 ? ((px - x0) * dx + (py - y0) * dy) / len2 : 0;
  t = Math.max(0, Math.min(1, t));
  const qx = x0 + t * dx;
  const qy = y0 + t * dy;
  return Math.sqrt((px - qx) ** 2 + (py - qy) ** 2);
}

export function shapeHit(s: Shape, pt: Point): boolean {
  if (s.shape === 'arrow' || s.shape === 'line') {
    return distSeg(pt.x, pt.y, s.x0, s.y0, s.x1, s.y1) < 14;
  }
  const a = Math.min(s.x0, s.x1);
  const b = Math.min(s.y0, s.y1);
  const c = Math.max(s.x0, s.x1);
  const d = Math.max(s.y0, s.y1);
  const inOuter =
    pt.x > a - 12 && pt.x < c + 12 && pt.y > b - 12 && pt.y < d + 12;
  const inInner =
    pt.x > a + 12 && pt.x < c - 12 && pt.y > b + 12 && pt.y < d - 12;
  return inOuter && !inInner;
}

export function strokeHit(pts: Point[], pt: Point, radius = 18): boolean {
  const r2 = radius * radius;
  return pts.some((q) => (q.x - pt.x) ** 2 + (q.y - pt.y) ** 2 < r2);
}

export function renderStrokeElement(
  st: Stroke,
  key: string,
  curve: PressureCurve = 'ink',
): {
  key: string;
  d: string;
  fill: string | 'none';
  stroke: string;
  strokeWidth: number;
  style: CSSProperties;
} {
  if (st.pressure && st.tool === 'pen') {
    return {
      key,
      d: pressureStrokePath(st.pts, st.w, curve),
      fill: st.c,
      stroke: 'none',
      strokeWidth: 0,
      style: { opacity: 0.95 },
    };
  }
  return {
    key,
    d: strokePath(st.pts),
    fill: 'none',
    stroke: st.c,
    strokeWidth: st.w,
    style: {
      mixBlendMode: st.tool === 'hl' ? 'multiply' : 'normal',
      opacity: st.tool === 'hl' ? 0.5 : 1,
    },
  };
}
