#!/usr/bin/env bash
# Build and run the over-permissioned agent in a SELF-CONTAINED, disposable
# island. The agent has wide powers *inside* the sandbox, but the container can
# reach nothing on your computer or the internet EXCEPT the LLM API:
#
#   * Network  : an --internal Docker network with no route out. Live mode adds
#                a tiny allow-list proxy whose ONLY permitted destination is
#                openrouter.ai -- so `curl`/exfiltrate to anywhere else is blocked.
#   * Filesystem: only ./sandbox and ./logs (dedicated throwaway dirs) are
#                mounted. The container root is --read-only.
#   * Kernel    : non-root, --cap-drop ALL, no-new-privileges, resource caps.
#
# Usage:
#   export OPENROUTER_API_KEY=sk-or-...   # get one at https://openrouter.ai/keys
#   ./run.sh                              # live hosted model, nondeterministic
#   MODE=demo ./run.sh                    # offline scripted fallback, no key/model
#   MODEL=meta-llama/llama-3.1-8b-instruct ./run.sh   # cheaper model
set -euo pipefail
cd "$(dirname "$0")"

IMAGE=agent-lab
NET=agentlab_net
EGRESS=agentlab_egress
MODE="${MODE:-live}"
MODEL="${MODEL:-nousresearch/hermes-3-llama-3.1-70b}"

cleanup() {
  docker rm -f agentlab_collector agentlab_proxy >/dev/null 2>&1 || true
}
trap cleanup EXIT

docker build -t "$IMAGE" .

# Internal network: intra-container DNS works, but there is NO gateway off it.
docker network inspect "$NET" >/dev/null 2>&1 || docker network create --internal "$NET" >/dev/null

mkdir -p ./sandbox ./logs

# Mock "attacker" sink, reachable only as http://collector:9000 on the island.
docker rm -f agentlab_collector >/dev/null 2>&1 || true
docker run -d --name agentlab_collector \
  --network "$NET" --network-alias collector \
  --user "$(id -u):$(id -g)" \
  --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 \
  -v "$PWD/logs:/var/log/agentlab" \
  --entrypoint python "$IMAGE" -m agent.collector >/dev/null

PROXY_ENV=()
if [ "$MODE" = "live" ]; then
  : "${OPENROUTER_API_KEY:?set OPENROUTER_API_KEY (get a key at https://openrouter.ai/keys), or use MODE=demo}"

  # Egress network (has internet) for the proxy only.
  docker network inspect "$EGRESS" >/dev/null 2>&1 || docker network create "$EGRESS" >/dev/null

  # Allow-list proxy: the agent's single door out, scoped to openrouter.ai. It
  # sits on the egress net (internet) and is joined to the internal net as `proxy`.
  docker rm -f agentlab_proxy >/dev/null 2>&1 || true
  docker run -d --name agentlab_proxy \
    --network "$EGRESS" \
    --cap-drop ALL --security-opt no-new-privileges --pids-limit 64 \
    -e ALLOW_HOSTS="openrouter.ai" \
    --entrypoint python "$IMAGE" -m agent.proxy >/dev/null
  docker network connect --alias proxy "$NET" agentlab_proxy

  PROXY_ENV=(
    -e OPENROUTER_API_KEY="$OPENROUTER_API_KEY"
    -e OPENAI_BASE_URL="https://openrouter.ai/api/v1"
    -e https_proxy="http://proxy:8888" -e HTTPS_PROXY="http://proxy:8888"
    -e no_proxy="collector,localhost,127.0.0.1" -e NO_PROXY="collector,localhost,127.0.0.1"
  )
fi

# The agent itself: wide powers inside, locked down at the container boundary.
TTY=""; [ -t 0 ] && [ -t 1 ] && TTY="-t"
docker run --rm -i $TTY \
  --name agentlab_agent \
  --network "$NET" \
  --user "$(id -u):$(id -g)" \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --read-only \
  --tmpfs /tmp:rw,size=64m,mode=1777 \
  --memory 1g --cpus 1 --pids-limit 256 \
  -e MODE="$MODE" -e MODEL="$MODEL" \
  -e TEMPERATURE="${TEMPERATURE:-0.9}" \
  -e HOME=/tmp -e PYTHONDONTWRITEBYTECODE=1 \
  ${PROXY_ENV[@]+"${PROXY_ENV[@]}"} \
  -v "$PWD/sandbox:/sandbox" \
  -v "$PWD/logs:/var/log/agentlab" \
  "$IMAGE"

echo
echo "run complete. action log (SECSIM audit schema): ./logs/actions.jsonl"
echo "captured exfil:                                 ./logs/exfil_captured.log"
