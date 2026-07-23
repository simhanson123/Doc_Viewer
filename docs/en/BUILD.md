# Onjeom — Build guide (English)

**v0.4.11** · macOS/iOS packaging is out of scope.

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

Output (names from `package.json` `artifactName`):

| Path | Description |
|------|-------------|
| `release/Onjeom-<version>-win-x64.exe` | NSIS installer |
| `release/Onjeom-<version>-win-portable.exe` | Portable |
| `release/win-unpacked/온점.exe` | Unpacked (product name **온점**) |

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
| `npm run test:unit` | **vitest** unit suite (`src/lib/__tests__`) |
| `npm run test:coverage` | vitest + coverage report / badge input |
| `npm run test:loaders` | Encoding / PDF header / DOCX / base64 offline |
| `npm run test:formats` | Generate + exercise PDF/EPUB/DOCX/PPTX/HTML fixtures |
| `npm run smoke:packaged` | Boot packaged EXE (blank-UI guard) |
| `npm run test:e2e` | **Playwright** Electron E2E — formats, password PDF, core UI flows |
| `npm run release:win` | Full gate: typecheck → loaders → formats → build → smoke → e2e |

```bash
npm run typecheck
npm run test:unit
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e
# or everything:
npm run release:win
```

CI: `.github/workflows/test.yml` runs typecheck + loaders + coverage on every `main` push/PR.  
Tag push `v*` → `.github/workflows/build-desktop.yml` builds Windows/Linux/Android and publishes a GitHub Release.

> **Playwright / vitest** are **QA tools** for developers/CI. End users do not need them and they are not in-app features.

## Linux / Android

```bash
npm run electron:build:linux
npm run electron:build:linux-portable
npm run android:sync && npm run android:open
```

## Releases

Preferred: push tag `vX.Y.Z` so GitHub Actions attaches built artifacts.

```bash
npm run release:win
git tag -a vX.Y.Z -m "…"
git push origin main refs/tags/vX.Y.Z
# or manual assets:
gh release create vX.Y.Z release/Onjeom-*-win* --title "…" --notes "…"
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
