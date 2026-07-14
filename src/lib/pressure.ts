/** Stylus pressure response curves. */

export type PressureCurve = 'linear' | 'soft' | 'firm' | 'ink';

/**
 * Map raw pointer pressure (0–1) to effective width scale (0–1+).
 * `soft` — light touch already thick (good for styli with weak range)
 * `firm` — needs real pressure
 * `ink`  — exponential brush-like response
 */
export function mapPressure(
  raw: number,
  curve: PressureCurve = 'linear',
  pointerType: string = 'mouse',
): number {
  let p = Number.isFinite(raw) ? raw : 0.5;
  if (pointerType === 'mouse') return 0.55;
  if (pointerType === 'touch' && p <= 0) p = 0.4;
  p = Math.min(1, Math.max(0.02, p));

  switch (curve) {
    case 'soft':
      // ease-out: sqrt
      return Math.sqrt(p) * 0.85 + 0.15;
    case 'firm':
      // ease-in power
      return Math.pow(p, 1.85) * 0.9 + 0.1;
    case 'ink':
      // brush: mid pressure jumps, then plateaus
      return 0.12 + 0.88 * (1 - Math.exp(-3.2 * p));
    case 'linear':
    default:
      return 0.2 + p * 0.8;
  }
}

/** Convert mapped pressure to stroke half-width multiplier. */
export function pressureToWidthScale(mapped: number, baseW: number): number {
  return Math.max(0.5, baseW * (0.35 + mapped * 0.95));
}
