// Probe: drive the dev site in real Chrome, capture console errors + section shots.
import { chromium } from "playwright-core";

const SCRATCH = "C:/Users/frank/AppData/Local/Temp/claude/C--Users-frank/05eee529-de72-46d8-8db6-b805590f3d20/scratchpad";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = process.argv[2] ?? "http://localhost:3001/";

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

const errors = [];
page.on("console", (m) => {
  if (m.type() === "error" || m.type() === "warning") errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`);
});
page.on("pageerror", (e) => errors.push(`[pageerror] ${String(e).slice(0, 300)}`));

await page.goto(URL, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
await page.screenshot({ path: `${SCRATCH}/pw-hero.png` });

// jump to CTA (instant, bypassing lenis animation)
await page.evaluate(() => document.querySelector("#waitlist")?.scrollIntoView({ behavior: "instant", block: "center" }));
await page.waitForTimeout(4000); // let lazy shadergradient mount + animate
await page.screenshot({ path: `${SCRATCH}/pw-cta.png` });

// zoom on the nav logo mark
await page.evaluate(() => window.scrollTo(0, 0));
await page.waitForTimeout(1200);
const logo = await page.locator("header a[aria-label='Oshi home']").boundingBox();
if (logo) await page.screenshot({ path: `${SCRATCH}/pw-logo.png`, clip: { x: logo.x - 10, y: logo.y - 10, width: 220, height: logo.height + 20 } });

console.log("CONSOLE ISSUES:", errors.length ? "\n" + errors.slice(0, 12).join("\n") : "none");
await browser.close();
