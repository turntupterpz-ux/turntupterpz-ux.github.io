# Redesign drafts

Five complete homepage redesigns. Draft 05 (Pocket) is now the live homepage. The drafts stay at
`/redesign/` for reference: not linked from the site, and `noindex` so search engines skip them.

| Folder | Direction |
| --- | --- |
| `01-studio/` | Light product catalogue built around the 3D renders. Sticky menu/message dock on phones. |
| `02-almanac/` | Editorial, printed-page feel. Serif headlines, a menu "bill of fare", customer "letters". |
| `03-night-menu/` | Dark and menu-first. The full price menu as readable HTML with category tabs. |
| `04-grid/` | Swiss-style. Huge type, hairlines, one cobalt accent against the golden renders. |
| `05-pocket/` | Behaves like a phone app: tab bar, bottom sheets, live shipping countdown, auto dark mode. |

## What changed for visitors (all drafts)

- The pop-up announcement is now a small dismissible notice, so the page opens straight away.
- Products are shown with 3D renders and starting prices instead of only a link out.
- Each product has an "Ask about this" link that opens Telegram with a message already typed.
- A live line says how long is left to order for same-day shipping (Mon–Sat, 2 PM PT cutoff).
- The in-app browser escape (TikTok / Instagram / Facebook) still runs on every outbound link
  through the live site's `assets/js/leave.js`.
- No analytics fire from the drafts.

## Shared pieces

- `../assets/js/site.js` — vouch list, links, the menu (prices from the 10/3 menu image), shipping
  countdown, vouch viewer. Shared with the live homepage: update the menu there and everything follows.
- `../assets/js/motion.js` — plays the product animations as you scroll. Visitors with "reduce motion"
  turned on see the still final frame.
- `../assets/motion/<product>/` — the animation frames, rendered in Blender (32 frames, 640px and 360px)
  plus `poster.webp`, the final settled frame.

## Before promoting one to the real homepage

- Check the product blurbs and prices in `assets/js/site.js` — they're copied from the 10/3 menu.
- Add back the analytics snippets from `index.html`.
- Remove `noindex` and the "Draft" tag at the bottom.
