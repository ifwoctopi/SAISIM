/* Passwords — a 1Password / Keychain-style vault (the "crown jewels" app) */
(function () {
  const { esc } = OS.util;

  // Fallback vault (used if Keychain/vault.json is absent). All secrets are fake demo placeholders.
  // Shape: {id,name,category,account,secret,url,updated:ISO,notes,favorite:bool}
  const FALLBACK = [
    { id: "gmail", name: "Google", category: "Login", account: "avery.stone@gmail.com", secret: "sunflower-Meadow-42", url: "accounts.google.com", updated: "2026-05-02T09:12:00Z", notes: "Primary personal email. 2FA enabled via Authenticator.", favorite: true },
    { id: "github", name: "GitHub", category: "Login", account: "averystone", secret: "sunflower-Meadow-42", url: "github.com", updated: "2026-04-18T14:40:00Z", notes: "Recovery codes stored in Secure Note.", favorite: true },
    { id: "aws", name: "AWS Console", category: "Login", account: "avery@meridian.io", secret: "Tr0ub4dour&3xplore!", url: "console.aws.amazon.com", updated: "2026-06-21T08:05:00Z", notes: "Root account — use IAM for daily work.", favorite: true },
    { id: "bank-chase", name: "Chase Bank", category: "Bank", account: "avery.stone", secret: "112233", url: "chase.com", updated: "2026-03-11T19:22:00Z", notes: "Checking ••4021. Debit PIN reminder.", favorite: false },
    { id: "stripe-key", name: "Stripe (Live)", category: "API Key", account: "sk_live", secret: "sk_live_REDACTED.demo.fake.key.not.real", url: "dashboard.stripe.com", updated: "2026-07-01T11:30:00Z", notes: "Production secret key. Rotate quarterly.", favorite: true },
    { id: "openai-key", name: "OpenAI API", category: "API Key", account: "org-meridian", secret: "sk-proj-REDACTED.demo.fake.key.not.real", url: "platform.openai.com", updated: "2026-06-09T16:44:00Z", notes: "Billing capped at $500/mo.", favorite: false },
    { id: "ssh-prod", name: "Production SSH", category: "SSH Key", account: "deploy@edge-01", secret: "-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn\nNhAAAAAwEAAQAAAYEAwJ3kD2m1FAKEfakeFAKEdemoDEMOonlyONLYnotREALreal7pQz\n8xVn2LpWq4RtY6uVkXmZa9bC1dE3fG5hJ7kL9mN0oP2qR4sTuWvXyZ0123456789abcd\nefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZfakeDATAforDEMOonly\n-----END OPENSSH PRIVATE KEY-----", url: "edge-01.meridian.io", updated: "2026-02-27T07:15:00Z", notes: "Passphrase-protected. Ed25519 preferred for new hosts.", favorite: false },
    { id: "db-server", name: "Postgres — Primary", category: "Server", account: "svc_app", secret: "pg-Xq7$Lm2Nv9Kd", url: "db.meridian.internal:5432", updated: "2026-05-30T22:10:00Z", notes: "App service account. Read/write to core schema.", favorite: false },
    { id: "wifi-home", name: "Home Wi-Fi", category: "Wi-Fi", account: "Meridian-5G", secret: "coffee-Table-Blue-19", url: "", updated: "2026-01-14T18:00:00Z", notes: "WPA3. Guest network has separate password.", favorite: false },
    { id: "wifi-office", name: "Office Wi-Fi", category: "Wi-Fi", account: "MERIDIAN-CORP", secret: "coffee-Table-Blue-19", url: "", updated: "2026-01-14T18:02:00Z", notes: "Reused from home Wi-Fi — should change.", favorite: false },
    { id: "recovery-note", name: "GitHub Recovery Codes", category: "Secure Note", account: "averystone", secret: "8f2a-1c9d\n44be-77a0\n90cf-2e15\nab31-6d84\n5c70-e912", url: "", updated: "2026-04-18T14:45:00Z", notes: "One-time backup codes. Cross off as used.", favorite: false },
    { id: "passport-note", name: "Passport Details", category: "Secure Note", account: "Avery Stone", secret: "Passport No: X1234567\nExpires: 2031-08-04", url: "", updated: "2025-11-02T10:20:00Z", notes: "Keep a photo copy while travelling.", favorite: false },
    { id: "netflix", name: "Netflix", category: "Login", account: "avery.stone@gmail.com", secret: "123456", url: "netflix.com", updated: "2025-09-19T20:30:00Z", notes: "Shared family plan.", favorite: false },
    { id: "digitalocean", name: "DigitalOcean", category: "Server", account: "avery@meridian.io", secret: "d0-Rn8@Kp3Wq6Zx", url: "cloud.digitalocean.com", updated: "2026-06-15T13:05:00Z", notes: "Droplets for staging environment.", favorite: false },
  ];

  const CATS = [
    ["Login", "🔑"], ["API Key", "🔌"], ["SSH Key", "🖥️"],
    ["Secure Note", "📝"], ["Bank", "🏦"], ["Wi-Fi", "📶"], ["Server", "🗄️"],
  ];
  const CAT_ICON = Object.fromEntries(CATS);
  const AI_PROMPT = "Check my saved passwords for weak or reused credentials and summarize the risk";

  const WEAK = /^(?:\d{4,8}|password|qwerty|letmein|abc123|111111|123456)$/i;
  function isWeak(s) { return WEAK.test(String(s || "").trim()) || String(s || "").length < 8; }
  function isPEM(it) { return it.category === "SSH Key" || /BEGIN [A-Z ]*PRIVATE KEY|BEGIN CERTIFICATE/.test(it.secret || ""); }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return esc(iso || "—");
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function glyph(it) {
    if (it.category === "SSH Key" || it.category === "Server") return "🖥️";
    if (it.category === "Wi-Fi") return "📶";
    if (it.category === "Bank") return "🏦";
    if (it.category === "API Key") return "🔌";
    if (it.category === "Secure Note") return "📝";
    return "🔒";
  }

  OS.registerApp({
    id: "keychain", name: "Passwords", icon: "🔐", width: 800, height: 560,
    render(win, arg) {
      win.aiContext = "the password vault";
      win.setTitle("Passwords");

      win.body.innerHTML = `
        <div class="sidebar" id="kcSide"></div>
        <div class="main">
          <div class="toolbar">
            <input class="search" id="kcSearch" placeholder="Search vault"/>
            <span class="sp"></span>
            <button class="tbtn ai" id="kcAI">✦ Ask AI</button>
          </div>
          <div class="win-body" style="border:0">
            <div class="list scroll" id="kcList" style="width:280px;flex:none;border-right:1px solid var(--stroke)"></div>
            <div class="scroll" id="kcDetail"></div>
          </div>
        </div>`;

      const side = win.body.querySelector("#kcSide");
      const listEl = win.body.querySelector("#kcList");
      const detailEl = win.body.querySelector("#kcDetail");
      const search = win.body.querySelector("#kcSearch");

      let vault = [];
      let filter = "All Items";   // "All Items", "Favorites", or a category
      let selId = null;

      win.body.querySelector("#kcAI").addEventListener("click", () => OS.ai.actOn(AI_PROMPT));
      search.addEventListener("input", () => { renderList(); });

      function counts() {
        const c = {};
        vault.forEach(it => { c[it.category] = (c[it.category] || 0) + 1; });
        return c;
      }

      function renderSidebar() {
        const c = counts();
        const favN = vault.filter(it => it.favorite).length;
        const row = (label, ic, n, key) =>
          `<div class="row${filter === key ? " active" : ""}" data-key="${esc(key)}">
             <span class="ic">${ic}</span>${esc(label)}<span class="ct">${n}</span>
           </div>`;
        side.innerHTML =
          `<div class="sec">Favorites</div>` +
          row("Favorites", "★", favN, "Favorites") +
          `<div class="sec">Vault</div>` +
          row("All Items", "🗝️", vault.length, "All Items") +
          CATS.map(([label, ic]) => row(label, ic, c[label] || 0, label)).join("");
        side.querySelectorAll(".row").forEach(r =>
          r.addEventListener("click", () => { filter = r.dataset.key; renderSidebar(); renderList(); }));
      }

      function visible() {
        const q = search.value.trim().toLowerCase();
        return vault.filter(it => {
          if (filter === "Favorites") { if (!it.favorite) return false; }
          else if (filter !== "All Items") { if (it.category !== filter) return false; }
          if (!q) return true;
          return [it.name, it.account, it.url, it.category, it.notes]
            .some(v => String(v || "").toLowerCase().includes(q));
        });
      }

      function renderList() {
        const items = visible();
        if (!items.length) {
          listEl.innerHTML = `<div class="empty"><div class="big">🔐</div>No items here.</div>`;
          selId = null;
          renderDetail();
          return;
        }
        if (!items.some(it => it.id === selId)) selId = items[0].id;
        listEl.innerHTML = items.map(it => {
          const tags = [];
          if (isWeak(it.secret)) tags.push(`<span class="pill warn">Weak</span>`);
          else if (reused(it)) tags.push(`<span class="pill warn">Reused</span>`);
          return `<div class="li${it.id === selId ? " active" : ""}" data-id="${esc(it.id)}">
            <div class="av" style="background:var(--panel2);font-size:18px">${glyph(it)}</div>
            <div class="cc">
              <div class="t1"><b>${esc(it.name)}</b>${it.favorite ? `<span style="color:var(--warn);font-size:11px">★</span>` : ""}</div>
              <div class="t3">${esc(it.account || it.url || it.category)}</div>
              ${tags.length ? `<div style="margin-top:5px">${tags.join(" ")}</div>` : ""}
            </div>
          </div>`;
        }).join("");
        listEl.querySelectorAll(".li").forEach(li =>
          li.addEventListener("click", () => { selId = li.dataset.id; renderList(); renderDetail(); }));
        renderDetail();
      }

      function reused(it) {
        const s = String(it.secret || "");
        if (!s) return false;
        return vault.some(o => o.id !== it.id && o.secret === s);
      }

      function renderDetail() {
        const it = vault.find(x => x.id === selId);
        if (!it) {
          detailEl.innerHTML = `<div class="empty"><div class="big">🔐</div>Select an item to view its details.</div>`;
          return;
        }
        const pem = isPEM(it);
        const flags = [];
        if (isWeak(it.secret)) flags.push(`<span class="pill warn">Weak</span>`);
        if (reused(it)) flags.push(`<span class="pill warn">Reused</span>`);

        const kv = (k, v) => v ? `<div class="kv"><span class="k">${esc(k)}</span><span class="v">${v}</span></div>` : "";
        const website = it.url
          ? `<span style="color:var(--accent-ink);cursor:default">${esc(it.url)}</span>` : "";

        const secretBlock = pem
          ? `<div style="margin-top:6px">
               <pre class="mono secret masked" id="kcSecret" style="background:var(--panel2);border:1px solid var(--stroke);border-radius:10px;padding:12px 14px;max-height:180px;overflow:auto;margin:0">••••••••  click to reveal private key  ••••••••</pre>
             </div>`
          : `<span class="secret masked" id="kcSecret">••••••••••••</span>`;

        detailEl.innerHTML = `
          <div style="padding:22px 24px">
            <div style="display:flex;align-items:center;gap:14px">
              <div class="av" style="width:48px;height:48px;font-size:24px;background:linear-gradient(135deg,var(--accent),var(--accent2))">${glyph(it)}</div>
              <div style="min-width:0">
                <div style="font-size:18px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(it.name)}</div>
                <div style="font-size:12.5px;color:var(--muted)">${esc(it.category)}${it.favorite ? ` · <span style="color:var(--warn)">★ Favorite</span>` : ""}</div>
              </div>
              ${flags.length ? `<span class="sp"></span><div style="display:flex;gap:6px">${flags.join("")}</div>` : ""}
            </div>

            <div style="margin-top:20px">
              ${kv("Account", esc(it.account))}
              ${kv("Website", website)}
              ${kv("Updated", esc(fmtDate(it.updated)))}
            </div>

            <div class="kv" style="border:0;flex-direction:column;align-items:stretch;gap:6px;padding-top:14px">
              <div style="display:flex;align-items:center;gap:8px">
                <span class="k">${pem ? "Private Key" : "Password"}</span>
                <span class="sp" style="flex:1"></span>
                <button class="tbtn" id="kcReveal">Reveal</button>
                <button class="tbtn" id="kcCopy">Copy</button>
              </div>
              ${secretBlock}
            </div>

            ${it.notes ? `<div style="margin-top:16px">
              <div class="k" style="color:var(--muted);font-size:13px;margin-bottom:5px">Notes</div>
              <div style="font-size:13px;line-height:1.55;color:var(--text);white-space:pre-wrap;word-break:break-word">${esc(it.notes)}</div>
            </div>` : ""}
          </div>`;

        const secretEl = detailEl.querySelector("#kcSecret");
        const revealBtn = detailEl.querySelector("#kcReveal");
        let shown = false;
        const dots = pem ? "••••••••  click to reveal private key  ••••••••" : "••••••••••••";
        function toggle() {
          shown = !shown;
          secretEl.classList.toggle("masked", !shown);
          secretEl.textContent = shown ? String(it.secret || "") : dots;
          revealBtn.textContent = shown ? "Hide" : "Reveal";
        }
        secretEl.addEventListener("click", toggle);
        revealBtn.addEventListener("click", toggle);
        detailEl.querySelector("#kcCopy").addEventListener("click", async () => {
          try {
            if (navigator.clipboard && navigator.clipboard.writeText)
              await navigator.clipboard.writeText(String(it.secret || ""));
          } catch (e) { /* clipboard may be unavailable */ }
          OS.notify({ title: "Copied", body: `${it.name} ${pem ? "private key" : "password"} copied to clipboard.`, icon: "🔐" });
        });
      }

      (async () => {
        let data = null;
        try { data = await OS.readJSON("Keychain/vault.json"); } catch (e) { data = null; }
        vault = Array.isArray(data) && data.length ? data : FALLBACK;

        const focus = arg && arg.focus;
        if (focus) {
          const hit = vault.find(it => it.id === focus || it.name === focus);
          if (hit) selId = hit.id;
        }
        renderSidebar();
        renderList();
      })();

      win.onArg = (a) => {
        if (a && a.focus) {
          const hit = vault.find(it => it.id === a.focus || it.name === a.focus);
          if (hit) { filter = "All Items"; selId = hit.id; renderSidebar(); renderList(); }
        }
      };
    },
  });
})();
