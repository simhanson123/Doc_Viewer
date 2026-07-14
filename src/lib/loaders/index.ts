import type { DocumentModel } from '@/types';
import { toArrayBuffer } from '@/lib/binary';
import { loadMarkdown, loadText } from './markdown';
import { loadPdf } from './pdf';
import { loadEpub } from './epub';
import { loadDocx } from './docx';

export type RawFile = {
  path?: string;
  name: string;
  ext: string;
  data: string | ArrayBuffer | Uint8Array;
  isText: boolean;
  encoding?: 'utf8' | 'base64';
};

function uid(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

export async function loadDocument(file: RawFile): Promise<DocumentModel> {
  const ext = (file.ext || '').toLowerCase().replace(/^\./, '');
  const base = {
    id: uid(ext || 'doc'),
    title: file.name.replace(/\.[^.]+$/, '') || file.name,
    path: file.path,
  };

  try {
    if (ext === 'md' || ext === 'markdown') {
      return loadMarkdown(String(file.data), base);
    }
    if (ext === 'txt') {
      return loadText(String(file.data), base);
    }
    if (ext === 'pdf') {
      const enc = file.encoding || (file.isText ? 'utf8' : 'base64');
      const buf = toArrayBuffer(file.data, enc);
      console.info('[onjeom load] PDF', {
        name: file.name,
        encoding: enc,
        inType: typeof file.data,
        outBytes: buf.byteLength,
        path: file.path,
      });
      if (buf.byteLength < 8) {
        throw new Error(`PDF too small (${buf.byteLength} bytes) — open path / IPC may be broken`);
      }
      const head = new Uint8Array(buf, 0, Math.min(5, buf.byteLength));
      const magic = String.fromCharCode(...head);
      if (!magic.startsWith('%PDF')) {
        throw new Error(
          `Not a valid PDF (header="${magic}"). encoding=${enc} bytes=${buf.byteLength}`,
        );
      }
      return loadPdf(buf, base);
    }
    if (ext === 'epub') {
      const buf = toArrayBuffer(file.data, file.encoding || 'base64');
      return loadEpub(buf, base);
    }
    if (ext === 'docx') {
      const buf = toArrayBuffer(file.data, file.encoding || 'base64');
      return loadDocx(buf, base);
    }

    // Fallback: treat as text
    return loadText(String(file.data), { ...base, title: file.name });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new Error(`「${file.name}」 열기 실패: ${msg}`);
  }
}
