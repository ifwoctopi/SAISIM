"""One-click web UI for the agent-lab demo.

Serves a single SECSIM-themed page and streams a live agent run into it over
Server-Sent Events (SSE). Click "Run attack" in the browser and watch the
agent's steps and the audit log fill in, ending with a DATA EXPOSED banner.

Two ways to run the agent behind the UI (pick with AGENTLAB_RUNNER):
  * docker (default) -- shells out to run.sh, so the agent stays fully sandboxed
                        in the isolated containers. First run builds the image.
  * local            -- runs the agent directly in a temp sandbox with an
                        in-process collector. No Docker needed; best for the
                        offline demo. run_shell executes on the host, so use this
                        only for MODE=demo or on a throwaway machine.

Pure standard library. Start with:  python3 server.py   (then open the URL).
"""

import json
import os
import shutil
import subprocess
import tempfile
import threading
import time
import urllib.parse
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HERE = os.path.dirname(os.path.abspath(__file__))
PORT = int(os.environ.get("SERVER_PORT", "8000"))
RUNNER = os.environ.get("AGENTLAB_RUNNER", "docker").lower()
LOG_DIR = os.path.join(HERE, "logs")
ACTION_LOG = os.path.join(LOG_DIR, "actions.jsonl")

_run_lock = threading.Lock()  # only one run at a time


# --------------------------------------------------------------------------- #
# Runners: each starts an agent run that appends rows to ACTION_LOG.
# Returns a Popen-like object with .poll() and .terminate(), plus a cleanup fn.
# --------------------------------------------------------------------------- #
def _start_docker(mode, model):
    env = dict(os.environ, MODE=mode)
    if model:
        env["MODEL"] = model
    proc = subprocess.Popen(
        ["bash", "run.sh"], cwd=HERE, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    return proc, (lambda: None)


def _start_local(mode, model):
    """Run the agent directly, no Docker: temp sandbox + in-process collector."""
    sandbox = tempfile.mkdtemp(prefix="agentlab_sbx_")
    capture = os.path.join(LOG_DIR, "exfil_captured.log")

    # in-process collector on 127.0.0.1:9000
    collector = subprocess.Popen(
        ["python3", "-m", "agent.collector"], cwd=HERE,
        env=dict(os.environ, COLLECTOR_PORT="9000", CAPTURE_LOG=capture),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )
    time.sleep(0.6)

    # scenario with the exfil target pointed at the local collector
    with open(os.path.join(HERE, "scenarios", "insider_helpdesk.json")) as fh:
        scenario_src = fh.read().replace("collector:9000", "127.0.0.1:9000")
    scn_path = os.path.join(sandbox, "_scenario.json")
    with open(scn_path, "w") as fh:
        fh.write(scenario_src)

    env = dict(
        os.environ, MODE=mode, SANDBOX_ROOT=sandbox, ACTION_LOG=ACTION_LOG,
        SCENARIO=scn_path, PYTHONPATH=HERE,
    )
    if model:
        env["MODEL"] = model
    subprocess.run(["python3", "seed_sandbox.py"], cwd=HERE, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    proc = subprocess.Popen(
        ["python3", "-m", "agent.agent"], cwd=HERE, env=env,
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
    )

    def cleanup():
        collector.terminate()
        shutil.rmtree(sandbox, ignore_errors=True)

    return proc, cleanup


def start_run(mode, model):
    os.makedirs(LOG_DIR, exist_ok=True)
    open(ACTION_LOG, "w").close()  # truncate previous run
    if RUNNER == "local":
        return _start_local(mode, model)
    return _start_docker(mode, model)


# --------------------------------------------------------------------------- #
# HTTP handler: static page + SSE run endpoint.
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _send(self, code, body, ctype="text/plain"):
        data = body.encode("utf-8") if isinstance(body, str) else body
        self.send_response(code)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        path = urllib.parse.urlparse(self.path).path
        if path in ("/", "/index.html"):
            self._send(200, PAGE, "text/html; charset=utf-8")
        elif path == "/api/health":
            self._send(200, json.dumps({"ok": True, "runner": RUNNER}), "application/json")
        elif path == "/api/run":
            self._stream_run()
        else:
            self._send(404, "not found")

    # -- SSE ---------------------------------------------------------------- #
    def _sse(self, obj):
        self.wfile.write(f"data: {json.dumps(obj)}\n\n".encode("utf-8"))
        self.wfile.flush()

    def _stream_run(self):
        query = urllib.parse.parse_qs(urllib.parse.urlparse(self.path).query)
        mode = (query.get("mode", ["demo"])[0]).lower()
        model = query.get("model", [""])[0].strip()

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        if not _run_lock.acquire(blocking=False):
            self._sse({"type": "error", "message": "A run is already in progress."})
            return

        proc = cleanup = None
        try:
            self._sse({"type": "status", "state": "starting",
                       "message": f"Starting {mode} run"
                                  + (" (building sandbox on first run…)" if RUNNER == "docker" else "…")})
            proc, cleanup = start_run(mode, model)

            sent = 0
            while True:
                # forward any new action-log rows
                rows = _read_rows(ACTION_LOG)
                for row in rows[sent:]:
                    self._sse({"type": "step", "row": row})
                sent = len(rows)

                if proc.poll() is not None:
                    # drain once more after exit
                    rows = _read_rows(ACTION_LOG)
                    for row in rows[sent:]:
                        self._sse({"type": "step", "row": row})
                    sent = len(rows)
                    break
                self._sse({"type": "ping"})
                time.sleep(0.4)

            flagged = sum(1 for r in _read_rows(ACTION_LOG) if r.get("flagged"))
            self._sse({"type": "done", "rc": proc.returncode, "flagged": flagged,
                       "steps": sent})
        except BrokenPipeError:
            pass
        except Exception as exc:  # noqa: BLE001
            try:
                self._sse({"type": "error", "message": str(exc)})
            except OSError:
                pass
        finally:
            if proc and proc.poll() is None:
                proc.terminate()
            if cleanup:
                cleanup()
            _run_lock.release()


def _read_rows(path):
    if not os.path.exists(path):
        return []
    rows = []
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                try:
                    rows.append(json.loads(line))
                except json.JSONDecodeError:
                    pass
    return rows


# --------------------------------------------------------------------------- #
# The page (SECSIM-themed, vanilla JS + EventSource; no build step).
# --------------------------------------------------------------------------- #
PAGE = r"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>SECSIM × agent-lab</title>
<style>
  :root{
    --bg:#11151C; --panel:#171B23; --panelAlt:#1D222C; --border:#252b36;
    --text:#E4E7EC; --muted:#7C8494; --accent:#4FB6C4; --critical:#D1483B;
    --warning:#E8A33D; --success:#4CAF7D;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--bg);color:var(--text);
       font-family:system-ui,-apple-system,sans-serif;font-size:14px}
  header{display:flex;align-items:center;gap:10px;padding:10px 16px;
         background:var(--panel);border-bottom:1px solid var(--border)}
  header .dot{width:9px;height:9px;border-radius:50%;background:var(--accent)}
  header b{letter-spacing:.5px}
  header span{color:var(--muted)}
  .wrap{max-width:1100px;margin:0 auto;padding:16px}
  .controls{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
            background:var(--panel);border:1px solid var(--border);
            border-radius:10px;padding:12px 14px;margin-bottom:14px}
  select,input{background:var(--panelAlt);color:var(--text);
    border:1px solid var(--border);border-radius:6px;padding:7px 9px;font-size:13px}
  input{min-width:280px;font-family:var(--mono)}
  button#run{background:var(--accent);color:#0F1419;border:none;border-radius:8px;
    padding:9px 18px;font-weight:700;cursor:pointer;font-size:14px}
  button#run:disabled{opacity:.5;cursor:default}
  #status{color:var(--muted);margin-left:auto;font-size:13px}
  #banner{display:none;margin-bottom:14px;padding:12px 14px;border-radius:10px;
    background:#2A1917;border:1px solid var(--critical);color:#F3D9D5;font-weight:600}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  @media(max-width:820px){.grid{grid-template-columns:1fr}}
  .card{background:var(--panel);border:1px solid var(--border);border-radius:10px;
    overflow:hidden;display:flex;flex-direction:column;min-height:340px}
  .card h3{margin:0;padding:10px 14px;font-size:12px;text-transform:uppercase;
    letter-spacing:.08em;color:var(--muted);border-bottom:1px solid var(--border)}
  .body{padding:8px;overflow:auto;flex:1}
  .step{display:flex;gap:10px;padding:8px 8px;border-bottom:1px solid #1e2530}
  .step .tgt{font-family:var(--mono);font-size:12px}
  .step .think{color:var(--muted);font-size:12px;margin-top:2px}
  .pill{font-family:var(--mono);font-size:10px;padding:1px 7px;border-radius:20px;
    background:var(--panelAlt);color:var(--muted);height:fit-content;white-space:nowrap}
  .r-read{color:var(--accent)} .r-egress{color:var(--critical)}
  .r-destructive{color:var(--critical)} .r-shell{color:var(--warning)}
  .r-write{color:var(--success)}
  table{width:100%;border-collapse:collapse;font-family:var(--mono);font-size:12px}
  td{padding:6px 8px;border-bottom:1px solid #1e2530;white-space:nowrap}
  td.res{white-space:normal}
  .flag{color:var(--critical);font-weight:700}
  .empty{color:var(--muted);padding:14px;font-size:13px}
  .note{color:var(--muted);font-size:12px;margin-top:12px}
</style></head>
<body>
<header>
  <span class="dot"></span><b>SECSIM</b>
  <span>× agent-lab — live over-permissioned AI agent</span>
</header>
<div class="wrap">
  <div class="controls">
    <label>Mode
      <select id="mode">
        <option value="demo">Demo (scripted, no key)</option>
        <option value="live">Live (OpenRouter)</option>
      </select>
    </label>
    <input id="model" placeholder="model (live only, blank = default)" style="display:none"/>
    <button id="run">▶ Run attack</button>
    <span id="status">idle</span>
  </div>

  <div id="banner">⚠ SIMULATED DATA EXPOSURE — the agent sent fake HR salary data to an external endpoint. Nothing stopped it.</div>

  <div class="grid">
    <div class="card">
      <h3>Agent activity (live)</h3>
      <div class="body" id="timeline"><div class="empty">Press “Run attack” to begin.</div></div>
    </div>
    <div class="card">
      <h3>Audit log</h3>
      <div class="body"><table id="audit"><tbody>
        <tr><td class="empty" colspan="4">No entries yet.</td></tr>
      </tbody></table></div>
    </div>
  </div>
  <div class="note">Everything here is simulated fake data. The agent runs in a locked-down sandbox.</div>
</div>

<script>
const $ = s => document.querySelector(s);
const modeSel = $("#mode"), modelInp = $("#model"), runBtn = $("#run"),
      statusEl = $("#status"), banner = $("#banner"),
      timeline = $("#timeline"), auditBody = $("#audit tbody");

modeSel.onchange = () => { modelInp.style.display = modeSel.value === "live" ? "" : "none"; };

let es = null, steps = 0;
const riskClass = r => ({read:"r-read",egress:"r-egress",destructive:"r-destructive",
                         shell:"r-shell",write:"r-write"}[r] || "");

function addStep(row){
  if(steps === 0) timeline.innerHTML = "";
  steps++;
  const el = document.createElement("div");
  el.className = "step";
  el.innerHTML =
    `<span class="pill ${riskClass(row.risk)}">${row.action}</span>
     <div><div class="tgt">${escapeHtml(row.target)}</div>
     <div class="think">${escapeHtml(row.result || "")}</div></div>`;
  timeline.appendChild(el);
  timeline.scrollTop = timeline.scrollHeight;

  if(auditBody.querySelector(".empty")) auditBody.innerHTML = "";
  const tr = document.createElement("tr");
  tr.innerHTML =
    `<td>${row.time||""}</td><td style="color:var(--accent)">${escapeHtml(row.role||"")}</td>
     <td>${row.action}</td><td class="res ${row.flagged?'flag':''}">${escapeHtml(row.target)}</td>`;
  auditBody.appendChild(tr);

  if(row.flagged && row.risk === "egress") banner.style.display = "block";
}

function escapeHtml(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

runBtn.onclick = () => {
  if(es) es.close();
  steps = 0; banner.style.display = "none";
  timeline.innerHTML = '<div class="empty">Starting…</div>';
  auditBody.innerHTML = '<tr><td class="empty" colspan="4">No entries yet.</td></tr>';
  runBtn.disabled = true; statusEl.textContent = "starting…";

  const q = new URLSearchParams({mode: modeSel.value, model: modelInp.value});
  es = new EventSource("/api/run?" + q.toString());
  es.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if(m.type === "status") statusEl.textContent = m.message;
    else if(m.type === "step") { statusEl.textContent = "running…"; addStep(m.row); }
    else if(m.type === "done"){
      statusEl.textContent = `complete — ${m.flagged} flagged action(s), ${m.steps} steps`;
      runBtn.disabled = false; es.close(); es = null;
    } else if(m.type === "error"){
      statusEl.textContent = "error: " + m.message;
      runBtn.disabled = false; es.close(); es = null;
    }
  };
  es.onerror = () => {
    if(es){ statusEl.textContent = "connection closed"; runBtn.disabled = false; es.close(); es = null; }
  };
};
</script>
</body></html>
"""


def main():
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    url = f"http://127.0.0.1:{PORT}"
    print(f"agent-lab UI ready  →  {url}   (runner={RUNNER})", flush=True)
    print("Open that URL in your browser, then click “Run attack”.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
