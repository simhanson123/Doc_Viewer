/**
 * Generate docs/badges/coverage.svg from coverage/coverage-summary.json
 * (vitest --coverage with json-summary reporter). No external deps.
 * Run: node scripts/coverage-badge.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const summary = JSON.parse(readFileSync('coverage/coverage-summary.json', 'utf8'));
const pct = Math.round(summary.total.lines.pct);
const color = pct >= 80 ? '#4c1' : pct >= 60 ? '#dfb317' : '#e05d44';
const label = 'coverage';
const value = `${pct}%`;

const labelW = 62;
const valueW = 44;
const w = labelW + valueW;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="20" role="img" aria-label="${label}: ${value}">
  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#bbb" stop-opacity=".1"/><stop offset="1" stop-opacity=".1"/></linearGradient>
  <clipPath id="r"><rect width="${w}" height="20" rx="3" fill="#fff"/></clipPath>
  <g clip-path="url(#r)">
    <rect width="${labelW}" height="20" fill="#555"/>
    <rect x="${labelW}" width="${valueW}" height="20" fill="${color}"/>
    <rect width="${w}" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" font-size="110" text-rendering="geometricPrecision">
    <text x="${(labelW / 2) * 10}" y="140" transform="scale(.1)" fill="#010101" fill-opacity=".3" textLength="${(labelW - 10) * 10}">${label}</text>
    <text x="${(labelW / 2) * 10}" y="130" transform="scale(.1)" textLength="${(labelW - 10) * 10}">${label}</text>
    <text x="${(labelW + valueW / 2) * 10}" y="140" transform="scale(.1)" fill="#010101" fill-opacity=".3">${value}</text>
    <text x="${(labelW + valueW / 2) * 10}" y="130" transform="scale(.1)">${value}</text>
  </g>
</svg>
`;

mkdirSync('docs/badges', { recursive: true });
writeFileSync('docs/badges/coverage.svg', svg);
console.log(`coverage badge: ${value}`);
