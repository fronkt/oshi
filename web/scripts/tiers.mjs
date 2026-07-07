// Tier verification: mobile trim + tap focus, and reduced-motion CSS fallback.
import { chromium } from "playwright-core";

const SCRATCH = "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const browser = await chromium.launch({ executablePath: CHROME, headless: true });

// — mobile tier —
const mob = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  userAgent:
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
});
const mp = await mob.newPage();
mp.on("pageerror", (e) => console.log("MOBILE PAGEERROR:", String(e).slice(0, 200)));
await mp.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await mp.waitForTimeout(3500);
console.log(
  "mobile canvas:",
  await mp.evaluate(() => !!document.querySelector("#top canvas")),
  "| coarse:",
  await mp.evaluate(() => matchMedia("(pointer: coarse)").matches),
);
await mp.screenshot({ path: `${SCRATCH}/tier-mobile.png` });
await mp.tap("#top canvas", { position: { x: 300, y: 620 } }).catch(() => console.log("tap skipped"));
await mp.waitForTimeout(1100);
await mp.screenshot({ path: `${SCRATCH}/tier-mobile-tap.png` });
// page must still scroll vertically (touchAction pan-y)
await mp.evaluate(() => window.scrollTo({ top: 400 }));
await mp.waitForTimeout(400);
console.log("mobile scrollY:", await mp.evaluate(() => window.scrollY));
await mob.close();

// — reduced motion: CSS wall, no canvas —
const red = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "reduce",
});
const rp = await red.newPage();
await rp.goto("http://localhost:3001/", { waitUntil: "networkidle" });
await rp.waitForTimeout(2000);
console.log(
  "reduced-motion canvas (want false):",
  await rp.evaluate(() => !!document.querySelector("#top canvas")),
);
await rp.screenshot({ path: `${SCRATCH}/tier-reduced.png` });
await red.close();

await browser.close();
