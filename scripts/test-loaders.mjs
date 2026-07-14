/**
 * Offline smoke tests (no Electron UI).
 * Run: node scripts/test-loaders.mjs
 *
 * Encoding detection mirrors src/lib/encoding.ts two-phase logic.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import iconv from 'iconv-lite';
import { spawnSync } from 'node:child_process';

const dir = 'test-fixtures';
mkdirSync(dir, { recursive: true });

writeFileSync(join(dir, 'utf8.md'), '# Hello\n\n한글 日本語 中文 العربية\n\nPara 2.\n', 'utf8');
writeFileSync(join(dir, 'ascii.txt'), 'Hello ASCII\nLine 2\n', 'ascii');
writeFileSync(join(dir, 'plain.asc'), 'ASC file pure 7-bit\n', 'ascii');
writeFileSync(join(dir, 'empty.txt'), '', 'utf8');
writeFileSync(join(dir, 'bom.txt'), '\uFEFFBOM 한글\nnext\n', 'utf8');
writeFileSync(join(dir, 'latin1.txt'), iconv.encode('café naïve\r\nHolà\n', 'windows-1252'));
writeFileSync(join(dir, 'euckr.txt'), iconv.encode('안녕하세요\n두번째 줄\n', 'cp949'));
writeFileSync(join(dir, 'sjis.txt'), iconv.encode('こんにちは\n世界\n', 'shift_jis'));
writeFileSync(join(dir, 'gbk.txt'), iconv.encode('你好世界\n第二行\n', 'gbk'));
writeFileSync(join(dir, 'log-sample.log'), '2024-01-01 INFO boot ok\nline2\n', 'utf8');

const pdf = `%PDF-1.4
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 144] /Contents 4 0 R /Resources<< /Font<< /F1 5 0 R >> >> >>endobj
4 0 obj<< /Length 44 >>stream
BT /F1 24 Tf 50 50 Td (Hello PDF) Tj ET
endstream endobj
5 0 obj<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
0000000266 00000 n 
0000000361 00000 n 
trailer<< /Size 6 /Root 1 0 R >>
startxref
440
%%EOF
`;
writeFileSync(join(dir, 'hello.pdf'), pdf);

const zipMagic = Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
writeFileSync(join(dir, 'fake.docx.magic'), zipMagic);
writeFileSync(join(dir, 'fake.epub.magic'), zipMagic);

let fail = 0;

// --- Real encoding.ts via tsx (source of truth) ---
const encScript = `
import { readFileSync } from 'fs';
import { decodeTextBytes } from '../src/lib/encoding.ts';
const cases = [
  ['utf8.md', /한글/, 'utf-8'],
  ['ascii.txt', /Hello ASCII/, 'ascii'],
  ['plain.asc', /ASC file/, 'ascii'],
  ['bom.txt', /BOM/, 'utf-8-bom'],
  ['latin1.txt', /café|caf/, 'windows-1252'],
  ['euckr.txt', /안녕/, 'euc-kr'],
  ['sjis.txt', /こん/, 'shift_jis'],
  ['gbk.txt', /你好/, 'gbk'],
  ['log-sample.log', /boot ok/, 'ascii'],
  ['empty.txt', /^$/, 'utf-8'],
];
let f = 0;
for (const [name, re, want] of cases) {
  const r = decodeTextBytes(readFileSync(new URL('./' + name, import.meta.url)));
  const ok = re.test(r.text) && r.encoding === want;
  console.log((ok ? 'OK' : 'FAIL') + ' enc ' + name + ' enc=' + r.encoding + ' sample=' + JSON.stringify(r.text.slice(0, 40)));
  if (!ok) f++;
}
process.exit(f ? 1 : 0);
`;
writeFileSync(join(dir, '_enc-check.mts'), encScript);
const encRun = spawnSync(
  process.platform === 'win32' ? 'npx.cmd' : 'npx',
  ['--yes', 'tsx', join(dir, '_enc-check.mts')],
  { encoding: 'utf8', shell: true, cwd: process.cwd() },
);
process.stdout.write(encRun.stdout || '');
process.stderr.write(encRun.stderr || '');
if (encRun.status !== 0) {
  fail += 1;
  console.error('FAIL encoding.ts verification');
}

// PDF header
const pdfBuf = readFileSync(join(dir, 'hello.pdf'));
const head = pdfBuf.subarray(0, 5).toString('utf8');
console.log(head.startsWith('%PDF') ? 'OK hello.pdf header' : 'FAIL hello.pdf header ' + head);
if (!head.startsWith('%PDF')) fail++;

for (const name of ['fake.docx.magic', 'fake.epub.magic']) {
  const b = readFileSync(join(dir, name));
  const ok = b[0] === 0x50 && b[1] === 0x4b;
  console.log(ok ? `OK ${name} ZIP magic` : `FAIL ${name}`);
  if (!ok) fail++;
}

// base64 IPC roundtrip
function toB64(buf) {
  return Buffer.from(buf).toString('base64');
}
function fromB64(b64) {
  return Buffer.from(b64, 'base64');
}
for (const name of ['hello.pdf', 'ascii.txt', 'utf8.md', 'euckr.txt', 'gbk.txt']) {
  const orig = readFileSync(join(dir, name));
  const back = fromB64(toB64(orig));
  const ok = back.equals(orig);
  console.log(ok ? `OK base64 ${name}` : `FAIL base64 ${name}`);
  if (!ok) fail++;
}

// Real DOCX via jszip + mammoth
try {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  zip.file(
    '[Content_Types].xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`,
  );
  zip.folder('_rels')?.file(
    '.rels',
    `<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
  );
  zip.folder('word')?.file(
    'document.xml',
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Hello DOCX from Onjeom test</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  );
  const docxBuf = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(join(dir, 'hello.docx'), docxBuf);
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ buffer: docxBuf });
  if (!/Hello DOCX/.test(result.value)) throw new Error('mammoth miss: ' + result.value);
  console.log('OK hello.docx mammoth');
  if (!(docxBuf[0] === 0x50 && docxBuf[1] === 0x4b)) {
    console.log('FAIL hello.docx ZIP');
    fail++;
  } else console.log('OK hello.docx ZIP');
} catch (e) {
  console.error('FAIL docx', e.message || e);
  fail++;
}

if (fail) {
  console.error(`\n${fail} failure group(s)`);
  process.exit(1);
}
console.log('\nAll encoding + format smoke tests passed.');
