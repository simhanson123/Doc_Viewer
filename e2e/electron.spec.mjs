/**
 * Playwright Electron E2E against packaged win-unpacked EXE.
 *
 *   npm run gen:fixtures
 *   npm run electron:build:win
 *   npm run test:e2e
 *
 * Uses window.__onjeomE2EOpen(paths) so native file dialogs are not needed.
 */
import { test, expect, _electron as electron } from '@playwright/test';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

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
  const r = spawnSync(process.execPath, [join(root, 'scripts', 'gen-fixtures.mjs')], {
    cwd: root,
    encoding: 'utf8',
  });
  if (r.status !== 0) {
    console.error(r.stdout, r.stderr);
    throw new Error('gen-fixtures failed');
  }
}

/** @type {import('@playwright/test').ElectronApplication} */
let app;
/** @type {import('@playwright/test').Page} */
let page;

test.describe.configure({ mode: 'serial' });

test.beforeAll(async () => {
  ensureFixtures();
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
  await page.waitForSelector('[data-testid="app-shell-empty"], [data-testid="app-shell"]', {
    timeout: 45000,
  });
});

test.afterAll(async () => {
  if (app) await app.close();
});

async function openFixture(name, wantFmt) {
  const full = join(fixtures, name);
  if (!existsSync(full)) throw new Error('missing fixture ' + full);
  const err = await page.evaluate(async (p) => {
    try {
      if (!window.__onjeomE2EOpen) throw new Error('__onjeomE2EOpen missing');
      await window.__onjeomE2EOpen([p]);
      return null;
    } catch (e) {
      return e instanceof Error ? e.message : String(e);
    }
  }, full);
  if (err) throw new Error(`openFixture ${name}: ${err}`);
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 30000 });
  if (wantFmt) {
    await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText(wantFmt, { timeout: 15000 });
  }
}

test('boots UI — not blank (no require crash)', async () => {
  const empty = page.locator('[data-testid="app-shell-empty"]');
  await expect(empty).toBeVisible({ timeout: 15000 });
  await expect(page.locator('[data-testid="brand"]')).toBeVisible();
  await expect(page.locator('[data-testid="open-doc-primary"]')).toBeVisible();
  const bridge = await page.evaluate(() => Boolean(window.onjeom?.openPaths && window.onjeom?.ping));
  expect(bridge).toBe(true);
  const ping = await page.evaluate(async () => window.onjeom.ping());
  expect(ping.ok).toBe(true);
});

test('opens Markdown and shows content', async () => {
  await openFixture('sample.md');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('MD');
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

test('opens HTML as structured document (not raw tags)', async () => {
  await openFixture('sample.html');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('HTML');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/E2E HTML Document|Section two|Item A/);
  // Should not dump raw markup as the main reading text
  const body = await page.locator('[data-testid="page-content"]').innerText();
  expect(body).not.toMatch(/<!DOCTYPE html>/i);
});

test('opens DOCX and extracts text', async () => {
  await openFixture('sample.docx');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('DOCX');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/E2E DOCX Hello Onjeom/);
});

test('opens PPTX slides as pages', async () => {
  await openFixture('sample.pptx');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('PPTX');
  await expect(page.locator('[data-testid="doc-title"]')).toContainText(/E2E PPTX|sample/i);
  await expect(page.locator('[data-testid="page-content"]')).toContainText(/E2E PPTX Title|Slide one|Slide 1/);
  // multi-slide → more than one page indicator if present
  const pagesAttr = await page.locator('[data-testid="app-shell"]').getAttribute('data-doc-pages');
  expect(Number(pagesAttr || '0')).toBeGreaterThanOrEqual(2);
});

test('opens EPUB chapters', async () => {
  await openFixture('sample.epub');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('EPUB');
  await expect(page.locator('[data-testid="page-content"]')).toContainText(
    /E2E EPUB|Chapter|Hello EPUB/i,
  );
});

test('opens PDF and renders canvas (not blank forever)', async () => {
  await openFixture('sample.pdf');
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('PDF');
  const pdfPage = page.locator('[data-testid="page-content"][data-page-kind="pdf"]');
  await expect(pdfPage).toBeVisible({ timeout: 30000 });
  await expect
    .poll(async () => pdfPage.getAttribute('data-pdf-busy'), { timeout: 30000 })
    .toBe('0');
  const err = await pdfPage.getAttribute('data-pdf-error');
  expect(err).toBe('0');
  const canvas = page.locator('[data-testid="pdf-canvas"]');
  await expect(canvas).toBeVisible();
  const box = await canvas.boundingBox();
  expect(box).toBeTruthy();
  expect(box.width).toBeGreaterThan(50);
  expect(box.height).toBeGreaterThan(50);
});

test('encrypted PDF prompts for password and unlocks', async () => {
  const protectedPath = join(fixtures, 'protected.pdf');
  await page.evaluate(async (p) => {
    if (!window.__onjeomE2EOpen) throw new Error('__onjeomE2EOpen missing');
    await window.__onjeomE2EOpen([p]);
  }, protectedPath);

  const modal = page.locator('[data-testid="password-modal"]');
  await expect(modal).toBeVisible({ timeout: 20000 });
  await page.locator('[data-testid="password-input"]').fill('wrong');
  await page.locator('[data-testid="password-submit"]').click();
  await expect(modal).toBeVisible({ timeout: 10000 });

  await page.locator('[data-testid="password-input"]').fill('secret123');
  await page.locator('[data-testid="password-submit"]').click();
  await expect(page.locator('[data-testid="app-shell"]')).toBeVisible({ timeout: 30000 });
  await expect(page.locator('[data-testid="fmt-chip"]')).toHaveText('PDF');
  const pdfPage = page.locator('[data-testid="page-content"][data-page-kind="pdf"]');
  await expect(pdfPage).toBeVisible({ timeout: 30000 });
  await expect
    .poll(async () => pdfPage.getAttribute('data-pdf-busy'), { timeout: 30000 })
    .toBe('0');
});

test('export with password UI opens set-password dialog', async () => {
  await openFixture('sample.md');
  await expect(page.locator('[data-testid="app-shell"]')).toBeVisible();
  const btn = page.locator('[data-testid="export-pdf-password"]');
  if (await btn.count()) {
    await btn.click();
  } else {
    await page.locator('[data-testid="export-pdf-password-top"]').click();
  }
  await expect(page.locator('[data-testid="password-modal"]')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-testid="password-confirm"]')).toBeVisible();
  await page.locator('[data-testid="password-input"]').fill('export-pass');
  await page.locator('[data-testid="password-confirm"]').fill('export-pass');
  await page
    .locator('[data-testid="password-modal"] .open-btn')
    .filter({ hasText: /cancel|취소|キャンセル|取消/i })
    .first()
    .click();
  await expect(page.locator('[data-testid="password-modal"]')).toBeHidden({ timeout: 10000 });
});
