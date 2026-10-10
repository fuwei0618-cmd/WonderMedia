/* WonderMedia — 小瑋的記錄之流
   源頭（隨手記文字／語音／照片、拍照教練）→ 河流（所有紀錄依時間流下、標籤、挑選）
   → 工作台（企劃 → 天 → 地點積木、剪映草稿流程）→ 出海口（發布與成效）
   資料：裝置上先存（不怕沒網路），登入 OneDrive 後同步；檔案用好剪的檔名上傳到 OneDrive。 */
"use strict";
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const pad = n => String(n).padStart(2, "0");
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const todayISO = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const nowHM = () => { const d = new Date(); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
const stamp = () => { const d = new Date(); return pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); };
const WD = "日一二三四五六";
const md = iso => { if (!iso) return ""; const d = new Date(iso + "T00:00"); return (d.getMonth() + 1) + "/" + d.getDate() + "（" + WD[d.getDay()] + "）"; };
const ls = {
  get(k, d) { try { const v = localStorage.getItem("wondermedia-" + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { if (v == null) localStorage.removeItem("wondermedia-" + k); else localStorage.setItem("wondermedia-" + k, JSON.stringify(v)); } catch (e) {} }
};
function toast(msg) { const t = document.createElement("div"); t.className = "toast"; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2400); }
const safeName = s => String(s || "").replace(/[\\/:*?"<>|#%\s]+/g, "").slice(0, 24) || "未命名";

/* ---------- 場景積木 ---------- */
const F = (k, l, kind, extra) => ({ k, l, kind, ...(extra || {}) });
const S = (n, h, sec) => ({ n, h, sec });
const BUILTIN = {
  food: { name: "食・餐廳", cls: "t-food", fields: [F("queue", "排隊（分鐘）", "num"), F("cost", "花費", "text"), F("order", "點了什麼", "text", { full: 1 }), F("taste", "好吃程度", "stars"), F("again", "回訪意願", "opts", { opts: ["會", "看情況", "不會"] }), F("one", "一句話評價", "text", { full: 1 })],
    shots: [S("門口招牌", "招牌和店名，順便帶到排隊人潮", 3), S("店內環境", "手機慢慢掃過座位和裝潢", 5), S("菜單點餐", "拍價格，錄大家討論要點什麼", 3), S("料理過程", "看得到廚房就拍，看不到跳過", 5), S("上菜那一刻", "端上桌、打開蓋子", 5), S("食物特寫", "油亮表皮、夾起來看厚度", 5), S("第一口反應", "吃第一口的表情", 5), S("一人一句評價", "每個人對鏡頭講一句", 8)] },
  cook: { name: "食・自己煮", cls: "t-cook", fields: [F("dish", "做了什麼", "text", { full: 1 }), F("cost", "食材花費", "text"), F("time", "花多久", "text"), F("one", "一句話心得", "text", { full: 1 })],
    shots: [S("食材一字排開", "俯拍桌面", 3), S("備料", "切、洗、醃", 5), S("下鍋", "聲音很重要，收音", 5), S("成品", "擺盤後俯拍＋側拍", 4), S("開吃", "第一口反應", 5)] },
  wear: { name: "衣・穿搭購物", cls: "t-wear", fields: [F("items", "單品", "text", { full: 1 }), F("cost", "價格", "text"), F("where", "在哪買", "text"), F("one", "一句話", "text", { full: 1 })],
    shots: [S("全身", "鏡子或請人拍，頭到腳", 4), S("單品細節", "布料、鈕扣、鞋", 4), S("試穿", "轉一圈", 5), S("價格標", "吊牌特寫", 2)] },
  stay: { name: "住・住宿居家", cls: "t-stay", fields: [F("cost", "一晚多少", "text"), F("pros", "優點", "text", { full: 1 }), F("cons", "缺點", "text", { full: 1 }), F("again", "會再住嗎", "opts", { opts: ["會", "看情況", "不會"] })],
    shots: [S("外觀／大廳", "", 4), S("開門那一刻", "第一眼的房間", 5), S("房間全景", "慢慢轉一圈", 6), S("浴室與備品", "", 4), S("窗外景色", "", 4), S("優缺點口播", "坐在床上講", 8)] },
  move: { name: "行・移動", cls: "t-move", fields: [F("how", "交通方式", "text"), F("time", "花多久", "text"), F("cost", "車資", "text")],
    shots: [S("交通工具", "", 3), S("窗外風景", "", 5), S("碎碎念", "", 6)] },
  learn: { name: "育・學習課程", cls: "t-learn", fields: [F("what", "學了什麼", "text", { full: 1 }), F("cost", "費用", "text"), F("one", "一句話心得", "text", { full: 1 })],
    shots: [S("環境", "", 4), S("過程", "", 6), S("成果", "", 4), S("心得", "", 8)] },
  play: { name: "樂・景點活動", cls: "t-play", fields: [F("ticket", "門票", "text"), F("time", "建議待多久", "text"), F("tip", "小撇步", "text", { full: 1 }), F("one", "一句心得", "text", { full: 1 })],
    shots: [S("遠景全貌", "", 4), S("走進去", "跟拍或第一人稱", 5), S("細節特寫", "", 4), S("人在景裡", "", 5), S("一句心得", "", 6)] },
  night: { name: "樂・酒吧夜生活", cls: "t-night", fields: [F("drink", "喝了什麼", "text", { full: 1 }), F("cost", "花費", "text"), F("one", "一句話", "text", { full: 1 })],
    shots: [S("門口", "", 3), S("氣氛燈光", "", 5), S("調酒過程", "", 6), S("乾杯", "", 3), S("酒單推薦", "", 4)] },
  music: { name: "音・演出", cls: "t-music", fields: [F("songs", "曲目", "text", { full: 1 }), F("who", "和誰一起", "text"), F("one", "一句心得", "text", { full: 1 })],
    shots: [S("場地", "", 4), S("準備", "調音、暖身", 5), S("演出", "固定一台長拍", 30), S("觀眾", "", 4), S("謝幕", "", 4)] },
  free: { name: "番外・自由", cls: "t-free", fields: [F("one", "備註", "text", { full: 1 })], shots: [] }
};
const TAGS = ["生活", "旅行", "音樂"];
function blocks() { const c = (DATA && DATA.docs && DATA.docs.blocks) || {}; const out = {}; for (const k in BUILTIN) out[k] = { ...BUILTIN[k], shots: (c[k] && c[k].shots) || BUILTIN[k].shots }; return out; }

/* ---------- 資料（同 Lucky：一個 JSON，裝置快取＋OneDrive 同步） ---------- */
let DATA = null, ETAG = null, DIRTY = false;
const CACHE_KEY = "cache";
function emptyData() { return { v: 1, projects: {}, docs: {}, deleted: {}, stream: {}, posts: {} }; }
function seedData() {
  const d = emptyData(), sat = nextSaturday();
  const pl = newPlace("鰻天下", "food", "12:00");
  d.projects.p_eel = { title: "週末吃鰻天下", tag: "生活", createdAt: todayISO(), days: [{ id: "d1", date: sat, title: "家庭聚餐", places: [pl] }], _u: Date.now() };
  return d;
}
function nextSaturday() { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function newPlace(name, type, time) { const sh = blocks()[type].shots; return { id: uid("pl"), name, type, time: time || "", info: {}, shots: (sh.length ? sh : [S("隨手拍", "想拍就拍，不用照清單；之後要清單再到 ⋯ 換積木", 0)]).map(s => ({ id: uid("s"), ...s, done: false, clips: [] })), notes: [], laughs: [] }; }
function normalize(d) { d = d || emptyData(); d.projects = d.projects || {}; d.docs = d.docs || {}; d.deleted = d.deleted || {}; d.stream = d.stream || {}; d.posts = d.posts || {}; return d; }
function merge(a, b) {
  a = normalize(a); b = normalize(b); const out = emptyData();
  for (const k of new Set([...Object.keys(a.deleted), ...Object.keys(b.deleted)])) out.deleted[k] = Math.max(a.deleted[k] || 0, b.deleted[k] || 0);
  for (const id of new Set([...Object.keys(a.projects), ...Object.keys(b.projects)])) {
    const x = a.projects[id], y = b.projects[id]; const r = !x ? y : !y ? x : ((y._u || 0) > (x._u || 0) ? y : x);
    if ((out.deleted["p/" + id] || 0) >= (r._u || 0)) continue; out.projects[id] = r;
  }
  for (const k of new Set([...Object.keys(a.docs), ...Object.keys(b.docs)])) { const x = a.docs[k], y = b.docs[k]; out.docs[k] = !x ? y : !y ? x : ((y._u || 0) > (x._u || 0) ? y : x); }
  for (const [box, pre] of [["stream", "s/"], ["posts", "o/"]]) for (const id of new Set([...Object.keys(a[box]), ...Object.keys(b[box])])) {
    const x = a[box][id], y = b[box][id]; const r = !x ? y : !y ? x : ((y._u || 0) > (x._u || 0) ? y : x);
    if ((out.deleted[pre + id] || 0) >= (r._u || 0)) continue; out[box][id] = r;
  }
  return out;
}
function writeCache() { ls.set(CACHE_KEY, { data: DATA, eTag: ETAG, dirty: DIRTY }); }
function touch(pid) { if (pid && DATA.projects[pid]) DATA.projects[pid]._u = Date.now(); DIRTY = true; writeCache(); scheduleSync(); }
function touchRec(r) { r._u = Date.now(); DIRTY = true; writeCache(); scheduleSync(); }
function saveBlocks(type, shots) { DATA.docs.blocks = DATA.docs.blocks || { _u: 0 }; DATA.docs.blocks[type] = { shots: shots.map(s => ({ n: s.n, h: s.h, sec: s.sec })) }; DATA.docs.blocks._u = Date.now(); DIRTY = true; writeCache(); scheduleSync(); }

/* ---------- 影片先存在手機（IndexedDB），有網路再上傳 ---------- */
const MEM = new Map(); let IDB_OK = true;
const IDB0 = {
  db: null,
  open() { if (this.db) return Promise.resolve(this.db); return new Promise((res, rej) => { setTimeout(() => rej(new Error("timeout")), 3000); const r = indexedDB.open("wondermedia", 1); r.onupgradeneeded = () => r.result.createObjectStore("media"); r.onsuccess = () => { this.db = r.result; res(this.db); }; r.onerror = () => rej(r.error); }); },
  async put(k, v) { const db = await this.open(); return new Promise((res, rej) => { const t = db.transaction("media", "readwrite"); t.objectStore("media").put(v, k); t.oncomplete = res; t.onerror = () => rej(t.error); }); },
  async get(k) { const db = await this.open(); return new Promise((res, rej) => { const r = db.transaction("media").objectStore("media").get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); },
  async del(k) { const db = await this.open(); return new Promise(res => { const t = db.transaction("media", "readwrite"); t.objectStore("media").delete(k); t.oncomplete = res; t.onerror = res; }); }
};
const IDB = {
  async put(k, v) { if (IDB_OK) { try { return await IDB0.put(k, v); } catch (e) { IDB_OK = false; toast("這個瀏覽器不能把影片存在手機，請從主畫面的 WonderMedia 開啟並登入"); } } MEM.set(k, v); },
  async get(k) { if (MEM.has(k)) return MEM.get(k); if (!IDB_OK) return undefined; try { return await IDB0.get(k); } catch (e) { return undefined; } },
  async del(k) { MEM.delete(k); if (IDB_OK) { try { await IDB0.del(k); } catch (e) {} } }
};
const extOf = (f, type) => { const m = /\.([a-z0-9]{2,5})$/i.exec(f && f.name || ""); if (m) return m[1].toLowerCase(); return /quicktime/.test(type) ? "mov" : /mp4/.test(type) ? (/audio/.test(type) ? "m4a" : "mp4") : /webm/.test(type) ? "webm" : /jpeg/.test(type) ? "jpg" : /png/.test(type) ? "png" : "bin"; };

/* ---------- Microsoft 登入：共用 Origina（Entry/sync/origina-sync.js），資料在 OneDrive › 應用程式 › Origina › WonderMedia ---------- */
const GRAPH = "https://graph.microsoft.com/v1.0";
const ROOT = "";
const DATA_FILE = ROOT + "wondermedia-data.json";
const APPROOT = "/me/drive/special/approot:/WonderMedia/";
const OS = window.OriginaSync;
const login = () => OS.login(false);
async function handleRedirect() {
  // 從舊資料夾（應用程式／Origina／WonderMedia）換到 Origina：舊的版本標記不能用了，下次同步整份重新上傳
  if (ls.get("folder", "") !== "Origina") { const c = ls.get(CACHE_KEY, null); if (c) { c.eTag = null; c.dirty = true; ls.set(CACHE_KEY, c); } ls.set("tok", null); ls.set("folder", "Origina"); }
  if (!(await OS.getToken())) await OS.ensureToken(true);
}
const getToken = () => OS.getToken();
async function gfetch(path, opts = {}) {
  for (let i = 0; i < 2; i++) { const tok = await getToken(); if (!tok) throw { code: "auth" }; const r = await fetch(path.startsWith("http") ? path : GRAPH + path, { ...opts, headers: { ...(opts.headers || {}), Authorization: "Bearer " + tok } }); if (r.status === 401 && i === 0) { try { const t = JSON.parse(localStorage.getItem("lucky-token")); t.exp = 0; localStorage.setItem("lucky-token", JSON.stringify(t)); } catch (e) {} continue; } return r; }
}
const signedIn = () => { try { return !!JSON.parse(localStorage.getItem("lucky-token")); } catch (e) { return false; } };
function logout() { localStorage.removeItem("lucky-token"); location.assign("https://login.microsoftonline.com/consumers/oauth2/v2.0/logout?post_logout_redirect_uri=" + encodeURIComponent(location.href.split(/[?#]/)[0])); }

let syncChain = Promise.resolve(), syncTimer = null, SYNC = "local";
function scheduleSync() { clearTimeout(syncTimer); syncTimer = setTimeout(sync, 900); }
function sync() { syncChain = syncChain.then(syncOnce).catch(() => {}); return syncChain; }
async function syncOnce() {
  if (!signedIn()) { SYNC = "local"; return; }
  try {
    for (let round = 0; round < 3; round++) {
      const r = await gfetch(APPROOT + encodeURI(DATA_FILE));
      if (r.status === 404) { DIRTY = true; ETAG = null; }
      else if (r.ok) { const meta = await r.json(); if (meta.eTag !== ETAG) { const c = await fetch(meta["@microsoft.graph.downloadUrl"]); if (!c.ok) throw { code: "net" }; DATA = merge(DATA, await c.json()); ETAG = meta.eTag; DIRTY = true; } }
      else throw { code: "net" };
      if (!DIRTY) break;
      const h = { "Content-Type": "application/json" }; if (ETAG) h["If-Match"] = ETAG;
      const p = await gfetch(APPROOT + encodeURI(DATA_FILE) + ":/content", { method: "PUT", headers: h, body: JSON.stringify(DATA) });
      if (p.status === 412) { ETAG = "stale"; continue; } if (!p.ok) throw { code: "net" };
      ETAG = (await p.json()).eTag; DIRTY = false; break;
    }
    SYNC = "ok";
  } catch (e) { SYNC = e && e.code === "auth" ? "expired" : "offline"; }
  writeCache(); render(); uploadPending();
}
addEventListener("online", () => sync());
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") sync(); });

/* 上傳：OneDrive/應用程式/Origina/WonderMedia/<企劃>/D1_鰻天下_02_店內環境_1010-1215.mp4 */
let uploading = false;
function allClips() { const out = []; for (const pid in DATA.projects) { const p = DATA.projects[pid]; p.days.forEach(d => d.places.forEach(pl => { pl.shots.forEach(s => s.clips.forEach(c => out.push({ p, pid, c }))); pl.notes.forEach(n => (n.media || []).forEach(c => out.push({ p, pid, c }))); })); } for (const id in DATA.stream) (DATA.stream[id].media || []).forEach(c => out.push({ p: null, pid: null, c, rec: DATA.stream[id] })); return out; }
async function uploadPending() {
  if (uploading || !signedIn() || !navigator.onLine) return; uploading = true;
  try {
    for (const { pid, c } of allClips()) {
      if (c.od) continue; const rec = await IDB.get(c.key); if (!rec) continue;
      const path = APPROOT + encodeURI(ROOT + c.path);
      const f = rec.blob; let item;
      if (f.size <= 4 * 1024 * 1024) { const r = await gfetch(path + ":/content", { method: "PUT", headers: { "Content-Type": rec.type || "application/octet-stream" }, body: f }); if (!r.ok) throw 0; item = await r.json(); }
      else {
        const r = await gfetch(path + ":/createUploadSession", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ item: { "@microsoft.graph.conflictBehavior": "rename" } }) }); if (!r.ok) throw 0;
        const { uploadUrl } = await r.json(); const CH = 320 * 1024 * 16; let start = 0;
        while (start < f.size) { const end = Math.min(start + CH, f.size); const rr = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Range": "bytes " + start + "-" + (end - 1) + "/" + f.size }, body: f.slice(start, end) }); if (rr.status === 200 || rr.status === 201) { item = await rr.json(); break; } if (rr.status !== 202) throw 0; start = end; c.pct = Math.round(end / f.size * 100); render(); }
      }
      if (item && item.id) { c.od = item.id; delete c.pct; if (pid) touch(pid); else { const r = Object.values(DATA.stream).find(x => (x.media || []).includes(c)); r ? touchRec(r) : touch(null); } await IDB.del(c.key); render(); }
    }
  } catch (e) { toast("有影片還沒上傳完，連上 Wi-Fi 會自動繼續"); }
  uploading = false; render();
}
async function addClip(pid, file, path, kind) {
  const key = uid("m"); await IDB.put(key, { blob: file, type: file.type });
  const c = { key, kind, path, name: path.split("/").pop(), od: null, at: Date.now() };
  return c;
}

/* ---------- 畫面 ---------- */
const view = { tab: "src", pid: null, day: 0, place: null };
function go(hash) { location.hash = hash; }
function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1)).split("/");
  view.tab = h[0] || "src"; view.pid = h[1] || null; view.day = Number(h[2] || 0); view.place = h[3] || null;
}
addEventListener("hashchange", () => { parseHash(); render(); scrollTo(0, 0); });

function syncBanner() {
  if (SYNC === "ok") { const n = allClips().filter(x => !x.c.od).length; return n ? `<div class="banner"><span>⬆️ ${n} 段影片上傳中…</span></div>` : ""; }
  if (SYNC === "expired" || !signedIn()) return `<div class="banner"><span>先存在這支手機。登入 OneDrive 後，紀錄和影片才會傳到電腦給 Claude 剪。</span><button class="btn sm primary" data-act="login">登入</button></div>`;
  if (SYNC === "offline") return `<div class="banner"><span>目前沒網路，先存在手機，連上會自動上傳</span></div>`;
  return "";
}
function render() {
  if (!DATA) return;
  const app = $("#app");
  if (view.tab === "src") app.innerHTML = srcHTML();
  else if (view.tab === "river") app.innerHTML = riverHTML();
  else if (view.tab === "sea") app.innerHTML = seaHTML();
  else if (view.tab === "blocks") app.innerHTML = blocksHTML();
  else if (view.tab === "wb") app.innerHTML = wbHTML(view.pid);
  else if (view.tab === "set") app.innerHTML = settingsHTML();
  else if (view.tab === "p" && view.place && DATA.projects[view.pid]) app.innerHTML = placeHTML();
  else if (view.tab === "p" && DATA.projects[view.pid]) app.innerHTML = projectHTML();
  else app.innerHTML = homeHTML();
  $("#tabs").innerHTML = tabsHTML();
  fillThumbs();
}
const ICON = {
  src: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3c3 4 5 6.6 5 9.5A5 5 0 0 1 7 12.5C7 9.6 9 7 12 3z"/></svg>',
  river: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 7c3-2 6 2 9 0s6-2 9 0M3 12c3-2 6 2 9 0s6-2 9 0M3 17c3-2 6 2 9 0s6-2 9 0"/></svg>',
  sea: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 18c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 6 0M12 3v10M8 9l4 4 4-4"/></svg>',
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
  blocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  set: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>'
};
function tabsHTML() {
  const cur = view.tab === "p" || view.tab === "home" || view.tab === "blocks" || view.tab === "wb" ? "work" : view.tab === "set" ? "src" : view.tab;
  return `<button data-go="src" aria-current="${cur === "src"}">${ICON.src}源頭</button>
    <button data-go="river" aria-current="${cur === "river"}">${ICON.river}河流</button>
    <button class="rec" data-act="capture" aria-label="隨手記"><span class="dot"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></span></button>
    <button data-go="home" aria-current="${cur === "work"}">${ICON.home}工作台</button>
    <button data-go="sea" aria-current="${cur === "sea"}">${ICON.sea}出海口</button>`;
}
function laughCount(pl) { return (pl.laughs || []).length + pl.shots.reduce((a, s) => a + (s.laughs || []).length, 0); }
function progress(pl) { const n = pl.shots.length, d = pl.shots.filter(s => s.done || s.clips.length).length; return { n, d }; }
function homeHTML() {
  const ps = Object.entries(DATA.projects).map(([id, p]) => ({ id, ...p })).sort((a, b) => ((b.days[0] || {}).date || "").localeCompare((a.days[0] || {}).date || ""));
  const picks = riverItems().filter(x => x.o.pick);
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">工作台</h1></div>
  ${wbNav("plan")}
  <button class="btn primary wide quickgo" data-act="quickgo">⚡ 現在就拍<small>只要打地點，其他之後再補</small></button>
  <p class="hint">開企劃時選好賽道和劇本，分鏡積木和剪法會自動帶出來；從河流挑的素材也在這裡等著剪。</p>
  ${syncBanner()}
  <section class="section"><header><h2>⭐ 從河流挑的素材</h2><span class="muted mono" style="font-size:13px">${picks.length} 則</span></header>
    <div class="card">${picks.length ? `<div class="pickrow">${picks.slice(0, 12).map(x => thumbHTML(x)).join("")}</div><button class="btn primary wide" data-act="cutpicks" style="margin-top:12px">📋 複製「幫我剪：河流挑選」</button>` : `<p class="hint">在河流裡按 ☆ 挑選，挑好的會出現在這裡。</p>`}</div></section>
  <section class="section"><header><h2>拍攝企劃</h2><span class="row" style="gap:6px"><button class="btn sm ghost" data-act="fromworld">🌏 從 World 帶入</button><button class="btn sm ghost" data-act="newproj">＋ 完整企劃</button></span></header>
  <div class="stack">${ps.length ? ps.map(p => { const pls = p.days.flatMap(d => d.places); const tot = pls.reduce((a, pl) => a + pl.shots.length, 0), done = pls.reduce((a, pl) => a + progress(pl).d, 0);
    return `<button class="card pcard" data-go="p/${p.id}/0"><div class="row" style="justify-content:space-between"><span class="chip">${esc(p.tag)}</span><span class="mono muted" style="font-size:12px">${md((p.days[0] || {}).date)}${p.days.length > 1 ? " 起 " + p.days.length + " 天" : ""}</span></div>
      <div class="t" style="margin-top:6px">${esc(p.title)}</div><div class="row muted" style="font-size:13px;margin-top:4px">${pls.map(x => esc(x.name)).join("・") || "還沒有地點"}</div>
      <div class="row" style="margin-top:8px;font-size:12px"><span class="bar"><i style="width:${tot ? done / tot * 100 : 0}%"></i></span><span class="muted">鏡頭 ${done}/${tot}</span></div></button>`; }).join("") : `<div class="card empty"><b>還沒有企劃</b>按「＋ 新企劃」開始</div>`}</div></section>`;
}
function projectHTML() {
  const p = DATA.projects[view.pid], di = Math.min(view.day, p.days.length - 1), d = p.days[di];
  const pls = [...d.places].sort((a, b) => (a.time || "99").localeCompare(b.time || "99"));
  return `<div class="top"><button class="icon-btn" data-go="home" aria-label="返回">‹</button><h1>${esc(p.title)}</h1><button class="icon-btn" data-act="projmenu" aria-label="更多">⋯</button></div>
  <div class="daytabs">${p.days.map((x, i) => `<button data-go="p/${view.pid}/${i}" aria-current="${i === di}"><b>D${i + 1}</b><small>${esc(md(x.date).replace(/（.*/, ""))}</small></button>`).join("")}<button data-act="addday"><b>＋</b><small>加一天</small></button></div>
  ${syncBanner()}
  ${projFormula(p)}
  ${scriptCard(p)}
  <div class="dayhead t-food" style="--tc:var(--muted);margin-top:10px"><div class="row"><span class="mono muted" style="font-size:13px">D${di + 1}・${esc(md(d.date))}</span><span class="chip">${esc(p.tag)}</span><span class="grow"></span><button class="icon-btn" data-act="editday" aria-label="編輯這天">✎</button></div><h1>${esc(d.title || p.title)}</h1></div>
  <p class="hint" style="margin-top:6px">每個地點選一塊場景積木，拍攝清單會自動帶出來。拍完一個鏡頭就把影片掛上去。</p>
  <section class="section"><h2>這天的地點</h2><div class="card"><div class="tl">
    <div class="insert"><button data-act="addplace">＋ 插入地點</button></div>
    ${pls.length ? pls.map(pl => { const b = blocks()[pl.type] || BUILTIN.free, pr = progress(pl);
      return `<div class="item ${b.cls}" data-go="p/${view.pid}/${di}/${pl.id}" style="cursor:pointer"><time>${esc(pl.time || "—")}</time><div><div class="t"><span>${esc(pl.name)}</span><span class="muted">›</span></div>
        <div class="meta"><span class="chip type">${esc(b.name)}</span>${pr.n ? `<span class="chip">鏡頭 ${pr.d}/${pr.n}</span>` : ""}${laughCount(pl) ? `<span class="chip">⭐ ${laughCount(pl)}</span>` : ""}${pl.notes.length ? `<span class="chip">📝 ${pl.notes.length}</span>` : ""}</div></div></div>
        <div class="insert"><button data-act="addplace">＋ 插入地點</button></div>`; }).join("") : `<div class="empty"><b>這天還沒有地點</b>按「插入地點」開始</div>`}
  </div></div></section>
  <section class="section"><div class="card stack"><b>拍完了？選要剪多大範圍</b>
    <div><button class="btn primary wide" data-act="cutday">📋 這一天幫我剪（D${di + 1}）</button><p class="hint" style="margin:4px 0 0">${projSummary(p, di)}</p></div>
    ${p.days.length > 1 ? `<div><button class="btn wide" data-act="cutproj">📋 整個企劃幫我剪</button><p class="hint" style="margin:4px 0 0">${projSummary(p)}</p></div>` : ""}
    <p class="hint" style="margin:0">只要剪一個地點，點進地點，最下面也有「幫我剪」。</p></div></section>`;
}
function fieldHTML(f, v) {
  if (f.kind === "stars") return `<div class="stars" data-f="${f.k}">${[1, 2, 3, 4, 5].map(i => `<button data-star="${i}" class="${(v || 0) >= i ? "on" : ""}" aria-label="${i} 顆星">★</button>`).join("")}</div>`;
  if (f.kind === "opts") return `<div class="opts" data-f="${f.k}">${f.opts.map(o => `<button data-opt="${esc(o)}" class="${v === o ? "on" : ""}">${esc(o)}</button>`).join("")}</div>`;
  return `<input data-f="${f.k}" ${f.kind === "num" ? 'inputmode="numeric"' : ""} value="${esc(v || "")}" placeholder="${f.kind === "num" ? "0" : ""}">`;
}
const KIND_ICON = { video: "🎬", audio: "🎙️", photo: "📷" };
function clipChip(c) { const st = c.od ? "up" : "wait"; const lab = c.od ? "✓ 已上傳" : c.pct != null ? c.pct + "%" : signedIn() ? "等待上傳" : "存在手機"; return `<span class="clip ${st}" title="${esc(c.name)}" data-view="${c.key}" role="button" style="cursor:pointer">${KIND_ICON[c.kind] || "🎬"} ${lab} ▸<button class="icon-btn" style="width:20px;height:20px" data-rmclip="${c.key}" aria-label="移除">×</button></span>`; }
function placeHTML() {
  const p = DATA.projects[view.pid], d = p.days[view.day], pl = d.places.find(x => x.id === view.place);
  if (!pl) { go("p/" + view.pid + "/" + view.day); return ""; }
  const b = blocks()[pl.type] || BUILTIN.free, pr = progress(pl);
  const INFO = `  <section class="section"><h2>📝 這一站的紀錄</h2><div class="card grid2" id="info">
    ${b.fields.map(f => `<div class="field ${f.full ? "full" : ""}"><label>${esc(f.l)}</label>${fieldHTML(f, pl.info[f.k])}</div>`).join("")}
  </div></section>`;
  const SHOTS = `  <section class="section"><header><h2>🎬 拍攝清單</h2><span class="muted mono" style="font-size:13px">${pr.d} / ${pr.n}</span></header>
    <div class="card">${pl.shots.map((s, i) => `<div data-drop="${s.id}" class="shot ${s.done || s.clips.length ? "done" : ""}"><input type="checkbox" data-done="${s.id}" ${s.done || s.clips.length ? "checked" : ""} aria-label="${esc(s.n)} 拍好了">
      <div><div class="n" data-rename="${s.id}" role="button">${pad(i + 1)} ${esc(s.n)}${s.n.startsWith("待補") ? ` <span class="chip">點我取名</span>` : ""}</div>${s.h ? `<div class="h">${esc(s.h)}</div>` : ""}<div class="clips">${s.clips.map(clipChip).join("")}</div>${s.clips.filter(c => c.text).map(c => `<div class="h" style="margin-top:4px">🎙️ ${esc(c.text)}</div>`).join("")}${s.note ? `<div class="snote" data-snote="${s.id}">📝 ${esc(s.note)}</div>` : ""}
      <div class="clips"><button class="addclip" data-cam="${s.id}">🎬 拍攝</button><button class="addclip" data-dual="${s.id}">📸 雙鏡頭</button><label class="addclip">🖼️ 相簿<input type="file" accept="video/*,image/*" multiple class="vh" data-upload="${s.id}"></label><button class="addclip" data-rec="${s.id}">🎙️ 錄音</button><button class="addclip" data-snote="${s.id}">📝 筆記</button><button class="addclip${(s.laughs || []).length ? " on" : ""}" data-laugh="${s.id}">⭐ 笑點${(s.laughs || []).length ? " " + s.laughs.length : ""}</button></div></div>
      <span class="sec">${s.sec ? s.sec + "秒" : ""}</span></div>`).join("") || `<p class="hint">這塊積木沒有固定鏡頭，用下面的「記一則」自由記錄。</p>`}
      <div class="qadd"><input id="qshot" placeholder="＋ 快速加鏡頭，打完按 Enter" enterkeyhint="done" aria-label="快速加鏡頭"><button class="btn sm primary" data-act="qshot">加</button></div>
      <div class="qsug"><button class="tg on" data-qs="待補">＋待補</button>${shotSuggest(pl).map(n => `<button class="tg" data-qs="${esc(n)}">＋${esc(n)}</button>`).join("")}</div>
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="editshots">✎ 編輯鏡頭</button></div></div>
    <p class="hint">每個鏡頭都可以拍影片或直接錄音。拍到好笑的瞬間按那個鏡頭的「⭐ 笑點」，Claude 剪片時會把那段留下來、加料。</p></section>`;
  return `<div class="top"><button class="icon-btn" data-go="p/${view.pid}/${view.day}" aria-label="返回">‹</button><h1>${esc(p.title)}</h1><button class="icon-btn" data-act="placemenu" aria-label="更多">⋯</button></div>
  <div class="dayhead ${b.cls}"><div class="row"><span class="mono muted" style="font-size:13px">D${view.day + 1}・${esc(pl.time || "")}</span><span class="chip type">${esc(b.name)}</span></div><h1>${esc(pl.name)}</h1></div>
  ${pl.type === "free" ? SHOTS + INFO : INFO + SHOTS}
  <section class="section"><header><h2>🎙️ 隨手記</h2><button class="btn sm primary" data-act="note">＋ 記一則</button></header>
    <div class="card">${pl.notes.length ? pl.notes.map(n => `<div class="note"><time>${new Date(n.ts).toTimeString().slice(0, 5)}</time>${n.text ? `<p>${esc(n.text)}</p>` : ""}<div class="clips">${(n.media || []).map(c => `<span class="clip ${c.od ? "up" : "wait"}">${c.kind === "audio" ? "🎙️" : c.kind === "photo" ? "📷" : "🎬"} ${c.od ? "已上傳" : "未上傳"}</span>`).join("")}</div></div>`).join("") : `<p class="hint">吃完對手機講一分鐘心得最好用：Claude 會用你自己的話寫配音腳本。</p>`}</div></section>
  <section class="section"><div class="card"><b>拍完了？</b><p class="hint" style="margin:4px 0 10px">按下面複製一句話，貼到 Claude 的「自媒體大神工具」對話就會開始剪。</p>
    <button class="btn primary wide" data-act="tocut">📋 複製「幫我剪」</button></div></section>`;
}
function blocksHTML() {
  const B = blocks();
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">工作台</h1></div>
  ${wbNav("scn")}
  <p class="wbq">分鏡｜每個地方拍什麼？</p>
  <p class="hint">新增地點時選一塊，拍攝清單就自動帶出。在地點裡改過鏡頭，可以按「存成這塊積木的預設」。</p>
  <section class="section"><div class="card">${Object.entries(B).map(([k, b]) => `<details class="blk"><summary class="row" style="cursor:pointer"><span class="chip type ${b.cls}">${esc(b.name)}</span><span class="muted" style="font-size:13px">${b.shots.length} 個鏡頭</span></summary>
    <ol style="margin:8px 0 0;padding-left:22px;font-size:14px">${b.shots.map(s => `<li>${esc(s.n)}${s.h ? `<span class="muted">｜${esc(s.h)}</span>` : ""}</li>`).join("") || "<li class='muted'>自由拍</li>"}</ol>
    <p class="hint" style="margin-top:6px">紀錄欄位：${b.fields.map(f => esc(f.l)).join("、")}</p></details>`).join("")}</div></section>`;
}
function settingsHTML() {
  return `<div class="top"><button class="icon-btn" data-go="src" aria-label="返回">‹</button><h1 style="font-size:20px">設定</h1></div>
  <section class="section"><h2>OneDrive</h2><div class="card stack">
    ${signedIn() ? `<div class="banner ok"><span>已登入，影片會傳到 OneDrive／應用程式／Origina／WonderMedia</span></div><button class="btn" data-act="sync">立即同步</button><button class="btn danger" data-act="logout">登出</button>`
      : `<p class="hint" style="margin:0">登入後：手機拍的影片會自動傳到 OneDrive，電腦同步下來，Claude 就能直接剪。沒登入也能用，影片先存在這支手機。</p><button class="btn primary" data-act="login">登入 OneDrive</button>`}
  </div></section>
  <section class="section"><h2>Claude 對話</h2><div class="card stack"><p class="hint" style="margin:0">按「幫我剪」會複製句子並打開這個對話，貼上就送出。換了對話就把新的網址貼進來。</p><input id="claudeurl" value="${esc(claudeURL())}" aria-label="WonderMedia 對話網址"></div></section>
  <section class="section"><h2>備份</h2><div class="card stack"><button class="btn" data-act="export">匯出全部紀錄（JSON）</button><p class="hint" style="margin:0">影片不在備份檔裡，影片在 OneDrive。</p></div></section>`;
}

/* ---------- sheet ---------- */
function sheet(html, onClose) {
  const s = document.createElement("div"); s.className = "scrim"; s.innerHTML = `<div class="sheet" role="dialog" aria-modal="true">${html}</div>`;
  const close = () => { s.remove(); onClose && onClose(); }; s._close = close; s.addEventListener("click", e => { if (e.target === s) close(); });
  document.body.appendChild(s); return s;
}
function form(title, fields, onSave, extra) {
  const sc = sheet(`<h2>${esc(title)}</h2>${fields.map(f => `<div class="field"><label for="f_${f.k}">${esc(f.l)}</label>${f.opts ? `<select id="f_${f.k}">${f.opts.map(o => `<option value="${esc(o[0])}" ${o[0] === f.v ? "selected" : ""}>${esc(o[1])}</option>`).join("")}</select>` : `<input id="f_${f.k}" type="${f.type || "text"}" value="${esc(f.v || "")}" placeholder="${esc(f.ph || "")}">`}</div>`).join("")}${extra || ""}<button class="btn primary wide" id="fsave">儲存</button><button class="btn ghost" id="fcancel">取消</button>`);
  $("#fcancel", sc).onclick = sc._close;
  $("#fsave", sc).onclick = () => { const v = {}; fields.forEach(f => v[f.k] = $("#f_" + f.k, sc).value.trim()); if (onSave(v, sc) !== false) sc._close(); };
  return sc;
}
const curProj = () => DATA.projects[view.pid];
const curDay = () => curProj().days[view.day];
const curPlace = () => curDay().places.find(x => x.id === view.place);
const typeOpts = () => Object.entries(blocks()).map(([k, b]) => [k, b.name]);

function newProject() {
  const W = wb();
  form("新企劃", [{ k: "title", l: "企劃名稱", ph: "例如：週末吃鰻天下" }, { k: "tag", l: "分類", opts: TAGS.map(t => [t, t]), v: "生活" },
    { k: "style", l: "0 風格・賽道（這支片是什麼味道？）", opts: [["", "先不選"]].concat(W.styles.map(x => [x.n, x.n])), v: "" },
    { k: "tpl", l: "1 劇本・影片模板（整支怎麼排？）", opts: [["", "先不選"]].concat(W.templates.map(x => [x.n, x.n + "：" + x.flow.join("→")])), v: "" },
    { k: "date", l: "日期（第一天）", type: "date", v: todayISO() }, { k: "days", l: "幾天", type: "number", v: "1" }], v => {
    if (!v.title) { toast("取個名字"); return false; }
    const n = Math.max(1, Math.min(14, Number(v.days) || 1)), days = [];
    for (let i = 0; i < n; i++) { const dt = new Date(v.date + "T00:00"); dt.setDate(dt.getDate() + i); days.push({ id: uid("d"), date: dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()), title: "", places: [] }); }
    const id = uid("p"); DATA.projects[id] = { title: v.title, tag: v.tag, style: v.style, tpl: v.tpl, createdAt: todayISO(), days, _u: Date.now() }; touch(id); go("p/" + id + "/0");
  }, `<p class="hint" style="margin:0">選了劇本，插入地點時會先推薦適合的分鏡積木；選了賽道，幫我剪會帶上預設剪法。</p>`);
}
function addPlace() {
  const sug = tplBlocks(curProj()), opts = typeOpts().sort((x, y) => (sug.indexOf(x[0]) < 0 ? 99 : sug.indexOf(x[0])) - (sug.indexOf(y[0]) < 0 ? 99 : sug.indexOf(y[0]))).map(o => [o[0], (sug.includes(o[0]) ? "★ " : "") + o[1]]);
  form("插入地點", [{ k: "name", l: "地點名稱", ph: "例如：鰻天下" }, { k: "type", l: "場景積木" + (sug.length ? "（★ 是劇本推薦的）" : ""), opts, v: sug[0] || "food" }, { k: "time", l: "時間", type: "time", v: nowHM() }], v => {
    if (!v.name) { toast("輸入地點名稱"); return false; }
    const pl = newPlace(v.name, v.type, v.time); curDay().places.push(pl); touch(view.pid); go(`p/${view.pid}/${view.day}/${pl.id}`);
  });
}
function editShots() {
  const pl = curPlace(); let shots = pl.shots.map(s => ({ ...s }));
  const rows = () => shots.map((s, i) => `<div class="ed" data-i="${i}"><span class="grip" data-grip="${i}" aria-label="按住拖曳排序">≡</span><input data-k="n" value="${esc(s.n)}" aria-label="鏡頭名稱"><input data-k="sec" inputmode="numeric" value="${s.sec || ""}" aria-label="秒數" placeholder="秒"><span class="row" style="gap:2px"><button class="icon-btn" data-up="${i}" aria-label="上移">↑</button><button class="icon-btn" data-down="${i}" aria-label="下移">↓</button><button class="icon-btn" data-del="${i}" aria-label="刪除">×</button></span><input data-k="h" value="${esc(s.h || "")}" placeholder="拍攝提示" style="grid-column:1/-1;font-size:13px"></div>`).join("");
  const sc = sheet(`<h2>編輯鏡頭</h2><p class="hint" style="margin:0">按住左邊 ≡ 上下拖曳就能排順序</p><div id="eds">${rows()}</div><button class="btn" id="addshot">＋ 加一個鏡頭</button>
    <label class="row" style="font-size:14px"><input type="checkbox" id="asdef"> 存成「${esc((blocks()[pl.type] || BUILTIN.free).name)}」積木的預設</label>
    <button class="btn primary wide" id="ssave">儲存</button>`);
  const box = $("#eds", sc), read = () => box.querySelectorAll(".ed").forEach(r => { const s = shots[r.dataset.i]; r.querySelectorAll("[data-k]").forEach(inp => s[inp.dataset.k] = inp.dataset.k === "sec" ? Number(inp.value) || 0 : inp.value.trim()); });
  sc.addEventListener("click", e => {
    const up = e.target.closest("[data-up]"), del = e.target.closest("[data-del]"), dn = e.target.closest("[data-down]");
    if (dn) { read(); const i = +dn.dataset.down; if (i < shots.length - 1) [shots[i + 1], shots[i]] = [shots[i], shots[i + 1]]; box.innerHTML = rows(); }
    if (up) { read(); const i = +up.dataset.up; if (i > 0) [shots[i - 1], shots[i]] = [shots[i], shots[i - 1]]; box.innerHTML = rows(); }
    if (del) { read(); const s = shots[+del.dataset.del]; if (s.clips && s.clips.length) { toast("這個鏡頭已經有影片，先移除影片"); return; } shots.splice(+del.dataset.del, 1); box.innerHTML = rows(); }
  });
  /* 按住 ≡ 上下拖曳排序（手機、電腦都可以） */
  let drag = null;
  box.addEventListener("pointerdown", e => { const g = e.target.closest("[data-grip]"); if (!g) return; e.preventDefault(); read(); drag = +g.dataset.grip; box.classList.add("sorting"); box.querySelector(`.ed[data-i="${drag}"]`).classList.add("lift"); });
  const move = e => { if (drag == null) return; e.preventDefault(); const rs = [...box.querySelectorAll(".ed")]; let to = rs.findIndex(r => { const b = r.getBoundingClientRect(); return e.clientY < b.top + b.height / 2; }); if (to < 0) to = rs.length - 1; if (to > drag) to = Math.min(to, rs.length - 1); if (to !== drag && to >= 0) { const [m] = shots.splice(drag, 1); shots.splice(to, 0, m); drag = to; box.innerHTML = rows(); box.querySelector(`.ed[data-i="${drag}"]`).classList.add("lift"); } };
  const end = () => { if (drag == null) return; drag = null; box.classList.remove("sorting"); box.querySelectorAll(".lift").forEach(r => r.classList.remove("lift")); };
  document.addEventListener("pointermove", move, { passive: false }); document.addEventListener("pointerup", end); document.addEventListener("pointercancel", end);
  const oldClose = sc._close; sc._close = () => { document.removeEventListener("pointermove", move); document.removeEventListener("pointerup", end); document.removeEventListener("pointercancel", end); oldClose(); };
  $("#addshot", sc).onclick = () => { read(); shots.push({ id: uid("s"), n: "新鏡頭", h: "", sec: 4, done: false, clips: [] }); box.innerHTML = rows(); };
  $("#ssave", sc).onclick = () => { read(); shots = shots.filter(s => s.n); pl.shots = shots.map(s => ({ clips: [], done: false, ...s })); if ($("#asdef", sc).checked) saveBlocks(pl.type, shots); touch(view.pid); sc._close(); render(); toast("已儲存"); };
}

/* 記一則：照片／影片／錄音（同步轉文字）／文字 */
function pickMime() { if (!window.MediaRecorder) return ""; for (const m of ["audio/mp4", "audio/webm;codecs=opus", "audio/webm"]) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} } return ""; }
function recorderHTML() { return `<div><button class="recbig" id="recbtn" aria-label="開始錄音">錄音</button><div class="timer" id="timer">00:00</div><p class="hint" id="rhint" style="text-align:center">按一下開始、再按一下停止，講話會同步轉成文字</p></div>`; }
function bindRecorder(sc, ta, onAudio) {
  let rec = null, stream = null, chunks = [], sr = null, timerId = null, t0 = 0;
  const btn = $("#recbtn", sc), timer = $("#timer", sc), hint = $("#rhint", sc);
  function stopAll() { try { if (rec && rec.state !== "inactive") rec.stop(); } catch (e) {} try { if (sr) { sr.onend = null; sr.stop(); } } catch (e) {} if (stream) stream.getTracks().forEach(x => x.stop()); clearInterval(timerId); }
  function startSR() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) { hint.textContent = "這裡不支援即時轉文字，錄音仍會保存"; return; }
    sr = new SR(); sr.lang = "zh-TW"; sr.continuous = true; sr.interimResults = true; let fin = ""; const base = ta.value ? ta.value.replace(/\s+$/, "") + "\n" : "";
    sr.onresult = ev => { let mid = ""; for (let i = ev.resultIndex; i < ev.results.length; i++) { const r = ev.results[i]; if (r.isFinal) fin += r[0].transcript; else mid += r[0].transcript; } ta.value = base + fin + mid; };
    sr.onend = () => { if (rec && rec.state === "recording") { try { sr.start(); } catch (e) {} } }; try { sr.start(); } catch (e) {}
  }
  btn.onclick = async () => {
    if (rec && rec.state === "recording") { stopAll(); btn.classList.remove("on"); btn.textContent = "再錄一段"; return; }
    if (!navigator.mediaDevices || !window.MediaRecorder) { hint.textContent = "這裡無法使用麥克風，請從主畫面的 WonderMedia 開啟"; return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch (e) { hint.textContent = "沒有麥克風權限：到 iPhone 設定 → Safari → 麥克風 允許"; return; }
    const mime = pickMime(); chunks = []; rec = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
    rec.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = () => { const type = rec.mimeType || mime || "audio/mp4"; onAudio(new Blob(chunks, { type })); };
    rec.start(1000); t0 = Date.now(); timerId = setInterval(() => { const s = Math.floor((Date.now() - t0) / 1000); timer.textContent = pad(Math.floor(s / 60)) + ":" + pad(s % 60); }, 250);
    btn.classList.add("on"); btn.textContent = "停止"; if (PM && !$("#campm", sc).hidden) { PM.reset(); PM.play(); } startSR();
  };
  return { stopAll, recording: () => !!rec && rec.state === "recording" };
}
/* 鏡頭筆記 */
function openShotNote(shotId) {
  const pl = curPlace(), i = pl.shots.findIndex(x => x.id === shotId), s = pl.shots[i];
  const sc = sheet(`<h2>📝 ${pad(i + 1)} ${esc(s.n)}</h2><div class="field"><label for="snt">這個鏡頭的筆記</label><textarea id="snt" placeholder="例如：這段機器人很好笑、這裡要配音說價格、按鍵盤麥克風可以口述">${esc(s.note || "")}</textarea></div><button class="btn primary wide" id="sns">儲存</button>`);
  $("#snt", sc).focus();
  $("#sns", sc).onclick = () => { s.note = $("#snt", sc).value.trim(); touch(view.pid); sc._close(); render(); toast("已儲存"); };
}
/* 預覽已加入的影片／照片／錄音 */
function findClip(key) { for (const pid in DATA.projects) for (const d of DATA.projects[pid].days) for (const pl of d.places) { for (const s of pl.shots) { const c = s.clips.find(x => x.key === key); if (c) return { c, label: s.n }; } for (const n of pl.notes) { const c = (n.media || []).find(x => x.key === key); if (c) return { c, label: "隨手記" }; } } for (const id in DATA.stream) { const c = (DATA.stream[id].media || []).find(x => x.key === key); if (c) return { c, label: "源頭" }; } return null; }
async function viewClip(key) {
  const f = findClip(key); if (!f) return; const c = f.c; let url = null, revoke = false;
  const local = await IDB.get(key);
  if (local && local.blob) { url = URL.createObjectURL(local.blob); revoke = true; }
  else if (c.od) { try { const r = await gfetch("/me/drive/items/" + encodeURIComponent(c.od)); const j = await r.json(); url = j["@microsoft.graph.downloadUrl"]; } catch (e) { return toast(e && e.code === "auth" ? "先到設定登入 OneDrive" : "讀不到檔案，確認網路後再試"); } }
  if (!url) return toast("這個檔案已經不在手機，也還沒上傳");
  const media = c.kind === "photo" ? `<img src="${url}" alt="${esc(c.name)}">` : c.kind === "audio" ? `<audio src="${url}" controls autoplay style="width:100%"></audio>` : `<video src="${url}" controls playsinline autoplay></video>`;
  sheet(`<h2>${esc(f.label)}</h2><div class="lightbox">${media}</div>${c.text ? `<p style="margin:0">🎙️ ${esc(c.text)}</p>` : ""}<p class="hint" style="margin:0;word-break:break-all">${esc(c.name)}・${c.od ? "已上傳 OneDrive" : "還在手機"}</p>`, () => { if (revoke) URL.revokeObjectURL(url); });
}
/* App 內建相機：1080p 錄影（iPhone 用網頁上傳鈕直接拍只有 480p） */
function pickVideoMime() { if (!window.MediaRecorder) return ""; for (const m of ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"]) { try { if (MediaRecorder.isTypeSupported(m)) return m; } catch (e) {} } return ""; }
function openCamera(shotId) {
  const p = curProj(), pl = curPlace(), i = pl.shots.findIndex(x => x.id === shotId), s = pl.shots[i];
  let stream = null, rec = null, chunks = [], facing = "environment", t0 = 0, timer = null; const takes = [];
  const sc = document.createElement("div"); sc.className = "camfull";
  sc.innerHTML = `<video id="cv" playsinline muted autoplay></video>
    <div class="camtop"><button class="camx" id="cclose" aria-label="關閉">✕</button><div class="camname"><b>${pad(i + 1)} ${esc(s.n)}</b>${s.h ? `<small>${esc(s.h)}</small>` : ""}</div><span class="camres" id="cres"></span></div>
    <div class="camtime" id="ct">00:00</div>
    ${(p.script || "").trim() ? `<div class="campm" id="campm" hidden>${prompterHTML(p.script)}</div><button class="camside campmbtn" id="cpm" aria-label="提詞機">📜</button>` : ""}
    <p class="camhint" id="chint">直拍 9:16・可以連拍好幾段，拍好按「儲存」</p>
    <div class="cambar"><button class="camside" id="cflip" aria-label="翻轉鏡頭">🔄</button><button class="recbig" id="crec" aria-label="開始錄影">錄影</button><button class="camside camsave" id="csave">儲存<small id="ctakes">0 段</small></button></div>`;
  document.body.appendChild(sc); document.body.style.overflow = "hidden";
  sc._close = () => { stopAll(); if (PM) PM.stop(); sc.remove(); document.body.style.overflow = ""; };
  sc.querySelector("#cclose").onclick = () => { if (takes.length && !sc.dataset.c) { sc.dataset.c = 1; $("#chint", sc).textContent = "還有 " + takes.length + " 段沒儲存，再按一次 ✕ 放棄"; return; } sc._close(); };
  const btn = $("#crec", sc), hint = $("#chint", sc), vid = $("#cv", sc);
  let PM = null; const pmBtn = $("#cpm", sc);
  if (pmBtn) pmBtn.onclick = () => { const box = $("#campm", sc); box.hidden = !box.hidden; if (!box.hidden && !PM) PM = bindPrompter(box); pmBtn.classList.toggle("on", !box.hidden); };
  function stopStream() { if (stream) stream.getTracks().forEach(x => x.stop()); stream = null; }
  function stopAll() { try { if (rec && rec.state !== "inactive") rec.stop(); } catch (e) {} clearInterval(timer); stopStream(); }
  async function start() {
    stopStream();
    if (!navigator.mediaDevices || !window.MediaRecorder) { hint.textContent = "這裡不能用相機，請從主畫面的 WonderMedia 開啟，或改用「相簿」"; return; }
    try { stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 30 }, resizeMode: 'none' }, audio: true }); }
    catch (e) { hint.textContent = "打不開相機：到 iPhone 設定 → Safari → 相機、麥克風 允許，或改用「相簿」"; return; }
    vid.srcObject = stream; const st = stream.getVideoTracks()[0].getSettings(); $("#cres", sc).textContent = (st.width && st.height) ? Math.min(st.width, st.height) + "p" : ""; vid.onloadedmetadata = () => { if (vid.videoWidth) $("#cres", sc).textContent = Math.min(vid.videoWidth, vid.videoHeight) + "p・" + (vid.videoHeight > vid.videoWidth ? "9:16" : "16:9 橫"); };
  }
  start();
  $("#cflip", sc).onclick = () => { if (rec && rec.state === "recording") return; facing = facing === "environment" ? "user" : "environment"; start(); };
  btn.onclick = () => {
    if (rec && rec.state === "recording") { rec.stop(); clearInterval(timer); btn.classList.remove("on"); btn.textContent = "再拍一段"; if (PM) PM.pause(); return; }
    if (!stream) return start();
    const mime = pickVideoMime(); chunks = [];
    try { rec = new MediaRecorder(stream, { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 8000000 }); } catch (e) { rec = new MediaRecorder(stream); }
    rec.ondataavailable = ev => { if (ev.data && ev.data.size) chunks.push(ev.data); };
    rec.onstop = () => { const type = (rec.mimeType || mime || "video/mp4").split(";")[0]; takes.push(new Blob(chunks, { type })); $("#ctakes", sc).textContent = takes.length + " 段"; };
    rec.start(1000); t0 = Date.now(); timer = setInterval(() => { const x = Math.floor((Date.now() - t0) / 1000); $("#ct", sc).textContent = pad(Math.floor(x / 60)) + ":" + pad(x % 60); }, 250);
    btn.classList.add("on"); btn.textContent = "停止";
  };
  $("#csave", sc).onclick = async () => {
    if (rec && rec.state === "recording") { rec.stop(); clearInterval(timer); await new Promise(r => setTimeout(r, 700)); }
    if (!takes.length) { toast("還沒有拍"); return; }
    let k = 0; for (const b of takes) { k++; const ext = /webm/.test(b.type) ? "webm" : "mp4"; const path = `${safeName(p.title)}/D${view.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_${stamp()}${takes.length > 1 ? "-" + k : ""}.${ext}`; s.clips.push(await addClip(view.pid, b, path, "video")); }
    s.done = true; touch(view.pid); sc._close(); render(); toast(signedIn() ? "已儲存，上傳中" : "已存在手機，登入 OneDrive 後上傳"); uploadPending();
  };
}
function openShotRecorder(shotId) {
  const p = curProj(), pl = curPlace(), i = pl.shots.findIndex(x => x.id === shotId), s = pl.shots[i]; const blobs = [];
  let R = null;
  const sc = sheet(`<h2>🎙️ ${pad(i + 1)} ${esc(s.n)}</h2><p class="hint" style="margin:0">${esc(pl.name)}・錄完會掛在這個鏡頭上</p>${recorderHTML()}<div class="row" id="mlist"></div>
    <div class="field"><label for="stext">轉出來的文字（可以修改）</label><textarea id="stext"></textarea></div><button class="btn primary wide" id="ssave">儲存</button>`, () => R && R.stopAll());
  const ta = $("#stext", sc);
  R = bindRecorder(sc, ta, b => { blobs.push(b); $("#mlist", sc).innerHTML = blobs.map((x, k) => `<span class="chip">🎙️ 錄音 ${k + 1}</span>`).join(""); });
  $("#ssave", sc).onclick = async () => {
    if (R.recording()) { R.stopAll(); await new Promise(r => setTimeout(r, 600)); }
    if (!blobs.length) { toast("還沒有錄音"); return; }
    let k = 0; for (const b of blobs) { k++; const path = `${safeName(p.title)}/D${view.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_錄音_${stamp()}-${k}.${extOf(null, b.type)}`; const c = await addClip(view.pid, b, path, "audio"); if (k === 1) c.text = ta.value.trim(); s.clips.push(c); }
    s.done = true; touch(view.pid); sc._close(); render(); toast("已儲存"); uploadPending();
  };
}
function openNote(quick) {
  let pid = view.pid, di = view.day, plid = view.place;
  if (quick || !pid || !plid) {
    const today = todayISO(); let best = null;
    for (const id in DATA.projects) DATA.projects[id].days.forEach((d, i) => { if (d.date === today && d.places.length) best = { id, i, pl: [...d.places].sort((a, b) => (a.time || "").localeCompare(b.time || "")).filter(x => !x.time || x.time <= nowHM()).pop() || d.places[0] }; });
    if (!best && pid && DATA.projects[pid]) { const d = DATA.projects[pid].days[di]; if (d && d.places[0]) best = { id: pid, i: di, pl: d.places[0] }; }
    if (!best) { const first = Object.keys(DATA.projects)[0]; const d = first && DATA.projects[first].days[0]; if (d && d.places[0]) best = { id: first, i: 0, pl: d.places[0] }; }
    if (!best) { toast("先建一個企劃和地點"); return; }
    pid = best.id; di = best.i; plid = best.pl.id;
  }
  const media = []; let R = null;
  const p = DATA.projects[pid], pl = p.days[di].places.find(x => x.id === plid);
  const list = () => media.map((m, i) => `<span class="chip x">${m.kind === "photo" ? "📷 照片" : m.kind === "video" ? "🎬 影片" : "🎙️ 錄音"}<button data-rm="${i}" aria-label="移除">×</button></span>`).join("");
  const sc = sheet(`<h2>記一則</h2><p class="hint" style="margin:0">${esc(p.title)}・D${di + 1}・${esc(pl.name)}</p>
    <div class="pickers"><label class="pick">📷 照片<input id="nphoto" type="file" accept="image/*" multiple class="vh"></label><label class="pick">🎬 影片<input id="nvideo" type="file" accept="video/*" multiple class="vh"></label><button class="pick" id="ndual" type="button" style="grid-column:1/-1">📸 雙鏡頭（前後同時拍）</button></div>
    <div class="row" id="mlist"></div>
    ${recorderHTML()}
    <div class="field"><label for="ntext">文字</label><textarea id="ntext" placeholder="也可以按鍵盤上的麥克風口述"></textarea></div>
    <button class="btn primary wide" id="nsave">儲存</button>`, () => R && R.stopAll());
  const ta = $("#ntext", sc), refresh = () => { $("#mlist", sc).innerHTML = list(); };
  R = bindRecorder(sc, ta, b => { media.push({ kind: "audio", file: b }); refresh(); });
  $("#ndual", sc).onclick = () => { R && R.stopAll(); sc._close(); startDual({ note: true, pid, day: di, place: plid }); };
  $("#nphoto", sc).onchange = e => { for (const f of e.target.files) media.push({ kind: "photo", file: f }); e.target.value = ""; refresh(); };
  $("#nvideo", sc).onchange = e => { for (const f of e.target.files) media.push({ kind: "video", file: f }); e.target.value = ""; refresh(); };
  $("#mlist", sc).onclick = e => { const b = e.target.closest("[data-rm]"); if (b) { media.splice(+b.dataset.rm, 1); refresh(); } };
  $("#nsave", sc).onclick = async () => {
    if (R.recording()) { R.stopAll(); await new Promise(r => setTimeout(r, 600)); }
    const text = ta.value.trim(); if (!media.length && !text) { toast("先拍照、錄影、錄音或打幾個字"); return; }
    const n = { id: uid("n"), ts: Date.now(), text, media: [] };
    let k = 0; for (const m of media) { k++; const type = m.file.type || ""; const path = `${safeName(p.title)}/D${di + 1}_${safeName(pl.name)}_隨手記_${m.kind === "audio" ? "錄音" : m.kind === "photo" ? "照片" : "影片"}_${stamp()}-${k}.${extOf(m.file, type)}`; n.media.push(await addClip(pid, m.file, path, m.kind)); }
    pl.notes.push(n); touch(pid); sc._close(); go(`p/${pid}/${di}/${plid}`); render(); toast("已儲存"); uploadPending();
  };
}


/* ---------- 記錄之流：源頭・河流・出海口 ---------- */
const COACH = "https://fuwei0618-cmd.github.io/Entry/coach/?return=" + encodeURIComponent("https://fuwei0618-cmd.github.io/WonderMedia/#src");
const PLATFORMS = ["IG", "YouTube", "小紅書", "Threads"];
const dateOf = ts => { const d = new Date(ts); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };
const hmOf = ts => { const d = new Date(ts); return pad(d.getHours()) + ":" + pad(d.getMinutes()); };
const stampOf = ts => { const d = new Date(ts); return pad(d.getMonth() + 1) + pad(d.getDate()) + "-" + pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()); };
const recKind = r => r.kind || ((r.media || [])[0] || {}).kind || "text";
const KIND_LABEL = { text: "文字", audio: "語音", photo: "照片", video: "影片" };

/* 河流：源頭紀錄＋各企劃裡的鏡頭與隨手記，依時間排 */
function riverItems() {
  const out = [];
  for (const id in DATA.stream) { const r = DATA.stream[id]; out.push({ type: "rec", id, ts: r.ts, kind: recKind(r), text: r.text || "", media: r.media || [], o: r, where: r.src === "coach" ? "拍照教練" + (r.scene ? "・" + r.scene : "") : r.dual ? "源頭・雙鏡頭" : "源頭" }); }
  for (const pid in DATA.projects) { const p = DATA.projects[pid];
    p.days.forEach((d, di) => d.places.forEach(pl => {
      pl.shots.forEach(s => s.clips.forEach(c => out.push({ type: "clip", pid, ts: c.at || Date.parse(d.date), kind: c.kind, text: c.text || s.n, media: [c], o: c, where: p.title + "・" + pl.name, go: `p/${pid}/${di}/${pl.id}` })));
      pl.notes.forEach(n => out.push({ type: "note", pid, ts: n.ts, kind: ((n.media || [])[0] || {}).kind || "text", text: n.text || "", media: n.media || [], o: n, where: p.title + "・" + pl.name, go: `p/${pid}/${di}/${pl.id}` }));
    }));
  }
  return out.sort((a, b) => b.ts - a.ts);
}
function saveItem(x) { if (x.type === "rec") touchRec(x.o); else touch(x.pid); }
function findItem(k) { return riverItems().find(x => itemKey(x) === k); }
const itemKey = x => x.type === "rec" ? "r:" + x.id : x.type === "note" ? "n:" + x.o.id : "c:" + x.o.key;
function thumbHTML(x) {
  const m = (x.media || []).find(c => c.kind === "photo" || c.kind === "video");
  if (m) return `<span class="thumb" data-item="${esc(itemKey(x))}"><img alt="" data-thumb="${m.key}">${m.kind === "video" ? "<i>▶</i>" : ""}</span>`;
  return `<span class="thumb txt" data-item="${esc(itemKey(x))}">${x.kind === "audio" ? "🎙️" : "✍️"}</span>`;
}
const THUMB = new Map();
async function fillThumbs() {
  for (const img of document.querySelectorAll("img[data-thumb]")) {
    const k = img.dataset.thumb; if (THUMB.has(k)) { if (THUMB.get(k)) img.src = THUMB.get(k); continue; }
    THUMB.set(k, "");
    (async () => {
      let url = "";
      try { const loc = await IDB.get(k); if (loc && loc.blob) url = URL.createObjectURL(loc.blob);
        else { const f = findClip(k); if (f && f.c.od && signedIn()) { const r = await gfetch("/me/drive/items/" + encodeURIComponent(f.c.od) + "/thumbnails/0/medium/content"); if (r && r.ok) url = URL.createObjectURL(await r.blob()); } } } catch (e) {}
      THUMB.set(k, url); if (url) document.querySelectorAll(`img[data-thumb="${k}"]`).forEach(i => i.src = url);
    })();
  }
}
function allTags() { const t = new Set(); riverItems().forEach(x => (x.o.tags || []).forEach(g => t.add(g))); return [...t]; }

function srcHTML() {
  const recs = Object.entries(DATA.stream).map(([id, r]) => ({ id, ...r })).sort((a, b) => b.ts - a.ts);
  const today = todayISO(), todays = recs.filter(r => dateOf(r.ts) === today);
  const items = riverItems().filter(x => x.type === "rec").slice(0, 20);
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">源頭</h1><button class="icon-btn" data-go="set" aria-label="設定">⚙︎</button></div>
  <p class="hint">想到什麼先丟進來，之後在河流裡整理、挑選。</p>
  ${syncBanner()}
  <section class="section"><div class="capgrid">
    <button class="cap" data-act="cap-text"><b>✍️</b>文字</button>
    <button class="cap" data-act="cap-voice"><b>🎙️</b>語音</button>
    <label class="cap"><b>📷</b>照片<input type="file" accept="image/*,video/*" multiple class="vh" id="capphoto"></label>
    <button class="cap" data-dual="src"><b>📸</b>雙鏡頭</button>
    <a class="cap coach" href="${COACH}"><b>🧑‍🎨</b>拍照教練</a>
  </div></section>
  <section class="section"><header><h2>剛流進來的</h2><span class="muted mono" style="font-size:13px">今天 ${todays.length} 則</span></header>
    ${items.length ? `<div class="stack">${items.map(itemHTML).join("")}</div><button class="btn ghost wide" data-go="river">看整條河流 ›</button>` : `<div class="card empty"><b>源頭還是空的</b>按上面的按鈕，或下面中間的 ＋ 記第一則</div>`}</section>`;
}
function itemHTML(x) {
  const tags = (x.o.tags || []).map(g => `<span class="chip">#${esc(g)}</span>`).join("");
  const scene = x.o.pose ? `<span class="chip">${esc(x.o.pose)}</span>` : "";
  return `<div class="ritem card">${thumbHTML(x)}<div class="rbody" data-item="${esc(itemKey(x))}"><div class="rmeta"><span class="mono">${hmOf(x.ts)}</span><span>${KIND_LABEL[x.kind] || ""}</span><span class="muted">${esc(x.where)}</span></div>
    ${x.text ? `<p class="rtext">${esc(x.text)}</p>` : ""}<div class="row" style="gap:4px">${scene}${tags}</div></div>
    <button class="pickstar ${x.o.pick ? "on" : ""}" data-pick="${esc(itemKey(x))}" aria-label="${x.o.pick ? "取消挑選" : "挑選"}">${x.o.pick ? "★" : "☆"}</button></div>`;
}
const RF = { tag: "", pick: false };
function riverHTML() {
  let xs = riverItems(); const tags = allTags();
  if (RF.pick) xs = xs.filter(x => x.o.pick); if (RF.tag) xs = xs.filter(x => (x.o.tags || []).includes(RF.tag));
  const days = []; xs.forEach(x => { const d = dateOf(x.ts); if (!days.length || days[days.length - 1].d !== d) days.push({ d, xs: [] }); days[days.length - 1].xs.push(x); });
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">河流</h1><span class="muted mono" style="font-size:13px">${xs.length} 則</span></div>
  <p class="hint">所有紀錄依時間流下來。按 ☆ 挑選，點一則可以加標籤；挑好的會在工作台等著剪。</p>
  <div class="rfilters"><button data-rf="" aria-pressed="${!RF.tag && !RF.pick}">全部</button><button data-rf="★" aria-pressed="${RF.pick}">★ 已挑</button>${tags.map(g => `<button data-rf="#${esc(g)}" aria-pressed="${RF.tag === g}">#${esc(g)}</button>`).join("")}</div>
  ${days.length ? days.map(g => `<section class="section rday"><h2><span class="mono">${esc(md(g.d))}</span></h2><div class="stack">${g.xs.map(itemHTML).join("")}</div></section>`).join("") : `<div class="card empty" style="margin-top:16px"><b>${RF.tag || RF.pick ? "沒有符合的紀錄" : "河流還是空的"}</b>${RF.tag || RF.pick ? "換一個篩選看看" : "從源頭記第一則"}</div>`}`;
}
function openItem(k) {
  const x = findItem(k); if (!x) return;
  const media = (x.media || []).map(c => `<button class="addclip" data-view="${c.key}">${KIND_ICON[c.kind] || "🎬"} 看${KIND_LABEL[c.kind] || ""}</button>`).join("");
  let tags = [...(x.o.tags || [])];
  const tagRow = () => [...new Set([...allTags(), ...tags])].map(g => `<button class="tg ${tags.includes(g) ? "on" : ""}" data-tg="${esc(g)}">#${esc(g)}</button>`).join("");
  const sc = sheet(`<h2>${esc(md(dateOf(x.ts)))} ${hmOf(x.ts)}</h2><p class="hint" style="margin:0">${esc(x.where)}${x.o.pose ? "・" + esc(x.o.pose) : ""}</p>
    ${media ? `<div class="clips">${media}</div>` : ""}
    ${x.type === "clip" ? `<p style="margin:0">${esc(x.text)}</p>` : `<div class="field"><label for="itext">文字</label><textarea id="itext">${esc(x.o.text || "")}</textarea></div>`}
    <div class="field"><label>標籤</label><div class="row" id="tgs">${tagRow()}</div><div class="row"><input id="newtag" placeholder="新標籤，例如：好笑、開場、Lucky" style="flex:1"><button class="btn sm" id="addtag">加</button></div></div>
    <label class="row" style="font-size:14px"><input type="checkbox" id="ipick" ${x.o.pick ? "checked" : ""}> ⭐ 挑選，放進工作台</label>
    <button class="btn primary wide" id="isave">儲存</button>
    ${x.go ? `<button class="btn ghost wide" id="igo">到工作台的這個地點 ›</button>` : ""}
    ${x.type === "rec" ? `<button class="btn danger wide" id="idel">刪除這則</button>` : ""}`);
  $("#tgs", sc).onclick = e => { const b = e.target.closest("[data-tg]"); if (!b) return; const g = b.dataset.tg; tags = tags.includes(g) ? tags.filter(t => t !== g) : [...tags, g]; $("#tgs", sc).innerHTML = tagRow(); };
  const addTag = () => { const v = $("#newtag", sc).value.trim().replace(/^#/, ""); if (v && !tags.includes(v)) tags.push(v); $("#newtag", sc).value = ""; $("#tgs", sc).innerHTML = tagRow(); };
  $("#addtag", sc).onclick = addTag; $("#newtag", sc).onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); addTag(); } };
  $("#isave", sc).onclick = () => { if ($("#newtag", sc).value.trim()) addTag(); x.o.tags = tags; x.o.pick = $("#ipick", sc).checked; const ta = $("#itext", sc); if (ta) x.o.text = ta.value.trim(); saveItem(x); sc._close(); render(); toast("已儲存"); };
  if (x.go) $("#igo", sc).onclick = () => { sc._close(); go(x.go); };
  if (x.type === "rec") $("#idel", sc).onclick = async e => { const b = e.currentTarget; if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "再按一次確定刪除（OneDrive 的檔案會保留）"; return; } for (const c of x.o.media || []) await IDB.del(c.key); delete DATA.stream[x.id]; DATA.deleted["s/" + x.id] = Date.now(); DIRTY = true; writeCache(); scheduleSync(); sc._close(); render(); };
}
/* 源頭：記一則（文字／語音／照片），存成 DATA.stream 的一筆 */
async function addRecord(kind, text, files, extra) {
  const ts = (extra && extra.ts) || Date.now(), r = { ts, kind, text: text || "", media: [], tags: [], pick: false, ...(extra || {}) };
  let k = 0; for (const f of files || []) { k++; const fk = f.kind || (/image/.test(f.file.type) ? "photo" : /video/.test(f.file.type) ? "video" : "audio");
    const path = `源頭/${dateOf(ts)}/${r.src === "coach" ? "拍照教練" + (r.scene ? "_" + safeName(r.scene) : "") : r.dual ? "雙鏡頭" : "隨手記_" + (KIND_LABEL[fk] || "檔案")}_${stampOf(ts)}${files.length > 1 ? "-" + k : ""}.${extOf(f.file, f.file.type || "")}`;
    r.media.push(await addClip(null, f.file, path, fk)); }
  const id = uid("r"); DATA.stream[id] = r; touchRec(r); return id;
}
function openCapture(mode) {
  const media = []; let R = null;
  const list = () => media.map((m, i) => `<span class="chip x">${m.kind === "photo" ? "📷 照片" : m.kind === "video" ? "🎬 影片" : "🎙️ 語音"}<button data-rm="${i}" aria-label="移除">×</button></span>`).join("");
  const sc = sheet(`<h2>${mode === "voice" ? "🎙️ 說一段" : mode === "text" ? "✍️ 寫一段" : "記一則"}</h2><p class="hint" style="margin:0">存進源頭・${hmOf(Date.now())}</p>
    ${mode === "text" ? "" : recorderHTML()}
    <div class="row" id="mlist"></div>
    <div class="field"><label for="ctext">${mode === "voice" ? "轉出來的文字（可以修改）" : "文字"}</label><textarea id="ctext" placeholder="想到什麼就寫，也可以按鍵盤上的麥克風口述"></textarea></div>
    ${mode ? "" : `<div class="pickers"><label class="pick">📷 照片／影片<input id="cphoto" type="file" accept="image/*,video/*" multiple class="vh"></label><button class="pick" id="cdual" type="button">📸 雙鏡頭</button></div>`}
    <button class="btn primary wide" id="csave">存進源頭</button>`, () => R && R.stopAll());
  const ta = $("#ctext", sc), refresh = () => { $("#mlist", sc).innerHTML = list(); };
  if (mode !== "text") R = bindRecorder(sc, ta, b => { media.push({ kind: "audio", file: b }); refresh(); });
  if (!mode) $("#cdual", sc).onclick = () => { R && R.stopAll(); sc._close(); startDual(); };
  if (!mode) $("#cphoto", sc).onchange = e => { for (const f of e.target.files) media.push({ kind: /video/.test(f.type) ? "video" : "photo", file: f }); e.target.value = ""; refresh(); };
  $("#mlist", sc).onclick = e => { const b = e.target.closest("[data-rm]"); if (b) { media.splice(+b.dataset.rm, 1); refresh(); } };
  if (mode === "text") setTimeout(() => ta.focus(), 50);
  $("#csave", sc).onclick = async () => {
    if (R && R.recording()) { R.stopAll(); await new Promise(r => setTimeout(r, 600)); }
    const text = ta.value.trim(); if (!media.length && !text) { toast(mode === "voice" ? "還沒有錄音" : "先寫幾個字"); return; }
    const kind = media.length ? media[0].kind : "text";
    try { await addRecord(kind, text, media); } catch (er) { toast("存不進去：" + (er && er.message || "請從主畫面的 WonderMedia 開啟")); return; }
    sc._close(); if (view.tab !== "src" && view.tab !== "river") go("src"); render(); toast("已存進源頭"); uploadPending();
  };
}
/* 拍照教練存的照片：同網站 IndexedDB「origina-inbox」→ 變成源頭的照片紀錄，收完就刪 */
let importing = false;
async function importInbox() {
  if (importing || !window.indexedDB) return; importing = true; let n = 0;
  try {
    const db = await new Promise((ok, no) => { const r = indexedDB.open("origina-inbox", 1); r.onupgradeneeded = () => { const d = r.result; if (!d.objectStoreNames.contains("photos")) d.createObjectStore("photos", { keyPath: "id" }); }; r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); setTimeout(() => no(new Error("timeout")), 3000); });
    const all = await new Promise((ok, no) => { const q = db.transaction("photos").objectStore("photos").getAll(); q.onsuccess = () => ok(q.result || []); q.onerror = () => no(q.error); });
    for (const p of all.sort((a, b) => String(a.takenAt).localeCompare(String(b.takenAt)))) {
      if (!p || !p.blob) continue;
      const ts = Date.parse(p.takenAt) || Date.now(), file = p.blob instanceof File ? p.blob : new File([p.blob], "coach.jpg", { type: p.blob.type || "image/jpeg" });
      await addRecord("photo", "", [{ kind: "photo", file }], { ts, src: "coach", scene: p.scene || "", pose: p.pose || "", inboxId: p.id });
      await new Promise(ok => { const t = db.transaction("photos", "readwrite"); t.objectStore("photos").delete(p.id); t.oncomplete = ok; t.onerror = ok; });
      n++;
    }
    db.close();
  } catch (e) {}
  importing = false;
  if (n) { render(); toast(`拍照教練的 ${n} 張照片已流進源頭`); uploadPending(); }
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && DATA) importInbox(); });

/* 出海口：發布紀錄與成效 */
function seaHTML() {
  const ps = Object.entries(DATA.posts).map(([id, p]) => ({ id, ...p })).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const sum = PLATFORMS.concat("其他").map(pf => { const xs = ps.filter(p => (PLATFORMS.includes(p.platform) ? p.platform : "其他") === pf); return { pf, n: xs.length, v: xs.reduce((a, p) => a + (Number(p.views) || 0), 0), l: xs.reduce((a, p) => a + (Number(p.likes) || 0), 0) }; }).filter(x => x.n || PLATFORMS.includes(x.pf));
  const num = v => v >= 10000 ? (v / 10000).toFixed(v >= 100000 ? 0 : 1) + " 萬" : String(v);
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">出海口</h1><button class="btn sm primary" data-act="newpost">＋ 記一次發布</button></div>
  <p class="hint">剪好的片從這裡出海。記下發在哪、連結和成效，之後回頭看哪種內容最有反應。</p>
  <section class="section"><div class="seagrid">${sum.map(x => `<div class="card seac"><div class="pf">${esc(x.pf)}</div><div class="mono big">${x.n}</div><div class="muted" style="font-size:12px">支・觀看 ${num(x.v)}・讚 ${num(x.l)}</div></div>`).join("")}</div></section>
  ${styleStats(ps, num)}
  <section class="section"><header><h2>發布紀錄</h2></header>
  ${ps.length ? `<div class="stack">${ps.map(p => `<button class="card post" data-post="${p.id}"><div class="row" style="justify-content:space-between"><span class="chip">${esc(p.platform)}</span><span class="mono muted" style="font-size:12px">${esc(md(p.date))}</span></div>
    <div class="t" style="margin-top:6px">${esc(p.title)}</div><div class="row muted mono" style="font-size:12px;margin-top:4px"><span>👀 ${num(Number(p.views) || 0)}</span><span>♥ ${num(Number(p.likes) || 0)}</span><span>💬 ${num(Number(p.comments) || 0)}</span>${p.saves ? `<span>🔖 ${num(Number(p.saves))}</span>` : ""}</div>${p.note ? `<p class="hint" style="margin-top:6px">${esc(p.note)}</p>` : ""}</button>`).join("")}</div>`
    : `<div class="card empty"><b>還沒有出海的片</b>發布之後按「＋ 記一次發布」</div>`}</section>`;
}
function editPost(id) {
  const p = id ? DATA.posts[id] : { platform: "IG", date: todayISO() };
  const projOpts = [["", "（不連結）"]].concat(Object.entries(DATA.projects).map(([k, x]) => [k, x.title]));
  const sc = form(id ? "編輯發布" : "記一次發布", [
    { k: "title", l: "標題", v: p.title, ph: "例如：麥味登 哥哥們已讀不回" }, { k: "platform", l: "平台", opts: PLATFORMS.concat("TikTok", "Facebook", "其他").map(x => [x, x]), v: p.platform },
    { k: "date", l: "發布日期", type: "date", v: p.date }, { k: "url", l: "連結", v: p.url, ph: "https://" },
    { k: "views", l: "觀看", type: "number", v: p.views }, { k: "likes", l: "讚", type: "number", v: p.likes }, { k: "comments", l: "留言", type: "number", v: p.comments }, { k: "saves", l: "收藏", type: "number", v: p.saves },
    { k: "pid", l: "來自哪個企劃", opts: projOpts, v: p.pid || "" }, { k: "note", l: "心得", v: p.note, ph: "哪裡反應好、下次怎麼改" }],
    v => { if (!v.title) { toast("取個標題"); return false; } const nid = id || uid("o"); const r = DATA.posts[nid] || {}; Object.assign(r, v); DATA.posts[nid] = r; touchRec(r); render(); toast("已儲存"); },
    id ? `${p.url ? `<a class="btn ghost wide" href="${esc(p.url)}" target="_blank" rel="noopener">打開貼文 ↗</a>` : ""}<button class="btn danger wide" id="pdel">刪除這筆</button>` : "");
  if (id) $("#pdel", sc).onclick = e => { const b = e.currentTarget; if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "再按一次確定刪除"; return; } delete DATA.posts[id]; DATA.deleted["o/" + id] = Date.now(); DIRTY = true; writeCache(); scheduleSync(); sc._close(); render(); };
}


/* ---------- 工作台五層：風格・劇本・分鏡・道具・剪法（可改，存在 DATA.docs.wb 同步 OneDrive） ---------- */
const WB_DEFAULT = {"styles": [{"n": "實用攻略型", "core": "景點懶人包、路線地圖、避坑與花費分析", "hw": "遊覽攻略、拍照機位", "m": "Vlog 自動編排＋資訊字卡"}, {"n": "氛圍感美學／微電影", "core": "高質感畫面、微電影鏡頭感，搭配口播或旁白與音樂", "hw": "微電影氛圍", "m": "音樂卡點＋調色（你主導）"}, {"n": "第一人稱沉浸（POV）", "core": "Ray-Ban 視角、第一人稱鏡頭、原聲與步伐節奏", "hw": "", "m": "Vlog 自動編排，原聲為主、少字"}, {"n": "主觀評測／說書", "core": "面對鏡頭聊天、講旅行荒謬故事與主觀評分", "hw": "心得感想", "m": "口播剪輯（去氣口、停頓）"}, {"n": "預算／CP 值極致", "core": "平價替代景點、CP 值實測", "hw": "遊覽攻略", "m": "口播剪輯＋價格字卡"}, {"n": "靈性／療癒哲理", "core": "慢節奏、與內心對話的哲理金句與冥想感", "hw": "", "m": "慢節奏旁白＋氛圍配樂"}, {"n": "特殊主題／文化挖掘", "core": "專攻古建築、藝術展覽等深層文化", "hw": "歷史人文", "m": "知識講解（動態字幕、圖解）"}, {"n": "頂級開箱／飯店設備控", "core": "奢華飯店開箱、開箱高級設備", "hw": "", "m": "開箱結構＋口播"}, {"n": "互動問答／隨機冒險", "core": "讓粉絲投票決定行程、隨機抽籤冒險", "hw": "", "m": "口播剪輯＋投票字卡"}], "templates": [{"n": "口播／觀點", "flow": ["一句話開場 Hook", "為什麼想講", "三個重點", "收尾＋邀請留言"], "sty": "評測、療癒", "blk": ["free"]}, {"n": "旅行 Vlog", "flow": ["開場 Hook", "每天", "每個地點", "結尾心得"], "sty": "攻略、氛圍、POV", "blk": ["move", "play", "food", "stay"]}, {"n": "生活 Vlog", "flow": ["開場", "今天的幾件事", "碎碎念收尾"], "sty": "POV、療癒", "blk": ["free", "cook", "food"]}, {"n": "探店／美食", "flow": ["一句話評價先講", "店家", "餐點", "總評"], "sty": "評測、CP 值", "blk": ["food", "night"]}, {"n": "開箱／好物", "flow": ["為什麼買", "外觀", "實測", "優缺點"], "sty": "開箱、評測", "blk": ["free"]}, {"n": "穿搭", "flow": ["整體", "單品細節", "場合搭配"], "sty": "氛圍", "blk": ["wear"]}, {"n": "街頭表演", "flow": ["現場氛圍", "表演片段", "觀眾反應", "幕後"], "sty": "氛圍、POV", "blk": ["music"]}, {"n": "合唱團", "flow": ["練習花絮", "演出", "團員訪談"], "sty": "氛圍", "blk": ["music"]}, {"n": "Podcast", "flow": ["本集主題", "錄音", "精華切片 3 到 5 段"], "sty": "評測、療癒", "blk": ["free"]}], "steps": [{"n": "素材整理", "who": "Claude", "d": "依拍攝清單分類、挑出能用的片段"}, {"n": "腳本與標題", "who": "Claude 草擬，你定稿", "d": "Google Map 地點、吸睛標題"}, {"n": "粗剪＋地標字卡", "who": "Claude", "d": "排時間線、切掉空白和重複"}, {"n": "片頭片尾", "who": "Claude", "d": "套你的固定模板"}, {"n": "音樂＋卡點", "who": "Claude", "d": "從道具櫃挑配樂，剪接點對拍子"}, {"n": "調色", "who": "你", "d": "亮度、對比、濾鏡，套用到全部"}, {"n": "特效、貼圖、音效", "who": "Claude 先放，你微調", "d": "從道具櫃拿"}, {"n": "封面", "who": "你", "d": "Canva，一個內建兩張"}, {"n": "文字字幕", "who": "Claude 初稿，你修", "d": "文字框、字幕字體照道具櫃"}, {"n": "音樂淡出、透明度", "who": "Claude", "d": "收尾漸弱"}, {"n": "Shorts 切片", "who": "Claude", "d": "從長片切出直式短版，套上新模板"}], "methods": [{"n": "素材 → 剪映草稿", "d": "照劇本排好、放好字幕貼圖配樂，存成剪映草稿，你最後修", "fit": "全部賽道", "st": "在用"}, {"n": "口播剪輯", "d": "去氣口、停頓、重複句，自動上字幕", "fit": "評測、CP 值、問答", "st": "做得到"}, {"n": "Vlog 自動編排", "d": "隨手拍丟進來，看畫面和聲音排成故事、配音樂", "fit": "攻略、POV、生活", "st": "做得到"}, {"n": "爆款複刻／一鍵套範本", "d": "拆解一支爆款的鏡頭節奏，用你的素材照著排", "fit": "懶人套範本", "st": "要一支參考片"}, {"n": "知識動畫", "d": "動態字幕、圖解、地圖動畫", "fit": "文化挖掘、攻略", "st": "還沒試過"}]};
function wb() { const c = DATA.docs.wb || {}; const out = {}; for (const k in WB_DEFAULT) out[k] = c[k] || WB_DEFAULT[k]; return out; }
function saveWB(k, list) { DATA.docs.wb = { ...(DATA.docs.wb || {}), [k]: list, _u: Date.now() }; DIRTY = true; writeCache(); scheduleSync(); }
const WBTABS = [["plan", "企劃", "home"], ["sty", "風格", "wb/sty"], ["tpl", "劇本", "wb/tpl"], ["scn", "分鏡", "blocks"], ["kit", "道具", "wb/kit"], ["cut", "剪法", "wb/cut"]];
function wbNav(cur) { return `<nav class="wbnav">${WBTABS.map(([k, l, h]) => `<button data-go="${h}" aria-current="${k === cur}">${l}</button>`).join("")}</nav>`; }
const tplOf = p => p && p.tpl ? wb().templates.find(x => x.n === p.tpl) : null;
const styleOf = p => p && p.style ? wb().styles.find(x => x.n === p.style) : null;
const styleMethod = p => { const s = styleOf(p); return s ? s.m : ""; };
function tplBlocks(p) { const t = tplOf(p); return t ? (t.blk || []).filter(k => blocks()[k]) : []; }
function projFormula(p) {
  if (!p.style && !p.tpl) return `<p class="hint" style="margin-top:8px">這個企劃還沒選賽道和劇本，右上角 ⋯ 可以補上。</p>`;
  const t = tplOf(p), s = styleOf(p);
  return `<div class="formula card">${s ? `<div><span class="fl">風格</span><b>${esc(s.n)}</b><span class="muted">・剪法 ${esc(s.m)}</span></div>` : ""}${t ? `<div><span class="fl">劇本</span><b>${esc(t.n)}</b></div><div class="flow">${t.flow.map(x => `<span>${esc(x)}</span>`).join("<i>→</i>")}</div>` : ""}${s && s.hw ? `<div class="muted" style="font-size:12px">功課：${esc(s.hw)}</div>` : ""}</div>`;
}
function styleStats(ps, num) {
  const by = {}; ps.forEach(x => { const p = DATA.projects[x.pid]; const k = (p && p.style) || "（沒選賽道）"; by[k] = by[k] || { n: 0, v: 0, l: 0 }; by[k].n++; by[k].v += Number(x.views) || 0; by[k].l += Number(x.likes) || 0; });
  const rows = Object.entries(by).sort((a, b) => b[1].v / b[1].n - a[1].v / a[1].n);
  if (!rows.length) return "";
  return `<section class="section"><header><h2>哪個賽道最有反應</h2></header><div class="card">${rows.map(([k, x]) => `<div class="srow"><b>${esc(k)}</b><span class="mono muted">${x.n} 支・平均觀看 ${num(Math.round(x.v / x.n))}・平均讚 ${num(Math.round(x.l / x.n))}</span></div>`).join("")}<p class="hint" style="margin-top:8px">發布時選「來自哪個企劃」，就會算進那個企劃的賽道。</p></div></section>`;
}
const WBDEF = {
  sty: { key: "styles", q: "風格｜這支片是什麼味道？", hint: "先選賽道，就決定了要做什麼功課、用哪種剪法。", fields: [["n", "賽道"], ["core", "核心風格"], ["hw", "功課"], ["m", "預設剪法"]] },
  tpl: { key: "templates", q: "劇本｜整支怎麼排？", hint: "影片模板決定段落順序。推薦積木會在插入地點時排在最前面。", fields: [["n", "模板"], ["flow", "結構（用 → 分開）"], ["sty", "常用賽道"], ["blk", "推薦積木"]] },
  cut: { key: "steps", q: "剪法｜怎麼剪、誰來剪？", hint: "你的剪輯工序，每一步標好誰負責。", fields: [["n", "步驟"], ["who", "誰做"], ["d", "內容"]] },
  meth: { key: "methods", q: "", hint: "", fields: [["n", "AI 剪法"], ["d", "做什麼"], ["fit", "適合賽道"], ["st", "現在"]] }
};
let KIT = null;
async function loadKit() { if (KIT) return KIT; try { KIT = await (await fetch("kit/kit.json")).json(); } catch (e) { KIT = { stickers: [], frames: [], sfx: [], music: [] }; } return KIT; }
const KF = { tab: "stickers", cat: "全部" };
function wbHTML(sub) {
  const W = wb(), head = `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">工作台</h1></div>${wbNav(sub)}`;
  if (sub === "kit") {
    if (!KIT) { loadKit().then(() => render()); return head + `<p class="hint" style="margin-top:12px">道具櫃載入中…</p>`; }
    const cats = ["全部", ...new Set(KIT.stickers.map(x => x.cat))];
    const tabs = [["stickers", "貼圖"], ["frames", "文字框"], ["sfx", "音效"], ["music", "配樂"]];
    let body = "";
    if (KF.tab === "stickers" || KF.tab === "frames") {
      const xs = KIT[KF.tab].filter(x => KF.tab === "frames" || KF.cat === "全部" || x.cat === KF.cat);
      body = (KF.tab === "stickers" ? `<div class="rfilters">${cats.map(c => `<button data-kcat="${esc(c)}" aria-pressed="${KF.cat === c}">${esc(c)}</button>`).join("")}</div>` : "") +
        `<div class="kitgrid ${KF.tab}">${xs.map(x => `<div class="kit"><div class="kpic"><img src="${x.img}" alt="${esc(x.n)}" loading="lazy"></div><b>${esc(x.n)}</b>${x.use ? `<span class="muted">${esc(x.use)}</span>` : ""}${x.font ? `<span class="chip">${esc(x.font)}</span>` : ""}</div>`).join("")}</div>`;
    } else body = `<div class="sndgrid">${KIT[KF.tab].map(x => `<button class="snd" data-snd="${x.src}"><span class="dot">▶</span>${esc(x.n)}</button>`).join("")}</div>`;
    return head + `<p class="wbq">道具｜長什麼樣子？</p><p class="hint">Claude 剪片時先從這裡拿。要增減素材，直接在 WonderMedia 對話裡跟 Claude 說，例如「素材庫加：哭哭的貼圖」。</p>
      <div class="segs">${tabs.map(([k, l]) => `<button data-ktab="${k}" aria-pressed="${KF.tab === k}">${l} ${KIT[k].length}</button>`).join("")}</div>${body}
      <p class="hint" style="margin-top:12px">字體分工：字幕 辰宇落雁體｜標題 源樣明體｜說話 粉圓｜心裡話 清松手寫｜大聲 漫黑</p>`;
  }
  const d = WBDEF[sub] || WBDEF.sty, list = W[d.key];
  const cell = (it, k) => Array.isArray(it[k]) ? (k === "blk" ? it[k].map(b => (blocks()[b] || {}).name || b).join("、") : it[k].join(" → ")) : (it[k] || "—");
  const cards = (def, lst, kind) => `<div class="stack">${lst.map((it, i) => `<button class="card wbcard" data-wbedit="${kind}:${i}"><div class="wbt"><span class="mono muted">${kind === "steps" ? i : i + 1}.</span> ${esc(it.n)}${kind === "steps" ? `<span class="chip ${/^你/.test(it.who) ? "you" : "cl"}">${esc(it.who)}</span>` : ""}${kind === "methods" ? `<span class="chip ${/在用|做得到/.test(it.st) ? "ok" : ""}">${esc(it.st)}</span>` : ""}</div>
    ${def.fields.slice(1).filter(([k]) => !(kind === "steps" && k === "who") && !(kind === "methods" && k === "st")).map(([k, l]) => k === "flow" ? `<div class="flow">${(it.flow || []).map(x => `<span>${esc(x)}</span>`).join("<i>→</i>")}</div>` : `<div class="wbf"><span>${esc(l)}</span>${esc(cell(it, k))}</div>`).join("")}</button>`).join("")}
    <button class="btn ghost wide" data-wbadd="${kind}">＋ 新增一筆</button></div>`;
  let html = head + `<p class="wbq">${esc(d.q)}</p><p class="hint">${esc(d.hint)}點一筆就能改。</p>` + cards(d, list, d.key);
  if (sub === "cut") html += `<section class="section"><h2>AI 剪法</h2><p class="hint">選了賽道，就等於選好了預設剪法。</p>${cards(WBDEF.meth, W.methods, "methods")}</section>`;
  if (sub === "sty") html += `<p class="hint" style="margin-top:10px">「懶人一鍵套範本」是一種剪法，不是風格，放在剪法頁。</p>`;
  return html;
}
function editWB(kind, i) {
  const def = Object.values(WBDEF).find(x => x.key === kind), W = wb(), list = W[kind].map(x => ({ ...x })), it = i == null ? {} : list[i];
  const B = blocks();
  const fields = def.fields.map(([k, l]) => {
    if (k === "blk") return null;
    if (k === "m") return { k, l, opts: W.methods.map(x => [x.n, x.n]).concat(it.m && !W.methods.some(x => x.n === it.m) ? [[it.m, it.m]] : []), v: it.m || (W.methods[0] || {}).n };
    if (k === "who") return { k, l, opts: [["Claude", "Claude"], ["你", "你"], ["Claude 先做，你修", "Claude 先做，你修"]].concat(it.who && !["Claude", "你", "Claude 先做，你修"].includes(it.who) ? [[it.who, it.who]] : []), v: it.who || "Claude" };
    return { k, l, v: Array.isArray(it[k]) ? it[k].join(" → ") : it[k] || "" };
  }).filter(Boolean);
  const blkPick = kind === "templates" ? `<div class="field"><label>推薦積木（插入地點時排在最前面）</label><div class="row" id="blks">${Object.entries(B).map(([k, b]) => `<button class="tg ${(it.blk || []).includes(k) ? "on" : ""}" data-b="${k}">${esc(b.name)}</button>`).join("")}</div></div>` : "";
  let sel = [...(it.blk || [])];
  const sc = form(i == null ? "新增" : "編輯", fields, v => {
    if (!v.n) { toast("名稱不能空白"); return false; }
    const o = { ...it, ...v }; if (kind === "templates") { o.flow = v.flow.split(/\s*(?:→|->|>|、|，|,)\s*/).filter(Boolean); o.blk = sel; }
    if (i == null) list.push(o); else list[i] = o; saveWB(kind, list); render(); toast("已儲存");
  }, blkPick + (i == null ? "" : `<div class="row"><button class="btn sm ghost" id="wbup">↑ 往上移</button><button class="btn sm danger" id="wbdel">刪除</button></div>`));
  if (kind === "templates") $("#blks", sc).onclick = e => { const b = e.target.closest("[data-b]"); if (!b) return; const k = b.dataset.b; sel = sel.includes(k) ? sel.filter(x => x !== k) : [...sel, k]; b.classList.toggle("on"); };
  if (i != null) {
    $("#wbup", sc).onclick = () => { if (i > 0) { [list[i - 1], list[i]] = [list[i], list[i - 1]]; saveWB(kind, list); sc._close(); render(); } };
    $("#wbdel", sc).onclick = e => { const b = e.currentTarget; if (!b.dataset.c) { b.dataset.c = 1; b.textContent = "再按一次確定"; return; } list.splice(i, 1); saveWB(kind, list); sc._close(); render(); };
  }
}
let SND = null;


/* 雙鏡頭：用 iPhone 捷徑「雙鏡頭」打開 2Camera（前後同時拍），存到相簿後回來一鍵收進源頭 */
const DUAL_SHORTCUT = "雙鏡頭";
function startDual(target) {
  const goNow = () => { ls.set("dual-pending", { ...(target || { src: true }), at: Date.now() }); location.href = "shortcuts://run-shortcut?name=" + encodeURIComponent(DUAL_SHORTCUT); };
  if (ls.get("dual-ok3", false)) return goNow();
  const sc = sheet(`<h2>📸 雙鏡頭（第一次設定）</h2>
    <p style="margin:0">前後同時拍用 <b>2Camera</b>（iPhone 11 以後都能用）。網頁不能直接打開別的 App，所以借 iPhone 的「捷徑」當橋樑，只要設定一次：</p>
    <ol class="steps"><li>App Store 搜尋 <b>2Camera</b> 安裝，打開後選好版型：畫中畫或上下分割</li>
    <li>打開「捷徑」App → 右上 ＋ → 加入動作 → 搜尋「打開 App」→ 選 <b>2Camera</b></li>
    <li>把捷徑命名為 <b>${DUAL_SHORTCUT}</b> → 完成</li></ol>
    <p class="hint" style="margin:0">之後按「📸 雙鏡頭」會直接打開 2Camera。拍完存到相簿，回到 WonderMedia 會跳出「收進剛拍的雙鏡頭」，點一下選那支影片就好。</p>
    <button class="btn primary wide" id="dgo">設定好了，打開 2Camera</button>`);
  $("#dgo", sc).onclick = () => { ls.set("dual-ok3", true); sc._close(); goNow(); };
}
function checkDual() {
  const pd = ls.get("dual-pending", null); if (!pd) return;
  if (Date.now() - pd.at > 60 * 60 * 1000) { ls.set("dual-pending", null); return; }
  if (pd.src) {
    if (document.querySelector(".scrim")) return;
    const sc = sheet(`<h2>📸 收進剛拍的雙鏡頭</h2><p class="hint" style="margin:0">存進源頭・${hmOf(Date.now())}</p>
      <label class="btn primary wide">從相簿選剛拍的影片<input type="file" accept="video/*" multiple class="vh" id="dfile"></label>
      <button class="btn ghost wide" id="dlater">先不要</button>`, () => {});
    $("#dlater", sc).onclick = () => { ls.set("dual-pending", null); sc._close(); };
    $("#dfile", sc).onchange = async e => { const files = [...e.target.files]; if (!files.length) return;
      try { for (const f of files) { const id = await addRecord("video", "", [{ kind: "video", file: f }], { dual: true, tags: ["雙鏡頭"] }); (DATA.stream[id].media[0] || {}).dual = true; } } catch (er) { toast("存不進去：" + (er && er.message || "")); return; }
      ls.set("dual-pending", null); sc._close(); go("src"); render(); toast("雙鏡頭影片已流進源頭"); uploadPending(); };
    return;
  }
  if (pd.note) {
    const p = DATA.projects[pd.pid], d = p && p.days[pd.day], pl = d && d.places.find(x => x.id === pd.place);
    if (!pl || document.querySelector(".scrim")) { if (!pl) ls.set("dual-pending", null); return; }
    const sc = sheet(`<h2>📸 收進剛拍的雙鏡頭</h2><p class="hint" style="margin:0">${esc(p.title)}・D${pd.day + 1}・${esc(pl.name)}・隨手記</p>
      <label class="btn primary wide">從相簿選剛拍的影片<input type="file" accept="video/*" multiple class="vh" id="dfile"></label>
      <button class="btn ghost wide" id="dlater">先不要</button>`, () => {});
    $("#dlater", sc).onclick = () => { ls.set("dual-pending", null); sc._close(); };
    $("#dfile", sc).onchange = async e => { const files = [...e.target.files]; if (!files.length) return;
      const n = { id: uid("n"), ts: Date.now(), text: "", media: [] };
      try { let k = 0; for (const f of files) { k++; const path = `${safeName(p.title)}/D${pd.day + 1}_${safeName(pl.name)}_隨手記_雙鏡頭_${stamp()}-${k}.${extOf(f, f.type)}`; const c = await addClip(pd.pid, f, path, "video"); c.dual = true; n.media.push(c); } }
      catch (er) { toast("加不進去：" + (er && er.message || "")); return; }
      pl.notes.push(n); ls.set("dual-pending", null); touch(pd.pid); sc._close(); go(`p/${pd.pid}/${pd.day}/${pd.place}`); render(); toast("雙鏡頭影片已加進隨手記"); uploadPending(); };
    return;
  }
  const p = DATA.projects[pd.pid], d = p && p.days[pd.day], pl = d && d.places.find(x => x.id === pd.place), i = pl ? pl.shots.findIndex(x => x.id === pd.shot) : -1;
  if (i < 0 || document.querySelector(".scrim")) return;
  const s = pl.shots[i];
  const sc = sheet(`<h2>📸 剛拍好的雙鏡頭</h2><p class="hint" style="margin:0">${esc(pl.name)}・${pad(i + 1)} ${esc(s.n)}</p>
    <label class="btn primary wide">從相簿選剛拍的影片<input type="file" accept="video/*" multiple class="vh" id="dfile"></label>
    <button class="btn ghost wide" id="dlater">等一下再掛</button>`, () => {});
  $("#dlater", sc).onclick = () => { ls.set("dual-pending", null); sc._close(); };
  $("#dfile", sc).onchange = async e => {
    const files = [...e.target.files]; if (!files.length) return;
    try { let k = 0; for (const f of files) { k++; const path = `${safeName(p.title)}/D${pd.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_雙鏡頭_${stamp()}${files.length > 1 ? "-" + k : ""}.${extOf(f, f.type)}`; const c = await addClip(pd.pid, f, path, "video"); c.dual = true; s.clips.push(c); } }
    catch (er) { toast("加不進去：" + (er && er.message || "")); return; }
    s.done = true; ls.set("dual-pending", null); touch(pd.pid); sc._close(); go(`p/${pd.pid}/${pd.day}/${pd.place}`); render(); toast("雙鏡頭影片已掛上，上傳中"); uploadPending();
  };
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && DATA) setTimeout(checkDual, 400); });


/* 自動更新：手機常留著舊版，每次回到 App 檢查網站上的版本號，不一樣就重新載入 */
async function checkUpdate() {
  try {
    const cur = ((document.querySelector('script[src*="app.js"]') || {}).src || "").split("v=")[1] || "";
    const html = await (await fetch("./?u=" + Date.now(), { cache: "no-store" })).text();
    const m = /app\.js\?v=(\d+)/.exec(html);
    if (m && cur && m[1] !== cur && !document.querySelector(".scrim")) location.reload();
  } catch (e) {}
}
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") checkUpdate(); });


/* 現在就拍：只問在哪裡，自動開企劃＋今天＋地點（自由拍），直接進地點頁 */
function quickGo() {
  const sc = sheet(`<h2>⚡ 現在就拍</h2><div class="field"><label for="qname">在哪裡？</label><input id="qname" placeholder="例如：麥味登" enterkeyhint="go"></div>
    <button class="btn primary wide" id="qgo">開拍</button><p class="hint" style="margin:0">會開一個今天的企劃，地點用「自由拍」：沒有固定清單，想拍就拍。賽道、劇本、拍攝清單都可以之後從 ⋯ 補。</p>`);
  const inp = $("#qname", sc); setTimeout(() => inp.focus(), 50);
  const goNow = () => {
    const name = inp.value.trim() || "隨手拍 " + md(todayISO()).replace(/（.*/, "");
    const pl = newPlace(name, "free", nowHM()), id = uid("p");
    DATA.projects[id] = { title: name, tag: "生活", style: "", tpl: "", createdAt: todayISO(), quick: true, days: [{ id: uid("d"), date: todayISO(), title: "", places: [pl] }], _u: Date.now() };
    touch(id); sc._close(); go(`p/${id}/0/${pl.id}`);
  };
  $("#qgo", sc).onclick = goNow; inp.onkeydown = e => { if (e.key === "Enter") { e.preventDefault(); goNow(); } };
}


/* 快速加鏡頭：打字或點建議，一下就加到清單最後 */
function shotSuggest(pl) {
  const have = new Set(pl.shots.map(s => s.n)), own = ((blocks()[pl.type] || {}).shots || []).map(s => s.n);
  const common = ["門口招牌", "環境", "食物特寫", "第一口反應", "一人一句評價", "價格", "細節特寫", "人在景裡", "碎碎念", "乾杯", "窗外風景", "心得"];
  return [...new Set([...own, ...common])].filter(n => !have.has(n)).slice(0, 8);
}
function quickShot(name) {
  name = (name || "").trim(); if (!name) return;
  const pl = curPlace(); if (!pl) return;
  if (name === "待補") { const k = pl.shots.filter(s => s.n.startsWith("待補")).length; name = k ? "待補" + (k + 1) : "待補"; pl.shots.push({ id: uid("s"), n: name, h: "先拍，之後點名稱取名", sec: 0, done: false, clips: [] }); touch(view.pid); render(); toast("已加：" + name); return; }
  const base = Object.values(BUILTIN).flatMap(b => b.shots).find(s => s.n === name);
  pl.shots.push({ id: uid("s"), n: name, h: base ? base.h : "", sec: base ? base.sec : 4, done: false, clips: [] });
  touch(view.pid); render(); toast("已加：" + name);
  setTimeout(() => { const i = $("#qshot"); if (i) { i.scrollIntoView({ block: "center" }); } }, 30);
}
document.addEventListener("keydown", e => { if (e.target && e.target.id === "qshot" && e.key === "Enter") { e.preventDefault(); quickShot(e.target.value); } });


/* 幫我剪：複製句子＋直接打開 WonderMedia 的 Claude 對話 */
const CLAUDE_DEFAULT = "https://claude.ai/code/session_01T4rm6ATHXGLsQ8mN82MsVi";
const claudeURL = () => ls.get("claude-url", "") || CLAUDE_DEFAULT;
async function sendToClaude(txt) {
  let ok = false; try { await navigator.clipboard.writeText(txt); ok = true; } catch (e) {}
  const sc = sheet(`<h2>📋 交給 Claude 剪</h2><p style="margin:0;padding:10px 12px;background:var(--soft);border-radius:10px;user-select:all">${esc(txt)}</p>
    <p class="hint" style="margin:0">${ok ? "已複製。打開對話後，在輸入框長按 →「貼上」→ 送出。" : "先長按上面的字複製，再打開對話貼上。"}</p>
    <a class="btn primary wide" href="${esc(claudeURL())}" id="goclaude">打開 WonderMedia 對話</a>`);
  $("#goclaude", sc).onclick = () => setTimeout(() => sc._close(), 300);
}


function projSummary(p, di) {
  const days = di == null ? p.days : [p.days[di]], pls = days.flatMap(d => d.places); let v = 0, a = 0, ph = 0, dual = 0;
  pls.forEach(pl => { pl.shots.forEach(sh => sh.clips.forEach(c => { if (c.kind === "audio") a++; else if (c.kind === "photo") ph++; else v++; if (c.dual) dual++; })); pl.notes.forEach(n => (n.media || []).forEach(c => { if (c.kind === "audio") a++; else if (c.kind === "photo") ph++; else v++; if (c.dual) dual++; })); });
  return { days: days.length, places: pls.length, v, a, ph, dual, toString() { return `${this.days} 天・${this.places} 個地點・影片 ${this.v}・錄音 ${this.a}・照片 ${this.ph}${this.dual ? "・雙鏡頭 " + this.dual : ""}`; } };
}


/* 電腦上可以直接把影片／照片拖到某個鏡頭上 */
document.addEventListener("dragover", e => { const d = e.target.closest && e.target.closest("[data-drop]"); if (d && e.dataTransfer && [...e.dataTransfer.types].includes("Files")) { e.preventDefault(); d.classList.add("dropping"); } });
document.addEventListener("dragleave", e => { const d = e.target.closest && e.target.closest("[data-drop]"); if (d && !d.contains(e.relatedTarget)) d.classList.remove("dropping"); });
document.addEventListener("drop", async e => {
  const d = e.target.closest && e.target.closest("[data-drop]"); if (!d) return; e.preventDefault(); d.classList.remove("dropping");
  const files = [...(e.dataTransfer.files || [])].filter(f => /^(video|image|audio)\//.test(f.type)); if (!files.length) return toast("只收影片、照片、錄音檔");
  const p = curProj(), pl = curPlace(), i = pl.shots.findIndex(x => x.id === d.dataset.drop), s = pl.shots[i];
  try { let k = 0; for (const f of files) { k++; const kind = /image/.test(f.type) ? "photo" : /audio/.test(f.type) ? "audio" : "video"; const path = `${safeName(p.title)}/D${view.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_${stamp()}${files.length > 1 ? "-" + k : ""}.${extOf(f, f.type)}`; s.clips.push(await addClip(view.pid, f, path, kind)); } }
  catch (er) { return toast("加不進去：" + (er && er.message || "")); }
  s.done = true; touch(view.pid); render(); toast(`${files.length} 個檔案已掛到「${s.n}」，上傳中`); uploadPending();
});


/* 從 World 帶入行程：讀 OneDrive／Origina／World／data.json 的行程（沒登入就用 World 的重慶範例），一鍵變成企劃→天→地點 */
function guessType(t) { return /航班|NX\d|機場|出發|入境|接機|回航|索道|輕軌|高鐵|車站|移動/.test(t) ? "move" : /宴|餐|吃|火鍋|小吃|早餐|午餐|晚餐|咖啡|茶/.test(t) ? "food" : /酒店|飯店|民宿|入住|退房/.test(t) ? "stay" : /酒吧|夜/.test(t) ? "night" : "play"; }
async function fromWorld() {
  let trips = [];
  if (signedIn()) { try { const r = await gfetch("/me/drive/special/approot:/World/data.json:/content"); if (r && r.ok) { const j = await r.json(); trips = (j.data || j).trips || []; } } catch (e) {} }
  if (!trips.length) { try { trips = [await (await fetch("/World/samples/chongqing-2026.json", { cache: "no-store" })).json()]; } catch (e) {} }
  trips = trips.filter(t => t && (t.days || []).length);
  if (!trips.length) return toast("找不到 World 的行程，先登入 OneDrive 再試");
  const sc = sheet(`<h2>🌏 從 World 帶入行程</h2><p class="hint" style="margin:0">選一趟旅行，會照天數和行程建好企劃和地點，拍攝清單照地點類型自動帶出。${signedIn() ? "" : "（還沒登入 OneDrive，先顯示 World 的重慶範例）"}</p>
    <div class="stack">${trips.map((t, i) => `<button class="card post" data-tw="${i}"><b>${esc(t.title)}</b><div class="muted mono" style="font-size:12px">${esc(md(t.start))}～${esc(md(t.end))}・${t.days.length} 天</div></button>`).join("")}</div>`);
  sc.onclick = e => {
    const b = e.target.closest("[data-tw]"); if (!b) return; const t = trips[+b.dataset.tw];
    const days = t.days.map(d => ({ id: uid("d"), date: d.date, title: d.title || "", places: (d.items || d.stops || d.places || []).map(it => newPlace((it.title || it.name || "地點").slice(0, 30), guessType((it.title || "") + " " + (it.desc || "")), it.time || "")) }));
    const id = uid("p"); DATA.projects[id] = { title: t.title, tag: "旅行", style: "", tpl: "旅行 Vlog", createdAt: todayISO(), world: t.id || "", days, _u: Date.now() };
    touch(id); sc._close(); go("p/" + id + "/0"); toast(`已建立：${t.days.length} 天、${days.reduce((a, d) => a + d.places.length, 0)} 個地點`);
  };
}


/* 口播腳本：企劃上存一份腳本；請 Claude 寫 → 貼回來；拍的時候當提詞機 */
function scriptCard(p) {
  const has = (p.script || "").trim();
  return `<div class="card scard2"><div class="row" style="justify-content:space-between"><b>✍️ 口播腳本</b>${has ? `<span class="muted" style="font-size:12px">${has.length} 字・約 ${Math.max(1, Math.round(has.length / 4))} 秒</span>` : ""}</div>
    ${has ? `<p class="spreview">${esc(has.slice(0, 120))}${has.length > 120 ? "…" : ""}</p>` : `<p class="hint" style="margin:4px 0 0">要講話的片（口播、開場、心得）先寫腳本，拍的時候可以當提詞機。</p>`}
    <div class="row" style="margin-top:10px"><button class="btn sm primary" data-act="askscript">🤖 請 Claude 寫</button><button class="btn sm" data-act="editscript">✎ ${has ? "編輯" : "貼上／自己寫"}</button>${has ? `<button class="btn sm" data-act="prompter">📜 提詞機</button>` : ""}</div></div>`;
}
function askScript() {
  const p = curProj();
  const sc = form("請 Claude 寫腳本", [
    { k: "kind", l: "形式", v: p.scriptKind || "demo", opts: [["talk", "純口播（對鏡頭講）"], ["demo", "口播＋螢幕操作示範"]] },
    { k: "notes", l: "想講的重點（隨便打，條列也行）", v: p.scriptNotes || "", ph: "例如：Origina 是什麼、為什麼做、怎麼用" },
    { k: "len", l: "大概多長（秒）", type: "number", v: p.scriptLen || "", ph: "不確定就空白，讓 Claude 建議" }], v => {
    p.scriptKind = v.kind; p.scriptNotes = v.notes; p.scriptLen = v.len; touch(view.pid);
    const t = tplOf(p), st = styleOf(p), demo = v.kind === "demo";
    sendToClaude(`幫我寫口播腳本：${p.title}${st ? "（賽道：" + st.n + "）" : ""}${t ? "，劇本：" + t.n + "（" + t.flow.join("→") + "）" : ""}${v.len ? "，長度約 " + v.len + " 秒" : "，長度我不確定，請依內容建議幾秒最剛好（並說明為什麼）"}，口語、像我平常講話。重點：${v.notes || "（我等一下補）"}。`
      + (demo ? `\n這支要「螢幕錄影實際操作」：請用這個對話裡我們做 Origina／WonderMedia 的過程和總表（https://claude.ai/artifact/6tKf8aWatDsrMuhC2wVAhm）當背景，每一段給我「台詞＋畫面（哪個 App、哪一頁、點哪裡）」，最後列一條完整的錄影路線（照順序點）。可以的話也幫我用示範資料把這條路線錄成直式影片，放到 _輸出。` : "")
      + `\n先給我第一版，我會在對話裡一直跟你改，定稿後我再把台詞貼回 WonderMedia 的腳本欄。`);
  });
}
function editScript() {
  const p = curProj();
  const sc = sheet(`<h2>✍️ 口播腳本</h2><p class="hint" style="margin:0">把 Claude 寫的腳本貼進來，或自己寫。空一行＝換一段，提詞機會照段落停頓。</p>
    <textarea id="scr" style="min-height:45vh">${esc(p.script || "")}</textarea><button class="btn primary wide" id="ssave">儲存</button>`);
  $("#ssave", sc).onclick = () => { p.script = $("#scr", sc).value; touch(view.pid); sc._close(); render(); toast("腳本已儲存"); };
}
function prompterHTML(text) { return `<div class="prompter" id="pmt"><div class="pmtext" id="pmtext">${esc(text).split(/\n{2,}/).map(x => `<p>${x.replace(/\n/g, "<br>")}</p>`).join("")}<div style="height:60vh"></div></div></div>`; }
function bindPrompter(root, getRunning) {
  const box = $("#pmt", root); let speed = Number(ls.get("pm-speed", 40)), last = 0, raf = 0, on = false;
  const loop = ts => { if (on) { if (last) box.scrollTop += speed * (ts - last) / 1000; last = ts; } raf = requestAnimationFrame(loop); };
  raf = requestAnimationFrame(loop);
  return { play() { on = true; last = 0; }, pause() { on = false; }, toggle() { on = !on; last = 0; return on; }, faster() { speed = Math.min(160, speed + 10); ls.set("pm-speed", speed); return speed; }, slower() { speed = Math.max(10, speed - 10); ls.set("pm-speed", speed); return speed; }, reset() { box.scrollTop = 0; }, stop() { cancelAnimationFrame(raf); } };
}
function openPrompter() {
  const p = curProj(); if (!(p.script || "").trim()) return toast("先寫腳本");
  const sc = document.createElement("div"); sc.className = "pmfull";
  sc.innerHTML = `${prompterHTML(p.script)}<div class="pmbar"><button id="pmx">✕</button><button id="pms">－慢</button><button id="pmp" class="pmplay">▶ 開始</button><button id="pmf">快＋</button><button id="pmr">↺</button></div>`;
  document.body.appendChild(sc); document.body.style.overflow = "hidden";
  const P = bindPrompter(sc);
  $("#pmx", sc).onclick = () => { P.stop(); sc.remove(); document.body.style.overflow = ""; };
  $("#pmp", sc).onclick = e => { e.currentTarget.textContent = P.toggle() ? "❚❚ 暫停" : "▶ 開始"; };
  $("#pmf", sc).onclick = () => toast("速度 " + P.faster()); $("#pms", sc).onclick = () => toast("速度 " + P.slower()); $("#pmr", sc).onclick = () => P.reset();
}

/* ---------- 事件 ---------- */
document.addEventListener("click", async e => {
  const t = e.target;
  const g = t.closest("[data-go]"); if (g && !t.closest("input,label,button:not([data-go])")) { go(g.dataset.go); return; }
  const a = t.closest("[data-act]"); if (a) {
    const act = a.dataset.act;
    if (act === "login") return login();
    if (act === "logout") return logout();
    if (act === "sync") { await sync(); return toast(SYNC === "ok" ? "已同步" : "同步沒成功"); }
    if (act === "newproj") return newProject();
    if (act === "quickgo") return quickGo();
    if (act === "askscript") return askScript();
    if (act === "editscript") return editScript();
    if (act === "prompter") return openPrompter();
    if (act === "fromworld") return fromWorld();
    if (act === "cutday") { const p = curProj(), di = Math.min(view.day, p.days.length - 1), d = p.days[di], sm = projSummary(p, di); const fx = [p.style && "賽道：" + p.style, p.tpl && "劇本：" + p.tpl, styleMethod(p) && "剪法：" + styleMethod(p)].filter(Boolean).join("，"); return sendToClaude(`幫我剪：${p.title}／D${di + 1}${d.title ? " " + d.title : ""}（${sm}）${fx ? "，" + fx : ""}。地點：${d.places.map(x => x.name).join("、") || "—"}`); }
    if (act === "cutproj") { const p = curProj(), sm = projSummary(p); const fx = [p.style && "賽道：" + p.style, p.tpl && "劇本：" + p.tpl, styleMethod(p) && "剪法：" + styleMethod(p)].filter(Boolean).join("，"); const where = p.days.map((d, i) => `D${i + 1} ` + (d.places.map(x => x.name).join("、") || "—")).join("；"); return sendToClaude(`幫我剪整個企劃：${p.title}（${sm}）${fx ? "，" + fx : ""}。地點：${where}`); }
    if (act === "qshot") return quickShot(($("#qshot") || {}).value);
    if (act === "addplace") return addPlace();
    if (act === "quick" || act === "note") return openNote(act === "quick");
    if (act === "capture") return openCapture(null);
    if (act === "cap-text") return openCapture("text");
    if (act === "cap-voice") return openCapture("voice");
    if (act === "newpost") return editPost(null);
    if (act === "cutpicks") { const ps = riverItems().filter(x => x.o.pick); const ds = [...new Set(ps.map(x => dateOf(x.ts)))].sort(); const tg = [...new Set(ps.flatMap(x => x.o.tags || []))]; const txt = `幫我剪：河流挑選的 ${ps.length} 則（${ds.map(md).join("、")}）${tg.length ? "，標籤 " + tg.map(g => "#" + g).join(" ") : ""}`; return sendToClaude(txt); return; }
    if (act === "editshots") return editShots();
    if (act === "addday") { const p = curProj(), last = p.days[p.days.length - 1], dt = new Date((last ? last.date : todayISO()) + "T00:00"); dt.setDate(dt.getDate() + (last ? 1 : 0)); p.days.push({ id: uid("d"), date: dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()), title: "", places: [] }); touch(view.pid); return go(`p/${view.pid}/${p.days.length - 1}`); }
    if (act === "editday") { const d = curDay(); return form("這一天", [{ k: "title", l: "標題", v: d.title, ph: "例如：家庭聚餐" }, { k: "date", l: "日期", type: "date", v: d.date }], v => { d.title = v.title; d.date = v.date || d.date; touch(view.pid); render(); }); }
    if (act === "laugh") { const pl = curPlace(); pl.laughs.push({ ts: Date.now(), at: nowHM() }); touch(view.pid); render(); return toast("⭐ 已標記 " + nowHM()); }
    if (act === "tocut") { const p = curProj(), pl = curPlace(); const fx = [p.style && "賽道：" + p.style, p.tpl && "劇本：" + p.tpl, styleMethod(p) && "剪法：" + styleMethod(p)].filter(Boolean).join("，"); const dual = pl.shots.some(x => x.clips.some(c => c.dual)); const txt = `幫我剪：${p.title}／D${view.day + 1}／${pl.name}${fx ? "（" + fx + "）" : ""}${dual ? "，有雙鏡頭影片" : ""}`; return sendToClaude(txt); return; }
    if (act === "export") { const b = new Blob([JSON.stringify(DATA, null, 1)], { type: "application/json" }); const u = URL.createObjectURL(b); const x = document.createElement("a"); x.href = u; x.download = "wondermedia-" + todayISO() + ".json"; x.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); return; }
    if (act === "projmenu") {
      const p = curProj(); const sc = sheet(`<h2>${esc(p.title)}</h2><div class="menu"><button data-m="edit">編輯名稱、分類、賽道、劇本</button><button data-m="del" class="danger">刪除這個企劃</button></div>`);
      sc.onclick = ev => { const m = ev.target.closest("[data-m]"); if (!m) return; if (m.dataset.m === "edit") { sc._close(); form("企劃", [{ k: "title", l: "名稱", v: p.title }, { k: "tag", l: "分類", opts: TAGS.map(x => [x, x]), v: p.tag }, { k: "style", l: "風格・賽道", opts: [["", "不選"]].concat(wb().styles.map(x => [x.n, x.n])), v: p.style || "" }, { k: "tpl", l: "劇本・影片模板", opts: [["", "不選"]].concat(wb().templates.map(x => [x.n, x.n])), v: p.tpl || "" }], v => { p.title = v.title || p.title; p.tag = v.tag; p.style = v.style; p.tpl = v.tpl; touch(view.pid); render(); }); } if (m.dataset.m === "del") { if (!m.dataset.c) { m.dataset.c = 1; m.textContent = "再按一次確定刪除（OneDrive 的影片會保留）"; return; } delete DATA.projects[view.pid]; DATA.deleted["p/" + view.pid] = Date.now(); DIRTY = true; writeCache(); scheduleSync(); sc._close(); go("home"); } };
      return;
    }
    if (act === "placemenu") {
      const pl = curPlace(); const sc = sheet(`<h2>${esc(pl.name)}</h2><div class="menu"><button data-m="edit">改名稱、時間、換積木（帶出拍攝清單）</button><button data-m="world">移到旅遊手冊 World</button><button data-m="del" class="danger">刪除這個地點</button></div>`);
      sc.onclick = ev => { const m = ev.target.closest("[data-m]"); if (!m) return;
        if (m.dataset.m === "world") { toast("下一版會做：選哪一趟、哪一天、哪個時間點"); return; }
        if (m.dataset.m === "edit") { sc._close(); form("地點", [{ k: "name", l: "名稱", v: pl.name }, { k: "time", l: "時間", type: "time", v: pl.time }, { k: "type", l: "場景積木", opts: typeOpts(), v: pl.type }], v => { pl.name = v.name || pl.name; pl.time = v.time; if (v.type !== pl.type) { const had = pl.shots.some(s => s.clips.length); pl.type = v.type; const ns = newPlace(pl.name, v.type).shots; pl.shots = had ? pl.shots.filter(s => s.clips.length).concat(ns) : ns; } touch(view.pid); render(); }); }
        if (m.dataset.m === "del") { if (!m.dataset.c) { m.dataset.c = 1; m.textContent = "再按一次確定刪除"; return; } const d = curDay(); d.places = d.places.filter(x => x.id !== pl.id); touch(view.pid); sc._close(); go(`p/${view.pid}/${view.day}`); } };
      return;
    }
  }
  const qs = t.closest("[data-qs]"); if (qs) return quickShot(qs.dataset.qs);
  const rn = t.closest("[data-rename]"); if (rn) { const s = curPlace().shots.find(x => x.id === rn.dataset.rename); if (!s) return; return form("鏡頭名稱", [{ k: "n", l: "名稱", v: s.n.startsWith("待補") ? "" : s.n, ph: "例如：哥哥的反應" }, { k: "h", l: "提示（可空白）", v: s.h === "先拍，之後點名稱取名" ? "" : s.h }], v => { if (!v.n) { toast("取個名字"); return false; } s.n = v.n; s.h = v.h; touch(view.pid); render(); }); }
  const we = t.closest("[data-wbedit]"); if (we) { const [k, i] = we.dataset.wbedit.split(":"); return editWB(k, +i); }
  const wa = t.closest("[data-wbadd]"); if (wa) return editWB(wa.dataset.wbadd, null);
  const kt = t.closest("[data-ktab]"); if (kt) { KF.tab = kt.dataset.ktab; if (SND) { SND.pause(); SND = null; } render(); return; }
  const kc = t.closest("[data-kcat]"); if (kc) { KF.cat = kc.dataset.kcat; render(); return; }
  const sd = t.closest("[data-snd]"); if (sd) { const was = SND && SND._src === sd.dataset.snd; if (SND) { SND.pause(); SND = null; } document.querySelectorAll(".snd.on").forEach(x => x.classList.remove("on")); if (!was) { SND = new Audio(sd.dataset.snd); SND._src = sd.dataset.snd; SND.play().catch(() => {}); sd.classList.add("on"); SND.onended = () => { sd.classList.remove("on"); SND = null; }; } return; }
  const pk = t.closest("[data-pick]"); if (pk) { const x = findItem(pk.dataset.pick); if (x) { x.o.pick = !x.o.pick; saveItem(x); render(); toast(x.o.pick ? "⭐ 已挑選，在工作台等著剪" : "已取消挑選"); } return; }
  const rf = t.closest("[data-rf]"); if (rf) { const v = rf.dataset.rf; RF.pick = v === "★" ? !RF.pick : false; RF.tag = v.startsWith("#") ? (RF.tag === v.slice(1) ? "" : v.slice(1)) : ""; if (v === "") { RF.pick = false; RF.tag = ""; } render(); return; }
  const it = t.closest("[data-item]"); if (it && !t.closest("[data-view]")) return openItem(it.dataset.item);
  const po = t.closest("[data-post]"); if (po) return editPost(po.dataset.post);
  const rb = t.closest("[data-rec]"); if (rb) return openShotRecorder(rb.dataset.rec);
  const cb = t.closest("[data-cam]"); if (cb) return openCamera(cb.dataset.cam);
  const du = t.closest("[data-dual]"); if (du) return startDual(du.dataset.dual === "src" ? { src: true } : { pid: view.pid, day: view.day, place: view.place, shot: du.dataset.dual });
  const nb = t.closest("[data-snote]"); if (nb) return openShotNote(nb.dataset.snote);
  const vw = t.closest("[data-view]"); if (vw && !t.closest("[data-rmclip]")) return viewClip(vw.dataset.view);
  const lb = t.closest("[data-laugh]"); if (lb) { const s = curPlace().shots.find(x => x.id === lb.dataset.laugh); s.laughs = s.laughs || []; s.laughs.push({ ts: Date.now(), at: nowHM() }); touch(view.pid); render(); return toast("⭐ " + s.n + " 標了笑點 " + nowHM()); }
  const star = t.closest("[data-star]"); if (star) { const k = star.parentElement.dataset.f, pl = curPlace(); pl.info[k] = pl.info[k] === +star.dataset.star ? 0 : +star.dataset.star; touch(view.pid); render(); return; }
  const opt = t.closest("[data-opt]"); if (opt) { const k = opt.parentElement.dataset.f, pl = curPlace(); pl.info[k] = pl.info[k] === opt.dataset.opt ? "" : opt.dataset.opt; touch(view.pid); render(); return; }
  const rm = t.closest("[data-rmclip]"); if (rm) {
    const pl = curPlace(); for (const s of pl.shots) { const i = s.clips.findIndex(c => c.key === rm.dataset.rmclip); if (i >= 0) { if (!rm.dataset.c) { rm.dataset.c = 1; rm.textContent = "確定?"; return; } const [c] = s.clips.splice(i, 1); await IDB.del(c.key); touch(view.pid); render(); toast(c.od ? "已從清單移除（OneDrive 的檔案保留）" : "已移除"); return; } }
  }
});
document.addEventListener("change", async e => {
  const t = e.target;
  if (t.id === "capphoto") { const files = [...(t.files || [])]; t.value = ""; if (!files.length) return; try { for (const f of files) await addRecord(/video/.test(f.type) ? "video" : "photo", "", [{ file: f }]); } catch (er) { toast("存不進去：" + (er && er.message || "")); return; } render(); toast(`${files.length} 個檔案已存進源頭`); uploadPending(); return; }
  if (t.dataset.done) { const s = curPlace().shots.find(x => x.id === t.dataset.done); s.done = t.checked; touch(view.pid); render(); return; }
  if (t.dataset.upload) {
    const p = curProj(), pl = curPlace(), i = pl.shots.findIndex(x => x.id === t.dataset.upload), s = pl.shots[i];
    if (!t.files || !t.files.length) return;
    try { let k = 0; for (const f of t.files) { k++; const path = `${safeName(p.title)}/D${view.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_${stamp()}${t.files.length > 1 ? "-" + k : ""}.${extOf(f, f.type)}`; s.clips.push(await addClip(view.pid, f, path, /image/.test(f.type) ? "photo" : "video")); }
    } catch (er) { toast("加不進去：" + (er && er.message || "請從主畫面的 WonderMedia 開啟")); return; }
    s.done = true; touch(view.pid); render(); toast(signedIn() ? "已加入，上傳中" : "已存在手機，登入 OneDrive 後上傳"); uploadPending(); return;
  }
  if (t.id === "claudeurl") { const v = t.value.trim(); ls.set("claude-url", /^https:\/\/claude\.ai\//.test(v) ? v : ""); toast(/^https:\/\/claude\.ai\//.test(v) ? "已儲存對話網址" : "要是 claude.ai 開頭的網址，已改回預設"); return; }
  if (t.dataset.f && t.tagName === "INPUT") { curPlace().info[t.dataset.f] = t.value.trim(); touch(view.pid); }
});

/* ---------- 啟動 ---------- */
(async function boot() {
  await handleRedirect();
  const c = ls.get(CACHE_KEY, null);
  if (c && c.data) { DATA = normalize(c.data); ETAG = c.eTag; DIRTY = c.dirty; } else { DATA = seedData(); DIRTY = true; writeCache(); }
  parseHash(); render(); sync(); importInbox(); setTimeout(checkDual, 600); checkUpdate();
})();
