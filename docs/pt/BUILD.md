# Onjeom — Build (Português)

**v0.4.5** · Full guide: [en/BUILD](../en/BUILD.md)

```bash
npm install
npm run test:loaders
npm run electron:build:win
```

Critical: production UI uses `onjeom://app/`, not raw `file://` asar.  
Open-file IPC always sends base64(raw bytes).

← [Overview](./README.md) · [User guide](./USER_GUIDE.md)
