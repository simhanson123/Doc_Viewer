# 온점 (Onjeom) — 한국어

필기 가능한 멀티 포맷 문서 뷰어.  
**라이선스:** MIT · **저장소:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**현재 버전:** v0.4.11

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

- **포맷:** MD · TXT/ASC · HTML · PDF · DOCX · PPTX · EPUB  
- **암호 PDF:** 비밀번호로 열기; 주석 PDF 내보내기 시 **열기 암호** 설정 가능  
- **MD/HTML/DOCX → PDF 내보내기** 시 한글·CJK 유지 (캔버스 경로 — Helvetica 깨짐 없음)  
- **목차(TOC)** 로 페이지/제목 이동  
- **서재에서 제거** 는 앱 목록만 지움 — **원본 파일은 삭제하지 않음**  
- **UI 20개 언어** · 세계 문자 본문 글꼴  
- 시작 시 서재 비어 있음 (샘플 책 없음)

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

## 지원 포맷 (v0.4.11)

| 포맷 | 확장자 | 비고 |
|------|--------|------|
| Markdown | `.md` `.markdown` | 제목·목록·코드; 목차(TOC) 제목 점프 |
| 일반 텍스트 | `.txt` `.text` `.asc` `.ascii` `.log` `.csv` 등 | 인코딩 자동 감지 |
| HTML | `.html` `.htm` | 구조화된 읽기 (원본 태그 화면 아님) |
| PDF | `.pdf` | pdf.js 캔버스; **암호 PDF** 비밀번호 대화상자로 열기 |
| Word | `.docx` | mammoth (OOXML) |
| PowerPoint | `.pptx` | 슬라이드 ≈ 페이지 |
| EPUB | `.epub` | 챕터 페이지 |

**텍스트 인코딩:** ASCII · UTF-8 (±BOM) · UTF-16 · Windows-1252 · EUC-KR/CP949 · Shift_JIS · GBK · Big5 · Windows-1251/1256 · …

**문서 열기** / `Ctrl+O` 또는 드래그앤드롭. 특수 확장자는 **모든 파일**.

## Windows 설치

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases)에서 **v0.4.11 이상** 받기  
2. 설치본(`*-win-x64.exe`) 또는 포터블(`*-win-portable.exe`)  
3. 실행 → **문서 열기** / `Ctrl+O` → MD·TXT·HTML·PDF·DOCX·PPTX·EPUB  

> 0.4.0~0.4.1 은 PDF 경로 문제가 있었습니다. **v0.4.11+** 를 사용하세요.

## 개발

```bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
```

전체 릴리스 게이트:

```bash
npm run release:win
```

## 문서가 안 보일 때

- **PDF**: 패키지 앱은 `onjeom://` 프로토콜 + PDF 워커 IPC 폴백 (v0.4.11+)  
- **암호 PDF**: 비밀번호 입력 후 다시 열기  
- **TXT/MD/ASC/HTML**: 바이트 기준 인코딩 자동 감지 (UTF-8, CP949, Shift_JIS, GBK 등)  
- **DOCX / PPTX / EPUB**: ZIP(OOXML/EPUB) 검사 후 본문 추출  
- **도움말 → 경로 진단**, **보기 → 개발자 도구** 의 `[onjeom]` 로그 확인  

자세한 경로·QA 절차: [빌드 가이드](./BUILD.md) · [영어 BUILD](../en/BUILD.md)

## 라이선스

[MIT](../../LICENSE)
