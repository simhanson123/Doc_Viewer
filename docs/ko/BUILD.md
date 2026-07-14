# 온점 — 빌드 가이드 (한국어)

현재 macOS / iOS 패키징은 범위에 넣지 않습니다.

## 요구 사항

| 대상 | 도구 |
|------|------|
| 공통 | Node.js 20+ |
| Windows exe | Windows + npm |
| Linux AppImage/deb | Linux 또는 GitHub Actions 권장 |
| Android | JDK 17+, Android SDK, Android Studio |

## Windows

```bash
npm install
npm run electron:build:win
```

결과: `release/` 아래 설치본·포터블·`win-unpacked`.

```bash
npm run dev   # 개발
```

패키지 앱에서 파일 열기가 안 되면 **보기 → 개발자 도구** 콘솔을 확인하세요.  
v0.3+ 는 `preload.cjs`, base64 IPC, PDF 워커 asar 언팩을 사용합니다.

## Linux

```bash
npm run electron:build:linux            # Linux/CI
npm run electron:build:linux-portable   # tar.gz (Windows에서도 가능)
```

Windows에서 AppImage 빌드는 실패할 수 있습니다.

## Android

```bash
npm run build:android-web
npx cap add android    # 최초 1회
npm run android:sync
npm run android:open
```

## 환경 변수 `ONJEOM_TARGET`

`electron` | `web` | `android`

## CI · 릴리스

워크플로: `.github/workflows/build-desktop.yml`  
릴리스 예시는 [영어 빌드 가이드](../en/BUILD.md)를 참고하세요.

← [개요](./README.md) · [사용법](./USER_GUIDE.md)
