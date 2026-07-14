import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { DocAnn, DocFormat, DocumentModel, ShapeKind, Tool, ViewMode } from '@/types';
import { FMT_COLORS, NOTE_COLORS, PAGE_W, THEMES } from '@/types';
import { loadDocument, isPdfPasswordError } from '@/lib/loaders';
import { useAnnotations } from '@/hooks/useAnnotations';
import { useSettings } from '@/hooks/useSettings';
import {
  exportAnnotatedPdf,
  exportAnnotationsJson,
  exportPagePng,
} from '@/lib/exportAnnotated';
import {
  detectPlatform,
  initNativeChrome,
  isAndroid,
  isTouchPrimary,
  platformOpenFiles,
  platformOpenJson,
  platformOpenPaths,
  platformPickFolder,
  platformSaveBinary,
  platformSaveText,
} from '@/platform';
import { DocumentPage } from '@/components/DocumentPage';
import { Toolbar } from '@/components/Toolbar';
import { SettingsModal } from '@/components/SettingsModal';
import { ShortcutsModal } from '@/components/ShortcutsModal';
import { PasswordModal } from '@/components/PasswordModal';
import { RightPanel } from '@/components/RightPanel';
import { ThumbStrip } from '@/components/ThumbStrip';
import { ReflowView } from '@/components/ReflowView';
import { IconBookmark, IconMenu } from '@/components/Icons';
import { I18nProvider, useI18n } from '@/i18n/I18nContext';
import type { LocaleCode } from '@/i18n';

type PendingOpen = {
  path?: string;
  name: string;
  ext: string;
  data: string | ArrayBuffer;
  isText: boolean;
  encoding?: 'utf8' | 'base64';
  password?: string;
};

type PwdPrompt =
  | {
      kind: 'unlock';
      file: PendingOpen;
      hint: 'need' | 'incorrect' | null;
      /** remaining queue after this file */
      rest: PendingOpen[];
      done: DocumentModel[];
    }
  | { kind: 'export' }
  | null;

const LIB_META_KEY = 'onjeom-lib-meta-v1';

type LibMeta = Record<
  string,
  { folder?: string; tags?: string[]; favorite?: boolean; lastOpened?: number }
>;

function loadLibMeta(): LibMeta {
  try {
    return JSON.parse(localStorage.getItem(LIB_META_KEY) || '{}') as LibMeta;
  } catch {
    return {};
  }
}

function saveLibMeta(m: LibMeta) {
  try {
    localStorage.setItem(LIB_META_KEY, JSON.stringify(m));
  } catch {
    /* ignore */
  }
}

export default function App() {
  const { settings, patch, reset } = useSettings();
  return (
    <I18nProvider locale={settings.locale as LocaleCode}>
      <AppShell settings={settings} patch={patch} reset={reset} />
    </I18nProvider>
  );
}

function AppShell({
  settings,
  patch,
  reset,
}: {
  settings: ReturnType<typeof useSettings>['settings'];
  patch: ReturnType<typeof useSettings>['patch'];
  reset: ReturnType<typeof useSettings>['reset'];
}) {
  const { t } = useI18n();
  /** User-opened documents only — no built-in sample library */
  const [library, setLibrary] = useState<DocumentModel[]>([]);
  const [docId, setDocId] = useState('');
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<ViewMode>('single');
  const [zoom, setZoom] = useState(1);
  const [tool, setTool] = useState<Tool>('select');
  const [hlColor, setHlColor] = useState('#F6D24A');
  const [penColor, setPenColor] = useState('#33291D');
  const [penW, setPenW] = useState(3);
  const [shapeKind, setShapeKind] = useState<ShapeKind>('arrow');
  const [noteColor, setNoteColor] = useState(NOTE_COLORS[0]);
  const [sidebar, setSidebar] = useState(() => !isTouchPrimary());
  const [deskW, setDeskW] = useState(1200);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [gotoOpen, setGotoOpen] = useState(false);
  const [gotoVal, setGotoVal] = useState('');
  const [exporting, setExporting] = useState(false);
  const [libQuery, setLibQuery] = useState('');
  const [pwdPrompt, setPwdPrompt] = useState<PwdPrompt>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const accent = settings.accentColor;
  const theme = THEMES[settings.readingTheme] || THEMES['크림'];

  const doc = library.find((d) => d.id === docId) || library[0];
  const annApi = useAnnotations(doc?.id ?? '', {
    syncFolder: settings.annSyncFolder,
    autoSync: settings.autoSyncAnn,
  });

  const deskRef = useRef<HTMLDivElement>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    const el = deskRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setDeskW(el.clientWidth));
    ro.observe(el);
    setDeskW(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  // Import ann folder / Android storage
  useEffect(() => {
    if (settings.annSyncFolder || isAndroid()) {
      void annApi.importFolder(settings.annSyncFolder);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.annSyncFolder]);

  useEffect(() => {
    void initNativeChrome(theme.chrome);
  }, [theme.chrome]);

  // Mobile: default compact + hide right panel on narrow screens
  useEffect(() => {
    if (detectPlatform() === 'android' || isTouchPrimary()) {
      if (!settings.compactUi) patch({ compactUi: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistMeta = useCallback((lib: DocumentModel[]) => {
    const meta: LibMeta = {};
    for (const d of lib) {
      meta[d.id] = {
        folder: d.folder,
        tags: d.tags,
        favorite: d.favorite,
        lastOpened: d.lastOpened,
      };
    }
    saveLibMeta(meta);
  }, []);

  const selectDoc = useCallback(
    (id: string) => {
      setDocId(id);
      setPage(0);
      annApi.resetHistory();
      setLibrary((lib) => {
        const next = lib.map((d) =>
          d.id === id ? { ...d, lastOpened: Date.now() } : d,
        );
        persistMeta(next);
        return next;
      });
    },
    [annApi, persistMeta],
  );

  const commitModels = useCallback(
    (models: DocumentModel[]) => {
      if (!models.length) return;
      setLibrary((lib) => {
        let next = lib.slice();
        for (const model of models) {
          const exists = next.findIndex((d) => d.path && d.path === model.path);
          if (exists >= 0) next[exists] = { ...next[exists], ...model };
          else next = [model, ...next];
        }
        persistMeta(next);
        return next;
      });
      selectDoc(models[0].id);
      showToast(t('toastOpened', { n: models.length }));
    },
    [persistMeta, selectDoc, showToast, t],
  );

  const loadOne = useCallback(async (raw: PendingOpen): Promise<DocumentModel> => {
    const model = await loadDocument({
      path: raw.path,
      name: raw.name,
      ext: raw.ext,
      data: raw.data,
      isText: raw.isText,
      encoding: raw.encoding,
      password: raw.password,
    });
    model.folder = model.folder || '미분류';
    model.addedAt = Date.now();
    model.lastOpened = Date.now();
    return model;
  }, []);

  const ingestFiles = useCallback(
    async (files: PendingOpen[]) => {
      setLoading(true);
      setError(null);
      setPwdPrompt(null);
      try {
        const models: DocumentModel[] = [];
        const queue = files.slice();
        while (queue.length) {
          const raw = queue.shift()!;
          try {
            models.push(await loadOne(raw));
          } catch (e) {
            if (isPdfPasswordError(e)) {
              // Pause queue — resume after password dialog
              setPwdPrompt({
                kind: 'unlock',
                file: raw,
                hint: e.kind,
                rest: queue,
                done: models,
              });
              setLoading(false);
              return;
            }
            throw e;
          }
        }
        commitModels(models);
      } catch (e) {
        console.error(e);
        setError(e instanceof Error ? e.message : t('errOpen'));
      } finally {
        setLoading(false);
      }
    },
    [commitModels, loadOne, t],
  );

  const onPasswordSubmit = useCallback(
    async (password: string) => {
      if (!pwdPrompt) return;

      if (pwdPrompt.kind === 'export') {
        if (!doc) return;
        setPwdPrompt(null);
        setExporting(true);
        try {
          const blob = await exportAnnotatedPdf(doc, annApi.ann, theme, {
            vector: settings.vectorPdfExport,
            pressureCurve: settings.pressureCurve,
            userPassword: password,
          });
          const name = `${doc.title.replace(/[\\/:*?"<>|]/g, '_')}-protected.pdf`;
          const buf = await blob.arrayBuffer();
          const result = await platformSaveBinary(buf, name, 'application/pdf', [
            { name: 'PDF', extensions: ['pdf'] },
          ]);
          if (result !== 'cancelled') {
            showToast(
              result === 'shared' ? t('toastShared') : t('toastPdfProtected'),
            );
          }
        } catch (e) {
          console.error(e);
          setError(e instanceof Error ? e.message : t('errPdf'));
        } finally {
          setExporting(false);
        }
        return;
      }

      // unlock encrypted PDF
      const { file, rest, done } = pwdPrompt;
      setLoading(true);
      try {
        const model = await loadOne({ ...file, password });
        const models = [...done, model];
        // Continue remaining queue
        const queue = rest.slice();
        while (queue.length) {
          const raw = queue.shift()!;
          try {
            models.push(await loadOne(raw));
          } catch (e) {
            if (isPdfPasswordError(e)) {
              setPwdPrompt({
                kind: 'unlock',
                file: raw,
                hint: e.kind,
                rest: queue,
                done: models,
              });
              setLoading(false);
              return;
            }
            throw e;
          }
        }
        setPwdPrompt(null);
        commitModels(models);
      } catch (e) {
        if (isPdfPasswordError(e)) {
          setPwdPrompt({
            kind: 'unlock',
            file,
            hint: e.kind,
            rest,
            done,
          });
          return;
        }
        console.error(e);
        setPwdPrompt(null);
        setError(e instanceof Error ? e.message : t('errOpen'));
      } finally {
        setLoading(false);
      }
    },
    [
      pwdPrompt,
      doc,
      annApi.ann,
      theme,
      settings.vectorPdfExport,
      settings.pressureCurve,
      loadOne,
      commitModels,
      showToast,
      t,
    ],
  );

  const openFile = useCallback(async () => {
    try {
      const list = await platformOpenFiles();
      if (list?.length) await ingestFiles(list);
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : '파일을 열 수 없습니다.');
    }
  }, [ingestFiles]);

  // Lightweight open hook (full E2E API registered after goPage/removeFromLibrary)
  useEffect(() => {
    (window as unknown as { __onjeomE2EOpen?: (paths: string[]) => Promise<void> }).__onjeomE2EOpen =
      async (paths: string[]) => {
        const list = await platformOpenPaths(paths);
        if (list?.length) await ingestFiles(list);
      };
    return () => {
      delete (window as unknown as { __onjeomE2EOpen?: unknown }).__onjeomE2EOpen;
    };
  }, [ingestFiles]);

  const exportPdf = useCallback(async () => {
    if (!doc) return;
    setExporting(true);
    try {
      const blob = await exportAnnotatedPdf(doc, annApi.ann, theme, {
        vector: settings.vectorPdfExport,
        pressureCurve: settings.pressureCurve,
      });
      const name = `${doc.title.replace(/[\\/:*?"<>|]/g, '_')}-annotated.pdf`;
      const buf = await blob.arrayBuffer();
      const result = await platformSaveBinary(buf, name, 'application/pdf', [
        { name: 'PDF', extensions: ['pdf'] },
      ]);
      if (result !== 'cancelled') showToast(result === 'shared' ? t('toastShared') : t('toastPdfSaved'));
    } catch (e) {
      console.error(e);
      setError(e instanceof Error ? e.message : t('errPdf'));
    } finally {
      setExporting(false);
    }
  }, [doc, annApi.ann, theme, settings.vectorPdfExport, settings.pressureCurve, showToast, t]);

  /** Export annotated PDF with a user-set open password. */
  const exportPdfProtected = useCallback(() => {
    if (!doc) return;
    setPwdPrompt({ kind: 'export' });
  }, [doc]);

  const exportJson = useCallback(async () => {
    if (!doc) return;
    const text = exportAnnotationsJson(doc, annApi.ann);
    const name = `${doc.title.replace(/[\\/:*?"<>|]/g, '_')}-ann.json`;
    const result = await platformSaveText(text, name, 'application/json');
    if (result !== 'cancelled') showToast(t('toastJsonSaved'));
  }, [doc, annApi.ann, showToast]);

  const importJson = useCallback(async () => {
    try {
      const text = await platformOpenJson();
      if (!text) return;
      const parsed = JSON.parse(text) as { annotations?: DocAnn; document?: { id?: string } };
      const ann = parsed.annotations || (parsed as unknown as DocAnn);
      const id = parsed.document?.id || doc?.id;
      if (!id || !ann) throw new Error('유효하지 않은 필기 파일');
      annApi.setDocAnn(id, ann);
      showToast(t('toastJsonImported'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'JSON 가져오기 실패');
    }
  }, [annApi, doc?.id, showToast]);

  const exportPng = useCallback(async () => {
    if (!doc) return;
    setExporting(true);
    try {
      const blob = await exportPagePng(
        doc,
        page,
        annApi.ann,
        theme,
        settings.pressureCurve,
      );
      const name = `${doc.title}-p${page + 1}.png`;
      const buf = await blob.arrayBuffer();
      const result = await platformSaveBinary(buf, name, 'image/png', [
        { name: 'PNG', extensions: ['png'] },
      ]);
      if (result !== 'cancelled') showToast(t('toastPngSaved'));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'PNG 실패');
    } finally {
      setExporting(false);
    }
  }, [doc, page, annApi.ann, theme, settings.pressureCurve, showToast]);

  const pickAnnFolder = useCallback(async () => {
    const folder = await platformPickFolder();
    if (folder) {
      patch({ annSyncFolder: folder, autoSyncAnn: true });
      await annApi.importFolder(folder);
      showToast(t('toastFolderSet'));
    } else if (detectPlatform() !== 'electron') {
      showToast(isAndroid() ? t('toastAndroidAuto') : t('toastFolderDesktopOnly'));
    }
  }, [annApi, patch, showToast, t]);

  // Menu bindings
  useEffect(() => {
    const offs: Array<() => void> = [];
    const a = window.onjeom;
    if (!a) return;
    if (a.onMenuOpenFile) offs.push(a.onMenuOpenFile(() => void openFile()));
    if (a.onMenuExportPdf) offs.push(a.onMenuExportPdf(() => void exportPdf()));
    if (a.onMenuExportJson) offs.push(a.onMenuExportJson(() => void exportJson()));
    if (a.onMenuImportJson) offs.push(a.onMenuImportJson(() => void importJson()));
    if (a.onMenuPickAnnFolder) offs.push(a.onMenuPickAnnFolder(() => void pickAnnFolder()));
    if (a.onMenuSettings) offs.push(a.onMenuSettings(() => setSettingsOpen(true)));
    if (a.onMenuShortcuts) offs.push(a.onMenuShortcuts(() => setShortcutsOpen(true)));
    if (a.onMenuUndo) offs.push(a.onMenuUndo(() => annApi.undo()));
    if (a.onMenuRedo) offs.push(a.onMenuRedo(() => annApi.redoAct()));
    return () => offs.forEach((f) => f());
  }, [openFile, exportPdf, exportJson, importJson, pickAnnFolder, annApi]);

  // Drag & drop
  useEffect(() => {
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = async (e: DragEvent) => {
      e.preventDefault();
      const fl = e.dataTransfer?.files;
      if (!fl?.length) return;
      const files: {
        path?: string;
        name: string;
        ext: string;
        data: string | ArrayBuffer;
        isText: boolean;
      }[] = [];
      for (const file of Array.from(fl)) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const textExts = new Set(['md', 'markdown', 'txt']);
        // Electron may expose path
        const fpath = (file as File & { path?: string }).path;
        if (fpath && window.onjeom?.readFile) {
          files.push(await window.onjeom.readFile(fpath));
        } else if (textExts.has(ext)) {
          files.push({
            name: file.name,
            ext: ext === 'markdown' ? 'md' : ext,
            data: await file.text(),
            isText: true,
          });
        } else {
          files.push({
            name: file.name,
            ext,
            data: await file.arrayBuffer(),
            isText: false,
          });
        }
      }
      await ingestFiles(files);
    };
    window.addEventListener('dragover', onDragOver);
    window.addEventListener('drop', onDrop);
    return () => {
      window.removeEventListener('dragover', onDragOver);
      window.removeEventListener('drop', onDrop);
    };
  }, [ingestFiles]);

  const goPage = useCallback(
    (p: number, opts?: { heading?: string }) => {
      if (!doc) return;
      let np = Math.max(0, Math.min(doc.pages.length - 1, Math.floor(Number(p) || 0)));
      if (mode === 'spread') np -= np % 2;
      setPage(np);
      // Scroll into view (scroll/reflow/single) after paint
      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          let target: Element | null = null;
          if (opts?.heading) {
            const headings = document.querySelectorAll('[data-heading]');
            for (const el of headings) {
              if ((el.getAttribute('data-heading') || '') === opts.heading) {
                target = el;
                break;
              }
            }
          }
          if (!target) {
            target =
              document.querySelector(`[data-page-root="${doc.id}-${np}"]`) ||
              document.querySelector(`.reflow-section[data-page="${np}"]`);
          }
          target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    },
    [doc, mode],
  );

  /** Remove from in-app library only — never deletes the original file on disk. */
  const removeFromLibrary = useCallback(
    (id: string) => {
      setLibrary((lib) => {
        const next = lib.filter((d) => d.id !== id);
        persistMeta(next);
        setDocId((cur) => {
          if (cur !== id && next.some((d) => d.id === cur)) return cur;
          return next[0]?.id || '';
        });
        return next;
      });
      setPage(0);
      showToast(t('toastRemovedFromLib'));
    },
    [persistMeta, showToast, t],
  );

  // Playwright functional E2E API (after goPage / removeFromLibrary exist)
  useEffect(() => {
    type E2EApi = {
      open: (paths: string[]) => Promise<void>;
      getState: () => Record<string, unknown>;
      setTool: (t: Tool) => void;
      setMode: (m: ViewMode) => void;
      goPage: (p: number, heading?: string) => void;
      addTestStroke: () => void;
      addTestShape: () => void;
      undo: () => void;
      redo: () => void;
      toggleMark: () => void;
      toggleHighlight: (sentId?: string) => void;
      exportPdfBase64: (password?: string) => Promise<{
        ok: boolean;
        bytes: number;
        b64head: string;
        error?: string;
      }>;
      removeActiveFromLibrary: () => void;
      ensureRightPanel: (tab?: 'toc' | 'search' | 'highlights' | 'notes') => void;
      setZoom: (z: number) => void;
    };

    const api: E2EApi = {
      open: async (paths: string[]) => {
        const list = await platformOpenPaths(paths);
        if (list?.length) await ingestFiles(list);
      },
      getState: () => {
        const pa = annApi.pageAnn(page);
        return {
          page,
          pages: doc?.pages.length ?? 0,
          mode,
          tool,
          fmt: doc?.fmt ?? '',
          title: doc?.title ?? '',
          libraryCount: library.length,
          strokeCount: pa.strokes?.length ?? 0,
          shapeCount: pa.shapes?.length ?? 0,
          noteCount: pa.notes?.length ?? 0,
          canUndo: annApi.canUndo,
          canRedo: annApi.canRedo,
          marked: !!(doc && (annApi.ann.marks || []).includes(page)),
          showRightPanel: settings.showRightPanel,
          rightPanelTab: settings.rightPanelTab,
          error,
        };
      },
      setTool: (t) => setTool(t),
      setMode: (m) => setMode(m),
      goPage: (p, heading) => goPage(p, heading ? { heading } : undefined),
      addTestStroke: () => {
        if (!doc) return;
        annApi.pushHist();
        annApi.addStroke(page, {
          tool: 'pen',
          c: penColor,
          w: penW,
          pts: [
            { x: 80, y: 120, p: 0.5 },
            { x: 140, y: 160, p: 0.7 },
            { x: 200, y: 140, p: 0.4 },
          ],
          pressure: true,
        });
      },
      addTestShape: () => {
        if (!doc) return;
        annApi.pushHist();
        annApi.addShape(page, {
          shape: 'rect',
          x0: 60,
          y0: 80,
          x1: 180,
          y1: 160,
          c: penColor,
          w: 2,
        });
      },
      undo: () => annApi.undo(),
      redo: () => annApi.redoAct(),
      toggleMark: () => {
        annApi.pushHist();
        annApi.toggleMark(page);
      },
      toggleHighlight: (sentId) => {
        annApi.pushHist();
        const id = sentId || `${doc?.id || 'doc'}|${page}|0|0`;
        annApi.toggleHighlight(id, hlColor);
      },
      exportPdfBase64: async (password) => {
        if (!doc) return { ok: false, bytes: 0, b64head: '', error: 'no doc' };
        try {
          const blob = await exportAnnotatedPdf(doc, annApi.ann, theme, {
            vector: settings.vectorPdfExport,
            pressureCurve: settings.pressureCurve,
            userPassword: password,
          });
          const buf = new Uint8Array(await blob.arrayBuffer());
          let binary = '';
          const n = Math.min(buf.length, 64);
          for (let i = 0; i < n; i++) binary += String.fromCharCode(buf[i]);
          return {
            ok: buf.length > 100 && buf[0] === 0x25,
            bytes: buf.length,
            b64head: btoa(binary).slice(0, 40),
          };
        } catch (e) {
          return {
            ok: false,
            bytes: 0,
            b64head: '',
            error: e instanceof Error ? e.message : String(e),
          };
        }
      },
      removeActiveFromLibrary: () => {
        if (doc) removeFromLibrary(doc.id);
      },
      ensureRightPanel: (tab = 'toc') => {
        patch({ showRightPanel: true, rightPanelTab: tab });
      },
      setZoom: (z) => setZoom(Math.max(0.5, Math.min(2, z))),
    };

    const w = window as unknown as {
      __onjeomE2EOpen?: (paths: string[]) => Promise<void>;
      __onjeomE2E?: E2EApi;
    };
    w.__onjeomE2EOpen = api.open;
    w.__onjeomE2E = api;
    return () => {
      delete w.__onjeomE2E;
    };
  }, [
    ingestFiles,
    annApi,
    page,
    doc,
    mode,
    tool,
    library.length,
    penColor,
    penW,
    hlColor,
    theme,
    settings.vectorPdfExport,
    settings.pressureCurve,
    settings.showRightPanel,
    settings.rightPanelTab,
    error,
    goPage,
    removeFromLibrary,
    patch,
  ]);

  const nav = useCallback(
    (dir: number) => {
      if (!doc) return;
      if (mode === 'reflow' || mode === 'scroll') {
        goPage(page + dir);
        return;
      }
      const step = mode === 'spread' ? 2 : 1;
      goPage(page + dir * step);
    },
    [doc, mode, page, goPage],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === 'TEXTAREA' || tag === 'INPUT';
      if (e.key === 'Escape') {
        setSettingsOpen(false);
        setShortcutsOpen(false);
        setGotoOpen(false);
        if (!typing) setTool('select');
        return;
      }
      if (typing) return;

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) annApi.redoAct();
        else annApi.undo();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        void openFile();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        void exportPdf();
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        setSettingsOpen(true);
        return;
      }
      if ((e.metaKey || e.ctrlKey) && e.key === '/') {
        e.preventDefault();
        setShortcutsOpen(true);
        return;
      }
      if (e.key === 'ArrowRight') nav(1);
      if (e.key === 'ArrowLeft') nav(-1);
      if (e.key === 'Home') goPage(0);
      if (e.key === 'End' && doc) goPage(doc.pages.length - 1);
      if (e.key.toLowerCase() === 'b' && doc) {
        annApi.pushHist();
        annApi.toggleMark(page);
      }
      if (e.key.toLowerCase() === 'f') {
        searchRef.current?.focus();
      }
      if (e.key.toLowerCase() === 't') {
        patch({ showRightPanel: true, rightPanelTab: 'toc' });
      }
      if (e.key.toLowerCase() === 'g') {
        setGotoOpen(true);
        setGotoVal(String(page + 1));
      }
      const toolMap: Record<string, Tool> = {
        '1': 'select',
        '2': 'texthl',
        '3': 'hl',
        '4': 'pen',
        '5': 'line',
        '6': 'eraser',
        '7': 'shape',
        '8': 'note',
        '9': 'laser',
      };
      if (toolMap[e.key]) setTool(toolMap[e.key]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [annApi, openFile, exportPdf, nav, goPage, doc, page, patch]);

  // Apply chrome theme to body
  useEffect(() => {
    document.documentElement.style.setProperty('--chrome', theme.chrome);
    document.documentElement.style.setProperty('--chrome-border', theme.chromeBorder);
    document.documentElement.style.setProperty('--chrome-text', theme.chromeText);
    document.body.style.background = theme.desk;
  }, [theme]);

  // Startup path diagnostics (packaged Electron)
  useEffect(() => {
    void (async () => {
      console.info('[onjeom] location', window.location.href);
      console.info('[onjeom] bridge', !!window.onjeom, window.onjeomReady);
      if (window.onjeom?.ping) {
        try {
          console.info('[onjeom] ping', await window.onjeom.ping());
        } catch (e) {
          console.error('[onjeom] ping failed', e);
        }
      }
      if (window.onjeom?.paths) {
        try {
          console.info('[onjeom] paths', await window.onjeom.paths());
        } catch (e) {
          console.error('[onjeom] paths failed', e);
        }
      }
    })();
  }, []);

  const filteredLib = useMemo(() => {
    let list = library.slice();
    const q = (libQuery || settings.libraryQuery).trim().toLowerCase();
    if (q) {
      list = list.filter(
        (d) =>
          d.title.toLowerCase().includes(q) ||
          d.sub.toLowerCase().includes(q) ||
          d.fmt.toLowerCase().includes(q) ||
          (d.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (d.folder || '').toLowerCase().includes(q),
      );
    }
    if (settings.libraryFormatFilter !== 'all') {
      list = list.filter((d) => d.fmt === settings.libraryFormatFilter);
    }
    if (settings.libraryFolderFilter !== 'all') {
      list = list.filter((d) => (d.folder || '미분류') === settings.libraryFolderFilter);
    }
    if (settings.librarySort === 'title') {
      list.sort((a, b) => a.title.localeCompare(b.title, 'ko'));
    } else if (settings.librarySort === 'format') {
      list.sort((a, b) => a.fmt.localeCompare(b.fmt) || a.title.localeCompare(b.title, 'ko'));
    } else {
      list.sort((a, b) => (b.lastOpened || b.addedAt || 0) - (a.lastOpened || a.addedAt || 0));
    }
    list.sort((a, b) => Number(!!b.favorite) - Number(!!a.favorite));
    return list;
  }, [library, libQuery, settings.libraryQuery, settings.libraryFormatFilter, settings.libraryFolderFilter, settings.librarySort]);

  const folders = useMemo(() => {
    const set = new Set<string>(['미분류']);
    library.forEach((d) => set.add(d.folder || '미분류'));
    return Array.from(set);
  }, [library]);

  const len = doc?.pages.length ?? 0;
  const ann = annApi.ann;
  const marked = doc ? (ann.marks || []).includes(page) : false;

  // Empty library: still show chrome + open prompt (no sample docs)
  if (!doc) {
    return (
      <div
        className={`app-shell theme-${settings.readingTheme}${settings.compactUi ? ' compact' : ''}${isAndroid() ? ' android' : ''}`}
        style={{ background: theme.desk, color: theme.chromeText }}
        data-testid="app-shell-empty"
      >
        <header
          className="topbar"
          style={{ background: theme.chrome, borderColor: theme.chromeBorder }}
          data-testid="topbar"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="logo-dot" style={{ background: accent }} />
            <div className="brand" style={{ color: theme.ink }} data-testid="brand">
              {t('appName')}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            className="open-btn"
            data-testid="open-doc"
            onClick={() => void openFile()}
          >
            {t('openDoc')}
          </button>
          <button type="button" className="open-btn" onClick={() => setSettingsOpen(true)}>
            {t('settings')}
          </button>
        </header>
        <main
          className="desk"
          data-testid="empty-desk"
          style={{
            background: theme.desk,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 16,
            padding: 40,
          }}
        >
          <div
            style={{ fontSize: 18, fontWeight: 600, color: theme.ink }}
            data-testid="empty-title"
          >
            {t('emptyDoc')}
          </div>
          <div style={{ fontSize: 13, color: theme.muted, textAlign: 'center', maxWidth: 360 }}>
            PDF · MD · EPUB · DOCX · PPTX · HTML · TXT
          </div>
          <button
            type="button"
            className="open-btn primary"
            data-testid="open-doc-primary"
            style={{ background: accent, color: '#fff', padding: '12px 28px', fontSize: 14 }}
            onClick={() => void openFile()}
          >
            {t('openDoc')}
          </button>
          {(loading || error) && (
            <div style={{ marginTop: 12, color: error ? '#a04030' : theme.muted }}>
              {error || t('loading')}
            </div>
          )}
        </main>
        <PasswordModal
          open={!!pwdPrompt && pwdPrompt.kind === 'unlock'}
          mode="unlock"
          theme={theme}
          fileName={pwdPrompt?.kind === 'unlock' ? pwdPrompt.file.name : undefined}
          errorHint={pwdPrompt?.kind === 'unlock' ? pwdPrompt.hint : null}
          onSubmit={(p) => void onPasswordSubmit(p)}
          onCancel={() => {
            if (pwdPrompt?.kind === 'unlock' && pwdPrompt.done.length) {
              commitModels(pwdPrompt.done);
            }
            setPwdPrompt(null);
          }}
        />
        <SettingsModal
          open={settingsOpen}
          settings={settings}
          onClose={() => setSettingsOpen(false)}
          onPatch={patch}
          onPickAnnFolder={() => void pickAnnFolder()}
          onReset={reset}
        />
        {(loading || exporting) && (
          <div className="loading-overlay">{exporting ? t('exporting') : t('loading')}</div>
        )}
        {toast && <div className="toast">{toast}</div>}
      </div>
    );
  }

  const visible =
    mode === 'spread'
      ? [page, page + 1].filter((p) => p < len)
      : mode === 'scroll'
        ? Array.from({ length: len }, (_, i) => i)
        : mode === 'reflow'
          ? []
          : [page];

  const avail = Math.max(300, (deskW || 1200) - 44 * 2 - 12);
  const rowW = mode === 'spread' && visible.length > 1 ? PAGE_W * 2 + 12 : PAGE_W;
  const zCap = mode === 'scroll' || mode === 'reflow' ? 1.5 : Math.max(0.4, avail / rowW);
  const effectiveZoom = Math.min(zoom, zCap);

  const canPrev = page > 0 && mode !== 'scroll' && mode !== 'reflow';
  const canNext =
    page + (mode === 'spread' ? 2 : 1) < len && mode !== 'scroll' && mode !== 'reflow';
  const pct = len > 1 ? (page / (len - 1)) * 100 : 100;
  const pageLabel =
    mode === 'scroll'
      ? t('scrollLabel', { total: len })
      : mode === 'reflow'
        ? t('reflowLabel', { current: page + 1, total: len })
        : t('pageOf', {
            current:
              mode === 'spread'
                ? `${page + 1}–${Math.min(page + 2, len)}`
                : page + 1,
            total: len,
          });

  const setDocFolder = (id: string, folder: string) => {
    setLibrary((lib) => {
      const next = lib.map((d) => (d.id === id ? { ...d, folder } : d));
      persistMeta(next);
      return next;
    });
  };

  const toggleFavorite = (id: string) => {
    setLibrary((lib) => {
      const next = lib.map((d) => (d.id === id ? { ...d, favorite: !d.favorite } : d));
      persistMeta(next);
      return next;
    });
  };

  return (
    <div
      className={`app-shell theme-${settings.readingTheme}${settings.compactUi ? ' compact' : ''}${isAndroid() ? ' android' : ''}`}
      style={{ background: theme.desk, color: theme.chromeText }}
      data-testid="app-shell"
      data-doc-fmt={doc.fmt}
      data-doc-pages={String(len)}
    >
      <header
        className="topbar"
        style={{ background: theme.chrome, borderColor: theme.chromeBorder }}
        data-testid="topbar"
      >
        <button type="button" className="top-btn" title={t('library')} onClick={() => setSidebar((s) => !s)}>
          <IconMenu />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="logo-dot" style={{ background: accent }} />
          <div className="brand" style={{ color: theme.ink }} data-testid="brand">
            {t('appName')}
          </div>
        </div>
        <div className="v-div" style={{ background: theme.chromeBorder }} />
        <span className="fmt-chip" style={{ background: FMT_COLORS[doc.fmt] }} data-testid="fmt-chip">
          {doc.fmt}
        </span>
        <div className="doc-title" style={{ color: theme.chromeText }} data-testid="doc-title">
          {doc.title}
        </div>
        <div style={{ flex: 1 }} />
        <button type="button" className="open-btn" data-testid="open-doc" onClick={() => void openFile()}>
          {t('openDoc')}
        </button>
        <button type="button" className="open-btn" onClick={() => void exportPdf()} disabled={exporting}>
          {t('exportPdf')}
        </button>
        <button
          type="button"
          className="open-btn"
          data-testid="export-pdf-password-top"
          onClick={() => exportPdfProtected()}
          disabled={exporting}
          title={t('exportPdfPassword')}
        >
          {t('exportPdfPasswordShort')}
        </button>
        <button type="button" className="open-btn" onClick={() => setSettingsOpen(true)}>
          {t('settings')}
        </button>
        <div className="seg-group" style={{ background: theme.rule }}>
          {(
            [
              ['single', 'modeSingle'],
              ['spread', 'modeSpread'],
              ['scroll', 'modeScroll'],
              ['reflow', 'modeReflow'],
            ] as const
          ).map(([m, labelKey]) => (
            <button
              key={m}
              type="button"
              data-testid={`mode-${m}`}
              className={`seg-btn${mode === m ? ' active' : ''}`}
              onClick={() => {
                setMode(m);
                if (m === 'spread') setPage((p) => p - (p % 2));
              }}
            >
              {t(labelKey)}
            </button>
          ))}
        </div>
        <div className="zoom-group" style={{ background: theme.rule }}>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
          >
            −
          </button>
          <button
            type="button"
            className="zoom-label"
            title={t('fitWidth')}
            onClick={() => setZoom(Math.min(1.8, zCap))}
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="zoom-btn"
            onClick={() => setZoom((z) => Math.min(2, Math.round((z + 0.1) * 10) / 10))}
          >
            +
          </button>
        </div>
        <button
          type="button"
          className="top-btn"
          title={t('bookmark')}
          style={{ color: marked ? accent : theme.muted }}
          onClick={() => {
            annApi.pushHist();
            annApi.toggleMark(page);
          }}
        >
          <IconBookmark filled={marked} />
        </button>
        <button
          type="button"
          className="top-btn"
          title={t('rightPanel')}
          onClick={() => patch({ showRightPanel: !settings.showRightPanel })}
        >
          ▥
        </button>
      </header>

      <div className="body-row">
        {sidebar && (
          <aside
            className="sidebar"
            style={{ background: theme.sidebar, borderColor: theme.chromeBorder }}
          >
            <div className="sidebar-scroll">
              <div className="side-label">{t('library')}</div>
              <input
                ref={searchRef}
                className="search-input side-search"
                placeholder={t('searchLibrary')}
                value={libQuery}
                onChange={(e) => setLibQuery(e.target.value)}
              />
              <div className="lib-filters">
                <select
                  value={settings.libraryFormatFilter}
                  onChange={(e) =>
                    patch({
                      libraryFormatFilter: e.target.value as DocFormat | 'all',
                    })
                  }
                >
                  <option value="all">{t('allFormats')}</option>
                  {(['MD', 'PDF', 'EPUB', 'DOCX', 'PPTX', 'HTML', 'TXT'] as DocFormat[]).map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={settings.libraryFolderFilter}
                  onChange={(e) => patch({ libraryFolderFilter: e.target.value })}
                >
                  <option value="all">{t('allFolders')}</option>
                  {folders.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <select
                  value={settings.librarySort}
                  onChange={(e) =>
                    patch({
                      librarySort: e.target.value as 'recent' | 'title' | 'format',
                    })
                  }
                >
                  <option value="recent">{t('sortRecent')}</option>
                  <option value="title">{t('sortTitle')}</option>
                  <option value="format">{t('sortFormat')}</option>
                </select>
              </div>
              <div className="doc-list">
                {filteredLib.map((d) => {
                  const act = d.id === doc.id;
                  return (
                    <div
                      key={d.id}
                      className={`doc-item${act ? ' active' : ''}`}
                      onClick={() => selectDoc(d.id)}
                      style={
                        act
                          ? { background: theme.paper, borderColor: theme.rule }
                          : undefined
                      }
                    >
                      <div className="doc-icon" style={{ color: FMT_COLORS[d.fmt] }}>
                        {d.fmt}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 0, flex: 1 }}>
                        <div className="doc-item-title" style={{ color: theme.ink }}>
                          {d.favorite ? '★ ' : ''}
                          {d.title}
                        </div>
                        <div className="doc-item-sub">
                          {d.pages.length}
                          {t('pages')} · {d.folder || t('folderUncategorized')}
                        </div>
                      </div>
                      <div className="doc-item-actions" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="mini-icon"
                          title={t('favorite')}
                          onClick={() => toggleFavorite(d.id)}
                        >
                          {d.favorite ? '★' : '☆'}
                        </button>
                        <select
                          className="mini-select"
                          value={d.folder || t('folderUncategorized')}
                          onChange={(e) => setDocFolder(d.id, e.target.value)}
                          title={t('allFolders')}
                        >
                          {folders
                            .concat([
                              t('folderNovel'),
                              t('folderWork'),
                              t('folderStudy'),
                              t('folderMemo'),
                            ])
                            .filter((v, i, a) => a.indexOf(v) === i)
                            .map((f) => (
                              <option key={f} value={f}>
                                {f}
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          className="mini-icon danger"
                          data-testid="lib-remove"
                          title={t('removeFromLibraryHint')}
                          onClick={() => {
                            if (window.confirm(t('removeFromLibraryConfirm'))) {
                              removeFromLibrary(d.id);
                            }
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="side-label">{t('bookmarks')}</div>
              {(ann.marks || []).length > 0 ? (
                <div>
                  {[...(ann.marks || [])]
                    .sort((a, b) => a - b)
                    .map((p) => (
                      <div key={p} className="mark-item" onClick={() => goPage(p)}>
                        <div className="mark-dot" style={{ background: accent }} />
                        <div>
                          {t('pageN', { n: p + 1 })} · {doc.title}
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="empty-marks">
                  {t('noBookmarks')} {t('bookmarksHint')}
                </div>
              )}
              <div className="side-label">{t('export')}</div>
              <div className="export-btns">
                <button type="button" className="open-btn block" onClick={() => void exportPdf()}>
                  {t('exportPdfAnn')}
                </button>
                <button
                  type="button"
                  className="open-btn block"
                  data-testid="export-pdf-password"
                  onClick={() => exportPdfProtected()}
                >
                  {t('exportPdfPassword')}
                </button>
                <button type="button" className="open-btn block" onClick={() => void exportPng()}>
                  {t('exportPng')}
                </button>
                <button type="button" className="open-btn block" onClick={() => void exportJson()}>
                  {t('exportJson')}
                </button>
                <button type="button" className="open-btn block" onClick={() => void importJson()}>
                  {t('importJson')}
                </button>
              </div>
            </div>
            <div className="sidebar-foot" style={{ borderColor: theme.chromeBorder }}>
              {t('sideNoteAuto')}
              {settings.annSyncFolder
                ? ` · ${t('autoSaveFolder')} ${annApi.syncStatus === 'ok' ? '✓' : annApi.syncStatus === 'saving' ? '…' : ''}`
                : ` · ${t('autoSaveLocal')}`}
            </div>
          </aside>
        )}

        <main className="desk" ref={deskRef} style={{ background: theme.desk }}>
          <div
            className={`desk-scroll${mode === 'scroll' || mode === 'reflow' ? ' scroll-mode' : ''}`}
            onScroll={
              mode === 'scroll'
                ? (e) => {
                    const el = e.currentTarget;
                    const approx = Math.round(
                      (el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight)) *
                        (len - 1),
                    );
                    if (approx !== page && approx >= 0 && approx < len) setPage(approx);
                  }
                : undefined
            }
          >
            {mode === 'reflow' ? (
              <div className="reflow-wrap" style={{ width: Math.min(720, avail) * effectiveZoom }}>
                <div style={{ transform: `scale(${effectiveZoom})`, transformOrigin: 'top center' }}>
                  <ReflowView
                    doc={doc}
                    theme={theme}
                    fontScale={settings.fontScale}
                    tool={tool}
                    hlMap={ann.hl || {}}
                    onToggleSent={(id) => {
                      annApi.pushHist();
                      annApi.toggleHighlight(id, hlColor);
                    }}
                    onPageHint={(p) => setPage(p)}
                  />
                </div>
              </div>
            ) : (
              <div className={`desk-row${mode === 'scroll' ? ' col' : ''}`}>
                {visible.map((pi) => (
                  <DocumentPage
                    key={`${doc.id}-${pi}`}
                    doc={doc}
                    pageIndex={pi}
                    zoom={effectiveZoom}
                    theme={theme}
                    texture={settings.pageTexture}
                    accent={accent}
                    tool={tool}
                    hlColor={hlColor}
                    penColor={penColor}
                    penW={penW}
                    shapeKind={shapeKind}
                    noteColor={noteColor}
                    marked={(ann.marks || []).includes(pi)}
                    ann={annApi.pageAnn(pi)}
                    hlMap={ann.hl || {}}
                    fontScale={settings.fontScale}
                    pressureOn={settings.pressureSensitivity}
                    pressureCurve={settings.pressureCurve}
                    onToggleSent={(id) => {
                      annApi.pushHist();
                      annApi.toggleHighlight(id, hlColor);
                    }}
                    onPushHist={annApi.pushHist}
                    onAddStroke={annApi.addStroke}
                    onAddShape={annApi.addShape}
                    onAddNote={annApi.addNote}
                    onUpdateNote={annApi.updateNote}
                    onRemoveNote={annApi.removeNote}
                    onEraseAt={annApi.eraseAt}
                    onToolSelect={() => setTool('select')}
                  />
                ))}
              </div>
            )}
          </div>

          {mode !== 'scroll' && mode !== 'reflow' && (
            <>
              <button
                type="button"
                className="nav-btn prev"
                disabled={!canPrev}
                onClick={() => canPrev && nav(-1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="nav-btn next"
                disabled={!canNext}
                onClick={() => canNext && nav(1)}
              >
                ›
              </button>
            </>
          )}

          <Toolbar
            tool={tool}
            accent={accent}
            hlColor={hlColor}
            penColor={penColor}
            penW={penW}
            shapeKind={shapeKind}
            noteColor={noteColor}
            canUndo={annApi.canUndo}
            canRedo={annApi.canRedo}
            pressureOn={settings.pressureSensitivity}
            onTool={(nextTool) => {
              if (
                mode === 'reflow' &&
                ['pen', 'hl', 'eraser', 'shape', 'note', 'line', 'laser'].includes(nextTool)
              ) {
                showToast(t('toastInkPageMode'));
                setMode('single');
              }
              setTool(nextTool);
            }}
            onHlColor={setHlColor}
            onPenColor={setPenColor}
            onPenW={setPenW}
            onShapeKind={setShapeKind}
            onNoteColor={setNoteColor}
            onUndo={annApi.undo}
            onRedo={annApi.redoAct}
            onClearPage={() => {
              if (confirm(t('clearPageConfirm'))) {
                annApi.pushHist();
                annApi.clearPage(page);
              }
            }}
          />

          <div
            className="page-pill"
            data-testid="page-pill"
            style={{ borderColor: theme.chromeBorder, color: theme.muted }}
          >
            {pageLabel}
          </div>
          <div className="progress-track">
            <div className="progress-fill" style={{ width: `${pct}%`, background: accent }} />
          </div>

          {settings.showThumbnails && mode !== 'scroll' && mode !== 'reflow' && (
            <ThumbStrip
              doc={doc}
              page={page}
              marks={ann.marks || []}
              theme={theme}
              accent={accent}
              onGo={goPage}
            />
          )}

          {(loading || exporting) && (
            <div className="loading-overlay">
              {exporting ? t('exporting') : t('loading')}
            </div>
          )}
          {error && (
            <div className="loading-overlay" style={{ background: 'rgba(251,246,233,0.92)' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ marginBottom: 12 }}>{error}</div>
                <button type="button" className="open-btn" onClick={() => setError(null)}>
                  {t('close')}
                </button>
              </div>
            </div>
          )}
        </main>

        {settings.showRightPanel && (
          <RightPanel
            doc={doc}
            ann={ann}
            settings={settings}
            theme={theme}
            accent={accent}
            onGoPage={(p, heading) => goPage(p, heading ? { heading } : undefined)}
            onPatch={patch}
            onRemoveHighlight={(id) => {
              annApi.pushHist();
              annApi.removeHighlight(id);
            }}
          />
        )}
      </div>

      <PasswordModal
        open={!!pwdPrompt}
        mode={pwdPrompt?.kind === 'export' ? 'export' : 'unlock'}
        theme={theme}
        fileName={
          pwdPrompt?.kind === 'unlock'
            ? pwdPrompt.file.name
            : doc
              ? `${doc.title}.pdf`
              : undefined
        }
        errorHint={pwdPrompt?.kind === 'unlock' ? pwdPrompt.hint : null}
        onSubmit={(p) => void onPasswordSubmit(p)}
        onCancel={() => {
          if (pwdPrompt?.kind === 'unlock' && pwdPrompt.done.length) {
            commitModels(pwdPrompt.done);
          }
          setPwdPrompt(null);
        }}
      />
      <SettingsModal
        open={settingsOpen}
        settings={settings}
        onClose={() => setSettingsOpen(false)}
        onPatch={patch}
        onPickAnnFolder={() => void pickAnnFolder()}
        onReset={reset}
      />
      <ShortcutsModal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        accent={accent}
      />

      {gotoOpen && (
        <div className="modal-backdrop" onClick={() => setGotoOpen(false)}>
          <div className="modal-card small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <h2>{t('gotoPage')}</h2>
            </div>
            <input
              className="search-input"
              autoFocus
              value={gotoVal}
              onChange={(e) => setGotoVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const n = parseInt(gotoVal, 10);
                  if (Number.isFinite(n)) goPage(n - 1);
                  setGotoOpen(false);
                }
              }}
              placeholder={`1 – ${len}`}
            />
            <div className="modal-actions">
              <button
                type="button"
                className="open-btn primary"
                style={{ background: accent, color: '#fff' }}
                onClick={() => {
                  const n = parseInt(gotoVal, 10);
                  if (Number.isFinite(n)) goPage(n - 1);
                  setGotoOpen(false);
                }}
              >
                {t('goto')}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}


