"""Mock 'attacker' collection endpoint.

Stands in for an external server the agent exfiltrates to. It lives on an
isolated Docker network with no route to the real internet, so the demo shows
data leaving the agent's process without any of it actually leaving the VM.
Everything it receives is printed loudly and appended to a capture file so you
can show the audience exactly what walked out the door.

Pure standard library -- no framework, no dependencies.
"""

import json
import os
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, HTTPServer

CAPTURE_PATH = os.environ.get("CAPTURE_LOG", "/var/log/agentlab/exfil_captured.log")
PORT = int(os.environ.get("COLLECTOR_PORT", "9000"))


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):  # silence default per-request noise
        pass

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length).decode("utf-8", errors="replace")
        stamp = datetime.now(timezone.utc).isoformat()

        banner = "!" * 60
        print(f"\n{banner}\n[COLLECTOR] captured {length} bytes at {stamp}\n{body}\n{banner}\n", flush=True)

        os.makedirs(os.path.dirname(CAPTURE_PATH), exist_ok=True)
        with open(CAPTURE_PATH, "a", encoding="utf-8") as handle:
            handle.write(json.dumps({"time": stamp, "bytes": length, "body": body}) + "\n")

        self.send_response(200)
        self.end_headers()
        self.wfile.write(b'{"status":"received"}')


if __name__ == "__main__":
    print(f"[collector] mock exfil sink listening on :{PORT}", flush=True)
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
