# Onjeom documentation

**App version: v0.4.10**

Canonical full docs: **[English](./en/README.md)** · **[한국어](./ko/README.md)**  
Other languages include the same v0.4.10 feature set (overview + guide + build) with links back to EN/KO for detail.

| Code | Language | Folder |
|------|----------|--------|
| `en` | English | [en/](./en/README.md) |
| `ko` | 한국어 (Korean) | [ko/](./ko/README.md) |
| `ja` | 日本語 (Japanese) | [ja/](./ja/README.md) |
| `zh-Hans` | 简体中文 (Chinese Simplified) | [zh-Hans/](./zh-Hans/README.md) |
| `zh-Hant` | 繁體中文 (Chinese Traditional) | [zh-Hant/](./zh-Hant/README.md) |
| `es` | Español | [es/](./es/README.md) |
| `fr` | Français | [fr/](./fr/README.md) |
| `de` | Deutsch | [de/](./de/README.md) |
| `it` | Italiano | [it/](./it/README.md) |
| `pt` | Português | [pt/](./pt/README.md) |
| `ru` | Русский | [ru/](./ru/README.md) |
| `uk` | Українська | [uk/](./uk/README.md) |
| `pl` | Polski | [pl/](./pl/README.md) |
| `nl` | Nederlands | [nl/](./nl/README.md) |
| `tr` | Türkçe | [tr/](./tr/README.md) |
| `ar` | العربية | [ar/](./ar/README.md) |
| `hi` | हिन्दी | [hi/](./hi/README.md) |
| `th` | ไทย | [th/](./th/README.md) |
| `vi` | Tiếng Việt | [vi/](./vi/README.md) |
| `id` | Bahasa Indonesia | [id/](./id/README.md) |

## File layout (per language)

```
docs/<lang>/
  README.md       # Overview & quick start (v0.4.10 features)
  USER_GUIDE.md   # How to use the app
  BUILD.md        # Build, package, QA gates (Playwright = QA only)
```

The repository root [README.md](../README.md) is always in **English** and must match this version.

### Screenshots (reading themes / colors)

**[screenshots/](./screenshots/README.md)** — Cream · White · Dark · Sepia (each with a different major UI language).

| Cream · 한국어 | White · English |
|----------------|-----------------|
| ![Cream](./screenshots/theme-cream.png) | ![White](./screenshots/theme-white.png) |

| Dark · 日本語 | Sepia · 简体中文 |
|---------------|------------------|
| ![Dark](./screenshots/theme-dark.png) | ![Sepia](./screenshots/theme-sepia.png) |

Regenerate all locales after product changes:

```bash
npm run docs:sync
npm run screenshots   # after electron:build:win if UI changed
```

## License

[MIT](../LICENSE)
