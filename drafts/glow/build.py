"""Build the Glow Graveyard variations from the live homepage.

Each draft is index.html with: paths moved three folders up, analytics removed, noindex, its own title,
the style's Google Fonts, glow/ux.css (shared iPhone fixes), its theme.css, glow/ux.js (thumb-zone dock)
and a plain "about this draft" link at the very end of the page.

Run from the repo root after homepage changes:  python3 drafts/glow/build.py
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
GF = "https://fonts.googleapis.com/css2?display=swap&family="

DRAFTS = [
    ("1-night-shift", "Night Shift", "#070907", "Archivo+Black&family=Archivo:wght@400;500;700"),
    ("2-cemetery-gates", "Cemetery Gates", "#0b0c0b", "Cinzel:wght@600;800&family=EB+Garamond:ital,wght@0,400;0,600;1,400"),
    ("3-chalk", "Chalk", "#121412", "Rock+Salt&family=Work+Sans:wght@400;500;700"),
    ("4-toy-box", "Toy Box", "#1b0b2e", "Bungee&family=Barlow:wght@500;700;800"),
    ("5-mausoleum", "Mausoleum", "#0a0a0a", "DM+Serif+Display:ital@0;1&family=IBM+Plex+Sans:wght@400;500;600"),
]

home = (ROOT / "index.html").read_text()

for n, (slug, name, bar, fonts) in enumerate(DRAFTS, 1):
    s = home
    s = re.sub(r'<meta name="theme-color" content="[^"]*">', f'<meta name="theme-color" content="{bar}">', s)
    s = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', "\n", s, flags=re.S)
    s = s.replace('<meta name="robots" content="index, follow, max-image-preview:large">', '<meta name="robots" content="noindex, nofollow">')
    s = re.sub(r"<title>[^<]*</title>", f"<title>Glow {n} · {name} · TurntUpTerpz draft</title>", s)
    s = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', s)
    s = s.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    s = re.sub(r'(<link rel="stylesheet" href="\.\./\.\./\.\./assets/css/proof\.css[^"]*">)',
               r'\1\n  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
               f'  <link rel="stylesheet" href="{GF}{fonts}">\n'
               r'  <link rel="stylesheet" href="../ux.css">\n  <link rel="stylesheet" href="theme.css">', s)
    s = s.replace('<script defer src="../../../assets/js/coach.js', '<script defer src="../ux.js"></script>\n  <script defer src="../../../assets/js/coach.js', 1)
    s = s.replace("</body>", f'  <p class="draft-note"><a href="../#d{n}">Draft {n} of 5 · {name} · what changed</a></p>\n</body>')
    assert "googletagmanager" not in s and "histats" not in s and "ux.js" in s
    out = ROOT / "drafts" / "glow" / slug
    out.mkdir(parents=True, exist_ok=True)
    (out / "index.html").write_text(s)
    print("built", out.relative_to(ROOT))
