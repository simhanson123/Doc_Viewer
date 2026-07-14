/**
 * Playwright Electron E2E against packaged win-unpacked EXE.
 *
 *   npm run electron:build:win
 *   npm run test:e2e
 *
 * Uses window.__onjeomE2EOpen(paths) so native file dialogs are not needed.
 */
import { test, expect, _electron as electron } from '@playwright/test';
import { existsSync, readdirSync, writeFileSync, mkdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixtures = join(root, 'e2e', 'fixtures');
const unpacked = join(root, 'release', 'win-unpacked');

function findExe() {
  if (!existsSync(unpacked)) {
    throw new Error(`Missing ${unpacked}. Run: npm run electron:build:win`);
  }
  const exes = readdirSync(unpacked).filter((f) => f.toLowerCase().endsWith('.exe'));
  const main = exes.find((f) => !/crash|helper|update|elevate/i.test(f));
  if (!main) throw new Error('No product EXE in win-unpacked');
  return join(unpacked, main);
}

function ensureFixtures() {
  mkdirSync(fixtures, { recursive: true });
  writeFileSync(
    join(fixtures, 'sample.md'),
    '# E2E Markdown\n\nHello **Onjeom** playwright test.\n\nSecond paragraph 한글.\n',
    'utf8',
  );
  writeFileSync(join(fixtures, 'sample.txt'), 'Plain ASCII text line one.\nLine two.\n', 'ascii');
  writeFileSync(join(fixtures, 'sample.asc'), 'ASC seven-bit only content\n', 'ascii');

  // Minimal valid-ish PDF
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
  writeFileSync(join(fixtures, 'sample.pdf'), pdf);

  // Minimal DOCX via jszip
  // written async in beforeAll
}

async function writeDocx() {
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
    <w:p><w:r><w:t>E2E DOCX Hello Onjeom</w:t></w:r></w:p>
  </w:body>
</w:document>`,
  );
  const buf = await zip.generateAsync({ type: 'nodebuffer' });
  writeFileSync(join(fixtures, 'sample.docx'), buf);
}

/** @type {import('@playwright/test').ElectronApplication} */
let app;
/** @type {import('@playwright/test').Page} */
let page;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  ensureFixtures();
  await writeDocx();
  const exe = findExe();
  console.log('[e2e] launching', exe);
  app = await electron.launch({
    executablePath: exe,
    args: [],
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });
  page = await app.firstWindow({ timeout: 60000 });
  // Wait for React empty shell (or boot error text)
  await page.waitForSelector('[data-testid="app-shell-empty"], [data-testid="app-shell"]', {
    timeout: 45000,
  });
});

test.afterAll(async () => {
  if (app) await app.close();
});

test('boots UI — not blank (no require crash)', async () => {
  // If main.tsx boot failed, we'd see error pre text, not empty shell
  const empty = page.locator('[data-testid="app-shell-empty"]');
  await expect(empty).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-testid="brand"]')).toBeVisible();
  await expect(page.locator('[data-testid="open-doc-primary"]')).toBeVisible();
  // Bridge must exist
  const bridge = await page.evaluate(() => Boolean(window.onjeom?.openPaths && window.onjeom?.ping));
  expect(bridge).toBe(true);
  const ping = await page.evaluate(async () => window.onjeom.ping());
  expect(ping.ok).toBe(true);
});

async function openFixture(name) {
  const full = join(fixtures, name);
  if (!existsSync(full)) throw new Error('missing fixture ' + full);
  await page.evaluate(async (p) => {
    if (!window.__onjeomE2EOpen) throw new Error('__onjeomE2EOpen missing');
    await window.__onjeomE2EOpen([p]);
  }, full);
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 30000 });
}

test('opens Markdown and shows content', async () => {
  await openFixture('sample.md');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('MD');
  await expect(page.locator('[data-testid="doc-title"]')).toContainText(/E2E Markdown|sample/i);
  await expect(page.locator('[data-testid="page-content"]')).toBeVisible();
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/Onjeom|playwright|한글/);
});

test('opens TXT (ASCII)', async () => {
  await openFixture('sample.txt');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('TXT');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/Plain ASCII|Line two/);
});

test('opens ASC', async () => {
  await openFixture('sample.asc');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('TXT');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/ASC seven-bit/);
});

test('opens DOCX and extracts text', async () => {
  await openFixture('sample.docx');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('DOCX');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/E2E DOCX Hello Onjeom/);
});

test('opens PDF and renders canvas (not blank forever)', async () => {
  await openFixture('sample.pdf');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('PDF');
  const pdfPage = page.locator('[data-testid="page-content"][data-page-kind="pdf"]');
  await expect(pdfPage).toBeVisible({ timeout: 30000 });
  // Wait until not busy or error
  await expect
    .poll(async () => pdfPage.getAttribute('data-pdf-busy'), { timeout: 30000 })
    .toBe('0');
  const err = await pdfPage.getAttribute('data-pdf-error');
  expect(err).toBe('0');
  const canvas = page.locator('[data-testid="pdf-canvas"]');
  await expect(canvas).toBeVisible();
  // Canvas should have non-zero size after render
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThan(50);
  expect(box.height).toBeGreaterThan(50);
});
