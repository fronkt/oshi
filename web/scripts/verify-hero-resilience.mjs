// verify-hero-resilience.mjs — prove a failed AniList cover can no longer
// take down the 3D hero (the bug Frank hit 2026-07-11):
//   case 1: block ONE cover URL  -> hero renders, that poster is dropped
//   case 2: block ALL cover URLs -> page still renders, headline legible
//
// "Could not load <cover>" page errors are EXPECTED noise: React 19 reports
// boundary-recovered errors via onRecoverableError/reportError, which CDP
// surfaces as pageerror even though CoverSafe caught them. The assertion is
// zero page errors of any OTHER kind (crash-class).
//
//   npm run build && node scripts/verify-hero-resilience.mjs
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
  /* ── case 1: one poisoned cover ───────────────────────────────────────── */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => {
      const msg = String(e);
      if (/Could not load .*anilist/.test(msg)) return; // recoverable, expected
      errors.push(msg.slice(0, 150));
    });
    const dropped = [];
    page.on("console", (m) => {
      if (m.text().includes("[hero3d] cover dropped")) dropped.push(m.text());
    });
    await page.route("**/bx154587-*.jpg", (r) => r.abort()); // Frieren, layer 0
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000); // textures + cross-fade
    ok("1 blocked cover: no crash-class page errors", errors.length === 0, errors.join(" | "));
    ok("1 blocked cover: canvas still alive", (await page.locator("canvas").count()) > 0);
    ok(
      "1 blocked cover: CoverSafe caught and dropped it",
      dropped.length > 0,
      "no '[hero3d] cover dropped' console warns",
    );
    ok("1 blocked cover: headline renders", await page.locator("h1").isVisible());
    await page.screenshot({ path: `${SCRATCH}/hero-one-blocked.png` });
    await page.close();
  }

  /* ── case 2: the whole CDN gone ───────────────────────────────────────── */
  {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => {
      const msg = String(e);
      if (/Could not load .*anilist/.test(msg)) return; // recoverable, expected
      errors.push(msg.slice(0, 150));
    });
    await page.route("**s4.anilist.co/**", (r) => r.abort());
    await page.goto(BASE, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);
    ok("CDN down: no crash-class page errors", errors.length === 0, errors.join(" | "));
    ok("CDN down: headline still renders", await page.locator("h1").isVisible());
    ok(
      "CDN down: waitlist form still usable",
      await page.locator("input[type=email]").first().isVisible(),
    );
    await page.screenshot({ path: `${SCRATCH}/hero-cdn-down.png` });
    await page.close();
  }
} finally {
  await browser.close();
  try {
    spawnSync("taskkill", ["/pid", String(srv.pid), "/T", "/F"], { shell: true });
  } catch {}
}

console.log(`\n=== ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
