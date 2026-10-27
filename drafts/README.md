# Drafts

Homepage experiments, published at `turntupterpz.com/drafts/` (`noindex`, not linked from the live site,
no analytics). `index.html` lists them all.

## Motion drafts (6 and 7)

Both pull the menu, links, vouches and shipping countdown from `../assets/js/site.js`, so they stay
current with the live site. Telegram links go through `../assets/js/leave.js` like everywhere else.

| Folder | Direction |
| --- | --- |
| `6-heat/` | Dark, cinematic. A pinned scene where scrolling takes a dab (torch → cool down → drop → cap → vapor), then a sideways product run, vouch rails, a FaceTime phone and a falling shipping box. |
| `7-drip/` | **Now the live homepage** (`/index.html`, `assets/css/drip.css`, `assets/js/drip.js`); the folder redirects to `/`. Bright, sticker style. Honey drips that stretch and fall into a filling jar, floating dab stickers, stacking menu cards, a temperature dial, a drifting vouch wall. |

## Top-button drafts (`top/`)

`top/1.html` … `top/5.html` are copies of the live homepage with the quick links (Join channel, Menu,
See vouches, Schedule FaceTime, DM me directly) moved up near the header. Each keeps its layout CSS in
a `<style>` block; the shared CSS is untouched. 1: panel under the header · 2: sticky header with a
Join strip and tabs · 3: chips under the header · 4: Join pill in the header · 5: icon tiles and a
Join banner.

## TikTok conversion drafts (`tiktok/`)

Six homepage ideas for turning TikTok visitors into channel joins, each built around one
research-backed principle. `tiktok/index.html` has the side-by-side measurements, the evidence and
sources. Every page pulls data from `../assets/js/site.js`, keeps the live TikTok escape
(`coach.js`), adds a one-tap 21+ check (once per visit; `?gate=1` shows it again) and a
"WHY THIS DRAFT?" tab with that draft's evidence. Shared look and helpers: `tiktok/shared.css`,
`tiktok/shared.js`.

| Folder | Idea |
| --- | --- |
| `1-hook/` | First screen answers what, how much, why trust you, with one button. |
| `2-proof/` | Opens with real vouch quotes, plus a "Been burned before?" section on scams. |
| `3-one-tap/` | Two things to tap on screen one; the order button stays in the thumb zone. |
| `4-feed/` | TikTok-style full-screen swipe cards with progress dots. |
| `5-lite/` | No web fonts or animation frames; full menu with prices on screen one (~0.1 MB). |
| `6-proof-price/` | Proof first (2) with the "as low as $5/g" headline from Hook (1) on top. |

## Escape drafts (`escape/`)

Four ideas for telling TikTok / Instagram visitors that Telegram buttons won't open in the app's
browser, and getting them out. Each is the live homepage (built by `escape/build.py`) with
`leave.js` swapped for one idea in `escape.js` + `escape.css`.

| Folder | Idea |
| --- | --- |
| `1-coach/` | Animated mini phone acts out the taps; rings on •••; hint chip all visit. |
| `2-flip/` | Lock stickers on Telegram buttons; the tapped button flips into the steps with a line to •••. |
| `3-gate/` | Full-screen heads-up on arrival, then "ordering locked" strip and "Unlock ordering" buttons. |
| `4-plan-b/` | Telegram-style chat with three ways out: open in browser, copy link, search @TurntUpTerp. |

`escape/shared.js` detects the app (or pretends to: `?sim=tiktok|instagram|facebook|none`,
`?os=ios|android`), draws a fake TikTok bar with a working ••• menu for previews, and adds the DRAFT
tab. Run `python3 drafts/escape/build.py` after homepage changes to refresh the four pages.

## How the motion works

- `../assets/js/scroll.js` — a small engine (no libraries). Sections marked `data-scene="pin"` stay on screen
  while you scroll through them and get a progress value from 0 to 1, split into steps. Each draft's
  `app.js` turns that progress into movement. Values ease toward the scroll position, which gives the
  motion its weight.
- `../assets/images/dab-icons.svg` — the dab icons (rig, banger, carb cap, dabber, torch, jar, diamond, drop, terp
  pearl, pen, leaf, box). Each page sets the colours, so they glow in Heat and look like stickers in Drip.
- Product animations are the existing Blender renders in `../assets/motion/`.

Approach, from current scroll-design practice: scroll is the timeline (scrub, don't trigger), one pinned
"story" scene per page, things in the foreground move faster than the background, and only
`transform`/`opacity` animate so phones stay smooth. A plain-JS engine was used instead of CSS
`animation-timeline`, which Firefox still doesn't support. Visitors with "reduce motion" turned on get
every scene finished and still.
