"""Build the Night Shift Halloween drafts from the live homepage (which already loads night.css + dock.js).

Each draft is index.html with: paths moved three folders up, analytics removed, noindex, its own title,
the style's Google Fonts and its theme.css after night.css, and a plain link back to the overview.

Run from the repo root after homepage changes:  python3 drafts/spooky/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
GF = "https://fonts.googleapis.com/css2?display=swap&family="

DRAFTS = [
    ("1-a24", "A24 Horror", "#0d0c0b", "Anton&family=Inter+Tight:wght@400;500;700"),
    ("2-pastel-goth", "Pastel Goth", "#0f0d14", "Bricolage+Grotesque:opsz,wght@12..96,500;12..96,800&family=Nunito+Sans:wght@400;600;800"),
    ("3-brutalist", "Brutalist", "#ff5a00", "Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700"),
    ("4-bats", "Bat Pattern", "#1a0f2b", "Rubik+Dirt&family=Rubik:wght@400;600;800"),
    ("5-candy-corn", "Candy Corn", "#1a120c", "Titan+One&family=Nunito:wght@600;800"),
]

home = (ROOT / "index.html").read_text()

for n, (slug, name, bar, fonts) in enumerate(DRAFTS, 1):
    s = home
    s = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{bar}">', s)
    s = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', "\n", s, flags=re.S)
    s = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    s = re.sub(r"<title>[^<]*</title>", f"<title>Spooky {n} · {name} · TurntUpTerpz draft</title>", s)
    s = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', s)
    s = s.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./\.\./\.\./assets/css/night\.css[^"]*">)',
               r'\1\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               f'  <link rel="stylesheet" href="{GF}{fonts}">\n'
               r'  <link rel="stylesheet" href="theme.css">', s)
    s = s.replace("</body>", f'  <p class="draft-note"><a href="../#d{n}">Draft {n} of 5 · {name} · about this draft</a></p>\n</body>')
    assert "googletagmanager" not in s and "histats" not in s and "theme.css" in s and "dock.js" in s
    out = ROOT / "drafts" / "spooky" / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(s)
    print("built", out.relative_to(ROOT))
