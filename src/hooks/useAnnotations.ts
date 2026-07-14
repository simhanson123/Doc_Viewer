import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnnStore, DocAnn, PageAnn, Point, Shape, Stroke, StickyNote } from '@/types';
import { shapeHit, strokeHit } from '@/lib/geometry';
import { platformReadAllAnn, platformWriteAnn, isAndroid } from '@/platform';

const STORAGE_KEY = 'onjeom-ann-v1';

export function emptyAnn(): DocAnn {
  return { pages: {}, hl: {}, marks: [] };
}

function ensurePage(a: DocAnn, p: number): PageAnn {
  if (!a.pages[p]) a.pages[p] = { strokes: [], shapes: [], notes: [] };
  const pa = a.pages[p];
  pa.strokes = pa.strokes || [];
  pa.shapes = pa.shapes || [];
  pa.notes = pa.notes || [];
  return pa;
}

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

export function useAnnotations(
  docId: string,
  opts?: {
    syncFolder?: string | null;
    autoSync?: boolean;
    pathKey?: string;
  },
) {
  const [annStore, setAnnStore] = useState<AnnStore>(() => {
    try {
      const s = localStorage.getItem(STORAGE_KEY);
      return s ? (JSON.parse(s) as AnnStore) : {};
    } catch {
      return {};
    }
  });
  const [hist, setHist] = useState<{ id: string; snap: DocAnn }[]>([]);
  const [redo, setRedo] = useState<{ id: string; snap: DocAnn }[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'saving' | 'ok' | 'error'>('idle');
  const docIdRef = useRef(docId);
  docIdRef.current = docId;
  const storeRef = useRef(annStore);
  storeRef.current = annStore;

  // localStorage persist
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(annStore));
    } catch {
      /* quota */
    }
  }, [annStore]);

  // folder / native sync (debounced)
  useEffect(() => {
    if (!opts?.autoSync) return;
    const folder = opts.syncFolder;
    if (!folder && !isAndroid()) return;
    const t = window.setTimeout(async () => {
      setSyncStatus('saving');
      try {
        for (const [id, ann] of Object.entries(annStore)) {
          await platformWriteAnn(
            folder || 'android-data',
            id,
            JSON.stringify({
              key: id,
              version: 1,
              updatedAt: new Date().toISOString(),
              annotations: ann,
            }),
          );
        }
        setSyncStatus('ok');
      } catch {
        setSyncStatus('error');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [annStore, opts?.autoSync, opts?.syncFolder]);

  const importFolder = useCallback(async (folder: string | null) => {
    try {
      const all = await platformReadAllAnn(folder);
      setAnnStore((prev) => {
        const next = { ...prev };
        for (const [k, v] of Object.entries(all)) {
          next[k] = v as DocAnn;
        }
        return next;
      });
    } catch (e) {
      console.error(e);
    }
  }, []);

  const ann = annStore[docId] || emptyAnn();

  const pushHist = useCallback(() => {
    const id = docIdRef.current;
    const snap = clone(storeRef.current[id] || emptyAnn());
    setHist((h) => h.concat([{ id, snap }]).slice(-80));
    setRedo([]);
  }, []);

  const mutate = useCallback((fn: (a: DocAnn) => void) => {
    const id = docIdRef.current;
    setAnnStore((prev) => {
      const cur = clone(prev[id] || emptyAnn());
      cur.pages = cur.pages || {};
      cur.hl = cur.hl || {};
      cur.marks = cur.marks || [];
      fn(cur);
      return { ...prev, [id]: cur };
    });
  }, []);

  const undo = useCallback(() => {
    setHist((h) => {
      if (!h.length) return h;
      const last = h[h.length - 1];
      setAnnStore((prev) => {
        const back = clone(prev[last.id] || emptyAnn());
        setRedo((r) => r.concat([{ id: last.id, snap: back }]));
        return { ...prev, [last.id]: last.snap };
      });
      return h.slice(0, -1);
    });
  }, []);

  const redoAct = useCallback(() => {
    setRedo((r) => {
      if (!r.length) return r;
      const last = r[r.length - 1];
      setAnnStore((prev) => {
        const back = clone(prev[last.id] || emptyAnn());
        setHist((h) => h.concat([{ id: last.id, snap: back }]));
        return { ...prev, [last.id]: last.snap };
      });
      return r.slice(0, -1);
    });
  }, []);

  const resetHistory = useCallback(() => {
    setHist([]);
    setRedo([]);
  }, []);

  const setDocAnn = useCallback((id: string, docAnn: DocAnn) => {
    setAnnStore((prev) => ({ ...prev, [id]: docAnn }));
  }, []);

  const replaceStore = useCallback((store: AnnStore) => {
    setAnnStore(store);
  }, []);

  const addStroke = useCallback(
    (page: number, stroke: Stroke) => {
      mutate((a) => {
        ensurePage(a, page).strokes.push(stroke);
      });
    },
    [mutate],
  );

  const addShape = useCallback(
    (page: number, shape: Shape) => {
      mutate((a) => {
        ensurePage(a, page).shapes.push(shape);
      });
    },
    [mutate],
  );

  const addNote = useCallback(
    (page: number, note: StickyNote) => {
      mutate((a) => {
        ensurePage(a, page).notes.push(note);
      });
    },
    [mutate],
  );

  const updateNote = useCallback(
    (page: number, noteId: string, patch: Partial<StickyNote>) => {
      mutate((a) => {
        const n = ensurePage(a, page).notes.find((x) => x.id === noteId);
        if (n) Object.assign(n, patch);
      });
    },
    [mutate],
  );

  const removeNote = useCallback(
    (page: number, noteId: string) => {
      mutate((a) => {
        const pa = ensurePage(a, page);
        pa.notes = pa.notes.filter((x) => x.id !== noteId);
      });
    },
    [mutate],
  );

  const eraseAt = useCallback(
    (page: number, pt: Point) => {
      mutate((a) => {
        const pa = ensurePage(a, page);
        pa.strokes = pa.strokes.filter((s) => !strokeHit(s.pts, pt));
        pa.shapes = pa.shapes.filter((s) => !shapeHit(s, pt));
      });
    },
    [mutate],
  );

  const toggleHighlight = useCallback(
    (sentId: string, color: string) => {
      mutate((a) => {
        if (a.hl[sentId]) delete a.hl[sentId];
        else a.hl[sentId] = color;
      });
    },
    [mutate],
  );

  const removeHighlight = useCallback(
    (sentId: string) => {
      mutate((a) => {
        delete a.hl[sentId];
      });
    },
    [mutate],
  );

  const toggleMark = useCallback(
    (page: number) => {
      mutate((a) => {
        const i = a.marks.indexOf(page);
        if (i >= 0) a.marks.splice(i, 1);
        else a.marks.push(page);
      });
    },
    [mutate],
  );

  const clearPage = useCallback(
    (page: number) => {
      mutate((a) => {
        a.pages[page] = { strokes: [], shapes: [], notes: [] };
        // remove sentence highlights on this page
        for (const key of Object.keys(a.hl)) {
          if (key.includes(`|${page}|`)) delete a.hl[key];
        }
      });
    },
    [mutate],
  );

  const clearDoc = useCallback(() => {
    mutate((a) => {
      a.pages = {};
      a.hl = {};
      a.marks = [];
    });
  }, [mutate]);

  const pageAnn = useCallback(
    (p: number): PageAnn => ann.pages[p] || { strokes: [], shapes: [], notes: [] },
    [ann],
  );

  const listNotes = useCallback(() => {
    const out: { page: number; note: StickyNote }[] = [];
    for (const [pi, pa] of Object.entries(ann.pages || {})) {
      for (const n of pa.notes || []) out.push({ page: Number(pi), note: n });
    }
    return out.sort((a, b) => a.page - b.page);
  }, [ann]);

  return {
    ann,
    annStore,
    hist,
    redo,
    syncStatus,
    pushHist,
    undo,
    redoAct,
    resetHistory,
    setDocAnn,
    replaceStore,
    importFolder,
    addStroke,
    addShape,
    addNote,
    updateNote,
    removeNote,
    eraseAt,
    toggleHighlight,
    removeHighlight,
    toggleMark,
    clearPage,
    clearDoc,
    pageAnn,
    listNotes,
    canUndo: hist.length > 0,
    canRedo: redo.length > 0,
  };
}
