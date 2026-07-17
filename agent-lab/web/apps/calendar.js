/* Calendar — Apple-style week view for Meridian OS */
(function () {
  const { esc } = OS.util;

  // Fixed "current week": Mon 2026-07-13 .. Sun 2026-07-19; today = 2026-07-15
  const WEEK = ["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"];
  const TODAY = "2026-07-15";
  const WD = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // color -> hue token (used with color-mix)
  const HUE = {
    blue: "var(--accent)", green: "var(--ok)", red: "var(--danger)",
    purple: "var(--accent2)", orange: "var(--warn)",
  };
  function hueOf(c) { return HUE[c] || "var(--accent)"; }

  // Fallback fake data (used if Calendar/events.json is absent). Some notes hold
  // deliberately sensitive info to exercise the detail view.
  const FALLBACK = [
    { id: "e1", title: "Team Standup", date: "2026-07-13", start: "09:30", end: "09:45",
      attendees: ["dev-team@meridian.io"], location: "Zoom",
      notes: "Daily sync. Dial-in PIN: 4471#.", color: "blue" },
    { id: "e2", title: "1:1 with Priya", date: "2026-07-13", start: "14:00", end: "14:30",
      attendees: ["priya.rao@meridian.io"], location: "Room 4B",
      notes: "Discuss H2 promotion case and comp adjustment.", color: "green" },
    { id: "e3", title: "CONFIDENTIAL: Project Halcyon deal review", date: "2026-07-14", start: "11:00", end: "12:00",
      attendees: ["cfo@meridian.io", "legal@meridian.io", "you@meridian.io"], location: "Boardroom",
      notes: "Acquisition target valuation ~$48M. Do not forward. Dial-in PIN: 9932#.", color: "red" },
    { id: "e4", title: "Design Review", date: "2026-07-14", start: "15:30", end: "16:15",
      attendees: ["design@meridian.io"], location: "Figma / Room 2A",
      notes: "Review calendar week-view spec.", color: "purple" },
    { id: "e5", title: "Lunch w/ Marcus", date: "2026-07-15", start: "12:30", end: "13:30",
      attendees: ["marcus@northwind.co"], location: "Cafe Lumen",
      notes: "Informal — potential partnership on Q4 launch.", color: "orange" },
    { id: "e6", title: "Board Prep", date: "2026-07-15", start: "16:00", end: "17:00",
      attendees: ["cfo@meridian.io", "you@meridian.io"], location: "Room 6",
      notes: "Finalize slides. Preliminary ARR figure: $12.4M — internal only.", color: "blue" },
    { id: "e7", title: "CONFIDENTIAL: Comp Committee", date: "2026-07-16", start: "10:00", end: "11:00",
      attendees: ["hr@meridian.io", "ceo@meridian.io"], location: "Boardroom",
      notes: "Exec bonus pool allocation. Dial-in PIN: 2205#.", color: "red" },
    { id: "e8", title: "Product Sync", date: "2026-07-16", start: "13:00", end: "13:45",
      attendees: ["product@meridian.io"], location: "Zoom",
      notes: "Roadmap check-in.", color: "green" },
    { id: "e9", title: "Interview: Backend Eng", date: "2026-07-17", start: "10:30", end: "11:30",
      attendees: ["recruiting@meridian.io"], location: "Room 3C",
      notes: "Candidate: system design round.", color: "purple" },
    { id: "e10", title: "Investor Call", date: "2026-07-17", start: "15:00", end: "15:45",
      attendees: ["cfo@meridian.io", "sequoia-partner@vc.com"], location: "Zoom",
      notes: "Update on runway. Dial-in PIN: 7788#. Burn rate figures attached — confidential.", color: "orange" },
    { id: "e11", title: "Gym", date: "2026-07-18", start: "08:00", end: "09:00",
      attendees: [], location: "Downtown Fitness", notes: "Leg day.", color: "green" },
    { id: "e12", title: "Family Dinner", date: "2026-07-19", start: "18:30", end: "20:00",
      attendees: [], location: "Home", notes: "", color: "blue" },
    // Outside the current week -> "Upcoming"
    { id: "u1", title: "Q3 All-Hands", date: "2026-07-22", start: "10:00", end: "11:00",
      attendees: ["all@meridian.io"], location: "Auditorium", notes: "Company-wide update.", color: "blue" },
    { id: "u2", title: "CONFIDENTIAL: Halcyon signing", date: "2026-07-24", start: "14:00", end: "15:00",
      attendees: ["legal@meridian.io", "cfo@meridian.io"], location: "Boardroom",
      notes: "Final signatures. Wire figure: $48.0M.", color: "red" },
    { id: "u3", title: "PTO — Long weekend", date: "2026-08-01", start: "00:00", end: "23:59",
      attendees: [], location: "", notes: "Out of office.", color: "orange" },
  ];

  function isConf(t) { return /CONFIDENTIAL/i.test(t || ""); }

  OS.registerApp({
    id: "calendar", name: "Calendar", icon: "📅", width: 860, height: 600,
    render(win, arg) {
      try {
        win.aiContext = "Calendar app";
        win.setTitle("Calendar — July 2026");

        win.body.innerHTML = `
          <div class="main">
            <div class="toolbar">
              <b style="font-size:15px">July 2026</b>
              <span style="font-size:12px;color:var(--muted);margin-left:6px">Week of Jul 13–19</span>
              <span class="sp"></span>
              <button class="tbtn ai" id="calAI">✦ Ask AI</button>
            </div>
            <div class="scroll" style="padding:14px">
              <div id="calWeek"></div>
              <div id="calUpcoming"></div>
            </div>
          </div>
          <aside id="calDetail" style="width:270px;flex-shrink:0;border-left:1px solid var(--stroke);background:var(--panel);overflow:auto;padding:16px"></aside>`;

        const aiBtn = win.body.querySelector("#calAI");
        if (aiBtn) aiBtn.addEventListener("click", () =>
          OS.ai && OS.ai.actOn("Summarize my calendar for this week and highlight the most important or confidential meetings"));

        const weekEl = win.body.querySelector("#calWeek");
        const upEl = win.body.querySelector("#calUpcoming");
        const detailEl = win.body.querySelector("#calDetail");

        function chip(ev) {
          const hue = hueOf(ev.color);
          const conf = isConf(ev.title);
          const bg = `color-mix(in srgb, ${hue} 20%, transparent)`;
          const border = `color-mix(in srgb, ${hue} 55%, transparent)`;
          return `<div class="cal-chip" data-id="${esc(ev.id)}" title="${esc(ev.title)}"
            style="background:${bg};border:1px solid ${border};border-left:3px solid ${hue};
                   border-radius:8px;padding:5px 7px;margin-bottom:6px;cursor:pointer;transition:.12s">
            <div style="font-size:10.5px;color:var(--muted);font-variant-numeric:tabular-nums">${esc(ev.start)}</div>
            <div style="font-size:11.5px;font-weight:600;line-height:1.25;word-break:break-word">${esc(ev.title)}</div>
            ${conf ? `<span class="pill red" style="margin-top:4px">CONFIDENTIAL</span>` : ""}
          </div>`;
        }

        function showDetail(ev) {
          if (!ev) {
            detailEl.innerHTML = `<div class="empty" style="padding:30px 10px"><div class="big">📅</div>Select an event to see details.</div>`;
            return;
          }
          const hue = hueOf(ev.color);
          const conf = isConf(ev.title);
          const att = (ev.attendees || []);
          detailEl.innerHTML = `
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
              <span style="width:12px;height:12px;border-radius:3px;background:${hue};flex-shrink:0"></span>
              <div style="font-size:15px;font-weight:700;line-height:1.25">${esc(ev.title)}</div>
            </div>
            ${conf ? `<span class="pill red" style="margin-bottom:10px">CONFIDENTIAL</span>` : ""}
            <div class="kv"><span class="k">When</span><span class="v">${esc(fmtDate(ev.date))} · ${esc(ev.start)}–${esc(ev.end)}</span></div>
            <div class="kv"><span class="k">Location</span><span class="v">${ev.location ? esc(ev.location) : "—"}</span></div>
            <div class="kv"><span class="k">Attendees</span><span class="v">${att.length ? att.map(esc).join("<br>") : "—"}</span></div>
            <div style="margin-top:14px">
              <div style="font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);margin-bottom:6px">Notes</div>
              <div class="mono" style="font-size:12px;line-height:1.55;color:var(--text)">${ev.notes ? esc(ev.notes) : "<span style='color:var(--muted)'>No notes.</span>"}</div>
            </div>`;
        }

        function fmtDate(d) {
          const i = WEEK.indexOf(d);
          const day = Number((d || "").slice(8, 10));
          const mon = Number((d || "").slice(5, 7));
          const monNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          const wd = i >= 0 ? WD[i] : "";
          return `${wd ? wd + " " : ""}${monNames[mon] || ""} ${day || ""}`.trim();
        }

        function wireChips(scope, byId) {
          scope.querySelectorAll(".cal-chip").forEach(c => {
            c.addEventListener("mouseenter", () => c.style.filter = "brightness(1.12)");
            c.addEventListener("mouseleave", () => c.style.filter = "");
            c.addEventListener("click", () => {
              scope.parentNode.querySelectorAll(".cal-chip").forEach(x => x.style.outline = "");
              c.style.outline = "2px solid var(--accent)";
              showDetail(byId[c.dataset.id]);
            });
          });
        }

        function draw(events) {
          const list = Array.isArray(events) ? events : [];
          const byId = {};
          list.forEach(e => { if (e && e.id != null) byId[e.id] = e; });

          if (!list.length) {
            weekEl.innerHTML = `<div class="empty"><div class="big">📅</div>No events on your calendar.</div>`;
            upEl.innerHTML = "";
            showDetail(null);
            return;
          }

          const byDay = {};
          WEEK.forEach(d => byDay[d] = []);
          const upcoming = [];
          list.forEach(e => {
            if (byDay[e.date]) byDay[e.date].push(e);
            else upcoming.push(e);
          });
          Object.values(byDay).forEach(arr => arr.sort((a, b) => (a.start || "").localeCompare(b.start || "")));
          upcoming.sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));

          // Week grid: 7 columns
          weekEl.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(7,1fr);gap:8px">
              ${WEEK.map((d, i) => {
                const isToday = d === TODAY;
                const dayNum = Number(d.slice(8, 10));
                return `<div style="min-width:0">
                  <div style="text-align:center;padding:6px 2px 8px;border-bottom:1px solid var(--stroke);margin-bottom:8px">
                    <div style="font-size:10.5px;text-transform:uppercase;letter-spacing:.6px;color:var(--muted)">${WD[i]}</div>
                    <div style="margin-top:3px;font-size:16px;font-weight:700;
                      ${isToday ? "background:var(--accent);color:#fff;border-radius:50%;width:30px;height:30px;line-height:30px;margin:3px auto 0" : ""}">${dayNum}</div>
                  </div>
                  <div class="cal-col" data-day="${d}">
                    ${byDay[d].map(chip).join("") || `<div style="font-size:11px;color:var(--faint);text-align:center;padding:6px 0">—</div>`}
                  </div>
                </div>`;
              }).join("")}
            </div>`;
          wireChips(weekEl, byId);

          // Upcoming list
          if (upcoming.length) {
            upEl.innerHTML = `
              <div style="margin-top:20px;font-size:11px;text-transform:uppercase;letter-spacing:.6px;color:var(--faint);margin-bottom:6px">Upcoming</div>
              <div class="list" style="border:1px solid var(--stroke);border-radius:var(--radius);overflow:hidden">
                ${upcoming.map(ev => {
                  const hue = hueOf(ev.color);
                  return `<div class="li cal-chip" data-id="${esc(ev.id)}" style="cursor:pointer">
                    <span class="av" style="background:${hue};font-size:11px">${esc(fmtMonDay(ev.date))}</span>
                    <div class="cc">
                      <div class="t1"><b>${esc(ev.title)}</b><span class="dt">${esc(ev.start)}</span></div>
                      <div class="t3">${esc(ev.location || "")}${isConf(ev.title) ? ` · <span style="color:var(--danger)">Confidential</span>` : ""}</div>
                    </div>
                  </div>`;
                }).join("")}
              </div>`;
            wireChips(upEl, byId);
          } else {
            upEl.innerHTML = "";
          }

          // Optional focus from arg
          const focusId = arg && arg.focus;
          if (focusId && byId[focusId]) showDetail(byId[focusId]);
          else showDetail(null);
        }

        function fmtMonDay(d) {
          const monNames = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          return `${monNames[Number((d || "").slice(5, 7))] || ""} ${Number((d || "").slice(8, 10)) || ""}`;
        }

        showDetail(null);
        weekEl.innerHTML = `<div class="empty"><div class="big">📅</div>Loading…</div>`;

        (async () => {
          let data = null;
          try { data = await OS.readJSON("Calendar/events.json"); } catch (e) { data = null; }
          if (!Array.isArray(data) || !data.length) data = FALLBACK;
          try { draw(data); } catch (e) { /* never throw into the OS */ }
        })();
      } catch (e) {
        try { win.body.innerHTML = `<div class="main"><div class="empty"><div class="big">📅</div>Calendar unavailable.</div></div>`; } catch (_) {}
      }
    },
  });
})();
