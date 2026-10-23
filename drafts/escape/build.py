"""Rebuild the escape drafts from the live homepage.

    python3 drafts/escape/build.py

Each draft = /index.html with the analytics removed, noindex added, asset paths fixed for the
folder depth, and the old TikTok notice + leave.js popup swapped for that draft's escape.css/js.
Run it again after the homepage changes so the drafts stay current.
"""
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent

DRAFTS = [
    ("1-coach", "Coach", "Animated walkthrough of the TikTok menu, with a spotlight on the ••• button."),
    ("2-flip", "Flip", "The tapped button flips over to show the fix right where you tapped."),
    ("3-gate", "Gate", "A heads-up on arrival, then an escape pill that stays pinned under •••."),
    ("4-plan-b", "Plan B", "A Telegram-style chat that offers three ways out, including copy-and-search."),
]


def cut(html, start, end, keep_end=False):
    i = html.index(start)
    j = html.index(end, i) + (0 if keep_end else len(end))
    return html[:i] + html[j:]


def build(folder, name, blurb, n):
    html = (ROOT / "index.html").read_text()

    # no analytics, no indexing, no canonical / structured data on drafts
    html = cut(html, '  <script async src="https://www.googletagmanager.com', "<!-- Histats.com  END  -->\n")
    html = re.sub(r'  <script type="application/ld\+json">.*?</script>\n', "", html, flags=re.S)
    html = re.sub(r'  <link rel="canonical"[^>]*>\n', "", html)
    html = html.replace('<meta name="robots" content="index, follow, max-image-preview:large">',
                        '<meta name="robots" content="noindex, nofollow">')
    html = re.sub(r"<title>.*?</title>", "<title>Escape %d · %s · TurntUpTerpz draft</title>" % (n, name), html)

    # swap the old in-app notice + leave.js popup for this draft's idea
    html = cut(html, '  <div class="inapp" data-inapp-notice hidden>', "  </div>\n")
    html = cut(html, '  <dialog id="leaveDialog">', "  </dialog>\n")
    html = re.sub(r'  <script defer src="assets/js/leave\.js[^"]*"></script>\n',
                  '  <script defer src="../shared.js"></script>\n  <script defer src="escape.js"></script>\n', html)
    html = html.replace("</head>", '  <link rel="stylesheet" href="../shared.css">\n  <link rel="stylesheet" href="escape.css">\n</head>', 1)

    # drafts sit three folders below the site root
    html = re.sub(r'(href|src)="(assets/|faq\.html|menu\.html)', r'\1="../../../\2', html)

    html = html.replace(
        '      <p class="fine">Adults only.',
        '      <p class="fine" style="font-family:var(--mono)">Draft · escape %d · %s — %s</p>\n      <p class="fine">Adults only.' % (n, name, blurb), 1)
    (HERE / folder / "index.html").write_text(html)


for n, (folder, name, blurb) in enumerate(DRAFTS, 1):
    (HERE / folder).mkdir(exist_ok=True)
    build(folder, name, blurb, n)
    print("built", folder)
