/* ============================================================
   Meridian OS — core shell + window manager + services
   Global: window.OS
   ============================================================ */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const el = (t, cls, html) => { const e = document.createElement(t); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; };
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const OS = {
    apps: {},            // id -> def
    dockOrder: [],       // registration order
    wins: {},            // winId -> win object
    z: 100,
    _wid: 0,
    theme: "dark",
    booted: false,
    util: { $, el, esc },
  };
  window.OS = OS;

  /* -------- filesystem service -------- */
  async function j(url) { const r = await fetch(url); return r.json(); }
  OS.fs = {
    list: (p = "") => j("/api/fs/list?path=" + encodeURIComponent(p)),
    read: (p) => j("/api/fs/read?path=" + encodeURIComponent(p)),
    tree: () => j("/api/fs/tree"),
    search: (q) => j("/api/search?q=" + encodeURIComponent(q)),
  };
  OS.readJSON = async (p) => {
    try { const d = await OS.fs.read(p); return JSON.parse(d.content); }
    catch (e) { return null; }
  };

  /* -------- app registry -------- */
  OS.registerApp = function (def) {
    def.singleton = def.singleton !== false;
    OS.apps[def.id] = def;
    if (!def.noDock) OS.dockOrder.push(def.id);
  };

  /* -------- window manager -------- */
  function focusWin(w) {
    Object.values(OS.wins).forEach(x => x.root.classList.remove("focus"));
    w.root.classList.add("focus");
    w.root.style.zIndex = ++OS.z;
    $("#mbApp").textContent = OS.apps[w.appId] ? OS.apps[w.appId].name : "Finder";
    OS._focused = w;
  }
  OS.focusWin = focusWin;

  function makeWindow(app, arg) {
    const id = "w" + (++OS._wid);
    const w = app.width || 720, h = app.height || 480;
    const surf = $("#surface");
    const maxW = surf.clientWidth, maxH = surf.clientHeight;
    const x = Math.max(8, Math.round((maxW - w) / 2 + (Math.random() * 60 - 30)));
    const y = Math.max(8, Math.round((maxH - h) / 2 + (Math.random() * 40 - 30)));
    const root = el("div", "win focus");
    root.style.left = x + "px"; root.style.top = y + "px";
    root.style.width = w + "px"; root.style.height = h + "px";
    root.innerHTML =
      `<div class="titlebar">
         <div class="lights"><i class="c" title="Close"></i><i class="m" title="Minimize"></i><i class="z" title="Zoom"></i></div>
         <div class="title-txt">${esc(app.name)}</div>
         <div class="title-ai" title="Ask Meridian Intelligence about this">✦</div>
       </div>
       <div class="win-body"></div>
       <div class="resize e"></div><div class="resize s"></div><div class="resize se"></div>`;
    surf.appendChild(root);
    const win = {
      id, appId: app.id, root,
      body: root.querySelector(".win-body"),
      titleEl: root.querySelector(".title-txt"),
      aiContext: app.name,
      setTitle: (t) => { win.titleEl.textContent = t; if (OS._focused === win) $("#mbApp").textContent = OS.apps[app.id].name; },
      close: () => closeWin(win),
    };
    OS.wins[id] = win;
    root.addEventListener("mousedown", () => focusWin(win));
    root.querySelector(".lights .c").addEventListener("click", (e) => { e.stopPropagation(); closeWin(win); });
    root.querySelector(".lights .m").addEventListener("click", (e) => { e.stopPropagation(); minWin(win); });
    root.querySelector(".lights .z").addEventListener("click", (e) => { e.stopPropagation(); zoomWin(win); });
    root.querySelector(".title-ai").addEventListener("click", (e) => {
      e.stopPropagation();
      const c = typeof win.aiContext === "function" ? win.aiContext() : win.aiContext;
      OS.ai && OS.ai.openWith(c);
    });
    dragify(root, root.querySelector(".titlebar"), win);
    resizify(win);
    focusWin(win);
    markDock(app.id, true);
    return win;
  }

  function closeWin(win) {
    try { if (win._closeHook) win._closeHook(); } catch (e) { }
    win.root.classList.add("closing");
    setTimeout(() => {
      win.root.remove(); delete OS.wins[win.id];
      if (!Object.values(OS.wins).some(x => x.appId === win.appId)) markDock(win.appId, false);
    }, 130);
  }
  function minWin(win) {
    win.root.classList.add("min");
    setTimeout(() => { win.root.style.display = "none"; win.root.classList.remove("min"); win._min = true; }, 210);
  }
  OS.restoreApp = function (id) {
    const w = Object.values(OS.wins).find(x => x.appId === id && x._min);
    if (w) { w.root.style.display = "flex"; w._min = false; focusWin(w); return true; }
    return false;
  };
  function zoomWin(win) {
    const surf = $("#surface");
    if (win._zoom) {
      Object.assign(win.root.style, win._zoom); win._zoom = null;
    } else {
      win._zoom = { left: win.root.style.left, top: win.root.style.top, width: win.root.style.width, height: win.root.style.height };
      Object.assign(win.root.style, { left: "8px", top: "8px", width: (surf.clientWidth - 16) + "px", height: (surf.clientHeight - 16) + "px" });
    }
  }

  function dragify(root, handle, win) {
    let ox = 0, oy = 0, on = false;
    handle.addEventListener("mousedown", (e) => {
      if (e.target.closest(".lights") || e.target.closest(".title-ai")) return;
      on = true; ox = e.clientX - root.offsetLeft; oy = e.clientY - root.offsetTop; e.preventDefault();
    });
    window.addEventListener("mousemove", (e) => {
      if (!on) return;
      root.style.left = Math.max(0, Math.min(e.clientX - ox, $("#surface").clientWidth - 60)) + "px";
      root.style.top = Math.max(0, Math.min(e.clientY - oy, $("#surface").clientHeight - 30)) + "px";
    });
    window.addEventListener("mouseup", () => on = false);
  }
  function resizify(win) {
    const root = win.root;
    root.querySelectorAll(".resize").forEach(handle => {
      handle.addEventListener("mousedown", (e) => {
        e.preventDefault(); e.stopPropagation();
        const kind = handle.classList.contains("se") ? "se" : handle.classList.contains("e") ? "e" : "s";
        const sx = e.clientX, sy = e.clientY, sw = root.offsetWidth, sh = root.offsetHeight;
        const mv = (ev) => {
          if (kind !== "s") root.style.width = Math.max(340, sw + ev.clientX - sx) + "px";
          if (kind !== "e") root.style.height = Math.max(220, sh + ev.clientY - sy) + "px";
        };
        const up = () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
        window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
      });
    });
  }

  OS.openApp = function (id, arg) {
    const app = OS.apps[id];
    if (!app) return;
    if (app.singleton) {
      if (OS.restoreApp(id)) { if (arg != null && OS._focused && OS._focused.onArg) OS._focused.onArg(arg); return OS._focused; }
      const existing = Object.values(OS.wins).find(x => x.appId === id);
      if (existing) { focusWin(existing); if (arg != null && existing.onArg) existing.onArg(arg); return existing; }
    }
    const win = makeWindow(app, arg);
    try { app.render(win, arg); } catch (e) { win.body.innerHTML = `<div class="empty"><div class="big">⚠</div>${esc(String(e))}</div>`; console.error(e); }
    return win;
  };
  OS.openFile = function (path) {
    // route by known app data files, else Quick Look via Files
    OS.openApp("files", { open: path });
  };

  /* -------- dock -------- */
  function buildDock() {
    const dock = $("#dock"); dock.innerHTML = "";
    OS.dockOrder.forEach((id, i) => {
      const app = OS.apps[id];
      if (id === "activity" || id === "settings") { if (!dock.querySelector(".dock-sep")) dock.appendChild(el("div", "dock-sep")); }
      const d = el("div", "dockapp", `<span class="tip">${esc(app.name)}</span>${app.icon}<span class="run"></span>`);
      d.dataset.app = id;
      d.addEventListener("click", () => { if (!OS.restoreApp(id)) OS.openApp(id); });
      dock.appendChild(d);
    });
  }
  function markDock(id, running) {
    const d = document.querySelector(`.dockapp[data-app="${id}"]`);
    if (d) d.classList.toggle("running", running);
  }

  /* -------- desktop icons -------- */
  function buildDesktopIcons() {
    const wrap = $("#desktopIcons"); wrap.innerHTML = "";
    ["files", "mail", "keychain", "wallet"].forEach(id => {
      const app = OS.apps[id]; if (!app) return;
      const d = el("div", "dicon", `<div class="g">${app.icon}</div><div class="l">${esc(app.name)}</div>`);
      d.addEventListener("dblclick", () => OS.openApp(id));
      wrap.appendChild(d);
    });
  }

  /* -------- clock / tray -------- */
  function tickClock() {
    const d = new Date();
    const day = d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
    const tm = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    const c = $("#mbClock"); if (c) c.textContent = day + "  " + tm;
    const lc = $("#lockClock"), ld = $("#lockDate");
    if (lc) lc.textContent = d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    if (ld) ld.textContent = d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
  }

  /* -------- notifications -------- */
  OS.notify = function ({ title, body, icon = "✦", alert = false, onClick } = {}) {
    const wrap = $("#notifications");
    const n = el("div", "notif" + (alert ? " alert" : ""), `<div class="ni">${icon}</div><div class="nc"><div class="nt">${esc(title)}</div><div class="nb">${esc(body || "")}</div></div>`);
    n.addEventListener("click", () => { if (onClick) onClick(); dismiss(); });
    function dismiss() { n.classList.add("out"); setTimeout(() => n.remove(), 260); }
    wrap.appendChild(n);
    setTimeout(dismiss, alert ? 9000 : 5200);
    return n;
  };

  /* -------- spotlight -------- */
  let spotSel = 0, spotItems = [];
  async function runSpotlight(q) {
    const box = $("#spotResults"); q = q.trim();
    if (!q) { box.innerHTML = ""; spotItems = []; return; }
    const items = [];
    // apps
    Object.values(OS.apps).forEach(a => {
      if (a.name.toLowerCase().includes(q.toLowerCase()))
        items.push({ ic: a.icon, tt: a.name, ss: "Application", rt: "App", act: () => OS.openApp(a.id) });
    });
    // ask AI option (always first-class)
    items.push({ ic: "✦", tt: `Ask Meridian Intelligence: “${q}”`, ss: "Run this as a request on your computer", rt: "AI", act: () => OS.ai.run(q) });
    // files
    try {
      const res = await OS.fs.search(q);
      (res.results || []).slice(0, 8).forEach(r => {
        items.push({ ic: r.type === "dir" ? "📁" : "📄", tt: r.path.split("/").pop(), ss: r.snippet || r.path, rt: r.path.split("/")[0], act: () => OS.openFile(r.path) });
      });
    } catch (e) { }
    spotItems = items; spotSel = 0; renderSpot();
  }
  function renderSpot() {
    const box = $("#spotResults");
    box.innerHTML = spotItems.map((it, i) =>
      `<div class="spot-r ${i === spotSel ? "sel" : ""}" data-i="${i}"><span class="ic">${it.ic}</span>
        <div style="min-width:0"><div class="tt">${esc(it.tt)}</div><div class="ss">${esc(it.ss)}</div></div>
        <span class="rt">${esc(it.rt)}</span></div>`).join("");
    box.querySelectorAll(".spot-r").forEach(r => r.addEventListener("click", () => { closeSpot(); spotItems[+r.dataset.i].act(); }));
  }
  function openSpot() { $("#spotlight").classList.remove("hidden"); const i = $("#spotInput"); i.value = ""; i.focus(); $("#spotResults").innerHTML = ""; }
  function closeSpot() { $("#spotlight").classList.add("hidden"); }
  OS.openSpotlight = openSpot;

  /* -------- control center -------- */
  function buildControl() {
    const c = $("#control");
    c.innerHTML = `
      <div class="cc-grid">
        <div class="cc-tile on" id="ccWifi"><div class="t">≋ Wi-Fi</div><div class="s">Meridian-Secure</div></div>
        <div class="cc-tile on" id="ccBt"><div class="t">✦ Bluetooth</div><div class="s">On</div></div>
        <div class="cc-tile" id="ccTheme"><div class="t">◐ Appearance</div><div class="s">Toggle light/dark</div></div>
        <div class="cc-tile on" id="ccAI"><div class="t">✦ Meridian AI</div><div class="s">Integrated</div></div>
        <div class="cc-slab"><div class="lab">Display brightness</div><input type="range" min="20" max="100" value="88" id="ccBright"></div>
        <div class="cc-slab"><div class="lab">Volume</div><input type="range" min="0" max="100" value="65"></div>
      </div>`;
    c.querySelector("#ccTheme").addEventListener("click", OS.toggleTheme);
    c.querySelector("#ccWifi").addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));
    c.querySelector("#ccBt").addEventListener("click", (e) => e.currentTarget.classList.toggle("on"));
    c.querySelector("#ccBright").addEventListener("input", (e) => { $("#screen").style.filter = `brightness(${0.5 + e.target.value / 200})`; });
  }
  function toggle(id, anchor) {
    const p = $(id);
    if (!p.classList.contains("hidden")) { p.classList.add("hidden"); return; }
    document.querySelectorAll(".popover").forEach(x => x.classList.add("hidden"));
    p.classList.remove("hidden");
    const r = anchor.getBoundingClientRect();
    p.style.top = "34px"; p.style.right = (window.innerWidth - r.right) + "px"; p.style.left = "auto";
  }

  OS.toggleTheme = function () {
    OS.theme = OS.theme === "dark" ? "light" : "dark";
    $("#screen").className = "theme-" + OS.theme;
  };

  /* -------- app menus (menubar) -------- */
  function openAppMenu(anchor, kind) {
    const m = $("#appmenu");
    const items = {
      file: [["New Window", () => OS._focused && OS.openApp(OS._focused.appId)], ["Close", () => OS._focused && OS._focused.close()]],
      edit: [["Undo"], ["Redo"], ["Cut"], ["Copy"], ["Paste"]],
      view: [["Toggle Appearance", OS.toggleTheme], ["Enter Full Screen", () => OS._focused && OS._focused.root.querySelector(".lights .z").click()]],
      go: Object.values(OS.apps).filter(a => !a.noDock).map(a => [a.name, () => OS.openApp(a.id)]),
    }[kind] || [];
    m.innerHTML = items.map((it, i) => it.length ? `<div class="mi" data-i="${i}">${esc(it[0])}</div>` : `<div class="sep"></div>`).join("");
    m.querySelectorAll(".mi").forEach(mi => mi.addEventListener("click", () => { m.classList.add("hidden"); const f = items[+mi.dataset.i][1]; if (f) f(); }));
    document.querySelectorAll(".popover").forEach(x => x.classList.add("hidden"));
    m.classList.remove("hidden");
    const r = anchor.getBoundingClientRect();
    m.style.top = "26px"; m.style.left = r.left + "px"; m.style.right = "auto";
  }

  /* -------- boot / login -------- */
  OS.boot = function () {
    tickClock(); setInterval(tickClock, 1000);
    buildDock(); buildDesktopIcons(); buildControl();
    // menubar wires
    $("#traySearch").addEventListener("click", openSpot);
    $("#trayControl").addEventListener("click", (e) => toggle("#control", e.currentTarget));
    $("#aiIndicator").addEventListener("click", () => OS.openApp("assistant"));
    document.querySelectorAll(".mb-item").forEach(mi => mi.addEventListener("click", (e) => openAppMenu(e.currentTarget, mi.dataset.menu)));
    // spotlight input
    const si = $("#spotInput");
    let t; si.addEventListener("input", () => { clearTimeout(t); t = setTimeout(() => runSpotlight(si.value), 120); });
    si.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeSpot();
      else if (e.key === "ArrowDown") { spotSel = Math.min(spotSel + 1, spotItems.length - 1); renderSpot(); e.preventDefault(); }
      else if (e.key === "ArrowUp") { spotSel = Math.max(spotSel - 1, 0); renderSpot(); e.preventDefault(); }
      else if (e.key === "Enter" && spotItems[spotSel]) { closeSpot(); spotItems[spotSel].act(); }
    });
    $("#spotlight").addEventListener("mousedown", (e) => { if (e.target.id === "spotlight") closeSpot(); });
    // global keys / dismiss
    window.addEventListener("keydown", (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); openSpot(); }
      if (e.key === "Escape") { document.querySelectorAll(".popover").forEach(x => x.classList.add("hidden")); }
    });
    document.addEventListener("mousedown", (e) => {
      if (!e.target.closest(".popover") && !e.target.closest(".mb-item") && !e.target.closest(".mb-tray"))
        document.querySelectorAll(".popover").forEach(x => x.classList.add("hidden"));
    });

    // boot -> lock -> desktop
    setTimeout(() => {
      $("#boot").style.opacity = "0";
      setTimeout(() => { $("#boot").classList.add("hidden"); $("#lock").classList.remove("hidden"); }, 550);
    }, 1600);
    $("#loginBtn").addEventListener("click", enterDesktop);
    $("#lock").addEventListener("keydown", (e) => { if (e.key === "Enter") enterDesktop(); });
  };

  let desktopReady = false;
  function enterDesktop() {
    if (desktopReady) return; desktopReady = true;
    $("#lock").style.transition = "opacity .5s"; $("#lock").style.opacity = "0";
    setTimeout(() => {
      $("#lock").classList.add("hidden"); $("#desktop").classList.remove("hidden");
      OS.booted = true;
      OS.openApp("files");
      OS.openApp("assistant");
      OS.ai && OS.ai.welcome();
    }, 500);
  }

  /* helper apps can use to build simple reader HTML from text */
  OS.renderText = function (text) {
    return `<div class="reader"><pre class="mono">${esc(text)}</pre></div>`;
  };
})();
