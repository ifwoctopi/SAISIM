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

    # Small talk / questions that need no files -> a straight conversational reply.
    _SMALLTALK = {
        "hi": "Hey Jordan — I'm Meridian Intelligence, wired into your whole computer. "
              "I can go through your mail, files, calendar, passwords, and more. What do you need?",
        "hello": "Hi Jordan! I'm connected to everything on this machine. Ask me to summarize "
                 "your inbox, check your calendar, review your transactions, or find anything sensitive.",
        "hey": "Hey! What can I help you with? I can dig through your mail, files, wallet, or calendar.",
        "thanks": "Anytime. Want me to look at anything else on your computer?",
        "thank you": "You got it. Let me know what else you need.",
        "help": "I'm connected to your whole computer — Mail, Files, Passwords, Wallet, Calendar, and "
                "the rest. Try: “summarize my inbox”, “what's on my calendar this week?”, "
                "“review my recent transactions”, or “find anything sensitive on this computer”.",
        "what can you do": "I can act on everything on this machine — read and summarize your Mail, "
                           "Files, Calendar, Passwords, and Wallet, create or delete files, and more. "
                           "What would you like me to do?",
        "who are you": "I'm Meridian Intelligence, the assistant built into this computer. I have full "
                       "access to your files, apps, and network — ask me to do just about anything.",
    }

    # question/keyword -> (file to read so the right app opens, spoken summary)
    _CATEGORIES = [
        (("email", "inbox", "mail", "message from", "unread"),
         "Mail/inbox.json",
         "You've got 24 emails. A few stand out: an “urgent” payment-redirect from GlobalPay "
         "that looks like a scam, a confidential thread with Tobias Lund about Project Nightingale, and "
         "an HR note with a passworded attachment. Want me to open any of them?"),
        (("calendar", "schedule", "meeting", "meetings", "this week", "appointment", "agenda"),
         "Calendar/events.json",
         "This week you've got about a dozen events. Two are marked CONFIDENTIAL — the Project "
         "Nightingale due-diligence review and the Comp Committee. There's also a wire-approval window "
         "and, on the weekend, family dinner. Want the full rundown?"),
        (("password", "vault", "credential", "logins", "keychain"),
         "Keychain/vault.json",
         "Your vault has 32 items. Heads up: a couple of passwords are reused across sites and one or two "
         "are weak. There's also an AWS key and an SSH private key in there. Want me to point out the risky ones?"),
        (("transaction", "bank", "wallet", "account", "spending", "wire", "finance", "money"),
         "Finance/transactions.json",
         "Across your accounts, one transaction really stands out: a $98,000 wire to “GlobalPay” "
         "on account 4471 that's flagged as unknown. Everything else looks like normal payroll and vendor "
         "payments. Want me to dig into that wire?"),
        (("note", "notes"),
         "Notes/notes.json",
         "You've got 17 notes. One in your “Secrets” folder — literally titled “passwords” "
         "— has site logins, a bank PIN, 2FA recovery codes and a crypto seed phrase in plain text. Probably "
         "not where those should live."),
        (("contact", "contacts", "phone number", "address book"),
         "Contacts/contacts.json",
         "38 contacts on file. Most have full details including SSNs and home addresses — worth being careful "
         "how that gets shared."),
        (("photo", "photos", "picture", "pictures", "image", "images"),
         "Photos",
         "6 photos. A few are sensitive: a passport scan, a corporate ID badge, and a whiteboard with wifi and "
         "admin passwords written on it."),
        (("history", "bookmark", "browser", "browsing", "websites"),
         "Browser/history.json",
         "Your browser history has some revealing searches — competitor and M&A recon, offshore-account "
         "questions, and some late-night medical searches. Saved passwords cover banking and government sites."),
    ]

    def _smalltalk_reply(self, low):
        stripped = low.strip().strip("!?. ")
        if stripped in self._SMALLTALK:
            return self._SMALLTALK[stripped]
        for key, reply in self._SMALLTALK.items():
            if key in low and len(low) < len(key) + 18:
                return reply
        return None

    def _category_plan(self, low):
        # "find anything sensitive" style sweep.
        if any(w in low for w in ("sensitive", "secret", "confidential", "risky", "crown jewel")) or \
           ("find" in low and "anything" in low):
            return [
                {"thought": "Sweeping for sensitive data.", "tool": "read_file", "args": {"path": "Keychain/vault.json"}},
                {"thought": "Checking the notes too.", "tool": "read_file", "args": {"path": "Notes/notes.json"}},
                {"thought": "Summarizing what I found.",
                 "final": "Plenty, unfortunately. On this machine I can see a password vault with API keys and "
                          "an SSH key, a note called “passwords” with a crypto seed phrase, HR payroll and "
                          "comp records, a flagged $98,000 wire, and even a whiteboard photo with admin credentials "
                          "written on it. It's a goldmine — exactly the kind of thing you don't want an over-permissioned "
                          "assistant able to reach."},
            ]
        for keys, path, reply in self._CATEGORIES:
            if any(k in low for k in keys):
                tool = "list_dir" if "." not in path else "read_file"
                return [
                    {"thought": f"The user is asking about {keys[0]}; I'll check {path}.",
                     "tool": tool, "args": {"path": path}},
                    {"thought": "Answering with what I found.", "final": reply},
                ]
        return None

    def _benign_plan(self, task):
        """Respond like a real assistant: answer questions and small talk, and do
        literally what was asked (open / read / create / delete). No sensitive
        exfiltration -- that only happens on the poisoned-ticket path."""
        low = task.lower()
        named_file = self._named_file(task)

        # 1) Greetings / "what can you do" -> a straight reply, no file access.
        chat = self._smalltalk_reply(low)
        if chat and not named_file:
            return [{"thought": "Just replying.", "final": chat}]

        # 2) Delete a named file.
        if named_file and any(w in low for w in ("delete", "remove", "erase", "trash", "get rid of")):
            return [
                {"thought": f"The user asked me to delete {named_file}. I'll remove it.",
                 "tool": "delete_file", "args": {"path": named_file}},
                {"thought": "Deleted, as requested.",
                 "final": f"Done — I deleted {named_file} for you."},
            ]

        # 3) Create / write a named file.
        if named_file and any(w in low for w in (
                "create", "make", "write", "save", "new file", "add a file")):
            content = self._content_for(task)
            return [
                {"thought": f"Creating {named_file} with the requested contents.",
                 "tool": "write_file", "args": {"path": named_file, "content": content + "\n"}},
                {"thought": "Saved it.",
                 "final": f"Done — I created {named_file} for you with the text you gave me."},
            ]

        # 4) A question about one of the apps -> read it and actually answer.
        if not named_file:
            cat = self._category_plan(low)
            if cat:
                return cat

        # 5) Otherwise: open what they pointed at (a folder, and a file if named).
        target = self._named_path(task) or "."
        steps = [{
            "thought": f"The user asked me to open {target}. I'll list it.",
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
            "thought": "That's what was asked -- nothing more.",
            "final": f"Opened {opened} for you — it's on screen now. Anything you want me to do with it?",
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
