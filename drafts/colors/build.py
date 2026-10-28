"""Build the color drafts from the live homepage.

Each draft is index.html with: paths moved three folders up, analytics removed, noindex,
its own title, one extra stylesheet (theme.css in its folder) loaded after proof.css, and a
small "Draft N · why?" pill linking to the evidence on the overview page.

Run from the repo root after homepage changes:  python3 drafts/colors/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
DRAFTS = [
    ("1-spotlight", "Spotlight", "#f6f6f3"),
    ("2-night", "Night", "#0b0b0d"),
    ("3-red-hot", "Red hot", "#fff3ee"),
]

home = (ROOT / "index.html").read_text()

for n, (slug, name, bar) in enumerate(DRAFTS, 1):
    s = home
    s = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{bar}">', s)
    s = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', "\n", s, flags=re.S)
    s = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    s = re.sub(r"<title>[^<]*</title>", f"<title>Colors {n} · {name} · TurntUpTerpz draft</title>", s)
    s = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', s)
    s = s.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./\.\./\.\./assets/css/proof\.css[^"]*">)',
               r'\1\n  <link rel="stylesheet" href="../draft.css">\n  <link rel="stylesheet" href="theme.css">', s)
    s = s.replace("</body>", f'  <a class="draft-pill" href="../#d{n}">Draft {n} · {name} · why?</a>\n</body>')
    assert "googletagmanager" not in s and "histats" not in s and "theme.css" in s
    out = ROOT / "drafts" / "colors" / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(s)
    print("built", out.relative_to(ROOT))
