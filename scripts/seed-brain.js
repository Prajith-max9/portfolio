/* Seeds demo data into a THROWAWAY Playwright context and screenshots four tabs.
   Isolation: browser.newContext() gets an ephemeral profile with empty storage,
   discarded on close. The user's real Chrome profile is never opened or touched.

   Content is deliberately clustered into four topics (training / app / content /
   school) with cross-cluster wiki-links, so the TF-IDF engine finds real
   similarity pairs and the graph renders as one connected structure rather than
   a scatter of orphans. */

const path = require("path");
const { chromium } = require("./playwright");

const URL = "https://prajith-max9.github.io/praze-website/brain.html";
const OUT = path.join(__dirname, "..", "images");

const DAY = 86400000;
const now = Date.now();

function at(daysAgo, hour) {
  const d = new Date(now - daysAgo * DAY);
  d.setHours(hour, 17, 0, 0);
  return d.getTime();
}

/* Diary: 7 entries across two weeks. The last three are consecutive
   (today, -1, -2) so the streak reads "3-day streak · best 3". */
const diary = [
  {
    daysAgo: 13, hour: 21,
    body:
      "First proper week back and the timetable is heavier than last term. Chemistry is the subject " +
      "that needs real revision time rather than just reading through the notes again. " +
      "Going to try blocking an hour after training each day — see [[Revision system that actually sticks]].",
  },
  {
    daysAgo: 10, hour: 20,
    body:
      "Good training session. The squat felt heavy on the warm up and then fine once there were proper " +
      "plates on the bar. Logged the whole session in the tracker afterwards, which is automatic now. " +
      "Still doing the plate maths in my head at the rack — [[Plate calculator for the tracker app]].",
  },
  {
    daysAgo: 6, hour: 22,
    body:
      "Mundane day. School, bus, homework, bed. Did not train and did not film anything. " +
      "Cleared the chemistry worksheet backlog at least, so the revision pile is smaller than it was.",
  },
  {
    daysAgo: 4, hour: 19,
    body:
      "Spent an hour working out whether a small product drop would actually make money. " +
      "The margin is thinner than expected once shipping is in, so pricing has to do the work — " +
      "[[Bundle pricing for a small drop]]. Parked it for now, but the maths was worth doing.",
  },
  {
    daysAgo: 2, hour: 19,
    body:
      "Shipped the offline fix tonight. Took far longer than it should have because the bug was in my own " +
      "caching layer and not in storage at all. Testing offline properly means turning the wifi off " +
      "and actually using it. [[Offline-first is the whole pitch]] — this is why.",
  },
  {
    daysAgo: 1, hour: 20,
    body:
      "Training, then editing. Filmed two clips at the gym and cut them down after dinner. " +
      "The colour grading pass takes longer than the editing itself, which says something about my process. " +
      "Chemistry revision got half an hour, which is not enough. [[Reel series: build in public]].",
  },
  {
    daysAgo: 0, hour: 18,
    body:
      "Decent session, went up on the main lift for the first time in three weeks. " +
      "Posted one reel and the build in public angle lands better than the training clips on their own — " +
      "[[Reel series: build in public]] is working. Tomorrow: revision first, training second, content last.",
  },
];

/* Ideas: business, content, random, study, and two tagged #app. */
const ideas = [
  {
    daysAgo: 15, hour: 16,
    title: "Offline-first is the whole pitch",
    tags: ["app", "product"],
    body:
      "Every competing app assumes a connection and an account. The gym is exactly where signal dies, " +
      "so working with the wifi off is not a technical footnote, it is the selling point. " +
      "Lead with offline in the description instead of burying it in a feature list. " +
      "Storage and caching notes: [[IndexedDB API reference]] and [[What makes a good offline experience]].",
  },
  {
    daysAgo: 12, hour: 13,
    title: "Plate calculator for the tracker app",
    tags: ["app", "fitness"],
    body:
      "Doing plate maths mid session is the last real friction in the tracker. Give it a target weight " +
      "and the bar weight and show the plates per side. Small feature, but it removes the final reason " +
      "to pick up a phone calculator at the rack during training. " +
      "Same category of annoyance as [[Why do gyms never have working clocks]].",
  },
  {
    daysAgo: 9, hour: 17,
    title: "Reel series: build in public",
    tags: ["content"],
    body:
      "Post the process rather than the finished result. One clip a week showing what got built or trained " +
      "that week. The training content and the app content stop competing and become one story, and it is " +
      "cheaper to film because the footage is just the work. Grading reference: [[Colour grading basics]].",
  },
  {
    daysAgo: 7, hour: 15,
    title: "Bundle pricing for a small drop",
    tags: ["business"],
    body:
      "If a small product drop ever happens, bundle pricing beats single item pricing at low volume. " +
      "Two items at a slight discount lifts the average order enough to cover shipping. " +
      "Model the margin properly before committing to any stock — thin margins do not survive a bad guess.",
  },
  {
    daysAgo: 5, hour: 11,
    title: "Why do gyms never have working clocks",
    tags: ["random"],
    body:
      "Every gym has mirrors on all four walls and not one clock that tells the time. " +
      "Rest timers exist in the tracker because of this exact problem — you end up guessing how long " +
      "you sat between sets. Probably not a business, just something I notice every session.",
  },
  {
    daysAgo: 3, hour: 14,
    title: "Revision system that actually sticks",
    tags: ["study"],
    body:
      "Re-reading chemistry notes feels productive and does nothing. Past papers under time pressure are " +
      "the only thing that has moved the grade. Schedule the papers into the timetable like training " +
      "sessions rather than leaving revision to whatever time is left over at the end of the day.",
  },
];

/* Clips: saved links with a short reason. Excluded from the similarity gate by
   design, so they reach the graph through wiki-links from the notes above. */
const clips = [
  {
    daysAgo: 14, hour: 14,
    title: "IndexedDB API reference",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API",
    tags: ["app"],
    body: "Saved because I keep forgetting the transaction lifecycle. The worked examples are the useful part.",
  },
  {
    daysAgo: 8, hour: 12,
    title: "What makes a good offline experience",
    url: "https://web.dev/learn/pwa/offline-data",
    tags: ["app", "product"],
    body: "Good framing on what to cache and when. Saved for the sync work rather than for the code itself.",
  },
  {
    daysAgo: 2, hour: 21,
    title: "Colour grading basics",
    url: "https://web.dev/learn/images/",
    tags: ["content"],
    body: "Saved for the reel edits. Mostly interested in the contrast and grain section near the end.",
  },
];

const goals = [
  { title: "Post 12 reels this month", target: 12, progress: 7, daysAgo: 14 },
  { title: "Train 4x this week", target: 4, progress: 3, daysAgo: 6 },
  { title: "Finish 10 chemistry past papers", target: 10, progress: 4, daysAgo: 16 },
];

function buildStore() {
  const notes = [];
  diary.forEach((e, i) => {
    const t = at(e.daysAgo, e.hour);
    notes.push({ id: "demo-diary-" + i, title: "", body: e.body, tags: [], pinned: false,
      kind: "diary", url: "", photo: "", createdAt: t, updatedAt: t });
  });
  ideas.forEach((e, i) => {
    const t = at(e.daysAgo, e.hour);
    notes.push({ id: "demo-idea-" + i, title: e.title, body: e.body, tags: e.tags, pinned: false,
      kind: "idea", url: "", photo: "", createdAt: t, updatedAt: t });
  });
  clips.forEach((e, i) => {
    const t = at(e.daysAgo, e.hour);
    notes.push({ id: "demo-clip-" + i, title: e.title, body: e.body, tags: e.tags, pinned: false,
      kind: "clip", url: e.url, photo: "", createdAt: t, updatedAt: t });
  });
  return {
    schemaVersion: 2, rev: 1, notes,
    goals: goals.map((g, i) => ({
      id: "demo-goal-" + i, title: g.title, target: g.target, progress: g.progress,
      createdAt: at(g.daysAgo, 9), completedAt: null,
    })),
    todos: [],
  };
}

(async () => {
  const store = buildStore();
  const browser = await chromium.launch();
  /* 900 CSS px matches the width these are displayed at in the portfolio card,
     so the app's layout is shown at 1:1 and its 14px UI text stays 14px on the
     page. dsf 2.5 then supplies 2250 physical px = 2.5x density for retina.
     (The old 1180px capture was 5.3x density but shrunk 2.67x on display —
     plenty of pixels, unreadable text. Width is what mattered, not density.) */
  const CAP_W = 900;
  const context = await browser.newContext({
    viewport: { width: CAP_W, height: 820 },
    deviceScaleFactor: 2.5,
  });

  await context.addInitScript(
    ([json]) => {
      try {
        localStorage.setItem("praze.brain.v1", json);
        localStorage.setItem("praze.brain.onboarded", "2");
        localStorage.setItem("praze.brain.theme", "dark");
        // Spread the force layout so node labels stop colliding and the graph
        // fills the canvas. All values sit inside the app's own clamped ranges.
        localStorage.setItem("praze.brain.graphsettings.v1", JSON.stringify({
          nodeSize: 1.15, linkThickness: 1.1, repelForce: 1.8,
          linkForce: 0.9, centerForce: 0.8, linkDistance: 1.7, showOrphans: true,
        }));
      } catch (e) {}
    },
    [JSON.stringify(store)]
  );

  const page = await context.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 160)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 160)); });

  await page.goto(URL + "#dashboard", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(2500);

  const diag = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem("praze.brain.v1"));
    const r = window.BrainAI.analyze(s.notes, Math.random());
    const titles = {};
    s.notes.forEach((n) => { if (n.title) titles[n.title.trim().toLowerCase()] = n.id; });

    const wikiPairs = new Set(); const dead = [];
    s.notes.forEach((n) => {
      const re = /\[\[([^\[\]]+)\]\]/g; let m;
      while ((m = re.exec(n.body))) {
        const t = titles[m[1].trim().toLowerCase()];
        if (!t) dead.push(m[1]);
        else if (t !== n.id) wikiPairs.add([n.id, t].sort().join("|"));
      }
    });
    const simPairs = new Set(r.pairs.map((p) => [p.a, p.b].sort().join("|")));
    const union = new Set([...wikiPairs, ...simPairs]);
    const connected = new Set();
    union.forEach((k) => k.split("|").forEach((id) => connected.add(id)));

    return {
      notes: s.notes.length,
      eligible: s.notes.filter((n) => n.kind !== "clip").length,
      wiki: wikiPairs.size, sim: simPairs.size, totalEdges: union.size,
      connectedNodes: connected.size, orphans: s.notes.length - connected.size,
      deadLinks: dead,
    };
  });
  console.log("nodes            :", diag.notes, "(" + diag.eligible + " eligible for similarity)");
  console.log("wiki edges       :", diag.wiki);
  console.log("similarity edges :", diag.sim);
  console.log("total edges      :", diag.totalEdges);
  console.log("connected nodes  :", diag.connectedNodes + "/" + diag.notes, "| orphans:", diag.orphans);
  console.log("dead wiki-links  :", diag.deadLinks.length ? diag.deadLinks : "none");
  console.log("page errors      :", errs.length ? errs : "none");

  /* ---------- screenshots ----------
     Diary and Goals both lead with a large empty composer. Left at scroll 0 the
     shot is mostly an empty textarea, so scroll the actual list into frame —
     the point of these images is populated content, not input boxes. */
  const scrollTo = async (sel, offset) => {
    await page.evaluate(
      ([s, o]) => {
        const el = document.querySelector(s);
        if (el) window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - o);
      },
      [sel, offset]
    );
    await page.waitForTimeout(700);
  };

  // Shorter viewports where the page is short: at max scroll a tall viewport
  // can't push the composer out of frame and leaves dead space beneath.
  const shot = async (hash, file, settleMs, sel, offset, height) => {
    await page.setViewportSize({ width: CAP_W, height: height || 820 });
    await page.goto(URL + "#" + hash, { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(settleMs);
    if (sel) await scrollTo(sel, offset);
    await page.screenshot({ path: OUT + "/" + file });
    console.log("captured", file);
  };

  /* The force layout starts from random positions, so label crowding varies run
     to run — and above 12 nodes the app caps label clearance at 40% on purpose,
     so some collisions are normal. Roll the layout several times, score each on
     overlapping labels (world units: halfLabel is what the sim's own minGap
     compares against), and keep the cleanest. */
  const fs = require("fs");
  let best = { score: Infinity, file: null };
  // The layout is deterministic given the canvas size, so re-running the same
  // viewport just reproduces the same picture. Vary the canvas instead.
  // width is now fixed by the display size, so sweep height for the layout
  const SIZES = [
    [CAP_W, 640], [CAP_W, 700], [CAP_W, 760],
    [CAP_W, 820], [CAP_W, 880], [CAP_W, 940],
  ];
  const TRIES = SIZES.length;

  for (let i = 0; i < TRIES; i++) {
    await page.setViewportSize({ width: SIZES[i][0], height: SIZES[i][1] });
    await page.goto(URL + "#graph", { waitUntil: "load", timeout: 60000 });
    await page.waitForTimeout(7000);

    const score = await page.evaluate(() => {
      const d = window.__brainDebug;
      if (!d || !d.positions || !d.positions.length) return null;
      const p = d.positions;
      let overlaps = 0;
      const LINE = 17; // label line height, world units
      for (let a = 0; a < p.length; a++) {
        for (let b = a + 1; b < p.length; b++) {
          const dx = Math.abs(p[a].x - p[b].x);
          const dy = Math.abs(p[a].y - p[b].y);
          if (dx < p[a].halfLabel + p[b].halfLabel && dy < LINE) overlaps++;
        }
      }
      const xs = p.map((n) => n.x), ys = p.map((n) => n.y);
      const spread = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
      return { overlaps, spread: Math.round(spread), nodes: p.length };
    });

    if (!score) { console.log("  graph try " + (i + 1) + ": no debug data"); continue; }
    // fewer collisions wins; a wider spread breaks ties
    const rank = score.overlaps * 1e9 - score.spread;
    const file = OUT + "/brain-graph-try" + i + ".png";
    await page.screenshot({ path: file });
    console.log("  " + SIZES[i][0] + "x" + SIZES[i][1] + ": " + score.overlaps +
      " label overlaps, spread " + score.spread);
    if (rank < best.score) {
      if (best.file) fs.unlinkSync(best.file);
      best = { score: rank, file, overlaps: score.overlaps };
    } else {
      fs.unlinkSync(file);
    }
  }
  fs.copyFileSync(best.file, OUT + "/brain-graph.png");
  fs.unlinkSync(best.file);
  console.log("captured brain-graph.png (best of " + TRIES + ", " + best.overlaps + " overlaps)");
  await shot("diary", "brain-diary.png", 1800, "#diary-list", 70, 820);
  await shot("goals", "brain-goals.png", 1800, "#goal-list", 70, 620);

  // Ask: type a question and let the offline retrieval answer before capturing
  await page.setViewportSize({ width: CAP_W, height: 760 });
  await page.goto(URL + "#ask", { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(1500);
  await page.fill("#ask-input", "what have I been working on in the app?");
  await page.click("#ask-btn");
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.scrollTo(0, 150));
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + "/brain-ask.png" });
  console.log("captured brain-ask.png");

  await browser.close();
})();
