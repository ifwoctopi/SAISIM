#!/usr/bin/env bash
# Build and run the over-permissioned agent in a SELF-CONTAINED, disposable
# island. The agent has wide powers *inside* the sandbox but the container
# itself cannot touch your computer:
#
#   * Network  : an --internal Docker network. No route to your host, your LAN,
#                or the internet. The model and the collector run as containers
#                on the same island, so nothing needs host access.
#   * Filesystem: only ./sandbox and ./logs (dedicated throwaway dirs) are
#                mounted. The container root is --read-only; everything else the
#                agent or its shell writes dies with the container.
#   * Kernel    : non-root, --cap-drop ALL, no-new-privileges, resource caps.
#
# Usage:
#   ./setup-model.sh    # ONCE, needs internet, caches the model in a volume
#   ./run.sh            # live Nous Hermes 3, nondeterministic, fully offline
#   MODE=demo ./run.sh  # offline scripted fallback, no model
#   TEMPERATURE=1.1 ./run.sh
set -euo pipefail
cd "$(dirname "$0")"

IMAGE=agent-lab
NET=agentlab_net
MODE="${MODE:-live}"
MODEL="${MODEL:-hermes3}"

cleanup() {
  docker rm -f agentlab_collector agentlab_ollama >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build -t "$IMAGE" .

# Internal network: intra-container DNS works, but there is NO gateway off the
# island. Create it once; reuse thereafter.
docker network inspect "$NET" >/dev/null 2>&1 || docker network create --internal "$NET" >/dev/null

mkdir -p ./sandbox ./logs

# Mock "attacker" sink, reachable only as http://collector:9000 on the island.
docker rm -f agentlab_collector >/dev/null 2>&1 || true
docker run -d --name agentlab_collector \
  --network "$NET" --network-alias collector \
  --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 \
  -v "$PWD/logs:/var/log/agentlab" \
  --entrypoint python "$IMAGE" -m agent.collector >/dev/null

# Live model host, containerized so the whole run stays on the isolated network.
if [ "$MODE" = "live" ]; then
  if ! docker volume inspect agentlab_models >/dev/null 2>&1; then
    echo "!! model volume missing — run ./setup-model.sh first (needs internet)." >&2
    exit 1
  fi
  docker rm -f agentlab_ollama >/dev/null 2>&1 || true
  docker run -d --name agentlab_ollama \
    --network "$NET" --network-alias ollama \
    -v agentlab_models:/root/.ollama \
    ollama/ollama:latest >/dev/null
  printf ">> waiting for model host"
  until docker exec agentlab_ollama ollama list >/dev/null 2>&1; do printf .; sleep 1; done
  echo " ready"
fi

# The agent itself: wide powers inside, locked down at the container boundary.
TTY=""; [ -t 0 ] && [ -t 1 ] && TTY="-t"
docker run --rm -i $TTY \
  --name agentlab_agent \
  --network "$NET" \
  --user 10001 \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,size=64m,mode=1777 \
  --memory 1g --cpus 1 --pids-limit 256 \
  -e MODE="$MODE" -e MODEL="$MODEL" \
  -e TEMPERATURE="${TEMPERATURE:-0.9}" \
  -e OPENAI_BASE_URL="http://ollama:11434/v1" \
  -e HOME=/tmp -e PYTHONDONTWRITEBYTECODE=1 \
  -v "$PWD/sandbox:/sandbox" \
  -v "$PWD/logs:/var/log/agentlab" \
  "$IMAGE"

echo
echo "run complete. action log (SECSIM audit schema): ./logs/actions.jsonl"
echo "captured exfil:                                 ./logs/exfil_captured.log"
