/**
 * Extensions treated as plain text (encoding auto-detect).
 * Keep in sync with electron/main.ts OPEN_FILTERS / textExts.
 */
export const TEXT_EXTS = new Set([
  'md',
  'markdown',
  'txt',
  'text',
  'ascii',
  'asc',
  'log',
  'csv',
  'tsv',
  'json',
  'xml',
  'html',
  'htm',
  'css',
  'js',
  'ts',
  'tsx',
  'jsx',
  'mjs',
  'cjs',
  'py',
  'rs',
  'go',
  'java',
  'c',
  'h',
  'cpp',
  'hpp',
  'cs',
  'rb',
  'php',
  'sh',
  'bat',
  'ps1',
  'yml',
  'yaml',
  'toml',
  'ini',
  'cfg',
  'conf',
  'nfo',
  'rst',
  'adoc',
  'tex',
  'srt',
  'vtt',
  'me',
  'readme',
]);

export function isTextExt(ext: string): boolean {
  const e = (ext || '').toLowerCase().replace(/^\./, '');
  if (TEXT_EXTS.has(e)) return true;
  // No extension → try as text when opened via All files
  if (!e) return false;
  return false;
}

/** Dialog / input accept list (without leading dots for Electron filters). */
export const OPEN_TEXT_EXTENSIONS = [
  'md',
  'markdown',
  'txt',
  'text',
  'ascii',
  'asc',
  'log',
  'csv',
  'tsv',
  'json',
  'xml',
  'html',
  'htm',
  'nfo',
  'rst',
  'ini',
  'cfg',
  'conf',
  'yml',
  'yaml',
];

export const OPEN_ALL_DOCUMENT_EXTENSIONS = [
  ...OPEN_TEXT_EXTENSIONS,
  'pdf',
  'epub',
  'docx',
];
