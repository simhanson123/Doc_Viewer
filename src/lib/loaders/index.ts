import type { DocumentModel } from '@/types';
import { toArrayBuffer, base64ToUint8Array } from '@/lib/binary';
import { decodeTextBytes, decodeTextFromBase64 } from '@/lib/encoding';
import { isTextExt } from '@/lib/textExts';
import { loadMarkdown, loadText } from './markdown';
import { loadPdf, isPdfPasswordError } from './pdf';
import { loadEpub } from './epub';
import { loadDocx } from './docx';

export { isPdfPasswordError, PdfPasswordError } from './pdf';

export type RawFile = {
  path?: string;
  name: string;
  ext: string;
  /** Prefer base64 of raw bytes for all types from Electron */
  data: string | ArrayBuffer | Uint8Array;
  isText: boolean;
  encoding?: 'utf8' | 'base64';
  byteLength?: number;
  /** Password for encrypted PDFs */
  password?: string;
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

/**
 * Resolve text content with multi-encoding support.
 * - If encoding is base64 (raw file bytes): detect charset
 * - If already a JS string: use as-is (assumed UTF-8 from browser FileReader)
 */
function resolveText(file: RawFile): { text: string; encoding: string } {
  if (typeof file.data === 'string' && file.encoding === 'base64') {
    const r = decodeTextFromBase64(file.data);
    console.info('[onjeom load] text decode', {
      name: file.name,
      encoding: r.encoding,
      confidence: r.confidence,
      chars: r.text.length,
    });
    return { text: r.text, encoding: r.encoding };
  }
  if (typeof file.data === 'string') {
    // Already decoded string (browser File.text() is UTF-8)
    return { text: file.data, encoding: 'utf-8' };
  }
  const u8 =
    file.data instanceof Uint8Array
      ? file.data
      : new Uint8Array(file.data);
  const r = decodeTextBytes(u8);
  console.info('[onjeom load] text decode bytes', {
    name: file.name,
    encoding: r.encoding,
    chars: r.text.length,
  });
  return { text: r.text, encoding: r.encoding };
}

export async function loadDocument(file: RawFile): Promise<DocumentModel> {
  const ext = (file.ext || '').toLowerCase().replace(/^\./, '');
  const base = {
    id: uid(ext || 'doc'),
    title: file.name.replace(/\.[^.]+$/, '') || file.name,
    path: file.path,
  };

  try {
    // ── Text-like formats ─────────────────────────────────────
    if (ext === 'md' || ext === 'markdown') {
      const { text, encoding } = resolveText(file);
      // Empty MD still opens (shows empty-page placeholder)
      const doc = loadMarkdown(text || '\n', base);
      doc.sub = `${doc.pages.length} pages · MD · ${encoding}`;
      return doc;
    }

    if (isTextExt(ext) || file.isText) {
      const { text, encoding } = resolveText(file);
      const doc = loadText(text || '(empty file)', base);
      doc.fmt =
        ext === 'txt' || ext === 'text' || ext === 'ascii' || ext === 'asc' || ext === 'log'
          ? 'TXT'
          : doc.fmt;
      doc.sub = `${doc.pages.length} pages · ${encoding}`;
      return doc;
    }

    // ── Binary formats ────────────────────────────────────────
    if (ext === 'pdf') {
      const enc = file.encoding || 'base64';
      const buf = toArrayBuffer(file.data, enc);
      console.info('[onjeom load] PDF', {
        name: file.name,
        encoding: enc,
        outBytes: buf.byteLength,
      });
      if (buf.byteLength < 8) {
        throw new Error(`PDF too small (${buf.byteLength} bytes)`);
      }
      const head = new Uint8Array(buf, 0, Math.min(5, buf.byteLength));
      const magic = String.fromCharCode(...head);
      if (!magic.startsWith('%PDF')) {
        // Maybe wrongly base64-decoded — try re-decode if string looked wrong
        throw new Error(
          `Not a valid PDF (header="${magic.replace(/[^\x20-\x7e]/g, '?')}"). bytes=${buf.byteLength}`,
        );
      }
      return loadPdf(buf, { ...base, password: file.password });
    }

    if (ext === 'epub') {
      const buf = toArrayBuffer(file.data, file.encoding || 'base64');
      if (buf.byteLength < 30) throw new Error('EPUB too small');
      // ZIP magic PK
      const z = new Uint8Array(buf, 0, 2);
      if (z[0] !== 0x50 || z[1] !== 0x4b) {
        throw new Error('Not a valid EPUB (missing ZIP header)');
      }
      return loadEpub(buf, base);
    }

    if (ext === 'docx') {
      const buf = toArrayBuffer(file.data, file.encoding || 'base64');
      if (buf.byteLength < 30) throw new Error('DOCX too small');
      const z = new Uint8Array(buf, 0, 2);
      if (z[0] !== 0x50 || z[1] !== 0x4b) {
        throw new Error('Not a valid DOCX (missing ZIP/OOXML header)');
      }
      return loadDocx(buf, base);
    }

    // Fallback: try as text with encoding detection
    if (typeof file.data === 'string' && file.encoding === 'base64') {
      const { text, encoding } = resolveText(file);
      const doc = loadText(text, { ...base, title: file.name });
      doc.sub = `decoded as ${encoding}`;
      return doc;
    }
    return loadText(String(file.data), { ...base, title: file.name });
  } catch (e) {
    // Preserve password errors so the UI can prompt (do not wrap)
    if (isPdfPasswordError(e)) throw e;
    const msg = e instanceof Error ? e.message : String(e);
    console.error('[onjeom load] failed', file.name, e);
    throw new Error(`${file.name}: ${msg}`);
  }
}

// re-export for tests
export { decodeTextBytes, base64ToUint8Array };
