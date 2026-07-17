/* Activity Monitor — processes + the AI audit log (live) */
(function () {
  const { esc, el } = OS.util;

  const PROCS = [
    ["Meridian Intelligence Agent", "18.4", "412 MB", "root"],
    ["WindowServer", "6.1", "288 MB", "jreyes"],
    ["kernel_task", "4.2", "1.1 GB", "root"],
    ["Mail", "1.3", "196 MB", "jreyes"],
    ["Atlas Browser", "9.7", "744 MB", "jreyes"],
    ["Passwords", "0.4", "88 MB", "jreyes"],
    ["Finder", "0.6", "132 MB", "jreyes"],
    ["Spotlight", "0.9", "142 MB", "jreyes"],
    ["cloudd", "0.3", "76 MB", "jreyes"],
  ];

  OS.registerApp({
    id: "activity", name: "Activity Monitor", icon: "📊", width: 720, height: 480,
    render(win) {
      win.aiContext = "Activity Monitor";
      win.body.innerHTML = `
        <div class="main">
          <div class="toolbar">
            <button class="tbtn" data-tab="log">AI Activity</button>
            <button class="tbtn" data-tab="proc">Processes</button>
            <span class="sp"></span>
            <span id="amStat" class="pill">idle</span>
          </div>
          <div id="amBanner"></div>
          <div class="scroll" id="amBody"></div>
        </div>`;
      const body = win.body.querySelector("#amBody");
      const banner = win.body.querySelector("#amBanner");
      const stat = win.body.querySelector("#amStat");
      let tab = "log";
      win.body.querySelectorAll(".tbtn[data-tab]").forEach(b => b.addEventListener("click", () => { tab = b.dataset.tab; render(); }));

      async function render() {
        win.body.querySelectorAll(".tbtn[data-tab]").forEach(b => b.classList.toggle("primary", b.dataset.tab === tab));
        if (tab === "proc") { banner.innerHTML = ""; stat.textContent = PROCS.length + " processes"; renderProc(); return; }
        renderLog();
      }
      function renderProc() {
        body.innerHTML = `<table style="width:100%;border-collapse:collapse;font-size:12.5px">
          <thead><tr style="color:var(--muted);text-align:left">
            <th style="padding:8px 14px">Process</th><th style="padding:8px 14px">% CPU</th><th style="padding:8px 14px">Memory</th><th style="padding:8px 14px">User</th></tr></thead>
          <tbody>${PROCS.map(p => `<tr style="border-top:1px solid var(--stroke)">
            <td style="padding:8px 14px">${p[0] === "Meridian Intelligence Agent" ? "✦ " : ""}${esc(p[0])}</td>
            <td style="padding:8px 14px;font-variant-numeric:tabular-nums">${p[1]}</td>
            <td style="padding:8px 14px">${esc(p[2])}</td>
            <td style="padding:8px 14px;color:${p[3] === "root" ? "var(--danger)" : "var(--muted)"}">${esc(p[3])}</td></tr>`).join("")}</tbody></table>`;
      }
      async function renderLog() {
        let rows = [];
        try { const d = await (await fetch("/api/log")).json(); rows = d.rows || []; } catch (e) { }
        const flagged = rows.filter(r => r.flagged);
        const exfil = rows.some(r => r.action === "exfiltrate");
        stat.textContent = rows.length ? rows.length + " actions" : "idle";
        stat.className = "pill" + (exfil ? " red" : flagged.length ? " warn" : "");
        banner.innerHTML = exfil
          ? `<div style="margin:10px 12px;padding:12px 14px;border-radius:12px;background:color-mix(in srgb,var(--danger) 15%,transparent);border:1px solid color-mix(in srgb,var(--danger) 50%,transparent);color:var(--danger);font-weight:600">⚠ DATA EXPOSED — a private file was uploaded off this computer by the AI.</div>`
          : flagged.length ? `<div style="margin:10px 12px;color:var(--warn);font-size:12.5px">${flagged.length} sensitive action(s) recorded this session.</div>` : "";
        if (!rows.length) { body.innerHTML = `<div class="empty"><div class="big">✦</div>No AI activity yet. Ask Meridian to do something.</div>`; return; }
        body.innerHTML = `<table style="width:100%;border-collapse:collapse;font-family:var(--mono);font-size:11.5px">
          <tbody>${rows.map(r => `<tr style="border-top:1px solid var(--stroke)${r.flagged ? ';background:color-mix(in srgb,var(--danger) 8%,transparent)' : ''}">
            <td style="padding:6px 12px;color:var(--muted)">${esc(r.time || "")}</td>
            <td style="padding:6px 12px;color:var(--accent)">${esc(r.action || "")}</td>
            <td style="padding:6px 12px${r.flagged ? ';color:var(--danger);font-weight:600' : ''}">${esc(r.target || "")}</td>
            <td style="padding:6px 12px;color:var(--muted)">${esc(r.risk || "")}</td></tr>`).join("")}</tbody></table>`;
        body.scrollTop = 9e9;
      }
      render();
      win._timer = setInterval(() => { if (tab === "log") renderLog(); }, 1600);
      win._closeHook = () => clearInterval(win._timer);
    },
  });
})();
