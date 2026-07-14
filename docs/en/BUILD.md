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
Encrypted PDF:          password dialog in renderer → reload with password
```

Do **not** load the UI via raw `file://…/app.asar/…` — workers break.

### Diagnostics

- Menu **Help → Path diagnostics…**
- **View → Developer tools** — logs prefixed with `[onjeom]`

## Verification / QA (not product features)

These commands **check** the app. They are **not** features shipped inside the user EXE.

| Command | Purpose |
|---------|---------|
| `npm run typecheck` | TypeScript |
| `npm run test:loaders` | Encoding / PDF header / DOCX / base64 offline |
| `npm run test:formats` | Generate + exercise PDF/EPUB/DOCX/PPTX/HTML fixtures |
| `npm run smoke:packaged` | Boot packaged EXE (blank-UI guard) |
| `npm run test:e2e` | **Playwright** Electron E2E — formats, password PDF, core UI flows |
| `npm run release:win` | Full gate: typecheck → loaders → formats → build → smoke → e2e |

```bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e
# or everything:
npm run release:win
```

> **Playwright** is a **QA tool** for developers/CI. End users do not need it and it is not an in-app feature.

## Linux / Android

```bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
```

## Releases

```bash
npm run release:win
git tag -a vX.Y.Z -m "…"
git push origin main --tags
gh release create vX.Y.Z release/*-win* --title "…" --notes "…"
```

## Docs sync & screenshots

After changing product behavior, update `scripts/sync-locale-docs.mjs` then:

```bash
npm run docs:sync
```

Refresh UI images for GitHub (requires packaged EXE):

```bash
npm run electron:build:win
npm run screenshots
```

Output: `docs/screenshots/*.png`

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
