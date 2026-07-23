# Onjeom — Build (Português)

**v0.4.11** · Full guide: [en/BUILD](../en/BUILD.md) · [ko/BUILD](../ko/BUILD.md)

```bash
npm install
npm run test:loaders
npm run electron:build:win
```

### QA (not product features)

```bash
npm run typecheck
npm run test:unit         # vitest
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e          # Playwright — developer QA only
npm run release:win       # full gate
```

Artifacts: `release/Onjeom-*-win-x64.exe`, `Onjeom-*-win-portable.exe`, `win-unpacked/온점.exe`.  
Repo: [simhanson123/Onjeom_Doc_Viewer](https://github.com/simhanson123/Onjeom_Doc_Viewer)

> **Playwright / vitest** are for verification only. Not end-user features.

Critical: production UI uses `onjeom://app/`, not raw `file://` asar.  
Open-file IPC always sends base64(raw bytes).

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
