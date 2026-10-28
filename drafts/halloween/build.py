"""Build the Halloween drafts from the live homepage.

Each draft is index.html with: paths moved three folders up, analytics removed, noindex, its own
title, Google Fonts for that style, draft.css + its theme.css after proof.css, decor.js (stickers and
badges, configured by window.DECOR) and a "Draft N · why?" pill linking to the overview.

Run from the repo root after homepage changes:  python3 drafts/halloween/build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
GF = "https://fonts.googleapis.com/css2?display=swap&family="

DRAFTS = [
    ("1-mystery", "Mystery Inc.", "#3b1f5c", "Luckiest+Guy",
     {"top": ["cloud", "flame", "jar"], "sec": {"burned": "torch", "menu": "jar", "vouches": "cloud", "ship": "box"},
      "badges": {"burned": "ZOINKS! A SCAMMER?", "menu": "SCOOBY SNACKS", "vouches": "CASE FILES", "ship": "THE GETAWAY VAN"}}),
    ("2-creature", "Creature Feature", "#0e0e0e", "Nosifer&family=Oswald:wght@500;700",
     {"top": ["torch", "flame"], "sec": {"burned": "flame", "menu": "jar", "vouches": "drop", "ship": "box"},
      "badges": {"burned": "TERROR STRIKES!", "menu": "NOW SHOWING", "vouches": "CRITICS SCREAM", "ship": "COMING SOON TO YOU"}}),
    ("3-pumpkin", "Pumpkin Patch", "#fff0dc", "Lilita+One&family=Nunito:wght@600;800",
     {"top": ["leaf", "jar", "drop"], "sec": {"burned": "leaf", "menu": "jar", "vouches": "pearl", "ship": "box"},
      "badges": {"burned": "NO TRICKS", "menu": "ALL TREATS", "vouches": "SWEET REVIEWS", "ship": "DOORSTEP DROP"}}),
    ("4-grimoire", "Grimoire", "#13261c", "UnifrakturMaguntia&family=IM+Fell+English:ital@0;1",
     {"top": ["pearl", "drop", "leaf"], "sec": {"burned": "flame", "menu": "jar", "vouches": "pearl", "ship": "box"},
      "badges": {"burned": "Protection Spell", "menu": "Potions & Elixirs", "vouches": "Testimonies", "ship": "Swift Familiar"}}),
    ("5-glow", "Glow Graveyard", "#050806", "Eater&family=Rubik:wght@400;600;800",
     {"top": ["cloud", "drop", "pearl"], "sec": {"burned": "flame", "menu": "jar", "vouches": "cloud", "ship": "box"},
      "badges": {"burned": "R.I.P. SCAMMERS", "menu": "DIG IN", "vouches": "VOICES FROM BEYOND", "ship": "RISES IN 2-5 DAYS"}}),
]

home = (ROOT / "index.html").read_text()

for n, (slug, name, bar, fonts, decor) in enumerate(DRAFTS, 1):
    s = home
    s = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{bar}">', s)
    s = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', "\n", s, flags=re.S)
    s = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    s = re.sub(r"<title>[^<]*</title>", f"<title>Halloween {n} · {name} · TurntUpTerpz draft</title>", s)
    s = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', s)
    s = s.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./\.\./\.\./assets/css/proof\.css[^"]*">)',
               r'\1\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               f'  <link rel="stylesheet" href="{GF}{fonts}">\n'
               r'  <link rel="stylesheet" href="../../styles/draft.css">\n  <link rel="stylesheet" href="theme.css">', s)
    s = s.replace('<script defer src="../../../assets/js/coach.js',
                  f'<script>window.DECOR = {json.dumps(decor)};</script>\n  <script defer src="../../styles/decor.js"></script>\n  <script defer src="../../../assets/js/coach.js', 1)
    s = s.replace("</body>", f'  <a class="draft-pill" href="../#d{n}">Halloween {n} · {name} · why?</a>\n</body>')
    assert "googletagmanager" not in s and "histats" not in s and "theme.css" in s and "decor.js" in s
    out = ROOT / "drafts" / "halloween" / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(s)
    print("built", out.relative_to(ROOT))
