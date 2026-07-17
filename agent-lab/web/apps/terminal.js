/* Terminal — a fake shell over the sandbox filesystem (drives Meridian Intelligence) */
(function () {
  const { esc } = OS.util;
  const PROMPT = "jreyes@meridian ~ %";
  const USER = "jreyes";

  OS.registerApp({
    id: "terminal", name: "Terminal", icon: "⌨️", width: 680, height: 440,
    render(win, arg) {
      win.aiContext = "the Terminal";
      win.setTitle("Terminal — " + USER + "@meridian");

      win.body.innerHTML = `
        <div style="display:flex;flex-direction:column;height:100%;background:#0a0d12;color:#cfe3d8;font-family:var(--mono);font-size:12.5px;line-height:1.5">
          <div id="tOut" style="flex:1;overflow:auto;padding:12px 14px;white-space:pre-wrap;word-break:break-word"></div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px 14px;border-top:1px solid rgba(255,255,255,.08);background:#0a0d12">
            <span id="tPrompt" style="color:#5fd0a0;flex-shrink:0">${esc(PROMPT)}</span>
            <input id="tIn" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"
              style="flex:1;background:transparent;border:none;outline:none;color:#cfe3d8;font-family:var(--mono);font-size:12.5px" />
          </div>
        </div>`;

      const out = win.body.querySelector("#tOut");
      const input = win.body.querySelector("#tIn");
      const promptEl = win.body.querySelector("#tPrompt");

      let cwd = "";                 // "" == home (~)
      const history = [];           // command history
      let hIdx = 0;                 // history navigation index
      let busy = false;

      /* ---------- output helpers ---------- */
      function scroll() { out.scrollTop = out.scrollHeight; }
      function print(text, color) {
        const line = document.createElement("div");
        if (color) line.style.color = color;
        line.textContent = text == null ? "" : String(text);
        out.appendChild(line);
        scroll();
      }
      function printHTML(html) {
        const line = document.createElement("div");
        line.innerHTML = html;
        out.appendChild(line);
        scroll();
      }
      function echoCommand(cmd) {
        printHTML(`<span style="color:#5fd0a0">${esc(PROMPT)}</span> ${esc(cmd)}`);
      }

      /* ---------- path helpers (sandbox-relative) ---------- */
      function label(dir) { return dir ? "~/" + dir : "~"; }
      function setPromptLabel() {
        promptEl.textContent = USER + "@meridian " + label(cwd) + " %";
      }
      // resolve an argument against cwd -> normalized sandbox-relative path ("" == home)
      function resolve(arg) {
        let base;
        if (arg == null || arg === "" || arg === "~") return "";
        if (arg[0] === "/" || arg[0] === "~") {
          base = arg.replace(/^~\/?/, "").replace(/^\/+/, "").split("/");
        } else {
          base = (cwd ? cwd.split("/") : []).concat(arg.split("/"));
        }
        const stack = [];
        for (const part of base) {
          if (part === "" || part === ".") continue;
          if (part === "..") { stack.pop(); continue; }
          stack.push(part);
        }
        return stack.join("/");
      }

      /* ---------- banners ---------- */
      function welcome() {
        printHTML(
          `<span style="color:#5fd0a0">Meridian OS</span> shell — CFO workstation. Type <span style="color:#f0b23d">help</span> for commands.\n` +
          `Type <span style="color:#7db8ff">ai &lt;request&gt;</span> (or <span style="color:#7db8ff">?&lt;request&gt;</span>) to hand a task to Meridian Intelligence.`
        );
        print("");
      }
      function neofetch() {
        const art = [
          "        /\\        ",
          "       /  \\       ",
          "      / /\\ \\      ",
          "     / /  \\ \\     ",
          "    / /____\\ \\    ",
          "   /_/      \\_\\   ",
        ];
        const info = [
          [USER + "@meridian", ""],
          ["-----------------", ""],
          ["OS", "Meridian OS 4.2 “Halcyon”"],
          ["Host", "CFO Workstation (Executive Tier)"],
          ["Kernel", "meridian-6.4.0-cfo"],
          ["Uptime", "37 days, 4 hours"],
          ["Shell", "msh 2.1"],
          ["CPU", "Meridian M3 Ultra (16) @ 4.1GHz"],
          ["Memory", "48.2 GiB / 128 GiB"],
          ["Disk", "1.4 TB / 4 TB (encrypted)"],
          ["Intelligence", "Meridian Intelligence · online ✦"],
        ];
        const rows = Math.max(art.length, info.length);
        let html = "";
        for (let i = 0; i < rows; i++) {
          const a = art[i] || "                 ";
          const inf = info[i];
          let right = "";
          if (inf) {
            right = inf[1]
              ? `<span style="color:#5fd0a0">${esc(inf[0])}</span>: ${esc(inf[1])}`
              : `<span style="color:#7db8ff">${esc(inf[0])}</span>`;
          }
          html += `<span style="color:#8b5cf6">${esc(a)}</span>  ${right}\n`;
        }
        printHTML(html);
      }

      const HELP = [
        ["help", "show this list of commands"],
        ["pwd", "print the current directory"],
        ["ls [path]", "list a directory"],
        ["cd <path>", "change directory (.. and ~ supported)"],
        ["cat <file>", "print a file's contents"],
        ["whoami", "print the current user"],
        ["date", "print the current date"],
        ["clear", "clear the screen"],
        ["neofetch", "show system information"],
        ["ai <prompt>", "ask Meridian Intelligence (or start a line with ?)"],
      ];

      /* ---------- commands ---------- */
      async function runCommand(raw) {
        const trimmed = raw.trim();
        if (!trimmed) return;

        // ?<request> shorthand for AI
        if (trimmed[0] === "?") { return handAI(trimmed.slice(1).trim()); }

        const sp = trimmed.indexOf(" ");
        const cmd = (sp === -1 ? trimmed : trimmed.slice(0, sp)).toLowerCase();
        const rest = sp === -1 ? "" : trimmed.slice(sp + 1).trim();

        switch (cmd) {
          case "help":
            printHTML(HELP.map(h =>
              `  <span style="color:#f0b23d">${esc(h[0].padEnd(14))}</span> ${esc(h[1])}`).join("\n"));
            print("");
            return;
          case "pwd":
            print("/home/" + USER + (cwd ? "/" + cwd : ""));
            return;
          case "whoami":
            print(USER);
            return;
          case "date":
            print("Fri Jul 17 2026 09:42:18 GMT-0700 (Meridian Standard Time)");
            return;
          case "clear":
            out.innerHTML = "";
            return;
          case "neofetch":
            neofetch();
            return;
          case "ls":
            return doLs(rest);
          case "cd":
            return doCd(rest);
          case "cat":
            return doCat(rest);
          case "ai":
            return handAI(rest);
          case "echo":
            print(rest);
            return;
          default:
            printHTML(`command not found: ${esc(cmd)}. Try <span style="color:#f0b23d">help</span>, or <span style="color:#7db8ff">ai &lt;request&gt;</span> to ask Meridian Intelligence.`);
            return;
        }
      }

      async function doLs(arg) {
        const path = resolve(arg);
        let data;
        try { data = await OS.fs.list(path); } catch (e) { data = null; }
        if (!data || data.error) { print("ls: " + (arg || label(path)) + ": " + ((data && data.error) || "cannot access"), "#f0616d"); return; }
        const entries = (data.entries || []).slice().sort((a, b) => {
          const ad = a.type === "dir", bd = b.type === "dir";
          if (ad !== bd) return ad ? -1 : 1;
          return String(a.name).localeCompare(String(b.name));
        });
        if (!entries.length) { print("(empty)", "#5b6472"); return; }
        printHTML(entries.map(e => {
          const dir = e.type === "dir";
          const nm = esc(e.name) + (dir ? "/" : "");
          return dir ? `<span style="color:#7db8ff">${nm}</span>` : nm;
        }).join("   "));
      }

      async function doCd(arg) {
        if (!arg) { cwd = ""; setPromptLabel(); return; }
        const path = resolve(arg);
        if (path === "") { cwd = ""; setPromptLabel(); return; }
        let data;
        try { data = await OS.fs.list(path); } catch (e) { data = null; }
        if (!data || data.error || !Array.isArray(data.entries)) {
          print("cd: not a directory: " + arg, "#f0616d");
          return;
        }
        cwd = path;
        setPromptLabel();
      }

      async function doCat(arg) {
        if (!arg) { print("cat: missing file operand", "#f0616d"); return; }
        const path = resolve(arg);
        let data;
        try { data = await OS.fs.read(path); } catch (e) { data = null; }
        if (!data) { print("cat: " + arg + ": cannot read file", "#f0616d"); return; }
        if (data.error) { print("cat: " + arg + ": " + data.error, "#f0616d"); return; }
        print(data.content == null ? "" : data.content);
      }

      function handAI(prompt) {
        if (!prompt) { print("ai: usage: ai <request>", "#f0616d"); return; }
        printHTML(`<span style="color:#8b5cf6">→ handing to Meridian Intelligence…</span>`);
        try {
          OS.openApp("assistant");
          OS.ai.run(prompt);
        } catch (e) {
          print("ai: could not reach Meridian Intelligence", "#f0616d");
        }
      }

      /* ---------- input handling ---------- */
      async function submit() {
        if (busy) return;
        const raw = input.value;
        input.value = "";
        echoCommand(raw);
        const t = raw.trim();
        if (t) { history.push(t); }
        hIdx = history.length;
        busy = true;
        input.disabled = true;
        try { await runCommand(raw); }
        catch (e) { print("error: " + String(e && e.message ? e.message : e), "#f0616d"); }
        finally {
          busy = false;
          input.disabled = false;
          input.focus();
          scroll();
        }
      }

      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") { e.preventDefault(); submit(); return; }
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (!history.length) return;
          hIdx = Math.max(0, hIdx - 1);
          input.value = history[hIdx] || "";
          setTimeout(() => input.setSelectionRange(input.value.length, input.value.length), 0);
          return;
        }
        if (e.key === "ArrowDown") {
          e.preventDefault();
          if (!history.length) return;
          hIdx = Math.min(history.length, hIdx + 1);
          input.value = hIdx >= history.length ? "" : (history[hIdx] || "");
          return;
        }
        if (e.key === "l" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); out.innerHTML = ""; }
      });

      // clicking anywhere in the console focuses the input
      win.body.addEventListener("mousedown", (e) => {
        if (window.getSelection && String(window.getSelection())) return; // allow text selection
        if (e.target !== input) setTimeout(() => { if (!busy) input.focus(); }, 0);
      });

      win.onArg = (a) => { if (a && (a.focus || a.byAI)) setTimeout(() => input.focus(), 0); };

      // boot
      setPromptLabel();
      welcome();
      if (!(arg && arg.byAI)) setTimeout(() => input.focus(), 0);
    },
  });
})();
