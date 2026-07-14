/**
 * Onjeom — Electron main process
 *
 * Path model (packaged):
 *   resources/app.asar/
 *     package.json
 *     dist/index.html          ← renderer (also asar.unpacked for workers)
 *     dist/assets/*
 *     dist-electron/main.js
 *     dist-electron/preload.cjs
 *
 * We serve the renderer via custom protocol `onjeom://` so:
 *   - fetch() / Workers work (CORS + supportFetchAPI)
 *   - relative asset URLs resolve consistently
 *   - asar vs asar.unpacked is handled when reading files
 */
import {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  Menu,
  protocol,
  net,
} from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'onjeom',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
      bypassCSP: true,
    },
  },
]);

/** Project root in dev; asar root when packaged. */
function appRoot(): string {
  // dist-electron/main.js → parent is app root (or asar root)
  return path.join(__dirname, '..');
}

function distDir(): string {
  return path.join(appRoot(), 'dist');
}

/** Prefer unpacked path for a file if it exists (workers need non-asar). */
function resolveReadable(filePath: string): string {
  if (existsSync(filePath)) return filePath;
  // app.asar → app.asar.unpacked
  if (filePath.includes(`${path.sep}app.asar${path.sep}`)) {
    const unpacked = filePath.replace(
      `${path.sep}app.asar${path.sep}`,
      `${path.sep}app.asar.unpacked${path.sep}`,
    );
    if (existsSync(unpacked)) return unpacked;
  }
  // also handle forward-slash form
  if (filePath.includes('/app.asar/')) {
    const unpacked = filePath.replace('/app.asar/', '/app.asar.unpacked/');
    if (existsSync(unpacked)) return unpacked;
  }
  return filePath;
}

function preloadPath(): string {
  const candidates = [
    path.join(__dirname, 'preload.cjs'),
    path.join(__dirname, 'preload.js'),
    path.join(__dirname, 'preload.mjs'),
  ];
  for (const p of candidates) {
    if (existsSync(p)) return p;
  }
  return candidates[0];
}

function logPaths(tag: string) {
  console.log(`[onjeom] ${tag}`, {
    isPackaged: app.isPackaged,
    __dirname,
    appRoot: appRoot(),
    distDir: distDir(),
    preload: preloadPath(),
    indexHtml: path.join(distDir(), 'index.html'),
    indexExists: existsSync(path.join(distDir(), 'index.html')),
    resourcesPath: process.resourcesPath,
  });
}

let mainWindow: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function send(channel: string, ...args: unknown[]) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(channel, ...args);
  }
}

function parentWin(): BrowserWindow | undefined {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
}

function mimeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const map: Record<string, string> = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.map': 'application/json',
  };
  return map[ext] || 'application/octet-stream';
}

/**
 * onjeom://app/<path>  →  dist/<path>
 * Examples:
 *   onjeom://app/index.html
 *   onjeom://app/assets/index-xxx.js
 *   onjeom://app/assets/pdf.worker.min-xxx.mjs
 */
function registerAppProtocol() {
  protocol.handle('onjeom', async (request) => {
    try {
      const u = new URL(request.url);
      // pathname is like /index.html or /assets/foo.js
      let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '');
      if (!rel || rel.endsWith('/')) rel = path.posix.join(rel, 'index.html');

      // Prevent path traversal
      const safeRel = path.normalize(rel).replace(/^(\.\.(\/|\\|$))+/, '');
      let filePath = path.join(distDir(), safeRel);
      filePath = resolveReadable(filePath);

      if (!existsSync(filePath) || !statSync(filePath).isFile()) {
        console.error('[onjeom] protocol 404', request.url, '→', filePath);
        return new Response('Not Found: ' + safeRel, {
          status: 404,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        });
      }

      // Use net.fetch(file URL) so large assets stream correctly
      const res = await net.fetch(pathToFileURL(filePath).href);
      // Clone with correct MIME (file URLs sometimes get wrong type)
      const buf = await res.arrayBuffer();
      return new Response(buf, {
        status: 200,
        headers: {
          'Content-Type': mimeFor(filePath),
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache',
        },
      });
    } catch (err) {
      console.error('[onjeom] protocol error', request.url, err);
      return new Response(String(err), {
        status: 500,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
  });
}

function createWindow() {
  logPaths('createWindow');
  const preload = preloadPath();

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: '온점',
    backgroundColor: '#F2EBDA',
    show: false,
    webPreferences: {
      preload,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      // Allow loading local workers / blobs
      allowRunningInsecureContent: false,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[onjeom] did-fail-load', { code, desc, url });
    dialog.showErrorBox(
      '온점 — 로드 실패',
      `code=${code}\n${desc}\n\nurl=${url}\n\ndist=${distDir()}`,
    );
  });

  mainWindow.webContents.on('console-message', (_e, level, message, line, sourceId) => {
    if (level >= 2) {
      console.log(`[renderer:${level}] ${message} (${sourceId}:${line})`);
    }
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    // Production: custom protocol (NOT file://)
    const entry = 'onjeom://app/index.html';
    console.log('[onjeom] loadURL', entry);
    mainWindow.loadURL(entry);
  }

  buildMenu();
}

function buildMenu() {
  const isMac = process.platform === 'darwin';
  const template: Electron.MenuItemConstructorOptions[] = [
    ...(isMac ? [{ role: 'appMenu' as const }] : []),
    {
      label: '파일',
      submenu: [
        {
          label: '문서 열기…',
          accelerator: 'CmdOrCtrl+O',
          click: () => send('menu:open-file'),
        },
        {
          label: '필기 포함 PDF 내보내기…',
          accelerator: 'CmdOrCtrl+E',
          click: () => send('menu:export-pdf'),
        },
        {
          label: '필기 JSON 내보내기…',
          click: () => send('menu:export-json'),
        },
        {
          label: '필기 JSON 가져오기…',
          click: () => send('menu:import-json'),
        },
        { type: 'separator' },
        {
          label: '필기 동기화 폴더…',
          click: () => send('menu:pick-ann-folder'),
        },
        { type: 'separator' },
        {
          label: '인쇄…',
          accelerator: 'CmdOrCtrl+P',
          click: () => mainWindow?.webContents.print({}),
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit', label: '종료' },
      ],
    },
    {
      label: '편집',
      submenu: [
        { label: '실행 취소', accelerator: 'CmdOrCtrl+Z', click: () => send('menu:undo') },
        {
          label: '다시 실행',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => send('menu:redo'),
        },
        { type: 'separator' },
        { role: 'cut', label: '잘라내기' },
        { role: 'copy', label: '복사' },
        { role: 'paste', label: '붙여넣기' },
        { role: 'selectAll', label: '모두 선택' },
      ],
    },
    {
      label: '보기',
      submenu: [
        { label: '설정', accelerator: 'CmdOrCtrl+,', click: () => send('menu:settings') },
        {
          label: '단축키 도움말',
          accelerator: 'CmdOrCtrl+/',
          click: () => send('menu:shortcuts'),
        },
        { type: 'separator' },
        {
          label: '전체 화면',
          accelerator: 'F11',
          click: () => {
            if (!mainWindow) return;
            mainWindow.setFullScreen(!mainWindow.isFullScreen());
          },
        },
        { type: 'separator' },
        { role: 'reload', label: '새로고침' },
        { role: 'toggleDevTools', label: '개발자 도구' },
        { type: 'separator' },
        { role: 'resetZoom', label: '실제 크기' },
        { role: 'zoomIn', label: '확대' },
        { role: 'zoomOut', label: '축소' },
      ],
    },
    {
      label: '도움말',
      submenu: [
        {
          label: '온점 정보',
          click: () => {
            dialog.showMessageBox(parentWin()!, {
              type: 'info',
              title: '온점',
              message: `온점 (Onjeom) v${app.getVersion()}`,
              detail:
                'Multi-format document viewer with freehand annotation.\nMD · PDF · EPUB · DOCX\n\nMIT License',
            });
          },
        },
        {
          label: '경로 진단…',
          click: () => {
            const info = collectPathDiagnostics();
            dialog.showMessageBox(parentWin()!, {
              type: 'info',
              title: '경로 진단',
              message: 'Onjeom paths',
              detail: JSON.stringify(info, null, 2),
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

function collectPathDiagnostics() {
  const dist = distDir();
  let assets: string[] = [];
  try {
    assets = readdirSync(path.join(dist, 'assets')).slice(0, 40);
  } catch {
    assets = ['(missing)'];
  }
  const worker = assets.find((f) => f.includes('pdf.worker')) || null;
  const workerPath = worker ? resolveReadable(path.join(dist, 'assets', worker)) : null;
  return {
    version: app.getVersion(),
    isPackaged: app.isPackaged,
    __dirname,
    appRoot: appRoot(),
    distDir: dist,
    distExists: existsSync(dist),
    indexHtml: path.join(dist, 'index.html'),
    indexExists: existsSync(path.join(dist, 'index.html')),
    preload: preloadPath(),
    preloadExists: existsSync(preloadPath()),
    resourcesPath: process.resourcesPath,
    workerFile: worker,
    workerPath,
    workerExists: workerPath ? existsSync(workerPath) : false,
    assetsSample: assets.slice(0, 15),
  };
}

// ─── Document open / save ───────────────────────────────────────────

export type OpenedDoc = {
  path: string;
  name: string;
  ext: string;
  data: string;
  isText: boolean;
  encoding: 'utf8' | 'base64';
  byteLength: number;
};

const TEXT_EXTS = new Set([
  'md',
  'markdown',
  'txt',
  'text',
  'ascii',
  'asc',
  'log',
  'csv',
  'tsv',
  'json',
  'xml',
  // html/htm: still base64 bytes (encoding detect) but renderer uses HTML loader
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'tsx',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'rs',
  'go',
  'java',
  'c',
  'h',
  'cpp',
  'hpp',
  'cs',
  'rb',
  'php',
  'sh',
  'bat',
  'ps1',
  'yml',
  'yaml',
  'toml',
  'ini',
  'cfg',
  'conf',
  'nfo',
  'rst',
  'adoc',
  'tex',
  'srt',
  'vtt',
]);

const OPEN_FILTERS: Electron.FileFilter[] = [
  {
    name: 'Documents',
    extensions: [
      'md',
      'markdown',
      'txt',
      'text',
      'ascii',
      'asc',
      'log',
      'csv',
      'pdf',
      'epub',
      'docx',
      'pptx',
      'json',
      'xml',
      'html',
      'htm',
    ],
  },
  { name: 'PDF', extensions: ['pdf'] },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'EPUB', extensions: ['epub'] },
  { name: 'Word', extensions: ['docx'] },
  { name: 'PowerPoint', extensions: ['pptx'] },
  { name: 'HTML', extensions: ['html', 'htm'] },
  {
    name: 'Text / code',
    extensions: [
      'txt',
      'text',
      'ascii',
      'asc',
      'log',
      'csv',
      'tsv',
      'json',
      'xml',
      'ini',
      'cfg',
      'conf',
      'yml',
      'yaml',
      'nfo',
      'rst',
    ],
  },
  { name: 'All Files', extensions: ['*'] },
];

async function readDocument(filePath: string): Promise<OpenedDoc> {
  const extRaw = path.extname(filePath).toLowerCase().replace('.', '');
  const ext = extRaw === 'markdown' ? 'md' : extRaw;
  const name = path.basename(filePath);
  const buffer = await fs.readFile(filePath);
  const isText = TEXT_EXTS.has(extRaw) || TEXT_EXTS.has(ext);

  // Always send raw bytes as base64 so the renderer can detect charset
  // (ASCII / UTF-8 / UTF-16 / EUC-KR / Shift_JIS / GBK / …) for text,
  // and preserve binary integrity for PDF / EPUB / DOCX.
  console.log('[onjeom] readDocument', {
    filePath,
    ext,
    bytes: buffer.byteLength,
    isText,
    head:
      ext === 'pdf'
        ? buffer.subarray(0, 5).toString('utf8')
        : buffer.subarray(0, Math.min(8, buffer.length)).toString('hex'),
  });

  if (ext === 'pdf') {
    const head = buffer.subarray(0, 5).toString('utf8');
    if (!head.startsWith('%PDF')) {
      console.warn('[onjeom] .pdf without %PDF header:', JSON.stringify(head));
    }
  }

  return {
    path: filePath,
    name,
    ext,
    data: buffer.toString('base64'),
    isText,
    encoding: 'base64',
    byteLength: buffer.byteLength,
  };
}

ipcMain.handle('dialog:openFile', async () => {
  try {
    const result = await dialog.showOpenDialog(parentWin()!, {
      title: '문서 열기',
      properties: ['openFile', 'multiSelections'],
      filters: OPEN_FILTERS,
    });
    if (result.canceled || !result.filePaths.length) {
      console.log('[onjeom] openFile canceled');
      return null;
    }
    const files: OpenedDoc[] = [];
    for (const p of result.filePaths) {
      files.push(await readDocument(p));
    }
    console.log(
      '[onjeom] openFile ok',
      files.map((f) => ({ name: f.name, ext: f.ext, bytes: f.byteLength })),
    );
    return files;
  } catch (err) {
    console.error('[onjeom] openFile failed', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
});

ipcMain.handle('fs:readFile', async (_e, filePath: string) => readDocument(filePath));

/** Open files by absolute path (E2E / automation — no native dialog). */
ipcMain.handle('fs:openPaths', async (_e, filePaths: string[]) => {
  if (!Array.isArray(filePaths) || !filePaths.length) return null;
  const files: OpenedDoc[] = [];
  for (const p of filePaths) {
    if (typeof p !== 'string' || !p.trim()) continue;
    const abs = path.resolve(p);
    if (!existsSync(abs)) {
      throw new Error(`File not found: ${abs}`);
    }
    files.push(await readDocument(abs));
  }
  console.log(
    '[onjeom] openPaths ok',
    files.map((f) => ({ name: f.name, ext: f.ext, bytes: f.byteLength })),
  );
  return files.length ? files : null;
});

ipcMain.handle(
  'dialog:saveFile',
  async (
    _e,
    opts: {
      defaultPath?: string;
      filters?: { name: string; extensions: string[] }[];
      data: ArrayBuffer | string;
      encoding?: 'binary' | 'utf8' | 'base64';
    },
  ) => {
    const result = await dialog.showSaveDialog(parentWin()!, {
      defaultPath: opts.defaultPath,
      filters: opts.filters || [{ name: 'All', extensions: ['*'] }],
    });
    if (result.canceled || !result.filePath) return null;
    if (typeof opts.data === 'string') {
      if (opts.encoding === 'base64') {
        await fs.writeFile(result.filePath, Buffer.from(opts.data, 'base64'));
      } else {
        await fs.writeFile(result.filePath, opts.data, 'utf8');
      }
    } else {
      await fs.writeFile(result.filePath, Buffer.from(new Uint8Array(opts.data)));
    }
    return result.filePath;
  },
);

ipcMain.handle('dialog:openJson', async () => {
  const result = await dialog.showOpenDialog(parentWin()!, {
    properties: ['openFile'],
    filters: [
      { name: 'JSON', extensions: ['json'] },
      { name: 'All', extensions: ['*'] },
    ],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  const text = await fs.readFile(result.filePaths[0], 'utf8');
  return { path: result.filePaths[0], text };
});

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(parentWin()!, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths[0]) return null;
  return result.filePaths[0];
});

ipcMain.handle('ann:write', async (_e, folder: string, docKey: string, json: string) => {
  await fs.mkdir(folder, { recursive: true });
  const safe = docKey.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 180);
  const filePath = path.join(folder, `${safe}.onjeom.json`);
  await fs.writeFile(filePath, json, 'utf8');
  return filePath;
});

ipcMain.handle('ann:readAll', async (_e, folder: string) => {
  if (!folder || !existsSync(folder)) return {};
  const entries = await fs.readdir(folder);
  const out: Record<string, unknown> = {};
  for (const name of entries) {
    if (!name.endsWith('.onjeom.json')) continue;
    try {
      const text = await fs.readFile(path.join(folder, name), 'utf8');
      const parsed = JSON.parse(text) as { key?: string; annotations?: unknown; data?: unknown };
      const key = parsed.key || name.replace(/\.onjeom\.json$/, '');
      out[key] = parsed.annotations ?? parsed.data ?? parsed;
    } catch {
      /* skip */
    }
  }
  return out;
});

ipcMain.handle('shell:openPath', async (_e, p: string) => shell.openPath(p));
ipcMain.handle('shell:showItem', async (_e, p: string) => {
  shell.showItemInFolder(p);
});

ipcMain.handle('app:ping', async () => ({
  ok: true,
  version: app.getVersion(),
  protocol: 'onjeom',
}));

ipcMain.handle('app:paths', async () => collectPathDiagnostics());

/**
 * Serve pdf.worker bytes to renderer if fetch fails (ultimate fallback).
 */
ipcMain.handle('app:pdfWorkerBase64', async () => {
  const dist = distDir();
  const assetsDir = path.join(dist, 'assets');
  if (!existsSync(assetsDir)) return null;
  const worker = readdirSync(assetsDir).find((f) => f.includes('pdf.worker'));
  if (!worker) return null;
  const p = resolveReadable(path.join(assetsDir, worker));
  const buf = readFileSync(p);
  console.log('[onjeom] pdfWorkerBase64', p, buf.byteLength);
  return { name: worker, base64: buf.toString('base64'), path: p, bytes: buf.byteLength };
});

app.whenReady().then(() => {
  if (!VITE_DEV_SERVER_URL) {
    registerAppProtocol();
  }
  logPaths('whenReady');
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
