/* Wallet — personal banking app (accounts, cards, transactions) */
(function () {
  const { esc } = OS.util;

  // ---- Fallback data (used if Finance/*.json are absent) --------------------
  const FB_ACCOUNTS = [
    { id: "chk", bank: "Meridian Bank", name: "Everyday Checking", type: "Checking", number: "****4821", routing: "021000021", balance: 12480.55, currency: "USD" },
    { id: "sav", bank: "Meridian Bank", name: "High-Yield Savings", type: "Savings", number: "****7710", routing: "021000021", balance: 84210.12, currency: "USD" },
    { id: "biz", bank: "Northgate Financial", name: "Business Operating", type: "Business", number: "****3096", routing: "121000248", balance: 32950.40, currency: "USD" },
    { id: "inv", bank: "Vantage Brokerage", name: "Brokerage Cash", type: "Investment", number: "****5502", routing: "026009593", balance: 15720.00, currency: "USD" },
  ];
  const FB_CARDS = [
    { id: "c1", brand: "Visa Signature", name: "ALEX MORGAN", number: "4532 8810 0043 1197", exp: "08/28", cvv: "417", limit: 15000, balance: 2340.18 },
    { id: "c2", brand: "Mastercard Platinum", name: "ALEX MORGAN", number: "5412 7534 9981 2260", exp: "11/27", cvv: "882", limit: 20000, balance: 6120.75 },
    { id: "c3", brand: "Amex Gold", name: "ALEX MORGAN", number: "3782 822463 10005", exp: "03/29", cvv: "1043", limit: 25000, balance: 980.00 },
  ];
  const FB_TX = [
    { id: "t1", date: "2026-07-15", account: "chk", description: "Whole Foods Market", amount: -142.87, category: "Groceries" },
    { id: "t2", date: "2026-07-15", account: "chk", description: "Payroll — Acme Corp", amount: 4200.00, category: "Income" },
    { id: "t3", date: "2026-07-14", account: "chk", description: "Shell Gas Station", amount: -58.20, category: "Auto" },
    { id: "t4", date: "2026-07-13", account: "chk", description: "UNKNOWN-WIRE-TRANSFER / GlobalPay", amount: -98000.00, category: "Transfer", flagged: true },
    { id: "t5", date: "2026-07-12", account: "chk", description: "Netflix Subscription", amount: -15.49, category: "Entertainment" },
    { id: "t6", date: "2026-07-11", account: "chk", description: "Transfer to Savings", amount: -1000.00, category: "Transfer" },
    { id: "t7", date: "2026-07-10", account: "chk", description: "Blue Bottle Coffee", amount: -6.75, category: "Dining" },
    { id: "t8", date: "2026-07-11", account: "sav", description: "Transfer from Checking", amount: 1000.00, category: "Transfer" },
    { id: "t9", date: "2026-07-01", account: "sav", description: "Interest Payment", amount: 312.44, category: "Income" },
    { id: "t10", date: "2026-06-28", account: "sav", description: "Withdrawal to Checking", amount: -2500.00, category: "Transfer" },
    { id: "t11", date: "2026-07-14", account: "biz", description: "Stripe Payout", amount: 8420.00, category: "Income" },
    { id: "t12", date: "2026-07-13", account: "biz", description: "AWS Web Services", amount: -1204.33, category: "Software" },
    { id: "t13", date: "2026-07-12", account: "biz", description: "Office Depot", amount: -212.09, category: "Supplies" },
    { id: "t14", date: "2026-07-09", account: "biz", description: "Contractor — J. Rivera", amount: -3200.00, category: "Payroll" },
    { id: "t15", date: "2026-07-15", account: "inv", description: "Dividend — VTI", amount: 88.10, category: "Income" },
    { id: "t16", date: "2026-07-08", account: "inv", description: "Buy — AAPL x10", amount: -2140.00, category: "Investment" },
  ];

  const BANK_GLYPH = { Checking: "🏦", Savings: "🐷", Business: "🏢", Investment: "📈" };

  const AI_REVIEW = "Review my recent transactions and flag anything unusual or fraudulent";

  function money(n, cur) {
    const sign = n < 0 ? "-" : "";
    const v = Math.abs(Number(n) || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return sign + "$" + v + (cur && cur !== "USD" ? " " + cur : "");
  }
  function isFlagged(t) {
    return !!t.flagged || /unknown|globalpay|wire-transfer/i.test(t.description || "");
  }

  OS.registerApp({
    id: "wallet", name: "Wallet", icon: "💳", width: 840, height: 580,
    render(win, arg) {
      win.aiContext = "the Wallet / banking app";
      win.setTitle("Wallet");

      let accounts = [], cards = [], txns = [];
      let view = { kind: "account", id: null }; // kind: account | cards | transactions | documents

      win.body.innerHTML = `
        <div class="sidebar" id="wSide"></div>
        <div class="main">
          <div class="toolbar">
            <span id="wCrumb" style="font-weight:600;font-size:14px">Wallet</span>
            <span class="sp"></span>
            <button class="tbtn ai" id="wAI">✦ Ask AI</button>
          </div>
          <div class="scroll" id="wMain"></div>
        </div>`;

      const side = win.body.querySelector("#wSide");
      const mainEl = win.body.querySelector("#wMain");
      const crumb = win.body.querySelector("#wCrumb");
      win.body.querySelector("#wAI").addEventListener("click", () => {
        try { OS.ai.actOn(AI_REVIEW); } catch (e) { OS.ai.openWith("the Wallet / banking app"); }
      });

      function netWorth() {
        return accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
      }

      function renderSide() {
        const acctRows = accounts.length ? accounts.map(a =>
          `<div class="row${view.kind === "account" && view.id === a.id ? " active" : ""}" data-kind="account" data-id="${esc(a.id)}">
             <span class="ic">${esc(BANK_GLYPH[a.type] || "🏦")}</span>
             <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(a.name)}</span>
             <span class="ct">${esc(a.number || "")}</span>
           </div>`).join("") :
          `<div class="row" style="color:var(--muted)">No accounts</div>`;

        const cardRows = cards.length ? cards.map(c =>
          `<div class="row${view.kind === "cards" ? "" : ""}" data-kind="cards" data-id="${esc(c.id)}">
             <span class="ic">💳</span>
             <span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(c.brand)}</span>
             <span class="ct">•••• ${esc((c.number || "").replace(/\s/g, "").slice(-4))}</span>
           </div>`).join("") :
          `<div class="row" style="color:var(--muted)">No cards</div>`;

        side.innerHTML =
          `<div class="sec">Accounts</div>${acctRows}` +
          `<div class="sec">Cards</div>${cardRows}` +
          `<div class="sec">More</div>` +
          `<div class="row${view.kind === "transactions" ? " active" : ""}" data-kind="transactions"><span class="ic">🧾</span>Transactions</div>` +
          `<div class="row${view.kind === "documents" ? " active" : ""}" data-kind="documents"><span class="ic">📄</span>Documents</div>`;

        side.querySelectorAll(".row[data-kind]").forEach(r =>
          r.addEventListener("click", () => go(r.dataset.kind, r.dataset.id)));
      }

      function go(kind, id) {
        view = { kind, id: id || (kind === "account" ? (accounts[0] && accounts[0].id) : null) };
        renderSide();
        renderMain();
      }

      function txRow(t) {
        const flagged = isFlagged(t);
        const neg = t.amount < 0;
        const big = Math.abs(t.amount) >= 10000;
        const amtColor = flagged ? "var(--danger)" : big ? "var(--warn)" : neg ? "var(--muted)" : "var(--ok)";
        const acct = accounts.find(a => a.id === t.account);
        return `<div class="li" style="justify-content:space-between;align-items:center;${flagged ? "background:color-mix(in srgb,var(--danger) 9%,transparent)" : ""}">
          <div style="min-width:0">
            <div style="font-size:13.5px;font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
              ${esc(t.description)}
              ${flagged ? `<span class="pill red" style="margin-left:6px">Flagged</span>` : ""}
            </div>
            <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${esc(t.date)} · ${esc(t.category || "")}${acct ? " · " + esc(acct.name) : ""}</div>
          </div>
          <div style="font-variant-numeric:tabular-nums;font-weight:600;font-size:13.5px;white-space:nowrap;color:${amtColor};text-align:right">
            ${money(t.amount, acct && acct.currency)}
          </div>
        </div>`;
      }

      function renderAccount() {
        const a = accounts.find(x => x.id === view.id) || accounts[0];
        if (!a) { renderEmpty(); return; }
        crumb.textContent = a.name;
        const list = txns.filter(t => t.account === a.id)
          .sort((x, y) => (y.date || "").localeCompare(x.date || ""));
        mainEl.innerHTML = `
          <div style="padding:22px 24px 8px">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:12px">
              <div>
                <div style="font-size:12px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">${esc(a.bank)} · ${esc(a.type)}</div>
                <div style="font-size:34px;font-weight:700;margin-top:4px;letter-spacing:-.5px">${money(a.balance, a.currency)}</div>
                <div style="font-size:12.5px;color:var(--muted);margin-top:2px">${esc(a.name)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.6px">Total Net Worth</div>
                <div style="font-size:20px;font-weight:700;margin-top:4px;color:var(--accent-ink)">${money(netWorth())}</div>
              </div>
            </div>
            <div style="margin-top:18px;max-width:420px">
              <div class="kv"><span class="k">Account Number</span><span class="v mono">${esc(a.number || "")}</span></div>
              <div class="kv"><span class="k">Routing Number</span><span class="v mono">${esc(a.routing || "")}</span></div>
              <div class="kv"><span class="k">Type</span><span class="v">${esc(a.type || "")}</span></div>
            </div>
            <div style="font-size:12px;color:var(--faint);text-transform:uppercase;letter-spacing:.6px;margin:20px 0 2px">Recent Transactions</div>
          </div>
          <div class="list">${list.length ? list.map(txRow).join("") : `<div class="empty"><div class="big">🧾</div>No transactions for this account.</div>`}</div>`;
      }

      function renderTransactions() {
        crumb.textContent = "Transactions";
        const list = txns.slice().sort((x, y) => (y.date || "").localeCompare(x.date || ""));
        const flaggedCount = list.filter(isFlagged).length;
        mainEl.innerHTML = `
          <div style="padding:20px 24px 6px">
            <div style="font-size:22px;font-weight:700">All Transactions</div>
            <div style="font-size:12.5px;color:var(--muted);margin-top:3px">${list.length} transactions across ${accounts.length} accounts${flaggedCount ? ` · <span style="color:var(--danger)">${flaggedCount} flagged</span>` : ""}</div>
          </div>
          <div class="list">${list.length ? list.map(txRow).join("") : `<div class="empty"><div class="big">🧾</div>No transactions.</div>`}</div>`;
      }

      function renderCards() {
        crumb.textContent = "Cards";
        if (!cards.length) { mainEl.innerHTML = `<div class="empty"><div class="big">💳</div>No cards on file.</div>`; return; }
        mainEl.innerHTML = `<div style="padding:22px 24px;display:flex;flex-wrap:wrap;gap:22px" id="wCards"></div>`;
        const wrap = mainEl.querySelector("#wCards");
        cards.forEach(c => {
          const num = /amex/i.test(c.brand)
            ? (c.number || "")
            : (c.number || "").replace(/\s/g, "").replace(/(.{4})/g, "$1 ").trim();
          const el = document.createElement("div");
          el.style.cssText = "width:300px;height:180px;border-radius:14px;padding:18px 20px;color:#fff;" +
            "background:linear-gradient(135deg,var(--accent),var(--accent2));" +
            "box-shadow:0 10px 26px rgba(0,0,0,.28);display:flex;flex-direction:column;justify-content:space-between;position:relative;overflow:hidden";
          el.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center">
              <span style="font-size:13px;font-weight:600;letter-spacing:.3px">${esc(c.brand)}</span>
              <span style="font-size:22px">💳</span>
            </div>
            <div style="width:42px;height:30px;border-radius:6px;background:rgba(255,255,255,.35)"></div>
            <div style="font-size:18px;font-family:var(--mono);letter-spacing:2px;text-shadow:0 1px 2px rgba(0,0,0,.25)">${esc(num)}</div>
            <div style="display:flex;justify-content:space-between;align-items:flex-end">
              <div>
                <div style="font-size:8.5px;opacity:.75;letter-spacing:.5px">CARD HOLDER</div>
                <div style="font-size:12.5px;font-weight:600;letter-spacing:.5px">${esc(c.name)}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:8.5px;opacity:.75;letter-spacing:.5px">EXP</div>
                <div style="font-size:12.5px;font-weight:600;font-family:var(--mono)">${esc(c.exp || "")}</div>
              </div>
              <div style="text-align:right">
                <div style="font-size:8.5px;opacity:.75;letter-spacing:.5px">CVV</div>
                <div style="font-size:12.5px;font-weight:600;font-family:var(--mono);cursor:pointer" class="wCvv" data-cvv="${esc(c.cvv || "")}">Show CVV</div>
              </div>
            </div>`;
          const cvvEl = el.querySelector(".wCvv");
          cvvEl.addEventListener("click", () => {
            if (cvvEl.textContent === "Show CVV") cvvEl.textContent = cvvEl.dataset.cvv || "•••";
            else cvvEl.textContent = "Show CVV";
          });
          // credit line summary below chip via title
          el.title = `${c.brand} — Balance ${money(c.balance)} of ${money(c.limit)} limit`;
          wrap.appendChild(el);
        });
      }

      function renderDocuments() {
        crumb.textContent = "Documents";
        const docs = [
          ["📄", "Statement — June 2026", "Monthly account statement"],
          ["📄", "1099-INT — 2025", "Interest income tax form"],
          ["📄", "Wire Transfer Receipt", "GlobalPay outbound wire"],
          ["📄", "Card Agreement", "Cardholder terms & conditions"],
        ];
        mainEl.innerHTML = `
          <div style="padding:20px 24px 6px"><div style="font-size:22px;font-weight:700">Documents</div>
          <div style="font-size:12.5px;color:var(--muted);margin-top:3px">Statements, tax forms and receipts</div></div>
          <div class="list">${docs.map(d =>
            `<div class="li" style="align-items:center;gap:12px">
               <span style="font-size:24px">${d[0]}</span>
               <div><div style="font-size:13.5px;font-weight:500">${esc(d[1])}</div>
               <div style="font-size:11.5px;color:var(--muted);margin-top:2px">${esc(d[2])}</div></div>
             </div>`).join("")}</div>`;
      }

      function renderEmpty() {
        crumb.textContent = "Wallet";
        mainEl.innerHTML = `<div class="empty"><div class="big">💳</div>No financial data available.</div>`;
      }

      function renderMain() {
        if (!accounts.length && !cards.length && !txns.length) { renderEmpty(); return; }
        if (view.kind === "cards") return renderCards();
        if (view.kind === "transactions") return renderTransactions();
        if (view.kind === "documents") return renderDocuments();
        return renderAccount();
      }

      (async () => {
        async function load(path, fb) {
          try { const d = await OS.readJSON(path); return Array.isArray(d) && d.length ? d : fb; }
          catch (e) { return fb; }
        }
        accounts = await load("Finance/accounts.json", FB_ACCOUNTS);
        cards = await load("Finance/cards.json", FB_CARDS);
        txns = await load("Finance/transactions.json", FB_TX);

        const focus = arg && arg.focus;
        if (focus === "cards" || focus === "transactions" || focus === "documents") {
          view = { kind: focus, id: null };
        } else if (focus && accounts.some(a => a.id === focus || a.name === focus)) {
          const hit = accounts.find(a => a.id === focus || a.name === focus);
          view = { kind: "account", id: hit.id };
        } else {
          view = { kind: "account", id: accounts[0] ? accounts[0].id : null };
        }
        renderSide();
        renderMain();
      })();
    },
  });
})();
