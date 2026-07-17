/* Meridian AI — the assistant chat window (bridges to ai.js engine) */
(function () {
  const { esc } = OS.util;

  OS.registerApp({
    id: "assistant", name: "Meridian AI", icon: "✦", width: 400, height: 560,
    render(win) {
      win.aiContext = "Meridian Intelligence";
      win.body.innerHTML = `
        <div class="main" style="background:linear-gradient(180deg,var(--panel),transparent)">
          <div class="toolbar">
            <span style="font-weight:600">✦ Meridian Intelligence</span>
            <span class="sp"></span>
            <select id="asstMode" class="tbtn" title="Engine">
              <option value="demo">Demo</option>
              <option value="live">Live AI</option>
            </select>
          </div>
          <div class="scroll" id="asstFeed" style="padding:14px;display:flex;flex-direction:column;gap:10px"></div>
          <div style="display:flex;gap:8px;padding:10px;border-top:1px solid var(--stroke)">
            <input id="asstInput" placeholder="Ask Meridian to do anything…" style="flex:1;height:38px;border-radius:12px;border:1px solid var(--stroke2);background:var(--panel2);padding:0 14px;outline:none"/>
            <button id="asstSend" class="tbtn primary" style="height:38px;padding:0 16px">Ask</button>
          </div>
        </div>`;
      const feed = win.body.querySelector("#asstFeed");
      const input = win.body.querySelector("#asstInput");
      const mode = win.body.querySelector("#asstMode");
      mode.value = OS.ai.getMode();
      mode.addEventListener("change", () => OS.ai.setMode(mode.value));

      function bubble(b) {
        if (b.who === "chips") {
          const row = document.createElement("div");
          row.style.cssText = "display:flex;flex-wrap:wrap;gap:7px;margin:2px 0 4px";
          (b.chips || []).forEach(c => {
            const chip = document.createElement("button");
            chip.className = "tbtn"; chip.textContent = c;
            chip.style.cssText = "font-size:12px;color:var(--accent);border-color:color-mix(in srgb,var(--accent) 40%,transparent)";
            chip.addEventListener("click", () => OS.ai.run(c));
            row.appendChild(chip);
          });
          feed.appendChild(row); feed.scrollTop = 9e9; return;
        }
        const wrap = document.createElement("div");
        wrap.style.cssText = "display:flex;gap:9px;align-items:flex-start;font-size:13px;line-height:1.5";
        if (b.who === "alert") wrap.style.cssText += ";background:color-mix(in srgb,var(--danger) 12%,transparent);border:1px solid color-mix(in srgb,var(--danger) 40%,transparent);border-radius:12px;padding:8px 10px";
        wrap.innerHTML = `<div style="width:22px;text-align:center;font-size:15px;flex-shrink:0">${b.icon || "✦"}</div>
          <div style="min-width:0"><div>${b.html || ""}</div>${b.sub ? `<div class="mono" style="color:var(--muted);font-size:11px;margin-top:3px;white-space:pre-wrap">${esc(b.sub)}</div>` : ""}</div>`;
        feed.appendChild(wrap); feed.scrollTop = 9e9;
      }

      OS.ai._sink = bubble;
      OS.ai._prefill = (t) => { input.value = t; input.focus(); };
      OS.ai._setTyping = (on) => {
        let el = feed.querySelector("#typing");
        if (on && !el) bubble({ who: "act", icon: "✦", html: `<span id="typing" style="color:var(--muted)">thinking…</span>` });
        else if (!on && el) el.closest("div[style]") && el.closest("div").parentElement.remove();
      };

      const send = () => { const v = input.value.trim(); if (v) { input.value = ""; OS.ai.run(v); } };
      win.body.querySelector("#asstSend").addEventListener("click", send);
      input.addEventListener("keydown", (e) => { if (e.key === "Enter") send(); });

      win._closeHook = () => { if (OS.ai._sink === bubble) { OS.ai._sink = null; OS.ai._prefill = null; OS.ai._setTyping = null; } };
    },
  });
})();
