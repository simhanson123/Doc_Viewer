# 句点 — 构建说明（简体中文）

## Windows

```bash
npm install
npm run electron:build:win
```

输出在 `release/`。开发：`npm run dev`。

## Linux / Android

见 [English BUILD](../en/BUILD.md)。

```bash
npm run electron:build:linux
npm run android:sync && npm run android:open
```

← [概述](./README.md)
