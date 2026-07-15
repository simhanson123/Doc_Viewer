# 온점 — 빌드 가이드 (한국어)

**v0.4.10** · macOS/iOS 패키징은 범위 밖입니다.

## 요구 사항

| 대상 | 도구 |
|------|------|
| 공통 | Node.js 20+ |
| Windows | Windows + npm |
| Linux | Linux 호스트 또는 CI |
| Android | JDK 17+, Android SDK |

## Windows

```bash
npm install
npm run test:loaders
npm run electron:build:win
```

결과물: `release/온점-<version>-win-x64.exe`, portable, `win-unpacked/`.

```bash
npm run dev
```

### 프로덕션 경로 (중요)

- UI: `onjeom://app/` (asar `file://` 금지)
- 파일 열기: 항상 raw bytes → base64 IPC
- 텍스트: 렌더러 인코딩 감지 (Node `require` 금지)
- PDF 워커: fetch Blob 또는 메인 IPC
- 암호 PDF: 렌더러 비밀번호 대화상자 → 재로드

## 점검 / QA (제품 기능 아님)

아래 명령은 앱을 **검사**합니다. 사용자 EXE 안에 들어가는 기능이 아닙니다.

| 명령 | 용도 |
|------|------|
| `npm run typecheck` | TypeScript |
| `npm run test:loaders` | 인코딩 / PDF 헤더 / DOCX / base64 |
| `npm run test:formats` | PDF/EPUB/DOCX/PPTX/HTML 픽스처 생성·실험 |
| `npm run smoke:packaged` | 패키지 EXE 기동 (빈 UI 가드) |
| `npm run test:e2e` | **Playwright** Electron E2E (포맷·암호 PDF·핵심 UI) |
| `npm run release:win` | 전체 게이트 |

```bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e
# 또는 한 번에:
npm run release:win
```

> **Playwright** 는 개발자/CI용 **점검 도구**입니다. 일반 사용자 기능이 아닙니다.

## Linux / Android

```bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
```

## 릴리스

```bash
npm run release:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
```

## 문서 동기화 · 스크린샷

제품 동작이 바뀌면 `scripts/sync-locale-docs.mjs` 를 고친 뒤:

```bash
npm run docs:sync
```

GitHub용 UI 캡처 (패키지 EXE 필요):

```bash
npm run electron:build:win
npm run screenshots
```

결과: `docs/screenshots/*.png`

← [개요](./README.md) · [사용 설명서](./USER_GUIDE.md)
