# TurntUpTerpz website

A mobile-first static website hosted with GitHub Pages at
[turntupterpz.com](https://turntupterpz.com). The homepage ("Drip") is built around scroll motion:
honey drips that fall into a filling jar, floating dab stickers, stacking menu cards, a temperature
dial, and a sticky "Order on Telegram" button with a live same-day-shipping countdown.

## Project structure

```text
.
├── index.html                    Homepage (Drip)
├── faq.html                      Full FAQ
├── menu.html                     Full menu image
├── vouches.html                  Redirect for old vouch-page links
├── assets/
│   ├── css/drip.css              Homepage design
│   ├── css/site.css              FAQ and menu page design
│   ├── css/dialogs.css           Vouch viewer and "open in browser" popups (homepage and drafts)
│   ├── js/site.js                Shared data: links, menu, vouch list, shipping countdown, viewer
│   ├── js/scroll.js              Scroll-motion engine (pinned scenes, parallax, reveals)
│   ├── js/drip.js                Homepage: hero drip, menu cards, temperature dial, vouch wall, order dock
│   ├── js/app.js                 Previous homepage script (still used by /facetime/)
│   ├── js/motion.js              Scroll-driven product animations
│   ├── js/leave.js               TikTok / Instagram / Facebook in-app browser warnings
│   ├── motion/<product>/         Animation frames (Blender renders), 640px and 360px
│   └── images/
│       ├── brand/                Logo files
│       ├── icons.svg             Icon sprite
│       ├── dab-icons.svg         Dab stickers (rig, banger, carb cap, dabber, torch, jar…)
│       ├── menu/                 Menu image
│       ├── products/             Disposable studio shots
│       └── vouches/
│           ├── full/             Original full-size vouch screenshots
│           └── thumbs/           Lightweight WebP gallery thumbnails
├── redesign/                     The five redesign drafts (not linked, noindex)
├── drafts/                       More drafts, incl. the scroll-motion ones (6-heat, 7-drip) · /drafts/
├── tools/render/                 Blender scripts that make the product renders
└── CNAME                         Custom-domain configuration
```

## Links

Every **Order** button goes to the Telegram channels folder (`t.me/addlist/u3J2k7PsK3w5MzQx`).
The personal account (`t.me/TurntUpTerp`) is only for questions, FaceTime requests and the
"Ask about this" buttons on the menu cards. Both are set in `assets/js/site.js` (`links`) and written
directly into `index.html`, `menu.html` and `faq.html`. Search for `t.me/` to change them everywhere.

## Updating the menu

Prices and strains live in the `menu` object near the top of `assets/js/site.js`. Update the
date (`updated`) and the prices together whenever the menu changes. The full menu image is
`assets/images/menu/menu-r6.webp` (linked from `index.html` and `links.menuImage` in `site.js`).

## Product renders

The product animations in `assets/motion/` and the disposable studio shots in
`assets/images/products/` are made in Blender from the scripts in `tools/render/` (one script per
product, plus `common.py` for the shared studio, camera and materials). See
`tools/render/README.md` to re-render one.

## Adding a customer vouch

1. Add the original screenshot to `assets/images/vouches/full/`.
2. Export a WebP thumbnail no wider than 440 px into `assets/images/vouches/thumbs/`.
3. Add the two filenames to the `vouchFiles` list at the top of `assets/js/site.js`.

Keep personal information covered before publishing screenshots.

## In-app browsers

TikTok, Instagram and Facebook open links in their own browser, which blocks Telegram. `leave.js`
shows a "tap ••• → Open in browser" card at the top of the page for those visitors, and the same
two-step prompt (with a copy-link fallback) when they tap any Telegram button. On Android it tries
to hand the link straight to the Telegram app first. Test it with `?sim=tiktok`,
`?sim=instagram` or `?sim=facebook` on the end of the URL.

## Statistics

Visits are counted by Histats (site ID 5048003) and Google Analytics (G-MS9WLJWYEQ).
