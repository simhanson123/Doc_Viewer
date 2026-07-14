/**
 * Keep every locale README / USER_GUIDE / BUILD in sync for the current version.
 * EN & KO get full structured content; other locales get a localized header +
 * English technical notes (so docs never lag the product).
 */
import { writeFileSync, readdirSync, existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = '0.4.9';
const DOCS = join(process.cwd(), 'docs');

const locales = readdirSync(DOCS, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

const META = {
  en: { name: 'English', title: 'Onjeom — English' },
  ko: { name: '한국어', title: '온점 (Onjeom) — 한국어' },
  ja: { name: '日本語', title: 'オン点 (Onjeom) — 日本語' },
  'zh-Hans': { name: '简体中文', title: 'Onjeom — 简体中文' },
  'zh-Hant': { name: '繁體中文', title: 'Onjeom — 繁體中文' },
  es: { name: 'Español', title: 'Onjeom — Español' },
  fr: { name: 'Français', title: 'Onjeom — Français' },
  de: { name: 'Deutsch', title: 'Onjeom — Deutsch' },
  it: { name: 'Italiano', title: 'Onjeom — Italiano' },
  pt: { name: 'Português', title: 'Onjeom — Português' },
  ru: { name: 'Русский', title: 'Onjeom — Русский' },
  uk: { name: 'Українська', title: 'Onjeom — Українська' },
  pl: { name: 'Polski', title: 'Onjeom — Polski' },
  nl: { name: 'Nederlands', title: 'Onjeom — Nederlands' },
  tr: { name: 'Türkçe', title: 'Onjeom — Türkçe' },
  ar: { name: 'العربية', title: 'Onjeom — العربية' },
  hi: { name: 'हिन्दी', title: 'Onjeom — हिन्दी' },
  th: { name: 'ไทย', title: 'Onjeom — ไทย' },
  vi: { name: 'Tiếng Việt', title: 'Onjeom — Tiếng Việt' },
  id: { name: 'Bahasa Indonesia', title: 'Onjeom — Bahasa Indonesia' },
};

const FORMATS_TABLE_EN = `| Format | Extensions | Notes |
|--------|------------|--------|
| Markdown | \`.md\` \`.markdown\` | Headings, lists, code |
| Plain text | \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` … | Encoding auto-detect |
| HTML | \`.html\` \`.htm\` | Structured reading (not raw tags) |
| PDF | \`.pdf\` | pdf.js canvas; encrypted OK with password |
| Word | \`.docx\` | OOXML via mammoth |
| PowerPoint | \`.pptx\` | One slide ≈ one page |
| EPUB | \`.epub\` | Chapters paginated |

**Text encodings:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

Open with **Open** / \`Ctrl+O\` or drag-and-drop. Use **All files** for unusual extensions.`;

function enReadme() {
  return `# Onjeom — English

Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**Current release:** v${VERSION}

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

## Supported formats (v${VERSION})

${FORMATS_TABLE_EN}

## Install (Windows)

1. Open [Releases](https://github.com/simhanson123/Doc_Viewer/releases) (**v${VERSION}+**).
2. Download installer (\`*-win-x64.exe\`) or portable (\`*-win-portable.exe\`).
3. Run → **Open** or \`Ctrl+O\` → choose a PDF / MD / TXT / DOCX / EPUB.

> Prefer **v${VERSION} or newer**. Earlier 0.4.0–0.4.1 builds had PDF path/worker issues.

## Develop

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
\`\`\`

## How document loading works (paths)

| Layer | Role |
|-------|------|
| UI | Custom protocol \`onjeom://app/…\` (not \`file://\` asar) |
| Preload | \`preload.cjs\` → \`window.onjeom\` bridge |
| Open file | Main reads **raw bytes** → **base64** over IPC |
| Text (MD/TXT/ASC/…) | Renderer detects encoding → JS string |
| PDF | pdf.js + worker via fetch Blob or main-process IPC fallback |
| DOCX/EPUB | ZIP/OOXML/EPUB parsers on the same base64 bytes |

## UI language

**Settings → Language** — 20 locales.  
Body fonts cover major world scripts (CJK, Arabic, Devanagari, Thai, Hebrew, Cyrillic, …).

## License

[MIT](../../LICENSE)
`;
}

function enUser() {
  return `# Onjeom — User guide (English)

**v${VERSION}**

## Open a document

- **Open** / \`Ctrl+O\`
- Drag & drop onto the window
- Supported: \`.md\` \`.markdown\` \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` \`.pdf\` \`.epub\` \`.docx\` (plus many text/code types via **All files**)

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

- Annotated PDF (\`Ctrl+E\`)
- Current page PNG
- Annotations JSON import/export
- Desktop: optional sync folder for \`.onjeom.json\`

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| PDF blank | Use **v${VERSION}+**. View → Developer tools → look for \`[onjeom pdf]\`. Help → Path diagnostics. |
| Garbled Korean/Japanese/Chinese text | Encoding is auto-detected; try re-saving as UTF-8. |
| File won’t open | Check extension; use All files filter. Error toast shows details. |
| Empty library | Normal — open a file with **Open**. |
| TXT/MD looks empty | Confirm the file has content; empty files open as a placeholder. |

## Keyboard

| Shortcut | Action |
|----------|--------|
| \`Ctrl+O\` | Open |
| \`Ctrl+E\` | Export annotated PDF |
| \`Ctrl+,\` | Settings |
| \`Ctrl+/\` | Shortcuts |
| \`←\` \`→\` | Pages |
| \`B\` | Bookmark |
| \`1\`–\`9\` | Tools |

← [Overview](./README.md) · [Build](./BUILD.md)
`;
}

function enBuild() {
  return `# Onjeom — Build guide (English)

**v${VERSION}** · macOS/iOS packaging is out of scope.

## Requirements

| Target | Tools |
|--------|--------|
| All | Node.js 20+ |
| Windows | Windows + npm |
| Linux AppImage/deb | Linux host or GitHub Actions |
| Android | JDK 17+, Android SDK, Android Studio |

## Windows

\`\`\`bash
npm install
npm run test:loaders
npm run electron:build:win
\`\`\`

Output: \`release/온점-<version>-win-x64.exe\`, portable, and \`win-unpacked/\`.

\`\`\`bash
npm run dev
\`\`\`

### Production path architecture (critical)

\`\`\`
Packaged layout
  resources/app.asar/
    dist/index.html
    dist/assets/*          (also unpacked under app.asar.unpacked)
    dist-electron/main.js
    dist-electron/preload.cjs

Load URL (production):  onjeom://app/index.html
Assets:                 onjeom://app/assets/...
Protocol:               privileged (fetch + workers + CORS)
Open file IPC:          always base64(raw bytes)
Text decode:            renderer TextDecoder (no Node require)
PDF worker:             fetch → Blob URL, else IPC pdfWorkerBase64 from main
\`\`\`

Do **not** load the UI via raw \`file://…/app.asar/…\` — workers break.

### Diagnostics

- Menu **Help → Path diagnostics…**
- **View → Developer tools** — logs prefixed with \`[onjeom]\`

## Tests

\`\`\`bash
npm run test:loaders   # ASCII/UTF-8/CP949/SJIS/GBK/PDF/DOCX/base64
npm run typecheck
\`\`\`

## Linux / Android

\`\`\`bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
\`\`\`

## Releases

\`\`\`bash
npm run electron:build:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
\`\`\`

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
`;
}

function koReadme() {
  return `# 온점 (Onjeom) — 한국어

필기 가능한 멀티 포맷 문서 뷰어.  
**라이선스:** MIT · **저장소:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**현재 버전:** v${VERSION}

- [사용 설명서](./USER_GUIDE.md)
- [빌드 가이드](./BUILD.md)
- [다른 언어](../README.md)

## 개요

| 항목 | 내용 |
|------|------|
| 포맷 | MD · TXT · PDF · EPUB · DOCX |
| 텍스트 인코딩 | ASCII · UTF-8 · UTF-16 · CP949 · Shift_JIS · GBK · Big5 · Windows-1252 등 |
| 읽기 | 낱장 · 펼침 · 스크롤 · 리플로우 |
| 필기 | 펜(필압) · 형광펜 · 도형 · 스티키 노트 등 |
| 플랫폼 | **Windows**(주력) · Linux · Android(준비 중) |

서재는 **비어 있는 상태**로 시작합니다. (샘플 책 없음)

## 지원 포맷 (v${VERSION})

| 포맷 | 확장자 | 비고 |
|------|--------|------|
| Markdown | \`.md\` \`.markdown\` | 제목·목록·코드 |
| 일반 텍스트 | \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` 등 | 인코딩 자동 감지 |
| PDF | \`.pdf\` | pdf.js 캔버스 |
| Word | \`.docx\` | mammoth |
| EPUB | \`.epub\` | 챕터 페이지 |

**문서 열기** / \`Ctrl+O\` 또는 드래그앤드롭. 특수 확장자는 **모든 파일**.

## Windows 설치

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases)에서 **v${VERSION} 이상** 받기  
2. 실행 → **문서 열기** / \`Ctrl+O\` → PDF·MD·TXT·DOCX·EPUB 선택  

> 0.4.0~0.4.1 은 PDF 경로 문제가 있었습니다. **${VERSION}+** 를 사용하세요.

## 개발

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
\`\`\`

## 문서가 안 보일 때

- **PDF**: 패키지 앱은 \`onjeom://\` 프로토콜 + PDF 워커 IPC 폴백 (v${VERSION}+)  
- **TXT/MD/ASC**: 바이트 기준 인코딩 자동 감지 (UTF-8, 한글 CP949, 일본어 Shift_JIS, 중국어 GBK 등)  
- **DOCX**: ZIP(OOXML) 검사 후 mammoth로 본문 추출  
- **도움말 → 경로 진단**, **보기 → 개발자 도구** 의 \`[onjeom]\` 로그 확인  

자세한 경로 구조: [영어 BUILD](../en/BUILD.md)

## 라이선스

[MIT](../../LICENSE)
`;
}

function koUser() {
  return `# 온점 — 사용 설명서 (한국어)

**v${VERSION}**

## 문서 열기

- **문서 열기** / \`Ctrl+O\` / 드래그 앤 드롭  
- 지원: \`.md\` \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` \`.pdf\` \`.epub\` \`.docx\` (기타 텍스트/코드는 **모든 파일**)  
- 시작 시 서재는 비어 있습니다.

### 텍스트 인코딩 (MD / TXT / ASC / …)

파일을 **원본 바이트**로 읽어 자동 감지합니다.

- ASCII, UTF-8 (± BOM), UTF-16  
- Windows-1252 (서유럽)  
- EUC-KR / CP949 (한국어 구형)  
- Shift_JIS (일본어 구형)  
- GBK / Big5 (중국어)  
- Windows-1251 / 1256 (키릴·아랍 구형)  

깨져 보이면 편집기에서 UTF-8로 다시 저장 후 열어 보세요.

### PDF / DOCX / EPUB

| 포맷 | 표시 방식 |
|------|-----------|
| PDF | 페이지를 캔버스에 렌더 (이미지·글자 포함) |
| DOCX | 문단·제목으로 변환 |
| EPUB | 챕터 추출 후 쪽 나눔 |

## 읽기 · 필기

낱장 / 펼침 / 스크롤 / 리플로우.  
필기는 **낱장·펼침**에서 하는 것이 좋습니다.  
하단 도구: 선택, 문장 하이라이트, 형광펜, 펜, 직선, 지우개, 도형, 노트, 레이저, 실행 취소.

## 문제 해결

| 증상 | 조치 |
|------|------|
| PDF 빈 화면 | **v${VERSION}+** 사용. 개발자 도구에서 \`[onjeom pdf]\` 확인 |
| 한글·일본어·중국어 깨짐 | 인코딩 자동 감지 실패 시 UTF-8로 재저장 |
| 서재가 비어 있음 | 정상 — 문서를 직접 엽니다 |
| TXT/MD가 비어 보임 | 파일에 내용이 있는지 확인 (빈 파일은 안내 문구만 표시) |

← [개요](./README.md) · [빌드](./BUILD.md)
`;
}

function koBuild() {
  return `# 온점 — 빌드 가이드 (한국어)

**v${VERSION}** · macOS/iOS 패키징은 범위 밖입니다.

## 요구 사항

| 대상 | 도구 |
|------|------|
| 공통 | Node.js 20+ |
| Windows | Windows + npm |
| Linux | Linux 호스트 또는 CI |
| Android | JDK 17+, Android SDK |

## Windows

\`\`\`bash
npm install
npm run test:loaders
npm run electron:build:win
\`\`\`

결과물: \`release/온점-<version>-win-x64.exe\`, portable, \`win-unpacked/\`.

### 프로덕션 경로 (중요)

- UI: \`onjeom://app/\` (asar \`file://\` 금지)
- 파일 열기: 항상 raw bytes → base64 IPC
- 텍스트: 렌더러 인코딩 감지
- PDF 워커: fetch Blob 또는 메인 IPC

## 테스트

\`\`\`bash
npm run test:loaders
npm run typecheck
\`\`\`

← [개요](./README.md) · [사용 설명서](./USER_GUIDE.md)
`;
}

function genericReadme(lang) {
  const m = META[lang] || { name: lang, title: `Onjeom — ${lang}` };
  return `# ${m.title}

**v${VERSION}** · Multi-format document viewer with freehand annotation.  
**License:** MIT · **Repo:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

- [User guide](./USER_GUIDE.md)
- [Build](./BUILD.md)
- [All languages](../README.md) · [English (canonical)](../en/README.md)

## Formats & encodings (v${VERSION})

${FORMATS_TABLE_EN}

## Install (Windows)

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases) → **v${VERSION}+**
2. Installer or portable EXE
3. **Open** / \`Ctrl+O\` — PDF, MD, TXT, ASC, DOCX, EPUB, …

Library starts **empty** (no sample books).

## Develop

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
\`\`\`

## Why a document might not show

| Format | Notes |
|--------|--------|
| PDF | Needs v${VERSION}+ (\`onjeom://\` + pdf.js worker IPC) |
| TXT / MD / ASC | Multi-encoding auto-detect (ASCII, UTF-8, CP949, Shift_JIS, GBK, …) |
| DOCX | ZIP/OOXML + mammoth text extract |
| EPUB | ZIP + chapter extract |

Diagnostics: **Help → Path diagnostics**, **View → Developer tools** (\`[onjeom]\` logs).

Full detail: [en/USER_GUIDE](../en/USER_GUIDE.md) · [en/BUILD](../en/BUILD.md)

## UI language

**Settings → Language** — 20 locales including ${m.name}.

## License

[MIT](../../LICENSE)
`;
}

function genericUser(lang) {
  const m = META[lang] || { name: lang, title: lang };
  return `# Onjeom — User guide (${m.name})

**v${VERSION}** · Canonical English: [en/USER_GUIDE](../en/USER_GUIDE.md)

## Open

- **Open** / \`Ctrl+O\` / drag-and-drop  
- \`.md\` \`.txt\` \`.asc\` \`.log\` \`.csv\` \`.pdf\` \`.docx\` \`.epub\` (+ **All files**)

## Encodings

ASCII · UTF-8 · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · …

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank PDF | Use **v${VERSION}+** |
| Garbled text | Re-save as UTF-8 |
| Empty library | Normal — open a file |

← [Overview](./README.md) · [Build](./BUILD.md)
`;
}

function genericBuild(lang) {
  const m = META[lang] || { name: lang };
  return `# Onjeom — Build (${m.name})

**v${VERSION}** · Full guide: [en/BUILD](../en/BUILD.md)

\`\`\`bash
npm install
npm run test:loaders
npm run electron:build:win
\`\`\`

Critical: production UI uses \`onjeom://app/\`, not raw \`file://\` asar.  
Open-file IPC always sends base64(raw bytes).

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
`;
}

let n = 0;
for (const lang of locales) {
  const dir = join(DOCS, lang);
  if (!existsSync(dir)) continue;

  if (lang === 'en') {
    writeFileSync(join(dir, 'README.md'), enReadme(), 'utf8');
    writeFileSync(join(dir, 'USER_GUIDE.md'), enUser(), 'utf8');
    writeFileSync(join(dir, 'BUILD.md'), enBuild(), 'utf8');
  } else if (lang === 'ko') {
    writeFileSync(join(dir, 'README.md'), koReadme(), 'utf8');
    writeFileSync(join(dir, 'USER_GUIDE.md'), koUser(), 'utf8');
    writeFileSync(join(dir, 'BUILD.md'), koBuild(), 'utf8');
  } else {
    writeFileSync(join(dir, 'README.md'), genericReadme(lang), 'utf8');
    writeFileSync(join(dir, 'USER_GUIDE.md'), genericUser(lang), 'utf8');
    writeFileSync(join(dir, 'BUILD.md'), genericBuild(lang), 'utf8');
  }
  n += 3;
  console.log('wrote', lang);
}

writeFileSync(
  join(DOCS, 'README.md'),
  `# Onjeom documentation

**App version: v${VERSION}**

Choose your language. Each folder has an overview, user guide, and build notes.

| Code | Language | Folder |
|------|----------|--------|
| \`en\` | English | [en/](./en/README.md) |
| \`ko\` | 한국어 (Korean) | [ko/](./ko/README.md) |
| \`ja\` | 日本語 (Japanese) | [ja/](./ja/README.md) |
| \`zh-Hans\` | 简体中文 (Chinese Simplified) | [zh-Hans/](./zh-Hans/README.md) |
| \`zh-Hant\` | 繁體中文 (Chinese Traditional) | [zh-Hant/](./zh-Hant/README.md) |
| \`es\` | Español | [es/](./es/README.md) |
| \`fr\` | Français | [fr/](./fr/README.md) |
| \`de\` | Deutsch | [de/](./de/README.md) |
| \`it\` | Italiano | [it/](./it/README.md) |
| \`pt\` | Português | [pt/](./pt/README.md) |
| \`ru\` | Русский | [ru/](./ru/README.md) |
| \`uk\` | Українська | [uk/](./uk/README.md) |
| \`pl\` | Polski | [pl/](./pl/README.md) |
| \`nl\` | Nederlands | [nl/](./nl/README.md) |
| \`tr\` | Türkçe | [tr/](./tr/README.md) |
| \`ar\` | العربية | [ar/](./ar/README.md) |
| \`hi\` | हिन्दी | [hi/](./hi/README.md) |
| \`th\` | ไทย | [th/](./th/README.md) |
| \`vi\` | Tiếng Việt | [vi/](./vi/README.md) |
| \`id\` | Bahasa Indonesia | [id/](./id/README.md) |

## File layout (per language)

\`\`\`
docs/<lang>/
  README.md       # Overview & quick start
  USER_GUIDE.md   # How to use the app
  BUILD.md        # Build & package for Windows / Linux / Android
\`\`\`

The repository root [README.md](../README.md) is always in **English**.

## License

[MIT](../LICENSE)
`,
  'utf8',
);
n++;

console.log(`\\nWrote ${n} doc files for v${VERSION}.`);
