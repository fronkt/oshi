// Premium-lift verification: cursor, reveals, spotlight, ripple, number-flow,
// sparkles, shine border, OG image, console health, fps.
import { chromium } from "playwright-core";
import { writeFileSync } from "node:fs";

const SCRATCH = "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "http://localhost:3001";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 220)}`));
page.on("console", (m) => {
  if (m.type() === "error") errors.push(`[console] ${m.text().slice(0, 220)}`);
});

await page.goto(BASE, { waitUntil: "networkidle" });
await page.waitForTimeout(3500);

// cursor present + hero reveal done
await page.mouse.move(400, 300, { steps: 8 });
await page.waitForTimeout(600);
console.log("cursor ring:", await page.evaluate(() => !!document.querySelector(".mf-cursor")));
console.log("cursor dot:", await page.evaluate(() => !!document.querySelector("#cursor-dot")));
console.log("h1 split into lines:", await page.evaluate(() => document.querySelectorAll("h1 .line, h1 div").length > 0));
await page.screenshot({ path: `${SCRATCH}/pl-hero.png` });

// bento spotlight
await page.evaluate(() => document.querySelector("#features")?.scrollIntoView({ behavior: "instant", block: "start" }));
await page.waitForTimeout(1500);
await page.mouse.move(500, 400, { steps: 6 });
await page.waitForTimeout(700);
await page.screenshot({ path: `${SCRATCH}/pl-bento.png` });

// showcase ripple (hover a cover inside the pinned strip)
await page.evaluate(() => document.querySelector("#showcase")?.scrollIntoView({ behavior: "instant", block: "start" }));
await page.waitForTimeout(1800);
console.log("ripple planes live:", await page.evaluate(() => document.querySelectorAll(".ripple-live").length));
await page.mouse.move(400, 500, { steps: 6 });
await page.waitForTimeout(800);
await page.screenshot({ path: `${SCRATCH}/pl-showcase.png` });

// compat: number-flow + sparkles
await page.evaluate(() => document.querySelector("#compat")?.scrollIntoView({ behavior: "instant", block: "center" }));
await page.waitForTimeout(2200);
console.log("number-flow mounted:", await page.evaluate(() => !!document.querySelector("#compat number-flow-react, #compat [data-flow], #compat number-flow")));
await page.screenshot({ path: `${SCRATCH}/pl-compat.png` });

// CTA: gradient + sparkles + shine
await page.evaluate(() => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "instant", block: "center" }));
await page.waitForTimeout(3000);
await page.screenshot({ path: `${SCRATCH}/pl-cta.png` });

// fps sample while moving mouse
const fps = await page.evaluate(
  () =>
    new Promise((res) => {
      let n = 0;
      const t0 = performance.now();
      const tick = () => {
        n++;
        performance.now() - t0 < 2000 ? requestAnimationFrame(tick) : res((n / (performance.now() - t0)) * 1000);
      };
      requestAnimationFrame(tick);
    }),
);
console.log("fps:", Math.round(fps));

// OG image
const og = await page.request.get(`${BASE}/opengraph-image`);
console.log("og status:", og.status(), og.headers()["content-type"]);
if (og.ok()) writeFileSync(`${SCRATCH}/pl-og.png`, await og.body());

console.log("CONSOLE ISSUES:", errors.length ? "\n" + errors.slice(0, 10).join("\n") : "none");
await browser.close();
