import { contextBridge, ipcRenderer } from 'electron';

export type OpenedFile = {
  path: string;
  name: string;
  ext: string;
  data: string;
  isText: boolean;
  encoding: 'utf8' | 'base64';
};

type MenuChannel =
  | 'menu:open-file'
  | 'menu:export-pdf'
  | 'menu:export-json'
  | 'menu:import-json'
  | 'menu:pick-ann-folder'
  | 'menu:settings'
  | 'menu:shortcuts'
  | 'menu:undo'
  | 'menu:redo';

function onMenu(channel: MenuChannel, cb: () => void): () => void {
  const handler = () => cb();
  ipcRenderer.on(channel, handler);
  return () => {
    ipcRenderer.removeListener(channel, handler);
  };
}

const api = {
  openFile: (): Promise<OpenedFile[] | null> =>
    ipcRenderer.invoke('dialog:openFile'),
  readFile: (filePath: string): Promise<OpenedFile> =>
    ipcRenderer.invoke('fs:readFile', filePath),
  saveFile: (opts: {
    defaultPath?: string;
    filters?: { name: string; extensions: string[] }[];
    data: ArrayBuffer | string;
    encoding?: 'binary' | 'utf8' | 'base64';
  }): Promise<string | null> => ipcRenderer.invoke('dialog:saveFile', opts),
  openJson: (): Promise<{ path: string; text: string } | null> =>
    ipcRenderer.invoke('dialog:openJson'),
  pickFolder: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickFolder'),
  writeAnn: (folder: string, docKey: string, json: string): Promise<string> =>
    ipcRenderer.invoke('ann:write', folder, docKey, json),
  readAllAnn: (folder: string): Promise<Record<string, unknown>> =>
    ipcRenderer.invoke('ann:readAll', folder),
  openPath: (p: string): Promise<string> => ipcRenderer.invoke('shell:openPath', p),
  showItem: (p: string): Promise<void> => ipcRenderer.invoke('shell:showItem', p),
  ping: (): Promise<{ ok: boolean; version: string }> => ipcRenderer.invoke('app:ping'),
  onMenuOpenFile: (cb: () => void) => onMenu('menu:open-file', cb),
  onMenuExportPdf: (cb: () => void) => onMenu('menu:export-pdf', cb),
  onMenuExportJson: (cb: () => void) => onMenu('menu:export-json', cb),
  onMenuImportJson: (cb: () => void) => onMenu('menu:import-json', cb),
  onMenuPickAnnFolder: (cb: () => void) => onMenu('menu:pick-ann-folder', cb),
  onMenuSettings: (cb: () => void) => onMenu('menu:settings', cb),
  onMenuShortcuts: (cb: () => void) => onMenu('menu:shortcuts', cb),
  onMenuUndo: (cb: () => void) => onMenu('menu:undo', cb),
  onMenuRedo: (cb: () => void) => onMenu('menu:redo', cb),
  platform: process.platform as NodeJS.Platform,
};

try {
  contextBridge.exposeInMainWorld('onjeom', api);
  contextBridge.exposeInMainWorld('onjeomReady', true);
} catch (err) {
  // Last resort if contextBridge fails
  console.error('[onjeom preload] expose failed', err);
}

export type OnjeomApi = typeof api;
