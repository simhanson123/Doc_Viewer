import * as pdfjs from 'pdfjs-dist';
import type { DocumentModel, PageContent } from '@/types';
import { PAGE_W, PAGE_H } from '@/types';

// Vite-friendly worker URL
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

function resolveWorkerSrc(): string {
  let src = pdfWorkerUrl as string;
  // Absolute-ize relative URLs for file:// / asar
  if (src.startsWith('./') || src.startsWith('../') || (!src.includes('://') && !src.startsWith('/'))) {
    try {
      src = new URL(src, window.location.href).href;
    } catch {
      /* keep */
    }
  }
  // Electron: workers cannot run from inside app.asar — use unpacked path
  if (src.includes('app.asar')) {
    src = src.replace('app.asar', 'app.asar.unpacked');
  }
  return src;
}

pdfjs.GlobalWorkerOptions.workerSrc = resolveWorkerSrc();

export async function loadPdf(
  data: ArrayBuffer,
  opts: { id: string; title: string; path?: string },
): Promise<DocumentModel> {
  if (!data || data.byteLength === 0) {
    throw new Error('PDF 데이터가 비어 있습니다');
  }
  // pdf.js requires a detached copy sometimes
  const copy = data.slice(0);
  const loadingTask = pdfjs.getDocument({ data: copy });
  const pdf = await loadingTask.promise;
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
    sub: `${pdf.numPages}쪽 · PDF`,
    face: 'serif',
    path: opts.path,
    pages,
    raw: copy,
  };
}

export async function renderPdfPage(
  data: ArrayBuffer,
  pageIndex: number,
  canvas: HTMLCanvasElement,
): Promise<void> {
  const copy = data.slice(0);
  const loadingTask = pdfjs.getDocument({ data: copy });
  const pdf = await loadingTask.promise;
  const page = await pdf.getPage(pageIndex + 1);
  const unscaled = page.getViewport({ scale: 1 });
  const scale = Math.min(PAGE_W / unscaled.width, PAGE_H / unscaled.height) * 2;
  const viewport = page.getViewport({ scale });
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.style.width = `${PAGE_W}px`;
  canvas.style.height = `${PAGE_H}px`;
  await page.render({ canvasContext: ctx, viewport } as Parameters<typeof page.render>[0]).promise;
}
