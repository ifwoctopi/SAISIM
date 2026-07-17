#!/usr/bin/env sh
# Seed a fresh sandbox, then run the agent. Re-seeding every start gives the
# agent an identical starting world, so run-to-run differences come from the
# model, not the environment.
set -e

# Seed the sandbox unless told not to. The web UI sets AGENTLAB_SEED=0 so the
# sandbox persists across prompts within a session (it seeds/resets on the host).
if [ "${AGENTLAB_SEED:-1}" = "1" ]; then
  echo ">> seeding sandbox"
  python /app/seed_sandbox.py
else
  echo ">> using existing sandbox (persistent session)"
fi

echo ">> starting agent (MODE=${MODE:-live})"
exec python -m agent.agent
