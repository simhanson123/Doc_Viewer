/** Decode payloads coming from Electron IPC, File API, or raw buffers. */

export function base64ToArrayBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

export function toArrayBuffer(
  data: string | ArrayBuffer | Uint8Array | ArrayBufferView,
  encoding?: 'utf8' | 'base64' | string,
): ArrayBuffer {
  if (data instanceof ArrayBuffer) return data;
  if (ArrayBuffer.isView(data)) {
    const v = data as ArrayBufferView;
    const copy = new Uint8Array(v.byteLength);
    copy.set(new Uint8Array(v.buffer, v.byteOffset, v.byteLength));
    return copy.buffer;
  }
  if (typeof data === 'string') {
    if (encoding === 'base64' || looksLikeBase64(data)) {
      try {
        return base64ToArrayBuffer(data);
      } catch {
        /* fall through to text */
      }
    }
    return new TextEncoder().encode(data).buffer;
  }
  throw new Error('지원하지 않는 바이너리 데이터 형식');
}

function looksLikeBase64(s: string): boolean {
  if (s.length < 8 || s.length % 4 !== 0) return false;
  // Avoid treating short markdown as base64
  if (s.includes(' ') || s.includes('\n') || s.includes('#')) return false;
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
