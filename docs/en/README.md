# Onjeom — English

Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

- [User guide](./USER_GUIDE.md)
- [Build guide](./BUILD.md)
- [All languages](../README.md)

## What is Onjeom?

Onjeom lets you **read** and **write on** documents:

| Formats | MD · TXT · PDF · EPUB · DOCX |
| Modes | Single page · spread · continuous scroll · reflow |
| Ink | Pen (pressure) · highlighter · text highlight · shapes · sticky notes · laser · eraser |
| Export | Annotated PDF · page PNG · annotations JSON |
| Platforms | **Windows** (primary) · Linux · Android (scaffold) |

## Install (Windows)

1. Open [Releases](https://github.com/simhanson123/Doc_Viewer/releases).
2. Download **installer** (`*-win-x64.exe`) or **portable** (`*-win-portable.exe`).
3. Run the app → **Open** or `Ctrl+O`.

## Develop

```bash
npm install
npm run dev                 # Electron + Vite
npm run electron:build:win  # Windows packages → release/
```

## UI language

**Settings → Language** — 20 locales (Korean, English, Japanese, Chinese, Spanish, French, German, Italian, …).  
Document body text supports major world scripts via Noto + system font fallbacks.

## License

[MIT](../../LICENSE)
