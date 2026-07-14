# Onjeom — Build guide (English)

macOS / iOS packaging is out of scope for this project for now.

## Requirements

| Target | Tools |
|--------|--------|
| All | Node.js 20+ |
| Windows exe | Windows + npm (electron-builder) |
| Linux AppImage/deb | Linux host or GitHub Actions (recommended) |
| Android APK/AAB | **JDK 17+**, Android SDK, Android Studio |

## Windows desktop

```bash
npm install
npm run electron:build:win
```

Output under `release/`:

- NSIS installer: `온점-<version>-win-x64.exe`
- Portable: `온점-<version>-win-portable.exe`
- Unpacked: `win-unpacked/온점.exe`

Development:

```bash
npm run dev
```

### File open (packaged app)

The production app uses:

- Preload as **CommonJS** (`preload.cjs`)
- Binary files over IPC as **base64**
- PDF.js worker **unpacked from asar** (`asarUnpack`)

If open fails, use **View → Developer tools** and check the console.

## Linux

**AppImage / deb** need a Linux environment (or CI). Building AppImage on Windows often fails (`mksquashfs`).

```bash
# On Linux / ubuntu-latest
npm run electron:build:linux

# Portable tarball (works from Windows too)
npm run electron:build:linux-portable
```

## Android

```bash
npm install
npm run build:android-web
npx cap add android          # first time only
npm run android:sync
npm run android:open         # Android Studio
```

Build APK/AAB in Android Studio, or:

```bash
cd android
./gradlew assembleDebug
```

Annotations on Android save under app storage `onjeom-ann/`.

## Environment variable `ONJEOM_TARGET`

| Value | Meaning |
|-------|---------|
| `electron` (default) | Desktop with Electron plugin |
| `web` | Static SPA |
| `android` | Capacitor web assets (`base: './'`) |

## CI

See [`.github/workflows/build-desktop.yml`](../../.github/workflows/build-desktop.yml):

- Windows → installer + portable  
- Ubuntu → AppImage / deb / tar.gz  
- Ubuntu → Android debug APK  

Triggered by `workflow_dispatch` or tags `v*`.

## Releases

```bash
npm run electron:build:win
git tag -a vX.Y.Z -m "Onjeom vX.Y.Z"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "Onjeom vX.Y.Z" --notes "..."
```

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
