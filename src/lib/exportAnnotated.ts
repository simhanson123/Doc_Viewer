import { jsPDF } from 'jspdf';
import type { DocAnn, DocumentModel, PageAnn, ThemeTokens } from '@/types';
import { PAGE_H, PAGE_W } from '@/types';
import { pressureStrokePath, shapePath } from '@/lib/geometry';
import type { PressureCurve } from '@/lib/pressure';

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

  const live = document.querySelector(
    `[data-page-export="${doc.id}-${pageIndex}"] canvas`,
  ) as HTMLCanvasElement | null;
  if (live && live.width > 0) {
    ctx.drawImage(live, 0, 0, canvas.width, canvas.height);
  } else {
    const lines = blockText(doc, pageIndex);
    ctx.fillStyle = theme.ink;
    ctx.font = `${14 * scale}px "Noto Sans KR", "Gowun Batang", serif`;
    let y = 50 * scale;
    const maxW = (PAGE_W - 100) * scale;
    for (const line of lines) {
      const words = line.split(/\s+/);
      let cur = '';
      for (const w of words) {
        const t = cur ? cur + ' ' + w : w;
        if (ctx.measureText(t).width > maxW && cur) {
          ctx.fillText(cur, 50 * scale, y);
          y += 22 * scale;
          cur = w;
          if (y > (PAGE_H - 40) * scale) break;
        } else cur = t;
      }
      if (cur && y <= (PAGE_H - 40) * scale) {
        ctx.fillText(cur, 50 * scale, y);
        y += 26 * scale;
      }
      if (y > (PAGE_H - 40) * scale) break;
    }
  }

  drawInk(ctx, ann, scale, curve);

  ctx.fillStyle = theme.muted;
  ctx.font = `${11 * scale}px "Gowun Batang", serif`;
  ctx.textAlign = 'center';
  ctx.fillText(`— ${pageIndex + 1} —`, (PAGE_W / 2) * scale, (PAGE_H - 20) * scale);
  ctx.textAlign = 'start';

  return canvas;
}

export type ExportOptions = {
  vector?: boolean;
  pressureCurve?: PressureCurve;
};

export async function exportAnnotatedPdf(
  doc: DocumentModel,
  docAnn: DocAnn,
  theme: ThemeTokens,
  opts: ExportOptions = {},
): Promise<Blob> {
  const vector = opts.vector !== false && doc.fmt !== 'PDF';
  const curve = opts.pressureCurve || 'ink';
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: [PAGE_W, PAGE_H],
  });

  for (let i = 0; i < doc.pages.length; i++) {
    if (i > 0) pdf.addPage([PAGE_W, PAGE_H], 'portrait');
    const ann = docAnn.pages[i] || emptyPage();

    if (vector) {
      // paper background
      const [pr, pg, pb] = hexToRgb(theme.paper);
      pdf.setFillColor(pr, pg, pb);
      pdf.rect(0, 0, PAGE_W, PAGE_H, 'F');
      drawTextVector(pdf, doc, i, theme);
      drawInkVector(pdf, ann, curve);
      pdf.setTextColor(...hexToRgb(theme.muted));
      pdf.setFontSize(9);
      pdf.text(`— ${i + 1} —`, PAGE_W / 2, PAGE_H - 20, { align: 'center' });
    } else {
      const canvas = await renderPageCanvas(doc, i, ann, theme, curve, 2);
      const data = canvas.toDataURL('image/jpeg', 0.92);
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

void shapePath;
void pressureStrokePath;
