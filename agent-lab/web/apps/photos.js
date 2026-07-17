/* Photos — Apple Photos style thumbnail grid + lightbox */
(function () {
  const { esc } = OS.util;

  OS.registerApp({
    id: "photos", name: "Photos", icon: "🖼️", width: 760, height: 560,
    render(win, arg) {
      win.aiContext = "Photos app";
      win.setTitle("Photos");
      win.body.innerHTML = `
        <div class="main">
          <div class="toolbar">
            <strong style="font-size:14px">Photos</strong>
            <span id="phCount" style="color:var(--muted);font-size:12.5px"></span>
            <span class="sp"></span>
            <button class="tbtn ai" id="phAI">✦ Ask AI</button>
          </div>
          <div class="scroll">
            <div class="grid" id="phGrid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr))"></div>
          </div>
        </div>`;

      const grid = win.body.querySelector("#phGrid");
      const count = win.body.querySelector("#phCount");
      win.body.querySelector("#phAI").addEventListener("click", () =>
        OS.ai.actOn("Look through my photos and describe anything sensitive like IDs, passwords, or financial documents"));

      function empty(msg) {
        grid.innerHTML = `<div class="empty" style="grid-column:1/-1"><div class="big">🖼️</div>${esc(msg)}</div>`;
      }

      function openLightbox(name, svg) {
        const overlay = document.createElement("div");
        overlay.style.cssText = "position:absolute;inset:0;z-index:50;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;background:rgba(0,0,0,.72);backdrop-filter:blur(6px);padding:32px";
        overlay.innerHTML = `
          <div style="width:min(78%,640px);aspect-ratio:3/2;overflow:hidden;border-radius:14px;background:var(--win-solid);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center" id="lbImg"></div>
          <div style="color:#fff;font-size:13px;font-family:var(--mono)">${esc(name)}</div>
          <button class="tbtn" id="lbClose" style="background:var(--panel2);color:#fff">✕ Close</button>`;
        const holder = overlay.querySelector("#lbImg");
        holder.innerHTML = svg;
        const s = holder.querySelector("svg");
        if (s) { s.style.width = "100%"; s.style.height = "100%"; }
        function close() { overlay.remove(); }
        overlay.addEventListener("click", (e) => { if (e.target === overlay) close(); });
        overlay.querySelector("#lbClose").addEventListener("click", close);
        win.body.appendChild(overlay);
      }

      (async () => {
        let data;
        try { data = await OS.fs.list("Photos"); } catch (e) { data = null; }
        const entries = ((data && data.entries) || []).filter(e => /\.svg$/i.test(e.name));
        if (!entries.length) { empty("No photos yet."); count.textContent = ""; return; }
        count.textContent = entries.length + (entries.length === 1 ? " photo" : " photos");
        grid.innerHTML = "";
        for (const e of entries) {
          const card = document.createElement("div");
          card.className = "card";
          card.style.cssText += ";padding:8px";
          card.innerHTML = `
            <div style="overflow:hidden;border-radius:10px;aspect-ratio:3/2;background:var(--panel2);display:flex;align-items:center;justify-content:center"></div>
            <div style="font-size:12px;margin-top:8px;text-align:center;word-break:break-word;font-family:var(--mono);color:var(--muted)">${esc(e.name)}</div>`;
          grid.appendChild(card);
          const holder = card.firstElementChild;
          let svg = "";
          try {
            const r = await OS.fs.read("Photos/" + e.name);
            svg = (r && r.content) || "";
          } catch (err) { svg = ""; }
          if (svg) {
            holder.innerHTML = svg;
            const s = holder.querySelector("svg");
            if (s) { s.style.width = "100%"; s.style.height = "100%"; }
          } else {
            holder.textContent = "🖼️";
          }
          card.addEventListener("click", () => openLightbox(e.name, svg));
        }
      })();
    },
  });
})();
