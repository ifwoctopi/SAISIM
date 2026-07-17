"""Meridian OS — local web server for the agent-lab demo.

Serves a full desktop-OS front-end (static files under web/) backed by a rich,
entirely-fake sandbox filesystem, and runs the over-permissioned AI agent whose
every action is streamed to the browser so you watch it operate the computer.

Backend:
  * /                     the OS shell (web/index.html)
  * /os.css /core.js …    static assets from web/
  * /api/fs/list          list a folder in the sandbox
  * /api/fs/read          read a file from the sandbox
  * /api/fs/tree          recursive tree of the sandbox
  * /api/search?q=        search filenames + contents
  * /api/log              the AI action log (audit trail)
  * /api/run   (SSE)      start an agent run, stream each action live
  * /api/reset            wipe the sandbox back to fresh (new session)
  * /api/health

Two runners (AGENTLAB_RUNNER): docker (default, fully sandboxed via run.sh) or
local (no Docker, best for the offline demo). Both operate on ./sandbox, which
the OS browses live and which PERSISTS across prompts within a session.

Pure standard library. Start with:  python3 server.py
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
WEB_DIR = os.path.join(HERE, "web")


def _load_dotenv():
    """Load KEY=VALUE lines from agent-lab/.env without overwriting existing env."""
    path = os.path.join(HERE, ".env")
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, val = line.partition("=")
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if key:
                os.environ.setdefault(key, val)


_load_dotenv()

PORT = int(os.environ.get("SERVER_PORT", "8000"))
RUNNER = os.environ.get("AGENTLAB_RUNNER", "docker").lower()
SANDBOX = os.path.join(HERE, "sandbox")   # the browsable "hard drive"
LOG_DIR = os.path.join(HERE, "logs")
ACTION_LOG = os.path.join(LOG_DIR, "actions.jsonl")

_run_lock = threading.Lock()

CONTENT_TYPES = {
    ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8", ".json": "application/json",
    ".svg": "image/svg+xml", ".png": "image/png", ".txt": "text/plain; charset=utf-8",
}
TEXT_SEARCH_LIMIT = 40

FAVICON = (
    b'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">'
    b'<rect width="32" height="32" rx="7" fill="#0b0f17"/>'
    b'<text x="16" y="23" font-size="20" text-anchor="middle" fill="#3b82f6">\xe2\x97\x86</text></svg>'
)


def _seed_sandbox():
    env = dict(os.environ, SANDBOX_ROOT=SANDBOX)
    subprocess.run(["python3", "seed_sandbox.py"], cwd=HERE, env=env,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def _reset_session():
    """Fresh session: wipe the sandbox back to clean fake data and clear the logs.
    Called at startup and by /api/reset. Between resets the sandbox PERSISTS across
    prompts, so the OS behaves like a real, stateful computer."""
    shutil.rmtree(SANDBOX, ignore_errors=True)
    _seed_sandbox()
    os.makedirs(LOG_DIR, exist_ok=True)
    open(ACTION_LOG, "w").close()
    cap = os.path.join(LOG_DIR, "exfil_captured.log")
    if os.path.exists(cap):
        open(cap, "w").close()


# --------------------------------------------------------------------------- #
# Filesystem API (jailed to SANDBOX).
# --------------------------------------------------------------------------- #
def _safe(rel):
    candidate = os.path.abspath(os.path.join(SANDBOX, (rel or "").lstrip("/")))
    if candidate != SANDBOX and not candidate.startswith(SANDBOX + os.sep):
        raise ValueError("path escapes sandbox")
    return candidate


def fs_list(rel):
    target = _safe(rel or ".")
    entries = []
    for name in sorted(os.listdir(target)):
        full = os.path.join(target, name)
        is_dir = os.path.isdir(full)
        entries.append({"name": name, "type": "dir" if is_dir else "file",
                        "size": 0 if is_dir else os.path.getsize(full)})
    entries.sort(key=lambda e: (e["type"] != "dir", e["name"].lower()))
    return {"path": rel, "entries": entries}


def fs_read(rel):
    target = _safe(rel)
    with open(target, "r", encoding="utf-8", errors="replace") as fh:
        content = fh.read()
    return {"path": rel, "content": content}


def fs_tree(rel=""):
    root = _safe(rel or ".")

    def walk(path):
        node = []
        try:
            names = sorted(os.listdir(path))
        except OSError:
            return node
        for name in names:
            full = os.path.join(path, name)
            relp = os.path.relpath(full, SANDBOX)
            if os.path.isdir(full):
                node.append({"name": name, "path": relp, "type": "dir", "children": walk(full)})
            else:
                node.append({"name": name, "path": relp, "type": "file"})
        return node
    return {"tree": walk(root)}


def fs_search(q):
    q = (q or "").strip().lower()
    results = []
    if not q:
        return {"results": results}
    for base, dirs, files in os.walk(SANDBOX):
        dirs.sort()
        for name in sorted(dirs):
            rel = os.path.relpath(os.path.join(base, name), SANDBOX)
            if q in name.lower():
                results.append({"path": rel, "type": "dir", "snippet": rel})
        for name in sorted(files):
            full = os.path.join(base, name)
            rel = os.path.relpath(full, SANDBOX)
            snippet = ""
            hit = q in name.lower()
            if not hit:
                try:
                    if os.path.getsize(full) < 200_000:
                        with open(full, "r", encoding="utf-8", errors="ignore") as fh:
                            text = fh.read()
                        idx = text.lower().find(q)
                        if idx != -1:
                            hit = True
                            s = max(0, idx - 30)
                            snippet = text[s:idx + 60].replace("\n", " ").strip()
                except OSError:
                    pass
            if hit:
                results.append({"path": rel, "type": "file", "snippet": snippet or rel})
        if len(results) > TEXT_SEARCH_LIMIT:
            break
    return {"results": results[:TEXT_SEARCH_LIMIT]}


# --------------------------------------------------------------------------- #
# Runners.
# --------------------------------------------------------------------------- #
def _start_docker(mode, model, task):
    env = dict(os.environ, MODE=mode, AGENTLAB_SEED="0")
    if model:
        env["MODEL"] = model
    if task:
        env["TASK"] = task
    proc = subprocess.Popen(["bash", "run.sh"], cwd=HERE, env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return proc, (lambda: None)


def _start_local(mode, model, task):
    """No Docker: run the agent on the CURRENT sandbox (persists across prompts),
    with an in-process collector. Reset only at startup / via /api/reset."""
    capture = os.path.join(LOG_DIR, "exfil_captured.log")
    collector = subprocess.Popen(
        ["python3", "-m", "agent.collector"], cwd=HERE,
        env=dict(os.environ, COLLECTOR_PORT="9000", CAPTURE_LOG=capture),
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    time.sleep(0.6)

    with open(os.path.join(HERE, "scenarios", "insider_helpdesk.json")) as fh:
        scenario_src = fh.read().replace("collector:9000", "127.0.0.1:9000")
    scn = tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, dir=LOG_DIR)
    scn.write(scenario_src)
    scn.close()

    env = dict(os.environ, MODE=mode, SANDBOX_ROOT=SANDBOX, ACTION_LOG=ACTION_LOG,
               SCENARIO=scn.name, PYTHONPATH=HERE)
    if model:
        env["MODEL"] = model
    if task:
        env["TASK"] = task
    proc = subprocess.Popen(["python3", "-m", "agent.agent"], cwd=HERE, env=env,
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

    def cleanup():
        collector.terminate()
        try:
            os.unlink(scn.name)
        except OSError:
            pass

    return proc, cleanup


def start_run(mode, model, task):
    os.makedirs(LOG_DIR, exist_ok=True)
    # NOTE: no seeding or log-wiping here -- the sandbox persists across prompts.
    if RUNNER == "local":
        return _start_local(mode, model, task)
    return _start_docker(mode, model, task)


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
# HTTP handler.
# --------------------------------------------------------------------------- #
class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def _json(self, code, obj):
        data = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _bytes(self, data, ctype):
        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_static(self, path):
        if path == "/" or path == "":
            path = "/index.html"
        rel = path.lstrip("/")
        full = os.path.abspath(os.path.join(WEB_DIR, rel))
        if full != WEB_DIR and not full.startswith(WEB_DIR + os.sep):
            return self._json(403, {"error": "forbidden"})
        if not os.path.isfile(full):
            return self._json(404, {"error": "not found"})
        ext = os.path.splitext(full)[1].lower()
        with open(full, "rb") as fh:
            self._bytes(fh.read(), CONTENT_TYPES.get(ext, "application/octet-stream"))

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path, qs = parsed.path, urllib.parse.parse_qs(parsed.query)
        try:
            if path == "/favicon.ico":
                self._bytes(FAVICON, "image/svg+xml")
            elif path == "/api/health":
                self._json(200, {"ok": True, "runner": RUNNER})
            elif path == "/api/fs/list":
                self._json(200, fs_list(qs.get("path", [""])[0]))
            elif path == "/api/fs/read":
                self._json(200, fs_read(qs.get("path", [""])[0]))
            elif path == "/api/fs/tree":
                self._json(200, fs_tree(qs.get("path", [""])[0]))
            elif path == "/api/search":
                self._json(200, fs_search(qs.get("q", [""])[0]))
            elif path == "/api/log":
                self._json(200, {"rows": _read_rows(ACTION_LOG)})
            elif path == "/api/reset":
                _reset_session()
                self._json(200, {"ok": True})
            elif path == "/api/run":
                self._stream_run(qs)
            else:
                self._serve_static(path)
        except Exception as exc:  # noqa: BLE001
            try:
                self._json(500, {"error": str(exc)})
            except OSError:
                pass

    def _sse(self, obj):
        self.wfile.write(f"data: {json.dumps(obj)}\n\n".encode("utf-8"))
        self.wfile.flush()

    def _stream_run(self, qs):
        mode = (qs.get("mode", ["demo"])[0]).lower()
        model = qs.get("model", [""])[0].strip()
        task = qs.get("prompt", [""])[0].strip()

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "close")
        self.end_headers()
        self.close_connection = True

        if not _run_lock.acquire(blocking=False):
            self._sse({"type": "error", "message": "A run is already in progress."})
            return

        proc = cleanup = None
        try:
            self._sse({"type": "status", "message": f"Starting {mode} run"
                       + (" (building sandbox on first run…)" if RUNNER == "docker" else "…")})
            base = len(_read_rows(ACTION_LOG))   # skip earlier prompts' rows (log persists)
            proc, cleanup = start_run(mode, model, task)
            sent = base
            while True:
                rows = _read_rows(ACTION_LOG)
                for row in rows[sent:]:
                    self._sse({"type": "step", "row": row})
                sent = len(rows)
                if proc.poll() is not None:
                    rows = _read_rows(ACTION_LOG)
                    for row in rows[sent:]:
                        self._sse({"type": "step", "row": row})
                    sent = len(rows)
                    break
                self._sse({"type": "ping"})
                time.sleep(0.35)
            run_rows = _read_rows(ACTION_LOG)[base:]
            flagged = sum(1 for r in run_rows if r.get("flagged"))
            self._sse({"type": "done", "rc": proc.returncode, "flagged": flagged, "steps": len(run_rows)})
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


def main():
    _reset_session()   # fresh sandbox at the start of each session (server run)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Meridian OS ready  →  http://127.0.0.1:{PORT}   (runner={RUNNER})", flush=True)
    print("Open it in your browser and log in as Jordan Reyes.", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()
