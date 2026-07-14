import type { CSSProperties } from 'react';
import type { ShapeKind, Tool } from '@/types';
import { HL_COLORS, NOTE_COLORS, PEN_COLORS } from '@/types';
import { useI18n } from '@/i18n/I18nContext';
import {
  IconArrow,
  IconEllipse,
  IconEraser,
  IconHl,
  IconNote,
  IconPen,
  IconRect,
  IconRedo,
  IconSelect,
  IconShape,
  IconUndo,
} from './Icons';

type Props = {
  tool: Tool;
  accent: string;
  hlColor: string;
  penColor: string;
  penW: number;
  shapeKind: ShapeKind;
  noteColor: string;
  canUndo: boolean;
  canRedo: boolean;
  pressureOn: boolean;
  onTool: (t: Tool) => void;
  onHlColor: (c: string) => void;
  onPenColor: (c: string) => void;
  onPenW: (w: number) => void;
  onShapeKind: (s: ShapeKind) => void;
  onNoteColor: (c: string) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClearPage: () => void;
};

export function Toolbar({
  tool,
  accent,
  hlColor,
  penColor,
  penW,
  shapeKind,
  noteColor,
  canUndo,
  canRedo,
  pressureOn,
  onTool,
  onHlColor,
  onPenColor,
  onPenW,
  onShapeKind,
  onNoteColor,
  onUndo,
  onRedo,
  onClearPage,
}: Props) {
  const { t: tr } = useI18n();
  const tb = (toolId: Tool) => `tool-btn${tool === toolId ? ' active' : ''}`;
  const activeBg = (toolId: Tool): CSSProperties =>
    tool === toolId ? { background: accent, color: '#FFF6E8' } : {};

  return (
    <>
      {(tool === 'hl' || tool === 'texthl') && (
        <div className="tool-pop">
          {HL_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${c === hlColor ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => onHlColor(c)}
            />
          ))}
        </div>
      )}
      {(tool === 'pen' || tool === 'line') && (
        <div className="tool-pop">
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${c === penColor ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => onPenColor(c)}
            />
          ))}
          <div className="tool-sep" style={{ height: 20, margin: '0 4px' }} />
          {[1.5, 2.5, 4, 6, 9].map((w) => (
            <button
              key={w}
              type="button"
              className={`width-btn${penW === w ? ' active' : ''}`}
              onClick={() => onPenW(w)}
              title={`${w}px`}
            >
              <div className="width-dot" style={{ width: Math.min(16, w * 1.8), height: Math.min(16, w * 1.8) }} />
            </button>
          ))}
          {pressureOn && tool === 'pen' && (
            <span className="tool-hint">{tr('pressureOnBadge')}</span>
          )}
        </div>
      )}
      {tool === 'shape' && (
        <div className="tool-pop">
          {(
            [
              ['rect', IconRect, '사각형'],
              ['ellipse', IconEllipse, '원'],
              ['arrow', IconArrow, '화살표'],
            ] as const
          ).map(([k, Icon, title]) => (
            <button
              key={k}
              type="button"
              title={title}
              className={`shape-btn${shapeKind === k ? ' active' : ''}`}
              style={shapeKind === k ? { background: accent, color: '#FFF6E8' } : {}}
              onClick={() => onShapeKind(k)}
            >
              <Icon />
            </button>
          ))}
          {PEN_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${c === penColor ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => onPenColor(c)}
            />
          ))}
        </div>
      )}
      {tool === 'note' && (
        <div className="tool-pop">
          {NOTE_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              className={`swatch${c === noteColor ? ' selected' : ''}`}
              style={{ background: c }}
              onClick={() => onNoteColor(c)}
            />
          ))}
        </div>
      )}

      <div className="tool-dock" data-testid="toolbar">
        <button type="button" data-testid="tool-select" title={tr('toolSelect')} className={tb('select')} style={activeBg('select')} onClick={() => onTool('select')}>
          <IconSelect />
        </button>
        <button type="button" data-testid="tool-texthl" title={tr('toolTextHl')} className={tb('texthl')} style={activeBg('texthl')} onClick={() => onTool('texthl')}>
          <span
            style={{
              fontFamily: 'var(--font-reading-serif)',
              fontSize: 14,
              fontWeight: 700,
              lineHeight: 1,
              paddingBottom: 2,
              borderBottom: `4px solid ${hlColor}`,
            }}
          >
            A
          </span>
        </button>
        <button type="button" data-testid="tool-hl" title={tr('toolHl')} className={tb('hl')} style={activeBg('hl')} onClick={() => onTool('hl')}>
          <IconHl />
        </button>
        <button type="button" data-testid="tool-pen" title={tr('toolPen')} className={tb('pen')} style={activeBg('pen')} onClick={() => onTool('pen')}>
          <IconPen />
        </button>
        <button type="button" data-testid="tool-line" title={tr('toolLine')} className={tb('line')} style={activeBg('line')} onClick={() => onTool('line')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M5 19 L19 5" />
          </svg>
        </button>
        <button type="button" data-testid="tool-eraser" title={tr('toolEraser')} className={tb('eraser')} style={activeBg('eraser')} onClick={() => onTool('eraser')}>
          <IconEraser />
        </button>
        <button type="button" data-testid="tool-shape" title={tr('toolShape')} className={tb('shape')} style={activeBg('shape')} onClick={() => onTool('shape')}>
          <IconShape />
        </button>
        <button type="button" data-testid="tool-note" title={tr('toolNote')} className={tb('note')} style={activeBg('note')} onClick={() => onTool('note')}>
          <IconNote />
        </button>
        <button type="button" data-testid="tool-laser" title={tr('toolLaser')} className={tb('laser')} style={activeBg('laser')} onClick={() => onTool('laser')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <circle cx="12" cy="12" r="3" fill="currentColor" opacity="0.4" />
            <circle cx="12" cy="12" r="7" />
          </svg>
        </button>
        <div className="tool-sep" />
        <button type="button" data-testid="tool-undo" title={tr('toolUndo')} className="tool-btn" disabled={!canUndo} onClick={onUndo}>
          <IconUndo />
        </button>
        <button type="button" data-testid="tool-redo" title={tr('toolRedo')} className="tool-btn" disabled={!canRedo} onClick={onRedo}>
          <IconRedo />
        </button>
        <button type="button" data-testid="tool-clear" title={tr('toolClearPage')} className="tool-btn" onClick={onClearPage}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 7h16M9 7V5h6v2M8 7l1 12h6l1-12" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </>
  );
}
