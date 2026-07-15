# Onjeom — English

Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**Current release:** v0.4.10

- [User guide](./USER_GUIDE.md)
- [Build guide](./BUILD.md)
- [All languages](../README.md)

## What is Onjeom?

| | |
|--|--|
| **Formats** | MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB |
| **Text encodings** | ASCII · UTF-8 (BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · more |
| **Modes** | Single · spread · scroll · reflow |
| **Ink** | Pen (pressure) · highlighter · shapes · sticky notes · laser · eraser |
| **Export** | Annotated PDF · password-protected PDF · PNG · annotations JSON |
| **Library** | Empty at start; remove from list without deleting disk files |
| **Platforms** | **Windows** (primary) · Linux · Android (in progress) |

- **Formats:** MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB  
- **Encrypted PDF:** open with password; export annotated PDF **with** optional open-password  
- **Export PDF** from MD/HTML/DOCX keeps Hangul/CJK (canvas path — not broken Helvetica)  
- **Contents (TOC)** jumps to page/heading  
- **Library remove** removes from the in-app list only — **never deletes** the original file on disk  
- **20 UI languages** · world-script body fonts  
- Empty library at start (no sample books)

## Screenshots — reading themes (colors)

Same document, **different desk/paper colors**. UI language differs per theme.

| Cream · 한국어 | White · English |
|----------------|-----------------|
| ![Cream](../screenshots/theme-cream.png) | ![White](../screenshots/theme-white.png) |

| Dark · 日本語 | Sepia · 简体中文 |
|---------------|------------------|
| ![Dark](../screenshots/theme-dark.png) | ![Sepia](../screenshots/theme-sepia.png) |

App themes: Cream · White · Dark · Sepia · Night (Settings).  
Album: [screenshots/](../screenshots/README.md)

## Supported formats (v0.4.10)

| Format | Extensions | Notes |
|--------|------------|--------|
| Markdown | `.md` `.markdown` | Headings, lists, code; TOC from headings |
| Plain text | `.txt` `.text` `.asc` `.ascii` `.log` `.csv` … | Encoding auto-detect |
| HTML | `.html` `.htm` | Structured reading (not raw tags) |
| PDF | `.pdf` | pdf.js canvas; **encrypted PDFs** open with password dialog |
| Word | `.docx` | OOXML via mammoth |
| PowerPoint | `.pptx` | One slide ≈ one page |
| EPUB | `.epub` | Chapters paginated |

**Text encodings:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

Open with **Open** / `Ctrl+O` or drag-and-drop. Use **All files** for unusual extensions.

## Install (Windows)

1. Open [Releases](https://github.com/simhanson123/Doc_Viewer/releases) (**v0.4.10+**).
2. Download installer (`*-win-x64.exe`) or portable (`*-win-portable.exe`).
3. Run → **Open** or `Ctrl+O` → MD / TXT / HTML / PDF / DOCX / PPTX / EPUB.

> Prefer **v0.4.10 or newer**. Builds 0.4.0–0.4.1 had PDF path/worker issues; use current release.

## Develop

```bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
```

Full release gate (typecheck → loaders → formats → build → packaged smoke → E2E):

```bash
npm run release:win
```

## How document loading works (paths)

| Layer | Role |
|-------|------|
| UI | Custom protocol `onjeom://app/…` (not `file://` asar) |
| Preload | `preload.cjs` → `window.onjeom` bridge |
| Open file | Main reads **raw bytes** → **base64** over IPC |
| Text (MD/TXT/ASC/HTML/…) | Renderer detects encoding → JS string |
| PDF | pdf.js + worker via fetch Blob or main-process IPC fallback; password prompt when encrypted |
| DOCX / PPTX / EPUB | ZIP/OOXML/EPUB parsers on the same base64 bytes |

## UI language

**Settings → Language** — 20 locales.  
Body fonts cover major world scripts (CJK, Arabic, Devanagari, Thai, Hebrew, Cyrillic, …).

## License

[MIT](../../LICENSE)
