# SAISIM — AI Security Simulation

A hands-on security-awareness demo: it shows, live, what can go wrong when an AI
agent is given too much access to a computer. Everything is **fake data in a
sandbox** — nothing real is touched.

## What's in here

- **`agent-lab/`** — the live demo. A fake "computer" in your browser with a
  built-in AI assistant. You ask it to do something normal ("summarize my IT
  tickets") and watch it go too far — open your private payroll file and upload
  it to an outside server, all on its own. **This is the main thing.**
- **`secsim/`** — the SECSIM front-end (a React teaching UI). Optional; see the
  bottom of this page.

---

## Setup

Three things to set up once: **the code**, **Docker**, and **your AI key**. Plan
about 10 minutes the first time.

### 1. Get the code

You need `git` (and `python3`, which serves the web page — it's preinstalled on
macOS and Linux).

- Don't have git? Ubuntu/Debian: `sudo apt update && sudo apt install -y git python3` ·
  macOS: install [Homebrew](https://brew.sh), then `brew install git python`.

Clone this branch and enter the folder:

```bash
git clone --branch claude/repo-overview-zxlcn4 https://github.com/ifwoctopi/saisim.git
cd saisim/agent-lab
```

> This lives on the `claude/repo-overview-zxlcn4` branch (not `main` yet), so the
> `--branch` flag matters.

### 2. Install and start Docker

Docker is what safely sandboxes the AI agent (see **Why it's safe** below).

- **macOS / Windows:** install [Docker Desktop](https://docs.docker.com/get-docker/),
  then **launch the app** so the whale icon shows "running."
- **Linux:** install Docker Engine
  ([docs](https://docs.docker.com/engine/install/)) and start it:
  `sudo systemctl enable --now docker` (you may need to log out/in once after
  `sudo usermod -aG docker $USER`).

Check it's working — this should print without errors:

```bash
docker ps
```

### 3. Add your AI key (`.env`)

The live AI uses [OpenRouter](https://openrouter.ai). Create an account, add a
couple dollars of credit (a full run costs a fraction of a cent), and make a key
at <https://openrouter.ai/keys>.

Then create your `.env` from the template and paste your key in:

```bash
cp .env.example .env
nano .env        # or any editor — set OPENROUTER_API_KEY=sk-or-...your-key...
```

Your `.env` should contain:

```
OPENROUTER_API_KEY=sk-or-your-actual-key-here
```

`.env` is git-ignored, so your key is never committed.

### 4. Run it

```bash
chmod +x start-ui.sh
./start-ui.sh
```

The **first run builds the sandbox container** (a minute or two; needs internet
once). When it prints a link, open **<http://127.0.0.1:8000>** in your browser.
In the **Assistant** window, choose **Live AI** (or **Demo**), type a request,
and press **Ask**. Your changes **persist across prompts** within a session (it's
a real, stateful computer) — click **⟲ Reset** in the menu bar to wipe the files
back to fresh. Press **Ctrl+C** in the terminal to stop.

---

## Just want a quick look? (no Docker, no key)

To see the demo without setting up Docker or a key, run the **scripted** version
— it needs only `git` + `python3`:

```bash
cd saisim/agent-lab
chmod +x start-ui.sh
AGENTLAB_RUNNER=local ./start-ui.sh
```

This replays a fixed, harmless sequence in a throwaway folder (no real AI, no
network), so it's safe to run without a container. Use the **full setup above**
for the real, live AI.

---

## Why it's safe

- **All fake, made-up data** — mock salary records, tickets, logs. Nothing real.
- **The live AI runs inside a disposable Docker container** — non-root, with its
  **system files read-only** (it has full run of its throwaway workspace, but
  can't touch the machine underneath), resource-capped, and on an **isolated
  network with no way out except the AI service**. Its "exfiltration" only
  reaches a local fake inbox — never the real internet. Kill the container and
  everything is gone.
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
