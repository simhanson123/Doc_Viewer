/**
 * Gate: packaged Electron app must boot without renderer crash.
 * Catches the v0.4.3 failure mode (blank UI from `require is not defined`).
 *
 *   npm run electron:build:win
 *   npm run smoke:packaged
 *
 * Exit 0 only if:
 *   - win-unpacked EXE exists
 *   - main logs loadURL onjeom://app
 *   - no require is not defined / Uncaught ReferenceError / did-fail-load
 *   - dist renderer bundle has no iconv-lite
 */
import { spawn, execFileSync } from 'node:child_process';
import {
  existsSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  unlinkSync,
  openSync,
  closeSync,
} from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const unpacked = join(root, 'release', 'win-unpacked');
const outLog = join(root, 'release', 'smoke-out.log');
const errLog = join(root, 'release', 'smoke-err.log');
const WAIT_MS = 9000;

function fail(msg) {
  console.error('SMOKE FAIL:', msg);
  process.exit(1);
}

function findExe() {
  if (!existsSync(unpacked)) fail(`missing ${unpacked} — run npm run electron:build:win first`);
  const exes = readdirSync(unpacked).filter((f) => f.toLowerCase().endsWith('.exe'));
  const main = exes.find((f) => !/crash|helper|update|elevate/i.test(f));
  if (!main) fail(`no .exe in ${unpacked}`);
  return join(unpacked, main);
}

function checkBundle() {
  const assets = join(root, 'dist', 'assets');
  if (!existsSync(assets)) fail('missing dist/assets — build first');
  const files = readdirSync(assets).filter((f) => /^index-.*\.js$/.test(f));
  if (!files.length) fail('no index-*.js in dist/assets');
  let best = files[0];
  let bestSize = 0;
  for (const f of files) {
    const n = readFileSync(join(assets, f)).byteLength;
    if (n > bestSize) {
      bestSize = n;
      best = f;
    }
  }
  const text = readFileSync(join(assets, best), 'utf8');
  if (text.includes('iconv-lite')) {
    fail(`renderer bundle ${best} still contains iconv-lite (blank-UI risk)`);
  }
  // Fail hard if CJS require of node modules leaked (iconv pattern was require("safer-buffer"))
  if (/require\(["']safer-buffer["']\)/.test(text) || /require\(["']iconv/.test(text)) {
    fail(`renderer bundle still has Node require() for encoding packages`);
  }
  console.log(`OK bundle ${best} (${bestSize} bytes): no iconv-lite`);
}

function checkEncodingSource() {
  const p = join(root, 'src', 'lib', 'encoding.ts');
  const t = readFileSync(p, 'utf8');
  if (/^\s*import\s+.*iconv/m.test(t) || /from\s+['"]iconv-lite['"]/.test(t)) {
    fail('src/lib/encoding.ts imports iconv-lite — will blank the packaged UI');
  }
  console.log('OK encoding.ts has no iconv-lite import');
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function killTree(pid) {
  try {
    if (process.platform === 'win32') {
      execFileSync('taskkill', ['/pid', String(pid), '/T', '/F'], { stdio: 'ignore' });
    } else {
      process.kill(pid, 'SIGKILL');
    }
  } catch {
    /* already gone */
  }
}

async function run() {
  checkEncodingSource();
  checkBundle();
  const exe = findExe();
  console.log('launching', exe);

  for (const p of [outLog, errLog]) {
    try {
      unlinkSync(p);
    } catch {
      /* */
    }
  }

  // Redirect to files — piping stdio often kills Electron on Windows (exit -1).
  const outFd = openSync(outLog, 'w');
  const errFd = openSync(errLog, 'w');
  const child = spawn(exe, [], {
    cwd: unpacked,
    detached: true,
    stdio: ['ignore', outFd, errFd],
    windowsHide: true,
    env: {
      ...process.env,
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });
  closeSync(outFd);
  closeSync(errFd);
  child.unref();

  const pid = child.pid;
  console.log('pid', pid);
  await sleep(WAIT_MS);

  let stdout = '';
  let stderr = '';
  try {
    stdout = readFileSync(outLog, 'utf8');
  } catch {
    /* */
  }
  try {
    stderr = readFileSync(errLog, 'utf8');
  } catch {
    /* */
  }
  const combined = `${stdout}\n${stderr}`;

  if (pid) killTree(pid);

  const checks = {
    loadURL: /loadURL\s+onjeom:\/\/app\/index\.html/.test(combined),
    noRequire: !/require is not defined/i.test(combined),
    noUncaughtRef: !/Uncaught ReferenceError/i.test(combined),
    noFailLoad: !/did-fail-load/i.test(combined),
  };
  console.log('checks', checks);
  if (stdout) console.log('stdout lines', stdout.split(/\r?\n/).filter(Boolean).length);
  if (stderr) console.log('stderr sample', stderr.slice(0, 400).replace(/\s+/g, ' '));

  if (!checks.loadURL) {
    fail('main process did not log loadURL onjeom://app/index.html — see release/smoke-out.log');
  }
  if (!checks.noRequire) fail('renderer: require is not defined (blank UI regression)');
  if (!checks.noUncaughtRef) fail('renderer Uncaught ReferenceError');
  if (!checks.noFailLoad) fail('did-fail-load');

  console.log('SMOKE PASS: packaged app booted without fatal renderer errors');
}

run().catch((e) => fail(String(e)));
