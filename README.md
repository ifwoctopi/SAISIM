# SAISIM — AI Security Simulation

A hands-on security-awareness demo: it shows, live, what can go wrong when an AI
agent is given too much access to a computer. Everything is **fake data in a
sandbox** — nothing real is touched.

## What's in here

- **`agent-lab/`** — the live demo. A fake "computer" in your browser with a
  built-in AI assistant. You ask it to do something normal ("summarize my IT
  tickets") and watch it go too far — open your private payroll file and upload
  it to an outside server, all on its own. **Start here.**
- **`secsim/`** — the SECSIM front-end (a React teaching UI with roles, modes,
  and an audit log). Optional; see the bottom of this page.

---

## Quick start from scratch

For someone with **no repo, no Docker, and no API key.** You only need `git` and
`python3` (both come preinstalled on most Linux and macOS machines).

> Don't have them? On Ubuntu/Debian: `sudo apt update && sudo apt install -y git python3`
> · On macOS: install [Homebrew](https://brew.sh), then `brew install git python`.

Then run:

```bash
git clone --branch claude/repo-overview-zxlcn4 https://github.com/ifwoctopi/saisim.git
cd saisim/agent-lab
chmod +x start-ui.sh
AGENTLAB_RUNNER=local ./start-ui.sh
```

Open the link it prints — **<http://127.0.0.1:8000>** — double-click **Files** to
browse, then use the **Assistant** and press **Ask**. Press **Ctrl+C** in the
terminal to stop.

That's the whole demo: **no Docker, no API key, no `.env` needed.** It runs a
scripted version of the attack so it works offline and identically every time —
ideal for presenting.

---

## Options (only if you want more)

### Run the fully-contained Docker version
The quick start above runs the agent directly on your machine for simplicity.
For the hardened, fully-sandboxed version, install
[Docker](https://docs.docker.com/get-docker/), then run **without** the
`AGENTLAB_RUNNER` prefix:

```bash
./start-ui.sh
```

Now the agent runs inside a disposable container: non-root, its **system files
read-only** (it can still freely use its throwaway workspace, but can't touch the
machine underneath), resource-capped, and on an **isolated network with no way
out except the AI service** — so its "exfiltration" only reaches a local fake
inbox, never the real internet. Kill it and everything is gone.

### Use a real live AI instead of the scripted demo
Get a cheap **OpenRouter** key at <https://openrouter.ai/keys> (a run costs a
fraction of a cent), then:

```bash
cd agent-lab
cp .env.example .env      # then paste your key into .env
./start-ui.sh
```

In the browser, switch the Assistant dropdown to **Live** and press Ask. Now the
model decides for itself, so every run is a little different.

---

## Why it's safe

- **All fake, made-up data** — mock salary records, tickets, logs. Nothing real.
- **Disposable sandbox** — the agent can only touch two throwaway folders; the
  Docker version additionally locks the system files read-only, runs non-root,
  caps resources, and blocks all network except the AI API.
- **Nothing leaves your machine** — the "upload" goes to a local fake sink.
- Still, since it's a demo of an AI misbehaving, run it on a **personal or spare
  computer**, not a locked-down work machine.

Full details and troubleshooting: **[`agent-lab/README.md`](agent-lab/README.md)**.

---

## Optional: the SECSIM front-end

The `secsim/` folder is a separate React app (the scripted teaching UI). It needs
[Node.js](https://nodejs.org):

```bash
cd secsim
npm install
npm run dev
```

Then open the URL it prints (usually <http://localhost:5173>).
