/* PNG -> WebP, using Chromium's own encoder so no image library is needed.

   The seed scripts write PNG; index.html references .webp. This is the step in
   between. Run it after re-seeding, then delete the leftover PNGs.

   The PNG is handed to the page as a data: URL rather than a file:// URL,
   because a file:// image taints the canvas and blocks toDataURL.

   Usage:  node scripts/to-webp.js            (the four screenshots, q0.92)
           node scripts/to-webp.js 0.85       (same, different quality)
           node scripts/to-webp.js 0.9 a.png b.png
*/

const fs = require("fs");
const path = require("path");
const { chromium } = require("./playwright");

const IMAGES = path.join(__dirname, "..", "images");
const DEFAULTS = ["tracker-log.png", "tracker-journey.png", "brain-graph.png", "brain-ask.png"];

const args = process.argv.slice(2);
const quality = args.length && !isNaN(parseFloat(args[0])) ? parseFloat(args.shift()) : 0.92;
const files = args.length ? args : DEFAULTS;

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("about:blank");

  let pngTotal = 0, webpTotal = 0, done = 0;

  for (const f of files) {
    const src = path.join(IMAGES, f);
    if (!fs.existsSync(src)) {
      console.log("  skipped   " + f + " (not found)");
      continue;
    }
    const png = fs.readFileSync(src);
    pngTotal += png.length;

    const dataUrl = await page.evaluate(
      async ([url, q]) => {
        const img = new Image();
        img.src = url;
        await img.decode();
        const c = document.createElement("canvas");
        c.width = img.naturalWidth;
        c.height = img.naturalHeight;
        c.getContext("2d").drawImage(img, 0, 0);
        return c.toDataURL("image/webp", q);
      },
      ["data:image/png;base64," + png.toString("base64"), quality]
    );

    if (!dataUrl.startsWith("data:image/webp")) {
      console.log("  FAILED    " + f + " — this Chromium did not produce WebP");
      continue;
    }

    const buf = Buffer.from(dataUrl.split(",")[1], "base64");
    const out = src.replace(/\.png$/i, ".webp");
    fs.writeFileSync(out, buf);
    webpTotal += buf.length;
    done++;

    console.log(
      "  " + path.basename(out).padEnd(24) +
      (png.length / 1024).toFixed(0) + "K -> " + (buf.length / 1024).toFixed(0) + "K" +
      "  (-" + Math.round((1 - buf.length / png.length) * 100) + "%)"
    );
  }

  if (done) {
    console.log("  " + "-".repeat(46));
    console.log("  " + done + " converted at q" + quality + ": " +
      (pngTotal / 1024).toFixed(0) + " KB -> " + (webpTotal / 1024).toFixed(0) + " KB");
  }

  await browser.close();
})();
