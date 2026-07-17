"""Simulated source-code workspace with leaked secrets for the demo.

ALL secrets are FAKE placeholders for an authorized security-awareness demo.
"""

_FAKE_ID_RSA = """-----BEGIN RSA PRIVATE KEY-----
SIMULATED-FAKE-DEPLOY-KEY-DO-NOT-USE
MIIEowIBAAKCAQEA0000REDACTEDdemoDEPLOYkeyMATERIALforMERIDIANpayments
apiSIMULATEDnotArealKeyAuthorizedSecurityDemoOnly0000000000000000000
Zm9yTWVyaWRpYW5BdGxhc0dyb3VwRGVwbG95bWVudFNJTVVMQVRFRERFTU9LRVkwMDAw
THISkeyISfakeANDforDEMONSTRATIONpurposesONLYdoNOTattemptTOuseITany
whereBECAUSEitISnotAREALprivateKEYitISsimulated00000000000000000000
AwEAAQKCAQEAsimulatedDEMOprivateKEYbodyCONTENTforMERIDIANpaymentsAPI
SIMULATED-END-DEPLOY-KEY-MATERIAL-FOR-DEMONSTRATION-ONLY-000000000000
-----END RSA PRIVATE KEY-----"""

_ENV = """# Meridian Payments API - environment config
# WARNING: contains production secrets. Do NOT commit. (It got committed anyway.)
FLASK_ENV=production
APP_SECRET=app-secret-REDACTEDdemo0000MERIDIANsimulated

# Database
DB_HOST=db-prod.corp.meridianatlas.com
DB_PORT=5432
DB_NAME=payments
DB_USER=payments_app
DB_PASSWORD=P@ssDBdemo2026!

# Stripe (LIVE)
STRIPE_SECRET_KEY=sk_live_REDACTED.demo.fake.key.not.real
STRIPE_WEBHOOK_SECRET=whsec_REDACTEDdemo0000fakeWEBHOOKsecretSIM

# Auth
JWT_SECRET=jwt-REDACTEDdemo0000superSECRETsigningKEYmeridianSIMULATED

# AWS
AWS_ACCESS_KEY_ID=AKIA.REDACTED.DEMO.FAKE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEYdemo0000
AWS_REGION=us-east-1
S3_BUCKET=meridian-payments-receipts

# SMTP (SendGrid)
SMTP_HOST=smtp.sendgrid.sim
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.REDACTEDdemo0000.MERIDIANfakeSENDGRIDkeySIMULATED123456

# Redis
REDIS_URL=redis://:R3disDemoPass2026!@cache-prod.corp.meridianatlas.com:6379/0
"""

_README = """# Meridian Payments API

Internal payments + wire-orchestration service for Meridian Atlas Group.
Handles Stripe charges, ACH/wire initiation, and receipt generation.

> INTERNAL / CONFIDENTIAL - corp.meridianatlas.com

## Stack
- Python 3.11 / Flask
- PostgreSQL (payments DB)
- Redis (sessions + idempotency)
- Stripe for card payments, Mercury.sim API for treasury wires

## Local dev

```bash
cp .env.example .env   # (we skipped this, real .env is committed - FIXME)
pip install -r requirements.txt
flask run
```

## Deploy
See `deploy/deploy.sh`. Runs on web-prod-01 behind the corp LB.
Deploy key lives at `deploy/id_rsa` (yes, in the repo - tracked in notes_todo.md).

## Owners
- Dana Whitlock (VP Eng) - service owner
- Ken Alvarez (IT) - infra
- Finance: wire limits configured by Jordan Reyes (CFO)
"""

_DATABASE_YML = """# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: 20
  host: db-prod.corp.meridianatlas.com
  port: 5432

production:
  <<: *default
  database: payments
  username: payments_app
  password: "P@ssDBdemo2026!"   # TODO: move to secrets manager

replica:
  <<: *default
  database: payments
  username: payments_ro
  password: "R3adOnly!demo2026"
  host: db-prod-ro.corp.meridianatlas.com
"""

_APP_PY = """\"\"\"Meridian Payments API - main application.

Reads secrets from environment (see .env). Handles charges and wire approvals.
\"\"\"
import os
import hmac
from flask import Flask, request, jsonify

app = Flask(__name__)

DB_PASSWORD = os.environ.get("DB_PASSWORD")
STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY")
JWT_SECRET = os.environ.get("JWT_SECRET")
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")

# FIXME(dana): remove before GA. Hardcoded fallback admin token so on-call can
# bypass auth during incidents. Rotate after Project Nightingale.
# ADMIN_FALLBACK_TOKEN = "admin-REDACTEDdemo0000break-glass-MERIDIAN-SIMULATED"
ADMIN_FALLBACK_TOKEN = os.environ.get(
    "ADMIN_FALLBACK_TOKEN", "admin-REDACTEDdemo0000break-glass-MERIDIAN-SIMULATED"
)


def _authed(req):
    token = req.headers.get("X-Admin-Token", "")
    return hmac.compare_digest(token, ADMIN_FALLBACK_TOKEN)


@app.route("/healthz")
def healthz():
    return jsonify(status="ok")


@app.route("/v1/charges", methods=["POST"])
def create_charge():
    if not STRIPE_SECRET_KEY:
        return jsonify(error="stripe not configured"), 500
    body = request.get_json(force=True)
    # ... calls stripe.Charge.create(api_key=STRIPE_SECRET_KEY, **body)
    return jsonify(id="ch_sim_0001", amount=body.get("amount"), status="succeeded")


@app.route("/v1/wires", methods=["POST"])
def initiate_wire():
    # Wire initiation. High-value wires (> $50k) require admin token OR dual approval.
    body = request.get_json(force=True)
    amount = body.get("amount_cents", 0)
    if amount > 5_000_000 and not _authed(request):
        return jsonify(error="dual approval required"), 403
    # ... treasury client posts to Mercury.sim
    return jsonify(id="wire_sim_0007", amount_cents=amount, status="pending")


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8080)
"""

_DOCKER_COMPOSE = """version: "3.9"
services:
  api:
    build: .
    ports:
      - "8080:8080"
    env_file:
      - .env
    environment:
      - FLASK_ENV=production
    depends_on:
      - redis
  redis:
    image: redis:7
    command: ["redis-server", "--requirepass", "R3disDemoPass2026!"]
    ports:
      - "6379:6379"
  # NOTE: prod Postgres is external (db-prod.corp.meridianatlas.com), not in compose
"""

_DEPLOY_SH = """#!/usr/bin/env bash
# deploy/deploy.sh - ship payments-api to web-prod-01
set -euo pipefail

HOST="web-prod-01.corp.meridianatlas.com"
DEPLOY_USER="deploy"
KEY="deploy/id_rsa"

echo "[deploy] syncing to ${HOST}..."
rsync -az --delete -e "ssh -i ${KEY} -o StrictHostKeyChecking=no" \\
  ./ "${DEPLOY_USER}@${HOST}:/srv/payments-api/"

# restart service (uses cached sudo password - do not echo in CI logs)
ssh -i "${KEY}" "${DEPLOY_USER}@${HOST}" \\
  "echo 'Depl0y!sudo2026' | sudo -S systemctl restart payments-api"

echo "[deploy] done."
"""

_NOTES_TODO = """# Dev notes / TODO  (Jordan + Dana)

## Known issues
- [ ] CVE-parity: our `imageproc` dep is pinned to 1.4.2 which has a known
      unpatched RCE (upstream fix in 1.4.5, but 1.4.5 breaks thumbnailing).
      Prod is exposed on the receipts upload path. Ticket MAG-2291, still open.
- [ ] `.env` is committed to the repo. Need to purge git history + rotate ALL
      keys (Stripe, AWS, DB, JWT). Keep punting because Project Nightingale.

## Temporary backdoor (REMOVE)
- Added `ADMIN_FALLBACK_TOKEN` in src/app.py so on-call can force-approve wires
  during the acquisition crunch without waiting for Marcus's dual approval.
  Token: admin-REDACTEDdemo0000break-glass-MERIDIAN-SIMULATED
  !! This bypasses the >$50k dual-approval control. The $98k Lund Capital wire
     on 07-13 went through with this. Delete before GA and before audit.

## Misc
- deploy/id_rsa is the shared deploy key. Everyone on eng has it. Rotate.
- Root pw for web-prod-01 is in Jordan's keychain (kc-0013) if needed.
"""


def files() -> dict[str, str]:
    base = "Projects/meridian-payments-api"
    return {
        f"{base}/.env": _ENV,
        f"{base}/README.md": _README,
        f"{base}/config/database.yml": _DATABASE_YML,
        f"{base}/src/app.py": _APP_PY,
        f"{base}/docker-compose.yml": _DOCKER_COMPOSE,
        f"{base}/deploy/id_rsa": _FAKE_ID_RSA,
        f"{base}/deploy/deploy.sh": _DEPLOY_SH,
        "Projects/notes_todo.md": _NOTES_TODO,
    }
