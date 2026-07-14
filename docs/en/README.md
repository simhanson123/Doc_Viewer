# Onjeom — English

Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**Current release:** v0.4.7

- [User guide](./USER_GUIDE.md)
- [Build guide](./BUILD.md)
- [All languages](../README.md)

## What is Onjeom?

| | |
|--|--|
| **Formats** | MD · TXT · PDF · EPUB · DOCX |
| **Text encodings** | ASCII · UTF-8 (BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · more |
| **Modes** | Single · spread · scroll · reflow |
| **Ink** | Pen (pressure) · highlighter · shapes · sticky notes · laser · eraser |
| **Export** | Annotated PDF · PNG · annotations JSON |
| **Platforms** | **Windows** (primary) · Linux · Android (scaffold) |

The library starts **empty** — open your own files (no demo books).

## Supported formats (v0.4.7)

| Format | Extensions | Notes |
|--------|------------|--------|
| Markdown | `.md` `.markdown` | Headings, lists, code |
| Plain text | `.txt` `.text` `.asc` `.ascii` `.log` `.csv` … | Encoding auto-detect |
| HTML | `.html` `.htm` | Structured reading (not raw tags) |
| PDF | `.pdf` | pdf.js canvas; encrypted OK with password |
| Word | `.docx` | OOXML via mammoth |
| PowerPoint | `.pptx` | One slide ≈ one page |
| EPUB | `.epub` | Chapters paginated |

**Text encodings:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

Open with **Open** / `Ctrl+O` or drag-and-drop. Use **All files** for unusual extensions.

## Install (Windows)

1. Open [Releases](https://github.com/simhanson123/Doc_Viewer/releases) (**v0.4.7+**).
2. Download installer (`*-win-x64.exe`) or portable (`*-win-portable.exe`).
3. Run → **Open** or `Ctrl+O` → choose a PDF / MD / TXT / DOCX / EPUB.

> Prefer **v0.4.7 or newer**. Earlier 0.4.0–0.4.1 builds had PDF path/worker issues.

## Develop

```bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
```

## How document loading works (paths)

| Layer | Role |
|-------|------|
| UI | Custom protocol `onjeom://app/…` (not `file://` asar) |
| Preload | `preload.cjs` → `window.onjeom` bridge |
| Open file | Main reads **raw bytes** → **base64** over IPC |
| Text (MD/TXT/ASC/…) | Renderer detects encoding → JS string |
| PDF | pdf.js + worker via fetch Blob or main-process IPC fallback |
| DOCX/EPUB | ZIP/OOXML/EPUB parsers on the same base64 bytes |

## UI language

**Settings → Language** — 20 locales.  
Body fonts cover major world scripts (CJK, Arabic, Devanagari, Thai, Hebrew, Cyrillic, …).

## License

[MIT](../../LICENSE)
