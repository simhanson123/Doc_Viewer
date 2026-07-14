/**
 * Cross-platform bridge: Electron desktop · Capacitor Android · browser fallback.
 */

import { arrayBufferToBase64 } from '@/lib/binary';
import { isTextExt, OPEN_ALL_DOCUMENT_EXTENSIONS } from '@/lib/textExts';

export type PlatformKind = 'electron' | 'android' | 'web';

export type PickedFile = {
  path?: string;
  name: string;
  ext: string;
  data: string | ArrayBuffer;
  isText: boolean;
  encoding?: 'utf8' | 'base64';
};

function extOf(name: string) {
  const e = name.split('.').pop()?.toLowerCase() || '';
  return e === 'markdown' ? 'md' : e;
}

export function detectPlatform(): PlatformKind {
  if (typeof window !== 'undefined' && window.onjeom) return 'electron';
  const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean; getPlatform?: () => string } })
    .Capacitor;
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.() || '';
    if (p === 'android' || p === 'ios') return 'android';
  }
  return 'web';
}

export function isDesktop() {
  return detectPlatform() === 'electron';
}

export function isAndroid() {
  return detectPlatform() === 'android';
}

export function isTouchPrimary() {
  return (
    isAndroid() ||
    (typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches)
  );
}

/** Open one or more documents. Always prefers Electron native dialog when bridge is up. */
export async function platformOpenFiles(): Promise<PickedFile[] | null> {
  // Probe bridge
  if (window.onjeom?.openFile) {
    try {
      if (window.onjeom.ping) {
        await window.onjeom.ping();
      }
      const raw = await window.onjeom.openFile();
      if (!raw) return null;
      const list = Array.isArray(raw) ? raw : [raw];
      return list.map((f) => ({
        path: f.path,
        name: f.name,
        ext: f.ext,
        data: f.data,
        isText: f.isText,
        encoding: f.encoding || (f.isText ? 'utf8' : 'base64'),
      }));
    } catch (e) {
      console.error('[onjeom] native openFile failed, falling back to input', e);
      // fall through to HTML picker
    }
  }
  return pickViaInput(true);
}

async function pickViaInput(multiple: boolean): Promise<PickedFile[] | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = multiple;
    input.accept = [
      ...OPEN_ALL_DOCUMENT_EXTENSIONS.map((e) => `.${e}`),
      'application/pdf',
      'application/epub+zip',
      'text/plain',
      'text/markdown',
      'text/*',
    ].join(',');
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    document.body.appendChild(input);

    let settled = false;
    const finish = (value: PickedFile[] | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.onchange = async () => {
      const list = input.files;
      if (!list?.length) {
        finish(null);
        return;
      }
      try {
        const out: PickedFile[] = [];
        for (const file of Array.from(list)) {
          const ext = extOf(file.name);
          // Always read raw bytes → base64 so encoding detection works for
          // ASCII / UTF-8 / EUC-KR / Shift_JIS / etc. (same path as Electron IPC)
          const buf = await file.arrayBuffer();
          out.push({
            name: file.name,
            ext,
            data: arrayBufferToBase64(buf),
            isText: isTextExt(ext),
            encoding: 'base64',
          });
        }
        finish(out);
      } catch (e) {
        console.error(e);
        finish(null);
      }
    };

    // Cancel detection (best-effort)
    window.addEventListener(
      'focus',
      () => {
        window.setTimeout(() => {
          if (!settled && !input.files?.length) finish(null);
        }, 500);
      },
      { once: true },
    );

    input.click();
  });
}

export async function platformSaveBinary(
  data: ArrayBuffer | Uint8Array,
  filename: string,
  mime: string,
  filters?: { name: string; extensions: string[] }[],
): Promise<'saved' | 'shared' | 'downloaded' | 'cancelled'> {
  const buf = data instanceof Uint8Array ? data : new Uint8Array(data);

  if (window.onjeom?.saveFile) {
    const copy = new Uint8Array(buf.byteLength);
    copy.set(buf);
    const b64 = arrayBufferToBase64(copy.buffer);
    const path = await window.onjeom.saveFile({
      defaultPath: filename,
      filters: filters || [{ name: 'File', extensions: ['*'] }],
      data: b64,
      encoding: 'base64',
    });
    return path ? 'saved' : 'cancelled';
  }

  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const { Share } = await import('@capacitor/share');
      const copy = new Uint8Array(buf.byteLength);
      copy.set(buf);
      const b64 = arrayBufferToBase64(copy.buffer);
      const written = await Filesystem.writeFile({
        path: filename,
        data: b64,
        directory: Directory.Cache,
      });
      try {
        await Share.share({
          title: filename,
          url: written.uri,
          dialogTitle: '내보내기',
        });
        return 'shared';
      } catch {
        return 'saved';
      }
    }
  } catch {
    /* browser */
  }

  downloadBytes(buf, filename, mime);
  return 'downloaded';
}

export async function platformSaveText(
  text: string,
  filename: string,
  mime = 'application/json',
): Promise<'saved' | 'shared' | 'downloaded' | 'cancelled'> {
  if (window.onjeom?.saveFile) {
    const path = await window.onjeom.saveFile({
      defaultPath: filename,
      filters: [{ name: 'Text', extensions: [filename.split('.').pop() || 'txt'] }],
      data: text,
      encoding: 'utf8',
    });
    return path ? 'saved' : 'cancelled';
  }
  const enc = new TextEncoder().encode(text);
  return platformSaveBinary(enc, filename, mime);
}

export async function platformPickFolder(): Promise<string | null> {
  if (window.onjeom?.pickFolder) return window.onjeom.pickFolder();
  return null;
}

export async function platformWriteAnn(folder: string, key: string, json: string) {
  if (window.onjeom?.writeAnn) return window.onjeom.writeAnn(folder, key, json);
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const safe = key.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '_').slice(0, 180);
      await Filesystem.mkdir({
        path: 'onjeom-ann',
        directory: Directory.Data,
        recursive: true,
      }).catch(() => undefined);
      await Filesystem.writeFile({
        path: `onjeom-ann/${safe}.onjeom.json`,
        data: btoa(unescape(encodeURIComponent(json))),
        directory: Directory.Data,
      });
      return `onjeom-ann/${safe}.onjeom.json`;
    }
  } catch (e) {
    console.warn('ann write failed', e);
  }
  return null;
}

export async function platformReadAllAnn(folder: string | null): Promise<Record<string, unknown>> {
  if (folder && window.onjeom?.readAllAnn) return window.onjeom.readAllAnn(folder);
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');
      const out: Record<string, unknown> = {};
      try {
        const dir = await Filesystem.readdir({ path: 'onjeom-ann', directory: Directory.Data });
        for (const f of dir.files) {
          if (!f.name.endsWith('.onjeom.json')) continue;
          const file = await Filesystem.readFile({
            path: `onjeom-ann/${f.name}`,
            directory: Directory.Data,
          });
          const text =
            typeof file.data === 'string'
              ? decodeURIComponent(escape(atob(file.data)))
              : '';
          try {
            const parsed = JSON.parse(text) as { key?: string; annotations?: unknown };
            const key = parsed.key || f.name.replace(/\.onjeom\.json$/, '');
            out[key] = parsed.annotations ?? parsed;
          } catch {
            /* skip */
          }
        }
      } catch {
        /* no dir */
      }
      return out;
    }
  } catch {
    /* ignore */
  }
  return {};
}

export async function platformOpenJson(): Promise<string | null> {
  if (window.onjeom?.openJson) {
    const r = await window.onjeom.openJson();
    return r?.text ?? null;
  }
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,application/json';
    input.onchange = async () => {
      const f = input.files?.[0];
      resolve(f ? await f.text() : null);
    };
    input.click();
  });
}

export async function initNativeChrome(themeBg: string) {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (!Capacitor.isNativePlatform()) return;
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    const dark = isDarkHex(themeBg);
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: themeBg }).catch(() => undefined);
  } catch {
    /* optional */
  }
}

function isDarkHex(hex: string) {
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 < 128;
}

function downloadBytes(u8: Uint8Array, filename: string, mime: string) {
  const copy = new Uint8Array(u8.byteLength);
  copy.set(u8);
  const blob = new Blob([copy.buffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
