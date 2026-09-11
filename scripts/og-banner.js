/* Renders images/og-banner.jpg — the 1200x630 social share card.

   The markup lives in here rather than in a separate .html file so the banner
   is regenerable from this one script. Tokens are copied from index.html; if
   the site's palette changes, change them in both places.

   JPEG q95, not WebP or PNG:
     PNG        516 KB  (film grain is incompressible losslessly)
     JPEG q95    90 KB  clean, grain intact
     WebP q0.92  21 KB  smallest, but visibly blotchy — the encoder flattens
                        the low-contrast grain into blocks
   JPEG is also the format every social crawler reliably understands.

   Usage:  node scripts/og-banner.js
*/

const path = require("path");
const { chromium } = require("./playwright");

const OUT = path.join(__dirname, "..", "images", "og-banner.jpg");
const QUALITY = 95;

const HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<style>
  :root{
    --bg:#08080a; --text:#ececef; --text-dim:#9a9aa4; --text-mute:#6b6b75;
    --line:#1e1e24; --accent:#f2643a;
    --font:"Segoe UI",-apple-system,BlinkMacSystemFont,"Inter",Roboto,"Helvetica Neue",Arial,sans-serif;
    --mono:ui-monospace,"SF Mono","Cascadia Mono",Consolas,"Liberation Mono",monospace;
  }
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1200px;height:630px;overflow:hidden}
  body{background:var(--bg);color:var(--text);font-family:var(--font);
       -webkit-font-smoothing:antialiased;position:relative}

  /* the hero's ember glow, scaled for the wider frame */
  .glow{position:absolute;top:-190px;left:50%;transform:translateX(-50%);
        width:1180px;height:620px;pointer-events:none;
        background:radial-gradient(ellipse at center,rgba(242,100,58,.13),transparent 68%)}

  /* the page's film grain, same feTurbulence */
  .grain{position:absolute;inset:0;pointer-events:none;opacity:.032;
    background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)'/%3E%3C/svg%3E")}

  .frame{position:relative;height:100%;padding:76px 92px;
         display:flex;flex-direction:column;justify-content:space-between}
  .mark{font-weight:750;letter-spacing:.16em;font-size:20px}
  .mark span{color:var(--accent)}
  .eyebrow{font-family:var(--mono);font-size:17px;letter-spacing:.2em;
           text-transform:uppercase;color:var(--accent);margin-bottom:26px}
  h1{font-size:104px;font-weight:700;letter-spacing:-.04em;line-height:1;margin-bottom:28px}
  .sub{font-size:34px;color:var(--text-dim);letter-spacing:-.01em}
  .sub strong{color:var(--text);font-weight:600}
  .foot{display:flex;justify-content:space-between;align-items:flex-end;
        border-top:1px solid var(--line);padding-top:24px;
        font-family:var(--mono);font-size:15px;letter-spacing:.14em;
        text-transform:uppercase;color:var(--text-mute)}
</style>
</head>
<body>
  <div class="glow"></div>
  <div class="frame">
    <div class="mark">PRA<span>Z</span>E</div>
    <div>
      <p class="eyebrow">Chennai, India</p>
      <h1>Prajith Ganesh M</h1>
      <p class="sub">Building <strong>PRAZE</strong></p>
    </div>
    <div class="foot">
      <span>Offline-first apps &middot; Content systems</span>
      <span>Built not born</span>
    </div>
  </div>
  <div class="grain"></div>
</body>
</html>`;

(async () => {
  const browser = await chromium.launch();
  // dsf 1 => exactly 1200x630 physical pixels, which is what the spec wants
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.setContent(HTML, { waitUntil: "load" });
  await page.waitForTimeout(600);
  await page.screenshot({ path: OUT, type: "jpeg", quality: QUALITY });
  await browser.close();

  const size = require("fs").statSync(OUT).size;
  console.log("wrote " + OUT);
  console.log("1200x630, jpeg q" + QUALITY + ", " + (size / 1024).toFixed(0) + " KB");
})();
