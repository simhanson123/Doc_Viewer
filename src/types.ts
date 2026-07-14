export type DocFormat =
  | 'EPUB'
  | 'PDF'
  | 'DOCX'
  | 'PPTX'
  | 'MD'
  | 'TXT'
  | 'HTML'
  | 'UNKNOWN';

export type ContentBlock =
  | { k: 'h1'; t: string }
  | { k: 'h2'; t: string }
  | { k: 'meta'; t: string }
  | { k: 'code'; t: string }
  | { k: 'img'; t: string; src?: string }
  | { k: 'hr' }
  | { k: 'p'; sents: string[] }
  | { k: 'q'; sents: string[] };

export type PageContent =
  | { kind: 'blocks'; blocks: ContentBlock[] }
  | { kind: 'pdf'; pageIndex: number }
  | { kind: 'image'; src: string; alt?: string };

export type TocItem = {
  title: string;
  page: number;
  level: 1 | 2;
};

export type DocumentModel = {
  id: string;
  fmt: DocFormat;
  title: string;
  sub: string;
  face: 'serif' | 'sans';
  path?: string;
  pages: PageContent[];
  /** Raw payload for format-specific renderers (PDF bytes, etc.) */
  raw?: ArrayBuffer | Uint8Array | string;
  /**
   * In-memory only: password used to unlock an encrypted PDF.
   * Never persisted to localStorage / disk meta.
   */
  pdfPassword?: string;
  toc?: TocItem[];
  tags?: string[];
  folder?: string;
  favorite?: boolean;
  lastOpened?: number;
  addedAt?: number;
};

export type Tool =
  | 'select'
  | 'texthl'
  | 'hl'
  | 'pen'
  | 'eraser'
  | 'shape'
  | 'note'
  | 'line'
  | 'laser';

export type ShapeKind = 'rect' | 'ellipse' | 'arrow' | 'line';

export type Point = {
  x: number;
  y: number;
  /** Pointer pressure 0–1 (stylus). Default 0.5 when unavailable. */
  p?: number;
};

export type Stroke = {
  tool: 'pen' | 'hl';
  c: string;
  w: number;
  pts: Point[];
  /** If true, render variable width from point pressure */
  pressure?: boolean;
};

export type Shape = {
  shape: ShapeKind;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  c: string;
  w?: number;
};

export type StickyNote = {
  id: string;
  x: number;
  y: number;
  text: string;
  color?: string;
};

export type PageAnn = {
  strokes: Stroke[];
  shapes: Shape[];
  notes: StickyNote[];
};

export type DocAnn = {
  pages: Record<number, PageAnn>;
  hl: Record<string, string>;
  marks: number[];
};

export type AnnStore = Record<string, DocAnn>;

export type ViewMode = 'single' | 'spread' | 'scroll' | 'reflow';

export type PressureCurve = 'linear' | 'soft' | 'firm' | 'ink';

export type ReadingTheme = '크림' | '화이트' | '다크' | '세피아' | '나이트';

export type ThemeTokens = {
  desk: string;
  paper: string;
  ink: string;
  muted: string;
  rule: string;
  codeBg: string;
  grain: string;
  chrome: string;
  chromeBorder: string;
  chromeText: string;
  sidebar: string;
};

export type UiLocale =
  | 'ko'
  | 'en'
  | 'ja'
  | 'zh-Hans'
  | 'zh-Hant'
  | 'es'
  | 'fr'
  | 'de'
  | 'it'
  | 'pt'
  | 'ru'
  | 'ar'
  | 'hi'
  | 'th'
  | 'vi'
  | 'id'
  | 'tr'
  | 'pl'
  | 'nl'
  | 'uk';

export type AppSettings = {
  /** UI language */
  locale: UiLocale;
  readingTheme: ReadingTheme;
  accentColor: string;
  pageTexture: boolean;
  pressureSensitivity: boolean;
  pressureCurve: PressureCurve;
  fontScale: number;
  annSyncFolder: string | null;
  autoSyncAnn: boolean;
  defaultViewMode: ViewMode;
  showThumbnails: boolean;
  showRightPanel: boolean;
  rightPanelTab: 'toc' | 'highlights' | 'notes' | 'search';
  librarySort: 'recent' | 'title' | 'format';
  libraryFolderFilter: string | 'all';
  libraryQuery: string;
  libraryFormatFilter: DocFormat | 'all';
  /** Prefer vector paths when exporting non-PDF documents */
  vectorPdfExport: boolean;
  /** Compact UI for phones */
  compactUi: boolean;
};

export const PAGE_W = 560;
export const PAGE_H = 744;

export const THEMES: Record<ReadingTheme, ThemeTokens> = {
  크림: {
    desk: '#E8E0CE',
    paper: '#FCF8ED',
    ink: '#332A1E',
    muted: '#8C7F69',
    rule: '#E4D9C2',
    codeBg: 'rgba(80, 60, 20, 0.06)',
    grain: 'rgba(120, 90, 40, 0.025)',
    chrome: '#F7F1E3',
    chromeBorder: '#E4DBC4',
    chromeText: '#4A4232',
    sidebar: '#F4EEDF',
  },
  화이트: {
    desk: '#E9E8E4',
    paper: '#FFFFFF',
    ink: '#26241F',
    muted: '#8C8880',
    rule: '#ECEAE4',
    codeBg: 'rgba(40, 40, 40, 0.05)',
    grain: 'rgba(0, 0, 0, 0.015)',
    chrome: '#F5F5F3',
    chromeBorder: '#E2E1DC',
    chromeText: '#33322E',
    sidebar: '#F0EFEC',
  },
  다크: {
    desk: '#1B1915',
    paper: '#2A261E',
    ink: '#E9E1CD',
    muted: '#97907F',
    rule: '#3E392E',
    codeBg: 'rgba(255, 255, 255, 0.06)',
    grain: 'rgba(255, 255, 255, 0.02)',
    chrome: '#221F1A',
    chromeBorder: '#3A342C',
    chromeText: '#D9D0BC',
    sidebar: '#1F1C17',
  },
  세피아: {
    desk: '#D9C7A5',
    paper: '#F4E6C8',
    ink: '#3D2B1A',
    muted: '#8B6F4E',
    rule: '#E0CFA8',
    codeBg: 'rgba(90, 50, 10, 0.07)',
    grain: 'rgba(100, 60, 20, 0.03)',
    chrome: '#EDE0C4',
    chromeBorder: '#D6C29A',
    chromeText: '#4A3520',
    sidebar: '#E8D9B8',
  },
  나이트: {
    desk: '#0E1218',
    paper: '#151B24',
    ink: '#C8D4E4',
    muted: '#7A8A9E',
    rule: '#243040',
    codeBg: 'rgba(100, 140, 200, 0.08)',
    grain: 'rgba(120, 160, 220, 0.02)',
    chrome: '#121820',
    chromeBorder: '#243040',
    chromeText: '#B8C6D8',
    sidebar: '#10161E',
  },
};

export const HL_COLORS = ['#F6D24A', '#F5A05C', '#8FCF9B', '#87BBE8', '#EF9DBB', '#C9A0FF'];
export const PEN_COLORS = ['#33291D', '#B0432E', '#2E5E9E', '#3E6B4F', '#8A5A83', '#C9C2B0'];
export const NOTE_COLORS = ['#FBE9A0', '#C8E6C9', '#BBDEFB', '#F8BBD0', '#E1BEE7', '#FFE0B2'];
export const ACCENT_OPTIONS = ['#A65336', '#3E5C76', '#4E6B51', '#8A5A83', '#B8860B', '#2E6B6B'];
export const FMT_COLORS: Record<DocFormat, string> = {
  EPUB: '#A65336',
  PDF: '#B0432E',
  DOCX: '#2E5E9E',
  PPTX: '#C45C26',
  MD: '#3E6B4F',
  TXT: '#8C7F69',
  HTML: '#5B7C99',
  UNKNOWN: '#8C7F69',
};

export const DEFAULT_ACCENT = '#A65336';

export const DEFAULT_SETTINGS: AppSettings = {
  locale: 'ko',
  readingTheme: '크림',
  accentColor: DEFAULT_ACCENT,
  pageTexture: true,
  pressureSensitivity: true,
  pressureCurve: 'ink',
  fontScale: 1,
  annSyncFolder: null,
  autoSyncAnn: true,
  defaultViewMode: 'single',
  showThumbnails: true,
  showRightPanel: true,
  rightPanelTab: 'toc',
  librarySort: 'recent',
  libraryFolderFilter: 'all',
  libraryQuery: '',
  libraryFormatFilter: 'all',
  vectorPdfExport: true,
  compactUi: false,
};

export const LIBRARY_FOLDERS = ['전체', '소설', '업무', '학습', '메모', '미분류'] as const;
