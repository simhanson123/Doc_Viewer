# オン点 (Onjeom) — 日本語

手書き注釈対応のマルチ形式ドキュメントビューア。  
**ライセンス:** MIT · **リポジトリ:** [simhanson123/Doc_Viewer](https://github.com/simhanson123/Doc_Viewer)

- [ユーザーガイド](./USER_GUIDE.md)
- [ビルド](./BUILD.md)
- [他の言語](../README.md)

## 概要

| 項目 | 内容 |
|------|------|
| 形式 | MD · TXT · PDF · EPUB · DOCX |
| 表示 | 単ページ · 見開き · スクロール · リフロー |
| 注釈 | ペン（筆圧）· 蛍光ペン · 図形 · 付箋 · レーザー など |
| 書き出し | 注釈付き PDF · PNG · JSON |
| 対応 | **Windows**（主）· Linux · Android（準備中） |

## Windows のインストール

[Releases](https://github.com/simhanson123/Doc_Viewer/releases) からインストーラまたは portable を入手し、**開く** / `Ctrl+O` で文書を開きます。

## 開発

```bash
npm install
npm run dev
npm run electron:build:win
```

## UI 言語

**設定 → 言語** で 20 言語を選択できます。本文フォントは主要な世界の文字をカバーします。

## ライセンス

[MIT](../../LICENSE)
