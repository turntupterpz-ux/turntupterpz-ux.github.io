# TurntUpTerpz website

A mobile-first static website hosted with GitHub Pages at
[turntupterpz.com](https://turntupterpz.com). The homepage ("Proof + price") is built for visitors
arriving from TikTok: the first screen pairs the price hook ("Concentrates as low as $5/g") with real
customer quotes and one big "Public Telegram channel" button, then a "Been burned before?" section,
the menu, every vouch, shipping and FAQ. It started as `/drafts/tiktok/6-proof-price/`. The previous
scroll-motion homepage ("Drip") is kept at `/drafts/7-drip/`.

## Project structure

```text
.
├── index.html                    Homepage (Proof + price)
├── faq.html                      Full FAQ
├── menu.html                     Full menu image
├── vouches.html                  Redirect for old vouch-page links
├── 404.html                      "Page not found" page (GitHub Pages serves it for any missing URL)
├── assets/
│   ├── css/proof.css             Homepage design
│   ├── css/drip.css              Former Drip homepage design (drafts/7-drip, drafts/top, escape drafts)
│   ├── css/site.css              FAQ and menu page design
│   ├── css/dialogs.css           Vouch viewer and "open in browser" popups (homepage and drafts)
│   ├── css/fonts.css             Self-hosted Bagel Fat One, DM Sans and DM Mono (files in assets/fonts/)
│   ├── js/site.js                Shared data: links, menu, vouch list, shipping countdown, viewer
│   ├── js/scroll.js              Scroll-motion engine (pinned scenes, parallax, reveals)
│   ├── js/proof.js               Homepage: menu, quote cards, vouch grid, shipping, live ship-today countdown
│   ├── js/drip.js                Former Drip homepage script (drafts only)
│   ├── js/app.js                 Previous homepage script (still used by /facetime/)
│   ├── js/motion.js              Scroll-driven product animations
│   ├── js/coach.js               TikTok / Instagram / Facebook in-app browser escape (live pages)
│   ├── js/leave.js               Older in-app browser popup (drafts and redesigns)
│   ├── motion/<product>/         Animation frames (Blender renders), 640px and 360px
│   └── images/
│       ├── brand/                Logo (full size + small favicon/touch/header sizes) and share.jpg (link preview)
│       ├── icons.svg             Icon sprite
│       ├── dab-icons.svg         Dab stickers (rig, banger, carb cap, dabber, torch, jar…)
│       ├── menu/                 Menu image
│       ├── products/             Disposable studio shots
│       └── vouches/
│           ├── full/             Original full-size vouch screenshots
│           └── thumbs/           Lightweight WebP gallery thumbnails
├── redesign/                     The five redesign drafts (not linked, noindex)
├── drafts/                       More drafts, incl. the scroll-motion ones (6-heat, 7-drip = former homepage) and tiktok/ · /drafts/
├── tools/render/                 Blender scripts that make the product renders
└── CNAME                         Custom-domain configuration
```

## Links

Every **Order** button and every product "Ask about this" button goes to the Telegram channels folder
(`t.me/addlist/u3J2k7PsK3w5MzQx`). The personal account (`t.me/TurntUpTerp`) is only for questions
("DM me" in the top bar and on each product card, "Message me" in Good to know and the footer)
and FaceTime requests. Both are set in `assets/js/site.js` (`links`) and written directly
into `index.html`, `menu.html` and `faq.html`. Search for `t.me/` to change them everywhere.

## Updating the menu

Prices and strains live in the `menu` object near the top of `assets/js/site.js`. Update the
date (`updated`) and the prices together whenever the menu changes. The full menu image is
`assets/images/menu/menu-r7.webp` (linked from `index.html` and `links.menuImage` in `site.js`).

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

TikTok, Instagram and Facebook open links in their own browser, which blocks Telegram. On the
homepage, menu and FAQ, `assets/js/coach.js` (+ `assets/css/coach.css`) handles those visitors:
a hint chip points at the app's ••• button, and tapping any Telegram button opens a coach card with a
looping mini phone that acts out the taps (••• → Open in browser → Order) plus a Copy link fallback.
On Android it first hands the link straight to the Telegram app. Everyone else never sees it.
Test with `?sim=tiktok`, `?sim=instagram` or `?sim=facebook` (add `&os=android` for Android wording).
The older `leave.js` popup is still used by the drafts and redesigns.

## Statistics

Visits are counted by Histats (site ID 5048003) and Google Analytics (G-MS9WLJWYEQ).
