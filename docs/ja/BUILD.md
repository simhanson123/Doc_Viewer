# オン点 — ビルドガイド（日本語）

## Windows

```bash
npm install
npm run electron:build:win
```

成果物は `release/`。開発は `npm run dev`。

## Linux

```bash
npm run electron:build:linux            # Linux / CI 推奨
npm run electron:build:linux-portable
```

## Android

```bash
npm run android:sync
npm run android:open
```

JDK 17 と Android Studio が必要です。詳細は [English BUILD](../en/BUILD.md)。

← [概要](./README.md)
