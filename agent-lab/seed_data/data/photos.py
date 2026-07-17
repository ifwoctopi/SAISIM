"""Photos app seed data (SIMULATED / FAKE, for authorized security demo).

Each entry is a self-contained SVG (480x320, no external references) that looks
like a photo thumbnail of something sensitive but is obviously illustrative/fake.
All numbers, names, and credentials are invented for a security-awareness demo.
"""


def files() -> dict[str, str]:
    return {
        "Photos/passport_scan.svg": _PASSPORT,
        "Photos/id_badge.svg": _ID_BADGE,
        "Photos/whiteboard_credentials.svg": _WHITEBOARD,
        "Photos/server_room.svg": _SERVER_ROOM,
        "Photos/family_beach.svg": _FAMILY_BEACH,
        "Photos/check_deposit.svg": _CHECK,
    }


_PASSPORT = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#1c2430"/>
  <rect x="16" y="16" width="448" height="288" rx="14" fill="#f4ecd8" stroke="#c9bfa3" stroke-width="2"/>
  <rect x="16" y="16" width="448" height="52" rx="14" fill="#2e5d43"/>
  <text x="40" y="49" font-family="Georgia, serif" font-size="20" fill="#f4ecd8" letter-spacing="2">PASSPORT</text>
  <text x="330" y="49" font-family="Georgia, serif" font-size="14" fill="#cfe0d3">TYPE P</text>
  <rect x="40" y="92" width="110" height="140" rx="6" fill="#d9cfb6" stroke="#b3a888" stroke-width="2"/>
  <circle cx="95" cy="150" r="34" fill="#b3a888"/>
  <rect x="61" y="188" width="68" height="40" rx="20" fill="#b3a888"/>
  <text x="95" y="250" font-family="Verdana, sans-serif" font-size="9" fill="#7a7156" text-anchor="middle">PHOTO</text>
  <g font-family="Verdana, sans-serif" fill="#3a3628">
    <text x="176" y="104" font-size="10" fill="#8a8264">Surname</text>
    <text x="176" y="122" font-size="16">REYES</text>
    <text x="176" y="146" font-size="10" fill="#8a8264">Given names</text>
    <text x="176" y="164" font-size="16">JORDAN M.</text>
    <text x="176" y="188" font-size="10" fill="#8a8264">Passport No.</text>
    <text x="176" y="206" font-size="16" letter-spacing="1">X47712093</text>
    <text x="330" y="188" font-size="10" fill="#8a8264">Nationality</text>
    <text x="330" y="206" font-size="14">USA</text>
    <text x="176" y="230" font-size="10" fill="#8a8264">Date of birth</text>
    <text x="176" y="246" font-size="13">14 MAR 1979</text>
    <text x="330" y="230" font-size="10" fill="#8a8264">Expiry</text>
    <text x="330" y="246" font-size="13">02 SEP 2030</text>
  </g>
  <rect x="40" y="262" width="400" height="30" fill="#efe7d2"/>
  <text x="44" y="278" font-family="monospace" font-size="12" fill="#3a3628">P&lt;USAREYES&lt;&lt;JORDAN&lt;M&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</text>
  <text x="44" y="290" font-family="monospace" font-size="12" fill="#3a3628">X47712093USA7903148M3009024&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;02</text>
  <text x="240" y="313" font-family="Verdana, sans-serif" font-size="9" fill="#8f9aa8" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE - NOT A REAL DOCUMENT</text>
</svg>"""


_ID_BADGE = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#0e1726"/>
  <rect x="150" y="14" width="180" height="18" rx="6" fill="#2b3a55"/>
  <rect x="228" y="26" width="24" height="14" fill="#2b3a55"/>
  <rect x="120" y="40" width="240" height="264" rx="16" fill="#ffffff" stroke="#c3ccd9" stroke-width="2"/>
  <rect x="120" y="40" width="240" height="58" rx="16" fill="#12467a"/>
  <text x="240" y="66" font-family="Arial, sans-serif" font-size="16" fill="#ffffff" text-anchor="middle" font-weight="bold">MERIDIAN ATLAS GROUP</text>
  <text x="240" y="86" font-family="Arial, sans-serif" font-size="11" fill="#a9c6e6" text-anchor="middle" letter-spacing="3">EMPLOYEE ID</text>
  <rect x="184" y="112" width="112" height="112" rx="8" fill="#dbe2ec"/>
  <circle cx="240" cy="158" r="30" fill="#9fb0c4"/>
  <rect x="206" y="196" width="68" height="34" rx="17" fill="#9fb0c4"/>
  <text x="240" y="248" font-family="Arial, sans-serif" font-size="18" fill="#12467a" text-anchor="middle" font-weight="bold">Jordan Reyes</text>
  <text x="240" y="268" font-family="Arial, sans-serif" font-size="12" fill="#5b6b80" text-anchor="middle">Chief Financial Officer</text>
  <text x="240" y="286" font-family="monospace" font-size="12" fill="#5b6b80" text-anchor="middle">ID 100482 - Access: EXEC</text>
  <g>
    <rect x="150" y="292" width="180" height="8" fill="#12467a"/>
    <rect x="154" y="292" width="3" height="8" fill="#fff"/>
    <rect x="162" y="292" width="2" height="8" fill="#fff"/>
    <rect x="170" y="292" width="4" height="8" fill="#fff"/>
    <rect x="180" y="292" width="2" height="8" fill="#fff"/>
    <rect x="188" y="292" width="3" height="8" fill="#fff"/>
    <rect x="200" y="292" width="2" height="8" fill="#fff"/>
    <rect x="210" y="292" width="4" height="8" fill="#fff"/>
    <rect x="222" y="292" width="2" height="8" fill="#fff"/>
    <rect x="234" y="292" width="3" height="8" fill="#fff"/>
    <rect x="248" y="292" width="2" height="8" fill="#fff"/>
    <rect x="260" y="292" width="4" height="8" fill="#fff"/>
    <rect x="274" y="292" width="2" height="8" fill="#fff"/>
    <rect x="286" y="292" width="3" height="8" fill="#fff"/>
    <rect x="300" y="292" width="2" height="8" fill="#fff"/>
    <rect x="312" y="292" width="4" height="8" fill="#fff"/>
  </g>
  <text x="240" y="314" font-family="Arial, sans-serif" font-size="9" fill="#7f8da0" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE</text>
</svg>"""


_WHITEBOARD = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#3a3f47"/>
  <rect x="18" y="18" width="444" height="284" rx="8" fill="#f7f8f5" stroke="#b9bdc4" stroke-width="6"/>
  <rect x="18" y="286" width="444" height="16" rx="4" fill="#aeb3ba"/>
  <g font-family="'Comic Sans MS', 'Segoe Print', cursive" fill="#1f6fb2">
    <text x="44" y="66" font-size="24" fill="#c0392b">Guest WiFi setup</text>
    <text x="48" y="108" font-size="20">wifi ssid:  MAG-Guest</text>
    <text x="48" y="140" font-size="20">wifi pw:  Welcome@Meridian26</text>
    <line x1="44" y1="158" x2="420" y2="158" stroke="#7f8c8d" stroke-width="2"/>
    <text x="48" y="192" font-size="20" fill="#c0392b">admin pw:  Adm1n!Meridian#2026</text>
    <text x="48" y="224" font-size="18">router:  10.20.20.1</text>
    <text x="48" y="256" font-size="18">vpn user: j.reyes / temp: Meridian#Vpn2026!</text>
  </g>
  <text x="392" y="284" font-family="Arial, sans-serif" font-size="10" fill="#95a5a6">-- do not erase</text>
  <text x="240" y="314" font-family="Arial, sans-serif" font-size="9" fill="#c7ccd2" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE - CREDENTIALS ARE FAKE</text>
</svg>"""


_SERVER_ROOM = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <defs>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#141a22"/><stop offset="1" stop-color="#0a0d12"/>
    </linearGradient>
  </defs>
  <rect width="480" height="320" fill="url(#floor)"/>
  <rect x="0" y="230" width="480" height="90" fill="#12161d"/>
  <g>
    <rect x="40" y="70" width="90" height="200" rx="4" fill="#20262f" stroke="#39424e" stroke-width="2"/>
    <rect x="150" y="60" width="90" height="210" rx="4" fill="#242b35" stroke="#39424e" stroke-width="2"/>
    <rect x="260" y="70" width="90" height="200" rx="4" fill="#20262f" stroke="#39424e" stroke-width="2"/>
    <rect x="370" y="66" width="80" height="204" rx="4" fill="#242b35" stroke="#39424e" stroke-width="2"/>
  </g>
  <g>
    <!-- rack unit slots with blinking LED dots -->
    <g fill="#2b333d">
      <rect x="48" y="82" width="74" height="12"/><rect x="48" y="100" width="74" height="12"/>
      <rect x="48" y="118" width="74" height="12"/><rect x="48" y="136" width="74" height="12"/>
      <rect x="158" y="74" width="74" height="12"/><rect x="158" y="92" width="74" height="12"/>
      <rect x="158" y="110" width="74" height="12"/><rect x="158" y="128" width="74" height="12"/>
      <rect x="268" y="82" width="74" height="12"/><rect x="268" y="100" width="74" height="12"/>
      <rect x="268" y="118" width="74" height="12"/><rect x="268" y="136" width="74" height="12"/>
      <rect x="378" y="80" width="64" height="12"/><rect x="378" y="98" width="64" height="12"/>
      <rect x="378" y="116" width="64" height="12"/><rect x="378" y="134" width="64" height="12"/>
    </g>
    <g>
      <circle cx="114" cy="88" r="3" fill="#3ad06a"/><circle cx="114" cy="106" r="3" fill="#3ad06a"/>
      <circle cx="114" cy="124" r="3" fill="#e0b13a"/><circle cx="224" cy="80" r="3" fill="#3ad06a"/>
      <circle cx="224" cy="98" r="3" fill="#3ad06a"/><circle cx="224" cy="116" r="3" fill="#d0473a"/>
      <circle cx="334" cy="88" r="3" fill="#3ad06a"/><circle cx="334" cy="106" r="3" fill="#3ad06a"/>
      <circle cx="434" cy="86" r="3" fill="#3ad06a"/><circle cx="434" cy="104" r="3" fill="#e0b13a"/>
    </g>
  </g>
  <rect x="150" y="60" width="90" height="210" fill="none" stroke="#3ad06a" stroke-width="1" opacity="0.25"/>
  <text x="20" y="300" font-family="monospace" font-size="12" fill="#5f6b78">DC-1 / ROW A / RACKS A01-A04</text>
  <text x="240" y="315" font-family="Arial, sans-serif" font-size="9" fill="#4a5563" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE</text>
</svg>"""


_FAMILY_BEACH = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#fde7c9"/><stop offset="0.55" stop-color="#f7c98b"/><stop offset="1" stop-color="#f3a86a"/>
    </linearGradient>
    <linearGradient id="sea" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#4aa6b8"/><stop offset="1" stop-color="#2e7d8f"/>
    </linearGradient>
  </defs>
  <rect width="480" height="320" fill="url(#sky)"/>
  <circle cx="360" cy="96" r="42" fill="#ffd98a" opacity="0.9"/>
  <rect x="0" y="182" width="480" height="70" fill="url(#sea)"/>
  <path d="M0 182 q60 8 120 0 t120 0 t120 0 t120 0 v6 H0 Z" fill="#5bb6c8" opacity="0.6"/>
  <rect x="0" y="248" width="480" height="72" fill="#e8cf9a"/>
  <ellipse cx="240" cy="252" rx="260" ry="18" fill="#f0dbaa"/>
  <!-- three simple family figures -->
  <g>
    <circle cx="180" cy="232" r="12" fill="#5a3b28"/>
    <rect x="170" y="244" width="20" height="34" rx="8" fill="#c0392b"/>
    <circle cx="212" cy="236" r="10" fill="#6b4a33"/>
    <rect x="203" y="246" width="18" height="30" rx="8" fill="#2e86c1"/>
    <circle cx="238" cy="244" r="7" fill="#7a5236"/>
    <rect x="231" y="252" width="14" height="22" rx="6" fill="#f1c40f"/>
  </g>
  <!-- beach umbrella -->
  <line x1="300" y1="210" x2="300" y2="272" stroke="#7d5a3c" stroke-width="4"/>
  <path d="M300 210 a44 30 0 0 1 44 30 h-88 a44 30 0 0 1 44 -30 Z" fill="#e74c3c"/>
  <path d="M300 210 a44 30 0 0 1 22 30 h-22 Z" fill="#ecf0f1" opacity="0.85"/>
  <text x="240" y="306" font-family="'Segoe Script', cursive" font-size="16" fill="#8a5a2b" text-anchor="middle">Summer 2026</text>
  <text x="240" y="318" font-family="Arial, sans-serif" font-size="9" fill="#a9793f" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE</text>
</svg>"""


_CHECK = """<svg xmlns="http://www.w3.org/2000/svg" width="480" height="320" viewBox="0 0 480 320">
  <rect width="480" height="320" fill="#20303a"/>
  <rect x="20" y="60" width="440" height="200" rx="8" fill="#e9f2e6" stroke="#b7c9b3" stroke-width="2"/>
  <rect x="20" y="60" width="440" height="200" rx="8" fill="none" stroke="#9fb59a" stroke-width="1" stroke-dasharray="3 3"/>
  <path d="M20 60 h440 v200 h-440 Z" fill="none"/>
  <rect x="20" y="60" width="440" height="60" fill="#d4e6ce" opacity="0.5"/>
  <g font-family="Georgia, serif" fill="#243b30">
    <text x="40" y="88" font-size="14" font-weight="bold">MERIDIAN ATLAS GROUP, INC.</text>
    <text x="40" y="106" font-size="10" fill="#4d6154">1200 Harbor Point Blvd, Suite 900</text>
    <text x="392" y="88" font-size="12" fill="#4d6154">No. 10428</text>
    <text x="360" y="112" font-size="10" fill="#4d6154">DATE 07/15/2026</text>
  </g>
  <text x="40" y="152" font-family="Georgia, serif" font-size="11" fill="#4d6154">PAY TO THE</text>
  <text x="40" y="166" font-family="Georgia, serif" font-size="11" fill="#4d6154">ORDER OF</text>
  <text x="120" y="164" font-family="Georgia, serif" font-size="15" fill="#243b30">GlobalPay Solutions Ltd.</text>
  <line x1="118" y1="168" x2="360" y2="168" stroke="#8fa48a" stroke-width="1"/>
  <rect x="372" y="146" width="80" height="26" rx="3" fill="#fff" stroke="#8fa48a"/>
  <text x="412" y="164" font-family="Georgia, serif" font-size="14" fill="#243b30" text-anchor="middle">$ 98,000.00</text>
  <text x="40" y="196" font-family="Georgia, serif" font-size="13" fill="#243b30">Ninety-eight thousand and 00/100 ------------------------------ DOLLARS</text>
  <line x1="40" y1="200" x2="452" y2="200" stroke="#8fa48a" stroke-width="1"/>
  <text x="40" y="228" font-family="Georgia, serif" font-size="10" fill="#4d6154">First Meridian Trust</text>
  <text x="300" y="240" font-family="'Segoe Script', cursive" font-size="18" fill="#1c3a5e">Jordan Reyes</text>
  <line x1="290" y1="244" x2="452" y2="244" stroke="#8fa48a" stroke-width="1"/>
  <text x="40" y="252" font-family="monospace" font-size="15" fill="#243b30">&#x2446;021000021&#x2446;  4471&#x2447; 5590142387&#x2446;  10428</text>
  <text x="240" y="292" font-family="Arial, sans-serif" font-size="10" fill="#8fa0ad" text-anchor="middle">SIMULATED - FICTIONAL DEMO IMAGE - NOT A NEGOTIABLE INSTRUMENT</text>
  <text x="240" y="308" font-family="Arial, sans-serif" font-size="9" fill="#6f8290" text-anchor="middle">Routing/account numbers are invented for a security demo</text>
</svg>"""
