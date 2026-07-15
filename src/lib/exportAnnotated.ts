import { jsPDF } from 'jspdf';
import type { DocAnn, DocumentModel, PageAnn, ThemeTokens } from '@/types';
import { PAGE_H, PAGE_W } from '@/types';
import { pressureStrokePath } from '@/lib/geometry';
import type { PressureCurve } from '@/lib/pressure';
import { renderPdfPage } from '@/lib/loaders/pdf';

function emptyPage(): PageAnn {
  return { strokes: [], shapes: [], notes: [] };
}

function drawInk(
  ctx: CanvasRenderingContext2D,
  ann: PageAnn,
  scale: number,
  curve: PressureCurve,
) {
  ctx.save();
  ctx.scale(scale, scale);

  for (const st of ann.strokes || []) {
    if (st.pressure && st.tool === 'pen') {
      const d = pressureStrokePath(st.pts, st.w, curve);
      const p = new Path2D(d);
      ctx.fillStyle = st.c;
      ctx.globalAlpha = 0.95;
      ctx.fill(p);
      ctx.globalAlpha = 1;
    } else {
      ctx.beginPath();
      const pts = st.pts;
      if (!pts.length) continue;
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
      ctx.strokeStyle = st.c;
      ctx.lineWidth = st.w;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (st.tool === 'hl') {
        ctx.globalAlpha = 0.45;
        ctx.globalCompositeOperation = 'multiply';
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
  }

  for (const sh of ann.shapes || []) {
    drawShapeCanvas(ctx, sh);
  }

  for (const n of ann.notes || []) {
    ctx.fillStyle = n.color || '#FBE9A0';
    ctx.shadowColor = 'rgba(80,60,10,0.25)';
    ctx.shadowBlur = 8;
    ctx.fillRect(n.x, n.y, 174, 150);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#4A3F1E';
    ctx.font = '12px "Noto Sans KR", sans-serif';
    wrapText(ctx, n.text || '', n.x + 10, n.y + 28, 154, 16);
  }

  ctx.restore();
}

function drawShapeCanvas(
  ctx: CanvasRenderingContext2D,
  sh: { shape: string; x0: number; y0: number; x1: number; y1: number; c: string; w?: number },
) {
  ctx.strokeStyle = sh.c;
  ctx.lineWidth = sh.w ?? 2.2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (sh.shape === 'rect') {
    const a = Math.min(sh.x0, sh.x1);
    const b = Math.min(sh.y0, sh.y1);
    ctx.strokeRect(a, b, Math.abs(sh.x1 - sh.x0), Math.abs(sh.y1 - sh.y0));
  } else if (sh.shape === 'ellipse') {
    const cx = (sh.x0 + sh.x1) / 2;
    const cy = (sh.y0 + sh.y1) / 2;
    const rx = Math.max(1, Math.abs(sh.x1 - sh.x0) / 2);
    const ry = Math.max(1, Math.abs(sh.y1 - sh.y0) / 2);
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    // line / arrow
    ctx.beginPath();
    ctx.moveTo(sh.x0, sh.y0);
    ctx.lineTo(sh.x1, sh.y1);
    ctx.stroke();
    if (sh.shape === 'arrow') {
      const ang = Math.atan2(sh.y1 - sh.y0, sh.x1 - sh.x0);
      const L = 12;
      ctx.beginPath();
      ctx.moveTo(sh.x1, sh.y1);
      ctx.lineTo(sh.x1 - L * Math.cos(ang - 0.45), sh.y1 - L * Math.sin(ang - 0.45));
      ctx.moveTo(sh.x1, sh.y1);
      ctx.lineTo(sh.x1 - L * Math.cos(ang + 0.45), sh.y1 - L * Math.sin(ang + 0.45));
      ctx.stroke();
    }
  }
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxW: number,
  lh: number,
) {
  const chars = text.split('');
  let line = '';
  let yy = y;
  for (const ch of chars) {
    const test = line + ch;
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, yy);
      line = ch;
      yy += lh;
      if (yy > y + 110) break;
    } else line = test;
  }
  if (line) ctx.fillText(line, x, yy);
}

function blockText(doc: DocumentModel, pageIndex: number): string[] {
  const page = doc.pages[pageIndex];
  if (!page || page.kind !== 'blocks') return [];
  const lines: string[] = [];
  for (const b of page.blocks) {
    if (b.k === 'h1' || b.k === 'h2' || b.k === 'meta') lines.push(b.t);
    else if (b.k === 'code') lines.push(...b.t.split('\n'));
    else if (b.k === 'p' || b.k === 'q') lines.push(b.sents.join(' '));
    else if (b.k === 'hr') lines.push('—');
  }
  return lines;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  if (h.length < 6) return [50, 40, 30];
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}

/** Vector ink drawn into jsPDF (no raster). */
function drawInkVector(
  pdf: jsPDF,
  ann: PageAnn,
  curve: PressureCurve,
) {
  for (const st of ann.strokes || []) {
    const [r, g, b] = hexToRgb(st.c);
    if (st.pressure && st.tool === 'pen' && st.pts.length) {
      // approximate variable width as polyline segments with varying width
      for (let i = 1; i < st.pts.length; i++) {
        const a = st.pts[i - 1];
        const c = st.pts[i];
        const p = ((a.p ?? 0.5) + (c.p ?? 0.5)) / 2;
        const w = Math.max(0.6, st.w * (0.3 + p * 1.0));
        pdf.setDrawColor(r, g, b);
        pdf.setLineWidth(w);
        pdf.setLineCap(1);
        pdf.line(a.x, a.y, c.x, c.y);
      }
    } else if (st.pts.length) {
      pdf.setDrawColor(r, g, b);
      // highlighter: wider semi-opaque-ish stroke (jspdf has limited opacity on all builds)
      pdf.setLineWidth(st.tool === 'hl' ? Math.max(st.w, 12) : st.w);
      pdf.setLineCap(1);
      for (let i = 1; i < st.pts.length; i++) {
        pdf.line(st.pts[i - 1].x, st.pts[i - 1].y, st.pts[i].x, st.pts[i].y);
      }
    }
  }

  for (const sh of ann.shapes || []) {
    const [r, g, b] = hexToRgb(sh.c);
    pdf.setDrawColor(r, g, b);
    pdf.setLineWidth(sh.w ?? 2.2);
    if (sh.shape === 'rect') {
      const x = Math.min(sh.x0, sh.x1);
      const y = Math.min(sh.y0, sh.y1);
      pdf.rect(x, y, Math.abs(sh.x1 - sh.x0), Math.abs(sh.y1 - sh.y0));
    } else if (sh.shape === 'ellipse') {
      const cx = (sh.x0 + sh.x1) / 2;
      const cy = (sh.y0 + sh.y1) / 2;
      const rx = Math.max(1, Math.abs(sh.x1 - sh.x0) / 2);
      const ry = Math.max(1, Math.abs(sh.y1 - sh.y0) / 2);
      pdf.ellipse(cx, cy, rx, ry);
    } else {
      pdf.line(sh.x0, sh.y0, sh.x1, sh.y1);
      if (sh.shape === 'arrow') {
        const ang = Math.atan2(sh.y1 - sh.y0, sh.x1 - sh.x0);
        const L = 12;
        pdf.line(
          sh.x1,
          sh.y1,
          sh.x1 - L * Math.cos(ang - 0.45),
          sh.y1 - L * Math.sin(ang - 0.45),
        );
        pdf.line(
          sh.x1,
          sh.y1,
          sh.x1 - L * Math.cos(ang + 0.45),
          sh.y1 - L * Math.sin(ang + 0.45),
        );
      }
    }
  }

  for (const n of ann.notes || []) {
    const [r, g, b] = hexToRgb(n.color || '#FBE9A0');
    pdf.setFillColor(r, g, b);
    pdf.rect(n.x, n.y, 174, 150, 'F');
    pdf.setTextColor(74, 63, 30);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(n.text || '', 154);
    pdf.text(lines.slice(0, 10), n.x + 10, n.y + 22);
  }
}

function drawTextVector(pdf: jsPDF, doc: DocumentModel, pageIndex: number, theme: ThemeTokens) {
  const [ir, ig, ib] = hexToRgb(theme.ink);
  const [mr, mg, mb] = hexToRgb(theme.muted);
  pdf.setTextColor(ir, ig, ib);
  let y = 54;
  const maxW = PAGE_W - 100;
  const page = doc.pages[pageIndex];
  if (!page || page.kind !== 'blocks') {
    pdf.setFontSize(11);
    pdf.text(`(페이지 ${pageIndex + 1})`, 50, y);
    return;
  }
  for (const b of page.blocks) {
    if (y > PAGE_H - 48) break;
    if (b.k === 'h1') {
      pdf.setFontSize(18);
      pdf.setTextColor(ir, ig, ib);
      const lines = pdf.splitTextToSize(b.t, maxW);
      pdf.text(lines, 50, y);
      y += lines.length * 22 + 8;
    } else if (b.k === 'h2') {
      pdf.setFontSize(13);
      const lines = pdf.splitTextToSize(b.t, maxW);
      pdf.text(lines, 50, y);
      y += lines.length * 18 + 6;
    } else if (b.k === 'meta') {
      pdf.setFontSize(9);
      pdf.setTextColor(mr, mg, mb);
      pdf.text(b.t, 50, y);
      y += 16;
      pdf.setTextColor(ir, ig, ib);
    } else if (b.k === 'code') {
      pdf.setFontSize(8);
      pdf.setFillColor(240, 235, 220);
      const lines = b.t.split('\n').slice(0, 12);
      pdf.rect(48, y - 10, maxW + 8, lines.length * 11 + 12, 'F');
      pdf.text(lines, 52, y);
      y += lines.length * 11 + 16;
    } else if (b.k === 'p' || b.k === 'q') {
      pdf.setFontSize(b.k === 'q' ? 10 : 11);
      if (b.k === 'q') pdf.setTextColor(mr, mg, mb);
      const text = b.sents.join(' ');
      const lines = pdf.splitTextToSize(text, maxW);
      pdf.text(lines, 50, y);
      y += lines.length * 15 + 10;
      pdf.setTextColor(ir, ig, ib);
    } else if (b.k === 'hr') {
      pdf.setDrawColor(200, 190, 170);
      pdf.line(50, y, PAGE_W - 50, y);
      y += 14;
    }
  }
}

/** True if document text needs fonts beyond Latin-1 (CJK, Hangul, Arabic, …). */
function documentNeedsUnicodeFont(doc: DocumentModel): boolean {
  const nonLatin = /[^\u0000-\u024F\u1E00-\u1EFF\s]/;
  for (const page of doc.pages) {
    if (page.kind !== 'blocks') continue;
    for (const b of page.blocks) {
      const t =
        b.k === 'p' || b.k === 'q'
          ? b.sents.join('')
          : b.k === 'h1' || b.k === 'h2' || b.k === 'meta' || b.k === 'code' || b.k === 'img'
            ? b.t
            : '';
      if (t && nonLatin.test(t)) return true;
    }
  }
  if (doc.title && nonLatin.test(doc.title)) return true;
  return false;
}

/** Wrap for CJK + Latin (char-based, not only whitespace). */
function wrapCanvasLine(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxW: number,
): string[] {
  const lines: string[] = [];
  let cur = '';
  for (const ch of text) {
    const test = cur + ch;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = ch;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);
  return lines.length ? lines : [''];
}

const EXPORT_FONT_STACK =
  '"Noto Sans KR", "Noto Sans JP", "Noto Sans SC", "Noto Sans TC", "Noto Sans Arabic", "Noto Sans", "Malgun Gothic", "Apple SD Gothic Neo", sans-serif';

async function renderPageCanvas(
  doc: DocumentModel,
  pageIndex: number,
  ann: PageAnn,
  theme: ThemeTokens,
  curve: PressureCurve,
  scale = 2,
): Promise<HTMLCanvasElement> {
  const canvas = document.createElement('canvas');
  canvas.width = PAGE_W * scale;
  canvas.height = PAGE_H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = theme.paper;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Prefer on-screen page canvas if present (includes PDF + live layout)
  const live = document.querySelector(
    `[data-page-export="${doc.id}-${pageIndex}"] canvas`,
  ) as HTMLCanvasElement | null;
  const liveBody = document.querySelector(
    `[data-page-export="${doc.id}-${pageIndex}"] .page-content`,
  ) as HTMLElement | null;

  const page = doc.pages[pageIndex];
  let pdfDrawn = false;

  if (live && live.width > 0 && liveBody?.getAttribute('data-page-kind') === 'pdf') {
    ctx.drawImage(live, 0, 0, canvas.width, canvas.height);
    pdfDrawn = true;
  } else if (page?.kind === 'pdf' && doc.raw && typeof doc.raw !== 'string') {
    // Off-screen render: pages not currently mounted in the DOM
    // (otherwise every non-visible PDF page exports blank)
    try {
      const tmp = document.createElement('canvas');
      await renderPdfPage(doc.raw, page.pageIndex, tmp, doc.pdfPassword);
      ctx.drawImage(tmp, 0, 0, canvas.width, canvas.height);
      pdfDrawn = true;
    } catch (e) {
      console.warn('[onjeom export] offscreen PDF render failed, page', pageIndex + 1, e);
    }
  }

  if (!pdfDrawn) {
    // Draw structured blocks with Unicode-capable fonts (fixes MD/HTML/DOCX Hangul garble)
    let y = 48 * scale;
    const x = 50 * scale;
    const maxW = (PAGE_W - 100) * scale;
    const maxY = (PAGE_H - 40) * scale;
    ctx.fillStyle = theme.ink;
    ctx.textBaseline = 'top';

    if (page && page.kind === 'blocks') {
      for (const b of page.blocks) {
        if (y > maxY) break;
        if (b.k === 'h1') {
          ctx.font = `700 ${22 * scale}px ${EXPORT_FONT_STACK}`;
          for (const line of wrapCanvasLine(ctx, b.t, maxW)) {
            if (y > maxY) break;
            ctx.fillText(line, x, y);
            y += 28 * scale;
          }
          y += 6 * scale;
        } else if (b.k === 'h2') {
          ctx.font = `700 ${15 * scale}px ${EXPORT_FONT_STACK}`;
          for (const line of wrapCanvasLine(ctx, b.t, maxW)) {
            if (y > maxY) break;
            ctx.fillText(line, x, y);
            y += 22 * scale;
          }
          y += 4 * scale;
        } else if (b.k === 'meta') {
          ctx.font = `500 ${10 * scale}px ${EXPORT_FONT_STACK}`;
          ctx.fillStyle = theme.muted;
          ctx.fillText(b.t, x, y);
          ctx.fillStyle = theme.ink;
          y += 18 * scale;
        } else if (b.k === 'code') {
          ctx.font = `400 ${10 * scale}px "IBM Plex Mono", "Consolas", monospace`;
          const lines = b.t.split('\n').slice(0, 20);
          const boxH = lines.length * 14 * scale + 12 * scale;
          ctx.fillStyle = theme.codeBg || '#f0ebe0';
          ctx.fillRect(x - 4 * scale, y - 4 * scale, maxW + 8 * scale, boxH);
          ctx.fillStyle = theme.ink;
          for (const line of lines) {
            if (y > maxY) break;
            ctx.fillText(line.slice(0, 120), x, y);
            y += 14 * scale;
          }
          y += 10 * scale;
        } else if (b.k === 'p' || b.k === 'q') {
          ctx.font = `${b.k === 'q' ? 'italic ' : ''}400 ${12.5 * scale}px ${EXPORT_FONT_STACK}`;
          if (b.k === 'q') ctx.fillStyle = theme.muted;
          const text = b.sents.join(' ');
          for (const line of wrapCanvasLine(ctx, text, maxW)) {
            if (y > maxY) break;
            ctx.fillText(line, x, y);
            y += 18 * scale;
          }
          ctx.fillStyle = theme.ink;
          y += 8 * scale;
        } else if (b.k === 'hr') {
          ctx.strokeStyle = theme.rule || '#ccc';
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + maxW, y);
          ctx.stroke();
          y += 14 * scale;
        } else if (b.k === 'img') {
          ctx.font = `400 ${11 * scale}px ${EXPORT_FONT_STACK}`;
          ctx.fillStyle = theme.muted;
          ctx.fillText(b.t, x, y);
          ctx.fillStyle = theme.ink;
          y += 18 * scale;
        }
      }
    } else {
      // fallback plain lines
      ctx.font = `400 ${13 * scale}px ${EXPORT_FONT_STACK}`;
      for (const line of blockText(doc, pageIndex)) {
        for (const wl of wrapCanvasLine(ctx, line, maxW)) {
          if (y > maxY) break;
          ctx.fillText(wl, x, y);
          y += 20 * scale;
        }
        y += 4 * scale;
      }
    }
  }

  drawInk(ctx, ann, scale, curve);

  ctx.fillStyle = theme.muted;
  ctx.font = `400 ${11 * scale}px ${EXPORT_FONT_STACK}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(`— ${pageIndex + 1} —`, (PAGE_W / 2) * scale, (PAGE_H - 20) * scale);
  ctx.textAlign = 'start';

  return canvas;
}

export type ExportOptions = {
  vector?: boolean;
  pressureCurve?: PressureCurve;
  /** User password — encrypts the exported PDF (open requires this password). */
  userPassword?: string;
  /** Owner password for permissions; defaults to userPassword when omitted. */
  ownerPassword?: string;
};

export async function exportAnnotatedPdf(
  doc: DocumentModel,
  docAnn: DocAnn,
  theme: ThemeTokens,
  opts: ExportOptions = {},
): Promise<Blob> {
  // jsPDF built-in fonts are Latin-only → Hangul/CJK becomes garbage in vector mode.
  // Use canvas rasterization whenever the document needs Unicode fonts (MD, HTML, DOCX, …).
  const unicode = documentNeedsUnicodeFont(doc);
  const vector =
    opts.vector !== false && doc.fmt !== 'PDF' && !unicode;
  const curve = opts.pressureCurve || 'ink';
  const encryption =
    opts.userPassword && opts.userPassword.length > 0
      ? {
          userPassword: opts.userPassword,
          ownerPassword: opts.ownerPassword || opts.userPassword,
          userPermissions: ['print', 'copy'] as ('print' | 'copy')[],
        }
      : undefined;
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [PAGE_W, PAGE_H],
    encryption,
  });

  console.info('[onjeom export] PDF', {
    fmt: doc.fmt,
    pages: doc.pages.length,
    vector,
    unicode,
  });

  for (let i = 0; i < doc.pages.length; i++) {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
    const ann = docAnn.pages[i] || emptyPage();

    if (vector) {
      // paper background — Latin-only documents
      const [pr, pg, pb] = hexToRgb(theme.paper);
      pdf.setFillColor(pr, pg, pb);
      pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
      drawTextVector(pdf, doc, i, theme);
      drawInkVector(pdf, ann, curve);
      pdf.setTextColor(...hexToRgb(theme.muted));
      pdf.setFontSize(9);
      pdf.text(`— ${i + 1} —`, PAGE_W / 2, PAGE_H - 20, { align: 'center' });
    } else {
      // Raster page (Unicode-safe): MD/HTML/DOCX/EPUB/PPTX with CJK etc.
      const canvas = await renderPageCanvas(doc, i, ann, theme, curve, 2);
      const data = canvas.toDataURL('image/jpeg', 0.93);
      pdf.addImage(data, 'JPEG', 0, 0, PAGE_W, PAGE_H);
    }
  }

  return pdf.output('blob');
}

export async function exportPagePng(
  doc: DocumentModel,
  pageIndex: number,
  docAnn: DocAnn,
  theme: ThemeTokens,
  curve: PressureCurve = 'ink',
): Promise<Blob> {
  const ann = docAnn.pages[pageIndex] || emptyPage();
  const canvas = await renderPageCanvas(doc, pageIndex, ann, theme, curve, 2);
  return new Promise((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 실패'))), 'image/png');
  });
}

export function exportAnnotationsJson(doc: DocumentModel, docAnn: DocAnn): string {
  return JSON.stringify(
    {
      version: 1,
      exportedAt: new Date().toISOString(),
      document: {
        id: doc.id,
        title: doc.title,
        fmt: doc.fmt,
        path: doc.path,
        pageCount: doc.pages.length,
      },
      annotations: docAnn,
    },
    null,
    2,
  );
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function downloadText(text: string, filename: string, mime = 'application/json') {
  downloadBlob(new Blob([text], { type: mime }), filename);
}
