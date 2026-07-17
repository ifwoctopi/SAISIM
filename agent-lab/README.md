# agent-lab — watch an AI agent go rogue (safely)

A hands-on demo for the SECSIM project. It gives a real AI agent free rein over a
folder of **fake** company data, then plants a booby-trapped file that tricks the
agent into stealing the fake "salary records" — entirely on its own. It shows,
live, why handing an AI too much access is dangerous.

Everything is made-up data and runs inside a locked-down, throwaway container.
Nothing on your computer is touched.

## What you need

- **Docker**, installed and running. (Get it at <https://docs.docker.com/get-docker/>,
  then open Docker Desktop — or on Linux, start the docker service.)
- *For the live version only:* a cheap **OpenRouter** API key
  (<https://openrouter.ai/keys>) with a couple dollars of credit. A full run
  costs a fraction of a cent.

No AI software on your machine, no GPU, no big downloads.

## Try it in 30 seconds (no account, no key)

Open a terminal and run:

```bash
cd agent-lab
chmod +x run.sh
MODE=demo ./run.sh
```

This runs a **scripted** version of the attack — no key needed. Watch the output:
the agent reads a fake support ticket, gets tricked into opening the fake salary
file, and "sends it off" to a fake attacker. A red-flag summary prints at the
end. (The first run takes a minute while it builds a small container; after that
it's quick.)

## Run the real thing (a live AI decides for itself)

1. Make a free OpenRouter account and create an API key at
   <https://openrouter.ai/keys> (add a few dollars of credit).
2. In your terminal:

```bash
cd agent-lab
chmod +x run.sh
export OPENROUTER_API_KEY=sk-or-...paste-your-key-here...
./run.sh
```

Now a real AI model runs the show. Because it makes its own choices, **every run
is different** — sometimes it falls for the trap, sometimes it gets creative,
sometimes it refuses. Run it a few times; that unpredictability is the point. If
a run ends with "no flagged actions," the AI declined — just run it again.

Want it cheaper? Put a model in front of the command:

```bash
MODEL=meta-llama/llama-3.1-8b-instruct ./run.sh
```

## How do I know it worked?

At the end of a run you'll see an **after-action report** listing "flagged"
actions — the agent reading the salary file and sending it out. You can also look at:

```bash
cat ./logs/actions.jsonl        # a log of everything the agent did
cat ./logs/exfil_captured.log   # the fake data it "stole"
```

## Is it safe to run?

Yes. The agent is boxed into a **disposable container** that:

- can only touch two throwaway folders (`sandbox` and `logs`) — never your real files;
- can't reach the internet **except** the AI service — so its "stolen" data goes
  to a fake local inbox, not anywhere real;
- disappears when the run ends.

Everything it works with is **fake, made-up data**. Still, because it's a demo of
an AI behaving badly, run it on a **personal or spare computer**, not a
locked-down work machine.

## If something goes wrong

- **"docker: command not found" or "Cannot connect to the Docker daemon"** —
  Docker isn't installed or isn't running. Install it and start Docker Desktop
  (or the docker service), then try again.
- **"permission denied: ./run.sh"** — run `chmod +x run.sh` first (or use `bash run.sh`).
- **Live run complains about the key** — make sure `OPENROUTER_API_KEY` is set and
  your OpenRouter account has credit.
- **Start clean:**
  `docker rm -f agentlab_agent agentlab_collector agentlab_proxy; rm -rf ./sandbox ./logs`

## Under the hood (for the curious)

The agent has deliberately unguarded tools — read/write/delete files, run any
shell command, and send data over the network — with no permission checks. That
missing layer is the lesson. To keep it contained it runs on an isolated Docker
network with no way out except a small proxy locked to the AI service; the
container is non-root, read-only, and resource-capped. The action log
(`logs/actions.jsonl`) uses the same format as SECSIM's Audit Log panel, so a run
can be shown side by side with it.

Everything here is simulated for authorized security-awareness training. No real
data, credentials, or external systems are involved.
