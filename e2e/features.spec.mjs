/**
 * Functional coverage of in-app features (not just file open).
 * Uses window.__onjeomE2E API + UI checks against packaged EXE.
 */
import { test, expect, _electron as electron } from '@playwright/test';
import { existsSync, readdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixtures = join(root, 'e2e', 'fixtures');
const unpacked = join(root, 'release', 'win-unpacked');

function findExe() {
  const exes = readdirSync(unpacked).filter((f) => f.toLowerCase().endsWith('.exe'));
  const main = exes.find((f) => !/crash|helper|update|elevate/i.test(f));
  if (!main) throw new Error('no exe');
  return join(unpacked, main);
}

function e2e(page) {
  return page.evaluate(() => window.__onjeomE2E);
}

async function state(page) {
  return page.evaluate(() => window.__onjeomE2E.getState());
}

async function open(page, name) {
  const full = join(fixtures, name);
  const err = await page.evaluate(async (p) => {
    try {
      await window.__onjeomE2E.open([p]);
      return null;
    } catch (e) {
      return String(e);
    }
  }, full);
  if (err) throw new Error(err);
  await expect.poll(async () => (await state(page)).fmt, { timeout: 20000 }).not.toBe('');
}

test.describe.configure({ mode: 'serial' });

/** @type {import('@playwright/test').ElectronApplication} */
let app;
/** @type {import('@playwright/test').Page} */
let page;

test.beforeAll(async () => {
  spawnSync(process.execPath, [join(root, 'scripts', 'gen-fixtures.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  // Korean MD for export unicode path
  writeFileSync(
    join(fixtures, 'hangul.md'),
    '# 한글 제목\n\n본문입니다. Onjeom 기능 검증용 문서.\n\n## 두 번째 절\n\n내용 더하기.\n',
    'utf8',
  );

  app = await electron.launch({ executablePath: findExe(), env: { ...process.env } });
  page = await app.firstWindow({ timeout: 60000 });
  await page.waitForSelector('[data-testid="app-shell-empty"], [data-testid="app-shell"]', {
    timeout: 45000,
  });
  await expect.poll(async () => page.evaluate(() => !!window.__onjeomE2E), { timeout: 15000 }).toBe(true);
});

test.afterAll(async () => {
  if (app) await app.close();
});

test('1) open MD and expose functional API', async () => {
  await open(page, 'hangul.md');
  const s = await state(page);
  expect(s.fmt).toBe('MD');
  expect(s.pages).toBeGreaterThanOrEqual(1);
  expect(s.libraryCount).toBeGreaterThanOrEqual(1);
});

test('2) view modes: single / spread / scroll / reflow', async () => {
  for (const m of ['single', 'spread', 'scroll', 'reflow']) {
    await page.evaluate((mode) => window.__onjeomE2E.setMode(mode), m);
    await expect.poll(async () => (await state(page)).mode).toBe(m);
    // UI mode button if present
    const btn = page.locator(`[data-testid="mode-${m}"]`);
    if (await btn.count()) {
      await expect(btn).toHaveClass(/active/);
    }
  }
  await page.evaluate(() => window.__onjeomE2E.setMode('single'));
});

test('3) tools select: pen, hl, eraser, shape, note, laser, select', async () => {
  for (const t of ['pen', 'hl', 'eraser', 'shape', 'note', 'laser', 'line', 'select', 'texthl']) {
    await page.evaluate((tool) => window.__onjeomE2E.setTool(tool), t);
    await expect.poll(async () => (await state(page)).tool).toBe(t);
    const btn = page.locator(`[data-testid="tool-${t === 'texthl' ? 'texthl' : t}"]`);
    if (await btn.count()) await expect(btn).toBeVisible();
  }
});

test('4) ink: stroke + shape + undo/redo', async () => {
  await page.evaluate(() => window.__onjeomE2E.setMode('single'));
  await page.evaluate(() => window.__onjeomE2E.addTestStroke());
  await expect.poll(async () => (await state(page)).strokeCount).toBeGreaterThanOrEqual(1);
  await page.evaluate(() => window.__onjeomE2E.addTestShape());
  await expect.poll(async () => (await state(page)).shapeCount).toBeGreaterThanOrEqual(1);

  const before = await state(page);
  expect(before.canUndo).toBe(true);
  await page.evaluate(() => window.__onjeomE2E.undo());
  await expect.poll(async () => (await state(page)).shapeCount).toBeLessThan(before.shapeCount);
  await page.evaluate(() => window.__onjeomE2E.redo());
  await expect.poll(async () => (await state(page)).shapeCount).toBe(before.shapeCount);
});

test('5) bookmark mark toggle', async () => {
  const a = await state(page);
  await page.evaluate(() => window.__onjeomE2E.toggleMark());
  await expect.poll(async () => (await state(page)).marked).toBe(!a.marked);
  await page.evaluate(() => window.__onjeomE2E.toggleMark());
  await expect.poll(async () => (await state(page)).marked).toBe(a.marked);
});

test('6) page navigation goPage', async () => {
  const s = await state(page);
  if (s.pages < 2) {
    // open multi-page doc
    await open(page, 'sample.pptx');
  }
  const s2 = await state(page);
  expect(s2.pages).toBeGreaterThanOrEqual(1);
  await page.evaluate(() => window.__onjeomE2E.goPage(0));
  await expect.poll(async () => (await state(page)).page).toBe(0);
  if (s2.pages >= 2) {
    await page.evaluate(() => window.__onjeomE2E.goPage(1));
    await expect.poll(async () => (await state(page)).page).toBe(1);
  }
});

test('7) right panel TOC / search tabs', async () => {
  await open(page, 'hangul.md');
  await page.evaluate(() => window.__onjeomE2E.ensureRightPanel('toc'));
  await expect.poll(async () => (await state(page)).showRightPanel).toBe(true);
  await expect.poll(async () => (await state(page)).rightPanelTab).toBe('toc');
  await expect(page.locator('[data-testid="toc-list"]')).toBeVisible({ timeout: 10000 });
  const items = page.locator('[data-testid="toc-item"]');
  if ((await items.count()) > 0) {
    await items.first().click();
    await page.waitForTimeout(300);
  }
  await page.evaluate(() => window.__onjeomE2E.ensureRightPanel('search'));
  await expect.poll(async () => (await state(page)).rightPanelTab).toBe('search');
  await expect(page.locator('.right-panel .search-input')).toBeVisible();
});

test('8) export annotated PDF produces valid %PDF (Hangul MD)', async () => {
  await open(page, 'hangul.md');
  const r = await page.evaluate(async () => window.__onjeomE2E.exportPdfBase64());
  expect(r.error || null).toBe(null);
  expect(r.ok).toBe(true);
  expect(r.bytes).toBeGreaterThan(500);
});

test('9) export password-protected PDF still valid', async () => {
  const r = await page.evaluate(async () => window.__onjeomE2E.exportPdfBase64('test-pass-123'));
  expect(r.ok).toBe(true);
  expect(r.bytes).toBeGreaterThan(500);
});

test('10) zoom and tool UI buttons', async () => {
  await page.evaluate(() => window.__onjeomE2E.setZoom(1.2));
  await page.locator('[data-testid="tool-pen"]').click();
  await expect.poll(async () => (await state(page)).tool).toBe('pen');
  await page.locator('[data-testid="mode-scroll"]').click();
  await expect.poll(async () => (await state(page)).mode).toBe('scroll');
  await page.locator('[data-testid="mode-single"]').click();
  await expect.poll(async () => (await state(page)).mode).toBe('single');
});

test('11) library remove keeps disk file', async () => {
  await open(page, 'sample.asc');
  const before = (await state(page)).libraryCount;
  await page.evaluate(() => window.__onjeomE2E.removeActiveFromLibrary());
  await expect
    .poll(async () => (await state(page)).libraryCount, { timeout: 10000 })
    .toBeLessThan(before);
  expect(existsSync(join(fixtures, 'sample.asc'))).toBe(true);
});

test('12) multi-format open still works (smoke matrix)', async () => {
  for (const [file, fmt] of [
    ['sample.html', 'HTML'],
    ['sample.docx', 'DOCX'],
    ['sample.pptx', 'PPTX'],
    ['sample.epub', 'EPUB'],
    ['sample.pdf', 'PDF'],
  ]) {
    await open(page, file);
    await expect.poll(async () => (await state(page)).fmt, { timeout: 20000 }).toBe(fmt);
  }
});
