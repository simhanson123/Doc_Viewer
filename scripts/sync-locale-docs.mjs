/**
 * Keep every locale README / USER_GUIDE / BUILD in sync for the current version.
 * EN & KO get full structured content; other locales get a localized header +
 * the same technical content in English (so docs never lag the product).
 *
 * Run: npm run docs:sync
 * Always update this file when product features or release gates change.
 */
import { writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const VERSION = '0.4.11';
const DOCS = join(process.cwd(), 'docs');

const SKIP_DIRS = new Set(['screenshots', 'assets', 'images', 'img', 'badges']);
const locales = readdirSync(DOCS, { withFileTypes: true })
  .filter((d) => d.isDirectory() && !SKIP_DIRS.has(d.name) && !d.name.startsWith('.'))
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
| Markdown | \`.md\` \`.markdown\` | Headings, lists, code; TOC from headings |
| Plain text | \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` … | Encoding auto-detect |
| HTML | \`.html\` \`.htm\` | Structured reading (not raw tags) |
| PDF | \`.pdf\` | pdf.js canvas; **encrypted PDFs** open with password dialog |
| Word | \`.docx\` | OOXML via mammoth |
| PowerPoint | \`.pptx\` | One slide ≈ one page |
| EPUB | \`.epub\` | Chapters paginated |

**Text encodings:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

Open with **Open** / \`Ctrl+O\` or drag-and-drop. Use **All files** for unusual extensions.`;

const FORMATS_TABLE_KO = `| 포맷 | 확장자 | 비고 |
|------|--------|------|
| Markdown | \`.md\` \`.markdown\` | 제목·목록·코드; 목차(TOC) 제목 점프 |
| 일반 텍스트 | \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` 등 | 인코딩 자동 감지 |
| HTML | \`.html\` \`.htm\` | 구조화된 읽기 (원본 태그 화면 아님) |
| PDF | \`.pdf\` | pdf.js 캔버스; **암호 PDF** 비밀번호 대화상자로 열기 |
| Word | \`.docx\` | mammoth (OOXML) |
| PowerPoint | \`.pptx\` | 슬라이드 ≈ 페이지 |
| EPUB | \`.epub\` | 챕터 페이지 |

**텍스트 인코딩:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

**문서 열기** / \`Ctrl+O\` 또는 드래그앤드롭. 특수 확장자는 **모든 파일**.`;

const HIGHLIGHTS_EN = `- **Formats:** MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB  
- **Encrypted PDF:** open with password; export annotated PDF **with** optional open-password  
- **Export PDF** from MD/HTML/DOCX keeps Hangul/CJK (canvas path — not broken Helvetica)  
- **Contents (TOC)** jumps to page/heading  
- **Library remove** removes from the in-app list only — **never deletes** the original file on disk  
- **20 UI languages** · world-script body fonts  
- Empty library at start (no sample books)`;

const HIGHLIGHTS_KO = `- **포맷:** MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB  
- **암호 PDF:** 비밀번호로 열기; 주석 PDF 내보내기 시 **열기 암호** 설정 가능  
- **MD/HTML/DOCX → PDF 내보내기** 시 한글·CJK 유지 (캔버스 경로 — Helvetica 깨짐 없음)  
- **목차(TOC)** 로 페이지/제목 이동  
- **서재에서 제거** 는 앱 목록만 지움 — **원본 파일은 삭제하지 않음**  
- **UI 20개 언어** · 세계 문자 본문 글꼴  
- 시작 시 서재 비어 있음 (샘플 책 없음)`;

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
| **Formats** | MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB |
| **Text encodings** | ASCII · UTF-8 (BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · more |
| **Modes** | Single · spread · scroll · reflow |
| **Ink** | Pen (pressure) · highlighter · shapes · sticky notes · laser · eraser |
| **Export** | Annotated PDF · password-protected PDF · PNG · annotations JSON |
| **Library** | Empty at start; remove from list without deleting disk files |
| **Platforms** | **Windows** (primary) · Linux · Android (in progress) |

${HIGHLIGHTS_EN}

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

## Supported formats (v${VERSION})

${FORMATS_TABLE_EN}

## Install (Windows)

1. Open [Releases](https://github.com/simhanson123/Doc_Viewer/releases) (**v${VERSION}+**).
2. Download installer (\`*-win-x64.exe\`) or portable (\`*-win-portable.exe\`).
3. Run → **Open** or \`Ctrl+O\` → MD / TXT / HTML / PDF / DOCX / PPTX / EPUB.

> Prefer **v${VERSION} or newer**. Builds 0.4.0–0.4.1 had PDF path/worker issues; use current release.

## Develop

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
\`\`\`

Full release gate (typecheck → loaders → formats → build → packaged smoke → E2E):

\`\`\`bash
npm run release:win
\`\`\`

## How document loading works (paths)

| Layer | Role |
|-------|------|
| UI | Custom protocol \`onjeom://app/…\` (not \`file://\` asar) |
| Preload | \`preload.cjs\` → \`window.onjeom\` bridge |
| Open file | Main reads **raw bytes** → **base64** over IPC |
| Text (MD/TXT/ASC/HTML/…) | Renderer detects encoding → JS string |
| PDF | pdf.js + worker via fetch Blob or main-process IPC fallback; password prompt when encrypted |
| DOCX / PPTX / EPUB | ZIP/OOXML/EPUB parsers on the same base64 bytes |

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
- Supported: \`.md\` \`.markdown\` \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` \`.html\` \`.htm\` \`.pdf\` \`.epub\` \`.docx\` \`.pptx\` (plus many text/code types via **All files**)

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

- Annotated PDF (\`Ctrl+E\`) — Hangul/CJK preserved for MD/HTML/DOCX source via canvas path
- **Password-protected** annotated PDF (set open password)
- Current page PNG
- Annotations JSON import/export
- Desktop: optional sync folder for \`.onjeom.json\`

## Troubleshooting

| Symptom | What to try |
|---------|-------------|
| PDF blank | Use **v${VERSION}+**. View → Developer tools → \`[onjeom pdf]\`. Help → Path diagnostics. |
| Encrypted PDF won’t open | Enter the correct password when prompted. |
| Garbled Korean/Japanese/Chinese text | Encoding is auto-detected; try re-saving as UTF-8. |
| PDF export garble (Hangul/CJK) | Use **v${VERSION}+** (canvas export path). |
| TOC click does nothing | Ensure the document has headings/structure; try **v${VERSION}+**. |
| File won’t open | Check extension; use All files filter. Error toast shows details. |
| Empty library | Normal — open a file with **Open**. |
| Want file gone from list only | Use remove-from-library (disk file stays). |
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
Encrypted PDF:          password dialog in renderer → reload with password
\`\`\`

Do **not** load the UI via raw \`file://…/app.asar/…\` — workers break.

### Diagnostics

- Menu **Help → Path diagnostics…**
- **View → Developer tools** — logs prefixed with \`[onjeom]\`

## Verification / QA (not product features)

These commands **check** the app. They are **not** features shipped inside the user EXE.

| Command | Purpose |
|---------|---------|
| \`npm run typecheck\` | TypeScript |
| \`npm run test:loaders\` | Encoding / PDF header / DOCX / base64 offline |
| \`npm run test:formats\` | Generate + exercise PDF/EPUB/DOCX/PPTX/HTML fixtures |
| \`npm run smoke:packaged\` | Boot packaged EXE (blank-UI guard) |
| \`npm run test:e2e\` | **Playwright** Electron E2E — formats, password PDF, core UI flows |
| \`npm run release:win\` | Full gate: typecheck → loaders → formats → build → smoke → e2e |

\`\`\`bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e
# or everything:
npm run release:win
\`\`\`

> **Playwright** is a **QA tool** for developers/CI. End users do not need it and it is not an in-app feature.

## Linux / Android

\`\`\`bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
\`\`\`

## Releases

\`\`\`bash
npm run release:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
\`\`\`

## Docs sync & screenshots

After changing product behavior, update \`scripts/sync-locale-docs.mjs\` then:

\`\`\`bash
npm run docs:sync
\`\`\`

Refresh UI images for GitHub (requires packaged EXE):

\`\`\`bash
npm run electron:build:win
npm run screenshots
\`\`\`

Output: \`docs/screenshots/*.png\`

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
| 포맷 | MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB |
| 텍스트 인코딩 | ASCII · UTF-8 · UTF-16 · CP949 · Shift_JIS · GBK · Big5 · Windows-1252 등 |
| 읽기 | 낱장 · 펼침 · 스크롤 · 리플로우 |
| 필기 | 펜(필압) · 형광펜 · 도형 · 스티키 노트 · 레이저 · 지우개 |
| 내보내기 | 주석 PDF · 암호 PDF · PNG · 주석 JSON |
| 서재 | 시작 시 비어 있음; 목록 제거 시 **원본 파일 삭제 안 함** |
| 플랫폼 | **Windows**(주력) · Linux · Android(준비 중) |

${HIGHLIGHTS_KO}

## 스크린샷 — 읽기 테마 (색)

같은 문서, **책상·종이 색만 다름**. 테마마다 UI 언어도 다름 (취향 비교용).

| 크림 · 한국어 | 화이트 · English |
|---------------|------------------|
| ![크림](../screenshots/theme-cream.png) | ![화이트](../screenshots/theme-white.png) |

| 다크 · 日本語 | 세피아 · 简体中文 |
|---------------|-------------------|
| ![다크](../screenshots/theme-dark.png) | ![세피아](../screenshots/theme-sepia.png) |

앱 테마: 크림 · 화이트 · 다크 · 세피아 · 나이트 (설정).  
모음: [screenshots/](../screenshots/README.md)

## 지원 포맷 (v${VERSION})

${FORMATS_TABLE_KO}

## Windows 설치

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases)에서 **v${VERSION} 이상** 받기  
2. 설치본(\`*-win-x64.exe\`) 또는 포터블(\`*-win-portable.exe\`)  
3. 실행 → **문서 열기** / \`Ctrl+O\` → MD·TXT·HTML·PDF·DOCX·PPTX·EPUB  

> 0.4.0~0.4.1 은 PDF 경로 문제가 있었습니다. **v${VERSION}+** 를 사용하세요.

## 개발

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
\`\`\`

전체 릴리스 게이트:

\`\`\`bash
npm run release:win
\`\`\`

## 문서가 안 보일 때

- **PDF**: 패키지 앱은 \`onjeom://\` 프로토콜 + PDF 워커 IPC 폴백 (v${VERSION}+)  
- **암호 PDF**: 비밀번호 입력 후 다시 열기  
- **TXT/MD/ASC/HTML**: 바이트 기준 인코딩 자동 감지 (UTF-8, CP949, Shift_JIS, GBK 등)  
- **DOCX / PPTX / EPUB**: ZIP(OOXML/EPUB) 검사 후 본문 추출  
- **도움말 → 경로 진단**, **보기 → 개발자 도구** 의 \`[onjeom]\` 로그 확인  

자세한 경로·QA 절차: [빌드 가이드](./BUILD.md) · [영어 BUILD](../en/BUILD.md)

## 라이선스

[MIT](../../LICENSE)
`;
}

function koUser() {
  return `# 온점 — 사용 설명서 (한국어)

**v${VERSION}**

## 문서 열기

- **문서 열기** / \`Ctrl+O\` / 드래그 앤 드롭  
- 지원: \`.md\` \`.markdown\` \`.txt\` \`.text\` \`.asc\` \`.ascii\` \`.log\` \`.csv\` \`.html\` \`.htm\` \`.pdf\` \`.epub\` \`.docx\` \`.pptx\` (기타 텍스트/코드는 **모든 파일**)  
- 시작 시 서재는 비어 있습니다. (샘플 책 없음)

### 텍스트 인코딩 (MD / TXT / ASC / HTML / …)

파일을 **원본 바이트**로 읽어 자동 감지합니다.

- ASCII, UTF-8 (± BOM), UTF-16  
- Windows-1252 (서유럽)  
- EUC-KR / CP949 (한국어 구형)  
- Shift_JIS (일본어 구형)  
- GBK / Big5 (중국어)  
- Windows-1251 / 1256 (키릴·아랍 구형)  

깨져 보이면 편집기에서 UTF-8로 다시 저장 후 열어 보세요.

### 포맷별 표시

| 포맷 | 표시 방식 |
|------|-----------|
| PDF | 페이지를 캔버스에 렌더. **암호 PDF** 는 비밀번호 입력 |
| HTML | 구조화된 읽기 뷰 |
| DOCX | 문단·제목으로 변환 |
| PPTX | 슬라이드 ≈ 페이지 |
| EPUB | 챕터 추출 후 쪽 나눔 |
| Markdown | 제목·목록·코드; 목차는 제목에서 생성 |

## 목차 (TOC)

오른쪽 패널 **목차/Contents** 를 누르면 해당 페이지·제목으로 이동합니다.

## 서재

- 연 문서는 앱 안 서재 목록에 추가됩니다.  
- **서재에서 제거** 는 목록에서만 지웁니다.  
- **디스크의 원본 파일은 삭제하지 않습니다.**

## 읽기 · 필기

낱장 / 펼침 / 스크롤 / 리플로우.  
필기는 **낱장·펼침**에서 하는 것이 좋습니다.  
하단 도구: 선택, 문장 하이라이트, 형광펜, 펜, 직선, 지우개, 도형, 노트, 레이저, 실행 취소.

## 내보내기

- 주석 PDF (\`Ctrl+E\`) — MD/HTML/DOCX 출처 시 한글·CJK 유지 (캔버스)  
- **열기 암호** 가 있는 주석 PDF  
- 현재 쪽 PNG  
- 주석 JSON 가져오기/내보내기  
- 데스크톱: \`.onjeom.json\` 동기 폴더(선택)

## 문제 해결

| 증상 | 조치 |
|------|------|
| PDF 빈 화면 | **v${VERSION}+** 사용. 개발자 도구에서 \`[onjeom pdf]\` 확인 |
| 암호 PDF 안 열림 | 올바른 비밀번호 입력 |
| 한글·일본어·중국어 깨짐 | 인코딩 자동 감지 실패 시 UTF-8로 재저장 |
| PDF 내보내기 한글 깨짐 | **v${VERSION}+** (캔버스 내보내기) |
| 목차 클릭 무반응 | 문서에 제목/구조가 있는지 확인 · **v${VERSION}+** |
| 서재가 비어 있음 | 정상 — 문서를 직접 엽니다 |
| 목록만 지우고 싶음 | 서재에서 제거 (원본 파일 유지) |
| TXT/MD가 비어 보임 | 파일 내용 확인 (빈 파일은 안내만 표시) |

## 단축키

| 키 | 동작 |
|----|------|
| \`Ctrl+O\` | 열기 |
| \`Ctrl+E\` | 주석 PDF 내보내기 |
| \`Ctrl+,\` | 설정 |
| \`Ctrl+/\` | 단축키 |
| \`←\` \`→\` | 페이지 |
| \`B\` | 북마크 |
| \`1\`–\`9\` | 도구 |

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

\`\`\`bash
npm run dev
\`\`\`

### 프로덕션 경로 (중요)

- UI: \`onjeom://app/\` (asar \`file://\` 금지)
- 파일 열기: 항상 raw bytes → base64 IPC
- 텍스트: 렌더러 인코딩 감지 (Node \`require\` 금지)
- PDF 워커: fetch Blob 또는 메인 IPC
- 암호 PDF: 렌더러 비밀번호 대화상자 → 재로드

## 점검 / QA (제품 기능 아님)

아래 명령은 앱을 **검사**합니다. 사용자 EXE 안에 들어가는 기능이 아닙니다.

| 명령 | 용도 |
|------|------|
| \`npm run typecheck\` | TypeScript |
| \`npm run test:loaders\` | 인코딩 / PDF 헤더 / DOCX / base64 |
| \`npm run test:formats\` | PDF/EPUB/DOCX/PPTX/HTML 픽스처 생성·실험 |
| \`npm run smoke:packaged\` | 패키지 EXE 기동 (빈 UI 가드) |
| \`npm run test:e2e\` | **Playwright** Electron E2E (포맷·암호 PDF·핵심 UI) |
| \`npm run release:win\` | 전체 게이트 |

\`\`\`bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e
# 또는 한 번에:
npm run release:win
\`\`\`

> **Playwright** 는 개발자/CI용 **점검 도구**입니다. 일반 사용자 기능이 아닙니다.

## Linux / Android

\`\`\`bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
\`\`\`

## 릴리스

\`\`\`bash
npm run release:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
\`\`\`

## 문서 동기화 · 스크린샷

제품 동작이 바뀌면 \`scripts/sync-locale-docs.mjs\` 를 고친 뒤:

\`\`\`bash
npm run docs:sync
\`\`\`

GitHub용 UI 캡처 (패키지 EXE 필요):

\`\`\`bash
npm run electron:build:win
npm run screenshots
\`\`\`

결과: \`docs/screenshots/*.png\`

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
- [All languages](../README.md) · [English (canonical)](../en/README.md) · [한국어](../ko/README.md)

## Highlights (v${VERSION})

${HIGHLIGHTS_EN}

## Formats & encodings (v${VERSION})

${FORMATS_TABLE_EN}

## Install (Windows)

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases) → **v${VERSION}+**
2. Installer or portable EXE
3. **Open** / \`Ctrl+O\` — MD, TXT, HTML, PDF, DOCX, PPTX, EPUB, …

Library starts **empty** (no sample books).

## Screenshots — themes (colors)

| Cream · 한국어 | White · English |
|----------------|-----------------|
| ![Cream](../screenshots/theme-cream.png) | ![White](../screenshots/theme-white.png) |

| Dark · 日本語 | Sepia · 简体中文 |
|---------------|------------------|
| ![Dark](../screenshots/theme-dark.png) | ![Sepia](../screenshots/theme-sepia.png) |

Album: [screenshots/](../screenshots/README.md)

## Develop

\`\`\`bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
npm run release:win
\`\`\`

## Why a document might not show

| Format | Notes |
|--------|--------|
| PDF | Needs v${VERSION}+ (\`onjeom://\` + pdf.js worker IPC) |
| Encrypted PDF | Password dialog |
| TXT / MD / ASC / HTML | Multi-encoding auto-detect |
| DOCX / PPTX / EPUB | ZIP + extract |
| TOC / library remove / CJK PDF export | Use v${VERSION}+ |

Diagnostics: **Help → Path diagnostics**, **View → Developer tools** (\`[onjeom]\` logs).

Full detail: [en/USER_GUIDE](../en/USER_GUIDE.md) · [en/BUILD](../en/BUILD.md) · [ko/](../ko/README.md)

## UI language

**Settings → Language** — 20 locales including ${m.name}.

## License

[MIT](../../LICENSE)
`;
}

function genericUser(lang) {
  const m = META[lang] || { name: lang, title: lang };
  return `# Onjeom — User guide (${m.name})

**v${VERSION}** · Full guides: [en/USER_GUIDE](../en/USER_GUIDE.md) · [ko/USER_GUIDE](../ko/USER_GUIDE.md)

## Open

- **Open** / \`Ctrl+O\` / drag-and-drop  
- \`.md\` \`.txt\` \`.asc\` \`.log\` \`.csv\` \`.html\` \`.htm\` \`.pdf\` \`.docx\` \`.pptx\` \`.epub\` (+ **All files**)

## Encodings

ASCII · UTF-8 · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · …

## Features (v${VERSION})

- **Encrypted PDF** open (password) · export PDF with optional open-password  
- **TOC** jumps to page/heading  
- **Library remove** = list only (disk file kept)  
- **MD/HTML/DOCX → PDF** export keeps Hangul/CJK  
- Reading: single · spread · scroll · reflow  
- Ink: pen, highlighter, shapes, sticky notes, laser, eraser  

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Blank PDF | Use **v${VERSION}+** |
| Encrypted PDF | Enter password when prompted |
| Garbled text | Re-save as UTF-8 |
| PDF export CJK garble | Use **v${VERSION}+** |
| Empty library | Normal — open a file |
| Remove from list | Does not delete disk file |

← [Overview](./README.md) · [Build](./BUILD.md)
`;
}

function genericBuild(lang) {
  const m = META[lang] || { name: lang };
  return `# Onjeom — Build (${m.name})

**v${VERSION}** · Full guide: [en/BUILD](../en/BUILD.md) · [ko/BUILD](../ko/BUILD.md)

\`\`\`bash
npm install
npm run test:loaders
npm run electron:build:win
\`\`\`

### QA (not product features)

\`\`\`bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e          # Playwright — developer QA only
npm run release:win       # full gate
\`\`\`

> **Playwright** is for verification only. It is not an end-user app feature.

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

Canonical full docs: **[English](./en/README.md)** · **[한국어](./ko/README.md)**  
Other languages include the same v${VERSION} feature set (overview + guide + build) with links back to EN/KO for detail.

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
  README.md       # Overview & quick start (v${VERSION} features)
  USER_GUIDE.md   # How to use the app
  BUILD.md        # Build, package, QA gates (Playwright = QA only)
\`\`\`

The repository root [README.md](../README.md) is always in **English** and must match this version.

### Screenshots (reading themes / colors)

**[screenshots/](./screenshots/README.md)** — Cream · White · Dark · Sepia (each with a different major UI language).

| Cream · 한국어 | White · English |
|----------------|-----------------|
| ![Cream](./screenshots/theme-cream.png) | ![White](./screenshots/theme-white.png) |

| Dark · 日本語 | Sepia · 简体中文 |
|---------------|------------------|
| ![Dark](./screenshots/theme-dark.png) | ![Sepia](./screenshots/theme-sepia.png) |

Regenerate all locales after product changes:

\`\`\`bash
npm run docs:sync
npm run screenshots   # after electron:build:win if UI changed
\`\`\`

## License

[MIT](../LICENSE)
`,
  'utf8',
);
n++;

console.log(`\nWrote ${n} doc files for v${VERSION}.`);
