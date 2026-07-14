# 온점 (Onjeom) — 한국어

필기 가능한 멀티 포맷 문서 뷰어.  
**라이선스:** MIT · **저장소:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)  
**현재 버전:** v0.4.5

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

## 지원 포맷 (v0.4.5)

| 포맷 | 확장자 | 비고 |
|------|--------|------|
| Markdown | `.md` `.markdown` | 제목·목록·코드 |
| 일반 텍스트 | `.txt` `.text` `.asc` `.ascii` `.log` `.csv` 등 | 인코딩 자동 감지 |
| PDF | `.pdf` | pdf.js 캔버스 |
| Word | `.docx` | mammoth |
| EPUB | `.epub` | 챕터 페이지 |

**문서 열기** / `Ctrl+O` 또는 드래그앤드롭. 특수 확장자는 **모든 파일**.

## Windows 설치

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases)에서 **v0.4.5 이상** 받기  
2. 실행 → **문서 열기** / `Ctrl+O` → PDF·MD·TXT·DOCX·EPUB 선택  

> 0.4.0~0.4.1 은 PDF 경로 문제가 있었습니다. **0.4.5+** 를 사용하세요.

## 개발

```bash
npm install
npm run test:loaders
npm run dev
npm run electron:build:win
```

## 문서가 안 보일 때

- **PDF**: 패키지 앱은 `onjeom://` 프로토콜 + PDF 워커 IPC 폴백 (v0.4.5+)  
- **TXT/MD/ASC**: 바이트 기준 인코딩 자동 감지 (UTF-8, 한글 CP949, 일본어 Shift_JIS, 중국어 GBK 등)  
- **DOCX**: ZIP(OOXML) 검사 후 mammoth로 본문 추출  
- **도움말 → 경로 진단**, **보기 → 개발자 도구** 의 `[onjeom]` 로그 확인  

자세한 경로 구조: [영어 BUILD](../en/BUILD.md)

## 라이선스

[MIT](../../LICENSE)
