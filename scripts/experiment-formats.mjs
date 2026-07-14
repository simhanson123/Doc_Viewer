/**
 * Offline structural experiments on generated fixtures.
 * Does not need Electron — validates ZIP magic, PDF header, PPTX slide XML, etc.
 *
 *   node scripts/gen-fixtures.mjs
 *   node scripts/experiment-formats.mjs
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import JSZip from 'jszip';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const dir = join(process.cwd(), 'e2e', 'fixtures');
let fail = 0;

function ok(name, cond, detail = '') {
  if (cond) console.log(`OK   ${name}${detail ? ' — ' + detail : ''}`);
  else {
    console.error(`FAIL ${name}${detail ? ' — ' + detail : ''}`);
    fail++;
  }
}

function need(name) {
  const p = join(dir, name);
  if (!existsSync(p)) {
    ok(name, false, 'missing (run node scripts/gen-fixtures.mjs)');
    return null;
  }
  return readFileSync(p);
}

// PDF
{
  const b = need('sample.pdf');
  if (b) ok('sample.pdf header', b.subarray(0, 5).toString() === '%PDF-');
}
{
  const b = need('protected.pdf');
  if (b) {
    ok('protected.pdf header', b.subarray(0, 5).toString() === '%PDF-');
    // Encrypted PDFs usually contain /Encrypt
    ok('protected.pdf /Encrypt', b.toString('latin1').includes('/Encrypt'));
  }
}

// HTML
{
  const b = need('sample.html');
  if (b) {
    const t = b.toString('utf8');
    ok('sample.html has h1', /E2E HTML Document/.test(t));
    ok('sample.html has charset', /charset/i.test(t));
  }
}

// DOCX
{
  const b = need('sample.docx');
  if (b) {
    ok('sample.docx ZIP', b[0] === 0x50 && b[1] === 0x4b);
    const zip = await JSZip.loadAsync(b);
    ok('sample.docx document.xml', !!zip.file('word/document.xml'));
    const xml = await zip.file('word/document.xml').async('string');
    ok('sample.docx text', /E2E DOCX Hello Onjeom/.test(xml));
  }
}

// PPTX
{
  const b = need('sample.pptx');
  if (b) {
    ok('sample.pptx ZIP', b[0] === 0x50 && b[1] === 0x4b);
    const zip = await JSZip.loadAsync(b);
    const slides = Object.keys(zip.files).filter((n) => /ppt\/slides\/slide\d+\.xml$/i.test(n));
    ok('sample.pptx slides', slides.length >= 2, `count=${slides.length}`);
    const s1 = await zip.file('ppt/slides/slide1.xml').async('string');
    ok('sample.pptx a:t title', /E2E PPTX Title/.test(s1));
    // Simulate pptx loader text extract
    const texts = [];
    const re = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/gi;
    let m;
    while ((m = re.exec(s1))) texts.push(m[1]);
    ok('sample.pptx extract', texts.includes('E2E PPTX Title'));
  }
}

// EPUB
{
  const b = need('sample.epub');
  if (b) {
    ok('sample.epub ZIP', b[0] === 0x50 && b[1] === 0x4b);
    const zip = await JSZip.loadAsync(b);
    ok('sample.epub mimetype', !!(await zip.file('mimetype')?.async('string')));
    ok('sample.epub container', !!zip.file('META-INF/container.xml'));
    ok('sample.epub chap1', !!zip.file('OEBPS/chap1.xhtml'));
    const chap = await zip.file('OEBPS/chap1.xhtml').async('string');
    ok('sample.epub text', /E2E EPUB Chapter One/.test(chap));
  }
}

// MD / TXT
{
  const md = need('sample.md');
  if (md) ok('sample.md', /E2E Markdown/.test(md.toString('utf8')));
  const txt = need('sample.txt');
  if (txt) ok('sample.txt', /Plain ASCII/.test(txt.toString('ascii')));
}

// base64 roundtrip all binaries
for (const name of ['sample.pdf', 'sample.docx', 'sample.pptx', 'sample.epub', 'sample.html']) {
  const b = need(name);
  if (!b) continue;
  const back = Buffer.from(b.toString('base64'), 'base64');
  ok(`base64 ${name}`, back.equals(b));
}

if (fail) {
  console.error(`\n${fail} experiment failure(s)`);
  process.exit(1);
}
console.log('\nAll format experiments passed.');
