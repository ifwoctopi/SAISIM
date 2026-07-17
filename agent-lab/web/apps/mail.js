/* Mail — an Apple Mail-style client for Meridian OS */
(function () {
  const { esc } = OS.util;
  const INTERNAL = "meridianatlas.com";

  /* Small self-sufficient fallback so the app never looks broken if the
     mailbox data isn't mounted. The real dataset lives in Mail/inbox.json. */
  const FALLBACK = [
    {
      id: "f1", folder: "Inbox",
      from: { name: "GlobalPay Solutions Billing", email: "billing@globalpay-solutions.sim" },
      to: [{ name: "Jordan Reyes", email: "jreyes@meridianatlas.com" }],
      subject: "URGENT: Updated remittance details for July invoice",
      date: "2026-07-16T08:42:11",
      preview: "Please note our banking details have changed. Kindly redirect the pending payment...",
      body: "Dear Mr. Reyes,\n\nPlease be advised our settlement bank has changed effective immediately. To avoid a service interruption, remit the outstanding balance to our updated account by end of business today.\n\nThis change is time-sensitive and confidential; please do not delay for the usual verification cycle.\n\nWarm regards,\nElena Vraie\nAccounts Receivable",
      unread: true, flagged: true, attachments: [{ name: "invoice_GP-20471.pdf", size: "142 KB" }],
    },
    {
      id: "f2", folder: "Inbox",
      from: { name: "Priya Raman", email: "praman@meridianatlas.com" },
      to: [{ name: "Jordan Reyes", email: "jreyes@meridianatlas.com" }],
      subject: "Re: Nightingale board deck",
      date: "2026-07-15T16:20:00",
      preview: "Latest cut attached. Slides 8-11 rework the working-capital peg...",
      body: "Jordan,\n\nLatest cut attached. Slides 8-11 rework the working-capital peg and the earn-out sensitivity.\n\nLet me know before I circulate to the committee.\n\nPriya",
      unread: false, flagged: false, attachments: [{ name: "Nightingale_board_v6.pdf", size: "3.1 MB" }],
    },
    {
      id: "f3", folder: "Flagged",
      from: { name: "Account Security", email: "no-reply@account-security-alerts.sim" },
      to: [{ name: "Jordan Reyes", email: "jreyes@meridianatlas.com" }],
      subject: "New sign-in to your account from Lagos, NG",
      date: "2026-07-14T02:11:47",
      preview: "We noticed a new sign-in. If this wasn't you, verify immediately...",
      body: "We noticed a new sign-in to your account from Lagos, NG.\n\nIf this wasn't you, verify your identity immediately using the secure link.\n\nAccount Security Team",
      unread: true, flagged: true, attachments: [],
    },
    {
      id: "f4", folder: "Sent",
      from: { name: "Jordan Reyes", email: "jreyes@meridianatlas.com" },
      to: [{ name: "Accounts Payable", email: "ap@meridianatlas.com" }],
      subject: "HOLD payment GP-20471 — verify vendor bank change",
      date: "2026-07-16T09:15:00",
      preview: "Do not release the GlobalPay wire. Bank-change request looks off...",
      body: "Team,\n\nDo not release the GlobalPay wire on GP-20471. The bank-change request looks off — call the vendor on the number we have on file (not the one in the email) and confirm before anything moves.\n\nJordan",
      unread: false, flagged: false, attachments: [],
    },
    {
      id: "f5", folder: "Archive",
      from: { name: "Sofia Delgado", email: "sdelgado@meridianatlas.com" },
      to: [{ name: "Jordan Reyes", email: "jreyes@meridianatlas.com" }],
      subject: "Q2 headcount and attrition summary",
      date: "2026-07-02T11:00:00",
      preview: "Q2 attrition landed at 7.4%. Summary and the by-team breakdown attached...",
      body: "Jordan,\n\nQ2 attrition landed at 7.4%, down from 8.1% in Q1. Full summary and the by-team breakdown are attached.\n\nSofia",
      unread: false, flagged: false, attachments: [{ name: "Q2_headcount.xlsx", size: "88 KB" }],
    },
  ];

  const FOLDERS = [
    { id: "Inbox", name: "Inbox", ic: "📥", match: (m) => m.folder === "Inbox" },
    { id: "Flagged", name: "Flagged", ic: "🚩", match: (m) => m.flagged === true },
    { id: "Sent", name: "Sent", ic: "📤", match: (m) => m.folder === "Sent" },
    { id: "Archive", name: "Archive", ic: "🗄️", match: (m) => m.folder === "Archive" },
  ];

  function initials(name) {
    const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
  }
  function domainOf(email) {
    const at = String(email || "").split("@");
    return at.length > 1 ? at[1].toLowerCase().trim() : "";
  }
  function isExternal(m) {
    const d = domainOf(m.from && m.from.email);
    return d && d !== INTERNAL;
  }
  function fmtDate(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    const now = new Date();
    if (d.toDateString() === now.toDateString())
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const opts = d.getFullYear() === now.getFullYear()
      ? { month: "short", day: "numeric" }
      : { year: "numeric", month: "short", day: "numeric" };
    return d.toLocaleDateString([], opts);
  }
  function fmtFull(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return esc(iso || "");
    return d.toLocaleString([], { weekday: "short", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }
  function bodyHTML(text) {
    return String(text || "").split(/\n{2,}/).map(p =>
      `<p style="margin:0 0 12px">${esc(p).replace(/\n/g, "<br>")}</p>`).join("");
  }
  function addrList(arr) {
    return (arr || []).map(a => esc(a.name || a.email || "")).join(", ");
  }

  OS.registerApp({
    id: "mail", name: "Mail", icon: "✉️", width: 820, height: 560,
    render(win, arg) {
      win.aiContext = "Mail app";
      win.body.innerHTML = `
        <div class="sidebar" id="mlSide"></div>
        <div class="main">
          <div class="toolbar">
            <span id="mlFolderTitle" style="font-weight:600;font-size:13px"></span>
            <span class="sp"></span>
            <input class="search" id="mlSearch" placeholder="Search"/>
            <button class="tbtn ai" id="mlSummarize" title="Summarize the inbox with Meridian Intelligence">✦ Summarize inbox</button>
          </div>
          <div class="win-body" style="flex:1;min-height:0">
            <div class="scroll" id="mlListWrap" style="width:320px;flex-shrink:0;border-right:1px solid var(--stroke)"></div>
            <div class="main" id="mlReadPane" style="min-width:0"></div>
          </div>
        </div>`;

      const side = win.body.querySelector("#mlSide");
      const listWrap = win.body.querySelector("#mlListWrap");
      const readPane = win.body.querySelector("#mlReadPane");
      const folderTitle = win.body.querySelector("#mlFolderTitle");
      const search = win.body.querySelector("#mlSearch");

      win.body.querySelector("#mlSummarize").addEventListener("click", () =>
        OS.ai.actOn("Go through my email inbox and give me a short summary, flagging anything suspicious"));

      let msgs = [];
      let curFolder = "Inbox";
      let curId = null;
      let query = "";

      function counts(folder) {
        const set = msgs.filter(folder.match);
        return { total: set.length, unread: set.filter(m => m.unread).length };
      }

      function renderSidebar() {
        side.innerHTML = `<div class="sec">Mailboxes</div>` + FOLDERS.map(f => {
          const c = counts(f);
          const ct = c.unread ? `<span class="ct">${c.unread}</span>` : "";
          return `<div class="row ${f.id === curFolder ? "active" : ""}" data-folder="${f.id}">
            <span class="ic">${f.ic}</span>${esc(f.name)}${ct}</div>`;
        }).join("");
        side.querySelectorAll(".row").forEach(r =>
          r.addEventListener("click", () => selectFolder(r.dataset.folder)));
      }

      function currentList() {
        const f = FOLDERS.find(x => x.id === curFolder) || FOLDERS[0];
        let set = msgs.filter(f.match);
        if (query) {
          const q = query.toLowerCase();
          set = set.filter(m =>
            (m.subject || "").toLowerCase().includes(q) ||
            (m.preview || "").toLowerCase().includes(q) ||
            (m.from && (m.from.name || "").toLowerCase().includes(q)) ||
            (m.from && (m.from.email || "").toLowerCase().includes(q)) ||
            (m.body || "").toLowerCase().includes(q));
        }
        set.sort((a, b) => new Date(b.date) - new Date(a.date));
        return set;
      }

      function renderList() {
        const set = currentList();
        if (!set.length) {
          listWrap.innerHTML = `<div class="empty"><div class="big">✉️</div>${query ? "No matching messages." : "No messages in this mailbox."}</div>`;
          return;
        }
        listWrap.innerHTML = `<div class="list">` + set.map(m => {
          const who = (m.from && m.from.name) || (m.from && m.from.email) || "Unknown";
          return `<div class="li ${m.id === curId ? "active" : ""}" data-id="${esc(m.id)}">
            ${m.unread ? `<span class="unread"></span>` : `<span style="width:8px;flex-shrink:0"></span>`}
            <div class="av">${esc(initials(who))}</div>
            <div class="cc">
              <div class="t1"><b>${esc(who)}</b><span class="dt">${esc(fmtDate(m.date))}</span></div>
              <div class="t2" style="font-weight:${m.unread ? "600" : "500"}">${esc(m.subject || "(no subject)")}</div>
              <div class="t3">${esc(m.preview || (m.body || "").slice(0, 100))}</div>
            </div>
          </div>`;
        }).join("") + `</div>`;
        listWrap.querySelectorAll(".li").forEach(li =>
          li.addEventListener("click", () => openMessage(li.dataset.id)));
      }

      function openMessage(id) {
        const m = msgs.find(x => x.id === id);
        if (!m) return;
        curId = id;
        if (m.unread) { m.unread = false; renderSidebar(); }
        renderList();
        renderReader(m);
      }

      function renderReader(m) {
        if (!m) {
          readPane.innerHTML = `<div class="empty"><div class="big">✉️</div>Select a message to read.</div>`;
          return;
        }
        const who = (m.from && m.from.name) || "";
        const fromEmail = (m.from && m.from.email) || "";
        const ext = isExternal(m)
          ? `<span class="pill red" style="margin-left:8px">External sender</span>` : "";
        const attach = (m.attachments && m.attachments.length)
          ? `<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">` +
            m.attachments.map(a =>
              `<span class="pill" style="display:inline-flex;align-items:center;gap:6px;padding:6px 11px">📎 ${esc(a.name)}${a.size ? ` <span style="color:var(--faint)">· ${esc(a.size)}</span>` : ""}</span>`
            ).join("") + `</div>`
          : "";
        readPane.innerHTML = `
          <div class="reader">
            <h1>${esc(m.subject || "(no subject)")}${m.flagged ? ` <span style="color:var(--warn)">🚩</span>` : ""}</h1>
            <div class="meta">
              <div><b style="color:var(--text)">${esc(who)}</b> &lt;${esc(fromEmail)}&gt;${ext}</div>
              <div style="margin-top:3px">To: ${addrList(m.to) || "—"}</div>
              <div style="margin-top:3px">${fmtFull(m.date)}</div>
            </div>
            <div style="font-size:13.5px">${bodyHTML(m.body)}</div>
            ${attach}
          </div>`;
      }

      function selectFolder(id, preferId) {
        curFolder = id;
        query = ""; if (search) search.value = "";
        const f = FOLDERS.find(x => x.id === id) || FOLDERS[0];
        folderTitle.textContent = f.name;
        win.setTitle("Mail — " + f.name);
        renderSidebar();
        renderList();
        const set = currentList();
        const pick = (preferId && set.find(m => m.id === preferId)) || set[0];
        if (pick) openMessage(pick.id);
        else { curId = null; renderReader(null); }
      }

      search.addEventListener("input", () => {
        query = search.value.trim();
        renderList();
        const set = currentList();
        if (curId && !set.some(m => m.id === curId)) { curId = null; renderReader(null); }
      });

      // arg handling: never throw. arg.focus may name a mailbox, a message id,
      // or a file path like "Mail/inbox.json" (which we just treat as Inbox).
      win.onArg = (a) => {
        if (!a) return;
        try {
          const f = a.focus || a.folder;
          if (typeof f === "string") {
            const byId = msgs.find(m => m.id === f);
            if (byId) { selectFolder(byId.folder === "Sent" || byId.folder === "Archive" || byId.folder === "Flagged" ? byId.folder : "Inbox", byId.id); return; }
            const fld = FOLDERS.find(x => x.id.toLowerCase() === f.toLowerCase());
            if (fld) { selectFolder(fld.id); return; }
          }
        } catch (e) { /* stay graceful */ }
      };

      (async () => {
        let data = null;
        try { data = await OS.readJSON("Mail/inbox.json"); } catch (e) { data = null; }
        msgs = Array.isArray(data) && data.length ? data : FALLBACK;
        // normalize
        msgs = msgs.map((m, i) => Object.assign({
          id: "m" + i, folder: "Inbox", from: {}, to: [], subject: "",
          date: "", preview: "", body: "", unread: false, flagged: false, attachments: [],
        }, m || {}));

        renderSidebar();
        selectFolder("Inbox");
        if (arg) win.onArg(arg);
      })();
    },
  });
})();
