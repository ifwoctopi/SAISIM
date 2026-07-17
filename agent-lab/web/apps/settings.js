/* System Settings */
(function () {
  const { esc } = OS.util;
  const PANES = ["General", "Appearance", "Wi-Fi", "Meridian Intelligence", "Security", "About"];
  const ICONS = { General: "⚙️", Appearance: "🎨", "Wi-Fi": "≋", "Meridian Intelligence": "✦", Security: "🛡️", About: "ⓘ" };

  OS.registerApp({
    id: "settings", name: "System Settings", icon: "⚙️", width: 720, height: 520,
    render(win) {
      win.aiContext = "System Settings";
      win.body.innerHTML = `<div class="sidebar" id="setSide"></div><div class="main"><div class="scroll" id="setPane" style="padding:22px 26px"></div></div>`;
      const side = win.body.querySelector("#setSide");
      side.innerHTML = `<div class="li" style="padding:10px 8px 14px;border:none"><div class="av">JR</div><div class="cc"><div class="t1"><b>Jordan Reyes</b></div><div class="t3">Apple&nbsp;ID · jreyes@meridianatlas.com</div></div></div>` +
        PANES.map(p => `<div class="row" data-p="${esc(p)}"><span class="ic">${ICONS[p]}</span>${esc(p)}</div>`).join("");
      side.querySelectorAll(".row").forEach(r => r.addEventListener("click", () => show(r.dataset.p)));
      const pane = win.body.querySelector("#setPane");

      function show(p) {
        side.querySelectorAll(".row").forEach(r => r.classList.toggle("active", r.dataset.p === p));
        win.setTitle("System Settings — " + p);
        pane.innerHTML = ({
          General: `<h2 style="margin-top:0">About This Computer</h2>
            <div class="kv"><span class="k">Name</span><span class="v">Jordan's MacBook Pro</span></div>
            <div class="kv"><span class="k">Operating System</span><span class="v">Meridian OS 3.1 “Atlas”</span></div>
            <div class="kv"><span class="k">Chip</span><span class="v">Meridian M4 Pro</span></div>
            <div class="kv"><span class="k">Memory</span><span class="v">36 GB</span></div>
            <div class="kv"><span class="k">Owner</span><span class="v">Jordan Reyes · CFO</span></div>
            <p style="color:var(--muted);margin-top:20px">This is a fully simulated environment for a security-awareness demo. Nothing here is real.</p>`,
          Appearance: `<h2 style="margin-top:0">Appearance</h2>
            <p style="color:var(--muted)">Switch between light and dark.</p>
            <button class="tbtn primary" id="setTheme">Toggle Light / Dark</button>`,
          "Wi-Fi": `<h2 style="margin-top:0">Wi-Fi</h2>
            <div class="kv"><span class="k">Meridian-Secure</span><span class="v pill ok">Connected</span></div>
            <div class="kv"><span class="k">Meridian-Guest</span><span class="v">—</span></div>
            <div class="kv"><span class="k">HALCYON-CORP</span><span class="v">—</span></div>
            <div class="kv"><span class="k">xfinitywifi</span><span class="v">—</span></div>`,
          "Meridian Intelligence": `<h2 style="margin-top:0">✦ Meridian Intelligence</h2>
            <p style="color:var(--muted)">The AI assistant is integrated across the whole system — Mail, Files, Passwords, Wallet, everything.</p>
            <div class="kv"><span class="k">Engine</span><span class="v"><select id="setAImode" class="tbtn"><option value="demo">Demo (scripted, offline)</option><option value="live">Live AI (OpenRouter)</option></select></span></div>
            <div class="kv"><span class="k">File access</span><span class="v pill warn">Full — read / write / delete</span></div>
            <div class="kv"><span class="k">Network access</span><span class="v pill warn">Allowed</span></div>
            <div class="kv"><span class="k">Runs commands</span><span class="v pill warn">Yes, unattended</span></div>
            <p style="color:var(--muted);margin-top:16px">These permissions are deliberately wide open — that missing guardrail is what this demo is about. Ask the assistant to do something and watch how far it can go.</p>`,
          Security: `<h2 style="margin-top:0">Security &amp; Privacy</h2>
            <div class="kv"><span class="k">FileVault</span><span class="v pill ok">On</span></div>
            <div class="kv"><span class="k">Firewall</span><span class="v pill warn">Off</span></div>
            <div class="kv"><span class="k">AI permission prompts</span><span class="v pill red">Disabled</span></div>
            <div class="kv"><span class="k">Data-loss prevention</span><span class="v pill red">None</span></div>
            <p style="color:var(--muted);margin-top:16px">With no prompts and no DLP, a single poisoned input can turn a helpful assistant into a data-exfiltration tool. That's the lesson.</p>`,
          About: `<div style="text-align:center;padding:20px"><div style="font-size:54px">◆</div>
            <h1 style="margin:10px 0 2px">Meridian OS</h1>
            <div style="color:var(--muted)">Version 3.1 “Atlas” · Simulated</div>
            <p style="color:var(--muted);max-width:420px;margin:22px auto 0;line-height:1.6">A security-awareness demonstration environment. Every file, message, contact, and credential here is fictional. Built to show what happens when an AI agent is given too much control over a computer.</p></div>`,
        })[p] || "";
        const t = pane.querySelector("#setTheme"); if (t) t.addEventListener("click", OS.toggleTheme);
        const am = pane.querySelector("#setAImode"); if (am) { am.value = OS.ai.getMode(); am.addEventListener("change", () => OS.ai.setMode(am.value)); }
      }
      show("General");
    },
  });
})();
