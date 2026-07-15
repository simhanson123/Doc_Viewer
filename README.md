# Onjeom (온점)

**MIT License** · Multi-format document viewer with freehand annotation.

[![Release](https://img.shields.io/github/v/release/simhanson123/Doc_Viewer)](https://github.com/simhanson123/Doc_Viewer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Read **Markdown, HTML, PDF, EPUB, DOCX, PPTX, and plain text** (ASCII, UTF-8, and many legacy encodings), then annotate with pen, stylus pressure, highlighter, shapes, and sticky notes.

**Primary target:** Windows · also Linux & Android (in progress).

Repository: [github.com/simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

> **Current release: v0.4.10** — use **v0.4.10 or newer**.  
> - Formats: **MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB**  
> - **Encrypted PDF** open (password) · export annotated PDF with optional open-password  
> - MD/HTML/DOCX → PDF export keeps Hangul/CJK (canvas, not broken Helvetica)  
> - **Contents (TOC)** jumps to page/heading  
> - **Library remove** from list only — never deletes files on disk  
> - **20 UI languages** · empty library at start (no sample books)

Full docs: [docs/en](./docs/en/README.md) · [docs/ko](./docs/ko/README.md) · [all languages](./docs/README.md)

---

## Screenshots — reading themes (colors)

Same layout, **different colors** so you can pick by taste.  
Each theme uses a different major UI language.

<p align="center">
  <img src="docs/screenshots/theme-cream.png" alt="Cream theme · Korean UI" width="48%" />
  <img src="docs/screenshots/theme-white.png" alt="White theme · English UI" width="48%" />
</p>
<p align="center"><b>Cream · 한국어</b> &nbsp;&nbsp;|&nbsp;&nbsp; <b>White · English</b></p>

<p align="center">
  <img src="docs/screenshots/theme-dark.png" alt="Dark theme · Japanese UI" width="48%" />
  <img src="docs/screenshots/theme-sepia.png" alt="Sepia theme · Simplified Chinese UI" width="48%" />
</p>
<p align="center"><b>Dark · 日本語</b> &nbsp;&nbsp;|&nbsp;&nbsp; <b>Sepia · 简体中文</b></p>

Themes in the app: **Cream · White · Dark · Sepia · Night** (Settings → Reading theme).  
Full album: [docs/screenshots](docs/screenshots/README.md)

---

## Documentation (all languages)

| Language | Docs |
|----------|------|
| **English** | [docs/en](./docs/en/README.md) |
| 한국어 | [docs/ko](./docs/ko/README.md) |
| 日本語 | [docs/ja](./docs/ja/README.md) |
| 简体中文 | [docs/zh-Hans](./docs/zh-Hans/README.md) |
| 繁體中文 | [docs/zh-Hant](./docs/zh-Hant/README.md) |
| Español | [docs/es](./docs/es/README.md) |
| Français | [docs/fr](./docs/fr/README.md) |
| Deutsch | [docs/de](./docs/de/README.md) |
| Italiano | [docs/it](./docs/it/README.md) |
| Português | [docs/pt](./docs/pt/README.md) |
| Русский | [docs/ru](./docs/ru/README.md) |
| Українська | [docs/uk](./docs/uk/README.md) |
| Polski | [docs/pl](./docs/pl/README.md) |
| Nederlands | [docs/nl](./docs/nl/README.md) |
| Türkçe | [docs/tr](./docs/tr/README.md) |
| العربية | [docs/ar](./docs/ar/README.md) |
| हिन्दी | [docs/hi](./docs/hi/README.md) |
| ไทย | [docs/th](./docs/th/README.md) |
| Tiếng Việt | [docs/vi](./docs/vi/README.md) |
| Bahasa Indonesia | [docs/id](./docs/id/README.md) |

Index: [docs/README.md](./docs/README.md)

Each language folder includes `README.md`, `USER_GUIDE.md`, and `BUILD.md` for **v0.4.10**.

---

## Quick start (Windows)

### Download

[GitHub Releases](https://github.com/simhanson123/Doc_Viewer/releases) → **v0.4.10+**

### Build

```bash
npm install
npm run test:loaders          # encoding / PDF header offline
npm run test:formats          # generate + experiment PDF/EPUB/DOCX/PPTX/HTML fixtures
npm run electron:build:win
npm run smoke:packaged        # EXE boot (blank-UI guard)
npm run test:e2e              # Playwright Electron QA (not a product feature)
npm run release:win           # full release gate
```

| Output | Description |
|--------|-------------|
| `release/온점-*-win-x64.exe` | NSIS installer |
| `release/온점-*-win-portable.exe` | Portable |
| `release/win-unpacked/온점.exe` | Unpacked |

### Develop

```bash
npm run dev
```

Open files with **Open** / `Ctrl+O` or drag-and-drop.  
Formats: `.md` `.txt` `.html` `.pdf` `.epub` `.docx` `.pptx` (+ text/code via **All files**)

### Text encodings

ASCII · UTF-8 (± BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

### PDF / packaging notes

Production app loads UI via **`onjeom://app/`** (not raw `file://` asar).  
PDF worker: Blob URL from protocol fetch, with main-process base64 fallback.  
Encrypted PDFs: password dialog in the app.  
See [docs/en/BUILD.md](./docs/en/BUILD.md).

### QA tools (developers only)

| Tool | Role |
|------|------|
| `test:loaders` / `test:formats` / `smoke:packaged` | Offline & packaged checks |
| **Playwright** (`test:e2e`) | Automated Electron checks — **verification only**, not an in-app user feature |

---

## Features (v0.4.10)

- Reading: single · spread · scroll · reflow  
- Themes: cream · white · dark · sepia · night  
- Annotation + undo/redo + local auto-save  
- Export: annotated PDF · **password-protected PDF** · PNG · JSON  
- **Open encrypted PDFs** (password dialog)  
- **TOC / Contents** navigation  
- **Library remove** without deleting disk files  
- MD/HTML/DOCX → PDF export with Hangul/CJK intact  
- **20 UI languages** (Settings → Language)  
- World-script reading fonts  
- **No sample documents** — empty library until you open a file  

---

## Other platforms

```bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
```

---

## Docs maintenance

When product behavior changes, update `scripts/sync-locale-docs.mjs` then:

```bash
npm run docs:sync
```

---

## License

[MIT](./LICENSE) © Onjeom Contributors / [simhanson123](https://github.com/simhanson123)
