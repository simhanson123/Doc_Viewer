import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import type { DocumentModel, PageContent } from '@/types';
import { PAGE_W, PAGE_H } from '@/types';

// Vite hashed worker asset (relative, e.g. ./assets/pdf.worker.min-xxx.mjs)
import pdfWorkerAsset from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

const docCache = new Map<string, Promise<PDFDocumentProxy>>();
let workerInit: Promise<string> | null = null;

function bufferFingerprint(data: ArrayBuffer | Uint8Array): string {
  const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
  // length + first/last bytes — enough for cache key of opened files
  const n = u8.byteLength;
  const a = u8[0] ?? 0;
  const b = u8[Math.min(100, n - 1)] ?? 0;
  const c = u8[Math.min(1000, n - 1)] ?? 0;
  return `${n}:${a}:${b}:${c}`;
}

/**
 * Resolve worker script into a Blob URL.
 * Order:
 *  1) fetch from same origin (onjeom://app/assets/... in production)
 *  2) fetch relative asset URL
 *  3) IPC: main process reads worker file from disk/asar and returns base64
 */
async function ensurePdfWorker(): Promise<string> {
  if (workerInit) return workerInit;
  workerInit = (async () => {
    const asset = String(pdfWorkerAsset);
    const candidates: string[] = [];

    // Production custom protocol + relative base
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

    // Main-process fallback (always works if packaging is correct)
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

async function getPdf(data: ArrayBuffer | Uint8Array): Promise<PDFDocumentProxy> {
  await ensurePdfWorker();
  const key = bufferFingerprint(data);
  let task = docCache.get(key);
  if (!task) {
    const u8 = data instanceof Uint8Array ? data : new Uint8Array(data);
    // Own a copy — pdf.js may transfer/detach the buffer
    const owned = u8.slice();
    // Verify PDF header
    const head = String.fromCharCode(owned[0], owned[1], owned[2], owned[3], owned[4]);
    if (!head.startsWith('%PDF')) {
      console.warn('[onjeom pdf] missing %PDF header, got:', head, 'bytes=', owned.byteLength);
    } else {
      console.info('[onjeom pdf] getDocument bytes=', owned.byteLength, 'header=', head);
    }

    task = pdfjs
      .getDocument({
        data: owned,
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
        console.error('[onjeom pdf] getDocument failed', err);
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
    throw new Error('PDF data is empty');
  }

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
