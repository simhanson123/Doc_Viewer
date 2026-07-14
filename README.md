# Onjeom (온점)

**MIT License** · Multi-format document viewer with freehand annotation.

[![Release](https://img.shields.io/github/v/release/simhanson123/Doc_Viewer)](https://github.com/simhanson123/Doc_Viewer/releases)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Read **Markdown, PDF, EPUB, DOCX, and plain text** — then annotate with pen, stylus pressure, highlighter, shapes, sticky notes, and bookmarks.

**Primary target:** Windows · also Linux & Android (in progress).

Repository: [github.com/simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

---

## Documentation (by language)

| Language | Guide |
|----------|--------|
| English | [docs/en](./docs/en/README.md) |
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

Full index: [docs/README.md](./docs/README.md)

---

## Quick start (Windows)

### Download

Get the latest installer or portable build from  
**[GitHub Releases](https://github.com/simhanson123/Doc_Viewer/releases)**.

### Build from source

```bash
npm install
npm run electron:build:win
```

| Output | Description |
|--------|-------------|
| `release/온점-*-win-x64.exe` | NSIS installer |
| `release/온점-*-win-portable.exe` | Portable (no install) |
| `release/win-unpacked/온점.exe` | Unpacked app |

### Development

```bash
npm run dev
```

Open documents with **Open** / `Ctrl+O`, or drag & drop files.  
Supported: `.md` `.txt` `.pdf` `.epub` `.docx`

---

## Features (summary)

- **Formats:** MD · TXT · PDF · EPUB · DOCX  
- **Reading:** single page · two-page spread · scroll · reflow  
- **Themes:** cream · white · dark · sepia · night  
- **Ink:** pen (stylus pressure curves) · highlighter · shapes · notes · laser · undo/redo  
- **Export:** annotated PDF · PNG · annotations JSON  
- **UI languages:** 20 locales (see in-app **Settings → Language**)  
- **Reading fonts:** major world scripts (CJK, Arabic, Devanagari, Thai, Hebrew, Cyrillic, …)

---

## Other platforms

```bash
# Linux (prefer Linux host or CI for AppImage/deb)
npm run electron:build:linux
npm run electron:build:linux-portable   # tar.gz

# Android (JDK 17 + Android Studio)
npm run android:sync
npm run android:open
```

Details: [docs/en/BUILD.md](./docs/en/BUILD.md)

---

## License

[MIT](./LICENSE) © Onjeom Contributors / [simhanson123](https://github.com/simhanson123)
