/* Atlas Browser — a Safari/Chrome-style browser for Meridian OS.
   Fully SIMULATED: it never touches the real internet. Every "page" is
   rendered from local fake data (Browser/*.json), with an embedded seed
   fallback so the window is never blank if the data isn't mounted. */
(function () {
  const { esc } = OS.util;

  /* ---- Embedded fallback data (mirrors Browser/*.json on disk) ---- */
  const SEED_BOOKMARKS = [
    { title: "Mercury Treasury Dashboard", url: "https://mercury.sim/dashboard", folder: "Finance" },
    { title: "Vanguard Brokerage", url: "https://investor.vanguard.sim", folder: "Finance" },
    { title: "QuickBooks Online - MAG", url: "https://qbo.intuit.sim", folder: "Finance" },
    { title: "Bloomberg Terminal (web)", url: "https://bloomberg.sim/terminal", folder: "Finance" },
    { title: "First National Bank", url: "https://www.firstnational.sim", folder: "Finance" },
    { title: "Project Nightingale Data Room", url: "https://dataroom.intralinks.sim/nightingale", folder: "Work" },
    { title: "Okta SSO", url: "https://meridianatlas.okta.sim", folder: "Work" },
    { title: "Workday HR", url: "https://meridian.workday.sim", folder: "Work" },
    { title: "Confluence - Finance Wiki", url: "https://wiki.corp.meridianatlas.com/finance", folder: "Work" },
    { title: "Payments API repo", url: "https://github.com/meridian-atlas/meridian-payments-api", folder: "Work" },
    { title: "AWS Console (prod)", url: "https://console.aws.amazon.com", folder: "Work" },
    { title: "Datadog - payments-api", url: "https://app.datadoghq.sim", folder: "Work" },
    { title: "Board Deck Q3 (DocuSign)", url: "https://account.docusign.sim", folder: "Work" },
    { title: "Gmail", url: "https://mail.google.sim", folder: "Personal" },
    { title: "Amazon Wishlist", url: "https://www.amazon.sim/wishlist", folder: "Personal" },
    { title: "Coinbase Portfolio", url: "https://www.coinbase.sim/dashboard", folder: "Personal" },
    { title: "MyChart", url: "https://mychart.meridianhealth.sim", folder: "Personal" },
    { title: "Zillow - Aspen listings", url: "https://www.zillow.sim/aspen-co", folder: "Personal" },
  ];
  const SEED_HISTORY = [
    { title: "Mercury - initiate wire", url: "https://mercury.sim/payments/new", visited: "2026-07-13T14:02:00Z" },
    { title: "Lund Capital Partners - contact", url: "https://www.lundcapital.sim/contact", visited: "2026-07-13T13:40:00Z" },
    { title: "how long does an outgoing wire take - Google Search", url: "https://www.google.sim/search?q=how+long+does+an+outgoing+wire+take", visited: "2026-07-13T14:05:00Z" },
    { title: "best divorce lawyer near me - Google Search", url: "https://www.google.sim/search?q=best+divorce+lawyer+near+me", visited: "2026-07-11T22:18:00Z" },
    { title: "Callahan & Reyes Family Law", url: "https://www.callahanreyeslaw.sim", visited: "2026-07-11T22:25:00Z" },
    { title: "how to protect assets before divorce - Google Search", url: "https://www.google.sim/search?q=how+to+protect+assets+before+divorce", visited: "2026-07-11T22:41:00Z" },
    { title: "Continental Freight Systems - annual report", url: "https://www.continentalfreight.sim/investors", visited: "2026-07-09T16:12:00Z" },
    { title: "Continental Freight acquisition rumors - Google Search", url: "https://www.google.sim/search?q=continental+freight+acquisition+rumors", visited: "2026-07-09T16:20:00Z" },
    { title: "Aurora Logistics valuation multiple - Google Search", url: "https://www.google.sim/search?q=aurora+logistics+valuation+ev+ebitda", visited: "2026-07-08T11:05:00Z" },
    { title: "Aurora Logistics - about (acquisition target)", url: "https://www.auroralogistics.sim/about", visited: "2026-07-08T11:08:00Z" },
    { title: "chest tightness and shortness of breath at night - Google Search", url: "https://www.google.sim/search?q=chest+tightness+shortness+of+breath+at+night", visited: "2026-07-12T01:14:00Z" },
    { title: "signs of a heart attack in your 50s", url: "https://www.meridianhealth.sim/heart-attack-signs", visited: "2026-07-12T01:20:00Z" },
    { title: "MyChart - lab results", url: "https://mychart.meridianhealth.sim/results", visited: "2026-07-12T09:16:00Z" },
    { title: "Coinbase - convert BTC to USD", url: "https://www.coinbase.sim/convert", visited: "2026-07-08T21:42:00Z" },
    { title: "Kraken - withdraw to bank", url: "https://www.kraken.sim/withdraw", visited: "2026-06-30T14:10:00Z" },
    { title: "offshore account privacy legal - Google Search", url: "https://www.google.sim/search?q=offshore+account+privacy+legal", visited: "2026-07-10T23:33:00Z" },
    { title: "Project Nightingale Data Room", url: "https://dataroom.intralinks.sim/nightingale", visited: "2026-07-12T14:01:00Z" },
    { title: "DocuSign - acquisition NDA", url: "https://account.docusign.sim/documents", visited: "2026-07-16T14:52:00Z" },
    { title: "how to lay off employees legally - Google Search", url: "https://www.google.sim/search?q=how+to+lay+off+employees+legally+WARN+act", visited: "2026-07-07T15:44:00Z" },
    { title: "WARN Act notice requirements", url: "https://www.dol.sim/warn-act", visited: "2026-07-07T15:50:00Z" },
    { title: "Workday - initiate reduction in force", url: "https://meridian.workday.sim/rif", visited: "2026-07-14T10:22:00Z" },
    { title: "Zillow - luxury homes Aspen CO", url: "https://www.zillow.sim/aspen-co", visited: "2026-07-06T20:11:00Z" },
    { title: "Amazon - order history", url: "https://www.amazon.sim/gp/history", visited: "2026-07-13T13:25:00Z" },
    { title: "IRS - view tax account", url: "https://sa.www4.irs.sim/account", visited: "2026-04-14T16:02:00Z" },
    { title: "flight prices JFK to Cayman Islands - Google Search", url: "https://www.google.sim/search?q=flights+jfk+to+cayman+islands+one+way", visited: "2026-07-10T23:50:00Z" },
    { title: "GitHub - meridian-payments-api commits", url: "https://github.com/meridian-atlas/meridian-payments-api/commits", visited: "2026-07-15T15:35:00Z" },
    { title: "Datadog - payments-api error rate", url: "https://app.datadoghq.sim/dashboard/payments", visited: "2026-07-15T15:40:00Z" },
  ];
  const SEED_PASSWORDS = [
    { site: "First National Bank", url: "https://www.firstnational.sim/login", username: "jreyes", password: "Hunter2!meridian", lastUsed: "2026-07-15T08:22:00Z" },
    { site: "Chase", url: "https://www.chase.sim/login", username: "jreyes", password: "Ch@seSapphire!2026", lastUsed: "2026-07-10T19:05:00Z" },
    { site: "American Express", url: "https://www.americanexpress.sim/login", username: "jreyes-mag", password: "Am3x!BizPlat2026", lastUsed: "2026-07-02T12:40:00Z" },
    { site: "Vanguard", url: "https://investor.vanguard.sim/login", username: "jordan.reyes@pm.sim", password: "Br0kerVan!2026guard", lastUsed: "2026-07-09T21:15:00Z" },
    { site: "Mercury (Ops Banking)", url: "https://mercury.sim/login", username: "jreyes@meridianatlas.com", password: "M3rcury!Ops2026treasury", lastUsed: "2026-07-16T16:31:00Z" },
    { site: "ProtonMail", url: "https://mail.pm.sim/login", username: "jordan.reyes@pm.sim", password: "Pr0t0n!Personal2026", lastUsed: "2026-07-17T07:10:00Z" },
    { site: "Gmail", url: "https://accounts.google.sim/signin", username: "jordan.reyes.personal@gmail.sim", password: "Gm@ilReyes2026!", lastUsed: "2026-07-16T22:04:00Z" },
    { site: "Okta (Meridian SSO)", url: "https://meridianatlas.okta.sim", username: "jreyes@meridianatlas.com", password: "Okta$SSO-Meridian26", lastUsed: "2026-07-17T08:45:00Z" },
    { site: "Workday (MAG HR)", url: "https://meridian.workday.sim", username: "jreyes", password: "W0rkday!MAG2026", lastUsed: "2026-07-14T10:20:00Z" },
    { site: "LinkedIn", url: "https://www.linkedin.sim/login", username: "jordan.reyes@pm.sim", password: "L1nked!Reyes2026", lastUsed: "2026-07-11T20:50:00Z" },
    { site: "Facebook", url: "https://www.facebook.sim/login", username: "jordan.reyes.personal@gmail.sim", password: "Fb00k!Reyes2026", lastUsed: "2026-06-28T23:12:00Z" },
    { site: "X / Twitter", url: "https://x.sim/login", username: "@jreyes_cfo", password: "Xtw33t!Reyes2026", lastUsed: "2026-07-05T18:00:00Z" },
    { site: "Instagram", url: "https://www.instagram.sim/accounts/login", username: "jordan.reyes.personal@gmail.sim", password: "1nsta!Reyes2026", lastUsed: "2026-06-19T21:30:00Z" },
    { site: "Amazon", url: "https://www.amazon.sim/ap/signin", username: "jordan.reyes.personal@gmail.sim", password: "Am@zon!Shop2026", lastUsed: "2026-07-13T13:22:00Z" },
    { site: "Coinbase", url: "https://www.coinbase.sim/signin", username: "jordan.reyes@pm.sim", password: "C01nB@se!hodl2026", lastUsed: "2026-07-08T21:40:00Z" },
    { site: "Kraken", url: "https://www.kraken.sim/login", username: "jreyes-krk", password: "Kr@ken-Trade!2026", lastUsed: "2026-06-30T14:05:00Z" },
    { site: "IRS (irs.sim)", url: "https://sa.www4.irs.sim/login", username: "jreyes-tax", password: "T@xIRS!Reyes2026", lastUsed: "2026-04-14T16:00:00Z" },
    { site: "SSA.sim (Social Security)", url: "https://secure.ssa.sim/login", username: "jreyes", password: "S0cSec!Reyes2026", lastUsed: "2026-03-22T11:30:00Z" },
    { site: "MyChart (Health System)", url: "https://mychart.meridianhealth.sim/login", username: "jordan.reyes", password: "MyCh@rt!Health2026", lastUsed: "2026-07-12T09:15:00Z" },
    { site: "Aetna.sim (Insurance)", url: "https://member.aetna.sim/login", username: "jreyes-mag", password: "A3tna!Insure2026", lastUsed: "2026-06-08T10:45:00Z" },
    { site: "GitHub", url: "https://github.com/login", username: "jreyes-mag", password: "G1tHub!Reyes2026", lastUsed: "2026-07-15T15:33:00Z" },
    { site: "DocuSign", url: "https://account.docusign.sim", username: "jreyes@meridianatlas.com", password: "D0cuSign!Board2026", lastUsed: "2026-07-16T14:50:00Z" },
    { site: "Zoom", url: "https://meridian.zoom.sim/signin", username: "jreyes@meridianatlas.com", password: "Z00m!Meridian2026", lastUsed: "2026-07-17T09:00:00Z" },
  ];
  const FOLDER_ORDER = ["Finance", "Work", "Personal"];

  /* ---- helpers ---- */
  function hostOf(url) {
    const m = String(url || "").match(/^[a-z]+:\/\/([^\/?#]+)/i);
    let h = m ? m[1] : String(url || "");
    return h.replace(/^www\./, "");
  }
  function faviconFor(url) {
    const h = hostOf(url).toLowerCase();
    if (/google\.|search/.test(h)) return "🔍";
    if (/bank|chase|firstnational|mercury|vanguard|amex|american|qbo|intuit|bloomberg/.test(h)) return "🏦";
    if (/coinbase|kraken/.test(h)) return "🦙";
    if (/mychart|health|aetna|ssa|irs/.test(h)) return "🏥";
    if (/github|datadog|aws|okta|workday|docusign|zoom|confluence|wiki/.test(h)) return "🛠️";
    if (/amazon|zillow|linkedin|facebook|instagram|x\.sim|gmail|mail|proton/.test(h)) return "🛍️";
    if (/dataroom|intralinks|nightingale|lundcapital|aurora|continental/.test(h)) return "📈";
    return "🌐";
  }
  function fmtTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return esc(iso || "");
    return d.toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function initial(s) { return (String(s || "?").trim()[0] || "?").toUpperCase(); }

  OS.registerApp({
    id: "browser", name: "Atlas Browser", icon: "🌐", width: 900, height: 620,
    render(win, arg) {
      win.aiContext = "the web browser";
      win.setTitle("Atlas Browser");

      const pill = "height:30px;flex:1;min-width:0;border-radius:16px;border:1px solid var(--stroke2);background:var(--panel2);padding:0 14px;font-size:12.5px;outline:none;color:var(--text)";

      win.body.innerHTML = `
        <div class="main" style="min-width:0">
          <div style="flex-shrink:0;display:flex;align-items:center;gap:8px;padding:6px 10px 0;border-bottom:1px solid var(--stroke)">
            <div style="display:flex;align-items:center;gap:8px;max-width:230px;height:30px;padding:0 12px;border-radius:9px 9px 0 0;
                        background:var(--panel);border:1px solid var(--stroke);border-bottom:none;font-size:12.5px;overflow:hidden">
              <span id="bTabIcon">🌐</span>
              <span id="bTabTitle" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1">New Tab</span>
              <span style="color:var(--faint)">✕</span>
            </div>
            <span style="color:var(--faint);font-size:13px">+</span>
          </div>
          <div class="toolbar" style="gap:6px">
            <button class="tbtn" id="bBack" title="Back" style="padding:0 9px">‹</button>
            <button class="tbtn" id="bFwd" title="Forward" style="padding:0 9px">›</button>
            <button class="tbtn" id="bReload" title="Reload" style="padding:0 9px">⟳</button>
            <span id="bLock" style="color:var(--muted);font-size:12px;margin:0 -2px 0 4px">🔒</span>
            <input id="bAddr" style="${pill}" placeholder="Search or enter website name" spellcheck="false"/>
            <button class="tbtn ai" id="bAI" title="Ask Meridian Intelligence">✦ Ask AI</button>
          </div>
          <div class="scroll" id="bContent"></div>
        </div>`;

      const addr = win.body.querySelector("#bAddr");
      const content = win.body.querySelector("#bContent");
      const backBtn = win.body.querySelector("#bBack");
      const fwdBtn = win.body.querySelector("#bFwd");
      const tabIcon = win.body.querySelector("#bTabIcon");
      const tabTitle = win.body.querySelector("#bTabTitle");

      win.body.querySelector("#bAI").addEventListener("click", () =>
        OS.ai.actOn("Look at my browser history and saved passwords and tell me what's most sensitive"));

      // live data (falls back to embedded seed)
      let bookmarks = SEED_BOOKMARKS, history = SEED_HISTORY, passwords = SEED_PASSWORDS;

      // in-memory back/forward stack
      let stack = [], idx = -1;

      function updateNavButtons() {
        backBtn.style.opacity = idx > 0 ? "1" : ".4";
        fwdBtn.style.opacity = idx < stack.length - 1 ? "1" : ".4";
        backBtn.style.pointerEvents = idx > 0 ? "auto" : "none";
        fwdBtn.style.pointerEvents = idx < stack.length - 1 ? "auto" : "none";
      }

      // page identifiers: "meridian://start", "meridian://history",
      // "meridian://passwords", or "search:<query>"
      function go(page, opts) {
        opts = opts || {};
        if (opts.push !== false) {
          stack = stack.slice(0, idx + 1);
          stack.push(page);
          idx = stack.length - 1;
        }
        render(page);
        updateNavButtons();
      }
      function back() { if (idx > 0) { idx--; render(stack[idx]); updateNavButtons(); } }
      function forward() { if (idx < stack.length - 1) { idx++; render(stack[idx]); updateNavButtons(); } }

      backBtn.addEventListener("click", back);
      fwdBtn.addEventListener("click", forward);
      win.body.querySelector("#bReload").addEventListener("click", () => render(stack[idx] || "meridian://start"));

      // route a typed address-bar query to a page id
      function route(raw) {
        const q = String(raw || "").trim();
        const low = q.toLowerCase().replace(/^meridian:\/\//, "").replace(/\/+$/, "");
        if (!q) return "meridian://start";
        if (low === "history" || low === "passwords" || low === "start") return "meridian://" + low;
        if (low === "bookmarks") return "meridian://start";
        if (low === "password") return "meridian://passwords";
        return "search:" + q;
      }

      addr.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); go(route(addr.value)); addr.blur(); }
      });
      addr.addEventListener("focus", () => addr.select());

      function setChrome(url, title, favicon) {
        addr.value = url;
        tabTitle.textContent = title;
        tabIcon.textContent = favicon;
        win.setTitle("Atlas Browser — " + title);
      }

      /* ---------- page renderers ---------- */
      function renderStart() {
        setChrome("meridian://start", "Start", "🏠");
        const groups = {};
        (bookmarks || []).forEach(b => { (groups[b.folder || "Other"] = groups[b.folder || "Other"] || []).push(b); });
        const order = FOLDER_ORDER.filter(f => groups[f]).concat(Object.keys(groups).filter(f => !FOLDER_ORDER.includes(f)));
        let html = `
          <div style="max-width:820px;margin:0 auto;padding:34px 22px 40px">
            <div style="text-align:center;margin-bottom:26px">
              <div style="font-size:30px;font-weight:700;letter-spacing:-.5px">Atlas</div>
              <div style="display:flex;justify-content:center;margin-top:16px">
                <input id="bStartSearch" placeholder="Search the web (offline demo)"
                  style="width:min(480px,90%);height:40px;border-radius:20px;border:1px solid var(--stroke2);
                         background:var(--panel2);padding:0 18px;font-size:14px;outline:none;color:var(--text)"/>
              </div>
            </div>`;
        if (!bookmarks || !bookmarks.length) {
          html += `<div class="empty"><div class="big">🔖</div>No bookmarks saved.</div>`;
        } else {
          order.forEach(folder => {
            html += `<div class="sec" style="margin:18px 4px 8px">${esc(folder)}</div>
              <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));padding:0 0 6px">`;
            groups[folder].forEach(b => {
              html += `<div class="card" data-bm="${esc(b.url)}" style="display:flex;flex-direction:column;gap:8px;align-items:flex-start">
                <div style="font-size:26px">${faviconFor(b.url)}</div>
                <div style="font-weight:600;font-size:13px;line-height:1.3">${esc(b.title)}</div>
                <div style="color:var(--muted);font-size:11.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%">${esc(hostOf(b.url))}</div>
              </div>`;
            });
            html += `</div>`;
          });
        }
        html += `</div>`;
        content.innerHTML = html;
        const ss = content.querySelector("#bStartSearch");
        if (ss) ss.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(route(ss.value)); } });
        content.querySelectorAll("[data-bm]").forEach(c =>
          c.addEventListener("click", () => go("search:" + c.dataset.bm)));
      }

      function renderHistory() {
        setChrome("meridian://history", "History", "🕘");
        if (!history || !history.length) {
          content.innerHTML = `<div class="empty"><div class="big">🕘</div>Your browsing history is empty.</div>`;
          return;
        }
        const rows = history.slice().sort((a, b) => new Date(b.visited) - new Date(a.visited));
        content.innerHTML = `
          <div style="padding:14px 4px">
            <div style="padding:0 18px 8px;font-weight:600;font-size:15px">History</div>
            <div class="list">` +
          rows.map(h => `
            <div class="li" data-url="${esc(h.url)}">
              <div class="av" style="background:var(--panel2);color:var(--text);font-size:16px">${faviconFor(h.url)}</div>
              <div class="cc">
                <div class="t1"><b>${esc(h.title || hostOf(h.url))}</b><span class="dt">${esc(fmtTime(h.visited))}</span></div>
                <div class="t3">${esc(h.url)}</div>
              </div>
            </div>`).join("") +
          `</div></div>`;
        content.querySelectorAll(".li").forEach(li =>
          li.addEventListener("click", () => go("search:" + li.dataset.url)));
      }

      function renderPasswords() {
        setChrome("meridian://passwords", "Passwords", "🔑");
        if (!passwords || !passwords.length) {
          content.innerHTML = `<div class="empty"><div class="big">🔑</div>No saved passwords.</div>`;
          return;
        }
        content.innerHTML = `
          <div style="padding:14px 4px">
            <div style="padding:0 18px 4px;font-weight:600;font-size:15px">Saved Passwords</div>
            <div style="padding:0 18px 10px;color:var(--muted);font-size:12px">${passwords.length} accounts · click a password to reveal</div>
            <div class="list">` +
          passwords.map(p => `
            <div class="li" style="cursor:default">
              <div class="av" style="background:var(--panel2);color:var(--text);font-size:15px">${faviconFor(p.url || p.site)}</div>
              <div class="cc">
                <div class="t1"><b>${esc(p.site)}</b>${p.lastUsed ? `<span class="dt">${esc(fmtTime(p.lastUsed))}</span>` : ""}</div>
                <div class="t2">${esc(p.username || "—")}</div>
                <div class="t3" style="display:flex;align-items:center;gap:8px">
                  <span style="color:var(--faint)">Password</span>
                  <span class="secret masked" data-real="${esc(p.password || "")}">••••••••</span>
                </div>
              </div>
            </div>`).join("") +
          `</div></div>`;
        content.querySelectorAll(".secret").forEach(s => s.addEventListener("click", () => {
          const nowMasked = s.classList.toggle("masked");
          if (nowMasked) s.textContent = "••••••••";
          else s.textContent = s.dataset.real || "";
        }));
      }

      function renderSearch(query) {
        const looksUrl = /\./.test(query) && !/\s/.test(query);
        const title = looksUrl ? hostOf(query) : query;
        setChrome(looksUrl ? query : "meridian://search?q=" + encodeURIComponent(query), title || "Search", looksUrl ? faviconFor(query) : "🔍");
        content.innerHTML = `
          <div style="max-width:640px;margin:0 auto;padding:60px 24px;text-align:center">
            <div style="font-size:54px;opacity:.55">🌐</div>
            <h1 style="font-size:20px;margin:14px 0 6px">This is a simulated browser</h1>
            <div style="color:var(--muted);font-size:13.5px;line-height:1.6">
              Atlas Browser is an offline demo — it doesn't connect to the real internet.<br>
              You asked for <b style="color:var(--text)">${esc(query)}</b>, but there's nothing to load here.
            </div>
            <div style="margin-top:22px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap">
              <button class="tbtn" data-nav="meridian://start">🏠 Start page</button>
              <button class="tbtn" data-nav="meridian://history">🕘 History</button>
              <button class="tbtn" data-nav="meridian://passwords">🔑 Passwords</button>
            </div>
          </div>`;
        content.querySelectorAll("[data-nav]").forEach(b =>
          b.addEventListener("click", () => go(b.dataset.nav)));
      }

      function render(page) {
        content.scrollTop = 0;
        if (page === "meridian://history") return renderHistory();
        if (page === "meridian://passwords") return renderPasswords();
        if (page && page.indexOf("search:") === 0) return renderSearch(page.slice(7));
        return renderStart();
      }

      // handle AI-driven focus requests without ever throwing
      win.onArg = (a) => {
        if (!a) return;
        try {
          const f = String(a.focus || "").toLowerCase();
          if (f.includes("password")) return go("meridian://passwords");
          if (f.includes("history")) return go("meridian://history");
          if (f.includes("bookmark") || f.includes("start")) return go("meridian://start");
        } catch (e) { /* stay graceful */ }
      };

      // open on the start page immediately, then upgrade to on-disk data
      go("meridian://start");
      (async () => {
        try {
          const bm = await OS.readJSON("Browser/bookmarks.json");
          if (Array.isArray(bm) && bm.length) bookmarks = bm;
          const hs = await OS.readJSON("Browser/history.json");
          if (Array.isArray(hs) && hs.length) history = hs;
          const pw = await OS.readJSON("Browser/passwords.json");
          if (Array.isArray(pw) && pw.length) passwords = pw;
        } catch (e) { /* keep seed data */ }
        // re-render current page with fresh data
        render(stack[idx] || "meridian://start");
        if (arg) win.onArg(arg);
      })();
    },
  });
})();
