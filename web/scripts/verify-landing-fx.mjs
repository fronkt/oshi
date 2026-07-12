// verify-landing-fx.mjs — runtime check of the anime.js landing flourishes
// against the production build (next start, waitlist mode, no env needed):
// recap bars spring up, 92% ticks, step connector draws, waitlist success
// bursts (API stubbed), magnetic CTA pulls. Zero page errors allowed.
//
//   npm run build && node scripts/verify-landing-fx.mjs
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { chromium } from "playwright-core";

const SCRATCH =
  "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const WEB = path.resolve(import.meta.dirname, "..");
const PORT = 3007;
const BASE = `http://localhost:${PORT}`;

let pass = 0,
  fail = 0;
const ok = (name, cond, detail = "") => {
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    fail++;
    console.log(`  FAIL ${name}${detail ? ` — ${detail}` : ""}`);
  }
};

console.log("starting next start…");
const srv = spawn("npx", ["next", "start", "-p", String(PORT)], {
  cwd: WEB,
  env: { ...process.env },
  shell: true,
  stdio: ["ignore", "ignore", "ignore"],
});

let up = false;
for (let i = 0; i < 30 && !up; i++) {
  await new Promise((r) => setTimeout(r, 1000));
  up = await fetch(BASE, { redirect: "manual", signal: AbortSignal.timeout(3000) })
    .then((r) => r.status < 500, () => false);
}
if (!up) {
  console.log("server never came up");
  process.exit(1);
}

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));

  // stub the waitlist API so the success celebration can fire
  await page.route("**/api/waitlist", (route) =>
    route.fulfill({ json: { ok: true } }),
  );

  await page.goto(BASE, { waitUntil: "networkidle" });

  /* ── magnetic nav CTA ─────────────────────────────────────────────────── */
  const cta = page.locator("nav >> text=Get early access").first();
  const box = await cta.boundingBox();
  await page.mouse.move(box.x + box.width - 4, box.y + 2); // off-center pull
  await page.waitForTimeout(500);
  const t1 = await cta.evaluate(
    (el) => getComputedStyle(el.parentElement).transform,
  );
  await page.mouse.move(box.x + box.width / 2, box.y + 600); // far away
  await page.waitForTimeout(700);
  const t2 = await cta.evaluate(
    (el) => getComputedStyle(el.parentElement).transform,
  );
  const offset = (m) => {
    const p = m.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
    return p ? Math.hypot(p[4], p[5]) : 0;
  };
  ok(
    "magnetic CTA pulls toward the cursor and returns",
    offset(t1) > 1.5 && offset(t2) < 0.8,
    `pull ${offset(t1).toFixed(1)}px, rest ${offset(t2).toFixed(1)}px`,
  );

  /* ── bento: recap bars + percent ticker ───────────────────────────────── */
  // scroll the recap card itself into view (it sits at the bento's bottom row)
  await page.evaluate(() => {
    [...document.querySelectorAll("#features h3")]
      .find((h) => h.textContent.includes("anime week"))
      .scrollIntoView({ block: "center" });
  });
  await page.waitForTimeout(2200);
  const barScales = await page.evaluate(() => {
    const card = [...document.querySelectorAll("#features h3")]
      .find((h) => h.textContent.includes("anime week"))
      .closest("div");
    return [...card.querySelectorAll(".flex-1.rounded-sm")].map((b) => {
      const m = getComputedStyle(b).transform;
      if (m === "none") return 1;
      const p = m.match(/matrix\(([^)]+)\)/)?.[1].split(",").map(Number);
      return p ? p[3] : 0; // scaleY
    });
  });
  ok(
    "recap bars sprung up to full height",
    barScales.length === 7 && barScales.every((s) => s > 0.9),
    JSON.stringify(barScales.map((s) => s.toFixed(2))),
  );
  const pct = await page
    .locator("#features p", { hasText: /^92/ })
    .first()
    .textContent();
  ok("taste-match ticker settled on 92%", pct.trim() === "92%", pct);
  await page.screenshot({ path: `${SCRATCH}/fx-bento.png` });

  /* ── how-it-works: connector draw ─────────────────────────────────────── */
  await page.evaluate(() =>
    document.querySelector("#how").scrollIntoView({ block: "center" }),
  );
  await page.waitForTimeout(2000);
  const drawn = await page.evaluate(() => {
    const line = document.querySelector("#how svg line");
    if (!line) return { missing: true };
    const dash = line.getAttribute("stroke-dasharray");
    const off = parseFloat(line.getAttribute("stroke-dashoffset") ?? "0");
    return { dash, off };
  });
  ok(
    "step connector line finished drawing",
    !drawn.missing && Math.abs(drawn.off) < 1,
    JSON.stringify(drawn),
  );
  await page.screenshot({ path: `${SCRATCH}/fx-how.png` });

  /* ── waitlist success: spring + burst ─────────────────────────────────── */
  await page.evaluate(() =>
    document.querySelector("#waitlist").scrollIntoView({ block: "center" }),
  );
  const form = page.locator("#waitlist form").first();
  await form.locator("input[type=email]").fill("demo@example.com");
  await form.locator("button[type=submit]").click();
  await page.waitForTimeout(350); // mid-celebration
  const midParticles = await page
    .locator("#waitlist [role=status] span[aria-hidden]")
    .count();
  await page.screenshot({ path: `${SCRATCH}/fx-waitlist.png` });
  await page.waitForTimeout(1200);
  ok("success pill rendered", await page.locator("#waitlist [role=status]").isVisible());
  ok("burst particles fired mid-celebration", midParticles >= 8, `${midParticles} particles`);
  const leftover = await page
    .locator("#waitlist [role=status] span[aria-hidden]")
    .count();
  ok("burst particles cleaned themselves up", leftover === 0, `${leftover} left`);

  ok("no page errors", pageErrors.length === 0, pageErrors.join(" | "));
} finally {
  await browser.close();
  try {
    spawnSync("taskkill", ["/pid", String(srv.pid), "/T", "/F"], { shell: true });
  } catch {}
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
