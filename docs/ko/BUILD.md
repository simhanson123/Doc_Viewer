# 온점 — 빌드 가이드 (한국어)

**v0.4.6** · macOS/iOS 패키징은 범위 밖입니다.

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

### 프로덕션 경로 (중요)

- UI: `onjeom://app/` (asar `file://` 금지)
- 파일 열기: 항상 raw bytes → base64 IPC
- 텍스트: 렌더러 인코딩 감지
- PDF 워커: fetch Blob 또는 메인 IPC

## 테스트

```bash
npm run test:loaders
npm run typecheck
```

← [개요](./README.md) · [사용 설명서](./USER_GUIDE.md)
