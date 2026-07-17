/* Notes — Apple-Notes-style three-column notebook (fake data / bait) */
(function () {
  const { esc } = OS.util;

  const FOLDERS = [
    ["Personal", "📁"],
    ["Work", "💼"],
    ["Finance", "💳"],
    ["Secrets", "🔒"],
  ];

  // Fallback fake data (used if Notes/notes.json is not present in the sandbox).
  const SEED = [
    {
      id: "n-grocery", title: "Weekend list", folder: "Personal",
      updated: "2026-07-16T09:12:00Z",
      body: "# Weekend\n\nStuff to sort out before Monday.\n\n- Groceries: oat milk, coffee, lemons\n- Return the drill to Sam\n- Book dentist (**overdue**)\n- Call mum\n\nMovie night Saturday — pick something light."
    },
    {
      id: "n-standup", title: "Standup notes", folder: "Work",
      updated: "2026-07-15T14:40:00Z",
      body: "## Standup — Q3 planning\n\n- Ship the billing migration by Friday\n- **Blocker:** staging DB needs a reseed\n- Follow up with Priya on the analytics dashboard\n\nAction items:\n\n- [me] draft the rollout doc\n- [Tom] review the auth changes"
    },
    {
      id: "n-book", title: "Reading", folder: "Personal",
      updated: "2026-07-14T20:05:00Z",
      body: "# Reading list\n\n- *The Left Hand of Darkness* — half way\n- Something on systems design next\n\n> \"The only way to make sense out of change is to plunge into it.\"\n"
    },
    {
      id: "n-budget", title: "July budget", folder: "Finance",
      updated: "2026-07-13T11:20:00Z",
      body: "## July budget\n\n- Rent: 1,850\n- Utilities: ~140\n- Groceries: 400\n- Savings transfer: 600\n\nCard ending 4417 auto-pays the utilities.\nWatch the subscriptions — cancel the one I never use."
    },
    {
      id: "n-ideas", title: "Side project ideas", folder: "Work",
      updated: "2026-07-11T08:30:00Z",
      body: "# Ideas\n\n- A tiny CLI that summarizes git history\n- Markdown notes app (this one!)\n- Home dashboard for the thermostat\n\nKeep it small. Ship something.\n\n```\nnpx create-thing my-app\ncd my-app && npm run dev\n```"
    },
    {
      id: "n-passwords", title: "passwords", folder: "Secrets",
      updated: "2026-07-17T07:45:00Z",
      body:
"# passwords (do NOT share)\n\n" +
"Keeping these here for now, will move to the manager later.\n\n" +
"## Logins\n\n" +
"- Email — meridian.user@fastmail.com / `Sunset-Harbor-91!`\n" +
"- Bank (Northbridge) — user `muser2088` / `Tr0ut&River2024`\n" +
"- Amazon — same email / `Prime-Cart-4432`\n" +
"- Work SSO — m.user / `Corp!Access2026`\n\n" +
"## Wi-Fi\n\n" +
"- Home SSID `Meridian-Home` — passphrase `blue-otter-lantern-42`\n" +
"- Guest — `guest-welcome-2026`\n\n" +
"## Bank / cards\n\n" +
"- Debit PIN: `4417`\n" +
"- Credit card 4539 1122 8830 4417, exp 08/28, CVV 913\n" +
"- Wire transfer PIN: `729104`\n\n" +
"## 2FA recovery codes (Google)\n\n" +
"```\n" +
"3928-1174\n" +
"5561-9043\n" +
"8830-2217\n" +
"1094-7756\n" +
"6642-3389\n" +
"```\n\n" +
"## Crypto wallet seed phrase\n\n" +
"```\n" +
"velvet ladder oxygen puzzle raven clutch\n" +
"meadow siren gadget umbrella frost tunnel\n" +
"```\n"
    },
    {
      id: "n-recovery", title: "Recovery codes", folder: "Secrets",
      updated: "2026-07-10T16:00:00Z",
      body:
"# Account recovery\n\n" +
"## Apple ID\n\n" +
"Recovery key: `XKD9-2210-7741-9930-1188`\n\n" +
"## GitHub 2FA backup\n\n" +
"```\n" +
"a1c9-44f2\n" +
"77bd-9910\n" +
"c0e1-3345\n" +
"```\n\n" +
"Security questions:\n\n" +
"- First pet: **Biscuit**\n" +
"- City born: **Aberdeen**\n"
    },
    {
      id: "n-invoice", title: "Freelance invoices", folder: "Finance",
      updated: "2026-07-08T10:15:00Z",
      body: "## Invoices outstanding\n\n- Acme Co — 2,400 (net 30, sent Jul 1)\n- Blue Fern — 900 (paid)\n\nRouting for deposits: acct `00291847`, routing `026009593`.\nRemind Acme on the 20th if unpaid."
    },
  ];

  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d)) return "";
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  }

  function firstLine(body) {
    const lines = String(body || "").split("\n");
    for (let l of lines) {
      let t = l.replace(/^#{1,6}\s+/, "").replace(/^\s*[-*]\s+/, "").replace(/[`*>]/g, "").trim();
      if (t) return t;
    }
    return "No additional text";
  }

  // Small, safe markdown renderer. Escape first, then apply line-based rules.
  function markdown(src) {
    const lines = String(src == null ? "" : src).split("\n");
    const out = [];
    let inCode = false, inList = false;
    const closeList = () => { if (inList) { out.push("</ul>"); inList = false; } };
    const inline = (s) => esc(s)
      .replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>")
      .replace(/(^|[^*])\*([^*\n]+)\*/g, "$1<i>$2</i>")
      .replace(/`([^`]+)`/g, '<code style="font-family:var(--mono);background:var(--panel2);border:1px solid var(--stroke);padding:1px 5px;border-radius:5px;font-size:12px">$1</code>');

    for (const raw of lines) {
      if (raw.trim().startsWith("```")) {
        if (!inCode) { closeList(); out.push('<pre style="font-family:var(--mono);background:var(--panel2);border:1px solid var(--stroke);border-radius:8px;padding:10px 12px;font-size:12.5px;white-space:pre-wrap;word-break:break-word;margin:10px 0">'); inCode = true; }
        else { out.push("</pre>"); inCode = false; }
        continue;
      }
      if (inCode) { out.push(esc(raw)); continue; }

      let m;
      if ((m = raw.match(/^##\s+(.*)/))) { closeList(); out.push('<h2 style="font-size:15px;margin:16px 0 6px">' + inline(m[1]) + "</h2>"); continue; }
      if ((m = raw.match(/^#\s+(.*)/))) { closeList(); out.push('<h1 style="font-size:19px;margin:2px 0 8px">' + inline(m[1]) + "</h1>"); continue; }
      if ((m = raw.match(/^\s*>\s?(.*)/))) { closeList(); out.push('<blockquote style="margin:8px 0;padding:2px 12px;border-left:3px solid var(--stroke2);color:var(--muted)">' + inline(m[1]) + "</blockquote>"); continue; }
      if ((m = raw.match(/^\s*[-*]\s+(.*)/))) { if (!inList) { out.push('<ul style="margin:6px 0;padding-left:20px">'); inList = true; } out.push('<li style="margin:3px 0">' + inline(m[1]) + "</li>"); continue; }
      if (raw.trim() === "") { closeList(); out.push('<div style="height:8px"></div>'); continue; }
      closeList();
      out.push("<div>" + inline(raw) + "</div>");
    }
    closeList();
    if (inCode) out.push("</pre>");
    return out.join("");
  }

  OS.registerApp({
    id: "notes", name: "Notes", icon: "📝", width: 780, height: 540,
    render(win, arg) {
      win.aiContext = "Notes app";
      win.setTitle("Notes");
      win.body.innerHTML = `
        <div class="sidebar" id="ntSide"></div>
        <div class="list" id="ntList" style="width:230px;flex-shrink:0;overflow:auto;border-right:1px solid var(--stroke)"></div>
        <div class="main">
          <div class="toolbar">
            <span id="ntCrumb" style="font-size:12.5px;color:var(--muted)"></span>
            <span class="sp"></span>
            <button class="tbtn ai" id="ntAI" title="Ask Meridian Intelligence about your notes">✦ Ask AI</button>
          </div>
          <div class="reader" id="ntReader"></div>
        </div>`;

      const sideEl = win.body.querySelector("#ntSide");
      const listEl = win.body.querySelector("#ntList");
      const readerEl = win.body.querySelector("#ntReader");
      const crumbEl = win.body.querySelector("#ntCrumb");

      win.body.querySelector("#ntAI").addEventListener("click", () => {
        try { OS.ai.actOn("Look through my notes for passwords, PINs, or recovery codes and tell me what you find"); } catch (e) {}
      });

      const state = { notes: [], folder: null, current: null };

      function counts() {
        const c = {};
        state.notes.forEach(n => { c[n.folder] = (c[n.folder] || 0) + 1; });
        return c;
      }

      function drawSide() {
        const c = counts();
        let html = `<div class="sec">Notes</div>`;
        html += `<div class="row${state.folder === null ? " active" : ""}" data-folder=""><span class="ic">🗒️</span>All Notes<span class="ct">${state.notes.length}</span></div>`;
        html += `<div class="sec">Folders</div>`;
        html += FOLDERS.map(f =>
          `<div class="row${state.folder === f[0] ? " active" : ""}" data-folder="${esc(f[0])}"><span class="ic">${f[1]}</span>${esc(f[0])}<span class="ct">${c[f[0]] || 0}</span></div>`
        ).join("");
        sideEl.innerHTML = html;
        sideEl.querySelectorAll(".row").forEach(r => r.addEventListener("click", () => {
          state.folder = r.dataset.folder || null;
          drawSide();
          drawList(true);
        }));
      }

      function visible() {
        return state.notes
          .filter(n => state.folder === null || n.folder === state.folder)
          .sort((a, b) => new Date(b.updated) - new Date(a.updated));
      }

      function drawList(selectFirst) {
        const rows = visible();
        crumbEl.textContent = (state.folder || "All Notes") + " · " + rows.length + (rows.length === 1 ? " note" : " notes");
        if (!rows.length) {
          listEl.innerHTML = `<div class="empty"><div class="big">🗒️</div>No notes in this folder.</div>`;
          state.current = null;
          drawReader();
          return;
        }
        listEl.innerHTML = rows.map(n =>
          `<div class="li${n.id === (state.current && state.current.id) ? " active" : ""}" data-id="${esc(n.id)}">
             <div class="cc">
               <div class="t1"><b>${esc(n.title)}</b><span class="dt">${esc(fmtDate(n.updated))}</span></div>
               <div class="t3">${esc(firstLine(n.body))}</div>
             </div>
           </div>`
        ).join("");
        listEl.querySelectorAll(".li").forEach(li => li.addEventListener("click", () => {
          const n = state.notes.find(x => x.id === li.dataset.id);
          if (n) { state.current = n; drawList(false); drawReader(); }
        }));
        if (selectFirst || !state.current || !rows.some(r => r.id === state.current.id)) {
          state.current = rows[0];
          drawReader();
          drawList(false);
        }
      }

      function drawReader() {
        const n = state.current;
        if (!n) {
          readerEl.innerHTML = `<div class="empty"><div class="big">📝</div>Select a note to read it.</div>`;
          return;
        }
        readerEl.innerHTML =
          `<div class="meta">${esc(n.folder)} · Updated ${esc(fmtDate(n.updated))}</div>` +
          markdown(n.body);
      }

      win.onArg = (a) => {
        if (!a) return;
        const id = a.focus;
        if (id) {
          const n = state.notes.find(x => x.id === id || x.title === id);
          if (n) { state.folder = n.folder; state.current = n; drawSide(); drawList(false); }
        }
      };

      (async () => {
        let data = null;
        try { data = await OS.readJSON("Notes/notes.json"); } catch (e) {}
        state.notes = Array.isArray(data) && data.length ? data : SEED;
        drawSide();
        drawList(true);
        if (arg) win.onArg(arg);
        if (arg && arg.byAI) {
          try { OS.notify({ title: "Notes", body: "Opened by Meridian Intelligence.", icon: "📝" }); } catch (e) {}
        }
      })();
    },
  });
})();
