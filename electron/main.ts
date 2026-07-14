import { app, BrowserWindow, dialog, ipcMain, shell, Menu } from 'electron';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** App root: project root in dev, asar root when packaged. */
function appRoot() {
  // dist-electron/ sits next to dist/ and package.json
  return path.join(__dirname, '..');
}

function distDir() {
  return path.join(appRoot(), 'dist');
}

function preloadPath() {
  // Prefer CJS preload (contextBridge-friendly); fall back to .mjs
  const cjs = path.join(__dirname, 'preload.cjs');
  const mjs = path.join(__dirname, 'preload.mjs');
  const js = path.join(__dirname, 'preload.js');
  if (existsSync(cjs)) return cjs;
  if (existsSync(js)) return js;
  return mjs;
}

let mainWindow: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function send(channel: string, ...args: unknown[]) {
  mainWindow?.webContents.send(channel, ...args);
}

function createWindow() {
  const preload = preloadPath();
  console.log('[onjeom] preload:', preload);
  console.log('[onjeom] dist:', distDir());

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
      // Needed so pdf.js worker / assets load reliably from asar/file://
      webSecurity: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow?.show());

  mainWindow.webContents.on('did-fail-load', (_e, code, desc, url) => {
    console.error('[onjeom] did-fail-load', code, desc, url);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    // DevTools in dev only
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    const indexHtml = path.join(distDir(), 'index.html');
    if (!existsSync(indexHtml)) {
      dialog.showErrorBox(
        '온점',
        `UI 파일을 찾을 수 없습니다:\n${indexHtml}\n\n앱을 다시 빌드해 주세요.`,
      );
    }
    mainWindow.loadFile(indexHtml);
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
        {
          label: '실행 취소',
          accelerator: 'CmdOrCtrl+Z',
          click: () => send('menu:undo'),
        },
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
        {
          label: '설정',
          accelerator: 'CmdOrCtrl+,',
          click: () => send('menu:settings'),
        },
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
        { role: 'togglefullscreen', label: '전체 화면 (시스템)' },
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
            dialog.showMessageBox(mainWindow!, {
              type: 'info',
              title: '온점',
              message: '온점 (Onjeom) v0.3',
              detail:
                'Multi-format document viewer with freehand annotation.\nMD · PDF · EPUB · DOCX\n\nMIT License',
            });
          },
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

const OPEN_FILTERS: Electron.FileFilter[] = [
  {
    name: 'Documents',
    extensions: ['md', 'markdown', 'txt', 'pdf', 'epub', 'docx'],
  },
  { name: 'Markdown', extensions: ['md', 'markdown'] },
  { name: 'PDF', extensions: ['pdf'] },
  { name: 'EPUB', extensions: ['epub'] },
  { name: 'Word', extensions: ['docx'] },
  { name: 'Text', extensions: ['txt'] },
  { name: 'All Files', extensions: ['*'] },
];

export type OpenedDoc = {
  path: string;
  name: string;
  ext: string;
  /** utf8 text OR base64 for binary — reliable over IPC/contextBridge */
  data: string;
  isText: boolean;
  encoding: 'utf8' | 'base64';
};

async function readDocument(filePath: string): Promise<OpenedDoc> {
  const extRaw = path.extname(filePath).toLowerCase().replace('.', '');
  const ext = extRaw === 'markdown' ? 'md' : extRaw;
  const name = path.basename(filePath);
  const buffer = await fs.readFile(filePath);
  const textExts = new Set(['md', 'markdown', 'txt', 'html', 'htm']);
  const isText = textExts.has(extRaw) || textExts.has(ext);
  if (isText) {
    return {
      path: filePath,
      name,
      ext,
      data: buffer.toString('utf8'),
      isText: true,
      encoding: 'utf8',
    };
  }
  return {
    path: filePath,
    name,
    ext,
    data: buffer.toString('base64'),
    isText: false,
    encoding: 'base64',
  };
}

function parentWin(): BrowserWindow | undefined {
  return mainWindow && !mainWindow.isDestroyed() ? mainWindow : undefined;
}

ipcMain.handle('dialog:openFile', async () => {
  try {
    const result = await dialog.showOpenDialog(parentWin()!, {
      title: '문서 열기',
      properties: ['openFile', 'multiSelections'],
      filters: OPEN_FILTERS,
    });
    if (result.canceled || !result.filePaths.length) return null;
    const files: OpenedDoc[] = [];
    for (const p of result.filePaths) {
      files.push(await readDocument(p));
    }
    // Always return array for stable renderer handling
    return files;
  } catch (err) {
    console.error('[onjeom] openFile failed', err);
    throw err instanceof Error ? err : new Error(String(err));
  }
});

ipcMain.handle('fs:readFile', async (_e, filePath: string) => {
  return readDocument(filePath);
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

// Tell renderer whether preload bridge is healthy
ipcMain.handle('app:ping', async () => ({ ok: true, version: app.getVersion() }));

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
