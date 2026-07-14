# 온점 (Onjeom)

**MIT License** · Multi-format document viewer with freehand annotation.

> MD · PDF · EPUB · DOCX · TXT  
> Pen / stylus pressure · highlights · sticky notes · bookmarks  
> Windows · Linux · Android (in progress)

Repository: [github.com/simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

## Windows (primary target)

### Download / build

```bash
npm install
npm run electron:build:win
```

Artifacts in `release/`:

| File | Description |
|------|-------------|
| `온점-0.4.0-win-x64.exe` | NSIS installer |
| `온점-0.4.0-win-portable.exe` | Portable (no install) |
| `win-unpacked/온점.exe` | Unpacked app for testing |

### Develop

```bash
npm run dev
```

### Open documents

- **문서 열기** / `Ctrl+O`
- Drag & drop files onto the window
- Formats: `.md` `.txt` `.pdf` `.epub` `.docx`

## Features

- Reading modes: single · spread · scroll · reflow  
- Themes: cream · white · dark · sepia · night  
- Annotation tools + undo/redo + local auto-save  
- Export: annotated PDF · PNG · JSON  
- **UI languages (20):** KO EN JA ZH-Hans ZH-Hant ES FR DE IT PT RU UK PL NL TR AR HI TH VI ID  
- World-script reading fonts (CJK, Arabic, Devanagari, Thai, Hebrew, Cyrillic, …)

## Linux

```bash
npm run electron:build:linux            # on Linux / CI
npm run electron:build:linux-portable   # tar.gz (also from Windows)
```

## Android

Requires JDK 17 + Android Studio. See [docs/BUILD.md](./docs/BUILD.md).

```bash
npm run android:sync
npm run android:open
```

## License

[MIT](./LICENSE) © Onjeom Contributors / simhanson123
