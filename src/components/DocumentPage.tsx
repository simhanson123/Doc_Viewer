import { useRef, useState, type PointerEvent as RPointerEvent, type ReactNode } from 'react';
import type {
  DocumentModel,
  PageAnn,
  Point,
  PressureCurve,
  Shape,
  ShapeKind,
  ThemeTokens,
  Tool,
  Stroke,
} from '@/types';
import { NOTE_COLORS, PAGE_H, PAGE_W } from '@/types';
import { pressureStrokePath, shapePath, strokePath } from '@/lib/geometry';
import { mapPressure } from '@/lib/pressure';
import { PageBody } from './PageContent';

type Draft =
  | { kind: 'stroke'; tool: 'pen' | 'hl'; pts: Point[] }
  | { kind: 'shape'; shape: ShapeKind; x0: number; y0: number; x1: number; y1: number }
  | { kind: 'laser'; pts: Point[] }
  | null;

type Props = {
  doc: DocumentModel;
  pageIndex: number;
  zoom: number;
  theme: ThemeTokens;
  texture: boolean;
  accent: string;
  tool: Tool;
  hlColor: string;
  penColor: string;
  penW: number;
  shapeKind: ShapeKind;
  noteColor: string;
  marked: boolean;
  ann: PageAnn;
  hlMap: Record<string, string>;
  fontScale: number;
  pressureOn: boolean;
  pressureCurve: PressureCurve;
  onToggleSent: (id: string) => void;
  onPushHist: () => void;
  onAddStroke: (page: number, stroke: Stroke) => void;
  onAddShape: (page: number, shape: Shape) => void;
  onAddNote: (
    page: number,
    note: { id: string; x: number; y: number; text: string; color?: string },
  ) => void;
  onUpdateNote: (
    page: number,
    id: string,
    patch: { x?: number; y?: number; text?: string; color?: string },
  ) => void;
  onRemoveNote: (page: number, id: string) => void;
  onEraseAt: (page: number, pt: Point) => void;
  onToolSelect: () => void;
};

const DRAW_TOOLS: Tool[] = ['pen', 'hl', 'eraser', 'shape', 'note', 'line', 'laser'];
const CURSORS: Partial<Record<Tool, string>> = {
  pen: 'crosshair',
  hl: 'crosshair',
  eraser: 'cell',
  shape: 'crosshair',
  note: 'copy',
  line: 'crosshair',
  laser: 'none',
};

export function DocumentPage(props: Props) {
  const {
    doc,
    pageIndex,
    zoom,
    theme,
    texture,
    accent,
    tool,
    hlColor,
    penColor,
    penW,
    shapeKind,
    noteColor,
    marked,
    ann,
    hlMap,
    fontScale,
    pressureOn,
    pressureCurve,
    onToggleSent,
    onPushHist,
    onAddStroke,
    onAddShape,
    onAddNote,
    onUpdateNote,
    onRemoveNote,
    onEraseAt,
    onToolSelect,
  } = props;

  const ovRef = useRef<HTMLDivElement>(null);
  const pageRootRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft] = useState<Draft>(null);
  const erasing = useRef(false);
  const noteDrag = useRef<{ id: string; dx: number; dy: number } | null>(null);
  const laserTimer = useRef<number | null>(null);

  const getPt = (e: RPointerEvent): Point => {
    const el = ovRef.current;
    if (!el) return { x: 0, y: 0, p: 0.5 };
    const r = el.getBoundingClientRect();
    const rawP = typeof e.pressure === 'number' ? e.pressure : 0;
    const mapped = mapPressure(rawP, pressureCurve, e.pointerType || 'mouse');
    return {
      x: ((e.clientX - r.left) / r.width) * PAGE_W,
      y: ((e.clientY - r.top) / r.height) * PAGE_H,
      p: mapped,
    };
  };

  const effectiveShape = tool === 'line' ? 'line' : shapeKind;

  const down = (e: RPointerEvent) => {
    if (tool === 'select' || tool === 'texthl') return;
    // Prefer stylus over palm (touch) when pen is active
    if (e.pointerType === 'touch' && (tool === 'pen' || tool === 'hl') && pressureOn) {
      // allow touch but lower weight via pressure
    }
    const pt = getPt(e);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (tool === 'pen' || tool === 'hl') {
      onPushHist();
      setDraft({ kind: 'stroke', tool, pts: [pt] });
    } else if (tool === 'shape' || tool === 'line') {
      onPushHist();
      setDraft({
        kind: 'shape',
        shape: effectiveShape,
        x0: pt.x,
        y0: pt.y,
        x1: pt.x,
        y1: pt.y,
      });
    } else if (tool === 'eraser') {
      onPushHist();
      erasing.current = true;
      onEraseAt(pageIndex, pt);
    } else if (tool === 'note') {
      onPushHist();
      onAddNote(pageIndex, {
        id: 'n' + Date.now() + Math.floor(Math.random() * 10000),
        x: Math.max(4, Math.min(pt.x - 20, PAGE_W - 178)),
        y: Math.max(4, Math.min(pt.y - 12, PAGE_H - 160)),
        text: '',
        color: noteColor || NOTE_COLORS[0],
      });
      onToolSelect();
    } else if (tool === 'laser') {
      setDraft({ kind: 'laser', pts: [pt] });
      if (laserTimer.current) window.clearTimeout(laserTimer.current);
    }
  };

  const move = (e: RPointerEvent) => {
    if (erasing.current && tool === 'eraser') {
      onEraseAt(pageIndex, getPt(e));
      return;
    }
    if (!draft) return;
    const pt = getPt(e);
    if (draft.kind === 'stroke' || draft.kind === 'laser') {
      setDraft({ ...draft, pts: draft.pts.concat([pt]) });
    } else {
      setDraft({ ...draft, x1: pt.x, y1: pt.y });
    }
  };

  const up = () => {
    if (erasing.current) {
      erasing.current = false;
      return;
    }
    if (!draft) return;
    if (draft.kind === 'stroke' && draft.pts.length) {
      const isHl = draft.tool === 'hl';
      onAddStroke(pageIndex, {
        tool: draft.tool,
        c: isHl ? hlColor : penColor,
        w: isHl ? 16 : penW,
        pts: draft.pts,
        pressure: !isHl && pressureOn,
      });
    }
    if (draft.kind === 'shape') {
      const dx = Math.abs(draft.x1 - draft.x0);
      const dy = Math.abs(draft.y1 - draft.y0);
      if (dx > 4 || dy > 4) {
        onAddShape(pageIndex, {
          shape: draft.shape,
          x0: draft.x0,
          y0: draft.y0,
          x1: draft.x1,
          y1: draft.y1,
          c: penColor,
          w: penW,
        });
      }
    }
    if (draft.kind === 'laser') {
      laserTimer.current = window.setTimeout(() => setDraft(null), 600);
      return;
    }
    setDraft(null);
  };

  const inkNodes: ReactNode[] = (ann.strokes || []).map((st, i) => {
    if (st.pressure && st.tool === 'pen') {
      return (
        <path
          key={`s${i}`}
          d={pressureStrokePath(st.pts, st.w, pressureCurve)}
          fill={st.c}
          stroke="none"
          style={{ opacity: 0.95 }}
        />
      );
    }
    return (
      <path
        key={`s${i}`}
        d={strokePath(st.pts)}
        fill="none"
        stroke={st.c}
        strokeWidth={st.w}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          mixBlendMode: st.tool === 'hl' ? 'multiply' : 'normal',
          opacity: st.tool === 'hl' ? 0.5 : 1,
        }}
      />
    );
  });

  const shapeNodes = (ann.shapes || []).map((sh, i) => (
    <path
      key={`h${i}`}
      d={shapePath(sh)}
      fill="none"
      stroke={sh.c}
      strokeWidth={sh.w ?? 2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ opacity: 0.95 }}
    />
  ));

  let draftPath: ReactNode = null;
  if (draft?.kind === 'stroke') {
    if (pressureOn && draft.tool === 'pen') {
      draftPath = (
        <path
          d={pressureStrokePath(draft.pts, penW, pressureCurve)}
          fill={penColor}
          stroke="none"
          style={{ opacity: 0.9 }}
        />
      );
    } else {
      draftPath = (
        <path
          d={strokePath(draft.pts)}
          fill="none"
          stroke={draft.tool === 'hl' ? hlColor : penColor}
          strokeWidth={draft.tool === 'hl' ? 16 : penW}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            mixBlendMode: draft.tool === 'hl' ? 'multiply' : 'normal',
            opacity: draft.tool === 'hl' ? 0.5 : 1,
          }}
        />
      );
    }
  } else if (draft?.kind === 'shape') {
    const shapeDraft: Shape = {
      shape: draft.shape,
      x0: draft.x0,
      y0: draft.y0,
      x1: draft.x1,
      y1: draft.y1,
      c: penColor,
      w: penW,
    };
    draftPath = (
      <path
        d={shapePath(shapeDraft)}
        fill="none"
        stroke={penColor}
        strokeWidth={penW}
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ opacity: 0.7 }}
      />
    );
  } else if (draft?.kind === 'laser') {
    draftPath = (
      <path
        d={strokePath(draft.pts)}
        fill="none"
        stroke="#FF3B30"
        strokeWidth={4}
        strokeLinecap="round"
        style={{ opacity: 0.85, filter: 'drop-shadow(0 0 6px #FF3B30)' }}
      />
    );
  }

  const bgImage = texture
    ? `repeating-linear-gradient(0deg, ${theme.grain} 0 1px, transparent 1px 3px)`
    : 'none';

  return (
    <div className="page-wrap" style={{ width: PAGE_W * zoom, height: PAGE_H * zoom }}>
      <div
        ref={pageRootRef}
        className="page"
        data-page-export={`${doc.id}-${pageIndex}`}
        style={{
          transform: `scale(${zoom})`,
          background: theme.paper,
          backgroundImage: bgImage,
        }}
      >
        <PageBody
          doc={doc}
          pageIndex={pageIndex}
          theme={theme}
          tool={tool}
          hlMap={hlMap}
          fontScale={fontScale}
          onToggleSent={onToggleSent}
        />
        <div className="page-num" style={{ color: theme.muted }}>
          — {pageIndex + 1} —
        </div>
        <svg className="page-ink" viewBox={`0 0 ${PAGE_W} ${PAGE_H}`}>
          {inkNodes}
          {shapeNodes}
          {draftPath}
        </svg>
        <div
          ref={ovRef}
          className="page-overlay"
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          style={{
            pointerEvents: DRAW_TOOLS.includes(tool) ? 'auto' : 'none',
            cursor: CURSORS[tool] || 'default',
          }}
        />
        {(ann.notes || []).map((n) => (
          <div
            key={n.id}
            className="sticky"
            style={{ left: n.x, top: n.y, background: n.color || '#FBE9A0' }}
          >
            <div
              className="sticky-bar"
              onPointerDown={(e) => {
                e.stopPropagation();
                try {
                  e.currentTarget.setPointerCapture(e.pointerId);
                } catch {
                  /* ignore */
                }
                const el = ovRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                const pt = {
                  x: ((e.clientX - r.left) / r.width) * PAGE_W,
                  y: ((e.clientY - r.top) / r.height) * PAGE_H,
                };
                onPushHist();
                noteDrag.current = { id: n.id, dx: pt.x - n.x, dy: pt.y - n.y };
              }}
              onPointerMove={(e) => {
                if (!noteDrag.current || noteDrag.current.id !== n.id) return;
                const el = ovRef.current;
                if (!el) return;
                const r = el.getBoundingClientRect();
                const pt = {
                  x: ((e.clientX - r.left) / r.width) * PAGE_W,
                  y: ((e.clientY - r.top) / r.height) * PAGE_H,
                };
                onUpdateNote(pageIndex, n.id, {
                  x: Math.max(-60, Math.min(pt.x - noteDrag.current.dx, PAGE_W - 100)),
                  y: Math.max(-10, Math.min(pt.y - noteDrag.current.dy, PAGE_H - 60)),
                });
              }}
              onPointerUp={() => {
                noteDrag.current = null;
              }}
            >
              <div className="sticky-grip" />
              <button
                type="button"
                className="sticky-x"
                title="메모 삭제"
                onClick={(e) => {
                  e.stopPropagation();
                  onPushHist();
                  onRemoveNote(pageIndex, n.id);
                }}
                onPointerDown={(e) => e.stopPropagation()}
              >
                ×
              </button>
            </div>
            <textarea
              value={n.text}
              placeholder="…"
              onChange={(e) => onUpdateNote(pageIndex, n.id, { text: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ))}
        {marked && <div className="ribbon" style={{ background: accent }} />}
      </div>
    </div>
  );
}
