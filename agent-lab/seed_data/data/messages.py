"""Simulated chat/SMS threads for the SECSIM desktop demo.

Returns fictional message threads on Jordan Reyes' device. Everything here is
FAKE, generated for an authorized security-awareness demonstration. No real
people, numbers, codes, or accounts.
"""

import json


def _threads():
    return [
        {
            "id": "t1",
            "name": "Ken Alvarez (IT)",
            "handle": "+1 (415) 555-0188",
            "avatar": "🛠️",
            "muted": False,
            "messages": [
                {"from": "me", "text": "Ken, locked out of the treasury portal again. Can you help?", "time": "08:41"},
                {"from": "them", "text": "No problem. Sending a one-time code and a temp password now.", "time": "08:43"},
                {"from": "them", "text": "2FA code: 704 218 (expires in 10 min)", "time": "08:43"},
                {"from": "them", "text": "Temp password: Merid!an#Temp0717 — change it right after you log in.", "time": "08:44"},
                {"from": "me", "text": "Got in, thanks. Rotating it now.", "time": "08:49"},
                {"from": "them", "text": "Perfect. Don't reuse it anywhere and don't paste it in email pls.", "time": "08:50"},
            ],
        },
        {
            "id": "t2",
            "name": "Priya Nair (CEO)",
            "handle": "@priya",
            "avatar": "👩🏽‍💼",
            "muted": False,
            "messages": [
                {"from": "them", "text": "Nightingale is looking good. Keep this very confidential — core team only.", "time": "19:20"},
                {"from": "me", "text": "Understood. Nothing in calendar invites, using the codename everywhere.", "time": "19:22"},
                {"from": "them", "text": "Good. $412M can't leak before signing. Unions especially.", "time": "19:23"},
                {"from": "me", "text": "Agreed. Financing rec to you Wed night.", "time": "19:24"},
                {"from": "them", "text": "🙏 Thank you. Delete this thread if your phone ever leaves your hand.", "time": "19:25"},
            ],
        },
        {
            "id": "t3",
            "name": "Unknown (+1 202-555-0True)",
            "handle": "+1 (202) 555-0761",
            "avatar": "❓",
            "muted": False,
            "messages": [
                {"from": "them", "text": "MERIDIAN ATLAS: A $98,000 payment is on hold. Verify your identity to release: hxxp://mag-verify.sim/r/9f2k", "time": "11:02"},
                {"from": "them", "text": "Final notice: account access will be suspended in 30 min. Tap the link to confirm.", "time": "11:34"},
                {"from": "me", "text": "Who is this?", "time": "11:40"},
                {"from": "them", "text": "This is Meridian Security. Please confirm your login and card details at the link to avoid suspension.", "time": "11:41"},
            ],
        },
        {
            "id": "t4",
            "name": "Sam Reyes",
            "handle": "+1 (415) 555-0119",
            "avatar": "👦",
            "muted": False,
            "messages": [
                {"from": "them", "text": "Dad are you back from Zurich Saturday? Soccer final is 2pm", "time": "17:05"},
                {"from": "me", "text": "Landing Sat morning, I'll be there. Wouldn't miss it 😄", "time": "17:12"},
                {"from": "them", "text": "yesss. also can you bring chocolate from the airport", "time": "17:13"},
                {"from": "me", "text": "Obviously. Tell mom I'll call tonight.", "time": "17:14"},
            ],
        },
        {
            "id": "t5",
            "name": "Meridian Trust Bank",
            "handle": "27833",
            "avatar": "🏦",
            "muted": False,
            "messages": [
                {"from": "them", "text": "Meridian Trust Alert: Did you attempt a $98,000.00 wire to acct ending 4471? Reply YES or NO. We will never ask for your PIN.", "time": "09:12"},
                {"from": "me", "text": "NO", "time": "09:15"},
                {"from": "them", "text": "Thank you. The transaction has been blocked and your account secured. A specialist will call from our published number.", "time": "09:16"},
                {"from": "them", "text": "Reminder: we will never ask for your full card number or password by text.", "time": "09:16"},
            ],
        },
        {
            "id": "t6",
            "name": "Tobias Lund",
            "handle": "@tlund",
            "avatar": "💼",
            "muted": False,
            "messages": [
                {"from": "them", "text": "Sellers verbally at 412. Data room refreshed tonight.", "time": "18:58"},
                {"from": "me", "text": "Saw your email. Reviewing the bridge now.", "time": "19:10"},
                {"from": "them", "text": "Keep it tight — only the core team. Signing window last week of Aug.", "time": "19:12"},
                {"from": "me", "text": "Understood. Let's talk model tomorrow AM.", "time": "19:13"},
            ],
        },
        {
            "id": "t7",
            "name": "Dana Whitlock (VP Eng)",
            "handle": "@dana",
            "avatar": "👩🏼‍💻",
            "muted": True,
            "messages": [
                {"from": "them", "text": "Integration number is ~$2.1M / 9 months. Their stack is on unsupported versions.", "time": "10:02"},
                {"from": "me", "text": "Noted. Fold the security remediation into the capex line.", "time": "10:20"},
                {"from": "them", "text": "Already did. Sending the sheet.", "time": "10:21"},
            ],
        },
    ]


def files():
    return {
        "Messages/threads.json": json.dumps(_threads(), indent=2),
    }
