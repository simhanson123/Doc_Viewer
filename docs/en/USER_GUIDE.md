# Onjeom — User guide (English)

**v0.4.9**

## Open a document

- **Open** / `Ctrl+O`
- Drag & drop onto the window
- Supported: `.md` `.markdown` `.txt` `.text` `.asc` `.ascii` `.log` `.csv` `.html` `.htm` `.pdf` `.epub` `.docx` `.pptx` (plus many text/code types via **All files**)

The library starts empty. There are **no built-in sample books**.

### Text encodings (MD / TXT / ASC / LOG / HTML / …)

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

### Binary & structured formats

| Format | How it is shown |
|--------|------------------|
| **PDF** | Each page rendered to canvas (pdf.js). **Encrypted PDFs** ask for a password. |
| **HTML** | Structured reading view (not a raw tag dump). |
| **DOCX** | Converted to paragraphs/headings (mammoth). |
| **PPTX** | One slide ≈ one page. |
| **EPUB** | Chapters extracted and paginated. |

## Contents (TOC)

The right panel **Contents** list jumps to the matching page or heading (Markdown headings, PDF/EPUB structure when available).

## Library

- Opening a file adds it to the in-app library.
- **Remove from library** only removes the entry from the list.
- It does **not** delete the original file on disk.

## Reading modes

| Mode | Best for |
|------|----------|
| Single | Annotation + PDF |
| Spread | Two pages side by side |
| Scroll | Continuous pages |
| Reflow | Long MD/HTML/EPUB/DOCX reading (draw in Single/Spread) |

## Annotation tools

Select · text highlight · highlighter · pen (stylus pressure) · line · eraser · shapes · sticky note · laser · undo/redo.

## Export

- Annotated PDF (`Ctrl+E`) — Hangul/CJK preserved for MD/HTML/DOCX source via canvas path
- **Password-protected** annotated PDF (set open password)
- Current page PNG
- Annotations JSON import/export
- Desktop: optional sync folder for `.onjeom.json`

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| PDF blank | Use **v0.4.9+**. View → Developer tools → `[onjeom pdf]`. Help → Path diagnostics. |
| Encrypted PDF won’t open | Enter the correct password when prompted. |
| Garbled Korean/Japanese/Chinese text | Encoding is auto-detected; try re-saving as UTF-8. |
| PDF export garble (Hangul/CJK) | Use **v0.4.9+** (canvas export path). |
| TOC click does nothing | Ensure the document has headings/structure; try **v0.4.9+**. |
| File won’t open | Check extension; use All files filter. Error toast shows details. |
| Empty library | Normal — open a file with **Open**. |
| Want file gone from list only | Use remove-from-library (disk file stays). |
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
