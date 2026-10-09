/* WonderMedia — 小瑋的拍攝記錄 App
   企劃 → 天 → 地點（場景積木）→ 拍攝清單／紀錄欄位／記一則／笑點
   資料：裝置上先存（不怕沒網路），登入 OneDrive 後同步；影片用好剪的檔名上傳到 OneDrive。 */
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
function emptyData() { return { v: 1, projects: {}, docs: {}, deleted: {} }; }
function seedData() {
  const d = emptyData(), sat = nextSaturday();
  const pl = newPlace("鰻天下", "food", "12:00");
  d.projects.p_eel = { title: "週末吃鰻天下", tag: "生活", createdAt: todayISO(), days: [{ id: "d1", date: sat, title: "家庭聚餐", places: [pl] }], _u: Date.now() };
  return d;
}
function nextSaturday() { const d = new Date(); d.setDate(d.getDate() + ((6 - d.getDay() + 7) % 7 || 7)); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
function newPlace(name, type, time) { return { id: uid("pl"), name, type, time: time || "", info: {}, shots: blocks()[type].shots.map(s => ({ id: uid("s"), ...s, done: false, clips: [] })), notes: [], laughs: [] }; }
function normalize(d) { d = d || emptyData(); d.projects = d.projects || {}; d.docs = d.docs || {}; d.deleted = d.deleted || {}; return d; }
function merge(a, b) {
  a = normalize(a); b = normalize(b); const out = emptyData();
  for (const k of new Set([...Object.keys(a.deleted), ...Object.keys(b.deleted)])) out.deleted[k] = Math.max(a.deleted[k] || 0, b.deleted[k] || 0);
  for (const id of new Set([...Object.keys(a.projects), ...Object.keys(b.projects)])) {
    const x = a.projects[id], y = b.projects[id]; const r = !x ? y : !y ? x : ((y._u || 0) > (x._u || 0) ? y : x);
    if ((out.deleted["p/" + id] || 0) >= (r._u || 0)) continue; out.projects[id] = r;
  }
  for (const k of new Set([...Object.keys(a.docs), ...Object.keys(b.docs)])) { const x = a.docs[k], y = b.docs[k]; out.docs[k] = !x ? y : !y ? x : ((y._u || 0) > (x._u || 0) ? y : x); }
  return out;
}
function writeCache() { ls.set(CACHE_KEY, { data: DATA, eTag: ETAG, dirty: DIRTY }); }
function touch(pid) { if (pid && DATA.projects[pid]) DATA.projects[pid]._u = Date.now(); DIRTY = true; writeCache(); scheduleSync(); }
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
function allClips() { const out = []; for (const pid in DATA.projects) { const p = DATA.projects[pid]; p.days.forEach(d => d.places.forEach(pl => { pl.shots.forEach(s => s.clips.forEach(c => out.push({ p, pid, c }))); pl.notes.forEach(n => (n.media || []).forEach(c => out.push({ p, pid, c }))); })); } return out; }
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
      if (item && item.id) { c.od = item.id; delete c.pct; touch(pid); await IDB.del(c.key); render(); }
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
const view = { tab: "home", pid: null, day: 0, place: null };
function go(hash) { location.hash = hash; }
function parseHash() {
  const h = decodeURIComponent(location.hash.slice(1)).split("/");
  view.tab = h[0] || "home"; view.pid = h[1] || null; view.day = Number(h[2] || 0); view.place = h[3] || null;
}
addEventListener("hashchange", () => { parseHash(); render(); scrollTo(0, 0); });

function syncBanner() {
  if (SYNC === "ok") { const n = allClips().filter(x => !x.c.od).length; return n ? `<div class="banner"><span>⬆️ ${n} 段影片上傳中…</span></div>` : ""; }
  if (SYNC === "expired" || !signedIn()) return `<div class="banner"><span>先存在這支手機。登入 OneDrive 後，影片才會傳到電腦給 Claude 剪。</span><button class="btn sm primary" data-act="login">登入</button></div>`;
  if (SYNC === "offline") return `<div class="banner"><span>目前沒網路，先存在手機，連上會自動上傳</span></div>`;
  return "";
}
function render() {
  if (!DATA) return;
  const app = $("#app");
  if (view.tab === "blocks") app.innerHTML = blocksHTML();
  else if (view.tab === "set") app.innerHTML = settingsHTML();
  else if (view.tab === "p" && view.place && DATA.projects[view.pid]) app.innerHTML = placeHTML();
  else if (view.tab === "p" && DATA.projects[view.pid]) app.innerHTML = projectHTML();
  else app.innerHTML = homeHTML();
  $("#tabs").innerHTML = tabsHTML();
}
const ICON = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/></svg>',
  blocks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="8" height="8" rx="2"/><rect x="13" y="3" width="8" height="8" rx="2"/><rect x="3" y="13" width="8" height="8" rx="2"/><rect x="13" y="13" width="8" height="8" rx="2"/></svg>',
  set: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1.2l2-1.6-2-3.4-2.4 1a7 7 0 0 0-2-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2 1.2l-2.4-1-2 3.4 2 1.6a7 7 0 0 0 0 2.4l-2 1.6 2 3.4 2.4-1a7 7 0 0 0 2 1.2L10 21h4l.5-2.6a7 7 0 0 0 2-1.2l2.4 1 2-3.4-2-1.6c.1-.4.1-.8.1-1.2z"/></svg>'
};
function tabsHTML() {
  const cur = view.tab === "p" ? "home" : view.tab;
  return `<button data-go="home" aria-current="${cur === "home"}">${ICON.home}企劃</button>
    <button class="rec" data-act="quick" aria-label="記一則"><span class="dot"><svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="#fff" stroke-width="2"><rect x="3" y="6" width="13" height="12" rx="2"/><path d="M16 10l5-3v10l-5-3z"/></svg></span></button>
    <button data-go="blocks" aria-current="${cur === "blocks"}">${ICON.blocks}積木</button>
    <button data-go="set" aria-current="${cur === "set"}">${ICON.set}設定</button>`;
}
function laughCount(pl) { return (pl.laughs || []).length + pl.shots.reduce((a, s) => a + (s.laughs || []).length, 0); }
function progress(pl) { const n = pl.shots.length, d = pl.shots.filter(s => s.done || s.clips.length).length; return { n, d }; }
function homeHTML() {
  const ps = Object.entries(DATA.projects).map(([id, p]) => ({ id, ...p })).sort((a, b) => ((b.days[0] || {}).date || "").localeCompare((a.days[0] || {}).date || ""));
  return `<div class="top"><h1 style="font-family:var(--f-display);font-size:24px">WonderMedia</h1></div>
  ${syncBanner()}
  <section class="section"><header><h2>拍攝企劃</h2><button class="btn sm primary" data-act="newproj">＋ 新企劃</button></header>
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
  <div class="dayhead t-food" style="--tc:var(--muted);margin-top:10px"><div class="row"><span class="mono muted" style="font-size:13px">D${di + 1}・${esc(md(d.date))}</span><span class="chip">${esc(p.tag)}</span><span class="grow"></span><button class="icon-btn" data-act="editday" aria-label="編輯這天">✎</button></div><h1>${esc(d.title || p.title)}</h1></div>
  <p class="hint" style="margin-top:6px">每個地點選一塊場景積木，拍攝清單會自動帶出來。拍完一個鏡頭就把影片掛上去。</p>
  <section class="section"><h2>這天的地點</h2><div class="card"><div class="tl">
    <div class="insert"><button data-act="addplace">＋ 插入地點</button></div>
    ${pls.length ? pls.map(pl => { const b = blocks()[pl.type] || BUILTIN.free, pr = progress(pl);
      return `<div class="item ${b.cls}" data-go="p/${view.pid}/${di}/${pl.id}" style="cursor:pointer"><time>${esc(pl.time || "—")}</time><div><div class="t"><span>${esc(pl.name)}</span><span class="muted">›</span></div>
        <div class="meta"><span class="chip type">${esc(b.name)}</span>${pr.n ? `<span class="chip">鏡頭 ${pr.d}/${pr.n}</span>` : ""}${laughCount(pl) ? `<span class="chip">⭐ ${laughCount(pl)}</span>` : ""}${pl.notes.length ? `<span class="chip">📝 ${pl.notes.length}</span>` : ""}</div></div></div>
        <div class="insert"><button data-act="addplace">＋ 插入地點</button></div>`; }).join("") : `<div class="empty"><b>這天還沒有地點</b>按「插入地點」開始</div>`}
  </div></div></section>`;
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
  return `<div class="top"><button class="icon-btn" data-go="p/${view.pid}/${view.day}" aria-label="返回">‹</button><h1>${esc(p.title)}</h1><button class="icon-btn" data-act="placemenu" aria-label="更多">⋯</button></div>
  <div class="dayhead ${b.cls}"><div class="row"><span class="mono muted" style="font-size:13px">D${view.day + 1}・${esc(pl.time || "")}</span><span class="chip type">${esc(b.name)}</span></div><h1>${esc(pl.name)}</h1></div>
  <section class="section"><h2>📝 這一站的紀錄</h2><div class="card grid2" id="info">
    ${b.fields.map(f => `<div class="field ${f.full ? "full" : ""}"><label>${esc(f.l)}</label>${fieldHTML(f, pl.info[f.k])}</div>`).join("")}
  </div></section>
  <section class="section"><header><h2>🎬 拍攝清單</h2><span class="muted mono" style="font-size:13px">${pr.d} / ${pr.n}</span></header>
    <div class="card">${pl.shots.map((s, i) => `<div class="shot ${s.done || s.clips.length ? "done" : ""}"><input type="checkbox" data-done="${s.id}" ${s.done || s.clips.length ? "checked" : ""} aria-label="${esc(s.n)} 拍好了">
      <div><div class="n">${pad(i + 1)} ${esc(s.n)}</div>${s.h ? `<div class="h">${esc(s.h)}</div>` : ""}<div class="clips">${s.clips.map(clipChip).join("")}</div>${s.clips.filter(c => c.text).map(c => `<div class="h" style="margin-top:4px">🎙️ ${esc(c.text)}</div>`).join("")}${s.note ? `<div class="snote" data-snote="${s.id}">📝 ${esc(s.note)}</div>` : ""}
      <div class="clips"><button class="addclip" data-cam="${s.id}">🎬 拍攝</button><label class="addclip">🖼️ 相簿<input type="file" accept="video/*,image/*" multiple class="vh" data-upload="${s.id}"></label><button class="addclip" data-rec="${s.id}">🎙️ 錄音</button><button class="addclip" data-snote="${s.id}">📝 筆記</button><button class="addclip${(s.laughs || []).length ? " on" : ""}" data-laugh="${s.id}">⭐ 笑點${(s.laughs || []).length ? " " + s.laughs.length : ""}</button></div></div>
      <span class="sec">${s.sec ? s.sec + "秒" : ""}</span></div>`).join("") || `<p class="hint">這塊積木沒有固定鏡頭，用下面的「記一則」自由記錄。</p>`}
      <div class="row" style="margin-top:10px"><button class="btn sm ghost" data-act="editshots">✎ 編輯鏡頭</button></div></div>
    <p class="hint">每個鏡頭都可以拍影片或直接錄音。拍到好笑的瞬間按那個鏡頭的「⭐ 笑點」，Claude 剪片時會把那段留下來、加料。</p></section>
  <section class="section"><header><h2>🎙️ 隨手記</h2><button class="btn sm primary" data-act="note">＋ 記一則</button></header>
    <div class="card">${pl.notes.length ? pl.notes.map(n => `<div class="note"><time>${new Date(n.ts).toTimeString().slice(0, 5)}</time>${n.text ? `<p>${esc(n.text)}</p>` : ""}<div class="clips">${(n.media || []).map(c => `<span class="clip ${c.od ? "up" : "wait"}">${c.kind === "audio" ? "🎙️" : c.kind === "photo" ? "📷" : "🎬"} ${c.od ? "已上傳" : "未上傳"}</span>`).join("")}</div></div>`).join("") : `<p class="hint">吃完對手機講一分鐘心得最好用：Claude 會用你自己的話寫配音腳本。</p>`}</div></section>
  <section class="section"><div class="card"><b>拍完了？</b><p class="hint" style="margin:4px 0 10px">按下面複製一句話，貼到 Claude 的「自媒體大神工具」對話就會開始剪。</p>
    <button class="btn primary wide" data-act="tocut">📋 複製「幫我剪」</button></div></section>`;
}
function blocksHTML() {
  const B = blocks();
  return `<div class="top"><h1 style="font-size:20px">場景積木</h1></div>
  <p class="hint">新增地點時選一塊，拍攝清單就自動帶出。在地點裡改過鏡頭，可以按「存成這塊積木的預設」。</p>
  <section class="section"><div class="card">${Object.entries(B).map(([k, b]) => `<details class="blk"><summary class="row" style="cursor:pointer"><span class="chip type ${b.cls}">${esc(b.name)}</span><span class="muted" style="font-size:13px">${b.shots.length} 個鏡頭</span></summary>
    <ol style="margin:8px 0 0;padding-left:22px;font-size:14px">${b.shots.map(s => `<li>${esc(s.n)}${s.h ? `<span class="muted">｜${esc(s.h)}</span>` : ""}</li>`).join("") || "<li class='muted'>自由拍</li>"}</ol>
    <p class="hint" style="margin-top:6px">紀錄欄位：${b.fields.map(f => esc(f.l)).join("、")}</p></details>`).join("")}</div></section>`;
}
function settingsHTML() {
  return `<div class="top"><h1 style="font-size:20px">設定</h1></div>
  <section class="section"><h2>OneDrive</h2><div class="card stack">
    ${signedIn() ? `<div class="banner ok"><span>已登入，影片會傳到 OneDrive／應用程式／Origina／WonderMedia</span></div><button class="btn" data-act="sync">立即同步</button><button class="btn danger" data-act="logout">登出</button>`
      : `<p class="hint" style="margin:0">登入後：手機拍的影片會自動傳到 OneDrive，電腦同步下來，Claude 就能直接剪。沒登入也能用，影片先存在這支手機。</p><button class="btn primary" data-act="login">登入 OneDrive</button>`}
  </div></section>
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
  form("新企劃", [{ k: "title", l: "企劃名稱", ph: "例如：週末吃鰻天下" }, { k: "tag", l: "分類", opts: TAGS.map(t => [t, t]), v: "生活" }, { k: "date", l: "日期（第一天）", type: "date", v: todayISO() }, { k: "days", l: "幾天", type: "number", v: "1" }], v => {
    if (!v.title) { toast("取個名字"); return false; }
    const n = Math.max(1, Math.min(14, Number(v.days) || 1)), days = [];
    for (let i = 0; i < n; i++) { const dt = new Date(v.date + "T00:00"); dt.setDate(dt.getDate() + i); days.push({ id: uid("d"), date: dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()), title: "", places: [] }); }
    const id = uid("p"); DATA.projects[id] = { title: v.title, tag: v.tag, createdAt: todayISO(), days, _u: Date.now() }; touch(id); go("p/" + id + "/0");
  });
}
function addPlace() {
  form("插入地點", [{ k: "name", l: "地點名稱", ph: "例如：鰻天下" }, { k: "type", l: "場景積木", opts: typeOpts(), v: "food" }, { k: "time", l: "時間", type: "time", v: nowHM() }], v => {
    if (!v.name) { toast("輸入地點名稱"); return false; }
    const pl = newPlace(v.name, v.type, v.time); curDay().places.push(pl); touch(view.pid); go(`p/${view.pid}/${view.day}/${pl.id}`);
  });
}
function editShots() {
  const pl = curPlace(); let shots = pl.shots.map(s => ({ ...s }));
  const rows = () => shots.map((s, i) => `<div class="ed" data-i="${i}"><input data-k="n" value="${esc(s.n)}" aria-label="鏡頭名稱"><input data-k="sec" inputmode="numeric" value="${s.sec || ""}" aria-label="秒數" placeholder="秒"><span class="row" style="gap:2px"><button class="icon-btn" data-up="${i}" aria-label="上移">↑</button><button class="icon-btn" data-del="${i}" aria-label="刪除">×</button></span><input data-k="h" value="${esc(s.h || "")}" placeholder="拍攝提示" style="grid-column:1/-1;font-size:13px"></div>`).join("");
  const sc = sheet(`<h2>編輯鏡頭</h2><div id="eds">${rows()}</div><button class="btn" id="addshot">＋ 加一個鏡頭</button>
    <label class="row" style="font-size:14px"><input type="checkbox" id="asdef"> 存成「${esc((blocks()[pl.type] || BUILTIN.free).name)}」積木的預設</label>
    <button class="btn primary wide" id="ssave">儲存</button>`);
  const box = $("#eds", sc), read = () => box.querySelectorAll(".ed").forEach(r => { const s = shots[r.dataset.i]; r.querySelectorAll("[data-k]").forEach(inp => s[inp.dataset.k] = inp.dataset.k === "sec" ? Number(inp.value) || 0 : inp.value.trim()); });
  sc.addEventListener("click", e => {
    const up = e.target.closest("[data-up]"), del = e.target.closest("[data-del]");
    if (up) { read(); const i = +up.dataset.up; if (i > 0) [shots[i - 1], shots[i]] = [shots[i], shots[i - 1]]; box.innerHTML = rows(); }
    if (del) { read(); const s = shots[+del.dataset.del]; if (s.clips && s.clips.length) { toast("這個鏡頭已經有影片，先移除影片"); return; } shots.splice(+del.dataset.del, 1); box.innerHTML = rows(); }
  });
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
    btn.classList.add("on"); btn.textContent = "停止"; startSR();
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
function findClip(key) { for (const pid in DATA.projects) for (const d of DATA.projects[pid].days) for (const pl of d.places) { for (const s of pl.shots) { const c = s.clips.find(x => x.key === key); if (c) return { c, label: s.n }; } for (const n of pl.notes) { const c = (n.media || []).find(x => x.key === key); if (c) return { c, label: "隨手記" }; } } return null; }
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
    <p class="camhint" id="chint">直拍 9:16・可以連拍好幾段，拍好按「儲存」</p>
    <div class="cambar"><button class="camside" id="cflip" aria-label="翻轉鏡頭">🔄</button><button class="recbig" id="crec" aria-label="開始錄影">錄影</button><button class="camside camsave" id="csave">儲存<small id="ctakes">0 段</small></button></div>`;
  document.body.appendChild(sc); document.body.style.overflow = "hidden";
  sc._close = () => { stopAll(); sc.remove(); document.body.style.overflow = ""; };
  sc.querySelector("#cclose").onclick = () => { if (takes.length && !sc.dataset.c) { sc.dataset.c = 1; $("#chint", sc).textContent = "還有 " + takes.length + " 段沒儲存，再按一次 ✕ 放棄"; return; } sc._close(); };
  const btn = $("#crec", sc), hint = $("#chint", sc), vid = $("#cv", sc);
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
    if (rec && rec.state === "recording") { rec.stop(); clearInterval(timer); btn.classList.remove("on"); btn.textContent = "再拍一段"; return; }
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
    <div class="pickers"><label class="pick">📷 照片<input id="nphoto" type="file" accept="image/*" multiple class="vh"></label><label class="pick">🎬 影片<input id="nvideo" type="file" accept="video/*" multiple class="vh"></label></div>
    <div class="row" id="mlist"></div>
    ${recorderHTML()}
    <div class="field"><label for="ntext">文字</label><textarea id="ntext" placeholder="也可以按鍵盤上的麥克風口述"></textarea></div>
    <button class="btn primary wide" id="nsave">儲存</button>`, () => R && R.stopAll());
  const ta = $("#ntext", sc), refresh = () => { $("#mlist", sc).innerHTML = list(); };
  R = bindRecorder(sc, ta, b => { media.push({ kind: "audio", file: b }); refresh(); });
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
    if (act === "addplace") return addPlace();
    if (act === "quick" || act === "note") return openNote(act === "quick");
    if (act === "editshots") return editShots();
    if (act === "addday") { const p = curProj(), last = p.days[p.days.length - 1], dt = new Date((last ? last.date : todayISO()) + "T00:00"); dt.setDate(dt.getDate() + (last ? 1 : 0)); p.days.push({ id: uid("d"), date: dt.getFullYear() + "-" + pad(dt.getMonth() + 1) + "-" + pad(dt.getDate()), title: "", places: [] }); touch(view.pid); return go(`p/${view.pid}/${p.days.length - 1}`); }
    if (act === "editday") { const d = curDay(); return form("這一天", [{ k: "title", l: "標題", v: d.title, ph: "例如：家庭聚餐" }, { k: "date", l: "日期", type: "date", v: d.date }], v => { d.title = v.title; d.date = v.date || d.date; touch(view.pid); render(); }); }
    if (act === "laugh") { const pl = curPlace(); pl.laughs.push({ ts: Date.now(), at: nowHM() }); touch(view.pid); render(); return toast("⭐ 已標記 " + nowHM()); }
    if (act === "tocut") { const p = curProj(), pl = curPlace(); const txt = `幫我剪：${p.title}／D${view.day + 1}／${pl.name}`; try { await navigator.clipboard.writeText(txt); toast("已複製，貼到 Claude"); } catch (er) { prompt("複製這句話：", txt); } return; }
    if (act === "export") { const b = new Blob([JSON.stringify(DATA, null, 1)], { type: "application/json" }); const u = URL.createObjectURL(b); const x = document.createElement("a"); x.href = u; x.download = "wondermedia-" + todayISO() + ".json"; x.click(); setTimeout(() => URL.revokeObjectURL(u), 3000); return; }
    if (act === "projmenu") {
      const p = curProj(); const sc = sheet(`<h2>${esc(p.title)}</h2><div class="menu"><button data-m="edit">編輯名稱與分類</button><button data-m="del" class="danger">刪除這個企劃</button></div>`);
      sc.onclick = ev => { const m = ev.target.closest("[data-m]"); if (!m) return; if (m.dataset.m === "edit") { sc._close(); form("企劃", [{ k: "title", l: "名稱", v: p.title }, { k: "tag", l: "分類", opts: TAGS.map(x => [x, x]), v: p.tag }], v => { p.title = v.title || p.title; p.tag = v.tag; touch(view.pid); render(); }); } if (m.dataset.m === "del") { if (!m.dataset.c) { m.dataset.c = 1; m.textContent = "再按一次確定刪除（OneDrive 的影片會保留）"; return; } delete DATA.projects[view.pid]; DATA.deleted["p/" + view.pid] = Date.now(); DIRTY = true; writeCache(); scheduleSync(); sc._close(); go("home"); } };
      return;
    }
    if (act === "placemenu") {
      const pl = curPlace(); const sc = sheet(`<h2>${esc(pl.name)}</h2><div class="menu"><button data-m="edit">改名稱、時間、積木</button><button data-m="world">移到旅遊手冊 World</button><button data-m="del" class="danger">刪除這個地點</button></div>`);
      sc.onclick = ev => { const m = ev.target.closest("[data-m]"); if (!m) return;
        if (m.dataset.m === "world") { toast("下一版會做：選哪一趟、哪一天、哪個時間點"); return; }
        if (m.dataset.m === "edit") { sc._close(); form("地點", [{ k: "name", l: "名稱", v: pl.name }, { k: "time", l: "時間", type: "time", v: pl.time }, { k: "type", l: "場景積木", opts: typeOpts(), v: pl.type }], v => { pl.name = v.name || pl.name; pl.time = v.time; if (v.type !== pl.type) { const had = pl.shots.some(s => s.clips.length); pl.type = v.type; if (!had) pl.shots = newPlace(pl.name, v.type).shots; } touch(view.pid); render(); }); }
        if (m.dataset.m === "del") { if (!m.dataset.c) { m.dataset.c = 1; m.textContent = "再按一次確定刪除"; return; } const d = curDay(); d.places = d.places.filter(x => x.id !== pl.id); touch(view.pid); sc._close(); go(`p/${view.pid}/${view.day}`); } };
      return;
    }
  }
  const rb = t.closest("[data-rec]"); if (rb) return openShotRecorder(rb.dataset.rec);
  const cb = t.closest("[data-cam]"); if (cb) return openCamera(cb.dataset.cam);
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
  if (t.dataset.done) { const s = curPlace().shots.find(x => x.id === t.dataset.done); s.done = t.checked; touch(view.pid); render(); return; }
  if (t.dataset.upload) {
    const p = curProj(), pl = curPlace(), i = pl.shots.findIndex(x => x.id === t.dataset.upload), s = pl.shots[i];
    if (!t.files || !t.files.length) return;
    try { let k = 0; for (const f of t.files) { k++; const path = `${safeName(p.title)}/D${view.day + 1}_${safeName(pl.name)}_${pad(i + 1)}_${safeName(s.n)}_${stamp()}${t.files.length > 1 ? "-" + k : ""}.${extOf(f, f.type)}`; s.clips.push(await addClip(view.pid, f, path, /image/.test(f.type) ? "photo" : "video")); }
    } catch (er) { toast("加不進去：" + (er && er.message || "請從主畫面的 WonderMedia 開啟")); return; }
    s.done = true; touch(view.pid); render(); toast(signedIn() ? "已加入，上傳中" : "已存在手機，登入 OneDrive 後上傳"); uploadPending(); return;
  }
  if (t.dataset.f && t.tagName === "INPUT") { curPlace().info[t.dataset.f] = t.value.trim(); touch(view.pid); }
});

/* ---------- 啟動 ---------- */
(async function boot() {
  await handleRedirect();
  const c = ls.get(CACHE_KEY, null);
  if (c && c.data) { DATA = normalize(c.data); ETAG = c.eTag; DIRTY = c.dirty; } else { DATA = seedData(); DIRTY = true; writeCache(); }
  parseHash(); render(); sync();
})();
