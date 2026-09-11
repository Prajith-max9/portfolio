# scripts

Regenerates the images in `../images/`. Nothing here runs at build time — the
site is a single static `index.html` with no build step. Run these by hand only
when an image needs remaking.

## Requirements

Node, plus Playwright with Chromium. `playwright.js` looks for an existing
install in a few likely places, including the Second Brain repo's test folder,
which is where it lives today. If it can't find one it tells you how to install:

    cd scripts
    npm install --no-save playwright
    npx playwright install chromium

## Regenerating the share card

    node scripts/og-banner.js

Writes `images/og-banner.jpg` at exactly 1200x630. The markup is inline in the
script, so this is the only copy of the banner's source. Colours are copied from
`index.html`; if the palette changes, update both.

JPEG q95 on purpose — see the note at the top of the script. WebP is four times
smaller but visibly blotches the film grain, and PNG is 516 KB because grain
doesn't compress losslessly.

## Regenerating the app screenshots

Two steps, because the seeders write PNG and the page references `.webp`:

    node scripts/seed-brain.js      # brain-graph, brain-ask (+ diary, goals)
    node scripts/seed-tracker.js    # tracker-log, tracker-journey
    node scripts/to-webp.js         # converts the four the page uses
    # then delete the leftover .png files

`to-webp.js` uses Chromium's own encoder, so no image library is needed. It
takes an optional quality: `node scripts/to-webp.js 0.85`.

### What the seeders do

Each one opens a **throwaway Playwright context** — an ephemeral profile with
empty storage, no `userDataDir` — and seeds demo data into it, then screenshots
the live app on GitHub Pages. Your real browser profile and your real notes and
workouts are never touched, and nothing local is modified.

The data is **demo content**, which is why the captions on the page say
"(sample data)".

- `seed-brain.js` writes the `praze.brain.v1` localStorage blob before the app
  boots. The content is clustered into four topics with cross-links on purpose:
  the TF-IDF engine needs shared vocabulary and 5+ non-clip notes before it will
  draw any similarity edges, so generic filler produces an empty graph.
- `seed-tracker.js` writes the legacy `praze.v1` blob and lets the app's own
  `normalize()` migrate it into IndexedDB, so the data is validated by the app
  rather than by a guess at the shape. It pre-marks earned milestones as seen so
  no celebration toast fires over a screenshot.

### Why the capture sizes are what they are

Both seeders capture at a viewport that **matches the width the image is
displayed at** in `index.html` (900px for the Second Brain pair, 430px for the
tracker pair), then use `deviceScaleFactor` 2.5 for pixel density.

This matters more than it sounds. These were originally captured at 1180px wide
and displayed in a 442px column — 5.3x the pixels needed, but the app's layout
was squeezed 2.67x, so its 14px UI text rendered at about 5px and was unreadable.
Raising the scale factor does not fix that; it only adds pixels to an image
that is being shrunk. If you change the display size in `index.html`, change the
capture width here to match.
