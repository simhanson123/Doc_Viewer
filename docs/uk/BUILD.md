# Onjeom — Build (Українська)

**v0.4.10** · Full guide: [en/BUILD](../en/BUILD.md) · [ko/BUILD](../ko/BUILD.md)

```bash
npm install
npm run test:loaders
npm run electron:build:win
```

### QA (not product features)

```bash
npm run typecheck
npm run test:loaders
npm run test:formats
npm run smoke:packaged
npm run test:e2e          # Playwright — developer QA only
npm run release:win       # full gate
```

> **Playwright** is for verification only. It is not an end-user app feature.

Critical: production UI uses `onjeom://app/`, not raw `file://` asar.  
Open-file IPC always sends base64(raw bytes).

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
