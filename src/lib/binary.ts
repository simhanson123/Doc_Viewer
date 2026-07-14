/** Decode payloads coming from Electron IPC, File API, or raw buffers. */

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const clean = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const clean = b64.replace(/^data:[^;]+;base64,/, '').replace(/\s/g, '');
  const binary = atob(clean);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export function toArrayBuffer(
  data: string | ArrayBuffer | Uint8Array | ArrayBufferView,
  encoding?: 'utf8' | 'base64' | string,
): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data.slice(0);
  if (ArrayBuffer.isView(data)) {
    const v = data as ArrayBufferView;
    const copy = new Uint8Array(v.byteLength);
    copy.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
    return copy.buffer;
  }
  if (typeof data === 'string') {
    if (encoding === 'base64' || (encoding !== 'utf8' && looksLikeBase64(data))) {
      try {
        return base64ToArrayBuffer(data);
      } catch {
        /* fall through */
      }
    }
    // utf8 string → bytes
    return new TextEncoder().encode(data).buffer;
  }
  throw new Error('Unsupported binary payload');
}

function looksLikeBase64(s: string): boolean {
  if (s.length < 8) return false;
  // long base64 without whitespace is typical for IPC binary
  if (s.includes(' ') || s.includes('\n') || s.includes('#')) return false;
  // PDF base64 often starts with JVBERi ( %PDF )
  if (s.startsWith('JVBERi')) return true;
  if (s.length % 4 !== 0) return false;
  return /^[A-Za-z0-9+/]+=*$/.test(s.slice(0, 200));
}

export function arrayBufferToBase64(buf: ArrayBuffer): string {
  const u8 = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < u8.length; i += chunk) {
    binary += String.fromCharCode(...u8.subarray(i, i + chunk));
  }
  return btoa(binary);
}
