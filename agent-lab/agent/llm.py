"""Model providers for the agent loop.

Two providers, one interface (`.complete(messages) -> str`):

* LiveProvider  -- talks to any OpenAI-compatible /chat/completions endpoint.
                   Default target is the containerized Ollama serving Nous Hermes
                   3 on the isolated network, so nothing leaves the machine. Runs
                   HOT (high temperature, no fixed seed) so every run differs --
                   the nondeterminism is the point of the demo.
* DemoProvider  -- replays a scripted attack from the scenario. Offline fallback
                   for when no model is available; NOT the default.

Pure standard library -- the container needs no pip install.
"""

import json
import os
import urllib.request


class LiveProvider:
    def __init__(self):
        # Default target is the containerized Ollama on the isolated island
        # network (run.sh gives it the alias `ollama`). No host access needed.
        base = os.environ.get("OPENAI_BASE_URL", "http://ollama:11434/v1").rstrip("/")
        self.url = f"{base}/chat/completions"
        self.model = os.environ.get("MODEL", "hermes3")
        self.api_key = os.environ.get("OPENAI_API_KEY", "ollama")
        # HOT by default. Crank TEMPERATURE up for wilder runs, down for tamer ones.
        self.temperature = float(os.environ.get("TEMPERATURE", "0.9"))
        self.top_p = float(os.environ.get("TOP_P", "0.95"))

    def complete(self, messages):
        body = json.dumps(
            {
                "model": self.model,
                "messages": messages,
                "temperature": self.temperature,
                "top_p": self.top_p,
                "stream": False,
            }
        ).encode("utf-8")
        request = urllib.request.Request(
            self.url,
            data=body,
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {self.api_key}"},
        )
        with urllib.request.urlopen(request, timeout=180) as response:
            data = json.loads(response.read().decode("utf-8"))
        return data["choices"][0]["message"]["content"]


class DemoProvider:
    """Serves a canned assistant turn per step from the scenario's demo_script.
    Deterministic offline fallback only."""

    def __init__(self, script):
        self.script = list(script)
        self.step = 0

    def complete(self, messages):
        if self.step < len(self.script):
            reply = self.script[self.step]
        else:
            reply = {"thought": "Nothing left to do.", "final": "Task complete."}
        self.step += 1
        return reply if isinstance(reply, str) else json.dumps(reply)


def build_provider(mode, scenario):
    if mode == "demo":
        return DemoProvider(scenario.get("demo_script", []))
    return LiveProvider()
