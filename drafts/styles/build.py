"""Build the style drafts from the live homepage.

Each draft is index.html with: paths moved three folders up, analytics removed, noindex, its own
title, Google Fonts for that style, draft.css + its theme.css after proof.css, decor.js (stickers and
badges, configured by window.DECOR) and a "Draft N · why?" pill linking to the overview.

Run from the repo root after homepage changes:  python3 drafts/styles/build.py
"""
import json
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
GF = "https://fonts.googleapis.com/css2?display=swap&family="

DRAFTS = [
    ("1-comic", "Comic Pop", "#ffd400", "Bangers&family=Comic+Neue:wght@700",
     {"top": ["jar", "flame", "diamond"], "sec": {"burned": "carbcap", "menu": "dabber", "vouches": "torch", "ship": "box"},
      "badges": {"burned": "BAM!", "menu": "WOW!", "vouches": "POW!", "ship": "ZOOM!"}}),
    ("2-groovy", "Groovy 70s", "#f2b134", "Shrikhand",
     {"top": ["drop", "leaf"], "sec": {"burned": "flame", "menu": "jar", "vouches": "pearl", "ship": "box"},
      "badges": {"burned": "far out", "menu": "dig it", "vouches": "good vibes", "ship": "keep on truckin'"}}),
    ("3-chrome", "Y2K Chrome", "#e9e6ff", "Unbounded:wght@600;800&family=Space+Grotesk:wght@400;500;700",
     {"top": ["diamond", "pearl", "drop"], "sec": {"burned": "diamond", "menu": "pearl", "vouches": "drop", "ship": "diamond"},
      "badges": {"burned": "✦ trusted", "menu": "✦ fresh drop", "vouches": "✦ 100% real", "ship": "✦ fast"}}),
    ("4-street", "Street Sticker", "#d9d6cf", "Permanent+Marker&family=Rubik:wght@400;500;700",
     {"top": ["rig", "torch", "jar"], "sec": {"burned": "flame", "menu": "dabber", "vouches": "jar", "ship": "box"},
      "badges": {"burned": "LEGIT", "menu": "FRESH", "vouches": "REAL ONES", "ship": "FAST"}}),
    ("5-arcade", "Arcade", "#0d0b2b", "Press+Start+2P&family=VT323",
     {"top": ["diamond", "flame", "pearl"], "sec": {"burned": "flame", "menu": "jar", "vouches": "pearl", "ship": "box"},
      "badges": {"burned": "BOSS LEVEL", "menu": "SELECT ITEM", "vouches": "HIGH SCORES", "ship": "SPEED RUN"}}),
    ("6-halloween", "Halloween '89", "#120a1f", "Creepster&family=VT323",
     {"top": ["flame", "jar", "drop"], "sec": {"burned": "torch", "menu": "jar", "vouches": "cloud", "ship": "box"},
      "badges": {"burned": "ARE YOU AFRAID OF SCAMS?", "menu": "TRICK OR TREAT", "vouches": "▶ PLAY · REAL TAPES", "ship": "SPOOKY FAST"}}),
]

home = (ROOT / "index.html").read_text()

for n, (slug, name, bar, fonts, decor) in enumerate(DRAFTS, 1):
    s = home
    s = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{bar}">', s)
    s = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', "\n", s, flags=re.S)
    s = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    s = re.sub(r"<title>[^<]*</title>", f"<title>Style {n} · {name} · TurntUpTerpz draft</title>", s)
    s = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', s)
    s = s.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./\.\./\.\./assets/css/proof\.css[^"]*">)',
               r'\1\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               f'  <link rel="stylesheet" href="{GF}{fonts}">\n'
               r'  <link rel="stylesheet" href="../draft.css">\n  <link rel="stylesheet" href="theme.css">', s)
    s = s.replace('<script defer src="../../../assets/js/coach.js',
                  f'<script>window.DECOR = {json.dumps(decor)};</script>\n  <script defer src="../decor.js"></script>\n  <script defer src="../../../assets/js/coach.js', 1)
    s = s.replace("</body>", f'  <a class="draft-pill" href="../#d{n}">Style {n} · {name} · why?</a>\n</body>')
    assert "googletagmanager" not in s and "histats" not in s and "theme.css" in s and "decor.js" in s
    out = ROOT / "drafts" / "styles" / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(s)
    print("built", out.relative_to(ROOT))
