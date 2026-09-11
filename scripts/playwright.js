/* Finds Playwright wherever it happens to live on this machine.

   These scripts have no package.json of their own, because they are run by
   hand once in a while rather than as part of a build. Originally they pointed
   straight at the copy inside the Second Brain repo's test folder, which works
   until that folder moves. Try the sensible places in order and fail with an
   instruction rather than a stack trace. */

const path = require("path");

const CANDIDATES = [
  // a local install, if you ever run `npm i -D playwright` in this folder
  "playwright",
  "playwright-core",
  path.join(__dirname, "node_modules", "playwright"),
  path.join(__dirname, "..", "node_modules", "playwright"),
  // where it actually lives today: the Second Brain app's test harness
  path.join(__dirname, "..", "..", "App", "Second_Brain", "test", "node_modules", "playwright"),
  "C:/Users/prajith/Projects/App/Second_Brain/test/node_modules/playwright",
];

let loaded = null;
let tried = [];

for (const c of CANDIDATES) {
  try {
    loaded = require(c);
    break;
  } catch (e) {
    tried.push(c);
  }
}

if (!loaded) {
  console.error(
    "\nCould not find Playwright. Looked in:\n  " + tried.join("\n  ") +
    "\n\nFix it with either:\n" +
    "  cd " + __dirname + " && npm install --no-save playwright && npx playwright install chromium\n" +
    "or point CANDIDATES in scripts/playwright.js at wherever Playwright lives.\n"
  );
  process.exit(1);
}

module.exports = loaded;
