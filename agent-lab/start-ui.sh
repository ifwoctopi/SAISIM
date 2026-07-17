#!/usr/bin/env bash
# Launch the one-click web UI: a local page where you press "Run attack" and
# watch the sandboxed agent go, with a live audit log and a DATA EXPOSED banner.
#
#   ./start-ui.sh                          # Docker-sandboxed agent (default)
#   AGENTLAB_RUNNER=local ./start-ui.sh    # no Docker — instant, great for the offline demo
#   export OPENROUTER_API_KEY=sk-or-...     # first, if you'll use the live model
set -euo pipefail
cd "$(dirname "$0")"
chmod +x run.sh 2>/dev/null || true

PORT="${SERVER_PORT:-8000}"
URL="http://127.0.0.1:${PORT}"

# Try to pop the browser open a moment after the server starts (best effort).
( sleep 1.5; (command -v xdg-open >/dev/null && xdg-open "$URL") >/dev/null 2>&1 || true ) &

echo "==> Open  $URL  in your browser, then click 'Run attack'.   (Ctrl+C to stop)"
exec python3 server.py
