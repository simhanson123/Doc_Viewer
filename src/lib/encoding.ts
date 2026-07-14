/**
 * Detect & decode text from raw bytes.
 * Supports: UTF-8 (with/without BOM), UTF-16 LE/BE, ASCII,
 * Windows-1252 / ISO-8859-1, EUC-KR (CP949), Shift_JIS, GBK, Big5, etc.
 */
import iconv from 'iconv-lite';

export type DetectedEncoding =
  | 'utf-8'
  | 'utf-8-bom'
  | 'utf-16le'
  | 'utf-16be'
  | 'ascii'
  | 'windows-1252'
  | 'euc-kr'
  | 'shift_jis'
  | 'gbk'
  | 'big5'
  | 'iso-8859-1'
  | string;

export type DecodeResult = {
  text: string;
  encoding: DetectedEncoding;
  confidence: 'high' | 'medium' | 'low';
};

function hasUtf8Bom(u8: Uint8Array): boolean {
  return u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf;
}

function hasUtf16LeBom(u8: Uint8Array): boolean {
  return u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe;
}

function hasUtf16BeBom(u8: Uint8Array): boolean {
  return u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff;
}

/** True if every byte is 0x00–0x7F */
function isPureAscii(u8: Uint8Array): boolean {
  for (let i = 0; i < u8.length; i++) {
    if (u8[i] > 0x7f) return false;
  }
  return true;
}

/**
 * Validate UTF-8 structure. Returns false if invalid sequences found.
 * Also counts multi-byte chars for confidence.
 */
function scoreUtf8(u8: Uint8Array): { valid: boolean; multiByte: number; errors: number } {
  let i = 0;
  let multiByte = 0;
  let errors = 0;
  while (i < u8.length) {
    const b = u8[i];
    if (b <= 0x7f) {
      i++;
      continue;
    }
    let need = 0;
    if ((b & 0xe0) === 0xc0) need = 1;
    else if ((b & 0xf0) === 0xe0) need = 2;
    else if ((b & 0xf8) === 0xf0) need = 3;
    else {
      errors++;
      i++;
      continue;
    }
    if (i + need >= u8.length) {
      errors++;
      break;
    }
    let ok = true;
    for (let j = 1; j <= need; j++) {
      if ((u8[i + j] & 0xc0) !== 0x80) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      errors++;
      i++;
      continue;
    }
    multiByte++;
    i += 1 + need;
  }
  return { valid: errors === 0, multiByte, errors };
}

function toNodeBuffer(u8: Uint8Array): Buffer {
  // Prefer real Buffer (Node / polyfill)
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(u8.buffer, u8.byteOffset, u8.byteLength);
  }
  // Extremely defensive fallback
  const b = new Uint8Array(u8.byteLength);
  b.set(u8);
  return b as unknown as Buffer;
}

function decodeWith(u8: Uint8Array, enc: string): string {
  return iconv.decode(toNodeBuffer(u8), enc);
}

/** Heuristic: count replacement-like / rare control chars after decode */
function garbageScore(text: string): number {
  let bad = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0xfffd) bad += 3; // replacement char
    else if (c < 0x09 || (c > 0x0d && c < 0x20 && c !== 0x1b)) bad += 1;
  }
  return bad / Math.max(1, text.length);
}

type ScriptCounts = {
  hangul: number;
  kana: number;
  cjk: number;
  cyr: number;
  arab: number;
  latinExt: number;
  printable: number;
  fffd: number;
};

function countScripts(text: string): ScriptCounts {
  let hangul = 0;
  let kana = 0;
  let cjk = 0;
  let cyr = 0;
  let arab = 0;
  let latinExt = 0;
  let printable = 0;
  let fffd = 0;
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    if (c === 0xfffd) {
      fffd++;
      continue;
    }
    if (c >= 0x20 || c === 0x09 || c === 0x0a || c === 0x0d) printable++;
    if (c >= 0xac00 && c <= 0xd7a3) hangul++;
    else if (c >= 0x3040 && c <= 0x30ff) kana++;
    else if (c >= 0x4e00 && c <= 0x9fff) cjk++;
    else if (c >= 0x0400 && c <= 0x04ff) cyr++;
    else if (c >= 0x0600 && c <= 0x06ff) arab++;
    else if ((c >= 0x00c0 && c <= 0x024f) || (c >= 0x1e00 && c <= 0x1eff)) latinExt++;
  }
  return { hangul, kana, cjk, cyr, arab, latinExt, printable, fffd };
}

type Cand = {
  label: DetectedEncoding;
  text: string;
  scripts: ScriptCounts;
  /** Higher is better; null = not viable for this family */
  quality: number | null;
};

/**
 * Quality for East-Asian multi-byte encodings.
 * Returns null when the decode is not a plausible match for that encoding.
 */
function multiByteQuality(label: DetectedEncoding, s: ScriptCounts): number | null {
  if (s.fffd > 0) return null;
  const nonAscii = s.hangul + s.kana + s.cjk + s.cyr + s.arab + s.latinExt;
  if (nonAscii === 0) return null;

  if (label === 'shift_jis') {
    // Hiragana/katakana is nearly unique to Japanese encodings
    if (s.kana >= 1) return 1000 + s.kana * 10 + s.cjk;
    if (s.cjk >= 1 && s.hangul === 0) return 50 + s.cjk;
    return null;
  }
  if (label === 'euc-kr') {
    if (s.hangul < 1) return null;
    // Hangul should dominate the non-ASCII mix (not Hangul sprinkled on Chinese)
    if (s.hangul / nonAscii < 0.45) return null;
    return s.hangul * 10 + s.cjk;
  }
  if (label === 'gbk') {
    if (s.cjk < 1) return null;
    if (s.kana > 0) return null;
    if (s.hangul / Math.max(1, s.cjk) > 0.25) return null;
    return s.cjk * 10;
  }
  if (label === 'big5') {
    if (s.cjk < 1) return null;
    if (s.kana > 0) return null;
    if (s.hangul / Math.max(1, s.cjk) > 0.25) return null;
    // Prefer GBK slightly on pure Simplified-looking text
    return s.cjk * 9;
  }
  return null;
}

function singleByteQuality(label: DetectedEncoding, s: ScriptCounts): number | null {
  if (s.fffd > 0) return null;
  if (s.hangul + s.kana + s.cjk > 0) return null; // never single-byte for CJK scripts

  if (label === 'windows-1252' || label === 'iso-8859-1') {
    if (s.latinExt < 1 && s.cyr < 1 && s.arab < 1) return 1; // pure extended ok
    if (s.latinExt >= 1 && s.latinExt >= s.cyr && s.latinExt >= s.arab) {
      return 100 + s.latinExt * 10;
    }
    // No Latin-1 letters but also no cyr/arab — still usable weak fallback
    if (s.cyr === 0 && s.arab === 0) return 5;
    return null;
  }
  if (label === 'windows-1251') {
    if (s.cyr < 1) return null;
    if (s.cyr >= s.latinExt) return 100 + s.cyr * 10;
    return null;
  }
  if (label === 'windows-1256') {
    if (s.arab < 1) return null;
    return 100 + s.arab * 10;
  }
  return null;
}

/**
 * Decode raw file bytes to a JS string with best-effort encoding detection.
 */
export function decodeTextBytes(input: ArrayBuffer | Uint8Array): DecodeResult {
  const u8 = input instanceof Uint8Array ? input : new Uint8Array(input);

  if (u8.byteLength === 0) {
    return { text: '', encoding: 'utf-8', confidence: 'high' };
  }

  // BOM paths — high confidence
  if (hasUtf8Bom(u8)) {
    return {
      text: decodeWith(u8.subarray(3), 'utf-8'),
      encoding: 'utf-8-bom',
      confidence: 'high',
    };
  }
  if (hasUtf16LeBom(u8)) {
    return {
      text: decodeWith(u8, 'utf-16le'),
      encoding: 'utf-16le',
      confidence: 'high',
    };
  }
  if (hasUtf16BeBom(u8)) {
    return {
      text: decodeWith(u8, 'utf-16be'),
      encoding: 'utf-16be',
      confidence: 'high',
    };
  }

  // Pure ASCII
  if (isPureAscii(u8)) {
    return {
      text: decodeWith(u8, 'ascii'),
      encoding: 'ascii',
      confidence: 'high',
    };
  }

  // Valid UTF-8 multi-byte
  const utf8 = scoreUtf8(u8);
  if (utf8.valid) {
    return {
      text: decodeWith(u8, 'utf-8'),
      encoding: 'utf-8',
      confidence: 'high',
    };
  }

  const multiLabels: { label: DetectedEncoding; iconv: string }[] = [
    { label: 'shift_jis', iconv: 'shift_jis' },
    { label: 'euc-kr', iconv: 'cp949' },
    { label: 'gbk', iconv: 'gbk' },
    { label: 'big5', iconv: 'big5' },
  ];
  const singleLabels: { label: DetectedEncoding; iconv: string }[] = [
    { label: 'windows-1252', iconv: 'windows-1252' },
    { label: 'windows-1251', iconv: 'windows-1251' },
    { label: 'windows-1256', iconv: 'windows-1256' },
    { label: 'iso-8859-1', iconv: 'iso-8859-1' },
  ];

  const tryDecode = (
    list: { label: DetectedEncoding; iconv: string }[],
    qualityFn: (label: DetectedEncoding, s: ScriptCounts) => number | null,
  ): Cand | null => {
    let best: Cand | null = null;
    for (const { label, iconv: iconvEnc } of list) {
      try {
        if (!iconv.encodingExists(iconvEnc)) continue;
        const text = decodeWith(u8, iconvEnc);
        const scripts = countScripts(text);
        const g = garbageScore(text);
        if (g > 0.05) continue;
        const quality = qualityFn(label, scripts);
        if (quality === null) continue;
        // Slight penalty for garbage
        const score = quality - g * 100;
        if (!best || score > (best.quality ?? -Infinity)) {
          best = { label, text, scripts, quality: score };
        }
      } catch {
        /* next */
      }
    }
    return best;
  };

  // Phase 1: East-Asian multi-byte (kana / hangul / han)
  const multi = tryDecode(multiLabels, multiByteQuality);
  if (multi && (multi.quality ?? 0) >= 50) {
    return {
      text: multi.text,
      encoding: multi.label,
      confidence: (multi.quality ?? 0) >= 1000 ? 'high' : 'medium',
    };
  }

  // Phase 2: single-byte Western / Cyrillic / Arabic
  const single = tryDecode(singleLabels, singleByteQuality);
  if (single) {
    return {
      text: single.text,
      encoding: single.label,
      confidence: (single.quality ?? 0) >= 100 ? 'medium' : 'low',
    };
  }

  // Phase 3: weak multi-byte fallback if any
  if (multi) {
    return { text: multi.text, encoding: multi.label, confidence: 'low' };
  }

  // Absolute last resort
  return {
    text: decodeWith(u8, 'latin1'),
    encoding: 'iso-8859-1',
    confidence: 'low',
  };
}

/** Decode from base64 file payload (IPC). */
export function decodeTextFromBase64(b64: string): DecodeResult {
  const clean = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  const bin = atob(clean);
  const u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return decodeTextBytes(u8);
}
