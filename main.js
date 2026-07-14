import { ipcMain as r, dialog as u, shell as b, app as p, BrowserWindow as F, Menu as x } from "electron";
import a from "node:path";
import c from "node:fs/promises";
import { existsSync as h } from "node:fs";
import { fileURLToPath as C } from "node:url";
const f = a.dirname(C(import.meta.url));
function D() {
  return a.join(f, "..");
}
function g() {
  return a.join(D(), "dist");
}
function O() {
  const t = a.join(f, "preload.cjs"), e = a.join(f, "preload.mjs"), o = a.join(f, "preload.js");
  return h(t) ? t : h(o) ? o : e;
}
let n = null;
const y = process.env.VITE_DEV_SERVER_URL;
function i(t, ...e) {
  n == null || n.webContents.send(t, ...e);
}
function j() {
  const t = O();
  if (console.log("[onjeom] preload:", t), console.log("[onjeom] dist:", g()), n = new F({
    width: 1360,
    height: 900,
    minWidth: 960,
    minHeight: 640,
    title: "온점",
    backgroundColor: "#F2EBDA",
    show: !1,
    webPreferences: {
      preload: t,
      contextIsolation: !0,
      nodeIntegration: !1,
      sandbox: !1,
      // Needed so pdf.js worker / assets load reliably from asar/file://
      webSecurity: !0
    }
  }), n.once("ready-to-show", () => n == null ? void 0 : n.show()), n.webContents.on("did-fail-load", (e, o, s, l) => {
    console.error("[onjeom] did-fail-load", o, s, l);
  }), n.webContents.setWindowOpenHandler(({ url: e }) => (b.openExternal(e), { action: "deny" })), y)
    n.loadURL(y), n.webContents.openDevTools({ mode: "detach" });
  else {
    const e = a.join(g(), "index.html");
    h(e) || u.showErrorBox(
      "온점",
      `UI 파일을 찾을 수 없습니다:
${e}

앱을 다시 빌드해 주세요.`
    ), n.loadFile(e);
  }
  E();
}
function E() {
  const t = process.platform === "darwin", e = [
    ...t ? [{ role: "appMenu" }] : [],
    {
      label: "파일",
      submenu: [
        {
          label: "문서 열기…",
          accelerator: "CmdOrCtrl+O",
          click: () => i("menu:open-file")
        },
        {
          label: "필기 포함 PDF 내보내기…",
          accelerator: "CmdOrCtrl+E",
          click: () => i("menu:export-pdf")
        },
        {
          label: "필기 JSON 내보내기…",
          click: () => i("menu:export-json")
        },
        {
          label: "필기 JSON 가져오기…",
          click: () => i("menu:import-json")
        },
        { type: "separator" },
        {
          label: "필기 동기화 폴더…",
          click: () => i("menu:pick-ann-folder")
        },
        { type: "separator" },
        {
          label: "인쇄…",
          accelerator: "CmdOrCtrl+P",
          click: () => n == null ? void 0 : n.webContents.print({})
        },
        { type: "separator" },
        t ? { role: "close" } : { role: "quit", label: "종료" }
      ]
    },
    {
      label: "편집",
      submenu: [
        {
          label: "실행 취소",
          accelerator: "CmdOrCtrl+Z",
          click: () => i("menu:undo")
        },
        {
          label: "다시 실행",
          accelerator: "CmdOrCtrl+Shift+Z",
          click: () => i("menu:redo")
        },
        { type: "separator" },
        { role: "cut", label: "잘라내기" },
        { role: "copy", label: "복사" },
        { role: "paste", label: "붙여넣기" },
        { role: "selectAll", label: "모두 선택" }
      ]
    },
    {
      label: "보기",
      submenu: [
        {
          label: "설정",
          accelerator: "CmdOrCtrl+,",
          click: () => i("menu:settings")
        },
        {
          label: "단축키 도움말",
          accelerator: "CmdOrCtrl+/",
          click: () => i("menu:shortcuts")
        },
        { type: "separator" },
        {
          label: "전체 화면",
          accelerator: "F11",
          click: () => {
            n && n.setFullScreen(!n.isFullScreen());
          }
        },
        { role: "togglefullscreen", label: "전체 화면 (시스템)" },
        { type: "separator" },
        { role: "reload", label: "새로고침" },
        { role: "toggleDevTools", label: "개발자 도구" },
        { type: "separator" },
        { role: "resetZoom", label: "실제 크기" },
        { role: "zoomIn", label: "확대" },
        { role: "zoomOut", label: "축소" }
      ]
    },
    {
      label: "도움말",
      submenu: [
        {
          label: "온점 정보",
          click: () => {
            u.showMessageBox(n, {
              type: "info",
              title: "온점",
              message: "온점 (Onjeom) v0.3",
              detail: `Multi-format document viewer with freehand annotation.
MD · PDF · EPUB · DOCX

MIT License`
            });
          }
        }
      ]
    }
  ];
  x.setApplicationMenu(x.buildFromTemplate(e));
}
const S = [
  {
    name: "Documents",
    extensions: ["md", "markdown", "txt", "pdf", "epub", "docx"]
  },
  { name: "Markdown", extensions: ["md", "markdown"] },
  { name: "PDF", extensions: ["pdf"] },
  { name: "EPUB", extensions: ["epub"] },
  { name: "Word", extensions: ["docx"] },
  { name: "Text", extensions: ["txt"] },
  { name: "All Files", extensions: ["*"] }
];
async function k(t) {
  const e = a.extname(t).toLowerCase().replace(".", ""), o = e === "markdown" ? "md" : e, s = a.basename(t), l = await c.readFile(t), d = /* @__PURE__ */ new Set(["md", "markdown", "txt", "html", "htm"]);
  return d.has(e) || d.has(o) ? {
    path: t,
    name: s,
    ext: o,
    data: l.toString("utf8"),
    isText: !0,
    encoding: "utf8"
  } : {
    path: t,
    name: s,
    ext: o,
    data: l.toString("base64"),
    isText: !1,
    encoding: "base64"
  };
}
function w() {
  return n && !n.isDestroyed() ? n : void 0;
}
r.handle("dialog:openFile", async () => {
  try {
    const t = await u.showOpenDialog(w(), {
      title: "문서 열기",
      properties: ["openFile", "multiSelections"],
      filters: S
    });
    if (t.canceled || !t.filePaths.length) return null;
    const e = [];
    for (const o of t.filePaths)
      e.push(await k(o));
    return e;
  } catch (t) {
    throw console.error("[onjeom] openFile failed", t), t instanceof Error ? t : new Error(String(t));
  }
});
r.handle("fs:readFile", async (t, e) => k(e));
r.handle(
  "dialog:saveFile",
  async (t, e) => {
    const o = await u.showSaveDialog(w(), {
      defaultPath: e.defaultPath,
      filters: e.filters || [{ name: "All", extensions: ["*"] }]
    });
    return o.canceled || !o.filePath ? null : (typeof e.data == "string" ? e.encoding === "base64" ? await c.writeFile(o.filePath, Buffer.from(e.data, "base64")) : await c.writeFile(o.filePath, e.data, "utf8") : await c.writeFile(o.filePath, Buffer.from(new Uint8Array(e.data))), o.filePath);
  }
);
r.handle("dialog:openJson", async () => {
  const t = await u.showOpenDialog(w(), {
    properties: ["openFile"],
    filters: [
      { name: "JSON", extensions: ["json"] },
      { name: "All", extensions: ["*"] }
    ]
  });
  if (t.canceled || !t.filePaths[0]) return null;
  const e = await c.readFile(t.filePaths[0], "utf8");
  return { path: t.filePaths[0], text: e };
});
r.handle("dialog:pickFolder", async () => {
  const t = await u.showOpenDialog(w(), {
    properties: ["openDirectory", "createDirectory"]
  });
  return t.canceled || !t.filePaths[0] ? null : t.filePaths[0];
});
r.handle("ann:write", async (t, e, o, s) => {
  await c.mkdir(e, { recursive: !0 });
  const l = o.replace(/[<>:"/\\|?*\u0000-\u001F]/g, "_").slice(0, 180), d = a.join(e, `${l}.onjeom.json`);
  return await c.writeFile(d, s, "utf8"), d;
});
r.handle("ann:readAll", async (t, e) => {
  if (!e || !h(e)) return {};
  const o = await c.readdir(e), s = {};
  for (const l of o)
    if (l.endsWith(".onjeom.json"))
      try {
        const d = await c.readFile(a.join(e, l), "utf8"), m = JSON.parse(d), P = m.key || l.replace(/\.onjeom\.json$/, "");
        s[P] = m.annotations ?? m.data ?? m;
      } catch {
      }
  return s;
});
r.handle("shell:openPath", async (t, e) => b.openPath(e));
r.handle("shell:showItem", async (t, e) => {
  b.showItemInFolder(e);
});
r.handle("app:ping", async () => ({ ok: !0, version: p.getVersion() }));
p.whenReady().then(() => {
  j(), p.on("activate", () => {
    F.getAllWindows().length === 0 && j();
  });
});
p.on("window-all-closed", () => {
  process.platform !== "darwin" && p.quit();
});
