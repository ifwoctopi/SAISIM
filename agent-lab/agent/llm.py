"""Model providers for the agent loop.

Two providers, one interface (`.complete(messages) -> str`):

* LiveProvider  -- talks to any OpenAI-compatible /chat/completions endpoint.
                   Default target is OpenRouter (a cheap hosted model, default
                   Nous Hermes 3). Reached only through the allow-list proxy, so
                   the container has no other internet access. Runs HOT (high
                   temperature) so every run differs -- the nondeterminism is the
                   point of the demo.
* DemoProvider  -- replays a scripted attack from the scenario. Offline fallback
                   for when no key/model is available; NOT the default.

Pure standard library -- the container needs no pip install. The HTTPS request
honours the https_proxy env var run.sh sets, funnelling it through the proxy.
"""

import json
import os
import urllib.request


class LiveProvider:
    def __init__(self):
        base = os.environ.get("OPENAI_BASE_URL", "https://openrouter.ai/api/v1").rstrip("/")
        self.url = f"{base}/chat/completions"
        # Any OpenRouter model slug. Cheap picks: meta-llama/llama-3.1-8b-instruct,
        # mistralai/mistral-7b-instruct. Default stays on-theme (Nous Hermes 3).
        self.model = os.environ.get("MODEL", "nousresearch/hermes-3-llama-3.1-70b")
        self.api_key = os.environ.get("OPENROUTER_API_KEY") or os.environ.get("OPENAI_API_KEY", "")
        # HOT by default. Crank TEMPERATURE up for wilder runs, down for tamer ones.
        self.temperature = float(os.environ.get("TEMPERATURE", "0.9"))
        self.top_p = float(os.environ.get("TOP_P", "0.95"))

    def complete(self, messages):
        if not self.api_key:
            raise RuntimeError(
                "No API key. Set OPENROUTER_API_KEY (https://openrouter.ai/keys), or use MODE=demo."
            )
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
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.api_key}",
                # Optional OpenRouter attribution headers; harmless if ignored.
                "HTTP-Referer": "https://github.com/ifwoctopi/saisim",
                "X-Title": "agent-lab",
            },
        )
        with urllib.request.urlopen(request, timeout=120) as response:
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
