# 온점 — 빌드 가이드 (Windows · Linux · Android)

macOS / iOS 타깃은 현재 지원 범위에서 제외합니다 (기기 미보유).

## 사전 요구사항

| 플랫폼 | 필요 도구 |
|--------|-----------|
| 공통 | Node.js 20+ |
| Windows exe | Windows PC + npm (electron-builder) |
| Linux AppImage/deb | Linux 또는 Windows에서 electron-builder `--linux` (권장: Linux CI) |
| Android APK/AAB | **JDK 17+**, Android SDK, Android Studio |

이 PC에 Android SDK 경로 예: `%LOCALAPPDATA%\Android\Sdk`  
JDK가 PATH에 없으면 Android Studio 설치 시 함께 구성하세요.

---

## 1) Windows 데스크톱

```bash
npm install
npm run electron:build:win
```

결과물: `release/`

- `온점-0.3.0-win-x64.exe` — NSIS 설치본
- `온점-0.3.0-win-portable.exe` — 포터블

개발:

```bash
npm run dev
```

---

## 2) Linux 데스크톱

**AppImage / deb** 는 Linux 호스트(또는 GitHub Actions `ubuntu-latest`)에서 빌드하세요.
Windows에서는 `mksquashfs` 등이 없어 AppImage 생성이 실패합니다.

### Linux / CI

```bash
npm install
npm run electron:build:linux    # AppImage + deb + tar.gz
```

### Windows에서 Linux 바이너리 묶음만

```bash
npm run electron:build:linux-portable   # tar.gz (electron-builder cross-pack)
```

결과물 예: `release/온점-0.3.0-linux-x64.tar.gz`  
압축 해제 후 `온점` 실행 파일을 실행합니다.

### GitHub Actions

저장소에 `.github/workflows/build-desktop.yml` 이 있습니다.

- Windows → NSIS / portable  
- Ubuntu → AppImage / deb / tar.gz  
- Ubuntu → Android debug APK  

`workflow_dispatch` 또는 태그 `v*` 푸시 시 동작합니다.

---

## 3) Android

### 3-1. 웹 자산 빌드 + Capacitor 프로젝트

최초 1회:

```bash
npm install
npm run build:android-web
npx cap add android
```

이후 변경 시마다:

```bash
npm run android:sync
```

Android Studio로 열기:

```bash
npm run android:open
```

Android Studio에서:

1. SDK / JDK 설정 확인  
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)**  
3. 또는 기기/에뮬레이터 Run

CLI (SDK·JDK 준비된 경우):

```bash
npm run android:run
```

### 3-2. 서명 릴리스 (요약)

```bash
cd android
# keystore 생성 후
./gradlew assembleRelease
# 또는
./gradlew bundleRelease
```

APK: `android/app/build/outputs/apk/release/`  
AAB: `android/app/build/outputs/bundle/release/`

### Android 동작 메모

- 문서 열기: 시스템 파일 피커 (input / WebView)
- 내보내기: 공유 시트 (Share plugin) 또는 캐시 저장
- 필기 동기화: 앱 내부 `onjeom-ann/*.onjeom.json`
- S-Pen: Pointer Events 필압 + 설정에서 필압 곡선

---

## 4) 웹만 (브라우저 테스트)

```bash
npm run dev:web
# 또는
npm run build:web && npm run preview
```

---

## 환경 변수

| 값 | 의미 |
|----|------|
| `ONJEOM_TARGET=electron` | 기본, Electron 플러그인 포함 |
| `ONJEOM_TARGET=web` | 정적 SPA |
| `ONJEOM_TARGET=android` | Capacitor용 `base: './'` |

---

## CI 스케치 (참고)

```yaml
# Windows + Linux desktop
- run: npm ci
- run: npm run electron:build
  if: runner.os != 'macOS'

# Android (needs JDK 17 + Android SDK)
- run: npm run build:android-web
- run: npx cap sync android
- run: cd android && ./gradlew assembleDebug
```
