# Screenshots — reading themes (v0.4.9)

Same document layout. **Different colors** so users pick by taste.  
Each color uses a **different major UI language**.

| File | Theme (color) | UI language |
|------|----------------|-------------|
| `theme-cream.png` | **Cream** | 한국어 (`ko`) |
| `theme-white.png` | **White** | English (`en`) |
| `theme-dark.png` | **Dark** | 日本語 (`ja`) |
| `theme-sepia.png` | **Sepia** | 简体中文 (`zh-Hans`) |

## Gallery

### Cream · 한국어

![Cream](./theme-cream.png)

### White · English

![White](./theme-white.png)

### Dark · 日本語

![Dark](./theme-dark.png)

### Sepia · 简体中文

![Sepia](./theme-sepia.png)


## How captured

- Existing **Settings** UI: language select + theme chips (no extra product API)
- Script: `scripts/capture-screenshots.mjs`
- Tool: Playwright Electron (**QA/capture only**)

```bash
npm run screenshots
```

History of mistakes: [DEVLOG.md](../DEVLOG.md)
