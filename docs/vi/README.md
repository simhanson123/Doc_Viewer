# Onjeom — Tiếng Việt

**v0.4.9** · Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

- [User guide](./USER_GUIDE.md)
- [Build](./BUILD.md)
- [All languages](../README.md) · [English (canonical)](../en/README.md)

## Formats & encodings (v0.4.9)

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

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases) → **v0.4.9+**
2. Installer or portable EXE
3. **Open** / `Ctrl+O` — PDF, MD, TXT, ASC, DOCX, EPUB, …

Library starts **empty** (no sample books).

## Develop

```bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
```

## Why a document might not show

| Format | Notes |
|--------|--------|
| PDF | Needs v0.4.9+ (`onjeom://` + pdf.js worker IPC) |
| TXT / MD / ASC | Multi-encoding auto-detect (ASCII, UTF-8, CP949, Shift_JIS, GBK, …) |
| DOCX | ZIP/OOXML + mammoth text extract |
| EPUB | ZIP + chapter extract |

Diagnostics: **Help → Path diagnostics**, **View → Developer tools** (`[onjeom]` logs).

Full detail: [en/USER_GUIDE](../en/USER_GUIDE.md) · [en/BUILD](../en/BUILD.md)

## UI language

**Settings → Language** — 20 locales including Tiếng Việt.

## License

[MIT](../../LICENSE)
