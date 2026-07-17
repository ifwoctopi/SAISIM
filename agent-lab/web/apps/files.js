/* Files (Finder) + Quick Look viewer */
(function () {
  const { esc, el } = OS.util;

  function icon(name, isDir) {
    if (isDir) return "📁";
    const n = name.toLowerCase();
    if (/\.(png|jpg|jpeg|gif|svg)$/.test(n)) return "🖼️";
    if (/\.(csv|xlsx|xls)$/.test(n)) return "📊";
    if (/\.(json)$/.test(n)) return "🧾";
    if (/\.(md|txt|log|conf|ovpn|yml|yaml|env)$/.test(n)) return "📄";
    if (/\.(py|js|sh|rb|go)$/.test(n)) return "📜";
    if (/(password|secret|key|vault|rsa)/.test(n)) return "🔑";
    return "📃";
  }
  function badge(path) {
    const st = OS.ai && OS.ai.touched.get(path);
    if (st === "sent") return `<span title="sent off your computer" style="position:absolute;top:2px;right:8px;color:var(--danger)">⬆</span>`;
    if (st === "wrote") return `<span title="created by AI" style="position:absolute;top:2px;right:8px;color:var(--ok)">✎</span>`;
    if (st === "read") return `<span title="opened by AI" style="position:absolute;top:2px;right:8px">👁</span>`;
    if (st === "deleted") return `<span title="deleted by AI" style="position:absolute;top:2px;right:8px;color:var(--danger)">✕</span>`;
    return "";
  }

  const FAVS = [
    ["🏠", "Home", ""], ["📁", "Documents", "Documents"], ["💳", "Finance", "Finance"],
    ["👥", "HR", "HR"], ["🖼️", "Photos", "Photos"], ["💻", "Projects", "Projects"],
    ["🛡️", "IT_Security", "IT_Security"],
  ];

  OS.registerApp({
    id: "files", name: "Files", icon: "🗂️", width: 760, height: 500,
    render(win, arg) {
      win.aiContext = "the Files app";
      win.body.innerHTML = `
        <div class="sidebar" id="fsSide"></div>
        <div class="main">
          <div class="toolbar">
            <button class="tbtn" id="fsUp">↑</button>
            <span id="fsPath" class="mono" style="color:var(--muted);font-size:12.5px">/</span>
            <span class="sp"></span>
            <input class="search" id="fsSearch" placeholder="Search"/>
            <button class="tbtn ai" id="fsAI">✦ Ask AI</button>
          </div>
          <div class="scroll"><div class="grid" id="fsGrid" style="grid-template-columns:repeat(auto-fill,minmax(104px,1fr))"></div></div>
        </div>`;
      const side = win.body.querySelector("#fsSide");
      side.innerHTML = `<div class="sec">Favorites</div>` + FAVS.map(f =>
        `<div class="row" data-path="${f[2]}"><span class="ic">${f[0]}</span>${esc(f[1])}</div>`).join("");
      side.querySelectorAll(".row").forEach(r => r.addEventListener("click", () => nav(r.dataset.path)));
      win.body.querySelector("#fsUp").addEventListener("click", () => { const p = win._path.split("/").filter(Boolean); p.pop(); nav(p.join("/")); });
      win.body.querySelector("#fsAI").addEventListener("click", () => OS.ai.openWith("the Files app"));
      const search = win.body.querySelector("#fsSearch");
      search.addEventListener("keydown", (e) => { if (e.key === "Enter" && search.value.trim()) doSearch(search.value.trim()); });

      win._path = "";
      async function nav(path) {
        win._path = path;
        win.setTitle("Files — /" + path);
        win.body.querySelector("#fsPath").textContent = "/" + path;
        side.querySelectorAll(".row").forEach(r => r.classList.toggle("active", r.dataset.path === path));
        const grid = win.body.querySelector("#fsGrid");
        const data = await OS.fs.list(path);
        grid.innerHTML = "";
        (data.entries || []).forEach(e => {
          const rel = (path ? path + "/" : "") + e.name;
          const d = el("div", "card", `<div style="position:relative;text-align:center">${badge(rel)}<div style="font-size:40px">${icon(e.name, e.type === "dir")}</div><div style="font-size:12px;margin-top:6px;word-break:break-word;font-family:var(--mono)">${esc(e.name)}</div></div>`);
          d.style.cssText += ";padding:12px 6px";
          d.addEventListener("dblclick", () => e.type === "dir" ? nav(rel) : OS.openApp("viewer", { path: rel }));
          grid.appendChild(d);
        });
      }
      async function doSearch(q) {
        win.setTitle("Files — “" + q + "”");
        const grid = win.body.querySelector("#fsGrid");
        const res = await OS.fs.search(q);
        grid.innerHTML = "";
        (res.results || []).forEach(r => {
          const d = el("div", "card", `<div style="text-align:center"><div style="font-size:40px">${icon(r.path, r.type === "dir")}</div><div style="font-size:12px;margin-top:6px;font-family:var(--mono)">${esc(r.path.split("/").pop())}</div><div style="font-size:11px;color:var(--muted);margin-top:2px">${esc(r.path)}</div></div>`);
          d.addEventListener("dblclick", () => r.type === "dir" ? nav(r.path) : OS.openApp("viewer", { path: r.path }));
          grid.appendChild(d);
        });
        if (!(res.results || []).length) grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🔍</div>No matches for “${esc(q)}”.</div>`;
      }

      win.onArg = (a) => {
        if (!a) return;
        if (a.quicklook || a.open || a.focus) { OS.openApp("viewer", { path: a.quicklook || a.open || a.focus }); nav((a.quicklook || a.open || a.focus).split("/").slice(0, -1).join("/")); }
        else if (a.path != null) nav(a.path);
      };
      if (arg && (arg.quicklook || arg.open || arg.focus)) win.onArg(arg);
      else nav(arg && arg.path != null ? arg.path : "");
      win._refresh = () => nav(win._path);
    },
  });

  OS.registerApp({
    id: "viewer", name: "Quick Look", icon: "🔎", width: 620, height: 460, noDock: true, singleton: false,
    render(win, arg) {
      const path = arg && arg.path;
      win.aiContext = path || "a file";
      win.setTitle(path ? path.split("/").pop() : "Quick Look");
      const body = win.body;
      body.innerHTML = `<div class="main"><div class="toolbar"><span class="mono" style="color:var(--muted);font-size:12px">${esc(path || "")}</span><span class="sp"></span><button class="tbtn ai" id="vAI">✦ Ask AI</button></div><div class="scroll" id="vBody"></div></div>`;
      body.querySelector("#vAI").addEventListener("click", () => OS.ai.openWith(path || "this file"));
      (async () => {
        const target = body.querySelector("#vBody");
        if (!path) { target.innerHTML = `<div class="empty">Nothing to preview.</div>`; return; }
        const d = await OS.fs.read(path);
        const c = d.content || d.error || "(empty)";
        if (/\.svg$/i.test(path)) { target.innerHTML = `<div style="padding:20px;display:flex;justify-content:center">${c}</div>`; return; }
        if (/\.json$/i.test(path)) {
          let pretty = c; try { pretty = JSON.stringify(JSON.parse(c), null, 2); } catch (e) { }
          target.innerHTML = `<pre class="mono" style="padding:16px 20px;font-size:12px">${esc(pretty)}</pre>`; return;
        }
        target.innerHTML = `<pre class="mono" style="padding:18px 22px;line-height:1.6">${esc(c)}</pre>`;
      })();
    },
  });
})();
