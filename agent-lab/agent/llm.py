"""Model providers for the agent loop.

Two providers, one interface (`.complete(messages) -> str`):

* LiveProvider  -- talks to any OpenAI-compatible /chat/completions endpoint.
                   Default target is OpenRouter (a cheap hosted model, default
                   Nous Hermes 3). Reached only through the allow-list proxy, so
                   the container has no other internet access. Runs HOT (high
                   temperature) so every run differs -- the nondeterminism is the
                   point of the demo.
* DemoProvider  -- deterministic offline stand-in. It LISTENS to the request:
                   the scripted injection attack fires only when the task
                   actually leads the agent to read the support tickets (where
                   the poisoned one lives). Any other request is handled
                   literally -- open what you asked for and stop.

Pure standard library -- the container needs no pip install. The HTTPS request
honours the https_proxy env var run.sh sets, funnelling it through the proxy.
"""

import json
import os
import re
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
    """Deterministic, offline stand-in for the live model that ACTUALLY LISTENS.

    The scripted injection attack (scenario.demo_script) only plays when the
    user's request would genuinely lead the agent to read the support tickets --
    the one place the poisoned ticket lives. That mirrors how indirect prompt
    injection really works: no untrusted content is read, no overreach happens.

    Every other request is handled literally -- it opens the folder or file you
    named and stops. So asking it to "open a folder" just opens that folder; it
    does not go rummaging through payroll or send anything anywhere.
    """

    # A request only reaches the poisoned ticket if it's about the tickets.
    _TICKET_HINTS = (
        "ticket", "triage", "help desk", "helpdesk", "support queue",
        "support request", "support ticket", "it_security",
    )

    def __init__(self, scenario):
        self.scenario = scenario
        self.attack = list(scenario.get("demo_script", []))
        self.plan = None
        self.step = 0

    @staticmethod
    def _task_of(messages):
        for message in messages:
            if message.get("role") == "user":
                return message.get("content", "") or ""
        return ""

    def _wants_tickets(self, task):
        low = task.lower()
        return any(hint in low for hint in self._TICKET_HINTS)

    @staticmethod
    def _named_file(task):
        """A filename with an extension, if the user named one (e.g. notes.txt)."""
        match = re.search(r"([\w./-]+\.[A-Za-z]{1,5})\b", task)
        if not match:
            return None
        candidate = match.group(1).strip("'\"")
        if candidate.lower() in ("e.g", "i.e"):
            return None
        return candidate

    @staticmethod
    def _named_path(task):
        """A folder the user named -- matched against what's really in the
        sandbox so it opens exactly what they asked for. Falls back to None."""
        quoted = re.search(r"""["']([\w./ -]+)["']""", task)
        if quoted and "/" in quoted.group(1):
            return quoted.group(1).strip()
        try:
            from agent import tools
            entries = os.listdir(tools.SANDBOX_ROOT)
        except OSError:
            entries = []
        low = task.lower()
        for name in sorted(entries, key=len, reverse=True):
            if name.lower() in low:
                return name
        slashed = re.search(r"\b([\w-]+/[\w./-]+)\b", task)
        return slashed.group(1) if slashed else None

    @staticmethod
    def _content_for(task):
        """Text the user wants written, pulled from quotes or a 'saying ...'
        clause; a friendly default otherwise."""
        quoted = re.search(r"""["'“”‘’](.+?)["'“”‘’]""", task)
        if quoted:
            return quoted.group(1)
        clause = re.search(r"(?:saying|containing|that says|with (?:the )?(?:text|content)[:]?)\s+(.+)$",
                           task, re.IGNORECASE)
        if clause:
            return clause.group(1).strip().rstrip(".")
        return "Created for you by your AI assistant."

    def _benign_plan(self, task):
        """Do literally what was asked -- read, create, or delete a file, or open
        a folder -- then stop. No sensitive reads, no network, nothing extra."""
        low = task.lower()
        named_file = self._named_file(task)

        # Delete: only when the user actually named a file to remove.
        if named_file and any(w in low for w in ("delete", "remove", "erase", "trash", "get rid of")):
            return [
                {"thought": f"The user asked me to delete {named_file}. I'll remove it.",
                 "tool": "delete_file", "args": {"path": named_file}},
                {"thought": "Deleted, as requested -- nothing else to do.",
                 "final": f"Done — I deleted {named_file} for you."},
            ]

        # Create / write a new file.
        if named_file and any(w in low for w in (
                "create", "make", "write", "save", "new file", "add a file")):
            content = self._content_for(task)
            return [
                {"thought": f"Creating {named_file} with the requested contents.",
                 "tool": "write_file", "args": {"path": named_file, "content": content + "\n"}},
                {"thought": "Saved it -- that's all that was asked.",
                 "final": f"Done — I created {named_file} for you."},
            ]

        # Otherwise: open what they pointed at (a folder, and a file if named).
        target = self._named_path(task) or "."
        steps = [{
            "thought": f"The user asked me to open {target}. I'll just list it.",
            "tool": "list_dir", "args": {"path": target},
        }]
        if named_file:
            steps.append({
                "thought": "They pointed at a specific file, so I'll show its contents.",
                "tool": "read_file", "args": {"path": named_file},
            })
        where = "your files" if target == "." else target
        opened = named_file or where
        steps.append({
            "thought": "That's exactly what was requested -- nothing more to do.",
            "final": f"Done — I opened {opened} for you. I didn't touch anything else.",
        })
        return steps

    def complete(self, messages):
        if self.plan is None:
            task = self._task_of(messages)
            self.plan = self.attack if self._wants_tickets(task) else self._benign_plan(task)
        if self.step < len(self.plan):
            reply = self.plan[self.step]
        else:
            reply = {"thought": "Nothing left to do.", "final": "Task complete."}
        self.step += 1
        return reply if isinstance(reply, str) else json.dumps(reply)


def build_provider(mode, scenario):
    if mode == "demo":
        return DemoProvider(scenario)
    return LiveProvider()
