/* Messages — iMessage-style texting app */
(function () {
  const { esc } = OS.util;

  // Fallback data (used if Messages/threads.json is absent). Shape:
  // {id,name,handle,avatar,muted,messages:[{from:"me"|"them",text,time:"HH:MM"}]}
  const FALLBACK = [
    {
      id: "mom", name: "Mom", handle: "+1 (415) 555-0128", avatar: "👩",
      muted: false, messages: [
        { from: "them", text: "Hi honey! Are you still coming for dinner Sunday?", time: "09:14" },
        { from: "me", text: "Yes! I'll be there around 5.", time: "09:31" },
        { from: "them", text: "Perfect. Bring your appetite 🍝", time: "09:32" },
        { from: "me", text: "Always do ❤️", time: "09:33" },
      ],
    },
    {
      id: "dev-team", name: "Priya Nair", handle: "@priya", avatar: "👩‍💻",
      muted: false, messages: [
        { from: "them", text: "Did the deploy go out?", time: "13:02" },
        { from: "me", text: "Yeah, staging looks green. Prod at 3.", time: "13:05" },
        { from: "them", text: "Nice. I'll keep an eye on the dashboards.", time: "13:06" },
      ],
    },
    {
      id: "delivery", name: "+1 (202) 555-0199", handle: "+1 (202) 555-0199", avatar: "📦",
      muted: false, spam: true, messages: [
        { from: "them", text: "USPS: Your package could not be delivered. Update your address to avoid return: http://usps-redeliver.link/verify", time: "07:41" },
        { from: "them", text: "Final notice — package will be returned in 24h. http://usps-redeliver.link/verify", time: "11:20" },
      ],
    },
    {
      id: "bank", name: "Unknown", handle: "+44 7700 900099", avatar: "🏦",
      muted: false, spam: true, messages: [
        { from: "them", text: "ALERT: A $940.00 charge was flagged on your account. If this wasn't you, confirm identity now: https://secure-bank-verify.co/login", time: "22:48" },
      ],
    },
    {
      id: "jordan", name: "Jordan", handle: "+1 (415) 555-0173", avatar: "🧑",
      muted: true, messages: [
        { from: "them", text: "gym at 7?", time: "18:10" },
        { from: "me", text: "make it 7:30 and I'm in", time: "18:12" },
        { from: "them", text: "deal 💪", time: "18:12" },
      ],
    },
  ];

  const SCAM_PROMPT = "Read my text messages and tell me if any look like scams or phishing";

  // Heuristic: unknown-looking sender + a link → possible phishing.
  function looksSpammy(t) {
    if (t.spam) return true;
    const hasLink = (t.messages || []).some(m => /https?:\/\/|www\.|\.\w{2,}\/\S/i.test(m.text));
    const unknownName = /unknown/i.test(t.name || "") || /^[+\d][\d\s()\-]{5,}$/.test((t.name || "").trim());
    return hasLink && unknownName;
  }

  function preview(t) {
    const last = (t.messages || [])[t.messages.length - 1];
    if (!last) return "";
    return (last.from === "me" ? "You: " : "") + last.text;
  }
  function lastTime(t) {
    const last = (t.messages || [])[t.messages.length - 1];
    return last ? last.time : "";
  }

  OS.registerApp({
    id: "messages", name: "Messages", icon: "💬", width: 640, height: 540,
    render(win, arg) {
      win.aiContext = "Messages app";
      win.setTitle("Messages");

      win.body.innerHTML = `
        <div class="sidebar" id="msgSide" style="width:236px;padding:6px 6px"></div>
        <div class="main" id="msgMain"></div>`;

      const side = win.body.querySelector("#msgSide");
      const main = win.body.querySelector("#msgMain");

      let threads = [];
      let currentId = null;

      function renderList() {
        if (!threads.length) {
          side.innerHTML = `<div class="empty"><div class="big">💬</div>No conversations yet.</div>`;
          return;
        }
        side.innerHTML = `<div class="list">` + threads.map(t => {
          const spam = looksSpammy(t);
          return `<div class="li${t.id === currentId ? " active" : ""}" data-id="${esc(t.id)}">
            <div class="av" style="background:var(--panel2);font-size:20px">${esc(t.avatar || "💬")}</div>
            <div class="cc">
              <div class="t1">
                <b>${esc(t.name)}</b>
                ${t.muted ? `<span title="Muted" style="font-size:11px;color:var(--muted)">🔕</span>` : ""}
                <span class="dt">${esc(lastTime(t))}</span>
              </div>
              <div class="t3">${esc(preview(t))}</div>
              ${spam ? `<div style="margin-top:5px"><span class="pill red">Spam?</span></div>` : ""}
            </div>
          </div>`;
        }).join("") + `</div>`;
        side.querySelectorAll(".li").forEach(li =>
          li.addEventListener("click", () => select(li.dataset.id)));
      }

      function renderChat() {
        const t = threads.find(x => x.id === currentId);
        if (!t) {
          main.innerHTML = `<div class="empty"><div class="big">💬</div>Select a conversation.</div>`;
          return;
        }
        const spam = looksSpammy(t);
        main.innerHTML = `
          <div class="toolbar">
            <span style="font-size:20px">${esc(t.avatar || "💬")}</span>
            <div style="min-width:0">
              <div style="font-weight:600;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
                ${esc(t.name)} ${t.muted ? `<span title="Muted" style="font-size:12px;color:var(--muted)">🔕</span>` : ""}
              </div>
              <div style="font-size:11.5px;color:var(--muted)">${esc(t.handle || "")}</div>
            </div>
            ${spam ? `<span class="pill red" style="margin-left:8px">Possible scam</span>` : ""}
            <span class="sp"></span>
            <button class="tbtn ai" id="msgAI">✦ Ask AI</button>
          </div>
          <div class="scroll" id="msgScroll" style="padding:16px 14px;display:flex;flex-direction:column;gap:2px"></div>`;

        main.querySelector("#msgAI").addEventListener("click", () => OS.ai.actOn(SCAM_PROMPT));

        const scroll = main.querySelector("#msgScroll");
        scroll.innerHTML = (t.messages || []).map(m => {
          const mine = m.from === "me";
          const bubble = `background:${mine ? "var(--accent)" : "var(--panel2)"};color:${mine ? "#fff" : "var(--text)"};` +
            `padding:8px 13px;border-radius:18px;max-width:74%;font-size:13.5px;line-height:1.4;word-break:break-word;` +
            `border-bottom-${mine ? "right" : "left"}-radius:5px`;
          return `<div style="display:flex;flex-direction:column;align-items:${mine ? "flex-end" : "flex-start"};margin-top:8px">
            <div style="${bubble}">${esc(m.text)}</div>
            <div style="font-size:10.5px;color:var(--muted);margin:3px 6px 0">${esc(m.time || "")}</div>
          </div>`;
        }).join("") || `<div class="empty">No messages.</div>`;
        scroll.scrollTop = scroll.scrollHeight;
      }

      function select(id) {
        currentId = id;
        renderList();
        renderChat();
      }

      (async () => {
        let data = null;
        try { data = await OS.readJSON("Messages/threads.json"); } catch (e) { data = null; }
        threads = Array.isArray(data) && data.length ? data : FALLBACK;

        let start = threads.length ? threads[0].id : null;
        const focus = arg && arg.focus;
        if (focus && threads.some(t => t.id === focus || t.name === focus)) {
          const hit = threads.find(t => t.id === focus || t.name === focus);
          start = hit.id;
        }
        currentId = start;
        renderList();
        renderChat();
      })();
    },
  });
})();
