import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentModel, PageContent } from '@/types';
import { PAGE_W, PAGE_H } from '@/types';

// Vite hashed worker asset (relative, e.g. ./assets/pdf.worker.min-xxx.mjs)
import pdfWorkerAsset from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
let workerInit: Promise<string> | null = null;

/** Thrown when PDF needs a password or the password is wrong. */
export class PdfPasswordError extends Error {
  readonly kind: 'need' | 'incorrect';

  constructor(kind: 'need' | 'incorrect', message?: string) {
    super(
      message ||
        (kind === 'incorrect' ? 'Incorrect PDF password' : 'Password required for this PDF'),
    );
    this.name = 'PdfPasswordError';
    this.kind = kind;
  }
}

export function isPdfPasswordError(e: unknown): e is PdfPasswordError {
  return e instanceof PdfPasswordError || (e as { name?: string })?.name === 'PdfPasswordError';
}

function bufferFingerprint(data: ArrayBuffer | Uint8Array, password?: string): string {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  const n = u8.byteLength;
  const a = u8[0] ?? 0;
  const b = u8[Math.min(100, n - 1)] ?? 0;
  const c = u8[Math.min(1000, n - 1)] ?? 0;
  // Include password in cache key so wrong/right passwords don't collide
  const p = password ? `:p${password.length}:${simpleHash(password)}` : '';
  return `${n}:${a}:${b}:${c}${p}`;
}

function simpleHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

/**
 * Resolve worker script into a Blob URL.
 */
async function ensurePdfWorker(): Promise<string> {
  if (workerInit) return workerInit;
  workerInit = (async () => {
    const asset = String(pdfWorkerAsset);
    const candidates: string[] = [];

    try {
      candidates.push(new URL(asset, window.location.href).href);
    } catch {
      /* ignore */
    }
    try {
      candidates.push(new URL(asset, import.meta.url).href);
    } catch {
      /* ignore */
    }
    if (asset.startsWith('./') || asset.startsWith('../') || asset.startsWith('assets/')) {
      candidates.push(asset);
    }

    console.info('[onjeom pdf] worker candidates', candidates, 'location=', window.location.href);

    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: 'force-cache' });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const text = await res.text();
        if (text.length < 1000) throw new Error('worker too small');
        const blobUrl = URL.createObjectURL(
          new Blob([text], { type: 'text/javascript' }),
        );
        pdfjs.GlobalWorkerOptions.workerSrc = blobUrl;
        console.info('[onjeom pdf] worker OK via fetch', url, 'chars=', text.length);
        return blobUrl;
      } catch (e) {
        console.warn('[onjeom pdf] fetch worker failed', url, e);
      }
    }

    if (window.onjeom?.pdfWorkerBase64) {
      const packed = await window.onjeom.pdfWorkerBase64();
      if (packed?.base64) {
        const binary = atob(packed.base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blobUrl = URL.createObjectURL(
          new Blob([bytes], { type: 'text/javascript' }),
        );
        pdfjs.GlobalWorkerOptions.workerSrc = blobUrl;
        console.info(
          '[onjeom pdf] worker OK via IPC',
          packed.path,
          'bytes=',
          packed.bytes,
        );
        return blobUrl;
      }
    }

    throw new Error(
      'PDF worker load failed. Help → 경로 진단… 을 확인해 주세요 / Check Help → Path diagnostics',
    );
  })();
  return workerInit;
}

function asPasswordError(err: unknown): PdfPasswordError | null {
  if (!err || typeof err !== 'object') return null;
  const e = err as { name?: string; code?: number; message?: string };
  // pdf.js PasswordException: name PasswordException, code NEED_PASSWORD=1 / INCORRECT=2
  const isPwd =
    e.name === 'PasswordException' ||
    e.name === 'PdfPasswordError' ||
    /password/i.test(e.message || '');
  if (!isPwd && e.code !== 1 && e.code !== 2) return null;
  // PasswordResponses.INCORRECT_PASSWORD === 2
  if (e.code === 2 || /incorrect/i.test(e.message || '')) {
    return new PdfPasswordError('incorrect', e.message);
  }
  return new PdfPasswordError('need', e.message);
}

export async function getPdf(
  data: ArrayBuffer | Uint8Array,
  password?: string,
): Promise<PDFDocumentProxy> {
  await ensurePdfWorker();
  const key = bufferFingerprint(data, password);
  let task = docCache.get(key);
  if (!task) {
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    const owned = u8.slice();
    const head = String.fromCharCode(owned[0], owned[1], owned[2], owned[3], owned[4]);
    if (!head.startsWith('%PDF')) {
      console.warn('[onjeom pdf] missing %PDF header, got:', head, 'bytes=', owned.byteLength);
    } else {
      console.info(
        '[onjeom pdf] getDocument bytes=',
        owned.byteLength,
        'header=',
        head,
        'password=',
        password ? '(set)' : '(none)',
      );
    }

    task = pdfjs
      .getDocument({
        data: owned,
        password: password || undefined,
        useSystemFonts: true,
        isEvalSupported: false,
        disableAutoFetch: true,
        disableStream: true,
        disableRange: true,
      })
      .promise.then((pdf) => {
        console.info('[onjeom pdf] loaded pages=', pdf.numPages);
        return pdf;
      })
      .catch((err) => {
        docCache.delete(key);
        const pwdErr = asPasswordError(err);
        if (pwdErr) {
          console.warn('[onjeom pdf] password required/incorrect', pwdErr.kind);
          throw pwdErr;
        }
        console.error('[onjeom pdf] getDocument failed', err);
        throw err;
      });
    docCache.set(key, task);
  }
  return task;
}

export async function loadPdf(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string; password?: string },
): Promise<DocumentModel> {
  if (!data || data.byteLength === 0) {
    throw new Error('PDF data is empty');
  }

  const owned = data.slice(0);
  const pdf = await getPdf(owned, opts.password);
  const pages: PageContent[] = [];
  for (let i = 0; i < pdf.numPages; i++) {
    pages.push({ kind: 'pdf', pageIndex: i });
  }

  let title = opts.title;
  try {
    const meta = await pdf.getMetadata();
    const info = meta?.info as { Title?: string } | undefined;
    if (info?.Title?.trim()) title = info.Title.trim();
  } catch {
    /* ignore */
  }

  return {
    id: opts.id,
    fmt: 'PDF',
    title,
    sub: `${pdf.numPages} pages · PDF${opts.password ? ' · 🔒' : ''}`,
    face: 'serif',
    path: opts.path,
    pages,
    raw: owned,
    // Keep password only in memory for subsequent page renders
    pdfPassword: opts.password,
  };
}

export async function renderPdfPage(
  data: ArrayBuffer | Uint8Array,
  pageIndex: number,
  canvas: HTMLCanvasElement,
  password?: string,
): Promise<void> {
  const pdf = await getPdf(data, password);
  const page = await pdf.getPage(pageIndex + 1);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = Math.min(PAGE_W / unscaled.width, PAGE_H / unscaled.height) * 2;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D unavailable');

  const w = Math.max(1, Math.floor(viewport.width));
  const h = Math.max(1, Math.floor(viewport.height));
  canvas.width = w;
  canvas.height = h;
  canvas.style.width = `${PAGE_W}px`;
  canvas.style.height = `${PAGE_H}px`;
  canvas.style.display = 'block';
  canvas.style.background = '#fff';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, w, h);

  await page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as Parameters<typeof page.render>[0]).promise;

  console.info('[onjeom pdf] rendered page', pageIndex + 1, `${w}x${h}`);
}
