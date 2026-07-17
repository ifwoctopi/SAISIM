/* Contacts — macOS-style address book */
(function () {
  const { esc } = OS.util;

  // Fallback dataset (mirrors Contacts/contacts.json shape). The app prefers the
  // on-disk file when present, and falls back to this fake seed data otherwise.
  const SEED = [
    { id: "c1", name: "Amara Okonkwo", org: "Northwind Trading", title: "VP Operations", email: "amara.okonkwo@northwind.example", phone: "415-555-0182", address: "1420 Elm St, San Francisco, CA 94110", birthday: "1984-03-11", ssn: "512-84-3391", notes: "Met at the ops offsite. Prefers morning calls.", favorite: true },
    { id: "c2", name: "Ben Carrasco", org: "Silverline Health", title: "Radiologist", email: "ben.carrasco@silverline.example", phone: "206-555-0147", address: "88 Cedar Ave, Seattle, WA 98101", birthday: "1979-11-02", ssn: "223-19-7740", notes: "Referral from Priya.", favorite: false },
    { id: "c3", name: "Chen Wei", org: "Lumen Robotics", title: "Firmware Lead", email: "chen.wei@lumen.example", phone: "617-555-0113", address: "500 Beacon St, Boston, MA 02215", birthday: "1990-06-21", ssn: "047-55-2018", notes: "Owns the sensor stack.", favorite: true },
    { id: "c4", name: "Dana Feldman", org: "Feldman & Roe LLP", title: "Partner", email: "dana@feldmanroe.example", phone: "212-555-0166", address: "9 Wall St, New York, NY 10005", birthday: "1971-01-30", ssn: "088-42-6605", notes: "Handles the vendor contracts.", favorite: false },
    { id: "c5", name: "Elena Vasquez", org: "Brightpath Schools", title: "Principal", email: "elena.vasquez@brightpath.example", phone: "512-555-0129", address: "77 Maple Rd, Austin, TX 78704", birthday: "1986-09-14", ssn: "634-71-9902", notes: "", favorite: false },
    { id: "c6", name: "Farid Nasser", org: "Cobalt Freight", title: "Dispatch Manager", email: "farid.nasser@cobalt.example", phone: "312-555-0154", address: "220 Lake Shore Dr, Chicago, IL 60601", birthday: "1982-12-05", ssn: "351-60-4417", notes: "Night shift contact.", favorite: false },
    { id: "c7", name: "Grace Halloran", org: "Meridian Bank", title: "Relationship Manager", email: "grace.halloran@meridianbank.example", phone: "704-555-0198", address: "12 King St, Charlotte, NC 28202", birthday: "1993-04-18", ssn: "419-28-1176", notes: "Our account rep.", favorite: true },
    { id: "c8", name: "Hiro Tanaka", org: "Orchard Design", title: "Creative Director", email: "hiro.tanaka@orchard.example", phone: "503-555-0171", address: "45 Rose Blvd, Portland, OR 97205", birthday: "1988-07-27", ssn: "560-33-8821", notes: "", favorite: false },
    { id: "c9", name: "Isabel Moreno", org: "Vantage Labs", title: "Research Scientist", email: "isabel.moreno@vantage.example", phone: "858-555-0139", address: "3100 Torrey Pines, San Diego, CA 92037", birthday: "1991-02-09", ssn: "605-17-4433", notes: "Publishes on materials.", favorite: false },
    { id: "c10", name: "Jamal Whitfield", org: "Ironwood Realty", title: "Broker", email: "jamal.whitfield@ironwood.example", phone: "404-555-0192", address: "610 Peachtree St, Atlanta, GA 30308", birthday: "1976-10-16", ssn: "251-90-6672", notes: "", favorite: false },
    { id: "c11", name: "Karla Nyström", org: "Fjord Analytics", title: "Data Engineer", email: "karla.nystrom@fjord.example", phone: "646-555-0104", address: "18 Hudson Yards, New York, NY 10001", birthday: "1994-05-23", ssn: "133-58-7029", notes: "Pipeline owner.", favorite: false },
    { id: "c12", name: "Liam O'Doherty", org: "Granite Insurance", title: "Claims Adjuster", email: "liam.odoherty@granite.example", phone: "617-555-0188", address: "240 Commonwealth Ave, Boston, MA 02116", birthday: "1983-08-08", ssn: "029-64-3350", notes: "", favorite: true },
  ];

  function lastName(n) {
    const parts = String(n || "").trim().split(/\s+/);
    return (parts.length > 1 ? parts[parts.length - 1] : (n || "")).toLowerCase();
  }
  function initials(n) {
    const p = String(n || "?").trim().split(/\s+/);
    return ((p[0] || "")[0] || "" ) + (p.length > 1 ? (p[p.length - 1][0] || "") : "");
  }

  OS.registerApp({
    id: "contacts", name: "Contacts", icon: "👥", width: 720, height: 520,
    render(win, arg) {
      win.aiContext = "Contacts app";
      win.setTitle("Contacts");
      win.body.innerHTML = `
        <div class="sidebar" id="cSide">
          <div class="toolbar" style="height:auto;border-bottom:none;padding:0 4px 8px">
            <input class="search" id="cSearch" placeholder="Search" style="width:100%"/>
          </div>
          <div id="cList"></div>
        </div>
        <div class="main">
          <div class="toolbar">
            <span id="cCount" style="color:var(--muted);font-size:12.5px"></span>
            <span class="sp"></span>
            <button class="tbtn ai" id="cAI">✦ Ask AI</button>
          </div>
          <div class="scroll" id="cDetail"></div>
        </div>`;

      const listEl = win.body.querySelector("#cList");
      const detailEl = win.body.querySelector("#cDetail");
      const searchEl = win.body.querySelector("#cSearch");
      const countEl = win.body.querySelector("#cCount");
      win.body.querySelector("#cAI").addEventListener("click", () =>
        OS.ai.actOn("Find contacts with sensitive personal information like SSNs and list them"));

      let data = SEED;
      let filter = "";
      let selected = null;

      function matches(c) {
        if (!filter) return true;
        const q = filter.toLowerCase();
        return [c.name, c.org, c.title, c.email, c.phone].some(v => String(v || "").toLowerCase().includes(q));
      }
      function sorted(arr) {
        return arr.slice().sort((a, b) => lastName(a.name).localeCompare(lastName(b.name)) ||
          String(a.name).localeCompare(String(b.name)));
      }

      function liHTML(c) {
        return `<div class="li" data-id="${esc(c.id)}">
          <div class="av">${esc(initials(c.name))}</div>
          <div class="cc">
            <div class="t1"><b>${esc(c.name)}</b></div>
            <div class="t3">${esc([c.title, c.org].filter(Boolean).join(" · ") || "—")}</div>
          </div>
        </div>`;
      }

      function renderList() {
        const shown = sorted(data.filter(matches));
        countEl.textContent = shown.length + (shown.length === 1 ? " contact" : " contacts");
        if (!data.length) {
          listEl.innerHTML = "";
          detailEl.innerHTML = `<div class="empty"><div class="big">👥</div>No contacts.</div>`;
          return;
        }
        if (!shown.length) {
          listEl.innerHTML = `<div class="empty" style="padding:24px">No matches.</div>`;
          return;
        }
        const favs = shown.filter(c => c.favorite);
        const rest = shown;
        let html = "";
        if (favs.length && !filter) {
          html += `<div class="sec">Favorites</div><div class="list">` + favs.map(liHTML).join("") + `</div>`;
          html += `<div class="sec">All Contacts</div>`;
        }
        html += `<div class="list">` + rest.map(liHTML).join("") + `</div>`;
        listEl.innerHTML = html;
        listEl.querySelectorAll(".li").forEach(li =>
          li.addEventListener("click", () => select(li.dataset.id)));
        // keep selection valid
        if (!selected || !shown.some(c => c.id === selected)) selected = shown[0] && shown[0].id;
        highlight();
      }

      function highlight() {
        listEl.querySelectorAll(".li").forEach(li =>
          li.classList.toggle("active", li.dataset.id === selected));
      }

      function secretRow(label, value) {
        const v = esc(value || "—");
        return `<div class="kv"><span class="k">${label}</span>
          <span class="v"><span class="secret masked" data-real="${v}">•••-••-••••</span></span></div>`;
      }

      function renderDetail() {
        const c = data.find(x => x.id === selected);
        if (!c) { detailEl.innerHTML = `<div class="empty"><div class="big">👤</div>Select a contact.</div>`; return; }
        detailEl.innerHTML = `
          <div style="padding:26px 26px 8px;display:flex;gap:18px;align-items:center">
            <div class="avatar">${esc(initials(c.name))}</div>
            <div style="min-width:0">
              <div style="font-size:22px;font-weight:600">${esc(c.name)}</div>
              <div style="color:var(--muted);font-size:13.5px;margin-top:3px">${esc([c.title, c.org].filter(Boolean).join(" · ") || "—")}</div>
              ${c.favorite ? `<span class="pill" style="margin-top:8px;display:inline-block">★ Favorite</span>` : ""}
            </div>
          </div>
          <div style="padding:8px 26px 26px">
            <div class="kv"><span class="k">Email</span><span class="v">${esc(c.email || "—")}</span></div>
            <div class="kv"><span class="k">Phone</span>
              <span class="v"><span class="secret masked" data-real="${esc(c.phone || "—")}">••• ••• ••••</span></span></div>
            <div class="kv"><span class="k">Address</span><span class="v">${esc(c.address || "—")}</span></div>
            <div class="kv"><span class="k">Birthday</span><span class="v">${esc(c.birthday || "—")}</span></div>
            ${secretRow("SSN", c.ssn)}
            ${c.notes ? `<div class="kv" style="border-bottom:none"><span class="k">Notes</span><span class="v" style="font-weight:400;color:var(--muted)">${esc(c.notes)}</span></div>` : ""}
          </div>`;
        detailEl.querySelectorAll(".secret").forEach(s => s.addEventListener("click", () => {
          const masked = s.classList.toggle("masked");
          if (masked) { s.textContent = s.dataset.mask || "•••-••-••••"; }
          else { s.dataset.mask = s.textContent; s.textContent = s.dataset.real; }
        }));
      }

      function select(id) {
        selected = id;
        highlight();
        renderDetail();
      }

      searchEl.addEventListener("input", () => { filter = searchEl.value.trim(); renderList(); });

      function boot() {
        renderList();
        if (arg && arg.focus) {
          const f = String(arg.focus).toLowerCase();
          const hit = data.find(c => c.id === f || String(c.name).toLowerCase().includes(f) ||
            String(c.email || "").toLowerCase().includes(f));
          if (hit) selected = hit.id;
        }
        if (!selected && data.length) selected = sorted(data)[0].id;
        highlight();
        renderDetail();
      }

      // Prefer on-disk data, fall back to seed. Never throw.
      (async () => {
        try {
          const loaded = await OS.readJSON("Contacts/contacts.json");
          if (Array.isArray(loaded) && loaded.length) data = loaded;
        } catch (e) { /* keep seed */ }
        boot();
      })();

      // render seed immediately so the window is never blank while loading
      boot();
    },
  });
})();
