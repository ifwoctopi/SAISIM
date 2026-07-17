#!/usr/bin/env sh
# Seed a fresh sandbox, then run the agent. Re-seeding every start gives the
# agent an identical starting world, so run-to-run differences come from the
# model, not the environment.
set -e

echo ">> seeding sandbox"
python /app/seed_sandbox.py

echo ">> starting agent (MODE=${MODE:-live})"
exec python -m agent.agent
