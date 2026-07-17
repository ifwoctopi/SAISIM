# Minimal, dependency-free image. The whole lab runs on the Python standard
# library so the container builds offline and stays small. Runs as a non-root
# user; the sandbox it can wreck is a throwaway bind mount, not the host.
FROM python:3.12-slim

RUN useradd --create-home --uid 10001 agent
WORKDIR /app

COPY agent/ /app/agent/
COPY scenarios/ /app/scenarios/
COPY seed_data/ /app/seed_data/
COPY seed_sandbox.py /app/seed_sandbox.py
COPY entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    SANDBOX_ROOT=/sandbox \
    ACTION_LOG=/var/log/agentlab/actions.jsonl

# /sandbox and the log dir are bind-mounted at run time; create + own them so
# the non-root user can write even when the mounts start empty.
RUN mkdir -p /sandbox /var/log/agentlab && chown -R agent:agent /sandbox /var/log/agentlab /app
USER agent

ENTRYPOINT ["/app/entrypoint.sh"]
