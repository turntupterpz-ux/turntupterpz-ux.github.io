# TurntUpTerpz website

A mobile-first static website hosted with GitHub Pages at
[turntupterpz.com](https://turntupterpz.com).

## Project structure

```text
.
├── index.html                    Main website
├── vouches.html                  Redirect for old vouch-page links
├── assets/
│   ├── css/styles.css            Site design and responsive layout
│   ├── js/app.js                 Gallery, menu, analytics, and dialogs
│   └── images/
│       ├── brand/                Logo files
│       ├── menu/                 Inventory, ordering, and shipping images
│       └── vouches/
│           ├── full/             Original full-size vouch screenshots
│           └── thumbs/           Lightweight WebP gallery thumbnails
└── CNAME                         Custom-domain configuration
```

## Adding a customer vouch

1. Add the original screenshot to `assets/images/vouches/full/`.
2. Export a WebP thumbnail no wider than 440 px into
   `assets/images/vouches/thumbs/`.
3. Add the two filenames to the `vouches` list at the top of
   `assets/js/app.js`.

Keep personal information covered before publishing screenshots. Use short,
lowercase filenames for new images and avoid committing duplicate files.

## Updating the inventory

The readable mobile inventory is stored in the `inventoryPanel` section of
`index.html`. Update its date, strains, classifications, and pricing together
whenever the menu changes. The order and shipping reference images remain in
`assets/images/menu/`.

The Telegram channel, automated store bot, and SMS links are maintained in
`index.html`. Keep the TikTok browser instructions visible because `sms:` links
do not open reliably inside TikTok’s in-app browser.
