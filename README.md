# Onjeom (온점)

**MIT License** · Multi-format document viewer with freehand annotation.

[![Release](https://img.shields.io/github/v/release/simhanson123/Doc_Viewer)](https://github.com/simhanson123/Doc_Viewer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Read **Markdown, PDF, EPUB, DOCX, and plain text** (ASCII, UTF-8, and many legacy encodings), then annotate with pen, stylus pressure, highlighter, shapes, and sticky notes.

**Primary target:** Windows · also Linux & Android (in progress).

Repository: [github.com/simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

> **Use v0.4.4 or newer.**  
> - 0.4.0–0.4.1: blank PDF (`file://` + asar workers)  
> - 0.4.3: blank **entire UI** (`iconv-lite` pulled Node `require` into the renderer)

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

Each language folder includes `README.md`, `USER_GUIDE.md`, and `BUILD.md`.

---

## Quick start (Windows)

### Download

[GitHub Releases](https://github.com/simhanson123/Doc_Viewer/releases) → **v0.4.4+**

### Build

```bash
npm install
npm run test:loaders
npm run electron:build:win
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
Formats: `.md` `.txt` `.pdf` `.epub` `.docx`

### Text encodings

ASCII · UTF-8 (± BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

### PDF / packaging notes

Production app loads UI via **`onjeom://app/`** (not raw `file://` asar).  
PDF worker: Blob URL from protocol fetch, with main-process base64 fallback.  
See [docs/en/BUILD.md](./docs/en/BUILD.md).

---

## Features

- Reading: single · spread · scroll · reflow  
- Themes: cream · white · dark · sepia · night  
- Annotation + undo/redo + local auto-save  
- Export: annotated PDF · PNG · JSON  
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

## License

[MIT](./LICENSE) © Onjeom Contributors / [simhanson123](https://github.com/simhanson123)
