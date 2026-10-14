# Drafts

Homepage experiments, published at `turntupterpz.com/drafts/` (`noindex`, not linked from the live site,
no analytics). `index.html` lists them all.

## Motion drafts (6 and 7)

Both pull the menu, links, vouches and shipping countdown from `../assets/js/site.js`, so they stay
current with the live site. Telegram links go through `../assets/js/leave.js` like everywhere else.

| Folder | Direction |
| --- | --- |
| `6-heat/` | Dark, cinematic. A pinned scene where scrolling takes a dab (torch → cool down → drop → cap → vapor), then a sideways product run, vouch rails, a FaceTime phone and a falling shipping box. |
| `7-drip/` | Bright, sticker style. Honey drips that stretch and fall into a filling jar, floating dab stickers, stacking menu cards, a temperature dial, a drifting vouch wall. |

## How the motion works

- `kit/scroll.js` — a small engine (no libraries). Sections marked `data-scene="pin"` stay on screen
  while you scroll through them and get a progress value from 0 to 1, split into steps. Each draft's
  `app.js` turns that progress into movement. Values ease toward the scroll position, which gives the
  motion its weight.
- `kit/dab-icons.svg` — the dab icons (rig, banger, carb cap, dabber, torch, jar, diamond, drop, terp
  pearl, pen, leaf, box). Each page sets the colours, so they glow in Heat and look like stickers in Drip.
- Product animations are the existing Blender renders in `../assets/motion/`.

Approach, from current scroll-design practice: scroll is the timeline (scrub, don't trigger), one pinned
"story" scene per page, things in the foreground move faster than the background, and only
`transform`/`opacity` animate so phones stay smooth. A plain-JS engine was used instead of CSS
`animation-timeline`, which Firefox still doesn't support. Visitors with "reduce motion" turned on get
every scene finished and still.
