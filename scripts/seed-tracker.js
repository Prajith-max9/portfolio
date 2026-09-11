/* Seeds the PRAZE fitness tracker in a THROWAWAY Playwright context and
   screenshots the log and Journey views.

   Isolation: chromium.launch() + newContext() = ephemeral profile, empty
   storage, discarded on close. No userDataDir, so the real Chrome profile is
   never opened. Runs against the deployed fitness.html; nothing local changes.

   Seeding path: the app's documented load order is
     IndexedDB "praze"/kv/state  ->  legacy localStorage "praze.v1"  ->  seed
   so writing the legacy blob before boot lets the app's own normalize() and
   migration promote it into IndexedDB. That way the data is validated by the
   app rather than by my guess at the shape. */

const path = require("path");
const { chromium } = require("./playwright");

const URL = "https://prajith-max9.github.io/praze-website/fitness.html";
const OUT = path.join(__dirname, "..", "images");
const DAY = 86400000;

const pad2 = (n) => String(n).padStart(2, "0");
const dayStr = (daysAgo) => {
  const d = new Date(Date.now() - daysAgo * DAY);
  return d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate());
};
const stampAt = (daysAgo, hour, min) => {
  const d = new Date(Date.now() - daysAgo * DAY);
  d.setHours(hour, min, 0, 0);
  return d.getTime();
};

/* 12 sessions, 3 a week for 4 straight weeks, ending today. Four consecutive
   training weeks gives the Journey a real streak instead of a flat 1. */
const OFFSETS = [26, 24, 22, 19, 17, 15, 12, 10, 8, 5, 3, 0];

/* Progressive overload per week. Three exercises, each logged every session,
   so Records/e1RM and the Progress trend all have 12 points to work with. */
const PLAN = {
  "Incline DB Press": {
    warm: 12.5,
    weeks: [
      { w: [20, 20, 22.5], r: [10, 10, 8] },
      { w: [22.5, 22.5, 25], r: [10, 9, 8] },
      { w: [25, 25, 27.5], r: [9, 10, 8] },
      { w: [27.5, 27.5, 30], r: [9, 10, 8] },
    ],
  },
  "Wide-Grip Lat Pulldown": {
    warm: 30,
    weeks: [
      { w: [45, 45, 47.5], r: [10, 10, 9] },
      { w: [47.5, 50, 50], r: [10, 9, 10] },
      { w: [52.5, 52.5, 55], r: [9, 10, 8] },
      { w: [55, 57.5, 57.5], r: [9, 8, 9] },
    ],
  },
  "Leg Press": {
    warm: 60,
    weeks: [
      { w: [100, 100, 110], r: [12, 12, 10] },
      { w: [110, 120, 120], r: [12, 10, 10] },
      { w: [120, 130, 130], r: [10, 10, 9] },
      { w: [140, 140, 150], r: [9, 10, 8] },
    ],
  },
};

function buildWorkouts() {
  return OFFSETS.map((off, i) => {
    const week = Math.floor(i / 3);
    const slot = i % 3;
    const today = off === 0;

    const exercises = Object.keys(PLAN).map((name, xi) => {
      const p = PLAN[name];
      const w = p.weeks[week].w[slot];
      const r = p.weeks[week].r[slot];
      const sets = [
        { w: p.warm, r: 10, t: "warmup" },
        { w, r, t: "working" },
        { w, r, t: "working" },
        { w, r: Math.max(5, r - 2), t: "working" },
      ];
      // last session of each week finishes the press with a drop set — shows
      // the set-tagging feature with something other than warm-up/working
      if (slot === 2 && xi === 0) sets.push({ w: Math.round(w * 0.6 * 2) / 2, r: 8, t: "drop" });
      return { id: "ex-" + i + "-" + xi, name, sets };
    });

    return {
      id: "wk-" + i,
      date: dayStr(off),
      startedAt: stampAt(off, 17, 20),
      // today's session is still open, so the log view shows a live workout
      endedAt: today ? null : stampAt(off, 18, 32),
      exercises,
    };
  });
}

const TEMPLATES = [
  { id: "t1", name: "Pull · Lat Focus", lastUsed: dayStr(3),
    exercises: ["Wide-Grip Lat Pulldown", "Chest-Supported Row", "Straight-Arm Pulldown", "Face Pull", "Incline DB Curl", "Hammer Curl"] },
  { id: "t2", name: "Push · Delt Focus", lastUsed: dayStr(5),
    exercises: ["Seated DB Shoulder Press", "Incline DB Press", "Cable Lateral Raise", "Overhead Triceps Extension", "Hanging Knee Raise"] },
  { id: "t3", name: "Upper · Aesthetic", lastUsed: dayStr(8),
    exercises: ["Incline DB Press", "Neutral-Grip Lat Pulldown", "Cable Lateral Raise", "Cable Curl", "Rope Pushdown", "Hanging Leg Raise"] },
  { id: "t4", name: "Legs", lastUsed: dayStr(10),
    exercises: ["Leg Press", "Romanian Deadlift", "Leg Extension", "Seated Leg Curl", "Standing Calf Raise"] },
];

const BODYWEIGHT = [
  { date: dayStr(27), kg: 67.4 },
  { date: dayStr(20), kg: 67.9 },
  { date: dayStr(13), kg: 68.6 },
  { date: dayStr(6), kg: 69.3 },
  { date: dayStr(0), kg: 70.1 },
];

/* Mirror of the app's own lifetimeTotals + MILESTONES, so every badge the data
   already earns is pre-marked as seen and no celebration toast fires over a
   screenshot. */
const MILESTONES = [
  { id: "w10", t: "workouts", n: 10 }, { id: "w50", t: "workouts", n: 50 },
  { id: "w100", t: "workouts", n: 100 }, { id: "s500", t: "sets", n: 500 },
  { id: "s1000", t: "sets", n: 1000 }, { id: "t10", t: "tonnes", n: 10 },
  { id: "t50", t: "tonnes", n: 50 }, { id: "t100", t: "tonnes", n: 100 },
];

function totals(workouts) {
  let w = 0, sets = 0, kg = 0;
  for (const s of workouts) {
    let any = false;
    for (const ex of s.exercises) for (const st of ex.sets) {
      sets++; if (st.t !== "warmup") kg += st.w * st.r; any = true;
    }
    if (any) w++;
  }
  return { workouts: w, sets, kg, tonnes: kg / 1000 };
}

function buildState() {
  const workouts = buildWorkouts();
  const tot = totals(workouts);
  const seen = MILESTONES.filter(
    (m) => (m.t === "workouts" ? tot.workouts : m.t === "sets" ? tot.sets : tot.tonnes) >= m.n
  ).map((m) => m.id);

  return {
    state: {
      v: 3.1,
      workouts,
      templates: TEMPLATES,
      bodyweight: BODYWEIGHT,
      exMeta: {
        "incline db press": { muscle: "Chest", notes: "", rest: 120 },
        "wide-grip lat pulldown": { muscle: "Back", notes: "", rest: 90 },
        "leg press": { muscle: "Quads", notes: "", rest: 150 },
      },
      milestonesSeen: seen,
      settings: { unit: "kg", restDur: 90, restSound: false, weeklyGoal: 4,
                  oled: false, barKg: 20, barLb: 45 },
    },
    tot, seen,
  };
}

(async () => {
  const { state, tot, seen } = buildState();
  console.log("seeding: " + tot.workouts + " workouts, " + tot.sets + " sets, " +
    Math.round(tot.kg).toLocaleString("en-US") + " kg (" + tot.tonnes.toFixed(1) + "t)");
  console.log("milestones pre-marked seen:", seen.join(", ") || "none");

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 430, height: 900 },
    // These now render ~398px wide in the card (max-height went 600 -> 760), so
    // the 430px capture is shown at ~1:1 and the app's text stays readable.
    // dsf 2.5 gives 1075 physical px = 2.7x density on top of that.
    deviceScaleFactor: 2.5,
    isMobile: true,
    hasTouch: true,
  });

  await context.addInitScript(([json]) => {
    try { localStorage.setItem("praze.v1", json); } catch (e) {}
  }, [JSON.stringify(state)]);

  const page = await context.newPage();
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message.slice(0, 200)));
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text().slice(0, 200)); });

  await page.goto(URL, { waitUntil: "load", timeout: 60000 });
  await page.waitForTimeout(3500);

  // did the app migrate the blob into IndexedDB and light up its own numbers?
  // `state` is a top-level `let`, so it is script-scoped, not on window.
  // Read what actually landed in IndexedDB instead.
  const check = await page.evaluate(async () => {
    const s = await new Promise((res, rej) => {
      const rq = indexedDB.open("praze", 1);
      rq.onerror = () => rej(rq.error);
      rq.onsuccess = () => {
        const g = rq.result.transaction("kv", "readonly").objectStore("kv").get("state");
        g.onsuccess = () => res(g.result);
        g.onerror = () => rej(g.error);
      };
    });
    if (!s) return { error: "nothing in IndexedDB" };
    return {
      workouts: s.workouts.length,
      exercises: [...new Set(s.workouts.flatMap((w) => w.exercises.map((e) => e.name)))],
      bodyweight: s.bodyweight.length,
      milestonesSeen: s.milestonesSeen,
      migrated: localStorage.getItem("praze.v1") === null,
      activeView: (document.querySelector(".view.active") || {}).id || "?",
      hasJourneyCta: !!document.querySelector('[data-action="open-journey"]'),
      bodyText: document.body.innerText.replace(/\s+/g, " ").slice(0, 260),
    };
  });
  console.log("in-app:", JSON.stringify(check));
  console.log("page errors:", errs.length ? errs : "none");

  /* Both shots share one phone-sized viewport so the pair sits evenly in the
     portfolio card. 820 keeps the whole logging UI (session row through LOG
     SET) in frame, and tightens the journey panel, which is sized in dvh. */
  await page.setViewportSize({ width: 430, height: 820 });
  await page.waitForTimeout(600);

  // 1 · logging view: the open session, its tagged sets, steppers and LOG SET
  await page.evaluate(() => window.scrollTo(0, 800));
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + "/tracker-log.png" });
  console.log("captured tracker-log.png");

  /* 2 · Journey: the bodyweight panel is the one that literally reads as
     progress over time (start -> now, with both dates). Panels fade in via
     IntersectionObserver, so scroll it into view and wait for .seen. */
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(400);
  await page.click('[data-action="open-journey"]');
  await page.waitForTimeout(1600);

  const panelInfo = await page.evaluate(() => {
    const ps = [...document.querySelectorAll("#view-journey .jpanel")];
    return ps.map((p) => (p.querySelector(".j-lab") || {}).textContent || "(title)");
  });
  console.log("journey panels:", panelInfo.join(" | "));

  const bwIndex = panelInfo.findIndex((t) => /bodyweight/i.test(t));
  const target = bwIndex >= 0 ? bwIndex : 1;
  await page.evaluate((n) => {
    document.querySelectorAll("#view-journey .jpanel")[n].scrollIntoView({ block: "center" });
  }, target);
  await page.waitForTimeout(1400);

  const panelState = await page.evaluate((n) => {
    const p = document.querySelectorAll("#view-journey .jpanel")[n];
    return { revealed: p.classList.contains("seen"), text: p.innerText.replace(/\s+/g, " ").trim().slice(0, 90) };
  }, target);
  console.log("journey panel " + target + ": revealed=" + panelState.revealed + " — " + panelState.text);

  await page.screenshot({ path: OUT + "/tracker-journey.png" });
  console.log("captured tracker-journey.png");

  await browser.close();
})();
