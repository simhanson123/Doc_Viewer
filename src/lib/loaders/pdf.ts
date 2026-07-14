import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentModel, PageContent } from '@/types';
import { PAGE_W, PAGE_H } from '@/types';

// Vite emits a hashed asset URL for the worker
import pdfWorkerAsset from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const docCache = new WeakMap<ArrayBuffer, Promise<PDFDocumentProxy>>();
let workerInit: Promise<void> | null = null;

function toFileUrl(absolutePath: string): string {
  // Windows path → file:///C:/...
  const normalized = absolutePath.replace(/\\/g, '/');
  if (/^[a-zA-Z]:\//.test(normalized)) {
    return 'file:///' + normalized;
  }
  if (normalized.startsWith('/')) return 'file://' + normalized;
  return normalized;
}

function candidateWorkerUrls(): string[] {
  const out: string[] = [];
  const asset = String(pdfWorkerAsset);

  // 1) Resolve relative to current page (index.html)
  try {
    const fromPage = new URL(asset, window.location.href).href;
    out.push(fromPage);
    if (fromPage.includes('app.asar')) {
      out.push(fromPage.replace(/app\.asar/g, 'app.asar.unpacked'));
    }
  } catch {
    /* ignore */
  }

  // 2) Resolve relative to this module (bundled chunk)
  try {
    const fromMod = new URL(asset, import.meta.url).href;
    out.push(fromMod);
    if (fromMod.includes('app.asar')) {
      out.push(fromMod.replace(/app\.asar/g, 'app.asar.unpacked'));
    }
  } catch {
    /* ignore */
  }

  // 3) Bare asset path next to index
  if (!asset.includes('://')) {
    out.push(asset.startsWith('./') ? asset : `./${asset.replace(/^\//, '')}`);
  }

  return [...new Set(out)];
}

/**
 * Load worker as Blob URL so Electron can run it even when file:// / asar is picky.
 */
async function ensurePdfWorker(): Promise<void> {
  if (workerInit) return workerInit;
  workerInit = (async () => {
    const urls = candidateWorkerUrls();
    let lastErr: unknown;
    for (const url of urls) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(
          new Blob([blob], { type: 'text/javascript' }),
        );
        pdfjs.GlobalWorkerOptions.workerSrc = blobUrl;
        console.info('[onjeom pdf] worker ready via', url);
        return;
      } catch (e) {
        lastErr = e;
        console.warn('[onjeom pdf] worker candidate failed', url, e);
      }
    }

    // Last resort: point workerSrc at first candidate (may still work in some builds)
    if (urls[0]) {
      pdfjs.GlobalWorkerOptions.workerSrc = urls[0].includes('app.asar')
        ? urls[0].replace(/app\.asar/g, 'app.asar.unpacked')
        : urls[0];
      console.warn('[onjeom pdf] falling back to direct workerSrc', pdfjs.GlobalWorkerOptions.workerSrc, lastErr);
      return;
    }
    throw new Error(
      'PDF worker를 불러오지 못했습니다. 앱을 다시 설치하거나 개발자 도구 콘솔을 확인하세요.',
    );
  })();
  return workerInit;
}

function asBuffer(data: ArrayBuffer | Uint8Array): Uint8Array {
  if (data instanceof Uint8Array) return data;
  return new Uint8Array(data);
}

function bufferKey(data: ArrayBuffer | Uint8Array): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  // Copy so we own a stable ArrayBuffer for WeakMap
  const copy = new Uint8Array(data.byteLength);
  copy.set(data);
  return copy.buffer;
}

async function getPdf(data: ArrayBuffer | Uint8Array): Promise<PDFDocumentProxy> {
  await ensurePdfWorker();
  const key = bufferKey(data);
  let task = docCache.get(key);
  if (!task) {
    const bytes = asBuffer(data);
    // pdf.js wants a fresh copy it can transfer
    const owned = bytes.slice().buffer;
    task = pdfjs
      .getDocument({
        data: owned,
        useSystemFonts: true,
        isEvalSupported: false,
        // Disable range/stream for local buffers
        disableAutoFetch: true,
        disableStream: true,
      })
      .promise.catch((err) => {
        docCache.delete(key);
        throw err;
      });
    docCache.set(key, task);
  }
  return task;
}

export async function loadPdf(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string },
): Promise<DocumentModel> {
  if (!data || data.byteLength === 0) {
    throw new Error('PDF data is empty / PDF 데이터가 비어 있습니다');
  }

  // Always own a copy so React state holds stable bytes
  const owned = data.slice(0);
  const pdf = await getPdf(owned);
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
    sub: `${pdf.numPages} pages · PDF`,
    face: 'serif',
    path: opts.path,
    pages,
    // Store as ArrayBuffer for renderers
    raw: owned,
  };
}

export async function renderPdfPage(
  data: ArrayBuffer | Uint8Array,
  pageIndex: number,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const pdf = await getPdf(data);
  const page = await pdf.getPage(pageIndex + 1);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = Math.min(PAGE_W / unscaled.width, PAGE_H / unscaled.height) * 2;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  canvas.width = Math.floor(viewport.width);
  canvas.height = Math.floor(viewport.height);
  // Display size matches page slot
  canvas.style.width = `${PAGE_W}px`;
  canvas.style.height = `${PAGE_H}px`;
  canvas.style.display = 'block';

  // White background so "blank" never looks broken
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderTask = page.render({
    canvasContext: ctx,
    viewport,
    canvas,
  } as Parameters<typeof page.render>[0]);

  await renderTask.promise;
}

// silence unused helper if tree-shaken differently
void toFileUrl;
