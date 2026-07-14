# Onjeom — Build guide (English)

**v0.4.9** · macOS/iOS packaging is out of scope.

## Requirements

| Target | Tools |
|--------|--------|
| All | Node.js 20+ |
| Windows | Windows + npm |
| Linux AppImage/deb | Linux host or GitHub Actions |
| Android | JDK 17+, Android SDK, Android Studio |

## Windows

```bash
npm install
npm run test:loaders
npm run electron:build:win
```

Output: `release/온점-<version>-win-x64.exe`, portable, and `win-unpacked/`.

```bash
npm run dev
```

### Production path architecture (critical)

```
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
```

Do **not** load the UI via raw `file://…/app.asar/…` — workers break.

### Diagnostics

- Menu **Help → Path diagnostics…**
- **View → Developer tools** — logs prefixed with `[onjeom]`

## Tests

```bash
npm run test:loaders   # ASCII/UTF-8/CP949/SJIS/GBK/PDF/DOCX/base64
npm run typecheck
```

## Linux / Android

```bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
```

## Releases

```bash
npm run electron:build:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
```

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
