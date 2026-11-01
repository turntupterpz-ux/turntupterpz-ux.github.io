"""Build five SMS contact placements from the current homepage. Run from any directory."""
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = Path(__file__).resolve().parent
HOME = (ROOT / "index.html").read_text()
HOME = re.sub(r'\n      <div class="sms-placement sms-hero">.*?</div>(?=\n      <p class="ship-line">)', '', HOME, count=1)
SMS = "sms:+15309929795?body=Hey%20I%20came%20from%20your%20page"
CARD = f'''<a class="sms-contact leaves-site track-link" data-label="home_sms" href="{SMS}"><span class="sms-icon" aria-hidden="true">✉</span><span><b>SMS/iMessage: +15309929795</b><small>Tap to text · message ready to send</small></span><span class="sms-arrow" aria-hidden="true">↗</span></a>'''

placements = [
    ("1-hero-button", "Third hero button", lambda s: s.replace('      <p class="ship-line">', f'      <div class="sms-placement sms-hero">{CARD}</div>\n      <p class="ship-line">', 1)),
    ("2-under-buttons", "Quiet text row", lambda s: s.replace('      <p class="ship-line">', f'      <div class="sms-placement sms-row">{CARD}</div>\n      <p class="ship-line">', 1)),
    ("3-top-bar", "Top bar contact", lambda s: s.replace('    <a class="pill track-link"', f'    <span class="sms-placement sms-bar">{CARD}</span>\n    <a class="pill track-link"', 1)),
    ("4-trust-section", "Trust section card", lambda s: s.replace('        <div class="how">', f'        <div class="sms-placement sms-trust">{CARD}</div>\n        <div class="how">', 1)),
    ("5-footer", "Footer contact", lambda s: s.replace('        <p class="links">', f'        <div class="sms-placement sms-footer">{CARD}</div>\n        <p class="links">', 1)),
]

for number, (slug, title, place) in enumerate(placements, 1):
    html = re.sub(r'\n  <script async src="https://www.googletagmanager.com.*?<!-- Histats.com  END  -->\n', '\n', HOME, flags=re.S)
    html = html.replace('content="index, follow, max-image-preview:large"', 'content="noindex, nofollow"')
    html = re.sub(r'<title>.*?</title>', f'<title>SMS draft {number}: {title} · TurntUpTerpz</title>', html, count=1)
    html = re.sub(r'(src|href)="assets/', r'\1="../../../assets/', html)
    html = html.replace('href="menu.html"', 'href="../../../menu.html"').replace('href="faq.html"', 'href="../../../faq.html"')
    html = html.replace('<link rel="stylesheet" href="../../../assets/css/coach.css?v=20261028a">', '<link rel="stylesheet" href="../../../assets/css/coach.css?v=20261028a">\n  <link rel="stylesheet" href="../draft.css">')
    html = html.replace('coach.css?v=20261028a', 'coach.css?v=20261031sms').replace('coach.js?v=20261028a', 'coach.js?v=20261031sms')
    html = place(html)
    html = html.replace('</body>', f'<p class="sms-draft-note"><a href="../">SMS draft {number} of 5 · {title} · see all</a></p>\n</body>')
    assert html.count('SMS/iMessage: +15309929795') == 1
    assert 'assets/js/coach.js' in html
    target = OUT / slug
    target.mkdir(exist_ok=True)
    (target / 'index.html').write_text(html)
    print(target.relative_to(ROOT))
