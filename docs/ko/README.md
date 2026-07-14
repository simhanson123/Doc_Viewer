# 온점 (Onjeom) — 한국어

필기 가능한 멀티 포맷 문서 뷰어.  
**라이선스:** MIT · **저장소:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

- [사용 설명서](./USER_GUIDE.md)
- [빌드 가이드](./BUILD.md)
- [다른 언어](../README.md)

## 온점이란?

| 항목 | 내용 |
|------|------|
| 포맷 | MD · TXT · PDF · EPUB · DOCX |
| 읽기 | 낱장 · 펼침 · 스크롤 · 리플로우 |
| 필기 | 펜(필압) · 형광펜 · 문장 하이라이트 · 도형 · 스티키 노트 · 레이저 · 지우개 |
| 내보내기 | 필기 포함 PDF · PNG · 필기 JSON |
| 플랫폼 | **Windows**(주력) · Linux · Android(준비 중) |

## Windows 설치

1. [Releases](https://github.com/simhanson123/Doc_Viewer/releases)에서 설치본 또는 포터블을 받습니다.
2. 실행 후 **문서 열기** 또는 `Ctrl+O`.

## 개발

```bash
npm install
npm run dev
npm run electron:build:win
```

## UI 언어

**설정 → 언어** 에서 20개 UI 언어를 고를 수 있습니다.  
본문 글꼴은 한중일·아랍·데바나가리·태국·키릴 등 주요 세계 문자를 지원합니다.

## 라이선스

[MIT](../../LICENSE)
