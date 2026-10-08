# TurntUpTerpz website

A mobile-first static website hosted with GitHub Pages at
[turntupterpz.com](https://turntupterpz.com). It behaves like a phone app: tab bar, product
bottom sheets, a live same-day-shipping countdown, and light / dark mode that follows the phone.

## Project structure

```text
.
├── index.html                    Homepage (Home, Shop, Vouches, Help)
├── faq.html                      Full FAQ
├── vouches.html                  Redirect for old vouch-page links
├── assets/
│   ├── css/site.css              Site design (homepage + FAQ)
│   ├── js/site.js                Shared data: links, menu, vouch list, shipping countdown, viewer
│   ├── js/app.js                 Homepage: product cards and sheet, vouch grid, tab bar
│   ├── js/motion.js              Scroll-driven product animations
│   ├── js/leave.js               TikTok / Instagram / Facebook in-app browser warnings
│   ├── motion/<product>/         Animation frames (Blender renders), 640px and 360px
│   └── images/
│       ├── brand/                Logo files
│       ├── icons.svg             Icon sprite
│       ├── menu/                 Menu image
│       └── vouches/
│           ├── full/             Original full-size vouch screenshots
│           └── thumbs/           Lightweight WebP gallery thumbnails
├── redesign/                     The five redesign drafts (not linked, noindex)
└── CNAME                         Custom-domain configuration
```

## Links

The Telegram folder (menu and drops) and the personal Telegram account are set in
`assets/js/site.js` (`links`) and written directly into `index.html` and `faq.html`.
Search for `t.me/` to change them everywhere.

## Updating the menu

Prices and strains live in the `menu` object near the top of `assets/js/site.js`. Update the
date (`updated`) and the prices together whenever the menu changes. The full menu image is
`assets/images/menu/menu-r2.webp`.

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
