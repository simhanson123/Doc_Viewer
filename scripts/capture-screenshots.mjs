/**
 * Capture reading-theme screenshots for GitHub (design / taste comparison).
 *
 * Uses the **existing Settings UI only** — no product API additions.
 *   Settings button → language <select> → .theme-chip → close
 *
 * Playwright = capture tool only (not an app feature).
 *
 * Prerequisite: release/win-unpacked/*.exe (any recent package is fine)
 * Run: npm run screenshots
 *
 * See docs/DEVLOG.md (E3–E7) for past mistakes.
 */
import { _electron as electron } from '@playwright/test';
import { existsSync, mkdirSync, readdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const fixtures = join(root, 'e2e', 'fixtures');
const outDir = join(root, 'docs', 'screenshots');
const unpacked = join(root, 'release', 'win-unpacked');

/**
 * ~4 major locales × different colors (user request).
 * themeIndex = order of .theme-chip in Settings (크림, 화이트, 다크, 세피아, 나이트)
 */
const SHOTS = [
  { themeIndex: 0, slug: 'cream', themeEn: 'Cream', locale: 'ko', langLabel: '한국어' },
  { themeIndex: 1, slug: 'white', themeEn: 'White', locale: 'en', langLabel: 'English' },
  { themeIndex: 2, slug: 'dark', themeEn: 'Dark', locale: 'ja', langLabel: '日本語' },
  { themeIndex: 3, slug: 'sepia', themeEn: 'Sepia', locale: 'zh-Hans', langLabel: '简体中文' },
];

function findExe() {
  if (!existsSync(unpacked)) {
    throw new Error('Missing release/win-unpacked — run npm run electron:build:win first');
  }
  const exes = readdirSync(unpacked).filter((f) => f.toLowerCase().endsWith('.exe'));
  const main = exes.find((f) => !/crash|helper|update|elevate/i.test(f));
  if (!main) throw new Error('no packaged exe found');
  return join(unpacked, main);
}

async function openDoc(page, name) {
  const full = join(fixtures, name);
  const err = await page.evaluate(async (p) => {
    try {
      await window.__onjeomE2E.open([p]);
      return null;
    } catch (e) {
      return String(e);
    }
  }, full);
  if (err) throw new Error(`open ${name}: ${err}`);
  await page.waitForSelector('[data-testid="app-shell"]', { timeout: 30000 });
  await page.waitForTimeout(500);
}

/** Open Settings via existing toolbar button (label varies by UI language). */
async function openSettings(page) {
  const btn = page
    .locator('button.open-btn')
    .filter({ hasText: /Settings|설정|設定|设置|設定|Ajustes|Paramètres|Einstellungen|Impostazioni|Configurações|Настройки|设置/i })
    .first();
  if ((await btn.count()) === 0) {
    // Fallback: last open-btn in the top bar area often is Settings when a doc is open
    const all = page.locator('header button.open-btn, .app-shell > header button.open-btn');
    const n = await all.count();
    if (n < 1) throw new Error('Settings button not found');
    await all.nth(n - 1).click();
  } else {
    await btn.click();
  }
  await page.waitForSelector('.modal-card .theme-grid', { timeout: 10000 });
}

async function closeSettings(page) {
  const close = page.locator('.modal-head button.top-btn').first();
  if (await close.count()) {
    await close.click();
  } else {
    await page.locator('.modal-backdrop').click({ position: { x: 8, y: 8 } });
  }
  await page.waitForSelector('.modal-card', { state: 'hidden', timeout: 8000 }).catch(() => {});
  await page.waitForTimeout(300);
}

/**
 * Apply locale + reading theme through Settings UI only.
 * Theme chips are ordered; do not rely on translated labels.
 */
async function applyLocaleAndTheme(page, locale, themeIndex) {
  await openSettings(page);
  await page.locator('select.lang-select').selectOption(locale);
  await page.waitForTimeout(400);
  // Re-open if language remount closed modal (it should stay open)
  if ((await page.locator('.modal-card .theme-grid').count()) === 0) {
    await openSettings(page);
  }
  const chips = page.locator('.theme-chip');
  const count = await chips.count();
  if (themeIndex >= count) {
    throw new Error(`theme chip index ${themeIndex} out of range (${count})`);
  }
  await chips.nth(themeIndex).click();
  await page.waitForTimeout(350);
  await closeSettings(page);
}

async function shot(page, name) {
  const path = join(outDir, name);
  await page.screenshot({ path, type: 'png' });
  console.log('wrote', path);
}

// Shared demo body (readable under light & dark paper)
writeFileSync(
  join(fixtures, 'demo-ko.md'),
  `# 온점 · Onjeom · オン点 · 圆点

Reading themes: Cream · White · Dark · Sepia · Night

## Why themes matter

Pick a color that matches your taste.  
테마 색으로 취향을 고르세요.

## Formats

Markdown · HTML · PDF · DOCX · PPTX · EPUB

### Note

Same document — different desk / paper / chrome colors.
`,
  'utf8',
);

mkdirSync(outDir, { recursive: true });

// Remove stale shots (format-era + incomplete)
for (const f of readdirSync(outDir)) {
  if (f.endsWith('.png')) {
    try {
      unlinkSync(join(outDir, f));
    } catch {
      /* ignore */
    }
  }
}

spawnSync(process.execPath, [join(root, 'scripts', 'gen-fixtures.mjs')], {
  cwd: root,
  encoding: 'utf8',
  stdio: 'inherit',
});

const exe = findExe();
console.log('launching', exe);
console.log('method: Settings UI only (no setReadingTheme API)');

const app = await electron.launch({
  executablePath: exe,
  env: { ...process.env },
});

try {
  const page = await app.firstWindow({ timeout: 60000 });
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.waitForSelector('[data-testid="app-shell-empty"], [data-testid="app-shell"]', {
    timeout: 45000,
  });
  await page.waitForFunction(() => !!window.__onjeomE2E, null, { timeout: 20000 });
  await page.waitForTimeout(400);

  await openDoc(page, 'demo-ko.md');
  await page.evaluate(() => {
    window.__onjeomE2E.setMode('single');
    window.__onjeomE2E.ensureRightPanel('toc');
    window.__onjeomE2E.setTool('select');
    window.__onjeomE2E.setZoom(1.05);
  });
  await page.waitForTimeout(400);

  for (const s of SHOTS) {
    console.log(`shot ${s.slug} · theme#${s.themeIndex} · ${s.locale} (${s.langLabel})`);
    await applyLocaleAndTheme(page, s.locale, s.themeIndex);
    await page.evaluate(() => {
      window.__onjeomE2E.ensureRightPanel('toc');
      window.__onjeomE2E.setMode('single');
    });
    await page.waitForTimeout(450);
    await shot(page, `theme-${s.slug}.png`);
  }

  const files = readdirSync(outDir).filter((f) => f.endsWith('.png')).sort();
  const table = SHOTS.map(
    (s) =>
      `| \`theme-${s.slug}.png\` | **${s.themeEn}** | ${s.langLabel} (\`${s.locale}\`) |`,
  ).join('\n');

  writeFileSync(
    join(outDir, 'README.md'),
    `# Screenshots — reading themes (v0.4.9)

Same document layout. **Different colors** so users pick by taste.  
Each color uses a **different major UI language**.

| File | Theme (color) | UI language |
|------|----------------|-------------|
${table}

## Gallery

${SHOTS.map((s) => `### ${s.themeEn} · ${s.langLabel}\n\n![${s.themeEn}](./theme-${s.slug}.png)\n`).join('\n')}

## How captured

- Existing **Settings** UI: language select + theme chips (no extra product API)
- Script: \`scripts/capture-screenshots.mjs\`
- Tool: Playwright Electron (**QA/capture only**)

\`\`\`bash
npm run screenshots
\`\`\`

History of mistakes: [DEVLOG.md](../DEVLOG.md)
`,
    'utf8',
  );
  console.log('done:', files.join(', '));
} catch (e) {
  console.error('CAPTURE FAILED:', e);
  process.exitCode = 1;
} finally {
  try {
    await app.close();
  } catch {
    /* ignore */
  }
}
