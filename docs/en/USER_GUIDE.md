# Onjeom — User guide (English)

**v0.4.4**

## Open a document

- **Open** / `Ctrl+O`
- Drag & drop onto the window
- Supported: `.md` `.markdown` `.txt` `.text` `.asc` `.ascii` `.log` `.csv` `.pdf` `.epub` `.docx` (plus many text/code types via **All files**)

The library starts empty. There are **no built-in sample books**.

### Text encodings (MD / TXT / ASC / LOG / …)

Onjeom reads **raw file bytes** and detects encoding automatically:

| Encoding | Notes |
|----------|--------|
| ASCII | 7-bit English and symbols |
| UTF-8 | Default for modern files; BOM supported |
| UTF-16 LE/BE | Detected via BOM |
| Windows-1252 / ISO-8859-1 | Western European |
| EUC-KR / CP949 | Korean legacy |
| Shift_JIS | Japanese legacy |
| GBK / Big5 | Chinese simplified / traditional |
| Windows-1251 / 1256 | Cyrillic / Arabic legacy |

If a file still looks wrong, re-save it as UTF-8 in your editor and reopen.

### Binary formats

| Format | How it is shown |
|--------|------------------|
| **PDF** | Each page rendered to canvas (pdf.js). Images and text from the PDF appear as drawn. |
| **DOCX** | Converted to paragraphs/headings (mammoth). |
| **EPUB** | Chapters extracted and paginated. |

## Reading modes

| Mode | Best for |
|------|----------|
| Single | Annotation + PDF |
| Spread | Two pages side by side |
| Scroll | Continuous pages |
| Reflow | Long MD/EPUB/DOCX reading (draw in Single/Spread) |

## Annotation tools

Select · text highlight · highlighter · pen (stylus pressure) · line · eraser · shapes · sticky note · laser · undo/redo.

## Export

- Annotated PDF (`Ctrl+E`)
- Current page PNG
- Annotations JSON import/export
- Desktop: optional sync folder for `.onjeom.json`

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| PDF blank | Use **v0.4.4+**. View → Developer tools → look for `[onjeom pdf]`. Help → Path diagnostics. |
| Garbled Korean/Japanese/Chinese text | Encoding is auto-detected; try re-saving as UTF-8. |
| File won’t open | Check extension; use All files filter. Error toast shows details. |
| Empty library | Normal — open a file with **Open**. |
| TXT/MD looks empty | Confirm the file has content; empty files open as a placeholder. |

## Keyboard

| Shortcut | Action |
|----------|--------|
| `Ctrl+O` | Open |
| `Ctrl+E` | Export annotated PDF |
| `Ctrl+,` | Settings |
| `Ctrl+/` | Shortcuts |
| `←` `→` | Pages |
| `B` | Bookmark |
| `1`–`9` | Tools |

← [Overview](./README.md) · [Build](./BUILD.md)
