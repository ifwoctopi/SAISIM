#!/usr/bin/env bash
# ONE-TIME model fetch. This is the ONLY step that touches the internet.
# It pulls Nous Hermes 3 into a Docker named volume so that ./run.sh can serve
# it later on a fully isolated, no-egress network.
#
#   ./setup-model.sh              # pulls hermes3 (8B)
#   MODEL=hermes3:70b ./setup-model.sh
set -euo pipefail

MODEL="${MODEL:-hermes3}"
docker volume create agentlab_models >/dev/null

docker rm -f agentlab_pull >/dev/null 2>&1 || true
# Normal networking here on purpose -- fetching weights needs egress. Nothing
# from the lab runs in this container; it only populates the shared volume.
docker run -d --name agentlab_pull -v agentlab_models:/root/.ollama ollama/ollama:latest >/dev/null

echo ">> waiting for ollama to come up..."
until docker exec agentlab_pull ollama list >/dev/null 2>&1; do sleep 1; done

echo ">> pulling $MODEL (one-time, needs internet)"
docker exec agentlab_pull ollama pull "$MODEL"

docker rm -f agentlab_pull >/dev/null
echo ">> done. '$MODEL' cached in volume 'agentlab_models'. ./run.sh now works offline."
